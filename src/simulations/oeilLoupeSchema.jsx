import * as M from "./oeilLoupeModele";
import { NB } from "./Distillation";
import { nbf } from "./Travail";
import { CouchePhotons, Poignee } from "./lentilleMinceAnim";

// Schémas de l'œil réduit, du diamètre apparent et de la loupe (TSTL) : simulation 116, cartes « À retenir » et schémas d'énoncés.
// Toutes les positions viennent de oeilLoupeModele.js : le schéma ne peut pas contredire le calcul.
// Œil : lentille (cristallin + cornée) et rétine à l'échelle réelle (mm) ; objet et distance à l'objet NON à l'échelle (axe interrompu).
export const C = { lent: '#0369a1', r1: '#0072b2', r2: '#d55e00', img: '#15803d', flou: '#dc2626', ret: '#a16207', obj: '#0f172a', foyer: '#0369a1', theta: '#7c3aed', txt: '#334155' };
const THETA_INF = 0.04;       // inclinaison (rad) du faisceau issu d'un point hors axe d'un objet à l'infini
const fl = (x, y, ang, c, t = 6) => <polygon points={`0,0 ${-2 * t},${-t * 0.8} ${-2 * t},${t * 0.8}`} fill={c} transform={`translate(${x},${y}) rotate(${ang})`}/>;
const fr = (x, n = 1) => nbf(x, n);

const etroit = () => typeof window !== 'undefined' && window.innerWidth < 600;      // téléphone : textes des schémas pleine largeur plus grands (la scène y est réduite à ~50 %)
// Forme de l'œil réduit (contour, pupille, lentille de courbure liée à f′, rétine) : xL = position du cristallin, y0 = axe, k = px par mm
export function FormeOeil({ xL, y0, k, fe = M.L_OEIL, nomRetine = true, couleurRetine = C.ret }) {
  const XR = xL + k * M.L_OEIL, yt = y0 - 4.6 * k, yb = y0 + 4.6 * k;
  const s = Math.max(3, Math.min(11, (4 + (17.6 - fe) * 2.4) * (k / 9)));          // bombement de la lentille : plus la focale est courte, plus elle est bombée
  return (
    <g>
      <path d={`M${xL},${yt} Q${(xL + XR) / 2},${y0 - 14 * k} ${XR},${y0 - 6.4 * k} L${XR},${y0 + 6.4 * k} Q${(xL + XR) / 2},${y0 + 14 * k} ${xL},${yb}`} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.6"/>
      <path d={`M${xL},${y0 - 3.1 * k} Q${xL + 2 * s},${y0} ${xL},${y0 + 3.1 * k} Q${xL - 2 * s},${y0} ${xL},${y0 - 3.1 * k} Z`} fill="#bae6fd" stroke={C.lent} strokeWidth="2"/>
      <rect x={xL - 2.5} y={y0 - 4.7 * k} width="5" height={1.9 * k} fill="#475569"/><rect x={xL - 2.5} y={y0 + 2.8 * k} width="5" height={1.9 * k} fill="#475569"/>
      <line x1={XR} y1={y0 - 6.4 * k} x2={XR} y2={y0 + 6.4 * k} stroke={couleurRetine} strokeWidth="4.5"/>
    </g>);
}

