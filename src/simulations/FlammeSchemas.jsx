// Schémas animés de la simulation 313 : trajet de l'échantillon dans la flamme, niveaux d'énergie (émission ou absorption), instantané d'atomes, dispositif, étalonnage.
// Rien n'est codé par la seule couleur : étapes numérotées, longueurs d'onde écrites, marques ◄ et symboles.
import { K, T, svgStyle } from "./schemaOutils";
import * as M from "./flammeModele";
import { couleurOnde } from "./chromoTirages";
import { reduitMouvement } from "./hookHorloge";

const lerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
const seg = (p, a, b) => (p - a) / (b - a);
const nf = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sel = el => (['Na', 'Li', 'K'].includes(el.s) ? `${el.s}Cl` : `${el.s}Cl₂`);
const nCl = el => (['Na', 'Li', 'K'].includes(el.s) ? 1 : 2);
const onde = (x1, y, x2, col, haut = 4.5) => {
  const L = Math.max(2, x2 - x1); let d = '';
  for (let i = 0; i <= 50; i++) { const s = i / 50 * L; d += `${i ? 'L' : 'M'}${(x1 + s).toFixed(1)},${(y + Math.sin(s / 6 * Math.PI) * haut).toFixed(1)}`; }
  return <g><path d={d} fill="none" stroke={col} strokeWidth="2.6"/><polygon points={`${x2 + 7},${y} ${x2 - 2},${y - 5} ${x2 - 2},${y + 5}`} fill={col}/></g>;
};
const ElecPt = ({ x, y }) => <g><circle cx={x} cy={y} r="6.5" fill="#2563eb" stroke="#fff" strokeWidth="1.3"/>{T(x, y + 3.6, '−', { size: 11, fill: '#fff', gras: true })}</g>;


// ---------- flamme vivante : légère oscillation du sommet et intensité qui varie (CSS, sans re-rendu) ----------
const CSS_FLAMME = `
@keyframes flm-vacille { 0%,100% { transform: skewX(0deg) scale(1, 1); } 22% { transform: skewX(2.4deg) scale(1.012, 1.035); } 48% { transform: skewX(-1.8deg) scale(0.99, 0.972); } 73% { transform: skewX(1.5deg) scale(1.015, 1.02); } }
@keyframes flm-intensite { 0%,100% { opacity: 0.66; } 20% { opacity: 0.84; } 45% { opacity: 0.7; } 70% { opacity: 0.9; } }
@keyframes flm-coeur { 0%,100% { opacity: 0.55; } 30% { opacity: 0.9; } 60% { opacity: 0.65; } 85% { opacity: 0.95; } }
.flm-corps, .flm-milieu, .flm-coeur { transform-box: fill-box; transform-origin: 50% 100%; }
.flm-corps { animation: flm-vacille 2.4s ease-in-out infinite, flm-intensite 1.3s ease-in-out infinite; }
.flm-milieu { animation: flm-vacille 1.8s ease-in-out infinite reverse, flm-intensite 0.95s ease-in-out infinite; }
.flm-coeur { animation: flm-vacille 1.3s ease-in-out infinite, flm-coeur 0.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .flm-corps, .flm-milieu, .flm-coeur { animation: none; } }`;
const FlammeVivante = ({ d, bx, by }) => {
  const anim = !reduitMouvement(), cl = c => (anim ? c : undefined), at = (kx, ky) => `translate(${bx},${by}) scale(${kx},${ky}) translate(${-bx},${-by})`;
  return (<g>{anim && <style>{CSS_FLAMME}</style>}
    <path className={cl('flm-corps')} d={d} fill="#fef3c7" stroke="#d97706" strokeWidth="1.6" opacity={anim ? undefined : 0.8}/>
    <g transform={at(0.66, 0.7)}><path className={cl('flm-milieu')} d={d} fill="#fde68a" opacity={anim ? undefined : 0.7}/></g>
    <g transform={at(0.36, 0.42)}><path className={cl('flm-coeur')} d={d} fill="#fffbeb" opacity={anim ? undefined : 0.85}/></g>
  </g>);
};

