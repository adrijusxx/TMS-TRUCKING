import { prisma } from '@/lib/prisma';
import { Vendor } from '@prisma/client';

interface GooglePlaceResult {
    id: string;
    name: string;
    address: string;
    phone?: string;
    rating?: number;
    latitude: number;
    longitude: number;
    distance: number;
    isGooglePlace: true;
}

interface LocalVendorResult extends Vendor {
    distance: number;
    isGooglePlace?: false;
}

export type VendorResult = LocalVendorResult | GooglePlaceResult;

export class VendorSearchService {
    /**
     * Calculate distance between two points in miles
     */
    private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 3959; // Radius of the Earth in miles
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) *
            Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Search Google Places for nearby auto repair shops
     */
    async searchGooglePlaces(
        latitude: number,
        longitude: number,
        radiusMiles: number = 50
    ): Promise<GooglePlaceResult[]> {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.warn('[VendorSearch] No Google Places API key configured');
            return [];
        }

        try {
            // Convert miles to meters (Google uses meters)
            const radiusMeters = Math.min(radiusMiles * 1609.34, 50000); // Max 50km

            // Search for truck repair, auto repair, and towing services
            const types = ['car_repair', 'gas_station'];
            const keyword = 'truck repair towing service';

            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.error('[VendorSearch] Google Places API error:', response.statusText);
                return [];
            }

            const data = await response.json();

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                console.error('[VendorSearch] Google Places API status:', data.status, data.error_message);
                return [];
            }

            const results: GooglePlaceResult[] = (data.results || []).map((place: any) => ({
                id: `google_${place.place_id}`,
                name: place.name,
                address: place.vicinity || place.formatted_address,
                rating: place.rating,
                latitude: place.geometry?.location?.lat,
                longitude: place.geometry?.location?.lng,
                distance: this.getDistance(
                    latitude, longitude,
                    place.geometry?.location?.lat,
                    place.geometry?.location?.lng
                ),
                isGooglePlace: true as const
            }));

            return results.filter(r => r.latitude && r.longitude);
        } catch (error) {
            console.error('[VendorSearch] Google Places error:', error);
            return [];
        }
    }

    /**
     * Search for vendors near a location (combines local DB + Google Places)
     */
    async searchVendors(
        companyId: string,
        params: {
            latitude: number;
            longitude: number;
            radiusMiles?: number;
            serviceType?: string;
            limit?: number;
            includeGoogle?: boolean;
        }
    ): Promise<VendorResult[]> {
        const { latitude, longitude, radiusMiles = 50, serviceType, limit = 20, includeGoogle = true } = params;

        // Fetch from local database
        const latDelta = radiusMiles / 69;
        const lonDelta = radiusMiles / (69 * Math.cos(this.deg2rad(latitude)));

        const minLat = latitude - latDelta;
        const maxLat = latitude + latDelta;
        const minLon = longitude - lonDelta;
        const maxLon = longitude + lonDelta;

        const vendors = await prisma.vendor.findMany({
            where: {
                companyId,
                latitude: { not: null, gte: minLat, lte: maxLat },
                longitude: { not: null, gte: minLon, lte: maxLon },
                ...(serviceType && {
                    services: { has: serviceType }
                }),
            }
        });

        // Calculate distances for local vendors
        const localResults: LocalVendorResult[] = vendors.map(v => ({
            ...v,
            distance: this.getDistance(latitude, longitude, v.latitude!, v.longitude!),
            isGooglePlace: false as const
        })).filter(v => v.distance <= radiusMiles);

        // Fetch from Google Places if enabled
        let googleResults: GooglePlaceResult[] = [];
        if (includeGoogle) {
            googleResults = await this.searchGooglePlaces(latitude, longitude, radiusMiles);
        }

        // Combine and sort by distance
        const combined: VendorResult[] = [...localResults, ...googleResults];
        combined.sort((a, b) => a.distance - b.distance);

        return combined.slice(0, limit);
    }
}

