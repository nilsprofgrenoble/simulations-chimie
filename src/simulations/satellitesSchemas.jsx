/* eslint-disable react-refresh/only-export-components -- fichier de schémas : exporte aussi des constantes et fonctions de mise à l’échelle */
// ====================================================
//  Schémas de la simulation 177 (satellites et lois de Kepler ; niveau TG).
//  Scène : viewBox 400 × 346 (dessin au-dessus du filet y = 250, légende dessous), textes de 16. Cartes « À retenir » : viewBox de 320 de large, textes ≥ 14.
//  Toutes les coordonnées sont des NOMBRES. Notation vectorielle : toute force, vitesse, accélération ou vecteur unitaire porte une flèche (Ligne : lettres-vecteurs).
//  Proportions fidèles : l'orbite et le rayon de l'astre sont dessinés avec le rapport R / r exact (astre agrandi seulement s'il serait invisible, et la légende le dit) ;
//  les longueurs des vecteurs sont proportionnelles à leur norme et la légende donne l'échelle sous forme d'une flèche-échelle de 36 px.
//  Flèches : trait de 2,4, bouts arrondis, pointe de taille fixe (9 × 8,4). Jamais la couleur seule : style de trait, nom écrit, légende séparée.
// ====================================================
import { Ligne } from './newtonSchemas';
import { positionEllipse, ellipse, aireBalayee, constanteKepler, G } from './satellitesModele';
import { indicesProfond } from '../commun';

export const COL = { F: '#b45309', a: '#b91c1c', v: '#15803d', u: '#0369a1', gris: '#64748b', clair: '#cbd5e1', txt: '#0f172a', astre: '#dbeafe', rouge: '#b91c1c', orange: '#b45309', vert: '#15803d', bleu: '#0369a1' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const NB = ' ';
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const supExp = n => String(n).split('').map(c => SUPS[c]).join('');

// ---------- outils de dessin ----------
/** Flèche fine : trait de 2,4 à bouts arrondis, pointe pleine de taille FIXE (9 de long, 4,2 de demi-largeur) quelle que soit la longueur. */
export const Fl = ({ x1, y1, x2, y2, c = COL.txt, w = 2.4, tirets = false, tete = 9 }) => {
  const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy);
  if (n < tete + 2) return null;
  const ux = dx / n, uy = dy / n, bx = x2 - ux * (tete - 1), by = y2 - uy * (tete - 1);
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={tirets ? '6 4' : undefined}/>
      <polygon points={`${x2},${y2} ${x2 - ux * tete - uy * 4.2},${y2 - uy * tete + ux * 4.2} ${x2 - ux * tete + uy * 4.2},${y2 - uy * tete - ux * 4.2}`} fill={c} stroke={c} strokeWidth="1" strokeLinejoin="round"/>
    </g>);
};
const Tx = ({ x, y, children, c = COL.txt, s = 16, w = 700, a = 'start', halo = true }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a} {...(halo ? HALO : {})}>{children}</text>;
// valeurs « jolies » pour les échelles de flèches
const JOLIS = [1, 1.5, 2, 3, 4, 5, 6, 8];
export function echelleNice(valeur, cible = 54, barre = 36) {
  if (!(valeur > 0)) return { N: 1, L: 0 };
  const e = Math.floor(Math.log10(valeur * barre / cible)); let best = null;
  for (const k of [e - 1, e, e + 1]) for (const m of JOLIS) { const N = m * Math.pow(10, k), L = barre * valeur / N, d = Math.abs(Math.log(L / cible)); if (!best || d < best.d) best = { N, L, d }; }
  return best;
}
/** Nombre pour la légende d'échelle : décimale ou notation scientifique pour les très petites valeurs. */
export function nbEchelle(N) {
  if (N >= 0.01 && N < 1e5) return nbf(Number(N.toPrecision(2)), N < 0.1 ? 3 : N < 1 ? 2 : N < 10 ? 1 : 0).replace(/,?0+$/, '').replace(/^$/, '0');
  const e = Math.floor(Math.log10(N)), m = N / Math.pow(10, e);
  return `${nbf(m, 1).replace(',0', '')}${NB}×${NB}10${e < 0 ? '⁻' : ''}${supExp(Math.abs(e))}`;
}
// placement d'une étiquette à partir d'un vecteur de décalage (lx, ly) mesuré depuis un point d'ancrage
function placer(x, y, lx, ly) {
  const anchor = lx > 4 ? 'start' : lx < -4 ? 'end' : 'middle', yy = ly > 4 ? y + 14 : ly < -4 ? y - 5 : y + 5;
  return { x: Math.min(386, Math.max(14, x)), y: Math.min(244, Math.max(30, yy)), anchor };
}

