import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./jouleModele";
import { QCM } from "./jouleQcm";
import { SceneJoule, SvgOhm, SvgPuissanceJoule, SvgEnergieJoule, SvgConversion, SvgPertesCable, SvgHauteTension } from "./JouleSchemas";

const SIM_ID = 232, CLE_GUIDE = 'joule-guide-v1';
declarerDefis(SIM_ID, [['resistor', 'Résistor chauffant'], ['cable', 'Pertes dans un câble']]);

// ====================================================
//  SIM 232 — EFFET JOULE : PUISSANCE, ÉNERGIE THERMIQUE ET PERTES (TSTL, enseignement PCM, partie « Énergie »).
//  Une seule idée : un résistor convertit toute l'énergie électrique qu'il reçoit en énergie thermique (effet Joule) ; P = U × I = R × I², W = P × Δt ;
//  dans un câble, l'effet Joule est une perte r × I², d'où le transport sous haute tension.
//  Aucune situation du Moodle : résistor de 24 Ω sous 12 V, câble de 0,50 Ω (valeurs inventées).
//  Capacités visées (jamais affichées) : loi d'Ohm ; puissance reçue par un récepteur ; relation puissance-énergie ; interpréter l'effet Joule comme conversion d'énergie électrique en énergie thermique et en citer des applications ; analyser les échanges d'énergie dans un circuit simple.
//  Modèle : jouleModele.js (test node). QCM : jouleQcm.js. Schémas : JouleSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const gd = v => (v >= 1000 ? nbf(Math.round(v), 0) : v >= 100 ? nbf(v, 0) : v >= 10 ? nbf(v, 1) : nbf(v, 2));
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const P = M.PARCOURS;

const I0 = M.intensite(P.U, P.R), P0 = M.puissanceUI(P.U, I0), W0 = M.energieJ(P0, P.dtMin * 60);
const PJ2 = M.puissanceJoule(P.R2, P.I2), PC = M.pertesCable(P.r, P.Ic);

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(Number(ev.target.value))} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);