// ────────────────────────── L'œil réduit (échelle réelle dans l'œil) ──────────────────────────
export function SchemaOeil({ D = 25, fe = M.L_OEIL, large = 700, haut: hautProp = 300, k = 10.5, xL = 395, rayons = true, etiquettes = true, label, compact = false, dp = 5, lum = null }) {
  const haut = !compact && large === 700 && etroit() ? 390 : hautProp;
  const y0 = haut / 2, X = x => xL + k * x, Y = y => y0 - k * y, XR = X(M.L_OEIL);
  const inf = !isFinite(D), Dmm = D * 10, AB = M.AB_OEIL;
  const OAp = inf ? fe : M.positionImageOeil(Dmm, fe), yBp = inf ? -fe * THETA_INF : M.grandissementOeil(Dmm, fe) * AB;
  const nette = inf ? Math.abs(fe - M.L_OEIL) <= M.TOL_RETINE : M.netteRetine(Dmm, fe);
  const hp = dp / 2;
  const xDeb = xL - (compact ? 90 : 170);                                      // début du tracé des rayons incidents (px)
  const rayon = (yl, c, cle, sw) => {
    const sIn = inf ? -THETA_INF : (yl - AB) / Dmm;                            // pente du rayon incident (réelle)
    const sOut = (yBp - yl) / OAp, yRet = yl + sOut * M.L_OEIL;
    const xmm = (xDeb - xL) / k;
    const prolonge = OAp > M.L_OEIL && X(OAp) < large - 6;
    return { yRet, c, pts: [[xDeb, Y(yl + sIn * xmm)], [X(0), Y(yl)], [XR, Y(yRet)]], g: (
      <g key={cle}>
        <polyline points={`${xDeb},${Y(yl + sIn * xmm)} ${X(0)},${Y(yl)} ${XR},${Y(yRet)}`} fill="none" stroke={c} strokeWidth={sw} strokeLinejoin="round"/>
        {prolonge && <line x1={XR} y1={Y(yRet)} x2={X(OAp)} y2={Y(yBp)} stroke={c} strokeWidth="1.6" strokeDasharray="4 3" opacity="0.8"/>}
      </g>) };
  };
  const R = rayons ? [rayon(hp, C.r1, 'a', 2), rayon(-hp, C.r1, 'b', 2), rayon(0, C.r2, 'c', 2)] : [];
  const yh = R.length ? R[0].yRet : 0, yb2 = R.length ? R[1].yRet : 0;
  const fk = !compact && large === 700 && etroit() ? 2.1 : 1, fs = (compact ? 10.5 : 12.5) * fk;
  return (
    <svg viewBox={`0 0 ${large} ${haut}`} role="img" aria-label={label || `Œil réduit : lentille convergente de distance focale ${fr(fe)} mm, rétine à ${fr(M.L_OEIL)} mm, objet ${inf ? 'à l’infini' : `à ${fr(D, 0)} cm`}`}
      style={{ width: '100%', maxWidth: large === 700 ? 'none' : 380, height: 'auto', display: 'block', margin: large === 700 ? 0 : '6px auto', background: '#fff', border: large === 700 ? '1.5px solid #cbd5e1' : 'none', borderRadius: 10 }}>
      <line x1="8" y1={y0} x2={large - 8} y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="8 4"/>
      <FormeOeil xL={xL} y0={y0} k={k} fe={fe}/>
      {R.map(r => r.g)}
      {lum && <CouchePhotons chemins={R.map(r => ({ c: r.c, pts: r.pts }))} lum={{ ...lum, k: !compact && large === 700 && etroit() ? 1.8 : 1 }}/>}
      {rayons && !nette && <line x1={XR + 3} y1={Y(yh)} x2={XR + 3} y2={Y(yb2)} stroke={C.flou} strokeWidth="5" opacity="0.75"/>}
      {rayons && nette && <g><line x1={XR + 3} y1={y0} x2={XR + 3} y2={Y(yBp)} stroke={C.img} strokeWidth="3.5"/>{fl(XR + 3, Y(yBp), yBp < 0 ? 90 : -90, C.img, 5)}</g>}
      {rayons && OAp > 0 && X(OAp) < large - 6 && !compact && <circle cx={X(OAp)} cy={Y(yBp)} r="3.2" fill={nette ? C.img : C.flou}/>}
      {/* foyer image F′ : sur la rétine pour l'œil au repos */}
      <g fontSize={fs} fontWeight="800" fill={C.foyer}><circle cx={X(fe)} cy={y0} r="4" fill={C.foyer} stroke="#fff" strokeWidth="1.2"/><text x={X(fe) + 7} y={y0 + (compact ? 22 : 24)} textAnchor="start">F′</text></g>
      {/* objet (hors échelle) */}
      <g>
        {!inf && <><line x1="34" y1={y0} x2="34" y2={y0 - 54} stroke={C.obj} strokeWidth="4"/>{fl(34, y0 - 56, -90, C.obj, 7)}
          <text x="34" y={y0 + 16} textAnchor="middle" fontSize={fs} fontWeight="800" fill={C.obj}>objet</text></>}
        {inf && <text x="14" y={y0 - 14} fontSize={fs} fontWeight="800" fill={C.obj}>objet à l’infini</text>}
        <g stroke="#475569" strokeWidth="2"><line x1={xL - (compact ? 118 : 215)} y1={y0 - 7} x2={xL - (compact ? 106 : 203)} y2={y0 + 7}/><line x1={xL - (compact ? 112 : 209)} y1={y0 - 7} x2={xL - (compact ? 100 : 197)} y2={y0 + 7}/></g>
        <rect x={xL - (compact ? 116 : 213)} y={y0 - 3} width="14" height="6" fill="#fff" opacity="0.0"/>
        <text x={xL - (compact ? 109 : 206)} y={y0 + 24} textAnchor="middle" fontSize={fs - 1} fill={C.txt} fontWeight="700">{inf ? 'très loin' : `D = ${fr(D, D % 1 ? 1 : 0)}${NB}cm`}</text>
        {!compact && fk === 1 && <text x={xL - 206} y={y0 + 38} textAnchor="middle" fontSize={10.5 * fk} fill="#64748b">(distance et taille non à l’échelle)</text>}
      </g>
      {/* légendes de l'œil */}
      {etiquettes && <g fontSize={fs} fontWeight="700" fill={C.txt}>
        <text x={xL} y={y0 - 4.6 * k - 8} textAnchor="middle" fill={C.lent}>{compact || fk > 1 ? 'cristallin' : 'cristallin + cornée = lentille convergente'}</text>
        <text x={XR + 8} y={y0 - 6.4 * k - 8} textAnchor="middle" fill={C.ret}>rétine</text>
        <line x1={xL} y1={y0 + 8.4 * k} x2={XR} y2={y0 + 8.4 * k} stroke={C.txt} strokeWidth="1.3"/><line x1={xL} y1={y0 + 8.4 * k - 4} x2={xL} y2={y0 + 8.4 * k + 4} stroke={C.txt}/><line x1={XR} y1={y0 + 8.4 * k - 4} x2={XR} y2={y0 + 8.4 * k + 4} stroke={C.txt}/>
        <text x={(xL + XR) / 2} y={y0 + 8.4 * k + 16 * fk} textAnchor="middle">{`L = ${fr(M.L_OEIL)}${NB}mm`}</text>
        <text x={xL} y={y0 + 8.4 * k + 16 * fk + (compact ? 14 : 16 * fk)} textAnchor="middle" fill={C.lent}>{`f′ = ${fr(fe, 2)}${NB}mm`}</text>
        {!nette && rayons && <text x={fk > 1 ? large - 8 : XR + 10} textAnchor={fk > 1 ? 'end' : 'start'} y={y0 + 6.4 * k + 4 + (fk > 1 ? 14 : 0)} fill={C.flou} fontSize={fs} fontWeight="800">image floue</text>}
        {nette && rayons && <text x={fk > 1 ? large - 8 : XR + 10} textAnchor={fk > 1 ? 'end' : 'start'} y={y0 + 6.4 * k + 4 + (fk > 1 ? 14 : 0)} fill={C.img} fontSize={fs} fontWeight="800">image nette</text>}
      </g>}
      {/* zoom sur la rétine : ce qu'on y verrait en la regardant de face (tache nette ou floue) */}
      {rayons && !compact && large === 700 && (() => {
        const sp = Math.abs(yh - yb2), bw = fk > 1 ? 300 : 230, bh = fk > 1 ? 150 : 104, cx = 10 + bw - bh / 2 - 6, cy = 10 + bh / 2, R0 = bh / 2 - 8;
        const r = nette ? 7 : Math.max(14, Math.min(R0 - 2, 12 + sp * 55));
        return (<g>
          <rect x="10" y="10" width={bw} height={bh} rx="10" fill="#fffbeb" stroke={C.ret} strokeWidth="1.4"/>
          <text x="20" y={10 + 16 * fk} fontSize={fs - 1} fontWeight="800" fill={C.ret}>zoom rétine</text>
          <text x="20" y={10 + 36 * fk} fontSize={fs} fontWeight="800" fill={nette ? C.img : C.flou}>{nette ? 'point net' : 'tache floue'}</text>
          <circle cx={cx} cy={cy} r={R0} fill="#fef3c7" stroke={C.ret} strokeWidth="1.5"/>
          <defs><radialGradient id={'flouRet' + (nette ? 'n' : 'f')}><stop offset="0%" stopColor={C.flou} stopOpacity="0.85"/><stop offset="100%" stopColor={C.flou} stopOpacity="0.05"/></radialGradient></defs>
          {nette ? <circle cx={cx} cy={cy} r={r} fill={C.img} stroke="#fff" strokeWidth="1.5"/> : <circle cx={cx} cy={cy} r={r} fill="url(#flouRetf)"/>}
        </g>);
      })()}
    </svg>);
}

