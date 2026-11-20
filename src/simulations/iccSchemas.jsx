// Schémas de la simulation 185 « Incertitudes-types composées et comparaison à une valeur de référence » (TG spé PC).
// Règles : scènes dans un viewBox de 420 de large, textes ≥ 16 ; cartes « À retenir » dans un viewBox de 320, textes ≥ 13,5 (≥ 11 px rendus à 390 px) ;
// width 100 % + maxWidth 480 (scènes) ou 320 (cartes), centrés ; aucune information portée par la seule couleur (trait, hachures, étiquettes) ;
// indices en caractères Unicode (jamais de tspan décalé) ; coordonnées toujours numériques.
import * as M from './iccModele';

const C = { bleu: '#0369a1', bleuClair: '#bae6fd', orange: '#b45309', orangeClair: '#fde68a', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', grisClair: '#e2e8f0', txt: '#0f172a', metal: '#cbd5e1', metalClair: '#e2e8f0' };
export const COLI = C;
const virg = (x, d = 2) => Number(x).toFixed(d).replace('.', ',').replace('-', '−');
const T = props => <text fontFamily="system-ui, sans-serif" fill={C.txt} {...props}/>;
const base = (vb, label, maxWidth = 480) => ({ viewBox: vb, role: 'img', 'aria-label': label, width: '100%', style: { display: 'block', margin: '0 auto', maxWidth, height: 'auto' } });

// flèche simple à deux pointes (cote) ou à une pointe
function Cote({ x1, y1, x2, y2, c = C.txt, w = 2, double = true }) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, h = 9, d = 4;
  const tete = (x, y, sx, sy) => `${x},${y} ${x - sx * h - sy * d},${y - sy * h + sx * d} ${x - sx * h + sy * d},${y - sy * h - sx * d}`;
  return (<g>
    <line x1={x1 + (double ? ux * 6 : 0)} y1={y1 + (double ? uy * 6 : 0)} x2={x2 - ux * 6} y2={y2 - uy * 6} stroke={c} strokeWidth={w}/>
    <polygon points={tete(x2, y2, ux, uy)} fill={c}/>
    {double && <polygon points={tete(x1, y1, -ux, -uy)} fill={c}/>}
  </g>);
}

// ====================================================
//  SCÈNE : le cylindre et la balance
// ====================================================
export function SvgCylindre() {
  return (
    <svg {...base('0 0 420 250', 'Un cylindre dont on mesure le diamètre d et la hauteur h, et une balance qui donne sa masse m')}>
      {/* cylindre */}
      <path d="M 60 96 L 60 196 A 50 14 0 0 0 160 196 L 160 96 Z" fill={C.metal} stroke={C.txt} strokeWidth="2"/>
      <ellipse cx="110" cy="96" rx="50" ry="14" fill={C.metalClair} stroke={C.txt} strokeWidth="2"/>
      {/* cote d */}
      <line x1="60" y1="96" x2="60" y2="52" stroke={C.gris} strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="160" y1="96" x2="160" y2="52" stroke={C.gris} strokeWidth="1.5" strokeDasharray="4 3"/>
      <Cote x1={60} y1={58} x2={160} y2={58} c={C.bleu}/>
      <T x="110" y="42" fontSize="22" fontStyle="italic" textAnchor="middle" fontWeight="700" fill={C.bleu}>d</T>
      {/* cote h */}
      <line x1="160" y1="96" x2="204" y2="96" stroke={C.gris} strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="160" y1="196" x2="204" y2="196" stroke={C.gris} strokeWidth="1.5" strokeDasharray="4 3"/>
      <Cote x1={198} y1={96} x2={198} y2={196} c={C.orange}/>
      <T x="214" y="152" fontSize="22" fontStyle="italic" fontWeight="700" fill={C.orange}>h</T>
      <T x="110" y="238" fontSize="18" textAnchor="middle">cylindre</T>
      {/* balance */}
      <rect x="268" y="176" width="130" height="40" rx="8" fill="#f1f5f9" stroke={C.txt} strokeWidth="2"/>
      <rect x="286" y="184" width="94" height="24" rx="3" fill="#fff" stroke={C.gris} strokeWidth="1.5"/>
      <T x="333" y="202" fontSize="18" textAnchor="middle" fontFamily="monospace">m = ? g</T>
      <rect x="318" y="160" width="30" height="16" fill="#f1f5f9" stroke={C.txt} strokeWidth="2"/>
      <rect x="276" y="148" width="114" height="12" rx="4" fill={C.metalClair} stroke={C.txt} strokeWidth="2"/>
      <T x="333" y="238" fontSize="18" textAnchor="middle">balance</T>
    </svg>);
}

