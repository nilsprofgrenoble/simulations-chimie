// Scènes et schémas de la simulation 200 « L'œil réduit : une lentille et un écran » (2GT).
// RÈGLES : tous les rayons viennent de oeilReduit2gtModele.js (rayons()) : aucun tracé dessiné à la main ; l'œil est à l'échelle (1 mm = 13 unités) ;
// l'objet (arbre, bougie) et sa distance ne sont PAS à l'échelle (annoncé sur le schéma) ; texte ≥ 18 (viewBox de 480) ou ≥ 13,5 (viewBox de 300) ;
// code visuel constant : rayon par O = orange, rayons du bord de la pupille = bleu, objet = flèche noire, image = flèche verte, lentille = trait bleu à pointes
// vers l'extérieur, rétine = trait épais brun, tache floue = rouge. Les rayons sont fléchés au milieu de chaque trajet.
import * as M from "./oeilReduit2gtModele";

import { C } from "./oeilReduit2gtCouleurs";
const NB = M.NB;
const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
const T = ({ x, y, ang, c, t = 7 }) => <polygon points={`0,0 ${-2 * t},${-0.8 * t} ${-2 * t},${0.8 * t}`} fill={c} transform={`translate(${x},${y}) rotate(${ang})`} />;
// Segment fléché au milieu de son trajet (sens p → q)
function Seg({ p, q, c, w = 2.6, dash, fleche = true, t = 7 }) {
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, mx = (p[0] + q[0]) / 2 + ux * t, my = (p[1] + q[1]) / 2 + uy * t;
  return <g><line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={c} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />
    {fleche && l > 4 * t && <T x={mx} y={my} ang={Math.atan2(dy, dx) * 180 / Math.PI} c={c} t={t} />}</g>;
}
const Txt = ({ x, y, children, s = 18, c = C.txt, a = 'middle', w = 700 }) => <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={c}>{children}</text>;
const FlecheObjet = ({ x, yBas, yHaut, c, w = 4, label = null, labelBas = null, s = 18, halo = false }) => (
  <g>{halo && <line x1={x} y1={yBas} x2={x} y2={yHaut + 8} stroke="white" strokeWidth={w + 5} />}<line x1={x} y1={yBas} x2={x} y2={yHaut + 8} stroke={c} strokeWidth={w} /><T x={x} y={yHaut} ang={-90} c={c} t={8} />
    {label && <Txt x={x} y={yHaut - 8} c={c} s={s}>{label}</Txt>}{labelBas && <Txt x={x} y={yBas + 22} c={c} s={s}>{labelBas}</Txt>}</g>);

// ───────────────────────── L'œil réel (coupe) : coordonnées locales 0..200 × 0..180, centre de l'œil en (125, 90) ─────────────────────────
// ancres (coordonnées locales) pour les étiquettes : cornée (58, 71), pupille (90, 90), cristallin (104, 66), rétine (180, 64)
const ANCRES_OEIL = { cornee: [58, 71], pupille: [90, 90], cristallin: [104, 66], retine: [180, 64] };
export function OeilReel({ x = 0, y = 0, s = 1, retine = true }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M76.1,51.8 A62,62 0 1 1 76.1,128.2 Q27.9,90 76.1,51.8 Z" fill="#f1f5f9" stroke="none" />
      <path d="M76.1,51.8 A62,62 0 1 1 76.1,128.2" fill="none" stroke="#64748b" strokeWidth={3 / Math.max(s, 0.5)} strokeLinecap="round" />
      <path d="M76.1,128.2 Q27.9,90 76.1,51.8 Z" fill="#e0f2fe" stroke="none" />
      <path d="M76.1,128.2 Q27.9,90 76.1,51.8" fill="none" stroke={C.lent} strokeWidth={3.4 / Math.max(s, 0.5)} strokeLinecap="round" />
      <rect x="86" y="42" width="7" height="30" fill={C.iris} /><rect x="86" y="108" width="7" height="30" fill={C.iris} />
      <ellipse cx="104" cy="90" rx="8" ry="24" fill="#bae6fd" stroke={C.lent} strokeWidth={2.6 / Math.max(s, 0.5)} />
      {retine && <path d="M163.9,43.7 A60.5,60.5 0 0 1 163.9,136.3" fill="none" stroke={C.ret} strokeWidth={6 / Math.max(s, 0.6)} strokeLinecap="round" />}
    </g>);
}
const pt = (x, y, s, a) => [x + a[0] * s, y + a[1] * s];

// Étiquette avec trait de repère
const Etiq = ({ x, y, a = 'middle', de, vers, c = C.txt, children }) => (
  <g>{de && <line x1={de[0]} y1={de[1]} x2={vers[0]} y2={vers[1]} stroke={c} strokeWidth="1.8" />}{vers && <circle cx={vers[0]} cy={vers[1]} r="3" fill={c} />}<Txt x={x} y={y} a={a} c={c}>{children}</Txt></g>);

