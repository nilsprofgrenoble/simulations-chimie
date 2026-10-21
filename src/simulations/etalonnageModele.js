// Outils statistiques du dosage par étalonnage (sim 11) : loi de Fisher, régression linéaire avec test de linéarité
// (écart à la linéarité comparé à l'erreur pure des répétitions, risque 5 %), générateur pseudo-aléatoire reproductible.

export const RISQUE_FISHER = 0.05;
// ── Loi de Fisher : fonction bêta incomplète régularisée et quantile ──
export function lnGamma(x) { const c = [76.1800917294715, -86.5053203294168, 24.0140982408309, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.00000000019002; for (const ci of c) s += ci / ++y; return -t + Math.log(2.50662827463100 * s / x); }
function betacf(a, b, x) { const qab = a + b, qap = a + 1, qam = a - 1; let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d; for (let m = 1; m <= 200; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break; } return h; }
function betai(a, b, x) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
export const fCdf = (F, d1, d2) => (F <= 0 ? 0 : betai(d1 / 2, d2 / 2, d1 * F / (d1 * F + d2)));
export function fQuantile(p, d1, d2) { let lo = 0, hi = 1000; for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (fCdf(m, d1, d2) < p) lo = m; else hi = m; } return (lo + hi) / 2; }

export function rng(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// ── Régression linéaire y = a x + b, avec résidus, écarts-types et test de Fisher sur les répétitions ──
export function regression(x, y) {
  const n = x.length; if (n < 3) return null;
  const mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
  const Sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0), Sxy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0), Syy = y.reduce((s, v) => s + (v - my) ** 2, 0);
  if (Sxx === 0) return null;
  const a = Sxy / Sxx, b = my - a * mx;
  const res = y.map((v, i) => v - (a * x[i] + b)), SSres = res.reduce((s, e) => s + e * e, 0);
  const syx = Math.sqrt(SSres / (n - 2)), sa = syx / Math.sqrt(Sxx), sb = syx * Math.sqrt(1 / n + mx * mx / Sxx);
  // test de Fisher : défaut d'ajustement comparé à l'erreur pure (dispersion des répétitions)
  const niveaux = [...new Set(x)]; let SSpe = 0;
  niveaux.forEach(c => { const ys = y.filter((_, i) => x[i] === c), m = ys.reduce((s, v) => s + v, 0) / ys.length; SSpe += ys.reduce((s, v) => s + (v - m) ** 2, 0); });
  const d1 = niveaux.length - 2, d2 = n - niveaux.length;
  const fisher = d1 >= 1 && d2 >= 1 && SSpe > 0 ? (() => { const F = ((SSres - SSpe) / d1) / (SSpe / d2); return { F, d1, d2, Fc: fQuantile(1 - RISQUE_FISHER, d1, d2), p: 1 - fCdf(F, d1, d2) }; })() : null;
  return { a, b, R2: 1 - SSres / Syy, res, syx, sa, sb, mx, my, Sxx, n, fisher, p: niveaux.length, Syy, SSres, SSpe, SSreg: Syy - SSres };
}

