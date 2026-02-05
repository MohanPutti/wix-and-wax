import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { setToken } from '../store/slices/authSlice'
import { api } from '../services/api'

export default function AuthCallback() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Extract token from URL fragment
    const fragment = window.location.hash.substring(1)
    const params = new URLSearchParams(fragment)
    const token = params.get('token')

    if (!token) {
      navigate('/login', {
        state: { error: 'No authentication token received' }
      })
      return
    }

    // Set token in Redux and API client
    dispatch(setToken(token))
    api.setAccessToken(token)

    // Fetch user data to populate Redux state
    api.getMe()
      .then(response => {
        if (response.success) {
          // Clear fragment from URL and navigate home
          window.history.replaceState(null, '', '/')
          navigate('/')
        } else {
          throw new Error('Failed to fetch user data')
        }
      })
      .catch(() => {
        navigate('/login', {
          state: { error: 'Failed to complete sign in' }
        })
      })
  }, [dispatch, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-warm-600">Completing sign in...</p>
      </div>
    </div>
  )
}
