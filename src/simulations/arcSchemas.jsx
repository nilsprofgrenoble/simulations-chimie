// ====================================================
//  Schémas de la simulation 213 (poussée d'Archimède ; niveau TG).
//  Scène : viewBox 440 × 358, textes ≥ 17, à l'échelle (9 px par cm ; le niveau du liquide MONTE quand on immerge ; forces à l'échelle, échelle indiquée).
//  Graphe : viewBox 400 de large, textes ≥ 17. Cartes : viewBox 320 de large, textes ≥ 15,5.
//  Toutes les coordonnées sont des NOMBRES. Public daltonien : jamais la couleur seule (noms écrits, forme, tirets).
//  Forces : vecteurs (lettre + flèche, composant TV). Flèches des forces pressantes : seule la part due au fluide est dessinée (la pression
//  atmosphérique, identique sur toutes les faces, se compense) ; longueurs proportionnelles à la profondeur.
// ====================================================
import { Fl, TV } from './pressionScenes';
import { COL, stl } from './pressionStyle';
import * as M from './arcModele';

const nbf = M.nbf;
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke', strokeLinejoin: 'round' };
const Tx = ({ x, y, children, c = COL.encre, s = 17, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
// lettre + indice (indice = petit texte séparé, jamais de tspan)
const Ind = ({ x, y, l, i, c = COL.encre, s = 17, w = 700, ancre = 'start', halo = true }) => {
  const lw = s * 0.6 * String(l).length, iw = i ? s * 0.95 * 0.58 * String(i).length : 0, x0 = ancre === 'middle' ? x - (lw + iw) / 2 : ancre === 'end' ? x - lw - iw : x;
  return (<g>
    <text x={x0} y={y} fontSize={s} fontWeight={w} fill={c} {...(halo ? HALO : {})}>{l}</text>
    {i && <text x={x0 + lw} y={y + s * 0.26} fontSize={s * 0.95} fontWeight={w} fill={c} {...(halo ? HALO : {})}>{i}</text>}
  </g>);
};
const FracSvg = ({ x, y, num, den, s = 17, c = COL.encre }) => {
  const w = Math.max(String(num).length, String(den).length) * s * 0.6 + 8;
  return (<g><text x={x} y={y - 4} fontSize={s} fontWeight={700} fill={c} textAnchor="middle">{num}</text>
    <line x1={x - w / 2} y1={y + 2} x2={x + w / 2} y2={y + 2} stroke={c} strokeWidth={2}/>
    <text x={x} y={y + s + 1} fontSize={s} fontWeight={700} fill={c} textAnchor="middle">{den}</text></g>);
};

const PX = 9, CX = 205, FLOOR = 338, MUR_G = 124, MUR_D = 286, VBH = 358;      // px par cm, axe de la cuve, fond, parois intérieures, hauteur du viewBox
const COUL_LIQ = { huile: '#fde68a', eau: '#bfdbfe', mer: '#a5d8f3', sale: '#c7e0f4', inconnu: '#fef3c7' };
const REFS = [0.5, 1, 2, 5, 10, 20, 50, 100];

// ====================================================
//  SCÈNE : un cube dans un liquide, dans une cuve à l'échelle.
//   mode 'tenu'  : cube tenu par un fil (fil = 'dyn' dynamomètre, 'support' fil accroché à un support), f = fraction du volume immergée (1 = totalement,
//                  alors le dessus du cube est à dHaut cm sous la surface) ;
//   mode 'libre' : cube lâché : flotte (fraction ρ_objet/ρ_fluide), repose au fond (plus dense) ou reste entre deux eaux (masses volumiques égales).
//  forces : liste parmi 'P', 'Pi', 'T', 'R' (poids, poussée, tension du fil, réaction du fond) ; pressions : flèches sur les faces ; cotes : profondeurs.
// ====================================================
export function SceneArchimede({ fl, ob, V, mode = 'tenu', f = 1, dHaut = 3, fil = 'support', forces = [], pressions = false, cotes = false, niveauInit = false, labFluide = null, labObjet = true, aria }) {
  const a = M.arete(V), aPx = a * PX, etat = M.etat(ob.rho, fl.rho);
  let fr = f, bas;                                                           // bas : profondeur (cm) de la face basse sous la surface ; null = posé au fond
  if (mode === 'libre') { fr = etat === 'flotte' ? M.fractionEquilibre(ob.rho, fl.rho) : 1; bas = etat === 'flotte' ? fr * a : null; }
  else bas = fr < 1 ? fr * a : a + dHaut;
  const Vim = fr * V, h = M.niveau(Vim), ySurf = FLOOR - h * PX;
  let yB;
  if (mode === 'libre' && etat === 'coule') yB = FLOOR;
  else if (mode === 'libre' && etat === 'equilibre') yB = ySurf + (h * PX + aPx) / 2;
  else yB = ySurf + bas * PX;
  const yT = yB - aPx, xG = CX - aPx / 2, xD = CX + aPx / 2, yC = yT + aPx / 2;
  const dTop = (yT - ySurf) / PX, dBot = (yB - ySurf) / PX;                  // profondeurs (cm) des faces haute et basse (négative si la face haute est hors du liquide)
  const P = M.poids(ob.rho, V), Pi = M.poussee(fl.rho, Vim);
  const Tens = mode === 'tenu' ? Math.max(0, P - Pi) : 0, Rf = mode === 'libre' && etat === 'coule' ? P - Pi : 0;
  const Fdyn = fil === 'dyn' ? Tens : 0, cal = M.calibre(P);
  // dynamomètre : le tube est au-dessus du cube ; la tige sort du tube de ext px (proportionnelle à F)
  const L_FIL = 20, TUBE_H = 68, ext = (Fdyn / cal) * 30, yHook = yT - L_FIL, yTB = yHook - 8 - ext, yTT = yTB - TUBE_H;
  const yAn = yTT - 12;
  // forces à l'échelle (62 px pour la plus grande, moins si le cube repose au fond)
  const maxF = Math.max(P, Pi, Tens, Rf, 1e-9);
  const maxLen = mode === 'libre' && etat === 'coule' ? Math.max(24, aPx / 2 + 4) : 62, k = maxLen / maxF;
  const ref = REFS.filter(r => r * k >= 22 && r * k <= 70)[0] || REFS.find(r => r * k >= 22) || 100;
  const yCim = yB - (Math.min(fr, 1) * aPx) / 2;                              // centre de la partie immergée
  const LP = P * k, LPi = Pi * k, LT = Tens * k, LR = Rf * k;
  const kp = 2.6;                                                            // flèches de pression : px par cm de profondeur
  const labs = [];
  if (labObjet) labs.push({ l: ob.lab, y: yC, x1: Math.max(34, 30), x2: xG - 2 });
  return (
    <svg viewBox={`0 0 440 ${VBH}`} role="img" aria-label={aria} style={{ ...stl, border: 'none' }}>
      {/* liquide et cuve */}
      <rect x={MUR_G} y={ySurf} width={MUR_D - MUR_G} height={FLOOR - ySurf} fill={COUL_LIQ[fl.id] || COUL_LIQ.inconnu} fillOpacity={0.85}/>
      <line x1={MUR_G} y1={ySurf} x2={MUR_D} y2={ySurf} stroke={COL.bleu} strokeWidth={2.2}/>
      {niveauInit && Vim > 0 && <g><line x1={MUR_G} y1={FLOOR - M.niveau(0) * PX} x2={MUR_D + 12} y2={FLOOR - M.niveau(0) * PX} stroke={COL.gris} strokeWidth={1.8} strokeDasharray="6 4"/>
        <Tx x={MUR_D + 16} y={FLOOR - M.niveau(0) * PX + 6} s={19} c={COL.gris} halo={false}>niveau sans</Tx><Tx x={MUR_D + 16} y={FLOOR - M.niveau(0) * PX + 25} s={19} c={COL.gris} halo={false}>l’objet</Tx></g>}
      {/* fil, support, dynamomètre */}
      {fil === 'support' && <g>
        <line x1={CX} y1={yT} x2={CX} y2={12} stroke={COL.encre} strokeWidth={2.2}/>
        <rect x={CX - 34} y={4} width={68} height={8} rx={3} fill={COL.acier} stroke={COL.encre} strokeWidth={1.5}/>
        <Tx x={8} y={26} s={19} halo={false}>support</Tx><line x1={90} y1={21} x2={CX - 36} y2={9} stroke={COL.gris} strokeWidth={1.4}/>
        <Tx x={8} y={Math.min(yT - 6, 120)} s={19} halo={false}>fil</Tx><line x1={38} y1={Math.min(yT - 11, 115)} x2={CX - 3} y2={Math.min(yT - 11, 115)} stroke={COL.gris} strokeWidth={1.4}/></g>}
      {fil === 'dyn' && <g>
        <line x1={CX} y1={yHook} x2={CX} y2={yT} stroke={COL.encre} strokeWidth={2.2}/>
        <line x1={CX} y1={yTB} x2={CX} y2={yHook - 6} stroke={COL.acier} strokeWidth={4}/>
        <circle cx={CX} cy={yHook - 3} r={4.5} fill="none" stroke={COL.encre} strokeWidth={2.2}/>
        <rect x={CX - 12} y={yTT} width={24} height={TUBE_H} rx={5} fill="#f8fafc" stroke={COL.encre} strokeWidth={2.4}/>
        {[0, 0.5, 1].map(q => <g key={q}><line x1={CX + 12} y1={yTT + 8 + q * 52} x2={CX + 20} y2={yTT + 8 + q * 52} stroke={COL.encre} strokeWidth={2}/>
          <Tx x={CX + 24} y={yTT + 14 + q * 52} s={19} w={600} halo={false}>{nbf(cal * q, 0)}</Tx></g>)}
        <Tx x={CX + 62} y={yTT + 14 + 52 + 22} s={19} w={600} halo={false} c={COL.gris}>N</Tx>
        <line x1={CX - 12} y1={yTT + 8 + (Fdyn / cal) * 52} x2={CX + 12} y2={yTT + 8 + (Fdyn / cal) * 52} stroke={COL.rouge} strokeWidth={3}/>
        <polygon points={`${CX - 12},${yTT + 8 + (Fdyn / cal) * 52} ${CX - 22},${yTT + 2 + (Fdyn / cal) * 52} ${CX - 22},${yTT + 14 + (Fdyn / cal) * 52}`} fill={COL.rouge}/>
        <line x1={CX} y1={yAn + 8} x2={CX} y2={yTT} stroke={COL.encre} strokeWidth={2}/>
        <circle cx={CX} cy={yAn + 4} r={5} fill="none" stroke={COL.encre} strokeWidth={2.2}/>
        <Tx x={8} y={yTT + 28} s={19} halo={false}>dynamomètre</Tx><line x1={128} y1={yTT + 23} x2={CX - 14} y2={yTT + 23} stroke={COL.gris} strokeWidth={1.4}/>
        <Tx x={8} y={Math.max(yTB + 22, yHook + 4)} s={19} halo={false}>fil</Tx><line x1={38} y1={Math.max(yTB + 17, yHook - 1)} x2={CX - 3} y2={Math.max(yTB + 17, yHook - 1)} stroke={COL.gris} strokeWidth={1.4}/></g>}
      {/* cube */}
      <rect x={xG} y={yT} width={aPx} height={aPx} fill={ob.coul} stroke={COL.encre} strokeWidth={2.6}/>
      {/* flèches de pression (part due au fluide) */}
      {pressions && <g>
        {[0.2, 0.5, 0.8].map(q => <Fl key={'h' + q} x1={xG + q * aPx} y1={yT} x2={xG + q * aPx} y2={yT + kp * Math.max(dTop, 0.8)} c={COL.bleu} w={2.4} tete={8}/>)}
        {[0.2, 0.5, 0.8].map(q => <Fl key={'b' + q} x1={xG + q * aPx} y1={yB} x2={xG + q * aPx} y2={yB - kp * dBot} c={COL.bleu} w={2.4} tete={8}/>)}
        {[0.15, 0.35, 0.55].map(q => <g key={'l' + q}><Fl x1={xG} y1={yT + q * aPx} x2={xG + kp * (dTop + q * a)} y2={yT + q * aPx} c={COL.bleu} w={2.4} tete={8}/>
          <Fl x1={xD} y1={yT + q * aPx} x2={xD - kp * (dTop + q * a)} y2={yT + q * aPx} c={COL.bleu} w={2.4} tete={8}/></g>)}
      </g>}
      {/* forces à l'échelle */}
      {forces.includes('P') && <g><Fl x1={CX - 14} y1={yC} x2={CX - 14} y2={yC + LP} c={COL.rouge} w={3.2} tete={11}/><TV x={CX - 42} y={yC + LP * 0.55 + 6} c={COL.rouge} s={19} halo>P</TV></g>}
      {forces.includes('Pi') && Pi > 0 && <g><Fl x1={CX + 14} y1={yCim} x2={CX + 14} y2={yCim - LPi} c={COL.bleu} w={3.2} tete={11}/><TV x={CX + 22} y={yCim - LPi + 8} c={COL.bleu} s={19} halo>Π</TV></g>}
      {forces.includes('T') && Tens > 0 && <g><Fl x1={CX} y1={yT} x2={CX} y2={yT - LT} c={COL.vert} w={3.2} tete={11}/><TV x={CX + 10} y={yT - LT + 4} c={COL.vert} s={19} halo>T</TV></g>}
      {forces.includes('R') && Rf > 0.01 && <g><Fl x1={CX + 32} y1={yB} x2={CX + 32} y2={yB - LR} c={COL.orange} w={3.2} tete={11}/><TV x={CX + 40} y={yB - LR / 2 + 6} c={COL.orange} s={19} halo>R</TV></g>}
      {forces.length > 0 && <g><line x1={314} y1={22} x2={314} y2={22 + ref * k} stroke={COL.encre} strokeWidth={3}/>
        <line x1={308} y1={22} x2={320} y2={22} stroke={COL.encre} strokeWidth={2}/><line x1={308} y1={22 + ref * k} x2={320} y2={22 + ref * k} stroke={COL.encre} strokeWidth={2}/>
        <Tx x={328} y={22 + ref * k / 2 - 2} s={19} halo={false}>= {nbf(ref, ref < 1 ? 1 : 0)} N</Tx><Tx x={328} y={22 + ref * k / 2 + 17} s={19} w={600} c={COL.gris} halo={false}>(échelle)</Tx></g>}
      {/* parois de la cuve (devant) */}
      <path d={`M ${MUR_G - 4} ${FLOOR - 180} L ${MUR_G - 4} ${FLOOR + 4} L ${MUR_D + 4} ${FLOOR + 4} L ${MUR_D + 4} ${FLOOR - 180}`} fill="none" stroke={COL.encre} strokeWidth={4.5} strokeLinejoin="round"/>
      {/* étiquettes */}
      {labObjet && <g>{ob.lab.map((t, i) => <Tx key={i} x={3} y={yC - 4 + i * 21} s={19} halo={false}>{t}</Tx>)}
        <line x1={112} y1={yC - 9} x2={xG - 2} y2={yC - 9} stroke={COL.gris} strokeWidth={1.4}/></g>}
      {!cotes && <g>{(labFluide || fl.lab).map((t, i) => <Tx key={i} x={MUR_D + 16} y={FLOOR - 40 + i * 21} s={19} c={COL.bleu} halo={false}>{t}</Tx>)}
        <line x1={MUR_D + 12} y1={FLOOR - 45} x2={MUR_D - 14} y2={FLOOR - 45} stroke={COL.bleu} strokeWidth={1.4}/></g>}
      {cotes && <g>
        {[[ySurf, 'surface'], [yT, 'face haute'], [yB, 'face basse']].map(([y, t], i) => <g key={i}><line x1={i === 0 ? MUR_D : xD} y1={y} x2={436} y2={y} stroke={COL.gris} strokeWidth={1.4} strokeDasharray="3 4"/>
          {i > 0 && <Tx x={436} y={y + 17} s={19} ancre="end" halo={false}>{t}</Tx>}</g>)}
        <Fl x1={298} y1={ySurf} x2={298} y2={yT} c={COL.orange} w={2.2} tete={7}/><Tx x={306} y={(ySurf + yT) / 2 + 6} s={19} c={COL.orange} halo={false}>{nbf(dTop, 0)}</Tx>
        <Fl x1={324} y1={ySurf} x2={324} y2={yB} c={COL.orange} w={2.2} tete={7}/><Tx x={332} y={(ySurf + yB) / 2 + 6} s={19} c={COL.orange} halo={false}>{nbf(dBot, 0)}</Tx>
        <Tx x={436} y={ySurf - 32} s={19} ancre="end" halo={false}>profondeur</Tx><Tx x={436} y={ySurf - 12} s={19} ancre="end" halo={false}>(cm)</Tx></g>}
      {/* sol de la cuve */}
      <line x1={MUR_G - 30} y1={FLOOR + 6} x2={MUR_D + 30} y2={FLOOR + 6} stroke={COL.gris} strokeWidth={3}/>
      <title>{aria}</title>
    </svg>);
}

// ====================================================
//  GRAPHE : poussée Π (déduite de P − F) en fonction du volume immergé
// ====================================================
const pasJoli = (max, n = 4) => { const b = max / n, e = Math.pow(10, Math.floor(Math.log10(b))), m = b / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };
const fmt = x => String(Math.round(x * 1000) / 1000).replace('.', ',');
export function GrapheArchimede({ points, Vmax, Pimax, droite = null, aria }) {
  const x0 = 70, y0 = 34, w = 296, h = 176, yMax = pasJoli(Pimax * 1.12) * Math.ceil(Pimax * 1.12 / pasJoli(Pimax * 1.12)), pas = pasJoli(yMax);
  const X = v => x0 + (v / Vmax) * w, Y = p => y0 + h - (p / yMax) * h;
  const ticksY = []; for (let p = 0; p <= yMax + 1e-9; p += pas) ticksY.push(p);
  return (
    <svg viewBox="0 0 400 268" role="img" aria-label={aria} style={stl}>
      <line x1={x0} y1={y0 - 6} x2={x0} y2={y0 + h} stroke={COL.encre} strokeWidth={2}/><line x1={x0} y1={y0 + h} x2={x0 + w + 8} y2={y0 + h} stroke={COL.encre} strokeWidth={2}/>
      {ticksY.map(p => <g key={p}><line x1={x0 - 5} y1={Y(p)} x2={x0} y2={Y(p)} stroke={COL.encre} strokeWidth={2}/><line x1={x0} y1={Y(p)} x2={x0 + w} y2={Y(p)} stroke="#e2e8f0" strokeWidth={1}/>
        <Tx x={x0 - 9} y={Y(p) + 6} s={17} ancre="end" w={600} halo={false}>{fmt(p)}</Tx></g>)}
      {[0, 0.25, 0.5, 0.75, 1].map(q => <g key={q}><line x1={X(q * Vmax)} y1={y0 + h} x2={X(q * Vmax)} y2={y0 + h + 5} stroke={COL.encre} strokeWidth={2}/>
        {(q === 0 || q === 0.5 || q === 1) && <Tx x={X(q * Vmax)} y={y0 + h + 23} s={17} ancre="middle" w={600} halo={false}>{fmt(q * Vmax)}</Tx>}</g>)}
      <Tx x={x0 + w / 2} y={y0 + h + 47} s={17} ancre="middle" halo={false}>volume immergé V (cm³)</Tx>
      <Tx x={x0 + 4} y={y0 - 4} s={17} halo={false} c={COL.bleu}>Π (N)</Tx>
      {droite && <line x1={X(0)} y1={Y(0)} x2={X(Vmax)} y2={Y(droite * Vmax)} stroke={COL.orange} strokeWidth={2.4} strokeDasharray="8 5"/>}
      {points.map((p, i) => <circle key={i} cx={X(p.V)} cy={Y(p.Pi)} r={i === points.length - 1 ? 7 : 5.5} fill={i === points.length - 1 ? '#fff' : COL.bleu} stroke={COL.bleu} strokeWidth={3}/>)}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320, textes ≥ 15,5)
// ====================================================
const Cadre = ({ aria, h, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={{ ...stl, maxWidth: 340, border: 'none', margin: '0 auto 6px' }}>{children}</svg>;

// 1) origine : forces pressantes sur un cube immergé
export function SvgCarteOrigine() {
  const x = 100, y = 78, s = 100, k = 0.4;                                     // k : px de flèche par px de profondeur (surface à y = 42)
  const dp = yy => k * (yy - 42);
  return (<Cadre aria="Un cube immergé. La force pressante de l'eau sur la face du bas, plus profonde, est plus grande que sur la face du haut. Les forces sur les faces latérales se compensent. La résultante est verticale, vers le haut : c'est la poussée d'Archimède, représentée par une flèche verte sous le cube." h={308}>
    <rect x={10} y={10} width={300} height={268} rx={10} fill="#dbeafe" stroke={COL.bleu} strokeWidth={2}/>
    <Tx x={20} y={34} s={16} c={COL.bleu} halo={false}>surface libre</Tx><line x1={10} y1={42} x2={310} y2={42} stroke={COL.bleu} strokeWidth={2.4}/>
    <rect x={x} y={y} width={s} height={s} fill="#cbd5e1" stroke={COL.encre} strokeWidth={2.6}/>
    {[0.25, 0.75].map(q => <Fl key={'h' + q} x1={x + q * s} y1={y} x2={x + q * s} y2={y + dp(y)} c={COL.bleu} w={2.6} tete={8}/>)}
    {[0.25, 0.75].map(q => <Fl key={'b' + q} x1={x + q * s} y1={y + s} x2={x + q * s} y2={y + s - dp(y + s)} c={COL.bleu} w={2.6} tete={8}/>)}
    {[0.2, 0.5].map(q => <g key={q}><Fl x1={x} y1={y + q * s} x2={x + dp(y + q * s)} y2={y + q * s} c={COL.bleu} w={2.6} tete={8}/><Fl x1={x + s} y1={y + q * s} x2={x + s - dp(y + q * s)} y2={y + q * s} c={COL.bleu} w={2.6} tete={8}/></g>)}
    <Tx x={x + s + 8} y={y + 12} s={15.5} c={COL.bleu} halo={false}>haut : petite</Tx><Tx x={x + s + 8} y={y + 31} s={15.5} c={COL.bleu} halo={false}>force</Tx>
    <Tx x={x + s + 8} y={y + s - 22} s={15.5} c={COL.bleu} halo={false}>bas : grande</Tx><Tx x={x + s + 8} y={y + s - 3} s={15.5} c={COL.bleu} halo={false}>force</Tx>
    <Tx x={x - 8} y={y + s / 2 + 22} s={15.5} ancre="end" c={COL.bleu} halo={false}>côtés :</Tx><Tx x={x - 8} y={y + s / 2 + 41} s={15.5} ancre="end" c={COL.bleu} halo={false}>forces</Tx><Tx x={x - 8} y={y + s / 2 + 60} s={15.5} ancre="end" c={COL.bleu} halo={false}>opposées</Tx>
    <Fl x1={x + s / 2} y1={250} x2={x + s / 2} y2={y + s + 14} c={COL.vert} w={3.6} tete={11}/>
    <TV x={x + s / 2 + 12} y={236} c={COL.vert} s={19}>Π</TV>
    <Tx x={160} y={272} s={16} ancre="middle" c={COL.vert} halo={false}>résultante : vers le haut</Tx>
  </Cadre>);
}

// 2) expression de la poussée : Π = poids du fluide déplacé
export function SvgCarteExpression() {
  return (<Cadre aria="Un cube immergé dans un fluide. La poussée d'Archimède Π est verticale, vers le haut, et sa norme vaut la masse volumique du fluide fois le volume immergé fois g. C'est le poids du fluide déplacé." h={258}>
    <rect x={10} y={10} width={150} height={150} rx={8} fill="#dbeafe" stroke={COL.bleu} strokeWidth={2}/>
    <rect x={58} y={56} width={54} height={54} fill="#cbd5e1" stroke={COL.encre} strokeWidth={2.6}/>
    <Fl x1={85} y1={56} x2={85} y2={20} c={COL.bleu} w={3.2} tete={11}/><TV x={92} y={32} c={COL.bleu} s={19}>Π</TV>
    <Tx x={20} y={148} s={15.5} c={COL.bleu} halo={false}>fluide : ρ</Tx>
    <Tx x={170} y={36} s={16} halo={false}>direction : verticale</Tx><Tx x={170} y={58} s={16} halo={false}>sens : vers le haut</Tx>
    <Tx x={170} y={96} s={16} halo={false}>V = volume</Tx><Tx x={170} y={116} s={16} halo={false}>immergé</Tx>
    <Tx x={20} y={200} s={21} halo={false}>Π = ρ × V × g</Tx><Tx x={20} y={222} s={15.5} c={COL.gris} halo={false}>(norme, en newtons)</Tx>
    <Tx x={160} y={246} s={16} ancre="middle" c={COL.orange} halo={false}>= poids du fluide déplacé</Tx>
  </Cadre>);
}

// 3) poids apparent au dynamomètre
function Dyn({ x, y, f, bas }) {
  return (<g>
    <circle cx={x} cy={y - 10} r={5} fill="none" stroke={COL.encre} strokeWidth={2.2}/>
    <rect x={x - 11} y={y} width={22} height={62} rx={5} fill="#f8fafc" stroke={COL.encre} strokeWidth={2.4}/>
    <line x1={x - 11} y1={y + 8 + f * 44} x2={x + 11} y2={y + 8 + f * 44} stroke={COL.rouge} strokeWidth={3.4}/>
    <line x1={x} y1={y + 62} x2={x} y2={bas} stroke={COL.acier} strokeWidth={4}/>
    </g>);
}
export function SvgCartePoidsApparent() {
  return (<Cadre aria="Deux dynamomètres. À gauche, le cube est dans l'air : l'indication F est égale au poids P. À droite, le cube est immergé : l'indication est plus petite, F égale P moins Π. Le poids du cube n'a pas changé ; c'est le poids apparent qui diminue." h={262}>
    <Dyn x={80} y={30} f={1} bas={124}/><Dyn x={240} y={30} f={0.45} bas={128}/>
    <rect x={64} y={124} width={32} height={32} fill="#cbd5e1" stroke={COL.encre} strokeWidth={2.4}/>
    <rect x={150} y={118} width={160} height={76} fill="#dbeafe" fillOpacity={0.8}/><line x1={150} y1={118} x2={310} y2={118} stroke={COL.bleu} strokeWidth={2.2}/>
    <rect x={224} y={128} width={32} height={32} fill="#cbd5e1" stroke={COL.encre} strokeWidth={2.4}/>
    <Tx x={80} y={186} s={19} ancre="middle" halo={false}>F = P</Tx><Tx x={240} y={186} s={19} ancre="middle" halo={false}>F = P − Π</Tx>
    <Tx x={160} y={222} s={16} ancre="middle" halo={false}>le poids P ne change pas :</Tx>
    <Tx x={160} y={242} s={16} ancre="middle" c={COL.orange} halo={false}>c’est le poids apparent qui baisse</Tx>
  </Cadre>);
}

// 4) flottaison : comparer les masses volumiques
export function SvgCarteFlottaison() {
  return (<Cadre aria="Deux cas. À gauche, objet plus dense que le fluide : il coule et repose au fond. À droite, objet moins dense que le fluide : il flotte, et la fraction immergée de son volume est le rapport de la masse volumique de l'objet à celle du fluide." h={282}>
    <rect x={10} y={30} width={140} height={140} fill="#dbeafe" stroke={COL.encre} strokeWidth={3}/>
    <rect x={55} y={120} width={50} height={50} fill="#94a3b8" stroke={COL.encre} strokeWidth={2.6}/>
    <rect x={170} y={30} width={140} height={140} fill="#dbeafe" stroke={COL.encre} strokeWidth={3}/>
    <rect x={215} y={44} width={50} height={50} fill="#e0b983" stroke={COL.encre} strokeWidth={2.6}/>
    <rect x={216} y={69} width={48} height={24} fill="#bfdbfe" fillOpacity={0.5}/><line x1={170} y1={69} x2={310} y2={69} stroke={COL.bleu} strokeWidth={2.2}/>
    <Tx x={80} y={194} s={16} ancre="middle" halo={false}>ρ objet &gt; ρ fluide</Tx><Tx x={80} y={214} s={16} ancre="middle" c={COL.rouge} halo={false}>l’objet coule</Tx>
    <Tx x={240} y={194} s={16} ancre="middle" halo={false}>ρ objet &lt; ρ fluide</Tx><Tx x={240} y={214} s={16} ancre="middle" c={COL.vert} halo={false}>l’objet flotte</Tx>
    <Tx x={10} y={256} s={16} halo={false}>fraction immergée =</Tx><FracSvg x={235} y={252} num="ρ objet" den="ρ fluide" s={16}/>
  </Cadre>);
}

// 5) la poussée de l'air
export function SvgCarteAir() {
  return (<Cadre aria="Une pierre dans l'air. L'air exerce aussi une poussée d'Archimède Π sur elle, vers le haut, mais cette flèche est très courte devant celle du poids P : pour un objet dense, la poussée de l'air est négligeable." h={250}>
    <rect x={60} y={70} width={60} height={60} fill="#94a3b8" stroke={COL.encre} strokeWidth={2.6}/>
    <Fl x1={104} y1={70} x2={104} y2={58} c={COL.bleu} w={3.2} tete={7}/><TV x={112} y={62} c={COL.bleu} s={19}>Π</TV>
    <Fl x1={80} y1={100} x2={80} y2={176} c={COL.rouge} w={3.2} tete={11}/><TV x={44} y={160} c={COL.rouge} s={19}>P</TV>
    <Tx x={170} y={92} s={16} halo={false}>pierre : l’air la</Tx><Tx x={170} y={112} s={16} halo={false}>pousse aussi</Tx>
    <Tx x={170} y={146} s={16} c={COL.bleu} halo={false}>ρ air ≈ 1,2 kg·m⁻³</Tx>
    <Tx x={170} y={166} s={16} c={COL.bleu} halo={false}>donc Π très petite</Tx>
    <Tx x={160} y={212} s={16} ancre="middle" halo={false}>pour un objet dense, la poussée</Tx><Tx x={160} y={232} s={16} ancre="middle" halo={false}>de l’air est négligeable</Tx>
  </Cadre>);
}

// scène du pas « poussée de l'air » : un ballon de baudruche dans l'air
export function SceneBallon({ aria }) {
  return (<svg viewBox={`0 0 440 ${VBH}`} role="img" aria-label={aria} style={{ ...stl, border: 'none' }}>
    <ellipse cx={CX} cy={150} rx={70} ry={80} fill="#fecaca" stroke={COL.encre} strokeWidth={3}/>
    <polygon points={`${CX - 6},${230} ${CX + 6},${230} ${CX},${240}`} fill="#fecaca" stroke={COL.encre} strokeWidth={2.4}/>
    <path d={`M ${CX} 240 Q ${CX + 14} 270 ${CX - 8} 300`} fill="none" stroke={COL.encre} strokeWidth={2}/>
    <Tx x={8} y={140} s={19} halo={false}>ballon de</Tx><Tx x={8} y={161} s={19} halo={false}>baudruche</Tx>
    <line x1={106} y1={150} x2={CX - 72} y2={150} stroke={COL.gris} strokeWidth={1.4}/>
    <Tx x={CX + 84} y={140} s={19} halo={false}>V = 5,0 L</Tx>
    <Tx x={8} y={FLOOR - 10} s={19} c={COL.bleu} halo={false}>dans l’air : ρ = 1,2 kg·m⁻³</Tx>
    <title>{aria}</title>
  </svg>);
}
