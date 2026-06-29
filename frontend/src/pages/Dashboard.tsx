import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import Settings from '../components/Settings'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { useKeyboard } from '../hooks/useKeyboard'

export default function Dashboard() {
  const { sidebarOpen, setSidebarOpen, newConversation } = useChat()
  const { user, logout, setPage } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useKeyboard([
    { key: 'k', ctrl: true, handler: () => setSidebarOpen(prev => !prev) },
    { key: 'n', ctrl: true, handler: () => newConversation() },
    { key: '/', ctrl: true, handler: () => setShowShortcuts(prev => !prev) },
    { key: 'Escape', handler: () => { setShowMenu(false); if (showSettings) setShowSettings(false); if (showShortcuts) setShowShortcuts(false) } },
  ])

  return (
    <div className="h-screen flex overflow-hidden bg-[#050508]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#050508]/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all" aria-label="Toggle sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <span className="text-sm font-semibold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AVI</span>
              <span className="text-white/40">OS</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowShortcuts(true)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all" aria-label="Keyboard shortcuts">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h.01M18 16h.01M10 16h4"/></svg>
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all" aria-label="User menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-[#0a0a12] border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/[0.06]">Signed in as <span className="text-white">{user?.name}</span></div>
                  {user?.role === 'admin' && (
                    <button onClick={() => { setShowMenu(false); setPage('admin') }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/[0.04] transition-all">Admin Panel</button>
                  )}
                  <button onClick={() => { setShowMenu(false); setPage('memory') }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/[0.04] transition-all">Memory Settings</button>
                  <button onClick={() => { setShowMenu(false); setPage('about') }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/[0.04] transition-all">About AVIOS</button>
                  <button onClick={() => { setShowMenu(false); setShowSettings(true) }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/[0.04] transition-all">Settings</button>
                  <button onClick={() => { setShowMenu(false); logout() }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/[0.04] transition-all border-t border-white/[0.06]">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <ChatArea />
      </div>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <KeyboardShortcuts open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
