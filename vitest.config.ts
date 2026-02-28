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
            include: [
                'src/components/layout/public-navbar.tsx',
                'src/components/layout/public-footer.tsx',
                'src/app/[locale]/about/page.tsx',
                'src/app/[locale]/contact/page.tsx',
                'src/components/enrollment/**/*',
                'src/components/dashboard/alumni/**/*',
                'src/components/dashboard/harmonia/pricing-settings.tsx',
                'src/components/dashboard/branches/**/*'
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
