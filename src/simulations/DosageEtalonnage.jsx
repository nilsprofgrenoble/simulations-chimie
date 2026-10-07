import { useState, useEffect, useRef } from "react";
import { cardStyle, fmt, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, ORANGE_GUIDE, avecIndices } from "../commun";
import { BeerLambertBTS } from "./BeerLambert";

// ====================================================
// DOSAGE PAR ÉTALONNAGE EXTERNE (BTS Métiers de la chimie)
// Parcours d'après l'activité « dosage de la caféine dans une crème cosmétique » (CLHP) : concevoir la gamme à partir
// de l'ordre de grandeur attendu, la préparer, mesurer, exploiter (régression, résidus, test de Fisher), doser l'échantillon.
// On ne simule pas l'appareil : il renvoie un signal (aire de pic, absorbance…) proportionnel à la concentration, avec des
// erreurs réalistes de préparation (prélèvements) et de mesure (injection, lecture).
// ====================================================

// ── Loi de Fisher : fonction bêta incomplète régularisée et quantile ──
function lnGamma(x) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const ci of c) s += ci / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
function betacf(a, b, x) { const qab = a + b, qap = a + 1, qam = a - 1; let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d; for (let m = 1; m <= 200; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break; } return h; }
function betai(a, b, x) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
const fCdf = (F, d1, d2) => (F <= 0 ? 0 : betai(d1 / 2, d2 / 2, d1 * F / (d1 * F + d2)));
function fQuantile(p, d1, d2) { let lo = 0, hi = 1000; for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (fCdf(m, d1, d2) < p) lo = m; else hi = m; } return (lo + hi) / 2; }

function rng(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

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
  const fisher = d1 >= 1 && d2 >= 1 && SSpe > 0 ? (() => { const F = ((SSres - SSpe) / d1) / (SSpe / d2); return { F, d1, d2, Fc: fQuantile(0.95, d1, d2), p: 1 - fCdf(F, d1, d2) }; })() : null;
  return { a, b, R2: 1 - SSres / Syy, res, syx, sa, sb, mx, my, Sxx, n, fisher };
}

// ── Les techniques : seuls changent le signal, les ordres de grandeur et la verrerie ──
const TECHNIQUES = {
  clhp: { nom: 'CLHP (caféine)', analyte: 'caféine', signal: 'aire du pic', uC: 'mg/L', cRef: 1004, refTxt: 'Sref : 100,4 mg de caféine dans une fiole de 100 mL',
    vFiole: 20, outil: 'seringue de 25 µL', uV: 'µL', vMin: 5, vMax: 50, vRemplissage: 25, k: 21.0, cLin: 8, courbure: 0.6,
    prep: v => 0.3 + 0.01 * v, mesure: s => 0.15 + 0.005 * s, blanc: 0.1, dec: 2 },
  spectro: { nom: 'Spectrophotométrie (permanganate)', analyte: 'ions permanganate', signal: 'absorbance', uC: 'mg/L', cRef: 100, refTxt: 'solution mère de permanganate de potassium à 100 mg/L',
    vFiole: 50, outil: 'burette graduée de 25 mL', uV: 'mL', vMin: 0.5, vMax: 25, vRemplissage: 25, k: 0.0152, cLin: 60, courbure: 0.00002,
    prep: v => 0.02 + 0.002 * v, mesure: s => 0.002 + 0.004 * s, blanc: 0.004, dec: 3, cEch: 23.4 },
  saa: { nom: 'Absorption atomique (cuivre)', analyte: 'cuivre', signal: 'absorbance', uC: 'mg/L', cRef: 100, refTxt: 'solution mère de cuivre à 100 mg/L',
    vFiole: 100, outil: 'burette graduée de 25 mL', uV: 'mL', vMin: 0.5, vMax: 25, vRemplissage: 25, k: 0.078, cLin: 4, courbure: 0.004,
    prep: v => 0.02 + 0.002 * v, mesure: s => 0.002 + 0.006 * s, blanc: 0.002, dec: 3, cEch: 1.87 },
};
const signalVrai = (T, c) => T.k * c - T.courbure * Math.max(0, c - T.cLin) ** 2;
// Préparation de l'échantillon de crème (CLHP) : deux schémas de dilution d'un facteur 1000
const DILUTIONS = {
  A: { nom: '20 µL de S(éch-mère) dans une fiole de 20 mL (seringue)', facteur: 1000, uRel: 0.025 },
  B: { nom: '1 mL dans une fiole de 50 mL, puis 1 mL dans une fiole de 20 mL (pipettes jaugées)', facteur: 1000, uRel: 0.007 },
};
const CREME = { m: 2.34, vFiole: 100 };   // g pesés, mL

