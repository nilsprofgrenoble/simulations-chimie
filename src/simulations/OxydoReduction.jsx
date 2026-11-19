import { useState, useRef, useLayoutEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./redoxModele";
const { COL } = M;
import { QCM } from "./redoxQcm";
import { Esp, Eq, SvgBecher, SvgIonAtome, SvgTransfert, SvgCouple, SvgDemiEquation, SvgOxRed, SvgMethodeEquation, SvgAcide, SvgVerifications } from "./redoxSchemas";

const SIM_ID = 156, CLE_GUIDE = 'redox-1g-guide-v1';
declarerDefis(SIM_ID, [['metal', 'Établir l’équation entre un métal et un ion, ou entre deux ions'], ['acide', 'Établir une équation en milieu acide (H⁺ et H₂O)']]);

// ====================================================
//  SIM 156 — OXYDO-RÉDUCTION : COUPLES, DEMI-ÉQUATIONS ET ÉQUATION DE RÉACTION (1G spé PC, « Constitution et transformations de la matière », 1.B)
//  Une seule idée : une transformation d'oxydo-réduction est un transfert d'électrons entre le réducteur d'un couple et l'oxydant d'un autre ;
//  on le modélise par deux demi-équations, dont la somme (électrons égalisés puis supprimés) est l'équation de réaction.
//  Hors programme, volontairement absents : classification des couples, potentiel redox, milieu basique. Le modèle est dans redoxModele.js (testé).
//  La suite naturelle est le titrage direct (autre simulation du chapitre), non modifiée ici.
//  Capacité visée (jamais affichée à l'élève) : à partir de données expérimentales, identifier le transfert d'électrons entre deux réactifs et le
//  modéliser par des demi-équations électroniques et par une réaction d'oxydo-réduction ; établir une équation de la réaction entre un oxydant
//  et un réducteur, les couples étant donnés.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const TR = Object.fromEntries(M.TRANSFORMATIONS.map(t => [t.id, t]));
const EQ = Object.fromEntries(M.TRANSFORMATIONS.map(t => [t.id, M.equationDe(t)]));
const tirer = l => l[Math.floor(Math.random() * l.length)];
const T = id => M.texte(id);

// Carte « À retenir » repliée par défaut sur téléphone (dans la carte du parcours) : elle ne masque plus la consigne ni la scène.
function Repliable({ children }) {
  const ref = useRef(null);
  const [etat, setEtat] = useState({ dans: false, ouvert: true });
  useLayoutEffect(() => {
    const dans = !!(ref.current && ref.current.closest('[data-carte-parcours]') && !ref.current.closest('[aria-hidden="true"]'));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le DOM (carte du parcours ou fiche) n'est connu qu'après le montage
    if (dans) setEtat({ dans: true, ouvert: false });
  }, []);
  return (
    <div ref={ref}>
      {etat.dans && <button onClick={() => setEtat(e => ({ ...e, ouvert: !e.ouvert }))} aria-expanded={etat.ouvert}
        style={{ ...stylePetitBouton(!etat.ouvert, '#0369a1'), minHeight: 40, margin: '4px 0' }}>{etat.ouvert ? 'Replier la carte ▴' : 'Afficher la carte « À retenir » : schéma et points ▾'}</button>}
      <div inert={!etat.ouvert} aria-hidden={!etat.ouvert} style={etat.ouvert ? undefined : { maxHeight: 0, overflow: 'hidden' }}>{children}</div>
    </div>);
}

// ---------- bandeau « équation de la réaction » : toujours en tête de l'écran ----------
function Banniere({ eq, masque = false, titre = 'Équation de la réaction', note }) {
  return (
    <div data-equation-tete="1" style={{ background: '#f0f9ff', border: `2px solid ${COL.bleu}`, borderRadius: 14, padding: '8px 12px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: COL.bleu, letterSpacing: 0.3, marginBottom: 2 }}>{titre}{masque ? ' (coefficients à établir)' : ''}</div>
      <div style={{ color: KIT.txt, fontSize: 17.5, lineHeight: 1.75 }}><Eq g={eq.reactifs} d={eq.produits} inconnu={masque} taille="clamp(15px, 4.2vw, 17.5px)"/></div>
      {note && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 2 }}>{note}</div>}
    </div>);
}

// ---------- ligne de demi-équation avec multiplicateur ----------
function LigneDemi({ g, d, k, nom, couleur, onMoins, onPlus, fixe }) {
  const mult = t => M.multiplier(t, k);
  return (
    <div style={{ background: 'white', border: `1.5px solid ${couleur}`, borderRadius: 12, padding: '6px 10px', marginBottom: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: couleur }}>{nom}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!fixe && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <button onClick={onMoins} disabled={k <= 1} aria-label={`Diminuer le multiplicateur (${nom})`} style={{ ...stylePetitBouton(false, couleur), minWidth: 42, minHeight: 42, fontSize: 18, opacity: k <= 1 ? 0.4 : 1 }}>−</button>
          <strong style={{ minWidth: 38, textAlign: 'center', fontSize: 17 }}>× {k}</strong>
          <button onClick={onPlus} disabled={k >= 8} aria-label={`Augmenter le multiplicateur (${nom})`} style={{ ...stylePetitBouton(false, couleur), minWidth: 42, minHeight: 42, fontSize: 18, opacity: k >= 8 ? 0.4 : 1 }}>+</button>
        </span>}
        <Eq g={mult(g)} d={mult(d)} signe="=" etat={false} taille={17}/>
      </div>
    </div>);
}

