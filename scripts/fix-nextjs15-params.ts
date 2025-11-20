import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Files that still need fixing
const filesToFix = [
  'app/api/safety-configurations/[id]/route.ts',
  'app/api/work-order-types/[id]/route.ts',
  'app/api/tariffs/[id]/route.ts',
  'app/api/tags/[id]/route.ts',
  'app/api/tasks/[id]/route.ts',
  'app/api/projects/[id]/route.ts',
  'app/api/report-constructors/[id]/route.ts',
  'app/api/order-payment-types/[id]/route.ts',
  'app/api/expense-types/[id]/route.ts',
  'app/api/expense-categories/[id]/route.ts',
  'app/api/net-profit-formulas/[id]/route.ts',
];

async function fixFile(filePath: string) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix params type: { params: { id: string } } -> { params: Promise<{ id: string }> }
    const paramsPattern = /\(\s*request:\s*NextRequest,\s*\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}\s*\)/g;
    if (paramsPattern.test(content)) {
      content = content.replace(
        /\(\s*request:\s*NextRequest,\s*\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}\s*\)/g,
        '(request: NextRequest, { params }: { params: Promise<{ id: string }> })'
      );
      modified = true;
    }

    // Fix params.id usage - need to await params first
    const handlers = ['GET', 'PATCH', 'DELETE', 'POST', 'PUT'];
    for (const handler of handlers) {
      const handlerRegex = new RegExp(
        `(export async function ${handler}\\s*\\([^)]+\\)\\s*{)([\\s\\S]*?)(})(?=\\s*(?:export|$))`,
        'g'
      );
      content = content.replace(handlerRegex, (match, header, body, footer) => {
        // Check if params.id is used but params is not awaited
        if (body.includes('params.id') && !body.includes('await params') && !body.includes('const { id } = await params')) {
          // Add await params after session check
          const sessionCheckMatch = body.match(/(const session = await auth\(\);[^}]*?return[^}]*?401[^}]*?}[\s\S]*?})/);
          if (sessionCheckMatch) {
            const afterSessionCheck = sessionCheckMatch[0].length;
            const insertPos = body.indexOf(sessionCheckMatch[0]) + afterSessionCheck;
            
            // Insert await params after session check
            const beforeInsert = body.substring(0, insertPos);
            const afterInsert = body.substring(insertPos);
            
            // Replace all params.id with id
            const fixedBody = beforeInsert + '\n\n    const { id } = await params;\n' + afterInsert.replace(/params\.id/g, 'id');
            return header + fixedBody + footer;
          } else {
            // If no session check, add after first line
            const firstLineEnd = body.indexOf('\n');
            const beforeInsert = body.substring(0, firstLineEnd + 1);
            const afterInsert = body.substring(firstLineEnd + 1);
            const fixedBody = beforeInsert + '\n    const { id } = await params;\n' + afterInsert.replace(/params\.id/g, 'id');
            return header + fixedBody + footer;
          }
        }
        return match;
      });
    }

    // Fix error.errors -> error.issues
    if (content.includes('error.errors')) {
      content = content.replace(/error\.errors/g, 'error.issues');
      modified = true;
    }

    if (modified || content !== fs.readFileSync(filePath, 'utf-8')) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed ${filePath}`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing Next.js 15 params in route handlers...\n');

  const baseDir = process.cwd();
  let fixed = 0;
  let errors = 0;

  for (const file of filesToFix) {
    const fullPath = path.join(baseDir, file);
    if (fs.existsSync(fullPath)) {
      if (await fixFile(fullPath)) {
        fixed++;
      } else {
        console.log(`⚠ Skipped ${file} (no changes needed or already fixed)`);
      }
    } else {
      console.log(`⚠ File not found: ${file}`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} files`);
  if (errors > 0) {
    console.log(`❌ ${errors} errors`);
  }
}

main();

