import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('onnxruntime-web')) return 'onnxruntime';
              if (id.includes('three') || id.includes('@react-three')) return 'three';
              if (id.includes('astronomy-engine') || id.includes('satellite.js')) return 'astronomy';
              if (
                id.includes('react/') ||
                id.includes('react-dom') ||
                id.includes('scheduler') ||
                id.includes('motion/') ||
                id.includes('framer-motion')
              ) {
                return 'vendor';
              }
            }
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});