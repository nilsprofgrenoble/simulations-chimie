import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mousseModele";
import { QCM } from "./mousseQcm";
import { SvgLamelle, SvgAntimousse, SvgFormulesTensio, SvgComparaisonLamelles, SvgMousse, SvgCourbeMousse, SvgCarteLamelle, SvgCarteMesures, SvgCarteBilanMousse } from "./MousseSchemas";

const SIM_ID = 226, CLE_GUIDE = 'mousse-guide-v1';
declarerDefis(SIM_ID, [['masse', 'Peser le tensioactif pour une solution à k fois la CMC'], ['diagnostic', 'Diagnostiquer une formulation de liquide vaisselle']]);

// ====================================================
//  SIM 226 — MOUSSES : FORMER, STABILISER, DÉTRUIRE (BTS MDC, Formulation › Tensioactifs et émulsions ; fil rouge : un liquide vaisselle, et l’antimousse quand la mousse gêne)
//  Capacités visées (jamais affichées à l'élève) : expliquer le mode d'action d'un tensioactif dans une mousse ; déterminer le pouvoir moussant d'un mélange ;
//  contrôler la stabilité d'une mousse ; expliquer le mode d'action des agents antimousse.
//  Modèle QUALITATIF : mousseModele.js. Schémas : MousseSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const BASE = { t: 'sds', c: 5, r: 0, v: 0, ca: 0, g: 'air', d: 0 };
const TEMPS_RM = [0, 2, 4, 6, 8, 10];
const HRM = TEMPS_RM.map(t => Math.round(M.hauteurRM(BASE, t) * 10) / 10);           // valeurs AFFICHÉES au dixième : elles servent au corrigé
const PERTE = (HRM[0] - HRM[5]) / HRM[0] * 100;
const DOS = { k: 5, V: 250 };
const MASSE = M.masseTensio(DOS.k, M.CMC_SDS, M.M_SDS, DOS.V);
const TH0 = M.demiVie(BASE);

