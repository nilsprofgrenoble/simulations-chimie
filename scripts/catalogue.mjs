// Catalogue des ressources du site pour la remédiation (appli Trajectoire) : une ligne par simulation et par exercice.
//   node scripts/catalogue.mjs           → écrit public/catalogue.csv (publié sur https://paillasse-virtuelle.fr/catalogue.csv)
//   node scripts/catalogue.mjs --verifier → ne crée rien ; échoue si le fichier est périmé ou si un exercice n'a pas de chapitre
// Toutes les données viennent du code du site (App.jsx, chapitres.js, descriptions.js, Entrainement.jsx, banques d'exercices) : rien à tenir à jour à la main.
// Colonnes : type, id, lien, niveau, chapitre, competence, difficulte, theme, titre, description, simulations_liees, code, taches.
//   • taches : type(s) de tâche travaillé(s), vocabulaire fixe (TACHES_VOC dans ce script), séparés par « | » ; vide pour une simulation.
//   • code : code court à imprimer sur la fiche de l'élève (SAPP/ANA/REA/VAL + numéro pour un exercice, SIM + numéro pour une simulation), saisi sur le site dans « Code ».
//   • difficulte (1 à 3) : « Valider » = niveau écrit à la main dans la banque ; « Analyser » et « S'approprier » = ESTIMATION déduite de la structure
//     (Analyser : prévoir = 1, relation/hypothèses/schémas = 2, problème complet = 3 ; énoncé à données : nombre de grandeurs à calculer ; graphique : proportionnelle = 1, affine ou courbe = 2).
//     « Réaliser » : pas de difficulté. Valeur indicative, à ne pas lire comme une mesure.
//   • simulations_liees : les simulations du ou des chapitres de l'exercice (ids de lignes « simulation » de ce fichier, séparés par « | »). C'est l'association au niveau du chapitre.
//   • description : une à deux phrases tirées de l'énoncé ; titre : unique parmi les exercices (le script échoue sinon).
import { createServer } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

// Codes courts des exercices (ex. ANA23, SAPP4, VAL12) imprimés sur les fiches de remédiation et saisis par l'élève sur le site.
// Attribués UNE SEULE FOIS et jamais modifiés : scripts/codes.json mémorise « clé d'exercice → code ». Un nouvel exercice reçoit le numéro suivant ;
// un exercice supprimé garde son code réservé (un code imprimé ne doit jamais pointer vers un autre exercice).
const FICHIER_CODES = new URL('./codes.json', import.meta.url)
const SORTIE_CODES = new URL('../src/codes.js', import.meta.url)
const PREFIXE = { "S'APP": 'SAPP', ANA: 'ANA', REA: 'REA', VAL: 'VAL' }

// Mots-clés « type de tâche » (colonne taches) : vocabulaire FIXE, pour que la remédiation choisisse par tâche et non seulement par titre.
// Règles : (1) une ou deux étiquettes selon la famille d'exercice ; (2) étiquettes ajoutées d'après des mots du titre ou de la description.
// Toute étiquette hors de ce vocabulaire fait échouer le script ; tout exercice doit en avoir au moins une.
const TACHES_VOC = ['extraire les données', 'lire un graphique', 'tracer une courbe', 'pente et ordonnée à l’origine', 'prévoir sans calculer', 'choisir la relation', 'hypothèses d’un modèle',
  'construire une démarche', 'reconnaître un champ', 'reconnaître un mouvement', 'algorithme à seuils', 'plausibilité', 'compatibilité avec une référence', 'choisir un modèle',
  'conformité cahier des charges', 'somme de vecteurs', 'différence de vecteurs', 'forces et champs', 'conversion d’unités', 'isoler une grandeur', 'chiffres significatifs',
  'fonctions usuelles', 'saisie calculatrice', 'pont diviseur', 'temps de réponse', 'conversion analogique-numérique', 'instruction Arduino', 'incertitudes', 'bilan et rendement']
