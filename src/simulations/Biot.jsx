import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond } from "../commun";
import { Pic } from "../Pictos";
import * as B from "./biotModele";
import { SceneBiot } from "./BiotScene";
import { SvgSensCarte, SvgBiotCarte, SvgRacemiqueCarte, SvgEECarte, SvgBilanBiotCarte } from "./BiotSchemas";
import { useEtroit, StyleAnim, Chips } from "./exploAnim";
import { usePhase, reduitMouvement } from "./hookHorloge";

// ====================================================
// SIM 318 — « Pouvoir rotatoire, loi de Biot et excès énantiomérique » (terminale STL, SPCL, Chimie et développement durable : séquence 9, aspects microscopiques).
//  Une idée : un composé chiral fait tourner le plan de polarisation d'une lumière polarisée (α, en degrés) ; la loi de Biot α = [α] × L × C relie α à la longueur de cuve et à la concentration ;
//  un mélange racémique est inactif ; l'excès énantiomérique se déduit de α. Lien avec le carbocation plan (mélange racémique).
//  Capacités visées (jamais affichées à l'élève) : déterminer l'excès énantiomérique à partir de la valeur de l'activité optique d'un mélange ; exploiter la loi de Biot.
//  Hors périmètre : polarimètre de Laurent (demi-ombre), dispersion rotatoire, mutarotation. Modèle : biotModele.js. Scène animée : BiotScene.jsx.
// ====================================================
const BLEU = '#b45309', NB = B.NB, nb = B.nbf;
const SIM_ID = 318, CLE_GUIDE = 'biot-guide-v1';
declarerDefis(SIM_ID, [['C', 'Retrouver la concentration'], ['ee', 'Excès énantiomérique d’un mélange']]);
const IDS = ['lumiere', 'sens', 'biot', 'unite', 'longueur', 'concentration', 'melange', 'racemique', 'ee', 'alphaee', 'complet', 'carbocation', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const S = B.SUBS;
const BASE = { sub: S.camphre, L: 2, C: 0.1, p: 1, ctrlL: false, ctrlC: false, ctrlP: false, valeurs: false, showAlpha: false, showC: true, showP: false, aide: '', nomSub: true };
const AIDE_L = 'Faites glisser la poignée rouge au bout de la cuve : elle règle la longueur L (par pas de 0,5 dm).';
const AIDE_P = 'Faites glisser la poignée violette : la barre orange est la part de l’énantiomère (+), la barre verte celle de (−).';
const SCENES = {
  lumiere: { ...BASE, aide: 'Les traits jaunes montrent le plan dans lequel la lumière oscille. Le cadran de droite donne son orientation à la sortie de la cuve.' },
  sens: { ...BASE, sub: S.menthol, p: 0 },
  biot: { ...BASE },
  unite: { ...BASE },
  longueur: { ...BASE, ctrlL: true, valeurs: true, showAlpha: true, aide: AIDE_L },
  concentration: { ...BASE, sub: S.carvone, C: 0.08, showC: false, valeurs: true, showAlpha: true, aide: 'La concentration de la solution est cachée (C = ?) : c’est à vous de la retrouver avec la loi de Biot.' },
  melange: { ...BASE, ctrlP: true, showP: true, valeurs: true, showAlpha: true, aide: AIDE_P },
  racemique: { ...BASE, p: 0.5, showP: true, valeurs: true, showAlpha: true },
  ee: { ...BASE, p: 0.85, showP: true },
  alphaee: { ...BASE, sub: S.menthol, L: 1, C: 0.2, p: 0.2, valeurs: true, showAlpha: true },
  complet: { ...BASE, ctrlP: true, showP: true, valeurs: true, showAlpha: true, aide: AIDE_P },
  carbocation: null,
  bilan: { ...BASE, p: 0.75, showP: true, valeurs: true, showAlpha: true },
};
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
  <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
  <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);
const lire = s => { const t = String(s).trim().replace(',', '.').replace(/\s/g, ''); return t === '' ? NaN : Number(t); };

