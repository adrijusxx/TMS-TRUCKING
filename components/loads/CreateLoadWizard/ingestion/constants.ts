/**
 * Field constants for Step1IntelligentIngestion
 */

// Field categories for display
export const CRITICAL_FIELDS = ['loadNumber', 'customerName', 'revenue', 'weight'];
export const IMPORTANT_FIELDS = [
  'pickupAddress',
  'pickupCity',
  'pickupState',
  'pickupDate',
  'deliveryAddress',
  'deliveryCity',
  'deliveryState',
  'deliveryDate',
];
export const DETAIL_FIELDS = [
  'pieces',
  'commodity',
  'pallets',
  'temperature',
  'totalMiles',
  'equipmentType',
  'loadType',
  'pickupContact',
  'pickupPhone',
  'deliveryContact',
  'deliveryPhone',
  'dispatchNotes',
];

// Display name mapping
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  loadNumber: 'Load Number',
  customerName: 'Customer/Broker',
  revenue: 'Revenue',
  weight: 'Weight',
  pickupAddress: 'Pickup Address',
  pickupCity: 'Pickup City',
  pickupState: 'Pickup State',
  pickupDate: 'Pickup Date',
  deliveryAddress: 'Delivery Address',
  deliveryCity: 'Delivery City',
  deliveryState: 'Delivery State',
  deliveryDate: 'Delivery Date',
  pieces: 'Pieces',
  commodity: 'Commodity',
  pallets: 'Pallets',
  temperature: 'Temperature',
  totalMiles: 'Total Miles',
  equipmentType: 'Equipment Type',
  loadType: 'Load Type',
  pickupContact: 'Pickup Contact',
  pickupPhone: 'Pickup Phone',
  deliveryContact: 'Delivery Contact',
  deliveryPhone: 'Delivery Phone',
  dispatchNotes: 'Notes',
};

export function getFieldDisplayName(field: string): string {
  return FIELD_DISPLAY_NAMES[field] || field;
}





