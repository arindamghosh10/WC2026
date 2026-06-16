'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MatchModal, { TeamEvents } from '@/components/MatchModal'

function LiveMatchCard({ match, onClick }) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isFinished = match.status === 'FINISHED'
  const hasEvents = (match.goals ?? []).length > 0 || (match.bookings ?? []).length > 0

  const homeScore = match.home_score ?? '-'
  const awayScore = match.away_score ?? '-'

  return (
    <div
      className="glass fade-in"
      onClick={onClick}
      style={{ padding: '1rem 1.25rem', marginBottom: 8, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Home team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {match.home_team_crest && (
            <img src={match.home_team_crest} alt="" width={32} height={32}
              style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.1)', objectFit: 'contain', padding: 2 }} />
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{match.home_team_name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{match.group ?? match.stage}</div>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', padding: '0 1rem' }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Oswald, sans-serif', color: '#fff', lineHeight: 1 }}>
            {homeScore} – {awayScore}
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: isLive ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
            {isLive ? `${match.minute ?? ''}' LIVE` : isFinished ? 'FT' : 'Upcoming'}
          </div>
        </div>

        {/* Away team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse', textAlign: 'right' }}>
          {match.away_team_crest && (
            <img src={match.away_team_crest} alt="" width={32} height={32}
              style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.1)', objectFit: 'contain', padding: 2 }} />
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{match.away_team_name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{match.venue ?? ''}</div>
          </div>
        </div>
      </div>

      {/* Inline events */}
      {hasEvents && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 8,
          paddingTop: 8, marginTop: 8,
          borderTop: '0.5px solid rgba(255,255,255,0.07)',
        }}>
          <TeamEvents match={match} side="home" />
          <TeamEvents match={match} side="away" />
        </div>
      )}

      {/* click hint */}
      <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 6 }}>
        tap for match stats
      </div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '0.5px solid rgba(255,255,255,0.10)',
      borderRadius: 10,
      padding: '0.75rem 1rem',
      textAlign: 'center',
      flex: 1,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Oswald, sans-serif', color: '#6fcf97' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function Hero() {
  const [liveMatches, setLiveMatches] = useState([])
  const [todayMatches, setTodayMatches] = useState([])
  const [stats, setStats] = useState({ matches: 0, goals: 0, teams: 48, days: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchData()

    // Realtime subscription — updates instantly when poller writes new data
    const channel = supabase
      .channel('matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchData()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchData() {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const endOfDay = `${todayStr}T23:59:59Z`
    const startOfDay = `${todayStr}T00:00:00Z`

    // Live matches
    const { data: live } = await supabase
      .from('matches')
      .select('*')
      .in('status', ['IN_PLAY', 'PAUSED'])
      .order('utc_date', { ascending: true })

    setLiveMatches(live ?? [])

    // Today's matches
    const { data: today_m } = await supabase
      .from('matches')
      .select('*')
      .gte('utc_date', startOfDay)
      .lte('utc_date', endOfDay)
      .order('utc_date', { ascending: true })

    setTodayMatches(today_m ?? [])

    // Stats
    const { data: allMatches } = await supabase
      .from('matches')
      .select('home_score, away_score, status')

    const finished = allMatches?.filter(m => m.status === 'FINISHED') ?? []
    const totalGoals = finished.reduce((sum, m) => sum + (m.home_score ?? 0) + (m.away_score ?? 0), 0)

    // Days until final (July 19 2026)
    const final = new Date('2026-07-19')
    const daysLeft = Math.max(0, Math.ceil((final - new Date()) / (1000 * 60 * 60 * 24)))

    setStats({ matches: finished.length, goals: totalGoals, teams: 48, days: daysLeft })
    setLoading(false)
  }

  const displayMatches = liveMatches.length > 0 ? liveMatches : todayMatches.slice(0, 2)

  return (
    <section style={{
      background: 'linear-gradient(180deg, #0a2e14 0%, #061a0d 100%)',
      borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      padding: '2rem 1rem 1.5rem',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5,
            }}>
              <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              LIVE
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Auto-updates every 60 seconds</span>
          </div>
          <h1 style={{
            fontFamily: 'Oswald, sans-serif', fontSize: 28, fontWeight: 700,
            color: '#fff', margin: 0, lineHeight: 1.1,
          }}>
            FIFA World Cup 2026™
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6 }}>
            USA · Canada · Mexico &nbsp;·&nbsp; Jun 11 – Jul 19
          </p>
        </div>

        {/* Live / Today matches */}
        <div style={{ marginBottom: '1.5rem' }}>
          {loading ? (
            <div className="shimmer" style={{ height: 80, marginBottom: 8 }} />
          ) : displayMatches.length > 0 ? (
            displayMatches.map(m => <LiveMatchCard key={m.id} match={m} onClick={() => setSelected(m)} />)
          ) : (
            <div className="glass" style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              No matches today — check the schedule below
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 8 }}>
          <StatCard value="48" label="Teams" />
          <StatCard value="104" label="Matches" />
          <StatCard value={loading ? '—' : stats.goals} label="Goals scored" />
          <StatCard value={loading ? '—' : `${stats.days}d`} label="Until final" />
        </div>
      </div>

      {/* Match modal */}
      {selected && <MatchModal match={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
