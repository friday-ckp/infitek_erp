import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // Workaround: @vitejs/plugin-react v6.0.1 + Vite 8 dev mode fails to inject
    // the React Refresh preamble, causing "$RefreshSig$ is not defined" (issue #33).
    command === 'serve' && {
      name: 'react-refresh-preamble-fix',
      transformIndexHtml: {
        order: 'pre' as const,
        handler() {
          return [
            {
              tag: 'script',
              attrs: { type: 'module' },
              children: [
                `import RefreshRuntime from '/@react-refresh'`,
                `RefreshRuntime.injectIntoGlobalHook(window)`,
                `window.$RefreshReg$ = () => {}`,
                `window.$RefreshSig$ = () => (type) => type`,
                `window.__vite_plugin_react_preamble_installed__ = true`,
              ].join('\n'),
            },
          ]
        },
      },
    },
  ].filter(Boolean),
  resolve: {
    conditions: ['module', 'import', 'default'],
  },
  server: {
    allowedHosts: [
      'jeans-systematic-instances-ballet.trycloudflare.com',
      'courses-apr-sponsor-recall.trycloudflare.com',
      'infitek-erp-web-20260602.loca.lt',
      'occurred-eventually-podcast-sense.trycloudflare.com',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
}))
