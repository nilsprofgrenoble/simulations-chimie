// ====================================================
//  MODÈLE « PRÉVOIR LE SENS D'ÉVOLUTION : Qr, K ET POTENTIELS STANDARDS » (sim 293, TSTL SPCL, partie Oxydo-réduction).
//  Programme : calculer une constante d'équilibre à partir des potentiels standards ; prévoir le sens d'évolution spontanée avec les potentiels
//  ou le quotient de réaction ; confronter aux résultats expérimentaux pour repérer un blocage cinétique.
//  Convention (celle de la sim 292) : à 25 °C, E = E° + (0,06 / n) log([Ox] / [Red]), les solides valent 1.
//  Deux couples Ox1 / Red1 (E°1, n1) et Ox2 / Red2 (E°2, n2) avec E°1 > E°2 : l'équation écrite « dans le sens direct » est
//      a Ox1 + b Red2 ⇌ a Red1 + b Ox2,  avec N = ppcm(n1, n2) électrons échangés, a = N / n1, b = N / n2 ;
//      log K = N (E°1 − E°2) / 0,06 ;  Qr = [Red1]^a [Ox2]^b / ( [Ox1]^a [Red2]^b ) (solides = 1).
//  Évolution spontanée : sens direct si Qr < K, sens inverse si Qr > K. Lien avec les potentiels de Nernst : E1 − E2 = (0,06 / N) log(K / Qr).
//  Hypothèses de travail (rappelées dans la simulation) : 25 °C ; 0,06 V arrondi de 0,0592 V ; E° tabulés au centivolt (donc log K connu à ± 0,3
//  pour N = 2 et E° d'écart d'un volt : K n'est qu'un ordre de grandeur) ; activités ≈ concentrations ; solides présents en excès ; réaction
//  instantanée sauf blocage cinétique (que le modèle ne prévoit pas : K et Qr donnent le sens, jamais la vitesse).
// ====================================================
import { fr, concTexte, log10 } from './nernstModele.js';
export { fr, concTexte, log10 };

export const PENTE = 0.06;
export const C_MIN = 1e-3, C_MAX = 1;

// Couples (E° du tableau de la fiche). oxSolide / redSolide : espèce solide (valeur 1 dans Qr).
export const COUPLES = {
  zn: { id: 'zn', nom: 'Zn²⁺ / Zn', ox: 'Zn²⁺', red: 'Zn', n: 2, E0: -0.76, redSolide: true },
  cu: { id: 'cu', nom: 'Cu²⁺ / Cu', ox: 'Cu²⁺', red: 'Cu', n: 2, E0: 0.34, redSolide: true },
  fe: { id: 'fe', nom: 'Fe³⁺ / Fe²⁺', ox: 'Fe³⁺', red: 'Fe²⁺', n: 1, E0: 0.77, redSolide: false },
  ag: { id: 'ag', nom: 'Ag⁺ / Ag', ox: 'Ag⁺', red: 'Ag', n: 1, E0: 0.80, redSolide: true },
};
export const ORDRE = ['zn', 'cu', 'fe', 'ag'];             // E° croissants
export const PAIRES = (() => { const l = []; for (let i = 0; i < ORDRE.length; i++) for (let j = i + 1; j < ORDRE.length; j++) l.push([ORDRE[i], ORDRE[j]]); return l; })();

// Cas de l'eau oxygénée (blocage cinétique) : H₂O₂ / H₂O (1,78 V) et O₂ / H₂O₂ (0,68 V), 2 H₂O₂ ⇌ O₂ + 2 H₂O, N = 2 (H⁺ s'éliminent)
export const H2O2 = { E0ox: 1.78, E0red: 0.68, N: 2, logK: 2 * (1.78 - 0.68) / PENTE };

const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
export const ppcm = (a, b) => (a * b) / pgcd(a, b);

