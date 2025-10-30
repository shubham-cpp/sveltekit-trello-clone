import path from 'node:path'
import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    experimental: {
      remoteFunctions: true,
    },
    alias: {
      $ui: path.resolve('src/lib/components/ui'),
      $db: path.resolve('src/lib/server/db'),
    },
  },
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
}

export default config
