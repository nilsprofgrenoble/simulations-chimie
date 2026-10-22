import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useMemo, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, indicesProfond, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { MELANGES, Teb, yEq, Tros, escalier, tete, trajectoire, pointA, wDe, degre, bilanColonneInfinie } from "./distillationModele";
import { Pic } from "../Pictos";

const SIM_ID = 41;
declarerDefis(SIM_ID, [['principal', 'Distillation : températures et compositions']]);

// ====================================================
//  SIM 41 — DISTILLATION SIMPLE ET FRACTIONNÉE d'un mélange binaire
// ====================================================

export const NB = ' ';
export const nf = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '–');
export const pct = (x, d = 0) => nf(100 * x, d);
// Notation x_A^L (liquide) et x_A^V (vapeur) : indice A, exposant L ou V
export const Xi = ({ e }) => <>x<span style={{ display: 'inline-block', verticalAlign: '-0.55em', lineHeight: 1, fontSize: '0.72em', textAlign: 'left', marginLeft: 1 }}><span style={{ display: 'block', marginBottom: -2 }}>{e}</span><span style={{ display: 'block' }}>A</span></span></>;
// même notation dans un dessin SVG : à placer juste après la lettre « x »
export const XiS = ({ e, suffix = '' }) => <><tspan fontSize="8.5" dy="3">A</tspan><tspan fontSize="8.5" dx="-5.6" dy="-8">{e}</tspan><tspan dy="5">{suffix}</tspan></>;
const NS = [0, 1, 2, 3, 4, 6, Infinity];
const nomN = n => (n === Infinity ? '∞' : String(n));
const M0 = 200;                                   // masse du mélange à distiller (g), comme dans le TP

// ── Petits points rouges (composé A, volatil) et bleus (composé B) : composition d'une zone ──
export function Pastilles({ x: x_, y: y_, w: w_, h: h_, comp, n = 14, graine = 1, anim, cA, cB, r = 3.6 }) {
  const x = Number(x_), y = Number(y_), w = Number(w_), h = Number(h_);
  const pts = useMemo(() => {
    let s = graine * 9301 + 49297;
    const al = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const cases = []; const cols = Math.ceil(Math.sqrt(n * w / h)), lignes = Math.ceil(n / cols);
    for (let k = 0; k < cols * lignes; k++) cases.push(k);
    for (let i = cases.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [cases[i], cases[j]] = [cases[j], cases[i]]; }
    const nA = Math.round(n * comp);
    return cases.slice(0, n).map((c, i) => ({ cx: x + (c % cols + 0.5) * w / cols + (al() - 0.5) * 3, cy: y + (Math.floor(c / cols) + 0.5) * h / lignes + (al() - 0.5) * 3, A: i < nA, d: al() * 2 }));
  }, [x, y, w, h, comp, n, graine]);
  return pts.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r={r} fill={p.A ? cA : cB} stroke="#0f172a" strokeWidth="0.5"
    className={anim ? (i % 2 ? 'dist-a' : 'dist-b') : undefined} style={anim ? { animationDelay: `${p.d}s` } : undefined}/>);
}

