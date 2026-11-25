// Schémas de la simulation 231 (batterie) : scène batterie + récepteur et cartes « À retenir ».
// Règles : police ≥ 15 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fil: '#334155' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 232, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const fr = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const Fleche = ({ x1, y1, x2, y2, c = COL.fil, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11, d = 0.45;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - 6 * Math.cos(a)} y2={y2 - 6 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};
// Une boîte : titre, valeur, couleur
const Boite = ({ x, y = 14, w = 108, h = 70, titre, val, c }) => <g><rect x={x} y={y} width={w} height={h} rx="10" fill="white" stroke={c} strokeWidth="3"/><text x={x + w / 2} y={y + 26} textAnchor="middle" fontSize="15" fill={COL.gris}>{titre}</text><text x={x + w / 2} y={y + 54} textAnchor="middle" fontSize="20" fontWeight="800" fill={c}>{val}</text></g>;
const Op = ({ x, y = 56, t }) => <text x={x} y={y + 8} textAnchor="middle" fontSize="26" fontWeight="800" fill={COL.encre}>{t}</text>;
// Trois boîtes reliées par deux opérateurs
const Trois = ({ a, b, c, op1 = '×', op2 = '=' }) => <g>
  <Boite x={8} {...a}/><Op x={132} t={op1}/><Boite x={146} {...b}/><Op x={270} t={op2}/><Boite x={284} {...c}/></g>;

// ═════════ Scène : batterie qui alimente un récepteur (jauge de charge restante) ═════════
export function SceneBatterie({ fraction = 1, courant = false, P = 10 }) {
  const f = Math.min(1, Math.max(0, fraction)), hJ = 96 * f;
  const lum = Math.min(1, 0.35 + 0.65 * (f > 0 ? 1 : 0));
  return (
    <svg viewBox="0 0 400 210" style={base} role="img" aria-label="Schéma : une batterie, avec sa jauge de charge restante, alimente un récepteur par deux fils. Le courant sort du pôle plus de la batterie.">
      <rect x="44" y="46" width="100" height="120" rx="10" fill="#f1f5f9" stroke={COL.fil} strokeWidth="3"/>
      <rect x="78" y="36" width="32" height="10" rx="2" fill={COL.fil}/>
      <rect x="54" y={154 - hJ} width="80" height={hJ} rx="4" fill={f > 0.5 ? '#86efac' : f > 0.2 ? '#fde68a' : '#fca5a5'} stroke={f > 0 ? COL.vert : 'none'} strokeWidth="1.5"/>
      <text x="94" y="32" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.rouge} {...halo}>+</text>
      <text x="94" y="188" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>batterie</text>
      <polyline points="94,36 94,14 296,14 296,66" fill="none" stroke={COL.fil} strokeWidth="3"/>
      <polyline points="94,166 94,198 296,198 296,150" fill="none" stroke={COL.fil} strokeWidth="3"/>
      <circle cx="296" cy="108" r="40" fill={`rgba(253,224,71,${lum})`} stroke={COL.fil} strokeWidth="3"/>
      <path d="M276 126 L286 94 L296 118 L306 94 L316 126" fill="none" stroke={COL.encre} strokeWidth="2.5" strokeLinejoin="round"/>
      <text x="296" y="172" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>récepteur</text>
      {courant && <g><Fleche x1="170" y1="14" x2="230" y2="14" c={COL.orange} w={3.5}/><text x="200" y="40" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.orange} {...halo}>I</text></g>}
    </svg>);
}

// ═════════ Carte A : courant et charge, Q = I × Δt ═════════
export function SvgCharge() {
  return (
    <Fond h={168} label="Schéma : la charge électrique est le produit de l’intensité du courant par la durée, Q égale I fois delta t.">
      <Trois a={{ titre: 'intensité I', val: '2,0 A', c: COL.orange }} b={{ titre: 'durée Δt', val: '10 s', c: COL.bleu }} c={{ titre: 'charge Q', val: '20 C', c: COL.vert }}/>
      <text x="200" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Q = I × Δt</text>
      <text x="200" y="142" textAnchor="middle" fontSize="15" fill={COL.gris}>coulomb (C) = ampère (A) × seconde (s)</text>
    </Fond>);
}

// ═════════ Carte B : capacité et durée, Δt = Qs ÷ I ═════════
export function SvgCapacite() {
  return (
    <Fond h={190} label="Schéma : la durée de fonctionnement est la capacité divisée par l’intensité du courant débité.">
      <Trois a={{ titre: 'capacité Qs', val: '5,0 Ah', c: COL.vert }} b={{ titre: 'intensité I', val: '2,0 A', c: COL.orange }} c={{ titre: 'durée Δt', val: '2,5 h', c: COL.bleu }} op1="÷"/>
      <text x="200" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Δt = Qs ÷ I</text>
      <text x="200" y="142" textAnchor="middle" fontSize="15" fill={COL.gris}>Ah ÷ A = h</text>
      <text x="200" y="168" textAnchor="middle" fontSize="15" fill={COL.gris}>1 Ah = 3 600 C : 1 A pendant 1 h</text>
    </Fond>);
}