// ────────────────────────── Diamètre apparent ──────────────────────────
// Un objet AB (hauteur agrandie à l'écran) vu depuis l'œil à la distance D ; objet fantôme facultatif à 25 cm.
export function SchemaAngle({ D = 50, AB = 2, fantome = false, label, large = 700, haut: hautProp = 230, texte = true, sc: scProp, nomAB, lum = null, poignee = null, refSvg = null }) {
  const haut = hautProp + (poignee ? 50 : 0);
  const xe = large - (large === 700 ? 100 : 62), y0 = haut / 2 + 6, sc = scProp || (large === 700 ? Math.min(3.4, 520 / Math.max(D, 25)) : (large - 200) / 300), ha = Math.min(large === 700 ? 95 : 44, Math.max(14, AB * 18));
  const xo = xe - sc * D, th = M.diametreApproche(AB, D);
  const arc = (xo2, c) => { const a = Math.atan2(ha, xe - xo2), r = 56; return <path d={`M${xe - r},${y0} A${r},${r} 0 0 1 ${xe - r * Math.cos(a)},${y0 - r * Math.sin(a)}`} fill="none" stroke={c} strokeWidth="2"/>; };
  const fk = large === 700 && etroit() ? 2.1 : 1, fs = (large === 700 ? 12.5 : 10.5) * fk;
  const objet = (x, c, nom, dash, dy = 0) => (
    <g>
      <line x1={xe} y1={y0} x2={x} y2={y0 - ha} stroke={c} strokeWidth="1.8" strokeDasharray={dash}/>
      <line x1={xe} y1={y0} x2={x} y2={y0} stroke={c} strokeWidth="1.2" strokeDasharray="3 3"/>
      <line x1={x} y1={y0} x2={x} y2={y0 - ha + 6} stroke={c} strokeWidth="4"/>{fl(x, y0 - ha, -90, c, 7)}
      <text x={x} y={y0 + 16 + dy} textAnchor="middle" fontSize={fs} fontWeight="800" fill={c}>{nom}</text>
      {nomAB && c === C.obj && <text x={x} y={y0 - ha - 12} textAnchor="middle" fontSize={fs} fontWeight="800" fill={c}>{nomAB}</text>}
    </g>);
  return (
    <svg ref={refSvg} viewBox={`0 0 ${large} ${haut}`} role="img" aria-label={label || `Un objet de hauteur ${fr(AB)} cm vu à ${fr(D, 0)} cm : le diamètre apparent est l’angle θ entre les deux rayons issus des extrémités de l’objet et arrivant dans l’œil`}
      style={{ width: '100%', maxWidth: large === 700 ? 'none' : 380, height: 'auto', display: 'block', margin: large === 700 ? 0 : '6px auto', background: '#fff', border: large === 700 ? '1.5px solid #cbd5e1' : 'none', borderRadius: 10 }}>
      <line x1="8" y1={y0} x2={large - 8} y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="8 4"/>
      {fantome && D !== 25 && objet(xe - sc * 25, '#94a3b8', `à 25${NB}cm`, '5 3', fs + 6)}
      {objet(xo, C.obj, `D = ${fr(D, 0)}${NB}cm`)}
      {arc(xo, C.theta)}
      <text x={xe - 66} y={y0 - 5} textAnchor="end" fontSize={fs + 2} fontWeight="800" fill={C.theta}>θ</text>
      <FormeOeil xL={xe} y0={y0} k={large === 700 ? 4.6 : 3.4} fe={M.L_OEIL}/>
      <text x={xe + 6} y={y0 - 6.8 * (large === 700 ? 4.6 : 3.4) - 6} textAnchor="middle" fontSize={fs} fontWeight="800" fill={C.txt}>œil</text>
      {lum && <CouchePhotons chemins={[{ c: C.theta, pts: [[xo, y0 - ha], [xe, y0]] }, { c: C.obj, pts: [[xo, y0], [xe, y0]] }]} lum={{ ...lum, impact: false, k: fk > 1 ? 1.8 : 1 }}/>}
      {poignee && <Poignee x={xo} y={y0 + (fk > 1 ? 82 : 62)} g={fk > 1 ? 1.9 : 1} coul={C.obj} label="Objet : distance D à l’œil (en cm)" valeur={D} vmin={poignee.vmin} vmax={poignee.vmax} texte={`${fr(D, 0)} cm`} touche={poignee.touche} onToucher={poignee.onToucher} pas={5}
        lire={e => { const r = refSvg.current.getBoundingClientRect(); return (xe - (e.clientX - r.left) * large / r.width) / sc; }} set={poignee.set} zones={[[xo - 24 * (fk > 1 ? 1.9 : 1), y0 - ha - 10, 48 * (fk > 1 ? 1.9 : 1), ha + 30]]}/>}
      {texte && <text x="12" y="18" fontSize={fs} fill="#64748b" fontWeight="700">échelle verticale agrandie</text>}
      {texte && <text x="12" y={haut - 10} fontSize={fs + 1} fontWeight="800" fill={C.theta}>{`θ ≈ AB / D = ${fr(AB * 10, AB * 10 < 1 ? 2 : 0)}${NB}mm ÷ ${fr(D * 10, 0)}${NB}mm = ${fr(th * 1000, th * 1000 < 1 ? 2 : 0)}${NB}mrad`}</text>}
    </svg>);
}

