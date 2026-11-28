// Modèle pur de la simulation 321 « Oscillations libres : période, amortissement et régimes » (terminale STL, SPCL, Ondes, séquence 1).
// Oscillateur libre à un degré de liberté (ressort + masse, ou circuit RLC série : même équation) lâché sans vitesse initiale :
//   x'' + 2 ζ ω0 x' + ω0² x = 0, avec ω0 = 2π f0 et ζ le facteur d'amortissement (sans unité, ζ = 0 : aucun amortissement).
// Hypothèses : amortissement proportionnel à la vitesse ; oscillations de faible amplitude (modèle linéaire) ; vitesse initiale nulle.

export const REGIMES = {
  periodique: { nom: 'périodique', court: 'régime périodique', desc: 'aucun amortissement : l’amplitude reste constante' },
  pseudo: { nom: 'pseudopériodique', court: 'régime pseudopériodique', desc: 'oscillations dont l’amplitude décroît' },
  critique: { nom: 'critique', court: 'régime critique', desc: 'retour le plus rapide à l’équilibre, sans oscillation' },
  aperiodique: { nom: 'apériodique', court: 'régime apériodique', desc: 'retour lent à l’équilibre, sans oscillation' },
};
export const LISTE_REGIMES = ['periodique', 'pseudo', 'critique', 'aperiodique'];

// Régime en fonction de ζ (le régime critique est le cas ζ = 1, avec une tolérance de lecture de curseur).
export function regime(zeta) {
  if (zeta < 0.005) return 'periodique';
  if (zeta < 0.975) return 'pseudo';
  if (zeta <= 1.025) return 'critique';
  return 'aperiodique';
}
// Valeur de ζ réellement utilisée dans le calcul : le curseur autour de 1 est ramené à 1 exactement (régime critique).
export const zetaEff = zeta => (regime(zeta) === 'critique' ? 1 : zeta);

export const omega0 = f0 => 2 * Math.PI * f0;
export const periodePropre = f0 => 1 / f0;
// Pseudopériode Tp = T0 / √(1 − ζ²) (ζ < 1). Pour ζ ≥ 1 il n’y a plus d’oscillation : NaN.
export function pseudoPeriode(f0, zeta) { const z = zetaEff(zeta); return z < 1 ? 1 / (f0 * Math.sqrt(1 - z * z)) : NaN; }
// Temps caractéristique d’amortissement τ = 1/(ζ ω0) : l’enveloppe de l’amplitude décroît comme exp(−t/τ). Défini pour 0 < ζ < 1.
export function tauAmort(f0, zeta) { const z = zetaEff(zeta); return z > 0 && z < 1 ? 1 / (z * omega0(f0)) : NaN; }
export const enveloppe = (t, x0, f0, zeta) => { const tau = tauAmort(f0, zeta); return Number.isFinite(tau) ? Math.abs(x0) * Math.exp(-t / tau) : Math.abs(x0); };

