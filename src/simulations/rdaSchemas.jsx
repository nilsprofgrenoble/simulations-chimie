// ====================================================
//  Schémas de la simulation 184 « Radioactivité : diagramme (N, Z) et équations de désintégration » (TG).
//  Règles : textes ≥ 16 dans un viewBox de 400 (cartes : ≥ 13,5 dans un viewBox de 320), width 100 % + maxWidth 480 (cartes 330), aucun texte hors cadre ;
//  le statut d'un noyau n'est JAMAIS donné par la couleur seule : stable = carré plein, radioactif = cercle creux (statut seul) ou, une fois les types vus,
//  β⁻ = disque, β⁺ = losange, α = triangle (couleurs : bleu, orange, violet, de la palette « daltonien »).
//  Le diagramme est SCHÉMATIQUE : N en abscisse, Z en ordonnée, une case par noyau, pas d'échelle de stabilité exacte.
// ====================================================
import { Fl } from './pesSchemas';
import * as M from './rdaModele';
import { VALLEE } from './rdaVallee';

import { COL, COL_MODE } from './rdaOutils';
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const stlCarte = { width: '100%', maxWidth: 330, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const MOINS = '−';

// ====================================================
//  NOTATION A/Z X en MathML (noyau, particule, neutrino) — à placer dans un <Formule> ou un <math>
// ====================================================
const sgn = Z => (typeof Z === 'number' ? (Z < 0 ? MOINS + Math.abs(Z) : String(Z)) : Z);
export const MN = ({ A, Z, s, base = null, signe = false }) => (
  <mmultiscripts>
    {base || <mi mathvariant="normal">{s}</mi>}
    <mprescripts/>
    <mn>{signe && typeof Z === 'number' && Z > 0 ? '+' + Z : sgn(Z)}</mn>
    <mn>{A}</mn>
  </mmultiscripts>);
const NUsym = anti => (anti ? <mover accent="true"><mi>ν</mi><mo>¯</mo></mover> : <mi>ν</mi>);
export const MPlus = () => <mo>+</mo>;
// équation complète : père → fils + particule (+ neutrino). trou : 'pere' | 'fils' | null (valeurs masquées par « ? »)
export function EqMath({ pere, fils, mode, trou = null, nu = true, sans = null }) {
  const p = M.PARTICULES[mode], n = M.NU[mode];
  const N = (x, cache, lettre) => (cache ? <MN A="?" Z="?" base={<mi mathvariant="normal">{lettre}</mi>}/> : <MN A={x.A} Z={x.Z} s={x.s}/>);
  return (
    <mrow>
      {sans === 'pere' ? <mi>?</mi> : N(pere, trou === 'pere', 'X')}
      <mo>→</mo>
      {sans === 'fils' ? <mi>?</mi> : N(fils, trou === 'fils', 'Y')}
      <mo>+</mo>
      {sans === 'particule' ? <mi>?</mi> : <MN A={p.A} Z={p.Z} s={p.s} signe/>}
      {nu && n && <><mo>+</mo><MN A={0} Z={0} base={NUsym(n.anti)}/></>}
    </mrow>);
}

// ====================================================
//  LÉGENDE (HTML) du diagramme : marques et leur signification
// ====================================================
export function MarqueSvg({ mode, t = 16 }) {
  const s = t * 0.36;
  return (
    <svg width={t} height={t} viewBox={`0 0 ${t} ${t}`} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 4 }}>
      <Marque x={t / 2} y={t / 2} c={t} mode={mode} s0={s}/>
    </svg>);
}
// une marque centrée en (x, y) pour une case de côté c
export function Marque({ x, y, c, mode, s0 }) {
  const s = s0 ?? c * 0.36;
  if (mode === 's') return <rect x={x - s * 1.05} y={y - s * 1.05} width={s * 2.1} height={s * 2.1} fill={COL.st}/>;
  if (mode === 'un') return <circle cx={x} cy={y} r={s * 1.05} fill="#fff" stroke={COL.st} strokeWidth={Math.max(1.6, c * 0.14)}/>;
  if (mode === 'b-') return <circle cx={x} cy={y} r={s * 1.1} fill={COL.bm}/>;
  if (mode === 'b+') return <polygon points={`${x},${y - s * 1.5} ${x + s * 1.35},${y} ${x},${y + s * 1.5} ${x - s * 1.35},${y}`} fill={COL.bp}/>;
  if (mode === 'a') return <polygon points={`${x},${y - s * 1.35} ${x + s * 1.3},${y + s * 1.0} ${x - s * 1.3},${y + s * 1.0}`} fill={COL.al}/>;
  return null;
}
export function LegendeDiagramme({ radios = 'aucun', style }) {
  const it = (m, t) => <span key={m} style={{ marginRight: 12, whiteSpace: 'nowrap' }}><MarqueSvg mode={m}/>{t}</span>;
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: '#334155', ...style }}>
      {it('s', 'noyau stable')}
      {radios === 'un' && it('un', 'noyau radioactif')}
      {radios === 'types' && <>{it('b-', 'radioactif β⁻')}{it('b+', 'radioactif β⁺')}{it('a', 'radioactif α')}</>}
    </div>);
}

