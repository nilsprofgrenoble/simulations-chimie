import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./chaineModele";
import { QCM } from "./chaineQcm";
import { ChaineExplore } from "./ChaineExplore";
import { SceneChaine, SvgConvertisseur, SvgConservation, SvgRendement, SvgSerie, SvgUtile, SvgBilanChaine } from "./ChaineEnergieSchemas";

const SIM_ID = 233, CLE_GUIDE = 'chaine-guide-v1';
declarerDefis(SIM_ID, [['rendement', 'Rendement d’un convertisseur'], ['serie', 'Deux convertisseurs en série']]);

// ====================================================
//  SIM 233 — CHAÎNE ÉNERGÉTIQUE ET RENDEMENT D'UN CONVERTISSEUR (TSTL, enseignement PCM, partie « Énergie »).
//  Une seule idée : un convertisseur ne stocke pas d'énergie (reçue = utile + dissipée par transfert thermique) ; son rendement η = utile ÷ reçue est inférieur à 100 % ;
//  pour des convertisseurs en série, les rendements se multiplient.
//  Aucune situation du Moodle : moteur de treuil, lampe à LED, plaque de cuisson, chargeur de batterie (rendements inventés).
//  Capacités visées (jamais affichées) : schématiser une chaîne énergétique (réservoirs, convertisseurs) ; évaluer une énergie transférée ; exploiter la conservation de l'énergie pour un bilan, estimer l'énergie dissipée et calculer un rendement ; associer une dissipation d'énergie à un transfert thermique.
//  Modèle : chaineModele.js (test node). QCM : chaineQcm.js. Schémas : ChaineEnergieSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const gd = v => (v >= 1000 ? nbf(Math.round(v), 0) : v >= 100 ? nbf(v, 0) : v >= 10 ? nbf(v, 1) : nbf(v, 2));
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', violet: '#6d28d9' };
const P = M.PARCOURS;
const Er = <>E<sub>r</sub></>, Eu = <>E<sub>u</sub></>, Pr = <>P<sub>r</sub></>, Pu = <>P<sub>u</sub></>;

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
const pct = x => `${nbf(100 * x, 0)}${NB}%`;

