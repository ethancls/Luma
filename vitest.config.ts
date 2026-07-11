import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    env: {
      CONNECTION_ENCRYPTION_KEY: 'test-key-32-chars-minimum!!',
      BETTER_AUTH_SECRET: 'test-secret',
      BETTER_AUTH_URL: 'http://localhost:3000',
      DATABASE_URL: ':memory:',
      GUACD_HOST: 'localhost',
      GUACD_PORT: '4822',
    },
  },
});
