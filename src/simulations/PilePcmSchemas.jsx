// Schémas de la simulation 305 (piles, TSTL) : pile à deux demi-piles et pont salin (voltmètre, dipôle ou lampe), cartes « À retenir ».
import { C } from './vecteursVASchemas';
import { METAUX } from './pilePcmModele';
const stl = { userSelect: "none", WebkitUserSelect: "none",  width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const ROUGE = '#dc2626', BLEU = '#1d4ed8';
const fmtU = u => `${u > 0 ? '+' : u < 0 ? '−' : ''}${Math.abs(u).toFixed(2).replace('.', ',')} V`;
// point à l'abscisse curviligne s ∈ [0 ; 1] d'une ligne brisée
const pos = (pts, s) => { const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), T = L.reduce((a, b) => a + b, 0); let d = s * T; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [pts[i][0] + k * (pts[i + 1][0] - pts[i][0]), pts[i][1] + k * (pts[i + 1][1] - pts[i][1])]; } d -= L[i]; } return pts[pts.length - 1]; };
const Fleche = ({ x, y, sens = 1, c, w = 3 }) => <polygon points={`${x + sens * 7},${y} ${x - sens * 5},${y - 5} ${x - sens * 5},${y + 5}`} fill={c} stroke="#fff" strokeWidth={w * 0.3}/>;

