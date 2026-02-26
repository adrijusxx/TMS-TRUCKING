'use client';

import { lazy, Suspense } from 'react';
import { EntitySheetProvider as ContextProvider, useEntitySheet, getEntityLabel } from '@/lib/contexts/EntitySheetContext';
import type { EntityType, SheetMode } from '@/lib/contexts/EntitySheetContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const LoadSheet = lazy(() => import('@/components/loads/LoadSheet'));
const CustomerSheet = lazy(() => import('@/components/customers/CustomerSheet'));
const DriverSheet = lazy(() => import('@/components/drivers/DriverSheet'));
const TruckSheet = lazy(() => import('@/components/trucks/TruckSheet'));
const TrailerSheet = lazy(() => import('@/components/trailers/TrailerSheet'));
const InvoiceSheet = lazy(() => import('@/components/invoices/InvoiceSheet'));
const SettlementSheet = lazy(() => import('@/components/settlements/SettlementSheet'));
const MaintenanceSheet = lazy(() => import('@/components/maintenance/MaintenanceSheet'));

function SheetFallback() {
  return (
    <div className="flex h-32 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function EntitySheetRenderer() {
  const { state, closeEntitySheet, goBack, hasPreviousSheet } = useEntitySheet();
  const { entityType, entityId, mode, isOpen } = state;

  if (!isOpen || !entityType) return null;

  const handleOpenChange = (open: boolean) => {
    if (!open) closeEntitySheet();
  };

  const backButton = hasPreviousSheet && state.previousSheet ? (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs gap-1 mb-2"
      onClick={goBack}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to {getEntityLabel(state.previousSheet.entityType)}
    </Button>
  ) : null;

  return (
    <Suspense fallback={<SheetFallback />}>
      {backButton}
      <ActiveSheet
        entityType={entityType}
        entityId={entityId}
        mode={mode}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
      />
    </Suspense>
  );
}

interface ActiveSheetProps {
  entityType: EntityType;
  entityId: string | null;
  mode: SheetMode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function ActiveSheet({ entityType, entityId, mode, isOpen, onOpenChange }: ActiveSheetProps) {
  switch (entityType) {
    case 'loads':
      return <LoadSheet open={isOpen} onOpenChange={onOpenChange} mode={mode} loadId={entityId} />;
    case 'customers':
      return <CustomerSheet open={isOpen} onOpenChange={onOpenChange} mode={mode} customerId={entityId} />;
    case 'drivers':
      return <DriverSheet open={isOpen} onOpenChange={onOpenChange} mode={mode} driverId={entityId} />;
    case 'trucks':
      return <TruckSheet open={isOpen} onOpenChange={onOpenChange} mode={mode} truckId={entityId} />;
    case 'trailers':
      return <TrailerSheet open={isOpen} onOpenChange={onOpenChange} mode={mode} trailerId={entityId} />;
    case 'invoices':
      return <InvoiceSheet invoiceId={entityId} isOpen={isOpen} onClose={() => onOpenChange(false)} />;
    case 'settlements':
      return <SettlementSheet open={isOpen} onOpenChange={onOpenChange} settlementId={entityId} />;
    case 'maintenance':
      return <MaintenanceSheet open={isOpen} onOpenChange={onOpenChange} id={entityId || undefined} />;
    default:
      return null;
  }
}

export default function EntitySheetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ContextProvider>
      {children}
      <EntitySheetRenderer />
    </ContextProvider>
  );
}
