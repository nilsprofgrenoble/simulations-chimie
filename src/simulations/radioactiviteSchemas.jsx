// ====================================================
//  Schémas des cartes « À retenir » de la simulation « Radioactivité » (TG), textes ≥ 16 unités du viewBox (≥ 9 px sur téléphone).
//  Couleurs : bleu = donnée / courbe, orange = grandeur à repérer, vert = bon, rouge = piège, gris = repère.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', clair: '#e2e8f0' };
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ---------- carte 1 : hasard pour un noyau, régularité pour un grand nombre ----------
// fraction restante à t½ : moyenne 50 % ; écart-type √(N/4) : 5 noyaux sur 100 (5 points de pourcentage), 50 sur 10 000 (0,5 point)
export function SvgGrandsNombres() {
  const X = p => 30 + (p - 40) * 17;   // 40 % → 30 ; 60 % → 370
  return (
    <svg viewBox="0 0 400 224" style={stl} role="img"
      aria-label="Pourcentage de noyaux restants après une demi-vie. Avec 100 noyaux, le résultat varie d’un essai à l’autre, typiquement 50 pour cent plus ou moins 5 points. Avec 10 000 noyaux, il varie beaucoup moins : 50 pour cent plus ou moins 0,5 point.">
      <text x="200" y="24" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">Noyaux restants après une demi-vie</text>
      <line x1={X(50)} y1="36" x2={X(50)} y2="158" stroke={COL.gris} strokeDasharray="4 3"/>
      <text x="16" y="60" fontSize="16" fontWeight="700" fill={COL.orange}>100 noyaux : 50 % ± 5 points</text>
      <rect x={X(45)} y="68" width={X(55) - X(45)} height="18" rx="3" fill={COL.orange} opacity="0.9"/>
      <text x="16" y="116" fontSize="16" fontWeight="700" fill={COL.vert}>10 000 noyaux : 50 % ± 0,5 point</text>
      <rect x={X(49.5)} y="124" width={X(50.5) - X(49.5)} height="18" rx="3" fill={COL.vert}/>
      <line x1="30" y1="158" x2="370" y2="158" stroke="#94a3b8"/>
      {[40, 45, 50, 55, 60].map(p => <g key={p}><line x1={X(p)} y1="158" x2={X(p)} y2="163" stroke="#94a3b8"/><text x={X(p)} y="182" fontSize="16" textAnchor="middle" fill="#334155">{p}</text></g>)}
      <text x="200" y="212" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">Un noyau : hasard. Beaucoup : loi.</text>
    </svg>);
}

// ---------- carte 2 : loi de décroissance et demi-vie ----------
export function SvgLoi() {
  const X = u => 64 + u * 98, Y = f => 160 - 120 * f;       // u en nombre de demi-vies (0 à 3), f = N / N0
  const courbe = Array.from({ length: 61 }, (_, i) => { const u = i * 0.05; return `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(Math.pow(0.5, u)).toFixed(1)}`; }).join('');
  const niv = [[1, 'N₀'], [0.5, 'N₀/2'], [0.25, 'N₀/4'], [0.125, 'N₀/8']];
  return (
    <svg viewBox="0 0 400 234" style={stl} role="img"
      aria-label="Courbe de décroissance exponentielle du nombre de noyaux. Il reste N zéro sur 2 après une demi-vie, N zéro sur 4 après deux demi-vies, N zéro sur 8 après trois demi-vies : à chaque demi-vie, le nombre de noyaux est divisé par 2.">
      <line x1="64" y1="160" x2="380" y2="160" stroke="#94a3b8"/><line x1="64" y1="26" x2="64" y2="160" stroke="#94a3b8"/>
      {niv.map(([f, l], i) => <g key={l}>
        <line x1="64" y1={Y(f)} x2={X(i)} y2={Y(f)} stroke={COL.gris} strokeDasharray="4 3"/>
        <line x1={X(i)} y1={Y(f)} x2={X(i)} y2="160" stroke={COL.gris} strokeDasharray="4 3"/>
        <text x="58" y={Y(f) + 5} fontSize="16" textAnchor="end" fill="#334155">{l}</text>
        <circle cx={X(i)} cy={Y(f)} r="4.5" fill={COL.orange}/>
        <text x={X(i)} y="180" fontSize="16" textAnchor="middle" fill="#334155">{i === 0 ? '0' : i === 1 ? 't½' : `${i} t½`}</text></g>)}
      <path d={courbe} fill="none" stroke={COL.bleu} strokeWidth="2.4"/>
      <text x="380" y="202" fontSize="16" textAnchor="end" fill="#334155">temps t</text>
      <text x="212" y="58" fontSize="17" fontWeight="700" fill={COL.bleu}>N(t) = N₀·exp(−λt)</text>
      <text x="212" y="86" fontSize="17" fontWeight="700" fill={COL.orange}>t½ = ln 2 / λ</text>
      <text x="200" y="226" fontSize="16" fontWeight="700" fill={COL.rouge} textAnchor="middle">Après 2 t½ : il reste ¼, pas zéro !</text>
    </svg>);
}

