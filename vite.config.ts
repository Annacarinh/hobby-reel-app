import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths in the built index.html for drag-and-drop deployment
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',
        // For other assets, if you want them flat in dist or in an assets subfolder
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      }
    },
    // sourcemap: true, // Optional: for easier debugging in production, but increases bundle size
  }
});