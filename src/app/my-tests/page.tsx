'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TestItem {
    id: string;
    creator_name: string;
    channel_tag: string;
    status: string;
    created_at: string;
    response_count: number;
    avg_clarity: number | null;
    thumbnail_url: string | null;
}

interface ResponseItem {
    id: string;
    tester_name: string;
    answer_html: string;
    clarity_rating: number;
    created_at: string;
}

export default function MyTestsPage() {
    const { theme, toggleTheme } = useTheme();
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const router = useRouter();

    const [tests, setTests] = useState<TestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTest, setExpandedTest] = useState<string | null>(null);
    const [responses, setResponses] = useState<Record<string, ResponseItem[]>>({});
    const [loadingResponses, setLoadingResponses] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/my-tests');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user) loadTests();
    }, [user]);

    const loadTests = async () => {
        // Fetch tests created by this user
        const { data: testsData } = await supabase
            .from('tests')
            .select('*')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false });

        if (!testsData) {
            setLoading(false);
            return;
        }

        // For each test, get response count, avg clarity, and thumbnail
        const enriched: TestItem[] = await Promise.all(
            testsData.map(async (t) => {
                // Get response stats
                const { data: respData } = await supabase
                    .from('responses')
                    .select('clarity_rating')
                    .eq('test_id', t.id);

                const count = respData?.length || 0;
                const avg = count > 0
                    ? respData!.reduce((sum, r) => sum + r.clarity_rating, 0) / count
                    : null;

                // Get thumbnail
                const { data: variants } = await supabase
                    .from('test_variants')
                    .select('thumbnail_url')
                    .eq('test_id', t.id)
                    .limit(1);

                return {
                    id: t.id,
                    creator_name: t.creator_name,
                    channel_tag: t.channel_tag,
                    status: t.status,
                    created_at: t.created_at,
                    response_count: count,
                    avg_clarity: avg,
                    thumbnail_url: variants?.[0]?.thumbnail_url || null,
                };
            })
        );

        setTests(enriched);
        setLoading(false);
    };

    const loadResponses = async (testId: string) => {
        if (expandedTest === testId) {
            setExpandedTest(null);
            return;
        }

        // Check cache
        if (responses[testId]) {
            setExpandedTest(testId);
            return;
        }

        setLoadingResponses(testId);
        setExpandedTest(testId);

        const { data } = await supabase
            .from('responses')
            .select('*')
            .eq('test_id', testId)
            .order('created_at', { ascending: false });

        setResponses((prev) => ({ ...prev, [testId]: data || [] }));
        setLoadingResponses(null);
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

    const ratingEmoji = (rating: number) => {
        if (rating <= 1) return '😕';
        if (rating <= 2) return '🤔';
        if (rating <= 3) return '😐';
        if (rating <= 4) return '😊';
        return '🤩';
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
            </div>
        );
    }

    if (!user) return null;

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
                        Home
                    </Link>
                    <button onClick={toggleTheme} className="text-sm px-2 py-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button onClick={signOut} className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border-primary)' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-10">
                {/* Page heading */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        My Tests
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {tests.length} test{tests.length !== 1 ? 's' : ''} published by {profile?.name || 'you'}
                    </p>
                </div>

                {/* Test list */}
                {tests.length === 0 ? (
                    <div className="text-center py-20 rounded-xl border-2 border-dashed"
                        style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="text-4xl mb-3">📋</div>
                        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                            You haven't published any tests yet.
                        </p>
                        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                            Create and flash-test a thumbnail to get started.
                        </p>
                        <Link href="/" className="btn-primary text-sm px-6 py-2.5">
                            Create a Test
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tests.map((t) => (
                            <div key={t.id} className="rounded-xl overflow-hidden"
                                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
                                {/* Test card */}
                                <button
                                    onClick={() => loadResponses(t.id)}
                                    className="w-full text-left px-5 py-4 flex items-center gap-4 transition-colors"
                                    style={{ background: expandedTest === t.id ? 'var(--bg-elevated)' : 'transparent' }}
                                >
                                    {/* Thumbnail */}
                                    {t.thumbnail_url ? (
                                        <img src={t.thumbnail_url} alt="" className="w-20 h-12 object-cover rounded-lg shrink-0"
                                            style={{ border: '1px solid var(--border-primary)' }} />
                                    ) : (
                                        <div className="w-20 h-12 rounded-lg shrink-0 flex items-center justify-center text-xs"
                                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                            No img
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{ background: 'var(--accent-blue-muted)', color: 'var(--accent-blue)' }}>
                                                {t.channel_tag}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {timeAgo(t.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                            Test #{t.id.slice(0, 8)}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-5 shrink-0">
                                        <div className="text-center">
                                            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {t.response_count}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>responses</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {t.avg_clarity ? t.avg_clarity.toFixed(1) : '—'}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>clarity</p>
                                        </div>
                                        <div className="text-lg" style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expandedTest === t.id ? 'rotate(180deg)' : '' }}>
                                            ▾
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded responses */}
                                {expandedTest === t.id && (
                                    <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                        {/* Action bar */}
                                        <div className="flex items-center justify-between py-3 mb-3">
                                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                Responses ({t.response_count})
                                            </p>
                                            <div className="flex gap-2">
                                                <Link href={`/results/${t.id}`} className="text-xs px-3 py-1 rounded-lg transition-colors"
                                                    style={{ color: 'var(--accent-blue)', background: 'var(--accent-blue-muted)' }}>
                                                    Full Results →
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(`${window.location.origin}/test/${t.id}`);
                                                    }}
                                                    className="text-xs px-3 py-1 rounded-lg transition-colors"
                                                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}
                                                >
                                                    📋 Copy Link
                                                </button>
                                            </div>
                                        </div>

                                        {loadingResponses === t.id ? (
                                            <div className="text-center py-8">
                                                <span className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                                                    style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
                                            </div>
                                        ) : (responses[t.id]?.length || 0) === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                    No responses yet. Share the test link!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {responses[t.id]?.map((r) => (
                                                    <div key={r.id} className="rounded-lg p-4"
                                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                                    style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-pink))' }}>
                                                                    {r.tester_name?.charAt(0)?.toUpperCase() || '?'}
                                                                </div>
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    {r.tester_name}
                                                                </span>
                                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                                    {timeAgo(r.created_at)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-sm">{ratingEmoji(r.clarity_rating)}</span>
                                                                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                                    {r.clarity_rating}/5
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="text-sm leading-relaxed"
                                                            style={{ color: 'var(--text-secondary)' }}
                                                            dangerouslySetInnerHTML={{ __html: r.answer_html }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
