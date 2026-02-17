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
        const pickupString = getValue(row, 'pickupLocation', mapping, ['Pickup Location', 'pickup_location', 'Pickup', 'pickup', 'Origin', 'origin'])
            || getValue(row, 'pickupAddress', mapping, ['Pickup Address', 'pickup_address', 'Origin Address']);
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
        const deliveryString = getValue(row, 'deliveryLocation', mapping, ['Delivery Location', 'delivery_location', 'Delivery', 'delivery', 'Destination', 'destination', 'Dest', 'dest'])
            || getValue(row, 'deliveryAddress', mapping, ['Delivery Address', 'delivery_address', 'Destination Address']);
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
        // 1. Try to find revenue from any of the UI-mapped keys (revenue, totalPay, loadPay)
        const revenueVal = parseImportNumber(getValue(row, 'revenue', mapping, ['Total Amount', 'total_amount', 'Gross', 'gross', 'Total Pay', 'Total pay', 'Load Pay', 'Load pay'])) || 0;
        const totalPayVal = parseImportNumber(getValue(row, 'totalPay', mapping, [])) || 0;
        const loadPayVal = parseImportNumber(getValue(row, 'loadPay', mapping, [])) || 0;
        const grossRevenue = revenueVal > 0 ? revenueVal : (totalPayVal > 0 ? totalPayVal : loadPayVal);

        // 2. Look for components if Gross is missing
        const lineHaul = parseImportNumber(getValue(row, 'lineHaul', mapping, ['Line Haul', 'line_haul', 'Flat Rate', 'flat_rate', 'Rate', 'rate', 'Amount', 'amount'])) || 0;
        const fsc = parseImportNumber(getValue(row, 'fsc', mapping, ['FSC', 'fsc', 'Fuel', 'fuel', 'Fuel Surcharge', 'fuel_surcharge', 'fsc_amount'])) || 0;
        const accessorials = parseImportNumber(getValue(row, 'accessorials', mapping, ['Accessorials', 'accessorials', 'Other', 'other', 'Detention', 'detention', 'Lumper', 'lumper'])) || 0;

        // Determine Final Revenue
        let finalRevenue = grossRevenue > 0 ? grossRevenue : (lineHaul + fsc + accessorials);

        // Map Driver Pay
        let driverPay = parseImportNumber(getValue(row, 'driverPay', mapping, ['Driver Pay', 'driver_pay', 'Driver Rate', 'driver_rate', 'Carrier Pay', 'carrier_pay']));
        if (driverPay === null) driverPay = 0;

        const fuelAdvance = parseImportNumber(getValue(row, 'fuelAdvance', mapping, ['Fuel Advance', 'fuel_advance', 'Advance', 'advance'])) || 0;
        const expenses = parseImportNumber(getValue(row, 'expenses', mapping, ['Expenses', 'expenses', 'Costs', 'costs', 'Tolls', 'tolls'])) || 0;
        const serviceFee = parseImportNumber(getValue(row, 'serviceFee', mapping, ['Service Fee', 'service_fee', 'Fee', 'fee'])) || 0;

        // Map Miles
        const totalMiles = parseImportNumber(getValue(row, 'totalMiles', mapping, ['Total Miles', 'Total miles', 'total_miles', 'Miles', 'miles', 'Billed Miles', 'billed_miles', 'Trip Miles', 'trip_miles', 'Paid Miles', 'paid_miles', 'Distance', 'distance', 'Odometer', 'odometer'])) || 0;
        const emptyMiles = parseImportNumber(getValue(row, 'emptyMiles', mapping, ['Empty Miles', 'Empty miles', 'empty_miles', 'Deadhead', 'deadhead'])) || 0;
        const loadedMilesCol = parseImportNumber(getValue(row, 'loadedMiles', mapping, ['Loaded Miles', 'Loaded miles', 'loaded_miles'])) || 0;
        const actualMiles = parseImportNumber(getValue(row, 'actualMiles', mapping, ['Actual Miles', 'actual_miles', 'GPS Miles', 'gps_miles'])) || 0;
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
        else if (importedRPM > 0) {
            finalRPM = importedRPM;
            if (finalRevenue === 0 && finalTotalMiles > 0) {
                finalRevenue = Number((importedRPM * finalTotalMiles).toFixed(2));
            }
        }

        return {
            revenue: finalRevenue,
            driverPay,
            fuelAdvance,
            totalMiles: finalTotalMiles,
            loadedMiles: finalLoadedMiles,
            emptyMiles,
            actualMiles,
            weight,
            revenuePerMile: finalRPM
        };
    }

    /**
     * Parse dates from row
     */
    static mapDates(row: any, getValue: Function, mapping?: Record<string, string>) {
        const pickupDate = parseImportDate(getValue(row, 'pickupDate', mapping, ['Pickup Date', 'pickup_date', 'PU date', 'puDate', 'Pu Date']))
            || parseImportDate(getValue(row, 'puDate', mapping, []));
        const deliveryDate = parseImportDate(getValue(row, 'deliveryDate', mapping, ['Delivery Date', 'delivery_date', 'DEL date', 'Delivery date', 'delDate', 'Del Date']))
            || parseImportDate(getValue(row, 'delDate', mapping, []));

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
        const driverNotes = getValue(row, 'driverNotes', mapping, ['Driver Notes', 'driver_notes', 'Driver Info', 'driver_info']);

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

        // New Fields
        const pieces = parseImportNumber(getValue(row, 'pieces', mapping, ['Pieces', 'pieces', 'Pcs', 'pcs', 'Count', 'count'])) || undefined;
        const pallets = parseImportNumber(getValue(row, 'pallets', mapping, ['Pallets', 'pallets', 'Plts', 'plts'])) || undefined;
        const temperature = getValue(row, 'temperature', mapping, ['Temperature', 'temperature', 'Temp', 'temp']);

        const hazmatRaw = getValue(row, 'hazmat', mapping, ['Hazmat', 'hazmat', 'Hazardous', 'hazardous']);
        const hazmat = hazmatRaw != null && hazmatRaw !== '' &&
            (String(hazmatRaw).toLowerCase() === 'yes' || String(hazmatRaw).toLowerCase() === 'true' || hazmatRaw === 1 || hazmatRaw === '1');
        const hazmatClass = getValue(row, 'hazmatClass', mapping, ['Hazmat Class', 'hazmat_class', 'Hazard Class', 'hazard_class']);

        // Stop Contact Info
        const pickupContact = getValue(row, 'pickupContact', mapping, ['Pickup Contact', 'pickup_contact', 'Origin Contact']);
        const pickupPhone = getValue(row, 'pickupPhone', mapping, ['Pickup Phone', 'pickup_phone', 'Origin Phone']);
        const deliveryContact = getValue(row, 'deliveryContact', mapping, ['Delivery Contact', 'delivery_contact', 'Destination Contact']);
        const deliveryPhone = getValue(row, 'deliveryPhone', mapping, ['Delivery Phone', 'delivery_phone', 'Destination Phone']);

        // New Fields
        const urgency = getValue(row, 'urgency', mapping, ['Urgency', 'urgency', 'Priority', 'priority']);
        const eta = parseImportDate(getValue(row, 'eta', mapping, ['ETA', 'eta', 'Estimated Arrival']));
        const quickPayFee = parseImportNumber(getValue(row, 'quickPayFee', mapping, ['Quick Pay Fee', 'quick_pay_fee']));

        return {
            commodity: commodity ? String(commodity).trim() : undefined,
            shipmentId: shipmentId ? String(shipmentId).trim() : undefined,
            dispatchNotes: dispatchNotes ? String(dispatchNotes).trim() : undefined,
            driverNotes: driverNotes ? String(driverNotes).trim() : undefined,
            equipmentType,
            pieces,
            pallets,
            temperature: temperature ? String(temperature).trim() : undefined,
            hazmat,
            hazmatClass: hazmatClass ? String(hazmatClass).trim() : undefined,
            urgency: urgency ? urgency.toUpperCase() : 'NORMAL',
            eta,
            quickPayFee
        };
    }
}
