import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true,
    },
  },
  // Add this to ensure CSS is properly handled
  css: {
    devSourcemap: true,
  },
  // Ensure the build handles CSS correctly
  build: {
    sourcemap: true,
  },
});