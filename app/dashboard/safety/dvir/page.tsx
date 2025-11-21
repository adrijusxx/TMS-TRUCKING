import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DVIRPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>DVIR</CardTitle>
          <CardDescription>Driver Vehicle Inspection Reports</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a vehicle to view DVIR records.</p>
        </CardContent>
      </Card>
    </div>
  );
}

