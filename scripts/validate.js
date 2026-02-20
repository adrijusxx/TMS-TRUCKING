/**
 * Pre-deploy validation script
 * Catches Prisma schema mismatches, TypeScript errors, and common runtime bugs
 * Run: npm run validate
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'prisma', 'schema.prisma');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const colors = {
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
};

function findTSFiles(dir) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.next', 'dist', '.git'].includes(entry.name)) {
        results.push(...findTSFiles(full));
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        results.push(full);
      }
    }
  } catch (_) {}
  return results;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

// ─── Schema Parser ────────────────────────────────────────────────────────────

function parseSchema() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const models = {};
  let currentModel = null;

  for (const line of schema.split('\n')) {
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      models[currentModel] = new Set();
      continue;
    }
    if (currentModel && line.trim() === '}') {
      currentModel = null;
      continue;
    }
    if (currentModel) {
      const fieldMatch = line.trim().match(/^(\w+)\s+/);
      if (fieldMatch && !fieldMatch[1].startsWith('@@') && !fieldMatch[1].startsWith('//')) {
        models[currentModel].add(fieldMatch[1]);
      }
    }
  }

  // Build camelCase → PascalCase lookup (prisma.user → User)
  const camelToModel = {};
  for (const name of Object.keys(models)) {
    const camel = name.charAt(0).toLowerCase() + name.slice(1);
    camelToModel[camel] = name;
  }

  return { models, camelToModel };
}

// ─── Check 1: TypeScript Compilation ──────────────────────────────────────────

function checkTypeScript() {
  const label = 'TypeScript Compilation';
  try {
    execSync('npx tsc --noEmit 2>&1', { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    return { label, pass: true, errors: [], warnings: [] };
  } catch (e) {
    const output = e.stdout || e.stderr || '';
    // Filter out validator.ts errors (generated file)
    const lines = output.split('\n').filter(l =>
      l.includes('error TS') && !l.includes('validator.ts')
    );
    if (lines.length === 0) {
      return { label, pass: true, errors: [], warnings: [] };
    }
    return {
      label,
      pass: false,
      errors: lines.slice(0, 20).map(l => '  ' + l.trim()),
      warnings: lines.length > 20 ? [`  ... and ${lines.length - 20} more`] : [],
    };
  }
}

// ─── Check 2: Prisma Schema Validation ────────────────────────────────────────

function checkPrismaSchema() {
  const label = 'Prisma Schema Validation';
  const errors = [];
  const warnings = [];
  const { models, camelToModel } = parseSchema();

  const dirs = ['app', 'lib', 'components'].map(d => path.join(ROOT, d));
  const files = dirs.flatMap(findTSFiles);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const rel = relative(file);

    // Find all top-level prisma calls and check for deletedAt directly on models that lack it
    // Pattern: prisma.modelName.findMany({ where: { deletedAt: ... } })
    // We track brace depth to distinguish top-level where fields from nested relation fields
    const prismaCallRegex = /prisma\.(\w+)\.(findMany|findFirst|findUnique|count|updateMany|deleteMany|aggregate|groupBy)\s*\(/g;
    let match;
    while ((match = prismaCallRegex.exec(content)) !== null) {
      // Skip if this match is inside a comment
      const beforeMatch = content.slice(0, match.index);
      const matchLineStart = beforeMatch.lastIndexOf('\n') + 1;
      const matchLineText = content.slice(matchLineStart, match.index);
      if (matchLineText.trimStart().startsWith('//') || matchLineText.trimStart().startsWith('*')) continue;

      const camelModel = match[1];
      const pascalModel = camelToModel[camelModel];
      if (!pascalModel || models[pascalModel].has('deletedAt')) continue;

      // Find the line number of this prisma call
      const beforeCall = content.slice(0, match.index);
      const callLine = beforeCall.split('\n').length;

      // Scan forward from the call to find deletedAt at the top level of the where clause
      // We track brace depth: depth 0 = inside the method args, depth 1 = inside where: {}
      const afterCall = content.slice(match.index + match[0].length);
      let depth = 1; // We're already past the opening (
      let inWhere = false;
      let whereDepth = -1;
      let pos = 0;
      let foundDeletedAt = false;

      while (pos < afterCall.length && pos < 2000) {
        const ch = afterCall[pos];
        if (ch === '{' || ch === '(' || ch === '[') depth++;
        if (ch === '}' || ch === ')' || ch === ']') {
          depth--;
          if (depth <= 0) break; // End of method call
        }

        // Detect where: { at the top level of the call (depth 2 after {)
        if (!inWhere && depth === 2 && afterCall.slice(pos).startsWith('where')) {
          inWhere = true;
          whereDepth = depth;
        }

        // If we're in the where block at the direct model level (not nested in a relation)
        if (inWhere && depth === whereDepth + 1) {
          if (afterCall.slice(pos).match(/^deletedAt\s*[,:]/)) {
            foundDeletedAt = true;
            break;
          }
        }

        // If we've left the where block
        if (inWhere && depth < whereDepth) {
          inWhere = false;
        }

        pos++;
      }

      if (foundDeletedAt) {
        const deletedAtLine = callLine + content.slice(beforeCall.length, beforeCall.length + match[0].length + pos).split('\n').length - 1;
        errors.push(`  ${rel}:${deletedAtLine} — "${pascalModel}" model has no deletedAt field`);
      }
    }

    // Check for dynamic prisma model access (runtime risk)
    // Skip files that intentionally use dynamic access for generic entity operations
    const dynamicAccessAllowlist = [
      'bulk-actions/route.ts',
      'RestoreService.ts',
      'TelegramMessageProcessor.ts',
    ];
    const isDynamicAllowed = dynamicAccessAllowlist.some(f => rel.includes(f));
    if (!isDynamicAllowed) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('prisma[') && !lines[i].trim().startsWith('//')) {
          warnings.push(`  ${rel}:${i + 1} — Dynamic prisma model access (not type-safe)`);
        }
      }
    }
  }

  // Validate RestoreService ENTITY_CONFIG if it exists
  const restorePath = path.join(ROOT, 'lib', 'services', 'RestoreService.ts');
  if (fs.existsSync(restorePath)) {
    const restoreContent = fs.readFileSync(restorePath, 'utf8');
    const entityMatches = restoreContent.matchAll(/model:\s*'(\w+)'/g);
    for (const match of entityMatches) {
      const modelName = match[1];
      const pascalModel = camelToModel[modelName];
      if (!pascalModel) {
        errors.push(`  RestoreService — model "${modelName}" does not exist in Prisma schema`);
      } else if (!models[pascalModel].has('deletedAt')) {
        errors.push(`  RestoreService — model "${modelName}" (${pascalModel}) has no deletedAt field`);
      }
    }
  }

  return { label, pass: errors.length === 0, errors, warnings };
}

// ─── Check 3: Common Error Scanner ───────────────────────────────────────────

function checkCommonErrors() {
  const label = 'Common Error Scanner';
  const errors = [];
  const warnings = [];

  const dirs = ['app', 'lib', 'components'].map(d => path.join(ROOT, d));
  const files = dirs.flatMap(findTSFiles);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const rel = relative(file);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // distance field on Load (removed)
      if (line.includes('distance: true') && !line.trim().startsWith('//')) {
        errors.push(`  ${rel}:${i + 1} — "distance" field removed from Load, use totalMiles`);
      }
      if (line.includes('load.distance') && !line.includes('totalDistance') && !line.trim().startsWith('//')) {
        errors.push(`  ${rel}:${i + 1} — load.distance doesn't exist, use load.totalMiles`);
      }

      // Next.js 16 params must be Promise
      if (line.includes('{ params }: { params: {') &&
          line.includes(': string } }') &&
          !line.includes('Promise<') &&
          (file.includes('[id]') || file.includes('[driverId]') || file.includes('[entity]'))) {
        errors.push(`  ${rel}:${i + 1} — Next.js 16 requires params to be Promise<...>`);
      }

      // Zod v4: error.errors → error.issues
      if (line.includes('error.errors') && content.includes('ZodError') && !line.trim().startsWith('//')) {
        warnings.push(`  ${rel}:${i + 1} — Zod v4 uses error.issues not error.errors`);
      }
    }
  }

  return { label, pass: errors.length === 0, errors, warnings };
}

// ─── Check 4: API Route Analysis ─────────────────────────────────────────────

function checkApiRoutes() {
  const label = 'API Route Analysis';
  const errors = [];
  const warnings = [];

  const apiDir = path.join(ROOT, 'app', 'api');
  const files = findTSFiles(apiDir).filter(f => f.endsWith('route.ts') || f.endsWith('route.tsx'));

  // Files allowed to use dynamic prisma access (generic entity operation handlers)
  const apiDynamicAllowlist = ['bulk-actions/route.ts'];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = relative(file);
    const isAllowlisted = apiDynamicAllowlist.some(f => rel.includes(f));

    // Check for @ts-ignore near prisma calls (skip allowlisted files)
    if (!isAllowlisted && content.includes('@ts-ignore') && content.includes('prisma')) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('@ts-ignore') && i + 1 < lines.length && lines[i + 1].includes('prisma')) {
          warnings.push(`  ${rel}:${i + 1} — @ts-ignore on Prisma call (runtime error risk)`);
        }
      }
    }

    // Check for (prisma[...] as any) — unsafe dynamic access (skip allowlisted files)
    if (!isAllowlisted && content.includes('as any') && content.includes('prisma[')) {
      warnings.push(`  ${rel} — "prisma[...] as any" pattern (not type-safe)`);
    }

    // Check that route exports at least one HTTP method
    const hasHandler = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/m.test(content)
      || /export\s+(const|let)\s+\{?\s*(GET|POST|PUT|PATCH|DELETE)/m.test(content)
      || /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/m.test(content)
      || /export\s+\{[^}]*(GET|POST|PUT|PATCH|DELETE)/m.test(content);
    if (!hasHandler) {
      warnings.push(`  ${rel} — No HTTP method handler exported`);
    }
  }

  return { label, pass: errors.length === 0, errors, warnings };
}

// ─── Check 5: Environment Variables ───────────────────────────────────────────

function checkEnvVars() {
  const label = 'Environment Variables';
  const errors = [];
  const warnings = [];

  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
  const recommended = ['NEXTAUTH_URL', 'OPENAI_API_KEY', 'GOOGLE_MAPS_API_KEY'];

  for (const v of required) {
    if (!process.env[v]) {
      errors.push(`  Missing required: ${v}`);
    }
  }
  for (const v of recommended) {
    if (!process.env[v]) {
      warnings.push(`  Missing recommended: ${v}`);
    }
  }

  return { label, pass: errors.length === 0, errors, warnings };
}

// ─── Runner ───────────────────────────────────────────────────────────────────

function run() {
  const skipEnv = process.argv.includes('--skip-env');
  const skipTs = process.argv.includes('--skip-ts');

  console.log(colors.bold('\n=== TMS Pre-Deploy Validation ===\n'));

  const checks = [];

  if (!skipEnv) checks.push(checkEnvVars);
  if (!skipTs) checks.push(checkTypeScript);
  checks.push(checkPrismaSchema);
  checks.push(checkCommonErrors);
  checks.push(checkApiRoutes);

  let totalErrors = 0;
  let totalWarnings = 0;
  let failures = 0;

  for (const check of checks) {
    const start = Date.now();
    const result = check();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    const status = result.pass
      ? colors.green(`[PASS]`)
      : colors.red(`[FAIL]`);

    const errCount = result.errors.length;
    const warnCount = result.warnings.length;
    const detail = [];
    if (errCount) detail.push(colors.red(`${errCount} error${errCount > 1 ? 's' : ''}`));
    if (warnCount) detail.push(colors.yellow(`${warnCount} warning${warnCount > 1 ? 's' : ''}`));

    console.log(`${status} ${result.label} ${detail.length ? `(${detail.join(', ')})` : ''} ${colors.cyan(`[${elapsed}s]`)}`);

    for (const e of result.errors) console.log(colors.red(e));
    for (const w of result.warnings) console.log(colors.yellow(w));

    totalErrors += errCount;
    totalWarnings += warnCount;
    if (!result.pass) failures++;
  }

  console.log(colors.bold(`\n─── Summary ───`));
  const total = checks.length;
  const passed = total - failures;

  if (failures === 0) {
    console.log(colors.green(`All ${total} checks passed.`));
    if (totalWarnings > 0) {
      console.log(colors.yellow(`${totalWarnings} warning${totalWarnings > 1 ? 's' : ''} (non-blocking).`));
    }
    console.log('');
    process.exit(0);
  } else {
    console.log(colors.red(`${failures} FAILED, ${passed} passed | ${totalErrors} error${totalErrors > 1 ? 's' : ''}, ${totalWarnings} warning${totalWarnings > 1 ? 's' : ''}`));
    console.log('');
    process.exit(1);
  }
}

run();
