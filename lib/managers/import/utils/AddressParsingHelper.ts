/**
 * AddressParsingHelper — Shared address parsing logic used by 5+ importers.
 */

import { parseLocationString } from '@/lib/import-export/import-utils';
import { normalizeState } from '@/lib/utils/state-utils';

export interface ParsedAddress {
    address: string;
    city: string;
    state: string;
    zip: string;
}

/**
 * Parse address fields with smart fallback using parseLocationString.
 * If only address is provided (city/state missing), tries to split it.
 */
export function parseAddressFields(
    address: string,
    city: string,
    state: string,
    zip: string
): ParsedAddress {
    let finalAddress = address;
    let finalCity = city;
    let finalState = state;
    let finalZip = zip;

    if (address && (!city || !state)) {
        const parsed = parseLocationString(address);
        if (parsed) {
            if (parsed.address) finalAddress = parsed.address;
            if (!finalCity) finalCity = parsed.city;
            if (!finalState) finalState = parsed.state;
            if (!finalZip && parsed.zip) finalZip = parsed.zip;
        }
    }

    return {
        address: finalAddress,
        city: finalCity,
        state: normalizeState(finalState) || finalState,
        zip: String(finalZip || ''),
    };
}

/**
 * Generate standard warnings for missing address fields.
 */
export function getAddressWarnings(
    addr: ParsedAddress,
    rowNum: number,
    warnFn: (row: number, msg: string, field?: string) => { row: number; field?: string; error: string }
): Array<{ row: number; field?: string; error: string }> {
    const warnings: Array<{ row: number; field?: string; error: string }> = [];
    if (!addr.address) warnings.push(warnFn(rowNum, 'Address missing, defaulted to Unknown', 'address'));
    if (!addr.city) warnings.push(warnFn(rowNum, 'City missing, defaulted to Unknown', 'city'));
    if (!addr.state || addr.state === 'XX') warnings.push(warnFn(rowNum, 'State missing, defaulted to XX', 'state'));
    return warnings;
}
