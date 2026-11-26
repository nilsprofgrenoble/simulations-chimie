import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./pilePcmModele";
import { QCM } from "./pilePcmQcm";
import { PilePcmExplore } from "./PilePcmExplore";
import { ScenePile, SvgConstitutionCarte, SvgEquationCarte, SvgQCarte } from "./PilePcmSchemas";

const SIM_ID = 305, CLE_GUIDE = 'pile-pcm-guide-v1';
declarerDefis(SIM_ID, [['polarite', 'Polarité, anode et sens des électrons d’une pile'], ['capacite', 'Capacité et durée de fonctionnement d’une pile']]);

// ====================================================
//  SIM 305 — PILES : POLARITÉ, ÉQUATION DE FONCTIONNEMENT, QUANTITÉ D'ÉLECTRICITÉ (TSTL, enseignement PCM, séquence 4).
//  Une seule idée : une pile convertit de l'énergie chimique en énergie électrique ; on lit sa polarité au voltmètre, on écrit l'équation de fonctionnement avec les couples,
//  puis Q = n(e⁻) F et Δt = Q ÷ i. Capacités visées (jamais affichées) : schématiser une pile, polarité, anode/cathode, sens des porteurs, quantité d'électricité Q = n(e⁻) F, durée.
//  Aucune loi de Nernst ni potentiel standard (hors programme TSTL). Modèle : pilePcmModele.js (réutilise pileModele.js de la sim 132, TG, sans le modifier).
//  Exploration animée : PilePcmExplore.jsx. Schémas : PilePcmSchemas.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sci = (x, cs = 2) => { const [m, e] = Number(x).toExponential(cs - 1).split('e'); return `${m.replace('.', ',')} × 10^${Number(e)}`; };
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const cote = c => (c === 'g' ? 'de gauche' : 'de droite');
const IDS = ['demipile', 'pont', 'voltmetre', 'anode', 'electrons', 'ions', 'demieq', 'equation', 'ne', 'Q', 'duree', 'serie', 'fin'];
// Éléments du schéma du parcours, introduits par l'étape qui s'en sert (on accumule).
const SCENES = {
  demipile: { paire: ['zn', 'cu'] }, pont: { paire: ['zn', 'cu'] },
  voltmetre: { paire: ['zn', 'cu'], borneV: 'd', lu: 1.10 },
  anode: { paire: ['zn', 'cu'], borneV: 'd', lu: 1.10, poles: true, plusSide: 'd' },
  electrons: { paire: ['zn', 'cu'], borneV: 'd', lu: 1.10, poles: true, noms: true, plusSide: 'd' },
  ions: { paire: ['zn', 'cu'], borneV: 'd', lu: 1.10, poles: true, noms: true, plusSide: 'd' },
  demieq: { paire: ['zn', 'cu'], charge: 'dipole', poles: true, noms: true, flux: true, plusSide: 'd' },
  equation: { paire: ['zn', 'ag'], charge: 'dipole', poles: true, noms: true, flux: true, plusSide: 'd' },
  ne: { paire: ['zn', 'cu'], charge: 'lampe', poles: true, noms: true, plusSide: 'd' },
  Q: { paire: ['zn', 'cu'], charge: 'lampe', poles: true, noms: true, plusSide: 'd' },
  duree: { paire: ['zn', 'cu'], charge: 'lampe', poles: true, noms: true, plusSide: 'd', iTexte: 'i = 20 mA' },
  serie: { paire: ['zn', 'cu'], charge: 'lampe', poles: true, noms: true, plusSide: 'd', iTexte: 'i = 20 mA' },
  fin: { paire: ['zn', 'cu'], charge: 'lampe', poles: true, noms: true, plusSide: 'd', iTexte: 'i = 20 mA' },
};

