import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://whisperbox.koyeb.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Add this to avoid CORS preflight issues
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://whisperbox.koyeb.app');
          });
        }
      }
    }
  }
})