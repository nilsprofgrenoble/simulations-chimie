import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, Formule, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { nbf, tire, useLecture, Schema, Fl, T, TV, TL, puces, ROUGE, VERT, BLEU, ORANGE, NOIR, GRIS } from "./Travail";
import * as M from "./energieModele";

const SIM_ID = 107;
declarerDefis(SIM_ID, [['frott', 'Retrouver la force de frottement'], ['vitesse', 'Vitesse au point bas avec frottement']]);

// ====================================================
//  SIM 107 — ÉNERGIES CINÉTIQUE, POTENTIELLE ET MÉCANIQUE (1G, chapitre 12, partie 2)
//  Une bille glisse sur une piste parabolique, lâchée sans vitesse : conversion Epp ↔ Ec, conservation de l'énergie mécanique sans frottement,
//  diminution de Em avec un frottement (Em(s) = Em0 − f·s).
// ====================================================
const M_BILLE = 0.2, X0 = 1, F_GUIDE = 0.3;
const SX = 220, OX = 300, SOL = 196;                       // échelle (px/m), origine x, y du point bas de la piste
const Ind = ({ b, i }) => <>{b}<sub>{i}</sub></>;
const bloqueSi = (ok, msg) => ok ? null : msg;
const tel = (v, d) => Number(nbf(v, d).replace(',', '.'));  // valeur telle qu'affichée (convention des défis)

const FEm = <Formule><msub><mi>E</mi><mi>m</mi></msub><mo>=</mo><msub><mi>E</mi><mi>c</mi></msub><mo>+</mo><msub><mi>E</mi><mrow><mi>pp</mi></mrow></msub></Formule>;
const FEpp = <Formule><msub><mi>E</mi><mrow><mi>pp</mi></mrow></msub><mo>=</mo><mi>m</mi><mo>×</mo><mi>g</mi><mo>×</mo><mi>z</mi></Formule>;
const FPertes = <Formule><mi>Δ</mi><msub><mi>E</mi><mi>m</mi></msub><mo>=</mo><mi>W</mi><mo>(</mo><mover><mi>f</mi><mo>→</mo></mover><mo>)</mo><mo>=</mo><mo>−</mo><mi>f</mi><mo>×</mo><mi>s</mi></Formule>;

// ---------- scène : piste, bille, forces ----------
function ScenePiste({ T, idx, f, forces, vitesse }) {
  const p = T.pts[Math.min(idx, T.pts.length - 1)];
  const X = x => OX + SX * x, Y = z => SOL - SX * z;
  const chemin = Array.from({ length: 41 }, (_, i) => { const x = -1.15 + (2.3 * i) / 40; return `${i ? 'L' : 'M'}${X(x)},${Y(M.profil(x))}`; }).join(' ');
  const dx = -1, dz = -2 * M.K * p.x, n = Math.hypot(dx, dz), ux = dx / n, uy = -dz / n;   // tangente (sens du mouvement), repère écran
  const bx = X(p.x), by = Y(p.z) - 9;
  const v = Math.sqrt(Math.max(0, 2 * p.Ec / M_BILLE)), lv = Math.min(70, 20 * v);
  return (
    <svg viewBox="0 0 600 215" style={{ width: '100%', display: 'block', background: '#f8fafc', borderRadius: 8 }} role="img"
      aria-label={`Bille de 0,200 kilogramme sur une piste en forme de cuvette, lâchée sans vitesse à ${nbf(T.z0, 2)} mètre au-dessus du point bas${forces ? ' ; forces : poids, réaction, frottement' : ''}`}>
      <line x1="20" y1={SOL} x2="580" y2={SOL} stroke="#94a3b8" strokeDasharray="4 4"/><text x="24" y={SOL - 5} fontSize="12" fill={GRIS}>z = 0</text>
      <path d={chemin} fill="none" stroke={NOIR} strokeWidth="4"/>
      <line x1={X(1.15)} y1={Y(T.z0)} x2={X(-1.15)} y2={Y(T.z0)} stroke={BLEU} strokeDasharray="5 4" opacity="0.6"/><text x={X(-1.12)} y={Y(T.z0) - 4} fontSize="11.5" fill={BLEU}>hauteur de départ</text>
      <circle cx={bx} cy={by} r="9" fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
      {forces && <g>
        <Fl x1={bx} y1={by} x2={bx} y2={by + 42} c={ROUGE}/><TV x={bx + 6} y={by + 50} c={ROUGE} halo>P</TV>
        {f > 0 && p.s > 0 && <g><Fl x1={bx} y1={by} x2={bx - ux * (18 + f * 90)} y2={by - uy * (18 + f * 90)} c={ORANGE}/><TV x={bx - ux * (18 + f * 90) - 4} y={by - uy * (18 + f * 90) - 8} c={ORANGE} halo>f</TV></g>}
      </g>}
      {vitesse && v > 0.03 && <g><Fl x1={bx} y1={by - 14} x2={bx + ux * lv} y2={by - 14 + uy * lv} c={VERT}/><TV x={bx + ux * lv * 0.5 - 4} y={by - 24 + uy * lv * 0.5} c={VERT} halo>v</TV></g>}
    </svg>);
}

