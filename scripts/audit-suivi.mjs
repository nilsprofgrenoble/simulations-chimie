// Fichier de suivi de l'audit complet : audit/SUIVI.md (une ligne par simulation et par banque d'exercices).
//   node scripts/audit-suivi.mjs   → crée le fichier, ou le met à jour SANS effacer les statuts et comptes déjà saisis
// À relancer quand une simulation est ajoutée. Les colonnes statut / Bloq. / Imp. / Min. / rapport sont remplies par l'auditeur.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { lireSimulations } from './lireSimulations.mjs'

const RACINE = new URL('../', import.meta.url)
const DOSSIER_SIMS = new URL('src/simulations/', RACINE)
const SORTIE = new URL('audit/SUIVI.md', RACINE)
const app = readFileSync(new URL('src/App.jsx', RACINE), 'utf8')
const sims = lireSimulations(app)

// id → composant → fichier (import paresseux de App.jsx)
const fichierDuComposant = new Map()
for (const m of app.matchAll(/const\s+(\w+)\s*=\s*paresseux\(\(\)\s*=>\s*import\("\.\/simulations\/([\w-]+)"\)/g)) fichierDuComposant.set(m[1], m[2])
const composantDeLId = new Map()
{
  const debut = app.indexOf('const SIMULATIONS = ['), fin = app.indexOf('SIMULATIONS.forEach(', debut)
  for (const m of app.slice(debut, fin).matchAll(/\{\s*id:\s*(\d+),[^}]*?component:\s*(\w+)/g)) composantDeLId.set(Number(m[1]), m[2])
}

const existe = n => ['.jsx', '.js'].find(e => existsSync(new URL(n + e, DOSSIER_SIMS)))
const lignes = n => { const e = existe(n); return e ? readFileSync(new URL(n + e, DOSSIER_SIMS), 'utf8').split('\n').length : 0 }
const fichiersPrincipaux = new Set(fichierDuComposant.values())
// Fichiers propres à une simulation : son fichier + ses imports directs « ./X », sauf les fichiers principaux d'autres simulations
// (un modèle de calcul partagé par plusieurs simulations apparaît pour chacune : il doit être relu une fois, signalé dans le rapport).
function dependances(base) {
  const e = existe(base), vus = new Set([base])
  if (!e) return vus
  const src = readFileSync(new URL(base + e, DOSSIER_SIMS), 'utf8')
  for (const m of src.matchAll(/from\s+["']\.\/([\w-]+)["']/g)) if (existe(m[1]) && !/^(commun|suivi)$/.test(m[1]) && !fichiersPrincipaux.has(m[1])) vus.add(m[1])
  return vus
}

// Statuts déjà saisis
const anciens = new Map()
if (existsSync(SORTIE)) {
  for (const l of readFileSync(SORTIE, 'utf8').split('\n')) {
    const c = l.split('|').map(x => x.trim())
    if (c.length > 9 && /^(SIM|BANQUE)/.test(c[1])) anciens.set(c[1], c.slice(5, 10))
  }
}

const ORDRE = { '2GT': 0, '1G': 1, 'TG': 2, 'TSTL': 3, 'BTS': 4 }
const lignesSims = sims.map(s => {
  const comp = composantDeLId.get(s.id), base = fichierDuComposant.get(comp)
  const fichiers = base ? [...dependances(base)] : []
  return { cle: `SIM${s.id}`, titre: s.label, niveau: s.niveau || '?', fichiers, taille: fichiers.reduce((a, f) => a + lignes(f), 0) }
}).sort((a, b) => (ORDRE[a.niveau] ?? 9) - (ORDRE[b.niveau] ?? 9) || Number(a.cle.slice(3)) - Number(b.cle.slice(3)))

// Banques d'exercices (fichiers Banque / Atelier*Banque) : audités à part, car les exercices ne sont pas dans une simulation
const banques = readdirSync(DOSSIER_SIMS).filter(n => /Banque.*\.jsx?$/.test(n) && !/\.test\./.test(n)).map(n => n.replace(/\.jsx?$/, '')).sort()
  .map(b => ({ cle: `BANQUE-${b}`, titre: `Banque d'exercices ${b}`, niveau: '—', fichiers: [b], taille: lignes(b) }))

const tout = [...lignesSims, ...banques]
const corps = tout.map(r => {
  const a = anciens.get(r.cle) || ['⬜', '', '', '', '']
  return `| ${r.cle} | ${r.titre.replace(/\|/g, '/')} | ${r.niveau} | ${r.fichiers.map(f => 'src/simulations/' + f).join(', ')} (${r.taille} l.) | ${a[0]} | ${a[1]} | ${a[2]} | ${a[3]} | ${a[4]} |`
}).join('\n')

const entete = `# Suivi de l'audit complet de la Paillasse virtuelle

Protocole : \`audit/PROTOCOLE.md\`. Rapports : \`audit/rapports/<clé>.md\`. Fichier généré puis tenu à jour : ne changer que les colonnes Statut, Bloq., Imp., Min., Rapport.
Statut : ⬜ à faire · 🟨 en cours · ✅ audité (rapport écrit) · ⏭️ sauté (raison dans le rapport).

| Clé | Titre | Niveau | Fichiers (lignes) | Statut | Bloq. | Imp. | Min. | Rapport |
|---|---|---|---|---|---|---|---|---|
`
mkdirSync(new URL('audit/rapports/', RACINE), { recursive: true })
writeFileSync(SORTIE, entete + corps + '\n')
console.log(`${lignesSims.length} simulations + ${banques.length} banques écrites dans audit/SUIVI.md`)