/** Constructeur d'équation : les deux demi-équations (sens de la transformation), leurs multiplicateurs et la somme. */
function Constructeur({ tr, a, b, setA, setB, avecSomme = true }) {
  const s = M.sommer(tr.couple1, tr.couple2, a, b);
  const [ox1] = M.COUPLES[tr.couple1], red2 = M.COUPLES[tr.couple2][1];
  const ref = EQ[tr.id], minimal = a === ref.m1 && b === ref.m2;
  const E1 = a * s.n1, E2 = b * s.n2;
  return (
    <div>
      <LigneDemi nom={`Réduction de ${T(ox1)} (couple ${M.coupleTxt(tr.couple1)})`} couleur={COL.bleu} g={s.d1.gauche} d={s.d1.droite} k={a} onMoins={() => setA(a - 1)} onPlus={() => setA(a + 1)}/>
      <LigneDemi nom={`Oxydation de ${T(red2)} (couple ${M.coupleTxt(tr.couple2)})`} couleur={COL.orange} g={s.d2.droite} d={s.d2.gauche} k={b} onMoins={() => setB(b - 1)} onPlus={() => setB(b + 1)}/>
      <div role="status" aria-live="polite" style={{ fontSize: 14.5, lineHeight: 1.55, fontWeight: 700, padding: '6px 10px', borderRadius: 10, margin: '6px 0',
        background: s.egal ? '#f0fdf4' : '#fff7ed', border: `1px solid ${s.egal ? '#86efac' : '#fdba74'}`, color: s.egal ? '#15803d' : '#9a3412' }}>
        Électrons captés : {a} × {s.n1} = {E1} · électrons cédés : {b} × {s.n2} = {E2}
        <div style={{ fontWeight: 600 }}>{s.egal ? (minimal ? '✓ Autant d’électrons captés que cédés : ils vont s’annuler.' : '✓ Les électrons sont égaux, mais on peut prendre des multiplicateurs plus petits.') : '✗ Pas encore : les électrons captés et cédés ne sont pas en même nombre.'}</div>
      </div>
      {avecSomme && s.egal && <div style={{ background: 'white', border: `1.5px solid ${COL.vert}`, borderRadius: 12, padding: '6px 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: COL.vert }}>Somme des deux demi-équations, électrons supprimés</div>
        <Eq g={s.reactifs} d={s.produits} taille={17}/></div>}
    </div>);
}

// ---------- demi-équation de base d'un couple (affichage) ----------
const demiConv = couple => { const [ox, red] = M.COUPLES[couple], d = M.demiEquation(ox, red); return <Eq g={d.gauche} d={d.droite} signe="=" etat={false} taille={17}/>; };
const Curs = ({ t, onChange, label = 'Temps écoulé' }) => (
  <label style={{ display: 'block', margin: '8px 0 0', fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>{label}
    <input type="range" min="0" max="1" step="0.01" value={t} onChange={x => onChange(parseFloat(x.target.value))} aria-label={label} style={{ width: '100%', accentColor: COL.bleu, display: 'block' }}/>
    <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600 }}><span>début</span><span>quelques minutes plus tard</span></span>
  </label>);
const becher = (tr, t, extra = {}) => (
  <SvgBecher plaque={tr.plaque} depot={tr.depot} gaz={!!tr.gaz} avant={tr.avant} apres={tr.apres} t={t}
    legendeHaut={tr.plaque ? { Fe: 'lame de fer', Cu: 'fil de cuivre', Zn: 'lame de zinc', Al: 'lame d’aluminium' }[tr.plaque] : ''} legendeBas={tr.solution} {...extra}/>);

// Entité de défi : tirage hors du composant (il utilise le hasard)
function tirerTransformation(type, exclu) {
  const pool = M.TRANSFORMATIONS.filter(t => (type === 'acide' ? t.famille === 'acide' : t.famille !== 'acide') && t.id !== exclu);
  return tirer(pool);
}

// ====================================================
export function SimulationOxydoReduction() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviM, noterM] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('metal');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [tp, setTp] = useState({ cle: '', t: 0 });
  const [mult, setMult] = useState({ cle: '', a: 1, b: 1 });
  const [ex, setEx] = useState({ id: 'fe-cu', t: 0.85, ouv: { demi: true } });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['obs', 'ion-cu', 'role', 'demi-cu', 'oxred', 'electrons', 'ag-n', 'egaliser', 'eq-cuag', 'iode-n', 'eq-fei', 'acide-h', 'acide-e', 'erreur'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const tVal = tp.cle === idE ? tp.t : (idE === 'obs' ? 0 : 0.85);
  const setT = t => setTp({ cle: idE, t });
  const cleMult = enGuide ? idE : `ex-${ex.id}`;
  const mA = mult.cle === cleMult ? mult.a : 1, mB = mult.cle === cleMult ? mult.b : 1;
  const setA = a => setMult({ cle: cleMult, a, b: mB }), setB = b => setMult({ cle: cleMult, a: mA, b });
  const reussie = id => !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);

  const ETAPES = [
    { id: 'obs', titre: 'Une lame de fer dans une solution', focus: ['scene'],
      texte: <>On plonge une lame de fer dans une solution bleue de sulfate de cuivre(II), qui contient des ions Cu²⁺. Avec le temps, on observe un <strong>dépôt rouge-orangé</strong> sur la lame et la solution <strong>pâlit et verdit légèrement</strong> : une transformation chimique a lieu. Son équation, qui conserve les éléments et la charge comme en seconde, est écrite en haut de l’écran. Que se passe-t-il à l’échelle des particules ? C’est ce que ce parcours va expliquer.</>,
      tache: { type: 'action', ok: tVal >= 0.7, consigne: 'Fais avancer la transformation avec le curseur « Temps écoulé » jusqu’à voir le dépôt sur la lame.' } },
    { id: 'ion-cu', titre: 'De l’ion cuivre à l’atome de cuivre', focus: ['scene'],
      texte: <>Dans la solution, le cuivre est présent sous forme d’<strong>ions Cu²⁺</strong>, de charge +2. Sur la lame, il apparaît sous forme d’<strong>atomes Cu</strong>, électriquement neutres. Pour passer de l’ion à l’atome, la charge de l’espèce doit diminuer : elle a <strong>capté des électrons</strong> e⁻ (chacun porte la charge −e, avec e = 1,6 × 10⁻¹⁹ C).</>,
      tache: { type: 'num', q: 'Combien d’électrons un ion Cu²⁺ doit-il capter pour devenir un atome Cu ?', carnet: 'Électrons captés par un ion Cu²⁺', unite: 'électrons', vrai: 2, tol: 0.001, affiche: v => String(v),
        calcul: () => ['Charge de l’ion Cu²⁺ : +2 (en unités e). Charge de l’atome Cu : 0.', 'Chaque électron apporte la charge −1 : il en faut 2 pour passer de +2 à 0.'],
        pieges: [[1, 'Un seul électron ramènerait la charge de +2 à +1 : l’atome Cu est neutre, il faut aller jusqu’à 0.'], [4, 'Il ne faut pas doubler : chaque électron apporte −1, et la charge à compenser est +2.'], [0, 'L’ion n’est pas neutre : sa charge est +2, il faut des électrons pour la compenser.']],
        expl: 'Cu²⁺ (charge +2) devient Cu (charge 0) en captant 2 électrons, chacun de charge −1.', indice: 'La charge de l’ion est +2, celle de l’atome 0. Chaque électron ajoute −1 à la charge : combien en faut-il ?' } },
    { id: 'role', titre: 'Qui donne, qui reçoit ?', focus: ['scene'],
      texte: <>Les électrons captés par les ions Cu²⁺ viennent de la lame : l’atome de fer Fe devient un ion <strong>Fe²⁺</strong> en perdant 2 électrons. Il y a donc un <strong>transfert d’électrons</strong> entre le fer et les ions cuivre(II). On dit qu’un <strong>oxydant</strong> est une espèce capable de <strong>capter</strong> des électrons, et un <strong>réducteur</strong> une espèce capable d’en <strong>céder</strong>.</>,
      tache: { type: 'qcm', ...QCM.role } },
    { id: 'demi-cu', titre: 'Écrire le passage de l’ion à l’atome', focus: ['scene'],
      retenirTitre: 'À RETENIR : OXYDANT, RÉDUCTEUR, COUPLE',
      retenir: <Repliable key="c1">
        <SvgCouple/>
        <ul style={liste}>
          <li><strong>Oxydant = il capte des électrons ; réducteur = il en cède.</strong> Deux espèces qui ne diffèrent que par des électrons forment un <strong>couple Ox/Red</strong>.</li>
          <li>Exemple de la simulation : le couple Cu²⁺/Cu, avec l’oxydant Cu²⁺ avant la barre oblique.</li>
          <li><strong>Moyen de s’en souvenir</strong> : l’oxydant « oxyde » l’autre espèce en lui prenant des électrons.</li>
          <li><strong>Idée fausse</strong> : « le réducteur reçoit des électrons puisqu’il réduit ». <strong>Vrai</strong> : le réducteur CÈDE des électrons, c’est l’oxydant qui en capte.</li>
        </ul></Repliable>,
      texte: <>Les espèces <strong>Cu²⁺</strong> (oxydant) et <strong>Cu</strong> (réducteur) ne diffèrent que par des électrons : elles forment le <strong>couple Cu²⁺/Cu</strong>. On modélise le passage de l’une à l’autre par une <strong>demi-équation électronique</strong>, où l’oxydant et les électrons sont à gauche du signe égal.</>,
      tache: { type: 'qcm', ...QCM.demiCu } },
    { id: 'oxred', titre: 'Le couple du fer', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA DEMI-ÉQUATION',
      retenir: <Repliable key="c2">
        <SvgDemiEquation/>
        <ul style={liste}>
          <li><strong>Ox + n e⁻ = Red</strong> : les électrons sont du côté de l’oxydant, n est un entier, les éléments ET la charge sont conservés.</li>
          <li>Exemple : Zn²⁺ + 2 e⁻ = Zn (n = 2). On écrit le signe <strong>=</strong> (ou ⇄), jamais →.</li>
          <li><strong>Idée fausse</strong> : « les électrons circulent librement dans la solution ». <strong>Vrai</strong> : des électrons libres n’existent pas en solution ; la demi-équation est un modèle d’écriture, seul le bilan est observé.</li>
        </ul></Repliable>,
      texte: <>Le fer et l’ion Fe²⁺ forment le couple <strong>Fe²⁺/Fe</strong>, de demi-équation Fe²⁺ + 2 e⁻ = Fe. Dans la transformation étudiée, c’est le sens inverse qui a lieu : le fer est consommé, l’atome Fe devient Fe²⁺ <strong>en perdant des électrons</strong>. Une <strong>réduction</strong> est un gain d’électrons.</>,
      tache: { type: 'qcm', ...QCM.oxred } },
    { id: 'electrons', titre: 'Additionner les deux demi-équations', focus: ['scene'],
      retenirTitre: 'À RETENIR : OXYDATION ET RÉDUCTION',
      retenir: <Repliable key="c3">
        <SvgOxRed/>
        <ul style={liste}>
          <li><strong>Réduction</strong> : l’oxydant GAGNE des électrons (Ox + n e⁻ = Red). <strong>Oxydation</strong> : le réducteur PERD des électrons (Red = Ox + n e⁻).</li>
          <li>Exemple de la simulation : Fe → Fe²⁺ + 2 e⁻ est une oxydation ; Cu²⁺ + 2 e⁻ → Cu est une réduction.</li>
          <li><strong>Moyen de s’en souvenir</strong> : Réduction = Reçoit des électrons ; les électrons sont à gauche pour une réduction, à droite pour une oxydation.</li>
          <li><strong>Idée fausse</strong> : « l’oxydant subit une oxydation ». <strong>Vrai</strong> : l’oxydant subit une RÉDUCTION (il capte), le réducteur subit une OXYDATION (il cède).</li>
        </ul></Repliable>,
      texte: <>Une <strong>réaction d’oxydo-réduction</strong> est un transfert d’électrons entre le réducteur d’un couple et l’oxydant d’un autre. Ici : la réduction de Cu²⁺ et l’oxydation de Fe ont lieu en même temps. On écrit les deux demi-équations dans le sens où elles se produisent, puis on les additionne membre à membre.</>,
      tache: { type: 'qcm', ...QCM.electrons } },
    { id: 'ag-n', titre: 'Un fil de cuivre dans une solution d’ions argent', focus: ['scene'],
      texte: <>Autre expérience : on plonge un fil de cuivre dans une solution incolore de nitrate d’argent (ions Ag⁺). Des <strong>cristaux d’argent</strong> se déposent sur le fil et la solution devient <strong>bleue</strong> : des ions Cu²⁺ apparaissent. Les couples en jeu sont <strong>Ag⁺/Ag</strong> et <strong>Cu²⁺/Cu</strong> (Cu²⁺ + 2 e⁻ = Cu).</>,
      tache: { type: 'num', q: 'Combien d’électrons un ion Ag⁺ doit-il capter pour devenir un atome Ag ?', carnet: 'Électrons captés par un ion Ag⁺', unite: 'électron(s)', vrai: 1, tol: 0.001, affiche: v => String(v),
        calcul: () => ['Charge de l’ion Ag⁺ : +1. Charge de l’atome Ag : 0.', 'Il faut compenser +1 : un seul électron suffit.'],
        pieges: [[2, 'C’est le cas de Cu²⁺ (charge +2). L’ion Ag⁺ n’a que la charge +1.'], [0, 'L’ion n’est pas neutre : sa charge est +1, il faut un électron pour la compenser.']],
        expl: 'Ag⁺ (charge +1) devient Ag (charge 0) en captant 1 électron : Ag⁺ + e⁻ = Ag.', indice: 'Quelle est la charge de Ag⁺ ? Combien d’électrons (charge −1 chacun) faut-il pour arriver à la charge 0 ?' } },
    { id: 'egaliser', titre: 'Autant d’électrons captés que cédés', focus: ['scene'],
      texte: <>Le cuivre cède ses électrons aux ions argent. On écrit les deux demi-équations dans le sens où elles ont lieu : <strong>Ag⁺ + e⁻ = Ag</strong> (réduction) et <strong>Cu = Cu²⁺ + 2 e⁻</strong> (oxydation). On <strong>multiplie</strong> chaque demi-équation par un nombre entier pour que les électrons captés soient aussi nombreux que ceux cédés (avec les plus petits multiplicateurs).</>,
      tache: { type: 'action', ok: mA * 1 === 2 && mB === 1, consigne: 'Règle les deux multiplicateurs jusqu’à ce que les électrons captés et cédés soient égaux, avec les plus petits nombres possibles.' } },
    { id: 'eq-cuag', titre: 'L’équation de la réaction du cuivre et de l’argent', focus: ['scene'],
      texte: <>Avec les multiplicateurs trouvés, les demi-équations sont <strong>2 Ag⁺ + 2 e⁻ = 2 Ag</strong> et <strong>Cu = Cu²⁺ + 2 e⁻</strong>. En les additionnant membre à membre, les électrons des deux côtés <strong>disparaissent</strong>, et on obtient l’équation de réaction, qui s’écrit avec une flèche.</>,
      tache: { type: 'qcm', ...QCM.eqCuAg } },
    { id: 'iode-n', titre: 'Le couple du diiode', focus: ['scene'],
      retenirTitre: 'À RETENIR : ÉQUATION DE RÉACTION',
      retenir: <Repliable key="c4">
        <SvgMethodeEquation/>
        <ul style={liste}>
          <li><strong>Trois temps</strong> : écrire les deux demi-équations dans le bon sens, multiplier pour égaliser les électrons, additionner. <strong>Aucun électron ne reste dans l’équation de réaction.</strong></li>
          <li>Exemple de la simulation : (Ag⁺ + e⁻ = Ag) × 2 et Cu = Cu²⁺ + 2 e⁻ donnent Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « égaliser, additionner, simplifier ». On vérifie ensuite les éléments et la charge de chaque côté.</li>
          <li><strong>Idée fausse</strong> : « l’équation de réaction garde les e⁻ ». <strong>Vrai</strong> : ils s’annulent toujours dans le bilan.</li>
        </ul></Repliable>,
      texte: <>Troisième transformation : on ajoute des ions fer(III) <strong>Fe³⁺</strong> (solution orangée) à une solution incolore d’iodure de potassium, qui contient des ions <strong>I⁻</strong>. La solution devient <strong>brune</strong> : du diiode <strong>I₂</strong> se forme. Les couples sont <strong>Fe³⁺/Fe²⁺</strong> (Fe³⁺ + e⁻ = Fe²⁺) et <strong>I₂/I⁻</strong>. Pour écrire la demi-équation du second couple, il faut d’abord conserver l’élément iode : I₂ + 2 e⁻ = … I⁻.</>,
      tache: { type: 'num', q: <>Quel nombre d’ions I⁻ doit figurer à droite dans la demi-équation I₂ + 2 e⁻ = … I⁻ ?</>, carnet: 'Coefficient de I⁻ dans I₂ + 2 e⁻ = … I⁻', unite: 'ions I⁻', vrai: 2, tol: 0.001, affiche: v => String(v),
        calcul: () => ['Le diiode I₂ contient 2 atomes d’iode : à droite il faut aussi 2 atomes d’iode, donc 2 ions I⁻.', 'Charge : à gauche 0 + 2 × (−1) = −2 ; à droite 2 × (−1) = −2. ✓'],
        pieges: [[1, 'Il faut conserver l’élément iode : I₂ contient 2 atomes I, il en faut 2 à droite.'], [4, 'I₂ contient 2 atomes d’iode : il en faut 2 à droite, pas 4.'], [3, 'Il faut autant d’atomes d’iode de chaque côté : I₂ en contient 2.']],
        expl: 'I₂ contient 2 atomes d’iode : on écrit I₂ + 2 e⁻ = 2 I⁻ (charge −2 de chaque côté).', indice: 'Compte les atomes d’iode à gauche (dans I₂), puis écris autant d’ions I⁻ à droite. Vérifie ensuite la charge.' } },
    { id: 'eq-fei', titre: 'L’équation de la réaction entre Fe³⁺ et I⁻', focus: ['scene'],
      texte: <>Les deux demi-équations dans le sens où elles ont lieu sont <strong>Fe³⁺ + e⁻ = Fe²⁺</strong> (1 électron échangé) et <strong>2 I⁻ = I₂ + 2 e⁻</strong> (2 électrons échangés). Il faut multiplier l’une d’elles pour égaliser les électrons, puis additionner.</>,
      tache: { type: 'qcm', ...QCM.eqFei } },
    { id: 'acide-h', titre: 'Une demi-équation avec de l’eau et des ions H⁺', focus: ['scene'],
      texte: <>Les ions permanganate <strong>MnO₄⁻</strong> (violets) réagissent avec les ions Fe²⁺ en <strong>milieu acide</strong>. Le couple <strong>MnO₄⁻/Mn²⁺</strong> fait intervenir l’eau et les ions H⁺. Les couples (formules de l’oxydant et du réducteur) sont toujours donnés ; il reste à équilibrer la demi-équation, en quatre temps : ① les éléments autres que O et H (1 Mn de chaque côté) ; ② l’oxygène, avec H₂O : MnO₄⁻ contient 4 O, on écrit donc 4 H₂O à droite ; ③ l’hydrogène, avec H⁺ ; ④ les charges, avec e⁻.</>,
      tache: { type: 'num', q: <>Temps ③ : combien d’ions H⁺ faut-il écrire à gauche pour conserver l’hydrogène des 4 H₂O ?</>, carnet: 'Nombre de H⁺ (MnO₄⁻/Mn²⁺)', unite: 'ions H⁺', vrai: 8, tol: 0.001, affiche: v => String(v),
        calcul: () => ['À droite, 4 H₂O contiennent 4 × 2 = 8 atomes d’hydrogène.', 'À gauche, MnO₄⁻ n’en contient pas : il faut 8 H⁺.'],
        pieges: [[4, 'Chaque molécule H₂O contient 2 atomes d’hydrogène : 4 H₂O en contiennent 8, pas 4.'], [16, 'Ne multiplie pas deux fois : 4 H₂O contiennent 4 × 2 = 8 atomes d’hydrogène.'], [2, 'Il y a 4 molécules d’eau, pas une seule : compte tous leurs atomes d’hydrogène.']],
        expl: '4 H₂O contiennent 8 atomes H, apportés par 8 H⁺ à gauche : MnO₄⁻ + 8 H⁺ + … e⁻ = Mn²⁺ + 4 H₂O.', indice: 'Compte les atomes d’hydrogène à droite dans 4 H₂O (2 par molécule) : ils doivent venir des H⁺ placés à gauche.' } },
    { id: 'acide-e', titre: 'Les charges de la demi-équation', focus: ['scene'],
      texte: <>On a obtenu <strong>MnO₄⁻ + 8 H⁺ + … e⁻ = Mn²⁺ + 4 H₂O</strong>. Dernier temps ④ : il reste à <strong>égaliser les charges</strong> avec des électrons, placés du côté de l’oxydant. Les formules des deux espèces du couple sont données ; pense à calculer la charge totale de chaque membre avant d’ajouter les électrons.</>,
      tache: { type: 'num', q: <>Combien d’électrons e⁻ faut-il écrire à gauche ?</>, carnet: 'Électrons de MnO₄⁻/Mn²⁺', unite: 'électrons', vrai: 5, tol: 0.001, affiche: v => String(v),
        calcul: () => ['Charge à gauche sans électrons : (−1) + 8 × (+1) = +7. Charge à droite : (+2) + 4 × 0 = +2.', 'Il faut retirer 7 − 2 = 5 charges + à gauche : 5 électrons.'],
        pieges: [[7, 'Tu as pris la charge totale de gauche : il faut la ramener à la charge de droite (+2), donc retirer 7 − 2.'], [2, 'La charge à droite est +2, mais ce qu’il faut ajouter est la différence entre les deux membres.'], [9, 'Il faut retrancher la charge de droite (+2) à celle de gauche (+7), pas l’ajouter.']],
        expl: '+7 à gauche (sans e⁻) et +2 à droite : il faut 5 électrons à gauche. MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O.', indice: 'Calcule la charge totale à gauche (MnO₄⁻ et 8 H⁺) puis à droite. La différence est le nombre d’électrons.' } },
    { id: 'erreur', titre: 'Repérer l’erreur dans une équation', focus: ['scene'],
      retenirTitre: 'À RETENIR : DEMI-ÉQUATION EN MILIEU ACIDE',
      retenir: <Repliable key="c5">
        <SvgAcide/>
        <ul style={liste}>
          <li><strong>Quatre temps dans l’ordre : les éléments autres que O et H, puis O avec H₂O, puis H avec H⁺, puis les charges avec e⁻.</strong></li>
          <li>Exemple de la simulation : MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O (4 H₂O → 8 H⁺ ; charges +7 → +2 : 5 e⁻).</li>
          <li><strong>Moyen de s’en souvenir</strong> : « X, O, H, charges » : les électrons viennent toujours en dernier.</li>
          <li><strong>Idée fausse</strong> : « on commence par les électrons ». <strong>Vrai</strong> : on équilibre d’abord la matière, puis les charges.</li>
        </ul></Repliable>,
      texte: <>Un élève propose une équation pour la réaction du zinc avec les ions argent, <strong>écrite en haut de l’écran</strong>. Il y a bien un transfert d’électrons entre le réducteur Zn (couple Zn²⁺/Zn) et l’oxydant Ag⁺ (couple Ag⁺/Ag). Vérifie son équation : éléments, charge.</>,
      tache: { type: 'qcm', ...QCM.erreur } },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ---------- bandeau en tête : équation de la transformation du moment ----------
  const EQ_ERREUR = { reactifs: [['Zn', 1], ['Agp', 1]], produits: [['Zn2p', 1], ['Ag', 1]] };
  function bandeau() {
    if (enGuide) {
      if (['obs', 'ion-cu', 'role', 'demi-cu', 'oxred', 'electrons'].includes(idE)) return <Banniere eq={EQ['fe-cu']}/>;
      if (['ag-n', 'egaliser', 'eq-cuag'].includes(idE)) return <Banniere eq={EQ['cu-ag']} masque={!reussie('eq-cuag')}/>;
      if (['iode-n', 'eq-fei'].includes(idE)) return <Banniere eq={EQ['fe3-i']} masque={!reussie('eq-fei')}/>;
      if (['acide-h', 'acide-e'].includes(idE)) return <Banniere eq={EQ['mno4-fe2']} masque={!reussie('acide-e')}/>;
      return <Banniere eq={EQ_ERREUR} titre="Équation proposée par un élève (à contrôler)" note="Zn(s) : zinc solide ; Ag⁺(aq) : ions argent en solution ; Zn²⁺(aq) : ions zinc ; Ag(s) : argent solide."/>;
    }
    if (enDefi && defi) { const t = TR[defi.id]; return <Banniere eq={EQ[t.id]} masque={!defi.ok}/>; }
    return <Banniere eq={EQ[ex.id]}/>;
  }

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const fleche = <span aria-hidden="true">→</span>;
  const ligneBox = (titre, corps, couleur = KIT.bord) => (
    <div style={{ background: 'white', border: `1.5px solid ${couleur}`, borderRadius: 12, padding: '6px 10px', marginTop: 8, color: KIT.txt }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: KIT.txt2 }}>{titre}</div><div>{corps}</div></div>);
  const DM = (couple, inverse = false, k = 1) => { const [ox, red] = M.COUPLES[couple], d = M.demiEquation(ox, red); return <Eq g={M.multiplier(inverse ? d.droite : d.gauche, k)} d={M.multiplier(inverse ? d.gauche : d.droite, k)} signe="=" etat={false} taille={17}/>; };
  const sceneGuide = (() => {
    if (!idE) return null;
    const cuag = TR['cu-ag'], fei = TR['fe3-i'];
    if (idE === 'obs') return boite('Lame de fer dans une solution de cuivre(II)', <>{becher(TR['fe-cu'], tVal)}<Curs t={tVal} onChange={setT}/>{aide(TR['fe-cu'].obs)}</>, cadre('scene'));
    if (idE === 'ion-cu') return boite('À l’échelle des particules', <SvgIonAtome ion="Cu2p" atome="Cu" n={2} montre={false}/>, cadre('scene'));
    if (idE === 'role') return boite('Le transfert d’électrons', <SvgTransfert/>, cadre('scene'));
    if (idE === 'demi-cu') return boite('Le couple du cuivre', <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 130px', background: '#e0f2fe', border: `2px solid ${COL.bleu}`, borderRadius: 12, padding: '6px 10px', textAlign: 'center' }}><div style={{ fontSize: 13, fontWeight: 800, color: COL.bleu }}>OXYDANT</div><div style={{ fontSize: 18 }}><Esp id="Cu2p"/></div></div>
        <div style={{ flex: '1 1 130px', background: '#fef3c7', border: `2px solid ${COL.orange}`, borderRadius: 12, padding: '6px 10px', textAlign: 'center' }}><div style={{ fontSize: 13, fontWeight: 800, color: COL.orange }}>RÉDUCTEUR</div><div style={{ fontSize: 18 }}><Esp id="Cu"/></div></div>
      </div>
      {aide('Couple Cu²⁺/Cu : l’oxydant s’écrit avant la barre oblique, le réducteur après.')}</>, cadre('scene'));
    if (idE === 'oxred') return boite('Le couple du fer', <>
      {ligneBox('Demi-équation du couple Fe²⁺/Fe (oxydant à gauche)', DM('Fe2p/Fe'))}
      {ligneBox('Ce qui se passe dans la transformation étudiée', <span style={{ fontSize: 17, color: KIT.txt }}><Esp id="Fe"/> {fleche} <Esp id="Fe2p"/> + 2 e⁻</span>, COL.orange)}</>, cadre('scene'));
    if (idE === 'electrons') return boite('Les deux demi-équations, dans le sens où elles ont lieu', <>
      {ligneBox('Réduction de l’oxydant Cu²⁺', DM('Cu2p/Cu'), COL.bleu)}
      {ligneBox('Oxydation du réducteur Fe', DM('Fe2p/Fe', true), COL.orange)}
      {ligneBox('Addition membre à membre', <Eq g={[['Cu2p', 1], ['Fe', 1], ['em', 2]]} d={[['Cu', 1], ['Fe2p', 1], ['em', 2]]} signe="=" etat={false} taille={17}/>)}</>, cadre('scene'));
    if (idE === 'ag-n') return boite('Fil de cuivre dans une solution de nitrate d’argent', <>{becher(cuag, tVal)}<Curs t={tVal} onChange={setT}/>{aide(cuag.obs)}</>, cadre('scene'));
    if (idE === 'egaliser') return boite('Égaliser les électrons', <Constructeur tr={cuag} a={mA} b={mB} setA={setA} setB={setB} avecSomme={false}/>, cadre('scene'));
    if (idE === 'eq-cuag') return boite('Les demi-équations multipliées', <>
      {ligneBox('Réduction de Ag⁺ (× 2)', DM('Ag+/Ag', false, 2), COL.bleu)}
      {ligneBox('Oxydation de Cu (× 1)', DM('Cu2p/Cu', true, 1), COL.orange)}</>, cadre('scene'));
    if (idE === 'iode-n') return boite('Fe³⁺ et I⁻ en solution', <>{becher(fei, tVal)}<Curs t={tVal} onChange={setT} label="Temps écoulé après le mélange"/>
      {ligneBox('Demi-équation du couple I₂/I⁻ à compléter', <span style={{ fontSize: 17, color: KIT.txt }}><Esp id="I2"/> + 2 e⁻ = <span style={{ color: COL.orange, fontWeight: 800 }}>?</span> <Esp id="Im"/></span>)}</>, cadre('scene'));
    if (idE === 'eq-fei') return boite('Les deux demi-équations, dans le sens où elles ont lieu', <>
      {ligneBox('Réduction de l’oxydant Fe³⁺ (1 électron)', DM('Fe3p/Fe2p'), COL.bleu)}
      {ligneBox('Oxydation du réducteur I⁻ (2 électrons)', DM('I2/Im', true), COL.orange)}</>, cadre('scene'));
    if (idE === 'acide-h') return boite('Couple MnO₄⁻/Mn²⁺ : temps ① et ②', <>
      {ligneBox('Demi-équation en cours', <span style={{ fontSize: 17, color: KIT.txt }}><Esp id="MnO4m"/> + <span style={{ color: COL.orange, fontWeight: 800 }}>? </span><Esp id="Hp"/> + <span style={{ color: COL.orange, fontWeight: 800 }}>? </span>e⁻ = <Esp id="Mn2p"/> + 4 <Esp id="H2O"/></span>)}
      {aide('Les ions MnO₄⁻ sont violets, les ions Mn²⁺ presque incolores : la solution se décolore.')}</>, cadre('scene'));
    if (idE === 'acide-e') return boite('Couple MnO₄⁻/Mn²⁺ : temps ④', <>
      {ligneBox('Demi-équation en cours', <span style={{ fontSize: 17, color: KIT.txt }}><Esp id="MnO4m"/> + 8 <Esp id="Hp"/> + <span style={{ color: COL.orange, fontWeight: 800 }}>? </span>e⁻ = <Esp id="Mn2p"/> + 4 <Esp id="H2O"/></span>)}
      {aide('Une charge d’électron vaut −1.')}</>, cadre('scene'));
    if (idE === 'erreur') return boite('Du zinc dans une solution d’ions argent', <>{becher(TR['zn-ag'], tVal)}<Curs t={tVal} onChange={setT}/>{aide(TR['zn-ag'].obs)}</>, cadre('scene'));
    return null;
  })();

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { const t = tirerTransformation(type, defi && defi.id); setDefi({ type, id: t.id, E: '', coefs: {}, verifie: false, ok: false, res: null, echecs: 0 }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const trD = defi ? TR[defi.id] : null, refD = defi ? EQ[defi.id] : null;
  const cleC = (cote, id) => `${cote}-${id}`;
  const signe = q => (q > 0 ? `+${q}` : q < 0 ? `−${Math.abs(q)}` : '0');
  const verifierDefi = () => {
    const lire = (cote, id) => lireNombre(defi.coefs[cleC(cote, id)]);
    const prop = { reactifs: refD.reactifs.map(([id]) => [id, lire('r', id)]), produits: refD.produits.map(([id]) => [id, lire('p', id)]) };
    const tous = [...prop.reactifs, ...prop.produits].map(([, c]) => c);
    const complet = tous.every(c => Number.isInteger(c) && c >= 1);
    const E = lireNombre(defi.E), okE = E === refD.E;
    const res = complet ? M.verifierEquation(prop, refD) : null;
    const ok = !!(res && res.juste && okE);
    setDefi(d => ({ ...d, verifie: true, ok, res, complet, okE, echecs: ok ? 0 : (d.echecs || 0) + 1 })); (defi.type === 'metal' ? noterM : noterA)(ok);
  };
  const champCoef = (cote, id) => {
    const k = cleC(cote, id);
    return (<input key={k} value={defi.coefs[k] ?? ''} inputMode="numeric" aria-label={`Coefficient de ${T(id)}`} placeholder="?"
      onChange={x => setDefi(d => ({ ...d, coefs: { ...d.coefs, [k]: x.target.value }, verifie: false }))}
      style={{ width: 46, padding: '6px 4px', textAlign: 'center', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 16, minHeight: 38 }}/>);
  };
  const termeDefi = (cote, [id], k) => (
    <span key={id} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {k > 0 && <span style={{ margin: '0 4px' }}>+</span>}{champCoef(cote, id)}<span style={{ fontSize: 17, color: KIT.txt }}><Esp id={id} etat/></span></span>);
  const [oxD, redD] = trD ? [M.COUPLES[trD.couple1][0], M.COUPLES[trD.couple2][1]] : [null, null];
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['metal', 'Sans milieu acide'], ['acide', 'En milieu acide']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : établis l’équation de la réaction entre <Esp id={redD}/> et <Esp id={oxD}/></div>
      {trD.plaque && <div style={{ marginBottom: 8 }}>{becher(trD, 0.85)}</div>}
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        {trD.obs} Le réducteur est <strong><Esp id={redD}/></strong> (couple {M.coupleTxt(trD.couple2)}), l’oxydant est <strong><Esp id={oxD}/></strong> (couple {M.coupleTxt(trD.couple1)}).{trD.famille === 'acide' && <> Le milieu est acide : des ions H⁺(aq) et de l’eau H₂O(l) interviennent.</>}
        {' '}Écris l’équation avec les plus petits coefficients entiers, puis donne le nombre d’électrons échangés.</div>
      <div style={{ ...styleBoite, background: 'white', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', rowGap: 8 }}>
          {refD.reactifs.map((t, k) => termeDefi('r', t, k))}<span style={{ margin: '0 8px', fontSize: 18 }}>→</span>{refD.produits.map((t, k) => termeDefi('p', t, k))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, marginTop: 10, flexWrap: 'wrap' }}>
          <span>Nombre d’électrons échangés (pour cette équation)</span>
          <input value={defi.E} inputMode="numeric" aria-label="Nombre d’électrons échangés" onChange={x => setDefi(d => ({ ...d, E: x.target.value, verifie: false }))}
            style={{ width: 70, padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 15, minHeight: 38 }}/>
        </label>
      </div>
      <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Méthode : écris la demi-équation de chaque couple (oxydant + n e⁻ = réducteur), puis dans le sens de la transformation ; en milieu acide : éléments autres que O et H, O avec H₂O, H avec H⁺, charges avec e⁻. Multiplie pour avoir le même nombre d’électrons captés et cédés (le plus petit multiple commun), additionne et simplifie ce qui apparaît des deux côtés. Contrôle les éléments et la charge. Le nombre d’électrons échangés est ce plus petit multiple commun.</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="rx-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Autre transformation</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : l’équation est juste (éléments et charge conservés, plus petits coefficients) et {defi.E} électrons sont échangés.</div> : <>
          {!defi.complet && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Complète tous les coefficients avec des nombres entiers supérieurs ou égaux à 1.</div>}
          {defi.complet && defi.res && !defi.res.ok && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ L’équation n’est pas correcte : {defi.res.manque.length > 0 ? `l’élément ${defi.res.manque.join(', ')} n’est pas conservé` : `la charge n’est pas conservée (${signe(defi.res.g.q)} à gauche, ${signe(defi.res.d.q)} à droite)`}.</div>}
          {defi.complet && defi.res && defi.res.ok && !defi.res.plusPetits && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ L’équation est conservée, mais ses coefficients ne sont pas les plus petits entiers possibles : simplifie.</div>}
          {!defi.okE && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Nombre d’électrons échangés : c’est celui des demi-équations après multiplication (plus petit multiple commun de leurs nombres d’électrons).</div>}
        </>}</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Les électrons libres n’existent pas en solution</strong> : une demi-équation est un modèle d’écriture qui sépare le gain et la perte d’électrons ; seule l’équation de réaction, où ils ont disparu, décrit une transformation observable.</li>
      <li><strong>Le sens de la transformation est donné</strong> : les transformations proposées ont réellement lieu. La simulation ne prévoit pas quel oxydant réagit avec quel réducteur (classer les couples est hors programme de première) : on étudie une réaction entre le réducteur d’un couple et l’oxydant d’un autre, les couples étant donnés.</li>
      <li><strong>Équation de réaction</strong> : elle conserve les éléments ET la charge ; les nombres stœchiométriques sont les plus petits entiers possibles. Écrite avec une flèche simple, elle suppose une transformation qui consomme complètement le réactif limitant ; l’avancement n’est pas discuté ici.</li>
      <li><strong>Milieu acide seulement</strong> : l’eau et les ions H⁺ de la solution servent à équilibrer O et H. Le milieu basique est hors programme de première.</li>
      <li><strong>Méthode en quatre temps</strong> : éléments autres que O et H, puis O avec H₂O, puis H avec H⁺, puis charges avec e⁻. Elle est valable pour les couples de la simulation (c’est une règle d’écriture).</li>
      <li><strong>Les schémas sont qualitatifs</strong> : couleurs indicatives, dépôt et bulles non à l’échelle, le curseur de temps ne donne aucune durée. Les ions spectateurs (SO₄²⁻, NO₃⁻, K⁺, Cl⁻) ne figurent pas dans l’équation.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const tX = TR[ex.id], refX = EQ[ex.id];
  const setE = f => setEx(s => ({ ...s, ...f }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const nomTr = t => `${M.texte(M.COUPLES[t.couple2][1])} + ${M.texte(M.COUPLES[t.couple1][0])}`;
  const optsGroupe = (titre, f) => <optgroup label={titre}>{M.TRANSFORMATIONS.filter(f).map(t => <option key={t.id} value={t.id}>{nomTr(t)}</option>)}</optgroup>;
  const exReglages = (<>
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>Transformation à étudier (réducteur + oxydant)
      <select value={ex.id} onChange={x => { setE({ id: x.target.value, t: 0.85 }); }} style={sel}>
        {optsGroupe('Lame de métal dans une solution', t => t.plaque)}{optsGroupe('Deux espèces dissoutes', t => !t.plaque && t.famille === 'solution')}{optsGroupe('En milieu acide', t => t.famille === 'acide')}</select></label>
    {aide('Choisis une transformation : le schéma, les couples et le constructeur d’équation s’adaptent. L’équation de la réaction est écrite en haut de l’écran.')}
  </>);
  const exScene = boite(`Observation : ${tX.solution}`, <>{becher(tX, ex.t)}<Curs t={ex.t} onChange={t => setE({ t })}/>{aide(tX.obs)}</>);
  const [oxX1, redX1] = M.COUPLES[tX.couple1], [oxX2, redX2] = M.COUPLES[tX.couple2];
  const exDemi = (
    <Section titre="Couples et demi-équations de cette transformation" ouvert={!!ex.ouv.demi} onBascule={() => ouvrir('demi')}>
      {aide('Chaque couple s’écrit Ox + n e⁻ = Red. Ici, l’oxydant réagit dans le sens de la réduction, le réducteur dans le sens de l’oxydation.')}
      <div style={{ fontSize: 14.5, lineHeight: 1.9 }}>
        <div><strong>Couple {M.coupleTxt(tX.couple1)}</strong> : oxydant <Esp id={oxX1}/>, réducteur <Esp id={redX1}/>, {refX.n1} électron{refX.n1 > 1 ? 's' : ''} échangé{refX.n1 > 1 ? 's' : ''}.</div>
        <div style={{ paddingLeft: 12 }}>{demiConv(tX.couple1)}</div>
        <div><strong>Couple {M.coupleTxt(tX.couple2)}</strong> : oxydant <Esp id={oxX2}/>, réducteur <Esp id={redX2}/>, {refX.n2} électron{refX.n2 > 1 ? 's' : ''} échangé{refX.n2 > 1 ? 's' : ''}.</div>
        <div style={{ paddingLeft: 12 }}>{demiConv(tX.couple2)}</div>
      </div>
    </Section>);
  const exConstructeur = boite('Construire l’équation de réaction', <>
    {aide('Multiplie chaque demi-équation (boutons − et +) pour que les électrons captés et cédés soient en même nombre : la somme apparaît alors sans électrons.')}
    <Constructeur tr={tX} a={mA} b={mB} setA={setA} setB={setB}/></>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Compare « Cu + Ag⁺ » et « Zn + Ag⁺ » : les deux équations ont-elles les mêmes coefficients ? Pourquoi ?</li>
      <li>Choisis « Al + Cu²⁺ » : combien d’électrons chaque demi-équation échange-t-elle ? Quels multiplicateurs faut-il ?</li>
      <li>Avec « Fe + Fe³⁺ », un même élément joue deux rôles : lequel ? Que devient Fe²⁺ dans la somme ?</li>
      <li>En milieu acide, repère les espèces qui apparaissent des deux côtés avant simplification (H⁺, H₂O).</li>
      <li>Mets volontairement des multiplicateurs inégaux : que reste-t-il dans la somme ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir titre="À RETENIR : LES TROIS VÉRIFICATIONS">
      <SvgVerifications/>
      <ul style={liste}>
        <li>Une équation de réaction d’oxydo-réduction est <strong>juste</strong> si les <strong>éléments</strong> et la <strong>charge</strong> sont conservés et si <strong>aucun électron</strong> n’y figure.</li>
        <li>Exemple de la simulation : Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag, avec 2 électrons échangés (ppcm de 2 et 1).</li>
        <li><strong>Moyen de s’en souvenir</strong> : « éléments, charge, pas d’électrons ».</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rx-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rx-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .rx-ex > * { min-width: 0; }
        @media (min-width: 901px) { .rx-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); } .rx-l1.cote .rx-carte { grid-column: 2; grid-row: 1; } .rx-l1.cote .rx-main { grid-column: 1; grid-row: 1; }
          .rx-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .rx-ex > .rx-ex-main { grid-column: 1; grid-row: 1 / span 3; } .rx-ex > .rx-ex-reglages { grid-column: 2; grid-row: 1; } .rx-ex > .rx-ex-demi { grid-column: 2; grid-row: 2; } }
        @media (prefers-reduced-motion: no-preference) { .rx-in { animation: rx-fondu 0.35s ease-out; } @keyframes rx-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Oxydo-réduction : couples, demi-équations et équation de réaction</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {!enGuide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une transformation d’<strong>oxydo-réduction</strong> est un <strong>transfert d’électrons</strong> entre le <strong>réducteur</strong> d’un couple et l’<strong>oxydant</strong> d’un autre. On le modélise par deux <strong>demi-équations</strong> dont la somme, électrons supprimés, est l’<strong>équation de réaction</strong>.</div>}
      {bandeau()}
      {enExplore ? <>
        <div className="rx-ex">
          <div className="rx-ex-reglages">{boite('Choix de la transformation', exReglages)}</div>
          <div className="rx-ex-main" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{exScene}{exConstructeur}</div>
          <div className="rx-ex-demi">{exDemi}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`rx-l1${enGuide ? ' cote' : ''}`}>
          <div className="rx-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'metal' ? suiviM : suiviA}/></div>}
            {enDefi && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
            {enGuide && <div className="rx-in" key={idE}>{sceneGuide}</div>}
            {enGuide && (idE === 'erreur' || guide.fini) && <div style={{ marginTop: 12 }}>{panneauHypo}</div>}
          </div>
          {enGuide && <div className="rx-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>}
        </div>
      </>}
    </div>
  );
}
