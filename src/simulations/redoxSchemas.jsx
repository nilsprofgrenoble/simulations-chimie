// Schémas de la simulation « Oxydo-réduction » (sim 156) : espèces et équations en HTML, bécher avec lame, schémas des cartes « À retenir ».
// Tous les schémas ont width="100%" et un maxWidth ; textes ≥ 13 dans un viewBox de 300 (≥ 11 px rendus sur téléphone).
import { ESPECES, texte, COL } from './redoxModele';

const cadreSvg = { display: 'block', margin: '0 auto', background: 'white', borderRadius: 12, border: '1px solid #d5dfeb' };

// ---------- espèces et équations en HTML (indices et exposants) ----------
/** Formule d'une espèce avec indices et charge en exposant ; etat = true ajoute (aq), (s)… */
export function Esp({ id, etat = false }) {
  const s = ESPECES[id];
  const morceaux = s.f.split(/(\d+)/).filter(x => x !== '');
  const q = s.q === 0 ? '' : `${Math.abs(s.q) > 1 ? Math.abs(s.q) : ''}${s.q > 0 ? '+' : '−'}`;
  return (<span style={{ whiteSpace: 'nowrap' }}>
    {morceaux.map((m, k) => (/^\d+$/.test(m) ? <sub key={k}>{m}</sub> : <span key={k}>{m}</span>))}
    {q && <sup>{q}</sup>}{etat && s.etat ? <span style={{ fontSize: '0.82em' }}>({s.etat})</span> : null}
  </span>);
}
/** Un membre d'équation : termes [[id, coef]] ; inconnu = true remplace les coefficients par « ? » (sauf pour e⁻ s'il n'y en a pas). */
export function Membre({ termes, etat = true, inconnu = false, couleur }) {
  const t = termes.filter(([, c]) => c > 0);
  return (<>{t.map(([id, c], k) => (
    <span key={id}>{' '}<span style={{ whiteSpace: 'nowrap', color: couleur }}>
      {k > 0 && <span style={{ marginRight: '0.3em' }}>+</span>}
      {inconnu ? <span style={{ color: COL.orange, fontWeight: 800 }}>? </span> : c > 1 ? <span>{c} </span> : null}
      <Esp id={id} etat={etat && id !== 'em'}/>
    </span></span>))}</>);
}
/** Équation « membre → membre » (ou « = » pour une demi-équation). */
export function Eq({ g, d, signe = '→', etat = true, inconnu = false, taille = 17 }) {
  return (<span style={{ fontSize: taille, lineHeight: 1.7, color: COL.encre }}>
    <Membre termes={g} etat={etat} inconnu={inconnu}/>{' '}<span style={{ whiteSpace: 'nowrap' }}>{signe}</span><Membre termes={d} etat={etat} inconnu={inconnu}/>
  </span>);
}