// ───────────────────────── Étape 1 : les parties de l'œil ─────────────────────────
export function SceneOeilReel({ fond = '?' }) {
  const s = 1.55, ox = 76, oy = -4.5, A = k => pt(ox, oy, s, ANCRES_OEIL[k]);
  const co = A('cornee'), pu = A('pupille'), cr = A('cristallin'), re = A('retine');
  return (
    <svg viewBox="0 0 480 270" style={stl()} role="img" aria-label="Coupe de l’œil : la cornée à l’avant, la pupille au centre, le cristallin derrière la pupille, et au fond de l’œil une couche épaisse brune dont le nom est à trouver.">
      <OeilReel x={ox} y={oy} s={s} />
      <Etiq x={112} y={62} a="middle" de={[126, 70]} vers={co} c={C.lent}>cornée</Etiq>
      <Etiq x={106} y={232} a="middle" de={[136, 216]} vers={pu}>pupille</Etiq>
      <Etiq x={238} y={30} a="middle" de={[238, 38]} vers={cr} c={C.lent}>cristallin</Etiq>
      <Etiq x={414} y={96} a="middle" de={[400, 104]} vers={re} c={C.ret}>{fond}</Etiq>
    </svg>);
}

// ───────────────────────── Étape 2 : œil réel → œil réduit ─────────────────────────
export function SceneModele({ lentille = '?', ecran = 'écran' }) {
  const s = 1.0, ox = -8, oy = 14;
  return (
    <svg viewBox="0 0 480 270" style={stl()} role="img" aria-label="À gauche, l’œil réel avec la cornée et le cristallin en bleu et la rétine en brun. À droite, l’œil réduit : un objet bleu à identifier à la place de la cornée et du cristallin, et un écran brun à la place de la rétine, à 17 millimètres derrière.">
      <OeilReel x={ox} y={oy} s={s} />
      <Txt x={110} y={216} c={C.encre}>œil réel</Txt>
      <line x1="196" y1="104" x2="262" y2="104" stroke={C.txt} strokeWidth="3" /><T x={274} y={104} ang={0} c={C.txt} t={9} />
      <Txt x={236} y={90} c={C.txt}>modèle</Txt>
      <path d="M318,56 C334,46 380,46 410,64 L410,150 C380,168 334,164 318,154 Z" fill="#f8fafc" stroke={C.axe} strokeWidth="2" />
      <line x1="300" y1="104" x2="468" y2="104" stroke={C.axe} strokeWidth="1.4" strokeDasharray="8 5" />
      <line x1="318" y1="64" x2="318" y2="144" stroke={C.lent} strokeWidth="4" /><polygon points="318,50 311,64 325,64" fill={C.lent} /><polygon points="318,158 311,144 325,144" fill={C.lent} />
      <line x1="410" y1="58" x2="410" y2="150" stroke={C.ret} strokeWidth="7" />
      <Txt x={318} y={32} c={C.lent}>{lentille}</Txt><Txt x={412} y={32} c={C.ret}>{ecran}</Txt>
      <line x1="318" y1="184" x2="410" y2="184" stroke={C.txt} strokeWidth="1.8" /><line x1="318" y1="177" x2="318" y2="191" stroke={C.txt} strokeWidth="1.8" /><line x1="410" y1="177" x2="410" y2="191" stroke={C.txt} strokeWidth="1.8" />
      <Txt x={364} y={210} c={C.txt}>17{NB}mm</Txt>
      <Txt x={364} y={254} c={C.encre}>œil réduit</Txt>
    </svg>);
}

// ───────────────────────── Objets (arbre, bougie) : pas à l'échelle ─────────────────────────
function Objet({ type, y0 }) {
  return (
    <g>
      {type === 'arbre' ? <g>
        <rect x="52" y={y0 - 30} width="9" height="30" fill="#92400e" />
        <circle cx="56" cy={y0 - 56} r="22" fill="#d9f99d" stroke="#4d7c0f" strokeWidth="2.5" /><circle cx="41" cy={y0 - 42} r="15" fill="#d9f99d" stroke="#4d7c0f" strokeWidth="2.5" /><circle cx="71" cy={y0 - 42} r="15" fill="#d9f99d" stroke="#4d7c0f" strokeWidth="2.5" />
        <rect x="53" y={y0 - 52} width="7" height="20" fill="#d9f99d" /></g>
        : <g>
          <rect x="46" y={y0 - 44} width="20" height="44" rx="2" fill="#fef9c3" stroke="#a16207" strokeWidth="2.5" /><rect x="55" y={y0 - 52} width="2.5" height="9" fill={C.obj} />
          <path d={`M56,${y0 - 80} C67,${y0 - 64} 65,${y0 - 54} 56,${y0 - 51} C47,${y0 - 54} 45,${y0 - 64} 56,${y0 - 80} Z`} fill="#fb923c" stroke="#c2410c" strokeWidth="2" /></g>}
    </g>);
}

