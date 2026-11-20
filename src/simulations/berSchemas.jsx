// ====================================================
//  Schémas de la simulation 214 (écoulement d'un fluide : débit, relation de Bernoulli, effet Venturi ; niveau TG).
//  Scènes : viewBox 440 de large, textes de 17,5 à 21 (≥ 11 px rendus à 390 px). Cartes : viewBox de 320, textes ≥ 15,5.
//  Toutes les coordonnées sont des NOMBRES. Public daltonien : jamais la couleur seule (formes, traits pleins ou en tirets, motifs hachurés ou pointillés, étiquettes).
//  Proportions : diamètres des tuyaux proportionnels (1,4 px par mm) ; hauteurs de colonnes et altitudes à la même échelle verticale (70 px par m) ;
//  jet du réservoir : parabole y = x² / (4 h) (vitesse horizontale à l'orifice). Les vecteurs vitesse ont une longueur proportionnelle à la norme.
// ====================================================
import { pointsVenturi, torricelli, pCin, pPes, RHO, G, vSurface, D_RESERVOIR, aire } from './berModele';

const COL = { bleu: '#0369a1', eau: '#bfe6fb', eauFonce: '#1e40af', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
// lettre + indice (indice = petit texte séparé, jamais de tspan)
const Ind = ({ x, y, l, i, c = COL.txt, s = 18, w = 700, ancre = 'start' }) => {
  const lw = s * 0.62 * String(l).length, iw = i ? s * 0.6 * String(i).length : 0, x0 = ancre === 'middle' ? x - (lw + iw) / 2 : ancre === 'end' ? x - lw - iw : x;
  return (<g>
    <text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{l}</text>
    {i && <text x={x0 + lw} y={y + s * 0.26} fontSize={s} fontWeight={w} fill={c} {...HALO}>{i}</text>}
  </g>);
};
// lettre-vecteur (flèche au-dessus) avec indice de même taille que la lettre (lisible à 11 px sur téléphone)
const TVi = ({ x, y, l, i, c = COL.txt, s = 20, w = 700, ancre = 'start' }) => {
  const lw = s * 0.62 * String(l).length, W = lw + (i ? s * 0.62 * String(i).length : 0), x0 = ancre === 'end' ? x - W : ancre === 'middle' ? x - W / 2 : x, yy = y - s * 0.9;
  return (<g>
    <text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{l}</text>
    {i && <text x={x0 + lw} y={y + s * 0.26} fontSize={s} fontWeight={w} fill={c} {...HALO}>{i}</text>}
    <line x1={x0 + 1} y1={yy} x2={x0 + lw - 1} y2={yy} stroke={c} strokeWidth="1.6"/>
    <polygon points={`${x0 + lw - 1},${yy} ${x0 + lw - 6},${yy - 3} ${x0 + lw - 6},${yy + 3}`} fill={c}/>
  </g>);
};
const larg = (t, s) => [...String(t)].reduce((a, c) => a + s * (c === ' ' ? 0.3 : /[=+→−×≈]/.test(c) ? 0.66 : /[A-ZΔ]/.test(c) ? 0.68 : 0.58), 0);
// ligne de texte mêlant texte simple et lettres à indice (parts : { t } ou { l, i })
const Ligne = ({ x, y, s = 18, parts, ancre = 'middle', c = COL.txt, w = 700 }) => {
  const lw = p => (p.t != null ? larg(p.t, s) : larg(p.l, s) + larg(p.i || '', s)), tot = parts.reduce((a, p) => a + lw(p), 0);
  const x00 = ancre === 'middle' ? x - tot / 2 : ancre === 'end' ? x - tot : x;
  const xs = parts.reduce((acc, p) => [...acc, acc[acc.length - 1] + lw(p)], [x00]);
  return (<g>{parts.map((p, k) => { const x0 = xs[k]; return p.t != null
    ? <text key={k} x={x0} y={y} fontSize={s} fontWeight={w} fill={c} xmlSpace="preserve" style={{ whiteSpace: "pre" }} {...HALO}>{p.t}</text>
    : <g key={k}><text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...HALO}>{p.l}</text>{p.i && <text x={x0 + larg(p.l, s)} y={y + s * 0.26} fontSize={s} fontWeight={w} fill={c} {...HALO}>{p.i}</text>}</g>; })}</g>);
};
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 10 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};
// √ avec barre au-dessus de son contenu (texte court)
const Racine = ({ x, y, s = 18, children, c = COL.txt }) => {
  const w = larg(String(children), s) + 4;
  return (<g><text x={x} y={y} fontSize={s} fontWeight={700} fill={c}>√</text>
    <line x1={x + s * 0.62} y1={y - s * 0.86} x2={x + s * 0.62 + w} y2={y - s * 0.86} stroke={c} strokeWidth={1.8}/>
    <text x={x + s * 0.66} y={y} fontSize={s} fontWeight={700} fill={c}>{children}</text></g>);
};
const Motifs = () => (
  <defs>
    <pattern id="ber-hach" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#bbf7d0"/><line x1="0" y1="0" x2="0" y2="8" stroke="#15803d" strokeWidth="3"/></pattern>
    <pattern id="ber-pts" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#fed7aa"/><circle cx="4.5" cy="4.5" r="2.2" fill="#c2410c"/></pattern>
  </defs>);
