#!/usr/bin/env python3
"""
DEX v2.0 — Company Intelligence Scraper
Scrapes AmbitionBox, company websites, and uses Gemini to generate
comprehensive interview intel for any company.

Usage:
    python3 company_intel_scraper.py "Razorpay"
    python3 company_intel_scraper.py "Infosys"

Requirements:
    pip install -r requirements.txt

Environment variables (in .env.local):
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    GEMINI_API_KEY
    SCRAPE_DO_TOKEN  (optional — register free at scrape.do)
"""

import os
import sys
import re
import json
import time
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env.local"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("intel_scraper")

# ─── Config ─────────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SCRAPE_DO_TOKEN = os.getenv("SCRAPE_DO_TOKEN", "")

MAX_RETRIES = 3
RETRY_DELAY = 2
CACHE_TTL_HOURS = 24

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


# ─── Supabase Cache ──────────────────────────────────────────────────────────

def check_cache(company_name: str) -> Optional[dict]:
    """Return cached intel if it exists and is less than CACHE_TTL_HOURS old."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/dex_company_intel",
            params={"company_name": f"ilike.{company_name}", "select": "*"},
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            timeout=10,
        )
        if resp.ok and resp.json():
            row = resp.json()[0]
            last_scraped = datetime.fromisoformat(row["last_scraped"].replace("Z", "+00:00"))
            age_hours = (datetime.now(last_scraped.tzinfo) - last_scraped).total_seconds() / 3600
            if age_hours < CACHE_TTL_HOURS and row.get("cache_valid"):
                log.info(f"Cache HIT for {company_name} ({age_hours:.1f}h old)")
                return row
    except Exception as e:
        log.warning(f"Cache check failed: {e}")
    return None


def save_to_supabase(company_name: str, intel: dict) -> bool:
    """Upsert intel to Supabase dex_company_intel table."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.warning("Supabase not configured — skipping save")
        return False
    try:
        payload = {
            "company_name": company_name,
            **intel,
            "last_scraped": datetime.utcnow().isoformat(),
            "cache_valid": True,
        }
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/dex_company_intel",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            json=payload,
            timeout=15,
        )
        if resp.ok:
            log.info(f"✓ Saved intel for {company_name} to Supabase")
            return True
        else:
            log.error(f"Supabase save error: {resp.status_code} — {resp.text[:200]}")
    except Exception as e:
        log.error(f"Supabase save exception: {e}")
    return False


# ─── Step 1: AmbitionBox Scraper ─────────────────────────────────────────────

