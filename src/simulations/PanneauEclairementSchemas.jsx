// Schémas de la simulation 229 (éclairement et distance à la source, TSTL PCM) : scène, graphique E(d) et cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
import * as M from './panneauEclairementModele.js';

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
const Source = ({ x, y, r = 13 }) => <g>
  {[0, 45, 90, 135, 180, 225, 270, 315].map(a => <line key={a} x1={x + (r + 4) * Math.cos(a * Math.PI / 180)} y1={y + (r + 4) * Math.sin(a * Math.PI / 180)} x2={x + (r + 11) * Math.cos(a * Math.PI / 180)} y2={y + (r + 11) * Math.sin(a * Math.PI / 180)} stroke={COL.jaune} strokeWidth="2.5" strokeLinecap="round"/>)}
  <circle cx={x} cy={y} r={r} fill="#fef08a" stroke={COL.orange} strokeWidth="2.5"/></g>;

// ═════════ Scène principale : source ponctuelle, sphère de rayon d, panneau ═════════
export function SceneEclairement({ d, avecPanneau = true }) {
  const cx = 62, cy = 108, r = 24 + 190 * (d - M.D_MIN) / (M.D_MAX - M.D_MIN), xp = cx + r, demi = 28;
  return (
    <svg viewBox="0 0 400 214" style={base} role="img" aria-label="Schéma : une source lumineuse émet de la lumière dans toutes les directions. Un panneau est placé à la distance d de la source, sur une sphère centrée sur la source. La distance d est indiquée par une flèche.">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"/>
      {avecPanneau && <>
        <line x1={cx + 14} y1={cy - 2} x2={xp - 7} y2={cy - demi} stroke={COL.jaune} strokeWidth="2" opacity="0.8"/>
        <line x1={cx + 14} y1={cy} x2={xp - 7} y2={cy} stroke={COL.jaune} strokeWidth="2" opacity="0.8"/>
        <line x1={cx + 14} y1={cy + 2} x2={xp - 7} y2={cy + demi} stroke={COL.jaune} strokeWidth="2" opacity="0.8"/>
        <rect x={xp - 6} y={cy - demi} width="12" height={2 * demi} rx="2" fill="#1e3a8a" stroke={COL.encre} strokeWidth="2"/>
        <rect x={xp - 3} y={cy - demi + 3} width="6" height={2 * demi - 6} fill="#3b82f6"/>
        <text x={Math.min(xp, 366)} y={cy - demi - 10} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.bleu} {...halo}>panneau</text></>}
      <Source x={cx} y={cy}/>
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.orange} {...halo}>source</text>
      <line x1={cx} y1="186" x2={xp} y2="186" stroke={COL.fil} strokeWidth="2"/>
      <line x1={cx} y1="179" x2={cx} y2="193" stroke={COL.fil} strokeWidth="2"/><line x1={xp} y1="179" x2={xp} y2="193" stroke={COL.fil} strokeWidth="2"/>
      <text x={(cx + xp) / 2} y="177" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre} {...halo}>d = {fr(d, 2)} m</text>
      <text x="200" y="210" textAnchor="middle" fontSize="14" fill={COL.gris}>la distance d est le rayon de la sphère</text>
    </svg>);
}

