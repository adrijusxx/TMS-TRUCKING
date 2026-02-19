'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Phone, PhoneIncoming, PhoneOutgoing, ArrowUpDown,
  ChevronLeft, ChevronRight, Play, Clock,
} from 'lucide-react';

interface CdrRecord {
  cdr_id?: string;
  callid?: string;
  orig_from_user?: string;
  orig_from_name?: string;
  orig_to_user?: string;
  orig_to_name?: string;
  time_start: string;
  time_answer?: string;
  time_release?: string;
  duration?: number;
  direction?: string;
  recording_url?: string;
  has_recording?: boolean;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function DirectionIcon({ direction }: { direction?: string }) {
  if (direction === 'inbound') return <PhoneIncoming className="h-4 w-4 text-blue-600" />;
  if (direction === 'outbound') return <PhoneOutgoing className="h-4 w-4 text-green-600" />;
  return <Phone className="h-4 w-4 text-muted-foreground" />;
}

export default function CdrTable() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [direction, setDirection] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data, isLoading, error } = useQuery({
    queryKey: ['netsapiens-cdr', startDate, endDate, direction, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + 'T23:59:59').toISOString(),
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      if (direction !== 'all') params.set('direction', direction);

      const res = await fetch(`/api/integrations/netsapiens/cdr?${params}`);
      if (!res.ok) throw new Error('Failed to load CDR');
      return res.json();
    },
  });

  const records: CdrRecord[] = data?.data || [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call History</CardTitle>
        <CardDescription>Call detail records from the PBX</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              className="w-36"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              className="w-36"
            />
          </div>

          <Select value={direction} onValueChange={(v) => { setDirection(v); setPage(0); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center p-4">Failed to load call history</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-8">No call records found</p>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Date/Time</th>
                    <th className="text-left p-3 font-medium">Direction</th>
                    <th className="text-left p-3 font-medium">From</th>
                    <th className="text-left p-3 font-medium">To</th>
                    <th className="text-left p-3 font-medium">Duration</th>
                    <th className="text-left p-3 font-medium">Recording</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.cdr_id || r.callid || i} className="border-t hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap">{formatTime(r.time_start)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <DirectionIcon direction={r.direction} />
                          <Badge variant="outline" className="text-xs">
                            {r.direction || 'unknown'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="font-medium">{r.orig_from_name || r.orig_from_user || '-'}</span>
                          {r.orig_from_name && r.orig_from_user && (
                            <span className="text-xs text-muted-foreground ml-1">{r.orig_from_user}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="font-medium">{r.orig_to_name || r.orig_to_user || '-'}</span>
                          {r.orig_to_name && r.orig_to_user && (
                            <span className="text-xs text-muted-foreground ml-1">{r.orig_to_user}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(r.duration)}
                        </span>
                      </td>
                      <td className="p-3">
                        {(r.recording_url || r.has_recording) ? (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={`/api/integrations/netsapiens/recordings/${r.callid}`}
                              target="_blank"
                              title="Play recording"
                            >
                              <Play className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {total > 0 ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} of ${total}` : 'No results'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
