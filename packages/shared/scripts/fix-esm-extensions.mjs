import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const distRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && extname(entry.name) === '.js') files.push(path);
  }
  return files;
}

async function resolveSpecifier(sourceFile, specifier) {
  if (!specifier.startsWith('.') || /\.(?:js|mjs|cjs|json)$/.test(specifier)) return specifier;
  const base = resolve(dirname(sourceFile), specifier);
  try {
    if ((await stat(`${base}.js`)).isFile()) return `${specifier}.js`;
  } catch {}
  try {
    if ((await stat(join(base, 'index.js'))).isFile()) return `${specifier}/index.js`;
  } catch {}
  return specifier;
}

const files = await walk(distRoot);
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const rewritten = await replaceAsync(
    source,
    /((?:from\s+|import\s*\(\s*)['"])(\.\.?\/[^'"]+)(['"])/g,
    async (match, prefix, specifier, suffix) => `${prefix}${await resolveSpecifier(file, specifier)}${suffix}`,
  );
  if (rewritten !== source) await writeFile(file, rewritten);
}

async function replaceAsync(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)];
  if (matches.length === 0) return source;
  let output = '';
  let cursor = 0;
  for (const match of matches) {
    output += source.slice(cursor, match.index);
    output += await replacer(...match);
    cursor = match.index + match[0].length;
  }
  return output + source.slice(cursor);
}
