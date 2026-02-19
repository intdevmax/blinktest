'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

interface TestResult {
    id: string;
    creator_name: string;
    channel_tag: string;
    status: string;
    created_at: string;
}

interface Variant {
    id: string;
    thumbnail_url: string;
    duration_badge: string;
}

interface Response {
    id: string;
    tester_name: string;
    answer_html: string;
    clarity_rating: number;
    created_at: string;
}

export default function ResultsPage() {
    const { id } = useParams<{ id: string }>();
    const { theme, toggleTheme } = useTheme();

    const [test, setTest] = useState<TestResult | null>(null);
    const [variant, setVariant] = useState<Variant | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResults();

        // Real-time subscription for new responses
        const channel = supabase
            .channel(`responses-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'responses',
                filter: `test_id=eq.${id}`,
            }, (payload) => {
                setResponses((prev) => [payload.new as Response, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const loadResults = async () => {
        const { data: testData } = await supabase
            .from('tests')
            .select('*')
            .eq('id', id)
            .single();

        if (testData) setTest(testData);

        const { data: variants } = await supabase
            .from('test_variants')
            .select('*')
            .eq('test_id', id)
            .order('display_order')
            .limit(1);

        if (variants?.[0]) setVariant(variants[0]);

        const { data: responsesData } = await supabase
            .from('responses')
            .select('*')
            .eq('test_id', id)
            .order('created_at', { ascending: false });

        setResponses(responsesData || []);
        setLoading(false);
    };

    const avgRating = responses.length > 0
        ? (responses.reduce((sum, r) => sum + r.clarity_rating, 0) / responses.length).toFixed(1)
        : '—';

    const shareLink = typeof window !== 'undefined'
        ? `${window.location.origin}/test/${id}`
        : '';

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
            </div>
        );
    }

    if (!test) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Test not found.</p>
                    <Link href="/" className="btn-primary inline-block mt-4 text-sm">Go Home</Link>
                </div>
            </div>
        );
    }

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
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-10">
                {/* Hero — thumbnail + stats */}
                <div className="flex flex-col sm:flex-row gap-6 mb-10">
                    {variant && (
                        <img
                            src={variant.thumbnail_url}
                            alt="Thumbnail"
                            className="w-full sm:w-72 aspect-video object-cover rounded-xl"
                            style={{ border: '1px solid var(--border-primary)' }}
                        />
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--accent-blue-muted)', color: 'var(--accent-blue)' }}>
                                {test.channel_tag}
                            </span>
                            <span className="text-xs capitalize" style={{
                                color: test.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)'
                            }}>
                                {test.status}
                            </span>
                        </div>
                        <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                            Test by {test.creator_name}
                        </p>
                        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                            Created {timeAgo(test.created_at)}
                        </p>

                        {/* Stats */}
                        <div className="flex gap-6">
                            <div>
                                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {responses.length}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Responses</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {avgRating}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Clarity</p>
                            </div>
                        </div>

                        {/* Share link */}
                        <div className="flex items-center gap-2 mt-4">
                            <input
                                readOnly
                                value={shareLink}
                                className="input-field text-xs flex-1"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(shareLink)}
                                className="btn-secondary text-xs shrink-0"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>
                </div>

                {/* Responses */}
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider mb-4"
                        style={{ color: 'var(--text-muted)' }}>
                        Responses ({responses.length})
                    </h2>

                    {responses.length === 0 ? (
                        <div className="text-center py-16 rounded-xl border-2 border-dashed"
                            style={{ borderColor: 'var(--border-primary)' }}>
                            <div className="text-3xl mb-3">🕐</div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                No responses yet. Share the test link with your team!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {responses.map((r) => (
                                <div key={r.id} className="rounded-xl p-5"
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
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
                                        className="text-sm leading-relaxed prose-sm"
                                        style={{ color: 'var(--text-secondary)' }}
                                        dangerouslySetInnerHTML={{ __html: r.answer_html }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
