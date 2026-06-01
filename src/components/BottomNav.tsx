import { Utensils, Weight, Settings } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

export type Page = 'dashboard' | 'weight' | 'settings'

interface Props {
  current: Page
  onChange: (page: Page) => void
}

const tabs: { key: Page; icon: typeof Utensils; labelKey: 'feeding' | 'weight' | 'settings' }[] = [
  { key: 'dashboard', icon: Utensils, labelKey: 'feeding' },
  { key: 'weight', icon: Weight, labelKey: 'weight' },
  { key: 'settings', icon: Settings, labelKey: 'settings' },
]

export default function BottomNav({ current, onChange }: Props) {
  const { t } = useLang()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50">
      {tabs.map(({ key, icon: Icon, labelKey }) => {
        const active = current === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 ${active ? 'text-amber-600' : 'text-gray-400'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{t.nav[labelKey]}</span>
          </button>
        )
      })}
    </nav>
  )
}
