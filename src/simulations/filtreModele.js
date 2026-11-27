// Modèle de la simulation 316 « Filtres passifs : passe-bas, passe-haut et fréquence de coupure » (terminale STL, SPCL, Systèmes et procédés).
// Filtres RC du premier ordre alimentés par une tension sinusoïdale : A(f) = Us,max / Ue,max.
//   passe-bas  (R en série, C vers la masse) : A = 1 / √(1 + (f/fc)²)
//   passe-haut (C en série, R vers la masse) : A = (f/fc) / √(1 + (f/fc)²)
//   fréquence de coupure fc = 1 / (2πRC) : A = Amax / √2 ≈ 0,707 × Amax (ici Amax = 1)
// Le déphasage est calculé (pour dessiner Us décalée de Ue) mais n'est pas étudié.
export const NB = ' '; // espace insécable fine
export const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
export const F_MIN = 10, F_MAX = 1e5;
export const FREQS_TP = [10, 100, 1000, 1e4, 1e5];     // fréquences du TP (une par décade)
export const UE_MAX = 2;                                 // amplitude de la tension d'entrée (V) dans le parcours
export const R_OPTIONS = [100, 220, 470, 1000, 2200, 4700];   // Ω
export const C_OPTIONS = [0.1, 0.22, 0.47, 1, 2.2];            // µF
export const SEUIL = Math.SQRT1_2;                       // 0,7071 : rapport A / Amax à la fréquence de coupure
export const NATURES = { bas: 'passe-bas', haut: 'passe-haut' };

export const fcRC = (R, C_uF) => 1 / (2 * Math.PI * R * C_uF * 1e-6);
export function gain(nature, f, fc) {
  const x = f / fc;
  return nature === 'bas' ? 1 / Math.sqrt(1 + x * x) : x / Math.sqrt(1 + x * x);
}
export const gainDB = A => (A > 0 ? 20 * Math.log10(A) : -Infinity);
// déphasage de Us par rapport à Ue (radians) : retard pour le passe-bas, avance pour le passe-haut
export const dephasage = (nature, f, fc) => (nature === 'bas' ? -Math.atan(f / fc) : Math.atan(fc / f));
// fréquence pour laquelle A vaut a (0 < a < 1)
export function freqPourGain(nature, a, fc) {
  if (!(a > 0 && a < 1)) return null;
  return nature === 'bas' ? fc * Math.sqrt(1 / (a * a) - 1) : fc * a / Math.sqrt(1 - a * a);
}
export const decade = f => Math.log10(f);

// ---------- affichage ----------
const rogne = (v, d) => nbf(v, d).replace(/,?0+$/, '');
export function fTxt(f) {
  if (f >= 1000) return `${rogne(f / 1000, 2)}${NB}kHz`;
  if (f >= 10) return `${Math.round(f)}${NB}Hz`;
  return `${rogne(f, 1)}${NB}Hz`;
}
export const RTxt = R => (R >= 1000 ? `${rogne(R / 1000, 1)}${NB}kΩ` : `${R}${NB}Ω`);
export const CTxt = C => `${rogne(C, 2)}${NB}µF`;
export const gTxt = (v, d = 2) => nbf(v, d);
export const UTxt = v => `${nbf(v, Math.abs(v) < 0.1 ? 3 : 2)}${NB}V`;

// base de temps de l'oscilloscope : séquence 1-2-5, période entre 2 et 5 divisions
export function baseTemps(f) {
  const T = 1 / f, cible = T / 3.3, seq = [];
  for (let e = -6; e <= 0; e++) for (const m of [1, 2, 5]) seq.push(e < 0 ? m / 10 ** (-e) : m * 10 ** e);
  let best = seq[0];
  for (const s of seq) if (Math.abs(Math.log(s / cible)) < Math.abs(Math.log(best / cible))) best = s;
  return best;                                     // secondes par division
}
export function tdivTxt(s) {
  if (s >= 1) return `${nbf(s, 0)}${NB}s/div`;
  if (s >= 1e-3) return `${nbf(s * 1e3, 0)}${NB}ms/div`;
  return `${nbf(s * 1e6, 0)}${NB}µs/div`;
}
// fréquence « visuelle » de l'animation (Hz) : lente, elle croît avec log f
export const fVisuel = f => 0.5 + 0.35 * Math.log10(Math.max(f, F_MIN) / F_MIN);

