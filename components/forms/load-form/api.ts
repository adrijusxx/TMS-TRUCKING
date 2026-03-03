import { apiUrl } from '@/lib/utils';
import type { CreateLoadInput, UpdateLoadInput } from '@/lib/validations/load';

export async function fetchCustomers() {
  const response = await fetch(apiUrl('/api/customers'));
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

export async function fetchDrivers(mcNumber?: string | null, canReassign?: boolean, isAdmin?: boolean) {
  const url = isAdmin
    ? apiUrl('/api/drivers?limit=1000&status=AVAILABLE')
    : mcNumber
      ? apiUrl(`/api/drivers?limit=1000&status=AVAILABLE&mcNumber=${encodeURIComponent(mcNumber)}`)
      : apiUrl('/api/drivers?limit=1000&status=AVAILABLE');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

export async function fetchLoad(loadId: string) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`));
  if (!response.ok) throw new Error('Failed to fetch load');
  return response.json();
}

export async function createLoadApi(data: CreateLoadInput) {
  const response = await fetch(apiUrl('/api/loads'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create load');
  }
  return response.json();
}

export async function updateLoadApi(loadId: string, data: UpdateLoadInput) {
  const response = await fetch(apiUrl(`/api/loads/${loadId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update load');
  }
  return response.json();
}
