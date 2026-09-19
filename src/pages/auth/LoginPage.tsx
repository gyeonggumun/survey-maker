import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
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
    <AuthLayout
      eyebrow="Welcome back"
      title="로그인"
      description="내 설문을 만들고 결과를 확인하세요."
      footer={
        <p className="text-center text-sm text-slate-600">
          계정이 없나요?{' '}
          <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to="/signup">
            회원가입
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {!isSupabaseConfigured && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-800">
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
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700" role="alert">
            {submitError}
          </p>
        )}

        <Button className="mt-2 w-full" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
          {isSubmitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>
    </AuthLayout>
  )
}