export function SimulationMousse() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState({ ...BASE, c: 0.2, tps: 0 });                                         // scène du parcours
  const [ex, setEx] = useState({ ...BASE, tps: 0, courbe: 'rm' });                                       // exploration
  const [ouv, setOuv] = useState({});
  const [suiviD, noterD] = useCompteurDefi(), [suiviG, noterG] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('masse');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'lamelle', titre: 'Une mousse : de l’air séparé par du liquide', focus: ['scene'],
      texte: <>Dans un liquide vaisselle, on veut de la <strong>mousse</strong> : un grand nombre de bulles d’air accolées. Entre deux bulles voisines, il reste un film de liquide très mince, la <strong>lamelle</strong>. Sur le schéma, les molécules de <strong>tensioactif</strong> (SDS) sont rangées sur les deux faces de la lamelle : tête hydrophile dans l’eau, queue hydrophobe vers l’air.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’eau pure ne donne-t-elle pas de mousse durable ?', ...QCM.lamelle,
        expl: 'Sans tensioactif, rien ne stabilise la lamelle d’eau entre deux bulles : elle s’amincit et se rompt presque aussitôt. Les tensioactifs, adsorbés sur ses deux faces, la rendent plus résistante.', indice: 'Regardez ce qui se trouve sur chaque face de la lamelle du schéma. Que manque-t-il dans l’eau pure ?' } },
    { id: 'cmc-action', titre: 'Fabriquer la mousse : la concentration en tensioactif', focus: ['scene', 'curseur'],
      retenirTitre: 'À retenir : la lamelle', retenir: <>
        <SvgCarteLamelle/>
        <ul style={puces}>
          <li>Une mousse est faite de bulles séparées par des <strong>lamelles</strong> de liquide.</li>
          <li>Les <strong>tensioactifs</strong> s’adsorbent sur les deux faces de la lamelle et la stabilisent.</li>
        </ul></>,
      texte: <>On agite une solution de SDS. Sa concentration s’exprime en multiples de la <strong>CMC</strong> (concentration micellaire critique, {fr(M.CMC_SDS, 1)} mmol/L pour le SDS). Montez la concentration avec le curseur et observez la hauteur de mousse obtenue. Réglez-la entre <strong>5 et 10 fois la CMC</strong>, valeur usuelle d’un produit moussant.</>,
      tache: { type: 'action', ok: vie.c >= 5 && vie.c <= 10, consigne: 'Régler la concentration entre 5 et 10 fois la CMC' } },
    { id: 'cmc-q', titre: 'Pourquoi 5 à 10 fois la CMC ?', focus: ['scene'],
      texte: <>Au-dessus de la CMC, les molécules de tensioactif en excès s’assemblent en <strong>micelles</strong>. Une mousse en formation crée sans cesse de nouvelles surfaces eau-air qu’il faut recouvrir de tensioactif.</>,
      tache: { type: 'qcm', q: 'Pourquoi vise-t-on environ 5 à 10 fois la CMC dans un produit moussant ?', ...QCM.micelles,
        expl: 'Le tensioactif doit rester disponible, sous forme de micelles, même une fois les bulles formées : les micelles se défont et fournissent du tensioactif aux nouvelles interfaces. Avec trop peu de tensioactif, la mousse est faible et disparaît vite.', indice: 'Que deviennent les micelles quand de nouvelles bulles apparaissent et ont besoin de tensioactif ?' } },
    { id: 'masse-num', titre: 'Peser le tensioactif', focus: ['mesures'],
      texte: <>On prépare <strong>{DOS.V} mL</strong> de solution de SDS à <strong>{DOS.k} fois la CMC</strong>. Les données utiles figurent dans le tableau (CMC en mmol/L, masse molaire en g/mol).</>,
      tache: { type: 'num', q: 'Masse de SDS à peser', unite: 'g', vrai: MASSE, tol: 0.03, affiche: v => fr(v, 2), cs: 3,
        calcul: () => [`Concentration visée : ${DOS.k} × ${fr(M.CMC_SDS, 1)} = ${fr(DOS.k * M.CMC_SDS, 1)} mmol/L = ${fr(DOS.k * M.CMC_SDS / 1000, 4)} mol/L.`, `Quantité de matière dans ${DOS.V} mL : n = ${fr(DOS.k * M.CMC_SDS / 1000, 4)} × ${fr(DOS.V / 1000, 3)} = ${fr(DOS.k * M.CMC_SDS / 1000 * DOS.V / 1000, 5)} mol.`, `Masse : m = n × M = ${fr(DOS.k * M.CMC_SDS / 1000 * DOS.V / 1000, 5)} × ${fr(M.M_SDS, 1)} = ${fr(MASSE, 2)} g.`],
        pieges: [[MASSE / DOS.k, 'Vous avez oublié le facteur 5 : on veut une concentration égale à 5 fois la CMC.'], [MASSE * 1000, 'Erreur d’unité : 8,2 mmol/L vaut 8,2·10⁻³ mol/L, pas 8,2 mol/L.'], [MASSE * 1000 / DOS.V, 'Vous avez oublié le volume : 250 mL valent 0,250 L.']],
        expl: `c = 5 × 8,2 = 41 mmol/L ; n = 0,041 × 0,250 ≈ 1,03·10⁻² mol ; m = n × M ≈ ${fr(MASSE, 2)} g.`, indice: 'n = c × V avec c en mol/L et V en L ; puis m = n × M.' } },
    { id: 'moussa-stab', titre: 'Moussabilité et stabilité : deux choses différentes', focus: ['scene'],
      texte: <>Deux qualités d’une mousse sont à distinguer : la <strong>moussabilité</strong> (aptitude à former de la mousse) et la <strong>stabilité</strong> (aptitude à durer). On verse une solution et on suit la hauteur de mousse au cours du temps : voici la courbe d’une solution.</>,
      tache: { type: 'qcm', q: 'Une solution donne 18 cm de mousse qui disparaît en moins de deux minutes. Comment la décrire ?', ...QCM.moussaStab,
        expl: 'La hauteur initiale (18 cm) mesure la moussabilité : elle est élevée. La vitesse de disparition mesure la stabilité : ici la mousse disparaît vite, elle est peu stable. Les deux qualités sont indépendantes.', indice: 'La hauteur de départ renseigne sur la formation ; la vitesse de décroissance sur la durée de vie.' } },
    { id: 'ross-miles', titre: 'Mesurer le pouvoir moussant : Ross-Miles', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Méthode de <strong>Ross-Miles</strong> : on verse 200 mL de solution depuis 90 cm de haut dans une éprouvette contenant déjà 50 mL de la même solution. La hauteur de mousse formée mesure la moussabilité ; on relève ensuite la hauteur au cours du temps (les essais normalisés la lisent à t = 0 puis à 5 min) pour estimer la stabilité. Faites avancer le temps avec le curseur : le tableau donne les hauteurs relevées pour une solution de SDS à 5 CMC.</>,
      tache: { type: 'num', q: 'Part de la hauteur initiale perdue au bout de 10 minutes', unite: '%', vrai: PERTE, tol: 0.03, affiche: v => fr(v, 0), cs: 2,
        calcul: () => [`Hauteur initiale : ${fr(HRM[0], 1)} cm ; hauteur à 10 min : ${fr(HRM[5], 1)} cm.`, `Perte : ${fr(HRM[0], 1)} − ${fr(HRM[5], 1)} = ${fr(HRM[0] - HRM[5], 1)} cm.`, `En pourcentage de la hauteur initiale : ${fr(HRM[0] - HRM[5], 1)} ÷ ${fr(HRM[0], 1)} × 100 = ${fr(PERTE, 0)} %.`],
        pieges: [[HRM[5] / HRM[0] * 100, 'C’est la part de hauteur restante : on demande la part perdue.'], [HRM[0] - HRM[5], 'C’est la perte en cm : il faut la ramener à la hauteur initiale pour avoir un pourcentage.']],
        expl: `(${fr(HRM[0], 1)} − ${fr(HRM[5], 1)}) ÷ ${fr(HRM[0], 1)} × 100 ≈ ${fr(PERTE, 0)} %.`, indice: 'perte (%) = (hauteur initiale − hauteur à 10 min) ÷ hauteur initiale × 100.' } },
    { id: 'bikerman', titre: 'Un autre protocole : Bikerman', focus: ['scene'],
      texte: <>Méthode de <strong>Bikerman</strong> : on injecte un débit <strong>constant</strong> de gaz à travers un fritté dans une colonne contenant 20 mL de solution. La mousse s’accumule : sa hauteur monte, puis se stabilise. Si l’on arrête le gaz à 10 min (méthode mixte), la hauteur décroît : on peut en déduire la stabilité.</>,
      tache: { type: 'qcm', q: 'Pourquoi la hauteur de mousse atteint-elle un plateau sous débit de gaz constant ?', ...QCM.plateau,
        expl: 'En bas de la colonne, la mousse se forme à vitesse constante ; en haut, la mousse la plus âgée se rompt de plus en plus vite. Quand les deux vitesses sont égales, la hauteur reste constante : c’est un équilibre dynamique, qui combine moussabilité et stabilité.', indice: 'Que fait le gaz en bas de la colonne ? Que devient la mousse la plus ancienne, en haut ?' } },
    { id: 'ethoxy', titre: 'Choisir un tensioactif : SDS ou laureth sulfate', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : mesurer une mousse', retenir: <>
        <SvgCarteMesures/>
        <ul style={puces}>
          <li><strong>Moussabilité</strong> : hauteur de mousse formée ; <strong>stabilité</strong> : vitesse de disparition.</li>
          <li>On compare les solutions à <strong>quantité égale</strong> de tensioactif.</li>
        </ul></>,
      texte: <>Le SDS est un bon moussant, mais ses têtes chargées négativement se repoussent : elles ne peuvent pas se rapprocher beaucoup à la surface. On peut <strong>éthoxyler</strong> le SDS pour obtenir le <strong>laureth sulfate de sodium</strong>. Comparez les couches de tensioactif et les demi-vies de mousse mesurées à 5 CMC.</>,
      tache: { type: 'qcm', q: 'Pourquoi le laureth sulfate donne-t-il une mousse plus stable que le SDS ?', ...QCM.ethoxy,
        expl: 'L’éthoxylation permet un arrangement plus compact des molécules à l’interface : la cohésion de la couche augmente et la lamelle résiste mieux. La charge négative reste présente ; ce n’est pas un changement de charge.', indice: 'Regardez la densité de molécules sur chaque face de la lamelle.' } },
    { id: 'supermoussant', titre: 'Un supermoussant : le dodécanol', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Un additif <strong>supermoussant</strong> améliore la cohésion de la couche de tensioactif. Le <strong>dodécanol</strong>, alcool gras à 12 carbones non ionique, s’intercale entre les molécules de SDS. Ajoutez du dodécanol jusqu’à <strong>doubler la demi-vie</strong> de la mousse (demi-vie du SDS seul : {fr(TH0, 1)} min).</>,
      tache: { type: 'action', ok: M.demiVie(vie) >= 1.99 * TH0, consigne: 'Ajouter du dodécanol pour doubler la demi-vie de la mousse' } },
    { id: 'facteurs', titre: 'Les autres facteurs : eau, viscosité, gaz', focus: ['scene', 'curseur', 'mesures'],
      texte: <>D’autres paramètres jouent sur la stabilité d’une mousse : la <strong>dureté de l’eau</strong> (ions Ca²⁺ et Mg²⁺), la <strong>viscosité</strong> du milieu et la <strong>nature du gaz</strong> (le diazote, peu soluble, forme une mousse plus stable que le dioxyde de carbone). Modifiez-les un par un et observez la demi-vie.</>,
      tache: { type: 'qcm', q: 'Quel changement diminue la stabilité d’une mousse de SDS ?', ...QCM.facteurs,
        expl: 'Les ions Ca²⁺ d’une eau dure interagissent avec le tensioactif anionique et affaiblissent le pouvoir moussant, d’où l’intérêt d’un séquestrant. Épaissir le milieu, utiliser un gaz peu soluble ou augmenter la concentration (jusqu’à 5 à 10 CMC) stabilisent au contraire la mousse.', indice: 'Testez chaque réglage et repérez celui qui fait baisser la demi-vie.' } },
    { id: 'antimousse-action', titre: 'Quand la mousse gêne : l’antimousse', focus: ['scene', 'curseur', 'mesures'],
      texte: <>En lave-vaisselle, une mousse abondante gêne le rinçage : on ajoute un <strong>antimousse</strong>. C’est une substance très hydrophobe (HLB de 1 à 3), <strong>insoluble</strong> dans le milieu : huile de silicone, silice hydrophobe. Ajoutez-en (en % de la formule) jusqu’à ce que le <strong>plateau de Bikerman</strong> passe sous {M.H_PLATEAU_MAX} cm.</>,
      tache: { type: 'action', ok: M.plateauB(vie) <= M.H_PLATEAU_MAX, consigne: `Ajouter de l’antimousse pour que le plateau passe sous ${M.H_PLATEAU_MAX} cm` } },
    { id: 'antimousse-q', titre: 'Comment agit un antimousse ?', focus: ['scene'],
      texte: <>Sur le schéma, la goutte d’antimousse est au contact de la lamelle. On distingue les <strong>antimousses</strong> (qui préviennent la formation de mousse) des <strong>démoussants</strong> (qui la détruisent une fois formée). Dans une peinture, on utilise par exemple un copolymère polyéther-siloxane avec de la silice.</>,
      tache: { type: 'qcm', q: 'Quel est le mode d’action principal d’un antimousse ?', ...QCM.antimousse,
        expl: 'Un antimousse est insoluble et très hydrophobe : il pénètre dans la lamelle et désorganise les structures de tensioactif qui la stabilisent, ce qui la fait rompre. Il ne dissout pas le gaz et ne charge pas les bulles.', indice: 'Que fait une substance très hydrophobe et insoluble quand elle atteint la couche de tensioactif de la lamelle ?' } },
    { id: 'bilan', titre: 'Le bilan : former, stabiliser, détruire', focus: [],
      retenirTitre: 'À retenir : la démarche', retenir: <>
        <SvgCarteBilanMousse/>
        <ul style={puces}>
          <li>Former : tensioactif à <strong>5 à 10 fois la CMC</strong> ; mesure par Ross-Miles ou Bikerman.</li>
          <li>Stabiliser : couche <strong>cohésive</strong> (éthoxylation, dodécanol), viscosité, eau douce, gaz peu soluble.</li>
          <li>Détruire : <strong>antimousse</strong> très hydrophobe et insoluble, qui pénètre la lamelle.</li>
        </ul></>,
      texte: <>Vous savez expliquer le rôle d’un tensioactif dans une mousse, distinguer moussabilité et stabilité, lire une mesure de Ross-Miles ou de Bikerman, choisir des additifs supermoussants et expliquer l’action d’un antimousse. En exploration, vous pouvez changer toutes les conditions.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(s => {
      const id = IDS[ni];
      if (id === 'cmc-action') return { ...BASE, c: 0.2, tps: 0 };
      if (id === 'ross-miles') return { ...BASE, tps: 0 };
      if (id === 'bikerman' || id === 'ethoxy') return { ...BASE, tps: 0 };
      if (id === 'supermoussant' || id === 'facteurs' || id === 'antimousse-action') return { ...BASE, tps: 0 };
      if (id === 'antimousse-q') return { ...s, d: Math.max(s.d, 0.1) };
      return s;
    });
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE;
  const eVie = { t: vie.t, c: vie.c, r: vie.r, v: vie.v, ca: vie.ca, g: vie.g, d: vie.d };
  const sceneGuide = !enGuide ? null
    : sc === 'lamelle' ? <SvgLamelle type="sds"/>
    : ['cmc-action', 'cmc-q'].includes(sc) ? <SvgMousse h={M.H0(eVie)} legende={`SDS à ${fr(vie.c, 1)} fois la CMC : hauteur initiale (Ross-Miles)`}/>
    : sc === 'moussa-stab' ? <SvgCourbeMousse mode="rm" p={{ H0: 18, td: 0.2, th: 0.5 }} tMax={6}/>
    : sc === 'ross-miles' ? <SvgMousse h={M.hauteurRM(eVie, vie.tps)} t={vie.tps} legende="SDS à 5 CMC, mousse de Ross-Miles"/>
    : sc === 'bikerman' ? <SvgCourbeMousse mode="bik" e={eVie}/>
    : sc === 'ethoxy' ? <><SvgFormulesTensio/><div style={{ marginTop: 8 }}><SvgComparaisonLamelles/></div></>
    : sc === 'supermoussant' ? <SvgLamelle type="sds" r={vie.r}/>
    : sc === 'facteurs' ? <SvgCourbeMousse mode="rm" e={eVie}/>
    : ['antimousse-action', 'antimousse-q'].includes(sc) ? <SvgAntimousse d={vie.d}/>
    : null;
  const MES_GUIDE = {
    'masse-num': [['Concentration visée', `${DOS.k} × CMC`], ['CMC du SDS', `${fr(M.CMC_SDS, 1)} mmol/L`], ['Masse molaire du SDS', `${fr(M.M_SDS, 1)} g/mol`], ['Volume de solution', `${DOS.V} mL`]],
    'ross-miles': TEMPS_RM.map((t, i) => [`t = ${t} min`, `${fr(HRM[i], 1)} cm`]),
    'ethoxy': [['Demi-vie du SDS (5 CMC)', `${fr(M.demiVie({ ...BASE, t: 'sds' }), 1)} min`], ['Demi-vie du laureth sulfate (5 CMC)', `${fr(M.demiVie({ ...BASE, t: 'sles' }), 1)} min`]],
    'supermoussant': [['Demi-vie de la mousse', `${fr(M.demiVie(eVie), 1)} min`]],
    'facteurs': [['Hauteur initiale', `${fr(M.H0(eVie), 1)} cm`], ['Demi-vie de la mousse', `${fr(M.demiVie(eVie), 1)} min`]],
    'antimousse-action': [['Plateau de Bikerman', `${fr(M.plateauB(eVie), 1)} cm`], ['Demi-vie de la mousse', `${fr(M.demiVie(eVie), 1)} min`]],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const setV = k => ev => setVie(s => ({ ...s, [k]: parseFloat(ev.target.value) }));
  const curs = (id, lab, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const curseurGuide = enGuide && ['cmc-action', 'ross-miles', 'supermoussant', 'facteurs', 'antimousse-action'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {sc === 'cmc-action' && curs('mo-c', `Concentration en SDS : ${fr(vie.c, 1)} × CMC (${fr(vie.c * M.CMC_SDS, 1)} mmol/L)`, vie.c, 0.1, 10, 0.1, setV('c'), 'Hauteur initiale de mousse mesurée par Ross-Miles.')}
      {sc === 'ross-miles' && curs('mo-t', `Temps écoulé : ${fr(vie.tps, 1)} min`, vie.tps, 0, 30, 0.5, setV('tps'), 'La hauteur de mousse diminue avec le temps.')}
      {sc === 'supermoussant' && curs('mo-r', `Dodécanol ajouté : ${fr(vie.r * 100, 0)} % du SDS`, vie.r, 0, 0.2, 0.01, setV('r'), '0 % : SDS seul. Le dodécanol s’intercale entre les molécules.')}
      {sc === 'facteurs' && <>
        {curs('mo-ca', `Ions Ca²⁺ : ${fr(vie.ca, 1)} mmol/L`, vie.ca, 0, 5, 0.5, setV('ca'), '0 : eau douce.')}
        {curs('mo-v', `Viscosité ajoutée : ${fr(vie.v, 1)}`, vie.v, 0, 1, 0.1, setV('v'), '0 : eau ; 1 : milieu épaissi par un polymère.')}
        <label htmlFor="mo-g" style={{ ...libelle, marginTop: 8 }}>Gaz de la mousse</label>
        <select id="mo-g" value={vie.g} onChange={ev => setVie(s => ({ ...s, g: ev.target.value }))} style={selectStyle}>{M.GAZ.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}</select></>}
      {sc === 'antimousse-action' && curs('mo-d', `Antimousse : ${fr(vie.d, 2)} % de la formule`, vie.d, 0, 0.5, 0.01, setV('d'), '0 : aucun antimousse.')}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'masse' ? { kind, ...M.tirageMasse(), rep: '', verifie: false } : { kind, ...M.tirageDiagnostic(), v: '', rem: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'masse') { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.abs(a - defi.vrai) <= 0.05 * defi.vrai; noterD(ok); }
    else { ok = defi.v === defi.cas && defi.rem === defi.cas; noterG(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const champ = (id, lab, val, set, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0', fontSize: 14 }}><label htmlFor={id}>{lab}</label>
      <input id={id} value={val} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('mo-verif')?.click()} onChange={ev => set(ev.target.value)} style={{ width: 100, padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/><span>{unite}</span></div>);
  const conditions = d => [
    ['Tensioactif', M.tensio(d.etat.t).nom], ['Concentration', `${fr(d.etat.c, 1)} × CMC`],
    ['Additif supermoussant', d.etat.r > 0 ? `dodécanol (${fr(d.etat.r * 100, 0)} % du tensioactif)` : 'aucun'], ['Eau', d.etat.ca > 0 ? `dure : ${fr(d.etat.ca, 1)} mmol/L de Ca²⁺` : 'douce'],
  ];
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['masse', 'Peser le tensioactif'], ['diagnostic', 'Diagnostiquer']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'masse' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : masse de SDS à peser</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>On prépare <strong>{defi.V} mL</strong> de solution de SDS à <strong>{defi.k} fois la CMC</strong> (CMC = {fr(M.CMC_SDS, 1)} mmol/L ; M = {fr(M.M_SDS, 1)} g/mol). Quelle masse de SDS faut-il peser ? Donnez le résultat avec 3 chiffres significatifs.</div>
        {champ('mo-r', 'Masse de SDS :', defi.rep, v => setDefi(d => ({ ...d, rep: v, verifie: false })), 'g')}
        <IndiceDefi cache={false}>n = c × V avec c en mol/L (1 mmol/L = 10⁻³ mol/L) et V en L ; puis m = n × M. Tolérance : 5 %.</IndiceDefi>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : diagnostiquer un liquide vaisselle</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Voici les conditions de la formulation, puis les mesures de Ross-Miles. Spécification : hauteur initiale ≥ {M.H_SPEC} cm et demi-vie ≥ {M.TH_SPEC} min.</div>
        <ul style={liste}>{conditions(defi).map(([a, b]) => <li key={a}>{a} : {b}</li>)}</ul>
        <div style={{ margin: '8px 0 4px' }}><SvgCourbeMousse mode="rm" e={defi.etat}/></div>
        <ul style={liste}><li>Hauteur initiale : {fr(defi.h0, 1)} cm</li><li>Demi-vie de la mousse : {fr(defi.th, 1)} min</li></ul>
        <label htmlFor="mo-v" style={{ ...libelle, marginTop: 8 }}>Ce qui ne va pas</label>
        <select id="mo-v" value={defi.v} onChange={ev => setDefi(d => ({ ...d, v: ev.target.value, verifie: false }))} style={{ ...selectStyle, marginBottom: 8 }}>
          <option value="">Choisir…</option>{M.CAS.map(k => <option key={k} value={k}>{M.CAUSES[k]}</option>)}</select>
        <label htmlFor="mo-rem" style={libelle}>Correction à apporter</label>
        <select id="mo-rem" value={defi.rem} onChange={ev => setDefi(d => ({ ...d, rem: ev.target.value, verifie: false }))} style={selectStyle}>
          <option value="">Choisir…</option>{M.CAS.map(k => <option key={k} value={k}>{M.REMEDES[k]}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Comparez chaque mesure à sa spécification. Une hauteur initiale trop faible renvoie à la formation de la mousse (concentration, eau) ; une hauteur correcte mais une demi-vie trop courte renvoie à la cohésion de la couche.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="mo-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'masse' && <>n = {defi.k} × {fr(M.CMC_SDS, 1)}·10⁻³ × {fr(defi.V / 1000, 3)} ; m = n × {fr(M.M_SDS, 1)} = {fr(defi.vrai, 2)} g.</>}
        {defi.kind === 'diagnostic' && <>{M.CAUSES[defi.cas]} : {M.REMEDES[defi.cas]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const majEx = f => setEx(x => ({ ...x, ...f }));
  const eEx = { t: ex.t, c: ex.c, r: ex.r, v: ex.v, ca: ex.ca, g: ex.g, d: ex.d };
  const h0Ex = M.H0(eEx), thEx = M.demiVie(eEx), plEx = M.plateauB(eEx), confEx = h0Ex >= M.H_SPEC && thEx >= M.TH_SPEC;
  const cursEx = (id, lab, val, min, max, step, k, aide) => curs(id, lab, val, min, max, step, ev => majEx({ [k]: parseFloat(ev.target.value) }), aide);
  const TX = M.tensio(ex.t);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="mo-ten" style={libelle}>Tensioactif</label>
      <select id="mo-ten" value={ex.t} onChange={ev => majEx({ t: ev.target.value })} style={selectStyle}>{M.TENSIOACTIFS.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}</select>
      <Section titre={`Concentration : ${fr(ex.c, 1)} × CMC`} ouvert={!!ouv.conc} onBascule={() => bascule('conc')}>
        {cursEx('mo-xc', `Concentration : ${fr(ex.c, 1)} × CMC (${fr(ex.c * TX.cmc, 1)} mmol/L)`, ex.c, 0.1, 10, 0.1, 'c', 'Sous la CMC, la mousse est faible et peu stable ; vers 5 à 10 CMC, elle sature.')}
      </Section>
      <Section titre={`Additifs : dodécanol ${fr(ex.r * 100, 0)} %, viscosité ${fr(ex.v, 1)}, antimousse ${fr(ex.d, 2)} %`} ouvert={!!ouv.add} onBascule={() => bascule('add')}>
        {cursEx('mo-xr', `Dodécanol : ${fr(ex.r * 100, 0)} % du tensioactif`, ex.r, 0, 0.2, 0.01, 'r', 'Supermoussant : il comble les espaces entre les molécules et stabilise la mousse.')}
        {cursEx('mo-xv', `Viscosité ajoutée : ${fr(ex.v, 1)}`, ex.v, 0, 1, 0.1, 'v', 'Un milieu plus visqueux draine moins vite : la mousse dure plus longtemps.')}
        {cursEx('mo-xd', `Antimousse : ${fr(ex.d, 2)} % de la formule`, ex.d, 0, 0.5, 0.01, 'd', 'Très hydrophobe et insoluble : il fait rompre les lamelles.')}
      </Section>
      <Section titre={`Conditions : Ca²⁺ ${fr(ex.ca, 1)} mmol/L, gaz ${M.gaz(ex.g).nom.split(' ')[0]}`} ouvert={!!ouv.cond} onBascule={() => bascule('cond')}>
        {cursEx('mo-xca', `Ions Ca²⁺ : ${fr(ex.ca, 1)} mmol/L`, ex.ca, 0, 5, 0.5, 'ca', 'Eau dure : les ions interagissent avec le tensioactif anionique (le laureth sulfate y est moins sensible).')}
        <label htmlFor="mo-xg" style={{ ...libelle, marginTop: 8 }}>Gaz de la mousse</label>
        <select id="mo-xg" value={ex.g} onChange={ev => majEx({ g: ev.target.value })} style={selectStyle}>{M.GAZ.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}</select>
      </Section>
    </div>);
  const scenes = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Hauteur de mousse au cours du temps</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {[['rm', 'Ross-Miles'], ['bik', 'Bikerman']].map(([k, l]) => <button key={k} onClick={() => majEx({ courbe: k })} aria-pressed={ex.courbe === k} style={stylePetitBouton(ex.courbe === k, '#7c3aed')}>{l}</button>)}
      </div>
      <SvgCourbeMousse mode={ex.courbe} e={eEx} tNow={ex.courbe === 'rm' ? ex.tps : null}/>
      {ex.courbe === 'rm' && <>
        <div style={{ height: 6 }}/>
        <SvgMousse h={M.hauteurRM(eEx, ex.tps)} t={ex.tps} legende="mousse de Ross-Miles"/>
        {cursEx('mo-xt', `Temps écoulé : ${fr(ex.tps, 1)} min`, ex.tps, 0, 30, 0.5, 'tps', 'Fait vieillir la mousse : repérez la demi-vie.')}</>}
      {ex.courbe === 'bik' && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Débit de gaz constant jusqu’à 10 min, puis arrêt du gaz.</div>}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Hauteur initiale (moussabilité)" valeur={`${fr(h0Ex, 1)} cm`} couleur={COL.violet}/>
      <LigneMesure nom="Demi-vie de la mousse (stabilité)" valeur={`${fr(thEx, 1)} min`} couleur={COL.violet}/>
      <LigneMesure nom="Plateau de Bikerman" valeur={`${fr(plEx, 1)} cm`}/>
      <LigneMesure nom={`Conformité (hauteur ≥ ${M.H_SPEC} cm, demi-vie ≥ ${M.TH_SPEC} min)`} valeur={confEx ? 'conforme' : 'non conforme'} couleur={confEx ? COL.vert : COL.rouge}/>
    </div>);
  const sectionLamelle = enExplore && (
    <Section titre="La lamelle de liquide, à l’échelle moléculaire" ouvert={!!ouv.lam} onBascule={() => bascule('lam')}>
      <><SvgLamelle type={ex.t} r={ex.r}/>{ex.d > 0.03 && <div style={{ marginTop: 10 }}><SvgAntimousse d={ex.d}/></div>}</>
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>SDS : faites varier la concentration de 0,1 à 10 CMC. À partir de quelle valeur la hauteur de mousse cesse-t-elle d’augmenter nettement ?</li>
      <li>Passez du SDS au laureth sulfate à 5 CMC : que gagnez-vous, la hauteur ou la demi-vie ?</li>
      <li>SDS, eau à 3 mmol/L de Ca²⁺ : la mousse est-elle conforme ? Comment la corriger avec les autres réglages ?</li>
      <li>Remplacez l’air par du dioxyde de carbone, puis par du diazote : comparez les demi-vies.</li>
      <li>Ajoutez de l’antimousse et regardez le plateau de Bikerman : quelle dose suffit pour passer sous 3 cm ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Une mousse : des bulles séparées par des lamelles d’eau stabilisées par des tensioactifs adsorbés sur leurs deux faces</li>
        <li>Moussabilité (hauteur formée) et stabilité (durée de vie) sont deux qualités différentes ; Ross-Miles et Bikerman les mesurent</li>
        <li>Former : tensioactif à 5 à 10 fois la CMC, pour que des micelles renouvellent les interfaces</li>
        <li>Stabiliser : couche cohésive (éthoxylation, supermoussant), viscosité, eau douce, gaz peu soluble</li>
        <li>Détruire : antimousse très hydrophobe (HLB de 1 à 3), insoluble, qui pénètre la lamelle et désorganise la couche de tensioactif</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle qualitatif</strong> : la hauteur initiale et la demi-vie sont des produits de facteurs simples (concentration, eau dure, additifs, gaz). Les courbes ont une forme simplifiée : hauteur constante un court instant puis décroissance exponentielle (Ross-Miles) ; montée exponentielle vers un plateau (Bikerman). Les effets sont réglés pour reproduire les tendances et les ordres de grandeur publiés (voir ci-dessous) ; les autres valeurs sont indicatives.</li>
      <li><strong>CMC</strong> : 8,2 mmol/L pour le SDS dans l’eau pure à 25 °C (valeur usuelle de la littérature). Pour un laureth sulfate de sodium, les valeurs publiées vont d’environ 1,5 à 4 mmol/L selon le nombre de groupes éthoxy, la pureté, la méthode et la présence de sels (par exemple 1,5 mmol/L pour un laureth-2 sulfate, 4,3 mmol/L pour un SLES commercial) : la simulation prend 3 mmol/L. La concentration est donnée en multiples de la CMC, donc ce choix change peu les résultats.</li>
      <li><strong>Origine des valeurs de mousse</strong> : le SDS à 5 CMC a ici une demi-vie de 25 min en eau douce. C’est calé sur des essais publiés en eau du robinet (0,2 % de matière active), où la mousse garde 70 à 90 % de sa hauteur ou de son volume après 5 min (soit des demi-vies de 10 à 30 min environ). Dans ces mêmes essais, le laureth sulfate donne une hauteur initiale d’environ 5 % supérieure à celle du SDS et une rétention un peu meilleure : la simulation prend 19 cm contre 18 cm, et une demi-vie 1,3 fois plus longue en eau douce. Un écart de stabilité plus net n’apparaît que dans des conditions plus sévères (eau dure, salissures). Les résultats dépendent du protocole : seul le sens des effets est à retenir (sources : J. Soc. Cosmet. Chem., vol. 25, n° 11, et vol. 48, n° 5).</li>
      <li><strong>Plateau de Bikerman</strong> : aucune mesure publiée n’a été trouvée pour ces deux tensioactifs. Le plateau est supposé proportionnel à la hauteur initiale et à la demi-vie de la mousse (hypothèse du modèle), et la durée de vie dynamique est prise 8 fois plus courte que la demi-vie statique pour que la courbe se lise bien : les valeurs sont illustratives.</li>
      <li><strong>Eau dure et additifs</strong> : seul Ca²⁺ est modélisé. Qu’un excès de calcium fasse chuter la moussabilité et la stabilité du SDS (précipitation du dodécylsulfate de calcium) est établi ; en revanche, l’avantage du laureth sulfate en eau dure est ici une hypothèse du modèle, d’ampleur non mesurée (le laureth sulfate reste sensible au calcium). Le dodécanol double la demi-vie à 10 % du SDS ; une quantité trop importante d’additif insoluble n’est pas décrite.</li>
      <li><strong>Antimousse</strong> : la dose efficace dépend du produit et de la formulation (par exemple, pour une émulsion de polyéther-siloxane avec silice, de l’ordre de 0,1 à 1 % de la formulation d’après une fiche technique). Selon le produit, l’antimousse s’ajoute dès l’empâtage ou à la dilution. Un antimousse peut aussi laisser des défauts dans un film (cratères) : non modélisé.</li>
      <li><strong>Hors modèle</strong> : le drainage et le mûrissement des bulles, la taille des bulles, la température, le pH, les protéines et polymères tensioactifs, la rhéologie de la mousse.</li>
      <li><strong>Spécifications</strong> : hauteur initiale ≥ 12 cm, demi-vie ≥ 30 min et plateau ≤ 3 cm sont des seuils illustratifs, pas des normes.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{['masse-num', 'ross-miles', 'ethoxy'].includes(sc) ? 'Données' : 'Mesures'}</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mo-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mo-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mo-col { display: flex; flex-direction: column; gap: 12px; }
        .mo-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .mo-l1.cote .mo-carte { order: 2; } .mo-l1.cote .mo-main { order: 1; }
          .mo-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .mo-ex > * { grid-column: 1; }
          .mo-ex > .mo-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .mo-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mo-in { animation: mo-fondu 0.35s ease-out; } @keyframes mo-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .mo-l1 *, .mo-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mousses : former, stabiliser, détruire</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Dans un liquide vaisselle, un <strong>tensioactif</strong> permet de <strong>former</strong> une mousse ; des additifs la <strong>stabilisent</strong> ; un <strong>antimousse</strong> la <strong>détruit</strong> quand elle gêne. On la caractérise par sa hauteur et sa durée de vie.</div>
      {enGuide && <div className="mo-l1 cote">
        <div className="mo-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="mo-main">
          <div className="mo-col">
            {sceneBloc && <div className="mo-in">{sceneBloc}</div>}
            {curseurGuide && <div className="mo-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="mo-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'masse' ? suiviD : suiviG}/></div>}
      {enExplore && <>
        <div className="mo-ex">
          {scenes}
          <div className="mo-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        {sectionLamelle}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
