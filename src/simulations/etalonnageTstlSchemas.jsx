// ====================================================
//  Schémas de la simulation 258 (dosage par étalonnage conductimétrique : concevoir le protocole, niveau TSTL).
//  Scène en panneaux empilés (viewBox de 400, textes de 14 à 20) : « cellule » (plaques, S et L), « prep » (flacon de solution mère, prélèvement, fiole jaugée),
//  « mesure » (bécher, cellule, conductimètre). Le graphique G = f(c) est celui de la sim 136 (GraphiqueEtalonnage), réutilisé sans modification.
//  Cartes « À retenir » : viewBox de 400, police ≥ 14. Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège, gris = texte secondaire.
// ====================================================
import { IONS_DESSIN as ID, nbPointsDe } from './condEtalonnageModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 2.5, deux = false }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), t = 10;
  const tete = (x, y, ang) => `${x},${y} ${x - t * Math.cos(ang - 0.45)},${y - t * Math.sin(ang - 0.45)} ${x - t * Math.cos(ang + 0.45)},${y - t * Math.sin(ang + 0.45)}`;
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w}/><polygon points={tete(x2, y2, a)} fill={c}/>{deux && <polygon points={tete(x1, y1, a + Math.PI)} fill={c}/>}</g>;
};
const Frac = ({ x, y, num, den, size = 18, fill = COL.txt }) => {
  const w = Math.max(num.length, den.length) * size * 0.56 + 10;
  return <g><text x={x} y={y - 5} fontSize={size} fontWeight="700" textAnchor="middle" fill={fill}>{num}</text><line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={fill} strokeWidth="2"/>
    <text x={x} y={y + size} fontSize={size} fontWeight="700" textAnchor="middle" fill={fill}>{den}</text></g>;
};
const Boite = ({ x, y, w, h, fill = '#f8fafc', stroke = '#cbd5e1' }) => <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={stroke} strokeWidth="2"/>;
const Point = ({ x, y, couleur, signe, r = 5.4 }) => { const a = r * 0.5, w = Math.max(1.3, r * 0.29);
  return <g><circle cx={x} cy={y} r={r} fill={couleur} stroke="#fff" strokeWidth="0.8"/><line x1={x - a} y1={y} x2={x + a} y2={y} stroke="#fff" strokeWidth={w}/>{signe > 0 && <line x1={x} y1={y - a} x2={x} y2={y + a} stroke="#fff" strokeWidth={w}/>}</g>; };
const teinte = c => `rgba(3,105,161,${(0.12 + 0.5 * Math.min(1, c / 10)).toFixed(2)})`;   // plus la solution est concentrée, plus elle est foncée (qualitatif)

