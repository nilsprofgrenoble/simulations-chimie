/* eslint-disable react-refresh/only-export-components */
import { espece, grapheCouple, chargeAtome, nbLiaisons, L } from "./brnModele";

// ====================================================
//  Schémas de la simulation 188 (transferts de H⁺) : schémas de Lewis dessinés à partir des graphes du modèle (brnModele.js), scènes et cartes « À retenir ».
//  Convention de dessin : trait bleu = doublet liant ; tiret orange = doublet non liant ; cercle avec + ou − = charge ; cercle en tirets = hydrogène qui part ou arrive.
//  Le schéma de Lewis est une écriture : les angles et les distances ne sont pas ceux de la molécule. Aucune couleur n'est seule porteuse d'information.
// ====================================================
export const COL = { bleu: '#0369a1', orange: '#b45309', rouge: '#b91c1c', vert: '#15803d', gris: '#475569', encre: '#0f172a', clair: '#e2e8f0', fond: '#f8fafc' };
const DIR = a => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];
const RAYON = (el, s) => (el === 'H' ? Math.max(11, 14 * s) : Math.max(12, 17 * s));
const signe = q => (q === 0 ? '' : `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}`);

// Marqueur de charge : cercle blanc avec le signe, au coin haut droit de l'atome
function Charge({ x, y, R, q, op = 1, fs = 16 }) {
  if (!q) return null;
  const bx = x + R + 9, by = y - R - 8, w = Math.abs(q) > 1 ? 13 : 10.5;
  return (<g opacity={op}><circle cx={bx} cy={by} r={w} fill="#fff" stroke={COL.rouge} strokeWidth="1.8"/>
    <text x={bx} y={by + fs * 0.34} fontSize={fs - (Math.abs(q) > 1 ? 3 : 0)} fontWeight="800" textAnchor="middle" fill={COL.rouge}>{signe(q)}</text></g>);
}
// Doublet non liant : petit trait perpendiculaire à la direction de l'angle ang (degrés, 0 = est, 90 = sud)
function Doublet({ x, y, R, ang, op = 1, couleur = COL.orange, long = 8 }) {
  const [dx, dy] = DIR(ang), bx = x + dx * (R + 8), by = y + dy * (R + 8), nx = -dy, ny = dx;
  return <line x1={bx - nx * long} y1={by - ny * long} x2={bx + nx * long} y2={by + ny * long} stroke={couleur} strokeWidth="3.6" strokeLinecap="round" opacity={op}/>;
}

