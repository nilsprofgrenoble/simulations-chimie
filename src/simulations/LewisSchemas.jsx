import { DessinLewis } from "./LewisScene";
import { entite, structureRef } from "./lewisModele";

// ====================================================
//  Schémas des cartes « À retenir » de la simulation 154 (Schéma de Lewis, 1G).
//  viewBox de 300 de large, textes de 13 à 18 (≥ 9 px rendus sur téléphone). Couleurs : bleu = liaison, orange = doublet non liant / grandeur à repérer, vert = bon, rouge = piège.
//  Les dessins de molécules viennent du même composant que l'éditeur (DessinLewis) : ils sont donc toujours conformes au modèle.
// ====================================================
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', clair: '#e2e8f0' };
const stl = { width: '100%', maxWidth: 300, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const T = (p) => <text fontSize="13" fill={COL.encre} {...p}/>;
const nT = <>n<tspan dy="4">T</tspan><tspan dy="-4"> </tspan></>;
const nD = <>n<tspan dy="4">D</tspan><tspan dy="-4"> </tspan></>;
const ref = id => { const e = entite(id); return [e, structureRef(e)]; };
const Mol = ({ id, ...p }) => { const [e, st] = ref(id); return <DessinLewis ent={e} st={st} fsA={15} fsC={12.5} {...p}/>; };

// ---------- carte 1 : électrons de valence et nombre de liaisons ----------
export function SvgValenceLiaisons() {
  const at = [['H', 1, 1], ['O', 6, 2], ['N', 5, 3], ['C', 4, 4], ['Cl', 7, 1]], X = k => 84 + 45 * k;
  return (
    <svg viewBox="0 0 300 224" style={stl} role="img"
      aria-label="Tableau : pour H, O, N, C et Cl, le nombre d’électrons de valence est 1, 6, 5, 4 et 7 ; le nombre de liaisons est 1, 2, 3, 4 et 1. Règle : liaisons égale 8 moins valence, 2 moins valence pour H.">
      {at.map(([s, v, l], k) => <g key={s}>
        <circle cx={X(k)} cy="34" r="16" fill="#fff" stroke={COL.gris} strokeWidth="1.6"/>
        <text x={X(k)} y="40" fontSize="16" fontWeight="800" textAnchor="middle" fill={COL.encre}>{s}</text>
        <text x={X(k)} y="86" fontSize="20" fontWeight="800" textAnchor="middle" fill={COL.orange}>{v}</text>
        <text x={X(k)} y="130" fontSize="20" fontWeight="800" textAnchor="middle" fill={COL.bleu}>{l}</text>
      </g>)}
      <T x="6" y="86" fontWeight="700" fill={COL.orange}>valence</T>
      <T x="6" y="130" fontWeight="700" fill={COL.bleu}>liaisons</T>
      <line x1="6" y1="54" x2="294" y2="54" stroke={COL.clair}/><line x1="6" y1="100" x2="294" y2="100" stroke={COL.clair}/>
      <text x="150" y="166" fontSize="16" fontWeight="800" textAnchor="middle" fill={COL.encre}>liaisons = 8 − valence</text>
      <T x="150" y="186" textAnchor="middle" fill={COL.gris}>(atome neutre ; pour H : 2 − 1)</T>
      <text x="150" y="212" fontSize="16" fontWeight="800" textAnchor="middle" fill={COL.orange}>H – O – N – C : 1 – 2 – 3 – 4</text>
    </svg>);
}

// ---------- carte 2 : la méthode en trois temps (exemple HCl) ----------
export function SvgMethode() {
  return (
    <svg viewBox="0 0 300 250" style={stl} role="img"
      aria-label="Méthode en trois temps pour HCl. Un : n T égale la somme des électrons de valence, 1 plus 7 égale 8. Deux : n D égale n T divisé par 2, soit 4 doublets. Trois : placer la liaison puis les doublets non liants et vérifier l’octet, 8 électrons autour de Cl, et le duet pour H. Schéma H tiret Cl avec trois doublets non liants sur Cl.">
      <rect x="8" y="8" width="284" height="48" rx="10" fill="#eff6ff" stroke={COL.bleu}/>
      <text x="18" y="29" fontSize="14.5" fontWeight="800" fill={COL.bleu}>① Compter : {nT}= Σ valences</text>
      <T x="18" y="48" fill={COL.gris}>HCl : 1 + 7 = 8 électrons</T>
      <rect x="8" y="64" width="284" height="48" rx="10" fill="#fff7ed" stroke={COL.orange}/>
      <text x="18" y="85" fontSize="14.5" fontWeight="800" fill={COL.orange}>② Doublets : {nD}= {nT}÷ 2</text>
      <T x="18" y="104" fill={COL.gris}>HCl : 8 ÷ 2 = 4 doublets</T>
      <rect x="8" y="120" width="284" height="122" rx="10" fill="#f0fdf4" stroke={COL.vert}/>
      <text x="18" y="141" fontSize="14.5" fontWeight="800" fill={COL.vert}>③ Placer</text>
      <T x="18" y="162">les liaisons d’abord,</T><T x="18" y="180">puis les doublets</T><T x="18" y="198">non liants.</T>
      <T x="18" y="222" fontWeight="700" fill={COL.vert}>Vérifier : 8 autour,</T><T x="18" y="238" fontWeight="700" fill={COL.vert}>2 autour de H.</T>
      <Mol id="HCl" cx={222} cy={178} s={0.6}/>
    </svg>);
}

// ---------- carte 3 : doublets liants et non liants (eau) ----------
export function SvgLiantsNonLiants() {
  return (
    <svg viewBox="0 0 300 242" style={stl} role="img"
      aria-label="Schéma de Lewis de l’eau : l’oxygène est lié à deux hydrogènes et porte deux doublets non liants. Un doublet liant est partagé entre deux atomes, un doublet non liant appartient à un seul atome. Autour de O : 2 fois 2 plus 2 fois 2 égale 8 électrons. Autour de H : 2 électrons, le duet.">
      <Mol id="H2O" cx={150} cy={64} s={0.95}/>
      <line x1="30" y1="140" x2="56" y2="140" stroke={COL.bleu} strokeWidth="3.4" strokeLinecap="round"/>
      <T x="64" y="145" fill={COL.bleu} fontWeight="700">doublet liant : entre 2 atomes</T>
      <line x1="30" y1="162" x2="56" y2="162" stroke={COL.orange} strokeWidth="3.4" strokeLinecap="round"/>
      <T x="64" y="167" fill={COL.orange} fontWeight="700">doublet non liant : sur 1 atome</T>
      <T x="18" y="190">Autour de O : 2×2 + 2×2 = 8 électrons ✓</T>
      <T x="18" y="208">Autour de H : 1×2 = 2 électrons ✓ (duet)</T>
      <text x="150" y="229" fontSize="14.5" fontWeight="800" textAnchor="middle" fill={COL.encre}>liants + non liants = {nD}</text>
    </svg>);
}

// ---------- carte 4 : liaisons doubles et triples ----------
export function SvgDoubleTriple() {
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img"
      aria-label="Schémas de Lewis de CO₂ avec deux liaisons doubles, et de N₂ avec une liaison triple. Liaison simple : 1 doublet partagé, double : 2, triple : 3. Quand l’octet n’est pas atteint avec des liaisons simples, on augmente l’ordre de la liaison.">
      <Mol id="CO2" cx={82} cy={62} s={0.6}/><Mol id="N2" cx={228} cy={62} s={0.6}/>
      <T x="82" y="116" textAnchor="middle" fontWeight="700">CO₂</T><T x="228" y="116" textAnchor="middle" fontWeight="700">N₂</T>
      <T x="82" y="133" textAnchor="middle" fill={COL.gris}>2 liaisons doubles</T><T x="228" y="133" textAnchor="middle" fill={COL.gris}>1 liaison triple</T>
      <line x1="10" y1="145" x2="290" y2="145" stroke={COL.clair}/>
      <text x="150" y="167" fontSize="15" fontWeight="800" textAnchor="middle" fill={COL.bleu}>simple 1 · double 2 · triple 3</text>
      <T x="150" y="185" textAnchor="middle" fill={COL.gris}>(nombre de doublets partagés)</T>
      <text x="150" y="208" fontSize="14.5" fontWeight="800" textAnchor="middle" fill={COL.orange}>Pas 8 autour d’un atome ?</text>
      <text x="150" y="226" fontSize="14.5" fontWeight="800" textAnchor="middle" fill={COL.orange}>Passe à une liaison double ou triple.</text>
    </svg>);
}

