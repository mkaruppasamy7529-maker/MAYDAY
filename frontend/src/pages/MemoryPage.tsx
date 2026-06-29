import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getMemories, addMemory, deleteMemory, clearMemories } from '../services/api'
import { Memory } from '../types'

export default function MemoryPage() {
  const { setPage } = useAuth()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState('general')

  const load = async () => {
    setLoading(true)
    const data = await getMemories()
    if (data) setMemories(data.memories)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim() || !value.trim()) return
    await addMemory(key, value, category)
    setKey(''); setValue('')
    load()
  }

  const handleDelete = async (id: number) => {
    await deleteMemory(id)
    load()
  }

  const handleClear = async () => {
    if (!confirm('Clear all memories?')) return
    await clearMemories()
    load()
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] backdrop-blur-xl bg-[#050508]/50">
        <h1 className="text-xl font-bold text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Memory</span>
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setPage('chat')} className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg text-sm transition-all">Back to Chat</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <form onSubmit={handleAdd} className="backdrop-blur-xl bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Add Memory</h2>
          <div className="flex gap-2">
            <input type="text" placeholder="Key (e.g., user_name)" value={key} onChange={e => setKey(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm" />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 text-sm">
              <option value="general">General</option>
              <option value="preference">Preference</option>
              <option value="fact">Fact</option>
            </select>
          </div>
          <textarea placeholder="Value" value={value} onChange={e => setValue(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm resize-none h-20" />
          <button type="submit" disabled={!key.trim() || !value.trim()}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl text-sm transition-all">Save Memory</button>
        </form>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Stored Memories ({memories.length})</h2>
          {memories.length > 0 && (
            <button onClick={handleClear} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-all">Clear All</button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm text-center">Loading...</p>
        ) : memories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">\uD83E\uDDE0</p>
            <p className="text-gray-500 text-sm">No memories stored yet.</p>
            <p className="text-gray-600 text-xs mt-1">MAYDAY will remember things you teach it.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map(m => (
              <div key={m.id} className="backdrop-blur-xl bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-cyan-400 uppercase">{m.category}</span>
                    <span className="text-xs text-gray-500">{m.key}</span>
                  </div>
                  <p className="text-sm text-gray-300 break-words">{m.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{new Date(m.updated_at).toLocaleString()}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="p-1 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