// ====================================================
//  SCÈNE : pesée par différence (deux pesées)
// ====================================================
function Pesee({ x, titre, affichage, avecCylindre }) {
  return (<g>
    <rect x={x} y="158" width="150" height="42" rx="8" fill="#f1f5f9" stroke={C.txt} strokeWidth="2"/>
    <rect x={x + 22} y="166" width="106" height="26" rx="3" fill="#fff" stroke={C.gris} strokeWidth="1.5"/>
    <T x={x + 75} y="186" fontSize="20" textAnchor="middle" fontFamily="monospace" fontWeight="700">{affichage}</T>
    <rect x={x + 60} y="144" width="30" height="14" fill="#f1f5f9" stroke={C.txt} strokeWidth="2"/>
    <rect x={x + 15} y="134" width="120" height="10" rx="4" fill={C.metalClair} stroke={C.txt} strokeWidth="2"/>
    {/* coupelle */}
    <path d={`M ${x + 42} 100 L ${x + 108} 100 L ${x + 98} 130 L ${x + 52} 130 Z`} fill="#fef3c7" stroke={C.txt} strokeWidth="2"/>
    {avecCylindre && <g><path d={`M ${x + 60} 58 L ${x + 60} 92 A 15 5 0 0 0 ${x + 90} 92 L ${x + 90} 58 Z`} fill={C.metal} stroke={C.txt} strokeWidth="2"/><ellipse cx={x + 75} cy="58" rx="15" ry="5" fill={C.metalClair} stroke={C.txt} strokeWidth="2"/></g>}
    <T x={x + 75} y="222" fontSize="18" textAnchor="middle">{titre}</T>
  </g>);
}
export function SvgPesees() {
  return (
    <svg {...base('0 0 420 240', 'Deux pesées : la coupelle seule, puis la coupelle avec le cylindre. La masse du cylindre est la différence des deux affichages.')}>
      <Pesee x={20} titre="coupelle seule" affichage="12,4 g" avecCylindre={false}/>
      <Pesee x={250} titre="coupelle + cylindre" affichage="81,4 g" avecCylindre/>
      <T x="195" y="40" fontSize="18" textAnchor="middle" fill={C.gris}>pesée 1</T>
      <T x="195" y="62" fontSize="18" textAnchor="middle" fill={C.gris}>pesée 2 →</T>
    </svg>);
}

