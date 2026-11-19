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
import { SIMS_BROUILLON } from '../src/brouillons.js'

// Codes courts des exercices (ex. ANA23, SAPP4, VAL12) imprimés sur les fiches de remédiation et saisis par l'élève sur le site.
// Attribués UNE SEULE FOIS et jamais modifiés : scripts/codes.json mémorise « clé d'exercice → code ». Un nouvel exercice reçoit le numéro suivant ;
// un exercice supprimé garde son code réservé (un code imprimé ne doit jamais pointer vers un autre exercice).
const FICHIER_CODES = new URL('./codes.json', import.meta.url)
const SORTIE_CODES = new URL('../src/codes.js', import.meta.url)
const PREFIXE = { "S'APP": 'SAPP', ANA: 'ANA', REA: 'REA', VAL: 'VAL' }

// Mots-clés « type de tâche » (colonne taches) : vocabulaire FIXE, pour que la remédiation choisisse par tâche et non seulement par titre.
// Règles : (1) une ou deux étiquettes selon la famille d'exercice ; (2) étiquettes ajoutées d'après des mots du titre ou de la description.
// Toute étiquette hors de ce vocabulaire fait échouer le script ; tout exercice doit en avoir au moins une.
const TACHES_VOC = ['atomes de l’ion carboxylate', 'relation λ = c·T', 'période et fréquence', 'nombre de stéréoisomères', 'énantiomères et diastéréoisomères', 'mélange racémique', 'proportions', 'quantité de matière versée', 'relation à l’équivalence', 'concentration d’une solution', 'masse dans un volume', 'coefficient de partage', 'extraction', 'rapport de distribution', 'solubilité et saturation', 'masse de cristaux', 'rendement de cristallisation', 'loi de Henry', 'rapport des concentrations', 'loi de Beer-Lambert', 'coefficient de dissociation', 'pKa', 'conservation de la matière', 'constante de cellule', 'conductance et conductivité', 'courbe d’étalonnage', 'dilution', 'loi de Kohlrausch', 'conductivité d’une solution', 'titrage conductimétrique', 'volume équivalent', 'électrolyse', 'charge électrique', 'quantité d’électrons', 'pile', 'capacité électrique', 'réactif limitant', 'solution tampon', 'couple acide-base', 'prédominance', 'distribution', 'forme basique', 'force des acides', 'constante d’acidité', 'produit ionique de l’eau', 'équation du second degré', 'quotient de réaction', 'constante d’équilibre', 'taux d’avancement', 'sens d’évolution', 'constante radioactive', 'décroissance radioactive', 'activité', 'datation', 'relation pH et concentration', 'dilution', 'effet Doppler', 'extraire les données', 'lire un graphique', 'tracer une courbe', 'pente et ordonnée à l’origine', 'prévoir sans calculer', 'choisir la relation', 'hypothèses d’un modèle',
  'construire une démarche', 'reconnaître un champ', 'reconnaître un mouvement', 'algorithme à seuils', 'plausibilité', 'compatibilité avec une référence', 'choisir un modèle',
  'conformité cahier des charges', 'microscope', 'lunette astronomique', 'somme de vecteurs', 'différence de vecteurs', 'forces et champs', 'lentille mince', 'œil et loupe', 'conversion d’unités', 'isoler une grandeur', 'chiffres significatifs',
  'vitesse volumique', 'vecteur vitesse', 'vecteur accélération', 'dérivée d’une fonction du temps', 'accélération normale', 'norme du vecteur accélération', 'variation de vitesse', 'somme des forces', 'accélération du centre de masse', 'tension et mouvement', 'équilibre', 'temps de demi-réaction', 'loi d’ordre 1', 'fonctions usuelles', 'saisie calculatrice', 'pont diviseur', 'temps de réponse', 'conversion analogique-numérique', 'instruction Arduino', 'incertitudes', 'bilan et rendement', 'décrire une évolution', 'compléter un tableau bilan', 'importance du temps de réponse', 'titrage pH-métrique', 'quantités de matière', 'plans d’expériences', 'carbone asymétrique', 'règles de priorité CIP', 'configuration R/S', 'molécule chirale', 'représentation de Cram', 'monomères libres et micelles', 'CMC et structure', 'célérité d’une onde', 'durée de propagation', 'masse molaire', 'volume molaire d’un gaz', 'masse volumique', 'nombre d’entités', 'électrons de valence', 'nombre de doublets', 'doublets non liants', 'charge d’un atome', , 'géométrie d’une entité', 'polarité d’une liaison ou d’une molécule']
