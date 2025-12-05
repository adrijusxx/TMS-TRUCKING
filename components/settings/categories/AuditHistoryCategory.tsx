'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  History,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  User,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  ipAddress?: string;
  createdAt: string;
}

interface AuditData {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: Record<string, number>;
}

const ENTITY_TYPES = [
  { value: 'all', label: 'All Entities' },
  { value: 'load', label: 'Loads' },
  { value: 'truck', label: 'Trucks' },
  { value: 'trailer', label: 'Trailers' },
  { value: 'driver', label: 'Drivers' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'customer', label: 'Customers' },
  { value: 'user', label: 'Users' },
  { value: 'document', label: 'Documents' },
  { value: 'settlement', label: 'Settlements' },
];

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'CREATE', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'DELETE', label: 'Deleted' },
];

export default function AuditHistoryCategory() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [entity, setEntity] = useState('all');
  const [action, setAction] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (entity && entity !== 'all') params.append('entity', entity);
      if (action && action !== 'all') params.append('action', action);
      if (search) params.append('entityId', search);
      params.append('page', page.toString());
      params.append('limit', '30');

      const res = await fetch(`/api/admin/audit-log?${params}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load audit logs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [entity, action, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadAuditLogs();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <Pencil className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Created</Badge>;
      case 'UPDATE': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Updated</Badge>;
      case 'DELETE': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Deleted</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatChanges = (changes: any): string => {
    if (!changes) return '';
    if (typeof changes === 'string') return changes;
    
    try {
      const entries = Object.entries(changes);
      if (entries.length === 0) return '';
      if (entries.length <= 3) {
        return entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ');
      }
      return `${entries.length} fields changed`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Audit History</h2>
        <p className="text-muted-foreground mt-1">
          View all changes, creations, and deletions across the system
        </p>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Actions</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold">{data.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-green-700 dark:text-green-300">
                <Plus className="h-3.5 w-3.5" /> Created
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold text-green-900 dark:text-green-100">{data.summary.CREATE || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <Pencil className="h-3.5 w-3.5" /> Updated
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{data.summary.UPDATE || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-red-700 dark:text-red-300">
                <Trash2 className="h-3.5 w-3.5" /> Deleted
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-xl font-bold text-red-900 dark:text-red-100">{data.summary.DELETE || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(type => (
                  <SelectItem key={type.value || 'all'} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(type => (
                  <SelectItem key={type.value || 'all'} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Entity ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            {data ? `Showing ${data.logs.length} of ${data.total} entries` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.logs.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {data.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-1">{getActionIcon(log.action)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActionBadge(log.action)}
                        <Badge variant="outline" className="capitalize">{log.entity}</Badge>
                        <span className="text-sm font-mono text-muted-foreground truncate">{log.entityId}</span>
                      </div>
                      {log.changes && (
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {formatChanges(log.changes)}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.createdAt)}
                        </span>
                        {log.ipAddress && (
                          <span className="font-mono">{log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                      disabled={page >= data.totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

