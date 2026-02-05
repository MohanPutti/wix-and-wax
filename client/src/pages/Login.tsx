import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginUser, selectIsAuthenticated, selectError } from '../store/slices/authSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import GoogleOAuthButton from '../components/auth/GoogleOAuthButton'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()

  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authError = useAppSelector(selectError)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: string })?.from || '/'
  const oauthError = searchParams.get('error')

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap()
      if (result) {
        navigate(from, { replace: true })
      }
    } catch (err) {
      if (typeof err === 'string') {
        setError(err)
      } else if (err instanceof Error) {
        setError(err.message)
      } else if (err && typeof err === 'object' && 'message' in err) {
        setError(String((err as { message: unknown }).message))
      } else {
        setError('Invalid email or password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <span className="text-3xl">&#x1F56F;</span>
            <span className="font-serif text-3xl font-semibold text-warm-900">Wix & Wax</span>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-warm-900 mb-2">Welcome Back</h1>
          <p className="text-warm-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-soft">
          {(error || authError || oauthError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error || authError || oauthError}
            </div>
          )}

          {/* Google OAuth */}
          <GoogleOAuthButton />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-warm-500">OR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-warm-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-warm-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-amber-600 hover:text-amber-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-warm-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-600 hover:text-amber-700 font-medium">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
