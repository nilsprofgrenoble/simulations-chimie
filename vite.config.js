import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { lireSimulations } from './scripts/lireSimulations.mjs'
import { aAdressePropre, cheminSimulation, SANS_ADRESSE_PROPRE } from './src/slugs.js'
import { referencementSimulation, ADRESSE_SITE, NOM_SITE } from './src/referencement.js'

// ── Adresse publique du site : à changer dans src/referencement.js le jour où le site change de nom de domaine ──
const BASE = new URL(ADRESSE_SITE).pathname           // « /simulations-chimie/ » (ou « / » avec un nom de domaine)
const SUPABASE_DEFAUT = 'https://pqgzlklnynbkgiwmbzdj.supabase.co'
const GOATCOUNTER = 'https://labochimie.goatcounter.com'

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Page statique d'une simulation : copie de l'index.html construit, dont le <head> porte déjà (sans JavaScript) le titre, la description,
// l'adresse canonique et les données structurées de CETTE simulation. L'application React se charge ensuite exactement comme sur l'accueil
// et affiche la simulation lue dans l'adresse (voir getInitialId dans src/App.jsx).
function pageDeSimulation(indexHtml, s) {
  const r = referencementSimulation(s)
  const donneesJson = JSON.stringify(r.donnees).replace(/</g, '\\u003c')
  const remplacer = (html, motif, par, nom) => {
    if (!motif.test(html)) throw new Error(`Page statique de la simulation ${s.id} : balise « ${nom} » introuvable dans index.html`)
    return html.replace(motif, () => par)
  }
  let h = indexHtml
  h = remplacer(h, /<title>[\s\S]*?<\/title>/, `<title>${esc(r.titre)}</title>`, 'title')
  h = remplacer(h, /<meta name="description" content="[^"]*" ?\/?>/, `<meta name="description" content="${esc(r.description)}" />`, 'description')
  h = remplacer(h, /<meta property="og:title" content="[^"]*" ?\/?>/, `<meta property="og:title" content="${esc(r.titre)}" />`, 'og:title')
  h = remplacer(h, /<meta property="og:description" content="[^"]*" ?\/?>/, `<meta property="og:description" content="${esc(r.description)}" />`, 'og:description')
  h = remplacer(h, /<meta property="og:url" content="[^"]*" ?\/?>/, `<meta property="og:url" content="${esc(r.adresse)}" />`, 'og:url')
  h = remplacer(h, /<\/head>/, `<meta name="robots" content="index, follow" />\n    <link rel="canonical" href="${esc(r.adresse)}" />\n    <script type="application/ld+json" id="donnees-structurees">${donneesJson}</script>\n  </head>`, '</head>')
  // contenu de repli sans JavaScript : texte rédigé de la simulation et retour à l'accueil
  const repli = `<h1>${esc(s.label)}</h1>${r.texteLong ? `<p>${esc(r.texteLong)}</p>` : ''}<p>Simulation interactive de la ${NOM_SITE} : activez JavaScript pour l'utiliser.</p><p><a href="${esc(ADRESSE_SITE)}">Toutes les simulations de la ${NOM_SITE}</a></p>`
  h = remplacer(h, /<noscript>[\s\S]*?<\/noscript>/, `<noscript>${repli}</noscript>`, 'noscript')
  return h
}

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
  let sortie = 'dist'
  const pages = () => lireSimulations().filter(s => aAdressePropre(s.id))
  return {
    name: 'securite-et-referencement',
    apply: 'build',
    configResolved: config => { sortie = config.build.outDir },
    transformIndexHtml: html => {
      // contenu de repli sans JavaScript : la liste des simulations avec leurs adresses propres (lue dans App.jsx)
      const liste = pages().map(s => `<li><a href="${esc(referencementSimulation(s).adresse)}">${esc(s.label)}</a></li>`).join('')
      return html
        .replace('<!--LISTE-SIMULATIONS-->', () => `<h1>Paillasse virtuelle</h1><p>Simulations interactives de chimie et de physique (lycée, BTS). Activez JavaScript pour les utiliser.</p><ul>${liste}</ul>`)
        .replace('<meta charset="UTF-8" />', () => `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`)
    },
    // Plan du site pour les moteurs de recherche : l'accueil et l'adresse propre de chaque simulation (une par page statique générée)
    generateBundle() {
      const jour = new Date().toISOString().slice(0, 10)
      const adresses = [ADRESSE_SITE, ...pages().map(s => referencementSimulation(s).adresse)]
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        adresses.map(u => `  <url><loc>${esc(u)}</loc><lastmod>${jour}</lastmod></url>`).join('\n') + '\n</urlset>\n'
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${ADRESSE_SITE}sitemap.xml\n` })
    },
    // Une vraie page statique par simulation : dist/sim/<n>-<titre>/index.html (GitHub Pages ne réécrit pas les adresses : il faut de vrais fichiers)
    closeBundle() {
      const indexHtml = readFileSync(join(sortie, 'index.html'), 'utf8')
      for (const s of pages()) {
        const dossier = join(sortie, cheminSimulation(s.id, s.label, '').replace(/^\/+/, ''))
        mkdirSync(dossier, { recursive: true })
        writeFileSync(join(dossier, 'index.html'), pageDeSimulation(indexHtml, s))
      }
      console.log(`${pages().length} pages statiques de simulations générées (sans adresse propre : ${[...SANS_ADRESSE_PROPRE].join(', ')}).`)
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
