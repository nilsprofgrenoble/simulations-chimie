// ====================================================
//  GRAPHEUR — calculs complémentaires (sans React), testés par grapheurCalculs.test.mjs
//  1. Colonnes calculées : un petit évaluateur de formules (jamais eval) : + − × ÷ ^, parenthèses, log, ln, exp, sqrt, abs, sin, cos, tan…
//  2. Modèles : parabole (moindres carrés linéaires), exponentielle simple et avec asymptote (moindres carrés non linéaires, Gauss-Newton),
//     tous avec incertitudes-types des paramètres.
//  3. Échelle logarithmique, dérivée locale (tangente).
//  Les modèles proportionnel et affine restent dans grapheurModele.js ; adapterLineaire() les met au même format.
// ====================================================
import { lireNombre, regressionAffine, regressionProportionnelle, student975 } from './grapheurModele.js';

// ── 1. Formules ─────────────────────────────────────────────────────────────────────────────────
const FONCTIONS = {
  log: Math.log10, log10: Math.log10, ln: Math.log, exp: Math.exp, sqrt: Math.sqrt, racine: Math.sqrt, abs: Math.abs,
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
};
const LETTRE = /[A-Za-zÀ-ÖØ-öø-ÿΑ-Ωα-ω_]/, CHIFFRE = /[0-9]/;

function lexer(t) {
  const L = []; let i = 0;
  while (i < t.length) {
    const c = t[i];
    if (/[\s\u00a0]/.test(c)) { i++; continue; }
    if (CHIFFRE.test(c) || ((c === ',' || c === '.') && CHIFFRE.test(t[i + 1] || ''))) {
      const m = /^(\d+([.,]\d+)?|[.,]\d+)([eE][+-]?\d+)?/.exec(t.slice(i));
      L.push({ k: 'n', v: Number(m[0].replace(',', '.')) }); i += m[0].length; continue;
    }
    if (LETTRE.test(c)) { let j = i + 1; while (j < t.length && (LETTRE.test(t[j]) || CHIFFRE.test(t[j]))) j++; L.push({ k: 'id', v: t.slice(i, j) }); i = j; continue; }
    if ('+-*/^()'.includes(c)) { L.push({ k: 'op', v: c }); i++; continue; }
    if (c === '×' || c === '·') { L.push({ k: 'op', v: '*' }); i++; continue; }
    if (c === '÷') { L.push({ k: 'op', v: '/' }); i++; continue; }
    if (c === '−' || c === '–') { L.push({ k: 'op', v: '-' }); i++; continue; }
    throw new Error(`caractère « ${c} » non compris`);
  }
  return L;
}

// Compile une formule ; noms = noms des colonnes utilisables. Renvoie { ok:true, evaluer(valeurs) , utilise } ou { ok:false, erreur }
export function compilerFormule(texte, noms) {
  try {
    const T = lexer(String(texte || ''));
    if (!T.length) return { ok: false, erreur: 'La formule est vide.' };
    let p = 0; const utilise = new Set();
    const lire = () => T[p], prendre = () => T[p++];
    const attendre = v => { const t = prendre(); if (!t || t.k !== 'op' || t.v !== v) throw new Error(`« ${v} » attendu`); };
    // grammaire : somme → produit → puissance (associative à droite, plus forte que le moins unaire) → atome
    function somme() { let a = produit(); while (lire() && lire().k === 'op' && (lire().v === '+' || lire().v === '-')) { const o = prendre().v; const b = produit(); const g = a; a = o === '+' ? v => g(v) + b(v) : v => g(v) - b(v); } return a; }
    function produit() { let a = unaire(); while (lire() && lire().k === 'op' && (lire().v === '*' || lire().v === '/')) { const o = prendre().v; const b = unaire(); const g = a; a = o === '*' ? v => g(v) * b(v) : v => g(v) / b(v); } return a; }
    function unaire() { const t = lire(); if (t && t.k === 'op' && (t.v === '-' || t.v === '+')) { prendre(); const a = unaire(); return t.v === '-' ? v => -a(v) : a; } return puissance(); }
    function puissance() { const a = atome(); const t = lire(); if (t && t.k === 'op' && t.v === '^') { prendre(); const b = unaire(); return v => Math.pow(a(v), b(v)); } return a; }
    function atome() {
      const t = prendre();
      if (!t) throw new Error('la formule se termine trop tôt');
      if (t.k === 'n') return () => t.v;
      if (t.k === 'op' && t.v === '(') { const a = somme(); attendre(')'); return a; }
      if (t.k === 'id') {
        const suite = lire();
        if (suite && suite.k === 'op' && suite.v === '(' && FONCTIONS[t.v.toLowerCase()] && !noms.includes(t.v)) {
          prendre(); const a = somme(); attendre(')'); const f = FONCTIONS[t.v.toLowerCase()]; return v => f(a(v));
        }
        if (noms.includes(t.v)) { utilise.add(t.v); return v => v[t.v]; }
        if (t.v === 'pi' || t.v === 'π') return () => Math.PI;
        throw new Error(`« ${t.v} » n’est ni une colonne, ni une fonction connue`);
      }
      throw new Error(`« ${t.v} » inattendu`);
    }
    const f = somme();
    if (p < T.length) throw new Error(`« ${T[p].v} » inattendu`);
    return { ok: true, evaluer: f, utilise: [...utilise] };
  } catch (e) { return { ok: false, erreur: e.message }; }
}

