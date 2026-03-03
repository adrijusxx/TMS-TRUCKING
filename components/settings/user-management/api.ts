import { apiUrl } from '@/lib/utils';
import type { UserFormData } from './types';

export async function fetchUsers(params?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  excludeDrivers?: boolean;
  role?: string;
  [key: string]: any;
}) {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  if (params?.excludeDrivers) queryParams.set('excludeDrivers', 'true');
  if (params?.role) queryParams.set('role', params.role);

  Object.keys(params || {}).forEach((key) => {
    if (!['search', 'page', 'limit', 'sortBy', 'sortOrder', 'excludeDrivers', 'role'].includes(key) && params?.[key]) {
      queryParams.set(key, params[key].toString());
    }
  });

  const url = queryParams.toString()
    ? `/api/settings/users?${queryParams}`
    : '/api/settings/users';
  const response = await fetch(apiUrl(url));
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function fetchMcNumbers() {
  const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  const data = await response.json();
  if (data.success && data.data) {
    return data;
  }
  return { success: true, data: Array.isArray(data) ? data : data.data || [] };
}

export async function createUser(data: UserFormData) {
  const { isActive, password, roleId, ...createData } = data;
  const payload: Record<string, unknown> = { ...createData };
  if (password && password.length > 0) payload.password = password;
  if (roleId) payload.roleId = roleId;

  const response = await fetch(apiUrl('/api/settings/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    const details = errorData.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      const fieldErrors = details.map((d: { path: string[]; message: string }) =>
        `${d.path.join('.')}: ${d.message}`
      ).join(', ');
      throw new Error(fieldErrors);
    }
    throw new Error(errorData.error?.message || 'Failed to create user');
  }
  return response.json();
}

export async function updateUser(userId: string, data: Partial<UserFormData>) {
  const payload = { ...data };
  if (!payload.password || payload.password.length === 0) {
    delete payload.password;
  }

  const response = await fetch(apiUrl(`/api/settings/users/${userId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update user');
  }
  return response.json();
}

export async function deleteUser(userId: string) {
  const response = await fetch(apiUrl(`/api/settings/users/${userId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete user');
  }
  return response.json();
}
