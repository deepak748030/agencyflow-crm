import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { setupAdmin } from '../lib/api'
import shreeJiLogo from '../assets/favicon.png'

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
                setSetupMessage(
                    `Default admin created! Email: ${response.response.email}, Password: Admin@123`
                )
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else {
                setError('Failed to create default admin')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1604823191457-2f8f83064a58?q=80&w=2070&auto=format&fit=crop')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-black/80" />

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-2xl">
                            <img src={shreeJiLogo} alt="Shree Ji" className="w-12 h-12 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">श्री जी</h1>
                            <p className="text-sm text-white/70">Shree Jii Admin Panel</p>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
                            Welcome to Shree Jii Admin
                        </h2>
                        <p className="text-lg text-white/80 leading-relaxed">
                            A powerful admin dashboard to manage and monitor your application with ease and efficiency.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                'Real-time dashboard & analytics',
                                'Secure admin management',
                                'Complete control panel',
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent" />
                                    <span className="text-white/90">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-sm text-white/60">
                        © 2025 Shree Jii. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md animate-fade-in">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl mb-4">
                            <img src={shreeJiLogo} alt="Shree Ji" className="w-12 h-12 object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-primary">श्री जी</h1>
                        <p className="text-sm text-muted-foreground">Shree Jii Admin</p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Welcome back!</h2>
                        <p className="text-muted-foreground mt-2">Sign in to your admin dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {setupMessage && (
                            <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-success text-sm">
                                {setupMessage}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@shreejii.com"
                                className="w-full px-4 py-3.5 bg-muted/50 border border-input rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3.5 bg-muted/50 border border-input rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12 placeholder:text-muted-foreground/60"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-border">
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            First time? Create default admin account
                        </p>
                        <button
                            onClick={handleSetup}
                            disabled={isLoading}
                            className="w-full py-3.5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 disabled:opacity-50 transition-all border border-border"
                        >
                            Setup Default Admin
                        </button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Need help? Contact{' '}
                        <a href="mailto:support@shreejii.com" className="text-primary hover:underline">
                            support@shreejii.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
