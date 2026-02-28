import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.tsx'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.d.ts',
                'src/messages/**/*',
                'src/i18n/**/*',
                'src/middleware.ts',
                'src/components/ui/**/*' // shadcn components are usually considered external/library code
            ]
        },
        server: {
            deps: {
                inline: ['next', 'next-intl'],
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/tests': path.resolve(__dirname, './tests'),
        },
    },
});
