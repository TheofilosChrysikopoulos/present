import type { CartState, CartAction } from './cartTypes'

export function cartReducer(state: CartState, action: CartAction): CartState {
  const now = new Date().toISOString()

  switch (action.type) {
    case 'HYDRATE':
      return { items: action.payload, updatedAt: now }

    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.payload.id)
      if (existing) {
        // Increase quantity if item already in cart
        return {
          ...state,
          updatedAt: now,
          items: state.items.map((i) =>
            i.id === action.payload.id
              ? { ...i, qty: i.qty + action.payload.qty }
              : i
          ),
        }
      }
      return {
        ...state,
        updatedAt: now,
        items: [...state.items, action.payload],
      }
    }

    case 'UPDATE_QTY': {
      return {
        ...state,
        updatedAt: now,
        items: state.items.map((i) => {
          if (i.id !== action.payload.id) return i
          // Enforce minimum order quantity
          const qty = Math.max(action.payload.qty, i.moq)
          return { ...i, qty }
        }),
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        updatedAt: now,
        items: state.items.filter((i) => i.id !== action.payload.id),
      }

    case 'CLEAR':
      return { items: [], updatedAt: now }

    default:
      return state
  }
}

export const initialCartState: CartState = {
  items: [],
  updatedAt: new Date().toISOString(),
}
