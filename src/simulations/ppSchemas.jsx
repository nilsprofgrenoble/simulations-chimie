// ====================================================
//  Schémas de la simulation 216 (premier principe ; niveau TG).
//  Scènes : viewBox de 420 de large, textes ≥ 17. Graphe : viewBox 400 × 300, textes ≥ 16. Cartes : viewBox de 320, textes ≥ 15,5.
//  Coordonnées numériques. Public daltonien : jamais la couleur seule (valeurs écrites, sens des flèches, étiquettes).
//  Q et W sont des énergies (grandeurs scalaires, en joules) : pas de notation vectorielle.
// ====================================================
const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', gris: '#475569', txt: '#0f172a', clair: '#cbd5e1', paroi: '#334155' };
const HALO = { stroke: '#fff', strokeWidth: 3.5, paintOrder: 'stroke' };
const SVG_STYLE = { width: '100%', maxWidth: 480, display: 'block', margin: '0 auto' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const Tx = ({ x, y, children, c = COL.txt, s = 18, w = 700, ancre = 'start', halo = true }) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={ancre} {...(halo ? HALO : {})}>{children}</text>);
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 3, tete = 9 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1);
  if (L < 1) return null;
  const bx = x2 - (tete - 2) * Math.cos(a), by = y2 - (tete - 2) * Math.sin(a);
  return (<g><line x1={x1} y1={y1} x2={bx} y2={by} stroke={c} strokeWidth={w}/>
    <polygon points={`${x2},${y2} ${x2 - tete * Math.cos(a - 0.42)},${y2 - tete * Math.sin(a - 0.42)} ${x2 - tete * Math.cos(a + 0.42)},${y2 - tete * Math.sin(a + 0.42)}`} fill={c}/></g>);
};
const kJ = J => `${J >= 0 ? '+' : '−'}${nbf(Math.abs(J) / 1000, 1)} kJ`;
const epais = J => 3 + Math.min(5, Math.abs(J) / 8000);

// Bécher (liquide ou solide) avec plaque chauffante, pale et thermomètre.
// montre : { T, Q, W, noms } ; Q et W en joules (reçus : > 0), T en °C. Sans valeur donnée : flèches seulement si montre.Q / montre.W vrais.
export function SceneSysteme({ nom = 'eau', T, Q = 0, W = 0, montre = {}, aria }) {
  const liquide = nom !== 'cuivre' && nom !== 'aluminium';
  const fond = nom === 'eau' ? '#bae6fd' : nom === 'huile' ? '#fde68a' : '#fed7aa';
  const hT = T == null ? 0.5 : Math.max(0, Math.min(1, (T - 0) / 100));
  return (
    <svg viewBox="0 0 420 300" role="img" aria-label={aria || `Un récipient contient ${nom}. Il repose sur une plaque chauffante qui peut transférer de l’énergie par chaleur Q ; une pale peut brasser et transférer de l’énergie par travail W. Un thermomètre indique la température${T != null ? ` : ${nbf(T, 1)} °C` : ''}.`} style={SVG_STYLE}>
      <rect x={96} y={78} width={178} height={148} rx={10} fill="none" stroke={COL.bleu} strokeWidth={3} strokeDasharray="8 6"/>
      <Tx x={104} y={72} s={17} c={COL.bleu}>système : {nom}</Tx>
      <rect x={110} y={100} width={150} height={118} fill={liquide ? fond : '#fdba74'} stroke={COL.paroi} strokeWidth={4}/>
      {liquide && <line x1={110} y1={100} x2={260} y2={100} stroke={COL.paroi} strokeWidth={3}/>}
      {montre.W && !liquide && <g>
        <Fleche x1={334} y1={160} x2={266} y2={160} c={COL.vert} w={epais(W)} tete={14}/>
        <Tx x={300} y={186} ancre="middle" c={COL.vert}>W{W !== 0 ? ` = ${kJ(W)}` : ''}</Tx>
      </g>}
      {montre.W && liquide && <g>
        <line x1={228} y1={34} x2={228} y2={192} stroke={COL.gris} strokeWidth={5}/>
        <rect x={203} y={186} width={50} height={9} fill={COL.gris}/>
        <path d="M 135 150 A 50 22 0 0 1 235 150" fill="none" stroke={COL.vert} strokeWidth={epais(W)}/>
        <polygon points="235,150 223,140 225,156" fill={COL.vert}/>
        <Tx x={180} y={122} ancre="middle" c={COL.vert}>W{W !== 0 ? ` = ${kJ(W)}` : ''}</Tx>
      </g>}
      <rect x={84} y={226} width={202} height={22} fill="#64748b" stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={185} y={243} ancre="middle" s={17} c="#fff" halo={false}>plaque chauffante</Tx>
      {montre.Q && <g>
        <Fleche x1={60} y1={Q >= 0 ? 270 : 214} x2={60} y2={Q >= 0 ? 214 : 270} c={COL.rouge} w={epais(Q)} tete={14}/>
        <Tx x={14} y={292} c={COL.rouge}>Q{Q !== 0 ? ` = ${kJ(Q)}` : ''}</Tx>
      </g>}
      {montre.T && T != null && <g>
        <rect x={352} y={60} width={14} height={170} rx={7} fill="#fff" stroke={COL.paroi} strokeWidth={3}/>
        <rect x={355} y={226 - 160 * hT} width={8} height={160 * hT} fill={COL.rouge}/>
        <circle cx={359} cy={240} r={14} fill={COL.rouge} stroke={COL.paroi} strokeWidth={3}/>
        <Tx x={359} y={282} ancre="middle">{nbf(T, 1)} °C</Tx>
      </g>}
    </svg>);
}

