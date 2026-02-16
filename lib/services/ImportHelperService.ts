import { AIService } from './AIService';

interface MappingSuggestion {
    sourceHeader: string;
    targetField: string;
    confidence: number;
}

export class ImportHelperService extends AIService {

    /**
     * Suggests mappings between user CSV headers and system fields
     */
    async suggestColumnMapping(
        userHeaders: string[],
        entityType: 'loads' | 'drivers' | 'trucks' | 'trailers' | 'customers' | 'vendors' | 'invoices'
    ): Promise<Record<string, string>> {

        const targetFields = this.getTargetFieldsForEntity(entityType);

        // If no specific fields, return empty
        if (Object.keys(targetFields).length === 0) return {};

        const prompt = `
I have a CSV file with the following headers:
${JSON.stringify(userHeaders)}

I need to map these headers to the following system fields:
${JSON.stringify(targetFields, null, 2)}

Please analyze the headers and suggest the best mapping.
Return a JSON object where the keys are the "System Field Keys" (e.g., "loadNumber") and the values are the matching "User CSV Header".
Only include mappings where you are confident.
If a system field has no matching header, do not include it in the JSON.

Example Response:
{
  "loadNumber": "Load #",
  "pickupDate": "Pick Date",
  "revenue": "Rate"
}

Return ONLY valid JSON.
`;

        const result = await this.callAI<Record<string, string>>(prompt, {
            temperature: 0.1,
            maxTokens: 1000,
            systemPrompt: 'You are an expert data analyst specializing in logistics data mapping. Return ONLY valid JSON.',
        });

        return result.data || {};
    }

    private getTargetFieldsForEntity(entityType: string): Record<string, string> {
        switch (entityType) {
            case 'loads':
                return {
                    loadNumber: 'Load ID / Number',
                    customerId: 'Customer / Broker Name',
                    pickupDate: 'Pickup Date',
                    deliveryDate: 'Delivery / Drop Date',
                    revenue: 'Rate / Revenue / Price',
                    driverPay: 'Driver Pay / Cost',
                    totalMiles: 'Total Miles / Distance',
                    emptyMiles: 'Empty / Deadhead Miles',
                    weight: 'Weight (lbs)',
                    pickupCity: 'Pickup City',
                    pickupState: 'Pickup State',
                    deliveryCity: 'Delivery City',
                    deliveryState: 'Delivery State',
                    driverId: 'Driver Name / ID',
                    truckId: 'Truck Number',
                    trailerId: 'Trailer Number',
                    notes: 'Notes / Instructions',
                    status: 'Status'
                };
            case 'drivers':
                return {
                    firstName: 'First Name',
                    lastName: 'Last Name',
                    email: 'Email',
                    phone: 'Phone Number',
                    driverNumber: 'Driver ID / Number',
                    licenseNumber: 'CDL Number',
                    hiringDate: 'Hire Date',
                    status: 'Status'
                };
            case 'trucks':
                return {
                    truckNumber: 'Truck Number / Unit ID',
                    make: 'Make',
                    model: 'Model',
                    year: 'Year',
                    vin: 'VIN',
                    licensePlate: 'Plate Number',
                    status: 'Status'
                };
            case 'trailers':
                return {
                    trailerNumber: 'Trailer Number / Unit ID',
                    make: 'Make',
                    model: 'Model',
                    year: 'Year',
                    vin: 'VIN',
                    licensePlate: 'Plate Number',
                    type: 'Type (Reefer, Dry Van, etc)'
                };
            case 'customers':
                return {
                    name: 'Customer / Company Name',
                    email: 'Email',
                    phone: 'Phone',
                    address: 'Address',
                    city: 'City',
                    state: 'State',
                    zip: 'Zip Code',
                    mcNumber: 'MC Number'
                };
            default:
                return {};
        }
    }
}
