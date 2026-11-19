// ====================================================
//  Schémas des cartes « À retenir » de la simulation « Combustions » (1G, sim 159).
//  viewBox de 300 de large (≈ 230 px sur téléphone, facteur 0,77) : textes de 15 à 17 (≥ 11 px rendus sur téléphone) ; plafonnés à 320 px (maxWidth).
//  Couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège / énergie à fournir.
// ====================================================
import * as C from "./combustionModele";
import { COL } from "./combustionDessin";
import { Fleche } from "./combustionFleche";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const nbf1 = v => Number(v).toFixed(1).replace('.', ',');

// ---------- carte 1 : combustible, comburant, combustion complète ou incomplète ----------
export function SvgCombustion() {
  return (
    <svg viewBox="0 0 300 268" style={stl} role="img"
      aria-label="Un combustible et un comburant, le dioxygène de l’air, réagissent en libérant de l’énergie. Combustion complète : assez de dioxygène, produits CO2 et H2O, flamme bleue. Combustion incomplète : manque de dioxygène, produits carbone C (suie), monoxyde de carbone CO et H2O, flamme jaune. Piège : le CO est toxique, incolore et inodore.">
      <rect x="6" y="6" width="288" height="44" rx="10" fill="#eff6ff" stroke={COL.bleu} />
      <text x="150" y="26" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.bleu}>combustible + comburant (O₂)</text>
      <text x="150" y="43" fontSize="15" textAnchor="middle" fill={COL.gris}>butane, bois… + dioxygène de l’air</text>
      <Fleche x1={150} y1={54} x2={150} y2={72} c={COL.gris} w={2.2} t={8} />
      <rect x="6" y="76" width="140" height="124" rx="10" fill="#f0fdf4" stroke={COL.vert} />
      <text x="76" y="96" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.vert}>COMPLÈTE</text>
      <text x="76" y="115" fontSize="15" textAnchor="middle" fill={COL.encre}>assez de O₂</text>
      <text x="76" y="140" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.encre}>CO₂ + H₂O</text>
      <text x="76" y="165" fontSize="15" textAnchor="middle" fill={COL.encre}>flamme bleue</text>
      <text x="76" y="184" fontSize="15" textAnchor="middle" fill={COL.encre}>pas de suie</text>
      <rect x="154" y="76" width="140" height="124" rx="10" fill="#fef2f2" stroke={COL.rouge} />
      <text x="224" y="96" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>INCOMPLÈTE</text>
      <text x="224" y="115" fontSize="15" textAnchor="middle" fill={COL.encre}>manque de O₂</text>
      <text x="224" y="136" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.encre}>C (suie), CO</text>
      <text x="224" y="153" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.encre}>et H₂O</text>
      <text x="224" y="177" fontSize="15" textAnchor="middle" fill={COL.encre}>flamme jaune</text>
      <text x="224" y="194" fontSize="15" textAnchor="middle" fill={COL.encre}>suie noire</text>
      <rect x="6" y="208" width="288" height="54" rx="10" fill="#fef2f2" stroke={COL.rouge} />
      <text x="150" y="229" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : le CO est toxique,</text>
      <text x="150" y="248" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>incolore et inodore</text>
    </svg>);
}

// ---------- carte 2 : équilibrer l'équation (C, H, puis O) ----------
export function SvgEquilibrer() {
  return (
    <svg viewBox="0 0 300 262" style={stl} role="img"
      aria-label="Équilibrer une combustion dans l’ordre C, H puis O. Exemple du propane : C3H8 + 5 O2 donne 3 CO2 + 4 H2O. Carbone : 3 atomes donc 3 CO2. Hydrogène : 8 atomes donc 4 H2O. Oxygène : 6 plus 4 égale 10 atomes donc 5 O2. Piège pour un alcool : son atome d’oxygène compte, éthanol : 3 O2 (pas 3 et demi).">
      <rect x="6" y="6" width="288" height="40" rx="10" fill="#eff6ff" stroke={COL.bleu} />
      <text x="150" y="32" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O</text>
      {[['1', 'C', '3 atomes', '3 CO₂'], ['2', 'H', '8 atomes', '4 H₂O'], ['3', 'O', '6 + 4 = 10', '5 O₂']].map(([n, a, d, r], i) => (
        <g key={n} transform={`translate(0 ${58 + i * 40})`}>
          <circle cx="24" cy="18" r="13" fill={COL.orange} /><text x="24" y="23" fontSize="15" fontWeight="700" textAnchor="middle" fill="white">{n}</text>
          <text x="48" y="23" fontSize="15" fontWeight="700" fill={COL.encre}>{a} : {d}</text>
          <text x="288" y="23" fontSize="15" fontWeight="700" textAnchor="end" fill={COL.vert}>{r}</text>
        </g>))}
      <text x="150" y="190" fontSize="15" textAnchor="middle" fill={COL.gris}>l’oxygène se fait en dernier</text>
      <rect x="6" y="200" width="288" height="56" rx="10" fill="#fef2f2" stroke={COL.rouge} />
      <text x="150" y="220" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : l’O d’un alcool compte</text>
      <text x="150" y="240" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>C₂H₅OH + 3 O₂ (pas 3½)</text>
    </svg>);
}

