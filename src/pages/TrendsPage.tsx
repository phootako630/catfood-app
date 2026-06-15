import { useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { getCats, getActiveDietPlan, getFeedingTrend, getWeightLogs } from '../lib/api'
import type { Cat, DietPlan, WeightLog } from '../types/database'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { format } from 'date-fns'

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

type FeedingPoint = { date: string; total_g: number }
type WeightPoint  = { date: string; weight_kg: number }

const RANGE_OPTIONS = [7, 14, 30] as const
type Range = typeof RANGE_OPTIONS[number]

export default function TrendsPage() {
  const { t } = useLang()
  const [cats, setCats]           = useState<Cat[]>([])
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null)
  const [dietPlan, setDietPlan]   = useState<DietPlan | null>(null)
  const [feedingData, setFeedingData] = useState<FeedingPoint[]>([])
  const [weightData, setWeightData]   = useState<WeightPoint[]>([])
  const [range, setRange]         = useState<Range>(14)
  const [loading, setLoading]     = useState(true)

  const loadData = useCallback(async (catId?: string, days: Range = 14) => {
    setLoading(true)
    try {
      const catList = await getCats()
      setCats(catList)
      const current = catId ? catList.find(c => c.id === catId) : catList[0]
      if (!current) return
      setSelectedCat(current)
      const [plan, feeding, weightLogs] = await Promise.all([
        getActiveDietPlan(current.id),
        getFeedingTrend(current.id, days, TIMEZONE),
        getWeightLogs(current.id, 90),
      ])
      setDietPlan(plan)
      setFeedingData(feeding)
      setWeightData(
        (weightLogs as WeightLog[]).map(w => ({
          date: format(new Date(w.recorded_at), 'yyyy-MM-dd'),
          weight_kg: Number(w.weight_kg),
        }))
      )
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData(undefined, range) }, [loadData, range])

  const quota = dietPlan?.daily_quota_g ?? null
  const target = dietPlan?.target_weight_kg ?? null

  // Short label for x-axis: "06/01"
  const fmtDate = (d: string) => d.slice(5).replace('-', '/')

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-amber-600">🐱</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-gray-800">{t.trends.title}</h1>
        {cats.length > 1 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {cats.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCat(c); loadData(c.id, range) }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCat?.id === c.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Range selector */}
      <div className="flex gap-2 px-4 pt-4">
        {RANGE_OPTIONS.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              range === r
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-500 shadow-sm'
            }`}
          >
            {r}{t.trends.days}
          </button>
        ))}
      </div>

      {/* Feeding Trend */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">{t.trends.feedingTitle}</p>
          {quota && (
            <p className="text-xs text-gray-400 mb-3">
              {t.trends.quota}: {quota}g
            </p>
          )}
          {feedingData.every(d => d.total_g === 0) ? (
            <p className="text-center text-gray-400 py-8 text-sm">{t.trends.noData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={feedingData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval={range === 7 ? 0 : range === 14 ? 1 : 4}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="g" />
                <Tooltip
                  formatter={(v: unknown) => [`${v}g`, t.trends.fed]}
                  labelFormatter={(d: unknown) => fmtDate(String(d))}
                />
                {quota && (
                  <ReferenceLine
                    y={quota}
                    stroke="#f59e0b"
                    strokeDasharray="4 3"
                    label={{ value: `${quota}g`, position: 'right', fontSize: 10, fill: '#f59e0b' }}
                  />
                )}
                <Bar dataKey="total_g" radius={[4, 4, 0, 0]}>
                  {feedingData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={quota && entry.total_g > quota ? '#ef4444' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="flex gap-4 mt-2 justify-end">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />{t.trends.normal}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />{t.trends.over}
            </span>
          </div>
        </div>
      </div>

      {/* Weight Trend */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">{t.trends.weightTitle}</p>
          {target && (
            <p className="text-xs text-gray-400 mb-3">
              {t.trends.targetWeight}: {target}kg
            </p>
          )}
          {weightData.length < 2 ? (
            <p className="text-center text-gray-400 py-8 text-sm">{t.trends.weightNoData}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  unit="kg"
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(v: unknown) => [`${v}kg`, t.trends.weight]}
                  labelFormatter={(d: unknown) => fmtDate(String(d))}
                />
                {target && (
                  <ReferenceLine
                    y={target}
                    stroke="#10b981"
                    strokeDasharray="4 3"
                    label={{ value: `${target}kg`, position: 'right', fontSize: 10, fill: '#10b981' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight_kg"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f97316' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
