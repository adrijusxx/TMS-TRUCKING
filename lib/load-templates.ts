/**
 * Load Templates
 * 
 * Pre-defined load templates for common routes and customers
 */

import { prisma } from './prisma';

interface LoadTemplate {
  id: string;
  name: string;
  description?: string;
  customerId: string;
  customerName: string;
  pickupCity: string;
  pickupState: string;
  deliveryCity: string;
  deliveryState: string;
  commodity?: string;
  equipmentType: string;
  loadType: string;
  defaultRevenue?: number;
  defaultWeight?: number;
  notes?: string;
}

/**
 * Create a load from a template
 */
export async function createLoadFromTemplate(
  companyId: string,
  templateId: string,
  overrides?: {
    pickupDate?: Date;
    deliveryDate?: Date;
    revenue?: number;
    weight?: number;
    notes?: string;
  }
) {
  // In a real implementation, templates would be stored in the database
  // For now, this is a placeholder structure
  const template = await getTemplate(companyId, templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  // Calculate dates if not provided
  const pickupDate = overrides?.pickupDate || new Date();
  const deliveryDate =
    overrides?.deliveryDate ||
    new Date(pickupDate.getTime() + 2 * 24 * 60 * 60 * 1000); // Default 2 days later

  // Generate load number
  const loadCount = await prisma.load.count({
    where: { companyId },
  });
  const loadNumber = `LD-${String(loadCount + 1).padStart(6, '0')}`;

  const load = await prisma.load.create({
    data: {
      companyId,
      customerId: template.customerId,
      loadNumber,
      status: 'PENDING',
      loadType: template.loadType as any,
      equipmentType: template.equipmentType as any,
      pickupLocation: `${template.pickupCity}, ${template.pickupState}`,
      pickupAddress: template.pickupCity,
      pickupCity: template.pickupCity,
      pickupState: template.pickupState,
      pickupZip: '',
      pickupDate,
      deliveryLocation: `${template.deliveryCity}, ${template.deliveryState}`,
      deliveryAddress: template.deliveryCity,
      deliveryCity: template.deliveryCity,
      deliveryState: template.deliveryState,
      deliveryZip: '',
      deliveryDate,
      commodity: template.commodity || overrides?.notes,
      revenue: overrides?.revenue || template.defaultRevenue || 0,
      weight: overrides?.weight || template.defaultWeight || 0,
      dispatchNotes: overrides?.notes || template.notes || null,
    },
  });

  return load;
}

/**
 * Get a template by ID
 * Placeholder - in production, templates would be stored in database
 */
async function getTemplate(companyId: string, templateId: string): Promise<LoadTemplate | null> {
  // This would query a LoadTemplate table in production
  // For now, return null as placeholder
  return null;
}

/**
 * Get all templates for a company
 * Placeholder - in production, templates would be stored in database
 */
export async function getTemplates(companyId: string): Promise<LoadTemplate[]> {
  // This would query a LoadTemplate table in production
  // For now, return empty array
  return [];
}

