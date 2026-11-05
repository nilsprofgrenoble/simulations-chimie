// ====================================================
//  MODÈLE DU SON (simulation 87) — fonctions pures, sans React, testées par sonModele.test.mjs
//  • signal sonore = somme de sinusoïdes (composante continue u0 + composantes de fréquence f et d’amplitude a), en unités arbitraires ;
//  • puissance moyenne ∝ ⟨u²⟩ ; niveau d’intensité sonore L = 10 log (I / I0), I = P / S, source ponctuelle isotrope en champ libre.
// ====================================================

export const NH = 6;                       // nombre d’harmoniques réglables
export const I0 = 1.0e-12;                 // intensité de référence (W·m⁻²), seuil d’audition vers 1 kHz
export const YMAX = 3;                     // demi-échelle verticale minimale de l’évolution temporelle (unités arbitraires)
export const echelleY = u => { let m = 0; for (let i = 0; i < u.length; i++) m = Math.max(m, Math.abs(u[i])); return Math.max(YMAX, Math.ceil(m - 1e-9)); };   // jamais d’écrêtage

// ---------- timbres : amplitudes relatives du fondamental et des harmoniques 2 à 6 ----------
export const PRESETS = {
  pur: { nom: 'Son pur (diapason)', a: [1, 0, 0, 0, 0, 0] },
  creux: { nom: 'Fondamental faible', a: [0.25, 1, 0.6, 0.3, 0.15, 0.08] },
  flute: { nom: 'Flûte', a: [1, 0.35, 0.12, 0.05, 0.02, 0] },
  clarinette: { nom: 'Clarinette (harmoniques impairs)', a: [1, 0, 0.6, 0, 0.35, 0] },
  violon: { nom: 'Violon', a: [1, 0.6, 0.4, 0.3, 0.2, 0.1] },
  nonper: { nom: 'Son non périodique', a: [1, 0.6, 0.45, 0.3, 0.2, 0.15] },
  bruit: { nom: 'Bruit', a: [0, 0, 0, 0, 0, 0] },
};
// rapports de fréquences du son non périodique : racines d’entiers, sans rapport simple entre elles
export const RATIOS_NONPER = [1, Math.SQRT2, Math.sqrt(5), Math.sqrt(7), Math.sqrt(11), Math.sqrt(13)];
export const TIMBRES_INSTRUMENTS = ['flute', 'clarinette', 'violon', 'creux'];

// générateur pseudo-aléatoire reproductible (le « bruit » est le même à chaque affichage)
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NB_BRUIT = 60;
export function composantesBruit(f1) {
  const r = mulberry32(87);
  return Array.from({ length: NB_BRUIT }, () => ({ f: f1 * (0.3 + 6.7 * r()), a: 0.1 + 0.1 * r(), ph: 2 * Math.PI * r() }));
}

export const typeDe = preset => (preset === 'nonper' ? 'nonper' : preset === 'bruit' ? 'bruit' : 'periodique');

// cfg = { preset, f1 (Hz), a: [6 amplitudes], u0 }  →  liste de composantes { f (Hz), a, ph (rad) }
export function composantes(cfg) {
  const t = typeDe(cfg.preset);
  if (t === 'bruit') return composantesBruit(cfg.f1);
  if (t === 'nonper') return RATIOS_NONPER.map((q, i) => ({ f: q * cfg.f1, a: cfg.a[i], ph: 0 })).filter(c => c.a > 0);
  return cfg.a.map((a, i) => ({ f: (i + 1) * cfg.f1, a, ph: 0 })).filter(c => c.a > 0);
}

export const estPeriodique = cfg => typeDe(cfg.preset) === 'periodique';
export const periodeMs = cfg => (estPeriodique(cfg) ? 1000 / cfg.f1 : null);

// valeur du signal à l’instant t (s)
export const valeur = (comps, u0, t) => comps.reduce((s, c) => s + c.a * Math.cos(2 * Math.PI * c.f * t + c.ph), u0);

// N échantillons sur [0 ; fenMs] (ms)
export function echantillons(cfg, fenMs, N) {
  const comps = composantes(cfg), u = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) u[i] = valeur(comps, cfg.u0 || 0, (fenMs * 1e-3 * i) / N);
  return u;
}

