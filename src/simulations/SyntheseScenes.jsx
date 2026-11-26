// Scènes illustrées de la simulation « Synthèse additive et synthèse soustractive » : trois lampes sur un écran,
// vue en coupe d'une peinture, filtres traversés par la lumière. SVG, textes de 11 à 14, largeur 100 % plafonnée.
import { useId } from "react";
import { LAMBDAS, spectreRVB, cssLumiere, cssFiltre } from "./synthCouleurModele";
import { pc, Tx, aLambda, CANAUX, COLX } from "./syntheseOutils";

const K = { txt: '#0f172a', gris: '#64748b', clair: '#cbd5e1' };
const NB = ' ';

/** Trois canaux représentatifs de la lumière blanche (le spectre entier est dans le graphique en dessous). */

export function Fleche({ x, y1, y2, w, col, op = 1, tirets }) {
  const s = Math.sign(y2 - y1) || 1, h = Math.min(11, w * 1.5 + 4), ww = Math.max(1.6, w);
  return <g opacity={op}><line x1={x} y1={y1} x2={x} y2={y2 - s * h} stroke={col} strokeWidth={ww} strokeDasharray={tirets ? '3 3' : ''}/>
    <polygon points={`${x - ww / 2 - 3},${y2 - s * h} ${x + ww / 2 + 3},${y2 - s * h} ${x},${y2}`} fill={col}/></g>;
}

