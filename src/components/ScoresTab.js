'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MatchModal, { TeamEvents } from '@/components/MatchModal'

const STATUS_LABEL = {
  SCHEDULED: 'Upcoming',
  TIMED: 'Upcoming',
  IN_PLAY: 'LIVE',
  PAUSED: 'HT',
  FINISHED: 'FT',
  SUSPENDED: 'Susp.',
  POSTPONED: 'PPD',
}

function MatchRow({ match, onClick }) {
  const isLive     = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isFinished = match.status === 'FINISHED'
  const isUpcoming = !isLive && !isFinished

  const kickoff = new Date(match.utc_date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  })

  const hasEvents = (match.goals ?? []).length > 0 || (match.bookings ?? []).length > 0

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `0.5px solid ${isLive ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        padding: hasEvents ? '0.85rem 1rem 0.6rem' : '0.85rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transition: 'background 0.2s, border-color 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    >
      {/* ── Main Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Home team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {match.home_team_crest ? (
            <img src={match.home_team_crest} alt="" width={24} height={24}
              style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: 2 }} />
          ) : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />}
          <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{match.home_team_name}</span>
        </div>

        {/* Score / time */}
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          {isUpcoming ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{kickoff}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>IST</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Oswald, sans-serif', color: '#fff' }}>
                {match.home_score ?? 0} – {match.away_score ?? 0}
              </div>
              <div style={{ fontSize: 10, marginTop: 2, fontWeight: 600, color: isLive ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                {isLive ? `${match.minute ?? ''}' ${STATUS_LABEL[match.status]}` : STATUS_LABEL[match.status]}
              </div>
            </div>
          )}
        </div>

        {/* Away team */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexDirection: 'row-reverse', textAlign: 'right' }}>
          {match.away_team_crest ? (
            <img src={match.away_team_crest} alt="" width={24} height={24}
              style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: 2 }} />
          ) : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />}
          <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{match.away_team_name}</span>
        </div>
      </div>

      {/* ── Inline Events (goals + cards) ── */}
      {hasEvents && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          paddingTop: 6,
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <TeamEvents match={match} side="home" />
          <TeamEvents match={match} side="away" />
        </div>
      )}

      {/* Click hint */}
      {(isLive || isFinished) && (
        <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: -2 }}>
          tap for match stats
        </div>
      )}
    </div>
  )
}

export default function ScoresTab() {
  const [matches, setMatches]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('today')
  const [selected, setSelected]   = useState(null)

  useEffect(() => {
    fetchMatches()
    const channel = supabase
      .channel('scores-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [filter])

  async function fetchMatches() {
    setLoading(true)
    let query = supabase.from('matches').select('*').order('utc_date', { ascending: true })

    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('utc_date', `${today}T00:00:00Z`).lte('utc_date', `${today}T23:59:59Z`)
    } else if (filter === 'live') {
      query = query.in('status', ['IN_PLAY', 'PAUSED'])
    }

    const { data } = await query.limit(50)
    setMatches(data ?? [])
    setLoading(false)
  }

  const filters = [
    { key: 'today', label: "Today's matches" },
    { key: 'live',  label: 'Live now' },
    { key: 'all',   label: 'All matches' },
  ]

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '5px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
            background: filter === f.key ? '#6fcf97' : 'rgba(255,255,255,0.08)',
            color: filter === f.key ? '#061a0d' : 'rgba(255,255,255,0.7)',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 64 }} />
          ))
        ) : matches.length > 0 ? (
          matches.map(m => (
            <MatchRow key={m.id} match={m} onClick={() => setSelected(m)} />
          ))
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem', fontSize: 14 }}>
            No matches found
          </div>
        )}
      </div>

      {/* Match modal */}
      {selected && <MatchModal match={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
