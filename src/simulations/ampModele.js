// Modèle de la simulation 315 « Amplifier une tension : de quelques mV au CAN » (terminale STL, SPCL, Systèmes et procédés : flux d'information).
// Un capteur délivre une tension Ue(t) sinusoïdale de quelques mV, entre umin et umax (en mV). L'amplificateur à AOP (alimenté ±12 V, « boîte noire ») multiplie
// cette tension par le facteur d'amplification A = Us/Ue (A > 0 : montage non inverseur ; A < 0 : montage inverseur) ; un montage sommateur peut ajouter une tension continue Vdc.
//   Us = A × Ue + Vdc, puis écrêtage à ±V_SAT (saturation de l'AOP). Le CAN lit les tensions de 0 à 5 V : en dehors, il lit 0 ou 5 V (modèle idéal).
import * as M from './filtreModele.js';

export const NB = M.NB, nbf = M.nbf;
export const V_SAT = 12;        // tension de saturation de l'AOP (V), égale à son alimentation dans le modèle
export const CAN_MAX = 5;       // le CAN lit de 0 à 5 V
export const F_SIGNAL = 1000;   // fréquence du signal du capteur (Hz), pour l'animation
export const OCCUPE_MIN = 0.8;  // un signal « remplit » la plage s'il en occupe au moins 80 %
export const A_MIN = 1, A_MAX = 2000;
const TWO_PI = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ---------- signal du capteur (mV) ----------
export const sig = (umin, umax) => ({ umin, umax });
export const ueV = (s, t) => ((s.umax + s.umin) / 2 + (s.umax - s.umin) / 2 * Math.sin(TWO_PI * F_SIGNAL * t)) / 1000;
export const hmaxV = s => Math.max(Math.abs(s.umin), Math.abs(s.umax)) / 1000;   // plus grande valeur absolue de Ue (V)
export const milieuV = s => (s.umax + s.umin) / 2000;                             // valeur moyenne de Ue (V)

// ---------- amplificateur ----------
export const usIdeal = (s, A, vdc, t) => A * ueV(s, t) + vdc;
export const usReel = (s, A, vdc, t) => clamp(usIdeal(s, A, vdc, t), -V_SAT, V_SAT);
export function extremesIdeaux(s, A, vdc) {
  const a = A * s.umin / 1000 + vdc, b = A * s.umax / 1000 + vdc;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}
export function extremes(s, A, vdc) {
  const e = extremesIdeaux(s, A, vdc);
  return { min: clamp(e.min, -V_SAT, V_SAT), max: clamp(e.max, -V_SAT, V_SAT) };
}
export const sature = (s, A, vdc) => { const e = extremesIdeaux(s, A, vdc); return { haut: e.max > V_SAT + 1e-9, bas: e.min < -V_SAT - 1e-9 }; };
export const lectureCAN = us => clamp(us, 0, CAN_MAX);
// état du signal de sortie vis-à-vis de la plage du CAN
export function etatCAN(s, A, vdc) {
  const e = extremes(s, A, vdc), haut = e.max > CAN_MAX + 1e-9, bas = e.min < -1e-9;
  const lo = clamp(e.min, 0, CAN_MAX), hi = clamp(e.max, 0, CAN_MAX);
  return { ...e, haut, bas, dans: !haut && !bas, occupe: (hi - lo) / CAN_MAX };
}

// ---------- réglage de A et de Vdc ----------
export const arrondi2 = x => Number(Number(x).toPrecision(2));
export function pasA(A) { const a = Math.abs(A); return a < 10 ? 1 : 10 ** (Math.floor(Math.log10(a)) - 1); }
// valeur de A voisine (grille à 2 chiffres significatifs) ; le signe est conservé
export function aSuivant(A, dir) {
  const sgn = A < 0 ? -1 : 1, a = Math.abs(A);
  let n = a + dir * (dir > 0 ? pasA(a) : pasA(a - 1e-9));
  n = arrondi2(Math.max(A_MIN, Math.min(A_MAX, n)));
  return sgn * n;
}
// A correspondant à un niveau de sortie extrême Us (le sommet de la courbe quand A > 0, le creux quand A < 0)
export function aDepuisNiveau(niveau, vdc, s, montage) {
  const h = hmaxV(s) || 1e-3;
  let A = (niveau - vdc) / h;
  if (montage === 'inv') A = -Math.max(A_MIN, Math.abs(A)); else A = Math.max(A_MIN, A);
  A = Math.sign(A) * Math.min(A_MAX, Math.abs(A));
  return Math.sign(A) * arrondi2(Math.abs(A));
}
export const niveauExtreme = (s, A, vdc) => vdc + A * hmaxV(s);   // y de la poignée de A
export const arrondiVdc = v => Math.round(clamp(v, -6, 6) * 10) / 10;
// intervalle de A (valeurs exactes) pour lequel Us,max est entre 4 V et 5 V avec Vdc = 0 et un signal 0 à umax
export const intervalleA = umax => [OCCUPE_MIN * CAN_MAX * 1000 / umax, CAN_MAX * 1000 / umax];

// ---------- défi 1 : choisir A pour remplir la plage du CAN ----------
export function tirageDefiA(rnd = Math.random) {
  const umax = [8, 10, 12, 15, 20, 25, 40][Math.floor(rnd() * 7)];
  return { s: sig(0, umax), A: 50, vdc: 0 };
}
export function diagA(d, A) {
  const e = extremes(d.s, A, 0), [a0, a1] = intervalleA(d.s.umax), usMax = A * d.s.umax / 1000;
  const calc = `Us,max = A × Ue,max = ${nbf(A, 0)} × ${d.s.umax} mV = ${nbf(usMax, 2)} V`;
  if (usMax > CAN_MAX + 1e-9) return { ok: false, msg: `${calc} : c’est plus que 5 V, le CAN écrête le haut du signal. Diminuez A.`, ...e };
  if (usMax < OCCUPE_MIN * CAN_MAX - 1e-9) return { ok: false, msg: `${calc} : le signal occupe moins de 80 % de la plage (moins de 4 V). Augmentez A.`, ...e };
  return { ok: true, msg: '', ...e, a0, a1 };
}
// ---------- défi 2 : ajouter la tension continue pour centrer le signal ----------
const PAIRES_DC = [[4, 300], [5, 300], [5, 400], [6, 300], [8, 200], [8, 250], [10, 150], [10, 180], [4, 400], [10, 200]];
export function tirageDefiDc(rnd = Math.random) {
  const [umax, A] = PAIRES_DC[Math.floor(rnd() * PAIRES_DC.length)];
  return { s: sig(-umax, umax), A, vdc: 0 };
}
export function intervalleDc(s, A) { const h = Math.abs(A) * hmaxV(s); return [Math.round(h * 100) / 100, Math.round((CAN_MAX - h) * 100) / 100]; }
export function diagDc(d, vdc) {
  const e = extremes(d.s, d.A, vdc), h = Math.abs(d.A) * hmaxV(d.s);
  if (e.min < -1e-9) return { ok: false, msg: `Le bas du signal descend à ${nbf(e.min, 2)} V : le CAN lit 0 V pour toute valeur négative. Augmentez la tension continue.`, ...e };
  if (e.max > CAN_MAX + 1e-9) return { ok: false, msg: `Le haut du signal monte à ${nbf(e.max, 2)} V : le CAN écrête au-dessus de 5 V. Diminuez la tension continue.`, ...e };
  return { ok: true, msg: '', ...e, h };
}
