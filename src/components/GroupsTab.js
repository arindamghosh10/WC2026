'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const GROUP_NAMES = [
  'GROUP_A','GROUP_B','GROUP_C','GROUP_D','GROUP_E','GROUP_F',
  'GROUP_G','GROUP_H','GROUP_I','GROUP_J','GROUP_K','GROUP_L',
]

function GroupTable({ groupName, teams }) {
  const label = groupName.replace('GROUP_', 'Group ')
  return (
    <div className="glass" style={{ padding: '1rem' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6fcf97', marginBottom: 10, letterSpacing: 0.5 }}>
        {label}
      </div>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 32px 32px 32px 32px', gap: 4, marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Team</div>
        {['P','W','D','L','Pts'].map(h => (
          <div key={h} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {teams.map((team, idx) => (
        <div key={team.team_id} style={{
          display: 'grid',
          gridTemplateColumns: '1fr 32px 32px 32px 32px 32px',
          gap: 4,
          padding: '6px 0',
          borderTop: idx > 0 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
          alignItems: 'center',
        }}>
          {/* Position + team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: idx < 2 ? 'rgba(111,207,151,0.2)' : 'rgba(255,255,255,0.06)',
              color: idx < 2 ? '#6fcf97' : 'rgba(255,255,255,0.4)',
            }}>{team.position}</span>
            {team.team_crest && (
              <img src={team.team_crest} alt="" width={18} height={18}
                style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', padding: 1 }} />
            )}
            <span style={{ fontSize: 13, color: '#fff', fontWeight: idx < 2 ? 500 : 400 }}>
              {team.team_name}
            </span>
          </div>

          {/* Stats */}
          {[team.played, team.won, team.draw, team.lost].map((val, i) => (
            <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{val}</div>
          ))}
          <div style={{
            fontSize: 13, fontWeight: 700, textAlign: 'center',
            color: idx < 2 ? '#6fcf97' : 'rgba(255,255,255,0.8)',
          }}>{team.points}</div>
        </div>
      ))}

      {/* Qualification legend */}
      <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(111,207,151,0.4)', display: 'inline-block' }} />
        Top 2 qualify
      </div>
    </div>
  )
}

export default function GroupsTab() {
  const [standings, setStandings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStandings()
    const channel = supabase
      .channel('standings-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'standings' }, fetchStandings)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchStandings() {
    const { data } = await supabase
      .from('standings')
      .select('*')
      .order('group_name', { ascending: true })
      .order('position', { ascending: true })

    if (!data) return

    // Group by group_name
    const grouped = {}
    for (const row of data) {
      if (!grouped[row.group_name]) grouped[row.group_name] = []
      grouped[row.group_name].push(row)
    }
    setStandings(grouped)
    setLoading(false)
  }

  const groups = Object.keys(standings).sort()

  return (
    <div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: '1.25rem' }}>
        12 groups · 48 teams · Top 2 from each group advance
      </p>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 200 }} />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {groups.map(g => (
            <GroupTable key={g} groupName={g} teams={standings[g]} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem', fontSize: 14 }}>
          Standings will appear once matches begin
        </div>
      )}
    </div>
  )
}
