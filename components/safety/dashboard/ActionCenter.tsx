'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, CheckCircle2, AlertTriangle, FileWarning, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export interface ActionItem {
    id: string;
    type: 'EXPIRY' | 'DEFECT' | 'INCIDENT' | 'TEST_RESULT' | 'OTHER';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    title: string;
    description: string;
    actionUrl: string;
    count?: number;
}

interface ActionCenterProps {
    items: ActionItem[];
    className?: string;
}

export default function ActionCenter({ items, className }: ActionCenterProps) {
    const criticalItems = items.filter(i => i.severity === 'CRITICAL');
    const highItems = items.filter(i => i.severity === 'HIGH');
    const otherItems = items.filter(i => !['CRITICAL', 'HIGH'].includes(i.severity));

    // Determine top priority group to show first
    const displayItems = [...criticalItems, ...highItems, ...otherItems].slice(0, 5);

    return (
        <Card className={`border-l-4 border-l-destructive shadow-sm ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                        Action Center
                        {criticalItems.length > 0 && (
                            <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground animate-pulse">
                                {criticalItems.length}
                            </span>
                        )}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                        <Link href="/dashboard/safety/alerts">
                            View All
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                        <p className="font-medium text-foreground">All Clear!</p>
                        <p className="text-sm">No immediate actions required.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayItems.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                            >
                                <div className={`mt-0.5 rounded-full p-1 
                  ${item.severity === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                        item.severity === 'HIGH' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}
                                >
                                    {item.type === 'DEFECT' ? <AlertTriangle className="h-4 w-4" /> :
                                        item.type === 'EXPIRY' ? <FileWarning className="h-4 w-4" /> :
                                            <AlertCircle className="h-4 w-4" />}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium leading-none text-sm">{item.title}</p>
                                        <span className="text-xs text-muted-foreground uppercase">{item.type}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {item.description}
                                    </p>
                                </div>

                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                    <Link href={item.actionUrl}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
