import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { Conversation, Message, AppSettings } from '../types'
import { loadConversations, saveConversations, loadSettings, saveSettings } from '../utils/storage'
import { streamChat, newSession as apiNewSession } from '../services/api'

interface ChatContextValue {
  conversations: Conversation[]
  currentId: string | null
  settings: AppSettings
  isGenerating: boolean
  sidebarOpen: boolean
  searchQuery: string
  sessionId: string | null
  toast: { message: string; type: 'success' | 'error' } | null
  setCurrentId: (id: string | null) => void
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  setSearchQuery: (query: string) => void
  sendMessage: (content: string) => Promise<void>
  stopGeneration: () => void
  newConversation: () => void
  deleteConversation: (id: string) => void
  clearConversations: () => void
  updateSettings: (s: Partial<AppSettings>) => void
  exportConversation: (id: string) => string
  importConversation: (data: Conversation) => void
  showToast: (message: string, type?: 'success' | 'error') => void
  editMessage: (convId: string, msgId: string, content: string) => void
  deleteMessage: (convId: string, msgId: string) => void
  retryLast: () => void
  togglePin: (id: string) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

let mid = 0
function genId() { return `msg_${Date.now()}_${++mid}` }
function convId() { return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { saveConversations(conversations) }, [conversations])
  useEffect(() => { saveSettings(settings); document.documentElement.classList.toggle('dark', settings.theme === 'dark') }, [settings])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }, [])

  const newConversation = useCallback(async () => {
    const sid = await apiNewSession()
    setSessionId(sid || null)
    const conv: Conversation = {
      id: convId(),
      title: 'New conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setConversations(prev => [conv, ...prev])
    setCurrentId(conv.id)
    setSidebarOpen(false)
  }, [])

  const togglePin = useCallback((id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned: !(c as any).pinned } : c))
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!currentId) return
    setIsGenerating(true)

    const controller = new AbortController()
    abortRef.current = controller

    const userMsg: Message = { id: genId(), role: 'user', content, timestamp: Date.now() }

    setConversations(prev => prev.map(c =>
      c.id === currentId ? { ...c, messages: [...c.messages, userMsg], updatedAt: Date.now() } : c
    ))

    const conv = conversations.find(c => c.id === currentId)
    const history = conv ? conv.messages.map(m => ({ role: m.role, content: m.content })) : []
    const isFirst = !conv || conv.messages.length === 0

    const assistantId = genId()
    setConversations(prev => prev.map(c =>
      c.id === currentId ? {
        ...c,
        messages: [...c.messages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }],
        updatedAt: Date.now()
      } : c
    ))

    let full = ''

    try {
      for await (const data of streamChat(content, history, sessionId || undefined, controller.signal)) {
        if (data.error) {
          setConversations(prev => prev.map(c =>
            c.id === currentId ? { ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, content: `Error: ${data.error}` } : m) } : c
          ))
          setIsGenerating(false)
          return
        }
        if (data.sessionId) setSessionId(data.sessionId)
        if (data.content) {
          full += data.content
          setConversations(prev => prev.map(c =>
            c.id === currentId ? { ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, content: full } : m) } : c
          ))
        }
        if (data.title) {
          setConversations(prev => prev.map(c =>
            c.id === currentId ? { ...c, title: data.title! } : c
          ))
        }
        if (data.done) break
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // user stopped generation
      }
    } finally {
      abortRef.current = null
      setIsGenerating(false)
    }

    if (isFirst && full) {
      if (!conversations.find(c => c.id === currentId)?.title || conversations.find(c => c.id === currentId)?.title === 'New conversation') {
        const title = full.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/).slice(0, 5).join(' ')
        if (title) {
          setConversations(prev => prev.map(c =>
            c.id === currentId ? { ...c, title: title.length > 40 ? title.slice(0, 40) + '...' : title } : c
          ))
        }
      }
    }
  }, [currentId, conversations, sessionId])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsGenerating(false)
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const f = prev.filter(c => c.id !== id)
      if (currentId === id) setCurrentId(f[0]?.id || null)
      return f
    })
    showToast('Conversation deleted', 'success')
  }, [currentId, showToast])

  const clearConversations = useCallback(() => {
    setConversations([])
    setCurrentId(null)
    showToast('All conversations cleared', 'success')
  }, [showToast])

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }))
    showToast('Settings updated', 'success')
  }, [showToast])

  const exportConversation = useCallback((id: string): string => {
    const conv = conversations.find(c => c.id === id)
    if (!conv) return ''
    return conv.messages.map(m => `${m.role === 'user' ? 'You' : 'MAYDAY'}:\n${m.content}`).join('\n\n---\n\n')
  }, [conversations])

  const importConversation = useCallback((data: Conversation) => {
    setConversations(prev => [data, ...prev])
    setCurrentId(data.id)
  }, [])

  const editMessage = useCallback((convId: string, msgId: string, content: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: c.messages.map(m => m.id === msgId ? { ...m, content } : m) } : c
    ))
  }, [])

  const deleteMessage = useCallback((convId: string, msgId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: c.messages.filter(m => m.id !== msgId) } : c
    ))
  }, [])

  const retryLast = useCallback(() => {
    const conv = conversations.find(c => c.id === currentId)
    if (!conv || conv.messages.length < 2) return
    const lastUser = [...conv.messages].reverse().find(m => m.role === 'user')
    if (lastUser) sendMessage(lastUser.content)
  }, [currentId, conversations, sendMessage])

  return (
    <ChatContext.Provider value={{
      conversations, currentId, settings, isGenerating, sidebarOpen, searchQuery, sessionId, toast,
      setCurrentId, setSidebarOpen, setSearchQuery,
      sendMessage, stopGeneration, newConversation, deleteConversation, clearConversations,
      updateSettings, exportConversation, importConversation, showToast,
      editMessage, deleteMessage, retryLast, togglePin,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
