import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'my-sajuapp',
  brand: {
    displayName: '사주 스포일러',
    primaryColor: '#7B61FF',
    icon: 'https://static.toss.im/appsintoss/24697/55a77319-617b-4c24-9930-8a783532f9b5.png',
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
