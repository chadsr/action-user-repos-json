import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['./src/index.ts'],
    dts: false,
    shims: true,
    skipNodeModulesBundle: true,
    clean: true,
    target: 'node20',
    platform: 'node',
    minify: false,
    bundle: true,
    // https://github.com/egoist/tsup/issues/619
    noExternal: [/(.*)/],
    splitting: false,
});