// ====================================================
export function SimulationJoule() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('resistor');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ R: 24, U: 12, dt: 10, r: 0 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['conversion', 'ohm', 'puissance', 'joule', 'energie', 'thermique', 'double', 'tension', 'fil', 'ligne', 'utile', 'bilan'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  const ETAPES = [
    { id: 'conversion', titre: 'Un résistor qui chauffe', focus: ['scene'],
      texte: <>Un <strong>résistor</strong> (ou conducteur ohmique) est un dipôle qui s’échauffe quand un courant le traverse. Ici un résistor chauffant est alimenté par un <strong>générateur</strong> de tension <strong>U = {P.U} V</strong>. Le résistor <strong>reçoit</strong> de l’énergie électrique.</>,
      tache: { type: 'qcm', q: 'Que devient l’énergie électrique reçue par le résistor ?', ...QCM.conversion,
        expl: 'Le résistor convertit l’énergie électrique en énergie thermique : il s’échauffe et cède de la chaleur à son environnement. C’est l’effet Joule.', indice: 'Le résistor chauffe : quelle forme d’énergie est liée à la chaleur ?' } },
    { id: 'ohm', titre: 'Le courant dans le résistor', focus: ['scene'],
      texte: <>Le résistor a une <strong>résistance R = {P.R} Ω</strong> (ohms). La <strong>loi d’Ohm</strong> relie la tension U à ses bornes, sa résistance R et l’<strong>intensité I</strong> du courant : <strong>U = R × I</strong>, donc <strong>I = U ÷ R</strong> (U en V, R en Ω, I en A). Tension : U = {P.U} V.</>,
      tache: { type: 'num', q: 'Intensité I du courant dans le résistor, en ampères (A)', unite: 'A', vrai: I0, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        pieges: [[P.R / P.U, 'Le rapport est inversé : I = U ÷ R.'], [P.R * P.U, 'Il faut diviser la tension par la résistance, pas les multiplier.']],
        calcul: () => [`I = U ÷ R = ${P.U} ÷ ${P.R} = ${nbf(I0, 2)} A.`],
        expl: `I = ${P.U} ÷ ${P.R} = ${nbf(I0, 2)} A.`, indice: 'I = U ÷ R avec U = 12 V et R = 24 Ω : le résultat est en ampères.' } },
    { id: 'puissance', titre: 'La puissance reçue', focus: ['scene'],
      retenirTitre: 'À retenir : la loi d’Ohm',
      retenir: <>
        <SvgOhm/>
        <ul style={puces}>
          <li>La loi d’Ohm : <strong>U = R × I</strong>, donc <strong>I = U ÷ R</strong> (V = Ω × A).</li>
          <li>Exemple : 9,0 V aux bornes de 30 Ω donnent 0,30 A.</li>
          <li>Moyen de s’en souvenir : <strong>« plus la résistance est grande, moins il passe de courant »</strong>.</li>
        </ul></>,
      texte: <>La <strong>puissance électrique</strong> <strong>P</strong> (en watts, W) reçue par un dipôle est <strong>P = U × I</strong> (U en V, I en A). Rappel : U = {P.U} V et I = <strong>{nbf(I0, 2)} A</strong>.</>,
      tache: { type: 'num', q: 'Puissance P reçue par le résistor, en watts (W)', unite: 'W', vrai: P0, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.U / I0, 'Il faut multiplier la tension par l’intensité, pas les diviser.'], [I0 / P.U, 'Il faut multiplier la tension par l’intensité, pas les diviser.']],
        calcul: () => [`P = U × I = ${P.U} × ${nbf(I0, 2)} = ${nbf(P0, 1)} W.`],
        expl: `P = ${P.U} × ${nbf(I0, 2)} = ${nbf(P0, 1)} W.`, indice: 'P = U × I avec U = 12 V et I = 0,50 A.' } },
    { id: 'joule', titre: 'Une autre expression de la puissance', focus: ['scene'],
      texte: <>Comme U = R × I, la puissance s’écrit aussi <strong>P = R × I²</strong> (R en Ω, I en A, P en W). On étudie un autre résistor de <strong>résistance {P.R2} Ω</strong> parcouru par un courant de <strong>{nbf(P.I2, 1)} A</strong>.</>,
      tache: { type: 'num', q: 'Puissance P dissipée dans ce résistor, en watts (W)', unite: 'W', vrai: PJ2, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        pieges: [[P.R2 * P.I2, 'Le carré de l’intensité a été oublié : P = R × I² = R × I × I.'], [P.R2 * P.I2 * 2, 'L’intensité est au carré (I × I), pas multipliée par 2.']],
        calcul: () => [`P = R × I² = ${P.R2} × ${nbf(P.I2, 1)}² = ${P.R2} × ${nbf(P.I2 * P.I2, 2)} = ${nbf(PJ2, 1)} W.`],
        expl: `P = ${P.R2} × ${nbf(P.I2, 1)}² = ${nbf(PJ2, 1)} W.`, indice: 'Calculez I² = 1,5 × 1,5 d’abord, puis multipliez par R = 10 Ω.' } },
    { id: 'energie', titre: 'L’énergie fournie', focus: ['scene'],
      retenirTitre: 'À retenir : la puissance dissipée',
      retenir: <>
        <SvgPuissanceJoule/>
        <ul style={puces}>
          <li>La puissance reçue par un résistor est <strong>P = U × I = R × I²</strong>.</li>
          <li>Exemple : 30 Ω parcouru par 0,30 A : P = 30 × 0,30² = 2,7 W.</li>
          <li>Moyen de s’en souvenir : <strong>« I au carré : courant doublé, puissance quadruplée »</strong>.</li>
        </ul></>,
      texte: <>L’énergie transférée pendant une durée <strong>Δt</strong> est <strong>W = P × Δt</strong> (W en joules J, P en watts, Δt en <strong>secondes</strong>). Le premier résistor ({P.R} Ω, {P.U} V) reçoit <strong>P = {nbf(P0, 1)} W</strong> pendant <strong>{P.dtMin} minutes</strong>.</>,
      tache: { type: 'num', q: 'Énergie W reçue par le résistor, en joules (J)', unite: 'J', vrai: W0, tol: 0.03, affiche: v => String(Math.round(v)), cs: 2,
        pieges: [[P0 * P.dtMin, 'La durée est restée en minutes : convertissez-la en secondes (1 min = 60 s).'], [P0 * P.dtMin * 3600, 'Une minute vaut 60 s, pas 3 600 s.']],
        calcul: () => [`Δt = ${P.dtMin} min = ${P.dtMin * 60} s`, `W = P × Δt = ${nbf(P0, 1)} × ${P.dtMin * 60} = ${nbf(W0, 0)} J.`],
        expl: `Δt = ${P.dtMin * 60} s ; W = ${nbf(P0, 1)} × ${P.dtMin * 60} = ${nbf(W0, 0)} J, soit 3,6 kJ.`, indice: 'Convertissez 10 min en secondes, puis W = P × Δt.' } },
    { id: 'thermique', titre: 'Où va cette énergie ?', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : l’énergie transférée',
      retenir: <>
        <SvgEnergieJoule/>
        <ul style={puces}>
          <li>L’énergie transférée est <strong>W = P × Δt</strong> (J = W × s), avec la durée en secondes.</li>
          <li>Exemple : 2,7 W pendant 60 s transfèrent 162 J.</li>
          <li>Moyen de s’en souvenir : <strong>« des watts pendant des secondes font des joules »</strong>.</li>
        </ul></>,
      texte: <>Le résistor a reçu <strong>W = {nbf(W0, 0)} J</strong> d’énergie électrique en {P.dtMin} minutes, et sa température s’est stabilisée.</>,
      tache: { type: 'qcm', q: 'Quelle énergie thermique le résistor dégage-t-il pendant ce temps ?', ...QCM.thermique,
        expl: `Un résistor convertit toute l’énergie électrique reçue en énergie thermique : il dégage ${nbf(W0, 0)} J sous forme de chaleur. C’est l’effet Joule.`, indice: 'Un résistor ne stocke pas d’énergie électrique : que devient donc celle qu’il reçoit ?' } },
    { id: 'double', titre: 'Un courant deux fois plus intense', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : l’effet Joule',
      retenir: <>
        <SvgConversion/>
        <ul style={puces}>
          <li>Dans un résistor, <strong>toute l’énergie électrique reçue est convertie en énergie thermique</strong> : c’est l’<strong>effet Joule</strong>.</li>
          <li>Il est utile pour chauffer (plaque de cuisson, grille-pain) et c’est une perte dans un câble.</li>
          <li>Moyen de s’en souvenir : <strong>« tout ce qui entre sort en chaleur »</strong>.</li>
        </ul></>,
      texte: <>On revient au résistor de {P.R} Ω et on double l’intensité du courant (en augmentant la tension de la source). La résistance R reste la même. Rappel : avec I = {nbf(I0, 2)} A, la puissance est <strong>{nbf(P0, 1)} W</strong>.</>,
      tache: { type: 'qcm', q: 'Que devient la puissance dissipée ?', ...QCM.double,
        expl: `P = R × I² : si I est multipliée par 2, P est multipliée par 2² = 4, soit ${nbf(4 * P0, 0)} W.`, indice: 'P = R × I² : calculez la puissance avec I doublée et comparez à la puissance de départ.' } },
    { id: 'tension', titre: 'Une tension deux fois plus grande', focus: ['scene', 'mesures'],
      texte: <>On garde le résistor de {P.R} Ω mais on branche une source de tension <strong>deux fois plus grande</strong> ({2 * P.U} V au lieu de {P.U} V). Rappel : sous {P.U} V, la puissance est {nbf(P0, 1)} W.</>,
      tache: { type: 'qcm', q: 'Que devient la puissance dissipée ?', ...QCM.tension,
        expl: `I = U ÷ R double (${nbf(2 * I0, 2)} A), donc P = R × I² est multipliée par 4 : P = ${nbf(4 * P0, 0)} W. On retrouve P = U² ÷ R.`, indice: 'Avec la loi d’Ohm, que devient I quand U double ? Puis utilisez P = R × I².' } },
    { id: 'fil', titre: 'L’effet Joule dans un câble', focus: ['scene'],
      texte: <>Un <strong>câble</strong> n’est pas un conducteur parfait : il a une petite résistance <strong>r = {nbf(P.r, 2)} Ω</strong>. Il est parcouru par un courant d’intensité <strong>I = {nbf(P.Ic, 1)} A</strong> et chauffe lui aussi par effet Joule : la puissance dissipée est <strong>r × I²</strong>.</>,
      tache: { type: 'num', q: 'Puissance perdue par effet Joule dans le câble, en watts (W)', unite: 'W', vrai: PC, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P.r * P.Ic, 'Le carré de l’intensité a été oublié : pertes = r × I².'], [P.r * P.Ic * 2, 'L’intensité est au carré (I × I), pas multipliée par 2.']],
        calcul: () => [`pertes = r × I² = ${nbf(P.r, 2)} × ${nbf(P.Ic, 1)}² = ${nbf(P.r, 2)} × ${nbf(P.Ic * P.Ic, 0)} = ${nbf(PC, 1)} W.`],
        expl: `pertes = ${nbf(P.r, 2)} × ${nbf(P.Ic, 1)}² = ${nbf(PC, 1)} W : une puissance qui chauffe le câble sans servir à l’appareil.`, indice: 'pertes = r × I² avec r = 0,50 Ω et I = 8,0 A : calculez I² d’abord.' } },
    { id: 'ligne', titre: 'Réduire les pertes', focus: [],
      retenirTitre: 'À retenir : les pertes dans un câble',
      retenir: <>
        <SvgPertesCable/>
        <ul style={puces}>
          <li>Un câble dissipe par effet Joule <strong>r × I²</strong> : c’est de la puissance <strong>perdue</strong>.</li>
          <li>Exemple : 0,20 Ω parcouru par 5,0 A perd 5,0 W ; avec 10 A, 20 W.</li>
          <li>Moyen de s’en souvenir : <strong>« I doublé, pertes quadruplées »</strong>.</li>
        </ul></>,
      texte: <>Un appareil reçoit une puissance donnée <strong>P = U × I</strong> au bout d’un câble. Pour une puissance P fixée, l’intensité I = P ÷ U dépend de la tension U de l’installation. Rappel : les pertes dans le câble valent r × I² (ici {nbf(PC, 0)} W pour {nbf(P.Ic, 1)} A).</>,
      tache: { type: 'qcm', q: 'Pour transporter la même puissance, quelle tension réduit le plus les pertes dans le câble ?', ...QCM.ligne,
        expl: 'À puissance fixée, I = P ÷ U : une tension plus élevée donne une intensité plus petite, donc des pertes r × I² plus petites (tension × 10, pertes ÷ 100). C’est pourquoi l’électricité est transportée à haute tension.', indice: 'À P fixée, que devient I quand U augmente ? Puis, que deviennent les pertes r × I² ?' } },
    { id: 'utile', titre: 'Utile ou perte ?', focus: [],
      texte: <>L’effet Joule est <strong>recherché</strong> quand le but est de chauffer, et <strong>subi</strong> quand il fait perdre de l’énergie. Un même résistor peut être l’un ou l’autre selon l’appareil.</>,
      tache: { type: 'qcm', q: 'Dans quel cas l’effet Joule est-il le but de l’appareil ?', ...QCM.utile,
        expl: 'Une plaque de cuisson électrique est conçue pour chauffer par effet Joule. Dans un câble, un moteur ou un ordinateur, la chaleur due à l’effet Joule est une perte qu’on cherche à réduire.', indice: 'Quel appareil a pour fonction de produire de la chaleur ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : haute tension',
      retenir: <>
        <SvgHauteTension/>
        <ul style={puces}>
          <li><strong>Loi d’Ohm</strong> U = R × I ; <strong>puissance</strong> P = U × I = R × I² ; <strong>énergie</strong> W = P × Δt ; dans un résistor, toute l’énergie électrique devient thermique.</li>
          <li>Exemple : 240 W sous 24 V (10 A) ou sous 240 V (1,0 A) : les pertes sont divisées par 100.</li>
          <li>Moyen de s’en souvenir : <strong>« haute tension, courant faible, pertes faibles »</strong>.</li>
        </ul></>,
      texte: <>Vous savez que l’effet Joule convertit en chaleur toute l’énergie électrique reçue par un résistor, que P = U × I = R × I², que W = P × Δt, et que les pertes dans un câble valent r × I². Explorez avec d’autres résistors, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- état affiché ----------
  const U = enExplore ? ti.U : P.U, R = enExplore ? ti.R : P.R, rc = enExplore ? ti.r : 0, dtMin = enExplore ? ti.dt : P.dtMin;
  const I = U / (R + rc), PR = R * I * I, pertes = rc * I * I, Ptot = U * I, W = PR * dtMin * 60;
  const chauffe = Math.min(1, PR / 25);
  const courant = enExplore || deja('ohm');

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'resistor' ? { ...M.tirageDefiA(), reps: { P: '', W: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { L: '', Pc: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'resistor') {
      const p = lireNombre(defi.reps.P), w = lireNombre(defi.reps.W);
      const okP = isFinite(p) && proche(p, defi.P, 0.06), okW = isFinite(w) && proche(w, defi.W / 1000, 0.1);
      setDefi(x => ({ ...x, verifie: true, ok: okP && okW, okP, okW })); noterA(okP && okW);
    } else {
      const l = lireNombre(defi.reps.L), c = lireNombre(defi.reps.Pc);
      const okL = isFinite(l) && proche(l, defi.pertes, 0.12), okC = isFinite(c) && proche(c, defi.part, 0.12);
      setDefi(x => ({ ...x, verifie: true, ok: okL && okC, okL, okC })); noterB(okL && okC);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('jou-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  const diagnosticA = () => {
    const x = defi, msgs = [], p = lireNombre(x.reps.P), w = lireNombre(x.reps.W);
    if (!isFinite(p)) msgs.push('Puissance : écrivez un nombre (virgule ou point).');
    else if (!x.okP) {
      if (proche(p, x.I, 0.06)) msgs.push('Puissance : cette valeur est l’intensité I = U ÷ R ; la puissance est P = U × I.');
      else if (proche(p, x.R * x.I, 0.06)) msgs.push('Puissance : cette valeur est la tension U = R × I ; il manque un facteur I (P = U × I = R × I²).');
      else if (proche(p, x.U * x.R, 0.06)) msgs.push('Puissance : il faut diviser la tension par la résistance pour avoir I, pas les multiplier.');
      else msgs.push(`Puissance : I = U ÷ R = ${x.U} ÷ ${x.R}, puis P = U × I. Votre valeur est ${p > x.P ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(w)) msgs.push('Énergie : écrivez un nombre (virgule ou point).');
    else if (!x.okW) {
      if (proche(w, x.P * x.dtMin / 1000, 0.1)) msgs.push('Énergie : la durée est restée en minutes ; convertissez-la en secondes (1 min = 60 s).');
      else if (proche(w, x.W, 0.1)) msgs.push('Énergie : cette valeur est en joules ; l’énergie est demandée en kilojoules (1 kJ = 1 000 J).');
      else if (isFinite(p) && !x.okP && proche(w, p * x.dtMin * 60 / 1000, 0.1)) msgs.push('Énergie : votre calcul est cohérent avec votre puissance, mais celle-ci n’est pas la bonne. Reprenez P = U × I.');
      else msgs.push(`Énergie : W = P × Δt avec Δt = ${x.dtMin} min = ${x.dtMin * 60} s, résultat en kJ. Votre valeur est ${w > x.W / 1000 ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, msgs = [], l = lireNombre(x.reps.L), c = lireNombre(x.reps.Pc);
    if (!isFinite(l)) msgs.push('Pertes : écrivez un nombre (virgule ou point).');
    else if (!x.okL) {
      if (proche(l, x.r * x.I, 0.12)) msgs.push('Pertes : le carré de l’intensité a été oublié : pertes = r × I² = r × I × I.');
      else if (proche(l, x.r * x.P, 0.12) || proche(l, x.r * x.P * x.P, 0.12)) msgs.push('Pertes : l’intensité qui traverse le câble est I = P ÷ U (puissance divisée par la tension), pas la puissance P.');
      else msgs.push(`Pertes : I = P ÷ U = ${x.P} ÷ ${x.U}, puis pertes = r × I² avec r = ${String(x.r).replace('.', ',')} Ω. Votre valeur est ${l > x.pertes ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(c)) msgs.push('Part perdue : écrivez un nombre (virgule ou point).');
    else if (!x.okC) {
      if (isFinite(l) && !x.okL && proche(c, 100 * l / x.P, 0.12)) msgs.push('Part perdue : votre calcul est cohérent avec vos pertes, mais celles-ci ne sont pas les bonnes. Reprenez pertes = r × I².');
      else if (proche(c, x.pertes / x.P, 0.12)) msgs.push('Part perdue : c’est une fraction ; multipliez par 100 pour un pourcentage.');
      else msgs.push(`Part perdue : (pertes ÷ puissance transportée P = ${x.P} W) × 100, en pourcentage. Votre valeur est ${c > x.part ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'resistor'
    ? `Intensité : I = U ÷ R = ${defi.U} ÷ ${defi.R} = ${fmt2(defi.I)} A. Puissance : P = U × I = ${defi.U} × ${fmt2(defi.I)} ≈ ${fmt2(defi.P)} W (ou R × I²). Énergie : Δt = ${defi.dtMin} min = ${defi.dtMin * 60} s ; W = P × Δt ≈ ${fmt2(defi.W / 1000)} kJ. Un écart vient souvent de la durée laissée en minutes.`
    : `Intensité dans le câble : I = P ÷ U = ${defi.P} ÷ ${defi.U} = ${fmt2(defi.I)} A. Pertes : r × I² = ${String(defi.r).replace('.', ',')} × ${fmt2(defi.I)}² ≈ ${fmt2(defi.pertes)} W. Part perdue : ${fmt2(defi.pertes)} ÷ ${defi.P} × 100 ≈ ${fmt2(defi.part)} %.`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['resistor', 'Résistor chauffant'], ['cable', 'Pertes dans un câble']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'resistor' ? 'Défi : résistor chauffant' : 'Défi : pertes dans un câble'}</div>
      {defi.type === 'resistor' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un résistor de résistance <strong>R = {defi.R} Ω</strong> est branché sur une source de tension <strong>U = {defi.U} V</strong> pendant <strong>{defi.dtMin} minutes</strong>. Calculez la <strong>puissance P</strong> dissipée (en W) et l’<strong>énergie thermique</strong> dégagée (en kJ). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>P (W) =</span>{champ('P', 'Puissance dissipée en watts', defi.verifie && defi.okP)}
          <span>W (kJ) =</span>{champ('W', 'Énergie thermique en kilojoules', defi.verifie && defi.okW)}
        </div>
        <IndiceDefi cache={false}>I = U ÷ R (loi d’Ohm), puis P = U × I. L’énergie est W = P × Δt avec Δt en secondes (1 min = 60 s) ; 1 kJ = 1 000 J.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un appareil de puissance <strong>P = {defi.P} W</strong> est alimenté sous <strong>U = {defi.U} V</strong> par un câble de résistance <strong>r = {String(defi.r).replace('.', ',')} Ω</strong>. Calculez la <strong>puissance perdue</strong> par effet Joule dans le câble (en W) et la <strong>part</strong> qu’elle représente de la puissance transportée (en %). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>pertes (W) =</span>{champ('L', 'Puissance perdue en watts', defi.verifie && defi.okL)}
          <span>part (%) =</span>{champ('Pc', 'Part perdue en pourcentage', defi.verifie && defi.okC)}
        </div>
        <IndiceDefi cache={false}>I = P ÷ U est l’intensité dans le câble. Pertes = r × I². Part en % = pertes ÷ P × 100.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="jou-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'resistor' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Courant continu</strong>, tension constante aux bornes du générateur.</li>
      <li><strong>Résistance constante</strong> : en réalité, la résistance d’un résistor ou d’un fil varie avec la température ; ici elle ne change pas.</li>
      <li><strong>Conversion intégrale</strong> : toute l’énergie électrique reçue par un résistor est convertie en énergie thermique (aucune autre forme d’énergie).</li>
      <li><strong>Câble</strong> : sa résistance r est supposée connue et placée en série avec le résistor dans l’exploration ; dans les exercices d’alimentation d’un appareil, la tension donnée est celle de l’installation.</li>
      <li><strong>Température</strong> : la simulation ne calcule pas l’élévation de température (elle dépend de la masse et des échanges thermiques), seulement la puissance et l’énergie.</li>
      <li><strong>Valeurs inventées</strong> : résistances, tensions et câbles de la simulation ne correspondent pas à un appareil réel.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Un générateur et un résistor</div>
      <SceneJoule chauffe={chauffe} courant={courant} cable={enExplore && rc > 0}/>
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="jou-u" label="Tension du générateur U" valeur={ti.U} onChange={v => setTi(s => ({ ...s, U: v }))} options={M.TENSIONS.map(v => [v, `${v} V`])}/>
      <Sel id="jou-r" label="Résistance du résistor R" valeur={ti.R} onChange={v => setTi(s => ({ ...s, R: v }))} options={M.RESISTANCES.map(v => [v, `${v} Ω`])}/>
      <Sel id="jou-t" label="Durée de fonctionnement" valeur={ti.dt} onChange={v => setTi(s => ({ ...s, dt: v }))} options={[1, 5, 10, 30].map(v => [v, `${v} min`])}/>
      <Sel id="jou-c" label="Câble en série (résistance r)" valeur={ti.r} onChange={v => setTi(s => ({ ...s, r: v }))} options={[[0, 'aucun câble'], [0.2, '0,2 Ω'], [0.5, '0,5 Ω'], [1, '1,0 Ω']]}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Augmentez la tension ou diminuez la résistance : le courant, la puissance et la chaleur dégagée augmentent.</div>
    </div>);
  const mesures = (enExplore || (enGuide && deja('ohm'))) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs calculées pour les réglages choisis.</div>}
      <LigneMesure nom="Tension U du générateur" valeur={`${U}${NB}V`}/>
      <LigneMesure nom="Résistance R du résistor" valeur={`${R}${NB}Ω`} couleur={COL.gris}/>
      {(enExplore || deja('puissance')) && <LigneMesure nom="Intensité I" valeur={`${nbf(I, 2)}${NB}A`} couleur={COL.orange}/>}
      {(enExplore || deja('energie')) && <LigneMesure nom="Puissance dissipée dans le résistor" valeur={`${gd(PR)}${NB}W`} couleur={COL.vert}/>}
      {(enExplore || deja('thermique')) && <LigneMesure nom={`Énergie thermique en ${dtMin} min`} valeur={W >= 10000 ? `${nbf(W / 1000, 1)}${NB}kJ` : `${gd(W)}${NB}J`} couleur={COL.rouge}/>}
      {enExplore && rc > 0 && <LigneMesure nom="Pertes dans le câble r × I²" valeur={`${gd(pertes)}${NB}W`} couleur={COL.rouge}/>}
      {enExplore && rc > 0 && <LigneMesure nom="Puissance fournie U × I" valeur={`${gd(Ptot)}${NB}W`}/>}
      {enExplore && rc > 0 && <LigneMesure nom="Part perdue dans le câble" valeur={`${nbf(100 * pertes / Ptot, 1)}${NB}%`} couleur={COL.rouge}/>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Avec 24 Ω, passez de 12 V à 24 V : par combien la puissance est-elle multipliée ?</li>
      <li>Avec 12 V, passez de 24 Ω à 5 Ω : que devient l’intensité ? Et la puissance ?</li>
      <li>Ajoutez un câble de 1,0 Ω en série avec le résistor de 5 Ω : quelle part de la puissance est perdue dans le câble ?</li>
      <li>Même câble de 1,0 Ω, mais résistor de 100 Ω : la part perdue augmente-t-elle ou diminue-t-elle ?</li>
      <li>Comparez l’énergie thermique en 5 min et en 30 min : le rapport est-il celui des durées ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Loi d’Ohm : U = R × I</li>
        <li>Puissance reçue par un résistor : P = U × I = R × I²</li>
        <li>Énergie transférée : W = P × Δt (J, W, s)</li>
        <li>Effet Joule : toute l’énergie électrique reçue est convertie en énergie thermique</li>
        <li>Pertes dans un câble : r × I² ; à puissance fixée, haute tension donc faible intensité</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .jou-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .jou-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .jou-col { display: flex; flex-direction: column; gap: 12px; }
        .jou-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .jou-l1.cote .jou-carte { order: 2; } .jou-l1.cote .jou-main { order: 1; }
          .jou-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .jou-ex > * { grid-column: 1; }
          .jou-ex > .jou-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .jou-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .jou-in { animation: jou-fondu 0.35s ease-out; } @keyframes jou-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Effet Joule : chaleur et pertes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un résistor <strong>convertit en chaleur</strong> toute l’énergie électrique qu’il reçoit : c’est l’<strong>effet Joule</strong>. On calcule sa <strong>puissance</strong>, l’<strong>énergie thermique</strong> dégagée et les <strong>pertes</strong> dans un câble.</div>
      {!enExplore && <div className={`jou-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="jou-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="jou-carte">{panneauHypo}</div>}
        <div className="jou-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'resistor' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="jou-col">
            <div className="jou-in">{scene}</div>
            {mesures && <div className="jou-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="jou-ex">
          {scene}
          <div className="jou-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
