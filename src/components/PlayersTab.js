'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function PlayerCard({ scorer, rank }) {
  const isTop3 = rank <= 3
  const medalColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'

  return (
    <div className="glass fade-in" style={{
      padding: '1rem',
      border: isTop3 ? `0.5px solid ${medalColor}30` : '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      transition: 'background 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
        background: isTop3 ? `${medalColor}22` : 'rgba(255,255,255,0.06)',
        color: isTop3 ? medalColor : 'rgba(255,255,255,0.4)',
      }}>
        {rank}
      </div>

      {/* Team crest */}
      {scorer.team_crest ? (
        <img src={scorer.team_crest} alt="" width={32} height={32}
          style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: 2, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
      )}

      {/* Player info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scorer.player_name}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
          {scorer.team_name} · {scorer.nationality}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Oswald, sans-serif', color: '#6fcf97' }}>
            {scorer.goals}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Goals</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Oswald, sans-serif', color: 'rgba(255,255,255,0.6)' }}>
            {scorer.assists}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Assists</div>
        </div>
      </div>
    </div>
  )
}

export default function PlayersTab() {
  const [scorers, setScorers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScorers()
    const channel = supabase
      .channel('scorers-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scorers' }, fetchScorers)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchScorers() {
    const { data } = await supabase
      .from('scorers')
      .select('*')
      .order('goals', { ascending: false })
      .order('assists', { ascending: false })
      .limit(20)

    setScorers(data ?? [])
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <span style={{ fontSize: 20 }}>🥇</span>
        <div>
          <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18, margin: 0, color: '#fff' }}>Golden Boot Race</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Top 20 scorers · Updates every 60 seconds</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 72 }} />
          ))
        ) : scorers.length > 0 ? (
          scorers.map((s, i) => <PlayerCard key={s.player_id} scorer={s} rank={i + 1} />)
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem', fontSize: 14 }}>
            Scorer data will appear once matches begin
          </div>
        )}
      </div>
    </div>
  )
}
