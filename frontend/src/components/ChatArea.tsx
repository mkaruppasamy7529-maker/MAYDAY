import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '../contexts/ChatContext'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'
import LogoIcon from './LogoIcon'

export default function ChatArea() {
  const { conversations, currentId, isGenerating, sendMessage } = useChat()
  const endRef = useRef<HTMLDivElement>(null)

  const current = conversations.find(c => c.id === currentId)
  const messages = current?.messages || []

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleRegenerate = () => {
    if (!current || current.messages.length < 2) return
    const lastUser = [...current.messages].reverse().find(m => m.role === 'user')
    if (lastUser) sendMessage(lastUser.content)
  }

  if (!current) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-500/20">
            <LogoIcon size={36} animated />
          </div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">How can I help you today?</h2>
          <p className="text-sm text-gray-500 max-w-md">I'm AVIOS, Your Personal AI Assistant. Start a conversation to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-500/20">
<LogoIcon size={36} animated />
              </div>
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Hello. I'm AVIOS.</h2>
              <p className="text-sm text-gray-500">Your Personal AI Assistant. How can I help you today?</p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                convId={current.id}
                isStreaming={isGenerating && i === messages.length - 1 && msg.role === 'assistant'}
                onRegenerate={i === messages.length - 1 && msg.role === 'assistant' ? handleRegenerate : undefined}
              />
            ))}
          </AnimatePresence>

          {isGenerating && messages[messages.length - 1]?.role === 'user' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                <LogoIcon size={16} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] rounded-tl-md">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-cyan-400/70 italic">AVIOS is thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <InputArea />
    </div>
  )
}
