import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    include: ['test/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 180_000,
    fileParallelism: false,
  },
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