// Colonnes (nom, unite, formule?) et lignes (chaînes ; la cellule d'une colonne calculée est ignorée)
// → { valeurs: [colonne][ligne] nombres (NaN si vide ou impossible), erreurs: [colonne] message ou '' }
// Une formule ne peut utiliser que les colonnes situées à sa gauche (pas de dépendance circulaire).
export function evaluerColonnes(colonnes, lignes) {
  const valeurs = [], erreurs = [];
  colonnes.forEach((c, j) => {
    if (!c.formule) { valeurs.push(lignes.map(l => lireNombre(l[j]))); erreurs.push(''); return; }
    const avant = colonnes.slice(0, j).map(k => k.nom).filter(n => n);
    const comp = compilerFormule(c.formule, avant);
    if (!comp.ok) { valeurs.push(lignes.map(() => NaN)); erreurs.push(comp.erreur); return; }
    valeurs.push(lignes.map((_, i) => {
      const v = {}; for (let k = 0; k < j; k++) if (colonnes[k].nom) v[colonnes[k].nom] = valeurs[k][i];
      const r = comp.evaluer(v);
      return Number.isFinite(r) ? r : NaN;
    }));
    erreurs.push('');
  });
  return { valeurs, erreurs };
}

// Séries (x, y, et éventuellement incertitude sur y) en ne gardant que les lignes où tout est un nombre ; garde l'indice de ligne
export function serieDe(valeurs, ix, iy, iu = -1) {
  const x = [], y = [], u = [], lig = [];
  const n = valeurs[0] ? valeurs[0].length : 0;
  for (let i = 0; i < n; i++) {
    const a = valeurs[ix][i], b = valeurs[iy][i], c = iu >= 0 ? valeurs[iu][i] : 0;
    if (Number.isFinite(a) && Number.isFinite(b) && (iu < 0 || Number.isFinite(c))) { x.push(a); y.push(b); u.push(Math.abs(c)); lig.push(i); }
  }
  return { x, y, u, lig };
}

// ── 2. Modèles ──────────────────────────────────────────────────────────────────────────────────
const somme2 = r => r.reduce((s, v) => s + v * v, 0);

// Inverse d'une matrice carrée (Gauss-Jordan avec pivot partiel) ; null si singulière
export function inverser(M) {
  const n = M.length; const A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
    if (Math.abs(A[m][c]) < 1e-14 * (1 + Math.abs(A[c][c]))) return null;
    [A[c], A[m]] = [A[m], A[c]];
    const d = A[c][c]; for (let k = 0; k < 2 * n; k++) A[c][k] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; if (f) for (let k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
  }
  return A.map(r => r.slice(n));
}
const multiplier = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const transposee = A => A[0].map((_, j) => A.map(r => r[j]));

// Parabole y = a·x² + b·x + c : moindres carrés linéaires, calculés sur x centré et réduit (stable)
export function regressionParabole(x, y) {
  const n = x.length;
  if (n < 4) return null;
  const xb = x.reduce((a, b) => a + b, 0) / n;
  const s = Math.max(...x.map(v => Math.abs(v - xb)));
  if (!(s > 0)) return null;
  const Z = x.map(v => { const z = (v - xb) / s; return [z * z, z, 1]; });
  const inv = inverser(multiplier(transposee(Z), Z));
  if (!inv) return null;
  const pz = multiplier(inv, multiplier(transposee(Z), y.map(v => [v]))).map(r => r[0]);
  const residus = y.map((v, i) => v - (Z[i][0] * pz[0] + Z[i][1] * pz[1] + pz[2]));
  const ddl = n - 3, sr = Math.sqrt(somme2(residus) / ddl);
  const covZ = inv.map(r => r.map(v => v * sr * sr));
  const T = [[1 / (s * s), 0, 0], [-2 * xb / (s * s), 1 / s, 0], [xb * xb / (s * s), -xb / s, 1]];
  const cov = multiplier(multiplier(T, covZ), transposee(T));
  const [a, b, c] = multiplier(T, pz.map(v => [v])).map(r => r[0]);
  const yb = y.reduce((p, q) => p + q, 0) / n, sst = somme2(y.map(v => v - yb));
  return { type: 'parabole', n, ddl, p: [a, b, c], u: [0, 1, 2].map(i => Math.sqrt(Math.max(0, cov[i][i]))), sr, residus,
    r2: sst > 0 ? 1 - somme2(residus) / sst : NaN, f: v => a * v * v + b * v + c };
}

