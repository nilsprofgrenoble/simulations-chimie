import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./stereoisomeresModele";
import { QCM, MOL, A, IMG, AUTRE, AUTRE2, nom } from "./stereoisomeresQcm";
import { CoupleCram, SceneAlcene, SvgNombre, SvgRelations, SvgBio, SvgZE, SvgArbre } from "./StereoisomeresSchemas";

const SIM_ID = 144, CLE_GUIDE = 'stereoisomeres-guide-v1';
declarerDefis(SIM_ID, [['relation', 'Relation entre deux stéréoisomères'], ['ze', 'Isomérie Z ou E d’un alcène']]);

// ====================================================
//  SIM 144 — STÉRÉOISOMÈRES : ÉNANTIOMÈRES, DIASTÉRÉOISOMÈRES, ISOMÉRIE Z/E (TSTL, enseignement PCM, Constitution de la matière › Structure spatiale)
//  Une seule idée : deux stéréoisomères ont le même enchaînement d’atomes ; on les distingue par leur arrangement dans l’espace.
//  Notions : nombre de stéréoisomères (2ⁿ), énantiomères (image dans un miroir : tous les carbones inversés), diastéréoisomères (les autres), propriétés biologiques, isomérie Z/E d’un alcène.
//  Aucune situation du Moodle : acide 2-chloro-3-hydroxybutanoïque, acide 3-chloroprop-2-énoïque, 1-bromo-2-chloroéthène, une molécule fictive M pour l’exemple biologique.
//  Capacités visées (jamais affichées à l’élève) : représenter des énantiomères ou des diastéréoisomères ; identifier des couples d’énantiomères et des diastéréoisomères ; extraire et exploiter des informations sur les propriétés biologiques de stéréoisomères ; isomérie Z et E.
//  Modèle : stereoisomeresModele.js (réutilise chiraliteModele.js de la sim 137). Schémas : StereoisomeresSchemas.jsx. QCM : stereoisomeresQcm.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c' };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const REL = { identiques: 'identiques', enantiomeres: 'énantiomères', diastereoisomeres: 'diastéréoisomères' };
const nomDe = (m, s) => M.nomDesc(m, s.desc);

// molécules du parcours
const PAL = M.parIdAlc('chloropropenoique'), BCE = M.parIdAlc('bromochloroethene');
const H_PREM = [true, true], H_ZE2 = [true, false];                        // Z pour l’acide, E pour le bromochloroéthène
const MASSE = 250, ACTIF = MASSE / 2;
const LETTRES = [['A', A], ['B', IMG], ['C', AUTRE], ['D', AUTRE2]];

// ---------- scènes ----------
const sCram = (items, aria) => <CoupleCram mol={MOL} items={items} ariaLabel={aria}/>;
function Chips({ items, surligne }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }} aria-label="Les quatre stéréoisomères de la molécule">
      {items.map(([l, s]) => <div key={l} style={{ padding: '8px 12px', borderRadius: 10, border: `2px solid ${l === surligne ? COL.orange : KIT.bord}`, background: l === surligne ? '#fef3c7' : 'white', fontSize: 16, fontWeight: 700, color: KIT.txt }}>{l} : {nom(s)}</div>)}
    </div>);
}
const paire = (haut, m, rangs, verdict, relier) => <SceneAlcene m={m} haut={haut} rangs={rangs} verdict={verdict} relier={relier}/>;

