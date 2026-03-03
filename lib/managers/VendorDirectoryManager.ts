/**
 * VendorDirectoryManager
 *
 * Manages the vendor directory with specialization tagging
 * and location-based vendor lookup for fleet maintenance.
 */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { NotFoundError, BadRequestError } from '@/lib/errors';

/** Valid specialization tags for vendors */
const VALID_SPECIALIZATIONS = [
  'TIRES',
  'ENGINE',
  'TRANSMISSION',
  'ELECTRICAL',
  'HVAC',
  'BODY',
  'TRAILER',
  'GENERAL',
] as const;

type Specialization = (typeof VALID_SPECIALIZATIONS)[number];

interface VendorFilters {
  type?: string;
  specialization?: string;
  state?: string;
  city?: string;
  isActive?: boolean;
  search?: string;
}

interface VendorWithDistance {
  id: string;
  name: string;
  vendorNumber: string;
  type: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  services: string[];
  specialties: string | null;
  hourlyRate: number | null;
  rating: number | null;
  isActive: boolean;
  distanceMiles: number | null;
}

/**
 * Calculate distance in miles between two lat/lng points using Haversine formula.
 */
function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class VendorDirectoryManager {
  /**
   * List vendors for a company with optional filters.
   */
  static async listVendors(companyId: string, filters?: VendorFilters) {
    const where: Record<string, unknown> = {
      companyId,
      deletedAt: null,
    };

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.state) {
      where.state = filters.state;
    }
    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { specialties: { contains: filters.search, mode: 'insensitive' } },
        { vendorNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters?.specialization) {
      where.services = { has: filters.specialization };
    }

    const vendors = await prisma.vendor.findMany({
      where: where as any,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        vendorNumber: true,
        type: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        latitude: true,
        longitude: true,
        services: true,
        specialties: true,
        hourlyRate: true,
        rating: true,
        totalOrders: true,
        totalSpent: true,
        isActive: true,
        website: true,
      },
    });

    logger.debug('Vendors listed', { companyId, count: vendors.length });
    return vendors;
  }

  /**
   * Add specialization tags to a vendor.
   * Tags are stored in the `services` string array field.
   */
  static async addSpecialization(vendorId: string, tags: string[]) {
    // Validate tags
    const invalidTags = tags.filter(
      (t) => !VALID_SPECIALIZATIONS.includes(t as Specialization)
    );
    if (invalidTags.length > 0) {
      throw new BadRequestError(
        `Invalid specialization tags: ${invalidTags.join(', ')}. Valid tags: ${VALID_SPECIALIZATIONS.join(', ')}`
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, services: true },
    });

    if (!vendor) {
      throw new NotFoundError('Vendor', vendorId);
    }

    // Merge existing services with new tags (deduplicate)
    const existingServices = vendor.services || [];
    const mergedServices = [...new Set([...existingServices, ...tags])];

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { services: mergedServices },
      select: {
        id: true,
        name: true,
        vendorNumber: true,
        services: true,
        specialties: true,
      },
    });

    logger.info('Vendor specializations updated', {
      vendorId,
      newTags: tags,
      allServices: mergedServices,
    });

    return updated;
  }

  /**
   * Find the nearest vendors by specialization from a given location.
   * Returns vendors sorted by distance, closest first.
   */
  static async findNearestVendor(
    companyId: string,
    location: { latitude: number; longitude: number },
    specialization?: string,
    limit: number = 10
  ): Promise<VendorWithDistance[]> {
    const where: Record<string, unknown> = {
      companyId,
      deletedAt: null,
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    };

    if (specialization) {
      where.services = { has: specialization };
    }

    const vendors = await prisma.vendor.findMany({
      where: where as any,
      select: {
        id: true,
        name: true,
        vendorNumber: true,
        type: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        services: true,
        specialties: true,
        hourlyRate: true,
        rating: true,
        isActive: true,
      },
    });

    // Calculate distances and sort
    const vendorsWithDistance: VendorWithDistance[] = vendors.map((v) => ({
      ...v,
      distanceMiles:
        v.latitude && v.longitude
          ? Math.round(
              haversineDistanceMiles(
                location.latitude,
                location.longitude,
                v.latitude,
                v.longitude
              ) * 10
            ) / 10
          : null,
    }));

    vendorsWithDistance.sort((a, b) => {
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });

    logger.debug('Nearest vendors found', {
      companyId,
      specialization,
      found: vendorsWithDistance.length,
    });

    return vendorsWithDistance.slice(0, limit);
  }

  /**
   * Get the list of valid specialization tags.
   */
  static getValidSpecializations(): readonly string[] {
    return VALID_SPECIALIZATIONS;
  }
}
