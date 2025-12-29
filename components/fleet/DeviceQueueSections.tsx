'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Link2,
  Truck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DeviceQueueItem {
  id: string;
  samsaraId: string;
  deviceType: 'TRUCK' | 'TRAILER';
  name: string;
  vin?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  status: string;
  createdAt: string;
}

interface DeviceQueueSectionsProps {
  items: DeviceQueueItem[];
  loading: boolean;
  onActionComplete: () => void;
  currentMcNumberId?: string | null; // MC number to assign to approved devices
  currentStatus?: string; // Current tab status (PENDING, APPROVED, LINKED, REJECTED)
}

interface SelectedItems {
  [key: string]: boolean;
}

// Smart categorization logic - separates by device type AND confidence
function categorizeDevices(items: DeviceQueueItem[]) {
  const trucksHighConfidence: DeviceQueueItem[] = [];
  const trucksNeedsReview: DeviceQueueItem[] = [];
  const trucksUnknownGeneric: DeviceQueueItem[] = [];
  const trailersHighConfidence: DeviceQueueItem[] = [];
  const trailersNeedsReview: DeviceQueueItem[] = [];
  const trailersUnknownGeneric: DeviceQueueItem[] = [];
  const missingInfo: DeviceQueueItem[] = [];
  const gatewaysDeactivated: DeviceQueueItem[] = []; // New category

  items.forEach((device) => {
    const hasVIN = !!device.vin && device.vin.length > 5;
    const hasPlate = !!device.licensePlate && device.licensePlate.length > 2;
    const hasMake = !!device.make;
    const hasModel = !!device.model;
    const hasYear = !!device.year;
    const isTruck = device.deviceType === 'TRUCK';
    
    // Check if this looks like a gateway/deactivated device (NOT a vehicle)
    const isGatewayOrDeactivated =
      device.name.toLowerCase().includes('deactivated') ||
      device.name.toLowerCase().includes('gateway') ||
      /^[A-Z0-9]{4}-[A-Z0-9]{3}-[A-Z0-9]{3}$/i.test(device.name) || // Gateway pattern like GHHA-BNJ-SYW
      device.name.toLowerCase().includes('previously paired') ||
      device.name.toLowerCase().includes('unpaired');
      
    if (isGatewayOrDeactivated) {
      gatewaysDeactivated.push(device);
      return;
    }
    
    // Check if name looks generic/random
    const isGenericName =
      /^vehicle\s*\d+$/i.test(device.name) ||
      /^truck\s*\d+$/i.test(device.name) ||
      /^trailer\s*\d+$/i.test(device.name) ||
      /^unit\s*\d+$/i.test(device.name) ||
      /^\d+$/.test(device.name) ||
      device.name.toLowerCase().includes('unnamed') ||
      device.name.toLowerCase().includes('unknown');

    // Missing info: Lacks key identifying fields
    if (!hasVIN && !hasPlate && !hasMake) {
      missingInfo.push(device);
      return;
    }

    // High confidence: Has VIN or (Plate + Make + Model)
    if (hasVIN || (hasPlate && hasMake && hasModel) || (hasMake && hasModel && hasYear)) {
      if (isTruck) {
        trucksHighConfidence.push(device);
      } else {
        trailersHighConfidence.push(device);
      }
    }
    // Unknown/Generic: Generic name AND missing VIN
    else if (isGenericName && !hasVIN) {
      if (isTruck) {
        trucksUnknownGeneric.push(device);
      } else {
        trailersUnknownGeneric.push(device);
      }
    }
    // Default: Needs review
    else {
      if (isTruck) {
        trucksNeedsReview.push(device);
      } else {
        trailersNeedsReview.push(device);
      }
    }
  });

  return {
    trucksHighConfidence,
    trucksNeedsReview,
    trucksUnknownGeneric,
    trailersHighConfidence,
    trailersNeedsReview,
    trailersUnknownGeneric,
    missingInfo,
    gatewaysDeactivated, // New category
  };
}

