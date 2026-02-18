import { AIService } from './AIService';
import { getEntityConfig } from '@/lib/import-export/entity-config';

export class ImportHelperService extends AIService {

    /**
     * Suggests mappings between user CSV headers and system fields.
     * Dynamically pulls target fields from entity-config.ts.
     */
    async suggestColumnMapping(
        userHeaders: string[],
        entityType: string
    ): Promise<Record<string, string>> {

        const targetFields = this.getTargetFieldsForEntity(entityType);

        if (Object.keys(targetFields).length === 0) return {};

        const prompt = `
I have a CSV file with the following headers:
${JSON.stringify(userHeaders)}

I need to map these headers to the following system fields:
${JSON.stringify(targetFields, null, 2)}

Please analyze the headers and suggest the best mapping.
Return a JSON object where the keys are the "System Field Keys" (e.g., "loadNumber") and the values are the matching "User CSV Header".
Only include mappings where you are confident.
If a system field has no matching header, do not include it in the JSON.

Example Response:
{
  "loadNumber": "Load #",
  "pickupDate": "Pick Date",
  "revenue": "Rate"
}

Return ONLY valid JSON.
`;

        const result = await this.callAI<Record<string, string>>(prompt, {
            temperature: 0.1,
            maxTokens: 1000,
            systemPrompt: 'You are an expert data analyst specializing in logistics data mapping. Return ONLY valid JSON.',
        });

        return result.data || {};
    }

    private getTargetFieldsForEntity(entityType: string): Record<string, string> {
        const config = getEntityConfig(entityType);
        if (!config) return {};

        const fields: Record<string, string> = {};
        for (const field of config.fields) {
            const aliases = field.suggestedCsvHeaders?.slice(0, 3).join(', ');
            fields[field.key] = field.label + (aliases ? ` (also known as: ${aliases})` : '');
        }
        return fields;
    }
}