// ====================================================
//  SCÈNE : histogramme des tirages
// ====================================================
function ticksNice(lo, hi, n = 4) {
  const brut = (hi - lo) / n, e = Math.pow(10, Math.floor(Math.log10(brut))), f = brut / e, pas = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e;
  const t = []; for (let v = Math.ceil(lo / pas - 1e-9) * pas; v <= hi + 1e-9; v += pas) t.push(Number(v.toFixed(10)));
  return { t, pas };
}
const decPas = pas => Math.max(0, Math.min(6, -Math.floor(Math.log10(pas) + 1e-9)));
// h : histogramme (M.histogramme) ; centre : valeur calculée ; u : incertitude de la formule ; moy : moyenne des tirages (facultative) ; sansBande : masque la bande ± u
export function SvgHisto({ h, centre, u, moy = null, unite, sym = 'ρ', idPrefixe = 'h', vide = false, sansBande = false, label }) {
  const x0 = 58, x1 = 404, yT = 22, yB = 176, larg = (x1 - x0) / M.NB_CLASSES;
  const lo = h.lo, hi = h.lo + h.w * M.NB_CLASSES, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0);
  const ymax = Math.max(h.max, 1), ty = ticksNice(0, ymax, 3), yMax = ty.t[ty.t.length - 1] >= ymax ? ty.t[ty.t.length - 1] : ymax;
  const Y = v => yB - v / yMax * (yB - yT);
  const tx = ticksNice(lo, hi, 4), dx = decPas(tx.pas);
  return (
    <svg {...base('0 0 420 300', label || `Histogramme des valeurs de ${sym} calculées à chaque tirage`)}>
      <defs><pattern id={`${idPrefixe}-hach`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke={C.orange} strokeWidth="2.5"/></pattern></defs>
      {ty.t.map(v => <g key={v}><line x1={x0} x2={x1} y1={Y(v)} y2={Y(v)} stroke={C.grisClair} strokeWidth="1"/><T x={x0 - 6} y={Y(v) + 5} fontSize="18" textAnchor="end" fill={C.gris}>{v}</T></g>)}
      {!sansBande && !vide && <rect x={X(centre - u)} y={yT} width={Math.max(2, X(centre + u) - X(centre - u))} height={yB - yT} fill={`url(#${idPrefixe}-hach)`} opacity="0.45"/>}
      {!vide && h.n.map((n, i) => n > 0 && <rect key={i} x={x0 + i * larg + 1} y={Y(n)} width={larg - 2} height={yB - Y(n)} fill={C.bleu} opacity="0.88"/>)}
      <line x1={x0} x2={x1} y1={yB} y2={yB} stroke={C.txt} strokeWidth="1.5"/>
      {!vide && <line x1={X(centre)} x2={X(centre)} y1={yT - 4} y2={yB} stroke={C.orange} strokeWidth="2.5"/>}
      {!vide && moy != null && <line x1={X(moy)} x2={X(moy)} y1={yT - 4} y2={yB} stroke={C.txt} strokeWidth="2.5" strokeDasharray="6 4"/>}
      {tx.t.map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={yB} y2={yB + 6} stroke={C.txt}/><T x={X(v)} y={yB + 24} fontSize="18" textAnchor="middle">{virg(v, dx)}</T></g>)}
      <T x={(x0 + x1) / 2} y={yB + 48} fontSize="18" textAnchor="middle" fill={C.gris}>{`valeur de ${sym} (${unite})`}</T>
      <T x="14" y={(yT + yB) / 2} fontSize="18" textAnchor="middle" fill={C.gris} transform={`rotate(-90 14 ${(yT + yB) / 2})`}>nombre de tirages</T>
      {vide && <T x={(x0 + x1) / 2} y={(yT + yB) / 2 + 6} fontSize="20" textAnchor="middle" fill={C.gris}>aucun tirage pour l’instant</T>}
      {/* légende */}
      <rect x="20" y="250" width="22" height="14" fill={C.bleu} opacity="0.88"/><T x="48" y="263" fontSize="18">tirages</T>
      {!sansBande && <g><rect x="130" y="250" width="22" height="14" fill={`url(#${idPrefixe}-hach)`} stroke={C.orange} strokeWidth="1"/><T x="158" y="263" fontSize="18">{`bande ${sym} ± u (formule)`}</T></g>}
      <line x1="20" x2="42" y1="287" y2="287" stroke={C.orange} strokeWidth="2.5"/><T x="48" y="293" fontSize="18">{`${sym} calculée`}</T>
      {moy != null && <g><line x1="170" x2="192" y1="287" y2="287" stroke={C.txt} strokeWidth="2.5" strokeDasharray="6 4"/><T x="198" y="293" fontSize="18">moyenne des tirages</T></g>}
    </svg>);
}

