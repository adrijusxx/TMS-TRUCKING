'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { X, ZoomIn } from 'lucide-react';

interface FeatureTag {
  label: string;
  color?: 'purple' | 'green' | 'blue' | 'orange';
}

interface ScreenshotCardProps {
  src: string;
  title: string;
  description: string;
  tags: FeatureTag[];
  isActive?: boolean;
  onClick?: () => void;
}

const tagColors = {
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export function ScreenshotCard({
  src,
  title,
  description,
  tags,
  isActive,
  onClick,
}: ScreenshotCardProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div
        className={cn(
          'group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-500',
          'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50',
          'hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10',
          isActive && 'ring-2 ring-purple-500 border-purple-500/50'
        )}
        onClick={onClick}
      >
        {/* Screenshot Container */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
          
          {/* Zoom Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(true);
            }}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-lg',
              'bg-slate-900/80 backdrop-blur-sm border border-slate-700/50',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
              'hover:bg-purple-500/20 hover:border-purple-500/50'
            )}
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {tags.map((tag, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={cn('text-xs', tagColors[tag.color || 'purple'])}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative w-[90vw] h-[85vh]">
            <Image
              src={src}
              alt={title}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>
      )}
    </>
  );
}





















