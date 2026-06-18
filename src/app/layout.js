import './globals.css'

export const metadata = {
  title: 'World Cup 2026 — Live Scores, Groups & Stats',
  description: 'Live FIFA World Cup 2026 scores, group standings, Golden Boot tracker and match stats. USA · Canada · Mexico.',
  openGraph: {
    title: 'World Cup 2026 Live',
    description: 'Live scores, standings and stats for FIFA World Cup 2026',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
