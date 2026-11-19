// ====================================================
//  Schémas de la simulation 135 (conductimétrie : conductivité d'une solution et titrage conductimétrique, niveau TG).
//  Scène : viewBox de 400, textes de 15 à 22. Cartes « À retenir » : viewBox de 400, police ≥ 16 (≈ 14 px rendus sur téléphone), aucun indice en tspan.
//  Couleurs : rouge = H₃O⁺, violet = HO⁻, bleu = Na⁺, vert = anion spectateur (Cl⁻, NO₃⁻) ou ion éthanoate, gris = molécule d'acide éthanoïque.
//  Les points de la scène sont un schéma : un point = une même quantité de matière (0,1 mmol), sans échelle affichée.
// ====================================================
import { IONS, ANALYTES, V_BURETTE } from './conductimetrieModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', violet: '#7c3aed', gris: '#64748b', txt: '#0f172a' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

// ---------- emplacements des points (ordre mélangé fixe : la position d'un point ne change pas quand on en ajoute) ----------
const SLOTS = (() => {
  const s = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) s.push([112 + c * 14 + (r % 2 ? 6 : 0), 168 + r * 14.5]);
  let g = 7; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();
const Point = ({ x, y, couleur, signe }) => (
  <g><circle cx={x} cy={y} r="6.2" fill={couleur} stroke="#fff" strokeWidth="0.8"/>
    <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke="#fff" strokeWidth="1.8"/>{signe > 0 && <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#fff" strokeWidth="1.8"/>}</g>);

// ---------- scène : bécher, cellule de conductimétrie, conductimètre, burette ----------
//  points : { H3O, HO, Na, anion, acide } (nombres de points) ; anionId : 'Cl' | 'NO3' | 'AcO' ; lecture : texte du conductimètre (null : afficher « — »)
export function SceneConductimetrie({ points, anionId = 'Cl', lecture = null, cellule = true, burette = null, titre = '', legende = ['H3O', 'anion', 'Na'], acideLegende = null }) {
  const ordre = [['anion', IONS[anionId].couleur, -1], ['Na', IONS.Na.couleur, 1], ['H3O', IONS.H3O.couleur, 1], ['HO', IONS.HO.couleur, -1], ['acide', '#94a3b8', 0]];
  const dots = []; let k = 0;
  for (const [id, coul, sg] of ordre) for (let i = 0; i < (points[id] || 0) && k < SLOTS.length; i++, k++) dots.push({ id, coul, sg, p: SLOTS[k] });
  const niveauBurette = burette ? 18 + 3.9 * Math.min(burette.VB, V_BURETTE) : 0;
  const leg = legende.map(id => (id === 'anion' ? { id, f: IONS[anionId].f, c: IONS[anionId].couleur, sg: -1 } : id === 'acide' ? { id, f: acideLegende || 'molécule d’acide', c: '#94a3b8', sg: 0 } : { id, f: IONS[id].f, c: IONS[id].couleur, sg: IONS[id].z }));
  const ariaIons = leg.map(l => l.f).join(', ');
  const compact = !cellule && !burette;          // premier écran : seulement le bécher et ses ions
  return (
    <svg viewBox={compact ? '0 78 400 228' : '0 0 400 306'} style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Bécher contenant une solution avec des ions (${ariaIons}), une cellule de conductimétrie plongée dans la solution, reliée à un conductimètre qui affiche ${lecture ? lecture : 'rien pour le moment'}${burette ? `, et une burette de soude dont on a versé ${fr(burette.VB)} mL` : ''}.`}>
      {titre && <text x="8" y={compact ? 100 : 22} fontSize="17" fontWeight="700" fill={COL.txt}>{titre}</text>}
      {/* conductimètre */}
      {cellule && <g>
        <rect x="262" y="8" width="132" height="62" rx="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="2"/>
        <rect x="270" y="14" width="116" height="30" rx="4" fill="#0f172a"/>
        <text x="328" y="36" fontSize="20" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="monospace">{lecture || '— — —'}</text>
        <text x="328" y="62" fontSize="15" textAnchor="middle" fill={COL.txt}>conductimètre</text></g>}
      {/* bécher */}
      <path d="M95 122 L95 250 Q95 256 101 256 L259 256 Q265 256 265 250 L265 122" fill="none" stroke="#475569" strokeWidth="3"/>
      <path d="M98 152 L98 250 Q98 253 101 253 L259 253 Q262 253 262 250 L262 152 Z" fill="#dbeafe" opacity="0.75"/>
      {/* burette */}
      {burette && <g>
        <rect x="124" y="8" width="16" height="96" rx="2" fill="#fff" stroke="#475569" strokeWidth="2"/>
        <rect x="125" y={niveauBurette} width="14" height={104 - niveauBurette} fill="#e9d5ff"/>
        <path d="M129 104 L135 104 L133 118 L131 118 Z" fill="#475569"/>
        {[0, 10, 20].map(v => <g key={v}><line x1="122" y1={18 + 3.9 * v} x2="128" y2={18 + 3.9 * v} stroke="#475569" strokeWidth="1.5"/><text x="118" y={23 + 3.9 * v} fontSize="15" textAnchor="end" fill={COL.txt}>{v}</text></g>)}
        <text x="8" y="40" fontSize="16" fontWeight="700" fill={COL.violet}>burette :</text><text x="8" y="58" fontSize="16" fontWeight="700" fill={COL.violet}>soude</text><text x="8" y="76" fontSize="16" fill={COL.txt}>0,100 mol/L</text>
        <text x="8" y="98" fontSize="16" fill={COL.txt}>versé :</text><text x="8" y="116" fontSize="16" fontWeight="700" fill={COL.txt}>{fr(burette.VB)} mL</text>
      </g>}
      {/* ions et molécules */}
      {dots.map((d, i) => d.id === 'acide'
        ? <rect key={i} x={d.p[0] - 6.5} y={d.p[1] - 4} width="13" height="8" rx="3" fill={d.coul} stroke="#fff" strokeWidth="0.8"/>
        : <Point key={i} x={d.p[0]} y={d.p[1]} couleur={d.coul} signe={d.sg}/>)}
      {/* cellule de conductimétrie : câble, poignée, manchon de verre, deux plaques de platine noires */}
      {cellule && <g>
        <path d="M235 96 C235 60 262 78 300 70" fill="none" stroke="#334155" strokeWidth="3"/>
        <rect x="227" y="96" width="16" height="32" rx="3" fill="#475569"/>
        <rect x="222" y="126" width="26" height="92" rx="4" fill="#f8fafc" fillOpacity="0.7" stroke="#64748b" strokeWidth="1.8"/>
        <rect x="229" y="176" width="5" height="38" fill="#0f172a"/><rect x="236" y="176" width="5" height="38" fill="#0f172a"/>
        {[134, 146, 158].map(y => <line key={y} x1="225" y1={y} x2="245" y2={y} stroke="#94a3b8" strokeWidth="1.5"/>)}
        <text x="272" y="178" fontSize="15" fill={COL.txt}>cellule de</text><text x="272" y="196" fontSize="15" fill={COL.txt}>conductimétrie</text>
        <line x1="268" y1="174" x2="250" y2="190" stroke={COL.gris} strokeWidth="1.5"/>
      </g>}
      {/* légende */}
      {leg.map((l, i) => { const x = 10 + (i % 3) * 130, y = 276 + Math.floor(i / 3) * 18;
        return <g key={l.id}>{l.sg === 0 ? <rect x={x} y={y - 9} width="13" height="8" rx="3" fill={l.c}/> : <Point x={x + 6} y={y - 5} couleur={l.c} signe={l.sg}/>}<text x={x + 18} y={y} fontSize="16" fill={COL.txt}>{l.f}</text></g>; })}
    </svg>);
}

// ---------- graphique σ = f(V_B) ----------
//  trace : points reliés par une ligne ; mesures : points isolés (défi) ; marqueur : { VB, sigma } ; VE : abscisse de l'équivalence (ligne orange) ou null ; yMax : borne haute fixée
export function GraphiqueConductivite({ trace = [], mesures = null, marqueur = null, VE = null, yMax = 250, titre = '' }) {
  const X = v => 56 + 16.5 * v, Y = s => 196 - 176 * s / yMax;
  const pas = yMax > 300 ? 100 : yMax > 150 ? 50 : 25, graduations = []; for (let g = 0; g <= yMax + 1e-9; g += pas) graduations.push(g);
  const ligne = (trace.length ? trace : []).map(p => `${X(p.VB).toFixed(1)},${Y(p.sigma).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 400 252" style={{ ...stl, maxWidth: 520 }} role="img"
      aria-label={`${titre || 'Graphique'} : conductivité σ en mS par mètre en fonction du volume de soude versé, de 0 à 20 mL.${marqueur ? ` Le point courant est à ${fr(marqueur.VB)} mL, σ = ${fr(marqueur.sigma, 0)} mS par mètre.` : ''}`}>
      <rect x="56" y="20" width="330" height="176" fill="#f8fafc" stroke="#cbd5e1"/>
      {graduations.map(g => <g key={g}><line x1="56" y1={Y(g)} x2="386" y2={Y(g)} stroke="#e2e8f0"/><text x="50" y={Y(g) + 5} fontSize="16" textAnchor="end" fill={COL.txt}>{g}</text></g>)}
      {[0, 5, 10, 15, 20].map(v => <g key={v}><line x1={X(v)} y1="196" x2={X(v)} y2="202" stroke={COL.txt}/><text x={X(v)} y="220" fontSize="16" textAnchor="middle" fill={COL.txt}>{v}</text></g>)}
      <text x="56" y="14" fontSize="16" fill={COL.gris}>σ (mS·m⁻¹)</text>
      <text x="386" y="244" fontSize="16" textAnchor="end" fill={COL.gris}>volume de soude versé (mL)</text>
      {VE != null && <g><line x1={X(VE)} y1="20" x2={X(VE)} y2="196" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/><text x={X(VE) + 6} y="38" fontSize="16" fontWeight="700" fill={COL.orange}>équivalence</text></g>}
      {ligne && <polyline points={ligne} fill="none" stroke={COL.bleu} strokeWidth="3" strokeLinejoin="round"/>}
      {mesures && <g>{mesures.length > 1 && <polyline points={mesures.map(p => `${X(p.VB).toFixed(1)},${Y(p.sigma).toFixed(1)}`).join(' ')} fill="none" stroke="#93c5fd" strokeWidth="1.5"/>}
        {mesures.map(p => <circle key={p.VB} cx={X(p.VB)} cy={Y(p.sigma)} r="4.2" fill={COL.bleu} stroke="#fff" strokeWidth="1"/>)}</g>}
      {marqueur && <g><line x1={X(marqueur.VB)} y1={Y(marqueur.sigma)} x2={X(marqueur.VB)} y2="196" stroke={COL.rouge} strokeWidth="1.5" strokeDasharray="4 3"/><circle cx={X(marqueur.VB)} cy={Y(marqueur.sigma)} r="6" fill={COL.rouge} stroke="#fff" strokeWidth="1.5"/></g>}
    </svg>);
}

// ---------- barres de contribution de chaque ion à σ (exploration et parcours) ----------
export function BarresContribution({ contributions, sigma }) {
  const lignes = contributions.filter(c => c.v > 1e-6);
  const H = 28 + 30 * lignes.length;
  return (
    <svg viewBox={`0 0 400 ${H}`} style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Contribution de chaque ion à la conductivité : ${lignes.map(l => `${l.f} ${fr(l.v, 0)} mS par mètre`).join(', ')} ; total ${fr(sigma, 0)} mS par mètre.`}>
      <text x="8" y="20" fontSize="16" fill={COL.gris}>part de chaque ion dans σ (mS·m⁻¹)</text>
      {lignes.map((l, i) => { const y = 32 + 30 * i, w = sigma > 0 ? 230 * l.v / sigma : 0;
        return <g key={l.id}><text x="8" y={y + 17} fontSize="16" fill={COL.txt}>{l.f}</text>
          <rect x="84" y={y} width={Math.max(w, 2)} height="22" rx="3" fill={l.couleur}/>
          <text x={84 + Math.max(w, 2) + 8} y={y + 17} fontSize="16" fontWeight="700" fill={COL.txt}>{fr(l.v, 0)}</text></g>; })}
    </svg>);
}

// ================= cartes « À retenir » =================
// carte 1 : σ = Σ λ × c
export function SvgKohlrauschCarte() {
  const ions = [['H3O', 'H₃O⁺'], ['HO', 'HO⁻'], ['Cl', 'Cl⁻'], ['Na', 'Na⁺'], ['AcO', 'CH₃COO⁻']];
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Loi de Kohlrausch : la conductivité est la somme des contributions de chaque ion, lambda fois concentration. Conductivités ioniques molaires : H3O+ 35,0 ; HO- 19,9 ; Cl- 7,6 ; Na+ 5,0 ; CH3COO- 4,1 mS mètre carré par mole.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Chaque ion apporte sa part</text>
      {ions.map(([id, f], i) => { const y = 38 + i * 30, w = 6.4 * IONS[id].lambda;
        return <g key={id}><text x="10" y={y + 18} fontSize="16" fontWeight="700" fill={IONS[id].couleur}>{f}</text>
          <rect x="108" y={y} width={w} height="24" rx="3" fill={IONS[id].couleur}/><text x={108 + w + 8} y={y + 18} fontSize="16" fontWeight="700" fill={COL.txt}>{fr(IONS[id].lambda)}</text></g>; })}
      <text x="200" y="214" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt}>σ = Σ λ × c   (somme sur les ions)</text>
      <text x="200" y="238" fontSize="16" textAnchor="middle" fill={COL.txt}>λ en mS·m²·mol⁻¹ ; c en mol·m⁻³</text>
      <text x="200" y="258" fontSize="16" textAnchor="middle" fill={COL.txt}>1 mol/L = 1 000 mol·m⁻³ ; σ en mS·m⁻¹</text>
      <text x="200" y="280" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>H₃O⁺ et HO⁻ : les ions champions</text>
    </svg>);
}

// carte 2 : remplacer un ion par un autre
export function SvgRemplacerCarte() {
  const pt = (x, y, c, s) => <Point x={x} y={y} couleur={c} signe={s}/>;
  const fleche = (x, y1, y2, c) => <g><line x1={x} y1={y1} x2={x} y2={y2 - 8} stroke={c} strokeWidth="3"/><polygon points={`${x - 8},${y2 - 10} ${x + 8},${y2 - 10} ${x},${y2}`} fill={c}/></g>;
  return (
    <svg viewBox="0 0 400 282" style={stl} role="img" aria-label="Avant l’équivalence, un ion H3O+ (35,0) est remplacé par un ion Na+ (5,0) : la conductivité diminue de 30,0 par mole. Après l’équivalence, les ions HO- (19,9) et Na+ (5,0) s’ajoutent sans être consommés : la conductivité augmente de 24,9 par mole.">
      <rect x="6" y="8" width="190" height="198" rx="10" fill="#fef2f2" stroke="#fecaca"/><rect x="204" y="8" width="190" height="198" rx="10" fill="#f0fdf4" stroke="#bbf7d0"/>
      <text x="101" y="32" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>avant l’équivalence</text>
      <text x="299" y="32" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>après l’équivalence</text>
      {pt(40, 62, IONS.H3O.couleur, 1)}<text x="56" y="68" fontSize="17" fontWeight="700" fill={COL.rouge}>H₃O⁺  35,0</text>
      {fleche(40, 78, 112, COL.gris)}<text x="56" y="100" fontSize="16" fill={COL.txt}>remplacé par</text>
      {pt(40, 128, IONS.Na.couleur, 1)}<text x="56" y="134" fontSize="17" fontWeight="700" fill={COL.bleu}>Na⁺  5,0</text>
      <text x="101" y="172" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.rouge}>σ diminue</text><text x="101" y="194" fontSize="16" textAnchor="middle" fill={COL.txt}>perte de 30,0 par mole</text>
      {pt(238, 62, IONS.HO.couleur, -1)}<text x="254" y="68" fontSize="17" fontWeight="700" fill={COL.violet}>HO⁻  19,9</text>
      <text x="238" y="100" fontSize="16" fill={COL.txt}>s’ajoutent, sans</text><text x="238" y="118" fontSize="16" fill={COL.txt}>être consommés</text>
      {pt(238, 134, IONS.Na.couleur, 1)}<text x="254" y="140" fontSize="17" fontWeight="700" fill={COL.bleu}>Na⁺  5,0</text>
      <text x="299" y="172" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>σ augmente</text><text x="299" y="194" fontSize="16" textAnchor="middle" fill={COL.txt}>gain de 24,9 par mole</text>
      <text x="200" y="236" fontSize="16" textAnchor="middle" fill={COL.txt}>un ion est remplacé par un autre :</text>
      <text x="200" y="258" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>seule la différence des λ compte</text>
    </svg>);
}

// carte 3 : la courbe en V
export function SvgCourbeVCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Courbe de titrage conductimétrique d’un acide fort : la conductivité diminue jusqu’à l’équivalence, puis augmente. Le point de rupture de pente repère le volume équivalent.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Deux segments, un point de rupture</text>
      <line x1="40" y1="36" x2="40" y2="190" stroke={COL.txt} strokeWidth="2"/><line x1="40" y1="190" x2="386" y2="190" stroke={COL.txt} strokeWidth="2"/>
      <text x="48" y="54" fontSize="17" fontWeight="700" fill={COL.gris}>σ</text>
      <line x1="56" y1="60" x2="200" y2="156" stroke={COL.rouge} strokeWidth="4"/><line x1="200" y1="156" x2="368" y2="96" stroke={COL.vert} strokeWidth="4"/>
      <line x1="200" y1="156" x2="200" y2="190" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/><circle cx="200" cy="156" r="6" fill={COL.orange}/>
      <text x="200" y="214" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>équivalence</text>
      <text x="386" y="236" fontSize="16" textAnchor="end" fill={COL.gris}>volume de soude versé</text>
      <text x="14" y="258" fontSize="16" fill={COL.rouge}>■ avant : H₃O⁺ est remplacé par Na⁺</text>
      <text x="14" y="278" fontSize="16" fill={COL.vert}>■ après : HO⁻ et Na⁺ s’accumulent</text>
    </svg>);
}

// carte 4 : du volume équivalent à la concentration
export function SvgConcentrationCarte() {
  return (
    <svg viewBox="0 0 400 284" style={stl} role="img" aria-label="À l’équivalence, la quantité d’ions HO- versés est égale à la quantité d’acide de la prise d’essai : concentration de la soude fois volume équivalent égale concentration de l’acide fois volume de la prise d’essai.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>À l’équivalence, quantités égales</text>
      <rect x="10" y="38" width="172" height="104" rx="10" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2"/>
      <rect x="218" y="38" width="172" height="104" rx="10" fill="#fef2f2" stroke="#fecaca" strokeWidth="2"/>
      <text x="96" y="62" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.violet}>soude versée</text><text x="96" y="86" fontSize="16" textAnchor="middle" fill={COL.txt}>c(soude) connue</text>
      <text x="96" y="110" fontSize="16" textAnchor="middle" fill={COL.txt}>volume équivalent</text><text x="96" y="132" fontSize="16" textAnchor="middle" fill={COL.txt}>lu sur la courbe</text>
      <text x="304" y="62" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>acide dosé</text><text x="304" y="86" fontSize="16" textAnchor="middle" fill={COL.txt}>c(acide) cherchée</text>
      <text x="304" y="110" fontSize="16" textAnchor="middle" fill={COL.txt}>volume de la prise</text><text x="304" y="132" fontSize="16" textAnchor="middle" fill={COL.txt}>d’essai connu</text>
      <text x="200" y="102" fontSize="30" fontWeight="700" textAnchor="middle" fill={COL.orange}>=</text>
      <text x="200" y="176" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>c(soude) × V(équivalent)</text>
      <text x="200" y="198" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>= c(acide) × V(prise d’essai)</text>
      <line x1="60" y1="212" x2="340" y2="212" stroke="#cbd5e1"/>
      <text x="200" y="236" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>c(acide) = c(soude) × V(équivalent)</text>
      <text x="200" y="258" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>÷ V(prise d’essai)</text>
    </svg>);
}

// carte 5 : acide fort et acide faible
export function SvgFaibleCarte() {
  return (
    <svg viewBox="0 0 400 296" style={stl} role="img" aria-label="Comparaison des courbes de titrage conductimétrique : l’acide fort donne une courbe en V, l’acide faible donne une courbe qui monte dès le début avec une pente plus forte après l’équivalence.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Acide fort, acide faible</text>
      <line x1="40" y1="36" x2="40" y2="188" stroke={COL.txt} strokeWidth="2"/><line x1="40" y1="188" x2="386" y2="188" stroke={COL.txt} strokeWidth="2"/>
      <text x="48" y="54" fontSize="17" fontWeight="700" fill={COL.gris}>σ</text>
      <polyline points="56,58 190,150 368,98" fill="none" stroke={COL.rouge} strokeWidth="4"/>
      <polyline points="56,168 190,138 368,58" fill="none" stroke={COL.bleu} strokeWidth="4"/>
      <line x1="190" y1="36" x2="190" y2="188" stroke={COL.orange} strokeWidth="2" strokeDasharray="5 4"/>
      <text x="196" y="52" fontSize="16" fontWeight="700" fill={COL.orange}>équivalence</text>
      <text x="386" y="212" fontSize="16" textAnchor="end" fill={COL.gris}>volume de soude versé</text>
      <text x="14" y="238" fontSize="16" fontWeight="700" fill={COL.rouge}>■ acide fort : en V</text>
      <text x="14" y="260" fontSize="16" fontWeight="700" fill={COL.bleu}>■ acide faible : monte dès le début</text>
      <text x="14" y="284" fontSize="16" fill={COL.txt}>dans les deux cas, la rupture repère l’équivalence</text>
    </svg>);
}
