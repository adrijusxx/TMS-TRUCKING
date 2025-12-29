'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Truck,
  Package,
  User,
  FileText,
  DollarSign,
  Users,
  Tag,
  Hash,
  RotateCcw,
  Loader2,
  AlertCircle,
  Calendar,
  Briefcase,
  Shield,
  Fuel,
  Wrench,
  AlertTriangle,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DeletedItem {
  id: string;
  deletedAt: string | Date;
  [key: string]: any;
}

interface SummaryData {
  truck: number;
  trailer: number;
  driver: number;
  load: number;
  invoice: number;
  customer: number;
  user: number;
  document: number;
  tag: number;
  mcNumber: number;
  accident: number;
  maintenanceRecord: number;
  fuelTransaction: number;
  insurancePolicy: number;
  total: number;
}

// Entity type configurations
const ENTITY_TABS = [
  { type: 'truck', label: 'Trucks', icon: Truck },
  { type: 'trailer', label: 'Trailers', icon: Package },
  { type: 'driver', label: 'Drivers', icon: User },
  { type: 'load', label: 'Loads', icon: Briefcase },
  { type: 'invoice', label: 'Invoices', icon: DollarSign },
  { type: 'customer', label: 'Customers', icon: Users },
  { type: 'document', label: 'Documents', icon: FileText },
  { type: 'tag', label: 'Tags', icon: Tag },
  { type: 'mcNumber', label: 'MC Numbers', icon: Hash },
  { type: 'accident', label: 'Accidents', icon: AlertTriangle },
  { type: 'maintenanceRecord', label: 'Maintenance', icon: Wrench },
  { type: 'fuelTransaction', label: 'Fuel', icon: Fuel },
  { type: 'insurancePolicy', label: 'Insurance', icon: Shield },
];

