import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'NestDev',
  short_name: 'NeD',
  version: '1.0.0',
  description: '개발자를 위한 로컬 우선 Chrome 새 탭 대시보드',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  permissions: ['bookmarks', 'tabs', 'storage', 'favicon', 'search'],
  host_permissions: ['http://localhost/*', 'http://127.0.0.1/*'],
  chrome_url_overrides: {
    newtab: 'index.html',
  },
})