// ====================================================
//  DIAGRAMME (N, Z) — une région, des marques, des flèches, des étiquettes
//  props : region (clé de M.REGIONS) ; radios : 'aucun' | 'un' | 'types' ; masquer(n) → true pour ne pas dessiner le noyau ; ligneZ : Z d'une rangée à entourer ;
//  sel : [Z, N] noyau entouré ; fleches : [{ de: [Z, N], vers: [Z, N], mode }] ; etiquettes : [{ Z, N, t, dx, dy, a }] ; onPick(n) : clic sur un noyau
// ====================================================
export function Diagramme({ region, radios = 'un', masquer = null, ligneZ = null, sel = null, fleches = [], etiquettes = [], onPick = null, aria, marquesExtra = [] }) {
  const R = M.REGIONS[region], nc = R.Nmax - R.Nmin + 1, nl = R.Zmax - R.Zmin + 1;
  const c = region === 'legers' ? 14 : 15, mx = 46, my = 12, bas = my + nl * c, H = bas + 50;
  const cx = N => mx + (N - R.Nmin + 0.5) * c, cy = Z => my + (R.Zmax - Z + 0.5) * c;
  const noyaux = R.noyaux.filter(n => !(masquer && masquer(n)));
  const tN = [], tZ = [];
  for (let N = R.Nmin; N <= R.Nmax; N += R.pasN) tN.push(N);
  for (let Z = R.Zmin + (R.Zmin % 2 ? 1 : 0); Z <= R.Zmax; Z += R.pasZ) tZ.push(Z);
  return (
    <svg viewBox={`0 0 400 ${H}`} style={stl} role="img" aria-label={aria || `Diagramme (N, Z) : nombre de neutrons N en abscisse, nombre de protons Z en ordonnée, région des ${R.nom}.`}>
      {/* quadrillage léger */}
      {Array.from({ length: nc + 1 }, (_, k) => <line key={'v' + k} x1={mx + k * c} y1={my} x2={mx + k * c} y2={bas} stroke="#eef2f7" strokeWidth="1"/>)}
      {Array.from({ length: nl + 1 }, (_, k) => <line key={'h' + k} x1={mx} y1={my + k * c} x2={mx + nc * c} y2={my + k * c} stroke="#eef2f7" strokeWidth="1"/>)}
      <rect x={mx} y={my} width={nc * c} height={nl * c} fill="none" stroke="#94a3b8" strokeWidth="1.4"/>
      {ligneZ != null && <rect x={mx - 1} y={cy(ligneZ) - c / 2 - 1} width={nc * c + 2} height={c + 2} fill="rgba(245,163,26,0.16)" stroke={COL.or} strokeWidth="2" strokeDasharray="5 3"/>}
      {/* noyaux */}
      {noyaux.map(n => {
        const m = n[2] === 's' ? 's' : radios === 'aucun' ? null : radios === 'un' ? 'un' : n[2];
        return m ? <g key={n[0] + '-' + n[1]}>
          <Marque x={cx(n[1])} y={cy(n[0])} c={c} mode={m}/>
          {onPick && <rect x={cx(n[1]) - c / 2} y={cy(n[0]) - c / 2} width={c} height={c} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onPick(n)}/>}
        </g> : null;
      })}
      {marquesExtra.map(([Z, N, m], k) => <Marque key={'x' + k} x={cx(N)} y={cy(Z)} c={c} mode={m}/>)}
      {/* flèches de désintégration */}
      {fleches.map((f, k) => {
        const x1 = cx(f.de[1]), y1 = cy(f.de[0]), x2 = cx(f.vers[1]), y2 = cy(f.vers[0]), L = Math.hypot(x2 - x1, y2 - y1) || 1, u = (x2 - x1) / L, v = (y2 - y1) / L, r = Math.min(c * 0.55, L * 0.2);
        return <Fl key={k} x1={x1 + u * r} y1={y1 + v * r} x2={x2 - u * r} y2={y2 - v * r} c={f.c || COL_MODE[f.mode] || COL.or} w={f.w || 2.6} tete={9} demi={4} dash={f.mode === 'b+' ? '5 3' : undefined}/>;
      })}
      {fleches.filter(f => f.cadre).map((f, k) => <rect key={'cf' + k} x={cx(f.vers[1]) - c * 0.62} y={cy(f.vers[0]) - c * 0.62} width={c * 1.24} height={c * 1.24} fill="none" stroke={COL_MODE[f.mode] || COL.or} strokeWidth="3" strokeDasharray="4 2.5" rx="2"/>)}
      {sel && <rect x={cx(sel[1]) - c * 0.62} y={cy(sel[0]) - c * 0.62} width={c * 1.24} height={c * 1.24} fill="none" stroke={COL.or} strokeWidth="3" rx="2"/>}
      {/* axes */}
      {tN.map(N => <g key={'n' + N}><line x1={cx(N)} y1={bas} x2={cx(N)} y2={bas + 5} stroke="#64748b"/><text x={cx(N)} y={bas + 22} fontSize="17" textAnchor="middle" fill="#334155">{N}</text></g>)}
      {tZ.map(Z => <g key={'z' + Z}><line x1={mx - 5} y1={cy(Z)} x2={mx} y2={cy(Z)} stroke="#64748b"/><text x={mx - 8} y={cy(Z) + 5.5} fontSize="17" textAnchor="end" fill="#334155">{Z}</text></g>)}
      <text x={mx + nc * c / 2} y={H - 6} fontSize="17" fontWeight="700" textAnchor="middle" fill="#0f172a">N (nombre de neutrons)</text>
      <text x="13" y={my + nl * c / 2} fontSize="17" fontWeight="700" textAnchor="middle" fill="#0f172a" transform={`rotate(-90 13 ${my + nl * c / 2})`}>Z (nombre de protons)</text>
      {etiquettes.map((e, k) => <text key={'e' + k} x={e.abs ? e.x : cx(e.N) + (e.dx ?? 0)} y={e.abs ? e.y : cy(e.Z) + (e.dy ?? 0)} fontSize="17" fontWeight="700" fill={e.c || '#0f172a'} textAnchor={e.a || 'start'} stroke="#fff" strokeWidth="4" paintOrder="stroke">{e.t}</text>)}
    </svg>);
}

