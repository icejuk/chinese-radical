import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-maskable.svg'],
      manifest: {
        name: 'Mandarin Trail — แผนที่คำจีน',
        short_name: 'Mandarin Trail',
        description: 'สำรวจต้นไม้คำจีน พร้อมพินอิน ไทย เสียง ประโยค ทบทวน ฝึกพูดและเขียน',
        lang: 'th',
        id: './',
        start_url: './#map',
        scope: './',
        display: 'standalone',
        background_color: '#101624',
        theme_color: '#101624',
        categories: ['education', 'books'],
        icons: [
          { src: './icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: './icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'แผนที่คำ', short_name: 'แผนที่', url: './#map', icons: [{ src: './icon.svg', sizes: 'any' }] },
          { name: 'คำสู่ประโยค', short_name: 'ประโยค', url: './#sentences', icons: [{ src: './icon.svg', sizes: 'any' }] },
          { name: 'ฝึกพูด', short_name: 'พูด', url: './#speaking', icons: [{ src: './icon.svg', sizes: 'any' }] },
        ],
      },
      workbox: {
        // json อยู่ในลิสต์ด้วยเพราะข้อมูลลำดับขีด (public/strokes/*.json) ต้องใช้ได้ตอนออฟไลน์
        globPatterns: ['**/*.{js,css,html,svg,woff2,json,TXT}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // แบบฝึกเขียนฉบับล่าสุดจากแอป Chinese Study — ถ้าออฟไลน์ UI ยังมี bundled fallback
            urlPattern: /^https:\/\/chinese\.icejuk\.dev\/api\/writing-exercises\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'chinese-study-exercises',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // เสียงอ่านจีน — ข้อยกเว้นเดียวที่ยิงออกเน็ต
            // response เป็น opaque (status 0) จึงต้องระบุ statuses: [0, 200] ไม่งั้นแคชไม่ติด
            urlPattern: /^https:\/\/translate\.googleapis\.com\/translate_tts/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'zh-tts',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 180 },
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