// emplacements fixes (mélangés) des ions du bécher
const SLOTS = (() => {
  const s = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) s.push([52 + c * 16.5 + (r % 2 ? 8 : 0), 108 + r * 13]);
  let g = 17; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();

// dégradés métal / verre communs aux panneaux
const Defs = () => (<defs>
  <linearGradient id="ce-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#64748b"/><stop offset="0.45" stopColor="#cbd5e1"/><stop offset="1" stopColor="#475569"/></linearGradient>
  <linearGradient id="ce-verre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff"/><stop offset="0.25" stopColor="#e8f1f8"/><stop offset="1" stopColor="#ffffff"/></linearGradient>
</defs>);
const CadrePanneau = ({ y0, h }) => <rect x="6" y={y0 + 4} width="388" height={h} rx="12" fill="#f8fafc" stroke="#cbd5e1"/>;

// ---------- panneau : cellule (deux plaques parallèles) ----------
function PanneauCellule({ y0, S, L }) {
  const plaque = x => `${x - 14},${y0 + 46} ${x + 14},${y0 + 34} ${x + 14},${y0 + 94} ${x - 14},${y0 + 106}`;
  return (
    <g>
      <CadrePanneau y0={y0} h={152}/>
      <text x="200" y={y0 + 26} fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>les deux plaques de la cellule</text>
      {[140, 260].map(x => <g key={x}>
        <line x1={x} y1={y0 + 40} x2={x} y2={y0 + 33} stroke="#0f172a" strokeWidth="2.5"/>
        <polygon points={plaque(x)} fill="url(#ce-metal)" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round"/>
        <text x={x} y={y0 + 78} fontSize="20" fontWeight="700" textAnchor="middle" fill="#fff" stroke="#0f172a" strokeWidth="0.8">S</text></g>)}
      <Fleche x1={156} y1={y0 + 72} x2={244} y2={y0 + 72} c={COL.orange} deux/>
      <text x="200" y={y0 + 64} fontSize="20" fontWeight="700" textAnchor="middle" fill={COL.orange}>L</text>
      <text x="200" y={y0 + 130} fontSize="16" textAnchor="middle" fill={COL.txt}>surface d’une plaque : <tspan fontWeight="700" fill={COL.bleu}>S = {fr(S)} cm²</tspan></text>
      <text x="200" y={y0 + 149} fontSize="16" textAnchor="middle" fill={COL.txt}>distance entre les plaques : <tspan fontWeight="700" fill={COL.bleu}>L = {fr(L)} cm</tspan></text>
    </g>);
}

// ---------- panneau : préparation d'une solution par dilution (flacon, pipette jaugée, fiole jaugée) ----------
function PanneauPrep({ y0, vp, vf, c0, c, nomMere, etiquette, c0Txt, cTxt }) {
  const liq = teinte(c), cx = 214, yT = y0 + 66;               // axe de la fiole et trait de jauge
  return (
    <g>
      <CadrePanneau y0={y0} h={216}/>
      <text x="136" y={y0 + 28} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>Vp = {fr(vp, vp < 10 ? 2 : 1)} mL</text>
      <g transform="translate(0 24)">
      {/* flacon de solution mère : bouchon, épaule, étiquette */}
      <rect x="31" y={y0 + 50} width="26" height="10" rx="3" fill="#475569"/>
      <path d={`M 34 ${y0 + 60} L 54 ${y0 + 60} L 54 ${y0 + 72} Q 74 ${y0 + 80} 74 ${y0 + 98} L 74 ${y0 + 152} Q 74 ${y0 + 160} 66 ${y0 + 160} L 22 ${y0 + 160} Q 14 ${y0 + 160} 14 ${y0 + 152} L 14 ${y0 + 98} Q 14 ${y0 + 80} 34 ${y0 + 72} Z`} fill={teinte(c0 / 10)} stroke={COL.gris} strokeWidth="2.5" strokeLinejoin="round"/>
      <rect x="22" y={y0 + 104} width="44" height="34" rx="4" fill="#fff" stroke="#94a3b8"/>
      <text x="44" y={y0 + 129} fontSize="22" fontWeight="700" textAnchor="middle" fill={COL.txt}>{nomMere}</text>
      <text x="46" y={y0 + 176} fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.txt}>{nomMere === 'M' ? 'solution mère' : 'à doser'}</text>
      <text x="46" y={y0 + 192} fontSize="13.5" textAnchor="middle" fill={COL.txt}>{c0Txt || `${fr(c0, c0 < 10 ? 1 : 0)} mmol/L`}</text>
      {/* pipette jaugée : tube, renflement, trait de jauge, pointe */}
      <path d={`M 110 ${y0 + 48} L 110 ${y0 + 78} Q 98 ${y0 + 90} 98 ${y0 + 104} Q 98 ${y0 + 118} 110 ${y0 + 128} L 110 ${y0 + 158} L 114 ${y0 + 168} L 118 ${y0 + 158} L 118 ${y0 + 128} Q 130 ${y0 + 118} 130 ${y0 + 104} Q 130 ${y0 + 90} 118 ${y0 + 78} L 118 ${y0 + 48} Z`} fill="url(#ce-verre)" stroke={COL.gris} strokeWidth="2.2" strokeLinejoin="round"/>
      <path d={`M 110 ${y0 + 84} Q 98 ${y0 + 92} 98 ${y0 + 104} Q 98 ${y0 + 118} 110 ${y0 + 128} L 110 ${y0 + 158} L 114 ${y0 + 168} L 118 ${y0 + 158} L 118 ${y0 + 128} Q 130 ${y0 + 118} 130 ${y0 + 104} Q 130 ${y0 + 92} 118 ${y0 + 84} Z`} fill={teinte(c0 / 10)}/>
      <line x1="106" y1={y0 + 60} x2="122" y2={y0 + 60} stroke={COL.orange} strokeWidth="2.5"/>
      <text x="114" y={y0 + 186} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>pipette</text>
      {/* transfert */}
      <path d={`M 62 ${y0 + 44} Q 130 ${y0 + 6} ${cx - 8} ${y0 + 30}`} fill="none" stroke={COL.orange} strokeWidth="3.2" strokeLinecap="round"/>
      <polygon points={`${cx - 8},${y0 + 30} ${cx - 20},${y0 + 24} ${cx - 17},${y0 + 36}`} fill={COL.orange}/>
      {/* fiole jaugée : col étroit, trait de jauge, corps à fond plat */}
      <path d={`M ${cx - 8} ${y0 + 30} L ${cx - 8} ${yT + 22} Q ${cx - 8} ${yT + 38} ${cx - 34} ${yT + 52} Q ${cx - 50} ${yT + 62} ${cx - 50} ${yT + 84} L ${cx - 50} ${yT + 92} Q ${cx - 50} ${yT + 100} ${cx - 42} ${yT + 100} L ${cx + 42} ${yT + 100} Q ${cx + 50} ${yT + 100} ${cx + 50} ${yT + 92} L ${cx + 50} ${yT + 84} Q ${cx + 50} ${yT + 62} ${cx + 34} ${yT + 52} Q ${cx + 8} ${yT + 38} ${cx + 8} ${yT + 22} L ${cx + 8} ${y0 + 30}`} fill="url(#ce-verre)" stroke={COL.gris} strokeWidth="2.5" strokeLinejoin="round"/>
      <path d={`M ${cx - 8} ${yT} L ${cx - 8} ${yT + 22} Q ${cx - 8} ${yT + 38} ${cx - 34} ${yT + 52} Q ${cx - 50} ${yT + 62} ${cx - 50} ${yT + 84} L ${cx - 50} ${yT + 92} Q ${cx - 50} ${yT + 100} ${cx - 42} ${yT + 100} L ${cx + 42} ${yT + 100} Q ${cx + 50} ${yT + 100} ${cx + 50} ${yT + 92} L ${cx + 50} ${yT + 84} Q ${cx + 50} ${yT + 62} ${cx + 34} ${yT + 52} Q ${cx + 8} ${yT + 38} ${cx + 8} ${yT + 22} L ${cx + 8} ${yT} Z`} fill={liq} style={{ transition: 'fill 0.5s' }}/>
      <line x1={cx - 14} y1={yT} x2={cx + 14} y2={yT} stroke={COL.orange} strokeWidth="3.2"/>
      <text x={cx + 18} y={yT - 8} fontSize="13" fontWeight="700" fill={COL.orange}>trait de jauge</text>
      <text x={cx} y={yT + 80} fontSize="14" textAnchor="middle" fill={COL.txt}>+ eau</text>
      <text x={cx} y={y0 + 186} fontSize="14" textAnchor="middle" fill={COL.txt}>fiole jaugée <tspan fontWeight="700">{fr(vf, 1)} mL</tspan></text>
      {/* résultat */}
      <Boite x={292} y={y0 + 88} w={96} h={70} fill="#eff6ff" stroke="#93c5fd"/>
      <text x="340" y={y0 + 110} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>{etiquette || 'solution'}</text>
      <text x="340" y={y0 + 133} fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.bleu}>{cTxt || fr(c, c < 10 ? 2 : 1)}</text>
      <text x="340" y={y0 + 149} fontSize="13" textAnchor="middle" fill={COL.txt}>{cTxt ? '' : 'mmol/L'}</text>
      </g>
    </g>);
}

