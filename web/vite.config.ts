import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward /api requests to the local Laravel server. Lets the whole app be served from one address,
    // which is what a tunnel (phone testing over HTTPS) needs: run with VITE_API_URL=/api so no cross-origin calls happen.
    proxy: { '/api': 'http://localhost:8000' },
    // Dev server refuses unknown Host headers by default; allow Cloudflare quick-tunnel addresses for phone testing.
    allowedHosts: ['.trycloudflare.com'],
  },
})
