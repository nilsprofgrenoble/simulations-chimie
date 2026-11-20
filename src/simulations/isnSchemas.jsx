// ====================================================
//  Schémas de la simulation 211 (intensité sonore, niveau d'intensité et atténuation ; niveau TG).
//  Scènes et graphe : viewBox de 400 de large, textes de 17 à 19 (≥ 12 px rendus sur téléphone). Cartes « À retenir » : viewBox de 320 de large, textes ≥ 16.
//  Toutes les coordonnées sont des NOMBRES. Public daltonien : jamais la couleur seule (hachures, traits pleins ou pointillés, étiquettes écrites).
//  Exposants et indices : caractères Unicode (10⁻¹², I₀), jamais de tspan. Pas de « / » ni de « ^ » dans les textes affichés.
//  Modèle : champ libre, source ponctuelle isotrope ; les cercles sont des repères de distance, pas des fronts d'onde à l'échelle de la longueur d'onde.
// ====================================================
import { niveauSource, niveau } from './isnModele';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#b45309', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1', ciel: '#7dd3fc', fond: '#f1f5f9' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const Tx = ({ x, y, children, c = COL.txt, s = 17, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 10, tirets = false }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w} strokeDasharray={tirets ? '6 4' : undefined}/>
      <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/>
    </g>);
};
// haut-parleur (cône vers la droite), centré en (x, y)
const HautParleur = ({ x, y, k = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <rect x={-17} y={-11} width={13} height={22} rx={2} fill={COL.txt}/>
    <polygon points="-4,-9 14,-23 14,23 -4,9" fill="#e2e8f0" stroke={COL.txt} strokeWidth={2.4} strokeLinejoin="round"/>
  </g>);
const Arcs = ({ x, y, rayons, c = COL.bleu, sw = 2.6 }) => (
  <g>{rayons.map(r => <path key={r} d={`M ${x + r * Math.cos(-0.7)} ${y + r * Math.sin(-0.7)} A ${r} ${r} 0 0 1 ${x + r * Math.cos(0.7)} ${y + r * Math.sin(0.7)}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round"/>)}</g>);
const Hachures = ({ id, c = COL.txt }) => (
  <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width={8} height={8} fill="#e2e8f0"/><line x1={0} y1={0} x2={0} y2={8} stroke={c} strokeWidth={3}/></pattern>);
// sonomètre : repère de mesure + boîtier avec son affichage ; (x, y) = point de mesure ; haut = boîtier au-dessus
const Sonometre = ({ x, y, etiq, haut = true, w = 128, c = COL.txt, xmin = 6, xmax = 394, nom = '' }) => {
  const bx = Math.max(xmin, Math.min(xmax - w, x - w / 2)), by = haut ? y - 60 : y + 30;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={haut ? by + 32 : by} stroke={COL.gris} strokeWidth={2} strokeDasharray="3 3"/>
      <rect x={bx} y={by} width={w} height={32} rx={7} fill="#fff" stroke={c} strokeWidth={2.4}/>
      <text x={bx + w / 2} y={by + 23} fontSize={19} fontWeight={700} fill={c} textAnchor="middle">{etiq}</text>
      <circle cx={x} cy={y} r={7.5} fill="#fff" stroke={c} strokeWidth={3}/><circle cx={x} cy={y} r={2.6} fill={c}/>
      {nom && <text x={x} y={haut ? y + 28 : y - 14} fontSize={18} fontWeight={600} fill={COL.txt} textAnchor="middle" {...HALO}>{nom}</text>}
    </g>);
};
// échelle « jolie » 1-2-5
const pasJoli = (max, n) => { const b = max / n, e = Math.pow(10, Math.floor(Math.log10(b))), m = b / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e; };
const fmt = x => String(Math.round(x * 100) / 100).replace('.', ',');

// ====================================================
//  SCÈNE 1 : haut-parleur et surface S perpendiculaire à la propagation (intensité I = P / S). Lignes d'affichage facultatives.
//  nSources : 1 ou 2 (deux enceintes identiques) ; surface : 'S' (surface dessinée) ou 'micro' (point de mesure)
// ====================================================
export function SceneIntensite({ nSources = 1, pLabel = '', sLabel = '', lignes = [], surface = 'S', aria }) {
  const h = 214 + lignes.length * 30;
  const ys = nSources === 2 ? [78, 142] : [110];
  return (
    <svg viewBox={`0 0 400 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      {ys.map((y, k) => <g key={k}>
        <HautParleur x={54} y={y}/><Arcs x={70} y={y} rayons={[22, 44, 66]}/>
        {nSources === 2 && <Tx x={54} y={y + 42} ancre="middle" s={18} w={600}>enceinte {k + 1}</Tx>}
      </g>)}
      {nSources === 1 && pLabel && <Tx x={10} y={200} s={18}>{pLabel}</Tx>}
      {nSources === 1 && <Tx x={10} y={52} s={18} w={600}>source sonore</Tx>}
      {surface === 'S'
        ? <g>
          <rect x={262} y={46} width={14} height={128} fill="#bae6fd" stroke={COL.bleu} strokeWidth={2.6}/>
          {[62, 110, 158].map(y => <Fleche key={y} x1={170} y1={y} x2={258} y2={y} c={COL.bleu} w={2.4} tete={9}/>)}
          <Tx x={269} y={196} ancre="middle" s={18} c={COL.bleu}>{sLabel}</Tx>
        </g>
        : <g><Sonometre x={262} y={110} etiq={sLabel} haut={false} w={150} xmin={6} xmax={394}/>
          <Tx x={262} y={74} ancre="middle" s={18} w={600}>point d’écoute</Tx></g>}
      {lignes.map((l, k) => <Tx key={k} x={200} y={214 + k * 30} ancre="middle" s={18} c={l.c || COL.txt}>{l.t}</Tx>)}
    </svg>);
}

// ====================================================
//  SCÈNE 2 : vue de dessus d'une source ponctuelle ; cercles de repère tous les « pas » mètres, règle graduée, paroi, capteurs.
//  capteurs : [{ d, etiq, haut }] (d en m) ; mur : { d, nom } ; cote : affiche la cote de la distance d du premier capteur
// ====================================================
export function SceneSon({ portee = 4, pLabel = '', capteurs = [], mur = null, cote = true, sansEchelle = false, aria }) {
  const X0 = 46, Y0 = 128, pxm = 300 / portee, X = d => X0 + d * pxm;
  const pas = pasJoli(portee, 5), anneaux = []; for (let r = pas; r <= portee + 1e-9; r += pas) anneaux.push(r);
  const dMur = mur ? mur.d : Infinity;
  const c0 = capteurs[0];
  const nomX = mur ? Math.max(70, Math.min(330, X(mur.d))) : 0;
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      {pLabel && <Tx x={8} y={21} s={18}>{pLabel}</Tx>}
      <g transform="translate(0 26)">
      <defs><Hachures id="isn-mur"/><clipPath id="isn-cadre"><rect x={6} y={30} width={388} height={196}/></clipPath></defs>
      <g clipPath="url(#isn-cadre)">
        {!sansEchelle && anneaux.map(r => <circle key={r} cx={X0} cy={Y0} r={r * pxm} fill="none" stroke={COL.ciel} strokeWidth={2.4} strokeDasharray={r > dMur ? '2 6' : undefined} strokeLinecap="round"/>)}
      </g>
      {mur && <g>
        <rect x={X(mur.d) - 9} y={32} width={18} height={192} fill="url(#isn-mur)" stroke={COL.txt} strokeWidth={2.4}/>
        <Tx x={nomX} y={22} ancre="middle" s={18}>{mur.nom}</Tx>
      </g>}
      <HautParleur x={X0 - 6} y={Y0} k={0.8}/>
      {cote && c0 && !c0.inconnue && <g>
        <line x1={X0} y1={200} x2={X(c0.d)} y2={200} stroke={COL.orange} strokeWidth={2.4}/>
        <line x1={X0} y1={193} x2={X0} y2={207} stroke={COL.orange} strokeWidth={2.4}/><line x1={X(c0.d)} y1={193} x2={X(c0.d)} y2={207} stroke={COL.orange} strokeWidth={2.4}/>
        {(() => { const cx = (X0 + X(c0.d)) / 2, txt = `d = ${fmt(c0.d)} m`, demi = 4.6 * txt.length, wx = mur ? X(mur.d) : null;
          if (wx === null || wx + 12 < cx - demi || wx - 12 > cx + demi) return <Tx x={cx} y={224} ancre="middle" c={COL.orange} s={18}>{txt}</Tx>;
          return wx - 16 - 2 * demi >= 6 ? <Tx x={wx - 16} y={224} ancre="end" c={COL.orange} s={18}>{txt}</Tx> : <Tx x={wx + 16} y={224} c={COL.orange} s={18}>{txt}</Tx>; })()}
      </g>}
      {cote && c0 && c0.inconnue && <Tx x={(X0 + X(c0.d)) / 2} y={224} ancre="middle" c={COL.orange} s={18}>d = ? (à trouver)</Tx>}
      {capteurs.map((c, k) => <Sonometre key={k} x={X(c.d)} y={Y0} etiq={c.etiq} haut={c.haut !== false} w={c.w || 132} c={c.c || COL.txt} nom={c.nom}/>)}
      {/* règle graduée */}
      {!sansEchelle && <g>
      <line x1={X0} y1={240} x2={X(portee)} y2={240} stroke={COL.txt} strokeWidth={2}/>
      {[0, ...anneaux].map(r => <g key={r}><line x1={X(r)} y1={234} x2={X(r)} y2={246} stroke={COL.txt} strokeWidth={2}/><Tx x={X(r)} y={265} ancre="middle" s={18} w={600} halo={false}>{r === 0 ? '0' : r === anneaux[anneaux.length - 1] ? `${fmt(r)} m` : fmt(r)}</Tx></g>)}
      </g>}
      {sansEchelle && <Tx x={200} y={262} ancre="middle" s={18} c={COL.gris}>schéma sans échelle de distance</Tx>}
      </g>
    </svg>);
}

// ====================================================
//  GRAPHE L(d) : niveau en fonction de la distance (échelle linéaire ou semi-log en d), paroi (marche de A dB), deux points A et B
// ====================================================
export function GrapheNiveau({ P, mat, dMur = 2, dA, dB = null, axe = 'lin', aria }) {
  const L = 62, Rg = 384, top = 26, bas = 188, W = Rg - L, H = bas - top, DMIN = 1, DMAX = 20;
  const niv = d => niveauSource(P, d, mat && mat.A > 0 && d > dMur ? mat.A : 0);
  const Ds = Array.from({ length: 160 }, (_, j) => DMIN + (DMAX - DMIN) * j / 159);
  const lmax = Math.ceil(niveau(P / (4 * Math.PI * DMIN * DMIN)) / 10) * 10 + 0;
  const lminReel = Math.min(...Ds.map(niv)), lmin = Math.min(lmax - 40, Math.floor(lminReel / 10) * 10);
  const X = d => L + (axe === 'log' ? Math.log10(d / DMIN) / Math.log10(DMAX / DMIN) : (d - DMIN) / (DMAX - DMIN)) * W;
  const Y = v => bas - (v - lmin) / (lmax - lmin) * H;
  const gradX = axe === 'log' ? [1, 2, 5, 10, 20] : [1, 5, 10, 15, 20];
  const pasY = (lmax - lmin) > 80 ? 20 : 10, gradY = []; for (let v = lmin; v <= lmax + 1e-9; v += pasY) gradY.push(v);
  // le tracé est coupé en deux morceaux à la paroi
  const avant = Ds.filter(d => !(mat && mat.A > 0) || d <= dMur), apres = mat && mat.A > 0 ? Ds.filter(d => d > dMur) : [];
  const pts = a => a.map(d => `${X(d).toFixed(1)},${Y(niv(d)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 400 250" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: '#fff', borderRadius: 8 }}>
      {gradY.map(v => <g key={v}><line x1={L} y1={Y(v)} x2={Rg} y2={Y(v)} stroke="#e2e8f0" strokeWidth={1.5}/><line x1={L - 5} y1={Y(v)} x2={L} y2={Y(v)} stroke={COL.txt} strokeWidth={1.8}/>
        <text x={L - 8} y={Y(v) + 6} fontSize={17} fill={COL.txt} textAnchor="end">{v}</text></g>)}
      {gradX.map(g => <g key={g}><line x1={X(g)} y1={bas} x2={X(g)} y2={bas + 5} stroke={COL.txt} strokeWidth={1.8}/><text x={X(g)} y={bas + 24} fontSize={17} fill={COL.txt} textAnchor="middle">{g}</text></g>)}
      <line x1={L} y1={top} x2={L} y2={bas} stroke={COL.txt} strokeWidth={2}/><line x1={L} y1={bas} x2={Rg} y2={bas} stroke={COL.txt} strokeWidth={2}/>
      <Tx x={L + 6} y={top - 6} s={18} c={COL.bleu} halo={false}>L (dB)</Tx>
      <Tx x={Rg} y={bas + 46} s={18} ancre="end" halo={false}>d (m){axe === 'log' ? ', échelle logarithmique' : ''}</Tx>
      {mat && mat.A > 0 && <g>
        <line x1={X(dMur)} y1={top} x2={X(dMur)} y2={bas} stroke={COL.gris} strokeWidth={2} strokeDasharray="4 4"/>
        <Tx x={Math.min(X(dMur) + 6, Rg - 70)} y={top + 18} s={18} c={COL.gris}>paroi</Tx>
      </g>}
      <polyline points={pts(avant)} fill="none" stroke={COL.bleu} strokeWidth={3.4} strokeLinejoin="round"/>
      {apres.length > 0 && <polyline points={pts(apres)} fill="none" stroke={COL.bleu} strokeWidth={3.4} strokeDasharray="9 5" strokeLinejoin="round"/>}
      {dA != null && <g><line x1={X(dA)} y1={bas} x2={X(dA)} y2={Y(niv(dA))} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="3 4"/><circle cx={X(dA)} cy={Y(niv(dA))} r={7} fill="#fff" stroke={COL.orange} strokeWidth={3.2}/>
        <Tx x={X(dA) + (dA > 14 ? -12 : 10)} y={Y(niv(dA)) - 10} ancre={dA > 14 ? 'end' : 'start'} s={18} c={COL.orange}>A</Tx></g>}
      {dB != null && <g><line x1={X(dB)} y1={bas} x2={X(dB)} y2={Y(niv(dB))} stroke={COL.vert} strokeWidth={1.8} strokeDasharray="3 4"/><rect x={X(dB) - 6.5} y={Y(niv(dB)) - 6.5} width={13} height={13} fill="#fff" stroke={COL.vert} strokeWidth={3.2}/>
        <Tx x={X(dB) + (dB > 14 ? -12 : 10)} y={Y(niv(dB)) + 24} ancre={dB > 14 ? 'end' : 'start'} s={18} c={COL.vert}>B</Tx></g>}
    </svg>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320 de large, textes ≥ 16)
// ====================================================
const stl = { width: '100%', maxWidth: 340, height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const Cadre = ({ aria, h, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={stl}>{children}</svg>;
const Pastille = ({ x, y, w, h = 34, children, c = COL.bleu, fond = '#fff', s = 17, tirets = false }) => (
  <g><rect x={x} y={y} width={w} height={h} rx={8} fill={fond} stroke={c} strokeWidth={2.4} strokeDasharray={tirets ? '5 4' : undefined}/>
    <text x={x + w / 2} y={y + h / 2 + 6} fontSize={s} fontWeight={700} fill={COL.txt} textAnchor="middle">{children}</text></g>);

// 1) intensité sonore : puissance par unité de surface
export function SvgCarteIntensite() {
  return (
    <Cadre aria="Une source sonore de puissance P envoie ses ondes vers une surface S perpendiculaire ; l'intensité sonore I est la puissance reçue par mètre carré, en watts par mètre carré." h={176}>
      <HautParleur x={36} y={70}/><Arcs x={52} y={70} rayons={[20, 40]}/>
      {[40, 70, 100].map(y => <Fleche key={y} x1={110} y1={y} x2={218} y2={y} c={COL.bleu} w={2.4} tete={9}/>)}
      <rect x={224} y={22} width={14} height={96} fill="#bae6fd" stroke={COL.bleu} strokeWidth={2.6}/>
      <Tx x={36} y={116} ancre="middle" c={COL.bleu}>P (W)</Tx>
      <Tx x={248} y={74} c={COL.bleu}>S</Tx><Tx x={248} y={96} s={16} c={COL.bleu}>(m²)</Tx>
      <Pastille x={14} y={130} w={292} c={COL.orange}>I : puissance reçue par m²</Pastille>
    </Cadre>);
}
// 2) niveau d'intensité sonore : échelle repères
export function SvgCarteNiveau() {
  const rows = [{ y: 66, L: '120', nom: 'seuil de douleur', I: '1' }, { y: 120, L: '30', nom: 'chuchotement', I: '10⁻⁹' }, { y: 174, L: '0', nom: 'seuil d’audibilité', I: '10⁻¹²' }];
  return (
    <Cadre aria="Échelle de repères : 120 décibels correspond à 1 watt par mètre carré (seuil de douleur), 30 décibels à 10 puissance moins 9 (chuchotement), 0 décibel à 10 puissance moins 12 (seuil d'audibilité)." h={214}>
      <Tx x={56} y={26} ancre="end" s={16} halo={false}>L (dB)</Tx><Tx x={312} y={26} ancre="end" s={16} halo={false}>I (W·m⁻²)</Tx>
      {rows.map(r => <g key={r.y}>
        <line x1={62} y1={r.y} x2={312} y2={r.y} stroke={COL.clair} strokeWidth={1.8} strokeDasharray="3 4"/>
        <Tx x={56} y={r.y + 6} ancre="end" s={19} c={COL.bleu}>{r.L}</Tx><Tx x={312} y={r.y + 6} ancre="end" s={19} c={COL.orange}>{r.I}</Tx>
        <Tx x={187} y={r.y - 9} ancre="middle" s={16} w={600}>{r.nom}</Tx></g>)}
      <Tx x={187} y={206} ancre="middle" s={16} c={COL.gris}>douze puissances de 10</Tx>
    </Cadre>);
}
// 3) règles : ×2 → +3 dB, ×10 → +10 dB
export function SvgCarteRegles() {
  return (
    <Cadre aria="Deux règles : une intensité multipliée par 2 ajoute 3 décibels au niveau ; une intensité multipliée par 10 ajoute 10 décibels." h={122}>
      <Pastille x={10} y={14} w={118} c={COL.bleu}>I × 2</Pastille><Fleche x1={134} y1={31} x2={186} y2={31} w={3} tete={10}/><Pastille x={192} y={14} w={118} c={COL.orange} fond="#fff7ed">L + 3 dB</Pastille>
      <Pastille x={10} y={66} w={118} c={COL.bleu}>I × 10</Pastille><Fleche x1={134} y1={83} x2={186} y2={83} w={3} tete={10}/><Pastille x={192} y={66} w={118} c={COL.orange} fond="#fff7ed">L + 10 dB</Pastille>
    </Cadre>);
}
// 4) atténuation géométrique : surfaces ×4 et niveaux 69 / 63 / 57 / 51 dB
export function SvgCarteGeometrique() {
  const niveaux = [69, 63, 57, 51], X = k => 34 + k * 66;
  return (
    <Cadre aria="Atténuation géométrique : quand la distance double, la même puissance se répartit sur une surface quatre fois plus grande, l'intensité est divisée par 4 et le niveau baisse de 6 décibels. Exemple de niveaux à 1, 2, 4 et 8 mètres : 69, 63, 57 et 51 décibels." h={262}>
      <circle cx={46} cy={52} r={6} fill={COL.txt}/><circle cx={46} cy={52} r={30} fill="none" stroke={COL.ciel} strokeWidth={2.4}/>
      <rect x={84} y={42} width={12} height={20} fill="#bae6fd" stroke={COL.bleu} strokeWidth={2.4}/><rect x={110} y={22} width={24} height={60} fill="#bae6fd" stroke={COL.bleu} strokeWidth={2.4} strokeDasharray="5 3"/>
      <Tx x={90} y={36} ancre="middle" s={16}>S</Tx><Tx x={122} y={104} ancre="middle" s={16}>4 S</Tx>
      <Tx x={150} y={44} s={16} c={COL.orange}>d → 2d :</Tx><Tx x={150} y={66} s={16} c={COL.orange}>I divisée par 4</Tx><Tx x={150} y={88} s={17} c={COL.orange}>L − 6 dB</Tx>
      {niveaux.map((v, k) => { const h = (v - 40) * 3, y = 230 - h; return (
        <g key={v}><rect x={X(k) - 22} y={y} width={44} height={h} fill={k % 2 ? '#bae6fd' : '#e0f2fe'} stroke={COL.bleu} strokeWidth={2.2}/>
          <Tx x={X(k)} y={y - 6} ancre="middle" s={17}>{v}</Tx><Tx x={X(k)} y={252} ancre="middle" s={16} w={600} halo={false}>{[1, 2, 4, 8][k]} m</Tx></g>); })}
    </Cadre>);
}
// 5) absorption et atténuation totale
export function SvgCarteAbsorption() {
  return (
    <Cadre aria="Atténuation par absorption : on mesure le niveau juste avant et juste après la paroi, par exemple 63 décibels puis 28 décibels ; l'atténuation A est leur écart, 35 décibels. Atténuation totale : 12 décibels géométriques plus 35 décibels d'absorption, soit 47 décibels." h={270}>
      <defs><Hachures id="isn-mur-carte"/></defs>
      <HautParleur x={24} y={80} k={0.7}/>
      <rect x={146} y={34} width={22} height={70} fill="url(#isn-mur-carte)" stroke={COL.txt} strokeWidth={2.4}/>
      <Tx x={157} y={26} ancre="middle" s={16}>paroi</Tx>
      <Sonometre x={118} y={80} etiq="63 dB" haut={false} w={70} xmin={4} xmax={316}/><Sonometre x={196} y={80} etiq="28 dB" haut={false} w={70} xmin={4} xmax={316} c={COL.orange}/>
      <Tx x={160} y={172} ancre="middle" s={19} c={COL.orange}>A = 63 − 28 = 35 dB</Tx>
      <line x1={10} y1={186} x2={310} y2={186} stroke={COL.clair} strokeWidth={1.8}/>
      <Tx x={160} y={210} ancre="middle" s={17}>atténuation totale (en dB)</Tx>
      <Pastille x={14} y={224} w={86} c={COL.bleu}>12 dB</Pastille><Tx x={109} y={248} ancre="middle" s={20}>+</Tx><Pastille x={118} y={224} w={86} c={COL.orange}>35 dB</Pastille><Tx x={213} y={248} ancre="middle" s={20}>=</Tx><Pastille x={222} y={224} w={86} c={COL.vert}>47 dB</Pastille>
    </Cadre>);
}
// 6) repères de niveau et durée d'exposition
export function SvgCarteRepereNiveaux() {
  const X = L => 16 + (L / 130) * 288;
  return (
    <Cadre aria="Échelle de 0 à 130 décibels : le seuil d'audibilité à 0 décibel, la conversation vers 60, jusqu'à 85 décibels une longue exposition est admise, au-delà la durée d'exposition doit être limitée, le seuil de douleur vers 120 décibels." h={196}>
      <rect x={X(0)} y={70} width={X(85) - X(0)} height={30} fill="#dcfce7" stroke={COL.vert} strokeWidth={2.2}/>
      <rect x={X(85)} y={70} width={X(120) - X(85)} height={30} fill="#fed7aa" stroke={COL.orange} strokeWidth={2.2}/>
      <rect x={X(120)} y={70} width={X(130) - X(120)} height={30} fill={COL.rouge} stroke={COL.rouge} strokeWidth={2.2}/>
      {[[0, 'seuil'], [60, '60'], [85, '85'], [120, '120']].map(([L, t]) => <g key={L}><line x1={X(L)} y1={100} x2={X(L)} y2={112} stroke={COL.txt} strokeWidth={2.2}/><Tx x={X(L)} y={132} ancre={L === 0 ? 'start' : 'middle'} s={17} halo={false}>{L === 0 ? '0' : t}</Tx></g>)}
      <Tx x={160} y={156} ancre="middle" s={16} c={COL.gris} halo={false}>niveau L (dB)</Tx>
      <Tx x={X(42.5)} y={90} ancre="middle" s={16} c={COL.vert} halo={false}>exposition longue</Tx>
      <Tx x={X(100)} y={60} ancre="middle" s={16} c={COL.orange}>durée limitée</Tx><line x1={X(100)} y1={65} x2={X(100)} y2={69} stroke={COL.orange} strokeWidth={2}/>
      <Tx x={X(125)} y={28} ancre="end" s={16} c={COL.rouge}>douleur</Tx><line x1={X(125)} y1={34} x2={X(125)} y2={68} stroke={COL.rouge} strokeWidth={2}/>
      <Tx x={160} y={184} ancre="middle" s={16}>à partir de 85 dB : durée limitée</Tx>
    </Cadre>);
}
