// Schémas des cartes « À retenir » de la simulation 204 « Synthèse d'une espèce naturelle : montage à reflux et CCM » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver.
// viewBox de 300 de large (≈ 230 px sur téléphone) : textes de 13,5 à 16 ; schémas plafonnés à 320 px. Le montage est le MÊME dessin que dans les scènes (MontageGroupe, réduit de moitié).
import { COL, MontageGroupe, Fleche, C2 } from "./SyntheseReflux2gtScenes";
import * as G from "./syntheseReflux2gtGeometrie.js";
import * as M from "./syntheseReflux2gtModele.js";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const T = ({ x, y, children, c = COL.encre, w = 700, s = 14, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Pt = ({ x, y, c = '#7c2d12', r = 6.5 }) => <ellipse cx={x} cy={y} rx={r} ry={r * 0.85} fill={c} opacity={0.9} />;
const Pin = ({ x, y, n }) => <g><circle cx={x} cy={y} r={9.5} fill={COL.orange} /><text x={x} y={y + 5} textAnchor="middle" fontSize={13.5} fontWeight={800} fill="white">{n}</text></g>;
const Puce = ({ x, y, w, h = 44, l1, l2, fond = '#eff6ff', trait = '#0b4f94' }) => (
  <g><rect x={x} y={y} width={w} height={h} rx={9} fill={fond} stroke={trait} strokeWidth={2} /><T x={x + w / 2} y={y + 20} a="middle" s={15}>{l1}</T>{l2 && <T x={x + w / 2} y={y + 37} a="middle" s={13.5} w={600} c={COL.gris}>{l2}</T>}</g>);
const NB = M.NB;

// ── Carte 1 : fabriquer un ester ──
export function FicheSynthese() {
  return (
    <svg viewBox="0 0 300 292" style={stl} role="img" aria-label="Équation en formules et en mots : l’acide éthanoïque et l’alcool isoamylique donnent l’acétate d’isoamyle, qui a l’odeur de banane, et de l’eau. Au-dessus de la flèche : catalyseur et chauffage. Il y a autant d’atomes de chaque élément de chaque côté.">
      <Puce x={8} y={10} w={134} l1="CH₃COOH" l2="acide éthanoïque" /><T x={150} y={38} a="middle" s={20} c={COL.gris}>+</T><Puce x={158} y={10} w={134} l1="C₅H₁₁OH" l2="alcool isoamylique" />
      <Fleche x1={150} y1={64} x2={150} y2={110} c={COL.orange} w={4} t={12} />
      <T x={162} y={82} c={COL.orange} s={14}>catalyseur</T><T x={162} y={99} c={COL.orange} s={14}>et chauffage</T>
      <Puce x={8} y={120} w={170} l1="CH₃COOC₅H₁₁" l2="acétate d’isoamyle" fond="#fef9c3" trait="#a16207" /><T x={188} y={148} a="middle" s={20} c={COL.gris}>+</T><Puce x={198} y={120} w={94} l1="H₂O" l2="eau" />
      <T x={150} y={190} a="middle" s={14} c={COL.vert}>7 C, 16 H, 3 O de chaque côté</T>
      <rect x={8} y={202} width={284} height={80} rx={9} fill="#fff7ed" stroke={COL.orange} strokeWidth={1.6} />
      <T x={18} y={224} c={COL.orange} s={14}>réactifs : au départ (à gauche)</T>
      <T x={18} y={244} c={COL.orange} s={14}>produits : formés (à droite)</T>
      <T x={18} y={266} c={COL.bleu} s={14}>chauffer : plus vite, pas plus d’ester</T>
    </svg>);
}

// ── Carte 2 : le principe du reflux ──
export function FicheReflux() {
  const m = { ...M.MONTAGE_VIDE, chauffe: true, ballon: true, refrigerant: true, eau: 'bas', marche: true };
  const lien = (y, ax, ay) => <line x1={104} y1={y} x2={ax} y2={ay} stroke={COL.gris} strokeWidth={1.3} />;
  return (
    <svg viewBox="0 0 300 250" style={stl} role="img" aria-label="Un ballon chauffé surmonté d’un réfrigérant à eau. Trois repères : 1, le mélange bout et des vapeurs montent ; 2, le tube est refroidi par l’eau ; 3, les vapeurs redeviennent liquides et les gouttes retombent dans le ballon.">
      <g transform="translate(-60 6) scale(0.52)"><MontageGroupe montage={m} anim={false} /></g>
      {lien(182, 66, 182)}{lien(63, 75, 63)}{lien(108, 62, 108)}
      <Pin x={112} y={182} n={1} /><Pin x={112} y={63} n={2} /><Pin x={112} y={108} n={3} />
      <T x={128} y={177} s={14}>le mélange bout :</T><T x={128} y={194} s={14}>des vapeurs montent</T>
      <T x={128} y={58} s={14} c={C2.eauFonce}>le tube est refroidi</T><T x={128} y={75} s={14} c={C2.eauFonce}>par l’eau froide</T>
      <T x={128} y={103} s={14} c={C2.goutte}>elles redeviennent</T><T x={128} y={120} s={14} c={C2.goutte}>liquides : des gouttes</T><T x={128} y={137} s={14} c={C2.goutte}>retombent</T>
    </svg>);
}

// ── Carte 3 : le montage à reflux légendé ──
export function FicheMontage() {
  const m = M.MONTAGE_CORRECT, { s, dx, dy } = G.CARTE;
  const P = ([x, y]) => [dx + s * x, dy + s * y];
  const L = G.legendesAjustees(m);
  const pins = [[1, 'ballon', [216, 150]], [2, 'chauffe', [216, 196]], [3, 'support', [52, 205]], [4, 'refrigerant', [216, 61]], [5, 'entree', [246, 85]], [6, 'sortie', [246, 37]], [7, 'vapeurs', [146, 81]], [8, 'gouttes', [146, 111]], [9, 'air', [146, 16]]];
  const liste = [[1, 'ballon'], [2, 'chauffe-ballon'], [3, 'support'], [4, 'réfrigérant à eau'], [5, 'entrée d’eau'], [6, 'sortie d’eau'], [7, 'vapeurs'], [8, 'gouttes'], [9, 'ouvert à l’air']];
  return (
    <svg viewBox="0 0 300 362" style={stl} role="img" aria-label="Schéma légendé d’un montage à reflux : un ballon contenant le mélange et la pierre ponce, posé dans un chauffe-ballon, tenu par une pince sur un support. Un réfrigérant à eau vertical, ouvert à l’air en haut, est posé sur le ballon ; l’eau entre par le bas et sort par le haut. Les vapeurs montent, les gouttes retombent.">
      <g transform={`translate(${dx} ${dy}) scale(${s})`}><MontageGroupe montage={m} anim={false} /></g>
      {pins.map(([n, id, [px, py]]) => { const a = P(L[id].ancre); return <g key={id}><line x1={px + (px > a[0] ? -9 : 9)} y1={py} x2={a[0]} y2={a[1]} stroke={COL.gris} strokeWidth={1.3} /><circle cx={a[0]} cy={a[1]} r={2} fill={COL.orange} /><Pin x={px} y={py} n={n} /></g>; })}
      {liste.map(([n, t], i) => { const col = i < 5 ? 0 : 1, row = i < 5 ? i : i - 5, x = 10 + col * 152, y = 248 + row * 25; return <g key={n}><Pin x={x + 10} y={y} n={n} /><T x={x + 24} y={y + 5} s={13.5} w={n >= 7 ? 600 : 700}>{t}</T></g>; })}
    </svg>);
}

// ── Carte 4 : la sécurité ──
export function FicheSecurite() {
  const ligne = (y, icone, l1, l2) => <g><g transform={`translate(10 ${y})`}>{icone}</g><T x={56} y={y + 17} s={14.5}>{l1}</T>{l2 && <T x={56} y={y + 34} s={13.5} w={600} c={COL.gris}>{l2}</T>}</g>;
  const croix = <g stroke="#dc2626" strokeWidth={4} strokeLinecap="round"><line x1={4} y1={4} x2={34} y2={34} /><line x1={34} y1={4} x2={4} y2={34} /></g>;
  const lunettes = <g fill="#e0f2fe" stroke={COL.encre} strokeWidth={2.4}><ellipse cx={11} cy={19} rx={9} ry={7} /><ellipse cx={29} cy={19} rx={9} ry={7} /><path d="M20 18 h0" /><path d="M2 17 L0 12 M38 17 L40 12" fill="none" /></g>;
  const hotte = <g><path d="M4 10 H36 L30 28 H10 Z" fill="#e2e8f0" stroke={COL.encre} strokeWidth={2.2} strokeLinejoin="round" /><Fleche x1={20} y1={36} x2={20} y2={2} c={COL.bleu} w={2.5} t={8} /></g>;
  const flamme = <g><path d="M20 3 C27 12 32 18 32 26 a12 12 0 0 1 -24 0 C8 18 15 12 20 3z" fill="#fb923c" stroke="#c2410c" strokeWidth={2} />{croix}</g>;
  const bouchon = <g><polygon points="8,14 32,14 28,32 12,32" fill="#a16207" stroke="#713f12" strokeWidth={2} />{croix}</g>;
  const pierre = <g><polygon points="6,28 8,16 18,12 30,18 32,28 20,34" fill="#a8a29e" stroke="#57534e" strokeWidth={2} /></g>;
  const prof = <g fill="none" stroke={COL.encre} strokeWidth={2.4}><circle cx={14} cy={10} r={6} /><path d="M3 34 v-8 a11 11 0 0 1 22 0 v8" /><circle cx={30} cy={13} r={5} /><path d="M24 34 v-6 a9 9 0 0 1 14 -7" /></g>;
  return (
    <svg viewBox="0 0 300 330" style={stl} role="img" aria-label="Six consignes de sécurité en pictogrammes : lunettes et blouse ; travail sous la hotte ; aucune flamme près des vapeurs ; haut du réfrigérant jamais bouché ; pierre ponce mise avant de chauffer ; toujours avec le professeur, jamais seul ni à la maison.">
      {ligne(6, lunettes, 'lunettes et blouse', 'les vapeurs irritent')}
      {ligne(58, hotte, 'sous la hotte', 'elle aspire les vapeurs')}
      {ligne(110, flamme, 'aucune flamme', 'les vapeurs sont inflammables')}
      {ligne(162, bouchon, 'haut jamais bouché', 'sinon la pression monte')}
      {ligne(214, pierre, 'pierre ponce avant de chauffer', 'ébullition régulière')}
      {ligne(268, prof, 'avec le professeur', 'jamais seul, jamais à la maison')}
    </svg>);
}

// ── Carte 5 : la CCM d'un produit brut ──
export function FicheBrut() {
  const xs = [60, 150, 240], yE = 96, yA = 150;
  return (
    <svg viewBox="0 0 300 282" style={stl} role="img" aria-label="Une plaque à trois voies, révélée au diiode. Le produit brut donne deux taches : l’une à la hauteur de la référence ester, l’autre à la hauteur de la référence alcool. Deux taches : un mélange, il reste de l’alcool.">
      <rect x={14} y={14} width={272} height={194} rx={5} fill="#fef3c7" stroke={COL.gris} strokeWidth={2.5} />
      <line x1={22} x2={278} y1={190} y2={190} stroke="#6b7280" strokeWidth={2} />
      <line x1={22} x2={278} y1={yE} y2={yE} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4" /><line x1={22} x2={278} y1={yA} y2={yA} stroke={COL.orange} strokeWidth={1.8} strokeDasharray="5 4" />
      <Pt x={xs[0]} y={yE} r={8.5} /><Pt x={xs[0]} y={yA} r={8.5} /><Pt x={xs[1]} y={yA} r={8.5} /><Pt x={xs[2]} y={yE} r={8.5} />
      <T x={xs[0]} y={228} a="middle" s={14}>produit brut</T><T x={xs[1]} y={228} a="middle" s={14}>réf. alcool</T><T x={xs[2]} y={228} a="middle" s={14}>réf. ester</T>
      <T x={150} y={250} c={COL.orange} a="middle" s={14}>2 taches : un mélange,</T><T x={150} y={269} c={COL.orange} a="middle" s={14}>il reste de l’alcool</T>
    </svg>);
}

// ── Carte 6 : même hauteur, pas une preuve ──
export function FicheLimite() {
  const plaque = (x, titre, h1, h2, l1, l2) => (
    <g>
      <T x={x + 60} y={18} a="middle" s={14}>{titre}</T>
      <rect x={x} y={28} width={120} height={150} rx={5} fill="#fef3c7" stroke={COL.gris} strokeWidth={2.5} />
      <line x1={x + 6} x2={x + 114} y1={160} y2={160} stroke="#6b7280" strokeWidth={2} />
      <line x1={x + 6} x2={x + 114} y1={h1} y2={h1} stroke={COL.orange} strokeWidth={1.6} strokeDasharray="5 4" />
      <Pt x={x + 32} y={h1} r={8} /><Pt x={x + 88} y={h2} r={8} />
      <T x={x + 32} y={196} a="middle" s={13.5}>{l1}</T><T x={x + 88} y={196} a="middle" s={13.5}>{l2}</T>
    </g>);
  return (
    <svg viewBox="0 0 300 284" style={stl} role="img" aria-label="Deux plaques. À gauche, l’arôme de synthèse et l’arôme de banane ont leurs taches à la même hauteur : compatible, pas prouvé. À droite, l’arôme d’une autre synthèse a sa tache à une hauteur différente de celle de l’arôme de banane : espèces différentes.">
      {plaque(12, 'même hauteur', 84, 84, 'synth.', 'banane')}
      {plaque(168, 'hauteurs différentes', 84, 112, 'autre', 'banane')}
      <T x={72} y={224} c={COL.orange} a="middle" s={13.5}>compatible,</T><T x={72} y={241} c={COL.orange} a="middle" s={13.5}>pas prouvé</T>
      <T x={228} y={224} c={COL.vert} a="middle" s={13.5}>espèces différentes</T><T x={228} y={241} c={COL.vert} a="middle" s={13.5}>(c’est une preuve)</T>
    </svg>);
}
