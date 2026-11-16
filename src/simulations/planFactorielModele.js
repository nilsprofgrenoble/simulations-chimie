// Modèle pur des plans d'expériences factoriels à deux niveaux (codage −1 / +1), sans interface.
// Données réelles : TP « flan chocolat » (2³ complet), activité « vinaigrette » (2⁴ complet) et mémo « vinaigrette » (2⁵⁻¹, résolution V).
import { student95 } from './planMelangeModele.js';
export { student95 };

// ---------- jeux de données ----------
// Plan 2³ complet (ordre de l'énoncé : le dernier facteur varie le plus vite)
const X8 = [[-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1]];
// Plan 2⁴ complet (ordre de l'énoncé : le dernier facteur varie le plus vite)
const X16 = Array.from({ length: 16 }, (_, i) => [0, 1, 2, 3].map(k => (((i >> (3 - k)) & 1) ? 1 : -1)));
// Plan 2⁵⁻¹ (générateur E = ABCD, ordre standard : A varie le plus vite)
const X16F = Array.from({ length: 16 }, (_, i) => { const a = [0, 1, 2, 3].map(k => (((i >> k) & 1) ? 1 : -1)); return [...a, a[0] * a[1] * a[2] * a[3]]; });

export const JEUX = {
  flan: {
    id: 'flan', titre: 'Flan au chocolat', plan: '2³ complet (8 essais)', n: 8, X: X8,
    facteurs: [
      { id: 'R', nom: 'Recette', court: 'recette', bas: 'animale', haut: 'végétale' },
      { id: 'T', nom: 'Température de travail', court: 'température', bas: 75, haut: 102, unite: '°C' },
      { id: 'C', nom: 'Refroidissement', court: 'refroidissement', bas: 'lent', haut: 'rapide' },
    ],
    reponses: [
      { id: 'note', nom: 'Note moyenne du jury', unite: '/ 10', dec: 1, y: [6.5, 6, 7, 5.5, 2, 2, 2.5, 3] },
      { id: 'visc', nom: 'Viscosité à bas gradient', unite: '(unité du viscosimètre)', dec: 0, y: [2476, 3070, 5403, 4883, 212, 187, 5863, 5089] },
    ],
  },
  vin4: {
    id: 'vin4', titre: 'Vinaigrette allégée', plan: '2⁴ complet (16 essais)', n: 16, X: X16,
    facteurs: [
      { id: 'S', nom: 'Sel', bas: 1, haut: 2, unite: 'g' },
      { id: 'X', nom: 'Xanthane', bas: 0.2, haut: 0.4, unite: 'g' },
      { id: 'U', nom: 'Amidon Ultratech', bas: 0.9, haut: 2.2, unite: 'g' },
      { id: 'N', nom: 'Amidon Novation', bas: 0, haut: 1, unite: 'g' },
    ],
    reponses: [{ id: 'note', nom: 'Note du jury', unite: '/ 10', dec: 1, y: [1.2, 6.8, 4.2, 5.9, 3.4, 8.4, 5.9, 8.1, 1.6, 6.8, 4.2, 6.1, 3.4, 8.5, 6.2, 8.1] }],
  },
  vin5: {
    id: 'vin5', titre: 'Vinaigrette, 5 facteurs', plan: '2⁵⁻¹ de résolution V (16 essais au lieu de 32)', n: 16, X: X16F, generateur: 'E = ABCD',
    facteurs: [
      { id: 'A', nom: 'Agitation', bas: 'Ultra-Turrax', haut: 'turbine' },
      { id: 'B', nom: 'Sel', bas: 1, haut: 2, unite: 'g' },
      { id: 'C', nom: 'Xanthane', bas: 0.2, haut: 0.4, unite: 'g' },
      { id: 'D', nom: 'Amidon Ultratech', bas: 0.9, haut: 2.2, unite: 'g' },
      { id: 'E', nom: 'Amidon Novation', bas: 0, haut: 1, unite: 'g' },
    ],
    reponses: [{ id: 'note', nom: 'Note du jury', unite: '/ 10', dec: 1, y: [9, 0, 0, 10, 3, 8, 8, 3, 5, 7, 7, 4, 6, 9, 9, 4] }],
  },
};

