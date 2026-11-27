// Cartes « À retenir » de la simulation 320 (géométries, stabilité des carbocations, carbanions et attracteurs, produit majoritaire, bilan).
// viewBox de 300 de large, textes de 12 à 16, maxWidth 320. Doublet non liant = trait ; électron célibataire = point.
import { K, svgStyle } from "./schemaOutils";

const OR = '#ea580c', VERT = '#15803d', ROUGE = '#b91c1c', TEAL = '#0f766e';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const t = (x, y, s, o = {}) => <text x={x} y={y} textAnchor={o.a || 'middle'} fontSize={o.size || 12.5} fontWeight={o.gras ? 800 : 400} fill={o.fill || K.txt}>{s}</text>;
const disque = (x, y, lab = 'R', r = 11) => <g><circle cx={x} cy={y} r={r} fill="#e2e8f0" stroke="#64748b" strokeWidth="1.6"/><text x={x} y={y + 4.6} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={K.txt}>{lab}</text></g>;
const C = (x, y) => <g><circle cx={x} cy={y} r="11" fill="#fff" stroke={K.txt} strokeWidth="2.2"/><text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill={K.txt}>C</text></g>;
const liens = (x, y, L) => L.map(([a, b], i) => <line key={i} x1={x} y1={y} x2={a} y2={b} stroke={K.txt} strokeWidth="3" strokeLinecap="round"/>);
const lobe = (x, y, plein) => <ellipse cx={x} cy={y} rx="10" ry="16" fill={plein ? 'rgba(15,118,110,0.16)' : 'rgba(234,88,12,0.10)'} stroke={plein ? TEAL : OR} strokeWidth="1.8" strokeDasharray={plein ? '0' : '4 3'}/>;

// Carte 1 : trois intermédiaires, trois géométries
export function SvgGeometrieCarte() {
  const col = (x0, type) => {
    const cx = x0 + 50, cy = type === 'anion' ? 70 : 82, bas = type === 'anion' ? 24 : 0;
    const subs = [[cx - 32, cy + 6 + bas * 0.5], [cx + 32, cy + 6 + bas * 0.5], [cx, cy + 26 + bas * 0.5]];
    return (<g>
      {type === 'cation' && <>{lobe(cx, cy - 30, false)}{lobe(cx, cy + 30, false)}</>}
      {type === 'anion' && <>{lobe(cx, cy - 28, true)}<line x1={cx - 8} y1={cy - 28} x2={cx + 8} y2={cy - 28} stroke={TEAL} strokeWidth="4.4" strokeLinecap="round"/></>}
      {type === 'radical' && <>{lobe(cx, cy - 30, false)}{lobe(cx, cy + 30, false)}<circle cx={cx} cy={cy - 30} r="4" fill={OR}/></>}
      {liens(cx, cy, subs)}{subs.map(([a, b], i) => <g key={i}>{disque(a, b)}</g>)}{C(cx, cy)}
    </g>);
  };
  return cadre('Trois intermédiaires carbonés : le carbocation est plan (120°), le carbanion est pyramidal (environ 107°) et le radical est presque plan.', 238,
    <g>
      {t(150, 24, 'Un carbone à trois substituants R', { size: 14.5, gras: true })}
      {col(0, 'cation')}{col(100, 'anion')}{col(200, 'radical')}
      {t(50, 150, 'carbocation', { gras: true, fill: OR })}{t(150, 150, 'carbanion', { gras: true, fill: TEAL })}{t(250, 150, 'radical', { gras: true, fill: K.txt })}
      {t(50, 169, '3 liaisons', {})}{t(150, 169, '3 liaisons', {})}{t(250, 169, '3 liaisons', {})}
      {t(50, 187, 'AX₃E₀', { gras: true })}{t(150, 187, 'AX₃E₁', { gras: true })}{t(250, 187, '1 électron •', { gras: true })}
      {t(50, 207, 'plan, 120°', { fill: K.gris })}{t(150, 207, 'pyramide, ≈ 107°', { fill: K.gris })}{t(250, 207, 'presque plan', { fill: K.gris })}
      {t(150, 226, 'orbitale p vide', { size: 11.5, fill: OR, })}
    </g>);
}

// Carte 2 : stabilité des carbocations
export function SvgCationsCarte() {
  const data = [['0', 'CH₃⁺', 34, '#fed7aa'], ['I', 'R–CH₂⁺', 58, '#fdba74'], ['II', 'R₂CH⁺', 84, '#fb923c'], ['III', 'R₃C⁺', 112, '#ea580c']];
  return cadre('Stabilité des carbocations : un carbocation tertiaire (classe III) est plus stable qu’un secondaire (II), lui-même plus stable qu’un primaire (I). Chaque groupe alkyle donneur stabilise la charge +.', 246,
    <g>
      {t(150, 24, 'Carbocations : plus il y a de R, plus c’est stable', { size: 13.5, gras: true })}
      {data.map(([cl, f, h, c], i) => { const x = 28 + i * 66; return (<g key={i}>
        <rect x={x} y={176 - h} width="52" height={h} rx="7" fill={c} stroke={OR} strokeWidth="1.6"/>
        {t(x + 26, 176 - h - 6, cl === '0' ? 'méthyle' : `classe ${cl}`, { size: 12, gras: true })}
        {t(x + 26, 198, f, { size: 12.5 })}</g>); })}
      <path d="M 30 150 L 258 150" stroke="none"/>
      {t(150, 216, 'R = groupe alkyle, donneur d’électrons', { size: 12.5, fill: OR, gras: true })}
      {t(150, 233, 'il stabilise la charge +', { size: 12.5, fill: OR, gras: true })}
    </g>);
}

