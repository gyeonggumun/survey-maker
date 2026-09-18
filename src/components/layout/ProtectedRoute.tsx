import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Loading from '../common/Loading'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <Loading label="로그인 상태를 확인하는 중입니다…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
