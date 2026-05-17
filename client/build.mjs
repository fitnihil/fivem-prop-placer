import { build, context } from "esbuild";

const opts = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    platform: 'node',
    target: 'es2020',
    outfile: 'dist/client.js',
    logLevel: 'info',
};

if (process.argv.includes('--watch')) {
    const ctx = await context(opts);
    await ctx.watch();
} else {
    await build(opts);
}
