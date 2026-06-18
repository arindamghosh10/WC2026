// src/app/api/sync/route.js
// Called by the Python poller — pulls fixtures, standings and top scorers
// from football-data.org's free tier and stores them in Supabase.
//
// WHY football-data.org (not API-Football):
//   API-Football's FREE plan only covers seasons 2022-2024 — it explicitly
//   rejects season=2026, so World Cup 2026 data is unreachable on their
//   free tier no matter how the request is shaped. football-data.org's
//   free tier does include the World Cup 2026 competition.
//
// WHAT THIS MEANS FOR FEATURES:
//   - Fixtures, live status, scores, standings, Golden Boot  -> all work
//   - Goal scorer names, cards, substitutions per match      -> NOT available
//     on any reliable free source right now. The `goals`, `bookings`, and
//     `substitutions` columns stay in the schema and the UI (MatchModal,
//     ScoresTab) already renders gracefully when they're empty — nothing
//     breaks, those sections just don't show. If you later add a paid
//     source (API-Football Pro, Sportmonks, TheStatsAPI), wire it into the
//     `events` block below and these UI pieces will light up automatically.

import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Force this route to be evaluated only at request time, never during
// the build's static page collection — it depends on live env vars and
// external API calls, neither of which should run at build time.
export const dynamic = 'force-dynamic'

const API_KEY = process.env.FOOTBALL_API_KEY
const BASE_URL = 'https://api.football-data.org/v4'
const WC_ID = 2000  // football-data.org competition ID for FIFA World Cup

async function fetchFromAPI(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`football-data.org error (${res.status}): ${body}`)
  }
  return res.json()
}

export async function GET() {
  const admin = getSupabaseAdmin()
  const result = {}

  try {
    // ── 1. Fixtures (scores, status, schedule) ──
    const matchData = await fetchFromAPI(`/competitions/${WC_ID}/matches`)

    const matches = (matchData.matches ?? []).map(m => ({
      id: m.id,
      status: m.status,
      stage: m.stage,
      group: m.group,
      matchday: m.matchday,
      utc_date: m.utcDate,
      home_team_id: m.homeTeam.id,
      home_team_name: m.homeTeam.name,
      home_team_crest: m.homeTeam.crest,
      away_team_id: m.awayTeam.id,
      away_team_name: m.awayTeam.name,
      away_team_crest: m.awayTeam.crest,
      home_score: m.score?.fullTime?.home ?? null,
      away_score: m.score?.fullTime?.away ?? null,
      home_score_ht: m.score?.halfTime?.home ?? null,
      away_score_ht: m.score?.halfTime?.away ?? null,
      winner: m.score?.winner ?? null,
      minute: m.minute ?? null,
      venue: m.venue ?? null,
      referees: m.referees?.map(r => r.name).join(', ') ?? null,
      // Event data not available on any reliable free source for 2026 —
      // left as empty arrays so the UI's existing graceful-empty handling
      // applies cleanly (TeamEvents returns null when these are empty).
      goals: [],
      bookings: [],
      substitutions: [],
      updated_at: new Date().toISOString(),
    }))

    const { error: matchError } = await admin.from('matches').upsert(matches, { onConflict: 'id' })
    if (matchError) throw matchError
    result.matches = matches.length

    // ── 2. Scorers (Golden Boot) ──
    const scorerData = await fetchFromAPI(`/competitions/${WC_ID}/scorers?limit=20`)

    const scorers = (scorerData.scorers ?? []).map((s, idx) => ({
      player_id: s.player.id,
      player_name: s.player.name,
      nationality: s.player.nationality,
      team_id: s.team.id,
      team_name: s.team.name,
      team_crest: s.team.crest,
      goals: s.goals,
      assists: s.assists ?? 0,
      penalties: s.penalties ?? 0,
      rank: idx + 1,
      updated_at: new Date().toISOString(),
    }))

    if (scorers.length > 0) {
      const { error: scorerError } = await admin.from('scorers').upsert(scorers, { onConflict: 'player_id' })
      if (scorerError) throw scorerError
    }
    result.scorers = scorers.length

    // ── 3. Standings ──
    const standingData = await fetchFromAPI(`/competitions/${WC_ID}/standings`)

    const standings = []
    for (const group of standingData.standings ?? []) {
      for (const entry of group.table ?? []) {
        standings.push({
          id: `${group.group}_${entry.team.id}`,
          group_name: group.group,
          position: entry.position,
          team_id: entry.team.id,
          team_name: entry.team.name,
          team_crest: entry.team.crest,
          played: entry.playedGames,
          won: entry.won,
          draw: entry.draw,
          lost: entry.lost,
          goals_for: entry.goalsFor,
          goals_against: entry.goalsAgainst,
          goal_diff: entry.goalDifference,
          points: entry.points,
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (standings.length > 0) {
      const { error: standingError } = await admin.from('standings').upsert(standings, { onConflict: 'id' })
      if (standingError) throw standingError
    }
    result.standings = standings.length

    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() })

  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ success: false, error: err.message, ...result }, { status: 500 })
  }
}