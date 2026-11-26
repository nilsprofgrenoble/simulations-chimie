import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./eulerChuteModele";
import { QCM } from "./eulerChuteQcm";
import { EulerChuteExplore } from "./EulerChuteExplore";
import { SceneBilan, SceneEuler, SvgEquationCarte, SvgEulerCarte, SvgPasCarte } from "./EulerChuteSchemas";

const SIM_ID = 271, CLE_GUIDE = 'euler-chute-guide-v1';
declarerDefis(SIM_ID, [['limite', 'Accélération initiale et vitesse limite avec la poussée d’Archimède'], ['euler', 'Deux pas de la méthode d’Euler']]);

// ====================================================
//  SIM 271 — CHUTE AVEC FROTTEMENT VISQUEUX (2) : ÉQUATION DIFFÉRENTIELLE ET MÉTHODE D'EULER (TSTL, enseignement PCM, partie « Interactions »).
//  Une seule idée : m dv/dt = m g − m_f g − k v ; v_lim = (m − m_f) g ÷ k ; résolution approchée pas à pas v_(i+1) = v_i + a_i Δt ; effet du pas.
//  Capacités visées (jamais affichées) : établir l'équation différentielle du mouvement ; en déduire v_lim et τ ; résoudre numériquement par la méthode d'Euler. Objet lâché dans un fluide : situation générique inventée.
//  Modèle : eulerChuteModele.js (test node). QCM : eulerChuteQcm.js. Schémas : EulerChuteSchemas.jsx. Exploration animée : EulerChuteExplore.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };

