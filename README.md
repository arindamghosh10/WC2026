# 🏆 World Cup 2026 — Live Dashboard

Live scores, group standings, Golden Boot tracker and knockout bracket for FIFA World Cup 2026.

**Stack:** Next.js · Supabase · Python · football-data.org API · Vercel

---

## Project Structure

```
wc2026/
├── src/
│   ├── app/
│   │   ├── globals.css          ← Dark green theme + fonts
│   │   ├── layout.js            ← Root HTML layout + SEO metadata
│   │   ├── page.js              ← Main page, tab switcher
│   │   └── api/sync/route.js    ← API endpoint: fetches data, stores in Supabase
│   ├── components/
│   │   ├── Navbar.js            ← Top nav with tab buttons
│   │   ├── Hero.js              ← Live match hero + stat cards
│   │   ├── ScoresTab.js         ← Today's matches / live / all
│   │   ├── GroupsTab.js         ← All 12 group standings tables
│   │   ├── PlayersTab.js        ← Golden Boot top 20
│   │   └── BracketTab.js        ← Knockout bracket
│   └── lib/
│       └── supabase.js          ← Supabase client
├── python-poller/
│   ├── poller.py                ← Runs every 60s, triggers data sync
│   ├── requirements.txt
│   └── .env.example
├── supabase-schema.sql          ← Run this in Supabase SQL Editor
├── .env.local.example           ← Copy to .env.local and fill in keys
└── package.json
```

---

## Setup Guide

### Step 1 — Accounts you need (all free)
- [football-data.org](https://www.football-data.org/client/register) — API key
- [supabase.com](https://supabase.com) — database + realtime
- [vercel.com](https://vercel.com) — hosting
- [github.com](https://github.com) — code repository (you have this)

### Step 2 — Install tools
```bash
# Check Node.js
node --version   # should show v18 or v20

# Check Python
python --version  # should show 3.8+
```

### Step 3 — Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/wc2026.git
cd wc2026
npm install
```

### Step 4 — Set up Supabase
1. Go to supabase.com → New project
2. Project Settings → SQL Editor → New Query
3. Paste entire contents of `supabase-schema.sql` → Run
4. Project Settings → API → copy URL and anon key

### Step 5 — Get your football API key
1. Go to football-data.org → Register free account
2. Check your email for API key

### Step 6 — Configure environment
```bash
# Copy the example file
copy .env.local.example .env.local

# Open .env.local and fill in:
# FOOTBALL_API_KEY=your_key_here
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
# SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Step 7 — Run locally
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Python poller
cd python-poller
pip install -r requirements.txt
copy .env.example .env
# Edit .env: SITE_URL=http://localhost:3000
python poller.py
```

Open http://localhost:3000 — you should see the dashboard!

### Step 8 — Deploy to Vercel
```bash
npm install -g vercel
vercel

# Follow the prompts. When asked about environment variables,
# add the same keys from your .env.local
```

Your site will be live at `https://your-project.vercel.app`

---

## How it works

```
football-data.org API
      ↓ (Python poller calls every 60s)
/api/sync endpoint in Next.js
      ↓ (fetches matches, scorers, standings)
Supabase database
      ↓ (Supabase Realtime pushes changes)
Browser updates instantly
```

No page refresh needed. Data flows automatically.

---

## Portfolio notes for your CV

> "Built and deployed a live FIFA World Cup 2026 analytics dashboard — real-time scores, group standings, Golden Boot tracker and knockout bracket — using Next.js 14 (App Router), Python polling pipeline, Supabase Realtime, and football-data.org REST API. Hosted on Vercel with automatic deployments from GitHub."
