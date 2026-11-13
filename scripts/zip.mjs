// Packages dist/ into release/hopback-<version>.zip, with manifest.json at the root of the archive.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(readFileSync(path.join(root, 'dist/manifest.json'), 'utf8'));
const out = path.join(root, 'release', `hopback-${version}.zip`);

mkdirSync(path.dirname(out), { recursive: true });
rmSync(out, { force: true });
execFileSync('zip', ['-r', '-X', '-q', out, '.', '-x', '.*', '-x', '*/.*'], { cwd: path.join(root, 'dist') });
console.log(`release/hopback-${version}.zip`);
