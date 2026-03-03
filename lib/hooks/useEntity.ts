'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Generic hook for fetching a single entity by ID.
 *
 * @example
 * const { data: driver, isLoading } = useEntity('drivers', driverId);
 */
export function useEntity<T = unknown>(entityType: string, id: string | undefined | null) {
  return useQuery<T>({
    queryKey: [entityType, id],
    queryFn: async () => {
      const res = await fetch(`/api/${entityType}/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch ${entityType}`);
      const json = await res.json();
      return json.data ?? json;
    },
    enabled: !!id,
  });
}

/**
 * Generic hook for fetching a list of entities with optional query params.
 *
 * @example
 * const { data: drivers } = useEntityList('drivers', { status: 'ACTIVE', page: '1' });
 */
export function useEntityList<T = unknown>(
  entityType: string,
  params?: Record<string, string>,
  options?: { enabled?: boolean }
) {
  const searchParams = params ? new URLSearchParams(params).toString() : '';
  const url = searchParams ? `/api/${entityType}?${searchParams}` : `/api/${entityType}`;

  return useQuery<T>({
    queryKey: [entityType, 'list', params],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${entityType}`);
      const json = await res.json();
      return json.data ?? json;
    },
    enabled: options?.enabled !== false,
  });
}

/**
 * Generic hook for deleting an entity. Invalidates the entity list query on success.
 *
 * @example
 * const { mutate: deleteDriver } = useEntityDelete('drivers');
 * deleteDriver(driverId);
 */
export function useEntityDelete(entityType: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/${entityType}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete ${entityType}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
  });
}
