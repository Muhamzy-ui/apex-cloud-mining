import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 7 + React 19 config
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    minify: 'terser',
  },
  define: {
    'process.env': {},
  },
})