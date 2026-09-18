import { ClipboardList, LogIn, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'
import Button from '../common/Button'

export default function Header() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    navigate('/login')
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="flex items-center gap-2 font-bold text-slate-900" to="/surveys">
          <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          설문 제작소
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-slate-500 sm:block">
              {user.email}
            </span>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-1.5 size-4" aria-hidden="true" />
              로그아웃
            </Button>
          </div>
        ) : (
          <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700" to="/login">
            <LogIn className="size-4" aria-hidden="true" />
            로그인
          </Link>
        )}
      </div>
    </header>
  )
}