// ---------- une paire de couples ----------
export function paire(idA, idB) {
  let A = COUPLES[idA], B = COUPLES[idB];
  if (A.E0 < B.E0) [A, B] = [B, A];                         // ox1 : le couple de plus grand E°
  const N = ppcm(A.n, B.n), a = N / A.n, b = N / B.n, logK = N * (A.E0 - B.E0) / PENTE;
  const especes = [
    { e: A.ox, coef: -a, solide: false, role: 'ox1' }, { e: B.red, coef: -b, solide: !!B.redSolide, role: 'red2' },
    { e: A.red, coef: a, solide: !!A.redSolide, role: 'red1' }, { e: B.ox, coef: b, solide: false, role: 'ox2' },
  ];
  return { ox1: A, red2: B, a, b, N, logK, K: Math.pow(10, logK), especes,
    dissoutes: [...new Set(especes.filter(s => !s.solide).map(s => s.e))],
    solides: especes.filter(s => s.solide).map(s => s.e) };
}
const etat = s => (s.solide ? '(s)' : '(aq)');
const terme = s => `${Math.abs(s.coef) > 1 ? Math.abs(s.coef) + ' ' : ''}${s.e}${etat(s)}`;
export const equationTexte = (p, avecEtats = true) => {
  const f = s => (avecEtats ? terme(s) : `${Math.abs(s.coef) > 1 ? Math.abs(s.coef) + ' ' : ''}${s.e}`);
  const g = p.especes.filter(s => s.coef < 0), d = p.especes.filter(s => s.coef > 0);
  return `${g.map(f).join(' + ')} ⇌ ${d.map(f).join(' + ')}`;
};
export const concParDefaut = (p, v = 0.10) => Object.fromEntries(p.dissoutes.map(e => [e, v]));

// ---------- Qr, sens, potentiels ----------
export const logQ = (p, c) => p.especes.reduce((s, x) => (x.solide ? s : s + x.coef * log10(c[x.e])), 0);
export const quotient = (p, c) => Math.pow(10, logQ(p, c));
export const sens = (p, c, eps = 1e-9) => { const d = p.logK - logQ(p, c); return Math.abs(d) < eps ? 'equilibre' : d > 0 ? 'direct' : 'inverse'; };
// potentiel de Nernst d'un couple dans la composition c (solides = 1)
export const potentielCouple = (cp, c) => cp.E0 + PENTE / cp.n * log10((cp.oxSolide ? 1 : c[cp.ox]) / (cp.redSolide ? 1 : c[cp.red]));
export const potentiels = (p, c) => ({ E1: potentielCouple(p.ox1, c), E2: potentielCouple(p.red2, c) });
// décalage (en V) E1 − E2 ; positif : sens direct
export const ecartE = (p, c) => { const { E1, E2 } = potentiels(p, c); return E1 - E2; };

// ---------- évolution jusqu'à l'équilibre (solides en excès) ----------
// Paramétrage par la concentration résiduelle r de l'espèce limitante (précis même pour des résidus de 10⁻²⁰ mol/L).
export function evolution(p, c0) {
  const s = sens(p, c0);
  if (s === 'equilibre') return { sens: s, p, c0, fin: { ...c0 }, x: 0, L: 0, lim: null, concA: () => ({ ...c0 }) };
  const dir = s === 'direct' ? 1 : -1;
  const dis = p.especes.filter(x => !x.solide);
  const consommees = dis.filter(x => x.coef * dir < 0);
  let lim = consommees[0], xlim = c0[lim.e] / Math.abs(lim.coef);
  for (const x of consommees) { const v = c0[x.e] / Math.abs(x.coef); if (v < xlim) { lim = x; xlim = v; } }
  const cL = c0[lim.e];
  const concA = r => {
    const x = dir * (cL - r) / Math.abs(lim.coef), c = {};
    for (const e of dis) {
      if (e.e === lim.e) { c[e.e] = r; continue; }
      const reste = c0[e.e] + e.coef * x;
      if (e.coef * dir < 0) {                               // autre réactif : ≥ |coef| r / |coef_lim| (pas de soustraction catastrophique)
        const marge = c0[e.e] - Math.abs(e.coef) * cL / Math.abs(lim.coef);
        c[e.e] = Math.max(0, marge) + Math.abs(e.coef) * r / Math.abs(lim.coef);
      } else c[e.e] = reste;
    }
    return c;
  };
  const f = u => logQ(p, concA(Math.pow(10, u))) - p.logK;
  let lo = -250, hi = Math.log10(cL);                       // f(hi) a le signe de (lq0 − logK), f(lo) le signe opposé
  const sHi = Math.sign(f(hi));
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (Math.sign(f(mid)) === sHi) hi = mid; else lo = mid; }
  const rEq = Math.pow(10, (lo + hi) / 2), L = Math.log10(cL / rEq);
  const fin = concA(rEq), x = dir * (cL - rEq) / Math.abs(lim.coef);
  return { sens: s, p, c0, lim, cL, rEq, L, x, fin, dir, concA };
}
// état à l'instant τ ∈ [0, 1] : décroissance exponentielle du résidu (la vitesse est proportionnelle à la concentration)
export function etatTau(ev, tau) {
  if (ev.sens === 'equilibre') return { c: { ...ev.c0 }, logQ: logQ(ev.p, ev.c0), x: 0 };
  const r = ev.cL * Math.pow(10, -ev.L * Math.min(1, Math.max(0, tau))), c = ev.concA(r);
  return { c, logQ: logQ(ev.p, c), x: ev.dir * (ev.cL - r) / Math.abs(ev.lim.coef) };
}