// ====================================================
export function SimulationStereoisomeres() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviR, noterR] = useCompteurDefi(), [suiviZ, noterZ] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('relation');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ mode: 'c', mol: 'chlorohydroxy', a: 'RS', b: 'RR', miroirA: false, alc: 'pent2ene', h: [true, true], rangs: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'deux', titre: 'Deux carbones asymétriques', focus: ['scene'],
      texte: <>L’<strong>acide 2-chloro-3-hydroxybutanoïque</strong>, CH₃–CH(OH)–CHCl–COOH, a <strong>deux carbones asymétriques</strong> : C2 (lié à Cl, COOH, H et C3) et C3 (lié à OH, CH₃, H et C2). Chacun peut avoir la configuration <strong>R</strong> ou <strong>S</strong>. Le dessin de Cram montre l’une des molécules possibles : <strong>{nom(A)}</strong>.</>,
      tache: { type: 'num', q: 'Combien de stéréoisomères de configuration cette formule peut-elle représenter au maximum ?', unite: '', vrai: 4, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['C2 peut être R ou S : 2 possibilités.', 'C3 peut aussi être R ou S : 2 possibilités, quelle que soit la lettre de C2.', 'Total : 2 × 2 = 4.'],
        pieges: [[2, 'C’est le nombre de choix pour un seul carbone : il faut multiplier les possibilités de C2 et de C3.'], [3, 'Les deux carbones sont indépendants : 2 × 2, soit 4 combinaisons de lettres.'], [8, 'Il n’y a que deux carbones asymétriques : 2 × 2 = 4, et non 2 × 2 × 2.']],
        expl: 'Deux choix pour C2 et deux choix pour C3 : 2 × 2 = 4 combinaisons (R,R), (R,S), (S,R) et (S,S). Ce sont les quatre stéréoisomères.', indice: 'Pour chaque lettre de C2, combien de lettres possibles pour C3 ? Multipliez.' } },
    { id: 'miroir', titre: 'L’image dans un miroir', focus: ['scene'],
      retenirTitre: 'À RETENIR : COMBIEN DE STÉRÉOISOMÈRES ?', retenir: <>
        <SvgNombre/>
        <ul style={puces}>
          <li>Chaque carbone asymétrique a <strong>deux configurations</strong>, R ou S : avec n carbones asymétriques, il y a au plus <strong>2ⁿ stéréoisomères</strong> (sans composé méso).</li>
          <li>Exemple : 2 carbones asymétriques, 4 stéréoisomères ; 3 carbones, 8.</li>
          <li>Moyen de s’en souvenir : <strong>« chaque carbone asymétrique double le nombre de possibilités »</strong>.</li>
        </ul></>,
      texte: <>La molécule A est <strong>{nom(A)}</strong>. Le dessin de droite est son <strong>image dans un miroir</strong> : à chaque carbone, ce qui était à gauche passe à droite (les coins pleins restent des coins pleins). C’est un autre stéréoisomère de la même formule.</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de l’image de A dans le miroir ?', ...QCM.miroir,
        expl: `Un miroir inverse la configuration de chaque carbone asymétrique : R devient S et S devient R, aux deux carbones. L’image de ${nom(A)} est ${nom(IMG)}.`, indice: 'Dans un miroir, le sens de rotation 1 → 2 → 3 s’inverse : que devient la lettre de chaque carbone ?' } },
    { id: 'enantio', titre: 'Deux molécules images l’une de l’autre', focus: ['scene'],
      texte: <>La molécule A et son image B ne se superposent pas (comme une main droite et une main gauche). A est <strong>{nom(A)}</strong> et B est <strong>{nom(IMG)}</strong>.</>,
      tache: { type: 'qcm', q: 'Quelle est la relation entre A et B ?', ...QCM.enantio,
        expl: `B est l’image de A dans un miroir, et elles ne se superposent pas : ce sont des énantiomères. Leurs deux carbones ont des configurations opposées : ${nom(A)} et ${nom(IMG)}.`, indice: 'B est l’image de A dans un miroir, et les deux molécules ne se superposent pas. Quel nom donne-t-on à de telles molécules ?' } },
    { id: 'diast', titre: 'Un seul carbone inversé', focus: ['scene'],
      texte: <>On compare maintenant A, <strong>{nom(A)}</strong>, à une autre molécule C, <strong>{nom(AUTRE)}</strong> : seul le carbone C3 a changé de configuration. C n’est pas l’image de A dans un miroir (il faudrait inverser les deux carbones).</>,
      tache: { type: 'qcm', q: 'Quelle est la relation entre A et C ?', ...QCM.diast,
        expl: `A et C sont des stéréoisomères (même enchaînement d’atomes) qui ne sont pas image l’un de l’autre : ce sont des diastéréoisomères. Ici, un seul carbone est inversé : ${nom(A)} et ${nom(AUTRE)}.`, indice: 'Pour des énantiomères, tous les carbones asymétriques sont inversés. Ici, combien de carbones changent de lettre ?' } },
    { id: 'compte', titre: 'Compter les diastéréoisomères', focus: ['scene'],
      texte: <>La molécule a quatre stéréoisomères : A, B, C et D (affichés ci-dessus). Vous savez que B est l’énantiomère de A et que C est un diastéréoisomère de A. Il reste D, <strong>{nom(AUTRE2)}</strong>, où seul le carbone C2 est inversé par rapport à A.</>,
      tache: { type: 'num', q: 'Parmi les trois autres stéréoisomères, combien sont des diastéréoisomères de A ?', unite: '', vrai: 2, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['B : tous les carbones inversés, c’est l’énantiomère de A.', 'C : seul C3 est inversé, c’est un diastéréoisomère.', 'D : seul C2 est inversé, c’est un diastéréoisomère.', 'Total : 2 diastéréoisomères.'],
        pieges: [[1, 'Il y en a un de plus : C et D diffèrent de A par un seul carbone, tous deux sont des diastéréoisomères.'], [3, 'B est l’énantiomère de A, il n’est pas compté : il reste C et D.']],
        expl: 'B est l’unique énantiomère de A. Les deux autres, C et D, sont des diastéréoisomères de A : 2 diastéréoisomères.', indice: 'Pour chacune des trois autres molécules, comparez les lettres C2 et C3 à celles de A : tout inversé = énantiomère, sinon diastéréoisomère.' } },
    { id: 'bio', titre: 'Des effets différents sur le vivant', focus: [],
      retenirTitre: 'À RETENIR : ÉNANTIOMÈRES ET DIASTÉRÉOISOMÈRES', retenir: <>
        <SvgRelations/>
        <ul style={puces}>
          <li>Les <strong>stéréoisomères</strong> ont le même enchaînement d’atomes. <strong>Énantiomères</strong> : images l’un de l’autre dans un miroir, non superposables (tous les C* inversés). <strong>Diastéréoisomères</strong> : stéréoisomères qui ne sont pas image l’un de l’autre.</li>
          <li>Exemple : avec 2 C*, chaque stéréoisomère a 1 énantiomère et 2 diastéréoisomères.</li>
          <li>Moyen de s’en souvenir : <strong>« énantiomères : tout inversé ; diastéréoisomères : une partie seulement »</strong>.</li>
        </ul></>,
      texte: <>Les deux énantiomères d’une molécule ont les mêmes propriétés physiques, mais ils peuvent agir différemment sur le vivant, car les récepteurs de l’organisme sont eux-mêmes chiraux. Exemple fictif : une molécule <strong>M</strong> existe sous deux énantiomères, (R)-M et (S)-M. Les essais montrent que <strong>seul (R)-M agit</strong> ; (S)-M est sans effet. Un laboratoire prépare <strong>{MASSE}{NB}mg</strong> d’un <strong>mélange racémique</strong> de M, c’est-à-dire à parts égales de (R)-M et de (S)-M.</>,
      tache: { type: 'num', q: 'Quelle masse de (R)-M, l’énantiomère actif, contient ce mélange (en mg) ?', unite: 'mg', vrai: ACTIF, tol: 0.05, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => [`Mélange racémique : 50 % de (R)-M et 50 % de (S)-M.`, `m((R)-M) = ${MASSE} × 0,50 = ${ACTIF} mg.`],
        pieges: [[MASSE, 'C’est la masse totale du mélange : seule la moitié est (R)-M, l’énantiomère actif.'], [MASSE / 4, 'Un racémique contient 50 % de chaque énantiomère, pas 25 %.'], [2 * MASSE, 'La masse de (R)-M ne peut pas dépasser la masse du mélange : il faut en prendre la moitié.']],
        expl: `Un mélange racémique contient 50 % de chaque énantiomère : ${MASSE} × 0,50 = ${ACTIF} mg de (R)-M. L’autre moitié, (S)-M, est sans effet.`, indice: 'Un mélange racémique contient autant de chaque énantiomère : quelle fraction de la masse est (R)-M ?' } },
    { id: 'alcene', titre: 'Une autre isomérie : la double liaison', focus: [],
      retenirTitre: 'À RETENIR : LE VIVANT ET LA CHIRALITÉ', retenir: <>
        <SvgBio/>
        <ul style={puces}>
          <li>Un récepteur du vivant est <strong>chiral</strong> : il reconnaît un énantiomère et pas son image. Deux énantiomères ont les mêmes propriétés physiques mais peuvent avoir des effets biologiques différents.</li>
          <li>Un <strong>mélange racémique</strong> contient 50 % de chaque énantiomère.</li>
          <li>Moyen de s’en souvenir : <strong>« un récepteur est comme une main : il choisit un seul énantiomère »</strong>.</li>
        </ul></>,
      texte: <>Autour d’une liaison simple C–C, les atomes tournent librement. Autour d’une <strong>double liaison C=C</strong>, la rotation est <strong>bloquée</strong> : les quatre groupes liés aux deux carbones restent dans un même plan, et leur arrangement compte. Il peut alors exister deux stéréoisomères, notés Z et E.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces molécules peut exister sous deux formes Z et E ?', ...QCM.alcene,
        expl: 'Il faut que chaque carbone de la double liaison porte deux groupes différents. CH₃–CH=CH–CH₂CH₃ convient ; dans les trois autres, un carbone porte deux groupes identiques (H, H ; CH₃, CH₃ ou Cl, Cl).', indice: 'Regardez séparément les deux groupes liés à chacun des deux carbones de C=C : sont-ils différents ?' } },
    { id: 'prio', titre: 'Classer les groupes sur chaque carbone', focus: ['scene'],
      texte: <>On étudie <strong>{PAL.semi}</strong> ({PAL.nom}). Sur <strong>chaque carbone</strong> de la double liaison, on classe les deux groupes avec les règles CIP vues pour R et S (numéro atomique, puis atomes suivants) : le <strong>numéro 1</strong> est le groupe prioritaire.</>,
      tache: { type: 'qcm', q: 'Quel est le groupe prioritaire (numéro 1) sur chacun des deux carbones ?', ...QCM.prio,
        expl: 'Sur le carbone lié à Cl et H : Cl (Z = 17) passe avant H (Z = 1). Sur le carbone lié à COOH et H : le carbone de COOH (Z = 6) passe avant H (Z = 1). Les groupes prioritaires sont Cl et COOH.', indice: 'Sur chaque carbone, comparez les deux atomes directement liés : le numéro atomique le plus grand est prioritaire.' } },
    { id: 'ze', titre: 'Z ou E ?', focus: ['scene'],
      texte: <>Les groupes prioritaires sont repérés par un badge. <strong>Règle</strong> : si les deux groupes de priorité 1 sont du <strong>même côté</strong> de la double liaison, la molécule est <strong>Z</strong> ; s’ils sont de <strong>côtés opposés</strong>, elle est <strong>E</strong>.</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de cette molécule, et pourquoi ?', ...QCM.ze,
        expl: 'Cl et COOH, les deux groupes prioritaires, sont dessinés du même côté de la double liaison : la molécule est Z.', indice: 'Repérez les deux badges « 1 » : sont-ils tous les deux au-dessus de C=C, ou l’un au-dessus et l’autre au-dessous ?' } },
    { id: 'ze2', titre: 'Encore un exemple', focus: ['scene'],
      retenirTitre: 'À RETENIR : Z ET E', retenir: <>
        <SvgZE/>
        <ul style={puces}>
          <li>Sur chaque carbone de C=C, on classe les deux groupes (règles CIP) : le n° 1 est le prioritaire. <strong>Même côté : Z</strong> ; <strong>côtés opposés : E</strong>.</li>
          <li>Il y a isomérie Z/E si <strong>chaque carbone de C=C porte deux groupes différents</strong> (le propène, avec CH₂ en bout, n’en a pas).</li>
          <li>Moyen de s’en souvenir : <strong>« Z comme zusammen (ensemble), E comme entgegen (opposé) »</strong>.</li>
        </ul></>,
      texte: <>La molécule <strong>{BCE.semi}</strong> ({BCE.nom}) : le brome (Z = 35) est prioritaire sur H, et le chlore (Z = 17) est prioritaire sur H. Les badges « 1 » repèrent Br et Cl.</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de cette molécule ?', ...QCM.ze2,
        expl: 'Br et Cl, les deux groupes de priorité 1, sont de côtés opposés de la double liaison : la molécule est E.', indice: 'Les deux badges « 1 » sont-ils du même côté de C=C ou de côtés opposés ?' } },
    { id: 'relZE', titre: 'Z et E : quelle relation ?', focus: ['scene'],
      texte: <>On compare les deux molécules {BCE.semi} : celle qui est Z et celle qui est E. Elles ont le même enchaînement d’atomes, mais elles ne se superposent pas : la rotation autour de C=C est bloquée. Ni l’une ni l’autre n’a de carbone asymétrique.</>,
      tache: { type: 'qcm', q: 'Quelle est la relation entre la forme Z et la forme E ?', ...QCM.relZE,
        expl: 'Ce sont des stéréoisomères qui ne sont pas image l’un de l’autre dans un miroir (chacune est identique à sa propre image) : des diastéréoisomères. L’isomérie Z/E est une isomérie de type diastéréoisomérie.', indice: 'Chaque forme est-elle l’image de l’autre dans un miroir, ou se superpose-t-elle à sa propre image ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : QUELLE RELATION ?', retenir: <>
        <SvgArbre/>
        <ul style={puces}>
          <li>Deux molécules de même formule semi-développée : si elles <strong>se superposent</strong>, ce sont les mêmes ; sinon, <strong>image dans un miroir</strong> : énantiomères ; sinon : diastéréoisomères.</li>
          <li>Les deux formes Z et E d’un alcène sont toujours des diastéréoisomères.</li>
          <li>Moyen de s’en souvenir : <strong>« miroir ? oui : énantiomères ; non : diastéréoisomères »</strong>.</li>
        </ul></>,
      texte: <>Vous savez compter les stéréoisomères, reconnaître des énantiomères et des diastéréoisomères, relier chiralité et effets biologiques, et distinguer Z et E. Explorez maintenant, ou relevez les défis.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- scène affichée à chaque étape ----------
  const nomA = `Molécule A : ${nom(A)}`;
  const SC = {
    deux: () => sCram([{ affs: A.affs, legende: nomA }], 'Une molécule à deux carbones asymétriques'),
    miroir: () => sCram([{ affs: A.affs, legende: nomA }, { affs: A.affs, miroir: true, legende: 'Son image dans un miroir', pointille: true }], 'A et son image dans un miroir'),
    enantio: () => sCram([{ affs: A.affs, legende: `A : ${nom(A)}` }, { affs: IMG.affs, legende: `B : ${nom(IMG)}` }], 'Les molécules A et B'),
    diast: () => sCram([{ affs: A.affs, legende: `A : ${nom(A)}` }, { affs: AUTRE.affs, legende: `C : ${nom(AUTRE)}` }], 'Les molécules A et C'),
    compte: () => <Chips items={LETTRES} surligne="A"/>,
    prio: () => paire(H_PREM, PAL, false, null, false),
    ze: () => paire(H_PREM, PAL, true, null, false),
    ze2: () => paire(H_ZE2, BCE, true, null, false),
    relZE: () => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>{paire(H_PREM, BCE, true, 'Z', false)}{paire(H_ZE2, BCE, true, 'E', false)}</div>,
  };
  const MES = {
    deux: [['Carbones asymétriques', 'C2 et C3']],
    miroir: [['Molécule A', nom(A), COL.orange]],
    enantio: [['A', nom(A), COL.orange], ['B', nom(IMG), COL.bleu]],
    diast: [['A', nom(A), COL.orange], ['C', nom(AUTRE), COL.bleu]],
    compte: [['A', nom(A), COL.orange]],
    bio: [['Masse du mélange', `${MASSE}${NB}mg`], ['Énantiomère actif', '(R)-M', COL.orange]],
    prio: [['Règle de priorité', 'numéro atomique le plus grand']],
    ze: [['Priorité 1', 'Cl et COOH', COL.rouge]],
    ze2: [['Priorité 1', 'Br et Cl', COL.rouge]],
  };
  const lignesGuide = enGuide ? (MES[idE] ?? []) : [];
  const sceneGuide = enGuide && SC[idE] ? SC[idE]() : null;

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'relation') { const t = M.tirageRelation(); setDefi({ ...t, reps: { rel: '', nb: '' }, verifie: false }); }
    else setDefi({ ...M.tirageZE(), reps: { z1: '', z2: '' }, verifie: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'relation') {
      const nb = lireNombre(defi.reps.nb), ok = defi.reps.rel === defi.rel && isFinite(nb) && nb === M.nbStereo(defi.n);
      setDefi(x => ({ ...x, verifie: true, ok })); noterR(ok);
    } else {
      const ok = defi.reps.z1 === M.geometrieZE(defi.h1) && defi.reps.z2 === M.geometrieZE(defi.h2);
      setDefi(x => ({ ...x, verifie: true, ok })); noterZ(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const selDefi = (cle, aria, options, ok) => (
    <select value={defi.reps[cle]} aria-label={aria} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e2.target.value }, verifie: false }))}
      style={{ ...selectStyle, width: 'auto', minWidth: 150, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}` }}>
      <option value="">Choisir…</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['relation', 'Relation entre stéréoisomères'], ['ze', 'Z ou E']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'relation' ? 'Défi : la relation entre deux stéréoisomères' : 'Défi : Z ou E ?'}</div>
      {defi.type === 'relation' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>La molécule <strong>{defi.m.nom}</strong> ({defi.m.semi}) a deux carbones asymétriques. Le stéréoisomère <strong>A</strong> est <strong>{M.nomDesc(defi.m, defi.a.desc)}</strong> et le stéréoisomère <strong>B</strong> est <strong>{M.nomDesc(defi.m, defi.b.desc)}</strong>.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>A et B sont :</span>{selDefi('rel', 'Relation entre A et B', Object.entries(REL), defi.ok || defi.reps.rel === defi.rel)}
        </div>
        <div style={{ ...lbl, marginBottom: 8 }}>Une autre molécule a <strong>{defi.n} carbones asymétriques</strong> (sans composé méso).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Nombre maximal de stéréoisomères =</span>
          <input value={defi.reps.nb} aria-label="Nombre maximal de stéréoisomères" inputMode="numeric" onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('st-verif')?.click()} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, nb: e2.target.value }, verifie: false }))}
            style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (lireNombre(defi.reps.nb) === M.nbStereo(defi.n) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        </div>
        <IndiceDefi cache={false}>Deux stéréoisomères sont énantiomères si leurs deux carbones sont inversés (R devient S et S devient R) ; identiques si rien ne change ; diastéréoisomères sinon. Avec n carbones asymétriques : 2 × 2 × … (n fois).</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On a dessiné deux fois la molécule <strong>{defi.m.semi}</strong> ({defi.m.nom}). Classez les groupes de chaque carbone avec les règles CIP, puis donnez la configuration de chaque dessin.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10, marginBottom: 8 }}>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Dessin 1</div>{paire(defi.h1, defi.m, defi.verifie, defi.verifie ? M.geometrieZE(defi.h1) : null, defi.verifie)}</div>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Dessin 2</div>{paire(defi.h2, defi.m, defi.verifie, defi.verifie ? M.geometrieZE(defi.h2) : null, defi.verifie)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Dessin 1 :</span>{selDefi('z1', 'Configuration du dessin 1', [['Z', 'Z'], ['E', 'E']], defi.reps.z1 === M.geometrieZE(defi.h1))}
          <span>Dessin 2 :</span>{selDefi('z2', 'Configuration du dessin 2', [['Z', 'Z'], ['E', 'E']], defi.reps.z2 === M.geometrieZE(defi.h2))}
        </div>
        <IndiceDefi cache={false}>Sur chaque carbone de C=C, le groupe dont l’atome a le plus grand numéro atomique est prioritaire. Les deux prioritaires du même côté : Z ; de côtés opposés : E.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="st-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.type === 'relation'
          ? `A ${M.nomDesc(defi.m, defi.a.desc)} et B ${M.nomDesc(defi.m, defi.b.desc)} : ${defi.rel === 'enantiomeres' ? 'tous les carbones sont inversés, ce sont des énantiomères' : defi.rel === 'identiques' ? 'aucun carbone n’est inversé, c’est la même molécule' : 'un seul carbone est inversé, ce sont des diastéréoisomères'}. Avec ${defi.n} carbones asymétriques : 2 puissance ${defi.n} = ${M.nbStereo(defi.n)} stéréoisomères.`
          : `Dessin 1 : ${M.geometrieZE(defi.h1)} ; dessin 2 : ${M.geometrieZE(defi.h2)}. ${defi.rel === 'identiques' ? 'Les deux dessins représentent la même molécule.' : 'Ce sont deux diastéréoisomères (Z et E).'}`))}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Molécules sans cycle</strong>, à deux carbones asymétriques voisins (4 stéréoisomères) ou à une seule double liaison C=C. La rotation autour d’une liaison simple est libre ; elle est bloquée autour d’une double liaison.</li>
      <li><strong>Aucun composé méso</strong> : les deux carbones asymétriques ont des substituants différents, donc 2ⁿ stéréoisomères distincts. Avec des carbones identiques, il y en aurait moins.</li>
      <li><strong>Les priorités suivent les règles CIP du programme</strong> (numéro atomique, puis atomes suivants), comme pour la configuration R ou S. Les perspectives de Cram sont des représentations conventionnelles.</li>
      <li><strong>Les données biologiques sont fictives</strong> (molécule M) : elles illustrent une idée, elles ne décrivent pas un médicament réel.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const mx = M.parId2(ti.mol), stX = M.stereoisomeres(mx), sa = stX.find(s => s.id === ti.a) ?? stX[0], sb = stX.find(s => s.id === ti.b) ?? stX[1];
  const am = M.parIdAlc(ti.alc), hX = am.ze ? ti.h : [true, true];
  const relX = M.relation(sa.desc, sb.desc);
  const gScene = ti.mode === 'c'
    ? <CoupleCram mol={mx} ariaLabel="Deux stéréoisomères" items={[{ affs: sa.affs, legende: `A : ${nomDe(mx, sa)}` }, ...(ti.miroirA ? [{ affs: sa.affs, miroir: true, legende: 'Image de A dans un miroir', pointille: true }] : []), { affs: sb.affs, legende: `B : ${nomDe(mx, sb)}` }]}/>
    : <SceneAlcene m={am} haut={hX} rangs={ti.rangs} relier={ti.rangs && am.ze} verdict={ti.rangs && am.ze ? M.geometrieZE(hX) : null}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enGuide ? (idE === 'bio' || idE === 'alcene' || idE === 'bilan' ? '' : 'Les molécules') : (ti.mode === 'c' ? 'Deux stéréoisomères en perspective de Cram' : 'Double liaison C=C')}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{ti.mode === 'c' ? 'Choisissez deux stéréoisomères A et B de la même molécule : la relation entre eux est donnée dans Mesures.' : 'Placez les groupes de la double liaison : la configuration Z ou E apparaît dans Mesures si chaque carbone porte deux groupes différents.'}</div>}
      {enGuide ? sceneGuide : gScene}
    </div>);
  const selMol = (id, val, set, options) => (<>
    <label htmlFor={id} style={libelle}>{options.titre}</label>
    <select id={id} value={val} onChange={ev => set(ev.target.value)} style={{ ...selectStyle, marginBottom: 8 }}>{options.liste.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {selMol('st-m', ti.mode, v => setTi(s => ({ ...s, mode: v })), { titre: 'Type d’isomérie', liste: [['c', 'Carbones asymétriques : énantiomères, diastéréoisomères'], ['alc', 'Double liaison C=C : Z et E']] })}
      {ti.mode === 'c' ? <>
        {selMol('st-mol', ti.mol, v => { const s2 = M.stereoisomeres(M.parId2(v)); setTi(s => ({ ...s, mol: v, a: s2[0].id, b: s2[1].id })); }, { titre: 'Molécule', liste: M.POOL2.map(m => [m.id, `${m.nom} (${m.semi})`]) })}
        {selMol('st-a', sa.id, v => setTi(s => ({ ...s, a: v })), { titre: 'Stéréoisomère A', liste: stX.map(s => [s.id, nomDe(mx, s)]) })}
        {selMol('st-b', sb.id, v => setTi(s => ({ ...s, b: v })), { titre: 'Stéréoisomère B', liste: stX.map(s => [s.id, nomDe(mx, s)]) })}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: KIT.txt, minHeight: 36 }}><input type="checkbox" checked={ti.miroirA} onChange={ev => setTi(s => ({ ...s, miroirA: ev.target.checked }))}/>Afficher l’image de A dans un miroir</label>
      </> : <>
        {selMol('st-alc', ti.alc, v => setTi(s => ({ ...s, alc: v })), { titre: 'Alcène', liste: M.ALCENES.map(a => [a.id, `${a.nom} (${a.semi})`]) })}
        {am.ze && <>
          {selMol('st-h0', ti.h[0] ? 'h' : 'b', v => setTi(s => ({ ...s, h: [v === 'h', s.h[1]] })), { titre: 'Groupe prioritaire du carbone de gauche', liste: [['h', 'au-dessus de C=C'], ['b', 'au-dessous de C=C']] })}
          {selMol('st-h1', ti.h[1] ? 'h' : 'b', v => setTi(s => ({ ...s, h: [s.h[0], v === 'h'] })), { titre: 'Groupe prioritaire du carbone de droite', liste: [['h', 'au-dessus de C=C'], ['b', 'au-dessous de C=C']] })}
        </>}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: KIT.txt, minHeight: 36 }}><input type="checkbox" checked={ti.rangs} onChange={ev => setTi(s => ({ ...s, rangs: ev.target.checked }))}/>Afficher les priorités et le verdict</label>
      </>}
    </div>);
  const mesures = (enExplore || (enGuide && lignesGuide.length > 0)) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Données'}</div>
      {enGuide ? lignesGuide.map(([n, v, col]) => <LigneMesure key={n} nom={n} valeur={v} couleur={col}/>) : ti.mode === 'c' ? <>
        <LigneMesure nom="Stéréoisomères possibles" valeur={`${M.nbStereo(2)}`}/>
        <LigneMesure nom="Relation entre A et B" valeur={REL[relX]} couleur={relX === 'enantiomeres' ? COL.bleu : relX === 'identiques' ? COL.vert : COL.orange}/>
        <LigneMesure nom="Image de A dans un miroir" valeur={nomDe(mx, stX.find(s => M.relation(sa.desc, s.desc) === 'enantiomeres'))} couleur={COL.bleu}/>
      </> : <>
        <LigneMesure nom="Isomérie Z/E" valeur={am.ze ? 'possible' : 'impossible'} couleur={am.ze ? COL.vert : COL.rouge}/>
        {am.ze ? <>
          <LigneMesure nom="Groupes prioritaires" valeur={`${M.etiqAlc(am, am.subs[0][0])} et ${M.etiqAlc(am, am.subs[1][0])}`} couleur={COL.rouge}/>
          <LigneMesure nom="Configuration" valeur={`${M.geometrieZE(hX)}${NB}(${M.geometrieZE(hX) === 'Z' ? 'même côté' : 'côtés opposés'})`} couleur={COL.orange}/>
        </> : <LigneMesure nom="Pourquoi" valeur="un carbone de C=C porte deux groupes identiques"/>}
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Avec l’acide 2-chloro-3-hydroxybutanoïque, choisissez A = (2R,3S) puis essayez les trois autres B : quelle est la relation dans chaque cas ?</li>
      <li>Affichez l’image de A dans un miroir : à quel stéréoisomère correspond-elle ?</li>
      <li>Passez aux alcènes : parmi les dix molécules proposées, lesquelles n’ont pas d’isomérie Z/E ? Qu’ont-elles en commun ?</li>
      <li>Avec le pent-2-ène, déplacez le groupe prioritaire d’un seul carbone : la configuration change-t-elle ? Et si on déplace les deux ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>n carbones asymétriques : au plus 2ⁿ stéréoisomères</li>
        <li>Énantiomères : images dans un miroir, tous les carbones inversés ; diastéréoisomères : les autres stéréoisomères</li>
        <li>Alcène : Z si les groupes prioritaires sont du même côté, E s’ils sont de côtés opposés ; il faut deux groupes différents sur chaque carbone de C=C</li>
        <li>Z et E sont des diastéréoisomères</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .st-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .st-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .st-col { display: flex; flex-direction: column; gap: 12px; }
        .st-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .st-l1.cote .st-carte { order: 2; } .st-l1.cote .st-main { order: 1; }
          .st-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .st-ex > * { grid-column: 1; }
          .st-ex > .st-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .st-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .st-in { animation: st-fondu 0.35s ease-out; } @keyframes st-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Stéréoisomères : énantiomères, diastéréoisomères, Z et E</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Deux <strong>stéréoisomères</strong> ont le même enchaînement d’atomes mais pas le même arrangement dans l’espace. On apprend à les compter, à reconnaître les <strong>énantiomères</strong> et les <strong>diastéréoisomères</strong>, et à distinguer les formes <strong>Z</strong> et <strong>E</strong> d’un alcène.</div>
      {!enExplore && <div className={`st-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="st-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="st-carte">{panneauHypo}</div>}
        <div className="st-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'relation' ? suiviR : suiviZ}/></div>}
          {enGuide && sceneGuide && <div className="st-col"><div className="st-in">{scene}</div>{mesures && <div className="st-in">{mesures}</div>}</div>}
          {enGuide && !sceneGuide && mesures && <div className="st-col"><div className="st-in">{mesures}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="st-ex">
          {scene}
          <div className="st-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
