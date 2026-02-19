interface YouTubeMockupProps {
    thumbnailUrl: string;
    durationBadge: string;
    channelName?: string;
}

export default function YouTubeMockup({
    thumbnailUrl,
    durationBadge,
    channelName = 'MrBeast',
}: YouTubeMockupProps) {
    return (
        <div className="w-full max-w-[420px] mx-auto select-none">
            {/* Thumbnail container */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-blink-dark-600">
                <img
                    src={thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                />
                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                    {durationBadge}
                </div>
            </div>

            {/* Video info row */}
            <div className="flex gap-3 mt-3">
                {/* Channel avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                </div>

                {/* Title + channel info */}
                <div className="flex-1 min-w-0">
                    {/* Masked title */}
                    <p className="text-[15px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        ????????
                    </p>
                    {/* Channel name + meta */}
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{channelName}</span>
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>
                    <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>100K views · 1 day ago</p>
                </div>
            </div>
        </div>
    );
}