// Carte 3 : carbanions et groupes attracteurs
export function SvgAnionsCarte() {
  const ligne = (y, lab, sens, col, txt) => (<g>
    {t(46, y + 4, lab, { size: 13, gras: true })}
    <line x1="92" y1={y} x2="188" y2={y} stroke={col} strokeWidth="3.4" strokeLinecap="round"/><polygon points={sens > 0 ? `${188},${y - 6} ${200},${y} ${188},${y + 6}` : `${92},${y - 6} ${80},${y} ${92},${y + 6}`} fill={col}/>
    {t(250, y + 4, txt, { size: 12.5, gras: true, fill: col })}</g>);
  return cadre('Carbanion : l’ordre de stabilité est inversé par rapport au carbocation. Les groupes attracteurs comme Cl stabilisent un carbanion et déstabilisent un carbocation ; les groupes alkyles donneurs font l’inverse.', 250,
    <g>
      {t(150, 24, 'Donneur ou attracteur ?', { size: 14.5, gras: true })}
      {t(150, 52, 'carbocation +', { gras: true, fill: OR })}
      {ligne(78, 'donneur', 1, VERT, 'stabilise')}{ligne(106, 'attracteur', 1, ROUGE, 'déstabilise')}
      {t(150, 144, 'carbanion −', { gras: true, fill: TEAL })}
      {ligne(170, 'donneur', 1, ROUGE, 'déstabilise')}{ligne(198, 'attracteur', 1, VERT, 'stabilise')}
      {t(150, 232, 'donneur : CH₃    attracteur : Cl, C≡N', { size: 12, fill: K.gris })}
    </g>);
}

// Carte 4 : produit majoritaire
export function SvgProduitCarte() {
  return cadre('Produit majoritaire : de l’alcène, deux carbocations peuvent se former. Le plus stable (tertiaire) se forme le plus vite et conduit au produit majoritaire ; le secondaire donne le produit minoritaire.', 252,
    <g>
      {t(150, 24, 'Le carbocation le plus stable gagne', { size: 14.5, gras: true })}
      <rect x="14" y="94" width="78" height="44" rx="10" fill="#fff" stroke={K.clair} strokeWidth="1.6"/>
      {t(53, 114, 'alcène', { gras: true })}{t(53, 130, '+ H–Br', { size: 12 })}
      <path d="M 92 106 L 128 70" stroke={VERT} strokeWidth="4" fill="none" strokeLinecap="round"/><polygon points="128,70 118,72 126,80" fill={VERT}/>
      <path d="M 92 126 L 128 164" stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="5 4" strokeLinecap="round"/><polygon points="128,164 118,162 126,154" fill="#94a3b8"/>
      <rect x="130" y="48" width="154" height="46" rx="10" fill="#fff7ed" stroke={OR} strokeWidth="2.2"/>
      {t(207, 68, 'carbocation III', { gras: true, fill: OR })}{t(207, 85, 'le plus stable', { size: 12 })}
      <rect x="130" y="142" width="154" height="46" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="4 3"/>
      {t(207, 162, 'carbocation II', { gras: true, fill: K.gris })}{t(207, 179, 'moins stable', { size: 12 })}
      <polygon points="207,112 200,102 214,102" fill={VERT}/><line x1="207" y1="94" x2="207" y2="104" stroke={VERT} strokeWidth="3.4"/>
      {t(207, 128, 'produit majoritaire', { size: 12.5, gras: true, fill: VERT })}
      {t(150, 214, 'Br⁻ se fixe sur le carbone chargé', { size: 12.5 })}
      {t(150, 233, 'ici : le mécanisme est fourni', { size: 12, fill: K.gris })}
    </g>);
}

// Carte 5 : bilan
export function SvgBilanStaCarte() {
  const L = [['carbocation', 'plan, 120° ; stable si beaucoup de R donneurs', OR], ['carbanion', 'pyramide, ≈ 107° ; stable si attracteurs', TEAL], ['radical', 'presque plan ; stabilisé par les alkyles', K.txt]];
  return cadre('Bilan : carbocation plan, carbanion pyramidal, radical presque plan ; la stabilité dépend des groupes donneurs et attracteurs ; l’intermédiaire le plus stable conduit au produit majoritaire.', 254,
    <g>
      {t(150, 24, 'Les trois intermédiaires', { size: 14.5, gras: true })}
      {L.map(([n, s, c], i) => <g key={i}><rect x="18" y={40 + i * 50} width="264" height="42" rx="10" fill="#fff" stroke={c} strokeWidth="2"/>{t(150, 58 + i * 50, n, { gras: true, fill: c })}{t(150, 75 + i * 50, s, { size: 11.5 })}</g>)}
      {t(150, 204, 'plus il est stable,', { size: 12.5, gras: true, fill: OR })}
      {t(150, 221, 'plus il se forme vite :', { size: 12.5, gras: true, fill: OR })}
      {t(150, 238, 'produit majoritaire', { size: 12.5, gras: true, fill: VERT })}
    </g>);
}
