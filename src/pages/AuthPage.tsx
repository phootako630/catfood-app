import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { Cat } from 'lucide-react'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const { t, lang, setLang } = useLang()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, displayName)
    if (result.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="text-sm text-gray-400 hover:text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-3">
            <Cat className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t.app.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{t.app.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.nickname}</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder={t.auth.nicknamePlaceholder} required={!isLogin} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="email@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder={t.auth.passwordHint} required minLength={6} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors">
            {loading ? t.auth.processing : isLogin ? t.auth.login : t.auth.register}
          </button>
          <p className="text-center text-sm text-gray-500">
            {isLogin ? t.auth.noAccount : t.auth.hasAccount}
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="text-amber-600 font-medium ml-1">
              {isLogin ? t.auth.register : t.auth.login}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
