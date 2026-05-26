import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
<<<<<<< HEAD
      // Only define process.env.NODE_ENV - used by @vercel/analytics and React
=======
      // Only define process.env.NODE_ENV — used by @vercel/analytics and React
>>>>>>> 874b7cf (Improve David pastoral voice delivery)
      // internals for dev/prod code paths. All other process.env.* references in
      // dependencies fall through to the window.process polyfill in index.html,
      // which preserves their typeof guards correctly.
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native': 'react-native-web',
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
