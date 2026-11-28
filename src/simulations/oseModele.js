// Modèle pur de la simulation 322 « Énergie d'un oscillateur et entretien des oscillations » (terminale STL, SPCL, Ondes, séquence 1).
// Chariot de masse m relié à un ressort de raideur k (ou circuit LC : mêmes équations), lâché sans vitesse en x0 :
//   x'' + 2 ζ ω0 x' + ω0² x = 2 g ω0 x'     (frottements : ζ ; dispositif d'entretien : g, force proportionnelle à la vitesse, dans le même sens)
// Le dispositif compense une fraction c des pertes : g = c·ζ (c = 0 : aucun entretien ; c = 1 : compensation exacte). Amortissement effectif ζe = ζ (1 − c).
// Énergies en unités de E0 = ½ k x0² : Ep = (x/x0)², Ec = (v/(ω0 x0))², Em = Ep + Ec.
//   dEm/dt = −4 ζe ω0 u² (u = v/(ω0 x0)) ; pertes cumulées Q' = 4 ζ ω0 u² ; apport cumulé W' = 4 c ζ ω0 u² ; donc Em = 1 + W − Q.
// Hypothèses : modèle linéaire (faibles amplitudes), frottements proportionnels à la vitesse, lâché sans vitesse initiale, ζe < 1 (oscillations).
import * as OS from './oslModele.js';

export const REGLAGES = { f0: 1, T0: 1, tFin: 6 };
export const ZETAS = [0, 0.05, 0.1, 0.15, 0.2, 0.3];
export const zetaEffectif = (zeta, c) => zeta * (1 - c);

// Position normalisée x/x0 et vitesse normalisée u = v/(ω0 x0) (valeurs exactes de l'oscillateur de ζe).
export function posNorm(t, f0, zeta, c = 0) { return OS.pos(t, 1, f0, zetaEffectif(zeta, c)); }
export function vitNorm(t, f0, zeta, c = 0) {
  const a = zetaEffectif(zeta, c), w0 = OS.omega0(f0), r = Math.sqrt(1 - a * a);
  return -Math.exp(-a * w0 * t) * Math.sin(w0 * r * t) / r;
}

// Série temporelle des énergies (en unités de E0) sur [0, tFin] au pas dt.
export function serie(f0, zeta, c, tFin = REGLAGES.tFin, dt = 0.01) {
  const n = Math.round(tFin / dt), w0 = OS.omega0(f0);
  const S = { dt, n, t: [], x: [], ep: [], ec: [], em: [], q: [], w: [] };
  let q = 0, w = 0, uPrev = 0;
  for (let i = 0; i <= n; i++) {
    const t = i * dt, x = posNorm(t, f0, zeta, c), u = vitNorm(t, f0, zeta, c);
    if (i > 0) { q += 0.5 * (4 * zeta * w0 * (u * u + uPrev * uPrev)) * dt; w += 0.5 * (4 * c * zeta * w0 * (u * u + uPrev * uPrev)) * dt; }
    uPrev = u;
    S.t.push(t); S.x.push(x); S.ep.push(x * x); S.ec.push(u * u); S.em.push(x * x + u * u); S.q.push(q); S.w.push(w);
  }
  return S;
}
export const idx = (S, t) => Math.max(0, Math.min(S.n, Math.round(t / S.dt)));

// Pertes sur une période propre, en unités de E0, pour l'amplitude constante ζe = 0 (régime entretenu) : Q = 2 π ζ ... (fraction de E0 perdue par période : ΔE/E = 4 π ζ).
export const pertesParPeriode = zeta => 4 * Math.PI * zeta;

