import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoadsideInspectionsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Roadside Inspections' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roadside Inspections</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Inspection Records</CardTitle>
            <CardDescription>View and manage roadside inspection records</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">View and manage roadside inspection records.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

