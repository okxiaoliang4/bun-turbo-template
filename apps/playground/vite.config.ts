import path from 'node:path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@workspace/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  plugins: [react()],
})
