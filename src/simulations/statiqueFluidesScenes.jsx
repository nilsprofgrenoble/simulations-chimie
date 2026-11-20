import { TV } from "./Travail";
import { COL, stl, NB, nbf, milliers, XC, Y_RIM, Y_SURF, Y_BOT, FORMES } from "./statiqueFluidesOutils";
// ====================================================
//  Scènes de la simulation « Statique des fluides : pression et profondeur » (1G, sim 163).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités dans un viewBox de 480 de large.
//  Flèches : trait fin à bouts arrondis et pointe de taille FIXE (dessinée à la main, pas de marker SVG).
// ====================================================

// Flèche fine : trait raccourci de la longueur de la pointe + pointe triangulaire fixe
export function Fleche({ x1, y1, x2, y2, c = COL.bleu, w = 2.2, tip = 10, demi = 4.6, op = 1 }) {
  const dx = x2 - x1, dy = y2 - y1, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, t = Math.min(tip, n * 0.8);
  const bx = x2 - ux * t, by = y2 - uy * t;
  return <g opacity={op} strokeLinecap="round" strokeLinejoin="round">
    <line x1={x1} y1={y1} x2={bx + ux * 1} y2={by + uy * 1} stroke={c} strokeWidth={w} />
    <polygon points={`${x2},${y2} ${bx - uy * demi},${by + ux * demi} ${bx + uy * demi},${by - ux * demi}`} fill={c} stroke={c} strokeWidth="1" />
  </g>;
}
// Flèche à deux pointes (cote)
export const Cote = ({ x1, y1, x2, y2, c = COL.gris, w = 1.8 }) => <g><Fleche x1={x1} y1={y1} x2={x2} y2={y2} c={c} w={w} tip={8} demi={3.8} /><Fleche x1={x2} y1={y2} x2={x1} y2={y1} c={c} w={w} tip={8} demi={3.8} /></g>;

const gradId = (cle) => `sf-eau-${cle}`;

// Sonde de pression : capsule métallique, membrane claire sur la face inférieure
function Sonde({ x, y }) {
  return <g>
    <rect x={x - 8} y={y - 14} width="16" height="26" rx="5" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
    <rect x={x - 5} y={y + 7} width="10" height="3.5" rx="1.75" fill="#e2e8f0" />
    <line x1={x - 8} y1={y - 6} x2={x + 8} y2={y - 6} stroke="#94a3b8" strokeWidth="1.2" />
  </g>;
}