// ---------- dessin d'une structure de Lewis ----------
// g : graphe du modèle ; (cx, cy) : position de l'origine du graphe ; s : échelle des distances ; fsA : taille du texte des atomes.
// anim : { h (indice du H qui part), site, angle, u (0 = acide, 1 = base) } : le H s'éloigne (u) pendant que le doublet apparaît sur le site ; gb = graphe de la base (pour les charges).
// cacheH : n'affiche pas du tout l'atome H qui part (base seule). halo : indices d'atomes entourés d'un cercle en tirets.
export function DessinMol({ g, gb = null, cx = 0, cy = 0, s = 1, fsA = 17, anim = null, cacheH = false, halo = [], sansCharge = [], idp = 'm' }) {
  const u = anim ? anim.u : 0;
  const pos = g.atomes.map((a, i) => {
    let x = cx + a.x * s, y = cy + a.y * s;
    if (anim && i === anim.h) { const [dx, dy] = DIR(anim.angle), p = (L * s) * (1 + 1.05 * u); const sx = cx + g.atomes[anim.site].x * s, sy = cy + g.atomes[anim.site].y * s; x = sx + dx * p; y = sy + dy * p; }
    return [x, y];
  });
  const R = i => RAYON(g.atomes[i].el, s);
  const el = [];
  g.liens.forEach(([i, j, o], k) => {
    if (cacheH && anim && (i === anim.h || j === anim.h)) return;
    const [x0, y0] = pos[i], [x1, y1] = pos[j], d = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / d, uy = (y1 - y0) / d, nx = -uy, ny = ux;
    const op = anim && (i === anim.h || j === anim.h) ? Math.max(0, 1 - 1.6 * u) : 1;
    for (let t = 0; t < o; t++) { const off = (t - (o - 1) / 2) * 7; el.push(<line key={`${idp}l${k}-${t}`} x1={x0 + ux * R(i) + nx * off} y1={y0 + uy * R(i) + ny * off} x2={x1 - ux * R(j) + nx * off} y2={y1 - uy * R(j) + ny * off} stroke={COL.bleu} strokeWidth="3.6" strokeLinecap="round" opacity={op}/>); }
  });
  g.atomes.forEach((a, i) => {
    if (cacheH && anim && i === anim.h) return;
    const [x, y] = pos[i], r = R(i), libre = anim && i === anim.h && u > 0.5;
    el.push(<circle key={`${idp}a${i}`} cx={x} cy={y} r={libre ? r + 3 : r} fill="#fff" stroke={libre ? COL.rouge : COL.gris} strokeWidth={libre ? 2.4 : 1.6}/>);
    el.push(<text key={`${idp}t${i}`} x={x} y={y + fsA * 0.35} fontSize={libre ? fsA - 2 : fsA} fontWeight="800" textAnchor="middle" fill={libre ? COL.rouge : COL.encre}>{libre ? 'H⁺' : a.el}</text>);
    if (halo.includes(i)) el.push(<circle key={`${idp}h${i}`} cx={x} cy={y} r={r + 7} fill="none" stroke={COL.orange} strokeWidth="2.4" strokeDasharray="5 4"/>);
    a.lp.forEach((ang, k) => el.push(<Doublet key={`${idp}p${i}-${k}`} x={x} y={y} R={r} ang={ang}/>));
    if (anim && gb && i === anim.site) el.push(<Doublet key={`${idp}pn`} x={x} y={y} R={r} ang={anim.angle} op={Math.max(0, (u - 0.25) / 0.75)}/>);
    // charge : celle de l'acide s'efface, celle de la base apparaît (seul le site change)
    const qa = chargeAtome(g, i), j = anim && i > anim.h ? i - 1 : i, qb = anim && gb && i !== anim.h ? chargeAtome(gb, j) : qa;
    if (anim && gb && i === anim.site) { if (!sansCharge.includes(i)) { el.push(<Charge key={`${idp}ca${i}`} x={x} y={y} R={r} q={qa} op={Math.max(0, 1 - 1.6 * u)}/>); el.push(<Charge key={`${idp}cb${i}`} x={x} y={y} R={r} q={qb} op={Math.max(0, (u - 0.4) / 0.6)}/>); } }
    else if (!sansCharge.includes(i)) el.push(<Charge key={`${idp}c${i}`} x={x} y={y} R={r} q={qa}/>);
  });
  return <g>{el}</g>;
}

// emprise d'un graphe (pour centrer) : renvoie [xmin, xmax, ymin, ymax] en unités du graphe, en comptant l'éloignement d'un H qui part
export function emprise(g, hMax = null, site = null, angle = 0, ext = 2.05) {
  const pts = g.atomes.map(a => [a.x, a.y]);
  if (hMax != null && site != null) { const [dx, dy] = DIR(angle); pts[hMax] = [g.atomes[site].x + dx * L * ext, g.atomes[site].y + dy * L * ext]; }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
}
function Cadre({ children, viewBox = '0 0 400 250', aria, maxWidth = 480 }) {
  return (<svg viewBox={viewBox} width="100%" role="img" aria-label={aria} style={{ maxWidth, display: 'block', margin: '0 auto', background: '#fff', borderRadius: 10 }}>{children}</svg>);
}
const T = p => <text fontSize="16" fill={COL.encre} {...p}/>;

const decrire = (g, nom) => {
  const lp = g.atomes.reduce((t, a) => t + a.lp.length, 0);
  return `${nom} : schéma de Lewis à ${g.atomes.length} atomes, ${g.liens.reduce((t, l) => t + l[2], 0)} doublets liants et ${lp} doublets non liants.`;
};

// ---------- scène : une structure de Lewis seule (avec nom) ----------
export function SceneLewis({ id, halo = [], aria, s: s0 = 1.15, nom = true }) {
  const e = espece(id), g = e.graphe, [x0, x1, y0, y1] = emprise(g), s = Math.min(s0, 168 / Math.max(1, y1 - y0)), cx = 200 - ((x0 + x1) / 2) * s, cy = 104 - ((y0 + y1) / 2) * s;
  return (<Cadre viewBox="0 0 400 262" aria={aria || decrire(g, `${e.nom} ${e.formule}`)}>
    <DessinMol g={g} cx={cx} cy={cy} s={s} halo={halo}/>
    {nom && <T x="200" y="226" textAnchor="middle" fontWeight="700">{e.nom} {e.formule}</T>}
    <T x="200" y="251" textAnchor="middle" fill={COL.gris}>schéma de Lewis (angles non réels)</T>
  </Cadre>);
}

