import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/**/*.entity.ts',
        'src/**/*.controller.ts',
        'src/**/*.strategy.ts',
        'src/**/*.decorator.ts',
        'src/**/*.interceptor.ts',
        'src/**/*.filter.ts',
        'src/**/*.helper.ts',
        'src/main.ts',
        'src/**/*.d.ts',
        'src/__tests__/**',
        'src/prisma/**',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },
});