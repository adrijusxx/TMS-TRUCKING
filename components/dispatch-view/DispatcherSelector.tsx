'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ChevronRight } from 'lucide-react';

interface Dispatcher {
    id: string;
    name: string;
    email: string;
    role: string;
    driverCount: number;
}

interface DispatcherSelectorProps {
    dispatchers: Dispatcher[];
    onSelect: (id: string) => void;
}

export default function DispatcherSelector({ dispatchers, onSelect }: DispatcherSelectorProps) {
    if (dispatchers.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                        No dispatchers found in your organization.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Select Dispatcher</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                <p className="text-xs text-muted-foreground mb-3">
                    As an admin, you can view any dispatcher's dashboard. Select a dispatcher below:
                </p>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {dispatchers.map((dispatcher) => (
                        <Button
                            key={dispatcher.id}
                            variant="outline"
                            className="h-auto p-3 justify-between"
                            onClick={() => onSelect(dispatcher.id)}
                        >
                            <div className="text-left">
                                <div className="font-medium text-sm">{dispatcher.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {dispatcher.driverCount} driver{dispatcher.driverCount !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
