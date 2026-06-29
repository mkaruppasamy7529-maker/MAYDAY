import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '../contexts/ChatContext'
import Settings from './Settings'
import About from './About'

export default function Sidebar() {
  const {
    conversations, currentId, searchQuery, setSearchQuery,
    setCurrentId, newConversation, deleteConversation, togglePin,
    sidebarOpen, setSidebarOpen, exportConversation, showToast,
  } = useChat()
  const [showSettings, setShowSettings] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  const pinned = useMemo(() => conversations.filter(c => (c as any).pinned), [conversations])
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    )
  }, [conversations, searchQuery])

  const recent = useMemo(() => filtered.filter(c => !(c as any).pinned).slice(0, 20), [filtered])

  const handleExport = (id: string) => {
    const text = exportConversation(id)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `mayday-conversation-${id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Conversation exported')
  }

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-40 w-72 glass border-r border-white/5 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  <span className="text-gradient">MAY</span>
                  <span className="text-white/60">DAY</span>
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white" aria-label="Close sidebar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <button onClick={newConversation} className="mx-3 mt-3 p-2.5 rounded-lg border border-dashed border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              New conversation
            </button>

            <div className="mx-3 mt-3 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" placeholder="Search conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {pinned.length > 0 && (
                <>
                  <p className="px-2 py-1 text-[10px] text-gray-600 uppercase tracking-wider">Pinned</p>
                  {pinned.map(conv => <ChatItem key={conv.id} conv={conv} isActive={currentId === conv.id} onClick={() => { setCurrentId(conv.id); setSidebarOpen(false) }} onDelete={() => deleteConversation(conv.id)} onExport={() => handleExport(conv.id)} onPin={() => togglePin(conv.id)} />)}
                  <div className="h-px bg-white/5 my-2" />
                </>
              )}

              <p className="px-2 py-1 text-[10px] text-gray-600 uppercase tracking-wider">Recent</p>
              {recent.map(conv => <ChatItem key={conv.id} conv={conv} isActive={currentId === conv.id} onClick={() => { setCurrentId(conv.id); setSidebarOpen(false) }} onDelete={() => deleteConversation(conv.id)} onExport={() => handleExport(conv.id)} onPin={() => togglePin(conv.id)} />)}
              {recent.length === 0 && <p className="text-center text-gray-600 text-sm py-8">No conversations yet</p>}
            </div>

            <div className="border-t border-white/5 p-3 space-y-1">
              <button onClick={() => { setShowSettings(true); setSidebarOpen(false) }} className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </button>
              <button onClick={() => { setShowAbout(true); setSidebarOpen(false) }} className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                About MAYDAY
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </>
  )
}

function ChatItem({ conv, isActive, onClick, onDelete, onExport, onPin }: {
  conv: any; isActive: boolean; onClick: () => void; onDelete: () => void; onExport: () => void; onPin: () => void
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-sm transition-all ${
        isActive ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span className="truncate">{conv.title}</span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={e => { e.stopPropagation(); onPin() }} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-yellow-400" aria-label="Pin conversation">
          <svg width="12" height="12" viewBox="0 0 24 24" fill={conv.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>
        </button>
        <button onClick={e => { e.stopPropagation(); onExport() }} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300" aria-label="Export conversation">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400" aria-label="Delete conversation">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </motion.div>
  )
}
