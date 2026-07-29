import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // Base path for GitHub Pages subpath deployment (/KingdomOfChrist/)
  const baseUrl = process.env.BASE_URL || (process.env.GITHUB_ACTIONS ? '/KingdomOfChrist/' : '/');

  return {
    base: baseUrl,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: false,
    },
  };
});
