import { apiUrl } from '@/lib/utils';

/**
 * Helper function to update a single field on an entity
 * @param entityType - The type of entity (e.g., 'driver', 'truck', 'customer')
 * @param entityId - The ID of the entity to update
 * @param field - The field name to update
 * @param value - The new value for the field
 */
export async function updateEntityField(
  entityType: string,
  entityId: string,
  field: string,
  value: string | number | null
): Promise<void> {
  // Map entity types to API endpoints
  const endpointMap: Record<string, string> = {
    driver: 'drivers',
    truck: 'trucks',
    trailer: 'trailers',
    customer: 'customers',
    vendor: 'vendors',
  };

  const endpoint = endpointMap[entityType];
  if (!endpoint) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  // Special handling for driver user fields (phone, email are on User model)
  const updateData: Record<string, any> = {};
  if (entityType === 'driver' && (field === 'phone' || field === 'email')) {
    // For drivers, phone and email are on the user model
    // We need to update via the driver endpoint which handles user updates
    updateData[field] = value;
  } else {
    updateData[field] = value;
  }

  const response = await fetch(apiUrl(`/api/${endpoint}/${entityId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Failed to update ${field}`);
  }

  return response.json();
}

