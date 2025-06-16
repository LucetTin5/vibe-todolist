import { useLocation } from 'react-router-dom'
import { AppHeader } from './components/common'
import { AppRoutes } from './routes'

// URL 경로에서 뷰 모드 추출
const getViewModeFromPath = (pathname: string) => {
  if (pathname.startsWith('/todos')) return 'todos'
  if (pathname.startsWith('/kanban')) return 'kanban'
  if (pathname.startsWith('/calendar')) return 'calendar'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  return 'dashboard'
}

function App() {
  const location = useLocation()
  const currentView = getViewModeFromPath(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="h-screen flex flex-col">
        {/* 공통 헤더 */}
        <AppHeader currentView={currentView} title="TodoList" />

        {/* 라우터 기반 뷰 렌더링 */}
        <div className="flex-1 overflow-hidden">
          <AppRoutes />
        </div>
      </div>
    </div>
  )
}

export default App
