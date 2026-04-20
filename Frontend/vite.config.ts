import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/files': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
