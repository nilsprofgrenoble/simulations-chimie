import { useState, useEffect, useMemo } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, IndiceDefi } from "../commun";
import { fr, simuler, forcesSurCaisse, FORCES_CANDIDATES, BILANS, PREVOIR } from "./forcesModele";
import { Schema, Fl, T, TV, TL, GRIS, BLEU, NOIR } from "./Travail";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 60 — PRINCIPE D'INERTIE (2GT, « Mouvement et interactions »)
//  Une caisse sur un sol horizontal : poids, réaction du sol, poussée, frottements. On voit les vecteurs forces, leur résultante,
//  la chronophotographie et la vitesse. Les forces se compensent ⇔ vitesse constante (repos ou mouvement rectiligne uniforme).
//  Parcours guidé (écran progressif : chaque élément apparaît à l'étape qui s'en sert), exploration libre, 3 défis.
//  Modèle du point matériel : toutes les forces sont dessinées depuis le centre G de la caisse (option « points de contact réels »
//  dans l'exploration). Modèle : forcesModele.js.
// ====================================================

const SIM = 60;
declarerDefis(SIM, [
  ['bilan', 'Faire le bilan des forces'],
  ['regler', 'Régler la poussée'],
  ['prevoir', 'Prévoir le mouvement'],
]);

const VERT = '#15803d', ORANGE = '#b45309', VIOLET = '#7c3aed';
const COUL = { poids: '#c2410c', reaction: '#0072b2', poussee: '#15803d', frottement: '#a16207' };
const LETTRE = { poids: 'P', reaction: 'R', poussee: 'F', frottement: 'f' };
const alea = l => l[Math.floor(Math.random() * l.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const tolF = m => Math.max(0.05, 0.0083 * m);   // newtons : en dessous, la vitesse varie de moins de 0,05 m/s en 6 s
const T_MAX = 6;
const SOLS = [[0, 'Sans frottement (coussin d’air)'], [0.1, 'Sol glissant'], [0.2, 'Sol normal'], [0.3, 'Sol rugueux']];
const nomSol = mu => (SOLS.find(s => s[0] === mu) || [0, `μ = ${mu}`])[1].toLowerCase();
const DEFAUT = { m: 25, F: 0, mu: 0.2, v0: 1 };
const g = 9.8;
const Vec = ({ c = 'F' }) => <span style={{ position: 'relative', display: 'inline-block', fontStyle: 'italic' }}>{c}<span aria-hidden="true" style={{ position: 'absolute', left: '0.1em', top: '-0.5em', fontSize: '0.8em', fontStyle: 'normal', lineHeight: 1 }}>→</span></span>;
const compense = (res, m = 25) => Math.abs(res.x) < tolF(m) && Math.abs(res.y) < tolF(m);
// ce qui est visible à l'écran à chaque étape du parcours (on accumule : un élément introduit reste affiché)
const V0 = {};
const V1 = { poids: 1, reaction: 1 };
const V2 = { poids: 1, reaction: 1, pousse: 1, frott: 1, res: 1, ctlPousse: 1, verdict: 1 };
const TOUT = { ...V2 };
const Cle = ({ children }) => <div style={{ margin: '8px 0', padding: '6px 10px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 8, fontWeight: 700, fontSize: 14.5, lineHeight: 1.45 }}>Phrase-clé : {children}</div>;

// échelle « ronde » (N pour 1 cm) pour que le plus grand vecteur mesure au plus 2,5 cm
const nice = F => [10, 20, 50, 100, 200, 500, 1000].find(s => F / s <= 2.5) || 1000;
function Fleche({ x, y, dx, dy, couleur, ep = 4.5, dash }) {
  const L = Math.hypot(dx, dy); if (L < 2) return null;
  const ux = dx / L, uy = dy / L, tete = Math.min(13, L * 0.6), bx = x + dx - ux * tete, by = y + dy - uy * tete;
  return <g><line x1={x} y1={y} x2={bx} y2={by} stroke={couleur} strokeWidth={ep} strokeLinecap="round" strokeDasharray={dash}/>
    <polygon points={`${x + dx},${y + dy} ${bx - uy * 7},${by + ux * 7} ${bx + uy * 7},${by - ux * 7}`} fill={couleur}/></g>;
}

// ---------- scène : caisse, chronophotographie, vecteurs forces ----------
// viewBox de 420 de large : sur un téléphone (≈ 340 px), les textes de 14 ou plus restent à 11 px ou plus.
const W = 420, H = 346, CY = 180, BAS = 205;   // la caisse (50 px de haut) repose sur le sol : fond = CY + 25 = BAS
function Scene({ P, sim, t, vis = TOUT, contact = false }) {
  const i = clamp(Math.round(t / 0.1), 0, sim.t.length - 1), x = sim.x[i], v = sim.v[i];
  const xmin = Math.min(...sim.x, 0), xmax = Math.max(...sim.x, 0), k = Math.min(60, 160 / Math.max(1, xmax - xmin)), px = xx => 130 + (xx - xmin) * k;
  const f = forcesSurCaisse({ m: P.m, F: P.F, mu: P.mu, v, g }), maxF = Math.max(...f.liste.map(e => Math.hypot(e.fx, e.fy)), 1), S = nice(maxF), pxN = 40 / S;
  const cx = px(x), pas = k >= 30 ? 1 : k >= 15 ? 2 : 5, ticks = [];
  for (let m = Math.ceil(xmin / pas) * pas; m <= xmax + 1e-9; m += pas) ticks.push(m);
  const points = []; for (let s = 0; s <= T_MAX + 1e-9; s += 0.5) { const j = Math.round(s / 0.1); points.push({ s, x: sim.x[Math.min(j, sim.x.length - 1)] }); }
  const montre = { poids: vis.poids, reaction: vis.reaction, poussee: vis.pousse, frottement: vis.frott };
  const liste = f.liste.filter(e => montre[e.id]), res = f.resultante;
  // flèches : modèle du point matériel (toutes depuis G) ou points de contact réels
  const fleches = liste.map(e => {
    const dx = e.fx * pxN, dy = -e.fy * pxN;
    let x0 = cx, y0 = CY, lx, ly;
    if (e.id === 'poids') { lx = cx + 10; ly = Math.max(CY + dy * 0.85 + 5, BAS + 40); }
    else if (e.id === 'reaction') { if (contact) { x0 = cx + 9; y0 = BAS; } lx = (contact ? cx + 19 : cx + 10); ly = y0 + dy * 0.6 + 5; }
    else if (e.id === 'poussee') { if (contact) { x0 = e.fx >= 0 ? cx - 36 : cx + 36; } else y0 = CY - 5; lx = x0 + dx + (dx >= 0 ? 6 : -16); ly = y0 - 9; }
    else { if (contact) { x0 = cx - 9; y0 = BAS - 4; } else y0 = CY + 5; lx = dx >= 0 ? x0 + dx + 4 : x0 + dx - 14; ly = contact ? y0 + 22 : CY + 22; }
    return { e, x0, y0, dx, dy, lx, ly };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Caisse de ${P.m} kg à la date ${fr(t, 1)} s, vitesse ${fr(v, 2)} m/s`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="10" y1={BAS} x2={W - 10} y2={BAS} stroke="#64748b" strokeWidth="3"/>
      {ticks.map(m => Math.abs(px(m) - cx) < 24 ? null : <g key={m}><line x1={px(m)} y1={BAS} x2={px(m)} y2={BAS + 8} stroke="#64748b" strokeWidth="2"/><text x={px(m)} y={BAS + 24} textAnchor="middle" fontSize="13" fill="#475569">{m} m</text></g>)}
      {points.map(p => <circle key={p.s} cx={px(p.x)} cy={BAS + 105} r={p.s <= t + 1e-9 ? 4.5 : 2.5} fill={p.s <= t + 1e-9 ? '#0f172a' : '#cbd5e1'}/>)}
      <text x="10" y={BAS + 131} fontSize="14" fill="#475569">Chronophotographie : un point toutes les 0,5 s</text>
      <rect x={cx - 36} y={CY - 25} width="72" height="50" fill="#e3c99b" stroke="#7c5a2b" strokeWidth="2.5"/>
      <text x={cx - 42} y={CY + 4} textAnchor="end" fontSize="14" fontWeight="700" fill="#5b4220">{P.m} kg</text>
      {fleches.map(({ e, x0, y0, dx, dy }) => <Fleche key={e.id} x={x0} y={y0} dx={dx} dy={dy} couleur={COUL[e.id]}/>)}
      <circle cx={cx} cy={CY} r="3.5" fill="#0f172a"/>
      {fleches.filter(a => Math.hypot(a.dx, a.dy) >= 2).map(({ e, lx, ly }) => <TV key={e.id} x={lx} y={ly} c={COUL[e.id]} s={17} halo>{LETTRE[e.id]}</TV>)}
      <text x="12" y="20" fontSize="14" fontWeight="700" fill="#334155">Échelle : 1 cm ↔ {S} N</text>
      <g><line x1="12" y1="32" x2="52" y2="32" stroke="#334155" strokeWidth="2"/><line x1="12" y1="27" x2="12" y2="37" stroke="#334155" strokeWidth="2"/><line x1="52" y1="27" x2="52" y2="37" stroke="#334155" strokeWidth="2"/><text x="60" y="37" fontSize="13" fill="#334155">1 cm</text></g>
      <text x={W - 12} y="20" textAnchor="end" fontSize="14" fontWeight="700" fill="#334155">t = {fr(t, 1)} s · v = {fr(v, 2)} m/s</text>
      {vis.res && (compense(res, P.m)
        ? <TL x={clamp(cx - 150, 8, W - 310)} y={66} s={15} c={VERT} segs={['Σ', { v: 'F' }, ' = ', { v: '0' }, ' : les forces se compensent']}/>
        : <g><Fleche x={cx + (res.x >= 0 ? 22 : -22)} y={78} dx={res.x * pxN} dy={0} couleur={VIOLET} ep={6} dash="7 4"/>
          <TL x={clamp(cx - 110, 8, W - 250)} y={64} s={15} c={VIOLET} segs={['résultante ', 'Σ', { v: 'F' }, ` : ${fr(Math.hypot(res.x, res.y), 0)} N`]}/></g>)}
    </svg>);
}
function Graphe({ sim, t }) {
  const vmin = Math.min(0, ...sim.v), vmax = Math.max(0.5, ...sim.v), gx = s => 50 + s / T_MAX * 350, gy = v => 100 - (v - vmin) / (vmax - vmin) * 74;
  const i = clamp(Math.round(t / 0.1), 0, sim.t.length - 1);
  return (
    <svg viewBox="0 0 420 140" width="100%" role="img" aria-label="Graphique de la vitesse en fonction du temps" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <line x1="50" y1={gy(0)} x2="410" y2={gy(0)} stroke="#94a3b8" strokeWidth="1.5"/><line x1="50" y1="16" x2="50" y2="112" stroke="#94a3b8" strokeWidth="1.5"/>
      <polyline fill="none" stroke="#0f766e" strokeWidth="3" points={sim.t.map((s, j) => `${gx(s)},${gy(sim.v[j])}`).join(' ')}/>
      <circle cx={gx(sim.t[i])} cy={gy(sim.v[i])} r="6" fill="#0f172a" stroke="#fff" strokeWidth="1.5"/>
      <text x="56" y="14" fontSize="13" fill="#334155">vitesse v (m/s)</text><text x="4" y={gy(vmax) + 5} fontSize="13" fill="#475569">{fr(vmax, 1)}</text>
      <text x="410" y="134" textAnchor="end" fontSize="13" fill="#334155">temps t (s) → 6 s</text></svg>);
}

// ---------- schémas des situations du parcours (étapes 8 à 11) : ce qu'on SAIT, jamais la réponse ----------
function SchemaCas({ cas }) {
  const cadre = { display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 };
  if (cas === 'voiture') return (
    <svg viewBox="0 0 420 230" width="100%" role="img" aria-label="Chronophotographie d’une voiture sur une route droite : quatre positions régulièrement espacées, le vecteur vitesse garde la même longueur" style={cadre}>
      <line x1="10" y1="140" x2="410" y2="140" stroke="#64748b" strokeWidth="3"/>
      {[30, 130, 230, 330].map(x => <g key={x}>
        <rect x={x} y="104" width="60" height="26" rx="6" fill="#bfdbfe" stroke={NOIR} strokeWidth="2"/><rect x={x + 12} y="92" width="34" height="14" rx="4" fill="#dbeafe" stroke={NOIR} strokeWidth="2"/>
        <circle cx={x + 14} cy="134" r="8" fill={NOIR}/><circle cx={x + 46} cy="134" r="8" fill={NOIR}/>
        <Fl x1={x + 4} y1={66} x2={x + 62} y2={66} c={BLEU} w={4}/><TV x={x + 24} y={56} c={BLEU} s={17}>v</TV></g>)}
      <text x="210" y="184" textAnchor="middle" fontSize="15" fontWeight="700" fill={VERT}>mêmes écarts, mêmes flèches vitesse</text>
      <text x="210" y="210" textAnchor="middle" fontSize="14" fill="#475569">voiture à 90 km/h, route droite et horizontale</text>
    </svg>);
  if (cas === 'virage') {
    const C = { x: 210, y: 225 }, r = 135, ang = [-160, -125, -90, -55, -20].map(a => a * Math.PI / 180), pos = a => [C.x + r * Math.cos(a), C.y + r * Math.sin(a)];
    const [x1, y1] = pos(ang[0] - 0.12), [x2, y2] = pos(ang[4] + 0.12);
    return (
      <svg viewBox="0 0 420 260" width="100%" role="img" aria-label="Vue de dessus d’un virage : cinq positions de la voiture, le vecteur vitesse garde la même longueur mais change de direction" style={cadre}>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke="#cbd5e1" strokeWidth="26" strokeLinecap="round"/>
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8 6"/>
        {ang.map((a, k) => { const [X, Y] = pos(a), dx = -Math.sin(a) * 46, dy = Math.cos(a) * 46; return <g key={k}><circle cx={X} cy={Y} r="6" fill={NOIR}/><Fl x1={X} y1={Y} x2={X + dx} y2={Y + dy} c={BLEU} w={3.5}/><TV x={X + dx * 0.5 + (k < 2 ? -22 : k > 2 ? 8 : 0)} y={Y + dy * 0.5 + (k === 2 ? -14 : 0) + (k < 2 ? 4 : k > 2 ? 4 : 0)} c={BLEU} s={16} halo>v</TV></g>; })}
        <text x="210" y="226" textAnchor="middle" fontSize="15" fontWeight="700" fill={ORANGE}>valeur de v constante, direction qui change</text>
        <text x="210" y="248" textAnchor="middle" fontSize="14" fill="#475569">voiture à 50 km/h, vue de dessus</text>
      </svg>);
  }
  if (cas === 'parachute') return (
    <svg viewBox="0 0 420 260" width="100%" role="img" aria-label="Un parachutiste en descente verticale : trois positions régulièrement espacées, le vecteur vitesse garde la même longueur" style={cadre}>
      {[24, 112, 200].map((y, k) => <g key={y} opacity={k < 2 ? 0.55 : 1}>
        <path d={`M 130 ${y + 36} A 38 38 0 0 1 206 ${y + 36} Z`} fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
        <line x1="130" y1={y + 36} x2="168" y2={y + 66} stroke={NOIR} strokeWidth="1.5"/><line x1="206" y1={y + 36} x2="168" y2={y + 66} stroke={NOIR} strokeWidth="1.5"/>
        <circle cx="168" cy={y + 70} r="5" fill={NOIR}/>
        <Fl x1={260} y1={y + 30} x2={260} y2={y + 76} c={BLEU} w={4}/><TV x={272} y={y + 60} c={BLEU} s={17}>v</TV></g>)}
      <text x="300" y="150" fontSize="14" fill="#475569">vitesse limite :</text><text x="300" y="168" fontSize="14" fill="#475569">mêmes écarts,</text><text x="300" y="186" fontSize="14" fill="#475569">mêmes flèches</text>
    </svg>);
  return (
    <svg viewBox="0 0 420 250" width="100%" role="img" aria-label="Un astronaute en orbite autour de la Terre : trois positions, le poids est la seule force, orientée vers le centre de la Terre ; le vecteur vitesse change de direction" style={{ ...cadre, background: '#0b1630' }}>
      <circle cx="210" cy="360" r="170" fill="#2563eb" stroke="#93c5fd" strokeWidth="2"/>
      <text x="210" y="238" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">Terre</text>
      <path d="M 40 180 A 190 190 0 0 1 380 180" fill="none" stroke="#fde68a" strokeWidth="1.8" strokeDasharray="6 6"/>
      {[-125, -90, -55].map(a => { const r = a * Math.PI / 180, X = 210 + 190 * Math.cos(r), Y = 360 + 190 * Math.sin(r), vx = -Math.sin(r) * 50, vy = Math.cos(r) * 50, px2 = -Math.cos(r) * 42, py2 = -Math.sin(r) * 42;
        return <g key={a}><circle cx={X} cy={Y} r="7" fill="#e2e8f0" stroke="#fff" strokeWidth="1.5"/>
          <Fl x1={X} y1={Y} x2={X + vx} y2={Y + vy} c="#7dd3fc" w={3.5}/><Fl x1={X} y1={Y} x2={X + px2} y2={Y + py2} c="#fca5a5" w={3.5}/>
          <TV x={X + vx + (a === -125 ? -2 : 6)} y={Y + vy + (a === -125 ? -12 : -4)} c="#7dd3fc" s={16} halo>v</TV><TV x={X + px2 + 8} y={Y + py2 + 14} c="#fca5a5" s={16} halo>P</TV></g>; })}
      <text x="12" y="22" fontSize="14" fill="#e2e8f0">Station en orbite, vue de loin</text>
    </svg>);
}

// ---------- schémas des cartes « À retenir » ----------
const SchemaChrono = () => (
  <Schema aria="Chronophotographie d’un palet sur coussin d’air : quatre positions régulièrement espacées, et le vecteur vitesse garde la même longueur" h={150}>
    <line x1="10" y1="98" x2="350" y2="98" stroke={GRIS} strokeWidth="2"/>
    {[20, 100, 180, 260].map(x => <g key={x}><rect x={x} y="74" width="36" height="22" rx="4" fill="#e2e8f0" stroke={NOIR} strokeWidth="1.8"/>
      <Fl x1={x + 6} y1={54} x2={x + 56} y2={54} c={BLEU}/><TV x={x + 26} y={44} c={BLEU} s={15}>v</TV></g>)}
    <T x={180} y={126} a="middle" s={15} c={VERT} w={700}>écarts égaux ⇒ vitesse constante</T>
    <T x={180} y={146} a="middle" s={15} c={GRIS} w={500}>rien ne le pousse, il avance</T>
  </Schema>);
const SchemaPoidsReaction = () => (
  <Schema aria="Une caisse immobile : le poids P vers le bas et la réaction R du sol vers le haut, de même longueur" h={186}>
    <line x1="100" y1="92" x2="260" y2="92" stroke={GRIS} strokeWidth="3"/>
    <rect x="150" y="56" width="60" height="36" fill="#e3c99b" stroke="#7c5a2b" strokeWidth="2"/><circle cx="180" cy="74" r="3.5" fill={NOIR}/>
    <Fl x1={180} y1={74} x2={180} y2={16} c="#0072b2" w={4}/><Fl x1={180} y1={74} x2={180} y2={132} c="#c2410c" w={4}/>
    <TV x={193} y={36} c="#0072b2" s={17}>R</TV><TV x={193} y={124} c="#c2410c" s={17}>P</TV>
    <T x={10} y={30} s={15}>R = P</T>
    <T x={180} y={158} a="middle" s={15}>même direction, même longueur,</T><T x={180} y={177} a="middle" s={15}>sens opposés</T>
  </Schema>);
const SchemaCompense = () => (
  <Schema aria="Une caisse qui glisse à vitesse constante : le poids et la réaction se compensent, la poussée et les frottements se compensent, la résultante est nulle" h={196}>
    <line x1="90" y1="92" x2="270" y2="92" stroke={GRIS} strokeWidth="3"/>
    <rect x="150" y="56" width="60" height="36" fill="#e3c99b" stroke="#7c5a2b" strokeWidth="2"/><circle cx="180" cy="74" r="3.5" fill={NOIR}/>
    <Fl x1={180} y1={74} x2={180} y2={30} c="#0072b2" w={3.5}/><Fl x1={180} y1={74} x2={180} y2={118} c="#c2410c" w={3.5}/>
    <Fl x1={180} y1={74} x2={252} y2={74} c="#15803d" w={3.5}/><Fl x1={180} y1={74} x2={108} y2={74} c="#a16207" w={3.5}/>
    <TV x={190} y={44} c="#0072b2" s={16}>R</TV><TV x={190} y={112} c="#c2410c" s={16}>P</TV><TV x={236} y={64} c="#15803d" s={16}>F</TV><TV x={96} y={64} c="#a16207" s={16}>f</TV>
    <TL x={64} y={150} s={17} segs={['Σ', { v: 'F' }, ' = ', { v: '0' }, '  ⇒  vitesse constante']}/>
    <TL x={40} y={180} s={15} c={GRIS} w={500} segs={[{ v: 'F' }, ' : poussée   ', { v: 'f' }, ' : frottements']}/>
  </Schema>);
const SchemaNonCompense = () => (
  <Schema aria="Deux cas où les forces ne se compensent pas : à gauche la poussée est plus grande que les frottements et la caisse accélère, à droite les frottements agissent seuls et la caisse ralentit" h={196}>
    <rect x="50" y="52" width="60" height="36" fill="#e3c99b" stroke="#7c5a2b" strokeWidth="2"/><circle cx="80" cy="70" r="3.5" fill={NOIR}/>
    <Fl x1={80} y1={70} x2={166} y2={70} c="#15803d" w={4}/><Fl x1={80} y1={70} x2={44} y2={70} c="#a16207" w={4}/>
    <TV x={146} y={58} c="#15803d" s={16}>F</TV><TV x={22} y={58} c="#a16207" s={16}>f</TV>
    <T x={85} y={116} a="middle" s={15}>F &gt; f</T>
    <TL x={34} y={142} s={15} segs={['Σ', { v: 'F' }, ' ≠ ', { v: '0' }]}/><T x={85} y={168} a="middle" s={15} c={VERT} w={700}>il accélère</T>
    <rect x="235" y="52" width="60" height="36" fill="#e3c99b" stroke="#7c5a2b" strokeWidth="2"/><circle cx="265" cy="70" r="3.5" fill={NOIR}/>
    <Fl x1={265} y1={70} x2={203} y2={70} c="#a16207" w={4}/><TV x={192} y={58} c="#a16207" s={16}>f</TV>
    <T x={265} y={116} a="middle" s={15}>frottements seuls</T>
    <TL x={219} y={142} s={15} segs={['Σ', { v: 'F' }, ' ≠ ', { v: '0' }]}/><T x={265} y={168} a="middle" s={15} c="#b91c1c" w={700}>il ralentit</T>
    <T x={180} y={192} a="middle" s={15} c={GRIS} w={500}>(P et R se compensent : non dessinées)</T>
  </Schema>);
const SchemaPrincipe = () => (
  <Schema aria="Principe d’inertie : si la résultante des forces est nulle, le système est immobile ou en mouvement rectiligne uniforme, et réciproquement ; sinon la vitesse varie" h={190}>
    <rect x="6" y="12" width="140" height="66" rx="8" fill="#ecfdf5" stroke={VERT} strokeWidth="2"/>
    <TL x={36} y={42} s={18} segs={['Σ', { v: 'F' }, ' = ', { v: '0' }]}/><T x={76} y={67} a="middle" s={15} c={VERT}>compensées</T>
    <Fl x1={152} y1={36} x2={182} y2={36} c={GRIS} w={2.5}/><Fl x1={182} y1={54} x2={152} y2={54} c={GRIS} w={2.5}/>
    <rect x="188" y="12" width="166" height="66" rx="8" fill="#eff6ff" stroke="#0b4f94" strokeWidth="2"/>
    <T x={271} y={40} a="middle" s={15} c="#0b4f94">rectiligne uniforme</T><T x={271} y={62} a="middle" s={15} c="#0b4f94">ou immobile</T>
    <rect x="6" y="102" width="140" height="66" rx="8" fill="#fef2f2" stroke="#b91c1c" strokeWidth="2"/>
    <TL x={36} y={132} s={18} segs={['Σ', { v: 'F' }, ' ≠ ', { v: '0' }]}/><T x={76} y={157} a="middle" s={15} c="#b91c1c">non compensées</T>
    <Fl x1={152} y1={126} x2={182} y2={126} c={GRIS} w={2.5}/><Fl x1={182} y1={144} x2={152} y2={144} c={GRIS} w={2.5}/>
    <rect x="188" y="102" width="166" height="66" rx="8" fill="#fff7ed" stroke={ORANGE} strokeWidth="2"/>
    <T x={271} y={130} a="middle" s={15} c={ORANGE}>la vitesse varie</T><T x={271} y={152} a="middle" s={15} c={ORANGE}>valeur ou direction</T>
  </Schema>);
const SchemaApplique = () => (
  <Schema aria="Deux cas : un parachutiste à vitesse limite, où le poids et les frottements de l’air se compensent, et un astronaute en orbite, soumis à une seule force qui ne peut pas être compensée" h={222}>
    <path d="M 50 54 A 40 40 0 0 1 130 54 Z" fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
    <line x1="50" y1="54" x2="90" y2="104" stroke={NOIR} strokeWidth="1.5"/><line x1="130" y1="54" x2="90" y2="104" stroke={NOIR} strokeWidth="1.5"/>
    <circle cx="90" cy="104" r="4" fill={NOIR}/>
    <Fl x1={90} y1={104} x2={90} y2={72} c="#0072b2" w={3.5}/><Fl x1={90} y1={104} x2={90} y2={150} c="#c2410c" w={3.5}/>
    <TV x={100} y={92} c="#0072b2" s={16} halo>f</TV><TV x={100} y={142} c="#c2410c" s={16}>P</TV>
    <T x={90} y={176} a="middle" s={15} c={VERT} w={700}>vitesse constante</T><TL x={42} y={202} s={16} segs={['Σ', { v: 'F' }, ' = ', { v: '0' }]}/>
    <circle cx="272" cy="96" r="5" fill={NOIR}/><Fl x1={272} y1={96} x2={272} y2={146} c="#c2410c" w={3.5}/><Fl x1={272} y1={96} x2={332} y2={96} c={BLEU} w={3.5}/>
    <TV x={284} y={134} c="#c2410c" s={16}>P</TV><TV x={316} y={84} c={BLEU} s={16}>v</TV>
    <T x={272} y={176} a="middle" s={15} c="#b91c1c" w={700}>une seule force</T><TL x={226} y={202} s={16} segs={['Σ', { v: 'F' }, ' ≠ ', { v: '0' }]}/>
  </Schema>);

// ====================================================
//  DÉFIS
// ====================================================
const TITRES = { bilan: 'Bilan des forces', regler: 'Régler la poussée', prevoir: 'Prévoir le mouvement' };
const PAIRES_REGLER = [[15, 15], [15, 20], [20, 20], [20, 30], [25, 30], [25, 40], [30, 40], [30, 50], [40, 40], [40, 60]];   // [masse (kg), frottements (N, entiers)]
function nouveauDefi(type, prec) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'bilan') { let b; do { b = alea(BILANS); } while (prec && prec.type === 'bilan' && prec.id === b.id); return { ...base, id: b.id, sel: [] }; }
  if (type === 'regler') { let m, f, v0; do { [m, f] = alea(PAIRES_REGLER); v0 = alea([1, 1.5, 2]); } while (prec && prec.type === 'regler' && prec.m === m && prec.f === f); return { ...base, m, f, mu: f / (m * g), v0 }; }
  let k; do { k = Math.floor(Math.random() * PREVOIR.length); } while (prec && prec.type === 'prevoir' && prec.k === k);
  return { ...base, k };
}
function evaluerDefi(d, P) {
  if (d.type === 'bilan') {
    const b = BILANS.find(x => x.id === d.id), sel = [...d.sel].sort().join(), vrai = [...b.vrai].sort().join(), o1 = sel === vrai, o2 = d.reps.comp === b.compensent;
    const faux = d.sel.filter(s => !b.vrai.includes(s)), manque = b.vrai.filter(s => !d.sel.includes(s));
    const nom = id => FORCES_CANDIDATES.find(c => c[0] === id)[1].split(' (')[0].toLowerCase();
    return { ok: o1 && o2, lignes: [
      [o1, o1 ? 'Liste des forces correcte.' : faux.includes('lancer') ? 'Après le lancer, aucune « force du lancer » ne s’exerce : l’objet continue grâce à son inertie (la main n’est plus en contact).' : faux.length ? 'Une des forces cochées ne s’exerce pas sur l’objet.' : `Il manque : ${manque.map(nom).join(', ')}.`],
      [o2, o2 ? 'Bonne réponse sur la compensation.' : b.compensent ? 'Ici les forces se compensent : la vitesse est constante (ou nulle).' : 'Ici les forces ne se compensent pas : la vitesse varie.']] };
  }
  if (d.type === 'regler') {
    const ok = Math.abs(P.F - d.f) <= 1.0001;
    return { ok, lignes: [[ok, ok ? 'La poussée compense les frottements : la vitesse reste constante.' : P.F < d.f ? 'La poussée est trop faible : les frottements l’emportent, la caisse ralentit.' : 'La poussée est trop forte : la caisse accélère.']] };
  }
  const p = PREVOIR[d.k], o1 = d.reps.comp === p.compensent, o2 = d.reps.mvt === p.mvt;
  return { ok: o1 && o2, lignes: [[o1, o1 ? 'Bonne réponse sur la compensation.' : 'Revois : les forces se compensent seulement si la vitesse reste constante.'], [o2, o2 ? 'Bonne réponse sur la vitesse.' : 'Revois : si les forces se compensent, la vitesse est constante (ou nulle).']] };
}
function VoletDefi({ defi, setDefi, changerType, P, planche }) {
  const res = defi.verifie ? evaluerDefi(defi, P) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const rep = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }, q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const choix = (k, opts) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{opts.map(([v, l]) => <button key={String(v)} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>;
  const b = defi.type === 'bilan' ? BILANS.find(x => x.id === defi.id) : null, p = defi.type === 'prevoir' ? PREVOIR[defi.k] : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'bilan' && <>
        <div style={txt}><Pic n="target"/>{b.texte} Quelles forces s’exercent sur l’objet ? (cochez toutes les bonnes réponses)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{FORCES_CANDIDATES.map(([id, nom]) => <label key={id} style={{ fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={defi.sel.includes(id)} onChange={e => setDefi(d => ({ ...d, sel: e.target.checked ? [...d.sel, id] : d.sel.filter(x => x !== id), verifie: false }))}/> {nom}</label>)}</div>
        {q('Ces forces se compensent-elles ?')}{choix('comp', [[true, 'Oui'], [false, 'Non']])}</>}
      {defi.type === 'regler' && <><div style={txt}><Pic n="target"/>Une caisse de <strong>{defi.m} kg</strong> glisse vers la droite à <strong>{fr(defi.v0, 1)} m/s</strong>. Le sol exerce sur elle des frottements de <strong>{defi.f} N</strong>. Réglez la <strong>poussée</strong> (curseur ou boutons − et +) pour que la caisse garde <strong>exactement cette vitesse</strong>, puis cliquez sur « Vérifier ».</div>{planche}</>}
      {defi.type === 'prevoir' && <>
        <div style={txt}><Pic n="target"/>{p.txt}</div>
        {q('Les forces qui s’exercent sur le système se compensent-elles ?')}{choix('comp', [[true, 'Oui'], [false, 'Non']])}
        {q('Sa vitesse (valeur et direction)…')}{choix('mvt', [['constante', 'reste constante (ou nulle)'], ['varie', 'varie']])}</>}
      <IndiceDefi cache={reussi}>{defi.type === 'bilan' ? <>Pense aux forces à distance (le poids) et aux forces de contact (sol, air, fil…). Puis applique le principe d’inertie : la vitesse est-elle constante ? La direction change-t-elle ?</>
        : defi.type === 'regler' ? <>Pour garder la même vitesse en ligne droite, les forces horizontales doivent se compenser : la poussée doit avoir la même intensité que les frottements (donnée dans l’énoncé), dans l’autre sens. Surveille aussi la courbe de vitesse.</>
        : <>Applique le principe d’inertie : regarde d’abord si les forces se compensent, puis si le mouvement est rectiligne et uniforme.</>}</IndiceDefi>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'bilan' && <>Forces : {b.vrai.map(id => FORCES_CANDIDATES.find(c => c[0] === id)[1]).join(' ; ')}. {b.compensent ? 'Elles se compensent : la vitesse est constante (ou nulle).' : 'Elles ne se compensent pas : la vitesse varie.'}</>}
        {defi.type === 'regler' && <>La vitesse reste constante : d’après le principe d’inertie, les forces se compensent. La poussée doit donc avoir la même intensité que les frottements, soit <strong>{defi.f} N</strong>, dirigée vers la droite.</>}
        {defi.type === 'prevoir' && <>{p.expl}</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationPrincipeInertie() {
  const [mode, setMode] = useState(() => modeOuverture('inertie-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('inertie-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [P, setP] = useState(DEFAUT);
  const [t, setT] = useState(3);
  const [lecture, setLecture] = useState(false);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [regOuv, setRegOuv] = useState(false);
  const [essOuv, setEssOuv] = useState(false);
  const [contact, setContact] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const Peff = enDefi && defi.type === 'regler' ? { ...P, m: defi.m, mu: defi.mu, v0: defi.v0 } : P;
  const sim = useMemo(() => simuler({ m: Peff.m, F: Peff.F, mu: Peff.mu, v0: Peff.v0, T: T_MAX, g }), [Peff.m, Peff.F, Peff.mu, Peff.v0]);
  const i = clamp(Math.round(t / 0.1), 0, sim.t.length - 1), vT = sim.v[i], res = forcesSurCaisse({ m: Peff.m, F: Peff.F, mu: Peff.mu, v: vT, g }).resultante;
  const fk = Peff.mu * Peff.m * g;

  useEffect(() => {
    if (!lecture) return undefined;
    const id = setInterval(() => setT(s => { if (s >= T_MAX - 1e-9) { setLecture(false); return T_MAX; } return Math.round((s + 0.1) * 10) / 10; }), 90);
    return () => clearInterval(id);
  }, [lecture]);

  const voir = (params, t0 = 3) => { setP({ ...DEFAUT, ...params }); setT(t0); setLecture(false); };
  const vFin = sim.v[sim.v.length - 1], r0 = forcesSurCaisse({ m: P.m, F: P.F, mu: P.mu, v: P.v0, g }).resultante;
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;
  const ETAPES = [
    { id: 'coussin', titre: 'Faut-il une force pour avancer ?', vis: V0, depart: () => voir({ mu: 0, F: 0, v0: 1 }, 3),
      texte: <>Un palet est lancé sur une table à <strong>coussin d’air</strong> : l’air le soulève et supprime presque tous les frottements. Après le lancer, <strong>plus rien ne le pousse</strong>. Regardez la chronophotographie (un point toutes les 0,5 s) et la courbe de vitesse.
        <ExempleResolu><strong>Comment lire une chronophotographie ?</strong> Si les points s’écartent de plus en plus, l’objet va de plus en plus vite. S’ils restent toujours espacés de la même distance, l’objet parcourt la même distance à chaque intervalle de temps : sa vitesse ne change pas. Exemple : une bille qui tombe laisse des points de plus en plus écartés, donc sa vitesse augmente.
          {bouton('Voir la simulation', () => voir({ mu: 0, F: 0, v0: 1 }, 3))}</ExempleResolu>
        À vous : que fait la vitesse du palet après le lancer ?</>,
      tache: { type: 'qcm', q: 'Après le lancer, sans frottement, la vitesse du palet…', options: ['reste constante : les points sont espacés pareil', 'diminue peu à peu, car la force du lancer s’épuise', 'augmente peu à peu, car le palet prend de l’élan', 'devient nulle aussitôt, car plus rien ne le pousse'], bonne: 0, expl: 'Sans frottement, la vitesse reste constante : il n’y a pas besoin de force pour maintenir un mouvement.', indice: "Regarde l’écart entre les points de la chronophotographie : est-il toujours le même ? Sans frottement, quelles forces horizontales s’exercent sur le palet après le lancer ?" } },
    { id: 'vertical', titre: 'Poids et réaction du sol', vis: V1, depart: () => voir({ m: 20, mu: 0, F: 0, v0: 1 }, 3),
      retenirTitre: 'À RETENIR : IL N’Y A PAS BESOIN DE FORCE POUR AVANCER',
      retenir: <>
        <SchemaChrono/>
        <Cle>Une force change la vitesse ; elle ne l’entretient pas.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Idée fausse :</strong> « il faut une force pour qu’un objet continue d’avancer ».</li>
          <li><strong>Vrai :</strong> sans frottement, le palet garde sa vitesse : c’est un mouvement <strong>rectiligne uniforme</strong> (en ligne droite, à vitesse constante).</li>
        </ul>
      </>,
      texte: <>Le palet n’est pas « sans force » pour autant. On modélise la caisse par un <strong>point G</strong> (son centre) : <strong>toutes les forces sont dessinées depuis G</strong>. La Terre l’attire : c’est son <strong>poids</strong> <Vec c="P"/>, vers le bas. La table le soutient : c’est la <strong>réaction du support</strong> <Vec c="R"/>, vers le haut.
        <ExempleResolu>Un livre de <strong>2 kg</strong> est posé sur une table. Il ne s’enfonce pas et ne s’envole pas : verticalement, <strong>poids et réaction se compensent</strong> (même direction, sens opposés, même intensité). Donc R = P = m × g = 2 × 9,8 = <strong>19,6 N</strong>.
          {bouton('Voir la caisse de 20 kg', () => voir({ m: 20, mu: 0, F: 0, v0: 1 }, 3))}</ExempleResolu>
        À vous : la caisse de 20 kg (g = 9,8 N/kg).</>,
      tache: { type: 'num', q: 'Quelle est l’intensité de la réaction du sol sur la caisse de 20 kg ?', unite: 'N', vrai: 196, tol: 0.05, affiche: x => String(x), pieges: [[20, 'C’est la masse en kg. La réaction vaut m × g.'], [19.6, 'Vérifiez l’ordre de grandeur : 20 × 9,8.'], [20 / 9.8, 'On multiplie : P = m × g (on ne divise pas la masse par g).']],
        calcul: () => [
          'Verticalement, la caisse ne monte ni ne descend : le poids P et la réaction R se compensent. Elles ont donc la même intensité : R = P.',
          'Le poids se calcule avec P = m × g, avec m = 20 kg et g = 9,8 N/kg.',
          'P = 20 × 9,8 = 196 N.',
          'Donc R = P = 196 N.'], expl: 'R = P = m × g = 20 × 9,8 = 196 N.', indice: "La caisse ne bouge pas verticalement : que doivent faire la réaction du sol et le poids ? Calcule le poids avec P = m × g (g = 9,8 N/kg). Tu peux aussi mesurer la flèche du poids avec l’échelle du schéma." } },
    { id: 'resultante', titre: 'La résultante des forces', vis: V2, depart: () => voir({ m: 25, mu: 0.2, F: 49, v0: 1 }, 3),
      retenirTitre: 'À RETENIR : POIDS ET RÉACTION',
      retenir: <>
        <SchemaPoidsReaction/>
        <Cle>Immobile en hauteur : la réaction du support est égale au poids.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Le <strong>poids</strong> <Vec c="P"/> est la force exercée par la Terre (à distance) ; la <strong>réaction</strong> <Vec c="R"/> est la force exercée par le support (de contact).</li>
          <li><strong>Verticalement : R = P = m × g.</strong> Exemple : 20 kg et g = 9,8 N/kg donnent P = 20 × 9,8 = 196 N.</li>
        </ul>
      </>,
      texte: <>Pour savoir si des forces se compensent, on les <strong>additionne</strong> : la <strong>résultante</strong> <Vec c="ΣF"/> est la somme vectorielle de toutes les forces. Si <Vec c="ΣF"/> = <Vec c="0"/>, les forces <strong>se compensent</strong>. Ici, deux forces horizontales s’ajoutent : la <strong>poussée</strong> <Vec c="F"/> (la main, le moteur…) et les <strong>frottements</strong> <Vec c="f"/> du sol (ils freinent).
        <ExempleResolu>Caisse de 25 kg glissant à 1 m/s sur un sol normal. Les frottements valent <strong>49 N</strong>, vers la gauche. Une poussée de <strong>49 N</strong> vers la droite les compense : <Vec c="ΣF"/> = <Vec c="0"/> (la flèche violette disparaît).
          {bouton('Voir cette situation', () => voir({ m: 25, mu: 0.2, F: 49, v0: 1 }, 3))}</ExempleResolu>
        À vous : coupez la poussée en ramenant le curseur (ou les boutons) à 0 N.</>,
      tache: { type: 'action', ok: enGuide && P.m === 25 && P.mu === 0.2 && P.F === 0 && Math.abs(r0.x) > tolF(P.m), consigne: 'Mettez la poussée à 0 N : qu’arrive-t-il à la résultante et à la vitesse ?' } },
    { id: 'constante', titre: 'Avancer à vitesse constante', vis: V2, depart: () => voir({ m: 25, mu: 0.2, F: 0, v0: 1 }, 0.3),
      retenirTitre: 'À RETENIR : FORCES QUI SE COMPENSENT',
      retenir: <>
        <SchemaCompense/>
        <Cle>Les flèches s’annulent deux à deux : la vitesse ne change pas.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Deux forces <strong>se compensent</strong> si elles ont même direction, <strong>sens opposés</strong> et <strong>même intensité</strong> : leur résultante <Vec c="ΣF"/> est nulle.</li>
          <li>La poussée ne sert pas à « faire avancer » mais à <strong>annuler les frottements</strong> : deux flèches égales et opposées.</li>
        </ul>
      </>,
      texte: <>Sur un sol avec frottements, il faut pousser pour que la caisse garde sa vitesse. Pourquoi ? Pour <strong>compenser</strong> les frottements : la poussée ne sert pas à « faire avancer », mais à annuler les frottements.
        <ExempleResolu>La caisse part à 1 m/s. Sans poussée, les frottements la freinent jusqu’à l’arrêt.</ExempleResolu>
        À vous : sur ce sol, les frottements valent toujours <strong>49 N</strong>. Réglez la poussée pour que la caisse garde une vitesse constante de 1 m/s.</>,
      tache: { type: 'action', ok: enGuide && P.m === 25 && P.mu === 0.2 && P.v0 === 1 && Math.abs(P.F - 49) <= 1.0001, consigne: 'Réglez la poussée F (curseur ou boutons − et +) pour que la résultante soit nulle et que la vitesse reste constante.' } },
    { id: 'accelere', titre: 'Quand les forces ne se compensent pas', vis: V2, depart: () => voir({ m: 25, mu: 0.2, F: 49, v0: 1 }, 6),
      texte: <>Si la poussée est <strong>plus grande</strong> que les frottements, la résultante n’est plus nulle : elle est dirigée vers l’avant et la <strong>vitesse augmente</strong>.
        <ExempleResolu>Avec une poussée de 100 N et des frottements de 49 N, la résultante vaut 51 N vers la droite : la vitesse augmente. Plus la résultante est grande, plus la vitesse varie vite.
          {bouton('Voir cet exemple', () => voir({ m: 25, mu: 0.2, F: 100, v0: 1 }, 6))}</ExempleResolu>
        À vous : faites <strong>accélérer</strong> la caisse.</>,
      tache: { type: 'action', ok: enGuide && P.mu > 0 && vFin > P.v0 + 0.8 && P.F > 0, consigne: 'Réglez la poussée pour que la vitesse à 6 s dépasse nettement la vitesse de départ.' } },
    { id: 'freine', titre: 'Pourquoi la caisse s’arrête-t-elle ?', vis: V2, depart: () => voir({ m: 25, mu: 0.2, F: 0, v0: 2 }, 0.5),
      texte: <>On lance la caisse à 2 m/s, sans la pousser. Elle ralentit puis s’arrête. Contrairement à ce qu’on croit souvent, ce n’est pas parce que « la force du lancer s’épuise » : il n’y en a plus.
        <ExempleResolu>Un cycliste arrête de pédaler sur une route horizontale : il ralentit peu à peu. La vitesse varie, donc les forces ne se compensent pas : rien ne compense les frottements (de l’air et de la route).</ExempleResolu>
        À vous : regardez les flèches de la caisse lancée.</>,
      tache: { type: 'qcm', q: 'Pourquoi la caisse ralentit-elle ?', options: ['Les frottements ne sont compensés par aucune force', 'Il n’y a plus aucune force sur la caisse', 'La force du lancer s’est épuisée petit à petit', 'Le poids de la caisse diminue peu à peu'], bonne: 0, expl: 'Les frottements sont la seule force horizontale : la résultante n’est pas nulle, la vitesse diminue.', indice: "Principe d’inertie : la vitesse ne change que si les forces ne se compensent pas. Quelles forces horizontales s’exercent sur la caisse une fois lancée ?" } },
    { id: 'principe', titre: 'Le principe d’inertie', vis: V2, depart: null,
      retenirTitre: 'À RETENIR : FORCES NON COMPENSÉES',
      retenir: <>
        <SchemaNonCompense/>
        <Cle>Résultante non nulle : la vitesse change (sa valeur ou sa direction).</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Si <Vec c="ΣF"/> ≠ <Vec c="0"/>, la <strong>vitesse varie</strong>. Plus la résultante est grande, plus elle varie vite.</li>
          <li>La caisse lancée s’arrête à cause des <strong>frottements</strong>, pas parce que « la force du lancer s’épuise ».</li>
        </ul>
      </>,
      texte: <>Vous venez de le vérifier plusieurs fois : c’est le <strong>principe d’inertie</strong>. Si les forces qui s’exercent sur un système <strong>se compensent</strong> (<Vec c="ΣF"/> = <Vec c="0"/>), alors il est <strong>immobile</strong> ou en <strong>mouvement rectiligne uniforme</strong>. Et dans l’autre sens : si la <strong>vitesse varie</strong> (valeur ou direction), les forces <strong>ne se compensent pas</strong>. Il n’est donc pas nécessaire d’avoir une force pour entretenir un mouvement.</>, tache: null },
    { id: 'voiture', titre: 'Une voiture sur l’autoroute', vis: V2, cas: 'voiture', depart: null,
      retenirTitre: 'À RETENIR : LE PRINCIPE D’INERTIE',
      retenir: <>
        <SchemaPrincipe/>
        <Cle>Forces compensées ⇔ immobile ou vitesse constante en ligne droite.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Si <Vec c="ΣF"/> = <Vec c="0"/>, le système est <strong>immobile</strong> ou en <strong>mouvement rectiligne uniforme</strong>.</li>
          <li><strong>Dans les deux sens :</strong> si la vitesse varie, les forces ne se compensent pas. Aucune force n’est nécessaire pour <em>entretenir</em> un mouvement.</li>
        </ul>
      </>,
      texte: <>Appliquons le principe d’inertie. Une voiture roule à 90 km/h en ligne droite sur une route horizontale. Quatre forces s’exercent sur elle : le poids, la réaction de la route, la <strong>force motrice</strong> (la route pousse la voiture vers l’avant quand les roues tournent) et les frottements (air et route).
        <ExempleResolu>Un train roule à 160 km/h en ligne droite sur une voie horizontale. Vitesse constante et trajectoire droite : les forces se compensent. Verticalement, le poids compense la réaction de la voie. Horizontalement, la force motrice du train compense les frottements.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'La voiture roule à 90 km/h en ligne droite. Que peut-on dire de la force motrice et des frottements ?', options: ['Elles se compensent : même intensité, sens opposés', 'La force motrice est plus grande, sinon la voiture n’avancerait pas', 'Les frottements sont plus grands, sinon la voiture accélérerait', 'Il n’y a ni force motrice ni frottements : elle avance toute seule'], bonne: 0, expl: 'Vitesse constante en ligne droite : vec(ΣF) = vec(0), donc la force motrice compense exactement les frottements.', indice: "Le mouvement est rectiligne et uniforme. Que dit le principe d’inertie des forces dans ce cas ? Applique-le aux forces horizontales." } },
    { id: 'virage', titre: 'Un virage à valeur de vitesse constante', vis: V2, cas: 'virage', depart: null,
      texte: <>Attention : la vitesse est un <strong>vecteur</strong> (valeur, direction, sens). Elle est constante seulement si sa valeur <em>et</em> sa direction ne changent pas.
        <ExempleResolu>Un cycliste roule à 20 km/h sur une piste circulaire. La valeur de sa vitesse ne change pas, mais la <strong>direction</strong> de sa vitesse change à chaque instant : le vecteur vitesse varie. Les forces qui s’exercent sur lui ne se compensent donc pas.</ExempleResolu>
        À vous : une voiture prend un virage à 50 km/h.</>,
      tache: { type: 'qcm', q: 'Dans un virage à valeur de vitesse constante, les forces sur la voiture…', options: ['ne se compensent pas, car la direction de v change', 'se compensent, car la valeur de v est constante', 'sont nulles, car la voiture roule vite', 'ont une résultante dirigée vers l’arrière'], bonne: 0, expl: 'La direction de la vitesse change : le vecteur vitesse varie, donc les forces ne se compensent pas.', indice: "Le principe d’inertie concerne un mouvement rectiligne uniforme. Dans un virage, la direction de la vitesse change-t-elle ? Le mouvement est-il rectiligne ?" } },
    { id: 'parachute', titre: 'Un parachutiste', vis: V2, cas: 'parachute', depart: null,
      texte: <>Un parachutiste saute. Au début, il accélère : les frottements de l’air sont faibles. Plus il va vite, plus les frottements augmentent. Puis sa vitesse n’augmente plus : il a atteint sa <strong>vitesse limite</strong>.
        <ExempleResolu>Un ascenseur monte à vitesse constante, en ligne droite. Les forces se compensent : le poids (vers le bas) est compensé par la force du câble (vers le haut), de même intensité.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'À la vitesse limite (constante, en ligne droite), les frottements de l’air valent…', options: ['exactement le poids du parachutiste', 'plus que le poids : le parachutiste ralentit', 'moins que le poids : le parachutiste accélère', 'zéro : l’air n’agit plus sur lui'], bonne: 0, expl: 'Vitesse constante en ligne droite : vec(ΣF) = vec(0). Les frottements de l’air compensent le poids.', indice: "Vitesse constante en ligne droite : que dit le principe d’inertie des forces ? Quelles forces verticales s’exercent sur le parachutiste ?" } },
    { id: 'iss', titre: '★ Les astronautes de la Station spatiale', vis: V2, cas: 'iss', depart: null,
      texte: <>À 400 km d’altitude, l’attraction de la Terre est encore forte (environ 90 % de sa valeur au sol). Les astronautes flottent pourtant. Seule force : le poids (l’attraction de la Terre). Ils sont en <strong>chute libre</strong> autour de la Terre.
        <ExempleResolu>Une pierre est lâchée (frottements négligés) : une seule force s’exerce sur elle, son poids. Elle ne peut pas être compensée : la vitesse varie, la pierre tombe de plus en plus vite.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Pour un astronaute en orbite, soumis seulement à l’attraction de la Terre, les forces…', options: ['ne se compensent pas (une seule force)', 'se compensent', 'sont nulles', 'ont une résultante nulle car la gravité a disparu'], bonne: 0, expl: 'Une seule force ne peut pas se compenser elle-même : la vitesse varie (la direction change), comme le prévoit le principe d’inertie.', indice: "Combien de forces s’exercent sur l’astronaute ? Que faut-il (au minimum) pour que des forces se compensent ?" } },
    { id: 'fin', titre: 'Bravo ! Le bilan', vis: V2, depart: null,
      retenirTitre: 'À RETENIR : APPLIQUER LE PRINCIPE D’INERTIE',
      retenir: <>
        <SchemaApplique/>
        <Cle>Je regarde la vitesse : constante en ligne droite, les forces se compensent ; sinon non.</Cle>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Voiture à 90 km/h, route droite</strong> : forces compensées (force motrice = frottements). <strong>Virage à 50 km/h</strong> : la direction change, forces non compensées.</li>
          <li><strong>Parachutiste à vitesse limite</strong> : frottements de l’air = poids. <strong>Astronaute en orbite</strong> : une seule force, donc non compensée.</li>
        </ul>
      </>,
      texte: <>Bravo : vous savez appliquer le principe d’inertie. Résumé : forces qui <strong>se compensent</strong> (<Vec c="ΣF"/> = <Vec c="0"/>) ⇒ vitesse constante (repos ou mouvement rectiligne uniforme) ; vitesse qui <strong>varie</strong> ⇒ forces qui ne se compensent pas ; pas besoin de force pour <em>entretenir</em> un mouvement, mais les frottements, eux, le freinent.</>, tache: null },
  ];
  const etapeCourante = ETAPES[Math.min(guide.etape, ETAPES.length - 1)];
  useEffect(() => {
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type, prec) {
    const d = nouveauDefi(type, prec); setDefi(d); setLecture(false);
    if (type === 'regler') { setP(p => ({ ...p, F: 0, m: d.m, mu: d.mu, v0: d.v0 })); setT(0.3); }
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'bilan', null); }

  // ════════════════ PANNEAUX ════════════════
  const verdict = compense(res, P.m)
    ? <div style={{ color: VERT, fontWeight: 700 }}><Pic n="ok"/>Les forces se compensent (<Vec c="ΣF"/> = <Vec c="0"/>) : {Math.abs(vT) < 1e-6 ? 'la caisse est immobile.' : `la vitesse est constante (${fr(vT, 2)} m/s) : mouvement rectiligne uniforme.`}</div>
    : <div style={{ color: ORANGE, fontWeight: 700 }}><Pic n="warn"/>Les forces ne se compensent pas (résultante de {fr(Math.abs(res.x), 0)} N) : la vitesse {res.x * (Math.abs(vT) < 1e-6 ? 1 : vT) > 0 ? 'augmente' : 'diminue'}.</div>;
  const aide = { fontSize: 12.5, color: KIT.txt2, fontWeight: 400, display: 'block', lineHeight: 1.4 };
  const change = d => setP(p => ({ ...p, F: clamp(Math.round((p.F + d) * 10) / 10, -150, 150) }));
  const controlePousse = pas => (
    <div>
      <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>Poussée F : <strong>{fr(P.F, pas < 1 ? 1 : 0)} N</strong>
        <span style={aide}>Positive : vers la droite. Négative : vers la gauche.</span>
        <input type="range" min="-150" max="150" step={pas} value={P.F} aria-label="Poussée en newtons" onChange={e => setP(p => ({ ...p, F: +e.target.value }))} style={{ width: '100%' }}/></label>
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <button onClick={() => change(-pas)} aria-label={`Diminuer la poussée de ${fr(pas, pas < 1 ? 1 : 0)} newton`} style={{ ...stylePetitBouton(false, '#0b4f94'), minHeight: 40, minWidth: 64 }}>− {fr(pas, pas < 1 ? 1 : 0)} N</button>
        <button onClick={() => change(pas)} aria-label={`Augmenter la poussée de ${fr(pas, pas < 1 ? 1 : 0)} newton`} style={{ ...stylePetitBouton(false, '#0b4f94'), minHeight: 40, minWidth: 64 }}>+ {fr(pas, pas < 1 ? 1 : 0)} N</button></div>
    </div>);
  const lectureTemps = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
      <button onClick={() => { if (t >= T_MAX - 1e-9) setT(0); setLecture(l => !l); }} style={styleBouton(true, '#0b4f94')}>{lecture ? '⏸ Pause' : '▶ Lecture'}</button>
      <label style={{ flex: '1 1 200px', fontSize: 13.5, fontWeight: 600 }}>Date : <strong>{fr(t, 1)} s</strong>
        <input type="range" min="0" max={T_MAX} step="0.1" value={t} aria-label="Date en secondes" onChange={e => { setLecture(false); setT(+e.target.value); }} style={{ width: '100%' }}/></label></div>);
  const resumeReglages = `${P.m} kg · ${nomSol(P.mu)} · vitesse de départ ${fr(P.v0, 1)} m/s`;
  const reglagesExplo = (
    <Section titre={`Réglages de la caisse : ${resumeReglages}`} ouvert={regOuv} onBascule={() => setRegOuv(o => !o)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 13.5, fontWeight: 600 }}>Masse : <strong>{P.m} kg</strong>
          <span style={aide}>Plus la caisse est lourde, plus le poids et les frottements sont grands.</span>
          <input type="range" min="5" max="60" step="5" value={P.m} aria-label="Masse en kilogrammes" onChange={e => setP(p => ({ ...p, m: +e.target.value }))} style={{ width: '100%' }}/></label>
        <label style={{ fontSize: 13.5, fontWeight: 600 }}>Vitesse de départ : <strong>{fr(P.v0, 1)} m/s</strong>
          <span style={aide}>Vitesse de la caisse à la date 0 s (négative : vers la gauche).</span>
          <input type="range" min="-2" max="3" step="0.5" value={P.v0} aria-label="Vitesse initiale en mètres par seconde" onChange={e => setP(p => ({ ...p, v0: +e.target.value }))} style={{ width: '100%' }}/></label>
        <label style={{ fontSize: 13.5, fontWeight: 600 }}>Sol
          <span style={aide}>Change la valeur des frottements : avec ce sol, f = {fr(fk, 0)} N quand la caisse glisse.</span>
          <select value={P.mu} onChange={e => setP(p => ({ ...p, mu: +e.target.value }))} aria-label="Type de sol" style={{ width: '100%', minHeight: 42, padding: '6px 8px', fontSize: 14.5, borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: '#fff' }}>
            {SOLS.map(([mu, l]) => <option key={mu} value={mu}>{l}</option>)}</select></label>
        <label style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={contact} onChange={e => setContact(e.target.checked)} style={{ marginTop: 3 }}/>
          <span>Voir les points de contact réels<span style={aide}>Par défaut, la caisse est un point G et toutes les forces partent de G. Cochez pour dessiner la réaction et les frottements au contact du sol.</span></span></label>
      </div>
    </Section>);
  // scène + commandes : vis = éléments visibles (parcours), explo = tous les réglages dans une section repliée
  const plancheEtControles = ({ vis = TOUT, explo = false, avecVerdict = true, pas = 1 } = {}) => (
    <div style={styleBoite}>
      <Scene P={Peff} sim={sim} t={t} vis={vis} contact={explo && contact}/>
      {lectureTemps}
      {vis.ctlPousse && <div style={{ marginTop: 8 }}>{controlePousse(explo ? 0.1 : pas)}</div>}
      {explo && <div style={{ marginTop: 10 }}>{reglagesExplo}</div>}
      <div style={{ marginTop: 8 }}><Graphe sim={sim} t={t}/></div>
      {avecVerdict && vis.verdict && <div style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.5 }}>{verdict}</div>}
    </div>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Système = la caisse</strong>, modélisée par un <strong>point matériel G</strong> (ses dimensions n’interviennent pas) : toutes les forces sont donc dessinées depuis G. L’option « points de contact réels » (exploration) montre où elles s’exercent vraiment : la réaction et les frottements au contact du sol, la poussée sur la face poussée.</li>
      <li><strong>Référentiel terrestre</strong>, supposé galiléen : le principe d’inertie s’y applique.</li>
      <li><strong>Frottements solides</strong> de valeur constante f = μ·m·g (μ : nombre sans unité qui dépend du sol), opposés au mouvement. On néglige les frottements de l’air (sauf dans les exemples du parcours). Le coefficient μ est supposé le même au repos et en mouvement. Le programme de seconde ne demande pas de manipuler μ : on donne directement la valeur de f.</li>
      <li><strong>Calcul du mouvement</strong> : pour animer la caisse, la simulation utilise un calcul numérique de la vitesse, hors programme de seconde. Vous n’avez qu’à observer la vitesse : le programme n’exige que le principe d’inertie.</li>
      <li><strong>Seuil de compensation</strong> : on considère que les forces se compensent si la résultante est inférieure à un petit seuil (de 0,05 N à 0,5 N selon la masse du solide) : en dessous, la vitesse varie de moins de 0,05 m/s en 6 s, ce qui est invisible à l’écran. Dans le défi « Régler la poussée », la poussée est acceptée à 1 N près (le curseur avance par pas de 1 N).</li>
      <li><strong>g = 9,8 N/kg</strong>. Le poids et la réaction du sol sont toujours égaux (le sol ne s’enfonce pas).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <Section titre="À essayer" ouvert={essOuv} onBascule={() => setEssOuv(o => !o)}>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
          <li>Sol « sans frottement », poussée nulle, vitesse de départ 2 m/s : que fait la vitesse ? Et les points de la chronophotographie ?</li>
          <li>Sol normal : trouvez la poussée qui garde la vitesse constante. Comparez-la à la valeur des frottements.</li>
          <li>Doublez la masse sans changer la poussée : que changent les frottements ? Faut-il pousser plus fort ?</li>
          <li>Mettez une vitesse de départ négative (vers la gauche) et une poussée vers la droite : quel est le sens des frottements ?</li>
          <li>Poussée de 20 N sur un sol à frottements de 49 N, caisse à l’arrêt : que se passe-t-il ? Quelle est alors la valeur du frottement ? (il s’adapte à la poussée, sans dépasser 49 N)</li>
        </ul>
      </Section>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>forces qui se compensent ⇒ vitesse constante (immobile, ou mouvement rectiligne uniforme)</li>
    <li>vitesse qui varie ⇒ forces qui ne se compensent pas</li>
    <li>pas de force nécessaire pour entretenir un mouvement</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);
  const finDuGuide = enGuide && etapeCourante.id === 'fin';
  const zoneGuide = etapeCourante.cas ? <div style={styleBoite}><SchemaCas cas={etapeCourante.cas}/></div> : plancheEtControles({ vis: etapeCourante.vis, pas: 1 });
  const zoneDefi = defi && defi.type === 'regler'
    ? plancheEtControles({ vis: { poids: 1, reaction: 1, pousse: 1, frott: 1, ctlPousse: 1 }, avecVerdict: false, pas: 1 }) : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pi-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pi-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pi-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .pi-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Principe d’inertie : forces et mouvement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Faut-il une force pour qu’un objet avance ? Poussez une caisse sur différents sols, observez les <strong>forces</strong>, leur <strong>résultante</strong>, la <strong>chronophotographie</strong> et la <strong>vitesse</strong>, et découvrez le <strong>principe d’inertie</strong>.</div>
      <div className={`pi-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} P={Peff} changerType={t2 => lancer(t2, defi)} planche={zoneDefi}/></div>}
          {enGuide && zoneGuide}
          {enExplore && plancheEtControles({ vis: TOUT, explo: true })}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {(enExplore || finDuGuide) && <div className="pi-l2">{panneauHypo}</div>}
      {enExplore && <div className="pi-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
