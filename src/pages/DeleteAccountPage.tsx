import { useState } from 'react'
import { ArrowLeft, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shree-jii-server.vercel.app/api'

export function DeleteAccountPage() {
    const navigate = useNavigate()
    const [mobile, setMobile] = useState('')
    const [confirmMobile, setConfirmMobile] = useState('')
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const cleaned = mobile.trim().replace(/[^0-9]/g, '')
        if (cleaned.length < 10 || cleaned.length > 15) {
            setError('Please enter a valid mobile number (10-15 digits)')
            return
        }

        setStep('confirm')
    }

    const handleConfirmDelete = async () => {
        setError('')

        if (confirmMobile.trim() !== mobile.trim()) {
            setError('Mobile numbers do not match. Please re-enter to confirm.')
            return
        }

        setLoading(true)
        try {
            const cleaned = mobile.trim().replace(/[^0-9]/g, '')
            const response = await fetch(`${API_BASE_URL}/naam-jap/delete-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: cleaned }),
            })
            const data = await response.json()

            if (data.success) {
                setStep('success')
            } else {
                setError(data.message || 'Failed to delete account. Please try again.')
            }
        } catch {
            setError('Network error. Please check your connection and try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 bg-card border-b border-border">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground">Delete Account — Shree Jee</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                {step === 'form' && (
                    <>
                        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-destructive mb-1">Warning: This action is permanent</h3>
                                <p className="text-xs text-destructive/80 leading-relaxed">
                                    Deleting your account will permanently remove all your data including your Naam Jap count, Mala records, daily logs, and profile information. This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-5 mb-6">
                            <h2 className="text-base font-semibold text-foreground mb-1">What will be deleted:</h2>
                            <ul className="text-sm text-muted-foreground space-y-1.5 mt-3">
                                <li>• Your profile information (name, city, mobile)</li>
                                <li>• All Naam Jap counter data & Mala records</li>
                                <li>• Daily activity logs</li>
                                <li>• Leaderboard ranking</li>
                                <li>• Push notification settings</li>
                            </ul>
                        </div>

                        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Enter your registered mobile number
                            </label>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
                                maxLength={15}
                                required
                            />
                            {error && <p className="text-destructive text-xs mt-2">{error}</p>}
                            <button
                                type="submit"
                                className="w-full mt-4 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Proceed to Delete Account
                            </button>
                        </form>
                    </>
                )}

                {step === 'confirm' && (
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <h2 className="text-base font-semibold text-foreground">Confirm Account Deletion</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            To confirm deletion, please re-enter your mobile number: <span className="font-medium text-foreground">{mobile}</span>
                        </p>
                        <input
                            type="tel"
                            value={confirmMobile}
                            onChange={(e) => setConfirmMobile(e.target.value)}
                            placeholder="Re-enter mobile number"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
                            maxLength={15}
                        />
                        {error && <p className="text-destructive text-xs mt-2">{error}</p>}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setStep('form'); setConfirmMobile(''); setError('') }}
                                className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={loading}
                                className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Deleting...' : 'Delete Forever'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="bg-card border border-border rounded-xl p-6 text-center">
                        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">Account Deleted Successfully</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Your account and all associated data have been permanently deleted from Shree Jee. You can uninstall the app or create a new account at any time.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            Go to Home
                        </button>
                    </div>
                )}

                <div className="mt-8 bg-card border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Data Deletion Policy</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        In compliance with Google Play Store policies, Shree Jee provides this self-service account deletion option. Upon deletion, all personal data is permanently removed from our servers within 24 hours. No backup copies are retained. If you have any concerns, please contact us before proceeding with deletion.
                    </p>
                </div>
            </main>
        </div>
    )
}
