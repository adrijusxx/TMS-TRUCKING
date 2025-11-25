/**
 * Script to help identify which API routes need to be updated
 * to support includeDeleted parameter for admin soft-delete visibility
 * 
 * Run this to see which routes filter by deletedAt: null
 */

import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

const API_ROUTES_DIR = path.join(process.cwd(), 'app', 'api');

async function findRoutesWithDeletedAtFilter() {
  const routeFiles = await glob('**/route.ts', { 
    cwd: API_ROUTES_DIR,
    absolute: true 
  });

  const routesWithDeletedFilter: Array<{
    file: string;
    line: number;
    context: string;
  }> = [];

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Check if file has deletedAt filter
    const hasDeletedAtFilter = content.includes('deletedAt: null') || 
                                content.includes('deletedAt:null');

    if (hasDeletedAtFilter) {
      // Find the line numbers
      lines.forEach((line, index) => {
        if (line.includes('deletedAt') && line.includes('null')) {
          const startLine = Math.max(0, index - 2);
          const endLine = Math.min(lines.length - 1, index + 2);
          const context = lines.slice(startLine, endLine + 1).join('\n');
          
          routesWithDeletedFilter.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            context: context.trim(),
          });
        }
      });
    }
  }

  return routesWithDeletedFilter;
}

async function main() {
  console.log('🔍 Finding API routes that filter by deletedAt: null...\n');
  
  const routes = await findRoutesWithDeletedAtFilter();
  
  // Group by directory
  const grouped: Record<string, typeof routes> = {};
  
  routes.forEach(route => {
    const dir = path.dirname(route.file);
    if (!grouped[dir]) {
      grouped[dir] = [];
    }
    grouped[dir].push(route);
  });

  console.log(`Found ${routes.length} locations in ${Object.keys(grouped).length} API routes\n`);
  
  Object.keys(grouped).sort().forEach(dir => {
    console.log(`\n📁 ${dir}`);
    grouped[dir].forEach(route => {
      console.log(`  Line ${route.line}: ${path.basename(route.file)}`);
    });
  });

  console.log('\n\n📝 Routes that need updating:');
  const uniqueFiles = [...new Set(routes.map(r => r.file))];
  uniqueFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
}

main().catch(console.error);




