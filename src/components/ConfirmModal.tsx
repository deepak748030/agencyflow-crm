import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'destructive' | 'default'
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default', onConfirm, onCancel }: ConfirmModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
            <div
                className="bg-card border border-border rounded-t-sm sm:rounded-sm w-full sm:max-w-md p-6 animate-slide-up sm:animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-3 mb-4">
                    <div className={`p-2 rounded-sm ${variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <AlertTriangle className={`w-5 h-5 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{message}</p>
                    </div>
                    <button onClick={onCancel} className="p-1 hover:bg-muted rounded-sm">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 bg-muted text-foreground rounded-sm font-medium hover:bg-muted/80 transition-colors border border-border">
                        {cancelLabel}
                    </button>
                    <button onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-sm font-medium transition-colors ${variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