// ---------- termes du modèle : [] = constante, [i] = effet principal, [i, j] = interaction… ----------
export const nomTerme = (t, fact) => (t.length === 0 ? 'constante' : t.map(i => fact[i].id).join('·'));
export const colonne = (X, t) => X.map(r => t.reduce((p, i) => p * r[i], 1));
export function termes(k, ordreMax = 2) {
  const L = [];
  const rec = (debut, cur) => { if (cur.length && cur.length <= ordreMax) L.push([...cur]); if (cur.length >= ordreMax) return; for (let i = debut; i < k; i++) rec(i + 1, [...cur, i]); };
  rec(0, []);
  return L.sort((a, b) => a.length - b.length || a.join() .localeCompare(b.join()));
}

// ---------- coefficients : plan orthogonal → coefficient = moyenne de (colonne × réponse) ----------
// (= (moyenne des essais où la colonne vaut +1 − moyenne des essais où elle vaut −1) / 2)
export const coefTerme = (X, y, t) => colonne(X, t).reduce((s, c, i) => s + c * y[i], 0) / y.length;
export const moyennes = (X, y, t) => {
  const c = colonne(X, t), plus = [], moins = [];
  c.forEach((v, i) => (v > 0 ? plus : moins).push(y[i]));
  const m = a => a.reduce((s, v) => s + v, 0) / a.length;
  return { plus: m(plus), moins: m(moins), np: plus.length };
};
export const moyenneGenerale = y => y.reduce((s, v) => s + v, 0) / y.length;

// ---------- ajustement du modèle polynomial (plan orthogonal : les coefficients ne dépendent pas des termes retirés) ----------
export function ajuste(X, y, ts) {
  const n = y.length, p = ts.length + 1;
  const a0 = moyenneGenerale(y), coefs = [a0, ...ts.map(t => coefTerme(X, y, t))];
  const pred = X.map(r => predit(coefs, ts, r));
  const residus = y.map((v, i) => v - pred[i]);
  const sce = residus.reduce((s, r) => s + r * r, 0), ym = a0, sct = y.reduce((s, v) => s + (v - ym) ** 2, 0);
  const ddl = n - p;
  const s = ddl > 0 ? Math.sqrt(sce / ddl) : null;
  return { coefs, ts, pred, residus, sce, sct, ddl, n, p, s, se: s == null ? null : s / Math.sqrt(n), r2: sct > 0 ? 1 - sce / sct : 1 };
}
export const predit = (coefs, ts, x) => coefs[0] + ts.reduce((s, t, k) => s + coefs[k + 1] * t.reduce((p, i) => p * x[i], 1), 0);
// Intervalle de confiance à 95 % d'un coefficient : σ connue (loi normale) ou s estimé (Student)
export const demiICsigma = (sigma, n) => 1.96 * sigma / Math.sqrt(n);
export const demiICstudent = fit => (fit.ddl > 0 ? student95(fit.ddl) * fit.se : null);

// ---------- codage : niveau réel ↔ variable codée ----------
export const codeDe = (reel, bas, haut) => (reel - (bas + haut) / 2) / ((haut - bas) / 2);
export const reelDe = (x, bas, haut) => (bas + haut) / 2 + x * (haut - bas) / 2;

// ---------- alias d'une fraction E = ABCD (relation de définition I = ABCDE) : complément dans {0..k-1} ----------
export const alias = (t, k) => { const tous = Array.from({ length: k }, (_, i) => i); return tous.filter(i => !t.includes(i)); };

// ---------- isoréponses d'un modèle f(x, y) sur [−1, 1]² (carrés + interpolation) ----------
export function segmentsIso2(f, niveau, n = 40) {
  const pas = 2 / n, pt = (i, j) => [-1 + i * pas, -1 + j * pas], F = [];
  for (let i = 0; i <= n; i++) { F.push([]); for (let j = 0; j <= n; j++) F[i].push(f(...pt(i, j))); }
  const segs = [], inter = (A, B, fa, fb) => { const t = (niveau - fa) / (fb - fa); return [A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]; };
  const tri = (P, V) => {
    const dedans = V.map(v => v >= niveau), nb = dedans.filter(Boolean).length;
    if (nb === 0 || nb === 3) return;
    const pts = [];
    for (let a = 0; a < 3; a++) { const b = (a + 1) % 3; if (dedans[a] !== dedans[b]) pts.push(inter(P[a], P[b], V[a], V[b])); }
    if (pts.length === 2) segs.push(pts);
  };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
    tri([a, b, c], [F[i][j], F[i + 1][j], F[i + 1][j + 1]]);
    tri([a, c, d], [F[i][j], F[i + 1][j + 1], F[i][j + 1]]);
  }
  return segs;
}
