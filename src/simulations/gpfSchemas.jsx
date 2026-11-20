// ====================================================
//  Schémas de la simulation 215 (gaz parfait : équation d'état et limites du modèle ; niveau TG).
//  Scènes : viewBox de 420 de large, textes ≥ 17. Graphes : viewBox 400 × 300, textes ≥ 16. Cartes : viewBox de 320, textes ≥ 15,5.
//  Toutes les coordonnées sont des NOMBRES. Public daltonien : jamais la couleur seule (valeurs écrites, traits pleins / tirets, étiquettes).
//  Molécules : modèle QUALITATIF (quelques dizaines de disques pour une quantité de matière donnée), pas à l'échelle, annoncé sur la scène.
// ====================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { rngGraine, REEL, pressionReelle, volumesSaturation, Tc } from './gazParfaitModele';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', gris: '#475569', txt: '#0f172a', clair: '#cbd5e1', paroi: '#334155' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 9 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};
// fraction dessinée (numérateur, barre, dénominateur) centrée en x ; y : ligne de base du numérateur
const FracSvg = ({ x, y, num, den, s = 17, c = COL.txt }) => {
  const w = Math.max(num.length, den.length) * s * 0.62 + 8;
  return (<g><Tx x={x} y={y} ancre="middle" s={s} c={c} halo={false}>{num}</Tx>
    <line x1={x - w / 2} y1={y + 5} x2={x + w / 2} y2={y + 5} stroke={c} strokeWidth={2}/>
    <Tx x={x} y={y + s + 6} ancre="middle" s={s} c={c} halo={false}>{den}</Tx></g>);
};
const mix = (a, b, f) => a.map((v, k) => Math.round(v + (b[k] - v) * f));
const teinteGaz = T => `rgb(${mix([219, 234, 254], [255, 237, 213], Math.max(0, Math.min(1, (T - 200) / 400))).join(',')})`;   // bleuté (froid) → orangé (chaud) ; la valeur de T est toujours écrite
const SVG_STYLE = { width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', height: 'auto' };

// ---------- molécules : agitation animée (disques sans interaction, rebonds élastiques) ----------
const RAYON = 5.5;
function initPts(N, W, H, graine = 7) {
  const r = rngGraine(graine);
  return Array.from({ length: N }, () => ({ x: RAYON + r() * (W - 2 * RAYON), y: RAYON + r() * (H - 2 * RAYON), a: r() * 2 * Math.PI, f: 0.75 + 0.5 * r() }));
}
/** N disques dans une boîte W × H (px du dessin), de vitesse moyenne vit (px·s⁻¹). Renvoie { pts, hits } ; hits = chocs récents sur la paroi de droite (le piston). */
function useMolecules({ N, vit, W, H, anime }) {
  const [snap, setSnap] = useState(() => ({ pts: initPts(N, W, H), hits: [] }));
  const param = useRef({ N, vit, W, H });
  useEffect(() => { param.current = { N, vit, W, H }; });
  useEffect(() => {
    if (!anime) return undefined;
    let raf, t0 = null, pts = snap.pts.slice(), hits = [];
    const r = rngGraine(1234 + N);
    const boucle = tt => {
      if (t0 !== null) {
        const dt = Math.min(0.05, (tt - t0) / 1000), p = param.current;
        while (pts.length < p.N) pts.push({ x: RAYON + r() * (p.W - 2 * RAYON), y: RAYON + r() * (p.H - 2 * RAYON), a: r() * 2 * Math.PI, f: 0.75 + 0.5 * r() });
        if (pts.length > p.N) pts = pts.slice(0, p.N);
        pts = pts.map(m => {
          let { x, y, a } = m; const v = p.vit * m.f;
          x += v * Math.cos(a) * dt; y += v * Math.sin(a) * dt;
          if (x < RAYON) { x = 2 * RAYON - x; a = Math.PI - a; }
          if (x > p.W - RAYON) { if (x - (p.W - RAYON) < 60) hits.push({ y, t: tt }); x = Math.min(2 * (p.W - RAYON) - x, p.W - RAYON); a = Math.PI - a; }
          if (y < RAYON) { y = 2 * RAYON - y; a = -a; }
          if (y > p.H - RAYON) { y = 2 * (p.H - RAYON) - y; a = -a; }
          return { x, y, a, f: m.f };
        });
        hits = hits.filter(h => tt - h.t < 260).slice(-12);
        setSnap({ pts, hits: hits.map(h => ({ y: h.y, age: (tt - h.t) / 260 })) });
      }
      t0 = tt; raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [anime, N]);   // eslint-disable-line react-hooks/exhaustive-deps
  const fixes = useMemo(() => ({ pts: initPts(N, W, H), hits: [] }), [N, W, H]);   // sans animation : positions fixes (avec flèches de vitesse)
  return anime ? snap : fixes;
}

// ====================================================
//  SCÈNE 1 : deux échelles (de loin / de près). Statique : les flèches courtes sont les vitesses des molécules à un instant.
// ====================================================
export function SceneEchelles({ aria }) {
  const pts = initPts(11, 150, 122, 21);
  return (
    <svg viewBox="0 0 420 300" role="img" aria-label={aria || 'À gauche, une enceinte fermée vue de loin, avec un manomètre et un thermomètre ; à droite, un agrandissement montre les molécules du gaz qui se déplacent dans tous les sens et rebondissent sur la paroi.'} style={SVG_STYLE}>
      <Tx x={80} y={26} ancre="middle">Vu de loin</Tx>
      <Tx x={318} y={26} ancre="middle">Vu de près</Tx>
      {/* enceinte vue de loin */}
      <rect x={22} y={78} width={118} height={136} rx={6} fill="#f1f5f9" stroke={COL.paroi} strokeWidth={5}/>
      <circle cx={52} cy={52} r={22} fill="#fff" stroke={COL.paroi} strokeWidth={3}/>
      <line x1={52} y1={52} x2={64} y2={40} stroke={COL.rouge} strokeWidth={3.5} strokeLinecap="round"/><circle cx={52} cy={52} r={3} fill={COL.paroi}/>
      <line x1={52} y1={74} x2={52} y2={78} stroke={COL.paroi} strokeWidth={4}/>
      <rect x={104} y={30} width={10} height={44} rx={5} fill="#fff" stroke={COL.paroi} strokeWidth={3}/><rect x={107} y={52} width={4} height={20} fill={COL.rouge}/>
      <Tx x={80} y={244} ancre="middle">enceinte</Tx>
      <Tx x={80} y={270} ancre="middle" s={18}>+ instruments</Tx>
      <Tx x={80} y={292} ancre="middle" s={18}>de mesure</Tx>
      {/* loupe */}
      <line x1={140} y1={100} x2={246} y2={62} stroke={COL.gris} strokeWidth={2} strokeDasharray="6 5"/>
      <line x1={140} y1={192} x2={246} y2={236} stroke={COL.gris} strokeWidth={2} strokeDasharray="6 5"/>
      <rect x={246} y={62} width={160} height={174} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={3}/>
      <rect x={394} y={62} width={12} height={174} fill={COL.paroi}/>
      <g transform="translate(250 90)">
        {pts.map((m, k) => (<g key={k}>
          <circle cx={m.x} cy={m.y} r={RAYON} fill="#7dd3fc" stroke={COL.bleu} strokeWidth={2}/>
          <Fleche x1={m.x} y1={m.y} x2={m.x + 17 * Math.cos(m.a)} y2={m.y + 17 * Math.sin(m.a)} c={COL.gris} w={2} tete={6}/>
        </g>))}
      </g>
      <Tx x={326} y={262} ancre="middle">molécules</Tx>
      <Tx x={326} y={288} ancre="middle">pas à l’échelle</Tx>
    </svg>);
}

// ====================================================
//  SCÈNE 2 : enceinte à piston avec molécules animées.
//  n (mol), T (K), V (L), Vmax (L, pour l'échelle du dessin), Mg (g/mol : agitation ∝ √(T/M)), P (bar, manomètre si montre.P), montre : { P, n, T, V }
// ====================================================
const W0 = 70, W1 = 230;          // largeur du gaz dessiné : de W0 (V = 0) à W0 + W1 (V = Vmax)
export function SceneEnceinte({ n = 0.5, T = 300, V = 10, Vmax = 40, Mg = 28, P = null, montre = {}, anime = true, aria, flecheVitesse = false }) {
  const W = W0 + W1 * Math.max(0, Math.min(1, V / Vmax)), H = 140, gx = 40, gy = 84, N = Math.max(8, Math.min(32, Math.round(8 + 12 * n)));
  const vit = 105 * Math.sqrt((T / Mg) / (300 / 28));
  const { pts, hits } = useMolecules({ N, vit, W, H, anime });
  const xP = gx + W, pMax = 10, ang = -120 + 240 * Math.max(0, Math.min(1, (P ?? 0) / pMax));
  const tags = [];
  if (montre.n) tags.push(`n = ${nbf(n, 2)} mol`);
  if (montre.T) tags.push(`T = ${nbf(T, 0)} K`);
  if (montre.V) tags.push(`V = ${nbf(V, V < 10 ? 1 : 0)} L`);
  return (
    <svg viewBox={montre.P && P != null ? '0 0 420 310' : '0 66 420 244'} role="img" aria-label={aria || `Une enceinte fermée par un piston mobile contient un gaz dont les molécules, représentées de façon qualitative, se déplacent dans tous les sens et rebondissent sur les parois. ${montre.T ? `Température ${nbf(T, 0)} kelvins. ` : ''}${montre.V ? `Volume ${nbf(V, 1)} litres.` : ''}`} style={SVG_STYLE}>
      {/* cylindre */}
      <rect x={gx} y={gy} width={W} height={H} fill={teinteGaz(T)}/>
      <line x1={gx - 3} y1={gy - 3} x2={352} y2={gy - 3} stroke={COL.paroi} strokeWidth={6}/>
      <line x1={gx - 3} y1={gy + H + 3} x2={352} y2={gy + H + 3} stroke={COL.paroi} strokeWidth={6}/>
      <line x1={gx - 3} y1={gy - 6} x2={gx - 3} y2={gy + H + 6} stroke={COL.paroi} strokeWidth={8}/>
      {/* molécules */}
      <g transform={`translate(${gx} ${gy})`}>
        {pts.map((m, k) => (<g key={k}>
          <circle cx={m.x} cy={m.y} r={RAYON} fill="#7dd3fc" stroke={COL.bleu} strokeWidth={2}/>
          {flecheVitesse && <Fleche x1={m.x} y1={m.y} x2={m.x + 0.17 * vit * m.f * Math.cos(m.a)} y2={m.y + 0.17 * vit * m.f * Math.sin(m.a)} c={COL.gris} w={2} tete={6}/>}
        </g>))}
      </g>
      {/* piston */}
      <rect x={xP} y={gy - 1} width={12} height={H + 2} fill="#94a3b8" stroke={COL.paroi} strokeWidth={3}/>
      <line x1={xP + 12} y1={gy + H / 2} x2={404} y2={gy + H / 2} stroke={COL.paroi} strokeWidth={6}/>
      <rect x={400} y={gy + H / 2 - 22} width={10} height={44} rx={4} fill={COL.paroi}/>
      {hits.map((h, k) => <g key={k} opacity={1 - h.age}><line x1={xP - 2} y1={gy + h.y - 9} x2={xP - 2} y2={gy + h.y + 9} stroke={COL.orange} strokeWidth={5} strokeLinecap="round"/></g>)}
      {/* manomètre (valeur écrite) */}
      {montre.P && P != null && (<g>
        <line x1={64} y1={gy - 14} x2={64} y2={gy - 3} stroke={COL.paroi} strokeWidth={4}/>
        <circle cx={64} cy={42} r={27} fill="#fff" stroke={COL.paroi} strokeWidth={3.5}/>
        <line x1={64} y1={42} x2={64 + 20 * Math.sin(ang * Math.PI / 180)} y2={42 - 20 * Math.cos(ang * Math.PI / 180)} stroke={COL.rouge} strokeWidth={4} strokeLinecap="round"/><circle cx={64} cy={42} r={3.5} fill={COL.paroi}/>
        <Tx x={102} y={48}>P = {nbf(P, P < 10 ? 2 : 1)} bar</Tx>
      </g>)}
      {tags.length > 0 && <Tx x={210} y={282} ancre="middle">{tags.join('  ·  ')}</Tx>}
      <Tx x={Math.min(xP + 6, 330)} y={gy + H + 32} ancre="middle" s={18}>piston</Tx>
      <Tx x={40} y={304} s={18} c={COL.gris} w={600}>molécules : pas à l’échelle</Tx>
    </svg>);
}

// ====================================================
//  SCÈNE 3 : deux états d'une même quantité de gaz (état 2 : une grandeur reste à trouver)
// ====================================================
const PTS_ETATS = [[0.12, 0.2], [0.55, 0.08], [0.88, 0.45], [0.3, 0.62], [0.7, 0.85], [0.08, 0.9], [0.5, 0.5]];   // positions relatives (pseudo-aléatoires, mêmes molécules dans les deux états)
export function SceneDeuxEtats({ V1, V2, Vmax, lignes1, lignes2, aria }) {
  const larg = V => 40 + 70 * Math.min(1, V / Vmax);
  const bloc = (x0, V, lignes, titre, anime) => (<g>
    <Tx x={x0 + 70} y={24} ancre="middle">{titre}</Tx>
    <rect x={x0} y={46} width={larg(V)} height={86} fill="#e2e8f0"/>
    {anime && PTS_ETATS.map(([a, b], k) => <circle key={k} cx={x0 + 10 + a * (larg(V) - 20)} cy={56 + b * 66} r={RAYON} fill="#7dd3fc" stroke={COL.bleu} strokeWidth={2}/>)}
    <line x1={x0 - 3} y1={43} x2={x0 + 128} y2={43} stroke={COL.paroi} strokeWidth={5}/><line x1={x0 - 3} y1={135} x2={x0 + 128} y2={135} stroke={COL.paroi} strokeWidth={5}/><line x1={x0 - 3} y1={40} x2={x0 - 3} y2={138} stroke={COL.paroi} strokeWidth={6}/>
    <rect x={x0 + larg(V)} y={45} width={10} height={88} fill="#94a3b8" stroke={COL.paroi} strokeWidth={2.5}/>
    <line x1={x0 + larg(V) + 10} y1={89} x2={x0 + 128} y2={89} stroke={COL.paroi} strokeWidth={5}/>
    {lignes.map((l, k) => <Tx key={k} x={x0 + 66} y={168 + 26 * k} ancre="middle" c={l.c || COL.txt}>{l.t}</Tx>)}
  </g>);
  return (
    <svg viewBox="0 0 420 280" role="img" aria-label={aria || 'Deux états successifs d’une même quantité de gaz enfermée sous un piston : volume, température et pression de chacun, la pression de l’état 2 restant à trouver.'} style={SVG_STYLE}>
      {bloc(14, V1, lignes1, 'État 1', true)}
      <Fleche x1={170} y1={89} x2={236} y2={89} c={COL.orange} w={4} tete={12}/>
      <Tx x={203} y={78} ancre="middle" s={18} c={COL.orange}>même n</Tx>
      {bloc(262, V2, lignes2, 'État 2', true)}
    </svg>);
}

// ====================================================
//  GRAPHES
// ====================================================
const pasJoli = (max, n = 5) => { const brut = max / n, e = Math.pow(10, Math.floor(Math.log10(brut))), m = brut / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };
const fmt = x => String(Math.round(x * 100) / 100).replace('.', ',');
const GX = { x0: 66, x1: 384, y0: 252, y1: 34 };   // cadre du tracé (x : gauche → droite ; y : bas → haut)
function Axes({ vmax, pmax, pasV, pasP, vlabel = 'V (L)', plabel = 'P (bar)' }) {
  const X = v => GX.x0 + (v / vmax) * (GX.x1 - GX.x0), Y = p => GX.y0 + (p / pmax) * (GX.y1 - GX.y0);
  const tv = [], tp = [];
  for (let v = 0; v <= vmax + 1e-9; v += pasV) tv.push(v);
  for (let p = 0; p <= pmax + 1e-9; p += pasP) tp.push(p);
  return (<g>
    {tp.map(p => <g key={`p${p}`}><line x1={GX.x0} y1={Y(p)} x2={GX.x1} y2={Y(p)} stroke="#e2e8f0" strokeWidth={1.5}/><text x={GX.x0 - 8} y={Y(p) + 6} fontSize={19} fill={COL.gris} textAnchor="end">{fmt(p)}</text></g>)}
    {tv.map(v => <g key={`v${v}`}><line x1={X(v)} y1={GX.y0} x2={X(v)} y2={GX.y0 + 6} stroke={COL.gris} strokeWidth={2}/><text x={X(v)} y={GX.y0 + 26} fontSize={19} fill={COL.gris} textAnchor="middle">{fmt(v)}</text></g>)}
    <line x1={GX.x0} y1={GX.y0} x2={GX.x1} y2={GX.y0} stroke={COL.paroi} strokeWidth={2.5}/><line x1={GX.x0} y1={GX.y0} x2={GX.x0} y2={GX.y1} stroke={COL.paroi} strokeWidth={2.5}/>
    <Tx x={GX.x1} y={GX.y0 + 48} ancre="end" s={19}>{vlabel}</Tx>
    <Tx x={GX.x0 + 8} y={22} s={19}>{plabel}</Tx>
  </g>);
}
// trace une courbe y = f(x) en coupant à pmax (interpolation à la sortie du cadre)
function chemin(pts, X, Y, pmax) {
  let d = '', pen = false, prev = null;
  for (const [v, p] of pts) {
    const dans = p <= pmax;
    if (dans) { d += `${pen ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(p).toFixed(1)}`; pen = true; }
    else { if (prev && prev[1] <= pmax) { const f = (pmax - prev[1]) / (p - prev[1]), vv = prev[0] + f * (v - prev[0]); d += `${pen ? 'L' : 'M'}${X(vv).toFixed(1)} ${Y(pmax).toFixed(1)}`; } pen = false; }
    prev = [v, p];
  }
  return d;
}
/** Isothermes du gaz parfait P(V) pour n mol : courbes [{ T, nom, trait }], point courant { V (L), P (bar) } ; V en L, P en bar. */
export function GrapheIsothermes({ n, courbes, point, vmax = 50, aria }) {
  const pmaxBrut = Math.max(...courbes.map(c => 8.314 * n * c.T / (vmax * 0.04 * 1e-3) / 1e5)), pas = pasJoli(Math.min(pmaxBrut, 60), 5), pmax = pas * 5;
  const X = v => GX.x0 + (v / vmax) * (GX.x1 - GX.x0), Y = p => GX.y0 + (p / pmax) * (GX.y1 - GX.y0);
  const vs = Array.from({ length: 200 }, (_, k) => vmax * 0.02 + (vmax * 0.98) * k / 199);
  return (
    <svg viewBox="0 0 400 308" role="img" aria-label={aria || 'Graphe de la pression P en fonction du volume V à température constante : la pression diminue quand le volume augmente.'} style={SVG_STYLE}>
      <Axes vmax={vmax} pmax={pmax} pasV={vmax / 5} pasP={pas}/>
      {courbes.map((c, k) => <path key={k} d={chemin(vs.map(v => [v, 8.314 * n * c.T / (v * 1e-3) / 1e5]), X, Y, pmax)} fill="none" stroke={k === 0 ? COL.bleu : COL.orange} strokeWidth={3.5} strokeDasharray={c.trait === 'tirets' ? '9 6' : undefined}/>)}
      {courbes.length > 1 && courbes.map((c, k) => <Tx key={k} x={GX.x1 - 4} y={GX.y1 + 26 + 24 * k} ancre="end" c={k === 0 ? COL.bleu : COL.orange}>{c.nom}</Tx>)}
      {point && point.P <= pmax && <g><circle cx={X(point.V)} cy={Y(point.P)} r={7} fill="#fff" stroke={COL.rouge} strokeWidth={3.5}/><circle cx={X(point.V)} cy={Y(point.P)} r={2.5} fill={COL.rouge}/></g>}
    </svg>);
}
/** Gaz parfait et « gaz réel » (CO₂, données fournies) pour n mol à T (K) : P (bar) en fonction de V (L). Curseur facultatif (V en L). */
export function GrapheReel({ n = 1, T = 293.15, vmax = 1.0, pmax = 120, curseur = null, aria, legende = true }) {
  const X = v => GX.x0 + (v / vmax) * (GX.x1 - GX.x0), Y = p => GX.y0 + (p / pmax) * (GX.y1 - GX.y0);
  const vs = Array.from({ length: 260 }, (_, k) => 0.04 * Math.pow(vmax / 0.04, k / 259));
  const ideal = vs.map(v => [v, 8.314 * n * T / (v * 1e-3) / 1e5]), reel = vs.map(v => [v, pressionReelle(n, T, v * 1e-3) / 1e5]);
  const sat = volumesSaturation(T), liq = T < Tc && sat;
  const pPal = liq ? pressionReelle(n, T, n * (sat.liquide + sat.gaz) / 2) / 1e5 : 0;
  const vPal = liq ? n * (sat.liquide + sat.gaz) / 2 * 1000 : 0;
  return (
    <svg viewBox="0 0 400 308" role="img" aria-label={aria || `Graphe de la pression en fonction du volume pour ${nbf(n, 2)} mol de dioxyde de carbone à ${nbf(T, 0)} kelvins : le gaz parfait suit une hyperbole ; les valeurs fournies pour le gaz réel s’en écartent aux petits volumes${liq ? ' et présentent un palier horizontal où le gaz se liquéfie' : ''}.`} style={SVG_STYLE}>
      <Axes vmax={vmax} pmax={pmax} pasV={vmax / 5} pasP={pmax / 6}/>
      <path d={chemin(ideal, X, Y, pmax)} fill="none" stroke={COL.bleu} strokeWidth={3.5}/>
      <path d={chemin(reel, X, Y, pmax)} fill="none" stroke={COL.orange} strokeWidth={3.5} strokeDasharray="9 5"/>
      {legende && (<g>
        <line x1={218} y1={46} x2={250} y2={46} stroke={COL.bleu} strokeWidth={3.5}/><Tx x={256} y={52} s={19}>gaz parfait</Tx>
        <line x1={218} y1={76} x2={250} y2={76} stroke={COL.orange} strokeWidth={3.5} strokeDasharray="9 5"/><Tx x={256} y={82} s={19}>gaz réel</Tx>
      </g>)}
      {liq && pPal < pmax && (<g>
        <Fleche x1={X(vPal)} y1={Y(pPal) + 24} x2={X(vPal)} y2={Y(pPal) + 6} c={COL.rouge} w={2.5} tete={9}/>
        <Tx x={X(vPal)} y={Y(pPal) + 46} ancre="middle" c={COL.rouge} s={19}>palier</Tx>
      </g>)}
      {curseur && (<g>
        <circle cx={X(curseur.V)} cy={Y(Math.min(curseur.Pid, pmax))} r={7} fill="#fff" stroke={COL.bleu} strokeWidth={3.5}/>
        <circle cx={X(curseur.V)} cy={Y(Math.min(curseur.Pre, pmax))} r={7} fill={COL.orange} stroke="#fff" strokeWidth={2.5}/>
      </g>)}
    </svg>);
}
export { REEL };

// ====================================================
//  CARTES « À retenir » (viewBox 320, textes ≥ 15,5)
// ====================================================
const SvgCarte = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>{children}</svg>;
const Mol = ({ x, y, r = 6 }) => <circle cx={x} cy={y} r={r} fill="#7dd3fc" stroke={COL.bleu} strokeWidth={2}/>;

export function SvgCarteMicro() {
  return (
    <SvgCarte h={262} aria="Deux enceintes côte à côte : à température basse, des molécules lentes frappent peu la paroi ; à température plus haute, des molécules rapides la frappent plus souvent et plus fort. La pression est due aux chocs des molécules sur la paroi.">
      <Tx x={80} y={22} ancre="middle" s={16}>T basse</Tx>
      <Tx x={240} y={22} ancre="middle" s={16}>T plus haute</Tx>
      <rect x={14} y={34} width={132} height={150} fill="#f1f5f9" stroke={COL.paroi} strokeWidth={3}/><rect x={146} y={34} width={8} height={150} fill={COL.paroi}/>
      <rect x={174} y={34} width={132} height={150} fill="#ffedd5" stroke={COL.paroi} strokeWidth={3}/><rect x={306} y={34} width={8} height={150} fill={COL.paroi}/>
      {[[36, 66, 0.6], [100, 80, 2.4], [58, 118, 4.1], [112, 150, 5.3]].map(([x, y, an], k) => <g key={`b${k}`}><Mol x={x} y={y}/><Fleche x1={x} y1={y} x2={x + 14 * Math.cos(an)} y2={y + 14 * Math.sin(an)} c={COL.gris} w={2.5} tete={7}/></g>)}
      {[[196, 64, 0.6], [266, 86, 2.4], [222, 124, 4.1], [284, 152, 5.3]].map(([x, y, an], k) => <g key={`h${k}`}><Mol x={x} y={y}/><Fleche x1={x} y1={y} x2={x + 34 * Math.cos(an)} y2={y + 34 * Math.sin(an)} c={COL.gris} w={3} tete={8}/></g>)}
      <Tx x={80} y={206} ancre="middle" s={16}>peu de chocs,</Tx><Tx x={80} y={226} ancre="middle" s={16}>chocs faibles</Tx>
      <Tx x={240} y={206} ancre="middle" s={16}>plus de chocs,</Tx><Tx x={240} y={226} ancre="middle" s={16}>chocs plus forts</Tx>
      <Tx x={160} y={254} ancre="middle" s={16} c={COL.bleu}>pression = chocs sur la paroi</Tx>
    </SvgCarte>);
}
export function SvgCarteModele() {
  const ligne = (y, titre, sous, dessin) => (<g>{dessin}<Tx x={96} y={y} s={16}>{titre}</Tx><Tx x={96} y={y + 20} s={16} c={COL.gris} w={600}>{sous}</Tx></g>);
  return (
    <SvgCarte h={262} aria="Les trois hypothèses du modèle du gaz parfait : des molécules ponctuelles, sans interaction entre elles, qui rebondissent élastiquement sur les parois.">
      <Tx x={160} y={22} ancre="middle" s={16.5}>Gaz parfait = un modèle</Tx>
      {ligne(70, 'points matériels', 'volume propre négligé', <g><circle cx={48} cy={64} r={3.5} fill={COL.txt}/></g>)}
      {ligne(140, 'sans interaction', 'pas de force à distance', <g><Mol x={28} y={134}/><Mol x={68} y={134}/><line x1={36} y1={134} x2={60} y2={134} stroke={COL.rouge} strokeWidth={3} strokeDasharray="4 4"/><line x1={42} y1={124} x2={54} y2={144} stroke={COL.rouge} strokeWidth={3}/><line x1={54} y1={124} x2={42} y2={144} stroke={COL.rouge} strokeWidth={3}/></g>)}
      {ligne(210, 'chocs élastiques', 'sur les parois, sans perte', <g><rect x={74} y={190} width={8} height={40} fill={COL.paroi}/><polyline points="20,196 56,214 24,232" fill="none" stroke={COL.bleu} strokeWidth={3}/><Mol x={56} y={214}/></g>)}
      <Tx x={160} y={256} ancre="middle" s={15.5} c={COL.bleu}>une description simplifiée</Tx>
    </SvgCarte>);
}
export function SvgCarteEquation() {
  return (
    <SvgCarte h={290} aria="L’équation d’état du gaz parfait P V égale n R T, avec les unités du système international : pression en pascal, volume en mètre cube, quantité de matière en mole, température en kelvin, et les conversions usuelles.">
      <rect x={10} y={10} width={300} height={56} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={160} y={48} ancre="middle" s={28} c={COL.bleu} halo={false}>P V = n R T</Tx>
      {[['P', 'pression', 'Pa'], ['V', 'volume', 'm³'], ['n', 'quantité de matière', 'mol'], ['T', 'température', 'K']].map(([g, nom, u], k) => (<g key={g}>
        <Tx x={22} y={96 + 26 * k} s={16.5}>{g}</Tx><Tx x={46} y={96 + 26 * k} s={16} w={600} c={COL.gris}>{nom}</Tx><Tx x={298} y={96 + 26 * k} ancre="end" s={16.5} c={COL.bleu}>{u}</Tx></g>))}
      <line x1={12} y1={208} x2={308} y2={208} stroke={COL.clair} strokeWidth={2}/>
      <Tx x={22} y={232} s={16} w={600}>R = 8,314 J·K⁻¹·mol⁻¹ (fournie)</Tx>
      <Tx x={22} y={256} s={16} w={600}>1 bar = 10⁵ Pa · 1 L = 10⁻³ m³</Tx>
      <Tx x={22} y={280} s={16} w={600}>T (K) = θ (°C) + 273,15</Tx>
    </SvgCarte>);
}
export function SvgCarteEtats() {
  const cyl = (x0, w, mol, titre) => (<g>
    <Tx x={x0 + 40} y={20} ancre="middle" s={16}>{titre}</Tx>
    <rect x={x0} y={30} width={w} height={70} fill="#e2e8f0"/><line x1={x0 - 2} y1={29} x2={x0 + 82} y2={29} stroke={COL.paroi} strokeWidth={4}/><line x1={x0 - 2} y1={101} x2={x0 + 82} y2={101} stroke={COL.paroi} strokeWidth={4}/><line x1={x0 - 2} y1={27} x2={x0 - 2} y2={103} stroke={COL.paroi} strokeWidth={5}/>
    <rect x={x0 + w} y={30} width={8} height={70} fill="#94a3b8" stroke={COL.paroi} strokeWidth={2}/>
    {mol.map(([a, b], k) => <Mol key={k} x={x0 + a} y={30 + b} r={5}/>)}
  </g>);
  return (
    <SvgCarte h={298} aria="Deux états d’une même quantité de gaz, relation P1 V1 sur T1 égale P2 V2 sur T2, avec deux exemples de prévision : à volume constant la pression varie comme la température ; à température constante elle varie en sens inverse du volume.">
      {cyl(18, 60, [[14, 16], [34, 46], [48, 22]], 'État 1')}
      <Fleche x1={118} y1={66} x2={198} y2={66} c={COL.orange} w={4} tete={11}/><Tx x={158} y={56} ancre="middle" s={15.5} c={COL.orange}>même n</Tx>
      {cyl(222, 40, [[12, 18], [26, 50], [14, 56]], 'État 2')}
      <g>
        <FracSvg x={100} y={140} num="P₁V₁" den="T₁" s={18} c={COL.bleu}/>
        <Tx x={160} y={156} ancre="middle" s={20} c={COL.bleu} halo={false}>=</Tx>
        <FracSvg x={220} y={140} num="P₂V₂" den="T₂" s={18} c={COL.bleu}/>
        <Tx x={160} y={190} ancre="middle" s={15.5} w={600} c={COL.gris}>(T en kelvin)</Tx>
      </g>
      <line x1={12} y1={202} x2={308} y2={202} stroke={COL.clair} strokeWidth={2}/>
      <Tx x={20} y={224} s={16} w={600}>V constant : P et T varient</Tx><Tx x={20} y={244} s={16} w={600}>dans le même sens</Tx>
      <Tx x={20} y={268} s={16} w={600}>T constante : P et V varient</Tx><Tx x={20} y={288} s={16} w={600}>en sens contraires</Tx>
    </SvgCarte>);
}
export function SvgCarteRho() {
  const boite = (x0, mol, titre, sous) => (<g>
    <Tx x={x0 + 66} y={20} ancre="middle" s={16}>{titre}</Tx>
    <rect x={x0} y={30} width={132} height={104} fill="#f1f5f9" stroke={COL.paroi} strokeWidth={3}/>
    {mol.map(([a, b], k) => <Mol key={k} x={x0 + a} y={30 + b} r={5.5}/>)}
    <Tx x={x0 + 66} y={158} ancre="middle" s={16} w={600}>{sous}</Tx>
  </g>);
  return (
    <SvgCarte h={296} aria="Masse volumique d’un gaz à pression constante : le gaz froid est plus dense, le gaz chaud plus dilué ; formule ρ égale P M sur R T ; l’air à 20 degrés Celsius sous 1,013 bar a une masse volumique voisine de 1,2 kilogramme par mètre cube.">
      {boite(14, [[20, 18], [60, 14], [100, 22], [34, 46], [78, 50], [112, 58], [24, 82], [66, 86], [104, 90], [46, 66]], 'gaz froid', 'ρ plus grande')}
      {boite(174, [[30, 24], [96, 18], [64, 62], [110, 84], [36, 88]], 'gaz chaud', 'ρ plus petite')}
      <Tx x={160} y={196} ancre="middle" s={16} c={COL.gris} w={600}>(même pression, même gaz)</Tx>
      <rect x={10} y={204} width={300} height={56} rx={8} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2}/>
      <Tx x={108} y={238} ancre="middle" s={20} c={COL.bleu} halo={false}>ρ =</Tx>
      <FracSvg x={190} y={229} num="P × M" den="R × T" s={18} c={COL.bleu}/>
      <Tx x={160} y={280} ancre="middle" s={15.5} w={600}>air, 20 °C, 1,013 bar : ρ ≈ 1,2 kg·m⁻³</Tx>
    </SvgCarte>);
}
export function SvgCarteLimites() {
  const X = v => 40 + v * 250, Y = p => 190 - p * 150;
  const id = Array.from({ length: 60 }, (_, k) => { const v = 0.12 + k * 0.0145; return [v, 0.13 / v]; }).filter(([, p]) => p <= 1.05);
  const dId = id.map(([v, p], k) => `${k ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(p).toFixed(1)}`).join('');
  // gaz réel schématique : suit l'hyperbole à grand V, s'en écarte, palier, puis remontée verticale
  const dRe = `M${X(0.95)} ${Y(0.1366)}L${X(0.6)} ${Y(0.215)}L${X(0.45)} ${Y(0.285)}Q${X(0.36)} ${Y(0.36)} ${X(0.33)} ${Y(0.375)}L${X(0.2)} ${Y(0.375)}L${X(0.18)} ${Y(1.05)}`;
  return (
    <SvgCarte h={292} aria="Schéma de la pression en fonction du volume : le gaz parfait suit une hyperbole ; un gaz réel s’en écarte aux petits volumes, donc à haute pression, et présente un palier horizontal quand il se liquéfie à basse température.">
      <line x1={40} y1={190} x2={300} y2={190} stroke={COL.paroi} strokeWidth={2.5}/><line x1={40} y1={190} x2={40} y2={26} stroke={COL.paroi} strokeWidth={2.5}/>
      <Tx x={300} y={214} ancre="end" s={16}>V</Tx><Tx x={48} y={22} s={16}>P</Tx>
      <path d={dId} fill="none" stroke={COL.bleu} strokeWidth={3.5}/>
      <path d={dRe} fill="none" stroke={COL.orange} strokeWidth={3.5} strokeDasharray="9 5"/>
      <line x1={174} y1={36} x2={204} y2={36} stroke={COL.bleu} strokeWidth={3.5}/><Tx x={210} y={42} s={16}>parfait</Tx>
      <line x1={174} y1={62} x2={204} y2={62} stroke={COL.orange} strokeWidth={3.5} strokeDasharray="9 5"/><Tx x={210} y={68} s={16}>réel</Tx>
      <line x1={106} y1={Y(0.375) + 6} x2={106} y2={Y(0.375) + 28} stroke={COL.rouge} strokeWidth={2.5}/><Tx x={48} y={Y(0.375) + 46} s={15.5} c={COL.rouge}>liquéfaction</Tx>
      <Tx x={160} y={242} ancre="middle" s={15.5} w={600}>écarts : haute pression,</Tx>
      <Tx x={160} y={262} ancre="middle" s={15.5} w={600}>basse température</Tx>
      <Tx x={160} y={280} ancre="middle" s={15.5} w={600} c={COL.gris}>(allure qualitative)</Tx>
    </SvgCarte>);
}