// ---------- carte 3 : rompre coûte, former rapporte ----------
export function SvgRompreFormer() {
  const at = (x, y, e = 'O') => <g><circle cx={x} cy={y} r="12" fill="#fca5a5" stroke="#334155" /><text x={x} y={y + 5} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.encre}>{e}</text></g>;
  const dbl = (x1, x2, y) => <g stroke="#475569" strokeWidth="3" strokeLinecap="round"><line x1={x1} y1={y - 3} x2={x2} y2={y - 3} /><line x1={x1} y1={y + 3} x2={x2} y2={y + 3} /></g>;
  return (
    <svg viewBox="0 0 300 284" style={stl} role="img"
      aria-label="Rompre une liaison demande de l’énergie : la molécule O2 se sépare en deux atomes, énergie fournie, D positive. Former une liaison libère de l’énergie : deux atomes O se lient en O2, énergie libérée. Moyen mnémotechnique : rompre, je paie ; former, je gagne. Piège : D est l’énergie d’une liaison, E r est celle de la réaction entière.">
      <rect x="6" y="6" width="140" height="124" rx="10" fill="#fef2f2" stroke={COL.rouge} />
      <text x="76" y="26" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>ROMPRE</text>
      {dbl(64, 88, 62)}{at(58, 62)}{at(94, 62)}
      <Fleche x1={76} y1={102} x2={76} y2={82} c={COL.rouge} w={2.4} t={9} />
      <text x="76" y="118" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>énergie fournie</text>
      <rect x="154" y="6" width="140" height="124" rx="10" fill="#f0fdf4" stroke={COL.vert} />
      <text x="224" y="26" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.vert}>FORMER</text>
      {at(196, 62)}{at(252, 62)}
      <Fleche x1={224} y1={82} x2={224} y2={102} c={COL.vert} w={2.4} t={9} />
      <text x="224" y="118" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.vert}>énergie libérée</text>
      <rect x="6" y="140" width="288" height="52" rx="10" fill="#fffbeb" stroke={COL.orange} />
      <text x="150" y="162" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.orange}>Rompre : je paie</text>
      <text x="150" y="182" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.orange}>Former : je gagne</text>
      <text x="150" y="217" fontSize="15" textAnchor="middle" fill={COL.encre}>D(A–B) &gt; 0 : énergie pour rompre</text>
      <rect x="6" y="232" width="288" height="46" rx="10" fill="#fef2f2" stroke={COL.rouge} />
      <text x="150" y="251" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : D = une liaison,</text>
      <text x="150" y="269" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>E<tspan dy="4" fontSize="12">r</tspan><tspan dy="-4"> = toute la réaction</tspan></text>
    </svg>);
}