// ====================================================
//  SCÈNE : astre central, orbite circulaire, satellite, vecteurs, légende
//  astre : { R, nom } ; r : rayon d'orbite (m) ; theta : position (rad, sens trigonométrique) ;
//  montre : { F: false | 'direction' | { valeur (N) }, a: valeur (m/s²) | null, v: valeur (m/s) | null, frenet: bool }
//  sansOrbite : vue de dessus de l'astre seul (rotation et point de l'équateur) ; sol : angle du point de l'équateur (rad, avec l'orbite stationnaire)
// ====================================================
const CX = 200, CY = 138, RO = 80, PAS = 23;
/** Flèche courbe de rotation (sens trigonométrique, vue de dessus) : arc de a1 à a2 degrés, pointe pleine de taille fixe tangente à l'arc. */
const ArcRot = ({ cx, cy, ra, a1 = 205, a2 = 335, c = COL.gris, tete = 9, w = 2.4 }) => {
  const rad = d => d * Math.PI / 180, P1 = [cx + ra * Math.cos(rad(a1)), cy - ra * Math.sin(rad(a1))], P2 = [cx + ra * Math.cos(rad(a2)), cy - ra * Math.sin(rad(a2))];
  const d = [-Math.sin(rad(a2)), -Math.cos(rad(a2))], n = [-d[1], d[0]], f = x => x.toFixed(1);
  return (<g>
    <path d={`M${f(P1[0])} ${f(P1[1])} A${ra} ${ra} 0 0 0 ${f(P2[0] - d[0] * (tete - 1))} ${f(P2[1] - d[1] * (tete - 1))}`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round"/>
    <polygon points={`${f(P2[0])},${f(P2[1])} ${f(P2[0] - d[0] * tete + n[0] * tete * 0.47)},${f(P2[1] - d[1] * tete + n[1] * tete * 0.47)} ${f(P2[0] - d[0] * tete - n[0] * tete * 0.47)},${f(P2[1] - d[1] * tete - n[1] * tete * 0.47)}`} fill={c} stroke={c} strokeWidth="1" strokeLinejoin="round"/>
  </g>);
};
export function SceneOrbite({ astre, r, theta = 1.05, montre = {}, sansOrbite = false, sol = null, rotation = false, nomAstre = true, aria }) {
  const rp = sansOrbite ? 52 : RO * astre.R / r, rpAff = Math.max(rp, 3.5), agrandi = rp < 3.5;
  const orbite = !sansOrbite;
  const c = Math.cos(theta), s = Math.sin(theta), Sx = CX + RO * c, Sy = CY - RO * s;
  const ur = [c, -s], ut = [-s, -c];                                     // radial sortant et tangent (sens du mouvement), en coordonnées du dessin (y vers le bas)
  const P = (o_r, o_t) => [Sx + o_r * ur[0] + o_t * ut[0], Sy + o_r * ur[1] + o_t * ut[1]];
  const lignes = [];                                                       // lignes de la légende
  const els = [];
  const borne = (x, y) => [Math.min(384, Math.max(16, x)), Math.min(244, Math.max(24, y))];
  // vecteur : origine P(o_r, o_t), direction dir, longueur L ; étiquette soit à un décalage (dx le long du vecteur, dt perpendiculaire), soit à une position `at` = [radial, tangentiel] centrée
  const vec = (cle, o_r, o_t, dir, L, col, { tirets = false, w = 2.4, etiq, unite = false }) => {
    const [x0, y0] = P(o_r, o_t), dx = dir[0], dy = dir[1], x1 = x0 + dx * L, y1 = y0 + dy * L;
    els.push(<Fl key={cle} x1={x0} y1={y0} x2={x1} y2={y1} c={col} w={unite ? 2 : w} tirets={tirets || unite}/>);
    if (etiq && etiq.at) {
      const [lx, ly] = borne(...P(etiq.at[0], etiq.at[1]));
      els.push(<Ligne key={`${cle}-e`} x={lx} y={ly + 6} s={etiq.s || 18} c={col} anchor="middle" halo segs={etiq.segs}/>);
    } else if (etiq) {
      const lx = etiq.dx * dx + etiq.dt * (dir === ut ? -ur[0] : ut[0]), ly = etiq.dx * dy + etiq.dt * (dir === ut ? -ur[1] : ut[1]);
      const px = x1 + lx, py = y1 + ly, pl = placer(px, py, lx, ly);
      els.push(<Ligne key={`${cle}-e`} x={pl.x} y={pl.y} s={18} c={col} anchor={pl.anchor} halo segs={etiq.segs}/>);
    }
  };
  const inward = [-ur[0], -ur[1]];
  let La = 0;
  if (orbite) {
    if (montre.F) {
      if (montre.F === 'direction') { vec('F', 0, 0, inward, 52, COL.F, { etiq: { segs: [{ v: 'F' }], dx: -6, dt: -15 } }); lignes.push({ k: 'F0' }); }
      else { const e = echelleNice(montre.F.valeur / 1000); vec('F', 0, 0, inward, e.L, COL.F, { etiq: { segs: [{ v: 'F' }], dx: -6, dt: -15 } }); lignes.push({ k: 'F', N: e.N, unite: 'kN' }); }
    }
    if (montre.a != null) { const e = echelleNice(montre.a); La = e.L; vec('a', 0, 0, inward, e.L, COL.a, { etiq: { segs: [{ v: 'a' }], at: [-Math.max(22, e.L * 0.55), 17] } }); lignes.push({ k: 'a', N: e.N, unite: 'm/s²' }); }
    if (montre.frenet) {
      vec('un', 0, -12, inward, 34, COL.u, { unite: true, etiq: { segs: [{ v: 'u', i: 'n' }], at: [-34 - 16, -28], s: 20 } });
      vec('ut', 0, 0, ut, 34, COL.u, { unite: true, etiq: { segs: [{ v: 'u', i: 't' }], at: [4, 34 + 18], s: 20 } });
      lignes.push({ k: 'u' });
    }
    if (montre.v != null) { const e = echelleNice(montre.v / 1000); vec('v', montre.frenet ? 24 : 10, 0, ut, e.L, COL.v, { etiq: { segs: [{ v: 'v' }], at: s > 0.2 ? [(montre.frenet ? 24 + 14 : 14), -16] : [(montre.frenet ? 24 + 14 : 14), e.L + 18] } }); lignes.push({ k: 'v', N: e.N, unite: 'km/s' }); }
  }
  if (agrandi) lignes.push({ k: 'agrandi' });
  if (sol != null) lignes.push({ k: 'sol' });
  if (rotation) lignes.push({ k: 'rot' });
  if (orbite && !lignes.some(l => ['F0', 'F', 'a', 'u', 'v'].includes(l.k))) lignes.unshift({ k: 'sat' });
  // légende (sous le filet) : une ligne par élément
  const ordre = { sat: 0, F0: 1, F: 1, a: 2, u: 3, v: 4, sol: 5, rot: 6, agrandi: 7 };
  lignes.sort((p, q) => ordre[p.k] - ordre[q.k]);
  const nL = Math.max(1, lignes.length), H = 270 + (nL - 1) * PAS + 12;
  const leg = lignes.map((l, i) => {
    const y = 270 + i * PAS, x0 = 14;
    if (l.k === 'sat') return <g key="lsat"><circle cx="22" cy={y - 6} r="5" fill={COL.txt}/><Tx x={36} y={y} s={18} w={600} halo={false}>satellite</Tx><line x1="136" y1={y - 6} x2="170" y2={y - 6} stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/><Tx x={180} y={y} s={18} w={600} halo={false}>trajectoire</Tx></g>;
    if (l.k === 'sol') return <g key="lsol"><rect x="17.5" y={y - 11} width="9" height="9" fill="#fff" stroke={COL.txt} strokeWidth="2" transform={`rotate(45 22 ${y - 6.5})`}/><Tx x={40} y={y} s={18} w={600} halo={false}>point de l’équateur</Tx></g>;
    if (l.k === 'rot') return <g key="lrot"><ArcRot cx={22} cy={y - 6} ra={8} a1={200} a2={345} tete={6} w={2}/><Tx x={40} y={y} s={18} w={600} halo={false}>rotation de la Terre</Tx></g>;
    if (l.k === 'F0') return <g key="lF0"><Ligne x={x0} y={y} s={18} c={COL.F} segs={[{ v: 'F' }, ' : direction et sens (sans échelle)']}/></g>;
    if (l.k === 'agrandi') return <Tx key="lag" x={x0} y={y} s={18} w={600} halo={false}>Astre agrandi (trop petit à l’échelle)</Tx>;
    if (l.k === 'u') return <g key="lu"><Fl x1={x0} y1={y - 6} x2={x0 + 36} y2={y - 6} c={COL.u} w={2} tirets/><Ligne x={x0 + 46} y={y} s={20} c={COL.u} segs={[{ v: 'u', i: 't' }, ', ', { v: 'u', i: 'n' }, ' : vecteurs unitaires']}/></g>;
    const col = COL[l.k] || COL.txt;
    return <g key={`l${l.k}`}><Fl x1={x0} y1={y - 6} x2={x0 + 36} y2={y - 6} c={col}/><Ligne x={x0 + 46} y={y} s={18} c={col} segs={['échelle de ', { v: l.k }, ` : ${nbEchelle(l.N)}${NB}${l.unite}`]}/></g>;
  });
  const [gx, gy] = [CX + rpAff * Math.cos(sol ?? 0), CY - rpAff * Math.sin(sol ?? 0)];
  const petit = rpAff < 36;
  return (
    <svg viewBox={`0 0 400 ${H}`} style={stl} role="img" aria-label={aria}>
      {orbite && <circle cx={CX} cy={CY} r={RO} fill="none" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/>}
      <circle cx={CX} cy={CY} r={rpAff} fill={COL.astre} stroke={COL.gris} strokeWidth="2"/>
      <circle cx={CX} cy={CY} r="2.6" fill={COL.txt}/>
      {nomAstre && (!petit ? <Tx x={CX} y={orbite && s < -0.3 ? CY - 14 : CY + 28} a="middle" s={18} c={COL.txt}>{astre.Nom}</Tx> : rotation ? <Tx x={CX} y={CY + rpAff + 12 + 26} a="middle" s={18} c={COL.txt}>{astre.Nom}</Tx> : <Tx x={CX + rpAff + 6} y={CY + 6} s={18} c={COL.txt}>{astre.Nom}</Tx>)}
      {rotation && <ArcRot cx={CX} cy={CY} ra={rpAff + 12}/>}
      {sol != null && <g><line x1={CX} y1={CY} x2={orbite ? CX + RO * Math.cos(sol) : gx} y2={orbite ? CY - RO * Math.sin(sol) : gy} stroke={COL.gris} strokeWidth="1.5" strokeDasharray="2 4" strokeLinecap="round"/>
        <rect x={gx - 4.5} y={gy - 4.5} width="9" height="9" fill="#fff" stroke={COL.txt} strokeWidth="2" transform={`rotate(45 ${gx} ${gy})`}/></g>}
      {orbite && <g><circle cx={Sx} cy={Sy} r="4" fill={COL.txt} stroke="#fff" strokeWidth="1.5"/></g>}
      {els}
      <line x1="0" y1="250" x2="400" y2="250" stroke={COL.clair} strokeWidth="1.5"/>
      <rect x="0" y="251" width="400" height={H - 251} fill="#f8fafc"/>
      {leg}
    </svg>);
}

// ====================================================
//  SCÈNE : orbite elliptique (astre au foyer), deux secteurs balayés en des durées égales
//  secteurs : [{ f1, f2 }] ; fSat : position du satellite (fraction de période) ou null
// ====================================================
const SE = 100;                                       // pixels par demi-grand axe
export function SceneEllipse({ e, secteurs = [], fSat = null, aria }) {
  const ox = 200 + SE * e, oy = 132, X = x => ox + SE * x, Y = y => oy - SE * y;
  const o = ellipse(e), N = 160, pts = Array.from({ length: N + 1 }, (_, i) => { const k = Math.round(i / N * o.N); return [X(o.X[k]), Y(o.Y[k])]; });
  const chemin = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const sect = (s, k) => {
    const n = 28, arc = Array.from({ length: n + 1 }, (_, i) => positionEllipse(e, s.f1 + (s.f2 - s.f1) * i / n));
    const d = `M${X(0)} ${Y(0)} ` + arc.map(p => `L${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ') + ' Z';
    const mid = positionEllipse(e, (s.f1 + s.f2) / 2), vx = X(mid.x) - X(0), vy = Y(mid.y) - Y(0), nv = Math.hypot(vx, vy) || 1;
    let lx = X(0) + vx * (1 + 20 / nv), ly = Y(0) + vy * (1 + 20 / nv) + 5;                  // à l'extérieur de l'ellipse, dans le prolongement du secteur
    if (ly < 22 || ly > 242 || lx < 14 || lx > 386) { lx = X(0) + vx * 0.55; ly = Y(0) + vy * 0.55 + 5; }   // repli : à l'intérieur (avec halo)
    return <g key={k}><path d={d} fill={k ? 'url(#kep-pts)' : 'url(#kep-hach)'} stroke={k ? COL.orange : COL.bleu} strokeWidth="2" strokeLinejoin="round" strokeDasharray={k ? '6 3' : undefined}/>
      <Tx x={lx} y={ly} s={18} a="middle" c={k ? COL.orange : COL.bleu}>{k ? 'A₂' : 'A₁'}</Tx></g>;
  };
  const sat = fSat != null ? positionEllipse(e, fSat) : null;
  return (
    <svg viewBox="0 0 400 360" style={stl} role="img" aria-label={aria}>
      <defs>
        <pattern id="kep-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e0f2fe"/><line x1="0" y1="0" x2="0" y2="7" stroke={COL.bleu} strokeWidth="1.6"/></pattern>
        <pattern id="kep-pts" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#ffedd5"/><circle cx="4" cy="4" r="1.6" fill={COL.orange}/></pattern>
      </defs>
      <path d={chemin} fill="none" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/>
      {secteurs.map(sect)}
      <circle cx={X(0)} cy={Y(0)} r="9" fill={COL.astre} stroke={COL.gris} strokeWidth="2"/><circle cx={X(0)} cy={Y(0)} r="2.4" fill={COL.txt}/>
      {sat && <circle cx={X(sat.x)} cy={Y(sat.y)} r="4.5" fill={COL.txt} stroke="#fff" strokeWidth="1.5"/>}
      {/* noms directement sur le dessin : astre central et trajectoire du satellite, du côté où il n'y a pas de secteur */}
      {(() => {
        const dirs = secteurs.map(q => { const m = positionEllipse(e, (q.f1 + q.f2) / 2); return Math.atan2(m.y, m.x); });   // directions (repère mathématique) des secteurs vus du foyer
        const occupe = a => dirs.some(d => Math.abs(Math.atan2(Math.sin(d - a), Math.cos(d - a))) < 0.6);
        const bas = !occupe(-Math.PI / 2), b = Math.sqrt(1 - e * e), haut = !occupe(Math.PI / 2) || occupe(-Math.PI / 2);
        const yTraj = haut ? oy - SE * b - 8 : oy + SE * b + 20;
        return <g>
          <Tx x={X(0)} y={bas ? Y(0) + 30 : Y(0) - 18} s={16} a="middle" c={COL.txt}>astre</Tx>
          <Tx x={200} y={Math.min(244, Math.max(20, yTraj))} s={15} w={600} a="middle" c={COL.gris}>trajectoire du satellite</Tx>
        </g>;
      })()}
      <line x1="0" y1="250" x2="400" y2="250" stroke={COL.clair} strokeWidth="1.5"/>
      <rect x="0" y="251" width="400" height="109" fill="#f8fafc"/>
      <circle cx="22" cy="270" r="9" fill={COL.astre} stroke={COL.gris} strokeWidth="2"/><Tx x={40} y={277} s={18} w={600} halo={false}>astre central, au foyer de l’ellipse</Tx>
      <line x1="10" y1="297" x2="34" y2="297" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/><Tx x={40} y={301} s={18} w={600} halo={false}>trajectoire du satellite (ellipse)</Tx>
      <rect x="14" y="310" width="16" height="12" fill="url(#kep-hach)" stroke={COL.bleu} strokeWidth="1.5"/><Tx x={40} y={324} s={18} w={600} halo={false}>A₁ : aire balayée (durée choisie)</Tx>
      <rect x="14" y="334" width="16" height="12" fill="url(#kep-pts)" stroke={COL.orange} strokeWidth="1.5" strokeDasharray="4 2"/><Tx x={40} y={348} s={18} w={600} halo={false}>A₂ : aire balayée (même durée)</Tx>
    </svg>);
}

// ====================================================
//  GRAPHE : T² en fonction de r³ (points d'une même série autour d'un astre)
//  points : [{ x (m³), y (s²) }] ; actif : indice du point mis en valeur ; droite : { pente } trait fin passant par l'origine
// ====================================================
function pasJoli(max, n = 4) { const brut = max / n, e = Math.pow(10, Math.floor(Math.log10(brut))), m = brut / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; }
export function GrapheKepler({ points, actif = -1, droite = null, axeX = 'r', aria }) {
  const W = 400, H = 266, gx0 = 70, gx1 = 384, gy0 = 214, gy1 = 18;
  const xm = Math.max(...points.map(p => p.x)) * 1.08, ym = Math.max(...points.map(p => p.y)) * 1.08;
  const ex = Math.floor(Math.log10(xm)), ey = Math.floor(Math.log10(ym)), fx = Math.pow(10, ex), fy = Math.pow(10, ey);
  const px = pasJoli(xm / fx, 4), py = pasJoli(ym / fy, 4);
  const X = x => gx0 + (x / xm) * (gx1 - gx0), Y = y => gy0 - (y / ym) * (gy0 - gy1);
  const tx = [], ty = [];
  for (let v = 0; v * fx <= xm + 1e-9; v += px) tx.push(v);
  for (let v = 0; v * fy <= ym + 1e-9; v += py) ty.push(v);
  const f = v => String(Math.round(v * 100) / 100).replace('.', ',');
  const dr = droite && { x2: xm, y2: droite.pente * xm };
  // noms des points (si fournis) : les points collés près de l'origine sont regroupés sous une seule étiquette reliée par un trait
  const nommes = points.filter(p => p.nom), proches = nommes.filter(p => (X(p.x) - gx0) < 0.12 * (gx1 - gx0)), etiqs = [];
  if (proches.length) {
    const cx0 = proches.reduce((t, p) => t + X(p.x), 0) / proches.length, cy0 = proches.reduce((t, p) => t + Y(p.y), 0) / proches.length;
    etiqs.push(<g key="grp"><line x1={gx0 + 30} y1={gy0 - 56} x2={cx0 + 1} y2={cy0 - 7} stroke={COL.gris} strokeWidth="1.5" strokeLinecap="round"/><text x={gx0 + 12} y={gy0 - 62} fontSize="17" fontWeight="700" fill={COL.txt} {...HALO}>{proches.map(p => p.nom).join(', ')}</text></g>);
  }
  nommes.filter(p => !proches.includes(p)).forEach((p, k) => {
    const fx_ = (X(p.x) - gx0) / (gx1 - gx0), haut = fx_ > 0.5;
    etiqs.push(<text key={`n${k}`} x={haut ? X(p.x) - 10 : X(p.x) + 12} y={haut ? Y(p.y) - 8 : Y(p.y) + 20} fontSize="17" fontWeight="700" textAnchor={haut ? 'end' : 'start'} fill={COL.txt} {...HALO}>{p.nom}</text>);
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img" aria-label={aria}>
      <line x1={gx0} y1={gy0} x2={gx1} y2={gy0} stroke={COL.txt} strokeWidth="2" strokeLinecap="round"/><line x1={gx0} y1={gy0} x2={gx0} y2={gy1 - 4} stroke={COL.txt} strokeWidth="2" strokeLinecap="round"/>
      {tx.map(v => <g key={`x${v}`}><line x1={X(v * fx)} y1={gy0} x2={X(v * fx)} y2={gy0 + 5} stroke={COL.txt} strokeWidth="1.5"/><text x={X(v * fx)} y={gy0 + 23} fontSize="17" textAnchor="middle" fill={COL.txt}>{f(v)}</text></g>)}
      {ty.map(v => <g key={`y${v}`}><line x1={gx0 - 5} y1={Y(v * fy)} x2={gx0} y2={Y(v * fy)} stroke={COL.txt} strokeWidth="1.5"/><text x={gx0 - 9} y={Y(v * fy) + 5} fontSize="17" textAnchor="end" fill={COL.txt}>{f(v)}</text></g>)}
      <text x={(gx0 + gx1) / 2} y={H - 7} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>{axeX}³ (en 10{supExp(ex)} m³)</text>
      <text x="16" y={(gy0 + gy1) / 2} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt} transform={`rotate(-90 16 ${(gy0 + gy1) / 2})`}>T² (en 10{supExp(ey)} s²)</text>
      {dr && <line x1={X(0)} y1={Y(0)} x2={X(dr.x2)} y2={Y(dr.y2)} stroke={COL.gris} strokeWidth="1.6" strokeDasharray="6 4" strokeLinecap="round"/>}
      {points.map((p, i) => i === actif
        ? <rect key={i} x={X(p.x) - 6.5} y={Y(p.y) - 6.5} width="13" height="13" fill="#fff" stroke={COL.orange} strokeWidth="2.6"/>
        : <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="5" fill={COL.bleu} stroke="#fff" strokeWidth="1.5"/>)}
      {etiqs}
    </svg>);
}

// ====================================================
//  CARTES « À retenir » (viewBox de 320, textes ≥ 14, bas du dessin à 12 de la limite)
// ====================================================
const Carte = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} style={stlCarte} role="img" aria-label={aria}>{children}</svg>;
const Legende = ({ children, qual = false }) => <div style={{ fontSize: 14, lineHeight: 1.55, color: COL.txt, margin: '0 auto 8px', maxWidth: 320 }}>{indicesProfond(children)}{qual && <span style={{ display: 'block', fontStyle: 'italic', color: '#475569' }}>Schéma qualitatif, pas à l’échelle.</span>}</div>;
const rad = d => d * Math.PI / 180;
const pol = (cx, cy, r, th) => [cx + r * Math.cos(th), cy - r * Math.sin(th)];
const Sat = ({ x, y }) => <circle cx={x} cy={y} r="5" fill={COL.txt} stroke="#fff" strokeWidth="1.5"/>;
const Astre = ({ cx, cy, r }) => <g><circle cx={cx} cy={cy} r={r} fill={COL.astre} stroke={COL.gris} strokeWidth="2"/><circle cx={cx} cy={cy} r="2.4" fill={COL.txt}/></g>;

// B : force et accélération (qualitatif : une seule direction, vers le centre)
export function SvgCarteForce() {
  const cx = 150, cy = 96, R = 32, Ro = 72, th = rad(40), [x, y] = pol(cx, cy, Ro, th), dx = (cx - x) / Ro, dy = (cy - y) / Ro;
  return (<>
    <Carte h={214} aria="Un satellite sur une orbite circulaire autour d'un astre. Le vecteur force et le vecteur accélération partent du satellite, dans la même direction et le même sens : vers le centre de l'astre.">
      <circle cx={cx} cy={cy} r={Ro} fill="none" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/>
      <Astre cx={cx} cy={cy} r={R}/><Sat x={x} y={y}/>
      <Fl x1={x} y1={y} x2={x + dx * 62} y2={y + dy * 62} c={COL.F}/>
      <Fl x1={x + dy * 10} y1={y - dx * 10} x2={x + dy * 10 + dx * 40} y2={y - dx * 10 + dy * 40} c={COL.a}/>
      <Ligne x={x + dx * 31 - dy * 16} y={y + dy * 31 + dx * 16 + 5} s={16} c={COL.F} anchor="end" halo segs={[{ v: 'F' }]}/>
      <Ligne x={x + dy * 10 + dx * 40 + 14} y={y - dx * 10 + dy * 40 + 14} s={16} c={COL.a} halo segs={[{ v: 'a' }]}/>
      <rect x="10" y="184" width="300" height="20" rx="6" fill="#f8fafc"/>
      <Ligne x={160} y={200} s={16} anchor="middle" segs={['même direction et même sens']}/>
    </Carte>
    <Legende qual>vec(F) = m × vec(a) : le satellite est attiré vers le centre de l’astre ; sa masse m disparaît de vec(a).</Legende>
  </>);
}
// C : mouvement circulaire uniforme (trois positions : même norme de v et de a, directions qui changent)
export function SvgCarteUniforme() {
  const cx = 160, cy = 98, Ro = 70;
  return (<>
    <Carte h={226} aria="Un satellite sur un cercle, dessiné à trois positions. À chaque position, le vecteur vitesse est tangent au cercle et le vecteur accélération pointe vers le centre. Les longueurs de ces vecteurs sont les mêmes aux trois positions : seules les directions changent.">
      <circle cx={cx} cy={cy} r={Ro} fill="none" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/>
      <circle cx={cx} cy={cy} r="2.6" fill={COL.txt}/>
      {[30, 150, 270].map((d, k) => { const th = rad(d), [x, y] = pol(cx, cy, Ro, th), ut = [-Math.sin(th), -Math.cos(th)], inw = [-Math.cos(th), Math.sin(th)];
        return <g key={d}><Fl x1={x + Math.cos(th) * 7} y1={y - Math.sin(th) * 7} x2={x + Math.cos(th) * 7 + ut[0] * 40} y2={y - Math.sin(th) * 7 + ut[1] * 40} c={COL.v}/>
          <Fl x1={x} y1={y} x2={x + inw[0] * 34} y2={y + inw[1] * 34} c={COL.a}/><Sat x={x} y={y}/>
          {k === 0 && <g><Ligne x={x + 12} y={y - 18} s={16} c={COL.v} halo segs={[{ v: 'v' }]}/><Ligne x={x + inw[0] * 34 - 8} y={y + inw[1] * 34 + 14} s={16} c={COL.a} anchor="end" halo segs={[{ v: 'a' }]}/></g>}
        </g>; })}
      <rect x="10" y="190" width="300" height="24" rx="6" fill="#f8fafc"/>
      <Ligne x={160} y={207} s={16} anchor="middle" segs={['normes fixes, directions variables']}/>
    </Carte>
    <Legende qual>Orbite circulaire : a<sub>t</sub> = 0, donc v est constante (mouvement uniforme) ; vec(a) = a<sub>n</sub> × vec(u)_n est centripète.</Legende>
  </>);
}
// D : la masse du satellite n'intervient pas (deux satellites sur la même orbite)
export function SvgCarteMasse() {
  const cx = 160, cy = 92, Ro = 64;
  const ut = th => [-Math.sin(th), -Math.cos(th)];
  const sats = [{ d: 40, rr: 5.5, nom: 'm', cote: 1 }, { d: 200, rr: 11, nom: '5 m', cote: -1 }];
  return (<>
    <Carte h={226} aria="Deux satellites de masses différentes, m et 5 m, sur la même orbite circulaire. Leurs vecteurs vitesse ont la même longueur : la vitesse sur une orbite de rayon donné ne dépend pas de la masse du satellite.">
      <circle cx={cx} cy={cy} r={Ro} fill="none" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/>
      <Astre cx={cx} cy={cy} r={28}/>
      {sats.map(({ d, rr, nom, cote }) => { const th = rad(d), [x, y] = pol(cx, cy, Ro, th), u = ut(th), x0 = x + Math.cos(th) * (rr + 4), y0 = y - Math.sin(th) * (rr + 4); return <g key={nom}>
        <Fl x1={x0} y1={y0} x2={x0 + u[0] * 40} y2={y0 + u[1] * 40} c={COL.v}/>
        <circle cx={x} cy={y} r={rr} fill={COL.txt} stroke="#fff" strokeWidth="2"/>
        <Ligne x={x + cote * (rr + 10)} y={y + 5} s={16} anchor={cote > 0 ? 'start' : 'end'} halo segs={[nom]}/></g>; })}
      <rect x="10" y="186" width="300" height="28" rx="6" fill="#f8fafc"/>
      <Ligne x={160} y={206} s={16} anchor="middle" segs={['même orbite : même v, même T']}/>
    </Carte>
    <Legende qual>v et T ne dépendent que de l’astre (M) et du rayon r de l’orbite, jamais de la masse m du satellite.</Legende>
  </>);
}
// E : troisième loi (points alignés sur une droite passant par l'origine)
export function SvgCarteTroisieme() {
  const x0 = 54, y0 = 150, xm = 292, ym = 28;
  const pts = [[0.08, 0.08], [0.3, 0.3], [0.62, 0.62], [1, 1]];
  const X = u => x0 + u * (xm - x0 - 16), Y = u => y0 - u * (y0 - ym - 10);
  return (<>
    <Carte h={214} aria="Graphique de T au carré en fonction de r au cube pour quatre satellites d'un même astre : les points sont alignés sur une droite qui passe par l'origine.">
      <line x1={x0} y1={y0} x2={xm} y2={y0} stroke={COL.txt} strokeWidth="2" strokeLinecap="round"/><line x1={x0} y1={y0} x2={x0} y2={ym - 6} stroke={COL.txt} strokeWidth="2" strokeLinecap="round"/>
      <line x1={X(0)} y1={Y(0)} x2={X(1.08)} y2={Y(1.08)} stroke={COL.gris} strokeWidth="1.8" strokeDasharray="6 4" strokeLinecap="round"/>
      {pts.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="5.5" fill={COL.bleu} stroke="#fff" strokeWidth="1.5"/>)}
      <text x={x0 - 8} y={ym + 6} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.txt}>T²</text>
      <text x={xm} y={y0 + 22} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.txt}>r³</text>
      <text x={x0 + 10} y={y0 + 22} fontSize="16" fontWeight="700" fill={COL.txt}>0</text>
      <rect x="10" y="176" width="300" height="26" rx="6" fill="#f8fafc"/>
      <text x="160" y="194" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>droite par l’origine : T² ∝ r³</text>
    </Carte>
    <Legende qual>Pour tous les corps en orbite circulaire autour du même astre : frac(T²|r³) = frac(4π²|G M) (constante).</Legende>
  </>);
}
// F : orbite géostationnaire vue de dessus (rayons à l'échelle : r ≈ 6,6 R)
export function SvgCarteGeo() {
  const cx = 160, cy = 90, Ro = 76, Rp = Ro / 6.62, th = rad(35), [x, y] = pol(cx, cy, Ro, th), [gx, gy] = pol(cx, cy, Rp, th);
  return (<>
    <Carte h={254} aria="Vue de dessus de la Terre et de l'orbite géostationnaire, dessinées à l'échelle : le rayon de l'orbite vaut environ 6,6 fois celui de la Terre. La Terre et le satellite tournent dans le même sens, avec la même période ; le satellite reste à la verticale d'un point de l'équateur.">
      <circle cx={cx} cy={cy} r={Ro} fill="none" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/>
      <Astre cx={cx} cy={cy} r={Rp}/>
      <line x1={gx} y1={gy} x2={x} y2={y} stroke={COL.gris} strokeWidth="1.5" strokeDasharray="2 4" strokeLinecap="round"/>
      <rect x={gx - 3.5} y={gy - 3.5} width="7" height="7" fill="#fff" stroke={COL.txt} strokeWidth="1.8" transform={`rotate(45 ${gx} ${gy})`}/>
      <Sat x={x} y={y}/>
      <ArcRot cx={cx} cy={cy} ra={Rp + 12}/>
      <Tx x={cx} y={cy + Rp + 12 + 22} a="middle" s={16} w={700} c={COL.txt} halo={false}>Terre</Tx>
      <Fl x1={x + Math.cos(th) * 7} y1={y - Math.sin(th) * 7} x2={x + Math.cos(th) * 7 - Math.sin(th) * 34} y2={y - Math.sin(th) * 7 - Math.cos(th) * 34} c={COL.v}/>
      <Ligne x={x + 14} y={y - 16} s={16} c={COL.v} halo segs={[{ v: 'v' }]}/>
      <rect x="10" y="176" width="300" height="68" rx="6" fill="#f8fafc"/>
      <text x="160" y="196" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>plan de l’équateur, même sens</text>
      <text x="160" y="215" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>T = jour sidéral (23 h 56 min)</text>
      <text x="160" y="234" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>schéma à l’échelle : r ≈ 6,6 R</text>
    </Carte>
    <Legende>Un satellite géostationnaire reste fixe dans le ciel : il tourne avec la Terre, au-dessus d’un point de l’équateur.</Legende>
  </>);
}
// G : loi des aires (ellipse, deux secteurs de même aire)
export function SvgCarteAires() {
  const e = 0.6, S = 78, ox = 160 + S * e, oy = 100, X = x => ox + S * x, Y = y => oy - S * y;
  const o = ellipse(e), chem = Array.from({ length: 121 }, (_, i) => { const k = Math.round(i / 120 * o.N); return `${i ? 'L' : 'M'}${X(o.X[k]).toFixed(1)} ${Y(o.Y[k]).toFixed(1)}`; }).join(' ');
  const sect = (f1, f2, k) => { const arc = Array.from({ length: 21 }, (_, i) => positionEllipse(e, f1 + (f2 - f1) * i / 20)); const d = `M${X(0)} ${Y(0)} ` + arc.map(p => `L${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ') + ' Z';
    return <path key={k} d={d} fill={k ? 'url(#kc-pts)' : 'url(#kc-hach)'} stroke={k ? COL.orange : COL.bleu} strokeWidth="2" strokeLinejoin="round" strokeDasharray={k ? '6 3' : undefined}/>; };
  const m1 = positionEllipse(e, 1 / 24), m2 = positionEllipse(e, 0.5);
  return (<>
    <Carte h={226} aria="Orbite elliptique avec l'astre au foyer. Deux secteurs sont balayés pendant des durées égales : un court et large près de l'astre, un allongé loin de l'astre. Leurs aires sont égales.">
      <defs>
        <pattern id="kc-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e0f2fe"/><line x1="0" y1="0" x2="0" y2="7" stroke={COL.bleu} strokeWidth="1.6"/></pattern>
        <pattern id="kc-pts" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#ffedd5"/><circle cx="4" cy="4" r="1.6" fill={COL.orange}/></pattern>
      </defs>
      <path d={chem} fill="none" stroke={COL.gris} strokeWidth="1.8" strokeDasharray="5 5"/>
      {sect(0, 1 / 12, 0)}{sect(0.5 - 1 / 24, 0.5 + 1 / 24, 1)}
      <circle cx={X(0)} cy={Y(0)} r="7" fill={COL.astre} stroke={COL.gris} strokeWidth="2"/>
      <text x={X(m1.x) + 12} y={Y(m1.y) + 2} fontSize="16" fontWeight="700" fill={COL.bleu} {...HALO}>A₁</text>
      <text x={X(m2.x) + 4} y={Y(m2.y) - 28} fontSize="16" fontWeight="700" fill={COL.orange} {...HALO}>A₂</text>
      <rect x="10" y="186" width="300" height="28" rx="6" fill="#f8fafc"/>
      <text x="160" y="205" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>même durée ⇒ même aire : A₁ = A₂</text>
    </Carte>
    <Legende qual>Le satellite va plus vite près de l’astre que loin de l’astre : le rayon vecteur balaie des aires égales en des durées égales.</Legende>
  </>);
}
export { constanteKepler, G, aireBalayee };
