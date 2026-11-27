// Modèle pur de la simulation 317 « Choisir un filtre : spectre, bande passante et gabarit » (terminale STL, SPCL, Systèmes et procédés).
// Un signal est une liste de raies { f (Hz, 0 = composante continue), a (V), ph (rad) } ; un filtre multiplie l'amplitude de chaque raie par A(f).
// Les gains reprennent ceux des filtres RC du premier ordre de la sim 316 (filtreModele.js). Le passe-bande est une CASCADE passe-haut (f1) puis passe-bas (f2) : A = A1 × A2 (idéal, sans charge).
// Le coupe-bande est modélisé par deux filtres en parallèle (passe-bas f1 + passe-haut f2, f1 < f2) : somme des amplitudes, plafonnée à 1 (modèle simplifié, annoncé dans les hypothèses).
import * as M from './filtreModele.js';

export const NB = M.NB, nbf = M.nbf, fTxt = M.fTxt, F_MIN = M.F_MIN, F_MAX = M.F_MAX;
export const TYPES = { bas: 'passe-bas', haut: 'passe-haut', bande: 'passe-bande', rej: 'coupe-bande' };
export const A_PASSE = 0.9;     // la raie utile doit passer : A ≥ 0,9
export const A_COUPE = 0.1;     // le parasite doit être supprimé : A ≤ 0,1
export const ECART_MIN = 1.5;   // rapport minimal f2 / f1 entre les deux fréquences de coupure d'un passe-bande ou coupe-bande

// ---------- filtres ----------
export function gainFiltre(type, f, f1, f2) {
  if (type === 'bas') return M.gain('bas', f, f1);
  if (type === 'haut') return f <= 0 ? 0 : M.gain('haut', f, f1);
  if (type === 'bande') return f <= 0 ? 0 : M.gain('haut', f, f1) * M.gain('bas', f, f2);
  return Math.min(1, M.gain('bas', f, f1) + (f <= 0 ? 0 : M.gain('haut', f, f2)));
}
export const nbCoupures = type => (type === 'bas' || type === 'haut' ? 1 : 2);

// ---------- signaux ----------
export const raie = (f, a, ph = 0) => ({ f, a, ph });
export const valeur = (raies, t) => raies.reduce((s, r) => s + (r.f === 0 ? r.a : r.a * Math.sin(2 * Math.PI * r.f * t + r.ph)), 0);
export const sortie = (raies, type, f1, f2) => raies.map(r => ({ ...r, a: r.a * gainFiltre(type, r.f, f1, f2) }));
export const amplitudeMax = raies => raies.reduce((s, r) => s + Math.abs(r.a), 0);
export const moyenne = raies => raies.filter(r => r.f === 0).reduce((s, r) => s + r.a, 0);
// signal triangulaire de fréquence f0 et d'amplitude crête-à-crête de 2 × amp : harmoniques impairs, amplitudes 8·amp / (π² n²)
export function triangle(f0, amp, nMax = 9) {
  const out = [];
  for (let n = 1, k = 0; n <= nMax; n += 2, k++) out.push(raie(f0 * n, 8 * amp / (Math.PI ** 2 * n * n), k % 2 ? Math.PI : 0));
  return out;
}
// fenêtre d'affichage temporelle : 2 périodes de la plus basse fréquence non nulle
export function fenetre(raies) {
  const fs = raies.filter(r => r.f > 0).map(r => r.f);
  if (!fs.length) return { Tw: 1e-3, n: 200 };
  const fmin = Math.min(...fs), fmax = Math.max(...fs), Tw = Math.min(2 / fmin, 60 / fmax);
  return { Tw, n: Math.max(300, Math.min(1400, Math.round(Tw * fmax * 14))) };
}

// le signal temporel n'est lisible que si les fréquences extrêmes restent dans un rapport raisonnable (sinon il est masqué)
export const tempsLisible = raies => { const fs = raies.filter(r => r.f > 0).map(r => r.f); return !fs.length || Math.max(...fs) / Math.min(...fs) <= 150; };

// ---------- fréquences : positions sur l'axe logarithmique du spectre ----------
export const posLog = M.posLog, freqDepuisPos = M.freqDepuisPos, arrondiF = M.arrondiF;
export const borne = f => Math.min(F_MAX, Math.max(F_MIN, f));

