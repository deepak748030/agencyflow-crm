import { useEffect } from 'react'
import { X, WifiOff, ServerCrash, ShieldAlert, AlertCircle } from 'lucide-react'

interface ErrorModalProps {
    open: boolean
    title?: string
    message: string
    onClose: () => void
}

const getErrorIcon = (message: string) => {
    const lower = message.toLowerCase()
    if (lower.includes('network') || lower.includes('connection') || lower.includes('timeout'))
        return <WifiOff className="w-6 h-6" />
    if (lower.includes('server') || lower.includes('500') || lower.includes('something went wrong'))
        return <ServerCrash className="w-6 h-6" />
    if (lower.includes('permission') || lower.includes('forbidden') || lower.includes('403') || lower.includes('unauthorized'))
        return <ShieldAlert className="w-6 h-6" />
    return <AlertCircle className="w-6 h-6" />
}

export function ErrorModal({ open, title, message, onClose }: ErrorModalProps) {
    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open, onClose])

    if (!open) return null

    const icon = getErrorIcon(message)
    const errorTitle = title || 'Something went wrong'

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center sm:items-center justify-end sm:justify-center flex-col" onClick={onClose}>
            {/* Desktop: centered card, Mobile: slides up from bottom */}
            <div
                className="bg-card border border-border w-full sm:max-w-md sm:rounded-xl rounded-t-2xl rounded-b-none sm:rounded-b-xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Red accent top bar */}
                <div className="h-1 bg-gradient-to-r from-destructive via-destructive/80 to-destructive/50" />

                <div className="p-5 sm:p-6">
                    {/* Close button */}
                    <div className="flex justify-end -mt-1 -mr-1 mb-2">
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Icon + Content */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-4">
                            {icon}
                        </div>

                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {errorTitle}
                        </h3>

                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            {message}
                        </p>
                    </div>

                    {/* Action button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm hover:bg-destructive/90 transition-colors active:scale-[0.98]"
                    >
                        Got it
                    </button>

                    {/* Mobile drag indicator */}
                    <div className="flex justify-center mt-3 sm:hidden">
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                    </div>
                </div>
            </div>
        </div>
    )
}
