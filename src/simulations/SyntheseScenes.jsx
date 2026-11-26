// Scènes illustrées de la simulation « Synthèse additive et synthèse soustractive » : trois lampes sur un écran,
// vue en coupe d'une peinture, filtres traversés par la lumière. SVG, textes de 11 à 14, largeur 100 % plafonnée.
import { useId } from "react";
import { LAMBDAS, spectreRVB, cssLumiere } from "./synthCouleurModele";

const K = { txt: '#0f172a', gris: '#64748b', clair: '#cbd5e1' };
const NB = ' ';
const pc = v => `${Math.round(Math.max(0, Math.min(1, v)) * 100)}${NB}%`;
const Tx = (x, y, s, o = {}) => <text x={x} y={y} fontSize={o.size ?? 12} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? K.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit" stroke={o.halo ?? 'none'} strokeWidth={o.halo ? 2.4 : 0} paintOrder="stroke" strokeLinejoin="round">{s}</text>;
const aLambda = (arr, l) => arr[LAMBDAS.indexOf(l)] ?? 0;

/** Trois canaux représentatifs de la lumière blanche (le spectre entier est dans le graphique en dessous). */
const CANAUX = [{ l: 450, nom: 'bleu', col: '#2563eb' }, { l: 540, nom: 'vert', col: '#16a34a' }, { l: 620, nom: 'rouge', col: '#dc2626' }];
const COLX = [100, 195, 290];