// ---------- diagramme en barres des énergies ----------
function Barres({ T, idx, m, montrer }) {
  const p = T.pts[Math.min(idx, T.pts.length - 1)], max = T.Em0, w = 380, L = e => Math.max(0, (e / max) * w);
  const lignes = [['Epp', p.Epp, VERT, montrer.epp], ['Ec', p.Ec, BLEU, montrer.ec], ['Em', p.Em, '#475569', montrer.em]].filter(l => l[3]);
  return (
    <svg viewBox={`0 0 600 ${16 + lignes.length * 34}`} style={{ width: '100%', display: 'block', background: '#fff', borderRadius: 8 }} role="img"
      aria-label={`Énergies : ${lignes.map(l => `${l[0]} ${nbf(l[1], 2)} joule`).join(', ')}`}>
      {lignes.map(([nom, e, c], i) => <g key={nom}>
        <text x="10" y={30 + i * 34} fontSize="15" fontWeight="700" fill={c}>{nom === 'Epp' ? 'E' : 'E'}<tspan fontSize="11" dy="4">{nom === 'Epp' ? 'pp' : nom[1]}</tspan></text>
        <rect x="64" y={14 + i * 34} width={L(e)} height="22" fill={c} opacity="0.85"/>
        <text x={64 + L(e) + 8} y={31 + i * 34} fontSize="13" fontWeight="700" fill={NOIR}>{nbf(e, 2)} J</text></g>)}
    </svg>);
}

// ---------- schémas des cartes « À retenir » ----------
const Mini = ({ x, z, c, nom, x0 = 0 }) => null;
const SchemaDef = () => (
  <Schema aria="Bille sur une cuvette : en haut, énergie potentielle maximale et énergie cinétique nulle ; au point bas, énergie cinétique maximale ; l'énergie mécanique est la somme des deux" h={160}>
    <path d="M30,40 Q180,260 330,40" fill="none" stroke={NOIR} strokeWidth="3"/>
    <circle cx="48" cy="52" r="7" fill="#fde68a" stroke={NOIR} strokeWidth="2"/><circle cx="180" cy="122" r="7" fill="#fde68a" stroke={NOIR} strokeWidth="2"/>
    <rect x="12" y="84" width="14" height="40" fill={VERT} opacity="0.85"/><text x="10" y="138" fontSize="10.5" fontWeight="700" fill={VERT}>E pp max</text>
    <rect x="160" y="74" width="40" height="12" fill={BLEU} opacity="0.85"/><text x="150" y="150" fontSize="10.5" fontWeight="700" fill={BLEU}>E c max (v max)</text>
    <T x={10} y={16} s={12.5} w={700}>E pp = m g z   ·   E c = ½ m v²   ·   E m = E c + E pp</T>
    <TV x={236} y={96} c={VERT} s={12}>v</TV><Fl x1={230} y1={110} x2={262} y2={100} c={VERT}/>
  </Schema>);
const SchemaConserv = () => (
  <Schema aria="Trois positions de la bille sans frottement : à chaque fois, la somme de la barre verte (énergie potentielle) et de la barre bleue (énergie cinétique) donne la même hauteur totale, l'énergie mécanique" h={160}>
    {[[40, 80, 0], [150, 40, 40], [260, 0, 80]].map(([x, ep, ec], i) => <g key={i}>
      <rect x={x} y={130 - ep - ec} width="26" height={ep} fill={VERT} opacity="0.85"/><rect x={x} y={130 - ec} width="26" height={ec} fill={BLEU} opacity="0.85"/>
      <line x1={x - 8} y1={50} x2={x + 34} y2={50} stroke={NOIR} strokeDasharray="3 3"/></g>)}
    <T x={36} y={146} s={11} w={700}>haut</T><T x={140} y={146} s={11} w={700}>milieu</T><T x={252} y={146} s={11} w={700}>bas</T>
    <T x={10} y={16} s={12.5} w={700}>Sans frottement : E m = E c + E pp se conserve</T><T x={10} y={32} s={11.5} c={GRIS} w={500}>l’énergie passe de E pp (vert) à E c (bleu), sans perte</T>
    <T x={310} y={86} s={11} c={VERT} w={700}>E pp</T><T x={310} y={102} s={11} c={BLEU} w={700}>E c</T>
  </Schema>);
const SchemaPerte = () => (
  <Schema aria="Avec frottement, l'énergie mécanique diminue de façon régulière quand la distance parcourue augmente : la bille s'arrête moins haut que son point de départ" h={160}>
    <line x1="40" y1="130" x2="340" y2="130" stroke={GRIS} strokeWidth="2"/><line x1="40" y1="130" x2="40" y2="40" stroke={GRIS} strokeWidth="2"/>
    <line x1="40" y1="56" x2="320" y2="56" stroke="#94a3b8" strokeDasharray="4 4"/><line x1="40" y1="56" x2="320" y2="112" stroke={ORANGE} strokeWidth="3.5"/>
    <T x={44} y={50} s={11} w={700}>E m départ</T><T x={198} y={112} s={11.5} c={ORANGE} w={700}>E m diminue</T><T x={300} y={146} s={11} w={700}>s</T>
    <TL x={10} y={18} s={12.5} segs={['ΔE m = W(', { v: 'f' }, ') = − f × s  (< 0)']}/><T x={10} y={34} s={11.5} c={GRIS} w={500}>l’énergie perdue chauffe la piste et la bille</T>
  </Schema>);
