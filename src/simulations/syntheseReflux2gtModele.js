// ====================================================
//  MODÈLE DE LA SIMULATION 204 « SYNTHÈSE D'UNE ESPÈCE NATURELLE : MONTAGE À REFLUX ET CCM » (2GT, partie « Synthèse d'une espèce chimique présente dans la nature »).
//  Fichier sans React, testé par syntheseReflux2gtModele.test.mjs.
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • la transformation est écrite avec une flèche simple (modèle de Seconde) ; en réalité elle est LIMITÉE : il reste des réactifs à la fin (le produit brut contient encore de l'alcool) ;
//   • le chauffage accélère la transformation, il ne change pas la quantité d'ester obtenue à la fin ;
//   • le schéma du montage n'est pas à l'échelle ; l'eau remplit toute la gaine du réfrigérant seulement si elle entre par le bas ;
//   • les valeurs de la CCM (hauteurs des taches, éluants) sont INVENTÉES pour la simulation, avec des ordres de grandeur réalistes ; l'extrait naturel est supposé déjà purifié ;
//   • des taches à la même hauteur, dans UN éluant, sont COMPATIBLES avec la même espèce mais ne le prouvent pas ; des hauteurs différentes prouvent que les espèces sont différentes ;
//   • masses volumiques données avec 2 chiffres significatifs (tables) ; hauteurs lues à ±1 mm.
// ====================================================
import { LEGENDES } from './syntheseReflux2gtGeometrie.js';

export const NB = ' ';                 // espace insécable (U+00A0)
export const nombreFR = (x, d = null) => {
  if (!isFinite(x)) return '—';
  const s = d == null ? Number(x.toPrecision(3)).toLocaleString('fr-FR', { maximumFractionDigits: 6 }) : x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return s.replace(/[\u00a0\u202f]/g, NB).replace('-', '−');
};
export const arrondiSig = (x, n) => (x === 0 || !isFinite(x) ? x : Number(x.toPrecision(n)));
export const cmFR = mm => `${nombreFR(Math.round(mm) / 10, 1)}${NB}cm`;     // lecture à 1 mm près

// ---------- espèces chimiques de la synthèse ----------
// brute : nombre d'atomes de chaque élément dans la formule brute ; rho : masse volumique en g/mL (2 chiffres significatifs)
export const ESPECES_CHIM = {
  acide: { id: 'acide', nom: 'acide éthanoïque', formule: 'CH₃COOH', brute: { C: 2, H: 4, O: 2 }, rho: 1.05 },
  alcool: { id: 'alcool', nom: 'alcool isoamylique', formule: 'C₅H₁₁OH', brute: { C: 5, H: 12, O: 1 }, rho: 0.81 },
  ester: { id: 'ester', nom: 'acétate d’isoamyle', formule: 'CH₃COOC₅H₁₁', brute: { C: 7, H: 14, O: 2 }, rho: 0.88 },
  eau: { id: 'eau', nom: 'eau', formule: 'H₂O', brute: { H: 2, O: 1 }, rho: 1.00 },
};
// Équation de la transformation (flèche simple en 2GT) : coefficients tous égaux à 1
export const EQUATION = { reactifs: [['acide', 1], ['alcool', 1]], produits: [['ester', 1], ['eau', 1]] };
export const atomes = lst => { const t = {}; for (const [id, k] of lst) for (const [el, n] of Object.entries(ESPECES_CHIM[id].brute)) t[el] = (t[el] || 0) + k * n; return t; };
export const equationAjustee = (eq = EQUATION) => {
  const a = atomes(eq.reactifs), b = atomes(eq.produits), els = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...els].every(e => (a[e] || 0) === (b[e] || 0));
};

