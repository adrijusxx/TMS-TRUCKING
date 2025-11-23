import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { schemaReference, fieldExists, getModelFields, getEnumValues } from '../lib/schema-reference';

interface AuditIssue {
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  model?: string;
  field?: string;
  suggestion?: string;
}

interface AuditResult {
  file: string;
  issues: AuditIssue[];
}

class DatabaseMappingAuditor {
  private issues: AuditIssue[] = [];
  private modelNames: string[] = [];
  private enumNames: string[] = [];

  constructor() {
    this.modelNames = Object.keys(schemaReference.models);
    this.enumNames = Object.keys(schemaReference.enums);
  }

  private addIssue(
    file: string,
    line: number,
    severity: AuditIssue['severity'],
    message: string,
    model?: string,
    field?: string,
    suggestion?: string
  ) {
    this.issues.push({
      file,
      line,
      severity,
      message,
      model,
      field,
      suggestion,
    });
  }

  // Extract model name from Prisma query patterns
  // Prisma uses camelCase in code but models are PascalCase in schema
  private extractModelFromQuery(code: string, lineNumber: number): string | null {
    // Patterns: prisma.modelName.findMany, prisma.modelName.findFirst, etc.
    const modelMatch = code.match(/prisma\.(\w+)\.(findMany|findFirst|findUnique|create|update|delete|count|aggregate)/);
    if (modelMatch) {
      const camelCaseName = modelMatch[1];
      // Convert camelCase to PascalCase
      const pascalCaseName = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
      
      // Try exact match first (for models that are already PascalCase)
      if (this.modelNames.includes(camelCaseName)) {
        return camelCaseName;
      }
      // Try PascalCase version
      if (this.modelNames.includes(pascalCaseName)) {
        return pascalCaseName;
      }
      // Try to find by case-insensitive match
      const foundModel = this.modelNames.find(m => m.toLowerCase() === camelCaseName.toLowerCase());
      if (foundModel) {
        return foundModel;
      }
      
      // Only report as error if we're confident it's a model access
      // (not a variable or other property)
      this.addIssue(
        'unknown',
        lineNumber,
        'warning',
        `Possible unknown Prisma model: ${camelCaseName}`,
        undefined,
        undefined,
        `Available models: ${this.modelNames.slice(0, 10).join(', ')}...`
      );
    }
    return null;
  }

  // Check if field exists in model
  private checkField(modelName: string, fieldName: string, file: string, line: number) {
    if (!fieldExists(modelName, fieldName)) {
      const fields = getModelFields(modelName);
      const similarFields = fields
        .map((f) => f.name)
        .filter((f) => f.toLowerCase().includes(fieldName.toLowerCase()) || fieldName.toLowerCase().includes(f.toLowerCase()))
        .slice(0, 3);
      
      this.addIssue(
        file,
        line,
        'error',
        `Field '${fieldName}' does not exist on model '${modelName}'`,
        modelName,
        fieldName,
        similarFields.length > 0 ? `Did you mean: ${similarFields.join(', ')}?` : `Available fields: ${fields.slice(0, 5).map(f => f.name).join(', ')}...`
      );
    }
  }

