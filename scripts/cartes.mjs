// Liste STATIQUE des simulations qui ont au moins une carte « À retenir », écrite dans src/simsAvecCartes.js.
//   node scripts/cartes.mjs            → régénère le fichier (lancé automatiquement avant chaque build)
// Pourquoi : « Mes fiches » montre à l'élève les simulations dont la fiche reste à débloquer ; il ne faut pas lui promettre une fiche
// pour une simulation qui n'a aucune carte. Les cartes sont écrites dans le code de chaque simulation (champ retenir: ou <ARetenir>).
import { readFileSync, writeFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const fichierDe = {}
for (const m of app.matchAll(/const (\w+) = paresseux\(\(\) => import\("\.\/simulations\/(\w+)"/g)) fichierDe[m[1]] = m[2]
const ids = new Set()
for (const m of app.matchAll(/\{\s*id:\s*(\d+),[\s\S]*?component:\s*(\w+)\s*[,}]/g)) {
  const f = fichierDe[m[2]]
  if (!f) continue
  let src = ''
  try { src = readFileSync(new URL(`../src/simulations/${f}.jsx`, import.meta.url), 'utf8') } catch { continue }
  if (/\bretenir:|<ARetenir/.test(src)) ids.add(Number(m[1]))
}
const liste = [...ids].sort((a, b) => a - b)
writeFileSync(new URL('../src/simsAvecCartes.js', import.meta.url),
  `// Fichier généré par « node scripts/cartes.mjs » : ne pas modifier à la main.\n// Simulations qui ont au moins une carte « À retenir » (leur fiche de révision peut être débloquée).\nexport const SIMS_AVEC_CARTES = new Set(${JSON.stringify(liste)});\n`)
console.log(`${liste.length} simulations avec cartes.`)
