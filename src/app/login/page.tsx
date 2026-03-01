'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Suspense } from 'react'

function LoginContent() {
    const searchParams = useSearchParams()
    const errorMsg = searchParams.get('errorMessage')

    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState<'login' | 'signup' | null>(null)

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-chirp">
            {/* Strict matte background with minimal grid */}
            <div className="absolute inset-0 z-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[380px] relative z-10 px-6"
            >
                {/* Minimal Logo & Header */}
                <div className="mb-10 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                        className="w-12 h-12 rounded-xl bg-[#111111] border border-white/10 flex items-center justify-center mb-6 shadow-sm"
                    >
                        <svg width="22" height="22" viewBox="0 0 14 14" fill="none" className="text-white/80">
                            <path d="M2 4L7 1L12 4V10L7 13L2 10V4Z" fill="white" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                            <path d="M7 1V13M2 4L12 10M12 4L2 10" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                            <circle cx="7" cy="7" r="1.5" fill="currentColor" opacity="0.8" />
                        </svg>
                    </motion.div>

                    <h2 className="text-[28px] font-bold tracking-tight text-white/90 mb-1.5">DEX OS</h2>
                    <p className="text-[13px] text-white/40 text-center font-medium">Developer Operations Center</p>
                </div>

                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 overflow-hidden rounded-lg border border-red-500/20 bg-[#160b0b]"
                    >
                        <div className="p-3.5 text-[13px] text-red-400 font-medium text-center flex items-center justify-center gap-2">
                            <ShieldCheck size={15} />
                            {errorMsg.replace(/\+/g, ' ')}
                        </div>
                    </motion.div>
                )}

                {/* Flat UI Form Card */}
                <form className="bg-[#111111] border border-[#222222] rounded-[20px] shadow-2xl p-7 flex flex-col gap-5">

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em] pl-0.5" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="pranav@example.com"
                            required
                            autoComplete="email"
                            className="w-full h-11 px-3.5 text-[14px] border border-[#2a2a2a] bg-[#0a0a0a] rounded-xl text-white/90 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em] pl-0.5" htmlFor="password">Security Key</label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                className="w-full h-11 pl-3.5 pr-11 text-[14px] border border-[#2a2a2a] bg-[#0a0a0a] rounded-xl text-white/90 focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20 tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/70 transition-colors focus:outline-none rounded-md"
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-3">
                        <button
                            formAction={(data) => {
                                setIsSubmitting('login')
                                login(data)
                            }}
                            disabled={isSubmitting !== null}
                            className="group relative w-full h-11 bg-white text-black hover:bg-[#e0e0e0] text-[14px] font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isSubmitting === 'login' ? <Loader2 size={16} className="animate-spin" /> : null}
                            <span>{isSubmitting === 'login' ? 'Authenticating...' : 'Sign In'}</span>
                        </button>

                        <button
                            formAction={(data) => {
                                setIsSubmitting('signup')
                                signup(data)
                            }}
                            disabled={isSubmitting !== null}
                            className="w-full h-11 bg-transparent hover:bg-[#1a1a1a] text-white/50 hover:text-white/90 border border-[#2a2a2a] text-[14px] font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting === 'signup' ? <Loader2 size={16} className="animate-spin" /> : null}
                            {isSubmitting === 'signup' ? 'Requesting...' : 'Request Access'}
                        </button>
                    </div>
                </form>

                <div className="flex justify-center mt-8">
                    <p className="text-[11px] text-white/20 font-medium tracking-wide">
                        SECURE ENCLAVE ✧ V0.1.0
                    </p>
                </div>
            </motion.div>
        </div>
    )
}


export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex w-full items-center justify-center bg-[#050505]"><Loader2 className="animate-spin text-blue-500" size={32} /></div>}>
            <LoginContent />
        </Suspense>
    )
}
