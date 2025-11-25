'use client';

import { useState, useEffect } from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type FontSize = 'small' | 'medium' | 'large';

const fontSizeOptions: { value: FontSize; label: string; size: string }[] = [
  { value: 'small', label: 'Small', size: '0.875rem' },    // 14px
  { value: 'medium', label: 'Medium', size: '1rem' },      // 16px (default)
  { value: 'large', label: 'Large', size: '1.125rem' },     // 18px
];

export function FontSizeToggle() {
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [mounted, setMounted] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('fontSize') as FontSize;
    if (saved && fontSizeOptions.some(opt => opt.value === saved)) {
      setFontSize(saved);
      applyFontSize(saved);
    }
  }, []);

  // Apply font size to document
  const applyFontSize = (size: FontSize) => {
    const option = fontSizeOptions.find(opt => opt.value === size);
    if (option) {
      document.documentElement.style.setProperty('--base-font-size', option.size);
      // Apply to html element for global scaling
      document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
      document.documentElement.classList.add(`font-${size}`);
    }
  };

  // Handle font size change
  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    applyFontSize(size);
  };

  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Type className="h-4 w-4" />
        <span className="sr-only">Font size</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Type className="h-4 w-4" />
          <span className="sr-only">Font size</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {fontSizeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleFontSizeChange(option.value)}
          >
            <Type className="mr-2 h-4 w-4" />
            <span>{option.label}</span>
            {fontSize === option.value && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

