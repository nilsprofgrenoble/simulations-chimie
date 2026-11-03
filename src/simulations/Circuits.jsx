import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre } from "../commun";
import { fr, serie, derivation } from "./elecModele";
import { BLEU, VERMILLON, VIOLET, GRIS, alea, usePhase } from "./elecOutils";
import { Curseur, VoletDefiGen, Fil, Resistor, Pile, Mesure } from "./elecCommun";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 68 — CIRCUITS ÉLECTRIQUES : INTENSITÉ ET TENSION (2GT, « Signaux et capteurs »)
//  Circuit en série et circuit en dérivation : sens du courant, intensité (unicité en série, loi des nœuds), tension (loi des mailles, même tension
//  en dérivation). Hypothèses : générateur idéal (tension constante), fils sans résistance, résistors ohmiques, appareils de mesure parfaits,
//  régime continu, vitesse des points seulement indicative.
// ====================================================

const SIM = 68;
declarerDefis(SIM, [
  ['tensions', 'Loi des mailles'],
  ['intensites', 'Loi des nœuds'],
  ['prevoir', 'Prévoir l’effet d’un changement'],
]);
const TITRES = { tensions: 'Loi des mailles', intensites: 'Loi des nœuds', prevoir: 'Prévoir un changement' };
const RES = [47, 100, 150, 220, 330, 470, 680, 1000];
const fI = I => (I < 1 ? `${fr(I * 1000, I * 1000 < 100 ? 1 : 0)} mA` : `${fr(I, 2)} A`);
const fU = U => `${fr(U, 2)} V`;
const vit = I => 30 + 500 * I;

