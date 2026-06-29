import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingScreen from './components/LoadingScreen'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import AboutPage from './pages/AboutPage'
import MemoryPage from './pages/MemoryPage'
import Toast from './components/Toast'
import OfflineBanner from './components/OfflineBanner'

function AppContent() {
  const { page, loading } = useAuth()
  const [splash, setSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 3500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return null

  if (page === 'login') return <LoginPage />
  if (page === 'register') return <RegisterPage />
  if (page === 'admin') return <AdminPage />
  if (page === 'about') return <AboutPage />
  if (page === 'memory') return <MemoryPage />

  return (
    <ChatProvider>
      <OfflineBanner />
      {splash ? <LoadingScreen onFinish={() => setSplash(false)} /> : <Dashboard />}
      <Toast />
    </ChatProvider>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}
