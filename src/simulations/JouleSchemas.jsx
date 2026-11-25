// Schémas de la simulation 232 (effet Joule) : scène du circuit et cartes « À retenir ».
// Règles : police ≥ 15 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fil: '#334155' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 232, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Fleche = ({ x1, y1, x2, y2, c = COL.fil, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11, d = 0.45;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - 6 * Math.cos(a)} y2={y2 - 6 * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={p} fill={c}/></g>;
};
const Boite = ({ x, y = 14, w = 108, h = 70, titre, val, c }) => <g><rect x={x} y={y} width={w} height={h} rx="10" fill="white" stroke={c} strokeWidth="3"/><text x={x + w / 2} y={y + 26} textAnchor="middle" fontSize="15" fill={COL.gris}>{titre}</text><text x={x + w / 2} y={y + 54} textAnchor="middle" fontSize="20" fontWeight="800" fill={c}>{val}</text></g>;
const Op = ({ x, y = 56, t }) => <text x={x} y={y + 8} textAnchor="middle" fontSize="26" fontWeight="800" fill={COL.encre}>{t}</text>;
const Trois = ({ a, b, c, op1 = '×', op2 = '=' }) => <g>
  <Boite x={8} {...a}/><Op x={132} t={op1}/><Boite x={146} {...b}/><Op x={270} t={op2}/><Boite x={284} {...c}/></g>;

// ═════════ Scène : générateur, résistor chauffant, ondes de chaleur (chauffe de 0 à 1) ═════════
export function SceneJoule({ chauffe = 0.5, courant = false, cable = false }) {
  const c = Math.min(1, Math.max(0, chauffe));
  const r = Math.round(120 + 135 * c), g = Math.round(200 - 140 * c), b = Math.round(220 - 190 * c);
  return (
    <svg viewBox="0 0 400 210" style={base} role="img" aria-label="Schéma : un générateur alimente un résistor par deux fils. Le résistor s’échauffe quand le courant le traverse ; des ondes de chaleur montent au-dessus de lui.">
      <polyline points="64,70 64,26 316,26 316,70" fill="none" stroke={COL.fil} strokeWidth="3"/>
      <polyline points="64,150 64,186 316,186 316,150" fill="none" stroke={COL.fil} strokeWidth="3"/>
      {cable && <rect x="150" y="18" width="48" height="16" rx="4" fill="#fde68a" stroke={COL.orange} strokeWidth="2"/>}
      {cable && <text x="174" y="12" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.orange} {...halo}>câble</text>}
      <line x1="40" y1="70" x2="88" y2="70" stroke={COL.encre} strokeWidth="4"/><line x1="50" y1="86" x2="78" y2="86" stroke={COL.encre} strokeWidth="2.5"/>
      <line x1="40" y1="102" x2="88" y2="102" stroke={COL.encre} strokeWidth="4"/><line x1="50" y1="118" x2="78" y2="118" stroke={COL.encre} strokeWidth="2.5"/>
      <line x1="64" y1="70" x2="64" y2="62" stroke={COL.fil} strokeWidth="3"/><line x1="64" y1="118" x2="64" y2="150" stroke={COL.fil} strokeWidth="3"/>
      <text x="100" y="84" fontSize="18" fontWeight="800" fill={COL.rouge}>+</text>
      <text x="64" y="178" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.encre} {...halo}>générateur</text>
      <rect x="276" y="70" width="80" height="80" rx="8" fill={`rgb(${r},${g},${b})`} stroke={COL.fil} strokeWidth="3"/>
      <polyline points="286,110 296,92 306,128 316,92 326,128 336,92 346,110" fill="none" stroke={COL.encre} strokeWidth="2.5" strokeLinejoin="round"/>
      <text x="316" y="172" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.encre} {...halo}>résistor</text>
      {c > 0.05 && [296, 316, 336].map((x, i) => <path key={i} d={`M${x} 64 q-8 -8 0 -16 q8 -8 0 -16`} fill="none" stroke={COL.orange} strokeWidth="2.5" strokeLinecap="round" opacity={0.35 + 0.65 * c}/>)}
      {courant && <g><Fleche x1="110" y1="26" x2="150" y2="26" c={COL.orange} w={3.5}/><text x="130" y="52" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.orange} {...halo}>I</text></g>}
    </svg>);
}

// ═════════ Carte A : loi d'Ohm I = U ÷ R (exemple 9 V, 30 Ω) ═════════
export function SvgOhm() {
  return (
    <Fond h={176} label="Schéma : la loi d’Ohm relie la tension aux bornes d’un résistor, sa résistance et l’intensité qui le traverse.">
      <Trois a={{ titre: 'tension U', val: '9,0 V', c: COL.bleu }} b={{ titre: 'résistance R', val: '30 Ω', c: COL.gris }} c={{ titre: 'intensité I', val: '0,30 A', c: COL.orange }} op1="÷"/>
      <text x="200" y="120" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>U = R × I , donc I = U ÷ R</text>
      <text x="200" y="146" textAnchor="middle" fontSize="15" fill={COL.gris}>volt (V) = ohm (Ω) × ampère (A)</text>
    </Fond>);
}