// ── Appareil : montage de laboratoire (ballon, colonne de Vigreux ou tête simple, réfrigérant droit, éprouvette) ──
function Appareil({ m, N, pt, fFin, anim, chauffe }) {
  const et = escalier(m, pt.xB, N);
  const frac = N !== 0;
  const nPl = N === Infinity ? 7 : Math.min(N + 1, 7);   // N plateaux + la vapeur juste au-dessus du bouilleur (1re vaporisation)
  const cx = 130, cy = 350, R = 52;
  const niveau = 0.22 + 0.45 * pt.nB;          // le ballon est rempli aux deux tiers environ au départ
  const mel = (c, a) => { const r = Math.round(37 + (220 - 37) * c), g = Math.round(99 + (38 - 99) * c), b = Math.round(235 + (38 - 235) * c); return `rgba(${r},${g},${b},${a})`; };
  const niveauR = Math.min(1, pt.f / Math.max(fFin, 0.05)) * 0.9;
  // géométrie : colonne (fractionnée) ou simple tête (simple)
  const colH = 170, yColBas = cy - R - 14, yColHaut = yColBas - colH;        // colonne entre ces deux ordonnées
  const yTete = frac ? yColHaut - 10 : cy - R - 62;                          // haut de la tête
  const wCol = frac ? 44 : 24;
  const H = { x: cx + wCol / 2, y: frac ? yColHaut + 6 : yTete + 20 };       // départ du bras latéral
  const E = { x: 410, y: 338 };                                              // bas du réfrigérant
  const dx = E.x - H.x, dy = E.y - H.y, ang = Math.atan2(dy, dx) * 180 / Math.PI, Lc = Math.hypot(dx, dy);
  const plaque = k => {                                                       // k = 1..nPl : plateau dessiné
    const pas = colH / nPl; return { y: yColBas - k * pas + 4, h: Math.min(34, pas - 6) };
  };
  const labelPl = k => et[Math.min(k - 1, et.length - 1)];
  const T = { fill: '#334155', fontSize: 12 };
  return (
    <svg viewBox={frac ? "0 0 520 470" : "0 110 520 360"} style={{ width: '100%', maxWidth: 560, display: 'block', margin: '0 auto' }} role="img"
      aria-label="Montage de distillation : ballon sur chauffe-ballon, colonne, réfrigérant droit, éprouvette">
      <defs>
        <clipPath id="dist-ballon"><circle cx={cx} cy={cy} r={R}/></clipPath>
        <marker id="dist-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0284c7"/></marker>
      </defs>
      {/* support élévateur et chauffe-ballon */}
      <g stroke="#78716c" strokeWidth="2"><line x1={cx - 40} y1="436" x2={cx + 40} y2="404"/><line x1={cx - 40} y1="404" x2={cx + 40} y2="436"/></g>
      <rect x={cx - 62} y="440" width="124" height="6" fill="#d6b98c" stroke="#a16207"/>
      <rect x={cx - 62} y="396" width="124" height="8" fill="#d6b98c" stroke="#a16207"/>
      <rect x={cx - 66} y="372" width="132" height="26" rx="6" fill={chauffe ? '#fdba74' : '#e2e8f0'} stroke="#475569" strokeWidth="1.8"/>
      <circle cx={cx + 40} cy="385" r="7" fill="white" stroke="#475569"/><line x1={cx + 40} y1="385" x2={cx + 44} y2="381" stroke="#475569"/>
      <text x="14" y="392" {...T} fontSize="10.5">chauffe-ballon</text>
      {/* ballon : le col est ouvert vers le bas, il débouche directement dans le ballon */}
      {(() => {
        const wN = 12, yj = cy - Math.sqrt(R * R - wN * wN);
        return (
          <g>
            <rect x={cx - wN} y={yColBas} width={2 * wN} height={yj - yColBas + 2} fill="white"/>
            <circle cx={cx} cy={cy} r={R} fill="white"/>
            <g clipPath="url(#dist-ballon)">
              <rect x={cx - R} y={cy + R - 2 * R * niveau} width={2 * R} height={2 * R} fill={mel(pt.xB, 0.45)}/>
              <Pastilles x={cx - 38} y={cy + R - 2 * R * niveau + 8} w={76} h={Math.max(18, 2 * R * niveau - 24)} comp={pt.xB} n={24} graine={3} anim={anim} cA={m.coulA} cB={m.coulB} r={3.6}/>
            </g>
            <path d={`M${cx + wN} ${yj} A${R} ${R} 0 1 1 ${cx - wN} ${yj}`} fill="none" stroke="#475569" strokeWidth="2.5"/>
            <path d={`M${cx - wN} ${yj} L${cx - wN} ${yColBas} M${cx + wN} ${yj} L${cx + wN} ${yColBas}`} fill="none" stroke="#475569" strokeWidth="2"/>
          </g>);
      })()}
      <text x="14" y={cy - 6} {...T} fontWeight="700" fill="#0f172a">bouilleur</text>
      <text x="14" y={cy + 8} {...T}>{`${nf(pt.TB, 1)}${NB}°C`}</text>
      <text x="14" y={cy + 22} {...T}>x<XiS e="L" suffix={`${NB}=${NB}${nf(pt.xB)}`}/></text>
      {/* colonne ou tête simple */}
      {frac ? (
        <g>
          <rect x={cx - wCol / 2} y={yColHaut} width={wCol} height={colH + 14} fill="rgba(241,245,249,0.75)"/>
          <path d={`M${cx - wCol / 2} ${yColHaut} L${cx - wCol / 2} ${yColBas} L${cx - 12} ${yColBas} M${cx + wCol / 2} ${yColHaut} L${cx + wCol / 2} ${yColBas} L${cx + 12} ${yColBas}`} fill="none" stroke="#475569" strokeWidth="2"/>
          {Array.from({ length: nPl }, (_, k) => {
            const pl = plaque(k + 1), e = labelPl(k + 1);
            return (
              <g key={k}>
                <rect x={cx - wCol / 2 + 3} y={pl.y - pl.h + 4} width={wCol - 6} height={pl.h} rx="5" fill="rgba(148,163,184,0.38)" stroke="#94a3b8"/>
                <Pastilles x={cx - wCol / 2 + 5} y={pl.y - pl.h + 6} w={wCol - 10} h={pl.h - 4} comp={e.y} n={7} graine={7 + k} anim={anim} cA={m.coulA} cB={m.coulB} r={2.6}/>
                <line x1={cx - wCol / 2 - 3} y1={pl.y - pl.h / 2 + 4} x2={cx - wCol / 2 - 16} y2={pl.y - pl.h / 2 + 4} stroke="#94a3b8"/>
                <text x={cx - wCol / 2 - 20} y={pl.y - pl.h / 2 + 3} textAnchor="end" fontSize="11.5" fontWeight="700" fill="#0f172a">x<XiS e="V" suffix={`${NB}=${NB}${nf(e.y)}`}/></text>
                <text x={cx - wCol / 2 - 20} y={pl.y - pl.h / 2 + 16} textAnchor="end" {...T} fontSize="10">{`${nf(Teb(m, e.x), 1)}${NB}°C`}</text>
              </g>);
          })}
          <text x={cx + wCol / 2 + 6} y={yColBas - 40} {...T} fontSize="10.5">colonne</text>
        </g>
      ) : (
        <g>
          <rect x={cx - wCol / 2} y={yTete + 20} width={wCol} height={cy - R - yTete - 6} fill="white"/>
          <path d={`M${cx - 12} ${yTete + 20} L${cx - 12} ${yColBas} M${cx + 12} ${yTete + 20} L${cx + 12} ${yColBas}`} fill="none" stroke="#475569" strokeWidth="2"/>
          <Pastilles x={cx - 8} y={yTete + 50} w={16} h={40} comp={et[0].y} n={5} graine={5} anim={anim} cA={m.coulA} cB={m.coulB} r={2.6}/>
          <text x="14" y={yTete + 62} {...T} fontSize="10.5">pas de colonne</text>
          <text x="14" y={yTete + 75} {...T} fontSize="10.5">(simple)</text>
        </g>
      )}
      {/* tête, bouchon, thermomètre */}
      <rect x={cx - 12} y={yTete + (frac ? 8 : 18)} width="24" height="10" rx="2" fill="#9a3412" stroke="#7c2d12"/>
      <rect x={cx - 4} y={yTete - 36} width="8" height={frac ? 62 : 70} rx="3" fill="white" stroke="#dc2626" strokeWidth="1.6"/>
      <rect x={cx - 1.5} y={yTete + (frac ? 8 : 18) - 6} width="3" height="30" fill="#dc2626"/>
      <text x={cx + 12} y={yTete - 24} fontSize="12" fontWeight="700" fill="#b91c1c">{`T${NB}=${NB}${nf(pt.Tt, 1)}${NB}°C`}</text>
      <text x={cx + 12} y={yTete - 11} {...T} fontSize="10.5">thermomètre (tête)</text>
            {/* vapeur */}
      {anim && chauffe && [0, 1, 2].map(i => <circle key={i} className="dist-monte" cx={cx - 6 + i * 6} cy={cy - R - 10} r="2" fill="#94a3b8" style={{ '--d': `-${frac ? colH - 20 : 24}px`, animationDelay: `${i * 0.9}s` }}/>)}
      {/* bras latéral et réfrigérant droit */}
      <g transform={`translate(${H.x} ${H.y}) rotate(${ang})`}>
        <rect x={-2} y="-5" width={Lc + 2} height="10" fill="white"/>
        <path d={`M-2 -5 L${Lc} -5 L${Lc} 5 L-2 5`} fill="none" stroke="#475569" strokeWidth="1.8"/>
        <rect x={Lc * 0.1} y="-13" width={Lc * 0.8} height="26" rx="3" fill="rgba(125,211,252,0.45)" stroke="#0284c7" strokeWidth="1.6"/>
        <rect x={Lc * 0.14} y="-20" width="7" height="8" fill="#0284c7"/>
        <rect x={Lc * 0.82} y="12" width="7" height="8" fill="#0284c7"/>
      </g>
      <text x={H.x + dx * 0.5 - 6} y={H.y + dy * 0.5 - 30} {...T} fontSize="11" fill="#0369a1" fontWeight="700">réfrigérant droit</text>
      <text x={H.x + dx * 0.14 + 30} y={H.y + dy * 0.14 - 22} {...T} fontSize="10" fill="#0369a1">sortie d’eau</text>
      <text x={H.x + dx * 0.82 - 4} y={H.y + dy * 0.82 + 46} textAnchor="end" {...T} fontSize="10" fill="#0369a1">entrée d’eau</text>
      <path d={`M${H.x + dx * 0.86 - 2} ${H.y + dy * 0.86 + 40} L${H.x + dx * 0.86 + 4} ${H.y + dy * 0.86 + 26}`} stroke="#0284c7" strokeWidth="1.6" fill="none" markerEnd="url(#dist-fl)"/>
      {/* éprouvette : récepteur */}
      <path d={`M${E.x - 17} ${E.y + 10} L${E.x - 17} ${E.y + 112} L${E.x + 17} ${E.y + 112} L${E.x + 17} ${E.y + 10}`} fill="white" stroke="#475569" strokeWidth="2"/>
      <rect x={E.x - 15.5} y={E.y + 112 - 96 * niveauR} width="31" height={96 * niveauR} fill={mel(pt.xDcum, 0.5)}/>
      {niveauR > 0.1 && <Pastilles x={E.x - 14} y={E.y + 112 - 96 * niveauR + 3} w={28} h={Math.max(10, 96 * niveauR - 6)} comp={pt.xDcum} n={Math.max(4, Math.round(14 * niveauR))} graine={11} anim={false} cA={m.coulA} cB={m.coulB} r={2.6}/>}
      {chauffe && <circle className="dist-goutte" cx={E.x} cy={E.y + 4} r="2.6" fill="#0369a1"/>}
      <text x={E.x + 22} y={E.y + 68} {...T} fontWeight="700" fill="#0f172a">distillat</text>
      <text x={E.x + 22} y={E.y + 82} {...T}>x<XiS e="L" suffix={`${NB}=${NB}${nf(pt.xDcum)}`}/></text>
      {/* légende */}
      <g transform={`translate(300 ${frac ? 14 : 124})`}><rect x="-6" y="-6" width="214" height={(N === Infinity || N > 6) ? 76 : 62} rx="6" fill="white" opacity="0.9" stroke="#cbd5e1"/>
        <circle cx="6" cy="6" r="4" fill={m.coulA} stroke="#0f172a" strokeWidth="0.5"/><text x="16" y="10" {...T} fill="#0f172a">{m.A} (A, volatil)</text>
        <circle cx="6" cy="24" r="4" fill={m.coulB} stroke="#0f172a" strokeWidth="0.5"/><text x="16" y="28" {...T} fill="#0f172a">{m.B} (B)</text>
        <text x="6" y="46" {...T} fontSize="10">liquide : exposant L ; vapeur : exposant V</text>
        {(N === Infinity || N > 6) && <text x="6" y="62" {...T} fontSize="10">{N === Infinity ? 'hauteur infinie : 7 étages dessinés' : `${N} plateaux (7 étages dessinés)`}</text>}</g>
    </svg>
  );
}