// ───────────────────────── La scène principale : œil réduit à l'échelle, rayons calculés ─────────────────────────
// vue : { centre, haut, bas } avec null (absent), 'avant' (jusqu'à la lentille) ou 'tout' ; image : dessiner la flèche image (si nette) ou la tache (si floue) ;
// etiq : { lentille, retine, O, F, AB, ABp, zoom } ; f : focale (mm) ; L : distance lentille–rétine (mm) ; zoom : encadré agrandi de la rétine (montre où les rayons se rejoignent)
export function SceneOeil({ situ, f = M.F_REPOS, L = M.L_OEIL, vue = { centre: 'tout', haut: 'tout', bas: 'tout' }, image = true, etiq = {}, cadreDistance = true, label }) {
  const K = 13, XL = 215, Y0 = 150, XS = 112, W = 480, zoom = !!etiq.zoom, H = zoom ? 404 : 296;
  const X = x => XL + K * x, Y = y => Y0 - K * y, XR = X(L);
  const ob = M.OBJETS[situ.objet], R = M.rayons(ob.AB, situ.D, f, L), nette = M.netteRetine(situ.D, f, L);
  const xsMm = (XS - XL) / K, lib = typeof etiq.lentille === 'string' ? etiq.lentille : null;
  const ray = r => ({ centre: C.centre, haut: C.bord, bas: C.bord })[r.id];
  const tous = ['haut', 'bas', 'centre'].map(id => R.liste.find(r => r.id === id));
  const bordsTous = vue.haut === 'tout' && vue.bas === 'tout';
  const rH = R.liste.find(r => r.id === 'haut'), rB = R.liste.find(r => r.id === 'bas');
  const yHaut = M.impactRetine(rH, L), yBas = M.impactRetine(rB, L);
  const bpx = R.OAp > L && R.OAp <= 19.4;
  // encadré agrandi : la rétine au centre-gauche, 80 unités par mm (soit environ 6 fois l’échelle du schéma)
  const KZ = 80, BX = 236, BY = 304, BW = 240, BH = 96, xz0 = L - 1.4, yc = R.Bp[1];
  const Xz = x => BX + (x - xz0) * KZ, Yz = y => BY + BH / 2 - (y - yc) * KZ;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl()} role="img" aria-label={label || `Œil réduit à l’échelle : lentille de distance focale ${M.nombreFR(f)} millimètres, rétine à ${M.nombreFR(L)} millimètres. ${ob.nom} à ${M.distanceTexte(situ.D)} (objet et distance pas à l’échelle). ${nette ? 'L’image est nette sur la rétine.' : 'L’image est floue sur la rétine.'}`}>
      {/* axe optique interrompu */}
      <line x1="6" y1={Y0} x2="74" y2={Y0} stroke={C.axe} strokeWidth="1.5" strokeDasharray="8 5" /><line x1="104" y1={Y0} x2={W - 6} y2={Y0} stroke={C.axe} strokeWidth="1.5" strokeDasharray="8 5" />
      <g stroke={C.txt} strokeWidth="2"><line x1="80" y1={Y0 + 9} x2="88" y2={Y0 - 9} /><line x1="90" y1={Y0 + 9} x2="98" y2={Y0 - 9} /></g>
      <Objet type={situ.objet} y0={Y0} />
      <FlecheObjet x={56} yBas={Y0} yHaut={Y0 - 84} c={C.obj} halo label={etiq.AB === false ? null : 'B'} labelBas={etiq.AB === false ? null : 'A'} />
      {cadreDistance && <g><line x1="56" y1={Y0 + 62} x2={XL - 2} y2={Y0 + 62} stroke={C.txt} strokeWidth="1.8" /><line x1="56" y1={Y0 + 55} x2="56" y2={Y0 + 69} stroke={C.txt} strokeWidth="1.8" /><line x1={XL - 2} y1={Y0 + 55} x2={XL - 2} y2={Y0 + 69} stroke={C.txt} strokeWidth="1.8" />
        <Txt x={136} y={Y0 + 54} c={C.txt}>{M.distanceTexte(situ.D)}</Txt></g>}
      {/* œil à l'échelle */}
      <path d={`M${XL},${Y0 - 5.4 * K} C${XL + 5 * K},${Y0 - 8.6 * K} ${XR - 6 * K},${Y0 - 8 * K} ${XR},${Y0 - 6.5 * K} L${XR},${Y0 + 6.5 * K} C${XR - 6 * K},${Y0 + 8 * K} ${XL + 5 * K},${Y0 + 8.6 * K} ${XL},${Y0 + 5.4 * K}`} fill="#f8fafc" stroke={C.axe} strokeWidth="2" />
      <ellipse cx={XL} cy={Y0} rx={K * (0.6 + (17.6 - f) * 0.9)} ry={4.4 * K} fill="#bae6fd" opacity="0.6" />
      <rect x={XL + 5} y={Y0 - 5.7 * K} width="8" height={3.7 * K} fill={C.iris} /><rect x={XL + 5} y={Y0 + 2 * K} width="8" height={3.7 * K} fill={C.iris} />
      <line x1={XR} y1={Y0 - 6.5 * K} x2={XR} y2={Y0 + 6.5 * K} stroke={C.ret} strokeWidth="7" />
      {zoom && <rect x={X(xz0)} y={Y(yc) - (BH / KZ) * K / 2} width={3 * K} height={(BH / KZ) * K} fill="none" stroke={C.centre} strokeWidth="1.6" strokeDasharray="3 3" />}
      {/* rayons */}
      {tous.map(r => {
        const v = vue[r.id]; if (!v) return null;
        const c = ray(r), p0 = [XS, Y(r.yAvant(xsMm))], pl = [X(0), Y(r.yl)];
        return (<g key={r.id}><Seg p={p0} q={pl} c={c} />
          {v === 'tout' && <Seg p={pl} q={[XR, Y(r.yApres(L))]} c={c} />}
          {v === 'tout' && bpx && <line x1={XR} y1={Y(r.yApres(L))} x2={X(R.OAp)} y2={Y(R.Bp[1])} stroke={c} strokeWidth="2" strokeDasharray="4 4" opacity="0.85" />}
        </g>);
      })}
      {(vue.centre || vue.haut || vue.bas) && <g><line x1="68" y1={Y0 - 80} x2="96" y2={Y0 - 72} stroke={C.txt} strokeWidth="1.5" strokeDasharray="3 3" /><Txt x={100} y={Y0 - 70} a="start" c={C.txt}>{vue.haut || vue.bas ? 'rayons de B' : 'rayon de B'}</Txt>{situ.D >= 5000 && <Txt x={100} y={Y0 - 50} a="start" c={C.txt}>(très loin)</Txt>}</g>}
      {/* lentille : symbole standard (trait vertical, pointes vers l'extérieur) */}
      <line x1={XL} y1={Y0 - 5.9 * K} x2={XL} y2={Y0 + 5.9 * K} stroke={C.lent} strokeWidth="4" />
      <polygon points={`${XL},${Y0 - 6.5 * K - 6} ${XL - 7},${Y0 - 5.9 * K + 4} ${XL + 7},${Y0 - 5.9 * K + 4}`} fill={C.lent} /><polygon points={`${XL},${Y0 + 6.5 * K + 6} ${XL - 7},${Y0 + 5.9 * K - 4} ${XL + 7},${Y0 + 5.9 * K - 4}`} fill={C.lent} />
      <circle cx={XL} cy={Y0} r="3.5" fill={C.encre} />
      {/* image : flèche verte si nette ; tache rouge sinon */}
      {image && bordsTous && vue.centre === 'tout' && (nette
        ? <g><line x1={XR + 7} y1={Y0} x2={XR + 7} y2={Y(R.Bp[1]) - 6} stroke="white" strokeWidth="8" /><line x1={XR + 7} y1={Y0} x2={XR + 7} y2={Y(R.Bp[1]) - 6} stroke={C.img} strokeWidth="4" /><T x={XR + 7} y={Y(R.Bp[1])} ang={90} c={C.img} t={7} /></g>
        : <line x1={XR} y1={Y(yHaut)} x2={XR} y2={Y(yBas)} stroke={C.flou} strokeWidth="8" strokeLinecap="butt" />)}
      {image && etiq.ABp && nette && <g><Txt x={XR + 27} y={Y(R.Bp[1]) + 18} c={C.img}>B′</Txt><Txt x={XR + 27} y={Y0 - 8} c={C.img}>A′</Txt></g>}
      {/* F′ */}
      {etiq.F && <g><circle cx={X(f)} cy={Y0} r="5" fill={C.lent} stroke="white" strokeWidth="1.5" /><Txt x={X(f) - 10} y={Y0 - 12} a="end" c={C.lent}>F′</Txt></g>}
      {/* légendes */}
      {etiq.O !== false && <Txt x={XL + 9} y={Y0 + 20} a="start" c={C.encre}>O</Txt>}
      {lib !== null && <Txt x={XL} y={38} c={C.lent}>{lib}</Txt>}
      {etiq.retine !== false && <Txt x={Math.min(XR + 28, 474)} y={Y0 - 6.5 * K - 12} a="end" c={C.ret}>rétine</Txt>}
      <Txt x={12} y={290} a="start" s={18} c={C.txt}>objet et distance : pas à l’échelle</Txt>
      <g><line x1={W - 78} y1={266} x2={W - 13} y2={266} stroke={C.txt} strokeWidth="3" /><line x1={W - 78} y1={260} x2={W - 78} y2={272} stroke={C.txt} strokeWidth="2" /><line x1={W - 13} y1={260} x2={W - 13} y2={272} stroke={C.txt} strokeWidth="2" />
        <Txt x={W - 86} y={272} a="end" c={C.txt}>5{NB}mm</Txt></g>
      {/* encadré agrandi sur la rétine : montre où les rayons se rejoignent par rapport à la rétine */}
      {zoom && <g>
        <defs><clipPath id="oe-zoom"><rect x={BX} y={BY} width={BW} height={BH} rx="8" /></clipPath></defs>
        <rect x={BX} y={BY} width={BW} height={BH} rx="8" fill="#fffbeb" stroke={C.centre} strokeWidth="1.6" strokeDasharray="3 3" />
        <g clipPath="url(#oe-zoom)">
          <line x1={Xz(L)} y1={BY} x2={Xz(L)} y2={BY + BH} stroke={C.ret} strokeWidth="7" />
          {vue.haut === 'tout' && vue.bas === 'tout' && vue.centre === 'tout' && tous.map(r => {
            const c = ray(r), P = x => [Xz(x), Yz(r.yApres(x))];
            return (<g key={r.id}><Seg p={P(xz0)} q={P(L)} c={c} w={2.4} t={6} /><line x1={Xz(L)} y1={P(L)[1]} x2={Xz(xz0 + 3)} y2={P(xz0 + 3)[1]} stroke={c} strokeWidth="2" strokeDasharray="4 4" /></g>);
          })}
          {vue.haut === 'tout' && vue.bas === 'tout' && vue.centre === 'tout' && (nette
            ? <circle cx={Xz(L)} cy={Yz(yc)} r="4.5" fill={C.img} stroke="white" strokeWidth="1.5" />
            : <><line x1={Xz(L)} y1={Yz(yHaut)} x2={Xz(L)} y2={Yz(yBas)} stroke={C.flou} strokeWidth="8" /><circle cx={Xz(R.OAp)} cy={Yz(yc)} r="4.5" fill="white" stroke={C.txt} strokeWidth="2" /></>)}
        </g>
        <Txt x={12} y={BY + 22} a="start" c={C.centre}>zoom × 6</Txt><Txt x={12} y={BY + 44} a="start" c={C.centre}>sur la rétine</Txt><Txt x={12} y={BY + 68} a="start" c={C.txt}>pointillés :</Txt><Txt x={12} y={BY + 89} a="start" c={C.txt}>prolongement</Txt>
      </g>}
    </svg>);
}