  // Audit API route files
  async auditApiRoutes(): Promise<AuditResult[]> {
    const apiFiles = await glob('app/api/**/*.ts', { ignore: ['**/*.d.ts', '**/node_modules/**'] });
    const results: AuditResult[] = [];

    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      this.issues = [];

      let currentModel: string | null = null;
      let inInclude = false;
      let inSelect = false;
      let inWhere = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        const trimmed = line.trim();

        // Detect Prisma query
        const model = this.extractModelFromQuery(line, lineNumber);
        if (model) {
          currentModel = model;
          inInclude = false;
          inSelect = false;
          inWhere = false;
        }

        // Check for include/select blocks
        if (trimmed.includes('include:') || trimmed.includes('include:')) {
          inInclude = true;
        }
        if (trimmed.includes('select:')) {
          inSelect = true;
        }
        if (trimmed.includes('where:')) {
          inWhere = true;
        }
        if (trimmed.includes('}') && (inInclude || inSelect || inWhere)) {
          // Check if we're closing the block
          if (trimmed.match(/^\s*\}\s*[,}]?\s*$/)) {
            inInclude = false;
            inSelect = false;
            inWhere = false;
          }
        }

        // Check field references in where clauses
        if (currentModel && inWhere) {
          const fieldMatch = trimmed.match(/(\w+):\s*[^,}]+/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            // Skip common keywords
            if (!['in', 'not', 'equals', 'contains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte', 'AND', 'OR', 'NOT'].includes(fieldName)) {
              this.checkField(currentModel, fieldName, file, lineNumber);
            }
          }
        }

        // Check include/select relations
        if (currentModel && (inInclude || inSelect)) {
          const relationMatch = trimmed.match(/(\w+):\s*(true|{)/);
          if (relationMatch) {
            const relationName = relationMatch[1];
            const model = schemaReference.models[currentModel];
            if (model && !model.relations.includes(relationName) && !getModelFields(currentModel).some(f => f.name === relationName)) {
              this.addIssue(
                file,
                lineNumber,
                'error',
                `Relation '${relationName}' does not exist on model '${currentModel}'`,
                currentModel,
                relationName,
                `Available relations: ${model.relations.slice(0, 5).join(', ')}...`
              );
            }
          }
        }

        // Check enum values
        const enumValueMatch = trimmed.match(/(\w+):\s*['"]?(\w+)['"]?/);
        if (enumValueMatch && currentModel) {
          const fieldName = enumValueMatch[1];
          const value = enumValueMatch[2];
          const fields = getModelFields(currentModel);
          const field = fields.find((f) => f.name === fieldName);
          if (field && field.type.startsWith('enum:')) {
            const enumName = field.type.replace('enum:', '');
            const validValues = getEnumValues(enumName);
            if (validValues.length > 0 && !validValues.includes(value)) {
              this.addIssue(
                file,
                lineNumber,
                'error',
                `Invalid enum value '${value}' for field '${fieldName}' (${enumName})`,
                currentModel,
                fieldName,
                `Valid values: ${validValues.join(', ')}`
              );
            }
          }
        }
      }

      if (this.issues.length > 0) {
        results.push({ file, issues: [...this.issues] });
      }
    }

    return results;
  }

  // Audit page components
  async auditPageComponents(): Promise<AuditResult[]> {
    const pageFiles = await glob('app/**/*.tsx', { ignore: ['**/node_modules/**', '**/api/**'] });
    const results: AuditResult[] = [];

    for (const file of pageFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      this.issues = [];

      // Check for Prisma queries in server components
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Similar checks as API routes
        const model = this.extractModelFromQuery(line, lineNumber);
        if (model) {
          // Check subsequent lines for field usage
          for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
            const nextLine = lines[j];
            const fieldMatch = nextLine.match(/\.(\w+)(\s|\[|\(|,|;|$)/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              // Skip common methods
              if (!['map', 'filter', 'find', 'forEach', 'reduce', 'then', 'catch', 'json', 'ok', 'status'].includes(fieldName)) {
                this.checkField(model, fieldName, file, j + 1);
              }
            }
            if (nextLine.includes('}')) break;
          }
        }
      }

      if (this.issues.length > 0) {
        results.push({ file, issues: [...this.issues] });
      }
    }

    return results;
  }

  // Audit React components for prop type mismatches
  async auditComponents(): Promise<AuditResult[]> {
    const componentFiles = await glob('components/**/*.tsx', { ignore: ['**/node_modules/**'] });
    const results: AuditResult[] = [];

    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      this.issues = [];

      // Look for interface definitions that might represent database models
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for interface definitions
        const interfaceMatch = line.match(/interface\s+(\w+)\s*\{/);
        if (interfaceMatch) {
          const interfaceName = interfaceMatch[1];
          // Check if it matches a model name (case-insensitive)
          const matchingModel = this.modelNames.find((m) => m.toLowerCase() === interfaceName.toLowerCase());
          if (matchingModel) {
            // Check fields in the interface
            for (let j = i + 1; j < lines.length && !lines[j].includes('}'); j++) {
              const fieldLine = lines[j];
              const fieldMatch = fieldLine.match(/(\w+)(\??):\s*([^;]+)/);
              if (fieldMatch) {
                const fieldName = fieldMatch[1];
                const isOptional = fieldMatch[2] === '?';
                const fieldType = fieldMatch[3].trim();

                if (!fieldExists(matchingModel, fieldName)) {
                  this.addIssue(
                    file,
                    j + 1,
                    'warning',
                    `Interface field '${fieldName}' does not exist in model '${matchingModel}'`,
                    matchingModel,
                    fieldName
                  );
                } else {
                  // Check if optionality matches
                  const dbField = getModelFields(matchingModel).find((f) => f.name === fieldName);
                  if (dbField && dbField.isOptional !== isOptional) {
                    this.addIssue(
                      file,
                      j + 1,
                      'warning',
                      `Optionality mismatch: field '${fieldName}' is ${dbField.isOptional ? 'optional' : 'required'} in DB but ${isOptional ? 'optional' : 'required'} in interface`,
                      matchingModel,
                      fieldName
                    );
                  }
                }
              }
            }
          }
        }

        // Check for field access patterns
        const fieldAccessMatch = line.match(/(\w+)\.(\w+)/);
        if (fieldAccessMatch) {
          const objectName = fieldAccessMatch[1];
          const fieldName = fieldAccessMatch[2];
          // Try to infer model from context (this is heuristic)
          const modelMatch = this.modelNames.find((m) => {
            const lowerM = m.toLowerCase();
            return objectName.toLowerCase().includes(lowerM) || lowerM.includes(objectName.toLowerCase());
          });
          if (modelMatch && fieldExists(modelMatch, fieldName)) {
            // Field exists, but check if it's being used correctly
            // This is more of a validation pass
          }
        }
      }

      if (this.issues.length > 0) {
        results.push({ file, issues: [...this.issues] });
      }
    }

    return results;
  }

  // Generate audit report
  generateReport(apiResults: AuditResult[], pageResults: AuditResult[], componentResults: AuditResult[]): string {
    const allResults = [...apiResults, ...pageResults, ...componentResults];
    const totalIssues = allResults.reduce((sum, r) => sum + r.issues.length, 0);
    const errors = allResults.reduce((sum, r) => sum + r.issues.filter((i) => i.severity === 'error').length, 0);
    const warnings = allResults.reduce((sum, r) => sum + r.issues.filter((i) => i.severity === 'warning').length, 0);

    let report = `# Database Mapping Audit Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- Total Files Audited: ${allResults.length}\n`;
    report += `- Total Issues: ${totalIssues}\n`;
    report += `- Errors: ${errors}\n`;
    report += `- Warnings: ${warnings}\n\n`;

    report += `## Issues by File\n\n`;

    for (const result of allResults) {
      if (result.issues.length > 0) {
        report += `### ${result.file}\n\n`;
        for (const issue of result.issues) {
          report += `- **Line ${issue.line}** [${issue.severity.toUpperCase()}]: ${issue.message}\n`;
          if (issue.model) {
            report += `  - Model: ${issue.model}\n`;
          }
          if (issue.field) {
            report += `  - Field: ${issue.field}\n`;
          }
          if (issue.suggestion) {
            report += `  - Suggestion: ${issue.suggestion}\n`;
          }
          report += `\n`;
        }
      }
    }

    return report;
  }
}

// Main execution
async function main() {
  console.log('Starting database mapping audit...\n');

  const auditor = new DatabaseMappingAuditor();

  console.log('Auditing API routes...');
  const apiResults = await auditor.auditApiRoutes();
  console.log(`Found ${apiResults.length} files with issues in API routes`);

  console.log('Auditing page components...');
  const pageResults = await auditor.auditPageComponents();
  console.log(`Found ${pageResults.length} files with issues in page components`);

  console.log('Auditing React components...');
  const componentResults = await auditor.auditComponents();
  console.log(`Found ${componentResults.length} files with issues in components`);

  console.log('\nGenerating report...');
  const report = auditor.generateReport(apiResults, pageResults, componentResults);

  const reportPath = path.join(__dirname, '../docs/database-mapping-audit-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nAudit report written to: ${reportPath}`);

  // Also write JSON for programmatic access
  const jsonReport = {
    apiResults,
    pageResults,
    componentResults,
    generatedAt: new Date().toISOString(),
  };
  const jsonPath = path.join(__dirname, '../docs/database-mapping-audit-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`JSON report written to: ${jsonPath}`);
}

main().catch(console.error);

