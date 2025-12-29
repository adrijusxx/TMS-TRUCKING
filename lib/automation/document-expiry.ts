/**
 * Automated Document Expiry Checking
 * 
 * Checks for expiring documents and sends notifications
 */

import { prisma } from '../prisma';
import { notifyDocumentExpiring } from '../notifications/triggers';

/**
 * Check for expiring driver documents
 */
async function checkDriverDocumentExpiry(companyId: string, daysAhead: number = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysAhead);

  const drivers = await prisma.driver.findMany({
    where: {
      companyId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      user: true,
    },
  });

  const expiring: Array<{
    driverId: string;
    driverName: string;
    documentType: string;
    expiryDate: Date;
  }> = [];

  for (const driver of drivers) {
    // Check license expiry
    if (driver.licenseExpiry && driver.licenseExpiry <= expiryDate) {
      expiring.push({
        driverId: driver.id,
        driverName: `${driver.user.firstName} ${driver.user.lastName}`,
        documentType: 'Driver License',
        expiryDate: driver.licenseExpiry,
      });
    }

    // Check medical card expiry
    if (driver.medicalCardExpiry && driver.medicalCardExpiry <= expiryDate) {
      expiring.push({
        driverId: driver.id,
        driverName: `${driver.user.firstName} ${driver.user.lastName}`,
        documentType: 'Medical Card',
        expiryDate: driver.medicalCardExpiry,
      });
    }
  }

  // Send notifications for expiring documents
  for (const item of expiring) {
    await notifyDocumentExpiring('DRIVER', item.driverId, item.documentType, item.expiryDate);
  }

  return {
    checked: drivers.length,
    expiring: expiring.length,
    documents: expiring,
  };
}

/**
 * Check for expiring truck documents
 */
async function checkTruckDocumentExpiry(companyId: string, daysAhead: number = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysAhead);

  const trucks = await prisma.truck.findMany({
    where: {
      companyId,
      isActive: true,
      deletedAt: null,
    },
  });

  const expiring: Array<{
    truckId: string;
    truckNumber: string;
    documentType: string;
    expiryDate: Date;
  }> = [];

  for (const truck of trucks) {
    // Check registration expiry (if we have this field)
    // Note: This would need to be added to the Truck model if not present
    // For now, this is a placeholder structure

    // Check insurance expiry (if we have this field)
    // Note: This would need to be added to the Truck model if not present
    // For now, this is a placeholder structure
  }

  // Send notifications for expiring documents
  for (const item of expiring) {
    await notifyDocumentExpiring('TRUCK', item.truckId, item.documentType, item.expiryDate);
  }

  return {
    checked: trucks.length,
    expiring: expiring.length,
    documents: expiring,
  };
}

/**
 * Check all document expiries for a company
 */
export async function checkAllDocumentExpiries(companyId: string, daysAhead: number = 30) {
  const [driverResults, truckResults] = await Promise.all([
    checkDriverDocumentExpiry(companyId, daysAhead),
    checkTruckDocumentExpiry(companyId, daysAhead),
  ]);

  return {
    drivers: driverResults,
    trucks: truckResults,
    totalChecked: driverResults.checked + truckResults.checked,
    totalExpiring: driverResults.expiring + truckResults.expiring,
  };
}