// ── Diagramme isobare T = f(x, y) avec l'escalier de la colonne ──
export function Diagramme({ m, pt, N, escalierVisible, x0, repere, lien, pointZ }) {
  const W = 480, H = 380, L = 54, R = 14, Tp = 14, Bt = 48, w = W - L - R, h = H - Tp - Bt;
  const Tmin = Math.floor((Math.min(...m.T) - 3) / 5) * 5, Tmax = Math.ceil((Math.max(...m.T) + 3) / 5) * 5;
  const px = x => L + x * w, py = T => Tp + (Tmax - T) / (Tmax - Tmin) * h;
  const eb = m.T.map((T, i) => `${px(i / 400).toFixed(1)},${py(T).toFixed(1)}`).filter((_, i) => i % 2 === 0).join(' ');
  const ro = m.T.map((T, i) => `${px(m.y[i]).toFixed(1)},${py(T).toFixed(1)}`).filter((_, i) => i % 2 === 0).join(' ');
  let et = escalierVisible ? escalier(m, pt.xB, N) : [];
  // près de l'azéotrope les marches deviennent minuscules : on s'arrête dès que la marche est plus petite que 0,012
  // on garde la dernière marche, mais prolongée jusqu'à la vraie limite (l'azéotrope pour N = ∞)
  const iFin = et.findIndex(e => Math.abs(e.y - e.x) < 0.004);
  if (iFin >= 0 && iFin < et.length - 1) { const lim = et[et.length - 1]; et = et.slice(0, iFin + 1); et[iFin] = { ...et[iFin], y: lim.y }; }
  // Tracé pointillé : verticale depuis l'axe jusqu'à la courbe d'ébullition (elle s'y arrête), horizontale jusqu'à la courbe de rosée,
  // puis verticale jusqu'à l'axe des fractions molaires, où l'on lit y.
  const yAxe = Tp + h;
  let chemin = '';
  et.forEach((e, k) => {
    if (k === 0) chemin += `M${px(e.x).toFixed(1)},${yAxe} L${px(e.x).toFixed(1)},${py(e.T).toFixed(1)} `;
    else chemin += `M${px(e.x).toFixed(1)},${py(e.T).toFixed(1)} `;
    chemin += `L${px(e.y).toFixed(1)},${py(e.T).toFixed(1)} `;
    // la verticale descend jusqu'à l'axe pour la dernière marche (lecture de y) ; sinon elle s'arrête sur la courbe d'ébullition
    chemin += `M${px(e.y).toFixed(1)},${py(e.T).toFixed(1)} L${px(e.y).toFixed(1)},${(k === et.length - 1 ? yAxe : py(Teb(m, e.y))).toFixed(1)} `;
  });
  const xl = 0.5, Tlentille = (Teb(m, xl) + Tros(m, xl)) / 2;
  const tt = []; for (let T = Tmin; T <= Tmax; T += (Tmax - Tmin > 40 ? 10 : 5)) tt.push(T);
  const dern = et[et.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Diagramme isobare d’équilibre liquide-vapeur">
      <rect x={L} y={Tp} width={w} height={h} fill="white" stroke="#94a3b8"/>
      {tt.map(T => <g key={T}><line x1={L} x2={L + w} y1={py(T)} y2={py(T)} stroke="#e2e8f0"/><text x={L - 6} y={py(T) + 4} textAnchor="end" fontSize="11" fill="#334155">{T}</text></g>)}
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map(x => <g key={x}><line x1={px(x)} x2={px(x)} y1={Tp} y2={Tp + h} stroke="#e2e8f0"/><text x={px(x)} y={Tp + h + 14} textAnchor="middle" fontSize="11" fill="#334155">{nf(x, 1)}</text></g>)}
      <text x={L + w / 2} y={H - 8} textAnchor="middle" fontSize="12.5" fill="#0f172a" fontWeight="700">fraction molaire en {m.A} : x<XiS e="L" suffix=" (liquide) ou x"/><XiS e="V" suffix=" (vapeur)"/></text>
      <text x="14" y={Tp + h / 2} textAnchor="middle" fontSize="12.5" fill="#0f172a" fontWeight="700" transform={`rotate(-90 14 ${Tp + h / 2})`}>T (°C)</text>
      <polyline points={ro} fill="none" stroke="#dc2626" strokeWidth="2.4"/>
      <polyline points={eb} fill="none" stroke="#2563eb" strokeWidth="2.4"/>
      <text x={px(0.07)} y={py(Tmax - 3 - (Tmax - Tmin) * 0.02)} fontSize="12.5" fontWeight="800" fill="#b91c1c">VAPEUR</text>
      <text x={px(0.12)} y={py(Tmin + (Tmax - Tmin) * 0.06)} fontSize="12.5" fontWeight="800" fill="#1d4ed8">LIQUIDE</text>
      {Tros(m, xl) - Teb(m, xl) > (Tmax - Tmin) * 0.12 && <text x={px(xl)} y={py(Tlentille) + 4} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#475569" stroke="white" strokeWidth="3" paintOrder="stroke">liquide + vapeur</text>}
      <g transform={`translate(${L + w - 128} ${Tp + 10})`}>
        <rect x="-6" y="-6" width="130" height="38" rx="5" fill="white" opacity="0.9" stroke="#cbd5e1"/>
        <line x1="0" x2="18" y1="4" y2="4" stroke="#2563eb" strokeWidth="2.4"/><text x="24" y="8" fontSize="11" fill="#1d4ed8">courbe d’ébullition</text>
        <line x1="0" x2="18" y1="22" y2="22" stroke="#dc2626" strokeWidth="2.4"/><text x="24" y="26" fontSize="11" fill="#b91c1c">courbe de rosée</text>
      </g>
      {m.az && <g><line x1={px(m.az[0])} x2={px(m.az[0])} y1={py(m.az[1])} y2={Tp + h} stroke="#64748b" strokeDasharray="4 3"/>
        <text x={px(m.az[0])} y={py(m.az[1]) + (m.type === 'min' ? 26 : -10)} textAnchor={m.az[0] > 0.6 ? 'end' : 'start'} fontSize="11" fill="#475569" stroke="white" strokeWidth="3" paintOrder="stroke" dx={m.az[0] > 0.6 ? 6 : 4}>azéotrope ({nf(m.az[0], 3)} ; {nf(m.az[1], 1)}{NB}°C)</text>
        <circle cx={px(m.az[0])} cy={py(m.az[1])} r="4.5" fill="#fff" stroke="#0f172a" strokeWidth="2"/></g>}
      {x0 != null && !(escalierVisible && Math.abs(pt.xB - x0) < 1e-6) && <line x1={px(x0)} x2={px(x0)} y1={py(Teb(m, x0))} y2={yAxe} stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="3 3"/>}
      {escalierVisible && <g>
        <path d={chemin} fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeDasharray="5 4"/>
        <circle cx={px(et[0].x)} cy={yAxe} r="4" fill="#2563eb"/>
        <circle cx={px(dern.y)} cy={yAxe} r="4" fill="#dc2626"/>
        <text x={px(et[0].x)} y={yAxe - 8} textAnchor={et[0].x > 0.85 ? 'end' : 'start'} dx={et[0].x > 0.85 ? -4 : 4} fontSize="11" fontWeight="700" fill="#1d4ed8">x<XiS e="L" suffix={` = ${nf(et[0].x)}`}/></text>
        <text x={px(dern.y)} y={yAxe - 22} textAnchor={dern.y > 0.85 ? 'end' : 'start'} dx={dern.y > 0.85 ? -4 : 4} fontSize="11" fontWeight="700" fill="#b91c1c">x<XiS e="V" suffix={` = ${nf(dern.y)}`}/></text>
        <circle cx={px(et[0].x)} cy={py(et[0].T)} r="5.5" fill="#2563eb" stroke="white" strokeWidth="1.5"/>
        <circle cx={px(dern.y)} cy={py(dern.T)} r="5.5" fill="#dc2626" stroke="white" strokeWidth="1.5"/>
        <text x={px(et[0].x) + 8} y={py(et[0].T) + 16} fontSize="11.5" fontWeight="700" fill="#1d4ed8" stroke="white" strokeWidth="3" paintOrder="stroke">bouilleur</text>
        <text x={px(dern.y) - 6} y={py(dern.T) - 12} textAnchor={dern.y > 0.7 ? 'end' : 'start'} fontSize="11.5" fontWeight="700" fill="#b91c1c" stroke="white" strokeWidth="3" paintOrder="stroke">distillat (tête)</text>
      </g>}
      {lien && <g>
        <path d={`M${px(lien.xL)},${py(lien.T)} L${px(lien.yV)},${py(lien.T)} M${px(lien.xL)},${py(lien.T)} L${px(lien.xL)},${yAxe} M${px(lien.yV)},${py(lien.T)} L${px(lien.yV)},${yAxe}`} fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeDasharray="5 4"/>
        <circle cx={px(lien.xL)} cy={yAxe} r="4" fill="#2563eb"/><circle cx={px(lien.yV)} cy={yAxe} r="4" fill="#dc2626"/>
        <circle cx={px(lien.xL)} cy={py(lien.T)} r="5" fill="#2563eb" stroke="white" strokeWidth="1.5"/>
        <circle cx={px(lien.yV)} cy={py(lien.T)} r="5" fill="#dc2626" stroke="white" strokeWidth="1.5"/>
        <text x={px(lien.xL)} y={py(lien.T) + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d4ed8">liquide</text>
        <text x={px(lien.yV)} y={py(lien.T) - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#b91c1c">vapeur</text>
      </g>}
      {pointZ && <g><line x1={px(pointZ.x)} x2={px(pointZ.x)} y1={py(pointZ.T)} y2={yAxe} stroke="#475569" strokeWidth="1.4" strokeDasharray="3 3"/>
        <rect x={px(pointZ.x) - 5} y={py(pointZ.T) - 5} width="10" height="10" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" transform={`rotate(45 ${px(pointZ.x)} ${py(pointZ.T)})`}/></g>}
      {repere && <g>{repere.map((r, i) => <g key={i}><circle cx={px(r.x)} cy={py(r.T)} r="4.5" fill={r.c || '#0f172a'} stroke="white"/></g>)}</g>}
    </svg>
  );
}

// ── Petit graphique d'évolution (comme un enregistrement sous CASSY) ──
function Evolution({ titre, traj, pt, series, ymin, ymax, yLabel, unite }) {
  const W = 330, H = 200, L = 44, R = 10, Tp = 24, Bt = 34, w = W - L - R, h = H - Tp - Bt;
  const fmax = traj[traj.length - 1].f || 1;
  const px = f => L + f / fmax * w, py = v => Tp + (ymax - v) / (ymax - ymin) * h;
  const pas = Math.max(1, Math.floor(traj.length / 120));
  const ts = []; const dy = (ymax - ymin) > 40 ? 10 : (ymax - ymin) > 8 ? 5 : (ymax - ymin) > 0.6 ? 0.2 : 0.1;
  for (let v = ymin; v <= ymax + 1e-9; v += dy) ts.push(v);
  return (
    <div style={{ ...styleBoite, padding: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>{titre}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label={titre}>
        <rect x={L} y={Tp} width={w} height={h} fill="white" stroke="#94a3b8"/>
        {ts.map(v => <g key={v}><line x1={L} x2={L + w} y1={py(v)} y2={py(v)} stroke="#eef2f7"/><text x={L - 5} y={py(v) + 4} textAnchor="end" fontSize="10.5" fill="#334155">{unite === '°C' ? v.toFixed(0) : nf(v, 1)}</text></g>)}
        {[0, 0.25, 0.5, 0.75, 1].map(u => <text key={u} x={px(u * fmax)} y={Tp + h + 13} textAnchor="middle" fontSize="10.5" fill="#334155">{pct(u * fmax)}</text>)}
        <text x={L + w / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="#0f172a">quantité distillée (% de la quantité initiale)</text>
        {series.map(s => <polyline key={s.nom} fill="none" stroke={s.c} strokeWidth="2.2" strokeDasharray={s.tiret ? '5 3' : undefined}
          points={traj.filter((_, i) => i % pas === 0 || i === traj.length - 1).map(p => `${px(p.f).toFixed(1)},${py(Math.min(ymax, Math.max(ymin, p[s.cle]))).toFixed(1)}`).join(' ')}/>)}
        <line x1={px(pt.f)} x2={px(pt.f)} y1={Tp} y2={Tp + h} stroke="#64748b" strokeDasharray="3 3"/>
        {series.map(s => <circle key={s.nom} cx={px(pt.f)} cy={py(Math.min(ymax, Math.max(ymin, pt[s.cle])))} r="4" fill={s.c} stroke="white"/>)}
        {series.map((s, i) => <g key={s.nom} transform={`translate(${L + 6 + i * 112} 12)`}><line x1="0" x2="14" y1="0" y2="0" stroke={s.c} strokeWidth="2.4" strokeDasharray={s.tiret ? '4 2' : undefined}/><text x="18" y="3.5" fontSize="10.5" fill="#0f172a">{s.nom}</text></g>)}
      </svg>
    </div>
  );
}

export function SimulationDistillation({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('distillation-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('distillation-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [mel, setMel] = useState('ew');
  const [x0, setX0] = useState(0.04);
  const [N, setN] = useState(0);
  const [f, setF] = useState(0);
  const [marche, setMarche] = useState(false);
  const [anim, setAnim] = useState(() => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } });
  const m = MELANGES[mel];
  const traj = useMemo(() => trajectoire(m, x0, N), [m, x0, N]);
  const fFin = traj[traj.length - 1].f;
  const pt = pointA(traj, Math.min(f, fFin));
  const enGuide = mode === 'guide';

  // Animation de la chauffe : la quantité distillée augmente jusqu'à la fin de la trajectoire
  const reF = useRef(f); reF.current = f;
  useEffect(() => {
    if (!marche) return undefined;
    let id, t0 = performance.now();
    const boucle = t => {
      const dt = (t - t0) / 1000; t0 = t;
      const nouveau = Math.min(fFin, reF.current + dt * fFin / 22);
      setF(nouveau);
      if (nouveau >= fFin) { setMarche(false); return; }
      id = requestAnimationFrame(boucle);
    };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [marche, fFin]);
  const regler = (fm, fx, fn) => { setMarche(false); setF(0); if (fm !== undefined) setMel(fm); if (fx !== undefined) setX0(fx); if (fn !== undefined) setN(fn); };

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const G = useMemo(() => {
    const ew = MELANGES.ew, x = 0.04, r = {};
    r.x = x; r.w = wDe(ew, x); r.Teb = Teb(ew, x); r.y1 = yEq(ew, x);
    r.y2 = tete(ew, x, 2).y; r.yInf = tete(ew, x, Infinity).y; r.T75 = Tros(ew, 0.48);
    return r;
  }, []);
  const etape = guide.etape;
  const reglageEW = mel === 'ew' && Math.abs(x0 - 0.04) < 1e-9;
  const etapeDe = id => ETAPES.find(e => e.id === id);
  const ETAPES = [
    { id: 'melange', titre: 'Un mélange, pas un corps pur', focus: ['appareil'],
      texte: <>On veut distiller un <strong>vin</strong>, c’est-à-dire (en simplifiant) un <strong>mélange d’eau et d’éthanol</strong>. Dans le ballon, chaque point représente des molécules : <strong style={{ color: '#dc2626' }}>rouges = éthanol</strong>, <strong style={{ color: '#2563eb' }}>bleues = eau</strong>. Le ballon contient très peu de points rouges. L’éthanol bout à 78 °C et l’eau à 100 °C.</>,
      tache: { type: 'qcm', q: 'Quel composé est le plus volatil ?', options: ['L’éthanol : sa température d’ébullition est la plus basse', 'L’eau : elle est la plus abondante dans le ballon', 'Aucun : un mélange n’a pas de composé plus volatil'], bonne: 0,
        expl: 'Plus la température d’ébullition est basse, plus le corps pur est volatil. On notera A le composé le plus volatil (l’éthanol) et B l’autre (l’eau).' } },
    { id: 'regler', titre: 'Régler le vin', focus: ['reglages'],
      texte: <>Un vin à 12° a pour fraction molaire en éthanol <strong><Xi e="L"/> = 0,040</strong>. On commence par une <strong>distillation simple</strong> (aucun plateau, N = 0).</>,
      tache: { type: 'action', ok: reglageEW && N === 0 && f === 0, label: 'Régler le vin, distillation simple', faire: () => regler('ew', 0.04, 0), consigne: reglageEW && N === 0 && f === 0 ? null : 'Cliquez pour régler le mélange eau – éthanol, x = 0,040 et N = 0' } },
    { id: 'massique', titre: 'Fraction molaire ou fraction massique ?', focus: [],
      texte: <>
        <p style={{ margin: '0 0 8px' }}><Xi e="L"/> = 0,040 est une fraction <strong>molaire</strong> : 4 molécules d’éthanol pour 100 molécules. Mais l’éthanol (M<sub>A</sub> = 46 g·mol⁻¹) est plus lourd que l’eau (M<sub>B</sub> = 18 g·mol⁻¹). La fraction <strong>massique</strong> est donc plus grande :</p>
        <div style={{ textAlign: 'center', fontSize: 16, margin: '4px 0 8px' }}>w<sub>A</sub> = <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle' }}><span style={{ borderBottom: '1.5px solid #0f172a', padding: '0 4px' }}>x<sub>A</sub> × M<sub>A</sub></span><span style={{ padding: '0 4px' }}>x<sub>A</sub> × M<sub>A</sub> + (1 − x<sub>A</sub>) × M<sub>B</sub></span></span></div>
        <p style={{ margin: 0 }}>Calculez w<sub>A</sub> (3 chiffres significatifs).</p></>,
      tache: { type: 'num', q: 'Fraction massique w_A du vin', unite: '', vrai: G.w, tol: 0.03, affiche: x => nf(x), cs: 3,
        indice: 'Numérateur : 0,040 × 46 = 1,84. Dénominateur : 1,84 + 0,960 × 18.',
        pieges: [[0.04, 'C’est la fraction molaire. Il faut tenir compte des masses molaires.'], [0.96, 'C’est la fraction molaire en eau, ou 1 − x : on cherche celle de l’éthanol.']],
        expl: <>w<sub>A</sub> = 1,84 / (1,84 + 17,28) ≈ 0,0962 : environ 9,6 % de la masse du vin est de l’éthanol. Ne pas confondre w et x !</> } },
    { id: 'ebullition', titre: 'La température d’ébullition du mélange', focus: ['diagramme'],
      texte: <>Le diagramme donne la température en fonction de la composition. La <strong style={{ color: '#2563eb' }}>courbe d’ébullition</strong> (bleue) donne la température à laquelle un <strong>liquide</strong> de composition x commence à bouillir. Le point bleu, c’est le liquide du ballon (x = 0,040). Lisez sa température.</>,
      tache: { type: 'num', q: 'Température d’ébullition commençante du vin', unite: '°C', vrai: G.Teb, tol: 0.02, affiche: x => nf(x, 1),
        bloque: reglageEW && f === 0 ? null : 'Réglez d’abord le vin (étape précédente).',
        pieges: [[100, 'L’eau pure bout à 100 °C, mais le vin est un mélange : il commence à bouillir plus bas.'], [78.4, 'C’est l’éthanol pur. Le vin contient surtout de l’eau.']],
        expl: 'Un mélange bout en commençant à une température intermédiaire (ici environ 92 °C) et cette température augmente ensuite : contrairement à un corps pur, elle n’est pas constante.' } },
    { id: 'vapeur', titre: 'La première vapeur', focus: ['diagramme'],
      texte: <>À cette température, la première vapeur se forme. Sa composition se lit <strong>à l’horizontale</strong>, sur la <strong style={{ color: '#dc2626' }}>courbe de rosée</strong> (rouge) : c’est le point rouge de la première marche.</>,
      tache: { type: 'num', q: <>Fraction molaire <Xi e="V"/> en éthanol de la première vapeur</>, unite: '', vrai: G.y1, tol: 0.1, affiche: x => nf(x), cs: 3,
        bloque: reglageEW && f === 0 ? null : 'Réglez d’abord le vin (étape 2).',
        expl: 'y ≈ 0,29 : la vapeur est environ 7 fois plus riche en éthanol (29 %) que le liquide (4 %).' } },
    { id: 'diff', titre: 'Liquide et vapeur : deux compositions', focus: ['diagramme', 'appareil'],
      texte: <>Regardez les points du ballon (liquide) et ceux juste au-dessus (vapeur) : ils n’ont <strong>pas la même composition</strong>. C’est toute l’idée de la distillation.</>,
      tache: { type: 'qcm', q: 'La vapeur formée est…', options: ['plus riche en composé le plus volatil que le liquide', 'de même composition que le liquide', 'plus riche en eau que le liquide'], bonne: 0,
        expl: 'La vapeur est enrichie en composé volatil. Si on la condense, on obtient un liquide plus riche en éthanol que le vin de départ. Mais pas de l’éthanol pur !' } },
    { id: 'chauffer', titre: 'Chauffer : distillation simple', focus: ['reglages', 'courbes'],
      texte: <>On chauffe jusqu’à avoir distillé 10 % de la quantité de matière. Appuyez sur « ▶ Chauffer » dans le panneau de réglages, ou cliquez ci-dessous. Surveillez la température du ballon et la composition du distillat instantané.</>,
      tache: { type: 'action', ok: reglageEW && N === 0 && f >= 0.09, label: 'Distiller 10 %', faire: () => { regler('ew', 0.04, 0); setTimeout(() => setF(0.1), 0); }, consigne: reglageEW && N === 0 && f >= 0.09 ? null : 'Chauffez jusqu’à 10 % de quantité distillée' } },
    { id: 'evolution', titre: 'Que se passe-t-il au fil de la distillation ?', focus: ['courbes'],
      texte: <>Comparez les valeurs au départ et maintenant (courbes d’évolution et mesures). Le ballon s’appauvrit en éthanol, et on continue d’y prélever de la vapeur.</>,
      tache: { type: 'qcm', q: 'Au cours d’une distillation simple…', options: ['la température du ballon augmente et le distillat s’appauvrit en éthanol', 'la température du ballon reste constante et le distillat reste identique', 'la température du ballon diminue et le distillat devient pur'], bonne: 0,
        expl: 'Le liquide s’appauvrit en composé volatil, donc sa température d’ébullition monte vers celle de l’eau. La vapeur (donc le distillat) contient de moins en moins d’éthanol. Le composé volatil pur n’est jamais obtenu en distillation simple.' } },
    { id: 'plateaux', titre: 'Ajouter une colonne : 2 plateaux', focus: ['reglages', 'appareil'],
      texte: <>Dans une <strong>distillation fractionnée</strong>, la vapeur monte dans une colonne. À chaque plateau elle <strong>se condense</strong> (le liquide a la composition de la vapeur), puis ce liquide <strong>se revaporise</strong> en donnant une vapeur encore plus riche. Chaque plateau est une marche de l’escalier violet. Réglez N = 2 plateaux, sans chauffer (quantité distillée nulle).</>,
      tache: { type: 'action', ok: reglageEW && N === 2 && f === 0, label: 'Régler N = 2', faire: () => regler('ew', 0.04, 2), consigne: reglageEW && N === 2 && f === 0 ? null : 'Cliquez pour régler N = 2 plateaux' } },
    { id: 'y2', titre: 'La vapeur en tête de colonne', focus: ['diagramme', 'appareil'],
      texte: <>Suivez l’escalier du bas vers le haut : à chaque marche, on lit une nouvelle composition de vapeur sur la courbe de rosée. Lisez la composition de la vapeur en <strong>tête</strong> de colonne.</>,
      tache: { type: 'num', q: <>Fraction molaire <Xi e="V"/> en éthanol du distillat (N = 2)</>, unite: '', vrai: G.y2, tol: 0.04, affiche: x => nf(x), cs: 3,
        bloque: reglageEW && N === 2 && f === 0 ? null : 'Réglez d’abord N = 2 (étape précédente).',
        expl: 'x_A^V ≈ 0,69 : avec seulement 2 plateaux, le distillat est déjà bien plus riche en éthanol qu’avec la distillation simple (0,29).' } },
    { id: 'infinie', titre: 'Une colonne infiniment haute', focus: ['reglages', 'diagramme'],
      texte: <>Augmentons N jusqu’à une colonne <strong>infiniment haute</strong> (N = ∞) : l’escalier monte aussi haut que possible.</>,
      tache: { type: 'action', ok: reglageEW && N === Infinity && f === 0, label: 'Régler N = ∞', faire: () => regler('ew', 0.04, Infinity), consigne: reglageEW && N === Infinity && f === 0 ? null : 'Cliquez pour régler N = ∞' } },
    { id: 'azeo', titre: 'Peut-on obtenir de l’éthanol pur ?', focus: ['diagramme'],
      texte: <>Lisez <Xi e="V"/> en tête de colonne. L’escalier s’arrête sur un point où la courbe d’ébullition et la courbe de rosée se touchent : l’<strong>azéotrope</strong>. Là, la vapeur a la <strong>même composition que le liquide</strong> : plus aucun enrichissement n’est possible.</>,
      tache: { type: 'num', q: <>Composition limite <Xi e="V"/> du distillat (N = ∞)</>, unite: '', vrai: G.yInf, tol: 0.03, affiche: x => nf(x), cs: 3,
        bloque: reglageEW && N === Infinity && f === 0 ? null : 'Réglez d’abord N = ∞ (étape précédente).',
        expl: 'x_A^V ≈ 0,90 (soit environ 95° en degré alcoolique) : on ne dépasse pas l’azéotrope. Une distillation fractionnée à pression atmosphérique ne donne pas d’éthanol pur à partir d’un mélange eau – éthanol.' } },
    { id: 'tete75', titre: 'Contrôler le distillat par la température de tête', focus: ['diagramme'],
      texte: <>Pour un distillat d’au moins 75° (environ <Xi e="V"/> = 0,48 en éthanol), quelle température ne faut-il pas dépasser en tête de colonne ? Lisez-la sur la <strong>courbe de rosée</strong>, pour <Xi e="V"/> = 0,48.</>,
      tache: { type: 'num', q: 'Température maximale en tête de colonne', unite: '°C', vrai: G.T75, tol: 0.012, affiche: x => nf(x, 1),
        pieges: [[91.7, 'C’est la température du liquide dans le ballon. On cherche la température en tête, pour une vapeur à 48 %.']],
        expl: 'Environ 85 °C. Si le thermomètre de tête dépasse cette valeur, les vapeurs qui arrivent sont moins riches en éthanol que 48 % : le distillat est trop dilué.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>liquide et vapeur n’ont pas la même composition (x ≠ y) ; la vapeur est plus riche en composé volatil</li>
        <li>w (massique) ≠ x (molaire) : les masses molaires diffèrent</li>
        <li>distillation simple : une seule marche ; jamais de composé pur ; le distillat s’appauvrit</li>
        <li>distillation fractionnée : une marche par plateau (vaporisation puis condensation) ; limite : l’azéotrope</li></ul>,
      texte: <>Vous savez lire un diagramme binaire isobare, distinguer liquide et vapeur, fractions molaires et massiques, et expliquer la différence entre distillation simple et fractionnée. En exploration libre, essayez le mélange benzène – toluène (sans azéotrope) et chloroforme – acétone (azéotrope à maximum).</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    const k = tire(['ew', 'bt', 'ca']);
    let xx; do { xx = tire([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]); } while (MELANGES[k].az && Math.abs(xx - MELANGES[k].az[0]) < 0.07);
    setDefi({ k, x: xx, n: tire([1, 2, 3]), reps: {}, verifie: false, vu: false });
  }
  function changerMode(md) {
    setMode(md); setMarche(false);
    if (md === 'defi' && !defi) nouveauDefi();
    if (md === 'guide') { setMel('ew'); setX0(0.04); setN(0); setF(0); }
  }
  // Ouverture directe en mode défi (mission d'un escape game) : le défi doit être tiré comme au clic sur l'onglet « Défi »
  useEffect(() => { if (mode === 'defi' && !defi) changerMode('defi'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const voletDefi = defi && (() => {
    const mm = MELANGES[defi.k], bil = bilanColonneInfinie(mm, defi.x);
    const noms = { A: `${mm.A} pur`, B: `${mm.B} pur`, az: 'le mélange azéotropique' };
    const T1 = Teb(mm, defi.x), y1 = yEq(mm, defi.x), yN = tete(mm, defi.x, defi.n).y;
    const Q = [
      { id: 'q1', q: <>Température d’ébullition commençante du liquide (courbe d’ébullition)</>, unite: '°C', vrai: T1, tol: 0.015, aff: nf(T1, 1) },
      { id: 'q2', q: <>Fraction molaire <Xi e="V"/> de la première vapeur formée (distillation simple)</>, unite: '', vrai: y1, tol: 0.1, aff: nf(y1) },
      { id: 'q3', q: <>Fraction molaire <Xi e="V"/> en {mm.A} du distillat avec une colonne de <strong>{defi.n} plateau{defi.n > 1 ? 'x' : ''}</strong> (en tête)</>, unite: '', vrai: yN, tol: 0.1, aff: nf(yN) },
    ];
    const QC = [
      { id: 'q4', q: <>Avec une colonne <strong>infiniment haute</strong>, que contient le <strong>distillat</strong> ?</>, bonne: bil.distillat },
      { id: 'q5', q: <>Que reste-t-il dans le <strong>bouilleur</strong> à la fin ?</>, bonne: bil.residu },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          On distille un mélange <strong>{mm.nom}</strong> (pression 1,013 bar) dont le liquide contient <strong><Xi e="L"/> = {nf(defi.x, 2)}</strong> de {mm.A} (composé A, le plus volatil). Utilisez le diagramme : le point bleu est le liquide du ballon. Donnez vos réponses avec 3 chiffres significatifs.
        </div>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {qu.q}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={e => { const v = e.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 120 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff}{qu.unite ? NB + qu.unite : ''}</div>}
            </div>);
        })}
        {QC.map((qu, k) => {
          const rep = defi.reps[qu.id], ok = rep === qu.bonne;
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 4}. {qu.q} {defi.verifie && (ok ? '✅' : '❌')}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['A', 'B', 'az'].map(o => <button key={o} onClick={() => setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: o } }))} style={stylePetitBouton(rep === o, '#0ea5e9')}>{noms[o]}</button>)}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {noms[qu.bonne]}</div>}
            </div>);
        })}
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Aide : sans azéotrope, on obtient A pur dans le distillat et B pur dans le bouilleur. Avec un azéotrope, le côté du mélange par rapport à l’azéotrope décide.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => { noterDefi(Q.every(qu => proche(lireNombre(defi.reps[qu.id] || ''), qu.vrai, qu.tol)) && QC.every(qu => defi.reps[qu.id] === qu.bonne)); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          {defi.verifie && <button onClick={() => setDefi(d => ({ ...d, vu: !d.vu }))} style={styleBouton(defi.vu, '#7e22ce')}>{defi.vu ? 'Masquer' : 'Voir'} la construction</button>}
          <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
      </div>);
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Pression constante de 1,013 bar</strong> : le diagramme est <em>isobare</em>. Sous pression réduite, toutes les températures baisseraient.</li>
      <li><strong>Mélange binaire</strong> : le vin est assimilé à de l’eau et de l’éthanol ; les sucres, arômes et autres composés sont négligés.</li>
      <li><strong>Équilibre liquide-vapeur atteint à chaque plateau</strong> (plateau théorique) : à chaque étage, la vapeur est en équilibre avec le liquide. Une vraie colonne a un pouvoir séparateur qui dépend de son garnissage, de sa hauteur et du chauffage : trop chauffer détruit l’équilibre.</li>
      <li><strong>Pas de pertes thermiques</strong> : en pratique, même sans colonne, la tête est plus froide que le ballon (88 °C contre 91 °C dans le TP). Ici, en distillation simple, T<sub>tête</sub> = T<sub>ballon</sub>.</li>
      <li><strong>Reflux total, rétention de liquide négligeable, petit débit de distillat</strong> : la composition du bouilleur ne varie qu’en raison de ce qui est soutiré.</li>
      <li><strong>Composition du bouilleur uniforme</strong>, vapeur de tête entièrement condensée.</li>
      <li><strong>Modèle thermodynamique</strong> : les courbes viennent d’un modèle ajusté sur des mesures de la littérature (précision environ 1 °C et 0,01 en fraction molaire pour eau – éthanol ; benzène – toluène idéal ; chloroforme – acétone plus approximatif). Les lectures graphiques d’un élève ont une incertitude de cet ordre.</li>
      <li><strong>Axe du temps</strong> : les courbes d’évolution sont tracées en fonction de la <em>quantité distillée</em>, pas du temps, qui dépend de la puissance de chauffe.</li>
      <li><strong>Fractions molaires x et y</strong> sur le diagramme ; les fractions massiques w se calculent avec les masses molaires ({m.A} : {m.MA} g·mol⁻¹ ; {m.B} : {m.MB} g·mol⁻¹).</li>
    </ul>);
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
    </span>);

  // ── Mesures affichées ──
  const wB = wDe(m, pt.xB), wD = wDe(m, pt.yD), wDc = wDe(m, pt.xDcum);
  const n0 = M0 / (x0 * m.MA + (1 - x0) * m.MB);
  const mD = pt.f * n0 * (pt.xDcum * m.MA + (1 - pt.xDcum) * m.MB);
  const ew = mel === 'ew';
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('courbes') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures à l’instant t</div>
      <LigneMesure nom="T_ballon" valeur={`${nf(pt.TB, 1)}${NB}°C`}/>
      <LigneMesure nom="T_tête" valeur={`${nf(pt.Tt, 1)}${NB}°C`}/>
      <LigneMesure nom={<><Xi e="L"/> (ballon)</>} valeur={`${nf(pt.xB)}${ew ? ` · ${nf(degre(wB), 1)}°` : ''}`} couleur="#1d4ed8"/>
      <LigneMesure nom={<><Xi e="V"/> (vapeur de tête)</>} valeur={`${nf(pt.yD)}${ew ? ` · ${nf(degre(wD), 1)}°` : ''}`} couleur="#b91c1c"/>
      <LigneMesure nom="w_D (massique)" valeur={nf(wD)}/>
      <LigneMesure nom={<><Xi e="L"/> distillat cumulé</>} valeur={`${nf(pt.xDcum)}${ew ? ` · ${nf(degre(wDc), 1)}°` : ''}`}/>
      <LigneMesure nom="distillat" valeur={`${nf(mD, 1)}${NB}g (pour ${M0}${NB}g)`}/>
      <LigneMesure nom="rendement en A" valeur={`${pct(pt.rend, 1)}${NB}%`} couleur="#15803d"/>
      {ew && <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 4 }}>· degré alcoolique (% en volume à 20 °C) calculé à partir des masses volumiques.</div>}
    </div>);

  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {Object.values(MELANGES).map(o => <button key={o.id} disabled={enGuide} onClick={() => { regler(o.id, o.x0, undefined); }}
          style={{ ...stylePetitBouton(mel === o.id, '#0891b2'), opacity: enGuide && mel !== o.id ? 0.5 : 1 }}>{o.nom}</button>)}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>{m.note}</div>
      <Curseur nom={<><Xi e="L"/> initial ({m.A})</>} valeur={x0} onChange={v => regler(undefined, v)} min={0.01} max={0.99} pas={0.01} decimales={2} couleur="#0891b2"/>
      {ew && <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>soit {nf(100 * wDe(m, x0), 1)}{NB}% en masse, environ {nf(degre(wDe(m, x0)), 0)}° (un vin : 12°, x = 0,04).</div>}
      <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 3 }}>Nombre de plateaux N</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {NS.map(n => <button key={n} onClick={() => { setMarche(false); setF(0); setN(n); }} style={stylePetitBouton(N === n, '#7c3aed')}>{nomN(n)}</button>)}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 8 }}>{N === 0 ? 'N = 0 : distillation simple (pas de colonne).' : N === Infinity ? 'N = ∞ : colonne infiniment haute.' : `N = ${N} : distillation fractionnée (${N} plateau${N > 1 ? 'x' : ''}).`}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { if (f >= fFin - 1e-9) setF(0); setMarche(v => !v); }} style={styleBouton(true, marche ? '#b45309' : '#16a34a')}>{marche ? '⏸ Pause' : '▶ Chauffer'}</button>
        <button onClick={() => { setMarche(false); setF(0); }} style={styleBouton(false)}>↺ Recommencer</button>
        <label style={{ fontSize: 12.5, color: KIT.txt2, display: 'flex', alignItems: 'center', gap: 4 }}><input type="checkbox" checked={anim} onChange={e => setAnim(e.target.checked)}/> animer</label>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Quantité distillée : {pct(pt.f, 1)}{NB}%</div>
        <input type="range" min={0} max={fFin} step={fFin / 400} value={Math.min(f, fFin)} aria-label="Quantité distillée"
          onChange={e => { setMarche(false); setF(parseFloat(e.target.value)); }} style={{ width: '100%', accentColor: '#16a34a' }}/>
      </div>
    </div>);

  const lectureDefi = mode === 'defi' && defi;
  const mDefi = defi ? MELANGES[defi.k] : null;
  const diagramme = mode === 'defi' && defi ? (
    <div style={styleBoite}>
      <Diagramme m={mDefi} pt={{ xB: defi.x }} N={defi.n} escalierVisible={defi.vu} x0={defi.x} repere={[{ x: defi.x, T: Teb(mDefi, defi.x), c: '#2563eb' }]}/>
    </div>
  ) : (
    <div style={{ ...styleBoite, ...cadre('diagramme') }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Diagramme isobare {m.nom} (1,013 bar)</div>
      <Diagramme m={m} pt={pt} N={N} escalierVisible x0={x0}/>
      <div style={{ fontSize: 12, color: KIT.txt2 }}>Escalier violet : chaque marche = une vaporisation (horizontale, jusqu’à la courbe de rosée) puis une condensation (verticale, jusqu’à la courbe d’ébullition).</div>
    </div>);

  const TXT2 = KIT.txt2;
  void lectureDefi; void TXT2;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dist-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dist-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dist-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .dist-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr); }
        .dist-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .dist-l1.cote, .dist-pri { grid-template-columns: minmax(0, 1fr); } }
        @keyframes dist-ja { 0%,100% { transform: translate(0,0); } 50% { transform: translate(2px,-3px); } }
        @keyframes dist-jb { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-2px,2px); } }
        @keyframes dist-up { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(var(--d, -60px)); opacity: 0; } }
        .dist-a { animation: dist-ja 1.3s ease-in-out infinite; }
        .dist-b { animation: dist-jb 1.7s ease-in-out infinite; }
        .dist-monte { animation: dist-up 2.8s linear infinite; }
        @keyframes dist-chute { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(22px); opacity: 0; } }
        .dist-goutte { animation: dist-chute 1s ease-in infinite; }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Distillation simple et fractionnée</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un mélange binaire n’a pas la même composition à l’état liquide et à l’état vapeur : c’est ce qui permet de le séparer. On distingue aussi fraction <strong>molaire</strong> (x, y) et fraction <strong>massique</strong> (w).</div>
      <div className={`dist-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {mode === 'defi' ? <div style={{ ...styleBoite, marginBottom: 12 }}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></></div> : null}
          {mode !== 'defi' ? (
            <div className={`dist-pri${mode !== 'explore' ? ' pile' : ''}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ ...styleBoite, ...cadre('appareil') }}><Appareil m={m} N={N} pt={pt} fFin={fFin} anim={anim} chauffe={marche}/></div>
                {mesures}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{diagramme}{reglages}</div>
            </div>
          ) : diagramme}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? panneauHypo : null}
      </div>
      {mode !== 'defi' && (
        <div className="dist-l2">
          <div style={cadre('courbes')}><Evolution titre="Températures" traj={traj} pt={pt} ymin={Math.floor((Math.min(...m.T) - 2) / 5) * 5} ymax={Math.ceil((Math.max(...m.T) + 2) / 5) * 5} unite="°C"
            series={[{ nom: 'T ballon', cle: 'TB', c: '#ea580c' }, { nom: 'T tête', cle: 'Tt', c: '#0284c7' }]}/></div>
          <div style={cadre('courbes')}><Evolution titre="Compositions (fractions molaires en A)" traj={traj} pt={pt} ymin={0} ymax={1} unite=""
            series={[{ nom: 'x ballon', cle: 'xB', c: '#2563eb' }, { nom: 'y tête', cle: 'yD', c: '#dc2626' }, { nom: 'x cumulé', cle: 'xDcum', c: '#15803d', tiret: true }]}/></div>
        </div>
      )}
      {mode === 'explore' && (
        <div className="dist-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Eau – éthanol, x = 0,04, N = 0 : comparez la composition du liquide (ballon) et celle de la vapeur. Chauffez : que devient la température du ballon ?</li>
              <li>Augmentez N : que devient la composition de la vapeur en tête ? Où l’escalier s’arrête-t-il ?</li>
              <li>Avec N = ∞ pour eau – éthanol, partez de x = 0,70 puis de x = 0,95 : que reste-t-il dans le bouilleur ? Que contient le distillat ?</li>
              <li>Benzène – toluène (sans azéotrope) : peut-on obtenir du benzène pur ? Combien de plateaux faut-il pour dépasser 0,95 ?</li>
              <li>Chloroforme – acétone (azéotrope à maximum de température) : partez de x = 0,20 puis de x = 0,60 avec N = ∞ et comparez.</li>
              <li>Comparez la fraction massique w et la fraction molaire x pour un même mélange.</li>
            </ul>
          </div>
          {panneauHypo}
          <ARetenir>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>liquide et vapeur : deux compositions différentes (x ≠ y) ; la vapeur est plus riche en composé volatil</li>
              <li>simple : une seule marche, jamais de composé pur, distillat qui s’appauvrit</li>
              <li>fractionnée : une marche par plateau ; limite = azéotrope, s’il existe</li>
              <li>molaire (x) ≠ massique (w)</li>
            </ul>
          </ARetenir>
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