const FILL = { P: COL.bleu, Z: 'url(#ber-hach)', V: 'url(#ber-pts)' };

// ====================================================
//  SCÈNE : tuyau (constant ou à col) avec lignes de courant, vecteurs vitesse, tubes manométriques
// ====================================================
const XS = { A: 70, B: 210, C: 370 }, KD = 1.15, KZ = 70, Y0 = 232, YTUBE = 76;   // KD : px par mm de diamètre ; KZ : px par m d'altitude du tuyau (les colonnes ont leur échelle propre, voir SceneTuyau)
const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
const rayonX = (x, rA, rB) => rA + (rB - rA) * (ease((x - 110) / 65) - ease((x - 245) / 65));
const zX = (x, dz) => dz * KZ * (ease((x - 100) / 75) - ease((x - 245) / 75));
const ycX = (x, dz) => Y0 - zX(x, dz);

/**
 * p : { dA, dB (mm), vA (m/s), dz (m), PrA (Pa, facultatif : nécessaire pour les tubes) }
 * tubes : lettres des points munis d'un tube manométrique (ex. ['A', 'B', 'C']) ; fleches : lettres des points munis d'un vecteur vitesse (ou true : A, B, C) ; courant : lignes de courant ;
 * diam : lettres dont le diamètre est écrit ; noms : lettres des points marqués ; repereA : trait pointillé au niveau de la colonne A ;
 * valeursH : écrire la hauteur de chaque colonne (données d'un énoncé) ; axeZ : tracer l'axe z = 0 (dénivelé)
 */
