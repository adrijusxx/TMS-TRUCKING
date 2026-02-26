import InspectionsTable from '@/components/safety/fleet/InspectionsTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function FleetSafetyPage() {
    return (
    <div className="space-y-4">
<div className="grid gap-6 md:grid-cols-4">
                    {/* Summary Cards could go here e.g. OOS Vehicles */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Out of Service
                            </CardTitle>
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2</div>
                            <p className="text-xs text-muted-foreground">
                                Vehicles currently OOS
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <InspectionsTable />
            </div>
  );
}
