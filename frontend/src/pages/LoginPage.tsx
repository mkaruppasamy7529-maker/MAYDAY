import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login, setPage } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const err = await login(identifier, password)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-cyan-500/20">
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MAYDAY</h1>
          <p className="text-gray-500 text-sm mt-1">Your Personal AI Assistant</p>
        </div>
        <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] space-y-4 shadow-2xl">
          <h2 className="text-lg font-semibold text-white">Welcome Back</h2>
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
          <input
            type="text"
            placeholder="Username or Email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-gray-500 text-xs text-center">
            Don't have an account?{' '}
            <button type="button" onClick={() => setPage('register')} className="text-cyan-400 hover:underline">
              Create one
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
