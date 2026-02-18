import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isProfileCheck = error.config?.url?.includes('/auth/me')
            if (!isProfileCheck) {
                localStorage.removeItem('auth_token')
                localStorage.removeItem('auth_user')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// Types
export interface User {
    _id: string
    name: string
    email: string
    phone: string
    avatar: string
    role: 'admin' | 'manager' | 'developer' | 'client'
    company: string
    designation: string
    isActive: boolean
    lastLogin: string
    createdAt: string
    updatedAt: string
}

export interface Project {
    _id: string
    name: string
    description: string
    clientId: User | string
    managerId: User | string | null
    developerIds: (User | string)[]
    budget: {
        amount: number
        currency: string
        paid: number
        pending: number
    }
    deadline: string | null
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'draft' | 'active' | 'on_hold' | 'completed'
    tags: string[]
    createdBy: User | string
    createdAt: string
    updatedAt: string
}

export interface Milestone {
    _id: string
    projectId: string | Project
    title: string
    description: string
    amount: number
    dueDate: string | null
    status: 'pending' | 'in_progress' | 'submitted' | 'client_approved' | 'payment_pending' | 'paid'
    createdBy: User | string
    approvedBy: User | string | null
    approvedAt: string | null
    paidAt: string | null
    paidBy: string | null
    createdAt: string
}

export interface DashboardAnalytics {
    stats: {
        totalUsers: number
        totalProjects: number
        activeProjects: number
        totalRevenue: number
        pendingPayments: number
    }
    usersByRole: Record<string, number>
    projectsByStatus: Record<string, number>
    recentActivity: any[]
    recentProjects: Project[]
    monthlyRevenue: { _id: string; revenue: number; count: number }[]
}

// Auth APIs
export const authLogin = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
}

export const getProfile = async () => {
    const response = await api.get('/auth/me')
    return response.data
}

export const setupAdmin = async () => {
    const response = await api.post('/auth/setup')
    return response.data
}

export const updateProfile = async (data: Partial<User>) => {
    const response = await api.put('/auth/profile', data)
    return response.data
}

export const updatePassword = async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword })
    return response.data
}

// Dashboard APIs
export const getDashboardAnalytics = async () => {
    const response = await api.get('/dashboard/analytics')
    return response.data as { success: boolean; response: DashboardAnalytics }
}

// User APIs
export const getUsers = async (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/users', { params })
    return response.data as {
        success: boolean
        response: { users: User[]; pagination: { page: number; limit: number; total: number; pages: number } }
    }
}

export const createUser = async (data: { name: string; email: string; password: string; role: string; phone?: string; company?: string; designation?: string }) => {
    const response = await api.post('/users', data)
    return response.data
}

export const updateUser = async (id: string, data: Partial<User>) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
}

export const deleteUser = async (id: string) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
}

// Project APIs
export const getProjects = async (params?: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/projects', { params })
    return response.data as {
        success: boolean
        response: { projects: Project[]; pagination: { page: number; limit: number; total: number; pages: number } }
    }
}

export const createProject = async (data: any) => {
    const response = await api.post('/projects', data)
    return response.data
}

export const getProject = async (id: string) => {
    const response = await api.get(`/projects/${id}`)
    return response.data
}

export const updateProject = async (id: string, data: any) => {
    const response = await api.put(`/projects/${id}`, data)
    return response.data
}

export const updateProjectStatus = async (id: string, status: string) => {
    const response = await api.patch(`/projects/${id}/status`, { status })
    return response.data
}

// Milestone APIs
export const getMilestones = async (projectId: string) => {
    const response = await api.get(`/milestones/project/${projectId}`)
    return response.data as { success: boolean; response: Milestone[] }
}

export const createMilestone = async (data: { projectId: string; title: string; description?: string; amount: number; dueDate?: string }) => {
    const response = await api.post('/milestones', data)
    return response.data
}

export const updateMilestoneStatus = async (id: string, status: string) => {
    const response = await api.patch(`/milestones/${id}/status`, { status })
    return response.data
}

// Task Types
export interface Task {
    _id: string
    projectId: string | Project
    title: string
    description: string
    assignedTo: User | string | null
    assignedBy: User | string | null
    deadline: string | null
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'todo' | 'in_progress' | 'review' | 'done'
    attachments: { name: string; url: string; type: string }[]
    comments: { userId: User | string; text: string; createdAt: string }[]
    createdAt: string
    updatedAt: string
}

// Task APIs
export const getTasks = async (params?: { projectId?: string; status?: string; priority?: string; assignedTo?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/tasks', { params })
    return response.data as {
        success: boolean
        response: { tasks: Task[]; pagination: { page: number; limit: number; total: number; pages: number } }
    }
}

export const createTask = async (data: { projectId: string; title: string; description?: string; assignedTo?: string; priority?: string; deadline?: string }) => {
    const response = await api.post('/tasks', data)
    return response.data
}

export const getTask = async (id: string) => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
}

export const updateTask = async (id: string, data: any) => {
    const response = await api.put(`/tasks/${id}`, data)
    return response.data
}

export const updateTaskStatus = async (id: string, status: string) => {
    const response = await api.patch(`/tasks/${id}/status`, { status })
    return response.data
}

export const deleteTask = async (id: string) => {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
}

// Activity Log APIs
export const getActivityLogs = async (params?: { search?: string; resource?: string; action?: string; userId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/activity', { params })
    return response.data as {
        success: boolean
        response: { logs: any[]; pagination: { page: number; limit: number; total: number; pages: number } }
    }
}

// Milestone management
export const updateMilestone = async (id: string, data: any) => {
    const response = await api.put(`/milestones/${id}`, data)
    return response.data
}

export const deleteMilestone = async (id: string) => {
    const response = await api.delete(`/milestones/${id}`)
    return response.data
}

// Chat Types
export interface Conversation {
    _id: string
    projectId: string | { _id: string; name: string; status: string }
    type: 'project_group' | 'direct'
    participants: { userId: User | string; role: string; joinedAt: string; lastReadAt: string; isActive: boolean }[]
    lastMessage: { text: string; senderId: User | string; sentAt: string } | null
    createdAt: string
    updatedAt: string
}

export interface ChatMessage {
    _id: string
    conversationId: string
    senderId: User | string
    type: 'text' | 'file' | 'image' | 'system'
    message: string
    attachments: { name: string; url: string; type: string; size: number }[]
    replyTo: string | null
    isEdited: boolean
    editedAt: string | null
    isDeleted: boolean
    seenBy: { userId: string; seenAt: string }[]
    createdAt: string
    updatedAt: string
}

// Chat APIs
export const getConversations = async () => {
    const response = await api.get('/chat/conversations')
    return response.data as { success: boolean; response: Conversation[] }
}

export const createProjectConversation = async (projectId: string) => {
    const response = await api.post(`/chat/conversations/project/${projectId}`)
    return response.data as { success: boolean; response: Conversation }
}

export const getConversationMessages = async (conversationId: string, page = 1) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params: { page } })
    return response.data as {
        success: boolean
        response: { messages: ChatMessage[]; pagination: { page: number; limit: number; total: number; pages: number } }
    }
}

export const sendMessage = async (conversationId: string, message: string, type = 'text') => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, { message, type })
    return response.data as { success: boolean; response: ChatMessage }
}

export const editMessage = async (messageId: string, message: string) => {
    const response = await api.put(`/chat/messages/${messageId}`, { message })
    return response.data
}

export const deleteMessage = async (messageId: string) => {
    const response = await api.delete(`/chat/messages/${messageId}`)
    return response.data
}

export default api
