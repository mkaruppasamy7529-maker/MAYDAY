export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  pinned?: boolean
}

export interface ChatStreamData {
  content?: string
  done?: boolean
  error?: string
}

export interface AppSettings {
  theme: 'dark' | 'light'
  fontSize: 'sm' | 'base' | 'lg'
  accentColor?: string
  animationsEnabled?: boolean
}

export interface User {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  status?: string
  emailVerified?: boolean
  theme?: string
  accentColor?: string
  fontSize?: string
  animationsEnabled?: boolean
  memoryEnabled?: boolean
  createdAt?: string
  lastLogin?: string
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  status: string
  email_verified: number
  created_at: string
  last_login: string | null
  suspended_until?: string | null
  daily_limit?: number | null
}

export interface Memory {
  id: number
  key: string
  value: string
  category: string
  created_at: string
  updated_at: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  newToday: number
  totalConversations: number
  totalMessages: number
  onlineNow: number
}

export type Page = 'login' | 'register' | 'admin' | 'chat' | 'about' | 'memory'
