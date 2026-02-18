import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle, User, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, updatePassword } from '../lib/api'

export function SettingsPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

    const [name, setName] = useState(user?.name || '')
    const [email, setEmail] = useState(user?.email || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [company, setCompany] = useState(user?.company || '')
    const [designation, setDesignation] = useState(user?.designation || '')

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true); setError(''); setSuccess('')
        try {
            const res = await updateProfile({ name, email, phone, company, designation } as any)
            if (res.success) {
                setSuccess('Profile updated successfully')
                localStorage.setItem('auth_user', JSON.stringify(res.response))
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile')
        } finally { setSaving(false) }
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
        setSaving(true); setError(''); setSuccess('')
        try {
            const res = await updatePassword(currentPassword, newPassword)
            if (res.success) {
                setSuccess('Password updated successfully')
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update password')
        } finally { setSaving(false) }
    }

    return (
        <div className="animate-fade-in space-y-4 max-w-2xl">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground text-sm">Manage your account settings</p>
            </div>

            <div className="flex gap-1 bg-muted p-1 rounded-sm w-fit">
                <button onClick={() => { setActiveTab('profile'); setError(''); setSuccess('') }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => { setActiveTab('password'); setError(''); setSuccess('') }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${activeTab === 'password' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Lock className="w-4 h-4" /> Password
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-sm text-success text-sm">
                    <CheckCircle className="w-4 h-4" /> {success}
                </div>
            )}

            {activeTab === 'profile' ? (
                <form onSubmit={handleProfileUpdate} className="bg-card border border-border rounded-sm p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Name</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Phone</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Company</label>
                            <input value={company} onChange={e => setCompany(e.target.value)}
                                className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground">Designation</label>
                        <input value={designation} onChange={e => setDesignation(e.target.value)}
                            className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Role: <span className="text-foreground font-medium capitalize">{user?.role}</span></span>
                    </div>
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                    </button>
                </form>
            ) : (
                <form onSubmit={handlePasswordUpdate} className="bg-card border border-border rounded-sm p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground">Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                            className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                            className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Min 8 characters" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                            className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
                    </button>
                </form>
            )}
        </div>
    )
}
