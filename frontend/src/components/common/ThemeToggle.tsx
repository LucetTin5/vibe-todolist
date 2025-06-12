import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../utils/cn'
import type { Theme } from '../../contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme()

  const toggleTheme = () => {
    setTheme((prev: Theme) => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  const getThemeIcon = () => {
    if (theme === 'system') {
      return actualTheme === 'dark' ? '🌙' : '☀️'
    }
    return theme === 'dark' ? '🌙' : '☀️'
  }

  const getThemeLabel = () => {
    if (theme === 'system') return `System (${actualTheme})`
    return theme === 'dark' ? 'Dark' : 'Light'
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        'bg-gray-100 hover:bg-gray-200 text-gray-700',
        'dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
      )}
      title={`Current theme: ${getThemeLabel()}. Click to cycle through themes.`}
    >
      <span className="text-base">{getThemeIcon()}</span>
      <span className="hidden sm:inline">{getThemeLabel()}</span>
    </button>
  )
}