// Gauss-Newton avec amortissement (Levenberg) : minimise Σ (y − f(x; p))². jac(x, p) renvoie le gradient par rapport aux paramètres.
function moindresCarresNonLineaires(x, y, f, jac, p0) {
  let p = [...p0], ssr = somme2(y.map((v, i) => v - f(x[i], p))), lambda = 1e-3;
  for (let it = 0; it < 200; it++) {
    const J = x.map(v => jac(v, p)), r = y.map((v, i) => v - f(x[i], p));
    const JtJ = multiplier(transposee(J), J), Jtr = multiplier(transposee(J), r.map(v => [v])).map(v => v[0]);
    let pris = false;
    for (let essai = 0; essai < 30 && !pris; essai++) {
      const M = JtJ.map((l, i) => l.map((v, j) => (i === j ? v * (1 + lambda) + 1e-300 : v)));
      const inv = inverser(M);
      if (!inv) { lambda *= 10; continue; }
      const dp = inv.map(l => l.reduce((s, v, k) => s + v * Jtr[k], 0));
      const q = p.map((v, i) => v + dp[i]);
      const s2 = somme2(y.map((v, i) => v - f(x[i], q)));
      if (Number.isFinite(s2) && s2 <= ssr) {
        const gain = ssr - s2; p = q; ssr = s2; lambda = Math.max(lambda / 10, 1e-12); pris = true;
        if (gain <= 1e-15 * (ssr + 1e-300) && Math.max(...dp.map((d, i) => Math.abs(d) / (Math.abs(p[i]) + 1e-300))) < 1e-10) return { p, ssr, converge: true };
      } else lambda *= 10;
    }
    if (!pris) return { p, ssr, converge: true };      // plus aucune amélioration possible : on est au minimum
  }
  return { p, ssr, converge: false };
}

// Exponentielle : y = A·exp(k·x) (avecAsymptote = false) ou y = y₀ + A·exp(k·x) (true)
// Départ : pour une grille de k, A (et y₀) sont des moindres carrés linéaires ; on garde le meilleur k, puis on affine.
export function regressionExponentielle(x, y, avecAsymptote = false) {
  const n = x.length, nbp = avecAsymptote ? 3 : 2;
  if (n < nbp + 1) return null;
  const xmin = Math.min(...x), etendue = Math.max(...x) - xmin;
  if (!(etendue > 0)) return null;
  const xr = x.map(v => v - xmin);                      // x décalé : A est la valeur en x = xmin (stabilité) ; reconverti ensuite
  let meilleur = null;
  for (const signe of [-1, 1]) for (let m = 0.05; m <= 400; m *= 1.12) {
    const k = signe * m / etendue, E = xr.map(v => Math.exp(k * v));
    if (E.some(v => !Number.isFinite(v))) continue;
    let A, c = 0, ssr;
    if (avecAsymptote) {
      const Eb = E.reduce((a, b) => a + b, 0) / n, yb = y.reduce((a, b) => a + b, 0) / n;
      let see = 0, sey = 0; E.forEach((e, i) => { see += (e - Eb) ** 2; sey += (e - Eb) * (y[i] - yb); });
      if (!(see > 0)) continue;
      A = sey / see; c = yb - A * Eb;
    } else {
      const see = E.reduce((a, b) => a + b * b, 0), sey = E.reduce((a, b, i) => a + b * y[i], 0);
      if (!(see > 0)) continue;
      A = sey / see;
    }
    ssr = somme2(y.map((v, i) => v - (c + A * E[i])));
    if (Number.isFinite(ssr) && (!meilleur || ssr < meilleur.ssr)) meilleur = { k, A, c, ssr };
  }
  if (!meilleur) return null;
  const f = avecAsymptote ? (v, p) => p[0] + p[1] * Math.exp(p[2] * v) : (v, p) => p[0] * Math.exp(p[1] * v);
  const jac = avecAsymptote ? (v, p) => { const e = Math.exp(p[2] * v); return [1, e, p[1] * v * e]; } : (v, p) => { const e = Math.exp(p[1] * v); return [e, p[0] * v * e]; };
  const p0 = avecAsymptote ? [meilleur.c, meilleur.A, meilleur.k] : [meilleur.A, meilleur.k];
  const aj = moindresCarresNonLineaires(xr, y, f, jac, p0);
  if (!aj.converge) return null;
  const ddl = n - nbp, sr = Math.sqrt(aj.ssr / ddl);
  const J = xr.map(v => jac(v, aj.p)), inv = inverser(multiplier(transposee(J), J));
  if (!inv) return null;
  const u = inv.map((l, i) => Math.sqrt(Math.max(0, l[i])) * sr);
  // retour au x d'origine : A_origine = A·exp(−k·xmin) ; incertitude propagée avec la covariance (A, k)
  const iA = avecAsymptote ? 1 : 0, ik = iA + 1, k = aj.p[ik], Ar = aj.p[iA];
  const fac = Math.exp(-k * xmin), A0 = Ar * fac;
  const cov = inv.map(l => l.map(v => v * sr * sr));
  const dA0 = [fac, -xmin * A0];      // d(A0)/d(Ar), d(A0)/dk
  const uA0 = Math.sqrt(Math.max(0, dA0[0] ** 2 * cov[iA][iA] + dA0[1] ** 2 * cov[ik][ik] + 2 * dA0[0] * dA0[1] * cov[iA][ik]));
  const residus = y.map((v, i) => v - f(xr[i], aj.p));
  const yb = y.reduce((a, b) => a + b, 0) / n, sst = somme2(y.map(v => v - yb));
  const y0 = avecAsymptote ? aj.p[0] : 0;
  return { type: avecAsymptote ? 'exponentielle-asymptote' : 'exponentielle', n, ddl, sr, residus, r2: sst > 0 ? 1 - aj.ssr / sst : NaN,
    A: A0, uA: uA0, k, uk: u[ik], y0, uy0: avecAsymptote ? u[0] : 0, tau: Math.abs(1 / k), utau: u[ik] / (k * k),
    f: v => y0 + A0 * Math.exp(k * v) };
}