// ---------- panneau : mesure (bécher sur agitateur, sonde de conductimétrie, conductimètre) ----------
function PanneauMesure({ y0, soluteCat = 'Na', soluteAn = 'NO3', c, lecture, titre, temp }) {
  const C = ID[soluteCat], A = ID[soluteAn], n = Math.min(nbPointsDe(Math.max(c, 0.2)) , 14), dots = [];
  for (let i = 0; i < n; i++) dots.push({ ...C, p: SLOTS[i] });
  for (let i = 0; i < n; i++) dots.push({ ...A, p: SLOTS[n + i] });
  return (
    <g>
      <CadrePanneau y0={y0} h={182}/>
      {/* agitateur et bécher */}
      <rect x="30" y={y0 + 148} width="150" height="14" rx="5" fill="#e2e8f0" stroke="#64748b" strokeWidth="2"/>
      <path d={`M 38 ${y0 + 54} L 44 ${y0 + 140} Q 45 ${y0 + 148} 54 ${y0 + 148} L 156 ${y0 + 148} Q 165 ${y0 + 148} 166 ${y0 + 140} L 172 ${y0 + 54}`} fill="url(#ce-verre)" stroke={COL.gris} strokeWidth="2.5" strokeLinejoin="round"/>
      <path d={`M 41 ${y0 + 80} L 44 ${y0 + 140} Q 45 ${y0 + 148} 54 ${y0 + 148} L 156 ${y0 + 148} Q 165 ${y0 + 148} 166 ${y0 + 140} L 169 ${y0 + 80} Z`} fill={teinte(c)} style={{ transition: 'fill 0.5s' }}/>
      <line x1="38" y1={y0 + 54} x2="172" y2={y0 + 54} stroke={COL.gris} strokeWidth="3.5" strokeLinecap="round"/>
      {dots.map((d, i) => <Point key={i} x={d.p[0] + 2} y={d.p[1] - 108 + y0 + 96} couleur={d.c} signe={d.s} r={d.r * 0.78}/>)}
      <rect x="88" y={y0 + 138} width="26" height="6" rx="3" fill="#fff" stroke="#64748b" strokeWidth="1.5"/>
      {/* sonde : tube porte-plaques avec les deux plaques visibles, câble vers l'appareil */}
      <rect x="92" y={y0 + 22} width="26" height="86" rx="5" fill="#475569" stroke="#0f172a" strokeWidth="2"/>
      <rect x="95" y={y0 + 96} width="20" height="34" rx="3" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.6"/>
      <rect x="98" y={y0 + 99} width="4" height="28" fill="url(#ce-metal)" stroke="#0f172a" strokeWidth="1"/><rect x="108" y={y0 + 99} width="4" height="28" fill="url(#ce-metal)" stroke="#0f172a" strokeWidth="1"/>
      <path d={`M 105 ${y0 + 22} Q 105 ${y0 + 6} 160 ${y0 + 10} Q 208 ${y0 + 12} 220 ${y0 + 50}`} fill="none" stroke="#0f172a" strokeWidth="2.6" strokeLinecap="round"/>
      <text x="124" y={y0 + 72} fontSize="13.5" fontWeight="700" fill={COL.txt}>cellule</text>
      {/* conductimètre */}
      <rect x="212" y={y0 + 50} width="172" height="92" rx="12" fill="#e2e8f0" stroke="#475569" strokeWidth="2.5"/>
      <rect x="224" y={y0 + 60} width="148" height="42" rx="7" fill="#0f172a"/>
      <text x="298" y={y0 + 89} fontSize="19" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="monospace">{lecture ? `G = ${lecture}` : 'G = ?'}</text>
      {[246, 270, 294].map(x => <circle key={x} cx={x} cy={y0 + 114} r="5" fill="#94a3b8" stroke="#475569"/>)}
      <text x="298" y={y0 + 134} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>conductimètre</text>
      <text x="298" y={y0 + 160} fontSize="15" fontWeight="700" textAnchor="middle" fill={temp && temp !== 25 ? COL.rouge : COL.txt}>{temp ? `solution à ${temp} °C` : ''}</text>
      <text x="104" y={y0 + 180} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>{titre}</text>
      <g transform={`translate(212 ${y0 + 172})`}><Point x={10} y={0} couleur={C.c} signe={1} r={5}/><text x="20" y="5" fontSize="14" fill={COL.txt}>{C.f}</text><Point x={78} y={0} couleur={A.c} signe={-1} r={5}/><text x="88" y="5" fontSize="14" fill={COL.txt}>{A.f}</text></g>
    </g>);
}

