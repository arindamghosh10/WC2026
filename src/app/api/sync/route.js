// src/app/api/sync/route.js
// Called by the Python poller every 60 seconds
// Fetches live match data and stores it in Supabase

import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const API_KEY = process.env.FOOTBALL_API_KEY
const BASE_URL = 'https://api.football-data.org/v4'
const WC_ID = 2000  // football-data.org competition ID for FIFA World Cup

async function fetchFromAPI(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function GET(request) {
  try {
    // 1. Fetch all matches
    const matchData = await fetchFromAPI(`/competitions/${WC_ID}/matches`)

    const matches = matchData.matches.map(m => ({
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
      // Match events
      goals: (m.goals ?? []).map(g => ({
        minute: g.minute,
        injuryTime: g.injuryTime ?? null,
        type: g.type,                         // REGULAR, OWN_GOAL, PENALTY
        team_id: g.team?.id ?? null,
        team_name: g.team?.name ?? null,
        scorer_id: g.scorer?.id ?? null,
        scorer_name: g.scorer?.name ?? null,
        assist_id: g.assist?.id ?? null,
        assist_name: g.assist?.name ?? null,
      })),
      bookings: (m.bookings ?? []).map(b => ({
        minute: b.minute,
        card: b.card,                         // YELLOW_CARD, RED_CARD, YELLOW_RED_CARD
        team_id: b.team?.id ?? null,
        team_name: b.team?.name ?? null,
        player_id: b.player?.id ?? null,
        player_name: b.player?.name ?? null,
      })),
      substitutions: (m.substitutions ?? []).map(s => ({
        minute: s.minute,
        team_id: s.team?.id ?? null,
        player_in_name: s.playerIn?.name ?? null,
        player_out_name: s.playerOut?.name ?? null,
      })),
      updated_at: new Date().toISOString(),
    }))

    // 2. Upsert matches into Supabase (insert or update by id)
    const { error: matchError } = await getSupabaseAdmin()
      .from('matches')
      .upsert(matches, { onConflict: 'id' })

    if (matchError) throw matchError

    // 3. Fetch scorers (Golden Boot)
    const scorerData = await fetchFromAPI(`/competitions/${WC_ID}/scorers?limit=20`)

    const scorers = scorerData.scorers.map((s, idx) => ({
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

    const { error: scorerError } = await getSupabaseAdmin()
      .from('scorers')
      .upsert(scorers, { onConflict: 'player_id' })

    if (scorerError) throw scorerError

    // 4. Fetch standings
    const standingData = await fetchFromAPI(`/competitions/${WC_ID}/standings`)

    const standings = []
    for (const group of standingData.standings) {
      for (const entry of group.table) {
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

    const { error: standingError } = await getSupabaseAdmin()
      .from('standings')
      .upsert(standings, { onConflict: 'id' })

    if (standingError) throw standingError

    return NextResponse.json({
      success: true,
      synced: {
        matches: matches.length,
        scorers: scorers.length,
        standings: standings.length,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
