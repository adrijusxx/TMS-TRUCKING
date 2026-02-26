'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SHORTCUTS, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<KeyboardShortcut['category'], string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  views: 'Views',
};

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const grouped = SHORTCUTS.reduce<Record<string, KeyboardShortcut[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(grouped).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[category as KeyboardShortcut['category']] || category}
              </h3>
              <div className="space-y-1">
                {shortcuts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-sm">{s.label}</span>
                    <ShortcutKeys keys={s.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd> anywhere to toggle this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Renders key combo as styled kbd elements */
function ShortcutKeys({ keys }: { keys: string }) {
  const parts = keys.split(/(\+| )/);
  return (
    <div className="flex items-center gap-0.5">
      {parts.map((part, i) => {
        if (part === '+' || part === ' ') {
          return (
            <span key={i} className="text-[10px] text-muted-foreground mx-0.5">
              {part === ' ' ? 'then' : '+'}
            </span>
          );
        }
        return (
          <kbd
            key={i}
            className="min-w-[22px] h-[22px] flex items-center justify-center px-1.5 bg-muted border border-border rounded text-[11px] font-mono font-medium"
          >
            {part}
          </kbd>
        );
      })}
    </div>
  );
}
