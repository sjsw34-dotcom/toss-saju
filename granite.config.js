import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'unmyung-saju',
  brand: {
    displayName: '운명테라피 사주',
    primaryColor: '#7B61FF',
    icon: '',
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