// ====================================================
//  ÉTAPE 1 : le symbole A/Z X
// ====================================================
export function SvgSymbole({ A = 14, Z = 6, s = 'C' }) {
  return (
    <svg viewBox="0 0 420 190" style={stl} role="img" aria-label={`Symbole d'un noyau : le nombre ${A} en haut à gauche du symbole ${s} est le nombre de nucléons, le nombre ${Z} en bas à gauche est le nombre de protons.`}>
      <text x="128" y="92" fontSize="46" fontWeight="700" fill={COL.or} textAnchor="end">{A}</text>
      <text x="128" y="144" fontSize="46" fontWeight="700" fill={COL.bm} textAnchor="end">{Z}</text>
      <text x="136" y="130" fontSize="92" fontWeight="700" fill="#0f172a">{s}</text>
      <line x1="200" y1="30" x2="200" y2="170" stroke="#e2e8f0"/>
      <line x1="132" y1="56" x2="208" y2="50" stroke={COL.or} strokeWidth="2"/><line x1="132" y1="142" x2="208" y2="142" stroke={COL.bm} strokeWidth="2"/>
      <text x="212" y="56" fontSize="18" fontWeight="700" fill={COL.or}>A : nucléons</text><text x="212" y="80" fontSize="18" fill="#334155">(protons + neutrons)</text>
      <text x="212" y="136" fontSize="18" fontWeight="700" fill={COL.bm}>Z : protons</text><text x="212" y="160" fontSize="18" fill="#334155">(numéro atomique)</text>
    </svg>);
}

