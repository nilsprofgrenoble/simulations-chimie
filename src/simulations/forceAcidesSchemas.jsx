// ====================================================
//  Schémas des cartes « À retenir » de la simulation 129 (force des acides : Ka, Ke, pKa, niveau TG).
//  Couleurs : bleu = donnée / acide, orange = grandeur à repérer, vert = bon / acide fort, rouge = piège / acide faible, gris = repère.
//  viewBox de 300 de large : sur téléphone (390 px) le schéma s'affiche vers 260 px, donc police ≥ 14 pour ≥ 12 px rendus.
//  Indices en caractères Unicode (jamais de tspan), tout le texte DANS le viewBox, marge de 12 unités en bas.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a' };
// indice lisible : lettre en taille 13 (pas de baselineShift, qui rétrécirait le texte) abaissée de 4 unités, puis retour à la ligne de base
const Sb = ({ t }) => <tspan dy="4" fontSize="13">{t}</tspan>;
const Rs = ({ children }) => <tspan dy="-4">{children}</tspan>;
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ---------- carte 1 : acide fort = transformation quasi-totale (HCl 0,010 mol/L) ----------
export function SvgAcideFort() {
  const base = 188, H = 86, bar = (x, h, c) => <rect x={x} y={base - h} width="28" height={h} fill={c}/>;
  return (
    <svg viewBox="0 0 300 244" style={stl} role="img"
      aria-label="Acide chlorhydrique à 0,010 mole par litre. Au départ, seul HCl est présent. À l’état final, HCl a disparu : il reste 0,010 mole par litre d’ions chlorure et d’ions oxonium. La transformation est quasi-totale.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">Acide fort : HCl dans l’eau</text>
      <text x="150" y="46" fontSize="15" fill={COL.txt} textAnchor="middle">HCl + H₂O → Cl⁻ + H₃O⁺</text>
      <line x1="6" y1={base} x2="294" y2={base} stroke="#94a3b8"/>
      {bar(12, H, COL.bleu)}{bar(164, 4, COL.rouge)}{bar(208, H, COL.vert)}{bar(252, H, COL.vert)}
      <text x="26" y={base - H - 6} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.bleu}>0,010</text>
      <text x="222" y={base - H - 6} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>0,010</text>
      <text x="266" y={base - H - 6} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>0,010</text>
      <text x="178" y={base - 12} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>≈ 0</text>
      <text x="26" y="206" fontSize="14" textAnchor="middle" fill={COL.txt}>HCl</text>
      <text x="178" y="206" fontSize="14" textAnchor="middle" fill={COL.txt}>HCl</text>
      <text x="222" y="206" fontSize="14" textAnchor="middle" fill={COL.txt}>Cl⁻</text>
      <text x="266" y="206" fontSize="14" textAnchor="middle" fill={COL.txt}>H₃O⁺</text>
      <text x="26" y="228" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.gris}>Départ</text>
      <text x="222" y="228" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.gris}>État final</text>
    </svg>);
}

// ---------- carte 2 : fort ou faible ? on compare le pH mesuré à −log C ----------
export function SvgPHTranche() {
  const X = p => 20 + 86.67 * (p - 1.5);
  return (
    <svg viewBox="0 0 300 214" style={stl} role="img"
      aria-label="Axe des pH. Pour une concentration de 0,010 mole par litre, un acide fort aurait un pH égal à moins log C, soit 2,00. L’acide éthanoïque mesuré a un pH de 3,39, plus élevé : c’est un acide faible.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">Fort ou faible ? Le pH tranche</text>
      <text x={X(2)} y="54" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>si fort</text>
      <text x={X(2)} y="72" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.vert}>2,00</text>
      <text x={X(3.39)} y="54" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>mesuré</text>
      <text x={X(3.39)} y="72" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>3,39</text>
      <line x1="14" y1="112" x2="282" y2="112" stroke="#475569" strokeWidth="2"/>
      {[2, 3, 4].map(p => <g key={p}><line x1={X(p)} y1="106" x2={X(p)} y2="118" stroke="#475569"/><text x={X(p)} y="138" fontSize="14" textAnchor="middle" fill="#334155">{p}</text></g>)}
      <text x="288" y="138" fontSize="14" textAnchor="end" fill={COL.gris}>pH</text>
      <circle cx={X(2)} cy="112" r="8" fill={COL.vert} stroke={COL.txt} strokeWidth="1.5"/>
      <circle cx={X(3.39)} cy="112" r="8" fill={COL.orange} stroke={COL.txt} strokeWidth="1.5"/>
      <line x1={X(2) + 12} y1="92" x2={X(3.39) - 12} y2="92" stroke={COL.rouge} strokeWidth="2.5"/>
      <polygon points={`${X(3.39) - 12},92 ${X(3.39) - 22},86 ${X(3.39) - 22},98`} fill={COL.rouge}/>
      <text x="150" y="172" fontSize="15" fontWeight="700" fill={COL.rouge} textAnchor="middle">pH mesuré &gt; −log C</text>
      <text x="150" y="194" fontSize="15" fontWeight="700" fill={COL.rouge} textAnchor="middle">⇒ acide faible</text>
    </svg>);
}

