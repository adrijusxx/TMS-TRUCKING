'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface EditableCellProps {
  value: string | number | null | undefined;
  rowId: string;
  columnId: string;
  onSave: (rowId: string, columnId: string, value: string | number) => Promise<void>;
  className?: string;
  type?: 'text' | 'number';
  placeholder?: string;
}

/**
 * EditableCell component for inline editing in tables
 * Switches between span and input on click
 * Handles Enter to save, Escape to cancel
 */
export function EditableCell({
  value,
  rowId,
  columnId,
  onSave,
  className,
  type = 'text',
  placeholder,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState<string>(String(value ?? ''));
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset edit value when value prop changes (e.g., after save)
  React.useEffect(() => {
    setEditValue(String(value ?? ''));
  }, [value]);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    const newValue = type === 'number' ? Number(editValue) : editValue;
    const originalValue = type === 'number' ? Number(value ?? 0) : String(value ?? '');

    // Only save if value changed
    if (newValue !== originalValue) {
      setIsSaving(true);
      try {
        await onSave(rowId, columnId, newValue);
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving cell value:', error);
        // Reset to original value on error
        setEditValue(String(value ?? ''));
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ''));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Auto-save on blur
    handleSave();
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={isSaving}
        placeholder={placeholder}
        className={cn('h-8 w-full', className)}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        'cursor-pointer px-2 py-1 rounded hover:bg-muted/50 transition-colors min-h-[2rem] flex items-center',
        className
      )}
      title="Click to edit"
    >
      {value ?? <span className="text-muted-foreground italic">—</span>}
    </span>
  );
}





























