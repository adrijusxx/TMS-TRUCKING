/**
 * Entity configuration for import functionality
 * Defines system fields for each entity type
 */

interface EntityConfig {
  label: string;
  fields: Array<{ key: string; label: string; required?: boolean; suggestedCsvHeaders?: string[] }>;
  exampleRow?: Record<string, string>;
  exampleFileUrl?: string;
}

const entityConfigs: Record<string, EntityConfig> = {
  trucks: {
    label: 'Trucks',
    fields: [
      { key: 'truckNumber', label: 'Truck/Unit Number *', required: true, suggestedCsvHeaders: ['Unit #', 'Unit number', 'Unit Number', 'Truck Number', 'truck_number', 'Truck', 'truck', 'Truck ID', 'Unit ID'] },
      { key: 'vin', label: 'VIN', suggestedCsvHeaders: ['VIN', 'vin', 'Serial Number', 'serial_number', 'Serial'] },
      { key: 'make', label: 'Make', suggestedCsvHeaders: ['Make', 'make', 'Manufacturer', 'Brand'] },
      { key: 'model', label: 'Model', suggestedCsvHeaders: ['Model', 'model'] },
      { key: 'year', label: 'Year', suggestedCsvHeaders: ['Year', 'year', 'Yr'] },
      { key: 'licensePlate', label: 'License Plate', suggestedCsvHeaders: ['License Plate', 'license_plate', 'Plate', 'Plate Number', 'Tag', 'Registration'] },
      { key: 'state', label: 'State', suggestedCsvHeaders: ['State', 'state', 'License State', 'Registration State'] },
      { key: 'equipmentType', label: 'Equipment Type', suggestedCsvHeaders: ['Equipment Type', 'equipment_type', 'Type'] },
      { key: 'registrationExpiry', label: 'Registration Expiry', suggestedCsvHeaders: ['Registration Expiry', 'registration_expiry', 'Reg Exp'] },
      { key: 'insuranceExpiry', label: 'Insurance Expiry', suggestedCsvHeaders: ['Insurance Expiry', 'insurance_expiry', 'Ins Exp'] },
      { key: 'inspectionExpiry', label: 'Inspection Expiry', suggestedCsvHeaders: ['Inspection Expiry', 'inspection_expiry', 'Insp Exp', 'Annual Inspection Expiry'] },
      { key: 'odometerReading', label: 'Odometer', suggestedCsvHeaders: ['Odometer', 'odometer', 'Mileage'] },
      { key: 'capacity', label: 'Capacity', suggestedCsvHeaders: ['Capacity', 'capacity', 'Max Weight'] },
      { key: 'status', label: 'Status', suggestedCsvHeaders: ['Status', 'status', 'Fleet Status'] },
      { key: 'driverId', label: 'Driver', suggestedCsvHeaders: ['Driver', 'driver', 'Assigned Driver', 'Operator'] },
      { key: 'mcNumberId', label: 'MC Number', suggestedCsvHeaders: ['MC Number', 'mc_number', 'MC'] },
    ],
    exampleRow: { truckNumber: 'T-101', vin: '1HGBH41JXMN109186', make: 'Freightliner', model: 'Cascadia', year: '2022', licensePlate: 'ABC1234', state: 'IL', equipmentType: 'DRY_VAN', status: 'AVAILABLE' },
  },
  trailers: {
    label: 'Trailers',
    fields: [
      { key: 'trailerNumber', label: 'Trailer/Unit Number *', required: true, suggestedCsvHeaders: ['Unit #', 'Unit number', 'Unit Number', 'Trailer Number', 'trailer_number', 'Trailer', 'trailer', 'Trailer ID', 'Unit ID'] },
      { key: 'vin', label: 'VIN', suggestedCsvHeaders: ['VIN', 'vin', 'Serial Number', 'serial_number'] },
      { key: 'make', label: 'Make', suggestedCsvHeaders: ['Make', 'make', 'Manufacturer', 'Brand'] },
      { key: 'model', label: 'Model', suggestedCsvHeaders: ['Model', 'model'] },
      { key: 'year', label: 'Year', suggestedCsvHeaders: ['Year', 'year', 'Yr'] },
      { key: 'trailerType', label: 'Trailer Type', suggestedCsvHeaders: ['Trailer Type', 'trailer_type', 'Type', 'Equipment Type'] },
      { key: 'licensePlate', label: 'License Plate', suggestedCsvHeaders: ['License Plate', 'license_plate', 'Plate', 'Tag', 'Registration'] },
      { key: 'state', label: 'State', suggestedCsvHeaders: ['State', 'state', 'Registration State'] },
      { key: 'registrationExpiry', label: 'Registration Expiry', suggestedCsvHeaders: ['Registration Expiry', 'registration_expiry', 'Reg Exp'] },
      { key: 'insuranceExpiry', label: 'Insurance Expiry', suggestedCsvHeaders: ['Insurance Expiry', 'insurance_expiry', 'Ins Exp'] },
      { key: 'inspectionExpiry', label: 'Inspection Expiry', suggestedCsvHeaders: ['Inspection Expiry', 'inspection_expiry', 'Insp Exp'] },
      { key: 'status', label: 'Status', suggestedCsvHeaders: ['Status', 'status', 'Fleet Status'] },
      { key: 'driverId', label: 'Driver', suggestedCsvHeaders: ['Driver', 'driver', 'Assigned Driver', 'Operator'] },
      { key: 'mcNumberId', label: 'MC Number', suggestedCsvHeaders: ['MC Number', 'mc_number', 'MC'] },
    ],
    exampleRow: { trailerNumber: 'TR-201', vin: '1JJV532D8KL456789', make: 'Utility', model: '4000D-X', year: '2021', trailerType: 'DRY_VAN', licensePlate: 'TRL5678', state: 'TX', status: 'AVAILABLE' },
  },
  loads: {
    label: 'Loads',
    fields: [
      { key: 'loadNumber', label: 'Load Number', required: true, suggestedCsvHeaders: ['Load ID', 'load_id', 'Load Number', 'Load #', 'Order #', 'Order Number'] },
      { key: 'shipmentId', label: 'Shipment ID', suggestedCsvHeaders: ['Ref', 'Ref#', 'Reference', 'PO', 'PO#', 'BOL', 'bol', 'Shipment ID', 'shipment_id'] },
      { key: 'tripId', label: 'Trip ID', suggestedCsvHeaders: ['Trip ID', 'trip_id', 'Trip', 'trip', 'Trip #'] },
      { key: 'customerId', label: 'Customer ID', required: true, suggestedCsvHeaders: ['Customer', 'customer', 'customer*', 'Broker', 'broker', 'Customer Name', 'Bill To', 'bill_to'] },
      { key: 'customerName', label: 'Customer Name', suggestedCsvHeaders: ['Customer', 'customer', 'Broker', 'Customer Name', 'Bill To'] },
      { key: 'driverId', label: 'Driver ID', suggestedCsvHeaders: ['Driver', 'driver', 'driver/carrier', 'Driver/Carrier', 'Assigned Driver', 'Driver Name', 'Operator'] },
      { key: 'coDriverId', label: 'Co-Driver ID', suggestedCsvHeaders: ['Co-Driver', 'co-driver', 'co_driver', 'Team Driver', 'Second Driver'] },
      { key: 'truckId', label: 'Truck ID', suggestedCsvHeaders: ['Truck', 'truck', 'Truck Number', 'Unit', 'Unit #', 'Truck ID'] },
      { key: 'trailerId', label: 'Trailer ID', suggestedCsvHeaders: ['Trailer', 'trailer', 'Trailer Number', 'Trailer ID', 'Trailer Unit'] },
      { key: 'dispatcherId', label: 'Dispatcher ID', suggestedCsvHeaders: ['Dispatcher', 'dispatcher', 'Dispatch', 'Agent', 'created_by', 'Created By'] },
      { key: 'mcNumberId', label: 'MC Number', suggestedCsvHeaders: ['MC Number', 'mc_number', 'MC', 'driver_mc', 'Driver MC'] },

      // Pickup Information
      { key: 'pickupLocation', label: 'Pickup Location', suggestedCsvHeaders: ['Pickup Location', 'pickup_location', 'Origin', 'origin'] },
      { key: 'pickupAddress', label: 'Pickup Address', suggestedCsvHeaders: ['Pickup Address', 'pickup_address', 'Origin Address'] },
      { key: 'pickupCity', label: 'Pickup City', suggestedCsvHeaders: ['Pickup City', 'pickup_city', 'Origin City'] },
      { key: 'pickupState', label: 'Pickup State', suggestedCsvHeaders: ['Pickup State', 'pickup_state', 'Origin State'] },
      { key: 'pickupZip', label: 'Pickup ZIP', suggestedCsvHeaders: ['Pickup Zip', 'pickup_zip', 'Origin Zip'] },
      { key: 'pickupCompany', label: 'Pickup Company', suggestedCsvHeaders: ['Pickup Company', 'pickup_company', 'Shipper'] },
      { key: 'pickupDate', label: 'Pickup Date', suggestedCsvHeaders: ['Pickup Date', 'pickup_date', 'PU Date', 'pu_date', 'PU date', 'pickup_time', 'Pickup Time', 'pickup_appointment_time'] },
      { key: 'pickupContact', label: 'Pickup Contact', suggestedCsvHeaders: ['Pickup Contact', 'Pickup Name', 'Origin Contact'] },
      { key: 'pickupPhone', label: 'Pickup Phone', suggestedCsvHeaders: ['Pickup Phone', 'Origin Phone'] },

      // Delivery Information
      { key: 'deliveryLocation', label: 'Delivery Location', suggestedCsvHeaders: ['Delivery Location', 'delivery_location', 'Destination', 'destination'] },
      { key: 'deliveryAddress', label: 'Delivery Address', suggestedCsvHeaders: ['Delivery Address', 'delivery_address', 'Destination Address'] },
      { key: 'deliveryCity', label: 'Delivery City', suggestedCsvHeaders: ['Delivery City', 'delivery_city', 'Destination City'] },
      { key: 'deliveryState', label: 'Delivery State', suggestedCsvHeaders: ['Delivery State', 'delivery_state', 'Destination State'] },
      { key: 'deliveryZip', label: 'Delivery ZIP', suggestedCsvHeaders: ['Delivery Zip', 'delivery_zip', 'Destination Zip'] },
      { key: 'deliveryCompany', label: 'Delivery Company', suggestedCsvHeaders: ['Delivery Company', 'delivery_company', 'Consignee'] },
      { key: 'deliveryDate', label: 'Delivery Date', suggestedCsvHeaders: ['Delivery Date', 'delivery_date', 'Del Date', 'del_date', 'DEL date', 'delivery_time', 'Delivery Time', 'delivery_appointment_time'] },
      { key: 'deliveryContact', label: 'Delivery Contact', suggestedCsvHeaders: ['Delivery Contact', 'Delivery Name', 'Destination Contact'] },
      { key: 'deliveryPhone', label: 'Delivery Phone', suggestedCsvHeaders: ['Delivery Phone', 'Destination Phone'] },

      // Status & Type
      { key: 'status', label: 'Status', suggestedCsvHeaders: ['Status', 'status', 'Load Status', 'load_status'] },
      { key: 'loadType', label: 'Load Type', suggestedCsvHeaders: ['Load Type', 'load_type', 'Type', 'Size'] },
      { key: 'equipmentType', label: 'Equipment Type', suggestedCsvHeaders: ['Equipment', 'equipment', 'Trailer Type', 'equipment_types', 'Equipment Types'] },

      // Load Specifications
      { key: 'weight', label: 'Weight', suggestedCsvHeaders: ['Weight', 'weight', 'Lbs', 'lbs'] },
      { key: 'pieces', label: 'Pieces', suggestedCsvHeaders: ['Pieces', 'pieces', 'Pcs', 'pcs', 'Count'] },
      { key: 'pallets', label: 'Pallets', suggestedCsvHeaders: ['Pallets', 'pallets', 'Plts', 'plts'] },
      { key: 'commodity', label: 'Commodity', suggestedCsvHeaders: ['Commodity', 'commodity', 'Cargo'] },
      { key: 'temperature', label: 'Temperature', suggestedCsvHeaders: ['Temperature', 'temperature', 'Temp', 'temp'] },
      { key: 'hazmat', label: 'Hazmat', suggestedCsvHeaders: ['Hazmat', 'hazardous', 'Hazmat?'] },
      { key: 'hazmatClass', label: 'Hazmat Class', suggestedCsvHeaders: ['Hazmat Class', 'hazard_class'] },

      // Financial
      { key: 'revenue', label: 'Revenue', suggestedCsvHeaders: ['Revenue', 'revenue', 'Total Amount', 'Gross', 'Total Pay', 'total_pay', 'Load Pay', 'load_pay'] },
      { key: 'driverPay', label: 'Driver Pay', suggestedCsvHeaders: ['Driver Pay', 'driver_pay', 'Carrier Pay'] },
      { key: 'fuelAdvance', label: 'Fuel Advance', suggestedCsvHeaders: ['Fuel Advance', 'fuel_advance', 'Advance'] },
      { key: 'expenses', label: 'Expenses', suggestedCsvHeaders: ['Expenses', 'expenses', 'Costs', 'Tolls'] },
      { key: 'serviceFee', label: 'Service Fee', suggestedCsvHeaders: ['Service Fee', 'service_fee', 'Fee'] },

      // Distances
      { key: 'totalMiles', label: 'Total Miles', suggestedCsvHeaders: ['Total Miles', 'total_miles', 'Miles', 'Distance'] },
      { key: 'loadedMiles', label: 'Loaded Miles', suggestedCsvHeaders: ['Loaded Miles', 'loaded_miles', 'mile', 'Mile'] },
      { key: 'emptyMiles', label: 'Empty Miles', suggestedCsvHeaders: ['Empty Miles', 'empty_miles', 'empty_mile', 'Empty Mile', 'Deadhead'] },
      { key: 'actualMiles', label: 'Actual Miles', suggestedCsvHeaders: ['Actual Miles', 'GPS Miles'] },
      { key: 'revenuePerMile', label: 'RPM', suggestedCsvHeaders: ['Revenue Per Mile', 'revenue_per_mile', 'RPM', 'Rate Per Mile'] },

      // Notes & Tracking
      { key: 'dispatchNotes', label: 'Dispatch Notes', suggestedCsvHeaders: ['Dispatch Notes', 'Notes', 'Instructions', 'Comments'] },
      { key: 'driverNotes', label: 'Driver Notes', suggestedCsvHeaders: ['Driver Notes', 'driver_notes', 'Driver Info'] },
      { key: 'lastNote', label: 'Last Note', suggestedCsvHeaders: ['Last Note', 'last_note', 'Note'] },
      { key: 'onTimeDelivery', label: 'On Time Delivery', suggestedCsvHeaders: ['On Time Delivery', 'on_time_delivery', 'OnTime', 'OTD'] },
      { key: 'lastUpdate', label: 'Last Update', suggestedCsvHeaders: ['Last Update', 'last_update', 'Updated'] },
      { key: 'stopsCount', label: 'Stops Count', suggestedCsvHeaders: ['Stops Count', 'stops_count', 'Stops', 'stops'] },
    ],
    exampleRow: { loadNumber: 'L-1001', customerName: 'ABC Logistics', driverId: 'John Smith', pickupCity: 'Chicago', pickupState: 'IL', pickupDate: '2025-01-15', deliveryCity: 'Dallas', deliveryState: 'TX', deliveryDate: '2025-01-17', revenue: '3500', driverPay: '1750', totalMiles: '920', status: 'DELIVERED', loadType: 'FTL' },
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
    exampleRow: { name: 'ABC Logistics', customerNumber: 'C-001', type: 'BROKER', city: 'Chicago', state: 'IL', zip: '60601', phone: '312-555-0100', email: 'billing@abclogistics.com', paymentTerms: 'NET30' },
  },
  drivers: {
    label: 'Drivers',
    fields: [
      { key: 'firstName', label: 'First Name', required: true, suggestedCsvHeaders: ['First Name', 'first_name', 'FirstName'] },
      { key: 'lastName', label: 'Last Name', required: true, suggestedCsvHeaders: ['Last Name', 'last_name', 'LastName'] },
      { key: 'email', label: 'Email', required: true },
      { key: 'phone', label: 'Phone', suggestedCsvHeaders: ['Phone', 'phone', 'contact_number', 'Contact Number'] },
      { key: 'driverNumber', label: 'Driver Phone Number', suggestedCsvHeaders: ['Driver Phone Number', 'Driver Number', 'driver_number', 'Driver ID', 'driver_id', 'contact_number', 'Contact Number'] },
      { key: 'licenseNumber', label: 'License Number' },
      { key: 'licenseState', label: 'License State' },
      { key: 'licenseExpiry', label: 'License Expiry', suggestedCsvHeaders: ['License Expiry', 'license_expiry', 'CDL Expiry'] },
      { key: 'medicalCardExpiry', label: 'Medical Card Expiry', suggestedCsvHeaders: ['Medical Card Expiry', 'medical_card_expiry', 'Medical Expiry'] },
      { key: 'hireDate', label: 'Hire Date' },
      { key: 'driverType', label: 'Driver Type', suggestedCsvHeaders: ['Driver Type', 'driver_type', 'Type', 'type'] },
      { key: 'mcNumber', label: 'MC Number', suggestedCsvHeaders: ['MC Number', 'mc_number', 'MC'] },
      { key: 'status', label: 'Status', suggestedCsvHeaders: ['Status', 'status', 'Driver Status', 'driver_status'] },
      { key: 'assignmentStatus', label: 'Assignment Status', suggestedCsvHeaders: ['Assignment Status', 'assignment_status'] },
      { key: 'dispatchStatus', label: 'Dispatch Status', suggestedCsvHeaders: ['Dispatch Status', 'dispatch_status'] },
      { key: 'truck', label: 'Truck', suggestedCsvHeaders: ['Truck', 'truck', 'Truck Number', 'truck_number', 'Unit'] },
      { key: 'trailer', label: 'Trailer', suggestedCsvHeaders: ['Trailer', 'trailer', 'Trailer Number', 'trailer_number'] },
      { key: 'payRate', label: 'Pay Rate', suggestedCsvHeaders: ['Pay Rate', 'pay_rate', 'Rate'] },
      { key: 'payType', label: 'Pay Type', suggestedCsvHeaders: ['Pay Type', 'pay_type'] },
      { key: 'payTo', label: 'Pay To', suggestedCsvHeaders: ['Pay To', 'pay_to', 'Payee'] },
      { key: 'driverTariff', label: 'Driver Tariff', suggestedCsvHeaders: ['Driver Tariff', 'driver_tariff', 'Tariff'] },
      { key: 'teamDriver', label: 'Team Driver', suggestedCsvHeaders: ['Team Driver', 'team_driver', 'Team'] },
      { key: 'notes', label: 'Notes', suggestedCsvHeaders: ['Notes', 'notes', 'Note', 'note'] },
      { key: 'warnings', label: 'Warnings', suggestedCsvHeaders: ['Warnings', 'warnings'] },
    ],
    exampleRow: { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', phone: '312-555-0101', driverNumber: 'D-001', licenseNumber: 'D400-1234-5678', licenseState: 'IL', driverType: 'COMPANY_DRIVER', status: 'AVAILABLE', payRate: '0.65', payType: 'PER_MILE' },
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
    exampleRow: { invoiceNumber: 'INV-1001', customerId: 'ABC Logistics', invoiceDate: '2025-01-20', dueDate: '2025-02-19', total: '3500', status: 'PENDING' },
  },
  users: {
    label: 'Users',
    fields: [
      { key: 'email', label: 'Email', required: true, suggestedCsvHeaders: ['Email', 'email', 'Email Address', 'email_address', 'E-mail', 'e-mail'] },
      { key: 'firstName', label: 'First Name', required: true, suggestedCsvHeaders: ['First Name', 'first_name', 'FirstName', 'firstName', 'First', 'FName', 'fname'] },
      { key: 'lastName', label: 'Last Name', required: true, suggestedCsvHeaders: ['Last Name', 'last_name', 'LastName', 'lastName', 'Last', 'LName', 'lname', 'Surname'] },
      { key: 'role', label: 'Role', required: true, suggestedCsvHeaders: ['Role', 'role', 'User Role', 'user_role', 'Position', 'Job Title', 'title'] },
      { key: 'phone', label: 'Phone', suggestedCsvHeaders: ['Phone', 'phone', 'phone_number', 'Phone Number', 'PhoneNumber', 'Mobile', 'Cell', 'Contact'] },
      { key: 'password', label: 'Password', suggestedCsvHeaders: ['Password', 'password', 'Pass', 'pass'] },
      { key: 'isActive', label: 'Status', suggestedCsvHeaders: ['Status', 'status', 'employee_status', 'Employee Status', 'Active', 'Is Active', 'isActive'] },
      { key: 'employeeNumber', label: 'Employee Number', suggestedCsvHeaders: ['Employee Number', 'employee_number', 'Emp Number', 'emp_number', 'login', 'Login', 'Username', 'username'] },
      { key: 'nickname', label: 'Nickname', suggestedCsvHeaders: ['Nickname', 'nickname', 'Display Name', 'display_name', 'Preferred Name', 'preferred_name', 'Nick'] },
      { key: 'tags', label: 'Tags', suggestedCsvHeaders: ['Tags', 'tags', 'Labels', 'labels', 'Categories', 'categories'] },
      { key: 'notes', label: 'Notes', suggestedCsvHeaders: ['Notes', 'notes', 'Comments', 'comments', 'Description', 'description'] },
    ],
    exampleRow: { email: 'jane@company.com', firstName: 'Jane', lastName: 'Doe', role: 'DISPATCHER', phone: '312-555-0102', employeeNumber: 'EMP-001' },
  },
};

export function getEntityConfig(entityType: string): EntityConfig | null {
  return entityConfigs[entityType] || null;
}