// ---------- Défi 1 : quelle courbe est … ? ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const NOMS_E = { ec: 'l’énergie cinétique Ec', ep: 'l’énergie potentielle Ep', em: 'l’énergie mécanique Em = Ec + Ep' };
export function tirageCourbe() {
  const f0 = tire([0.8, 1, 1.25]), zeta = tire([0.06, 0.08, 0.1]), cible = tire(['ec', 'ep', 'em']);
  const cands = melange(['ec', 'ep', 'em']);
  return { f0, zeta, cible, cands, bonne: cands.indexOf(cible), tFin: 5 / f0 };
}
export function diagCourbe(d, choix) {
  if (choix == null) return { ok: false, msg: 'Cliquez sur la courbe que vous pensez être la bonne.' };
  const c = d.cands[choix];
  if (c === d.cible) return { ok: true, msg: 'Courbe correcte.' };
  if (d.cible === 'ec') return { ok: false, msg: c === 'ep'
    ? 'Cette courbe est maximale à t = 0 : le chariot est lâché sans vitesse, donc toute l’énergie est alors potentielle. L’énergie cinétique, elle, est nulle au départ.'
    : 'Cette courbe décroît sans osciller jusqu’à zéro : c’est l’énergie mécanique totale, qui diminue à cause des frottements. L’énergie cinétique, elle, oscille.' };
  if (d.cible === 'ep') return { ok: false, msg: c === 'ec'
    ? 'Cette courbe part de zéro : à t = 0 le chariot est immobile, son énergie cinétique est nulle. L’énergie potentielle est maximale au départ.'
    : 'Cette courbe décroît sans osciller : c’est l’énergie mécanique totale. L’énergie potentielle oscille entre son maximum et zéro.' };
  return { ok: false, msg: 'Cette courbe oscille et s’annule à certains instants : c’est une énergie qui s’échange (Ec ou Ep). L’énergie mécanique est la somme Ec + Ep : elle ne s’annule jamais et décroît lentement à cause des frottements.' };
}

// ---------- Défi 2 : énergie dissipée entre deux amplitudes ----------
export function tirageDissipee() {
  const k = tire([20, 25, 40, 50, 80]), x0 = tire([4, 5, 6, 8, 10]), r = tire([0.5, 0.6, 0.7, 0.8]);
  let x1 = Math.round(x0 * r * 10) / 10; if (x1 >= x0) x1 = x0 - 1;
  const Q = 0.5 * k * ((x0 / 100) ** 2 - (x1 / 100) ** 2) * 1000; // en mJ
  return { k, x0, x1, Q };
}
export const TOL_DISSIPEE = 0.06;
export function diagDissipee(d, saisie) {
  const v = Number(String(saisie).trim().replace(',', '.').replace(/\s*mJ$/i, ''));
  if (String(saisie).trim() === '' || !Number.isFinite(v)) return { ok: false, msg: 'Saisissez un nombre : l’énergie dissipée en millijoules (mJ).' };
  if (v <= 0) return { ok: false, msg: 'Une énergie dissipée est positive : l’énergie mécanique a diminué.' };
  const rel = x => Math.abs(v - x) / x;
  if (rel(d.Q) <= TOL_DISSIPEE) return { ok: true, msg: 'Énergie dissipée correcte.' };
  const E0 = 0.5 * d.k * (d.x0 / 100) ** 2 * 1000, E1 = 0.5 * d.k * (d.x1 / 100) ** 2 * 1000;
  if (rel(d.Q / 1000) <= 0.1) return { ok: false, msg: 'Votre valeur est 1 000 fois trop petite : elle semble donnée en joules. Le résultat attendu est en millijoules (1 J = 1 000 mJ).' };
  if (rel(d.Q * 1e4) <= 0.1 || rel(d.Q * 100) <= 0.1) return { ok: false, msg: 'Les amplitudes sont en centimètres : convertissez-les en mètres (1 cm = 0,01 m) avant de calculer l’énergie, car k est en N/m.' };
  if (rel(2 * d.Q) <= 0.1) return { ok: false, msg: 'Votre valeur est le double de la bonne : l’énergie potentielle élastique vaut Ep = ½ k x², avec un facteur ½.' };
  if (rel(0.5 * d.k * ((d.x0 - d.x1) / 100) ** 2 * 1000) <= 0.1) return { ok: false, msg: 'Vous avez élevé au carré la différence des amplitudes : calculez Ep = ½ k x² pour chaque amplitude, puis faites la différence des deux énergies.' };
  if (rel(E0) <= 0.1) return { ok: false, msg: 'Vous avez donné l’énergie initiale : l’énergie dissipée est la différence entre l’énergie initiale et l’énergie finale.' };
  if (rel(E1) <= 0.1) return { ok: false, msg: 'Vous avez donné l’énergie finale : l’énergie dissipée est la différence entre l’énergie initiale et l’énergie finale.' };
  return { ok: false, msg: v > d.Q ? 'La valeur est trop grande : faites la différence Ep initiale − Ep finale, avec Ep = ½ k x² et x en mètres.' : 'La valeur est trop petite : faites la différence Ep initiale − Ep finale, avec Ep = ½ k x² et x en mètres.' };
}