// ---------- scène : transfert de H⁺ animé pour un couple ----------
// u : 0 = acide, 1 = base + H⁺ libre. montreH : affiche le H⁺ (sinon, base seule).
export function SceneCouple({ couple, u = 0, aria, s: s0 = 1.1, montreH = true, indice = true, sansChargeSite = false }) {
  const gc = grapheCouple(couple);
  if (!gc) return null;
  const g = gc.acide, [x0, x1, y0, y1] = emprise(g, gc.h, gc.site, gc.angle), s = Math.min(s0, 168 / Math.max(1, y1 - y0)), cx = 200 - ((x0 + x1) / 2) * s, cy = 104 - ((y0 + y1) / 2) * s;
  const A = espece(couple.acide), B = espece(couple.base);
  const phase = u < 0.5 ? 0 : 1;
  return (<Cadre viewBox="0 0 400 262" aria={aria || `Transfert d’ion H⁺ pour le couple ${couple.texte} : ${phase ? `la base ${B.nom} ${B.formule} et un ion H⁺` : `l’acide ${A.nom} ${A.formule}`}.`}>
    <DessinMol g={g} gb={gc.base} cx={cx} cy={cy} s={s} anim={{ h: gc.h, site: gc.site, angle: gc.angle, u }} cacheH={!montreH} sansCharge={sansChargeSite ? [gc.site] : []}/>
    <T x="200" y="226" textAnchor="middle" fontWeight="700">{phase ? `base : ${B.nom} ${B.formule}${montreH ? ' + H⁺' : ''}` : `acide : ${A.nom} ${A.formule}`}</T>
    {indice && <T x="200" y="251" textAnchor="middle" fill={COL.gris}>schéma de Lewis (angles non réels)</T>}
  </Cadre>);
}

// ---------- scène : équation de transfert en formules ----------
const taille = t => (t.length >= 12 ? 19 : t.length >= 7 ? 22 : t.length >= 5 ? 30 : 34);   // police selon la longueur de la formule
const lignes2 = (t, n = 22) => { const m = t.split(' '), a = []; let c = ''; m.forEach(w => { if ((c + ' ' + w).trim().length > n && c) { a.push(c); c = w; } else c = (c + ' ' + w).trim(); }); a.push(c); return a; };
export function SceneFormules({ gauche, droite = null, etiqG, etiqD, fleche = 'cède H⁺', aria }) {
  const xg = droite ? 92 : 200, xd = 312;
  return (<Cadre viewBox="0 0 400 190" aria={aria || `${gauche} ${droite ? `donne ${droite}` : ''}`}>
    <text x={xg} y="82" fontSize={taille(gauche)} fontWeight="800" textAnchor="middle" fill={COL.encre}>{gauche}</text>
    {etiqG && lignes2(etiqG, droite ? 18 : 40).map((l, k) => <T key={k} x={xg} y={116 + 20 * k} textAnchor="middle" fill={COL.gris}>{l}</T>)}
    {droite && <>
      <line x1="172" y1="74" x2="208" y2="74" stroke={COL.bleu} strokeWidth="3.6"/><polygon points="208,66 224,74 208,82" fill={COL.bleu}/>
      <T x="198" y="56" textAnchor="middle" fontWeight="700" fill={COL.bleu}>{fleche}</T>
      <text x={xd} y="82" fontSize={taille(droite)} fontWeight="800" textAnchor="middle" fill={COL.encre}>{droite}</text>
      {etiqD && lignes2(etiqD, 18).map((l, k) => <T key={k} x={xd} y={116 + 20 * k} textAnchor="middle" fill={COL.gris}>{l}</T>)}</>}
    <T x="200" y="176" textAnchor="middle" fill={COL.gris}>on suit les atomes d’hydrogène et la charge</T>
  </Cadre>);
}

