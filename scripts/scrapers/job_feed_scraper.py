#!/usr/bin/env python3
"""
DEX v2.0 — Job Feed Scraper
Uses JobSpy to scrape LinkedIn, Indeed, Glassdoor, Naukri simultaneously.
Scores each job with Gemini AI and upserts to Supabase dex_jobs table.

Usage:
    python3 job_feed_scraper.py

Requirements:
    pip install -r requirements.txt

Environment variables (in .env or system):
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    GEMINI_API_KEY
"""

import os
import sys
import time
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env.local"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("job_scraper")

# ─── Config ────────────────────────────────────────────────────────────────

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SEARCH_QUERIES = [
    "software engineer",
    "backend developer",
    "golang developer",
    "full stack developer nextjs",
    "sde intern 2025",
]

LOCATIONS = ["Pune, India", "Bengaluru, India", ""]  # empty = remote/all

MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


# ─── Gemini Scorer ──────────────────────────────────────────────────────────

def score_job_with_gemini(title: str, description: str) -> int:
    """Score a job 0-100 for Pranav's profile using Gemini Flash."""
    if not GEMINI_API_KEY:
        log.warning("GEMINI_API_KEY not set — using default score 50")
        return 50

    prompt = (
        "Rate 0-100 how well this job matches a final-year CSE student "
        "skilled in Go, Next.js 14, TypeScript, Supabase, Python, REST APIs, "
        "DSA, backend development, PostgreSQL. Higher score = better match.\n"
        f"Job title: {title}\n"
        f"Description (first 800 chars): {description[:800]}\n"
        "Return ONLY a number between 0 and 100. No other text."
    )

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=15,
            )
            if resp.ok:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                score = int("".join(c for c in text if c.isdigit())[:3])
                return max(0, min(100, score))
        except Exception as e:
            log.warning(f"Gemini score attempt {attempt} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)

    return 50  # fallback


# ─── Supabase Helpers ───────────────────────────────────────────────────────

def get_existing_urls() -> set:
    """Fetch all existing job URLs from Supabase to avoid duplicates."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/dex_jobs?select=url",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
            },
            timeout=10,
        )
        if resp.ok:
            return {row["url"] for row in resp.json() if row.get("url")}
    except Exception as e:
        log.error(f"Failed to fetch existing URLs: {e}")
    return set()


def upsert_jobs(jobs: list[dict]) -> int:
    """Upsert jobs to Supabase. Returns count of successfully upserted rows."""
    if not jobs or not SUPABASE_URL or not SUPABASE_KEY:
        return 0

    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/dex_jobs",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            json=jobs,
            timeout=30,
        )
        if resp.ok:
            return len(jobs)
        else:
            log.error(f"Supabase upsert error: {resp.status_code} — {resp.text[:200]}")
    except Exception as e:
        log.error(f"Supabase upsert exception: {e}")
    return 0


# ─── Main Scraper ───────────────────────────────────────────────────────────

def scrape_jobs():
    """Main scraping pipeline."""
    log.info("=== DEX Job Scraper Starting ===")

    # Import jobspy here so the module can load without it if not installed
    try:
        from jobspy import scrape_jobs as jobspy_scrape
    except ImportError:
        log.error("python-jobspy not installed. Run: pip install python-jobspy")
        sys.exit(1)

    existing_urls = get_existing_urls()
    log.info(f"Found {len(existing_urls)} existing job URLs in Supabase")

    cutoff = datetime.utcnow() - timedelta(hours=24)
    all_new_jobs = []

    for query in SEARCH_QUERIES:
        for location in LOCATIONS[:2]:  # Only Pune + Bengaluru for speed
            log.info(f"Scraping: '{query}' in '{location or 'remote'}'")
            try:
                # Retry scraping
                for attempt in range(1, MAX_RETRIES + 1):
                    try:
                        jobs_df = jobspy_scrape(
                            site_name=["linkedin", "indeed", "glassdoor"],
                            search_term=query,
                            location=location or None,
                            results_wanted=20,
                            hours_old=24,
                            country_indeed="India",
                        )
                        break
                    except Exception as e:
                        log.warning(f"Scrape attempt {attempt} failed: {e}")
                        if attempt < MAX_RETRIES:
                            time.sleep(RETRY_DELAY * attempt)
                        else:
                            jobs_df = None

                if jobs_df is None or jobs_df.empty:
                    log.info(f"No jobs found for '{query}'")
                    continue

                log.info(f"Found {len(jobs_df)} raw jobs for '{query}'")

                for _, row in jobs_df.iterrows():
                    def safe_str(val):
                        if val is None: return None
                        s = str(val).strip()
                        if s.lower() in ('nan', 'nat', 'none', ''): return None
                        return s

                    job_url = safe_str(row.get("job_url")) or safe_str(row.get("url"))
                    if not job_url or job_url in existing_urls:
                        continue

                    title = safe_str(row.get("title")) or "Unknown Title"
                    company = safe_str(row.get("company")) or "Unknown Company"
                    description = safe_str(row.get("description"))
                    location_str = safe_str(row.get("location"))

                    # Score with Gemini (rate limit: add small delay)
                    time.sleep(0.3)
                    match_score = score_job_with_gemini(title, description or "")

                    # Parse posted_at
                    posted_raw = safe_str(row.get("date_posted")) or safe_str(row.get("posted_at"))
                    posted_at = posted_raw if posted_raw else None

                    # Map job_type
                    job_type_raw = safe_str(row.get("job_type")).lower() if safe_str(row.get("job_type")) else ""
                    if "remote" in job_type_raw:
                        job_type = "remote"
                    elif "hybrid" in job_type_raw:
                        job_type = "hybrid"
                    else:
                        job_type = "onsite"

                    new_job = {
                        "title": title,
                        "company": company,
                        "location": location_str or location or None,
                        "job_type": job_type,
                        "source": safe_str(row.get("site")).lower() if safe_str(row.get("site")) else "unknown",
                        "url": job_url,
                        "description": description[:2000] if description else None,
                        "posted_at": posted_at,
                        "match_score": match_score,
                        "is_saved": False,
                        "is_hidden": False,
                        "scraped_at": datetime.now().isoformat(),
                    }

                    all_new_jobs.append(new_job)
                    existing_urls.add(job_url)
                    log.info(f"  ✓ {company} — {title} ({match_score}% match)")

                    # Progressive save
                    if len(all_new_jobs) >= 10:
                        saved = upsert_jobs(all_new_jobs)
                        log.info(f"  ➔ Batch saved {saved} jobs to Supabase.")
                        all_new_jobs.clear()

            except Exception as e:
                log.error(f"Error scraping '{query}': {e}")

    # Final batch upsert
    if all_new_jobs:
        log.info(f"\nUpserting final {len(all_new_jobs)} jobs to Supabase...")
        saved = upsert_jobs(all_new_jobs)
        log.info(f"=== Done! Saved final {saved} to Supabase. ===")
    else:
        log.info("=== Done! ===")


if __name__ == "__main__":
    scrape_jobs()
