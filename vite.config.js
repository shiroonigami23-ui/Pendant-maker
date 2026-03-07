import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three_vendor: ['three'],
          pdf_vendor: ['jspdf']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
