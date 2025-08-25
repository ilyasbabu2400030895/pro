import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: 'pro',  // Replace with your actual repo name
  plugins: [react()],
})
