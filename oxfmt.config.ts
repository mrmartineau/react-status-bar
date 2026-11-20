import kit from '@mrmartineau/kit/oxfmt' with { type: 'json' }

export default {
  ...kit,
  ignorePatterns: [
    'dist',
    'demo/dist',
    'demo/node_modules',
    '**/*.astro',
    '**/*.md',
    '**/*.mdx',
    '**/*.yml',
    '**/*.yaml',
    '**/*.html',
  ],
}
