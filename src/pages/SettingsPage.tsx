import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { getHousehold, getHouseholdMembers } from '../lib/api'
import type { Profile } from '../types/database'
import { Copy, Check, LogOut, Users, Globe } from 'lucide-react'

export default function SettingsPage() {
  const { profile, signOut } = useAuth()
  const { t, lang, setLang } = useLang()
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
    <div className="min-h-screen bg-amber-50 pb-20">
      <div className="bg-white px-4 py-3 shadow-sm">
        <h1 className="font-bold text-gray-800">{t.settings.title}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">{t.settings.myInfo}</p>
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

        {/* Language */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">{t.settings.language}</p>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setLang('zh')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${lang === 'zh' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}>
                中文
              </button>
              <button onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${lang === 'en' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}>
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Invite Code */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">{t.settings.inviteFamily}</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">{t.settings.inviteDesc}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-gray-800">
              {inviteCode}
            </div>
            <button onClick={handleCopy}
              className="p-3 bg-amber-50 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.settings.members} ({members.length})</p>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-bold">
                  {m.display_name[0]}
                </div>
                <span className="text-gray-700">{m.display_name}</span>
                {m.id === profile?.id && (
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{t.settings.me}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button onClick={signOut}
          className="w-full py-3 bg-white rounded-2xl shadow-sm text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          {t.settings.logout}
        </button>
      </div>
    </div>
  )
}
