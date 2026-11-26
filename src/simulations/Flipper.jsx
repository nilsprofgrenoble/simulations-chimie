import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./flipperModele";
import { FlipperExplore } from "./FlipperExplore";
import { QCM } from "./flipperQcm";
import { SceneFlipper, GrapheFlipper, SvgConversion, SvgVminFlip, SvgFrottFlip } from "./FlipperSchemas";

const SIM_ID = 263, CLE_GUIDE = 'flipper-guide-v1';
declarerDefis(SIM_ID, [['sans', 'Vitesse d’éjection minimale sans frottement'], ['avec', 'Vitesse d’éjection minimale avec frottement']]);

// ====================================================
//  SIM 263 — FLIPPER : VITESSE D'ÉJECTION MINIMALE POUR ATTEINDRE LE HAUT DE LA RAMPE (TSTL, enseignement PCM, partie « Énergie mécanique »).
//  Une seule idée : Ec à l'éjection = Epp en haut sans frottement (h = v0² ÷ 2g, indépendante de la masse et de l'angle) ; avec frottement, ½ m v0² = m g h + f L.
//  L'énergie du ressort n'est pas étudiée : la vitesse d'éjection est une donnée (hors programme : énergie potentielle élastique).
//  Capacités visées (jamais affichées) : Em = Ec + Epp, conservation de Em, travail d'une force de frottement constante. Situation et valeurs inventées (aucune du Moodle).
//  Modèle : flipperModele.js (test node). QCM : flipperQcm.js. Schémas : FlipperSchemas.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);


