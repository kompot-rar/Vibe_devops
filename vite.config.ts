import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: env.VITE_API_TARGET || 'http://10.0.10.11:8080',
            changeOrigin: true,
          },
        },
      },
      plugins: [
        react(),
        nodePolyfills({
          include: ['buffer', 'process'],
          globals: {
            Buffer: true,
            process: true,
          },
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