// ---------- le montage : pièces, ordre d'assemblage ----------
// prerequis : ce qui doit déjà être en place ; pourquoi : message si l'élève choisit la pièce trop tôt ; apres : ce qui explique la pièce une fois posée
export const PIECES = [
  { id: 'support', nom: 'le support (potence)', prerequis: [], tot: '', pose: 'Le support tient tout le montage : on le place en premier, solidement sur la paillasse.' },
  { id: 'chauffe', nom: 'le chauffe-ballon', prerequis: ['support'], tot: 'Le chauffe-ballon se place sur la paillasse, à côté du support qui servira à tenir la verrerie.', pose: 'Le chauffe-ballon chauffera le ballon sans flamme nue.' },
  { id: 'ballon', nom: 'le ballon avec le mélange et la pierre ponce', prerequis: ['chauffe'], tot: 'Le ballon se pose dans le chauffe-ballon : il faut donc d’abord le chauffe-ballon.', pose: 'Le ballon contient les deux liquides et la pierre ponce, qui rend l’ébullition régulière.' },
  { id: 'pince', nom: 'la pince sur le col du ballon', prerequis: ['ballon'], tot: 'La pince tient le col du ballon : il faut d’abord un ballon à tenir.', pose: 'La pince fixe le ballon au support : le montage ne risque pas de tomber.' },
  { id: 'refrigerant', nom: 'le réfrigérant, fixé sur le ballon', prerequis: ['pince'], tot: 'Le réfrigérant se pose sur le ballon, quand le ballon est déjà bien maintenu par la pince.', pose: 'Le réfrigérant est vertical, posé sur le col du ballon et tenu lui aussi par une pince.' },
];
export const ORDRE_PIECES = PIECES.map(p => p.id);
export const MONTAGE_VIDE = { support: false, chauffe: false, ballon: false, pince: false, refrigerant: false, eau: 'aucune', bouchon: false, pierre: true, marche: false };
export const MONTAGE_CORRECT = { support: true, chauffe: true, ballon: true, pince: true, refrigerant: true, eau: 'bas', bouchon: false, pierre: true, marche: true };
export const piecePosee = (m, id) => !!m[id];
// Essai de pose d'une pièce : accepté si tous les prérequis sont posés
export function essaiPiece(m, id) {
  const p = PIECES.find(x => x.id === id);
  if (!p || m[id]) return { ok: false, montage: m, message: 'Cette pièce est déjà en place.' };
  const manque = p.prerequis.filter(r => !m[r]);
  if (manque.length) return { ok: false, montage: m, message: p.tot };
  return { ok: true, montage: { ...m, [id]: true }, message: p.pose };
}
export const montageComplet = m => ORDRE_PIECES.every(id => m[id]);

// ---------- ce qui se passe dans un montage (diagnostic) ----------
// vapeurs : 'sechappent' (perte de matière et danger), 'partiel', 'retombent' (reflux), 'aucune' (pas de chauffage)
export function diagnostic(m) {
  const d = { vapeurs: 'aucune', pression: false, ebullition: m.pierre ? 'reguliere' : 'saccadee', maintien: m.pince || !m.refrigerant, refroidissement: 'sans', lignes: [] };
  if (!m.ballon || !m.chauffe) return d;
  if (!m.marche) { d.ebullition = 'aucune'; d.lignes.push('Le chauffage est éteint : le mélange ne bout pas.'); return d; }
  if (!m.refrigerant) {
    d.vapeurs = 'sechappent';
    d.lignes.push('Sans réfrigérant, les vapeurs sortent du ballon : le mélange s’appauvrit et les vapeurs, irritantes et inflammables, se répandent dans la pièce.');
  } else {
    d.refroidissement = m.eau === 'bas' || m.eau === 'neutre' ? 'complet' : m.eau === 'haut' ? 'partiel' : 'nul';
    d.vapeurs = d.refroidissement === 'complet' ? 'retombent' : d.refroidissement === 'partiel' ? 'partiel' : 'sechappent';
    if (d.refroidissement === 'complet') d.lignes.push('Les vapeurs montent, se refroidissent dans le réfrigérant, redeviennent liquides et retombent dans le ballon : rien n’est perdu.');
    else if (d.refroidissement === 'partiel') d.lignes.push('Entrée en haut : la gaine ne se remplit pas entièrement, le refroidissement est incomplet et des vapeurs peuvent sortir.');
    else d.lignes.push('Sans eau dans la gaine, rien ne refroidit les vapeurs : elles traversent le réfrigérant et s’échappent.');
    if (m.bouchon) { d.pression = true; d.lignes.push('Haut bouché : le montage est fermé, la pression monte en chauffant. Danger : le bouchon peut être projeté, la verrerie peut éclater.'); }
    if (!m.pince) d.lignes.push('Sans pince, le réfrigérant et le ballon ne sont pas maintenus : le montage peut tomber.');
  }
  if (!m.pierre) d.lignes.push('Sans pierre ponce, l’ébullition est irrégulière : le liquide peut être projeté par à-coups.');
  return d;
}