// ---------- trajet : p de 0 à 1 le long de la flamme ----------
export function SceneTrajet({ p, el }) {
  const st = M.etapeDe(p), u = (p * 4) % 1, y = 192 - 158 * p, x = 150 + 7 * Math.sin(p * 17);
  const ions = () => <g>{[[-4, -3, '+'], [3, 3, '−'], [3, -4, '+'], [-4, 4, '−']].map(([dx, dy, s], i) => <g key={i}><circle cx={x + dx} cy={y + dy} r="3.4" fill={s === '+' ? '#fde68a' : '#bae6fd'} stroke="#334155" strokeWidth="0.8"/>{T(x + dx, y + dy + 2.4, s, { size: 6.5, gras: true })}</g>)}</g>;
  let corps;
  if (st === 0) corps = <g><circle cx={x} cy={y} r="12" fill="#e0f2fe" stroke="#0369a1" strokeWidth="1.8"/>{ions()}</g>;
  else if (st === 1) { const r = lerp(12, 5, u * 1.1); corps = u < 0.85 ? <g><circle cx={x} cy={y} r={r} fill="#e0f2fe" stroke="#0369a1" strokeWidth="1.8"/>{r > 7 && ions()}</g> : <rect x={x - 5} y={y - 5} width="10" height="10" fill="#e5e7eb" stroke="#475569" strokeWidth="1.8"/>; }
  else if (st === 2) corps = u < 0.4 ? <rect x={x - 5} y={y - 5} width="10" height="10" fill="#e5e7eb" stroke="#475569" strokeWidth="1.8" opacity={1 - u * 2}/>
    : <g><line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke="#334155" strokeWidth="3"/><circle cx={x - 8} cy={y} r="7.5" fill="#fde68a" stroke="#92400e" strokeWidth="1.6"/><circle cx={x + 9} cy={y} r="6.5" fill="#bbf7d0" stroke="#166534" strokeWidth="1.6"/>{T(x - 8, y + 3.6, el.s, { size: 9, gras: true })}</g>;
  else { const dd = lerp(6, 26, u); corps = <g><circle cx={x - dd} cy={y} r="8" fill="#fde68a" stroke="#92400e" strokeWidth="1.8"/>{T(x - dd, y + 3.8, el.s, { size: 10, gras: true })}{Array.from({ length: nCl(el) }, (_, i) => <g key={i}><circle cx={x + dd + 7 * i * 1.5} cy={y - (i ? 11 : 0)} r="6" fill="#bbf7d0" stroke="#166534" strokeWidth="1.6"/>{T(x + dd + 7 * i * 1.5, y - (i ? 11 : 0) + 3.2, 'Cl', { size: 8, gras: true })}</g>)}</g>; }
  return (<svg role="img" aria-label="Trajet d'une goutte de solution dans la flamme : nébulisation, désolvatation, vaporisation, atomisation" viewBox="0 0 340 226" width="100%" style={svgStyle}>
    <FlammeVivante d="M150,208 C108,170 118,120 138,86 C148,66 140,44 160,12 C168,38 196,52 190,90 C204,122 210,170 170,208 Z" bx={160} by={208}/>
    <rect x="132" y="206" width="56" height="14" rx="3" fill="#94a3b8"/>{T(160, 217, 'brûleur', { size: 10.5, fill: '#fff', gras: true })}
    {[0, 1, 2, 3].map(i => { const act = i === st; return <g key={i}><line x1="20" y1={192 - 158 * i / 4 - 158 / 8} x2="320" y2={192 - 158 * i / 4 - 158 / 8} stroke={K.clair} strokeDasharray="3 4" opacity={i ? 1 : 0}/>
      {T(214, 192 - 158 * (i + 0.5) / 4 + 4, `${act ? '◄ ' : ''}${i + 1}. ${M.ETAPES_TRAJET[i].nom}`, { anchor: 'start', size: 12.5, gras: act, fill: act ? '#92400e' : K.gris })}</g>; })}
    {corps}{T(70, 20, 'sel dissous :', { size: 12.5, fill: K.gris, anchor: 'start' })}{T(70, 36, sel(el), { size: 13, gras: true, anchor: 'start' })}
  </svg>);
}

