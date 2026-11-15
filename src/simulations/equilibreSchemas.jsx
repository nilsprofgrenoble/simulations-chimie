// ====================================================
//  Schémas des cartes « À retenir » de la simulation 124 (équilibre chimique : Qr, K, sens d'évolution, taux d'avancement final, niveau TG).
//  Couleurs : bleu = donnée / réactifs, orange = grandeur à repérer (Qr), vert = K / bon, rouge = piège, gris = repère.
//  viewBox de 300 de large : dans une carte sur téléphone de 390 px, le schéma s'affiche vers 260 px, donc police ≥ 14 pour ≥ 11 px rendus.
//  Indices en caractères Unicode, tout le texte DANS le viewBox.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const XR = l => 20 + 260 * (l - -2.5) / 3.7;        // règle logarithmique de 10^-2,5 à 10^1,2 → x de 20 à 280

// ---------- carte 1 : transformation non totale, tous les constituants présents, équilibre dynamique ----------
// mélange 1 : 0,10 mol/L de CH₃COOH et de HCOO⁻ au départ ; état final : 0,076 / 0,076 / 0,024 / 0,024 mol/L (calcul de la 124)
export function SvgNonTotale() {
  const noms = ['CH₃COOH', 'HCOO⁻', 'CH₃COO⁻', 'HCOOH'], ini = [0.10, 0.10, 0, 0], fin = [0.076, 0.076, 0.024, 0.024];
  const H = v => v * 500, base = 150;
  return (
    <svg viewBox="0 0 300 262" style={stl} role="img"
      aria-label="Concentrations avant et après la transformation de 0,10 mol par litre d’acide éthanoïque et d’ions méthanoate. À l’état final, les quatre espèces sont présentes : 0,076 pour les deux réactifs et 0,024 pour les deux produits, en mol par litre. Les deux réactions opposées ont des vitesses égales : équilibre dynamique.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">Transformation non totale</text>
      <text x="8" y="42" fontSize="14" fill={COL.gris}>pointillés : départ</text>
      <text x="8" y="60" fontSize="14" fill="#0f172a">pleins : état final (mol/L)</text>
      <line x1="6" y1={base} x2="294" y2={base} stroke="#94a3b8"/>
      {noms.map((n, i) => { const x = 10 + i * 72; return (
        <g key={n}>
          <rect x={x} y={base - H(ini[i])} width="22" height={H(ini[i])} fill="none" stroke={COL.gris} strokeDasharray="4 3"/>
          <rect x={x + 25} y={base - H(fin[i])} width="22" height={H(fin[i])} fill={i < 2 ? COL.bleu : COL.vert}/>
          <text x={x + 24} y={base + 38} fontSize="14" fontWeight="700" textAnchor="middle" fill={i < 2 ? COL.bleu : COL.vert}>{String(fin[i]).replace('.', ',')}</text>
          <text x={x + 24} y={base + 19} fontSize="14" textAnchor="middle" fill="#0f172a">{n}</text>
        </g>); })}
      <text x="150" y="212" fontSize="15" fontWeight="700" fill={COL.rouge} textAnchor="middle">Aucun réactif ne disparaît.</text>
      <text x="150" y="234" fontSize="14" fill="#0f172a" textAnchor="middle">Équilibre dynamique : deux</text>
      <text x="150" y="252" fontSize="14" fill="#0f172a" textAnchor="middle">réactions de même vitesse</text>
    </svg>);
}

// ---------- carte 2 : critère d'évolution Qr comparé à K ----------
export function SvgCritere() {
  const xK = XR(-1), xQ = XR(Math.log10(0.25));
  return (
    <svg viewBox="0 0 300 220" style={stl} role="img"
      aria-label="Règle graduée en puissances de dix. À gauche de K, Qr est inférieur à K et le système évolue dans le sens direct, vers la droite. À droite de K, Qr est supérieur à K et le système évolue dans le sens inverse, vers la gauche. Exemple : Qr égale 0,25 est supérieur à K égale 0,10 : sens inverse.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">Qr cherche à rejoindre K</text>
      <line x1="20" y1="80" x2="280" y2="80" stroke="#475569" strokeWidth="2"/>
      <line x1={xK} y1="58" x2={xK} y2="102" stroke={COL.vert} strokeWidth="3"/>
      <text x={xK} y="50" fontSize="16" fontWeight="700" fill={COL.vert} textAnchor="middle">K</text>
      <circle cx={xQ} cy="80" r="7" fill={COL.orange} stroke="#0f172a"/>
      <text x={xQ + 10} y="122" fontSize="14" fontWeight="700" fill={COL.orange} textAnchor="middle">Qr = 0,25</text>
      <path d={`M${xK - 60},150 L${xK - 12},150`} stroke={COL.bleu} strokeWidth="3.5" fill="none"/>
      <polygon points={`${xK - 4},150 ${xK - 14},144 ${xK - 14},156`} fill={COL.bleu}/>
      <text x={xK - 40} y="176" fontSize="14" fontWeight="700" fill={COL.bleu} textAnchor="middle">Qr &lt; K</text>
      <text x={xK - 40} y="194" fontSize="14" fill="#0f172a" textAnchor="middle">sens direct</text>
      <path d={`M${xK + 100},150 L${xK + 12},150`} stroke={COL.orange} strokeWidth="3.5" fill="none"/>
      <polygon points={`${xK + 6},150 ${xK + 16},144 ${xK + 16},156`} fill={COL.orange}/>
      <text x={xK + 58} y="176" fontSize="14" fontWeight="700" fill={COL.orange} textAnchor="middle">Qr &gt; K</text>
      <text x={xK + 58} y="194" fontSize="14" fill="#0f172a" textAnchor="middle">sens inverse</text>
      <text x="150" y="214" fontSize="14" fill={COL.gris} textAnchor="middle">échelle logarithmique</text>
    </svg>);
}