// ═════════ Graphique E(d) ═════════
export function GrapheE({ phi, d, pts = [] }) {
  const X0 = 58, X1 = 384, Y0 = 20, Y1 = 176, dmin = M.D_MIN, dmax = M.D_MAX, Emax = M.eclairement(phi, dmin) * 1.06;
  const px = v => X0 + (v - dmin) / (dmax - dmin) * (X1 - X0), py = v => Y1 - Math.min(v, Emax) / Emax * (Y1 - Y0);
  const courbe = []; for (let k = 0; k <= 90; k++) { const x = dmin + (dmax - dmin) * k / 90; courbe.push(`${px(x).toFixed(1)},${py(M.eclairement(phi, x)).toFixed(1)}`); }
  const pas = Emax > 1500 ? 500 : Emax > 600 ? 200 : Emax > 300 ? 100 : 50, graduY = []; for (let v = pas; v < Emax; v += pas) graduY.push(v);
  const cur = { x: px(d), y: py(M.eclairement(phi, d)) };
  return (
    <svg viewBox="0 0 400 232" style={base} role="img" aria-label="Graphique de l’éclairement E en fonction de la distance d : la courbe décroît quand d augmente. Le point noir indique la distance réglée.">
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke={COL.fil} strokeWidth="2.5"/><line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke={COL.fil} strokeWidth="2.5"/>
      {graduY.map(v => <g key={v}><line x1={X0 - 5} y1={py(v)} x2={X0} y2={py(v)} stroke={COL.fil} strokeWidth="2"/><text x={X0 - 8} y={py(v) + 5} textAnchor="end" fontSize="14" fill={COL.gris}>{v}</text></g>)}
      {[0.5, 1, 1.5].map(v => <g key={v}><line x1={px(v)} y1={Y1} x2={px(v)} y2={Y1 + 5} stroke={COL.fil} strokeWidth="2"/><text x={px(v)} y={Y1 + 22} textAnchor="middle" fontSize="15" fill={COL.gris}>{fr(v, 1)}</text></g>)}
      <text x={X0 + 4} y="14" fontSize="15" fontWeight="700" fill={COL.encre}>E (W/m²)</text>
      <text x={X1} y="222" textAnchor="end" fontSize="15" fontWeight="700" fill={COL.encre}>distance d (m)</text>
      <polyline points={courbe.join(' ')} fill="none" stroke={COL.bleu} strokeWidth="3" strokeLinejoin="round"/>
      {pts.map((z, i) => <circle key={i} cx={px(z)} cy={py(M.eclairement(phi, z))} r="5" fill="white" stroke={COL.bleu} strokeWidth="2.5"/>)}
      <line x1={cur.x} y1={Y1} x2={cur.x} y2={cur.y} stroke={COL.gris} strokeWidth="1.5" strokeDasharray="4 4"/><line x1={X0} y1={cur.y} x2={cur.x} y2={cur.y} stroke={COL.gris} strokeWidth="1.5" strokeDasharray="4 4"/>
      <circle cx={cur.x} cy={cur.y} r="6.5" fill={COL.encre} stroke="white" strokeWidth="2"/>
    </svg>);
}

// ═════════ Carte A : la lumière se répartit sur une sphère, S = 4π d² (exemple d = 1,0 m) ═════════
export function SvgSphere() {
  return (
    <Fond h={236} label="Schéma : une source émet de la lumière dans toutes les directions. À la distance d, elle est répartie sur une sphère de rayon d, dont la surface vaut 4 pi d au carré.">
      <circle cx="105" cy="104" r="78" fill="#fffbeb" stroke={COL.bleu} strokeWidth="3" strokeDasharray="7 5"/>
      {[0, 60, 120, 180, 240, 300].map(a => <Fleche key={a} x1={105 + 16 * Math.cos(a * Math.PI / 180)} y1={104 + 16 * Math.sin(a * Math.PI / 180)} x2={105 + 70 * Math.cos(a * Math.PI / 180)} y2={104 + 70 * Math.sin(a * Math.PI / 180)} c={COL.jaune} w={2.5}/>)}
      <Source x={105} y={104} r={9}/>
      <Fleche x1={105} y1={104} x2={183} y2={104} c={COL.encre} w={2.5}/>
      <text x="150" y="94" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre} {...halo}>d</text>
      <text x="302" y="78" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.bleu}>surface = 4π d²</text>
      <text x="302" y="104" textAnchor="middle" fontSize="16" fill={COL.gris}>d en m, surface en m²</text>
      <text x="200" y="206" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>d = 1,0 m : 4π × 1,0² ≈ 12,6 m²</text>
      <text x="200" y="228" textAnchor="middle" fontSize="15" fill={COL.gris}>la lumière s’étale sur toute la sphère</text>
    </Fond>);
}

