import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Loading from './components/common/Loading'
import Header from './components/layout/Header'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const SurveyCreatePage = lazy(() => import('./pages/survey/SurveyCreatePage'))
const SurveyEditPage = lazy(() => import('./pages/survey/SurveyEditPage'))
const SurveyListPage = lazy(() => import('./pages/survey/SurveyListPage'))
const SurveyPreviewPage = lazy(() => import('./pages/survey/SurveyPreviewPage'))
const SurveyResponsePage = lazy(() => import('./pages/survey/SurveyResponsePage'))
const SurveyResultPage = lazy(() => import('./pages/survey/SurveyResultPage'))

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff_0,_#f8fafc_38rem)]">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  useAuth()

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/s/:id" element={<SurveyResponsePage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/surveys" element={<SurveyListPage />} />
              <Route path="/surveys/new" element={<SurveyCreatePage />} />
              <Route path="/surveys/:id/edit" element={<SurveyEditPage />} />
              <Route path="/surveys/:id/preview" element={<SurveyPreviewPage />} />
              <Route path="/surveys/:id/results" element={<SurveyResultPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/surveys" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
