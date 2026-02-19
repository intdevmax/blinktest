'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

interface FeedTest {
    id: string;
    creator_name: string;
    channel_tag: string;
    intended_message: string;
    status: string;
    created_at: string;
    test_variants: {
        id: string;
        thumbnail_url: string;
        duration_badge: string;
    }[];
    responses: { id: string }[];
}

export default function FeedPage() {
    const { theme, toggleTheme } = useTheme();
    const [tests, setTests] = useState<FeedTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTests();
    }, []);

    const loadTests = async () => {
        const { data } = await supabase
            .from('tests')
            .select('*, test_variants(*), responses(id)')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        setTests(data || []);
        setLoading(false);
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Top bar */}
            <header className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <Link href="/" className="text-xl font-bold">
                    <span style={{ color: 'var(--accent-blue)' }}>Blink</span>
                    <span style={{ color: 'var(--accent-pink)' }}>Test</span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/" className="text-sm transition-colors px-3 py-1.5 rounded-lg"
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
                        ＋ Test a Thumbnail
                    </Link>
                    <button
                        onClick={toggleTheme}
                        className="text-sm px-2 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Team Feed
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Flash test thumbnails from the team. Click any card to start.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                            style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
                    </div>
                ) : tests.length === 0 ? (
                    <div className="text-center py-20 rounded-xl border-2 border-dashed"
                        style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="text-4xl mb-3">📭</div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            No tests published yet.
                        </p>
                        <Link href="/" className="btn-primary inline-block mt-4 text-sm">
                            Be the first — test a thumbnail
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {tests.map((test) => {
                            const variant = test.test_variants[0];
                            return (
                                <Link
                                    key={test.id}
                                    href={`/test/${test.id}`}
                                    className="group block rounded-xl overflow-hidden transition-all duration-200"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-blue)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--border-primary)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    {/* Thumbnail */}
                                    {variant && (
                                        <div className="relative aspect-video">
                                            <img
                                                src={variant.thumbnail_url}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                                                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 px-4 py-2 rounded-full">
                                                    👁️ Flash Test
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{ background: 'var(--accent-blue-muted)', color: 'var(--accent-blue)' }}>
                                                {test.channel_tag}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {timeAgo(test.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                            by {test.creator_name}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {test.responses.length} response{test.responses.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