// ---------- scène : deux espèces qui vont réagir ----------
export function SceneMelange({ a, b, aria }) {
  const A = espece(a), B = espece(b);
  return (<Cadre viewBox="0 0 400 190" aria={aria || `On mélange ${A.nom} ${A.formule} et ${B.nom} ${B.formule}.`}>
    {[[105, A], [295, B]].map(([x, e], k) => <g key={k}><rect x={x - 82} y="38" width="164" height="84" rx="14" fill={COL.fond} stroke={COL.gris} strokeWidth="1.6"/>
      <text x={x} y="82" fontSize="28" fontWeight="800" textAnchor="middle" fill={COL.encre}>{e.formule}</text>
      <T x={x} y="108" textAnchor="middle" fill={COL.gris}>{e.nom.length > 20 ? e.nom.slice(0, 20) : e.nom}</T></g>)}
    <T x="200" y="86" textAnchor="middle" fontWeight="800">+</T>
    <T x="200" y="165" textAnchor="middle" fill={COL.gris}>quels sont les produits ?</T>
  </Cadre>);
}

// ---------- scène : liste de couples (étape sur l'espèce amphotère) ----------
export function SceneCouples({ ids, aria }) {
  return (<Cadre viewBox="0 0 400 230" aria={aria || 'Quatre couples acide-base : acide à gauche, base à droite.'}>
    <T x="100" y="30" textAnchor="middle" fontWeight="700" fill={COL.gris}>acide</T><T x="300" y="30" textAnchor="middle" fontWeight="700" fill={COL.gris}>base</T>
    {ids.map((c, k) => { const y = 78 + k * 44; return (<g key={c.id}>
      <text x="100" y={y} fontSize="22" fontWeight="800" textAnchor="middle" fill={COL.encre}>{espece(c.acide).formule}</text>
      <line x1="172" y1={y - 8} x2="214" y2={y - 8} stroke={COL.bleu} strokeWidth="3"/><polygon points={`214,${y - 15} 228,${y - 8} 214,${y - 1}`} fill={COL.bleu}/>
      <text x="300" y={y} fontSize="22" fontWeight="800" textAnchor="middle" fill={COL.encre}>{espece(c.base).formule}</text></g>); })}
  </Cadre>);
}

// ====================================================
//  CARTES « À RETENIR » (viewBox 320 de large, texte ≥ 15,5)
// ====================================================
const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Tc = p => <text fontSize="15.5" fill={COL.encre} {...p}/>;
const Fl = ({ x1, y1, x2, y2, c = COL.bleu }) => { const a = Math.atan2(y2 - y1, x2 - x1), px = x2 - Math.cos(a) * 12, py = y2 - Math.sin(a) * 12, nx = -Math.sin(a) * 6, ny = Math.cos(a) * 6;
  return <g><line x1={x1} y1={y1} x2={px} y2={py} stroke={c} strokeWidth="3.2"/><polygon points={`${x2},${y2} ${px + nx},${py + ny} ${px - nx},${py - ny}`} fill={c}/></g>; };

// carte 1 : acide, base, couple
export function SvgCoupleCarte() {
  return (<svg viewBox="0 0 320 262" style={stl} role="img" aria-label="Un acide AH cède un ion H plus et donne sa base conjuguée A moins ; la base capte H plus et redonne l’acide. Exemples : NH₄⁺ et NH₃, CH₃COOH et CH₃COO⁻. Le couple s’écrit acide barre base.">
    <text x="62" y="40" fontSize="26" fontWeight="800" textAnchor="middle" fill={COL.encre}>AH</text>
    <text x="258" y="40" fontSize="26" fontWeight="800" textAnchor="middle" fill={COL.encre}>A⁻</text>
    <Fl x1="104" y1="26" x2="214" y2="26"/><Tc x="159" y="18" textAnchor="middle" fontWeight="700" fill={COL.bleu}>cède H⁺</Tc>
    <Fl x1="214" y1="50" x2="104" y2="50" c={COL.orange}/><Tc x="159" y="72" textAnchor="middle" fontWeight="700" fill={COL.orange}>capte H⁺</Tc>
    <Tc x="62" y="72" textAnchor="middle" fill={COL.gris}>acide</Tc><Tc x="258" y="72" textAnchor="middle" fill={COL.gris}>base</Tc>
    <line x1="10" y1="92" x2="310" y2="92" stroke={COL.clair}/>
    <Tc x="160" y="118" textAnchor="middle" fontWeight="800">le couple s’écrit acide / base</Tc>
    <text x="80" y="156" fontSize="21" fontWeight="800" textAnchor="middle" fill={COL.encre}>NH₄⁺</text><Tc x="160" y="154" textAnchor="middle" fill={COL.bleu}>→</Tc><text x="240" y="156" fontSize="21" fontWeight="800" textAnchor="middle" fill={COL.encre}>NH₃ + H⁺</text>
    <text x="80" y="198" fontSize="21" fontWeight="800" textAnchor="middle" fill={COL.encre}>CH₃COOH</text><Tc x="160" y="196" textAnchor="middle" fill={COL.bleu}>→</Tc><text x="244" y="198" fontSize="21" fontWeight="800" textAnchor="middle" fill={COL.encre}>CH₃COO⁻ + H⁺</text>
    <Tc x="160" y="236" textAnchor="middle" fill={COL.gris}>atomes et charge se conservent</Tc>
  </svg>);
}

