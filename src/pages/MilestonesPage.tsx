import { useState, useEffect } from 'react'
import { Target, Loader2, IndianRupee, Calendar, CheckCircle, Plus, X, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { getProjects, getMilestones, createMilestone, updateMilestoneStatus, Project, Milestone } from '../lib/api'
import { ConfirmModal } from '../components/ConfirmModal'

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/10 text-primary',
    submitted: 'bg-warning/10 text-warning',
    client_approved: 'bg-success/10 text-success',
    payment_pending: 'bg-accent/10 text-accent',
    paid: 'bg-success/20 text-success',
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['in_progress'],
    in_progress: ['submitted'],
    submitted: ['client_approved'],
    client_approved: ['payment_pending'],
    payment_pending: ['paid'],
    paid: [],
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    client_approved: 'Client Approved',
    payment_pending: 'Payment Pending',
    paid: 'Paid',
}

export function MilestonesPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState('')
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [milestonesLoading, setMilestonesLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [statusAction, setStatusAction] = useState<{ id: string; status: string } | null>(null)
    const [form, setForm] = useState({ title: '', description: '', amount: 0, dueDate: '' })

    useEffect(() => { fetchProjects() }, [])
    useEffect(() => {
        if (selectedProject) fetchMilestones(selectedProject)
        else setMilestones([])
    }, [selectedProject])

    const fetchProjects = async () => {
        try {
            const res = await getProjects({ limit: 100 })
            if (res.success) {
                setProjects(res.response.projects)
                if (res.response.projects.length > 0) setSelectedProject(res.response.projects[0]._id)
            }
        } catch { }
        finally { setIsLoading(false) }
    }

    const fetchMilestones = async (projectId: string) => {
        setMilestonesLoading(true)
        try {
            const res = await getMilestones(projectId)
            if (res.success) setMilestones(res.response)
        } catch { }
        finally { setMilestonesLoading(false) }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.amount) { setCreateError('Title and amount are required'); return }
        setCreating(true); setCreateError('')
        try {
            await createMilestone({
                projectId: selectedProject,
                title: form.title,
                description: form.description || undefined,
                amount: form.amount,
                dueDate: form.dueDate || undefined,
            })
            setShowCreate(false)
            setForm({ title: '', description: '', amount: 0, dueDate: '' })
            fetchMilestones(selectedProject)
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create milestone')
        } finally { setCreating(false) }
    }

    const handleStatusUpdate = async () => {
        if (!statusAction) return
        try {
            await updateMilestoneStatus(statusAction.id, statusAction.status)
            fetchMilestones(selectedProject)
        } catch { }
        setStatusAction(null)
    }

    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
    const paidAmount = milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0)

    return (
        <div className="animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Milestones</h1>
                    <p className="text-muted-foreground text-sm">Track project milestones and payments</p>
                </div>
                {selectedProject && (
                    <button onClick={() => { setShowCreate(true); setCreateError('') }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors font-medium">
                        <Plus className="w-4 h-4" /> New Milestone
                    </button>
                )}
            </div>

            <div className="flex gap-3">
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-card border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select a project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
            </div>

            {selectedProject && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border border-border rounded-sm p-4">
                        <p className="text-xs text-muted-foreground uppercase">Total</p>
                        <p className="text-lg font-bold text-foreground">₹{totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-card border border-border rounded-sm p-4">
                        <p className="text-xs text-muted-foreground uppercase">Paid</p>
                        <p className="text-lg font-bold text-success">₹{paidAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-card border border-border rounded-sm p-4">
                        <p className="text-xs text-muted-foreground uppercase">Pending</p>
                        <p className="text-lg font-bold text-warning">₹{(totalAmount - paidAmount).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            )}

            {isLoading || milestonesLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : !selectedProject ? (
                <div className="text-center py-16">
                    <Target className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">Select a project</h3>
                    <p className="text-muted-foreground text-sm">Choose a project to view its milestones</p>
                </div>
            ) : milestones.length === 0 ? (
                <div className="text-center py-16">
                    <Target className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No milestones</h3>
                    <p className="text-muted-foreground text-sm">Create your first milestone for this project</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {milestones.map(milestone => {
                        const nextStatuses = STATUS_TRANSITIONS[milestone.status] || []
                        return (
                            <div key={milestone._id} className="bg-card border border-border rounded-sm p-5 hover:border-primary/30 transition-all">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">{milestone.title}</h3>
                                        {milestone.description && <p className="text-sm text-muted-foreground mt-0.5">{milestone.description}</p>}
                                    </div>
                                    <span className={cn('text-xs px-2.5 py-1 rounded-sm font-medium capitalize whitespace-nowrap', STATUS_STYLES[milestone.status])}>
                                        {milestone.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                                    <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> ₹{milestone.amount.toLocaleString('en-IN')}</span>
                                    {milestone.dueDate && (
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(milestone.dueDate).toLocaleDateString('en-IN')}</span>
                                    )}
                                    {milestone.paidAt && (
                                        <span className="flex items-center gap-1 text-success"><CheckCircle className="w-3.5 h-3.5" /> Paid {new Date(milestone.paidAt).toLocaleDateString('en-IN')}</span>
                                    )}
                                </div>
                                {nextStatuses.length > 0 && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                                        {nextStatuses.map(ns => (
                                            <button key={ns} onClick={() => setStatusAction({ id: milestone._id, status: ns })}
                                                className="text-xs px-3 py-1.5 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                                                → {STATUS_LABELS[ns]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Milestone Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-card border border-border rounded-t-sm sm:rounded-sm w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-up sm:animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Create Milestone</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded-sm"><X className="w-5 h-5" /></button>
                        </div>
                        {createError && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm mb-4">
                                <AlertCircle className="w-4 h-4" /> {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Title *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                                    className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Amount (₹) *</label>
                                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required min={1}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Due Date</label>
                                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2.5 bg-muted text-foreground rounded-sm font-medium hover:bg-muted/80 transition-colors border border-border">Cancel</button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={!!statusAction}
                title="Update Milestone Status"
                message={`Move this milestone to "${statusAction ? STATUS_LABELS[statusAction.status] : ''}"?`}
                confirmLabel="Update"
                variant="default"
                onConfirm={handleStatusUpdate}
                onCancel={() => setStatusAction(null)}
            />
        </div>
    )
}
