'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Circle } from 'lucide-react';
import { toast } from 'sonner';

interface Activity {
    id: string;
    type: string;
    content: string;
    createdAt: string;
    user: {
        firstName: string;
        lastName: string;
    };
}

export default function LeadActivityTimeline({ leadId }: { leadId: string }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch(`/api/crm/leads/${leadId}/activities`);
                if (!res.ok) throw new Error('Failed to fetch activities');
                const data = await res.json();
                setActivities(data.data);
            } catch (error) {
                console.error(error);
                // toast.error('Failed to load activities'); // Suppress error on init?
            } finally {
                setLoading(false);
            }
        };

        if (leadId) fetchActivities();
    }, [leadId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6 pl-2">
                {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No activity recorded</p>
                ) : (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="relative pl-6 pb-2 border-l last:border-0 border-muted-foreground/20">
                            {/* Timeline dot */}
                            <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

                            <div className="space-y-1">
                                <p className="text-sm">{activity.content}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{activity.user.firstName} {activity.user.lastName}</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
    );
}
