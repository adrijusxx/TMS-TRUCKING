'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Search, Clock, Shield, User, Database, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogClientProps {
    initialLogs: any[];
    totalCount: number;
}

export default function AuditLogClient({ initialLogs, totalCount }: AuditLogClientProps) {
    const [logs, setLogs] = useState(initialLogs);
    const [search, setSearch] = useState('');

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'bg-green-500/20 text-green-400 border-green-500/30';
        if (action.includes('UPDATE')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (action.includes('DELETE')) return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (action.includes('IMPERSONATE')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="h-8 w-8 text-red-500" />
                        System Audit Logs
                    </h1>
                    <p className="text-slate-400">Tracking all Super Admin actions across the system</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-slate-900 border-slate-800 text-white w-64"
                        />
                    </div>
                    <Button variant="outline" className="border-slate-800">Export CSV</Button>
                </div>
            </div>

            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-950/50">
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Timestamp</TableHead>
                                <TableHead className="text-slate-400">Admin User</TableHead>
                                <TableHead className="text-slate-400">Action</TableHead>
                                <TableHead className="text-slate-400">Entity</TableHead>
                                <TableHead className="text-slate-400">ID / Target</TableHead>
                                <TableHead className="text-slate-400 text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/20 transition-colors">
                                    <TableCell className="text-slate-300 font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-slate-500" />
                                            {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                                <User className="h-3 w-3 text-red-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{log.user.firstName} {log.user.lastName}</div>
                                                <div className="text-[10px] text-slate-500">{log.user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getActionColor(log.action)}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                                            <Database className="h-3 w-3" />
                                            {log.entityType}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-300 font-mono text-[10px]">
                                        {log.entityId}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-slate-500 italic">
                                        No system actions recorded yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center text-xs text-slate-500">
                <div>Showing {logs.length} of {totalCount} total events</div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" disabled className="text-slate-600">Previous</Button>
                    <Button variant="ghost" size="sm" className="text-slate-400">Next</Button>
                </div>
            </div>
        </div>
    );
}
