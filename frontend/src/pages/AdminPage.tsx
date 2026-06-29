import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAdminStats, getAdminUsers, searchAdminUsers, deleteAdminUser, adminResetPassword, exportUsersCSV } from '../services/api'
import { AdminStats, AdminUser } from '../types'

export default function AdminPage() {
  const { user, logout, setPage } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'overview' | 'users'>('overview')
  const [actionMsg, setActionMsg] = useState('')
  const [resetPw, setResetPw] = useState<{ userId: number; username: string } | null>(null)
  const [newPw, setNewPw] = useState('')
  const [suspend, setSuspend] = useState<{ userId: number; username: string } | null>(null)
  const [suspendValue, setSuspendValue] = useState(30)
  const [suspendUnit, setSuspendUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days' | 'permanent'>('minutes')
  const [limitEdit, setLimitEdit] = useState<{ userId: number; username: string; current: number | null | undefined } | null>(null)
  const [limitValue, setLimitValue] = useState('')

  const load = async () => {
    setLoading(true)
    const [s, u] = await Promise.all([getAdminStats(), getAdminUsers()])
    if (s) setStats(s)
    if (u) setUsers(u.users)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'avios_logout' || e.key === 'avios_token') load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { load(); return }
    const data = await searchAdminUsers(q)
    if (data) setUsers(data.users)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    const ok = await deleteAdminUser(id)
    setActionMsg(ok ? `User ${name} deleted` : 'Failed to delete')
    if (ok) load()
  }

  const handleSuspend = async () => {
    if (!suspend) return
    const action = suspendUnit === 'permanent' ? 'permanent' : 'suspend'
    const body = action === 'permanent'
      ? JSON.stringify({ action: 'permanent' })
      : JSON.stringify({ action: 'suspend', value: suspendValue, unit: suspendUnit })
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/users/${suspend.userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('avios_token')}` },
        body,
      })
      const data = await res.json()
      setActionMsg(data.message || (res.ok ? 'Done' : 'Failed'))
      setSuspend(null)
      if (res.ok) load()
    } catch {
      setActionMsg('Network error')
      setSuspend(null)
    }
  }

  const handleSetLimit = async () => {
    if (!limitEdit) return
    const val = limitValue === '' ? null : parseInt(limitValue)
    if (val !== null && (isNaN(val) || val < 1)) { setActionMsg('Enter a positive number or leave empty for default'); return }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/users/${limitEdit.userId}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('avios_token')}` },
        body: JSON.stringify({ limit: val }),
      })
      const data = await res.json()
      setActionMsg(data.message || (res.ok ? 'Done' : 'Failed'))
      setLimitEdit(null)
      if (res.ok) load()
    } catch {
      setActionMsg('Network error')
      setLimitEdit(null)
    }
  }

  const handleResetPw = async () => {
    if (!resetPw || newPw.length < 8) return
    const ok = await adminResetPassword(resetPw.userId, newPw)
    setActionMsg(ok ? 'Password reset successful' : 'Failed to reset password')
    setResetPw(null); setNewPw('')
  }

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050508]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] backdrop-blur-xl bg-[#050508]/50">
        <h1 className="text-xl font-bold text-white">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Admin</span>
          <span className="text-white/40"> Panel</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">@{user?.name}</span>
          <button onClick={() => setPage('chat')} className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg text-sm transition-all">Chat</button>
          <button onClick={logout} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-all">Logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 backdrop-blur-xl bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] w-fit">
          <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'overview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>Overview</button>
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'users' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>Users</button>
        </div>

        {actionMsg && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-lg text-sm flex justify-between">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg('')} className="text-gray-400 hover:text-white">x</button>
          </div>
        )}

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total Users" value={stats?.totalUsers ?? '...'} color="#22d3ee" />
              <StatCard label="Active Users" value={stats?.activeUsers ?? '...'} color="#22c55e" />
              <StatCard label="New Today" value={stats?.newToday ?? '...'} color="#eab308" />
              <StatCard label="Conversations" value={stats?.totalConversations ?? '...'} color="#6366f1" />
              <StatCard label="Messages" value={stats?.totalMessages ?? '...'} color="#a855f7" />
              <StatCard label="Online Now" value={stats?.onlineNow ?? '...'} color="#22d3ee" />
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] flex flex-wrap gap-3 items-center">
              <input type="text" placeholder="Search users..." value={search} onChange={e => handleSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm" />
              <button onClick={exportUsersCSV} className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl text-sm transition-all">Export CSV</button>
              <button onClick={() => load()} className="px-3 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-sm transition-all">Refresh</button>
            </div>
            {loading ? (
              <p className="p-6 text-gray-500 text-sm text-center">Loading...</p>
            ) : users.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm text-center">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Daily Limit</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Suspended Until</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Signed Up</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const isSuspended = u.status === 'suspended'
                      const susUntil = u.suspended_until ? new Date(u.suspended_until).toLocaleString() : ''
                      const statusColor = u.status === 'active' ? 'bg-green-500/10 text-green-400' : isSuspended ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                      return (
                      <tr key={u.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-gray-400">{u.id}</td>
                        <td className="px-4 py-3 text-white">{u.name}</td>
                        <td className="px-4 py-3 text-gray-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>{u.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-xs">{u.daily_limit ?? 'default'}</span>
                            <button onClick={() => { setLimitEdit({ userId: u.id, username: u.name, current: u.daily_limit }); setLimitValue(u.daily_limit?.toString() || '') }}
                              className="px-1.5 py-0.5 bg-white/[0.06] hover:bg-white/[0.1] text-gray-500 hover:text-white rounded text-[10px] transition-all">edit</button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{susUntil || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {u.role !== 'admin' && (
                              <>
                                <button onClick={() => setSuspend({ userId: u.id, username: u.name })} className="px-2 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg text-xs transition-all">
                                  {u.status === 'disabled' ? 'Blocked' : 'Suspend'}
                                </button>
                                <button onClick={() => setResetPw({ userId: u.id, username: u.name })} className="px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs transition-all">Reset PW</button>
                                <button onClick={() => handleDelete(u.id, u.name)} className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-all">Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {suspend && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSuspend(null)}>
          <div className="backdrop-blur-xl bg-[#0a0a12] rounded-2xl border border-white/[0.06] p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Suspend User</h3>
            <p className="text-gray-400 text-sm mb-4">Action for <span className="text-white">{suspend.username}</span></p>

            <div className="flex gap-2 mb-4">
              {['seconds', 'minutes', 'hours', 'days', 'permanent'].map(u => (
                <button key={u} onClick={() => { setSuspendUnit(u as any); if (u === 'permanent') setSuspendValue(0) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${suspendUnit === u ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.06] text-gray-400 hover:text-white'}`}>{u}</button>
              ))}
            </div>

            {suspendUnit !== 'permanent' && (
              <input type="number" min={1} value={suspendValue} onChange={e => setSuspendValue(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm mb-4" />
            )}

            <div className="flex gap-2">
              <button onClick={() => setSuspend(null)} className="flex-1 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-sm">Cancel</button>
              <button onClick={handleSuspend} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-xl text-sm">
                {suspendUnit === 'permanent' ? 'Block Permanently' : `Suspend for ${suspendValue} ${suspendUnit}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Edit Modal */}
      {limitEdit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setLimitEdit(null)}>
          <div className="backdrop-blur-xl bg-[#0a0a12] rounded-2xl border border-white/[0.06] p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Daily Message Limit</h3>
            <p className="text-gray-400 text-sm mb-4">For <span className="text-white">{limitEdit.username}</span> (current: {limitEdit.current ?? 'default'})</p>
            <input type="number" min={1} placeholder="Leave empty for default" value={limitValue} onChange={e => setLimitValue(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setLimitEdit(null)} className="flex-1 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-sm">Cancel</button>
              <button onClick={handleSetLimit} className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPw && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setResetPw(null)}>
          <div className="backdrop-blur-xl bg-[#0a0a12] rounded-2xl border border-white/[0.06] p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Reset Password</h3>
            <p className="text-gray-400 text-sm mb-4">New password for <span className="text-white">{resetPw.username}</span></p>
            <input type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={e => setNewPw(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setResetPw(null)} className="flex-1 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-xl text-sm">Cancel</button>
              <button onClick={handleResetPw} disabled={newPw.length < 8} className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl text-sm">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