// ---------- cahier des charges ----------
// utiles : fréquences à conserver (A ≥ 0,9) ; parasites : fréquences à supprimer (A ≤ 0,1) ; 0 = composante continue.
export function respecte(type, f1, f2, cahier) {
  const au = cahier.utiles.map(f => gainFiltre(type, f, f1, f2)), ap = cahier.parasites.map(f => gainFiltre(type, f, f1, f2));
  return { au, ap, ok: au.every(a => a >= A_PASSE - 1e-9) && ap.every(a => a <= A_COUPE + 1e-9) };
}
// recherche exhaustive d'une solution sur la grille des fréquences arrondies à 2 chiffres significatifs (sert aux tests et à la correction)
export function solutions(type, cahier) {
  const grille = [];
  for (let e = 1; e <= 4; e++) for (let m = 10; m <= 99; m++) grille.push(m * 10 ** (e - 1));
  grille.push(1e5);
  const s = [];
  if (nbCoupures(type) === 1) { for (const f1 of grille) if (respecte(type, f1, f1, cahier).ok) s.push([f1, f1]); }
  else for (const f1 of grille) for (const f2 of grille) if (f2 >= f1 * ECART_MIN && respecte(type, f1, f2, cahier).ok) s.push([f1, f2]);
  return s;
}
export function intervalleFc(type, cahier) {
  const s = solutions(type, cahier);
  if (!s.length) return null;
  const f1 = s.map(x => x[0]), f2 = s.map(x => x[1]);
  return { f1: [Math.min(...f1), Math.max(...f1)], f2: [Math.min(...f2), Math.max(...f2)] };
}

const tire = t => t[Math.floor(Math.random() * t.length)];
const arr2 = f => M.arrondiF(f);

// Défi « placer fc » : un passe-bas, un passe-haut ou un passe-bande est imposé ; l'élève règle les fréquences de coupure pour respecter le cahier des charges
function tirageDefiFcBrut() {
  const type = tire(['bas', 'haut', 'bande', 'bas', 'haut']);
  let cahier, ampU = tire([1.5, 2, 2.5, 3]), ampP = tire([0.5, 1, 1.5]);
  if (type === 'bas') {
    const fu = tire([50, 100, 200, 500, 1000, 2000]), k = tire([40, 50, 60]);
    cahier = { utiles: [fu], parasites: [Math.min(1e5, arr2(fu * k))], texte: 'bruit haute fréquence' };
  } else if (type === 'haut') {
    const continu = Math.random() < 0.4, fu = continu ? tire([200, 500, 1000]) : tire([2000, 5000, 10000]);
    cahier = { utiles: [fu], parasites: [continu ? 0 : 50], texte: continu ? 'composante continue' : 'parasite à 50 Hz du secteur' };
  } else {
    const fu = tire([1000, 2000]);
    cahier = { utiles: [fu], parasites: [arr2(fu / tire([40, 50, 100])), Math.min(1e5, arr2(fu * tire([40, 50])))], texte: 'deux parasites, un grave et un aigu' };
  }
  const raies = [...cahier.utiles.map(f => raie(f, ampU))];
  for (const f of cahier.parasites) raies.push(f === 0 ? raie(0, ampP) : raie(f, ampP, 0.6));
  return { type, cahier, raies, f1: type === 'haut' ? 10 : 1000, f2: 10000 };
}
// la position de départ des poignées ne doit jamais déjà respecter le cahier des charges
export function tirageDefiFc() {
  let d;
  for (let i = 0; i < 100; i++) { d = tirageDefiFcBrut(); if (!respecte(d.type, d.f1, d.f2, d.cahier).ok) break; }
  return d;
}
export function diagFc(d, f1, f2) {
  const r = respecte(d.type, f1, f2, d.cahier), bi = nbCoupures(d.type) === 2;
  if (r.ok) return { ok: true, msg: '' };
  const utileKo = r.au.findIndex(a => a < A_PASSE - 1e-9), parKo = r.ap.findIndex(a => a > A_COUPE + 1e-9);
  const n = v => nbf(v, 2);
  if (utileKo >= 0) {
    const a = r.au[utileKo];
    const fut = d.cahier.utiles[utileKo];
    const sens = d.type === 'bas' ? 'trop basse : augmentez fc' : d.type === 'haut' ? 'trop haute : diminuez fc' : (fut < Math.sqrt(f1 * f2) ? 'f1 est trop haute : diminuez-la, ou f2 est trop basse' : 'f2 est trop basse : augmentez-la');
    return { ok: false, msg: `La raie utile à ${fTxt(fut)} est trop atténuée : A = ${n(a)}, il faut A ≥ ${nbf(A_PASSE, 1)}. ${bi ? 'Une des fréquences de coupure est mal placée' : 'La fréquence de coupure est ' + sens} (${bi ? sens : ''}).`.replace(' ().', '.') };
  }
  const f = d.cahier.parasites[parKo], a = r.ap[parKo];
  const sens = d.type === 'bas' ? 'trop haute : diminuez fc' : d.type === 'haut' ? 'trop basse : augmentez fc' : (f < Math.sqrt(f1 * f2) ? 'f1 est trop basse : augmentez-la' : 'f2 est trop haute : diminuez-la');
  return { ok: false, msg: `Le parasite à ${f === 0 ? '0 Hz (composante continue)' : fTxt(f)} n’est pas assez atténué : A = ${n(a)}, il faut A ≤ ${nbf(A_COUPE, 1)}. ${bi ? 'Il faut déplacer une fréquence de coupure' : 'La fréquence de coupure est ' + sens} (${bi ? sens : ''}).`.replace(' ().', '.') };
}

