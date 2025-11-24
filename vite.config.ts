import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 确保相对路径正确，这对于 GitHub Pages 很重要
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});