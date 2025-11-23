import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { schemaReference, getModelFields } from '../lib/schema-reference';

interface ImportFieldMapping {
  csvHeader: string[];
  mappedToField: string;
  isRequired: boolean;
  hasDefault: boolean;
  defaultValue?: string;
}

interface ImportAnalysis {
  entity: string;
  modelName: string;
  importFile: string;
  requiredFields: Array<{
    fieldName: string;
    fieldType: string;
    isImported: boolean;
    csvHeaders: string[];
    hasDefault: boolean;
    defaultValue?: string;
    potentialIssues: string[];
  }>;
  optionalFields: Array<{
    fieldName: string;
    isImported: boolean;
    csvHeaders: string[];
  }>;
  warnings: string[];
  errors: string[];
}

class ImportMappingAuditor {
  private analyses: ImportAnalysis[] = [];

  // Extract field mappings from import code
  private extractFieldMappings(fileContent: string, entity: string): ImportFieldMapping[] {
    const mappings: ImportFieldMapping[] = [];
    const lines = fileContent.split('\n');

    // Look for getValue() calls which map CSV headers to fields
    const getValuePattern = /getValue\s*\(\s*row\s*,\s*\[([^\]]+)\]\s*\)/g;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const getValueMatch = getValuePattern.exec(line);
      