const SchemaBilan = () => (
  <Schema aria="Deux situations : sans frottement la bille remonte à la même hauteur ; avec frottement elle s'arrête plus bas" h={150}>
    <path d="M20,40 Q100,200 180,40" fill="none" stroke={NOIR} strokeWidth="3"/><path d="M200,40 Q280,200 360,40" fill="none" stroke={NOIR} strokeWidth="3"/>
    <line x1="14" y1="40" x2="186" y2="40" stroke={BLEU} strokeDasharray="4 3"/><line x1="194" y1="40" x2="366" y2="40" stroke={BLEU} strokeDasharray="4 3"/>
    <circle cx="180" cy="40" r="6" fill={VERT}/><circle cx="349" cy="54" r="6" fill={ORANGE}/>
    <T x={20} y={112} s={12} c={VERT} w={700}>sans frottement :</T><T x={20} y={128} s={12} c={VERT} w={700}>même hauteur</T>
    <T x={206} y={112} s={12} c={ORANGE} w={700}>avec frottement :</T><T x={206} y={128} s={12} c={ORANGE} w={700}>moins haut</T>
    <T x={10} y={16} s={12.5} w={700}>E m conservée   ou   E m diminue de |W(f)|</T>
  </Schema>);

export function SimulationEnergieMeca() {
  const [mode, setMode] = useState(() => modeOuverture('energie-guide-v1'));
  useSignalerMode(mode);
  const [suiviFrott, noterFrott] = useCompteurDefi(), [suiviVit, noterVit] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('energie-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('frott');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [pl, setPl] = useState({ m: M_BILLE, x0: X0, f: 0 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const par = enDefi && defi ? defi.p : pl;
  const T = M.trajet({ m: par.m, x0: par.x0, f: par.f });
  const lec = useLecture(4);
  const idx = Math.round(lec.pos * T.stop);
  const pt = T.pts[Math.min(idx, T.pts.length - 1)];
  const etape = guide.etape;
  const nbBas = T.bas != null ? T.bas / T.stop : 0.5;
  const aBas = T.bas != null && Math.abs(idx - T.bas) <= 6;

  // valeurs du guidé
  const T0 = M.trajet({ m: M_BILLE, x0: X0, f: 0 }), T1 = M.trajet({ m: M_BILLE, x0: X0, f: F_GUIDE });
  const Epp0 = M_BILLE * M.G * T0.z0, sBas = tel(T0.sBas, 2), vBas0 = Math.sqrt(2 * Epp0 / M_BILLE);
  const Wf = -F_GUIDE * sBas, EcBas1 = Epp0 + Wf, hFin1 = tel(T1.hFinal, 3), EmFin1 = M_BILLE * M.G * hFin1;
  const estF = f => Math.abs(pl.f - f) < 1e-9;
  const poseBas = () => { lec.arreter(); lec.setPos(T.bas != null ? T.bas / T.stop : 0.5); };

  const ETAPES = [
    { id: 'epp', titre: 'L’énergie liée à la hauteur', focus: ['scene'],
      texte: <>Une bille de masse <em>m</em> = 0,200{NB}kg est lâchée sans vitesse, à <strong>z</strong> = {nbf(T0.z0, 2)}{NB}m au-dessus du point le plus bas de la piste (là où z = 0). Son <strong>énergie potentielle de pesanteur</strong> est <strong><Ind b="E" i="pp"/> = m·g·z</strong> (avec <em>g</em> = 9,8{NB}N/kg).</>,
      tache: { type: 'num', q: 'Énergie potentielle de pesanteur au départ', unite: 'J', vrai: Epp0, tol: 0.02, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Référence : E_pp = 0 au point le plus bas (z = 0).', `E_pp = 0,200 × 9,8 × ${nbf(T0.z0, 2)} = ${nbf(Epp0, 2)} J.`],
        pieges: [[M_BILLE * T0.z0, 'Vous avez oublié g (9,8 N/kg).'], [M_BILLE * M.G, 'Vous avez oublié la hauteur z.']],
        expl: `E_pp = m g z = 0,200 × 9,8 × ${nbf(T0.z0, 2)} = ${nbf(Epp0, 2)} J.`, indice: 'E_pp = m × g × z, avec m en kg, g en N/kg et z en m.' } },
    { id: 'ec0', titre: 'Au départ, la bille est immobile', focus: ['scene', 'mesures'],
      texte: <>La bille est lâchée <strong>sans vitesse</strong> au point de départ.</>,
      tache: { type: 'qcm', q: 'Son énergie cinétique au départ est…', options: ['nulle', 'égale à son énergie potentielle', 'impossible à connaître'], bonne: 0,
        expl: 'E_c = ½ m v² et v = 0 : l’énergie cinétique est nulle au départ.', indice: 'E_c = ½ × m × v² : que vaut v au départ ?' } },
    { id: 'em0', titre: 'L’énergie mécanique', focus: ['mesures'],
      retenirTitre: 'À RETENIR : LES TROIS ÉNERGIES',
      retenir: <><SchemaDef/>{FEm}{puces(<>Phrase-clé : <strong>haut = énergie de position, bas = énergie de mouvement</strong>.</>, <>E<sub>pp</sub> = m g z ne dépend que de la hauteur (et du choix de z = 0) ; E<sub>c</sub> = ½ m v² dépend de la vitesse.</>, <>Exemple : 0,200 kg à 0,50 m ⇒ E<sub>pp</sub> = 0,98 J.</>, <><strong>Idée fausse</strong> : « l’énergie potentielle est toujours positive ». <strong>Vrai</strong> : tout dépend de l’origine z = 0 choisie.</>)}</>,
      texte: <>L’<strong>énergie mécanique</strong> est la somme des deux : <strong><Ind b="E" i="m"/> = <Ind b="E" i="c"/> + <Ind b="E" i="pp"/></strong>. Au départ : <Ind b="E" i="pp"/> = {nbf(Epp0, 2)}{NB}J et <Ind b="E" i="c"/> = 0.</>,
      tache: { type: 'num', q: 'Énergie mécanique au départ', unite: 'J', vrai: Epp0, tol: 0.02, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`E_m = E_c + E_pp = 0 + ${nbf(Epp0, 2)} = ${nbf(Epp0, 2)} J.`], pieges: [],
        expl: `E_m = 0 + ${nbf(Epp0, 2)} = ${nbf(Epp0, 2)} J.`, indice: 'E_m = E_c + E_pp, avec E_c = 0 au départ.' } },
    { id: 'bas', titre: 'Au point le plus bas', focus: ['scene'],
      texte: <>Lancez la bille (sans frottement) et arrêtez-la au point le plus bas, ou cliquez sur le bouton.</>,
      tache: { type: 'action', ok: aBas && estF(0), label: 'Aller au point bas', faire: () => { setPl(p => ({ ...p, f: 0 })); setTimeout(poseBas, 0); }, consigne: 'Bille au point le plus bas de la piste (z = 0), sans frottement' } },
    { id: 'eppbas', titre: 'L’énergie potentielle au point bas', focus: ['mesures'],
      texte: <>La bille est maintenant au niveau z = 0.</>,
      tache: { type: 'qcm', q: 'Son énergie potentielle de pesanteur est…', options: ['nulle', 'maximale', 'égale à son énergie cinétique'], bonne: 0,
        bloque: bloqueSi(aBas && estF(0), 'Placez d’abord la bille au point bas (étape précédente).'),
        expl: 'z = 0 donc E_pp = m g z = 0 (c’est l’origine choisie).', indice: 'E_pp = m g z : que vaut z au point bas ?' } },
    { id: 'ecbas', titre: 'Sans frottement, l’énergie mécanique se conserve', focus: ['mesures'],
      retenirTitre: 'À RETENIR : CONSERVATION DE L’ÉNERGIE MÉCANIQUE',
      retenir: <><SchemaConserv/>{puces(<>Sans frottement, <strong>E<sub>m</sub> reste constante</strong> : ce que E<sub>pp</sub> perd, E<sub>c</sub> le gagne.</>, <>Exemple : de 0,98 J d’énergie potentielle en haut, il reste 0 J en bas et 0,98 J d’énergie cinétique.</>, <>Seul le poids travaille ici : la réaction <strong>vec(R)</strong>, perpendiculaire au déplacement, ne travaille pas.</>, <><strong>Idée fausse</strong> : « l’énergie cinétique est maximale en haut ». <strong>Vrai</strong> : en haut elle est nulle, en bas elle est maximale.</>)}</>,
      texte: <>Sans frottement, l’énergie mécanique <strong>se conserve</strong> : <Ind b="E" i="m"/> au point bas = <Ind b="E" i="m"/> au départ = {nbf(Epp0, 2)}{NB}J, et <Ind b="E" i="pp"/> = 0 au point bas.</>,
      tache: { type: 'num', q: 'Énergie cinétique au point bas', unite: 'J', vrai: Epp0, tol: 0.02, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['E_c = E_m − E_pp = ' + `${nbf(Epp0, 2)} − 0 = ${nbf(Epp0, 2)} J.`], pieges: [],
        expl: `E_c = E_m − E_pp = ${nbf(Epp0, 2)} J : toute l’énergie potentielle est convertie en énergie cinétique.`, indice: 'E_m = E_c + E_pp, donc E_c = E_m − E_pp avec E_pp = 0.' } },
    { id: 'vbas', titre: 'La vitesse au point bas', focus: ['mesures'],
      texte: <>Au point bas, <Ind b="E" i="c"/> = {nbf(Epp0, 2)}{NB}J et <em>m</em> = 0,200{NB}kg. On cherche la norme <em>v</em> du vecteur vitesse vec(v) : <strong><Ind b="E" i="c"/> = ½·m·v²</strong>.</>,
      tache: { type: 'num', q: 'Vitesse de la bille au point bas', unite: 'm/s', vrai: vBas0, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`v² = 2 E_c / m = 2 × ${nbf(Epp0, 2)} / 0,200 = ${nbf(2 * Epp0 / M_BILLE, 2)} m²/s².`, `v = √${nbf(2 * Epp0 / M_BILLE, 2)} = ${nbf(vBas0, 2)} m/s.`],
        pieges: [[2 * Epp0 / M_BILLE, 'Vous avez oublié la racine carrée : on trouve v², pas v.'], [Epp0 / M_BILLE, 'Vous avez oublié le facteur 2 : v² = 2 E_c / m.']],
        expl: `v = √(2 E_c / m) = ${nbf(vBas0, 2)} m/s.`, indice: 'E_c = ½ m v² ⇒ v = √(2 E_c / m).' } },
    { id: 'autre', titre: 'De l’autre côté', focus: ['scene'],
      texte: <>Sans frottement, la bille remonte de l’autre côté de la piste. Lancez-la et observez.</>,
      tache: { type: 'qcm', q: 'Jusqu’à quelle hauteur la bille remonte-t-elle ?', options: ['la même hauteur qu’au départ', 'plus haut qu’au départ', 'moins haut qu’au départ'], bonne: 0,
        expl: 'E_m se conserve : à la hauteur d’arrêt, E_c = 0 et E_pp = E_m, donc z = z de départ.', indice: 'À l’arrêt, E_c = 0 : que vaut alors E_pp = E_m ?' } },
    { id: 'frott', titre: 'Ajoutons un frottement', focus: ['scene', 'mesures'],
      texte: <>La piste est maintenant rugueuse : une force de <strong>frottement</strong> <strong>vec(f)</strong> d’intensité constante <em>f</em> = {nbf(F_GUIDE, 2)}{NB}N s’oppose au mouvement. Activez-la.</>,
      tache: { type: 'action', ok: estF(F_GUIDE), label: 'Activer le frottement', faire: () => { lec.arreter(); lec.setPos(0); setPl(p => ({ ...p, f: F_GUIDE })); }, consigne: 'Frottement f = 0,30 N' } },
    { id: 'wf', titre: 'Le travail du frottement', focus: ['mesures'],
      texte: <>La bille descend du départ au point bas en parcourant <em>s</em> = {nbf(sBas, 2)}{NB}m le long de la piste. Le frottement est opposé au déplacement : <strong>W(vec(f)) = − f × s</strong>.</>,
      tache: { type: 'num', q: 'Travail W(vec(f)) du frottement du départ au point bas', unite: 'J', vrai: Wf, tol: 0.03, affiche: v => nbf(v, 3), cs: 2,
        bloque: bloqueSi(estF(F_GUIDE), 'Activez d’abord le frottement (étape précédente).'),
        calcul: () => [`W(f) = − f × s = − ${nbf(F_GUIDE, 2)} × ${nbf(sBas, 2)} = ${nbf(Wf, 3)} J.`],
        pieges: [[-Wf, 'Le signe : le frottement s’oppose au déplacement, son travail est négatif.']],
        expl: `W(f) = − ${nbf(F_GUIDE, 2)} × ${nbf(sBas, 2)} = ${nbf(Wf, 3)} J.`, indice: 'W(f) = − f × s, avec f en N et s en m.' } },
    { id: 'ecbas1', titre: 'Avec frottement, que reste-t-il ?', focus: ['mesures'],
      texte: <>La variation d’énergie mécanique est égale au travail du frottement : Δ<Ind b="E" i="m"/> = W(vec(f)) = {nbf(Wf, 3)}{NB}J. Au départ <Ind b="E" i="m"/> = {nbf(Epp0, 2)}{NB}J. Au point bas, <Ind b="E" i="pp"/> = 0.</>,
      tache: { type: 'num', q: 'Énergie cinétique au point bas, avec frottement', unite: 'J', vrai: EcBas1, tol: 0.02, affiche: v => nbf(v, 3), cs: 2,
        bloque: bloqueSi(estF(F_GUIDE), 'Activez d’abord le frottement (« Rétablir »).'),
        calcul: () => [`E_m(bas) = E_m(départ) + W(f) = ${nbf(Epp0, 2)} + (${nbf(Wf, 3)}) = ${nbf(EcBas1, 3)} J.`, 'E_pp = 0 au point bas, donc E_c = E_m = ' + nbf(EcBas1, 3) + ' J.'],
        pieges: [[Epp0, 'Cette valeur est celle sans frottement : retranchez l’énergie perdue.'], [Epp0 - Wf, 'Le travail du frottement est négatif : on le retranche.']],
        expl: `E_c(bas) = ${nbf(EcBas1, 3)} J : inférieure aux ${nbf(Epp0, 2)} J d’énergie mécanique de départ.`, indice: 'E_m(bas) = E_m(départ) + W(f) ; au point bas E_pp = 0, donc E_c = E_m.' } },
    { id: 'chaleur', titre: 'Où est passée l’énergie ?', focus: ['mesures'],
      retenirTitre: 'À RETENIR : AVEC FROTTEMENT',
      retenir: <><SchemaPerte/>{FPertes}{puces(<>Avec frottement, <strong>E<sub>m</sub> diminue</strong> : elle n’est plus conservée.</>, <>L’énergie « perdue » n’a pas disparu : elle est transférée à la piste et à la bille sous forme d’<strong>énergie thermique</strong> (elles chauffent).</>, <>Exemple : f = 0,30 N sur s = 1,15 m ⇒ ΔE<sub>m</sub> = − 0,345 J.</>, <><strong>Idée fausse</strong> : « le frottement détruit l’énergie ». <strong>Vrai</strong> : il la convertit en chaleur.</>)}</>,
      texte: <>Au point bas, la bille a une énergie cinétique plus faible que sans frottement : <Ind b="E" i="c"/> = {nbf(EcBas1, 3)}{NB}J au lieu de {nbf(Epp0, 2)}{NB}J.</>,
      tache: { type: 'qcm', q: 'Que devient l’énergie mécanique perdue ?', options: ['elle est transférée sous forme d’énergie thermique (la piste et la bille chauffent)', 'elle disparaît', 'elle devient de l’énergie potentielle supplémentaire'], bonne: 0,
        expl: 'L’énergie totale se conserve : la diminution de E_m correspond à un transfert d’énergie thermique (le « chaud ») au milieu environnant.', indice: 'L’énergie ne disparaît pas : sous quelle forme se retrouve-t-elle quand deux surfaces frottent ?' } },
    { id: 'haut', titre: 'Jusqu’où remonte la bille ?', focus: ['scene'],
      texte: <>Lancez la bille jusqu’à son arrêt (curseur tout à droite) et observez la hauteur atteinte de l’autre côté.</>,
      tache: { type: 'action', ok: estF(F_GUIDE) && lec.pos > 0.98, label: 'Lancer jusqu’à l’arrêt', faire: () => { setPl(p => ({ ...p, f: F_GUIDE })); lec.lancer(); }, consigne: 'Bille lâchée jusqu’à l’arrêt, avec frottement' } },
    { id: 'emfin', titre: 'L’énergie mécanique finale', focus: ['mesures'],
      texte: <>La bille s’arrête à <em>z</em> = {nbf(hFin1, 3)}{NB}m (lue dans « Mesures ») : à l’arrêt, <Ind b="E" i="c"/> = 0.</>,
      tache: { type: 'num', q: 'Énergie mécanique finale (à l’arrêt)', unite: 'J', vrai: EmFin1, tol: 0.03, affiche: v => nbf(v, 3), cs: 2,
        bloque: bloqueSi(estF(F_GUIDE) && lec.pos > 0.98, 'Lancez d’abord la bille jusqu’à l’arrêt (étape précédente, « Rétablir »).'),
        calcul: () => [`À l’arrêt, E_c = 0 donc E_m = E_pp = m g z = 0,200 × 9,8 × ${nbf(hFin1, 3)} = ${nbf(EmFin1, 3)} J.`],
        pieges: [[Epp0, 'Cette valeur est l’énergie mécanique de départ : il faut la hauteur finale.']],
        expl: `E_m(final) = m g z = ${nbf(EmFin1, 3)} J, inférieure à ${nbf(Epp0, 2)} J.`, indice: 'À l’arrêt, E_c = 0, donc E_m = E_pp = m × g × z.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenirTitre: 'À RETENIR : LE BILAN',
      retenir: <><SchemaBilan/>{FEm}{puces(<><strong>E<sub>pp</sub> = m g z</strong> ; <strong>E<sub>c</sub> = ½ m v²</strong> ; <strong>E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub></strong>.</>, <>Sans frottement : E<sub>m</sub> constante, la bille remonte à la même hauteur.</>, <>Avec frottement : ΔE<sub>m</sub> = W(vec(f)) = − f s &lt; 0, énergie transférée en chaleur.</>, <>Lien avec le chapitre précédent : ΔE<sub>c</sub> = ΣW (théorème de l’énergie cinétique).</>)}</>,
      texte: <>Vous savez suivre les conversions d’énergie d’une bille sur une piste, avec ou sans frottement. Essayez maintenant l’exploration, puis les défis.</>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const apres = id => !enGuide || etape > IDS.indexOf(id), depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const aRetablir = enGuide && ['eppbas', 'ecbas', 'vbas', 'wf', 'ecbas1', 'emfin'].includes(idE);
  const cibleOk = { eppbas: aBas && estF(0), ecbas: aBas && estF(0), vbas: aBas && estF(0), wf: estF(F_GUIDE), ecbas1: estF(F_GUIDE), emfin: estF(F_GUIDE) && lec.pos > 0.98 }[idE];
  const retablir = () => { lec.arreter(); if (['eppbas', 'ecbas', 'vbas'].includes(idE)) { setPl(p => ({ ...p, f: 0 })); setTimeout(poseBas, 0); } else if (idE === 'emfin') { setPl(p => ({ ...p, f: F_GUIDE })); lec.setPos(1); } else setPl(p => ({ ...p, f: F_GUIDE })); };
  const lienBase = aRetablir && !cibleOk && <button onClick={retablir} style={{ ...styleBouton(true, '#b45309'), marginBottom: 8 }}>Rétablir la situation de l’étape</button>;

  // ════════════════ DÉFIS ════════════════
  const nouveauFrott = () => { const m = tire([0.15, 0.2, 0.25, 0.3]), x0 = tire([0.8, 1, 1.2]), f = tire([0.15, 0.2, 0.25, 0.3, 0.35]);
    const Tt = M.trajet({ m, x0, f }), z0 = tel(Tt.z0, 2), z1 = tel(Tt.hFinal, 3), s = tel(Tt.sFinal, 2);
    return { type: 'frott', p: { m, x0, f }, z0, z1, s, vrai: M.frottementDeduit({ m, z0, z1, s }), reps: {}, verifie: false }; };
  const nouvelleVit = () => { const m = tire([0.15, 0.2, 0.25, 0.3]), x0 = tire([0.8, 1, 1.2]), f = tire([0.1, 0.15, 0.2, 0.25]);
    const Tt = M.trajet({ m, x0, f }), z0 = tel(Tt.z0, 2), s = tel(Tt.sBas, 2);
    return { type: 'vitesse', p: { m, x0, f }, z0, s, vrai: Math.sqrt(2 * (m * M.G * z0 - f * s) / m), reps: {}, verifie: false }; };
  const nouveauDefi = t => { setDefi(t === 'frott' ? nouveauFrott() : nouvelleVit()); lec.arreter(); lec.setPos(0); };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.r), ok = isFinite(x) && proche(x, defi.vrai, 0.05);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'frott' ? noterFrott : noterVit)(ok);
  };
  const champ = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.r ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('em-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { r: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['frott', 'Force de frottement'], ['vitesse', 'Vitesse au point bas']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'frott' ? 'Défi : quelle est l’intensité du frottement ?' : 'Défi : quelle est la vitesse au point bas ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>{indicesProfond(<>
        {defi.type === 'frott' && <>Une bille de masse <em>m</em> = {nbf(defi.p.m * 1000, 0)}{NB}g est lâchée sans vitesse à <em>z</em><sub>0</sub> = {nbf(defi.z0, 2)}{NB}m. Elle s’arrête de l’autre côté à <em>z</em><sub>1</sub> = {nbf(defi.z1, 3)}{NB}m, après avoir parcouru <em>s</em> = {nbf(defi.s, 2)}{NB}m le long de la piste. Quelle est l’intensité <em>f</em> de la force de frottement <strong>vec(f)</strong>, supposée constante ? Donnez <em>f</em> avec 2 chiffres significatifs.</>}
        {defi.type === 'vitesse' && <>Une bille de masse <em>m</em> = {nbf(defi.p.m * 1000, 0)}{NB}g est lâchée sans vitesse à <em>z</em><sub>0</sub> = {nbf(defi.z0, 2)}{NB}m. Un frottement d’intensité <em>f</em> = {nbf(defi.p.f, 2)}{NB}N s’oppose au mouvement ; la bille parcourt <em>s</em> = {nbf(defi.s, 2)}{NB}m jusqu’au point bas (z = 0). Quelle est la norme <em>v</em> de sa vitesse <strong>vec(v)</strong> au point bas ? Donnez <em>v</em> avec 3 chiffres significatifs.</>}
      </>)}</div>
      {defi.type === 'frott' && champ('N', 'Force de frottement f')}
      {defi.type === 'vitesse' && champ('m/s', 'Vitesse v au point bas')}
      {defi.type === 'frott' && <IndiceDefi cache={false}>{'Em(départ) = m g z_0 ; à l’arrêt E_c = 0 donc Em(final) = m g z_1. La perte d’énergie mécanique vaut f × s : f = m g (z_0 − z_1) / s (m en kg, g = 9,8 N/kg).'}</IndiceDefi>}
      {defi.type === 'vitesse' && <IndiceDefi cache={false}>{'Au point bas E_pp = 0 : E_c = E_m = m g z_0 + W(vec(f)) = m g z_0 − f × s ; puis v = √(2 E_c / m).'}</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="em-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.ok ? `✓ Correct. Valeur de la simulation : ${nbf(defi.vrai, defi.type === 'frott' ? 2 : 2)}${NB}${defi.type === 'frott' ? 'N' : 'm/s'}.`
          : defi.type === 'frott' ? '✗ Vérifiez : perte d’énergie mécanique = m g (z₀ − z₁) ; f = perte / s ; m en kg.'
            : '✗ Vérifiez : E_c(bas) = m g z₀ − f s ; v = √(2 E_c / m) ; m en kg.')}
      </div>}
    </div>);

  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Point matériel</strong> : la bille est modélisée par un point (on néglige sa rotation : une vraie bille qui roule stocke aussi de l’énergie de rotation).</li>
      <li><strong>Référence de l’énergie potentielle</strong> : E<sub>pp</sub> = 0 au point le plus bas de la piste (choix arbitraire) ; g = 9,8 N/kg uniforme.</li>
      <li><strong>Frottement</strong> : d’intensité constante, opposé au mouvement : W(vec(f)) = − f × s (s = longueur parcourue le long de la piste). C’est un modèle ; un frottement réel dépend souvent de la vitesse et de la réaction.</li>
      <li><strong>Réaction</strong> vec(R) : toujours perpendiculaire à la piste (sans frottement de ce type) ; elle ne travaille pas.</li>
      <li><strong>Animation</strong> : la position se règle avec le curseur ; le « Lancer » parcourt la piste à un rythme régulier choisi pour la lisibilité (ce n’est pas le film chronométré du mouvement).</li>
      <li><strong>Premier passage</strong> : on suit la bille de son lâcher jusqu’à son premier arrêt (sans retour). Chiffres significatifs : les résultats sont arrondis à 2 ou 3 chiffres ; un petit écart d’arrondi est normal.</li>
      <li><strong>Défi « frottement »</strong> : l’écart z₀ − z₁ est faible devant z₀ : un arrondi de z₁ au millimètre pèse sur f ; la tolérance en tient compte.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  const forcesAff = enGuide ? depuis('frott') || depuis('autre') : true;
  const vitAff = enGuide ? depuis('ec0') : true;
  const cache = enGuide && ['ecbas1', 'emfin'].includes(idE), cacheTout = enGuide && idE === 'emfin';
  const montrer = enGuide ? { epp: depuis('epp') && !cacheTout, ec: apres('ecbas') && !cache, em: depuis('em0') && !cacheTout } : { epp: true, ec: true, em: true };
  const boutons = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
      <button onClick={lec.lancer} style={styleBouton(true, '#15803d')}><Pic n="play"/>Lancer</button>
      <input type="range" min="0" max="1" step="0.005" value={lec.pos} aria-label="Position de la bille" onChange={e => { lec.arreter(); lec.setPos(parseFloat(e.target.value)); }} style={{ flex: 1, minWidth: 120, minHeight: 32 }}/>
    </div>);
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {lienBase}<ScenePiste T={T} idx={idx} f={par.f} forces={forcesAff} vitesse={vitAff}/>{boutons}
      {(!enGuide || depuis('epp')) && <div style={{ marginTop: 8, ...cadre('mesures') }}><Barres T={T} idx={idx} m={par.m} montrer={montrer}/></div>}
    </div>);
  const reglages = mode === 'explore' && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Masse m" valeur={pl.m} onChange={v => { setPl(p => ({ ...p, m: v })); }} min={0.1} max={0.5} pas={0.05} unite="kg" decimales={2} couleur="#475569"/>
      <Curseur nom="Abscisse de départ x₀" valeur={pl.x0} onChange={v => { setPl(p => ({ ...p, x0: v })); lec.setPos(0); }} min={0.4} max={1.1} pas={0.1} unite="m" decimales={1} couleur="#475569"/>
      <Curseur nom="Frottement f" valeur={pl.f} onChange={v => { setPl(p => ({ ...p, f: v })); lec.setPos(0); }} min={0} max={0.6} pas={0.05} unite="N" decimales={2} couleur="#c2410c"/>
    </div>);
  const v = Math.sqrt(Math.max(0, 2 * pt.Ec / par.m));
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Masse m" valeur={`${nbf(par.m * 1000, 0)}${NB}g`}/>
      <LigneMesure nom="Hauteur z de la bille" valeur={`${nbf(pt.z, 3)}${NB}m`}/>
      {(!enGuide || depuis('epp')) && !(enGuide && ['epp', 'emfin'].includes(idE)) && <LigneMesure nom="Énergie potentielle E_pp" valeur={`${nbf(pt.Epp, 3)}${NB}J`} couleur="#16a34a"/>}
      {(!enGuide || depuis('ec0')) && <LigneMesure nom="Vitesse v (norme)" valeur={`${nbf(v, 2)}${NB}m/s`}/>}
      {(!enGuide || (apres('ecbas') && !['ecbas1', 'emfin'].includes(idE))) && <LigneMesure nom="Énergie cinétique E_c" valeur={`${nbf(pt.Ec, 3)}${NB}J`} couleur="#2563eb"/>}
      {(!enGuide || (apres('em0') && idE !== 'emfin')) && <LigneMesure nom="Énergie mécanique E_m" valeur={`${nbf(pt.Em, 3)}${NB}J`} couleur="#334155"/>}
      {(!enGuide || depuis('wf')) && par.f > 0 && <LigneMesure nom="Distance parcourue s" valeur={`${nbf(pt.s, 2)}${NB}m`}/>}
      {(!enGuide || depuis('frott')) && <LigneMesure nom="Frottement f" valeur={`${nbf(par.f, 2)}${NB}N`} couleur="#c2410c"/>}
      {(!enGuide || depuis('emfin')) && lec.pos > 0.98 && <LigneMesure nom="Hauteur d’arrêt" valeur={`${nbf(T.hFinal, 3)}${NB}m`} couleur="#15803d"/>}
    </div>);
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Sans frottement, doublez la masse : que deviennent E<sub>pp</sub>, E<sub>c</sub> et la vitesse au point bas ?</li>
        <li>Sans frottement, lâchez de 2 fois plus haut (en hauteur z) : la vitesse au point bas est-elle doublée ? (cherchez le facteur)</li>
        <li>Augmentez le frottement : la hauteur d’arrêt de l’autre côté diminue-t-elle de façon régulière ?</li>
        <li>Avec frottement, la somme E<sub>c</sub> + E<sub>pp</sub> reste-t-elle constante pendant la descente ? Que vaut E<sub>m</sub>(départ) − E<sub>m</sub>(arrêt) ?</li>
        <li>Comparez cette perte à f × s lue dans « Mesures ».</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>E<sub>pp</sub> = m g z ; E<sub>c</sub> = ½ m v² ; E<sub>m</sub> = E<sub>c</sub> + E<sub>pp</sub></li>
        <li>sans frottement, E<sub>m</sub> est constante ; avec frottement, ΔE<sub>m</sub> = W(vec(f)) = − f s</li>
      </ul>
    </ARetenir>);
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .em-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .em-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .em-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .em-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .em-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .em-l1.cote .em-carte { order: 2; } .em-l1.cote .em-main { order: 1; } }
        @media (max-width: 900px) { .em-l1.cote, .em-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Énergies cinétique, potentielle et mécanique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une bille descend une piste : son <strong>énergie potentielle</strong> se convertit en <strong>énergie cinétique</strong>. Sans frottement, l’<strong>énergie mécanique</strong> se conserve ; avec frottement, elle diminue.</div>
      <div className={`em-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="em-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="em-carte">{panneauHypo}</div> : null}
        <div className="em-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'frott' ? suiviFrott : suiviVit}/></div>}
          <div className={`em-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}</div>
          </div>
        </div>
      </div>
      {(mode === 'explore' || (enGuide && etape >= ETAPES.length - 1)) && <div className="em-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="em-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
