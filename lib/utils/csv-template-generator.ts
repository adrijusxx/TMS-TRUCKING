/**
 * Client-side CSV template generator for onboarding imports.
 * Generates downloadable CSV templates from entity-config field definitions.
 */

import { getEntityConfig } from '@/lib/import-export/entity-config';
import type { OnboardingStep } from '@/lib/config/onboarding-steps';

/**
 * Generate a CSV string with headers and an example row
 */
export function generateTemplate(step: OnboardingStep): string {
  if (!step.entityType) return '';

  const config = getEntityConfig(step.entityType);
  if (!config) return '';

  const fields = step.templateFields.length > 0
    ? config.fields.filter((f) => step.templateFields.includes(f.key))
    : config.fields;

  const headers = fields.map((f) => f.label.replace(' *', '').replace('*', '').trim());
  const exampleValues = fields.map((f) => {
    const val = config.exampleRow?.[f.key] ?? '';
    return escapeCsvValue(String(val));
  });

  return [headers.join(','), exampleValues.join(',')].join('\n');
}

/**
 * Trigger browser download of a CSV template file
 */
export function downloadTemplate(step: OnboardingStep): void {
  const csv = generateTemplate(step);
  if (!csv) return;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${step.entityType ?? step.id}-template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
