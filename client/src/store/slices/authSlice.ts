import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'
import type { User } from '../../types'
import type { RootState } from '../index'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  error: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.login(credentials)
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Login failed')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: { email: string; password: string; firstName?: string; lastName?: string }, { rejectWithValue }) => {
    try {
      const response = await api.register(data)
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Registration failed')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    // Try to call logout API but don't fail if it errors
    // We'll clear the token locally regardless
    try {
      await api.logout()
    } catch {
      // Ignore errors - we'll clear locally anyway
    }
    api.setAccessToken(null)
    return null
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const token = state.auth.token

    if (!token) {
      return rejectWithValue('No token')
    }

    try {
      const response = await api.getMe()
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Failed to fetch user')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload
      if (action.payload) {
        api.setAccessToken(action.payload)
      }
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.error = null
      api.setAccessToken(null)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.tokens.accessToken
        api.setAccessToken(action.payload.tokens.accessToken)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.tokens.accessToken
        api.setAccessToken(action.payload.tokens.accessToken)
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.error = null
        api.setAccessToken(null)
      })

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        api.setAccessToken(null)
      })
  },
})

// Selectors
export const selectUser = (state: RootState) => state.auth.user
export const selectToken = (state: RootState) => state.auth.token
export const selectIsLoading = (state: RootState) => state.auth.isLoading
export const selectError = (state: RootState) => state.auth.error
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user
export const selectIsAdmin = (state: RootState) =>
  state.auth.user?.roles?.some((r) => r.role?.name === 'admin') ?? false

export const { setToken, clearAuth, setLoading } = authSlice.actions
export default authSlice.reducer