const TACHES_FAMILLE = {
  34: id => (/^arduino/.test(id) ? ['instruction Arduino'] : /^reponse-/.test(id) ? ['temps de réponse', 'importance du temps de réponse', 'titrage pH-métrique', 'quantités de matière'] : /^bilan-/.test(id) ? ['compléter un tableau bilan'] : ['extraire les données']),
  35: id => (['photoresistance', 'ctn'].includes(id) ? ['lire un graphique', 'décrire une évolution'] : ['lire un graphique']),
  '37:prevoir': () => ['prévoir sans calculer'], '37:relation': () => ['choisir la relation'], '37:hypothese': () => ['hypothèses d’un modèle'], '37:probleme': () => ['construire une démarche'],
  '37:champ': () => ['reconnaître un champ'], '37:mouvement': () => ['reconnaître un mouvement'], '37:algorithme': () => ['algorithme à seuils'],
  '77:plausible': () => ['plausibilité'], '77:compat': () => ['compatibilité avec une référence'],
  '77:decision': id => [/^modele/.test(id) ? 'choisir un modèle' : 'conformité cahier des charges'],
  '36:vecteur-somme': () => ['somme de vecteurs'], '36:vecteur-difference': () => ['différence de vecteurs'], '36:interactions': () => ['forces et champs'], '36:lum1-conjugaison': () => ['lentille mince'], '36:ond1g-periode': () => ['période et fréquence', 'relation λ = c·T', 'conversion d’unités'], '36:ond1g-celerite': () => ['célérité d’une onde', 'durée de propagation', 'conversion d’unités'], '36:pmel-calcul': () => ['plans d’expériences'], '36:pfac-calcul': () => ['plans d’expériences'], '36:lum1-signes': () => ['lentille mince'], '36:oeil-accommodation': () => ['œil et loupe'], '36:oeil-loupe': () => ['œil et loupe'], '36:microsc-grossissement': () => ['microscope'], '36:microsc-mise-au-point': () => ['microscope'], '36:lunet-grossissement': () => ['lunette astronomique'], '36:lunet-image': () => ['lunette astronomique'],
  '36:stereo-nombre': () => ['nombre de stéréoisomères', 'énantiomères et diastéréoisomères'], '36:stereo-racemique': () => ['mélange racémique', 'proportions'], '36:tens-libres-micelles': () => ['monomères libres et micelles', 'proportions'], '36:tens-klevens': () => ['CMC et structure'],
  '36:chir-priorites': () => ['règles de priorité CIP'], '36:chir-configuration': () => ['carbone asymétrique', 'configuration R/S'], '36:chir-reperer': () => ['carbone asymétrique', 'molécule chirale'], '36:chir-cram-bilan': () => ['représentation de Cram', 'molécule chirale'],
  '36:vitesses': () => ['conversion d’unités'], '36:simple': () => ['conversion d’unités'], '36:prefixes': () => ['conversion d’unités'], '36:puissances': () => ['conversion d’unités'],
  '36:composees': () => ['conversion d’unités'], '36:mixte': () => ['conversion d’unités'], '36:isoler': () => ['isoler une grandeur'], '36:cs': () => ['chiffres significatifs'],
  '36:fonctions': () => ['fonctions usuelles'], '36:calculatrice': () => ['saisie calculatrice'], '36:trace-courbe': () => ['tracer une courbe'],
  '36:dop-calcul': () => ['effet Doppler', 'conversion d’unités'], '36:dopg-calcul': () => ['effet Doppler', 'conversion d’unités'], '36:titph-calcul': () => ['titrage pH-métrique', 'quantités de matière'], '36:phc-calcul': () => ['relation pH et concentration', 'dilution'],
  '36:cinv-calcul': () => ['vitesse volumique', 'temps de demi-réaction', 'loi d’ordre 1'],
  '36:equ-calcul': () => ['quotient de réaction', 'constante d’équilibre', 'taux d’avancement', 'sens d’évolution'],
  '36:predo-rapport': () => ['rapport des concentrations', 'pKa', 'conservation de la matière'], '36:extrac-partage': () => ['coefficient de partage', 'rapport des concentrations', 'pKa'], '36:extrac-passes': () => ['extraction', 'coefficient de partage', 'rapport de distribution'], '36:co2dis-henry': () => ['loi de Henry', 'relation pH et concentration', 'pKa'], '36:co2dis-milieu': () => ['prédominance', 'rapport des concentrations', 'pKa'], '36:tampstl-prepa': () => ['solution tampon', 'rapport des concentrations'], '36:tampstl-ajout': () => ['solution tampon', 'pKa'], '36:predo-beer': () => ['loi de Beer-Lambert', 'pKa', 'conservation de la matière'], '36:dissoc-alpha': () => ['coefficient de dissociation', 'conservation de la matière', 'relation pH et concentration'], '36:dissoc-ka': () => ['constante d’acidité', 'pKa', 'coefficient de dissociation', 'dilution'],
  '36:fab-calcul': () => ['force des acides', 'constante d’acidité', 'produit ionique de l’eau', 'équation du second degré'],
  '36:ab-acf-rea-ph': () => ['relation pH et concentration', 'force des acides', 'taux d’avancement'], '36:ab-acf-rea-dilution': () => ['relation pH et concentration', 'dilution', 'force des acides'],
  '36:ab-pred-rea-rapport': () => ['rapport des concentrations', 'pKa', 'conservation de la matière'], '36:ab-pred-rea-pka': () => ['pKa', 'rapport des concentrations', 'prédominance'],
  '36:ab-tamp-rea-melange': () => ['solution tampon', 'quantité de matière versée', 'pKa'], '36:ab-tamp-rea-ajout': () => ['solution tampon', 'conservation de la matière', 'pKa'],
  '36:pdi-calcul': () => ['couple acide-base', 'prédominance', 'distribution', 'forme basique'],
  '36:cdt-calcul': () => ['loi de Kohlrausch', 'conductivité d’une solution', 'titrage conductimétrique', 'volume équivalent'],
  '36:fre-calcul': () => ['accélération normale', 'isoler une grandeur', 'variation de vitesse', 'norme du vecteur accélération', 'conversion d’unités'],
  '36:etl-calcul': () => ['constante de cellule', 'conductance et conductivité', 'courbe d’étalonnage', 'dilution'],
  '36:nwt-calcul': () => ['somme des forces', 'accélération du centre de masse', 'tension et mouvement', 'équilibre'],
  '36:vac-calcul': () => ['vecteur vitesse', 'vecteur accélération', 'dérivée d’une fonction du temps'],
  '36:aam-calcul': () => ['couple acide-base', 'prédominance', 'distribution', 'forme basique'],
  '36:tmp-calcul': () => ['solution tampon', 'couple acide-base'],
  '36:pil-calcul': () => ['pile', 'capacité électrique', 'réactif limitant'],
  '36:ely-calcul': () => ['électrolyse', 'charge électrique', 'quantité d’électrons'],
  '36:mol1g-conc-calcul': () => ['concentration d’une solution', 'quantités de matière', 'dilution', 'masse molaire', 'conversion d’unités'],
  '36:lewis1g-calcul': () => ['électrons de valence', 'nombre de doublets', 'doublets non liants', 'charge d’un atome'],
  '36:savon1g-calcul': () => ['atomes de l’ion carboxylate', 'masse molaire', 'quantités de matière'],
  '36:geo1g-calcul': () => ['géométrie d’une entité', 'polarité d’une liaison ou d’une molécule'],
  '36:mol1g-qte-calcul': () => ['masse molaire', 'quantités de matière', 'volume molaire d’un gaz', 'masse volumique', 'conversion d’unités'],
  '36:rad-calcul': () => ['constante radioactive', 'décroissance radioactive', 'activité', 'datation', 'conversion d’unités'],
  '36:titrage-direct': () => ['quantité de matière versée', 'relation à l’équivalence', 'concentration d’une solution', 'masse dans un volume'],
  '36:crist-refroidissement': () => ['solubilité et saturation', 'masse de cristaux', 'rendement de cristallisation'], '36:crist-evaporation': () => ['solubilité et saturation', 'masse de cristaux'],
  '36:pont-diviseur': () => ['pont diviseur'], '36:temps-reponse': () => ['temps de réponse'],
}
const TACHES_MOTS = [[/carbone asymétrique|C\*|chiral/i, 'carbone asymétrique'], [/priorité|CIP|numéro atomique|voisins/i, 'règles de priorité CIP'], [/configuration|\bR\b ou \bS\b|miroir/i, 'configuration R/S'], [/Cram|coin plein/i, 'représentation de Cram'], [/pont diviseur|diviseur de tension/i, 'pont diviseur'], [/temps de réponse|échelon/i, 'temps de réponse'], [/\bquantum|convertisseur|\bCAN\b|\bbits?\b|analogique-numérique/i, 'conversion analogique-numérique'],
  [/arduino|digitalWrite|analogRead/i, 'instruction Arduino'], [/incertitude|écart-type|élargi/i, 'incertitudes'], [/rendement|(?<!tableau )bilan/i, 'bilan et rendement'],
  [/vitesse volumique/i, 'vitesse volumique'], [/demi-réaction/i, 'temps de demi-réaction'], [/ordre 1|constante k|constante de vitesse/i, 'loi d’ordre 1'],
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
  const { SITUATIONS } = await vite.ssrLoadModule('/src/simulations/AtelierSituationsBanque.js')
  const { FAMILLES: FAM_ANA } = await vite.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js')
  const { FAMILLES: FAM_VAL } = await vite.ssrLoadModule('/src/simulations/AtelierValiderBanque.js')
  const { FAMILLES: FAM_REA } = await vite.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx')

  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const sims = [...app.matchAll(/\{\s*id:\s*(\d+),\s*label:\s*"([^"]+)"[\s\S]{0,160}?niveau:\s*"([A-Z0-9]+)"/g)]
    .map(m => ({ id: Number(m[1]), label: m[2], niveau: m[3] })).filter(s => ![39, 40, 47, 82, ...SIMS_BROUILLON].includes(s.id))  // pages de compte, à propos : sans intérêt pour la remédiation ; jeux et outils en préparation : ne doivent pas apparaître dans ce fichier public (src/brouillons.js)

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

  for (const sit of SITUATIONS) {
    try { const r = sit.construire(); info[`34:${sit.id}`] = { difficulte: sit.niveau, description: court(`${r.enonce} ${r.etapes[0].q}`) } }
    catch (err) { probleme.push(`${sit.id} : situation non construite (${err.message})`) }
  }

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
