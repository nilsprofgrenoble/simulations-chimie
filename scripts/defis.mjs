// Liste STATIQUE des défis de simulation (clé, simulation, titre), écrite dans src/defisDeclares.js.
//   node scripts/defis.mjs            → régénère le fichier (à relancer quand un défi est ajouté ou renommé)
//   node scripts/defis.mjs --verifier → échoue si le fichier est périmé
// Pourquoi : une simulation ne déclare ses défis (declarerDefis) qu'au moment où elle est chargée, et le site ne charge une simulation que
// lorsqu'on l'ouvre. Sans cette liste, « Mon compte » ne connaissait que les défis des simulations visitées pendant la session :
// les étoiles des autres défis n'étaient pas comptées (niveau trop bas après un rechargement de la page).
import { createServer } from 'vite'
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'

const SORTIE = new URL('../src/defisDeclares.js', import.meta.url)
const verifier = process.argv.includes('--verifier')
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  globalThis.window ??= { location: { search: '', href: 'http://x/' }, localStorage: { getItem() { return null }, setItem() {} }, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) }
  const dossier = new URL('../src/simulations/', import.meta.url)
  const echecs = []
  for (const f of readdirSync(dossier).filter(n => /\.jsx?$/.test(n) && readFileSync(new URL(n, dossier), 'utf8').includes('declarerDefis('))) {
    try { await vite.ssrLoadModule(`/src/simulations/${f}`) } catch (e) { echecs.push(`${f} : ${e.message.split('\n')[0]}`) }
  }
  const { DEFIS } = await vite.ssrLoadModule('/src/suivi.js')
  const lignes = DEFIS.filter(d => d.cle !== undefined).map(d => [d.sim, d.cle.split(':defi.')[1], d.titre])
    .sort((a, b) => a[0] - b[0] || String(a[1]).localeCompare(String(b[1])))
  const texte = `// Fichier généré par « node scripts/defis.mjs » : ne pas modifier à la main.\n// Défis de simulation connus d'avance : [identifiant de la simulation, nom du défi, titre].\nexport const DEFIS_DECLARES = ${JSON.stringify(lignes)}\n`
  if (echecs.length) console.log('Chargement impossible :\n  ' + echecs.join('\n  '))
  if (verifier) {
    if (!existsSync(SORTIE) || readFileSync(SORTIE, 'utf8') !== texte) { console.error('src/defisDeclares.js est périmé : lancer « node scripts/defis.mjs ».'); process.exitCode = 1 }
  } else { writeFileSync(SORTIE, texte); console.log(`${lignes.length} défis écrits.`) }
} finally { await vite.close() }