// scène commune au parcours, aux défis et à l'exploration
function Scene({ sc, L, C, p, setL, setC, setP, aria, touche = true, alphaFixe = null }) {
  const svgRef = useRef(null), boite = useRef(null), etroit = useEtroit(boite), anime = !reduitMouvement();
  const tau = usePhase(0.5, anime, 0) / (2 * Math.PI);
  return (
    <div ref={boite} style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <SceneBiot sub={sc.sub} L={L} C={C} p={p} setL={setL} setC={setC} setP={setP} ctrlL={sc.ctrlL} ctrlC={sc.ctrlC} ctrlP={sc.ctrlP} valeurs={sc.valeurs} showC={sc.showC} showP={sc.showP}
        showAlpha={sc.showAlpha} nomSub={sc.nomSub} etroit={etroit} svgRef={svgRef} aria={aria} tau={tau} touche={touche} alphaFixe={alphaFixe}/>
      {sc.aide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.45 }}>{sc.aide}</div>}
    </div>);
}
function SceneGuide({ sc, pos, setPos, cleL, cleP, aria }) {
  const [touche, setTouche] = useState(false);
  const L = cleL ? pos[cleL] : sc.L, p = cleP ? pos[cleP] : sc.p;
  const setL = v => { setTouche(true); setPos(q => (q[cleL] === v ? q : { ...q, [cleL]: v })); };
  const setP = v => { setTouche(true); setPos(q => (q[cleP] === v ? q : { ...q, [cleP]: v })); };
  return <Scene sc={sc} L={L} C={sc.C} p={p} setL={setL} setP={setP} aria={aria} touche={touche}/>;
}

