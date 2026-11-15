// ====================================================
//  Schémas des cartes « À retenir » de la simulation 123 (radioactivité : décroissance, demi-vie, activité, datation, niveau TG).
//  Couleurs : bleu = donnée / courbe, orange = grandeur à repérer, vert = bon, rouge = piège, gris = repère.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0' };
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const Sub = ({ children }) => <tspan baselineShift="sub" fontSize="0.75em">{children}</tspan>;

// ---------- carte 1 : hasard pour un noyau, régularité pour un grand nombre ----------
// fraction restante à t½ : moyenne 50 % ; écart-type √(N/4) : 5 noyaux sur 100 (5 points de pourcentage), 50 sur 10 000 (0,5 point)
export function SvgGrandsNombres() {
  const X = p => 30 + (p - 40) * 17;   // 40 % → 30 ; 60 % → 370
  return (
    <svg viewBox="0 0 400 214" style={stl} role="img"
      aria-label="Pourcentage de noyaux restants après une demi-vie. Avec 100 noyaux, le résultat varie d’un essai à l’autre, typiquement 50 pour cent plus ou moins 5 points. Avec 10 000 noyaux, il varie beaucoup moins : 50 pour cent plus ou moins 0,5 point.">
      <text x="16" y="24" fontSize="13" fontWeight="700" fill="#0f172a">Après une demi-vie, pourcentage de noyaux restants</text>
      <line x1={X(50)} y1="34" x2={X(50)} y2="150" stroke={COL.gris} strokeDasharray="4 3"/>
      <text x="16" y="56" fontSize="12.5" fill="#0f172a">100 noyaux</text>
      <rect x={X(45)} y="62" width={X(55) - X(45)} height="16" rx="3" fill={COL.orange} opacity="0.9"/>
      <text x={X(55) + 6} y="75" fontSize="12.5" fontWeight="700" fill={COL.orange}>50 % ± 5 points</text>
      <text x="16" y="108" fontSize="12.5" fill="#0f172a">10 000 noyaux</text>
      <rect x={X(49.5)} y="114" width={X(50.5) - X(49.5)} height="16" rx="3" fill={COL.vert}/>
      <text x={X(50.5) + 8} y="127" fontSize="12.5" fontWeight="700" fill={COL.vert}>50 % ± 0,5 point</text>
      <line x1="30" y1="150" x2="370" y2="150" stroke="#94a3b8"/>
      {[40, 45, 50, 55, 60].map(p => <g key={p}><line x1={X(p)} y1="150" x2={X(p)} y2="155" stroke="#94a3b8"/><text x={X(p)} y="169" fontSize="11.5" textAnchor="middle" fill="#334155">{p}</text></g>)}
      <text x="200" y="196" fontSize="12.5" fontWeight="700" fill="#0f172a" textAnchor="middle">Un noyau : hasard. Beaucoup de noyaux : loi.</text>
    </svg>);
}

// ---------- carte 2 : loi de décroissance et demi-vie ----------
export function SvgLoi() {
  const X = u => 56 + u * 100, Y = f => 160 - 120 * f;       // u en nombre de demi-vies (0 à 3), f = N / N0
  const courbe = Array.from({ length: 61 }, (_, i) => { const u = i * 0.05; return `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(Math.pow(0.5, u)).toFixed(1)}`; }).join('');
  const niv = [[1, 'N₀'], [0.5, 'N₀/2'], [0.25, 'N₀/4'], [0.125, 'N₀/8']];
  return (
    <svg viewBox="0 0 400 226" style={stl} role="img"
      aria-label="Courbe de décroissance exponentielle du nombre de noyaux. Il reste N zéro sur 2 après une demi-vie, N zéro sur 4 après deux demi-vies, N zéro sur 8 après trois demi-vies : à chaque demi-vie, le nombre de noyaux est divisé par 2.">
      <line x1="56" y1="160" x2="372" y2="160" stroke="#94a3b8"/><line x1="56" y1="26" x2="56" y2="160" stroke="#94a3b8"/>
      {niv.map(([f, l], i) => <g key={l}>
        <line x1="56" y1={Y(f)} x2={X(i)} y2={Y(f)} stroke={COL.gris} strokeDasharray="4 3"/>
        <line x1={X(i)} y1={Y(f)} x2={X(i)} y2="160" stroke={COL.gris} strokeDasharray="4 3"/>
        <text x="50" y={Y(f) + 4} fontSize="11.5" textAnchor="end" fill="#334155">{l}</text>
        <circle cx={X(i)} cy={Y(f)} r="4.5" fill={COL.orange}/>
        <text x={X(i)} y="177" fontSize="11.5" textAnchor="middle" fill="#334155">{i === 0 ? '0' : i === 1 ? 't½' : `${i} t½`}</text></g>)}
      <path d={courbe} fill="none" stroke={COL.bleu} strokeWidth="2.4"/>
      <text x="360" y="198" fontSize="11.5" textAnchor="end" fill="#334155">temps t</text>
      <text x="232" y="62" fontSize="13" fontWeight="700" fill={COL.bleu}>N(t) = N₀ e<tspan baselineShift="super" fontSize="0.75em">−λt</tspan></text>
      <text x="232" y="86" fontSize="13" fontWeight="700" fill={COL.orange}>t<Sub>½</Sub> = ln 2 / λ</text>
      <text x="200" y="218" fontSize="12.5" fontWeight="700" fill={COL.rouge} textAnchor="middle">Après 2 t½ : il reste ¼, pas zéro !</text>
    </svg>);
}