// ====================================================
//  ÉTAPE 2 : les nucléons d'un noyau (protons pleins, neutrons creux) — carbone 12 : 6 protons et 6 neutrons
// ====================================================
const POS = Array.from({ length: 12 }, (_, i) => { const r = 18 * Math.sqrt(i + 0.3), a = i * 2.39996; return [Math.cos(a) * r, Math.sin(a) * r]; });
export function SvgNucleons({ pr = 6, ne = 6, nom = 'carbone 12' }) {
  const total = pr + ne, ordre = Array.from({ length: total }, (_, i) => (i % 2 === 0 ? 'p' : 'n'));
  // alternance : on garde exactement pr protons et ne neutrons
  let np = 0, nn = 0; const types = ordre.map(t => { if (t === 'p' && np < pr) { np++; return 'p'; } if (nn < ne) { nn++; return 'n'; } np++; return 'p'; });
  return (
    <svg viewBox="0 0 400 210" style={stl} role="img" aria-label={`Le noyau de ${nom} schématisé : ${pr} protons (disques pleins marqués +) et ${ne} neutrons (disques creux) serrés les uns contre les autres. Pas à l'échelle.`}>
      <g transform="translate(112 104)">
        {POS.slice(0, total).map(([x, y], k) => types[k] === 'p'
          ? <g key={k}><circle cx={x} cy={y} r="14" fill={COL.rouge}/><text x={x} y={y + 6} fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">+</text></g>
          : <circle key={k} cx={x} cy={y} r="14" fill="#fff" stroke={COL.st} strokeWidth="2.4"/>)}
      </g>
      <g transform="translate(226 70)"><circle r="12" fill={COL.rouge}/><text y="6" fontSize="18" fontWeight="700" fill="#fff" textAnchor="middle">+</text><text x="22" y="6" fontSize="18" fill="#0f172a">proton (+e)</text></g>
      <g transform="translate(226 112)"><circle r="12" fill="#fff" stroke={COL.st} strokeWidth="2.4"/><text x="22" y="6" fontSize="18" fill="#0f172a">neutron (neutre)</text></g>
      <text x="226" y="160" fontSize="18" fill="#334155">noyau de {nom}</text><text x="226" y="184" fontSize="18" fill="#334155">(pas à l’échelle)</text>
    </svg>);
}

