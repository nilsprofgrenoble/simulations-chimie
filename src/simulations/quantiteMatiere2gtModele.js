// ====================================================
//  Modèle de la simulation « Quantité de matière : compter les entités et la mole » (2GT, sim 178).
//  Modèle pur (sans React), testé par quantiteMatiere2gtModele.test.mjs.
//  Chaîne : masse de l'échantillon m → nombre d'entités N = m / m_entité → quantité de matière n = N / N_A.
//  Hypothèses : entités toutes identiques ; masses d'atomes arrondies à 3 chiffres significatifs (en kg) ; masse des électrons négligée
//  (masse d'un ion = masse de l'atome) ; masse d'une molécule = somme des masses de ses atomes ; N_A = 6,02 × 10²³ mol⁻¹ (valeur arrondie).
//  La masse molaire M n'est PAS au programme de 2GT : seule la « masse d'une mole » apparaît, en facultatif, sans notation.
//  Ne pas confondre avec quantiteMatiereModele.js (1G, sim 152).
// ====================================================

export const NA = 6.02e23;                  // mol⁻¹ (valeur arrondie de 6,02214076 × 10²³, nombre exact par définition de la mole)
const NB = '\u00a0';                        // espace insécable
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
export const sup = n => String(n).split('').map(c => SUP[c] ?? c).join('');

// Masses des atomes (kg), 3 chiffres significatifs (valeurs moyennes, arrondies)
export const MASSE_ATOME = { H: 1.67e-27, C: 1.99e-26, N: 2.33e-26, O: 2.66e-26, Na: 3.82e-26, Mg: 4.04e-26, Al: 4.48e-26, S: 5.32e-26, Cl: 5.89e-26, Ca: 6.66e-26, Fe: 9.27e-26, Cu: 1.06e-25 };
export const COULEUR_ATOME = { H: '#94a3b8', C: '#334155', N: '#2563eb', O: '#dc2626', Na: '#a855f7', Mg: '#16a34a', Al: '#64748b', S: '#ca8a04', Cl: '#15803d', Ca: '#0d9488', Fe: '#9a3412', Cu: '#c2410c' };
export const NOM_ATOME = { H: 'hydrogène', C: 'carbone', N: 'azote', O: 'oxygène', Na: 'sodium', Mg: 'magnésium', Al: 'aluminium', S: 'soufre', Cl: 'chlore', Ca: 'calcium', Fe: 'fer', Cu: 'cuivre' };

// Entités : f = formule brute [symbole, nombre d'atomes] ; type : atome, molécule, ion (ion : masse des électrons négligée)
export const ENTITES = [
  { id: 'h', nom: 'atome d’hydrogène', f: [['H', 1]], type: 'atome' },
  { id: 'c', nom: 'atome de carbone', f: [['C', 1]], type: 'atome' },
  { id: 'o', nom: 'atome d’oxygène', f: [['O', 1]], type: 'atome' },
  { id: 'al', nom: 'atome d’aluminium', f: [['Al', 1]], type: 'atome' },
  { id: 'fe', nom: 'atome de fer', f: [['Fe', 1]], type: 'atome' },
  { id: 'cu', nom: 'atome de cuivre', f: [['Cu', 1]], type: 'atome' },
  { id: 'h2o', nom: 'molécule d’eau', f: [['H', 2], ['O', 1]], type: 'molécule' },
  { id: 'o2', nom: 'molécule de dioxygène', f: [['O', 2]], type: 'molécule' },
  { id: 'n2', nom: 'molécule de diazote', f: [['N', 2]], type: 'molécule' },
  { id: 'co2', nom: 'molécule de dioxyde de carbone', f: [['C', 1], ['O', 2]], type: 'molécule' },
  { id: 'ch4', nom: 'molécule de méthane', f: [['C', 1], ['H', 4]], type: 'molécule' },
  { id: 'nh3', nom: 'molécule d’ammoniac', f: [['N', 1], ['H', 3]], type: 'molécule' },
  { id: 'ethanol', nom: 'molécule d’éthanol', f: [['C', 2], ['H', 6], ['O', 1]], type: 'molécule' },
  { id: 'glucose', nom: 'molécule de glucose', f: [['C', 6], ['H', 12], ['O', 6]], type: 'molécule' },
  { id: 'na+', nom: 'ion sodium', f: [['Na', 1]], type: 'ion', charge: 1 },
  { id: 'cl-', nom: 'ion chlorure', f: [['Cl', 1]], type: 'ion', charge: -1 },
];
export const entite = id => ENTITES.find(e => e.id === id);

// Formule brute écrite avec indices (« H₂O », « Na⁺ »)
export function formuleTexte(e) {
  const corps = e.f.map(([a, k]) => `${a}${k > 1 ? String(k).split('').map(c => SUB[c]).join('') : ''}`).join('');
  if (!e.charge) return corps;
  const q = Math.abs(e.charge);
  return `${corps}${q > 1 ? sup(q) : ''}${e.charge > 0 ? '⁺' : '⁻'}`;
}
// Lignes du calcul de la masse d'une entité : [symbole, nombre d'atomes, masse d'un atome (kg), masse de ces atomes (kg)]
export const lignesMasse = e => e.f.map(([a, k]) => [a, k, MASSE_ATOME[a], k * MASSE_ATOME[a]]);
const arrondi = (x, cs = 3) => Number(x.toPrecision(cs));
// Masse d'une entité (kg) : somme des masses des atomes, arrondie à 3 chiffres significatifs (c'est la valeur qui est affichée et utilisée)
export const masseEntite = e => arrondi(e.f.reduce((t, [a, k]) => t + k * MASSE_ATOME[a], 0), 3);
export const masseEntiteBrute = e => e.f.reduce((t, [a, k]) => t + k * MASSE_ATOME[a], 0);

