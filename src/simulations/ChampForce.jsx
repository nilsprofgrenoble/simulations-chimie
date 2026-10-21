import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { useState, useRef, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, Frac, fmt, lireProgression } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 48 — CHAMP ET FORCE : champ de gravitation de la Terre, champ électrostatique d'une charge ponctuelle,
//  lignes de champ, uniformité locale du champ de pesanteur, F = m·𝒢 et F = q·E (1G, chapitre 8)
// ====================================================

const G = 6.674e-11, MT = 5.972e24, RT = 6.371e6, K = 9.0e9;      // valeurs du cours
const W0 = 600, H0 = 450, CX = 300, CY = 225;                      // scène (viewBox)
const H_MAX = 7.2e7, H_MIN = 6;                                    // hauteur de la vue (m) : Terre entière → salle de classe
const H_CH = 0.30, R0 = 0.012;                                     // charges : vue de 30 cm de haut ; boule source de 1,2 cm
const SIM = 48;
const GRAV = '\u{1D4A2}';                                         // 𝒢 : champ de gravitation (notation du programme)
const VERT = '#16a34a', ROUGE = '#dc2626', BLEU = '#2563eb', GRIS = '#64748b';

// Les trois défis, suivis sur le compte de l'élève (clé « 48:defi.… »)
declarerDefis(SIM, [
  ['signes', 'Charge mystère : signes et sens'],
  ['altitude', 'Altitude où le champ de gravitation vaut une valeur donnée'],
  ['coulomb', 'Champ et force autour d’une charge'],
]);

// ---------- nombres ----------
const SUP = c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c];
const exposant = e => String(e).replace('-', '⁻').replace(/\d/g, SUP);
function puiss(x, sig = 3) {                                  // toujours en écriture scientifique : 1,27 × 10⁷
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  let e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  if (Math.abs(+m.toFixed(sig - 1)) >= 10) { e += 1; m = x / 10 ** e; }
  return e === 0 ? m.toFixed(sig - 1).replace('.', ',') : `${m.toFixed(sig - 1).replace('.', ',')} × 10${exposant(e)}`;
}
function val(x, sig = 3) {                                    // écriture décimale si raisonnable, sinon scientifique
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e < -2 || e > 5) return puiss(x, sig);
  return fmt(x, Math.max(0, sig - 1 - e));
}
const longueur = m => m >= 1e4 ? `${fmt(m / 1e3, 0)}${NB}km` : m >= 1e3 ? `${fmt(m / 1e3, 1)}${NB}km` : m >= 10 ? `${fmt(m, 0)}${NB}m` : m >= 1 ? `${fmt(m, 1)}${NB}m` : `${fmt(m * 100, 1)}${NB}cm`;
const nC = q => `${q > 0 ? '+' : q < 0 ? '−' : ''}${fmt(Math.abs(q), 0)}${NB}nC`;

// Un vecteur avec sa flèche au-dessus (dans le texte HTML)
function Vec({ children }) {
  return <span style={{ position: 'relative', display: 'inline-block', paddingTop: '0.25em' }}>{children}
    <span aria-hidden="true" style={{ position: 'absolute', top: '-0.45em', left: 0, right: 0, textAlign: 'center', fontSize: '0.75em', lineHeight: 1 }}>→</span></span>;
}

// ---------- physique ----------
// Champ en (x, y) (m), source au centre O. Terre : 𝒢 = −G·M_T/d² · u ; charge Q (C) : E = k·Q/d² · u, u unitaire de O vers M
function champ(src, Qc, x, y) {
  const d = Math.hypot(x, y) || 1e-12, ux = x / d, uy = y / d;
  if (src === 'terre') { const n = G * MT / (d * d); return { d, ux, uy, n, vx: -n * ux, vy: -n * uy }; }
  const e = K * Qc / (d * d);
  return { d, ux, uy, n: Math.abs(e), vx: e * ux, vy: e * uy };
}

// ---------- vues ----------
const hDeZoom = z => H_MAX * (H_MIN / H_MAX) ** z;
const zoomDeH = H => Math.log(H / H_MAX) / Math.log(H_MIN / H_MAX);
function vueTerre(z) {
  const H = hDeZoom(z), s = H0 / H;
  // de « Terre entière » (centrée sur O) à « au ras du sol » (le sol au quart inférieur), sans saut
  const u = Math.min(1, Math.max(0, Math.log(4 * RT / H) / Math.log(4 / 0.6)));
  const lisse = u * u * (3 - 2 * u);
  const yc = lisse * (RT + 0.25 * H);
  return { H, s, yc };
}
const VUE_CHARGE = { H: H_CH, s: H0 / H_CH, yc: 0 };
const versPx = (v, x, y) => [CX + x * v.s, CY - (y - v.yc) * v.s];
const versMonde = (v, px, py) => [(px - CX) / v.s, v.yc + (CY - py) / v.s];
const dansVue = (px, py, m = 8) => px >= m && px <= W0 - m && py >= m && py <= H0 - m;

// Grille de vecteurs champ, à l'échelle dans la vue (la plus longue flèche mesure LMAX)
const LMAX = 46;
function grille(src, Qc, v) {
  const pts = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) {
    const px = CX + (i - 4) * 62, py = CY + (j - 3) * 62;
    const [x, y] = versMonde(v, px, py);
    const c = champ(src, Qc, x, y);
    const [ox, oy] = versPx(v, 0, 0);
    if (src === 'terre' ? c.d < RT : c.d < R0 + 0.012) continue;
    if (Math.hypot(px - ox, py - oy) < 90) continue;      // trop près de la source : flèches démesurées
    pts.push({ px, py, c });
  }
  const ref = Math.max(...pts.map(p => p.c.n), 0);
  return { pts, ref };
}
// Uniformité du champ dans la vue : écart relatif de norme et écart d'angle entre les vecteurs de la grille
function uniformite(pts) {
  if (pts.length < 2) return null;
  const n = pts.map(p => p.c.n), moy = n.reduce((a, b) => a + b, 0) / n.length;
  const a0 = Math.atan2(pts[0].c.vx, pts[0].c.vy);
  const ang = pts.map(p => { let a = Math.atan2(p.c.vx, p.c.vy) - a0; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; });
  return { dn: (Math.max(...n) - Math.min(...n)) / moy * 100, da: (Math.max(...ang) - Math.min(...ang)) * 180 / Math.PI };
}
const nombreJoli = x => { const p = 10 ** Math.floor(Math.log10(x)), m = x / p; return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p; };

// Flèche dessinée en pixels, de (x, y) dans la direction (dx, dy) (repère écran), de longueur len
function fleche(x, y, dx, dy, len, col, ep = 2.5, cle, tirets) {
  const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, x2 = x + ux * len, y2 = y + uy * len;
  const t = Math.min(9, Math.max(4, len * 0.35)), w = t * 0.55;
  const bx = x2 - ux * t, by = y2 - uy * t;
  return <g key={cle}>
    {len > t && <line x1={x} y1={y} x2={bx} y2={by} stroke={col} strokeWidth={ep} strokeLinecap="round" strokeDasharray={tirets}/>}
    <path d={`M${x2},${y2} L${bx - uy * w},${by + ux * w} L${bx + uy * w},${by - ux * w} z`} fill={col}/></g>;
}

// Nom d'un vecteur dans le SVG, avec sa flèche dessinée au-dessus (la flèche combinante « ⃗ » ne s'affiche pas partout)
function etiquetteVec(x, y, txt, col, cle, taille = 14) {
  const w = taille * 0.42, h = y - taille * 0.95;
  return <g key={cle}><text x={x} y={y} textAnchor="middle" fontSize={taille} fontWeight="800" fill={col}>{txt}</text>
    <line x1={x - w} y1={h} x2={x + w - 2} y2={h} stroke={col} strokeWidth="1.4"/><path d={`M${x + w + 1},${h} l-4.5,-2.6 l0,5.2 z`} fill={col}/></g>;
}

