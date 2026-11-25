import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./transfertsThermModele";
import { QCM_PARCOURS as Q } from "./tthQcm";
import { SceneSituation, SceneParoi, GrapheFlux, SvgCarteModes, SvgCarteFlux, SvgCarteR, SvgCarteBilan } from "./tthSchemas";

const SIM_ID = 235, CLE_GUIDE = 'transferts-therm-tg-guide-v1';
declarerDefis(SIM_ID, [['paroi', 'Perte à travers une paroi'], ['mesure', 'Mesurer une résistance thermique']]);

// ====================================================
// SIM 235 — TRANSFERTS THERMIQUES : MODES, FLUX ET RÉSISTANCE THERMIQUE
//  (TG spé PC, « L'énergie : conversions et transferts », « Effectuer des bilans d'énergie sur un système : transferts thermiques »).
//  Capacités visées (jamais affichées à l'élève) : distinguer conduction, convection, rayonnement ; prévoir le sens d'un transfert thermique ;
//  exploiter le flux thermique φ = Q / Δt ; exploiter φ = ΔT / Rth avec Rth donnée (régime permanent, paroi plane).
//  Modèle : transfertsThermModele.js (test : transfertsThermModele.test.mjs).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const BLEU = '#0369a1';
const IDS = ['conduction', 'convection', 'rayonnement', 'flux', 'sens', 'resistance', 'inverse', 'prevoir', 'energie', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));

// ---------- formules (MathML) ----------
const sur = (a, b) => <mfrac>{a}{b}</mfrac>;
const Rth = <msub><mi>R</mi><mtext>th</mtext></msub>;
const FFlux = <Formule><mi>φ</mi><mo>=</mo>{sur(<mi>Q</mi>, <mrow><mi>Δ</mi><mi>t</mi></mrow>)}</Formule>;
const FR = <Formule><mi>φ</mi><mo>=</mo>{sur(<mrow><mi>Δ</mi><mi>T</mi></mrow>, Rth)}</Formule>;
const FE = <Formule><mi>E</mi><mo>=</mo><mi>φ</mi><mo>×</mo><mi>Δ</mi><mi>t</mi></Formule>;
const eFlux = <FormuleEnLigne><mi>φ</mi><mo>=</mo>{sur(<mi>Q</mi>, <mrow><mi>Δ</mi><mi>t</mi></mrow>)}</FormuleEnLigne>;
const eR = <FormuleEnLigne><mi>φ</mi><mo>=</mo>{sur(<mrow><mi>Δ</mi><mi>T</mi></mrow>, Rth)}</FormuleEnLigne>;
const eRinv = <FormuleEnLigne>{Rth}<mo>=</mo>{sur(<mrow><mi>Δ</mi><mi>T</mi></mrow>, <mi>φ</mi>)}</FormuleEnLigne>;
const eE = <FormuleEnLigne><mi>E</mi><mo>=</mo><mi>φ</mi><mo>×</mo><mi>Δ</mi><mi>t</mi></FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// contrôle d'une grandeur : curseur + boutons − / + + rétablir
function Controle({ nom, valeur, min, max, pas, onChange, texte, retablir = 'Rétablir', onRetablir }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  const dec = Math.max(0, -Math.floor(Math.log10(pas))), arr = x => Math.max(min, Math.min(max, Number(x.toFixed(dec + 1))));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 2, fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt, textAlign: 'right', whiteSpace: 'nowrap' }}>{avecIndices(texte)}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label={`Diminuer : ${nom}`} onClick={() => onChange(arr(valeur - pas))} style={btn}>−</button>
        <input type="range" min={min} max={max} step={pas} value={valeur} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label={`Augmenter : ${nom}`} onClick={() => onChange(arr(valeur + pas))} style={btn}>+</button>
      </div>
      <div style={{ marginTop: 6 }}><button onClick={onRetablir} style={stylePetitBouton(false)}><Pic n="refresh"/>{retablir}</button></div>
    </div>);
}

