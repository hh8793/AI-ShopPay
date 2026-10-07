import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 子路径部署（https://hh8793.github.io/AI-ShopPay/）
  base: '/AI-ShopPay/',
  server: {
    host: true,
    port: 5173,
  },
})