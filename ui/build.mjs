import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
copyFileSync('src/index.html', 'dist/index.html');

const watch = process.argv.includes('--watch');

const esbuildOpts = {
    entryPoints: ['src/main.tsx'],
    bundle: true,
    outfile: 'dist/bundle.js',
    jsx: 'automatic',
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    target: 'es2020',
    logLevel: 'info',
    minify: !watch,
};

if (watch) {
    const ctx = await context(esbuildOpts);
    await ctx.watch();
} else {
    await build(esbuildOpts);
}