// ───────────────────────── Étapes 6 : triangles et Thalès ─────────────────────────
// Schéma NON à l'échelle : le rayon qui passe par O est une droite, donc les deux triangles ont la même forme.
export function SceneThales({ AB = '6,0 m', OA = '50 m', OAp = '17 mm', ApBp = '?', image = true }) {
  const Y0 = 118, xA = 118, xO = 272, xAp = 380, hAB = 52, hAp = hAB * (xAp - xO) / (xO - xA);
  return (
    <svg viewBox="0 0 480 262" style={stl()} role="img" aria-label={`Deux triangles de même forme autour du centre O de la lentille : le triangle de l’objet (hauteur AB = ${AB}, distance OA = ${OA}) et le triangle de l’image (distance OA′ = ${OAp}, hauteur A′B′ à trouver). Schéma pas à l’échelle.`}>
      <polygon points={`${xA},${Y0} ${xA},${Y0 - hAB} ${xO},${Y0}`} fill="#ffedd5" opacity="0.8" />
      {image && <polygon points={`${xAp},${Y0} ${xAp},${Y0 + hAp} ${xO},${Y0}`} fill="#dcfce7" opacity="0.9" />}
      <line x1="10" y1={Y0} x2="470" y2={Y0} stroke={C.axe} strokeWidth="1.5" strokeDasharray="8 5" />
      <line x1={xO} y1={Y0 - 66} x2={xO} y2={Y0 + 66} stroke={C.lent} strokeWidth="4" /><polygon points={`${xO},${Y0 - 74} ${xO - 7},${Y0 - 62} ${xO + 7},${Y0 - 62}`} fill={C.lent} /><polygon points={`${xO},${Y0 + 74} ${xO - 7},${Y0 + 62} ${xO + 7},${Y0 + 62}`} fill={C.lent} />
      <Seg p={[xA, Y0 - hAB]} q={[xO, Y0]} c={C.centre} />
      {image && <Seg p={[xO, Y0]} q={[xAp, Y0 + hAp]} c={C.centre} />}
      <FlecheObjet x={xA} yBas={Y0} yHaut={Y0 - hAB} c={C.obj} />
      {image && <FlecheObjet x={xAp} yBas={Y0} yHaut={Y0 + hAp} c={C.img} />}
      <Txt x={xA - 12} y={Y0 - hAB + 4} a="end" c={C.obj}>B</Txt><Txt x={xA - 12} y={Y0 + 22} a="end" c={C.obj}>A</Txt>
      <Txt x={xO + 14} y={Y0 - 10} a="start" c={C.encre}>O</Txt>
      <Txt x={xAp + 14} y={Y0 - 10} a="start" c={C.img}>A′</Txt>
      {image && <Txt x={xAp + 14} y={Y0 + hAp + 26} a="start" c={C.img}>B′</Txt>}
      <Txt x={xA - 12} y={Y0 - hAB / 2 + 6} a="end" c={C.obj} s={18}>{`AB = ${AB}`}</Txt>
      {[[xA, xO, `OA = ${OA}`, C.obj], [xO, xAp, `OA′ = ${OAp}`, C.img]].map(([a, b, t, c], i) => (
        <g key={i}><line x1={a + 3} y1={Y0 + 80} x2={b - 3} y2={Y0 + 80} stroke={c} strokeWidth="2" /><line x1={a + 3} y1={Y0 + 74} x2={a + 3} y2={Y0 + 86} stroke={c} strokeWidth="2" /><line x1={b - 3} y1={Y0 + 74} x2={b - 3} y2={Y0 + 86} stroke={c} strokeWidth="2" />
          <Txt x={(a + b) / 2} y={Y0 + 108} c={c}>{t}</Txt></g>))}
      <Txt x={xAp + 14} y={Y0 + 24} a="start" c={C.img} s={18}>{`A′B′ = ${ApBp}`}</Txt>
      <Txt x={12} y={252} a="start" c={C.txt}>schéma pas à l’échelle</Txt>
    </svg>);
}

