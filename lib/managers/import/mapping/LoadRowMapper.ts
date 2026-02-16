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
        // 1. Try to find a "Total" or "Gross" amount first (Most accurate)
        const grossRevenue = parseImportNumber(getValue(row, 'revenue', mapping, ['Total Amount', 'total_amount', 'Gross', 'gross', 'Total Pay', 'Total pay', 'Load Pay', 'Load pay'])) || 0;

        // 2. Look for components if Gross is missing
        const lineHaul = parseImportNumber(getValue(row, 'lineHaul', mapping, ['Line Haul', 'line_haul', 'Flat Rate', 'flat_rate', 'Rate', 'rate', 'Amount', 'amount'])) || 0;
        const fsc = parseImportNumber(getValue(row, 'fsc', mapping, ['FSC', 'fsc', 'Fuel', 'fuel', 'Fuel Surcharge', 'fuel_surcharge', 'fsc_amount'])) || 0;
        const accessorials = parseImportNumber(getValue(row, 'accessorials', mapping, ['Accessorials', 'accessorials', 'Other', 'other', 'Detention', 'detention', 'Lumper', 'lumper'])) || 0;

        // Determine Final Revenue
        // If Gross exists and is significantly different from components, we might want to prioritize it.
        // But if Gross is 0, we definitely sum the components.
        let finalRevenue = grossRevenue > 0 ? grossRevenue : (lineHaul + fsc + accessorials);

        // Map Driver Pay
        let driverPay = parseImportNumber(getValue(row, 'driverPay', mapping, ['Driver Pay', 'driver_pay', 'Driver Rate', 'driver_rate', 'Carrier Pay', 'carrier_pay']));
        if (driverPay === null) driverPay = 0;

        // Map Miles
        const totalMiles = parseImportNumber(getValue(row, 'totalMiles', mapping, ['Total Miles', 'Total miles', 'total_miles', 'Miles', 'miles', 'Billed Miles', 'billed_miles', 'Trip Miles', 'trip_miles', 'Paid Miles', 'paid_miles', 'Distance', 'distance', 'Odometer', 'odometer'])) || 0;
        const emptyMiles = parseImportNumber(getValue(row, 'emptyMiles', mapping, ['Empty Miles', 'Empty miles', 'empty_miles', 'Deadhead', 'deadhead'])) || 0;
        const loadedMilesCol = parseImportNumber(getValue(row, 'loadedMiles', mapping, ['Loaded Miles', 'Loaded miles', 'loaded_miles'])) || 0;
        const weight = parseImportNumber(getValue(row, 'weight', mapping, ['Weight', 'weight', 'Lbs', 'lbs', 'Gross Weight'])) || 1;

        // Explicit RPM from CSV
        const importedRPM = parseImportNumber(getValue(row, 'revenuePerMile', mapping, ['Revenue Per Mile', 'revenue_per_mile', 'RPM', 'rpm', 'Rate Per Mile', 'Rate/Mile'])) || 0;

        // Calculate missing loaded miles if possible
        let finalLoadedMiles = loadedMilesCol;
        if (finalLoadedMiles === 0 && totalMiles > 0) {
            finalLoadedMiles = Math.max(0, totalMiles - emptyMiles);
        }

        const finalTotalMiles = (finalLoadedMiles + emptyMiles) > 0 ? (finalLoadedMiles + emptyMiles) : totalMiles;

        // RPM Logic
        let finalRPM = 0;

        // 1. Calculate RPM from Revenue / Miles
        if (finalRevenue > 0 && finalTotalMiles > 0) {
            finalRPM = Number((finalRevenue / finalTotalMiles).toFixed(2));
        }
        // 2. Fallback: Use Imported RPM
        else if (importedRPM > 0) {
            finalRPM = importedRPM;
            // 3. Reverse Calculate Revenue if missing
            if (finalRevenue === 0 && finalTotalMiles > 0) {
                finalRevenue = Number((importedRPM * finalTotalMiles).toFixed(2));
            }
        }

        return {
            revenue: finalRevenue,
            driverPay,
            totalMiles: finalTotalMiles,
            loadedMiles: finalLoadedMiles,
            emptyMiles,
            weight,
            revenuePerMile: finalRPM
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

    /**
     * Parse additional details (Commodity, Ref#, Notes, Equipment)
     */
    static mapDetails(row: any, getValue: Function, mapping?: Record<string, string>) {
        const commodity = getValue(row, 'commodity', mapping, ['Commodity', 'commodity', 'Cargo', 'cargo', 'Item', 'item']);
        const shipmentId = getValue(row, 'shipmentId', mapping, ['Ref', 'Ref#', 'Reference', 'PO', 'PO#', 'BOL', 'bol', 'Shipment ID', 'shipment_id']);
        const dispatchNotes = getValue(row, 'dispatchNotes', mapping, ['Notes', 'notes', 'Instructions', 'instructions', 'Comments', 'comments']);

        // Equipment Type Mapping
        const equipStr = getValue(row, 'equipmentType', mapping, ['Equipment', 'equipment', 'Trailer Type', 'trailer_type']);
        let equipmentType = 'DRY_VAN'; // Default

        if (equipStr) {
            const e = String(equipStr).toUpperCase();
            if (e.includes('REEFER') || e.includes('FRIDGE') || e.includes('TEMP')) equipmentType = 'REEFER';
            else if (e.includes('FLAT') || e.includes('BED')) equipmentType = 'FLATBED';
            else if (e.includes('STEP')) equipmentType = 'STEP_DECK';
            else if (e.includes('POWER')) equipmentType = 'POWER_ONLY';
            else if (e.includes('BOX') || e.includes('STRAIGHT')) equipmentType = 'BOX_TRUCK';
        }

        return {
            commodity: commodity ? String(commodity).trim() : undefined,
            shipmentId: shipmentId ? String(shipmentId).trim() : undefined,
            dispatchNotes: dispatchNotes ? String(dispatchNotes).trim() : undefined,
            equipmentType
        };
    }
}