// ====================================================
export function SimulationEulerChute() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('limite');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ k: 4, mf: 0.4, dt: 0.2 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const IDS = ['poussee', 'equation', 'a0', 'vlim', 'effet', 'euler1', 'euler2', 'formule', 'pas', 'grand', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const ETAPES = [
    { id: 'poussee', titre: 'Trois forces sur l’objet', focus: ['scene'],
      texte: <>Un objet de masse <strong>m = 2,0 kg</strong> est lâché sans vitesse dans un fluide. En plus du <strong>poids P = m g</strong> et du <strong>frottement f = k v</strong>, il subit la <strong>poussée d’Archimède Π</strong>. Cette poussée est <strong>égale au poids du fluide déplacé</strong> : Π = m<sub>f</sub> g, où m<sub>f</sub> est la masse de fluide déplacé par l’objet (ici <strong>m<sub>f</sub> = 0,40 kg</strong>).</>,
      tache: { type: 'qcm', q: 'La poussée d’Archimède Π est :', ...QCM.poussee,
        expl: 'Le fluide pousse l’objet vers le haut avec une force égale au poids du fluide déplacé : Π = m_f g.', indice: 'Un objet immergé « paraît plus léger » : la poussée est-elle vers le haut ou vers le bas ?' } },
    { id: 'equation', titre: 'L’équation différentielle', focus: ['scene'],
      texte: <>On applique la deuxième loi de Newton à l’objet, sur un axe vertical orienté <strong>vers le bas</strong> : <strong>m a = P − Π − f</strong>. L’accélération est la dérivée de la vitesse : <strong>a = dv/dt</strong>.</>,
      tache: { type: 'qcm', q: 'En remplaçant P, Π et f, l’équation différentielle s’écrit :', ...QCM.equation,
        expl: 'P et Π sont verticales de sens opposés, f s’oppose au mouvement : m dv/dt = m g − m_f g − k v.', indice: 'La poussée et le frottement sont dirigés vers le haut, le poids vers le bas : quels signes dans P − Π − f ?' } },
    { id: 'a0', titre: 'L’accélération au départ', focus: ['scene'],
      texte: <>On divise l’équation par m : <strong>dv/dt = g (1 − m<sub>f</sub> ÷ m) − (k ÷ m) v</strong>. À t = 0, v = 0 : il ne reste que le premier terme, <strong>A = g (1 − m<sub>f</sub> ÷ m)</strong>. Ici m = 2,0 kg, m<sub>f</sub> = 0,40 kg et g = 9,8 m/s².</>,
      tache: { type: 'num', q: 'Accélération initiale A, en m/s²', unite: 'm/s²', vrai: PG.a0, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[9.8, 'Vous avez oublié la poussée d’Archimède : A = g (1 − m_f ÷ m).'], [9.8 - 0.4, 'Il faut diviser m_f par m avant de multiplier par g : A = g (1 − m_f ÷ m).']],
        calcul: () => ['À t = 0, v = 0 : A = g (1 − m_f ÷ m) = 9,8 × (1 − 0,40 ÷ 2,0).', 'A = 9,8 × 0,80 = 7,84 ≈ 7,8 m/s².'], expl: 'A = 9,8 × (1 − 0,20) = 7,84 ≈ 7,8 m/s².', indice: 'Calculez d’abord m_f ÷ m = 0,40 ÷ 2,0, puis 1 moins ce nombre, puis multipliez par g.' } },
    { id: 'vlim', titre: 'La vitesse limite', focus: ['scene'],
      texte: <>En régime permanent, la vitesse est constante : <strong>dv/dt = 0</strong>, soit (m − m<sub>f</sub>) g = k v<sub>lim</sub>. On a <strong>k = 4,0 kg/s</strong>, m = 2,0 kg, m<sub>f</sub> = 0,40 kg et g = 9,8 m/s².</>,
      tache: { type: 'num', q: 'Vitesse limite v_lim, en m/s', unite: 'm/s', vrai: PG.vlim, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[2 * 9.8 / 4, 'Vous avez oublié la poussée d’Archimède : v_lim = (m − m_f) g ÷ k.'], [1.6 / 4, 'Il manque g : v_lim = (m − m_f) g ÷ k.']],
        calcul: () => ['dv/dt = 0 donne k v_lim = (m − m_f) g, donc v_lim = (m − m_f) g ÷ k.', 'v_lim = (2,0 − 0,40) × 9,8 ÷ 4,0 = 3,92 ≈ 3,9 m/s.'], expl: 'v_lim = 1,6 × 9,8 ÷ 4,0 = 3,92 ≈ 3,9 m/s.', indice: 'v_lim = (m − m_f) g ÷ k : calculez d’abord m − m_f = 2,0 − 0,40.' } },
    { id: 'effet', titre: 'Effet de la poussée d’Archimède', focus: ['scene'],
      texte: <>Sans poussée d’Archimède, le même objet (m = 2,0 kg, k = 4,0 kg/s) aurait <strong>v<sub>lim</sub> = 4,9 m/s</strong> et <strong>τ = m ÷ k = 0,50 s</strong>. On compare avec la poussée.</>,
      tache: { type: 'qcm', q: 'Avec la poussée d’Archimède, la vitesse limite et la constante de temps τ = m ÷ k :', ...QCM.effet,
        expl: 'v_lim = (m − m_f) g ÷ k diminue, mais τ = m ÷ k ne contient pas m_f : elle reste égale à 0,50 s.', indice: 'τ = m ÷ k : la masse de fluide déplacé y figure-t-elle ?' } },
    { id: 'euler1', titre: 'La méthode d’Euler : un premier pas', focus: ['scene'],
      retenirTitre: 'À retenir : l’équation et ses valeurs',
      retenir: <>
        <SvgEquationCarte/>
        <ul style={puces}>
          <li>Trois forces : poids, <strong>poussée d’Archimède Π = m<sub>f</sub> g</strong> (haut) et <strong>frottement f = k v</strong> (haut) : <strong>m dv/dt = m g − m<sub>f</sub> g − k v</strong>.</li>
          <li>Au départ : <strong>A = g (1 − m<sub>f</sub> ÷ m)</strong> ; en régime permanent, dv/dt = 0 : <strong>v<sub>lim</sub> = (m − m<sub>f</sub>) g ÷ k</strong> ; <strong>τ = m ÷ k</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« dans le fluide, l’objet est plus léger de m<sub>f</sub> »</strong>. Idée fausse : « la poussée change aussi τ ». Vrai : elle ne change que v<sub>lim</sub> et A.</li></ul></>,
      texte: <>Quand l’équation est difficile à résoudre, on calcule la vitesse <strong>pas à pas</strong> : on découpe le temps en pas de durée <strong>Δt</strong> et on suppose l’accélération constante pendant un pas, donc <strong>v(t + Δt) ≈ v(t) + a(t) × Δt</strong>. On prend <strong>Δt = 0,20 s</strong>. À t = 0, v = 0 et <strong>a = A = 7,84 m/s²</strong>.</>,
      tache: { type: 'num', q: 'Vitesse v₁ à t = 0,20 s (premier pas), en m/s', unite: 'm/s', vrai: PG.v1, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.a0, 'Il faut multiplier l’accélération par le pas : v₁ = 0 + a × Δt.'], [PG.a0 / 0.2, 'On multiplie par Δt (et non on divise).']],
        calcul: () => ['v₁ = v₀ + a₀ × Δt = 0 + 7,84 × 0,20.', 'v₁ = 1,568 ≈ 1,6 m/s.'], expl: 'v₁ = 0 + 7,84 × 0,20 = 1,568 ≈ 1,6 m/s.', indice: 'v₁ = v₀ + a₀ × Δt avec v₀ = 0.' } },
    { id: 'euler2', titre: 'Le deuxième pas', focus: ['scene'],
      texte: <>À t = 0,20 s, la vitesse n’est plus nulle : le frottement agit et l’accélération change. On la recalcule avec <strong>a₁ = A − v₁ ÷ τ</strong>, où <strong>A = 7,84 m/s²</strong>, <strong>τ = 0,50 s</strong> et <strong>v₁ = 1,6 m/s</strong>. Puis <strong>v₂ = v₁ + a₁ × Δt</strong> avec Δt = 0,20 s.</>,
      tache: { type: 'num', q: 'Vitesse v₂ à t = 0,40 s (deuxième pas), en m/s', unite: 'm/s', vrai: 2.528, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[1.6 + 7.84 * 0.2, 'L’accélération a changé : a₁ = A − v₁ ÷ τ, et non A.'], [1.6 + (7.84 - 1.6) * 0.2, 'Il faut diviser v₁ par τ : a₁ = A − v₁ ÷ τ.']],
        calcul: () => ['a₁ = A − v₁ ÷ τ = 7,84 − 1,6 ÷ 0,50 = 4,64 m/s².', 'v₂ = v₁ + a₁ × Δt = 1,6 + 4,64 × 0,20 = 2,53 ≈ 2,5 m/s.'], expl: 'a₁ = 7,84 − 3,2 = 4,64 m/s² ; v₂ = 1,6 + 4,64 × 0,20 ≈ 2,5 m/s.', indice: 'Calculez d’abord a₁ = 7,84 − 1,6 ÷ 0,50, puis v₂ = 1,6 + a₁ × 0,20.' } },
    { id: 'formule', titre: 'La règle de récurrence', focus: ['scene'],
      texte: <>On répète le même calcul à chaque pas : à partir de la vitesse v<sub>i</sub> connue à la date t<sub>i</sub>, on trouve la vitesse v<sub>i+1</sub> à la date t<sub>i</sub> + Δt.</>,
      tache: { type: 'qcm', q: 'La règle de la méthode d’Euler est :', ...QCM.formule,
        expl: 'À chaque pas, on calcule a_i = A − v_i ÷ τ avec la vitesse actuelle, puis v_(i+1) = v_i + a_i × Δt.', indice: 'Pour passer de v₁ à v₂, vous avez calculé a₁ avec v₁, puis ajouté a₁ × Δt à v₁.' } },
    { id: 'pas', titre: 'Le choix du pas Δt', focus: ['scene'],
      retenirTitre: 'À retenir : la méthode d’Euler',
      retenir: <>
        <SvgEulerCarte/>
        <ul style={puces}>
          <li>On part de <strong>v₀ = 0</strong>, puis à chaque pas : <strong>a<sub>i</sub> = A − v<sub>i</sub> ÷ τ</strong> et <strong>v<sub>i+1</sub> = v<sub>i</sub> + a<sub>i</sub> Δt</strong>.</li>
          <li>La suite obtenue est une <strong>approximation</strong> de la solution exacte v(t) = v<sub>lim</sub> (1 − e<sup>−t/τ</sup>).</li>
          <li>Moyen de s’en souvenir : <strong>« la vitesse d’avant, l’accélération qui va avec, un pas de plus »</strong>. Idée fausse : « l’accélération reste égale à A pendant toute la chute ». Vrai : elle est recalculée à chaque pas.</li></ul></>,
      texte: <>On peut choisir un pas <strong>Δt plus petit ou plus grand</strong>. La suite d’Euler est une approximation de la courbe exacte.</>,
      tache: { type: 'qcm', q: 'Un pas Δt plus petit donne une approximation :', ...QCM.pas,
        expl: 'Avec un pas plus petit, l’accélération change peu pendant un pas : la suite colle mieux à la courbe exacte, mais il faut calculer plus de pas.', indice: 'Plus Δt est petit, plus l’hypothèse « a constante pendant un pas » est proche de la réalité.' } },
    { id: 'grand', titre: 'Un pas trop grand', focus: ['scene'],
      texte: <>On prend maintenant un pas <strong>très grand</strong>, de l’ordre de la constante de temps τ (ou plus grand). Un seul pas couvre alors presque toute la montée de la vitesse.</>,
      tache: { type: 'qcm', q: 'Avec un pas Δt de l’ordre de τ ou plus grand, la méthode d’Euler est :', ...QCM.grand,
        expl: 'L’accélération calculée au début du pas est très différente de celle de la fin du pas : le résultat s’éloigne de la solution exacte et peut dépasser v_lim puis osciller.', indice: 'Si Δt vaut τ, un seul pas ajoute a × Δt = (v_lim ÷ τ) × τ = v_lim : jusqu’où va la vitesse ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : le pas',
      retenir: <>
        <SvgPasCarte/>
        <ul style={puces}>
          <li>Un <strong>petit pas</strong> (Δt très inférieur à τ) donne une suite proche de la solution exacte, au prix de plus de calculs.</li>
          <li>Un pas <strong>de l’ordre de τ ou plus</strong> donne un résultat très approximatif : la vitesse peut dépasser v<sub>lim</sub> et osciller.</li>
          <li>Moyen de s’en souvenir : <strong>« pas petit, calcul fidèle »</strong>. Idée fausse : « on peut prendre un grand pas pour aller plus vite sans rien perdre ». Vrai : la précision se paie en nombre de pas.</li></ul></>,
      texte: <>Vous savez établir l’équation différentielle d’une chute avec poussée d’Archimède et frottement, en déduire v<sub>lim</sub> et τ, et calculer la vitesse pas à pas par la méthode d’Euler. Explorez en tirant sur la poignée Δt, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SCENES = {
    poussee: ['bilan', { poussee: true, frottement: true }], equation: ['bilan', { poussee: true, frottement: true }], a0: ['bilan', {}], vlim: ['bilan', {}], effet: ['bilan', {}],
    euler1: ['euler', { nPas: 1, dt: 0.4 }], euler2: ['euler', { nPas: 2, dt: 0.4 }], formule: ['euler', { nPas: 5, dt: 0.4 }], pas: ['euler', { nPas: 12, dt: 0.25 }], grand: ['euler', { nPas: 2, dt: 1.5 }], fin: ['euler', { nPas: 12, dt: 0.25 }],
  };
  const [typeScene, propsScene] = SCENES[idEtape];

  // ════════════════ EXPLORATION ════════════════
  const animee = enExplore && <EulerChuteExplore ex={ex} setEx={setEx}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{typeScene === 'bilan' ? 'Les forces sur l’objet' : 'La vitesse : courbe exacte et calcul d’Euler'}</div>
      {typeScene === 'bilan' ? <SceneBilan {...propsScene}/> : <SceneEuler {...propsScene}/>}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'limite' ? { ...M.tirageDefiLimite(), type, reps: { a: '', v: '' }, verifie: false, corr: false } : { ...M.tirageDefiEuler(), type, reps: { v1: '', v2: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = defi;
    const ok = x.type === 'limite' ? (proche(lireNombre(x.reps.a), x.a0, 0.06) && proche(lireNombre(x.reps.v), x.vlim, 0.06)) : (proche(lireNombre(x.reps.v1), x.v1, 0.06) && proche(lireNombre(x.reps.v2), x.v2, 0.08));
    setDefi(y => ({ ...y, verifie: true, ok })); (x.type === 'limite' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, msgs = [], g = M.G;
    if (x.type === 'limite') {
      const a = lireNombre(x.reps.a), v = lireNombre(x.reps.v);
      if (!isFinite(a) || !isFinite(v)) return ['Écrivez deux nombres (virgule ou point) : A en m/s² et v_lim en m/s.'];
      if (!proche(a, x.a0, 0.06)) msgs.push(proche(a, g, 0.03) ? 'Vous avez oublié la poussée d’Archimède : A = g (1 − m_f ÷ m).' : proche(a, g - x.mf, 0.03) ? 'Il faut diviser m_f par m avant de multiplier par g : A = g (1 − m_f ÷ m).' : `Refaites : A = g (1 − m_f ÷ m) = 9,8 × (1 − ${fr(x.mf)} ÷ ${fr(x.m)}). Votre valeur est ${a > x.a0 ? 'trop grande' : 'trop petite'}.`);
      if (!proche(v, x.vlim, 0.06)) msgs.push(proche(v, x.m * g / x.k, 0.03) ? 'Vous avez oublié la poussée d’Archimède : v_lim = (m − m_f) g ÷ k.' : proche(v, (x.m - x.mf) / x.k, 0.03) ? 'Il manque g : v_lim = (m − m_f) g ÷ k.' : `Refaites : v_lim = (m − m_f) g ÷ k = (${fr(x.m)} − ${fr(x.mf)}) × 9,8 ÷ ${fr(x.k)}. Votre valeur est ${v > x.vlim ? 'trop grande' : 'trop petite'}.`);
      return msgs;
    }
    const v1 = lireNombre(x.reps.v1), v2 = lireNombre(x.reps.v2);
    if (!isFinite(v1) || !isFinite(v2)) return ['Écrivez deux nombres (virgule ou point) : v₁ et v₂ en m/s.'];
    if (!proche(v1, x.v1, 0.06)) msgs.push(proche(v1, x.a0, 0.04) ? 'Il faut multiplier l’accélération par le pas : v₁ = a₀ × Δt.' : `Refaites : a₀ = A = ${fr(x.a0.toFixed(2))} m/s² puis v₁ = 0 + a₀ × Δt = ${fr(x.a0.toFixed(2))} × ${fr(x.dt)}. Votre valeur est ${v1 > x.v1 ? 'trop grande' : 'trop petite'}.`);
    if (!proche(v2, x.v2, 0.08)) {
      const sans = v1 + x.a0 * x.dt;
      msgs.push(proche(v2, sans, 0.04) ? 'L’accélération a changé après le premier pas : a₁ = A − v₁ ÷ τ, et non A.' : `Avec VOTRE v₁ = ${fr(v1)} m/s : a₁ = A − v₁ ÷ τ = ${fr(x.a0.toFixed(2))} − ${fr(v1)} ÷ ${fr(x.tau.toFixed(2))} = ${fr((x.a0 - v1 / x.tau).toFixed(2))} m/s², puis v₂ = v₁ + a₁ × Δt = ${fr((v1 + (x.a0 - v1 / x.tau) * x.dt).toFixed(2))} m/s${proche(v2, v1 + (x.a0 - v1 / x.tau) * x.dt, 0.04) ? ' : votre calcul est juste, c’est votre v₁ qui est éloignée.' : '.'}`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'limite'
    ? `A = g (1 − m_f ÷ m) = 9,8 × (1 − ${fr(defi.mf)} ÷ ${fr(defi.m)}) = ${nbf(defi.a0, 2)} m/s² ; v_lim = (m − m_f) g ÷ k = (${fr(defi.m)} − ${fr(defi.mf)}) × 9,8 ÷ ${fr(defi.k)} = ${nbf(defi.vlim, 2)} m/s.`
    : `a₀ = A = ${nbf(defi.a0, 2)} m/s² ; v₁ = 0 + a₀ × Δt = ${nbf(defi.v1, 2)} m/s ; a₁ = A − v₁ ÷ τ = ${nbf(defi.a0, 2)} − ${nbf(defi.v1, 2)} ÷ ${nbf(defi.tau, 2)} = ${nbf(defi.a1, 2)} m/s² ; v₂ = v₁ + a₁ × Δt = ${nbf(defi.v2, 2)} m/s.`;
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} ({unite}) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en ${unite}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('eul-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['limite', 'Accélération et vitesse limite'], ['euler', 'Deux pas d’Euler']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0b4f94')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'limite' ? 'Défi : accélération initiale et vitesse limite' : 'Défi : deux pas de la méthode d’Euler'}</div>
      {defi.type === 'limite'
        ? <div style={{ ...lbl, marginBottom: 8 }}>Un objet de masse <strong>m = {fr(defi.m.toFixed(1))} kg</strong> est lâché sans vitesse dans un fluide. Il déplace une masse de fluide <strong>m<sub>f</sub> = {fr(defi.mf.toFixed(1))} kg</strong>, et le frottement vaut f = k v avec <strong>k = {fr(defi.k.toFixed(1))} kg/s</strong> (g = 9,8 N/kg). Donnez l’accélération à t = 0 (en m/s²) et la vitesse limite (en m/s), avec 2 chiffres significatifs (marge acceptée : 6 %).</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>Un objet de masse <strong>m = {fr(defi.m.toFixed(1))} kg</strong> est lâché sans vitesse dans un fluide ; masse de fluide déplacé <strong>m<sub>f</sub> = {fr(defi.mf.toFixed(1))} kg</strong>, frottement f = k v avec <strong>k = {fr(defi.k.toFixed(1))} kg/s</strong> (g = 9,8 N/kg). Avec la méthode d’Euler et un pas <strong>Δt = {fr(defi.dt)} s</strong>, calculez la vitesse v₁ à t = Δt puis v₂ à t = 2 Δt (en m/s), avec 2 chiffres significatifs (marge : 6 % sur v₁, 8 % sur v₂).</div>}
      {defi.type === 'limite' ? <>{champ('a', 'Accélération initiale A', 'm/s²', 'eul-defi-a')}{champ('v', 'Vitesse limite', 'm/s', 'eul-defi-v')}</> : <>{champ('v1', 'Vitesse v₁', 'm/s', 'eul-defi-v1')}{champ('v2', 'Vitesse v₂', 'm/s', 'eul-defi-v2')}</>}
      <IndiceDefi cache={false}>{defi.type === 'limite' ? 'A = g (1 − m_f ÷ m) ; en régime permanent dv/dt = 0 : v_lim = (m − m_f) g ÷ k.' : 'a₀ = A = g (1 − m_f ÷ m) ; v₁ = a₀ Δt ; τ = m ÷ k ; a₁ = A − v₁ ÷ τ ; v₂ = v₁ + a₁ Δt.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="eul-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
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
      <li><strong>Poussée d’Archimède</strong> Π = m<sub>f</sub> g, avec m<sub>f</sub> la masse de fluide déplacé (objet entièrement immergé) ; on suppose m<sub>f</sub> &lt; m pour que l’objet descende.</li>
      <li><strong>Frottement fluide linéaire</strong> f = k v : valable à faible vitesse ; g = 9,8 N/kg constant ; référentiel terrestre supposé galiléen ; objet ponctuel ; chute verticale sans vitesse initiale.</li>
      <li><strong>Méthode d’Euler</strong> : l’accélération est supposée constante pendant un pas Δt ; c’est une approximation de la solution exacte, d’autant meilleure que Δt est petit devant τ.</li>
      <li><strong>Solution exacte</strong> v(t) = v<sub>lim</sub> (1 − e<sup>−t/τ</sup>) : elle sert ici seulement de comparaison, la résolution analytique n’est pas exigée.</li>
      <li><strong>Pas trop grand</strong> : pour Δt ≥ τ, la suite d’Euler peut dépasser v<sub>lim</sub> et osciller (pour Δt ≥ 2 τ, elle diverge) ; on prend donc toujours Δt nettement inférieur à τ.</li>
      <li><strong>Valeurs</strong> : toutes les masses, tous les coefficients k et tous les pas sont inventés pour la simulation.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0b4f94')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Tire la poignée violette vers la droite : à partir de quel pas la suite orange s’éloigne-t-elle nettement de la courbe grise ?</li>
      <li>Choisis Δt = 0,05 s puis Δt = 0,50 s : compare l’écart à t = 3 s dans la puce « Écart ».</li>
      <li>Règle Δt égal à τ (voir la ligne « Pas par rapport à τ » dans les mesures) : que fait la vitesse au premier pas ?</li>
      <li>Change la masse de fluide déplacé : v<sub>lim</sub> et le début de la courbe changent-ils ? et τ ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>m dv/dt = m g − m<sub>f</sub> g − k v ; A = g (1 − m<sub>f</sub> ÷ m) ; v<sub>lim</sub> = (m − m<sub>f</sub>) g ÷ k ; τ = m ÷ k</li>
        <li>Euler : a<sub>i</sub> = A − v<sub>i</sub> ÷ τ puis v<sub>i+1</sub> = v<sub>i</sub> + a<sub>i</sub> Δt</li>
        <li>Pas petit : précis mais long ; Δt de l’ordre de τ : très approximatif</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .eul-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .eul-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .eul-col { display: flex; flex-direction: column; gap: 12px; }
        .eul-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .eul-l1.cote .eul-carte { order: 2; } .eul-l1.cote .eul-main { order: 1; } }
        @media (max-width: 900px) { .eul-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .eul-in { animation: eul-fondu 0.35s ease-out; } @keyframes eul-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chute avec frottement visqueux : équation différentielle et méthode d’Euler</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Avec le poids, la <strong>poussée d’Archimède</strong> et le frottement f = k v, la deuxième loi donne une <strong>équation différentielle</strong> sur la vitesse. On la résout <strong>pas à pas</strong> (méthode d’Euler) et on compare à la solution exacte.</div>
      {!enExplore && <div className={`eul-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="eul-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="eul-carte">{panneauHypo}</div>}
        <div className="eul-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'limite' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="eul-col"><div className="eul-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="eul-ex">{animee}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
