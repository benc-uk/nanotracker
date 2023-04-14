//
// New flat configuration for ESLint
// Makefile sets ESLINT_USE_FLAT_CONFIG
//

export default [
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
    },

    rules: {
      'no-const-assign': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'dot-notation': 'error',
      eqeqeq: 'error',
      camelcase: 'error',
      'capitalized-comments': 'error',
      curly: 'error',
      'no-global-assign': 'error',
      'no-implicit-globals': 'error',
      'no-with': 'error',
    },
  },
]
