import axios from 'axios'
import { API_URL } from './config'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rm_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401: attempt a token refresh once before forcing re-login.
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('rm_refresh_token')
  if (!refreshToken) throw new Error('no refresh token')

  const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
  const data = res.data.data
  localStorage.setItem('rm_token', data.accessToken)
  if (data.refreshToken) localStorage.setItem('rm_refresh_token', data.refreshToken)
  return data.accessToken
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    // Don't retry the refresh call itself, and guard against infinite loops.
    const isAuthCall = originalRequest?.url?.startsWith('/api/auth/')
    if (
      err.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !originalRequest._retry &&
      !isAuthCall
    ) {
      originalRequest._retry = true
      try {
        // Coalesce concurrent 401s into a single refresh.
        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = refreshAccessToken().finally(() => {
            isRefreshing = false
          })
        }
        const newToken = await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        // Refresh failed — force re-login.
        localStorage.removeItem('rm_token')
        localStorage.removeItem('rm_refresh_token')
        localStorage.removeItem('rm_user')
        window.location.href = '/login'
        return Promise.reject(err)
      }
    }
    // A 401 on an auth endpoint (bad credentials) or after a failed refresh → login.
    if (err.response?.status === 401 && typeof window !== 'undefined' && isAuthCall) {
      // Only clear auth if it's the login/register call failing, not refresh.
      if (originalRequest?.url?.includes('/refresh')) {
        localStorage.removeItem('rm_token')
        localStorage.removeItem('rm_refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  registerWholesale: (data: any) => api.post('/api/auth/register/wholesale', data),
  login: (data: any) => api.post('/api/auth/login', data),
  adminLogin: (data: any) => api.post('/api/auth/admin/login', data),
}

// ── Products ──────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: (params?: any) => api.get('/api/products', { params }),
  getFeatured: () => api.get('/api/products/featured'),
  getBySlug: (slug: string) => api.get(`/api/products/${slug}`),
  getByCategory: (slug: string, params?: any) =>
    api.get('/api/products', { params: { category: slug, ...params } }),
  search: (q: string) => api.get('/api/products', { params: { search: q } }),

  // Admin
  adminGetAll: (params?: any) => api.get('/api/admin/products', { params }),
  adminGetById: (id: string) => api.get(`/api/admin/products/${id}`),
  create: (data: any) => api.post('/api/admin/products', data),
  update: (id: string, data: any) => api.put(`/api/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/products/${id}`),
  uploadImage: (id: string, formData: FormData) =>
    api.post(`/api/admin/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addVariant: (id: string, data: any) => api.post(`/api/admin/products/${id}/variants`, data),
  updateVariant: (variantId: string, data: any) => api.put(`/api/admin/products/variants/${variantId}`, data),
  deleteVariant: (variantId: string) => api.delete(`/api/admin/products/variants/${variantId}`),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () => api.get('/api/categories'),
  getBySlug: (slug: string) => api.get(`/api/categories/${slug}`),
  create: (data: any) => api.post('/api/admin/categories', data),
  update: (id: string, data: any) => api.put(`/api/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/categories/${id}`),
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/api/cart'),
  add: (data: any) => api.post('/api/cart/add', data),
  update: (data: any) => api.put('/api/cart/update', data),
  remove: (variantId: string) => api.delete(`/api/cart/remove/${variantId}`),
  clear: () => api.delete('/api/cart/clear'),
  applyCoupon: (code: string) => api.post('/api/cart/apply-coupon', { code }),
  removeCoupon: () => api.delete('/api/cart/remove-coupon'),
}

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderApi = {
  place: (data: any) => api.post('/api/orders/place', data),
  getMyOrders: () => api.get('/api/orders'),
  getByOrderNumber: (num: string) => api.get(`/api/orders/${num}`),
  cancel: (id: string) => api.post(`/api/orders/${id}/cancel`),

  // Admin
  getAll: (params?: any) => api.get('/api/admin/orders', { params }),
  getWholesale: (params?: any) => api.get('/api/admin/orders/wholesale', { params }),
  updateStatus: (id: string, status: string) =>
    api.put(`/api/admin/orders/${id}/status`, { status }),
}

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentApi = {
  createOrder: (orderId: string) => api.post('/api/payment/create-order', { orderId }),
  verify: (data: any) => api.post('/api/payment/verify', data),
}

// ── Addresses ─────────────────────────────────────────────────────────────────
export const addressApi = {
  getAll: () => api.get('/api/addresses'),
  add: (data: any) => api.post('/api/addresses', data),
  update: (id: string, data: any) => api.put(`/api/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/api/addresses/${id}`),
  setDefault: (id: string) => api.put(`/api/addresses/${id}/default`),
}

// ── Banners ───────────────────────────────────────────────────────────────────
export const bannerApi = {
  getActive: () => api.get('/api/banners'),
  adminGetAll: () => api.get('/api/admin/banners'),
  create: (data: any) => api.post('/api/admin/banners', data),
  update: (id: string, data: any) => api.put(`/api/admin/banners/${id}`, data),
  delete: (id: string) => api.delete(`/api/admin/banners/${id}`),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/api/admin/dashboard/stats'),
  getRecentOrders: () => api.get('/api/admin/dashboard/recent-orders'),
  getUsers: (params?: any) => api.get('/api/admin/users', { params }),
  updateUserStatus: (id: string, isActive: boolean) =>
    api.put(`/api/admin/users/${id}/status`, { isActive }),
  getWholesaleRequests: () => api.get('/api/admin/wholesale/requests'),
  approveWholesale: (id: string) => api.put(`/api/admin/wholesale/${id}/approve`),
  getCoupons: () => api.get('/api/admin/coupons'),
  createCoupon: (data: any) => api.post('/api/admin/coupons', data),
  updateCoupon: (id: string, data: any) => api.put(`/api/admin/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/api/admin/coupons/${id}`),
  getSalesReport: (from: string, to: string) =>
    api.get('/api/admin/reports/sales', { params: { from, to } }),
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewApi = {
  getByProduct: (id: string) => api.get(`/api/products/${id}/reviews`),
  add: (id: string, data: any) => api.post(`/api/products/${id}/reviews`, data),
  // Admin
  adminGetAll: () => api.get('/api/admin/reviews'),
  approve: (id: string) => api.put(`/api/admin/reviews/${id}/approve`),
  delete: (id: string) => api.delete(`/api/admin/reviews/${id}`),
}

export default api
