// Schémas de la simulation 138 (Acide faible : α, Ka, pKa, TSTL PCM) : scène (100 molécules, graphe α = f(C₀)) et cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400 (≥ 14 pour la scène), caractères Unicode pour les indices, tout le texte dans le viewBox.
import * as M from './acideFaibleModele';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fond: '#dbeafe', bordBleu: '#93c5fd', fondOr: '#ea580c', bordOr: '#9a3412' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };

// ---------- petite grille de 100 cases (n cases colorées) : pas = pas de la grille, c = côté d'une case ----------
function Cases({ x, y, n, pas, c, rx = 2 }) {
  const out = [];
  for (let i = 0; i < 100; i++) out.push(<rect key={i} x={x + (i % 10) * pas} y={y + Math.floor(i / 10) * pas} width={c} height={c} rx={rx}
    fill={i < n ? COL.fondOr : COL.fond} stroke={i < n ? COL.bordOr : COL.bordBleu}/>);
  return <g>{out}</g>;
}

// ═════════ Scène : 100 molécules d'acide introduites, cases colorées = molécules transformées (α) ═════════
export function GrilleMolecules({ ac, alpha, compte }) {
  const a = M.ACIDES[ac], n = M.nbTransformees(alpha);
  return (
    <svg viewBox="0 0 400 276" style={base} role="img"
      aria-label={compte ? `100 molécules d’acide introduites : ${n} ont réagi avec l’eau, les autres sont restées sous forme ${a.AH}.` : 'Représentation de 100 molécules d’acide introduites : une case colorée a réagi avec l’eau, une case claire est restée sous forme acide.'}>
      <Cases x={10} y={8} n={n} pas={24} c={21} rx={3}/>
      <rect x="266" y="14" width="16" height="16" rx="3" fill={COL.fondOr} stroke={COL.bordOr}/>
      <text x="290" y="27" fontSize="14" fill={COL.encre}>a réagi</text>
      <text x="290" y="45" fontSize="14" fill={COL.encre}>avec l’eau :</text>
      <text x="290" y="63" fontSize="14" fill={COL.encre}>forme</text>
      <text x="290" y="81" fontSize="14" fontWeight="700" fill={COL.orange}>{a.A}</text>
      <rect x="266" y="112" width="16" height="16" rx="3" fill={COL.fond} stroke={COL.bordBleu}/>
      <text x="290" y="125" fontSize="14" fill={COL.encre}>est resté</text>
      <text x="290" y="143" fontSize="14" fill={COL.encre}>sous forme</text>
      <text x="290" y="161" fontSize="14" fontWeight="700" fill={COL.bleu}>{a.AH}</text>
      <text x="10" y="266" fontSize="14" fontWeight={compte ? 700 : 400} fill={compte ? COL.orange : COL.gris}>
        {compte ? (n === 0 ? 'moins d’une molécule sur 100 a réagi' : `${n} molécule${n > 1 ? 's' : ''} sur 100 ${n > 1 ? 'ont' : 'a'} réagi`) : '100 molécules d’acide introduites'}</text>
    </svg>);
}

