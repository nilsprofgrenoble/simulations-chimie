// Cartes « À retenir » dessinées dans le style des scènes (projecteurs sur un écran, filtres, coupe de peinture).
// viewBox de 300 de large, textes de 12,5 à 14 (au moins 9 px rendus sur téléphone), largeur plafonnée.
import { useId } from "react";
import { spectreRVB, cssLumiere, cssFiltre, cssPeinture, transmittance, reflPeinture } from "./synthCouleurModele";
import { Fleche } from "./SyntheseScenes";
import { CANAUX, aLambda, pc, Tx } from "./syntheseOutils";

const K = { gris: '#64748b', orange: '#b45309' };
const COL = [60, 150, 240];

/** Synthèse additive : trois projecteurs, un écran, les zones de recouvrement avec leur couleur. */
export function SvgCarteAdditive() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c = (r, v, b) => cssLumiere(spectreRVB(r, v, b));
  const R = 34, E = { r: [62, 124], v: [118, 124], b: [90, 172] };
  const lampes = [{ x: 36, col: '#dc2626', n: 'R', k: 'r' }, { x: 90, col: '#16a34a', n: 'V', k: 'v' }, { x: 144, col: '#2563eb', n: 'B', k: 'b' }];
  const cercle = (k, fill) => <circle cx={E[k][0]} cy={E[k][1]} r={R} fill={fill}/>;
  const lignes = [[c(1, 1, 0), 'jaune', 'R + V'], [c(1, 0, 1), 'magenta', 'R + B'], [c(0, 1, 1), 'cyan', 'V + B'], [c(1, 1, 1), 'blanc', 'R + V + B']];
  return <svg role="img" aria-label="Synthèse additive : trois projecteurs rouge, vert et bleu éclairent le même endroit d’un écran ; les lumières s’ajoutent" viewBox="0 0 300 238" width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>
    <defs>{['r', 'v'].map(k => <clipPath key={k} id={id + k}><circle cx={E[k][0]} cy={E[k][1]} r={R}/></clipPath>)}<clipPath id={id + 'b'}><circle cx={E.b[0]} cy={E.b[1]} r={R}/></clipPath></defs>
    {Tx(150, 16, 'Synthèse additive : on ajoute des lumières', { size: 13.5, gras: true })}
    <rect x="8" y="64" width="168" height="148" rx="10" fill="#0f172a" stroke="#475569" strokeWidth="2"/>
    {lampes.map(l => <polygon key={l.k} points={`${l.x - 7},50 ${l.x + 7},50 ${E[l.k][0] + R},${E[l.k][1] - 6} ${E[l.k][0] - R},${E[l.k][1] - 6}`} fill={l.col} fillOpacity="0.16"/>)}
    {cercle('r', c(1, 0, 0))}{cercle('v', c(0, 1, 0))}{cercle('b', c(0, 0, 1))}
    <g clipPath={`url(#${id}r)`}><circle cx={E.v[0]} cy={E.v[1]} r={R} fill={c(1, 1, 0)}/><circle cx={E.b[0]} cy={E.b[1]} r={R} fill={c(1, 0, 1)}/></g>
    <g clipPath={`url(#${id}v)`}><circle cx={E.b[0]} cy={E.b[1]} r={R} fill={c(0, 1, 1)}/></g>
    <g clipPath={`url(#${id}r)`}><g clipPath={`url(#${id}v)`}><circle cx={E.b[0]} cy={E.b[1]} r={R} fill={c(1, 1, 1)}/></g></g>
    {lampes.map(l => <g key={l.n}><rect x={l.x - 17} y="24" width="34" height="24" rx="6" fill="#334155" stroke="#0f172a" strokeWidth="1.5"/>
      {Tx(l.x, 41, l.n, { size: 14, gras: true, fill: '#fff' })}<circle cx={l.x} cy="50" r="5" fill={l.col} stroke="#0f172a" strokeWidth="1.2"/></g>)}
    {lignes.map(([col, nom, f], i) => <g key={nom}>
      <rect x="186" y={78 + i * 34} width="16" height="16" rx="4" fill={col} stroke="#0f172a" strokeWidth="1.2"/>
      {Tx(210, 90 + i * 34, nom, { size: 13.5, gras: true, anchor: 'start' })}{Tx(210, 104 + i * 34, f, { size: 12.5, anchor: 'start', fill: K.gris })}</g>)}
    {Tx(150, 232, 'l’œil ne garde que 3 nombres (L, M, S)', { size: 13, gras: true })}
  </svg>;
}

