import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  // Especificar dónde buscar el archivo .env (raíz del proyecto)
  envDir: path.resolve(__dirname),
  envPrefix: 'VITE_',
  build: {
    outDir: '../../dist-electron/renderer',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@renderer': path.resolve(__dirname, 'src/renderer')
    }
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: false
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'jotai'],
    exclude: ['firebase']
  }
});

