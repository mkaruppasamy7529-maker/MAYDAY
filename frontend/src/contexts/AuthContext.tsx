import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { User, Page } from '../types'
import { loginUser, registerUser, getMe } from '../services/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  page: Page
  loading: boolean
  setPage: (page: Page) => void
  login: (identifier: string, password: string) => Promise<string | null>
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<string | null>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'mayday_token'
const LOGOUT_EVENT = 'mayday_logout'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [page, setPage] = useState<Page>('login')
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    setPage('login')
    localStorage.setItem(LOGOUT_EVENT, Date.now().toString())
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const saved = localStorage.getItem(TOKEN_KEY)
      if (!saved) {
        setToken(null)
        setUser(null)
        setPage('login')
        return
      }
      setToken(saved)
      const data = await getMe()
      if (data) {
        setUser(data.user as User)
      } else {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
        setToken(null)
        setPage('login')
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
      setToken(null)
      setPage('login')
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY)
    if (saved) {
      setToken(saved)
      getMe().then(data => {
        if (data) {
          setUser(data.user as User)
          setPage('chat')
        } else {
          localStorage.removeItem(TOKEN_KEY)
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  // Cross-tab sync: force logout when another tab logs out
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        setUser(null)
        setToken(null)
        setPage('login')
      }
      if (e.key === LOGOUT_EVENT) {
        setUser(null)
        setToken(null)
        setPage('login')
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const login = useCallback(async (identifier: string, password: string): Promise<string | null> => {
    const result = await loginUser(identifier, password)
    if ('error' in result) return result.error
    setUser(result.user as User)
    setToken(result.token)
    localStorage.setItem(TOKEN_KEY, result.token)
    setPage(result.user.role === 'admin' ? 'admin' : 'chat')
    return null
  }, [])

  const register = useCallback(async (name: string, email: string, password: string, confirmPassword: string): Promise<string | null> => {
    const result = await registerUser(name, email, password, confirmPassword)
    if ('error' in result) return result.error
    setUser(result.user as User)
    setToken(result.token)
    localStorage.setItem(TOKEN_KEY, result.token)
    setPage(result.user.role === 'admin' ? 'admin' : 'chat')
    return null
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, page, loading, setPage, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
