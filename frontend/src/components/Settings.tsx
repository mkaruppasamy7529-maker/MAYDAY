import { useState } from 'react'
import { motion } from 'framer-motion'
import { useChat } from '../contexts/ChatContext'

interface Props { onClose: () => void }

export default function Settings({ onClose }: Props) {
  const { settings, updateSettings, clearConversations, importConversation, showToast } = useChat()
  const [backendUrl, setBackendUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000')

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.txt'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.id && data.messages) {
          importConversation(data)
          showToast('Conversation imported')
        } else {
          showToast('Invalid conversation file', 'error')
        }
      } catch {
        showToast('Failed to import file', 'error')
      }
    }
    input.click()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-2xl border border-white/5 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Appearance</label>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(t => (
                <button key={t} onClick={() => updateSettings({ theme: t })}
                  className={`px-4 py-2 rounded-lg text-sm border transition-all capitalize ${
                    settings.theme === t ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {t === 'dark' ? (
                    <span className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Dark</span>
                  ) : (
                    <span className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Light</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Font Size</label>
            <div className="flex gap-2">
              {(['sm', 'base', 'lg'] as const).map(s => (
                <button key={s} onClick={() => updateSettings({ fontSize: s })}
                  className={`px-4 py-2 rounded-lg text-sm border transition-all capitalize ${
                    settings.fontSize === s ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {s === 'sm' ? 'Small' : s === 'base' ? 'Medium' : 'Large'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Backend URL</label>
            <input type="text" value={backendUrl} onChange={e => setBackendUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50" />
            <p className="text-[10px] text-gray-600 mt-1">Configure the backend API endpoint</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Conversations</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleImport} className="px-4 py-2 rounded-lg text-sm border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                Import conversations
              </button>
              <button onClick={() => { if (confirm('Clear all conversations?')) clearConversations() }}
                className="px-4 py-2 rounded-lg text-sm border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                Clear all
              </button>
            </div>
          </div>

          {['Memory', 'Notifications', 'Voice', 'Privacy'].map(item => (
            <div key={item}>
              <label className="text-sm text-gray-400 block mb-2">{item}</label>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-sm text-gray-600">Coming soon</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
