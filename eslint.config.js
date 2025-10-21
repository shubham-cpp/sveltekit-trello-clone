import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default antfu(
  {
    svelte: true,
    typescript: true,
    stylistic: true,
    unicorn: true,
  },
  ...compat.extends('plugin:drizzle/all'),
  {
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    rules: {
      // Start with recommended warnings (less disruptive)
      ...betterTailwindcss.configs['recommended-error'].rules,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app.css',
      },
    },
  },
)
