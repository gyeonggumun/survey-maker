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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link className="flex items-center gap-2 font-bold text-slate-900" to="/surveys">
          <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          설문 제작소
        </Link>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex max-w-32 items-center gap-2 truncate rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:max-w-48 sm:text-sm">
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="truncate">{user.email}</span>
            </span>
            <Button className="px-3 sm:px-4" variant="ghost" onClick={handleSignOut}>
              <LogOut className="mr-1.5 size-4" aria-hidden="true" />
              <span className="hidden sm:inline">로그아웃</span>
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
