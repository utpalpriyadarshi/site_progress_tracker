/**
 * fix-jsx-color-attrs.js
 *
 * After migrate-colors.js, JSX prop assignments like:
 *   color='#2196F3'  →  color=COLORS.INFO   (broken)
 *
 * This script finds `attrName=COLORS.X` patterns (no braces) in .tsx files
 * and wraps them: `attrName={COLORS.X}`
 */

const fs = require('fs');
const path = require('path');

// Matches: word chars followed by = then COLORS. (no { before it)
// e.g.  color=COLORS.INFO  or  tintColor=COLORS.ERROR
// NOT: ={COLORS.  (already wrapped)
// NOT: ==COLORS.  (comparison)
// NOT: ===COLORS. (strict comparison)
// NOT: const x = COLORS. (space before COLORS in assignments)
const JSX_ATTR_RE = /([a-zA-Z_][a-zA-Z0-9_]*)=(?!\{|=|[ \t])COLORS\./g;

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('=COLORS.')) return false;

  // Fix: attrName=COLORS.X  →  attrName={COLORS.X}
  // We need to wrap the full COLORS.KEY token (may include nested like COLORS.STATUS_CLOSED)
  const fixed = content.replace(
    /([a-zA-Z_][a-zA-Z0-9_]*)=(?!\{|=|[ \t])(COLORS\.[A-Z_]+)/g,
    '$1={$2}'
  );

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
const files = walkDir(srcDir, ['.tsx', '.ts'], ['node_modules']);

let fixed = 0;
for (const file of files) {
  if (fixFile(file)) {
    fixed++;
    console.log('  ✓ fixed', path.relative(srcDir, file));
  }
}
console.log(`\nFixed ${fixed} files.`);
