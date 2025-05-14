import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      overlay: false
    }
  },
  resolve: {
    alias: {
      'cloudflare:sockets': fileURLToPath(new URL('./src/virtual-empty-module.js', import.meta.url))
    }
  },
  define: {
    'process.env.MAPBOX_TOKEN': JSON.stringify(process.env.MAPBOX_TOKEN),
    'process.env.NODE_DEBUG': false,
    'window.global': {},
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
});