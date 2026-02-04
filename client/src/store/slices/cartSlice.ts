import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'
import type { Cart } from '../../types'
import type { RootState } from '../index'

interface CartState {
  cart: Cart | null
  sessionId: string
  isLoading: boolean
  isCartOpen: boolean
  error: string | null
}

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const initialState: CartState = {
  cart: null,
  sessionId: generateSessionId(),
  isLoading: false,
  isCartOpen: false,
  error: null,
}

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const sessionId = state.cart.sessionId

    try {
      const response = await api.getCart(sessionId)
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Failed to fetch cart')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch cart')
    }
  }
)

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ variantId, quantity = 1 }: { variantId: string; quantity?: number }, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const sessionId = state.cart.sessionId

    try {
      const response = await api.addToCart({ variantId, quantity, sessionId })
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Failed to add to cart')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add to cart')
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const cartId = state.cart.cart?.id

    if (!cartId) {
      return rejectWithValue('No cart found')
    }

    try {
      if (quantity <= 0) {
        const response = await api.removeCartItem(cartId, itemId)
        if (response.success) {
          return response.data
        }
        return rejectWithValue('Failed to remove item')
      }

      const response = await api.updateCartItem(cartId, itemId, quantity)
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Failed to update cart')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update cart')
    }
  }
)

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (itemId: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const cartId = state.cart.cart?.id

    if (!cartId) {
      return rejectWithValue('No cart found')
    }

    try {
      const response = await api.removeCartItem(cartId, itemId)
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Failed to remove item')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove item')
    }
  }
)

export const applyDiscount = createAsyncThunk(
  'cart/applyDiscount',
  async (code: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const cartId = state.cart.cart?.id

    if (!cartId) {
      return rejectWithValue('No cart found')
    }

    try {
      const response = await api.applyDiscount(cartId, code)
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Invalid discount code')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to apply discount')
    }
  }
)

export const removeDiscount = createAsyncThunk(
  'cart/removeDiscount',
  async (discountId: string, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const cartId = state.cart.cart?.id

    if (!cartId) {
      return rejectWithValue('No cart found')
    }

    try {
      const response = await api.removeDiscount(cartId, discountId)
      if (response.success) {
        return response.data
      }
      return rejectWithValue('Failed to remove discount')
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove discount')
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    openCart: (state) => {
      state.isCartOpen = true
    },
    closeCart: (state) => {
      state.isCartOpen = false
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen
    },
    clearCart: (state) => {
      state.cart = null
      state.error = null
      // Generate new sessionId for next cart
      state.sessionId = generateSessionId()
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
        state.isCartOpen = true
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Update cart item
    builder
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Remove cart item
    builder
      .addCase(removeCartItem.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Apply discount
    builder
      .addCase(applyDiscount.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(applyDiscount.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
      })
      .addCase(applyDiscount.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Remove discount
    builder
      .addCase(removeDiscount.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(removeDiscount.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = action.payload
      })
      .addCase(removeDiscount.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

// Selectors
export const selectCart = (state: RootState) => state.cart.cart
export const selectSessionId = (state: RootState) => state.cart.sessionId
export const selectCartIsLoading = (state: RootState) => state.cart.isLoading
export const selectIsCartOpen = (state: RootState) => state.cart.isCartOpen
export const selectCartError = (state: RootState) => state.cart.error

export const selectItemCount = (state: RootState) => {
  const cart = state.cart.cart
  if (!cart?.items) return 0
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export const selectSubtotal = (state: RootState) => {
  const cart = state.cart.cart
  if (!cart?.items) return 0
  return cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
}

export const { openCart, closeCart, toggleCart, clearCart, setSessionId } = cartSlice.actions
export default cartSlice.reducer
