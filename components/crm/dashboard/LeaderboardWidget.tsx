'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
    name: string;
    leadsThisMonth: number;
    hiredThisMonth: number;
}

interface LeaderboardWidgetProps {
    data: LeaderboardEntry[];
    isLoading: boolean;
}

export default function LeaderboardWidget({ data, isLoading }: LeaderboardWidgetProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Recruiter Leaderboard (This Month)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No activity this month</p>
                ) : (
                    <div className="space-y-2">
                        {data.map((entry, i) => (
                            <div key={entry.name} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                                <span className="w-6 text-center font-bold text-sm">
                                    {i === 0 ? '🏆' : `#${i + 1}`}
                                </span>
                                <span className="flex-1 text-sm font-medium truncate">{entry.name}</span>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-muted-foreground">{entry.leadsThisMonth} leads</span>
                                    <span className="font-semibold text-green-600">{entry.hiredThisMonth} hired</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