// ═════════ Carte B : E = Φ ÷ (4πd²) (exemple Φ = 100 W, d = 2,0 m) ═════════
export function SvgEclair() {
  const Boite = ({ x, titre, val, c }) => <g><rect x={x} y="16" width="112" height="76" rx="10" fill="white" stroke={c} strokeWidth="3"/><text x={x + 56} y="44" textAnchor="middle" fontSize="16" fill={COL.gris}>{titre}</text><text x={x + 56} y="76" textAnchor="middle" fontSize="19" fontWeight="800" fill={c}>{val}</text></g>;
  return (
    <Fond h={232} label="Schéma : le flux Φ émis par la source, divisé par la surface de la sphère 4 pi d au carré, donne l’éclairement E.">
      <Boite x={8} titre="flux Φ" val="100 W" c={COL.orange}/>
      <Boite x={144} titre="surface" val="50,3 m²" c={COL.bleu}/>
      <Boite x={280} titre="éclairement" val="2,0 W/m²" c={COL.vert}/>
      <text x="126" y="62" textAnchor="middle" fontSize="24" fontWeight="800" fill={COL.encre}>÷</text>
      <text x="262" y="62" textAnchor="middle" fontSize="24" fontWeight="800" fill={COL.encre}>=</text>
      <text x="200" y="136" textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.encre}>E = Φ ÷ (4π d²)</text>
      <text x="200" y="176" textAnchor="middle" fontSize="16" fill={COL.gris}>d = 2,0 m : 4π × 2,0² ≈ 50,3 m²</text>
      <text x="200" y="204" textAnchor="middle" fontSize="16" fill={COL.gris}>100 ÷ 50,3 ≈ 2,0 W/m²</text>
    </Fond>);
}

// ═════════ Carte C : loi en 1/d² (Φ = 100 W : 8,0 W/m² à 1 m, 2,0 à 2 m, 0,88 à 3 m) ═════════
export function SvgLoi() {
  return (
    <Fond h={236} label="Schéma : la lumière issue de la source traverse un carré à la distance d, puis un carré de surface quatre fois plus grande à la distance 2d. La même puissance est répartie sur une surface quatre fois plus grande.">
      <Source x={34} y={104} r={10}/>
      <polygon points="52,100 132,86 132,122 52,108" fill="#fef3c7" opacity="0.9"/>
      <polygon points="132,86 300,52 300,156 132,122" fill="#fef9e7" opacity="0.9"/>
      <line x1="48" y1="100" x2="300" y2="52" stroke={COL.jaune} strokeWidth="2"/><line x1="48" y1="108" x2="300" y2="156" stroke={COL.jaune} strokeWidth="2"/>
      <rect x="126" y="86" width="12" height="36" rx="2" fill="#bfdbfe" stroke={COL.bleu} strokeWidth="2.5"/>
      <rect x="294" y="52" width="12" height="104" rx="2" fill="#bfdbfe" stroke={COL.bleu} strokeWidth="2.5"/>
      <line x1="300" y1="104" x2="306" y2="104" stroke={COL.bleu} strokeWidth="2"/>
      <text x="132" y="146" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre} {...halo}>d</text>
      <text x="318" y="110" fontSize="18" fontWeight="800" fill={COL.encre}>2d</text>
      <text x="132" y="76" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.bleu}>1 carré</text>
      <text x="300" y="40" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.bleu}>4 carrés</text>
      <text x="200" y="192" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.rouge}>distance × 2 : surface × 4, donc E ÷ 4</text>
      <text x="200" y="218" textAnchor="middle" fontSize="16" fill={COL.gris}>100 W : 8,0 W/m² à 1 m ; 2,0 à 2 m ; 0,88 à 3 m</text>
    </Fond>);
}

// ═════════ Carte D : la chaîne flux → éclairement → puissance reçue → électricité ═════════
export function SvgChaine() {
  const L = [['source', 'Φ = 100 W', COL.orange], ['éclairement à 0,50 m', 'E ≈ 31,8 W/m²', COL.bleu], ['puissance reçue (25 cm²)', 'Plum ≈ 0,080 W', COL.bleu], ['électricité (η = 12 %)', 'Pél ≈ 9,5 mW', COL.vert]], ar = ['÷ 4π d²', '× S', '× η'];
  return (
    <Fond h={250} label="Schéma en quatre lignes : le flux de la source, divisé par 4 pi d au carré, donne l’éclairement ; multiplié par la surface du panneau, il donne la puissance reçue ; multipliée par le rendement, elle donne la puissance électrique.">
      {L.map(([a, b, c], i) => <g key={i}>
        <rect x="8" y={8 + i * 64} width="384" height="38" rx="9" fill="white" stroke={c} strokeWidth="2.5"/>
        <text x="20" y={33 + i * 64} fontSize="16" fill={COL.gris}>{a}</text>
        <text x="380" y={33 + i * 64} textAnchor="end" fontSize="17" fontWeight="800" fill={c}>{b}</text></g>)}
      {ar.map((t, i) => <g key={t}><Fleche x1={120} y1={49 + i * 64} x2={120} y2={69 + i * 64} c={COL.fil} w={2.5}/><text x="134" y={65 + i * 64} fontSize="16" fontWeight="800" fill={COL.encre}>{t}</text></g>)}
    </Fond>);
}

