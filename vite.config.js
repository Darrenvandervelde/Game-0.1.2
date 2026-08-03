/*
defineConfig is a helper function used in JavaScript and TypeScript configuration files to provide code auto-completion, 
type-checking, and hints in your editor without needing extra comments. 
It does nothing special when the code runs; it just passes your settings right through
*/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
