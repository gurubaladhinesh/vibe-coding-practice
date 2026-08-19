import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    pool: 'threads',
  },
  server: {
    proxy: {
      '/graphql': {
        target: 'https://api.github.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
