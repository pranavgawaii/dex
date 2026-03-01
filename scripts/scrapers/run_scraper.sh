#!/usr/bin/env bash
# ============================================================
#   DEX Scraper Runner
#   Usage:
#     ./run_scraper.sh jobs           — scrape job feed
#     ./run_scraper.sh intel Razorpay — get company intel
#     ./run_scraper.sh intel TCS
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/.venv"

# Activate venv
if [ ! -d "$VENV" ]; then
    echo "❌ Virtual env not found. Run setup first:"
    echo "   cd scripts/scrapers && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

source "$VENV/bin/activate"

CMD="$1"
shift

case "$CMD" in
    jobs)
        echo "🚀 Running DEX Job Feed Scraper..."
        python3 "$SCRIPT_DIR/job_feed_scraper.py" "$@"
        ;;
    intel)
        if [ -z "$1" ]; then
            echo "Usage: ./run_scraper.sh intel <CompanyName>"
            echo "Example: ./run_scraper.sh intel Razorpay"
            exit 1
        fi
        echo "🏢 Running Company Intel Scraper for: $@"
        python3 "$SCRIPT_DIR/company_intel_scraper.py" "$@"
        ;;
    test)
        echo "🧪 Testing Python environment..."
        python3 -c "
import requests, bs4, playwright, google.generativeai, supabase, dotenv
print('✅ All imports OK')
import jobspy
print('✅ python-jobspy OK')
print('✅ Environment ready!')
"
        ;;
    *)
        echo "DEX Scraper Runner"
        echo "  Usage:"
        echo "    ./run_scraper.sh jobs            — scrape latest jobs"
        echo "    ./run_scraper.sh intel <Company> — get company intel"
        echo "    ./run_scraper.sh test            — check environment"
        ;;
esac