// Préparation et mesure de la gamme : en mode « injection », chaque fiole est préparée une fois et mesurée deux fois ;
// en mode « fioles », chaque niveau est préparé deux fois indépendamment (les erreurs de prélèvement diffèrent)
function mesurerGamme(T, volumes, mode, graine) {
  const r = rng(graine), x = [], y = [];
  [0, ...volumes].forEach(v => {
    const cNom = T.cRef * v / (T.vFiole * (T.uV === 'µL' ? 1000 : 1));
    const prepUne = () => (v === 0 ? 0 : cNom * (1 + T.prep(v) / v * gauss(r)) * (v > T.vRemplissage ? 1 + 0.004 * gauss(r) : 1));
    const cPrep1 = prepUne(), cPrep2 = mode === 'fioles' ? prepUne() : cPrep1;
    [cPrep1, cPrep2].forEach(cp => { const s = signalVrai(T, cp) + T.blanc; x.push(Math.round(cNom * 1e4) / 1e4); y.push(Math.round((s + T.mesure(s) * gauss(r)) * 10 ** T.dec) / 10 ** T.dec); });
  });
  return { x, y, mode, volumes: [...volumes] };
}
function mesurerEchantillon(T, cInjVraie, graine) {
  const r = rng(graine);
  return [0, 1].map(() => { const s = signalVrai(T, cInjVraie) + T.blanc; return Math.round((s + T.mesure(s) * gauss(r)) * 10 ** T.dec) / 10 ** T.dec; });
}
// Les vérifications de la gamme proposée
function verifierGamme(T, volumes, cAttendue) {
  const c = volumes.map(v => T.cRef * v / (T.vFiole * (T.uV === 'µL' ? 1000 : 1)));
  const cs = [...c].sort((p, q) => p - q), cMin = cs[0], cMax = cs[cs.length - 1];
  const ecartMax = cs.length > 1 ? Math.max(...cs.slice(1).map((v, i) => v - cs[i]), cMin) : Infinity;
  const pos = cAttendue != null ? (cAttendue - cMin) / ((cMax - cMin) || 1) : null;
  const L = [
    { ok: volumes.length >= 5, t: `${volumes.length} étalon(s), plus le blanc : il en faut au moins 5 pour juger la linéarité.` },
    { ok: volumes.every(v => v >= T.vMin && v <= T.vMax), t: volumes.some(v => v < T.vMin) ? `Un volume est inférieur à ${fmt(T.vMin, 1)} ${T.uV} : trop petit pour être prélevé précisément avec la ${T.outil}.`
      : volumes.some(v => v > T.vMax) ? `Un volume dépasse ${fmt(T.vMax, 0)} ${T.uV}.` : `Tous les volumes sont réalisables avec la ${T.outil}.` },
    ...(volumes.some(v => v > T.vRemplissage && v <= T.vMax) ? [{ ok: null, t: `Au-delà de ${T.vRemplissage} ${T.uV}, il faut deux prélèvements : l'erreur augmente un peu.` }] : []),
    ...(cAttendue != null ? [{ ok: cAttendue > cMin && cAttendue < cMax, t: cAttendue <= cMin || cAttendue >= cMax ? `L'échantillon attendu (${fmt(cAttendue, 2)} ${T.uC}) est hors de la gamme : il faudrait extrapoler, ce qui est interdit.`
      : pos < 0.2 || pos > 0.8 ? `L'échantillon attendu (${fmt(cAttendue, 2)} ${T.uC}) est dans la gamme, mais près d'un bord : mieux vaut le placer vers le milieu.` : `L'échantillon attendu (${fmt(cAttendue, 2)} ${T.uC}) tombe vers le milieu de la gamme.` }] : []),
    { ok: ecartMax <= 0.4 * (cMax || 1), t: ecartMax <= 0.4 * (cMax || 1) ? 'Les étalons sont bien répartis sur la gamme.' : 'Un « trou » dans la gamme : répartissez mieux les étalons.' },
    { ok: cMax <= T.cLin, t: cMax <= T.cLin ? `Toute la gamme est dans le domaine de linéarité de la méthode (jusqu'à environ ${fmt(T.cLin, 0)} ${T.uC}).` : `Le plus concentré dépasse le domaine de linéarité (environ ${fmt(T.cLin, 0)} ${T.uC}) : la réponse commence à s'infléchir.` },
  ];
  return { c, cMin, cMax, L, valide: L.every(l => l.ok !== false) };
}

