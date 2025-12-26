import { Download, Mic, FileText, Image as ImageIcon } from 'lucide-react';
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
    const mediaUrl = apiUrl(`/api/telegram/media/${media.chatId}/${media.messageId}`);

    // Photo
    if (media.isPhoto) {
        return (
            <div className="mb-2">
                <img
                    src={mediaUrl}
                    alt="Photo"
                    className="max-w-full rounded-lg max-h-64 object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    // Voice Message
    if (media.isVoice) {
        return (
            <div className={`flex items-center gap-2 p-2 rounded ${out ? 'bg-primary-foreground/10' : 'bg-background'
                }`}>
                <Mic className="h-4 w-4" />
                <audio controls className="flex-1 h-8">
                    <source src={mediaUrl} type={media.mimeType || 'audio/ogg'} />
                    Your browser does not support audio playback.
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
        const sizeInKB = media.size ? (media.size / 1024).toFixed(1) : '?';
        const icon = media.mimeType?.startsWith('image/') ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />;

        return (
            <div className={`flex items-center gap-3 p-3 rounded ${out ? 'bg-primary-foreground/10' : 'bg-background'
                }`}>
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{media.fileName || 'File'}</p>
                    <p className="text-xs opacity-70">{sizeInKB} KB</p>
                </div>
                <a href={mediaUrl} download={media.fileName} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                    </Button>
                </a>
            </div>
        );
    }

    // Unknown media type
    return (
        <div className="text-xs opacity-70 italic">
            Unsupported media type: {media.type}
        </div>
    );
}
