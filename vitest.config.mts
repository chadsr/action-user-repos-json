import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

export default defineConfig({
    test: {
        include: ['test/*.test.ts'],
        testTimeout: 60_000,
        hookTimeout: 60_000,
        reporters: process.env.GITHUB_ACTIONS
            ? ['dot', 'github-actions']
            : ['dot'],
        env: {
            ...config({ path: '.test.env' }).parsed,
        },
    },
});
