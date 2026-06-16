"""
World Cup 2026 — Data Poller
============================
Run this on your local machine or any server.
It calls your Next.js /api/sync endpoint every 60 seconds,
which fetches fresh data from football-data.org and stores it in Supabase.

Usage:
  1. pip install requests python-dotenv
  2. Create a .env file in this folder (copy from .env.example)
  3. python poller.py

The script runs forever until you press Ctrl+C.
"""

import time
import requests
import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────
SITE_URL = os.getenv('SITE_URL', 'http://localhost:3000')
SYNC_ENDPOINT = f"{SITE_URL}/api/sync"
POLL_INTERVAL = 60  # seconds between each sync

# Only poll more frequently during live matches
LIVE_INTERVAL = 30   # 30s when a match is in play
IDLE_INTERVAL = 300  # 5 min when no live matches

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
log = logging.getLogger(__name__)

# ── Main poller ───────────────────────────────────────────
def sync():
    """Call the sync endpoint and return the response."""
    try:
        resp = requests.get(SYNC_ENDPOINT, timeout=30)
        data = resp.json()

        if data.get('success'):
            synced = data.get('synced', {})
            log.info(
                f"✅ Synced — matches: {synced.get('matches', 0)}, "
                f"scorers: {synced.get('scorers', 0)}, "
                f"standings: {synced.get('standings', 0)}"
            )
            return data
        else:
            log.error(f"❌ Sync failed: {data.get('error')}")
            return None

    except requests.exceptions.ConnectionError:
        log.error(f"❌ Cannot connect to {SYNC_ENDPOINT}. Is your Next.js app running?")
        return None
    except Exception as e:
        log.error(f"❌ Unexpected error: {e}")
        return None


def has_live_match(data):
    """Check if the API response indicates any live matches."""
    if not data:
        return False
    # If the API returns live match info, adjust polling speed
    # For now we use a simple time-based heuristic
    hour = datetime.utcnow().hour
    # World Cup matches typically run 14:00–23:00 UTC
    return 13 <= hour <= 23


def main():
    log.info(f"🏆 World Cup 2026 Poller started")
    log.info(f"📡 Syncing to: {SYNC_ENDPOINT}")
    log.info(f"⏱️  Default interval: {POLL_INTERVAL}s")
    log.info("Press Ctrl+C to stop\n")

    while True:
        data = sync()

        # Adjust interval based on whether matches are live
        if has_live_match(data):
            interval = LIVE_INTERVAL
            log.info(f"🔴 Live match detected — polling every {interval}s")
        else:
            interval = IDLE_INTERVAL
            log.info(f"💤 No live matches — polling every {interval}s")

        time.sleep(interval)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log.info("\n👋 Poller stopped")