// Deux corps en contact (étape « sens du transfert thermique ») : aucun sens dessiné.
export function SceneBlocs({ T1, T2, aria }) {
  return (
    <svg viewBox="0 0 420 220" role="img" aria-label={aria || `Un bloc de cuivre à ${T1} °C est plongé dans de l’eau à ${T2} °C ; l’ensemble est isolé de l’extérieur.`} style={SVG_STYLE}>
      <rect x={60} y={60} width={300} height={130} rx={8} fill="#bae6fd" stroke={COL.paroi} strokeWidth={4}/>
      <rect x={150} y={95} width={120} height={70} fill="#c2410c" stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={210} y={137} ancre="middle" c="#fff" halo={false}>cuivre</Tx>
      <Tx x={210} y={82} ancre="middle" s={17} c={COL.bleu}>eau</Tx>
      <Tx x={210} y={40} ancre="middle" s={19} c={COL.orange}>cuivre à {T1} °C</Tx>
      <Tx x={210} y={212} ancre="middle" s={19} c={COL.bleu}>eau à {T2} °C</Tx>
    </svg>);
}

// Graphe en barres : W, Q et ΔU (en kJ), échelle commune. ΔU = W + Q.
export function GrapheBilan({ W, Q, dU }) {
  const vals = [W, Q, dU].map(x => x / 1000), M = Math.max(10, Math.ceil(Math.max(...vals.map(Math.abs)) / 10) * 10), y0 = 150, k = 110 / M;
  const barres = [['W', vals[0], COL.vert], ['Q', vals[1], COL.rouge], ['ΔU', vals[2], COL.bleu]];
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={`Trois barres : travail reçu W = ${nbf(vals[0], 1)} kJ, transfert thermique reçu Q = ${nbf(vals[1], 1)} kJ, et variation d’énergie interne ΔU = ${nbf(vals[2], 1)} kJ, somme des deux premières.`} style={SVG_STYLE}>
      <line x1={54} y1={20} x2={54} y2={280} stroke={COL.paroi} strokeWidth={3}/>
      <line x1={50} y1={y0} x2={390} y2={y0} stroke={COL.paroi} strokeWidth={3}/>
      <Tx x={6} y={16} s={16} halo={false}>kJ</Tx>
      {[M, 0, -M].map(v => <g key={v}><line x1={48} y1={y0 - v * k} x2={60} y2={y0 - v * k} stroke={COL.paroi} strokeWidth={3}/><Tx x={44} y={y0 - v * k + 6} s={16} ancre="end">{nbf(v, 0)}</Tx></g>)}
      {barres.map(([nom, v, c], i) => {
        const x = 90 + i * 100, h = Math.abs(v) * k, y = v >= 0 ? y0 - h : y0;
        return (<g key={nom}>
          <rect x={x} y={y} width={64} height={Math.max(h, 1.5)} fill={c} fillOpacity={nom === 'ΔU' ? 1 : 0.8} stroke={COL.paroi} strokeWidth={2}/>
          <Tx x={x + 32} y={v >= 0 ? y - 8 : y + h + 22} ancre="middle" s={17}>{v >= 0 ? '+' : '−'}{nbf(Math.abs(v), 1)}</Tx>
          <Tx x={x + 32} y={v >= 0 ? y0 + 22 : y0 - 8} ancre="middle" s={18} c={c}>{nom}</Tx>
        </g>);
      })}
    </svg>);
}

