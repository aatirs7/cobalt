const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    /**
     * Engine purity.
     *
     * src/engine must stay free of react, react native and expo so the whole
     * directory can be lifted into the Vercel cron unchanged when puzzle
     * generation moves server side. Enforcing it in lint rather than by
     * discipline is what makes that guarantee survive future edits.
     */
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'react-native', 'react-native/*', 'expo', 'expo-*', '@expo/*', '@/*'],
              message:
                'src/engine must stay pure so it can run unchanged in the Vercel cron. Move platform code to src/lib or src/state.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'src/engine must stay platform free.',
        },
      ],
    },
  },
  {
    /**
     * Design system integrity. Every string goes through the Text component so
     * it picks up the type scale and the palette, and the theme is a stored
     * user choice so the OS color scheme is never read.
     */
    files: ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text'],
              message: 'Use @/components/Text so type scale and palette tokens are applied.',
            },
            {
              name: 'react-native',
              importNames: ['useColorScheme'],
              message:
                'The theme is a stored user choice, base spec section 2.2. There is no auto dark mode.',
            },
          ],
        },
      ],
    },
  },
  {
    /**
     * Base spec section 2.5 permits exactly two haptic events in the whole app,
     * routed through src/lib/haptics.ts. Section 2.5 also bans spring physics,
     * bounce and overshoot outright.
     */
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/haptics.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-haptics',
              message: 'Use the haptics wrapper in @/lib/haptics, which gates on the user setting.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='withSpring']",
          message: 'Base spec 2.5: no spring physics, no bounce, no scale up overshoot.',
        },
        {
          selector: "MemberExpression[object.name='Animated'][property.name='spring']",
          message: 'Base spec 2.5: no spring physics, no bounce, no scale up overshoot.',
        },
      ],
    },
  },
  {
    // The Text component is the one place allowed to reach the underlying primitive.
    files: ['src/components/Text.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
