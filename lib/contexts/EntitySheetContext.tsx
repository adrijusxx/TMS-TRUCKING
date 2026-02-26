'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type EntityType =
  | 'loads'
  | 'customers'
  | 'drivers'
  | 'trucks'
  | 'trailers'
  | 'invoices'
  | 'settlements'
  | 'locations'
  | 'vendors'
  | 'batches'
  | 'breakdowns'
  | 'maintenance';

export type SheetMode = 'view' | 'edit' | 'create';

interface SheetRef {
  entityType: EntityType;
  entityId: string;
  mode: SheetMode;
}

interface EntitySheetState {
  entityType: EntityType | null;
  entityId: string | null;
  mode: SheetMode;
  isOpen: boolean;
  previousSheet: SheetRef | null;
}

interface EntitySheetContextValue {
  state: EntitySheetState;
  openEntitySheet: (entityType: EntityType, entityId: string, mode?: SheetMode) => void;
  closeEntitySheet: () => void;
  goBack: () => void;
  hasPreviousSheet: boolean;
}

const EntitySheetContext = createContext<EntitySheetContextValue | undefined>(undefined);

const ENTITY_LABELS: Record<EntityType, string> = {
  loads: 'Load',
  customers: 'Customer',
  drivers: 'Driver',
  trucks: 'Truck',
  trailers: 'Trailer',
  invoices: 'Invoice',
  settlements: 'Settlement',
  locations: 'Location',
  vendors: 'Vendor',
  batches: 'Batch',
  breakdowns: 'Breakdown',
  maintenance: 'Maintenance',
};

export function getEntityLabel(type: EntityType): string {
  return ENTITY_LABELS[type] || type;
}

export function EntitySheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EntitySheetState>({
    entityType: null,
    entityId: null,
    mode: 'view',
    isOpen: false,
    previousSheet: null,
  });

  const openEntitySheet = useCallback(
    (entityType: EntityType, entityId: string, mode: SheetMode = 'view') => {
      setState((prev) => ({
        entityType,
        entityId,
        mode,
        isOpen: true,
        previousSheet:
          prev.isOpen && prev.entityType && prev.entityId
            ? { entityType: prev.entityType, entityId: prev.entityId, mode: prev.mode }
            : null,
      }));
    },
    []
  );

  const closeEntitySheet = useCallback(() => {
    setState({
      entityType: null,
      entityId: null,
      mode: 'view',
      isOpen: false,
      previousSheet: null,
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (!prev.previousSheet) return { ...prev, isOpen: false, entityType: null, entityId: null, previousSheet: null };
      return {
        entityType: prev.previousSheet.entityType,
        entityId: prev.previousSheet.entityId,
        mode: prev.previousSheet.mode,
        isOpen: true,
        previousSheet: null,
      };
    });
  }, []);

  return (
    <EntitySheetContext.Provider
      value={{
        state,
        openEntitySheet,
        closeEntitySheet,
        goBack,
        hasPreviousSheet: !!state.previousSheet,
      }}
    >
      {children}
    </EntitySheetContext.Provider>
  );
}

export function useEntitySheet() {
  const context = useContext(EntitySheetContext);
  if (!context) {
    throw new Error('useEntitySheet must be used within EntitySheetProvider');
  }
  return context;
}
