'use client'
import { useEffect } from 'react'

/* ── helpers ── */
function goalMinute(g) {
  return g.injuryTime ? `${g.minute}+${g.injuryTime}'` : `${g.minute}'`
}
function cardEmoji(card) {
  if (card === 'RED_CARD') return '🟥'
  if (card === 'YELLOW_RED_CARD') return '🟨🟥'
  return '🟨'
}
function goalTypeTag(type) {
  if (type === 'OWN_GOAL') return ' (OG)'
  if (type === 'PENALTY') return ' (P)'
  return ''
}

function TeamEvents({ match, side }) {
  const teamId = side === 'home' ? match.home_team_id : match.away_team_id
  const goals = (match.goals ?? []).filter(g => g.team_id === teamId)
  const cards = (match.bookings ?? []).filter(b => b.team_id === teamId)
  const subs  = (match.substitutions ?? []).filter(s => s.team_id === teamId)
  const align = side === 'home' ? 'flex-start' : 'flex-end'
  const textAlign = side === 'home' ? 'left' : 'right'

  if (!goals.length && !cards.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: align }}>
      {goals.map((g, i) => (
        <span key={i} style={{ fontSize: 12, color: '#6fcf97', display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚽ {goalMinute(g)} {g.scorer_name}{goalTypeTag(g.type)}
        </span>
      ))}
      {cards.map((c, i) => (
        <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {cardEmoji(c.card)} {c.minute}' {c.player_name}
        </span>
      ))}
    </div>
  )
}

/* ── Timeline row in modal ── */
function EventRow({ event, homeTeamId }) {
  const isHome = event.team_id === homeTeamId
  let icon = '⚽'
  let label = `${event.scorer_name}${goalTypeTag(event.type)}`
  let sublabel = event.assist_name ? `Assist: ${event.assist_name}` : null
  let color = '#6fcf97'

  if (event.card) {
    icon = cardEmoji(event.card)
    label = event.player_name
    sublabel = null
    color = event.card === 'YELLOW_CARD' ? '#fbbf24' : '#ef4444'
  }
  if (event.player_in_name) {
    icon = '🔄'
    label = `${event.player_in_name} ↑  ${event.player_out_name} ↓`
    sublabel = null
    color = 'rgba(255,255,255,0.5)'
  }

  const minute = event.injuryTime
    ? `${event.minute}+${event.injuryTime}'`
    : `${event.minute}'`

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 0',
      borderBottom: '0.5px solid rgba(255,255,255,0.05)',
      flexDirection: isHome ? 'row' : 'row-reverse',
    }}>
      {/* minute badge */}
      <div style={{
        minWidth: 42, textAlign: 'center',
        fontSize: 12, fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'Oswald, sans-serif',
      }}>
        {minute}
      </div>
      {/* icon */}
      <span style={{ fontSize: 16 }}>{icon}</span>
      {/* text */}
      <div style={{ textAlign: isHome ? 'left' : 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{sublabel}</div>}
      </div>
    </div>
  )
}

