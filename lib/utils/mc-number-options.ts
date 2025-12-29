/**
 * Helper function to fetch MC numbers and format them as options for select fields
 * This is used in bulk edit dialogs and other forms
 */
import { apiUrl } from './index';

export async function getMcNumberOptions(): Promise<Array<{ value: string; label: string }>> {
  try {
    const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
    if (!response.ok) {
      console.error('Failed to fetch MC numbers');
      return [];
    }
    const result = await response.json();
    const mcNumbers = result.data || [];
    
    return mcNumbers.map((mc: { id: string; number: string; companyName: string; isDefault?: boolean }) => ({
      value: mc.id,
      label: `${mc.companyName} (${mc.number})${mc.isDefault ? ' - Default' : ''}`,
    }));
  } catch (error) {
    console.error('Error fetching MC numbers:', error);
    return [];
  }
}

/**
 * Static MC number options for use in entity configs
 * Note: This will be populated at runtime when the bulk edit dialog opens
 * For now, we'll use a special key that the BulkEditDialog can recognize
 */
export const MC_NUMBER_FIELD_KEY = 'mcNumberId';

const mcNumberBulkEditField = {
  key: MC_NUMBER_FIELD_KEY,
  label: 'MC Number',
  type: 'select' as const,
  options: [], // Will be populated dynamically
  permission: 'mc_numbers.edit',
  placeholder: 'Select MC number',
};

