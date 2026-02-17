import { useState, useEffect, useCallback } from 'react'
import { Search, Users, Hash, Trophy, Activity, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api'

interface NaamJapUser {
    _id: string
    name: string
    city: string
    totalCount: number
    totalMalas: number
    lastSyncAt: string
    createdAt: string
}

interface AdminStats {
    totalUsers: number
    totalMalas: number
    totalCount: number
    todayActiveUsers: number
    newUsersThisWeek: number
}

export function NaamJapUsersPage() {
    const [users, setUsers] = useState<NaamJapUser[]>([])
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [sortBy, setSortBy] = useState('totalMalas')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const fetchUsers = useCallback(async () => {
        try {
            const res = await api.get('/naam-jap/admin/users', {
                params: { page, limit: 50, search, sortBy, sortOrder },
            })
            if (res.data.success) {
                setUsers(res.data.response.users)
                setTotalPages(res.data.response.pagination.pages)
                setTotal(res.data.response.pagination.total)
            }
        } catch (err) {
            console.error('Failed to fetch users:', err)
        }
    }, [page, search, sortBy, sortOrder])

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/naam-jap/admin/stats')
            if (res.data.success) {
                setStats(res.data.response)
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err)
        }
    }, [])

    useEffect(() => {
        setLoading(true)
        Promise.all([fetchUsers(), fetchStats()]).finally(() => setLoading(false))
    }, [fetchUsers, fetchStats])

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
        } else {
            setSortBy(field)
            setSortOrder('desc')
        }
        setPage(1)
    }

    const formatNumber = (n: number) => {
        return n.toLocaleString('en-IN')
    }

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Naam Jap Users</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Manage and monitor all naam jap users
                    </p>
                </div>
                <button
                    onClick={() => { fetchUsers(); fetchStats(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm self-start sm:self-auto"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { icon: Users, label: 'Total Users', value: stats.totalUsers },
                        { icon: Hash, label: 'Total Malas', value: stats.totalMalas },
                        { icon: Trophy, label: 'Total Count', value: stats.totalCount },
                        { icon: Activity, label: 'Active Today', value: stats.todayActiveUsers },
                        { icon: Users, label: 'New This Week', value: stats.newUsersThisWeek },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-card border border-border rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs font-medium truncate">{stat.label}</span>
                            </div>
                            <p className="text-lg sm:text-2xl font-bold text-foreground">{formatNumber(stat.value)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by name or city..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Users will appear here once they start using Naam Jap</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">#</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                                            <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-foreground">
                                                Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                                            </button>
                                        </th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">City</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                                            <button onClick={() => handleSort('totalMalas')} className="flex items-center gap-1 ml-auto hover:text-foreground">
                                                Malas {sortBy === 'totalMalas' && (sortOrder === 'desc' ? '↓' : '↑')}
                                            </button>
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                                            <button onClick={() => handleSort('totalCount')} className="flex items-center gap-1 ml-auto hover:text-foreground">
                                                Count {sortBy === 'totalCount' && (sortOrder === 'desc' ? '↓' : '↑')}
                                            </button>
                                        </th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                                            <button onClick={() => handleSort('lastSyncAt')} className="flex items-center gap-1 ml-auto hover:text-foreground">
                                                Last Sync {sortBy === 'lastSyncAt' && (sortOrder === 'desc' ? '↓' : '↑')}
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user, index) => (
                                        <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {(page - 1) * 50 + index + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{user.city}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                                                {formatNumber(user.totalMalas)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground text-right">
                                                {formatNumber(user.totalCount)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground text-right">
                                                {formatDate(user.lastSyncAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t border-border">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {formatNumber(total)}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm text-foreground font-medium px-2">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
