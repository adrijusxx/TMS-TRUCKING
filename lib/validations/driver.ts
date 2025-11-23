import { z } from 'zod';
import { PayType, DriverStatus, EmployeeStatus, AssignmentStatus, DispatchStatus, Gender, MaritalStatus, DriverType } from '@prisma/client';

export const createDriverSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  driverNumber: z.string().min(1, 'Driver number is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseState: z.string().length(2, 'State must be 2 characters'),
  licenseExpiry: z.string().or(z.date()),
  medicalCardExpiry: z.string().or(z.date()),
  drugTestDate: z.string().or(z.date()).optional(),
  backgroundCheck: z.string().or(z.date()).optional(),
  payType: z.nativeEnum(PayType),
  payRate: z.number().positive('Pay rate must be positive'),
  homeTerminal: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  mcNumberId: z.string().min(1, 'MC number is required'),
});

export const updateDriverSchema = createDriverSchema.partial().extend({
  status: z.nativeEnum(DriverStatus).optional(),
  employeeStatus: z.nativeEnum(EmployeeStatus).optional(),
  assignmentStatus: z.nativeEnum(AssignmentStatus).optional(),
  dispatchStatus: z.nativeEnum(DispatchStatus).optional(),
  currentTruckId: z.string().optional(),
  currentTrailerId: z.string().optional(),
  password: z.string().min(8).optional(),
  // Personal Information
  socialSecurityNumber: z.string().optional(),
  birthDate: z.string().or(z.date()).optional(),
  hireDate: z.string().or(z.date()).optional(),
  terminationDate: z.string().or(z.date()).optional(),
  tenure: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional(),
  localDriver: z.boolean().optional(),
  telegramNumber: z.string().optional(),
  thresholdAmount: z.number().optional(),
  // Compliance
  licenseIssueDate: z.string().or(z.date()).optional(),
  cdlExperience: z.string().optional(),
  restrictions: z.string().optional(),
  dlClass: z.string().optional(),
  driverType: z.nativeEnum(DriverType).optional(),
  endorsements: z.array(z.string()).optional(),
  driverFacingCamera: z.string().optional(),
  // Address
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  // Dispatch
  dispatchPreferences: z.string().optional(),
  // Assignments
  assignedDispatcherId: z.string().optional(),
  hrManagerId: z.string().optional(),
  safetyManagerId: z.string().optional(),
  mcNumberId: z.string().min(1, 'MC number is required').optional(),
  teamDriver: z.boolean().optional(),
  otherId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  emergencyContactAddress1: z.string().optional(),
  emergencyContactAddress2: z.string().optional(),
  emergencyContactCity: z.string().optional(),
  emergencyContactState: z.string().optional(),
  emergencyContactZip: z.string().optional(),
  emergencyContactCountry: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactEmail: z.string().optional(),
  // Pay
  driverTariff: z.string().optional(),
  payTo: z.string().optional(),
  warnings: z.string().optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