// ====================================================
//  CARTES « À retenir » (viewBox 320, texte ≥ 13,5)
// ====================================================
const FS = 15.5;
const Tt = ({ x, y, children, s = FS, w = 600, c = '#0f172a', a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Titre = ({ t }) => <text x="160" y="22" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">{t}</text>;
// symbole A/Z X dans un SVG (A au-dessus de Z, à gauche de X)
export const NoyauSvg = ({ x, y, A, Z, s, t = 22, c = '#0f172a', a = 'start' }) => {
  const f = Math.max(15.5, t * 0.62), w = String(s).length * t * 0.58;
  const wn = Math.max(String(A).length, String(Z).length) * f * 0.58 + 2;
  const x0 = a === 'middle' ? x - (wn + w) / 2 : x;
  return <g><text x={x0 + wn} y={y - t * 0.34} fontSize={f} fontWeight="600" fill={c} textAnchor="end">{A}</text><text x={x0 + wn} y={y + t * 0.18} fontSize={f} fontWeight="600" fill={c} textAnchor="end">{Z}</text>
    <text x={x0 + wn + 2} y={y + t * 0.3} fontSize={t} fontWeight="700" fill={c}>{s}</text></g>;
};

// carte 1 : isotopes et diagramme (N, Z) — la rangée du carbone (Z = 6)
export function SvgIsotopesCarte() {
  const iso = M.isotopesDe(M.LEGERS, 6), N0 = 3, c = 30, mx = 30, y0 = 80, X = N => mx + (N - N0 + 0.5) * c;
  return (
    <svg viewBox="0 0 320 274" style={stlCarte} role="img" aria-label="Rangée du carbone dans le diagramme : les isotopes d'un même élément ont le même nombre de protons Z et sont alignés sur une ligne horizontale. Les noyaux stables sont des carrés pleins, les radioactifs des cercles creux.">
      <Titre t="Isotopes : même Z, N différent"/>
      <rect x={mx} y={y0 - c / 2 - 4} width={c * 8} height={c + 8} fill="rgba(245,163,26,0.16)" stroke={COL.or} strokeWidth="2" strokeDasharray="5 3"/>
      {iso.map(n => <Marque key={n[1]} x={X(n[1])} y={y0} c={c} mode={n[2] === 's' ? 's' : 'un'}/>)}
      {Array.from({ length: 8 }, (_, k) => N0 + k).map(N => <g key={N}><line x1={X(N)} y1={y0 + 22} x2={X(N)} y2={y0 + 27} stroke="#64748b"/><Tt x={X(N)} y={y0 + 44} a="middle" w={500} c="#334155">{N}</Tt></g>)}
      <Tt x={mx + c * 4} y={y0 + 66} a="middle" w={700}>N (neutrons)</Tt>
      <Tt x={mx + c * 4} y={y0 - 28} a="middle" c={COL.or} w={700}>Z = 6 : le carbone</Tt>
      <g><Marque x={24} y={164} c={22} mode="s"/><Tt x={42} y={169} w={500}>stable</Tt><Marque x={132} y={164} c={22} mode="un"/><Tt x={150} y={169} w={500}>radioactif</Tt></g>
      <rect x="10" y="184" width="300" height="82" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.4"/>
      <Tt x="22" y="208" w={700}>A = Z + N</Tt><Tt x="22" y="232" w={500} c="#334155">nucléons = protons + neutrons</Tt>
      <Tt x="22" y="254" w={500} c="#334155">Isotopes : même ligne.</Tt>
    </svg>);
}

// carte 2 : deux conservations (générique, sans nombre de l'étape α)
export function SvgConservationCarte() {
  return (
    <svg viewBox="0 0 320 250" style={stlCarte} role="img" aria-label="Lors d'une désintégration, le nombre de nucléons A et le nombre de charge Z se conservent : la somme des A à gauche est égale à la somme des A à droite, de même pour Z.">
      <Titre t="Deux conservations"/>
      <rect x="10" y="38" width="300" height="70" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.4"/>
      <NoyauSvg x={22} y={78} A="A" Z="Z" s="X" t={26} c={COL.or}/>
      <Tt x="82" y={82} s={20} w={700}>→</Tt>
      <NoyauSvg x={104} y={78} A="A′" Z="Z′" s="Y" t={26} c={COL.bm}/>
      <Tt x="160" y={82} s={20} w={700}>+</Tt>
      <NoyauSvg x={178} y={78} A="A″" Z="Z″" s="P" t={26} c={COL.al}/>
      <Tt x="226" y={66} s={FS} c="#334155">père → fils</Tt><Tt x="226" y={86} s={FS} c="#334155">+ particule</Tt>
      <rect x="10" y="122" width="300" height="38" rx="8" fill="#fff" stroke={COL.or} strokeWidth="2"/>
      <Tt x="160" y="147" s={17} w={700} c={COL.or} a="middle">A = A′ + A″</Tt>
      <Tt x="160" y="176" s={FS} c="#334155" a="middle">nombre de nucléons conservé</Tt>
      <rect x="10" y="186" width="300" height="38" rx="8" fill="#fff" stroke={COL.bm} strokeWidth="2"/>
      <Tt x="160" y="211" s={17} w={700} c={COL.bm} a="middle">Z = Z′ + Z″</Tt>
      <Tt x="160" y="242" s={FS} c="#334155" a="middle">charge électrique conservée</Tt>
    </svg>);
}

// carte 3 : les trois désintégrations
export function SvgTroisCarte() {
  const lignes = [
    { y: 74, m: 'a', t: 'α', e: 'noyau d’hélium', p: [4, 2, 'He'], ch: 'A − 4 ; Z − 2', mv: '↙' },
    { y: 140, m: 'b-', t: 'β⁻', e: 'électron', p: [0, -1, 'e'], ch: 'A ; Z + 1', mv: '↖' },
    { y: 206, m: 'b+', t: 'β⁺', e: 'positon', p: [0, 1, 'e'], ch: 'A ; Z − 1', mv: '↘' },
  ];
  return (
    <svg viewBox="0 0 320 268" style={stlCarte} role="img" aria-label="Les trois désintégrations. Alpha : émission d'un noyau d'hélium, A diminue de 4 et Z de 2. Bêta moins : émission d'un électron, A inchangé et Z augmente de 1. Bêta plus : émission d'un positon, A inchangé et Z diminue de 1.">
      <Titre t="Trois désintégrations"/>
      {lignes.map(l => <g key={l.m}>
        <rect x="8" y={l.y - 40} width="306" height="58" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2"/>
        <Marque x={26} y={l.y - 22} c={26} mode={l.m} s0={8}/>
        <Tt x={44} y={l.y - 16} s={17} w={700} c={COL_MODE[l.m]}>{l.t}</Tt>
        <Tt x={76} y={l.y - 16} s={FS} w={500}>{l.e}</Tt>
        <NoyauSvg x={202} y={l.y - 18} A={l.p[0]} Z={l.p[1] > 0 && l.p[2] === 'e' ? '+1' : l.p[1] < 0 ? MOINS + '1' : l.p[1]} s={l.p[2]} t={22} c={COL_MODE[l.m]}/>
        <Tt x={20} y={l.y + 10} s={FS} w={600} c="#334155">père → fils : {l.ch}</Tt>
      </g>)}
      <Tt x="14" y="258" s={FS} w={500} c="#334155">Un (anti)neutrino accompagne β⁻ et β⁺.</Tt>
    </svg>);
}

// carte 4 : la vallée de stabilité et les trois zones (carte réelle des noyaux stables, schématique)
export function SvgPositionCarte() {
  const sx = 1.8, sy = 2.0, ox = 44, oy = 56;   // N 0..150 ; Z 0..95
  const X = N => ox + N * sx, Y = Z => oy + (95 - Z) * sy;
  const boite = (x, y, w, h, c, l1, l2, l3) => <g>
    <rect x={x} y={y} width={w} height={h} rx="6" fill="#fff" stroke={c} strokeWidth="2"/>
    <Tt x={x + w / 2} y={y + 18} a="middle" w={700} c={c}>{l1}</Tt><Tt x={x + w / 2} y={y + 37} a="middle" w={700} c={c}>{l2}</Tt>{l3 && <Tt x={x + w / 2} y={y + 56} a="middle" w={700} c={c}>{l3}</Tt>}
  </g>;
  return (
    <svg viewBox="0 0 320 318" style={stlCarte} role="img" aria-label="Carte schématique des noyaux : N en abscisse, Z en ordonnée. Les noyaux stables forment une bande étroite, la vallée de stabilité, qui monte vers la droite. Sous la vallée, à droite (trop de neutrons), la radioactivité est bêta moins ; au-dessus, à gauche (trop de protons), bêta plus ; pour les noyaux lourds, tout en haut de la vallée, c'est surtout alpha.">
      <Titre t="Où est le noyau ? Quel type ?"/>
      <rect x={ox} y={Y(95)} width={150 * sx} height={95 * sy} fill="#fff" stroke="#94a3b8"/>
      {VALLEE.map(([N, Z], k) => <rect key={k} x={X(N) - 1.4} y={Y(Z) - 1.4} width="2.8" height="2.8" fill={COL.st}/>)}
      {[0, 50, 100, 150].map(N => <g key={N}><line x1={X(N)} y1={Y(0)} x2={X(N)} y2={Y(0) + 4} stroke="#64748b"/><Tt x={X(N) - (N === 150 ? 2 : 0)} y={Y(0) + 20} a={N === 150 ? 'end' : 'middle'} w={500} c="#334155">{N}</Tt></g>)}
      {[0, 25, 50, 75].map(Z => <g key={Z}><line x1={ox - 4} y1={Y(Z)} x2={ox} y2={Y(Z)} stroke="#64748b"/><Tt x={ox - 7} y={Y(Z) + 5} a="end" w={500} c="#334155">{Z}</Tt></g>)}
      <Tt x={X(75)} y={Y(0) + 40} a="middle" w={700}>N</Tt><Tt x={9} y={Y(62) + 5} a="middle" w={700}>Z</Tt>
      {boite(180, 30, 134, 44, COL.al, 'noyau lourd', '⇒ α (souvent)')}
      {boite(ox + 6, Y(80), 82, 64, COL.bp, 'excès de', 'protons', '⇒ β⁺')}
      {boite(164, Y(35), 150, 46, COL.bm, 'excès de neutrons', '⇒ β⁻')}
      <Tt x="160" y="312" a="middle" w={500} c="#334155">schéma, échelle de stabilité non exacte</Tt>
    </svg>);
}

// carte 5 : chaîne de l'uranium 238 jusqu'au plomb 206 (8 α, 6 β⁻)
export function SvgChaineCarte() {
  const R = M.REGIONS.lourds, c = 12.2, ox = 34, oy = 54, nl = 11, nc = 23;
  const X = N => ox + (N - R.Nmin + 0.5) * c, Y = Z => oy + (R.Zmax - Z + 0.5) * c;
  const ch = M.chaine(M.trouve(92, 146));
  return (
    <svg viewBox="0 0 320 314" style={stlCarte} role="img" aria-label="Chaîne de désintégration de l'uranium 238 jusqu'au plomb 206 stable dans le diagramme : 8 désintégrations alpha (triangles violets) vers le bas et la gauche, et 6 désintégrations bêta moins (disques bleus) vers le haut et la gauche. Le nombre de nucléons passe de 238 à 206 et Z de 92 à 82.">
      <Titre t="Chaîne de l’uranium 238"/>
      <rect x={ox} y={oy} width={nc * c} height={nl * c} fill="#fff" stroke="#94a3b8"/>
      {ch.slice(0, -1).map((n, k) => { const f = ch[k + 1]; return <line key={k} x1={X(n[1])} y1={Y(n[0])} x2={X(f[1])} y2={Y(f[0])} stroke={COL_MODE[n[2]]} strokeWidth="2.4"/>; })}
      {ch.map((n, k) => <Marque key={k} x={X(n[1])} y={Y(n[0])} c={c} mode={n[2]} s0={4.4}/>)}
      {[124, 132, 140].map(N => <g key={N}><line x1={X(N)} y1={oy + nl * c} x2={X(N)} y2={oy + nl * c + 4} stroke="#64748b"/><Tt x={X(N)} y={oy + nl * c + 20} a="middle" w={500} c="#334155">{N}</Tt></g>)}
      {[82, 86, 90].map(Z => <g key={Z}><line x1={ox - 4} y1={Y(Z)} x2={ox} y2={Y(Z)} stroke="#64748b"/><Tt x={ox - 7} y={Y(Z) + 5} a="end" w={500} c="#334155">{Z}</Tt></g>)}
      <Tt x={ox + nc * c / 2} y={oy + nl * c + 40} a="middle" w={700}>N</Tt><Tt x={9} y={oy + nl * c / 2} a="middle" w={700}>Z</Tt>
      <Tt x={X(146) + 8} y={oy - 6} a="end" w={700}>départ : ²³⁸U</Tt>
      <Tt x={ox + 6} y={oy + 42} w={700}>arrivée : ²⁰⁶Pb (carré)</Tt>
      <Marque x={24} y={258} c={22} mode="a"/><Tt x={42} y={264} w={600}>8 α : A − 4, Z − 2</Tt>
      <Marque x={24} y={286} c={22} mode="b-"/><Tt x={42} y={292} w={600}>6 β⁻ : A, Z + 1</Tt>
      <Tt x="310" y="264" a="end" w={600}>A : 238 → 206</Tt><Tt x="310" y="292" a="end" w={600}>Z : 92 → 82</Tt>
    </svg>);
}
