const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('mayday_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function forceLogout() {
  localStorage.removeItem('mayday_token')
  localStorage.setItem('mayday_logout', Date.now().toString())
  window.location.href = '/'
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers as Record<string, string> || {}) } })
  if (res.status === 401) {
    forceLogout()
  }
  return res
}

export interface ChatStreamResult {
  content?: string
  done?: boolean
  error?: string
  sessionId?: string
  title?: string
}

export async function* streamChat(
  message: string,
  history: { role: string; content: string }[],
  sessionId?: string,
  signal?: AbortSignal
): AsyncGenerator<ChatStreamResult> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, history, session_id: sessionId }),
    signal,
  })

  if (response.status === 401) {
    forceLogout()
    yield { error: 'Session expired' }
    return
  }

  if (!response.ok) {
    yield { error: `Server error: ${response.status}` }
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    yield { error: 'No response stream available' }
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      try {
        const data: ChatStreamResult = JSON.parse(trimmed.slice(6))
        yield data
      } catch { }
    }
  }
}

export async function loginUser(identifier: string, password: string): Promise<{ token: string; user: { id: number; name: string; email: string; role: string } } | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password }),
    })
    if (res.ok) return await res.json()
    const body = await res.json().catch(() => ({}))
    return { error: body.detail || `Error ${res.status}` }
  } catch {
    return { error: 'Network error — check your connection' }
  }
}

export async function registerUser(name: string, email: string, password: string, confirmPassword: string): Promise<{ token: string; user: { id: number; name: string; email: string; role: string } } | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    })
    if (res.ok) return await res.json()
    const body = await res.json().catch(() => ({}))
    return { error: body.detail || `Error ${res.status}` }
  } catch {
    return { error: 'Network error — check your connection' }
  }
}

export async function getMe(): Promise<{ user: any } | null> {
  try {
    const res = await fetch(`${API_URL}/api/me`, { headers: authHeaders() })
    if (res.status === 401) {
      forceLogout()
      return null
    }
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function checkPasswordStrength(password: string): Promise<{ score: number; label: string; color: string; checks: string[] }> {
  try {
    const res = await fetch(`${API_URL}/api/password-strength?password=${encodeURIComponent(password)}`)
    if (!res.ok) return { score: 0, label: 'Weak', color: '#ef4444', checks: [] }
    return await res.json()
  } catch { return { score: 0, label: 'Weak', color: '#ef4444', checks: [] } }
}

export async function updateProfile(data: any): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/update-profile`, {
      method: 'POST', body: JSON.stringify(data),
    })
    return res.ok
  } catch { return false }
}

export async function getUsage(): Promise<{ used: number; limit: number; remaining: number } | null> {
  try {
    const res = await fetch(`${API_URL}/api/usage`, { headers: authHeaders() })
    if (res.status === 401) { forceLogout(); return null }
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/change-password`, {
      method: 'POST', body: JSON.stringify({ oldPassword, newPassword }),
    })
    return res.ok
  } catch { return false }
}

export async function deleteAccount(): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/delete-account`, { method: 'DELETE' })
    return res.ok
  } catch { return false }
}

export async function getAdminStats(): Promise<any> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/stats`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function getAdminUsers(): Promise<any> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/users`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function searchAdminUsers(q: string): Promise<any> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/users/search?q=${encodeURIComponent(q)}`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function deleteAdminUser(userId: number): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/users/${userId}`, { method: 'DELETE' })
    return res.ok
  } catch { return false }
}

export async function toggleUserStatus(userId: number): Promise<string | null> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/users/${userId}/toggle-status`, { method: 'POST' })
    if (!res.ok) return null
    const data = await res.json()
    return data.status
  } catch { return null }
}

export async function adminResetPassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
      method: 'POST', body: JSON.stringify({ newPassword }),
    })
    return res.ok
  } catch { return false }
}

export async function exportUsersCSV(): Promise<void> {
  const res = await authFetch(`${API_URL}/api/admin/export-users`)
  if (!res.ok) return
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'users.csv'; a.click()
  URL.revokeObjectURL(url)
}

export async function getMemories(): Promise<any> {
  try {
    const res = await authFetch(`${API_URL}/api/memories`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function addMemory(key: string, value: string, category?: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/memories`, {
      method: 'POST', body: JSON.stringify({ key, value, category }),
    })
    return res.ok
  } catch { return false }
}

export async function deleteMemory(memoryId: number): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/memories/${memoryId}`, { method: 'DELETE' })
    return res.ok
  } catch { return false }
}

export async function clearMemories(): Promise<boolean> {
  try {
    const res = await authFetch(`${API_URL}/api/memories`, { method: 'DELETE' })
    return res.ok
  } catch { return false }
}

export async function generateTitle(
  message: string,
  history: { role: string; content: string }[]
): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/generate-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    })
    if (!response.ok) return ''
    const data = await response.json()
    return data.title || ''
  } catch {
    return ''
  }
}

export async function newSession(): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/api/new-session`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (response.status === 401) {
      forceLogout()
      return ''
    }
    if (!response.ok) return ''
    const data = await response.json()
    return data.session?.id || ''
  } catch {
    return ''
  }
}

export async function getHistory(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/api/history`, { headers: authHeaders() })
    if (response.status === 401) {
      forceLogout()
      return []
    }
    if (!response.ok) return []
    const data = await response.json()
    return data.sessions || []
  } catch {
    return []
  }
}

export async function getSession(sessionId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/session/${sessionId}`, { headers: authHeaders() })
    if (response.status === 401) {
      forceLogout()
      return null
    }
    if (!response.ok) return null
    const data = await response.json()
    return data.session || null
  } catch {
    return null
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/session/${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (response.status === 401) {
      forceLogout()
      return false
    }
    return response.ok
  } catch {
    return false
  }
}
