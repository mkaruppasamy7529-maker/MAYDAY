import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { checkPasswordStrength } from '../services/api'

export default function RegisterPage() {
  const { register, setPage } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [strength, setStrength] = useState({ score: 0, label: '', color: '#ef4444', checks: [] as string[] })

  useEffect(() => {
    if (password) {
      checkPasswordStrength(password).then(setStrength)
    } else {
      setStrength({ score: 0, label: '', color: '#ef4444', checks: [] })
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!email.includes('@')) { setError('Valid email required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setBusy(true)
    const err = await register(name, email, password, confirm)
    if (err) setError(err)
    setBusy(false)
  }

  const strengthColors = ['#ef4444', '#ef4444', '#eab308', '#22c55e', '#6366f1']
  const strengthLabels = ['', 'Weak', 'Medium', 'Strong', 'Very Strong']

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-cyan-500/20">
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AVIOS</h1>
          <p className="text-gray-500 text-sm mt-1">Your Personal AI Assistant</p>
        </div>
        <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] space-y-3 shadow-2xl">
          <h2 className="text-lg font-semibold text-white">Create Account</h2>
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
          <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" required />
          <div>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" required />
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? '' : 'bg-white/5'}`}
                      style={{ backgroundColor: i <= strength.score ? strength.color : undefined }} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>{strengthLabels[strength.score]}</p>
              </div>
            )}
          </div>
          <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)}
            className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" required />
          <button type="submit" disabled={busy}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-500/20">
            {busy ? 'Creating Account...' : 'Sign Up'}
          </button>
          <p className="text-gray-500 text-xs text-center">
            Already have an account?{' '}
            <button type="button" onClick={() => setPage('login')} className="text-cyan-400 hover:underline">Sign In</button>
          </p>
        </form>
      </div>
    </div>
  )
}
