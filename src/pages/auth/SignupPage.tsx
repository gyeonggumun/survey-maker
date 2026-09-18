import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { getErrorMessage } from '../../lib/errors'
import { isSupabaseConfigured } from '../../lib/supabase'
import { signUp } from '../../services/authService'

interface SignupValues {
  email: string
  password: string
  passwordConfirm: string
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>()

  const onSubmit = async (values: SignupValues) => {
    setSubmitError('')
    setSuccessMessage('')

    try {
      const { data, error } = await signUp(values.email, values.password)
      if (error) throw error

      if (data.session) {
        navigate('/surveys', { replace: true })
        return
      }

      setSuccessMessage('가입 확인 이메일을 보냈습니다. 이메일 인증 후 로그인해주세요.')
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
        <h1 className="mt-2 text-2xl font-bold text-slate-900">회원가입</h1>
        <p className="text-sm leading-6 text-slate-500">설문을 만들 계정을 생성하세요.</p>

        {!isSupabaseConfigured && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-800">
            Supabase 환경 변수를 설정하면 회원가입할 수 있습니다.
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: '비밀번호를 입력하세요.',
            minLength: {
              value: 8,
              message: '비밀번호는 8자 이상이어야 합니다.',
            },
          })}
        />
        <Input
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          error={errors.passwordConfirm?.message}
          {...register('passwordConfirm', {
            required: '비밀번호를 한 번 더 입력하세요.',
            validate: (value) => value === watch('password') || '비밀번호가 일치하지 않습니다.',
          })}
        />

        {submitError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {submitError}
          </p>
        )}
        {successMessage && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {successMessage}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={isSubmitting || !isSupabaseConfigured}>
          {isSubmitting ? '가입 중…' : '회원가입'}
        </Button>

        <p className="text-center text-sm text-slate-600">
          이미 계정이 있나요?{' '}
          <Link className="font-semibold text-indigo-700" to="/login">
            로그인
          </Link>
        </p>
      </form>
    </main>
  )
}
