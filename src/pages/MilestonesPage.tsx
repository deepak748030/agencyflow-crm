import { useState, useEffect } from 'react'
import { Target, Loader2, IndianRupee, Calendar, CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { getProjects, getMilestones, Project, Milestone } from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/10 text-primary',
    submitted: 'bg-warning/10 text-warning',
    client_approved: 'bg-success/10 text-success',
    payment_pending: 'bg-accent/10 text-accent',
    paid: 'bg-success/20 text-success',
}

export function MilestonesPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState('')
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [milestonesLoading, setMilestonesLoading] = useState(false)

    useEffect(() => {
        fetchProjects()
    }, [])

    useEffect(() => {
        if (selectedProject) fetchMilestones(selectedProject)
        else setMilestones([])
    }, [selectedProject])

    const fetchProjects = async () => {
        try {
            const res = await getProjects({ limit: 100 })
            if (res.success) {
                setProjects(res.response.projects)
                if (res.response.projects.length > 0) {
                    setSelectedProject(res.response.projects[0]._id)
                }
            }
        } catch { /* ignore */ }
        finally { setIsLoading(false) }
    }

    const fetchMilestones = async (projectId: string) => {
        setMilestonesLoading(true)
        try {
            const res = await getMilestones(projectId)
            if (res.success) setMilestones(res.response)
        } catch { /* ignore */ }
        finally { setMilestonesLoading(false) }
    }

    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
    const paidAmount = milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0)

    return (
        <div className="animate-fade-in space-y-4">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Milestones</h1>
                <p className="text-muted-foreground text-sm">Track project milestones and payments</p>
            </div>

            {/* Project selector */}
            <div className="flex gap-3">
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-card border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select a project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
            </div>

            {/* Summary cards */}
            {selectedProject && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase">Total</p>
                        <p className="text-lg font-bold text-foreground">₹{totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase">Paid</p>
                        <p className="text-lg font-bold text-success">₹{paidAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground uppercase">Pending</p>
                        <p className="text-lg font-bold text-warning">₹{(totalAmount - paidAmount).toLocaleString('en-IN')}</p>
                    </div>
                </div>
            )}

            {/* Milestones list */}
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
                    <p className="text-muted-foreground text-sm">No milestones found for this project</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {milestones.map(milestone => (
                        <div key={milestone._id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">{milestone.title}</h3>
                                    {milestone.description && <p className="text-sm text-muted-foreground mt-0.5">{milestone.description}</p>}
                                </div>
                                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize whitespace-nowrap', STATUS_STYLES[milestone.status])}>
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
