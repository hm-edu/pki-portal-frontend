import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

const eslintConfig = defineConfig([
  ...nextVitals,
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {    
    languageOptions: {
      parserOptions: {
        projectService: true
      },
    },
    rules: {
      "@typescript-eslint/ban-tslint-comment": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'cypress/**',
    "api/**",
  ]),
]);

export default eslintConfig;
