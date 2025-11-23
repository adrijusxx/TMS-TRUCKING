import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DVIRPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'DVIR' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">DVIR</h1>
        </div>
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
    </>
  );
}

