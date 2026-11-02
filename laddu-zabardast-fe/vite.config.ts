import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),

      'next/navigation': path.resolve(__dirname, 'src/shims/next/navigation.ts'),
      'next/image': path.resolve(__dirname, 'src/shims/next/image.tsx'),
      'next/server': path.resolve(__dirname, 'src/shims/next/server.ts'),
      'next/link': path.resolve(__dirname, 'src/shims/next/link.tsx'),
    },
  },
  optimizeDeps: {
    include: ['react-router-dom'],
  },
  server: { port: 7000 },
  build: { outDir: 'dist' },
});

