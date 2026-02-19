'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface AdminTest {
    id: string;
    creator_name: string;
    channel_tag: string;
    status: string;
    created_at: string;
    test_variants: { thumbnail_url: string }[];
    responses: { id: string }[];
}

export default function AdminDashboardPage() {
    const [tests, setTests] = useState<AdminTest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTests();
    }, []);

    const loadTests = async () => {
        const { data } = await supabase
            .from('tests')
            .select('*, test_variants(thumbnail_url), responses(id)')
            .order('created_at', { ascending: false });

        setTests(data || []);
        setLoading(false);
    };

    const archiveTest = async (testId: string) => {
        await supabase.from('tests').update({ status: 'archived' }).eq('id', testId);
        loadTests();
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>All Tests</h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage all thumbnail tests
                    </p>
                </div>
                <Link href="/admin/users" className="btn-secondary text-sm">
                    👥 Users
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
                </div>
            ) : tests.length === 0 ? (
                <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
                    No tests yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {tests.map((test) => (
                        <div key={test.id} className="flex items-center gap-4 rounded-xl p-4"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
                            {test.test_variants[0] && (
                                <img src={test.test_variants[0].thumbnail_url} alt=""
                                    className="w-24 aspect-video object-cover rounded-lg shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    by {test.creator_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--accent-blue-muted)', color: 'var(--accent-blue)' }}>
                                        {test.channel_tag}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        {test.responses.length} responses
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        •
                                    </span>
                                    <span className="text-xs capitalize" style={{
                                        color: test.status === 'active' ? 'var(--accent-green)' :
                                            test.status === 'archived' ? 'var(--text-muted)' : 'var(--accent-blue)'
                                    }}>
                                        {test.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {test.status === 'active' && (
                                    <button
                                        onClick={() => archiveTest(test.id)}
                                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
                                    >
                                        Archive
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
