import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const token = localStorage.getItem('admin_token')
            const isProfileCheck = error.config?.url?.includes('/admin/me')

            if (!token && !isProfileCheck) {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export interface Admin {
    _id: string
    name: string
    email: string
    avatar: string
    role: string
}

export interface DashboardAnalytics {
    naamJap: {
        totalUsers: number
        totalMalas: number
        totalCount: number
        todayActiveUsers: number
        newUsersThisWeek: number
    }
    dailyQuotes: {
        total: number
        active: number
    }
    topUsers: {
        rank: number
        name: string
        city: string
        malas: number
        count: number
    }[]
    dailyActivity: {
        name: string
        malas: number
        users: number
        count: number
    }[]
}

// Auth APIs
export const adminLogin = async (email: string, password: string) => {
    const response = await api.post('/admin/login', { email, password })
    return response.data
}

export const getAdminProfile = async () => {
    const response = await api.get('/admin/me')
    return response.data
}

export const setupAdmin = async () => {
    const response = await api.post('/admin/setup')
    return response.data
}

// Dashboard APIs
export const getDashboardAnalytics = async () => {
    const response = await api.get('/admin/analytics')
    return response.data as { success: boolean; response: DashboardAnalytics }
}

// Admin Settings APIs
export interface AdminActivity {
    admin: Admin
    activity: {
        lastLogin: string
        accountCreated: string
        stats: {
            totalOrders: number
            totalUsers: number
            totalCoupons: number
            totalCategories: number
            totalBanners: number
            totalDeliveryPartners: number
        }
    }
}

export const updateAdminProfile = async (data: { name?: string; email?: string; avatar?: string }) => {
    const response = await api.put('/admin/profile', data)
    return response.data
}

export const updateAdminPassword = async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/admin/password', { currentPassword, newPassword })
    return response.data
}

export const getAdminActivity = async () => {
    const response = await api.get('/admin/activity')
    return response.data
}

// Daily Quotes APIs (image-only)
export interface DailyQuoteData {
    _id: string
    imageUrl: string
    date: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

// Home Content APIs
export interface HomeContentData {
    _id?: string
    title_hi: string
    title_en: string
    subtitle_hi: string
    subtitle_en: string
    paragraphs_hi: string[]
    paragraphs_en: string[]
    updatedAt?: string
}

export const getHomeContent = async () => {
    const response = await api.get('/home-content')
    return response.data as { success: boolean; response: HomeContentData | null }
}

export const saveHomeContent = async (data: Omit<HomeContentData, '_id' | 'updatedAt'>) => {
    const response = await api.post('/home-content', data)
    return response.data
}

export const getDailyQuotes = async (page: number = 1) => {
    const response = await api.get('/daily-quotes', { params: { page, limit: 20 } })
    return response.data as {
        success: boolean
        response: {
            quotes: DailyQuoteData[]
            pagination: { page: number; limit: number; total: number; pages: number }
        }
    }
}

export const uploadDailyQuoteImage = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api.post('/daily-quotes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data as { success: boolean; response: { imageUrl: string; publicId: string } }
}

export const createDailyQuote = async (data: { imageUrl: string; date: string }) => {
    const response = await api.post('/daily-quotes', data)
    return response.data
}

export const updateDailyQuote = async (id: string, data: Partial<DailyQuoteData>) => {
    const response = await api.put(`/daily-quotes/${id}`, data)
    return response.data
}

export const deleteDailyQuote = async (id: string) => {
    const response = await api.delete(`/daily-quotes/${id}`)
    return response.data
}

export const getTodayQuote = async () => {
    const response = await api.get('/daily-quotes/today')
    return response.data as { success: boolean; response: DailyQuoteData | null }
}

// Naam Jap Admin APIs
export interface NaamJapUserData {
    _id: string
    name: string
    city: string
    totalCount: number
    totalMalas: number
    lastSyncAt: string
    createdAt: string
}

export interface NaamJapAdminStats {
    totalUsers: number
    totalMalas: number
    totalCount: number
    todayActiveUsers: number
    newUsersThisWeek: number
}

export const getNaamJapUsers = async (page: number = 1, search: string = '', sortBy: string = 'totalMalas', sortOrder: string = 'desc') => {
    const response = await api.get('/naam-jap/admin/users', { params: { page, limit: 50, search, sortBy, sortOrder } })
    return response.data as {
        success: boolean
        response: {
            users: NaamJapUserData[]
            pagination: { page: number; limit: number; total: number; pages: number }
        }
    }
}

export const getNaamJapAdminStats = async () => {
    const response = await api.get('/naam-jap/admin/stats')
    return response.data as { success: boolean; response: NaamJapAdminStats }
}

// Push Notification APIs
export const sendPushNotification = async (title: string, body: string) => {
    const response = await api.post('/notifications/send', { title, body })
    return response.data as { success: boolean; message?: string; response: { sent: number; failed: number; total: number } }
}

export default api
