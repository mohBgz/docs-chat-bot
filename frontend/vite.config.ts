import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'X-Frame-Options': 'ALLOWALL', // Allow iframe embedding
      'Access-Control-Allow-Origin': '*', // Allow CORS (if needed)
    },
  },
})