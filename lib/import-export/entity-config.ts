/**
 * Entity configuration for import functionality
 * Defines system fields for each entity type
 */

interface EntityConfig {
  label: string;
  fields: Array<{ key: string; label: string; required?: boolean }>;
  exampleFileUrl?: string;
}

const entityConfigs: Record<string, EntityConfig> = {
  trucks: {
    label: 'Trucks',
    fields: [
      // Required Fields
      { key: 'unit_number', label: 'Unit Number *', required: true },
      { key: 'vin', label: 'VIN *', required: true },
      
      // Vehicle Details
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'year', label: 'Year' },
      
      // License & Registration
      { key: 'plate_number', label: 'Plate Number' },
      { key: 'state', label: 'License State' },
      { key: 'registration_expiry_date', label: 'Registration Expiry Date' },
      
      // Inspection & Insurance
      { key: 'annual_inspection_expiry_date', label: 'Annual Inspection Expiry Date' },
      { key: 'insurance_expiry_date', label: 'Insurance Expiry Date' },
      
      // MC Number & Ownership
      { key: 'mc_number', label: 'MC Number' },
      { key: 'ownership', label: 'Ownership' },
      { key: 'owner_name', label: 'Owner Name' },
      
      // Assignments
      { key: 'operator_(driver)', label: 'Operator (Driver)' },
      { key: 'trailer', label: 'Trailer' },
      
      // Status
      { key: 'status', label: 'Status' },
      { key: 'fleet_status', label: 'Fleet Status' },
      
      // Additional
      { key: 'odometer', label: 'Odometer' },
      { key: 'tags', label: 'Tags' },
      { key: 'notes', label: 'Notes' },
      { key: 'toll_tag_number', label: 'Toll Tag Number' },
      { key: 'fuel_card', label: 'Fuel Card' },
      { key: 'warnings', label: 'Warnings' },
    ],
  },
  trailers: {
    label: 'Trailers',
    fields: [
      // Required Fields
      { key: 'unit_number', label: 'Unit Number *', required: true },
      { key: 'make', label: 'Make *', required: true },
      { key: 'model', label: 'Model *', required: true },
      
      // Vehicle Details
      { key: 'vin', label: 'VIN' },
      { key: 'year', label: 'Year' },
      { key: 'type', label: 'Type' },
      
      // License & Registration
      { key: 'plate_number', label: 'Plate Number' },
      { key: 'state', label: 'State' },
      { key: 'registration_expiry_date', label: 'Registration Expiry Date' },
      
      // MC Number & Ownership
      { key: 'mc_number', label: 'MC Number' },
      { key: 'ownership', label: 'Ownership' },
      { key: 'owner_name', label: 'Owner Name' },
      
      // Assignments
      { key: 'assigned_truck', label: 'Assigned Truck' },
      { key: 'operator_(driver)', label: 'Operator (Driver)' },
      
      // Status
      { key: 'status', label: 'Status' },
      { key: 'fleet_status', label: 'Fleet Status' },
      
      // Inspection & Insurance
      { key: 'annual_inspection_expiry_date', label: 'Annual Inspection Expiry Date' },
      { key: 'insurance_expiry_date', label: 'Insurance Expiry Date' },
      
      // Additional
      { key: 'tags', label: 'Tags' },
    ],
  },
  loads: {
    label: 'Loads',
    fields: [
      { key: 'loadNumber', label: 'Load Number', required: true },
      { key: 'shipmentId', label: 'Shipment ID' },
      { key: 'tripId', label: 'Trip ID' },
      { key: 'customerId', label: 'Customer ID', required: true },
      { key: 'driverId', label: 'Driver ID' },
      { key: 'driverCarrier', label: 'Driver/Carrier' },
      { key: 'driverMc', label: 'Driver MC' },
      { key: 'coDriverId', label: 'Co-Driver ID' },
      { key: 'truckId', label: 'Truck ID' },
      { key: 'trailerId', label: 'Trailer ID' },
      { key: 'mcNumber', label: 'MC Number' },
      { key: 'dispatcherId', label: 'Dispatcher ID' },
      { key: 'createdById', label: 'Created By' },
      { key: 'createdDate', label: 'Created Date' },
      { key: 'pickupLocation', label: 'Pickup Location' },
      { key: 'pickupAddress', label: 'Pickup Address' },
      { key: 'pickupCity', label: 'Pickup City' },
      { key: 'pickupState', label: 'Pickup State' },
      { key: 'pickupZip', label: 'Pickup ZIP' },
      { key: 'pickupCompany', label: 'Pickup Company' },
      { key: 'pickupDate', label: 'Pickup Date' },
      { key: 'pickupTimeStart', label: 'Pickup Time' },
      { key: 'pickupTimeEnd', label: 'Pickup Time End' },
      { key: 'pickupAppointmentTime', label: 'Pickup Appointment Time' },
      { key: 'puDate', label: 'PU Date' },
      { key: 'deliveryLocation', label: 'Delivery Location' },
      { key: 'deliveryAddress', label: 'Delivery Address' },
      { key: 'deliveryCity', label: 'Delivery City' },
      { key: 'deliveryState', label: 'Delivery State' },
      { key: 'deliveryZip', label: 'Delivery ZIP' },
      { key: 'deliveryCompany', label: 'Delivery Company' },
      { key: 'deliveryDate', label: 'Delivery Date' },
      { key: 'deliveryTimeStart', label: 'Delivery Time' },
      { key: 'deliveryTimeEnd', label: 'Delivery Time End' },
      { key: 'deliveryAppointmentTime', label: 'Delivery Appointment Time' },
      { key: 'delDate', label: 'DEL Date' },
      { key: 'status', label: 'Status' },
      { key: 'loadType', label: 'Load Type' },
      { key: 'equipmentType', label: 'Equipment Type' },
      { key: 'weight', label: 'Weight' },
      { key: 'pieces', label: 'Pieces' },
      { key: 'commodity', label: 'Commodity' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'loadPay', label: 'Load Pay' },
      { key: 'driverPay', label: 'Driver Pay' },
      { key: 'totalPay', label: 'Total Pay' },
      { key: 'revenuePerMile', label: 'Revenue Per Mile' },
      { key: 'totalMiles', label: 'Total Miles' },
      { key: 'loadedMiles', label: 'Loaded Miles' },
      { key: 'emptyMiles', label: 'Empty Miles' },
      { key: 'mile', label: 'Mile' },
      { key: 'emptyMile', label: 'Empty Mile' },
      { key: 'lastNote', label: 'Last Note' },
      { key: 'onTimeDelivery', label: 'On Time Delivery' },
      { key: 'lastUpdate', label: 'Last Update' },
      { key: 'stopsCount', label: 'Stops Count' },
      { key: 'dispatchNotes', label: 'Dispatch Notes' },
    ],
  },
  customers: {
    label: 'Customers',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'customerNumber', label: 'Customer Number' },
      { key: 'type', label: 'Type' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'zip', label: 'ZIP' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'paymentTerms', label: 'Payment Terms' },
    ],
  },
  drivers: {
    label: 'Drivers',
    fields: [
      { key: 'firstName', label: 'First Name', required: true },
      { key: 'lastName', label: 'Last Name', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'driverNumber', label: 'Driver Number' },
      { key: 'licenseNumber', label: 'License Number' },
      { key: 'licenseState', label: 'License State' },
      { key: 'licenseExpiry', label: 'License Expiry' },
      { key: 'hireDate', label: 'Hire Date' },
      { key: 'status', label: 'Status' },
    ],
  },
  invoices: {
    label: 'Invoices',
    fields: [
      { key: 'invoiceNumber', label: 'Invoice Number', required: true },
      { key: 'customerId', label: 'Customer ID', required: true },
      { key: 'invoiceDate', label: 'Invoice Date', required: true },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'total', label: 'Total', required: true },
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Notes' },
    ],
  },
};

export function getEntityConfig(entityType: string): EntityConfig | null {
  return entityConfigs[entityType] || null;
}

