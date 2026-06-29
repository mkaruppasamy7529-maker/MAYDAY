import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useChat } from '../contexts/ChatContext'
import { useOffline } from '../hooks/useOffline'
import { getUsage } from '../services/api'

export default function InputArea() {
  const { sendMessage, isGenerating, stopGeneration, currentId } = useChat()
  const isOffline = useOffline()
  const [input, setInput] = useState('')
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    getUsage().then(setUsage)
  }, [])

  useEffect(() => {
    if (!isGenerating && currentId) textareaRef.current?.focus()
  }, [isGenerating, currentId])

  const adjustHeight = () => {
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px' }
  }

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isGenerating) return
    setInput('')
    sendMessage(trimmed)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className="border-t border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {isGenerating && (
          <div className="flex justify-center mb-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={stopGeneration}
              className="px-4 py-1.5 rounded-full border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              Stop generating
            </motion.button>
          </div>
        )}

        <div className="glass rounded-2xl border border-white/5 focus-within:border-indigo-500/40 transition-all glow-ring">
          <div className="flex items-end px-3 py-2 gap-2">
            {/* Attach button */}
            <button className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all flex-shrink-0" aria-label="Attach file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); adjustHeight() }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder={isOffline ? "You're offline — reconnect to chat" : "Ask AVIOS anything..."}
              rows={1}
              disabled={isGenerating || isOffline}
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none outline-none max-h-[200px] disabled:opacity-50"
            />

            {/* Mic placeholder */}
            <button className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all flex-shrink-0" aria-label="Voice input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></svg>
            </button>

            {/* Send button */}
            {isGenerating ? (
              <div className="flex items-center gap-1 px-2 py-2">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isOffline}
                className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/5 disabled:text-gray-600 text-white transition-all disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            )}
          </div>
        </div>

        {usage && (
          <div className="flex justify-between px-1 mt-1.5">
            <span className="text-[10px] text-gray-600">{usage.remaining} / {usage.limit} messages today</span>
            <div className="flex gap-0.5 items-center">
              {Array.from({ length: 5 }).map((_, i) => {
                const pct = usage.used / usage.limit
                return <div key={i} className={`w-3 h-1 rounded-full ${i / 5 < pct ? 'bg-indigo-500/40' : 'bg-white/5'}`} />
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