// ---------- cartes « À retenir » (viewBox 320) ----------
const SvgCarte = ({ h, aria, children }) => <svg viewBox={`0 0 320 ${h}`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>{children}</svg>;
const Mol = ({ x, y, r = 6 }) => <circle cx={x} cy={y} r={r} fill="#7dd3fc" stroke={COL.bleu} strokeWidth={2}/>;

export function SvgCarteU() {
  return (
    <SvgCarte h={250} aria="L’énergie interne d’un système est la somme de l’énergie cinétique microscopique due à l’agitation des molécules et de l’énergie potentielle due à leurs interactions. Elle ne contient pas l’énergie cinétique du système entier en mouvement, qui est macroscopique.">
      <Tx x={160} y={22} ancre="middle" s={16.5}>Énergie interne U</Tx>
      <rect x={14} y={36} width={150} height={120} fill="#f1f5f9" stroke={COL.paroi} strokeWidth={3}/>
      {[[40, 62, 62, 52], [90, 70, 112, 82], [60, 110, 40, 134], [118, 118, 100, 146], [138, 64, 150, 50]].map(([x, y, x2, y2], k) => <g key={k}><Mol x={x} y={y}/><Fleche x1={x} y1={y} x2={x2} y2={y2} c={COL.orange} w={2.5} tete={7}/></g>)}
      <line x1={46} y1={134} x2={86} y2={134} stroke={COL.rouge} strokeWidth={2.5} strokeDasharray="4 4"/>
      <Mol x={40} y={134}/><Mol x={92} y={134}/>
      <Tx x={174} y={74} s={16} c={COL.orange}>agitation</Tx><Tx x={174} y={94} s={16} w={600} c={COL.gris}>énergie cinétique</Tx>
      <Tx x={174} y={128} s={16} c={COL.rouge}>interactions</Tx><Tx x={174} y={148} s={16} w={600} c={COL.gris}>énergie potentielle</Tx>
      <line x1={12} y1={174} x2={308} y2={174} stroke={COL.clair} strokeWidth={2}/>
      <Tx x={160} y={202} ancre="middle" s={16}>U = Ec micro + Ep interactions</Tx>
      <Tx x={160} y={228} ancre="middle" s={15.5} c={COL.gris} w={600}>mouvement d’ensemble : hors de U</Tx>
    </SvgCarte>);
}

export function SvgCarteTransferts() {
  return (
    <SvgCarte h={286} aria="Trois idées : le transfert thermique va spontanément du corps le plus chaud vers le corps le plus froid ; il a lieu par conduction, convection ou rayonnement ; le travail est un transfert d’énergie par une force qui déplace, comme une pale qui brasse ou un piston qui comprime.">
      <rect x={14} y={14} width={90} height={50} fill="#fed7aa" stroke={COL.paroi} strokeWidth={3}/><Tx x={59} y={46} ancre="middle" s={17} halo={false}>chaud</Tx>
      <rect x={216} y={14} width={90} height={50} fill="#bae6fd" stroke={COL.paroi} strokeWidth={3}/><Tx x={261} y={46} ancre="middle" s={17} halo={false}>froid</Tx>
      <Fleche x1={112} y1={39} x2={208} y2={39} c={COL.rouge} w={5} tete={14}/>
      <Tx x={160} y={30} ancre="middle" s={16.5} c={COL.rouge}>Q</Tx>
      <Tx x={160} y={92} ancre="middle" s={16}>Q va du chaud vers le froid</Tx>
      <line x1={12} y1={110} x2={308} y2={110} stroke={COL.clair} strokeWidth={2}/>
      <Tx x={14} y={138} s={16.5} c={COL.rouge}>Q : transfert thermique</Tx>
      <Tx x={14} y={160} s={16} w={600} c={COL.gris}>conduction, convection, rayonnement</Tx>
      <Tx x={14} y={178} s={16} w={600} c={COL.gris}>(écart de température)</Tx>
      <line x1={12} y1={192} x2={308} y2={192} stroke={COL.clair} strokeWidth={2}/>
      <Tx x={14} y={220} s={16.5} c={COL.vert}>W : travail</Tx>
      <Tx x={14} y={242} s={16} w={600} c={COL.gris}>une force qui déplace (pale, piston)</Tx>
      <Tx x={14} y={262} s={16} w={600} c={COL.gris}>(reçu : W positif)</Tx>
    </SvgCarte>);
}

export function SvgCartePrincipe() {
  return (
    <SvgCarte h={262} aria="Le premier principe : la variation d’énergie interne du système est égale au travail W plus le transfert thermique Q reçus. Une énergie reçue est comptée positivement, une énergie cédée négativement.">
      <rect x={100} y={60} width={120} height={80} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={3}/>
      <Tx x={160} y={96} ancre="middle" c={COL.bleu} s={17} halo={false}>système</Tx><Tx x={160} y={118} ancre="middle" c={COL.bleu} s={16} halo={false}>ΔU</Tx>
      <Fleche x1={14} y1={80} x2={94} y2={80} c={COL.rouge} w={4.5} tete={12}/><Tx x={54} y={70} ancre="middle" s={17} c={COL.rouge}>Q</Tx>
      <Fleche x1={14} y1={124} x2={94} y2={124} c={COL.vert} w={4.5} tete={12}/><Tx x={54} y={150} ancre="middle" s={17} c={COL.vert}>W</Tx>
      <Tx x={160} y={30} ancre="middle" s={16}>extérieur : plaque, pale, air…</Tx>
      <rect x={10} y={168} width={300} height={44} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={160} y={198} ancre="middle" s={24} c={COL.bleu} halo={false}>ΔU = W + Q</Tx>
      <Tx x={160} y={236} ancre="middle" s={16} w={600}>reçue : positive · cédée : négative</Tx>
    </SvgCarte>);
}

export function SvgCarteC() {
  return (
    <SvgCarte h={286} aria="Pour un système incompressible, la variation d’énergie interne est égale à la capacité thermique C multipliée par la variation de température. C vaut la masse m multipliée par la capacité thermique massique c. Valeurs de c : eau 4180, huile 2000, aluminium 900, cuivre 385 joules par kilogramme et par kelvin.">
      <rect x={10} y={10} width={300} height={44} rx={10} fill="#eff6ff" stroke={COL.bleu} strokeWidth={2.5}/>
      <Tx x={160} y={40} ancre="middle" s={24} c={COL.bleu} halo={false}>ΔU = C × ΔT</Tx>
      <Tx x={160} y={84} ancre="middle" s={17}>C = m × c  (en J·K⁻¹)</Tx>
      <Tx x={160} y={108} ancre="middle" s={16} w={600} c={COL.gris}>ΔT en K ou en °C : même écart</Tx>
      <line x1={12} y1={122} x2={308} y2={122} stroke={COL.clair} strokeWidth={2}/>
      <Tx x={160} y={146} ancre="middle" s={16}>c en J·kg⁻¹·K⁻¹ (donnée)</Tx>
      {[['eau', 4180], ['huile alimentaire', 2000], ['aluminium', 900], ['cuivre', 385]].map(([nom, c], k) => (<g key={nom}>
        <Tx x={22} y={176 + 26 * k} s={16.5} w={600}>{nom}</Tx><Tx x={298} y={176 + 26 * k} ancre="end" s={16.5} c={COL.bleu}>{c}</Tx></g>))}
      <Tx x={160} y={280} ancre="middle" s={15.5} c={COL.gris} w={600}>valeurs usuelles arrondies</Tx>
    </SvgCarte>);
}

export function SvgCarteBilan() {
  const etapes = [['1', 'Choisir le système'], ['2', 'Lister W et Q (signes !)'], ['3', 'Écrire ΔU = W + Q'], ['4', 'ΔU = C × ΔT, donc ΔT']];
  return (
    <SvgCarte h={262} aria="Méthode de bilan d’énergie en quatre étapes : choisir le système, lister les transferts W et Q reçus avec leurs signes, écrire ΔU égale W plus Q, puis ΔU égale C fois ΔT pour trouver la variation de température.">
      <Tx x={160} y={22} ancre="middle" s={16.5}>Méthode du bilan d’énergie</Tx>
      {etapes.map(([n, t], k) => (<g key={n}>
        <circle cx={30} cy={62 + 52 * k} r={16} fill={COL.bleu}/><Tx x={30} y={68 + 52 * k} ancre="middle" c="#fff" halo={false} s={17}>{n}</Tx>
        <Tx x={58} y={68 + 52 * k} s={16.5}>{t}</Tx></g>))}
    </SvgCarte>);
}
