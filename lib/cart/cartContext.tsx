'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { cartReducer, initialCartState } from './cartReducer'
import type { CartItem, CartVariant } from './cartTypes'
import { CART_STORAGE_KEY } from './cartTypes'

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  totalUniqueItems: number
  addItem: (item: Omit<CartItem, 'id'> & { variantId?: string; sizeId?: string }) => void
  updateQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  isInCart: (productId: string, variantId?: string, sizeId?: string) => boolean
  getItemQty: (productId: string, variantId?: string, sizeId?: string) => number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[]
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', payload: parsed })
        }
      }
    } catch {
      // Corrupt localStorage data — ignore
    }
  }, [])

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // Storage full or unavailable — ignore
    }
  }, [state.items])

  const addItem = useCallback(
    (itemInput: Omit<CartItem, 'id'> & { variantId?: string; sizeId?: string }) => {
      const id = `${itemInput.productId}:${itemInput.variantId ?? 'base'}:${itemInput.sizeId ?? 'base'}`
      const item: CartItem = {
        id,
        productId: itemInput.productId,
        sku: itemInput.sku,
        nameEn: itemInput.nameEn,
        nameEl: itemInput.nameEl,
        price: itemInput.price,
        moq: itemInput.moq,
        qty: Math.max(itemInput.qty, itemInput.moq),
        variant: itemInput.variant,
        size: itemInput.size,
        primaryImagePath: itemInput.primaryImagePath,
      }
      dispatch({ type: 'ADD_ITEM', payload: item })
    },
    []
  )

  const updateQty = useCallback((id: string, qty: number) => {
    dispatch({ type: 'UPDATE_QTY', payload: { id, qty } })
  }, [])

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const isInCart = useCallback(
    (productId: string, variantId?: string, sizeId?: string) => {
      const id = `${productId}:${variantId ?? 'base'}:${sizeId ?? 'base'}`
      return state.items.some((i) => i.id === id)
    },
    [state.items]
  )

  const getItemQty = useCallback(
    (productId: string, variantId?: string, sizeId?: string) => {
      const id = `${productId}:${variantId ?? 'base'}:${sizeId ?? 'base'}`
      return state.items.find((i) => i.id === id)?.qty ?? 0
    },
    [state.items]
  )

  const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0)
  const totalUniqueItems = state.items.length

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalUniqueItems,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        isInCart,
        getItemQty,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
