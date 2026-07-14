import { fileURLToPath, URL } from 'node:url'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolvePath('src/main/index.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolvePath('src/main/preload.ts')
      }
    }
  },
  renderer: {
    root: resolvePath('src/renderer'),
    build: {
      rollupOptions: {
        input: resolvePath('src/renderer/index.html')
      }
    },
    resolve: {
      alias: {
        '@renderer': resolvePath('src/renderer'),
        '@shared': resolvePath('src/shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
