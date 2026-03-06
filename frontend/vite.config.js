import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function spaStaticFallbackPlugin() {
  const routes = ['signup', 'sigup', 'login', 'dashboard']

  return {
    name: 'spa-static-fallback',
    apply: 'build',
    async closeBundle() {
      const distDir = path.join(__dirname, 'dist')
      const indexPath = path.join(distDir, 'index.html')

      let indexHtml
      try {
        indexHtml = await readFile(indexPath, 'utf8')
      } catch {
        return
      }

      await Promise.all(
        routes.map(async (route) => {
          const routeDir = path.join(distDir, route)
          await mkdir(routeDir, { recursive: true })
          await writeFile(path.join(routeDir, 'index.html'), indexHtml, 'utf8')
        })
      )

      console.log(`Generated static SPA fallbacks for: ${routes.join(', ')}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
     react(),
     tailwindcss(),
     spaStaticFallbackPlugin(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
