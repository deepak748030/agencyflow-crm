import { useState, useEffect } from 'react'
import { Plus, Search, FolderKanban, Calendar, IndianRupee, Loader2, X, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { getProjects, createProject, getUsers, Project, User } from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-success/10 text-success',
    on_hold: 'bg-warning/10 text-warning',
    completed: 'bg-primary/10 text-primary',
}

const PRIORITY_STYLES: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-warning/10 text-warning',
    critical: 'bg-destructive/10 text-destructive',
}

export function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [clients, setClients] = useState<User[]>([])
    const [managers, setManagers] = useState<User[]>([])
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    const [form, setForm] = useState({
        name: '', description: '', clientId: '', managerId: '',
        budget: 0, deadline: '', priority: 'medium' as string,
    })

    useEffect(() => { fetchProjects() }, [search, statusFilter])

    const fetchProjects = async () => {
        setIsLoading(true)
        try {
            const res = await getProjects({ search, status: statusFilter || undefined })
            if (res.success) setProjects(res.response.projects)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch projects')
        } finally {
            setIsLoading(false)
        }
    }

    const openCreateModal = async () => {
        setShowCreate(true)
        try {
            const [clientsRes, managersRes] = await Promise.all([
                getUsers({ role: 'client', limit: 100 }),
                getUsers({ role: 'manager', limit: 100 }),
            ])
            if (clientsRes.success) setClients(clientsRes.response.users)
            if (managersRes.success) setManagers(managersRes.response.users)
        } catch { /* ignore */ }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setCreateError('')
        try {
            const res = await createProject({
                ...form,
                budget: { amount: form.budget, currency: 'INR', paid: 0, pending: form.budget },
                managerId: form.managerId || undefined,
            })
            if (res.success) {
                setShowCreate(false)
                setForm({ name: '', description: '', clientId: '', managerId: '', budget: 0, deadline: '', priority: 'medium' })
                fetchProjects()
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create project')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Projects</h1>
                    <p className="text-muted-foreground text-sm">Manage your agency projects</p>
                </div>
                <button onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-card border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{error}</div>}

            {/* Projects Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
                            <div className="h-5 w-3/4 skeleton rounded" />
                            <div className="h-3 w-full skeleton rounded" />
                            <div className="h-3 w-1/2 skeleton rounded" />
                        </div>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16">
                    <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No projects yet</h3>
                    <p className="text-muted-foreground text-sm">Create your first project to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map(project => (
                        <div key={project._id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all hover:shadow-lg">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-base font-semibold text-foreground truncate flex-1 mr-2">{project.name}</h3>
                                <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize', STATUS_STYLES[project.status])}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </div>
                            {project.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                            )}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Client</span>
                                    <span className="text-foreground font-medium truncate ml-2">
                                        {typeof project.clientId === 'object' ? project.clientId.name : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Budget</span>
                                    <span className="text-foreground font-medium">₹{project.budget.amount.toLocaleString('en-IN')}</span>
                                </div>
                                {project.deadline && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Deadline</span>
                                        <span className="text-foreground">{new Date(project.deadline).toLocaleDateString('en-IN')}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                                <span className={cn('text-xs px-2 py-0.5 rounded font-medium capitalize', PRIORITY_STYLES[project.priority])}>
                                    {project.priority}
                                </span>
                                {project.tags?.map(tag => (
                                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Create New Project</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        {createError && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm mb-4">
                                <AlertCircle className="w-4 h-4" /> {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Project Name *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                    className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                                    className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Client *</label>
                                    <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option value="">Select client</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.company || c.email})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Manager</label>
                                    <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option value="">Select manager</option>
                                        {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Budget (₹)</label>
                                    <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Deadline</label>
                                    <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Priority</label>
                                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors border border-border">Cancel</button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