// ---------- un atome : niveaux d'énergie et scénarios (émission ou absorption) ----------
// mode 'emission' : sc 1 = choc excitant puis photon ; sc 0 = choc sans effet. mode 'absorption' : sc 1 = photon absorbé ; sc 0 = photon transmis. p de 0 à 1.
export function SceneNiveauxFlamme({ mode, el, sc, p }) {
  const col = couleurOnde(el.lam), Y0 = 150, Y1 = 62, xa = 170, E = M.energieEV(el.lam);
  const ex = mode === 'emission'
    ? (sc === 1 ? (p < 0.3 ? 0 : p < 0.45 ? seg(p, 0.3, 0.45) : p < 0.7 ? 1 : p < 0.82 ? 1 - seg(p, 0.7, 0.82) : 0) : 0)
    : (sc === 1 ? (p < 0.4 ? 0 : p < 0.55 ? seg(p, 0.4, 0.55) : p < 0.78 ? 1 : 1 - seg(p, 0.78, 0.9)) : 0);
  const yE = lerp(Y0 - 8, Y1 - 8, ex);
  const gauche = mode === 'emission' ? (p < 0.3 ? lerp(40, 138, p / 0.3) : sc === 1 ? 138 : lerp(138, 60, seg(p, 0.3, 0.6))) : null;
  const xph = mode === 'absorption' ? (p < 0.4 ? lerp(30, 150, p / 0.4) : sc === 0 ? lerp(150, 330, seg(p, 0.4, 0.95)) : null) : null;
  return (<svg role="img" aria-label={mode === 'emission' ? "Un atome libre reçoit un choc de la flamme : l'électron monte, puis redescend en émettant un photon, ou reste au niveau fondamental" : "Un photon de la lampe arrive sur un atome libre : il est absorbé (l'électron monte) ou il traverse la flamme"} viewBox="0 0 340 196" width="100%" style={svgStyle}>
    <rect x="66" y="14" width="208" height="150" rx="10" fill="#fff7ed" stroke="#fdba74" strokeWidth="1.4"/>{T(170, 30, 'atome libre dans la flamme', { size: 11.5, fill: K.gris })}
    <line x1="82" y1={Y0} x2="258" y2={Y0} stroke="#0f172a" strokeWidth="2.6"/><line x1="82" y1={Y1} x2="258" y2={Y1} stroke="#0f172a" strokeWidth="2.6" strokeDasharray="7 3"/>
    {T(170, Y0 + 14, 'niveau fondamental', { size: 12 })}{T(170, Y1 - 6, `niveau excité (+ ${E.toFixed(2).replace('.', ',')} eV)`, { size: 12 })}
    <ElecPt x={xa} y={yE}/>
    {mode === 'emission' && p < 0.82 && sc !== undefined && <g><circle cx={gauche} cy={Y0 - 26} r="7" fill="#fecaca" stroke="#b91c1c" strokeWidth="1.6"/>{T(gauche, Y0 - 23, 'gaz', { size: 7.5 })}<line x1={gauche - 18} y1={Y0 - 26} x2={gauche - 9} y2={Y0 - 26} stroke="#b91c1c" strokeWidth="1.6"/></g>}
    {mode === 'emission' && sc === 1 && p >= 0.8 && onde(xa + 12, lerp(Y1, Y0, 0.5), lerp(xa + 20, 300, seg(p, 0.8, 1)), col)}
    {mode === 'emission' && sc === 1 && p >= 0.3 && p < 0.45 && T(60, 100, 'choc assez violent', { size: 12, gras: true, fill: '#b91c1c', halo: true })}
    {mode === 'emission' && sc === 0 && p >= 0.35 && T(60, 100, 'choc trop faible', { size: 12, gras: true, fill: K.gris, halo: true })}
    {mode === 'absorption' && xph != null && onde(Math.max(14, xph - 44), 106, xph, col)}
    {mode === 'absorption' && sc === 1 && p >= 0.55 && p < 0.9 && [0, 1, 2].map(i => <path key={i} d={`M${xa + 22 + i * 8},${Y0 - 30 - i * 6} l6,-4 l-3,0 l6,-4`} fill="none" stroke="#b91c1c" strokeWidth="1.5"/>)}
    {mode === 'absorption' && sc === 1 && p >= 0.78 && T(170, 184, 'énergie cédée en chaleur (chocs)', { size: 11.5, fill: '#b91c1c', gras: true })}
    {mode === 'absorption' && sc === 1 && p >= 0.45 && p < 0.78 && T(170, 184, 'photon absorbé : il a disparu', { size: 11.5, fill: '#5b21b6', gras: true })}
    {mode === 'absorption' && sc === 0 && p >= 0.5 && T(170, 184, 'photon transmis vers le détecteur', { size: 11.5, fill: '#15803d', gras: true })}
    {T(8, 20, `${Math.round(el.lam)} nm`, { anchor: 'start', size: 12.5, gras: true })}{T(8, 36, M.lectureCoul(el.lam).replace(' (invisible)', ''), { anchor: 'start', size: 11, fill: K.gris })}
  </svg>);
}