// ---------- carte 3 : activité ----------
export function SvgActivite() {
  const barres = [['0', 40, '40 Bq'], ['8 j', 20, '20 Bq'], ['16 j', 10, '10 Bq'], ['24 j', 5, '5 Bq']];
  return (
    <svg viewBox="0 0 400 226" style={stl} role="img"
      aria-label="Diagramme en barres de l’activité d’un échantillon d’iode 131 : 40 becquerels à l’instant zéro, 20 après 8 jours, 10 après 16 jours, 5 après 24 jours. À chaque demi-vie, l’activité est divisée par 2.">
      <text x="200" y="22" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">A = λ · N, en becquerel (Bq)</text>
      <line x1="24" y1="172" x2="384" y2="172" stroke="#94a3b8"/>
      {barres.map(([x, a, l], i) => { const h = a * 3, cx = 66 + i * 92; return (
        <g key={x}><rect x={cx - 26} y={172 - h} width="52" height={h} rx="3" fill={COL.bleu} opacity={1 - 0.15 * i}/>
          <text x={cx} y={166 - h} fontSize="16" fontWeight="700" fill={COL.orange} textAnchor="middle">{l}</text>
          <text x={cx} y="192" fontSize="16" textAnchor="middle" fill="#334155">{x}</text></g>); })}
      {[0, 1, 2].map(i => <text key={i} x={112 + i * 92} y="64" fontSize="16" fontWeight="700" fill={COL.vert} textAnchor="middle">÷ 2</text>)}
      <text x="200" y="216" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">A suit N : ÷ 2 à chaque demi-vie</text>
    </svg>);
}

// ---------- carte 4 : mesurer une activité par comptage ----------
// A ≈ 40,1 Bq : n ≈ 40 (1 s), 401 (10 s), 2 407 (60 s) ; u(n) = √n ; u(n)/n = 1/√n = 16 %, 5 %, 2 %
export function SvgComptage() {
  const lignes = [['1 s', 'n ≈ 40', 16], ['10 s', 'n ≈ 400', 5], ['60 s', 'n ≈ 2 400', 2]];
  return (
    <svg viewBox="0 0 400 220" style={stl} role="img"
      aria-label="Comptage de désintégrations pour une activité d’environ 40 becquerels. Compter pendant 1 seconde donne environ 40 désintégrations, avec une incertitude relative d’environ 16 pour cent. 10 secondes : environ 400, soit 5 pour cent. 60 secondes : environ 2 400, soit 2 pour cent.">
      <text x="200" y="22" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">A ≈ n / Δt   (n : nombre compté)</text>
      <text x="16" y="52" fontSize="16" fill="#334155">durée</text><text x="90" y="52" fontSize="16" fill="#334155">compté</text><text x="190" y="52" fontSize="16" fill="#334155">écart ≈ 1/√n</text>
      {lignes.map(([d, n, r], i) => { const y = 68 + i * 40; return (
        <g key={d}><text x="16" y={y + 16} fontSize="16" fontWeight="700" fill="#0f172a">{d}</text><text x="90" y={y + 16} fontSize="16" fill="#334155">{n}</text>
          <rect x="190" y={y} width={r * 7} height="22" rx="3" fill={r > 10 ? COL.rouge : r > 3 ? COL.orange : COL.vert}/>
          <text x={196 + r * 7} y={y + 17} fontSize="16" fontWeight="700" fill="#0f172a">{r} %</text></g>); })}
      <text x="200" y="206" fontSize="16" fontWeight="700" fill={COL.vert} textAnchor="middle">Compter plus longtemps : écart plus faible</text>
    </svg>);
}

// ---------- carte 5 : datation ----------
export function SvgDatation() {
  const col = [['vivant', '100 %', 1], ['5 730 ans', '50 %', 0.5], ['11 460 ans', '25 %', 0.25], ['17 190 ans', '12,5 %', 0.125]];
  return (
    <svg viewBox="0 0 400 240" style={stl} role="img"
      aria-label="Principe de la datation au carbone 14. Un organisme vivant contient 100 pour cent de la teneur en carbone 14. Après sa mort, cette teneur est divisée par 2 tous les 5 730 ans : 50 pour cent, 25 pour cent, 12,5 pour cent. La fraction restante donne l’âge.">
      <text x="200" y="22" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">Carbone 14 restant depuis la mort</text>
      <line x1="16" y1="156" x2="384" y2="156" stroke="#94a3b8"/>
      {col.map(([t, p, f], i) => { const cx = 56 + i * 96, h = 90 * f; return (
        <g key={t}><rect x={cx - 28} y="66" width="56" height="90" fill="white" stroke="#94a3b8"/><rect x={cx - 28} y={156 - h} width="56" height={h} fill={i ? COL.bleu : COL.vert} opacity="0.85"/>
          <text x={cx} y="58" fontSize="16" fontWeight="700" fill={COL.orange} textAnchor="middle">{p}</text>
          <text x={cx} y="178" fontSize="16" textAnchor="middle" fill="#334155">{t}</text></g>); })}
      <text x="200" y="208" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle">âge = (t½ / ln 2) × ln(N₀ / N)</text>
      <text x="200" y="232" fontSize="16" fill={COL.rouge} textAnchor="middle">teneur de départ supposée connue</text>
    </svg>);
}
