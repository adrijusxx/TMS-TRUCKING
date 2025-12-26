import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';
import VendorMap from './VendorMap';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface NearbyVendorsWidgetProps {
    latitude: number;
    longitude: number;
}

export default function NearbyVendorsWidget({ latitude, longitude }: NearbyVendorsWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const toggleOpen = () => {
        if (!isOpen && !hasFetched) {
            fetchVendors();
        }
        setIsOpen(!isOpen);
    };

    const fetchVendors = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(apiUrl(`/api/vendors/nearby?lat=${latitude}&lng=${longitude}&radius=50`));
            if (!res.ok) throw new Error('Failed to fetch vendors');
            const data = await res.json();
            if (data.success) {
                setVendors(data.data);
            }
            setHasFetched(true);
        } catch (error) {
            toast.error('Could not load nearby vendors');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="border rounded-md mt-4 overflow-hidden">
            <div
                className="bg-muted/30 p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={toggleOpen}
            >
                <div className="flex items-center gap-2 font-medium">
                    <Store className="h-4 w-4 text-primary" />
                    <span>Find Nearby Vendors</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8">
                    {isOpen ? 'Hide Map' : 'Show Map'}
                </Button>
            </div>

            {isOpen && (
                <div className="p-3 bg-background border-t">
                    {isLoading ? (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm animate-pulse">
                            Searching radius...
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <VendorMap
                                center={{ lat: latitude, lng: longitude }}
                                vendors={vendors}
                            />
                            <div className="text-xs text-muted-foreground px-1 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span>Found {vendors.length} vendors within 50 miles</span>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Internal
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500" /> Google
                                        </span>
                                    </div>
                                </div>
                                {vendors.length === 0 && (
                                    <div className="text-yellow-600">
                                        No vendors found. Add <code>GOOGLE_PLACES_API_KEY</code> to .env for expanded search.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
