import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { getErrorMessage } from '../../lib/errors'
import { isSupabaseConfigured } from '../../lib/supabase'
import { signIn } from '../../services/authService'

interface LoginValues {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>()

  const onSubmit = async (values: LoginValues) => {
    setSubmitError('')

    try {
      const { error } = await signIn(values.email, values.password)
      if (error) throw error

      const from = (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname
      navigate(from || '/surveys', { replace: true })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <p className="text-sm font-semibold text-indigo-600">설문 제작소</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">로그인</h1>
        <p className="text-sm leading-6 text-slate-500">내 설문을 만들고 결과를 확인하세요.</p>

        {!isSupabaseConfigured && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-800">
            Supabase 환경 변수를 설정하면 로그인할 수 있습니다.
          </p>
        )}

        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: '이메일을 입력하세요.',
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: '올바른 이메일 형식이 아닙니다.',
            },
          })}
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', {
            required: '비밀번호를 입력하세요.',
          })}
        />

        {submitError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {submitError}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
          {isSubmitting ? '로그인 중…' : '로그인'}
        </Button>

        <p className="text-center text-sm text-slate-600">
          계정이 없나요?{' '}
          <Link className="font-semibold text-indigo-700" to="/signup">
            회원가입
          </Link>
        </p>
      </form>
    </main>
  )
}
