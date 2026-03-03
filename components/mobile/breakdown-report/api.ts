import { apiUrl } from '@/lib/utils';

export interface TruckOption {
  id: string;
  truckNumber: string;
}

export async function fetchTrucks() {
  const response = await fetch(apiUrl('/api/trucks?status=IN_USE&limit=100'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

export async function fetchCurrentTruck() {
  const response = await fetch(apiUrl('/api/mobile/driver/current-truck'));
  if (!response.ok) throw new Error('Failed to fetch current truck');
  return response.json();
}

export async function reportBreakdown(data: any) {
  try {
    const requestBody = JSON.stringify(data);
    const requestSize = new Blob([requestBody]).size;
    const requestSizeMB = requestSize / 1024 / 1024;
    console.log(`Request size: ${requestSizeMB.toFixed(2)}MB`);

    if (requestSize > 50 * 1024 * 1024) {
      throw new Error('Request is too large. Please reduce the number or size of photos.');
    }

    const response = await fetch(apiUrl('/api/mobile/breakdowns'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (!response.ok) {
      let errorMessage = `Failed to report breakdown (${response.status})`;
      try {
        const text = await response.text();
        if (text) {
          try {
            const error = JSON.parse(text);
            errorMessage = error.error?.message || error.message || errorMessage;
          } catch {
            errorMessage = text.length > 10000
              ? `Server error: Response too large to parse. The request may have exceeded server limits.`
              : `Server error: ${text.substring(0, 200)}`;
          }
        }
      } catch (textError) {
        console.error('Error reading response:', textError);
        errorMessage = `Failed to read server response (${response.status})`;
      }

      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        requestSizeMB: requestSizeMB.toFixed(2),
      });

      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch {
      console.error('Error parsing response JSON');
      throw new Error('Invalid response from server. Please try again.');
    }
  } catch (error) {
    console.error('Error in reportBreakdown:', error);
    if (error instanceof Error) throw error;
    throw new Error('An unexpected error occurred while reporting breakdown');
  }
}
