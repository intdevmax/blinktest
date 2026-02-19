'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    Sun,
    Moon,
    ChevronDown,
    LogOut,
    User,
    Shield,
    FlaskConical,
    Home,
} from 'lucide-react';

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const { user, profile, signOut } = useAuth();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [themeAnimating, setThemeAnimating] = useState(false);
    const [displayedTheme, setDisplayedTheme] = useState(theme);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync displayedTheme with actual theme (for initial render)
    useEffect(() => {
        setDisplayedTheme(theme);
    }, [theme]);

    // Close dropdown on Escape or outside click
    useEffect(() => {
        if (!dropdownOpen) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setDropdownOpen(false);
        };

        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('keydown', handleKey);
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [dropdownOpen]);

    const handleToggleTheme = useCallback(() => {
        if (themeAnimating) return;
        setThemeAnimating(true);

        setTimeout(() => {
            toggleTheme();
            setDisplayedTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
            setTimeout(() => setThemeAnimating(false), 400);
        }, 250);
    }, [themeAnimating, toggleTheme]);

    const handleSignOut = async () => {
        setDropdownOpen(false);
        await signOut();
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const ThemeIcon = displayedTheme === 'dark' ? Sun : Moon;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50" style={{ width: 'fit-content' }}>
            <nav
                className="flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 0 0 1px var(--border-subtle)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center px-2 py-1 rounded-full transition-all duration-200"
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={theme === 'dark' ? '/logowordmarkpink.svg' : '/logowordmarkblue.svg'}
                        alt="BlinkTest"
                        className="h-9"
                    />
                </Link>

                {/* Pill divider */}
                <div className="w-px h-6" style={{ background: 'var(--border-primary)' }} />

                {/* Nav items */}
                {user && (
                    <>
                        <Link
                            href="/"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.background = 'var(--bg-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <Home size={15} />
                            <span className="hidden sm:inline">Home</span>
                        </Link>
                        <Link
                            href="/my-tests"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.background = 'var(--bg-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <FlaskConical size={15} />
                            <span className="hidden sm:inline">My Tests</span>
                        </Link>

                        <div className="w-px h-6" style={{ background: 'var(--border-primary)' }} />
                    </>
                )}

                {/* Theme toggle */}
                <button
                    onClick={handleToggleTheme}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    <ThemeIcon
                        size={16}
                        className={themeAnimating ? 'theme-icon-exit' : 'theme-icon-enter'}
                        style={{ color: displayedTheme === 'dark' ? '#f59e0b' : '#6366f1' }}
                    />
                </button>

                {/* User section */}
                {user ? (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full transition-all duration-200"
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            aria-expanded={dropdownOpen}
                            aria-haspopup="true"
                            style={{ background: 'transparent' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-pink))',
                                    color: '#fff',
                                }}>
                                {getInitials(profile?.name)}
                            </div>
                            <ChevronDown
                                size={12}
                                style={{
                                    color: 'var(--text-muted)',
                                    transition: 'transform 0.2s',
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                                }}
                            />
                        </button>

                        {/* Dropdown */}
                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl py-1 z-50"
                                style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-primary)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                }}>
                                {/* User info header */}
                                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                            style={{
                                                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-pink))',
                                                color: '#fff',
                                            }}>
                                            {getInitials(profile?.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-sm font-semibold truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {profile?.name || 'User'}
                                            </p>
                                            <p
                                                className="text-xs truncate"
                                                style={{ color: 'var(--text-muted)' }}
                                            >
                                                {profile?.email || user.email}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Role badge */}
                                    <div className="mt-2">
                                        <span
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                                            style={{
                                                background: profile?.role === 'admin'
                                                    ? 'var(--accent-pink-muted)'
                                                    : 'var(--accent-blue-muted)',
                                                color: profile?.role === 'admin'
                                                    ? 'var(--accent-pink)'
                                                    : 'var(--accent-blue)',
                                            }}
                                        >
                                            {profile?.role === 'admin' ? (
                                                <Shield size={10} />
                                            ) : (
                                                <User size={10} />
                                            )}
                                            {profile?.role || 'member'}
                                        </span>
                                    </div>
                                </div>

                                {/* Sign out */}
                                <div className="px-2 py-1.5">
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
                                        style={{ color: 'var(--text-secondary)' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.color = '#ef4444';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        <LogOut size={15} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
                        style={{
                            background: 'var(--accent-blue)',
                            color: '#fff',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                        <User size={13} />
                        Sign In
                    </Link>
                )}
            </nav>
        </div>
    );
}
