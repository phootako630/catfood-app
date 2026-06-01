import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { addCat, createDietPlan, joinHousehold } from '../lib/api'
import { Cat, Users } from 'lucide-react'

interface Props { onComplete: () => void }

export default function SetupPage({ onComplete }: Props) {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useLang()
  const [step, setStep] = useState<'choice' | 'new-cat' | 'join'>(
    profile?.household_id ? 'new-cat' : 'choice'
  )
  const [catName, setCatName] = useState('')
  const [dailyQuota, setDailyQuota] = useState('54')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile?.household_id) return
    setLoading(true); setError('')
    try {
      const cat = await addCat({ name: catName, household_id: profile.household_id })
      await createDietPlan({ cat_id: cat.id, daily_quota_g: parseFloat(dailyQuota), created_by: user.id })
      onComplete()
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true); setError('')
    try {
      await joinHousehold(inviteCode.trim(), user.id)
      await refreshProfile()
      onComplete()
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h2 className="text-xl font-bold text-center text-gray-800">{t.setup.welcome}</h2>
          <button onClick={() => setStep('new-cat')}
            className="w-full p-4 bg-white rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Cat className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">{t.setup.createFamily}</p>
              <p className="text-sm text-gray-500">{t.setup.createFamilyDesc}</p>
            </div>
          </button>
          <button onClick={() => setStep('join')}
            className="w-full p-4 bg-white rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">{t.setup.joinFamily}</p>
              <p className="text-sm text-gray-500">{t.setup.joinFamilyDesc}</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  if (step === 'join') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">{t.setup.joinFamily}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.setup.inviteCode}</label>
            <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-center text-lg tracking-widest"
              placeholder={t.setup.inviteCodePlaceholder} maxLength={8} required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50">
            {loading ? t.setup.joining : t.setup.join}
          </button>
          <button type="button" onClick={() => setStep('choice')} className="w-full text-sm text-gray-500">{t.common.back}</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <form onSubmit={handleCreateCat} className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">{t.setup.addCat}</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.setup.catName}</label>
          <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder={t.setup.catNamePlaceholder} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.setup.dailyQuota}</label>
          <input type="number" value={dailyQuota} onChange={e => setDailyQuota(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="54" min={1} step={0.5} required />
          <p className="text-xs text-gray-400 mt-1">{t.setup.dailyQuotaHint}</p>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50">
          {loading ? t.setup.creating : t.setup.startUsing}
        </button>
        {!profile?.household_id && (
          <button type="button" onClick={() => setStep('choice')} className="w-full text-sm text-gray-500">{t.common.back}</button>
        )}
      </form>
    </div>
  )
}
