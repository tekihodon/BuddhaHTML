import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist'
  }
});