// ---------- scène : panneaux empilés ----------
//  montrer : { cellule, prep, mesure } ; prep : { vp, vf, c0, c, nomMere, etiquette } ; mesure : { c, lecture, titre, temp, soluteCat, soluteAn } ; cellule : { S, L }
export function SceneProtocole({ montrer = {}, cellule = { S: 2.0, L: 1.6 }, prep = {}, mesure = {}, titre = '' }) {
  const hs = { cellule: 160, prep: 224, mesure: 190 };
  let y = 0; const pos = {}; ['cellule', 'prep', 'mesure'].forEach(k => { if (montrer[k]) { pos[k] = y; y += hs[k]; } });
  return (
    <svg viewBox={`0 0 400 ${Math.max(y, 160)}`} style={{ ...stl, maxWidth: 460 }} role="img"
      aria-label={`${titre || 'Montage'} : ${montrer.cellule ? `cellule à deux plaques de surface ${fr(cellule.S)} cm² distantes de ${fr(cellule.L)} cm. ` : ''}${montrer.prep ? `Préparation d’une solution par dilution : prélèvement de ${fr(prep.vp, 2)} mL d’une solution dans une fiole jaugée de ${fr(prep.vf, 1)} mL complétée avec de l’eau. ` : ''}${montrer.mesure ? `Cellule de conductimétrie plongée dans un bécher et reliée à un conductimètre${mesure.lecture ? ` qui affiche une conductance de ${mesure.lecture}` : ''}.` : ''}`}>
      <Defs/>
      {montrer.cellule && <PanneauCellule y0={pos.cellule} S={cellule.S} L={cellule.L}/>}
      {montrer.prep && <PanneauPrep y0={pos.prep} {...{ nomMere: 'M', ...prep }}/>}
      {montrer.mesure && <PanneauMesure y0={pos.mesure} {...mesure}/>}
    </svg>);
}

// ================= cartes « À retenir » =================
const Carte = ({ children, label }) => (<svg viewBox="0 0 400 290" style={stl} role="img" aria-label={label}><Defs/>{children}</svg>);
const Titre = ({ t }) => <text x="200" y="26" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>{t}</text>;

