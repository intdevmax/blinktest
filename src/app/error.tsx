'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-primary)' }}>
            <div className="text-center max-w-sm">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'var(--accent-pink-muted)' }}>
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Something went wrong
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Don&apos;t worry — your data is safe. Try refreshing.
                </p>
                <button
                    onClick={reset}
                    className="btn-primary px-6 py-2.5 flex items-center gap-2 mx-auto"
                >
                    <RefreshCw size={14} />
                    Try Again
                </button>
            </div>
        </div>
    );
}
