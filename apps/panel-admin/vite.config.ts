import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      'process.env.CLOUDFLARE_R2_ACCOUNT_ID': JSON.stringify(env.CLOUDFLARE_R2_ACCOUNT_ID),
      'process.env.CLOUDFLARE_R2_ACCESS_KEY_ID': JSON.stringify(env.CLOUDFLARE_R2_ACCESS_KEY_ID),
      'process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY': JSON.stringify(env.CLOUDFLARE_R2_SECRET_ACCESS_KEY),
      'process.env.CLOUDFLARE_R2_BUCKET_NAME': JSON.stringify(env.CLOUDFLARE_R2_BUCKET_NAME),
      'process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL': JSON.stringify(env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL),
    },
    plugins: [
      tailwindcss(),
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "next/navigation": path.resolve(__dirname, "./src/lib/next-compat.tsx"),
        "next/link": path.resolve(__dirname, "./src/lib/next-compat.tsx"),
      },
    },
  }
})
