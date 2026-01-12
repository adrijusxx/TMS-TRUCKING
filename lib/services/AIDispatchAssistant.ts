/**
 * AI-Powered Dispatch Assistant
 * Provides real-time load prioritization, conflict detection, and dispatch recommendations
 */

import { AIService } from './AIService';
import { prisma } from '@/lib/prisma';

interface DispatchRecommendation {
  loadId: string;
  loadNumber: string;
  priority: number; // 1-10, higher is more urgent
  priorityReason: string;
  recommendedDriverId?: string;
  recommendedDriverName?: string;
  recommendedTruckId?: string;
  recommendedTruckNumber?: string;
  conflicts: string[]; // List of conflicts detected
  estimatedProfitability: number;
  estimatedDeliveryTime: Date;
  recommendations: string[];
}

interface DispatchAssistantInput {
  companyId: string;
  date?: Date; // Date to analyze (defaults to today)
  includeAssigned?: boolean; // Include already assigned loads
}

export class AIDispatchAssistant extends AIService {
  /**
   * Get dispatch recommendations for the day
   */
  async getDispatchRecommendations(input: DispatchAssistantInput): Promise<DispatchRecommendation[]> {
    const targetDate = input.date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch unassigned loads
    const unassignedLoads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        status: { in: ['PENDING', 'ASSIGNED'] },
        deletedAt: null,
        pickupDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            paymentTerms: true,
          },
        },
      },
      take: 50,
    });

    // Fetch assigned loads for conflict detection
    const assignedLoads = await prisma.load.findMany({
      where: {
        companyId: input.companyId,
        status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'] },
        deletedAt: null,
        pickupDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        driver: {
          select: {
            id: true,
            driverNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        truck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
      },
      take: 50,
    });

    // Fetch available drivers
    const availableDrivers = await prisma.driver.findMany({
      where: {
        companyId: input.companyId,
        status: 'AVAILABLE',
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
            equipmentType: true,
          },
        },
      },
      take: 30,
    });

    if (unassignedLoads.length === 0) {
      return [];
    }

    const prompt = `Analyze these unassigned loads and provide dispatch recommendations with prioritization and conflict detection.

UNASSIGNED LOADS:
${JSON.stringify(unassignedLoads.map(load => ({
      id: load.id,
      loadNumber: load.loadNumber,
      pickupCity: load.pickupCity,
      pickupState: load.pickupState,
      deliveryCity: load.deliveryCity,
      deliveryState: load.deliveryState,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      equipmentType: load.equipmentType,
      revenue: load.revenue,
      customer: load.customer?.name,
      paymentTerms: load.customer?.paymentTerms,
    })), null, 2)}

ASSIGNED LOADS (for conflict detection):
${JSON.stringify(assignedLoads.map(load => ({
      loadNumber: load.loadNumber,
      driverId: load.driverId,
      driverName: load.driver?.user ? `${load.driver.user.firstName} ${load.driver.user.lastName}` : null,
      truckId: load.truckId,
      truckNumber: load.truck?.truckNumber,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      pickupCity: load.pickupCity,
      pickupState: load.pickupState,
      deliveryCity: load.deliveryCity,
      deliveryState: load.deliveryState,
    })), null, 2)}

AVAILABLE DRIVERS:
${JSON.stringify(availableDrivers.map(driver => ({
      id: driver.id,
      name: driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown',
      driverNumber: driver.driverNumber,
      currentTruck: driver.currentTruck ? {
        id: driver.currentTruck.id,
        truckNumber: driver.currentTruck.truckNumber,
        equipmentType: driver.currentTruck.equipmentType,
      } : null,
    })), null, 2)}

PRIORITIZATION FACTORS:
1. Delivery date urgency (earlier = higher priority)
2. Customer importance and payment terms
3. Revenue and profitability
4. Equipment availability
5. Driver location and availability
6. Load complexity (hazmat, temperature, etc.)

CONFLICT DETECTION:
- Double-booking (same driver/truck assigned to overlapping loads)
- HOS violations (driver won't have enough hours)
- Equipment mismatches
- Location conflicts (driver/truck too far from pickup)

Return JSON array of recommendations, each with:
- loadId: string
- loadNumber: string
- priority: number (1-10, higher is more urgent)
- priorityReason: string
- recommendedDriverId: string (optional)
- recommendedDriverName: string (optional)
- recommendedTruckId: string (optional)
- recommendedTruckNumber: string (optional)
- conflicts: string[] (list of detected conflicts)
- estimatedProfitability: number
- estimatedDeliveryTime: string (ISO date)
- recommendations: string[] (action items)`;

    const result = await this.callAI<DispatchRecommendation[]>(
      prompt,
      {
        temperature: 0.3,
        maxTokens: 4000,
        systemPrompt: 'You are an expert dispatch assistant. Analyze loads and provide prioritization and conflict detection. Return ONLY valid JSON array.',
      }
    );

    return result.data;
  }

  /**
   * Detect conflicts for a specific load assignment
   */
  async detectConflicts(companyId: string, loadId: string, driverId?: string, truckId?: string): Promise<string[]> {
    const load = await prisma.load.findUnique({
      where: { id: loadId, companyId },
      include: {
        driver: driverId ? {
          select: {
            id: true,
          },
        } : undefined,
        truck: truckId ? {
          select: {
            id: true,
          },
        } : undefined,
      },
    });

    if (!load) {
      return ['Load not found'];
    }

    const conflicts: string[] = [];

    // Check for overlapping loads with driver
    if (driverId && load.pickupDate && load.deliveryDate) {
      const overlappingLoads = await prisma.load.findMany({
        where: {
          driverId,
          id: { not: loadId },
          status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'] },
          pickupDate: { not: null },
          deliveryDate: { not: null },
          OR: [
            {
              AND: [
                { pickupDate: { lte: load.deliveryDate } },
                { deliveryDate: { gte: load.pickupDate } },
              ],
            },
            {
              AND: [
                { pickupDate: { lte: load.deliveryDate } },
                { deliveryDate: { gte: load.pickupDate } },
              ],
            },
          ],
        },
        select: {
          id: true,
          loadNumber: true,
        },
      });

      if (overlappingLoads.length > 0) {
        conflicts.push(`Driver has ${overlappingLoads.length} overlapping load(s)`);
      }
    }

    // Check for overlapping loads with truck
    if (truckId && load.pickupDate && load.deliveryDate) {
      const overlappingLoads = await prisma.load.findMany({
        where: {
          truckId,
          id: { not: loadId },
          status: { in: ['ASSIGNED', 'EN_ROUTE_PICKUP', 'LOADED', 'EN_ROUTE_DELIVERY'] },
          pickupDate: { not: null },
          deliveryDate: { not: null },
          OR: [
            {
              AND: [
                { pickupDate: { lte: load.deliveryDate } },
                { deliveryDate: { gte: load.pickupDate } },
              ],
            },
            {
              AND: [
                { pickupDate: { lte: load.deliveryDate } },
                { deliveryDate: { gte: load.pickupDate } },
              ],
            },
          ],
        },
        select: {
          id: true,
          loadNumber: true,
        },
      });

      if (overlappingLoads.length > 0) {
        conflicts.push(`Truck has ${overlappingLoads.length} overlapping load(s)`);
      }
    }

    return conflicts;
  }
}

