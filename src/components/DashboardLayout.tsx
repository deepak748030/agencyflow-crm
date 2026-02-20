import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, FolderKanban, Users, Target, Settings,
    Menu, X, LogOut, ChevronLeft, ChevronRight, Zap, ListTodo, Activity, MessageCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from './ThemeToggle'
import { getUnreadCount } from '../lib/api'

const allNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin'] },
    { to: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'manager'] },
    { to: '/tasks', icon: ListTodo, label: 'Tasks', roles: ['admin', 'manager'] },
    { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    { to: '/milestones', icon: Target, label: 'Milestones', roles: ['admin', 'manager'] },
    { to: '/chat', icon: MessageCircle, label: 'Chat', roles: ['admin', 'manager', 'developer', 'client'] },
    { to: '/activity', icon: Activity, label: 'Activity', roles: ['admin', 'manager'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'manager', 'developer', 'client'] },
]

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [unreadTotal, setUnreadTotal] = useState(0)
    const { user, logout } = useAuth()
    const location = useLocation()
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role || ''))

    const fetchUnread = async () => {
        try {
            const res = await getUnreadCount()
            if (res.success) setUnreadTotal(res.response.total)
        } catch { }
    }

    useEffect(() => {
        fetchUnread()
        pollRef.current = setInterval(fetchUnread, 5000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [])

    // Reset unread when on chat page
    useEffect(() => {
        if (location.pathname === '/chat') fetchUnread()
    }, [location.pathname])

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            )}

            <aside className={cn(
                'fixed inset-y-0 left-0 z-50 bg-sidebar text-sidebar-foreground transition-all duration-200 ease-out lg:relative border-r border-border',
                sidebarOpen ? 'w-64' : 'w-20',
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}>
                <div className={cn('h-16 flex items-center border-b border-border px-4', sidebarOpen ? 'justify-between' : 'justify-center')}>
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/20 rounded-sm">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-primary leading-tight">AgencyFlow</h1>
                                <p className="text-[10px] text-sidebar-foreground/60 leading-tight">CRM Platform</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-1.5 bg-primary/20 rounded-sm">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-sm hover:bg-sidebar-hover transition-colors hidden lg:flex">
                        {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-sm hover:bg-sidebar-hover transition-colors lg:hidden">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
                        const showBadge = item.to === '/chat' && unreadTotal > 0
                        return (
                            <NavLink key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-150 relative',
                                    isActive ? 'bg-sidebar-active text-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-foreground'
                                )}>
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="text-base font-medium">{item.label}</span>}
                                {showBadge && (
                                    <span className={cn(
                                        'bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center',
                                        sidebarOpen ? 'ml-auto min-w-[20px] h-5 px-1.5' : 'absolute top-1 right-1 min-w-[18px] h-[18px] px-1'
                                    )}>
                                        {unreadTotal > 99 ? '99+' : unreadTotal}
                                    </span>
                                )}
                            </NavLink>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-10 h-10 rounded-sm bg-sidebar-hover flex items-center justify-center overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                                <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{user?.role}</p>
                            </div>
                            <button onClick={logout} className="p-2 rounded-sm hover:bg-sidebar-hover transition-colors" title="Logout">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={logout} className="w-full flex justify-center p-2 rounded-sm hover:bg-sidebar-hover transition-colors" title="Logout">
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-h-0 h-screen">
                <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-6 flex-shrink-0 z-30">
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-sm hover:bg-muted transition-colors lg:hidden">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <div className="text-sm text-muted-foreground">
                            Welcome, <span className="text-foreground font-medium">{user?.name}</span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}