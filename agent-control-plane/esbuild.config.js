/**
 * esbuild Configuration for Fast Development Builds
 *
 * This configuration provides:
 * - Ultra-fast development builds (10-50x faster than tsc)
 * - Incremental rebuilds
 * - Source maps for debugging
 * - No type checking (use tsc --noEmit for that)
 */

import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read package.json to extract dependencies
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

// External packages (don't bundle dependencies)
const external = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
  // Node built-ins
  'fs',
  'path',
  'crypto',
  'stream',
  'util',
  'events',
  'http',
  'https',
  'net',
  'tls',
  'zlib',
  'os',
  'buffer',
  'process',
  'url',
  'querystring',
  'child_process',
  'worker_threads',
  'perf_hooks',
  'async_hooks',
  // Native modules (must be external)
  'onnxruntime-node',
  'better-sqlite3',
  'sharp',
  '*.node',
];

/**
 * Development build configuration
 */
export const devConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  external,
  sourcemap: true,
  minify: false,
  keepNames: true,
  logLevel: 'info',
  loader: {
    '.node': 'copy', // Copy .node files to output
  },
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['src/reasoningbank/prompts/**/*'],
          to: ['dist/reasoningbank/prompts'],
        },
        {
          from: ['src/reasoningbank/config/**/*'],
          to: ['dist/reasoningbank/config'],
        },
      ],
    }),
  ],
};

/**
 * Production build configuration
 */
export const prodConfig = {
  ...devConfig,
  minify: true,
  sourcemap: 'external',
  logLevel: 'info',
  treeShaking: true,
  metafile: true, // Generate build metadata
};

/**
 * CLI build configuration (for bin files)
 */
export const cliConfig = {
  entryPoints: ['src/cli-proxy.ts', 'src/agentdb/cli/agentdb-cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  outExtension: { '.js': '.js' },
  external,
  sourcemap: true,
  minify: false,
  keepNames: true,
  logLevel: 'info',
};

// Build function for programmatic use
export async function buildDev() {
  console.log('🚀 Starting esbuild development build...');
  const start = Date.now();

  try {
    // Build main entry point
    const result = await esbuild.build(devConfig);

    // Build CLI tools
    await esbuild.build(cliConfig);

    const duration = Date.now() - start;
    console.log(`✅ Development build complete in ${duration}ms`);

    if (result.metafile) {
      const analysis = await esbuild.analyzeMetafile(result.metafile);
      console.log(analysis);
    }

    return result;
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

export async function buildProd() {
  console.log('🚀 Starting esbuild production build...');
  const start = Date.now();

  try {
    const result = await esbuild.build(prodConfig);

    // Build CLI tools
    await esbuild.build({
      ...cliConfig,
      minify: true,
    });

    const duration = Date.now() - start;
    console.log(`✅ Production build complete in ${duration}ms`);

    if (result.metafile) {
      const analysis = await esbuild.analyzeMetafile(result.metafile);
      console.log(analysis);
    }

    return result;
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Watch mode for development
export async function watch() {
  console.log('👀 Starting esbuild watch mode...');

  const ctx = await esbuild.context({
    ...devConfig,
    logLevel: 'info',
  });

  await ctx.watch();
  console.log('Watching for changes...');
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2] || 'dev';

  switch (mode) {
    case 'dev':
      buildDev();
      break;
    case 'prod':
      buildProd();
      break;
    case 'watch':
      watch();
      break;
    default:
      console.error('Unknown mode:', mode);
      console.log('Usage: node esbuild.config.js [dev|prod|watch]');
      process.exit(1);
  }
}