// ====================================================
//  SCÈNE : résultat et valeur de référence
// ====================================================
// lignes : [{ nom, m, u }] ; ref : valeur de référence ; [lo, hi] : cadre de l'axe (fixe pour comparer les deux cas)
export function SvgComparaison({ lignes, valRef, lo, hi, unite = 'g/cm³', sym = 'ρ', dec = 2 }) {
  const x0 = 30, x1 = 392, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), tx = ticksNice(lo, hi, 4), dx = Math.max(dec, decPas(tx.pas));
  const hauteur = 70 + lignes.length * 62 + 70, yAxe = 52 + lignes.length * 62;
  return (
    <svg {...base(`0 0 420 ${hauteur}`, 'Résultat de la mesure avec son incertitude-type, placé par rapport à la valeur de référence')}>
      <line x1={X(valRef)} x2={X(valRef)} y1="40" y2={yAxe} stroke={C.vert} strokeWidth="3" strokeDasharray="8 5"/>
      <T x={X(valRef)} y="26" fontSize="18" textAnchor="middle" fontWeight="700" fill={C.vert}>valeur de référence</T>
      {lignes.map((l, i) => { const y = 78 + i * 62; return (<g key={l.nom}>
        <T x={x0} y={y - 18} fontSize="18" fontWeight="700">{l.nom}</T>
        <line x1={X(l.m - l.u)} x2={X(l.m + l.u)} y1={y} y2={y} stroke={C.bleu} strokeWidth="4"/>
        <line x1={X(l.m - l.u)} x2={X(l.m - l.u)} y1={y - 10} y2={y + 10} stroke={C.bleu} strokeWidth="3"/>
        <line x1={X(l.m + l.u)} x2={X(l.m + l.u)} y1={y - 10} y2={y + 10} stroke={C.bleu} strokeWidth="3"/>
        <circle cx={X(l.m)} cy={y} r="6.5" fill={C.bleu} stroke="#fff" strokeWidth="1.5"/>
      </g>); })}
      <line x1={x0} x2={x1} y1={yAxe} y2={yAxe} stroke={C.txt} strokeWidth="1.5"/>
      {tx.t.map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={yAxe} y2={yAxe + 6} stroke={C.txt}/><T x={X(v)} y={yAxe + 24} fontSize="18" textAnchor="middle">{virg(v, dx)}</T></g>)}
      <T x={(x0 + x1) / 2} y={yAxe + 50} fontSize="18" textAnchor="middle" fill={C.gris}>{`${sym} (${unite}) · point : résultat · trait : ± u`}</T>
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320)
// ====================================================
const bc = (label, vb) => base(vb, label, 320);

// 1. Pythagore : les incertitudes se composent comme les côtés d'un triangle rectangle
export function SvgCartePythagore() {
  return (
    <svg {...bc('Un triangle rectangle dont les côtés sont u(x) et u(y) et l’hypoténuse u(G), et les deux formules de composition', '0 0 320 320')}>
      <polygon points="30,140 200,140 200,92" fill={C.bleuClair} opacity="0.35" stroke="none"/>
      <line x1="30" y1="140" x2="200" y2="140" stroke={C.bleu} strokeWidth="5"/>
      <line x1="200" y1="140" x2="200" y2="92" stroke={C.orange} strokeWidth="5" strokeDasharray="12 5"/>
      <line x1="30" y1="140" x2="200" y2="92" stroke={C.txt} strokeWidth="5"/>
      <polyline points="184,140 184,124 200,124" fill="none" stroke={C.txt} strokeWidth="2"/>
      <T x="115" y="168" fontSize="16" fontWeight="700" textAnchor="middle" fill={C.bleu}>u(x)</T>
      <T x="212" y="122" fontSize="16" fontWeight="700" fill={C.orange}>u(y)</T>
      <T x="94" y="96" fontSize="16" fontWeight="700" textAnchor="middle">u(G)</T>
      <T x="160" y="30" fontSize="16" fontWeight="700" textAnchor="middle">on additionne les carrés,</T>
      <T x="160" y="50" fontSize="16" fontWeight="700" textAnchor="middle">pas les longueurs</T>
      <T x="160" y="192" fontSize="15.5" textAnchor="middle" fill={C.gris}>u(G) est plus petite que u(x) + u(y)</T>
      <rect x="10" y="204" width="300" height="48" rx="8" fill="#f8fafc" stroke={C.gris} strokeWidth="1.5"/>
      <T x="160" y="224" fontSize="15.5" textAnchor="middle" fontWeight="700">G = x + y ou G = x − y</T>
      <T x="160" y="244" fontSize="15.5" textAnchor="middle">u(G)² = u(x)² + u(y)²</T>
      <rect x="10" y="260" width="300" height="48" rx="8" fill="#f8fafc" stroke={C.gris} strokeWidth="1.5"/>
      <T x="160" y="280" fontSize="15.5" textAnchor="middle" fontWeight="700">produit ou quotient de x et y :</T>
      <T x="160" y="300" fontSize="15.5" textAnchor="middle">même triangle, incert. relatives</T>
    </svg>);
}