// ───────────────────────── Défi : l'œil et l'objet, sans rayons (pas de fuite de la réponse) ─────────────────────────
export function SceneDefiNette({ D, objet }) {
  return <SceneOeil situ={{ objet, D }} f={M.F_REPOS} vue={{ centre: null, haut: null, bas: null }} image={false} etiq={{ lentille: '' }} />;
}

// ───────────────────────── Cartes « À retenir » (viewBox 300, textes ≥ 13,5, maxWidth 320) ─────────────────────────
const cs = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Tc = ({ x, y, children, s = 14.5, c = C.encre, a = 'middle', w = 700 }) => <text x={x} y={y} textAnchor={a} fontSize={s} fontWeight={w} fill={c}>{children}</text>;
const Cadre = ({ y, h, c = '#15803d', fond = '#f0fdf4', children }) => (<g><rect x="6" y={y} width="288" height={h} rx="10" fill={fond} stroke={c} strokeWidth="1.5" />{children}</g>);

// Carte 1 : l'œil réduit = une lentille + un écran
export function FicheModele() {
  return (
    <svg viewBox="0 0 300 282" style={cs} role="img" aria-label="Œil réel à gauche (cornée et cristallin en bleu, rétine en brun) et œil réduit à droite : une lentille convergente en bleu à la place de la cornée et du cristallin, un écran brun à la place de la rétine, à 17 millimètres derrière la lentille.">
      <rect x="6" y="6" width="140" height="138" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" /><rect x="154" y="6" width="140" height="138" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <Tc x="76" y="26" s={14.5}>œil réel</Tc><Tc x="224" y="26" s={14.5}>œil réduit</Tc>
      <OeilReel x={-6} y={22} s={0.8} />
      <path d="M176,52 C186,46 214,46 258,56 L258,98 C214,108 186,104 176,98 Z" fill="#f1f5f9" stroke={C.axe} strokeWidth="1.5" />
      <line x1="170" y1="75" x2="290" y2="75" stroke={C.axe} strokeWidth="1.2" strokeDasharray="5 4" />
      <line x1="176" y1="52" x2="176" y2="98" stroke={C.lent} strokeWidth="3.5" /><polygon points="176,42 170,52 182,52" fill={C.lent} /><polygon points="176,108 170,98 182,98" fill={C.lent} />
      <line x1="258" y1="48" x2="258" y2="102" stroke={C.ret} strokeWidth="5.5" />
      <line x1="176" y1="118" x2="258" y2="118" stroke={C.txt} strokeWidth="1.5" /><line x1="176" y1="113" x2="176" y2="123" stroke={C.txt} strokeWidth="1.5" /><line x1="258" y1="113" x2="258" y2="123" stroke={C.txt} strokeWidth="1.5" />
      <Tc x="217" y="138" s={13.5} c={C.txt}>17{NB}mm</Tc>
      <Tc x="150" y="170" s={14.5} c={C.lent}>cornée + cristallin  →  lentille</Tc>
      <Tc x="150" y="192" s={14.5} c={C.ret}>rétine  →  écran</Tc>
      <Cadre y={206} h={70}>
        <Tc x="150" y="230" s={15.5} c="#15803d">Œil réduit :</Tc><Tc x="150" y="250" s={15.5} c="#15803d">une lentille convergente</Tc><Tc x="150" y="269" s={15.5} c="#15803d">+ un écran (la rétine)</Tc>
      </Cadre>
    </svg>);
}

