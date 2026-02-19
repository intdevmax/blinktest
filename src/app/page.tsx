'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import YouTubeMockup from '@/components/YouTubeMockup';
import ResponseModal from '@/components/ResponseModal';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
    Eye,
    ImagePlus,
    Upload,
    Zap,
    CheckCircle,
    Trash2,
    RefreshCw,
    Rocket,
    BarChart3,
    LogIn,
    UserPlus,
    Copy,
    ArrowRight,
    Sparkles,
} from 'lucide-react';

type Phase = 'landing' | 'countdown' | 'self-flash' | 'self-respond' | 'decide' | 'publishing' | 'published';

export default function LandingPage() {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const flashTimerRef = useRef<number | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [noMoreTests, setNoMoreTests] = useState(false);

    const reviewRandomTest = useCallback(async () => {
        if (!user) return;
        setReviewLoading(true);
        setNoMoreTests(false);

        // Get tests the user has already responded to
        const { data: myResponses } = await supabase
            .from('responses')
            .select('test_id')
            .eq('user_id', user.id);

        const respondedTestIds = myResponses?.map(r => r.test_id) || [];

        // Fetch active tests not created by this user
        let query = supabase
            .from('tests')
            .select('id')
            .eq('status', 'active')
            .neq('user_id', user.id);

        if (respondedTestIds.length > 0) {
            query = query.not('id', 'in', `(${respondedTestIds.join(',')})`);
        }

        const { data: availableTests } = await query;

        if (!availableTests || availableTests.length === 0) {
            setNoMoreTests(true);
            setReviewLoading(false);
            return;
        }

        // Pick a random test
        const randomTest = availableTests[Math.floor(Math.random() * availableTests.length)];
        router.push(`/test/${randomTest.id}`);
    }, [user, router]);

    const [phase, setPhase] = useState<Phase>('landing');

    // Form state
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

    const [durationBadge, setDurationBadge] = useState('10:00');
    const [channelTag, setChannelTag] = useState('Main');
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');

    // Self-test state
    const [selfAnswer, setSelfAnswer] = useState('');
    const [selfRating, setSelfRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [publishedTestId, setPublishedTestId] = useState('');
    const [countdown, setCountdown] = useState(3);
    const [copied, setCopied] = useState(false);

    const channels = ['Main', 'Gaming', 'Beast Reacts', 'Beast Philanthropy', 'Other'];

    const handleFile = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return;

        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const startFlashTest = () => {
        if (!thumbnailFile) {
            setError('Upload a thumbnail first.');
            return;
        }
        setError('');
        setCountdown(3);
        setPhase('countdown');
    };

    // Countdown → flash
    useEffect(() => {
        if (phase !== 'countdown') return;

        if (countdown === 0) {
            const img = new Image();
            img.onload = () => {
                setPhase('self-flash');
                const startTime = performance.now();
                const checkTimer = () => {
                    if (performance.now() - startTime >= 1000) {
                        setPhase('self-respond');
                    } else {
                        flashTimerRef.current = requestAnimationFrame(checkTimer);
                    }
                };
                flashTimerRef.current = requestAnimationFrame(checkTimer);
            };
            img.src = thumbnailPreview;
            return;
        }

        const timer = setTimeout(() => {
            setCountdown((c) => c - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [phase, countdown, thumbnailPreview]);

    useEffect(() => {
        return () => {
            if (flashTimerRef.current) cancelAnimationFrame(flashTimerRef.current);
        };
    }, []);

    const handleSelfRespond = async (answerHtml: string, clarityRating: number) => {
        setSelfAnswer(answerHtml);
        setSelfRating(clarityRating);
        setPhase('decide');
    };

    const publishTest = async () => {
        setSubmitting(true);
        setError('');

        try {
            const { data: test, error: testError } = await supabase
                .from('tests')
                .insert({
                    creator_name: profile?.name || 'Unknown',
                    channel_tag: channelTag,
                    user_id: user?.id || null,
                })
                .select()
                .single();

            if (testError) throw testError;

            const ext = thumbnailFile!.name.split('.').pop();
            const path = `thumbnails/${test.id}/0.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('thumbnails')
                .upload(path, thumbnailFile!, { cacheControl: '3600' });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('thumbnails')
                .getPublicUrl(path);

            const { error: variantError } = await supabase.from('test_variants').insert({
                test_id: test.id,
                thumbnail_url: urlData.publicUrl,
                display_order: 0,
                duration_badge: durationBadge,
            });

            if (variantError) throw variantError;

            setPublishedTestId(test.id);
            setPhase('published');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Something went wrong.';
            console.error('Publish error:', err);
            setError(msg);
            alert(`Publish failed: ${msg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const discardTest = () => {
        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
        setThumbnailFile(null);
        setThumbnailPreview('');
        setSelfAnswer('');
        setSelfRating(0);
        setPhase('landing');
    };

    const resetAll = () => {
        discardTest();
        setChannelTag('Main');
        setDurationBadge('10:00');
        setPublishedTestId('');
    };

    const handleCopyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ==================== COUNTDOWN ====================
    if (phase === 'countdown') {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: 'var(--bg-primary)' }}>
                <div key={countdown} className="text-center" style={{
                    animation: 'countdownPulse 0.5s ease-out',
                }}>
                    <div className="text-9xl font-black" style={{
                        color: 'var(--text-primary)',
                        textShadow: '0 0 60px rgba(59,130,246,0.5), 0 0 120px rgba(59,130,246,0.2)',
                    }}>
                        {countdown}
                    </div>
                    <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
                        Get ready...
                    </p>
                </div>
                <style>{`
                    @keyframes countdownPulse {
                        0% { transform: scale(0.5); opacity: 0; }
                        50% { transform: scale(1.1); opacity: 1; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    // ==================== FLASH SCREEN ====================
    if (phase === 'self-flash') {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: 'var(--bg-primary)' }}>
                <YouTubeMockup
                    thumbnailUrl={thumbnailPreview}
                    durationBadge={durationBadge}
                />
            </div>
        );
    }

    // ==================== RESPOND SCREEN ====================
    if (phase === 'self-respond') {
        return (
            <ResponseModal
                onSubmit={handleSelfRespond}
                headingText="What did you see? Does it communicate your intent?"
            />
        );
    }

    // ==================== DECISION SCREEN ====================
    if (phase === 'decide') {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in px-4"
                style={{ background: 'var(--bg-primary)' }}>
                <div className="w-full max-w-lg text-center">
                    {/* Thumbnail preview */}
                    <div className="relative inline-block mb-8">
                        <img
                            src={thumbnailPreview}
                            alt="Your thumbnail"
                            className="w-72 aspect-video object-cover rounded-xl"
                            style={{
                                border: '1px solid var(--border-primary)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-primary)',
                                color: 'var(--text-secondary)',
                            }}>
                            Clarity: {selfRating}/5
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        What&apos;s the verdict?
                    </h2>
                    <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                        Publish for the team to test, or discard and try a new thumbnail.
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={publishTest}
                            disabled={submitting}
                            className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
                            style={{ boxShadow: 'var(--shadow-glow)' }}
                        >
                            {submitting ? (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CheckCircle size={18} />
                            )}
                            {submitting ? 'Publishing...' : 'Publish for Team'}
                        </button>
                        <button
                            onClick={discardTest}
                            disabled={submitting}
                            className="btn-secondary flex items-center gap-2 px-6 py-3"
                        >
                            <Trash2 size={16} />
                            Discard
                        </button>
                    </div>

                    <button
                        onClick={startFlashTest}
                        disabled={submitting}
                        className="mt-5 text-sm transition-all duration-200 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.background = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <RefreshCw size={14} />
                        Flash again
                    </button>

                    {error && (
                        <div className="text-red-400 text-sm mt-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==================== PUBLISHED SCREEN ====================
    if (phase === 'published') {
        const shareLink = typeof window !== 'undefined'
            ? `${window.location.origin}/test/${publishedTestId}`
            : '';

        return (
            <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in px-4"
                style={{ background: 'var(--bg-primary)' }}>
                <div className="w-full max-w-md text-center">
                    {/* Success icon */}
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                        style={{
                            background: 'var(--accent-green-muted)',
                            border: '1px solid var(--accent-green)',
                        }}>
                        <Rocket size={28} style={{ color: 'var(--accent-green)' }} />
                    </div>

                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Published!
                    </h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                        Your thumbnail test is live. Share this link with your team:
                    </p>

                    {/* Share link */}
                    <div className="flex items-center gap-2 mb-6 p-1 rounded-xl"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
                        <input
                            readOnly
                            value={shareLink}
                            className="flex-1 bg-transparent px-3 py-2.5 text-xs outline-none"
                            style={{ color: 'var(--text-secondary)' }}
                        />
                        <button
                            onClick={() => handleCopyLink(shareLink)}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0"
                            style={{
                                background: copied ? 'var(--accent-green)' : 'var(--accent-blue)',
                                color: '#fff',
                            }}
                        >
                            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <div className="flex gap-3 justify-center flex-wrap">
                        <Link href={`/results/${publishedTestId}`}
                            className="btn-primary flex items-center gap-2">
                            <BarChart3 size={16} />
                            View Results
                        </Link>
                        <button
                            onClick={reviewRandomTest}
                            disabled={reviewLoading}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Zap size={14} />
                            {reviewLoading ? 'Finding...' : 'Review Others\' Work'}
                        </button>
                        <button onClick={resetAll} className="btn-secondary flex items-center gap-2">
                            <RefreshCw size={14} />
                            Test Another
                        </button>
                    </div>
                    {noMoreTests && (
                        <p className="text-xs text-center mt-3" style={{ color: 'var(--accent-pink)' }}>
                            🎉 No more tests to review — you&apos;ve seen them all!
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ==================== LANDING PAGE ====================
    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <Navbar />

            {/* Background glow decoration */}
            <div className="relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at center, var(--accent-blue-muted) 0%, transparent 70%)',
                        opacity: 0.6,
                    }}
                />

                {/* Hero section */}
                <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-12">
                    {!user ? (
                        /* ==================== AUTH GATE ==================== */
                        <div className="max-w-lg mx-auto text-center animate-fade-in-up">


                            <h1 className="text-5xl font-extrabold mb-4 leading-tight" style={{ color: 'var(--text-primary)' }}>
                                Test your thumbnail
                                <br />
                                <span style={{
                                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-pink))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>in 1 second</span>
                            </h1>
                            <p className="text-base mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Upload a thumbnail, see it flash for 1 second, and find out if your message
                                actually lands. Then share with the team for group feedback.
                            </p>

                            {/* Auth card */}
                            <div className="rounded-2xl p-8 text-center"
                                style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-primary)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                }}>
                                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                                    Sign in or create an account to start testing.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Link href="/login" className="btn-primary px-8 py-3 flex items-center gap-2">
                                        <LogIn size={16} />
                                        Sign In
                                    </Link>
                                    <Link href="/register" className="btn-secondary px-8 py-3 flex items-center gap-2">
                                        <UserPlus size={16} />
                                        Create Account
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ==================== LOGGED IN — TWO COLUMN ==================== */
                        <div className="grid lg:grid-cols-2 gap-12 items-start animate-fade-in-up">
                            {/* Left column — Form */}
                            <div>
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-medium"
                                    style={{
                                        background: 'var(--accent-blue-muted)',
                                        color: 'var(--accent-blue)',
                                        border: '1px solid var(--accent-blue)',
                                    }}>
                                    <Sparkles size={12} />
                                    Test Studio
                                </div>

                                <h1 className="text-4xl font-extrabold mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
                                    Test your thumbnail
                                    <br />
                                    <span style={{
                                        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-pink))',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>in 1 second</span>
                                </h1>
                                <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    Upload → flash test → see if your message lands. Then share with the team.
                                </p>

                                <div className="space-y-5">
                                    {/* Upload zone */}
                                    <div
                                        className="rounded-xl p-6 cursor-pointer transition-all duration-300 group"
                                        style={{
                                            border: `2px dashed ${dragOver ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                                            background: dragOver ? 'var(--accent-blue-muted)' : 'var(--bg-surface)',
                                            boxShadow: dragOver ? 'var(--shadow-glow)' : 'none',
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragOver(false);
                                            handleFile(e.dataTransfer.files);
                                        }}
                                    >
                                        {thumbnailPreview ? (
                                            <div className="flex items-center gap-4">
                                                <img src={thumbnailPreview} alt="Thumbnail" className="w-36 aspect-video object-cover rounded-lg"
                                                    style={{ border: '1px solid var(--border-primary)' }} />
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {thumbnailFile?.name}
                                                    </p>
                                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                        Click or drop to replace
                                                    </p>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                                    style={{ background: 'var(--accent-blue-muted)' }}>
                                                    <RefreshCw size={14} style={{ color: 'var(--accent-blue)' }} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                                                    style={{
                                                        background: 'var(--accent-blue-muted)',
                                                        border: '1px solid var(--accent-blue)',
                                                    }}>
                                                    <ImagePlus size={22} style={{ color: 'var(--accent-blue)' }} />
                                                </div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    Drop your thumbnail here or <span style={{ color: 'var(--accent-blue)' }}>browse</span>
                                                </p>
                                                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                                                    PNG, JPG, or WebP — any resolution
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFile(e.target.files)}
                                    />

                                    {/* Channel selector */}
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                                            style={{ color: 'var(--text-muted)' }}>
                                            Channel
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {channels.map((ch) => (
                                                <button
                                                    key={ch}
                                                    type="button"
                                                    onClick={() => setChannelTag(ch)}
                                                    className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                                                    style={{
                                                        background: channelTag === ch
                                                            ? 'var(--accent-blue)'
                                                            : 'var(--bg-elevated)',
                                                        color: channelTag === ch ? '#fff' : 'var(--text-secondary)',
                                                        border: `1px solid ${channelTag === ch ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                                                        boxShadow: channelTag === ch ? '0 2px 12px var(--accent-blue-muted)' : 'none',
                                                    }}
                                                >
                                                    {ch}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
                                            {error}
                                        </div>
                                    )}

                                    {/* CTA */}
                                    <button
                                        type="button"
                                        onClick={startFlashTest}
                                        className="btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2.5 group"
                                        style={{ boxShadow: 'var(--shadow-glow)' }}
                                    >
                                        <Eye size={20} />
                                        Flash Test It
                                        <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-px" style={{ background: 'var(--border-primary)' }} />
                                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>or</span>
                                        <div className="flex-1 h-px" style={{ background: 'var(--border-primary)' }} />
                                    </div>

                                    {/* Review Others */}
                                    <button
                                        type="button"
                                        onClick={reviewRandomTest}
                                        disabled={reviewLoading}
                                        className="w-full py-3 text-sm font-medium flex items-center justify-center gap-2 rounded-xl transition-all duration-200"
                                        style={{
                                            background: 'var(--bg-elevated)',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--border-primary)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--accent-green-muted)';
                                            e.currentTarget.style.color = 'var(--accent-green)';
                                            e.currentTarget.style.borderColor = 'var(--accent-green)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-elevated)';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                            e.currentTarget.style.borderColor = 'var(--border-primary)';
                                        }}
                                    >
                                        <Zap size={16} />
                                        {reviewLoading ? 'Finding a test...' : 'Review Others\' Work'}
                                    </button>
                                    {noMoreTests && (
                                        <p className="text-xs text-center" style={{ color: 'var(--accent-pink)' }}>
                                            🎉 No more tests to review — you&apos;ve seen them all!
                                        </p>
                                    )}

                                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                        Testing as <strong style={{ color: 'var(--text-primary)' }}>{profile?.name}</strong>. You&apos;ll see a 1-second flash.
                                    </p>
                                </div>
                            </div>

                            {/* Right column — Draft Mockup */}
                            <div className="hidden lg:block">
                                <div className="sticky top-24">
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2"
                                        style={{ color: 'var(--text-muted)' }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{
                                            background: 'var(--accent-blue)',
                                        }} />
                                        YouTube Feed Preview
                                    </p>

                                    <div className="rounded-2xl p-5"
                                        style={{
                                            background: 'var(--bg-surface)',
                                            border: '1px solid var(--border-primary)',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                                        }}>
                                        {/* Feed grid — 2 columns, 3 rows */}
                                        <div className="grid grid-cols-2 gap-3 select-none">
                                            {[
                                                { id: 1, highlighted: false },
                                                { id: 2, highlighted: false },
                                                { id: 3, highlighted: true },
                                                { id: 4, highlighted: false },
                                                { id: 5, highlighted: false },
                                                { id: 6, highlighted: false },
                                            ].map((slot) => (
                                                <div key={slot.id}>
                                                    {/* Thumbnail */}
                                                    <div
                                                        className="w-full aspect-video rounded-lg relative overflow-hidden transition-all duration-300"
                                                        style={{
                                                            background: slot.highlighted
                                                                ? 'var(--accent-green-muted)'
                                                                : 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))',
                                                            border: slot.highlighted
                                                                ? '2px solid var(--accent-green)'
                                                                : '1px solid var(--border-primary)',
                                                            boxShadow: slot.highlighted
                                                                ? '0 0 20px var(--accent-green-muted), 0 0 40px rgba(16,185,129,0.08)'
                                                                : 'none',
                                                        }}
                                                    >
                                                        {slot.highlighted ? (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="text-center px-2">
                                                                    <Eye size={18} style={{ color: 'var(--accent-green)', margin: '0 auto 4px' }} />
                                                                    <p className="text-[9px] font-bold uppercase tracking-wider leading-tight"
                                                                        style={{ color: 'var(--accent-green)' }}>
                                                                        Your Thumbnail
                                                                        <br />
                                                                        Appears Here
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Grey placeholder bars to simulate a thumbnail */}
                                                                <div className="absolute inset-0 p-2 flex flex-col justify-end gap-1 opacity-30">
                                                                    <div className="h-1.5 rounded w-3/4" style={{ background: 'var(--text-muted)' }} />
                                                                    <div className="h-1.5 rounded w-1/2" style={{ background: 'var(--text-muted)' }} />
                                                                </div>
                                                            </>
                                                        )}
                                                        {/* Duration badge */}
                                                        <div className="absolute bottom-1 right-1 text-white text-[8px] font-medium px-1 py-0.5 rounded"
                                                            style={{
                                                                background: slot.highlighted ? 'var(--accent-green)' : 'rgba(0,0,0,0.6)',
                                                            }}>
                                                            {slot.highlighted ? '10:00' : `${slot.id + 7}:${slot.id * 12 % 60 < 10 ? '0' : ''}${slot.id * 12 % 60}`}
                                                        </div>
                                                    </div>
                                                    {/* Video info skeleton */}
                                                    <div className="flex gap-2 mt-1.5">
                                                        <div className="w-5 h-5 rounded-full shrink-0"
                                                            style={{
                                                                background: slot.highlighted
                                                                    ? 'linear-gradient(135deg, var(--accent-green-muted), var(--accent-green))'
                                                                    : 'var(--bg-elevated)',
                                                            }} />
                                                        <div className="flex-1 min-w-0 space-y-1 mt-0.5">
                                                            <div className="h-1.5 rounded"
                                                                style={{
                                                                    background: slot.highlighted ? 'var(--accent-green)' : 'var(--bg-elevated)',
                                                                    width: slot.highlighted ? '90%' : `${60 + slot.id * 8}%`,
                                                                    opacity: slot.highlighted ? 0.4 : 1,
                                                                }} />
                                                            <div className="h-1 rounded w-3/5"
                                                                style={{ background: 'var(--bg-elevated)' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Caption */}
                                        <p className="text-[10px] text-center mt-4 leading-relaxed"
                                            style={{ color: 'var(--text-muted)' }}>
                                            See how your thumbnail competes in a real feed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== HOW IT WORKS ==================== */}
            <div className="relative max-w-5xl mx-auto px-6 pb-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        How it works
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Three steps to better thumbnails
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                    {/* Step 1 — Upload */}
                    <div
                        className="rounded-2xl overflow-hidden transition-all duration-300 group"
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-primary)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-blue)';
                            e.currentTarget.style.boxShadow = '0 8px 32px var(--accent-blue-muted)';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Mockup area */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="rounded-xl p-4 flex flex-col items-center justify-center"
                                style={{
                                    background: 'var(--bg-primary)',
                                    border: '2px dashed var(--accent-blue)',
                                    minHeight: 120,
                                }}>
                                <div className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center"
                                    style={{ background: 'var(--accent-blue-muted)' }}>
                                    <ImagePlus size={20} style={{ color: 'var(--accent-blue)' }} />
                                </div>
                                <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Drop thumbnail here
                                </p>
                                <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    PNG, JPG, or WebP
                                </p>
                            </div>
                        </div>
                        {/* Text */}
                        <div className="px-5 pb-5 pt-2">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: 'var(--accent-blue-muted)', color: 'var(--accent-blue)' }}>01</span>
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Upload</h3>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Drop your thumbnail into the studio. We simulate how it appears on YouTube.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 — Flash */}
                    <div
                        className="rounded-2xl overflow-hidden transition-all duration-300 group"
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-primary)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-pink)';
                            e.currentTarget.style.boxShadow = '0 8px 32px var(--accent-pink-muted)';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Mockup area — YouTube thumbnail flash */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="rounded-xl overflow-hidden relative"
                                style={{
                                    background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-hover))',
                                    border: '1px solid var(--border-primary)',
                                    minHeight: 120,
                                }}>
                                {/* Fake thumbnail bars */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6">
                                    <div className="w-full h-3 rounded" style={{ background: 'var(--accent-pink-muted)' }} />
                                    <div className="w-4/5 h-3 rounded" style={{ background: 'var(--accent-pink-muted)', opacity: 0.6 }} />
                                    <div className="w-3/5 h-2 rounded" style={{ background: 'var(--accent-pink-muted)', opacity: 0.3 }} />
                                </div>
                                {/* Duration badge */}
                                <div className="absolute bottom-2 right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: 'var(--accent-pink)' }}>
                                    10:00
                                </div>
                                {/* Flash timer badge */}
                                <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full"
                                    style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                                    <Zap size={10} />
                                    1 second flash
                                </div>
                            </div>
                        </div>
                        {/* Text */}
                        <div className="px-5 pb-5 pt-2">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: 'var(--accent-pink-muted)', color: 'var(--accent-pink)' }}>02</span>
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Flash</h3>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                See it for 1 second — just like a viewer scrolling their feed.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 — Decide */}
                    <div
                        className="rounded-2xl overflow-hidden transition-all duration-300 group"
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-primary)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-green)';
                            e.currentTarget.style.boxShadow = '0 8px 32px var(--accent-green-muted)';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Mockup area — Rating & feedback */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="rounded-xl p-4"
                                style={{
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-primary)',
                                    minHeight: 120,
                                }}>
                                {/* Clarity rating mockup */}
                                <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                    Clarity Rating
                                </p>
                                <div className="flex gap-1 mb-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <div key={star} className="w-6 h-6 rounded flex items-center justify-center text-[10px]"
                                            style={{
                                                background: star <= 4 ? 'var(--accent-green-muted)' : 'var(--bg-elevated)',
                                                color: star <= 4 ? 'var(--accent-green)' : 'var(--text-muted)',
                                                border: `1px solid ${star <= 4 ? 'var(--accent-green)' : 'var(--border-primary)'}`,
                                            }}>
                                            {star}
                                        </div>
                                    ))}
                                    <span className="text-[10px] font-bold ml-1 flex items-center" style={{ color: 'var(--accent-green)' }}>
                                        4/5
                                    </span>
                                </div>
                                {/* Team responses indicator */}
                                <div className="flex items-center gap-1.5">
                                    <div className="flex -space-x-1.5">
                                        {['#3b82f6', '#ec4899', '#10b981'].map((color, i) => (
                                            <div key={i} className="w-5 h-5 rounded-full border-2 text-[7px] font-bold text-white flex items-center justify-center"
                                                style={{ background: color, borderColor: 'var(--bg-primary)' }}>
                                                {['J', 'K', 'T'][i]}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                        3 team reviews
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Text */}
                        <div className="px-5 pb-5 pt-2">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: 'var(--accent-green-muted)', color: 'var(--accent-green)' }}>03</span>
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Decide</h3>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Rate clarity, publish for your team, and see aggregated feedback.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative max-w-4xl mx-auto px-6 pb-10 pt-36">
                <div className="h-px mb-8" style={{
                    background: 'linear-gradient(90deg, transparent, var(--border-primary), transparent)',
                }} />
                <div className="text-center space-y-3">
                    <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        &ldquo;To become the best, you have to critique your own work.&rdquo;
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Internal tool for MrBeast Thumbnails
                    </p>
                    <p className="text-[10px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                        Built by Jobs
                    </p>
                </div>
            </footer>
        </div>
    );
}