// ---------- schéma ----------
function Schema({ atelier, E, R1, R2, mesures, ph, maille = 0, w = 560 }) {
  const ser = atelier === 'serie', m = ser ? serie(E, R1, R2) : derivation(E, R1, R2);
  const fleche = (x1, y1, x2, y2) => { const l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l;
    return <g stroke={BLEU} fill={BLEU}><line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2"/><polygon points={`${x2},${y2} ${x2 - ux * 11 - uy * 5},${y2 - uy * 11 + ux * 5} ${x2 - ux * 11 + uy * 5},${y2 - uy * 11 - ux * 5}`}/></g>; };
  return (
    <svg viewBox={`0 0 ${w} 320`} width="100%" role="img" aria-label={ser ? 'Circuit en série : un générateur et deux résistors dans une seule boucle' : 'Circuit en dérivation : un générateur et deux résistors sur deux branches'} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 620 }}>
      {maille > 0 && (() => { const [x1, x2] = ser ? [102, 458] : maille === 1 ? [92, 248] : [92, 408]; return <g><rect x={x1} y={104} width={x2 - x1} height={124} rx={8} fill="#7b2d8e" opacity="0.07" stroke={VIOLET} strokeWidth="3" strokeDasharray="9 6"/><text x={x1 + 8} y={124} fontSize="13.5" fontWeight="800" fill={VIOLET}>{ser ? 'maille' : `maille ${maille}`}</text></g>; })()}
      {ser ? <>
        <Fil pts={[[80, 250], [80, 80], [480, 80], [480, 250], [80, 250]]} v={vit(m.I)} ph={ph}/>
        <Pile cx={80} cy={165} nom="Pile" lab={mesures ? undefined : undefined}/>
        <Resistor cx={280} cy={80} w={130} val={`R₁ = ${R1} Ω`}/><Resistor cx={280} cy={250} w={130} val={`R₂ = ${R2} Ω`}/>
        {mesures && <>
          {fleche(345, 50, 215, 50)}<Mesure x={280} y={32} nom="U₁" val={fU(m.U1)} couleur={BLEU} w={120}/>
          {fleche(215, 282, 345, 282)}<Mesure x={280} y={302} nom="U₂" val={fU(m.U2)} couleur={BLEU} w={120}/>
          {fleche(34, 215, 34, 115)}<Mesure x={78} y={290} nom="E" val={fU(E)} couleur={BLEU} w={100}/>
          <Mesure x={480} y={165} nom="I" val={fI(m.I)}/></>}
        <text x={474} y={118} fontSize="12.5" fontWeight="700" fill={VERMILLON} textAnchor="end">sens du courant ↓</text>
      </> : <>
        <Fil pts={[[70, 250], [70, 80], [270, 80]]} v={vit(m.I)} ph={ph}/><Fil pts={[[270, 80], [270, 250]]} v={vit(m.I1)} ph={ph}/>
        <Fil pts={[[270, 80], [430, 80], [430, 250], [270, 250]]} v={vit(m.I2)} ph={ph}/><Fil pts={[[270, 250], [70, 250]]} v={vit(m.I)} ph={ph}/>
        <Pile cx={70} cy={165} nom="Pile"/>
        <Resistor cx={270} cy={165} w={26} h={90} couleur="#0f172a"/><Resistor cx={430} cy={165} w={26} h={90}/>
        <text x={248} y={160} fontSize="13.5" fontWeight="800" textAnchor="end">R₁</text><text x={248} y={177} fontSize="12.5" fontWeight="700" textAnchor="end">{R1} Ω</text>
        <text x={408} y={160} fontSize="13.5" fontWeight="800" textAnchor="end">R₂</text><text x={408} y={177} fontSize="12.5" fontWeight="700" textAnchor="end">{R2} Ω</text>
        <circle cx={270} cy={80} r="6" fill="#0f172a"/><circle cx={270} cy={250} r="6" fill="#0f172a"/>
        <text x={258} y={104} fontSize="12" fontWeight="700" fill={GRIS} textAnchor="end">nœud</text>
        {mesures && <>
          <Mesure x={150} y={58} nom="I" val={fI(m.I)} w={118}/><Mesure x={338} y={102} nom="I₁" val={fI(m.I1)} w={108}/><Mesure x={498} y={102} nom="I₂" val={fI(m.I2)} w={108}/>
          <Mesure x={342} y={205} nom="U₁" val={fU(m.U1)} couleur={BLEU} w={100}/><Mesure x={500} y={205} nom="U₂" val={fU(m.U2)} couleur={BLEU} w={100}/>
          <Mesure x={92} y={295} nom="E" val={fU(E)} couleur={BLEU} w={100}/></>}
        <text x={82} y={118} fontSize="12.5" fontWeight="700" fill={VERMILLON}>↑ sens du courant</text>
      </>}
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'tensions') { const E = alea([6, 9, 12]), U1 = Math.round(E * alea([0.2, 0.3, 0.4, 0.6, 0.7]) * 10) / 10; return { ...base, E, U1, U2: Math.round((E - U1) * 10) / 10 }; }
  if (type === 'intensites') { const R1 = alea([100, 150, 220]), R2 = alea([330, 470, 680]), E = alea([6, 9, 12]), m = derivation(E, R1, R2); const Ia = Math.round(m.I * 1000), I1a = Math.round(m.I1 * 1000); return { ...base, E, R1, R2, Ia, I1a, I2a: Ia - I1a }; }
  const S = [
    { q: 'Circuit en série : on remplace R₂ par un résistor de résistance plus grande. L’intensité I dans le circuit…', rep: 'moins', expl: 'Plus de « difficulté » à faire passer le courant : I diminue.' },
    { q: 'Circuit en dérivation : on ajoute une troisième branche. L’intensité I débitée par la pile…', rep: 'plus', expl: 'Chaque branche reçoit son courant et I = I₁ + I₂ + I₃ : I augmente.' },
    { q: 'Circuit en dérivation : on ajoute une troisième branche. L’intensité I₁ dans la branche 1…', rep: 'meme', expl: 'Chaque branche est soumise à la même tension E : I₁ ne change pas.' },
    { q: 'Circuit en série : on dévisse le résistor R₂ (le circuit est ouvert). L’intensité dans R₁…', rep: 'nul', expl: 'La boucle est coupée : plus aucun courant ne circule, I = 0.' },
    { q: 'Circuit en dérivation : on retire la branche 2. L’intensité I₁ dans la branche 1…', rep: 'meme', expl: 'La branche 1 est toujours soumise à la tension E : I₁ ne change pas.' },
  ];
  return { ...base, ...alea(S) };
}
function evaluer(d) {
  if (d.type === 'tensions') { const x = lireNombre(d.reps.v), ok = isFinite(x) && Math.abs(x - d.U2) <= 0.06; return { ok, lignes: [[ok, ok ? 'Tension correcte.' : 'Revois la loi des mailles : E = U_1 + U_2, donc U_2 = E − U_1.']] }; }
  if (d.type === 'intensites') { const x = lireNombre(d.reps.v), ok = isFinite(x) && Math.abs(x - d.I2a) <= 1; return { ok, lignes: [[ok, ok ? 'Intensité correcte.' : 'Revois la loi des nœuds : I = I_1 + I_2, donc I_2 = I − I_1 (attention aux mA).']] }; }
  const ok = d.reps.d === d.rep; return { ok, lignes: [[ok, ok ? 'Bonne réponse.' : d.expl]] };
}
const enonce = (d, { champ, choix }) => {
  if (d.type === 'tensions') return <><Pic n="target"/>Circuit <strong>en série</strong> : la pile impose E = <strong>{fr(d.E, 1)} V</strong>. Un voltmètre branché aux bornes de R₁ indique <strong>U₁ = {fr(d.U1, 1)} V</strong>. Quelle est la tension U₂ aux bornes de R₂ ?<div style={{ marginTop: 6 }}>{champ('v', 'V')}</div></>;
  if (d.type === 'intensites') return <><Pic n="target"/>Circuit <strong>en dérivation</strong> : l’ampèremètre placé près de la pile indique <strong>I = {d.Ia} mA</strong> ; dans la branche de R₁, il indique <strong>I₁ = {d.I1a} mA</strong>. Quelle est l’intensité I₂ dans la branche de R₂ ?<div style={{ marginTop: 6 }}>{champ('v', 'mA')}</div></>;
  return <><Pic n="target"/>{d.q}<div style={{ marginTop: 6 }}>{choix('d', [['plus', 'augmente'], ['moins', 'diminue'], ['meme', 'ne change pas'], ['nul', 'devient nulle']])}</div></>;
};
const solution = d => d.type === 'tensions' ? <>Loi des mailles (une seule maille) : E = U₁ + U₂, donc U₂ = E − U₁ = {fr(d.E, 1)} − {fr(d.U1, 1)} = <strong>{fr(d.U2, 1)} V</strong>.</>
  : d.type === 'intensites' ? <>Loi des nœuds : I = I₁ + I₂, donc I₂ = I − I₁ = {d.Ia} − {d.I1a} = <strong>{d.I2a} mA</strong>.</>
  : <>{d.expl}</>;

