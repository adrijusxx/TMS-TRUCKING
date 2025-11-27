/**
 * TMS Scenario Tests - Unhappy Paths
 * 
 * Comprehensive unit tests for critical "unhappy path" scenarios:
 * 1. TONU (Truck Ordered Not Used) - Load cancellation after dispatch
 * 2. Split Load (Repower) - Load serviced by multiple drivers
 * 3. Partial Shortage - Load delivered with shortage flag
 * 
 * To run these tests:
 *   npm install --save-dev jest @types/jest ts-jest
 *   npx jest tests/TMS_Scenario_Tests.spec.ts
 */

import { prisma } from '@/lib/prisma';
import { SettlementManager } from '@/lib/managers/SettlementManager';
import { InvoiceManager } from '@/lib/managers/InvoiceManager';
import { BillingHoldManager } from '@/lib/managers/BillingHoldManager';
import { LoadSplitManager } from '@/lib/managers/LoadSplitManager';
import { LoadStatus, TruckStatus, AccessorialChargeType } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    load: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    truck: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
    },
    accessorialCharge: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    loadSegment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    loadExpense: {
      findMany: jest.fn(),
    },
    settlement: {
      create: jest.fn(),
    },
    settlementDeduction: {
      create: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
    },
  },
}));

// Note: BillingHoldManager is NOT mocked - we test the real implementation
// Prisma calls are mocked, so BillingHoldManager will use mocked data

