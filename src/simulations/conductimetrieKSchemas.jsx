// ====================================================
//  Schémas de la simulation 256 (constante d'équilibre d'un acide faible par conductimétrie, niveau TSTL).
//  Scène animée : bécher agité avec une cellule de conductimétrie ; 60 molécules d'acide introduites (HA, dessinées comme de petits haltères gris),
//  dont une petite part a réagi : paires d'ions H₃O⁺ (rouge) et A⁻ (vert). L'agitation thermique fait vibrer légèrement les entités (SMIL).
//  Couleurs : gris = molécule HA, rouge = H₃O⁺, vert = A⁻, bleu = donnée, orange = grandeur à repérer.
//  Scène : viewBox de 400, textes de 13 à 18. Cartes « À retenir » : viewBox de 400, police ≥ 16.
// ====================================================
import { ACIDES, N_ENTITES, nbPaires } from './conductimetrieKModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a', oxo: '#dc2626', base: '#15803d' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ---------- emplacements (ordre mélangé fixe : une entité ne change pas de place quand le nombre de paires change) ----------
const SLOTS = (() => {
  const s = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) s.push([32 + c * 15.5 + (r % 2 ? 7 : 0), 178 + r * 15]);
  let g = 23; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();

const Ion = ({ x, y, couleur, signe, r }) => { const a = r * 0.5, w = Math.max(1.4, r * 0.29);
  return (<g><circle cx={x} cy={y} r={r} fill={couleur} stroke="#fff" strokeWidth="0.8"/>
    <line x1={x - a} y1={y} x2={x + a} y2={y} stroke="#fff" strokeWidth={w}/>{signe > 0 && <line x1={x} y1={y - a} x2={x} y2={y + a} stroke="#fff" strokeWidth={w}/>}</g>); };
const Mol = ({ x, y, r = 5.4 }) => (<g><circle cx={x} cy={y} r={r} fill="#e2e8f0" stroke="#64748b" strokeWidth="1.4"/><circle cx={x + r * 0.95} cy={y - r * 0.7} r={r * 0.5} fill="#fff" stroke="#64748b" strokeWidth="1.2"/></g>);
const Cadre = ({ actif, x, y, w, h }) => (actif ? <rect x={x} y={y} width={w} height={h} rx="8" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="7 5"/> : null);
const Vib = ({ k, anime, children }) => (anime ? <g>{children}<animateTransform attributeName="transform" type="translate" values={`0 0; ${((k * 7) % 5) - 2} ${((k * 3) % 5) - 2}; ${((k * 5) % 5) - 2} ${((k * 11) % 5) - 2}; 0 0`} dur={`${(1.1 + (k % 7) * 0.17).toFixed(2)}s`} repeatCount="indefinite"/></g> : <g>{children}</g>);

// ---------- scène : bécher, cellule, conductimètre ----------
//  acide : id dans ACIDES ; c : concentration apportée (mol/L) ; lecture : texte du conductimètre (null : « — — — ») ; montrer : { equation, ions, cellule } ; hl(id) : encadrés orange
export function SceneAcide({ acide, c, lecture = null, anime = true, montrer = {}, hl = () => false }) {
  const { equation = true, ions = true, cellule = true } = montrer;
  const A = ACIDES[acide], p = nbPaires(acide, c), nMol = N_ENTITES - p;
  const eq = `${A.f} + H₂O ⇌ ${A.base} + H₃O⁺`;
  const items = [];
  if (ions) {
    for (let i = 0; i < nMol; i++) items.push({ k: 'm' + i, p: SLOTS[i], t: 'm' });
    for (let i = 0; i < p; i++) { items.push({ k: 'h' + i, p: SLOTS[N_ENTITES + 2 * i], t: 'h' }); items.push({ k: 'a' + i, p: SLOTS[N_ENTITES + 2 * i + 1], t: 'a' }); }
  }
  const cTxt = `${Number(c).toLocaleString('fr-FR', { maximumSignificantDigits: 3 })} mol/L`;
  return (
    <svg viewBox={cellule || equation ? "0 0 400 360" : "0 110 400 250"} style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Bécher contenant une solution de ${A.nom} de concentration ${cTxt}, avec une cellule de conductimétrie reliée à un conductimètre.${ions ? ` Sur ${N_ENTITES} molécules d’acide introduites, ${p} ont réagi : on voit ${p} ions oxonium et ${p} ions ${A.base}.` : ''}${equation ? ` Équation de la réaction : ${eq}.` : ''}`}>
      {equation && <g>
        <rect x="14" y="4" width="372" height="30" rx="8" fill="#f5f3ff" stroke="#c4b5fd" strokeWidth="2"/>
        <text x="200" y="25" fontSize={eq.length > 28 ? 16 : 18} fontWeight="700" textAnchor="middle" fill={COL.txt}>{eq}</text></g>}
      {/* conductimètre et cellule */}
      {cellule && <g>
        <rect x="266" y="46" width="128" height="60" rx="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="2"/>
        <rect x="274" y="52" width="112" height="28" rx="4" fill="#0f172a"/>
        <text x="330" y="73" fontSize="18" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="monospace">{lecture || '— — —'}</text>
        <text x="330" y="98" fontSize="14" textAnchor="middle" fill={COL.txt}>conductimètre</text>
        <path d="M266 82 Q240 90 229 130" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="222" y="128" width="14" height="110" rx="3" fill="#e2e8f0" stroke="#475569" strokeWidth="2"/>
        <rect x="225" y="218" width="3" height="24" fill="#94a3b8"/><rect x="230" y="218" width="3" height="24" fill="#94a3b8"/>
        <text x="300" y="150" fontSize="14" fill={COL.txt}>cellule</text>
        <line x1="296" y1="146" x2="240" y2="158" stroke="#94a3b8" strokeDasharray="3 3"/></g>}
      {/* acide et concentration */}
      <g>
        <text x="266" y="196" fontSize="14" fill={COL.gris}>solution de</text>
        <text x="266" y="216" fontSize="14" fontWeight="700" fill={COL.txt}>{A.nom}</text>
        <text x="266" y="236" fontSize="15" fontWeight="700" fill={COL.bleu}>{A.f}</text>
        <text x="266" y="258" fontSize="15" fontWeight="700" fill={COL.txt}>c = {cTxt}</text>
      </g>
      {/* bécher */}
      <path d="M16 156 L16 302 Q16 308 22 308 L246 308 Q252 308 252 302 L252 156" fill="none" stroke="#475569" strokeWidth="3"/>
      <path d="M19 166 L19 302 Q19 305 22 305 L246 305 Q249 305 249 302 L249 166 Z" fill="#dbeafe" opacity="0.7"/>
      {/* molécules et ions */}
      {items.map((d, i) => (
        <Vib key={d.k} k={i} anime={anime}>
          {d.t === 'm' ? <Mol x={d.p[0]} y={d.p[1]} r={5.2}/> : d.t === 'h' ? <Ion x={d.p[0]} y={d.p[1]} couleur={COL.oxo} signe={1} r={5.8}/> : <Ion x={d.p[0]} y={d.p[1]} couleur={COL.base} signe={-1} r={6.8}/>}
        </Vib>))}
      {/* agitateur magnétique */}
      <rect x="110" y="296" width="24" height="6" rx="3" fill="#fff" stroke="#64748b" strokeWidth="1.5">
        {anime && <animateTransform attributeName="transform" type="rotate" from="0 122 299" to="360 122 299" dur="0.9s" repeatCount="indefinite"/>}</rect>
      <rect x="10" y="310" width="248" height="16" rx="5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5"/>
      <text x="134" y="322" fontSize="13" textAnchor="middle" fill={COL.txt}>agitateur magnétique</text>
      {/* légende */}
      {ions && <g fontSize="14" fill={COL.txt}>
        <Mol x={20} y={348} r={5.2}/><text x="36" y="353">{A.f}</text>
        <Ion x={134} y={348} couleur={COL.oxo} signe={1} r={6}/><text x="146" y="353">H₃O⁺</text>
        <Ion x={218} y={348} couleur={COL.base} signe={-1} r={7}/><text x="231" y="353">{A.base}</text></g>}
      <Cadre actif={hl('becher')} x={10} y={150} w={248} h={164}/>
      <Cadre actif={hl('cellule')} x={216} y={122} w={26} h={122}/>
      <Cadre actif={hl('lecture')} x={262} y={42} w={136} h={68}/>
      <Cadre actif={hl('equation')} x={10} y={0} w={380} h={38}/>
    </svg>);
}

// ---------- carte 1 : deux ions, en nombres égaux ----------
export function SvgEquilibreCarte() {
  const Ia = [[44, 112], [84, 150], [58, 178]];
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Quelques molécules d’un acide faible HA ont réagi avec l’eau : elles ont donné autant d’ions H3O+ que d’ions A-. La plupart des molécules HA n’ont pas réagi. Équation : HA + H2O en équilibre avec A- + H3O+.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Deux ions, en nombres égaux</text>
      <rect x="10" y="36" width="214" height="168" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2"/>
      {[[34, 70], [70, 62], [112, 74], [150, 64], [188, 72], [48, 100], [128, 104], [172, 108], [100, 132], [196, 140], [150, 164], [64, 196], [114, 192], [178, 188]].map(([x, y], i) => <Mol key={i} x={x} y={y} r={8}/>)}
      <Ion x={46} y={140} couleur={COL.oxo} signe={1} r={9}/><Ion x={72} y={158} couleur={COL.base} signe={-1} r={11}/>
      <Ion x={140} y={142} couleur={COL.oxo} signe={1} r={9}/><Ion x={166} y={160} couleur={COL.base} signe={-1} r={11}/>
      <text x="314" y="84" fontSize="16" textAnchor="middle" fill={COL.txt}>presque toutes</text><text x="314" y="106" fontSize="16" textAnchor="middle" fill={COL.txt}>les molécules HA</text><text x="314" y="128" fontSize="16" textAnchor="middle" fill={COL.txt}>n’ont pas réagi</text>
      <text x="314" y="166" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>un H₃O⁺ formé</text><text x="314" y="188" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>pour un A⁻ formé</text>
      <text x="200" y="232" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>HA + H₂O ⇌ A⁻ + H₃O⁺</text>
      <text x="200" y="262" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>Réaction limitée : peu d’ions formés</text>
    </svg>);
}

// ---------- carte 2 : de σ à [H₃O⁺] ----------
export function SvgSigmaXCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Chaîne de calcul : la conductivité σ en mS par mètre est divisée par la somme des conductivités ioniques molaires de H3O+ et de A- ; on obtient la concentration en mol par mètre cube, puis on divise par 1000 pour l’avoir en mol par litre. Exemple générique : σ de 20 divisé par 40 donne 0,50 mol par mètre cube, soit 5,0 fois 10 puissance moins 4 mol par litre.">
      <defs><marker id="sx-fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill={COL.txt}/></marker></defs>
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>De σ à [H₃O⁺]</text>
      <rect x="14" y="38" width="108" height="48" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2"/><text x="68" y="60" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.bleu}>σ</text><text x="68" y="78" fontSize="15" textAnchor="middle" fill={COL.txt}>mS·m⁻¹</text>
      <path d="M126 62 L162 62" stroke={COL.txt} strokeWidth="2.4" markerEnd="url(#sx-fl)"/>
      <text x="144" y="52" fontSize="16" textAnchor="middle" fill={COL.orange} fontWeight="700">÷</text>
      <rect x="166" y="38" width="220" height="48" rx="10" fill="#fff7ed" stroke="#fdba74" strokeWidth="2"/><text x="276" y="58" fontSize="16" textAnchor="middle" fill={COL.orange} fontWeight="700">λ(H₃O⁺) + λ(A⁻)</text><text x="276" y="77" fontSize="15" textAnchor="middle" fill={COL.txt}>mS·m²·mol⁻¹</text>
      <rect x="14" y="118" width="172" height="48" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="2"/><text x="100" y="140" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>[H₃O⁺]</text><text x="100" y="158" fontSize="15" textAnchor="middle" fill={COL.txt}>en mol·m⁻³</text>
      <path d="M200 142 L232 142" stroke={COL.txt} strokeWidth="2.4" markerEnd="url(#sx-fl)"/>
      <text x="216" y="132" fontSize="16" textAnchor="middle" fill={COL.orange} fontWeight="700">÷ 1 000</text>
      <rect x="240" y="118" width="146" height="48" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="2"/><text x="313" y="140" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>[H₃O⁺]</text><text x="313" y="158" fontSize="15" textAnchor="middle" fill={COL.txt}>en mol/L</text>
      <path d="M100 90 L100 112" stroke={COL.txt} strokeWidth="2.4" markerEnd="url(#sx-fl)"/>
      <text x="200" y="198" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>Exemple : σ = 20 et λ(H₃O⁺) + λ(A⁻) = 40</text>
      <text x="200" y="224" fontSize="16" textAnchor="middle" fill={COL.txt}>20 / 40 = 0,50 mol·m⁻³ = 5,0×10⁻⁴ mol/L</text>
      <text x="200" y="260" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>Toujours convertir en mol/L à la fin</text>
    </svg>);
}

// ---------- carte 3 : tableau d'avancement et K ----------
export function SvgTableauKCarte() {
  const cell = (x, y, w, t, o = {}) => (<g><rect x={x} y={y} width={w} height="34" fill={o.f || '#fff'} stroke="#cbd5e1" strokeWidth="1.6"/><text x={x + w / 2} y={y + 23} fontSize="16" fontWeight={o.b ? 700 : 400} textAnchor="middle" fill={o.c || COL.txt}>{t}</text></g>);
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Tableau d’avancement en concentrations : au départ HA vaut c, A- et H3O+ valent 0 ; à l’équilibre HA vaut c moins x, A- et H3O+ valent x. La constante est K égale x au carré divisé par c moins x.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Tableau d’avancement et K</text>
      {cell(10, 38, 130, '', { f: '#f1f5f9' })}{cell(140, 38, 80, 'HA', { b: 1, f: '#f1f5f9' })}{cell(220, 38, 80, 'A⁻', { b: 1, f: '#f1f5f9', c: COL.vert })}{cell(300, 38, 90, 'H₃O⁺', { b: 1, f: '#f1f5f9', c: COL.rouge })}
      {cell(10, 72, 130, 'au départ')}{cell(140, 72, 80, 'c')}{cell(220, 72, 80, '0')}{cell(300, 72, 90, '0')}
      {cell(10, 106, 130, 'à l’équilibre', { b: 1 })}{cell(140, 106, 80, 'c − x', { b: 1, c: COL.bleu })}{cell(220, 106, 80, 'x', { b: 1, c: COL.vert })}{cell(300, 106, 90, 'x', { b: 1, c: COL.rouge })}
      <text x="200" y="176" fontSize="16" textAnchor="middle" fill={COL.txt}>(concentrations en mol/L ; x = [H₃O⁺] à l’équilibre)</text>
      <rect x="70" y="192" width="260" height="46" rx="10" fill="#fff7ed" stroke="#fdba74" strokeWidth="2"/>
      <text x="200" y="222" fontSize="20" fontWeight="700" textAnchor="middle" fill={COL.orange}>K = x² / (c − x)</text>
      <text x="200" y="266" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>c − x, x, x : les trois cases à lire</text>
    </svg>);
}

// ---------- carte 4 : taux d'avancement final ----------
export function SvgTauCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Taux d’avancement final : pour un acide fort, toutes les molécules ont réagi, la barre est pleine ; pour un acide faible, seule une petite partie a réagi, la barre est peu remplie. Le taux d’avancement est x divisé par c.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Taux d’avancement final</text>
      <text x="14" y="66" fontSize="16" fontWeight="700" fill={COL.txt}>acide fort</text>
      <rect x="14" y="76" width="372" height="34" rx="8" fill="#fee2e2" stroke="#fca5a5" strokeWidth="2"/><text x="200" y="99" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>tout a réagi : τ = 1</text>
      <text x="14" y="150" fontSize="16" fontWeight="700" fill={COL.txt}>acide faible</text>
      <rect x="14" y="160" width="372" height="34" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/><rect x="14" y="160" width="84" height="34" rx="8" fill="#fca5a5"/><text x="116" y="183" fontSize="16" fill={COL.txt}>reste : HA non dissocié</text>
      <text x="56" y="183" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>τ</text>
      <rect x="80" y="210" width="240" height="40" rx="10" fill="#fff7ed" stroke="#fdba74" strokeWidth="2"/><text x="200" y="237" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.orange}>τ = x / c = [H₃O⁺] / c</text>
      <text x="200" y="274" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>τ : la part qui a réagi</text>
    </svg>);
}

// ---------- carte 5 : K constante, τ varie ----------
export function SvgKconstanteCarte() {
  const bec = (x, titre, p, nm) => (
    <g key={x}>
      <path d={`M${x} 64 L${x} 170 Q${x} 176 ${x + 6} 176 L${x + 126} 176 Q${x + 132} 176 ${x + 132} 170 L${x + 132} 64`} fill="#dbeafe" fillOpacity="0.6" stroke="#475569" strokeWidth="2.6"/>
      {Array.from({ length: nm }).map((_, i) => <Mol key={i} x={x + 18 + (i % 5) * 24 + (Math.floor(i / 5) % 2) * 10} y={92 + Math.floor(i / 5) * 20} r={6.4}/>)}
      {Array.from({ length: p }).map((_, i) => <g key={i}><Ion x={x + 26 + i * 36} y={158} couleur={COL.oxo} signe={1} r={7}/><Ion x={x + 44 + i * 36} y={158} couleur={COL.base} signe={-1} r={8}/></g>)}
      <text x={x + 66} y="58" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>{titre}</text>
    </g>);
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Deux béchers : à gauche une solution concentrée où peu de molécules ont réagi (taux d’avancement petit), à droite une solution diluée où une plus grande part a réagi (taux plus grand). Entre les deux, K est le même.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>K ne bouge pas, τ si</text>
      {bec(14, 'c grande', 1, 13)}{bec(254, 'c petite', 3, 9)}
      <text x="200" y="100" fontSize="22" fontWeight="700" textAnchor="middle" fill={COL.orange}>K</text><text x="200" y="124" fontSize="22" fontWeight="700" textAnchor="middle" fill={COL.orange}>=</text><text x="200" y="148" fontSize="22" fontWeight="700" textAnchor="middle" fill={COL.orange}>K</text>
      <text x="80" y="204" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>τ petit</text><text x="320" y="204" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.rouge}>τ plus grand</text>
      <text x="200" y="238" fontSize="16" textAnchor="middle" fill={COL.txt}>on dilue : une plus grande part réagit</text>
      <text x="200" y="266" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>K ne dépend que de la température</text>
    </svg>);
}
