import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getHousehold, getHouseholdMembers } from '../lib/api'
import type { Profile } from '../types/database'
import { ArrowLeft, Copy, Check, LogOut, Users } from 'lucide-react'

interface Props {
  onBack: () => void
}

export default function SettingsPage({ onBack }: Props) {
  const { profile, signOut } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [members, setMembers] = useState<Profile[]>([])
  const [copied, setCopied] = useState(false)
  const [householdName, setHouseholdName] = useState('')

  useEffect(() => {
    if (!profile?.household_id) return
    Promise.all([
      getHousehold(profile.household_id),
      getHouseholdMembers(profile.household_id),
    ]).then(([h, m]) => {
      setInviteCode(h.invite_code)
      setHouseholdName(h.name)
      setMembers(m)
    })
  }, [profile])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="p-1 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-800">设置</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">我的信息</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold">
              {profile?.display_name?.[0] ?? '?'}
            </div>
            <div>
              <p className="font-medium text-gray-800">{profile?.display_name}</p>
              <p className="text-xs text-gray-400">{householdName}</p>
            </div>
          </div>
        </div>

        {/* Invite Code */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">邀请家人</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">分享邀请码，家人注册后输入即可加入</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-gray-800">
              {inviteCode}
            </div>
            <button
              onClick={handleCopy}
              className="p-3 bg-amber-50 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">家庭成员 ({members.length})</p>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-bold">
                  {m.display_name[0]}
                </div>
                <span className="text-gray-700">{m.display_name}</span>
                {m.id === profile?.id && (
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">我</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full py-3 bg-white rounded-2xl shadow-sm text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </div>
  )
}
