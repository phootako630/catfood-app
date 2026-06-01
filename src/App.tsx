import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider, useLang } from './i18n/LanguageContext'
import AuthPage from './pages/AuthPage'
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import WeightPage from './pages/WeightPage'
import SettingsPage from './pages/SettingsPage'
import BottomNav, { type Page } from './components/BottomNav'
import { getCats } from './lib/api'

function AppContent() {
  const { user, profile, loading } = useAuth()
  const { t } = useLang()
  const [page, setPage] = useState<Page | 'setup'>('dashboard')
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
        <div className="animate-pulse text-amber-600 text-lg">🐱 {t.common.loading}</div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  if (!profile?.household_id || hasCats === false) {
    return (
      <SetupPage onComplete={() => { setHasCats(true); setPage('dashboard') }} />
    )
  }

  if (hasCats === null) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'weight' && <WeightPage />}
      {page === 'settings' && <SettingsPage />}
      <BottomNav current={page as Page} onChange={setPage} />
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  )
}