// ---------- instantané de 10 000 atomes libres : les atomes excités s'allument ----------
export function SceneGrille({ el, T: Tk, ex, cle, N = 10000 }) {
  const P = 2.6, X0 = 20, Y0 = 8, face = Math.round(Math.sqrt(N)), anim = !reduitMouvement(), col = couleurOnde(el.lam);
  const exp = M.pourDixMille(el, Tk);
  return (<svg role="img" aria-label={`Instantané de ${N} atomes libres de ${el.nom} à ${Tk} kelvin : ${ex.length} atome${ex.length > 1 ? 's' : ''} excité${ex.length > 1 ? 's' : ''}`} viewBox="0 0 300 312" width="100%" style={{ ...svgStyle, maxWidth: 380 }}>
    <defs><pattern id="fm-pt" width={P} height={P} patternUnits="userSpaceOnUse"><circle cx={P / 2} cy={P / 2} r="0.75" fill="#94a3b8"/></pattern></defs>
    <rect x={X0} y={Y0} width={P * face} height={P * face} fill="url(#fm-pt)" stroke={K.clair}/>
    {ex.map(i => { const cx = X0 + (i % face + 0.5) * P, cy = Y0 + (Math.floor(i / face) + 0.5) * P; return (<g key={`${cle}-${i}`}>
      {anim && <circle cx={cx} cy={cy} r="3" fill="none" stroke="#d97706" strokeWidth="1.8"><animate attributeName="r" from="3" to="22" dur="1.4s" repeatCount="3"/><animate attributeName="opacity" from="1" to="0" dur="1.4s" repeatCount="3"/></circle>}
      <circle cx={cx} cy={cy} r="4.2" fill={col} stroke="#0f172a" strokeWidth="1.4"/><circle cx={cx} cy={cy} r="7.5" fill="none" stroke="#0f172a" strokeWidth="1.2"/></g>); })}
    {T(150, 288, `${ex.length} atome${ex.length > 1 ? 's' : ''} excité${ex.length > 1 ? 's' : ''} sur ${nf(N)}`, { size: 14, gras: true })}
    {T(150, 305, `attendu : ${exp < 10 ? exp.toFixed(exp < 0.1 ? 3 : 1).replace('.', ',') : nf(exp)} en moyenne`, { size: 12.5, fill: K.gris })}
  </svg>);
}

