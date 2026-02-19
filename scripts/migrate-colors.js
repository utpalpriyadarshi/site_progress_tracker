/**
 * migrate-colors.js
 *
 * Phase 1: Replace hardcoded brand/semantic/status color strings with
 * COLORS.* constants from src/theme/colors.ts.
 *
 * Scope: only definitive semantic colors — NOT generic greys/whites.
 * Run: node scripts/migrate-colors.js
 */

const fs = require('fs');
const path = require('path');

// ── Replacement map: exact string → COLORS key ──────────────────────────────
// Ordered longest-first so more specific hex values match before shorter ones.
const REPLACEMENTS = [
  // Brand purples
  ["'#E8D5F2'", 'COLORS.PRIMARY_LIGHT'],
  ["'#4527A0'", 'COLORS.PRIMARY_DARK'],
  ["'#673AB7'", 'COLORS.PRIMARY'],
  // Semantic backgrounds
  ["'#E8F5E9'", 'COLORS.SUCCESS_BG'],
  ["'#FFF3E0'", 'COLORS.WARNING_BG'],
  ["'#FFEBEE'", 'COLORS.ERROR_BG'],
  ["'#E3F2FD'", 'COLORS.INFO_BG'],
  // Semantic foregrounds
  ["'#4CAF50'", 'COLORS.SUCCESS'],
  ["'#FF9800'", 'COLORS.WARNING'],
  ["'#F44336'", 'COLORS.ERROR'],
  ["'#2196F3'", 'COLORS.INFO'],
  // Neutral / disabled
  ["'#9E9E9E'", 'COLORS.DISABLED'],
  // Status-specific
  ["'#9C27B0'", 'COLORS.STATUS_EVALUATED'],
  ["'#607D8B'", 'COLORS.STATUS_CLOSED'],
];

// Also handle double-quoted variants
const ALL_REPLACEMENTS = [
  ...REPLACEMENTS,
  ...REPLACEMENTS.map(([hex, key]) => [hex.replace(/'/g, '"'), key]),
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeThemePath(filePath) {
  // filePath is absolute; src/theme/colors.ts is the target.
  const srcDir = path.join(__dirname, '..', 'src');
  const themeFile = path.join(srcDir, 'theme', 'colors');
  const fileDir = path.dirname(filePath);
  let rel = path.relative(fileDir, themeFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function addImport(content, importPath) {
  const importLine = `import { COLORS } from '${importPath}';`;

  // Already imported?
  if (content.includes("from '../theme/colors'") ||
      content.includes("from '../../theme/colors'") ||
      content.includes("from '../../../theme/colors'") ||
      content.includes("from '../../../../theme/colors'") ||
      content.includes("from './theme/colors'") ||
      content.includes("{ COLORS }")) {
    return content;
  }

  // Insert after the last existing import block
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('import ')) lastImportIdx = i;
  }

  if (lastImportIdx === -1) {
    return importLine + '\n' + content;
  }

  lines.splice(lastImportIdx + 1, 0, importLine);
  return lines.join('\n');
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Check if this file has any of the target colors
  const hasTarget = ALL_REPLACEMENTS.some(([hex]) => content.includes(hex));
  if (!hasTarget) return { changed: false };

  // Apply replacements
  for (const [hex, key] of ALL_REPLACEMENTS) {
    // Use global replace — split/join is safer than regex for literal strings
    while (content.includes(hex)) {
      content = content.replace(hex, key);
    }
  }

  // Add import
  const importPath = getRelativeThemePath(filePath);
  content = addImport(content, importPath);

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { changed: true };
  }
  return { changed: false };
}

function walkDir(dir, extensions, exclude) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!exclude.includes(entry.name)) results.push(...walkDir(full, extensions, exclude));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir, ['.ts', '.tsx'], ['node_modules', '__tests__']);

let changed = 0;
let skipped = 0;

for (const file of files) {
  // Skip the colors file itself and backup files
  if (file.includes('theme/colors') || file.includes('_Phase3_backup')) {
    skipped++;
    continue;
  }
  const result = migrateFile(file);
  if (result.changed) {
    changed++;
    console.log('  ✓', path.relative(srcDir, file));
  }
}

console.log(`\nDone. ${changed} files updated, ${skipped} skipped.`);
