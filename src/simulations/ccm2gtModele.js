// ====================================================
//  MODÈLE DE LA SIMULATION 197 « CHROMATOGRAPHIE SUR COUCHE MINCE : IDENTIFIER ET COMPARER » (2GT, partie « Description et caractérisation de la matière »
//  et « Synthèse d'une espèce chimique présente dans la nature »). Fichier sans React, testé par ccm2gtModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • même plaque (silice) et même éluant pour tous les dépôts d'une même plaque : sans cela, les hauteurs ne se comparent pas ;
//   • dépôts de concentrations comparables et plaque non surchargée : chaque espèce donne une tache ronde et nette ;
//   • hauteur du front relevée AVANT le séchage de la plaque ;
//   • lecture des hauteurs à ±1 mm près (règle graduée en millimètres) : deux taches dont les centres sont à moins de 1 mm sont jugées « à la même hauteur » ;
//   • une tache de même hauteur qu'une référence est COMPATIBLE avec la même espèce, mais ne le prouve pas : deux espèces différentes peuvent migrer pareil dans
//     un éluant ; il faut changer d'éluant pour confirmer ;
//   • les valeurs de Rf de toutes les espèces sont INVENTÉES pour la simulation (ordres de grandeur réalistes, pas des mesures) ; les compositions des échantillons aussi.
//  Le rapport frontal Rf = (distance parcourue par la tache) ÷ (distance parcourue par le front) n'est pas exigé explicitement par le programme de Seconde : il est
//  présenté comme un complément (« pour aller plus loin ») ; l'identification repose sur l'alignement des taches.
// ====================================================

export const NB = '\u00a0';                 // espace insécable (U+00A0)
export const FRONT = 60;                    // distance parcourue par le front de l'éluant dans les scènes, en mm (6,0 cm)
export const TOL_LECTURE = 1;               // précision de lecture de la règle, en mm

// ---------- espèces : distance parcourue (mm) pour FRONT = 60 mm, avec l'éluant 1 puis l'éluant 2 ----------
// visible : 'couleur' (tache colorée visible à l'œil nu) ou 'uv' (incolore : révélée par la lampe UV)
export const ESPECES = {
  // colorants d'un bonbon enrobé
  jaune:  { id: 'jaune', nom: 'colorant jaune E102', court: 'jaune', couleur: '#facc15', visible: 'couleur', d: { 1: 42, 2: 24 } },
  orange: { id: 'orange', nom: 'colorant orangé E110', court: 'orangé', couleur: '#f97316', visible: 'couleur', d: { 1: 33, 2: 39 } },
  rouge:  { id: 'rouge', nom: 'colorant rouge E129', court: 'rouge', couleur: '#dc2626', visible: 'couleur', d: { 1: 21, 2: 15 } },
  bleu:   { id: 'bleu', nom: 'colorant bleu E133', court: 'bleu', couleur: '#2563eb', visible: 'couleur', d: { 1: 12, 2: 33 } },
  vert:   { id: 'vert', nom: 'colorant vert E142', court: 'vert', couleur: '#16a34a', visible: 'couleur', d: { 1: 27, 2: 45 } },
  // pigments d'extraits de feuilles
  carotene: { id: 'carotene', nom: 'carotène', court: 'carotène', couleur: '#ea580c', visible: 'couleur', d: { 1: 55, 2: 53 } },
  luteine:  { id: 'luteine', nom: 'lutéine', court: 'lutéine', couleur: '#eab308', visible: 'couleur', d: { 1: 42, 2: 27 } },
  chloa:    { id: 'chloa', nom: 'chlorophylle a', court: 'chlo. a', couleur: '#0f766e', visible: 'couleur', d: { 1: 30, 2: 18 } },
  chlob:    { id: 'chlob', nom: 'chlorophylle b', court: 'chlo. b', couleur: '#65a30d', visible: 'couleur', d: { 1: 23, 2: 12 } },
  brun:     { id: 'brun', nom: 'pigment brun non référencé', court: 'brun', couleur: '#92400e', visible: 'couleur', d: { 1: 36, 2: 38 } },
  // arômes (incolores : lampe UV)
  van:  { id: 'van', nom: 'vanilline', court: 'vanil.', couleur: '#334155', visible: 'uv', d: { 1: 27, 2: 18 } },
  eth:  { id: 'eth', nom: 'éthylvanilline', court: 'éthylv.', couleur: '#334155', visible: 'uv', d: { 1: 27.2, 2: 23 } },
  x:    { id: 'x', nom: 'composé X', court: 'X', couleur: '#334155', visible: 'uv', d: { 1: 37, 2: 33 } },
  y:    { id: 'y', nom: 'composé Y', court: 'Y', couleur: '#334155', visible: 'uv', d: { 1: 12, 2: 7 } },
  z:    { id: 'z', nom: 'composé Z', court: 'Z', couleur: '#334155', visible: 'uv', d: { 1: 45, 2: 40 } },
};

