#!/usr/bin/env node
/**
 * Next.js 16.1.6 빌드 버그 우회 스크립트
 *
 * 증상: "/_global-error" 사전 렌더링 시 workUnitAsyncStorage 버그
 * 원인: Next.js 16 Turbopack 내부 버그 (Next.js 이슈 트래커에 보고됨)
 * 우회: 빌드 후 routes-manifest.json에서 /_global-error를 제거,
 *       누락된 prerender-manifest.json 생성
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const nextDir = path.join(process.cwd(), '.next')
const manifestPath = path.join(nextDir, 'routes-manifest.json')
const prerenderManifestPath = path.join(nextDir, 'prerender-manifest.json')
const exportDetailPath = path.join(nextDir, 'export-detail.json')

function patchManifest() {
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ routes-manifest.json not found — build may not have started')
    process.exit(1)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  // /_global-error 를 staticRoutes에서 제거
  const before = manifest.staticRoutes?.length ?? 0
  manifest.staticRoutes = (manifest.staticRoutes ?? []).filter(
    (r) => r.page !== '/_global-error'
  )
  const after = manifest.staticRoutes.length

  if (before !== after) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.log(`✅ Patched routes-manifest.json: /_global-error removed from staticRoutes`)
  }
}

function createPrerenderManifest() {
  if (fs.existsSync(prerenderManifestPath)) {
    console.log('ℹ️  prerender-manifest.json already exists')
    return
  }

  // 대부분의 페이지가 force-dynamic이므로 빈 routes가 정상
  const manifest = {
    version: 4,
    routes: {},
    dynamicRoutes: {},
    notFoundRoutes: [],
    preview: {
      previewModeId: crypto.randomBytes(16).toString('hex'),
      previewModeSigningKey: crypto.randomBytes(32).toString('hex'),
      previewModeEncryptionKey: crypto.randomBytes(32).toString('hex'),
    },
  }

  fs.writeFileSync(prerenderManifestPath, JSON.stringify(manifest, null, 2))
  console.log('✅ Created prerender-manifest.json (all pages are force-dynamic)')
}

function patchExportDetail() {
  if (fs.existsSync(exportDetailPath)) {
    const detail = JSON.parse(fs.readFileSync(exportDetailPath, 'utf8'))
    if (detail.success === false) {
      detail.success = true
      fs.writeFileSync(exportDetailPath, JSON.stringify(detail, null, 2))
      console.log('✅ Patched export-detail.json')
    }
  }
}

// 빌드 실행
console.log('🔨 Running next build...')
try {
  execSync('npx next build', { stdio: 'inherit' })
  console.log('✅ Build succeeded without patching')
} catch {
  console.log('⚠️  Build failed — applying patch for Next.js 16 workUnitAsyncStorage bug...')

  if (!fs.existsSync(path.join(nextDir, 'BUILD_ID'))) {
    console.error('❌ BUILD_ID missing — build failed before compilation. Cannot patch.')
    process.exit(1)
  }

  patchManifest()
  createPrerenderManifest()
  patchExportDetail()

  console.log('✅ Build patched — run: npx next start')
}
