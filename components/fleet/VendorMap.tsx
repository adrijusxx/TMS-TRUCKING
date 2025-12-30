import React, { useState, useCallback } from 'react';
import { getPublicEnv } from '@/lib/env-client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2, MapPin, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem'
};

interface VendorMapProps {
    center: {
        lat: number;
        lng: number;
    };
    vendors: Array<{
        id: string;
        name: string;
        latitude?: number | null;
        longitude?: number | null;
        type?: string;
        distance?: number;
        phone?: string | null;
        address?: string;
        rating?: number;
        isGooglePlace?: boolean;
    }>;
}

export default function VendorMap({ center, vendors }: VendorMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: getPublicEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') || ''
    });

    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(center);

        vendors.forEach(vendor => {
            if (vendor.latitude && vendor.longitude) {
                bounds.extend({ lat: vendor.latitude, lng: vendor.longitude });
            }
        });

        map.fitBounds(bounds);
        setMap(map);
    }, [center, vendors]);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20 text-center h-[400px]">
                <MapPin className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Map Cannot Load</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Please check your Google Maps API Key configuration.
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10 h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <span className="text-sm text-muted-foreground">Loading Map...</span>
            </div>
        );
    }

    return (
        <div className="relative rounded-lg overflow-hidden border shadow-sm">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {/* Breakdown Location Marker */}
                <Marker
                    position={center}
                    icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    }}
                    title="Breakdown Location"
                />

                {/* Vendor Markers */}
                {vendors.map(vendor => (
                    vendor.latitude && vendor.longitude ? (
                        <Marker
                            key={vendor.id}
                            position={{ lat: vendor.latitude, lng: vendor.longitude }}
                            icon={{
                                url: vendor.isGooglePlace
                                    ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                                    : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                            }}
                            onClick={() => setSelectedVendor(vendor)}
                        />
                    ) : null
                ))}

                {selectedVendor && (
                    <InfoWindow
                        position={{ lat: selectedVendor.latitude!, lng: selectedVendor.longitude! }}
                        onCloseClick={() => setSelectedVendor(null)}
                    >
                        <div className="p-1 min-w-[200px]">
                            <div className="flex items-center gap-1 mb-1">
                                <h4 className="font-bold text-sm">{selectedVendor.name}</h4>
                                {selectedVendor.isGooglePlace && (
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">Google</span>
                                )}
                            </div>
                            {selectedVendor.address && (
                                <p className="text-xs text-gray-600 mb-1">{selectedVendor.address}</p>
                            )}
                            {selectedVendor.type && !selectedVendor.isGooglePlace && (
                                <p className="text-xs text-gray-600 mb-1">{selectedVendor.type}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs mb-2">
                                {selectedVendor.distance && (
                                    <span>{selectedVendor.distance.toFixed(1)} mi</span>
                                )}
                                {selectedVendor.rating && (
                                    <span className="text-yellow-600">★ {selectedVendor.rating}</span>
                                )}
                            </div>
                            {selectedVendor.phone && (
                                <Button size="sm" variant="secondary" className="w-full h-7 text-xs" onClick={() => window.open(`tel:${selectedVendor.phone}`)}>
                                    Call {selectedVendor.phone}
                                </Button>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}
