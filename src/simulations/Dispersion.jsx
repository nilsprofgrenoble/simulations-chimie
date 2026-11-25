import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./dispersionModele";
import { QCM } from "./dispersionQcm";
import { SvgMouillage, SvgDistribution, SvgMecanismes, SvgEtalement, SvgCarteEtapes, SvgCarteChoix, SvgCarteBilanDisp } from "./DispersionSchemas";

const SIM_ID = 225, CLE_GUIDE = 'dispersion-guide-v1';
declarerDefis(SIM_ID, [['dosage', 'Calculer l’eau à peser quand le dispersant est liquide'], ['diagnostic', 'Diagnostiquer une suspension mal dispersée']]);

// ====================================================
//  SIM 225 — MOUILLER, DISPERSER, STABILISER UNE SUSPENSION (BTS MDC, Formulation › Tensioactifs et émulsions)
//  Capacités visées (jamais affichées à l'élève) : expliquer le choix d'un agent mouillant ou d'un agent dispersant selon son mode d'action et les matières premières utilisées ;
//  mettre en œuvre un contrôle d'homogénéité d'une suspension par une mesure granulométrique.
//  Modèle QUALITATIF : dispersionModele.js. Schémas : DispersionSchemas.jsx. Fait suite à la simulation 224 (charge de surface, pH, sel).
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const pc = v => `${fr(v * 100, 1)} %`;
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const BLANC = M.solide('blanc'), BRUT = { m: 1, E: 0, x: 0, g: 0 };
const QBRUT = M.distribution(BLANC, BRUT);
const CLAS = M.parClasses(QBRUT).map(v => Math.round(v * 10) / 10);       // valeurs AFFICHÉES au dixième : elles servent au corrigé
const AU_DESSUS = CLAS[4] + CLAS[5] + CLAS[6];
const nomClasse = ([a, b]) => `${a} à ${b} µm`;
const DOS = { mC: 200, pc: 1.5, ES: 40, EC: 0.35 };
const XOPT = M.dosageOptimal();

