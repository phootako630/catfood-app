import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { getCats, getActiveDietPlan, getTodayFeedings, addFeeding, deleteFeeding } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Cat, DietPlan, FeedingLog } from '../types/database'
import { Plus, Undo2, Clock } from 'lucide-react'
import { format } from 'date-fns'

type FeedingWithProfile = FeedingLog & { profiles: { display_name: string } | null }

const QUICK_AMOUNTS = [3, 5, 8, 10, 15]

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const [cats, setCats] = useState<Cat[]>([])
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null)
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null)
  const [feedings, setFeedings] = useState<FeedingWithProfile[]>([])
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedingLoading, setFeedingLoading] = useState(false)

  const loadData = useCallback(async (catId?: string) => {
    try {
      const catList = await getCats()
      setCats(catList)
      const current = catId ? catList.find(c => c.id === catId) : catList[0]
      if (current) {
        setSelectedCat(current)
        const [plan, logs] = await Promise.all([
          getActiveDietPlan(current.id),
          getTodayFeedings(current.id),
        ])
        setDietPlan(plan)
        setFeedings(logs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!selectedCat) return
    const channel = supabase
      .channel('feeding-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feeding_logs', filter: `cat_id=eq.${selectedCat.id}` },
        () => { loadData(selectedCat.id) }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedCat, loadData])

  const totalFed = feedings.reduce((sum, f) => sum + Number(f.amount_g), 0)
  const quota = dietPlan?.daily_quota_g ?? 0
  const remaining = Math.max(0, quota - totalFed)
  const progress = quota > 0 ? Math.min(100, (totalFed / quota) * 100) : 0
  const isOver = totalFed > quota

  const handleFeed = async (amount: number) => {
    if (!user || !selectedCat || amount <= 0) return
    setFeedingLoading(true)
    try {
      await addFeeding({ cat_id: selectedCat.id, amount_g: amount, fed_by: user.id })
      await loadData(selectedCat.id)
      setCustomAmount('')
    } catch (err) { console.error(err) }
    setFeedingLoading(false)
  }

  const handleUndo = async (feedingId: string) => {
    try {
      await deleteFeeding(feedingId)
      await loadData(selectedCat?.id)
    } catch (err) { console.error(err) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600">{t.common.loading}</div>
      </div>
    )
  }

  if (!selectedCat || !dietPlan) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <p className="text-gray-500">{t.common.noData}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 shadow-sm">
        <span className="text-xl">🐱</span>
        {cats.length > 1 ? (
          <select value={selectedCat.id} onChange={e => loadData(e.target.value)}
            className="font-bold text-gray-800 bg-transparent">
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <h1 className="font-bold text-gray-800">{selectedCat.name}</h1>
        )}
      </div>

      {/* Progress Ring */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#fef3c7" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={isOver ? '#ef4444' : '#f59e0b'} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${progress * 3.267} 326.7`}
                  className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{totalFed}g</span>
                <span className="text-sm text-gray-400">/ {quota}g</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            {isOver ? (
              <p className="text-red-500 font-medium">⚠️ {t.dashboard.overBy} {(totalFed - quota).toFixed(1)}g</p>
            ) : (
              <p className="text-gray-500">{t.dashboard.remaining} <span className="font-bold text-amber-600">{remaining.toFixed(1)}g</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Feed */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.dashboard.quickFeed}</p>
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map(amount => (
              <button key={amount} onClick={() => handleFeed(amount)} disabled={feedingLoading}
                className="flex-1 min-w-[60px] py-3 bg-amber-50 rounded-xl text-amber-700 font-bold text-lg hover:bg-amber-100 active:scale-95 transition-all disabled:opacity-50">
                +{amount}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
              placeholder={t.dashboard.customPlaceholder} min={0.5} step={0.5}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <button onClick={() => handleFeed(parseFloat(customAmount))}
              disabled={feedingLoading || !customAmount || parseFloat(customAmount) <= 0}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Today Timeline */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t.dashboard.todayLog} <span className="text-gray-400">({feedings.length}{t.dashboard.times})</span>
          </p>
          {feedings.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">{t.dashboard.noFeedings}</p>
          ) : (
            <div className="space-y-2">
              {feedings.map(f => (
                <div key={f.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-800">+{Number(f.amount_g)}g</span>
                      <span className="text-xs text-gray-400 ml-2">{format(new Date(f.fed_at), 'HH:mm')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{f.profiles?.display_name ?? t.dashboard.unknown}</span>
                    {f.fed_by === user?.id && (
                      <button onClick={() => handleUndo(f.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors" title={t.dashboard.undo}>
                        <Undo2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
