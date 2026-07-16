const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const nextPlugin = require('@next/eslint-plugin-next');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.config(nextPlugin.configs.recommended),
  reactHooksPlugin.configs['flat'].recommended,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/naming-convention': [
        'warn',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'memberLike', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] },
        { selector: 'objectLiteralProperty', format: null },
        { selector: 'objectLiteralMethod', format: null },
        { selector: 'import', format: null },
      ],
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**', '.prisma/**', 'next-env.d.ts'],
  },
);