// ═════════ Carte E : trouver la distance pour un éclairement voulu (Φ = 100 W, E = 250 W/m²) ═════════
export function SvgDistance() {
  return (
    <Fond h={246} label="Schéma : pour obtenir un éclairement voulu, on calcule d’abord la surface de la sphère Φ divisé par E, puis le carré de la distance, puis la distance par une racine carrée.">
      <text x="200" y="26" textAnchor="middle" fontSize="16" fill={COL.gris}>on veut E = 250 W/m² avec Φ = 100 W</text>
      <Fleche x1={200} y1={36} x2={200} y2={56} c={COL.fil} w={2.5}/>
      <text x="200" y="82" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.bleu}>4π d² = Φ ÷ E = 0,40 m²</text>
      <Fleche x1={200} y1={92} x2={200} y2={112} c={COL.fil} w={2.5}/>
      <text x="200" y="138" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>d² = 0,40 ÷ 4π ≈ 0,032 m²</text>
      <Fleche x1={200} y1={148} x2={200} y2={168} c={COL.fil} w={2.5}/>
      <text x="200" y="196" textAnchor="middle" fontSize="21" fontWeight="800" fill={COL.vert}>d = √0,032 ≈ 0,18 m</text>
      <text x="200" y="232" textAnchor="middle" fontSize="16" fill={COL.gris}>d = √[ Φ ÷ (4π E) ], résultat en mètres</text>
    </Fond>);
}

// ═════════ Carte F : limites du modèle (source ponctuelle, d grande devant les dimensions) ═════════
export function SvgLimite() {
  return (
    <Fond h={246} label="Schéma en deux cas : à grande distance du panneau, tous les rayons arrivent presque perpendiculairement et le modèle est valable ; très près, les rayons arrivent de biais sur un panneau étendu et le modèle ne convient plus.">
      <Source x={28} y={44} r={9}/>
      <line x1="44" y1="42" x2="244" y2="34" stroke={COL.jaune} strokeWidth="2"/><line x1="44" y1="46" x2="244" y2="54" stroke={COL.jaune} strokeWidth="2"/>
      <rect x="244" y="30" width="10" height="28" rx="2" fill="#bfdbfe" stroke={COL.bleu} strokeWidth="2.5"/>
      <text x="270" y="40" fontSize="16" fontWeight="800" fill={COL.vert}>d grande</text><text x="270" y="60" fontSize="16" fill={COL.gris}>modèle valable</text>
      <Source x={28} y={150} r={9}/>
      <line x1="42" y1="144" x2="92" y2="104" stroke={COL.jaune} strokeWidth="2"/><line x1="42" y1="156" x2="92" y2="196" stroke={COL.jaune} strokeWidth="2"/><line x1="46" y1="150" x2="92" y2="150" stroke={COL.jaune} strokeWidth="2"/>
      <rect x="92" y="98" width="10" height="104" rx="2" fill="#bfdbfe" stroke={COL.rouge} strokeWidth="2.5"/>
      <text x="124" y="140" fontSize="16" fontWeight="800" fill={COL.rouge}>d trop petite</text><text x="124" y="160" fontSize="16" fill={COL.gris}>rayons de biais</text>
      <text x="200" y="230" textAnchor="middle" fontSize="16" fill={COL.encre}>9 cm² (3 cm de côté) : correct à 50 cm, plus à 3 cm</text>
    </Fond>);
}