// ---------- tirages des défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
function nouveauDefi(type) {
  if (type === 'signes') {
    const signe = tire([1, -1]), a = Math.random() * 2 * Math.PI, d = 0.08 + Math.random() * 0.06;
    return { type, Q: signe * tire([5, 10, 20, 30]), q: tire([1, -1]) * tire([1, 2, 3, 5]), x: d * Math.cos(a), y: d * Math.sin(a), reps: {}, verifie: false };
  }
  if (type === 'altitude') return { type, X: tire([1, 2, 3, 4, 5, 6]), reps: {}, verifie: false };
  let Q, E, dEt;
  do { Q = tire([5, 8, 12, -6, -10, -15]); E = tire([2000, 3000, 5000, 8000, 10000, 20000]); dEt = Math.sqrt(K * Math.abs(Q) * 1e-9 / E); }
  while (dEt < 0.04 || dEt > 0.18);
  return { type, Q, E, q: tire([1, -1]) * tire([1, 2, 3, 4]), reps: {}, verifie: false };
}
const TITRES_DEFIS = { signes: 'Charge mystère', altitude: 'Altitude cible', coulomb: 'Champ et force' };

// Volet du défi : monté seulement en mode défi, il enregistre essais, corrections vues et réussite sur le compte de l'élève
function VoletDefi({ defi, setDefi, changerType, placer }) {
  const cle = `${SIM}:defi.${defi.type}`;
  const res = (() => {
    if (!defi.verifie) return null;
    const r = defi.reps;
    if (defi.type === 'signes') {
      const okQ = r.signeQ === (defi.Q > 0 ? '+' : '-'), okE = r.sensE === (defi.Q > 0 ? 'centrifuge' : 'centripete');
      return { ok: okQ && okE, lignes: [[okQ, okQ ? 'Signe de Q correct.' : 'Signe de Q : regardez si la charge q est attirée vers Q ou repoussée, et tenez compte du signe de q.'],
        [okE, okE ? 'Sens du champ correct.' : 'Sens du champ : une charge positive crée un champ centrifuge, une charge négative un champ centripète.']] };
    }
    if (defi.type === 'altitude') {
      const h = lireNombre(r.h), d = RT + h * 1e3, g = G * MT / (d * d), dEt = Math.sqrt(G * MT / defi.X);
      const ok = isFinite(h) && h > 0 && Math.abs(g - defi.X) / defi.X <= 0.02;
      let msg = ok ? `Altitude correcte : à ${fmt(h, 0)}${NB}km, ${GRAV} = ${val(g)}${NB}N·kg⁻¹.` : !isFinite(h) ? 'Entrez une altitude en km.'
        : `À ${fmt(h, 0)}${NB}km d’altitude, ${GRAV} vaudrait ${val(g)}${NB}N·kg⁻¹, pas ${defi.X}${NB}N·kg⁻¹.`;
      if (!ok && isFinite(h) && proche(h * 1e3, dEt, 0.03)) msg += ' Vous avez trouvé d, la distance au centre : l’altitude se compte depuis le sol : h = d − 6 371 km.';
      else if (!ok && isFinite(h) && proche(h, dEt - RT, 0.03)) msg += ' C’est la bonne valeur, mais en mètres : l’altitude est demandée en km.';
      return { ok, g, h, lignes: [[ok, msg]] };
    }
    const dEt = Math.sqrt(K * Math.abs(defi.Q) * 1e-9 / defi.E), FEt = Math.abs(defi.q) * 1e-9 * defi.E;
    const d = lireNombre(r.d), F = lireNombre(r.F);
    const okD = isFinite(d) && proche(d * 1e-2, dEt, 0.02), okF = isFinite(F) && proche(F, FEt, 0.03);
    const attire = defi.Q * defi.q < 0, okS = r.sensF === (attire ? 'vers' : 'loin');
    let mD = okD ? 'Distance correcte.' : 'Distance : isolez d dans E = k·|Q| / d², puis d = √(k·|Q| / E), avec Q en coulombs.';
    if (!okD && isFinite(d) && proche(d, dEt, 0.02)) mD = 'C’est la bonne valeur, mais en mètres : la distance est demandée en cm.';
    let mF = okF ? 'Force correcte.' : 'Force : F = |q| × E, avec q en coulombs (1 nC = 10⁻⁹ C).';
    if (!okF && isFinite(F) && proche(F, FEt * 1e9, 0.03)) mF = 'Convertissez q en coulombs : 1 nC = 10⁻⁹ C.';
    if (!okF && isFinite(F) && F < 0) mF = 'La norme d’une force est positive : F = |q| × E.';
    return { ok: okD && okF && okS, lignes: [[okD, mD], [okF, mF],
      [okS, okS ? 'Sens correct.' : 'Sens : des charges de même signe se repoussent, des charges de signes opposés s’attirent.']] };
  })();
  const reussi = !!res && res.ok;
  const suivi = useSuivi(cle, reussi);
  const solution = !!defi.solution;
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const verifier = () => {
    suivi.essai();
    setDefi(d => ({ ...d, verifie: true }));
    if (defi.type === 'altitude') { const h = lireNombre(defi.reps.h); if (isFinite(h) && h > 0) placer({ x: 0, y: RT + h * 1e3 }); }
    if (defi.type === 'coulomb') { const d = lireNombre(defi.reps.d); if (isFinite(d) && d > 0) placer({ x: Math.min(0.185, d * 1e-2), y: 0 }); }
  };
  const voirSolution = () => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); };
  const prog = lireProgression();
  const choix = (k, options) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{options.map(([v, l]) =>
      <button key={v} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>);
  const saisie = (k, unite, lab) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14 }}>
      <span>{lab}</span>
      <input value={defi.reps[k] ?? ''} aria-label={lab} onChange={e => rep(k, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verifier(); }}
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const dEt = defi.type === 'coulomb' ? Math.sqrt(K * Math.abs(defi.Q) * 1e-9 / defi.E) : 0;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES_DEFIS).map(([t, l]) =>
          <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}
      </div>
      {defi.type === 'signes' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : la charge mystère</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Une boule porte une charge Q dont on ne connaît pas le signe (au centre, en gris). On place en M une charge test <strong>q = {nC(defi.q)}</strong> :
          la flèche rouge montre la force <Vec>F</Vec> qu’elle subit. Retrouvez le signe de Q, puis le sens du champ <Vec>E</Vec> que Q crée en M.</div>
        <div style={{ fontSize: 14, fontWeight: 700, margin: '4px 0' }}>Signe de la charge Q</div>
        {choix('signeQ', [['+', 'Q > 0'], ['-', 'Q < 0']])}
        <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>Le champ <Vec>E</Vec> créé par Q en M est…</div>
        {choix('sensE', [['centrifuge', 'centrifuge (s’éloigne de Q)'], ['centripete', 'centripète (dirigé vers Q)']])}
      </>}
      {defi.type === 'altitude' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : à quelle altitude {GRAV} = {defi.X}{NB}N·kg⁻¹ ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Un satellite doit être placé là où le champ de gravitation terrestre vaut <strong>{defi.X}{NB}N·kg⁻¹</strong>. Calculez son <strong>altitude</strong> (comptée depuis le sol) :
          la simulation le placera à l’altitude proposée. Données : G = 6,674 × 10⁻¹¹ N·m²·kg⁻², M<sub>T</sub> = 5,972 × 10²⁴ kg, R<sub>T</sub> = 6 371 km.</div>
        {saisie('h', 'km', 'Altitude h')}
      </>}
      {defi.type === 'coulomb' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : champ et force autour d’une charge</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          La boule porte la charge <strong>Q = {nC(defi.Q)}</strong>. 1. À quelle distance de son centre le champ vaut-il <strong>E = {fmt(defi.E, 0)}{NB}N·C⁻¹</strong> ?
          2. On place à cet endroit une charge <strong>q = {nC(defi.q)}</strong> : quelle est la norme de la force qu’elle subit, et dans quel sens est-elle dirigée ?
          Donnée : k = 9,0 × 10⁹ N·m²·C⁻².</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saisie('d', 'cm', 'Distance d')}
          {saisie('F', 'N', 'Norme de la force F')}
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>La force subie par q est dirigée…</div>
          {choix('sensF', [['vers', 'vers Q (attraction)'], ['loin', 'à l’opposé de Q (répulsion)']])}
        </div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <button onClick={verifier} style={styleBouton(true, VERT)}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau défi</button>
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
        {res.lignes.map(([ok, t], i) => <div key={i} style={{ color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✓' : '✗'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', marginTop: 4 }}>🎉 Défi réussi !</div>}
        {!res.ok && !solution && <button onClick={voirSolution} style={{ marginTop: 4, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>}
      {solution && <div style={{ ...styleBoite, marginTop: 8, fontSize: 13.5, lineHeight: 1.6, background: '#fffbeb', borderColor: '#fcd34d' }}>
        {defi.type === 'signes' && <>La charge q = {nC(defi.q)} est {defi.Q * defi.q > 0 ? 'repoussée par' : 'attirée vers'} Q : les deux charges sont donc
          {defi.Q * defi.q > 0 ? ' de même signe' : ' de signes opposés'}, et Q {defi.Q > 0 ? '> 0' : '< 0'}. Le champ créé par Q est alors {defi.Q > 0 ? 'centrifuge' : 'centripète'}.</>}
        {defi.type === 'altitude' && (() => { const d = Math.sqrt(G * MT / defi.X); return <>
          {GRAV} = <Frac haut="G·M_T" bas="d²"/> donc d = √(G·M<sub>T</sub> / {GRAV}) = √(6,674 × 10⁻¹¹ × 5,972 × 10²⁴ / {defi.X}) = {puiss(d)}{NB}m,
          puis h = d − R<sub>T</sub> = {puiss(d)} − 6,371 × 10⁶ = {puiss(d - RT)}{NB}m ≈ {fmt((d - RT) / 1e3, 0)}{NB}km.</>; })()}
        {defi.type === 'coulomb' && <>
          E = <Frac haut="k·|Q|" bas="d²"/> donc d = √(k·|Q| / E) = √(9,0 × 10⁹ × {fmt(Math.abs(defi.Q), 0)} × 10⁻⁹ / {fmt(defi.E, 0)}) = {puiss(dEt)}{NB}m ≈ {fmt(dEt * 100, 1)}{NB}cm.
          {' '}F = |q| × E = {fmt(Math.abs(defi.q), 0)} × 10⁻⁹ × {fmt(defi.E, 0)} = {puiss(Math.abs(defi.q) * 1e-9 * defi.E)}{NB}N.
          {' '}Q et q sont {defi.Q * defi.q > 0 ? 'de même signe : la force est répulsive' : 'de signes opposés : la force est attractive'}.</>}
      </div>}
    </div>);
}

export function SimulationChampForce() {
  const [mode, setMode] = useState(() => modeOuverture('champ-force-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('champ-force-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [src, setSrc] = useState('terre');                    // 'terre', 'plus' (Q > 0) ou 'moins' (Q < 0)
  const [z, setZ] = useState(0);
  const [posT, setPosT] = useState({ x: RT * 0.9, y: RT * 1.2 });
  const [posC, setPosC] = useState({ x: 0.10, y: 0.04 });
  const [m, setM] = useState(1);
  const [Qabs, setQabs] = useState(10);
  const [q, setQ] = useState(2);
  const [aff, setAff] = useState({ grille: true, lignes: true, u: false });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const svgRef = useRef(null), glisse = useRef(false);

  const terre = src === 'terre';
  const Qn = enDefi && defi.type !== 'altitude' ? defi.Q : (src === 'moins' ? -Qabs : Qabs);   // nC, signé
  const Qc = Qn * 1e-9;
  const qn = enDefi && defi.type !== 'altitude' ? defi.q : q;
  const vue = terre ? vueTerre(z) : VUE_CHARGE;
  const pos = terre ? posT : posC;
  const cM = champ(src, Qc, pos.x, pos.y);
  const F = terre ? m * cM.n : Math.abs(qn) * 1e-9 * cM.n;
  const { pts, ref } = useMemo(() => grille(src, Qc, src === 'terre' ? vueTerre(z) : VUE_CHARGE), [src, Qc, z]);
  const unif = terre ? uniformite(pts) : null;
  const hAlt = cM.d - RT;

  // ce que le défi cache
  const cache = enDefi ? { valeurs: true, champM: true, grille: defi.type === 'signes', lignes: defi.type === 'signes', signe: defi.type === 'signes' } : {};

  // ---------- placement de l'objet ----------
  function placer(p, s = src) {
    let { x, y } = p;
    if (s === 'terre') {
      const d = Math.hypot(x, y);
      if (d < RT) { const k = d > 1 ? RT / d : 1; x = d > 1 ? x * k : 0; y = d > 1 ? y * k : RT; }
      setPosT({ x, y });
    } else {
      x = Math.max(-0.19, Math.min(0.19, x)); y = Math.max(-0.14, Math.min(0.14, y));
      const d = Math.hypot(x, y), dmin = R0 + 0.006;
      if (d < dmin) { const k = d > 1e-9 ? dmin / d : 1; x = d > 1e-9 ? x * k : dmin; y = d > 1e-9 ? y * k : 0; }
      setPosC({ x, y });
    }
  }
  const versScene = e => {
    const rc = svgRef.current.getBoundingClientRect(), k = W0 / rc.width;
    return versMonde(vue, (e.clientX - rc.left) * k, (e.clientY - rc.top) * k);
  };
  function changerZoom(nz) {
    setZ(nz);
    const v = vueTerre(nz), [px, py] = versPx(v, posT.x, posT.y);
    if (!dansVue(px, py, 14)) setPosT({ x: 0, y: Math.max(RT, v.yc + 0.25 * v.H) });
  }
  function choisirSource(s) {
    setSrc(s);
    if (s !== 'terre' && Math.hypot(posC.x, posC.y) < R0 + 0.006) setPosC({ x: 0.10, y: 0.04 });
  }

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const g2 = G * MT / (2 * RT) ** 2, gSol = G * MT / RT ** 2;
  const a2R = terre && Math.abs(cM.d / RT - 2) < 0.03;
  const enSalle = terre && vue.H < 100;
  const auSol = terre && hAlt < 1000;
  const a10 = !terre && src === 'plus' && Qabs === 10 && Math.abs(cM.d - 0.10) < 0.003;
  const E10 = K * 10e-9 / 0.01;
  const ETAPES = [
    { id: 'idee', titre: 'Une action à distance… et un champ', focus: ['scene'],
      texte: <>La Terre attire la Lune, un satellite, une pomme, sans les toucher. Pour décrire cette action à distance, on dit que la Terre (de masse M<sub>T</sub>) crée
        <strong> en chaque point de l’espace</strong> un <strong>champ de gravitation</strong> <Vec>{GRAV}</Vec>. Les flèches grises le représentent en différents points ;
        le petit disque M est un objet que vous pouvez déplacer (glisser ou cliquer).</>,
      tache: { type: 'qcm', q: 'Le champ de gravitation créé par la Terre est…', options: ['un vecteur défini en chaque point de l’espace : direction, sens et norme', 'une force, qui n’existe que si un objet est présent', 'un nombre, sans direction'], bonne: 0,
        expl: 'Le champ existe en chaque point, qu’il y ait un objet ou non : c’est un vecteur (direction, sens, norme). Un objet placé en ce point « ressent » ce champ et subit alors une force.' } },
    { id: 'sens', titre: 'Direction et sens du champ', focus: ['scene'],
      texte: <>Observez les flèches grises tout autour de la Terre.</>,
      tache: { type: 'qcm', q: `En chaque point, le vecteur ${GRAV} est dirigé…`, options: ['vers le centre O de la Terre : le champ est centripète', 'vers l’extérieur : le champ est centrifuge', 'toujours vers le bas de l’écran'], bonne: 0,
        expl: `Le vecteur ${GRAV} est porté par la droite (OM) et dirigé vers le centre de la Terre. « Vers le bas » n’est vrai que localement, à la surface.` } },
    { id: 'placer2R', titre: 'Placer un objet', focus: ['scene', 'reglages'],
      texte: <>Placez l’objet à la distance <strong>d = 2 R<sub>T</sub></strong> du centre de la Terre, soit à environ 12 740 km (lisez « Distance au centre » dans les mesures).</>,
      tache: { type: 'action', ok: a2R, label: 'Placer l’objet à deux rayons terrestres', faire: () => { setSrc('terre'); setZ(0); setPosT({ x: 0, y: 2 * RT }); },
        consigne: 'Faites glisser l’objet M jusqu’à d = 2 R_T' } },
    { id: 'valeur2R', titre: 'Norme du champ', focus: ['mesures', 'calcul'],
      texte: <>La norme du champ de gravitation à la distance d du centre de la Terre est <strong>{GRAV} = G·M<sub>T</sub> / d²</strong>. Lisez-la dans « Mesures » (le calcul détaillé est juste en dessous).</>,
      tache: { type: 'num', q: `Norme de ${GRAV} à d = 2 R_T`, unite: 'N·kg⁻¹', vrai: g2, tol: 0.03, affiche: v => val(v), cs: 2,
        bloque: a2R ? null : 'Placez d’abord l’objet à d = 2 R_T (étape précédente).',
        pieges: [[gSol / 2, 'Le champ n’est pas divisé par 2 quand la distance double : il varie en 1/d².']],
        expl: `${GRAV} = G·M_T / (2 R_T)² ≈ ${val(g2)} N·kg⁻¹, quatre fois moins qu’au sol (9,82 N·kg⁻¹).` } },
    { id: 'loi', titre: 'Comment varie le champ ?', focus: ['scene', 'mesures'],
      texte: <>Déplacez l’objet à <strong>4 R<sub>T</sub></strong> (environ 25 500 km) et comparez.</>,
      tache: { type: 'qcm', q: `Quand la distance au centre double, la norme de ${GRAV} est…`, options: ['divisée par 4', 'divisée par 2', 'inchangée'], bonne: 0,
        expl: `${GRAV} = G·M_T / d² : si d est multiplié par 2, d² est multiplié par 4, donc ${GRAV} est divisé par 4 (2,45 → 0,61 N·kg⁻¹).` } },
    { id: 'lignes', titre: 'Les lignes de champ', focus: ['scene'],
      texte: <>Une <strong>ligne de champ</strong> est une courbe qui donne, en chaque point, la direction et le sens du champ. Autour de la Terre, ce sont des demi-droites
        qui convergent vers son centre (traits bleus fléchés).</>,
      tache: { type: 'qcm', q: `En un point, le vecteur ${GRAV} est…`, options: ['tangent à la ligne de champ qui passe par ce point, et orienté dans son sens', 'perpendiculaire à la ligne de champ', 'sans rapport avec les lignes de champ'], bonne: 0,
        expl: 'Le vecteur champ est tangent aux lignes de champ, qui sont orientées dans le sens du champ.' } },
    { id: 'zoom', titre: 'Zoomer jusqu’à la salle de classe', focus: ['reglages', 'scene'],
      texte: <>Avec le curseur « Zoom », rapprochez-vous de la surface jusqu’à voir une <strong>salle de classe</strong> (une vue de moins de 100 m de haut). Regardez les flèches pendant le zoom.</>,
      tache: { type: 'action', ok: enSalle, label: 'Zoomer sur la salle de classe', faire: () => { setSrc('terre'); setZ(1); setPosT({ x: 0, y: RT + 1.2 }); },
        consigne: 'Zoomez jusqu’à la salle de classe' } },
    { id: 'uniforme', titre: 'Un champ localement uniforme', focus: ['scene', 'uniformite'],
      texte: <>Dans la salle, les flèches semblent identiques. Le cadre « Uniformité » chiffre les écarts entre les vecteurs de la vue.</>,
      tache: { type: 'qcm', q: `À l’échelle de la salle, les vecteurs ${GRAV}…`, options: ['ont la même direction, le même sens et la même norme : le champ est uniforme', 'pointent dans des directions très différentes', 'sont nuls'], bonne: 0,
        expl: 'Sur quelques mètres, les écarts sont infimes (environ 10⁻⁴ % pour la norme, moins de 10⁻⁴ ° pour la direction) : on dit que le champ de pesanteur est localement uniforme. À l’échelle de la Terre, il ne l’est pas du tout.' } },
    { id: 'g', titre: 'L’intensité de la pesanteur', focus: ['mesures'],
      texte: <>Près du sol, le champ de gravitation terrestre est appelé <strong>champ de pesanteur</strong> <Vec>g</Vec>. Lisez sa norme g au niveau de la salle.</>,
      tache: { type: 'num', q: 'Norme g du champ de pesanteur au sol (d’après le modèle)', unite: 'N·kg⁻¹', vrai: gSol, tol: 0.01, affiche: v => val(v), cs: 3,
        bloque: auSol ? null : 'Placez l’objet près du sol (étape précédente).',
        expl: 'g = G·M_T / R_T² ≈ 9,82 N·kg⁻¹. La valeur mesurée à Paris (9,81) est un peu plus faible : le modèle néglige la rotation de la Terre et sa forme aplatie.' } },
    { id: 'poids', titre: 'Le poids', focus: ['reglages', 'mesures'],
      texte: <>Un objet de masse m placé dans ce champ subit la force <Vec>F</Vec> = m·<Vec>g</Vec> : c’est son <strong>poids</strong> <Vec>P</Vec>. Réglez la masse sur 60 kg.</>,
      tache: { type: 'num', q: 'Poids d’un élève de 60 kg', unite: 'N', vrai: 60 * gSol, tol: 0.02, affiche: v => fmt(v, 0), cs: 3,
        pieges: [[60, 'Le poids est une force, en newton : P = m × g.'], [60 / gSol, 'On multiplie : P = m × g.']],
        expl: `P = m × g = 60 × 9,82 ≈ ${fmt(60 * gSol, 0)} N, dirigé vers le centre de la Terre (verticale, vers le bas).` } },
    { id: 'plus', titre: 'Une charge électrique crée aussi un champ', focus: ['reglages', 'scene'],
      texte: <>De même, un corps de charge Q crée en chaque point un <strong>champ électrostatique</strong> <Vec>E</Vec>. Choisissez la source « Charge Q {'>'} 0 ».</>,
      tache: { type: 'action', ok: src === 'plus', label: 'Choisir Q > 0', faire: () => { choisirSource('plus'); setQabs(10); setQ(2); },
        consigne: 'Choisissez la source « Charge Q > 0 »' } },
    { id: 'centrifuge', titre: 'Le champ d’une charge positive', focus: ['scene'],
      texte: <>Observez les flèches et les lignes de champ.</>,
      tache: { type: 'qcm', q: 'Le champ créé par une charge Q > 0 est…', options: ['centrifuge : il part de la charge vers l’extérieur', 'centripète : dirigé vers la charge', 'nul en dehors de la boule'], bonne: 0,
        expl: 'Une charge positive crée un champ centrifuge : les lignes de champ partent de la charge.' } },
    { id: 'moins', titre: 'Et une charge négative ?', focus: ['reglages', 'scene'],
      texte: <>Choisissez maintenant la source « Charge Q {'<'} 0 ».</>,
      tache: { type: 'action', ok: src === 'moins', label: 'Choisir Q < 0', faire: () => choisirSource('moins'), consigne: 'Choisissez la source « Charge Q < 0 »' } },
    { id: 'centripete', titre: 'Le champ d’une charge négative', focus: ['scene'],
      texte: <>Comparez avec le cas précédent. Changez aussi le signe de la charge test q : le champ change-t-il ?</>,
      tache: { type: 'qcm', q: 'Le champ créé par une charge Q < 0…', options: ['est centripète (dirigé vers la charge), quel que soit le signe de q', 'est centrifuge', 'change de sens selon le signe de la charge q placée en M'], bonne: 0,
        expl: 'Les lignes de champ arrivent sur une charge négative. Le champ ne dépend que de la source Q et du point M, pas de la charge q placée en M.' } },
    { id: 'placer10', titre: 'Calculer un champ électrostatique', focus: ['reglages', 'scene'],
      texte: <>Reprenez <strong>Q = +10 nC</strong> et placez la charge test à <strong>10 cm</strong> du centre de la boule.</>,
      tache: { type: 'action', ok: a10, label: 'Q = +10 nC, q à 10 cm', faire: () => { setSrc('plus'); setQabs(10); setPosC({ x: 0.10, y: 0 }); },
        consigne: 'Source Q > 0 réglée sur 10 nC, charge test à 10,0 cm' } },
    { id: 'calculE', titre: 'La norme de E', focus: ['calcul'],
      texte: <>La norme du champ électrostatique est <strong>E = k·|Q| / d²</strong>, avec k = 9,0 × 10⁹ N·m²·C⁻². Faites le calcul vous-même (Q en coulombs, d en mètres) avant de lire la mesure.</>,
      tache: { type: 'num', q: 'Norme de E à 10 cm de Q = +10 nC', unite: 'N·C⁻¹', vrai: E10, tol: 0.02, affiche: v => fmt(v, 0),
        bloque: a10 ? null : 'Revenez à Q = +10 nC avec la charge test à 10 cm (étape précédente).',
        pieges: [[0.9, 'Convertissez d en mètres : 10 cm = 10 × 10⁻² m.'], [9e12, 'Convertissez Q en coulombs : 10 nC = 10 × 10⁻⁹ C.'], [900, 'N’oubliez pas le carré : d² = (10 × 10⁻² m)² = 10⁻² m².']],
        expl: 'E = 9,0 × 10⁹ × 10 × 10⁻⁹ / (10 × 10⁻²)² = 90 / 10⁻² = 9,0 × 10³ N·C⁻¹.' } },
    { id: 'qneg', titre: 'Une charge test négative', focus: ['reglages', 'scene', 'vecteurs'],
      texte: <>Réglez la charge test sur <strong>q = −2 nC</strong>. Comparez les flèches <Vec>E</Vec> (vert) et <Vec>F</Vec> (rouge) en M.</>,
      tache: { type: 'action', ok: !terre && q === -2, label: 'Régler q = −2 nC', faire: () => { if (terre) choisirSource('plus'); setQ(-2); }, consigne: 'Curseur « charge test q » sur −2 nC' } },
    { id: 'sensF', titre: 'Sens de la force', focus: ['vecteurs'],
      texte: <>La force subie par la charge q placée dans le champ est <Vec>F</Vec> = q·<Vec>E</Vec>.</>,
      tache: { type: 'qcm', q: 'Pour q < 0, la force F = q·E est…', options: ['de sens opposé à E', 'de même sens que E', 'perpendiculaire à E'], bonne: 0,
        expl: 'q < 0 : F = q·E est colinéaire à E mais de sens opposé. Si q > 0, F et E ont le même sens.' } },
    { id: 'normeF', titre: 'Norme de la force', focus: ['calcul'],
      texte: <>Calculez la norme de la force : <strong>F = |q|·E</strong>.</>,
      tache: { type: 'num', q: 'Norme de la force sur q = −2 nC à 10 cm de Q = +10 nC', unite: 'N', vrai: 2e-9 * E10, tol: 0.03, affiche: v => puiss(v, 2), cs: 2,
        bloque: a10 && q === -2 ? null : 'Il faut Q = +10 nC, la charge test à 10 cm et q = −2 nC (étapes précédentes).',
        pieges: [[-2e-9 * E10, 'La norme d’une force est positive : F = |q| × E.'], [2 * E10, 'Convertissez q en coulombs : 2 nC = 2 × 10⁻⁹ C.']],
        expl: 'F = |q| × E = 2 × 10⁻⁹ × 9,0 × 10³ = 1,8 × 10⁻⁵ N.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>un champ est défini en chaque point : <Vec>{GRAV}</Vec> = −(G·M / d²)·<Vec>u</Vec> et <Vec>E</Vec> = (k·Q / d²)·<Vec>u</Vec></li>
        <li><Vec>{GRAV}</Vec> est centripète ; <Vec>E</Vec> est centrifuge si Q {'>'} 0, centripète si Q {'<'} 0</li>
        <li>le champ est tangent aux lignes de champ ; le champ de pesanteur est uniforme à l’échelle locale</li>
        <li><Vec>F</Vec> = m·<Vec>{GRAV}</Vec> (poids <Vec>P</Vec> = m·<Vec>g</Vec>) et <Vec>F</Vec> = q·<Vec>E</Vec> (même sens que <Vec>E</Vec> si q {'>'} 0, opposé si q {'<'} 0)</li></ul>,
      texte: <>Vous savez décrire un champ de gravitation et un champ électrostatique, et en déduire la force subie par un objet. Essayez maintenant les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function lancerDefi(type) {
    const d = nouveauDefi(type);
    setDefi(d);
    if (type === 'altitude') { setSrc('terre'); setZ(0); setPosT({ x: RT * 0.9, y: RT * 1.2 }); }
    else { setSrc(d.Q > 0 ? 'plus' : 'moins'); setQabs(Math.abs(d.Q)); setPosC(type === 'signes' ? { x: d.x, y: d.y } : { x: -0.15, y: 0.10 }); }
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) lancerDefi('signes');
    else if (md === 'defi') lancerDefi(defi.type);
    if (md === 'guide') {                       // la scène doit correspondre à l'étape où l'on reprend
      const i = guide.etape, iCharges = ETAPES.findIndex(e => e.id === 'plus');
      if (i < iCharges) {
        setSrc('terre');
        if (i <= 3) { setZ(0); setPosT({ x: RT * 0.9, y: RT * 1.2 }); }
        else if (i >= 7) { setZ(1); setPosT({ x: 0, y: RT + 1.2 }); }
        else setZ(0);
      } else { setSrc('plus'); setQabs(10); setPosC({ x: 0.10, y: 0 }); if (i < iCharges + 7) setQ(2); }
    }
  }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNE ════════════════
  const [ox, oy] = versPx(vue, 0, 0);
  const [mx, my] = versPx(vue, pos.x, pos.y);
  const colChamp = '#94a3b8';
  const svgGrille = (aff.grille && !cache.grille) ? pts.map((p, i) => {
    const len = Math.max(2.5, LMAX * p.c.n / ref);
    return fleche(p.px, p.py, p.c.vx, -p.c.vy, len, colChamp, 2, `g${i}`);
  }) : null;

  // lignes de champ
  let svgLignes = null;
  if (aff.lignes && !cache.lignes) {
    const L = [];
    if (terre) {
      const coins = [[0, 0], [W0, 0], [0, H0], [W0, H0]].map(([px, py]) => versMonde(vue, px, py));
      const oDans = ox >= 0 && ox <= W0 && oy >= 0 && oy <= H0;
      let a1 = -Math.PI, a2 = Math.PI;
      if (!oDans) { const a = coins.map(([x, y]) => Math.atan2(x, y)); a1 = Math.min(...a); a2 = Math.max(...a); }
      const dist = coins.map(([x, y]) => Math.hypot(x, y)), dMax = Math.max(...dist);
      const xs = [versMonde(vue, 0, 0)[0], versMonde(vue, W0, 0)[0]], ys = [versMonde(vue, 0, H0)[1], versMonde(vue, 0, 0)[1]];
      const dMin = oDans ? 0 : Math.hypot(Math.max(xs[0], Math.min(0, xs[1])), Math.max(ys[0], Math.min(0, ys[1])));
      const etendue = a2 - a1, base = 2 * Math.PI / 24;
      const niv = Math.max(0, Math.ceil(Math.log2(8 * base / Math.max(etendue, 1e-12))));
      const pas = base / 2 ** niv;
      const r1 = Math.max(RT, dMin), r2 = dMax;
      for (let k = Math.ceil(a1 / pas); k * pas <= a2 && L.length < 40; k++) {
        const a = k * pas, sx = Math.sin(a), sy = Math.cos(a);
        const [x1, y1] = versPx(vue, r1 * sx, r1 * sy), [x2, y2] = versPx(vue, r2 * sx, r2 * sy);
        const rm = r1 + (r2 - r1) * (oDans ? 0.55 : 0.5), [xm, ym] = versPx(vue, rm * sx, rm * sy);
        L.push(<g key={`l${k}`}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BLEU} strokeWidth="1.2" opacity="0.45"/>
          {fleche(xm, ym, -sx, sy, 10, BLEU, 1.2, `fl${k}`)}</g>);
      }
    } else {
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * 2 * Math.PI, sx = Math.cos(a), sy = Math.sin(a), sens = Qn > 0 ? 1 : -1;
        const [x1, y1] = versPx(vue, R0 * sx, R0 * sy), [x2, y2] = versPx(vue, 0.5 * sx, 0.5 * sy);
        L.push(<g key={`l${k}`}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={BLEU} strokeWidth="1.2" opacity="0.45"/>
          {[0.055, 0.15].map(r => { const [xa, ya] = versPx(vue, r * sx, r * sy); return fleche(xa, ya, sens * sx, -sens * sy, 10, BLEU, 1.2, `f${k}${r}`); })}</g>);
      }
    }
    svgLignes = L;
  }

  // la source
  let svgSource;
  if (terre) {
    const R = RT * vue.s;
    let terreSvg;
    if (R < 4000) terreSvg = <circle cx={ox} cy={oy} r={R} fill="#d9f99d" stroke="#3f6212" strokeWidth="2"/>;
    else {
      const W = vue.H * W0 / H0, Phi = Math.min(Math.PI, 1.6 * W / RT), P = [];
      for (let i = 0; i <= 120; i++) { const f = -Phi + 2 * Phi * i / 120; P.push(versPx(vue, RT * Math.sin(f), RT * Math.cos(f))); }
      const d = P.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
      terreSvg = <path d={`${d} L${P[120][0].toFixed(1)},${H0 + 4000} L${P[0][0].toFixed(1)},${H0 + 4000} z`} fill="#d9f99d" stroke="#3f6212" strokeWidth="2"/>;
    }
    const iss = RT + 4.08e5, Riss = iss * vue.s;
    const [, ySol] = versPx(vue, 0, RT);
    // un élève de 1,70 m, à gauche, quand la vue est assez petite pour qu'on le voie
    const pers = vue.H < 120 && (() => {
      const h = 1.7 * vue.s, [xb] = versPx(vue, -0.32 * vue.H * W0 / H0, 0);
      return <g stroke="#0f172a" strokeWidth={Math.max(1.5, h / 25)} fill="none" strokeLinecap="round">
        <circle cx={xb} cy={ySol - h * 0.9} r={h * 0.1}/><line x1={xb} y1={ySol - h * 0.8} x2={xb} y2={ySol - h * 0.4}/>
        <line x1={xb} y1={ySol - h * 0.4} x2={xb - h * 0.12} y2={ySol}/><line x1={xb} y1={ySol - h * 0.4} x2={xb + h * 0.12} y2={ySol}/>
        <line x1={xb - h * 0.17} y1={ySol - h * 0.68} x2={xb + h * 0.17} y2={ySol - h * 0.6}/></g>;
    })();
    svgSource = <g>
      {Riss < 4000 && Riss > 80 && <circle cx={ox} cy={oy} r={Riss} fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="5 4" opacity="0.7"/>}
      {terreSvg}
      {R < 4000 && R > 6 && <><circle cx={ox} cy={oy} r="3" fill="#0f172a"/><text x={ox + 6} y={oy - 5} fontSize="13" fontWeight="700" fill="#0f172a">O</text></>}
      {R < 4000 && R > 25 && <text x={ox} y={oy + Math.min(R * 0.5, 40) + 14} textAnchor="middle" fontSize="13" fontWeight="700" fill="#3f6212">Terre</text>}
      {R >= 4000 && ySol < H0 && <text x={W0 - 12} y={Math.min(H0 - 8, ySol + 18)} textAnchor="end" fontSize="13" fontWeight="700" fill="#3f6212">sol (le centre O est {fmt(RT / 1e3, 0)} km plus bas)</text>}
      {Riss < 4000 && Riss > 80 && oy - Riss > 14 && <text x={ox} y={oy - Riss - 5} textAnchor="middle" fontSize="11" fill="#7e22ce">orbite de l’ISS (400 km d’altitude)</text>}
      {pers}
    </g>;
  } else {
    const r = R0 * vue.s, inconnue = cache.signe;
    const col = inconnue ? '#94a3b8' : Qn > 0 ? ROUGE : BLEU;
    svgSource = <g>
      <circle cx={ox} cy={oy} r={r} fill={col} stroke="#0f172a" strokeWidth="1.5"/>
      <text x={ox} y={oy + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="white">{inconnue ? '?' : Qn > 0 ? '+' : '−'}</text>
      <text x={ox} y={oy + r + 16} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">{inconnue ? 'Q = ?' : `Q = ${nC(Qn)}`}</text>
    </g>;
  }
  // échelle
  const Wm = vue.H * W0 / H0, lg = nombreJoli(Wm * 0.2), lgPx = lg * vue.s;
  const lgTxt = lg >= 1e3 ? `${fmt(lg / 1e3, 0)} km` : lg >= 1 ? `${fmt(lg, 0)} m` : `${fmt(lg * 100, 0)} cm`;
  const echelle = <g><line x1={W0 - 16 - lgPx} y1={20} x2={W0 - 16} y2={20} stroke="#0f172a" strokeWidth="2"/>
    <line x1={W0 - 16 - lgPx} y1={15} x2={W0 - 16 - lgPx} y2={25} stroke="#0f172a" strokeWidth="2"/><line x1={W0 - 16} y1={15} x2={W0 - 16} y2={25} stroke="#0f172a" strokeWidth="2"/>
    <text x={W0 - 16 - lgPx / 2} y={40} textAnchor="middle" fontSize="12" fill="#0f172a">{lgTxt}</text></g>;

  // l'objet en M, le champ et la force en M
  const lenM = Math.min(90, Math.max(6, LMAX * cM.n / (ref || cM.n)));
  const dxs = cM.vx, dys = -cM.vy, nn = Math.hypot(dxs, dys) || 1;
  const off = 7, pxo = -dys / nn * off, pyo = dxs / nn * off;
  const sensF = terre ? 1 : Math.sign(qn);
  const lenF = cache.valeurs ? 46 : lenM;
  const objet = <g>
    {aff.u && !cache.champM && fleche(mx, my, cM.ux, -cM.uy, 38, BLEU, 2.5, 'u')}
    {aff.u && !cache.champM && etiquetteVec(mx + cM.ux * 50, my - cM.uy * 50 + 5, 'u', BLEU, 'eu', 13)}
    {!cache.champM && fleche(mx - pxo, my - pyo, dxs, dys, lenM, VERT, 3, 'cm')}
    {!cache.champM && etiquetteVec(mx - pxo * 2.2 + dxs / nn * (lenM + 12), my - pyo * 2.2 + dys / nn * (lenM + 12) + 5, terre ? GRAV : 'E', VERT, 'ec')}
    {sensF !== 0 && fleche(mx + pxo, my + pyo, sensF * dxs, sensF * dys, lenF, ROUGE, 3, 'f')}
    {sensF !== 0 && etiquetteVec(mx + pxo * 2.2 + sensF * dxs / nn * (lenF + 12), my + pyo * 2.2 + sensF * dys / nn * (lenF + 12) + 5, 'F', ROUGE, 'ef')}
    {terre ? <circle cx={mx} cy={my} r="7" fill="#334155" stroke="white" strokeWidth="1.5"/>
      : <><circle cx={mx} cy={my} r="9" fill={qn > 0 ? ROUGE : qn < 0 ? BLEU : '#94a3b8'} stroke="white" strokeWidth="1.5"/>
        <text x={mx} y={my + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill="white">{qn > 0 ? '+' : qn < 0 ? '−' : '0'}</text></>}
    <text x={mx - dxs / nn * 18 * (sensF < 0 ? -1 : 1) + (sensF < 0 ? pxo * 2.6 : 0)} y={my - dys / nn * 18 * (sensF < 0 ? -1 : 1) + (sensF < 0 ? pyo * 2.6 : 0) + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">M</text>
  </g>;

  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <svg ref={svgRef} viewBox={`0 0 ${W0} ${H0}`} style={{ width: '100%', display: 'block', touchAction: 'none', background: terre ? '#f8fafc' : '#fafaf9', borderRadius: 8, cursor: 'crosshair' }}
        onPointerDown={e => { glisse.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); placer({ x: versScene(e)[0], y: versScene(e)[1] }); }}
        onPointerMove={e => { if (glisse.current) { const [x, y] = versScene(e); placer({ x, y }); } }}
        onPointerUp={() => { glisse.current = false; }} onPointerCancel={() => { glisse.current = false; }}
        role="img" aria-label={terre ? 'La Terre, son champ de gravitation et un objet M que l’on peut déplacer' : 'Une boule chargée, son champ électrostatique et une charge test M que l’on peut déplacer'}>
        {svgLignes}{svgSource}{svgGrille}{objet}{echelle}
      </svg>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        Cliquez ou faites glisser pour déplacer M. <span style={{ color: '#64748b', fontWeight: 700 }}>Flèches grises</span> : le champ en différents points (à l’échelle dans cette vue).
        {' '}<span style={{ color: BLEU, fontWeight: 700 }}>Traits bleus</span> : lignes de champ. <span style={{ color: VERT, fontWeight: 700 }}>Vert</span> : le champ en M.
        {' '}<span style={{ color: ROUGE, fontWeight: 700 }}>Rouge</span> : la force subie par {terre ? 'l’objet' : 'la charge q'} (même direction ; sa longueur n’est pas à l’échelle du champ).
      </div>
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const zoomTxt = `vue de ${longueur(vue.H)} de haut`;
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <><div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Source du champ</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={() => choisirSource('terre')} style={stylePetitBouton(src === 'terre', '#3f6212')}>🌍 Terre (masse)</button>
          <button onClick={() => choisirSource('plus')} style={stylePetitBouton(src === 'plus', ROUGE)}>➕ Charge Q {'>'} 0</button>
          <button onClick={() => choisirSource('moins')} style={stylePetitBouton(src === 'moins', BLEU)}>➖ Charge Q {'<'} 0</button>
        </div></>}
      {terre && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>Zoom</span><span style={{ color: KIT.txt }}>{zoomTxt}</span></div>
        <input type="range" min={0} max={1} step={0.002} value={z} onChange={e => changerZoom(parseFloat(e.target.value))} aria-label="Zoom" style={{ width: '100%', accentColor: '#3f6212' }}/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          {[['Terre entière', 0], ['Orbite de l’ISS', zoomDeH(2.4e6)], ['Les Alpes', zoomDeH(1.2e4)], ['Salle de classe', 1]].map(([l, v]) =>
            <button key={l} onClick={() => changerZoom(v)} style={stylePetitBouton(Math.abs(z - v) < 0.004, '#3f6212')}>{l}</button>)}
        </div>
        {!enDefi && <>
          <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Placer l’objet</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {[['au sol', RT + 1.2], ['ISS (400 km)', RT + 4.08e5], ['d = 2 R_T', 2 * RT], ['d = 4 R_T', 4 * RT]].map(([l, d]) =>
              <button key={l} onClick={() => { const nz = d > 1.5 * RT ? 0 : d > RT + 1e5 ? zoomDeH(2.4e6) : 1; setZ(nz); setPosT({ x: 0, y: d }); }} style={stylePetitBouton(false)}>{l.includes('_') ? <>d = {l[4]} R<sub>T</sub></> : l}</button>)}
          </div>
          <Curseur nom="Masse de l’objet m" valeur={m} onChange={setM} min={1} max={100} pas={1} unite="kg" couleur="#334155"/></>}
      </>}
      {!terre && <>
        {!enDefi && <Curseur nom="Charge de la source |Q|" valeur={Qabs} onChange={setQabs} min={1} max={50} pas={1} unite="nC" couleur={src === 'plus' ? ROUGE : BLEU}/>}
        {!enDefi && <Curseur nom="Charge test q" valeur={q} onChange={setQ} min={-10} max={10} pas={1} unite="nC" couleur="#334155"/>}
        {enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Pendant le défi, les charges sont imposées.</div>}
      </>}
      {!(enDefi && defi.type === 'signes') && <><div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Afficher</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['grille', 'Champ en différents points'], ['lignes', 'Lignes de champ'], ['u', 'Vecteur unitaire u']].map(([k, l]) =>
          <button key={k} onClick={() => setAff(a => ({ ...a, [k]: !a[k] }))} style={stylePetitBouton(aff[k], '#0891b2')}>{k === 'u' ? <>Vecteur unitaire <Vec>u</Vec></> : l}</button>)}
      </div></>}
    </div>);

  const nomChamp = terre ? GRAV : 'E', uniteChamp = terre ? 'N·kg⁻¹' : 'N·C⁻¹';
  const sensE = terre ? 'centripète (vers O)' : Qn > 0 ? 'centrifuge (s’éloigne de Q)' : 'centripète (vers Q)';
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures en M</div>
      <LigneMesure nom={terre ? 'Distance au centre de la Terre d' : 'Distance au centre de la boule d'} valeur={terre ? longueur(cM.d) : `${fmt(cM.d * 100, 1)}${NB}cm`}/>
      {terre && <LigneMesure nom="Rapport d / R_T" valeur={fmt(cM.d / RT, 2)}/>}
      {terre && <LigneMesure nom="Altitude h = d − R_T" valeur={longueur(Math.max(0, hAlt))}/>}
      {!terre && !cache.signe && <LigneMesure nom="Charge de la source Q" valeur={nC(Qn)} couleur={Qn > 0 ? ROUGE : BLEU}/>}
      {!cache.valeurs && <LigneMesure nom={`Norme du champ ${nomChamp}`} valeur={`${val(cM.n)}${NB}${uniteChamp}`} couleur={VERT}/>}
      {!cache.valeurs && <LigneMesure nom="Sens du champ" valeur={sensE} couleur={VERT}/>}
      {terre ? <LigneMesure nom="Masse de l’objet m" valeur={`${fmt(m, 0)}${NB}kg`}/> : <LigneMesure nom="Charge test q" valeur={nC(qn)}/>}
      {!cache.valeurs && <LigneMesure nom={terre ? `Force F = m·${GRAV}` : 'Norme de la force F = |q|·E'} valeur={`${val(F)}${NB}N`} couleur={ROUGE}/>}
      {!cache.valeurs && !terre && <LigneMesure nom="Sens de F" valeur={qn > 0 ? 'même sens que E' : qn < 0 ? 'sens opposé à E' : 'pas de force'} couleur={ROUGE}/>}
    </div>);

  // calcul détaillé : expression littérale, puis application numérique
  const calcul = !cache.valeurs && (
    <div style={{ ...styleBoite, ...cadre('calcul') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Le calcul</div>
      {terre ? <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 2.2 }}>
        <div>d = {longueur(cM.d)} = {puiss(cM.d, 4)}{NB}m</div>
        <div>{GRAV} = <Frac haut={<>G·M<sub>T</sub></>} bas="d²"/> = <Frac haut="6,674 × 10⁻¹¹ × 5,972 × 10²⁴" bas={`(${puiss(cM.d, 4)})²`}/> = <strong style={{ color: VERT }}>{val(cM.n)}{NB}N·kg⁻¹</strong></div>
        <div>F = m × {GRAV} = {fmt(m, 0)} × {val(cM.n)} = <strong style={{ color: ROUGE }}>{val(F)}{NB}N</strong>{hAlt < 1e4 && <span style={{ color: KIT.txt2 }}> (le poids P de l’objet)</span>}</div>
      </div> : <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 2.2 }}>
        <div>|Q| = {fmt(Math.abs(Qn), 0)}{NB}nC = {fmt(Math.abs(Qn), 0)} × 10⁻⁹{NB}C ; d = {fmt(cM.d * 100, 1)}{NB}cm = {fmt(cM.d * 100, 1)} × 10⁻²{NB}m</div>
        <div>E = <Frac haut="k·|Q|" bas="d²"/> = <Frac haut={`9,0 × 10⁹ × ${fmt(Math.abs(Qn), 0)} × 10⁻⁹`} bas={`(${fmt(cM.d * 100, 1)} × 10⁻²)²`}/> = <strong style={{ color: VERT }}>{val(cM.n)}{NB}N·C⁻¹</strong></div>
        <div>F = |q| × E = {fmt(Math.abs(qn), 0)} × 10⁻⁹ × {val(cM.n)} = <strong style={{ color: ROUGE }}>{val(F)}{NB}N</strong></div>
      </div>}
    </div>);

  // les trois vecteurs en M, côte à côte
  const vecteurs = !cache.champM && (() => {
    const a = (vx, vy) => [vx, -vy];
    const col = (x, lab, d, c, txt) => <g key={lab}>
      <circle cx={x} cy={62} r="3" fill="#0f172a"/>
      {d && fleche(x, 62, d[0], d[1], 42, c, 3, lab)}
      {!d && <text x={x} y={66} textAnchor="middle" fontSize="12" fill={GRIS}>(nulle)</text>}
      {etiquetteVec(x, 112, txt[0], c, `e${lab}`, 14)}
      <text x={x} y={128} textAnchor="middle" fontSize="11.5" fill={c}>{txt[1]}</text></g>;
    const dC = a(cM.vx, cM.vy), dF = sensF ? [sensF * dC[0], sensF * dC[1]] : null;
    return (
      <div style={{ ...styleBoite, ...cadre('vecteurs') }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Les vecteurs en M</div>
        <svg viewBox="0 0 330 136" style={{ width: '100%', maxWidth: 380, display: 'block', margin: '0 auto' }} role="img" aria-label="Le vecteur unitaire, le champ et la force en M">
          {col(55, 'u', [cM.ux, -cM.uy], BLEU, ['u', 'unitaire, de O vers M'])}
          {col(165, 'c', dC, VERT, [nomChamp, 'champ en M'])}
          {col(275, 'F', dF, ROUGE, ['F', 'force sur l’objet'])}
        </svg>
        <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
          {terre ? <><Vec>{GRAV}</Vec> = −<Frac haut={<>G·M<sub>T</sub></>} bas="d²"/><Vec>u</Vec> : de sens opposé à <Vec>u</Vec>. <Vec>F</Vec> = m·<Vec>{GRAV}</Vec> : même sens que <Vec>{GRAV}</Vec> (m {'>'} 0).</>
            : <><Vec>E</Vec> = <Frac haut="k·Q" bas="d²"/><Vec>u</Vec> : {Qn > 0 ? 'même sens que' : 'sens opposé à'} <Vec>u</Vec> (Q {Qn > 0 ? '>' : '<'} 0).
              {' '}<Vec>F</Vec> = q·<Vec>E</Vec> : {qn > 0 ? <>même sens que <Vec>E</Vec> (q {'>'} 0)</> : qn < 0 ? <>sens opposé à <Vec>E</Vec> (q {'<'} 0)</> : 'nulle (q = 0)'}.</>}
        </div>
      </div>);
  })();

  const fPct = x => x === 0 ? '0' : x >= 0.1 ? fmt(x, x >= 10 ? 0 : 1) : puiss(x, 1);
  const panneauUnif = terre && !enDefi && (
    <div style={{ ...styleBoite, ...cadre('uniformite') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Uniformité du champ dans cette vue</div>
      {unif ? <>
        <LigneMesure nom="Écart de norme entre les flèches" valeur={`${fPct(unif.dn)}${NB}%`}/>
        <LigneMesure nom="Écart de direction entre les flèches" valeur={unif.da > 179 ? 'toutes les directions' : `${fPct(unif.da)}${NB}°`}/>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, color: unif.dn < 1 && unif.da < 1 ? '#15803d' : '#b45309' }}>
          {unif.dn < 1 && unif.da < 1 ? `✓ À cette échelle, le champ est uniforme : même direction, même sens, même norme.` : `✗ À cette échelle, le champ n’est pas uniforme.`}</div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Calculé sur les {pts.length} points de la grille visibles ({zoomTxt}).</div>
      </> : <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Pas assez de points visibles.</div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Terre</strong> : une boule à répartition de masse sphérique, qui crée à l’extérieur le même champ que si toute sa masse était en son centre O. M<sub>T</sub> = 5,972 × 10²⁴ kg, R<sub>T</sub> = 6 371 km, G = 6,674 × 10⁻¹¹ N·m²·kg⁻². Le champ n’est représenté qu’à l’extérieur de la Terre.</li>
      <li><strong>Rotation, relief, Lune et Soleil négligés</strong> : le modèle donne g = 9,82 N·kg⁻¹ au sol ; la valeur mesurée (9,78 à l’équateur, 9,81 à Paris, 9,83 aux pôles) tient compte de la rotation et de l’aplatissement de la Terre.</li>
      <li><strong>Charges ponctuelles</strong> : la boule est uniformément chargée et se comporte comme une charge ponctuelle placée en son centre ; dans l’air, on prend k = 9,0 × 10⁹ N·m²·C⁻² (comme dans le vide). Aucune autre charge à proximité.</li>
      <li><strong>Objet test</strong> : sa masse m (ou sa charge q) est assez petite pour ne pas modifier le champ de la source, qui reste immobile.</li>
      <li><strong>Représentation</strong> : les flèches grises sont à l’échelle les unes par rapport aux autres <em>dans une même vue</em> ; l’échelle change quand on zoome. Le nombre de lignes de champ tracées est arbitraire.</li>
      <li><strong>Notation</strong> : le champ de gravitation est noté <Vec>{GRAV}</Vec> (comme dans le programme) ; près du sol, on l’appelle champ de pesanteur <Vec>g</Vec>.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Zoomez lentement de « Terre entière » à « Salle de classe » en regardant les flèches grises et le cadre « Uniformité ».</li>
        <li>À quelle altitude la norme du champ de gravitation est-elle divisée par 2 par rapport au sol ? Est-ce à 2 R<sub>T</sub> du centre ?</li>
        <li>Sur l’orbite de l’ISS, l’apesanteur vient-elle d’un champ nul ? Lisez {GRAV} à 400 km.</li>
        <li>Avec une charge Q {'>'} 0, changez le signe de q : qu’est-ce qui change, le champ ou la force ?</li>
        <li>Doublez la charge Q : comment varie E au même point ? Et si vous doublez la distance ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li><Vec>{GRAV}</Vec> = −<Frac haut="G·M" bas="d²"/><Vec>u</Vec> (N·kg⁻¹), toujours centripète ; <Vec>F</Vec> = m·<Vec>{GRAV}</Vec></li>
        <li><Vec>E</Vec> = <Frac haut="k·Q" bas="d²"/><Vec>u</Vec> (N·C⁻¹), centrifuge si Q {'>'} 0, centripète si Q {'<'} 0 ; <Vec>F</Vec> = q·<Vec>E</Vec></li>
        <li>le champ de pesanteur <Vec>g</Vec> est uniforme à l’échelle locale ; g ≈ 9,8 N·kg⁻¹</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cf-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cf-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .cf-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .cf-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .cf-l1.cote, .cf-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Champ et force : gravitation et électrostatique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une masse crée autour d’elle un <strong>champ de gravitation</strong> <Vec>{GRAV}</Vec>, une charge électrique un <strong>champ électrostatique</strong> <Vec>E</Vec>.
        Un objet placé en un point M « ressent » le champ en ce point et subit une force : <Vec>F</Vec> = m·<Vec>{GRAV}</Vec> ou <Vec>F</Vec> = q·<Vec>E</Vec>.</div>
      <div className={`cf-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}>
            <VoletDefi defi={defi} setDefi={setDefi} changerType={lancerDefi} placer={p => placer(p, defi.type === 'altitude' ? 'terre' : src)}/></div>}
          <div className={`cf-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      <div className="cf-l2">{calcul}{vecteurs}{panneauUnif}</div>
      {!enDefi && <div className="cf-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="cf-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