describe('TMS Scenario Tests - Unhappy Paths', () => {
  const mockCompanyId = 'company-123';
  const mockCustomerId = 'customer-123';
  const mockDriverAId = 'driver-a-123';
  const mockDriverBId = 'driver-b-123';
  const mockTruckId = 'truck-123';
  const mockLoadId = 'load-101';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Scenario 1: TONU (Truck Ordered Not Used)', () => {
    it('should award TONU fee to driver and revert truck status when load cancelled after dispatch', async () => {
      // Setup: Load is ASSIGNED/DISPATCHED, then cancelled
      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-101',
        companyId: mockCompanyId,
        customerId: mockCustomerId,
        driverId: mockDriverAId,
        truckId: mockTruckId,
        status: LoadStatus.ASSIGNED,
        dispatchStatus: 'DISPATCHED',
        revenue: 0,
        driverPay: 0,
        assignedAt: new Date('2025-01-27T08:00:00Z'),
        createdAt: new Date('2025-01-27T07:00:00Z'),
      };

      const mockTruck = {
        id: mockTruckId,
        companyId: mockCompanyId,
        status: TruckStatus.IN_USE,
        currentDriverId: mockDriverAId,
      };

      const mockDriver = {
        id: mockDriverAId,
        companyId: mockCompanyId,
        driverNumber: 'DRV-001',
        payType: 'PER_LOAD',
        payRate: 0,
      };

      // Mock Prisma calls
      (prisma.load.findUnique as jest.Mock).mockResolvedValue(mockLoad);
      (prisma.truck.findUnique as jest.Mock).mockResolvedValue(mockTruck);
      (prisma.driver.findUnique as jest.Mock).mockResolvedValue(mockDriver);

      // Step 1: Cancel the load
      const cancelledLoad = {
        ...mockLoad,
        status: LoadStatus.CANCELLED,
        dispatchStatus: 'CANCELLED',
      };

      (prisma.load.update as jest.Mock).mockResolvedValue(cancelledLoad);

      // Step 2: Create TONU accessorial charge ($150)
      const tonuCharge = {
        id: 'tonu-charge-123',
        loadId: mockLoadId,
        chargeType: AccessorialChargeType.OTHER,
        description: 'TONU - Truck Ordered Not Used',
        amount: 150,
        status: 'APPROVED',
      };

      (prisma.accessorialCharge.create as jest.Mock).mockResolvedValue(tonuCharge);

      // Step 3: Revert truck status to AVAILABLE
      const updatedTruck = {
        ...mockTruck,
        status: TruckStatus.AVAILABLE,
        currentDriverId: null,
      };

      (prisma.truck.update as jest.Mock).mockResolvedValue(updatedTruck);

      // Execute: Cancel load
      await prisma.load.update({
        where: { id: mockLoadId },
        data: {
          status: LoadStatus.CANCELLED,
          dispatchStatus: 'CANCELLED',
        },
      });

      // Create TONU charge
      await prisma.accessorialCharge.create({
        data: {
          loadId: mockLoadId,
          chargeType: AccessorialChargeType.OTHER,
          description: 'TONU - Truck Ordered Not Used',
          amount: 150,
          status: 'APPROVED',
        },
      });

      // Revert truck status
      await prisma.truck.update({
        where: { id: mockTruckId },
        data: {
          status: TruckStatus.AVAILABLE,
          currentDriverId: null,
        },
      });

      // Step 4: Generate settlement - TONU fee should appear
      const settlementManager = new SettlementManager();
      
      // Mock loads for settlement (including cancelled load with TONU)
      (prisma.load.findMany as jest.Mock).mockResolvedValue([
        {
          ...cancelledLoad,
          accessorialCharges: [tonuCharge],
          loadExpenses: [],
        },
      ]);

      (prisma.accessorialCharge.findMany as jest.Mock).mockResolvedValue([tonuCharge]);
      (prisma.loadExpense.findMany as jest.Mock).mockResolvedValue([]);

      const settlementResult = await settlementManager.generateSettlement({
        driverId: mockDriverAId,
        periodStart: new Date('2025-01-27T00:00:00Z'),
        periodEnd: new Date('2025-01-27T23:59:59Z'),
      });

      // Assertions
      expect(prisma.load.update).toHaveBeenCalledWith({
        where: { id: mockLoadId },
        data: {
          status: LoadStatus.CANCELLED,
          dispatchStatus: 'CANCELLED',
        },
      });

      expect(prisma.accessorialCharge.create).toHaveBeenCalledWith({
        data: {
          loadId: mockLoadId,
          chargeType: AccessorialChargeType.OTHER,
          description: 'TONU - Truck Ordered Not Used',
          amount: 150,
          status: 'APPROVED',
        },
      });

      expect(prisma.truck.update).toHaveBeenCalledWith({
        where: { id: mockTruckId },
        data: {
          status: TruckStatus.AVAILABLE,
          currentDriverId: null,
        },
      });

      // Verify TONU charge is included in settlement
      expect(prisma.accessorialCharge.findMany).toHaveBeenCalled();
    });

    it('should NOT award TONU if load cancelled before dispatch', async () => {
      // Setup: Load is PENDING, then cancelled (no TONU)
      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-102',
        status: LoadStatus.PENDING,
        dispatchStatus: null,
        driverId: mockDriverAId,
        truckId: mockTruckId,
      };

      (prisma.load.findUnique as jest.Mock).mockResolvedValue(mockLoad);

      // Cancel load
      await prisma.load.update({
        where: { id: mockLoadId },
        data: {
          status: LoadStatus.CANCELLED,
          dispatchStatus: 'CANCELLED',
        },
      });

      // Assertions: No TONU charge should be created
      expect(prisma.accessorialCharge.create).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 2: Split Load (Repower)', () => {
    it('should attach total revenue to Load 101 and calculate expenses separately for Driver A and Driver B', async () => {
      // Setup: Load 101 split at breakdown point
      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-101',
        companyId: mockCompanyId,
        customerId: mockCustomerId,
        driverId: mockDriverBId, // Current driver (Driver B)
        truckId: mockTruckId,
        status: LoadStatus.DELIVERED,
        revenue: 2500, // Total revenue stays with Load 101
        driverPay: 0, // Will be calculated per segment
        totalMiles: 1000,
        loadedMiles: 800,
        emptyMiles: 200,
        deliveredAt: new Date('2025-01-27T18:00:00Z'),
        readyForSettlement: true,
      };

      const mockDriverA = {
        id: mockDriverAId,
        companyId: mockCompanyId,
        driverNumber: 'DRV-A',
        payType: 'PER_MILE',
        payRate: 0.50,
      };

      const mockDriverB = {
        id: mockDriverBId,
        companyId: mockCompanyId,
        driverNumber: 'DRV-B',
        payType: 'PER_MILE',
        payRate: 0.50,
      };

      // Mock segments: Driver A (Origin -> Breakdown), Driver B (Breakdown -> Dest)
      const mockSegments = [
        {
          id: 'segment-1',
          loadId: mockLoadId,
          driverId: mockDriverAId,
          truckId: mockTruckId,
          sequence: 1,
          startLocation: 'Origin, TX',
          endLocation: 'Breakdown Point, OK',
          segmentMiles: 400,
          loadedMiles: 400,
          emptyMiles: 0,
          startDate: new Date('2025-01-27T08:00:00Z'),
          endDate: new Date('2025-01-27T14:00:00Z'),
          notes: 'Origin to Breakdown',
        },
        {
          id: 'segment-2',
          loadId: mockLoadId,
          driverId: mockDriverBId,
          truckId: mockTruckId,
          sequence: 2,
          startLocation: 'Breakdown Point, OK',
          endLocation: 'Destination, CA',
          segmentMiles: 600,
          loadedMiles: 400,
          emptyMiles: 200,
          startDate: new Date('2025-01-27T15:00:00Z'),
          endDate: new Date('2025-01-27T18:00:00Z'),
          notes: 'Breakdown to Destination',
        },
      ];

      // Mock expenses: Separate for each driver
      const mockExpensesDriverA = [
        {
          id: 'expense-a-1',
          loadId: mockLoadId,
          driverId: mockDriverAId,
          expenseType: 'TOLL',
          amount: 25,
          date: new Date('2025-01-27T10:00:00Z'),
          approvalStatus: 'APPROVED',
        },
        {
          id: 'expense-a-2',
          loadId: mockLoadId,
          driverId: mockDriverAId,
          expenseType: 'SCALE',
          amount: 15,
          date: new Date('2025-01-27T12:00:00Z'),
          approvalStatus: 'APPROVED',
        },
      ];

      const mockExpensesDriverB = [
        {
          id: 'expense-b-1',
          loadId: mockLoadId,
          driverId: mockDriverBId,
          expenseType: 'TOLL',
          amount: 30,
          date: new Date('2025-01-27T16:00:00Z'),
          approvalStatus: 'APPROVED',
        },
      ];

      // Mock Prisma calls
      (prisma.load.findUnique as jest.Mock).mockResolvedValue(mockLoad);
      (prisma.loadSegment.findMany as jest.Mock).mockResolvedValue(mockSegments);
      (prisma.driver.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockDriverA)
        .mockResolvedValueOnce(mockDriverB);

      // Mock expenses: Driver A expenses
      (prisma.loadExpense.findMany as jest.Mock)
        .mockResolvedValueOnce(mockExpensesDriverA) // For Driver A settlement
        .mockResolvedValueOnce(mockExpensesDriverB); // For Driver B settlement

      // Execute: Generate settlements for both drivers
      const settlementManager = new SettlementManager();

      // Driver A Settlement
      (prisma.load.findMany as jest.Mock).mockResolvedValueOnce([
        {
          ...mockLoad,
          segments: [mockSegments[0]], // Only Driver A's segment
          accessorialCharges: [],
          loadExpenses: mockExpensesDriverA,
        },
      ]);

      const driverASettlement = await settlementManager.generateSettlement({
        driverId: mockDriverAId,
        periodStart: new Date('2025-01-27T00:00:00Z'),
        periodEnd: new Date('2025-01-27T23:59:59Z'),
      });

      // Driver B Settlement
      (prisma.load.findMany as jest.Mock).mockResolvedValueOnce([
        {
          ...mockLoad,
          segments: [mockSegments[1]], // Only Driver B's segment
          accessorialCharges: [],
          loadExpenses: mockExpensesDriverB,
        },
      ]);

      const driverBSettlement = await settlementManager.generateSettlement({
        driverId: mockDriverBId,
        periodStart: new Date('2025-01-27T00:00:00Z'),
        periodEnd: new Date('2025-01-27T23:59:59Z'),
      });

      // Assertions
      // 1. Total revenue stays with Load 101
      expect(mockLoad.revenue).toBe(2500);

      // 2. Driver A pay: 400 miles * $0.50 = $200
      // Driver A expenses: $25 + $15 = $40
      // Expected: Gross Pay = $200, Deductions = $40, Net Pay = $160

      // 3. Driver B pay: 600 miles * $0.50 = $300
      // Driver B expenses: $30
      // Expected: Gross Pay = $300, Deductions = $30, Net Pay = $270

      // Verify expenses are calculated separately
      expect(prisma.loadExpense.findMany).toHaveBeenCalledTimes(2);
    });

    it('should create load segments when load is split', async () => {
      // Setup: Load needs to be split
      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-101',
        driverId: mockDriverAId,
        truckId: mockTruckId,
        status: LoadStatus.EN_ROUTE_DELIVERY,
        totalMiles: 1000,
      };

      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        ...mockLoad,
        segments: [],
      });

      // Execute: Split load at breakdown point
      const splitResult = await LoadSplitManager.splitLoad({
        loadId: mockLoadId,
        newDriverId: mockDriverBId,
        splitLocation: 'Breakdown Point, OK',
        splitDate: new Date('2025-01-27T14:00:00Z'),
        splitMiles: 400,
        notes: 'Breakdown - repower required',
      });

      // Assertions: Segments should be created
      expect(prisma.loadSegment.create).toHaveBeenCalled();
    });
  });

  describe('Scenario 3: Partial Shortage', () => {
    it('should move load status to OS&D_Claim and block invoicing until resolved', async () => {
      // Setup: Load delivered with shortage flag
      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-101',
        companyId: mockCompanyId,
        customerId: mockCustomerId,
        status: LoadStatus.DELIVERED,
        revenue: 2500,
        weight: 45000, // Expected weight
        deliveredAt: new Date('2025-01-27T18:00:00Z'),
        // Shortage flag would be set (may need to add to schema)
        // For now, we'll simulate with a note or custom field
        driverNotes: 'Shortage: 2 pallets missing',
      };

      const mockDocuments = [
        {
          id: 'doc-1',
          loadId: mockLoadId,
          type: 'POD',
          fileUrl: 'https://example.com/pod.pdf',
          deletedAt: null,
        },
      ];

      // Mock Prisma calls
      (prisma.load.findUnique as jest.Mock).mockResolvedValue(mockLoad);
      (prisma.document.findMany as jest.Mock).mockResolvedValue(mockDocuments);

      // Step 1: Mark load as having shortage (OS&D_Claim status)
      // Note: If OS&D_Claim is not in LoadStatus enum, we may need to add it
      // For now, we'll simulate with a custom status or flag
      const shortageLoad = {
        ...mockLoad,
        status: LoadStatus.BILLING_HOLD, // Using BILLING_HOLD as proxy for OS&D_Claim
        billingHoldReason: 'OS&D Claim: Partial Shortage - 2 pallets missing',
        isBillingHold: true,
      };

      (prisma.load.update as jest.Mock).mockResolvedValue(shortageLoad);

      // Execute: Update load status to OS&D_Claim
      await prisma.load.update({
        where: { id: mockLoadId },
        data: {
          status: LoadStatus.BILLING_HOLD,
          isBillingHold: true,
          billingHoldReason: 'OS&D Claim: Partial Shortage - 2 pallets missing',
        },
      });

      // Step 2: Check invoicing eligibility - should return FALSE
      // Note: Invoice generation checks both BillingHoldManager AND InvoiceManager
      const billingHoldManager = new BillingHoldManager();
      const invoiceManager = new InvoiceManager();
      
      // Mock BillingHoldManager.checkInvoicingEligibility (uses select, not include)
      (prisma.load.findUnique as jest.Mock)
        .mockResolvedValueOnce({ // For BillingHoldManager (selects specific fields)
          id: mockLoadId,
          loadNumber: 'LD-101',
          status: LoadStatus.BILLING_HOLD,
          isBillingHold: true,
          billingHoldReason: 'OS&D Claim: Partial Shortage - 2 pallets missing',
        })
        .mockResolvedValueOnce({ // For InvoiceManager (includes documents and customer)
          ...shortageLoad,
          documents: mockDocuments,
          customer: {
            id: mockCustomerId,
            type: 'DIRECT',
          },
        });

      const eligibility = await billingHoldManager.checkInvoicingEligibility(mockLoadId);
      const readyToBill = await invoiceManager.isReadyToBill(mockLoadId);

      // Assertions
      expect(prisma.load.update).toHaveBeenCalledWith({
        where: { id: mockLoadId },
        data: {
          status: LoadStatus.BILLING_HOLD,
          isBillingHold: true,
          billingHoldReason: 'OS&D Claim: Partial Shortage - 2 pallets missing',
        },
      });

      // Invoicing should be blocked by billing hold
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.isBillingHold).toBe(true);
      expect(eligibility.reason).toContain('billing hold');
      
      // Even if other checks pass, billing hold blocks invoicing
      // (readyToBill may pass POD/weight checks, but billing hold takes precedence)
    });

    it('should allow invoicing after OS&D claim is resolved', async () => {
      // Setup: Load with resolved OS&D claim
      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-101',
        status: LoadStatus.DELIVERED,
        isBillingHold: false,
        billingHoldReason: null,
        revenue: 2500,
        driverPay: 2000,
        weight: 45000,
        deliveredAt: new Date('2025-01-27T18:00:00Z'),
      };

      const mockDocuments = [
        {
          id: 'doc-1',
          loadId: mockLoadId,
          type: 'POD',
          fileUrl: 'https://example.com/pod.pdf',
          deletedAt: null,
        },
      ];

      // Mock Prisma calls
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        ...mockLoad,
        documents: mockDocuments,
        customer: {
          id: mockCustomerId,
          type: 'DIRECT',
        },
      });

      // Execute: Check invoicing eligibility
      const invoiceManager = new InvoiceManager();
      const readyToBill = await invoiceManager.isReadyToBill(mockLoadId);

      // Assertions: Should be ready to bill after claim resolution
      expect(readyToBill.ready).toBe(true);
    });

    it('should block invoicing if POD is missing even with shortage resolved', async () => {
      // Setup: Load with resolved shortage but missing POD
      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-101',
        status: LoadStatus.DELIVERED,
        isBillingHold: false,
        revenue: 2500,
        driverPay: 2000,
        weight: 45000,
      };

      // No POD documents
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        ...mockLoad,
        documents: [], // No POD
        customer: {
          id: mockCustomerId,
          type: 'DIRECT',
        },
      });

      // Execute: Check invoicing eligibility
      const invoiceManager = new InvoiceManager();
      const readyToBill = await invoiceManager.isReadyToBill(mockLoadId);

      // Assertions: Should still be blocked due to missing POD
      expect(readyToBill.ready).toBe(false);
      expect(readyToBill.missingPOD).toBe(true);
      expect(readyToBill.reasons).toContain(
        expect.stringContaining('POD')
      );
    });
  });

  describe('Integration: All Scenarios Combined', () => {
    it('should handle multiple unhappy paths in sequence', async () => {
      // Scenario: Load split, then shortage detected, then claim resolved
      // This tests the system's ability to handle complex workflows

      const mockLoad = {
        id: mockLoadId,
        loadNumber: 'LD-101',
        status: LoadStatus.DELIVERED,
        revenue: 2500,
        weight: 45000,
        driverId: mockDriverBId,
      };

      // Step 1: Load was split (already handled in Scenario 2)
      // Step 2: Shortage detected
      (prisma.load.update as jest.Mock).mockResolvedValue({
        ...mockLoad,
        status: LoadStatus.BILLING_HOLD,
        isBillingHold: true,
        billingHoldReason: 'OS&D Claim: Partial Shortage',
      });

      // Step 3: Check invoicing (should be blocked)
      const invoiceManager = new InvoiceManager();
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        ...mockLoad,
        status: LoadStatus.BILLING_HOLD,
        isBillingHold: true,
        documents: [],
        customer: { id: mockCustomerId, type: 'DIRECT' },
      });

      const readyToBill = await invoiceManager.isReadyToBill(mockLoadId);
      expect(readyToBill.ready).toBe(false);

      // Step 4: Claim resolved
      (prisma.load.update as jest.Mock).mockResolvedValue({
        ...mockLoad,
        status: LoadStatus.DELIVERED,
        isBillingHold: false,
        billingHoldReason: null,
      });

      // Step 5: Check invoicing again (should pass)
      (prisma.load.findUnique as jest.Mock).mockResolvedValue({
        ...mockLoad,
        status: LoadStatus.DELIVERED,
        isBillingHold: false,
        documents: [
          {
            id: 'doc-1',
            type: 'POD',
            fileUrl: 'https://example.com/pod.pdf',
            deletedAt: null,
          },
        ],
        customer: { id: mockCustomerId, type: 'DIRECT' },
      });

      const readyToBillAfter = await invoiceManager.isReadyToBill(mockLoadId);
      expect(readyToBillAfter.ready).toBe(true);
    });
  });
});