// paire = [id gauche, id droite] ; borneV : 'g' | 'd' | null ; lu : tension affichée (nombre signé) ; charge : 'volt' | 'dipole' | 'lampe'
// poles : signes + et − ; noms : anode / cathode ; flux : flèches d'électrons, de courant et d'ions ; phase ∈ [0 ; 1[ : points mobiles (animation) ; usure ∈ [0 ; 1] : lames
export function ScenePile({ paire = ['zn', 'cu'], borneV = null, lu = null, charge = 'volt', poles: avecPoles = false, noms = false, flux = false, phase = null, usure = 0, plusSide = null, iTexte = null, allumee = true, maxWidth = 420, aria, svgRef = null, children = null }) {
  const [a, b] = paire, A = METAUX[a], B = METAUX[b];
  const xm = [95, 305];   // plusSide : côté du pôle +, nécessaire pour poles/noms/flux
  const idx = side => (side === 'g' ? 0 : 1), plus = plusSide ? idx(plusSide) : null, moins = plusSide ? 1 - plus : null;
  const dir = plus === 1 ? 1 : -1;   // sens des électrons dans le fil : du pôle − vers le pôle +
  const lampe = charge === 'lampe', box = charge !== 'volt';
  const pM = plus !== null ? [[xm[moins], 92], [xm[moins], 52], [moins === 0 ? 158 : 242, 52]] : null, pP = plus !== null ? [[plus === 0 ? 158 : 242, 52], [xm[plus], 52], [xm[plus], 92]] : null;
  const fil = (x1, x2) => <polyline points={`${x1},92 ${x1},52 ${x2},52`} fill="none" stroke="#475569" strokeWidth="3"/>;
  const largeur = i => (i === moins ? Math.max(5, 14 * (1 - 0.65 * usure)) : i === plus ? 14 + 12 * usure : 14);
  const cote = [a, b];
  return (
    <svg ref={svgRef} viewBox="0 0 400 275" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || `Pile formée de deux demi-piles reliées par un pont salin : ${A.lame} dans ${A.sol} à gauche, ${B.lame} dans ${B.sol} à droite${borneV ? `, avec un voltmètre branché (borne V du côté ${borneV === 'g' ? 'gauche' : 'droit'})${lu !== null ? `, qui affiche ${fmtU(lu)}` : ''}` : ''}.`}>
      <defs><clipPath id="pp-g"><rect x="42" y="176" width="106" height="67" rx="8"/></clipPath><clipPath id="pp-d"><rect x="252" y="176" width="106" height="67" rx="8"/></clipPath></defs>
      {[0, 1].map(i => <g key={i}>
        <rect x={i ? 252 : 42} y="176" width="106" height="67" fill={METAUX[cote[i]].couleur} clipPath={`url(#pp-${i ? 'd' : 'g'})`}/>
        <rect x={i ? 250 : 40} y="150" width="110" height="95" rx="10" fill="none" stroke="#94a3b8" strokeWidth="3"/>
        <rect x={xm[i] - largeur(i) / 2} y="92" width={largeur(i)} height="140" rx="2" fill={METAUX[cote[i]].metal} stroke="#334155" strokeWidth="1.4"/>
        <text x={i ? 336 : 62} y="204" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a">{METAUX[cote[i]].ion.replace(/⁺/g, '⁺').replace(/²/g, '²')}</text>
        <text x={i ? 336 : 62} y="226" textAnchor="middle" fontSize="15" fontWeight="800" fill="#334155">{METAUX[cote[i]].m}</text></g>)}
      {/* pont salin */}
      <path d="M125 190 V140 Q125 130 135 130 H265 Q275 130 275 140 V190" fill="none" stroke="#b45309" strokeWidth="15" strokeLinecap="round"/>
      <path d="M125 190 V140 Q125 130 135 130 H265 Q275 130 275 140 V190" fill="none" stroke="#fde68a" strokeWidth="10" strokeLinecap="round"/>
      <text x="200" y="158" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e">pont salin</text>
      {/* circuit */}
      {fil(xm[0], 158)}{fil(xm[1], 242)}
      {box ? <g>
        <rect x="158" y="32" width="84" height="40" rx="8" fill="#fff" stroke="#475569" strokeWidth="3"/>
        {lampe ? <g><circle cx="200" cy="52" r="13" fill={allumee ? '#fde047' : '#e5e7eb'} stroke="#a16207" strokeWidth="2.4"/><path d="M193 45 L207 59 M207 45 L193 59" stroke="#a16207" strokeWidth="2.4"/></g>
          : <text x="200" y="58" textAnchor="middle" fontSize="16" fontWeight="800" fill="#334155">dipôle</text>}</g>
        : <g>
          <rect x="158" y="32" width="84" height="40" rx="8" fill="#f8fafc" stroke="#475569" strokeWidth="3"/>
          <text x="200" y="59" textAnchor="middle" fontSize="19" fontWeight="800" fill={lu === null ? '#94a3b8' : '#0f172a'} style={{ fontVariantNumeric: 'tabular-nums' }}>{lu === null ? '— V' : fmtU(lu)}</text>
          {borneV && <g fontSize="11" fontWeight="800"><circle cx="158" cy="52" r="5" fill={borneV === 'g' ? ROUGE : '#111827'}/><circle cx="242" cy="52" r="5" fill={borneV === 'd' ? ROUGE : '#111827'}/>
            <text x="150" y="28" textAnchor="middle" fill={borneV === 'g' ? ROUGE : '#111827'}>{borneV === 'g' ? 'V' : 'COM'}</text><text x="250" y="28" textAnchor="middle" fill={borneV === 'd' ? ROUGE : '#111827'}>{borneV === 'd' ? 'V' : 'COM'}</text></g>}
        </g>}
      {lampe && iTexte && <text x="200" y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.violet}>{iTexte}</text>}
      {/* pôles */}
      {avecPoles && plus !== null && [0, 1].map(i => <g key={i}><circle cx={xm[i] + (i ? 22 : -22)} cy="74" r="11" fill={i === plus ? ROUGE : BLEU} stroke="#fff" strokeWidth="1.5"/><text x={xm[i] + (i ? 22 : -22)} y="80" textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff">{i === plus ? '+' : '−'}</text></g>)}
      {/* anode / cathode */}
      {noms && plus !== null && [0, 1].map(i => <text key={i} x={xm[i]} y="266" textAnchor="middle" fontSize="15" fontWeight="800" fill={i === plus ? C.vert : C.orange}>{i === plus ? 'cathode · réduction' : 'anode · oxydation'}</text>)}
      {/* flèches : électrons (bleu, du − vers le +) et courant (violet, du + vers le −) */}
      {flux && plus !== null && <g>
        <text x={dir > 0 ? 126 : 274} y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill={BLEU}>e⁻</text>
        <Fleche x={dir > 0 ? 126 : 274} y={46} sens={dir} c={BLEU}/>
        <text x={dir > 0 ? 274 : 126} y="82" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.violet}>courant</text>
        <Fleche x={dir > 0 ? 274 : 126} y={63} sens={-dir} c={C.violet}/>
        <g><line x1="168" y1="95" x2={plus === 1 ? 228 : 172} y2="95" stroke={C.orange} strokeWidth="3"/><Fleche x={plus === 1 ? 232 : 168} y={95} sens={dir} c={C.orange}/><text x={plus === 1 ? 160 : 240} y="99" textAnchor={plus === 1 ? 'end' : 'start'} fontSize="12" fontWeight="800" fill={C.orange}>ions +</text></g>
        <g><line x1="172" y1="109" x2="228" y2="109" stroke={C.gris} strokeWidth="3"/><Fleche x={plus === 1 ? 168 : 232} y={109} sens={-dir} c={C.gris}/><text x={plus === 1 ? 240 : 160} y="113" textAnchor={plus === 1 ? 'start' : 'end'} fontSize="12" fontWeight="800" fill={C.gris}>ions −</text></g></g>}
      {/* animation : électrons dans le fil, ions dans le pont salin */}
      {phase !== null && plus !== null && <g>
        {[0, 1, 2, 3].map(k => { const s = (phase + k / 4) % 1; const [x, y] = pos(pM, s), [x2, y2] = pos(pP, s); return <g key={k}><circle cx={x} cy={y} r="4.6" fill={BLEU} stroke="#fff" strokeWidth="1.4"/><circle cx={x2} cy={y2} r="4.6" fill={BLEU} stroke="#fff" strokeWidth="1.4"/></g>; })}
        {[0, 1, 2].map(k => { const s = (phase + k / 3) % 1, xc = dir > 0 ? 130 + s * 140 : 270 - s * 140, xa = dir > 0 ? 270 - s * 140 : 130 + s * 140; return <g key={k}><circle cx={xc} cy="127" r="3.8" fill={C.orange} stroke="#fff" strokeWidth="1.2"/><circle cx={xa} cy="133" r="3.8" fill={C.gris} stroke="#fff" strokeWidth="1.2"/></g>; })}
      </g>}
      {children}
    </svg>);
}