// ---------- scène : récipient, liquide, sonde(s), axe z, afficheur ----------
//  h : profondeur de la sonde (m) ou null ; hmax : profondeur correspondant au fond ; ecran : { valeur, unite, nom } ou null
//  points : repères [{ nom, h }] (A, B…) ; axe : axe z orienté vers le haut, origine à la surface ; cote : étiquette « h = … » à droite
export function SceneCuve({ h = null, hmax = 10, liquide, forme = 'large', ecran = null, points = [], axe = false, cote = true, coteTxt = null, nomSonde = null, xs = XC, dec = null, titre = 'Un récipient rempli de liquide', cleGrad = 'a', note = null }) {
  const F = FORMES[forme] || FORMES.large, yDe = d => Y_SURF + (Math.min(d, hmax) / hmax) * (Y_BOT - 6 - Y_SURF);
  const [c1, c2] = liquide.couleur, gid = gradId(cleGrad);
  const contour = `M${F.xl(Y_RIM)},${Y_RIM - 14} L${F.xl(Y_RIM)},${Y_RIM} L${F.xl(Y_BOT)},${Y_BOT} L${F.xr(Y_BOT)},${Y_BOT} L${F.xr(Y_RIM)},${Y_RIM} L${F.xr(Y_RIM)},${Y_RIM - 14}`;
  const eau = `M${F.xl(Y_SURF)},${Y_SURF} L${F.xl(Y_BOT)},${Y_BOT} L${F.xr(Y_BOT)},${Y_BOT} L${F.xr(Y_SURF)},${Y_SURF} Z`;
  const py = h == null ? null : yDe(h), droite = F.xr(Y_BOT) + 22, d1 = dec == null ? (h != null && h < 1 ? 2 : 1) : dec;
  const aria = `${titre}. ${liquide.nom}, récipient « ${F.nom.toLowerCase()} »${h != null ? `, sonde de pression${coteTxt ? '' : ` à ${nbf(h, d1)} mètre${h >= 2 ? 's' : ''} de profondeur`}` : ''}${ecran ? `, l’afficheur indique ${ecran.valeur} ${ecran.unite}` : ''}.`;
  return (
    <svg viewBox="0 0 480 330" style={stl} role="img" aria-label={aria}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
      </defs>
      {axe && <g>
        <Fleche x1={96} y1={Y_BOT} x2={96} y2={64} c={COL.encre} w={2.2} />
        <text x="96" y="52" fontSize="18" fontWeight="700" fontStyle="italic" textAnchor="middle" fill={COL.encre}>z</text>
        <line x1="88" y1={Y_SURF} x2="104" y2={Y_SURF} stroke={COL.encre} strokeWidth="2.2" strokeLinecap="round" />
        <text x="82" y={Y_SURF + 6} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.encre}>z = 0</text>
      </g>}
      <path d={eau} fill={`url(#${gid})`} />
      <line x1={F.xl(Y_SURF)} y1={Y_SURF} x2={F.xr(Y_SURF)} y2={Y_SURF} stroke="#ffffff" strokeOpacity="0.85" strokeWidth="2" />
      <path d={contour} fill="none" stroke={COL.verre} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* repères A, B… */}
      {points.map(p => { const y = yDe(p.h); return <g key={p.nom}>
        {axe && <g><line x1="96" y1={y} x2={(p.x ?? XC) - 11} y2={y} stroke={COL.gris} strokeWidth="1.6" strokeDasharray="4 5" strokeLinecap="round" />
          <circle cx="96" cy={y} r="4.2" fill={COL.encre} /></g>}
        <circle cx={p.x ?? XC} cy={y} r="6" fill="#fff" stroke={COL.orange} strokeWidth="3" />
        <text x={(p.x ?? XC) + 14} y={y + 6} fontSize="19" fontWeight="700" fill={COL.orange} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{p.nom}</text>
      </g>; })}
      {/* sonde, câble et afficheur */}
      {h != null && <g>
        {ecran && <path d={`M${xs},${py - 14} L${xs},${Y_RIM - 34} Q${xs},${Y_RIM - 43} ${xs + 11},${Y_RIM - 43} L350,${Y_RIM - 43}`} fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />}
        {cote && <g>
          <line x1={xs + 10} y1={py} x2={droite + 6} y2={py} stroke={COL.orange} strokeWidth="1.6" strokeDasharray="4 5" strokeLinecap="round" />
          <text x={droite + 12} y={py + 6} fontSize="17" fontWeight="700" fill={COL.orange}>{coteTxt || `h = ${nbf(h, d1)}${NB}m`}</text>
        </g>}
        <Sonde x={xs} y={py} />
        {nomSonde && <text x={xs - 14} y={py + 6} fontSize="19" fontWeight="700" textAnchor="end" fill={COL.orange} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{nomSonde}</text>}
      </g>}
      {ecran && <g>
        <rect x="350" y="16" width="118" height="56" rx="11" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        <text x="409" y="47" fontSize="24" fontWeight="700" textAnchor="middle" fill="#bbf7d0" fontFamily="monospace">{ecran.valeur}</text>
        <text x="409" y="65" fontSize="16" textAnchor="middle" fill="#cbd5e1">{ecran.unite}</text>
        <text x="409" y="94" fontSize="16" textAnchor="middle" fill={COL.gris}>{ecran.nom || 'manomètre'}</text>
      </g>}
      {note && <text x="240" y="323" fontSize="16" textAnchor="middle" fill={COL.gris}>{note}</text>}
    </svg>
  );
}

