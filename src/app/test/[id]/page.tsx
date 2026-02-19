'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import YouTubeMockup from '@/components/YouTubeMockup';
import ResponseModal from '@/components/ResponseModal';
import Link from 'next/link';

type Phase = 'loading' | 'name' | 'countdown' | 'instruction' | 'flash' | 'respond' | 'done';

interface TestData {
    id: string;
    creator_name: string;
    channel_tag: string;
    status: string;
}

interface VariantData {
    id: string;
    thumbnail_url: string;
    duration_badge: string;
}

export default function TestPage() {
    const { id } = useParams<{ id: string }>();
    const { theme } = useTheme();
    const { user, profile } = useAuth();
    const flashTimerRef = useRef<number | null>(null);

    const [phase, setPhase] = useState<Phase>('loading');
    const [test, setTest] = useState<TestData | null>(null);
    const [variant, setVariant] = useState<VariantData | null>(null);
    const [testerName, setTesterName] = useState(profile?.name || '');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        loadTest();
        return () => {
            if (flashTimerRef.current) cancelAnimationFrame(flashTimerRef.current);
        };
    }, [id]);

    const loadTest = async () => {
        const { data: testData } = await supabase
            .from('tests')
            .select('*')
            .eq('id', id)
            .single();

        if (!testData) {
            setError('Test not found.');
            setPhase('done');
            return;
        }

        const { data: variants } = await supabase
            .from('test_variants')
            .select('*')
            .eq('test_id', id)
            .order('display_order')
            .limit(1);

        setTest(testData);
        setVariant(variants?.[0] ?? null);
        setPhase('name');
    };

    const startTest = () => {
        if (!profile?.name) {
            setError('Profile not loaded yet.');
            return;
        }
        setError('');
        setCountdown(3);
        setPhase('countdown');
    };

    // Countdown → instruction → flash
    useEffect(() => {
        if (phase !== 'countdown') return;

        if (countdown === 0) {
            // Preload image then immediately flash (skip instruction screen)
            if (!variant) return;
            const img = new Image();
            img.onload = () => {
                setPhase('flash');
                const startTime = performance.now();
                const checkTimer = () => {
                    if (performance.now() - startTime >= 1000) {
                        setPhase('respond');
                    } else {
                        flashTimerRef.current = requestAnimationFrame(checkTimer);
                    }
                };
                flashTimerRef.current = requestAnimationFrame(checkTimer);
            };
            img.src = variant.thumbnail_url;
            return;
        }

        const timer = setTimeout(() => {
            setCountdown((c) => c - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [phase, countdown, variant]);

    const handleSubmit = async (answerHtml: string, clarityRating: number) => {
        if (!variant || !test) return;

        try {
            const { error: insertError } = await supabase.from('responses').insert({
                test_id: test.id,
                variant_id: variant.id,
                tester_name: profile?.name || 'Unknown',
                user_id: user?.id || null,
                answer_html: answerHtml,
                clarity_rating: clarityRating,
            });

            if (insertError) {
                console.error('Response insert error:', insertError);
                alert(`Failed to submit: ${insertError.message}`);
                return;
            }

            setPhase('done');
        } catch (err) {
            console.error('Submit error:', err);
            alert('Something went wrong submitting your response. Please try again.');
        }
    };

    // ==================== LOADING ====================
    if (phase === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <span className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
            </div>
        );
    }

    // ==================== NAME INPUT / AUTH GATE ====================
    if (phase === 'name') {
        if (!user) {
            return (
                <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
                    <div className="w-full max-w-sm text-center animate-fade-in">
                        <div className="text-xl font-bold mb-6">
                            <span style={{ color: 'var(--accent-blue)' }}>Blink</span>
                            <span style={{ color: 'var(--accent-pink)' }}>Test</span>
                        </div>

                        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{test?.creator_name}</strong> wants your feedback
                        </p>
                        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                            Sign in or create an account to take this test.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <Link href={`/login?redirect=/test/${id}`} className="btn-primary px-6 py-3">
                                Sign In
                            </Link>
                            <Link href={`/register?redirect=/test/${id}`} className="btn-secondary px-6 py-3">
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        // Logged in — auto-use profile name, skip to instruction
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
                <div className="w-full max-w-sm text-center animate-fade-in">
                    <div className="text-xl font-bold mb-6">
                        <span style={{ color: 'var(--accent-blue)' }}>Blink</span>
                        <span style={{ color: 'var(--accent-pink)' }}>Test</span>
                    </div>

                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{test?.creator_name}</strong> wants your feedback
                    </p>
                    <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                        You'll see a thumbnail for 1 second, then tell us what you saw.
                    </p>

                    {error && (
                        <p className="text-red-400 text-xs mb-3">{error}</p>
                    )}

                    <button onClick={startTest} className="btn-primary w-full py-3">
                        Start Test
                    </button>
                    <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                        Testing as <strong style={{ color: 'var(--text-primary)' }}>{profile?.name}</strong>
                    </p>
                </div>
            </div>
        );
    }

    // ==================== COUNTDOWN ====================
    if (phase === 'countdown') {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div key={countdown} className="text-center animate-countdown">
                    <div className="text-9xl font-black text-white" style={{
                        textShadow: '0 0 60px rgba(59,130,246,0.5), 0 0 120px rgba(59,130,246,0.2)',
                    }}>
                        {countdown}
                    </div>
                    <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Get ready...
                    </p>
                </div>
                <style>{`
                    @keyframes countdownPulse {
                        0% { transform: scale(0.5); opacity: 0; }
                        50% { transform: scale(1.1); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .animate-countdown {
                        animation: countdownPulse 0.5s ease-out;
                    }
                `}</style>
            </div>
        );
    }

    // ==================== INSTRUCTION ====================
    if (phase === 'instruction') {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center animate-fade-in">
                    <p className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Get ready…
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        A thumbnail will flash for 1 second
                    </p>
                </div>
            </div>
        );
    }

    // ==================== FLASH ====================
    if (phase === 'flash' && variant) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <YouTubeMockup
                    thumbnailUrl={variant.thumbnail_url}
                    durationBadge={variant.duration_badge}
                />
            </div>
        );
    }

    // ==================== RESPOND ====================
    if (phase === 'respond') {
        return (
            <ResponseModal
                onSubmit={handleSubmit}
                headingText="What was the thumbnail about?"
            />
        );
    }

    // ==================== DONE ====================
    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="text-center animate-fade-in">
                {error ? (
                    <>
                        <div className="text-4xl mb-4">⚠️</div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                    </>
                ) : (
                    <>
                        <div className="text-5xl mb-4">✓</div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Thanks, {testerName}!
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Your response has been recorded.
                        </p>
                    </>
                )}
                <div className="flex gap-3 justify-center">
                    <Link href="/" className="btn-primary text-sm">
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
