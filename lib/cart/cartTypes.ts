export interface CartVariant {
  id: string
  skuSuffix: string | null
  colorNameEn: string
  colorNameEl: string
  hexColor: string | null
  type: 'swatch' | 'image'
  primaryImagePath: string | null
}

export interface CartSize {
  id: string
  labelEn: string
  labelEl: string
  skuSuffix: string | null
}

export interface CartItem {
  // Unique per cart entry: `${productId}:${variantId ?? 'base'}:${sizeId ?? 'base'}`
  id: string
  productId: string
  sku: string
  nameEn: string
  nameEl: string
  price: number
  moq: number
  qty: number
  variant: CartVariant | null
  size: CartSize | null
  primaryImagePath: string | null
}

export interface CartState {
  items: CartItem[]
  updatedAt: string
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QTY'; payload: { id: string; qty: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'HYDRATE'; payload: CartItem[] }
  | { type: 'CLEAR' }

export const CART_STORAGE_KEY = 'epresent_cart'
