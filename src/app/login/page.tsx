'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Sun, Moon, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push(redirect);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-primary)' }}>

            {/* Background ambient glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03]"
                    style={{ background: 'radial-gradient(circle, var(--accent-blue), transparent)' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.02]"
                    style={{ background: 'radial-gradient(circle, var(--accent-pink), transparent)' }} />
            </div>

            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                className="fixed top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <div className="relative w-full max-w-[400px]">
                {/* Logo & header */}
                <div className="text-center mb-8">
                    <Link href="/">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={theme === 'dark' ? '/logoforloginpageblack.svg' : '/logoforloginpagewhite.svg'}
                            alt="BlinkTest"
                            className="h-14 mx-auto mb-6"
                        />
                    </Link>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Welcome back
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Sign in to continue testing thumbnails
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-7"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-primary)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    }}>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email field */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider mb-2"
                                style={{ color: 'var(--text-muted)' }}>
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field w-full pl-10 text-sm"
                                    placeholder="you@team.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider mb-2"
                                style={{ color: 'var(--text-muted)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock size={15} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field w-full pl-10 pr-10 text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                                style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid rgba(239, 68, 68, 0.15)',
                                    color: '#ef4444',
                                }}>
                                <span className="text-sm">⚠</span>
                                {error}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                                background: 'var(--accent-blue)',
                                color: '#fff',
                                opacity: loading ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {loading ? (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ArrowRight size={16} />
                            )}
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Sign up link */}
                <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                    Don&apos;t have an account?{' '}
                    <Link href={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                        className="font-semibold transition-colors"
                        style={{ color: 'var(--accent-blue)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                        Create account
                    </Link>
                </p>

                {/* Footer */}
                <p className="text-center text-[10px] mt-8" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
                    BlinkTest — Thumbnail testing for teams
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
