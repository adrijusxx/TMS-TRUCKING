import { Breadcrumb } from '@/components/ui/breadcrumb';
import ComplianceMatrix from '@/components/safety/compliance/ComplianceMatrix';

export default function CompliancePage() {
    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Safety Hub', href: '/dashboard/safety' },
                    { label: 'Driver Compliance', href: '/dashboard/safety/compliance' }
                ]}
            />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Driver Compliance</h1>
                    <p className="text-muted-foreground">Manage driver qualifications, CDLs, medical cards, and drug tests.</p>
                </div>
                <ComplianceMatrix />
            </div>
        </>
    );
}
