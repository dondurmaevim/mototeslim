import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/sms': {
        target: 'https://api.netgsm.com.tr',
        changeOrigin: true,
        rewrite: () => '/sms/send/get/',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // body'yi geç
          })
        }
      }
    }
  }
})