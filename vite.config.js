import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Main entry chunk is ~750 kB raw (191 kB gzip) after splitting Monaco/recharts/radix/modals
    // — 2× smaller than the original 386 kB gzip. Further reduction requires component-level splits.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-monaco': ['@monaco-editor/react'],
          'vendor-radix': ['cmdk', '@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-popover', '@radix-ui/react-tooltip'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
