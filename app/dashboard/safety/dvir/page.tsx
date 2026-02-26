import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DVIRPage() {
  return (
    <div className="space-y-4">
<Card>
          <CardHeader>
            <CardTitle>Inspection Reports</CardTitle>
            <CardDescription>View and manage vehicle inspection reports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Select a vehicle to view DVIR records.</p>
          </CardContent>
        </Card>
      </div>
  );
}

