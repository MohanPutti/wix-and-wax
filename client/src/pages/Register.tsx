import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { registerUser, selectIsAuthenticated } from '../store/slices/authSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import GoogleOAuthButton from '../components/auth/GoogleOAuthButton'

export default function Register() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [searchParams] = useSearchParams()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const oauthError = searchParams.get('error')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await dispatch(registerUser({ email, password, firstName, lastName })).unwrap()
      navigate('/')
    } catch (err) {
      if (typeof err === 'string') {
        setError(err)
      } else if (err instanceof Error) {
        setError(err.message)
      } else if (err && typeof err === 'object' && 'message' in err) {
        setError(String((err as { message: unknown }).message))
      } else {
        setError('Registration failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <span className="text-3xl">&#x1F56F;</span>
            <span className="font-serif text-3xl font-semibold text-warm-900">Wix & Wax</span>
          </Link>
          <h1 className="font-serif text-2xl font-semibold text-warm-900 mb-2">Create Account</h1>
          <p className="text-warm-600">Join our candle-loving community</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-soft">
          {(error || oauthError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error || oauthError}
            </div>
          )}

          {/* Google OAuth */}
          <GoogleOAuthButton text="Sign up with Google" />

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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>

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
              autoComplete="new-password"
              helperText="At least 8 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-warm-600">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