// 2. Qui domine ?
export function SvgCarteDominant() {
  const bars = [['x', 4, C.bleu, null], ['y', 1, C.orange, null], ['z', 0.5, C.gris, null], ['G', 4.2, C.txt, 'hach']];
  const base0 = 204, ech = 28;
  return (
    <svg {...bc('Quatre barres : les incertitudes relatives de x, y et z (4 %, 1 % et 0,5 %) et celle de G, à peine plus grande que la plus grande des trois', '0 0 320 296')}>
      <defs><pattern id="cd-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#fff" strokeWidth="3"/></pattern></defs>
      <line x1="30" y1={base0} x2="300" y2={base0} stroke={C.txt} strokeWidth="2"/>
      {bars.map(([nom, v, c, hach], i) => { const x = 46 + i * 66, h = v * ech; return (<g key={nom}>
        <rect x={x} y={base0 - h} width="44" height={h} fill={c}/>
        {hach && <rect x={x} y={base0 - h} width="44" height={h} fill="url(#cd-hach)"/>}
        <T x={x + 22} y={base0 - h - 8} fontSize="16" fontWeight="700" textAnchor="middle">{virg(v, v < 1 || v === 4.2 ? 1 : 0)} %</T>
        <T x={x + 22} y={base0 + 20} fontSize="16" fontWeight="700" textAnchor="middle">{nom}</T></g>); })}
      <line x1="30" y1={base0 - 4 * ech} x2="300" y2={base0 - 4 * ech} stroke={C.gris} strokeWidth="1.5" strokeDasharray="5 4"/>
      <T x="160" y="30" fontSize="16" fontWeight="700" textAnchor="middle">le plus grand terme domine</T>
      <T x="160" y="52" fontSize="15.5" textAnchor="middle" fill={C.gris}>(exemple : incertitudes relatives)</T>
      <T x="160" y="250" fontSize="15.5" textAnchor="middle">améliorer x : u(G) baisse nettement</T>
      <T x="160" y="268" fontSize="15.5" textAnchor="middle">améliorer y ou z : presque rien</T>
      <T x="160" y="286" fontSize="15.5" textAnchor="middle" fill={C.gris}>exemple : pas à l’échelle</T>
    </svg>);
}

// 3. Monte-Carlo
export function SvgCarteMonteCarlo() {
  const bloc = (y, h, t1, t2) => (<g><rect x="30" y={y} width="260" height={h} rx="10" fill="#f8fafc" stroke={C.txt} strokeWidth="2"/>
    <T x="160" y={y + 22} fontSize="16" fontWeight="700" textAnchor="middle">{t1}</T>{t2 && <T x="160" y={y + 41} fontSize="15.5" textAnchor="middle">{t2}</T>}</g>);
  const fl = y => <g><line x1="160" y1={y} x2="160" y2={y + 20} stroke={C.txt} strokeWidth="2.5"/><polygon points={`160,${y + 26} 153,${y + 15} 167,${y + 15}`} fill={C.txt}/></g>;
  return (
    <svg {...bc('Principe de la simulation : tirer les grandeurs au hasard, calculer G, recommencer N fois, puis tracer l’histogramme et calculer son écart-type', '0 0 320 340')}>
      {bloc(10, 52, '1. tirer x, y, … au hasard', 'loi normale, écart-type = u')}
      {fl(62)}
      {bloc(92, 40, '2. calculer G pour ce tirage')}
      {fl(132)}
      {bloc(162, 40, '3. recommencer N fois')}
      <path d="M 290 182 Q 312 182 312 100 Q 312 36 292 36" fill="none" stroke={C.gris} strokeWidth="2" strokeDasharray="5 4"/>
      {fl(202)}
      {bloc(232, 52, '4. histogramme de G', 'écart-type des N valeurs ≈ u(G)')}
      <T x="160" y="312" fontSize="15.5" textAnchor="middle" fontWeight="700">N = nombre de tirages simulés</T>
      <T x="160" y="327" fontSize="15.5" textAnchor="middle">(≠ mesures réelles)</T>
    </svg>);
}

