'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScreenshotCard } from './ScreenshotCard';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  description: string;
  tags: { label: string; color?: 'purple' | 'green' | 'blue' | 'orange' }[];
}

const galleryItems: GalleryItem[] = [
  {
    id: 'war-room',
    src: '/showcase/war-room-dashboard.png',
    title: 'War Room Command Center',
    description: 'Real-time operations dashboard with live GPS tracking, instant KPIs, smart alerts, and interactive map showing all active loads and truck positions.',
    tags: [
      { label: 'Live GPS', color: 'green' },
      { label: 'Smart Alerts', color: 'orange' },
      { label: 'Real-Time KPIs', color: 'purple' },
    ],
  },
  {
    id: 'load-list',
    src: '/showcase/02-load-list.png',
    title: 'Complete Load Management',
    description: 'End-to-end load lifecycle from rate con to delivery. AI-powered document extraction, automated settlements, and full financial visibility per load.',
    tags: [
      { label: 'AI Extraction', color: 'purple' },
      { label: 'Auto Settlements', color: 'green' },
      { label: 'Document Hub', color: 'blue' },
    ],
  },
  {
    id: 'dispatch-board',
    src: '/showcase/03-dispatch-board.png',
    title: 'Smart Dispatch Board',
    description: 'Intelligent driver-truck matching with CDL verification, availability tracking, and drag-and-drop scheduling. Never dispatch an invalid driver.',
    tags: [
      { label: 'CDL Verify', color: 'green' },
      { label: 'Smart Matching', color: 'purple' },
      { label: 'Drag & Drop', color: 'blue' },
    ],
  },
  {
    id: 'fleet-overview',
    src: '/showcase/05-fleet-overview.png',
    title: 'Fleet & Maintenance Hub',
    description: 'Complete fleet visibility with preventive maintenance scheduling, DVIR tracking, repair history, and real-time vehicle health monitoring.',
    tags: [
      { label: 'Maintenance', color: 'orange' },
      { label: 'DVIR Tracking', color: 'green' },
      { label: 'Vehicle Health', color: 'blue' },
    ],
  },
  {
    id: 'safety',
    src: '/showcase/04-mc-selector.png',
    title: 'Safety & Compliance Suite',
    description: 'DOT inspections, HOS compliance, drug testing, medical cards, incident tracking, and FMCSA integration. Stay compliant effortlessly.',
    tags: [
      { label: 'DOT Ready', color: 'green' },
      { label: 'HOS Tracking', color: 'blue' },
      { label: 'FMCSA Sync', color: 'purple' },
    ],
  },
];

export function ProductGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % galleryItems.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="space-y-8">
      {/* Hero Carousel */}
      <div className="relative group">
        <div className="relative aspect-[16/9] max-h-[70vh] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50">
          {galleryItems.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                'absolute inset-0 transition-all duration-700',
                idx === activeIndex
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95 pointer-events-none'
              )}
            >
              <img
                src={item.src}
                alt={item.title}
                className="w-full h-full object-contain bg-slate-950"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="max-w-2xl">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {item.title}
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base mb-4">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium border',
                          tag.color === 'green' && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                          tag.color === 'blue' && 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                          tag.color === 'orange' && 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                          tag.color === 'purple' && 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                          !tag.color && 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        )}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={prevSlide}
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full',
            'bg-slate-900/80 backdrop-blur-sm border border-slate-700/50',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'hover:bg-purple-500/20 hover:border-purple-500/50'
          )}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        
        <button
          onClick={nextSlide}
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full',
            'bg-slate-900/80 backdrop-blur-sm border border-slate-700/50',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'hover:bg-purple-500/20 hover:border-purple-500/50'
          )}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => setIsAutoPlaying((prev) => !prev)}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-lg',
            'bg-slate-900/80 backdrop-blur-sm border border-slate-700/50',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'hover:bg-purple-500/20 hover:border-purple-500/50'
          )}
        >
          {isAutoPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* Dot Navigation */}
      <div className="flex justify-center gap-2">
        {galleryItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all duration-300',
              idx === activeIndex
                ? 'w-8 bg-gradient-to-r from-purple-500 to-purple-600'
                : 'bg-slate-600 hover:bg-slate-500'
            )}
          />
        ))}
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {galleryItems.map((item, idx) => (
          <ScreenshotCard
            key={item.id}
            src={item.src}
            title={item.title}
            description={item.description}
            tags={item.tags}
            isActive={idx === activeIndex}
            onClick={() => setActiveIndex(idx)}
          />
        ))}
      </div>

      {/* Keyboard Hints */}
      <div className="text-center text-slate-500 text-sm">
        <span className="hidden md:inline">
          Use <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-400 mx-1">←</kbd>
          <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-400 mx-1">→</kbd>
          to navigate &bull; 
          <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-400 mx-1">Space</kbd>
          to {isAutoPlaying ? 'pause' : 'play'}
        </span>
      </div>
    </div>
  );
}