// ═════════ Carte B : puissance P = U × I = R × I² (exemple 30 Ω, 0,30 A) ═════════
export function SvgPuissanceJoule() {
  return (
    <Fond h={214} label="Schéma : la puissance reçue par un résistor est la tension fois l’intensité, ou la résistance fois le carré de l’intensité.">
      <Trois a={{ titre: 'tension U', val: '9,0 V', c: COL.bleu }} b={{ titre: 'intensité I', val: '0,30 A', c: COL.orange }} c={{ titre: 'puissance P', val: '2,7 W', c: COL.vert }}/>
      <text x="200" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>P = U × I</text>
      <rect x="40" y="134" width="320" height="64" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/>
      <text x="200" y="160" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.vert}>P = R × I²  (avec U = R × I)</text>
      <text x="200" y="184" textAnchor="middle" fontSize="15" fill={COL.gris}>30 × 0,30² = 2,7 W</text>
    </Fond>);
}

// ═════════ Carte C : énergie W = P × Δt (exemple 2,7 W pendant 60 s) ═════════
export function SvgEnergieJoule() {
  return (
    <Fond h={188} label="Schéma : l’énergie transférée est la puissance multipliée par la durée, en joules.">
      <Trois a={{ titre: 'puissance P', val: '2,7 W', c: COL.vert }} b={{ titre: 'durée Δt', val: '60 s', c: COL.bleu }} c={{ titre: 'énergie W', val: '162 J', c: COL.orange }}/>
      <text x="200" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>W = P × Δt</text>
      <text x="200" y="144" textAnchor="middle" fontSize="15" fill={COL.gris}>joule (J) = watt (W) × seconde (s)</text>
      <text x="200" y="168" textAnchor="middle" fontSize="15" fill={COL.gris}>Δt en secondes : 1 min = 60 s</text>
    </Fond>);
}

// ═════════ Carte D : conversion intégrale en énergie thermique ═════════
export function SvgConversion() {
  return (
    <Fond h={214} label="Schéma : toute l’énergie électrique reçue par un résistor est convertie en énergie thermique : c’est l’effet Joule.">
      <rect x="14" y="40" width="120" height="70" rx="10" fill="white" stroke={COL.bleu} strokeWidth="3"/>
      <text x="74" y="66" textAnchor="middle" fontSize="15" fill={COL.gris}>énergie</text><text x="74" y="90" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.bleu}>électrique</text>
      <Fleche x1="140" y1="75" x2="198" y2="75" c={COL.fil}/>
      <rect x="204" y="52" width="64" height="46" rx="6" fill="#fed7aa" stroke={COL.fil} strokeWidth="2.5"/>
      <polyline points="212,75 220,62 228,88 236,62 244,88 252,62 260,75" fill="none" stroke={COL.encre} strokeWidth="2.2"/>
      <Fleche x1="274" y1="75" x2="288" y2="75" c={COL.fil} w={2.5}/>
      <rect x="292" y="40" width="100" height="70" rx="10" fill="white" stroke={COL.orange} strokeWidth="3"/>
      <text x="342" y="66" textAnchor="middle" fontSize="15" fill={COL.gris}>énergie</text><text x="342" y="90" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.orange}>thermique</text>
      <text x="200" y="140" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>effet Joule : Q thermique = W électrique</text>
      <text x="200" y="168" textAnchor="middle" fontSize="15" fill={COL.gris}>conversion intégrale dans un résistor</text>
      <text x="200" y="192" textAnchor="middle" fontSize="15" fill={COL.gris}>utile pour chauffer, perte pour un câble</text>
    </Fond>);
}

// ═════════ Carte E : pertes dans un câble r × I² (exemple 0,20 Ω, 5,0 A) ═════════
export function SvgPertesCable() {
  return (
    <Fond h={214} label="Schéma : un câble de résistance r parcouru par un courant I dissipe par effet Joule une puissance r fois I au carré. Cette puissance est perdue.">
      <Trois a={{ titre: 'résistance r', val: '0,20 Ω', c: COL.gris }} b={{ titre: 'intensité I', val: '5,0 A', c: COL.orange }} c={{ titre: 'pertes', val: '5,0 W', c: COL.rouge }}/>
      <text x="200" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>pertes = r × I²</text>
      <text x="200" y="146" textAnchor="middle" fontSize="15" fill={COL.gris}>0,20 × 5,0² = 5,0 W</text>
      <rect x="40" y="158" width="320" height="42" rx="8" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2"/>
      <text x="200" y="184" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.rouge}>I × 2 : pertes × 4</text>
    </Fond>);
}

// ═════════ Carte F (bilan) : haute tension pour transporter la puissance ═════════
export function SvgHauteTension() {
  const Ligne = ({ y, U, I, p, c }) => <g>
    <text x="30" y={y + 6} fontSize="16" fontWeight="800" fill={c}>{U}</text>
    <rect x="96" y={y - 10} width={I} height="20" rx="4" fill={c} opacity="0.85"/>
    <text x={104 + I} y={y + 6} fontSize="15" fontWeight="700" fill={COL.encre}>I = {p}</text></g>;
  return (
    <Fond h={206} label="Schéma : pour transporter la même puissance, une tension plus élevée donne une intensité plus petite, donc de bien moindres pertes dans le câble.">
      <text x="200" y="26" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>même puissance transportée : 240 W</text>
      <Ligne y={68} U="24 V" I={160} p="10 A" c={COL.rouge}/>
      <Ligne y={110} U="240 V" I={16} p="1,0 A" c={COL.vert}/>
      <text x="200" y="154" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>pertes = r × I² : U × 10, pertes ÷ 100</text>
      <text x="200" y="182" textAnchor="middle" fontSize="15" fill={COL.gris}>c’est pourquoi on transporte à haute tension</text>
    </Fond>);
}