export function SimulationTransfertsThermiques() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviM, noterM] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('paroi');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ plus: false, essayer: false, retenir: false });
  const EX0 = { el: 'fen2', Ti: 20, Te: 0, h: 8 };
  const [ex, setEx] = useState(EX0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- état de l'exploration ----------
  const elEx = M.elDe(ex.el), dTex = ex.Ti - ex.Te, phiEx = dTex >= 0 ? M.flux(dTex, elEx.R) : -M.flux(-dTex, elEx.R), Eex = M.kWh(M.energie(Math.abs(phiEx), ex.h * 3600));
  const barres = M.ELEMENTS.map(e => ({ id: e.id, court: e.court, phi: Math.abs(dTex) / e.R, etiq: { fen1: ['Fenêtre', 'simple'], fen2: ['Fenêtre', 'double'], mur0: ['Mur', 'non isolé'], mur1: ['Mur', 'isolé'] }[e.id] }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'conduction', titre: 'Un premier mode de transfert thermique', focus: ['scene'],
      texte: <>Une casserole est posée sur une flamme. Quelques minutes plus tard, la poignée métallique, loin de la flamme, est chaude. Un <strong>transfert thermique</strong> est un transfert d’énergie entre deux corps de températures différentes ; il se fait du plus chaud vers le plus froid. Il existe trois modes de transfert thermique : on les rencontre l’un après l’autre.</>,
      tache: { type: 'qcm', q: 'Par quel mode l’énergie arrive-t-elle jusqu’à la poignée ?', options: Q.conduction.options, bonne: 0,
        expl: 'Dans un solide, les atomes ne se déplacent pas en bloc : l’agitation se transmet de proche en proche. C’est la conduction. Il n’y a ni matière qui se déplace (convection), ni lumière visible qui joue le rôle principal (rayonnement), et un solide transfère très bien l’énergie, surtout un métal.',
        indice: 'Regardez comment l’énergie avance le long de la poignée : de proche en proche, dans la matière immobile.' } },
    { id: 'convection', titre: 'Un deuxième mode de transfert thermique', focus: ['scene'],
      texte: <>Un radiateur chauffe une pièce. L’air voisin du radiateur s’échauffe, devient moins dense et monte ; l’air plus froid descend de l’autre côté et vient prendre sa place : l’air tourne en boucle dans la pièce.</>,
      tache: { type: 'qcm', q: 'Quel mode de transfert thermique domine pour échauffer l’air de la pièce ?', options: Q.convection.options, bonne: 0,
        expl: 'Dans un fluide (liquide ou gaz), c’est le mouvement du fluide lui-même qui transporte l’énergie : la convection. La conduction existe aussi dans l’air, mais l’air conduit mal. Le rayonnement existe, mais ce n’est pas lui qui met l’air en circulation.',
        indice: 'Qu’est-ce qui se déplace dans la pièce : l’énergie seule, ou de la matière qui transporte l’énergie ?' } },
    { id: 'rayonnement', titre: 'Un troisième mode de transfert thermique', focus: ['scene'],
      texte: <>La Terre reçoit de l’énergie du Soleil, alors qu’entre les deux il n’y a presque que du vide. L’énergie voyage sous forme d’ondes électromagnétiques (lumière visible, infrarouge, ultraviolet…).</>,
      tache: { type: 'qcm', q: 'Quel mode de transfert thermique permet à l’énergie du Soleil d’arriver sur Terre ?', options: Q.rayonnement.options, bonne: 0,
        expl: 'Le rayonnement est le seul mode qui n’a pas besoin de matière : les ondes électromagnétiques se propagent dans le vide. La conduction et la convection exigent un milieu matériel (solide, liquide ou gaz).',
        indice: 'Entre le Soleil et la Terre, il n’y a pas de matière : quel mode fonctionne sans matière ?' } },
    { id: 'flux', titre: 'Le flux thermique', focus: ['scene'],
      retenirTitre: 'Les trois modes de transfert thermique',
      retenir: <>
        <SvgCarteModes/>
        <ul style={ULS}>
          <li><strong>Conduction</strong> : de proche en proche, dans la matière immobile. <strong>Convection</strong> : un fluide en mouvement transporte l’énergie. <strong>Rayonnement</strong> : ondes électromagnétiques, même dans le vide.</li>
          <li>Moyen de s’en souvenir : <strong>« proche en proche, fluide qui bouge, rien du tout (vide) »</strong>. Idée fausse : « le vide arrête la chaleur ». Vrai : le rayonnement traverse le vide, c’est ainsi que le Soleil nous chauffe.</li>
        </ul></>,
      texte: <>Un mur laisse passer de l’énergie de l’intérieur d’une maison vers l’extérieur. Le <strong>flux thermique</strong> φ est l’énergie transférée par seconde : c’est une puissance, en watts (W). Si l’énergie Q (en joules) est transférée pendant la durée Δt (en secondes) :{FFlux}Pour un mur donné, Q = <strong>7,2{NB}kJ</strong> sont transférés pendant <strong>2,0{NB}min</strong>.</>,
      tache: { type: 'num', q: 'Quel est le flux thermique φ à travers ce mur, en W ?', unite: 'W', vrai: 60, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Q = 7,2 kJ = 7200 J ; Δt = 2,0 min = 120 s.', <>φ = {avecIndices('frac(Q|Δt)')} = {avecIndices('frac(7200|120)')} = 60 W.</>],
        pieges: [[0.06, 'Q n’a pas été converti en joules : 7,2 kJ = 7200 J.'], [3600, 'La durée n’a pas été convertie en secondes : 2,0 min = 120 s.'], [3.6, 'Q et la durée sont tous les deux mal convertis ; en unités du système international : joules et secondes.']],
        expl: <>Q = 7200 J ; Δt = 120 s ; φ = {avecIndices('frac(7200|120)')} = 60 W : le mur laisse passer 60 joules chaque seconde.</>,
        indice: <>{eFlux}, avec Q en joules et Δt en secondes (1 kJ = 1000 J ; 1 min = 60 s).</> } },
    { id: 'sens', titre: 'Le sens du transfert', focus: ['scene'],
      texte: <>Une pièce est à <strong>20{NB}°C</strong>. Dehors, il fait <strong>5{NB}°C</strong>. Une paroi les sépare : le flux thermique φ la traverse dans un seul sens, et la température de chaque côté ne change pas (on dit que le régime est permanent).</>,
      tache: { type: 'qcm', q: 'Dans quel sens se fait le transfert thermique à travers la paroi ?', options: Q.sens.options, bonne: 0,
        expl: 'Un transfert thermique se fait spontanément du corps le plus chaud vers le plus froid : ici de la pièce (20 °C) vers l’extérieur (5 °C). Il n’y a pas de transfert dans les deux sens à parts égales, et une paroi, même isolante, n’est jamais parfaite.',
        indice: 'Un transfert thermique va toujours du plus chaud vers le plus froid.' } },
    { id: 'resistance', titre: 'La résistance thermique', focus: ['scene'],
      retenirTitre: 'Le flux thermique',
      retenir: <>
        <SvgCarteFlux/>
        <ul style={ULS}>
          <li>Le <strong>flux thermique</strong> φ est l’énergie transférée par seconde ; il s’exprime en watts. Q en joules, Δt en secondes.</li>
          <li>Il va du chaud vers le froid. Exemple : 3000 J transférés en 60 s donnent 50 W.</li>
          <li>Moyen de s’en souvenir : <strong>« un watt, c’est un joule par seconde »</strong>. Idée fausse : « 7,2 kJ en 2 min donnent 3,6 W ». Vrai : convertir d’abord (7200 J, 120 s).</li>
        </ul></>,
      texte: <>Une paroi s’oppose plus ou moins au passage de l’énergie : on la caractérise par sa <strong>résistance thermique</strong> R<sub>th</sub> (en K·W⁻¹), donnée par le constructeur. Plus R<sub>th</sub> est grande, plus la paroi isole. Pour un écart de température ΔT entre les deux faces (en K) :{FR}Une fenêtre à double vitrage (1,5{NB}m²) a R<sub>th</sub> = <strong>0,24{NB}K·W⁻¹</strong>. La pièce est à <strong>20{NB}°C</strong>, l’extérieur à <strong>0{NB}°C</strong> : ΔT = 20{NB}K (un écart de 1{NB}°C est un écart de 1{NB}K).</>,
      tache: { type: 'num', q: 'Quel est le flux thermique φ à travers cette fenêtre, en W ? (2 chiffres significatifs)', unite: 'W', vrai: 20 / 0.24, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['ΔT = 20 − 0 = 20 K ; R_th = 0,24 K·W⁻¹.', <>φ = {avecIndices('frac(ΔT|R_th)')} = {avecIndices('frac(20|0,24)')} ≈ 83 W.</>],
        pieges: [[4.8, 'Le flux est ΔT divisé par R_th, pas multiplié : φ = ΔT / R_th.'], [0.012, 'Le quotient est à l’envers : φ = ΔT / R_th, avec ΔT au numérateur.'], [0.24, 'Vous avez recopié R_th : il faut calculer ΔT / R_th.']],
        expl: <>ΔT = 20 K ; φ = {avecIndices('frac(20|0,24)')} ≈ 83 W : cette fenêtre laisse passer environ 83 joules chaque seconde.</>,
        indice: <>{eR}, avec ΔT = température intérieure − température extérieure.</> } },
    { id: 'inverse', titre: 'Déterminer une résistance thermique', focus: ['scene'],
      texte: <>On veut connaître la résistance thermique d’un mur en parpaing non isolé de 10{NB}m². Dans la pièce, il fait <strong>20{NB}°C</strong> ; dehors, <strong>5{NB}°C</strong>. Un appareil de mesure indique un flux thermique <strong>φ = 300{NB}W</strong> à travers le mur (régime permanent).</>,
      tache: { type: 'num', q: 'Quelle est la résistance thermique R_th du mur, en K·W⁻¹ ? (2 chiffres significatifs)', unite: 'K·W⁻¹', vrai: 15 / 300, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => ['ΔT = 20 − 5 = 15 K ; φ = 300 W.', <>R_th = {avecIndices('frac(ΔT|φ)')} = {avecIndices('frac(15|300)')} = 0,050 K·W⁻¹.</>],
        pieges: [[20, 'Le quotient est à l’envers : R_th = ΔT / φ, avec φ au dénominateur.'], [4500, 'On ne multiplie pas : R_th = ΔT / φ.'], [0.5, 'La température intérieure n’est pas l’écart : il faut ΔT = 20 − 5 = 15 K.']],
        expl: <>ΔT = 20 − 5 = 15 K ; R<sub>th</sub> = {avecIndices('frac(15|300)')} = 0,050 K·W⁻¹ : un mur non isolé laisse passer beaucoup d’énergie, sa résistance thermique est faible.</>,
        indice: <>On part de {eR} et on isole R<sub>th</sub> : {eRinv}. ΔT = 20 − 5.</> } },
    { id: 'prevoir', titre: 'Prévoir sans calculer', focus: [],
      texte: <>Pour une paroi, on ajoute une couche d’isolant qui <strong>double</strong> sa résistance thermique R<sub>th</sub>. Le même jour, la température extérieure baisse et l’écart de température ΔT entre les deux faces <strong>double</strong> aussi.</>,
      tache: { type: 'qcm', q: 'Que devient le flux thermique φ à travers la paroi ?', options: Q.prevoir.options, bonne: 0,
        expl: <>{eR} : si ΔT est multiplié par 2 et R<sub>th</sub> par 2, le quotient ne change pas. Le flux est inchangé : l’isolant compense exactement l’augmentation de l’écart. Il serait multiplié par 2 seulement si ΔT doublait sans que R<sub>th</sub> change.</>,
        indice: <>{eR} : que devient le quotient quand le numérateur et le dénominateur sont multipliés par le même nombre ?</> } },
    { id: 'energie', titre: 'De la puissance à l’énergie', focus: [],
      retenirTitre: 'Résistance thermique et flux',
      retenir: <>
        <SvgCarteR/>
        <ul style={ULS}>
          <li><strong>φ = ΔT / R<sub>th</sub></strong> : plus R<sub>th</sub> est grande, plus la paroi isole et plus le flux est faible.</li>
          <li>ΔT doublé : φ doublé. R<sub>th</sub> doublée : φ divisé par 2. Deux changements identiques s’annulent.</li>
          <li>Moyen de s’en souvenir : <strong>« grosse résistance, petit flux »</strong>. Idée fausse : « une paroi épaisse ne laisse rien passer ». Vrai : elle laisse passer moins, jamais zéro.</li>
        </ul></>,
      texte: <>Le flux thermique est une puissance : pendant une durée Δt, l’énergie transférée est{FE}Si φ est en watts et Δt en secondes, E est en joules. Pour une facture d’énergie, on utilise le <strong>kilowattheure</strong> (kWh) : 1{NB}kWh = 3,6 × 10⁶{NB}J = 1000{NB}W pendant 1{NB}h. Une fenêtre laisse passer un flux de <strong>150{NB}W</strong> pendant une nuit de <strong>10{NB}h</strong>.</>,
      tache: { type: 'num', q: 'Quelle énergie E la fenêtre laisse-t-elle passer pendant la nuit, en kWh ? (2 chiffres significatifs)', unite: 'kWh', vrai: 1.5, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['φ = 150 W = 0,150 kW ; Δt = 10 h.', <>E = φ × Δt = 0,150 × 10 = 1,5 kWh (soit 150 × 10 = 1500 Wh).</>],
        pieges: [[1500, 'Ce résultat est en Wh : 1500 Wh = 1,5 kWh (divisez par 1000).'], [5400000, 'Ce résultat est en joules : 150 W × 36 000 s = 5,4 × 10⁶ J ; en kWh, divisez par 3,6 × 10⁶.'], [15, 'La puissance doit être convertie en kW : 150 W = 0,150 kW.']],
        expl: <>E = φ × Δt = 150 W × 10 h = 1500 Wh = 1,5 kWh. En joules : 150 × 36 000 = 5,4 × 10⁶ J, soit 1,5 kWh.</>,
        indice: <>{eE}. Avec φ en kW (150 W = 0,150 kW) et Δt en heures, E est directement en kWh.</> } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'Méthode pour une paroi',
      retenir: <>
        <SvgCarteBilan/>
        <ul style={ULS}>
          <li>Écart ΔT entre les deux faces ; flux φ = ΔT / R<sub>th</sub> ; énergie E = φ × Δt ; vérifier les unités (W, s, J ou kWh).</li>
          <li>Pour trouver R<sub>th</sub> : R<sub>th</sub> = ΔT / φ.</li>
          <li>Moyen de s’en souvenir : <strong>« écart, flux, énergie, unités »</strong>. Idée fausse : « un watt par kelvin est une température ». Vrai : R<sub>th</sub> est en K·W⁻¹ (kelvins par watt).</li>
        </ul></>,
      texte: <>Vous savez distinguer conduction, convection et rayonnement, prévoir le sens d’un transfert thermique, calculer un flux {eFlux}, exploiter la résistance thermique {eR} et en déduire l’énergie transférée {eE}. Passez à l’exploration (parois, écart de température, durée) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'paroi' ? M.tirageParoi() : M.tirageMesure()), type, s1: '', s2: '', s3: '', verifie: false, essais: 0, corr: false }); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
  const TOL = [0.06, 0.08, 0.08];
  const verifier = () => {
    const res = [1, 2, 3].map(k => pr(lireNombre(defi[`s${k}`] || ''), defi[`rep${k}`], TOL[k - 1]));
    const ok = res.every(Boolean);
    setDefi(d => ({ ...d, verifie: true, ok, res, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'paroi' ? noterP : noterM)(ok);
  };
  // Retour diagnostique par question : saisie vide ou non numérique, cohérence avec la réponse précédente, erreur d'unité, trop petit / trop grand.
  const diagnostic = k => {
    const s = lireNombre(defi[`s${k}`] || ''), vrai = defi[`rep${k}`];
    if (!isFinite(s)) return 'écrivez un nombre (la virgule ou le point conviennent).';
    if (pr(s, vrai, TOL[k - 1])) return 'juste.';
    const s1 = lireNombre(defi.s1 || ''), s2 = lireNombre(defi.s2 || '');
    let propre = null;
    if (defi.type === 'paroi' && k === 2 && isFinite(s1)) propre = M.kWh(M.energie(s1, defi.h * 3600));
    if (defi.type === 'mesure' && k === 2 && isFinite(s1) && s1 !== 0) propre = defi.dT / s1;
    if (defi.type === 'mesure' && k === 3 && isFinite(s2) && s2 !== 0) propre = defi.dT2 / s2;
    if (propre != null && pr(s, propre, 0.04)) return `votre calcul est cohérent avec votre réponse à la question ${k - 1} : c’est celle-là qu’il faut revoir.`;
    const r = s / vrai;
    for (const [f, msg] of [[1000, 'votre résultat est environ 1000 fois trop grand : vérifiez les conversions (W et kW, J et kJ).'], [1 / 1000, 'votre résultat est environ 1000 fois trop petit : vérifiez les conversions (W et kW, J et kJ).'], [60, 'votre résultat est environ 60 fois trop grand : la durée est-elle en secondes (1 min = 60 s) ?'], [1 / 60, 'votre résultat est environ 60 fois trop petit : la durée est-elle en secondes (1 min = 60 s) ?'], [3600, 'votre résultat est environ 3600 fois trop grand : vérifiez la conversion heures et secondes.'], [1 / 3600, 'votre résultat est environ 3600 fois trop petit : vérifiez la conversion heures et secondes.']]) {
      if (Math.abs(r / f - 1) < 0.06) return msg;
    }
    return s < vrai ? 'votre résultat est trop petit : revoyez la formule utilisée et le quotient (numérateur, dénominateur).' : 'votre résultat est trop grand : revoyez la formule utilisée et le quotient (numérateur, dénominateur).';
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('tth-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.res[+cle.slice(1) - 1] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const fW = x => nbf(x, 0), f1 = x => nbf(x, 1), f3 = x => nbf(x, 3);
  const solutionDefi = d => d.type === 'paroi'
    ? <>ΔT = {d.Ti} − ({d.Te}) = {d.dT} K ; φ = {avecIndices('frac(ΔT|R_th)')} = {avecIndices(`frac(${d.dT}|${String(d.el.R).replace('.', ',')})`)} = {fW(d.rep1)} W ; E = φ × Δt = {fW(d.rep1)} × {nbf(d.h, 1)} h = {nbf(d.rep1 * d.h, 0)} Wh = {nbf(d.rep2, 2)} kWh ; pour que φ′ = {fW(d.phiC)} W, il faut R<sub>th</sub> = {avecIndices('frac(ΔT|φ′)')} = {avecIndices(`frac(${d.dT}|${fW(d.phiC)})`)} = {f3(d.rep3)} K·W⁻¹. Si votre écart vient d’un arrondi trop tôt, gardez un chiffre de plus dans les calculs intermédiaires.</>
    : <>Q = {d.Qk} kJ = {fW(d.Qk * 1000)} J ; Δt = {d.tmin} min = {fW(d.tmin * 60)} s ; φ = {avecIndices('frac(Q|Δt)')} = {fW(d.rep1)} W ; R<sub>th</sub> = {avecIndices('frac(ΔT|φ)')} = {avecIndices(`frac(${d.dT}|${fW(d.rep1)})`)} = {f3(d.rep2)} K·W⁻¹ ; avec ΔT′ = {d.dT2} K : φ′ = {avecIndices('frac(ΔT′|R_th)')} = {f1(d.rep3)} W. Si votre écart vient d’un arrondi trop tôt, gardez un chiffre de plus dans les calculs intermédiaires.</>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['paroi', 'Perte à travers une paroi'], ['mesure', 'Mesurer une résistance thermique']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'paroi' ? 'Défi : perte à travers une paroi' : 'Défi : mesurer une résistance thermique'}</div>
      {defi.type === 'paroi' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un élément de maison : <strong>{defi.el.nom.toLowerCase()}</strong>, de résistance thermique R<sub>th</sub> = <strong>{String(defi.el.R).replace('.', ',')}{NB}K·W⁻¹</strong>. L’intérieur est à <strong>{defi.Ti}{NB}°C</strong>, l’extérieur à <strong>{String(defi.Te).replace('-', '−')}{NB}°C</strong> (régime permanent) pendant <strong>{nbf(defi.h, 1)}{NB}h</strong>. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%, 8{NB}% pour les questions 2 et 3 ; gardez un chiffre de plus dans les calculs intermédiaires).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Flux thermique φ à travers l’élément, en W.</div>
        {champ('φ', 's1', 'W')}
        <IndiceDefi cache={false}>φ = ΔT / R<sub>th</sub>, avec ΔT = température intérieure − température extérieure.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Énergie E perdue pendant la durée donnée, en kWh.</div>
        {champ('E', 's2', 'kWh')}
        <IndiceDefi cache={false}>E = φ × Δt : φ en kW (divisez les watts par 1000) et Δt en heures donnent E en kWh.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> On veut ramener le flux à <strong>φ′ = {fW(defi.phiC)}{NB}W</strong>, avec le même écart de température. Quelle résistance thermique R<sub>th</sub> faut-il ? (en K·W⁻¹)</div>
        {champ('R_th', 's3', 'K·W⁻¹')}
        <IndiceDefi cache={false}>R<sub>th</sub> = ΔT / φ′ : on a isolé R<sub>th</sub> dans φ = ΔT / R<sub>th</sub>.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Pour une paroi inconnue, un appareil mesure que <strong>{defi.Qk}{NB}kJ</strong> la traversent en <strong>{defi.tmin}{NB}min</strong>, avec un écart de température de <strong>{defi.dT}{NB}K</strong> entre ses deux faces (régime permanent). Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%, 8{NB}% pour les questions 2 et 3 ; gardez un chiffre de plus dans les calculs intermédiaires).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Flux thermique φ à travers la paroi, en W.</div>
        {champ('φ', 's1', 'W')}
        <IndiceDefi cache={false}>φ = Q / Δt, avec Q en joules (1 kJ = 1000 J) et Δt en secondes (1 min = 60 s).</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Résistance thermique R<sub>th</sub> de la paroi, en K·W⁻¹.</div>
        {champ('R_th', 's2', 'K·W⁻¹')}
        <IndiceDefi cache={false}>R<sub>th</sub> = ΔT / φ, avec ΔT en K et φ en W.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> La même paroi sépare maintenant deux milieux dont l’écart de température est <strong>ΔT′ = {defi.dT2}{NB}K</strong>. Quel est le nouveau flux φ′, en W ?</div>
        {champ('φ′', 's3', 'W')}
        <IndiceDefi cache={false}>La résistance thermique de la paroi ne change pas : φ′ = ΔT′ / R<sub>th</sub>.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="tth-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? '✓ Correct.' : '✗ Pas tout à fait.'}</div>
        {!defi.ok && <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{[1, 2, 3].map(k => <li key={k}><strong>Question {k}</strong> : {diagnostic(k)}</li>)}</ul>}
        {!defi.ok && !defi.corr && <div style={{ marginTop: 6 }}><button onClick={() => setDefi(d => ({ ...d, corr: true }))} style={stylePetitBouton(false)}>Voir la correction</button></div>}
        {(defi.ok || defi.corr) && <div style={{ marginTop: 6, color: KIT.txt }}>{solutionDefi(defi)}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Régime permanent</strong> : les températures des deux faces de la paroi ne varient pas au cours du temps ; le flux φ est constant et traverse la paroi dans un seul sens, du côté chaud vers le côté froid.</li>
      <li><strong>Flux thermique</strong> : φ = Q / Δt, énergie transférée par seconde (W). Valable pour toute durée Δt pendant laquelle φ est constant.</li>
      <li><strong>Résistance thermique R<sub>th</sub></strong> (K·W⁻¹) d’une paroi : <strong>donnée</strong>, supposée constante ; elle ne dépend pas de ΔT dans le domaine étudié. On n’en calcule pas la valeur à partir de la conductivité et de l’épaisseur (hors du niveau visé ici).</li>
      <li><strong>Relation φ = ΔT / R<sub>th</sub></strong> : écart de température ΔT entre les deux faces de la paroi (en K ; un écart de 1 °C vaut 1 K). Elle décrit le transfert par conduction à travers la paroi ; la convection et le rayonnement sur les faces sont inclus dans la valeur donnée de R<sub>th</sub>, qui est une valeur globale.</li>
      <li><strong>Valeurs</strong> : R<sub>th</sub> fictives mais réalistes pour des éléments d’une maison (fenêtre de 1,5 m² ; mur de 10 m²) : simple vitrage 0,11 ; double vitrage 0,24 ; parpaing non isolé 0,050 ; mur isolé 0,30 K·W⁻¹. Les valeurs réelles dépendent des matériaux et des surfaces.</li>
      <li><strong>Énergie</strong> : E = φ × Δt ; 1 kWh = 3,6 × 10⁶ J. On suppose φ constant pendant toute la durée.</li>
      <li><strong>Hors périmètre</strong> : régime variable (la température d’une paroi qui évolue), calcul de R<sub>th</sub> à partir de la conductivité thermique et de l’épaisseur, coefficients d’échange par convection, loi de Stefan-Boltzmann.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- menus ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lblMenu = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };

  // ---------- scène du parcours / du défi ----------
  let sceneGuide = null;
  if (enGuide) {
    if (idx === I.conduction) sceneGuide = <SceneSituation cas="conduction"/>;
    else if (idx === I.convection) sceneGuide = <SceneSituation cas="convection"/>;
    else if (idx === I.rayonnement) sceneGuide = <SceneSituation cas="rayonnement"/>;
    else if (idx === I.flux) sceneGuide = <SceneParoi nom="Mur isolé" Ti={20} Te={5} montre={{}} aria="Un mur sépare l’intérieur d’une maison, à gauche, de l’extérieur, à droite : une flèche indique l’énergie qui le traverse."/>;
    else if (idx === I.sens) sceneGuide = <SceneParoi nom="Paroi" Ti={20} Te={5} montre={{ T: true }}/>;
    else if (idx === I.resistance) sceneGuide = <SceneParoi nom="Fenêtre double vitrage" Ti={20} Te={0} montre={{ T: true }}/>;
    else if (idx === I.inverse) sceneGuide = <SceneParoi nom="Mur non isolé" Ti={20} Te={5} montre={{ T: true }}/>;
  } else if (dd) {
    sceneGuide = <SceneParoi nom={dd.type === 'paroi' ? dd.el.court : 'Paroi inconnue'} Ti={dd.type === 'paroi' ? dd.Ti : 20} Te={dd.type === 'paroi' ? dd.Te : 20 - dd.dT} montre={dd.type === 'paroi' ? { T: true } : {}}
      aria={dd.type === 'paroi' ? 'Un élément de maison sépare l’intérieur de l’extérieur : les températures sont données dans l’énoncé.' : 'Une paroi inconnue sépare deux milieux : les mesures sont données dans l’énoncé.'}/>;
  }
  const boxScene = sceneGuide && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {dd && <div style={aide}>{dd.type === 'paroi' ? 'Schéma : l’énergie traverse la paroi du côté chaud vers le côté froid (flèche rouge).' : 'Schéma : la paroi est étudiée en régime permanent ; les mesures sont dans l’énoncé.'}</div>}
      {sceneGuide}
    </div>);

  // ---------- exploration ----------
  const retablirEx = () => setEx(EX0);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez l’élément de la maison et réglez la température extérieure : l’écart de température ΔT entre les deux faces change, donc le flux φ aussi.</div>
      <label style={lblMenu}>Élément de la maison<select value={ex.el} onChange={e => setEx(s => ({ ...s, el: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.ELEMENTS.map(g => <option key={g.id} value={g.id}>{g.nom} (R_th = {String(g.R).replace('.', ',')} K·W⁻¹)</option>)}</select></label>
      <Controle nom="Température extérieure" valeur={ex.Te} min={-10} max={15} pas={1} onChange={Te => setEx(s => ({ ...s, Te }))} texte={`${ex.Te < 0 ? '−' : ''}${Math.abs(ex.Te)}${NB}°C`} onRetablir={retablirEx} retablir="Tout rétablir"/>
      <Section titre={`Intérieur : ${ex.Ti} °C · durée : ${nbf(ex.h, 0)} h`} ouvert={ouv.plus} onBascule={() => setOuv(o => ({ ...o, plus: !o.plus }))}>
        <div style={aide}>La température intérieure fixe ΔT avec l’extérieure ; la durée sert à calculer l’énergie perdue E = φ × Δt.</div>
        <label style={lblMenu}>Température intérieure<select value={ex.Ti} onChange={e => setEx(s => ({ ...s, Ti: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{[16, 18, 19, 20, 21, 22, 24].map(v => <option key={v} value={v}>{v} °C</option>)}</select></label>
        <label style={lblMenu}>Durée<select value={ex.h} onChange={e => setEx(s => ({ ...s, h: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{[1, 2, 5, 8, 12, 24].map(v => <option key={v} value={v}>{v} h</option>)}</select></label>
      </Section>
    </div>);
  const sceneEx = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>La flèche rouge est le flux thermique φ à travers la paroi : plus elle est épaisse, plus le flux est grand. Sa direction va du côté chaud vers le côté froid.</div>
      <SceneParoi nom={elEx.nom} Ti={ex.Ti} Te={ex.Te} phi={Math.abs(phiEx)} montre={{ T: true, phi: true }}/>
    </div>);
  const grapheEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Flux thermique pour chaque élément (même ΔT = {nbf(Math.abs(dTex), 0)} K)</div>
      <div style={aide}>Même écart de température pour tous les éléments : plus R<sub>th</sub> est grande, plus la barre est basse. La barre rouge est l’élément choisi.</div>
      <GrapheFlux barres={barres} courant={ex.el}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Calculées avec φ = ΔT / R<sub>th</sub> puis E = φ × Δt.</div>
      <LigneMesure nom="Écart de température ΔT" valeur={`${nbf(dTex, 0)}${NB}K`}/>
      <LigneMesure nom="Résistance thermique R_th (donnée)" valeur={`${String(elEx.R).replace('.', ',')}${NB}K·W⁻¹`}/>
      <LigneMesure nom="Flux thermique φ" valeur={`${nbf(Math.abs(phiEx), 0)}${NB}W`} couleur="#b91c1c"/>
      <LigneMesure nom={`Énergie transférée en ${ex.h} h`} valeur={`${nbf(Eex, 2)}${NB}kWh`} couleur={BLEU}/>
      {dTex < 0 && <div role="status" style={{ ...aide, marginTop: 6, marginBottom: 0 }}>L’extérieur est plus chaud que l’intérieur : le transfert se fait de l’extérieur vers l’intérieur (la flèche change de sens).</div>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez le simple vitrage puis le double vitrage, avec la même température extérieure : que devient le flux ? Que dit le rapport des deux R_th ?</li>
        <li>Pour le mur isolé, baissez la température extérieure de 5 °C : de combien le flux change-t-il ? Est-il proportionnel à ΔT ?</li>
        <li>Réglez la température extérieure au-dessus de la température intérieure : que devient la flèche ? Et le signe de l’échange d’énergie ?</li>
        <li>Calculez à la main le flux affiché pour un élément et une température, puis comparez à la mesure.</li>
        <li>Pendant 24 h, quel élément laisse passer le plus d’énergie, à ΔT égal ? Comment l’expliquer avec R_th ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Trois modes : conduction (de proche en proche), convection (fluide en mouvement), rayonnement (ondes, même dans le vide)</li>
          <li>Flux thermique : {eFlux} (W) ; du chaud vers le froid</li>
          <li>Résistance thermique d’une paroi : {eR}, R<sub>th</sub> en K·W⁻¹</li>
          <li>Énergie transférée : {eE} ; 1 kWh = 3,6 × 10⁶ J</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tth-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tth-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tth-col { display: flex; flex-direction: column; gap: 12px; }
        .tth-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .tth-l1.cote .tth-carte { order: 2; } .tth-l1.cote .tth-main { order: 1; }
          .tth-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tth-ex > * { grid-column: 1; } .tth-ex > .tth-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .tth-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tth-in { animation: tth-fondu 0.35s ease-out; } @keyframes tth-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Transferts thermiques : modes, flux et résistance thermique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>De l’énergie passe d’un corps chaud vers un corps froid par conduction, convection ou rayonnement{(enGuide && !deja('resistance')) ? '.' : <> ; à travers une paroi, le flux thermique est {eR}.</>}</div>
      {!enExplore && <div className="tth-l1 cote">
        {enGuide ? <div className="tth-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="tth-carte">{panneauHypo}</div> : null}
        <div className="tth-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'paroi' ? suiviP : suiviM}/></div>}
          <div className="tth-col">
            {boxScene && <div className="tth-in">{boxScene}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="tth-ex">
        <div>{sceneEx}</div>
        <div className="tth-ctrl">{reglagesEx}</div>
        <div>{grapheEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