// carte 1 : G, σ, k
export function SvgGSigmaKCarte() {
  const plaque = x => `${x - 9},${70} ${x + 9},${62} ${x + 9},${110} ${x - 9},${118}`;
  return (
    <Carte label="Constante de cellule : k est égal à L divisé par S ; la conductance G est égale à la conductivité σ divisée par k. k ne dépend que de la cellule, σ ne dépend que de la solution. Exemple : L = 3,0 cm et S = 1,5 cm² donnent k = 2,0 cm⁻¹, soit 200 m⁻¹.">
      <Titre t="De G à σ : la constante de cellule k"/>
      <Boite x={14} y={42} w={150} h={96} fill="#f8fafc"/>
      {[52, 126].map(x => <line key={x} x1={x} y1={64} x2={x} y2={52} stroke="#0f172a" strokeWidth="2.5"/>)}
      <polygon points={plaque(52)} fill="url(#ce-metal)" stroke="#0f172a" strokeWidth="1.6"/><polygon points={plaque(126)} fill="url(#ce-metal)" stroke="#0f172a" strokeWidth="1.6"/>
      <Fleche x1={64} y1={98} x2={114} y2={98} c={COL.orange} deux/>
      <text x="89" y="86" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>L</text>
      <text x="52" y="97" fontSize="16" fontWeight="700" textAnchor="middle" fill="#fff" stroke="#0f172a" strokeWidth="0.7">S</text><text x="126" y="97" fontSize="16" fontWeight="700" textAnchor="middle" fill="#fff" stroke="#0f172a" strokeWidth="0.7">S</text>
      <text x="89" y="131" fontSize="13.5" textAnchor="middle" fill={COL.gris}>deux plaques</text>
      <Boite x={176} y={42} w={210} h={96} fill="#fff7ed" stroke="#fdba74"/>
      <text x="196" y="94" fontSize="20" fontWeight="700" fill={COL.orange}>k =</text>
      <Frac x={252} y={90} num="L" den="S" size={20} fill={COL.orange}/>
      <text x="290" y="94" fontSize="17" fill={COL.txt}>(en m⁻¹)</text>
      <text x="281" y="124" fontSize="14.5" textAnchor="middle" fill={COL.txt}>L en m, S en m²</text>
      <Boite x={14} y={150} w={372} h={56} fill="#eff6ff" stroke="#93c5fd"/>
      <text x="62" y="186" fontSize="20" fontWeight="700" fill={COL.bleu}>G =</text>
      <Frac x={132} y={182} num="σ" den="k" size={20} fill={COL.bleu}/>
      <text x="262" y="186" fontSize="16" textAnchor="middle" fill={COL.txt}>σ = k × G</text>
      <text x="200" y="232" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>k : la cellule seule · σ : la solution seule</text>
      <text x="200" y="256" fontSize="15" textAnchor="middle" fill={COL.txt}>ex. : L = 3,0 cm, S = 1,5 cm² → k = 2,0 cm⁻¹</text>
      <text x="200" y="276" fontSize="15" textAnchor="middle" fill={COL.gris}>1 cm⁻¹ = 100 m⁻¹, donc k = 200 m⁻¹</text>
    </Carte>);
}

// carte 2 : la droite d'étalonnage
export function SvgDroiteCarte() {
  const pts = [[2, 40], [4, 76], [6, 112], [8, 146], [10, 182]];
  const X = c => 60 + 30 * c, Y = g => 214 - g;
  return (
    <Carte label="Droite d’étalonnage : la conductance G est proportionnelle à la concentration c, la droite passe par l’origine, G = a × c avec a = (λ plus + λ moins) / k. Même cellule, même soluté, même température pour l’étalonnage et la mesure.">
      <Titre t="La droite d’étalonnage : G = a × c"/>
      <line x1="60" y1="214" x2="370" y2="214" stroke={COL.gris} strokeWidth="2"/><line x1="60" y1="214" x2="60" y2="44" stroke={COL.gris} strokeWidth="2"/>
      <text x="370" y="238" fontSize="14" textAnchor="end" fill={COL.gris}>c</text><text x="68" y="52" fontSize="14" fill={COL.gris}>G</text>
      <line x1={X(0)} y1={Y(0)} x2={X(10.5)} y2={Y(191)} stroke={COL.bleu} strokeWidth="3.5"/>
      {pts.map(([c, g]) => <circle key={c} cx={X(c)} cy={Y(g)} r="6" fill={COL.bleu} stroke="#fff" strokeWidth="1.5"/>)}
      <circle cx={X(0)} cy={Y(0)} r="5" fill="#fff" stroke={COL.orange} strokeWidth="3"/>
      <text x="76" y="204" fontSize="14" fontWeight="700" fill={COL.orange}>origine</text>
      <Boite x={226} y={62} w={152} h={76} fill="#fff7ed" stroke="#fdba74"/>
      <text x="244" y="108" fontSize="19" fontWeight="700" fill={COL.orange}>a =</text>
      <Frac x={316} y={104} num="λ₊ + λ₋" den="k" size={17} fill={COL.orange}/>
      <text x="200" y="258" fontSize="15.5" fontWeight="700" textAnchor="middle" fill={COL.vert}>même cellule, même soluté, même température</text>
      <text x="200" y="279" fontSize="14.5" textAnchor="middle" fill={COL.gris}>sinon la pente a change et la droite ne sert plus</text>
    </Carte>);
}

