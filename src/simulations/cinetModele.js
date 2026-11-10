// Modèle de la simulation « Contrôle cinétique ou thermodynamique » (BTS) : addition de HBr sur le buta-1,3-diène.
// Pur JS. Réseau : réactifs R → carbocation allylique C ⇌ produit 1,2 (P12) et ⇌ produit 1,4 (P14).
// Les énergies sont des ordres de grandeur ; les constantes de vitesse suivent la loi d'Arrhenius avec un facteur A commun.

export const E = { R: 0, ET1: 60, C: 20, ET2a: 30, ET2b: 33, P12: -60, P14: -67 };   // kJ/mol (réactifs = 0)
export const A = 1e13, R_KJ = 8.314e-3;                                                // s⁻¹ ; kJ·mol⁻¹·K⁻¹
export const k = (ea, T) => A * Math.exp(-ea / (R_KJ * T));

export function constantes(T) {
  return {
    k1: k(E.ET1 - E.R, T), km1: k(E.ET1 - E.C, T),
    k2a: k(E.ET2a - E.C, T), km2a: k(E.ET2a - E.P12, T),     // km2a : P12 → C, barrière 90 kJ/mol
    k2b: k(E.ET2b - E.C, T), km2b: k(E.ET2b - E.P14, T),     // km2b : P14 → C, barrière 100 kJ/mol
  };
}

// Évolution au cours du temps (HBr en excès : cinétique de pseudo-premier ordre).
// Le carbocation est un intermédiaire très réactif : on l'élimine par l'approximation de l'état quasi stationnaire.
// Intégration implicite (Euler rétrograde) sur une grille logarithmique du temps : stable même pour des constantes très différentes.
export function evolution(T, tmax = 1e6, n = 420) {
  const c = constantes(T), D = c.km1 + c.k2a + c.k2b;
  // C = (k1 R + km2a P12 + km2b P14) / D ; M = matrice d'évolution de (R, P12, P14)
  const M = [
    [-c.k1 + c.km1 * c.k1 / D, c.km1 * c.km2a / D, c.km1 * c.km2b / D],
    [c.k2a * c.k1 / D, -c.km2a + c.k2a * c.km2a / D, c.k2a * c.km2b / D],
    [c.k2b * c.k1 / D, c.k2b * c.km2a / D, -c.km2b + c.k2b * c.km2b / D],
  ];
  const solve3 = (a, b) => {                      // résout a·x = b (3×3) par élimination de Gauss
    const m = a.map((r, i) => [...r, b[i]]);
    for (let i = 0; i < 3; i++) {
      let p = i; for (let j = i + 1; j < 3; j++) if (Math.abs(m[j][i]) > Math.abs(m[p][i])) p = j;
      [m[i], m[p]] = [m[p], m[i]];
      for (let j = i + 1; j < 3; j++) { const f = m[j][i] / m[i][i]; for (let l = i; l < 4; l++) m[j][l] -= f * m[i][l]; }
    }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) { let s = m[i][3]; for (let j = i + 1; j < 3; j++) s -= m[i][j] * x[j]; x[i] = s / m[i][i]; }
    return x;
  };
  const t0 = 1e-3, r = Math.pow(tmax / t0, 1 / (n - 1));
  let y = [1, 0, 0], t = 0; const pts = [{ t: 0, R: 1, P12: 0, P14: 0 }];
  for (let i = 0; i < n; i++) {
    const tn = i === 0 ? t0 : t0 * Math.pow(r, i), dt = tn - t;
    const I = M.map((row, a) => row.map((v, b) => (a === b ? 1 : 0) - dt * v));
    y = solve3(I, y).map(v => Math.max(0, v)); t = tn;
    pts.push({ t, R: y[0], P12: y[1], P14: y[2] });
  }
  return pts;
}

// Composition à l'instant t : interpolation sur la courbe (échelle logarithmique du temps)
export function composition(pts, t) {
  if (t <= pts[1].t) { const f = t / pts[1].t; return norm({ R: 1 + (pts[1].R - 1) * f, P12: pts[1].P12 * f, P14: pts[1].P14 * f }); }
  let i = 1; while (i < pts.length - 1 && pts[i + 1].t < t) i++;
  const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], f = b.t === a.t ? 0 : (Math.log(t) - Math.log(a.t)) / (Math.log(b.t) - Math.log(a.t));
  const g = key => a[key] + (b[key] - a[key]) * Math.max(0, Math.min(1, f));
  return norm({ R: g('R'), P12: g('P12'), P14: g('P14') });
}
const norm = o => { const s = o.R + o.P12 + o.P14 || 1; return { R: 100 * o.R / s, P12: 100 * o.P12 / s, P14: 100 * o.P14 / s }; };

// Rapports limites : contrôle cinétique (compétition des vitesses de l'étape 2) et thermodynamique (équilibre)
export const rapportCinetique = T => k(E.ET2a - E.C, T) / k(E.ET2b - E.C, T);                 // 12 / 14 à t court
export const rapportThermo = T => Math.exp((E.P12 - E.P14) / (R_KJ * T));                       // 14 / 12 à l'équilibre

// Régime observé : « en cours » tant que le réactif n'est pas consommé, puis cinétique, intermédiaire ou thermodynamique
export function regime(c, T) {
  const p = c.P12 + c.P14;
  if (c.R > 10 || p < 1) return 'cours';
  const f12 = c.P12 / p, fCin = rapportCinetique(T) / (1 + rapportCinetique(T)), fEq = 1 / (1 + rapportThermo(T));
  if (Math.abs(f12 - fEq) < 0.03) return 'thermo';
  if (Math.abs(f12 - fCin) < 0.06) return 'cinetique';
  return 'transition';
}
export const tempsDepuisCurseur = s => Math.pow(10, -3 + 9 * s / 1000);        // curseur 0…1000 → 1 ms … 10⁶ s
export const curseurDepuisTemps = t => Math.round((Math.log10(t) + 3) / 9 * 1000);
export function formatTemps(t) {
  if (t < 1) return `${(t * 1000).toPrecision(2).replace('.', ',')} ms`;
  if (t < 120) return `${t.toPrecision(2).replace('.', ',')} s`;
  if (t < 7200) return `${(t / 60).toPrecision(2).replace('.', ',')} min`;
  if (t < 172800) return `${(t / 3600).toPrecision(2).replace('.', ',')} h`;
  return `${(t / 86400).toPrecision(2).replace('.', ',')} jours`;
}
