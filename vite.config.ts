import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: { proxy: {
    '/aion-api/search': { target: 'https://api-search.plaync.com', changeOrigin: true, rewrite: (p) => p.replace('/aion-api/search', '/aion2global/search/v2/character').replace('nick=', 'keyword=') + '&localeInfo=pt-BR' },
    '/aion-api/info': { target: 'https://aion2.plaync.com', changeOrigin: true, rewrite: (p) => p.replace('/aion-api/info', '/api/character/info') + '&lang=pt-BR' },
    '/aion-api/equipment': { target: 'https://aion2.plaync.com', changeOrigin: true, rewrite: (p) => p.replace('/aion-api/equipment', '/api/character/equipment') + '&lang=pt-BR' },
  }},
  test: { exclude: ['e2e/**', 'node_modules/**', 'dist/**'] },
})