export function SceneTuyau({ p, tubes = [], fleches = [], courant = true, diam = [], noms = [], repereA = false, valeursH = null, axeZ = false, aria }) {
  const dz = p.dz || 0, rA = p.dA * KD / 2, rB = p.dB * KD / 2;
  const V = pointsVenturi({ dA: p.dA, dB: p.dB, vA: p.vA, dz, PrA: p.PrA ?? 8000 }), P = Object.fromEntries(V.pts.map(q => [q.nom, q]));
  const xs = []; for (let x = 16; x <= 424; x += 4) xs.push(x);
  const haut = xs.map(x => [x, ycX(x, dz) - rayonX(x, rA, rB)]), bas = xs.map(x => [x, ycX(x, dz) + rayonX(x, rA, rB)]);
  const pts = a => a.map(([x, y]) => `${x},${y.toFixed(1)}`).join(' ');
  const poly = [...haut, ...bas.slice().reverse()];
  const lignes = [-0.55, 0, 0.55].map(f => xs.map(x => [x, ycX(x, dz) + f * rayonX(x, rA, rB)]));
  const tete = (f, x) => { const y1 = ycX(x - 2, dz) + f * rayonX(x - 2, rA, rB), y2 = ycX(x + 2, dz) + f * rayonX(x + 2, rA, rB), a = Math.atan2(y2 - y1, 4), y = ycX(x, dz) + f * rayonX(x, rA, rB);
    return <polygon key={`${f}-${x}`} points={`${x + 5.4 * Math.cos(a)},${y + 5.4 * Math.sin(a)} ${x - 4 * Math.cos(a) - 4.4 * Math.sin(a)},${y - 4 * Math.sin(a) + 4.4 * Math.cos(a)} ${x - 4 * Math.cos(a) + 4.4 * Math.sin(a)},${y - 4 * Math.sin(a) - 4.4 * Math.cos(a)}`} fill={COL.eauFonce}/>; };
  const hCol = n => (valeursH ? valeursH[n] : P[n].h);
  const hMax = Math.max(0.05, ...tubes.map(hCol)), ks = Math.min(260, Math.max(70, 135 / hMax));   // px par m de colonne : échelle propre à chaque schéma (le plus haut niveau remplit le tube)
  const niveau = n => Math.min(ycX(XS[n], dz) - hCol(n) * ks, ycX(XS[n], dz) - rayonX(XS[n], rA, rB) - 3);
  const rX = n => rayonX(XS[n], rA, rB);
  const dLabel = n => `d = ${P[n].d} mm`;
  const Lv = 22, lettresV = fleches === true ? ['A', 'B', 'C'] : (fleches || []);   // Lv : px par m·s⁻¹ (vecteurs vitesse)
  const y0 = tubes.length === 0 ? 150 : 0;                                    // sans tube manométrique, on rogne la partie haute (vide)
  return (
    <svg viewBox={`0 ${y0} 440 ${338 - y0}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <rect x={4} y={y0 + 4} width={432} height={330 - y0} rx={14} fill="#fff" stroke={COL.clair} strokeWidth={2}/>
      {axeZ && dz > 0 && <g><line x1={16} y1={Y0} x2={424} y2={Y0} stroke={COL.gris} strokeWidth={2} strokeDasharray="8 6"/><Tx x={XS.B} y={Y0 + 30} s={19} ancre="middle" c={COL.gris}>z = 0</Tx></g>}
      {/* tuyau */}
      <polygon points={pts(poly)} fill={COL.eau}/>
      {/* tubes manométriques */}
      {tubes.map(n => { const x = XS[n], yw = ycX(x, dz) - rX(n), yn = niveau(n); return (
        <g key={n}>
          <rect x={x - 7} y={yn} width={14} height={Math.max(0, yw - yn + 2)} fill={COL.eau}/>
          <line x1={x - 7} y1={YTUBE} x2={x - 7} y2={yw} stroke={COL.txt} strokeWidth={2.6}/><line x1={x + 7} y1={YTUBE} x2={x + 7} y2={yw} stroke={COL.txt} strokeWidth={2.6}/>
          <line x1={x - 7} y1={yn} x2={x + 7} y2={yn} stroke={COL.bleu} strokeWidth={4}/>
        </g>); })}
      {repereA && tubes.includes('A') && <line x1={XS.A + 9} y1={niveau('A')} x2={XS.C + 24} y2={niveau('A')} stroke={COL.rouge} strokeWidth={2.2} strokeDasharray="7 5"/>}
      <polyline points={pts(haut)} fill="none" stroke={COL.txt} strokeWidth={4} strokeLinejoin="round"/><polyline points={pts(bas)} fill="none" stroke={COL.txt} strokeWidth={4} strokeLinejoin="round"/>
      {tubes.map(n => <rect key={`j${n}`} x={XS[n] - 5.5} y={ycX(XS[n], dz) - rX(n) - 3} width={11} height={7} fill={COL.eau}/>)}
      {/* lignes de courant */}
      {courant && lignes.map((l, k) => <polyline key={k} points={pts(l)} fill="none" stroke={COL.eauFonce} strokeWidth={2}/>)}
      {courant && [-0.55, 0, 0.55].map(f => [40, 142, 288, 396].map(x => tete(f, x)))}
      {/* points */}
      {noms.map(n => <circle key={n} cx={XS[n]} cy={ycX(XS[n], dz)} r={4.5} fill={COL.txt} stroke="#fff" strokeWidth={1.5}/>)}
      {noms.map(n => tubes.includes(n) ? null : <Tx key={`l${n}`} x={XS[n]} y={ycX(XS[n], dz) - rX(n) - 12} s={21} ancre="middle">{n}</Tx>)}
      {tubes.map(n => valeursH
        ? <Ind key={`h${n}`} x={XS[n]} y={64} l="h" i={n} s={19} ancre="middle" c={COL.bleu}/>
        : (noms.includes(n) ? <Tx key={`t${n}`} x={XS[n]} y={64} s={21} ancre="middle">{n}</Tx> : null))}
      {valeursH && tubes.map(n => <Ligne key={`hl${n}`} x={XS[n]} y={46} s={19} parts={[{ t: `= ${nbf(valeursH[n], 2)} m` }]} c={COL.bleu}/>)}
      {tubes.length > 0 && !valeursH && <Tx x={14} y={30} s={19} c={COL.gris} halo={false}>tubes ouverts à l’air libre</Tx>}
      {/* vecteurs vitesse (longueur proportionnelle à la norme) */}
      {lettresV.map(n => { const L = Lv * P[n].v, x1 = XS[n] - L / 2, x2 = XS[n] + L / 2; return (
        <g key={`v${n}`}><Fleche x1={x1} y1={274} x2={x2} y2={274} c={COL.orange} w={3.2}/>
          <TVi x={x2 + 10} y={280} l="v" i={n} s={20} c={COL.orange}/></g>); })}
      {lettresV.length > 0 && <Tx x={426} y={306} s={19} ancre="end" c={COL.orange} halo={false}>vecteurs à l’échelle</Tx>}
      {/* diamètres */}
      {diam.map(n => <Tx key={`d${n}`} x={XS[n]} y={327} s={19} ancre="middle" halo={false}>{dLabel(n)}</Tx>)}
    </svg>);
}

// ====================================================
//  BARRES EMPILÉES : les trois termes de la relation de Bernoulli en A, B, C (pressions relatives P − P_atm)
// ====================================================
function pasJoli(max, n = 5) { const brut = max / n, e = Math.pow(10, Math.floor(Math.log10(brut))), m = brut / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; }
export function BarresBernoulli({ p, aria }) {
  const V = pointsVenturi({ dA: p.dA, dB: p.dB, vA: p.vA, dz: p.dz || 0, PrA: p.PrA }), kPa = x => x / 1000;
  const tot = kPa(V.constante), pas = pasJoli(tot * 1.15, 5), ymax = Math.ceil(tot * 1.15 / pas) * pas, H = 160, Yb = 200, k = H / ymax;
  const xs = [100, 210, 320], haut = n => Yb - n * k;
  return (
    <svg viewBox="0 0 400 296" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <Motifs/>
      <rect x={3} y={3} width={394} height={290} rx={12} fill="#fff" stroke={COL.clair} strokeWidth={2}/>
      <Tx x={14} y={26} s={18} halo={false}>kPa</Tx>
      <line x1={50} y1={Yb - H - 6} x2={50} y2={Yb} stroke={COL.txt} strokeWidth={2.4}/><line x1={50} y1={Yb} x2={386} y2={Yb} stroke={COL.txt} strokeWidth={2.4}/>
      {Array.from({ length: Math.floor(ymax / pas) + 1 }, (_, j) => j * pas).map(g => <g key={g}><line x1={46} y1={haut(g)} x2={54} y2={haut(g)} stroke={COL.txt} strokeWidth={2}/><Tx x={42} y={haut(g) + 6} s={17.5} ancre="end" halo={false}>{String(Math.round(g * 100) / 100).replace('.', ',')}</Tx></g>)}
      <line x1={52} y1={haut(tot)} x2={388} y2={haut(tot)} stroke={COL.rouge} strokeWidth={2.4} strokeDasharray="8 5"/>
      <Tx x={388} y={haut(tot) - 8} s={17.5} ancre="end" c={COL.rouge} halo={false}>somme constante</Tx>
      {V.pts.map((q, j) => { const a = kPa(q.Pr) * k, b = kPa(q.pes) * k, c = kPa(q.cin) * k; return (
        <g key={q.nom}>
          <rect x={xs[j] - 36} y={Yb - a} width={72} height={a} fill={FILL.P} stroke={COL.txt} strokeWidth={1.8}/>
          {b > 0.5 && <rect x={xs[j] - 36} y={Yb - a - b} width={72} height={b} fill={FILL.Z} stroke={COL.txt} strokeWidth={1.8}/>}
          <rect x={xs[j] - 36} y={Yb - a - b - c} width={72} height={c} fill={FILL.V} stroke={COL.txt} strokeWidth={1.8}/>
          <Tx x={xs[j]} y={Yb + 26} s={21} ancre="middle" halo={false}>{q.nom}</Tx>
        </g>); })}
      {/* légende : forme + nom */}
      <rect x={14} y={236} width={20} height={20} fill={FILL.P} stroke={COL.txt} strokeWidth={1.8}/><Ligne x={40} y={253} s={18} ancre="start" parts={[{ t: 'P − ' }, { l: 'P', i: 'atm' }]}/>
      <rect x={146} y={236} width={20} height={20} fill={FILL.Z} stroke={COL.txt} strokeWidth={1.8}/><Tx x={172} y={253} s={18} halo={false}>ρ g z</Tx>
      <rect x={236} y={236} width={20} height={20} fill={FILL.V} stroke={COL.txt} strokeWidth={1.8}/><Tx x={262} y={253} s={18} halo={false}>½ ρ v²</Tx>
      <Ligne x={14} y={282} s={17.5} ancre="start" c={COL.gris} parts={[{ t: '(' }, { l: 'P', i: 'atm' }, { t: ', la même partout, n’est pas dessinée)' }]}/>
    </svg>);
}

// ====================================================
//  RÉSERVOIR QUI SE VIDE (formule de Torricelli)
//  h : profondeur de l'orifice sous la surface libre (m) ; dOr : diamètre de l'orifice (mm)
// ====================================================
const KR = 60, YH = 190, XT0 = 40, XT1 = 200, YSOL = 292;
export function SceneReservoir({ h = 1.5, dOr = 10, details = true, airLibre = true, aria }) {
  const ys = YH - h * KR, v = torricelli(h), hp = h * KR, L = Math.min(110, 14 * v);
  const xj = []; for (let x = 0; ; x += 6) { const y = x * x / (4 * hp); if (YH + y > YSOL - 2) { xj.push([XT1 + x, YSOL - 2]); break; } xj.push([XT1 + x, YH + y]); }
  return (
    <svg viewBox="0 0 440 330" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <rect x={4} y={4} width={432} height={322} rx={14} fill="#fff" stroke={COL.clair} strokeWidth={2}/>
      <line x1={20} y1={YSOL} x2={424} y2={YSOL} stroke={COL.gris} strokeWidth={3}/><Tx x={424} y={YSOL + 26} s={19} ancre="end" c={COL.gris} halo={false}>sol</Tx>
      {/* eau */}
      <rect x={XT0 + 2} y={ys} width={XT1 - XT0 - 4} height={YH + 12 - ys} fill={COL.eau}/>
      <line x1={XT0 + 2} y1={ys} x2={XT1 - 2} y2={ys} stroke={COL.bleu} strokeWidth={4}/>
      {/* parois : orifice dans la paroi droite, au fond */}
      <polyline points={`${XT0},36 ${XT0},${YH + 14} ${XT1},${YH + 14} ${XT1},${YH + 6}`} fill="none" stroke={COL.txt} strokeWidth={5} strokeLinejoin="round"/>
      <line x1={XT1} y1={36} x2={XT1} y2={YH - 6} stroke={COL.txt} strokeWidth={5}/>
      {/* jet : parabole y = x² / (4 h) */}
      <polyline points={xj.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke={COL.bleu} strokeWidth={Math.max(3, dOr * 0.5)} strokeLinecap="round"/>
      {/* points A (surface) et B (orifice) */}
      <circle cx={XT0 + 48} cy={ys} r={4.5} fill={COL.txt}/><Tx x={XT0 + 58} y={ys - 8} s={21}>A</Tx>
      <circle cx={XT1 - 4} cy={YH} r={4.5} fill={COL.txt} stroke="#fff" strokeWidth={1.5}/><Tx x={XT1 - 22} y={YH - 10} s={21} ancre="end">B</Tx>
      {/* hauteur h */}
      <line x1={22} y1={ys} x2={22} y2={YH} stroke={COL.rouge} strokeWidth={2.4}/>
      <polygon points={`22,${ys} 17,${ys + 10} 27,${ys + 10}`} fill={COL.rouge}/><polygon points={`22,${YH} 17,${YH - 10} 27,${YH - 10}`} fill={COL.rouge}/>
      <line x1={22} y1={ys} x2={XT0 + 46} y2={ys} stroke={COL.rouge} strokeWidth={1.6} strokeDasharray="5 4"/><line x1={22} y1={YH} x2={XT1 - 8} y2={YH} stroke={COL.rouge} strokeWidth={1.6} strokeDasharray="5 4"/>
      <Tx x={30} y={(ys + YH) / 2 + 7} s={20} c={COL.rouge}>h</Tx>
      {details && <g>
        <Fleche x1={XT1 + 6} y1={YH} x2={XT1 + 6 + L} y2={YH} c={COL.orange} w={3.2}/>
        <TVi x={XT1 + 14 + L * 0.5} y={YH - 14} l="v" i="B" s={20} c={COL.orange}/>
        {airLibre && <g><Tx x={XT1 + 12} y={ys + 6} s={19} c={COL.gris} halo={false}>air libre</Tx>
        <Tx x={XT1 + 12} y={YH + 38} s={19} c={COL.gris} halo={false}>air libre</Tx></g>}
      </g>}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320, textes ≥ 15,5)
// ====================================================
const stl = { width: '100%', maxWidth: 340, height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const Cadre = ({ aria, h, children, motifs = false }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={stl}>{motifs && <Motifs/>}{children}</svg>;
// petit tuyau de carte : x0..x1, centre yc, rayon d'entrée rA, de col rB
const tuyauCarte = (x0, x1, yc, rA, rB, reste = false) => {
  const xc0 = x0 + (x1 - x0) * 0.3, xc1 = x0 + (x1 - x0) * 0.45, xd0 = x0 + (x1 - x0) * 0.55, xd1 = x0 + (x1 - x0) * 0.7;
  const r = x => rA + (rB - rA) * (ease((x - xc0) / (xc1 - xc0)) - (reste ? 0 : ease((x - xd0) / (xd1 - xd0))));
  const xs = []; for (let x = x0; x <= x1; x += 4) xs.push(x);
  return { r, xs, haut: xs.map(x => `${x},${yc - r(x)}`).join(' '), bas: xs.map(x => `${x},${yc + r(x)}`).join(' '), poly: [...xs.map(x => `${x},${yc - r(x)}`), ...xs.slice().reverse().map(x => `${x},${yc + r(x)}`)].join(' ') };
};

// 1) régime permanent et ligne de courant
export function SvgCartePermanent() {
  const T = tuyauCarte(16, 304, 74, 34, 20);
  return (<Cadre aria="Un tuyau qui se resserre avec trois lignes de courant orientées de gauche à droite. En un point d'une ligne de courant, le vecteur vitesse est tangent à la ligne ; en régime permanent, ce vecteur ne change pas au cours du temps en un point donné." h={206}>
    <polygon points={T.poly} fill={COL.eau}/><polyline points={T.haut} fill="none" stroke={COL.txt} strokeWidth={3.5}/><polyline points={T.bas} fill="none" stroke={COL.txt} strokeWidth={3.5}/>
    {[-0.6, 0, 0.6].map(f => <polyline key={f} points={T.xs.map(x => `${x},${74 + f * T.r(x)}`).join(' ')} fill="none" stroke={COL.eauFonce} strokeWidth={2.2} strokeDasharray={f === 0 ? undefined : undefined}/>)}
    <Fleche x1={30} y1={74} x2={54} y2={74} c={COL.eauFonce} w={2.2} tete={9}/>
    <circle cx={70} cy={74} r={4.5} fill={COL.txt}/>
    <Fleche x1={70} y1={74} x2={124} y2={74} c={COL.orange} w={3.2}/>
    <TVi x={128} y={86} l="v" s={20} c={COL.orange}/>
    <Tx x={92} y={26} s={16} ancre="middle" c={COL.eauFonce} halo={false}>ligne de courant</Tx>
    <line x1={92} y1={32} x2={92} y2={46} stroke={COL.eauFonce} strokeWidth={1.8}/>
    <line x1={22} y1={128} x2={298} y2={128} stroke={COL.clair} strokeWidth={2}/>
    <Tx x={160} y={152} s={16.5} ancre="middle" halo={false}>permanent : en un point,</Tx>
    <Tx x={146} y={176} s={16.5} ancre="end" halo={false}>le vecteur</Tx><TVi x={152} y={176} l="v" s={17.5}/><Tx x={170} y={176} s={16.5} halo={false}>ne change pas</Tx>
    <Tx x={160} y={198} s={16.5} ancre="middle" halo={false}>au cours du temps</Tx>
  </Cadre>);
}
// 2) débit volumique et conservation
export function SvgCarteDebit() {
  const T = tuyauCarte(16, 304, 66, 34, 16, true);
  return (<Cadre aria="Un tuyau qui se resserre : la section S de gauche est grande et la vitesse petite ; la section de droite est petite et la vitesse grande. Le débit volumique Q égal S fois v est le même dans les deux sections." h={258}>
    <polygon points={T.poly} fill={COL.eau}/><polyline points={T.haut} fill="none" stroke={COL.txt} strokeWidth={3.5}/><polyline points={T.bas} fill="none" stroke={COL.txt} strokeWidth={3.5}/>
    <Fleche x1={34} y1={66} x2={64} y2={66} c={COL.orange} w={3.2}/><TVi x={72} y={60} l="v" i="A" s={19} c={COL.orange}/>
    <Fleche x1={196} y1={66} x2={294} y2={66} c={COL.orange} w={3.2}/><TVi x={236} y={42} l="v" i="B" s={19} c={COL.orange}/>
    <Ligne x={50} y={122} s={17} parts={[{ l: 'S', i: 'A' }, { t: ' grande' }]}/><Ligne x={262} y={122} s={17} parts={[{ l: 'S', i: 'B' }, { t: ' petite' }]}/>
    <line x1={22} y1={140} x2={298} y2={140} stroke={COL.clair} strokeWidth={2}/>
    <Ligne x={160} y={168} s={19} parts={[{ t: 'Q = S × v' }]}/>
    <Ligne x={160} y={198} s={19} parts={[{ l: 'S', i: 'A' }, { t: ' × ' }, { l: 'v', i: 'A' }, { t: ' = ' }, { l: 'S', i: 'B' }, { t: ' × ' }, { l: 'v', i: 'B' }]}/>
    <Tx x={160} y={224} s={16} ancre="middle" halo={false}>plus la section est petite,</Tx>
    <Tx x={160} y={245} s={16} ancre="middle" halo={false}>plus la vitesse est grande</Tx>
  </Cadre>);
}
// 3) la relation de Bernoulli : les trois termes
export function SvgCarteBernoulli() {
  return (<Cadre aria="Une barre empilée de trois termes : la pression statique P en bleu uni, le terme rho g z hachuré en vert, le terme un demi rho v au carré pointillé en orange. Leur somme reste constante le long d'une ligne de courant." h={234} motifs>
    <rect x={30} y={134} width={64} height={52} fill={FILL.P} stroke={COL.txt} strokeWidth={2}/><rect x={30} y={106} width={64} height={28} fill={FILL.Z} stroke={COL.txt} strokeWidth={2}/><rect x={30} y={72} width={64} height={34} fill={FILL.V} stroke={COL.txt} strokeWidth={2}/>
    <Tx x={112} y={166} s={16.5} halo={false}>P : pression</Tx><Tx x={112} y={187} s={16.5} halo={false}>statique</Tx>
    <Tx x={112} y={124} s={16.5} halo={false}>ρ g z : altitude</Tx>
    <Tx x={112} y={86} s={16.5} halo={false}>½ ρ v² : vitesse</Tx>
    <line x1={20} y1={72} x2={300} y2={72} stroke={COL.rouge} strokeWidth={2.2} strokeDasharray="7 5"/>
    <Tx x={160} y={26} s={17} ancre="middle" halo={false}>P + ½ ρ v² + ρ g z = constante</Tx>
    <Tx x={160} y={50} s={15.5} ancre="middle" c={COL.gris} halo={false}>le long d’une ligne de courant</Tx>
    <Tx x={160} y={218} s={16} ancre="middle" halo={false}>chaque terme est une pression (Pa)</Tx>
  </Cadre>);
}
// 4) conduite horizontale : v plus grande, P plus petite (qualitatif)
export function SvgCarteQualitatif() {
  const bar = (x, P, V) => <g><rect x={x} y={196 - P} width={58} height={P} fill={FILL.P} stroke={COL.txt} strokeWidth={2}/><rect x={x} y={196 - P - V} width={58} height={V} fill={FILL.V} stroke={COL.txt} strokeWidth={2}/></g>;
  return (<Cadre aria="Deux barres empilées de même hauteur totale pour une conduite horizontale : dans la partie large, la pression P est grande et la pression cinétique petite ; dans la partie étroite, la pression P est plus petite et la pression cinétique plus grande." h={282} motifs>
    <Tx x={160} y={26} s={16.5} ancre="middle" halo={false}>conduite horizontale (z constant)</Tx>
    <line x1={20} y1={86} x2={300} y2={86} stroke={COL.rouge} strokeWidth={2.2} strokeDasharray="7 5"/>
    {bar(46, 80, 30)}{bar(176, 52, 58)}
    <line x1={20} y1={196} x2={300} y2={196} stroke={COL.txt} strokeWidth={2.4}/>
    <Tx x={75} y={222} s={17} ancre="middle" halo={false}>large</Tx><Tx x={205} y={222} s={17} ancre="middle" halo={false}>étroite</Tx>
    <Tx x={112} y={150} s={16} halo={false}>P</Tx><Tx x={242} y={170} s={16} halo={false}>P</Tx>
    <Tx x={112} y={106} s={15.5} halo={false}>½ρv²</Tx><Tx x={242} y={126} s={15.5} halo={false}>½ρv²</Tx>
    <Tx x={160} y={246} s={16} ancre="middle" halo={false}>là où v est plus grande,</Tx>
    <Tx x={160} y={267} s={16} ancre="middle" halo={false}>P est plus petite</Tx>
  </Cadre>);
}
// 5) tube de Venturi : colonnes manométriques
export function SvgCarteVenturi() {
  const T = tuyauCarte(16, 304, 150, 30, 16), xa = 52, xb = 160, ya = 70, yb = 112;
  return (<Cadre aria="Un tube de Venturi horizontal avec deux tubes manométriques ouverts : la colonne de liquide est plus haute en A, dans la partie large, et plus basse en B, dans le col. L'écart de hauteur delta h est lié à la différence de pression par delta P égal rho g delta h." h={304}>
    <polygon points={T.poly} fill={COL.eau}/>
    {[[xa, ya, 'A'], [xb, yb, 'B']].map(([x, y, n]) => <g key={n}><rect x={x - 7} y={y} width={14} height={150 - T.r(x) - y + 2} fill={COL.eau}/><line x1={x - 7} y1={40} x2={x - 7} y2={150 - T.r(x)} stroke={COL.txt} strokeWidth={2.6}/><line x1={x + 7} y1={40} x2={x + 7} y2={150 - T.r(x)} stroke={COL.txt} strokeWidth={2.6}/><line x1={x - 7} y1={y} x2={x + 7} y2={y} stroke={COL.bleu} strokeWidth={4}/><Tx x={x} y={30} s={19} ancre="middle" halo={false}>{n}</Tx></g>)}
    <polyline points={T.haut} fill="none" stroke={COL.txt} strokeWidth={3.5}/><polyline points={T.bas} fill="none" stroke={COL.txt} strokeWidth={3.5}/>
    <rect x={xa - 5.5} y={150 - T.r(xa) - 3} width={11} height={7} fill={COL.eau}/><rect x={xb - 5.5} y={150 - T.r(xb) - 3} width={11} height={7} fill={COL.eau}/>
    <line x1={xa + 9} y1={ya} x2={282} y2={ya} stroke={COL.rouge} strokeWidth={2} strokeDasharray="6 5"/>
    <Fleche x1={248} y1={ya} x2={248} y2={yb - 1} c={COL.rouge} w={2.4} tete={9}/><line x1={xb + 9} y1={yb} x2={252} y2={yb} stroke={COL.rouge} strokeWidth={2} strokeDasharray="6 5"/>
    <Tx x={258} y={ya + 30} s={19} c={COL.rouge}>Δh</Tx>
    <Tx x={160} y={222} s={16.5} ancre="middle" halo={false}>col étroit : v plus grande,</Tx>
    <Tx x={160} y={243} s={16.5} ancre="middle" halo={false}>P plus petite</Tx>
    <Tx x={160} y={270} s={18} ancre="middle" halo={false}>ΔP = ρ g Δh</Tx>
    <Tx x={160} y={292} s={15.5} ancre="middle" c={COL.gris} halo={false}>(ΔP : P en A moins P en B)</Tx>
  </Cadre>);
}
// 6) Torricelli
export function SvgCarteTorricelli() {
  const hp = 78, ys = 70, yh = ys + hp, xt1 = 120, xs = [];
  for (let x = 0; ; x += 6) { const y = x * x / (4 * hp); if (yh + y > 200) { xs.push([xt1 + x, 200]); break; } xs.push([xt1 + x, yh + y]); }
  return (<Cadre aria="Un réservoir ouvert dont l'eau sort par un orifice latéral à la profondeur h : la surface libre et le jet sont à la pression atmosphérique, la vitesse de la surface est négligée. La vitesse de sortie vaut racine de deux g h et ne dépend pas de la masse volumique." h={318}>
    <rect x={32} y={ys} width={xt1 - 32} height={hp + 12} fill={COL.eau}/><line x1={32} y1={ys} x2={xt1} y2={ys} stroke={COL.bleu} strokeWidth={4}/>
    <polyline points={`32,34 32,${yh + 14} ${xt1},${yh + 14} ${xt1},${yh + 6}`} fill="none" stroke={COL.txt} strokeWidth={4.5}/><line x1={xt1} y1={34} x2={xt1} y2={yh - 6} stroke={COL.txt} strokeWidth={4.5}/>
    <polyline points={xs.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} fill="none" stroke={COL.bleu} strokeWidth={4} strokeLinecap="round"/>
    <line x1={20} y1={200} x2={300} y2={200} stroke={COL.gris} strokeWidth={2.4}/>
    <line x1={16} y1={ys} x2={16} y2={yh} stroke={COL.rouge} strokeWidth={2.4}/><polygon points={`16,${ys} 11,${ys + 9} 21,${ys + 9}`} fill={COL.rouge}/><polygon points={`16,${yh} 11,${yh - 9} 21,${yh - 9}`} fill={COL.rouge}/>
    <Tx x={44} y={(ys + yh) / 2 + 6} s={19} c={COL.rouge}>h</Tx>
    <circle cx={70} cy={ys} r={4.5} fill={COL.txt}/><Tx x={80} y={ys - 8} s={19}>A</Tx><circle cx={xt1 - 3} cy={yh} r={4.5} fill={COL.txt} stroke="#fff" strokeWidth={1.5}/><Tx x={xt1 - 14} y={yh - 10} s={19} ancre="end">B</Tx>
    <Fleche x1={xt1 + 6} y1={yh} x2={xt1 + 52} y2={yh} c={COL.orange} w={3}/><TVi x={xt1 + 24} y={yh - 12} l="v" i="B" s={19} c={COL.orange}/>
    <Ligne x={160} y={228} s={16} parts={[{ l: 'P', i: 'A' }, { t: ' = ' }, { l: 'P', i: 'B' }, { t: ' = ' }, { l: 'P', i: 'atm' }]}/>
    <Ligne x={160} y={250} s={16} parts={[{ l: 'v', i: 'A' }, { t: ' ≈ 0 (surface large)' }]}/>
    <Ligne x={60} y={284} s={19} ancre="start" parts={[{ l: 'v', i: 'B' }, { t: ' =' }]}/><Racine x={112} y={284} s={19}>2 g h</Racine>
    <Tx x={160} y={308} s={15.5} ancre="middle" c={COL.gris} halo={false}>indépendante de ρ</Tx>
  </Cadre>);
}
void RHO; void G; void vSurface; void D_RESERVOIR; void aire; void pCin; void pPes;