const TACHES_FAMILLE = {
  34: () => ['extraire les données'], 35: () => ['lire un graphique'],
  '37:prevoir': () => ['prévoir sans calculer'], '37:relation': () => ['choisir la relation'], '37:hypothese': () => ['hypothèses d’un modèle'], '37:probleme': () => ['construire une démarche'],
  '37:champ': () => ['reconnaître un champ'], '37:mouvement': () => ['reconnaître un mouvement'], '37:algorithme': () => ['algorithme à seuils'],
  '77:plausible': () => ['plausibilité'], '77:compat': () => ['compatibilité avec une référence'],
  '77:decision': id => [/^modele/.test(id) ? 'choisir un modèle' : 'conformité cahier des charges'],
  '36:vecteur-somme': () => ['somme de vecteurs'], '36:vecteur-difference': () => ['différence de vecteurs'], '36:interactions': () => ['forces et champs'],
  '36:vitesses': () => ['conversion d’unités'], '36:simple': () => ['conversion d’unités'], '36:prefixes': () => ['conversion d’unités'], '36:puissances': () => ['conversion d’unités'],
  '36:composees': () => ['conversion d’unités'], '36:mixte': () => ['conversion d’unités'], '36:isoler': () => ['isoler une grandeur'], '36:cs': () => ['chiffres significatifs'],
  '36:fonctions': () => ['fonctions usuelles'], '36:calculatrice': () => ['saisie calculatrice'], '36:trace-courbe': () => ['tracer une courbe'],
  '36:pont-diviseur': () => ['pont diviseur'], '36:temps-reponse': () => ['temps de réponse'],
}
const TACHES_MOTS = [[/pont diviseur|diviseur de tension/i, 'pont diviseur'], [/temps de réponse|échelon/i, 'temps de réponse'], [/quantum|convertisseur|CAN\b|bits?\b|analogique-numérique/i, 'conversion analogique-numérique'],
  [/arduino|digitalWrite|analogRead/i, 'instruction Arduino'], [/incertitude|écart-type|élargi/i, 'incertitudes'], [/rendement|bilan/i, 'bilan et rendement'],
  [/pente|coefficient directeur|ordonnée à l’origine/i, 'pente et ordonnée à l’origine'], [/tracer/i, 'tracer une courbe']]
function tachesDe(e, titre, description) {
  const m = e.cle.split(':'), cle = e.atelier === 34 || e.atelier === 35 ? e.atelier : e.atelier === 36 ? `36:${m[1]}` : `${e.atelier}:${m[1]}`
  const f = TACHES_FAMILLE[cle]
  const base = f ? f(m[2] || m[1] || '') : []
  const mots = TACHES_MOTS.filter(([re]) => re.test(`${titre} ${description}`)).map(([, t]) => t)
  return [...new Set([...base, ...mots])]
}