// carte 3 : domaine de validité
export function SvgDomaineCarte() {
  return (
    <Carte label="Domaine de validité : G est proportionnelle à c seulement pour les solutions diluées, c inférieure ou égale à 1,0×10⁻² mol/L soit 10 mmol/L. Au-delà, la courbe réelle passe sous la droite. Les étalons doivent tous être dans ce domaine.">
      <Titre t="Domaine de validité : c ≤ 1,0×10⁻² mol/L"/>
      <rect x="60" y="44" width="92" height="170" fill="#dcfce7" opacity="0.85"/>
      <line x1="60" y1="214" x2="370" y2="214" stroke={COL.gris} strokeWidth="2"/><line x1="60" y1="214" x2="60" y2="44" stroke={COL.gris} strokeWidth="2"/>
      <text x="370" y="238" fontSize="14" textAnchor="end" fill={COL.gris}>c</text><text x="68" y="52" fontSize="14" fill={COL.gris}>G</text>
      <line x1="60" y1="214" x2="352" y2="62" stroke={COL.gris} strokeWidth="2.5" strokeDasharray="7 6"/>
      <path d="M 60 214 L 152 166 Q 230 132 290 120 Q 330 114 352 112" fill="none" stroke={COL.bleu} strokeWidth="4"/>
      <line x1="152" y1="44" x2="152" y2="214" stroke={COL.orange} strokeWidth="2.5"/>
      <text x="152" y="236" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.orange}>10 mmol/L</text>
      <text x="106" y="86" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.vert}>droite</text><text x="106" y="104" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.vert}>valable</text>
      <text x="272" y="162" fontSize="15" fontWeight="700" fill={COL.rouge}>courbe réelle</text><text x="272" y="180" fontSize="15" fontWeight="700" fill={COL.rouge}>sous la droite</text>
      <text x="262" y="82" fontSize="14.5" fill={COL.gris}>droite prolongée</text>
      <text x="200" y="262" fontSize="15.5" fontWeight="700" textAnchor="middle" fill={COL.vert}>tous les étalons dans le domaine de validité</text>
      <text x="200" y="282" fontSize="14.5" textAnchor="middle" fill={COL.gris}>sinon on dilue la solution à doser X</text>
    </Carte>);
}

// carte 4 : dilution
export function SvgDilutionCarte() {
  return (
    <Carte label="Dilution : la quantité de matière prélevée se conserve, c0 × Vp = c × Vf. Le facteur de dilution est F = Vf / Vp = c0 / c. Exemple : 10,0 mL d’une solution à 50 mmol/L complétés à 100,0 mL donnent 5,0 mmol/L, F = 10.">
      <Titre t="Diluer : la quantité de matière se conserve"/>
      {/* flacon de solution mère */}
      <rect x="30" y="66" width="22" height="9" rx="3" fill="#475569"/>
      <path d="M 33 75 L 49 75 L 49 85 Q 66 91 66 104 L 66 148 Q 66 155 59 155 L 23 155 Q 16 155 16 148 L 16 104 Q 16 91 33 85 Z" fill={teinte(5)} stroke={COL.gris} strokeWidth="2.5" strokeLinejoin="round"/>
      <rect x="23" y="108" width="36" height="28" rx="4" fill="#fff" stroke="#94a3b8"/><text x="41" y="129" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt}>M</text>
      <text x="41" y="174" fontSize="14.5" textAnchor="middle" fill={COL.txt}>c₀</text>
      {/* pipette jaugée */}
      <path d="M 96 78 L 96 98 Q 87 106 87 116 Q 87 126 96 133 L 96 154 L 99 162 L 102 154 L 102 133 Q 111 126 111 116 Q 111 106 102 98 L 102 78 Z" fill="url(#ce-verre)" stroke={COL.gris} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M 96 108 Q 87 112 87 118 Q 87 126 96 133 L 96 154 L 99 162 L 102 154 L 102 133 Q 111 126 111 118 Q 111 112 102 108 Z" fill={teinte(5)}/>
      <text x="99" y="180" fontSize="14.5" fontWeight="700" textAnchor="middle" fill={COL.orange}>Vp</text>
      <path d="M 54 66 Q 110 40 168 56" fill="none" stroke={COL.orange} strokeWidth="3" strokeLinecap="round"/><polygon points="168,56 157,50 158,62" fill={COL.orange}/>
      {/* fiole jaugée */}
      <path d="M 196 56 L 196 96 Q 196 106 178 116 Q 164 124 164 142 L 164 150 Q 164 158 172 158 L 240 158 Q 248 158 248 150 L 248 142 Q 248 124 234 116 Q 216 106 216 96 L 216 56" fill="url(#ce-verre)" stroke={COL.gris} strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M 196 78 L 196 96 Q 196 106 178 116 Q 164 124 164 142 L 164 150 Q 164 158 172 158 L 240 158 Q 248 158 248 150 L 248 142 Q 248 124 234 116 Q 216 106 216 96 L 216 78 Z" fill={teinte(1.5)}/>
      <line x1="190" y1="78" x2="222" y2="78" stroke={COL.orange} strokeWidth="3"/>
      <text x="206" y="180" fontSize="14.5" textAnchor="middle" fill={COL.txt}>c, Vf</text><text x="206" y="46" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>+ eau</text>
      <Boite x={262} y={60} w={126} h={110} fill="#fff7ed" stroke="#fdba74"/>
      <text x="325" y="90" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>c₀ × Vp</text><text x="325" y="112" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>= c × Vf</text>
      <text x="325" y="142" fontSize="16" textAnchor="middle" fill={COL.txt}>F = Vf / Vp</text><text x="325" y="162" fontSize="16" textAnchor="middle" fill={COL.txt}>= c₀ / c</text>
      <text x="200" y="224" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>on prélève Vp, on complète avec l’eau jusqu’au trait</text>
      <text x="200" y="250" fontSize="15" textAnchor="middle" fill={COL.txt}>ex. : 10,0 mL à 50 mmol/L dans 100,0 mL</text>
      <text x="200" y="272" fontSize="15" textAnchor="middle" fill={COL.txt}>donnent 5,0 mmol/L (F = 10)</text>
    </Carte>);
}

