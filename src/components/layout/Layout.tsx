import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen bg-pitch-900 turf-overlay">
      {/* Pitch texture layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/pitch-texture.jpg)',
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
          opacity: 0.045,
        }}
      />
      {/* Stadium floodlight glow — green radial from top */}
      <div className="fixed top-0 left-0 right-0 h-[600px] bg-stadium-glow pointer-events-none z-0 opacity-80" />
      {/* Secondary gold accent glow — subtle warm top edge */}
      <div
        className="fixed top-0 left-0 right-0 h-48 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(180deg, rgba(212,175,55,0.06) 0%, transparent 100%)',
        }}
      />

      <Navbar />

      <main className="relative z-10 pt-16 min-h-screen">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-white tracking-wider">DIWANIYA</span>
            <span className="text-[#4A6458] text-sm font-body">· WC 2026 Predictions</span>
          </div>
          <div className="text-xs text-[#4A6458] font-body text-center">
            All times shown in Kuwait Time (AST · UTC+3) · Private competition · Not affiliated with
            FIFA
          </div>
        </div>
      </footer>
    </div>
  )
}
