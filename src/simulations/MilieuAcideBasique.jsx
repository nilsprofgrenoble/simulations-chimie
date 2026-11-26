import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, ARetenir, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mabModele";
import { QCM_PARCOURS as Q } from "./mabQcm";
import { StylesSchemas, EquationPuces, Bilan, Legende, SceneTube, SvgMethodeCarte, SvgBilanCarte, SvgSommeCarte, SvgBasculeCarte, SvgSyntheseCarte } from "./mabSchemas";

const SIM_ID = 294, CLE_GUIDE = 'milieu-acide-basique-tstl-guide-v1';
declarerDefis(SIM_ID, [['demi', 'Écrire une demi-équation'], ['eq', 'Écrire une équation de réaction']]);

// ====================================================
// SIM 294 — ÉQUATIONS D'OXYDO-RÉDUCTION EN MILIEU ACIDE OU BASIQUE (TSTL SPCL, chapitre « Oxydo-réduction »).
//  Capacité visée (jamais affichée à l'élève) : écrire l'équation d'une réaction d'oxydo-réduction en milieu acide ou basique à partir des demi-équations
//  (équilibrer O avec H₂O, H avec H⁺, charges avec e⁻ ; passage au milieu basique avec HO⁻ ; somme et simplification).
//  Modèle : mabModele.js. Situations originales : dichromate/iodure, Javel/eau oxygénée, permanganate/sulfite, aldéhyde (miroir d'argent, Fehling).
// ====================================================

const IDS = ['couple', 'oxygene', 'hydrogene', 'charges', 'verifier', 'dichromate', 'produit', 'simplifier', 'basique', 'ecriture', 'aldehyde', 'miroir', 'bilan'];
const DUREE = 5000;
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const stade = (d, cle) => d.stades.find(s => s.cle === cle);
const mul = (ts, k) => ts.map(([i, c]) => [i, c * k]);
const dMn = M.demiEquation('MnO4m/Mn2p'), dCr = M.demiEquation('Cr2O72m/Cr3p'), dClO = M.demiEquation('ClOm/Clm');
const rCrI = M.reaction('Cr2O72m/Cr3p', 'I2/Im', 'acide'), rMnH = M.reaction('MnO4m/Mn2p', 'O2/H2O2', 'acide'), rAg = M.reaction('Agp/Ag', 'RCOOm/RCHO', 'basique');
const FAUSSE = { gauche: [['MnO4m', 1], ['Hp', 8], ['em', 3]], droite: [['Mn2p', 1], ['H2O', 4]] };
const HP_SIMPL = M.coefDe(rMnH.final.reactifs, 'Hp'), HP_SOMME = M.coefDe(rMnH.somme.reactifs, 'Hp'), HP_PROD = M.coefDe(rMnH.somme.produits, 'Hp');
const OH_ALD = M.coefDe(rAg.final.reactifs, 'OHm');
const SCENE_DE = { 'rcho-ag': 'miroir', 'rcho-cu': 'fehling', 'mno4-so3': 'permanganate', 'al-eau': 'aluminium', 'clo-h2o2': 'javel' };
const LIB_MILIEU = { acide: 'milieu acide', basique: 'milieu basique' };
const nomEsp = id => M.texte(id);
const roles = (...ids) => ({ ox: ids.map(i => M.COUPLES[i][0]), red: ids.map(i => M.COUPLES[i][1]) });

const SelectGen = ({ nom, valeur, onChange, options, aide }) => (
  <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>{avecIndices(nom)}
    <select value={valeur} onChange={e => onChange(e.target.value)} style={{ font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, display: 'block', width: '100%', marginTop: 3 }}>
      {options.map(([v, l, off]) => <option key={v} value={v} disabled={off}>{l}</option>)}
    </select>{aide && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{aide}</span>}</label>);

