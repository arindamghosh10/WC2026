"""
World Cup 2026 — Data Poller
============================
Calls your Next.js /api/sync endpoint on a schedule. The endpoint fetches
fixtures, standings, and Golden Boot scorers from football-data.org and
stores them in Supabase.

football-data.org free tier allows 10 requests/minute, so this is far
more generous than the API-Football budget situation we previously
designed around. No daily budget tracking needed — a simple interval
is enough, just don't go below a few seconds between calls.

Polling strategy:
  - LIVE_INTERVAL when any match is likely in progress (kept simple via
    a time-of-day heuristic, since football-data.org's free tier doesn't
    expose a "live" flag cheaply enough to check every loop)
  - IDLE_INTERVAL otherwise, to be polite to the API and avoid wasted calls

Usage:
  1. pip install requests python-dotenv
  2. Create a .env file in this folder (copy from .env.example)
  3. python poller.py
"""

import time
import requests
import os
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────
SITE_URL = os.getenv('SITE_URL', 'http://localhost:3000')
SYNC_ENDPOINT = f"{SITE_URL}/api/sync"

LIVE_INTERVAL = 60          # 60s during likely match windows
IDLE_INTERVAL = 10 * 60     # 10 min otherwise

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
log = logging.getLogger(__name__)


def sync():
    """Call the sync endpoint and return the response."""
    try:
        resp = requests.get(SYNC_ENDPOINT, timeout=30)
        data = resp.json()

        if data.get('success'):
            log.info(
                f"✅ Synced — matches: {data.get('matches', 0)}, "
                f"scorers: {data.get('scorers', 0)}, "
                f"standings: {data.get('standings', 0)}"
            )
        else:
            log.error(f"❌ Sync failed: {data.get('error')}")

        return data

    except requests.exceptions.ConnectionError:
        log.error(f"❌ Cannot connect to {SYNC_ENDPOINT}. Is your Next.js app running?")
        return None
    except Exception as e:
        log.error(f"❌ Unexpected error: {e}")
        return None


def likely_live_window():
    """Rough heuristic: World Cup matches typically run 14:00-23:00 UTC."""
    hour = datetime.now(timezone.utc).hour
    return 13 <= hour <= 23


def main():
    log.info("🏆 World Cup 2026 Poller started (football-data.org)")
    log.info(f"📡 Syncing to: {SYNC_ENDPOINT}")
    log.info("Press Ctrl+C to stop\n")

    while True:
        sync()

        if likely_live_window():
            interval = LIVE_INTERVAL
            log.info(f"🔴 Likely match window — next sync in {interval}s")
        else:
            interval = IDLE_INTERVAL
            log.info(f"💤 Idle window — next sync in {interval // 60} min")

        time.sleep(interval)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log.info("\n👋 Poller stopped")