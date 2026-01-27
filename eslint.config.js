import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tsParser from 'vue-eslint-parser'
import tsPlugin from 'typescript-eslint'

export default [
  // Base JavaScript rules
  js.configs.recommended,

  // Vue 3 recommended rules
  ...pluginVue.configs['flat/essential'],

  // TypeScript recommended rules
  ...tsPlugin.configs.recommended,

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        history: 'readonly',
        location: 'readonly'
      }
    }
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsPlugin.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  },

  // Node.js scripts (config, scripts directories)
  {
    files: ['config/**/*.js', 'scripts/**/*.js', '*.config.js', '*.config.ts'],
    languageOptions: {
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly'
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off'
    }
  },

  {
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Vue specific rules
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'off',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
      'no-undef': 'off' // TypeScript handles this
    }
  },

  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'public/**',
      'static/**',
      'coverage/**',
      '.nyc_output/**'
    ]
  }
]