// ═════════ Carte C : lire une fiche technique (exemple 6 V, 4,0 Ah) ═════════
export function SvgFiche() {
  const L = (y, nom, val, c, grand) => <g><text x="30" y={y} fontSize="16" fill={COL.encre} fontWeight={grand ? 800 : 400}>{nom}</text><text x="370" y={y} textAnchor="end" fontSize="16" fontWeight="800" fill={c || COL.encre}>{val}</text><line x1="24" y1={y + 8} x2="376" y2={y + 8} stroke="#e2e8f0" strokeWidth="1.5"/></g>;
  return (
    <Fond h={238} label="Schéma : extrait de fiche technique d’un accumulateur, avec la tension nominale, la capacité en ampères-heures et le courant de décharge maximal.">
      <rect x="14" y="12" width="372" height="148" rx="10" fill="#f8fafc" stroke={COL.fil} strokeWidth="2.5"/>
      <text x="200" y="38" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>fiche technique (extrait)</text>
      {L(66, 'tension nominale', '6 V', COL.bleu)}{L(94, 'capacité', '4,0 Ah', COL.vert, true)}{L(122, 'courant de décharge max', '10 A', COL.gris)}{L(150, 'masse', '0,85 kg', COL.gris)}
      <rect x="22" y="76" width="356" height="24" rx="5" fill="none" stroke={COL.vert} strokeWidth="2.5" strokeDasharray="5 3"/>
      <text x="200" y="190" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.vert}>capacité en Ah = quantité d’électricité stockée</text>
      <text x="200" y="214" textAnchor="middle" fontSize="15" fill={COL.gris}>la tension donne l’énergie par charge : à ne pas confondre</text>
    </Fond>);
}

// ═════════ Carte D : énergie disponible E = Qs × U (exemple 6 V, 4,0 Ah) ═════════
export function SvgEnergieDispo() {
  return (
    <Fond h={212} label="Schéma : l’énergie disponible d’une batterie est le produit de sa capacité en ampères-heures par sa tension, en wattheures. 1 wattheure vaut 3 600 joules.">
      <Trois a={{ titre: 'capacité Qs', val: '4,0 Ah', c: COL.vert }} b={{ titre: 'tension U', val: '6 V', c: COL.bleu }} c={{ titre: 'énergie E', val: '24 Wh', c: COL.orange }}/>
      <text x="200" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>E = Qs × U</text>
      <text x="200" y="146" textAnchor="middle" fontSize="15" fill={COL.gris}>Ah × V = Wh</text>
      <rect x="40" y="160" width="320" height="38" rx="8" fill="#fff7ed" stroke={COL.orange} strokeWidth="2"/>
      <text x="200" y="185" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>1 Wh = 3 600 J : 24 Wh = 86 400 J</text>
    </Fond>);
}

// ═════════ Carte E : durée avec un récepteur (exemple 6 V, 4,0 Ah, 12 W) ═════════
export function SvgDureeRecepteur() {
  return (
    <Fond h={214} label="Schéma : pour un récepteur de puissance P, l’intensité est P divisée par U, puis la durée est la capacité divisée par l’intensité, ou l’énergie divisée par la puissance.">
      <Trois a={{ titre: 'puissance P', val: '12 W', c: COL.orange }} b={{ titre: 'tension U', val: '6 V', c: COL.bleu }} c={{ titre: 'intensité I', val: '2,0 A', c: COL.rouge }} op1="÷"/>
      <Fleche x1="200" y1="92" x2="200" y2="112" c={COL.fil}/>
      <text x="200" y="136" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>Δt = Qs ÷ I = 4,0 ÷ 2,0 = 2,0 h</text>
      <text x="200" y="166" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.vert}>ou Δt = E ÷ P = 24 ÷ 12 = 2,0 h</text>
      <text x="200" y="198" textAnchor="middle" fontSize="15" fill={COL.gris}>W ÷ V = A ; Ah ÷ A = h ; Wh ÷ W = h</text>
    </Fond>);
}

// ═════════ Carte F : capacité n'est pas énergie (12 V, 7,0 Ah contre 3,7 V, 10 Ah) ═════════
export function SvgCapaciteEnergie() {
  const Bar = ({ x, nom, cap, U, E, h, c }) => <g>
    <rect x={x} y={150 - h} width="70" height={h} rx="6" fill={c} opacity="0.85"/>
    <text x={x + 35} y={142 - h} textAnchor="middle" fontSize="18" fontWeight="800" fill={c} {...halo}>{E} Wh</text>
    <text x={x + 35} y="172" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.encre}>{nom}</text>
    <text x={x + 35} y="192" textAnchor="middle" fontSize="15" fill={COL.gris}>{U} V, {cap} Ah</text></g>;
  return (
    <Fond h={238} label="Schéma : comparaison de l’énergie stockée par deux batteries. La batterie dont la capacité en ampères-heures est la plus grande n’est pas forcément celle qui stocke le plus d’énergie.">
      <line x1="30" y1="150" x2="370" y2="150" stroke={COL.fil} strokeWidth="2.5"/>
      <Bar x={70} nom="batterie 1" cap="7,0" U="12" E="84" h={102} c={COL.orange}/>
      <Bar x={250} nom="batterie 2" cap="10" U="3,7" E="37" h={45} c={COL.bleu}/>
      <text x="200" y="224" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>E = Qs × U : il faut la tension et la capacité</text>
      <text x="200" y="20" textAnchor="middle" fontSize="15" fill={COL.gris}>énergie stockée (exemple)</text>
    </Fond>);
}