// ---------- axe logarithmique ----------
export const posLog = (f, x0, x1) => x0 + (Math.log10(f) - 1) / 4 * (x1 - x0);      // 10 Hz → x0 ; 100 kHz → x1
export const freqDepuisPos = (X, x0, x1) => 10 ** (1 + 4 * Math.min(1, Math.max(0, (X - x0) / (x1 - x0))));
// pas du clavier : 1/12 de décade
export const freqPas = (f, d) => Math.min(F_MAX, Math.max(F_MIN, f * 10 ** (d / 12)));
// arrondi d'une fréquence réglée à la souris (2 chiffres significatifs)
export function arrondiF(f) { const e = Math.floor(Math.log10(f)) - 1; const p = 10 ** e; return Math.round(f / p) * p; }

// ---------- défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
// Défi « boîte noire » : nature et fréquence de coupure inconnues
export function tirageDefiBoite() {
  for (;;) {
    const nature = tire(['bas', 'haut']), R = tire(R_OPTIONS), C = tire(C_OPTIONS), fc = fcRC(R, C);
    if (fc >= 150 && fc <= 8000) return { nature, R, C, fc };
  }
}
export function diagBoite(d, nat, x) {
  if (!nat) return { ok: false, msg: 'Choisissez d’abord la nature du filtre : passe-bas ou passe-haut.' };
  if (!(x > 0) || !isFinite(x)) return { ok: false, msg: 'Écrivez la fréquence de coupure en hertz, sous forme d’un nombre positif (exemple : 850).' };
  if (nat !== d.nature) {
    return { ok: false, msg: d.nature === 'bas'
      ? 'La nature n’est pas la bonne. Regardez A à 10 Hz et à 100 kHz : ici A est proche de 1 aux basses fréquences et diminue aux hautes fréquences, donc le filtre laisse passer les basses fréquences.'
      : 'La nature n’est pas la bonne. Regardez A à 10 Hz et à 100 kHz : ici A est proche de 0 aux basses fréquences et monte vers 1 aux hautes fréquences, donc le filtre laisse passer les hautes fréquences.' };
  }
  const err = (x - d.fc) / d.fc;
  if (Math.abs(err) <= 0.12) return { ok: true, msg: '' };
  const aTa = gain(d.nature, x, d.fc), f05 = freqPourGain(d.nature, 0.5, d.fc);
  if (Math.abs(x - f05) / f05 < 0.12) return { ok: false, msg: `La nature est juste, mais la fréquence que vous donnez est celle où A vaut 0,5. La fréquence de coupure correspond à A = Amax ÷ √2 ≈ 0,71 (et non 0,5).` };
  return { ok: false, msg: `La nature est juste, mais à ${fTxt(x)} le filtre a A = ${gTxt(aTa)} : la fréquence de coupure est celle où A ≈ 0,71. Votre valeur est trop ${err < 0 ? 'petite' : 'grande'} : cherchez où A vaut 0,71 sur la courbe.` };
}
// Défi « prévoir la sortie » : on connaît le filtre et on cherche Us,max pour une fréquence donnée
export function tirageDefiPrevoir() {
  for (;;) {
    const nature = tire(['bas', 'haut']), R = tire(R_OPTIONS), C = tire(C_OPTIONS), fc = fcRC(R, C), f = tire([200, 500, 1000, 2000, 5000, 10000]), ue = tire([1, 1.5, 2, 2.5, 3]);
    const A = gain(nature, f, fc);
    if (fc >= 150 && fc <= 8000 && A >= 0.25 && A <= 0.95) { const a = Math.round(A * 100) / 100; return { nature, R, C, fc, f, ue, A: a, vrai: a * ue }; }
  }
}
export function diagPrevoir(d, x) {
  if (!(x > 0) || !isFinite(x)) return { ok: false, msg: 'Écrivez l’amplitude de Us en volts, sous forme d’un nombre positif (exemple : 1,3).' };
  const err = (x - d.vrai) / d.vrai;
  if (Math.abs(err) <= 0.15) return { ok: true, msg: '' };
  if (x > d.ue * 1.001) return { ok: false, msg: `Us,max ne peut pas dépasser Ue,max = ${nbf(d.ue, 1)}${NB}V : un filtre passif n’amplifie pas (A ≤ 1).` };
  if (Math.abs(x - d.A) / d.A < 0.15 && d.ue !== 1) return { ok: false, msg: 'Vous avez donné le facteur d’amplification A, sans unité. Us,max = A × Ue,max : multipliez A par l’amplitude de la tension d’entrée.' };
  return { ok: false, msg: `Votre valeur correspond à A = ${gTxt(x / d.ue)} (Us,max ÷ Ue,max) : à ${fTxt(d.f)}, la courbe est plus ${err < 0 ? 'haute' : 'basse'}. Relisez A sur la courbe (grille de 0,1), puis calculez Us,max = A × Ue,max.` };
}