// Faisceau issu d'un objet, tracé par le modèle (unités arbitraires = pixels) : lentille en xO, rétine à L derrière, axe en y0
function Trace({ xO, y0, AB, D, f, L, dp, vue = ['centre', 'haut', 'bas'], dashApres = false, depart = 60 }) {
  const R = M.rayons(AB, D, f, L, dp), x0 = -depart;
  return (<g>{vue.map(id => {
    const r = R.liste.find(q => q.id === id), c = id === 'centre' ? C.centre : C.bord, P = (x, y) => [xO + x, y0 - y];
    return (<g key={id}><Seg p={P(x0, r.yAvant(x0))} q={P(0, r.yl)} c={c} w={2.4} t={6} /><Seg p={P(0, r.yl)} q={P(L, r.yApres(L))} c={c} w={2.4} t={6} />
      {dashApres && R.OAp > L && <line x1={xO + L} y1={y0 - r.yApres(L)} x2={xO + R.OAp} y2={y0 - R.Bp[1]} stroke={c} strokeWidth="2" strokeDasharray="4 3" />}
      </g>);
  })}</g>);
}

// Carte 2 : image réelle et renversée
export function FicheRayons() {
  const xO = 150, y0 = 108, AB = 56, D = 120, L = 100, f = 1 / (1 / L + 1 / D), R = M.rayons(AB, D, f, L, 30);
  return (
    <svg viewBox="0 0 300 276" style={cs} role="img" aria-label="Schéma pas à l’échelle : un objet fléché, une lentille, une rétine. Le rayon orange qui passe par O n’est pas dévié ; les deux rayons bleus du bord de la pupille sont déviés. Les trois rayons se rejoignent sur la rétine : l’image, flèche verte, est renversée.">
      <line x1="6" y1={y0} x2="294" y2={y0} stroke={C.axe} strokeWidth="1.3" strokeDasharray="7 4" />
      <FlecheObjet x={xO - D} yBas={y0} yHaut={y0 - AB} c={C.obj} w={3.5} />
      <Tc x={xO - D - 12} y={y0 - AB + 6} a="end" s={14.5}>B</Tc>
      <line x1={xO} y1={y0 - 64} x2={xO} y2={y0 + 64} stroke={C.lent} strokeWidth="3.5" /><polygon points={`${xO},${y0 - 72} ${xO - 6},${y0 - 62} ${xO + 6},${y0 - 62}`} fill={C.lent} /><polygon points={`${xO},${y0 + 72} ${xO - 6},${y0 + 62} ${xO + 6},${y0 + 62}`} fill={C.lent} />
      <line x1={xO + L} y1={y0 - 62} x2={xO + L} y2={y0 + 62} stroke={C.ret} strokeWidth="5.5" />
      <Trace xO={xO} y0={y0} AB={AB} D={D} f={f} L={L} dp={60} depart={120} />
      <FlecheObjet x={xO + L + 9} yBas={y0} yHaut={y0 - R.Bp[1]} c={C.img} w={4.5} halo />
      <Tc x={xO + L + 21} y={y0 - R.Bp[1] + 8} a="start" c={C.img}>B′</Tc><Tc x={xO - 8} y={y0 - 12} a="end" s={14.5}>O</Tc>
      <Tc x={xO + L} y={y0 - 76} s={14.5} c={C.ret}>rétine</Tc>
      <Tc x="150" y="216" s={13.5} c={C.txt} w={400}>schéma pas à l’échelle</Tc>
      <g><line x1="14" y1="236" x2="40" y2="236" stroke={C.centre} strokeWidth="3" /><Tc x="46" y="241" a="start" s={13.5} c={C.centre}>par O</Tc>
        <line x1="116" y1="236" x2="142" y2="236" stroke={C.bord} strokeWidth="3" /><Tc x="148" y="241" a="start" s={13.5} c={C.bord}>bord de la pupille</Tc></g>
      <Tc x="150" y="268" s={14.5} c="#15803d">image réelle, renversée, sur la rétine</Tc>
    </svg>);
}