// 4. Écrire le résultat
export function SvgCarteEcriture() {
  return (
    <svg {...bc('Exemple d’écriture : u = 0,0462 s’arrondit à 0,05 et la valeur 12,3456 à 12,35, soit 12,35 ± 0,05', '0 0 320 270')}>
      <T x="160" y="22" fontSize="15.5" textAnchor="middle" fill={C.gris}>exemple (autres valeurs que la simulation)</T>
      <T x="14" y="52" fontSize="16" fontWeight="700">calculatrice</T>
      <T x="170" y="52" fontSize="16" fontWeight="700">on écrit</T>
      <T x="14" y="80" fontSize="16" fontFamily="monospace">u = 0,0462</T>
      <T x="14" y="108" fontSize="16" fontFamily="monospace">G = 12,3456</T>
      <line x1="134" y1="75" x2="152" y2="75" stroke={C.gris} strokeWidth="2"/><polygon points="158,75 149,70 149,80" fill={C.gris}/>
      <line x1="134" y1="103" x2="152" y2="103" stroke={C.gris} strokeWidth="2"/><polygon points="158,103 149,98 149,108" fill={C.gris}/>
      <rect x="199" y="65" width="10" height="19" fill={C.orangeClair} opacity="0.8"/>
      <rect x="208" y="93" width="10" height="19" fill={C.orangeClair} opacity="0.8"/>
      <T x="170" y="80" fontSize="16" fontFamily="monospace">0,05</T>
      <T x="170" y="108" fontSize="16" fontFamily="monospace">12,35</T>
      <T x="14" y="140" fontSize="15.5">u : 1 chiffre significatif, par excès</T>
      <T x="14" y="158" fontSize="15.5">(2 chiffres si le premier est 1)</T>
      <T x="14" y="176" fontSize="15.5">G : arrondi à la même décimale que u</T>
      <rect x="20" y="188" width="280" height="40" rx="10" fill="#f8fafc" stroke={C.txt} strokeWidth="2.5"/>
      <T x="160" y="215" fontSize="19" textAnchor="middle" fontWeight="700">G = 12,35 ± 0,05 unité</T>
      <T x="160" y="250" fontSize="15.5" textAnchor="middle">et l’unité est toujours écrite</T>
    </svg>);
}

