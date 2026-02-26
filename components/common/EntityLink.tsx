'use client';

import { useEntitySheet, type EntityType } from '@/lib/contexts/EntitySheetContext';
import type { SheetMode } from '@/lib/contexts/EntitySheetContext';

interface EntityLinkProps {
  entityType: EntityType;
  entityId: string;
  mode?: SheetMode;
  children: React.ReactNode;
  className?: string;
}

export function EntityLink({
  entityType,
  entityId,
  mode = 'view',
  children,
  className = 'text-primary hover:underline cursor-pointer',
}: EntityLinkProps) {
  const { openEntitySheet } = useEntitySheet();

  return (
    <span
      role="button"
      tabIndex={0}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        openEntitySheet(entityType, entityId, mode);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEntitySheet(entityType, entityId, mode);
        }
      }}
    >
      {children}
    </span>
  );
}
