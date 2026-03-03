'use client';

import { useState } from 'react';
import { Download, Mic, FileText, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUrl } from '@/lib/utils';

interface MediaInfo {
    type: string;
    messageId: number;
    chatId: string;
    isPhoto?: boolean;
    photoId?: string;
    isDocument?: boolean;
    fileName?: string;
    mimeType?: string;
    size?: number;
    isVoice?: boolean;
    duration?: number;
}

interface MessageMediaProps {
    media: MediaInfo;
    out: boolean;
}

export default function MessageMedia({ media, out }: MessageMediaProps) {
    const [lightbox, setLightbox] = useState(false);
    const mediaUrl = apiUrl(`/api/telegram/media/${media.chatId}/${media.messageId}`);
    const isVideoDoc = media.isDocument && media.mimeType?.startsWith('video/');
    const isImageDoc = media.isDocument && media.mimeType?.startsWith('image/');

    // Photo
    if (media.isPhoto || isImageDoc) {
        return (
            <>
                <div className="mb-2 relative group/media cursor-pointer" onClick={() => setLightbox(true)}>
                    <img
                        src={mediaUrl}
                        alt="Photo"
                        className="max-w-full rounded-lg max-h-64 object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover/media:opacity-80 transition-opacity drop-shadow-lg" />
                    </div>
                </div>
                {lightbox && (
                    <MediaLightbox src={mediaUrl} type="image" onClose={() => setLightbox(false)} />
                )}
            </>
        );
    }

    // Video document
    if (isVideoDoc) {
        return (
            <>
                <div
                    className="mb-2 relative cursor-pointer group/media"
                    onClick={() => setLightbox(true)}
                >
                    <div className={`flex items-center gap-3 p-3 rounded ${out ? 'bg-primary-foreground/10' : 'bg-background'}`}>
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                            <span className="text-lg">&#9654;</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{media.fileName || 'Video'}</p>
                            <p className="text-xs opacity-70">
                                {media.size ? `${(media.size / (1024 * 1024)).toFixed(1)} MB` : 'Video'}
                                {media.duration ? ` · ${Math.floor(media.duration / 60)}:${String(media.duration % 60).padStart(2, '0')}` : ''}
                            </p>
                        </div>
                        <span className="text-xs text-primary font-medium group-hover/media:underline">Play</span>
                    </div>
                </div>
                {lightbox && (
                    <MediaLightbox src={mediaUrl} type="video" onClose={() => setLightbox(false)} />
                )}
            </>
        );
    }

    // Voice Message
    if (media.isVoice) {
        return (
            <div className={`flex items-center gap-2 p-2 rounded ${out ? 'bg-primary-foreground/10' : 'bg-background'}`}>
                <Mic className="h-4 w-4" />
                <audio controls className="flex-1 h-8">
                    <source src={mediaUrl} type={media.mimeType || 'audio/ogg'} />
                </audio>
                {media.duration && (
                    <span className="text-xs opacity-70">
                        {Math.floor(media.duration / 60)}:{String(media.duration % 60).padStart(2, '0')}
                    </span>
                )}
            </div>
        );
    }

    // Document/File
    if (media.isDocument) {
        const sizeKB = media.size ? (media.size / 1024).toFixed(1) : '?';
        return (
            <div className={`flex items-center gap-3 p-3 rounded ${out ? 'bg-primary-foreground/10' : 'bg-background'}`}>
                <FileText className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{media.fileName || 'File'}</p>
                    <p className="text-xs opacity-70">{sizeKB} KB</p>
                </div>
                <a href={mediaUrl} download={media.fileName} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                    </Button>
                </a>
            </div>
        );
    }

    return <div className="text-xs opacity-70 italic">Unsupported media: {media.type}</div>;
}

/* ─── Full-screen lightbox overlay ─── */
function MediaLightbox({ src, type, onClose }: { src: string; type: 'image' | 'video'; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/20 z-10"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </Button>

            <div className="max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {type === 'image' ? (
                    <img
                        src={src}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                ) : (
                    <video
                        src={src}
                        controls
                        autoPlay
                        className="max-w-full max-h-[90vh] rounded-lg"
                    >
                        Your browser does not support video.
                    </video>
                )}
            </div>

            <a
                href={src}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4"
                onClick={e => e.stopPropagation()}
            >
                <Button variant="secondary" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" /> Download
                </Button>
            </a>
        </div>
    );
}
