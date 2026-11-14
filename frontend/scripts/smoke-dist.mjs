#!/usr/bin/env node
/**
 * Production build smoke test. Runs after `vite build`; fails the build if:
 *  - dist/index.html is missing or references an asset that does not exist,
 *  - dist/index.html references any remote (http/https) URL,
 *  - any bundled JS/CSS references a remote asset host (CDN),
 *  - or a remote font is shipped (fonts must be local system fonts).
 *
 * FireSight is an offline tool: the runtime must never fetch from the network.
 * Data URLs inside the bundle are allowed; external fetches are not.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, extname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const failures = []
const fail = (message) => failures.push(message)

if (!existsSync(join(dist, 'index.html'))) {
  fail('dist/index.html is missing — run npm run build first')
} else {
  const html = readFileSync(join(dist, 'index.html'), 'utf8')

  // Every local asset referenced by the HTML must exist in dist/.
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = match[1]
    if (/^https?:\/\//i.test(ref)) {
      fail(`dist/index.html references remote URL: ${ref}`)
      continue
    }
    const clean = ref.split('#')[0].split('?')[0]
    if (!clean || clean.startsWith('data:')) continue
    const target = join(dist, clean.replace(/^\//, ''))
    if (!existsSync(target)) {
      fail(`dist/index.html references missing asset: ${clean}`)
    }
  }
}

const REMOTE_HOST_PATTERNS = [
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
  /unpkg\.com/,
  /cdnjs\.cloudflare\.com/,
  /cdn\.jsdelivr\.net/,
  /fastly\.jsdelivr\.net/,
  /use\.typekit\.net/,
  /esm\.sh/,
]

// Documented, surgical allowances. Each entry must name the exact pattern and
// why it is unreachable at runtime. Reviewers: do not widen this without a
// comment explaining the dead code path.
const ALLOWLIST = [
  {
    // The jsdelivr reference lives inside Plotly's Mapbox GL marker loader
    // (scattermap/map trace family). FireSight renders only scatter and
    // parcoords traces — no map trace types are ever constructed, so this
    // string is unreachable dead code in the bundle.
    fileSuffix: 'assets/plotly.min-',
    host: /cdn\.jsdelivr\.net/,
    reason: 'Plotly Mapbox GL marker loader; dead code path for this app',
  },
]

function allowlisted(rel, pattern) {
  return ALLOWLIST.some(
    (entry) =>
      rel.replaceAll('\\', '/').includes(entry.fileSuffix) &&
      pattern.source === entry.host.source,
  )
}

const TEXT_EXTENSIONS = new Set(['.html', '.js', '.mjs', '.css', '.map', '.json', '.txt'])

function collect(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) out.push(...collect(full))
    else if (TEXT_EXTENSIONS.has(extname(entry).toLowerCase())) out.push(full)
  }
  return out
}

if (existsSync(dist)) {
  for (const file of collect(dist)) {
    const content = readFileSync(file, 'utf8')
    const rel = relative(dist, file).replaceAll('\\', '/')
    for (const pattern of REMOTE_HOST_PATTERNS) {
      if (pattern.test(content) && !allowlisted(rel, pattern)) {
        fail(`${rel} references remote asset host ${pattern}`)
      }
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`SMOKE FAIL: ${failure}`)
  }
  process.exit(1)
}
console.log(`Smoke check: dist/ OK (${collect(dist).length} text assets scanned)`)
