'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <span className="inline-block w-6 h-6 border-2 border-current/30 border-t-current rounded-full animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Admin header */}
            <header className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-xl font-bold">
                        <span style={{ color: 'var(--accent-blue)' }}>Blink</span>
                        <span style={{ color: 'var(--accent-pink)' }}>Test</span>
                    </Link>
                    <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ background: 'var(--accent-pink-muted)', color: 'var(--accent-pink)' }}>
                        Admin
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {profile?.name}
                    </span>
                    <button
                        onClick={toggleTheme}
                        className="text-sm px-2 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button
                        onClick={signOut}
                        className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-hover)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-8 py-8">
                {children}
            </main>
        </div>
    );
}
