import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This must match your GitHub repository name exactly:
  // If your link is https://waqas9291.github.io/Trade-Journal/ then this must be '/Trade-Journal/'
  base: '/Trade-Journal/',
})
