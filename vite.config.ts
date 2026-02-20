import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5000,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/webhook-test': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    __HMR_CONFIG_NAME__: JSON.stringify('default'),
  },
})