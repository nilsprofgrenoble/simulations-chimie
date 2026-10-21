import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, Frac, fmt, lireProgression } from "../commun";
import { NB } from "./Distillation";

// ====================================================
//  SIM 50 — CONDENSATEUR PLAN ET GOUTTELETTE DE MILLIKAN : champ uniforme E = U/d, force F = q·E, poids P = m·g,
//  équilibre d’une gouttelette d’huile chargée, quantification de la charge (1G, chapitre 8)
// ====================================================

const E_CH = 1.602e-19, RHO = 886, GPES = 9.81;                    // charge élémentaire, masse volumique de l’huile, intensité de la pesanteur
const SIM = 50;
const W0 = 600, H0 = 340, YC = 170, XP1 = 70, XP2 = 530;           // scène : plaques de x = 70 à 530
const VERT = '#16a34a', ROUGE = '#dc2626', BLEU = '#2563eb', GRIS = '#64748b';

declarerDefis(SIM, [
  ['champ', 'Champ et force dans un condensateur'],
  ['equilibre', 'Tension d’équilibre d’une gouttelette'],
  ['millikan', 'Retrouver la charge d’une gouttelette'],
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
const chargeTxt = n => n === 0 ? '0' : `${n > 0 ? '+' : '−'}${Math.abs(n) === 1 ? '' : Math.abs(n)}e`;
const masseGoutte = r => RHO * 4 / 3 * Math.PI * (r * 1e-6) ** 3;       // r en µm

// Un vecteur avec sa flèche au-dessus (dans le texte HTML)
function Vec({ children }) {
  return <span style={{ position: 'relative', display: 'inline-block', paddingTop: '0.25em' }}>{children}
    <span aria-hidden="true" style={{ position: 'absolute', top: '-0.45em', left: 0, right: 0, textAlign: 'center', fontSize: '0.75em', lineHeight: 1 }}>→</span></span>;
}

// ---------- dessin ----------
// Flèche verticale de (x, y) : dir = +1 vers le bas de l’écran, −1 vers le haut
function flecheV(x, y, dir, len, col, ep = 3, cle) {
  const y2 = y + dir * len, t = Math.min(10, Math.max(4, len * 0.4)), w = t * 0.55, by = y2 - dir * t;
  return <g key={cle}>
    {len > t && <line x1={x} y1={y} x2={x} y2={by} stroke={col} strokeWidth={ep} strokeLinecap="round"/>}
    <path d={`M${x},${y2} L${x - w},${by} L${x + w},${by} z`} fill={col}/></g>;
}
// Nom d’un vecteur dans le SVG, avec sa flèche dessinée au-dessus (la flèche combinante ne s’affiche pas partout)
function etiquetteVec(x, y, txt, col, cle, taille = 14) {
  const w = taille * 0.42, h = y - taille * 0.95;
  return <g key={cle}><text x={x} y={y} textAnchor="middle" fontSize={taille} fontWeight="800" fill={col}>{txt}</text>
    <line x1={x - w} y1={h} x2={x + w - 2} y2={h} stroke={col} strokeWidth="1.4"/><path d={`M${x + w + 1},${h} l-4.5,-2.6 l0,5.2 z`} fill={col}/></g>;
}

// ---------- tirages des défis ----------
const tire = t => t[Math.floor(Math.random() * t.length)];
function nouveauDefi(type) {
  if (type === 'champ') {
    return { type, pol: tire(['haut+', 'haut-']), U: tire([200, 300, 400, 500, 600, 800, 1000, 1500, 2000]), d: tire([0.5, 1, 1.5, 2, 2.5, 3]),
      n: tire([1, 2, 3, 4, 5]) * tire([1, -1]), reps: {}, verifie: false };
  }
  let r, n, d, U, m;
  do {
    r = tire([0.8, 1.0, 1.2]); n = tire([1, 2, 3, 4, 5]) * tire([1, -1]); d = tire([1.0, 1.5, 2.0]);
    m = masseGoutte(r); U = m * GPES * d * 1e-2 / (Math.abs(n) * E_CH);
  } while (U < 300 || U > 4800);
  if (type === 'equilibre') return { type, r, n, d, m, reps: {}, verifie: false };
  const nv = tire([1, 2, 3, 4, 5, 6, 7, 8]);
  do {
    r = tire([0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3]); d = tire([1.0, 1.5, 2.0]); m = masseGoutte(r);
    U = Math.round(m * GPES * d * 1e-2 / (nv * E_CH) * (1 + (Math.random() - 0.5) * 0.02));
  } while (U < 250 || U > 4900);
  return { type, r, d, m, U, nv, reps: {}, verifie: false };
}
const TITRES_DEFIS = { champ: 'Champ et force', equilibre: 'Tension d’équilibre', millikan: 'Charge de la gouttelette' };
const m15 = m => `${fmt(m * 1e15, 2)} × 10⁻¹⁵${NB}kg`;

// Volet du défi : monté seulement en mode défi, il enregistre essais, corrections vues et réussite sur le compte de l’élève
function VoletDefi({ defi, setDefi, changerType, appliquer }) {
  const cle = `${SIM}:defi.${defi.type}`;
  const res = (() => {
    if (!defi.verifie) return null;
    const r = defi.reps;
    if (defi.type === 'champ') {
      const E = defi.U / (defi.d * 1e-2), F = Math.abs(defi.n) * E_CH * E, haut = (defi.n < 0) === (defi.pol === 'haut+');
      const e = lireNombre(r.E), f = lireNombre(r.F);
      const okE = isFinite(e) && proche(e, E, 0.01), okF = isFinite(f) && proche(f, F, 0.02), okS = r.sens === (haut ? 'haut' : 'bas');
      let mE = okE ? 'Champ correct.' : 'Champ : E = U / d, avec d en mètres.';
      if (!okE && isFinite(e) && proche(e, E / 100, 0.02)) mE = 'Convertissez d en mètres : 1 cm = 10⁻² m.';
      let mF = okF ? 'Force correcte.' : 'Force : F = |q| × E, avec |q| = n × e et e = 1,602 × 10⁻¹⁹ C.';
      if (!okF && isFinite(f) && proche(f, Math.abs(defi.n) * E, 0.05)) mF = 'Il manque la charge élémentaire : |q| = n × e = n × 1,602 × 10⁻¹⁹ C.';
      else if (!okF && isFinite(f) && proche(f, E_CH * E, 0.05)) mF = 'La charge n’est pas e, mais n × e (n est le nombre indiqué dans l’énoncé).';
      return { ok: okE && okF && okS, lignes: [[okE, mE], [okF, mF],
        [okS, okS ? 'Sens de la force correct.' : 'Sens : le champ va de la plaque + vers la plaque −. La force est de même sens que E si q > 0, de sens opposé si q < 0.']] };
    }
    if (defi.type === 'equilibre') {
      const Ueq = defi.m * GPES * defi.d * 1e-2 / (Math.abs(defi.n) * E_CH), hautPlus = defi.n < 0;
      const u = lireNombre(r.U), okU = isFinite(u) && proche(u, Ueq, 0.015), okP = r.pol === (hautPlus ? 'haut+' : 'haut-');
      let mU = okU ? 'Tension correcte.' : 'Tension : à l’équilibre F = P, donc |q|·U / d = m·g, d’où U = m·g·d / |q|.';
      if (!okU && isFinite(u) && proche(u, Ueq * 100, 0.03)) mU = 'Convertissez d en mètres : 1 cm = 10⁻² m.';
      return { ok: okU && okP, lignes: [[okU, mU],
        [okP, okP ? 'Polarité correcte.' : 'Polarité : la force électrique doit être vers le haut (pour équilibrer le poids). Pour q < 0, F est de sens opposé à E : E doit donc aller vers le bas, la plaque du haut est positive. Pour q > 0, c’est l’inverse.']] };
    }
    const q = defi.m * GPES * defi.d * 1e-2 / defi.U;
    const qa = lireNombre(r.q), na = lireNombre(r.n);
    const okQ = isFinite(qa) && proche(qa * 1e-19, q, 0.025), okN = isFinite(na) && na === defi.nv;
    let mQ = okQ ? 'Charge correcte.' : 'Charge : à l’équilibre |q|·U / d = m·g, donc |q| = m·g·d / U, avec d en mètres. Exprimez-la en 10⁻¹⁹ C.';
    if (!okQ && isFinite(qa) && proche(qa, q, 0.025)) mQ = 'La valeur est juste, mais en coulomb : la réponse est demandée en 10⁻¹⁹ C (divisez par 10⁻¹⁹).';
    return { ok: okQ && okN, lignes: [[okQ, mQ],
      [okN, okN ? 'Nombre de charges élémentaires correct.' : 'n = |q| / e : divisez par e = 1,602 × 10⁻¹⁹ C. Le résultat doit être un nombre entier : arrondissez à l’entier le plus proche.']] };
  })();
  const reussi = !!res && res.ok;
  const suivi = useSuivi(cle, reussi);
  const solution = !!defi.solution;
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const verifier = () => {
    suivi.essai();
    setDefi(d => ({ ...d, verifie: true }));
    if (defi.type === 'equilibre') { const u = lireNombre(defi.reps.U); appliquer(defi.reps.pol, isFinite(u) ? u : null); }
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
      {defi.type === 'champ' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>🎯 Défi : champ et force dans un condensateur</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Entre deux plaques distantes de <strong>{fmt(defi.d, 1)}{NB}cm</strong>, on applique la tension <strong>U = {fmt(defi.U, 0)}{NB}V</strong> ; la plaque du haut est
          {defi.pol === 'haut+' ? ' positive' : ' négative'}. Une gouttelette porte la charge <strong>q = {chargeTxt(defi.n)}</strong> (e = 1,602 × 10⁻¹⁹ C). Donnez la norme du champ E,
          la norme de la force électrique F, puis son sens.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saisie('E', 'N·C⁻¹', 'Champ E')}
          {saisie('F', 'N', 'Force F')}
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>La force électrique est dirigée…</div>
          {choix('sens', [['haut', 'vers le haut'], ['bas', 'vers le bas']])}
        </div>
      </>}
      {defi.type === 'equilibre' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>🎯 Défi : immobiliser la gouttelette</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Une gouttelette d’huile de masse <strong>m = {m15(defi.m)}</strong> porte la charge <strong>q = {chargeTxt(defi.n)}</strong>. Les plaques sont distantes de <strong>{fmt(defi.d, 1)}{NB}cm</strong>.
          Quelle plaque doit être positive, et quelle tension U faut-il appliquer pour que la gouttelette reste immobile ? Données : g = 9,81 N·kg⁻¹, e = 1,602 × 10⁻¹⁹ C.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>La plaque positive est…</div>
          {choix('pol', [['haut+', 'la plaque du haut'], ['haut-', 'la plaque du bas']])}
          {saisie('U', 'V', 'Tension U')}
        </div>
      </>}
      {defi.type === 'millikan' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>🎯 Défi : la charge mesurée</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }}>
          Comme Millikan, on immobilise une gouttelette d’huile de masse <strong>m = {m15(defi.m)}</strong> entre deux plaques distantes de <strong>{fmt(defi.d, 1)}{NB}cm</strong> : elle est immobile pour
          <strong> U = {fmt(defi.U, 0)}{NB}V</strong>. Calculez la valeur absolue de sa charge, puis le nombre n de charges élémentaires qu’elle porte. Données : g = 9,81 N·kg⁻¹, e = 1,602 × 10⁻¹⁹ C.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saisie('q', '× 10⁻¹⁹ C', '|q|')}
          {saisie('n', '', 'n = |q| / e')}
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
        {defi.type === 'champ' && (() => { const E = defi.U / (defi.d * 1e-2), F = Math.abs(defi.n) * E_CH * E, haut = (defi.n < 0) === (defi.pol === 'haut+'); return <>
          E = <Frac haut="U" bas="d"/> = <Frac haut={fmt(defi.U, 0)} bas={`${fmt(defi.d, 1)} × 10⁻²`}/> = {puiss(E)}{NB}N·C⁻¹. F = |q| × E = {Math.abs(defi.n)} × 1,602 × 10⁻¹⁹ × {puiss(E)} = {puiss(F)}{NB}N.
          {' '}Le champ est dirigé vers {defi.pol === 'haut+' ? 'le bas' : 'le haut'} (de la plaque + vers la plaque −) ; comme q {defi.n < 0 ? '< 0' : '> 0'}, la force est de sens {defi.n < 0 ? 'opposé à' : 'identique à'} E : elle est dirigée vers {haut ? 'le haut' : 'le bas'}.</>; })()}
        {defi.type === 'equilibre' && (() => { const Ueq = defi.m * GPES * defi.d * 1e-2 / (Math.abs(defi.n) * E_CH); return <>
          Pour être immobile, la gouttelette doit avoir F = P, avec F vers le haut. Comme q {defi.n < 0 ? '< 0' : '> 0'}, il faut que E soit dirigé vers {defi.n < 0 ? 'le bas' : 'le haut'} : la plaque du {defi.n < 0 ? 'haut' : 'bas'} est positive.
          {' '}|q|·U / d = m·g donc U = <Frac haut="m·g·d" bas="|q|"/> = <Frac haut={`${puiss(defi.m)} × 9,81 × ${fmt(defi.d, 1)} × 10⁻²`} bas={`${Math.abs(defi.n)} × 1,602 × 10⁻¹⁹`}/> ≈ {fmt(Ueq, 0)}{NB}V.</>; })()}
        {defi.type === 'millikan' && (() => { const q = defi.m * GPES * defi.d * 1e-2 / defi.U; return <>
          |q| = <Frac haut="m·g·d" bas="U"/> = <Frac haut={`${puiss(defi.m)} × 9,81 × ${fmt(defi.d, 1)} × 10⁻²`} bas={fmt(defi.U, 0)}/> = {puiss(q)}{NB}C = {fmt(q * 1e19, 2)} × 10⁻¹⁹{NB}C.
          {' '}n = |q| / e = {fmt(q * 1e19, 2)} × 10⁻¹⁹ / 1,602 × 10⁻¹⁹ = {fmt(q / E_CH, 2)} ≈ {defi.nv} : la charge est bien un multiple entier de la charge élémentaire.</>; })()}
      </div>}
    </div>);
}

