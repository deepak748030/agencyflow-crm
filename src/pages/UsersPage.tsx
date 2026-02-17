import { useState, useEffect } from 'react'
import { Plus, Search, Users as UsersIcon, Loader2, X, AlertCircle, Mail, Phone } from 'lucide-react'
import { cn } from '../lib/utils'
import { getUsers, createUser, deleteUser, User } from '../lib/api'

const ROLE_STYLES: Record<string, string> = {
    admin: 'bg-destructive/10 text-destructive',
    manager: 'bg-warning/10 text-warning',
    developer: 'bg-primary/10 text-primary',
    client: 'bg-success/10 text-success',
}

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'developer',
        phone: '', company: '', designation: '',
    })

    useEffect(() => { fetchUsers() }, [search, roleFilter])

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const res = await getUsers({ search, role: roleFilter || undefined })
            if (res.success) setUsers(res.response.users)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch users')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setCreateError('')
        try {
            const res = await createUser(form)
            if (res.success) {
                setShowCreate(false)
                setForm({ name: '', email: '', password: '', role: 'developer', phone: '', company: '', designation: '' })
                fetchUsers()
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create user')
        } finally {
            setCreating(false)
        }
    }

    const handleDeactivate = async (userId: string) => {
        if (!confirm('Deactivate this user?')) return
        try {
            await deleteUser(userId)
            fetchUsers()
        } catch { /* ignore */ }
    }

    return (
        <div className="animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Users</h1>
                    <p className="text-muted-foreground text-sm">Manage team members and clients</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 bg-card border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="developer">Developer</option>
                    <option value="client">Client</option>
                </select>
            </div>

            {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{error}</div>}

            {/* Users Table */}
            {isLoading ? (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-16">
                    <UsersIcon className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No users found</h3>
                    <p className="text-muted-foreground text-sm">Add team members to get started</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">User</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Role</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Contact</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Company</th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Last Login</th>
                                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                                                    {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> :
                                                        <span className="text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.designation || user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize', ROLE_STYLES[user.role])}>{user.role}</span>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell">
                                            <div className="space-y-0.5">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</p>
                                                {user.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phone}</p>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 hidden lg:table-cell text-sm text-muted-foreground">{user.company || '—'}</td>
                                        <td className="py-3 px-4 hidden lg:table-cell text-sm text-muted-foreground">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button onClick={() => handleDeactivate(user._id)}
                                                className="text-xs text-destructive hover:text-destructive/80 transition-colors">
                                                Deactivate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Add New User</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        {createError && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm mb-4">
                                <AlertCircle className="w-4 h-4" /> {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Name *</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Role *</label>
                                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="developer">Developer</option>
                                        <option value="client">Client</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Email *</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                                    className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Password *</label>
                                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8}
                                    className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Min 8 characters" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Phone</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Company</label>
                                    <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                                        className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground">Designation</label>
                                <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                                    className="w-full mt-1 px-4 py-2.5 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors border border-border">Cancel</button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
