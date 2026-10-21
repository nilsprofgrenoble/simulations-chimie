import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, Frac, fmt, lireProgression } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 49 — DEUX CORPS EN INTERACTION : loi de la gravitation universelle de Newton et loi de Coulomb (1G, chapitre 8)
//  Forces F_A/B et F_B/A (actions réciproques), dépendance en 1/d², analogie entre les deux lois,
//  comparaison des deux interactions dans l’atome d’hydrogène.
// ====================================================

const G = 6.674e-11, K = 9.0e9;                                    // valeurs du cours
const E_CH = 1.602e-19, M_P = 1.673e-27, M_E = 9.109e-31;          // charge élémentaire, masses du proton et de l’électron
const M_T = 5.972e24, R_T = 6.371e6;
const SIM = 49;
const W0 = 600, H0 = 270, YC = 112, XA = 120, LF = 56;             // scène : centre vertical, position de A, longueur des flèches de force
const VERT = '#16a34a', ROUGE = '#dc2626', BLEU = '#2563eb', ORANGE = '#c2410c';

declarerDefis(SIM, [
  ['sens', 'Deux charges : nature de l’interaction et signe'],
  ['gravite', 'Force de gravitation Terre–satellite'],
  ['coulomb', 'Distance entre deux charges'],
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
const nC = q => `${q > 0 ? '+' : q < 0 ? '−' : ''}${fmt(Math.abs(q), 0)}${NB}nC`;

// Un vecteur avec sa flèche au-dessus (dans le texte HTML)
function Vec({ children }) {
  return <span style={{ position: 'relative', display: 'inline-block', paddingTop: '0.25em' }}>{children}
    <span aria-hidden="true" style={{ position: 'absolute', top: '-0.45em', left: 0, right: 0, textAlign: 'center', fontSize: '0.75em', lineHeight: 1 }}>→</span></span>;
}
const NW = { whiteSpace: 'nowrap' };
const FAB = <span style={NW}><Vec>F</Vec><sub>A/B</sub></span>;
const FBA = <span style={NW}><Vec>F</Vec><sub>B/A</sub></span>;
const UAB = <span style={NW}><Vec>u</Vec><sub>A/B</sub></span>;

// ---------- les cas étudiés ----------
// ch : grandeurs réglables, exprimées dans l’unité d’affichage ; f convertit en unité SI. fixe : non réglable.
const CAS = {
  eleves: { type: 'grav', nom: 'Deux élèves', icone: '🧍', A: 'élève A', B: 'élève B', rA: 18, rB: 18, cA: '#64748b', cB: '#94a3b8',
    ch: { mA: { v: 60, min: 40, max: 100, pas: 1, dec: 0, f: 1, u: 'kg' }, mB: { v: 70, min: 40, max: 160, pas: 1, dec: 0, f: 1, u: 'kg' },
      d: { v: 1, min: 0.3, max: 3, pas: 0.1, dec: 1, f: 1, u: 'm' } },
    dTxt: d => `${fmt(d, 1)}${NB}m` },
  lune: { type: 'grav', nom: 'Terre – Lune', icone: '🌙', A: 'Terre', B: 'Lune', rA: 28, rB: 12, cA: '#3f6212', cB: '#94a3b8',
    ch: { mA: { v: 5.972, f: 1e24, u: 'kg', fixe: true }, mB: { v: 7.35, f: 1e22, u: 'kg', fixe: true },
      d: { v: 3.84, min: 3.6, max: 4.1, pas: 0.01, dec: 2, f: 1e8, u: '× 10⁸ m' } },
    dTxt: d => `${puiss(d)}${NB}m` },
  iss: { type: 'grav', nom: 'Terre – satellite', icone: '🛰️', A: 'Terre', B: 'satellite', rA: 28, rB: 7, cA: '#3f6212', cB: '#a855f7',
    ch: { mA: { v: 5.972, f: 1e24, u: 'kg', fixe: true }, mB: { v: 4.2e5, f: 1, u: 'kg', fixe: true },
      d: { v: 6.78, min: 6.4, max: 9, pas: 0.01, dec: 2, f: 1e6, u: '× 10⁶ m' } },
    dTxt: d => `${puiss(d)}${NB}m` },
  soleil: { type: 'grav', nom: 'Soleil – Terre', icone: '☀️', A: 'Soleil', B: 'Terre', rA: 38, rB: 14, cA: '#f59e0b', cB: '#3f6212',
    ch: { mA: { v: 1.989, f: 1e30, u: 'kg', fixe: true }, mB: { v: 5.972, f: 1e24, u: 'kg', fixe: true },
      d: { v: 1.496, min: 1.47, max: 1.52, pas: 0.001, dec: 3, f: 1e11, u: '× 10¹¹ m' } },
    dTxt: d => `${puiss(d)}${NB}m` },
  boules: { type: 'elec', nom: 'Deux boules chargées', icone: '⚡', A: 'boule A', B: 'boule B', rA: 22, rB: 22,
    ch: { qA: { v: 10, min: -20, max: 20, pas: 1, dec: 0, f: 1e-9, u: 'nC' }, qB: { v: 10, min: -20, max: 20, pas: 1, dec: 0, f: 1e-9, u: 'nC' },
      d: { v: 10, min: 2, max: 30, pas: 1, dec: 0, f: 1e-2, u: 'cm' } },
    dTxt: d => `${fmt(d * 100, 0)}${NB}cm` },
  atome: { type: 'elec', nom: 'Atome d’hydrogène', icone: '⚛️', A: 'proton', B: 'électron', rA: 20, rB: 9,
    ch: { qA: { v: 1, f: E_CH, u: 'e', fixe: true }, qB: { v: -1, f: E_CH, u: 'e', fixe: true },
      d: { v: 53, min: 20, max: 200, pas: 1, dec: 0, f: 1e-12, u: 'pm' } },
    dTxt: d => `${fmt(d * 1e12, 0)}${NB}pm` },
};
const defauts = k => Object.fromEntries(Object.entries(CAS[k].ch).map(([n, s]) => [n, s.v]));

// ---------- physique ----------
function interaction(cas, p) {
  const C = CAS[cas], d = p.d * C.ch.d.f;
  if (C.type === 'grav') {
    const mA = p.mA * C.ch.mA.f, mB = p.mB * C.ch.mB.f;
    return { grav: true, d, mA, mB, F: G * mA * mB / (d * d), attr: true, nul: false };
  }
  const qA = p.qA * C.ch.qA.f, qB = p.qB * C.ch.qB.f;
  return { grav: false, d, qA, qB, F: K * Math.abs(qA * qB) / (d * d), attr: qA * qB < 0, nul: qA * qB === 0 };
}
const F_LUNE = G * M_T * 7.35e22 / (3.84e8) ** 2;
const F_COUL = K * 10e-9 * 10e-9 / 0.01;
const F_ATOME = K * E_CH ** 2 / (53e-12) ** 2;
const F_GATOME = G * M_P * M_E / (53e-12) ** 2;

// ---------- dessin ----------
function fleche(x, y, dir, len, col, ep = 3, cle) {
  const x2 = x + dir * len, t = 10, w = 5.5, bx = x2 - dir * t;
  return <g key={cle}><line x1={x} y1={y} x2={bx} y2={y} stroke={col} strokeWidth={ep} strokeLinecap="round"/>
    <path d={`M${x2},${y} L${bx},${y - w} L${bx},${y + w} z`} fill={col}/></g>;
}
// Nom d’un vecteur dans le SVG, avec sa flèche dessinée au-dessus et un indice (la flèche combinante ne s’affiche pas partout)
function etiquetteVec(x, y, lettre, indice, col, cle, taille = 15) {
  const w = taille * 0.4, h = y - taille * 0.95;
  return <g key={cle}><text x={x} y={y} textAnchor="middle" fontSize={taille} fontWeight="800" fill={col}>{lettre}
    {indice && <tspan fontSize={taille * 0.7} dy={taille * 0.28}>{indice}</tspan>}</text>
    <line x1={x - w} y1={h} x2={x + w - 2} y2={h} stroke={col} strokeWidth="1.4"/><path d={`M${x + w + 1},${h} l-4.5,-2.6 l0,5.2 z`} fill={col}/></g>;
}

// ---------- tirages des défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
function nouveauDefi(type) {
  if (type === 'sens') {
    const qA = tire([1, -1]) * tire([5, 8, 10, 15]), qB = tire([1, -1]) * tire([4, 6, 10, 12]);
    return { type, qA, qB, d: tire([6, 8, 10, 12, 15]), reps: {}, verifie: false };
  }
  if (type === 'gravite') return { type, m: tire([500, 1000, 2000, 5000]), h: tire([300, 400, 600, 800, 1200, 2000]), reps: {}, verifie: false };
  const qA = tire([4, 5, 6, 8, 10, 12]), qB = tire([1, -1]) * tire([3, 5, 6, 10]), dT = tire([4, 5, 6, 8, 10, 12, 15, 20]);
  const Fp = +(K * qA * Math.abs(qB) * 1e-18 / (dT * 1e-2) ** 2 * 1e6).toPrecision(3);
  return { type, qA, qB, Fp, reps: {}, verifie: false };
}
const TITRES_DEFIS = { sens: 'Deux charges', gravite: 'Terre et satellite', coulomb: 'Distance cherchée' };

// Volet du défi : monté seulement en mode défi, il enregistre essais, corrections vues et réussite sur le compte de l’élève
function VoletDefi({ defi, setDefi, changerType, placer }) {
  const cle = `${SIM}:defi.${defi.type}`;
  const res = (() => {
    if (!defi.verifie) return null;
    const r = defi.reps;
    if (defi.type === 'sens') {
      const attr = defi.qA * defi.qB < 0;
      const okN = r.nature === (attr ? 'attr' : 'rep'), okS = r.signeB === (defi.qB > 0 ? '+' : '-'), okF = r.fact === 'div9';
      return { ok: okN && okS && okF, lignes: [
        [okN, okN ? 'Nature de l’interaction correcte.' : 'Nature : regardez le sens des forces. Si chaque corps est poussé loin de l’autre, l’interaction est répulsive ; s’il est tiré vers l’autre, elle est attractive.'],
        [okS, okS ? 'Signe de q_B correct.' : 'Signe de q_B : des charges de même signe se repoussent, des charges de signes opposés s’attirent. Tenez compte du signe de q_A.'],
        [okF, okF ? 'Variation de la force correcte.' : 'La force varie en 1/d² : si d est multipliée par 3, d² est multipliée par 9, donc F est divisée par 9.']] };
    }
    if (defi.type === 'gravite') {
      const d = R_T + defi.h * 1e3, F = G * M_T * defi.m / (d * d);
      const F1 = lireNombre(r.F1), F2 = lireNombre(r.F2);
      const ok1 = isFinite(F1) && proche(F1, F, 0.03), ok2 = isFinite(F2) && proche(F2, F, 0.03);
      let m1 = ok1 ? 'Force de la Terre sur le satellite correcte.' : 'Force de la Terre sur le satellite : F = G·M_T·m / d², avec d la distance entre les centres.';
      if (!ok1 && isFinite(F1) && proche(F1, G * M_T * defi.m / (defi.h * 1e3) ** 2, 0.05)) m1 = 'Vous avez pris l’altitude h comme distance. La distance d est comptée entre les centres : d = R_T + h.';
      else if (!ok1 && isFinite(F1) && proche(F1, F * 1e-3, 0.05)) m1 = 'Vérifiez les unités : la force est demandée en newton (1 kN = 10³ N).';
      return { ok: ok1 && ok2, lignes: [[ok1, m1],
        [ok2, ok2 ? 'Force du satellite sur la Terre correcte.' : 'D’après le principe des actions réciproques, la force du satellite sur la Terre a la même norme que celle de la Terre sur le satellite.']] };
    }
    const dEt = Math.sqrt(K * defi.qA * Math.abs(defi.qB) * 1e-18 / (defi.Fp * 1e-6));
    const d = lireNombre(r.d), attr = defi.qA * defi.qB < 0;
    const okD = isFinite(d) && proche(d * 1e-2, dEt, 0.02), okS = r.sensF === (attr ? 'vers' : 'loin');
    let mD = okD ? 'Distance correcte.' : 'Distance : isolez d dans F = k·|q_A|·|q_B| / d², puis d = √(k·|q_A|·|q_B| / F), avec les charges en coulombs et F en newtons.';
    if (!okD && isFinite(d) && proche(d, dEt, 0.02)) mD = 'C’est la bonne valeur, mais en mètres : la distance est demandée en cm.';
    return { ok: okD && okS, lignes: [[okD, mD],
      [okS, okS ? 'Sens correct.' : 'Sens : des charges de même signe se repoussent, des charges de signes opposés s’attirent.']] };
  })();
  const reussi = !!res && res.ok;
  const suivi = useSuivi(cle, reussi);
  const solution = !!defi.solution;
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const verifier = () => {
    suivi.essai();
    setDefi(d => ({ ...d, verifie: true }));
    if (defi.type === 'coulomb') { const d = lireNombre(defi.reps.d); if (isFinite(d) && d >= 2 && d <= 30) placer(d); }
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
        style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES_DEFIS).map(([t, l]) =>
          <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}
      </div>
      {defi.type === 'sens' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : deux charges</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          La boule A porte la charge <strong>q<sub>A</sub> = {nC(defi.qA)}</strong>. Le signe de la charge de la boule B est inconnu (en gris). Les flèches montrent les forces que les deux boules
          exercent l’une sur l’autre. Retrouvez la nature de l’interaction et le signe de q<sub>B</sub>.</div>
        <div style={{ fontSize: 14, fontWeight: 700, margin: '4px 0' }}>L’interaction est…</div>
        {choix('nature', [['attr', 'attractive'], ['rep', 'répulsive']])}
        <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>Signe de la charge q<sub>B</sub></div>
        {choix('signeB', [['+', <span key="p">q<sub>B</sub> {'>'} 0</span>], ['-', <span key="m">q<sub>B</sub> {'<'} 0</span>]])}
        <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>Si on triplait la distance d entre les boules, la norme des forces serait…</div>
        {choix('fact', [['x9', 'multipliée par 9'], ['x3', 'multipliée par 3'], ['div3', 'divisée par 3'], ['div9', 'divisée par 9']])}
      </>}
      {defi.type === 'gravite' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : la Terre et un satellite</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Un satellite de masse <strong>m = {fmt(defi.m, 0)}{NB}kg</strong> orbite à l’altitude <strong>h = {fmt(defi.h, 0)}{NB}km</strong> au-dessus du sol.
          Calculez la norme de la force exercée par la Terre sur le satellite, puis celle de la force exercée par le satellite sur la Terre.
          Données : G = 6,674 × 10⁻¹¹ N·m²·kg⁻², M<sub>T</sub> = 5,972 × 10²⁴ kg, R<sub>T</sub> = 6 371 km.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saisie('F1', 'N', 'Force de la Terre sur le satellite')}
          {saisie('F2', 'N', 'Force du satellite sur la Terre')}
        </div>
      </>}
      {defi.type === 'coulomb' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : à quelle distance ?</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Les charges des boules sont <strong>q<sub>A</sub> = {nC(defi.qA)}</strong> et <strong>q<sub>B</sub> = {nC(defi.qB)}</strong>. Les boules exercent l’une sur l’autre des forces de norme
          <strong> F = {fmt(defi.Fp, defi.Fp >= 100 ? 0 : defi.Fp >= 10 ? 1 : 2)}{NB}µN</strong>. 1. Quelle est la distance entre les centres des boules ?
          2. La force subie par A est-elle dirigée vers B ou à l’opposé ? Donnée : k = 9,0 × 10⁹ N·m²·C⁻².</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saisie('d', 'cm', 'Distance d')}
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>La force subie par A est dirigée…</div>
          {choix('sensF', [['vers', 'vers B (attraction)'], ['loin', 'à l’opposé de B (répulsion)']])}
        </div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        <button onClick={verifier} style={styleBouton(true, VERT)}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau défi</button>
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
        {res.lignes.map(([ok, t], i) => <div key={i} style={{ color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✓' : '✗'} {avecIndices(t)}</div>)}
        {res.ok && <div style={{ color: '#15803d', marginTop: 4 }}>🎉 Défi réussi !</div>}
        {!res.ok && !solution && <button onClick={voirSolution} style={{ marginTop: 4, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>}
      {solution && <div style={{ ...styleBoite, marginTop: 8, fontSize: 13.5, lineHeight: 1.6, background: '#fffbeb', borderColor: '#fcd34d' }}>
        {defi.type === 'sens' && <>Les flèches sont {defi.qA * defi.qB < 0 ? 'dirigées chacune vers l’autre boule : l’interaction est attractive, donc les charges sont de signes opposés' : 'dirigées chacune à l’opposé de l’autre boule : l’interaction est répulsive, donc les charges sont de même signe'}.
          Comme q<sub>A</sub> {defi.qA > 0 ? '> 0' : '< 0'}, q<sub>B</sub> {defi.qB > 0 ? '> 0' : '< 0'}. La force varie en 1/d² : avec 3d, d² est multipliée par 9 et F est divisée par 9.</>}
        {defi.type === 'gravite' && (() => { const d = R_T + defi.h * 1e3; return <>
          d = R<sub>T</sub> + h = 6,371 × 10⁶ + {fmt(defi.h, 0)} × 10³ = {puiss(d)}{NB}m. F = <Frac haut={<>G·M<sub>T</sub>·m</>} bas="d²"/> = <Frac haut={`6,674 × 10⁻¹¹ × 5,972 × 10²⁴ × ${fmt(defi.m, 0)}`} bas={`(${puiss(d)})²`}/> = {puiss(G * M_T * defi.m / (d * d))}{NB}N.
          {' '}Par le principe des actions réciproques, le satellite exerce sur la Terre une force de même norme (et de sens opposé).</>; })()}
        {defi.type === 'coulomb' && (() => { const dEt = Math.sqrt(K * defi.qA * Math.abs(defi.qB) * 1e-18 / (defi.Fp * 1e-6)); return <>
          F = <Frac haut="k·|q_A|·|q_B|" bas="d²"/> donc d = √(k·|q<sub>A</sub>|·|q<sub>B</sub>| / F) = √(9,0 × 10⁹ × {fmt(defi.qA, 0)} × 10⁻⁹ × {fmt(Math.abs(defi.qB), 0)} × 10⁻⁹ / ({fmt(defi.Fp, 2)} × 10⁻⁶)) = {puiss(dEt)}{NB}m ≈ {fmt(dEt * 100, 1)}{NB}cm.
          {' '}Les charges sont {defi.qA * defi.qB > 0 ? 'de même signe : la force est répulsive (à l’opposé de B)' : 'de signes opposés : la force est attractive (vers B)'}.</>; })()}
      </div>}
    </div>);
}

export function SimulationDeuxCorps() {
  const [mode, setMode] = useState(() => modeOuverture('deux-corps-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('deux-corps-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [cas, setCas] = useState('eleves');
  const [p, setP] = useState(defauts('eleves'));
  const [aff, setAff] = useState({ u: false, double: false });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const svgRef = useRef(null), glisse = useRef(false);

  const C = CAS[cas];
  const I = interaction(cas, p);
  const regler = (k, v) => setP(q => ({ ...q, [k]: v }));
  function choisirCas(k) { setCas(k); setP(defauts(k)); }
  const cache = enDefi ? { valeurs: true, signeB: defi.type === 'sens', d: defi.type === 'gravite' } : {};

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const okLune = cas === 'lune' && Math.abs(p.d - 3.84) < 0.005;
  const okEleves = cas === 'eleves' && p.mA === 60 && p.mB === 70 && Math.abs(p.d - 1) < 0.01;
  const okD2 = cas === 'eleves' && p.mA === 60 && p.mB === 70 && Math.abs(p.d - 2) < 0.01;
  const okM2 = cas === 'eleves' && p.mA === 60 && p.mB === 140 && Math.abs(p.d - 1) < 0.01;
  const okPP = cas === 'boules' && p.qA === 10 && p.qB === 10 && p.d === 10;
  const okPM = cas === 'boules' && p.qA === 10 && p.qB === -10 && p.d === 10;
  const okAtome = cas === 'atome' && Math.abs(p.d - 53) < 0.5;
  const ETAPES = [
    { id: 'idee', titre: 'Deux corps, deux forces', focus: ['scene'],
      texte: <>Deux corps A et B s’attirent ou se repoussent <strong>à distance</strong>. Cette interaction est modélisée par deux forces : {FAB}, exercée par A sur B (flèche rouge, appliquée en B),
        et {FBA}, exercée par B sur A (flèche orange, appliquée en A). Observez-les sur la scène.</>,
      tache: { type: 'qcm', q: 'Comparez les deux forces exercées par les deux corps l’un sur l’autre :', options: ['même direction, même norme, sens opposés', 'même direction, même sens, même norme', 'même direction, sens opposés, mais la plus grosse masse exerce la plus grande force'], bonne: 0,
        expl: 'C’est le principe des actions réciproques (3ᵉ loi de Newton) : la force de A sur B est l’opposée de la force de B sur A. Les deux forces ont la même norme, même si les masses sont très différentes.' } },
    { id: 'lune', titre: 'La Terre et la Lune', focus: ['reglages', 'scene'],
      texte: <>Choisissez le cas « Terre – Lune » et réglez la distance sur la valeur moyenne <strong>d = 3,84 × 10⁸ m</strong>.</>,
      tache: { type: 'action', ok: okLune, label: 'Terre – Lune, d = 3,84 × 10⁸ m', faire: () => { setCas('lune'); setP(defauts('lune')); }, consigne: 'Cas « Terre – Lune » avec d = 3,84 × 10⁸ m' } },
    { id: 'reciproque', titre: 'Qui attire le plus fort ?', focus: ['scene', 'mesures'],
      texte: <>La Terre est 80 fois plus massive que la Lune. Lisez les forces dans « Mesures » et regardez la longueur des flèches.</>,
      tache: { type: 'qcm', q: 'La force exercée par la Lune sur la Terre est…', options: ['de même norme que celle exercée par la Terre sur la Lune', '80 fois plus faible que celle exercée par la Terre sur la Lune', 'nulle, car la Lune est très légère'], bonne: 0,
        expl: 'Les deux forces ont exactement la même norme (≈ 2,0 × 10²⁰ N). Ce qui diffère, c’est l’effet : la même force fait beaucoup plus varier le mouvement de la Lune, moins massive, que celui de la Terre.' } },
    { id: 'calculLune', titre: 'Calculer la force de gravitation', focus: ['calcul'],
      texte: <>La norme de la force de gravitation entre deux corps de masses m<sub>A</sub> et m<sub>B</sub> dont les centres sont distants de d est <strong>F = G·m<sub>A</sub>·m<sub>B</sub> / d²</strong>, avec G = 6,674 × 10⁻¹¹ N·m²·kg⁻². Faites le calcul vous-même avant de lire la mesure.</>,
      tache: { type: 'num', q: 'Norme de la force entre la Terre et la Lune à d = 3,84 × 10⁸ m', unite: 'N', vrai: F_LUNE, tol: 0.03, affiche: v => puiss(v, 2), cs: 2,
        bloque: okLune ? null : 'Réglez d’abord Terre – Lune à d = 3,84 × 10⁸ m (étape précédente).',
        pieges: [[F_LUNE * 3.84e8 / 1, 'Le dénominateur est d² : n’oubliez pas le carré.'], [G * M_T * 7.35e22 * 3.84e8, 'La distance est au dénominateur, au carré.']],
        expl: 'F = 6,674 × 10⁻¹¹ × 5,972 × 10²⁴ × 7,35 × 10²² / (3,84 × 10⁸)² ≈ 1,99 × 10²⁰ N.' } },
    { id: 'eleves', titre: 'Deux élèves', focus: ['reglages', 'scene'],
      texte: <>Passons à une échelle humaine : deux élèves de <strong>60 kg</strong> et <strong>70 kg</strong>, à <strong>1,0 m</strong> l’un de l’autre.</>,
      tache: { type: 'action', ok: okEleves, label: 'Deux élèves : 60 kg, 70 kg, d = 1,0 m', faire: () => { setCas('eleves'); setP({ mA: 60, mB: 70, d: 1 }); },
        consigne: 'Cas « Deux élèves » : m_A = 60 kg, m_B = 70 kg, d = 1,0 m' } },
    { id: 'calculEleves', titre: 'La force entre deux élèves', focus: ['calcul'],
      texte: <>Calculez la norme de la force de gravitation exercée par un élève sur l’autre.</>,
      tache: { type: 'num', q: 'Norme de la force entre les deux élèves', unite: 'N', vrai: G * 60 * 70, tol: 0.03, affiche: v => puiss(v, 2), cs: 2,
        bloque: okEleves ? null : 'Réglez d’abord les deux élèves (étape précédente).',
        pieges: [[60 * 70, 'Il manque la constante G = 6,674 × 10⁻¹¹ N·m²·kg⁻².']],
        expl: 'F = 6,674 × 10⁻¹¹ × 60 × 70 / 1,0² ≈ 2,8 × 10⁻⁷ N.' } },
    { id: 'poidsComp', titre: 'Pourquoi ne la sent-on pas ?', focus: ['mesures'],
      texte: <>Le poids d’un élève de 70 kg est d’environ 690 N. Comparez avec la force que vous venez de calculer.</>,
      tache: { type: 'qcm', q: 'On ne ressent pas l’attraction gravitationnelle de son voisin parce que…', options: ['elle est environ 10⁹ fois plus faible que le poids : elle est négligeable', 'elle n’existe pas entre deux personnes', 'elle est compensée par la force exercée par le voisin sur nous'], bonne: 0,
        expl: 'L’interaction existe, mais G est minuscule : elle ne devient importante que si au moins un des corps a une masse astronomique. Les deux forces ne se compensent pas : elles s’appliquent sur deux corps différents.' } },
    { id: 'doubleD', titre: 'On double la distance', focus: ['reglages', 'scene', 'graphe'],
      texte: <>Gardez les mêmes élèves, mais éloignez-les à <strong>d = 2,0 m</strong> (curseur ou glisser sur la scène).</>,
      tache: { type: 'action', ok: okD2, label: 'Régler d = 2,0 m', faire: () => { setCas('eleves'); setP({ mA: 60, mB: 70, d: 2 }); }, consigne: 'Distance d = 2,0 m' } },
    { id: 'valD2', titre: 'La nouvelle force', focus: ['calcul', 'mesures'],
      texte: <>Calculez la norme de la force pour d = 2,0 m.</>,
      tache: { type: 'num', q: 'Norme de la force à d = 2,0 m', unite: 'N', vrai: G * 60 * 70 / 4, tol: 0.03, affiche: v => puiss(v, 2), cs: 2,
        bloque: okD2 ? null : 'Réglez d’abord d = 2,0 m avec 60 kg et 70 kg (étape précédente).',
        pieges: [[G * 60 * 70 / 2, 'La force n’est pas divisée par 2 quand la distance double : elle varie en 1/d².']],
        expl: 'F = 6,674 × 10⁻¹¹ × 60 × 70 / 2,0² ≈ 7,0 × 10⁻⁸ N, soit quatre fois moins qu’à 1,0 m.' } },
    { id: 'loiD', titre: 'La loi en 1/d²', focus: ['graphe'],
      texte: <>Comparez les deux résultats (à 1,0 m et à 2,0 m) et regardez la courbe de F en fonction de d.</>,
      tache: { type: 'qcm', q: 'Quand la distance entre les centres des deux corps double, la norme de la force est…', options: ['divisée par 4', 'divisée par 2', 'inchangée'], bonne: 0,
        expl: 'F = G·m_A·m_B / d² : si d est multiplié par 2, d² est multiplié par 4, donc F est divisée par 4.' } },
    { id: 'masse', titre: 'On double une masse', focus: ['reglages', 'mesures'],
      texte: <>Remettez les élèves à 1,0 m l’un de l’autre, puis remplacez l’élève B par un élève de <strong>140 kg</strong> (deux fois plus lourd).</>,
      tache: { type: 'action', ok: okM2, label: 'm_B = 140 kg, d = 1,0 m', faire: () => { setCas('eleves'); setP({ mA: 60, mB: 140, d: 1 }); }, consigne: 'm_A = 60 kg, m_B = 140 kg, d = 1,0 m' } },
    { id: 'loiM', titre: 'Effet de la masse', focus: ['mesures', 'calcul'],
      texte: <>Comparez avec la force obtenue pour 70 kg à 1,0 m (≈ 2,8 × 10⁻⁷ N).</>,
      tache: { type: 'qcm', q: 'Quand la masse m_B double, la norme de la force est…', options: ['multipliée par 2 (proportionnelle à m_B)', 'multipliée par 4', 'inchangée'], bonne: 0,
        expl: 'F = G·m_A·m_B / d² est proportionnelle à chacune des deux masses : doubler m_B double F.' } },
    { id: 'elec', titre: 'Passons aux charges électriques', focus: ['reglages', 'scene'],
      texte: <>Deux corps portant des charges électriques q<sub>A</sub> et q<sub>B</sub> exercent aussi l’un sur l’autre des forces : c’est l’<strong>interaction électrostatique</strong>. Choisissez deux boules de <strong>+10 nC</strong> chacune, à <strong>10 cm</strong>.</>,
      tache: { type: 'action', ok: okPP, label: 'q_A = q_B = +10 nC, d = 10 cm', faire: () => { setCas('boules'); setP({ qA: 10, qB: 10, d: 10 }); }, consigne: 'q_A = +10 nC, q_B = +10 nC, d = 10 cm' } },
    { id: 'repulsion', titre: 'Des charges de même signe', focus: ['scene'],
      texte: <>Observez le sens des flèches de force.</>,
      tache: { type: 'qcm', q: 'Deux charges de même signe…', options: ['se repoussent : chaque force est dirigée à l’opposé de l’autre corps', 's’attirent : chaque force est dirigée vers l’autre corps', 'n’interagissent pas'], bonne: 0,
        expl: 'Charges de même signe : interaction répulsive. Charges de signes opposés : interaction attractive.' } },
    { id: 'attraction', titre: 'Des charges de signes opposés', focus: ['reglages', 'scene'],
      texte: <>Gardez q<sub>A</sub> = +10 nC et réglez maintenant <strong>q<sub>B</sub> = −10 nC</strong>. Observez les flèches.</>,
      tache: { type: 'action', ok: okPM, label: 'q_B = −10 nC', faire: () => { setCas('boules'); setP({ qA: 10, qB: -10, d: 10 }); }, consigne: 'q_A = +10 nC, q_B = −10 nC, d = 10 cm' } },
    { id: 'calculCoulomb', titre: 'La loi de Coulomb', focus: ['calcul'],
      texte: <>La norme de la force électrostatique est <strong>F = k·|q<sub>A</sub>|·|q<sub>B</sub>| / d²</strong>, avec k = 9,0 × 10⁹ N·m²·C⁻². Calculez-la (charges en coulombs, distance en mètres).</>,
      tache: { type: 'num', q: 'Norme de la force entre les deux boules', unite: 'N', vrai: F_COUL, tol: 0.02, affiche: v => puiss(v, 2), cs: 2,
        bloque: okPM ? null : 'Réglez d’abord q_A = +10 nC, q_B = −10 nC et d = 10 cm (étape précédente).',
        pieges: [[K * 100 / 0.01, 'Convertissez les charges en coulombs : 10 nC = 10 × 10⁻⁹ C.'], [K * 10e-9 * 10e-9 / 0.1, 'Convertissez d en mètres puis élevez-le au carré : (0,10 m)² = 0,010 m².'], [-F_COUL, 'La norme d’une force est positive : on utilise |q_A|·|q_B|.']],
        expl: 'F = 9,0 × 10⁹ × 10 × 10⁻⁹ × 10 × 10⁻⁹ / (0,10)² = 9,0 × 10⁻⁵ N.' } },
    { id: 'atome', titre: 'L’atome d’hydrogène', focus: ['reglages', 'scene'],
      texte: <>Dans le modèle planétaire de l’atome d’hydrogène, un électron (−e) est à R = <strong>53 pm</strong> d’un proton (+e). Choisissez ce cas.</>,
      tache: { type: 'action', ok: okAtome, label: 'Atome d’hydrogène, R = 53 pm', faire: () => { setCas('atome'); setP(defauts('atome')); }, consigne: 'Cas « Atome d’hydrogène » avec d = 53 pm' } },
    { id: 'calculAtome', titre: 'La force dans l’atome', focus: ['calcul'],
      texte: <>Calculez la norme de la force électrostatique exercée par le proton sur l’électron, avec e = 1,602 × 10⁻¹⁹ C et 1 pm = 10⁻¹² m.</>,
      tache: { type: 'num', q: 'Norme de la force proton–électron', unite: 'N', vrai: F_ATOME, tol: 0.03, affiche: v => puiss(v, 2), cs: 2,
        bloque: okAtome ? null : 'Choisissez d’abord l’atome d’hydrogène avec R = 53 pm (étape précédente).',
        pieges: [[K * E_CH ** 2 / 53e-12, 'N’oubliez pas le carré sur la distance : R² = (53 × 10⁻¹² m)².'], [K * E_CH ** 2 / 53 ** 2, 'Convertissez R en mètres : 53 pm = 53 × 10⁻¹² m.']],
        expl: 'F = 9,0 × 10⁹ × (1,602 × 10⁻¹⁹)² / (53 × 10⁻¹²)² ≈ 8,2 × 10⁻⁸ N. Petite valeur… mais appliquée à un électron de 9 × 10⁻³¹ kg !' } },
    { id: 'compare', titre: 'Gravitation ou électrostatique ?', focus: ['compar'],
      texte: <>Le cadre « Comparer les deux interactions » calcule aussi la force de <em>gravitation</em> entre le proton (1,673 × 10⁻²⁷ kg) et l’électron (9,109 × 10⁻³¹ kg) à la même distance.</>,
      tache: { type: 'qcm', q: 'Dans l’atome, la force électrostatique est… la force de gravitation.', options: ['environ 10³⁹ fois plus grande que', 'environ 10³ fois plus grande que', 'du même ordre de grandeur que'], bonne: 0,
        expl: `F_élec ≈ ${puiss(F_ATOME, 2)} N et F_grav ≈ ${puiss(F_GATOME, 2)} N : le rapport vaut ≈ ${puiss(F_ATOME / F_GATOME, 2)}. À l’échelle atomique, la gravitation est totalement négligeable ; c’est l’électrostatique qui assemble les atomes et les molécules.` } },
    { id: 'analogie', titre: 'Deux lois, une même forme', focus: [],
      texte: <>Comparez F = G·m<sub>A</sub>·m<sub>B</sub> / d² et F = k·|q<sub>A</sub>|·|q<sub>B</sub>| / d².</>,
      tache: { type: 'qcm', q: 'Quelle est la principale différence entre les deux interactions ?', options: ['la gravitation est toujours attractive ; l’interaction électrostatique peut être attractive ou répulsive', 'la gravitation varie en 1/d et l’électrostatique en 1/d²', 'seule la gravitation obéit au principe des actions réciproques'], bonne: 0,
        expl: 'Les deux lois ont la même forme (proportionnelles au produit des « charges » — masses ou charges électriques — et en 1/d²). Les masses sont toujours positives : la gravitation est toujours attractive. Les charges ont deux signes : l’interaction peut être répulsive.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>deux corps A et B interagissent : <Vec>F</Vec><sub>A/B</sub> = −<Vec>F</Vec><sub>B/A</sub> (même direction, même norme, sens opposés)</li>
        <li>gravitation : F = G·m<sub>A</sub>·m<sub>B</sub> / d², toujours attractive</li>
        <li>électrostatique : F = k·|q<sub>A</sub>|·|q<sub>B</sub>| / d², attractive si les charges sont de signes opposés, répulsive sinon</li>
        <li>dans les deux cas F est proportionnelle à chaque « charge » et varie en 1/d²</li></ul>,
      texte: <>Vous savez modéliser l’interaction entre deux corps par deux forces opposées et calculer leur norme. Essayez maintenant les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function lancerDefi(type) {
    const dd = nouveauDefi(type);
    setDefi(dd);
    if (type === 'sens') { setCas('boules'); setP({ qA: dd.qA, qB: dd.qB, d: dd.d }); }
    else if (type === 'gravite') { setCas('iss'); setP({ mA: 5.972, mB: dd.m, d: (R_T + dd.h * 1e3) / 1e6 }); }
    else { setCas('boules'); setP({ qA: dd.qA, qB: dd.qB, d: 12 }); }
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) lancerDefi('sens');
    else if (md === 'defi') lancerDefi(defi.type);
    if (md === 'guide') {                       // la scène doit correspondre à l'étape où l'on reprend
      const i = guide.etape, ix = id => ETAPES.findIndex(e => e.id === id);
      if (i >= ix('atome')) choisirCas('atome');
      else if (i >= ix('elec')) choisirCas('boules');
      else if (i >= ix('eleves')) choisirCas('eleves');
      else if (i >= ix('lune')) choisirCas('lune');
    }
  }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNE ════════════════
  const dc = C.ch.d;
  const pxDe = pd => XA + 180 + 230 * (pd - dc.min) / (dc.max - dc.min);
  const xB = pxDe(p.d);
  const versD = e => {
    const rc = svgRef.current.getBoundingClientRect(), px = (e.clientX - rc.left) * W0 / rc.width;
    const pd = dc.min + (px - XA - 180) / 230 * (dc.max - dc.min);
    return Number((Math.round(Math.max(dc.min, Math.min(dc.max, pd)) / dc.pas) * dc.pas).toFixed(4));
  };
  const sB = I.attr ? -1 : 1;                         // sens de F_A/B (appliquée en B) sur l'axe horizontal
  const colA = C.type === 'grav' ? C.cA : I.qA > 0 ? ROUGE : I.qA < 0 ? BLEU : '#94a3b8';
  const colB = C.type === 'grav' ? C.cB : cache.signeB ? '#94a3b8' : I.qB > 0 ? ROUGE : I.qB < 0 ? BLEU : '#94a3b8';
  const signe = q => q > 0 ? '+' : q < 0 ? '−' : '0';
  const corps = (x, r, col, lettre, nom, txt) => (
    <g>
      <circle cx={x} cy={YC} r={r} fill={col} stroke="#0f172a" strokeWidth="1.5"/>
      <text x={x} y={YC + 5} textAnchor="middle" fontSize={r > 14 ? 15 : 11} fontWeight="800" fill="white">{txt || lettre}</text>
      <text x={x} y={YC + r + 18} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#0f172a">{nom}</text>
    </g>);
  const yBr = YC + 66;
  const fleches = !I.nul && <g>
    {fleche(xB + sB * (C.rB + 3), YC, sB, LF, ROUGE, 3.2, 'fab')}
    {etiquetteVec(xB + sB * (C.rB + 3 + LF / 2), YC - 16, 'F', 'A/B', ROUGE, 'efab')}
    {fleche(XA - sB * (C.rA + 3), YC, -sB, LF, ORANGE, 3.2, 'fba')}
    {etiquetteVec(XA - sB * (C.rA + 3 + LF / 2), YC - 16, 'F', 'B/A', ORANGE, 'efba')}
  </g>;
  const xu = (XA + xB) / 2 - 28;
  const unitaire = aff.u && <g>{fleche(xu, yBr + 40, 1, 56, BLEU, 2.6, 'u')}{etiquetteVec(xu + 28, yBr + 66, 'u', 'A/B', BLEU, 'eu', 14)}</g>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <svg ref={svgRef} viewBox={`0 0 ${W0} ${H0}`} style={{ width: '100%', display: 'block', touchAction: 'none', background: '#fafaf9', borderRadius: 8, cursor: enDefi ? 'default' : 'ew-resize' }}
        onPointerDown={e => { if (enDefi) return; glisse.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); regler('d', versD(e)); }}
        onPointerMove={e => { if (glisse.current) regler('d', versD(e)); }}
        onPointerUp={() => { glisse.current = false; }} onPointerCancel={() => { glisse.current = false; }}
        role="img" aria-label={`Deux corps, ${C.A} et ${C.B}, et les deux forces d’interaction qu’ils exercent l’un sur l’autre`}>
        {fleches}
        {corps(XA, C.rA, colA, 'A', C.A, C.type === 'elec' ? signe(I.qA) : null)}
        {corps(xB, C.rB, colB, 'B', C.B, C.type === 'elec' ? (cache.signeB ? '?' : signe(I.qB)) : null)}
        <g stroke="#0f172a" strokeWidth="1.6">
          <line x1={XA} y1={yBr} x2={xB} y2={yBr}/><line x1={XA} y1={yBr - 6} x2={XA} y2={yBr + 6}/><line x1={xB} y1={yBr - 6} x2={xB} y2={yBr + 6}/></g>
        <text x={(XA + xB) / 2} y={yBr - 7} textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#0f172a">{cache.d ? 'd = ?' : `d = ${C.dTxt(I.d)}`}</text>
        {unitaire}
        {I.nul && <text x={W0 / 2} y={YC - 40} textAnchor="middle" fontSize="14" fontWeight="700" fill="#64748b">Une des charges est nulle : aucune force.</text>}
      </svg>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        Cliquez ou faites glisser sur la scène pour changer la distance d. <span style={{ color: ROUGE, fontWeight: 700 }}>Rouge</span> : force exercée par A sur B.
        {' '}<span style={{ color: ORANGE, fontWeight: 700 }}>Orange</span> : force exercée par B sur A. Les deux flèches ont toujours la même longueur : elle n’est pas proportionnelle à la valeur de la force (les écarts atteignent plusieurs dizaines de puissances de 10).
      </div>
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Interaction gravitationnelle</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(CAS).filter(([, c]) => c.type === 'grav').map(([k, c]) =>
            <button key={k} onClick={() => choisirCas(k)} style={stylePetitBouton(cas === k, '#3f6212')}>{c.icone} {c.nom}</button>)}
        </div>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Interaction électrostatique</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(CAS).filter(([, c]) => c.type === 'elec').map(([k, c]) =>
            <button key={k} onClick={() => choisirCas(k)} style={stylePetitBouton(cas === k, '#7c3aed')}>{c.icone} {c.nom}</button>)}
        </div>
        {Object.entries(C.ch).filter(([, s]) => !s.fixe).map(([k, s]) =>
          <Curseur key={k} nom={k === 'd' ? 'Distance d entre les centres' : k.startsWith('m') ? `Masse de ${k === 'mA' ? C.A : C.B}` : `Charge de ${k === 'qA' ? C.A : C.B}`}
            valeur={p[k]} onChange={v => regler(k, v)} min={s.min} max={s.max} pas={s.pas} unite={s.u} decimales={s.dec} couleur="#7c3aed"/>)}
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Afficher</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setAff(a => ({ ...a, u: !a.u }))} style={stylePetitBouton(aff.u, '#0891b2')}>Vecteur unitaire {UAB}</button>
          <button onClick={() => setAff(a => ({ ...a, double: !a.double }))} style={stylePetitBouton(aff.double, '#0891b2')}>Comparer avec 2d sur la courbe</button>
        </div>
      </>}
      {enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Pendant le défi, les grandeurs sont imposées.</div>}
    </div>);

  const masseTxt = m => `${val(m)}${NB}kg`;
  const chTxt = (k, q) => C.ch[k].u === 'e' ? `${q > 0 ? '+' : '−'}e` : nC(q * 1e9);
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {!cache.d && <LigneMesure nom="Distance entre les centres d" valeur={C.dTxt(I.d)}/>}
      {I.grav && <><LigneMesure nom={`Masse de ${C.A}`} valeur={masseTxt(I.mA)}/><LigneMesure nom={`Masse de ${C.B}`} valeur={masseTxt(I.mB)}/></>}
      {!I.grav && <>
        <LigneMesure nom={`Charge de ${C.A}`} valeur={chTxt('qA', I.qA)} couleur={I.qA > 0 ? ROUGE : BLEU}/>
        {!cache.signeB && <LigneMesure nom={`Charge de ${C.B}`} valeur={chTxt('qB', I.qB)} couleur={I.qB > 0 ? ROUGE : BLEU}/>}</>}
      {!cache.valeurs && <>
        <LigneMesure nom="Nature de l’interaction" valeur={I.nul ? 'aucune' : I.attr ? 'attractive' : 'répulsive'}/>
        <LigneMesure nom={<>Norme de {FAB}</>} valeur={`${val(I.F)}${NB}N`} couleur={ROUGE}/>
        <LigneMesure nom={<>Norme de {FBA}</>} valeur={`${val(I.F)}${NB}N`} couleur={ORANGE}/>
        <LigneMesure nom={<>Sens de {FAB}</>} valeur={I.nul ? '—' : I.attr ? 'vers A' : 'à l’opposé de A'} couleur={ROUGE}/></>}
    </div>);

  const calcul = !cache.valeurs && (
    <div style={{ ...styleBoite, ...cadre('calcul') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Le calcul</div>
      {I.grav ? <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 2.2 }}>
        <div>F = <Frac haut={<>G·m<sub>A</sub>·m<sub>B</sub></>} bas="d²"/> = <Frac haut={`6,674 × 10⁻¹¹ × ${puiss(I.mA)} × ${puiss(I.mB)}`} bas={`(${puiss(I.d)})²`}/> = <strong style={{ color: ROUGE }}>{val(I.F)}{NB}N</strong></div>
      </div> : <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 2.2 }}>
        <div>F = <Frac haut={<>k·|q<sub>A</sub>|·|q<sub>B</sub>|</>} bas="d²"/> = <Frac haut={`9,0 × 10⁹ × ${puiss(Math.abs(I.qA))} × ${puiss(Math.abs(I.qB))}`} bas={`(${puiss(I.d)})²`}/> = <strong style={{ color: ROUGE }}>{val(I.F)}{NB}N</strong></div>
      </div>}
      <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Toutes les grandeurs sont converties en unités SI (kg, C, m).</div>
    </div>);

  const vecteurs = !cache.valeurs && (
    <div style={{ ...styleBoite, ...cadre('vecteurs') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Expression vectorielle</div>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 2 }}>
        {I.grav
          ? <div>{FAB} = −<Frac haut={<>G·m<sub>A</sub>·m<sub>B</sub></>} bas="d²"/>{UAB} : de sens opposé à {UAB}, donc dirigée vers A (attraction).</div>
          : <div>{FAB} = <Frac haut={<>k·q<sub>A</sub>·q<sub>B</sub></>} bas="d²"/>{UAB} : q<sub>A</sub>·q<sub>B</sub> {I.nul ? '= 0' : I.attr ? '< 0' : '> 0'}, donc {I.nul ? 'aucune force' : I.attr ? <>de sens opposé à {UAB} (attraction)</> : <>de même sens que {UAB} (répulsion)</>}.</div>}
        <div>{FBA} = −{FAB} : principe des actions réciproques.</div>
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>{UAB} est le vecteur de norme 1 dirigé de A vers B.</div>
      </div>
    </div>);

  // courbe F(d)
  const graphe = !cache.valeurs && (() => {
    const gw = 330, gh = 190, ml = 54, mr = 14, mt = 14, mb = 34;
    const Fd = pd => interaction(cas, { ...p, d: pd }).F;
    const Fmax = Fd(dc.min), pts = [];
    for (let i = 0; i <= 60; i++) { const pd = dc.min + (dc.max - dc.min) * i / 60; pts.push(pd); }
    const X = pd => ml + (gw - ml - mr) * (pd - dc.min) / (dc.max - dc.min), Y = F => mt + (gh - mt - mb) * (1 - F / Fmax);
    const d2 = p.d * 2, a2 = aff.double && d2 <= dc.max;
    return (
      <div style={{ ...styleBoite, ...cadre('graphe') }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Courbe de la force en fonction de d</div>
        <svg viewBox={`0 0 ${gw} ${gh}`} style={{ width: '100%', maxWidth: 400, display: 'block', margin: '0 auto' }} role="img" aria-label="Norme de la force en fonction de la distance entre les centres">
          <line x1={ml} y1={mt} x2={ml} y2={gh - mb} stroke="#0f172a" strokeWidth="1.4"/><line x1={ml} y1={gh - mb} x2={gw - mr} y2={gh - mb} stroke="#0f172a" strokeWidth="1.4"/>
          <polyline fill="none" stroke="#7c3aed" strokeWidth="2.2" points={pts.map(pd => `${X(pd).toFixed(1)},${Y(Fd(pd)).toFixed(1)}`).join(' ')}/>
          {a2 && <g><line x1={X(d2)} y1={Y(Fd(d2))} x2={X(d2)} y2={gh - mb} stroke="#0891b2" strokeDasharray="4 3"/><circle cx={X(d2)} cy={Y(Fd(d2))} r="4.5" fill="#0891b2"/>
            <text x={X(d2) - 6} y={Y(Fd(d2)) - 8} textAnchor="end" fontSize="11" fill="#0e7490" fontWeight="700">2d : {val(Fd(d2), 2)}{NB}N</text></g>}
          <line x1={X(p.d)} y1={Y(I.F)} x2={X(p.d)} y2={gh - mb} stroke={ROUGE} strokeDasharray="4 3"/><circle cx={X(p.d)} cy={Y(I.F)} r="5" fill={ROUGE}/>
          <text x={Math.min(gw - mr, X(p.d) + 8)} y={Math.max(mt + 10, Y(I.F) - 8)} textAnchor="start" fontSize="11" fill={ROUGE} fontWeight="700">d : {val(I.F, 2)}{NB}N</text>
          <text x={ml - 4} y={mt + 4} textAnchor="end" fontSize="10" fill="#334155">{val(Fmax, 2)}</text><text x={ml - 4} y={gh - mb} textAnchor="end" fontSize="10" fill="#334155">0</text>
          <text x={ml} y={gh - mb + 14} textAnchor="middle" fontSize="10.5" fill="#334155">{fmt(dc.min, dc.dec)}</text><text x={gw - mr} y={gh - mb + 14} textAnchor="end" fontSize="10.5" fill="#334155">{fmt(dc.max, dc.dec)}</text>
          <text x={(ml + gw - mr) / 2} y={gh - 6} textAnchor="middle" fontSize="11.5" fill="#0f172a" fontWeight="700">d ({dc.u})</text>
          <text x="10" y={gh / 2 - 8} fontSize="11.5" fill="#0f172a" fontWeight="700" transform={`rotate(-90 10 ${gh / 2 - 8})`} textAnchor="middle">F (N)</text>
        </svg>
      </div>);
  })();

  // atome : comparaison des deux interactions
  const comparer = cas === 'atome' && (
    <div style={{ ...styleBoite, ...cadre('compar') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Comparer les deux interactions</div>
      <LigneMesure nom="Force électrostatique proton–électron" valeur={`${val(I.F)}${NB}N`} couleur={ROUGE}/>
      <LigneMesure nom="Force de gravitation proton–électron" valeur={`${val(G * M_P * M_E / (I.d * I.d))}${NB}N`} couleur={VERT}/>
      <LigneMesure nom="Rapport F_élec / F_grav" valeur={puiss(K * E_CH ** 2 / (G * M_P * M_E), 2)} couleur="#7c3aed"/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>m<sub>proton</sub> = 1,673 × 10⁻²⁷ kg ; m<sub>électron</sub> = 9,109 × 10⁻³¹ kg. Le rapport ne dépend pas de la distance : les deux forces varient en 1/d².</div>
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Corps à symétrie sphérique</strong> : chaque corps est assimilé à un point, placé en son centre, où se concentrent sa masse (ou sa charge). La distance d est mesurée entre les centres. C’est exact pour une boule homogène, et une très bonne approximation quand d est grande devant les rayons.</li>
      <li><strong>Deux corps seulement</strong> : on néglige tous les autres. Pour Terre–Lune, on ignore donc l’attraction du Soleil ; pour le satellite, celle de la Lune.</li>
      <li><strong>Valeurs utilisées</strong> : G = 6,674 × 10⁻¹¹ N·m²·kg⁻² ; M<sub>T</sub> = 5,972 × 10²⁴ kg ; M<sub>Lune</sub> = 7,35 × 10²² kg ; M<sub>Soleil</sub> = 1,989 × 10³⁰ kg ; station spatiale de 420 t. La distance Terre–Lune (orbite elliptique) varie de 3,6 à 4,1 × 10⁸ m autour de 3,84 × 10⁸ m ; la distance Terre–Soleil varie de 1,47 à 1,52 × 10¹¹ m.</li>
      <li><strong>Charges ponctuelles, au repos</strong> : k = 9,0 × 10⁹ N·m²·C⁻² (valeur dans le vide, très proche de celle dans l’air). Pour des boules conductrices proches, les charges se redistribuent à leur surface (phénomène d’influence) et le modèle devient moins bon : on suppose d grand devant les rayons.</li>
      <li><strong>Atome d’hydrogène</strong> : modèle planétaire du cours (électron en orbite circulaire de rayon 53 pm autour d’un proton). Ce modèle classique ne décrit pas correctement l’atome (il faut la physique quantique), mais l’ordre de grandeur de la force est le bon.</li>
      <li><strong>Représentation</strong> : les corps ne sont pas dessinés à l’échelle, et la distance affichée sur la scène est celle du curseur. Les flèches de force ont toutes la même longueur.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec les deux élèves, doublez une masse puis les deux : comment varie F ? Et si vous doublez la distance ?</li>
        <li>Terre – Lune : lisez les deux forces. Sont-elles égales ? Pourtant, laquelle des deux fait le plus varier le mouvement de son corps ?</li>
        <li>Avec les deux boules, passez de q<sub>B</sub> = +10 nC à −10 nC : qu’est-ce qui change dans le calcul de la norme ? et sur la scène ?</li>
        <li>Activez « Comparer avec 2d » et vérifiez que F est divisée par 4, pour n’importe quelle distance de départ.</li>
        <li>Dans l’atome, à quelle distance faudrait-il placer deux protons pour que la force électrostatique soit égale à celle entre deux élèves à 1 m ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>{FAB} = −{FBA} : même direction, même norme, sens opposés</li>
        <li>gravitation : F = G·m<sub>A</sub>·m<sub>B</sub> / d² (toujours attractive) ; Coulomb : F = k·|q<sub>A</sub>|·|q<sub>B</sub>| / d² (attractive si q<sub>A</sub>·q<sub>B</sub> {'<'} 0)</li>
        <li>dans les deux cas : F ∝ 1/d² (d doublée → F divisée par 4)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .dc-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .dc-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .dc-l1.cote, .dc-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Deux corps en interaction : gravitation et Coulomb</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Deux corps A et B qui interagissent à distance exercent l’un sur l’autre deux forces {FAB} et {FBA}, de même norme et de sens opposés.
        La norme dépend des masses (gravitation) ou des charges (électrostatique) et varie comme 1/d².</div>
      <div className={`dc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}>
            <VoletDefi defi={defi} setDefi={setDefi} changerType={lancerDefi} placer={d => regler('d', d)}/></div>}
          <div className={`dc-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      <div className="dc-l2">{calcul}{vecteurs}{graphe}{comparer}</div>
      {!enDefi && <div className="dc-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="dc-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
