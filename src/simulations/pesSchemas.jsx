// ====================================================
//  Schémas de la simulation 175 (mouvement dans un champ de pesanteur uniforme ; niveau TG).
//  Règles de dessin : flèches fines (trait 2,2, bouts arrondis) à pointe de taille FIXE ; vecteurs toujours avec une flèche au-dessus de la lettre (TVi / Ligne) ;
//  proportions physiques : repère orthonormé (même échelle en x et en y), trajectoire calculée par le modèle, vecteurs à l'échelle annoncée dans la clé ;
//  légendes séparées du dessin (clé en bas) ; textes de 15 à 17 dans un viewBox de 400 (cartes : 13,5 à 15 dans un viewBox de 320) ; jamais la couleur seule
//  (v : trait plein ; a : tirets ; P : trait plein + nom ; courbes distinguées par leur style et leur nom).
// ====================================================
import { TVi } from './frenetSchemas';
import { avecIndices } from '../commun';
import * as M from './pesModele';
import { COLP, trajetAvecFrottement, geomScene, GX0, GG, GTOP, RB, YSOL } from './pesOutils';

const NB = ' ';
const virg = (x, d = 1) => Number(x).toFixed(d).replace('.', ',').replace('-', '−');

const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ---------- flèche fine à pointe fixe ----------
export const Fl = ({ x1, y1, x2, y2, c = COLP.txt, w = 2.2, dash, tete = 8.5, demi = 3.4 }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 1.5) return null;
  const ux = dx / L, uy = dy / L, h = Math.min(tete, L * 0.7), d = demi * (h / tete);
  const bx = x2 - ux * h, by = y2 - uy * h;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx + ux * 1} y2={by + uy * 1} stroke={c} strokeWidth={w} strokeLinecap={dash ? 'butt' : 'round'} strokeDasharray={dash}/>
      <polygon points={`${x2},${y2} ${bx - uy * d},${by + ux * d} ${bx + uy * d},${by - ux * d}`} fill={c} stroke={c} strokeWidth="1" strokeLinejoin="round"/>
    </g>);
};
// étiquette de vecteur au bout d'une flèche (direction ux, uy unitaire)
const EtiqV = ({ bx, by, ux, uy, l, i, c, s = 17, decal = 9 }) => {
  const larg = s * 0.62 + (i ? s * 0.5 : 0), cx = bx + ux * (decal + larg / 2 + 2), cy = by + uy * (decal + s * 0.55);
  return <TVi x={cx} y={cy + s * 0.33} l={l} i={i} c={c} s={s} ancre="middle"/>;
};
const Tx = ({ x, y, children, c = COLP.txt, s = 17, w = 700, a = 'start', halo = false }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a} {...(halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {})}>{children}</text>);
// grandeur scalaire avec indice (jamais de flèche) : v_x, a_y …
const Sc = ({ x, y, l, i, c = COLP.txt, s = 17, a = 'start', halo = true }) => {
  const ha = halo ? { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' } : {};
  const W = s * 0.6 + (i ? s * 0.5 : 0), x0 = a === 'middle' ? x - W / 2 : a === 'end' ? x - W : x;
  return <g><text x={x0} y={y} fontSize={s} fontWeight="700" fill={c} {...ha}>{l}</text>{i && <text x={x0 + s * 0.6} y={y + 4} fontSize={s * 0.82} fontWeight="700" fill={c} {...ha}>{i}</text>}</g>;
};

// ---------- ligne de texte mêlant texte, lettres-vecteurs { v, i } et indices { i } (indices de 15 minimum : lisibles sur téléphone dans les cartes) ----------
let _ctx = null;
const famille = () => { try { return getComputedStyle(document.body).fontFamily || 'sans-serif'; } catch { return 'sans-serif'; } };
const mesure = (t, taille, graisse = 700) => {
  const u = t.replace(/ /g, ' ');
  try {
    if (!_ctx && typeof document !== 'undefined') _ctx = document.createElement('canvas').getContext('2d');
    if (_ctx) { _ctx.font = `${graisse} ${taille}px ${famille()}`; const w = _ctx.measureText(u).width; if (w > 0) return w; }
  } catch { /* repli */ }
  return [...t].length * taille * 0.56;
};
const CI = s => Math.max(15, s * 0.92);
const largSeg = (g, s, w) => { const ci = CI(s); return typeof g === 'string' ? mesure(g, s, w) : g.v ? s * 0.62 * [...g.v].length + (g.i ? mesure(g.i, ci, w) + 1 : 0) : mesure(g.i, ci, w) + 1; };
export const Lg = ({ x, y, s = 15, w = 700, c = COLP.txt, segs, anchor = 'start' }) => {
  const ci = CI(s), largs = segs.map(g => largSeg(g, s, w)), total = largs.reduce((t, v) => t + v, 0), debut = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;
  // sans lettre-vecteur : un seul texte, indices en tspan décalés (aucune mesure de largeur, donc aucun écart)
  if (!segs.some(g => typeof g !== 'string' && g.v)) {
    const morceaux = segs.map((g, k) => (typeof g === 'string'
      ? <tspan key={k} dy={k > 0 && typeof segs[k - 1] !== 'string' ? -4 : undefined}>{g}</tspan>
      : <tspan key={k} fontSize={ci} dy={4}>{g.i}</tspan>));
    return <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={anchor === 'middle' ? 'middle' : anchor === 'end' ? 'end' : 'start'} xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>{morceaux}</text>;
  }
  const starts = largs.map((_, k) => debut + largs.slice(0, k).reduce((u, v) => u + v, 0));
  return <g>{segs.map((g, k) => { const px = starts[k];
    if (typeof g === 'string') return <text key={k} x={px} y={y} fontSize={s} fontWeight={w} fill={c} xmlSpace="preserve" style={{ whiteSpace: 'pre' }}>{g}</text>;
    return <g key={k}>{g.v && <TVi x={px} y={y} l={g.v} i={g.i} c={c} s={s} w={w} halo={false}/>}{!g.v && <text x={px} y={y + 4} fontSize={ci} fontWeight={w} fill={c}>{g.i}</text>}</g>; })}</g>;
};
const nice = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
const pas = (s, mini) => nice.find(n => n * s >= mini) || 500;

// ====================================================
//  SCÈNE DU PROJECTILE
//  p = { v0, alpha, h, g } ; t : date de la balle (null = au départ) ; trajet : 'aucune' | 'complete' | 'jusqu' (plein jusqu'à t, pointillé ensuite)
//  vecs : sous-ensemble de ['v0', 'v', 'a', 'P'] ; comp : décomposer vec(v) ; grad : graduer les axes ; cible : { x, y, r }
//  La balle est dessinée à y = h (centre de masse) ; le sol est r pixels plus bas, comme pour une vraie balle.
// ====================================================
export function SceneProjectile({ p, t = null, trajet = 'complete', vecs = [], comp = false, grad = true, cible = null, m = 0.5, aria, fen = null }) {
  const { X, Y, s, px, py, T, tt, bx, by, v, kv, ka, kP, V, items, v0v } = geomScene(p, t, vecs, m, fen);
  const pts = M.trace(p, 160);
  const chemin = a => a.map((q, k) => `${k ? 'L' : 'M'}${px(q.x).toFixed(1)} ${py(q.y).toFixed(1)}`).join(' ');
  const avant = pts.filter(q => q.t <= tt), apres = pts.filter(q => q.t >= tt);
  const sh = new Set(vecs);
  const unV = pas(kv, 22), unA = pas(ka, 22), unP = pas(kP, 22);
  const pasX = pas(s, 46), pasY = pas(s, 30);
  const tx = [], ty = [];
  for (let k = 0; k * pasX <= X; k++) if (px(k * pasX) <= 362) tx.push(k * pasX);
  for (let k = 1; k * pasY <= Y; k++) ty.push(k * pasY);
  const cles = [];
  if (sh.has('v0') || sh.has('v')) cles.push(['v', unV * kv, `= ${virg(unV, unV < 1 ? 1 : 0)}${NB}m/s`, COLP.v, undefined]);
  if (sh.has('a')) cles.push(['a', unA * ka, `= ${virg(unA, unA < 1 ? 1 : 0)}${NB}m/s²`, COLP.a, '6 4']);
  if (sh.has('P')) cles.push(['P', unP * kP, `= ${virg(unP, unP < 1 ? 1 : 0)}${NB}N`, COLP.P, undefined]);
  const largK = cles.map(([, L, txt]) => L + 8 + 12 + mesure(' ' + txt, 17) + 24), debK = largK.map((_, j) => 14 + largK.slice(0, j).reduce((a, b) => a + b, 0));
  const finK = largK.reduce((a, b) => a + b, 14);
  return (
    <svg viewBox="0 0 400 300" style={stl} role="img" aria-label={aria || 'Scène : une balle est lancée depuis un point situé à l’altitude h au-dessus du sol ; sa trajectoire est tracée dans un repère orthonormé.'}>
      {/* sol, support de lancement (la balle est posée dessus : sa base touche le dessus du bloc) */}
      <line x1="40" y1={YSOL} x2="396" y2={YSOL} stroke={COLP.gris} strokeWidth="2.2" strokeLinecap="round"/>
      {p.h > 0 && <rect x="44" y={py(p.h) + RB} width={GX0 + RB - 44} height={Math.max(0, YSOL - py(p.h) - RB)} fill="#e2e8f0" stroke={COLP.gris} strokeWidth="1.6"/>}
      {/* axes */}
      <Fl x1={36} y1={GG + 18} x2={36} y2={GTOP - 6} c={COLP.gris} w={1.6} tete={7} demi={3}/>
      <Fl x1={36} y1={GG + 18} x2={372} y2={GG + 18} c={COLP.gris} w={1.6} tete={7} demi={3}/>
      <Tx x={380} y={GG + 24} c={COLP.gris} s={17} w={700}>x</Tx><Tx x={42} y={GTOP - 8} c={COLP.gris} s={17} w={700}>y</Tx>
      {grad && tx.map(g => <g key={'x' + g}><line x1={px(g)} y1={GG + 13} x2={px(g)} y2={GG + 23} stroke={COLP.gris} strokeWidth="1.6" strokeLinecap="round"/><Tx x={px(g)} y={GG + 42} s={17} a="middle" c={COLP.txt} w={600}>{virg(g, pasX < 1 ? 1 : 0)}</Tx></g>)}
      {grad && ty.map(g => <g key={'y' + g}><line x1={31} y1={py(g)} x2={41} y2={py(g)} stroke={COLP.gris} strokeWidth="1.6" strokeLinecap="round"/><Tx x={27} y={py(g) + 6} s={17} a="end" c={COLP.txt} w={600}>{virg(g, pasY < 1 ? 1 : 0)}</Tx></g>)}
      {/* trajectoire */}
      <defs><clipPath id="pes-clip"><rect x="40" y="0" width="360" height={YSOL} /></clipPath></defs>
      <g clipPath="url(#pes-clip)">
      {trajet === 'complete' && <path d={chemin(pts)} fill="none" stroke={COLP.traj} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>}
      {trajet === 'jusqu' && <g><path d={chemin(avant)} fill="none" stroke={COLP.traj} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d={chemin(apres)} fill="none" stroke={COLP.traj} strokeWidth="1.8" strokeDasharray="2 6" strokeLinecap="round"/></g>}
      </g>
      {/* cible */}
      {cible && <g><circle cx={px(cible.x)} cy={py(cible.y)} r={Math.max(7, M.RAYON_CIBLE * s)} fill="#fef3c7" stroke={COLP.cible} strokeWidth="2.2"/>
        <line x1={px(cible.x) - 4} y1={py(cible.y)} x2={px(cible.x) + 4} y2={py(cible.y)} stroke={COLP.cible} strokeWidth="2.2" strokeLinecap="round"/><line x1={px(cible.x)} y1={py(cible.y) - 4} x2={px(cible.x)} y2={py(cible.y) + 4} stroke={COLP.cible} strokeWidth="2.2" strokeLinecap="round"/></g>}
      {/* vecteurs (échelle de la clé) puis balle */}
      {items.filter(q => q.ok).map(q => <g key={q.cle}><Fl x1={bx} y1={by} x2={q.x2} y2={q.y2} c={q.c} dash={q.dash}/><TVi x={q.cx} y={q.cy + 17 * 0.33} l={q.l} i={q.i} c={q.c} s={17} ancre="middle"/></g>)}
      {comp && (() => { const dx = sh.has('v0') ? v0v.x * kv : v.x * kv, dy = sh.has('v0') ? -v0v.y * kv : -v.y * kv;
        return <g><line x1={bx} y1={by} x2={bx + dx} y2={by} stroke={COLP.gris} strokeWidth="1.8" strokeDasharray="4 4"/><line x1={bx + dx} y1={by} x2={bx + dx} y2={by + dy} stroke={COLP.gris} strokeWidth="1.8" strokeDasharray="4 4"/>
          <Sc x={bx + dx / 2} y={by + (dy < 0 ? 22 : -8)} l="v" i="x" a="middle" c={COLP.gris}/><Sc x={bx + dx + 8} y={by + dy / 2 + 5} l="v" i="y" c={COLP.gris}/></g>; })()}
      <circle cx={bx} cy={by} r={RB} fill="#fde68a" stroke={COLP.txt} strokeWidth="1.8"/>
      {/* clé des échelles, séparée du dessin */}
      <line x1="10" y1="262" x2="390" y2="262" stroke={COLP.clair} strokeWidth="1"/>
      {cles.map(([k, L, txt, c, dash], j) => { const x0 = debK[j]; return <g key={k}><Fl x1={x0} y1={284} x2={x0 + L} y2={284} c={c} dash={dash}/><Lg x={x0 + L + 8} y={291} s={17} c={c} segs={[{ v: k }, ' ' + txt]}/></g>; })}
      {grad && finK < 290 && <Tx x={392} y={291} a="end" s={17} c={COLP.gris} w={600}>axes en m</Tx>}
    </svg>);
}

// ====================================================
//  PLAN DU MOUVEMENT : vec(v0) et vec(g) définissent un plan vertical ; aucune composante hors du plan
// ====================================================
export function ScenePlan() {
  return (
    <svg viewBox="0 0 400 304" style={stl} role="img" aria-label="Un plan vertical, vu en perspective, contient le vecteur vitesse initiale, incliné vers le haut, et le vecteur champ de pesanteur, vertical vers le bas. Un axe Oz, perpendiculaire à ce plan, est tracé en pointillés.">
      <polygon points="110,30 350,30 350,200 110,200" fill="#e0f2fe" stroke={COLP.traj} strokeWidth="2" strokeLinejoin="round"/>
      {/* O au pied du plan vertical */}
      <circle cx="160" cy="130" r={RB} fill="#fde68a" stroke={COLP.txt} strokeWidth="1.8"/>
      <Fl x1={160} y1={130} x2={228} y2={86} c={COLP.v}/><EtiqV bx={228} by={86} ux={0.84} uy={-0.54} l="v" i="0" c={COLP.v}/>
      <Fl x1={160} y1={130} x2={160} y2={174} c={COLP.a} dash="6 4"/><TVi x={178} y={158} l="g" c={COLP.a} s={17} ancre="middle"/>
      <Fl x1={160} y1={130} x2={200} y2={130} c={COLP.gris} w={1.6} tete={7} demi={3}/>
      <Fl x1={124} y1={150} x2={124} y2={92} c={COLP.gris} w={1.6} tete={7} demi={3}/>
      <Tx x={206} y={135} s={17} c={COLP.gris} halo>x</Tx><Tx x={130} y={96} s={17} c={COLP.gris} halo>y</Tx>
      <Fl x1={160} y1={130} x2={66} y2={218} c={COLP.gris} w={1.8} dash="5 4"/><Tx x={44} y={228} s={17} c={COLP.gris} w={700}>z</Tx>
      <line x1="10" y1="246" x2="390" y2="246" stroke={COLP.clair} strokeWidth="1"/>
      <Lg x={14} y={270} s={17} c={COLP.txt} w={600} segs={['Plan vertical contenant ', { v: 'v', i: '0' }, ' et ', { v: 'g' }]}/>
      <Tx x={14} y={294} s={17} c={COLP.gris} w={600}>Oz (tirets) : perpendiculaire au plan</Tx>
    </svg>);
}

// ====================================================
//  GRAPHE : courbes en fonction du temps (énergies, x(t), y(t)) ; styles différents pour ne pas dépendre de la couleur
//  series : [{ nom, f, dash, c, w }] ; marque : date t à marquer
// ====================================================
export function GrapheTemps({ series, T, ymax, marque = null, titreY, aria }) {
  const X0 = 58, X1 = 388, Y0 = 194, Y1 = 26, sx = (X1 - X0) / T, ymaxN = ymax;
  const sy = (Y0 - Y1) / ymaxN;
  const px = t => X0 + t * sx, py = y => Y0 - y * sy;
  const pasT = pas(sx, 50), pasYv = pas(sy, 36);
  const tt = [], yy = [];
  for (let k = 0; k * pasT <= T + 1e-9; k++) tt.push(k * pasT);
  for (let k = 0; k * pasYv <= ymaxN + 1e-9; k++) yy.push(k * pasYv);
  const dec = pasYv < 1 ? 1 : 0, decT = pasT < 1 ? 1 : 0;
  return (
    <svg viewBox="0 0 400 270" style={stl} role="img" aria-label={aria || 'Courbes en fonction du temps.'}>
      <line x1={X0} y1={Y0} x2={X1 + 4} y2={Y0} stroke={COLP.gris} strokeWidth="1.8" strokeLinecap="round"/><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 6} stroke={COLP.gris} strokeWidth="1.8" strokeLinecap="round"/>
      {tt.map(g => <g key={'t' + g}><line x1={px(g)} y1={Y0} x2={px(g)} y2={Y0 + 6} stroke={COLP.gris} strokeWidth="1.6"/><Tx x={px(g)} y={Y0 + 25} a="middle" s={17} w={600}>{virg(g, decT)}</Tx></g>)}
      {yy.map(g => <g key={'y' + g}><line x1={X0 - 6} y1={py(g)} x2={X0} y2={py(g)} stroke={COLP.gris} strokeWidth="1.6"/><Tx x={X0 - 9} y={py(g) + 6} a="end" s={17} w={600}>{virg(g, dec)}</Tx></g>)}
      <Tx x={X1 + 4} y={Y0 + 46} a="end" s={17} c={COLP.gris}>t (s)</Tx><Tx x={X0 + 6} y={15} s={17} c={COLP.gris}>{titreY}</Tx>
      {series.map(sr => { const pts = []; for (let k = 0; k <= 100; k++) { const t = T * k / 100; pts.push(`${k ? 'L' : 'M'}${px(t).toFixed(1)} ${py(sr.f(t)).toFixed(1)}`); }
        return <path key={sr.nom} d={pts.join(' ')} fill="none" stroke={sr.c} strokeWidth={sr.w || 2.2} strokeDasharray={sr.dash} strokeLinecap={sr.dash ? 'butt' : 'round'} strokeLinejoin="round"/>; })}
      {marque != null && <g><line x1={px(marque)} y1={Y0} x2={px(marque)} y2={Y1} stroke={COLP.clair} strokeWidth="1.6" strokeDasharray="3 4"/>{series.map(sr => <circle key={sr.nom} cx={px(marque)} cy={py(sr.f(marque))} r="4.5" fill="#fff" stroke={sr.c} strokeWidth="2"/>)}</g>}
    </svg>);
}
// légende des courbes (hors du dessin) : échantillon de trait + nom
export const LegendeCourbes = ({ series }) => (
  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14, color: '#0f172a', marginTop: 4, justifyContent: 'center' }}>
    {series.map(sr => <span key={sr.nom} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" stroke={sr.c} strokeWidth="2.4" strokeDasharray={sr.dash} strokeLinecap={sr.dash ? 'butt' : 'round'}/></svg>{avecIndices(sr.nom)}</span>)}
  </div>);

// ====================================================
//  CARTES « À RETENIR » (viewBox de 320 de large : rendu à environ 230 px sur téléphone, soit un facteur 0,72 ; textes de 14,5 à 16, indices de 14,2 : au moins 10 px rendus)
// ====================================================
const Boite = ({ x, y, w, h, c = COLP.clair, f = '#f8fafc', sw = 1.6 }) => <rect x={x} y={y} width={w} height={h} rx="8" fill={f} stroke={c} strokeWidth={sw}/>;
const Titre = ({ segs, t }) => (segs ? <Lg x={160} y={24} s={16} anchor="middle" segs={segs}/> : <text x="160" y="24" fontSize="16" fontWeight="700" textAnchor="middle" fill={COLP.txt}>{t}</text>);
const FS = 15.5;   // taille de texte courante des cartes

// 1. Poids seul : vec(a) = vec(g)
export function SvgPoidsSeulCarte() {
  return (
    <svg viewBox="0 0 320 262" style={stlCarte} role="img" aria-label="Une balle en vol, soumise à son seul poids dirigé vers le bas. À droite, la chaîne d'égalités : la somme des forces est le poids, qui vaut m fois g, donc le vecteur accélération est égal au vecteur champ de pesanteur, composantes a x nulle et a y égale à moins g.">
      <Titre segs={['Poids seul : ', { v: 'a' }, ' = ', { v: 'g' }]}/>
      <circle cx="58" cy="92" r={RB + 1} fill="#fde68a" stroke={COLP.txt} strokeWidth="1.8"/>
      <Fl x1={58} y1={99} x2={58} y2={160} c={COLP.P}/><Lg x={66} y={168} s={FS + 1} c={COLP.P} segs={[{ v: 'P' }]}/>
      <Fl x1={22} y1={184} x2={22} y2={58} c={COLP.gris} w={1.6} tete={7} demi={3}/><Tx x={28} y={66} s={FS + 1} c={COLP.gris}>y</Tx>
      <Boite x={108} y={42} w={204} h={128}/>
      <Lg x={118} y={72} s={FS + 0.5} segs={['Σ', { v: 'F' }, ' = ', { v: 'P' }]}/>
      <Lg x={118} y={104} s={FS + 0.5} segs={['= m ', { v: 'g' }, ' = m ', { v: 'a' }]}/>
      <Lg x={118} y={138} s={FS + 0.5} c={COLP.a} segs={['donc ', { v: 'a' }, ' = ', { v: 'g' }]}/>
      <Tx x={118} y={160} s={FS} c={COLP.gris} w={600}>(m se simplifie)</Tx>
      <Boite x={10} y={196} w={300} h={56} c={COLP.txt} f="#fff" sw={2}/>
      <Lg x={160} y={218} s={FS} anchor="middle" segs={['sur Ox : a', { i: 'x' }, ' = 0']}/>
      <Lg x={160} y={242} s={FS} anchor="middle" segs={['sur Oy : a', { i: 'y' }, ' = −g']}/>
    </svg>);
}
// 2. Vitesses : primitives (sans les positions, qui sont l'objet d'une étape ultérieure)
export function SvgVitesseCarte() {
  return (
    <svg viewBox="0 0 320 286" style={stlCarte} role="img" aria-label="Deux colonnes : sur Ox, l'accélération nulle donne par primitive une vitesse constante égale à v zéro cos alpha ; sur Oy, l'accélération moins g donne par primitive v y égale à moins g t plus v zéro sin alpha.">
      <Titre t="Sur chaque axe"/>
      <Tx x={14} y={54} s={FS + 0.5} c={COLP.gris}>sur Ox</Tx><Tx x={166} y={54} s={FS + 0.5} c={COLP.gris}>sur Oy</Tx>
      <Boite x={10} y={62} w={144} h={36}/><Lg x={82} y={86} s={FS} anchor="middle" segs={['a', { i: 'x' }, ' = 0']}/>
      <Fl x1={82} y1={102} x2={82} y2={142} c={COLP.gris} w={1.8}/><Tx x={92} y={127} s={FS} c={COLP.gris} w={600}>primitive</Tx>
      <Boite x={10} y={146} w={144} h={56} c={COLP.txt} f="#fff" sw={2}/><Lg x={82} y={170} s={FS} anchor="middle" segs={['v', { i: 'x' }, ' = v', { i: '0' }]}/><Lg x={82} y={192} s={FS} anchor="middle" segs={['× cos α']}/>
      <Boite x={166} y={62} w={144} h={36}/><Lg x={238} y={86} s={FS} anchor="middle" segs={['a', { i: 'y' }, ' = −g']}/>
      <Fl x1={238} y1={102} x2={238} y2={142} c={COLP.gris} w={1.8}/><Tx x={248} y={127} s={FS} c={COLP.gris} w={600}>primitive</Tx>
      <Boite x={166} y={146} w={144} h={56} c={COLP.txt} f="#fff" sw={2}/><Lg x={238} y={170} s={FS} anchor="middle" segs={['v', { i: 'y' }, ' = −g t']}/><Lg x={238} y={192} s={FS} anchor="middle" segs={['+ v', { i: '0' }, ' sin α']}/>
      <Boite x={10} y={214} w={300} h={62} c={COLP.cible} f="#fffbeb"/>
      <Tx x={160} y={234} s={FS} a="middle" w={600}>constantes fixées par t = 0 :</Tx>
      <Lg x={160} y={258} s={FS} anchor="middle" segs={['v', { i: 'x' }, '(0) = v', { i: '0' }, ' cos α ; v', { i: 'y' }, '(0) = v', { i: '0' }, ' sin α']}/>
    </svg>);
}
// 3. Équations horaires et trajectoire : parabole
export function SvgTrajectoireCarte() {
  const p = { v0: 10, alpha: 30, h: 2, g: 9.8 }, s = 22, ox = 36, gy = 298, pts = M.trace(p, 80);
  const d = pts.map((q, k) => `${k ? 'L' : 'M'}${(ox + q.x * s).toFixed(1)} ${(gy - q.y * s).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 320 334" style={stlCarte} role="img" aria-label="Les équations horaires x de t et y de t, puis, en éliminant t, l'équation de la trajectoire y de x, polynôme du second degré en x. Un croquis montre la parabole depuis une plateforme jusqu'au sol.">
      <Titre t="Éliminer t : la trajectoire"/>
      <Boite x={8} y={36} w={304} h={30}/><Lg x={160} y={57} s={FS} anchor="middle" segs={['x(t) = v', { i: '0' }, ' cos α × t']}/>
      <Boite x={8} y={72} w={304} h={30}/><Lg x={160} y={93} s={FS} anchor="middle" segs={['y(t) = −½ g t² + v', { i: '0' }, ' sin α × t + h']}/>
      <Fl x1={50} y1={106} x2={50} y2={130} c={COLP.gris} w={1.8}/><Tx x={62} y={124} s={FS} c={COLP.gris} w={600}>on isole t dans x(t)</Tx>
      <Boite x={8} y={134} w={304} h={78} c={COLP.txt} f="#fff" sw={2}/>
      <Tx x={18} y={166} s={FS}>y(x) = −</Tx>
      <line x1={86} y1={161} x2={174} y2={161} stroke={COLP.txt} strokeWidth="1.6" strokeLinecap="round"/><Tx x={130} y={156} s={FS} a="middle">g</Tx><Lg x={130} y={178} s={FS} anchor="middle" segs={['2v', { i: '0' }, '² cos²α']}/>
      <Tx x={180} y={166} s={FS}>x²</Tx>
      <Tx x={18} y={202} s={FS}>+ (tan α) x + h</Tx>
      <rect x="16" y={gy - p.h * s + RB} width={ox + RB - 16} height={p.h * s} fill="#e2e8f0" stroke={COLP.gris} strokeWidth="1.4"/>
      <line x1="10" y1={gy + RB} x2="310" y2={gy + RB} stroke={COLP.gris} strokeWidth="2" strokeLinecap="round"/>
      <path d={d} fill="none" stroke={COLP.traj} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx={ox} cy={gy - p.h * s} r={RB} fill="#fde68a" stroke={COLP.txt} strokeWidth="1.8"/>
      <Tx x={160} y={326} s={FS} a="middle" c={COLP.gris} w={600}>degré 2 en x : une parabole</Tx>
    </svg>);
}
// 4. Sommet, durée, portée sur la trajectoire de la simulation (mêmes proportions que le modèle)
export function SvgSommetPorteeCarte() {
  const p = { v0: 10, alpha: 30, h: 2, g: 9.8 }, s = 22, ox = 34, gy = 152, pts = M.trace(p, 90), ts = M.tSommet(p), a = M.pos(p, ts), L = M.portee(p);
  const d = pts.map((q, k) => `${k ? 'L' : 'M'}${(ox + q.x * s).toFixed(1)} ${(gy - q.y * s).toFixed(1)}`).join(' ');
  const ax = ox + a.x * s, ay = gy - a.y * s, lx = ox + L * s;
  return (
    <svg viewBox="0 0 320 318" style={stlCarte} role="img" aria-label="Trajectoire d'une balle lancée depuis une plateforme : au sommet le vecteur vitesse est horizontal (v y nul) ; la portée est mesurée au sol, entre le pied de la plateforme et le point d'arrivée. Dessous, les règles : date du sommet, durée du vol, portée.">
      <Titre t="Sommet, durée du vol, portée"/>
      <rect x="16" y={gy - p.h * s + RB} width={ox + RB - 16} height={p.h * s} fill="#e2e8f0" stroke={COLP.gris} strokeWidth="1.4"/>
      <line x1="10" y1={gy + RB} x2="310" y2={gy + RB} stroke={COLP.gris} strokeWidth="2" strokeLinecap="round"/>
      <path d={d} fill="none" stroke={COLP.traj} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx={ox} cy={gy - p.h * s} r={RB} fill="#fde68a" stroke={COLP.txt} strokeWidth="1.8"/>
      <circle cx={ax} cy={ay} r={RB} fill="#fde68a" stroke={COLP.txt} strokeWidth="1.8"/>
      <Fl x1={ax} y1={ay} x2={ax + 44} y2={ay} c={COLP.v}/><EtiqV bx={ax + 44} by={ay} ux={1} uy={0} l="v" c={COLP.v}/>
      <Lg x={ax - 44} y={ay - 18} s={FS} segs={['v', { i: 'y' }, ' = 0']}/>
      <Fl x1={ox} y1={gy + 26} x2={lx} y2={gy + 26} c={COLP.cible} w={2}/><Fl x1={lx} y1={gy + 26} x2={ox} y2={gy + 26} c={COLP.cible} w={2}/>
      <Tx x={(ox + lx) / 2} y={gy + 50} s={FS + 0.5} a="middle" c={COLP.cible}>portée</Tx>
      <circle cx={lx} cy={gy} r="4" fill="#fff" stroke={COLP.traj} strokeWidth="2"/>
      <Boite x={8} y={218} w={304} h={92} c={COLP.txt} f="#fff" sw={1.8}/>
      <Lg x={18} y={240} s={FS} segs={['sommet : v', { i: 'y' }, ' = 0 donne t', { i: 's' }, ' =']}/><line x1={226} y1={235} x2={300} y2={235} stroke={COLP.txt} strokeWidth="1.5" strokeLinecap="round"/><Lg x={263} y={230} s={FS} anchor="middle" segs={['v', { i: '0' }, ' sin α']}/><Tx x={263} y={252} s={FS} a="middle">g</Tx>
      <Tx x={18} y={274} s={FS}>sol : y = 0 donne la durée du vol</Tx>
      <Lg x={18} y={298} s={FS} segs={['portée = v', { i: 'x' }, ' × durée du vol']}/>
    </svg>);
}
// 5. Énergies le long de la trajectoire de la simulation (m = 0,50 kg)
export function SvgEnergiesCarte() {
  const p = { v0: 10, alpha: 30, h: 2, g: 9.8 }, m = 0.5, T = M.dureeVol(p), X0 = 40, X1 = 296, Y0 = 164, Y1 = 62, em = M.energies(p, m, 0).Em, sy = (Y0 - Y1) / (em * 1.08), sx = (X1 - X0) / T;
  const courbe = f => { const a = []; for (let k = 0; k <= 60; k++) { const t = T * k / 60; a.push(`${k ? 'L' : 'M'}${(X0 + t * sx).toFixed(1)} ${(Y0 - f(t) * sy).toFixed(1)}`); } return a.join(' '); };
  return (
    <svg viewBox="0 0 320 300" style={stlCarte} role="img" aria-label="Courbes des énergies en fonction du temps : l'énergie cinétique (trait plein) diminue puis augmente, l'énergie potentielle de pesanteur (tirets) fait l'inverse, et leur somme, l'énergie mécanique (pointillés), reste constante. Dessous, la formule du théorème de l'énergie cinétique.">
      <Titre segs={['E', { i: 'm' }, ' = E', { i: 'c' }, ' + E', { i: 'pp' }, ' : constante']}/>
      <line x1={X0} y1={Y0} x2={X1 + 8} y2={Y0} stroke={COLP.gris} strokeWidth="1.8" strokeLinecap="round"/><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 8} stroke={COLP.gris} strokeWidth="1.8" strokeLinecap="round"/>
      <Tx x={X1 + 8} y={Y0 + 22} s={FS} a="end" c={COLP.gris}>t</Tx><Tx x={X0 + 6} y={Y1 - 12} s={FS} c={COLP.gris}>énergie</Tx>
      <path d={courbe(t => M.energies(p, m, t).Em)} fill="none" stroke={COLP.vert} strokeWidth="2.6" strokeDasharray="2 5" strokeLinecap="round"/>
      <path d={courbe(t => M.energies(p, m, t).Ec)} fill="none" stroke={COLP.traj} strokeWidth="2.2" strokeLinecap="round"/>
      <path d={courbe(t => M.energies(p, m, t).Epp)} fill="none" stroke={COLP.P} strokeWidth="2.2" strokeDasharray="8 5"/>
      <Lg x={X1 - 4} y={Y0 - em * sy - 8} s={FS} anchor="end" c={COLP.vert} segs={['E', { i: 'm' }]}/>
      <Lg x={X0 + 10} y={Y0 - M.energies(p, m, 0).Ec * sy + 24} s={FS} c={COLP.traj} segs={['E', { i: 'c' }]}/>
      <Lg x={X0 + 10} y={Y0 - 14} s={FS} c={COLP.P} segs={['E', { i: 'pp' }]}/>
      <Boite x={8} y={196} w={304} h={92} c={COLP.txt} f="#fff" sw={1.8}/>
      <Tx x={18} y={220} s={FS} w={600}>théorème de l’énergie cinétique :</Tx>
      <Lg x={18} y={248} s={FS} segs={['½ m v² − ½ m v', { i: '0' }, '² = m g h']}/>
      <Tx x={18} y={274} s={FS} c={COLP.gris} w={600}>h : dénivelée entre départ et arrivée</Tx>
    </svg>);
}
// 6. Limite du modèle : parabole idéale / trajectoire réelle d'un ballon (frottement quadratique, estimation)
export function SvgLimiteCarte() {
  const v0 = 25, al = 40, ideal = M.trace({ v0, alpha: al, h: 0, g: 9.8 }, 100), reel = trajetAvecFrottement(v0, al, 0.0133), s = 4.4, ox = 16, gy = 168;
  const d = a => a.map((q, k) => `${k ? 'L' : 'M'}${(ox + q.x * s).toFixed(1)} ${(gy - q.y * s).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 320 300" style={stlCarte} role="img" aria-label="Deux trajectoires d'un ballon lancé à 25 mètres par seconde sous 40 degrés : la parabole du modèle sans frottement, très longue, et la trajectoire réelle estimée avec frottements de l'air, plus courte et dissymétrique. Même échelle pour les deux.">
      <Titre t="Frottements : limite du modèle"/>
      <line x1="10" y1={gy + 6} x2="310" y2={gy + 6} stroke={COLP.gris} strokeWidth="2" strokeLinecap="round"/>
      <path d={d(ideal)} fill="none" stroke={COLP.traj} strokeWidth="2.2" strokeLinecap="round"/>
      <path d={d(reel)} fill="none" stroke={COLP.P} strokeWidth="2.2" strokeDasharray="8 5"/>
      <Tx x={160} y={74} s={FS} a="middle" c={COLP.traj}>trait plein : sans frottement</Tx>
      <Tx x={16} y={196} s={FS} c={COLP.P}>tirets : avec l’air (même échelle)</Tx>
      <Boite x={8} y={208} w={304} h={84} c={COLP.txt} f="#fff" sw={1.8}/>
      <Tx x={18} y={232} s={FS} w={600}>boule de pétanque, 10 m/s :</Tx>
      <Tx x={18} y={252} s={FS} w={600}>f ≪ P, le modèle convient</Tx>
      <Tx x={18} y={278} s={FS} w={600} c={COLP.P}>ballon, 25 m/s : f ≈ P</Tx>
    </svg>);
}