// ====================================================
export function SimulationChaine() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('rendement');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ app: 'moteur', Pr: 60, dt: 5, amont: 'aucun' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['convertisseur', 'dissipe', 'bilan', 'rendement', 'puissance', 'limite', 'amont', 'serie', 'serieqcm', 'utile', 'lampe', 'fin'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const eta0 = P.Eu / P.Er;

  const ETAPES = [
    { id: 'convertisseur', titre: 'Réservoirs et convertisseurs', focus: ['scene'],
      texte: <>Un moteur de treuil soulève une charge. Il est alimenté en électricité par une <strong>source</strong>. Dans une <strong>chaîne énergétique</strong>, on dessine un <strong>réservoir</strong> (la source, la charge) dans un <strong>rectangle</strong> : son énergie stockée peut varier. On dessine un <strong>convertisseur</strong> (le moteur) dans une <strong>ellipse</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi le moteur est-il un convertisseur (ellipse) et non un réservoir (rectangle) ?', ...QCM.convertisseur,
        expl: 'Un convertisseur ne stocke pas d’énergie : son énergie stockée ne varie pas, donc il cède autant d’énergie qu’il en reçoit. Un réservoir, lui, voit son énergie stockée varier.', indice: 'Que dire de l’énergie stockée par un appareil qui reçoit et cède de l’énergie sans la garder ?' } },
    { id: 'dissipe', titre: 'Énergie utile et énergie dissipée', focus: ['scene', 'mesures'],
      texte: <>Le moteur reçoit de l’énergie électrique : <strong>{Er} = {P.Er} J</strong> (énergie <strong>reçue</strong>). Il cède à la charge un travail mécanique <strong>{Eu} = {P.Eu} J</strong> : c’est l’énergie <strong>utile</strong>, celle pour laquelle le moteur est conçu. Le reste de l’énergie reçue est appelé énergie <strong>dissipée</strong>.</>,
      tache: { type: 'qcm', q: 'Sous quelle forme le reste de l’énergie est-il cédé ?', ...QCM.dissipe,
        expl: 'L’énergie dissipée est cédée par transfert thermique : le moteur chauffe et cède de la chaleur à l’air ambiant. Elle ne disparaît pas.', indice: 'Un moteur qui a fonctionné un moment est chaud : quel type de transfert d’énergie cela traduit-il ?' } },
    { id: 'bilan', titre: 'Le bilan d’énergie', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : réservoir et convertisseur',
      retenir: <>
        <SvgConvertisseur/>
        <ul style={puces}>
          <li>Un <strong>réservoir</strong> (rectangle) stocke de l’énergie, qui peut varier. Un <strong>convertisseur</strong> (ellipse) n’en stocke pas : <strong>reçu = cédé</strong>.</li>
          <li>Exemple : une batterie qui se charge est un réservoir ; un moteur est un convertisseur.</li>
          <li>Moyen de s’en souvenir : <strong>« rectangle qui garde, ellipse qui transforme »</strong>.</li>
        </ul></>,
      texte: <>Un convertisseur ne stocke pas d’énergie : l’énergie qu’il reçoit est égale à l’énergie qu’il cède. Il cède l’énergie utile {Eu} et l’énergie dissipée <strong>Q</strong> par transfert thermique. Rappel : {Er} = {P.Er} J et {Eu} = {P.Eu} J.</>,
      tache: { type: 'num', q: 'Énergie Q dissipée par le moteur, en joules (J)', unite: 'J', vrai: P.Er - P.Eu, tol: 0.03, affiche: v => String(Math.round(v)), cs: 3,
        pieges: [[P.Er + P.Eu, 'Il faut soustraire l’énergie utile à l’énergie reçue, pas les additionner.'], [P.Eu / P.Er, 'Cette valeur est le rapport utile ÷ reçue ; l’énergie dissipée est la différence reçue − utile.']],
        calcul: () => [`reçue = utile + dissipée, donc Q = ${P.Er} − ${P.Eu} = ${P.Er - P.Eu} J.`],
        expl: `Q = ${P.Er} − ${P.Eu} = ${P.Er - P.Eu} J.`, indice: 'L’énergie reçue se répartit entre l’énergie utile et l’énergie dissipée : Q = reçue − utile.' } },
    { id: 'rendement', titre: 'Le rendement', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : la conservation de l’énergie',
      retenir: <>
        <SvgConservation/>
        <ul style={puces}>
          <li>Pour un convertisseur : <strong>reçue = utile + dissipée</strong> (en joules).</li>
          <li>Exemple : 500 J reçus, 350 J utiles, donc 150 J dissipés.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui entre ressort, utile ou en chaleur »</strong>.</li>
        </ul></>,
      texte: <>Le <strong>rendement η</strong> d’un convertisseur est la part de l’énergie reçue qui devient utile : <strong>η = {Eu} ÷ {Er}</strong>. C’est un nombre sans unité, souvent exprimé en pourcentage. Rappel : {Er} = {P.Er} J, {Eu} = {P.Eu} J, Q = {P.Er - P.Eu} J.</>,
      tache: { type: 'num', q: 'Rendement η du moteur, en pourcentage (%)', unite: '%', vrai: 100 * eta0, tol: 0.03, affiche: v => String(Math.round(v)), cs: 2,
        pieges: [[100 * (P.Er - P.Eu) / P.Er, 'Cette valeur est la part dissipée (Q ÷ reçue) ; le rendement compare l’énergie utile à l’énergie reçue.'], [100 * P.Er / P.Eu, 'Le rapport est inversé : η = utile ÷ reçue, et il ne dépasse jamais 100 %.'], [eta0, 'Le rendement est demandé en pourcentage : multipliez le rapport par 100.']],
        calcul: () => [`η = Eu ÷ Er = ${P.Eu} ÷ ${P.Er} = ${nbf(eta0, 2)}, soit ${nbf(100 * eta0, 0)} %.`],
        expl: `η = ${P.Eu} ÷ ${P.Er} = ${nbf(eta0, 2)} = ${nbf(100 * eta0, 0)} %.`, indice: 'η = énergie utile ÷ énergie reçue, puis multipliez par 100 pour un pourcentage.' } },
    { id: 'puissance', titre: 'Le rendement avec des puissances', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : le rendement',
      retenir: <>
        <SvgRendement/>
        <ul style={puces}>
          <li>Le rendement est <strong>η = utile ÷ reçue</strong>, toujours compris entre 0 et 100 %.</li>
          <li>Exemple : 350 J utiles pour 500 J reçus donnent η = 70 %.</li>
          <li>Moyen de s’en souvenir : <strong>« combien de ce que j’ai mis est utile ? »</strong>.</li>
        </ul></>,
      texte: <>Le rendement se calcule aussi avec les puissances : <strong>η = {Pu} ÷ {Pr}</strong> (puissance utile sur puissance reçue). Le moteur a un rendement <strong>η = {nbf(100 * eta0, 0)} %</strong>. Il reçoit maintenant une puissance électrique <strong>{Pr} = {P.Pr} W</strong>.</>,
      tache: { type: 'num', q: 'Puissance utile Pu cédée par le moteur, en watts (W)', unite: 'W', vrai: M.puissanceUtile(P.Pr, eta0), tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[P.Pr * (1 - eta0), 'Cette valeur est la puissance dissipée ; la puissance utile est la part η de la puissance reçue.'], [P.Pr / eta0, 'Il faut multiplier la puissance reçue par le rendement, pas la diviser.']],
        calcul: () => [`Pu = η × Pr = ${nbf(eta0, 2)} × ${P.Pr} = ${nbf(P.Pr * eta0, 0)} W.`],
        expl: `Pu = ${nbf(eta0, 2)} × ${P.Pr} = ${nbf(P.Pr * eta0, 0)} W.`, indice: 'Pu = η × Pr, avec η = 0,75 et Pr = 120 W.' } },
    { id: 'limite', titre: 'Un rendement de 110 % ?', focus: ['scene'],
      texte: <>Un fabricant annonce, pour un moteur de treuil de ce type, un rendement de 110 %.</>,
      tache: { type: 'qcm', q: 'Que peut-on en conclure ?', ...QCM.limite,
        expl: 'D’après la conservation de l’énergie, reçue = utile + dissipée : l’énergie utile ne peut pas dépasser l’énergie reçue, donc η ≤ 100 %. Une valeur de 110 % est impossible.', indice: 'Reçue = utile + dissipée : l’énergie utile peut-elle être plus grande que l’énergie reçue ?' } },
    { id: 'amont', titre: 'Quelle énergie faut-il fournir ?', focus: ['scene'],
      texte: <>Pour soulever une charge, on a besoin d’une énergie utile <strong>{Eu} = {P.EuAmont} J</strong>. Le moteur a un rendement <strong>η = {nbf(100 * eta0, 0)} %</strong> : il faut lui fournir plus d’énergie que l’énergie utile.</>,
      tache: { type: 'num', q: 'Énergie électrique Er à fournir au moteur, en joules (J)', unite: 'J', vrai: M.energieRecue(P.EuAmont, eta0), tol: 0.03, affiche: v => String(Math.round(v)), cs: 3,
        pieges: [[P.EuAmont * eta0, 'Il faut diviser l’énergie utile par le rendement, pas la multiplier : l’énergie à fournir est plus grande que l’énergie utile.'], [P.EuAmont, 'Cette valeur est l’énergie utile ; une partie de l’énergie fournie est dissipée, donc il faut fournir davantage.']],
        calcul: () => [`η = Eu ÷ Er, donc Er = Eu ÷ η = ${P.EuAmont} ÷ ${nbf(eta0, 2)} = ${nbf(P.EuAmont / eta0, 0)} J.`],
        expl: `Er = ${P.EuAmont} ÷ ${nbf(eta0, 2)} = ${nbf(P.EuAmont / eta0, 0)} J.`, indice: 'Partez de η = Eu ÷ Er et isolez Er : Er = Eu ÷ η.' } },
    { id: 'serie', titre: 'Deux convertisseurs en série', focus: ['scene'],
      texte: <>Le moteur est alimenté par un <strong>chargeur de batterie</strong>, de rendement <strong>{nbf(100 * P.etaCh, 0)} %</strong>. Les deux convertisseurs sont <strong>en série</strong> : l’énergie utile du chargeur est l’énergie reçue par le moteur, dont le rendement est <strong>{nbf(100 * P.etaMo, 0)} %</strong>.</>,
      tache: { type: 'num', q: 'Rendement global de la chaîne chargeur + moteur, en pourcentage (%)', unite: '%', vrai: 100 * M.rendementSerie(P.etaCh, P.etaMo), tol: 0.03, affiche: v => String(Math.round(v)), cs: 2,
        pieges: [[100 * (P.etaCh + P.etaMo) / 2, 'Les rendements ne se moyennent pas : ils se multiplient.'], [100 * (P.etaCh + P.etaMo), 'Les rendements ne s’additionnent pas (on dépasserait 100 %) : ils se multiplient.']],
        calcul: () => [`η = η₁ × η₂ = ${nbf(P.etaCh, 2)} × ${nbf(P.etaMo, 2)} = ${nbf(P.etaCh * P.etaMo, 2)}, soit ${nbf(100 * P.etaCh * P.etaMo, 0)} %.`],
        expl: `η = ${nbf(P.etaCh, 2)} × ${nbf(P.etaMo, 2)} = ${nbf(P.etaCh * P.etaMo, 2)} = ${nbf(100 * P.etaCh * P.etaMo, 0)} %.`, indice: 'Le chargeur ne transmet que 80 % de l’énergie ; le moteur en utilise 75 % : multipliez les deux rendements.' } },
    { id: 'serieqcm', titre: 'Chaque étape perd de l’énergie', focus: ['scene'],
      retenirTitre: 'À retenir : convertisseurs en série',
      retenir: <>
        <SvgSerie/>
        <ul style={puces}>
          <li>Pour des convertisseurs <strong>en série</strong>, les rendements se <strong>multiplient</strong> : η = η₁ × η₂ × …</li>
          <li>Exemple : 90 % puis 50 % donnent 0,90 × 0,50 = 45 %.</li>
          <li>Moyen de s’en souvenir : <strong>« chaque étape en perd un morceau »</strong>.</li>
        </ul></>,
      texte: <>Vous avez trouvé un rendement global de {nbf(100 * P.etaCh * P.etaMo, 0)} % pour un chargeur de {nbf(100 * P.etaCh, 0)} % suivi d’un moteur de {nbf(100 * P.etaMo, 0)} %.</>,
      tache: { type: 'qcm', q: 'Comment ce rendement global se compare-t-il aux deux rendements ?', ...QCM.serie,
        expl: 'Chaque convertisseur dissipe une partie de l’énergie qu’il reçoit : le rendement de la chaîne est le produit des rendements, donc plus petit que chacun d’eux.', indice: 'Un produit de deux nombres compris entre 0 et 1 est plus petit ou plus grand que chacun d’eux ?' } },
    { id: 'utile', titre: 'Utile ou dissipée ?', focus: ['scene'],
      texte: <>L’énergie <strong>utile</strong> dépend de l’appareil : c’est le transfert pour lequel il est conçu. Une <strong>plaque de cuisson</strong> reçoit de l’énergie électrique ; elle cède de la chaleur à la casserole posée dessus et à l’air de la cuisine.</>,
      tache: { type: 'qcm', q: 'Quel est le transfert d’énergie utile pour une plaque de cuisson ?', ...QCM.utile,
        expl: 'L’énergie utile est celle pour laquelle l’appareil est conçu : pour une plaque, c’est le transfert thermique cédé à la casserole. Celui cédé à l’air de la cuisine est dissipé.', indice: 'À quoi sert une plaque de cuisson ? Quel transfert répond à ce besoin ?' } },
    { id: 'lampe', titre: 'Une lampe à LED', focus: ['scene'],
      retenirTitre: 'À retenir : énergie utile',
      retenir: <>
        <SvgUtile/>
        <ul style={puces}>
          <li>L’énergie <strong>utile</strong> est celle pour laquelle l’appareil est conçu ; l’énergie <strong>dissipée</strong> est un transfert thermique.</li>
          <li>Exemple : lampe (lumière), moteur (travail mécanique), plaque (chaleur utile).</li>
          <li>Moyen de s’en souvenir : <strong>« utile selon l’appareil, dissipée en chaleur »</strong>.</li>
        </ul></>,
      texte: <>Une lampe à LED reçoit une puissance électrique <strong>{Pr} = {P.Pled} W</strong>. Son rendement est <strong>η = {nbf(100 * P.etaLed, 0)} %</strong> : sa puissance utile est la puissance lumineuse. La puissance dissipée est cédée à l’air par transfert thermique : la lampe chauffe.</>,
      tache: { type: 'num', q: 'Puissance dissipée par la lampe, en watts (W)', unite: 'W', vrai: P.Pled * (1 - P.etaLed), tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.Pled * P.etaLed, 'Cette valeur est la puissance lumineuse utile ; la puissance dissipée est le reste (reçue − utile).'], [P.Pled / P.etaLed, 'Il faut multiplier la puissance reçue par la part dissipée (1 − η), pas la diviser par η.']],
        calcul: () => [`Pu = η × Pr = ${nbf(P.etaLed, 2)} × ${P.Pled} = ${nbf(P.Pled * P.etaLed, 1)} W`, `dissipée = reçue − utile = ${P.Pled} − ${nbf(P.Pled * P.etaLed, 1)} = ${nbf(P.Pled * (1 - P.etaLed), 1)} W.`],
        expl: `Pu = ${nbf(P.etaLed, 2)} × ${P.Pled} = ${nbf(P.Pled * P.etaLed, 1)} W ; dissipée = ${P.Pled} − ${nbf(P.Pled * P.etaLed, 1)} = ${nbf(P.Pled * (1 - P.etaLed), 1)} W.`, indice: 'Calculez d’abord la puissance utile (η × Pr), puis soustrayez-la à la puissance reçue.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : bilan',
      retenir: <>
        <SvgBilanChaine/>
        <ul style={puces}>
          <li><strong>Reçue = utile + dissipée</strong> ; η = utile ÷ reçue ; en série, η = η₁ × η₂.</li>
          <li>Exemple : 500 J reçus, 350 J utiles, 150 J dissipés : η = 70 %.</li>
          <li>Moyen de s’en souvenir : <strong>« l’énergie se conserve, le rendement ne dépasse jamais 100 % »</strong>.</li>
        </ul></>,
      texte: <>Vous savez qu’un convertisseur ne stocke pas d’énergie, que l’énergie dissipée est cédée par transfert thermique, que le rendement vaut utile ÷ reçue, et que les rendements se multiplient en série. Explorez d’autres appareils, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- scène et mesures du parcours ----------
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const sceneGuide = (() => {
    if (idEtape === 'serie' || idEtape === 'serieqcm') return { emax: 1, conv: [{ nom: 'chargeur', ein: 1, eout: P.etaCh }, { nom: 'moteur', ein: P.etaCh, eout: P.etaCh * P.etaMo }] };
    if (idEtape === 'utile') return { emax: 1, conv: [{ nom: 'plaque', ein: 1, eout: 0.65 }] };
    if (idEtape === 'lampe') return { emax: 1, conv: [{ nom: 'LED', ein: 1, eout: P.etaLed }] };
    return { emax: 1, conv: [{ nom: 'moteur', ein: 1, eout: eta0 }] };
  })();

  // ---------- état de l'exploration ----------
  const app1 = M.APPAREILS.find(a => a.id === ti.app), app2 = ti.amont === 'aucun' ? null : M.APPAREILS.find(a => a.id === ti.amont);
  const etas = app2 ? [app2.eta, app1.eta] : [app1.eta];            // l'appareil en amont est placé en premier
  const noms = app2 ? [app2.nom, app1.nom] : [app1.nom];
  const etaG = M.rendementSerie(...etas), PrX = ti.Pr, PuX = PrX * etaG, PdX = PrX - PuX, dtS = ti.dt * 60;
  const convX = etas.map((e, i) => ({ nom: ['moteur', 'LED', 'plaque', 'chargeur'][M.APPAREILS.findIndex(a => a.nom === noms[i])], ein: M.rendementSerie(...etas.slice(0, i)), eout: M.rendementSerie(...etas.slice(0, i + 1)) }));
  const kJ = v => `${nbf(v / 1000, v >= 10000 ? 1 : 2)}${NB}kJ`;

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'rendement' ? { ...M.tirageDefiA(), reps: { h: '', Q: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { h: '', E: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'rendement') {
      const h = lireNombre(defi.reps.h), q = lireNombre(defi.reps.Q);
      const okH = isFinite(h) && proche(h, defi.pct, 0.06), okQ = isFinite(q) && proche(q, defi.Q, 0.08);
      setDefi(x => ({ ...x, verifie: true, ok: okH && okQ, okH, okQ })); noterA(okH && okQ);
    } else {
      const h = lireNombre(defi.reps.h), e = lireNombre(defi.reps.E);
      const okH = isFinite(h) && proche(h, defi.pctT, 0.06), okE = isFinite(e) && proche(e, defi.Er, 0.1);
      setDefi(x => ({ ...x, verifie: true, ok: okH && okE, okH, okE })); noterB(okH && okE);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('cha-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  const diagnosticA = () => {
    const x = defi, msgs = [], h = lireNombre(x.reps.h), q = lireNombre(x.reps.Q), partD = 100 * (x.Pr - x.Pu) / x.Pr;
    if (!isFinite(h)) msgs.push('Rendement : écrivez un nombre (virgule ou point).');
    else if (!x.okH) {
      if (proche(h, partD, 0.06)) msgs.push('Rendement : cette valeur est la part dissipée ; le rendement est la puissance utile divisée par la puissance reçue.');
      else if (proche(h, x.eta, 0.06)) msgs.push('Rendement : multipliez le rapport par 100 pour l’avoir en pourcentage.');
      else if (proche(h, 100 * x.Pr / x.Pu, 0.06)) msgs.push('Rendement : le rapport est inversé (η = utile ÷ reçue, jamais plus de 100 %).');
      else msgs.push(`Rendement : η = P utile ÷ P reçue = ${x.Pu} ÷ ${x.Pr}, en pourcentage. Votre valeur est ${h > x.pct ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(q)) msgs.push('Énergie dissipée : écrivez un nombre (virgule ou point).');
    else if (!x.okQ) {
      if (proche(q, (x.Pr - x.Pu) * x.dtMin / 1000, 0.08)) msgs.push('Énergie dissipée : la durée est restée en minutes ; convertissez-la en secondes (1 min = 60 s).');
      else if (proche(q, (x.Pr - x.Pu) * x.dtMin * 60, 0.08)) msgs.push('Énergie dissipée : cette valeur est en joules ; le résultat est demandé en kilojoules (1 kJ = 1 000 J).');
      else if (proche(q, x.Pu * x.dtMin * 60 / 1000, 0.08)) msgs.push('Énergie dissipée : cette valeur est l’énergie utile ; l’énergie dissipée correspond à la puissance dissipée (reçue − utile).');
      else if (proche(q, x.Pr * x.dtMin * 60 / 1000, 0.08)) msgs.push('Énergie dissipée : cette valeur est l’énergie reçue ; il faut retirer la part utile.');
      else msgs.push(`Énergie dissipée : (P reçue − P utile) × Δt avec Δt = ${x.dtMin} min = ${x.dtMin * 60} s, en kJ. Votre valeur est ${q > x.Q ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, msgs = [], h = lireNombre(x.reps.h), e = lireNombre(x.reps.E);
    if (!isFinite(h)) msgs.push('Rendement global : écrivez un nombre (virgule ou point).');
    else if (!x.okH) {
      if (proche(h, 50 * (x.eta1 + x.eta2), 0.06)) msgs.push('Rendement global : en série, les rendements ne se moyennent pas, ils se multiplient.');
      else if (proche(h, 100 * (x.eta1 + x.eta2), 0.06)) msgs.push('Rendement global : les rendements ne s’additionnent pas, ils se multiplient.');
      else if (proche(h, x.etaT, 0.06)) msgs.push('Rendement global : multipliez par 100 pour l’avoir en pourcentage.');
      else msgs.push(`Rendement global : η = η₁ × η₂ = ${nbf(x.eta1, 2)} × ${nbf(x.eta2, 2)}, en pourcentage. Votre valeur est ${h > x.pctT ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(e)) msgs.push('Énergie à fournir : écrivez un nombre (virgule ou point).');
    else if (!x.okE) {
      if (proche(e, x.Eu * x.etaT, 0.1)) msgs.push('Énergie à fournir : il faut diviser l’énergie utile par le rendement, pas la multiplier ; il faut fournir plus que l’énergie utile.');
      else if (proche(e, x.Eu / x.eta1, 0.1) || proche(e, x.Eu / x.eta2, 0.1)) msgs.push('Énergie à fournir : vous n’avez tenu compte que d’un seul convertisseur ; utilisez le rendement global de la chaîne.');
      else if (isFinite(h) && !x.okH && proche(e, x.Eu / (h / 100), 0.1)) msgs.push('Énergie à fournir : votre calcul est cohérent avec votre rendement global, mais celui-ci n’est pas le bon.');
      else msgs.push(`Énergie à fournir : énergie utile ÷ rendement global = ${x.Eu} ÷ ${nbf(x.etaT, 2)}, en kJ. Votre valeur est ${e > x.Er ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'rendement'
    ? `Rendement : η = P utile ÷ P reçue = ${defi.Pu} ÷ ${defi.Pr} = ${fmt2(defi.eta)}, soit ${fmt2(defi.pct)} %. Puissance dissipée : ${defi.Pr} − ${defi.Pu} = ${fmt2(defi.Pr - defi.Pu)} W. Énergie dissipée : Q = ${fmt2(defi.Pr - defi.Pu)} × ${defi.dtMin * 60} s ≈ ${fmt2(defi.Q)} kJ (Δt = ${defi.dtMin} min = ${defi.dtMin * 60} s). Un écart vient souvent de la durée laissée en minutes.`
    : `Rendement global : η = η₁ × η₂ = ${nbf(defi.eta1, 2)} × ${nbf(defi.eta2, 2)} = ${nbf(defi.etaT, 3).replace(/0$/, '')}, soit ${fmt2(defi.pctT)} %. Énergie à fournir : Er = Eu ÷ η = ${defi.Eu} ÷ ${nbf(defi.etaT, 3).replace(/0$/, '')} ≈ ${fmt2(defi.Er)} kJ.`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['rendement', 'Rendement d’un convertisseur'], ['serie', 'Deux convertisseurs en série']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'rendement' ? 'Défi : rendement d’un convertisseur' : 'Défi : deux convertisseurs en série'}</div>
      {defi.type === 'rendement' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un convertisseur reçoit une puissance <strong>{defi.Pr} W</strong> et cède une puissance utile de <strong>{defi.Pu} W</strong>, pendant <strong>{defi.dtMin} minutes</strong>. Calculez son <strong>rendement</strong> (en %) et l’<strong>énergie dissipée</strong> par transfert thermique (en kJ). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>η (%) =</span>{champ('h', 'Rendement en pourcentage', defi.verifie && defi.okH)}
          <span>Q (kJ) =</span>{champ('Q', 'Énergie dissipée en kilojoules', defi.verifie && defi.okQ)}
        </div>
        <IndiceDefi cache={false}>η = puissance utile ÷ puissance reçue. Énergie dissipée = (puissance reçue − puissance utile) × durée, avec la durée en secondes (1 min = 60 s) ; 1 kJ = 1 000 J.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un chargeur de rendement <strong>{nbf(100 * defi.eta1, 0)} %</strong> alimente un moteur de rendement <strong>{nbf(100 * defi.eta2, 0)} %</strong> (en série). On veut obtenir <strong>{defi.Eu} kJ</strong> d’énergie utile à la sortie du moteur. Calculez le <strong>rendement global</strong> (en %) et l’<strong>énergie à fournir</strong> au chargeur (en kJ). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>η global (%) =</span>{champ('h', 'Rendement global en pourcentage', defi.verifie && defi.okH)}
          <span>énergie à fournir (kJ) =</span>{champ('E', 'Énergie à fournir en kilojoules', defi.verifie && defi.okE)}
        </div>
        <IndiceDefi cache={false}>En série, les rendements se multiplient : η = η₁ × η₂. L’énergie à fournir est l’énergie utile divisée par le rendement global.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cha-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'rendement' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Convertisseur idéalisé</strong> : il ne stocke pas d’énergie (reçu = utile + dissipée), en régime permanent.</li>
      <li><strong>Énergie dissipée = transfert thermique</strong> cédé à l’extérieur : on ne détaille pas par où (conduction, convection, rayonnement).</li>
      <li><strong>Rendement constant</strong> : en réalité, il dépend de la puissance et des conditions d’utilisation ; ici il ne change pas.</li>
      <li><strong>Une seule énergie utile</strong> par appareil (la même quelle que soit la situation) : par exemple, pour une plaque, la chaleur cédée à la casserole.</li>
      <li><strong>Valeurs inventées</strong> : les rendements des appareils (moteur 75 %, LED 30 %, plaque 65 %, chargeur 80 %) ne sont pas des mesures et varient beaucoup d’un modèle à l’autre.</li>
      <li><strong>Réservoirs</strong> (source, batterie, charge) : la simulation ne calcule pas la variation de leur énergie stockée.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Chaîne énergétique' : 'Une chaîne énergétique'}</div>
      <SceneChaine conv={enExplore ? convX : sceneGuide.conv} emax={enExplore ? 1 : sceneGuide.emax}/>
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="cha-a" label="Appareil" valeur={ti.app} onChange={v => setTi(s => ({ ...s, app: v }))} options={M.APPAREILS.map(a => [a.id, `${a.nom} (η = ${nbf(100 * a.eta, 0)} %)`])}/>
      <Sel id="cha-p" label="Puissance reçue" valeur={ti.Pr} onChange={v => setTi(s => ({ ...s, Pr: Number(v) }))} options={M.PUISSANCES.map(v => [v, `${v} W`])}/>
      <Sel id="cha-t" label="Durée de fonctionnement" valeur={ti.dt} onChange={v => setTi(s => ({ ...s, dt: Number(v) }))} options={M.DUREES.map(v => [v, `${v} min`])}/>
      <Sel id="cha-c" label="Convertisseur en série, placé avant" valeur={ti.amont} onChange={v => setTi(s => ({ ...s, amont: v }))} options={[['aucun', 'aucun'], ...M.APPAREILS.filter(a => a.id !== ti.app).map(a => [a.id, `${a.nom} (η = ${nbf(100 * a.eta, 0)} %)`])]}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Les flèches ont une épaisseur proportionnelle à l’énergie transférée. Ajoutez un convertisseur en série : le rendement global baisse.</div>
    </div>);
  const mesures = (enExplore || (enGuide && deja('dissipe'))) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Bilan du moteur de treuil'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs calculées pour les réglages choisis (énergies pendant {ti.dt} min).</div>}
      {enExplore ? <>
        <LigneMesure nom="Puissance reçue" valeur={`${PrX}${NB}W`}/>
        <LigneMesure nom="Puissance utile" valeur={`${gd(PuX)}${NB}W`} couleur={COL.vert}/>
        <LigneMesure nom="Puissance dissipée (chaleur)" valeur={`${gd(PdX)}${NB}W`} couleur={COL.rouge}/>
        <LigneMesure nom="Rendement global η" valeur={`${nbf(100 * etaG, etaG < 0.1 || (100 * etaG) % 1 ? 1 : 0)}${NB}%`} couleur={COL.violet}/>
        <LigneMesure nom="Énergie reçue" valeur={kJ(PrX * dtS)}/>
        <LigneMesure nom="Énergie utile" valeur={kJ(PuX * dtS)} couleur={COL.vert}/>
        <LigneMesure nom="Énergie dissipée" valeur={kJ(PdX * dtS)} couleur={COL.rouge}/>
      </> : <>
        <LigneMesure nom="Énergie reçue" valeur={`${P.Er}${NB}J`}/>
        <LigneMesure nom="Énergie utile" valeur={`${P.Eu}${NB}J`} couleur={COL.vert}/>
        {deja('rendement') && <LigneMesure nom="Énergie dissipée" valeur={`${P.Er - P.Eu}${NB}J`} couleur={COL.rouge}/>}
        {deja('puissance') && <LigneMesure nom="Rendement η" valeur={`${nbf(100 * eta0, 0)}${NB}%`} couleur={COL.violet}/>}
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Choisissez le moteur de treuil et la LED, avec la même puissance reçue : lequel dissipe le plus de chaleur ?</li>
      <li>Ajoutez le chargeur de batterie devant la plaque de cuisson : que devient le rendement global ?</li>
      <li>Doublez la durée : quelles grandeurs changent, quelles grandeurs ne changent pas ?</li>
      <li>Trouvez une combinaison de deux convertisseurs dont le rendement global est inférieur à 30 %.</li>
      <li>Le rendement global peut-il dépasser le plus petit des rendements ? Essayez plusieurs combinaisons.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Un convertisseur ne stocke pas d’énergie : reçue = utile + dissipée</li>
        <li>L’énergie dissipée est cédée par transfert thermique</li>
        <li>Rendement : η = utile ÷ reçue (énergies ou puissances), toujours ≤ 100 %</li>
        <li>Énergie à fournir : reçue = utile ÷ η</li>
        <li>En série, les rendements se multiplient : η = η₁ × η₂</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cha-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cha-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cha-col { display: flex; flex-direction: column; gap: 12px; }
        .cha-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .cha-l1.cote .cha-carte { order: 2; } .cha-l1.cote .cha-main { order: 1; }
          .cha-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .cha-ex > * { grid-column: 1; }
          .cha-ex > .cha-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .cha-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cha-in { animation: cha-fondu 0.35s ease-out; } @keyframes cha-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chaîne énergétique et rendement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>convertisseur</strong> ne stocke pas d’énergie : il cède l’énergie <strong>utile</strong> et dissipe le reste par <strong>transfert thermique</strong>. Son <strong>rendement</strong> compare l’utile à l’énergie reçue.</div>
      {!enExplore && <div className={`cha-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="cha-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="cha-carte">{panneauHypo}</div>}
        <div className="cha-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'rendement' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="cha-col">
            <div className="cha-in">{scene}</div>
            {mesures && <div className="cha-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <ChaineExplore ti={ti} setTi={setTi}/>
        <div style={{ margin: '12px 0' }}>
          <Section titre={`Réglages précis et mesures : ${app1.nom} · ${ti.Pr} W · ${ti.dt} min${app2 ? ` · après ${app2.nom}` : ''}`} ouvert={!!ouv.precis} onBascule={() => bascule('precis')}>
            <div className="cha-ex">
              {scene}
              <div className="cha-reg">{reglages}</div>
              {mesures}
            </div>
          </Section>
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
