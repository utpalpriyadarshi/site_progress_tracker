/**
 * fix-import-position.js
 *
 * The migration script inserted COLORS imports in the middle of multi-line
 * import statements (import { ...\n  ...\n} from '...').
 *
 * This script moves any misplaced COLORS import to the correct position:
 * after the last complete import block.
 */

const fs = require('fs');
const path = require('path');

const COLORS_IMPORT_RE = /^import \{ COLORS \} from '[^']+';$/m;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const match = content.match(COLORS_IMPORT_RE);
  if (!match) return false;

  const colorsLine = match[0];

  // Remove the misplaced import (wherever it is now)
  const withoutColors = content.replace(colorsLine + '\n', '').replace('\n' + colorsLine, '').replace(colorsLine, '');

  // Find the correct insertion point: after the last complete import block.
  // A complete import ends with a line that ends in ";".
  // We need to track multi-line imports carefully.
  const lines = withoutColors.split('\n');

  let lastCompleteImportLineIdx = -1;
  let inMultiLineImport = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (inMultiLineImport) {
      // Multi-line import ends with "} from '...';"
      if (trimmed.startsWith('}') && trimmed.includes('from ') && trimmed.endsWith(';')) {
        lastCompleteImportLineIdx = i;
        inMultiLineImport = false;
      }
      continue;
    }

    if (trimmed.startsWith('import ')) {
      if (trimmed.endsWith(';')) {
        // Single-line import
        lastCompleteImportLineIdx = i;
      } else if (trimmed.includes('{') && !trimmed.endsWith(';')) {
        // Start of a multi-line import
        inMultiLineImport = true;
      }
    } else if (lastCompleteImportLineIdx >= 0 && trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
      // Reached non-import code — stop scanning
      break;
    }
  }

  if (lastCompleteImportLineIdx === -1) {
    // No imports found — insert at top
    const fixed = colorsLine + '\n' + withoutColors;
    if (fixed !== content) { fs.writeFileSync(filePath, fixed, 'utf8'); return true; }
    return false;
  }

  lines.splice(lastCompleteImportLineIdx + 1, 0, colorsLine);
  const fixed = lines.join('\n');

  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    return true;
  }
  return false;
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

const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir, ['.ts', '.tsx'], ['node_modules']);

let fixed = 0;
for (const file of files) {
  if (fixFile(file)) {
    fixed++;
    console.log('  ✓', path.relative(srcDir, file));
  }
}
console.log(`\nFixed ${fixed} files.`);
