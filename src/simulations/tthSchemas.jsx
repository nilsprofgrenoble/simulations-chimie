// ====================================================
//  Schémas de la simulation 217 (transferts thermiques : modes, flux et résistance ; niveau TG).
//  Scènes : viewBox de 420 de large, textes ≥ 17. Graphe : viewBox 400 × 300, textes ≥ 16. Cartes : viewBox de 320, textes ≥ 15,5.
//  Coordonnées numériques. Public daltonien : jamais la couleur seule (valeurs écrites, sens des flèches, étiquettes).
// ====================================================
const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', gris: '#475569', txt: '#0f172a', clair: '#cbd5e1', paroi: '#334155' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const SVG_STYLE = { width: '100%', maxWidth: 480, display: 'block', margin: '0 auto' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 9 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};
const couleurT = T => (T >= 18 ? '#fed7aa' : T >= 8 ? '#fef3c7' : T >= 0 ? '#e0f2fe' : '#bae6fd');

// Trois situations (sans nommer le mode : c'est la question) : poignée de casserole, air d'une pièce, Soleil et Terre.
export function SceneSituation({ cas }) {
  if (cas === 'conduction') return (
    <svg viewBox="0 0 420 240" role="img" aria-label="Une casserole sur une flamme : la poignée métallique, longue, devient chaude même loin de la flamme." style={SVG_STYLE}>
      <path d="M 60 100 L 70 150 L 190 150 L 200 100 Z" fill="#cbd5e1" stroke={COL.paroi} strokeWidth={4}/>
      <rect x={200} y={108} width={150} height={16} fill="#fca5a5" stroke={COL.paroi} strokeWidth={3}/>
      <path d="M 100 190 Q 110 160 125 172 Q 135 150 150 172 Q 160 160 155 190 Z" fill="#f97316" stroke={COL.rouge} strokeWidth={2.5}/>
      <Fleche x1={206} y1={116} x2={340} y2={116} c={COL.rouge} w={3} tete={11}/>
      <Tx x={210} y={96} c={COL.rouge}>énergie transférée</Tx>
      <Tx x={210} y={226} ancre="middle" s={19}>poignée métallique d’une casserole</Tx>
    </svg>);
  if (cas === 'convection') return (
    <svg viewBox="0 0 420 240" role="img" aria-label="Un radiateur contre un mur chauffe l’air voisin, qui monte ; l’air plus froid descend de l’autre côté de la pièce : l’air tourne en boucle." style={SVG_STYLE}>
      <rect x={20} y={40} width={16} height={150} fill="#64748b" stroke={COL.paroi} strokeWidth={3}/>
      <rect x={40} y={110} width={26} height={80} fill={COL.rouge} stroke={COL.paroi} strokeWidth={3}/>
      <path d="M 90 180 C 90 90 140 60 210 56" fill="none" stroke={COL.rouge} strokeWidth={4}/>
      <polygon points="212,56 198,48 198,64" fill={COL.rouge}/>
      <path d="M 220 56 C 300 60 380 100 380 170" fill="none" stroke={COL.bleu} strokeWidth={4} strokeDasharray="10 6"/>
      <path d="M 380 175 C 360 215 160 215 100 190" fill="none" stroke={COL.bleu} strokeWidth={4} strokeDasharray="10 6"/>
      <polygon points="96,189 112,186 106,200" fill={COL.bleu}/>
      <Tx x={210} y={236} ancre="middle" s={19}>air d’une pièce près d’un radiateur</Tx>
    </svg>);
  return (
    <svg viewBox="0 0 420 240" role="img" aria-label="Le Soleil, à gauche, et la Terre, à droite, séparés par du vide : de l’énergie arrive pourtant sur la Terre." style={SVG_STYLE}>
      <circle cx={60} cy={110} r={44} fill="#fbbf24" stroke={COL.orange} strokeWidth={4}/>
      <circle cx={360} cy={110} r={26} fill="#7dd3fc" stroke={COL.bleu} strokeWidth={4}/>
      {[90, 110, 130].map(y => <path key={y} d={`M 120 ${y} q 15 -12 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0`} fill="none" stroke={COL.orange} strokeWidth={3}/>)}
      <Tx x={210} y={176} ancre="middle" s={19}>aucune matière entre les deux</Tx>
      <Tx x={210} y={226} ancre="middle" s={19}>le Soleil et la Terre</Tx>
    </svg>);
}