// carte 5 : choisir la dilution de la solution à doser
export function SvgChoixGammeCarte() {
  const X = c => 30 + 340 * c / 20;
  return (
    <Carte label="Choisir la dilution : la solution diluée X′ doit se trouver à l’intérieur de la gamme des étalons, de 2 à 10 mmol/L, donc dans le domaine de validité. Ensuite c de X est égale à F fois c de X′. Exemple : X à 0,60 mol/L, F = 100, c de X′ = 6,0 mmol/L.">
      <Titre t="Choisir F : viser le milieu de la gamme"/>
      <rect x={X(0)} y="52" width={X(2) - X(0)} height="44" fill="#fee2e2"/><rect x={X(2)} y="52" width={X(10) - X(2)} height="44" fill="#dcfce7"/><rect x={X(10)} y="52" width={X(20) - X(10)} height="44" fill="#fee2e2"/>
      <rect x={X(0)} y="52" width={X(20) - X(0)} height="44" fill="none" stroke={COL.gris} strokeWidth="2"/>
      <line x1={X(2)} y1="52" x2={X(2)} y2="96" stroke={COL.gris} strokeWidth="2"/><line x1={X(10)} y1="52" x2={X(10)} y2="96" stroke={COL.orange} strokeWidth="3"/>
      {[0, 2, 10, 20].map(v => <text key={v} x={X(v)} y="116" fontSize="15" textAnchor="middle" fill={COL.txt}>{v}</text>)}
      <text x="370" y="136" fontSize="14" textAnchor="end" fill={COL.gris}>c (mmol/L)</text>
      <text x={(X(2) + X(10)) / 2} y="80" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>gamme des étalons</text>
      <text x={X(15)} y="80" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>hors domaine</text>
      <text x={X(1)} y="80" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>trop</text><text x={X(1)} y="95" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>basse</text>
      <polygon points={`${X(6)},56 ${X(6) - 8},44 ${X(6) + 8},44`} fill={COL.bleu}/><text x={X(6)} y="40" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.bleu}>X′</text>
      <Boite x={14} y={148} w={372} h={62} fill="#eff6ff" stroke="#93c5fd"/>
      <text x="200" y="173" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.bleu}>c(X′) = c(X) / F  donc  c(X) = F × c(X′)</text>
      <text x="200" y="196" fontSize="15" textAnchor="middle" fill={COL.txt}>ex. : c(X) = 0,60 mol/L, F = 100 → c(X′) = 6,0 mmol/L</text>
      <text x="200" y="236" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>ni hors du domaine, ni sous le 1er étalon</text>
      <text x="200" y="258" fontSize="15" textAnchor="middle" fill={COL.txt}>en dehors de la gamme, on extrapole : lecture peu sûre</text>
    </Carte>);
}

// carte 6 : la démarche complète
export function SvgDemarcheCarte() {
  const ligne = (n, y, t1, t2, c) => (
    <g>
      <circle cx="32" cy={y} r="14" fill={c}/><text x="32" y={y + 6} fontSize="16" fontWeight="700" textAnchor="middle" fill="#fff">{n}</text>
      <text x="58" y={y - 3} fontSize="15.5" fontWeight="700" fill={COL.txt}>{t1}</text><text x="58" y={y + 15} fontSize="14" fill={COL.txt}>{t2}</text>
      {n < 5 && <line x1="32" y1={y + 16} x2="32" y2={y + 28} stroke={COL.gris} strokeWidth="2"/>}
    </g>);
  return (
    <Carte label="Démarche d’un dosage par étalonnage : préparer des étalons par dilution dans le domaine de validité, mesurer leur conductance G, tracer la droite G = a × c, diluer la solution à doser X de F et mesurer G dans les mêmes conditions, lire c de la solution diluée puis calculer c de X égale à F fois c.">
      <Titre t="Le dosage par étalonnage : cinq étapes"/>
      {ligne(1, 56, 'préparer les étalons par dilution', 'tous dans le domaine : c ≤ 10 mmol/L', COL.bleu)}
      {ligne(2, 102, 'mesurer G de chaque étalon', 'même cellule, même température', COL.bleu)}
      {ligne(3, 148, 'tracer la droite G = a × c', 'elle passe par l’origine', COL.bleu)}
      {ligne(4, 194, 'diluer X (facteur F) et mesurer G′', 'X′ au milieu de la gamme, mêmes conditions', COL.orange)}
      {ligne(5, 240, 'lire c(X′) puis calculer c(X) = F × c(X′)', '', COL.vert)}
      <text x="200" y="278" fontSize="14.5" textAnchor="middle" fill={COL.gris}>aucune connaissance de k ni des λ n’est nécessaire</text>
    </Carte>);
}