// ═════════ Scène (exploration) : α en fonction de C₀ pour les acides faibles, repère de la solution choisie ═════════
export function GrapheAlpha({ ac, C }) {
  const X0 = 52, X1 = 384, Y0 = 200, Y1 = 22;
  const lx = c => X0 + (Math.log10(c) + 3) / 2 * (X1 - X0), ly = a => Y0 - a * (Y0 - Y1);
  const pts = id => { const t = []; for (let k = 0; k <= 40; k++) { const c = 10 ** (-3 + 2 * k / 40); t.push(`${lx(c).toFixed(1)},${ly(M.etat(M.ACIDES[id], c).alpha).toFixed(1)}`); } return t.join(' '); };
  const couleurs = { clch2: '#7c3aed', c6h5: '#0369a1', c2h5: '#0f766e', hclo: '#b45309' };
  const act = M.ACIDES[ac], aCourant = M.etat(act, C).alpha;
  return (
    <svg viewBox="0 0 400 262" style={base} role="img"
      aria-label={`Coefficient de dissociation α en fonction de la concentration C₀ (échelle logarithmique) pour quatre acides faibles ; α augmente quand C₀ diminue. Point marqué : ${act.nom}, C₀ = ${String(C).replace('.', ',')} mol par litre.`}>
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={COL.gris} strokeWidth="1.5"/>
      <line x1={X0} y1={Y0} x2={X0} y2={Y1 - 4} stroke={COL.gris} strokeWidth="1.5"/>
      {[0, 0.5, 1].map(a => <g key={a}><line x1={X0 - 4} y1={ly(a)} x2={X1} y2={ly(a)} stroke="#e2e8f0"/><text x={X0 - 7} y={ly(a) + 5} textAnchor="end" fontSize="14" fill={COL.encre}>{a === 0 ? '0' : a === 1 ? '1' : '0,5'}</text></g>)}
      {[[0.001, '0,001'], [0.01, '0,01'], [0.1, '0,1']].map(([c, t]) => <g key={c}><line x1={lx(c)} y1={Y0} x2={lx(c)} y2={Y0 + 5} stroke={COL.gris}/><text x={lx(c)} y={Y0 + 20} textAnchor="middle" fontSize="14" fill={COL.encre}>{t}</text></g>)}
      <text x={(X0 + X1) / 2} y={Y0 + 42} textAnchor="middle" fontSize="14" fill={COL.encre}>C₀ (mol·L⁻¹), échelle logarithmique</text>
      <text x="6" y="14" fontSize="14" fontWeight="700" fill={COL.encre}>α</text>
      {M.FAIBLES.map(id => <polyline key={id} points={pts(id)} fill="none" stroke={couleurs[id]} strokeWidth={id === ac ? 4 : 1.8} opacity={id === ac ? 1 : 0.55} strokeLinejoin="round"/>)}
      {M.FAIBLES.map(id => <text key={id} x={X0 + 16} y={ly(M.etat(M.ACIDES[id], 0.001).alpha) - 9} fontSize="13" fill={couleurs[id]} fontWeight={id === ac ? 800 : 600}>{M.ACIDES[id].AH}</text>)}
      {!act.fort && <circle cx={lx(C)} cy={ly(aCourant)} r="7" fill="white" stroke={COL.orange} strokeWidth="3.5"/>}
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════

// 1. Acide fort / acide faible : on compare le pH mesuré à −log C₀
export function SvgFortFaible() {
  const X = pH => 30 + (pH - 1) * 85;
  return (
    <svg viewBox="0 0 400 214" style={base} role="img"
      aria-label="Axe de pH. À même concentration, l’acide fort a le pH égal à moins log de C zéro (point bleu) ; l’acide faible a un pH plus grand (point orange), car il y a moins d’ions oxonium.">
      <text x={X(2)} y="26" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.bleu}>acide fort</text>
      <text x={X(2)} y="49" textAnchor="middle" fontSize="16" fill={COL.encre}>pH = −log C₀</text>
      <text x={X(3.4)} y="26" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.orange}>acide faible</text>
      <text x={X(3.4)} y="49" textAnchor="middle" fontSize="16" fill={COL.encre}>pH &gt; −log C₀</text>
      <line x1="30" y1="104" x2="372" y2="104" stroke={COL.gris} strokeWidth="2.5"/>
      {[1, 2, 3, 4, 5].map(p => <g key={p}><line x1={X(p)} y1="98" x2={X(p)} y2="110" stroke={COL.gris} strokeWidth="2"/><text x={X(p)} y="132" textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
      <text x="396" y="96" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
      <line x1={X(2)} y1="62" x2={X(2)} y2="96" stroke={COL.bleu} strokeWidth="2.5" strokeDasharray="4 4"/>
      <line x1={X(3.4)} y1="62" x2={X(3.4)} y2="96" stroke={COL.orange} strokeWidth="2.5" strokeDasharray="4 4"/>
      <circle cx={X(2)} cy="104" r="9" fill={COL.bleu}/><circle cx={X(3.4)} cy="104" r="9" fill={COL.orange}/>
      <line x1={X(2) + 14} y1="160" x2={X(3.4) - 8} y2="160" stroke={COL.orange} strokeWidth="3"/>
      <path d={`M ${X(3.4) - 8} 160 l -10 -6 v 12 z`} fill={COL.orange} transform="translate(18 0)"/>
      <text x="200" y="193" textAnchor="middle" fontSize="16" fill={COL.encre}>moins d’ions H₃O⁺ formés : pH plus grand</text>
    </svg>);
}

// 2. Logarithme décimal : pH ↔ [H₃O⁺] et chiffres significatifs (exemple : pH 3,40 ; [H₃O⁺] = 4,0×10⁻⁴ mol/L)
export function SvgLogCS() {
  return (
    <svg viewBox="0 0 400 226" style={base} role="img"
      aria-label="Deux cadres : pH égal 3,40 et concentration en ions oxonium 4,0 fois dix puissance moins 4 mole par litre. On passe de la concentration au pH avec la touche log, du pH à la concentration avec la touche dix puissance x. Deux décimales du pH correspondent à deux chiffres significatifs.">
      <rect x="8" y="8" width="150" height="76" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2.5"/>
      <text x="83" y="32" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>pH</text>
      <text x="83" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill={COL.orange}>3,40</text>
      <rect x="196" y="8" width="196" height="76" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2.5"/>
      <text x="294" y="30" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>[H₃O⁺] en mol·L⁻¹</text>
      <text x="294" y="64" textAnchor="middle" fontSize="24" fontWeight="800" fill={COL.bleu}>4,0 × 10⁻⁴</text>
      <text x="177" y="52" textAnchor="middle" fontSize="26" fill={COL.gris}>⇄</text>
      <text x="14" y="116" fontSize="16" fill={COL.encre}>de [H₃O⁺] vers le pH : touche <tspan fontWeight="800">log</tspan>, puis signe −</text>
      <text x="14" y="142" fontSize="16" fill={COL.encre}>du pH vers [H₃O⁺] : touche <tspan fontWeight="800">10ˣ</tspan> avec −pH</text>
      <rect x="8" y="158" width="384" height="60" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/>
      <text x="200" y="183" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.vert}>2 décimales pour le pH</text>
      <text x="200" y="207" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.vert}>= 2 chiffres significatifs</text>
    </svg>);
}

