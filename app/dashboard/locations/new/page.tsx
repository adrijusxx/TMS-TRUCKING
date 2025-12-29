import { Breadcrumb } from '@/components/ui/breadcrumb';
import LocationForm from '@/components/locations/LocationForm';

export default function NewLocationPage() {
    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Locations', href: '/dashboard/locations' },
                    { label: 'New Location' },
                ]}
            />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">New Location</h1>
                    <p className="text-muted-foreground">
                        Add a new location to your address book
                    </p>
                </div>
                <LocationForm />
            </div>
        </>
    );
}