// ---------- dispositif : SEF (la flamme émet) ou SAA (une lampe éclaire la flamme) ; des photons circulent (p de 0 à 1, en boucle) ----------
export function SceneDispositif({ mode, el, p }) {
  const col = couleurOnde(el.lam), abs = mode === 'absorption';
  const photons = abs ? [0, 0.25, 0.5, 0.75].map(o => (p + o) % 1) : [];
  const out = [0, 0.33, 0.66].map(o => (p + o) % 1);
  return (<svg role="img" aria-label={abs ? "Dispositif d'absorption atomique : lampe, flamme, monochromateur, détecteur" : "Dispositif d'émission de flamme : flamme, monochromateur, détecteur"} viewBox="0 0 340 150" width="100%" style={svgStyle}>
    {abs && <g><rect x="8" y="52" width="60" height="44" rx="8" fill="#fef9c3" stroke="#a16207" strokeWidth="1.8"/>{T(38, 71, 'lampe', { size: 12, gras: true })}{T(38, 86, `à ${el.s}`, { size: 12, gras: true })}</g>}
    <FlammeVivante d="M128,106 C106,86 112,62 124,48 C128,38 124,28 134,14 C139,28 152,36 148,50 C158,64 160,88 142,106 Z" bx={135} by={106}/>{T(136, 124, 'flamme', { size: 12, gras: true })}
    <rect x="190" y="52" width="76" height="44" rx="8" fill="#ede9fe" stroke="#6d28d9" strokeWidth="1.8"/>{T(228, 71, 'mono-', { size: 12, gras: true })}{T(228, 86, 'chromateur', { size: 11, gras: true })}
    <rect x="292" y="52" width="44" height="44" rx="8" fill="#f1f5f9" stroke="#15803d" strokeWidth="1.8"/>{T(314, 71, 'détec-', { size: 11.5, gras: true })}{T(314, 86, 'teur', { size: 11.5, gras: true })}
    {abs ? photons.map((u, i) => <g key={i}>{u < 0.5 ? <circle cx={lerp(72, 124, u / 0.5)} cy="74" r="4.2" fill={col} stroke="#0f172a" strokeWidth="1.1"/> : u > 0.62 && i % 2 === 0 ? <circle cx={lerp(150, 192, seg(u, 0.62, 1))} cy="74" r="4.2" fill={col} stroke="#0f172a" strokeWidth="1.1"/> : null}</g>) : null}
    {out.map((u, i) => <circle key={i} cx={lerp(150, 192, u)} cy={74 + (i - 1) * 6} r="4.2" fill={col} stroke="#0f172a" strokeWidth="1.1" opacity={1 - Math.abs(u - 0.5)}/>)}
    <line x1="268" y1="74" x2="290" y2="74" stroke={K.gris} strokeWidth="1.6" strokeDasharray="4 3"/>
    {T(170, 144, abs ? 'les atomes de la flamme retirent des photons du faisceau' : 'les atomes excités de la flamme envoient des photons', { size: 12, fill: K.gris })}
  </svg>);
}

// ---------- étalonnage : signal en fonction de la concentration, courbe réelle (pointillés), points d'étalons, échantillon ----------
export function SceneEtalonnage({ el, fl, methode, points = true, cEch = null, titre }) {
  const X0 = 44, X1 = 320, YB = 170, HT = 126, cM = el.cmax * 1.6, sMax = Math.max(1e-9, M.signal(methode, el, fl, cM) * 1.05);
  const sx = c => X0 + c / cM * (X1 - X0), sy = s => YB - s / sMax * HT, g = M.gamme(el, 5);
  const courbe = Array.from({ length: 41 }, (_, i) => { const c = cM * i / 40; return `${i ? 'L' : 'M'}${sx(c).toFixed(1)},${sy(M.signal(methode, el, fl, c)).toFixed(1)}`; }).join('');
  const a1 = M.signal(methode, el, fl, g[0]) / g[0];
  const yE = cEch != null ? M.signal(methode, el, fl, cEch) : null, uni = methode === 'absorption' ? 'absorbance A' : 'intensité d’émission (u. a.)';
  return (<svg role="img" aria-label={`Courbe d'étalonnage en ${methode === 'absorption' ? 'absorption' : 'émission'} pour ${el.nom}`} viewBox="0 0 340 214" width="100%" style={svgStyle}>
    {titre && T(X0 - 4, 11, titre, { anchor: 'start', size: 12.5, fill: K.gris, gras: true })}
    <line x1={X0} y1={YB} x2={X1} y2={YB} stroke={K.gris}/><line x1={X0} y1={YB} x2={X0} y2={YB - HT - 6} stroke={K.gris}/>
    <line x1={X0} y1={YB} x2={X1} y2={sy(a1 * cM)} stroke="#64748b" strokeWidth="1.4" strokeDasharray="2 4"/>
    <path d={courbe} fill="none" stroke="#1d4ed8" strokeWidth="2.2"/>
    {points && g.map(c => <g key={c}><circle cx={sx(c)} cy={sy(M.signal(methode, el, fl, c))} r="4.2" fill="#fff" stroke="#0f172a" strokeWidth="1.8"/></g>)}
    {cEch != null && <g><line x1={X0} y1={sy(yE)} x2={sx(cEch)} y2={sy(yE)} stroke="#b45309" strokeDasharray="4 3" strokeWidth="1.8"/><line x1={sx(cEch)} y1={sy(yE)} x2={sx(cEch)} y2={YB} stroke="#b45309" strokeDasharray="4 3" strokeWidth="1.8"/><circle cx={sx(cEch)} cy={sy(yE)} r="5" fill="#b45309"/></g>}
    {[0, 0.5, 1, 1.5].map(f => <g key={f}><line x1={sx(el.cmax * f)} y1={YB} x2={sx(el.cmax * f)} y2={YB + 5} stroke={K.gris}/>{T(sx(el.cmax * f), YB + 18, String(+(el.cmax * f).toFixed(1)).replace('.', ','), { size: 12, fill: K.gris })}</g>)}
    {T(X1, YB + 36, 'concentration (mg/L)', { anchor: 'end', size: 12.5, fill: K.gris })}{T(X0 - 4, 29, uni, { anchor: 'start', size: 12.5, fill: K.gris })}
    {T(sx(cM * 0.97), sy(M.signal(methode, el, fl, cM * 0.97)) + 20, 'courbe réelle', { anchor: 'end', size: 12, fill: '#1d4ed8', gras: true, halo: true })}{T(sx(cM * 0.5), sy(a1 * cM * 0.5) - 9, 'droite', { size: 11.5, fill: K.gris, halo: true })}
  </svg>);
}