// ────────────────────────── Loupe : banc d'optique + œil derrière la loupe ──────────────────────────
const LARG = 700, HAUT = 330, KX = 22, X0 = 330, YA = 172, KY = 50;
const KO = 4.8;                                    // échelle de l'œil (px par mm) derrière la loupe
const px = x => X0 + KX * x, py = y => YA - KY * y;
export function SchemaLoupe({ d, f, AB = M.AB_LOUPE, rayons = true, foyers = true, etiquettes = true, theta = true, oeil = true, label, lum = null, poignee = null, refSvg = null }) {
  const HT = HAUT + (poignee ? 50 : 0);
  const fk = etroit() ? 2.1 : 1;
  const im = M.imageLoupe(d, f), R = M.rayonsLoupe(d, f, AB), e = 1.2;
  const oeilVisible = oeil && im.nature !== 'reelle';
  const inf = !isFinite(im.OAp), xEnd = e;
  const hImg = im.gamma * AB, virt = im.nature === 'virtuelle';
  const clamp = y => Math.max(-150, Math.min(150, y));
  const trace = (r, c, cle) => {
    if (!r) return null;
    const [B, Lp] = r.avant, yl = Lp[1], u = r.dir, pente = u[1] / u[0], xf = oeilVisible ? e - 0.35 : 17;
    return (<g key={cle}>
      <polyline points={`${px(B[0])},${py(B[1])} ${px(0)},${py(yl)} ${px(xf)},${py(yl + pente * xf)}`} fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
      {virt && !inf && <line x1={px(0)} y1={py(yl)} x2={px(Math.max(im.OAp, -14))} y2={py(yl + pente * Math.max(im.OAp, -14))} stroke={c} strokeWidth="1.8" strokeDasharray="5 4"/>}
    </g>);
  };
  const aff = !inf && px(im.OAp) > 8 && px(im.OAp) < LARG - 8;
  return (
    <svg ref={refSvg} viewBox={`0 0 ${LARG} ${HT}`} width="100%" role="img" aria-label={label || `Loupe de distance focale ${fr(f)} cm, objet à ${fr(d)} cm de la loupe, œil juste derrière la loupe`}
      style={{ display: 'block', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 10 }}>
      <line x1="8" y1={YA} x2={LARG - 8} y2={YA} stroke="#0f172a" strokeWidth="1.4" strokeDasharray="10 5"/>
      {rayons && <g>{trace(R.r1, C.r1, 'r1')}{trace(R.r2, C.r2, 'r2')}</g>}
      {lum && rayons && <CouchePhotons chemins={[[R.r1, C.r1], [R.r2, C.r2]].filter(([r]) => r).map(([r, c]) => { const [B, Lp] = r.avant, pente = r.dir[1] / r.dir[0], xf = oeilVisible ? e - 0.35 : 17; return { c, pts: [[px(B[0]), py(B[1])], [px(0), py(Lp[1])], [px(xf), py(Lp[1] + pente * xf)]] }; })} lum={{ ...lum, impact: false, k: fk > 1 ? 1.8 : 1 }}/>}
      {/* loupe */}
      <line x1={px(0)} y1={YA - 135} x2={px(0)} y2={YA + 135} stroke={C.lent} strokeWidth="4.5"/>
      <polygon points={`${px(0)},${YA - 142} ${px(0) - 8},${YA - 124} ${px(0) + 8},${YA - 124}`} fill={C.lent}/><polygon points={`${px(0)},${YA + 142} ${px(0) - 8},${YA + 124} ${px(0) + 8},${YA + 124}`} fill={C.lent}/>
      <circle cx={px(0)} cy={YA} r="3.5" fill="#0f172a"/><text x={px(0) - 8} y={YA + 20} textAnchor="end" fontSize={13.5 * fk} fontWeight="800" fill="#0f172a">O</text>
      <text x={px(0)} y="20" textAnchor="middle" fontSize={13 * fk} fontWeight="800" fill={C.lent}>loupe</text>
      {foyers && <g fontSize={14 * fk} fontWeight="800" fill={C.foyer}>
        <circle cx={px(f)} cy={YA} r="5.5" fill={C.foyer} stroke="#fff" strokeWidth="1.5"/><text x={px(f)} y={YA + 22} textAnchor="middle">F′</text>
        <circle cx={px(-f)} cy={YA} r="5.5" fill="#fff" stroke={C.foyer} strokeWidth="2.5"/><text x={px(-f)} y={YA + 22} textAnchor="middle">F</text></g>}
      {/* objet */}
      <line x1={px(-d)} y1={YA} x2={px(-d)} y2={py(AB) + 6} stroke={C.obj} strokeWidth="4"/>{fl(px(-d), py(AB), -90, C.obj, 8)}
      {etiquettes && <g fontSize={13.5 * fk} fontWeight="800" fill={C.obj}><text x={px(-d) - 6} y={py(AB) - 4} textAnchor="end">B</text><text x={px(-d) - 6} y={YA + 18} textAnchor="end">A</text></g>}
      {/* image */}
      {rayons && aff && <g>
        <line x1={px(im.OAp)} y1={YA} x2={px(im.OAp)} y2={YA - clamp(hImg * KY)} stroke={C.img} strokeWidth="3.5" strokeDasharray={virt ? '6 4' : undefined}/>{fl(px(im.OAp), YA - clamp(hImg * KY), hImg > 0 ? -90 : 90, C.img, 8)}
        <text x={px(im.OAp)} y={YA - clamp(hImg * KY) + (hImg > 0 ? -18 : 28)} textAnchor="middle" fontSize={12.5 * fk} fontWeight="700" fill={C.img}>{virt ? 'image virtuelle' : 'image réelle'}</text></g>}
      {inf && rayons && <text x={px(0) + 14} y={YA + 96} fontSize={13 * fk} fontWeight="800" fill={C.img}>{fk > 1 ? 'image à l’infini' : 'rayons parallèles : image à l’infini'}</text>}
      {rayons && !inf && virt && !aff && <text x="12" y="44" fontSize={13 * fk} fontWeight="800" fill={C.img}>{fk > 1 ? `image à ${fr(-im.OAp, 0)} cm` : `image virtuelle à ${fr(-im.OAp)} cm (hors cadre)`}</text>}
      {/* œil juste derrière la loupe */}
      {oeilVisible && <g>
        <FormeOeil xL={px(e)} y0={YA} k={KO} fe={M.L_OEIL}/>
        <text x={px(e) + 6 * KO} y={YA - 8.2 * KO - 6} textAnchor="middle" fontSize={12.5 * fk} fontWeight="800" fill={C.txt}>œil</text>
        {theta && rayons && (() => {
          const s = AB / d, L1 = 150;
          return (<g>
            <line x1={px(e)} y1={YA} x2={px(e) - L1} y2={YA - s * KY * L1 / KX} stroke={C.theta} strokeWidth="1.8" strokeDasharray="2 3"/>
            <g stroke={C.theta} strokeWidth="1.7" fill="none" opacity="0.85">
              <line x1={px(e)} y1={YA - 2.4 * KO} x2={px(e) + M.L_OEIL * KO} y2={YA + M.L_OEIL * KO * M.thetaPrime(AB, d)}/>
              <line x1={px(e)} y1={YA + 2.4 * KO} x2={px(e) + M.L_OEIL * KO} y2={YA + M.L_OEIL * KO * M.thetaPrime(AB, d)}/>
            </g>
            <circle cx={px(e) + M.L_OEIL * KO} cy={YA + M.L_OEIL * KO * M.thetaPrime(AB, d)} r="4.2" fill={C.img} stroke="#fff" strokeWidth="1.2"/>
            <text x={px(e) + 30} y={YA + 7.8 * KO + 20 * fk} textAnchor="start" fontSize={13.5 * fk} fontWeight="800" fill={C.theta}>{`θ′ ≈ ${fr(M.thetaPrime(AB, d) * 1000, 0)}${NB}mrad`}</text>
          </g>);
        })()}
        {theta && rayons && (() => {
          const KZ = 4.6, bx = 410, by = 4, bw = 282, bh = 118, xl = bx + 84, y0 = by + 64, XRz = xl + M.L_OEIL * KZ, yr = y0 + M.L_OEIL * KZ * M.thetaPrime(AB, d);
          return (<g>
            <rect x={bx} y={by} width={bw} height={bh} rx="10" fill="#fff" stroke={C.ret} strokeWidth="1.4"/>
            <text x={bx + 10} y={by + 13 * fk} fontSize={11.5 * fk} fontWeight="800" fill={C.ret}>zoom</text>
            <FormeOeil xL={xl} y0={y0} k={KZ} fe={M.L_OEIL}/>
            <g stroke={C.theta} strokeWidth="2" opacity="0.9"><line x1={xl - 60} y1={y0 - 2.4 * KZ + 60 * M.thetaPrime(AB, d)} x2={xl} y2={y0 - 2.4 * KZ}/><line x1={xl - 60} y1={y0 + 2.4 * KZ + 60 * M.thetaPrime(AB, d)} x2={xl} y2={y0 + 2.4 * KZ}/>
              <line x1={xl} y1={y0 - 2.4 * KZ} x2={XRz} y2={yr}/><line x1={xl} y1={y0 + 2.4 * KZ} x2={XRz} y2={yr}/></g>
            <circle cx={XRz} cy={yr} r="5" fill={C.img} stroke="#fff" strokeWidth="1.3"/>
            <text x={XRz + 10} y={yr + 5 * fk} fontSize={11.5 * fk} fontWeight="800" fill={C.img}>image</text>
          </g>);
        })()}
      </g>}
      {poignee && <Poignee x={px(-d)} y={YA + (fk > 1 ? 140 : 122)} g={fk > 1 ? 1.9 : 1} coul={C.obj} label="Objet : position OA sur l’axe (en cm)" valeur={-d} vmin={-M.DL_MAX} vmax={-M.DL_MIN} texte={`OA = −${fr(d)} cm`} touche={poignee.touche} onToucher={poignee.onToucher} pas={0.5}
        lire={e => { const r = refSvg.current.getBoundingClientRect(); return (((e.clientX - r.left) * LARG / r.width) - X0) / KX; }} set={poignee.set} zones={[[px(-d) - 30 * (fk > 1 ? 1.9 : 1), YA - 80, 60 * (fk > 1 ? 1.9 : 1), 100]]}/>}
      <text x="12" y={HT - 10} fontSize={11.5 * fk} fontWeight="700" fill="#64748b">{fk > 1 ? 'échelle verticale agrandie' : 'échelle verticale agrandie · F, F′ : foyers de la loupe · œil contre la loupe'}</text>
    </svg>);
}
