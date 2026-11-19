// ====================================================
//  Schémas de la simulation 169 (spectroscopie UV-visible, loi de Beer-Lambert ; niveau TG).
//  Spectre : viewBox 400 × 276, textes de 16 (indices 13). Cartes « À retenir » : viewBox de 400, textes ≥ 16.
//  Public daltonien : jamais la couleur seule (traits pleins / tirets, étiquettes, noms écrits des couleurs).
// ====================================================
import { useId } from 'react';
import * as M from './uvVisModele';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#b45309', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1' };
const fr = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };

// λ puis « max » en petit (jamais de tspan décalé) : ancre « start » uniquement
export const LamMax = ({ x, y, c = COL.txt, s = 20, w = 700, halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} {...(halo ? HALO : {})}>λmax</text>);
const Tx = ({ x, y, children, c = COL.txt, s = 20, w = 600, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);

// ---------- gradient « arc-en-ciel » de la bande des couleurs (380 à 750 nm) ----------
const ARC = [[380, '#7c3aed'], [420, '#6d28d9'], [450, '#2563eb'], [490, '#06b6d4'], [530, '#22c55e'], [575, '#eab308'], [600, '#f97316'], [650, '#dc2626'], [750, '#991b1b']];
const NOMS_COULEURS = [[415, 'violet', 0], [472, 'bleu', 1], [532, 'vert', 0], [580, 'jaune', 1], [607, 'orange', 0], [685, 'rouge', 1]];

// ====================================================
//  SPECTRE : A = f(λ) (axes gradués), bande des couleurs, curseur éventuel
//  esp, c (mol/L), l (cm) ; yMax ; curseur (λ en nm) ou null ; compare : second spectre normalisé (superposition)
// ====================================================
const X0 = 50, X1 = 390, YT = 24, YB = 190;
const xl = lam => X0 + (lam - M.LAMBDA_MIN) / (M.LAMBDA_MAX - M.LAMBDA_MIN) * (X1 - X0);
export function SpectreUV({ esp, c, l = M.L_CUVE, yMax = 1, curseur = null, compare = null, aria }) {
  const id = useId().replace(/:/g, '');
  const norm = !!compare;                                     // superposition : chaque spectre est ramené à 1 au maximum
  const ymax = norm ? 1.2 : yMax;
  const yv = A => YB - Math.min(Math.max(A, 0), ymax) / ymax * (YB - YT);
  const fonc = k => lam => (norm ? M.epsilon(k, lam) / M.ESPECES[k].eps : M.absorbance(k, lam, c, l));
  const trace = f => { const pts = []; for (let lam = M.LAMBDA_MIN; lam <= M.LAMBDA_MAX; lam += 2) pts.push(`${xl(lam).toFixed(1)},${yv(f(lam)).toFixed(1)}`); return pts; };
  const p1 = trace(fonc(esp));
  const pas = ymax <= 1.5 ? 0.5 : 1, ticks = []; for (let a = 0; a <= ymax + 1e-9; a += pas) ticks.push(a);
  const lamTicks = [300, 400, 500, 600, 700];
  return (
    <svg viewBox="0 0 400 276" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <defs>
        <linearGradient id={`arc${id}`} x1={xl(380)} x2={xl(750)} y1="0" y2="0" gradientUnits="userSpaceOnUse">
          {ARC.map(([lam, col]) => <stop key={lam} offset={`${(lam - 380) / 370 * 100}%`} stopColor={col}/>)}
        </linearGradient>
        <pattern id={`uv${id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e2e8f0"/><line x1="0" y1="0" x2="0" y2="7" stroke="#64748b" strokeWidth="2"/></pattern>
      </defs>
      {/* axes et graduations */}
      {ticks.map(a => <g key={a}><line x1={X0} y1={yv(a)} x2={X1} y2={yv(a)} stroke="#e2e8f0" strokeWidth="1"/><text x={X0 - 6} y={yv(a) + 5} fontSize="18" fill={COL.txt} textAnchor="end">{fr(a, 1)}</text></g>)}
      <line x1={X0} y1={YT - 4} x2={X0} y2={YB} stroke="#334155" strokeWidth="2"/>
      <line x1={X0} y1={YB} x2={X1} y2={YB} stroke="#334155" strokeWidth="2"/>
      {lamTicks.map(t => <g key={t}><line x1={xl(t)} y1={YB} x2={xl(t)} y2={YB + 5} stroke="#334155" strokeWidth="2"/><text x={xl(t)} y={YB + 22} fontSize="18" fill={COL.txt} textAnchor="middle">{t}</text></g>)}
      <text x="4" y="18" fontSize="18" fontWeight="700" fill={COL.txt}>{norm ? 'A normalisée' : 'A'}</text>
      <text x="4" y={YB + 22} fontSize="18" fontWeight="700" fill={COL.txt}>λ (nm)</text>
      {/* spectres */}
      {compare && <polyline points={trace(fonc(compare)).join(' ')} fill="none" stroke={COL.orange} strokeWidth="3" strokeDasharray="9 5" strokeLinejoin="round"/>}
      {!norm && <polygon points={`${xl(M.LAMBDA_MIN)},${YB} ${p1.join(' ')} ${xl(M.LAMBDA_MAX)},${YB}`} fill="#bfdbfe" opacity="0.55"/>}
      <polyline points={p1.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
      {/* curseur */}
      {curseur != null && (() => { const A = M.absorbance(esp, curseur, c, l), x = xl(curseur); return (
        <g><line x1={x} y1={YT - 4} x2={x} y2={YB} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="6 4"/>
          <circle cx={x} cy={yv(norm ? M.epsilon(esp, curseur) / M.ESPECES[esp].eps : A)} r="6" fill="#fff" stroke={COL.orange} strokeWidth="3"/>
          <polygon points={`${x - 7},${YB + 1} ${x + 7},${YB + 1} ${x},${YB - 9}`} fill={COL.orange}/></g>); })()}
      {/* bande des couleurs : UV hachuré, visible dégradé, noms écrits */}
      <rect x={xl(M.LAMBDA_MIN)} y="214" width={xl(380) - xl(M.LAMBDA_MIN)} height="12" fill={`url(#uv${id})`} stroke="#64748b" strokeWidth="1"/>
      <rect x={xl(380)} y="214" width={xl(M.LAMBDA_MAX) - xl(380)} height="12" fill={`url(#arc${id})`}/>
      <text x={(xl(M.LAMBDA_MIN) + xl(380)) / 2} y="246" fontSize="18" fontWeight="700" fill={COL.txt} textAnchor="middle">UV</text>
      {NOMS_COULEURS.map(([lam, nom, rang]) => <text key={nom} x={xl(lam)} y={246 + rang * 18} fontSize="18" fill={COL.txt} textAnchor="middle">{nom}</text>)}
    </svg>);
}

// ====================================================
//  GRAPHIQUE A = f(c) à λ donnée : droite A = ε·l·c (tirets), absorbance mesurée (trait plein), point courant, zone de validité (option)
// ====================================================
const GX0 = 56, GX1 = 390, GYT = 20, GYB = 192;
const joli = x => { const e = Math.pow(10, Math.floor(Math.log10(x))); const m = x / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };
export function GrapheEtalonnage({ esp, lam, l = M.L_CUVE, cUnite, cMaxUnite, zone = false, aria }) {
  const id = useId().replace(/:/g, '');
  const sp = M.ESPECES[esp], epl = M.epsilon(esp, lam) * l * sp.facteur;          // pente : A par unité de concentration du menu
  const yMax = M.A_MAX_AFFICHE, xl2 = c => GX0 + c / cMaxUnite * (GX1 - GX0), yl = A => GYB - Math.min(Math.max(A, 0), yMax) / yMax * (GYB - GYT);
  const pasX = joli(cMaxUnite / 4), tx = []; for (let c = 0; c <= cMaxUnite + 1e-9; c += pasX) tx.push(c);
  const mes = []; for (let k = 0; k <= 120; k++) { const c = cMaxUnite * k / 120; mes.push(`${xl2(c).toFixed(1)},${yl(M.aMesuree(epl * c)).toFixed(1)}`); }
  const cFin = Math.min(cMaxUnite, yMax / epl);
  const Ac = M.aMesuree(epl * cUnite);
  return (
    <svg viewBox="0 0 400 252" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      <defs><pattern id={`zv${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fef3c7"/><line x1="0" y1="0" x2="0" y2="8" stroke={COL.orange} strokeWidth="2"/></pattern></defs>
      {[0, 1, 2, 3].map(a => <g key={a}><line x1={GX0} y1={yl(a)} x2={GX1} y2={yl(a)} stroke="#e2e8f0" strokeWidth="1"/><text x={GX0 - 6} y={yl(a) + 5} fontSize="18" fill={COL.txt} textAnchor="end">{a}</text></g>)}
      {zone && <g><rect x={GX0} y={yl(M.A_LIMITE_HAUT)} width={GX1 - GX0} height={yl(M.A_LIMITE_BAS) - yl(M.A_LIMITE_HAUT)} fill={`url(#zv${id})`} opacity="0.9"/>
        <Tx x={GX0 + 8} y={yl(M.A_LIMITE_HAUT) - 5} c={COL.orange} w={700}>limite : A ≈ 1,5 à 2</Tx></g>}
      <line x1={GX0} y1={GYT - 4} x2={GX0} y2={GYB} stroke="#334155" strokeWidth="2"/>
      <line x1={GX0} y1={GYB} x2={GX1} y2={GYB} stroke="#334155" strokeWidth="2"/>
      {tx.map(c => <g key={c}><line x1={xl2(c)} y1={GYB} x2={xl2(c)} y2={GYB + 5} stroke="#334155" strokeWidth="2"/><text x={xl2(c)} y={GYB + 22} fontSize="18" fill={COL.txt} textAnchor="middle">{fr(c, pasX < 1 ? 1 : 0)}</text></g>)}
      <text x="4" y="16" fontSize="18" fontWeight="700" fill={COL.txt}>A</text>
      <text x={(GX0 + GX1) / 2} y="244" fontSize="18" fontWeight="700" fill={COL.txt} textAnchor="middle">c ({sp.unite})</text>
      <line x1={xl2(0)} y1={yl(0)} x2={xl2(cFin)} y2={yl(epl * cFin)} stroke={COL.gris} strokeWidth="3" strokeDasharray="9 5"/>
      <polyline points={mes.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
      <circle cx={xl2(Math.min(cUnite, cMaxUnite))} cy={yl(Ac)} r="7" fill="#fff" stroke={COL.orange} strokeWidth="3.5"/>
    </svg>);
}

// ====================================================
//  CUVE : solution colorée (ou incolore), nom de la couleur écrit
// ====================================================
export function CuveCouleur({ esp, c, l = M.L_CUVE }) {
  const sp = M.ESPECES[esp];
  return (
    <svg viewBox="0 0 120 130" role="img" aria-label={`Cuve de spectrophotomètre contenant une solution ${sp.couleur}`} style={{ width: '100%', maxWidth: 110, height: 'auto', display: 'block', margin: '0 auto 4px' }}>
      <rect x="30" y="14" width="60" height="96" rx="4" fill={M.couleurCuve(esp, c, l)} stroke="#334155" strokeWidth="3"/>
      <rect x="30" y="14" width="60" height="22" fill="#fff" opacity="0.65"/>
      <line x1="30" y1="36" x2="90" y2="36" stroke="#64748b" strokeWidth="2" strokeDasharray="5 3"/>
      <rect x="22" y="110" width="76" height="10" rx="3" fill="#94a3b8"/>
    </svg>);
}

// ====================================================
//  SCHÉMAS DES CARTES « À RETENIR » (viewBox 400)
// ====================================================
const cadre = { width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto' };
const Fl = ({ x1, y1, x2, y2, c = COL.txt, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), t = 11, bx = x2 - (t - 2) * Math.cos(a), by = y2 - (t - 2) * Math.sin(a);
  return <g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y2} ${x2 - t * Math.cos(a - 0.42)},${y2 - t * Math.sin(a - 0.42)} ${x2 - t * Math.cos(a + 0.42)},${y2 - t * Math.sin(a + 0.42)}`} fill={c}/></g>;
};
const rond = (c, cx, cy) => <circle cx={cx} cy={cy} r="11" fill={c} stroke="#334155" strokeWidth="2"/>;

// couleur absorbée ↔ couleur de la solution (3 couples, noms écrits)
export function SvgCouleurCarte() {
  const L = [['violet-bleu', 'jaune', '#facc15'], ['vert', 'rouge', '#dc2626'], ['orange-rouge', 'bleu-vert', '#0891b2']];
  return (
    <svg viewBox="0 0 400 236" role="img" aria-label="Trois couples : couleur absorbée et couleur de la solution. Violet-bleu absorbé, solution jaune. Vert absorbé, solution rouge. Orange-rouge absorbé, solution bleu-vert." style={cadre}>
      <Tx x="100" y="24" ancre="middle" w={700} halo={false}>lumière absorbée</Tx>
      <Tx x="312" y="24" ancre="middle" w={700} halo={false}>solution vue</Tx>
      {L.map(([abs, vue, col], k) => { const y = 40 + k * 64; return (
        <g key={abs}>
          <rect x="10" y={y} width="180" height="48" rx="10" fill="#f1f5f9" stroke="#334155" strokeWidth="2"/>
          <Tx x="100" y={y + 31} ancre="middle" halo={false}>{abs}</Tx>
          <Fl x1="196" y1={y + 24} x2="232" y2={y + 24} c={COL.bleu} w={4}/>
          <rect x="238" y={y} width="152" height="48" rx="10" fill="#fff" stroke="#334155" strokeWidth="2"/>
          {rond(col, 262, y + 24)}
          <Tx x="282" y={y + 31} halo={false}>{vue}</Tx>
        </g>); })}
    </svg>);
}

// deux espèces : deux spectres de λmax différentes (génériques, sans valeur numérique)
export function SvgEmpreinteCarte() {
  const gx = (lam) => 40 + (lam - 250) / 500 * 350, base = 170, haut = 40;
  const f = (c, w) => lam => base - (base - haut) * Math.exp(-(((lam - c) / w) ** 2));
  const trace = fn => { const p = []; for (let lam = 250; lam <= 750; lam += 5) p.push(`${gx(lam).toFixed(1)},${fn(lam).toFixed(1)}`); return p.join(' '); };
  const cA = 430, cB = 600;
  return (
    <svg viewBox="0 0 400 236" role="img" aria-label="Deux spectres d'absorption d'espèces différentes : leurs maxima, notés lambda max, sont à des longueurs d'onde différentes" style={cadre}>
      <line x1="40" y1="24" x2="40" y2={base} stroke="#334155" strokeWidth="2"/><line x1="40" y1={base} x2="392" y2={base} stroke="#334155" strokeWidth="2"/>
      <Tx x="48" y="22" halo={false} w={700}>A</Tx><Tx x="392" y="198" ancre="end" halo={false} w={700}>λ (nm)</Tx>
      <polyline points={trace(f(cA, 45))} fill="none" stroke={COL.bleu} strokeWidth="3.5"/>
      <polyline points={trace(f(cB, 55))} fill="none" stroke={COL.orange} strokeWidth="3.5" strokeDasharray="9 5"/>
      <line x1={gx(cA)} y1={haut} x2={gx(cA)} y2={base + 6} stroke={COL.bleu} strokeWidth="1.5" strokeDasharray="3 4"/>
      <line x1={gx(cB)} y1={haut} x2={gx(cB)} y2={base + 6} stroke={COL.orange} strokeWidth="1.5" strokeDasharray="3 4"/>
      <LamMax x={gx(cA) - 26} y="198" c={COL.bleu}/><LamMax x={gx(cB) - 26} y="198" c={COL.orange}/>
      <Tx x={gx(cA) - 8} y="32" ancre="end" c={COL.bleu} w={700}>espèce 1</Tx>
      <Tx x={gx(cB) + 8} y="32" c={COL.orange} w={700}>espèce 2</Tx>
      <Tx x="200" y="226" ancre="middle" halo={false}>un spectre = une empreinte</Tx>
    </svg>);
}

// incolore : le spectre peut se trouver dans l'UV
export function SvgUVCarte() {
  const gx = lam => 40 + (lam - 200) / 600 * 350, base = 170, haut = 44;
  const p = []; for (let lam = 200; lam <= 800; lam += 5) p.push(`${gx(lam).toFixed(1)},${(base - (base - haut) * Math.exp(-(((lam - 255) / 38) ** 2))).toFixed(1)}`);
  return (
    <svg viewBox="0 0 400 236" role="img" aria-label="Spectre d'une espèce incolore : le maximum d'absorption est dans l'ultraviolet, et l'absorbance est nulle dans le visible" style={cadre}>
      <defs><pattern id="uvc" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e2e8f0"/><line x1="0" y1="0" x2="0" y2="7" stroke="#64748b" strokeWidth="2"/></pattern></defs>
      <rect x={gx(200)} y="30" width={gx(400) - gx(200)} height={base - 30} fill="url(#uvc)"/>
      <rect x={gx(400)} y="30" width={gx(800) - gx(400)} height={base - 30} fill="#fffbeb"/>
      <line x1="40" y1="24" x2="40" y2={base} stroke="#334155" strokeWidth="2"/><line x1="40" y1={base} x2="392" y2={base} stroke="#334155" strokeWidth="2"/>
      <polyline points={p.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3.5"/>
      <Tx x={gx(300)} y="196" ancre="middle" w={700} halo={false}>UV</Tx>
      <Tx x={gx(600)} y="196" ancre="middle" w={700} halo={false}>visible</Tx>
      <Tx x={gx(600)} y={base - 34} ancre="middle" halo={false}>A ≈ 0</Tx>
      <Tx x={gx(600)} y={base - 14} ancre="middle" halo={false}>incolore</Tx>
      <Tx x="48" y="22" halo={false} w={700}>A</Tx><Tx x="392" y="222" ancre="end" halo={false} w={700}>λ (nm)</Tx>
      <line x1={gx(400)} y1="30" x2={gx(400)} y2={base} stroke={COL.orange} strokeWidth="2.5" strokeDasharray="6 4"/>
    </svg>);
}

// Beer-Lambert : cuve, faisceau I0 → I, longueur l, concentration c
export function SvgBeerCarte() {
  return (
    <svg viewBox="0 0 400 236" role="img" aria-label="Un faisceau lumineux d'intensité I zéro traverse une cuve de longueur l contenant une solution de concentration c ; l'intensité I qui ressort est plus faible" style={cadre}>
      <rect x="108" y="64" width="184" height="104" fill="#fde68a" stroke="#334155" strokeWidth="3"/>
      <Fl x1="10" y1="116" x2="104" y2="116" c={COL.bleu} w={7}/>
      <Fl x1="296" y1="116" x2="390" y2="116" c={COL.bleu} w={3}/>
      <Tx x="57" y="96" ancre="middle" c={COL.bleu} w={700} s={22}>I₀</Tx>
      <Tx x="343" y="96" ancre="middle" c={COL.bleu} w={700} s={22}>I</Tx>
      <Tx x="343" y="150" ancre="middle" halo={false}>I &lt; I₀</Tx>
      <line x1="108" y1="188" x2="292" y2="188" stroke={COL.orange} strokeWidth="3"/><line x1="108" y1="180" x2="108" y2="196" stroke={COL.orange} strokeWidth="3"/><line x1="292" y1="180" x2="292" y2="196" stroke={COL.orange} strokeWidth="3"/>
      <Tx x="200" y="220" ancre="middle" c={COL.orange} w={700} halo={false}>longueur l (cm)</Tx>
      <Tx x="200" y="108" ancre="middle" halo={false}>solution</Tx><Tx x="200" y="134" ancre="middle" halo={false} s={19}>concentration c</Tx>
      <Tx x="200" y="44" ancre="middle" halo={false} s={19}>lumière de longueur d'onde λ</Tx>
    </svg>);
}

// validité : droite puis courbe qui s'infléchit, zone de validité
export function SvgValiditeCarte() {
  const x0 = 46, x1 = 390, yb = 176, yt = 30, A = a => yb - a / 3 * (yb - yt);
  const pente = 1.45, cx = c => x0 + c * (x1 - x0), mes = []; for (let k = 0; k <= 100; k++) { const c = k / 100 * 0.95; mes.push(`${cx(c).toFixed(1)},${A(M.aMesuree(pente * 3 * c)).toFixed(1)}`); }
  return (
    <svg viewBox="0 0 400 244" role="img" aria-label="Absorbance en fonction de la concentration : une droite jusqu'à A voisin de 1,5 à 2, puis une courbe qui s'écarte de la droite pointillée" style={cadre}>
      <defs><pattern id="zvc" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fef3c7"/><line x1="0" y1="0" x2="0" y2="8" stroke={COL.orange} strokeWidth="2"/></pattern></defs>
      <rect x={x0} y={A(2)} width={x1 - x0} height={A(1.5) - A(2)} fill="url(#zvc)"/>
      <line x1={x0} y1="20" x2={x0} y2={yb} stroke="#334155" strokeWidth="2"/><line x1={x0} y1={yb} x2={x1} y2={yb} stroke="#334155" strokeWidth="2"/>
      <Tx x="54" y="24" halo={false} w={700}>A</Tx><Tx x="392" y="204" ancre="end" halo={false} w={700}>c</Tx>
      <line x1={cx(0)} y1={A(0)} x2={cx(0.69)} y2={A(pente * 3 * 0.69)} stroke={COL.gris} strokeWidth="3" strokeDasharray="9 5"/>
      <polyline points={mes.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3.5"/>
      <Tx x="54" y={A(2) - 6} c={COL.orange} w={700}>A ≈ 1,5 à 2</Tx>
      <Tx x="200" y="226" ancre="middle" halo={false}>au-delà : plus proportionnelle à c</Tx>
    </svg>);
}