// ---------- cartes « À retenir » (viewBox 300 de large, textes ≥ 12,5) ----------
const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} role="img" style={{ ...stl, maxWidth: 320, border: `1px solid ${C.clair}` }} aria-label={aria}>{children}</svg>;
const T = ({ x, y, children, c = C.encre, s = 14, w = 700, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Sup = ({ children }) => <tspan dy="-6" fontSize="10">{children}</tspan>;
export function SvgConstitutionCarte() {
  // pile cuivre / zinc : zinc à gauche (pôle −, anode), cuivre à droite (pôle +, cathode)
  return <ScenePile paire={['zn', 'cu']} charge="dipole" poles noms flux plusSide="d" maxWidth={320} aria="Pile : le pôle négatif est l'anode, siège d'une oxydation ; le pôle positif est la cathode, siège d'une réduction ; les électrons vont du pôle négatif vers le pôle positif dans le fil, les cations du pont salin vont vers la cathode."/>;
}
const Ligne = ({ y, n, t }) => <g><circle cx="26" cy={y - 5} r="11" fill="#dbeafe" stroke={C.bleu} strokeWidth="1.6"/><text x="26" y={y} fontSize="13.5" fontWeight="800" fill={C.bleu} textAnchor="middle">{n}</text><T x="46" y={y} s={14}>{t}</T></g>;
export function SvgEquationCarte() {
  return (
    <Cadre h={228} aria="Méthode pour l'équation d'une pile : identifier les couples, repérer le pôle plus et le pôle moins, écrire la réduction à la cathode et l'oxydation à l'anode, égaliser les électrons puis additionner.">
      <Ligne y={30} n={1} t="couples Ox/Red de chaque demi-pile"/><Ligne y={58} n={2} t="pôle + : cathode, réduction"/><Ligne y={86} n={3} t="pôle − : anode, oxydation"/><Ligne y={114} n={4} t="même nombre d’électrons"/><Ligne y={142} n={5} t="additionner et simplifier"/>
      <rect x="14" y="160" width="272" height="56" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.6"/>
      <T x="150" y="182" s={14} c={C.vert} a="middle">Cu<Sup>2+</Sup> + Zn → Cu + Zn<Sup>2+</Sup></T>
      <T x="150" y="204" s={13} c={C.gris} a="middle" w={700}>exemple : pile cuivre / zinc</T>
    </Cadre>);
}
const Bloc = ({ x, y, w, t, c = '#dbeafe', s = C.bleu }) => <g><rect x={x} y={y} width={w} height="40" rx="10" fill={c} stroke={s} strokeWidth="1.8"/><T x={x + w / 2} y={y + 25} a="middle" s={14} c={C.encre}>{t}</T></g>;
const Ar = ({ y }) => <g><line x1="150" y1={y} x2="150" y2={y + 16} stroke={C.gris} strokeWidth="3"/><polygon points={`150,${y + 22} 144,${y + 12} 156,${y + 12}`} fill={C.gris}/></g>;
export function SvgQCarte() {
  return (
    <Cadre h={246} aria="De la composition de la pile à la durée de fonctionnement : réactif limitant, quantité d'électrons n(e⁻), quantité d'électricité Q égale n(e⁻) fois F, durée Δt égale Q divisé par i.">
      <Bloc x={30} y={10} w={240} t="réactif limitant : n(A) ÷ α = n(e⁻) ÷ β"/>
      <Ar y={52}/><Bloc x={30} y={76} w={240} t="Q = n(e⁻) × F" c="#fef3c7" s={C.orange}/>
      <Ar y={118}/><Bloc x={30} y={142} w={240} t="Δt = Q ÷ i" c="#dcfce7" s={C.vert}/>
      <T x="150" y="212" s={13} a="middle" c={C.gris}>F = 96 500 C/mol ; i en ampères (A)</T>
      <T x="150" y="233" s={13} a="middle" c={C.gris}>Δt en secondes : ÷ 3 600 pour des heures</T>
    </Cadre>);
}