// ---------- cartes « À retenir » ----------
export function SvgCarteDeux() {
  return (<svg role="img" aria-label="Émission : l'atome excité émet un photon. Absorption : l'atome au fondamental absorbe un photon." viewBox="0 0 300 190" width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    {T(78, 16, 'Émission (SEF)', { size: 14, gras: true })}{T(224, 16, 'Absorption (SAA)', { size: 14, gras: true })}
    {[78, 224].map(x => <g key={x}><line x1={x - 36} y1="140" x2={x + 36} y2="140" stroke="#0f172a" strokeWidth="2.4"/><line x1={x - 36} y1="56" x2={x + 36} y2="56" stroke="#0f172a" strokeWidth="2.4" strokeDasharray="6 3"/></g>)}
    <ElecPt x={78} y={50}/>{onde(98, 100, 140, '#d97706')}<polygon points="70,66 78,76 86,66" fill="#0f172a"/><line x1="78" y1="76" x2="78" y2="124" stroke="#0f172a" strokeWidth="1.6"/>
    <ElecPt x={224} y={50}/>{onde(180, 100, 205, '#d97706')}<polygon points="216,128 224,118 232,128" fill="#0f172a"/><line x1="224" y1="68" x2="224" y2="118" stroke="#0f172a" strokeWidth="1.6"/>
    {T(78, 164, 'le photon sort', { size: 12.5 })}{T(224, 164, 'le photon est retiré', { size: 12.5 })}{T(150, 184, 'même écart d’énergie : E = h·c / λ', { size: 12.5, fill: K.gris, gras: true })}
  </svg>);
}
export function SvgCartePopulation() {
  return (<svg role="img" aria-label="À 2500 kelvins, environ 2 atomes de sodium sur 10 000 sont excités ; tous les autres sont au fondamental" viewBox="0 0 300 160" width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    {T(150, 16, '10 000 atomes de sodium à 2 500 K', { size: 13.5, gras: true })}
    <rect x="20" y="30" width="260" height="30" fill="#e2e8f0" stroke={K.gris}/><rect x="278" y="30" width="3" height="30" fill="#d97706"/>
    {T(150, 50, 'au fondamental : environ 9 998', { size: 13, gras: true })}
    <line x1="279" y1="62" x2="279" y2="84" stroke="#d97706" strokeWidth="1.8"/>{T(279, 98, '≈ 2 excités', { size: 12.5, gras: true, fill: '#92400e', anchor: 'end' })}
    {T(150, 122, 'L’absorption part du grand nombre', { size: 12 })}{T(150, 137, 'd’atomes au fondamental : elle ne', { size: 12 })}{T(150, 151, 'dépend pas de l’excitation thermique.', { size: 12, gras: true })}
  </svg>);
}