// ====================================================
export function SimulationCircuits() {
  const [mode, setMode] = useState(() => modeOuverture('circuits-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('circuits-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('serie');
  const [C, setC] = useState({ E: 6, R1: 100, R2: 220, mesures: true });
  const [anim, setAnim] = useState(true);
  const [hypoOuv, setHypoOuv] = useState(false);
  const ph = usePhase(anim);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const voir = (at, p = {}) => { setAtelier(at); setC(c => ({ ...c, mesures: true, maille: 0, ...p })); };
  const m = atelier === 'serie' ? serie(C.E, C.R1, C.R2) : derivation(C.E, C.R1, C.R2);

  const ETAPES = [
    { id: 'boucle', titre: 'Un circuit, c’est une boucle', depart: () => voir('serie'),
      texte: <>Un <strong>circuit électrique</strong> est une boucle fermée de <strong>fils</strong> qui relie un <strong>générateur</strong> (ici une pile) à des <strong>dipôles</strong> (ici deux résistors). Les points orange sont des charges électriques en mouvement : elles ne circulent que si la boucle est <strong>fermée</strong>.
        <ExempleResolu>Par convention, le courant sort de la borne <strong>+</strong> de la pile et revient par la borne <strong>−</strong> : c’est le <strong>sens conventionnel</strong> du courant (flèche sur le fil).</ExempleResolu></>,
      tache: { type: 'qcm', q: 'À l’extérieur de la pile, dans quel sens circule le courant (sens conventionnel) ?', options: ['De la borne + vers la borne −', 'De la borne − vers la borne +', 'Dans les deux sens à la fois', 'Il ne circule pas'], bonne: 0, expl: 'Le sens conventionnel va de + vers − à l’extérieur du générateur.' } },
    { id: 'intensite', titre: 'L’intensité du courant', depart: () => voir('serie'),
      texte: <>L’<strong>intensité I</strong> du courant dit « combien de charges passent par seconde » dans un fil. Elle s’exprime en <strong>ampères (A)</strong> ; on utilise souvent le milliampère : 1 mA = 0,001 A. On la mesure avec un <strong>ampèremètre</strong> placé <strong>dans</strong> la boucle (en série).
        <ExempleResolu>Ici, avec E = 6 V, R₁ = 100 Ω et R₂ = 220 Ω : I = <strong>18,8 mA</strong> = 0,0188 A.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Un ampèremètre se branche…', options: ['dans la boucle, en série avec le dipôle', 'aux bornes du dipôle, en dérivation', 'n’importe où', 'à côté du circuit'], bonne: 0, expl: 'L’ampèremètre mesure le courant qui le traverse : il doit être dans la boucle.' } },
    { id: 'serie', titre: 'En série : la même intensité partout', depart: () => voir('serie'),
      texte: <>Dans un circuit <strong>en série</strong>, il n’y a qu’<strong>une seule boucle</strong>. Le courant n’a aucun chemin de rechange : il est <strong>le même en tout point</strong> (loi d’unicité de l’intensité). Changez R₁ ou R₂ et regardez : l’intensité I change, mais c’est toujours la même valeur partout.</>,
      tache: { type: 'qcm', q: 'Circuit en série : l’intensité qui traverse R₁ vaut 20 mA. Quelle est l’intensité qui traverse R₂ ?', options: ['20 mA', '10 mA', '40 mA', 'On ne peut pas savoir'], bonne: 0, expl: 'Une seule boucle : l’intensité est la même partout, 20 mA.' } },
    { id: 'tension', titre: 'La tension électrique', depart: () => voir('serie'),
      texte: <>La <strong>tension U</strong> mesure la « poussée » qui fait circuler les charges. Elle s’exprime en <strong>volts (V)</strong> et se mesure avec un <strong>voltmètre</strong> branché <strong>aux bornes</strong> du dipôle (en dérivation). On la représente par une <strong>flèche-tension</strong> (en bleu) : ici E aux bornes de la pile, U₁ aux bornes de R₁ et U₂ aux bornes de R₂.</>,
      tache: { type: 'qcm', q: 'Un voltmètre se branche…', options: ['aux bornes du dipôle, en dérivation', 'dans la boucle, en série', 'seulement sur la pile', 'on ne le branche pas'], bonne: 0, expl: 'Le voltmètre compare deux points du circuit : il se place en dérivation, aux bornes du dipôle.' } },
    { id: 'additivite', titre: 'En série : la loi des mailles', depart: () => voir('serie', { maille: 1 }),
      texte: <>Une <strong>maille</strong> est une boucle fermée du circuit (en pointillés violets). La <strong>loi des mailles</strong> dit que, le long d’une maille, la tension de la pile se « partage » entre les dipôles : <strong>E = U₁ + U₂</strong>, ou encore E − U₁ − U₂ = 0. Ici il n’y a <strong>qu’une seule maille</strong>. Vérifiez avec les mesures du schéma, pour plusieurs valeurs de R₁ et R₂ : le plus grand résistor reçoit la plus grande tension.
        <ExempleResolu>E = 6 V, U₁ = 1,88 V : U₂ = E − U₁ = 6 − 1,88 = <strong>4,12 V</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'E = 9 V et U₁ = 3,5 V (circuit en série). Quelle est la tension U₂ ?', unite: 'V', vrai: 5.5, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[12.5, 'Tu as additionné : les tensions U₁ et U₂ s’additionnent pour donner E, donc U₂ = E − U₁.'], [3.5, 'C’est U₁, la tension du premier résistor. On cherche U₂, celle du deuxième.'], [9, 'C’est E, la tension de la pile. U₂ n’est qu’une partie de E : on retire U₁.']],
        calcul: () => [
          'En série, il n’y a qu’une maille. La loi des mailles dit : E = U₁ + U₂.',
          'On cherche U₂, donc U₂ = E − U₁.',
          'U₂ = 9 − 3,5 = 5,5 V.'], expl: 'U₂ = E − U₁ = 9 − 3,5 = 5,5 V.' } },
    { id: 'derivation', titre: 'En dérivation : deux mailles', depart: () => voir('derivation', { maille: 1 }),
      texte: <>Dans un circuit <strong>en dérivation</strong>, il y a <strong>plusieurs chemins</strong> possibles, donc ici <strong>deux mailles</strong> : la maille 1 (pile et R₁) et la maille 2 (pile et R₂). Cliquez sur « maille 1 » puis « maille 2 ». La loi des mailles donne <strong>E = U₁</strong> pour la maille 1 et <strong>E = U₂</strong> pour la maille 2 : <strong>U₁ = U₂ = E</strong>. La tension est la même aux bornes de chaque branche.</>,
      tache: { type: 'qcm', q: 'Deux résistors sont en dérivation sur une pile de 6 V. Quelle est la tension aux bornes de R₂ ?', options: ['6 V', '3 V', '12 V', 'Ça dépend de R₂'], bonne: 0, expl: 'En dérivation, la tension est la même aux bornes de chaque branche : 6 V, quelle que soit la valeur de R₂.' } },
    { id: 'noeud', titre: 'Aux nœuds : l’intensité se partage', depart: () => voir('derivation'),
      texte: <>Au <strong>nœud</strong>, le courant arrivant de la pile se sépare en deux : <strong>I = I₁ + I₂</strong> (loi des nœuds). Le plus petit résistor laisse passer le plus grand courant. Changez R₁ et R₂ et vérifiez.
        <ExempleResolu>I = 87 mA et I₁ = 60 mA : I₂ = I − I₁ = <strong>27 mA</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'I = 120 mA et I₁ = 45 mA. Quelle est l’intensité I₂ (en mA) ?', unite: 'mA', vrai: 75, tol: 0.02, affiche: x => String(x), pieges: [[165, 'Tu as additionné : I est la somme I₁ + I₂, donc I₂ = I − I₁.'], [120, 'C’est I, le courant total qui arrive au nœud. I₂ est seulement une partie de I.'], [45, 'C’est I₁. On cherche I₂, l’autre partie du courant.']],
        calcul: () => [
          'Au nœud, le courant I se sépare en deux : loi des nœuds I = I₁ + I₂.',
          'On cherche I₂, donc I₂ = I − I₁ (tous les courants sont déjà en mA, pas de conversion).',
          'I₂ = 120 − 45 = 75 mA.'], expl: 'I₂ = I − I₁ = 120 − 45 = 75 mA.' } },
    { id: 'effet', titre: 'Ajouter ou changer un dipôle', depart: () => voir('serie', { R2: 100 }),
      texte: <>Essayez : en série, augmentez R₂ (de 100 Ω à 1000 Ω) : l’intensité I <strong>diminue</strong>. En dérivation, diminuer R₂ fait <strong>augmenter</strong> I₂, donc le courant total I débité par la pile augmente aussi, mais I₁ ne change pas.</>,
      tache: { type: 'action', ok: enGuide && atelier === 'serie' && C.R2 >= 470, consigne: 'Dans le circuit en série, choisissez R₂ = 470 Ω ou plus et regardez I.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>Série</strong> : une seule maille, <strong>même intensité</strong> partout ; loi des mailles : <strong>E = U₁ + U₂</strong>.</li>
        <li><strong>Dérivation</strong> : deux mailles, <strong>U₁ = U₂ = E</strong> ; loi des nœuds : <strong>I = I₁ + I₂</strong>.</li>
        <li>Ampèremètre en <strong>série</strong> (A), voltmètre en <strong>dérivation</strong> (V).</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { const d = nouveauDefi(type); setDefi(d); setAtelier(type === 'intensites' ? 'derivation' : 'serie'); setC({ E: d.E || 6, R1: d.R1 || alea([100, 150, 220]), R2: d.R2 || alea([330, 470, 680]), mesures: false }); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'tensions'); else setC(c => ({ ...c, mesures: true })); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Générateur idéal</strong> : la pile impose toujours la même tension E, quel que soit le courant qu’elle débite (une vraie pile a une petite « résistance interne » : on la verra en Première).</li>
      <li><strong>Fils sans résistance</strong> : toute la tension se « consomme » dans les résistors. <strong>Résistors ohmiques</strong> à température constante : U = R × I (loi d’Ohm, étudiée dans la simulation suivante).</li>
      <li><strong>Appareils de mesure parfaits</strong> : l’ampèremètre ne change pas le courant, le voltmètre n’en détourne aucun. Régime <strong>continu</strong> : les valeurs ne varient pas dans le temps.</li>
      <li><strong>Points orange</strong> : ils représentent les charges en mouvement dans le sens conventionnel. Leur vitesse est seulement <strong>indicative</strong> (échelle compressée) : plus I est grand, plus ils vont vite.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const choixR = (cle, nom) => <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>{nom} :</span>
    {RES.map(r => <button key={r} onClick={() => setC(c => ({ ...c, [cle]: r }))} style={stylePetitBouton(C[cle] === r, '#0f766e')}>{r} Ω</button>)}</div>;
  const planche = (
    <div style={styleBoite}>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Circuit :</span>
        {[['serie', '➿ En série'], ['derivation', '🔀 En dérivation']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}
        <button onClick={() => setAnim(a => !a)} style={stylePetitBouton(!anim, '#334155')}>{anim ? '⏸ Figer les charges' : '▶ Animer'}</button>
        {(atelier === 'serie' ? [[0, 'aucune maille'], [1, 'maille']] : [[0, 'aucune maille'], [1, 'maille 1'], [2, 'maille 2']]).map(([k, l]) => <button key={k} onClick={() => setC(c => ({ ...c, maille: k }))} style={stylePetitBouton((C.maille || 0) === k, VIOLET)}>{l}</button>)}
        <button onClick={() => setC(c => ({ ...c, mesures: !c.mesures }))} style={stylePetitBouton(C.mesures, '#334155')}>{C.mesures ? 'Cacher' : 'Afficher'} les mesures</button></div>}
      <Schema atelier={atelier} E={C.E} R1={C.R1} R2={C.R2} mesures={C.mesures} maille={enDefi ? 0 : (C.maille || 0)} ph={ph}/>
      {!enDefi && <div style={{ marginTop: 8 }}><Curseur nom="Tension de la pile E" val={C.E} min={3} max={12} pas={1} set={v => setC(c => ({ ...c, E: v }))} unite=" V"/></div>}
      {!enDefi && <>{choixR('R1', 'R₁')}{choixR('R2', 'R₂')}</>}
      {!enDefi && C.mesures && <div style={{ marginTop: 8, fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
        {atelier === 'serie' ? <>U₁ + U₂ = {fr(m.U1, 2)} + {fr(m.U2, 2)} = <strong>{fr(m.U1 + m.U2, 2)} V</strong> = E ✔ ; I partout égale à <strong>{fI(m.I)}</strong>.</>
          : <>I₁ + I₂ = {fr(m.I1 * 1000, 1)} + {fr(m.I2 * 1000, 1)} = <strong>{fr((m.I1 + m.I2) * 1000, 1)} mA</strong> = I ✔ ; U₁ = U₂ = E = <strong>{fr(C.E, 0)} V</strong>.</>}</div>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>En série, mettez R₂ très grand devant R₁ : quel résistor reçoit presque toute la tension ?</li>
        <li>En série, colorez la maille et vérifiez que U₁ + U₂ donne toujours E (loi des mailles).</li>
        <li>En dérivation, mettez R₁ = R₂ : que valent I₁ et I₂ ? Et I par rapport à I₁ ?</li>
        <li>En dérivation, quel résistor laisse passer le plus de courant : le petit ou le grand ?</li>
        <li>Augmentez E : que deviennent toutes les intensités ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>Mailles : série E = U₁ + U₂ ; dérivation U₁ = U₂ = E</li><li>Nœuds : I = I₁ + I₂</li><li>Ampèremètre en série, voltmètre en dérivation</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ci-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ci-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ci-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .ci-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Circuits électriques : intensité et tension</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Comment le courant circule-t-il dans un circuit ? Comparez un circuit <strong>en série</strong> et un circuit <strong>en dérivation</strong>, et découvrez comment l’<strong>intensité</strong> et la <strong>tension</strong> se répartissent.</div>
      <div className={`ci-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="ci-l2">{panneauHypo}</div>}
      {enExplore && <div className="ci-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
