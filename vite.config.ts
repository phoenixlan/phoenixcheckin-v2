import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["checkin.dev.phoenixlan.no"],
    hmr: {
      port: 3001
    }
  }
})
