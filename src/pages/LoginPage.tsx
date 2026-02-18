import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { setupAdmin } from '../lib/api'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [setupMessage, setSetupMessage] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            await login(email, password)
            navigate('/')
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Login failed')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSetup = async () => {
        setIsLoading(true)
        setError('')
        setSetupMessage('')
        try {
            const response = await setupAdmin()
            if (response.success) {
                setSetupMessage(`Admin created! Email: ${response.response.email}, Password: Admin@123`)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create admin')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-background" />
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 rounded-sm border border-foreground/20" />
                    <div className="absolute bottom-40 right-10 w-96 h-96 rounded-sm border border-foreground/10" />
                    <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-sm border border-foreground/15" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-sm">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">AgencyFlow</h1>
                            <p className="text-sm text-white/70">CRM Platform</p>
                        </div>
                    </div>

                    <div className="max-w-lg">
                        <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
                            Manage your agency with confidence
                        </h2>
                        <p className="text-lg text-white/80 leading-relaxed">
                            Projects, milestones, invoices, and team communication — all in one powerful platform built for software agencies.
                        </p>
                        <div className="mt-8 space-y-4">
                            {[
                                'Project lifecycle management',
                                'Milestone-based billing & invoicing',
                                'Real-time team communication',
                                'WhatsApp notifications & payment tracking',
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-accent" />
                                    <span className="text-white/90">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-sm text-white/60">
                        © 2026 AgencyFlow CRM. Built by Deepak Kushwah.
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-primary rounded-sm mb-4">
                            <Zap className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold text-primary">AgencyFlow</h1>
                        <p className="text-sm text-muted-foreground">CRM Platform</p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Welcome back!</h2>
                        <p className="text-muted-foreground mt-2">Sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-sm text-destructive">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}
                        {setupMessage && (
                            <div className="p-4 bg-success/10 border border-success/20 rounded-sm text-success text-sm">
                                {setupMessage}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                            <input
                                id="email" type="email" value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@agencyflow.com"
                                className="w-full px-4 py-3.5 bg-muted/50 border border-input rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                            <div className="relative">
                                <input
                                    id="password" type={showPassword ? 'text' : 'password'}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3.5 bg-muted/50 border border-input rounded-sm text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12 placeholder:text-muted-foreground/60"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base">
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                            ) : (
                                <>Sign In <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-border">
                        <p className="text-sm text-muted-foreground text-center mb-4">First time? Create default admin account</p>
                        <button onClick={handleSetup} disabled={isLoading}
                            className="w-full py-3.5 bg-muted text-foreground rounded-sm font-medium hover:bg-muted/80 disabled:opacity-50 transition-all border border-border">
                            Setup Default Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
