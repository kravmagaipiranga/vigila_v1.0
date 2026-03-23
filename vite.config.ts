import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'VIGILA',
          short_name: 'VIGILA',
          description: 'Segurança Pessoal Estratégica',
          theme_color: '#141414',
          background_color: '#141414',
          display: 'standalone',
          icons: [
            {
              src: 'https://raw.githubusercontent.com/kravmagaipiranga/vigila/5913bbe85976c4203320be5cf9ec67c3613c752e/icon.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://raw.githubusercontent.com/kravmagaipiranga/vigila/5913bbe85976c4203320be5cf9ec67c3613c752e/icon.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
