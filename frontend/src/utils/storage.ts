import { Conversation, AppSettings } from '../types'

const CONVERSATIONS_KEY = 'mayday_conversations'
const SETTINGS_KEY = 'mayday_settings'

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
  } catch { }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { }
  return { theme: 'dark', fontSize: 'base' }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch { }
}

export function exportConversation(conversation: Conversation): string {
  const text = conversation.messages
    .map(m => `${m.role === 'user' ? 'You' : 'MAYDAY'}:\n${m.content}`)
    .join('\n\n---\n\n')
  return text
}

export function importConversation(text: string): Conversation | null {
  try {
    const data = JSON.parse(text)
    if (data.id && data.messages) return data as Conversation
  } catch { }
  return null
}