function Fleche({ x, y1, y2, w, col, op = 1, tirets }) {
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

// ---------- coupe d'une couche de peinture ----------
const PIG = { jaune: '#facc15', magenta: '#d946ef', cyan: '#22d3ee', blanc: '#ffffff', noir: '#111827' };
const graine = n => { let s = n * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

/** R : réflectance (tableau sur LAMBDAS) de la couche ; pig : fractions de pigments ; css : couleur de la couche. */
export function SceneCoupe({ R, pig = {}, css = '#999', label = 'Coupe d’une couche de peinture : lumière incidente, renvoyée et absorbée' }) {
  const rnd = graine(7), parts = [];
  for (const [nom, fr] of Object.entries(pig)) { const n = fr > 0.001 ? Math.max(2, Math.round(fr * 12)) : 0; for (let i = 0; i < n; i++) parts.push({ nom, x: 12 + rnd() * 316, y: 128 + rnd() * 60, r: 3.4 + rnd() * 2.2 }); }
  parts.sort((a, b) => a.y - b.y);
  const Y0 = 118, Y1 = 196;
  return <svg role="img" aria-label={label} viewBox="0 0 340 300" width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    <rect x="0" y="0" width="340" height={Y0} fill="#f8fafc"/>
    {Tx(170, 14, 'lumière blanche incidente (trois de ses couleurs)', { size: 11, fill: K.gris })}
    <rect x="0" y={Y0} width="340" height={Y1 - Y0} fill={css}/>
    {parts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={PIG[p.nom]} stroke="#0f172a" strokeOpacity="0.5" strokeWidth="0.8"/>)}
    <rect x="0" y={Y1} width="340" height="30" fill="#e5e7eb"/>
    <line x1="0" y1={Y0} x2="340" y2={Y0} stroke="#334155" strokeWidth="1.5"/><line x1="0" y1={Y1} x2="340" y2={Y1} stroke="#64748b" strokeWidth="1"/>
    {Tx(8, 110, 'air', { size: 11, anchor: 'start', fill: K.gris })}{Tx(8, 176, 'peinture', { size: 11.5, anchor: 'start', gras: true, fill: '#fff', halo: '#0f172a' })}{Tx(8, 216, 'support blanc', { size: 11, anchor: 'start', fill: K.gris })}
    {CANAUX.map((c, i) => {
      const x = COLX[i], Rc = aLambda(R, c.l), A = 1 - Rc;
      return <g key={c.l}>
        {Tx(x, 32, `${c.nom} ${c.l}${NB}nm`, { size: 11.5, gras: true, fill: c.col })}
        <Fleche x={x - 13} y1={40} y2={Y0 - 2} w={7} col={c.col}/>
        <Fleche x={x + 13} y1={Y0 - 2} y2={40} w={7 * Rc} col={c.col} op={0.9}/>
        {/* trajet dans la couche : diffusé vers le haut, le reste absorbé */}
        <polyline points={`${x - 13},${Y0} ${x - 5},${Y0 + 22} ${x + 5},${Y0 + 10} ${x + 13},${Y0}`} fill="none" stroke={c.col} strokeWidth="1.8" strokeOpacity="0.9" strokeDasharray="2 2"/>
        <line x1={x - 5} y1={Y0 + 22} x2={x - 9} y2={Y0 + 22 + 40 * A} stroke="#fff" strokeWidth="2" strokeDasharray="3 3"/>
        <circle cx={x - 9} cy={Y0 + 22 + 40 * A} r="3" fill="#fff" stroke="#0f172a" strokeWidth="1"/>
        {Tx(x, 238, `renvoyé ${pc(Rc)}`, { size: 11.5, gras: true })}
        {Tx(x, 256, `absorbé ${pc(A)}`, { size: 11.5, gras: true, fill: '#b45309' })}
      </g>;
    })}
    {Tx(170, 282, 'épaisseur de la flèche renvoyée = part de lumière renvoyée', { size: 11, fill: K.gris })}
  </svg>;
}

// ---------- filtres traversés par la lumière ----------
/** filtres : [{ nom, T (tableau sur LAMBDAS), col }] placés l'un derrière l'autre. */
export function SceneFiltres({ filtres = [], label = 'Lumière blanche traversant un ou plusieurs filtres colorés' }) {
  const H0 = 44, SH = 42, GAP = 40, n = filtres.length;
  const yS = k => H0 + 40 + k * (SH + GAP), yFin = yS(n) - GAP + 40 + 4;
  const H = yFin + 52;
  return <svg role="img" aria-label={label} viewBox={`0 0 340 ${H}`} width="100%" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
    <rect x="0" y="0" width="340" height={H} fill="#f8fafc"/>
    {Tx(170, 14, 'lumière blanche incidente (trois de ses couleurs)', { size: 11, fill: K.gris })}
    {CANAUX.map((c, i) => {
      const x = COLX[i]; let cum = 1; const out = [];
      out.push(<g key="t">{Tx(x, 32, `${c.nom} ${c.l}${NB}nm`, { size: 11.5, gras: true, fill: c.col })}<Fleche x={x} y1={H0 - 2} y2={yS(0) - 1} w={9} col={c.col}/>{Tx(x - 14, H0 + 22, pc(1), { size: 11, fill: K.gris, anchor: 'end' })}</g>);
      filtres.forEach((f, k) => {
        const t = aLambda(f.T, c.l), apres = cum * t, y = yS(k);
        const yBas = k === n - 1 ? yFin : yS(k + 1) - 1;
        out.push(<g key={k}>
          {Tx(x, y + SH - 9, `−${pc(cum - apres)}`, { size: 12, gras: true, fill: '#fff', halo: '#0f172a' })}
          <Fleche x={x} y1={y + SH + 1} y2={yBas} w={9 * apres} col={c.col}/>
          {k < n - 1 && Tx(x - 14, y + SH + 22, pc(apres), { size: 11, fill: K.gris, anchor: 'end' })}
        </g>);
        cum = apres;
      });
      out.push(Tx(x, yFin + 18, `transmis ${pc(cum)}`, { size: 11.5, gras: true }), Tx(x, yFin + 35, `absorbé ${pc(1 - cum)}`, { size: 11.5, gras: true, fill: '#b45309' }));
      return <g key={c.l}>{out}</g>;
    })}
    {filtres.map((f, k) => <g key={k}>
      <rect x="10" y={yS(k)} width="320" height={SH} rx="5" fill={f.col} fillOpacity="0.55" stroke={f.col} strokeWidth="1.5"/>
      {Tx(16, yS(k) + 14, f.nom, { size: 11.5, gras: true, anchor: 'start', fill: '#fff', halo: '#0f172a' })}
    </g>)}
    {filtres.length === 0 && Tx(170, 120, 'aucun filtre', { size: 13 })}
  </svg>;
}
