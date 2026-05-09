import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:3001';

  // GitHub Pages 배포 시 레포 이름 기반 base path 설정
  // VITE_BASE_PATH 가 지정되지 않으면 '/' (로컬/Vercel), 
  // GitHub Actions에서 VITE_BASE_PATH=/linkforge/ 로 주입됨
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            react:    ['react', 'react-dom'],
            recharts: ['recharts'],
          },
        },
      },
    },
  };
});