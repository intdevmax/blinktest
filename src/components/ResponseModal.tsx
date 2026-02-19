'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useState } from 'react';

interface ResponseModalProps {
    onSubmit: (answerHtml: string, clarityRating: number) => Promise<void>;
    onClose?: () => void;
    headingText?: string;
}

export default function ResponseModal({
    onSubmit,
    onClose,
    headingText = 'What was the Thumbnail about?',
}: ResponseModalProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [hasContent, setHasContent] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Describe what you think the video is about...',
            }),
        ],
        onUpdate: ({ editor: e }) => {
            setHasContent(!e.isEmpty);
        },
        editorProps: {
            attributes: {
                class: 'outline-none min-h-[120px] text-sm leading-relaxed',
            },
        },
    });

    const handleSubmit = async () => {
        if (!editor || !hasContent) return;
        if (rating === 0) return;

        setSubmitting(true);
        await onSubmit(editor.getHTML(), rating);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in px-4"
            style={{ background: 'var(--bg-primary)', opacity: 0.98 }}>
            <div className="w-full max-w-lg">
                {/* Header */}
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    {headingText}
                </h2>

                {/* Rich Text Editor */}
                <div className="tiptap-editor rounded-xl overflow-hidden mb-4 surface">
                    {/* Toolbar */}
                    {editor && (
                        <div className="flex items-center gap-1 px-3 py-2"
                            style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-elevated)' }}>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className="px-2 py-1 rounded text-xs font-bold transition-colors"
                                style={{
                                    background: editor.isActive('bold') ? 'var(--accent-blue-muted)' : 'transparent',
                                    color: editor.isActive('bold') ? 'var(--accent-blue)' : 'var(--text-muted)',
                                }}
                            >
                                B
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className="px-2 py-1 rounded text-xs italic transition-colors"
                                style={{
                                    background: editor.isActive('italic') ? 'var(--accent-blue-muted)' : 'transparent',
                                    color: editor.isActive('italic') ? 'var(--accent-blue)' : 'var(--text-muted)',
                                }}
                            >
                                I
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className="px-2 py-1 rounded text-xs transition-colors"
                                style={{
                                    background: editor.isActive('bulletList') ? 'var(--accent-blue-muted)' : 'transparent',
                                    color: editor.isActive('bulletList') ? 'var(--accent-blue)' : 'var(--text-muted)',
                                }}
                            >
                                • List
                            </button>
                        </div>
                    )}
                    {/* Editor area */}
                    <div className="px-4 py-3">
                        <EditorContent editor={editor} />
                    </div>
                </div>

                {/* Number Rating */}
                <div className="mb-6">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Thumbnail clarity</p>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setRating(num)}
                                onMouseEnter={() => setHoverRating(num)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="w-10 h-10 rounded-lg text-sm font-bold transition-all duration-150 hover:scale-105"
                                style={{
                                    background: (hoverRating || rating) >= num
                                        ? 'var(--accent-blue)'
                                        : 'var(--bg-elevated)',
                                    color: (hoverRating || rating) >= num
                                        ? '#fff'
                                        : 'var(--text-muted)',
                                    border: `1px solid ${(hoverRating || rating) >= num
                                        ? 'var(--accent-blue)'
                                        : 'var(--border-primary)'}`,
                                }}
                            >
                                {num}
                            </button>
                        ))}
                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                            {rating === 1 && 'Very unclear'}
                            {rating === 2 && 'Unclear'}
                            {rating === 3 && 'Okay'}
                            {rating === 4 && 'Clear'}
                            {rating === 5 && 'Crystal clear'}
                        </span>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !hasContent || rating === 0}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                    {submitting && (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Response'}
                </button>

                {/* Validation hints */}
                {(!hasContent || rating === 0) && (
                    <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                        {!hasContent ? 'Write your response' : ''}
                        {!hasContent && rating === 0 ? ' and ' : ''}
                        {rating === 0 ? 'select a rating' : ''}
                        {' '}to submit
                    </p>
                )}
            </div>
        </div>
    );
}