// ---------- couleurs ----------
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const melange = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(',')})`; };
const METAL = { Fe: '#6b7280', Cu: '#c2703d', Zn: '#a3a9b3', Al: '#cfd4da', Ag: '#d9dde3' };
const DEPOT = { Cu: '#b4562a', Ag: '#f1f5f9' };

/**
 * Bécher avec solution et lame (ou sans lame). t de 0 à 1 : avancement de la transformation (couleur de la solution, dépôt, bulles, lame qui s'use).
 * plaque : symbole du métal de la lame ; depot : métal qui se dépose ; gaz : bulles de H2.
 */
export function SvgBecher({ plaque = null, depot = null, gaz = false, avant, apres, t = 0, legendeHaut = '', legendeBas = '', goutte = false, titre = '' }) {
  const liquide = melange(avant, apres, Math.min(1, t * 1.15));
  const largeurLame = 22 - (!depot && plaque ? 10 * t : 0) * 1.0;
  const x0 = 150 - largeurLame / 2;
  return (
    <svg viewBox="0 0 300 236" width="100%" role="img" aria-label={titre || `Bécher contenant une solution${plaque ? ` et une lame de ${plaque}` : ''}`} style={{ ...cadreSvg, maxWidth: 400 }}>
      {legendeHaut && <text x="150" y="19" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.encre}>{legendeHaut}</text>}
      <rect x="62" y="92" width="176" height="98" rx="4" fill={liquide} stroke="none"/>
      {plaque && <g>
        <rect x={x0} y="34" width={largeurLame} height="130" rx="2" fill={METAL[plaque]} stroke="#475569" strokeWidth="1"/>
        {depot && <rect x={x0 - 0.5} y="92" width={largeurLame + 1} height="72" rx="2" fill={DEPOT[depot]} fillOpacity={Math.min(0.95, t * 1.2)} stroke={depot === 'Ag' ? '#94a3b8' : 'none'} strokeOpacity={t}/>}
        {depot === 'Cu' && t > 0.15 && Array.from({ length: Math.round(8 * t) }, (_, k) => <circle key={k} cx={x0 + (k % 2 ? largeurLame + 3 : -3)} cy={100 + k * 8} r={2.4 + (k % 3)} fill={DEPOT[depot]}/>)}
        {depot === 'Ag' && t > 0.15 && Array.from({ length: Math.round(8 * t) }, (_, k) => { const cx = x0 + (k % 2 ? largeurLame + 4 : -4), cy = 100 + k * 8, r = 3.5 + (k % 3); return <polygon key={k} points={`${cx},${cy - r} ${cx + r},${cy + r * 0.8} ${cx - r * 0.9},${cy + r * 0.6}`} fill="#9aa4b2" stroke="#475569" strokeWidth="0.8"/>; })}
      </g>}
      {gaz && Array.from({ length: Math.round(9 * t) }, (_, k) => <circle key={k} cx={x0 + (k % 2 ? largeurLame + 7 + (k % 3) * 4 : -7 - (k % 3) * 4)} cy={150 - k * 9} r={3 + (k % 3)} fill="white" fillOpacity="0.85" stroke="#64748b" strokeWidth="1"/>)}
      {goutte && t < 0.99 && <g><path d="M150 40 q-6 11 0 15 q6 -4 0 -15z" fill={avant === '#8e2a9e' ? '#8e2a9e' : '#f0b04e'} stroke="#475569" strokeWidth="1"/></g>}
      <path d="M60 52 V186 q0 8 8 8 H232 q8 0 8 -8 V52" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
      <line x1="62" y1="92" x2="238" y2="92" stroke="#475569" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
      {legendeBas && <text x="150" y="222" fontSize="13.5" fontWeight="700" textAnchor="middle" fill={COL.encre}>{legendeBas}</text>}
    </svg>);
}

// ---------- petites scènes du parcours ----------
const Bille = ({ cx, cy, r = 24, fond, texteC, sous }) => (<g>
  <circle cx={cx} cy={cy} r={r} fill={fond} stroke="#475569" strokeWidth="1.5"/>
  <text x={cx} y={cy + 5} fontSize="15" fontWeight="800" textAnchor="middle" fill={texteC || COL.encre}>{sous}</text>
</g>);

/** Un ion qui devient un atome : « charge +2 → charge 0 », le nombre d'électrons est demandé (n inconnu si montre = false). */
export function SvgIonAtome({ ion, atome, n, montre }) {
  return (
    <svg viewBox="0 0 300 150" width="100%" role="img" aria-label={`Un ion ${texte(ion)} devient un atome ${texte(atome)}.`} style={{ ...cadreSvg, maxWidth: 400 }}>
      <Bille cx="55" cy="58" r="34" fond="#bfe3f7" sous={texte(ion)}/>
      <Bille cx="245" cy="58" r="34" fond="#f2c9a4" sous={texte(atome)}/>
      <line x1="95" y1="58" x2="205" y2="58" stroke={COL.encre} strokeWidth="2.5"/><path d="M205 58 l-10 -6 v12z" fill={COL.encre}/>
      <text x="150" y="46" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>{montre ? `+ ${n} e⁻` : '+ ? e⁻'}</text>
      <text x="55" y="112" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.bleu}>charge {ESPECES[ion].q > 0 ? '+' : '−'}{Math.abs(ESPECES[ion].q)}</text>
      <text x="245" y="112" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.gris}>charge 0</text>
      <text x="150" y="140" fontSize="13" textAnchor="middle" fill={COL.gris}>La charge d’un électron est négative.</text>
    </svg>);
}

/** Transfert d'électrons du fer vers l'ion cuivre(II) : flèche d'électrons de la lame vers la solution. */
export function SvgTransfert() {
  return (
    <svg viewBox="0 0 300 190" width="100%" role="img" aria-label="Deux électrons passent d’un atome de fer à un ion cuivre(II) : le fer devient Fe²⁺ et l’ion devient un atome de cuivre." style={{ ...cadreSvg, maxWidth: 400 }}>
      <Bille cx="52" cy="95" r="30" fond="#d1d5db" sous="Fe"/>
      <Bille cx="248" cy="95" r="30" fond="#bfe3f7" sous="Cu²⁺"/>
      <path d="M82 80 C 120 20, 180 20, 218 80" fill="none" stroke={COL.orange} strokeWidth="2.5"/><path d="M218 80 l-3 -12 l-9 8z" fill={COL.orange}/>
      <circle cx="114" cy="46" r="8" fill={COL.orange}/><circle cx="186" cy="46" r="8" fill={COL.orange}/>
      <text x="150" y="112" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>2 e⁻ transférés</text>
      <text x="52" y="150" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.gris}>atome Fe</text>
      <text x="248" y="150" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.bleu}>ion Cu²⁺</text>
      <text x="52" y="172" fontSize="13" textAnchor="middle" fill={COL.gris}>→ devient Fe²⁺</text>
      <text x="248" y="172" fontSize="13" textAnchor="middle" fill={COL.gris}>→ devient Cu</text>
    </svg>);
}

// ====================================================================
//  SCHÉMAS DES CARTES « À RETENIR » (viewBox 300 de large, textes 13 à 16)
// ====================================================================
const T = ({ x, y, s = 14, w = 700, c = COL.encre, a = 'middle', children }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Svg = ({ h, label, children }) => <svg viewBox={`0 0 300 ${h}`} width="100%" role="img" aria-label={label} style={{ ...cadreSvg, maxWidth: 320 }}>{children}</svg>;
const Fleche = ({ x1, y1, x2, y2, c = COL.encre }) => { const a = Math.atan2(y2 - y1, x2 - x1), p = d => `${x2 - 11 * Math.cos(a + d * 0.45)},${y2 - 11 * Math.sin(a + d * 0.45)}`; return (<g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.5"/><polygon points={`${x2},${y2} ${p(1)} ${p(-1)}`} fill={c}/></g>); };

/** Carte 1 : oxydant et réducteur d'un couple (Fe³⁺ / Fe²⁺). */
export function SvgCouple() {
  return (
    <Svg h="176" label="Un couple Ox/Red : l’oxydant capte des électrons et devient le réducteur ; le réducteur cède des électrons et devient l’oxydant. Exemple Fe³⁺/Fe²⁺.">
      <rect x="10" y="14" width="112" height="56" rx="10" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2"/>
      <rect x="178" y="14" width="112" height="56" rx="10" fill="#fef3c7" stroke={COL.orange} strokeWidth="2"/>
      <T x="66" y="38" s={16} c={COL.bleu}>OXYDANT</T><T x="66" y="58" s={14} w={600}>Fe³⁺</T>
      <T x="234" y="38" s={16} c={COL.orange}>RÉDUCTEUR</T><T x="234" y="58" s={14} w={600}>Fe²⁺</T>
      <Fleche x1="126" y1="30" x2="174" y2="30" c={COL.bleu}/><Fleche x1="174" y1="54" x2="126" y2="54" c={COL.orange}/>
      <T x="150" y="24" s={13} c={COL.bleu}>capte e⁻</T><T x="150" y="76" s={13} c={COL.orange}>cède e⁻</T>
      <T x="150" y="106" s={15}>couple Ox / Red : Fe³⁺ / Fe²⁺</T>
      <T x="150" y="132" s={14} c={COL.vert}>L’oxydant CAPTE, le réducteur CÈDE.</T>
      <T x="150" y="156" s={13} w={600} c={COL.gris}>Ox et Red ne diffèrent que d’électrons.</T>
    </Svg>);
}
/** Carte 2 : la demi-équation Ox + n e⁻ = Red. */
export function SvgDemiEquation() {
  return (
    <Svg h="206" label="Écriture d’une demi-équation : Ox plus n électrons égale Red, avec le signe égal ou une double flèche, jamais une flèche simple. Exemple : Zn²⁺ + 2 e⁻ = Zn.">
      <rect x="8" y="12" width="284" height="50" rx="10" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2"/>
      <T x="150" y="45" s={20}>Ox + n e⁻ = Red</T>
      <T x="150" y="86" s={14} c={COL.gris}>exemple : le couple Zn²⁺ / Zn</T>
      <T x="150" y="112" s={19}>Zn²⁺ + 2 e⁻ = Zn</T>
      <T x="150" y="136" s={13} w={600} c={COL.vert}>charge : +2 − 2 = 0 des deux côtés</T>
      <T x="150" y="164" s={14} c={COL.rouge}>Zn²⁺ + 2 e⁻ → Zn : pas de flèche simple</T>
      <T x="150" y="184" s={13} w={600} c={COL.gris}>La demi-équation est un modèle :</T>
      <T x="150" y="200" s={13} w={600} c={COL.gris}>elle n’a pas lieu seule.</T>
    </Svg>);
}
/** Carte 3 : oxydation et réduction, par les électrons (Fe / Fe²⁺). */
export function SvgOxRed() {
  return (
    <Svg h="222" label="Réduction : l’oxydant gagne des électrons, ils sont écrits à gauche (Ox + n e⁻ = Red). Oxydation : le réducteur perd des électrons, ils sont écrits à droite (Red = Ox + n e⁻). Exemple : Fe devient Fe²⁺ + 2 e⁻ par oxydation.">
      <rect x="8" y="12" width="284" height="84" rx="10" fill="#fef3c7" stroke={COL.orange} strokeWidth="2"/>
      <T x="150" y="36" s={16} c={COL.orange}>OXYDATION : perte d’e⁻</T>
      <T x="150" y="64" s={18}>Fe → Fe²⁺ + 2 e⁻</T>
      <T x="150" y="86" s={13} w={600}>les e⁻ sont à DROITE</T>
      <rect x="8" y="108" width="284" height="84" rx="10" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2"/>
      <T x="150" y="132" s={16} c={COL.bleu}>RÉDUCTION : gain d’e⁻</T>
      <T x="150" y="160" s={18}>Cu²⁺ + 2 e⁻ → Cu</T>
      <T x="150" y="182" s={13} w={600}>les e⁻ sont à GAUCHE</T>
      <T x="150" y="212" s={13} w={600} c={COL.gris}>Réduction = Reçoit des électrons</T>
    </Svg>);
}
/** Carte 4 : la méthode d'équilibrage de l'équation de réaction (Cu / Ag⁺). */
export function SvgMethodeEquation() {
  return (
    <Svg h="226" label="Méthode : écrire les deux demi-équations dans le bon sens, multiplier pour égaliser les électrons, additionner : les électrons disparaissent. Exemple Cu et Ag⁺ : Cu + 2 Ag⁺ donne Cu²⁺ + 2 Ag.">
      <T x="150" y="20" s={14} c={COL.bleu}>① demi-équations, dans le bon sens</T>
      <T x="150" y="42" s={14} w={600}>Ag⁺ + e⁻ = Ag      Cu = Cu²⁺ + 2 e⁻</T>
      <T x="150" y="70" s={14} c={COL.orange}>② même nombre d’électrons : ×2 et ×1</T>
      <T x="150" y="92" s={14} w={600}>2 Ag⁺ + 2 e⁻ = 2 Ag</T>
      <T x="150" y="112" s={14} w={600}>Cu = Cu²⁺ + 2 e⁻</T>
      <T x="150" y="140" s={14} c={COL.vert}>③ on additionne : les e⁻ disparaissent</T>
      <rect x="10" y="150" width="280" height="40" rx="10" fill="#dcfce7" stroke={COL.vert} strokeWidth="2"/>
      <T x="150" y="176" s={17}>Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag</T>
      <T x="150" y="212" s={13} w={600} c={COL.gris}>Moyen : « égaliser, additionner, simplifier »</T>
    </Svg>);
}
/** Carte 5 : demi-équation en milieu acide, quatre temps (MnO4⁻ / Mn²⁺). */
export function SvgAcide() {
  return (
    <Svg h="232" label="Équilibrer une demi-équation en milieu acide en quatre temps : éléments autres que O et H, oxygène avec H₂O, hydrogène avec H⁺, charges avec e⁻. Exemple : MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O.">
      <T x="150" y="18" s={14} c={COL.bleu}>MnO₄⁻ + … H⁺ + … e⁻ = Mn²⁺ + … H₂O</T>
      <T x="14" y="46" s={14} a="start" c={COL.bleu}>① Mn : 1 de chaque côté</T>
      <T x="14" y="70" s={14} a="start" c={COL.orange}>② O : 4 O à gauche → 4 H₂O</T>
      <T x="14" y="94" s={14} a="start" c={COL.vert}>③ H : 8 H dans 4 H₂O → 8 H⁺</T>
      <T x="14" y="118" s={14} a="start" c={COL.rouge}>④ charges : −1 + 8 = +7 ; +2</T>
      <T x="14" y="138" s={14} a="start" c={COL.rouge}>   donc 5 e⁻ pour passer de +7 à +2</T>
      <rect x="8" y="152" width="284" height="44" rx="10" fill="#dcfce7" stroke={COL.vert} strokeWidth="2"/>
      <T x="150" y="180" s={15}>MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O</T>
      <T x="150" y="218" s={13} w={600} c={COL.gris}>Ordre : « X, O, H, charges » (les e⁻ en dernier)</T>
    </Svg>);
}
/** Carte de l'exploration : les vérifications d'une équation. */
export function SvgVerifications() {
  return (
    <Svg h="176" label="Trois vérifications d’une équation de réaction : chaque élément conservé, la charge totale conservée, aucun électron dans l’équation. Exemple : Cu + 2 Ag⁺ donne Cu²⁺ + 2 Ag, charge +2 de chaque côté.">
      <T x="150" y="22" s={16}>Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag</T>
      <rect x="10" y="38" width="280" height="30" rx="8" fill="#dcfce7" stroke={COL.vert} strokeWidth="1.5"/>
      <T x="150" y="59" s={14} c={COL.vert}>éléments : 1 Cu et 2 Ag de chaque côté</T>
      <rect x="10" y="74" width="280" height="30" rx="8" fill="#dcfce7" stroke={COL.vert} strokeWidth="1.5"/>
      <T x="150" y="95" s={14} c={COL.vert}>charge : 0 + 2 = +2 et +2 + 0 = +2</T>
      <rect x="10" y="110" width="280" height="30" rx="8" fill="#dcfce7" stroke={COL.vert} strokeWidth="1.5"/>
      <T x="150" y="131" s={14} c={COL.vert}>électrons : aucun e⁻ dans l’équation</T>
      <T x="150" y="162" s={13} w={600} c={COL.gris}>Moyen : « éléments, charge, pas d’électrons »</T>
    </Svg>);
}
