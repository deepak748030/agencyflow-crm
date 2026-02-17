import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Calendar, DollarSign, AlertCircle, CheckCircle2, ListTodo, Plus, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { getProject, getMilestones, getTasks, createTask, updateTaskStatus, getUsers, Project, Milestone, Task, User } from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-primary/15 text-primary',
    on_hold: 'bg-warning/15 text-warning',
    completed: 'bg-success/15 text-success',
}

const TASK_STATUS_STYLES: Record<string, string> = {
    todo: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/15 text-primary',
    review: 'bg-warning/15 text-warning',
    done: 'bg-success/15 text-success',
}

const MILESTONE_STYLES: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/15 text-primary',
    submitted: 'bg-accent/15 text-accent',
    client_approved: 'bg-success/15 text-success',
    payment_pending: 'bg-warning/15 text-warning',
    paid: 'bg-success/20 text-success',
}

export function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [project, setProject] = useState<Project | null>(null)
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones'>('overview')
    const [showAddTask, setShowAddTask] = useState(false)
    const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' })
    const [creatingTask, setCreatingTask] = useState(false)

    useEffect(() => {
        if (id) fetchAll()
    }, [id])

    const fetchAll = async () => {
        setIsLoading(true)
        try {
            const [projRes, milRes, taskRes, userRes] = await Promise.all([
                getProject(id!),
                getMilestones(id!),
                getTasks({ projectId: id }),
                getUsers({ limit: 100 }),
            ])
            if (projRes.success) setProject(projRes.response)
            if (milRes.success) setMilestones(milRes.response)
            if (taskRes.success) setTasks(taskRes.response.tasks)
            if (userRes.success) setUsers(userRes.response.users)
        } catch { }
        setIsLoading(false)
    }

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!taskForm.title) return
        setCreatingTask(true)
        try {
            await createTask({
                projectId: id!,
                title: taskForm.title,
                description: taskForm.description,
                assignedTo: taskForm.assignedTo || undefined,
                priority: taskForm.priority,
                deadline: taskForm.deadline || undefined,
            })
            setShowAddTask(false)
            setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', deadline: '' })
            const taskRes = await getTasks({ projectId: id })
            if (taskRes.success) setTasks(taskRes.response.tasks)
        } catch { }
        setCreatingTask(false)
    }

    const handleTaskStatus = async (taskId: string, status: string) => {
        await updateTaskStatus(taskId, status)
        const taskRes = await getTasks({ projectId: id })
        if (taskRes.success) setTasks(taskRes.response.tasks)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                <p className="text-muted-foreground">Project not found</p>
                <button onClick={() => navigate('/projects')} className="mt-4 text-primary hover:underline">Back to Projects</button>
            </div>
        )
    }

    const client = typeof project.clientId === 'object' ? project.clientId as User : null
    const manager = typeof project.managerId === 'object' ? project.managerId as User : null
    const totalMilestoneAmount = milestones.reduce((s, m) => s + m.amount, 0)
    const paidAmount = milestones.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
    const taskStats = {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => navigate('/projects')} className="p-2 hover:bg-muted rounded-xl transition-colors mt-1">
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                        <span className={cn('text-xs px-3 py-1 rounded-full font-medium', STATUS_STYLES[project.status])}>
                            {project.status.replace('_', ' ')}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{project.description || 'No description'}</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                        <DollarSign className="w-3.5 h-3.5" />Budget
                    </div>
                    <p className="text-lg font-bold text-foreground">₹{project.budget?.amount?.toLocaleString('en-IN') || 0}</p>
                    <p className="text-xs text-success mt-1">₹{paidAmount.toLocaleString('en-IN')} paid</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                        <ListTodo className="w-3.5 h-3.5" />Tasks
                    </div>
                    <p className="text-lg font-bold text-foreground">{tasks.length}</p>
                    <p className="text-xs text-primary mt-1">{taskStats.done} completed</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />Milestones
                    </div>
                    <p className="text-lg font-bold text-foreground">{milestones.length}</p>
                    <p className="text-xs text-success mt-1">{milestones.filter(m => m.status === 'paid').length} paid</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                        <Calendar className="w-3.5 h-3.5" />Deadline
                    </div>
                    <p className="text-lg font-bold text-foreground">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
                {(['overview', 'tasks', 'milestones'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                            activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Info */}
                    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                        <h3 className="font-semibold text-foreground">Project Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Client</span>
                                <span className="text-foreground">{client?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Manager</span>
                                <span className="text-foreground">{manager?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Priority</span>
                                <span className="text-foreground capitalize">{project.priority}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span className="text-foreground">{new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                            {project.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {project.tags.map((tag, i) => (
                                        <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="font-semibold text-foreground mb-4">Team Members</h3>
                        <div className="space-y-3">
                            {client && (
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{client.name}</p>
                                        <p className="text-xs text-muted-foreground">Client</p>
                                    </div>
                                </div>
                            )}
                            {manager && (
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                                        {manager.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{manager.name}</p>
                                        <p className="text-xs text-muted-foreground">Manager</p>
                                    </div>
                                </div>
                            )}
                            {Array.isArray(project.developerIds) && project.developerIds.map((dev: any, i: number) => {
                                const d = typeof dev === 'object' ? dev : null
                                return d ? (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">
                                            {d.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{d.name}</p>
                                            <p className="text-xs text-muted-foreground">Developer</p>
                                        </div>
                                    </div>
                                ) : null
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
                        <button onClick={() => setShowAddTask(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
                            <Plus className="w-4 h-4" /> Add Task
                        </button>
                    </div>
                    {tasks.length === 0 ? (
                        <div className="text-center py-16 bg-card border border-border rounded-xl">
                            <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No tasks yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div key={task._id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground text-sm">{task.title}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full', TASK_STATUS_STYLES[task.status])}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                                            {typeof task.assignedTo === 'object' && task.assignedTo && (
                                                <span className="text-xs text-muted-foreground">• {(task.assignedTo as any).name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <select value={task.status} onChange={(e) => handleTaskStatus(task._id, e.target.value)}
                                        className="text-xs px-2 py-1.5 rounded-lg bg-muted border border-border focus:outline-none">
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Task Modal */}
                    {showAddTask && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg animate-fade-in">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-foreground">Add Task</h2>
                                    <button onClick={() => setShowAddTask(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                                </div>
                                <form onSubmit={handleCreateTask} className="space-y-4">
                                    <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                        placeholder="Task title *" required
                                        className="w-full px-4 py-3 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        placeholder="Description" rows={2}
                                        className="w-full px-4 py-3 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                            className="px-4 py-3 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                            <option value="">Unassigned</option>
                                            {users.filter(u => u.role !== 'client').map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                        </select>
                                        <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                            className="px-4 py-3 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                        className="w-full px-4 py-3 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowAddTask(false)}
                                            className="px-5 py-2.5 bg-muted text-foreground rounded-xl font-medium">Cancel</button>
                                        <button type="submit" disabled={creatingTask}
                                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
                                            {creatingTask && <Loader2 className="w-4 h-4 animate-spin" />}Add
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'milestones' && (
                <div className="space-y-3">
                    {milestones.length === 0 ? (
                        <div className="text-center py-16 bg-card border border-border rounded-xl">
                            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No milestones yet</p>
                        </div>
                    ) : milestones.map(m => (
                        <div key={m._id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                            <div className="flex-1">
                                <p className="font-medium text-foreground text-sm">{m.title}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', MILESTONE_STYLES[m.status])}>
                                        {m.status.replace('_', ' ')}
                                    </span>
                                    {m.dueDate && <span className="text-xs text-muted-foreground">{new Date(m.dueDate).toLocaleDateString()}</span>}
                                </div>
                            </div>
                            <p className="text-sm font-bold text-foreground">₹{m.amount.toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                    <div className="flex justify-between p-4 bg-muted/30 rounded-xl text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold text-foreground">₹{totalMilestoneAmount.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
