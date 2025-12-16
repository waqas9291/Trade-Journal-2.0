import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Using './' makes the app work on any repository name (Trade-Journal or Trade-Journal-2.0)
  base: './',
})
