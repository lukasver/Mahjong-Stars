import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  splitting: true,
  entry: ['index.ts', 'client/index.ts', 'server/tiptap.ts'],
  format: ['esm'], // Add 'cjs' for CommonJS support
  dts: true,
  minify: true,
  outDir: 'dist',
  sourcemap: true,
  treeshake: true,
  // tsconfig: path.join(import.meta.dirname, 'tsconfig.build.json'),
  external: [],
  // Add these options for better CJS/ESM compatibility
  target: 'esnext',
  keepNames: true,
  // Generate separate CJS and ESM outputs
  // outExtension({ format }) {
  //   return {
  //     js: format === 'cjs' ? '.cjs' : '.mjs',
  //   };
  // },
});
