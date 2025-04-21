import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/SimpleDragAndDrop.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify:true,
})
