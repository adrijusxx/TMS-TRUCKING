import { parseImportDate, parseLocationString, parseImportNumber } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

/**
 * LoadRowMapper
 * 
 * Handles parsing and mapping of raw CSV/JSON rows to internal Load structures.
 */
export class LoadRowMapper {
    /**
     * Map a raw row to structured location and date information
     */
    static mapRowLocations(row: any, getValue: Function, mapping?: Record<string, string>) {
        // Pickup
        const pickupString = getValue(row, 'pickupLocation', mapping, ['Pickup Location', 'pickup_location', 'Pickup', 'pickup', 'Origin', 'origin']);
        const pickupParsed = parseLocationString(pickupString);
        const expPickupCity = getValue(row, 'pickupCity', mapping, ['Pickup City', 'pickup_city', 'Origin City', 'origin_city']);
        const expPickupState = getValue(row, 'pickupState', mapping, ['Pickup State', 'pickup_state', 'Origin State', 'origin_state']);
        const expPickupZip = getValue(row, 'pickupZip', mapping, ['Pickup Zip', 'pickup_zip', 'Origin Zip', 'origin_zip']);

        const pickup = {
            city: (expPickupCity || pickupParsed?.city || 'Unknown').trim(),
            state: normalizeState(expPickupState || pickupParsed?.state) || '',
            zip: (expPickupZip || pickupParsed?.zip || '00000').trim(),
            location: pickupString || (expPickupCity ? `${expPickupCity}, ${expPickupState || ''}` : 'Unknown')
        };

        // Delivery
        const deliveryString = getValue(row, 'deliveryLocation', mapping, ['Delivery Location', 'delivery_location', 'Delivery', 'delivery', 'Destination', 'destination', 'Dest', 'dest']);
        const deliveryParsed = parseLocationString(deliveryString);
        const expDeliveryCity = getValue(row, 'deliveryCity', mapping, ['Delivery City', 'delivery_city', 'Destination City', 'destination_city', 'Dest City', 'dest_city']);
        const expDeliveryState = getValue(row, 'deliveryState', mapping, ['Delivery State', 'delivery_state', 'Destination State', 'destination_state', 'Dest State', 'dest_state']);
        const expDeliveryZip = getValue(row, 'deliveryZip', mapping, ['Delivery Zip', 'delivery_zip', 'Destination Zip', 'destination_zip', 'Dest Zip', 'dest_zip']);

        const delivery = {
            city: (expDeliveryCity || deliveryParsed?.city || 'Unknown').trim(),
            state: normalizeState(expDeliveryState || deliveryParsed?.state) || '',
            zip: (expDeliveryZip || deliveryParsed?.zip || '00000').trim(),
            location: deliveryString || (expDeliveryCity ? `${expDeliveryCity}, ${expDeliveryState || ''}` : 'Unknown')
        };

        return { pickup, delivery };
    }

    /**
     * Parse financial and distance numbers from row
     */
    static mapFinancials(row: any, getValue: Function, mapping?: Record<string, string>) {
        const revenue = parseImportNumber(getValue(row, 'revenue', mapping, ['Load pay', 'Load Pay', 'Revenue', 'revenue', 'Pay', 'pay', 'Rate', 'rate', 'Gross', 'gross', 'Total Amount', 'total_amount', 'Line Haul', 'line_haul'])) || 0;
        let driverPay = parseImportNumber(getValue(row, 'driverPay', mapping, ['Total pay', 'Total Pay', 'total_pay', 'Driver Pay', 'driver_pay']));
        if (driverPay === null) driverPay = 0;

        const totalMiles = parseImportNumber(getValue(row, 'totalMiles', mapping, ['Total miles', 'Total Miles', 'total_miles', 'Miles', 'miles', 'Distance', 'distance', 'Trip Miles', 'trip_miles'])) || 0;
        const emptyMiles = parseImportNumber(getValue(row, 'emptyMiles', mapping, ['Empty miles', 'Empty Miles', 'empty_miles'])) || 0;
        const loadedMilesCol = parseImportNumber(getValue(row, 'loadedMiles', mapping, ['Loaded miles', 'Loaded Miles', 'loaded_miles'])) || 0;
        const weight = parseImportNumber(getValue(row, 'weight', mapping, ['Weight', 'weight'])) || 1;

        // Calculate missing loaded miles if possible
        let finalLoadedMiles = loadedMilesCol;
        if (finalLoadedMiles === 0 && totalMiles > 0) {
            finalLoadedMiles = Math.max(0, totalMiles - emptyMiles);
        }

        const finalTotalMiles = (finalLoadedMiles + emptyMiles) > 0 ? (finalLoadedMiles + emptyMiles) : totalMiles;

        return {
            revenue,
            driverPay,
            totalMiles: finalTotalMiles,
            loadedMiles: finalLoadedMiles,
            emptyMiles,
            weight
        };
    }

    /**
     * Parse dates from row
     */
    static mapDates(row: any, getValue: Function, mapping?: Record<string, string>) {
        const pickupDate = parseImportDate(getValue(row, 'pickupDate', mapping, ['Pickup Date', 'pickup_date', 'PU date']));
        const deliveryDate = parseImportDate(getValue(row, 'deliveryDate', mapping, ['Delivery Date', 'delivery_date', 'DEL date', 'Delivery date']));

        const finalPickupDate = pickupDate || new Date();
        const finalDeliveryDate = deliveryDate || new Date(finalPickupDate.getTime() + 24 * 60 * 60 * 1000);

        return {
            pickupDate: finalPickupDate,
            deliveryDate: finalDeliveryDate,
            pickupDateRaw: pickupDate,
            deliveryDateRaw: deliveryDate
        };
    }
}
