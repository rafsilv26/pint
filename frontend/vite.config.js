import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config//
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // O Bootstrap ainda usa funções de cor antigas (red()/green()/blue()/if())
        // que o Dart Sass 1.101+ marca como deprecated — funcionam na mesma,
        // isto só silencia o "spam" de avisos no build.
        silenceDeprecations: ['color-functions', 'import', 'global-builtin'],
        quietDeps: true,
      },
    },
  },
})
