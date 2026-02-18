import { useState, useEffect } from 'react'
import {
    Users, FolderKanban, IndianRupee, Clock, TrendingUp, RefreshCw, Activity,
} from 'lucide-react'
import { cn } from '../lib/utils'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getDashboardAnalytics, DashboardAnalytics } from '../lib/api'

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ElementType
    color: string
    isLoading: boolean
}

function StatCardSkeleton() {
    return (
        <div className="bg-card border border-border rounded-sm p-5">
            <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                    <div className="h-3 w-20 skeleton rounded-sm" />
                    <div className="h-7 w-16 skeleton rounded-sm" />
                </div>
                <div className="h-10 w-10 skeleton rounded-sm" />
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, isLoading }: StatCardProps) {
    if (isLoading) return <StatCardSkeleton />
    const displayValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value

    return (
        <div className="bg-card border border-border rounded-sm p-5 transition-all hover:border-primary/30">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{displayValue}</p>
                </div>
                <div className={cn('p-2.5 rounded-sm', color)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    )
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div className="bg-card border border-border rounded-sm p-5">
            <div className="h-4 w-32 skeleton rounded-sm mb-4" />
            <div className="skeleton rounded-sm" style={{ height: `${height}px` }} />
        </div>
    )
}

const STATUS_COLORS: Record<string, string> = {
    draft: '#6b7280',
    active: '#22c55e',
    on_hold: '#f59e0b',
    completed: '#3b82f6',
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-card border border-border rounded-sm p-3">
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
                        {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export function DashboardPage() {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => { fetchAnalytics() }, [])

    const fetchAnalytics = async () => {
        setIsLoading(true)
        setError('')
        try {
            const response = await getDashboardAnalytics()
            if (response.success) setAnalytics(response.response)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch analytics')
        } finally {
            setIsLoading(false)
        }
    }

    const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`

    const stats = [
        { title: 'Total Revenue', value: analytics ? formatCurrency(analytics.stats.totalRevenue) : '₹0', icon: IndianRupee, color: 'bg-primary/10 text-primary' },
        { title: 'Pending Payments', value: analytics ? formatCurrency(analytics.stats.pendingPayments) : '₹0', icon: Clock, color: 'bg-warning/10 text-warning' },
        { title: 'Active Projects', value: analytics?.stats.activeProjects || 0, icon: FolderKanban, color: 'bg-success/10 text-success' },
        { title: 'Total Users', value: analytics?.stats.totalUsers || 0, icon: Users, color: 'bg-accent/10 text-accent' },
    ]

    const pieData = analytics?.projectsByStatus
        ? Object.entries(analytics.projectsByStatus).map(([name, value]) => ({ name, value }))
        : []

    const revenueData = analytics?.monthlyRevenue?.map(m => ({
        name: new Date(m._id + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: m.revenue,
    })) || []

    return (
        <div className="animate-fade-in space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">AgencyFlow CRM Overview</p>
                </div>
                <button onClick={fetchAnalytics} disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors">
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} /> Refresh
                </button>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat) => <StatCard key={stat.title} {...stat} isLoading={isLoading} />)}
            </div>

            {analytics?.usersByRole && (
                <div>
                    <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Team Overview</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['admin', 'manager', 'developer', 'client'] as const).map(role => (
                            <div key={role} className="bg-card border border-border rounded-sm p-3">
                                <p className="text-xs text-muted-foreground capitalize">{role}s</p>
                                <p className="text-lg font-bold text-foreground">{analytics.usersByRole[role] || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {isLoading ? <ChartSkeleton /> : (
                    <div className="bg-card border border-border rounded-sm p-5">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4">Monthly Revenue</h3>
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p>No revenue data yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isLoading ? <ChartSkeleton /> : (
                    <div className="bg-card border border-border rounded-sm p-5">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4">Projects by Status</h3>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                                        paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {pieData.map((entry) => (
                                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#8b5cf6'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p>No projects yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-sm p-5">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Recent Activity
                </h3>
                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                        {analytics.recentActivity.map((activity: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                                <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-medium">{activity.userId?.name?.charAt(0) || '?'}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground">
                                        <span className="font-medium">{activity.userId?.name || 'System'}</span>
                                        {' — '}{activity.action?.replace(/\./g, ' ')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
                )}
            </div>
        </div>
    )
}
