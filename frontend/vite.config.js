import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:3001';

  // GitHub Pages 배포 시 저장소 이름을 base로 설정
  // 로컬 개발 시에는 '/'
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
            react:    ['react','react-dom'],
            recharts: ['recharts'],
          },
        },
      },
    },
  };
});