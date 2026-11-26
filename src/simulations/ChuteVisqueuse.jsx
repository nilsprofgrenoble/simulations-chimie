import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./chuteVisqueuseModele";
import { QCM } from "./chuteVisqueuseQcm";
import { ChuteVisqueuseExplore } from "./ChuteVisqueuseExplore";
import { SceneObjet, SceneCourbe, SvgRegimesCarte, SvgTauCarte, SvgEffetsCarte, GrapheLecture } from "./ChuteVisqueuseSchemas";

const SIM_ID = 270, CLE_GUIDE = 'chute-visq-guide-v1';
declarerDefis(SIM_ID, [['calcul', 'Vitesse limite et constante de temps : calcul'], ['lecture', 'Vitesse limite et constante de temps : lecture sur la courbe']]);

// ====================================================
//  SIM 270 — CHUTE VERTICALE AVEC FROTTEMENT VISQUEUX (1) (TSTL, enseignement PCM, partie « Interactions »).
//  Une seule idée : f = k v ; régime transitoire puis permanent ; v_lim = m g ÷ k ; τ = m ÷ k lue sur la courbe (63 %, tangente) ; effet de m et de k.
//  Capacités visées (jamais affichées) : exploiter une équation différentielle / une courbe v(t) ; régimes transitoire et permanent ; vitesse limite et temps caractéristique. Objet lâché dans un fluide : situation générique inventée.
//  Modèle : chuteVisqueuseModele.js (test node). QCM : chuteVisqueuseQcm.js. Schémas : ChuteVisqueuseSchemas.jsx. Exploration animée : ChuteVisqueuseExplore.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };

