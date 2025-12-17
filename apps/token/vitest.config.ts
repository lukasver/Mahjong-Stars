import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import tsConfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.test.local', override: true });

console.log('ACA=', process.env.EXCHANGE_RATES_API_URL);

export default defineConfig({
  // @ts-ignore -- types mismatch between versions
  plugins: [tsConfigPaths(), react()],
  test: {
    globals: true,
    passWithNoTests: true,
    // setupFiles: './__tests__/setup-tests.ts',
    css: false,
    outputFile: {
      json: 'coverage/report.json',
    },
    coverage: {
      reporter: ['text', 'json', 'html', 'text-summary'],
      include: ['__tests__/**/*.ts', '__tests__/**/*.tsx'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    },
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    // TODO: should mock the response from the thirdweb sdk instead of using a client
    exclude: ['__tests__/profiles.test.ts'],
    include: [
      '__tests__/amount.service.test.ts',
      '__tests__/currencies.test.ts',
      '__tests__/sales.test.ts',
      '__tests__/repositories/validator.test.ts',
      '__tests__/repositories/transactions.test.ts',
      '__tests__/crons.test.ts',
    ],
    // include: ['__tests__/**/?(*.)test.?(c|m)[jt]s?(x)'],
    environment: 'node',
  },
  define: {
    'process.env': process.env,
  },
});