// Défi « choisir le type de filtre »
export const SCENARIOS_TYPE = [
  { type: 'bas', utiles: [[200], [500], [100]], parasites: [[20000], [50000], [30000]], txt: 'un bruit haute fréquence' },
  { type: 'bas', utiles: [[50], [100]], parasites: [[10000], [5000]], txt: 'des parasites haute fréquence' },
  { type: 'haut', utiles: [[5000], [2000], [10000]], parasites: [[50]], txt: 'le parasite de 50 Hz du secteur' },
  { type: 'haut', utiles: [[1000], [2000]], parasites: [[0]], txt: 'une composante continue parasite' },
  { type: 'bande', utiles: [[1000], [2000]], parasites: [[50, 50000], [50, 30000], [100, 100000]], txt: 'deux parasites, un grave et un aigu' },
  { type: 'rej', utiles: [[20, 20000], [30, 30000]], parasites: [[1000], [800]], txt: 'un parasite situé entre deux raies utiles' },
];
export function tirageDefiType() {
  const s = tire(SCENARIOS_TYPE), i = Math.floor(Math.random() * s.utiles.length), j = Math.floor(Math.random() * s.parasites.length);
  const utiles = s.utiles[i], parasites = s.parasites[j];
  const cahier = { utiles, parasites, texte: s.txt };
  const amp = tire([1.5, 2, 2.5]);
  const raies = [...utiles.map(f => raie(f, amp)), ...parasites.map(f => (f === 0 ? raie(0, 1) : raie(f, 1, 0.6)))];
  return { type: s.type, cahier, raies, rep: null };
}
export function diagType(d, rep) {
  if (rep === d.type) return { ok: true, msg: '' };
  const au = (d.cahier.utiles.map(f => fTxt(f))).join(' et '), ap = d.cahier.parasites.map(f => (f === 0 ? '0 Hz' : fTxt(f))).join(' et ');
  const cas = {
    bas: `Le parasite (${ap}) est plus haut que la raie utile (${au}) : on garde les basses fréquences et on supprime les hautes.`,
    haut: `Le parasite (${ap}) est plus bas que la raie utile (${au}) : on garde les hautes fréquences et on supprime les basses.`,
    bande: `Les parasites (${ap}) encadrent la raie utile (${au}) : on garde une bande de fréquences, d’où le passe-bande.`,
    rej: `Le parasite (${ap}) est entre les raies utiles (${au}) : on supprime une bande de fréquences, d’où le coupe-bande.`,
  };
  return { ok: false, msg: `Ce n’est pas ${TYPES[rep] === 'passe-haut' ? 'un passe-haut' : TYPES[rep] === 'passe-bas' ? 'un passe-bas' : TYPES[rep] === 'passe-bande' ? 'un passe-bande' : 'un coupe-bande'}. ${cas[d.type]}` };
}
