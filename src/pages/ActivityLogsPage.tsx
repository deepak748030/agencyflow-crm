import { useState, useEffect } from 'react'
import { Activity, Search, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { getActivityLogs } from '../lib/api'

const ACTION_STYLES: Record<string, string> = {
    created: 'bg-success/10 text-success',
    updated: 'bg-primary/10 text-primary',
    deleted: 'bg-destructive/10 text-destructive',
    login: 'bg-accent/10 text-accent',
    status: 'bg-warning/10 text-warning',
}

function getActionStyle(action: string) {
    for (const key of Object.keys(ACTION_STYLES)) {
        if (action.includes(key)) return ACTION_STYLES[key]
    }
    return 'bg-muted text-muted-foreground'
}

export function ActivityLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ total: 0, pages: 1 })
    const [resourceFilter, setResourceFilter] = useState('')

    useEffect(() => { fetchLogs() }, [search, page, resourceFilter])

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const res = await getActivityLogs({
                search: search || undefined,
                resource: resourceFilter || undefined,
                page,
                limit: 30,
            })
            if (res.success) {
                setLogs(res.response.logs)
                setPagination(res.response.pagination)
            }
        } catch { }
        finally { setIsLoading(false) }
    }

    return (
        <div className="animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Activity Logs</h1>
                    <p className="text-muted-foreground text-sm">{pagination.total} total entries</p>
                </div>
                <button onClick={fetchLogs} disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors">
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} /> Refresh
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Search activity..."
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(1) }}
                    className="px-4 py-2.5 bg-card border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All Resources</option>
                    <option value="project">Projects</option>
                    <option value="milestone">Milestones</option>
                    <option value="task">Tasks</option>
                    <option value="user">Users</option>
                    <option value="auth">Auth</option>
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16">
                    <Activity className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No activity logs</h3>
                    <p className="text-muted-foreground text-sm">Activity will appear here as actions are performed</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-sm divide-y divide-border">
                    {logs.map((log: any, i: number) => (
                        <div key={log._id || i} className="flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors">
                            <div className="w-9 h-9 rounded-sm bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-medium">{log.userId?.name?.charAt(0) || '?'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-foreground">{log.userId?.name || 'System'}</span>
                                    <span className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', getActionStyle(log.action))}>
                                        {log.action?.replace(/\./g, ' ')}
                                    </span>
                                </div>
                                {log.details && typeof log.details === 'object' && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {log.details.projectName || log.details.name || log.details.title || JSON.stringify(log.details).slice(0, 100)}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(log.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                    {log.userId?.role && <span className="ml-2 capitalize">• {log.userId.role}</span>}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Page {page} of {pagination.pages}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="p-2 bg-card border border-border rounded-sm disabled:opacity-40 hover:bg-muted transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                            className="p-2 bg-card border border-border rounded-sm disabled:opacity-40 hover:bg-muted transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