// ── Modèles linéaires au même format ────────────────────────────────────────────────────────────
export function adapterLineaire(m) {
  return m ? { ...m, f: v => m.a * v + (m.b || 0) } : null;
}
export function ajuster(id, x, y) {
  if (id === 'proportionnel') return adapterLineaire(regressionProportionnelle(x, y));
  if (id === 'affine') return adapterLineaire(regressionAffine(x, y));
  if (id === 'parabole') return regressionParabole(x, y);
  if (id === 'exponentielle') return regressionExponentielle(x, y, false);
  if (id === 'exponentielle-asymptote') return regressionExponentielle(x, y, true);
  return null;
}
export const NB_PARAMETRES = { proportionnel: 1, affine: 2, parabole: 3, exponentielle: 2, 'exponentielle-asymptote': 3 };

// ── 3. Échelle logarithmique, dérivée ───────────────────────────────────────────────────────────
// Graduations d'un axe logarithmique : 1, 2, 5 × puissances de 10 dans [lo, hi] (lo, hi > 0) ; renvoie les bornes en log10
export function echelleLog(lo, hi) {
  if (!(lo > 0) || !(hi > 0)) return null;
  let a = Math.floor(Math.log10(lo) + 1e-9), b = Math.ceil(Math.log10(hi) - 1e-9);
  if (b === a) b = a + 1;
  const grad = [];
  for (let e = a; e <= b; e++) for (const m of [1, 2, 5]) { const v = m * 10 ** e; if (v >= 10 ** a * (1 - 1e-9) && v <= 10 ** b * (1 + 1e-9)) grad.push({ v: Number(v.toPrecision(12)), principale: m === 1 }); }
  return { min: a, max: b, graduations: grad };
}

// Pente locale en un point d'un nuage (tangente « de Regressi ») : régression affine sur le point et ses deux voisins (triés par x)
export function penteLocale(x, y, i) {
  const idx = x.map((_, k) => k).sort((p, q) => x[p] - x[q]);
  const r = idx.indexOf(i);
  const voisins = idx.slice(Math.max(0, r - 1), Math.min(idx.length, r + 2));
  if (voisins.length < 2) return null;
  const xs = voisins.map(k => x[k]), ys = voisins.map(k => y[k]);
  const xb = xs.reduce((a, b) => a + b, 0) / xs.length, yb = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxx = 0, sxy = 0; xs.forEach((v, k) => { sxx += (v - xb) ** 2; sxy += (v - xb) * (ys[k] - yb); });
  return sxx > 0 ? sxy / sxx : null;
}
// Pente d'une fonction en x0 (différence centrée)
export function penteFonction(f, x0, h) {
  const d = h || Math.max(Math.abs(x0), 1) * 1e-5;
  const p = (f(x0 + d) - f(x0 - d)) / (2 * d);
  return Number.isFinite(p) ? p : null;
}
export { student975 };