// ---------- carte 5 : les ions ----------
export function SvgIons() {
  return (
    <svg viewBox="0 0 300 268" style={stl} role="img"
      aria-label="Schémas de Lewis de l’ion oxonium H₃O⁺, avec la charge plus sur O, et de l’ion hydroxyde HO⁻, avec la charge moins sur O. Pour un cation on retire des électrons : n T égale la somme des valences moins la charge, soit 6 plus 3 moins 1 égale 8. Pour un anion on en ajoute : 6 plus 1 plus 1 égale 8.">
      <Mol id="H3Op" cx={78} cy={50} s={0.62}/><Mol id="HOm" cx={226} cy={50} s={0.66}/>
      <T x="78" y="130" textAnchor="middle" fontWeight="700">H₃O⁺</T><T x="226" y="130" textAnchor="middle" fontWeight="700">HO⁻</T>
      <line x1="10" y1="140" x2="290" y2="140" stroke={COL.clair}/>
      <text x="150" y="160" fontSize="15" fontWeight="800" textAnchor="middle" fill={COL.encre}>{nT}= Σ valences − charge</text>
      <T x="18" y="182" fill={COL.rouge} fontWeight="700">Cation (+) :</T><T x="108" y="182">6 + 3 − 1 = 8</T>
      <T x="18" y="200" fill={COL.bleu} fontWeight="700">Anion (−) :</T><T x="108" y="200">6 + 1 + 1 = 8</T>
      <T x="18" y="224">Charge d’un atome = valence − électrons</T>
      <T x="18" y="241">possédés (liaisons + 2 × doublets)</T>
      <T x="18" y="258" fill={COL.orange} fontWeight="700">cation : un + , un électron en moins</T>
    </svg>);
}

