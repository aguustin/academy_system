import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './theme/theme-context'
import { ConfirmDialogProvider } from './components/ui/confirm-dialog'
import { RequireAuth, RequireChangePassword } from './auth/RequireAuth'
import { RequireAdmin } from './auth/RequireAdmin'
import { AppLayout } from './components/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { CourseTemplates } from './pages/CourseTemplates'
import { CourseEditions } from './pages/CourseEditions'
import { AttendanceRegistration } from './pages/AttendanceRegistration'
import { AttendanceQuery } from './pages/AttendanceQuery'
import { Users } from './pages/Users'
import { Students } from './pages/Students'
import { TeacherDashboard } from './pages/TeacherDashboard'
import { Login } from './pages/Login'
import { ChangePassword } from './pages/ChangePassword'
import { NotFound } from './pages/NotFound'
import './index.css'

const router = createHashRouter([
  { path: '/login', element: <Login /> },
  { path: '/registrar-asistencia', element: <AttendanceRegistration /> },
  {
    path: '/cambiar-contrasena',
    element: (
      <RequireChangePassword>
        <ChangePassword />
      </RequireChangePassword>
    )
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'cursos', element: <CourseTemplates /> },
          { path: 'ediciones', element: <CourseEditions /> },
          { path: 'asistencias', element: <AttendanceQuery /> },
          { path: 'mis-cursos', element: <TeacherDashboard /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: 'usuarios', element: <Users /> },
              { path: 'alumnos', element: <Students /> }
            ]
          }
        ]
      }
    ]
  },
  { path: '*', element: <NotFound /> }
])

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeProvider>
      <ConfirmDialogProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ConfirmDialogProvider>
    </ThemeProvider>
  </StrictMode>
)
