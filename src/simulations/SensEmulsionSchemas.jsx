// Schémas et animations de la simulation 221 « Sens de l'émulsion ». Tous en SVG ; textes de 12 à 16 ; largeur 100 % plafonnée.
// Animations en SMIL, désactivées si l'élève demande moins d'animations (prefers-reduced-motion).
import { useState } from "react";
import * as M from "./sensEmulsionModele";

const C = { eau: '#dbeafe', eauB: '#60a5fa', huile: '#fde68a', huileR: '#f87171', trait: '#475569', txt: '#0f172a', gris: '#64748b', creme: '#fff4da',
  vert: '#15803d', orange: '#b45309', bleu: '#1d4ed8', rouge: '#b91c1c', violet: '#7c3aed' };
const T = (x, y, s, o = {}) => <text key={`${x}-${y}-${s}`} x={x} y={y} fontSize={o.size ?? 14} fontWeight={o.gras ? 700 : 400} fill={o.fill ?? C.txt} textAnchor={o.anchor ?? 'middle'} fontFamily="inherit">{s}</text>;
function base(w, h, label, children, max = 460) {
  return <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', maxWidth: max, margin: '0 auto' }}>{children}</svg>;
}
function useReduit() {
  const [r] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  return r;
}
function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Couleur conventionnelle d'une phase : jaune = huile, bleu très pâle = eau ; avec colorant : rouge (rouge Soudan, huile) ou bleu franc (bleu de méthylène, eau)
const teinte = (phase, colorant) => {
  const c = M.couleurDe(colorant, phase);
  if (phase === 'huile') return c === 'rouge' ? C.huileR : C.huile;
  return c === 'bleu' ? C.eauB : C.eau;
};

// ---- réseau de gouttes d'une coupe (même nombre de gouttes, mêmes positions : seule leur taille change avec φ) ----
const cacheSites = {};
function sites(W, H, d, graine = 7) {
  const cle = `${W}-${H}-${d}-${graine}`;
  if (cacheSites[cle]) return cacheSites[cle];
  const h = d * 0.866, rows = Math.floor((H - d * 0.2) / h), cols = Math.floor((W - d * 0.5) / d);
  const r = alea(graine), L = [];
  const x0 = (W - (cols + 0.5) * d) / 2 + d / 2, y0 = (H - (rows - 1) * h) / 2;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++)
    L.push({ x: x0 + j * d + (i % 2 ? d / 2 : 0) + (r() - 0.5) * d * 0.08, y: y0 + i * h + (r() - 0.5) * d * 0.08, f: 0.93 + r() * 0.14, ph: r() * 4, du: 2.2 + r() * 2.6, ang: r() * 6.28, i, j });
  cacheSites[cle] = { L, rows, cols, d };
  return cacheSites[cle];
}
// rayon moyen d'une goutte pour une fraction φ (cellule du réseau triangulaire : aire √3/2 · d²)
const rayon = (phi, d) => d * Math.sqrt(Math.max(phi, 0.002) * 0.866 / Math.PI);
function hexagone(x, y, a, f) {
  const R = (a * f) / Math.cos(Math.PI / 6);
  return Array.from({ length: 6 }, (_, k) => { const t = Math.PI / 6 + k * Math.PI / 3; return `${(x + R * Math.cos(t)).toFixed(1)},${(y + R * Math.sin(t)).toFixed(1)}`; }).join(' ');
}

