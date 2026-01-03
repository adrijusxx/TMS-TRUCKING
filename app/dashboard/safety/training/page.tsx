import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function TrainingPage() {
    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Safety Hub', href: '/dashboard/safety' },
                    { label: 'Training & Docs', href: '/dashboard/safety/training' }
                ]}
            />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Training & Resources</h1>
                    <p className="text-muted-foreground">Safety programs, training materials, and document library.</p>
                </div>

                <div className="p-10 border border-dashed rounded-lg text-center text-muted-foreground">
                    Training & Documents Consolidation In Progress...
                </div>
            </div>
        </>
    );
}
