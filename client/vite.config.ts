import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://www.wicksandwax.in',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://www.wicksandwax.in',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