// carte 2 : acide carboxylique → ion carboxylate
export function SvgCarboxyleCarte() {
  const A = espece('CH3COOH').graphe, B = espece('CH3COO-').graphe;
  const [x0, x1, y0, y1] = emprise(A), s = Math.min(0.78, 92 / (y1 - y0)), cx = 160 - ((x0 + x1) / 2) * s + 8, my = ((y0 + y1) / 2) * s;
  return (<svg viewBox="0 0 320 440" style={stl} role="img" aria-label="CH₃COOH perd un H plus, celui de la liaison O–H, et devient CH₃COO⁻. Le doublet de la liaison O–H reste sur l’atome d’oxygène : il porte trois doublets non liants et la charge moins.">
    <Tc x="160" y="22" textAnchor="middle" fontWeight="800">acide carboxylique</Tc>
    <DessinMol g={A} cx={cx} cy={96 - my} s={s} fsA={16} halo={[3]} idp="c1"/>
    <Tc x="160" y="170" textAnchor="middle" fill={COL.gris}>H⁺ part de la liaison O–H</Tc>
    <Fl x1={160} y1={184} x2={160} y2={226}/><Tc x="176" y="212" fontWeight="800" fill={COL.bleu}>− H⁺</Tc>
    <Tc x="160" y="258" textAnchor="middle" fontWeight="800">ion carboxylate</Tc>
    <DessinMol g={B} cx={cx} cy={330 - my} s={s} fsA={16} halo={[]} idp="c2"/>
    <Tc x="160" y="410" textAnchor="middle" fill={COL.gris}>le doublet O–H reste sur O : O⁻</Tc>
    <Tc x="160" y="432" textAnchor="middle" fill={COL.gris}>(angles non réels)</Tc>
  </svg>);
}

// carte 3 : amine + H⁺ → ion ammonium
export function SvgAmineCarte() {
  const A = espece('CH3NH2').graphe, B = espece('CH3NH3+').graphe;
  const [x0, x1, y0, y1] = emprise(B), s = Math.min(0.8, 92 / (y1 - y0)), cx = 160 - ((x0 + x1) / 2) * s, my = ((y0 + y1) / 2) * s;
  return (<svg viewBox="0 0 320 440" style={stl} role="img" aria-label="L’amine CH₃NH₂ a un doublet non liant sur l’azote. Elle capte H plus avec ce doublet : l’azote a alors quatre liaisons et porte la charge plus dans l’ion CH₃NH₃⁺.">
    <Tc x="160" y="22" textAnchor="middle" fontWeight="800">amine</Tc>
    <DessinMol g={A} cx={cx} cy={96 - my} s={s} fsA={16} halo={[]} idp="a1"/>
    <Tc x="160" y="172" textAnchor="middle" fill={COL.gris}>N : un doublet non liant</Tc>
    <Fl x1={160} y1={186} x2={160} y2={228} c={COL.orange}/><Tc x="176" y="214" fontWeight="800" fill={COL.orange}>+ H⁺</Tc>
    <Tc x="160" y="258" textAnchor="middle" fontWeight="800">ion ammonium</Tc>
    <DessinMol g={B} cx={cx} cy={330 - my} s={s} fsA={16} halo={[]} idp="a2"/>
    <Tc x="160" y="404" textAnchor="middle" fill={COL.gris}>N : 4 liaisons, N⁺</Tc>
    <Tc x="160" y="428" textAnchor="middle" fill={COL.gris}>(angles non réels)</Tc>
  </svg>);
}