// ---------- exploration ----------
const ECHANT = [
  { id: 'plus', nom: 'Énantiomère (+) pur', p: 1 },
  { id: 'moins', nom: 'Énantiomère (−) pur', p: 0 },
  { id: 'rac', nom: 'Mélange racémique (50 % / 50 %)', p: 0.5 },
  { id: 'm75', nom: 'Mélange 75 % (+) / 25 % (−)', p: 0.75 },
  { id: 'm20', nom: 'Mélange 20 % (+) / 80 % (−)', p: 0.2 },
];
const exInitial = () => ({ sub: 'camphre', L: 2, C: 0.1, p: 0.75, valeurs: true });
function BiotExplore({ ex, setEx, ouv, setOuv }) {
  const [touche, setTouche] = useState(false);
  const sub = S[ex.sub];
  const sc = { ...BASE, sub, ctrlL: true, ctrlC: true, ctrlP: true, showP: true, showAlpha: true, valeurs: ex.valeurs };
  const set = cle => v => { setTouche(true); setEx(x => (x[cle] === v ? x : { ...x, [cle]: v })); };
  const alpha = B.alphaMel(sub, ex.L, ex.C, ex.p), ee = B.eeDe(ex.p), maj = B.majoritaire(ex.p), aP = B.alphaPur(sub, ex.L, ex.C);
  const nom = `${sub.nom} · L = ${nb(ex.L, 1)}${NB}dm · C = ${nb(ex.C, 2)}${NB}g/mL · ${Math.round(ex.p * 100)} % (+)`;
  const message = !touche ? 'Faites glisser la poignée rouge (la longueur L de la cuve), puis les deux curseurs (la concentration C et la composition du mélange) : le plan de polarisation, le cadran et la valeur de α se mettent à jour en direct.'
    : `α = [α] × L × C × (part de (+) − part de (−)) = ${sub.A} × ${nb(ex.L, 1)} × ${nb(ex.C, 2)} × ${nb(2 * ex.p - 1, 2)} = ${B.fmtDeg(alpha, 2)}°. ${maj ? `Le (${maj}) est en excès : e.e. = ${nb(ee, 0)} %.` : 'Mélange racémique : e.e. = 0 %, aucune rotation.'}`;
  const aria = 'Polarimètre : une lampe, un polariseur, une cuve contenant la solution et un cadran qui indique la rotation du plan de polarisation ; poignées pour la longueur de la cuve, la concentration et la composition du mélange.';
  const tog = (cle, lab) => <button type="button" onClick={() => setEx(x => ({ ...x, [cle]: !x[cle] }))} aria-pressed={ex[cle]} style={{ ...stylePetitBouton(ex[cle], '#0f766e'), minHeight: 40 }}>{lab}</button>;
  return (
    <div>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={nom} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {sel('bx-sub', 'Composé chiral', ex.sub, ev => setEx(x => ({ ...x, sub: ev.target.value })), B.LISTE.map(k => <option key={k} value={k}>{S[k].nom} ([α] = ±{S[k].A} pour (+) et (−))</option>))}
            {sel('bx-ech', 'Échantillon (positionne le curseur de composition)', ECHANT.find(e => e.p === ex.p)?.id || 'perso', ev => { const e = ECHANT.find(z => z.id === ev.target.value); if (e) setEx(x => ({ ...x, p: e.p })); },
              [...ECHANT.map(e => <option key={e.id} value={e.id}>{e.nom}</option>), <option key="perso" value="perso" disabled>Composition personnalisée</option>])}
          </div>
        </Section>
      </div>
      <Scene key={ex.sub} sc={sc} L={ex.L} C={ex.C} p={ex.p} setL={set('L')} setC={set('C')} setP={set('p')} aria={aria} touche={touche}/>
      <div role="status" aria-live="polite" style={{ minHeight: 70, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <div style={{ maxWidth: 920, margin: '0 auto 6px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Afficher :</span>
        {tog('valeurs', 'Graduations et sens de rotation')}
      </div>
      <Chips items={[['α', `${B.fmtDeg(alpha, 2)}°`, '#ca8a04'], ['Sens', B.sensDe(alpha), alpha > 0 ? '#c2410c' : alpha < 0 ? '#0f766e' : '#475569'], ['e.e.', `${nb(ee, 0)} %`, '#7c3aed'], ['α du (+) pur', `${B.fmtDeg(aP, 2)}°`, '#475569']]}/>
    </div>);
}

export function SimulationBiot() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [pos, setPos] = useState({ L1: 2, P1: 1, P2: 0.5 });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('C');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, essayer: false, retenir: false });
  const [ex, setEx] = useState(exInitial);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const okLongueur = Math.abs(B.alphaPur(S.camphre, pos.L1, 0.1) - 17.6) < 0.05, okRacemique = Math.abs(pos.P1 - 0.5) < 0.01, okComplet = Math.abs(pos.P2 - 0.75) < 0.01;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'lumiere', titre: 'Un composé qui fait tourner la lumière',
      texte: <>Une lampe émet de la lumière qu’un <strong>polariseur</strong> rend « polarisée » : elle oscille dans un seul plan, ici <strong>vertical</strong> (les traits jaunes). Ce faisceau traverse une cuve contenant une solution de camphre, une molécule <strong>chirale</strong>. Le cadran de droite montre l’orientation du plan de polarisation à la sortie de la cuve. Observez les traits jaunes le long du faisceau.</>,
      tache: { type: 'qcm', q: 'Que fait la solution chirale au plan de polarisation de la lumière ?', options: ['Elle le supprime : la lumière ne sort plus polarisée', 'Elle le laisse vertical et affaiblit seulement la lumière', 'Elle le fait tourner d’un angle α, appelé pouvoir rotatoire', 'Elle le divise en deux plans perpendiculaires'], bonne: 2,
        expl: 'Un composé chiral est « optiquement actif » : il fait tourner le plan de polarisation d’un angle α, le pouvoir rotatoire, que l’on mesure avec un polarimètre.',
        indice: 'Comparez l’orientation des traits jaunes avant la cuve et après la cuve, puis regardez l’aiguille du cadran.' } },
    { id: 'sens', titre: 'Dextrogyre ou lévogyre ?',
      texte: <>On remplace la solution par celle de l’<strong>autre énantiomère</strong> d’un composé (le menthol), à la même concentration. Un composé qui fait tourner le plan <strong>vers la droite</strong> est dit <strong>dextrogyre</strong> et son angle α est <strong>positif</strong> ; vers la <strong>gauche</strong>, il est <strong>lévogyre</strong> et α est <strong>négatif</strong>. Regardez l’aiguille du cadran, vue de face.</>,
      tache: { type: 'qcm', q: 'Cette solution est :', options: ['dextrogyre : α est positif', 'lévogyre : α est négatif', 'dextrogyre : α est négatif', 'lévogyre : α est positif'], bonne: 1,
        expl: 'Le plan a tourné vers la gauche : le composé est lévogyre et son pouvoir rotatoire α est négatif.', indice: 'De quel côté l’aiguille jaune s’est-elle déplacée par rapport à la verticale en pointillés ?' } },
    { id: 'biot', titre: 'La loi de Biot : prévoir α',
      retenirTitre: 'À retenir : le sens de rotation',
      retenir: <><SvgSensCarte/><ul style={ULS}>
        <li>Rotation vers la <strong>droite</strong> : composé <strong>dextrogyre</strong>, noté (+), α &gt; 0.</li>
        <li>Rotation vers la <strong>gauche</strong> : composé <strong>lévogyre</strong>, noté (−), α &lt; 0.</li>
        <li>On mesure α avec un <strong>polarimètre</strong>.</li></ul></>,
      texte: <>Pour une solution d’un seul énantiomère, la <strong>loi de Biot</strong> relie α à la cuve et à la solution : <strong>α = [α] × L × C</strong>. Ici, <strong>[α]</strong> est le <strong>pouvoir rotatoire spécifique</strong> du composé (une donnée), <strong>L</strong> la longueur de la cuve en <strong>décimètres</strong> (dm) et <strong>C</strong> la concentration massique en <strong>g/mL</strong>. Pour le camphre dextrogyre, [α] = +44, la cuve mesure <strong>L = 2,0 dm (20 cm)</strong> et la solution a pour concentration <strong>C = 0,10 g/mL</strong>.</>,
      tache: { type: 'num', q: 'Quel est le pouvoir rotatoire α de cette solution (en °) ?', unite: '°', vrai: 8.8, tol: 0.03, affiche: v => nb(v, 1), cs: 2, carnet: false,
        calcul: () => ['Loi de Biot : α = [α] × L × C, avec L en dm (20 cm = 2,0 dm).', 'α = 44 × 2,0 × 0,10 = +8,8°.'],
        pieges: [[88, 'Vous avez utilisé L = 20 (en cm). La loi de Biot demande L en décimètres : 20 cm = 2,0 dm.'], [4.4, 'Vous avez oublié la longueur L de la cuve : α = [α] × L × C.'], [0.88, 'Vérifiez la conversion : 2,0 dm sont bien 2,0 (et non 0,2) dans la loi de Biot.']],
        expl: 'α = 44 × 2,0 × 0,10 = +8,8° : positif, car le camphre est dextrogyre.', indice: 'Multipliez les trois facteurs : [α] = 44, L = 2,0 dm et C = 0,10 g/mL.' } },
    { id: 'unite', titre: 'L’unité de [α]',
      texte: <>Dans la loi de Biot, α s’exprime en degrés (°), L en dm et C en g/mL. Le facteur <strong>[α]</strong> doit donc compenser ces unités pour que le produit [α] × L × C soit bien en degrés.</>,
      tache: { type: 'qcm', q: 'Quelle est l’unité du pouvoir rotatoire spécifique [α] ?', options: ['le degré (°)', '°·cm⁻¹·g⁻¹·mL', 'g·mL⁻¹·dm⁻¹', '°·dm⁻¹·g⁻¹·mL'], bonne: 3,
        expl: '[α] = α ÷ (L × C) : (°) ÷ (dm × g/mL) = °·dm⁻¹·g⁻¹·mL.', indice: 'Isolez [α] : [α] = α ÷ (L × C), puis écrivez l’unité de ce quotient.' } },
    { id: 'longueur', titre: 'α est proportionnel à L',
      retenirTitre: 'À retenir : la loi de Biot',
      retenir: <><SvgBiotCarte/><ul style={ULS}>
        <li><strong>α = [α] × L × C</strong>, avec L en dm et C en g/mL.</li>
        <li>[α] s’exprime en <strong>°·dm⁻¹·g⁻¹·mL</strong>.</li>
        <li>α est <strong>proportionnel</strong> à L et à C.</li></ul></>,
      texte: <>Gardons le camphre dextrogyre à C = 0,10 g/mL ([α] = +44). Faites glisser <strong>l’extrémité de la cuve</strong> (la poignée rouge) : le cadran affiche maintenant la valeur de α. Observez comment α varie avec L, puis réglez L pour lire <strong>α = +17,6°</strong>.</>,
      tache: { type: 'action', ok: okLongueur, consigne: okLongueur ? '✓ α = +17,6° : la cuve mesure 4,0 dm.' : 'Réglez L pour que α = +17,6°.' } },
    { id: 'concentration', titre: 'Retrouver la concentration',
      texte: <>La cuve mesure <strong>L = 20 cm</strong> et contient une solution d’un seul énantiomère : le carvone dextrogyre, de pouvoir rotatoire spécifique <strong>[α] = +60 °·dm⁻¹·g⁻¹·mL</strong>. La concentration C est inconnue. Le polarimètre indique <strong>α = +9,6°</strong>.</>,
      tache: { type: 'num', q: 'Quelle est la concentration C de la solution (en g/mL) ?', unite: 'g/mL', vrai: 0.08, tol: 0.03, affiche: v => nb(v, 3), cs: 2, carnet: false,
        calcul: () => ['On isole C : C = α ÷ ([α] × L), avec L = 20 cm = 2,0 dm.', 'C = 9,6 ÷ (60 × 2,0) = 0,080 g/mL.'],
        pieges: [[0.008, 'Vous avez utilisé L = 20 (en cm) : convertissez-la en décimètres (2,0 dm).'], [0.16, 'Vous avez oublié de diviser par la longueur L de la cuve : C = α ÷ ([α] × L).'], [12.5, 'Vous avez inversé le quotient : C = α ÷ ([α] × L).']],
        expl: 'C = α ÷ ([α] × L) = 9,6 ÷ (60 × 2,0) = 0,080 g/mL.', indice: 'La loi de Biot α = [α] × L × C donne C = α ÷ ([α] × L). Convertissez L en dm.' } },
    { id: 'melange', titre: 'Un mélange de deux énantiomères',
      texte: <>Une solution peut contenir <strong>les deux énantiomères</strong> d’un composé : le (+) (dextrogyre) et le (−) (lévogyre), de même |[α]| mais de signes opposés. Leurs rotations <strong>s’ajoutent</strong> : positive pour le (+), négative pour le (−). Camphre, L = 2,0 dm, concentration totale C = 0,10 g/mL. Faites glisser le <strong>curseur de composition</strong> (poignée violette) et réglez-le pour que <strong>α = 0°</strong>.</>,
      tache: { type: 'action', ok: okRacemique, consigne: okRacemique ? '✓ α = 0° : le plan de polarisation n’a pas tourné.' : 'Réglez la composition pour que α = 0°.' } },
    { id: 'racemique', titre: 'Pourquoi α = 0 ?',
      texte: <>Pour le mélange de 50 % de (+) et 50 % de (−), le cadran indique α = 0° : le plan de polarisation n’a pas tourné.</>,
      tache: { type: 'qcm', q: 'Pourquoi le plan ne tourne-t-il pas ?', options: ['Les deux énantiomères se détruisent chimiquement et disparaissent', 'Leurs rotations opposées, en quantités égales, se compensent exactement', 'Le polarimètre ne sait pas mesurer un mélange', 'La solution est trop diluée pour faire tourner le plan'], bonne: 1,
        expl: '50 % de (+) donnent +x° et 50 % de (−) donnent −x° : la somme est nulle. Ce mélange 50/50 s’appelle un mélange racémique ; les deux molécules sont bien présentes, mais le mélange est optiquement inactif.',
        indice: 'Que vaut la rotation du (+) ? celle du (−) ? Que donne leur somme quand les quantités sont égales ?' } },
    { id: 'ee', titre: 'L’excès énantiomérique',
      retenirTitre: 'À retenir : le mélange racémique',
      retenir: <><SvgRacemiqueCarte/><ul style={ULS}>
        <li><strong>Mélange racémique</strong> : autant de (+) que de (−).</li>
        <li>Les rotations opposées <strong>se compensent</strong> : α = 0.</li>
        <li>Le mélange est <strong>optiquement inactif</strong>, mais il contient bien les deux énantiomères.</li></ul></>,
      texte: <>Quand un énantiomère est plus abondant que l’autre, on mesure ce déséquilibre par l’<strong>excès énantiomérique</strong> : <strong>e.e. = |n₊ − n₋| ÷ (n₊ + n₋) × 100</strong>, où n₊ et n₋ sont les quantités de matière (en mol) des énantiomères (+) et (−). Il vaut 0 % pour un racémique et 100 % pour un énantiomère pur. Ici, le mélange contient <strong>85 % de (+)</strong> et <strong>15 % de (−)</strong>.</>,
      tache: { type: 'num', q: 'Quel est l’excès énantiomérique e.e. de ce mélange (en %) ?', unite: '%', vrai: 70, tol: 0.03, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['e.e. = |n₊ − n₋| ÷ (n₊ + n₋) × 100, avec 85 % et 15 % du total.', 'e.e. = |85 − 15| ÷ (85 + 15) × 100 = 70 %.'],
        pieges: [[85, 'Vous avez donné le pourcentage de (+). L’excès est la différence entre les deux pourcentages, divisée par leur somme.'], [0.7, 'Votre valeur est une fraction : multipliez par 100 pour l’exprimer en %.'], [30, 'Vous avez donné 2 × 15. Il faut la différence |85 − 15| = 70, divisée par la somme 100.']],
        expl: 'e.e. = |85 − 15| ÷ (85 + 15) × 100 = 70 %.', indice: 'Calculez la différence en valeur absolue des deux pourcentages, divisez par leur somme, puis multipliez par 100.' } },
    { id: 'alphaee', titre: 'Trouver e.e. avec le polarimètre',
      texte: <>On ne connaît pas toujours la composition : on la déduit de α. Une solution de menthol à <strong>C = 0,20 g/mL</strong>, dans une cuve de <strong>L = 1,0 dm</strong>, donne <strong>α = −6,0°</strong>. Le même menthol, <strong>énantiomère (−) pur</strong> et à la même concentration, donnerait <strong>α = −10,0°</strong> (loi de Biot : −50 × 1,0 × 0,20). Comme α est proportionnel à l’excès : <strong>e.e. = |α| ÷ |α de l’énantiomère pur| × 100</strong>.</>,
      tache: { type: 'num', q: 'Quel est l’excès énantiomérique e.e. de ce mélange (en %) ?', unite: '%', vrai: 60, tol: 0.03, affiche: v => nb(v, 0), cs: 2, carnet: false,
        calcul: () => ['e.e. = |α| ÷ |α pur| × 100 = 6,0 ÷ 10,0 × 100.', 'e.e. = 60 %, avec le (−) en excès (α est négatif).'],
        pieges: [[0.6, 'Votre valeur est une fraction : multipliez par 100 pour l’exprimer en %.'], [40, 'Vous avez calculé (10,0 − 6,0) ÷ 10,0 : l’excès se lit directement dans le rapport |α| ÷ |α pur|.'], [-60, 'L’excès énantiomérique est toujours positif : le signe de α indique seulement quel énantiomère est en excès.']],
        expl: 'e.e. = 6,0 ÷ 10,0 × 100 = 60 % : le mélange contient 80 % de (−) et 20 % de (+).', indice: 'Divisez la valeur absolue de α mesuré par la valeur absolue de α de l’énantiomère pur, puis multipliez par 100.' } },
    { id: 'complet', titre: 'Préparer un mélange d’e.e. donné',
      retenirTitre: 'À retenir : l’excès énantiomérique',
      retenir: <><SvgEECarte/><ul style={ULS}>
        <li><strong>e.e. = |n₊ − n₋| ÷ (n₊ + n₋) × 100</strong>.</li>
        <li>0 % pour un racémique, 100 % pour un énantiomère pur.</li>
        <li><strong>α = e.e. × α</strong> de l’énantiomère pur (au signe de l’énantiomère en excès).</li></ul></>,
      texte: <>Camphre, L = 2,0 dm, C = 0,10 g/mL. Faites glisser le <strong>curseur de composition</strong> pour préparer un mélange dont l’<strong>excès énantiomérique est de 50 %</strong>, avec le <strong>(+) en excès</strong>. Vérifiez la valeur de α affichée.</>,
      tache: { type: 'action', ok: okComplet, consigne: okComplet ? '✓ 75 % de (+) et 25 % de (−) : e.e. = 50 %, α = +4,4°.' : 'Réglez la composition pour obtenir e.e. = 50 % avec le (+) en excès.', attente: okComplet ? null : 'Réglez la composition pour obtenir e.e. = 50 % avec le (+) en excès.' } },
    { id: 'carbocation', titre: 'Lien avec les mécanismes',
      texte: <>Dans un mécanisme, un <strong>carbocation plan</strong> (un carbone chargé positivement, entouré de trois groupes dans un même plan) est attaqué par un nucléophile aussi souvent d’un côté du plan que de l’autre. Si le produit formé possède un seul carbone asymétrique, chacune des deux faces d’attaque donne un énantiomère différent.</>,
      tache: { type: 'qcm', q: 'On mesure le pouvoir rotatoire du produit brut de cette réaction. Que trouve-t-on ?', options: ['α maximal : un seul énantiomère s’est formé', 'α = 0 : mélange racémique, e.e. = 0 %', 'α non nul : l’énantiomère le plus stable domine', 'α = 0 car le produit n’est pas chiral'], bonne: 1,
        expl: 'Les deux faces du carbocation plan sont attaquées avec la même probabilité : on obtient 50 % de chaque énantiomère, un mélange racémique, optiquement inactif (α = 0, e.e. = 0 %).',
        indice: 'Chaque face est attaquée avec la même probabilité : combien obtient-on de (+) et de (−) ? Que vaut alors α ?' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : du polarimètre au résultat',
      retenir: <><SvgBilanBiotCarte/><ul style={ULS}>
        <li>Pour un énantiomère pur : <strong>C = |α| ÷ ([α] × L)</strong> (L en dm).</li>
        <li>Pour un mélange : <strong>e.e. = |α| ÷ |α pur| × 100</strong>.</li>
        <li>Le signe de α indique quel énantiomère est en excès.</li></ul></>,
      texte: <>Vous savez lire un pouvoir rotatoire (sens, signe), appliquer la loi de Biot (α = [α] × L × C, avec L en dm), expliquer qu’un mélange racémique est inactif et calculer un excès énantiomérique à partir de α. La suite : explorer librement, ou relever les défis.</>,
      tache: null },
  ];

  const nouveauDefi = type => { const t = type === 'C' ? B.tirageDefiC() : B.tirageDefiEE(); setDefi({ ...t, genre: type, rep: '', verifie: false, corr: false }); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défis ----------
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const verifier = () => {
    const v = lire(defi.rep), dq = defi.genre === 'C' ? B.diagC(defi, v) : B.diagEE(defi, v);
    setDefi(d => ({ ...d, verifie: true, ok: dq.ok, dq })); (defi.genre === 'C' ? noterC : noterE)(dq.ok);
  };
  const voletDefi = defi && (() => {
    const dC = defi.genre === 'C', s = defi.sub, sg = dC ? defi.signe : 1;
    const champ = (unite) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <input value={defi.rep} aria-label="Votre réponse" inputMode="decimal" onChange={ev => modifie({ rep: ev.target.value })} onKeyDown={e => e.key === 'Enter' && document.getElementById('bx-verif')?.click()}
          style={{ width: 110, padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }}/>
        <span style={lbl}>{unite}</span></span>);
    const aP = !dC ? B.alphaPur(s, defi.L, defi.C) : 0;
    return (<div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['C', 'Retrouver C'], ['ee', 'Excès énantiomérique']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, BLEU)}>{l}</button>)}
      </div>
      {dC ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : retrouver la concentration</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Une solution d’un seul énantiomère de <strong>{s.nom}</strong>, de pouvoir rotatoire spécifique <strong>[α] = {sg > 0 ? '+' : '−'}{s.A}{NB}°·dm⁻¹·g⁻¹·mL</strong>, est placée dans une cuve de <strong>{nb(defi.L * 10, 0)}{NB}cm</strong>. Le polarimètre indique <strong>α = {B.fmtDeg(defi.alpha, 2)}°</strong>. Calculez la concentration C de la solution, en g/mL.</div>
        <div style={{ ...lbl, marginBottom: 8 }}>C = {champ('g/mL')}</div>
        <IndiceDefi cache={false}>La loi de Biot α = [α] × L × C donne C = α ÷ ([α] × L). Convertissez la longueur de la cuve en décimètres (1 dm = 10 cm) avant de calculer.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : excès énantiomérique d’un mélange</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Un mélange des deux énantiomères du <strong>{s.nom}</strong> ([α] = ±{s.A}{NB}°·dm⁻¹·g⁻¹·mL pour les énantiomères purs) est placé dans une cuve de <strong>{nb(defi.L * 10, 0)}{NB}cm</strong>, à la concentration totale <strong>C = {nb(defi.C, 2)}{NB}g/mL</strong>. Le polarimètre indique <strong>α = {B.fmtDeg(defi.alpha, 2)}°</strong>. Calculez l’excès énantiomérique du mélange, en %.</div>
        <div style={{ ...lbl, marginBottom: 8 }}>e.e. = {champ('%')}</div>
        <IndiceDefi cache={false}>Calculez d’abord α de l’énantiomère pur avec la loi de Biot (|[α]| × L × C, L en dm), puis e.e. = |α| ÷ |α pur| × 100.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="bx-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.genre)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (dC ? `✓ Correct : C = ${nb(defi.vrai, 3)} g/mL.` : `✓ Correct : e.e. = ${nb(defi.vrai, 0)} %, avec le (${defi.signe > 0 ? '+' : '−'}) en excès.`) : `✗ ${defi.dq.msg}`}
      </div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {dC ? <>
          <div>L = {nb(defi.L * 10, 0)} cm = {nb(defi.L, 1)} dm.</div>
          <div>C = |α| ÷ ([α] × L) = {nb(Math.abs(defi.alpha), 2)} ÷ ({s.A} × {nb(defi.L, 1)}) = <strong>{nb(defi.vrai, 3)} g/mL</strong>.</div></>
          : <>
          <div>α de l’énantiomère pur : {s.A} × {nb(defi.L, 1)} × {nb(defi.C, 2)} = {nb(aP, 2)}°.</div>
          <div>e.e. = |α| ÷ |α pur| × 100 = {nb(Math.abs(defi.alpha), 2)} ÷ {nb(aP, 2)} × 100 = <strong>{nb(defi.vrai, 0)} %</strong>, avec le ({defi.signe > 0 ? '+' : '−'}) en excès.</div></>}
      </div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Loi de Biot</strong> : α = [α] × L × C, valable pour une solution diluée d’un seul composé actif ; L en dm, C en g/mL. Le pouvoir rotatoire spécifique [α] dépend de la longueur d’onde (raie D du sodium), de la température (20 °C) et du solvant ; ces conditions ne sont pas modélisées.</li>
      <li><strong>Valeurs de [α]</strong> : camphre ±44, menthol ±50, carvone ±60 °·dm⁻¹·g⁻¹·mL. Ce sont des valeurs indicatives arrondies pour la simulation (les valeurs de la littérature dépendent du solvant et des conditions de mesure).</li>
      <li><strong>Énantiomères</strong> : les deux énantiomères d’un composé ont des pouvoirs rotatoires spécifiques opposés. Pour un mélange, les pouvoirs rotatoires s’additionnent : α = α₊ + α₋ (solution diluée, sans interaction entre les énantiomères).</li>
      <li><strong>Polarimètre</strong> : lecture idéale à 0,01° près (le polarimètre de Laurent, à demi-ombre, n’est pas étudié). Dans le dessin, le plan tourne proportionnellement à la distance parcourue dans la cuve ; la lumière est supposée monochromatique.</li>
      <li><strong>Excès énantiomérique</strong> : e.e. = |n₊ − n₋| ÷ (n₊ + n₋) × 100, calculé à partir des quantités de matière ; pour deux énantiomères de même masse molaire, il est égal à |C₊ − C₋| ÷ (C₊ + C₋) × 100.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez la longueur L de la cuve, puis la concentration C : que devient α dans chaque cas ?</li>
        <li>Passez de l’énantiomère (+) pur à l’énantiomère (−) pur : que deviennent la valeur et le signe de α ?</li>
        <li>Choisissez « Mélange racémique » : que vaut α ? Que vaut-il si on double L ?</li>
        <li>Pour 75 % de (+), calculez e.e. puis comparez α à celui de l’énantiomère (+) pur : quel lien observez-vous ?</li>
        <li>Trouvez deux compositions différentes qui donnent la même valeur absolue de α : quelle différence entre elles ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Dextrogyre (+) : le plan tourne vers la droite, α &gt; 0. Lévogyre (−) : vers la gauche, α &lt; 0.</li>
        <li>Loi de Biot : α = [α] × L × C (L en dm, C en g/mL, [α] en °·dm⁻¹·g⁻¹·mL).</li>
        <li>Mélange racémique : autant de (+) que de (−), α = 0, e.e. = 0 %.</li>
        <li>e.e. = |n₊ − n₋| ÷ (n₊ + n₋) × 100 = |α| ÷ |α de l’énantiomère pur| × 100.</li>
        <li>Un carbocation plan donne les deux énantiomères en quantités égales : mélange racémique.</li>
      </ul>)}
    </Section>);

  // ---------- scène ----------
  const sc = enGuide ? SCENES[idE] : null;
  const ariaSc = sc ? `Polarimètre : lampe, polariseur, cuve de solution et cadran indiquant l’orientation du plan de polarisation${sc.ctrlL || sc.ctrlP ? ', avec des poignées de réglage' : ''}.` : '';
  const cleGuide = { longueur: ['L1', null], melange: [null, 'P1'], complet: [null, 'P2'] }[idE] || [null, null];
  const scDefi = defi ? { ...BASE, sub: defi.sub, L: defi.L, C: defi.C, p: defi.genre === 'C' ? (defi.signe > 0 ? 1 : 0) : defi.p, showAlpha: true, valeurs: true, showC: defi.genre === 'ee', aide: 'Le polarimètre donne α ; les autres données sont dans l’énoncé.' } : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .bx-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .bx-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); }
        @media (max-width: 900px) { .bx-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .bx-in { animation: bx-fondu 0.35s ease-out; } @keyframes bx-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Pouvoir rotatoire et loi de Biot</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un composé <strong>chiral</strong> fait tourner le plan de polarisation de la lumière : le <strong>polarimètre</strong> mesure cet angle α. La <strong>loi de Biot</strong> le relie à la concentration, et l’<strong>excès énantiomérique</strong> en déduit la composition d’un mélange.</div>
      {!enExplore && <div className={`bx-l1${(enGuide && sc) || (enDefi && scDefi) ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'C' ? suiviC : suiviE}/></div>}
          {enDefi && scDefi && <div key={`d${defi.genre}${defi.alpha}${defi.L}`} style={{ marginTop: 10 }}>
            <Scene sc={scDefi} L={defi.L} C={defi.C} p={scDefi.p} alphaFixe={defi.alpha}
              aria="Polarimètre : lampe, polariseur, cuve de solution et cadran qui indique la rotation α du plan de polarisation."/></div>}
          {enGuide && sc && <div className="bx-in" key={`s${idE}`}><SceneGuide sc={sc} pos={pos} setPos={setPos} cleL={cleGuide[0]} cleP={cleGuide[1]} aria={ariaSc}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <BiotExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
