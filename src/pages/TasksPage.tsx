import { useState, useEffect } from 'react'
import { Plus, Search, Loader2, CheckCircle2, Clock, AlertCircle, ListTodo, ArrowUpCircle, X, MessageSquare } from 'lucide-react'
import { cn } from '../lib/utils'
import { getTasks, createTask, updateTaskStatus, getProjects, getUsers, Task, Project, User } from '../lib/api'

const STATUS_ICONS: Record<string, React.ElementType> = {
    todo: ListTodo, in_progress: Clock, review: ArrowUpCircle, done: CheckCircle2,
}

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
    critical: 'bg-destructive/10 text-destructive',
}

const STATUS_LABELS: Record<string, string> = {
    todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
}

export function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [projectFilter] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [error, setError] = useState('')
    const [form, setForm] = useState({ projectId: '', title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' })
    const [viewMode, setViewMode] = useState<'list' | 'board'>('board')

    const fetchTasks = async () => {
        try {
            setIsLoading(true); setError('')
            const params: any = {}
            if (search) params.search = search
            if (statusFilter) params.status = statusFilter
            if (projectFilter) params.projectId = projectFilter
            const res = await getTasks(params)
            if (res.success) setTasks(res.response.tasks)
        } catch { setError('Failed to load tasks') }
        finally { setIsLoading(false) }
    }

    useEffect(() => { fetchTasks() }, [search, statusFilter, projectFilter])

    const openCreateModal = async () => {
        setShowCreate(true); setCreateError('')
        try {
            const [projRes, userRes] = await Promise.all([getProjects({ limit: 100 }), getUsers({ limit: 100 })])
            if (projRes.success) setProjects(projRes.response.projects)
            if (userRes.success) setUsers(userRes.response.users)
        } catch { }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.projectId || !form.title) { setCreateError('Project and title are required'); return }
        setCreating(true); setCreateError('')
        try {
            await createTask({ projectId: form.projectId, title: form.title, description: form.description, assignedTo: form.assignedTo || undefined, priority: form.priority, deadline: form.deadline || undefined })
            setShowCreate(false)
            setForm({ projectId: '', title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' })
            fetchTasks()
        } catch (err: any) { setCreateError(err.response?.data?.message || 'Failed to create task') }
        finally { setCreating(false) }
    }

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try { await updateTaskStatus(taskId, newStatus); fetchTasks() } catch { }
    }

    const columns = ['todo', 'in_progress', 'review', 'done']
    const groupedTasks = columns.reduce((acc, status) => {
        acc[status] = tasks.filter(t => t.status === status); return acc
    }, {} as Record<string, Task[]>)

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
                    <p className="text-muted-foreground text-sm">{tasks.length} total tasks</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-muted rounded-sm p-1">
                        <button onClick={() => setViewMode('board')}
                            className={cn('px-3 py-1.5 rounded-sm text-sm font-medium transition-colors', viewMode === 'board' ? 'bg-card text-foreground' : 'text-muted-foreground')}>
                            Board
                        </button>
                        <button onClick={() => setViewMode('list')}
                            className={cn('px-3 py-1.5 rounded-sm text-sm font-medium transition-colors', viewMode === 'list' ? 'bg-card text-foreground' : 'text-muted-foreground')}>
                            List
                        </button>
                    </div>
                    <button onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-sm font-medium hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" /> New Task
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..."
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-card border border-border rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All Status</option>
                    {columns.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                    <AlertCircle className="w-5 h-5" />{error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : viewMode === 'board' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {columns.map(status => {
                        const Icon = STATUS_ICONS[status]
                        return (
                            <div key={status} className="bg-card/50 border border-border rounded-sm p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="font-semibold text-sm text-foreground">{STATUS_LABELS[status]}</h3>
                                    <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-sm text-muted-foreground">{groupedTasks[status].length}</span>
                                </div>
                                <div className="space-y-3">
                                    {groupedTasks[status].length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
                                    ) : groupedTasks[status].map(task => (
                                        <div key={task._id} className="bg-card border border-border rounded-sm p-3.5 hover:border-primary/30 transition-colors">
                                            <p className="font-medium text-sm text-foreground mb-2">{task.title}</p>
                                            {task.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>}
                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                <span className={cn('text-xs px-2 py-0.5 rounded-sm font-medium', PRIORITY_STYLES[task.priority])}>{task.priority}</span>
                                                {typeof task.projectId === 'object' && task.projectId && (
                                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{(task.projectId as any).name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                {typeof task.assignedTo === 'object' && task.assignedTo ? (
                                                    <span className="text-xs text-muted-foreground">{(task.assignedTo as any).name}</span>
                                                ) : (<span className="text-xs text-muted-foreground italic">Unassigned</span>)}
                                                {task.comments && task.comments.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MessageSquare className="w-3 h-3" />{task.comments.length}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                                                {columns.filter(s => s !== status).map(s => (
                                                    <button key={s} onClick={() => handleStatusChange(task._id, s)}
                                                        className="text-xs px-2 py-1 rounded-sm bg-muted hover:bg-muted/80 text-muted-foreground transition-colors flex-1">
                                                        {STATUS_LABELS[s]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-card border border-border rounded-sm overflow-hidden">
                    {tasks.length === 0 ? (
                        <div className="text-center py-20">
                            <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No tasks found</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-4 font-medium text-muted-foreground">Task</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Project</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Priority</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Deadline</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="p-4">
                                            <p className="font-medium text-foreground">{task.title}</p>
                                            {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-muted-foreground">
                                            {typeof task.projectId === 'object' ? (task.projectId as any)?.name : '-'}
                                        </td>
                                        <td className="p-4 hidden lg:table-cell text-muted-foreground">
                                            {typeof task.assignedTo === 'object' && task.assignedTo ? (task.assignedTo as any).name : 'Unassigned'}
                                        </td>
                                        <td className="p-4">
                                            <span className={cn('text-xs px-2.5 py-1 rounded-sm font-medium', PRIORITY_STYLES[task.priority])}>{task.priority}</span>
                                        </td>
                                        <td className="p-4">
                                            <select value={task.status} onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                                className="text-xs px-2 py-1 rounded-sm bg-muted border border-border focus:outline-none">
                                                {columns.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-card border border-border rounded-t-sm sm:rounded-sm p-6 w-full sm:max-w-lg animate-slide-up sm:animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Create Task</h2>
                            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {createError && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">{createError}</div>}
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Project *</label>
                                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                                    className="w-full px-4 py-3 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" required>
                                    <option value="">Select project</option>
                                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Title *</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Task title" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    rows={3} placeholder="Optional description" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1 block">Assign To</label>
                                    <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                                        className="w-full px-4 py-3 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option value="">Unassigned</option>
                                        {users.filter(u => u.role !== 'client').map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-1 block">Priority</label>
                                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                        className="w-full px-4 py-3 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">Deadline</label>
                                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                    className="w-full px-4 py-3 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="px-5 py-2.5 bg-muted text-foreground rounded-sm font-medium hover:bg-muted/80 transition-colors">Cancel</button>
                                <button type="submit" disabled={creating}
                                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
                                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