export default function DeletedItemsCategory() {
  const [activeTab, setActiveTab] = useState('truck');
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [bulkActioning, setBulkActioning] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<SummaryData>({
    truck: 0, trailer: 0, driver: 0, load: 0, invoice: 0,
    customer: 0, user: 0, document: 0, tag: 0, mcNumber: 0,
    accident: 0, maintenanceRecord: 0, fuelTransaction: 0, insurancePolicy: 0,
    total: 0,
  });
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/admin/deleted-items?type=summary');
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      } else {
        setError(data.error || 'Failed to load summary');
      }
    } catch (err: any) {
      console.error('Failed to load summary:', err);
      setError(err.message || 'Failed to load summary');
    }
  };

  const loadItems = async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/deleted-items?type=${type}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
      } else {
        setError(data.error || 'Failed to load deleted items');
        setItems([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load deleted items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadItems(activeTab);
    setSelectedItems(new Set()); // Clear selection when tab changes
  }, [activeTab]);

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleRestore = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to restore this ${type}?`)) return;

    setRestoring(id);
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: type, entityId: id }),
      });

      const data = await res.json();
      if (data.success) {
        await loadItems(activeTab);
        await loadSummary();
      } else {
        alert(`Failed to restore: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRestoring(null);
    }
  };

  const handleBulkRestore = async () => {
    const selectedIds = Array.from(selectedItems);
    if (selectedIds.length === 0) return;

    if (!confirm(`Are you sure you want to restore ${selectedIds.length} item(s)?`)) return;

    setBulkActioning(true);
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entityType: activeTab, 
          entityIds: selectedIds,
          bulk: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const { restored, failed, errors } = data.data;
        if (failed > 0 && errors.length > 0) {
          alert(`Restored ${restored} item(s). ${failed} failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        } else {
          alert(`Successfully restored ${restored} item(s).`);
        }
        setSelectedItems(new Set());
        await loadItems(activeTab);
        await loadSummary();
      } else {
        alert(`Failed to restore: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setBulkActioning(false);
    }
  };

  const handleBulkHardDelete = async () => {
    const selectedIds = Array.from(selectedItems);
    if (selectedIds.length === 0) return;

    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY DELETE ${selectedIds.length} item(s) from the database!\n\nThis action CANNOT be undone. Are you absolutely sure?`;
    if (!confirm(confirmMessage)) return;

    // Double confirmation for hard delete
    if (!confirm(`Final confirmation: Permanently delete ${selectedIds.length} item(s)? This cannot be undone.`)) return;

    setBulkActioning(true);
    try {
      const res = await fetch('/api/admin/hard-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entityType: activeTab, 
          entityIds: selectedIds,
          bulk: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const { deleted, failed, errors } = data.data;
        if (failed > 0 && errors.length > 0) {
          alert(`Permanently deleted ${deleted} item(s). ${failed} failed:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        } else {
          alert(`Successfully permanently deleted ${deleted} item(s).`);
        }
        setSelectedItems(new Set());
        await loadItems(activeTab);
        await loadSummary();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setBulkActioning(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemDisplayName = (type: string, item: DeletedItem): string => {
    switch (type) {
      case 'truck': return item.truckNumber || 'Unknown';
      case 'trailer': return item.trailerNumber || 'Unknown';
      case 'driver': return `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown';
      case 'load': return item.loadNumber || 'Unknown';
      case 'invoice': return item.invoiceNumber || 'Unknown';
      case 'customer': return item.name || 'Unknown';
      case 'user': return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'Unknown';
      case 'document': return item.title || item.fileName || 'Unknown';
      case 'tag': return item.name || 'Unknown';
      case 'mcNumber': return item.number || 'Unknown';
      case 'accident': return item.incidentNumber || item.location || `Accident on ${item.date}` || 'Unknown';
      case 'maintenanceRecord': return item.type || item.description || 'Unknown';
      case 'fuelTransaction': return item.location || `$${item.totalAmount}` || 'Unknown';
      case 'insurancePolicy': return item.policyNumber || 'Unknown';
      default: return item.id;
    }
  };

  const getItemDetails = (type: string, item: DeletedItem): string => {
    switch (type) {
      case 'truck':
      case 'trailer':
        return [item.make, item.model, item.year, item.vin && `VIN: ${item.vin}`].filter(Boolean).join(' • ');
      case 'driver':
        return [item.email, item.phone].filter(Boolean).join(' • ');
      case 'load':
        return [item.pickupCity, item.deliveryCity, item.status, item.customerRate && `$${item.customerRate}`].filter(Boolean).join(' → ');
      case 'invoice':
        return [item.status, (item.totalAmount || item.total) && `$${item.totalAmount || item.total}`, item.dueDate && `Due: ${formatDate(item.dueDate)}`].filter(Boolean).join(' • ');
      case 'customer':
        return [item.email, item.city, item.state].filter(Boolean).join(' • ');
      case 'user':
        return [item.email, item.role].filter(Boolean).join(' • ');
      case 'document':
        return [item.type, item.title, item.fileName].filter(Boolean).join(' • ');
      case 'tag':
        return [item.category, item.color].filter(Boolean).join(' • ');
      case 'mcNumber':
        return [item.name, item.status].filter(Boolean).join(' • ');
      case 'accident':
        return [item.severity, item.location, item.date && formatDate(item.date)].filter(Boolean).join(' • ');
      case 'maintenanceRecord':
        return [item.description, item.cost && `$${item.cost}`, item.date && formatDate(item.date)].filter(Boolean).join(' • ');
      case 'fuelTransaction':
        return [item.gallons && `${item.gallons} gal`, item.totalAmount && `$${item.totalAmount}`, item.date && formatDate(item.date)].filter(Boolean).join(' • ');
      case 'insurancePolicy':
        return [item.type, item.provider, item.expirationDate && `Exp: ${formatDate(item.expirationDate)}`].filter(Boolean).join(' • ');
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Deleted Items</h2>
        <p className="text-muted-foreground mt-1">
          View and restore soft-deleted data across all entity types
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="col-span-2 md:col-span-1 lg:col-span-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Deleted</CardTitle>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summary.total}</div>
          </CardContent>
        </Card>
        {ENTITY_TABS.slice(0, 6).map(tab => (
          <Card key={tab.type} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(tab.type)}>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{(summary as any)[tab.type] || 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 gap-1 flex-nowrap">
            {ENTITY_TABS.map(tab => (
              <TabsTrigger key={tab.type} value={tab.type} className="whitespace-nowrap text-xs px-2 py-1.5">
                <tab.icon className="h-3.5 w-3.5 mr-1" />
                {tab.label} ({(summary as any)[tab.type] || 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {ENTITY_TABS.map(tab => {
          const allSelected = items.length > 0 && selectedItems.size === items.length;
          const someSelected = selectedItems.size > 0 && selectedItems.size < items.length;
          const selectedCount = selectedItems.size;

          return (
            <TabsContent key={tab.type} value={tab.type} className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <tab.icon className="h-5 w-5" />
                        Deleted {tab.label}
                      </CardTitle>
                      <CardDescription>Restore or permanently delete {tab.label.toLowerCase()} that were soft-deleted</CardDescription>
                    </div>
                    {items.length > 0 && (
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected;
                            }}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-muted-foreground">
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </span>
                        </label>
                        {selectedCount > 0 && (
                          <Badge variant="secondary" className="text-sm">
                            {selectedCount} selected
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedCount > 0 && (
                    <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleBulkRestore}
                          disabled={bulkActioning}
                        >
                          {bulkActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                          )}
                          Restore Selected
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleBulkHardDelete}
                          disabled={bulkActioning}
                        >
                          {bulkActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Hard Delete Selected
                        </Button>
                      </div>
                    </div>
                  )}
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No deleted {tab.label.toLowerCase()} found
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {items.map((item) => {
                        const isSelected = selectedItems.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item.id)}
                              className="h-4 w-4 rounded border-gray-300 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold truncate">{getItemDisplayName(tab.type, item)}</span>
                                {item.samsaraId && (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    Samsara
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5 truncate">
                                {getItemDetails(tab.type, item)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Deleted: {formatDate(item.deletedAt)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestore(tab.type, item.id)}
                              disabled={restoring === item.id || bulkActioning}
                              className="shrink-0"
                            >
                              {restoring === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restore
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
