'use client';

import { useState, useRef } from 'react';
import { Upload, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CaseDropZoneProps {
    onFileSelect?: (file: File) => void;
    onFilesSelect?: (files: File[]) => void;
    accept?: string;
    label: string;
    sublabel?: string;
    icon?: 'upload' | 'camera';
    disabled?: boolean;
    multiple?: boolean;
    maxSizeMB?: number;
}

export default function CaseDropZone({
    onFileSelect, onFilesSelect,
    accept = 'application/pdf,image/png,image/jpeg',
    label, sublabel = 'PDF, PNG, JPEG — max 10MB',
    icon = 'upload', disabled = false, multiple = false, maxSizeMB = 10,
}: CaseDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const allowed = accept.split(',').map(t => t.trim());

    const validate = (f: File) => {
        if (!allowed.some(t => f.type === t || f.type.startsWith(t.replace('*', '')))) {
            toast.error(`${f.name}: unsupported type`); return false;
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
            toast.error(`${f.name}: max ${maxSizeMB}MB`); return false;
        }
        return true;
    };

    const handle = (fl: FileList) => {
        const valid = Array.from(fl).filter(validate);
        if (!valid.length) return;
        if (multiple && onFilesSelect) onFilesSelect(valid);
        else if (onFileSelect && valid[0]) onFileSelect(valid[0]);
    };

    const Icon = icon === 'camera' ? Camera : Upload;

    return (
        <div
            onDrop={e => { e.preventDefault(); setIsDragging(false); if (!disabled) handle(e.dataTransfer.files); }}
            onDragOver={e => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onClick={() => !disabled && inputRef.current?.click()}
            className={cn(
                'border border-dashed rounded p-2 flex items-center gap-2 cursor-pointer transition-colors',
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
                <p className="text-[11px] font-medium leading-tight">{label}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{sublabel}</p>
            </div>
            <input ref={inputRef} type="file" accept={accept} multiple={multiple}
                onChange={e => { if (e.target.files) { handle(e.target.files); e.target.value = ''; } }}
                className="hidden" />
        </div>
    );
}