// Carte 3 : Thalès
export function FicheThales() {
  const Y0 = 98, xA = 38, xO = 150, xAp = 232, hAB = 56, hAp = hAB * (xAp - xO) / (xO - xA);
  return (
    <svg viewBox="0 0 300 246" style={cs} role="img" aria-label="Deux triangles de même forme autour de O : AB sur OA, et A′B′ sur OA′. Le rapport A′B′ sur AB est égal au rapport OA′ sur OA. Exemple : un poteau de 4,0 mètres à 20 mètres donne une image de 3,4 millimètres sur la rétine.">
      <polygon points={`${xA},${Y0} ${xA},${Y0 - hAB} ${xO},${Y0}`} fill="#ffedd5" /><polygon points={`${xAp},${Y0} ${xAp},${Y0 + hAp} ${xO},${Y0}`} fill="#dcfce7" />
      <line x1="6" y1={Y0} x2="294" y2={Y0} stroke={C.axe} strokeWidth="1.2" strokeDasharray="7 4" />
      <line x1={xO} y1={Y0 - 66} x2={xO} y2={Y0 + 66} stroke={C.lent} strokeWidth="3.5" />
      <Seg p={[xA, Y0 - hAB]} q={[xO, Y0]} c={C.centre} w={2.4} t={6} /><Seg p={[xO, Y0]} q={[xAp, Y0 + hAp]} c={C.centre} w={2.4} t={6} />
      <FlecheObjet x={xA} yBas={Y0} yHaut={Y0 - hAB} c={C.obj} w={3.5} /><FlecheObjet x={xAp} yBas={Y0} yHaut={Y0 + hAp} c={C.img} w={3.5} />
      <Tc x={xA - 8} y={Y0 - hAB + 8} a="end" s={14.5}>B</Tc><Tc x={xA - 4} y={Y0 + 18} s={14.5}>A</Tc><Tc x={xO + 8} y={Y0 - 8} a="start" s={14.5}>O</Tc>
      <Tc x={xAp + 12} y={Y0 + hAp + 12} a="start" c={C.img} s={14.5}>B′</Tc><Tc x={xAp + 6} y={Y0 - 8} a="start" c={C.img} s={14.5}>A′</Tc>
      <line x1={xA} y1={Y0 + 58} x2={xO} y2={Y0 + 58} stroke={C.obj} strokeWidth="1.6" /><line x1={xO} y1={Y0 + 58} x2={xAp} y2={Y0 + 58} stroke={C.img} strokeWidth="1.6" />
      <Tc x={(xA + xO) / 2} y={Y0 + 76} c={C.obj} s={14}>OA</Tc><Tc x={(xO + xAp) / 2} y={Y0 + 76} c={C.img} s={14}>OA′</Tc>
      <Tc x="150" y="198" s={14} c={C.encre}>Poteau de 4,0{NB}m à 20{NB}m :</Tc>
      <Tc x="150" y="218" s={14.5} c="#15803d">A′B′ = 4{NB}000 × 17 ÷ 20{NB}000 = 3,4{NB}mm</Tc>
      <Tc x="150" y="238" s={13.5} c={C.txt} w={400}>schéma pas à l’échelle</Tc>
    </svg>);
}

