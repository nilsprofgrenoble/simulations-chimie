import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./loopingModele";
import { LoopingExplore } from "./LoopingExplore";
import { QCM } from "./loopingQcm";
import { SceneLooping, GrapheLooping, SvgVitesseZ, SvgContact, SvgFrottLoop } from "./LoopingSchemas";

const SIM_ID = 262, CLE_GUIDE = 'looping-guide-v1';
declarerDefis(SIM_ID, [['sommet', 'Vitesse au sommet du looping'], ['hmin', 'Hauteur minimale de départ']]);

// ====================================================
//  SIM 262 — LOOPING : VITESSE EN CHAQUE POINT ET HAUTEUR MINIMALE DE DÉPART (TSTL, enseignement PCM, partie « Énergie mécanique »).
//  Une seule idée : conservation de Em sans frottement, v = √(2 g (H − z)) ; condition de contact au sommet ADMISE (v ≥ √(g R)) donnant H minimale = 2,5 R.
//  Capacités visées (jamais affichées) : Em = Ec + Epp conservée, vitesse en un point d'après l'altitude, indépendance de la masse.
//  Modèle : loopingModele.js (test node). QCM : loopingQcm.js. Schémas : LoopingSchemas.jsx. Situation et valeurs inventées (aucune du Moodle).
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
export function SimulationLooping() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('sommet');
  const [ouv, setOuv] = useState({});
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['depart', 'bas', 'sommet', 'vsommet', 'masse', 'mi', 'contact', 'hmin', 'trop', 'frott', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const WAGON = <>Un wagon de masse <strong>m = {PG.m} kg</strong> est lâché <strong>sans vitesse</strong> du haut d’une pente, à la hauteur <strong>H = {PG.H} m</strong> au-dessus du point le plus bas. La pente mène à un looping circulaire de <strong>rayon R = {PG.R} m</strong>. On néglige les frottements ; g = 9,8 N/kg ; l’origine des altitudes, z = 0, est le point le plus bas du looping.</>;

  const ETAPES = [
    { id: 'depart', titre: 'Au départ', focus: ['scene'],
      texte: <>{WAGON} L’énergie mécanique du wagon est <strong>Em = Ec + Epp</strong>, avec Ec = ½ × m × v² et Epp = m × g × z.</>,
      tache: { type: 'qcm', q: 'Au moment où le wagon est lâché, son énergie mécanique est :', ...QCM.depart,
        expl: 'Le wagon est lâché sans vitesse : Ec = 0. Em = Epp = m × g × H, entièrement potentielle.', indice: 'Que valent Ec (vitesse nulle) et Epp = m × g × z au départ (z = H) ?' } },
    { id: 'bas', titre: 'Au point le plus bas', focus: ['scene'],
      texte: <>Sans frottement, <strong>Em est conservée</strong> : le poids est la seule force qui travaille (la réaction du rail est perpendiculaire au mouvement). Au point le plus bas, z = 0 : Epp = 0. Le wagon part de H = {PG.H} m.</>,
      tache: { type: 'num', q: 'Vitesse du wagon au point le plus bas du looping, en m/s', unite: 'm/s', vrai: PG.vBas, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[2 * M.G * PG.H, 'Il manque la racine carrée : m g H = ½ m v² donne v² = 2 g H.'], [Math.sqrt(M.G * PG.H), 'Il manque le facteur 2 : v² = 2 × g × H.']],
        calcul: () => [`m g H = ½ m v², donc v = √(2 × g × H) = √(2 × 9,8 × ${PG.H}) = ${nbf(PG.vBas, 1)} m/s, soit 14 m/s.`], expl: 'v = √(2 × 9,8 × 10) = √196 = 14 m/s.', indice: 'Em(départ) = m g H = Em(bas) = ½ m v² : la masse se simplifie.' } },
    { id: 'sommet', titre: 'Le sommet du looping', focus: ['scene'],
      texte: <>Le looping est un cercle de rayon R = {PG.R} m posé sur son point le plus bas. On cherche la vitesse du wagon au <strong>sommet</strong> du cercle.</>,
      tache: { type: 'qcm', q: 'L’altitude du sommet du looping (origine z = 0 au point le plus bas) est :', ...QCM.sommet,
        expl: 'Le sommet du cercle est à un diamètre au-dessus de son point le plus bas : z = 2 R = 6 m.', indice: 'Combien mesure le diamètre d’un cercle de rayon R ?' } },
    { id: 'vsommet', titre: 'La vitesse au sommet', focus: ['scene'], repere: true,
      texte: <>Le sommet est à l’altitude <strong>z = 2 R = {2 * PG.R} m</strong>. Em = m g H est conservée : m g H = m g z + ½ m v². Le wagon part de H = {PG.H} m.</>,
      tache: { type: 'num', q: 'Vitesse du wagon au sommet du looping, en m/s', unite: 'm/s', vrai: PG.vTop, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.vBas, 'C’est la vitesse au point le plus bas : au sommet le wagon a gagné 6 m d’altitude.'], [Math.sqrt(2 * M.G * (PG.H - PG.R)), 'C’est la vitesse à l’altitude R ; le sommet est à 2 R.']],
        calcul: () => [`v = √(2 × g × (H − 2R)) = √(2 × 9,8 × (${PG.H} − ${2 * PG.R})) = ${nbf(PG.vTop, 2)} m/s, soit 8,8 m/s.`], expl: 'v = √(2 × 9,8 × 4) = √78,4 ≈ 8,85 m/s.', indice: 'm g H = m g (2R) + ½ m v² : isolez v, après simplification par m.' } },
    { id: 'masse', titre: 'Un wagon plus lourd', focus: ['scene'],
      retenirTitre: 'À retenir : la vitesse en un point',
      retenir: <>
        <SvgVitesseZ/>
        <ul style={puces}>
          <li>Sans frottement, <strong>v = √(2 g (H − z))</strong> à l’altitude z.</li>
          <li>Plus l’altitude est grande, plus la vitesse est petite.</li>
          <li>Moyen de s’en souvenir : <strong>« la vitesse ne dépend que de la dénivellation »</strong>.</li></ul></>,
      texte: <>On lâche maintenant, de la même hauteur H = {PG.H} m, un wagon de masse <strong>400 kg</strong> (deux fois plus lourd). Toujours sans frottement.</>,
      tache: { type: 'qcm', q: 'La vitesse du wagon le plus lourd au sommet du looping est :', ...QCM.masse,
        expl: 'm g H = m g (2R) + ½ m v² : la masse se simplifie, v ne dépend que de H et de R. Les deux wagons ont la même vitesse.', indice: 'Dans m × g × H = m × g × 2R + ½ × m × v², que devient m ?' } },
    { id: 'mi', titre: 'À mi-hauteur du looping', focus: ['scene'],
      texte: <>Le wagon passe par le point du looping situé à la hauteur du centre du cercle : <strong>z = R = {PG.R} m</strong>. Il est parti de H = {PG.H} m.</>,
      tache: { type: 'num', q: 'Vitesse du wagon à l’altitude z = 3 m, en m/s', unite: 'm/s', vrai: PG.vMi, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.vTop, 'C’est la vitesse au sommet (z = 6 m) ; ici z = 3 m.'], [PG.vBas, 'C’est la vitesse au point le plus bas (z = 0).']],
        calcul: () => [`v = √(2 × g × (H − z)) = √(2 × 9,8 × (${PG.H} − ${PG.R})) = ${nbf(PG.vMi, 2)} m/s, soit 12 m/s.`], expl: 'v = √(2 × 9,8 × 7) ≈ 11,7 m/s.', indice: 'v = √(2 g (H − z)) avec z = 3 m.' } },
    { id: 'contact', titre: 'Rester en contact avec le rail', focus: ['scene'], repere: true,
      texte: <>Au sommet, le wagon est « la tête en bas » : pour rester en contact avec le rail, sa vitesse doit être <strong>au moins égale à √(g × R)</strong>. Cette condition est <strong>admise ici</strong> ; on la démontrera avec la deuxième loi de Newton. Pour R = {PG.R} m : √(g R) = {nbf(PG.vMin, 1)} m/s. Au sommet, le wagon lâché de {PG.H} m a la vitesse {nbf(PG.vTop, 1)} m/s.</>,
      tache: { type: 'qcm', q: 'Le wagon lâché de 10 m passe le sommet du looping :', ...QCM.contact,
        expl: 'Au sommet v = 8,8 m/s est plus grande que la vitesse minimale 5,4 m/s : le wagon reste en contact avec le rail.', indice: 'Comparez la vitesse au sommet à la vitesse minimale √(g R).' } },
    { id: 'hmin', titre: 'La hauteur minimale de départ', focus: ['scene'], repere: true,
      texte: <>On cherche la hauteur H la plus petite qui permet de passer le sommet : le wagon doit y arriver avec la vitesse minimale <strong>√(g R) = {nbf(PG.vMin, 1)} m/s</strong>, au sommet situé à l’altitude {2 * PG.R} m. Em est conservée.</>,
      tache: { type: 'num', q: 'Hauteur minimale de départ pour passer le looping, en mètres (m)', unite: 'm', vrai: PG.Hmin, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[2 * PG.R, 'À cette hauteur le wagon atteint le sommet avec une vitesse nulle : il faut encore l’énergie cinétique ½ m v².'], [PG.vMin * PG.vMin / (2 * M.G), 'C’est la hauteur équivalente à la vitesse minimale ; il faut ajouter l’altitude 2R du sommet.']],
        calcul: () => [`m g H = m g (2R) + ½ m v² avec v² = g R : H = 2R + R ÷ 2 = ${nbf(2 * PG.R, 0)} + ${nbf(PG.R / 2, 1)} = ${nbf(PG.Hmin, 1)} m.`], expl: 'H = 2 × 3 + 3 ÷ 2 = 7,5 m (soit 2,5 R).', indice: 'H = z(sommet) + v² ÷ (2 g), avec v² = g × R.' } },
    { id: 'trop', titre: 'Un départ trop bas', focus: ['scene'],
      texte: <>On lâche le wagon d’une hauteur plus basse que la hauteur minimale : <strong>H = {PG.H2} m</strong> (le sommet est à {2 * PG.R} m, la hauteur minimale est {nbf(PG.Hmin, 1)} m).</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il ?', ...QCM.trop,
        expl: 'À 6 m, toute l’énergie du départ suffit à peine à atteindre l’altitude du sommet : le wagon arrive au mieux avec une vitesse nulle, inférieure à √(g R) : il décroche avant le sommet.', indice: 'Comparez H = 6 m à la hauteur minimale 7,5 m.' } },
    { id: 'frott', titre: 'Avec du frottement', focus: ['scene'],
      retenirTitre: 'À retenir : passer le looping',
      retenir: <>
        <SvgContact/>
        <ul style={puces}>
          <li>Au sommet, il faut <strong>v ≥ √(g R)</strong> (condition admise).</li>
          <li>Sans frottement, la hauteur minimale de départ est <strong>H = 2,5 R</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« deux R et demi pour passer »</strong>.</li></ul></>,
      texte: <>Le rail frotte maintenant sur le wagon : une force de frottement, opposée au mouvement, dissipe de l’énergie le long du parcours. La condition de contact au sommet (v ≥ √(g R)) ne change pas. On veut passer le looping de rayon R = {PG.R} m.</>,
      tache: { type: 'qcm', q: 'Par rapport au cas sans frottement, la hauteur de départ minimale doit être :', ...QCM.frott,
        expl: 'ΔEm = W(f) < 0 : une partie de l’énergie est dissipée avant le sommet. Il faut partir de plus haut pour y arriver avec au moins la vitesse minimale.', indice: 'Que devient Em avec frottement ? Faut-il plus ou moins d’énergie au départ ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : avec frottement',
      retenir: <>
        <SvgFrottLoop/>
        <ul style={puces}>
          <li>Avec frottement, <strong>Em diminue</strong> : ΔEm = W(f) &lt; 0.</li>
          <li>Pour passer le looping, il faut alors partir plus haut que 2,5 R.</li>
          <li>Moyen de s’en souvenir : <strong>« le frottement prend, on part plus haut »</strong>.</li></ul></>,
      texte: <>Vous savez calculer la vitesse d’un wagon en chaque point d’un looping par la conservation de l’énergie mécanique, et la hauteur minimale de départ. Explorez en changeant la hauteur, le rayon et le frottement, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SC = {
    depart: { p: 0 }, bas: { p: 0.5 }, sommet: { p: 0.75, repereTop: true }, vsommet: { p: 0.75, repereTop: true }, masse: { p: 0.62 }, mi: { p: 0.625 },
    contact: { p: 0.75, repereTop: true }, hmin: { p: 0.75, repereTop: true }, trop: { p: 0.7, H: PG.H2 }, frott: { p: 0.25 }, fin: { p: 0.3 } };

  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La situation étudiée</div>
      <SceneLooping {...{ H: PG.H, R: PG.R }} {...SC[idEtape]}/>
    </div>);
  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'sommet' ? { ...M.tirageDefiA(), type, reps: { v: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), type, reps: { h: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'sommet') { const v = lireNombre(defi.reps.v), ok = isFinite(v) && proche(v, defi.v, 0.06); setDefi(x => ({ ...x, verifie: true, ok })); noterA(ok); }
    else { const h = lireNombre(defi.reps.h), ok = isFinite(h) && proche(h, defi.Hmin, 0.06); setDefi(x => ({ ...x, verifie: true, ok })); noterB(ok); }
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnosticA = () => {
    const x = defi, v = lireNombre(x.reps.v), msgs = [];
    if (!isFinite(v)) return ['Écrivez un nombre (virgule ou point), en m/s.'];
    if (proche(v, M.vitesseSans(x.H, 0), 0.05)) msgs.push('C’est la vitesse au point le plus bas. Au sommet, le wagon est à l’altitude 2 R : utilisez H − 2R.');
    else if (proche(v, M.vitesseSans(x.H, x.R), 0.05)) msgs.push('C’est la vitesse à l’altitude R (hauteur du centre du cercle). Le sommet est à l’altitude 2 R.');
    else if (proche(v, 2 * M.G * (x.H - 2 * x.R), 0.05)) msgs.push('Il manque la racine carrée : v² = 2 g (H − 2R).');
    else if (proche(v, Math.sqrt(M.G * (x.H - 2 * x.R)), 0.05)) msgs.push('Il manque le facteur 2 : v² = 2 × g × (H − 2R).');
    else if (proche(v, Math.sqrt(2 * x.m * M.G * (x.H - 2 * x.R)), 0.05)) msgs.push('La masse se simplifie dans la conservation de l’énergie : elle ne doit pas apparaître dans v.');
    else msgs.push(`Refaites le calcul : z du sommet = 2 × ${x.R} = ${2 * x.R} m ; v = √(2 × 9,8 × (${x.H} − ${2 * x.R})). Votre valeur est ${v > x.v ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, h = lireNombre(x.reps.h), msgs = [];
    if (!isFinite(h)) return ['Écrivez un nombre (virgule ou point), en mètres.'];
    if (proche(h, 2 * x.R, 0.05)) msgs.push('À la hauteur 2 R le wagon atteint le sommet avec une vitesse nulle : il faut aussi l’énergie cinétique pour la vitesse minimale √(g R).');
    else if (proche(h, 0.5 * x.R, 0.05)) msgs.push('Vous avez seulement compté l’énergie cinétique minimale au sommet : ajoutez l’altitude 2R du sommet.');
    else if (proche(h, 2 * x.R + x.R, 0.05) || proche(h, 3.5 * x.R, 0.05)) msgs.push('L’énergie cinétique minimale au sommet est ½ m (√(g R))² = ½ m g R : cela correspond à R ÷ 2 de hauteur, pas R.');
    else msgs.push(`Refaites le calcul : v² minimale = g R ; H = 2R + v² ÷ (2g) = 2 × ${x.R} + ${x.R} ÷ 2. Votre valeur est ${h > x.Hmin ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const correction = () => defi.type === 'sommet'
    ? `Le sommet est à z = 2R = ${2 * defi.R} m : m g H = m g (2R) + ½ m v² donne v = √(2 g (H − 2R)) = √(2 × 9,8 × ${defi.H - 2 * defi.R}) = ${nbf(defi.v, 1)} m/s (la masse ne sert pas).`
    : `v minimale = √(g R) = ${nbf(defi.vMin, 1)} m/s au sommet (z = 2R = ${2 * defi.R} m) : H = 2R + v² ÷ (2g) = ${2 * defi.R} + ${nbf(defi.R / 2, 1)} = ${nbf(defi.Hmin, 1)} m (soit 2,5 R).`;
  const champ = (cle, aria, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{unite}</span>
      <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('lpg-verif')?.click()} onChange={e2 => change(cle, e2.target.value)} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['sommet', 'Vitesse au sommet'], ['hmin', 'Hauteur minimale']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'sommet' ? 'Défi : vitesse au sommet du looping' : 'Défi : hauteur minimale de départ'}</div>
      {defi.type === 'sommet' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un wagon de masse <strong>{defi.m} kg</strong> est lâché sans vitesse d’une hauteur <strong>{defi.H} m</strong> au-dessus du point le plus bas d’un looping circulaire de rayon <strong>{defi.R} m</strong>. On néglige les frottements. Calculez sa vitesse au sommet du looping, en m/s (2 chiffres significatifs).</div>
        {champ('v', 'Vitesse au sommet en mètres par seconde', 'v (m/s) =')}
        <IndiceDefi cache={false}>Le sommet est à l’altitude z = 2R. Em est conservée : m g H = m g (2R) + ½ m v². La masse se simplifie.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un wagon de masse <strong>{defi.m} kg</strong> doit passer un looping circulaire de rayon <strong>{defi.R} m</strong>. On néglige les frottements et on admet que le wagon reste en contact avec le rail au sommet si sa vitesse y est au moins √(g × R). Quelle est la <strong>hauteur minimale</strong> de départ (sans vitesse), au-dessus du point le plus bas, en mètres (2 chiffres significatifs) ?</div>
        {champ('h', 'Hauteur minimale en mètres', 'H (m) =')}
        <IndiceDefi cache={false}>Au sommet (altitude 2R) la vitesse minimale est √(g R). Em conservée : m g H = m g (2R) + ½ m × (g R).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="lpg-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'sommet' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Le wagon est un point matériel</strong> qui suit le rail sans le quitter ; g = 9,8 N/kg ; l’origine des altitudes est le point le plus bas du looping.</li>
      <li><strong>Sans frottement</strong>, seul le poids travaille (la réaction du rail est perpendiculaire au mouvement) : Em est conservée et v = √(2 g (H − z)).</li>
      <li><strong>La condition de contact au sommet, v ≥ √(g R), est admise</strong> : elle sera démontrée avec la deuxième loi de Newton. Elle n’est pas démontrée ici.</li>
      <li><strong>Frottement</strong> : une force constante de 20 à 100 N le long de la pente d’accès (inclinée à 45°) et du looping : un modèle simple, pas une mesure.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, hauteurs, rayons) : ce ne sont pas des mesures sur un manège réel.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Soulevez le wagon plus haut sur la pente puis lâchez-le : que devient sa vitesse en bas ? au sommet ?</li>
      <li>Sans frottement, changez la masse : la vitesse au sommet change-t-elle ?</li>
      <li>Pour R = 3 m, diminuez la hauteur H jusqu’à ce que le wagon décroche. À quelle hauteur ? Comparez à 2,5 R.</li>
      <li>Doublez le rayon (3 m → 5 m, ou 2 m → 4 m) : que devient la hauteur minimale ?</li>
      <li>Ajoutez un frottement : la hauteur minimale augmente-t-elle ou diminue-t-elle ?</li>
      <li>Regardez la flèche de la piste (force de contact) et les barres d’énergie : où la vitesse est-elle la plus petite ? la plus grande ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Sans frottement : v = √(2 g (H − z)), indépendante de la masse</li>
        <li>Sommet du looping : z = 2 R</li>
        <li>Contact au sommet (admis) : v ≥ √(g R)</li>
        <li>Hauteur minimale de départ : H = 2,5 R ; plus haute avec frottement</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .lpg-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .lpg-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .lpg-col { display: flex; flex-direction: column; gap: 12px; }
        .lpg-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .lpg-l1.cote .lpg-carte { order: 2; } .lpg-l1.cote .lpg-main { order: 1; }
          .lpg-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .lpg-ex > * { grid-column: 1; }
          .lpg-ex > .lpg-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .lpg-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .lpg-in { animation: lpg-fondu 0.35s ease-out; } @keyframes lpg-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Looping : vitesse en chaque point et hauteur minimale de départ</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La conservation de l’énergie mécanique donne la <strong>vitesse d’un wagon en chaque point</strong> d’un looping et la <strong>hauteur minimale</strong> de départ pour le franchir.</div>
      {!enExplore && <div className={`lpg-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="lpg-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="lpg-carte">{panneauHypo}</div>}
        <div className="lpg-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'sommet' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="lpg-col"><div className="lpg-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <LoopingExplore/>
        <div style={{ height: 12 }}/>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