// Position x(t) (même unité que x0) : lâché en x0 sans vitesse.
export function pos(t, x0, f0, zeta) {
  const z = zetaEff(zeta), w0 = omega0(f0);
  if (z < 1e-9) return x0 * Math.cos(w0 * t);
  if (z < 1) { const wp = w0 * Math.sqrt(1 - z * z); return x0 * Math.exp(-z * w0 * t) * (Math.cos(wp * t) + (z * w0 / wp) * Math.sin(wp * t)); }
  if (z === 1) return x0 * (1 + w0 * t) * Math.exp(-w0 * t);
  const s = w0 * Math.sqrt(z * z - 1), r1 = -w0 * z + s, r2 = -w0 * z - s;
  return x0 * (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}
// Durée d’affichage conseillée (s) : quelques pseudopériodes, ou le temps de retour à l’équilibre.
export function dureeAffichage(f0, zeta) {
  const z = zetaEff(zeta), T0 = 1 / f0;
  if (z < 1) { const tau = tauAmort(f0, z); const cible = Number.isFinite(tau) ? Math.min(5 * tau, 8 * T0) : 6 * T0; return Math.min(14, Math.max(4 * T0, cible, 3)); }
  return Math.min(14, Math.max(5 * T0, 3));
}
// Nombre de passages par la position d’équilibre sur [0, tFin] (pour vérifier « sans oscillation »).
export function nbPassages(x0, f0, zeta, tFin, pas = 0.002) {
  let n = 0, prev = pos(0, x0, f0, zeta);
  for (let t = pas; t <= tFin; t += pas) { const x = pos(t, x0, f0, zeta); if (prev * x < 0) n++; if (x !== 0) prev = x; }
  return n;
}
// Instant (s) où |x| devient inférieur à frac·|x0| et le reste (retour à l’équilibre).
export function tempsRetour(x0, f0, zeta, frac = 0.05, tFin = 40, pas = 0.005) {
  let dernier = 0;
  for (let t = 0; t <= tFin; t += pas) if (Math.abs(pos(t, x0, f0, zeta)) > frac * Math.abs(x0)) dernier = t;
  return dernier;
}

// ---------- Défi 1 : trois courbes, laquelle est le régime critique ? ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export function tirageRegime() {
  const f0 = tire([0.8, 1, 1.25]);
  const cands = melange([{ r: 'pseudo', zeta: tire([0.3, 0.4, 0.5]) }, { r: 'critique', zeta: 1 }, { r: 'aperiodique', zeta: tire([2, 2.4, 3]) }]);
  return { f0, cands, bonne: cands.findIndex(c => c.r === 'critique'), tFin: 6 / f0 };
}
export function diagRegime(d, choix) {
  if (choix == null) return { ok: false, msg: 'Cliquez sur la courbe qui correspond au régime critique.' };
  const c = d.cands[choix];
  if (choix === d.bonne) return { ok: true, msg: 'Le régime critique est le retour le plus rapide à l’équilibre sans oscillation.' };
  if (c.r === 'pseudo') return { ok: false, msg: 'Cette courbe oscille autour de l’équilibre : c’est un régime pseudopériodique. Le régime critique ne dépasse pas la position d’équilibre. Cherchez la courbe sans oscillation qui revient le plus vite.' };
  return { ok: false, msg: 'Cette courbe n’oscille pas, mais elle revient plus lentement à l’équilibre : c’est un régime apériodique. Le régime critique est le retour le plus rapide sans oscillation.' };
}

// ---------- Défi 2 : mesurer la pseudopériode sur une courbe ----------
export function tiragePeriode() {
  const T0 = tire([0.8, 1.25, 1.6, 2, 2.5]), zeta = tire([0.04, 0.06, 0.08]);
  const Tp = T0 / Math.sqrt(1 - zeta * zeta);
  return { T0, zeta, f0: 1 / T0, Tp, tFin: Math.ceil(4.4 * Tp * 2) / 2 };
}
// Saisie de l’élève (virgule acceptée), tolérance de lecture de 12 %.
export const TOL_PERIODE = 0.12;
export function diagPeriode(d, saisie) {
  const v = Number(String(saisie).trim().replace(',', '.').replace(/\s*s$/i, ''));
  if (String(saisie).trim() === '' || !Number.isFinite(v)) return { ok: false, msg: 'Saisissez un nombre : la pseudopériode en secondes.' };
  if (v <= 0) return { ok: false, msg: 'Une période est une durée positive.' };
  const rel = Math.abs(v - d.Tp) / d.Tp;
  if (rel <= TOL_PERIODE) return { ok: true, msg: 'Pseudopériode correcte.' };
  if (Math.abs(v - 1 / d.Tp) / (1 / d.Tp) <= 0.15) return { ok: false, msg: 'Vous avez donné la fréquence (en Hz) : la période est l’inverse de la fréquence, T = 1/f.' };
  const n = Math.round(d.tFin / d.Tp * 0.9);
  if (Math.abs(v - d.Tp * n) / (d.Tp * n) <= 0.12 && n > 1) return { ok: false, msg: `Vous avez donné la durée de plusieurs oscillations : divisez cette durée par le nombre d’oscillations comptées.` };
  return { ok: false, msg: v > d.Tp ? 'La valeur est trop grande : comptez le nombre d’oscillations sur une durée lue, puis divisez la durée par ce nombre.' : 'La valeur est trop petite : vérifiez que vous comptez des oscillations complètes (de maximum à maximum), puis divisez la durée par leur nombre.' };
}
