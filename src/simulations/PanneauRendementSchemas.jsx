// Schémas de la simulation 228 (rendement d'un panneau photovoltaïque, TSTL PCM) : barre de bilan et cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
import * as M from './panneauPvModele.js';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fil: '#334155', jaune: '#f59e0b' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 232, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Fleche = ({ x1, y1, x2, y2, c = COL.fil, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11, d = 0.45;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - 6 * Math.cos(a)} y2={y2 - 6 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};
const fr = (x, d = 2) => Number(x).toFixed(d).replace('.', ',');

// ═════════ Barre de bilan (écran du parcours et de l'exploration) : puissance lumineuse reçue = électricité + pertes ═════════
export function BarreBilan({ plum, pel }) {
  const part = Math.max(0, Math.min(1, plum > 0 ? pel / plum : 0)), W = 340, x0 = 30;
  const wEl = Math.max(0, W * part);
  return (
    <svg viewBox="0 0 400 150" style={base} role="img" aria-label="Barre de bilan énergétique : la barre entière représente la puissance lumineuse reçue ; la partie verte est la puissance électrique fournie, la partie grise est la puissance perdue.">
      <text x={x0} y="26" fontSize="18" fontWeight="800" fill={COL.encre}>Puissance lumineuse reçue</text>
      <rect x={x0} y="40" width={W} height="40" rx="6" fill="#e2e8f0" stroke={COL.fil} strokeWidth="2.5"/>
      <rect x={x0} y="40" width={wEl} height="40" rx="6" fill="#86efac" stroke={COL.vert} strokeWidth={wEl > 0 ? 2.5 : 0}/>
      <text x={x0} y="106" fontSize="17" fontWeight="800" fill={COL.vert}>■ électricité fournie</text>
      <text x={x0 + W} y="106" textAnchor="end" fontSize="17" fontWeight="800" fill={COL.gris}>■ pertes (chaleur…)</text>
      <text x={x0} y="132" fontSize="16" fill={COL.gris}>La barre entière = 100 % de la lumière reçue.</text>
    </svg>);
}

// ═════════ Carte A : puissance lumineuse reçue Plum = E × S (mini-panneau de 9 cm² à 700 W/m²) ═════════
export function SvgPlum() {
  return (
    <Fond h={236} label="Schéma : des rayons lumineux d’éclairement E arrivent sur la surface S d’un panneau. La puissance lumineuse reçue est le produit de E par S, avec S en mètres carrés.">
      <circle cx="200" cy="26" r="13" fill="#fef08a" stroke={COL.orange} strokeWidth="2.5"/>
      {[[140, 36, 124, 84], [200, 40, 200, 84], [260, 36, 276, 84]].map(([a, b, c, d], i) => <Fleche key={i} x1={a} y1={b} x2={c} y2={d} c={COL.jaune} w={2.5}/>)}
      <text x="392" y="64" textAnchor="end" fontSize="17" fontWeight="800" fill={COL.orange}>E = 700 W/m²</text>
      <rect x="110" y="94" width="180" height="40" rx="3" fill="#1e3a8a" stroke={COL.encre} strokeWidth="2"/>
      {[0, 1, 2].map(k => <rect key={k} x={115 + k * 58} y="98" width="52" height="32" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>)}
      <text x="200" y="156" textAnchor="middle" fontSize="17" fontWeight="700" fill={COL.bleu}>surface S = 9 cm² = 0,0009 m²</text>
      <text x="200" y="190" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>P<tspan fontSize="14" dy="4">lum</tspan><tspan dy="-4"> = E × S</tspan></text>
      <text x="200" y="216" textAnchor="middle" fontSize="16" fill={COL.gris}>700 × 0,0009 = 0,63 W</text>
    </Fond>);
}

// ═════════ Carte B : bilan et rendement (mini-panneau à 1000 W/m², au point de puissance maximale) ═════════
export function SvgBilan() {
  return (
    <Fond h={262} label="Schéma du bilan : la puissance lumineuse reçue entre dans le panneau ; une partie ressort en puissance électrique, le reste en pertes. Le rendement est le rapport de la puissance électrique à la puissance lumineuse.">
      <text x="200" y="22" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.orange}>lumière reçue : 0,90 W</text>
      <Fleche x1={200} y1={30} x2={200} y2={72} c={COL.jaune} w={4}/>
      <rect x="120" y="76" width="160" height="62" rx="8" fill="#dbeafe" stroke={COL.fil} strokeWidth="3"/>
      <text x="200" y="114" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.bleu}>panneau</text>
      <Fleche x1={284} y1={107} x2={392} y2={107} c={COL.vert} w={4}/>
      <text x="338" y="90" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.vert}>électricité</text>
      <text x="338" y="134" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.vert}>0,14 W</text>
      <Fleche x1={200} y1={142} x2={200} y2={176} c={COL.gris} w={4}/>
      <text x="200" y="198" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.gris}>pertes : 0,76 W</text>
      <text x="200" y="228" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>η = P<tspan fontSize="14" dy="4">él</tspan><tspan dy="-4"> ÷ P</tspan><tspan fontSize="14" dy="4">lum</tspan></text>
      <text x="200" y="252" textAnchor="middle" fontSize="16" fill={COL.gris}>0,14 ÷ 0,90 ≈ 0,16 soit 16 %</text>
    </Fond>);
}

