import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: '字根 — รากอักษรจีน',
        short_name: '字根 ราก',
        description: 'จำตัวอักษรจีนด้วยการแตกเป็นรากศัพท์ — ราก ความหมาย ลำดับขีด และฝึกเขียน',
        lang: 'th',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ddd0b4',
        theme_color: '#b23a2c',
        categories: ['education', 'books'],
        icons: [
          { src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: './icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // json อยู่ในลิสต์ด้วยเพราะข้อมูลลำดับขีด (public/strokes/*.json) ต้องใช้ได้ตอนออฟไลน์
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // เสียงอ่านจีน — ข้อยกเว้นเดียวที่ยิงออกเน็ต
            // response เป็น opaque (status 0) จึงต้องระบุ statuses: [0, 200] ไม่งั้นแคชไม่ติด
            urlPattern: /^https:\/\/translate\.googleapis\.com\/translate_tts/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'zh-tts',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // ข้อมูลราก/ตัวอักษรแยกจากโค้ด — แก้ UI แล้วไม่ต้องโหลดข้อมูลใหม่
        manualChunks: (id) => (id.includes('/src/data/') ? 'data' : undefined),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
