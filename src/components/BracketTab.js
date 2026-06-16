'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const KNOCKOUT_STAGES = ['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL']
const STAGE_LABEL = {
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL: 'Final',
}

function BracketMatch({ match }) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isFinished = match.status === 'FINISHED'

  const homeWin = match.winner === 'HOME_TEAM'
  const awayWin = match.winner === 'AWAY_TEAM'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: `0.5px solid ${isLive ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)'}`,
      borderRadius: 8,
      overflow: 'hidden',
      minWidth: 180,
    }}>
      {/* Home team row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        background: homeWin ? 'rgba(111,207,151,0.1)' : 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {match.home_team_crest && (
            <img src={match.home_team_crest} alt="" width={16} height={16}
              style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: 1 }} />
          )}
          <span style={{ fontSize: 12, color: homeWin ? '#6fcf97' : '#fff', fontWeight: homeWin ? 600 : 400 }}>
            {match.home_team_name ?? 'TBD'}
          </span>
        </div>
        {(isFinished || isLive) && (
          <span style={{ fontSize: 13, fontWeight: 700, color: homeWin ? '#6fcf97' : 'rgba(255,255,255,0.7)' }}>
            {match.home_score ?? 0}
          </span>
        )}
      </div>

      {/* Away team row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px',
        background: awayWin ? 'rgba(111,207,151,0.1)' : 'transparent',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {match.away_team_crest && (
            <img src={match.away_team_crest} alt="" width={16} height={16}
              style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', padding: 1 }} />
          )}
          <span style={{ fontSize: 12, color: awayWin ? '#6fcf97' : '#fff', fontWeight: awayWin ? 600 : 400 }}>
            {match.away_team_name ?? 'TBD'}
          </span>
        </div>
        {(isFinished || isLive) && (
          <span style={{ fontSize: 13, fontWeight: 700, color: awayWin ? '#6fcf97' : 'rgba(255,255,255,0.7)' }}>
            {match.away_score ?? 0}
          </span>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        padding: '3px 10px',
        background: isLive ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
        fontSize: 10, color: isLive ? '#ef4444' : 'rgba(255,255,255,0.3)',
        textAlign: 'center', fontWeight: 600,
      }}>
        {isLive ? `LIVE ${match.minute ?? ''}'` : isFinished ? 'FT' : new Date(match.utc_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </div>
    </div>
  )
}

export default function BracketTab() {
  const [byStage, setByStage] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBracket()
    const channel = supabase
      .channel('bracket-tab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchBracket)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchBracket() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .in('stage', KNOCKOUT_STAGES)
      .order('utc_date', { ascending: true })

    if (!data) { setLoading(false); return }

    const grouped = {}
    for (const m of data) {
      if (!grouped[m.stage]) grouped[m.stage] = []
      grouped[m.stage].push(m)
    }
    setByStage(grouped)
    setLoading(false)
  }

  const hasKnockout = Object.keys(byStage).length > 0

  return (
    <div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
        32 teams enter the knockout stage · Single elimination · Extra time & penalties if level after 90 mins
      </p>

      {loading ? (
        <div className="shimmer" style={{ height: 300 }} />
      ) : hasKnockout ? (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 24, minWidth: 800, paddingBottom: '1rem' }}>
            {KNOCKOUT_STAGES.map(stage => (
              <div key={stage} style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6fcf97', marginBottom: 12, letterSpacing: 0.5 }}>
                  {STAGE_LABEL[stage]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {byStage[stage]?.map(m => <BracketMatch key={m.id} match={m} />) ?? (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Upcoming</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          color: 'rgba(255,255,255,0.4)', fontSize: 14,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          Knockout stage begins July 4 · Check back after the group stage
        </div>
      )}
    </div>
  )
}
