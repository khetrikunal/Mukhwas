export interface Category {
  id: string
  name: string
  nameMarathi?: string
  slug: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortOrder: number
}

export interface ProductVariant {
  id: string
  weightGrams: number
  label: string
  retailPrice: number
  wholesalePrice?: number
  moq: number
  stockQuantity: number
  sku: string
  isActive: boolean
}

export interface ProductImage {
  id: string
  imageUrl: string
  isPrimary: boolean
  sortOrder: number
}

export interface Product {
  id: string
  name: string
  nameMarathi?: string
  slug: string
  description?: string
  descriptionMarathi?: string
  ingredients?: string
  ingredientsMarathi?: string
  benefits?: string
  benefitsMarathi?: string
  isFeatured: boolean
  isActive: boolean
  category: Category
  variants: ProductVariant[]
  images: ProductImage[]
  createdAt: string
}

export interface Address {
  id: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export interface OrderItem {
  id: string
  productName: string
  variantLabel: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  orderType: 'RETAIL' | 'WHOLESALE'
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  subtotal: number
  discountAmount: number
  shippingCharge: number
  totalAmount: number
  couponCode?: string
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod: 'RAZORPAY' | 'COD' | 'BANK_TRANSFER'
  address: Address
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'ADMIN' | 'CUSTOMER' | 'WHOLESALE'
  isVerified: boolean
  isActive: boolean
  createdAt: string
}

export interface Coupon {
  id: string
  code: string
  discountType: 'PERCENTAGE' | 'FLAT'
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number
  usageLimit?: number
  usedCount: number
  validFrom?: string
  validUntil?: string
  isActive: boolean
}

export interface Banner {
  id: string
  title?: string
  subtitle?: string
  imageUrl: string
  linkUrl?: string
  isActive: boolean
  sortOrder: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
