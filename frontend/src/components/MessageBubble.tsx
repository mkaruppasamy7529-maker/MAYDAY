import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Message } from '../types'
import { useChat } from '../contexts/ChatContext'
import { useStreamingAnimation } from '../hooks/useStreamingAnimation'

interface Props {
  message: Message
  convId: string
  isStreaming?: boolean
  onRegenerate?: () => void
}

export default function MessageBubble({ message, convId, isStreaming, onRegenerate }: Props) {
  const { editMessage, deleteMessage } = useChat()
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.content)
  const isUser = message.role === 'user'
  const { showCursor } = useStreamingAnimation(isStreaming ?? false)

  const copyContent = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEdit = () => {
    if (editText.trim() && editText !== message.content) {
      editMessage(convId, message.id, editText.trim())
    }
    setEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-indigo-500/10 border border-indigo-500/20'
          : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/10'
      }`}>
        {isUser ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        ) : (
          <span className="text-sm font-bold text-gradient">M</span>
        )}
      </div>

      <div className={`group max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-indigo-500/10 border border-indigo-500/20 text-gray-100 rounded-tr-md'
            : 'bg-white/5 border border-white/5 text-gray-200 rounded-tl-md'
        }`}>
          {isUser && editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="bg-transparent text-sm text-gray-100 outline-none resize-none w-full"
                rows={3}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit() } }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5">Cancel</button>
                <button onClick={handleEdit} className="text-xs text-indigo-300 hover:text-indigo-200 px-2 py-1 rounded bg-indigo-500/10">Save</button>
              </div>
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeStr = String(children).replace(/\n$/, '')
                    if (match) {
                      return (
                        <div className="relative group/code">
                          <button
                            onClick={() => { navigator.clipboard.writeText(codeStr); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                            className="absolute right-2 top-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white opacity-0 group-hover/code:opacity-100 transition-all text-xs"
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                          <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
                            {codeStr}
                          </SyntaxHighlighter>
                        </div>
                      )
                    }
                    return <code className="bg-white/5 px-1.5 py-0.5 rounded text-indigo-300 text-sm" {...props}>{children}</code>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              
            </div>
          )}
        </div>

        {/* Actions */}
        {message.content && !isStreaming && (
          <div className="flex items-center gap-1 mt-1 px-2">
            {isUser ? (
              <>
                <button onClick={() => { setEditing(true); setEditText(message.content) }} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all" aria-label="Edit message">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => deleteMessage(convId, message.id)} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-red-400 transition-all" aria-label="Delete message">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </>
            ) : (
              <>
                <button onClick={copyContent} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all" aria-label="Copy response">
                  {copied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  )}
                </button>
                {onRegenerate && (
                  <button onClick={onRegenerate} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all" aria-label="Regenerate response">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