// ---------- carte 3 : taux d'avancement final ----------
export function SvgTaux() {
  return (
    <svg viewBox="0 0 300 226" style={stl} role="img"
      aria-label="Deux barres de taux d’avancement final. L’acide fort HCl atteint 1 : la barre est pleine. L’acide éthanoïque à 0,010 mole par litre n’atteint que 0,041 : la barre est très courte. Formule : tau égale x f sur x max, soit la concentration en ions oxonium divisée par C.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">Taux d’avancement final τ</text>
      <text x="20" y="50" fontSize="14" fill={COL.txt}>acide fort, HCl</text>
      <rect x="20" y="58" width="240" height="24" fill={COL.vert}/>
      <text x="268" y="76" fontSize="15" fontWeight="700" fill={COL.vert}>1</text>
      <text x="20" y="112" fontSize="14" fill={COL.txt}>acide éthanoïque, 0,010 mol/L</text>
      <rect x="20" y="120" width="240" height="24" fill="#f1f5f9" stroke="#cbd5e1"/>
      <rect x="20" y="120" width="10" height="24" fill={COL.rouge}/>
      <text x="38" y="138" fontSize="15" fontWeight="700" fill={COL.rouge}>0,041</text>
      <text x="150" y="176" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">τ = xf / xmax</text>
      <text x="150" y="198" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">= [H₃O⁺] / C</text>
    </svg>);
}

// ---------- carte 4 : constante d'acidité Ka et pKa ----------
export function SvgKaPKa() {
  return (
    <svg viewBox="0 0 300 236" style={stl} role="img"
      aria-label="Équation CH3COOH plus H2O en équilibre avec CH3COO moins plus H3O plus. Ka égale la concentration en CH3COO moins fois la concentration en H3O plus, divisée par la concentration en CH3COOH. pKa égale moins log Ka. Pour l’acide éthanoïque, Ka vaut 1,7 fois 10 puissance moins 5 et pKa 4,77. Ka ne dépend que de la température.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">Constante d’acidité Ka</text>
      <text x="150" y="48" fontSize="14" fill={COL.txt} textAnchor="middle">CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺</text>
      <text x="30" y="98" fontSize="16" fontWeight="700" fill={COL.orange}>K<Sb t="A"/><Rs> =</Rs></text>
      <text x="184" y="84" fontSize="14" fill={COL.txt} textAnchor="middle">[CH₃COO⁻]·[H₃O⁺]</text>
      <line x1="90" y1="92" x2="278" y2="92" stroke={COL.txt} strokeWidth="1.5"/>
      <text x="184" y="112" fontSize="14" fill={COL.txt} textAnchor="middle">[CH₃COOH]</text>
      <text x="150" y="152" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">pK<Sb t="A"/><Rs> = −log K</Rs><Sb t="A"/></text>
      <text x="150" y="176" fontSize="14" fill={COL.bleu} textAnchor="middle">K<Sb t="A"/><Rs> = 1,7×10⁻⁵ ⇒ pK</Rs><Sb t="A"/><Rs> = 4,77</Rs></text>
      <text x="150" y="206" fontSize="14" fontWeight="700" fill={COL.rouge} textAnchor="middle">K<Sb t="A"/><Rs> ne dépend que de T :</Rs></text>
      <text x="150" y="224" fontSize="14" fontWeight="700" fill={COL.rouge} textAnchor="middle">pas de la concentration C</text>
    </svg>);
}