// 3. Coefficient de dissociation α : part des molécules d'acide qui ont réagi (exemple générique : α = 0,10)
export function SvgAlpha() {
  return (
    <svg viewBox="0 0 400 222" style={base} role="img"
      aria-label="Cent cases : dix sont colorées, ce sont les molécules d’acide qui ont réagi avec l’eau ; le coefficient de dissociation alpha vaut 0,10, soit 10 pour cent.">
      <Cases x={10} y={8} n={10} pas={17} c={15} rx={2}/>
      <rect x="214" y="14" width="16" height="16" rx="3" fill={COL.fondOr} stroke={COL.bordOr}/>
      <text x="238" y="28" fontSize="16" fill={COL.encre}>a réagi</text>
      <rect x="214" y="44" width="16" height="16" rx="3" fill={COL.fond} stroke={COL.bordBleu}/>
      <text x="238" y="58" fontSize="16" fill={COL.encre}>pas réagi</text>
      <text x="214" y="104" fontSize="24" fontWeight="800" fill={COL.orange}>α = 0,10</text>
      <text x="214" y="132" fontSize="16" fill={COL.encre}>10 molécules</text>
      <text x="214" y="154" fontSize="16" fill={COL.encre}>sur 100, soit 10 %</text>
      <rect x="8" y="190" width="384" height="2" fill="#e2e8f0"/>
      <text x="200" y="210" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>α est compris entre 0 et 1 : acide faible ⇒ α &lt; 1</text>
    </svg>);
}

// 4. Dilution : α augmente (deux situations calculées par le modèle)
export function SvgDilution({ c1, c2, a1, a2 }) {
  const t = c => ({ 0.01: '0,010', 0.001: '0,0010' }[c] ?? String(c).replace('.', ','));
  const n1 = M.nbTransformees(a1), n2 = M.nbTransformees(a2);
  return (
    <svg viewBox="0 0 400 236" style={base} role="img"
      aria-label={`Deux grilles de 100 molécules d’acide benzoïque : à C zéro égal ${t(c1)} mole par litre, ${n1} molécules ont réagi ; après dilution par 10, à ${t(c2)} mole par litre, ${n2} ont réagi. Plus l’acide est dilué, plus la part transformée est grande.`}>
      <text x="75" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>C₀ = {t(c1)}</text>
      <text x="325" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>C₀ = {t(c2)}</text>
      <Cases x={15} y={34} n={n1} pas={13} c={11} rx={1.5}/>
      <Cases x={265} y={34} n={n2} pas={13} c={11} rx={1.5}/>
      <text x="75" y="186" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.orange}>{n1} sur 100</text>
      <text x="325" y="186" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.orange}>{n2} sur 100</text>
      <text x="200" y="92" textAnchor="middle" fontSize="16" fill={COL.encre}>on dilue</text>
      <text x="200" y="112" textAnchor="middle" fontSize="16" fill={COL.encre}>10 fois</text>
      <line x1="150" y1="126" x2="238" y2="126" stroke={COL.gris} strokeWidth="3"/>
      <path d="M 252 126 l -14 -8 v 16 z" fill={COL.gris}/>
      <text x="200" y="226" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.vert}>plus dilué ⇒ α plus grand</text>
    </svg>);
}