// Objets du quotidien comptés par la masse (masse d'un objet en g)
export const OBJETS = [
  { id: 'coquillette', art: 'une', nom: 'coquillette', pluriel: 'coquillettes', m: 0.50 },
  { id: 'lentille', art: 'une', nom: 'lentille', pluriel: 'lentilles', m: 0.050 },
  { id: 'riz', art: 'un', nom: 'grain de riz', pluriel: 'grains de riz', m: 0.025 },
  { id: 'perle', art: 'une', nom: 'perle de verre', pluriel: 'perles de verre', m: 0.20 },
  { id: 'trombone', art: 'un', nom: 'trombone', pluriel: 'trombones', m: 1.0 },
  { id: 'vis', art: 'une', nom: 'vis', pluriel: 'vis', m: 2.0 },
  { id: 'bille', art: 'une', nom: 'bille', pluriel: 'billes', m: 5.0 },
];
export const objet = id => OBJETS.find(o => o.id === id);

// ----- relations -----
export const nombreDepuisMasse = (m, mEntite) => m / mEntite;       // N = m / m_entité (m et m_entité dans la même unité)
export const quantiteDepuisNombre = N => N / NA;                    // n = N / N_A
export const nombreDepuisQuantite = n => n * NA;                    // N = n × N_A
export const kgDepuisG = g => g / 1000;
// Chaîne complète pour un échantillon de masse m (g) d'une entité donnée
export function chaine(e, mGrammes) {
  const mEnt = masseEntite(e), mKg = kgDepuisG(mGrammes), N = nombreDepuisMasse(mKg, mEnt), n = quantiteDepuisNombre(N);
  return { mEnt, mKg, N, n };
}
// Masse d'une mole (g) : facultatif, « un pas vers la 1G » ; m_entité (kg) × N_A × 1000
export const masseUneMole = e => masseEntite(e) * NA * 1000;

// ----- écriture des nombres (virgule française, espaces insécables) -----
export function mantisseExposant(x, cs = 3) {
  if (x === 0) return [0, 0];
  let e = Math.floor(Math.log10(Math.abs(x))), m = Number((x / Math.pow(10, e)).toFixed(cs - 1));
  if (Math.abs(m) >= 10) { m /= 10; e += 1; }
  return [m, e];
}
export const nbf = (x, d) => Number(x).toFixed(d).replace('.', ',');
export function sci(x, cs = 3) {
  const [m, e] = mantisseExposant(x, cs);
  return `${m.toFixed(cs - 1).replace('.', ',')}${NB}×${NB}10${sup(e)}`;
}
// Nombre lisible : décimal si pas trop grand ni trop petit, sinon écriture scientifique ; cs chiffres significatifs
export function nb(x, cs = 3) {
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) return sci(x, cs);
  return Number(x.toPrecision(cs)).toFixed(Math.max(0, cs - 1 - Math.floor(Math.log10(a)))).replace('.', ',');
}
// Entier avec espaces insécables entre les milliers (« 24 000 »)
export const entier = x => Math.round(x).toLocaleString('fr-FR').replace(/[\u202f\u00a0 ]/g, NB);

// ----- défis (tirages bornés) -----
const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi « compter par la masse » : N est choisi entier, la masse totale est affichée exactement (g ou kg), la masse d'un objet en g
export function tirerDefiBalance(prec) {
  const NS = [200, 250, 400, 500, 800, 1200, 2000, 2400, 4000, 5000, 8000, 12000, 20000, 24000, 40000];
  for (let essai = 0; essai < 200; essai++) {
    const o = tire(OBJETS), N = tire(NS), totG = Math.round(N * o.m * 1e6) / 1e6;
    if (totG < 5 || totG > 5000) continue;                           // pas de masse minuscule ni énorme
    if (prec && prec.o.id === o.id && prec.N === N) continue;
    const enKg = totG >= 1000 && Math.abs(Number((totG / 1000).toPrecision(3)) - totG / 1000) < 1e-12;
    const valeur = enKg ? totG / 1000 : totG;
    if (Math.abs(Number(valeur.toPrecision(3)) - valeur) > 1e-12) continue;     // la masse affichée est exacte (3 chiffres significatifs au plus)
    return { o, N, totG, enKg, valeur, vrai: N };
  }
  return { o: OBJETS[0], N: 400, totG: 200, enKg: false, valeur: 200, vrai: 400 };
}
// Défi « de la masse à la quantité de matière » : échantillon d'un atome ou d'une molécule, n attendue calculée à partir de m_entité AFFICHÉE
export function tirerDefiEchantillon(prec) {
  const POSSIBLES = ENTITES.filter(e => e.type !== 'ion' && ['al', 'fe', 'cu', 'c', 'h2o', 'o2', 'co2', 'ch4', 'ethanol', 'glucose', 'n2', 'nh3'].includes(e.id));
  const MS = [0.50, 1.0, 2.0, 2.5, 5.0, 10, 20, 25, 50];
  for (let essai = 0; essai < 200; essai++) {
    const e = tire(POSSIBLES), m = tire(MS);
    if (prec && prec.e.id === e.id && prec.m === m) continue;
    const mEnt = masseEntite(e), N = nombreDepuisMasse(kgDepuisG(m), mEnt), n = quantiteDepuisNombre(N);
    if (n < 0.003 || n > 5) continue;
    return { e, m, mEnt, N, n, vrai: n };
  }
  const e = entite('h2o'), m = 5.0, mEnt = masseEntite(e), N = nombreDepuisMasse(kgDepuisG(m), mEnt), n = quantiteDepuisNombre(N);
  return { e, m, mEnt, N, n, vrai: n };
}