export function SimulationDispersion() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState({ m: 0, E: 0, x: 0, g: 0, dose: 0 });                                  // scène du parcours (ciment blanc)
  const [ex, setEx] = useState({ solide: 'blanc', m: 0.3, E: 0.5, x: 0, g: 0, dose: 1 });               // exploration
  const [ouv, setOuv] = useState({});
  const [suiviD, noterD] = useCompteurDefi(), [suiviG, noterG] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('dosage');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const qVie = M.distribution(BLANC, vie), agVie = M.fractionAuDessus(qVie);

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'mouillage', titre: 'Pourquoi une poudre fait-elle des grumeaux ?', focus: ['scene'],
      texte: <>Pour fabriquer une <strong>suspension</strong> (ici du ciment dans l’eau), on verse la poudre dans le liquide. Elle ne se disperse pas toute seule : elle forme des <strong>amas</strong> qui flottent ou coulent par paquets. Observez l’amas de grains dans l’eau.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’amas de poudre reste-t-il compact et résiste-t-il à l’eau ?', ...QCM.mouillage,
        expl: 'Entre les grains d’un amas, il y a de l’air. Tant que l’air reste emprisonné, le liquide ne peut pas pénétrer entre les grains : l’amas se comporte comme une seule grosse particule.', indice: 'Regardez les bulles blanches dans l’amas.' } },
    { id: 'mouillant-action', titre: 'Mouiller : remplacer l’air par le liquide', focus: ['scene', 'curseur'],
      texte: <>Le <strong>mouillage</strong> consiste à remplacer l’interface solide-air par une interface solide-liquide. On y aide avec un <strong>agent mouillant</strong>, un tensioactif qui abaisse la tension superficielle du liquide. Ajoutez de l’agent mouillant avec le curseur jusqu’à ce que le liquide ait pris la place de l’air.</>,
      tache: { type: 'action', ok: vie.m >= 0.8, consigne: 'Ajouter assez d’agent mouillant pour que le liquide pénètre l’amas' } },
    { id: 'mouillant-q', titre: 'Le rôle de l’agent mouillant', focus: ['scene'],
      texte: <>Le liquide a maintenant pénétré l’amas. Un agent mouillant est un tensioactif : sa partie lipophile s’adsorbe sur le solide et sa partie hydrophile reste dans l’eau.</>,
      tache: { type: 'qcm', q: 'Quelle propriété du liquide l’agent mouillant modifie-t-il ?', ...QCM.mouillant,
        expl: 'En abaissant la tension superficielle de l’eau, l’agent mouillant permet au liquide de s’étaler sur le solide et de pénétrer entre les grains, ce qui chasse l’air. Il ne dissout pas le solide et ne sert pas à repousser les grains (c’est le rôle du dispersant).', indice: 'Pensez à ce qu’un tensioactif fait à l’interface eau-air.' } },
    { id: 'dispersion', titre: 'Disperser : casser les agglomérats', focus: ['scene', 'curseur'],
      texte: <>Après le mouillage, un <strong>disperseur</strong> (pale tournante à grande vitesse) fournit de l’énergie mécanique. La courbe grise en tirets montre la poudre avant dispersion ; la courbe violette montre la poudre après. Montez l’énergie avec le curseur et regardez la courbe : la distribution donne la fraction massique en fonction du diamètre.</>,
      tache: { type: 'qcm', q: 'Que fait la dispersion mécanique ?', ...QCM.dispersion,
        expl: 'La dispersion casse les agglomérats (amas de particules) pour obtenir des particules isolées, appelées particules primaires. Elle ne dissout pas le solide et ne change pas la taille des particules primaires elles-mêmes.', indice: 'Regardez l’effet de l’énergie sur les gros diamètres (au-delà de 50 µm).' } },
    { id: 'broyage', titre: 'Broyer : réduire la taille des particules', focus: ['scene', 'curseur'],
      texte: <>Après dispersion, la courbe garde son pic principal vers 15 µm : ce sont les <strong>particules primaires</strong>. Poussez maintenant le curseur « broyage » : le pic se déplace vers les petits diamètres.</>,
      tache: { type: 'qcm', q: 'Pour réduire la taille des particules primaires, quelle opération faut-il ?', ...QCM.broyage,
        expl: 'Un disperseur ne casse que les agglomérats. Réduire la taille des particules elles-mêmes demande un broyage (billes, broyeur) : c’est une opération mécanique plus énergétique, distincte de la dispersion.', indice: 'Quelle opération a déplacé le pic principal et pas seulement la queue de la courbe ?' } },
    { id: 'lecture-num', titre: 'Lire une distribution granulométrique', focus: ['mesures'],
      retenirTitre: 'À retenir : mouiller, disperser, stabiliser', retenir: <>
        <SvgCarteEtapes/>
        <ul style={puces}>
          <li><strong>Mouiller</strong> : le liquide remplace l’air entre les grains (agent mouillant).</li>
          <li><strong>Disperser</strong> : de l’énergie mécanique casse les agglomérats en particules primaires.</li>
          <li><strong>Stabiliser</strong> : un dispersant empêche les particules de se recoller.</li>
        </ul></>,
      texte: <>Un granulomètre laser mesure la poudre <strong>avant dispersion</strong> : le tableau donne la fraction massique de chaque classe de taille. Les agglomérats se trouvent au-delà de <strong>50 µm</strong>. Additionnez les classes de plus de 50 µm.</>,
      tache: { type: 'num', q: 'Part de la masse au-dessus de 50 µm', unite: '%', vrai: AU_DESSUS, tol: 0.03, affiche: v => fr(v, 1), cs: 2,
        calcul: () => [`Classes de plus de 50 µm : 50 à 100 µm, 100 à 200 µm, 200 à 400 µm.`, `${fr(CLAS[4], 1)} + ${fr(CLAS[5], 1)} + ${fr(CLAS[6], 1)} = ${fr(AU_DESSUS, 1)} %.`, 'Cette part est la fraction de masse dans des agglomérats (ou de très grosses particules).'],
        pieges: [[CLAS[4], 'Vous n’avez pris que la classe 50 à 100 µm : il faut additionner toutes les classes de plus de 50 µm.'], [100 - AU_DESSUS, 'C’est la part en dessous de 50 µm : on demande la part au-dessus.']],
        expl: `On additionne les classes de plus de 50 µm : ${fr(CLAS[4], 1)} + ${fr(CLAS[5], 1)} + ${fr(CLAS[6], 1)} ≈ ${fr(AU_DESSUS, 1)} %.`, indice: 'Sommez les trois dernières classes du tableau (50 à 100, 100 à 200 et 200 à 400 µm).' } },
    { id: 'pic', titre: 'Un deuxième pic : le signe d’agglomérats', focus: ['scene', 'mesures'],
      texte: <>La courbe de la poudre brute a <strong>deux pics</strong> : un pic principal vers 15 µm et un second, plus étalé, entre 100 et 200 µm. Le granulomètre permet donc de contrôler l’<strong>homogénéité</strong> de la suspension.</>,
      tache: { type: 'qcm', q: 'Que représente le second pic, entre 100 et 200 µm ?', ...QCM.pic,
        expl: 'Le second pic est celui des agglomérats : des amas de particules primaires qui n’ont pas été cassés. Une suspension bien dispersée n’a presque plus de masse au-delà de 50 µm : un contrôle granulométrique le vérifie.', indice: 'Ce pic est celui des gros diamètres : que contiennent les gros diamètres dans une poudre mal dispersée ?' } },
    { id: 'refloc', titre: 'Les amas se reforment sans dispersant', focus: ['scene', 'curseur'],
      texte: <>La poudre a été mouillée et dispersée avec une énergie élevée, puis broyée : pourtant, il reste des agglomérats, car <strong>sans dispersant</strong> les particules se recollent. Ajoutez du dispersant avec le curseur jusqu’à ce que la part de masse au-delà de 50 µm passe sous <strong>12 %</strong>.</>,
      tache: { type: 'action', ok: agVie <= M.AGGLO_MAX, consigne: 'Ajouter du dispersant pour descendre sous 12 % de masse au-delà de 50 µm' } },
    { id: 'choix', titre: 'Choisir un dispersant selon le milieu', focus: ['scene'],
      texte: <>Les <strong>dispersants</strong> créent des forces de répulsion entre les particules, de deux sortes : <strong>électrostatique</strong> (on charge les grains, comme à la simulation précédente) ou <strong>stérique</strong> (des chaînes de polymère greffées sur les grains les tiennent à distance). Le choix dépend du milieu et du solide. Une peinture à l’eau contient du dioxyde de titane (pigment) dans l’eau.</>,
      tache: { type: 'qcm', q: 'Quel dispersant convient à du TiO₂ dispersé dans l’eau (milieu peu salin) ?', ...QCM.choix,
        expl: 'En milieu aqueux peu salin, on renforce la charge de surface des grains avec un polyélectrolyte anionique comme le polyacrylate de sodium : la répulsion est électrostatique. Un polymère soluble dans l’huile est adapté à un milieu organique, et le sel écranterait les charges.', indice: 'En milieu aqueux, la répulsion visée est électrique : il faut ajouter des charges.' } },
    { id: 'pce', titre: 'Le cas du ciment : un milieu très ionique', focus: ['scene'],
      texte: <>L’eau d’une pâte de ciment contient beaucoup d’ions dissous (calcium, sulfates, alcalins) : comme on l’a vu avec le sel, ces ions <strong>écrantent</strong> les charges. Un dispersant purement électrostatique y est moins efficace. Les <strong>polycarboxylates</strong> (superplastifiants) portent des charges <em>et</em> de longues chaînes greffées : leur répulsion est <strong>électro-stérique</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi un polycarboxylate convient-il bien dans une pâte de ciment ?', ...QCM.pce,
        expl: 'Dans un milieu riche en ions, les charges sont écrantées et la répulsion électrostatique faiblit. Les chaînes greffées du polycarboxylate gardent les grains à distance par encombrement (stérique), même quand les ions écrantent les charges.', indice: 'Que fait le sel de la répulsion électrostatique ? Quelle répulsion ne dépend pas des ions ?' } },
    { id: 'dosage-num', titre: 'Doser un dispersant liquide', focus: ['mesures'],
      retenirTitre: 'À retenir : choisir un dispersant', retenir: <>
        <SvgCarteChoix/>
        <ul style={puces}>
          <li>Le <strong>milieu</strong> (eau ou solvant, ionique ou non) et le <strong>solide</strong> (oxyde, pigment organique…) guident le choix.</li>
          <li>Le dispersant s’<strong>adsorbe</strong> sur les grains : c’est son ancrage qui détermine son efficacité.</li>
        </ul></>,
      texte: <>On prépare une pâte avec <strong>{DOS.mC} g de ciment</strong> et un rapport eau/ciment <strong>E/C = {fr(DOS.EC, 2)}</strong>. Le dispersant, en solution aqueuse à <strong>{DOS.ES} %</strong> d’extrait sec, est introduit à <strong>{fr(DOS.pc, 1)} %</strong> de matière sèche sur la masse de ciment. Le rapport E/C doit rester constant : l’eau du dispersant liquide compte dans l’eau totale.</>,
      tache: { type: 'num', q: 'Masse d’eau à peser en plus du dispersant', unite: 'g', vrai: M.eauAPeser(DOS.mC, DOS.pc, DOS.ES, DOS.EC), tol: 0.03, affiche: v => fr(v, 1), cs: 3,
        calcul: () => [`Eau totale : ${fr(DOS.EC, 2)} × ${DOS.mC} g = ${fr(DOS.EC * DOS.mC, 1)} g.`, `Dispersant sec : ${fr(DOS.pc, 1)} % × ${DOS.mC} g = ${fr(M.masseSeche(DOS.mC, DOS.pc), 1)} g ; dispersant liquide : ${fr(M.masseSeche(DOS.mC, DOS.pc), 1)} ÷ ${fr(DOS.ES / 100, 2)} = ${fr(M.masseHumide(DOS.mC, DOS.pc, DOS.ES), 1)} g.`, `Eau apportée par le dispersant : ${fr(M.masseHumide(DOS.mC, DOS.pc, DOS.ES), 1)} − ${fr(M.masseSeche(DOS.mC, DOS.pc), 1)} = ${fr(M.eauApportee(DOS.mC, DOS.pc, DOS.ES), 1)} g.`, `Eau à peser : ${fr(DOS.EC * DOS.mC, 1)} − ${fr(M.eauApportee(DOS.mC, DOS.pc, DOS.ES), 1)} = ${fr(M.eauAPeser(DOS.mC, DOS.pc, DOS.ES, DOS.EC), 1)} g.`],
        pieges: [[DOS.EC * DOS.mC, 'Vous avez gardé toute l’eau : le dispersant liquide apporte déjà de l’eau, à décompter.'], [DOS.EC * DOS.mC - M.masseHumide(DOS.mC, DOS.pc, DOS.ES), 'Vous avez retiré toute la masse du dispersant liquide : seule l’eau qu’il contient est à décompter (le reste est du dispersant sec).'], [DOS.EC * DOS.mC - M.masseSeche(DOS.mC, DOS.pc), 'Vous avez retiré la masse de dispersant sec : c’est l’eau du dispersant liquide qu’il faut retirer.']],
        expl: `Eau totale ${fr(DOS.EC * DOS.mC, 1)} g, moins l’eau du dispersant liquide (${fr(M.eauApportee(DOS.mC, DOS.pc, DOS.ES), 1)} g) : ${fr(M.eauAPeser(DOS.mC, DOS.pc, DOS.ES, DOS.EC), 1)} g d’eau à peser.`, indice: 'dispersant liquide = dispersant sec ÷ extrait sec ; l’eau apportée est la différence entre dispersant liquide et dispersant sec.' } },
    { id: 'optimum-action', titre: 'Trouver le dosage optimal', focus: ['scene', 'curseur'],
      texte: <>On mesure l’<strong>étalement</strong> d’une pâte versée dans un cône : plus la pâte est fluide, plus elle s’étale. Réglez le dosage en dispersant sec (en % de la masse de ciment) pour obtenir l’étalement maximal.</>,
      tache: { type: 'action', ok: Math.abs(vie.dose - XOPT) <= 0.5, consigne: 'Placer le dosage à ± 0,5 % de l’optimum (étalement maximal)' } },
    { id: 'optimum-q', titre: 'Au-delà de l’optimum', focus: ['scene'],
      texte: <>Le dosage optimal se trouve là où l’étalement cesse de progresser. Placez le curseur au-delà de l’optimum et regardez la courbe : l’étalement n’augmente plus, voire recule un peu.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il quand on dépasse le dosage optimal ?', ...QCM.optimum,
        expl: 'Le dispersant s’adsorbe sur les grains jusqu’à les saturer. Ensuite, un excès reste dans l’eau : il n’améliore plus la dispersion, coûte cher et peut altérer d’autres propriétés (prise, bulles d’air). On cherche donc le dosage optimal, pas le plus fort.', indice: 'À quoi sert le dispersant ? Où va-t-il quand tous les grains sont recouverts ?' } },
    { id: 'bilan', titre: 'Le bilan : de la poudre à la suspension stable', focus: [],
      retenirTitre: 'À retenir : la démarche', retenir: <>
        <SvgCarteBilanDisp/>
        <ul style={puces}>
          <li>Trois temps : <strong>mouiller</strong>, <strong>disperser</strong>, <strong>stabiliser</strong> ; réduire la taille des grains, c’est <strong>broyer</strong>.</li>
          <li>Contrôle : la <strong>distribution granulométrique</strong> ne doit plus montrer d’agglomérats (au-delà de 50 µm).</li>
          <li>Moyen de s’en souvenir : <strong>« l’air part, les amas cassent, les grains se repoussent »</strong>.</li>
        </ul></>,
      texte: <>Vous savez enchaîner mouillage, dispersion et stabilisation, choisir un dispersant selon le milieu, doser un dispersant liquide à rapport E/C constant et lire une distribution granulométrique. En exploration, vous pouvez changer les conditions et comparer deux poudres.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const apres = id => etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(s => {
      const id = IDS[ni];
      if (id === 'mouillage' || id === 'mouillant-action') return { ...s, m: 0 };
      if (id === 'dispersion' || id === 'lecture-num') return { m: 1, E: 0, x: 0, g: 0, dose: 0 };
      if (id === 'refloc') return { m: 1, E: 0.9, x: 0, g: 0.7, dose: 0 };
      if (id === 'optimum-action') return { ...s, dose: 0 };
      return s;
    });
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE;
  const sceneMouill = ['mouillage', 'mouillant-action', 'mouillant-q'].includes(sc), sceneDist = ['dispersion', 'broyage', 'lecture-num', 'pic', 'refloc'].includes(sc);
  const brut = ['lecture-num', 'pic'].includes(sc);
  const sceneMeca = ['choix', 'pce'].includes(sc), sceneEtal = ['optimum-action', 'optimum-q'].includes(sc);
  const sceneGuide = enGuide ? (sceneMouill ? <SvgMouillage m={sc === 'mouillage' ? 0 : vie.m}/>
    : sceneDist ? <SvgDistribution q={brut ? QBRUT : qVie} qRef={brut ? null : QBRUT} nom="du ciment blanc"/>
    : sceneMeca ? <SvgMecanismes sel={sc === 'pce' ? 2 : null}/>
    : sceneEtal ? <SvgEtalement x={vie.dose} montreOpt={sc === 'optimum-q'}/> : null) : null;
  const MES_GUIDE = {
    'lecture-num': M.CLASSES.map((c, i) => [nomClasse(c), `${fr(CLAS[i], 1)} %`]),
    'dosage-num': [['Masse de ciment', `${DOS.mC} g`], ['Rapport E/C', fr(DOS.EC, 2)], ['Dispersant (matière sèche)', `${fr(DOS.pc, 1)} % du ciment`], ['Extrait sec du dispersant', `${DOS.ES} %`]],
  };
  const mesDist = enGuide && sceneDist && !brut ? [['D10 (10 % de la masse en dessous)', `${fr(M.diametre(qVie, 10), 1)} µm`], ['D50 (diamètre médian)', `${fr(M.diametre(qVie, 50), 1)} µm`], ['D90 (90 % de la masse en dessous)', `${fr(M.diametre(qVie, 90), 1)} µm`], ...(apres('pic') ? [['Part de masse au-delà de 50 µm', pc(agVie)]] : [])] : [];
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? mesDist) : [];
  const setV = k => ev => setVie(s => ({ ...s, [k]: parseFloat(ev.target.value) }));
  const curseurGuide = enGuide && (sceneMouill ? apres('mouillant-action') && sc !== 'mouillage' : sceneDist ? !brut : sceneEtal) ? (
    <div style={styleBoite}>
      {sceneMouill && <div style={cadre('curseur')}>
        <label htmlFor="di-m" style={libelle}>Agent mouillant ajouté : {fr(vie.m, 2)}</label>
        <input id="di-m" type="range" min="0" max="1" step="0.05" value={vie.m} onChange={setV('m')} aria-label="Agent mouillant ajouté" style={{ width: '100%', accentColor: '#7c3aed' }}/>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>0 : aucun agent mouillant ; 1 : mouillage complet.</div></div>}
      {sceneDist && <div style={cadre('curseur')}>
        <label htmlFor="di-e" style={libelle}>Énergie de dispersion : {fr(vie.E, 2)}</label>
        <input id="di-e" type="range" min="0" max="1" step="0.05" value={vie.E} onChange={setV('E')} aria-label="Énergie de dispersion" style={{ width: '100%', accentColor: '#7c3aed' }}/>
        {apres('broyage') && <><label htmlFor="di-g" style={{ ...libelle, marginTop: 8 }}>Broyage : {fr(vie.g, 2)}</label>
          <input id="di-g" type="range" min="0" max="1" step="0.05" value={vie.g} onChange={setV('g')} aria-label="Broyage" style={{ width: '100%', accentColor: '#7c3aed' }}/></>}
        {apres('refloc') && <><label htmlFor="di-x" style={{ ...libelle, marginTop: 8 }}>Dispersant sec : {fr(vie.x, 2)} % de la masse de poudre</label>
          <input id="di-x" type="range" min="0" max="3" step="0.1" value={vie.x} onChange={setV('x')} aria-label="Dispersant sec" style={{ width: '100%', accentColor: '#7c3aed' }}/></>}
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Le mouillage est supposé fait (agent mouillant présent).</div></div>}
      {sceneEtal && <div style={cadre('curseur')}>
        <label htmlFor="di-d" style={libelle}>Dispersant sec : {fr(vie.dose, 2)} % de la masse de ciment</label>
        <input id="di-d" type="range" min="0" max="5" step="0.1" value={vie.dose} onChange={setV('dose')} aria-label="Dosage en dispersant sec" style={{ width: '100%', accentColor: '#7c3aed' }}/>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Étalement mesuré : {fr(M.etalement(vie.dose), 1)} cm.</div></div>}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'dosage' ? { kind, ...M.tirageDosage(), rep: '', verifie: false } : { kind, ...M.tirageDiagnostic(), v: '', rem: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'dosage') { const a = lireNombre(defi.rep); ok = isFinite(a) && Math.abs(a - defi.vrai) <= Math.max(0.05 * defi.vrai, 0.1); noterD(ok); }
    else { ok = defi.v === defi.cas && defi.rem === defi.cas; noterG(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const champ = (id, lab, val, set, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '6px 0', fontSize: 14 }}><label htmlFor={id}>{lab}</label>
      <input id={id} value={val} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('di-verif')?.click()} onChange={ev => set(ev.target.value)} style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 15 }}/>{unite}</div>);
  const conditions = d => [
    ['Agent mouillant', d.etat.m > 0.5 ? 'présent' : 'aucun'], ['Disperseur', d.etat.E > 0.5 ? 'vitesse élevée, 10 min' : 'vitesse faible, 1 min'],
    ['Dispersant', d.etat.x > 0 ? `${fr(d.etat.x, 1)} % de matière sèche` : 'aucun'], ['Broyage', d.etat.g > 0.3 ? 'poudre broyée' : 'poudre non broyée'],
  ];
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['dosage', 'Doser le dispersant'], ['diagnostic', 'Diagnostiquer']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'dosage' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : eau à peser avec un dispersant liquide</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Une pâte contient <strong>{defi.mC} g de ciment</strong> avec E/C = <strong>{fr(defi.EC, 2)}</strong>. On ajoute un dispersant liquide d’extrait sec <strong>{defi.ES} %</strong>, à <strong>{fr(defi.pc, 1)} %</strong> de matière sèche sur la masse de ciment. Le rapport E/C doit rester constant. Quelle masse d’eau faut-il peser, en plus du dispersant ?</div>
        {champ('di-r', 'Eau à peser :', defi.rep, v => setDefi(d => ({ ...d, rep: v, verifie: false })), 'g')}
        <IndiceDefi cache={false}>Eau totale = E/C × m(ciment). Dispersant sec = % × m(ciment) ; dispersant liquide = dispersant sec ÷ extrait sec ; eau apportée = liquide − sec ; eau à peser = eau totale − eau apportée. Tolérance : 5 %.</IndiceDefi>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : diagnostiquer une suspension de {defi.solide.court}</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Voici les conditions de fabrication, puis la distribution mesurée. Spécification : D50 ≤ {M.D50_SPEC} µm et moins de {fr(M.AGGLO_MAX * 100, 0)} % de la masse au-delà de 50 µm.</div>
        <ul style={liste}>{conditions(defi).map(([a, b]) => <li key={a}>{a} : {b}</li>)}</ul>
        <div style={{ margin: '8px 0 4px' }}><SvgDistribution q={defi.q} nom={`du ${defi.solide.court}`}/></div>
        <ul style={liste}><li>D50 = {fr(defi.d50, 1)} µm ; D90 = {fr(defi.d90, 1)} µm</li><li>Part de masse au-delà de 50 µm : {pc(defi.agglo)}</li></ul>
        <label htmlFor="di-v" style={{ ...libelle, marginTop: 8 }}>Ce qui manque dans la fabrication</label>
        <select id="di-v" value={defi.v} onChange={ev => setDefi(d => ({ ...d, v: ev.target.value, verifie: false }))} style={{ ...selectStyle, marginBottom: 8 }}>
          <option value="">Choisir…</option>{M.CAS.map(k => <option key={k} value={k}>{M.CAUSES[k]}</option>)}</select>
        <label htmlFor="di-rem" style={libelle}>Correction à apporter</label>
        <select id="di-rem" value={defi.rem} onChange={ev => setDefi(d => ({ ...d, rem: ev.target.value, verifie: false }))} style={selectStyle}>
          <option value="">Choisir…</option>{M.CAS.map(k => <option key={k} value={k}>{M.REMEDES[k]}</option>)}</select>
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Cherchez ce que les conditions ne comportent pas. Des agglomérats (second pic vers 100 à 200 µm) signalent un mouillage, une énergie ou un dispersant insuffisants ; un D50 trop élevé sans agglomérats signale un broyage manquant.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="di-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'dosage' && <>Eau totale {fr(defi.total, 1)} g − eau du dispersant liquide ({fr(defi.humide, 1)} g liquide − {fr(defi.seche, 1)} g sec = {fr(defi.apportee, 1)} g) = {fr(defi.vrai, 1)} g.</>}
        {defi.kind === 'diagnostic' && <>{M.CAUSES[defi.cas]} : {M.REMEDES[defi.cas]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const SO = M.solide(ex.solide), qEx = M.distribution(SO, ex), qExBrut = M.distribution(SO, BRUT), agEx = M.fractionAuDessus(qEx);
  const majEx = f => setEx(x => ({ ...x, ...f }));
  const conforme = agEx <= M.AGGLO_MAX && M.diametre(qEx, 50) <= M.D50_SPEC;
  const curs = (id, lab, val, min, max, step, k, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={ev => majEx({ [k]: parseFloat(ev.target.value) })} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="di-sol" style={libelle}>Poudre à mettre en suspension dans l’eau</label>
      <select id="di-sol" value={ex.solide} onChange={ev => majEx({ solide: ev.target.value })} style={selectStyle}>{M.SOLIDES.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select>
      <Section titre={`Mouillage et dispersion : mouillant ${fr(ex.m, 2)}, énergie ${fr(ex.E, 2)}`} ouvert={!!ouv.md} onBascule={() => bascule('md')}>
        {curs('di-xm', `Agent mouillant : ${fr(ex.m, 2)}`, ex.m, 0, 1, 0.05, 'm', 'Sans mouillage, l’air reste piégé et l’énergie du disperseur est mal transmise.')}
        {curs('di-xe', `Énergie de dispersion : ${fr(ex.E, 2)}`, ex.E, 0, 1, 0.05, 'E', 'Un disperseur casse les agglomérats, pas les particules primaires.')}
      </Section>
      <Section titre={`Dispersant : ${fr(ex.x, 1)} % · broyage ${fr(ex.g, 2)}`} ouvert={!!ouv.ds} onBascule={() => bascule('ds')}>
        {curs('di-xx', `Dispersant sec : ${fr(ex.x, 1)} % de la masse de poudre`, ex.x, 0, 3, 0.1, 'x', 'Il empêche les agglomérats de se reformer.')}
        {curs('di-xg', `Broyage : ${fr(ex.g, 2)}`, ex.g, 0, 1, 0.05, 'g', 'Le broyage réduit la taille des particules primaires.')}
      </Section>
    </div>);
  const scenes = (
    <div style={styleBoite}>
      {enExplore && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mouillage et distribution de tailles</div>}
      <SvgMouillage m={ex.m}/>
      <div style={{ height: 8 }}/>
      <SvgDistribution q={qEx} qRef={qExBrut} nom={`du ${SO.court}`}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="D10 / D50 / D90" valeur={`${fr(M.diametre(qEx, 10), 1)} / ${fr(M.diametre(qEx, 50), 1)} / ${fr(M.diametre(qEx, 90), 1)} µm`} couleur={COL.violet}/>
      <LigneMesure nom="Étendue (D90 − D10) ÷ D50" valeur={fr(M.etendue(qEx), 1)}/>
      <LigneMesure nom="Part de masse au-delà de 50 µm" valeur={pc(agEx)} couleur={agEx <= M.AGGLO_MAX ? COL.vert : COL.rouge}/>
      <LigneMesure nom={`Conformité (D50 ≤ ${M.D50_SPEC} µm, agglomérats ≤ ${fr(M.AGGLO_MAX * 100, 0)} %)`} valeur={conforme ? 'conforme' : 'non conforme'} couleur={conforme ? COL.vert : COL.rouge}/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>La courbe grise en tirets est la poudre brute (sans mouillage ni dispersion).</div>
    </div>);
  const sectionDosage = enExplore && (
    <Section titre="Dosage du dispersant : étalement d’une pâte" ouvert={!!ouv.dos} onBascule={() => bascule('dos')}>
      <SvgEtalement x={ex.dose} montreOpt/>
      {curs('di-xd', `Dispersant sec : ${fr(ex.dose, 1)} % de la masse de ciment`, ex.dose, 0, 5, 0.1, 'dose', `Étalement : ${fr(M.etalement(ex.dose), 1)} cm. Au-delà de l’optimum, l’excès n’apporte plus rien.`)}
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>Ciment blanc : mettez le mouillage à 0 et l’énergie au maximum. Les agglomérats disparaissent-ils ?</li>
      <li>Mettez mouillage et énergie au maximum, sans dispersant : que reste-t-il au-delà de 50 µm ? Puis ajoutez 1 % de dispersant.</li>
      <li>Avec tout au maximum, comparez le D50 sans broyage et avec broyage complet.</li>
      <li>Passez au ciment Prompt : sa distribution brute est plus étalée. Est-il plus facile ou plus difficile à rendre conforme ?</li>
      <li>Dans le dosage, repérez l’optimum. Que pensez-vous d’un dosage deux fois plus grand ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Mouiller : l’agent mouillant (tensioactif) abaisse la tension superficielle et chasse l’air des amas</li>
        <li>Disperser : l’énergie mécanique casse les agglomérats ; broyer : réduire les particules primaires</li>
        <li>Stabiliser : un dispersant empêche le recollage (électrostatique, stérique ou électro-stérique)</li>
        <li>Contrôle : distribution granulométrique sans agglomérats (D90 bas, pas de second pic)</li>
        <li>Dosage optimal : au-delà de la saturation, l’excès de dispersant n’apporte plus rien</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle qualitatif</strong> : la poudre est un mélange de particules primaires et d’agglomérats (deux distributions log-normales). Les ordres de grandeur du ciment (D50 de 15 à 20 µm, agglomérats de 100 à 200 µm) s’inspirent de distributions mesurées au granulomètre laser ; les valeurs de la simulation sont indicatives.</li>
      <li><strong>Mouillage et énergie</strong> : sans agent mouillant, une partie seulement de l’énergie du disperseur atteint les agglomérats (hypothèse du modèle). Le disperseur ne casse que les agglomérats ; le broyage seul modifie la taille des particules primaires.</li>
      <li><strong>Dispersant</strong> : l’adsorption est décrite par une saturation (type Langmuir) ; le dosage optimal et l’étalement sont qualitatifs. Les polycarboxylates agissent par effet électro-stérique, les polyacrylates et naphtalènes sulfonés surtout par effet électrostatique.</li>
      <li><strong>Hors modèle</strong> : le ciment s’hydrate et fait prise (non modélisé), l’effet de la température, du pH et de la salinité (voir la simulation précédente), la rhéologie complète de la pâte. La granulométrie laser mesure un diamètre équivalent de sphère.</li>
      <li><strong>Spécifications</strong> : D50 ≤ 11 µm et moins de 12 % de masse au-delà de 50 µm sont des seuils illustratifs pour les défis, pas des normes.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{MES_GUIDE[sc] ? 'Données' : 'Mesures'}</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .di-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .di-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .di-col { display: flex; flex-direction: column; gap: 12px; }
        .di-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .di-l1.cote .di-carte { order: 2; } .di-l1.cote .di-main { order: 1; }
          .di-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .di-ex > * { grid-column: 1; }
          .di-ex > .di-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .di-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .di-in { animation: di-fondu 0.35s ease-out; } @keyframes di-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .di-l1 *, .di-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mouiller, disperser, stabiliser une suspension</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Pour obtenir une suspension homogène à partir d’une poudre, on <strong>mouille</strong> (l’air part), on <strong>disperse</strong> (les amas cassent) et on <strong>stabilise</strong> avec un dispersant. Une <strong>distribution granulométrique</strong> permet de contrôler le résultat.</div>
      {enGuide && <div className="di-l1 cote">
        <div className="di-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="di-main">
          <div className="di-col">
            {sceneBloc && <div className="di-in">{sceneBloc}</div>}
            {curseurGuide && <div className="di-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="di-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'dosage' ? suiviD : suiviG}/></div>}
      {enExplore && <>
        <div className="di-ex">
          {scenes}
          <div className="di-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        {sectionDosage}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
