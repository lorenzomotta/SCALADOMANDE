import { defineConfig } from 'vite';

export default defineConfig({
  base: '/SCALADOMANDE/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
});
