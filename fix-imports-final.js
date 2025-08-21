#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to check and fix
const patterns = [
  'app/**/*.ts',
  'app/**/*.tsx',
  'components/**/*.ts',
  'components/**/*.tsx',
  'lib/**/*.ts',
];

function globFiles(patterns) {
  const { execSync } = require('child_process');
  const files = [];

  for (const pattern of patterns) {
    try {
      const result = execSync(`find . -path "./${pattern}" -type f`, {
        encoding: 'utf8',
      });
      files.push(
        ...result
          .trim()
          .split('\n')
          .filter(f => f)
      );
    } catch (e) {
      // Ignore errors
    }
  }

  return files;
}

function fixImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let fixed = content;
  let changed = false;

  // Fix imports that should use createServerSupabase
  if (fixed.includes("from '@/lib/supabase/server'")) {
    const newFixed = fixed.replace(
      /import\s*\{\s*createClient\s*\}\s*from\s*['"]@\/lib\/supabase\/server['"]/g,
      "import { createServerSupabase } from '@/lib/supabase/server'"
    );
    if (newFixed !== fixed) {
      fixed = newFixed;
      changed = true;
    }

    // Replace usage
    const usageFixed = fixed.replace(
      /createClient\(/g,
      'createServerSupabase('
    );
    if (usageFixed !== fixed) {
      fixed = usageFixed;
      changed = true;
    }
  }

  // Fix imports that should use createServiceSupabase
  if (fixed.includes("from '@/lib/supabase/service'")) {
    const newFixed = fixed.replace(
      /import\s*\{\s*createClient\s*\}\s*from\s*['"]@\/lib\/supabase\/service['"]/g,
      "import { createServiceSupabase } from '@/lib/supabase/service'"
    );
    if (newFixed !== fixed) {
      fixed = newFixed;
      changed = true;
    }

    // Also fix the wrong import name
    const wrongImport = fixed.replace(
      /import\s*\{\s*createServiceSupabase\s*\}\s*from\s*['"]@\/lib\/supabase\/service['"]/g,
      "import { createServiceSupabase } from '@/lib/supabase/service'"
    );
    if (wrongImport !== fixed) {
      fixed = wrongImport;
      changed = true;
    }
  }

  // Fix imports that should use createClientSupabase
  if (fixed.includes("from '@/lib/supabase/client'")) {
    const newFixed = fixed.replace(
      /import\s*\{\s*createClient\s*\}\s*from\s*['"]@\/lib\/supabase\/client['"]/g,
      "import { createClientSupabase } from '@/lib/supabase/client'"
    );
    if (newFixed !== fixed) {
      fixed = newFixed;
      changed = true;
    }

    // Replace usage
    const usageFixed = fixed.replace(
      /createClient\(/g,
      'createClientSupabase('
    );
    if (usageFixed !== fixed) {
      fixed = usageFixed;
      changed = true;
    }
  }

  // Fix utils.ts specifically
  if (filePath.includes('lib/supabase/utils.ts')) {
    const utilsFixed = fixed.replace(
      /import\s*\{\s*createClient\s*as\s*createBrowserClient\s*\}\s*from\s*['"]\.\/client['"]/g,
      "import { createClientSupabase as createBrowserClient } from './client'"
    );
    if (utilsFixed !== fixed) {
      fixed = utilsFixed;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, fixed);
    console.log(`Fixed: ${filePath}`);
    return true;
  }

  return false;
}

// Fix all files
console.log('Fixing import issues...');
const files = globFiles(patterns);
let fixedCount = 0;

for (const file of files) {
  const fullPath = path.resolve(file);
  if (fixImportsInFile(fullPath)) {
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} files`);
console.log('Done!');
