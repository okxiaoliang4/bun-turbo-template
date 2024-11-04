import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/index.css'],
  format: ['esm', 'cjs'],
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false,
  dts: true,
})