// ════════════════ GRAPHIQUES ════════════════
function GrapheEtalonnage({ x, y, reg, T, ech }) {
  const W = 540, H = 280, g = 58, d = 16, h = 14, b = 42;
  const xMax = Math.max(...x, ech ? ech.c : 0) * 1.08 || 1, yMax = Math.max(...y, ech ? ech.s : 0) * 1.1 || 1;
  const X = v => g + v / xMax * (W - g - d), Y = v => H - b - v / yMax * (H - b - h);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Droite d'étalonnage" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {[0.25, 0.5, 0.75, 1].map(f => <g key={f}><line x1={g} y1={Y(f * yMax)} x2={W - d} y2={Y(f * yMax)} stroke="#e2e8f0"/><text x={g - 5} y={Y(f * yMax) + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">{fmt(f * yMax, yMax < 2 ? 2 : yMax < 20 ? 1 : 0)}</text></g>)}
      {[0.25, 0.5, 0.75, 1].map(f => <text key={f} x={X(f * xMax)} y={H - b + 15} fontSize="11.5" fill={KIT.txt2} textAnchor="middle">{fmt(f * xMax, xMax < 5 ? 2 : 1)}</text>)}
      {reg && <line x1={X(0)} y1={Y(reg.b)} x2={X(xMax)} y2={Y(reg.a * xMax + reg.b)} stroke="#2563eb" strokeWidth="2"/>}
      {x.map((v, i) => <circle key={i} cx={X(v)} cy={Y(y[i])} r="4.5" fill="#1e3a8a"/>)}
      {ech && reg && <g>
        <line x1={g} y1={Y(ech.s)} x2={X(ech.c)} y2={Y(ech.s)} stroke="#dc2626" strokeDasharray="5 4"/>
        <line x1={X(ech.c)} y1={Y(ech.s)} x2={X(ech.c)} y2={H - b} stroke="#dc2626" strokeDasharray="5 4"/>
        <circle cx={X(ech.c)} cy={Y(ech.s)} r="6" fill="#fde047" stroke="#dc2626" strokeWidth="2"/>
      </g>}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={h} x2={g} y2={H - b} stroke={KIT.txt}/>
      <text x={(g + W - d) / 2} y={H - 8} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">concentration C ({T.uC})</text>
      <text x="14" y={(h + H - b) / 2} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 14 ${(h + H - b) / 2})`}>{T.signal}</text>
    </svg>
  );
}
function GrapheResidus({ x, reg, T }) {
  const W = 540, H = 170, g = 58, d = 16, h = 12, b = 32;
  const xMax = Math.max(...x) * 1.08 || 1, rMax = Math.max(...reg.res.map(Math.abs), reg.syx * 2) * 1.2;
  const X = v => g + v / xMax * (W - g - d), Y = v => h + (rMax - v) / (2 * rMax) * (H - h - b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Graphique des résidus" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      <rect x={g} y={Y(2 * reg.syx)} width={W - g - d} height={Y(-2 * reg.syx) - Y(2 * reg.syx)} fill="#f1f5f9"/>
      <line x1={g} y1={Y(0)} x2={W - d} y2={Y(0)} stroke={KIT.txt}/>
      {x.map((v, i) => <circle key={i} cx={X(v)} cy={Y(reg.res[i])} r="4.5" fill="#7c3aed"/>)}
      <text x={g - 5} y={Y(rMax * 0.8) + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">{fmt(rMax * 0.8, T.dec)}</text>
      <text x={g - 5} y={Y(-rMax * 0.8) + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">{fmt(-rMax * 0.8, T.dec)}</text>
      <text x={(g + W - d) / 2} y={H - 6} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">résidus (mesure − droite) en fonction de C ; bande grise : ± 2 s(y/x)</text>
    </svg>
  );
}
function Hypotheses() {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle linéaire</strong> : le signal est proportionnel à la concentration (plus une constante) dans le domaine de la gamme. À vérifier : résidus sans tendance, test de Fisher.</li>
      <li><strong>Concentrations des étalons connues avec une erreur négligeable</strong> devant celle du signal : la régression ne place les erreurs que sur y.</li>
      <li><strong>Même dispersion sur toute la gamme</strong> (homoscédasticité) : sinon, il faudrait une régression pondérée.</li>
      <li><strong>Erreurs indépendantes, de loi normale</strong> : c'est ce qui justifie les incertitudes calculées et le seuil du test de Fisher.</li>
      <li><strong>Pour le test de Fisher</strong> : des répétitions <em>indépendantes</em>, qui contiennent toutes les sources de variabilité (préparation et mesure). Deux injections d'une même fiole ne suffisent pas.</li>
      <li><strong>Pas d'extrapolation</strong> : l'échantillon doit tomber dans la gamme, et se comporter comme les étalons (pas d'effet de matrice).</li>
    </ul>
  );
}

// ════════════════ SIMULATION ════════════════
export function SimulationDosageEtalonnage() {
  const [mode, setMode] = useState('guide');
  const [onglet, setOnglet] = useState('banc');
  const [guide, setGuide] = useEtatPersistant('dosage-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [graine] = useEtatPersistant('dosage-graine-v1', Math.floor(Math.random() * 1e6));
  const [techId, setTechId] = useState('clhp');
  const [volumes, setVolumes] = useEtatPersistant('dosage-volumes-v1', [10, 20, 30, 40, 50]);
  const [modeRep, setModeRep] = useState('injection');
  const [mes, setMes] = useEtatPersistant('dosage-mesures-v1', { injection: null, fioles: null, actif: null, ech: null, dilution: 'B' });
  const [dilution, setDilution] = useState('B');
  const [tirage, setTirage] = useState(1);
  const [ouverts, setOuverts] = useState({ gamme: true, hypo: true, stats: true });
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;
  const T = TECHNIQUES[enGuide || enDefi ? 'clhp' : techId];
  // teneur en caféine de la crème : 4,0 % dans le parcours (comme dans l'activité), inconnue dans le défi
  const teneur = enDefi && defi ? defi.teneur : 4.0;
  const cInjVraie = T === TECHNIQUES.clhp ? teneur / 100 * CREME.m * 1000 / CREME.vFiole * 1000 / 1000 : T.cEch;   // mg/L injectés
  const cAttendue = T === TECHNIQUES.clhp ? (enDefi ? null : 5 / 100 * CREME.m * 1000 / CREME.vFiole) : T.cEch * (0.85 + 0.3 * rng(graine)());
  const verif = verifierGamme(T, volumes, cAttendue);
  const donnees = mes.actif ? mes[mes.actif] : null;
  const reg = donnees ? regression(donnees.x, donnees.y) : null;
  const echMoy = mes.ech ? (mes.ech[0] + mes.ech[1]) / 2 : null;
  const cInj = reg && echMoy != null ? (echMoy - reg.b) / reg.a : null;
  const facteur = T === TECHNIQUES.clhp ? DILUTIONS[mes.dilution || 'B'].facteur : 1;
  const pourcent = cInj != null && T === TECHNIQUES.clhp ? cInj * facteur * CREME.vFiole / 1000 / (CREME.m * 1000) * 100 : null;
  const uC = reg && echMoy != null ? reg.syx / reg.a * Math.sqrt(1 / 2 + 1 / reg.n + (echMoy - reg.my) ** 2 / (reg.a ** 2 * reg.Sxx)) : null;
  const LD = reg ? 3 * reg.sb / reg.a : null, LQ = reg ? 10 * reg.sb / reg.a : null;

  function mesurer(m) {
    const g = graine * 31 + tirage * 7 + (m === 'fioles' ? 1 : 0) + (enDefi ? 999 : 0);
    const d = mesurerGamme(T, volumes, m, g);
    setMes(x => ({ ...x, [m]: d, actif: m, ech: null }));
    setTirage(t => t + 1);
  }
  function mesurerEch() {
    const vrai = cInjVraie * (T === TECHNIQUES.clhp ? 1 + DILUTIONS[dilution].uRel * gauss(rng(graine + tirage * 13)) : 1);
    setMes(x => ({ ...x, ech: mesurerEchantillon(T, vrai, graine + tirage * 17), dilution }));
    setTirage(t => t + 1);
  }
  // Changer de technique ou de mode efface les mesures (mais pas au chargement de la page : on peut reprendre un parcours)
  const premier = useRef(true);
  useEffect(() => { if (premier.current) { premier.current = false; return; } setMes(x => ({ ...x, injection: null, fioles: null, actif: null, ech: null })); }, [techId, mode]);

  // ── Valeurs attendues du parcours ──
  const mCafAtt = 5 / 100 * CREME.m * 1000;               // mg
  const cMereAtt = mCafAtt / (CREME.vFiole / 1000);       // mg/L
  const cInjAtt = cMereAtt / 1000;
  const vPour1 = 1.0 * TECHNIQUES.clhp.vFiole / TECHNIQUES.clhp.cRef * 1000;   // µL pour 1,00 mg/L

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'contexte', titre: 'Doser la caféine d’une crème', focus: [],
      texte: <>Une crème cosmétique contient, d'après son fabricant, <strong>5 % en masse de caféine</strong>. On la dose par CLHP, détection à 272 nm :
        l'aire du pic de caféine est proportionnelle à sa concentration, A = a × C + b. Pour connaître a et b, on fait un <strong>étalonnage externe</strong> :
        on mesure l'aire de solutions de concentration connue (la gamme), puis celle de l'échantillon.</>, tache: null },
    { id: 'sref', titre: 'La solution de référence', focus: [],
      texte: <>On pèse 100,4 mg de caféine, que l'on dissout dans une fiole jaugée de 100 mL : c'est la solution S<sub>ref</sub>.</>,
      tache: { type: 'num', q: 'Concentration en masse de S_ref, en mg/L', unite: 'mg/L', vrai: 1004, tol: 0.002,
        pieges: [[1.004, 'C’est en g/L : la réponse est demandée en mg/L.'], [100.4, 'Divisez par le volume en litres (100 mL = 0,100 L).']] } },
    { id: 'masseAtt', titre: 'L’ordre de grandeur attendu (1)', focus: [],
      texte: <>Avant de préparer la gamme, il faut savoir où tombera l'échantillon. On pèse {fmt(CREME.m, 2)} g de crème, annoncée à 5 % de caféine.</>,
      tache: { type: 'num', q: 'Masse de caféine attendue dans la prise d’essai', unite: 'mg', vrai: mCafAtt, tol: 0.01 } },
    { id: 'cMere', titre: 'L’ordre de grandeur attendu (2)', focus: [],
      texte: <>La crème est mise en solution dans une fiole de 100 mL : c'est la solution S<sub>éch-mère</sub>.</>,
      tache: { type: 'num', q: 'Concentration attendue de S_éch-mère', unite: 'mg/L', vrai: cMereAtt, tol: 0.01 } },
    { id: 'dilution', titre: 'Diluer d’un facteur 1000', focus: ['ech'],
      texte: <>S<sub>éch-mère</sub> est bien trop concentrée pour la gamme : on la dilue d'un facteur 1000. Deux façons de faire :
        <br/>A : {DILUTIONS.A.nom} ;<br/>B : {DILUTIONS.B.nom}.</>,
      tache: { type: 'qcm', q: 'Quelle dilution est la plus précise ?', options: ['B : prélever 20 µL est très imprécis, alors que deux pipettes jaugées de 1 mL le sont bien plus', 'A : une seule étape, donc une seule erreur', 'Les deux se valent'], bonne: 0,
        expl: 'Une seule étape n’est pas forcément mieux : ce qui compte, c’est la précision de chaque prélèvement. 20 µL à la seringue, c’est quelques % d’erreur ; 1 mL à la pipette jaugée, moins de 1 %.' } },
    { id: 'cInj', titre: 'Ce que l’on injectera', focus: [],
      texte: <>Après la dilution d'un facteur 1000.</>,
      tache: { type: 'num', q: 'Concentration attendue dans la solution injectée', unite: 'mg/L', vrai: cInjAtt, tol: 0.01 } },
    { id: 'volume', titre: 'Préparer un étalon', focus: ['gamme'],
      texte: <>Chaque étalon se prépare en prélevant un volume V de S<sub>ref</sub> à la {TECHNIQUES.clhp.outil}, et en complétant une fiole de 20 mL. On a C = C<sub>ref</sub> × V / V<sub>fiole</sub>.</>,
      tache: { type: 'num', q: 'Volume de S_ref à prélever pour un étalon à 1,00 mg/L', unite: 'µL', vrai: vPour1, tol: 0.02,
        pieges: [[vPour1 / 1000, 'La réponse est demandée en µL (1 mL = 1000 µL).']] } },
    { id: 'gamme', titre: 'Concevoir la gamme', focus: ['gamme'],
      texte: <>Dans le cadre « Ma gamme », choisissez le nombre d'étalons et le volume prélevé pour chacun. Les vérifications s'affichent en direct : il faut
        encadrer les {fmt(cInjAtt, 2)} mg/L attendus, de préférence vers le milieu de la gamme.</>,
      tache: { type: 'action', ok: verif.valide, consigne: verif.valide ? '✅ Gamme valide' : 'Corrigez la gamme jusqu’à ce que toutes les vérifications passent.' } },
    { id: 'repetitions', titre: 'Les répétitions', focus: ['gamme'],
      texte: <>On mesure chaque niveau deux fois. On peut injecter deux fois la même fiole, ou préparer deux fioles indépendantes.</>,
      tache: { type: 'qcm', q: 'Que mesure l’écart entre deux injections de la même fiole ?', options: ['Seulement la répétabilité de l’injection : l’erreur de préparation de la fiole est la même pour les deux', 'Toutes les erreurs du dosage', 'L’erreur de préparation'], bonne: 0 } },
    { id: 'mesurer', titre: 'Préparer et mesurer', focus: ['gamme'],
      texte: <>Cliquez sur « Préparer et mesurer (même fiole injectée deux fois) », comme dans l'activité du collègue.</>,
      tache: { type: 'action', ok: !!mes.injection, consigne: mes.injection ? '✅ Gamme mesurée' : 'Mesurez la gamme.' } },
    { id: 'pente', titre: 'La droite d’étalonnage', focus: ['stats'],
      texte: <>La régression linéaire (la fonction DROITEREG du tableur) donne la pente a et l'ordonnée à l'origine b. Lisez-les dans « Exploitation ».</>,
      tache: { type: 'num', q: 'Pente a de la droite', unite: `${TECHNIQUES.clhp.signal} par mg/L`, vrai: reg ? reg.a : NaN, tol: 0.01, affiche: v => fmt(v, 2),
        bloque: reg ? null : 'Mesurez d’abord la gamme.' } },
    { id: 'hypotheses', titre: 'Les hypothèses de la régression', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'La régression linéaire ordinaire suppose que…', options: ['les concentrations des étalons sont connues avec une erreur négligeable, et que toute l’erreur est sur le signal', 'le coefficient R² vaut 1', 'l’échantillon est hors de la gamme'], bonne: 0,
        expl: 'C’est pour cela qu’on prépare les étalons avec la verrerie la plus précise possible : la régression ne « voit » pas leurs erreurs.' } },
    { id: 'r2', titre: 'Le R² suffit-il ?', focus: ['stats'],
      texte: <>R² = {reg ? fmt(reg.R2, 4) : '?'}. Un R² proche de 1 dit que les points sont proches d'une droite, mais il ne dit pas si les écarts à la droite sont
        dus au hasard ou à un défaut du modèle. Regardez le graphique des résidus.</>,
      tache: { type: 'qcm', q: 'Pour juger la linéarité, on regarde…', options: ['les résidus (pas de tendance) et un test statistique, pas seulement R²', 'uniquement R² ≥ 0,99', 'uniquement la pente'], bonne: 0 } },
    { id: 'fisher', titre: 'Le test de Fisher', focus: ['stats'],
      texte: <>Le test de Fisher compare les écarts à la droite à la dispersion des répétitions. Si F &gt; F<sub>critique</sub>, les écarts à la droite sont trop grands
        pour être dus au hasard : la linéarité est rejetée. Mesurez maintenant la gamme avec « deux fioles indépendantes », et comparez les deux tests.
        Dans l'activité du collègue (une fiole injectée deux fois), on trouve F = 13,9 pour F<sub>critique</sub> = 4,53.</>,
      tache: { type: 'action', ok: !!mes.injection && !!mes.fioles, consigne: mes.fioles ? '✅ Les deux modes sont mesurés' : 'Mesurez aussi avec deux fioles indépendantes.' } },
    { id: 'fisherSens', titre: 'Que vaut le test ?', focus: ['stats'],
      texte: <>Comparez le test de Fisher dans les deux cas (boutons « Afficher » au-dessus de l'exploitation).</>,
      tache: { type: 'qcm', q: 'Pourquoi le test n’est-il valable qu’avec des fioles indépendantes ?',
        options: ['Avec la même fiole, les répétitions ignorent l’erreur de préparation : on compare les écarts à la droite à une dispersion trop petite, et le test rejette à tort', 'Parce que les fioles sont plus propres', 'Il est valable dans les deux cas'], bonne: 0,
        expl: 'C’est ce qui arrive aux données du collègue : leur F élevé ne prouve pas que la réponse est non linéaire. Il montre surtout que chaque étalon porte sa propre erreur de préparation.' } },
    { id: 'echantillon', titre: 'Mesurer l’échantillon', focus: ['ech'],
      texte: <>Choisissez la dilution B, puis cliquez sur « Préparer et injecter l'échantillon » (deux injections).</>,
      tache: { type: 'action', ok: !!mes.ech, consigne: mes.ech ? '✅ Échantillon mesuré' : 'Mesurez l’échantillon.' } },
    { id: 'cEch', titre: 'La concentration injectée', focus: ['stats'],
      texte: <>On utilise la droite : C = (A − b) / a, avec A la moyenne des deux injections{echMoy != null ? ` (${fmt(echMoy, 2)})` : ''}.</>,
      tache: { type: 'num', q: 'Concentration de caféine dans la solution injectée', unite: 'mg/L', vrai: cInj ?? NaN, tol: 0.01, affiche: v => fmt(v, 3),
        bloque: cInj == null ? 'Mesurez d’abord l’échantillon.' : null, pieges: reg && echMoy != null ? [[echMoy / reg.a, 'N’oubliez pas de retrancher b.']] : [] } },
    { id: 'pourcent', titre: 'La teneur de la crème', focus: [],
      texte: <>On remonte : × 1000 (dilution), × 0,100 L (fiole de S<sub>éch-mère</sub>) donne la masse de caféine, puis on divise par la masse de crème pesée ({fmt(CREME.m, 2)} g).</>,
      tache: { type: 'num', q: 'Teneur en caféine de la crème, en % en masse', unite: '%', vrai: pourcent ?? NaN, tol: 0.01, affiche: v => fmt(v, 2),
        bloque: pourcent == null ? 'Mesurez d’abord l’échantillon.' : null } },
    { id: 'discussion', titre: 'Et les 5 % annoncés ?', focus: [],
      texte: <>Vous trouvez environ {pourcent != null ? fmt(pourcent, 1) : '?'} %, pour 5 % annoncés.</>,
      tache: { type: 'qcm', q: 'Quelle piste explorer en priorité ?', options: ['L’extraction : une crème se dissout mal, une partie de la caféine peut rester piégée. On le vérifie avec un ajout dosé (crème dopée avec une quantité connue)', 'Recommencer jusqu’à trouver 5 %', 'Augmenter R²'], bonne: 0,
        expl: 'L’étalonnage externe suppose que la caféine de l’échantillon se comporte comme celle des étalons (pas d’effet de matrice). Un ajout dosé, ou un rendement d’extraction, le vérifie.' } },
    { id: 'ld', titre: 'Limites de détection et de quantification', focus: ['stats'],
      texte: <>Comme dans l'activité, on prend LD = 3 s(b) / a et LQ = 10 s(b) / a. (D'autres conventions existent, par exemple avec s(y/x) ou à partir de blancs répétés.)</>,
      tache: { type: 'num', q: 'Limite de quantification LQ', unite: 'mg/L', vrai: LQ ?? NaN, tol: 0.02, affiche: v => fmt(v, 3), bloque: LQ == null ? 'Mesurez d’abord la gamme.' : null } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez mené un dosage par étalonnage externe complet : de l'ordre de grandeur à la gamme, de la régression aux hypothèses, jusqu'au
        résultat et à sa discussion. En exploration libre, changez de technique (spectrophotométrie, absorption atomique) ou exploitez vos propres données.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const vu = id => !enGuide || etape >= idx(id);
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3 } : {});

  // ════════════════ BLOCS ════════════════
  const cell = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
  const pasV = T.uV === 'µL' ? 1 : 0.5;
  const blocGamme = (
    <div style={{ ...styleBoite, ...cadre('gamme') }} data-apparait={`${idx('gamme')} ${idx('mesurer')}`}>
      <Section titre="Ma gamme" ouvert={ouverts.gamme} onBascule={() => setOuverts(o => ({ ...o, gamme: !o.gamme }))}>
        <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>{T.refTxt} (C<sub>ref</sub> = {fmt(T.cRef, 0)} {T.uC}) ; fioles jaugées de {T.vFiole} mL ; prélèvements à la {T.outil}.</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Nombre d'étalons (sans le blanc) :</span>
          <button onClick={() => volumes.length > 2 && setVolumes(v => v.slice(0, -1))} style={stylePetitBouton(false)} aria-label="Un étalon de moins">−</button>
          <strong>{volumes.length}</strong>
          <button onClick={() => volumes.length < 8 && setVolumes(v => [...v, v[v.length - 1] || T.vMin])} style={stylePetitBouton(false)} aria-label="Un étalon de plus">+</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
            <thead><tr><th style={cell}>Étalon</th><th style={cell}>V prélevé ({T.uV})</th><th style={cell}>C ({T.uC})</th></tr></thead>
            <tbody>
              <tr><td style={cell}>blanc</td><td style={cell}>0</td><td style={cell}>0</td></tr>
              {volumes.map((v, i) => (
                <tr key={i}><td style={cell}>{i + 1}</td>
                  <td style={cell}><input type="number" step={pasV} value={v} aria-label={`Volume de l'étalon ${i + 1}`} onChange={e => { const x = lireNombre(e.target.value); setVolumes(l => l.map((w, j) => (j === i ? (isFinite(x) ? x : 0) : w))); }}
                    style={{ width: 80, fontSize: 14, padding: '2px 5px', border: `1.5px solid ${KIT.bord}`, borderRadius: 5 }}/></td>
                  <td style={cell}>{fmt(verif.c[i], T.uC === 'mg/L' && verif.c[i] < 10 ? 3 : 2)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8 }}>
          {verif.L.map((l, k) => <div key={k} style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 3 }}>{l.ok === true ? '✅' : l.ok === false ? '❌' : 'ℹ️'} {l.t}</div>)}
        </div>
        {vu('mesurer') && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button onClick={() => mesurer('injection')} disabled={!verif.valide} style={{ ...styleBouton(verif.valide, '#2563eb'), opacity: verif.valide ? 1 : 0.5 }}>🧪 Préparer et mesurer (même fiole mesurée deux fois)</button>
          {vu('fisher') && <button onClick={() => mesurer('fioles')} disabled={!verif.valide} style={{ ...styleBouton(verif.valide, '#7c3aed'), opacity: verif.valide ? 1 : 0.5 }}>🧪🧪 Préparer et mesurer (deux fioles indépendantes)</button>}
        </div>}
        {!verif.valide && vu('mesurer') && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Corrigez la gamme pour pouvoir la préparer.</div>}
      </Section>
    </div>
  );
  const choixDonnees = (mes.injection || mes.fioles) && (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Afficher :</span>
      {mes.injection && <button onClick={() => setMes(x => ({ ...x, actif: 'injection' }))} style={stylePetitBouton(mes.actif === 'injection', '#2563eb')}>même fiole mesurée deux fois</button>}
      {mes.fioles && <button onClick={() => setMes(x => ({ ...x, actif: 'fioles' }))} style={stylePetitBouton(mes.actif === 'fioles', '#7c3aed')}>deux fioles indépendantes</button>}
    </div>
  );
  const blocExploitation = donnees && reg && (
    <div style={{ ...styleBoite, ...cadre('stats') }}>
      <Section titre="Exploitation" ouvert={ouverts.stats} onBascule={() => setOuverts(o => ({ ...o, stats: !o.stats }))}>
        {choixDonnees}
        <GrapheEtalonnage x={donnees.x} y={donnees.y} reg={reg} T={T} ech={cInj != null ? { c: cInj, s: echMoy } : null}/>
        <div style={{ marginTop: 8 }}><GrapheResidus x={donnees.x} reg={reg} T={T}/></div>
        <div style={{ marginTop: 8 }}>
          <LigneMesure nom="Pente a ± s(a)" valeur={`${fmt(reg.a, T.dec + 1)} ± ${fmt(reg.sa, T.dec + 1)}`} couleur="#2563eb"/>
          <LigneMesure nom="Ordonnée à l'origine b ± s(b)" valeur={`${fmt(reg.b, T.dec + 1)} ± ${fmt(reg.sb, T.dec + 1)}`}/>
          <LigneMesure nom="R²" valeur={fmt(reg.R2, 4)}/>
          <LigneMesure nom="Écart-type des résidus s(y/x)" valeur={fmt(reg.syx, T.dec + 1)}/>
          {reg.fisher ? <LigneMesure nom={`Test de Fisher (${reg.fisher.d1} ; ${reg.fisher.d2} ddl)`} valeur={`F = ${fmt(reg.fisher.F, 2)} ; F_crit = ${fmt(reg.fisher.Fc, 2)} → ${reg.fisher.F > reg.fisher.Fc ? 'linéarité rejetée' : 'linéarité acceptée'}`}
            couleur={reg.fisher.F > reg.fisher.Fc ? '#b91c1c' : '#15803d'}/> : <LigneMesure nom="Test de Fisher" valeur="impossible (pas de répétitions)"/>}
          {reg.fisher && donnees.mode === 'injection' && <div style={{ fontSize: 12.5, color: '#b45309', margin: '4px 0' }}>⚠️ Répétitions = deux mesures de la même fiole : l'hypothèse de répétitions indépendantes n'est pas vérifiée, le test n'est pas fiable.</div>}
          <LigneMesure nom="LD = 3 s(b) / a ; LQ = 10 s(b) / a" valeur={`${fmt(LD, 3)} ; ${fmt(LQ, 3)} ${T.uC}`}/>
          {cInj != null && <>
            <LigneMesure nom="Échantillon : signal moyen (2 mesures)" valeur={fmt(echMoy, T.dec)}/>
            <LigneMesure nom="C injectée = (A − b) / a" valeur={`${fmt(cInj, 3)} ± ${fmt(uC, 3)} ${T.uC} (incertitude-type due à l'étalonnage)`} couleur="#dc2626"/>
            {pourcent != null && vu('pourcent') && etape > idx('pourcent') || (pourcent != null && !enGuide) ? <LigneMesure nom="Teneur en caféine de la crème" valeur={`${fmt(pourcent, 2)} %`} couleur="#dc2626"/> : null}
            {cInj < LQ && <div style={{ fontSize: 12.5, color: '#b91c1c' }}>L'échantillon est sous la limite de quantification.</div>}
            {(cInj < Math.min(...donnees.x.filter(x => x > 0)) || cInj > Math.max(...donnees.x)) && <div style={{ fontSize: 12.5, color: '#b91c1c' }}>L'échantillon est hors de la gamme : le résultat est extrapolé.</div>}
          </>}
        </div>
      </Section>
    </div>
  );
  const blocEch = vu('dilution') && (T === TECHNIQUES.clhp) && (
    <div style={{ ...styleBoite, ...cadre('ech') }} data-apparait={`${idx('echantillon')}`}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>L'échantillon de crème</div>
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>{fmt(CREME.m, 2)} g de crème dans une fiole de 100 mL (S<sub>éch-mère</sub>), puis dilution d'un facteur 1000 :</div>
      {Object.entries(DILUTIONS).map(([k, d]) => (
        <label key={k} style={{ display: 'flex', gap: 6, fontSize: 13.5, color: KIT.txt, marginBottom: 4 }}>
          <input type="radio" name="dilution" checked={dilution === k} onChange={() => setDilution(k)}/> <strong>{k}</strong> : {d.nom}</label>
      ))}
      {vu('echantillon') && <button onClick={mesurerEch} disabled={!reg} style={{ ...styleBouton(!!reg, '#dc2626'), opacity: reg ? 1 : 0.5, marginTop: 6 }}>💉 Préparer et injecter l'échantillon</button>}
      {mes.ech && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Aires mesurées : {mes.ech.map(v => fmt(v, T.dec)).join(' ; ')} (dilution {mes.dilution}).</div>}
    </div>
  );
  const blocEchSimple = T !== TECHNIQUES.clhp && (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>L'échantillon</div>
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>Une solution de {T.analyte} dont on attend environ {fmt(cAttendue, 1)} {T.uC}, mesurée sans dilution.</div>
      <button onClick={mesurerEch} disabled={!reg} style={{ ...styleBouton(!!reg, '#dc2626'), opacity: reg ? 1 : 0.5 }}>Mesurer l'échantillon</button>
      {mes.ech && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Signaux : {mes.ech.map(v => fmt(v, T.dec)).join(' ; ')}</div>}
    </div>
  );
  const blocHypo = vu('hypotheses') && (
    <div style={{ ...styleBoite, ...cadre('hypo') }} data-apparait={`${idx('hypotheses')}`}>
      <Section titre="Hypothèses de travail" ouvert={ouverts.hypo} onBascule={() => setOuverts(o => ({ ...o, hypo: !o.hypo }))}><Hypotheses/></Section>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() { setDefi({ teneur: Math.round((2 + Math.random() * 4) * 10) / 10, rep: '', verifie: false }); setMes({ injection: null, fioles: null, actif: null, ech: null, dilution: 'B' }); }
  const voletDefi = defi && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
        L'étiquette d'une autre crème est illisible : on sait seulement qu'elle contient <strong>entre 2 et 6 % de caféine</strong>. Même protocole
        ({fmt(CREME.m, 2)} g de crème dans 100 mL, puis dilution d'un facteur 1000). Concevez une gamme qui couvre toute la plage possible, mesurez-la
        (avec des fioles indépendantes), mesurez l'échantillon, puis donnez la teneur.
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2 }}>La plage possible correspond à {fmt(0.02 * CREME.m * 1000 / 100, 2)} à {fmt(0.06 * CREME.m * 1000 / 100, 2)} mg/L injectés.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>Teneur trouvée :</span>
        <input value={defi.rep} placeholder="?" aria-label="Teneur trouvée" onChange={e => { const v = e.target.value; setDefi(d => ({ ...d, rep: v, verifie: false })); }}
          style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 100 }}/> %
        <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} disabled={pourcent == null} style={{ ...styleBouton(pourcent != null, '#16a34a'), opacity: pourcent != null ? 1 : 0.5 }}>✓ Vérifier</button>
      </div>
      {defi.verifie && pourcent != null && (() => {
        const okCalc = proche(lireNombre(defi.rep), pourcent, 0.02);
        const couvre = verif.cMin <= 0.02 * CREME.m * 10 && verif.cMax >= 0.06 * CREME.m * 10;
        return <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.55, background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 6, padding: '6px 8px' }}>
          {okCalc ? '✅' : '❌'} Calcul : votre gamme et votre mesure donnent {fmt(pourcent, 2)} %.<br/>
          {Math.abs(pourcent - defi.teneur) / defi.teneur <= 0.05 ? '✅' : '⚠️'} Teneur réelle : {fmt(defi.teneur, 1)} % (écart de {fmt(Math.abs(pourcent - defi.teneur) / defi.teneur * 100, 1)} %).<br/>
          {couvre ? '✅ Votre gamme couvre toute la plage possible.' : '⚠️ Votre gamme ne couvre pas toute la plage possible (de 0,47 à 1,40 mg/L) : avec une autre crème, vous auriez dû extrapoler.'}<br/>
          {mes.actif === 'fioles' ? '✅ Répétitions indépendantes : le test de Fisher est interprétable.' : '⚠️ Répétitions sur la même fiole : le test de Fisher n’est pas fiable.'}
        </div>;
      })()}
      <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Une autre crème</button>
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi') nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .de-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .de-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .de-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Dosage par étalonnage externe</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {mode === 'explore' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {[['banc', '🧪 Concevoir et réaliser une gamme'], ['donnees', '📊 Exploiter mes données d’étalonnage']].map(([k, n]) => <button key={k} onClick={() => setOnglet(k)} style={stylePetitBouton(onglet === k, '#0f766e')}>{n}</button>)}
      </div>}
      {mode === 'explore' && onglet === 'donnees' ? <BeerLambertBTS/> : <>
        {mode === 'explore' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Technique :</span>
          {Object.entries(TECHNIQUES).map(([k, t]) => <button key={k} onClick={() => { setTechId(k); setVolumes(k === 'clhp' ? [10, 20, 30, 40, 50] : k === 'spectro' ? [3, 6, 9, 12, 15] : [0.5, 1, 1.5, 2, 2.5].map(v => v * 1)); }} style={stylePetitBouton(techId === k, '#0f766e')}>{t.nom}</button>)}
        </div>}
        <div className="de-l1">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {blocGamme}
            {blocExploitation}
          </div>
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : enDefi ? <div style={styleBoite}>{voletDefi}</div>
              : <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
                  <li>Mesurez la même gamme avec une fiole injectée deux fois, puis avec deux fioles : que devient le test de Fisher ?</li>
                  <li>Montez la gamme au-delà du domaine de linéarité : que montrent les résidus ?</li>
                  <li>Prenez des volumes très petits : que deviennent R² et s(y/x) ?</li>
                </ul></div>}
        </div>
        <div className="de-l2">
          {blocEch}
          {mode === 'explore' && blocEchSimple}
          {blocHypo}
        </div>
      </>}
    </div>
  );
}