// 5. Constante d'acidité : produits au numérateur, acide au dénominateur, l'eau n'apparaît pas
export function SvgKa() {
  return (
    <svg viewBox="0 0 400 226" style={base} role="img"
      aria-label="Équation AH plus eau donne A moins plus H3O plus. Dans la constante d’acidité Ka, les concentrations des produits A moins et H3O plus sont au numérateur, celle de l’acide AH est au dénominateur ; l’eau, solvant, n’apparaît pas.">
      <text x="14" y="36" fontSize="19" fontWeight="800" fill={COL.bleu}>AH</text>
      <text x="52" y="36" fontSize="19" fill={COL.encre}>+</text>
      <text x="72" y="36" fontSize="19" fill={COL.gris}>H₂O</text>
      <text x="124" y="36" fontSize="19" fill={COL.encre}>⇌</text>
      <text x="156" y="36" fontSize="19" fontWeight="800" fill={COL.orange}>A⁻</text>
      <text x="196" y="36" fontSize="19" fill={COL.encre}>+</text>
      <text x="216" y="36" fontSize="19" fontWeight="800" fill={COL.orange}>H₃O⁺</text>
      <text x="14" y="66" fontSize="16" fill={COL.bleu}>réactif</text>
      <text x="156" y="66" fontSize="16" fill={COL.orange}>produits</text>
      <text x="40" y="136" fontSize="22" fontWeight="800" fill={COL.encre}>Ka =</text>
      <text x="230" y="124" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.orange}>[A⁻] × [H₃O⁺]</text>
      <line x1="122" y1="138" x2="338" y2="138" stroke={COL.encre} strokeWidth="2.5"/>
      <text x="230" y="168" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.bleu}>[AH]</text>
      <text x="358" y="124" fontSize="16" fill={COL.orange}>haut</text>
      <text x="358" y="168" fontSize="16" fill={COL.bleu}>bas</text>
      <rect x="8" y="186" width="384" height="34" rx="8" fill="#f1f5f9"/>
      <text x="200" y="209" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>l’eau, solvant, n’apparaît pas dans Ka</text>
    </svg>);
}

// 6. Échelle de pKa : pKa petit = acide plus fort (valeurs de la simulation)
export function SvgPKa() {
  const X = p => 24 + (p - 2) * 58;
  const pts = [['ClCH₂COOH', 2.9, 'haut1'], ['C₆H₅COOH', 4.2, 'haut2'], ['C₂H₅COOH', 4.9, 'bas'], ['HClO', 7.5, 'haut1']];
  const yTxt = { haut1: 66, haut2: 96, bas: 182 };
  return (
    <svg viewBox="0 0 400 214" style={base} role="img"
      aria-label="Échelle de pKa de 2 à 8 : l’acide chloroéthanoïque (2,9), l’acide benzoïque (4,2), l’acide propanoïque (4,9) et l’acide hypochloreux (7,5). Plus le pKa est petit, plus l’acide est fort.">
      <text x="10" y="22" fontSize="16" fontWeight="800" fill={COL.vert}>◀ acide plus fort</text>
      <text x="390" y="22" textAnchor="end" fontSize="16" fontWeight="800" fill={COL.rouge}>plus faible ▶</text>
      <line x1={X(2)} y1="128" x2={X(8)} y2="128" stroke={COL.gris} strokeWidth="2.5"/>
      <text x="396" y="112" textAnchor="end" fontSize="16" fontWeight="700" fill={COL.encre}>pKa</text>
      {pts.map(([nom, p, niv]) => { const y = yTxt[niv], haut = niv !== 'bas', cx = Math.min(Math.max(X(p), 72), 330); return (
        <g key={nom}>
          <line x1={X(p)} y1={haut ? y + 6 : 134} x2={X(p)} y2={haut ? 122 : y - 18} stroke={COL.orange} strokeWidth="2" strokeDasharray="3 3"/>
          <circle cx={X(p)} cy="128" r="8" fill={COL.orange}/>
          <text x={cx} y={y} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>{nom} · {String(p).replace('.', ',')}</text>
        </g>); })}
      {[2, 3, 4, 5, 6, 7, 8].map(p => <g key={p}><line x1={X(p)} y1="122" x2={X(p)} y2="134" stroke={COL.gris} strokeWidth="2"/><text stroke="white" strokeWidth="4" paintOrder="stroke" x={X(p)} y="156" textAnchor="middle" fontSize="16" fill={COL.encre}>{p}</text></g>)}
    </svg>);
}