// 5. Comparer à une valeur de référence : le quotient z
export function SvgCarteZ() {
  return (
    <svg {...bc('Schéma qualitatif : la valeur de référence, le résultat avec son incertitude-type, l’écart entre les deux, et une échelle de z avec le seuil conventionnel 2', '0 0 320 290')}>
      <T x="160" y="22" fontSize="15.5" textAnchor="middle" fill={C.gris}>schéma qualitatif, pas à l’échelle</T>
      <line x1="60" y1="40" x2="60" y2="120" stroke={C.vert} strokeWidth="3" strokeDasharray="8 5"/>
      <T x="60" y="136" fontSize="15.5" textAnchor="middle" fontWeight="700" fill={C.vert}>référence</T>
      <line x1="170" y1="86" x2="270" y2="86" stroke={C.bleu} strokeWidth="4"/>
      <line x1="170" y1="76" x2="170" y2="96" stroke={C.bleu} strokeWidth="3"/><line x1="270" y1="76" x2="270" y2="96" stroke={C.bleu} strokeWidth="3"/>
      <circle cx="220" cy="86" r="6.5" fill={C.bleu}/>
      <T x="220" y="64" fontSize="15.5" textAnchor="middle" fontWeight="700" fill={C.bleu}>résultat ± u</T>
      <Cote x1={60} y1={108} x2={220} y2={108} c={C.orange}/>
      <T x="140" y="128" fontSize="15.5" textAnchor="middle" fontWeight="700" fill={C.orange}>écart</T>
      <T x="160" y="166" fontSize="16" textAnchor="middle" fontWeight="700">z = écart divisé par u</T>
      <line x1="30" y1="214" x2="290" y2="214" stroke={C.txt} strokeWidth="2"/>
      <rect x="30" y="198" width="130" height="16" fill={C.vert} opacity="0.3"/>
      <rect x="160" y="198" width="130" height="16" fill="url(#cz-hach)"/>
      <defs><pattern id="cz-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke={C.rouge} strokeWidth="2.5"/></pattern></defs>
      <line x1="160" y1="190" x2="160" y2="222" stroke={C.txt} strokeWidth="3"/>
      <T x="30" y="240" fontSize="15.5">0</T><T x="160" y="240" fontSize="15.5" textAnchor="middle" fontWeight="700">2</T><T x="290" y="240" fontSize="15.5" textAnchor="end">z</T>
      <T x="95" y="190" fontSize="15.5" textAnchor="middle" fontWeight="700" fill={C.vert}>compatible</T>
      <T x="225" y="190" fontSize="15.5" textAnchor="middle" fontWeight="700" fill={C.rouge}>à discuter</T>
      <T x="160" y="266" fontSize="15.5" textAnchor="middle">seuil 2 : convention d’usage,</T>
      <T x="160" y="283" fontSize="15.5" textAnchor="middle">pas une loi de la nature</T>
    </svg>);
}

// 6. Que faire quand z est grand ?
export function SvgCarteQueFaire() {
  const ligne = (y, ok, l1, l2) => (<g>
    <rect x="10" y={y} width="300" height="50" rx="9" fill={ok ? '#f0fdf4' : '#fef2f2'} stroke={ok ? C.vert : C.rouge} strokeWidth="2" strokeDasharray={ok ? undefined : '6 4'}/>
    <circle cx="34" cy={y + 25} r="13" fill={ok ? C.vert : C.rouge}/>
    {ok ? <polyline points={`27,${y + 25} 32,${y + 31} 42,${y + 19}`} fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      : <g stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><line x1="28" y1={y + 19} x2="40" y2={y + 31}/><line x1="40" y1={y + 19} x2="28" y2={y + 31}/></g>}
    <T x="56" y={y + 22} fontSize="15.5" fontWeight="700">{l1}</T><T x="56" y={y + 40} fontSize="15.5">{l2}</T></g>);
  return (
    <svg {...bc('Quand z dépasse le seuil : chercher une erreur ou une incertitude oubliée, vérifier la référence ; ne pas agrandir u pour rentrer sous le seuil', '0 0 320 312')}>
      <rect x="14" y="8" width="292" height="34" rx="17" fill={C.txt}/>
      <T x="160" y="31" fontSize="16" fontWeight="700" textAnchor="middle" fill="#fff">z nettement plus grand que 2</T>
      <line x1="160" y1="42" x2="160" y2="56" stroke={C.txt} strokeWidth="2.5"/>
      {ligne(58, true, 'erreur systématique ?', 'étalonnage, zéro, protocole')}
      {ligne(116, true, 'incertitude oubliée ?', 'source non prise en compte')}
      {ligne(174, true, 'référence adaptée ?', 'matériau, conditions, valeur')}
      {ligne(244, false, 'agrandir u pour passer', 'sous le seuil : à ne pas faire')}
    </svg>);
}
