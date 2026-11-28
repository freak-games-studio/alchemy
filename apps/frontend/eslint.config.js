// @ts-check

import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  markdown: true,
  yaml: true,

  // features disabled
  jsx: false,
  toml: false,
  pnpm: false,

  formatters: {
    css: true,
    prettierOptions: {
      plugins: ['prettier-plugin-css-order'],
    },
  },

  stylistic: {
    indent: 2,
    jsx: false,
    overrides: {
      'style/implicit-arrow-linebreak': ['error', 'beside'],
      'style/nonblock-statement-body-position': ['error', 'beside'],
      'style/brace-style': 'error',
    },
  },
  rules: {
    // yaml
    'yaml/indent': ['error', 2],

    // js
    'no-nested-ternary': 'error',
    'unicorn/no-useless-undefined': 'error',
    'max-params': ['error', 3],
    'ts/no-unused-expressions': [
      'error',
      {
        allowTernary: false,
      },
    ],

    // vue
    'vue/max-attributes-per-line': [
      'error',
      {
        singleline: {
          max: 1,
        },
        multiline: {
          max: 1,
        },
      },
    ],
    'vue/block-order': [
      'error',
      {
        order: ['template', 'script', 'style'],
      },
    ],
    'vue/first-attribute-linebreak': [
      'error',
      {
        singleline: 'beside',
        multiline: 'below',
      },
    ],
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/define-props-destructuring': [
      'error',
      {
        destructure: 'never',
      },
    ],
    'vue/define-macros-order': [
      'error',
      {
        order: [
          'defineOptions',
          'defineProps',
          'defineModel',
          'defineEmits',
          'defineSlots',
        ],
        defineExposeLast: true,
      },
    ],
    'vue/no-required-prop-with-default': 'error',
    'vue/v-on-event-hyphenation': 'error',
    'vue/prefer-true-attribute-shorthand': 'error',
    'vue/require-macro-variable-name': 'error',
    'vue/enforce-style-attribute': [
      'error',
      {
        allow: ['scoped'],
      },
    ],

    // imports
    'perfectionist/sort-imports': [
      'error',
      {
        type: 'line-length',
        order: 'asc',
        internalPattern: ['^@/'],
        fallbackSort: { type: 'line-length' },
        ignoreCase: true,
        newlinesBetween: 0,
        groups: [
          ['default-value-builtin', 'default-value-external'],
          ['named-value-builtin', 'named-value-external'],
          'default-type-import',
          'named-type-import',
          { newlinesBetween: 1 },
          'default-value-internal',
          ['default-value-parent', 'default-value-sibling', 'default-value-index'],
          'named-value-internal',
          ['named-value-parent', 'named-value-sibling', 'named-value-index'],
          'default-type-internal',
          ['default-type-parent', 'default-type-sibling', 'default-type-index'],
          'named-type-internal',
          ['named-type-parent', 'named-type-sibling', 'named-type-index'],
          { newlinesBetween: 1 },
          'unknown',
          'ts-equals-import',
        ],
      },
    ],
    'perfectionist/sort-named-imports': [
      'error',
      {
        type: 'alphabetical',
        order: 'asc',
        ignoreCase: true,
      },
    ],

    // off
    'no-else-return': 'error',
    'no-cond-assign': 'off',
    'node/prefer-global/process': 'off',
    'no-template-curly-in-string': 'off',
    'antfu/no-top-level-await': 'off',
    'antfu/if-newline': 'off',
    'ts/method-signature-style': 'off',
    'ts/no-redeclare': 'off',
    'ts/consistent-type-definitions': 'off',
    'ts/ban-ts-comment': 'off',
    'vue/custom-event-name-casing': 'off',
    'regexp/no-super-linear-backtracking': 'off',
    'regexp/no-obscure-range': 'off',
  },
}, {
  files: ['src/game/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/features', '@/features/**'],
            message: 'Игра не зависит от экранов.',
          },
        ],
      },
    ],
  },
}, {
  files: ['src/shared/**/*.{ts,vue}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '@/game',
              '@/game/**',
              '@/features',
              '@/features/**',
            ],
            message: 'Общий код не зависит от игры и экранов.',
          },
        ],
      },
    ],
  },
}, {
  files: ['src/features/**/*.{ts,vue}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '@/features',
              '@/features/**',
              '../about',
              '../about/**',
              '../board',
              '../board/**',
              '../catalog',
              '../catalog/**',
              '../confirm',
              '../confirm/**',
              '../dock',
              '../dock/**',
              '../guide',
              '../guide/**',
              '../recipe-editor',
              '../recipe-editor/**',
              '../settings',
              '../settings/**',
              '../toast',
              '../toast/**',
            ],
            message: 'Экраны не импортируют соседние экраны. Каталог может вкладывать справку об элементе.',
          },
        ],
      },
    ],
  },
}, {
  files: ['src/features/catalog/**/*.{ts,vue}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              '@/features/board',
              '@/features/board/**',
              '@/features/confirm',
              '@/features/confirm/**',
              '@/features/dock',
              '@/features/dock/**',
              '@/features/guide',
              '@/features/guide/**',
              '@/features/recipe-editor',
              '@/features/recipe-editor/**',
              '@/features/settings',
              '@/features/settings/**',
              '@/features/toast',
              '@/features/toast/**',
              '../board',
              '../board/**',
              '../confirm',
              '../confirm/**',
              '../dock',
              '../dock/**',
              '../guide',
              '../guide/**',
              '../recipe-editor',
              '../recipe-editor/**',
              '../settings',
              '../settings/**',
              '../toast',
              '../toast/**',
            ],
            message: 'Каталог вкладывает только справку об элементе.',
          },
        ],
      },
    ],
  },
}, {
  files: ['src/domain/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'vue',
            message: 'Домен рецептов не зависит от Vue.',
          },
          {
            name: '@vueuse/core',
            message: 'Домен рецептов не зависит от Vue.',
          },
        ],
        patterns: [
          {
            group: [
              '@/game',
              '@/game/**',
              '@/features',
              '@/features/**',
              '@vueuse/*',
              '../game',
              '../game/**',
              '../features',
              '../features/**',
            ],
            message: 'Домен рецептов не зависит от Vue и интерфейса.',
          },
        ],
      },
    ],
  },
})
