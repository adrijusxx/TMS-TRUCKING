import { apiUrl } from '@/lib/utils';

export async function fetchDrivers() {
  const response = await fetch(apiUrl('/api/drivers?limit=1000&isActive=true'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

export async function fetchDriverSettlementEligibleLoads(driverId: string) {
  if (!driverId) return { data: [] };
  const response = await fetch(
    apiUrl(`/api/loads?driverId=${driverId}&status=DELIVERED&status=INVOICED&status=PAID&limit=500`)
  );
  if (!response.ok) throw new Error('Failed to fetch loads');
  const data = await response.json();
  console.log(`[Settlement] Fetched eligible loads for driver ${driverId}:`, data.data?.length || 0);
  return data;
}

export async function generateSettlement(data: {
  driverId: string;
  loadIds: string[];
  settlementNumber?: string;
  deductions?: number;
  advances?: number;
  notes?: string;
}) {
  const response = await fetch(apiUrl('/api/settlements/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    const customError: any = new Error(error.error?.message || 'Failed to generate settlement');
    customError.errorDetails = error.error;
    customError.statusCode = response.status;
    throw customError;
  }
  return response.json();
}
