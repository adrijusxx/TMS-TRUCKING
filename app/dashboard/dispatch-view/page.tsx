import { Breadcrumb } from '@/components/ui/breadcrumb';
import DispatchViewClient from '@/components/dispatch-view/DispatchViewClient';

export default function DispatchViewPage() {
    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Load Management', href: '/dashboard/loads' },
                    { label: 'My Dispatch', href: '/dashboard/dispatch-view' }
                ]}
            />
            <div className="space-y-3">
                <div>
                    <h1 className="text-lg font-bold">My Dispatch</h1>
                    <p className="text-xs text-muted-foreground">
                        Overview of your assigned drivers and their loads
                    </p>
                </div>
                <DispatchViewClient />
            </div>
        </>
    );
}
