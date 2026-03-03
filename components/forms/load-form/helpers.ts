/**
 * Normalize stop data for form submission.
 * Ensures required fields are trimmed and dates are ISO strings.
 */
export function normalizeStopsForSubmit(stops: any[]): any[] {
  return stops.map((stop: any) => {
    const normalized: any = {
      stopType: stop.stopType,
      sequence: stop.sequence,
      address: stop.address?.trim() || '',
      city: stop.city?.trim() || '',
      state: stop.state?.trim().toUpperCase().slice(0, 2) || '',
      zip: stop.zip?.trim() || '',
    };
    if (stop.company) normalized.company = stop.company.trim();
    if (stop.phone) normalized.phone = stop.phone.trim();
    if (stop.contactName) normalized.contactName = stop.contactName.trim();
    if (stop.contactPhone) normalized.contactPhone = stop.contactPhone.trim();
    if (stop.notes) normalized.notes = stop.notes.trim();
    if (stop.specialInstructions) normalized.specialInstructions = stop.specialInstructions.trim();
    if (stop.items) normalized.items = stop.items;
    if (stop.totalPieces) normalized.totalPieces = stop.totalPieces;
    if (stop.totalWeight) normalized.totalWeight = stop.totalWeight;
    if (stop.earliestArrival) {
      normalized.earliestArrival = stop.earliestArrival instanceof Date
        ? stop.earliestArrival.toISOString()
        : typeof stop.earliestArrival === 'string' ? stop.earliestArrival : undefined;
    }
    if (stop.latestArrival) {
      normalized.latestArrival = stop.latestArrival instanceof Date
        ? stop.latestArrival.toISOString()
        : typeof stop.latestArrival === 'string' ? stop.latestArrival : undefined;
    }
    return normalized;
  });
}

/**
 * Safely set a numeric field from extracted AI data.
 */
export function setNumericField(data: any, field: string, setValue: any) {
  if (data[field] !== undefined && data[field] !== null) {
    const value = typeof data[field] === 'string' ? parseFloat(data[field]) : data[field];
    if (!isNaN(value) && value >= 0) setValue(field, value, { shouldValidate: false });
  }
}
