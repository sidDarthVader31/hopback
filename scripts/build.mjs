// Bundles the content script and assembles the unpacked extension in dist/.
import { build, context, transform } from 'esbuild';
import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const watch = process.argv.includes('--watch');
const BUDGET_BYTES = 20 * 1024;

/** `import css from './x.css?inline'` -> minified CSS as a string (matches Vite's behaviour in tests). */
const inlineCss = {
  name: 'inline-css',
  setup(b) {
    b.onResolve({ filter: /\.css\?inline$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?inline$/, '')),
      namespace: 'inline-css',
    }));
    b.onLoad({ filter: /.*/, namespace: 'inline-css' }, async (args) => {
      const source = await readFile(args.path, 'utf8');
      const { code } = await transform(source, { loader: 'css', minify: true });
      return { contents: code, loader: 'text', watchFiles: [args.path] };
    });
  },
};

const options = {
  entryPoints: [path.join(root, 'src/content.ts'), path.join(root, 'src/background.ts')],
  outdir: dist,
  bundle: true,
  format: 'iife',
  target: 'chrome110',
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  legalComments: 'none',
  plugins: [inlineCss],
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'manifest.json'), path.join(dist, 'manifest.json'));
await cp(path.join(root, 'icons'), path.join(dist, 'icons'), { recursive: true });

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching for changes…');
} else {
  await build(options);
  const { size } = await stat(path.join(dist, 'content.js'));
  console.log(`dist/content.js  ${(size / 1024).toFixed(1)} KB (budget ${BUDGET_BYTES / 1024} KB)`);
  if (size > BUDGET_BYTES) {
    console.error('Bundle is over the size budget.');
    process.exit(1);
  }
}