// ====================================================
export function SimulationFlipper() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('sans');
  const [ouv, setOuv] = useState({});
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');

  const IDS = ['depart', 'haut', 'masse', 'angle', 'longueur', 'vmin', 'trop', 'vhaut', 'frott', 'vfrott', 'angfrott', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const BILLE = <>Un lanceur à ressort éjecte, au pied d’une rampe inclinée, une bille de masse <strong>m = 0,080 kg</strong> (80 g). On ne s’intéresse pas au ressort : on connaît seulement la <strong>vitesse d’éjection v<sub>0</sub></strong>. On néglige les frottements ; g = 9,8 N/kg ; l’origine des altitudes, z = 0, est le pied de la rampe.</>;

  const ETAPES = [
    { id: 'depart', titre: 'À l’éjection', focus: ['scene'],
      texte: <>{BILLE} L’énergie mécanique de la bille est <strong>Em = Ec + Epp</strong>, avec Ec = ½ × m × v² et Epp = m × g × z.</>,
      tache: { type: 'qcm', q: 'Juste après l’éjection, au pied de la rampe (z = 0), l’énergie mécanique de la bille est :', ...QCM.depart,
        expl: 'Au pied de la rampe z = 0 donc Epp = 0 : toute l’énergie est cinétique, Em = ½ m v0².', indice: 'Que vaut Epp = m × g × z quand z = 0 ?' } },
    { id: 'haut', titre: 'Jusqu’où monte la bille ?', focus: ['scene'],
      texte: <>La bille est éjectée à <strong>v<sub>0</sub> = {fr(PG.v0.toFixed(1))} m/s</strong> sur une rampe <strong>très haute</strong> : elle s’arrête avant le sommet, quand toute son énergie cinétique est devenue énergie potentielle. Em est conservée.</>,
      tache: { type: 'num', q: 'Hauteur maximale atteinte par la bille, en mètres (m)', unite: 'm', vrai: PG.hVol, tol: 0.04, affiche: v => nbf(v, 2), cs: 2,
        pieges: [[PG.v0 * PG.v0 / M.G, 'Il manque le facteur 2 : ½ v0² = g h donne h = v0² ÷ (2 × g).'], [M.energieCin(PG.m, PG.v0), 'C’est l’énergie cinétique à l’éjection en joules, pas une hauteur.']],
        calcul: () => [`Em conservée : ½ m v0² = m g h, donc h = v0² ÷ (2 × g) = ${nbf(PG.v0 * PG.v0, 1)} ÷ (2 × 9,8) = ${nbf(PG.hVol, 2)} m.`], expl: 'h = 3,0² ÷ 19,6 ≈ 0,46 m.', indice: 'Au sommet de la montée, v = 0 : Em = m g h. La masse se simplifie.' } },
    { id: 'masse', titre: 'Une bille plus lourde', focus: ['scene'],
      texte: <>On éjecte maintenant, à la même vitesse <strong>{fr(PG.v0.toFixed(1))} m/s</strong> et sur la même rampe très haute, une bille de masse <strong>0,16 kg</strong> (deux fois plus lourde). Toujours sans frottement.</>,
      tache: { type: 'qcm', q: 'La hauteur maximale atteinte par la bille plus lourde est :', ...QCM.masse,
        expl: '½ m v0² = m g h : la masse se simplifie, h = v0² ÷ (2 g) ne dépend que de v0.', indice: 'Dans ½ × m × v0² = m × g × h, que devient m ?' } },
    { id: 'angle', titre: 'Une rampe plus raide', focus: ['scene'],
      texte: <>On revient à la bille de 0,080 kg éjectée à {fr(PG.v0.toFixed(1))} m/s. La rampe, toujours très haute, est inclinée de <strong>60°</strong> au lieu de {PG.deg}° : elle est plus raide.</>,
      tache: { type: 'qcm', q: 'La hauteur maximale atteinte par la bille est :', ...QCM.angle,
        expl: 'Le bilan d’énergie ne contient pas l’angle : h = v0² ÷ (2 g). Sur une rampe plus raide, la bille s’arrête plus tôt sur la rampe, mais à la même hauteur.', indice: 'L’énergie potentielle dépend de l’altitude z, pas du chemin suivi.' } },
    { id: 'longueur', titre: 'La distance sur la rampe', focus: ['scene'],
      retenirTitre: 'À retenir : de l’énergie cinétique à l’altitude',
      retenir: <>
        <SvgConversion/>
        <ul style={puces}>
          <li>Sans frottement, <strong>h = v<sub>0</sub>² ÷ (2 g)</strong> : elle ne dépend ni de la masse ni de l’angle.</li>
          <li>Doubler la vitesse multiplie la hauteur par 4.</li>
          <li>Moyen de s’en souvenir : <strong>« la hauteur ne dépend que de la vitesse »</strong>.</li></ul></>,
      texte: <>La rampe est inclinée de <strong>{PG.deg}°</strong> et la bille, éjectée à {fr(PG.v0.toFixed(1))} m/s, monte jusqu’à la hauteur h = {nbf(PG.hVol, 2)} m. La hauteur h, la distance L parcourue sur la rampe et l’angle α sont liés par <strong>h = L × sin α</strong> (sin {PG.deg}° = 0,50).</>,
      tache: { type: 'num', q: 'Distance parcourue sur la rampe avant l’arrêt, en mètres (m)', unite: 'm', vrai: PG.hVol / 0.5, tol: 0.04, affiche: v => nbf(v, 2), cs: 2,
        pieges: [[PG.hVol, 'C’est la hauteur atteinte : la distance sur la rampe inclinée est plus grande.'], [PG.hVol * 0.5, 'Il faut diviser par sin α, pas multiplier : L = h ÷ sin α.']],
        calcul: () => [`h = L × sin α, donc L = h ÷ sin α = ${nbf(PG.hVol, 2)} ÷ 0,50 = ${nbf(PG.hVol / 0.5, 2)} m.`], expl: 'L = 0,46 ÷ 0,50 = 0,92 m.', indice: 'Isolez L dans h = L × sin α.' } },
    { id: 'vmin', titre: 'Atteindre le haut de la rampe', focus: ['scene'],
      texte: <>La rampe, inclinée de {PG.deg}°, monte maintenant jusqu’à une hauteur <strong>h = {fr(PG.h.toFixed(1))} m</strong>. On cherche la <strong>vitesse d’éjection minimale</strong> pour que la bille atteigne le haut (en s’y arrêtant juste). Em est conservée.</>,
      tache: { type: 'num', q: 'Vitesse d’éjection minimale pour atteindre le haut de la rampe, en m/s', unite: 'm/s', vrai: PG.vMin, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[2 * M.G * PG.h, 'Il manque la racine carrée : ½ v0² = g h donne v0 = √(2 g h).'], [Math.sqrt(M.G * PG.h), 'Il manque le facteur 2 : v0² = 2 × g × h.']],
        calcul: () => [`½ m v0² = m g h, donc v0 = √(2 × g × h) = √(2 × 9,8 × ${fr(PG.h.toFixed(1))}) = ${nbf(PG.vMin, 2)} m/s, soit 4,0 m/s.`], expl: 'v0 = √(2 × 9,8 × 0,80) = √15,68 ≈ 3,96 m/s.', indice: 'Em(éjection) = ½ m v0² = Em(haut) = m g h : isolez v0.' } },
    { id: 'trop', titre: 'Une éjection trop lente', focus: ['scene'],
      texte: <>La rampe monte à h = {fr(PG.h.toFixed(1))} m ; la vitesse d’éjection minimale est <strong>{nbf(PG.vMin, 1)} m/s</strong>. On éjecte la bille à <strong>{fr(PG.v0.toFixed(1))} m/s</strong>.</>,
      tache: { type: 'qcm', q: 'Que fait la bille ?', ...QCM.trop,
        expl: 'À 3,0 m/s la bille a moins d’énergie cinétique que m g h : elle monte à 0,46 m seulement et s’arrête avant le haut (0,80 m).', indice: 'Comparez 3,0 m/s à la vitesse minimale 4,0 m/s.' } },
    { id: 'vhaut', titre: 'Une éjection plus rapide', focus: ['scene'],
      retenirTitre: 'À retenir : atteindre le haut',
      retenir: <>
        <SvgVminFlip/>
        <ul style={puces}>
          <li>Pour atteindre le haut d’une rampe de hauteur h : <strong>v<sub>0</sub> ≥ √(2 g h)</strong>.</li>
          <li>Cette vitesse minimale ne dépend ni de la masse ni de l’angle.</li>
          <li>Moyen de s’en souvenir : <strong>« √(2 g h) pour monter de h »</strong>.</li></ul></>,
      texte: <>La rampe monte à h = {fr(PG.h.toFixed(1))} m. On éjecte maintenant la bille à <strong>5,0 m/s</strong>, plus vite que la vitesse minimale : elle arrive en haut avec de la vitesse restante.</>,
      tache: { type: 'num', q: 'Vitesse de la bille en haut de la rampe, en m/s', unite: 'm/s', vrai: PG.v5, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[5.0, 'C’est la vitesse d’éjection : en montant de 0,80 m, la bille a perdu de la vitesse.'], [Math.sqrt(25 - M.G * PG.h), 'Il manque le facteur 2 : v² = v0² − 2 × g × h.']],
        calcul: () => [`½ m v0² = m g h + ½ m v², donc v = √(v0² − 2 g h) = √(25 − 2 × 9,8 × ${fr(PG.h.toFixed(1))}) = ${nbf(PG.v5, 2)} m/s, soit 3,1 m/s.`], expl: 'v = √(25 − 15,68) = √9,32 ≈ 3,05 m/s.', indice: 'Em conservée : ½ v0² = g h + ½ v² (la masse se simplifie).' } },
    { id: 'frott', titre: 'Avec du frottement', focus: ['scene'],
      texte: <>La rampe exerce maintenant sur la bille une <strong>force de frottement constante f = {fr(PG.f.toFixed(3))} N</strong>, parallèle à la rampe et opposée au mouvement. Le travail de cette force est W(f) = − f × L : de l’énergie est dissipée le long de la rampe.</>,
      tache: { type: 'qcm', q: 'Par rapport au cas sans frottement, la vitesse d’éjection minimale doit être :', ...QCM.frott,
        expl: 'ΔEm = W(f) < 0 : une partie de l’énergie est dissipée sur la rampe, il faut éjecter plus vite pour atteindre encore le haut.', indice: 'Em diminue avec le frottement : faut-il plus ou moins d’énergie au départ ?' } },
    { id: 'vfrott', titre: 'La vitesse minimale avec frottement', focus: ['scene'],
      texte: <>La rampe (h = {fr(PG.h.toFixed(1))} m, {PG.deg}°) mesure <strong>L = {fr(PG.L.toFixed(1))} m</strong>. Le frottement vaut <strong>f = {fr(PG.f.toFixed(3))} N</strong>, la masse est <strong>m = 0,080 kg</strong> (80 g). Pour juste atteindre le haut : ½ m v<sub>0</sub>² = m g h + f × L.</>,
      tache: { type: 'num', q: 'Vitesse d’éjection minimale avec frottement, en m/s', unite: 'm/s', vrai: PG.vMinF, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.vMin, 'C’est la vitesse sans frottement : il faut ajouter l’énergie dissipée f × L.'], [Math.sqrt(2 * M.G * PG.h + 2 * PG.f * PG.h / PG.m), 'Le frottement agit sur toute la longueur L de la rampe (1,6 m), pas seulement sur la hauteur h.']],
        calcul: () => [`v0 = √(2 × g × h + 2 × f × L ÷ m) = √(2 × 9,8 × ${fr(PG.h.toFixed(1))} + 2 × ${fr(PG.f.toFixed(3))} × ${fr(PG.L.toFixed(1))} ÷ 0,080) = ${nbf(PG.vMinF, 2)} m/s, soit 4,2 m/s.`], expl: 'v0 = √(15,68 + 2,0) = √17,68 ≈ 4,2 m/s.', indice: '2 × f × L ÷ m avec m en kg : 2 × 0,050 × 1,6 ÷ 0,080.' } },
    { id: 'angfrott', titre: 'Une rampe plus raide, avec frottement', focus: ['scene'],
      texte: <>Même hauteur h = {fr(PG.h.toFixed(1))} m, même frottement f = {fr(PG.f.toFixed(3))} N, même bille ; mais la rampe est inclinée de <strong>60°</strong> : elle est plus raide, donc <strong>plus courte</strong> (L = {nbf(PG.h / Math.sin(Math.PI / 3), 2)} m au lieu de {fr(PG.L.toFixed(1))} m).</>,
      tache: { type: 'qcm', q: 'La vitesse d’éjection minimale, par rapport à la rampe inclinée de 30°, est :', ...QCM.angfrott,
        expl: 'Le travail du frottement vaut f × L : sur une rampe plus courte, moins d’énergie est dissipée, la vitesse minimale est plus petite (elle reste plus grande que sans frottement).', indice: 'Comparez f × L pour les deux rampes.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : avec frottement',
      retenir: <>
        <SvgFrottFlip/>
        <ul style={puces}>
          <li>Avec un frottement constant f : <strong>½ m v<sub>0</sub>² = m g h + f × L</strong>.</li>
          <li>La distance sur la rampe est <strong>L = h ÷ sin α</strong> : une rampe douce dissipe plus.</li>
          <li>Moyen de s’en souvenir : <strong>« le frottement se paie sur toute la longueur »</strong>.</li></ul></>,
      texte: <>Vous savez trouver la hauteur atteinte par une bille éjectée et la vitesse d’éjection minimale pour atteindre le haut d’une rampe, sans et avec frottement. Explorez en changeant la masse, la hauteur, l’angle et le frottement, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SC = {
    depart: { h: 0.8, deg: 30, pL: 0 }, haut: { h: 1.2, deg: 30, pL: 0.38 }, masse: { h: 1.2, deg: 30, pL: 0.38 }, angle: { h: 1.2, deg: 60, pL: 0.38 }, longueur: { h: 0.8, deg: 30, pL: 0.57 },
    vmin: { h: 0.8, deg: 30, pL: 1 }, trop: { h: 0.8, deg: 30, pL: 0.57 }, vhaut: { h: 0.8, deg: 30, pL: 1 }, frott: { h: 0.8, deg: 30, pL: 0.3 }, vfrott: { h: 0.8, deg: 30, pL: 1 }, angfrott: { h: 0.8, deg: 60, pL: 1 }, fin: { h: 0.8, deg: 30, pL: 0.6 } };

  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La situation étudiée</div>
      <SceneFlipper {...SC[idEtape]}/>
    </div>);
  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'sans' ? { ...M.tirageDefiA(), type, reps: { v: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), type, reps: { v: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const v = lireNombre(defi.reps.v), ok = isFinite(v) && proche(v, defi.v, 0.06);
    setDefi(x => ({ ...x, verifie: true, ok })); (defi.type === 'sans' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, v = lireNombre(x.reps.v), msgs = [], g = M.G, h = x.h;
    if (!isFinite(v)) return ['Écrivez un nombre (virgule ou point), en m/s.'];
    if (x.type === 'avec' && proche(v, x.vSans, 0.05)) msgs.push('C’est la vitesse sans frottement : il faut ajouter l’énergie dissipée f × L sur la rampe.');
    else if (proche(v, Math.sqrt(g * h), 0.05)) msgs.push('Il manque le facteur 2 : v0² = 2 × g × h (et non g × h).');
    else if (proche(v, 2 * g * h, 0.05)) msgs.push('Il manque la racine carrée : v0 = √(2 × g × h).');
    else if (x.type === 'sans' && proche(v, Math.sqrt(2 * g * h / Math.sin(x.deg * Math.PI / 180)), 0.05)) msgs.push('Sans frottement, c’est l’altitude h qui compte, pas la longueur de la rampe : n’utilisez pas l’angle.');
    else if (x.type === 'sans' && proche(v, Math.sqrt(2 * x.m * g * h), 0.05)) msgs.push('La masse se simplifie dans la conservation de l’énergie : elle ne doit pas apparaître dans v0.');
    else if (x.type === 'avec' && proche(v, Math.sqrt(2 * g * h + 2 * x.f * h / x.m), 0.05)) msgs.push('Le frottement agit sur toute la longueur L de la rampe (donnée), pas seulement sur la hauteur h.');
    else if (x.type === 'avec' && proche(v, Math.sqrt(2 * g * h + 2 * x.f * x.L), 0.05)) msgs.push('Dans f × L il faut diviser par la masse m (en kg) : v0² = 2 g h + 2 f L ÷ m.');
    else msgs.push(x.type === 'sans' ? `Refaites le calcul : v0 = √(2 × 9,8 × ${fr(h)}). Votre valeur est ${v > x.v ? 'trop grande' : 'trop petite'}.` : `Refaites le calcul : v0 = √(2 × 9,8 × ${fr(h)} + 2 × ${fr(x.f)} × ${fr(x.L)} ÷ ${fr(x.m)}). Votre valeur est ${v > x.v ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const correction = () => defi.type === 'sans'
    ? `½ m v0² = m g h donne v0 = √(2 g h) = √(2 × 9,8 × ${fr(defi.h)}) = ${nbf(defi.v, 1)} m/s (la masse et l’angle ne servent pas).`
    : `½ m v0² = m g h + f L donne v0 = √(2 g h + 2 f L ÷ m) = √(2 × 9,8 × ${fr(defi.h)} + 2 × ${fr(defi.f)} × ${fr(defi.L)} ÷ ${fr(defi.m)}) = ${nbf(defi.v, 1)} m/s.`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['sans', 'Sans frottement'], ['avec', 'Avec frottement']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'sans' ? 'Défi : vitesse d’éjection minimale, sans frottement' : 'Défi : vitesse d’éjection minimale, avec frottement'}</div>
      {defi.type === 'sans' ? <div style={{ ...lbl, marginBottom: 8 }}>Un lanceur éjecte une bille de masse <strong>{fr(defi.m)} kg</strong> au pied d’une rampe inclinée de <strong>{defi.deg}°</strong>, dont le haut est à la hauteur <strong>{fr(defi.h)} m</strong>. On néglige les frottements. Quelle est la <strong>vitesse d’éjection minimale</strong> pour que la bille atteigne le haut de la rampe, en m/s (2 chiffres significatifs) ?</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>Un lanceur éjecte une bille de masse <strong>{fr(defi.m)} kg</strong> au pied d’une rampe de longueur <strong>L = {fr(defi.L)} m</strong>, dont le haut est à la hauteur <strong>{fr(defi.h)} m</strong>. La rampe exerce une force de frottement constante <strong>f = {fr(defi.f)} N</strong>. Quelle est la <strong>vitesse d’éjection minimale</strong> pour atteindre le haut de la rampe, en m/s (2 chiffres significatifs) ?</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>v<sub>0</sub> (m/s) =</span>
        <input value={defi.reps.v} aria-label="Vitesse d’éjection minimale en mètres par seconde" onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('flp-verif')?.click()} onChange={e2 => change('v', e2.target.value)} inputMode="decimal"
          style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      </div>
      <IndiceDefi cache={false}>{defi.type === 'sans' ? 'Em conservée : ½ m v0² = m g h. La masse se simplifie.' : 'Em diminue du travail du frottement : ½ m v0² = m g h + f × L. Isolez v0 (m en kg).'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="flp-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
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
      <li><strong>La bille est un point matériel</strong> qui glisse sur la rampe sans la quitter ; g = 9,8 N/kg ; l’origine des altitudes est le pied de la rampe.</li>
      <li><strong>Le lanceur à ressort n’est pas étudié</strong> : on ne s’intéresse qu’à la vitesse d’éjection v<sub>0</sub> (l’énergie du ressort n’est pas au programme de cette partie).</li>
      <li><strong>Sans frottement</strong>, seul le poids travaille (la réaction de la rampe est perpendiculaire au mouvement) : Em est conservée et h = v<sub>0</sub>² ÷ (2 g).</li>
      <li><strong>Frottement</strong> : une force constante de 0,03 à 0,08 N, parallèle à la rampe : un modèle simple, pas une mesure. Quand la bille s’arrête avant le haut, on ne cherche pas si elle redescend (cela dépend du frottement statique).</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, hauteurs, angles, forces) : ce ne sont pas des mesures sur un flipper réel.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Tirez la bille vers la gauche puis lâchez-la : plus le ressort est comprimé, plus la vitesse d’éjection est grande. Que devient l’énergie cinétique au pied de la rampe ?</li>
      <li>Sans frottement, changez la masse puis l’angle (saisissez le haut de la rampe) : la hauteur atteinte change-t-elle ?</li>
      <li>Réglez la hauteur h de la rampe, puis cherchez la plus petite vitesse v0 qui permet d’atteindre le haut. Comparez à √(2 g h).</li>
      <li>Doublez la vitesse d’éjection quand la bille s’arrête avant le haut : la hauteur atteinte est-elle doublée ?</li>
      <li>Ajoutez un frottement : la vitesse minimale augmente-t-elle ? Est-ce pareil sur une rampe de 15° et de 60° ?</li>
      <li>Regardez le graphique et les barres d’énergie : que devient Em avec frottement ? Sans frottement ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Sans frottement : h = v<sub>0</sub>² ÷ (2 g), indépendante de la masse et de l’angle</li>
        <li>Vitesse minimale pour atteindre le haut : v<sub>0</sub> = √(2 g h)</li>
        <li>Avec frottement : ½ m v<sub>0</sub>² = m g h + f × L, avec L = h ÷ sin α</li>
        <li>Une rampe douce (longue) dissipe plus d’énergie qu’une rampe raide</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .flp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .flp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .flp-col { display: flex; flex-direction: column; gap: 12px; }
        .flp-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .flp-l1.cote .flp-carte { order: 2; } .flp-l1.cote .flp-main { order: 1; }
          .flp-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .flp-ex > * { grid-column: 1; }
          .flp-ex > .flp-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .flp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .flp-in { animation: flp-fondu 0.35s ease-out; } @keyframes flp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Flipper : vitesse d’éjection minimale pour atteindre le haut de la rampe</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La conservation de l’énergie mécanique donne la <strong>hauteur atteinte</strong> par une bille éjectée et la <strong>vitesse d’éjection minimale</strong> pour atteindre le haut d’une rampe, avec ou sans frottement.</div>
      {!enExplore && <div className={`flp-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="flp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="flp-carte">{panneauHypo}</div>}
        <div className="flp-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'sans' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="flp-col"><div className="flp-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <FlipperExplore/>
        <div style={{ height: 12 }}/>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
