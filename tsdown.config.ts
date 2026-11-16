import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/SimpleDragAndDrop.ts'],
  format: ['esm'],
  platform: 'browser',
  dts: true,
  clean: true,
  minify: true,
})