// ---------- défauts d'un montage (défi) ----------
export const FAUTES = {
  bouche: 'le haut du réfrigérant est bouché',
  eauHaut: 'l’eau entre par le haut du réfrigérant',
  sansEau: 'l’eau ne circule pas dans le réfrigérant',
  sansPierre: 'il n’y a pas de pierre ponce dans le ballon',
  sansPince: 'le ballon n’est pas maintenu par une pince',
};
export const IDS_FAUTES = Object.keys(FAUTES);
export const fautesDe = m => IDS_FAUTES.filter(f => ({ bouche: m.bouchon, eauHaut: m.eau === 'haut', sansEau: m.eau === 'aucune', sansPierre: !m.pierre, sansPince: !m.pince })[f]);
export const appliquerFautes = fs => ({ ...MONTAGE_CORRECT, bouchon: fs.includes('bouche'), eau: fs.includes('eauHaut') ? 'haut' : fs.includes('sansEau') ? 'aucune' : 'bas', pierre: !fs.includes('sansPierre'), pince: !fs.includes('sansPince') });
const tirer = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function tirerDefiMontage(prec = null) {
  for (let essai = 0; essai < 300; essai++) {
    const k = tirer([0, 1, 1, 1, 2, 2]);
    let fs = melange(IDS_FAUTES).slice(0, k);
    if (fs.includes('eauHaut') && fs.includes('sansEau')) continue;
    fs = IDS_FAUTES.filter(f => fs.includes(f));
    const cle = fs.join('+');
    if (!prec || prec.type !== 'montage' || prec.cle !== cle) return { type: 'montage', fautes: fs, cle, montage: appliquerFautes(fs), ordre: melange(IDS_FAUTES) };
  }
  return null;
}
export const reponseJusteMontage = (d, rep) => [...rep].sort().join() === [...d.fautes].sort().join();
export function verifierMontage(d, rep) {
  const manque = d.fautes.filter(f => !rep.includes(f)), enTrop = rep.filter(f => !d.fautes.includes(f));
  return { manque, enTrop, ok: manque.length === 0 && enTrop.length === 0 };
}
// Phrases de correction d'un défaut (ce qui se passe, jamais la solution avant la vérification)
export const CONSEQUENCE = {
  bouche: 'Un montage bouché est fermé : en chauffant, la pression monte et le bouchon peut être projeté.',
  eauHaut: 'Avec l’entrée en haut, la gaine ne se remplit pas entièrement : le refroidissement est incomplet.',
  sansEau: 'Sans eau qui circule, les vapeurs ne se refroidissent pas et s’échappent par le haut.',
  sansPierre: 'Sans pierre ponce, l’ébullition est irrégulière et le liquide peut être projeté.',
  sansPince: 'Sans pince, ni le ballon ni le réfrigérant ne sont maintenus : le montage peut tomber.',
};

// ---------- schéma qualitatif de l'effet du chauffage (étape 2) : la quantité d'ester formée en fonction du temps, sans valeurs ----------
// Les deux courbes montent vers la MÊME quantité finale (le chauffage ne change pas ce qu'on obtient à la fin, il accélère seulement) ; τ : durée caractéristique (échelle qualitative)
export const COURBE = { A: 0.8, tau: { froid: 4, chaud: 1 }, tMax: 14 };
export const esterFormé = (t, tau) => COURBE.A * (1 - Math.exp(-t / tau));

// ---------- CCM de comparaison ----------
export const FRONT = 60;                    // distance parcourue par le front (mm) : 6,0 cm
export const TOL_LECTURE = 1;               // précision de lecture (mm)
// d : distance parcourue par la tache (mm) pour FRONT = 60 mm, avec l'éluant 1 puis l'éluant 2 ; toutes les espèces sont incolores : révélées au diiode (taches brunes)
export const ESPECES_CCM = {
  ester: { id: 'ester', nom: 'acétate d’isoamyle', court: 'ester', d: { 1: 42, 2: 50 } },
  alcool: { id: 'alcool', nom: 'alcool isoamylique', court: 'alcool', d: { 1: 21, 2: 33 } },
  butyle: { id: 'butyle', nom: 'acétate de butyle', court: 'ester B', d: { 1: 36, 2: 46 } },
};
export const ELUANTS = { 1: { nom: 'cyclohexane et acétate d’éthyle (4 pour 1)' }, 2: { nom: 'cyclohexane et acétate d’éthyle (2 pour 1)' } };
// Échantillons : brut de synthèse (l'ester et un reste d'alcool), synthèse purifiée, synthèse d'un autre ester, extrait naturel purifié
export const ECHANTILLONS = {
  brut: { id: 'brut', nom: 'produit brut de la synthèse', court: ['synthèse', 'brute'], especes: ['ester', 'alcool'] },
  pur: { id: 'pur', nom: 'arôme de synthèse purifié', court: ['synthèse', 'pure'], especes: ['ester'] },
  autre: { id: 'autre', nom: 'arôme de synthèse d’un autre laboratoire', court: ['autre', 'labo'], especes: ['butyle'] },
  nat: { id: 'nat', nom: 'arôme extrait de la banane', court: ['banane', 'naturel'], especes: ['ester'] },
};
export const dist = (esp, eluant, front = FRONT) => ESPECES_CCM[esp].d[eluant] * front / FRONT;      // mm
export function taches(especes, eluant, front = FRONT) {
  const l = [...new Set(especes)].map(id => ({ id, d: dist(id, eluant, front) })).sort((a, b) => a.d - b.d), g = [];
  for (const e of l) {
    const dernier = g[g.length - 1];
    if (dernier && e.d - dernier.d <= TOL_LECTURE) { dernier.especes.push(e.id); dernier.d = (dernier.d * (dernier.especes.length - 1) + e.d) / dernier.especes.length; }
    else g.push({ d: e.d, especes: [e.id] });
  }
  return g;
}
export const nbTaches = (especes, eluant) => taches(especes, eluant).length;
export const memeHauteur = (d1, d2) => Math.abs(d1 - d2) <= TOL_LECTURE;
export const verdictPurete = n => (n === 0 ? 'aucune tache' : n === 1 ? 'une seule espèce visible' : 'au moins deux espèces : un mélange');
// Voies d'une plaque : { cle, type: 'ech' | 'ref' | 'co', lib: [ligne1, ligne2], especes }
export const voieEch = id => ({ cle: id, type: 'ech', lib: ECHANTILLONS[id].court, especes: ECHANTILLONS[id].especes });
export const voieRef = r => ({ cle: `r-${r}`, type: 'ref', lib: ['réf.', ESPECES_CCM[r].court], especes: [r] });
export const voieCo = (a, b) => ({ cle: `co-${a}-${b}`, type: 'co', lib: ['co-dép.', ''], especes: [...ECHANTILLONS[a].especes, ...ECHANTILLONS[b].especes] });