// Paroi séparant un intérieur chaud d'un extérieur froid. montre : { T, phi } ; phi en W (flèche épaisse proportionnelle, plafonnée).
export function SceneParoi({ Ti, Te, phi, nom = 'paroi', montre = {}, aria }) {
  const dir = (Ti ?? 20) >= (Te ?? 5) ? 1 : -1, ep = 3 + Math.min(9, (phi || 100) / 120);
  const vitre = /Fen/.test(nom);
  return (
    <svg viewBox="0 0 420 280" role="img" aria-label={aria || `Une paroi (${nom}) sépare l’intérieur, à gauche, de l’extérieur, à droite.${montre.T ? ` Intérieur ${nbf(Ti, 0)} °C, extérieur ${nbf(Te, 0)} °C.` : ''}${montre.phi ? ` Flux thermique : ${nbf(phi, 0)} W.` : ''}`} style={SVG_STYLE}>
      <rect x={10} y={40} width={140} height={190} fill={montre.T ? couleurT(Ti) : '#f1f5f9'} stroke={COL.paroi} strokeWidth={3}/>
      <rect x={270} y={40} width={140} height={190} fill={montre.T ? couleurT(Te) : '#f1f5f9'} stroke={COL.paroi} strokeWidth={3}/>
      <rect x={150} y={40} width={120} height={190} fill={vitre ? '#e0f2fe' : '#d6d3d1'} stroke={COL.paroi} strokeWidth={4}/>
      {vitre ? <g><line x1={190} y1={40} x2={190} y2={230} stroke={COL.paroi} strokeWidth={3}/><line x1={230} y1={40} x2={230} y2={230} stroke={COL.paroi} strokeWidth={3} strokeDasharray="10 8"/></g> : <g>{[0, 1, 2, 3].map(k => <line key={k} x1={150} y1={80 + 40 * k} x2={270} y2={80 + 40 * k} stroke="#a8a29e" strokeWidth={2.5}/>)}</g>}
      <Tx x={80} y={28} ancre="middle">intérieur</Tx><Tx x={340} y={28} ancre="middle">extérieur</Tx><Tx x={210} y={258} ancre="middle" s={18}>{nom.length > 28 ? nom.split(' (')[0] : nom}</Tx>
      {montre.T && <g><Tx x={80} y={140} ancre="middle" s={24}>{nbf(Ti, 0)} °C</Tx><Tx x={340} y={140} ancre="middle" s={24}>{nbf(Te, 0)} °C</Tx></g>}
      <Fleche x1={dir > 0 ? 40 : 380} y1={190} x2={dir > 0 ? 380 : 40} y2={190} c={COL.rouge} w={ep} tete={16}/>
      {montre.phi && <Tx x={210} y={166} ancre="middle" s={20} c={COL.rouge}>φ = {nbf(phi, 0)} W</Tx>}
    </svg>);
}

// Graphe : flux thermique (W) à travers chacun des quatre éléments pour l'écart de température courant.
export function GrapheFlux({ barres, courant }) {
  const M = Math.max(...barres.map(b => b.phi)), k = 190 / M, y0 = 240;
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={`Flux thermique à travers quatre éléments pour le même écart de température : ${barres.map(b => `${b.court} ${nbf(b.phi, 0)} W`).join(', ')}.`} style={SVG_STYLE}>
      <line x1={50} y1={20} x2={50} y2={y0} stroke={COL.paroi} strokeWidth={3}/><line x1={46} y1={y0} x2={392} y2={y0} stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={6} y={16} s={16} halo={false}>W</Tx>
      {barres.map((b, i) => {
        const x = 64 + i * 84, h = b.phi * k, cur = b.id === courant;
        return (<g key={b.id}>
          <rect x={x} y={y0 - h} width={60} height={h} fill={cur ? COL.rouge : '#94a3b8'} stroke={COL.paroi} strokeWidth={cur ? 3.5 : 2}/>
          <Tx x={x + 30} y={y0 - h - 8} ancre="middle" s={16.5}>{nbf(b.phi, 0)}</Tx>
          <Tx x={x + 30} y={y0 + 20} ancre="middle" s={15.5} c={cur ? COL.rouge : COL.gris}>{b.etiq[0]}</Tx><Tx x={x + 30} y={y0 + 38} ancre="middle" s={15.5} c={cur ? COL.rouge : COL.gris}>{b.etiq[1]}</Tx>
        </g>);
      })}
    </svg>);
}

// ---------- cartes « À retenir » (viewBox 320) ----------
const SvgCarte = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>{children}</svg>;