const SITE = 'https://paillasse-virtuelle.fr/'
const SORTIE = new URL('../public/catalogue.csv', import.meta.url)
const verifier = process.argv.includes('--verifier')
// Les énoncés à nombres tirés au hasard sont construits pour en tirer la question : générateur pseudo-aléatoire fixe, pour que le fichier soit reproductible
let graine = 12345
Math.random = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296 }

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { CHAPITRES, chapitresDeSim, chapitresDuDomaine } = await vite.ssrLoadModule('/src/chapitres.js')
  const { DESCRIPTIONS } = await vite.ssrLoadModule('/src/descriptions.js')
  const { tousLesExercices } = await vite.ssrLoadModule('/src/simulations/Entrainement.jsx')
  const { ENONCES } = await vite.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js')
  const { SCENARIOS } = await vite.ssrLoadModule('/src/simulations/AtelierGraphiqueBanque.js')
  const { FAMILLES: FAM_ANA } = await vite.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js')
  const { FAMILLES: FAM_VAL } = await vite.ssrLoadModule('/src/simulations/AtelierValiderBanque.js')
  const { FAMILLES: FAM_REA } = await vite.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx')

  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const sims = [...app.matchAll(/\{\s*id:\s*(\d+),\s*label:\s*"([^"]+)"[\s\S]{0,160}?niveau:\s*"([A-Z0-9]+)"/g)]
    .map(m => ({ id: Number(m[1]), label: m[2], niveau: m[3] })).filter(s => ![39, 40, 47, 79, 80, 81, 82].includes(s.id))  // pages de compte, à propos et jeux : sans intérêt pour la remédiation

  const COMP = { "S'APP": "S'approprier", ANA: 'Analyser', REA: 'Réaliser', VAL: 'Valider' }
  const NOM_NIVEAU = { COMP: 'Compétences' }
  const nettoie = s => String(s ?? '').replace(/\s+/g, ' ').replace(/^[^\p{L}\p{N}]+/u, '').trim()
  const noms = cs => cs.map(c => nettoie(c.label)).join(' | ')
  const niveaux = cs => [...new Set(cs.map(c => c.niveau))].join(' | ')
  const probleme = []

  // Une ou deux phrases au plus, coupées proprement (fin de phrase, sinon fin de mot)
  const court = (t, n = 230) => {
    const x = String(t ?? '').replace(/\s+/g, ' ').trim()
    if (x.length <= n) return x
    const coupe = x.slice(0, n), p = Math.max(coupe.lastIndexOf('. '), coupe.lastIndexOf('? '))
    return p > n * 0.5 ? coupe.slice(0, p + 1) : coupe.slice(0, coupe.lastIndexOf(' ')) + ' …'
  }
  // Données par clé d'exercice (même clés que tousLesExercices)
  const info = {}
  const DIFF_ANA = { prevoir: 1, relation: 2, hypothese: 2, probleme: 3, champ: 2, mouvement: 2, algorithme: 2 }
  for (const f of FAM_ANA) for (const it of f.liste) {
    const cherche = it.cherche && it.cherche.q ? ` ${it.cherche.q}` : ''
    info[`37:${f.id}:${it.id}`] = { difficulte: DIFF_ANA[f.id] ?? '', description: court(`${it.enonce || ''}${it.q ? ' ' + it.q : cherche}`) }
  }
  for (const f of FAM_VAL) for (const it of f.liste)
    info[`77:${f.id}:${it.id}`] = { description: court(it.enonce || it.contexte) }
  for (const f of FAM_REA) info[`36:${f.id}`] = { description: court(`${f.groupe} : ${f.titre}.`) }
  for (const sc of SCENARIOS) info[`35:${sc.id}`] = { difficulte: sc.type === 'droite' && sc.prop ? 1 : 2,
    description: sc.type === 'droite' ? `Lire et exploiter un graphique : une droite ${sc.prop ? 'qui passe par l’origine (proportionnalité)' : 'affine'}, avec sa pente.` : 'Lire un graphique : reconnaître l’allure d’une courbe et en tirer une valeur.' }
  for (const e of ENONCES) e.noms.forEach((nom, q) => {
    let difficulte = '', description = ''
    try {
      const r = e.build(e.gen(), q), tk = r.tokens
      const txt = r.texte.map(m => typeof m === 'string' ? m : (tk[m.t]?.aff ?? '')).join('').replace(/\s+/g, ' ').trim()
      const quest = txt.match(/[^.!?]*\?\s*$/)
      description = court(`${e.titre}. Il faut repérer les données utiles du texte puis répondre : ${quest ? quest[0].trim() : nom + ' ?'}`)
      const nd = (r.derivees || []).length
      difficulte = nd === 0 ? 1 : nd <= 2 ? 2 : 3
    } catch (err) { probleme.push(`${e.id}.${q} : énoncé non construit (${err.message})`) }
    info[`34:${e.id}.${q}`] = { difficulte, description }
  })

  // Attribution des codes (les exercices déjà codés ne changent jamais)
  const codes = existsSync(FICHIER_CODES) ? JSON.parse(readFileSync(FICHIER_CODES, 'utf8')) : {}
  const dernier = {}
  for (const c of Object.values(codes)) { const m = c.match(/^([A-Z]+)(\d+)$/); if (m) dernier[m[1]] = Math.max(dernier[m[1]] || 0, +m[2]) }
  const codesAvant = JSON.stringify(codes)
  const exercices = tousLesExercices()
  for (const e of exercices) if (!codes[e.cle]) { const pf = PREFIXE[e.comp]; dernier[pf] = (dernier[pf] || 0) + 1; codes[e.cle] = pf + dernier[pf] }
  const fichierCodes = JSON.stringify(codes, null, 1) + '\n'
  const tableCodes = '// Fichier généré par « node scripts/catalogue.mjs » à partir de scripts/codes.json : ne pas modifier à la main.\n' +
    '// Code court d\'un exercice → [atelier, exercice] (voir EnTete.jsx, saisie « J\'ai un code »).\n' +
    'export const CODES = ' + JSON.stringify(Object.fromEntries(exercices.map(e => [codes[e.cle], [e.atelier, String(e.ex)]]))) + '\n'

  const lignes = []
  for (const s of sims) {
    const cs = chapitresDeSim(s.id)
    lignes.push({ type: 'simulation', id: `sim${s.id}`, lien: `${SITE}?sim=${s.id}`, code: `SIM${s.id}`, niveau: cs.length ? niveaux(cs) : (NOM_NIVEAU[s.niveau] || s.niveau), difficulte: '',
      chapitre: noms(cs), competence: '', theme: '', titre: s.label, description: DESCRIPTIONS[s.label] || '' })
  }
  for (const e of exercices) {
    const cs = chapitresDuDomaine(e.domaine)
    const transversal = /transversal/i.test(e.domaine)
    if (!cs.length && !transversal) probleme.push(`${e.cle} : thème « ${e.domaine} » absent de chapitres.js`)
    const inf = info[e.cle] || {}
    if (!inf.description) probleme.push(`${e.cle} : pas de description`)
    const liees = [...new Set(cs.flatMap(c => c.sims))].filter(i => sims.some(s => s.id === i)).map(i => `sim${i}`)
    lignes.push({ type: 'exercice', id: e.cle, lien: `${SITE}?sim=${e.atelier}&ex=${e.ex}`, code: codes[e.cle],
      niveau: transversal ? 'tous' : niveaux(cs), difficulte: e.niveau || inf.difficulte || '', chapitre: transversal ? 'tous chapitres' : noms(cs),
      competence: COMP[e.comp], theme: e.domaine, titre: e.titre, description: inf.description || '', simulations_liees: liees.join(' | '),
      taches: (() => { const t = tachesDe(e, e.titre, inf.description || ''); if (!t.length) probleme.push(`${e.cle} : aucune étiquette de tâche`); t.forEach(x => { if (!TACHES_VOC.includes(x)) probleme.push(`${e.cle} : étiquette « ${x} » hors vocabulaire`) }); return t.join(' | ') })() })
  }

  const COLS = ['type', 'id', 'lien', 'niveau', 'chapitre', 'competence', 'difficulte', 'theme', 'titre', 'description', 'simulations_liees', 'code', 'taches']
  const q = v => /[;"\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v)
  const csv = '﻿' + [COLS.join(';'), ...lignes.map(l => COLS.map(c => q(l[c] ?? '')).join(';'))].join('\n') + '\n'

  const vus = {}
  for (const l of lignes) if (l.type === 'exercice') (vus[l.titre] ||= []).push(l.id)
  for (const [t, ids] of Object.entries(vus)) if (ids.length > 1) probleme.push(`titre en double « ${t} » : ${ids.join(', ')}`)
  const nbSim = lignes.filter(l => l.type === 'simulation').length
  console.log(`${nbSim} simulations, ${lignes.length - nbSim} exercices.`)
  const sansDesc = lignes.filter(l => l.type === 'simulation' && !l.description).map(l => l.titre)
  if (sansDesc.length) console.log(`Sans description (${sansDesc.length}) : ${sansDesc.join(' ; ')}`)
  if (probleme.length) { console.error('PROBLÈME :\n' + probleme.join('\n')); process.exitCode = 1 }
  if (verifier) {
    if (!existsSync(SORTIE) || readFileSync(SORTIE, 'utf8') !== csv) { console.error('public/catalogue.csv est périmé : lancer « node scripts/catalogue.mjs ».'); process.exitCode = 1 }
    if (!existsSync(SORTIE_CODES) || readFileSync(SORTIE_CODES, 'utf8') !== tableCodes || JSON.stringify(codes) !== codesAvant) { console.error('Codes d\'exercices à mettre à jour : lancer « node scripts/catalogue.mjs ».'); process.exitCode = 1 }
  } else { writeFileSync(SORTIE, csv); writeFileSync(FICHIER_CODES, fichierCodes); writeFileSync(SORTIE_CODES, tableCodes) }
} finally { await vite.close() }