def scrape_ambitionbox(company_name: str) -> str:
    """Scrape interview questions and info from AmbitionBox."""
    slug = company_name.lower().replace(" ", "-").replace(".", "").replace(",", "")
    url = f"https://www.ambitionbox.com/interviews/{slug}-interview-questions"
    log.info(f"Scraping AmbitionBox: {url}")

    raw_data = []
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.ok:
                soup = BeautifulSoup(resp.text, "html.parser")

                # Extract interview questions
                questions = soup.find_all("div", class_=re.compile(r"interview-question|question-text", re.I))
                if not questions:
                    questions = soup.find_all(["h3", "h4"], class_=re.compile(r"quest|ques", re.I))

                for q in questions[:15]:
                    text = q.get_text(strip=True)
                    if len(text) > 20:
                        raw_data.append(f"Interview Question: {text}")

                # Extract salary info
                salary_divs = soup.find_all(string=re.compile(r"salary|lpa|lakh", re.I))
                for s in salary_divs[:3]:
                    raw_data.append(f"Salary info: {s.strip()}")

                # Extract review/rating
                rating_el = soup.find(class_=re.compile(r"rating|score", re.I))
                if rating_el:
                    raw_data.append(f"Rating: {rating_el.get_text(strip=True)}")

                log.info(f"AmbitionBox: {len(raw_data)} data points extracted")
                break
        except Exception as e:
            log.warning(f"AmbitionBox attempt {attempt} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)

    return "\n".join(raw_data) if raw_data else f"No AmbitionBox data found for {company_name}."


# ─── Step 2: Company Website Scraper ─────────────────────────────────────────

def scrape_company_website(company_name: str) -> str:
    """Scrape company website for tech stack and product info."""
    # Try common URL patterns
    slug = company_name.lower().replace(" ", "")
    urls_to_try = [
        f"https://www.{slug}.com/about",
        f"https://www.{slug}.com/careers",
        f"https://www.{slug}.in/about",
        f"https://{slug}.com",
    ]

    for url in urls_to_try:
        try:
            # If scrape.do token is available, use it for JS-heavy sites
            if SCRAPE_DO_TOKEN:
                scrape_url = f"https://api.scrape.do?token={SCRAPE_DO_TOKEN}&url={url}&render=true"
            else:
                scrape_url = url

            resp = requests.get(scrape_url, headers=HEADERS, timeout=12)
            if resp.ok and len(resp.text) > 500:
                soup = BeautifulSoup(resp.text, "html.parser")

                # Remove scripts and styles
                for tag in soup(["script", "style", "nav", "footer"]):
                    tag.decompose()

                text = soup.get_text(separator=" ", strip=True)
                # Truncate to 2000 chars
                text = text[:2000]

                log.info(f"Company website scraped: {url}")
                return f"Company website ({url}): {text}"
        except Exception as e:
            log.debug(f"Could not scrape {url}: {e}")

    return f"Could not scrape {company_name}'s website."


# ─── Step 3: Glassdoor (Simple public scrape) ─────────────────────────────

def scrape_glassdoor(company_name: str) -> str:
    """Try to get Glassdoor rating and basic info."""
    search_url = f"https://www.glassdoor.co.in/Reviews/{company_name.replace(' ', '-')}-Reviews-E.htm"
    log.info(f"Checking Glassdoor for {company_name}")

    try:
        resp = requests.get(search_url, headers=HEADERS, timeout=12)
        if resp.ok:
            soup = BeautifulSoup(resp.text, "html.parser")
            text = soup.get_text(separator=" ", strip=True)[:1500]
            return f"Glassdoor data: {text}"
    except Exception as e:
        log.debug(f"Glassdoor scrape failed: {e}")

    return f"Glassdoor: No data available for {company_name}"


# ─── Step 4: Gemini Final Analysis ──────────────────────────────────────────

def analyse_with_gemini(company_name: str, raw_data: str) -> Optional[dict]:
    """Send all scraped data to Gemini for final structured analysis."""
    if not GEMINI_API_KEY:
        log.error("GEMINI_API_KEY not set")
        return None

    prompt = f"""You are a placement coach for Pranav Gawai, a final-year CSE
student from Pune specialising in Go, Next.js 14, TypeScript, Supabase,
Python, REST APIs, backend development. He has strong DSA skills (LeetCode
200+ problems) and has built projects like DEX (personal developer OS).

Here is raw data about {company_name}:
{raw_data[:5000]}

Return ONLY a valid JSON object with these exact keys (no markdown, no extra text):
{{
  "overview": {{"name": "str", "industry": "str", "founded": "str", "hq": "str", "employees": "str", "products": "2 sentence description"}},
  "tech_stack": ["up to 10 technologies"],
  "top_skills": ["top 5 skills they look for"],
  "interview_qs": [{{"question": "str", "difficulty": "Easy|Medium|Hard", "role": "str"}}],
  "interview_process": "step-by-step description",
  "glassdoor_rating": 4.1,
  "culture_summary": "2 sentence summary",
  "salary_range": "₹X - ₹Y LPA for fresher SDE",
  "why_company_ans": "genuine 3-sentence answer to Why {company_name}? personalised for Pranav",
  "tell_me_about": "60-second Tell me about yourself tailored for {company_name}",
  "fit_score": 75,
  "fit_highlights": ["top 3 things to highlight"],
  "fit_gaps": ["top 2 things to prepare"]
}}"""

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"},
                },
                timeout=30,
            )
            if resp.ok:
                raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(raw_text)
            else:
                log.warning(f"Gemini attempt {attempt} error: {resp.status_code}")
        except Exception as e:
            log.warning(f"Gemini attempt {attempt} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)

    return None


# ─── Main ───────────────────────────────────────────────────────────────────

def main(company_name: str):
    log.info(f"=== Company Intel Scraper: {company_name} ===")
    start = time.time()

    # Check Supabase cache first
    cached = check_cache(company_name)
    if cached:
        log.info(f"Returning cached intel (saved {abs((datetime.now() - datetime.fromisoformat(cached['last_scraped'].replace('Z', ''))).seconds // 3600)}h ago)")
        print(json.dumps(cached, indent=2, default=str))
        return

    # Run all scrapers in parallel threads (simulated with sequential calls)
    # For true parallel, use asyncio or concurrent.futures
    log.info("Step 1/3: Scraping AmbitionBox...")
    ambitionbox_data = scrape_ambitionbox(company_name)

    log.info("Step 2/3: Scraping company website...")
    website_data = scrape_company_website(company_name)

    log.info("Step 3/3: Analysing with Gemini AI...")
    all_raw_data = f"{ambitionbox_data}\n\n{website_data}"
    intel = analyse_with_gemini(company_name, all_raw_data)

    if not intel:
        log.error("Failed to generate intel — all sources failed")
        sys.exit(1)

    # Save to Supabase
    save_to_supabase(company_name, intel)

    elapsed = time.time() - start
    log.info(f"=== Done in {elapsed:.1f}s ===")
    print(json.dumps(intel, indent=2, default=str))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 company_intel_scraper.py <company_name>")
        print('Example: python3 company_intel_scraper.py "Razorpay"')
        sys.exit(1)

    company = " ".join(sys.argv[1:])
    main(company)
