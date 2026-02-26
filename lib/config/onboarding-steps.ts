/**
 * Central onboarding step definitions.
 * Used by OnboardingSetupWizard (full-page) and OnboardingGuide (dashboard widget).
 */

export interface OnboardingStep {
  id: string;
  order: number;
  label: string;
  description: string;
  longDescription: string;
  icon: string;
  entityType: string | null;
  dependencies: string[];
  importable: boolean;
  templateFields: string[];
  validation: {
    minCount?: number;
  };
  tips: string[];
  manualPath?: string;
  settingsPath?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'company-settings',
    order: 0,
    label: 'Company Settings',
    description: 'Verify your company info, MC number, and address.',
    longDescription:
      'Your company profile is the foundation of the system. Ensure your MC number, DOT number, company address, and contact information are correct. These details appear on invoices, settlements, rate confirmations, and compliance documents.',
    icon: 'Settings',
    entityType: null,
    dependencies: [],
    importable: false,
    templateFields: [],
    validation: {},
    tips: [
      'Your MC and DOT numbers were set during registration',
      'Update your address under Settings > Company',
      'Upload your company logo under Settings > Appearance',
    ],
    settingsPath: '/dashboard/settings',
  },
  {
    id: 'employees',
    order: 1,
    label: 'Dispatchers & Staff',
    description: 'Import dispatchers and office staff who will use the system.',
    longDescription:
      'Add your team members so they can log in and manage operations. Dispatchers need accounts before they can be assigned to loads. Import via CSV or add manually from the Settings page.',
    icon: 'UserCog',
    entityType: 'users',
    dependencies: ['company-settings'],
    importable: true,
    templateFields: ['email', 'firstName', 'lastName', 'role', 'phone', 'employeeNumber'],
    validation: { minCount: 0 },
    tips: [
      'Roles: DISPATCHER, ACCOUNTANT, HR, SAFETY, FLEET',
      'Users can change their password after first login',
      'Assign MC number access under user settings',
    ],
    manualPath: '/dashboard/settings/users',
  },
  {
    id: 'drivers',
    order: 2,
    label: 'Drivers',
    description: 'Import your driver roster with CDL and pay info.',
    longDescription:
      'Drivers are central to operations. Each imported driver gets a user account automatically. Import includes CDL info, pay rates, and compliance dates. Missing fields like email or license are auto-generated with placeholder values you can update later.',
    icon: 'Users',
    entityType: 'drivers',
    dependencies: ['company-settings'],
    importable: true,
    templateFields: [
      'firstName', 'lastName', 'email', 'phone', 'driverNumber',
      'licenseNumber', 'licenseState', 'licenseExpiry', 'medicalCardExpiry',
      'driverType', 'payRate', 'payType', 'hireDate',
    ],
    validation: { minCount: 1 },
    tips: [
      'Email and phone are auto-generated if missing',
      'Pay types: PER_MILE, PER_LOAD, PERCENTAGE, HOURLY',
      'Driver types: COMPANY_DRIVER, OWNER_OPERATOR, LEASE',
    ],
    manualPath: '/dashboard/drivers',
  },
  {
    id: 'trucks',
    order: 3,
    label: 'Trucks',
    description: 'Import your fleet with VIN, make, model, and plate info.',
    longDescription:
      'Your truck fleet. Import includes equipment details, registration, and inspection expiry dates. Trucks can be assigned to drivers after import. Missing make/model defaults to "Unknown" and can be updated later.',
    icon: 'Truck',
    entityType: 'trucks',
    dependencies: ['company-settings'],
    importable: true,
    templateFields: [
      'truckNumber', 'vin', 'make', 'model', 'year',
      'licensePlate', 'state', 'equipmentType', 'status',
      'registrationExpiry', 'insuranceExpiry', 'inspectionExpiry',
    ],
    validation: { minCount: 1 },
    tips: [
      'Truck number is the only required field',
      'Equipment types: DRY_VAN, REEFER, FLATBED, TANKER, STEP_DECK',
      'Expiry dates default to +1 year if missing',
    ],
    manualPath: '/dashboard/fleet',
  },
  {
    id: 'trailers',
    order: 4,
    label: 'Trailers',
    description: 'Import trailer inventory with type and registration info.',
    longDescription:
      'Your trailer fleet. Similar to trucks but with trailer-specific types. Trailers can be assigned to trucks or drivers after import.',
    icon: 'Container',
    entityType: 'trailers',
    dependencies: ['company-settings'],
    importable: true,
    templateFields: [
      'trailerNumber', 'vin', 'make', 'model', 'year',
      'trailerType', 'licensePlate', 'state', 'status',
      'registrationExpiry', 'insuranceExpiry', 'inspectionExpiry',
    ],
    validation: { minCount: 0 },
    tips: [
      'Trailer number is the only required field',
      'Trailer types: DRY_VAN, REEFER, FLATBED, TANK',
      'Assign trailers to trucks under fleet management',
    ],
    manualPath: '/dashboard/fleet',
  },
  {
    id: 'customers',
    order: 5,
    label: 'Customers / Brokers',
    description: 'Import your customer and broker list with billing info.',
    longDescription:
      'Customers are needed before you can create loads. Import brokers and direct customers with their billing details and payment terms. Customer type defaults to DIRECT if not specified.',
    icon: 'Building2',
    entityType: 'customers',
    dependencies: ['company-settings'],
    importable: true,
    templateFields: [
      'name', 'customerNumber', 'type', 'address', 'city',
      'state', 'zip', 'phone', 'email', 'paymentTerms',
    ],
    validation: { minCount: 1 },
    tips: [
      'Customer types: DIRECT, BROKER, 3PL, FREIGHT_FORWARDER',
      'Payment terms default to NET 30 days',
      'Credit limits can be set per customer for risk management',
    ],
    manualPath: '/dashboard/customers',
  },
  {
    id: 'loads',
    order: 6,
    label: 'Historical Loads',
    description: 'Import past loads for reporting and analytics.',
    longDescription:
      'Import historical loads for financial reporting and analytics. Loads are auto-linked to drivers, customers, trucks, and trailers by name matching. Missing references are auto-created. Historical imports set all loads to PAID status by default.',
    icon: 'Package',
    entityType: 'loads',
    dependencies: ['drivers', 'customers'],
    importable: true,
    templateFields: [
      'loadNumber', 'customerName', 'driverId', 'truckId',
      'pickupCity', 'pickupState', 'deliveryCity', 'deliveryState',
      'pickupDate', 'deliveryDate', 'revenue', 'driverPay',
      'totalMiles', 'status', 'loadType',
    ],
    validation: { minCount: 0 },
    tips: [
      'Loads imported as historical are set to PAID status',
      'Missing drivers and customers are auto-created on import',
      'Anomaly detection flags suspicious financial values',
    ],
    manualPath: '/dashboard/loads',
  },
];

/** Get the IDs of all steps that have importable entities */
export function getImportableStepIds(): string[] {
  return ONBOARDING_STEPS.filter((s) => s.importable).map((s) => s.id);
}

/** Get a step by its ID */
export function getOnboardingStep(id: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.id === id);
}

/** Check if all dependencies for a step are met based on entity counts */
export function areStepDependenciesMet(
  stepId: string,
  counts: Record<string, number>,
  companySettingsValid: boolean
): boolean {
  const step = getOnboardingStep(stepId);
  if (!step) return false;

  return step.dependencies.every((depId) => {
    if (depId === 'company-settings') return companySettingsValid;
    const depStep = getOnboardingStep(depId);
    if (!depStep?.entityType) return true;
    return (counts[depStep.entityType] ?? 0) > 0;
  });
}