// ---------- carte 6 : la lacune électronique (H⁺ et Na⁺) ----------
export function SvgLacune() {
  return (
    <svg viewBox="0 0 300 240" style={stl} role="img"
      aria-label="Schéma de Lewis de H⁺ : l’atome H sans électron, avec un rectangle vide pour la lacune et la charge plus. Schéma de Na⁺ : Na avec la charge plus, sans rectangle car sa couche n égale 2 est pleine, 8 électrons. Un doublet manque pour H⁺ : lacune ; pas pour Na⁺.">
      <Mol id="Hp" cx={75} cy={66} s={1} fsA={18}/><Mol id="Nap" cx={225} cy={66} s={1} fsA={17}/>
      <T x="75" y="116" textAnchor="middle" fontWeight="700" fill={COL.bleu}>H⁺ : 0 électron</T><T x="225" y="116" textAnchor="middle" fontWeight="700" fill={COL.gris}>Na⁺ : {nT}= 0 aussi</T>
      <T x="75" y="136" textAnchor="middle">un doublet manque :</T><T x="225" y="136" textAnchor="middle">mais la couche n = 2</T>
      <T x="75" y="154" textAnchor="middle" fontWeight="700" fill={COL.bleu}>lacune (rectangle)</T><T x="225" y="154" textAnchor="middle">est pleine (8 e⁻)</T>
      <T x="225" y="172" textAnchor="middle" fontWeight="700" fill={COL.gris}>pas de rectangle</T>
      <line x1="10" y1="184" x2="290" y2="184" stroke={COL.clair}/>
      <T x="150" y="205" textAnchor="middle" fontWeight="700" fill={COL.rouge}>Faux : « 0 électron = lacune »</T>
      <T x="150" y="225" textAnchor="middle" fontWeight="700" fill={COL.vert}>Vrai : lacune si un doublet manque</T>
    </svg>);
}

// ---------- carte de l'exploration : les quatre vérifications d'un schéma (NH₄⁺) ----------
export function SvgVerifications() {
  return (
    <svg viewBox="0 0 300 260" style={stl} role="img"
      aria-label="Schéma de Lewis de l’ion ammonium NH₄⁺ avec quatre liaisons simples et la charge plus sur N. Quatre vérifications : le nombre de doublets égale n D ; l’octet ou le duet pour chaque atome ; la charge de chaque atome ; la lacune si un doublet manque.">
      <Mol id="NH4p" cx={90} cy={100} s={0.75}/>
      <T x="196" y="36" fontWeight="800" fill={COL.encre}>4 vérifications</T>
      <T x="196" y="62">① doublets placés</T><T x="208" y="78" fill={COL.gris}>= {nD}</T>
      <T x="196" y="102">② 8 autour de</T><T x="208" y="118" fill={COL.gris}>chaque atome</T><T x="208" y="134" fill={COL.gris}>(2 pour H)</T>
      <T x="196" y="158">③ charge de</T><T x="208" y="174" fill={COL.gris}>chaque atome</T>
      <T x="196" y="198">④ lacune si un</T><T x="208" y="214" fill={COL.gris}>doublet manque</T>
      <T x="90" y="190" textAnchor="middle" fontWeight="700" fill={COL.encre}>NH₄⁺</T>
      <T x="90" y="208" textAnchor="middle" fill={COL.gris}>4 doublets, tous liants</T>
      <T x="90" y="226" textAnchor="middle" fill={COL.gris}>N : 4 liaisons = 8 ✓</T>
      <T x="90" y="244" textAnchor="middle" fill={COL.rouge} fontWeight="700">charge + sur N</T>
    </svg>);
}
