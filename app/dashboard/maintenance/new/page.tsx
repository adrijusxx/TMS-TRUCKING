import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function NewMaintenancePage() {
    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Maintenance', href: '/dashboard/maintenance' },
                    { label: 'New Record' },
                ]}
            />
            <div className="space-y-6">
                <MaintenanceForm />
            </div>
        </>
    );
}
