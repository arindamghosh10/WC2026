'use client'
import { useState } from 'react'

const tabs = ['Scores', 'Groups', 'Bracket', 'Players']

export default function Navbar({ activeTab, onTabChange }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      background: 'rgba(6,26,13,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏆</span>
          <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: 18, fontWeight: 600, color: '#6fcf97', letterSpacing: 1 }}>
            WC 2026
          </span>
        </div>

        {/* Desktop tabs */}
        <div style={{ display: 'flex', gap: 4 }} className="desktop-tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.2s',
                background: activeTab === tab ? '#6fcf97' : 'transparent',
                color: activeTab === tab ? '#061a0d' : 'rgba(255,255,255,0.6)',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6fcf97' }}>
          <span className="live-dot" style={{
            width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block'
          }} />
          LIVE
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .desktop-tabs { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
