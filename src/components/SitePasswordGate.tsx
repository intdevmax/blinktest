'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const SITE_PASSWORDS = (process.env.NEXT_PUBLIC_SITE_PASSWORD || '').split(',').map(p => p.trim()).filter(Boolean);
const STORAGE_KEY = 'blinktest-site-auth';

export default function SitePasswordGate({ children }: { children: React.ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [shaking, setShaking] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        // If no password is configured, allow access
        if (SITE_PASSWORDS.length === 0) {
            setAuthenticated(true);
            setLoading(false);
            return;
        }

        // Check if already authenticated
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SITE_PASSWORDS.includes(stored)) {
            setAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (SITE_PASSWORDS.includes(password)) {
            localStorage.setItem(STORAGE_KEY, password);
            setAuthenticated(true);
        } else {
            setError('Incorrect password');
            setShaking(true);
            setTimeout(() => setShaking(false), 500);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'var(--bg-primary)' }}>
                <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
            </div>
        );
    }

    if (authenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-primary)' }}>

            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, var(--accent-blue), transparent)' }} />
            </div>

            <div className="relative w-full max-w-sm animate-fade-in-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={theme === 'dark' ? '/logoforloginpageblack.svg' : '/logoforloginpagewhite.svg'}
                        alt="BlinkTest"
                        className="h-16 mx-auto mb-4"
                    />
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider"
                        style={{
                            background: 'var(--accent-blue-muted)',
                            color: 'var(--accent-blue)',
                            border: '1px solid var(--accent-blue)',
                        }}>
                        <Sparkles size={10} />
                        Internal Access Only
                    </div>
                </div>

                {/* Password card */}
                <form onSubmit={handleSubmit}>
                    <div className="rounded-2xl p-6"
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-primary)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        }}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'var(--accent-blue-muted)' }}>
                                <Lock size={14} style={{ color: 'var(--accent-blue)' }} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Enter Password
                                </p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    This tool is restricted to team members
                                </p>
                            </div>
                        </div>

                        <div className={`relative ${shaking ? 'animate-shake' : ''}`}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                placeholder="Team password"
                                autoFocus
                                className="input-field w-full pr-12 text-sm"
                                style={{
                                    borderColor: error ? 'var(--accent-pink)' : undefined,
                                }}
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                style={{
                                    background: 'var(--accent-blue)',
                                    color: '#fff',
                                }}>
                                <ArrowRight size={14} />
                            </button>
                        </div>

                        {error && (
                            <p className="text-xs mt-2" style={{ color: 'var(--accent-pink)' }}>
                                {error}
                            </p>
                        )}
                    </div>
                </form>

                {/* Footer hint */}
                <p className="text-[10px] text-center mt-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                    Contact your team lead for access credentials
                </p>
            </div>

            {/* Shake animation */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
}