function useAnimation(reduit) {
  const [p, setP] = useState(0), [marche, setMarche] = useState(false);
  useEffect(() => {
    if (!marche) return undefined;
    let id; const t0 = performance.now();
    const pas = t => { const v = Math.min(1, (t - t0) / DUREE); setP(v); if (v < 1) id = requestAnimationFrame(pas); else setMarche(false); };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [marche]);
  const lancer = () => { if (reduit || (typeof window !== 'undefined' && window.__PARCOURS_TEST__)) { setP(1); setMarche(false); } else { setP(0); setMarche(true); } };
  const remise = () => { setMarche(false); setP(0); };
  return { p, marche, lancer, remise };
}

/** Demi-équation écrite sur une ligne dans le milieu voulu (pour les corrections). */
const demiLigne = (id, milieu) => M.demiTxt(M.demiEquation(id), milieu);
const coupleEtiquette = id => M.coupleTxt(id);

// ====================================================
export function SimulationMilieuAcideBasique() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('demi');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false });
  const [reduit] = useState(mouvementReduit);
  const anim = useAnimation(reduit), { p, marche, lancer, remise } = anim;
  const [ex, setEx] = useState({ type: 'demi', couple: 'MnO4m/Mn2p', milieu: 'acide', stade: 4, rid: 'cr-i' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const reussie = !!(guide.reussies && guide.reussies[etape]);
  const ETAPES = [
    { id: 'couple', titre: 'Les électrons dans une demi-équation',
      texte: <>Un <strong>couple oxydant / réducteur</strong> (Ox / Red) se note avec une barre oblique, l’oxydant en premier. Sa <strong>demi-équation</strong> relie les deux espèces par des électrons e⁻ : <strong>Ox + n e⁻ = Red</strong>. On l’écrit ici pour le couple <strong>MnO₄⁻ / Mn²⁺</strong> (ion permanganate, violet, et ion manganèse(II), presque incolore) en solution acide. Les électrons se placent d’un côté seulement.</>,
      tache: { type: 'qcm', q: 'De quel côté écrit-on les électrons dans la demi-équation du couple MnO₄⁻ / Mn²⁺ ?', ...Q.couple,
        expl: 'Un oxydant est une espèce qui capte des électrons : on écrit Ox + n e⁻ = Red, avec les électrons du côté de l’oxydant (ici MnO₄⁻). Dans le sens inverse, le réducteur Mn²⁺ cède des électrons.',
        indice: 'Un oxydant capte des électrons : il se transforme en son réducteur conjugué. Les électrons captés sont-ils écrits avant ou après la flèche ?' } },
    { id: 'oxygene', titre: 'Équilibrer l’oxygène avec H₂O',
      texte: <>On part de <strong>MnO₄⁻ = Mn²⁺</strong>. Le manganèse Mn est déjà équilibré (1 atome de chaque côté). Pour équilibrer les atomes d’<strong>oxygène O</strong>, on ajoute des <strong>molécules d’eau H₂O</strong> du côté qui en manque : en solution aqueuse, l’eau est présente en grande quantité.</>,
      tache: { type: 'num', q: 'Combien de molécules H₂O faut-il écrire à droite ?', unite: 'molécules', vrai: 4, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['MnO₄⁻ contient 4 atomes d’oxygène ; Mn²⁺ n’en contient aucun.', 'Chaque H₂O apporte 1 atome d’oxygène : il faut 4 H₂O à droite.'],
        pieges: [[1, 'Une seule molécule d’eau ne compense qu’un atome d’oxygène : MnO₄⁻ en contient 4.'], [8, 'Vous avez compté les atomes d’hydrogène des 4 H₂O : on compte ici les atomes d’oxygène, une molécule d’eau en apporte un seul.']],
        expl: 'MnO₄⁻ = Mn²⁺ + 4 H₂O : les 4 atomes O de MnO₄⁻ se retrouvent dans 4 molécules d’eau.',
        indice: 'Comptez les atomes d’oxygène de chaque côté : combien manque-t-il à droite ? Une molécule H₂O contient un atome O.' } },
    { id: 'hydrogene', titre: 'Équilibrer l’hydrogène avec H⁺',
      texte: <>Les 4 H₂O de droite contiennent maintenant des atomes d’<strong>hydrogène H</strong> que la gauche n’a pas. En solution acide, on les compense avec des <strong>ions hydrogène H⁺</strong>, écrits du côté qui manque d’hydrogène.</>,
      tache: { type: 'num', q: 'Combien d’ions H⁺ faut-il écrire à gauche ?', unite: 'ions', vrai: 8, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['4 H₂O contiennent 4 × 2 = 8 atomes d’hydrogène à droite ; la gauche en a 0.', 'Chaque H⁺ apporte 1 atome H : il faut 8 H⁺ à gauche.'],
        pieges: [[4, 'Quatre est le nombre de H₂O : chaque H₂O contient 2 atomes H, soit 8 atomes H à compenser avec des H⁺.'], [2, 'Deux est le nombre d’atomes H d’une seule H₂O : il y a 4 molécules H₂O.']],
        expl: 'MnO₄⁻ + 8 H⁺ = Mn²⁺ + 4 H₂O : 8 atomes H de chaque côté.',
        indice: 'Combien d’atomes d’hydrogène contiennent 4 molécules H₂O (2 atomes chacune) ? Chaque ion H⁺ en apporte un.' } },
    { id: 'charges', titre: 'Équilibrer les charges avec e⁻',
      texte: <>Les atomes sont équilibrés, mais pas les charges. À gauche : (−1) + 8 × (+1) = <strong>+7</strong>. À droite : <strong>+2</strong> (Mn²⁺ ; H₂O est neutre). On ajoute des <strong>électrons e⁻</strong> (charge −1) du côté de la charge la plus grande, jusqu’à égaliser les charges.</>,
      tache: { type: 'num', q: 'Combien d’électrons faut-il ajouter à gauche ?', unite: 'électrons', vrai: 5, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Charge à gauche : −1 + 8 = +7 ; charge à droite : +2.', 'Il faut retirer 7 − 2 = 5 charges positives à gauche : 5 électrons (charge −1 chacun).'],
        pieges: [[7, 'Sept est la charge à gauche avant les électrons : il faut la ramener à +2 (la charge de droite), donc ajouter 7 − 2 électrons.'], [2, 'Deux est la charge de droite : le nombre d’électrons est la différence entre les charges, 7 − 2.']],
        expl: 'MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O : charge totale +2 de chaque côté.',
        indice: 'Charge à gauche +7, charge à droite +2 : combien d’électrons (charge −1) retirent 5 unités de charge à gauche ? Calculez 7 − 2.' } },
    { id: 'verifier', titre: 'Vérifier une demi-équation',
      retenirTitre: 'À retenir : la méthode en quatre temps', retenir: <>
        <SvgMethodeCarte/>
        <Ul>
          <li>Dans l’ordre : <strong>1.</strong> l’élément principal ; <strong>2.</strong> O avec <strong>H₂O</strong> ; <strong>3.</strong> H avec <strong>H⁺</strong> ; <strong>4.</strong> les charges avec <strong>e⁻</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« élément, eau, acide, électrons »</strong> (E-E-A-E).</li>
          <li>Idée fausse : « on peut équilibrer les charges en premier » : on ne le peut qu’à la fin, car H₂O et H⁺ changent la charge.</li>
        </Ul></>,
      texte: <>Un élève propose la demi-équation <strong>MnO₄⁻ + 8 H⁺ + 3 e⁻ = Mn²⁺ + 4 H₂O</strong>. Pour la contrôler, on compare les deux membres : atomes de chaque élément, puis <strong>charge totale</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est le défaut de cette demi-équation ?', ...Q.verifier,
        expl: 'À gauche : charge −1 + 8 − 3 = +4 ; à droite : +2. Les atomes O (4 et 4) et H (8 et 8) sont bien équilibrés : seul le nombre d’électrons est faux, il en faut 5.',
        indice: 'Calculez la charge totale de chaque membre : (−1) + 8 × (+1) + 3 × (−1) à gauche, +2 à droite. Comptez aussi les atomes O et H.' } },
    { id: 'dichromate', titre: 'Un deuxième couple : dichromate',
      retenirTitre: 'À retenir : le bilan de vérification', retenir: <>
        <SvgBilanCarte/>
        <Ul>
          <li>Une demi-équation est juste si, de chaque côté, <strong>chaque élément</strong> a le même nombre d’atomes <strong>et</strong> la <strong>charge totale</strong> est la même.</li>
          <li>Moyen de s’en souvenir : <strong>« atomes ET charge »</strong>. Les électrons n’ont pas d’atomes : ils ne comptent que dans la charge.</li>
          <li>Idée fausse : « si les atomes sont égaux, c’est fini » : il reste à vérifier les charges.</li>
        </Ul></>,
      texte: <>On applique la même méthode au couple <strong>Cr₂O₇²⁻ / Cr³⁺</strong> (ion dichromate, orange, et ion chrome(III), vert). L’élément chrome est équilibré avec un coefficient 2 : <strong>Cr₂O₇²⁻ = 2 Cr³⁺</strong>. En équilibrant O (7 H₂O à droite) puis H (14 H⁺ à gauche), on obtient <strong>Cr₂O₇²⁻ + 14 H⁺ = 2 Cr³⁺ + 7 H₂O</strong>. Il reste les charges.</>,
      tache: { type: 'num', q: 'Combien d’électrons faut-il ajouter à gauche ?', unite: 'électrons', vrai: 6, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Charge à gauche : −2 + 14 = +12.', 'Charge à droite : 2 × (+3) = +6.', 'Il faut retirer 12 − 6 = 6 charges positives : 6 électrons.'],
        pieges: [[12, 'Douze est la charge à gauche avant les électrons ; il faut la ramener à +6, la charge de droite.'], [3, 'Trois est la charge d’un seul ion Cr³⁺ : il y a 2 ions Cr³⁺ à droite, soit +6.']],
        expl: 'Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ = 2 Cr³⁺ + 7 H₂O : charge +6 de chaque côté.',
        indice: 'Charge à gauche : (−2) + 14 × (+1). Charge à droite : 2 × (+3). Le nombre d’électrons est la différence.' } },
    { id: 'produit', titre: 'Écrire l’équation de réaction',
      texte: <>Les ions iodure I⁻ réduisent le dichromate : le couple <strong>I₂ / I⁻</strong> a pour demi-équation <strong>I₂ + 2 e⁻ = 2 I⁻</strong>. Le dichromate <strong>capte</strong> 6 e⁻ ; l’iodure doit en <strong>céder</strong> autant : il faut multiplier la demi-équation de I₂ / I⁻ (lue dans le sens de l’oxydation) pour que les deux nombres d’électrons soient égaux. Les électrons disparaissent alors dans la somme : ils ne figurent pas dans l’équation de réaction.</>,
      tache: { type: 'num', q: 'Par quel nombre multiplie-t-on la demi-équation de I₂ / I⁻ ?', unite: '', vrai: 3, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Cr₂O₇²⁻ capte 6 e⁻ ; chaque demi-équation de I₂ / I⁻ fait intervenir 2 e⁻.', 'Il faut 6 / 2 = 3 fois la demi-équation de l’iode : 6 I⁻ → 3 I₂ + 6 e⁻.'],
        pieges: [[6, 'Six est le nombre d’électrons captés par le dichromate : on multiplie pour que les deux nombres d’électrons soient égaux, soit 6 / 2.'], [2, 'Deux est le nombre d’électrons d’une demi-équation de I₂ / I⁻ : il faut rendre les deux nombres d’électrons égaux à 6.']],
        expl: 'On obtient Cr₂O₇²⁻ + 14 H⁺ + 6 I⁻ → 2 Cr³⁺ + 7 H₂O + 3 I₂ : 6 e⁻ échangés.',
        indice: 'Combien d’électrons cède une demi-équation de I⁻ vers I₂ ? Par quel nombre la multiplier pour en obtenir 6 ?' } },
    { id: 'simplifier', titre: 'Additionner puis simplifier',
      texte: <>Autre réaction : le permanganate MnO₄⁻ oxyde l’eau oxygénée H₂O₂ (couple <strong>O₂ / H₂O₂</strong> : O₂ + 2 H⁺ + 2 e⁻ = H₂O₂). La demi-équation du permanganate (5 e⁻) est multipliée par 2, celle de O₂ / H₂O₂ (lue dans le sens de l’oxydation, 2 e⁻) par 5 : 10 e⁻ de chaque côté. Après addition, on trouve des ions <strong>H⁺ de chaque côté</strong> : {HP_SOMME} H⁺ à gauche, {HP_PROD} H⁺ à droite. On <strong>simplifie</strong> en ne gardant que la différence, du côté où il en reste.</>,
      tache: { type: 'num', q: 'Combien d’ions H⁺ reste-t-il dans l’équation de réaction ?', unite: 'ions', vrai: HP_SIMPL, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => [`H⁺ à gauche : ${HP_SOMME} ; H⁺ à droite : ${HP_PROD}.`, `On simplifie : ${HP_SOMME} − ${HP_PROD} = ${HP_SIMPL} H⁺ à gauche.`],
        pieges: [[HP_SOMME, 'C’est le nombre de H⁺ à gauche avant simplification : on retire ceux qui figurent aussi à droite.'], [HP_SOMME + HP_PROD, 'On ne les additionne pas : les H⁺ présents des deux côtés se compensent, on garde la différence.']],
        expl: `2 MnO₄⁻ + 5 H₂O₂ + ${HP_SIMPL} H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O : ${HP_SOMME} − ${HP_PROD} = ${HP_SIMPL} H⁺ restent à gauche.`,
        indice: 'Calculez la différence entre le nombre de H⁺ de gauche et celui de droite : il reste du côté où il y en avait le plus.' } },
    { id: 'basique', titre: 'Passer en milieu basique',
      retenirTitre: 'À retenir : multiplier, additionner, simplifier', retenir: <>
        <SvgSommeCarte/>
        <Ul>
          <li><strong>1.</strong> On multiplie chaque demi-équation pour que les <strong>e⁻</strong> soient en même nombre ; <strong>2.</strong> on additionne (les e⁻ disparaissent) ; <strong>3.</strong> on simplifie H₂O, H⁺ ou HO⁻ présents des deux côtés.</li>
          <li>Moyen de s’en souvenir : <strong>« multiplier, additionner, simplifier »</strong>.</li>
          <li>Idée fausse : « les électrons restent dans le bilan » : une équation de réaction n’en contient jamais.</li>
        </Ul></>,
      texte: <>En <strong>milieu basique</strong>, il n’y a pratiquement pas d’ions H⁺ : on écrit des ions <strong>hydroxyde HO⁻</strong> à la place. On part de la demi-équation du milieu acide et on ajoute, <strong>des deux côtés</strong>, autant d’ions HO⁻ que d’ions H⁺, car H⁺ + HO⁻ donne H₂O. Exemple : l’eau de Javel contient des ions hypochlorite ClO⁻ ; le couple <strong>ClO⁻ / Cl⁻</strong> s’écrit en milieu acide <strong>ClO⁻ + 2 H⁺ + 2 e⁻ = Cl⁻ + H₂O</strong>.</>,
      tache: { type: 'num', q: 'Combien d’ions HO⁻ ajoute-t-on de chaque côté ?', unite: 'ions', vrai: 2, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['La demi-équation du milieu acide contient 2 ions H⁺.', 'On ajoute autant d’ions HO⁻ : 2 HO⁻ de chaque côté.'],
        pieges: [[1, 'Il y a 2 ions H⁺ dans la demi-équation acide : on ajoute autant d’ions HO⁻, des deux côtés.'], [4, 'Quatre est le nombre total de HO⁻ écrits (2 à gauche et 2 à droite) : la question porte sur le nombre ajouté de chaque côté.']],
        expl: 'ClO⁻ + 2 H⁺ + 2 HO⁻ + 2 e⁻ = Cl⁻ + H₂O + 2 HO⁻ : on a ajouté 2 HO⁻ de chaque côté.',
        indice: 'Comptez les ions H⁺ de la demi-équation du milieu acide : on ajoute le même nombre d’ions HO⁻ à gauche et à droite.' } },
    { id: 'ecriture', titre: 'La demi-équation en milieu basique',
      texte: <>À gauche, les <strong>2 H⁺ et les 2 HO⁻ s’associent en 2 H₂O</strong>. On a alors, à gauche, 2 H₂O + ClO⁻ + 2 e⁻ et, à droite, H₂O + Cl⁻ + 2 HO⁻. Puis on <strong>simplifie</strong> les molécules d’eau présentes des deux côtés.</>,
      tache: { type: 'qcm', q: 'Quelle est la demi-équation du couple ClO⁻ / Cl⁻ en milieu basique ?', ...Q.ecriture,
        expl: '2 H₂O à gauche et 1 H₂O à droite : on simplifie une molécule, il reste 1 H₂O à gauche. Vérification : charges −1 − 2 = −3 à gauche, −1 − 2 = −3 à droite ; O : 1 + 1 = 2 à gauche et 2 à droite ; H : 2 et 2.',
        indice: 'Après avoir remplacé 2 H⁺ + 2 HO⁻ par 2 H₂O, simplifiez les H₂O présents des deux côtés, puis vérifiez O, H et la charge.' } },
    { id: 'aldehyde', titre: 'Une équation de réaction en milieu basique',
      retenirTitre: 'À retenir : H⁺ + HO⁻ donne H₂O', retenir: <>
        <SvgBasculeCarte/>
        <Ul>
          <li>Pour passer au milieu basique : on ajoute <strong>autant de HO⁻ que de H⁺ des deux côtés</strong>, on forme H₂O, on simplifie.</li>
          <li>Moyen de s’en souvenir : <strong>« un H⁺ disparaît, un HO⁻ apparaît »</strong>, avec H₂O qui se forme.</li>
          <li>Idée fausse : « il suffit d’écrire HO⁻ à la place de H⁺ » : on change aussi le nombre de H₂O.</li>
        </Ul></>,
      texte: <>Une <strong>aldéhyde</strong> R–CHO (R est un groupe carboné) est un réducteur : en milieu basique elle devient un ion carboxylate RCOO⁻. Le <strong>test du miroir d’argent</strong> utilise le couple <strong>Ag⁺ / Ag</strong> (Ag⁺ + e⁻ = Ag) et le couple <strong>RCOO⁻ / RCHO</strong>, écrit en milieu basique : <strong>RCOO⁻ + 2 H₂O + 2 e⁻ = RCHO + 3 HO⁻</strong>. L’équation de réaction se déduit de ces deux demi-équations : Ag⁺ est réduit, RCHO oxydé (couple lu à l’envers), avec 2 e⁻ échangés.</>,
      tache: { type: 'num', q: 'Quel est le coefficient de HO⁻ dans l’équation de réaction ?', unite: '', vrai: OH_ALD, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Demi-équation de Ag⁺ / Ag multipliée par 2 : 2 Ag⁺ + 2 e⁻ = 2 Ag.', 'Demi-équation de RCOO⁻ / RCHO lue dans le sens de l’oxydation : RCHO + 3 HO⁻ = RCOO⁻ + 2 H₂O + 2 e⁻.', 'Somme : 2 Ag⁺ + RCHO + 3 HO⁻ → 2 Ag + RCOO⁻ + 2 H₂O : coefficient 3.'],
        pieges: [[2, 'Deux est le coefficient de Ag⁺ (ou de H₂O) : le coefficient de HO⁻ se lit dans la demi-équation de RCOO⁻ / RCHO, lue dans le sens de l’oxydation.'], [5, 'Les HO⁻ ne se cumulent pas avec ceux d’une autre demi-équation : la demi-équation de Ag⁺ / Ag n’en contient aucun.']],
        expl: 'On multiplie la demi-équation de Ag⁺ / Ag par 2 pour égaliser les 2 e⁻ : 2 Ag⁺ + RCHO + 3 HO⁻ → 2 Ag + RCOO⁻ + 2 H₂O.',
        indice: 'Lisez la demi-équation de RCOO⁻ / RCHO de droite à gauche (oxydation de l’aldéhyde) : combien de HO⁻ apparaissent à gauche ? La demi-équation de Ag⁺ / Ag n’a pas de HO⁻.' } },
    { id: 'miroir', titre: 'Le miroir d’argent',
      texte: <>Voici le test dans un tube à essai : les ions argent(I) et l’aldéhyde en milieu basique. Lancez la transformation : l’argent métallique se dépose sur la paroi du tube, en couche brillante.</>,
      tache: { type: 'action', ok: p >= 1, label: marche ? 'Transformation en cours…' : p >= 1 ? 'Miroir formé' : 'Lancer le test', faire: () => { if (!marche) lancer(); }, consigne: 'Lancez le test et attendez la fin du dépôt' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : quelles espèces selon le milieu ?', retenir: <>
        <SvgSyntheseCarte/>
        <Ul>
          <li><strong>Milieu acide</strong> : H⁺ et H₂O, jamais de HO⁻. <strong>Milieu basique</strong> : HO⁻ et H₂O, jamais de H⁺.</li>
          <li>Une équation d’oxydo-réduction est juste si les <strong>atomes</strong> et la <strong>charge</strong> sont conservés ; <strong>aucun électron</strong> n’y figure.</li>
          <li>Moyen de s’en souvenir : <strong>« jamais H⁺ et HO⁻ ensemble »</strong>. Idée fausse : « un HO⁻ en milieu acide est possible » : il réagirait aussitôt avec H⁺.</li>
        </Ul></>,
      texte: <>Vous savez établir une demi-équation en milieu acide, la convertir en milieu basique, puis écrire l’équation de réaction (multiplier, additionner, simplifier). La liqueur de Fehling (ions Cu²⁺ en milieu basique) donne un précipité rouge brique de Cu₂O avec une aldéhyde. Passez à l’exploration pour tester d’autres couples, ou aux défis.</>,
  },
  ];

  // ---------- vue du parcours guidé ----------
  const vue = (() => {
    const r = reussie;
    const un = (d, cle, neuf = []) => { const s = stade(d, cle); return { g: s.gauche, d: s.droite, nouveaux: neuf }; };
    switch (idE) {
      case 'couple': return { eqs: [{ ...un(dMn, 'depart'), t: 'Le couple MnO₄⁻ / Mn²⁺' }] };
      case 'oxygene': return r ? { eqs: [{ ...un(dMn, 'oxygene', ['H2O']), t: 'Après l’oxygène' }], bilan: stade(dMn, 'oxygene') } : { eqs: [{ ...un(dMn, 'element'), t: 'Point de départ' }] };
      case 'hydrogene': return r ? { eqs: [{ ...un(dMn, 'hydrogene', ['Hp']), t: 'Après l’hydrogène' }], bilan: stade(dMn, 'hydrogene') } : { eqs: [{ ...un(dMn, 'oxygene'), t: 'Après l’oxygène' }] };
      case 'charges': return r ? { eqs: [{ ...un(dMn, 'charges', ['em']), t: 'Demi-équation terminée' }], bilan: stade(dMn, 'charges') } : { eqs: [{ ...un(dMn, 'hydrogene'), t: 'Après l’hydrogène' }] };
      case 'verifier': return { eqs: [{ g: FAUSSE.gauche, d: FAUSSE.droite, nouveaux: [], t: 'Demi-équation proposée' }], bilan: r ? FAUSSE : null };
      case 'dichromate': return r ? { eqs: [{ ...un(dCr, 'charges', ['em']), t: 'Demi-équation terminée' }], bilan: stade(dCr, 'charges') } : { eqs: [{ ...un(dCr, 'hydrogene'), t: 'Charges à équilibrer' }] };
      case 'produit': {
        const d2 = rCrI.d2, e1 = { g: M.demiEquation('Cr2O72m/Cr3p').acide.gauche, d: M.demiEquation('Cr2O72m/Cr3p').acide.droite, nouveaux: [], t: 'Réduction de Cr₂O₇²⁻ (6 e⁻ captés)' };
        const base = { g: d2.acide.droite, d: d2.acide.gauche, nouveaux: [], t: 'Oxydation de I⁻ (une fois)', fl: '→' };
        return r ? { eqs: [e1, { g: mul(d2.acide.droite, 3), d: mul(d2.acide.gauche, 3), nouveaux: ['em'], t: 'Oxydation de I⁻ ×3 (6 e⁻ cédés)', fl: '→' }, { g: rCrI.final.reactifs, d: rCrI.final.produits, nouveaux: [], t: 'Équation de réaction', fl: '→' }] } : { eqs: [e1, base] };
      }
      case 'simplifier': return r ? { eqs: [{ g: rMnH.final.reactifs, d: rMnH.final.produits, nouveaux: [], t: 'Équation après simplification', fl: '→' }], bilan: { gauche: rMnH.final.reactifs, droite: rMnH.final.produits } } : { eqs: [{ g: rMnH.somme.reactifs, d: rMnH.somme.produits, nouveaux: [], t: 'Somme, avant simplification', fl: '→' }] };
      case 'basique': return r ? { eqs: [{ ...un(dClO, 'ajoutHO', ['OHm']), t: 'On a ajouté des HO⁻ des deux côtés' }] } : { eqs: [{ ...un(dClO, 'charges'), t: 'Couple ClO⁻ / Cl⁻, milieu acide' }] };
      case 'ecriture': return r ? { eqs: [{ ...un(dClO, 'simplifier'), t: 'Milieu basique' }], bilan: stade(dClO, 'simplifier') } : { eqs: [{ ...un(dClO, 'ajoutHO'), t: 'Étape précédente' }] };
      case 'aldehyde': { const dA = M.demiEquation('RCOOm/RCHO').basique; return r ? { eqs: [{ g: rAg.final.reactifs, d: rAg.final.produits, nouveaux: [], t: 'Équation de réaction', fl: '→' }], bilan: { gauche: rAg.final.reactifs, droite: rAg.final.produits }, tube: 'miroir' } : { eqs: [{ g: dA.gauche, d: dA.droite, nouveaux: [], t: 'RCOO⁻ / RCHO en milieu basique' }, { g: [['Agp', 1], ['em', 1]], d: [['Ag', 1]], nouveaux: [], t: 'Ag⁺ / Ag' }], tube: 'miroir' }; }
      case 'miroir': return { eqs: [{ g: rAg.final.reactifs, d: rAg.final.produits, nouveaux: [], t: 'Équation de réaction', fl: '→' }], tube: 'miroir' };
      default: return null;
    }
  })();
  const PR = { couple: roles('MnO4m/Mn2p'), oxygene: roles('MnO4m/Mn2p'), hydrogene: roles('MnO4m/Mn2p'), charges: roles('MnO4m/Mn2p'), verifier: roles('MnO4m/Mn2p'), dichromate: roles('Cr2O72m/Cr3p'),
    produit: roles('Cr2O72m/Cr3p', 'I2/Im'), simplifier: roles('MnO4m/Mn2p', 'O2/H2O2'), basique: roles('ClOm/Clm'), ecriture: roles('ClOm/Clm'), aldehyde: roles('Agp/Ag', 'RCOOm/RCHO'), miroir: roles('Agp/Ag', 'RCOOm/RCHO') };
  const principaux = (idE && PR[idE]) || { ox: [], red: [] };
  const boxEq = (v, boite = true) => v && (
    <div style={boite ? styleBoite : undefined}>
      {v.eqs.map((e, i) => <div key={`${idE}${i}${reussie}`} style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', marginBottom: 6 }}>{e.t}</div>
        <div className="mab-fondu"><EquationPuces gauche={e.g} droite={e.d} nouveaux={e.nouveaux} flecheTxt={e.fl || '='} principaux={principaux}/></div></div>)}
      {v.bilan && <div className="mab-fondu" style={{ maxWidth: 360, margin: '4px auto 8px' }}><Bilan gauche={v.bilan.gauche} droite={v.bilan.droite}/></div>}
      <Legende/></div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'demi' ? { type, ...M.tirageDefiDemi(), rep: '', verifie: false } : { type, ...M.tirageDefiEq(), rep: '', verifie: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const cibleTxt = id => (id === 'em' ? 'e⁻' : nomEsp(id));
  const verifier = () => {
    const d = defi; let diag = { msg: '' }, ok = false; const v = lireNombre(d.rep);
    if (!isFinite(v) || !Number.isInteger(v) || v <= 0) diag = { msg: 'Entrez un nombre entier positif (par exemple 3).' };
    else if (v === d.coef) ok = true;
    else {
      const essais = [];
      if (d.type === 'demi') {
        const da = d.d.acide, hAc = M.coefDe(da.gauche, 'Hp') + M.coefDe(da.droite, 'Hp'), oAc = M.coefDe(da.gauche, 'H2O') + M.coefDe(da.droite, 'H2O');
        if (d.milieu === 'basique' && d.cible === 'OHm') essais.push([hAc, 'Vous avez donné le nombre de H⁺ du milieu acide : en milieu basique on ajoute autant de HO⁻ que de H⁺, des deux côtés, puis on simplifie les H₂O.']);
        if (d.milieu === 'basique' && d.cible === 'H2O') essais.push([oAc, 'Vous avez donné le nombre de H₂O du milieu acide : il change avec le passage au milieu basique (H⁺ + HO⁻ donne H₂O, puis on simplifie).'], [oAc + hAc, 'Vous avez ajouté les H₂O formés sans simplifier ceux qui sont présents des deux côtés.']);
        if (d.cible === 'em') essais.push([Math.abs(d.d.n) + 1, 'Revoyez les charges : le nombre d’électrons est la différence entre les charges des deux membres avant ajout des électrons.']);
      } else {
        const s = d.r.somme, avant = M.coefDe(s.reactifs, d.cible) + M.coefDe(s.produits, d.cible);
        if (avant !== d.coef && avant > 0) essais.push([avant, 'Vous avez donné le coefficient avant simplification : les espèces présentes des deux côtés (H₂O, H⁺, HO⁻) se simplifient.']);
        const pr = M.coefDe(d.r.d1.stades[d.r.d1.stades.length - 1].gauche, d.cible) + M.coefDe(d.r.d1.stades[d.r.d1.stades.length - 1].droite, d.cible);
        if (pr > 0) essais.push([pr, 'Vous avez pris le coefficient de la demi-équation seule : il faut multiplier chaque demi-équation pour égaliser les électrons.']);
        essais.push([d.coef * (d.r.facteur || 1), 'Les coefficients de l’équation de réaction se simplifient jusqu’à ce que le plus grand diviseur commun soit 1.']);
      }
      const trouve = essais.find(([val]) => val === v && val !== d.coef);
      diag = { msg: trouve ? trouve[1] : `Ce n’est pas le bon coefficient (${v < d.coef ? 'trop petit' : 'trop grand'}). Reprenez la méthode pas à pas et vérifiez le bilan des atomes et de la charge.` };
    }
    setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
    (d.type === 'demi' ? noterD : noterE)(ok);
  };
  const correction = d => {
    if (d.type === 'demi') return `En ${LIB_MILIEU[d.milieu]}, la demi-équation du couple ${coupleEtiquette(d.couple)} s’écrit ${demiLigne(d.couple, d.milieu)}. Le coefficient de ${cibleTxt(d.cible)} est ${d.coef}.${d.milieu === 'basique' ? ` (En milieu acide : ${demiLigne(d.couple, 'acide')} ; on ajoute autant de HO⁻ que de H⁺, des deux côtés, puis on simplifie H₂O.)` : ''}`;
    const r = d.r;
    return `Réduction : ${M.demiTxt(r.d1, r.milieu)}${r.m1 > 1 ? ` (× ${r.m1})` : ''} ; oxydation (couple lu à l’envers) : ${M.demiTxt(r.d2, r.milieu)}${r.m2 > 1 ? ` (× ${r.m2})` : ''} ; ${r.N} e⁻ échangés. Équation : ${M.equationTxt(r.final)}. Le coefficient de ${cibleTxt(d.cible)} est ${d.coef}.`;
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['demi', 'Demi-équation'], ['eq', 'Équation de réaction']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'demi' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : écrire une demi-équation</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Établissez la demi-équation du couple <strong>{coupleEtiquette(defi.couple)}</strong> en <strong>{LIB_MILIEU[defi.milieu]}</strong>. Quel est le coefficient de <strong>{cibleTxt(defi.cible)}</strong> dans la demi-équation écrite dans le sens Ox + n e⁻ = Red ?</div>
        <IndiceDefi cache={false}>{defi.milieu === 'basique' ? 'Écrivez d’abord la demi-équation du milieu acide (élément, H₂O, H⁺, e⁻), puis ajoutez autant de HO⁻ que de H⁺ des deux côtés, formez H₂O et simplifiez.' : 'Dans l’ordre : élément principal, O avec H₂O, H avec H⁺, puis les charges avec e⁻. Vérifiez atomes et charge.'}</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : écrire l’équation de réaction</div>
        <div style={{ ...lbl, marginBottom: 8 }}>En <strong>{LIB_MILIEU[defi.t.milieu]}</strong>, l’oxydant du couple <strong>{coupleEtiquette(defi.t.ox)}</strong> réagit avec le réducteur du couple <strong>{coupleEtiquette(defi.t.red)}</strong> ({defi.t.titre.toLowerCase()}). Établissez l’équation de réaction : quel est le coefficient de <strong>{cibleTxt(defi.cible)}</strong> une fois simplifiée (coefficients entiers les plus petits) ?</div>
        <IndiceDefi cache={false}>Écrivez les deux demi-équations dans le milieu donné, multipliez-les pour égaliser les électrons, additionnez, puis simplifiez H₂O, H⁺ ou HO⁻ présents des deux côtés. Contrôlez atomes et charge.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>Coefficient de {cibleTxt(defi.cible)} =</span>
        <input value={defi.rep} inputMode="numeric" aria-label={`coefficient de ${cibleTxt(defi.cible)}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('mab-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false, corr: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="mab-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? correction(defi) : defi.diag.msg))}
        {!defi.ok && defi.diag.msg && !/^Entrez/.test(defi.diag.msg) && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 40 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(correction(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Méthode formelle.</strong> Elle écrit une demi-équation correcte (atomes et charge conservés) mais ne prévoit ni si la réaction a lieu ni sa vitesse : les réactions proposées sont des transformations réelles (voir la simulation sur le sens d’évolution).</li>
      <li><strong>Espèces écrites sous leur forme simple.</strong> Ag⁺ et Cu²⁺ sont écrits sans leurs complexes (dans le réactif de Tollens, Ag⁺ est complexé par l’ammoniac ; dans la liqueur de Fehling, Cu²⁺ est complexé par les ions tartrate) : on garde les couples Ag⁺ / Ag et Cu²⁺ / Cu₂O du programme, ce qui simplifie les équations.</li>
      <li><strong>Aldéhyde notée RCHO</strong> (R : groupe carboné quelconque), ion carboxylate RCOO⁻ : on ne s’intéresse qu’au groupe qui réagit.</li>
      <li><strong>Milieu acide et basique.</strong> En milieu acide on écrit H⁺ et H₂O ; en milieu basique HO⁻ et H₂O. Dans l’eau, H⁺ existe sous forme d’ions oxonium H₃O⁺ : on écrit H⁺ par commodité. L’aluminium en milieu basique est écrit sous forme de l’ion tétrahydroxoaluminate [Al(OH)₄]⁻.</li>
      <li><strong>Électrons.</strong> Ils n’existent pas libres en solution : ils sont écrits dans les demi-équations pour compter les charges et disparaissent dans l’équation de réaction.</li>
      <li><strong>Simplification.</strong> Les coefficients de l’équation finale sont les plus petits entiers possibles ; H₂O, H⁺ et HO⁻ ne figurent jamais des deux côtés.</li>
      <li><strong>Animations et schémas.</strong> Le tube à essai est schématique : les durées et les couleurs finales sont approchées, aucune échelle n’est respectée.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const dEx = M.demiEquation(ex.couple);
  const prEx = ex.type === 'demi' ? roles(ex.couple) : roles(M.REACTIONS.find(t => t.id === ex.rid).ox, M.REACTIONS.find(t => t.id === ex.rid).red);
  const listeStades = ex.milieu === 'basique' ? dEx.stades : dEx.stades.slice(0, 5);
  const iStade = Math.min(ex.stade, listeStades.length - 1), stEx = listeStades[iStade];
  const tEx = M.REACTIONS.find(t => t.id === ex.rid), rEx = M.reaction(tEx.ox, tEx.red, tEx.milieu), sceneEx = SCENE_DE[ex.rid];
  const dm = (d, mil) => (mil === 'basique' ? d.basique : d.acide);
  const majEx = ch => { remise(); setEx(s => ({ ...s, ...ch })); };
  const controlesEx = (
    <div style={styleBoite}>
      <SelectGen nom="Que voulez-vous établir ?" valeur={ex.type} onChange={v => majEx({ type: v })} options={[['demi', 'La demi-équation d’un couple'], ['reac', 'L’équation d’une réaction']]}/>
      {ex.type === 'demi' ? <>
        <SelectGen nom="Couple Ox / Red" valeur={ex.couple} onChange={v => majEx({ couple: v, stade: 99 })} options={Object.keys(M.COUPLES).map(id => [id, M.coupleTxt(id)])}/>
        <SelectGen nom="Milieu" valeur={ex.milieu} onChange={v => majEx({ milieu: v, stade: 99 })} options={[['acide', 'Milieu acide'], ['basique', 'Milieu basique']]}/>
        <div style={aide}>Parcourez les étapes de la méthode : l’espèce ajoutée à chaque étape est entourée en orange.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" disabled={iStade <= 0} onClick={() => majEx({ stade: iStade - 1 })} style={{ ...styleBouton(false), minHeight: 42, opacity: iStade <= 0 ? 0.5 : 1 }}>◀ Étape précédente</button>
          <button type="button" disabled={iStade >= listeStades.length - 1} onClick={() => majEx({ stade: iStade + 1 })} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42, opacity: iStade >= listeStades.length - 1 ? 0.5 : 1 }}>Étape suivante ▶</button>
        </div>
      </> : <>
        <SelectGen nom="Transformation" valeur={ex.rid} onChange={v => majEx({ rid: v })} options={M.REACTIONS.map(t => [t.id, `${t.titre} (${LIB_MILIEU[t.milieu]})`])}/>
        <div style={aide}>Le simulateur construit la demi-équation de chaque couple, égalise les électrons, additionne puis simplifie.</div>
        {sceneEx && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" disabled={marche} onClick={lancer} style={{ ...styleBouton(true, '#0369a1'), minHeight: 42, opacity: marche ? 0.6 : 1 }}>{marche ? 'En cours…' : 'Lancer la transformation'}</button>
          {p > 0 && <button type="button" onClick={remise} style={{ ...styleBouton(false), minHeight: 42 }}><Pic n="refresh"/>État initial</button>}</div>}
      </>}
    </div>);
  const affichageEx = ex.type === 'demi' ? (
    <div style={styleBoite}>
      <div style={titreCarte}>{M.coupleTxt(ex.couple, ex.milieu)} · {LIB_MILIEU[ex.milieu]}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, textAlign: 'center', marginBottom: 6 }}>{M.NOMS_STADES[stEx.cle]}{stEx.cle === 'charges' || stEx.cle === 'simplifier' ? ' : terminé' : ''}</div>
      <div key={`${ex.couple}${ex.milieu}${stEx.cle}`} className="mab-fondu" style={{ marginBottom: 10 }}><EquationPuces gauche={stEx.gauche} droite={stEx.droite} nouveaux={stEx.ajouts} principaux={prEx}/></div>
      <div style={{ maxWidth: 360, margin: '0 auto 8px' }}><Bilan gauche={stEx.gauche} droite={stEx.droite}/></div>
      <Legende/></div>) : (
    <div style={styleBoite}>
      <div style={titreCarte}>{tEx.titre} · {LIB_MILIEU[tEx.milieu]}</div>
      {[['Réduction', rEx.m1, rEx.n1, mul(dm(rEx.d1, tEx.milieu).gauche, rEx.m1), mul(dm(rEx.d1, tEx.milieu).droite, rEx.m1)], ['Oxydation', rEx.m2, rEx.n2, mul(dm(rEx.d2, tEx.milieu).droite, rEx.m2), mul(dm(rEx.d2, tEx.milieu).gauche, rEx.m2)]].map(([t, m, n, g, d]) => <div key={t} style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', marginBottom: 6 }}>{t}{m > 1 ? ` (demi-équation × ${m}, ${rEx.N} e⁻)` : ` (${n} e⁻)`}</div>
        <EquationPuces gauche={g} droite={d} flecheTxt="→" principaux={prEx}/></div>)}
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', margin: '4px 0 6px' }}>Somme (les e⁻ disparaissent)</div>
      <div style={{ marginBottom: 10 }}><EquationPuces gauche={rEx.somme.reactifs} droite={rEx.somme.produits} flecheTxt="→" principaux={prEx}/></div>
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, textAlign: 'center', margin: '4px 0 6px' }}>Équation de réaction, simplifiée</div>
      <div style={{ marginBottom: 10 }}><EquationPuces gauche={rEx.final.reactifs} droite={rEx.final.produits} flecheTxt="→" principaux={prEx}/></div>
      <div style={{ maxWidth: 360, margin: '0 auto 8px' }}><Bilan gauche={rEx.final.reactifs} droite={rEx.final.produits}/></div>
      <Legende/></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez MnO₄⁻ / Mn²⁺ et comparez les demi-équations en milieu acide et basique : combien de HO⁻ remplacent les 8 H⁺ ? Que devient le nombre de H₂O ?</li>
        <li>Pour quels couples la demi-équation est-elle identique en milieu acide et en milieu basique ? Qu’ont-ils en commun (pas de O, pas de H⁺) ?</li>
        <li>Dans « Aluminium et soude », pourquoi y a-t-il de l’eau parmi les réactifs ?</li>
        <li>Comparez le miroir d’argent et la liqueur de Fehling : quels couples de l’oxydant, quelle même aldéhyde, quels produits ?</li>
        <li>Vérifiez avec le bilan : le nombre d’électrons de la demi-équation est-il toujours égal à la différence de charge avant ajout des électrons ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Demi-équation : élément, O avec H₂O, H avec H⁺, charges avec e⁻ (milieu acide)</li>
          <li>Milieu basique : ajouter autant de HO⁻ que de H⁺ des deux côtés, H⁺ + HO⁻ = H₂O, simplifier</li>
          <li>Équation de réaction : multiplier pour égaliser les e⁻, additionner, simplifier H₂O, H⁺ ou HO⁻</li>
          <li>Toujours vérifier atomes et charge ; aucun électron dans l’équation de réaction</li>
        </ul>
      </ARetenir>
    </Section>);

  // ---------- scène (parcours : vue ; exploration : tube éventuel) ----------
  const boxGuide = enGuide && vue && (
    <div className="mab-in mab-sc">{boxEq(vue)}</div>);
  const boxTubeGuide = enGuide && vue && vue.tube && (
    <div className="mab-in mab-sc" style={styleBoite}><SceneTube type={vue.tube} p={idE === 'miroir' ? p : idE === 'aldehyde' ? 0 : 0} anime={!reduit}/></div>);
  const boxTubeEx = enExplore && ex.type === 'reac' && sceneEx && (<div className="mab-sc" style={styleBoite}><SceneTube type={sceneEx} p={p} anime={!reduit}/></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <StylesSchemas/>
      <style>{`
        .mab-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mab-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mab-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; } .mab-col > *, .mab-main, .mab-carte { min-width: 0; }
        .mab-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .mab-sc { max-width: 560px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        @media (min-width: 901px) { .mab-l1.cote .mab-carte { order: 2; } .mab-l1.cote .mab-main { order: 1; }
          .mab-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .mab-ex > * { grid-column: 1; } .mab-ex > .mab-ctrl-col { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .mab-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mab-in { animation: mab-fondu 0.35s ease-out; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Équations d’oxydo-réduction en milieu acide ou basique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On écrit une <strong>demi-équation</strong> par couple (O avec H₂O, H avec H⁺, charges avec e⁻), on la convertit si le milieu est <strong>basique</strong> (HO⁻), puis on <strong>additionne</strong> deux demi-équations pour obtenir l’<strong>équation de réaction</strong>.</div>
      {!enExplore && <div className={enGuide ? 'mab-l1 cote' : 'mab-l1'}>
        {enGuide ? <div className="mab-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="mab-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'demi' ? suiviD : suiviE}/></div>}
          <div className="mab-col">
            {boxGuide}
            {boxTubeGuide}
            {enDefi && <div>{panneauHypo}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="mab-ex">
        <div className="mab-sc">{affichageEx}</div>
        <div className="mab-ctrl-col">{controlesEx}</div>
        {boxTubeEx || <span/>}
        <div>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