// ---------- situations ----------
// refs : espèces disponibles comme références (corps purs déposés à côté) ; inconnue : espèce absente des références (défi 1)
export const SITUATIONS = {
  bonbon: {
    id: 'bonbon', titre: 'Les colorants d’un bonbon enrobé', court: 'Colorants d’un bonbon', uv: false,
    eluants: { 1: { nom: 'eau salée' }, 2: { nom: 'eau et éthanol' } },
    refs: ['jaune', 'orange', 'rouge', 'bleu'], inconnue: 'vert',
    echantillons: [
      { id: 'vert', nom: 'enrobage vert', court: 'vert', especes: ['jaune', 'bleu'] },
      { id: 'orange', nom: 'enrobage orange', court: 'orange', especes: ['jaune', 'rouge'] },
      { id: 'violet', nom: 'enrobage violet', court: 'violet', especes: ['rouge', 'bleu'] },
      { id: 'rouge', nom: 'enrobage rouge', court: 'rouge', especes: ['rouge'] },
      { id: 'marron', nom: 'enrobage marron', court: 'marron', especes: ['jaune', 'rouge', 'bleu'] },
    ],
  },
  feuilles: {
    id: 'feuilles', titre: 'Les pigments de feuilles', court: 'Pigments de feuilles', uv: false,
    eluants: { 1: { nom: 'cyclohexane et acétone (3 pour 1)' }, 2: { nom: 'cyclohexane et acétone (9 pour 1)' } },
    refs: ['carotene', 'luteine', 'chloa', 'chlob'], inconnue: 'brun',
    echantillons: [
      { id: 'epinard', nom: 'extrait de feuille d’épinard', court: 'épinard', especes: ['carotene', 'luteine', 'chloa', 'chlob'] },
      { id: 'automne', nom: 'extrait de feuille jaune d’automne', court: 'automne', especes: ['carotene', 'luteine'] },
      { id: 'carotte', nom: 'extrait de racine de carotte', court: 'carotte', especes: ['carotene'] },
    ],
  },
  arome: {
    id: 'arome', titre: 'Un arôme de synthèse et un arôme naturel', court: 'Arôme de synthèse et arôme naturel', uv: true,
    eluants: { 1: { nom: 'cyclohexane et acétate d’éthyle (1 pour 1)' }, 2: { nom: 'cyclohexane et acétate d’éthyle (4 pour 1)' } },
    refs: ['van', 'eth', 'z'], inconnue: null,
    echantillons: [
      { id: 'synthA', nom: 'arôme de synthèse A', court: 'synth.A', especes: ['van'] },
      { id: 'synthB', nom: 'arôme de synthèse B', court: 'synth.B', especes: ['eth'] },
      { id: 'synthC', nom: 'arôme de synthèse C', court: 'synth.C', especes: ['z'] },
      { id: 'synthD', nom: 'arôme de synthèse D', court: 'synth.D', especes: ['van'] },
      { id: 'natPur', nom: 'extrait naturel purifié', court: 'naturel', especes: ['van'] },
      { id: 'natBrut', nom: 'extrait naturel brut', court: 'brut', especes: ['van', 'x', 'y'] },
    ],
  },
};
export const LISTE_SITUATIONS = Object.values(SITUATIONS);
export const echantillon = (sit, id) => SITUATIONS[sit].echantillons.find(e => e.id === id);

// ---------- distances, rapport frontal ----------
export const dist = (esp, eluant, front = FRONT) => ESPECES[esp].d[eluant] * front / FRONT;      // mm
export const rf = (dTache, dFront) => dTache / dFront;
export const arrondiSig = (x, n) => (x === 0 || !isFinite(x) ? x : Number(x.toPrecision(n)));
export const nombreFR = (x, d = null) => {
  if (!isFinite(x)) return '—';
  const s = d == null ? Number(x.toPrecision(3)).toLocaleString('fr-FR', { maximumFractionDigits: 6 }) : x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return s.replace(/[\u202f\u00a0]/g, NB).replace('-', '−');
};
export const mmEnCm = mm => mm / 10;
export const cmFR = mm => `${nombreFR(Math.round(mm) / 10, 1)}${NB}cm`;     // lecture à 1 mm près
export const rfFR = (dTache, dFront) => nombreFR(arrondiSig(rf(dTache, dFront), 2), 2);

// Taches visibles d'une voie : les espèces dont les centres sont à moins de TOL_LECTURE mm ne forment qu'une tache (indiscernables à la règle)
export function taches(especes, eluant, front = FRONT) {
  const l = [...new Set(especes)].map(id => ({ id, d: dist(id, eluant, front) })).sort((a, b) => a.d - b.d);
  const g = [];
  for (const e of l) {
    const dernier = g[g.length - 1];
    if (dernier && e.d - dernier.d <= TOL_LECTURE) { dernier.especes.push(e.id); dernier.d = (dernier.d * (dernier.especes.length - 1) + e.d) / dernier.especes.length; }
    else g.push({ d: e.d, especes: [e.id] });
  }
  return g;
}
export const nbTaches = (especes, eluant) => taches(especes, eluant).length;
export const memeHauteur = (d1, d2) => Math.abs(d1 - d2) <= TOL_LECTURE;
// Une espèce de référence est « alignée » avec une tache de la voie si leurs hauteurs diffèrent de moins de la précision de lecture
export const alignee = (especesVoie, ref, eluant) => especesVoie.some(e => memeHauteur(dist(e, eluant), dist(ref, eluant)));
export const verdictPurete = n => (n === 0 ? 'aucune tache' : n === 1 ? 'corps pur probable' : 'mélange');

