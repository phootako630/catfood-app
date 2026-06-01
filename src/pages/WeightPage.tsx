import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { getCats, getWeightLogs, addWeightLog, getActiveDietPlan } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Cat, WeightLog, DietPlan } from '../types/database'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format } from 'date-fns'
import { Scale, Plus, Trash2 } from 'lucide-react'

export default function WeightPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const [cats, setCats] = useState<Cat[]>([])
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null)
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async (catId?: string) => {
    try {
      const catList = await getCats()
      setCats(catList)
      const current = catId ? catList.find(c => c.id === catId) : catList[0]
      if (current) {
        setSelectedCat(current)
        const [weightLogs, plan] = await Promise.all([
          getWeightLogs(current.id, 60),
          getActiveDietPlan(current.id),
        ])
        setLogs(weightLogs)
        setDietPlan(plan)
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
      .channel('weight-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_logs', filter: `cat_id=eq.${selectedCat.id}` },
        () => { loadData(selectedCat.id) }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedCat, loadData])

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedCat || !weightInput) return
    setSaving(true)
    try {
      await addWeightLog({ cat_id: selectedCat.id, weight_kg: parseFloat(weightInput), recorded_by: user.id })
      setWeightInput('')
      await loadData(selectedCat.id)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.weight.deleteConfirm)) return
    try {
      await supabase.from('weight_logs').delete().eq('id', id)
      await loadData(selectedCat?.id)
    } catch (err) {
      console.error(err)
    }
  }

  const chartData = logs.map(l => ({
    date: format(new Date(l.recorded_at), 'MM/dd'),
    weight: Number(l.weight_kg),
  }))

  const latestWeight = logs.length > 0 ? Number(logs[logs.length - 1].weight_kg) : null
  const targetWeight = dietPlan?.target_weight_kg ? Number(dietPlan.target_weight_kg) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600">{t.common.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-600" />
          {cats.length > 1 ? (
            <select value={selectedCat?.id} onChange={e => loadData(e.target.value)}
              className="font-bold text-gray-800 bg-transparent">
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          ) : (
            <h1 className="font-bold text-gray-800">{t.weight.title}</h1>
          )}
        </div>
        {latestWeight && (
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-800">{latestWeight}</span>
            <span className="text-sm text-gray-400 ml-1">{t.weight.kg}</span>
          </div>
        )}
      </div>

      {/* Weight Input */}
      <div className="px-4 py-4">
        <form onSubmit={handleRecord} className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.weight.addWeight}</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder={t.weight.weightPlaceholder}
              min={0.1}
              step={0.01}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4" />
              {saving ? t.weight.recording : t.weight.record}
            </button>
          </div>
          {targetWeight && (
            <p className="text-xs text-gray-400 mt-2">
              {t.weight.target}: {targetWeight} {t.weight.kg}
              {latestWeight && (
                <span className={latestWeight > targetWeight ? ' text-amber-500' : ' text-green-500'}>
                  {' '}({latestWeight > targetWeight ? '+' : ''}{(latestWeight - targetWeight).toFixed(2)})
                </span>
              )}
            </p>
          )}
        </form>
      </div>

      {/* Trend Chart */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.weight.trend}</p>
          {chartData.length < 2 ? (
            <p className="text-center text-gray-400 py-8 text-sm">{t.weight.noTrend}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={v => `${v}kg`} />
                <Tooltip formatter={(v: number) => [`${v} kg`, t.weight.title]}
                  labelStyle={{ color: '#6b7280' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                <Line type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
                {targetWeight && (
                  <ReferenceLine y={targetWeight} stroke="#10b981" strokeDasharray="6 3"
                    label={{ value: `${t.weight.target} ${targetWeight}kg`, position: 'right', fill: '#10b981', fontSize: 11 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Records */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t.weight.recent} <span className="text-gray-400">({logs.length})</span>
          </p>
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">{t.weight.noRecords}</p>
          ) : (
            <div className="space-y-2">
              {[...logs].reverse().slice(0, 20).map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-800">{Number(log.weight_kg)} {t.weight.kg}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {format(new Date(log.recorded_at), 'MM/dd HH:mm')}
                    </span>
                  </div>
                  {log.recorded_by === user?.id && (
                    <button onClick={() => handleDelete(log.id)}
                      className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
