import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./batterieModele";
import { BatterieExplore } from "./BatterieExplore";
import { QCM } from "./batterieQcm";
import { SceneBatterie, SvgCharge, SvgCapacite, SvgFiche, SvgEnergieDispo, SvgDureeRecepteur, SvgCapaciteEnergie } from "./BatterieSchemas";

const SIM_ID = 231, CLE_GUIDE = 'batterie-guide-v1';
declarerDefis(SIM_ID, [['duree', 'Durée de fonctionnement d’une batterie'], ['choix', 'Choisir une batterie']]);

// ====================================================
//  SIM 231 — BATTERIE : ÉNERGIE DISPONIBLE ET DURÉE DE FONCTIONNEMENT (TSTL, enseignement PCM, partie « Énergie »).
//  Une seule idée : une batterie stocke une quantité d'électricité Qs (Ah) sous une tension U ; énergie disponible E = Qs × U ; durée Δt = Qs ÷ I avec I = P ÷ U.
//  Aucune situation des documents du Moodle : accumulateur de 12 V et 7,0 Ah, lampe de 10 W, comparaison avec un accumulateur de 3,7 V et 10 Ah (valeurs inventées).
//  Capacités visées (jamais affichées à l'élève) : relation entre quantité d'électricité, durée de fonctionnement et intensité ; énergie disponible en fonction de la tension et de la quantité d'électricité ;
//  durée de fonctionnement selon le récepteur ; extraire d'une documentation les caractéristiques utiles d'un accumulateur.
//  Modèle : batterieModele.js (test node). QCM : batterieQcm.js. Schémas : BatterieSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const gd = v => (v >= 1000 ? nbf(Math.round(v), 0) : v >= 100 ? nbf(v, 0) : v >= 10 ? nbf(v, 1) : nbf(v, 2));
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const P = M.PARCOURS;

// ---------- valeurs de référence du parcours ----------
const Q0 = M.chargeC(P.I0, P.dt0);                         // 10 C
const QC = M.ahEnC(P.Qs);                                  // 25 200 C
const DT1 = M.dureeH(P.Qs, P.I1);                          // 14 h
const E1 = M.energieWh(P.U, P.Qs);                         // 84 Wh
const EJ = M.energieJ(P.U, P.Qs);                          // 302 400 J
const IL = M.intensite(P.P, P.U);                          // 0,833 A
const DTL = M.dureeH(P.Qs, IL);                            // 8,4 h

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(Number(ev.target.value))} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);