      if (getValueMatch) {
        // Extract CSV header names from the array
        const headerArray = getValueMatch[1];
        const headers = headerArray
          .split(',')
          .map(h => h.trim().replace(/['"]/g, ''))
          .filter(h => h);

        // Look for the field assignment on the same or next line
        const fieldMatch = line.match(/(\w+)\s*[:=]\s*getValue/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          mappings.push({
            csvHeader: headers,
            mappedToField: fieldName,
            isRequired: false, // Will be determined from schema
            hasDefault: line.includes('||') || line.includes('??'),
            defaultValue: this.extractDefaultValue(line),
          });
        }
      }
    }

    return mappings;
  }

  private extractDefaultValue(line: string): string | undefined {
    const defaultMatch = line.match(/[|?]{2}\s*['"]?([^'";,}]+)['"]?/);
    return defaultMatch ? defaultMatch[1] : undefined;
  }

  // Analyze import function for a specific entity
  analyzeImport(entity: string, modelName: string, importFile: string): ImportAnalysis {
    const content = fs.readFileSync(importFile, 'utf-8');
    const mappings = this.extractFieldMappings(content, entity);
    
    const model = schemaReference.models[modelName];
    if (!model) {
      return {
        entity,
        modelName,
        importFile,
        requiredFields: [],
        optionalFields: [],
        warnings: [`Model '${modelName}' not found in schema`],
        errors: [],
      };
    }

    const fields = getModelFields(modelName);
    const requiredFields: ImportAnalysis['requiredFields'] = [];
    const optionalFields: ImportAnalysis['optionalFields'] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Create a map of imported fields
    const importedFields = new Map<string, string[]>();
    mappings.forEach(m => {
      importedFields.set(m.mappedToField, m.csvHeader);
    });

    // Check each field in the schema
    for (const field of fields) {
      // Skip auto-generated fields
      if (field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt' || field.name === 'deletedAt') {
        continue;
      }

      // Skip relation fields (handled separately)
      if (field.isRelation) {
        continue;
      }

      const isImported = importedFields.has(field.name);
      const csvHeaders = importedFields.get(field.name) || [];

      if (!field.isOptional && !field.defaultValue) {
        // Required field
        const potentialIssues: string[] = [];

        if (!isImported) {
          potentialIssues.push(`Database constraint violation - field is required but not imported`);
          potentialIssues.push(`Import will fail when creating records without this field`);
          
          if (field.type === 'String' && !field.isArray) {
            potentialIssues.push(`String fields without defaults will cause NULL constraint errors`);
          } else if (field.type === 'Float' || field.type === 'Int') {
            potentialIssues.push(`Numeric fields without defaults will cause NULL constraint errors`);
          } else if (field.type.startsWith('enum:')) {
            potentialIssues.push(`Enum fields require valid values - missing enum will cause validation errors`);
          }

          errors.push(`Required field '${field.name}' (${field.type}) is not imported`);
        } else if (csvHeaders.length === 0) {
          potentialIssues.push(`Field is mapped but CSV headers are empty`);
          warnings.push(`Field '${field.name}' is mapped but no CSV headers found`);
        }

        requiredFields.push({
          fieldName: field.name,
          fieldType: field.type,
          isImported,
          csvHeaders,
          hasDefault: !!field.defaultValue,
          defaultValue: field.defaultValue,
          potentialIssues,
        });
      } else {
        // Optional field
        optionalFields.push({
          fieldName: field.name,
          isImported,
          csvHeaders,
        });

        if (isImported && csvHeaders.length === 0) {
          warnings.push(`Optional field '${field.name}' is mapped but no CSV headers found`);
        }
      }
    }

    // Check for fields that are imported but don't exist in schema
    for (const [fieldName, headers] of importedFields.entries()) {
      if (!fields.some(f => f.name === fieldName)) {
        warnings.push(`Field '${fieldName}' is imported but doesn't exist in schema model '${modelName}'`);
      }
    }

    return {
      entity,
      modelName,
      importFile,
      requiredFields,
      optionalFields,
      warnings,
      errors,
    };
  }

  // Generate comprehensive report
  generateReport(): string {
    let report = `# Import Mapping Audit Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;

    const totalEntities = this.analyses.length;
    const entitiesWithErrors = this.analyses.filter(a => a.errors.length > 0).length;
    const totalErrors = this.analyses.reduce((sum, a) => sum + a.errors.length, 0);
    const totalWarnings = this.analyses.reduce((sum, a) => sum + a.warnings.length, 0);
    const totalMissingRequired = this.analyses.reduce(
      (sum, a) => sum + a.requiredFields.filter(f => !f.isImported).length,
      0
    );

    report += `- Total Entities Analyzed: ${totalEntities}\n`;
    report += `- Entities with Errors: ${entitiesWithErrors}\n`;
    report += `- Total Errors: ${totalErrors}\n`;
    report += `- Total Warnings: ${totalWarnings}\n`;
    report += `- Missing Required Fields: ${totalMissingRequired}\n\n`;

    report += `## Critical Issues - Missing Required Fields\n\n`;
    report += `⚠️ **These fields are REQUIRED by the database but are NOT imported. Import will FAIL without these fields.**\n\n`;

    for (const analysis of this.analyses) {
      const missingRequired = analysis.requiredFields.filter(f => !f.isImported);
      if (missingRequired.length > 0) {
        report += `### ${analysis.entity} (${analysis.modelName})\n\n`;
        report += `**File**: \`${analysis.importFile}\`\n\n`;

        for (const field of missingRequired) {
          report += `#### ❌ Missing Required Field: \`${field.fieldName}\`\n\n`;
          report += `- **Type**: ${field.fieldType}\n`;
          report += `- **Has Default**: ${field.hasDefault ? 'Yes' : 'No'}\n`;
          if (field.defaultValue) {
            report += `- **Default Value**: ${field.defaultValue}\n`;
          }
          report += `- **Potential Issues**:\n`;
          for (const issue of field.potentialIssues) {
            report += `  - ${issue}\n`;
          }
          report += `\n`;
        }
      }
    }

    report += `## Import Field Mappings\n\n`;

    for (const analysis of this.analyses) {
      report += `### ${analysis.entity} (${analysis.modelName})\n\n`;
      report += `**File**: \`${analysis.importFile}\`\n\n`;

      if (analysis.requiredFields.length > 0) {
        report += `#### Required Fields\n\n`;
        report += `| Field | Type | Imported | CSV Headers | Has Default | Issues |\n`;
        report += `|-------|------|----------|-------------|-------------|--------|\n`;
        for (const field of analysis.requiredFields) {
          const status = field.isImported ? '✅' : '❌';
          const headers = field.csvHeaders.length > 0 
            ? field.csvHeaders.slice(0, 3).join(', ') + (field.csvHeaders.length > 3 ? '...' : '')
            : 'None';
          const issues = field.potentialIssues.length > 0 ? field.potentialIssues[0] : 'None';
          report += `| ${field.fieldName} | ${field.fieldType} | ${status} | ${headers} | ${field.hasDefault ? 'Yes' : 'No'} | ${issues} |\n`;
        }
        report += `\n`;
      }

      if (analysis.errors.length > 0) {
        report += `#### Errors\n\n`;
        for (const error of analysis.errors) {
          report += `- ❌ ${error}\n`;
        }
        report += `\n`;
      }

      if (analysis.warnings.length > 0) {
        report += `#### Warnings\n\n`;
        for (const warning of analysis.warnings) {
          report += `- ⚠️ ${warning}\n`;
        }
        report += `\n`;
      }
    }

    return report;
  }

  // Main audit function
  async audit(): Promise<void> {
    console.log('🔍 Auditing import mappings...\n');

    // Find import files
    const importFile = 'app/api/import-export/[entity]/route.ts';
    
    if (!fs.existsSync(importFile)) {
      console.error(`Import file not found: ${importFile}`);
      return;
    }

    // Common entity to model mappings
    const entityMappings: Record<string, string> = {
      'loads': 'Load',
      'drivers': 'Driver',
      'trucks': 'Truck',
      'trailers': 'Trailer',
      'customers': 'Customer',
      'invoices': 'Invoice',
      'vendors': 'Vendor',
    };

    // Analyze each entity
    for (const [entity, modelName] of Object.entries(entityMappings)) {
      console.log(`Analyzing ${entity}...`);
      const analysis = this.analyzeImport(entity, modelName, importFile);
      this.analyses.push(analysis);
    }

    // Generate report
    const report = this.generateReport();
    const reportPath = path.join(__dirname, '../docs/import-mapping-audit-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Report generated: ${reportPath}`);

    // Print summary
    const totalErrors = this.analyses.reduce((sum, a) => sum + a.errors.length, 0);
    const totalMissing = this.analyses.reduce(
      (sum, a) => sum + a.requiredFields.filter(f => !f.isImported).length,
      0
    );

    console.log(`\n📊 Summary:`);
    console.log(`   - Total errors: ${totalErrors}`);
    console.log(`   - Missing required fields: ${totalMissing}`);
    
    if (totalErrors > 0 || totalMissing > 0) {
      console.log(`\n⚠️  WARNING: Import functions are missing required fields!`);
      console.log(`   Review the report for details.`);
    } else {
      console.log(`\n✅ All required fields are imported!`);
    }
  }
}

// Main execution
async function main() {
  const auditor = new ImportMappingAuditor();
  await auditor.audit();
}

main().catch(console.error);