/* ── Main Modal ── */
export default function MatchModal({ match, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!match) return null

  const isLive     = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isFinished = match.status === 'FINISHED'
  const isUpcoming = !isLive && !isFinished

  const homeScore = match.home_score ?? (isUpcoming ? '–' : 0)
  const awayScore = match.away_score ?? (isUpcoming ? '–' : 0)

  // Combine all events and sort by minute
  const allEvents = [
    ...(match.goals ?? []).map(g => ({ ...g, _type: 'goal' })),
    ...(match.bookings ?? []).map(b => ({ ...b, _type: 'booking' })),
    ...(match.substitutions ?? []).map(s => ({ ...s, _type: 'sub' })),
  ].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  const homeGoals = (match.goals ?? []).filter(g => g.team_id === match.home_team_id)
  const awayGoals = (match.goals ?? []).filter(g => g.team_id === match.away_team_id)
  const homeYellow = (match.bookings ?? []).filter(b => b.team_id === match.home_team_id && b.card === 'YELLOW_CARD').length
  const awayYellow = (match.bookings ?? []).filter(b => b.team_id === match.away_team_id && b.card === 'YELLOW_CARD').length
  const homeRed = (match.bookings ?? []).filter(b => b.team_id === match.home_team_id && (b.card === 'RED_CARD' || b.card === 'YELLOW_RED_CARD')).length
  const awayRed = (match.bookings ?? []).filter(b => b.team_id === match.away_team_id && (b.card === 'RED_CARD' || b.card === 'YELLOW_RED_CARD')).length

  const kickoffIST = new Date(match.utc_date).toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 101,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0a2e14',
          border: '0.5px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          animation: 'fadeIn 0.2s ease',
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(180deg, #0f3d1c 0%, #0a2e14 100%)',
            padding: '1.5rem 1.25rem 1rem',
            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          }}>
            {/* Close button */}
            <button onClick={onClose} style={{
              position: 'absolute', top: 'calc(50% - 45vh + 16px)',
              right: 'calc(50% - 280px + 16px)',
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              color: '#fff', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>

            {/* Stage / group */}
            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: 1 }}>
              {(match.group ?? match.stage ?? '').replace('_', ' ')} · Matchday {match.matchday}
            </div>

            {/* Teams + Score */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>

              {/* Home */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {match.home_team_crest && (
                  <img src={match.home_team_crest} alt="" width={52} height={52}
                    style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', padding: 4 }} />
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{match.home_team_name}</div>
                {/* Goals list */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {homeGoals.map((g, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#6fcf97' }}>
                      {g.scorer_name}{goalTypeTag(g.type)} {goalMinute(g)}
                    </div>
                  ))}
                </div>
                {/* Cards summary */}
                {(homeYellow > 0 || homeRed > 0) && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {homeYellow > 0 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🟨×{homeYellow}</span>}
                    {homeRed > 0 && <span style={{ fontSize: 11, color: '#ef4444' }}>🟥×{homeRed}</span>}
                  </div>
                )}
              </div>

              {/* Score */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {isLive && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#ef4444', borderRadius: 20, padding: '2px 10px',
                    fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 4,
                  }}>
                    <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                    {match.minute}'
                  </div>
                )}
                <div style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: isUpcoming ? 28 : 40,
                  fontWeight: 700, color: '#fff', lineHeight: 1,
                  letterSpacing: -1,
                }}>
                  {isUpcoming ? '–  –' : `${homeScore} – ${awayScore}`}
                </div>
                {isFinished && match.home_score_ht !== null && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    HT: {match.home_score_ht} – {match.away_score_ht}
                  </div>
                )}
                <div style={{ fontSize: 11, color: isFinished ? 'rgba(255,255,255,0.4)' : isLive ? '#ef4444' : 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 600 }}>
                  {isFinished ? 'FULL TIME' : isLive ? 'LIVE' : kickoffIST + ' IST'}
                </div>
              </div>

              {/* Away */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {match.away_team_crest && (
                  <img src={match.away_team_crest} alt="" width={52} height={52}
                    style={{ objectFit: 'contain', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', padding: 4 }} />
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{match.away_team_name}</div>
                {/* Goals list */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {awayGoals.map((g, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#6fcf97' }}>
                      {g.scorer_name}{goalTypeTag(g.type)} {goalMinute(g)}
                    </div>
                  ))}
                </div>
                {/* Cards summary */}
                {(awayYellow > 0 || awayRed > 0) && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {awayYellow > 0 && <span style={{ fontSize: 11, color: '#fbbf24' }}>🟨×{awayYellow}</span>}
                    {awayRed > 0 && <span style={{ fontSize: 11, color: '#ef4444' }}>🟥×{awayRed}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Match Info bar ── */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 24,
            padding: '0.75rem 1.25rem',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            fontSize: 12, color: 'rgba(255,255,255,0.4)',
            flexWrap: 'wrap',
          }}>
            {match.venue && <span>📍 {match.venue}</span>}
            {match.referees && <span>🧑‍⚖️ {match.referees}</span>}
            {!isUpcoming && <span>🗓 {kickoffIST} IST</span>}
          </div>

          {/* ── Events Timeline ── */}
          <div style={{ padding: '1rem 1.25rem' }}>
            {allEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '1.5rem 0' }}>
                {isUpcoming ? 'Match not started yet' : 'No events recorded yet'}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8 }}>
                  MATCH EVENTS
                </div>
                {allEvents.map((ev, i) => (
                  <EventRow key={i} event={ev} homeTeamId={match.home_team_id} />
                ))}
              </>
            )}
          </div>

          {/* ── Stats Bars ── */}
          {(isLive || isFinished) && (
            <div style={{
              padding: '0.75rem 1.25rem 1.25rem',
              borderTop: '0.5px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 12 }}>
                HIGHLIGHTS SUMMARY
              </div>
              <StatBar label="Goals" home={homeGoals.length} away={awayGoals.length} />
              <StatBar label="Yellow Cards" home={homeYellow} away={awayYellow} color="#fbbf24" />
              <StatBar label="Red Cards" home={homeRed} away={awayRed} color="#ef4444" />
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function StatBar({ label, home, away, color = '#6fcf97' }) {
  const total = home + away
  const homePct = total === 0 ? 50 : Math.round((home / total) * 100)
  const awayPct = 100 - homePct

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.5)' }}>
        <span style={{ fontWeight: 700, color: '#fff' }}>{home}</span>
        <span style={{ fontSize: 11 }}>{label}</span>
        <span style={{ fontWeight: 700, color: '#fff' }}>{away}</span>
      </div>
      <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${homePct}%`, background: color, transition: 'width 0.6s ease' }} />
        <div style={{ width: `${awayPct}%`, background: 'rgba(255,255,255,0.12)' }} />
      </div>
    </div>
  )
}

// Export helpers for use in other components
export { TeamEvents, goalMinute, cardEmoji, goalTypeTag }
