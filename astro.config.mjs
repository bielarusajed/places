// @ts-check
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],

  output: 'server',
  adapter: vercel({}),
});
