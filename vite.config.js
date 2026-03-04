import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://toss-saju.vercel.app',
        changeOrigin: true,
        timeout: 90000,
        proxyTimeout: 90000,
      },
    },
  },
})
