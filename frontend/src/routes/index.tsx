import { Routes, Route, Navigate } from 'react-router-dom'
import { TodosPage } from '../pages/TodosPage'
import { KanbanView } from '../components/kanban'
import { CalendarView } from '../components/calendar'
import { DashboardView } from '../components/dashboard'

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 기본 경로는 dashboard로 리다이렉트 */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 각 뷰별 라우트 */}
      <Route path="/dashboard" element={<DashboardView />} />
      <Route path="/todos" element={<TodosPage />} />
      <Route
        path="/kanban"
        element={<KanbanView filters={{}} onFiltersChange={() => {}} onCreateTodo={() => {}} />}
      />
      <Route
        path="/calendar"
        element={
          <CalendarView
            filters={{}}
            onFiltersChange={() => {}}
            onCreateTodo={() => {}}
            onUpdateTodo={() => {}}
            onToggleTodo={() => {}}
            onDeleteTodo={() => {}}
          />
        }
      />

      {/* 404 페이지 - dashboard로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