export function SvgCarteModes() {
  const ligne = (y, titre, l1, l2, c) => (<g><rect x={10} y={y - 24} width={8} height={62} fill={c}/><Tx x={28} y={y} s={17} c={c}>{titre}</Tx><Tx x={28} y={y + 20} s={15.5} w={600} c={COL.gris}>{l1}</Tx><Tx x={28} y={y + 38} s={15.5} w={600} c={COL.gris}>{l2}</Tx></g>);
  return (
    <SvgCarte h={262} aria="Les trois modes de transfert thermique : la conduction, de proche en proche dans la matière sans déplacement de matière ; la convection, avec déplacement d’un fluide ; le rayonnement, par ondes électromagnétiques, même dans le vide.">
      {ligne(34, 'Conduction', 'de proche en proche, dans la', 'matière immobile (surtout les solides)', COL.rouge)}
      {ligne(118, 'Convection', 'un fluide (liquide, gaz) se déplace', 'et transporte l’énergie', COL.bleu)}
      {ligne(202, 'Rayonnement', 'ondes électromagnétiques,', 'même dans le vide', COL.orange)}
    </SvgCarte>);
}
export function SvgCarteFlux() {
  return (
    <SvgCarte h={230} aria="Le flux thermique est l’énergie transférée par seconde, en watts : phi égale Q divisé par la durée. Le transfert thermique va spontanément du chaud vers le froid.">
      <rect x={14} y={14} width={90} height={50} fill="#fed7aa" stroke={COL.paroi} strokeWidth={3}/><Tx x={59} y={46} ancre="middle" s={17} halo={false}>chaud</Tx>
      <rect x={216} y={14} width={90} height={50} fill="#bae6fd" stroke={COL.paroi} strokeWidth={3}/><Tx x={261} y={46} ancre="middle" s={17} halo={false}>froid</Tx>
      <Fleche x1={112} y1={39} x2={208} y2={39} c={COL.rouge} w={5} tete={14}/><Tx x={160} y={30} ancre="middle" s={16.5} c={COL.rouge}>φ</Tx>
      <rect x={10} y={70} width={300} height={80} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={104} y={122} ancre="end" s={24} c={COL.bleu} halo={false}>φ =</Tx>
      <Tx x={150} y={103} ancre="middle" s={24} c={COL.bleu} halo={false}>Q</Tx><line x1={120} y1={112} x2={180} y2={112} stroke={COL.bleu} strokeWidth={2.5}/><Tx x={150} y={138} ancre="middle" s={24} c={COL.bleu} halo={false}>Δt</Tx>
      <Tx x={160} y={166} ancre="middle" s={16}>φ en watts (W) : énergie par seconde</Tx>
      <Tx x={160} y={190} ancre="middle" s={16} w={600}>Q en joules, Δt en secondes</Tx>
      <Tx x={160} y={214} ancre="middle" s={16} w={600} c={COL.gris}>du chaud vers le froid</Tx>
    </SvgCarte>);
}
export function SvgCarteR() {
  return (
    <SvgCarte h={274} aria="La résistance thermique Rth d’une paroi, en kelvins par watt, relie l’écart de température et le flux : phi égale delta T divisé par Rth. Plus Rth est grande, plus la paroi isole et plus le flux est faible.">
      <rect x={10} y={6} width={300} height={74} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={104} y={52} ancre="end" s={24} c={COL.bleu} halo={false}>φ =</Tx>
      <Tx x={155} y={34} ancre="middle" s={24} c={COL.bleu} halo={false}>ΔT</Tx><line x1={118} y1={42} x2={192} y2={42} stroke={COL.bleu} strokeWidth={2.5}/><Tx x={155} y={69} ancre="middle" s={24} c={COL.bleu} halo={false}>Rth</Tx>
      <Tx x={160} y={100} ancre="middle" s={16.5}>Rth en K·W⁻¹ (donnée)</Tx>
      <Tx x={160} y={124} ancre="middle" s={16} w={600} c={COL.gris}>ΔT = écart entre les deux faces</Tx>
      <line x1={12} y1={140} x2={308} y2={140} stroke={COL.clair} strokeWidth={2}/>
      <Tx x={22} y={168} s={16.5}>ΔT × 2  →  φ × 2</Tx>
      <Tx x={22} y={196} s={16.5}>Rth × 2  →  φ ÷ 2</Tx>
      <Tx x={22} y={224} s={16.5}>Rth grande : bon isolant</Tx>
      <Tx x={160} y={260} ancre="middle" s={15.5} c={COL.gris} w={600}>E = φ × Δt (en J, ou en kWh)</Tx>
    </SvgCarte>);
}
export function SvgCarteBilan() {
  const etapes = [['1', 'Écart ΔT entre les faces'], ['2', 'Flux φ = ΔT ÷ Rth'], ['3', 'Énergie E = φ × Δt'], ['4', 'Unités : W, s, J ou kWh']];
  return (
    <SvgCarte h={262} aria="Méthode en quatre étapes : calculer l’écart de température entre les faces, le flux phi égale delta T sur Rth, l’énergie E égale phi fois la durée, en vérifiant les unités.">
      <Tx x={160} y={22} ancre="middle" s={16.5}>Méthode pour une paroi</Tx>
      {etapes.map(([n, t], k) => (<g key={n}>
        <circle cx={30} cy={62 + 52 * k} r={16} fill={COL.bleu}/><Tx x={30} y={68 + 52 * k} ancre="middle" c="#fff" halo={false} s={17}>{n}</Tx>
        <Tx x={58} y={68 + 52 * k} s={16.5}>{t}</Tx></g>))}
    </SvgCarte>);
}