// ═════════ Carte C : le rendement dépend du point de fonctionnement (mini-panneau, 1000 W/m²) ═════════
export function SvgPointFonct() {
  const p = M.PANNEAUX.mini, E = 1000, X0 = 56, X1 = 380, Y0 = 26, Y1 = 170, Umax = 2, Pmax = 0.16;
  const px = v => X0 + (v / Umax) * (X1 - X0), py = v => Y1 - (v / Pmax) * (Y1 - Y0);
  const pts = []; for (let k = 0; k <= 80; k++) { const U = (M.tensionVide(p, E) * k) / 80; pts.push(`${px(U).toFixed(1)},${py(M.puissance(p, E, U)).toFixed(1)}`); }
  const pm = M.pointPmax(p, E), q = M.point(p, E, 100);
  return (
    <Fond h={262} label="Courbe de la puissance électrique selon la tension pour un mini-panneau. Deux points sont marqués : le point de puissance maximale, où le rendement est le plus grand, et un point près de la tension à vide, où le rendement est très faible.">
      <line x1={X0} y1={Y0 - 6} x2={X0} y2={Y1} stroke={COL.encre} strokeWidth="2"/><line x1={X0} y1={Y1} x2={X1 + 6} y2={Y1} stroke={COL.encre} strokeWidth="2"/>
      <text x={X0} y="16" fontSize="16" fontWeight="800" fill={COL.encre}>P (W)</text>
      <text x={X1 + 8} y={Y1 + 22} textAnchor="end" fontSize="16" fontWeight="800" fill={COL.encre}>U (V)</text>
      <polyline points={pts.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
      <circle cx={px(pm.U)} cy={py(pm.P)} r="7" fill={COL.vert} stroke="white" strokeWidth="2"/>
      <text x={px(pm.U) - 12} y={py(pm.P) - 12} textAnchor="end" fontSize="16" fontWeight="800" fill={COL.vert} {...halo}>η ≈ 16 %</text>
      <circle cx={px(q.U)} cy={py(q.P)} r="7" fill={COL.rouge} stroke="white" strokeWidth="2"/>
      <text x={px(q.U) - 10} y={py(q.P) - 14} textAnchor="end" fontSize="16" fontWeight="800" fill={COL.rouge} {...halo}>η ≈ 4 %</text>
      <text x="200" y="214" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>même lumière reçue (0,90 W),</text>
      <text x="200" y="238" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>rendement très différent</text>
    </Fond>);
}

// ═════════ Carte D : facteurs limitants (schéma qualitatif, sans valeurs chiffrées) ═════════
export function SvgFacteurs() {
  const boite = (y, t1, t2, c) => (
    <g><rect x="14" y={y} width="232" height="38" rx="6" fill="#f8fafc" stroke={c} strokeWidth="2"/>
      <text x="24" y={y + 16} fontSize="16" fontWeight="800" fill={c}>{t1}</text><text x="24" y={y + 33} fontSize="16" fill={COL.gris}>{t2}</text></g>);
  return (
    <Fond h={300} label="Schéma qualitatif : la lumière reçue par le panneau est en partie réfléchie, en partie non absorbée car ses photons manquent d’énergie, en partie convertie en chaleur ; il y a aussi des pertes dans la cellule et un point de fonctionnement qui peut être mal choisi. Le reste devient de l’électricité.">
      {boite(14, 'Lumière réfléchie', 'elle ne pénètre pas', COL.orange)}
      {boite(62, 'Photons peu énergétiques', 'ils ne sont pas absorbés', COL.orange)}
      {boite(110, 'Excès d’énergie des photons', 'il part en chaleur', COL.rouge)}
      {boite(158, 'Pertes dans la cellule', 'effet Joule, recombinaisons', COL.rouge)}
      {boite(206, 'Charge mal adaptée', 'point loin de Pmax', COL.rouge)}
      <Fleche x1={250} y1={120} x2={286} y2={120} c={COL.gris} w={3.5}/>
      <rect x="290" y="14" width="104" height="230" rx="8" fill="#dcfce7" stroke={COL.vert} strokeWidth="3"/>
      <text x="342" y="116" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>reste =</text>
      <text x="342" y="138" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>électricité</text>
      <text x="200" y="278" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>chaque flèche de perte fait baisser η</text>
    </Fond>);
}

// ═════════ Carte E : dimensionner (surface nécessaire), exemple 2,0 W, η = 15 %, E = 1000 W/m² ═════════
export function SvgDimension() {
  const case_ = (x, titre, val, c) => (
    <g><rect x={x} y="52" width="104" height="70" rx="8" fill="#f8fafc" stroke={c} strokeWidth="2.5"/>
      <text x={x + 52} y="78" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.gris}>{titre}</text>
      <text x={x + 52} y="106" textAnchor="middle" fontSize="19" fontWeight="800" fill={c}>{val}</text></g>);
  return (
    <Fond h={246} label="Schéma en trois cases : la puissance électrique voulue, divisée par le rendement, donne la puissance lumineuse nécessaire ; divisée par l’éclairement, elle donne la surface.">
      {case_(10, 'P él voulue', '2,0 W', COL.vert)}
      {case_(148, 'P lum', '13,3 W', COL.orange)}
      {case_(286, 'surface S', '133 cm²', COL.bleu)}
      <Fleche x1={116} y1={87} x2={146} y2={87} c={COL.fil} w={3}/><Fleche x1={254} y1={87} x2={284} y2={87} c={COL.fil} w={3}/>
      <text x="131" y="44" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>÷ η</text>
      <text x="269" y="44" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>÷ E</text>
      <text x="200" y="160" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>η = 0,15 (15 %) ; E = 1000 W/m²</text>
      <text x="200" y="190" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>S = P<tspan fontSize="14" dy="4">él</tspan><tspan dy="-4"> ÷ (η × E)</tspan></text>
      <text x="200" y="218" textAnchor="middle" fontSize="16" fill={COL.gris}>0,0133 m² = 133 cm² (1 m² = 10 000 cm²)</text>
    </Fond>);
}