// Faisceau issu d'un point de l'axe, pour la carte « net ou flou » (objet loin ou proche, cristallin au repos)
function MiniFaisceau({ y0, D, f, L, dp = 56, titre, verdict, vc }) {
  const xO = 96;
  return (
    <g>
      <line x1="6" y1={y0} x2="294" y2={y0} stroke={C.axe} strokeWidth="1.2" strokeDasharray="7 4" />
      <line x1={xO} y1={y0 - 40} x2={xO} y2={y0 + 40} stroke={C.lent} strokeWidth="3.5" /><polygon points={`${xO},${y0 - 47} ${xO - 6},${y0 - 38} ${xO + 6},${y0 - 38}`} fill={C.lent} /><polygon points={`${xO},${y0 + 47} ${xO - 6},${y0 + 38} ${xO + 6},${y0 + 38}`} fill={C.lent} />
      <line x1={xO + L} y1={y0 - 42} x2={xO + L} y2={y0 + 42} stroke={C.ret} strokeWidth="5.5" />
      <Trace xO={xO} y0={y0} AB={0} D={D} f={f} L={L} dp={dp} vue={['haut', 'bas']} dashApres depart={86} />
      <Tc x="150" y={y0 - 52} s={14.5} c={C.encre} a="middle">{titre}</Tc>
      <Tc x={xO + L + 12} y={y0 - 24} a="start" s={14.5} c={vc}>{verdict}</Tc>
    </g>);
}
// Carte 4 : loin = net, près = flou (cristallin au repos)
export function FicheFlou() {
  const L = 100;
  return (
    <svg viewBox="0 0 300 286" style={cs} role="img" aria-label="Deux schémas pas à l’échelle. Objet lointain : les rayons arrivent presque parallèles et se rejoignent sur la rétine, l’image est nette. Objet proche avec le même cristallin : les rayons se rejoignent derrière la rétine et font une tache, l’image est floue.">
      <MiniFaisceau y0={70} D={3000} f={L} L={L} titre="objet loin" verdict="net" vc="#15803d" />
      <MiniFaisceau y0={178} D={240} f={L} L={L} titre="objet près" verdict="flou" vc="#b91c1c" />
      <Tc x="150" y="248" s={13.5} c={C.txt} w={400}>cristallin au repos, schémas pas à l’échelle</Tc>
      <Cadre y={256} h={26}><Tc x="150" y="274" s={14.5} c="#15803d">près + cristallin inchangé : flou</Tc></Cadre>
    </svg>);
}

// Cristallin (biconvexe) de bombement variable : épaisseur e (demi-épaisseur), hauteur h
const Cristallin = ({ cx, cy, e, h = 40 }) => <path d={`M${cx},${cy - h} Q${cx + 2 * e},${cy} ${cx},${cy + h} Q${cx - 2 * e},${cy} ${cx},${cy - h} Z`} fill="#bae6fd" stroke={C.lent} strokeWidth="2.5" />;
// Carte 5 : l'accommodation
export function FicheAccommodation() {
  return (
    <svg viewBox="0 0 300 282" style={cs} role="img" aria-label="À gauche, cristallin au repos, peu bombé : distance focale 17,0 millimètres, pour voir de loin. À droite, cristallin bombé : distance focale plus petite, environ 15,9 millimètres, pour voir de près à 25 centimètres. La rétine reste à 17 millimètres.">
      <rect x="6" y="6" width="140" height="150" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" /><rect x="154" y="6" width="140" height="150" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <Tc x="76" y="28" s={14.5}>pour voir loin</Tc><Tc x="224" y="28" s={14.5}>pour voir près</Tc>
      <Cristallin cx={60} cy={84} e={5} /><Cristallin cx={208} cy={84} e={13} />
      <line x1="14" y1="84" x2="138" y2="84" stroke={C.axe} strokeWidth="1.2" strokeDasharray="5 4" /><line x1="162" y1="84" x2="286" y2="84" stroke={C.axe} strokeWidth="1.2" strokeDasharray="5 4" />
      <line x1="128" y1="46" x2="128" y2="122" stroke={C.ret} strokeWidth="5" /><line x1="276" y1="46" x2="276" y2="122" stroke={C.ret} strokeWidth="5" />
      <Tc x="60" y="142" s={14.5} c={C.lent}>peu bombé</Tc><Tc x="208" y="142" s={14.5} c={C.lent}>très bombé</Tc>
      <Tc x="76" y="176" s={14.5} c={C.encre}>f′ = 17,0{NB}mm</Tc><Tc x="224" y="176" s={14.5} c={C.encre}>f′ = 15,9{NB}mm</Tc>
      <Tc x="76" y="194" s={13.5} c={C.txt} w={400}>(objet très loin)</Tc><Tc x="224" y="194" s={13.5} c={C.txt} w={400}>(objet à 25{NB}cm)</Tc>
      <Cadre y={206} h={70}>
        <Tc x="150" y="229" s={15.5} c="#15803d">Plus l’objet est près,</Tc><Tc x="150" y="249" s={15.5} c="#15803d">plus le cristallin se bombe :</Tc><Tc x="150" y="269" s={15.5} c="#15803d">f′ diminue. La rétine ne bouge pas.</Tc>
      </Cadre>
    </svg>);
}
