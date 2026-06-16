'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ScoresTab from '@/components/ScoresTab'
import GroupsTab from '@/components/GroupsTab'
import PlayersTab from '@/components/PlayersTab'
import BracketTab from '@/components/BracketTab'

const TABS = ['Scores', 'Groups', 'Bracket', 'Players']

export default function Home() {
  const [activeTab, setActiveTab] = useState('Scores')

  return (
    <main>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <Hero />

      {/* Tab content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>

        {/* Mobile tab bar */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: '1.5rem',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          overflowX: 'auto', paddingBottom: 1,
        }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
              background: 'transparent', transition: 'all 0.2s',
              borderBottom: activeTab === tab ? '2px solid #6fcf97' : '2px solid transparent',
              color: activeTab === tab ? '#6fcf97' : 'rgba(255,255,255,0.5)',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Render active tab */}
        <div className="fade-in" key={activeTab}>
          {activeTab === 'Scores'  && <ScoresTab />}
          {activeTab === 'Groups'  && <GroupsTab />}
          {activeTab === 'Bracket' && <BracketTab />}
          {activeTab === 'Players' && <PlayersTab />}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        padding: '1.5rem 1rem',
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(255,255,255,0.25)',
      }}>
        Data from football-data.org · Updates every 60 seconds · Built by Arindam
      </footer>
    </main>
  )
}
