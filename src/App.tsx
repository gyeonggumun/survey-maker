import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Header from './components/layout/Header'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import NotFoundPage from './pages/NotFoundPage'
import SurveyCreatePage from './pages/survey/SurveyCreatePage'
import SurveyEditPage from './pages/survey/SurveyEditPage'
import SurveyListPage from './pages/survey/SurveyListPage'
import SurveyResponsePage from './pages/survey/SurveyResponsePage'
import SurveyResultPage from './pages/survey/SurveyResultPage'

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/s/:id" element={<SurveyResponsePage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/surveys" element={<SurveyListPage />} />
            <Route path="/surveys/new" element={<SurveyCreatePage />} />
            <Route path="/surveys/:id/edit" element={<SurveyEditPage />} />
            <Route path="/surveys/:id/results" element={<SurveyResultPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/surveys" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
