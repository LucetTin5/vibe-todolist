import { Routes, Route, Navigate } from 'react-router-dom'
import { TodosPage } from '../pages/TodosPage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { KanbanView } from '../components/kanban'
import { CalendarView } from '../components/calendar'
import { DashboardView } from '../components/dashboard'
import { ProtectedRoute, GuestOnlyRoute } from '../components/auth/ProtectedRoute'

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 인증이 필요없는 라우트 (로그인/회원가입) */}
      <Route
        path="/login"
        element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnlyRoute>
            <SignupPage />
          </GuestOnlyRoute>
        }
      />

      {/* 인증이 필요한 라우트들 */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/todos"
        element={
          <ProtectedRoute>
            <TodosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kanban"
        element={
          <ProtectedRoute>
            <KanbanView filters={{}} onFiltersChange={() => {}} onCreateTodo={() => {}} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarView
              filters={{}}
              onFiltersChange={() => {}}
              onCreateTodo={() => {}}
              onUpdateTodo={() => {}}
              onToggleTodo={() => {}}
              onDeleteTodo={() => {}}
            />
          </ProtectedRoute>
        }
      />

      {/* 기본 경로는 dashboard로 리다이렉트 */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 페이지 - dashboard로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