// puissance acoustique moyenne relative : somme des a²/2 des composantes qui VARIENT ; la composante continue u0 ne fait pas vibrer l’air, elle n’y contribue pas
export const puissanceRelative = cfg => composantes(cfg).reduce((s, c) => s + c.a ** 2 / 2, 0);
export const niveauRelatif = (P, Pref) => 10 * Math.log10(P / Pref);

// ---------- mesure d’une période et d’une fréquence ----------
export const periodeDepuisRepères = (t1ms, t2ms, n) => Math.abs(t2ms - t1ms) / n;                 // ms
export const frequenceDepuisPeriode = Tms => 1000 / Tms;                                          // Hz
// incertitude relative sur T quand chaque repère est pointé à ± pas (ms) : type B, loi rectangulaire, deux pointés indépendants
export const incertitudeRelPeriode = (pasMs, dMs) => (Math.SQRT2 * pasMs / Math.sqrt(3)) / dMs;

// ---------- axe du spectre : borne supérieure « ronde » ----------
export function fmaxSpectre(fMax) {
  const brut = fMax * 1.12, p = 10 ** Math.floor(Math.log10(brut)), n = brut / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

// ---------- niveau d’intensité sonore ----------
export const surfaceSphere = r => 4 * Math.PI * r * r;                                           // m²
export const intensite = (P, r, n = 1) => (n * P) / surfaceSphere(r);                            // W·m⁻² ; n sources identiques, incohérentes, au même endroit
export const niveau = I => 10 * Math.log10(I / I0);                                              // dB
export const niveauSource = (P, r, n = 1) => niveau(intensite(P, r, n));
export const niveauAutreDistance = (L1, r1, r2) => L1 - 20 * Math.log10(r2 / r1);
export const niveauAutreSources = (L1, n) => L1 + 10 * Math.log10(n);

// ---------- tirages des défis (alea injectable pour les tests) ----------
const entre = (alea, a, b) => a + Math.floor(alea() * (b - a + 1));
const parmi = (alea, t) => t[Math.floor(alea() * t.length)];
function melange(alea, t) { const x = t.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export function nouveauDefiFreq(alea = Math.random) {
  const f1 = 10 * entre(alea, 15, 90);                       // 150 à 900 Hz, par pas de 10 Hz
  return { f1, timbre: parmi(alea, TIMBRES_INSTRUMENTS) };
}

export function nouveauDefiTimbre(alea = Math.random) {
  const f = parmi(alea, [200, 240, 280, 320, 360, 400, 440, 480]);
  const tRef = parmi(alea, TIMBRES_INSTRUMENTS), autres = TIMBRES_INSTRUMENTS.filter(k => k !== tRef);
  const ref = { f, timbre: tRef };
  const cA = { f, timbre: parmi(alea, autres), bonne: true };                                       // même hauteur, autre timbre
  const cB = { f: f * parmi(alea, [1.5, 0.75]), timbre: tRef };                                     // autre hauteur, même timbre
  const cC = { f: f * parmi(alea, [1.25, 0.8]), timbre: parmi(alea, autres) };                      // autre hauteur, autre timbre
  const ordre = melange(alea, [cA, cB, cC]);
  const cands = ordre.map((c, i) => ({ ...c, id: 'ABC'[i] }));
  return { ref, cands, bonne: cands.find(c => c.bonne).id };
}

export function nouveauDefiNiveau(alea = Math.random) {
  const L1 = entre(alea, 60, 86);
  if (alea() < 0.5) {
    const loin = alea() < 0.7, k = parmi(alea, [2, 3, 4, 5, 8, 10]), pt = parmi(alea, [1, 2, 4, 5]);   // pt : la plus courte des deux distances (m)
    const r1 = loin ? pt : pt * k, r2 = loin ? pt * k : pt;
    return { variante: 'distance', L1, r1, r2, vrai: niveauAutreDistance(L1, r1, r2) };
  }
  const n = parmi(alea, [2, 3, 4, 5, 10]);
  return { variante: 'sources', L1, n, vrai: niveauAutreSources(L1, n) };
}