// ---------- carte 5 : comparer la force avec le pKa ----------
export function SvgComparer() {
  const X = p => 20 + 173.3 * (p - 3.5);
  const pts = [[3.75, 'méthanoïque', 46], [4.20, 'benzoïque', 82], [4.76, 'éthanoïque', 46]];
  return (
    <svg viewBox="0 0 300 238" style={stl} role="img"
      aria-label="Axe des pKa. L’acide méthanoïque a un pKa de 3,75, l’acide benzoïque 4,20 et l’acide éthanoïque 4,76. Plus le pKa est petit, plus l’acide est fort : l’acide méthanoïque est le plus fort des trois.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">Comparer deux acides : le pK<Sb t="A"/></text>
      {pts.map(([p, n, y]) => <g key={n}><text x={X(p)} y={y} fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.bleu}>{n}</text>
        <line x1={X(p)} y1={y + 6} x2={X(p)} y2="112" stroke="#94a3b8" strokeDasharray="3 3"/></g>)}
      <line x1="14" y1="126" x2="286" y2="126" stroke="#475569" strokeWidth="2"/>
      {pts.map(([p]) => <g key={p}><circle cx={X(p)} cy="126" r="7" fill={COL.orange} stroke={COL.txt} strokeWidth="1.5"/>
        <text x={X(p)} y="154" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>{String(p.toFixed(2)).replace('.', ',')}</text></g>)}
      <text x="12" y="184" fontSize="14" fontWeight="700" fill={COL.vert}>← plus fort</text>
      <text x="288" y="184" fontSize="14" fontWeight="700" fill={COL.rouge} textAnchor="end">plus faible →</text>
      <text x="150" y="208" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">pK<Sb t="A"/><Rs> petit ⇒ acide fort</Rs></text>
      <text x="150" y="228" fontSize="14" fill={COL.txt} textAnchor="middle">(K<Sb t="A"/><Rs> grand, τ grand, pH bas)</Rs></text>
    </svg>);
}

// ---------- carte 6 : produit ionique de l'eau Ke ----------
export function SvgKe() {
  return (
    <svg viewBox="0 0 300 226" style={stl} role="img"
      aria-label="Autoprotolyse de l’eau : 2 H2O en équilibre avec H3O plus et HO moins. Ke égale la concentration en H3O plus fois la concentration en HO moins, soit 1,0 fois 10 puissance moins 14 à 25 degrés. Quand la concentration en H3O plus augmente, celle en HO moins diminue. À pH 3,39, la concentration en HO moins vaut 2,5 fois 10 puissance moins 11 mole par litre.">
      <text x="150" y="20" fontSize="15" fontWeight="700" fill={COL.txt} textAnchor="middle">Produit ionique de l’eau K<Sb t="e"/></text>
      <text x="150" y="50" fontSize="15" fill={COL.txt} textAnchor="middle">2 H₂O ⇌ H₃O⁺ + HO⁻</text>
      <text x="150" y="86" fontSize="16" fontWeight="700" fill={COL.orange} textAnchor="middle">K<Sb t="e"/><Rs> = [H₃O⁺] × [HO⁻]</Rs></text>
      <text x="150" y="112" fontSize="16" fontWeight="700" fill={COL.orange} textAnchor="middle">= 1,0×10⁻¹⁴ à 25 °C</text>
      <text x="150" y="148" fontSize="14" fill={COL.txt} textAnchor="middle">[H₃O⁺] augmente ⇒ [HO⁻] diminue</text>
      <text x="150" y="176" fontSize="14" fontWeight="700" fill={COL.bleu} textAnchor="middle">pH 3,39 : [H₃O⁺] = 4,1×10⁻⁴ mol/L</text>
      <text x="150" y="198" fontSize="14" fontWeight="700" fill={COL.bleu} textAnchor="middle">donc [HO⁻] = 2,5×10⁻¹¹ mol/L</text>
    </svg>);
}
