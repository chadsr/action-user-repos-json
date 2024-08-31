import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
    {
        ignores: ['dist'],
    },
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    eslintConfigPrettier,
    eslintPluginPrettierRecommended,
);
