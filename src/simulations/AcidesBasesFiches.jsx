/* eslint-disable react-refresh/only-export-components -- fichier de dessins : les constantes de couleur sont partagées avec la simulation */
// Cartes « À retenir » des quatre simulations « Acides et bases » (SPCL, Chimie et développement durable) : une idée par carte,
// un schéma explicite (viewBox de 300 de large, texte ≥ 12,5, plafonné à 320 px), une phrase-clé, un exemple chiffré, une fausse idée opposée à la bonne.
import { puces } from './Travail';
import { Formule } from '../commun';
import * as M from './acidesBasesModele';

const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '6px auto' };
const T = (x, y, t, c = '#0f172a', anchor = 'middle', fs = 13, w = 700) => <text x={x} y={y} textAnchor={anchor} fontSize={fs} fontWeight={w} fill={c}>{t}</text>;
const BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', GRIS = '#475569';
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');

// Courbe de fraction d'un couple (pKa) sur une plage de pH, dans la boîte [x0, x0 + w] × [y0, y0 + h]
function courbeFraction(pKa, ph0, ph1, x0, w, y0, h, k) {
  let d = '';
  for (let i = 0; i <= 60; i++) {
    const ph = ph0 + (ph1 - ph0) * i / 60, a = M.fractions(M.concH(ph), [pKa])[k];
    d += `${i ? 'L' : 'M'}${(x0 + w * i / 60).toFixed(1)},${(y0 + h * (1 - a)).toFixed(1)}`;
  }
  return d;
}

