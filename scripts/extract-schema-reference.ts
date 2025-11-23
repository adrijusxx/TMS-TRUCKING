import * as fs from 'fs';
import * as path from 'path';

interface SchemaField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  isRelation: boolean;
  relationModel?: string;
  defaultValue?: string;
  isUnique?: boolean;
  isId?: boolean;
}

interface SchemaModel {
  name: string;
  fields: SchemaField[];
  relations: string[];
  indexes: string[][];
  uniqueConstraints: string[][];
}

interface SchemaEnum {
  name: string;
  values: string[];
}

interface SchemaReference {
  models: Record<string, SchemaModel>;
  enums: Record<string, SchemaEnum>;
  extractedAt: string;
}

function parsePrismaSchema(schemaPath: string): SchemaReference {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const models: Record<string, SchemaModel> = {};
  const enums: Record<string, SchemaEnum> = {};

  // Parse enums
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(content)) !== null) {
    const enumName = enumMatch[1];
    const enumBody = enumMatch[2];
    const values = enumBody
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//'))
      .map((line) => line.replace(/,$/, '').trim());
    enums[enumName] = { name: enumName, values };
  }

  // Parse models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;
  let modelMatch;
  while ((modelMatch = modelRegex.exec(content)) !== null) {
    const modelName = modelMatch[1];
    const modelBody = modelMatch[2];
    const fields: SchemaField[] = [];
    const relations: string[] = [];
    const indexes: string[][] = [];
    const uniqueConstraints: string[][] = [];

    // Parse fields
    const fieldLines = modelBody.split('\n');
    for (const line of fieldLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
        // Parse indexes and unique constraints
        if (trimmed.startsWith('@@index')) {
          const indexMatch = trimmed.match(/\[([^\]]+)\]/);
          if (indexMatch) {
            const fields = indexMatch[1]
              .split(',')
              .map((f) => f.trim().replace(/"/g, ''));
            indexes.push(fields);
          }
        }
        if (trimmed.startsWith('@@unique')) {
          const uniqueMatch = trimmed.match(/\[([^\]]+)\]/);
          if (uniqueMatch) {
            const fields = uniqueMatch[1]
              .split(',')
              .map((f) => f.trim().replace(/"/g, ''));
            uniqueConstraints.push(fields);
          }
        }
        continue;
      }

      // Parse field definition
      const fieldMatch = trimmed.match(/^(\w+)\s+([^@]+?)(\s+@[^@]+)*$/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const typePart = fieldMatch[2].trim();
        const attributes = fieldMatch[3] || '';

        // Determine type
        const isOptional = typePart.endsWith('?');
        const isArray = typePart.endsWith('[]');
        // Remove comments and clean type
        let type = typePart.replace(/\?$/, '').replace(/\[\]$/, '').split('//')[0].trim();

        // Check if it's a relation
        const isRelation = attributes.includes('@relation');
        let relationModel: string | undefined;
        if (isRelation) {
          const relationMatch = attributes.match(/@relation\([^)]*fields:\s*\[([^\]]+)\]/);
          if (relationMatch) {
            // Extract relation model from type
            relationModel = type;
            relations.push(type);
          }
        }

        // Check for enum type
        if (enums[type]) {
          type = `enum:${type}`;
        }

        const field: SchemaField = {
          name: fieldName,
          type,
          isOptional,
          isArray,
          isRelation: !!isRelation,
          relationModel,
        };

        // Parse attributes
        if (attributes.includes('@id')) field.isId = true;
        if (attributes.includes('@unique')) field.isUnique = true;
        const defaultMatch = attributes.match(/@default\(([^)]+)\)/);
        if (defaultMatch) {
          field.defaultValue = defaultMatch[1];
        }

        fields.push(field);
      }
    }

    models[modelName] = {
      name: modelName,
      fields,
      relations: [...new Set(relations)],
      indexes,
      uniqueConstraints,
    };
  }

  return {
    models,
    enums,
    extractedAt: new Date().toISOString(),
  };
}

// Main execution
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const outputPath = path.join(__dirname, '../lib/schema-reference.json');

console.log('Extracting schema from:', schemaPath);
const reference = parsePrismaSchema(schemaPath);

console.log(`Extracted ${Object.keys(reference.models).length} models`);
console.log(`Extracted ${Object.keys(reference.enums).length} enums`);

// Write to JSON file
fs.writeFileSync(outputPath, JSON.stringify(reference, null, 2));
console.log('Schema reference written to:', outputPath);

// Also create a TypeScript type file for better IDE support
const tsOutputPath = path.join(__dirname, '../lib/schema-reference.ts');
const tsContent = `// Auto-generated schema reference
// Do not edit manually - generated by scripts/extract-schema-reference.ts

export interface SchemaField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  isRelation: boolean;
  relationModel?: string;
  defaultValue?: string;
  isUnique?: boolean;
  isId?: boolean;
}

export interface SchemaModel {
  name: string;
  fields: SchemaField[];
  relations: string[];
  indexes: string[][];
  uniqueConstraints: string[][];
}

export interface SchemaEnum {
  name: string;
  values: string[];
}

export interface SchemaReference {
  models: Record<string, SchemaModel>;
  enums: Record<string, SchemaEnum>;
  extractedAt: string;
}

export const schemaReference: SchemaReference = ${JSON.stringify(reference, null, 2)} as const;

// Helper functions
export function getModelFields(modelName: string): SchemaField[] {
  return schemaReference.models[modelName]?.fields || [];
}

export function getModelRelations(modelName: string): string[] {
  return schemaReference.models[modelName]?.relations || [];
}

export function fieldExists(modelName: string, fieldName: string): boolean {
  return schemaReference.models[modelName]?.fields.some(f => f.name === fieldName) || false;
}

export function getEnumValues(enumName: string): string[] {
  return schemaReference.enums[enumName]?.values || [];
}
`;

fs.writeFileSync(tsOutputPath, tsContent);
console.log('TypeScript reference written to:', tsOutputPath);

