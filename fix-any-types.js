#!/usr/bin/env node

const fs = require('fs');

// Files and fixes to apply
const fixes = [
  {
    file: 'app/api/data-quality/variants/[canonical_id]/route.ts',
    replacements: [
      { from: 'variants.map(variant =>', to: 'variants.map((variant: any) =>' },
      { from: '.map(v =>', to: '.map((v: any) =>' },
    ],
  },
  {
    file: 'app/api/fragrances/[id]/similar/route.ts',
    replacements: [{ from: '.map(f =>', to: '.map((f: any) =>' }],
  },
  {
    file: 'app/api/fragrances/route.ts',
    replacements: [{ from: '.map(f =>', to: '.map((f: any) =>' }],
  },
  {
    file: 'app/api/search/filters/route.ts',
    replacements: [
      { from: '.map(item =>', to: '.map((item: any) =>' },
      { from: '.filter(brand =>', to: '.filter((brand: any) =>' },
    ],
  },
];

fixes.forEach(({ file, replacements }) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(
          new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          to
        );
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Fixed: ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Done fixing any types!');
