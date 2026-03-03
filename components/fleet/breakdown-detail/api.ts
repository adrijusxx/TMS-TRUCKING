import { apiUrl } from '@/lib/utils';

export async function fetchBreakdown(id: string) {
  const response = await fetch(apiUrl(`/api/breakdowns/${id}`));
  if (!response.ok) throw new Error('Failed to fetch breakdown');
  return response.json();
}

export async function fetchVendors(type?: string) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  const response = await fetch(apiUrl(`/api/vendors?${params.toString()}&limit=100`));
  if (!response.ok) throw new Error('Failed to fetch vendors');
  return response.json();
}

export async function fetchUsers() {
  const response = await fetch(apiUrl('/api/settings/users?role=EMPLOYEES'));
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function updateBreakdown(id: string, data: any) {
  const response = await fetch(apiUrl(`/api/breakdowns/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update breakdown');
  }
  return response.json();
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REPORTED: 'bg-yellow-500 text-white',
    DISPATCHED: 'bg-blue-500 text-white',
    IN_PROGRESS: 'bg-orange-500 text-white',
    WAITING_PARTS: 'bg-purple-500 text-white',
    COMPLETED: 'bg-green-500 text-white',
    RESOLVED: 'bg-green-500 text-white',
    CANCELLED: 'bg-gray-500 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-blue-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    CRITICAL: 'bg-red-500 text-white',
  };
  return colors[priority] || 'bg-gray-500 text-white';
}
