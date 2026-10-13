import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// ── Adresse publique du site (à changer ici le jour où le site a son propre nom de domaine) ──
const ADRESSE_SITE = 'https://nilsprofgrenoble.github.io/simulations-chimie/'
const BASE = new URL(ADRESSE_SITE).pathname           // « /simulations-chimie/ » (ou « / » avec un nom de domaine)
const SUPABASE_DEFAUT = 'https://pqgzlklnynbkgiwmbzdj.supabase.co'
const GOATCOUNTER = 'https://labochimie.goatcounter.com'

// Politique de sécurité du contenu : le navigateur refuse tout script, toute connexion ou tout cadre
// qui ne vient pas d'une des sources listées. Protège les sessions des élèves si une faille d'injection apparaissait.
function securite(env) {
  const supabase = new URL(env.VITE_SB_URL || SUPABASE_DEFAUT).origin
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'",                 // 'unsafe-eval' : exigé par Plotly 1.58 dès son chargement (vérifié)
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: " + GOATCOUNTER,
    "font-src 'self' data:",
    "connect-src 'self' " + supabase,
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'securite-et-referencement',
    apply: 'build',
    transformIndexHtml: html => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
    // Plan du site pour les moteurs de recherche (une adresse par simulation, sauf les pages de compte)
    generateBundle() {
      const app = readFileSync(new URL('./src/App.jsx', import.meta.url), 'utf8')
      const ids = [...app.matchAll(/\{\s*id:\s*(\d+),\s*label:\s*"/g)].map(m => Number(m[1])).filter(id => id !== 39 && id !== 40)
      const jour = new Date().toISOString().slice(0, 10)
      const url = id => (id ? `${ADRESSE_SITE}?sim=${id}` : ADRESSE_SITE)
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        [0, ...ids].map(id => `  <url><loc>${url(id).replace(/&/g, '&amp;')}</loc><lastmod>${jour}</lastmod></url>`).join('\n') + '\n</urlset>\n'
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${ADRESSE_SITE}sitemap.xml\n` })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), securite(env)],
    base: BASE,
  }
})
