import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = createRoot(document.getElementById('root')!)

// Without these the Supabase client throws on import and the page stays blank,
// so show a readable message instead (e.g. env vars not set on the host).
const missing = (['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const).filter(
  (key) => !import.meta.env[key],
)

if (missing.length > 0) {
  root.render(
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>配置缺失 · Missing configuration</h1>
      <p>Set these environment variables and rebuild: {missing.join(', ')}</p>
    </div>,
  )
} else {
  import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