// Comparaison d'un arôme de synthèse et de l'arôme naturel avec un éluant donné
//  'probable' : mêmes taches aux mêmes hauteurs ; 'melange' : la synthèse a une tache de plus (au moins une est alignée avec l'arôme naturel) ; 'diff' : aucune tache alignée
export function verdictComparaison(synth, nat, eluant) {
  const ts = taches(ECHANTILLONS[synth].especes, eluant), tn = taches(ECHANTILLONS[nat].especes, eluant);
  const alignee = (t, liste) => liste.some(u => memeHauteur(t.d, u.d));
  const sAl = ts.filter(t => alignee(t, tn)), nAl = tn.filter(t => alignee(t, ts));
  if (sAl.length === ts.length && nAl.length === tn.length) return 'probable';
  if (sAl.length > 0) return 'melange';
  return 'diff';
}
export const CHOIX_IDENTITE = {
  probable: 'peut-être identiques : une seule tache, à la même hauteur que l’arôme naturel',
  diff: 'pas identiques : la tache de synthèse n’est pas à la hauteur de l’arôme naturel',
  melange: 'pas pur : la synthèse montre une tache de plus que l’arôme naturel',
  prouve: 'identiques, c’est prouvé : les taches sont alignées sur la plaque',
};
export const SYNTHESES = ['pur', 'brut', 'autre'];
export function tirerDefiIdentite(prec = null) {
  for (let essai = 0; essai < 100; essai++) {
    const synth = tirer(SYNTHESES), eluant = tirer([1, 2]), cle = `${synth}${eluant}`;
    if (!prec || prec.type !== 'identite' || prec.cle !== cle) return { type: 'identite', synth, eluant, cle, bonne: verdictComparaison(synth, 'nat', eluant) };
  }
  return null;
}
export const reponseJusteIdentite = (d, choix) => choix === d.bonne;
export const MESSAGES_IDENTITE = {
  probable: 'Une seule tache, à la même hauteur que l’arôme naturel : l’arôme de synthèse peut être identique, avec cet éluant. Ce n’est pas une preuve : pour confirmer, on changerait d’éluant (voir la simulation sur la CCM).',
  diff: 'La tache de l’arôme de synthèse n’est pas à la hauteur de celle de l’arôme naturel : ce ne sont pas les mêmes espèces. Des hauteurs différentes prouvent des espèces différentes.',
  melange: 'L’arôme de synthèse montre deux taches : l’une est à la hauteur de l’arôme naturel, l’autre est une espèce de plus. Le produit n’est pas pur : il contient encore une autre espèce, ici un reste de réactif.',
  prouve: 'Des taches alignées ne prouvent jamais que deux espèces sont les mêmes : elles sont seulement compatibles avec la même espèce, dans cet éluant.',
};

// ---------- légendes du schéma : exactitude ----------
export const LEGENDES_REQUISES = ['ballon', 'chauffe', 'refrigerant', 'entree', 'sortie', 'support'];
export const NOMS_LEGENDES = { ballon: 'le ballon', chauffe: 'le chauffe-ballon', refrigerant: 'le réfrigérant à eau', entree: 'l’entrée d’eau', sortie: 'la sortie d’eau', support: 'le support', pince: 'la pince', bouchon: 'le bouchon' };
export const legendesExistent = () => LEGENDES_REQUISES.every(id => LEGENDES[id]);