// ====================================================
export function SimulationBatterie() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('duree');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ b: 0, P: 10, t: 0 });
  const [tG, setTG] = useState(0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['reservoir', 'charge', 'ah', 'duree', 'fiche', 'energie', 'joules', 'intensite', 'dureeL', 'double', 'compare', 'bilan'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  const ETAPES = [
    { id: 'reservoir', titre: 'Une batterie, réservoir d’énergie', focus: ['scene'],
      texte: <>Une <strong>batterie</strong> (ou accumulateur) est un <strong>réservoir d’énergie</strong> : elle stocke de l’énergie chimique et la transfère à un <strong>récepteur</strong> (ici une lampe) grâce au courant électrique. Notre batterie a une <strong>tension U = {P.U} V</strong>.</>,
      tache: { type: 'qcm', q: 'Quand la batterie alimente la lampe, que se passe-t-il ?', ...QCM.reservoir,
        expl: 'La batterie est un réservoir : son énergie chimique stockée diminue, et cette énergie est transférée à la lampe par le courant électrique (conservation de l’énergie).', indice: 'L’énergie ne se crée pas et ne disparaît pas : elle passe d’un système à un autre. Quel est le réservoir qui se vide ?' } },
    { id: 'charge', titre: 'Le courant, un débit de charges', focus: ['scene'],
      texte: <>Un courant électrique est un <strong>débit de charges électriques</strong>. Un courant d’<strong>intensité I</strong> (en ampères, A) pendant une <strong>durée Δt</strong> (en secondes, s) transporte une <strong>charge Q</strong> (en coulombs, C) : <strong>Q = I × Δt</strong>. Un récepteur est parcouru par <strong>I = {nbf(P.I0, 2)} A</strong> pendant <strong>Δt = {P.dt0} s</strong>.</>,
      tache: { type: 'num', q: 'Charge Q qui traverse le récepteur, en coulombs (C)', unite: 'C', vrai: Q0, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.I0 / P.dt0, 'Il faut multiplier l’intensité par la durée, pas les diviser.'], [P.I0 * P.dt0 / 3600, 'Cette valeur est trop petite : la durée est déjà en secondes, il ne faut pas la diviser par 3 600.']],
        calcul: () => [`Q = I × Δt = ${nbf(P.I0, 2)} × ${P.dt0} = ${nbf(Q0, 1)} C.`],
        expl: `Q = ${nbf(P.I0, 2)} × ${P.dt0} = ${nbf(Q0, 1)} C.`, indice: 'Q = I × Δt avec I en ampères et Δt en secondes : le résultat est en coulombs.' } },
    { id: 'ah', titre: 'L’ampère-heure', focus: ['scene'],
      retenirTitre: 'À retenir : courant et charge',
      retenir: <>
        <SvgCharge/>
        <ul style={puces}>
          <li>La charge qui traverse un circuit est <strong>Q = I × Δt</strong> (C = A × s).</li>
          <li>Exemple : 2,0 A pendant 10 s transportent 20 C.</li>
          <li>Moyen de s’en souvenir : <strong>« un débit multiplié par un temps »</strong>.</li>
        </ul></>,
      texte: <>Pour une batterie, on compte la charge en <strong>ampères-heures (Ah)</strong> : 1 Ah est la charge transportée par 1 A pendant 1 h (3 600 s), donc <strong>1 Ah = 3 600 C</strong>. La charge totale que la batterie peut débiter est sa <strong>capacité Qs</strong> : ici <strong>Qs = {nbf(P.Qs, 1)} Ah</strong>.</>,
      tache: { type: 'num', q: 'Capacité Qs de la batterie, en coulombs (C)', unite: 'C', vrai: QC, tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        pieges: [[P.Qs * 60, 'Une heure vaut 3 600 s (pas 60 s) : 1 Ah = 3 600 C.'], [P.Qs / 3600, 'Il faut multiplier par 3 600 pour passer des Ah aux C, pas diviser.']],
        calcul: () => [`Qs = ${nbf(P.Qs, 1)} Ah × 3 600 = ${nbf(QC, 0)} C.`],
        expl: `Qs = ${nbf(P.Qs, 1)} × 3 600 = ${nbf(QC, 0)} C, soit environ 2,5 × 10⁴ C.`, indice: '1 Ah = 3 600 C : multipliez la capacité en Ah par 3 600.' } },
    { id: 'duree', titre: 'La durée de fonctionnement', focus: ['scene'],
      texte: <>La batterie débite un courant d’intensité constante <strong>I = {nbf(P.I1, 2)} A</strong>. Elle est vide quand elle a débité toute sa charge <strong>Qs = {nbf(P.Qs, 1)} Ah</strong>. La <strong>durée de fonctionnement</strong> est <strong>Δt = Qs ÷ I</strong> (Qs en Ah, I en A, Δt en heures).</>,
      tache: { type: 'num', q: 'Durée de fonctionnement Δt, en heures (h)', unite: 'h', vrai: DT1, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.Qs * P.I1, 'Il faut diviser la capacité par l’intensité, pas les multiplier.'], [P.I1 / P.Qs, 'Le rapport est inversé : Δt = Qs ÷ I.']],
        calcul: () => [`Δt = Qs ÷ I = ${nbf(P.Qs, 1)} ÷ ${nbf(P.I1, 2)} = ${nbf(DT1, 1)} h.`],
        expl: `Δt = ${nbf(P.Qs, 1)} ÷ ${nbf(P.I1, 2)} = ${nbf(DT1, 1)} h : une capacité en Ah divisée par une intensité en A donne directement des heures.`, indice: 'Δt = Qs ÷ I avec Qs = 7,0 Ah et I = 0,50 A. Le résultat est en heures.' } },
    { id: 'fiche', titre: 'Lire une fiche technique', focus: [],
      retenirTitre: 'À retenir : capacité et durée',
      retenir: <>
        <SvgCapacite/>
        <ul style={puces}>
          <li>La durée de fonctionnement d’une batterie est <strong>Δt = Qs ÷ I</strong> (h = Ah ÷ A).</li>
          <li>Exemple : 5,0 Ah et 2,0 A donnent 2,5 h.</li>
          <li>Moyen de s’en souvenir : <strong>« plus on tire de courant, plus vite la batterie est vide »</strong>.</li>
        </ul></>,
      texte: <>La <strong>fiche technique</strong> de la batterie indique : tension nominale <strong>12 V</strong>, capacité <strong>7,0 Ah</strong>, courant de décharge maximal <strong>20 A</strong>, masse <strong>2,1 kg</strong>.</>,
      tache: { type: 'qcm', q: 'Quelle caractéristique indique la quantité d’électricité stockée ?', ...QCM.fiche,
        expl: 'La capacité, en ampères-heures, est la quantité d’électricité que la batterie peut débiter. La tension nominale donne l’énergie par unité de charge, le courant maximal est une limite d’utilisation, la masse ne renseigne pas sur la charge.', indice: 'La quantité d’électricité se compte en coulombs, ou en ampères-heures : laquelle de ces valeurs est en Ah ?' } },
    { id: 'energie', titre: 'L’énergie disponible', focus: ['scene'],
      retenirTitre: 'À retenir : lire une fiche technique',
      retenir: <>
        <SvgFiche/>
        <ul style={puces}>
          <li>Dans une fiche, la <strong>capacité (Ah)</strong> donne la quantité d’électricité ; la <strong>tension nominale (V)</strong> sert à calculer l’énergie ; le courant maximal est une limite.</li>
          <li>Exemple : un accumulateur de 6 V et 4,0 Ah.</li>
          <li>Moyen de s’en souvenir : <strong>« Ah : combien de charge ; V : combien d’énergie par charge »</strong>.</li>
        </ul></>,
      texte: <>La batterie sous <strong>U = {P.U} V</strong> apporte à chaque coulomb débité une énergie de U joules. L’<strong>énergie disponible</strong> est <strong>E = Qs × U</strong> (Qs en Ah, U en V, E en <strong>wattheures</strong>, Wh). Rappel : Qs = <strong>{nbf(P.Qs, 1)} Ah</strong>.</>,
      tache: { type: 'num', q: 'Énergie disponible E, en wattheures (Wh)', unite: 'Wh', vrai: E1, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[P.Qs / P.U, 'Il faut multiplier la capacité par la tension, pas les diviser.'], [E1 * 3600, 'Cette valeur est en joules : le résultat est demandé en Wh.']],
        calcul: () => [`E = Qs × U = ${nbf(P.Qs, 1)} × ${P.U} = ${nbf(E1, 0)} Wh.`],
        expl: `E = ${nbf(P.Qs, 1)} × ${P.U} = ${nbf(E1, 0)} Wh.`, indice: 'E = Qs × U avec Qs = 7,0 Ah et U = 12 V : le résultat est en wattheures.' } },
    { id: 'joules', titre: 'Du wattheure au joule', focus: ['scene'],
      retenirTitre: 'À retenir : énergie disponible',
      retenir: <>
        <SvgEnergieDispo/>
        <ul style={puces}>
          <li>L’énergie disponible est <strong>E = Qs × U</strong> (Wh = Ah × V) ; <strong>1 Wh = 3 600 J</strong>.</li>
          <li>Exemple : 4,0 Ah sous 6 V donnent 24 Wh, soit 86 400 J.</li>
          <li>Moyen de s’en souvenir : <strong>« ampères-heures × volts = wattheures »</strong>.</li>
        </ul></>,
      texte: <>Le joule (J) est l’unité légale d’énergie : <strong>1 Wh = 3 600 J</strong> (1 W pendant 3 600 s). Rappel : l’énergie disponible est <strong>E = {nbf(E1, 0)} Wh</strong>.</>,
      tache: { type: 'num', q: 'Énergie disponible E, en joules (J), avec 2 chiffres significatifs', unite: 'J', vrai: EJ, tol: 0.03, affiche: v => String(Math.round(v)), cs: 2,
        pieges: [[E1 * 60, 'Une heure vaut 3 600 s (pas 60 s) : 1 Wh = 3 600 J.'], [E1 / 3600, 'Il faut multiplier par 3 600 pour passer des Wh aux J, pas diviser.']],
        calcul: () => [`E = ${nbf(E1, 0)} Wh × 3 600 = ${nbf(EJ, 0)} J ≈ 3,0 × 10⁵ J.`],
        expl: `E = ${nbf(E1, 0)} × 3 600 = ${nbf(EJ, 0)} J, soit environ 3,0 × 10⁵ J.`, indice: '1 Wh = 3 600 J : multipliez l’énergie en Wh par 3 600.' } },
    { id: 'intensite', titre: 'Une lampe sur la batterie', focus: ['scene'],
      texte: <>On branche sur la batterie ({P.U} V) une lampe de <strong>puissance P = {P.P} W</strong>. Un récepteur de puissance P alimenté sous la tension U est parcouru par une intensité <strong>I = P ÷ U</strong> (P en W, U en V, I en A).</>,
      tache: { type: 'num', q: 'Intensité I du courant dans la lampe, en ampères (A)', unite: 'A', vrai: IL, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        pieges: [[P.U / P.P, 'Le rapport est inversé : I = P ÷ U.'], [P.P * P.U, 'Il faut diviser la puissance par la tension, pas les multiplier.']],
        calcul: () => [`I = P ÷ U = ${P.P} ÷ ${P.U} = ${nbf(IL, 3)} A.`],
        expl: `I = ${P.P} ÷ ${P.U} = ${nbf(IL, 2)} A.`, indice: 'I = P ÷ U avec P = 10 W et U = 12 V : le résultat est en ampères.' } },
    { id: 'dureeL', titre: 'La durée avec cette lampe', focus: ['scene', 'mesures'],
      texte: <>Rappel : la lampe demande <strong>I ≈ {nbf(IL, 2)} A</strong>. La batterie (<strong>Qs = {nbf(P.Qs, 1)} Ah</strong>) débite ce courant jusqu’à être vide.</>,
      tache: { type: 'num', q: 'Durée de fonctionnement de la lampe sur cette batterie, en heures (h)', unite: 'h', vrai: DTL, tol: 0.04, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.Qs * IL, 'Il faut diviser la capacité par l’intensité, pas les multiplier.'], [IL / P.Qs, 'Le rapport est inversé : Δt = Qs ÷ I.']],
        calcul: () => [`Δt = Qs ÷ I = ${nbf(P.Qs, 1)} ÷ ${nbf(IL, 3)} = ${nbf(DTL, 1)} h.`, `Vérification : Δt = E ÷ P = ${nbf(E1, 0)} ÷ ${P.P} = ${nbf(DTL, 1)} h.`],
        expl: `Δt = ${nbf(P.Qs, 1)} ÷ ${nbf(IL, 2)} ≈ ${nbf(DTL, 1)} h. On retrouve le même résultat avec Δt = E ÷ P = ${nbf(E1, 0)} ÷ ${P.P} = ${nbf(DTL, 1)} h.`, indice: 'Δt = Qs ÷ I avec Qs = 7,0 Ah et I ≈ 0,83 A.' } },
    { id: 'double', titre: 'Une lampe deux fois plus puissante', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : la durée avec un récepteur',
      retenir: <>
        <SvgDureeRecepteur/>
        <ul style={puces}>
          <li>Avec un récepteur de puissance P : <strong>I = P ÷ U</strong>, puis <strong>Δt = Qs ÷ I</strong>, ou directement <strong>Δt = E ÷ P</strong>.</li>
          <li>Exemple : 4,0 Ah sous 6 V et 12 W donnent 2,0 A, soit 2,0 h.</li>
          <li>Moyen de s’en souvenir : <strong>« la batterie contient une énergie, le récepteur la consomme à une puissance »</strong>.</li>
        </ul></>,
      texte: <>Un curseur de temps apparaît : il montre la charge restante de la batterie alimentant la lampe de {P.P} W. On imagine maintenant une lampe de <strong>20 W</strong> à la place (toujours sous {P.U} V). Rappel : avec la lampe de {P.P} W, la durée était de <strong>{nbf(DTL, 1)} h</strong>.</>,
      tache: { type: 'qcm', q: 'Comment est la durée de fonctionnement avec la lampe de 20 W ?', ...QCM.double,
        expl: `I = P ÷ U est multipliée par 2 (≈ ${nbf(2 * IL, 2)} A), donc Δt = Qs ÷ I est divisée par 2 : ${nbf(DTL / 2, 1)} h. On retrouve Δt = E ÷ P = ${nbf(E1, 0)} ÷ 20 = ${nbf(DTL / 2, 1)} h.`, indice: 'Calculez la nouvelle intensité I = P ÷ U : est-elle plus grande ou plus petite ? Puis Δt = Qs ÷ I.' } },
    { id: 'compare', titre: 'Ampères-heures ou wattheures ?', focus: [],
      texte: <>On compare deux batteries : la nôtre (<strong>12 V, 7,0 Ah</strong>) et un accumulateur lithium-ion de <strong>3,7 V et 10 Ah</strong>. La seconde a la plus grande capacité en Ah.</>,
      tache: { type: 'qcm', q: 'Laquelle stocke le plus d’énergie ?', ...QCM.compare,
        expl: `E = Qs × U : 12 × 7,0 = ${nbf(E1, 0)} Wh pour la première, 3,7 × 10 = ${nbf(M.energieWh(P.B.U, P.B.Qs), 0)} Wh pour la seconde. La capacité en Ah ne suffit pas pour comparer des énergies : il faut aussi la tension.`, indice: 'Calculez E = Qs × U pour chacune des deux batteries, puis comparez.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : capacité et énergie',
      retenir: <>
        <SvgCapaciteEnergie/>
        <ul style={puces}>
          <li>La <strong>capacité Qs (Ah)</strong> est une quantité d’électricité ; l’<strong>énergie E = Qs × U (Wh)</strong> tient aussi compte de la tension ; <strong>1 Ah = 3 600 C</strong>, <strong>1 Wh = 3 600 J</strong>.</li>
          <li>Exemple : 12 V et 7,0 Ah stockent 84 Wh, plus de deux fois les 37 Wh de 3,7 V et 10 Ah.</li>
          <li>Moyen de s’en souvenir : <strong>« pour comparer des batteries, comparer les Wh, pas les Ah »</strong>.</li>
        </ul></>,
      texte: <>Vous savez que la charge est Q = I × Δt, que la capacité d’une batterie se compte en Ah, que son énergie disponible est E = Qs × U, et que la durée de fonctionnement est Δt = Qs ÷ I, avec I = P ÷ U pour un récepteur de puissance P. Explorez avec d’autres batteries, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- état affiché selon le mode ----------
  const bat = M.BATTERIES[ti.b];
  const U = enExplore ? bat.U : P.U, Qs = enExplore ? bat.Qs : P.Qs;
  const Pw = enExplore ? ti.P : P.P;
  const I = M.intensite(Pw, U), E = M.energieWh(U, Qs), dtH = M.dureeH(Qs, I);
  const tMax = enExplore ? Math.min(60, Math.ceil(dtH * 1.2)) : 12;
  const tCur = enExplore ? Math.min(ti.t, tMax) : Math.min(tG, tMax);
  const restante = M.chargeRestanteAh(Qs, I, tCur);
  const fraction = restante / Qs;
  const curseurT = enExplore || (enGuide && deja('double'));
  const courant = enExplore || deja('intensite');

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'duree' ? { ...M.tirageDefiA(), reps: { I: '', T: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { E: '', Q: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'duree') {
      const i = lireNombre(defi.reps.I), t = lireNombre(defi.reps.T);
      const okI = isFinite(i) && proche(i, defi.I, 0.05), okT = isFinite(t) && proche(t, defi.dt, 0.06);
      setDefi(x => ({ ...x, verifie: true, ok: okI && okT, okI, okT })); noterA(okI && okT);
    } else {
      const e = lireNombre(defi.reps.E), q = lireNombre(defi.reps.Q);
      const okE = isFinite(e) && proche(e, defi.E, 0.04), okQ = isFinite(q) && proche(q, defi.Qs, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok: okE && okQ, okE, okQ })); noterB(okE && okQ);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('bat-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  // messages d'aide ciblés (la valeur du défi n'est jamais donnée avant la correction)
  const diagnosticA = () => {
    const x = defi, msgs = [], i = lireNombre(x.reps.I), t = lireNombre(x.reps.T);
    if (!isFinite(i)) msgs.push('Intensité : écrivez un nombre (virgule ou point).');
    else if (!x.okI) {
      if (proche(i, x.U / x.P, 0.06)) msgs.push('Intensité : le rapport est inversé : I = P ÷ U (puissance divisée par tension).');
      else if (proche(i, x.P * x.U, 0.06)) msgs.push('Intensité : il faut diviser la puissance par la tension, pas les multiplier.');
      else msgs.push(`Intensité : I = P ÷ U = ${x.P} ÷ ${x.U}, en ampères. Votre valeur est ${i > x.I ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(t)) msgs.push('Durée : écrivez un nombre (virgule ou point).');
    else if (!x.okT) {
      if (isFinite(i) && !x.okI && proche(t, x.Qs / i, 0.06)) msgs.push('Durée : votre calcul est cohérent avec votre intensité, mais celle-ci n’est pas la bonne. Reprenez I = P ÷ U.');
      else if (proche(t, x.I / x.Qs, 0.06)) msgs.push('Durée : le rapport est inversé : Δt = Qs ÷ I (capacité divisée par intensité).');
      else if (proche(t, x.Qs * x.I, 0.06)) msgs.push('Durée : il faut diviser la capacité par l’intensité, pas les multiplier.');
      else if (proche(t, x.dt * 3600, 0.06)) msgs.push('Durée : cette valeur est en secondes ; l’énoncé demande des heures.');
      else msgs.push(`Durée : Δt = Qs ÷ I = ${nbf(x.Qs, 1)} ÷ I, en heures (ou Δt = E ÷ P avec E = Qs × U). Votre valeur est ${t > x.dt ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, msgs = [], e = lireNombre(x.reps.E), q = lireNombre(x.reps.Q);
    if (!isFinite(e)) msgs.push('Énergie : écrivez un nombre (virgule ou point).');
    else if (!x.okE) {
      if (proche(e, x.P / x.t, 0.06)) msgs.push('Énergie : il faut multiplier la puissance par la durée (E = P × Δt), pas les diviser.');
      else if (proche(e, x.E * 3600, 0.06)) msgs.push('Énergie : cette valeur est en joules ; l’énoncé demande des wattheures.');
      else msgs.push(`Énergie : E = P × Δt = ${x.P} × ${x.t}, en Wh (W × h). Votre valeur est ${e > x.E ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(q)) msgs.push('Capacité : écrivez un nombre (virgule ou point).');
    else if (!x.okQ) {
      if (isFinite(e) && !x.okE && proche(q, e / x.U, 0.06)) msgs.push('Capacité : votre calcul est cohérent avec votre énergie, mais celle-ci n’est pas la bonne. Reprenez E = P × Δt.');
      else if (proche(q, x.E * x.U, 0.06)) msgs.push('Capacité : il faut diviser l’énergie par la tension (Qs = E ÷ U), pas les multiplier.');
      else if (proche(q, x.P * x.t / 3600, 0.06)) msgs.push('Capacité : la durée est déjà en heures et la capacité en Ah : il ne faut pas convertir en secondes.');
      else msgs.push(`Capacité : Qs = E ÷ U (E : votre énergie, U = ${x.U} V), en Ah. Votre valeur est ${q > x.Qs ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'duree'
    ? `Intensité : I = P ÷ U = ${defi.P} ÷ ${defi.U} ≈ ${fmt2(defi.I)} A. Durée : Δt = Qs ÷ I = ${nbf(defi.Qs, 1)} ÷ ${fmt2(defi.I)} ≈ ${fmt2(defi.dt)} h. On retrouve Δt = E ÷ P = (${nbf(defi.Qs, 1)} × ${defi.U}) ÷ ${defi.P} = ${fmt2(defi.dt)} h. Un écart vient souvent d’un rapport inversé (Δt = Qs ÷ I) ou d’une intensité mal calculée.`
    : `Énergie : E = P × Δt = ${defi.P} × ${defi.t} = ${fmt2(defi.E)} Wh. Capacité minimale : Qs = E ÷ U = ${fmt2(defi.E)} ÷ ${defi.U} ≈ ${fmt2(defi.Qs)} Ah (en effet E = Qs × U).`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['duree', 'Durée de fonctionnement'], ['choix', 'Choisir une batterie']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'duree' ? 'Défi : durée de fonctionnement d’une batterie' : 'Défi : choisir une batterie'}</div>
      {defi.type === 'duree' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une batterie de tension <strong>U = {defi.U} V</strong> et de capacité <strong>Qs = {nbf(defi.Qs, 1)} Ah</strong> alimente un récepteur de puissance <strong>P = {defi.P} W</strong>. Calculez l’<strong>intensité I</strong> du courant débité (en A), puis la <strong>durée de fonctionnement Δt</strong> (en h). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>I (A) =</span>{champ('I', 'Intensité en ampères', defi.verifie && defi.okI)}
          <span>Δt (h) =</span>{champ('T', 'Durée de fonctionnement en heures', defi.verifie && defi.okT)}
        </div>
        <IndiceDefi cache={false}>I = P ÷ U (P en W, U en V, I en A). Puis Δt = Qs ÷ I (Qs en Ah, I en A, Δt en h). Vérification possible : Δt = E ÷ P avec E = Qs × U.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un récepteur de puissance <strong>P = {defi.P} W</strong> doit fonctionner <strong>{defi.t} h</strong> sans recharge, sur une batterie de tension <strong>U = {defi.U} V</strong>. Calculez l’<strong>énergie E</strong> nécessaire (en Wh), puis la <strong>capacité minimale Qs</strong> de la batterie (en Ah). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>E (Wh) =</span>{champ('E', 'Énergie nécessaire en wattheures', defi.verifie && defi.okE)}
          <span>Qs (Ah) =</span>{champ('Q', 'Capacité minimale en ampères-heures', defi.verifie && defi.okQ)}
        </div>
        <IndiceDefi cache={false}>E = P × Δt (W × h = Wh). Comme E = Qs × U, la capacité est Qs = E ÷ U (Wh ÷ V = Ah).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="bat-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'duree' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Tension constante</strong> : la tension de la batterie reste égale à sa valeur nominale pendant toute la décharge (en réalité elle baisse peu à peu).</li>
      <li><strong>Capacité indépendante du courant</strong> : un courant plus intense réduit en pratique la capacité utilisable ; ici ce n’est pas pris en compte.</li>
      <li><strong>Décharge complète possible</strong> : on suppose qu’on peut utiliser toute la capacité ; en pratique on évite de vider entièrement une batterie.</li>
      <li><strong>Récepteur parfait</strong> : il consomme exactement sa puissance P, avec une intensité constante ; la température est constante.</li>
      <li><strong>Valeurs inventées pour la simulation</strong> : les batteries proposées (12 V, 7,0 Ah ; 6 V, 4,5 Ah ; 3,7 V, 10 Ah ; pile de 1,5 V, 2,5 Ah ; 12 V, 2,0 Ah) ne sont pas des produits réels. Pour un vrai choix, on consulte la fiche technique du fabricant.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, réglages, mesures ----------
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Une batterie et un récepteur</div>
      <SceneBatterie fraction={fraction} courant={courant}/>
      {curseurT && <div style={{ marginTop: 8 }}>
        <Curseur nom="Temps écoulé" valeur={tCur} onChange={enExplore ? v => setTi(s => ({ ...s, t: v })) : setTG} min={0} max={tMax} pas={0.5} unite="h" decimales={1} couleur="#b91c1c"/>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 2, lineHeight: 1.5 }}>La jauge montre la charge restante de la batterie au bout de ce temps.</div>
      </div>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="bat-b" label="Batterie ou pile" valeur={ti.b} onChange={v => setTi(s => ({ ...s, b: v, t: 0 }))} options={M.BATTERIES.map(b => [b.id, b.nom])}/>
      <Sel id="bat-p" label="Puissance du récepteur" valeur={ti.P} onChange={v => setTi(s => ({ ...s, P: v, t: 0 }))} options={M.PUISSANCES_W.map(v => [v, `${v} W`])}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Augmentez la puissance du récepteur : l’intensité grandit et la batterie se vide plus vite.</div>
    </div>);
  const mesures = (enExplore || (enGuide && deja('energie'))) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs calculées pour la batterie et le récepteur choisis.</div>}
      <LigneMesure nom="Tension U" valeur={`${nbf(U, U % 1 ? 1 : 0)}${NB}V`}/>
      <LigneMesure nom="Capacité Qs" valeur={`${nbf(Qs, 1)}${NB}Ah`} couleur={COL.vert}/>
      {(enExplore || deja('joules')) && <LigneMesure nom="Énergie disponible E = Qs × U" valeur={`${gd(E)}${NB}Wh`} couleur={COL.orange}/>}
      {(enExplore || deja('intensite')) && <LigneMesure nom="Puissance du récepteur P" valeur={`${Pw}${NB}W`}/>}
      {(enExplore || deja('dureeL')) && <LigneMesure nom="Intensité I = P ÷ U" valeur={`${nbf(I, 2)}${NB}A`} couleur={COL.bleu}/>}
      {(enExplore || deja('double')) && <LigneMesure nom="Durée de fonctionnement" valeur={`${nbf(dtH, 1)}${NB}h`} couleur={COL.bleu}/>}
      {(enExplore || deja('double')) && <LigneMesure nom={`Charge restante après ${nbf(tCur, 1)} h`} valeur={`${nbf(restante, 2)}${NB}Ah`} couleur={restante > 0 ? COL.vert : COL.rouge}/>}
      {enExplore && <LigneMesure nom="Énergie restante" valeur={`${gd(restante * U)}${NB}Wh`}/>}
      {enExplore && <LigneMesure nom="État" valeur={restante > 0 ? 'en marche' : 'batterie vide'} couleur={restante > 0 ? COL.vert : COL.rouge}/>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Avec l’accumulateur de 12 V et 7,0 Ah, passez de 10 W à 25 W : par combien la durée est-elle divisée ?</li>
      <li>Comparez l’accumulateur de 3,7 V et 10 Ah à celui de 12 V et 7,0 Ah : lequel a la plus grande capacité ? Lequel a la plus grande énergie ?</li>
      <li>Comparez les deux accumulateurs de 12 V (7,0 Ah et 2,0 Ah) avec le même récepteur : le rapport des durées est-il celui des capacités ?</li>
      <li>Avec la pile de 1,5 V et 2,5 Ah, quelle est l’énergie disponible ? Pendant combien de temps alimente-t-elle un récepteur de 1 W ?</li>
      <li>Déplacez le curseur de temps jusqu’à la durée de fonctionnement : que devient la jauge ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Charge : Q = I × Δt ; 1 Ah = 3 600 C</li>
        <li>Énergie disponible : E = Qs × U (Ah × V = Wh) ; 1 Wh = 3 600 J</li>
        <li>Récepteur de puissance P : I = P ÷ U</li>
        <li>Durée de fonctionnement : Δt = Qs ÷ I = E ÷ P</li>
        <li>Pour comparer des batteries : comparer les énergies (Wh), pas seulement les capacités (Ah)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .bat-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .bat-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .bat-col { display: flex; flex-direction: column; gap: 12px; }
        .bat-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .bat-l1.cote .bat-carte { order: 2; } .bat-l1.cote .bat-main { order: 1; }
          .bat-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .bat-ex > * { grid-column: 1; }
          .bat-ex > .bat-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .bat-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .bat-in { animation: bat-fondu 0.35s ease-out; } @keyframes bat-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Batterie : énergie et durée</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une batterie est un <strong>réservoir d’énergie</strong>. On calcule sa <strong>capacité</strong> en coulombs, son <strong>énergie disponible</strong> (E = Qs × U) et sa <strong>durée de fonctionnement</strong> selon le récepteur.</div>
      {!enExplore && <div className={`bat-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="bat-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="bat-carte">{panneauHypo}</div>}
        <div className="bat-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'duree' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="bat-col">
            <div className="bat-in">{scene}</div>
            {mesures && <div className="bat-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <BatterieExplore ti={ti} setTi={setTi}/>
        <div style={{ margin: '12px 0' }}>
          <Section titre={`Réglages précis et mesures : ${bat.nom} · récepteur de ${ti.P} W`} ouvert={!!ouv.precis} onBascule={() => bascule('precis')}>
            <div className="bat-ex">
              {scene}
              <div className="bat-reg">{reglages}</div>
              {mesures}
            </div>
          </Section>
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