// ---------- carte 4 : signe de E_r, exothermique ou endothermique ----------
export function SvgSigne() {
  const sous = (t) => <tspan dy="4" fontSize="12">{t}</tspan>;
  const panneau = (x0, exo) => {
    const haut = exo ? 'réactifs' : 'produits', bas = exo ? 'produits' : 'réactifs';
    const cH = exo ? COL.bleu : COL.orange, cB = exo ? COL.orange : COL.bleu, cF = exo ? COL.vert : COL.gris;
    return (
      <g transform={`translate(${x0} 0)`}>
        <rect x="6" y="6" width="140" height="170" rx="10" fill={exo ? '#f0fdf4' : '#f8fafc'} stroke={cF} />
        <text x="76" y="30" fontSize="15" fontWeight="700" textAnchor="middle" fill={cF}>E{sous('r')}<tspan dy="-4"> {exo ? '< 0' : '> 0'}</tspan></text>
        <line x1={exo ? 16 : 86} y1="70" x2={exo ? 66 : 136} y2="70" stroke={cH} strokeWidth="3.4" strokeLinecap="round" />
        <text x={exo ? 16 : 136} y="60" fontSize="15" textAnchor={exo ? 'start' : 'end'} fill={cH}>{haut}</text>
        <line x1={exo ? 86 : 16} y1="118" x2={exo ? 136 : 66} y2="118" stroke={cB} strokeWidth="3.4" strokeLinecap="round" />
        <text x={exo ? 136 : 16} y="140" fontSize="15" textAnchor={exo ? 'end' : 'start'} fill={cB}>{bas}</text>
        {exo ? <Fleche x1={76} y1={72} x2={76} y2={116} c={cF} w={2.4} t={9} /> : <Fleche x1={76} y1={116} x2={76} y2={72} c={cF} w={2.4} t={9} />}
        <text x="76" y="166" fontSize="15" fontWeight="700" textAnchor="middle" fill={cF}>{exo ? 'exothermique' : 'endothermique'}</text>
      </g>);
  };
  return (
    <svg viewBox="0 0 300 296" style={stl} role="img"
      aria-label="Deux schémas de niveaux d’énergie. À gauche, les produits sont plus bas que les réactifs : E r négative, réaction exothermique, une combustion chauffe. À droite, les produits sont plus hauts : E r positive, réaction endothermique. Piège : les énergies de liaison sont des moyennes, donc le résultat est une estimation proche de la valeur mesurée, à quelques pour cent près.">
      {panneau(0, true)}{panneau(148, false)}
      <text x="150" y="204" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.encre}>Une combustion chauffe : E{sous('r')}<tspan dy="-4"> &lt; 0</tspan></text>
      <rect x="6" y="216" width="288" height="72" rx="10" fill="#fef2f2" stroke={COL.rouge} />
      <text x="150" y="238" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>Piège : D = moyennes tabulées,</text>
      <text x="150" y="257" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>le résultat est une estimation</text>
      <text x="150" y="276" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.rouge}>(écart de quelques %)</text>
    </svg>);
}

// ---------- carte 5 : pouvoir calorifique (valeurs du modèle) ----------
export function SvgPouvoir() {
  const L = C.COMBUSTIBLES.map(x => ({ x, v: C.pouvoirCalorifique(x) })), vmax = 55;
  return (
    <svg viewBox="0 0 300 286" style={stl} role="img"
      aria-label={`Pouvoir calorifique estimé en mégajoules par kilogramme : ${L.map(({ x, v }) => `${x.nom} ${nbf1(v)}`).join(', ')}. Sur ces valeurs, les alcanes libèrent plus d’énergie par kilogramme que les alcools ; à vérifier en exploration.`}>
      {L.map(({ x, v }, i) => {
        const y = 4 + i * 26;
        return (
          <g key={x.id}>
            <text x="90" y={y + 17} fontSize="15" textAnchor="end" fill={COL.encre}>{x.nom}</text>
            <rect x="96" y={y + 3} width={v / vmax * 140} height="19" rx="3" fill={x.type === 'alcool' ? COL.orange : COL.bleu} />
            <text x={96 + v / vmax * 140 + 5} y={y + 17} fontSize="15" fontWeight="700" fill={COL.encre}>{nbf1(v)}{x.type === 'alcool' ? ' (alcool)' : ''}</text>
          </g>);
      })}
      <text x="10" y="206" fontSize="15" fill={COL.gris}>bleu : alcane · orange : alcool</text>
      <text x="10" y="223" fontSize="15" fill={COL.gris}>valeurs en MJ/kg</text>
      <rect x="6" y="232" width="288" height="48" rx="10" fill="#fffbeb" stroke={COL.orange} />
      <text x="150" y="251" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.orange}>À comparer : alcanes et alcools</text>
      <text x="150" y="269" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.orange}>(à vérifier en exploration)</text>
    </svg>);
}