// ====================================================
export function SimulationChuteVisqueuse() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('calcul');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ m: 2, k: 4 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const IDS = ['forces', 'depart', 'transitoire', 'permanent', 'vlim', 'tau', 'v63', 'duree', 'masse', 'k', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const ETAPES = [
    { id: 'forces', titre: 'Un objet lâché dans un fluide', focus: ['scene'],
      texte: <>Un objet est lâché sans vitesse initiale dans un <strong>fluide</strong> (un liquide épais, par exemple). On étudie sa chute verticale. Deux forces agissent (on néglige la poussée d’Archimède) : le <strong>poids P = m g</strong>, vers le bas, et le <strong>frottement du fluide f</strong>, vers le haut, dont la valeur est proportionnelle à la vitesse : <strong>f = k v</strong>. Le coefficient <strong>k</strong> s’exprime en kg/s.</>,
      tache: { type: 'qcm', q: 'La force de frottement f exercée par le fluide est :', ...QCM.forces,
        expl: 'Le fluide s’oppose au mouvement : f est dirigée vers le haut, et f = k v augmente avec la vitesse v.', indice: 'Le frottement s’oppose au mouvement de l’objet. Que devient f = k v quand v augmente ?' } },
    { id: 'depart', titre: 'Au moment du lâcher', focus: ['scene'],
      texte: <>À l’instant t = 0, l’objet est lâché sans vitesse : <strong>v = 0</strong>.</>,
      tache: { type: 'qcm', q: 'À t = 0, l’accélération de l’objet est :', ...QCM.depart,
        expl: 'v = 0 donne f = k v = 0 : seul le poids agit, la deuxième loi de Newton donne a = g (g = 9,8 m/s²).', indice: 'Que vaut f = k v quand v = 0 ? Quelle force reste-t-il ?' } },
    { id: 'transitoire', titre: 'Pendant la chute', focus: ['scene'],
      texte: <>L’objet accélère : sa vitesse <strong>v augmente</strong>. Le poids reste constant, mais le frottement f = k v change. La somme des forces, dirigée vers le bas, vaut P − f ; l’accélération vaut <strong>a = (P − f) ÷ m</strong>.</>,
      tache: { type: 'qcm', q: 'Quand la vitesse v augmente :', ...QCM.transitoire,
        expl: 'f = k v augmente, donc P − f diminue et a = (P − f) ÷ m diminue : la vitesse augmente de plus en plus lentement. C’est le régime transitoire.', indice: 'P est constant. Si f augmente, que devient P − f ? et a = (P − f) ÷ m ?' } },
    { id: 'permanent', titre: 'Le régime permanent', focus: ['scene'],
      texte: <>Au bout d’un certain temps, la vitesse n’augmente presque plus : le frottement a atteint la valeur du poids. C’est le <strong>régime permanent</strong>.</>,
      tache: { type: 'qcm', q: 'En régime permanent, quand f = P :', ...QCM.permanent,
        expl: 'f = P donne ΣF = 0, donc a = 0 : d’après le principe d’inertie, la vitesse est constante. Cette valeur est la vitesse limite v_lim.', indice: 'Si f = P, que vaut la somme des forces ? Que vaut alors a ?' } },
    { id: 'vlim', titre: 'La vitesse limite', focus: ['scene'],
      retenirTitre: 'À retenir : les deux régimes',
      retenir: <>
        <SvgRegimesCarte/>
        <ul style={puces}>
          <li>Au départ v = 0, f = 0 et <strong>a = g</strong> ; puis v augmente, f = k v augmente et <strong>a diminue</strong> : c’est le <strong>régime transitoire</strong>.</li>
          <li>Quand <strong>f = P</strong>, on a <strong>a = 0</strong> : la vitesse est constante et vaut la <strong>vitesse limite v<sub>lim</sub></strong> : c’est le <strong>régime permanent</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« plus il va vite, plus le fluide le retient, jusqu’à l’équilibre »</strong>. Idée fausse : « en régime permanent, plus aucune force ne s’exerce ». Vrai : P et f sont là, mais elles se compensent.</li></ul></>,
      texte: <>En régime permanent, f = P, soit <strong>k v<sub>lim</sub> = m g</strong>. L’objet a pour masse <strong>m = 2,0 kg</strong> et le coefficient de frottement vaut <strong>k = 4,0 kg/s</strong> (g = 9,8 N/kg).</>,
      tache: { type: 'num', q: 'Vitesse limite v_lim, en m/s', unite: 'm/s', vrai: PG.vlim, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.m * 9.8 * PG.k, 'Il faut diviser par k : v_lim = m g ÷ k.'], [PG.m / PG.k, 'C’est m ÷ k, la constante de temps : v_lim = m g ÷ k.']],
        calcul: () => ['f = P donne k v_lim = m g, donc v_lim = m g ÷ k.', 'v_lim = 2,0 × 9,8 ÷ 4,0 = 4,9 m/s.'], expl: 'v_lim = m g ÷ k = 2,0 × 9,8 ÷ 4,0 = 4,9 m/s.', indice: 'Écrivez f = P avec f = k v_lim et P = m g, puis isolez v_lim.' } },
    { id: 'tau', titre: 'La constante de temps', focus: ['scene'],
      texte: <>La rapidité avec laquelle la vitesse approche v<sub>lim</sub> est donnée par la <strong>constante de temps τ = m ÷ k</strong> (en secondes). Même objet : <strong>m = 2,0 kg</strong>, <strong>k = 4,0 kg/s</strong>.</>,
      tache: { type: 'num', q: 'Constante de temps τ, en s', unite: 's', vrai: PG.tau, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.k / PG.m, 'Le quotient est inversé : τ = m ÷ k.'], [PG.vlim, 'C’est la vitesse limite : τ = m ÷ k.']],
        calcul: () => ['τ = m ÷ k = 2,0 ÷ 4,0.', 'τ = 0,50 s. Vérification des unités : kg ÷ (kg/s) = s.'], expl: 'τ = m ÷ k = 2,0 ÷ 4,0 = 0,50 s.', indice: 'τ = m ÷ k, avec m en kg et k en kg/s.' } },
    { id: 'v63', titre: 'Lire τ sur la courbe', focus: ['scene'],
      texte: <>Sur la courbe v(t), la <strong>tangente à l’origine</strong> coupe l’asymptote v<sub>lim</sub> à la date t = τ. À cette date, la vitesse atteint <strong>63 % de v<sub>lim</sub></strong>. Ici <strong>v<sub>lim</sub> = 4,9 m/s</strong> et <strong>τ = 0,50 s</strong>.</>,
      tache: { type: 'num', q: 'Vitesse v à la date t = τ, en m/s', unite: 'm/s', vrai: PG.v63, tol: 0.04, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.vlim * 0.37, 'La vitesse atteint 63 % de v_lim (et non 37 %).'], [PG.vlim, 'À t = τ, la vitesse n’a pas encore atteint v_lim : seulement 63 % de v_lim.']],
        calcul: () => ['À t = τ : v = 63 % de v_lim = 0,63 × 4,9.', 'v ≈ 3,1 m/s.'], expl: 'v(τ) = 0,63 × 4,9 ≈ 3,1 m/s.', indice: '63 % se calcule en multipliant par 0,63.' } },
    { id: 'duree', titre: 'La durée du régime transitoire', focus: ['scene'],
      retenirTitre: 'À retenir : v_lim et τ',
      retenir: <>
        <SvgTauCarte/>
        <ul style={puces}>
          <li><strong>v<sub>lim</sub> = m g ÷ k</strong> (en m/s) et <strong>τ = m ÷ k</strong> (en s).</li>
          <li>À la date <strong>τ</strong>, la vitesse vaut <strong>63 %</strong> de v<sub>lim</sub> ; la tangente à l’origine (pente g) coupe l’asymptote à t = τ.</li>
          <li>Le régime permanent est atteint au bout d’environ <strong>5 τ</strong> (v ≈ 99 % de v<sub>lim</sub>). Moyen de s’en souvenir : <strong>« 63 % en τ, presque fini en 5 τ »</strong>.</li></ul></>,
      texte: <>On considère que le régime permanent est atteint au bout de <strong>5 τ</strong> : la vitesse vaut alors 99 % de v<sub>lim</sub>. Ici <strong>τ = 0,50 s</strong>.</>,
      tache: { type: 'num', q: 'Durée du régime transitoire (5 τ), en s', unite: 's', vrai: PG.t5, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.tau, 'C’est τ : la durée du régime transitoire est 5 τ.'], [PG.vlim * 5, 'On multiplie la constante de temps τ (en s) par 5, pas la vitesse limite.']],
        calcul: () => ['Durée du régime transitoire ≈ 5 τ = 5 × 0,50.', '5 τ = 2,5 s.'], expl: '5 τ = 5 × 0,50 = 2,5 s.', indice: 'Multipliez τ par 5.' } },
    { id: 'masse', titre: 'Un objet plus lourd', focus: ['scene'],
      texte: <>On refait la chute avec le <strong>même fluide</strong> (même k) et un objet de <strong>masse double</strong>.</>,
      tache: { type: 'qcm', q: 'Avec une masse double, la vitesse limite et la constante de temps :', ...QCM.masse,
        expl: 'v_lim = m g ÷ k et τ = m ÷ k sont proportionnelles à m : elles sont toutes deux multipliées par 2.', indice: 'Dans v_lim = m g ÷ k et τ = m ÷ k, comment m intervient-elle ?' } },
    { id: 'k', titre: 'Un fluide plus visqueux', focus: ['scene'],
      texte: <>On refait la chute avec la <strong>même masse</strong> dans un fluide où le coefficient de frottement <strong>k est doublé</strong>.</>,
      tache: { type: 'qcm', q: 'Avec k doublé, la vitesse limite et la constante de temps :', ...QCM.k,
        expl: 'v_lim = m g ÷ k et τ = m ÷ k sont inversement proportionnelles à k : elles sont toutes deux divisées par 2.', indice: 'Dans v_lim = m g ÷ k et τ = m ÷ k, k est au dénominateur.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : effet de m et de k',
      retenir: <>
        <SvgEffetsCarte/>
        <ul style={puces}>
          <li>Une masse plus grande augmente <strong>v<sub>lim</sub></strong> et <strong>τ</strong> (proportionnelles à m).</li>
          <li>Un frottement plus fort (k plus grand) diminue <strong>v<sub>lim</sub></strong> et <strong>τ</strong> (inversement proportionnelles à k).</li>
          <li>Moyen de s’en souvenir : <strong>« la masse pousse, le frottement retient »</strong>. Idée fausse : « un objet lourd atteint plus vite sa vitesse limite ». Vrai : sa constante de temps est plus grande.</li></ul></>,
      texte: <>Vous savez décrire une chute avec frottement visqueux : régimes transitoire et permanent, vitesse limite v<sub>lim</sub> = m g ÷ k, constante de temps τ = m ÷ k et lecture de τ sur la courbe. Explorez en déplaçant la vitesse limite sur le graphe, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SCENES = {
    forces: ['objet', { fr: 0.5 }], depart: ['objet', { fr: 0 }], transitoire: ['objet', { fr: 0.5 }], permanent: ['objet', { fr: 1 }],
    vlim: ['courbe', { asymp: true }], tau: ['courbe', { asymp: true, tangente: true }], v63: ['courbe', { asymp: true, tangente: true, point: true }], duree: ['courbe', { asymp: true, tangente: true, point: true, zones: true }],
    masse: ['courbe', { asymp: true }], k: ['courbe', { asymp: true }], fin: ['courbe', { asymp: true, tangente: true, point: true, zones: true }],
  };
  const [typeScene, propsScene] = SCENES[idEtape];

  // ════════════════ EXPLORATION ════════════════
  const animee = enExplore && <ChuteVisqueuseExplore ex={ex} setEx={setEx}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{typeScene === 'objet' ? 'L’objet dans le fluide' : 'La vitesse au cours du temps'}</div>
      {typeScene === 'objet' ? <SceneObjet {...propsScene}/> : <SceneCourbe {...propsScene}/>}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'calcul' ? { ...M.tirageDefiCalcul(), type, reps: { v: '', t: '' }, verifie: false, corr: false } : { ...M.tirageDefiLecture(), type, reps: { v: '', t: '', k: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = defi, v = lireNombre(x.reps.v), t = lireNombre(x.reps.t);
    const ok = x.type === 'calcul' ? (proche(v, x.vlim, 0.06) && proche(t, x.tau, 0.06)) : (proche(v, x.vlim, 0.1) && proche(t, x.tau, 0.2) && proche(lireNombre(x.reps.k), x.k, 0.25));
    setDefi(y => ({ ...y, verifie: true, ok })); (x.type === 'calcul' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, msgs = [], g = M.G, v = lireNombre(x.reps.v), t = lireNombre(x.reps.t);
    if (!isFinite(v) || !isFinite(t) || (x.type === 'lecture' && !isFinite(lireNombre(x.reps.k)))) return [x.type === 'calcul' ? 'Écrivez deux nombres (virgule ou point) : v_lim en m/s et τ en s.' : 'Écrivez trois nombres (virgule ou point) : v_lim en m/s, τ en s et k en kg/s.'];
    if (x.type === 'calcul') {
      if (!proche(v, x.vlim, 0.06)) msgs.push(proche(v, x.m * g, 0.05) ? 'Il faut diviser par k : v_lim = m g ÷ k.' : proche(v, x.m / x.k, 0.05) ? 'C’est la constante de temps m ÷ k : v_lim = m g ÷ k.' : `Refaites : v_lim = m g ÷ k = ${fr(x.m)} × 9,8 ÷ ${fr(x.k)}. Votre valeur est ${v > x.vlim ? 'trop grande' : 'trop petite'}.`);
      if (!proche(t, x.tau, 0.06)) msgs.push(proche(t, x.k / x.m, 0.05) ? 'Le quotient est inversé : τ = m ÷ k.' : proche(t, x.vlim, 0.05) ? 'Vous avez donné la vitesse limite : τ = m ÷ k, en secondes.' : `Refaites : τ = m ÷ k = ${fr(x.m)} ÷ ${fr(x.k)}. Votre valeur est ${t > x.tau ? 'trop grande' : 'trop petite'}.`);
      return msgs;
    }
    const k = lireNombre(x.reps.k);
    if (!proche(v, x.vlim, 0.1)) msgs.push(`Lisez la valeur vers laquelle la courbe se stabilise (le palier), sur l’axe des vitesses. Votre v_lim est ${v > x.vlim ? 'trop grande' : 'trop petite'}.`);
    if (!proche(t, x.tau, 0.2)) msgs.push(proche(t, 5 * x.tau, 0.2) ? 'Vous avez lu la fin du régime transitoire (5 τ) : τ est la date où la vitesse atteint 63 % de v_lim.' : `Cherchez la date où la vitesse atteint 63 % de v_lim (0,63 × votre v_lim = ${fr((0.63 * v).toFixed(1))} m/s). Votre τ est ${t > x.tau ? 'trop grand' : 'trop petit'}.`);
    if (!proche(k, x.k, 0.25)) msgs.push(proche(k, x.m * t, 0.1) ? 'Le quotient est inversé : k = m ÷ τ.' : `Avec vos valeurs : k = m ÷ τ = ${fr(x.m)} ÷ ${fr(t)} = ${fr((x.m / t).toFixed(1))} kg/s${proche(k, x.m / t, 0.1) ? ' : votre calcul est juste, c’est votre lecture de τ qui est trop éloignée.' : '.'}`);
    return msgs;
  };
  const correction = () => defi.type === 'calcul'
    ? `v_lim = m g ÷ k = ${fr(defi.m)} × 9,8 ÷ ${fr(defi.k)} = ${nbf(defi.vlim, 1)} m/s ; τ = m ÷ k = ${fr(defi.m)} ÷ ${fr(defi.k)} = ${nbf(defi.tau, 2)} s.`
    : `v_lim = ${nbf(defi.vlim, 0)} m/s (palier de la courbe) ; τ = date où v = 63 % de v_lim, soit 0,63 × ${nbf(defi.vlim, 0)} ≈ ${nbf(0.63 * defi.vlim, 1)} m/s : τ ≈ ${nbf(defi.tau, 1)} s ; k = m ÷ τ = ${fr(defi.m)} ÷ ${nbf(defi.tau, 1)} ≈ ${nbf(defi.k, 1)} kg/s.`;
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} ({unite}) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en ${unite}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('cvq-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['calcul', 'Calcul'], ['lecture', 'Lecture de la courbe']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0b4f94')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'calcul' ? 'Défi : vitesse limite et constante de temps' : 'Défi : lire la vitesse limite et τ sur la courbe'}</div>
      {defi.type === 'calcul'
        ? <div style={{ ...lbl, marginBottom: 8 }}>Un objet de masse <strong>m = {fr(defi.m.toFixed(1))} kg</strong> est lâché sans vitesse dans un fluide : le frottement vaut f = k v avec <strong>k = {fr(defi.k.toFixed(1))} kg/s</strong> (g = 9,8 N/kg, poussée d’Archimède négligée). Donnez la vitesse limite (en m/s) et la constante de temps (en s), avec 2 chiffres significatifs (marge acceptée : 6 %).</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>Un objet de masse <strong>m = {fr(defi.m.toFixed(1))} kg</strong> est lâché sans vitesse dans un fluide (frottement f = k v). On a enregistré sa vitesse au cours du temps (courbe ci-dessous). Lisez la vitesse limite (en m/s) et la constante de temps τ (en s), puis déduisez le coefficient k (en kg/s). Marge acceptée : 10 % sur la vitesse limite, 20 % sur τ et 25 % sur k (la lecture sur la courbe n’est pas plus précise).</div>}
      {defi.type === 'lecture' && <GrapheLecture vlim={defi.vlim} tau={defi.tau} maxWidth={440}/>}
      {champ('v', 'Vitesse limite', 'm/s', 'cvq-defi-v')}{champ('t', 'Constante de temps τ', 's', 'cvq-defi-t')}{defi.type === 'lecture' && champ('k', 'Coefficient k', 'kg/s', 'cvq-defi-k')}
      <IndiceDefi cache={false}>{defi.type === 'calcul' ? 'En régime permanent f = P : v_lim = m g ÷ k ; τ = m ÷ k (en s).' : 'v_lim est le palier de la courbe ; τ est la date où v atteint 63 % de v_lim (ou où la tangente à l’origine coupe le palier) ; k = m ÷ τ.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cvq-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
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
      <li><strong>Frottement fluide linéaire</strong> : f = k v, valable à faible vitesse dans un fluide visqueux (écoulement non turbulent). À grande vitesse, le frottement varie plutôt comme v² : le modèle ne s’applique plus.</li>
      <li><strong>Poussée d’Archimède négligée</strong> : elle est prise en compte dans la simulation suivante (elle diminue la vitesse limite).</li>
      <li><strong>Chute verticale sans vitesse initiale</strong> ; g = 9,8 N/kg constant ; référentiel terrestre supposé galiléen ; objet ponctuel.</li>
      <li><strong>Régime permanent « atteint » à 5 τ</strong> : à cette date, la vitesse vaut 99 % de v<sub>lim</sub> ; mathématiquement, v<sub>lim</sub> n’est jamais exactement atteinte.</li>
      <li><strong>Lecture de τ</strong> : la valeur lue sur une courbe a une incertitude de quelques pourcents ; les défis de lecture tolèrent donc 10 à 25 %.</li>
      <li><strong>Valeurs</strong> : toutes les masses et tous les coefficients k sont inventés pour la simulation.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0b4f94')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Déplace la poignée rouge vers le haut puis vers le bas : que devient la constante de temps τ ? la durée du régime transitoire ?</li>
      <li>Lâche l’objet : quand la règle défile-t-elle à vitesse constante ? que valent alors f et P ?</li>
      <li>Compare 1 kg et 4 kg avec le même k : laquelle des deux chutes atteint le plus vite sa vitesse limite ?</li>
      <li>Vérifie que la tangente à l’origine coupe la ligne rouge à la date τ, pour plusieurs réglages.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Frottement f = k v ; au départ a = g, puis a diminue : régime transitoire</li>
        <li>Régime permanent : f = P, a = 0, v = v_lim = m g ÷ k</li>
        <li>τ = m ÷ k : v = 63 % de v_lim à t = τ ; régime permanent vers 5 τ</li>
        <li>m ↑ : v_lim et τ augmentent ; k ↑ : v_lim et τ diminuent</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cvq-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cvq-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cvq-col { display: flex; flex-direction: column; gap: 12px; }
        .cvq-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .cvq-l1.cote .cvq-carte { order: 2; } .cvq-l1.cote .cvq-main { order: 1; } }
        @media (max-width: 900px) { .cvq-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cvq-in { animation: cvq-fondu 0.35s ease-out; } @keyframes cvq-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chute avec frottement visqueux : vitesse limite et constante de temps</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un objet lâché dans un fluide subit son <strong>poids</strong> et un <strong>frottement</strong> f = k v qui augmente avec la vitesse. La vitesse tend vers une <strong>vitesse limite</strong> v<sub>lim</sub> = m g ÷ k, avec la <strong>constante de temps</strong> τ = m ÷ k.</div>
      {!enExplore && <div className={`cvq-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="cvq-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="cvq-carte">{panneauHypo}</div>}
        <div className="cvq-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'calcul' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="cvq-col"><div className="cvq-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="cvq-ex">{animee}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
