import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Cargar todas las variables de entorno (incluyendo VITE_)
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 3002,
        strictPort: true, // Falla si 3002 está ocupado
        host: '0.0.0.0',
        // 🔗 Proxy para rutas API al backend Express
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            rewrite: (path) => path // Mantiene la ruta igual
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
