import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

export async function fetchSettlement(id: string) {
  const response = await fetch(apiUrl(`/api/settlements/${id}`));
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch settlement: ${response.status} ${response.statusText}`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Invalid settlement data received from server');
  }
  return result;
}

export async function updateSettlement(id: string, data: any) {
  const response = await fetch(apiUrl(`/api/settlements/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update settlement');
  }
  return response.json();
}

export async function downloadSettlementPDF(id: string, format?: string) {
  try {
    const url = format
      ? apiUrl(`/api/settlements/${id}/pdf?format=${format}`)
      : apiUrl(`/api/settlements/${id}/pdf`);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to download PDF');
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `settlement-${id}${format ? '-driver' : ''}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
    toast.success('PDF downloaded successfully');
  } catch (error: any) {
    toast.error(error.message || 'Failed to download PDF');
  }
}

export async function sendSettlementEmail(id: string) {
  try {
    const response = await fetch(apiUrl(`/api/settlements/${id}/send`), { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send email');
    }
    toast.success('Settlement email sent successfully');
  } catch (error: any) {
    toast.error(error.message || 'Failed to send email');
  }
}

export async function fetchDeductions(settlementId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/deductions`));
  if (!response.ok) throw new Error('Failed to fetch deductions');
  return response.json();
}

export async function fetchAdditions(settlementId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/additions`));
  if (!response.ok) throw new Error('Failed to fetch additions');
  return response.json();
}

export async function createDeduction(settlementId: string, data: any) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/deductions`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create deduction');
  }
  return response.json();
}

export async function createAddition(settlementId: string, data: any) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/additions`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create addition');
  }
  return response.json();
}

export async function deleteDeduction(settlementId: string, deductionId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/deductions?deductionId=${deductionId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete deduction');
  }
  return response.json();
}

export async function deleteAddition(settlementId: string, additionId: string) {
  const response = await fetch(apiUrl(`/api/settlements/${settlementId}/additions?additionId=${additionId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete addition');
  }
  return response.json();
}