// ---------- carte 3 : activité ----------
export function SvgActivite() {
  const barres = [['0', 40, '40 Bq'], ['8 j', 20, '20 Bq'], ['16 j', 10, '10 Bq'], ['24 j', 5, '5 Bq']];
  return (
    <svg viewBox="0 0 400 214" style={stl} role="img"
      aria-label="Diagramme en barres de l’activité d’un échantillon d’iode 131 : 40 becquerels à l’instant zéro, 20 après 8 jours, 10 après 16 jours, 5 après 24 jours. À chaque demi-vie, l’activité est divisée par 2.">
      <text x="200" y="22" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">A = λ · N, en becquerel (1 Bq = 1 désintégration par seconde)</text>
      <line x1="30" y1="170" x2="380" y2="170" stroke="#94a3b8"/>
      {barres.map(([x, a, l], i) => { const h = a * 3, cx = 74 + i * 86; return (
        <g key={x}><rect x={cx - 24} y={170 - h} width="48" height={h} rx="3" fill={COL.bleu} opacity={1 - 0.15 * i}/>
          <text x={cx} y={164 - h} fontSize="12.5" fontWeight="700" fill={COL.orange} textAnchor="middle">{l}</text>
          <text x={cx} y="188" fontSize="12" textAnchor="middle" fill="#334155">{x}</text></g>); })}
      {[0, 1, 2].map(i => <text key={i} x={117 + i * 86} y="52" fontSize="13" fontWeight="700" fill={COL.vert} textAnchor="middle">÷ 2</text>)}
      <text x="200" y="207" fontSize="12.5" fontWeight="700" fill="#0f172a" textAnchor="middle">A suit N : divisée par 2 à chaque demi-vie</text>
    </svg>);
}

// ---------- carte 4 : mesurer une activité par comptage ----------
// A ≈ 40,1 Bq : n ≈ 40 (1 s), 401 (10 s), 2 407 (60 s) ; u(n) = √n ; u(n)/n = 1/√n = 16 %, 5 %, 2 %
export function SvgComptage() {
  const lignes = [['1 s', 'n ≈ 40', 16], ['10 s', 'n ≈ 400', 5], ['60 s', 'n ≈ 2 400', 2]];
  return (
    <svg viewBox="0 0 400 214" style={stl} role="img"
      aria-label="Comptage de désintégrations pour une activité d’environ 40 becquerels. Compter pendant 1 seconde donne environ 40 désintégrations, avec une incertitude relative d’environ 16 pour cent. 10 secondes : environ 400, soit 5 pour cent. 60 secondes : environ 2 400, soit 2 pour cent.">
      <text x="200" y="22" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">A ≈ n / Δt, avec n désintégrations comptées</text>
      <text x="22" y="48" fontSize="11.5" fill="#334155">durée Δt</text><text x="86" y="48" fontSize="11.5" fill="#334155">compté</text><text x="170" y="48" fontSize="11.5" fill="#334155">écart relatif ≈ 1/√n</text>
      {lignes.map(([d, n, r], i) => { const y = 66 + i * 38; return (
        <g key={d}><text x="22" y={y + 14} fontSize="13" fontWeight="700" fill="#0f172a">{d}</text><text x="86" y={y + 14} fontSize="12.5" fill="#334155">{n}</text>
          <rect x="170" y={y} width={r * 8} height="18" rx="3" fill={r > 10 ? COL.rouge : r > 3 ? COL.orange : COL.vert}/>
          <text x={176 + r * 8} y={y + 14} fontSize="12.5" fontWeight="700" fill="#0f172a">{r} %</text></g>); })}
      <text x="200" y="196" fontSize="12.5" fontWeight="700" fill={COL.vert} textAnchor="middle">Compter plus longtemps : n plus grand, écart plus faible</text>
    </svg>);
}

// ---------- carte 5 : datation ----------
export function SvgDatation() {
  const col = [['vivant', '100 %', 1], ['5 730 ans', '50 %', 0.5], ['11 460 ans', '25 %', 0.25], ['17 190 ans', '12,5 %', 0.125]];
  return (
    <svg viewBox="0 0 400 220" style={stl} role="img"
      aria-label="Principe de la datation au carbone 14. Un organisme vivant contient 100 pour cent de la teneur en carbone 14. Après sa mort, cette teneur est divisée par 2 tous les 5 730 ans : 50 pour cent, 25 pour cent, 12,5 pour cent. La fraction restante donne l’âge.">
      <text x="200" y="22" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">Carbone 14 restant depuis la mort</text>
      <line x1="24" y1="150" x2="380" y2="150" stroke="#94a3b8"/>
      {col.map(([t, p, f], i) => { const cx = 62 + i * 92, h = 90 * f; return (
        <g key={t}><rect x={cx - 26} y="60" width="52" height="90" fill="white" stroke="#94a3b8"/><rect x={cx - 26} y={150 - h} width="52" height={h} fill={i ? COL.bleu : COL.vert} opacity="0.85"/>
          <text x={cx} y="54" fontSize="12.5" fontWeight="700" fill={COL.orange} textAnchor="middle">{p}</text>
          <text x={cx} y="168" fontSize="11.5" textAnchor="middle" fill="#334155">{t}</text></g>); })}
      <text x="200" y="192" fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">âge = (t<Sub>½</Sub> / ln 2) × ln(N₀ / N)</text>
      <text x="200" y="212" fontSize="12" fill={COL.rouge} textAnchor="middle">À retenir : teneur de départ supposée connue</text>
    </svg>);
}