// ---------- carte 3 : à l'état final, Qr = K quelle que soit la composition initiale ----------
export function SvgQrFinal() {
  const xK = XR(-1), pts = [0.01, 0.25, 4];
  return (
    <svg viewBox="0 0 300 220" style={stl} role="img"
      aria-label="Règle graduée en puissances de dix. Trois mélanges ont des quotients de réaction initiaux différents : 0,01, 0,25 et 4,0. Dans chaque cas le système évolue jusqu’à Qr égale K, égale 0,10 : le quotient de réaction final est le même.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">À l’état final : Qr = K</text>
      <line x1="20" y1="104" x2="280" y2="104" stroke="#475569" strokeWidth="2"/>
      {[-2, -1, 0, 1].map(l => <g key={l}><line x1={XR(l)} y1="98" x2={XR(l)} y2="110" stroke="#475569"/><text x={XR(l)} y="128" fontSize="14" textAnchor="middle" fill="#334155">{String(10 ** l).replace('.', ',')}</text></g>)}
      <line x1={xK} y1="50" x2={xK} y2="118" stroke={COL.vert} strokeWidth="3"/>
      <text x={xK} y="44" fontSize="16" fontWeight="700" fill={COL.vert} textAnchor="middle">K</text>
      {pts.map(q => { const x = XR(Math.log10(q)), droite = x > xK; return (
        <g key={q}>
          <path d={`M${x + (droite ? -8 : 8)},80 L${xK + (droite ? 10 : -10)},80`} stroke={COL.orange} strokeWidth="2.5" fill="none" strokeDasharray="5 3"/>
          <circle cx={x} cy="80" r="6" fill={COL.orange} stroke="#0f172a"/>
          <text x={x + (q === 0.25 ? 12 : 0)} y="66" fontSize="14" fontWeight="700" fill={COL.orange} textAnchor="middle">{String(q).replace('.', ',')}{q === 4 ? ',0' : ''}</text>
        </g>); })}
      <text x="150" y="160" fontSize="14" fill="#0f172a" textAnchor="middle">3 mélanges de départ différents,</text>
      <text x="150" y="180" fontSize="14" fontWeight="700" fill={COL.vert} textAnchor="middle">le même Qr final : K (à T donnée)</text>
      <text x="150" y="208" fontSize="14" fill={COL.gris} textAnchor="middle">orange : Qr au départ</text>
    </svg>);
}

// ---------- carte 4 : taux d'avancement final, transformation totale ou non ----------
export function SvgTaux() {
  return (
    <svg viewBox="0 0 300 222" style={stl} role="img"
      aria-label="Deux barres de taux d’avancement final. Transformation non totale : tau égale 0,24, la barre est remplie au quart environ. Transformation totale : tau égale 1, la barre est pleine et un réactif a disparu.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill="#0f172a" textAnchor="middle">Taux d’avancement final τ</text>
      <text x="10" y="50" fontSize="15" fontWeight="700" fill={COL.bleu}>Non totale</text>
      <rect x="10" y="58" width="280" height="26" fill="#f1f5f9" stroke="#94a3b8"/>
      <rect x="10" y="58" width={280 * 0.24} height="26" fill={COL.bleu}/>
      <text x={10 + 280 * 0.24 + 8} y="77" fontSize="15" fontWeight="700" fill="#0f172a">τ = 0,24</text>
      <text x="10" y="106" fontSize="14" fill="#0f172a">τ &lt; 1 : tous les constituants sont</text>
      <text x="10" y="124" fontSize="14" fill="#0f172a">présents</text>
      <text x="10" y="152" fontSize="15" fontWeight="700" fill={COL.vert}>Totale</text>
      <rect x="10" y="160" width="280" height="26" fill={COL.vert}/>
      <text x="282" y="179" fontSize="15" fontWeight="700" fill="white" textAnchor="end">τ = 1</text>
      <text x="10" y="210" fontSize="14" fill="#0f172a">τ = 1 : le réactif limitant a disparu</text>
    </svg>);
}
