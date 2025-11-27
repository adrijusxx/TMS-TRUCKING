/**
 * Unit Tests for DetentionManager
 * 
 * Tests the critical detention calculation logic:
 * - Early Arrival (Clock starts at Appointment)
 * - Late Arrival (Clock starts at Arrival)
 * - Under 2 Hours (No Billing)
 * - Over 2 Hours (Billing triggers)
 * 
 * To run these tests, install Jest:
 *   npm install --save-dev jest @types/jest ts-jest
 * 
 * Then run: npx jest tests/DetentionManager.spec.ts
 */

import { DetentionManager, DetentionCheckResult } from '@/lib/managers/DetentionManager';
import { prisma } from '@/lib/prisma';
import { notifyDetentionDetected, notifyBillingHold } from '@/lib/notifications/triggers';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    loadStop: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    accessorialCharge: {
      create: jest.fn(),
    },
    load: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notifications/triggers', () => ({
  notifyDetentionDetected: jest.fn(),
  notifyBillingHold: jest.fn(),
}));

describe('DetentionManager', () => {
  let detentionManager: DetentionManager;
  const mockCompanyId = 'company-123';
  const mockLoadId = 'load-123';
  const mockStopId = 'stop-123';
  const mockCustomerId = 'customer-123';

  beforeEach(() => {
    detentionManager = new DetentionManager();
    jest.clearAllMocks();
  });

  describe('Early Arrival Scenario', () => {
    it('should start clock at appointment time when driver arrives early', async () => {
      // Setup: Driver arrives at 8:00 AM, appointment is 10:00 AM, departs at 1:00 PM
      // Expected: Clock starts at 10:00 AM, detention = 3 hours - 2 hours free = 1 hour
      const appointmentTime = new Date('2025-01-27T10:00:00Z');
      const arrivalTime = new Date('2025-01-27T08:00:00Z'); // 2 hours early
      const departureTime = new Date('2025-01-27T13:00:00Z'); // 3 hours after appointment

      (prisma.loadStop.findUnique as jest.Mock).mockResolvedValue({
        id: mockStopId,
        loadId: mockLoadId,
        companyId: mockCompanyId,
        earliestArrival: appointmentTime,
        actualArrival: arrivalTime,
        actualDeparture: departureTime,
        company: 'Test Warehouse',
        address: '123 Test St',
        load: {
          id: mockLoadId,
          companyId: mockCompanyId,
          loadNumber: 'LOAD-001',
          status: 'DELIVERED',
          customer: {
            id: mockCustomerId,
            name: 'Test Customer',
            detentionFreeTimeHours: 2,
            detentionRate: 50,
          },
          accessorialCharges: [],
        },
      });

      (prisma.loadStop.update as jest.Mock).mockResolvedValue({});
      (prisma.accessorialCharge.create as jest.Mock).mockResolvedValue({
        id: 'charge-123',
        amount: 50,
      });
      (prisma.load.update as jest.Mock).mockResolvedValue({});
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        loadNumber: 'LOAD-001',
      });

      const result = await detentionManager.checkDetentionOnDeparture(mockStopId);

      // Assertions
      expect(result.detentionDetected).toBe(true);
      expect(result.detentionHours).toBeCloseTo(1.0, 2); // 3 hours total - 2 hours free = 1 hour
      expect(result.driverLate).toBe(false);
      expect(result.clockStartReason).toBe('APPOINTMENT');
      expect(result.billableClockStart).toBe(appointmentTime.toISOString());

      // Verify clock started at appointment time (not arrival)
      const updateCall = (prisma.loadStop.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.detentionClockStart).toEqual(appointmentTime);
      expect(updateCall.data.billableDetentionMinutes).toBe(60); // 1 hour = 60 minutes

      // Verify charge was created
      expect(prisma.accessorialCharge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            chargeType: 'DETENTION',
            detentionHours: expect.closeTo(1.0, 2),
            amount: 50, // 1 hour * $50/hour
            status: 'PENDING',
          }),
        })
      );
    });
  });

  describe('Late Arrival Scenario', () => {
    it('should start clock at arrival time and flag as late when driver arrives late', async () => {
      // Setup: Appointment is 10:00 AM, driver arrives at 11:00 AM (late), departs at 2:00 PM
      // Expected: Clock starts at 11:00 AM, detention = 3 hours - 2 hours free = 1 hour
      // Expected: driverLate = true, billingHoldReason includes late warning
      const appointmentTime = new Date('2025-01-27T10:00:00Z');
      const arrivalTime = new Date('2025-01-27T11:00:00Z'); // 1 hour late
      const departureTime = new Date('2025-01-27T14:00:00Z'); // 3 hours after arrival

      (prisma.loadStop.findUnique as jest.Mock).mockResolvedValue({
        id: mockStopId,
        loadId: mockLoadId,
        companyId: mockCompanyId,
        earliestArrival: appointmentTime,
        actualArrival: arrivalTime,
        actualDeparture: departureTime,
        company: 'Test Warehouse',
        address: '123 Test St',
        load: {
          id: mockLoadId,
          companyId: mockCompanyId,
          loadNumber: 'LOAD-002',
          status: 'DELIVERED',
          customer: {
            id: mockCustomerId,
            name: 'Test Customer',
            detentionFreeTimeHours: 2,
            detentionRate: 50,
          },
          accessorialCharges: [],
        },
      });

      (prisma.loadStop.update as jest.Mock).mockResolvedValue({});
      (prisma.accessorialCharge.create as jest.Mock).mockResolvedValue({
        id: 'charge-123',
        amount: 50,
      });
      (prisma.load.update as jest.Mock).mockResolvedValue({});
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        loadNumber: 'LOAD-002',
      });

      const result = await detentionManager.checkDetentionOnDeparture(mockStopId);

      // Assertions
      expect(result.detentionDetected).toBe(true);
      expect(result.detentionHours).toBeCloseTo(1.0, 2); // 3 hours total - 2 hours free = 1 hour
      expect(result.driverLate).toBe(true); // CRITICAL: Should be flagged as late
      expect(result.clockStartReason).toBe('ARRIVAL_LATE');
      expect(result.billableClockStart).toBe(arrivalTime.toISOString());

      // Verify clock started at arrival time (not appointment)
      const updateCall = (prisma.loadStop.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.detentionClockStart).toEqual(arrivalTime);

      // Verify billing hold reason includes late warning
      const billingHoldCall = (prisma.load.update as jest.Mock).mock.calls[0][0];
      expect(billingHoldCall.data.billingHoldReason).toContain('DRIVER LATE');
      expect(billingHoldCall.data.billingHoldReason).toContain('at risk');

      // Verify notification includes late flag
      expect(notifyDetentionDetected).toHaveBeenCalledWith(
        expect.objectContaining({
          driverLate: true,
          requiresAttention: true,
        })
      );
    });
  });

  describe('Under 2 Hours Scenario', () => {
    it('should not create detention charge when total time is under free time threshold', async () => {
      // Setup: Driver arrives at 10:00 AM, appointment is 10:00 AM, departs at 11:30 AM
      // Expected: Total time = 1.5 hours, detention = 0 (under 2 hour free time)
      const appointmentTime = new Date('2025-01-27T10:00:00Z');
      const arrivalTime = new Date('2025-01-27T10:00:00Z'); // On time
      const departureTime = new Date('2025-01-27T11:30:00Z'); // 1.5 hours later

      (prisma.loadStop.findUnique as jest.Mock).mockResolvedValue({
        id: mockStopId,
        loadId: mockLoadId,
        companyId: mockCompanyId,
        earliestArrival: appointmentTime,
        actualArrival: arrivalTime,
        actualDeparture: departureTime,
        company: 'Test Warehouse',
        address: '123 Test St',
        load: {
          id: mockLoadId,
          companyId: mockCompanyId,
          loadNumber: 'LOAD-003',
          status: 'DELIVERED',
          customer: {
            id: mockCustomerId,
            name: 'Test Customer',
            detentionFreeTimeHours: 2,
            detentionRate: 50,
          },
          accessorialCharges: [],
        },
      });

      (prisma.loadStop.update as jest.Mock).mockResolvedValue({});

      const result = await detentionManager.checkDetentionOnDeparture(mockStopId);

      // Assertions
      expect(result.detentionDetected).toBe(false);
      expect(result.reason).toBe('Within free time threshold');
      expect(result.detentionHours).toBeUndefined();
      expect(result.billableDetentionMinutes).toBe(0);

      // Verify NO charge was created
      expect(prisma.accessorialCharge.create).not.toHaveBeenCalled();
      expect(notifyDetentionDetected).not.toHaveBeenCalled();

      // Verify LoadStop was still updated with calculation (for audit trail)
      expect(prisma.loadStop.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStopId },
          data: expect.objectContaining({
            billableDetentionMinutes: 0,
            detentionClockStart: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Over 2 Hours Scenario', () => {
    it('should create detention charge when total time exceeds free time threshold', async () => {
      // Setup: Driver arrives at 10:00 AM, appointment is 10:00 AM, departs at 1:00 PM
      // Expected: Total time = 3 hours, detention = 3 hours - 2 hours free = 1 hour
      const appointmentTime = new Date('2025-01-27T10:00:00Z');
      const arrivalTime = new Date('2025-01-27T10:00:00Z'); // On time
      const departureTime = new Date('2025-01-27T13:00:00Z'); // 3 hours later

      (prisma.loadStop.findUnique as jest.Mock).mockResolvedValue({
        id: mockStopId,
        loadId: mockLoadId,
        companyId: mockCompanyId,
        earliestArrival: appointmentTime,
        actualArrival: arrivalTime,
        actualDeparture: departureTime,
        company: 'Test Warehouse',
        address: '123 Test St',
        load: {
          id: mockLoadId,
          companyId: mockCompanyId,
          loadNumber: 'LOAD-004',
          status: 'DELIVERED',
          customer: {
            id: mockCustomerId,
            name: 'Test Customer',
            detentionFreeTimeHours: 2,
            detentionRate: 50,
          },
          accessorialCharges: [],
        },
      });

      (prisma.loadStop.update as jest.Mock).mockResolvedValue({});
      (prisma.accessorialCharge.create as jest.Mock).mockResolvedValue({
        id: 'charge-123',
        amount: 50,
        detentionHours: 1.0,
      });
      (prisma.load.update as jest.Mock).mockResolvedValue({});
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        loadNumber: 'LOAD-004',
      });

      const result = await detentionManager.checkDetentionOnDeparture(mockStopId);

      // Assertions
      expect(result.detentionDetected).toBe(true);
      expect(result.detentionHours).toBeCloseTo(1.0, 2); // 3 hours - 2 hours free = 1 hour
      expect(result.billableDetentionMinutes).toBe(60); // 1 hour = 60 minutes
      expect(result.billingHoldSet).toBe(true);
      expect(result.chargeId).toBe('charge-123');

      // Verify charge was created with correct amount
      expect(prisma.accessorialCharge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            chargeType: 'DETENTION',
            detentionHours: expect.closeTo(1.0, 2),
            detentionRate: 50,
            amount: 50, // 1 hour * $50/hour
            status: 'PENDING',
            description: expect.stringContaining('Detention: 1.00 hours'),
          }),
        })
      );

      // Verify billing hold was set
      expect(prisma.load.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLoadId },
          data: expect.objectContaining({
            isBillingHold: true,
            billingHoldReason: expect.stringContaining('Detention charge detected'),
          }),
        })
      );

      // Verify notification was sent
      expect(notifyDetentionDetected).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing appointment time (fallback to arrival)', async () => {
      // Setup: No appointment time, driver arrives at 10:00 AM, departs at 1:00 PM
      // Expected: Clock starts at arrival, detention = 3 hours - 2 hours free = 1 hour
      const arrivalTime = new Date('2025-01-27T10:00:00Z');
      const departureTime = new Date('2025-01-27T13:00:00Z');

      (prisma.loadStop.findUnique as jest.Mock).mockResolvedValue({
        id: mockStopId,
        loadId: mockLoadId,
        companyId: mockCompanyId,
        earliestArrival: null,
        latestArrival: null,
        actualArrival: arrivalTime,
        actualDeparture: departureTime,
        company: 'Test Warehouse',
        address: '123 Test St',
        load: {
          id: mockLoadId,
          companyId: mockCompanyId,
          loadNumber: 'LOAD-005',
          status: 'DELIVERED',
          customer: {
            id: mockCustomerId,
            name: 'Test Customer',
            detentionFreeTimeHours: 2,
            detentionRate: 50,
          },
          accessorialCharges: [],
        },
      });

      (prisma.loadStop.update as jest.Mock).mockResolvedValue({});
      (prisma.accessorialCharge.create as jest.Mock).mockResolvedValue({
        id: 'charge-123',
        amount: 50,
      });
      (prisma.load.update as jest.Mock).mockResolvedValue({});
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        loadNumber: 'LOAD-005',
      });

      const result = await detentionManager.checkDetentionOnDeparture(mockStopId);

      expect(result.detentionDetected).toBe(true);
      expect(result.clockStartReason).toBe('ARRIVAL_NO_APPOINTMENT');
      expect(result.billableClockStart).toBe(arrivalTime.toISOString());
    });

    it('should prevent duplicate charges if one already exists', async () => {
      const appointmentTime = new Date('2025-01-27T10:00:00Z');
      const arrivalTime = new Date('2025-01-27T10:00:00Z');
      const departureTime = new Date('2025-01-27T13:00:00Z');

      (prisma.loadStop.findUnique as jest.Mock).mockResolvedValue({
        id: mockStopId,
        loadId: mockLoadId,
        companyId: mockCompanyId,
        earliestArrival: appointmentTime,
        actualArrival: arrivalTime,
        actualDeparture: departureTime,
        company: 'Test Warehouse',
        address: '123 Test St',
        load: {
          id: mockLoadId,
          companyId: mockCompanyId,
          loadNumber: 'LOAD-006',
          status: 'DELIVERED',
          customer: {
            id: mockCustomerId,
            name: 'Test Customer',
            detentionFreeTimeHours: 2,
            detentionRate: 50,
          },
          accessorialCharges: [
            { id: 'existing-charge-123', chargeType: 'DETENTION', status: 'PENDING' },
          ],
        },
      });

      (prisma.loadStop.update as jest.Mock).mockResolvedValue({});

      const result = await detentionManager.checkDetentionOnDeparture(mockStopId);

      expect(result.detentionDetected).toBe(true);
      expect(result.existingCharge).toBe(true);
      expect(result.chargeId).toBe('existing-charge-123');
      expect(prisma.accessorialCharge.create).not.toHaveBeenCalled();
    });

    it('should handle missing arrival or departure time', async () => {
      (prisma.loadStop.findUnique as jest.Mock).mockResolvedValue({
        id: mockStopId,
        loadId: mockLoadId,
        actualArrival: null,
        actualDeparture: new Date('2025-01-27T13:00:00Z'),
        load: {
          customer: {},
          accessorialCharges: [],
        },
      });

      const result = await detentionManager.checkDetentionOnDeparture(mockStopId);

      expect(result.detentionDetected).toBe(false);
      expect(result.reason).toBe('Missing arrival or departure time');
      expect(prisma.accessorialCharge.create).not.toHaveBeenCalled();
    });
  });
});