export function SimulationPilePcm() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('polarite');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ paire: 'zn|cu', borneV: 'd', ie: 20 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const ETAPES = [
    { id: 'demipile', titre: 'Les deux demi-piles', focus: ['scene'],
      texte: <>Une <strong>pile</strong> est formée de deux <strong>demi-piles</strong>. Ici, une lame de <strong>cuivre</strong> plonge dans une solution de sulfate de cuivre (II), et une lame de <strong>zinc</strong> dans une solution de sulfate de zinc. Chaque demi-pile associe un métal et son ion : c’est un <strong>couple oxydant/réducteur</strong>.</>,
      tache: { type: 'qcm', q: 'La demi-pile de cuivre correspond au couple (oxydant/réducteur) :', ...QCM.demipile,
        expl: 'Le métal cuivre Cu (réducteur) et son ion Cu²⁺ (oxydant) forment le couple Cu²⁺/Cu : on écrit l’oxydant en premier.', indice: 'La lame est le métal ; la solution contient l’ion du même métal. L’oxydant s’écrit avant le réducteur.' } },
    { id: 'pont', titre: 'Le pont salin', focus: ['scene'],
      texte: <>Les deux solutions sont reliées par un <strong>pont salin</strong>, un tube contenant une solution d’ions (nitrate de potassium, par exemple). On le <strong>retire</strong> : les deux demi-piles ne sont plus en contact.</>,
      tache: { type: 'qcm', q: 'Sans pont salin, quand on relie les deux lames par un fil et un récepteur :', ...QCM.pont,
        expl: 'Sans pont salin, les ions ne peuvent plus circuler d’une solution à l’autre : le circuit est ouvert et aucun courant ne passe.', indice: 'Pour qu’un courant passe, le circuit doit être fermé : dans les solutions, qui assure le passage de la charge ?' } },
    { id: 'voltmetre', titre: 'La polarité se lit au voltmètre', focus: ['scene'],
      texte: <>Le pont salin est en place. On branche un voltmètre : la borne <strong>V</strong> sur la lame de <strong>cuivre</strong>, la borne <strong>COM</strong> sur la lame de <strong>zinc</strong>. Il affiche <strong>+1,10 V</strong>. Une tension <strong>positive</strong> signifie que la borne V est reliée au <strong>pôle +</strong> de la pile.</>,
      tache: { type: 'qcm', q: 'Le pôle + de cette pile est :', ...QCM.voltmetre,
        expl: 'La tension est positive avec la borne V sur le cuivre : le cuivre est le pôle +, donc le zinc est le pôle −.', indice: 'Tension positive : la borne V est du côté du pôle +.' } },
    { id: 'anode', titre: 'Anode et cathode', focus: ['scene'],
      texte: <>Dans une pile, l’électrode du pôle <strong>−</strong> libère des électrons dans le fil : elle est le siège d’une <strong>oxydation</strong>, on l’appelle l’<strong>anode</strong>. L’électrode du pôle <strong>+</strong> en capte : elle est le siège d’une <strong>réduction</strong>, c’est la <strong>cathode</strong>. Ici, le zinc est le pôle − et le cuivre le pôle +.</>,
      tache: { type: 'qcm', q: 'Dans cette pile, l’anode est :', ...QCM.anode,
        expl: 'L’anode est l’électrode où a lieu l’oxydation : c’est le pôle −, ici la lame de zinc.', indice: 'Anode = oxydation = électrons libérés = pôle −.' } },
    { id: 'electrons', titre: 'Le sens des électrons', focus: ['scene'],
      texte: <>L’anode (zinc) libère des électrons et la cathode (cuivre) en capte. Ils passent par le <strong>fil</strong> qui relie les deux lames, car ils ne peuvent pas traverser les solutions.</>,
      tache: { type: 'qcm', q: 'Les électrons circulent :', ...QCM.electrons,
        expl: 'Les électrons quittent l’anode (pôle −, zinc) et vont à la cathode (pôle +, cuivre) par le fil. Le courant électrique conventionnel circule en sens inverse.', indice: 'Les électrons partent de l’électrode qui en libère et arrivent à celle qui en capte.' } },
    { id: 'ions', titre: 'Les ions dans le pont salin', focus: ['scene'],
      texte: <>Pendant le fonctionnement, la solution de la cathode perd des ions cuivre Cu²⁺ (ils se déposent) et celle de l’anode gagne des ions Zn²⁺. Dans le pont salin, <strong>les cations et les anions se déplacent</strong> pour compenser ces variations de charge.</>,
      tache: { type: 'qcm', q: 'Dans le pont salin, les cations se déplacent :', ...QCM.ions,
        expl: 'La solution de la cathode s’appauvrit en cations (réduits en métal) : les cations du pont vont vers la cathode, les anions vers l’anode.', indice: 'Où manque-t-il des charges positives : du côté où des cations disparaissent ?' } },
    { id: 'demieq', titre: 'Écrire la demi-équation de l’anode', focus: ['scene'],
      retenirTitre: 'À retenir : constitution et polarité',
      retenir: <>
        <SvgConstitutionCarte/>
        <ul style={puces}>
          <li>Deux demi-piles (couples Ox/Red) reliées par un <strong>pont salin</strong> ; la tension positive se lit avec la borne V sur le <strong>pôle +</strong>.</li>
          <li><strong>Anode = pôle − = oxydation</strong> ; <strong>cathode = pôle + = réduction</strong> ; les électrons vont de l’anode à la cathode dans le fil.</li>
          <li>Moyen de s’en souvenir : <strong>« Anode, Oxydation : deux voyelles »</strong>, comme <strong>« Cathode, Réduction : deux consonnes »</strong>. Idée fausse : « le courant des électrons va du + vers le −. » Vrai : les électrons vont du − vers le +.</li></ul></>,
      texte: <>À l’anode, le zinc métallique est <strong>oxydé</strong> en ions zinc (II) Zn²⁺, et libère des électrons. Les ions zinc (II) portent <strong>deux charges positives</strong>.</>,
      tache: { type: 'qcm', q: 'La demi-équation à l’anode est :', ...QCM.demieq,
        expl: 'Oxydation : le zinc perd des électrons, qui sont écrits à droite : Zn(s) → Zn²⁺(aq) + 2 e⁻.', indice: 'Les charges doivent se conserver : Zn est neutre, Zn²⁺ a 2 charges positives, les électrons compensent.' } },
    { id: 'equation', titre: 'L’équation de fonctionnement', focus: ['scene'],
      texte: <>On change de pile : <strong>zinc / argent</strong>. Le pôle + est l’argent (couple Ag⁺/Ag) et le pôle − le zinc (couple Zn²⁺/Zn). À la cathode : <strong>Ag⁺ + e⁻ → Ag</strong> ; à l’anode : <strong>Zn → Zn²⁺ + 2 e⁻</strong>. On <strong>multiplie</strong> la demi-équation de l’argent par 2 pour que les électrons s’annulent, puis on additionne.</>,
      tache: { type: 'qcm', q: 'L’équation de fonctionnement de la pile zinc / argent est :', ...QCM.equation,
        expl: 'Zn + 2 Ag⁺ + 2 e⁻ → Zn²⁺ + 2 e⁻ + 2 Ag : les 2 e⁻ s’annulent, il reste Zn + 2 Ag⁺ → Zn²⁺ + 2 Ag.', indice: 'Deux ions Ag⁺ pour les deux électrons libérés par un atome de zinc.' } },
    { id: 'ne', titre: 'Quantité d’électrons échangés', focus: ['scene'],
      retenirTitre: 'À retenir : l’équation de fonctionnement',
      retenir: <>
        <SvgEquationCarte/>
        <ul style={puces}>
          <li>Pôle + : <strong>réduction</strong> à la cathode ; pôle − : <strong>oxydation</strong> à l’anode ; on égalise les électrons puis on additionne.</li>
          <li>Les coefficients de l’équation donnent les proportions : <strong>n(A) ÷ α = n(e⁻) ÷ β</strong> pour un réactif A de coefficient α.</li>
          <li>Moyen de s’en souvenir : <strong>« les électrons s’annulent toujours »</strong>. Idée fausse : « on peut garder des électrons dans l’équation finale. » Vrai : l’équation de fonctionnement n’en contient pas.</li></ul></>,
      texte: <>Retour à la pile <strong>cuivre / zinc</strong>. Chaque demi-pile contient <strong>100 mL</strong> de solution à <strong>0,10 mol/L</strong> ; la lame de zinc pèse <strong>2,0 g</strong> (M(Zn) = 65,4 g/mol). Équation : <strong>Zn + Cu²⁺ → Zn²⁺ + Cu</strong>. Le réactif limitant est celui qui s’épuise le premier. Il y a <strong>0,010 mol</strong> d’ions Cu²⁺ et <strong>0,031 mol</strong> de zinc ; chaque Cu²⁺ ou chaque Zn échange <strong>2 électrons</strong>.</>,
      tache: { type: 'num', q: 'Quantité d’électrons n(e⁻) échangés quand la pile est usée, en mol', unite: 'mol', vrai: PG.ne, tol: 0.03, affiche: v => sci(v, 2), cs: 2,
        pieges: [[PG.nCu, 'Chaque ion Cu²⁺ capte 2 électrons : n(e⁻) = 2 × n(Cu²⁺).'], [2 * PG.nZn, 'Le réactif limitant est Cu²⁺ (0,010 mol), pas le zinc : prenez le plus petit n(e⁻) possible.']],
        calcul: () => ['Cu²⁺ : 0,010 mol, 2 e⁻ chacun : 0,020 mol d’électrons possibles ; Zn : 0,031 mol × 2 = 0,061 mol possibles.', 'Le plus petit l’emporte : n(e⁻) = 2 × 0,010 = 2,0 × 10^−2 mol.'], expl: 'Cu²⁺ limitant : n(e⁻) = 2 × 0,010 = 0,020 mol.', indice: 'n(e⁻) = 2 × n(Cu²⁺) pour le réactif limitant.' } },
    { id: 'Q', titre: 'La quantité d’électricité', focus: ['scene'],
      texte: <>Chaque mole d’électrons transporte la charge <strong>F = 96 500 C/mol</strong> (constante de Faraday). La charge totale que la pile peut débiter est la <strong>quantité d’électricité</strong> : <strong>Q = n(e⁻) × F</strong>. Ici n(e⁻) = <strong>2,0 × 10<sup>−2</sup> mol</strong>.</>,
      tache: { type: 'num', q: 'Quantité d’électricité Q, en coulombs (C)', unite: 'C', vrai: PG.Q, tol: 0.03, affiche: v => sci(v, 2), cs: 2,
        pieges: [[0.010 * 96500, 'Utilisez n(e⁻) = 0,020 mol (et non 0,010 mol).'], [0.020 / 96500, 'On multiplie : Q = n(e⁻) × F, pas une division.']],
        calcul: () => ['Q = n(e⁻) × F = 2,0 × 10^−2 × 96 500.', 'Q = 1 930 C ≈ 1,9 × 10^3 C.'], expl: 'Q = 0,020 × 96 500 = 1 930 C ≈ 1,9 × 10³ C.', indice: 'Q = n(e⁻) × F avec F = 96 500 C/mol.' } },
    { id: 'duree', titre: 'La durée de fonctionnement', focus: ['scene'],
      texte: <>La pile alimente un récepteur avec un courant d’intensité constante <strong>i = 20 mA</strong>. La charge débitée vérifie <strong>Q = i × Δt</strong>. On a <strong>Q = 1,9 × 10<sup>3</sup> C</strong> (valeur exacte 1 930 C). Attention : <strong>i doit être en ampères</strong>.</>,
      tache: { type: 'num', q: 'Durée de fonctionnement Δt, en heures (h)', unite: 'h', vrai: PG.duree_h, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.duree_s, 'Le résultat est en secondes : divisez par 3 600 pour avoir des heures.'], [1930 / 20 / 3600, 'Convertissez i en ampères : 20 mA = 0,020 A.']],
        calcul: () => ['Δt = Q ÷ i = 1 930 ÷ 0,020 = 96 500 s.', '96 500 ÷ 3 600 ≈ 26,8 h ≈ 27 h.'], expl: 'Δt = 1 930 ÷ 0,020 = 96 500 s ≈ 26,8 h ≈ 27 h.', indice: 'Δt = Q ÷ i avec i = 0,020 A ; 1 h = 3 600 s.' } },
    { id: 'serie', titre: 'Deux piles en série', focus: ['scene'],
      texte: <>On associe <strong>deux piles identiques en série</strong> (le pôle + de l’une relié au pôle − de l’autre), pour alimenter le même récepteur sous 20 mA. La même charge traverse les deux piles.</>,
      tache: { type: 'qcm', q: 'Pour l’association en série de deux piles identiques :', ...QCM.serie,
        expl: 'Les tensions s’additionnent (2 × 1,10 V), mais la même charge traverse chaque pile : la durée de fonctionnement ne change pas.', indice: 'En série, le même courant traverse les deux piles : chacune débite la charge Q en Δt = Q ÷ i.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : de la pile à la durée',
      retenir: <>
        <SvgQCarte/>
        <ul style={puces}>
          <li>Du réactif limitant à la durée : <strong>n(e⁻) → Q = n(e⁻) × F → Δt = Q ÷ i</strong>, avec F = 96 500 C/mol et <strong>i en ampères</strong>.</li>
          <li>En série, les tensions s’additionnent mais <strong>la capacité Q et la durée ne changent pas</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« des moles aux coulombs, des coulombs aux secondes »</strong>. Idée fausse : « deux piles en série durent deux fois plus longtemps. » Vrai : elles durent autant, sous une tension double.</li></ul></>,
      texte: <>Vous savez lire la polarité d’une pile au voltmètre, nommer l’anode et la cathode, écrire l’équation de fonctionnement, calculer la quantité d’électricité Q = n(e⁻) F et la durée de fonctionnement Δt = Q ÷ i. Explorez avec le voltmètre mobile, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SC = SCENES[idEtape];
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{idEtape === 'equation' ? 'La pile zinc / argent' : 'La pile cuivre / zinc'}</div>
      <ScenePile {...SC} maxWidth={440} aria={`Schéma de la pile ${idEtape === 'equation' ? 'zinc et argent' : 'cuivre et zinc'}, deux demi-piles reliées par un pont salin.`}/>
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'polarite'
    ? { ...M.tirageDefiPolarite(), type, reps: { plus: '', anode: '', sens: '' }, verifie: false, corr: false }
    : { ...M.tirageDefiCapacite(), type, reps: { q: '', t: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const sensAttendu = x => (x.coteMoins === 'g' ? 'gd' : 'dg');
  const verifier = () => {
    const x = defi;
    const ok = x.type === 'polarite' ? (x.reps.plus === x.cotePlus && x.reps.anode === x.coteMoins && x.reps.sens === sensAttendu(x))
      : (proche(lireNombre(x.reps.q), x.Q, 0.08) && proche(lireNombre(x.reps.t), x.dureeH, 0.10));
    setDefi(y => ({ ...y, verifie: true, ok })); (x.type === 'polarite' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const nomM = id => M.METAUX[id].nom;
  const diagnostic = () => {
    const x = defi, msgs = [];
    if (x.type === 'polarite') {
      const lit = `Le voltmètre affiche ${x.lu > 0 ? '+' : '−'}${fr(Math.abs(x.lu).toFixed(2))} V avec la borne V du côté ${x.borneV === 'g' ? 'gauche' : 'droit'}.`;
      if (!x.reps.plus || !x.reps.anode || !x.reps.sens) return ['Répondez aux trois questions (pôle +, anode, sens des électrons).'];
      if (x.reps.plus !== x.cotePlus) msgs.push(`${lit} Une tension ${x.lu > 0 ? 'positive : la borne V est sur le pôle +, donc le pôle + est du côté de la borne V' : 'négative : la borne V est sur le pôle −, donc le pôle + est de l’autre côté'}.`);
      if (x.reps.anode !== x.coteMoins) msgs.push('L’anode est l’électrode où a lieu l’oxydation : c’est le pôle −, l’électrode opposée au pôle +.');
      if (x.reps.sens !== sensAttendu(x)) msgs.push('Les électrons quittent l’anode (pôle −) et vont vers la cathode (pôle +) en passant par le fil.');
      return msgs;
    }
    const q = lireNombre(x.reps.q), t = lireNombre(x.reps.t);
    if (!isFinite(q) || !isFinite(t)) return ['Écrivez deux nombres (virgule ou point) : Q en coulombs et Δt en heures.'];
    if (!proche(q, x.Q, 0.08)) {
      const autre = x.limitant === 'ion' ? x.neMet : x.neIon;
      msgs.push(proche(q, autre * M.F, 0.05) ? 'Vous avez pris l’autre réactif : le réactif limitant est celui qui donne le plus petit n(e⁻).'
        : proche(q, x.Q / M.METAUX[x.limitant === 'ion' ? x.plus : x.moins].z, 0.05) ? 'Il manque le nombre d’électrons échangés par ion ou par atome (z) : n(e⁻) = z × n.'
          : `Refaites : n(${x.limitant === 'ion' ? M.METAUX[x.plus].ion : nomM(x.moins)}) puis n(e⁻) = ${x.limitant === 'ion' ? M.METAUX[x.plus].z : M.METAUX[x.moins].z} × n, enfin Q = n(e⁻) × F avec F = 96 500 C/mol. Votre valeur est ${q > x.Q ? 'trop grande' : 'trop petite'}.`);
    }
    if (!proche(t, x.dureeH, 0.10)) {
      const dt = q / (x.I / 1000) / 3600;
      msgs.push(proche(t, dt, 0.06) ? 'Votre durée est cohérente avec VOTRE Q ; corrigez d’abord Q.'
        : proche(t, q / (x.I / 1000), 0.06) ? 'Vous avez donné la durée en secondes : divisez par 3 600 pour des heures.'
          : proche(t, q / x.I / 3600, 0.06) ? 'Convertissez i en ampères : divisez les milliampères par 1 000.'
            : `Avec VOTRE Q = ${fr(Math.round(q))} C : Δt = Q ÷ i = ${fr(Math.round(q))} ÷ ${fr(x.I / 1000)} = ${fr(Math.round(q / (x.I / 1000)))} s, soit ${fr(dt.toFixed(1))} h. Votre valeur est ${t > dt ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'polarite'
    ? `Pôle + : électrode ${cote(defi.cotePlus)} (${nomM(defi.plus)}). Anode (pôle −) : électrode ${cote(defi.coteMoins)} (${nomM(defi.moins)}). Les électrons vont de l’anode vers la cathode, donc ${defi.coteMoins === 'g' ? 'de gauche vers droite' : 'de droite vers gauche'}.`
    : `n(${M.METAUX[defi.plus].ion}) = ${nbf(defi.nIon, 4)} mol → n(e⁻) = ${nbf(defi.neIon, 4)} mol ; n(${nomM(defi.moins)}) = ${nbf(defi.nMet, 4)} mol → n(e⁻) = ${nbf(defi.neMet, 4)} mol. Réactif limitant : ${defi.limitant === 'ion' ? M.METAUX[defi.plus].ion : nomM(defi.moins)}, donc n(e⁻) = ${nbf(defi.ne, 4)} mol ; Q = n(e⁻) × F = ${nbf(defi.Q, 0)} C ; Δt = Q ÷ i = ${nbf(defi.dureeH, 1)} h.`;
  const selectDefi = (cle, nom, options, id) => (
    <div style={{ marginBottom: 8, fontSize: 14 }}>
      <label htmlFor={id} style={{ display: 'block', fontWeight: 700, color: KIT.txt2, marginBottom: 3 }}>{nom}</label>
      <select id={id} value={defi.reps[cle]} onChange={e2 => change(cle, e2.target.value)} style={{ width: '100%', maxWidth: 360, minHeight: 42, borderRadius: 8, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, padding: '0 10px', fontSize: 15 }}>
        <option value="">— choisir —</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>);
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} ({unite}) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en ${unite}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('ppc-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['polarite', 'Polarité et sens des électrons'], ['capacite', 'Capacité et durée']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#b45309')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'polarite' ? 'Défi : lire la polarité d’une pile' : 'Défi : capacité et durée de fonctionnement'}</div>
      {defi.type === 'polarite'
        ? <>
          <div style={{ ...lbl, marginBottom: 8 }}>Une pile est formée d’une demi-pile {nomM(defi.gId).toLowerCase()} à gauche et d’une demi-pile {nomM(defi.dId).toLowerCase()} à droite. La borne <strong>V</strong> du voltmètre est sur l’électrode {defi.borneV === 'g' ? 'de gauche' : 'de droite'} : il affiche <strong>{defi.lu > 0 ? '+' : '−'}{fr(Math.abs(defi.lu).toFixed(2))} V</strong>.</div>
          <div style={{ marginBottom: 8 }}><ScenePile paire={[defi.gId, defi.dId]} borneV={defi.borneV} lu={defi.lu} maxWidth={420} aria={`Pile ${nomM(defi.gId)} à gauche, ${nomM(defi.dId)} à droite, voltmètre affichant ${fr(defi.lu.toFixed(2))} volt avec la borne V à ${defi.borneV === 'g' ? 'gauche' : 'droite'}.`}/></div>
          {selectDefi('plus', 'Le pôle + est l’électrode…', [['g', 'de gauche'], ['d', 'de droite']], 'ppc-plus')}
          {selectDefi('anode', 'L’anode est l’électrode…', [['g', 'de gauche'], ['d', 'de droite']], 'ppc-anode')}
          {selectDefi('sens', 'Dans le fil, les électrons vont…', [['gd', 'de l’électrode de gauche vers celle de droite'], ['dg', 'de l’électrode de droite vers celle de gauche']], 'ppc-sens')}
          <IndiceDefi cache={false}>Tension positive : borne V sur le pôle +. Anode = pôle − = oxydation. Les électrons vont de l’anode vers la cathode.</IndiceDefi>
        </>
        : <>
          <div style={{ ...lbl, marginBottom: 8 }}>Pile {nomM(defi.moins).toLowerCase()} / {nomM(defi.plus).toLowerCase()} : la lame de {nomM(defi.moins).toLowerCase()} de masse <strong>{fr(defi.m.toFixed(2))} g</strong> (M = {fr(M.METAUX[defi.moins].M)} g/mol) plonge dans sa solution ; l’autre demi-pile contient <strong>{fr(defi.V)} mL</strong> de solution d’ions {avecIndices(M.METAUX[defi.plus].ion)} à <strong>{fr(defi.c.toFixed(3))} mol/L</strong>. Équation : <strong>{avecIndices(M.equationTexte(defi.moins, defi.plus))}</strong>. Chaque {avecIndices(M.METAUX[defi.plus].ion)} capte {M.METAUX[defi.plus].z} e⁻ ; chaque atome de {nomM(defi.moins).toLowerCase()} en libère {M.METAUX[defi.moins].z}. La pile débite <strong>i = {defi.I} mA</strong> jusqu’à usure complète (F = 96 500 C/mol). Résultats avec 2 chiffres significatifs.</div>
          {champ('q', 'Quantité d’électricité Q', 'C', 'ppc-q')}{champ('t', 'Durée Δt', 'h', 'ppc-t')}
          <IndiceDefi cache={false}>n = c × V (V en L) ou n = m ÷ M ; n(e⁻) = z × n pour chaque réactif, le plus petit l’emporte ; Q = n(e⁻) × F ; Δt = Q ÷ i (i en A), puis ÷ 3 600 pour des heures.</IndiceDefi>
        </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ppc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{diagnostic().map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Pile idéale</strong> : le courant i est constant jusqu’à épuisement du réactif limitant ; en réalité la tension baisse et la pile s’arrête plus tôt (résistance interne, concentrations qui changent).</li>
      <li><strong>Polarité</strong> : elle se lit au voltmètre (signe de la tension) ; aucune loi de Nernst ni potentiel standard n’est utilisé. Les valeurs de tension à vide affichées sont des données de la simulation.</li>
      <li><strong>Quantité d’électricité</strong> Q = n(e⁻) F avec F = 96 500 C/mol ; Δt = Q ÷ i ; la réaction est supposée totale, un seul réactif limitant.</li>
      <li><strong>Demi-piles</strong> : 100 mL de solution à 0,10 mol/L (sauf défi), lame de 2,0 g ; le pont salin ne contient que des ions spectateurs ; les ions du pont ne participent pas aux réactions aux électrodes.</li>
      <li><strong>Valeurs</strong> : masses, concentrations, volumes et intensités sont inventés pour la simulation ; les durées affichées (plusieurs heures) sont accélérées à l’écran.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#b45309')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Déplace la pastille « V ⇄ » de l’autre côté : que devient le signe de la tension ? et le pôle + ?</li>
      <li>Choisis la pile cuivre | argent : quelle électrode est l’anode ? Compare avec la pile zinc | argent.</li>
      <li>Appuie sur « Débiter » : quelle lame s’use, laquelle grossit ?</li>
      <li>Passe de 20 à 100 mA : la capacité Q change-t-elle ? et la durée ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Tension positive : borne V sur le pôle + ; anode = pôle − = oxydation ; cathode = pôle + = réduction</li>
        <li>Électrons : de l’anode vers la cathode, dans le fil ; cations du pont : vers la cathode</li>
        <li>Q = n(e⁻) × F (F = 96 500 C/mol) ; Δt = Q ÷ i (i en A)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ppc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ppc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ppc-col { display: flex; flex-direction: column; gap: 12px; }
        .ppc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .ppc-l1.cote .ppc-carte { order: 2; } .ppc-l1.cote .ppc-main { order: 1; } }
        @media (max-width: 900px) { .ppc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ppc-in { animation: ppc-fondu 0.35s ease-out; } @keyframes ppc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Piles : polarité, équation de fonctionnement et durée</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une <strong>pile</strong> transforme de l’énergie chimique en énergie électrique. On lit sa <strong>polarité</strong> au voltmètre, on écrit son <strong>équation de fonctionnement</strong>, puis on calcule la quantité d’électricité <strong>Q = n(e⁻) F</strong> et la <strong>durée</strong> Δt = Q ÷ i.</div>
      {!enExplore && <div className={`ppc-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="ppc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="ppc-carte">{panneauHypo}</div>}
        <div className="ppc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'polarite' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="ppc-col"><div className="ppc-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="ppc-ex"><PilePcmExplore ex={ex} setEx={setEx}/></div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
