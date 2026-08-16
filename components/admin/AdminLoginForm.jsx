'use client'

import { useState } from 'react'
import { LockIcon, MailIcon, EyeIcon, EyeOffIcon, ShieldCheckIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminLoginForm = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'idrisrashel@gmail.com'
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '@idris@1I@idris@1I@idris@1I'

        if (email.trim() === adminEmail && password === adminPassword) {
            localStorage.setItem('adminAuthenticated', 'true')
            toast.success('Admin authentication successful!')
            onLoginSuccess()
        } else {
            toast.error('Invalid email or password!')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <ShieldCheckIcon size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
                    <p className="text-xs text-slate-500 mt-1">Please enter your credentials to access management dashboard</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Admin Email
                        </label>
                        <div className="relative">
                            <MailIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-slate-800 placeholder-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <LockIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-slate-800 placeholder-slate-400"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                            >
                                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-medium text-sm rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Admin'}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-400 mt-8">
                    GoCart &copy; {new Date().getFullYear()} Admin Security Panel
                </p>
            </div>
        </div>
    )
}

export default AdminLoginForm