export function DeviceQueueSections({
  items,
  loading,
  onActionComplete,
  currentMcNumberId,
  currentStatus = 'PENDING',
}: DeviceQueueSectionsProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [bulkActioning, setBulkActioning] = useState(false);
  
  // Only allow actions on PENDING devices
  const canPerformActions = currentStatus === 'PENDING';

  const sections = useMemo(() => categorizeDevices(items), [items]);

  // Reset selection when items change
  React.useEffect(() => {
    setSelectedItems({});
  }, [items]);

  const handleAction = async (
    action: 'approve' | 'reject' | 'link',
    queueId: string,
    additionalData?: any
  ) => {
    setActioningId(queueId);
    try {
      // Include current MC number in additionalData for approve/link actions
      const dataWithMc = {
        ...additionalData,
        additionalData: {
          ...additionalData?.additionalData,
          mcNumberId: currentMcNumberId,
        },
      };
      
      const response = await fetch('/api/fleet/device-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, queueId, ...dataWithMc }),
      });

      if (response.ok) {
        onActionComplete();
      } else {
        // Show error message
        try {
          const errorData = await response.json();
          const errorMsg = errorData?.error?.message || `Failed to ${action} device`;
          console.error(`Action failed:`, errorMsg);
          alert(`Error: ${errorMsg}`);
        } catch {
          alert(`Failed to ${action} device. Please try again.`);
        }
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Network error. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected: SelectedItems = {};
      items.forEach((item) => {
        newSelected[item.id] = true;
      });
      setSelectedItems(newSelected);
    } else {
      setSelectedItems({});
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'link') => {
    const selectedIds = Object.keys(selectedItems).filter((id) => selectedItems[id]);
    if (selectedIds.length === 0) return;

    setBulkActioning(true);
    let successCount = 0;
    let errorCount = 0;
    
    const errors: string[] = [];
    
    try {
      // Process sequentially to avoid race conditions
      for (const queueId of selectedIds) {
        try {
          const response = await fetch('/api/fleet/device-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: action === 'link' ? 'approve' : action, // Link uses approve endpoint which auto-links
              queueId,
              additionalData: { mcNumberId: currentMcNumberId }, // Include current MC
            }),
          });
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            try {
              const errorData = await response.json();
              const errorMsg = errorData?.error?.message || 'Unknown error';
              errors.push(`${queueId}: ${errorMsg}`);
              console.error(`Failed to ${action} device ${queueId}:`, errorMsg);
            } catch {
              console.error(`Failed to ${action} device ${queueId}: HTTP ${response.status}`);
              errors.push(`${queueId}: HTTP ${response.status}`);
            }
          }
        } catch (err) {
          errorCount++;
          console.error(`Error processing ${queueId}:`, err);
          errors.push(`${queueId}: Network error`);
        }
      }
      
      console.log(`Bulk ${action}: ${successCount} succeeded, ${errorCount} failed`);
      if (errors.length > 0) {
        console.error('Errors:', errors.slice(0, 5).join('\n')); // Show first 5 errors
        // Show alert with error details
        const errorSummary = errors.length > 3 
          ? `${errors.slice(0, 3).join('\n')}\n...and ${errors.length - 3} more`
          : errors.join('\n');
        alert(`Some operations failed:\n${errorSummary}`);
      }
      setSelectedItems({});
      onActionComplete();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setBulkActioning(false);
    }
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  const handleSelectSection = (sectionItems: DeviceQueueItem[], checked: boolean) => {
    const newSelected = { ...selectedItems };
    sectionItems.forEach((item) => {
      newSelected[item.id] = checked;
    });
    setSelectedItems(newSelected);
  };

  if (loading && items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading devices...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No devices in this status</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner for non-pending items */}
      {!canPerformActions && items.length > 0 && (
        <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  {currentStatus === 'LINKED' && 'These devices are already linked to TMS records'}
                  {currentStatus === 'APPROVED' && 'These devices have been approved'}
                  {currentStatus === 'REJECTED' && 'These devices have been rejected'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentStatus === 'LINKED' && 'If trucks are missing MC numbers, use the orange banner above to assign them.'}
                  {currentStatus === 'APPROVED' && 'These records have been created in TMS. No further action needed.'}
                  {currentStatus === 'REJECTED' && 'These devices were rejected and won\'t be added to TMS.'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Bulk Actions Bar - Only show for PENDING items */}
      {canPerformActions && items.length > 0 && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {selectedCount > 0 ? (
                      <>
                        {selectedCount} device{selectedCount !== 1 ? 's' : ''} selected
                      </>
                    ) : (
                      'Select devices for bulk actions'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {allSelected
                      ? 'All devices selected'
                      : selectedCount > 0
                      ? 'Use checkboxes below to select more'
                      : 'Check "Select All" or individual devices'}
                  </p>
                </div>
              </div>
              {selectedCount > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    disabled={bulkActioning || actioningId !== null}
                    title="Create new TMS records or auto-link to existing"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve {selectedCount}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleBulkAction('link')}
                    disabled={bulkActioning || actioningId !== null}
                    title="Link to existing TMS records"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Link {selectedCount}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('reject')}
                    disabled={bulkActioning || actioningId !== null}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject {selectedCount}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItems({})}
                    disabled={bulkActioning || actioningId !== null}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      {/* TRUCKS SECTION */}
      {(sections.trucksHighConfidence.length > 0 || sections.trucksNeedsReview.length > 0 || sections.trucksUnknownGeneric.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Truck className="h-5 w-5" />
            Trucks ({sections.trucksHighConfidence.length + sections.trucksNeedsReview.length + sections.trucksUnknownGeneric.length})
          </h3>

          {/* Trucks - High Confidence */}
          {sections.trucksHighConfidence.length > 0 && (
            <Section
              title="🚛 Trucks - High Confidence"
              description="Trucks with VIN or complete identifying information"
              count={sections.trucksHighConfidence.length}
              variant="success"
              icon={<CheckCircle2 className="h-5 w-5" />}
              defaultOpen={true}
              sectionItems={sections.trucksHighConfidence}
              selectedItems={selectedItems}
              onSelectSection={handleSelectSection}
            >
              {sections.trucksHighConfidence.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  actioningId={actioningId}
                  onAction={handleAction}
                  confidence="high"
                  selected={selectedItems[device.id] || false}
                  onSelect={(checked) => handleSelectItem(device.id, checked)}
                  showActions={canPerformActions}
                />
              ))}
            </Section>
          )}

          {/* Trucks - Needs Review */}
          {sections.trucksNeedsReview.length > 0 && (
            <Section
              title="🚛 Trucks - Needs Review"
              description="Trucks requiring manual verification"
              count={sections.trucksNeedsReview.length}
              variant="warning"
              icon={<AlertCircle className="h-5 w-5" />}
              defaultOpen={sections.trucksHighConfidence.length === 0}
              sectionItems={sections.trucksNeedsReview}
              selectedItems={selectedItems}
              onSelectSection={handleSelectSection}
            >
              {sections.trucksNeedsReview.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  actioningId={actioningId}
                  onAction={handleAction}
                  confidence="low"
                  selected={selectedItems[device.id] || false}
                  onSelect={(checked) => handleSelectItem(device.id, checked)}
                  showActions={canPerformActions}
                />
              ))}
            </Section>
          )}

          {/* Trucks - Unknown/Generic */}
          {sections.trucksUnknownGeneric.length > 0 && (
            <Section
              title="🚛 Trucks - Generic Names"
              description="Trucks with generic names like 'Vehicle 123'"
              count={sections.trucksUnknownGeneric.length}
              variant="neutral"
              icon={<AlertCircle className="h-5 w-5" />}
              defaultOpen={false}
              sectionItems={sections.trucksUnknownGeneric}
              selectedItems={selectedItems}
              onSelectSection={handleSelectSection}
            >
              {sections.trucksUnknownGeneric.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  actioningId={actioningId}
                  onAction={handleAction}
                  confidence="unknown"
                  selected={selectedItems[device.id] || false}
                  onSelect={(checked) => handleSelectItem(device.id, checked)}
                  showActions={canPerformActions}
                />
              ))}
            </Section>
          )}
        </div>
      )}

      {/* TRAILERS SECTION */}
      {(sections.trailersHighConfidence.length > 0 || sections.trailersNeedsReview.length > 0 || sections.trailersUnknownGeneric.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <span>🚚</span>
            Trailers ({sections.trailersHighConfidence.length + sections.trailersNeedsReview.length + sections.trailersUnknownGeneric.length})
          </h3>

          {/* Trailers - High Confidence */}
          {sections.trailersHighConfidence.length > 0 && (
            <Section
              title="🚚 Trailers - High Confidence"
              description="Trailers with VIN or complete identifying information"
              count={sections.trailersHighConfidence.length}
              variant="success"
              icon={<CheckCircle2 className="h-5 w-5" />}
              defaultOpen={true}
              sectionItems={sections.trailersHighConfidence}
              selectedItems={selectedItems}
              onSelectSection={handleSelectSection}
            >
              {sections.trailersHighConfidence.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  actioningId={actioningId}
                  onAction={handleAction}
                  confidence="high"
                  selected={selectedItems[device.id] || false}
                  onSelect={(checked) => handleSelectItem(device.id, checked)}
                  showActions={canPerformActions}
                />
              ))}
            </Section>
          )}

          {/* Trailers - Needs Review */}
          {sections.trailersNeedsReview.length > 0 && (
            <Section
              title="🚚 Trailers - Needs Review"
              description="Trailers requiring manual verification"
              count={sections.trailersNeedsReview.length}
              variant="warning"
              icon={<AlertCircle className="h-5 w-5" />}
              defaultOpen={sections.trailersHighConfidence.length === 0}
              sectionItems={sections.trailersNeedsReview}
              selectedItems={selectedItems}
              onSelectSection={handleSelectSection}
            >
              {sections.trailersNeedsReview.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  actioningId={actioningId}
                  onAction={handleAction}
                  confidence="low"
                  selected={selectedItems[device.id] || false}
                  onSelect={(checked) => handleSelectItem(device.id, checked)}
                  showActions={canPerformActions}
                />
              ))}
            </Section>
          )}

          {/* Trailers - Unknown/Generic */}
          {sections.trailersUnknownGeneric.length > 0 && (
            <Section
              title="🚚 Trailers - Generic Names"
              description="Trailers with generic names"
              count={sections.trailersUnknownGeneric.length}
              variant="neutral"
              icon={<AlertCircle className="h-5 w-5" />}
              defaultOpen={false}
              sectionItems={sections.trailersUnknownGeneric}
              selectedItems={selectedItems}
              onSelectSection={handleSelectSection}
            >
              {sections.trailersUnknownGeneric.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  actioningId={actioningId}
                  onAction={handleAction}
                  confidence="unknown"
                  selected={selectedItems[device.id] || false}
                  onSelect={(checked) => handleSelectItem(device.id, checked)}
                  showActions={canPerformActions}
                />
              ))}
            </Section>
          )}
        </div>
      )}

      {/* Missing Info (Both Types) */}
      {sections.missingInfo.length > 0 && (
        <Section
          title="❓ Missing Information"
          description="Devices lacking key identifying fields (trucks and trailers)"
          count={sections.missingInfo.length}
          variant="danger"
          icon={<XCircle className="h-5 w-5" />}
          defaultOpen={false}
          sectionItems={sections.missingInfo}
          selectedItems={selectedItems}
          onSelectSection={handleSelectSection}
        >
          {sections.missingInfo.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              actioningId={actioningId}
              onAction={handleAction}
              confidence="unknown"
              selected={selectedItems[device.id] || false}
              onSelect={(checked) => handleSelectItem(device.id, checked)}
            />
          ))}
        </Section>
      )}

      {/* Gateways/Deactivated Devices - Should be rejected */}
      {sections.gatewaysDeactivated.length > 0 && (
        <Section
          title="🚫 Gateways & Deactivated Devices"
          description="These are NOT vehicles - they are Samsara gateways or deactivated devices. Select all and reject."
          count={sections.gatewaysDeactivated.length}
          variant="danger"
          icon={<XCircle className="h-5 w-5" />}
          defaultOpen={true}
          sectionItems={sections.gatewaysDeactivated}
          selectedItems={selectedItems}
          onSelectSection={handleSelectSection}
        >
          {sections.gatewaysDeactivated.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              actioningId={actioningId}
              onAction={handleAction}
              confidence="gateway"
              selected={selectedItems[device.id] || false}
              onSelect={(checked) => handleSelectItem(device.id, checked)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

// Section wrapper component
interface SectionProps {
  title: string;
  description: string;
  count: number;
  variant: 'success' | 'info' | 'warning' | 'neutral' | 'danger';
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionItems: DeviceQueueItem[];
  selectedItems: SelectedItems;
  onSelectSection: (sectionItems: DeviceQueueItem[], checked: boolean) => void;
}

function Section({
  title,
  description,
  count,
  variant,
  icon,
  children,
  defaultOpen = false,
  sectionItems,
  selectedItems,
  onSelectSection,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Check if all items in this section are selected
  const allSectionSelected =
    sectionItems.length > 0 &&
    sectionItems.every((item) => selectedItems[item.id]);

  const someSectionSelected =
    sectionItems.length > 0 &&
    sectionItems.some((item) => selectedItems[item.id]) &&
    !allSectionSelected;

  const variantStyles = {
    success: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950',
    info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950',
    warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950',
    neutral: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900',
    danger: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950',
  };

  const iconStyles = {
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    neutral: 'text-gray-600 dark:text-gray-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <Card className={`border-2 ${variantStyles[variant]}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Section Select All Checkbox */}
              <input
                type="checkbox"
                checked={allSectionSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSectionSelected;
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelectSection(sectionItems, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer flex-shrink-0"
                title={allSectionSelected ? 'Deselect all in section' : 'Select all in section'}
              />
              <div className={iconStyles[variant]}>{icon}</div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{count}</Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-3">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Device card component
interface DeviceCardProps {
  device: DeviceQueueItem;
  actioningId: string | null;
  onAction: (action: 'approve' | 'reject' | 'link', id: string, data?: any) => Promise<void>;
  confidence: 'high' | 'medium' | 'low' | 'unknown' | 'gateway';
  selected: boolean;
  onSelect: (checked: boolean) => void;
  showActions?: boolean; // Hide actions for linked/rejected devices
}

function DeviceCard({ device, actioningId, onAction, confidence, selected, onSelect, showActions = true }: DeviceCardProps) {
  const isActioning = actioningId === device.id;
  const isGateway = confidence === 'gateway';

  const confidenceBadge = {
    high: { label: 'High Match', variant: 'default' as const, color: 'text-green-600' },
    medium: { label: 'Good Info', variant: 'secondary' as const, color: 'text-blue-600' },
    low: { label: 'Review', variant: 'secondary' as const, color: 'text-yellow-600' },
    unknown: { label: 'Unknown', variant: 'outline' as const, color: 'text-gray-600' },
    gateway: { label: 'Not a Vehicle', variant: 'destructive' as const, color: 'text-red-600' },
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1 h-5 w-5 rounded border-gray-300 cursor-pointer flex-shrink-0"
        />

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {device.deviceType === 'TRUCK' ? (
                <Truck className="h-4 w-4 text-blue-600" />
              ) : (
                <div className="h-4 w-4 text-orange-600">🚚</div>
              )}
              <h4 className="font-semibold">{device.name}</h4>
            </div>
            <Badge variant={confidenceBadge[confidence].variant}>
              {confidenceBadge[confidence].label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {device.vin && (
              <div>
                <span className="text-muted-foreground">VIN:</span>{' '}
                <span className="font-mono">{device.vin}</span>
              </div>
            )}
            {device.licensePlate && (
              <div>
                <span className="text-muted-foreground">Plate:</span>{' '}
                <span className="font-mono">{device.licensePlate}</span>
              </div>
            )}
            {device.make && (
              <div>
                <span className="text-muted-foreground">Make:</span> {device.make}
              </div>
            )}
            {device.model && (
              <div>
                <span className="text-muted-foreground">Model:</span> {device.model}
              </div>
            )}
            {device.year && (
              <div>
                <span className="text-muted-foreground">Year:</span> {device.year}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Added: {new Date(device.createdAt).toLocaleString()}
          </div>
        </div>

        {showActions && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            {!isGateway && (
              <>
                <Button
                  size="sm"
                  onClick={() => onAction('approve', device.id)}
                  disabled={isActioning}
                  className="whitespace-nowrap"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction('link', device.id)}
                  disabled={isActioning}
                  className="whitespace-nowrap"
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  Link
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant={isGateway ? "destructive" : "ghost"}
              onClick={() => onAction('reject', device.id)}
              disabled={isActioning}
              className="whitespace-nowrap"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

