import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { addCat, createDietPlan, joinHousehold } from '../lib/api'
import { Cat, Users } from 'lucide-react'

interface Props {
  onComplete: () => void
}

export default function SetupPage({ onComplete }: Props) {
  const { user, profile, refreshProfile } = useAuth()
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
    setLoading(true)
    setError('')
    try {
      const cat = await addCat({
        name: catName,
        household_id: profile.household_id,
      })
      await createDietPlan({
        cat_id: cat.id,
        daily_quota_g: parseFloat(dailyQuota),
        created_by: user.id,
      })
      onComplete()
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      await joinHousehold(inviteCode.trim(), user.id)
      await refreshProfile()
      onComplete()
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h2 className="text-xl font-bold text-center text-gray-800">欢迎！你要怎么开始？</h2>
          <button
            onClick={() => setStep('new-cat')}
            className="w-full p-4 bg-white rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Cat className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">创建新家庭</p>
              <p className="text-sm text-gray-500">添加你的猫，开始记录</p>
            </div>
          </button>
          <button
            onClick={() => setStep('join')}
            className="w-full p-4 bg-white rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">加入家庭</p>
              <p className="text-sm text-gray-500">输入邀请码，和家人一起管理</p>
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
          <h2 className="text-xl font-bold text-gray-800">加入家庭</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邀请码</label>
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-center text-lg tracking-widest"
              placeholder="8位邀请码"
              maxLength={8}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50">
            {loading ? '加入中...' : '加入'}
          </button>
          <button type="button" onClick={() => setStep('choice')} className="w-full text-sm text-gray-500">
            返回
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <form onSubmit={handleCreateCat} className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">添加你的猫</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">猫咪名字</label>
          <input
            type="text"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="如：橘子"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">每日配额 (g)</label>
          <input
            type="number"
            value={dailyQuota}
            onChange={e => setDailyQuota(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="54"
            min={1}
            step={0.5}
            required
          />
          <p className="text-xs text-gray-400 mt-1">医生建议的每日猫粮总量</p>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50">
          {loading ? '创建中...' : '开始使用'}
        </button>
        {!profile?.household_id && (
          <button type="button" onClick={() => setStep('choice')} className="w-full text-sm text-gray-500">
            返回
          </button>
        )}
      </form>
    </div>
  )
}
