import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoadsideInspectionsPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Roadside Inspections</CardTitle>
          <CardDescription>Roadside inspection records and violations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">View and manage roadside inspection records.</p>
        </CardContent>
      </Card>
    </div>
  );
}