// ---------- scène : trois branches communicantes de formes différentes (même niveau) ----------
export function SceneVases({ liquide, legende = 'A, B et C sont à la même profondeur', titre = 'Trois branches communicantes de formes différentes' }) {
  const [c1, c2] = liquide.couleur;
  const eau = 'M30,70 H150 V270 H220 V70 H260 V270 H380 V200 L330,70 H450 L410,200 V290 H30 Z';
  const yP = 170, pts = [['A', 90], ['B', 240], ['C', 394]];
  return (
    <svg viewBox="0 0 480 340" style={stl} role="img" aria-label={`${titre}. Trois récipients reliés par le bas contiennent le même liquide : une cuve large, un tube étroit et un vase évasé. Les points A, B et C sont à la même profondeur.`}>
      <defs><linearGradient id="sf-vases" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      <path d="M150,48 H220 V270 H150 Z" fill="#f1f5f9" /><path d="M260,48 H330 L380,200 V270 H260 Z" fill="#f1f5f9" />
      <path d={eau} fill="url(#sf-vases)" />
      <line x1="30" y1="70" x2="150" y2="70" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" /><line x1="220" y1="70" x2="260" y2="70" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" /><line x1="330" y1="70" x2="450" y2="70" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" />
      <g fill="none" stroke={COL.verre} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30,48 V290 H410 V200 L450,70 V48" /><path d="M150,48 V270 H220 V48" /><path d="M260,48 V270 H380 V200 L330,70 V48" />
      </g>
      <line x1="14" y1={yP} x2="466" y2={yP} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="5 6" strokeLinecap="round" />
      {pts.map(([n, x]) => <g key={n}><circle cx={x} cy={yP} r="6.5" fill="#fff" stroke={COL.orange} strokeWidth="3" />
        <text x={x} y={yP - 14} fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.orange} stroke="#fff" strokeWidth="3.5" paintOrder="stroke">{n}</text></g>)}
      <text x="240" y="328" fontSize="21" fontWeight="700" textAnchor="middle" fill={COL.encre}>{legende}</text>
    </svg>
  );
}

// ---------- scène : pression sur la paroi (flèches de pression) et force sur un bouchon ----------
export function SceneParoi({ avecForce = true, titre = 'Force de l’eau sur un bouchon', note = 'h = 2,0 m ; S = 25 cm²' }) {
  const xl = 92, xr = 292, yS = 70, yB = 276, yBo = [186, 222];
  const niveaux = [92, 118, 144, 170, 196, 222, 248];
  return (
    <svg viewBox="0 0 480 336" style={stl} role="img" aria-label={`${titre}. Un réservoir d’eau, vu en coupe : les flèches bleues, perpendiculaires aux parois, sont d’autant plus longues que l’on est profond. Un bouchon de surface S est placé dans la paroi de droite, à la profondeur h = 2,0 mètres ; l’eau le pousse vers l’extérieur.`}>
      <defs><linearGradient id="sf-paroi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfeafc" /><stop offset="1" stopColor="#7cc0ee" /></linearGradient></defs>
      <rect x={xl} y={yS} width={xr - xl} height={yB - yS} fill="url(#sf-paroi)" />
      <line x1={xl} y1={yS} x2={xr} y2={yS} stroke="#fff" strokeOpacity="0.85" strokeWidth="2" />
      {niveaux.map(y => { const L = (y - yS) * 0.4; return <g key={y}>
        <Fleche x1={xr - L} y1={y} x2={xr - 3} y2={y} c={COL.bleu} w={2} tip={9} demi={4} op={0.85} />
        <Fleche x1={xl + L} y1={y} x2={xl + 3} y2={y} c={COL.bleu} w={2} tip={9} demi={4} op={0.85} /></g>; })}
      <path d={`M${xl},${yS - 22} V${yB} H${xr} V${yS - 22}`} fill="none" stroke={COL.verre} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={xr - 5} y={yBo[0]} width="10" height={yBo[1] - yBo[0]} rx="2" fill={COL.orange} stroke="#7c2d12" strokeWidth="1.5" />
      <Cote x1={58} y1={yS} x2={58} y2={(yBo[0] + yBo[1]) / 2} />
      <text x="48" y={(yS + (yBo[0] + yBo[1]) / 2) / 2 + 6} fontSize="19" fontWeight="700" fontStyle="italic" textAnchor="end" fill={COL.encre}>h</text>
      {avecForce && <g>
        <Fleche x1={xr + 8} y1={(yBo[0] + yBo[1]) / 2} x2={xr + 96} y2={(yBo[0] + yBo[1]) / 2} c={COL.orange} w={3} tip={13} demi={6} />
        <TV x={xr + 44} y={(yBo[0] + yBo[1]) / 2 - 22} c={COL.orange} s={20}>F</TV>
      </g>}
      <line x1={xr + 4} y1={(yBo[1] + 4)} x2={xr + 50} y2={yBo[1] + 30} stroke={COL.gris} strokeWidth="1.5" strokeLinecap="round" />
      <text x={xr + 54} y={yBo[1] + 42} fontSize="17" fill={COL.encre}>bouchon (S)</text>
      <text x="240" y="304" fontSize="17" textAnchor="middle" fill={COL.gris}>flèches bleues : pression de l’eau</text>
      <text x="240" y="326" fontSize="17" textAnchor="middle" fill={COL.encre}>{note}</text>
    </svg>
  );
}

