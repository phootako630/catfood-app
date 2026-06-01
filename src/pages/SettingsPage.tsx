import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { getHousehold, getHouseholdMembers, updateProfile } from '../lib/api'
import { useToast } from '../components/Toast'
import type { Profile } from '../types/database'
import { Copy, Check, LogOut, Users, Globe, Pencil, X, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { t, lang, setLang } = useLang()
  const { show: showToast, ToastElement } = useToast()
  const [inviteCode, setInviteCode] = useState('')
  const [members, setMembers] = useState<Profile[]>([])
  const [copied, setCopied] = useState(false)
  const [householdName, setHouseholdName] = useState('')

  // Name editing
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

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

  const startEditName = () => {
    setNameInput(profile?.display_name ?? '')
    setEditingName(true)
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  const cancelEditName = () => {
    setEditingName(false)
    setNameInput('')
  }

  const saveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed) {
      showToast(t.settings.nameEmpty, 'error')
      return
    }
    if (trimmed === profile?.display_name) {
      setEditingName(false)
      return
    }
    if (!user) return
    setNameSaving(true)
    try {
      await updateProfile(user.id, { display_name: trimmed })
      await refreshProfile()
      setEditingName(false)
      showToast(t.settings.nameUpdated, 'success')
    } catch (err: any) {
      showToast(err.message || 'Error', 'error')
    }
    setNameSaving(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); saveName() }
    if (e.key === 'Escape') cancelEditName()
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-20">
      {ToastElement}

      <div className="bg-white px-4 py-3 shadow-sm">
        <h1 className="font-bold text-gray-800">{t.settings.title}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.settings.myInfo}</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold shrink-0">
              {(editingName ? nameInput : profile?.display_name)?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input ref={nameRef} type="text" value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    placeholder={t.settings.namePlaceholder}
                    maxLength={30}
                    className="flex-1 min-w-0 px-2.5 py-1.5 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button onClick={saveName} disabled={nameSaving}
                    className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors">
                    {nameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={cancelEditName}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{profile?.display_name}</p>
                  <button onClick={startEditName}
                    className="p-1 text-gray-300 hover:text-amber-500 transition-colors shrink-0"
                    title={t.settings.editName}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{householdName}</p>
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