// ---------- trois lampes sur un écran (synthèse additive) ----------
/** r, v, b : intensités des trois lampes (0 à 1). */
export function SceneLampes({ r = 0, v = 0, b = 0, label = 'Trois lampes éclairant le même endroit d’un écran' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const cs = (a, bb, c) => (a + bb + c < 0.001 ? '#0f172a' : cssLumiere(spectreRVB(a, bb, c)));
  const lampes = [{ x: 60, I: r, col: '#dc2626', nom: 'rouge' }, { x: 170, I: v, col: '#16a34a', nom: 'verte' }, { x: 280, I: b, col: '#2563eb', nom: 'bleue' }];
  const E = { r: { cx: 138, cy: 198 }, v: { cx: 202, cy: 198 }, b: { cx: 170, cy: 236 } }, RX = 48, RY = 36;
  const el = k => <ellipse cx={E[k].cx} cy={E[k].cy} rx={RX} ry={RY}/>;
  const cp = k => `url(#${id}${k})`;
  const reg = { r: cs(r, 0, 0), v: cs(0, v, 0), b: cs(0, 0, b), rv: cs(r, v, 0), rb: cs(r, 0, b), vb: cs(0, v, b), rvb: cs(r, v, b) };
  const lab = (x, y, s) => Tx(x, y, s, { size: 11, gras: true, fill: '#fff', halo: '#0f172a' });
  return <svg role="img" aria-label={label} viewBox="0 0 340 290" width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    <defs>
      {['r', 'v', 'b'].map(k => <clipPath key={k} id={id + k}>{el(k)}</clipPath>)}
      <linearGradient id={id + 'mur'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1e293b"/><stop offset="1" stopColor="#0f172a"/></linearGradient>
    </defs>
    {/* écran */}
    <rect x="12" y="150" width="316" height="132" rx="10" fill={`url(#${id}mur)`} stroke="#475569" strokeWidth="2"/>
    {Tx(22, 274, 'écran, dans le noir', { size: 11, anchor: 'start', fill: '#94a3b8' })}
    {/* faisceaux */}
    {lampes.map((l, i) => { const k = ['r', 'v', 'b'][i], e = E[k]; return <polygon key={k} points={`${l.x - 9},60 ${l.x + 9},60 ${e.cx + RX},${e.cy} ${e.cx - RX},${e.cy}`} fill={l.col} fillOpacity={0.05 + 0.3 * l.I}/>; })}
    {/* taches lumineuses */}
    {['r', 'v', 'b'].map(k => <g key={k}>{k === 'r' ? <ellipse cx={E.r.cx} cy={E.r.cy} rx={RX} ry={RY} fill={reg.r}/> : k === 'v' ? <ellipse cx={E.v.cx} cy={E.v.cy} rx={RX} ry={RY} fill={reg.v}/> : <ellipse cx={E.b.cx} cy={E.b.cy} rx={RX} ry={RY} fill={reg.b}/>}</g>)}
    <g clipPath={cp('r')}><ellipse cx={E.v.cx} cy={E.v.cy} rx={RX} ry={RY} fill={reg.rv}/></g>
    <g clipPath={cp('r')}><ellipse cx={E.b.cx} cy={E.b.cy} rx={RX} ry={RY} fill={reg.rb}/></g>
    <g clipPath={cp('v')}><ellipse cx={E.b.cx} cy={E.b.cy} rx={RX} ry={RY} fill={reg.vb}/></g>
    <g clipPath={cp('r')}><g clipPath={cp('v')}><ellipse cx={E.b.cx} cy={E.b.cy} rx={RX} ry={RY} fill={reg.rvb}/></g></g>
    {['r', 'v', 'b'].map(k => <ellipse key={'o' + k} cx={E[k].cx} cy={E[k].cy} rx={RX} ry={RY} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"/>)}
    {r > 0.01 && v > 0.01 && lab(170, 186, 'R+V')}{r > 0.01 && b > 0.01 && lab(147, 226, 'R+B')}{v > 0.01 && b > 0.01 && lab(193, 226, 'V+B')}{r > 0.01 && v > 0.01 && b > 0.01 && lab(170, 207, 'R+V+B')}
    {r > 0.01 && lab(100, 190, 'R')}{v > 0.01 && lab(240, 190, 'V')}{b > 0.01 && lab(170, 266, 'B')}
    {/* lampes */}
    {lampes.map(l => <g key={l.nom}>
      <rect x={l.x - 26} y="8" width="52" height="38" rx="7" fill="#334155" stroke="#0f172a" strokeWidth="1.5"/>
      {Tx(l.x, 25, l.nom, { size: 11.5, gras: true, fill: '#fff' })}{Tx(l.x, 40, pc(l.I), { size: 12, gras: true, fill: '#fde68a' })}
      <circle cx={l.x} cy="53" r="9" fill={l.col} fillOpacity={0.3 + 0.7 * l.I} stroke="#0f172a" strokeWidth="1.5"/>
    </g>)}
  </svg>;
}

// ---------- éléments communs aux scènes soustractives ----------
/** Motifs et dégradés partagés (hachures de la part absorbée). */
const Defs = ({ id }) => <defs>
  <pattern id={id + 'h'} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fde68a"/><line x1="0" y1="0" x2="0" y2="6" stroke="#d97706" strokeWidth="2.2"/></pattern>
</defs>;

/** Barre « renvoyé / absorbé » (ou « transmis / absorbé ») : la part conservée en couleur, la part absorbée hachurée. */
function BarreParts({ id, x, y, part, col, w = 70 }) {
  return <g>
    <rect x={x - w / 2} y={y} width={w} height="11" rx="3" fill={`url(#${id}h)`} stroke="#92400e" strokeWidth="1"/>
    <rect x={x - w / 2} y={y} width={Math.max(0, w * part)} height="11" rx="3" fill={col} stroke="#0f172a" strokeWidth="1"/>
  </g>;
}

/** Petit symbole de chaleur (la lumière absorbée échauffe le matériau). */
export const Chaleur = ({ x, y, op = 1 }) => <path d={`M${x - 9},${y} q3,-5 6,0 t6,0 t6,0`} fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" opacity={op}/>;

// ---------- coupe d'une couche de peinture ----------
const PIG = { jaune: '#facc15', magenta: '#d946ef', cyan: '#22d3ee', blanc: '#ffffff', noir: '#1f2937' };
const graine = n => { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

/** R : réflectance (tableau sur LAMBDAS) de la couche ; pig : fractions de pigments ; css : couleur de la couche. */
export function SceneCoupe({ R, pig = {}, css = '#999', label = 'Coupe d’une couche de peinture : lumière incidente, renvoyée et absorbée' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rnd = graine(11), parts = [], Y0 = 112, Y1 = 210;
  for (const [nom, fr] of Object.entries(pig)) {
    const n = fr > 0.001 ? Math.max(3, Math.round(fr * 14)) : 0;
    for (let i = 0, essais = 0; i < n && essais < 200; essais++) {
      const q = { nom, x: 14 + rnd() * 312, y: Y0 + 12 + rnd() * (Y1 - Y0 - 24), r: 4 + rnd() * 3 };
      if (parts.every(o => Math.hypot(o.x - q.x, o.y - q.y) > o.r + q.r + 1.5)) { parts.push(q); i++; }
    }
  }
  parts.sort((a, b) => a.y - b.y);
  return <svg role="img" aria-label={label} viewBox="0 0 340 322" width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    <Defs id={id}/>
    <defs>
      {Object.entries(PIG).map(([n, c]) => <radialGradient key={n} id={id + n} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity="0.85"/><stop offset="0.45" stopColor={c}/><stop offset="1" stopColor={c} stopOpacity="0.9"/></radialGradient>)}
      <linearGradient id={id + 'c'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.18"/><stop offset="1" stopColor="#000" stopOpacity="0.12"/></linearGradient>
      <pattern id={id + 's'} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect width="8" height="8" fill="#f1f5f9"/><line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="1.4"/></pattern>
    </defs>
    <rect x="0" y="0" width="340" height={Y0} fill="#f8fafc"/>
    {Tx(170, 14, 'lumière blanche incidente (trois de ses couleurs)', { size: 11.5, fill: K.gris })}
    <rect x="0" y={Y0} width="340" height={Y1 - Y0} fill={css}/><rect x="0" y={Y0} width="340" height={Y1 - Y0} fill={`url(#${id}c)`}/>
    {parts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={`url(#${id}${p.nom})`} stroke="#0f172a" strokeOpacity="0.55" strokeWidth="0.9"/>)}
    <rect x="0" y={Y1} width="340" height="28" fill={`url(#${id}s)`}/>
    <line x1="0" y1={Y0} x2="340" y2={Y0} stroke="#334155" strokeWidth="1.8"/><line x1="0" y1={Y1} x2="340" y2={Y1} stroke="#475569" strokeWidth="1.2"/>
    {Tx(8, Y0 - 6, 'air', { size: 11.5, anchor: 'start', fill: K.gris })}
    {Tx(8, Y0 + 16, 'peinture', { size: 11.5, anchor: 'start', gras: true, fill: '#fff', halo: '#0f172a' })}
    {Tx(8, Y1 + 18, 'support (sans effet : couche opaque)', { size: 11.5, anchor: 'start', fill: '#475569' })}
    {CANAUX.map((c, i) => {
      const x = COLX[i], Rc = aLambda(R, c.l), A = 1 - Rc, yFond = Y0 + 20 + 40 * A;
      return <g key={c.l}>
        {Tx(x, 32, `${c.nom} ${c.l}${NB}nm`, { size: 12, gras: true, fill: c.col })}
        <Fleche x={x - 14} y1={40} y2={Y0 - 1} w={8} col={c.col}/>
        <Fleche x={x + 14} y1={Y0 - 1} y2={40} w={8 * Rc} col={c.col} op={0.92}/>
        {/* trajet dans la couche : une part est diffusée et ressort, le reste s'enfonce et est absorbé */}
        <path d={`M${x - 14},${Y0} Q${x - 6},${Y0 + 38} ${x + 14},${Y0}`} fill="none" stroke={c.col} strokeWidth={1 + 4 * Rc} strokeLinecap="round" strokeDasharray="1 4"/>
        <line x1={x - 8} y1={Y0 + 19} x2={x - 8} y2={yFond} stroke="#fff" strokeWidth="2.2" strokeDasharray="3 3"/>
        {A > 0.06 && <Chaleur x={x - 8} y={yFond + 8} op={Math.min(1, A + 0.35)}/>}
        <BarreParts id={id} x={x} y={Y1 + 40} part={Rc} col={c.col}/>
        {Tx(x, Y1 + 68, `renvoyé ${pc(Rc)}`, { size: 12, gras: true })}
        {Tx(x, Y1 + 84, `absorbé ${pc(A)}`, { size: 12, gras: true, fill: '#b45309' })}
      </g>;
    })}
    {Tx(170, 316, 'couleur pleine : lumière renvoyée ; hachures : lumière absorbée', { size: 11, fill: K.gris })}
  </svg>;
}

// ---------- filtres traversés par la lumière ----------
/** filtres : [{ nom, T (tableau sur LAMBDAS), col }] placés l'un derrière l'autre. */
export function SceneFiltres({ filtres = [], label = 'Lumière blanche traversant un ou plusieurs filtres colorés' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const H0 = 52, SH = 42, GAP = 40, n = filtres.length;
  const yS = k => H0 + 34 + k * (SH + GAP), yFin = yS(n) - GAP + 34;
  const Tpro = LAMBDAS.map((_, i) => filtres.reduce((a, f) => a * (f.T[i] ?? 1), 1));
  const H = yFin + 128;
  return <svg role="img" aria-label={label} viewBox={`0 0 340 ${H}`} width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    <Defs id={id}/>
    <defs>{filtres.map((f, k) => <linearGradient key={k} id={`${id}g${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={f.col} stopOpacity="0.85"/><stop offset="1" stopColor={f.col} stopOpacity="0.45"/></linearGradient>)}</defs>
    <rect x="0" y="0" width="340" height={H} fill="#f8fafc"/>
    {/* lampe blanche */}
    <rect x="132" y="3" width="76" height="14" rx="5" fill="#334155"/><circle cx="170" cy="21" r="7" fill="#fff" stroke="#f59e0b" strokeWidth="2"/>
    {Tx(222, 15, 'lampe blanche', { size: 11.5, anchor: 'start', fill: K.gris })}
    {CANAUX.map((c, i) => {
      const x = COLX[i]; let cum = 1; const out = [];
      out.push(<g key="t">{Tx(x, 42, `${c.nom} ${c.l}${NB}nm`, { size: 12, gras: true, fill: c.col })}<Fleche x={x} y1={H0 - 2} y2={yS(0) - 1} w={13} col={c.col}/>{Tx(x - 16, H0 + 24, pc(1), { size: 11, fill: K.gris, anchor: 'end' })}</g>);
      filtres.forEach((f, k) => {
        const t = aLambda(f.T, c.l), apres = cum * t, y = yS(k), yBas = k === n - 1 ? yFin : yS(k + 1) - 1;
        out.push(<g key={k}>
          <rect x={x - 24} y={y + SH - 22} width={48} height={17} rx={8} fill="#fff" fillOpacity="0.92" stroke="#0f172a" strokeOpacity="0.5"/>{Tx(x, y + SH - 9.5, `−${pc(cum - apres)}`, { size: 12, gras: true, fill: '#0f172a' })}
          {cum - apres > 0.08 && <Chaleur x={x + 40} y={y + SH - 12} op={Math.min(1, (cum - apres) + 0.4)}/>}
          <Fleche x={x} y1={y + SH + 1} y2={yBas} w={13 * apres} col={c.col}/>
          {k < n - 1 && Tx(x - 16, y + SH + 24, pc(apres), { size: 11, fill: K.gris, anchor: 'end' })}
        </g>);
        cum = apres;
      });
      out.push(<BarreParts key="b" id={id} x={x} y={yFin + 10} part={cum} col={c.col}/>, Tx(x, yFin + 38, `transmis ${pc(cum)}`, { size: 12, gras: true }), Tx(x, yFin + 54, `absorbé ${pc(1 - cum)}`, { size: 12, gras: true, fill: '#b45309' }));
      return <g key={c.l}>{out}</g>;
    })}
    {filtres.map((f, k) => <g key={k}>
      <rect x="10" y={yS(k)} width="320" height={SH} rx="7" fill={`url(#${id}g${k})`} stroke={f.col} strokeWidth="1.6"/>
      <line x1="16" y1={yS(k) + 3} x2="324" y2={yS(k) + 3} stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round"/>
      {Tx(18, yS(k) + 17, f.nom, { size: 12, gras: true, anchor: 'start', fill: '#fff', halo: '#0f172a' })}
    </g>)}
    {filtres.length === 0 && Tx(170, 120, 'aucun filtre', { size: 13 })}
    {/* couleur de la lumière qui sort */}
    <rect x="30" y={yFin + 70} width="280" height="26" rx="8" fill={cssFiltre(Tpro)} stroke="#0f172a" strokeWidth="1.5"/>
    {Tx(170, yFin + 114, 'couleur de la lumière qui sort des filtres', { size: 11.5, fill: K.gris })}
  </svg>;
}
