'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

/**
 * Universal server action to handle inline editing for dashboard entities
 * Updates a single field on any supported entity type
 */
export async function updateEntityField(
  entityType: string,
  id: string,
  field: string,
  value: any
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Map entity types to Prisma model update operations
    switch (entityType) {
      case 'driver': {
        await prisma.driver.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/drivers');
        break;
      }

      case 'truck': {
        await prisma.truck.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/trucks');
        break;
      }

      case 'trailer': {
        await prisma.trailer.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/trailers');
        break;
      }

      case 'customer': {
        await prisma.customer.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/customers');
        break;
      }

      case 'vendor': {
        await prisma.vendor.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/vendors');
        break;
      }

      case 'load': {
        await prisma.load.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/loads');
        break;
      }

      case 'invoice': {
        await prisma.invoice.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/invoices');
        break;
      }

      case 'location': {
        await prisma.location.update({
          where: { id },
          data: { [field]: value },
        });
        revalidatePath('/dashboard/locations');
        break;
      }

      default: {
        return {
          success: false,
          error: `Unsupported entity type: ${entityType}`,
        };
      }
    }

    // Revalidate main dashboard to refresh any summary data
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error updating entity field:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update field',
    };
  }
}