// ---------- graphe P(h) : points, droite éventuelle ----------
//  pts : [{ x (m), y (hPa) }] ; droite : { pente (hPa/m), ord (hPa) } ou null ; point mis en valeur : cur
export function GraphePH({ pts = [], droite = null, xMax = 10, yMin = 1000, yMax = 2000, pasX = 2, pasY = 200, cur = null, titre = 'Pression absolue P en fonction de la profondeur h' }) {
  const L = 78, R = 462, T = 36, B = 244, W = R - L, H = B - T;
  const X = x => L + (x / xMax) * W, Y = y => B - ((y - yMin) / (yMax - yMin)) * H;
  const tx = [], ty = []; for (let x = 0; x <= xMax + 1e-9; x += pasX) tx.push(x); for (let y = yMin; y <= yMax + 1e-9; y += pasY) ty.push(y);
  let seg = null;
  if (droite) { const y0 = droite.ord, y1 = droite.ord + droite.pente * xMax; const c = v => Math.max(yMin, Math.min(yMax, v));
    const x0 = droite.pente ? (c(y0) - droite.ord) / droite.pente : 0, xe = droite.pente ? (c(y1) - droite.ord) / droite.pente : xMax; seg = [X(x0), Y(c(y0)), X(xe), Y(c(y1))]; }
  return (
    <svg viewBox="0 0 480 306" style={stl} role="img" aria-label={`${titre}. ${pts.length} point${pts.length > 1 ? 's' : ''} relevé${pts.length > 1 ? 's' : ''}${droite ? ', droite d’ajustement tracée' : ''}.`}>
      {ty.map(y => <g key={y}><line x1={L} y1={Y(y)} x2={R} y2={Y(y)} stroke="#e2e8f0" strokeWidth="1.2" /><text x={L - 8} y={Y(y) + 5.5} fontSize="16" textAnchor="end" fill={COL.encre}>{milliers(y)}</text></g>)}
      {tx.map(x => <g key={x}><line x1={X(x)} y1={B} x2={X(x)} y2={B + 6} stroke={COL.encre} strokeWidth="1.6" /><text x={X(x)} y={B + 24} fontSize="16" textAnchor="middle" fill={COL.encre}>{String(x).replace('.', ',')}</text></g>)}
      <line x1={L} y1={B} x2={R} y2={B} stroke={COL.encre} strokeWidth="2" strokeLinecap="round" /><line x1={L} y1={T} x2={L} y2={B} stroke={COL.encre} strokeWidth="2" strokeLinecap="round" />
      <text x={R} y={B + 44} fontSize="16" textAnchor="end" fontWeight="700" fill={COL.encre}>h (m)</text>
      <text x={L - 8} y={16} fontSize="16" fontWeight="700" fill={COL.encre}>P (hPa)</text>
      {seg && <line x1={seg[0]} y1={seg[1]} x2={seg[2]} y2={seg[3]} stroke={COL.vert} strokeWidth="2.4" strokeLinecap="round" />}
      {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(Math.max(yMin, Math.min(yMax, p.y)))} r="5.5" fill={COL.bleu} stroke="#fff" strokeWidth="1.8" />)}
      {cur && <circle cx={X(cur.x)} cy={Y(Math.max(yMin, Math.min(yMax, cur.y)))} r="8" fill="none" stroke={COL.orange} strokeWidth="3" />}
    </svg>
  );
}