// Voies d'une plaque : { cle, type: 'ech' | 'ref' | 'co', lib: [ligne1, ligne2], especes }
export function voies(sit, { ech1, ech2 = null, refs = [], co = null }) {
  const S = SITUATIONS[sit], e1 = echantillon(sit, ech1), l = [];
  if (e1) l.push({ cle: 'e1', type: 'ech', lib: ['échant.', e1.court], especes: e1.especes });
  const e2 = ech2 && echantillon(sit, ech2);
  if (e2) l.push({ cle: 'e2', type: 'ech', lib: ['échant.', e2.court], especes: e2.especes });
  if (co && e1) {
    if (co === 'e2' && e2) l.push({ cle: 'co', type: 'co', lib: ['co-dép.', '1 + 2'], especes: [...e1.especes, ...e2.especes] });
    else if (ESPECES[co] && co !== 'e2') l.push({ cle: 'co', type: 'co', lib: ['co-dép.', ESPECES[co].court], especes: [...e1.especes, co] });
  }
  S.refs.filter(r => refs.includes(r)).forEach(r => l.push({ cle: `r-${r}`, type: 'ref', lib: ['réf.', ESPECES[r].court], especes: [r] }));
  return l;
}

// ---------- défi 1 : composition d'un échantillon par alignement avec des références ----------
const tirer = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function tirerDefiComposition(prec = null) {
  for (let essai = 0; essai < 200; essai++) {
    const sit = tirer(['bonbon', 'feuilles']), S = SITUATIONS[sit], eluant = tirer([1, 2]);
    const avecInconnue = Math.random() < 0.35, k = avecInconnue ? tirer([1, 2]) : tirer([1, 2, 3]);
    const refs = melange(S.refs).slice(0, k).sort((a, b) => S.refs.indexOf(a) - S.refs.indexOf(b));
    const especes = avecInconnue ? [...refs, S.inconnue] : refs;
    const d = { type: 'compo', sit, eluant, refs, inconnue: avecInconnue, especes };
    if (!prec || prec.type !== 'compo' || prec.sit !== sit || prec.eluant !== eluant || prec.refs.join() !== refs.join() || prec.inconnue !== avecInconnue) return d;
  }
  return null;
}
export const reponseJusteComposition = (d, rep) => {
  const a = [...(rep.refs || [])].sort().join(), b = [...d.refs].sort().join();
  return a === b && !!rep.inconnue === d.inconnue;
};
export function verifierComposition(d, rep) {
  const manque = d.refs.filter(r => !(rep.refs || []).includes(r)), enTrop = (rep.refs || []).filter(r => !d.refs.includes(r));
  return { manque, enTrop, inconnueOk: !!rep.inconnue === d.inconnue, ok: reponseJusteComposition(d, rep) };
}

// ---------- défi 2 : l'arôme de synthèse est-il identique à l'extrait naturel ? ----------
export const CHOIX_IDENTITE = {
  probable: 'très probablement la même espèce : mêmes hauteurs avec les deux éluants',
  diff: 'pas la même espèce : une hauteur diffère avec au moins un éluant',
  prouve: 'prouvé identiques : les taches sont alignées sur la plaque',
  impossible: 'impossible de conclure : les deux plaques se contredisent, il faut tout refaire',
};
export const SYNTHESES = [
  { id: 'synthA', espece: 'van' },
  { id: 'synthB', espece: 'eth' },
  { id: 'synthC', espece: 'z' },
  { id: 'synthD', espece: 'van' },
];
export function tirerDefiIdentite(prec = null) {
  for (let essai = 0; essai < 100; essai++) {
    const s = tirer(SYNTHESES), d = { type: 'identite', synth: s.id, espece: s.espece, nat: 'natPur', bonne: verdictIdentite(s.espece, 'van') };
    if (!prec || prec.type !== 'identite' || prec.synth !== s.id) return d;
  }
  return null;
}
// Compare deux espèces avec les deux éluants : 'probable' si aucune hauteur ne diffère, sinon 'diff'
export const verdictIdentite = (esp1, esp2) => ([1, 2].every(el => memeHauteur(dist(esp1, el), dist(esp2, el))) ? 'probable' : 'diff');
export const eluantsQuiSeparent = (esp1, esp2) => [1, 2].filter(el => !memeHauteur(dist(esp1, el), dist(esp2, el)));
export const reponseJusteIdentite = (d, choix) => choix === d.bonne;