// ───── Acide : 1. pH d'un acide fort ─────
function CarteAcideFort() {
  const X = ph => 20 + 260 * ph / 14;
  return (
    <div>
      <svg viewBox="0 0 300 190" role="img" aria-label="Un acide fort réagit totalement avec l’eau : [H₃O⁺] = C. Exemple : à C = 10⁻³ mol/L, le pH vaut 3,0 sur l’échelle de pH." style={svgStyle}>
        <defs><linearGradient id="abf-g" x1="0" x2="1"><stop offset="0" stopColor="#dc2626"/><stop offset="0.25" stopColor="#f59e0b"/><stop offset="0.5" stopColor="#22c55e"/><stop offset="0.75" stopColor="#3b82f6"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
        {T(150, 24, 'HCl + H₂O → H₃O⁺ + Cl⁻', BLEU, 'middle', 16)}
        {T(150, 46, 'réaction totale : [H₃O⁺] = C', GRIS, 'middle', 13.5, 600)}
        <rect x="20" y="112" width="260" height="18" rx="9" fill="url(#abf-g)"/>
        {[0, 7, 14].map(k => T(X(k), 150, k, GRIS, 'middle', 13, 600))}
        <polygon points={`${X(3) - 8},90 ${X(3) + 8},90 ${X(3)},108`} fill="#0f172a"/>
        {T(X(3) - 8, 82, 'C = 10⁻³ mol/L : pH = 3,0', '#0f172a', 'start', 14)}
        {T(150, 180, 'pH = −log C', ROUGE, 'middle', 17)}
      </svg>
      {puces(<>Une phrase-clé : <strong>acide fort ⇒ tout réagit, [H₃O⁺] = C ⇒ pH = −log C</strong>.</>, <>Exemple : C = 10⁻³ mol/L → pH = 3,0 ; on divise C par 10, le pH augmente de 1.</>, <><strong>Idée fausse</strong> : « le pH est la concentration ». <strong>Vrai</strong> : c’est son opposé du logarithme décimal, sans unité.</>)}
    </div>);
}
// ───── Acide : 2. un acide faible réagit partiellement ─────
function CarteAcideFaible() {
  const pts = (x0, n, k) => Array.from({ length: n }, (_, i) => ({ x: x0 + 20 + (i % 4) * 28, y: 70 + Math.floor(i / 4) * 30, a: i < k }));
  const fort = pts(10, 8, 8), faible = pts(160, 8, 2);
  const rond = (p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="11" fill={p.a ? '#fff7ed' : '#eff6ff'} stroke={p.a ? ORANGE : BLEU} strokeWidth="2"/><text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={p.a ? ORANGE : BLEU}>{p.a ? 'A⁻' : 'AH'}</text></g>;
  return (
    <div>
      <svg viewBox="0 0 300 190" role="img" aria-label="Huit molécules d’acide : pour un acide fort, toutes ont réagi avec l’eau ; pour un acide faible, seules deux sur huit ont réagi et il reste des molécules AH." style={svgStyle}>
        <rect x="8" y="30" width="136" height="76" rx="10" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
        <rect x="158" y="30" width="136" height="76" rx="10" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
        {T(76, 22, 'acide fort', VERT, 'middle', 15)}{T(226, 22, 'acide faible', ORANGE, 'middle', 15)}
        {fort.map(rond)}{faible.map(rond)}
        {T(76, 128, 'tout a réagi', VERT, 'middle', 13.5)}{T(226, 128, 'il reste de l’acide', ORANGE, 'middle', 13.5)}
        {T(76, 148, 'τ = 100 %', VERT, 'middle', 14)}{T(226, 148, 'ici τ = 2/8 = 25 %', ORANGE, 'middle', 14)}
        {T(150, 178, 'AH : acide intact · A⁻ : a réagi avec l’eau', GRIS, 'middle', 12.5, 600)}
      </svg>
      {puces(<>Une phrase-clé : <strong>fort = réaction totale (→) ; faible = réaction limitée (⇌)</strong>.</>, <>Pour un acide faible, l’avancement final est <strong>inférieur</strong> à l’avancement maximal : x<sub>f</sub> &lt; x<sub>max</sub>.</>, <><strong>Idée fausse</strong> : « acide faible = acide dilué ». <strong>Vrai</strong> : fort ou faible dépend de la nature de l’acide, pas de sa concentration.</>)}
    </div>);
}
// ───── Acide : 3. dilution et taux d'avancement ─────
function CarteDilution() {
  const tau = C => 100 * M.tauAcide(C, 4.8);
  const lignes = [
    { y: 34, nom: 'HCl 10⁻² mol/L', t: 100, col: VERT, txt: `τ = 100 %`, ph: `pH = ${nbf(M.pH({ ca: 1e-2 }), 1)}` },
    { y: 84, nom: 'acide éthanoïque 10⁻² mol/L', t: tau(1e-2), col: ORANGE, txt: `τ ≈ ${nbf(tau(1e-2), 0)} %`, ph: `pH ≈ ${nbf(M.pH({ C: 1e-2, pKas: [4.8] }), 1)}` },
    { y: 134, nom: 'acide éthanoïque 10⁻⁴ mol/L', t: tau(1e-4), col: ORANGE, txt: `τ ≈ ${nbf(tau(1e-4), 0)} %`, ph: `pH ≈ ${nbf(M.pH({ C: 1e-4, pKas: [4.8] }), 1)}` },
  ];
  return (
    <div>
      <svg viewBox="0 0 300 186" role="img" aria-label="Taux d’avancement de trois solutions : l’acide chlorhydrique réagit en totalité, l’acide éthanoïque à 10⁻² mol/L à 4 %, et davantage, 33 %, quand il est dilué à 10⁻⁴ mol/L." style={svgStyle}>
        {lignes.map(l => <g key={l.y}>
          {T(10, l.y - 7, l.nom, '#0f172a', 'start', 13)}
          <rect x="10" y={l.y} width="170" height="18" rx="4" fill="#e2e8f0" stroke={GRIS} strokeWidth="1"/>
          <rect x="10" y={l.y} width={Math.max(4, 1.7 * l.t)} height="18" rx="4" fill={l.col}/>
          {T(190, l.y + 13, l.txt, l.col, 'start', 14)}
          {T(190, l.y + 32, l.ph, GRIS, 'start', 12.5, 600)}
        </g>)}
      </svg>
      {puces(<>Une phrase-clé : <strong>plus on dilue un acide faible, plus il réagit (τ augmente)</strong>.</>, <>Pourtant le pH augmente aussi, car [H₃O⁺] diminue : il y a moins d’acide en tout.</>, <><strong>Idée fausse</strong> : « acide fort = pH très bas ». <strong>Vrai</strong> : un acide fort très dilué a un pH proche de 7.</>)}
    </div>);
}

// ───── Prédominance : 1. pH = pKa, la balance ─────
function CarteBalance() {
  return (
    <div>
      <svg viewBox="0 0 300 170" role="img" aria-label="Une balance en équilibre : à pH égal au pKa, il y a autant d’acide AH que de base A⁻ conjuguée." style={svgStyle}>
        {T(150, 24, 'pH = pKa', ROUGE, 'middle', 18)}
        <polygon points="150,100 128,138 172,138" fill="#94a3b8"/>
        <line x1="40" y1="100" x2="260" y2="100" stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/>
        <rect x="50" y="56" width="56" height="42" rx="8" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>{T(78, 84, 'AH', BLEU, 'middle', 18)}
        <rect x="194" y="56" width="56" height="42" rx="8" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5"/>{T(222, 84, 'A⁻', ORANGE, 'middle', 18)}
        {T(150, 160, '[AH] = [A⁻] : 50 % / 50 %', '#0f172a', 'middle', 15)}
      </svg>
      {puces(<>Une phrase-clé : <strong>pH = pKa ⇒ la balance est à l’équilibre : [AH] = [A⁻]</strong>.</>, <>Sur le diagramme de distribution, c’est le point où les deux courbes se croisent, à 50 %.</>, <><strong>Idée fausse</strong> : « à pH = pKa, il n’y a plus d’acide ». <strong>Vrai</strong> : il y en a autant que de base.</>)}
    </div>);
}
// ───── Prédominance : 2. domaines de prédominance et rapport ─────
function CarteDomaines() {
  const pKa = 4.8, ph0 = pKa - 3, ph1 = pKa + 3, X = ph => 36 + 228 * (ph - ph0) / (ph1 - ph0);
  return (
    <div>
      <svg viewBox="0 0 300 190" role="img" aria-label="Diagramme de distribution d’un couple acide-base : l’acide AH domine à gauche du pKa, la base A⁻ à droite ; la zone pKa − 1 à pKa + 1 est celle où le rapport vaut entre 0,1 et 10." style={svgStyle}>
        <rect x={X(pKa - 1)} y="22" width={X(pKa + 1) - X(pKa - 1)} height="100" fill="#ecfdf5"/>
        <line x1="36" y1="122" x2="264" y2="122" stroke={GRIS} strokeWidth="1.5"/>
        <line x1={X(pKa)} y1="22" x2={X(pKa)} y2="122" stroke={GRIS} strokeWidth="1.2" strokeDasharray="4 3"/>
        <path d={courbeFraction(pKa, ph0, ph1, 36, 228, 24, 96, 0)} fill="none" stroke={BLEU} strokeWidth="3"/>
        <path d={courbeFraction(pKa, ph0, ph1, 36, 228, 24, 96, 1)} fill="none" stroke={ORANGE} strokeWidth="3"/>
        {T(44, 40, 'AH', BLEU, 'start', 16)}{T(256, 40, 'A⁻', ORANGE, 'end', 16)}
        {T(X(pKa), 140, 'pKa', '#0f172a', 'middle', 14)}{T(X(pKa - 1), 140, 'pKa − 1', GRIS, 'middle', 12.5, 600)}{T(X(pKa + 1), 140, 'pKa + 1', GRIS, 'middle', 12.5, 600)}
        {T(276, 158, 'pH →', GRIS, 'end', 12.5, 600)}
      </svg>
      <div style={{ textAlign: 'center' }}><Formule><mi>pH</mi><mo>=</mo><msub><mi>pK</mi><mi>a</mi></msub><mo>+</mo><mi>log</mi><mfrac><mrow><mo>[</mo><msup><mi>A</mi><mo>−</mo></msup><mo>]</mo></mrow><mrow><mo>[</mo><mi>AH</mi><mo>]</mo></mrow></mfrac></Formule></div>
      {puces(<>Une phrase-clé : <strong>pH &lt; pKa : l’acide domine ; pH &gt; pKa : la base domine</strong>.</>, <>Un pH éloigné d’une unité du pKa : un rapport de 10 (10 fois plus d’une forme que de l’autre).</>)}
    </div>);
}
// ───── Prédominance : 3. polyacide ─────
function CartePolyacide() {
  const pKas = [3.1, 4.8, 6.4], X = ph => 20 + 260 * ph / 8;
  const seg = [[0, 3.1, 'H₃A', '#dbeafe', BLEU], [3.1, 4.8, 'H₂A⁻', '#ffedd5', ORANGE], [4.8, 6.4, 'HA²⁻', '#cffafe', '#0e7490'], [6.4, 8, 'A³⁻', '#ede9fe', '#6d28d9']];
  return (
    <div>
      <svg viewBox="0 0 300 156" role="img" aria-label="Acide citrique, trois pKa de 3,1, 4,8 et 6,4 : quatre espèces se succèdent, H₃A, H₂A⁻, HA²⁻ puis A³⁻, chacune prédominant entre deux pKa consécutifs." style={svgStyle}>
        {T(150, 20, 'acide citrique : 3 pKa → 4 espèces', '#0f172a', 'middle', 14)}
        {seg.map(([a, b, e, f, c]) => <g key={e}><rect x={X(a)} y="64" width={X(b) - X(a)} height="38" fill={f} stroke={c} strokeWidth="1.5"/>{T((X(a) + X(b)) / 2, 89, e, c, 'middle', e.length > 3 ? 13 : 14.5)}</g>)}
        {pKas.map(p => <g key={p}><line x1={X(p)} y1="54" x2={X(p)} y2="108" stroke="#0f172a" strokeWidth="1.5"/>{T(X(p), 48, nbf(p, 1), '#0f172a', 'middle', 13)}</g>)}
        {T(20, 44, 'pKa', GRIS, 'start', 12.5, 600)}
        <line x1="20" y1="118" x2="280" y2="118" stroke={GRIS} strokeWidth="1.5"/>
        {[0, 2, 4, 6, 8].map(k => T(X(k), 134, k, GRIS, 'middle', 12.5, 600))}{T(284, 148, 'pH', GRIS, 'end', 12.5, 600)}
      </svg>
      {puces(<>Une phrase-clé : <strong>entre deux pKa consécutifs, une seule espèce prédomine</strong>.</>, <>Un acide à n acidités a n pKa et n + 1 espèces ; à pH = pKa, deux espèces voisines sont à égalité.</>, <><strong>Idée fausse</strong> : « un polyacide n’a qu’un pKa ». <strong>Vrai</strong> : un pKa par proton cédé.</>)}
    </div>);
}

// ───── Tampon : 1. tampon équimolaire ─────
function CarteEquimolaire() {
  const lignes = [[1, 'A⁻/AH = 1', 'pH = pKa', VERT], [10, 'A⁻/AH = 10', 'pH = pKa + 1', ORANGE], [0.1, 'A⁻/AH = 0,1', 'pH = pKa − 1', BLEU]];
  return (
    <div>
      <svg viewBox="0 0 300 150" role="img" aria-label="Le pH d’un tampon dépend du rapport A⁻ sur AH : rapport 1, pH = pKa ; rapport 10, pH = pKa + 1 ; rapport 0,1, pH = pKa − 1." style={svgStyle}>
        {lignes.map(([, a, b, c], i) => <g key={a}>
          <rect x="14" y={16 + i * 44} width="272" height="34" rx="8" fill="white" stroke={c} strokeWidth="2"/>
          {T(30, 39 + i * 44, a, '#0f172a', 'start', 14)}{T(270, 39 + i * 44, b, c, 'end', 15)}
        </g>)}
      </svg>
      {puces(<>Une phrase-clé : <strong>autant d’acide que de base ⇒ pH = pKa</strong>.</>, <>Exemple : 5 mmol de AH et 5 mmol de A⁻ ⇒ le pH est égal au pKa du couple.</>, <><strong>Idée fausse</strong> : « un tampon a toujours un pH de 7 ». <strong>Vrai</strong> : son pH est proche du pKa de son couple.</>)}
    </div>);
}
// ───── Tampon : 2. comment un tampon résiste ─────
function CarteReserve() {
  const fleche = (x1, y, x2, c) => <g><line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth="3"/><polygon points={x2 > x1 ? `${x2 + 8},${y} ${x2},${y - 5} ${x2},${y + 5}` : `${x2 - 8},${y} ${x2},${y - 5} ${x2},${y + 5}`} fill={c}/></g>;
  return (
    <div>
      <svg viewBox="0 0 300 180" role="img" aria-label="Un tampon contient deux réserves : la base A⁻ consomme l’acide fort ajouté, l’acide AH consomme la base forte ajoutée, donc le pH varie peu." style={svgStyle}>
        <rect x="14" y="62" width="100" height="56" rx="10" fill="#eff6ff" stroke={BLEU} strokeWidth="2.5"/>{T(64, 88, 'AH', BLEU, 'middle', 19)}{T(64, 108, 'réserve d’acide', BLEU, 'middle', 12.5, 600)}
        <rect x="186" y="62" width="100" height="56" rx="10" fill="#fff7ed" stroke={ORANGE} strokeWidth="2.5"/>{T(236, 88, 'A⁻', ORANGE, 'middle', 19)}{T(236, 108, 'réserve de base', ORANGE, 'middle', 12.5, 600)}
        {T(236, 18, 'acide fort ajouté', ROUGE, 'middle', 13)}
        <line x1="236" y1="28" x2="236" y2="54" stroke={ROUGE} strokeWidth="3"/><polygon points="236,60 231,52 241,52" fill={ROUGE}/>
        {T(64, 18, 'base forte ajoutée', ROUGE, 'middle', 13)}
        <line x1="64" y1="28" x2="64" y2="54" stroke={ROUGE} strokeWidth="3"/><polygon points="64,60 59,52 69,52" fill={ROUGE}/>
        {fleche(180, 82, 122, GRIS)}{fleche(122, 100, 178, GRIS)}
        {T(150, 142, 'A⁻ + H₃O⁺ → AH + H₂O', '#0f172a', 'middle', 13)}
        {T(150, 164, 'AH + HO⁻ → A⁻ + H₂O', '#0f172a', 'middle', 13)}
      </svg>
      {puces(<>Une phrase-clé : <strong>un tampon, c’est deux éponges : AH absorbe les bases, A⁻ absorbe les acides</strong>.</>, <>Le rapport [A⁻]/[AH] change peu, donc le pH aussi.</>, <><strong>Idée fausse</strong> : « un tampon empêche toute variation de pH ». <strong>Vrai</strong> : il la limite, jusqu’à épuisement d’une réserve.</>)}
    </div>);
}
// ───── Tampon : 3. zone d'efficacité ─────
function CarteZoneTampon() {
  const pKa = 4.8, X = ph => 20 + 260 * ph / 14;
  return (
    <div>
      <svg viewBox="0 0 300 150" role="img" aria-label="Échelle de pH : un tampon de pKa 4,8 est efficace entre pKa − 1 et pKa + 1, soit de 3,8 à 5,8, et au mieux à pH = pKa." style={svgStyle}>
        <rect x="20" y="58" width="260" height="22" rx="11" fill="#e2e8f0"/>
        <rect x={X(pKa - 1)} y="58" width={X(pKa + 1) - X(pKa - 1)} height="22" fill="#86efac" stroke={VERT} strokeWidth="2"/>
        <line x1={X(pKa)} y1="48" x2={X(pKa)} y2="90" stroke="#0f172a" strokeWidth="2.5"/>
        {T(X(pKa), 40, 'pKa = 4,8', '#0f172a', 'middle', 14)}
        {T(150, 20, 'tampon du couple CH₃COOH / CH₃COO⁻', GRIS, 'middle', 12.5, 600)}
        {[0, 7, 14].map(k => T(X(k), 108, k, GRIS, 'middle', 13, 600))}{T(284, 126, 'pH', GRIS, 'end', 12.5, 600)}
        {T(X(pKa), 130, 'efficace : pKa ± 1', VERT, 'middle', 14)}
      </svg>
      {puces(<>Une phrase-clé : <strong>un tampon est efficace pour pH = pKa ± 1</strong>.</>, <>Dans cette zone, 0,1 &lt; [A⁻]/[AH] &lt; 10 : les deux réserves sont assez remplies ; au mieux quand elles sont égales.</>, <><strong>Idée fausse</strong> : « tout couple convient pour tout pH ». <strong>Vrai</strong> : on choisit un couple dont le pKa est proche du pH voulu.</>)}
    </div>);
}

// ───── Titrage : 1. équivalence, saut de pH, dérivée ─────
function CarteEquivalence() {
  const f = v => 1 / (1 + Math.exp(-(v - 5) * 2.2)), X = v => 40 + 240 * v / 10;
  const pH = v => 124 - 78 * f(v);
  let c = '', d = '';
  for (let i = 0; i <= 80; i++) { const v = i / 8, y = pH(v); c += `${i ? 'L' : 'M'}${X(v).toFixed(1)},${y.toFixed(1)}`; const df = 2.2 * f(v) * (1 - f(v)); d += `${i ? 'L' : 'M'}${X(v).toFixed(1)},${(214 - 52 * df / 0.55).toFixed(1)}`; }
  return (
    <div>
      <svg viewBox="0 0 300 236" role="img" aria-label="Courbe de titrage : le pH monte brusquement à l’équivalence, au milieu du saut de pH ; la dérivée dpH/dV passe par un maximum à ce volume." style={svgStyle}>
        <line x1="40" y1="130" x2="284" y2="130" stroke={GRIS}/><line x1="40" y1="30" x2="40" y2="130" stroke={GRIS}/>
        {T(36, 28, 'pH', GRIS, 'end', 12.5, 600)}
        <path d={c} fill="none" stroke={BLEU} strokeWidth="3"/>
        <line x1={X(5)} y1="130" x2={X(5)} y2="30" stroke={VERT} strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx={X(5)} cy={pH(5)} r="5" fill={VERT}/>
        {T(X(5) - 8, 62, 'équivalence', VERT, 'end', 14)}{T(X(5) - 8, 78, 'saut de pH', GRIS, 'end', 12.5, 600)}
        <line x1="40" y1="216" x2="284" y2="216" stroke={GRIS}/>
        <path d={d} fill="none" stroke="#7c3aed" strokeWidth="2.6"/>
        <line x1={X(5)} y1="216" x2={X(5)} y2="146" stroke={VERT} strokeWidth="1.5" strokeDasharray="4 3"/>
        {T(X(5) + 8, 160, 'maximum de dpH/dV', '#7c3aed', 'start', 13)}
        {T(284, 232, 'volume versé V', GRIS, 'end', 12.5, 600)}
      </svg>
      {puces(<>Une phrase-clé : <strong>à l’équivalence, on a versé autant de matière de titrant que d’espèce titrée au départ</strong>.</>, <>On la repère au <strong>saut de pH</strong> : le maximum de la dérivée dpH/dV.</>, <><strong>Idée fausse</strong> : « équivalence = pH 7 ». <strong>Vrai</strong> : le pH à l’équivalence dépend des espèces présentes.</>)}
    </div>);
}
// ───── Titrage : 2. la courbe d'un acide faible ─────
function CarteCourbe() {
  const p = { C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1, Vb: 0 }, pts = M.courbeTitrage(p, 0.02, 160), X = v => 44 + 236 * v / 20, Y = ph => 150 - 118 * (ph - 2) / 11;
  const tr = pts.map((q, i) => `${i ? 'L' : 'M'}${X(q.V * 1e3).toFixed(1)},${Y(q.pH).toFixed(1)}`).join('');
  return (
    <div>
      <svg viewBox="0 0 300 200" role="img" aria-label="Courbe de titrage de l’acide éthanoïque par la soude : à la demi-équivalence, 5 mL, le pH vaut le pKa, 4,8 ; à l’équivalence, 10 mL, le pH est supérieur à 7." style={svgStyle}>
        <line x1="44" y1="150" x2="284" y2="150" stroke={GRIS}/><line x1="44" y1="28" x2="44" y2="150" stroke={GRIS}/>
        <line x1="44" y1={Y(7)} x2="284" y2={Y(7)} stroke="#94a3b8" strokeDasharray="3 3"/>
        {T(38, Y(7) + 4, '7', GRIS, 'end', 12.5, 600)}{T(40, 22, 'pH', GRIS, 'end', 12.5, 600)}
        {[0, 5, 10, 20].map(v => T(X(v), 168, v, GRIS, 'middle', 12.5, 600))}{T(284, 188, 'V (mL)', GRIS, 'end', 12.5, 600)}
        <path d={tr} fill="none" stroke={BLEU} strokeWidth="3"/>
        <line x1={X(5)} y1="150" x2={X(5)} y2={Y(4.8)} stroke={ORANGE} strokeDasharray="3 3"/><circle cx={X(5)} cy={Y(4.8)} r="5" fill={ORANGE}/>
        <line x1={X(10)} y1="150" x2={X(10)} y2={Y(M.phEquivalence(p))} stroke={VERT} strokeDasharray="3 3"/><circle cx={X(10)} cy={Y(M.phEquivalence(p))} r="5" fill={VERT}/>
        {T(X(5) - 8, Y(4.8) - 22, 'V = 5 mL', ORANGE, 'end', 13)}{T(X(5) - 8, Y(4.8) - 7, 'pH = pKa', ORANGE, 'end', 13)}
        {T(X(10) + 12, 112, 'V = 10 mL', VERT, 'start', 13)}{T(X(10) + 12, 128, 'pH > 7', VERT, 'start', 13)}
      </svg>
      <div style={{ textAlign: 'center' }}><Formule><msub><mi>C</mi><mi>a</mi></msub><mo>×</mo><msub><mi>V</mi><mn>0</mn></msub><mo>=</mo><msub><mi>C</mi><mi>b</mi></msub><mo>×</mo><msub><mi>V</mi><mi>éq</mi></msub></Formule></div>
      {puces(<>Une phrase-clé : <strong>à la demi-équivalence, pH = pKa</strong> (autant de AH que de A⁻).</>, <>Acide faible + base forte : à l’équivalence il ne reste que la base A⁻, donc pH &gt; 7.</>)}
    </div>);
}
// ───── Titrage : 3. choisir un indicateur ─────
function CarteIndicateur() {
  const p = { C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1 }, peq = M.phEquivalence(p), X = ph => 150 + 140 * (ph - 2) / 10;
  const noms = { jm: 'jaune de méthyle', vbc: 'vert de bromocrésol', bbt: 'bleu de bromothymol', bth: 'bleu de thymol', php: 'phénolphtaléine', jar: 'jaune d’alizarine R' };
  return (
    <div>
      <svg viewBox="0 0 300 214" role="img" aria-label="Zones de virage de six indicateurs colorés : le bleu de thymol et la phénolphtaléine contiennent le pH à l’équivalence, environ 8,7, du titrage d’un acide faible par une base forte." style={svgStyle}>
        {T(296, 16, `pH à l’équivalence ≈ ${nbf(peq, 1)}`, VERT, 'end', 13)}
        <line x1={X(peq)} y1="22" x2={X(peq)} y2="168" stroke={VERT} strokeWidth="2" strokeDasharray="4 3"/>
        {M.INDICATEURS.map((ind, i) => { const ok = M.convient(ind, peq), y = 32 + i * 22; return <g key={ind.id}>
          {T(142, y + 12, noms[ind.id], ok ? '#0f172a' : GRIS, 'end', 12.5, ok ? 700 : 500)}
          <rect x={X(ind.zone[0])} y={y} width={X(ind.zone[1]) - X(ind.zone[0])} height="16" rx="4" fill={ok ? '#86efac' : '#cbd5e1'} stroke={ok ? VERT : '#94a3b8'} strokeWidth="1.5"/></g>; })}
        <line x1="150" y1="170" x2="290" y2="170" stroke={GRIS} strokeWidth="1.5"/>
        {[2, 4, 6, 8, 10, 12].map(k => T(X(k), 188, k, GRIS, 'middle', 12.5, 600))}{T(292, 206, 'pH', GRIS, 'end', 12.5, 600)}
      </svg>
      {puces(<>Une phrase-clé : <strong>un indicateur convient si sa zone de virage contient le pH à l’équivalence</strong>.</>, <>Acide faible + base forte : pH<sub>éq</sub> &gt; 7 ⇒ indicateur du côté basique (bleu de thymol) ; le bleu de bromothymol, trop acide, ne convient pas.</>, <>La phénolphtaléine convient aussi mais elle est classée <strong>CMR</strong> : au lycée, on lui préfère le bleu de thymol.</>)}
    </div>);
}

export const FICHES = {
  acideFort: <CarteAcideFort/>, acideFaible: <CarteAcideFaible/>, dilution: <CarteDilution/>,
  balance: <CarteBalance/>, domaines: <CarteDomaines/>, polyacide: <CartePolyacide/>,
  equimolaire: <CarteEquimolaire/>, reserve: <CarteReserve/>, zoneTampon: <CarteZoneTampon/>,
  equivalence: <CarteEquivalence/>, courbe: <CarteCourbe/>, indicateur: <CarteIndicateur/>,
};
