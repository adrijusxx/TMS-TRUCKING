/**
 * Field Mapping Service
 * Handles field mapping configuration and application for TMS migrations
 */

import { prisma } from '@/lib/prisma';
import type {
  FieldMapping,
  FieldMappingConfig,
  EntityType,
  DataType,
} from '@/lib/types/migration';

export class FieldMappingService {
  /**
   * Analyze field differences between source and target schemas
   */
  static async analyzeFieldDifferences(
    sourceSchema: Record<string, any>,
    targetSchema: Record<string, any>,
    entityType: EntityType
  ): Promise<{
    mapped: string[];
    unmapped: string[];
    missing: string[];
  }> {
    const sourceFields = Object.keys(sourceSchema);
    const targetFields = Object.keys(targetSchema);

    const mapped: string[] = [];
    const unmapped: string[] = [];
    const missing: string[] = [];

    // Find mapped fields (exact or similar matches)
    for (const sourceField of sourceFields) {
      const normalizedSource = this.normalizeFieldName(sourceField);
      const match = targetFields.find(
        (tf) => this.normalizeFieldName(tf) === normalizedSource
      );

      if (match) {
        mapped.push(sourceField);
      } else {
        unmapped.push(sourceField);
      }
    }

    // Find missing fields (in target but not in source)
    for (const targetField of targetFields) {
      if (
        !sourceFields.some(
          (sf) => this.normalizeFieldName(sf) === this.normalizeFieldName(targetField)
        )
      ) {
        missing.push(targetField);
      }
    }

    return { mapped, unmapped, missing };
  }

  /**
   * Create field mapping configuration
   */
  static async createFieldMapping(
    config: Omit<FieldMappingConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FieldMappingConfig> {
    // Store in database (you may want to create a FieldMappingConfig model)
    // For now, we'll return the config as-is
    return {
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Apply field mapping to source data
   */
  static applyFieldMapping(
    sourceData: Record<string, any>,
    mappings: FieldMapping[]
  ): {
    mappedData: Record<string, any>;
    metadata: Record<string, any>;
  } {
    const mappedData: Record<string, any> = {};
    const metadata: Record<string, any> = {};

    for (const mapping of mappings) {
      const sourceValue = sourceData[mapping.sourceField];

      if (sourceValue === undefined || sourceValue === null) {
        continue;
      }

      // Transform value if needed
      let transformedValue = mapping.transform
        ? mapping.transform(sourceValue)
        : sourceValue;

      // Apply data type conversion
      transformedValue = this.convertDataType(transformedValue, mapping.dataType);

      if (mapping.targetField) {
        // Map to existing field
        mappedData[mapping.targetField] = transformedValue;
      } else {
        // Store in metadata
        metadata[mapping.sourceField] = transformedValue;
      }
    }

    return { mappedData, metadata };
  }

  /**
   * Validate field mapping configuration
   */
  static validateMapping(
    mappings: FieldMapping[],
    requiredFields: string[]
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const mappedFields = new Set(
      mappings.filter((m) => m.targetField).map((m) => m.targetField!)
    );

    // Check if all required fields are mapped
    for (const requiredField of requiredFields) {
      if (!mappedFields.has(requiredField)) {
        errors.push(`Required field "${requiredField}" is not mapped`);
      }
    }

    // Check for duplicate mappings
    const targetFields = mappings
      .filter((m) => m.targetField)
      .map((m) => m.targetField!);
    const duplicates = targetFields.filter(
      (field, index) => targetFields.indexOf(field) !== index
    );
    if (duplicates.length > 0) {
      errors.push(`Duplicate target field mappings: ${duplicates.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get field mappings for specific entity type
   */
  static async getEntityFieldMappings(
    companyId: string,
    entityType: EntityType
  ): Promise<FieldMappingConfig | null> {
    // In a real implementation, this would query the database
    // For now, return null (mappings would be stored in a FieldMappingConfig table)
    return null;
  }

  /**
   * Normalize field name for comparison
   */
  private static normalizeFieldName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[_\s-]/g, '')
      .replace(/id$/, '')
      .replace(/number$/, '');
  }

  /**
   * Convert value to specified data type
   */
  private static convertDataType(value: any, dataType: DataType): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (dataType) {
      case 'string':
        return String(value);
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'date':
        if (value instanceof Date) return value;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      case 'boolean':
        if (typeof value === 'boolean') return value;
        const str = String(value).toLowerCase();
        return str === 'true' || str === 'yes' || str === '1';
      case 'json':
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(String(value));
        } catch {
          return null;
        }
      default:
        return value;
    }
  }
}







