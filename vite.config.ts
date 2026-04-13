import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages hostet unter /tilgungsrechner/ – der base-Path sorgt dafür,
  // dass alle Asset-URLs korrekt aufgelöst werden. Für lokale Entwicklung
  // (npm run dev) hat das keinen Einfluss.
  base: '/tilgungsrechner/',
  server: {
    host: true, // listen on 0.0.0.0 so phones im selben WLAN zugreifen können
  },
})