// ---------- parcours guidé ----------
export const GUIDE = {
  // Ag⁺ / Cu : 2 Ag⁺ + Cu ⇌ 2 Ag + Cu²⁺
  ag: ['cu', 'ag'], agC: { 'Ag⁺': 0.10, 'Cu²⁺': 0.10 },
  // cas où les concentrations inversent le sens : Ag⁺ + Fe²⁺ ⇌ Ag + Fe³⁺
  inv: ['ag', 'fe'], invC: { 'Ag⁺': 0.010, 'Fe²⁺': 0.10, 'Fe³⁺': 0.10 },
};

// ---------- défis ----------
const CONCS = [1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1];
const tire = l => l[Math.floor(Math.random() * l.length)];
// défi 1 : log K de deux couples tirés au hasard
export function tirageDefiK() {
  const [a, b] = tire(PAIRES.concat([['fe', 'ag'], ['cu', 'fe']]));
  return { ids: [a, b], p: paire(a, b) };
}
export const tolLogK = lk => Math.max(0.06, 0.025 * Math.abs(lk));
// défi 2 : Qr et sens (log K donné) ; une fois sur deux le sens inverse (seul possible pour Ag⁺ / Fe²⁺)
export function tirageDefiSens() {
  const voulu = Math.random() < 0.5 ? 'inverse' : 'direct';
  const pool = voulu === 'inverse' ? [['fe', 'ag']] : PAIRES;
  for (let i = 0; i < 400; i++) {
    const [a, b] = tire(pool), p = paire(a, b), c = Object.fromEntries(p.dissoutes.map(e => [e, tire(CONCS)]));
    if (Math.abs(p.logK - logQ(p, c)) < 0.4) continue;
    if (sens(p, c) !== voulu) continue;
    return { ids: [a, b], p, c };
  }
  const p = paire('cu', 'zn'); return { ids: ['cu', 'zn'], p, c: concParDefaut(p) };
}

// ---------- affichage ----------
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const pow10 = n => `10${[...String(Math.round(n))].map(c => SUP[c]).join('')}`;
export const puissanceTexte = v => {                       // 10^v : nombre simple de 1 à 999, sinon notation scientifique française
  if (v > -0.05 && v < 2.999) { const x = Math.pow(10, v); return fr(x, x < 9.95 ? 1 : 0); }
  const e = Math.floor(v + 1e-9), m = Math.pow(10, v - e); return `${m >= 9.95 ? '1,0' : fr(m, 1)}×${pow10(m >= 9.95 ? e + 1 : e)}`; };
// plage de l'axe logarithmique : contient log Qr et log K avec une marge, au moins 7 décades
export const plageJauge = (lq, lk) => { let lo = Math.floor(Math.min(lq, lk) - 1.5), hi = Math.ceil(Math.max(lq, lk) + 1.5); while (hi - lo < 7) { lo -= 1; if (hi - lo < 7) hi += 1; } return [lo, hi]; };
