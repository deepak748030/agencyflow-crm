import { useState, useEffect } from 'react'
import {
    Users, Hash, Trophy, Activity, TrendingUp, RefreshCw, Quote, Image
} from 'lucide-react'
import { cn } from '../lib/utils'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts'
import api from '../lib/api'



interface NaamJapAnalytics {
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

interface StatCardProps {
    title: string
    value: number | string
    icon: React.ElementType
    color: string
    isLoading: boolean
}

function StatCardSkeleton() {
    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                    <div className="h-3 w-20 skeleton rounded" />
                    <div className="h-7 w-16 skeleton rounded" />
                </div>
                <div className="h-10 w-10 skeleton rounded-lg" />
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, isLoading }: StatCardProps) {
    if (isLoading) return <StatCardSkeleton />
    const displayValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value

    return (
        <div className="bg-card border border-border rounded-xl p-5 transition-all hover:shadow-lg hover:border-primary/30">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{displayValue}</p>
                </div>
                <div className={cn('p-2.5 rounded-lg', color)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    )
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div className="bg-card border border-border rounded-xl p-5">
            <div className="h-4 w-32 skeleton rounded mb-4" />
            <div className="skeleton rounded" style={{ height: `${height}px` }} />
        </div>
    )
}

const CHART_COLORS = {
    malas: '#8b5cf6',
    users: '#3b82f6',
    count: '#22c55e',
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString('en-IN')}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export function DashboardPage() {
    const [analytics, setAnalytics] = useState<NaamJapAnalytics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        setIsLoading(true)
        setError('')
        try {
            const response = await api.get('/admin/analytics')
            if (response.data.success) {
                setAnalytics(response.data.response)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch analytics')
        } finally {
            setIsLoading(false)
        }
    }

    const formatNumber = (n: number) => n.toLocaleString('en-IN')

    const naamJapStats = [
        { title: 'Total Users', value: analytics?.naamJap?.totalUsers || 0, icon: Users, color: 'bg-primary/10 text-primary' },
        { title: 'Total Malas', value: analytics?.naamJap?.totalMalas || 0, icon: Hash, color: 'bg-emerald-500/10 text-emerald-500' },
        { title: 'Total Count', value: analytics?.naamJap?.totalCount || 0, icon: Trophy, color: 'bg-blue-500/10 text-blue-500' },
        { title: 'Active Today', value: analytics?.naamJap?.todayActiveUsers || 0, icon: Activity, color: 'bg-green-500/10 text-green-500' },
        { title: 'New This Week', value: analytics?.naamJap?.newUsersThisWeek || 0, icon: TrendingUp, color: 'bg-purple-500/10 text-purple-500' },
    ]

    const quotesStats = [
        { title: 'Total Quotes', value: analytics?.dailyQuotes?.total || 0, icon: Image, color: 'bg-amber-500/10 text-amber-500' },
        { title: 'Active Quotes', value: analytics?.dailyQuotes?.active || 0, icon: Quote, color: 'bg-orange-500/10 text-orange-500' },
    ]

    return (
        <div className="animate-fade-in space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Welcome to Shree Jii Admin Panel
                    </p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Naam Jap Stats */}
            <div>
                <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">Naam Jap Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {naamJapStats.map((stat) => (
                        <StatCard key={stat.title} {...stat} isLoading={isLoading} />
                    ))}
                </div>
            </div>

            {/* Daily Quotes Stats */}
            <div>
                <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">Daily Quotes</h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
                    {quotesStats.map((stat) => (
                        <StatCard key={stat.title} {...stat} isLoading={isLoading} />
                    ))}
                </div>
            </div>

            {/* Charts & Top Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Daily Activity Chart */}
                {isLoading ? (
                    <ChartSkeleton />
                ) : (
                    <div className="bg-card border border-border rounded-xl p-3 sm:p-5">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Daily Activity (Last 7 Days)</h3>
                        {analytics?.dailyActivity && analytics.dailyActivity.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={analytics.dailyActivity}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                                    <Bar dataKey="malas" name="Malas" fill={CHART_COLORS.malas} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="users" name="Active Users" fill={CHART_COLORS.users} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                                No activity data yet
                            </div>
                        )}
                    </div>
                )}

                {/* Top Users */}
                {isLoading ? (
                    <ChartSkeleton />
                ) : (
                    <div className="bg-card border border-border rounded-xl p-3 sm:p-5">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Top 10 Users</h3>
                        {analytics?.topUsers && analytics.topUsers.length > 0 ? (
                            <div className="overflow-auto max-h-[280px]">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">#</th>
                                            <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Name</th>
                                            <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">City</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Malas</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {analytics.topUsers.map((user) => (
                                            <tr key={`${user.rank}-${user.name}`} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2 px-2 text-sm text-muted-foreground">{user.rank}</td>
                                                <td className="py-2 px-2 text-sm font-medium text-foreground">{user.name}</td>
                                                <td className="py-2 px-2 text-sm text-muted-foreground">{user.city}</td>
                                                <td className="py-2 px-2 text-sm font-semibold text-foreground text-right">
                                                    {formatNumber(user.malas)}
                                                </td>
                                                <td className="py-2 px-2 text-sm text-muted-foreground text-right">
                                                    {formatNumber(user.count)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                    <p>No users yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
