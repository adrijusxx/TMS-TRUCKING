/**
 * Device Queue Repair API
 * 
 * GET - Diagnose mismatched linked devices (LINKED in queue but no truck in TMS)
 * POST - Repair/create missing trucks for linked devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mcNumberId = searchParams.get('mcNumberId');

    // Get all LINKED truck devices
    const linkedTruckDevices = await prisma.samsaraDeviceQueue.findMany({
      where: {
        companyId: session.user.companyId,
        deviceType: 'TRUCK',
        status: 'LINKED',
      },
      select: {
        id: true,
        samsaraId: true,
        name: true,
        vin: true,
        make: true,
        model: true,
        year: true,
        licensePlate: true,
        matchedRecordId: true,
        matchedType: true,
      },
    });

    // Get all existing trucks
    const existingTrucks = await prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        truckNumber: true,
        samsaraId: true,
        vin: true,
        mcNumberId: true,
      },
    });

    const truckIdSet = new Set(existingTrucks.map(t => t.id));
    const truckSamsaraIdSet = new Set(existingTrucks.filter(t => t.samsaraId).map(t => t.samsaraId));

    // Find mismatches
    const missingTrucks: any[] = [];
    const validLinks: any[] = [];
    const duplicateDevices: any[] = [];

    for (const device of linkedTruckDevices) {
      const hasValidMatchedRecord = device.matchedRecordId && truckIdSet.has(device.matchedRecordId);
      const hasTruckBySamsaraId = truckSamsaraIdSet.has(device.samsaraId);

      if (hasValidMatchedRecord || hasTruckBySamsaraId) {
        validLinks.push(device);
      } else {
        // Check if another device with same name/VIN already has a valid truck
        const existingTruckWithSameVin = device.vin 
          ? existingTrucks.find(t => t.vin?.toUpperCase() === device.vin?.toUpperCase())
          : null;
        const existingTruckWithSameName = existingTrucks.find(
          t => t.truckNumber?.toLowerCase() === device.name?.toLowerCase()
        );

        if (existingTruckWithSameVin || existingTruckWithSameName) {
          duplicateDevices.push({
            ...device,
            existingTruck: existingTruckWithSameVin || existingTruckWithSameName,
          });
        } else {
          missingTrucks.push(device);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          linkedDevices: linkedTruckDevices.length,
          existingTrucks: existingTrucks.length,
          validLinks: validLinks.length,
          missingTrucks: missingTrucks.length,
          duplicates: duplicateDevices.length,
          trucksWithoutMc: existingTrucks.filter(t => !t.mcNumberId).length,
        },
        missingTrucks: missingTrucks.slice(0, 50), // First 50 for display
        duplicates: duplicateDevices.slice(0, 20),
        defaultMcNumberId: mcNumberId,
      },
    });
  } catch (error: any) {
    console.error('Device queue repair diagnosis error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, mcNumberId } = body;

    if (action !== 'repair') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action' } },
        { status: 400 }
      );
    }

    // Validate MC number if provided
    if (mcNumberId) {
      const mcNumber = await prisma.mcNumber.findFirst({
        where: { id: mcNumberId, companyId: session.user.companyId, deletedAt: null },
      });
      if (!mcNumber) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_MC', message: 'MC Number not found' } },
          { status: 400 }
        );
      }
    }

    // Get all LINKED truck devices
    const linkedTruckDevices = await prisma.samsaraDeviceQueue.findMany({
      where: {
        companyId: session.user.companyId,
        deviceType: 'TRUCK',
        status: 'LINKED',
      },
    });

    // Get all existing trucks
    const existingTrucks = await prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        truckNumber: true,
        samsaraId: true,
        vin: true,
      },
    });

    const truckIdSet = new Set(existingTrucks.map(t => t.id));
    const truckSamsaraIdSet = new Set(existingTrucks.filter(t => t.samsaraId).map(t => t.samsaraId));
    const truckVinSet = new Set(existingTrucks.filter(t => t.vin).map(t => t.vin?.toUpperCase()));
    const truckNumberSet = new Set(existingTrucks.map(t => t.truckNumber?.toLowerCase()));

    let created = 0;
    let linked = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const device of linkedTruckDevices) {
      const hasValidMatchedRecord = device.matchedRecordId && truckIdSet.has(device.matchedRecordId);
      const hasTruckBySamsaraId = truckSamsaraIdSet.has(device.samsaraId);

      if (hasValidMatchedRecord || hasTruckBySamsaraId) {
        skipped++;
        continue;
      }

      // Check for existing truck by VIN
      const existingByVin = device.vin 
        ? existingTrucks.find(t => t.vin?.toUpperCase() === device.vin?.toUpperCase())
        : null;

      if (existingByVin) {
        // Link to existing truck
        try {
          await prisma.$transaction([
            prisma.truck.update({
              where: { id: existingByVin.id },
              data: {
                samsaraId: device.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
              },
            }),
            prisma.samsaraDeviceQueue.update({
              where: { id: device.id },
              data: {
                matchedRecordId: existingByVin.id,
                matchedType: 'TRUCK',
              },
            }),
          ]);
          linked++;
          truckSamsaraIdSet.add(device.samsaraId);
        } catch (err: any) {
          errors.push(`Link ${device.name}: ${err.message}`);
        }
        continue;
      }

      // Check for existing truck by number
      const existingByNumber = existingTrucks.find(
        t => t.truckNumber?.toLowerCase() === device.name?.toLowerCase()
      );

      if (existingByNumber) {
        // Link to existing truck
        try {
          await prisma.$transaction([
            prisma.truck.update({
              where: { id: existingByNumber.id },
              data: {
                samsaraId: device.samsaraId,
                samsaraSyncedAt: new Date(),
                samsaraSyncStatus: 'SYNCED',
              },
            }),
            prisma.samsaraDeviceQueue.update({
              where: { id: device.id },
              data: {
                matchedRecordId: existingByNumber.id,
                matchedType: 'TRUCK',
              },
            }),
          ]);
          linked++;
          truckSamsaraIdSet.add(device.samsaraId);
        } catch (err: any) {
          errors.push(`Link ${device.name}: ${err.message}`);
        }
        continue;
      }

      // Create new truck
      try {
        // Generate unique truck number
        let truckNumber = device.name || `TRUCK-${device.samsaraId.slice(-6)}`;
        let attempt = 0;
        while (truckNumberSet.has(truckNumber.toLowerCase()) && attempt < 10) {
          attempt++;
          truckNumber = `${device.name || 'TRUCK'}-${attempt}`;
        }

        // Generate unique VIN
        let vin = device.vin || `PENDING-${device.samsaraId}-${Date.now()}`;
        let vinAttempt = 0;
        while (truckVinSet.has(vin.toUpperCase()) && vinAttempt < 10) {
          vinAttempt++;
          vin = `PENDING-${device.samsaraId}-${Date.now()}-${vinAttempt}`;
        }

        const truck = await prisma.truck.create({
          data: {
            companyId: session.user.companyId,
            truckNumber,
            vin,
            make: device.make || 'Unknown',
            model: device.model || 'Unknown',
            year: device.year || new Date().getFullYear(),
            licensePlate: device.licensePlate || 'PENDING',
            state: 'TX',
            equipmentType: 'DRY_VAN',
            capacity: 45000,
            registrationExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            inspectionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            samsaraId: device.samsaraId,
            samsaraSyncedAt: new Date(),
            samsaraSyncStatus: 'SYNCED',
            mcNumberId: mcNumberId || null,
          },
        });

        // Update queue entry
        await prisma.samsaraDeviceQueue.update({
          where: { id: device.id },
          data: {
            matchedRecordId: truck.id,
            matchedType: 'TRUCK',
          },
        });

        created++;
        truckIdSet.add(truck.id);
        truckSamsaraIdSet.add(device.samsaraId);
        truckVinSet.add(vin.toUpperCase());
        truckNumberSet.add(truckNumber.toLowerCase());
      } catch (err: any) {
        errors.push(`Create ${device.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created,
        linked,
        skipped,
        errors: errors.slice(0, 20),
      },
    });
  } catch (error: any) {
    console.error('Device queue repair error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

