import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'my-sajuapp',
  brand: {
    displayName: '사주 스포일러',
    primaryColor: '#7B61FF',
    icon: 'https://toss-saju.vercel.app/logo.svg',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
  webViewProps: {
    type: 'partner',
  },
});