// Coupe microscopique : fond = phase continue, gouttes = phase dispersée. φ = fraction volumique de phase dispersée.
export function Coupe({ id, x = 0, y = 0, w = 220, h = 170, type, phi, colorant = 'aucun', anim = true, d = 26, cadre = true, ions = null }) {
  const reduit = useReduit(), { L } = sites(w, h, d);
  const dispersee = M.phaseDispersee(type), continue_ = M.phaseContinue(type);
  const fondC = teinte(continue_, colorant), gouteC = teinte(dispersee, colorant);
  const trait = dispersee === 'huile' ? (colorant === 'RS' || colorant === 'RS+BM' ? '#b91c1c' : '#ca8a04') : (colorant === 'BM' || colorant === 'RS+BM' ? '#1d4ed8' : '#60a5fa');
  const rm = rayon(phi, d), hex = phi >= M.PHI_M;
  const a = d * Math.sqrt(phi) / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <clipPath id={`cp-${id}`}><rect x="0" y="0" width={w} height={h} rx="12"/></clipPath>
      <g clipPath={`url(#cp-${id})`}>
        <rect x="0" y="0" width={w} height={h} fill={fondC}/>
        {L.map((s, k) => {
          const gap = Math.max(0, d - 2 * rm * s.f), A = Math.min(3.4, Math.max(0.5, gap * 0.32));
          const dx = (Math.cos(s.ang) * A).toFixed(1), dy = (Math.sin(s.ang) * A).toFixed(1);
          const forme = hex
            ? <polygon points={hexagone(s.x, s.y, a, s.f)} fill={gouteC} stroke={gouteC} strokeWidth="2.4" strokeLinejoin="round"/>
            : <circle cx={s.x} cy={s.y} r={rm * s.f} fill={gouteC} stroke={trait} strokeWidth="1"/>;
          return <g key={k}>{forme}
            {anim && !reduit && <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} ${dy};${-dx} ${-dy};0 0`} dur={`${s.du.toFixed(1)}s`} begin={`-${s.ph.toFixed(1)}s`} repeatCount="indefinite"/>}
          </g>;
        })}
        {ions && ions({ L, rm })}
      </g>
      {cadre && <rect x="0" y="0" width={w} height={h} rx="12" fill="none" stroke={C.trait} strokeWidth="2"/>}
    </g>);
}
function Legende({ x, y, colorant = 'aucun' }) {
  const item = (cx, couleur, nom) => <g key={nom}><rect x={cx} y={y - 10} width="14" height="14" rx="3" fill={couleur} stroke={C.trait} strokeWidth="1"/>{T(cx + 19, y + 2, nom, { size: 13, anchor: 'start' })}</g>;
  const nHuile = colorant === 'RS' || colorant === 'RS+BM' ? 'huile (rouge Soudan)' : 'huile', nEau = colorant === 'BM' || colorant === 'RS+BM' ? 'eau (bleu de méthylène)' : 'eau';
  return <g>{item(x, teinte('huile', colorant), nHuile)}{item(x + (colorant === 'aucun' ? 76 : 150), teinte('eau', colorant), nEau)}</g>;
}

// ---- coupe seule, avec légende (utilisée seule ou en carte) ----
export function SvgCoupe({ id = 'seule', type, phi, colorant = 'aucun', titre, anim = true }) {
  return base(300, 226, `coupe au microscope d’une émulsion ${type} avec ${Math.round(phi * 100)} % de phase dispersée`, <>
    {titre && T(150, 18, titre, { size: 15, gras: true })}
    <Coupe id={id} x={40} y={28} w={220} h={160} type={type} phi={phi} colorant={colorant} anim={anim}/>
    <Legende x={colorant === 'aucun' ? 66 : 28} y={210} colorant={colorant}/>
  </>, 360);
}

// ---- aspect à l'œil nu d'une émulsion colorée ----
const aspectMacro = colorant => ({ aucun: '#fff4da', RS: '#fbd0c8', BM: '#cfe1fb', 'RS+BM': '#d8c4ea' }[colorant] ?? '#fff4da');

// ---- lien micro-macro : le pot à l'œil nu, une loupe, la coupe au microscope, et la bille qui tombe ----
const dureeBille = eta => 0.7 + 1.6 * Math.log10(Math.max(1, eta / 0.005));
export function SvgMicroMacro({ type, phi, colorant = 'aucun', bille = true, titreMicro = 'Au microscope', anim = true, legende = true }) {
  const reduit = useReduit(), eta = M.viscosite(type, phi), t = dureeBille(eta), tot = t + 1.2, f = t / tot;
  const horsM = M.horsModele(phi);
  return base(420, 236, `à gauche, le pot d’émulsion vu à l’œil nu avec une bille qui tombe ${eta > 0.2 ? 'lentement' : 'assez vite'} ; à droite, la coupe au microscope : ${type}, ${Math.round(phi * 100)} % de phase dispersée`, <>
    {T(80, 22, 'À l’œil nu', { size: 15, gras: true })}
    <path d="M26 66 L26 196 Q26 208 38 208 L122 208 Q134 208 134 196 L134 66" fill="none" stroke={C.trait} strokeWidth="3"/>
    <path d="M28 88 L28 196 Q28 206 38 206 L122 206 Q132 206 132 196 L132 88 Z" fill={aspectMacro(colorant)}/>
    <line x1="22" y1="66" x2="138" y2="66" stroke={C.trait} strokeWidth="3" strokeLinecap="round"/>
    <path d="M28 88 Q54 83 80 88 T132 88" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2"/>
    {bille && <circle cx="80" cy="100" r="8" fill="#334155" stroke="#0f172a" strokeWidth="1.5">
      {anim && !reduit && <animate attributeName="cy" values="100;190;190" keyTimes={`0;${f.toFixed(3)};1`} dur={`${tot.toFixed(2)}s`} repeatCount="indefinite"/>}
    </circle>}
    {!(anim && !reduit) && bille && <circle cx="80" cy="190" r="8" fill="#334155" opacity=".35"/>}
    {T(80, 230, bille ? (eta < 0.1 ? 'la bille tombe vite' : eta < 0.5 ? 'la bille tombe moins vite' : 'la bille tombe lentement') : '', { size: 13, fill: C.gris })}
    <circle cx="104" cy="150" r="16" fill="none" stroke={C.orange} strokeWidth="2" strokeDasharray="4 3"/>
    <line x1="119" y1="141" x2="184" y2="38" stroke={C.orange} strokeWidth="1.5" strokeDasharray="4 3"/>
    <line x1="118" y1="160" x2="184" y2="202" stroke={C.orange} strokeWidth="1.5" strokeDasharray="4 3"/>
    {T(300, 22, titreMicro, { size: 15, gras: true })}
    <Coupe id="mm" x={188} y={34} w={224} h={172} type={type} phi={phi} colorant={colorant} anim={anim}/>
    {legende && T(300, 228, horsM ? 'gouttes déformées, serrées en polyèdres' : `${Math.round(phi * 100)} % de phase dispersée (${M.phaseDispersee(type)})`, { size: 13, fill: C.gris })}
  </>, 460);
}

// ---- test de dilution : une goutte d'émulsion dans l'eau, ou dans l'huile ----
function Becher({ x, milieu, se, nom, reduit }) {
  const liq = milieu === 'eau' ? C.eau : C.huile, D = 8, f1 = 1.0 / D;
  const nuage = Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * 6.28 + 0.4, R = 14 + (k % 4) * 11; return { dx: Math.cos(a) * R * 1.25, dy: Math.sin(a) * R * 0.9 + 8, r: 3 + (k % 3) }; });
  return (
    <g transform={`translate(${x} 0)`}>
      {T(70, 20, nom, { size: 14, gras: true })}
      <path d="M10 62 L10 166 Q10 176 20 176 L120 176 Q130 176 130 166 L130 62" fill="none" stroke={C.trait} strokeWidth="3"/>
      <path d="M12 76 L12 166 Q12 174 20 174 L120 174 Q128 174 128 166 L128 76 Z" fill={liq}/>
      <rect x="12" y="76" width="116" height="98" rx="6" fill="#fffaf0" opacity="0">
        {!reduit && se && <animate attributeName="opacity" values="0;0;0.62;0.62;0" keyTimes="0;0.2;0.42;0.9;1" dur={`${D}s`} repeatCount="indefinite"/>}
      </rect>
      {se && reduit && <rect x="12" y="76" width="116" height="98" rx="6" fill="#fffaf0" opacity="0.55"/>}
      {/* la goutte d'émulsion */}
      {!se && <g>
        <ellipse cx="70" cy={reduit ? 84 : 36} rx="12" ry="9" fill={C.creme} stroke={C.trait} strokeWidth="2">
          {!reduit && <animate attributeName="cy" values={`34;84;84;84`} keyTimes={`0;${f1 * 1.4};0.92;1`} dur={`${D}s`} repeatCount="indefinite"/>}
          {!reduit && <animate attributeName="opacity" values="1;1;1;0" keyTimes="0;0.5;0.92;1" dur={`${D}s`} repeatCount="indefinite"/>}
        </ellipse>
      </g>}
      {se && <g>
        <circle cx="70" cy={reduit ? 200 : 36} r="9" fill={C.creme} stroke={C.trait} strokeWidth="2">
          {!reduit && <animate attributeName="cy" values="34;80;80" keyTimes={`0;${f1 * 1.2};1`} dur={`${D}s`} repeatCount="indefinite"/>}
          {!reduit && <animate attributeName="opacity" values="1;1;0;0" keyTimes={`0;${f1 * 1.2};${f1 * 1.6};1`} dur={`${D}s`} repeatCount="indefinite"/>}
        </circle>
        {nuage.map((p, k) => <circle key={k} cx={70} cy={80} r={p.r} fill={C.creme} stroke={C.trait} strokeWidth="1" opacity={reduit ? 0.8 : 0}>
          {!reduit && <animate attributeName="cx" values={`70;70;${70 + p.dx};${70 + p.dx}`} keyTimes={`0;${f1 * 1.3};0.45;1`} dur={`${D}s`} repeatCount="indefinite"/>}
          {!reduit && <animate attributeName="cy" values={`80;80;${80 + p.dy};${80 + p.dy}`} keyTimes={`0;${f1 * 1.3};0.45;1`} dur={`${D}s`} repeatCount="indefinite"/>}
          {!reduit && <animate attributeName="opacity" values="0;0;0.9;0.9;0" keyTimes={`0;${f1 * 1.3};0.3;0.88;1`} dur={`${D}s`} repeatCount="indefinite"/>}
        </circle>)}
      </g>}
      {T(70, 200, se ? 'la goutte se disperse' : 'la goutte reste en bloc', { size: 13.5, gras: true, fill: se ? C.vert : C.orange })}
    </g>);
}
export function SvgDilution({ type, milieux = ['eau', 'huile'], nom = 'émulsion' }) {
  const reduit = useReduit(), un = milieux.length === 1;
  return base(un ? 160 : 300, 214, `test de dilution de l’${nom} : une goutte déposée dans ${milieux.map(m => m === 'eau' ? 'l’eau' : 'l’huile').join(' puis dans ')}`, <>
    {milieux.map((m, k) => <Becher key={m} x={un ? 10 : 10 + k * 150} milieu={m} se={M.sedisperse(type, m)} nom={`dans ${m === 'eau' ? 'l’eau' : 'l’huile'}`} reduit={reduit}/>)}
  </>, un ? 220 : 440);
}

// ---- conductimétrie : sonde dans l'émulsion, afficheur, et agrandissement montrant le chemin des ions ----
const lectureConduct = M.lectureConduct;
export function SvgConductimetre({ type, phi, cmmol, forcerSigma = null, anim = true, peu = false }) {
  const reduit = useReduit(), s = forcerSigma ?? M.conductivite(type, phi, cmmol), HE = type === 'H/E';
  const ionsFn = ({ L }) => {
    const pts = [];
    if (HE) { for (const q of L) if (q.j < (L.length > 0 ? 99 : 0) && (q.i + q.j) % 3 === 0) pts.push({ x: q.x + 13, y: q.y + 0, s: (q.i + q.j) % 2 ? '+' : '−' }); }
    else for (const q of L) if ((q.i * 3 + q.j) % 4 === 0) pts.push({ x: q.x, y: q.y, s: (q.i + q.j) % 2 ? '+' : '−', dedans: true });
    return (peu ? pts.slice(0, 3) : pts).map((p, k) => <g key={k}>
      <circle cx={p.x} cy={p.y} r="5" fill={p.s === '+' ? C.bleu : C.rouge} stroke="#fff" strokeWidth="1"/>
      <text x={p.x} y={p.y + 3.5} fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">{p.s}</text>
      {anim && !reduit && HE && <animateTransform attributeName="transform" type="translate" values={p.s === '+' ? '0 0;14 0;0 0' : '0 0;-14 0;0 0'} dur="2.4s" begin={`-${(k % 5) * 0.4}s`} repeatCount="indefinite"/>}
      {anim && !reduit && !HE && <animateTransform attributeName="transform" type="translate" values="0 0;1.5 -1;-1.5 1;0 0" dur="2s" begin={`-${(k % 4) * 0.5}s`} repeatCount="indefinite"/>}
    </g>);
  };
  return base(420, 244, `conductimètre dans une émulsion ${type} : lecture ${lectureConduct(s)} ; à droite, agrandissement montrant ${HE ? 'les ions qui circulent dans la phase aqueuse continue' : 'les ions prisonniers des gouttes d’eau, isolées par l’huile'}`, <>
    <path d="M24 92 L24 212 Q24 224 36 224 L152 224 Q164 224 164 212 L164 92" fill="none" stroke={C.trait} strokeWidth="3"/>
    <path d="M26 112 L26 212 Q26 222 36 222 L152 222 Q162 222 162 212 L162 112 Z" fill={aspectMacro('aucun')}/>
    <rect x="64" y="40" width="9" height="150" rx="3" fill="#94a3b8" stroke={C.trait} strokeWidth="1.5"/>
    <rect x="114" y="40" width="9" height="150" rx="3" fill="#94a3b8" stroke={C.trait} strokeWidth="1.5"/>
    <path d="M68 40 L68 24 L200 24 M118 40 L118 30 L200 30" fill="none" stroke={C.trait} strokeWidth="2.5"/>
    <rect x="200" y="8" width="212" height="62" rx="10" fill="#1e293b" stroke="#0f172a" strokeWidth="2"/>
    <rect x="210" y="16" width="192" height="30" rx="6" fill="#d1fae5"/>
    {T(306, 38, lectureConduct(s), { size: 20, gras: true, fill: '#064e3b' })}
    {T(306, 62, 'conductimètre', { size: 12.5, fill: '#cbd5e1' })}
    <circle cx="92" cy="160" r="15" fill="none" stroke={C.orange} strokeWidth="2" strokeDasharray="4 3"/>
    <line x1="106" y1="152" x2="226" y2="100" stroke={C.orange} strokeWidth="1.5" strokeDasharray="4 3"/>
    <line x1="106" y1="170" x2="226" y2="228" stroke={C.orange} strokeWidth="1.5" strokeDasharray="4 3"/>
    <Coupe id="cd" x={226} y={96} w={186} h={136} type={type} phi={Math.min(phi, 0.45)} anim={anim} d={22} ions={ionsFn}/>
  </>, 460);
}

// ---- courbe : viscosité relative en fonction de la fraction de phase dispersée (échelle logarithmique) ----
export function SvgViscoCourbe({ phi }) {
  const X0 = 46, X1 = 286, Y0 = 20, Y1 = 150, PMAX = 0.8, LMAX = 2.7;
  const px = p => X0 + (p / PMAX) * (X1 - X0), py = r => Y1 - (Math.log10(r) / LMAX) * (Y1 - Y0);
  const pts = Array.from({ length: 36 }, (_, k) => { const p = (k / 35) * M.PHI_MODELE; return `${px(p).toFixed(1)},${py(M.viscositeRelative(p)).toFixed(1)}`; }).join(' ');
  const rP = M.viscositeRelative(phi);
  return base(300, 204, `courbe : la viscosité de l’émulsion augmente très vite quand la fraction de phase dispersée dépasse 50 %. Point actuel : ${Math.round(phi * 100)} %`, <>
    <rect x={px(M.PHI_MODELE)} y={Y0} width={X1 - px(M.PHI_MODELE)} height={Y1 - Y0} fill="#e2e8f0"/>
    {T((px(M.PHI_MODELE) + X1) / 2, Y0 + 24, 'hors', { size: 12, fill: C.gris })}{T((px(M.PHI_MODELE) + X1) / 2, Y0 + 38, 'modèle', { size: 12, fill: C.gris })}
    <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke={C.trait} strokeWidth="2"/><line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke={C.trait} strokeWidth="2"/>
    {[0, 0.2, 0.4, 0.6, 0.8].map(p => <g key={p}><line x1={px(p)} y1={Y1} x2={px(p)} y2={Y1 + 5} stroke={C.trait}/>{T(px(p), Y1 + 19, `${Math.round(p * 100)}`, { size: 12.5 })}</g>)}
    {[1, 10, 100, 1000].map(r => <g key={r}><line x1={X0 - 5} y1={py(r)} x2={X0} y2={py(r)} stroke={C.trait}/><line x1={X0} y1={py(r)} x2={X1} y2={py(r)} stroke="#cbd5e1" strokeDasharray="3 3"/>{T(X0 - 8, py(r) + 4, String(r), { size: 12.5, anchor: 'end' })}</g>)}
    <line x1={px(M.PHI_M)} y1={Y0} x2={px(M.PHI_M)} y2={Y1} stroke={C.orange} strokeWidth="1.5" strokeDasharray="5 3"/>
    {T(px(M.PHI_M) - 4, Y0 + 12, 'empilement compact : 74 %', { size: 11.5, fill: C.orange, anchor: 'end' })}
    <polyline points={pts} fill="none" stroke={C.violet} strokeWidth="3" strokeLinejoin="round"/>
    <circle cx={px(Math.min(phi, PMAX))} cy={py(rP)} r="7" fill={C.violet} stroke="#fff" strokeWidth="2"/>
    {T((X0 + X1) / 2, 196, 'fraction de phase dispersée φ (%)', { size: 13 })}
    <text transform={`translate(12 ${(Y0 + Y1) / 2}) rotate(-90)`} fontSize="12.5" fill={C.txt} textAnchor="middle" fontFamily="inherit">viscosité relative (log)</text>
  </>, 360);
}

// ======================= cartes « À retenir » =======================
export function SvgCarteDilution() {
  const bec = (x, y, liq, se, nom) => <g key={nom + x}>
    <path d={`M${x} ${y} L${x} ${y + 50} Q${x} ${y + 58} ${x + 8} ${y + 58} L${x + 62} ${y + 58} Q${x + 70} ${y + 58} ${x + 70} ${y + 50} L${x + 70} ${y}`} fill="none" stroke={C.trait} strokeWidth="2.5"/>
    <path d={`M${x + 1.5} ${y + 14} L${x + 1.5} ${y + 50} Q${x + 1.5} ${y + 56.5} ${x + 8} ${y + 56.5} L${x + 62} ${y + 56.5} Q${x + 68.5} ${y + 56.5} ${x + 68.5} ${y + 50} L${x + 68.5} ${y + 14} Z`} fill={liq}/>
    {se ? <g>{Array.from({ length: 9 }, (_, k) => <circle key={k} cx={x + 14 + (k % 3) * 21} cy={y + 24 + Math.floor(k / 3) * 12} r="3.4" fill={C.creme} stroke={C.trait} strokeWidth="1"/>)}</g>
      : <ellipse cx={x + 35} cy={y + 22} rx="14" ry="9" fill={C.creme} stroke={C.trait} strokeWidth="2"/>}
    {T(x + 35, y + 76, se ? 'se disperse' : 'reste en bloc', { size: 12.5, gras: true, fill: se ? C.vert : C.orange })}
    {T(x + 35, y - 6, nom, { size: 12.5 })}
  </g>;
  return base(300, 250, 'test de dilution : une émulsion H/E se disperse dans l’eau et reste en bloc dans l’huile ; une émulsion E/H se disperse dans l’huile et reste en bloc dans l’eau', <>
    {T(150, 16, 'Une goutte d’émulsion dans…', { size: 14, gras: true })}
    {T(80, 44, 'émulsion H/E', { size: 13.5, gras: true, fill: C.bleu })}{T(220, 44, 'émulsion E/H', { size: 13.5, gras: true, fill: C.orange })}
    {bec(8, 64, C.eau, true, 'l’eau')}{bec(82, 64, C.huile, false, 'l’huile')}
    {bec(150, 64, C.eau, false, 'l’eau')}{bec(224, 64, C.huile, true, 'l’huile')}
    {T(150, 176, 'L’émulsion se mélange au liquide', { size: 13.5, gras: true })}{T(150, 194, 'qui est miscible avec sa phase continue.', { size: 13.5 })}
    <rect x="22" y="206" width="256" height="30" rx="8" fill="#ecfdf5" stroke={C.vert} strokeWidth="1.5"/>{T(150, 226, 'dilution : le test le plus fiable', { size: 14, gras: true, fill: C.vert })}
  </>, 340);
}
export function SvgCarteColorants() {
  return base(300, 262, 'colorants : à gauche une émulsion H/E avec un fond bleu et des gouttes rouges, à droite une émulsion E/H avec un fond rouge et des gouttes bleues', <>
    {T(150, 16, 'Les deux colorants ensemble, au microscope', { size: 14, gras: true })}
    <Coupe id="cc1" x={6} y={30} w={138} h={108} type="H/E" phi={0.3} colorant="RS+BM" d={20} anim={false}/>
    <Coupe id="cc2" x={156} y={30} w={138} h={108} type="E/H" phi={0.3} colorant="RS+BM" d={20} anim={false}/>
    {T(75, 156, 'fond bleu : eau', { size: 13, gras: true, fill: C.bleu })}{T(75, 172, 'émulsion H/E', { size: 13, gras: true })}
    {T(225, 156, 'fond rouge : huile', { size: 13, gras: true, fill: C.rouge })}{T(225, 172, 'émulsion E/H', { size: 13, gras: true })}
    {T(150, 198, 'rouge Soudan : colore l’huile', { size: 13.5, fill: C.rouge, gras: true })}{T(150, 216, 'bleu de méthylène : colore l’eau', { size: 13.5, fill: C.bleu, gras: true })}
    <rect x="10" y="226" width="280" height="30" rx="8" fill="#fff7ed" stroke={C.orange} strokeWidth="1.5"/>{T(150, 246, 'le fond coloré est la phase continue', { size: 13.5, gras: true, fill: C.orange })}
  </>, 340);
}
export function SvgCarteConduct() {
  const X0 = 20, X1 = 280, Y = 92, px = v => X0 + ((Math.log10(v) + 1) / 5) * (X1 - X0);   // 0,1 à 10 000 µS/cm
  return base(300, 218, 'échelle logarithmique de la conductivité : en dessous de 1 µS/cm émulsion E/H, entre 1 et 100 µS/cm on ne conclut pas, au-dessus de 100 µS/cm émulsion H/E', <>
    {T(150, 16, 'Conductivité de l’émulsion (µS/cm, échelle log)', { size: 13.5, gras: true })}
    <rect x={px(0.1)} y={Y - 16} width={px(1) - px(0.1)} height="32" fill="#fdba74"/>
    <rect x={px(1)} y={Y - 16} width={px(100) - px(1)} height="32" fill="#e2e8f0"/>
    <rect x={px(100)} y={Y - 16} width={px(10000) - px(100)} height="32" fill="#93c5fd"/>
    <rect x={X0} y={Y - 16} width={X1 - X0} height="32" fill="none" stroke={C.trait} strokeWidth="2" rx="4"/>
    {[0.1, 1, 10, 100, 1000, 10000].map(v => <g key={v}><line x1={px(v)} y1={Y + 16} x2={px(v)} y2={Y + 23} stroke={C.trait} strokeWidth="1.5"/>{T(px(v), Y + 37, v >= 1000 ? `${v / 1000} mS` : String(v).replace('.', ','), { size: 12 })}</g>)}
    {T((px(0.1) + px(1)) / 2, Y + 4, 'E/H', { size: 14, gras: true, fill: '#9a3412' })}
    {T((px(1) + px(100)) / 2, Y + 4, 'on ne conclut pas', { size: 12.5, gras: true, fill: C.gris })}
    {T((px(100) + px(10000)) / 2, Y + 4, 'H/E', { size: 14, gras: true, fill: C.bleu })}
    {T(150, 150, '1 mS/cm = 1 000 µS/cm', { size: 14, gras: true })}
    {T(150, 172, 'Une H/E sans sel (eau pure) peut rester', { size: 13 })}{T(150, 189, 'dans la zone grise : la mesure ne dit rien.', { size: 13 })}
    {T(150, 38, 'huile continue : isolante', { size: 12.5, fill: '#9a3412', anchor: 'middle' })}
  </>, 340);
}
export function SvgCarteRegle() {
  const ligne = (y, avant, apres, texte, col) => <g>
    <Coupe id={`r${y}a`} x={8} y={y} w={104} h={84} type="H/E" phi={avant} d={18} anim={false}/>
    <Coupe id={`r${y}b`} x={188} y={y} w={104} h={84} type="H/E" phi={apres} d={18} anim={false}/>
    <line x1="120" y1={y + 42} x2="178" y2={y + 42} stroke={col} strokeWidth="4"/><polygon points={`186,${y + 42} 173,${y + 35} 173,${y + 49}`} fill={col}/>
    {T(150, y + 30, texte[0], { size: 12.5, gras: true, fill: col })}{T(150, y + 66, texte[1], { size: 12.5, fill: col })}
  </g>;
  return base(300, 262, 'ajouter la phase dispersée serre les gouttes et épaissit l’émulsion ; ajouter la phase continue écarte les gouttes et la fluidifie', <>
    {ligne(10, 0.25, 0.60, ['+ phase', 'dispersée'], C.violet)}
    {T(60, 108, 'fluide', { size: 13, gras: true })}{T(240, 108, 'épais', { size: 13, gras: true })}
    {ligne(122, 0.60, 0.25, ['+ phase', 'continue'], C.bleu)}
    {T(60, 220, 'épais', { size: 13, gras: true })}{T(240, 220, 'fluide', { size: 13, gras: true })}
    {T(150, 248, 'dispersée : épaissit · continue : dilue', { size: 13.5, gras: true })}
  </>, 340);
}
export function SvgCarteTests() {
  const L = [
    ['Dilution', 'une goutte dans l’eau, puis dans l’huile', 'le plus fiable : ne dépend que de la phase continue', C.vert],
    ['Colorants', 'RS colore l’huile, BM colore l’eau', 'au microscope : le fond coloré est la phase continue', C.orange],
    ['Conductimétrie', 'H/E > 100 µS/cm ; E/H < 1 µS/cm', 'ne conclut pas si la phase aqueuse est sans sel', C.bleu],
  ];
  return base(300, 250, 'trois tests du sens d’une émulsion : dilution, colorants, conductimétrie, avec leur limite', <>
    {L.map(([n, a, b, col], k) => <g key={n}>
      <rect x="8" y={10 + k * 78} width="284" height="70" rx="10" fill="white" stroke={col} strokeWidth="2.5"/>
      {T(150, 30 + k * 78, n, { size: 15, gras: true, fill: col })}{T(150, 49 + k * 78, a, { size: 12.5 })}{T(150, 67 + k * 78, b, { size: 12.5, fill: C.gris })}
    </g>)}
  </>, 340);
}
export function SvgCarteMicro() {
  return base(300, 232, 'plus il y a de phase dispersée, plus les gouttes se serrent et plus l’émulsion est épaisse', <>
    <Coupe id="m1" x={8} y={26} w={134} h={104} type="H/E" phi={0.30} d={20} anim={false}/>
    <Coupe id="m2" x={158} y={26} w={134} h={104} type="H/E" phi={0.65} d={20} anim={false}/>
    {T(75, 16, '30 % d’huile', { size: 13.5, gras: true })}{T(225, 16, '65 % d’huile', { size: 13.5, gras: true })}
    {T(75, 150, 'gouttes écartées', { size: 13 })}{T(75, 167, 'la phase continue circule', { size: 13 })}{T(75, 184, 'facilement : fluide', { size: 13, gras: true, fill: C.bleu })}
    {T(225, 150, 'gouttes serrées', { size: 13 })}{T(225, 167, 'la phase continue passe', { size: 13 })}{T(225, 184, 'mal entre elles : épais', { size: 13, gras: true, fill: C.violet })}
    {T(150, 218, 'même phase continue, même huile : seule φ change', { size: 12.5, fill: C.gris })}
  </>, 340);
}
