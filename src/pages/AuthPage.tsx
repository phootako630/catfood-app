import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Cat } from 'lucide-react'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-3">
            <Cat className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">喵粮管家</h1>
          <p className="text-gray-500 text-sm mt-1">精准控粮，科学减重</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="你的昵称"
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="至少6位"
              required
              minLength={6}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>

          <p className="text-center text-sm text-gray-500">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="text-amber-600 font-medium ml-1"
            >
              {isLogin ? '注册' : '登录'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
