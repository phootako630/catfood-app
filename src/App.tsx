import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import { getCats } from './lib/api'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const [page, setPage] = useState<'dashboard' | 'settings' | 'setup'>('dashboard')
  const [hasCats, setHasCats] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user || !profile?.household_id) return
    getCats().then(cats => {
      setHasCats(cats.length > 0)
      if (cats.length === 0) setPage('setup')
    }).catch(() => setHasCats(false))
  }, [user, profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600 text-lg">🐱 加载中...</div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (!profile?.household_id || hasCats === false) {
    return (
      <SetupPage
        onComplete={() => {
          setHasCats(true)
          setPage('dashboard')
        }}
      />
    )
  }

  if (hasCats === null) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600">加载中...</div>
      </div>
    )
  }

  if (page === 'settings') {
    return <SettingsPage onBack={() => setPage('dashboard')} />
  }

  return <DashboardPage onOpenSettings={() => setPage('settings')} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