// ---------- graphique G = f(c) (adapté de celui de la sim 136 : nom du point lu, étalons hors domaine, prolongement de la droite) ----------
//  points : [{ c, G, hors }] ; droite : a (mS par mmol/L) ou null ; marqueur : { G, nom } ou null
const pasNet = (max, cible) => { const b = max / cible, p = 10 ** Math.floor(Math.log10(b)), m = b / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
export function GraphiqueEtalon({ points = [], droite = null, xMax = 12, yMax = 1.8, marqueur = null, titre = '' }) {
  const X = c => 56 + 330 * c / xMax, Y = g => 196 - 176 * g / yMax;
  const px = pasNet(xMax, 6), py = pasNet(yMax, 5), gx = [], gy = [];
  for (let v = 0; v <= xMax + 1e-9; v += px) gx.push(v); for (let v = 0; v <= yMax + 1e-9; v += py) gy.push(v);
  const cMax = Math.min(10, xMax), aHors = points.some(p => p.hors), cLu = marqueur && droite ? marqueur.G / droite : null;
  const nom = marqueur ? marqueur.nom || 'X′' : '';
  const lignes = [['pt', 'étalon mesuré (dans le domaine)'], ...(aHors ? [['carre', 'étalon hors domaine (c > 10 mmol/L)']] : []), ...(droite ? [['droite', 'droite d’étalonnage']] : []), ...(marqueur ? [['lecture', `lecture pour la solution ${nom}`]] : [])];
  return (
    <svg viewBox={`0 0 400 ${262 + 18 * lignes.length + 4}`} style={{ ...stl, maxWidth: 520 }} role="img"
      aria-label={`${titre || 'Courbe d’étalonnage'} : conductance G en mS en fonction de la concentration c en mmol par litre, de 0 à ${fr(xMax, 0)} mmol par litre. ${points.length} points mesurés${droite ? ', droite d’étalonnage passant par l’origine' : ''}${marqueur ? `, lecture de la solution ${nom}` : ''}.`}>
      <rect x="56" y="20" width="330" height="176" fill="#f8fafc" stroke="#cbd5e1"/>
      {gy.map(g => <g key={g}><line x1="56" y1={Y(g)} x2="386" y2={Y(g)} stroke="#e2e8f0"/><text x="50" y={Y(g) + 5} fontSize="16" textAnchor="end" fill={COL.txt}>{fr(g, py < 1 ? (py < 0.1 ? 2 : 1) : 0)}</text></g>)}
      {gx.map(v => <g key={v}><line x1={X(v)} y1="196" x2={X(v)} y2="202" stroke={COL.txt}/><text x={X(v)} y="220" fontSize="16" textAnchor="middle" fill={COL.txt}>{fr(v, 0)}</text></g>)}
      <text x="56" y="14" fontSize="16" fill={COL.gris}>G (mS)</text>
      <text x="386" y="242" fontSize="16" textAnchor="end" fill={COL.gris}>concentration c (mmol/L)</text>
      {droite && <g>
        <line x1={X(0)} y1={Y(0)} x2={X(cMax)} y2={Math.max(20, Y(droite * cMax))} stroke={COL.bleu} strokeWidth="3"/>
        {xMax > 10 && <line x1={X(10)} y1={Y(droite * 10)} x2={X(Math.min(xMax, yMax / droite))} y2={Y(droite * Math.min(xMax, yMax / droite))} stroke={COL.bleu} strokeWidth="2.5" strokeDasharray="7 6"/>}</g>}
      {marqueur && <g>
        <line x1="56" y1={Y(marqueur.G)} x2={cLu != null ? X(cLu) : 386} y2={Y(marqueur.G)} stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>
        {cLu != null && <line x1={X(cLu)} y1={Y(marqueur.G)} x2={X(cLu)} y2="196" stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>}
        <text x="62" y={Y(marqueur.G) - 6} fontSize="16" fontWeight="700" fill={COL.rouge}>{nom}</text></g>}
      {points.map(p => p.hors
        ? <rect key={p.c} x={X(p.c) - 6} y={Y(p.G) - 6} width="12" height="12" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/>
        : <circle key={p.c} cx={X(p.c)} cy={Y(p.G)} r="5.5" fill={COL.bleu} stroke="#fff" strokeWidth="1.2"/>)}
      {lignes.map(([t, txt], i) => { const y = 262 + 18 * i;
        return <g key={t}>
          {t === 'pt' && <circle cx="20" cy={y - 5} r="5.5" fill={COL.bleu}/>}
          {t === 'carre' && <rect x="14" y={y - 11} width="12" height="12" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/>}
          {t === 'droite' && <line x1="10" y1={y - 5} x2="30" y2={y - 5} stroke={COL.bleu} strokeWidth="3"/>}
          {t === 'lecture' && <line x1="10" y1={y - 5} x2="30" y2={y - 5} stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>}
          <text x="38" y={y} fontSize="15" fill={COL.txt}>{txt}</text></g>; })}
    </svg>);
}
