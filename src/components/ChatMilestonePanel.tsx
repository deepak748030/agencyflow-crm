import { useState, useEffect } from 'react'
import {
    X, Target, Loader2, Calendar, CheckCircle, Plus, AlertCircle,
    ChevronRight, Users, Bell, Download, Pencil, Trash2, FileDown
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { ErrorModal } from './ErrorModal'
import {
    getMilestones, createMilestone, updateMilestoneStatus,
    createRazorpayOrder, verifyRazorpayPayment, sendPaymentReminder as sendReminderApi,
    downloadMilestoneInvoice, updateMilestone, deleteMilestone as deleteMilestoneApi,
    downloadAllProjectInvoices,
    type Milestone, type Conversation
} from '../lib/api'
import { ConfirmModal } from './ConfirmModal'

declare global {
    interface Window {
        Razorpay: any
    }
}

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/10 text-primary',
    completed: 'bg-warning/10 text-warning',
    paid: 'bg-success/20 text-success',
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Awaiting Payment',
    paid: 'Paid',
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
    pending: ['in_progress'],
    in_progress: ['completed'],
    completed: ['paid'],
    paid: [],
}

interface Props {
    conversation: Conversation
    open: boolean
    onClose: () => void
    onPaymentUpdate?: () => void
}

export function ChatMilestonePanel({ conversation, open, onClose, onPaymentUpdate }: Props) {
    const { user } = useAuth()
    const [milestones, setMilestones] = useState<Milestone[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [statusAction, setStatusAction] = useState<{ id: string; status: string } | null>(null)
    const [form, setForm] = useState({ title: '', description: '', amount: 0, dueDate: '' })
    const [payingId, setPayingId] = useState<string | null>(null)
    const [sendingReminder, setSendingReminder] = useState<string | null>(null)
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
    const [downloadingAll, setDownloadingAll] = useState(false)
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
    const [editForm, setEditForm] = useState({ title: '', description: '', amount: 0, dueDate: '' })
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Milestone | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [errorModal, setErrorModal] = useState<{ title?: string; message: string } | null>(null)

    const projectId = typeof conversation.projectId === 'object' ? conversation.projectId._id : conversation.projectId
    const projectName = typeof conversation.projectId === 'object' ? conversation.projectId.name : 'Project'
    const isAdmin = user?.role === 'admin'
    const canModifyStatus = ['admin', 'manager', 'developer'].includes(user?.role || '')
    const isClient = user?.role === 'client'
    const canCreate = ['admin', 'manager'].includes(user?.role || '')

    useEffect(() => {
        if (open && projectId) fetchMilestones()
    }, [open, projectId])

    const extractError = (err: unknown): string => {
        if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as any
            return axiosErr.response?.data?.message || axiosErr.response?.statusText || 'Something went wrong'
        }
        if (err instanceof Error) return err.message
        return 'An unexpected error occurred'
    }

    const fetchMilestones = async () => {
        setLoading(true)
        try {
            const res = await getMilestones(projectId)
            if (res.success) setMilestones(res.response)
        } catch (err) {
            setErrorModal({ title: 'Load Failed', message: extractError(err) })
        }
        finally { setLoading(false) }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.amount) { setCreateError('Title and amount are required'); return }
        setCreating(true); setCreateError('')
        try {
            await createMilestone({
                projectId, title: form.title, description: form.description || undefined,
                amount: form.amount, dueDate: form.dueDate || undefined,
            })
            setShowCreate(false)
            setForm({ title: '', description: '', amount: 0, dueDate: '' })
            fetchMilestones()
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create milestone')
        } finally { setCreating(false) }
    }

    const handleStatusUpdate = async () => {
        if (!statusAction) return
        try {
            await updateMilestoneStatus(statusAction.id, statusAction.status)
            fetchMilestones()
            onPaymentUpdate?.()
        } catch (err) {
            setErrorModal({ title: 'Status Update Failed', message: extractError(err) })
        }
        setStatusAction(null)
    }

    const handleRazorpayPayment = async (milestone: Milestone) => {
        setPayingId(milestone._id)
        try {
            const res = await createRazorpayOrder(milestone._id)
            if (!res.success) {
                setErrorModal({ title: 'Payment Error', message: 'Failed to create payment order' })
                return
            }

            const { orderId, amount, currency, keyId } = res.response
            const options = {
                key: keyId, amount, currency,
                name: 'AgencyFlow',
                description: `Payment for: ${milestone.title}`,
                order_id: orderId,
                handler: async (response: any) => {
                    try {
                        await verifyRazorpayPayment(milestone._id, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        })
                        fetchMilestones()
                        onPaymentUpdate?.()
                    } catch (err) {
                        setErrorModal({ title: 'Payment Verification Failed', message: extractError(err) })
                    }
                },
                prefill: { name: user?.name || '', email: user?.email || '' },
                theme: { color: '#6366f1' },
            }
            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (err) {
            setErrorModal({ title: 'Payment Error', message: extractError(err) })
        } finally {
            setPayingId(null)
        }
    }

    const handleSendReminder = async (milestoneId: string) => {
        setSendingReminder(milestoneId)
        try {
            await sendReminderApi(milestoneId)
        } catch (err) {
            setErrorModal({ title: 'Reminder Failed', message: extractError(err) })
        }
        finally { setSendingReminder(null) }
    }

    const handleDownloadInvoice = async (milestoneId: string) => {
        setDownloadingInvoice(milestoneId)
        try {
            await downloadMilestoneInvoice(milestoneId)
        } catch (err) {
            setErrorModal({ title: 'Invoice Download Failed', message: extractError(err) })
        }
        finally { setDownloadingInvoice(null) }
    }

    const handleDownloadAllInvoices = async () => {
        setDownloadingAll(true)
        try {
            await downloadAllProjectInvoices(projectId)
        } catch (err) {
            setErrorModal({ title: 'Bulk Download Failed', message: extractError(err) })
        }
        finally { setDownloadingAll(false) }
    }

    const openEdit = (m: Milestone) => {
        setEditingMilestone(m)
        setEditForm({
            title: m.title, description: m.description || '',
            amount: m.amount, dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '',
        })
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingMilestone) return
        setSaving(true)
        try {
            await updateMilestone(editingMilestone._id, {
                title: editForm.title, description: editForm.description,
                amount: editForm.amount, dueDate: editForm.dueDate || null,
            })
            setEditingMilestone(null)
            fetchMilestones()
        } catch (err) {
            setErrorModal({ title: 'Edit Failed', message: extractError(err) })
        }
        finally { setSaving(false) }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteMilestoneApi(deleteTarget._id)
            setDeleteTarget(null)
            fetchMilestones()
            onPaymentUpdate?.()
        } catch (err) {
            setErrorModal({ title: 'Delete Failed', message: extractError(err) })
        }
        finally { setDeleting(false) }
    }

    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
    const paidAmount = milestones.filter(m => m.status === 'paid').reduce((sum, m) => sum + m.amount, 0)
    const hasPaidMilestones = milestones.some(m => m.status === 'paid')

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="h-14 px-4 flex items-center gap-3 border-b border-border flex-shrink-0">
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-sm">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{projectName}</p>
                        <p className="text-xs text-muted-foreground">Milestones & Payments</p>
                    </div>
                    <div className="flex items-center gap-1">
                        {hasPaidMilestones && (
                            <button onClick={handleDownloadAllInvoices} disabled={downloadingAll}
                                className="flex items-center gap-1 px-2 py-1.5 bg-success/10 text-success rounded-sm hover:bg-success/20 transition-colors text-xs font-medium disabled:opacity-50"
                                title="Download all invoices">
                                {downloadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                                All
                            </button>
                        )}
                        {canCreate && (
                            <button onClick={() => { setShowCreate(true); setCreateError('') }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors text-xs font-medium">
                                <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                        )}
                    </div>
                </div>

                {/* Members */}
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>{conversation.participants?.filter(p => p.isActive).length || 0} members</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {conversation.participants?.filter(p => p.isActive).map((p, i) => {
                            const pUser = typeof p.userId === 'object' ? p.userId as any : null
                            return (
                                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-sm">
                                    {pUser?.name || 'User'} <span className="text-muted-foreground capitalize">({pUser?.role || p.role})</span>
                                </span>
                            )
                        })}
                    </div>
                </div>

                {/* Summary */}
                {milestones.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border">
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                            <p className="text-sm font-bold text-foreground">₹{totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                            <p className="text-sm font-bold text-success">₹{paidAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                            <p className="text-sm font-bold text-warning">₹{(totalAmount - paidAmount).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                )}

                {/* Milestones List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : milestones.length === 0 ? (
                        <div className="text-center py-12">
                            <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                            <p className="text-sm font-medium text-foreground">No milestones yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {canCreate ? 'Create your first milestone' : 'No milestones have been added'}
                            </p>
                        </div>
                    ) : (
                        milestones.map(milestone => {
                            const nextStatuses = STATUS_TRANSITIONS[milestone.status] || []
                            const allowedTransitions = canModifyStatus
                                ? nextStatuses.filter(s => {
                                    if (s === 'paid') return isAdmin
                                    return true
                                })
                                : []

                            return (
                                <div key={milestone._id} className="bg-muted/30 border border-border rounded-sm p-4">
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="text-sm font-semibold text-foreground">{milestone.title}</h4>
                                        <div className="flex items-center gap-1">
                                            {isAdmin && milestone.status !== 'paid' && (
                                                <>
                                                    <button onClick={() => openEdit(milestone)}
                                                        className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Edit milestone">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(milestone)}
                                                        className="p-1 hover:bg-destructive/10 rounded-sm text-muted-foreground hover:text-destructive transition-colors"
                                                        title="Delete milestone">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                            <span className={cn('text-[10px] px-2 py-0.5 rounded-sm font-medium whitespace-nowrap', STATUS_STYLES[milestone.status])}>
                                                {STATUS_LABELS[milestone.status]}
                                            </span>
                                        </div>
                                    </div>
                                    {milestone.description && (
                                        <p className="text-xs text-muted-foreground mb-2">{milestone.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>₹{milestone.amount.toLocaleString('en-IN')}</span>
                                        {milestone.dueDate && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(milestone.dueDate).toLocaleDateString('en-IN')}
                                            </span>
                                        )}
                                        {milestone.paidAt && (
                                            <span className="flex items-center gap-1 text-success">
                                                <CheckCircle className="w-3 h-3" /> Paid
                                            </span>
                                        )}
                                    </div>

                                    {/* Status transition buttons */}
                                    {allowedTransitions.length > 0 && (
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-border/50">
                                            {allowedTransitions.map(ns => (
                                                <button key={ns} onClick={() => setStatusAction({ id: milestone._id, status: ns })}
                                                    className="text-[11px] px-2.5 py-1 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium flex items-center gap-1">
                                                    <ChevronRight className="w-3 h-3" /> {STATUS_LABELS[ns]}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Razorpay Pay button for client */}
                                    {isClient && milestone.status === 'completed' && (
                                        <div className="mt-2 pt-2 border-t border-border/50">
                                            <button onClick={() => handleRazorpayPayment(milestone)}
                                                disabled={payingId === milestone._id}
                                                className="w-full py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                                {payingId === milestone._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                Pay ₹{milestone.amount.toLocaleString('en-IN')}
                                            </button>
                                        </div>
                                    )}

                                    {/* Send reminder for admin/manager */}
                                    {['admin', 'manager'].includes(user?.role || '') && milestone.status === 'completed' && (
                                        <div className="mt-2">
                                            <button onClick={() => handleSendReminder(milestone._id)}
                                                disabled={sendingReminder === milestone._id}
                                                className="text-[11px] px-2.5 py-1 rounded-sm bg-warning/10 text-warning hover:bg-warning/20 transition-colors font-medium flex items-center gap-1 disabled:opacity-50">
                                                {sendingReminder === milestone._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                                                Send Payment Reminder
                                            </button>
                                        </div>
                                    )}

                                    {/* Download invoice for paid milestones */}
                                    {milestone.status === 'paid' && (
                                        <div className="mt-2 pt-2 border-t border-border/50">
                                            <button onClick={() => handleDownloadInvoice(milestone._id)}
                                                disabled={downloadingInvoice === milestone._id}
                                                className="text-[11px] px-2.5 py-1 rounded-sm bg-success/10 text-success hover:bg-success/20 transition-colors font-medium flex items-center gap-1 disabled:opacity-50">
                                                {downloadingInvoice === milestone._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                Download Invoice
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-card border border-border rounded-sm w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-foreground">New Milestone</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded-sm"><X className="w-4 h-4" /></button>
                        </div>
                        {createError && (
                            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-xs mb-3">
                                <AlertCircle className="w-3.5 h-3.5" /> {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-foreground">Title *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                                    className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-foreground">Amount (₹) *</label>
                                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required min={1}
                                        className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-foreground">Due Date</label>
                                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2 bg-muted text-foreground rounded-sm text-sm font-medium hover:bg-muted/80 transition-colors border border-border">Cancel</button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingMilestone && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setEditingMilestone(null)}>
                    <div className="bg-card border border-border rounded-sm w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-foreground">Edit Milestone</h3>
                            <button onClick={() => setEditingMilestone(null)} className="p-1 hover:bg-muted rounded-sm"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleEdit} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-foreground">Title *</label>
                                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required
                                    className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-foreground">Description</label>
                                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                                    className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-foreground">Amount (₹) *</label>
                                    <input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })} required min={1}
                                        className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-foreground">Due Date</label>
                                    <input type="date" value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingMilestone(null)}
                                    className="flex-1 py-2 bg-muted text-foreground rounded-sm text-sm font-medium hover:bg-muted/80 transition-colors border border-border">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />} Save
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

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete Milestone"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
                confirmLabel={deleting ? 'Deleting...' : 'Delete'}
                variant="destructive"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <ErrorModal
                open={!!errorModal}
                title={errorModal?.title}
                message={errorModal?.message || ''}
                onClose={() => setErrorModal(null)}
            />
        </>
    )
}