export function SimulationCondensateurMillikan() {
  const [mode, setMode] = useState(() => modeOuverture('condensateur-millikan-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('condensateur-millikan-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [pol, setPol] = useState('haut+');                    // 'haut+' : la plaque du haut est positive
  const [U, setU] = useState(500);
  const [d, setD] = useState(2);                              // cm
  const [r, setR] = useState(1);                              // µm
  const [n, setN] = useState(-3);                             // charge de la gouttelette : q = n·e
  const [M, setM] = useState({ x: 0.5, y: 0.45 });            // position de M dans l’entrefer (fractions de la largeur et de la hauteur)
  const [aff, setAff] = useState({ grille: true, lignes: true });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi;
  const svgRef = useRef(null), glisse = useRef(false);

  // ---------- physique ----------
  const dm = d * 1e-2, E = U / dm;
  const Ebas = pol === 'haut+';                               // le champ va de la plaque + vers la plaque −
  const q = n * E_CH, m = masseGoutte(r), P = m * GPES, F = Math.abs(q) * E;
  const Fhaut = n !== 0 && (n < 0) === Ebas;                  // la force électrique est vers le haut
  const Fy = n === 0 ? 0 : Fhaut ? F : -F;                    // composante verticale (vers le haut > 0)
  const equilibre = Fhaut && Math.abs(F - P) / P < 0.01;
  const resultante = equilibre ? 'équilibre' : Fy - P > 0 ? 'vers le haut' : 'vers le bas';
  const Ueq = n !== 0 ? m * GPES * dm / Math.abs(q) : NaN;
  const cache = enDefi ? { valeurs: true, fleches: defi.type !== 'equilibre' || !defi.verifie } : {};

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const mG = masseGoutte(1), PG = mG * GPES, EG = 500 / 0.02, FG = 3 * E_CH * EG, UeqG = PG * 0.02 / (3 * E_CH);
  const qMill = PG * 0.02 / 2270;
  const base = { pol: 'haut+', U: 500, d: 2, r: 1, n: -3 };
  const okBase = pol === 'haut+' && U === 500 && Math.abs(d - 2) < 0.01 && r === 1 && n === -3;
  const okE = U === 500 && Math.abs(d - 2) < 0.01;
  const aBase = () => { setPol(base.pol); setU(base.U); setD(base.d); setR(base.r); setN(base.n); setM({ x: 0.5, y: 0.45 }); };
  const ETAPES = [
    { id: 'idee', titre: 'Deux plaques parallèles', focus: ['scene'],
      texte: <>Deux plaques métalliques parallèles, portant des charges opposées, forment un <strong>condensateur plan</strong>. On applique entre elles une tension U (en volt) ;
        elles sont séparées par la distance d. Un champ électrostatique <Vec>E</Vec> existe entre les plaques (petites flèches grises et traits bleus).</>,
      tache: { type: 'qcm', q: 'Entre les plaques, le champ électrostatique…', options: ['est perpendiculaire aux plaques et identique en tous les points : il est uniforme', 'est parallèle aux plaques', 'est plus fort près de la plaque positive que près de la plaque négative'], bonne: 0,
        expl: 'Entre les deux plaques, le champ est perpendiculaire aux plaques, et son vecteur est le même (direction, sens, norme) en tout point : on dit qu’il est uniforme.' } },
    { id: 'sens', titre: 'Le sens du champ', focus: ['reglages', 'scene'],
      texte: <>Mettez la plaque du <strong>haut</strong> au potentiel positif (bouton « Plaque du haut + »).</>,
      tache: { type: 'action', ok: pol === 'haut+', label: 'Plaque du haut positive', faire: () => setPol('haut+'), consigne: 'Plaque du haut positive' } },
    { id: 'sensE', titre: 'De la plaque + vers la plaque −', focus: ['scene'],
      texte: <>Observez les flèches.</>,
      tache: { type: 'qcm', q: 'Avec la plaque du haut positive, le champ est dirigé…', options: ['vers le bas, de la plaque positive vers la plaque négative', 'vers le haut, de la plaque négative vers la plaque positive', 'horizontalement'], bonne: 0,
        expl: 'Le champ électrostatique est toujours dirigé de la plaque chargée + vers la plaque chargée −.' } },
    { id: 'regler', titre: 'Régler la tension et la distance', focus: ['reglages'],
      texte: <>Réglez la tension sur <strong>U = 500 V</strong> et la distance entre les plaques sur <strong>d = 2,0 cm</strong>.</>,
      tache: { type: 'action', ok: okE, label: 'U = 500 V, d = 2,0 cm', faire: () => { setU(500); setD(2); }, consigne: 'U = 500 V et d = 2,0 cm' } },
    { id: 'calculE', titre: 'La norme du champ', focus: ['calcul', 'mesures'],
      texte: <>La norme du champ uniforme est <strong>E = U / d</strong>, avec U en volt et d en <strong>mètre</strong> ; E s’exprime alors en V·m⁻¹ (ou N·C⁻¹). Calculez-la avant de lire la mesure.</>,
      tache: { type: 'num', q: 'Norme du champ E pour U = 500 V et d = 2,0 cm', unite: 'N·C⁻¹', vrai: EG, tol: 0.01, affiche: v => fmt(v, 0),
        bloque: okE ? null : 'Réglez d’abord U = 500 V et d = 2,0 cm (étape précédente).',
        pieges: [[500 / 2, 'Convertissez d en mètres : 2,0 cm = 2,0 × 10⁻² m.']],
        expl: 'E = U / d = 500 / (2,0 × 10⁻²) = 2,5 × 10⁴ N·C⁻¹ (ou V·m⁻¹).' } },
    { id: 'unif', titre: 'Un champ uniforme', focus: ['scene', 'mesures'],
      texte: <>Faites glisser le point M (la gouttelette) à différents endroits entre les plaques, en regardant la mesure « Champ E en M ».</>,
      tache: { type: 'qcm', q: 'Quand M se déplace entre les plaques, la norme de E…', options: ['ne change pas : le champ est le même en tout point', 'augmente en se rapprochant de la plaque positive', 'diminue quand M s’éloigne du milieu'], bonne: 0,
        expl: 'E = U / d ne dépend pas de la position de M entre les plaques : c’est ce qui définit un champ uniforme. (Près des bords des plaques, le champ réel se déforme : le modèle les néglige.)' } },
    { id: 'dMoitie', titre: 'On rapproche les plaques', focus: ['reglages', 'mesures'],
      texte: <>Gardez U = 500 V et réglez maintenant <strong>d = 1,0 cm</strong>.</>,
      tache: { type: 'action', ok: U === 500 && Math.abs(d - 1) < 0.01, label: 'U = 500 V, d = 1,0 cm', faire: () => { setU(500); setD(1); }, consigne: 'U = 500 V et d = 1,0 cm' } },
    { id: 'effetD', titre: 'Effet de la distance', focus: ['mesures', 'calcul'],
      texte: <>Comparez avec le champ obtenu pour d = 2,0 cm (2,5 × 10⁴ N·C⁻¹).</>,
      tache: { type: 'qcm', q: 'À tension constante, quand la distance d est divisée par 2, la norme de E est…', options: ['multipliée par 2', 'divisée par 2', 'inchangée'], bonne: 0,
        expl: 'E = U / d : à U constant, E est inversement proportionnelle à d. Deux fois plus près, deux fois plus de champ.' } },
    { id: 'objet', titre: 'Une gouttelette chargée', focus: ['reglages', 'scene'],
      texte: <>Entre les plaques, on place une gouttelette d’huile de rayon <strong>1,0 µm</strong> qui porte une charge négative <strong>q = −3e</strong> (e = 1,602 × 10⁻¹⁹ C). Remettez aussi U = 500 V, d = 2,0 cm, plaque du haut positive.</>,
      tache: { type: 'action', ok: okBase, label: 'Gouttelette q = −3e, U = 500 V, d = 2,0 cm', faire: aBase, consigne: 'r = 1,0 µm, q = −3e, U = 500 V, d = 2,0 cm, plaque du haut +' } },
    { id: 'calculF', titre: 'La force électrique', focus: ['calcul'],
      texte: <>La gouttelette placée dans le champ <Vec>E</Vec> subit la force <Vec>F</Vec> = q·<Vec>E</Vec>, de norme <strong>F = |q|·E</strong>. Calculez-la.</>,
      tache: { type: 'num', q: 'Norme de la force électrique sur la gouttelette', unite: 'N', vrai: FG, tol: 0.02, affiche: v => puiss(v, 2), cs: 2,
        bloque: okBase ? null : 'Réglez d’abord la gouttelette et les plaques (étape précédente).',
        pieges: [[E_CH * EG, 'La charge n’est pas e mais 3e : |q| = 3 × 1,602 × 10⁻¹⁹ C.'], [3 * EG, 'Il manque la charge élémentaire : |q| = 3 × e = 3 × 1,602 × 10⁻¹⁹ C.']],
        expl: 'F = |q|·E = 3 × 1,602 × 10⁻¹⁹ × 2,5 × 10⁴ ≈ 1,2 × 10⁻¹⁴ N.' } },
    { id: 'sensF', titre: 'Le sens de la force', focus: ['scene'],
      texte: <>Observez la flèche rouge.</>,
      tache: { type: 'qcm', q: 'Pour une charge négative, la force F = q·E est…', options: ['de sens opposé à E : ici vers le haut', 'de même sens que E : ici vers le bas', 'horizontale'], bonne: 0,
        expl: 'q < 0 : F = q·E est de sens opposé à E. Le champ est vers le bas, donc la force est vers le haut.' } },
    { id: 'calculP', titre: 'Le poids de la gouttelette', focus: ['calcul', 'mesures'],
      texte: <>La gouttelette a aussi un poids <Vec>P</Vec> = m·<Vec>g</Vec>, avec g = 9,81 N·kg⁻¹. Lisez sa masse m dans « Mesures » et calculez la norme P.</>,
      tache: { type: 'num', q: 'Poids de la gouttelette (r = 1,0 µm)', unite: 'N', vrai: PG, tol: 0.02, affiche: v => puiss(v, 2), cs: 2,
        pieges: [[mG, 'Le poids est une force en newton : P = m × g.']],
        expl: 'P = m·g = 3,71 × 10⁻¹⁵ × 9,81 ≈ 3,6 × 10⁻¹⁴ N, dirigé vers le bas.' } },
    { id: 'bilan', titre: 'Qui l’emporte ?', focus: ['scene', 'mesures'],
      texte: <>Comparez les longueurs des flèches rouge (force électrique) et bleue (poids) : elles sont à la même échelle l’une par rapport à l’autre.</>,
      tache: { type: 'qcm', q: 'Avec U = 500 V, la résultante des deux forces est…', options: ['dirigée vers le bas : le poids l’emporte, la gouttelette descend', 'dirigée vers le haut : la gouttelette monte', 'nulle : la gouttelette reste immobile'], bonne: 0,
        expl: 'F ≈ 1,2 × 10⁻¹⁴ N est trois fois plus petite que P ≈ 3,6 × 10⁻¹⁴ N : la résultante est vers le bas.' } },
    { id: 'calculUeq', titre: 'Quelle tension pour l’équilibre ?', focus: ['calcul'],
      texte: <>Pour que la gouttelette reste immobile, il faut que la force électrique compense exactement le poids : <strong>F = P</strong>, soit |q|·U / d = m·g. Calculez la tension U correspondante (d = 2,0 cm).</>,
      tache: { type: 'num', q: 'Tension U qui immobilise la gouttelette', unite: 'V', vrai: UeqG, tol: 0.01, affiche: v => fmt(v, 0),
        pieges: [[UeqG * 100, 'Convertissez d en mètres : 2,0 cm = 2,0 × 10⁻² m.'], [UeqG / 3, 'La charge est 3e, pas e : |q| = 3 × 1,602 × 10⁻¹⁹ C.']],
        expl: 'U = m·g·d / |q| = 3,71 × 10⁻¹⁵ × 9,81 × 2,0 × 10⁻² / (3 × 1,602 × 10⁻¹⁹) ≈ 1,5 × 10³ V.' } },
    { id: 'equilibre', titre: 'Vérifier avec la simulation', focus: ['reglages', 'scene', 'mesures'],
      texte: <>Réglez la tension sur la valeur calculée (à 1 % près) et vérifiez que les flèches rouge et bleue ont la même longueur.</>,
      tache: { type: 'action', ok: equilibre && pol === 'haut+' && Math.abs(d - 2) < 0.01 && r === 1 && n === -3, label: 'Régler U pour l’équilibre', faire: () => { aBase(); setU(Math.round(UeqG / 10) * 10); },
        consigne: 'Réglez U pour que la gouttelette soit en équilibre (F = P)' } },
    { id: 'millikanIdee', titre: 'L’expérience de Millikan', focus: [],
      texte: <>En 1909-1913, Robert Millikan a utilisé cette méthode : il immobilisait des gouttelettes d’huile entre deux plaques, et calculait leur charge |q| = m·g·d / U. Il a mesuré des centaines de gouttelettes.</>,
      tache: { type: 'qcm', q: 'Qu’a-t-il découvert sur les charges mesurées ?', options: ['elles sont toutes des multiples entiers d’une même valeur, la charge élémentaire e', 'elles prennent toutes les valeurs possibles', 'elles sont toutes égales'], bonne: 0,
        expl: 'Les charges mesurées étaient toujours des multiples entiers d’une valeur e ≈ 1,6 × 10⁻¹⁹ C : la charge électrique est quantifiée.' } },
    { id: 'millikanQ', titre: 'Calculer une charge', focus: ['millikan'],
      texte: <>Une gouttelette de masse 3,71 × 10⁻¹⁵ kg est immobile pour U = 2 270 V, avec d = 2,0 cm. Calculez la valeur absolue de sa charge : |q| = m·g·d / U.</>,
      tache: { type: 'num', q: '|q| de la gouttelette', unite: '× 10⁻¹⁹ C', vrai: qMill * 1e19, tol: 0.015, affiche: v => fmt(v, 2),
        pieges: [[qMill * 1e19 * 100, 'Convertissez d en mètres : 2,0 cm = 2,0 × 10⁻² m.'], [qMill, 'Exprimez la réponse en 10⁻¹⁹ C : 3,2 × 10⁻¹⁹ C s’écrit « 3,2 ».']],
        expl: '|q| = 3,71 × 10⁻¹⁵ × 9,81 × 2,0 × 10⁻² / 2 270 ≈ 3,2 × 10⁻¹⁹ C.' } },
    { id: 'millikanN', titre: 'Combien de charges élémentaires ?', focus: ['millikan'],
      texte: <>Divisez |q| par la charge élémentaire e = 1,602 × 10⁻¹⁹ C.</>,
      tache: { type: 'num', q: 'n = |q| / e (nombre entier)', unite: '', vrai: 2, tol: 0.05, affiche: v => fmt(v, 0),
        pieges: [[3.2, 'Divisez par e = 1,602 × 10⁻¹⁹ C : |q| / e.']],
        expl: 'n = 3,2 × 10⁻¹⁹ / 1,602 × 10⁻¹⁹ ≈ 2,0 : la gouttelette porte deux charges élémentaires (q = ±2e). Un résultat comme 2,4 serait impossible : n est entier.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>entre deux plaques parallèles chargées, le champ est <strong>uniforme</strong> : perpendiculaire aux plaques, de la plaque + vers la plaque −, de norme E = U / d</li>
        <li>une charge q y subit la force <Vec>F</Vec> = q·<Vec>E</Vec> : F = |q|·E ; sens de <Vec>E</Vec> si q {'>'} 0, opposé si q {'<'} 0</li>
        <li>une gouttelette est immobile si <Vec>F</Vec> + <Vec>P</Vec> = <Vec>0</Vec> : F vers le haut et F = P, soit |q|·U / d = m·g</li>
        <li>les charges mesurées sont des multiples entiers de e = 1,602 × 10⁻¹⁹ C</li></ul>,
      texte: <>Vous savez décrire le champ d’un condensateur plan, la force qu’il exerce sur une charge, et l’utiliser comme Millikan. Essayez maintenant les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function lancerDefi(type) {
    const dd = nouveauDefi(type);
    setDefi(dd);
    setM({ x: 0.5, y: 0.45 });
    if (type === 'champ') { setPol(dd.pol); setU(dd.U); setD(dd.d); setN(dd.n); setR(1); }
    else if (type === 'equilibre') { setPol('haut+'); setU(0); setD(dd.d); setN(dd.n); setR(dd.r); }
    else { setPol('haut+'); setU(dd.U); setD(dd.d); setN(-dd.nv); setR(dd.r); }
  }
  function appliquer(p, u) {
    if (p) setPol(p);
    if (u != null) setU(Math.max(0, Math.min(5000, Math.round(u / 10) * 10)));
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) lancerDefi('champ');
    else if (md === 'defi') lancerDefi(defi.type);
    if (md === 'guide') {                       // la scène doit correspondre à l'étape où l'on reprend
      const i = guide.etape, ix = id => ETAPES.findIndex(e => e.id === id);
      if (i >= ix('objet')) aBase(); else { setPol('haut+'); setU(500); setD(2); }
    }
  }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  // ════════════════ SCÈNE ════════════════
  const ecart = 70 + (d - 0.5) / 2.5 * 170;                     // écartement des plaques à l’écran (px)
  const yH = YC - ecart / 2, yB = YC + ecart / 2, ep = 10;
  const xM = XP1 + 40 + M.x * (XP2 - XP1 - 80), yM = yH + ep + 16 + M.y * (ecart - 2 * ep - 32);
  const placerM = e => {
    const rc = svgRef.current.getBoundingClientRect(), k = W0 / rc.width;
    const px = (e.clientX - rc.left) * k, py = (e.clientY - rc.top) * k;
    setM({ x: Math.max(0, Math.min(1, (px - XP1 - 40) / (XP2 - XP1 - 80))), y: Math.max(0, Math.min(1, (py - yH - ep - 16) / (ecart - 2 * ep - 32))) });
  };
  const dirE = Ebas ? 1 : -1;                                   // sens de E à l’écran (1 : vers le bas)
  const lenE = 14 + 24 * Math.min(1, E / 1e5), sc = Math.min(84, ecart / 2 - 14) / Math.max(F, P, 1e-30);
  const lenF = Math.max(F > 0 ? 5 : 0, F * sc), lenP = Math.max(5, P * sc);
  const plaque = (y, plus, cle) => (
    <g key={cle}>
      <rect x={XP1} y={y} width={XP2 - XP1} height={ep} rx="3" fill={plus ? '#fecaca' : '#bfdbfe'} stroke={plus ? ROUGE : BLEU} strokeWidth="2"/>
      {Array.from({ length: 12 }, (_, k) => <text key={k} x={XP1 + 22 + k * 38} y={y + (plus ? 8.5 : 8.5)} textAnchor="middle" fontSize="13" fontWeight="800" fill={plus ? ROUGE : BLEU}>{plus ? '+' : '−'}</text>)}
    </g>);
  const lignes = aff.lignes && U > 0 && Array.from({ length: 13 }, (_, k) => {
    const x = XP1 + 20 + k * 35, ya = yH + ep + 4, yb = yB - 4;
    return <g key={k}><line x1={x} y1={ya} x2={x} y2={yb} stroke={BLEU} strokeWidth="1.2" opacity="0.4"/>
      {[0.3, 0.7].map(t => flecheV(x, dirE > 0 ? ya + (yb - ya) * t - 5 : ya + (yb - ya) * t + 5, dirE, 10, BLEU, 1.2, `l${k}${t}`))}</g>;
  });
  const grille = aff.grille && U > 0 && [0.22, 0.5, 0.78].flatMap((fy, a) => Array.from({ length: 7 }, (_, b) => {
    const x = XP1 + 55 + b * 70, y = yH + ep + (ecart - 2 * ep) * fy;
    return flecheV(x, y - dirE * lenE / 2, dirE, lenE, GRIS, 2, `g${a}${b}`);
  }));
  const sensTxtE = Ebas ? 'vers le bas' : 'vers le haut';
  const goutte = (
    <g>
      {!cache.valeurs && U > 0 && <>{flecheV(xM - 30, yM - dirE * lenE / 2, dirE, lenE, VERT, 3.2, 'em')}{etiquetteVec(xM - 44, yM + 4, 'E', VERT, 'eem')}</>}
      {cache.fleches !== true && F > 0 && <>{flecheV(xM + 12, yM, Fhaut ? -1 : 1, lenF, ROUGE, 3.2, 'fm')}{etiquetteVec(xM + 28, yM + (Fhaut ? -lenF / 2 : lenF / 2) + 4, 'F', ROUGE, 'efm')}</>}
      {cache.fleches !== true && <>{flecheV(xM - 12, yM, 1, lenP, BLEU, 3.2, 'pm')}{etiquetteVec(xM - 27, yM + lenP / 2 + 4, 'P', BLEU, 'epm')}</>}
      <circle cx={xM} cy={yM} r="7.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5"/>
      <text x={xM} y={yM + 4} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#451a03">{n > 0 ? '+' : n < 0 ? '−' : '0'}</text>
      <text x={xM + 14} y={yM - 9} fontSize="12.5" fontWeight="700" fill="#0f172a">M</text>
    </g>);
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <svg ref={svgRef} viewBox={`0 0 ${W0} ${H0}`} style={{ width: '100%', display: 'block', touchAction: 'none', background: '#fafaf9', borderRadius: 8, cursor: enDefi ? 'default' : 'crosshair' }}
        onPointerDown={e => { if (enDefi) return; glisse.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); placerM(e); }}
        onPointerMove={e => { if (glisse.current) placerM(e); }}
        onPointerUp={() => { glisse.current = false; }} onPointerCancel={() => { glisse.current = false; }}
        role="img" aria-label="Un condensateur plan, son champ électrostatique uniforme et une gouttelette d’huile chargée entre les plaques">
        {plaque(yH, pol === 'haut+', 'ph')}{plaque(yB - ep, pol !== 'haut+', 'pb')}
        {lignes}{grille}{goutte}
        <g stroke="#0f172a" strokeWidth="1.6"><line x1={XP2 + 22} y1={yH + ep} x2={XP2 + 22} y2={yB - ep}/><line x1={XP2 + 16} y1={yH + ep} x2={XP2 + 28} y2={yH + ep}/><line x1={XP2 + 16} y1={yB - ep} x2={XP2 + 28} y2={yB - ep}/></g>
        <text x={XP2 + 32} y={YC + 4} fontSize="13.5" fontWeight="700" fill="#0f172a">d</text>
        <text x={XP1} y={Math.max(18, yH - 12)} fontSize="13.5" fontWeight="700" fill="#0f172a">U = {fmt(U, 0)} V</text>
        {U === 0 && <text x={W0 / 2} y={YC + 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#64748b">U = 0 : pas de champ</text>}
      </svg>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>
        Cliquez ou faites glisser pour déplacer M. <span style={{ color: GRIS, fontWeight: 700 }}>Flèches grises</span> et <span style={{ color: BLEU, fontWeight: 700 }}>traits bleus</span> : le champ entre les plaques (hors de la zone entre les plaques, il n’est pas représenté).
        {' '}<span style={{ color: VERT, fontWeight: 700 }}>Vert</span> : le champ en M. <span style={{ color: ROUGE, fontWeight: 700 }}>Rouge</span> : la force électrique. <span style={{ color: BLEU, fontWeight: 700 }}>Bleu foncé</span> : le poids
        (forces à la même échelle entre elles).
      </div>
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {!enDefi && <>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Polarité</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={() => setPol('haut+')} style={stylePetitBouton(pol === 'haut+', ROUGE)}>Plaque du haut +</button>
          <button onClick={() => setPol('haut-')} style={stylePetitBouton(pol === 'haut-', BLEU)}>Plaque du haut −</button>
        </div>
        <Curseur nom="Tension U" valeur={U} onChange={setU} min={0} max={5000} pas={10} unite="V" couleur="#7c3aed"/>
        <Curseur nom="Distance d entre les plaques" valeur={d} onChange={setD} min={0.5} max={3} pas={0.1} unite="cm" decimales={1} couleur="#7c3aed"/>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '6px 0 4px' }}>Gouttelette d’huile</div>
        <Curseur nom="Rayon r" valeur={r} onChange={setR} min={0.5} max={2} pas={0.1} unite="µm" decimales={1} couleur="#b45309"/>
        <Curseur nom="Charge q = n·e, n =" valeur={n} onChange={setN} min={-6} max={6} pas={1} unite="" couleur="#b45309"/>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '4px 0' }}>Afficher</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['grille', 'Champ en différents points'], ['lignes', 'Lignes de champ']].map(([k, l]) =>
            <button key={k} onClick={() => setAff(a => ({ ...a, [k]: !a[k] }))} style={stylePetitBouton(aff[k], '#0891b2')}>{l}</button>)}
        </div>
      </>}
      {enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Pendant le défi, les grandeurs sont imposées{defi.type === 'equilibre' ? ' ; la simulation applique votre tension et votre polarité quand vous cliquez sur « Vérifier »' : ''}.</div>}
    </div>);
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {!(enDefi && defi.type !== 'champ') && <LigneMesure nom="Tension U" valeur={`${fmt(U, 0)}${NB}V`}/>}
      {!enDefi && <LigneMesure nom="Distance d" valeur={`${fmt(d, 1)}${NB}cm`}/>}
      {!cache.valeurs && <>
        <LigneMesure nom="Champ E en M" valeur={`${val(E)}${NB}N·C⁻¹`} couleur={VERT}/>
        <LigneMesure nom="Sens de E" valeur={U > 0 ? sensTxtE : '—'} couleur={VERT}/>
        <LigneMesure nom="Charge q de la gouttelette" valeur={n === 0 ? '0' : `${chargeTxt(n)} = ${val(q, 3)}${NB}C`}/>
        <LigneMesure nom="Masse m de la gouttelette" valeur={`${val(m)}${NB}kg`}/>
        <LigneMesure nom="Poids P = m·g" valeur={`${val(P)}${NB}N`} couleur={BLEU}/>
        <LigneMesure nom="Force électrique F = |q|·E" valeur={`${val(F)}${NB}N`} couleur={ROUGE}/>
        <LigneMesure nom="Sens de F" valeur={F > 0 ? (Fhaut ? 'vers le haut' : 'vers le bas') : '—'} couleur={ROUGE}/>
        <LigneMesure nom="Résultante F + P" valeur={resultante} couleur={equilibre ? '#15803d' : '#b45309'}/>
      </>}
      {cache.valeurs && defi.type === 'equilibre' && defi.verifie && <LigneMesure nom="Résultante F + P" valeur={resultante} couleur={equilibre ? '#15803d' : '#b45309'}/>}
    </div>);
  const calcul = !cache.valeurs && (
    <div style={{ ...styleBoite, ...cadre('calcul') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Le calcul</div>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 2.2 }}>
        <div>E = <Frac haut="U" bas="d"/> = <Frac haut={fmt(U, 0)} bas={`${fmt(d, 1)} × 10⁻²`}/> = <strong style={{ color: VERT }}>{val(E)}{NB}N·C⁻¹</strong></div>
        <div>F = |q| × E = {Math.abs(n)} × 1,602 × 10⁻¹⁹ × {val(E)} = <strong style={{ color: ROUGE }}>{val(F)}{NB}N</strong></div>
        <div>m = ρ·<Frac haut="4" bas="3"/>π r³ = {RHO} × <Frac haut="4" bas="3"/>π × ({fmt(r, 1)} × 10⁻⁶)³ = {val(m)}{NB}kg ; P = m·g = <strong style={{ color: BLEU }}>{val(P)}{NB}N</strong></div>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Huile : ρ = 886 kg·m⁻³ ; g = 9,81 N·kg⁻¹ ; d est converti en mètres.</div>
    </div>);
  const panneauMillikan = !cache.valeurs && (
    <div style={{ ...styleBoite, ...cadre('millikan') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La méthode de Millikan</div>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        Si la gouttelette est <strong>immobile</strong> (F = P), alors |q|·U / d = m·g, donc <strong>|q| = <Frac haut="m·g·d" bas="U"/></strong>.
      </div>
      {n !== 0 && U > 0 && <>
        {!enGuide && <LigneMesure nom="Tension d’équilibre pour cette gouttelette" valeur={Ueq <= 5000 ? `${fmt(Ueq, 0)}${NB}V` : `${fmt(Ueq, 0)}${NB}V (hors curseur)`}/>}
        <LigneMesure nom="Charge déduite de U : |q| = m·g·d / U" valeur={`${val(m * GPES * dm / U)}${NB}C`}/>
        <LigneMesure nom="Rapport |q| / e" valeur={fmt(m * GPES * dm / U / E_CH, 2)} couleur={equilibre ? '#15803d' : GRIS}/>
        <div style={{ fontSize: 12.5, color: equilibre ? '#15803d' : KIT.txt2, marginTop: 4 }}>
          {equilibre ? `La gouttelette est immobile : |q|/e vaut ${fmt(Math.abs(n), 0)}, un nombre entier.` : 'Ces deux dernières lignes n’ont de sens que si la gouttelette est immobile (réglez U pour obtenir F = P).'}</div></>}
    </div>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Plaques grandes devant leur écartement</strong> : le champ est uniforme entre les plaques, de norme E = U / d. On néglige les effets de bord : près des bords, le champ réel se courbe. En dehors des plaques, on ne représente aucun champ.</li>
      <li><strong>Champ du condensateur seul</strong> : la gouttelette ne modifie pas le champ (sa charge est très petite devant celle des plaques).</li>
      <li><strong>Gouttelette sphérique d’huile</strong> : ρ = 886 kg·m⁻³, m = ρ·(4/3)π r³, avec r de l’ordre du micromètre comme chez Millikan. Sa charge est q = n·e, avec e = 1,602 × 10⁻¹⁹ C.</li>
      <li><strong>Poussée d’Archimède de l’air négligée</strong> (environ 0,14 % du poids pour de l’huile dans l’air), ainsi que les frottements : dans l’expérience réelle, les frottements de l’air freinent la gouttelette, qui atteint très vite une vitesse limite. La simulation ne calcule pas le mouvement : elle compare F et P et donne la direction de la résultante.</li>
      <li><strong>Champ de pesanteur uniforme</strong> g = 9,81 N·kg⁻¹ (cohérent avec la notion de champ localement uniforme).</li>
      <li><strong>Équilibre</strong> : la simulation parle d’équilibre quand F et P diffèrent de moins de 1 % (le curseur de tension a un pas de 10 V).</li>
      <li><strong>Représentation</strong> : la gouttelette est dessinée beaucoup trop grosse (elle ferait moins de 1/1000 mm). Les flèches de force et de poids sont à la même échelle entre elles, mais pas à celle du champ.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Déplacez M partout entre les plaques : que remarquez-vous sur E ? Et si M sort de la zone entre les plaques ?</li>
        <li>Doublez la tension : comment varie E ? Et la force ? Et si vous doublez à la fois U et d ?</li>
        <li>Choisissez q {'>'} 0 puis q {'<'} 0 sans changer la polarité : qu’est-ce qui change pour la force ? et pour le champ ?</li>
        <li>Trouvez la tension qui immobilise une gouttelette de charge −2e, puis de charge −4e. Comment varie U avec n ?</li>
        <li>Pour q = −e et r = 2 µm, la tension d’équilibre dépasse 5 000 V. Pourquoi une gouttelette plus grosse est-elle plus difficile à immobiliser ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>condensateur plan : <Vec>E</Vec> uniforme, perpendiculaire aux plaques, de la plaque + vers la plaque −, E = U / d</li>
        <li><Vec>F</Vec> = q·<Vec>E</Vec> ; gouttelette immobile : <Vec>F</Vec> + <Vec>P</Vec> = <Vec>0</Vec>, donc |q|·U / d = m·g</li>
        <li>les charges sont des multiples entiers de e = 1,602 × 10⁻¹⁹ C</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cm-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .cm-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .cm-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .cm-l1.cote, .cm-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Condensateur plan et gouttelette de Millikan</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Entre deux plaques parallèles de charges opposées, le champ électrostatique est <strong>uniforme</strong> : <Vec>E</Vec> est perpendiculaire aux plaques, de norme E = U / d.
        Une charge q y subit la force <Vec>F</Vec> = q·<Vec>E</Vec> ; elle peut compenser le poids d’une gouttelette d’huile.</div>
      <div className={`cm-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}>
            <VoletDefi defi={defi} setDefi={setDefi} changerType={lancerDefi} appliquer={appliquer}/></div>}
          <div className={`cm-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      <div className="cm-l2">{calcul}{panneauMillikan}</div>
      {!enDefi && <div className="cm-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="cm-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
