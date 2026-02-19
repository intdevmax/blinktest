'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Sun, Moon, Eye, EyeOff, User } from 'lucide-react';

function RegisterForm() {
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';
    const { theme, toggleTheme } = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                email,
                name,
                role: 'member',
            });

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }
        }

        router.push(redirect);
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
                        Create your account
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Join the team and start testing thumbnails
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
                        {/* Name field */}
                        <div>
                            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider mb-2"
                                style={{ color: 'var(--text-muted)' }}>
                                Name
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <User size={15} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field w-full pl-10 text-sm"
                                    placeholder="Your name"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

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
                                    placeholder="At least 6 characters"
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

                        {/* Confirm password field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider mb-2"
                                style={{ color: 'var(--text-muted)' }}>
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock size={15} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field w-full pl-10 text-sm"
                                    placeholder="Repeat your password"
                                    required
                                />
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
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                {/* Sign in link */}
                <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link href={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                        className="font-semibold transition-colors"
                        style={{ color: 'var(--accent-blue)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                        Sign in
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

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