// carte 4 : équation d'une réaction acide-base
export function SvgEquationCarte() {
  return (<svg viewBox="0 0 320 306" style={stl} role="img" aria-label="Réaction acide-base : l’acide du couple 1 cède H plus à la base du couple 2. Exemple : CH₃COOH + NH₃ donne CH₃COO⁻ + NH₄⁺. Vérifier : mêmes atomes et même charge de chaque côté.">
    <Tc x="160" y="24" textAnchor="middle" fontWeight="800">acide 1 + base 2 → base 1 + acide 2</Tc>
    <text x="160" y="72" fontSize="22" fontWeight="800" textAnchor="middle" fill={COL.encre}>CH₃COOH + NH₃</text>
    <Fl x1={160} y1={86} x2={160} y2={118}/>
    <Tc x="176" y="108" fill={COL.bleu} fontWeight="700">H⁺ passe de 1 à 2</Tc>
    <text x="160" y="150" fontSize="22" fontWeight="800" textAnchor="middle" fill={COL.encre}>CH₃COO⁻ + NH₄⁺</text>
    <line x1="10" y1="172" x2="310" y2="172" stroke={COL.clair}/>
    <Tc x="160" y="198" textAnchor="middle" fontWeight="800">on vérifie</Tc>
    <Tc x="160" y="224" textAnchor="middle">atomes : 7 H à gauche, 7 H à droite</Tc>
    <Tc x="160" y="250" textAnchor="middle">charge : 0 + 0 = (−1) + (+1) = 0</Tc>
    <Tc x="160" y="284" textAnchor="middle" fill={COL.gris}>un H⁺ cédé = un H⁺ capté</Tc>
  </svg>);
}

// carte 5 : espèce amphotère
export function SvgAmphotereCarte() {
  return (<svg viewBox="0 0 320 330" style={stl} role="img" aria-label="Une espèce amphotère est l’acide d’un couple et la base d’un autre. L’eau est la base du couple H₃O⁺ et H₂O et l’acide du couple H₂O et HO⁻. L’ion hydrogénocarbonate est la base du couple CO₂,H₂O et HCO₃⁻ et l’acide du couple HCO₃⁻ et CO₃²⁻.">
    {[[34, 'H₃O⁺', 'H₂O', 'HO⁻', 'eau'], [186, 'CO₂,H₂O', 'HCO₃⁻', 'CO₃²⁻', 'ion hydrogénocarbonate']].map(([y, a, m, b, nom]) => (<g key={m}>
      <text x="48" y={y + 22} fontSize="17" fontWeight="800" textAnchor="middle" fill={COL.encre}>{a}</text>
      <rect x="118" y={y} width="84" height="38" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.6"/>
      <text x="160" y={y + 26} fontSize="18" fontWeight="800" textAnchor="middle" fill={COL.encre}>{m}</text>
      <text x="274" y={y + 22} fontSize="18" fontWeight="800" textAnchor="middle" fill={COL.encre}>{b}</text>
      <Fl x1={116} y1={y + 19} x2={98} y2={y + 19} c={COL.orange}/><Fl x1={204} y1={y + 19} x2={238} y2={y + 19}/>
      <Tc x="160" y={y + 62} textAnchor="middle" fill={COL.orange} fontWeight="700">à gauche : elle est la base</Tc>
      <Tc x="160" y={y + 82} textAnchor="middle" fill={COL.bleu || COL.encre} fontWeight="700">à droite : elle est l’acide</Tc>
      <Tc x="160" y={y + 102} textAnchor="middle" fill={COL.gris}>{nom} : deux couples</Tc></g>))}
    <line x1="10" y1="150" x2="310" y2="150" stroke={COL.clair}/>
    <Tc x="160" y="172" textAnchor="middle" fontWeight="800">amphotère = acide ET base</Tc>
    <Tc x="160" y="318" textAnchor="middle" fill={COL.gris}>HCO₃⁻ et H₂O : dans deux couples</Tc>
  </svg>);
}
export { nbLiaisons };