/** Synthèse soustractive : deux filtres en série (flèches qui s'affinent) puis coupe d'une peinture (renvoyé / absorbé). */
export function SvgCarteSoustractive() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const Tj = transmittance({ jaune: 0.8 }), Tc = transmittance({ cyan: 0.8 });
  const Tp = Tj.map((v, i) => v * Tc[i]);
  const Rp = reflPeinture({ jaune: 0.5, cyan: 0.5 });
  const bulles = [[92, 258, '#facc15'], [118, 266, '#22d3ee'], [150, 257, '#facc15'], [182, 267, '#22d3ee'], [214, 258, '#facc15'], [244, 266, '#22d3ee'], [268, 257, '#22d3ee']];
  return <svg role="img" aria-label="Synthèse soustractive : deux filtres retirent de la lumière, une peinture en renvoie une partie et en absorbe le reste" viewBox="0 0 300 390" width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>
    <defs>
      <linearGradient id={id + 'j'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#facc15" stopOpacity="0.9"/><stop offset="1" stopColor="#facc15" stopOpacity="0.5"/></linearGradient>
      <linearGradient id={id + 'c'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity="0.9"/><stop offset="1" stopColor="#22d3ee" stopOpacity="0.5"/></linearGradient>
    </defs>
    {Tx(150, 16, 'Synthèse soustractive : on retire de la lumière', { size: 13.5, gras: true })}
    {CANAUX.map((cn, i) => {
      const x = COL[i], t1 = aLambda(Tj, cn.l), t2 = aLambda(Tc, cn.l), tp = t1 * t2, Rc = aLambda(Rp, cn.l), A = 1 - Rc;
      return <g key={cn.l}>
        {Tx(x, 34, cn.nom, { size: 12.5, gras: true, fill: cn.col })}
        <Fleche x={x} y1={40} y2={62} w={10} col={cn.col}/>
        <Fleche x={x} y1={79} y2={104} w={10 * t1} col={cn.col}/>
        <Fleche x={x} y1={121} y2={146} w={10 * tp} col={cn.col}/>
        {Tx(x, 160, `reste ${pc(tp)}`, { size: 12.5, gras: true })}
        <Fleche x={x - 14} y1={230} y2={247} w={8} col={cn.col}/>
        <Fleche x={x + 14} y1={247} y2={230} w={8 * Rc} col={cn.col}/>
        {Tx(x, 290, `renvoyé ${pc(Rc)}`, { size: 12.5, gras: true })}
        {Tx(x, 305, `absorbé ${pc(A)}`, { size: 12.5, gras: true, fill: K.orange })}
      </g>;
    })}
    <rect x="12" y="62" width="276" height="17" rx="6" fill={`url(#${id}j)`} stroke="#ca8a04" strokeWidth="1.5"/>{Tx(20, 75, 'filtre jaune', { size: 12.5, gras: true, anchor: 'start', fill: '#fff', halo: '#0f172a' })}
    <rect x="12" y="104" width="276" height="17" rx="6" fill={`url(#${id}c)`} stroke="#0891b2" strokeWidth="1.5"/>{Tx(20, 117, 'filtre cyan', { size: 12.5, gras: true, anchor: 'start', fill: '#fff', halo: '#0f172a' })}
    <line x1="12" y1="205" x2="288" y2="205" stroke="#cbd5e1" strokeDasharray="4 3"/>
    <rect x="40" y="168" width="220" height="14" rx="6" fill={cssFiltre(Tp)} stroke="#0f172a" strokeWidth="1.2"/>
    {Tx(150, 197, 'lumière qui sort des deux filtres', { size: 12.5, fill: K.gris })}
    
    <rect x="12" y="247" width="276" height="26" rx="4" fill={cssPeinture(Rp)} stroke="#334155" strokeWidth="1.5"/>
    {bulles.map(([bx, by, col], k) => <circle key={k} cx={bx} cy={by} r="4.5" fill={col} stroke="#0f172a" strokeOpacity="0.55" strokeWidth="0.9"/>)}
    {Tx(20, 264, 'peinture', { size: 12.5, gras: true, anchor: 'start', fill: '#fff', halo: '#0f172a' })}{Tx(150, 222, 'peinture jaune + cyan, vue en coupe', { size: 12.5, fill: K.gris })}
    <line x1="12" y1="314" x2="288" y2="314" stroke="#cbd5e1" strokeDasharray="4 3"/>
    {Tx(150, 332, 'filtres : T = T₁ × T₂', { size: 12.5 })}
    {Tx(150, 348, 'peintures : les K/S s’additionnent', { size: 12.5 })}
    {Tx(150, 366, 'primaires : cyan, magenta, jaune', { size: 13.5, gras: true, fill: K.orange })}
    {Tx(150, 382, 'C + M + J : presque noir', { size: 12.5 })}
  </svg>;
}
