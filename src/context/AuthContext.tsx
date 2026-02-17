import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { User, authLogin, getProfile } from '../lib/api'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('auth_user')
        return saved ? JSON.parse(saved) : null
    })
    const [isLoading, setIsLoading] = useState(true)
    const authChecked = useRef(false)

    const checkAuth = useCallback(async () => {
        if (authChecked.current) { setIsLoading(false); return }
        authChecked.current = true

        try {
            const token = localStorage.getItem('auth_token')
            if (token) {
                const response = await getProfile()
                if (response.success) {
                    setUser(response.response)
                    localStorage.setItem('auth_user', JSON.stringify(response.response))
                } else {
                    const saved = localStorage.getItem('auth_user')
                    if (saved) setUser(JSON.parse(saved))
                    else { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); setUser(null) }
                }
            } else {
                setUser(null)
            }
        } catch {
            const saved = localStorage.getItem('auth_user')
            const token = localStorage.getItem('auth_token')
            if (saved && token) setUser(JSON.parse(saved))
            else { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); setUser(null) }
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { checkAuth() }, [checkAuth])

    const login = async (email: string, password: string) => {
        const response = await authLogin(email, password)
        if (response.success) {
            localStorage.setItem('auth_token', response.response.token)
            localStorage.setItem('auth_user', JSON.stringify(response.response.user))
            setUser(response.response.user)
            authChecked.current = true
        } else {
            throw new Error(response.message)
        }
    }

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
        authChecked.current = false
    }, [])

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
