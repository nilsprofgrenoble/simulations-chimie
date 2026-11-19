import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./polymeresModele";
import { QCM_PARCOURS as Q } from "./polymeresQcm";
import { SvgMolecule, SvgPolymere, SvgNomEsterCarte, SvgClassesAmineCarte, SvgTroisGroupesCarte, SvgHalogenoCarte, SvgMotifCarte, SvgNatSynthCarte } from "./polymeresSchemas";

const SIM_ID = 173, CLE_GUIDE = 'polymeres-tg-guide-v1';
declarerDefis(SIM_ID, [['famille', 'Reconnaître la famille et nommer une molécule'], ['motif', 'Retrouver le motif d’un polymère']]);

// ====================================================
// SIM 173 — FAMILLES FONCTIONNELLES (ESTERS, AMINES, AMIDES, HALOGÉNOALCANES) ET POLYMÈRES
//  (TG spé PC, « Constitution et transformations de la matière », partie « Élaborer des stratégies en synthèse organique », structure et propriétés).
//  Capacités visées (jamais affichées à l'élève) : exploiter des règles de nomenclature fournies pour nommer une espèce de la famille des esters,
//  amines, amides, halogénoalcanes, ou représenter l'entité associée ; identifier le motif d'un polymère à partir de sa formule ;
//  citer des polymères naturels et synthétiques et des utilisations courantes.
//  Les molécules sont dessinées à partir d'un graphe (polymeresModele.js) : valences, formules et noms sont calculés, jamais saisis deux fois.
//  Hors périmètre : stéréoisomérie, isomérie de constitution (sim 172), mécanismes, synthèses.
// ====================================================

const NB = ' ';
const BLEU = '#0369a1';
const IDS = ['ester', 'nomEster', 'amine', 'nomAmine', 'amide', 'nomAmide', 'halogeno', 'formule', 'motif', 'nombre', 'naturel', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const nbm = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tire = t => t[Math.floor(Math.random() * t.length)];
const mol = nom => M.molParNom(nom);

// ---------- règles de nomenclature fournies (cadre « annexe ») ----------
const REGLES = {
  alcanes: <li><strong>Alcanes</strong> : 1 C méthane, 2 C éthane, 3 C propane, 4 C butane. Groupes alkyle : méthyle (1 C), éthyle (2 C), propyle (3 C), butyle (4 C).</li>,
  ester: <li><strong>Ester</strong> R–CO–O–R′ : « alcanoate d’alkyle ». Première partie : la chaîne qui porte le C=O, carbone du C=O compris (1 C méthanoate, 2 C éthanoate, 3 C propanoate, 4 C butanoate). Seconde partie : le groupe alkyle lié à l’oxygène simple.</li>,
  amine: <li><strong>Amine</strong> : nom de l’alcane sans le « e » final + « amine » (éthanamine). Numéro du carbone lié à N à partir de 3 C (propan-2-amine). La chaîne principale est la plus longue des chaînes carbonées liées à N. Chaque autre groupe alkyle fixé sur N est ajouté devant avec « N- » (N,N- pour deux groupes identiques).</li>,
  amide: <li><strong>Amide</strong> : nom de l’alcane sans le « e » final + « amide » (propanamide). Le carbone du C=O est le carbone n° 1 de la chaîne. Les groupes alkyle fixés sur N s’ajoutent devant avec « N- ».</li>,
  halogeno: <li><strong>Halogénoalcane</strong> : préfixe « chloro » ou « bromo » devant le nom de l’alcane (chlorométhane). Dès 3 C, on indique le numéro du carbone qui porte l’halogène, le plus petit possible (1-bromobutane).</li>,
};
function PanneauRegles({ cles, sansTitre = false }) {
  return (
    <div style={{ ...styleBoite, background: '#f8fafc' }}>
      {!sansTitre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Règles de nomenclature (fournies)</div>}
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>{REGLES.alcanes}{cles.map(c => <span key={c} style={{ display: 'contents' }}>{REGLES[c]}</span>)}</ul>
    </div>);
}

// ---------- légende sous un dessin ----------
const Legende = ({ m, nom = false, brute = false }) => (
  <div style={{ textAlign: 'center', fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginTop: 2 }}>
    {nom && <div style={{ fontWeight: 700 }}>{m.nom}</div>}
    <div>Formule semi-développée : <strong>{m.sd}</strong>{brute && <> · brute : <strong>{m.brute}</strong></>}</div>
  </div>);

// ---------- cartes « À retenir » ----------
const carte = (Schema, lignes) => <><Schema/><ul style={ULS}>{lignes.map((l, i) => <li key={i}>{l}</li>)}</ul></>;
const RETENIR = {
  nomEster: carte(SvgNomEsterCarte, [
    <>Nom = <strong>alcanoate d’alkyle</strong> : la 1re partie est la chaîne du C=O (C=O compris), la 2e est le groupe alkyle lié à O.</>,
    <>Exemple : CH₃–CO–O–CH₂–CH₃ se lit « éthanoate d’éthyle » (2 C + 2 C).</>,
    <>Moyen : <strong>« on lit d’abord le côté du C=O »</strong>. Idée fausse : « on lit toujours de gauche à droite ». Vrai : CH₃–O–CO–CH₃ s’appelle aussi éthanoate de méthyle.</>]),
  classes: carte(SvgClassesAmineCarte, [
    <>Classe d’une amine = nombre de <strong>carbones liés à N</strong> : 1 primaire, 2 secondaire, 3 tertiaire.</>,
    <>Exemples : CH₃–NH₂ (primaire), CH₃–NH–CH₃ (secondaire), (CH₃)₃N (tertiaire).</>,
    <>Moyen : <strong>« on compte les carbones accrochés à N »</strong>. Idée fausse : « la classe, c’est le nombre de C de la molécule ». Vrai : seuls comptent les C liés à N.</>]),
  troisGroupes: carte(SvgTroisGroupesCarte, [
    <>Regarder le <strong>C=O</strong> : lié à un O lui-même lié à un C, c’est un ester ; lié à N, un amide ; sans C=O voisin, N seul : une amine.</>,
    <>Exemples : CH₃–CO–O–CH₃ (ester), CH₃–CO–NH₂ (amide), CH₃–CH₂–NH₂ (amine). Un acide carboxylique, CH₃–COOH, a un O–H à la place de l’O–C de l’ester.</>,
    <>Moyen : <strong>« C=O + O–C : ester ; C=O + N : amide ; N seul : amine »</strong>. Idée fausse : « une molécule avec de l’azote est une amine ». Vrai : un amide contient aussi N.</>]),
  halogeno: carte(SvgHalogenoCarte, [
    <>Un <strong>halogénoalcane</strong> est un alcane dont un H est remplacé par un halogène (Cl, Br) : liaison C–X. Nom = <strong>chloro</strong> ou <strong>bromo</strong> + nom de l’alcane, avec le numéro du carbone qui porte X.</>,
    <>Exemple : CH₃–CH₂–CH₂–CH₂–Br se nomme « 1-bromobutane » (le Br est sur le carbone n° 1).</>,
    <>Moyen : <strong>« on numérote la chaîne du côté qui donne le plus petit numéro à X »</strong>. Idée fausse : « on numérote toujours de gauche à droite ». Vrai : on choisit le sens de lecture qui donne le plus petit numéro.</>]),
  motif: carte(SvgMotifCarte, [
    <>Un polymère est une très longue chaîne où un <strong>même motif</strong> se répète. On l’écrit [motif]ₙ, entre crochets.</>,
    <>Exemple : le polypropylène s’écrit [–CH₂–CH(CH₃)–]ₙ.</>,
    <>Moyen : <strong>« crochets = un motif ; n = combien de fois »</strong>. Idée fausse : « n est le nombre d’atomes ». Vrai : n est le nombre de motifs.</>]),
  natSynth: carte(SvgNatSynthCarte, [
    <><strong>Polymères naturels</strong> (cellulose, amidon, protéines, ADN, caoutchouc naturel) et <strong>synthétiques</strong> (PE, PVC, PP, PS, nylon) sont tous faits de motifs répétés.</>,
    <>Exemples : cellulose du coton, protéines de la soie ; PVC des tuyaux, PE des sacs.</>,
    <>Moyen : <strong>« naturel : fabriqué par un être vivant ; synthétique : par l’industrie »</strong>. Idée fausse : « polymère = plastique ». Vrai : l’ADN et la cellulose sont des polymères.</>]),
};

export function SimulationPolymeres() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviM, noterM] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('famille');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ regles: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ fam: 'ester', nom: 'éthanoate de méthyle', aide: 'groupe', pol: 'pvc', nat: 'cellulose' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  const ETAPES = [
    { id: 'ester', titre: 'Un nouveau groupe : l’ester', focus: ['scene'],
      texte: <>Voici deux molécules : l’acide éthanoïque, connu de première, et l’éthanoate de méthyle, un <strong>ester</strong>. Le groupe caractéristique de chacune est entouré en pointillés. Dans les deux, un atome de carbone est lié à un oxygène par une double liaison (C=O) et à un autre oxygène par une liaison simple.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce qui distingue le groupe ester du groupe carboxyle ?', ...Q.ester,
        expl: 'Dans l’acide, l’oxygène simple porte un atome d’hydrogène (liaison O–H). Dans l’ester, ce H est remplacé par un groupe alkyle : l’oxygène est relié à un second carbone. Les deux ont un seul C=O, et aucun n’a d’azote.',
        indice: 'Regardez, dans chacun des deux cadres en pointillés, ce qui est accroché à l’atome d’oxygène relié par une simple liaison : un atome d’hydrogène ou un atome de carbone ?' } },
    { id: 'nomEster', titre: 'Nommer un ester', focus: ['scene', 'regles'],
      texte: <>Les règles de nomenclature sont fournies dans le cadre « Règles de nomenclature » : pas besoin de les apprendre, il faut les appliquer. Voici un autre ester, de formule semi-développée CH₃–CO–O–CH₂–CH₂–CH₃.</>,
      tache: { type: 'qcm', q: 'Quel est le nom de cet ester ?', ...Q.nomEster,
        expl: 'Du côté du C=O, la chaîne compte 2 carbones (CH₃–CO, carbone du C=O compris) : éthanoate. Le groupe lié à l’oxygène simple compte 3 carbones : propyle. Lire l’ester dans l’autre sens donnerait « propanoate d’éthyle » ; oublier le carbone du C=O donnerait « méthanoate de propyle » ; compter un carbone de trop côté C=O donnerait « propanoate de propyle ».',
        indice: 'L’oxygène simple sépare deux parties. Comptez les carbones de la partie qui contient le C=O (le C=O compte), puis ceux de l’autre partie.' } },
    { id: 'amine', titre: 'Les amines et leurs classes', focus: ['scene'], retenirTitre: 'À RETENIR : NOMMER UN ESTER', retenir: RETENIR.nomEster,
      texte: <>Une <strong>amine</strong> possède un atome d’azote lié à des atomes de carbone et d’hydrogène, sans C=O voisin. Selon le nombre de carbones liés à l’azote, l’amine est dite <strong>primaire</strong> (1 carbone), <strong>secondaire</strong> (2 carbones) ou <strong>tertiaire</strong> (3 carbones). Voici une amine, de formule semi-développée CH₃–CH₂–NH–CH₃.</>,
      tache: { type: 'qcm', q: 'Quelle est la classe de cette amine ?', ...Q.classe,
        expl: 'L’azote est lié à deux carbones : celui de CH₃– et celui de –CH₂–. La classe se compte avec les carbones liés à N (et non avec les H) : l’amine est secondaire.',
        indice: 'Comptez les atomes de carbone directement reliés à l’atome d’azote, sur le dessin ou sur la formule semi-développée.' } },
    { id: 'nomAmine', titre: 'Nommer une amine', focus: ['scene', 'regles'], retenirTitre: 'À RETENIR : LES CLASSES D’AMINES', retenir: RETENIR.classes,
      texte: <>Appliquez les règles de nomenclature des amines à la molécule de l’étape précédente, de formule semi-développée CH₃–CH₂–NH–CH₃.</>,
      tache: { type: 'qcm', q: 'Quel est son nom ?', ...Q.nomAmine,
        expl: 'La chaîne la plus longue liée à N est CH₃–CH₂– (2 carbones) : éthanamine. Le groupe CH₃– lié à N est un substituant : on ajoute « N-méthyl » devant, d’où N-méthyléthanamine. « N-éthylméthanamine » a pris la plus courte chaîne comme chaîne principale ; « N,N-diméthyléthanamine » compterait un second groupe méthyle sur N, ce qui est une amine tertiaire.',
        indice: 'Choisissez la chaîne carbonée la plus longue liée à N : elle donne la base du nom. L’autre groupe, lié à N, s’ajoute devant avec « N- ».' } },
    { id: 'amide', titre: 'Amide ou amine ?', focus: ['scene'],
      texte: <>Voici une nouvelle molécule, de formule semi-développée CH₃–CO–NH–CH₃. Son groupe caractéristique est entouré en pointillés. Comparez-le à ceux des deux familles précédentes (ester, amine).</>,
      tache: { type: 'qcm', q: 'À quelle famille appartient cette molécule ?', ...Q.amide,
        expl: 'Le groupe est –CO–N– : un C=O directement lié à l’azote, c’est un amide. Une amine n’a pas de C=O voisin de N ; un ester a un oxygène à la place de N ; un acide a un groupe OH sur le C=O et pas d’azote.',
        indice: 'Repérez le C=O dans le cadre en pointillés : quel atome lui est lié par une liaison simple, en dehors du carbone de la chaîne ?' } },
    { id: 'nomAmide', titre: 'Nommer un amide', focus: ['scene', 'regles'], retenirTitre: 'À RETENIR : ESTER, AMIDE OU AMINE ?', retenir: RETENIR.troisGroupes,
      texte: <>Nommez la molécule de l’étape précédente, de formule semi-développée CH₃–CO–NH–CH₃, avec les règles de nomenclature des amides.</>,
      tache: { type: 'qcm', q: 'Quel est son nom ?', ...Q.nomAmide,
        expl: 'La chaîne qui porte le C=O compte 2 carbones (CH₃–CO, carbone du C=O compris) : éthanamide. Le groupe CH₃– lié à N est un substituant : « N-méthyl » devant, d’où N-méthyléthanamide. La terminaison « amine » serait celle d’une amine ; « N-éthylméthanamide » aurait la chaîne de 2 C du côté de N ; « N,N-diméthyl » supposerait deux groupes méthyle sur N.',
        indice: 'Le carbone du C=O est le carbone n° 1 de la chaîne principale : comptez les carbones du côté du C=O. Le groupe CH₃– sur l’azote devient un préfixe N-.' } },
    { id: 'halogeno', titre: 'Les halogénoalcanes', focus: ['scene', 'regles'],
      texte: <>Un <strong>halogénoalcane</strong> est un alcane dont un atome d’hydrogène est remplacé par un atome d’halogène (chlore Cl, brome Br) : son groupe caractéristique est la liaison C–X. Voici une molécule de formule semi-développée CH₃–CHCl–CH₃. Appliquez les règles de nomenclature.</>,
      tache: { type: 'qcm', q: 'Quel est son nom ?', ...Q.halogeno,
        expl: 'La chaîne compte 3 carbones (propane) et le chlore est sur le carbone du milieu, le n° 2 quel que soit le sens de numérotation : 2-chloropropane. « 1-chloropropane » aurait Cl au bout de la chaîne ; « chloropropane » sans numéro ne distingue pas ces deux molécules ; « chloro-2-propane » écrit le préfixe et le numéro dans le mauvais ordre : le numéro se place avant le préfixe.',
        indice: 'Comptez les carbones de la chaîne, puis repérez le numéro du carbone qui porte Cl (le plus petit possible, quel que soit le sens de lecture).' } },
    { id: 'formule', titre: 'Du nom à la formule', focus: ['regles'], retenirTitre: 'À RETENIR : LES HALOGÉNOALCANES', retenir: RETENIR.halogeno,
      texte: <>On passe maintenant dans l’autre sens : à partir d’un nom, on retrouve la formule semi-développée, avec les mêmes règles de nomenclature.</>,
      tache: { type: 'qcm', q: 'Quelle est la formule semi-développée du butanoate de méthyle ?', ...Q.formule,
        expl: '« Butanoate » : 4 carbones du côté du C=O, C=O compris (CH₃–CH₂–CH₂–CO). « Méthyle » : un carbone lié à l’oxygène simple (–O–CH₃). On obtient CH₃–CH₂–CH₂–CO–O–CH₃. La deuxième formule a 2 C côté C=O et 4 C côté oxygène : c’est l’éthanoate de butyle ; la troisième a un carbone de trop (pentanoate) ; la quatrième est l’éthanoate de propyle, qui a la même formule brute mais un autre enchaînement.',
        indice: 'Écrivez d’abord la partie « butanoate » avec 4 carbones dont le C=O, puis l’oxygène simple, puis le groupe méthyle.' } },
    { id: 'motif', titre: 'Un polymère : le motif', focus: ['scene'],
      texte: <>Un <strong>polymère</strong> est une très longue chaîne où le même groupe d’atomes, le <strong>motif</strong>, se répète. Voici un segment de chaîne de poly(chlorure de vinyle), le PVC, de formule semi-développée –CH₂–CHCl–CH₂–CHCl–CH₂–CHCl– ; les traits aux extrémités montrent que la chaîne continue.</>,
      tache: { type: 'qcm', q: 'Quel est le motif qui se répète ?', ...Q.motif,
        expl: 'En suivant la chaîne, on lit CH₂, CHCl, CH₂, CHCl… : le plus petit groupe qui, répété, redonne toute la chaîne est –CH₂–CHCl–. Le groupe –CH₂–CHCl–CH₂– répété donnerait deux CH₂ de suite ; –CHCl– seul ou –CHCl–CHCl– ne reproduisent pas l’alternance du dessin.',
        indice: 'Cherchez le plus petit groupe d’atomes qui, répété bout à bout, redonne exactement la chaîne dessinée.' } },
    { id: 'nombre', titre: 'Le nombre de motifs n', focus: ['scene'], retenirTitre: 'À RETENIR : LE MOTIF D’UN POLYMÈRE', retenir: RETENIR.motif,
      texte: <>On écrit le polymère [–CH₂–CHCl–]ₙ : le motif entre crochets et <strong>n</strong>, le nombre de motifs. Une chaîne de PVC compte ici n = {nbm(500)} motifs ; on néglige les extrémités de la chaîne.</>,
      tache: { type: 'num', carnet: false, q: 'Combien d’atomes de carbone cette chaîne contient-elle ? (nombre entier)', unite: 'atomes', vrai: 1000, tol: 0, affiche: v => nbm(Math.round(v)),
        calcul: () => ['Le motif –CH₂–CHCl– contient 2 atomes de carbone (un dans CH₂, un dans CHCl).', 'La chaîne compte n = 500 motifs : 500 × 2 = 1 000 atomes de carbone.'],
        pieges: [[500, 'C’est le nombre de motifs. Chaque motif contient plusieurs atomes de carbone : multipliez par le nombre de C d’un motif.'], [1500, 'Le motif –CH₂–CHCl– ne contient pas 3 atomes de carbone : comptez-les sur la formule du motif.'], [250, 'Vous avez divisé par 2 : il faut multiplier le nombre de motifs par le nombre de C d’un motif.']],
        expl: 'Atomes de carbone = (C par motif) × n = 2 × 500 = 1 000.', indice: 'Comptez les atomes de carbone d’un seul motif, puis multipliez par le nombre de motifs.' } },
    { id: 'naturel', titre: 'Polymères naturels et synthétiques', focus: [],
      texte: <>Certains polymères sont fabriqués par l’industrie : ce sont les polymères <strong>synthétiques</strong>. D’autres sont produits par des êtres vivants : ce sont les polymères <strong>naturels</strong>.</>,
      tache: { type: 'qcm', q: 'Lequel de ces polymères est d’origine naturelle ?', ...Q.naturel,
        expl: 'La cellulose est produite par les plantes (bois, coton). Le polyéthylène, le polystyrène et le nylon sont fabriqués par l’industrie : ce sont des polymères synthétiques, utilisés pour les sacs, les pots et les textiles.',
        indice: 'Lequel de ces matériaux est fabriqué par une plante ou un animal plutôt qu’à l’usine ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [], retenirTitre: 'À RETENIR : POLYMÈRES NATURELS ET SYNTHÉTIQUES', retenir: RETENIR.natSynth,
      texte: <>Vous savez repérer un ester, une amine, un amide ou un halogénoalcane sur une formule, les nommer avec des règles fournies, retrouver une formule à partir d’un nom, puis identifier le motif d’un polymère et citer des polymères naturels et synthétiques. Passez à l’exploration (galerie de molécules et de polymères) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'famille') {
      const m = tire(M.MOLECULES.filter(x => M.NOUVELLES.includes(x.famille)));
      setDefi({ type, mol: m, phase: 1, fam: '', nom: '', options: melange([m.nom, ...M.nomsVoisins(m, 3)]), verifie: false, essais: 0 });
    } else {
      const p = tire(M.POLYMERES.filter(x => x.id !== 'pe'));
      const autres = M.POLYMERES.filter(x => x.id !== p.id).map(x => x.motif);
      setDefi({ type, pol: p, n: tire([200, 400, 500, 800, 1000, 2500, 5000]), phase: 1, motif: '', rep: '', options: melange([p.motif, ...autres]), verifie: false, essais: 0 });
    }
  };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const verifier = () => {
    if (defi.type === 'famille') {
      if (defi.phase === 1) { const ok = defi.fam === defi.mol.famille; setDefi(d => ({ ...d, verifie: true, ok, phase: ok ? 2 : 1, essais: ok ? d.essais : d.essais + 1, ok1: ok, nom: '' })); }
      else { const ok = defi.nom === defi.mol.nom; setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : d.essais + 1, fini: ok })); noterF(ok); }
    } else if (defi.phase === 1) { const ok = defi.motif === defi.pol.motif; setDefi(d => ({ ...d, verifie: true, ok, phase: ok ? 2 : 1, essais: ok ? d.essais : d.essais + 1, ok1: ok })); }
    else { const ok = lireNombre(defi.rep) === defi.n * defi.pol.nC; setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : d.essais + 1, fini: ok })); noterM(ok); }
  };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const FAM_CHOIX = [['ester', 'ester'], ['amine', 'amine'], ['amide', 'amide'], ['halogeno', 'halogénoalcane']];
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['famille', 'Famille et nom d’une molécule'], ['motif', 'Motif d’un polymère']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'famille' ? 'Défi : quelle est cette molécule ?' : 'Défi : quel est le motif de ce polymère ?'}</div>
      {defi.type === 'famille' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une molécule est tirée au hasard. <strong>Question 1</strong> : de quelle famille s’agit-il ?</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Famille
          <select value={defi.fam} onChange={e => setDefi(d => ({ ...d, fam: e.target.value, verifie: false }))} disabled={defi.phase === 2} style={{ ...menu, marginTop: 2 }}>
            <option value="">Choisir une famille…</option>{FAM_CHOIX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {defi.phase === 1 && <IndiceDefi cache={false}>Cherchez les atomes autres que C et H (O, N, Cl, Br) et regardez à quoi ils sont liés : y a-t-il un C=O ? l’oxygène ou l’azote est-il lié à lui ? Aucun C=O et un azote : pensez à la classe des amines.</IndiceDefi>}
        {defi.phase === 2 && <>
          <div style={{ ...lbl, margin: '8px 0' }}><strong>Question 2</strong> : quel est son nom ? (règles de nomenclature dans le cadre)</div>
          <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Nom
            <select value={defi.nom} onChange={e => setDefi(d => ({ ...d, nom: e.target.value, verifie: false }))} style={{ ...menu, marginTop: 2 }}>
              <option value="">Choisir un nom…</option>{defi.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          {!defi.fini && <IndiceDefi cache={false}>Comptez les carbones de chaque partie de la chaîne (le C=O compte pour un ester ou un amide), repérez la position de l’halogène ou le groupe fixé sur N, puis appliquez la règle de la famille.</IndiceDefi>}
        </>}
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un segment de chaîne de polymère est dessiné. <strong>Question 1</strong> : quel est le motif qui se répète ?</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Motif
          <select value={defi.motif} onChange={e => setDefi(d => ({ ...d, motif: e.target.value, verifie: false }))} disabled={defi.phase === 2} style={{ ...menu, marginTop: 2 }}>
            <option value="">Choisir un motif…</option>{defi.options.map(o => <option key={o} value={o}>{`–${o}–`}</option>)}
          </select>
        </label>
        {defi.phase === 1 && <IndiceDefi cache={false}>Cherchez le plus petit groupe d’atomes qui, répété bout à bout, redonne tout le segment : il contient deux carbones de la chaîne et ce qu’ils portent.</IndiceDefi>}
        {defi.phase === 2 && <>
          <div style={{ ...lbl, margin: '8px 0' }}><strong>Question 2</strong> : une chaîne de ce polymère compte <strong>n = {nbm(defi.n)}</strong> motifs (on néglige les extrémités de la chaîne). Combien d’atomes de carbone contient-elle au total ? (nombre entier)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 14 }}>
            <input value={defi.rep} aria-label="Nombre d’atomes de carbone" inputMode="numeric" onKeyDown={e => e.key === 'Enter' && document.getElementById('po-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false }))}
              style={{ width: 130, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>atomes de carbone</span>
          </div>
          {!defi.fini && <IndiceDefi cache={false}>Comptez les atomes de carbone d’un seul motif, y compris ceux du groupe porté par la chaîne, puis multipliez par n.</IndiceDefi>}
        </>}
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {!defi.fini && <button id="po-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>}
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.type === 'famille'
          ? (defi.phase === 2 && !defi.fini ? 'Bonne famille ; passez à la question 2.'
            : defi.fini ? `${defi.mol.nom} : ${M.FAMILLES[defi.mol.famille]}, formule brute ${defi.mol.brute}.`
              : defi.essais >= 2 ? `Réponse : ${M.FAMILLES[defi.mol.famille]}. Regardez le groupe entouré sur le dessin d’un ester, d’un amide, d’une amine ou d’un halogénoalcane.` : 'Revoyez le groupe caractéristique et vérifiez à nouveau (l’indice peut vous aider).')
          : (defi.phase === 2 && !defi.fini ? 'Bon motif ; passez à la question 2.'
            : defi.fini ? `Le motif a ${defi.pol.nC} atomes de carbone : ${defi.pol.nC} × ${nbm(defi.n)} = ${nbm(defi.pol.nC * defi.n)} atomes de carbone.`
              : defi.essais >= 2 ? `Réponse : le motif ${`–${defi.pol.motif}–`}.` : 'Corrigez et vérifiez à nouveau (l’indice peut vous aider).')}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Espèces simples</strong> : chaînes carbonées linéaires saturées (un seul groupe caractéristique), de 1 à 6 carbones. Le noyau benzénique n’apparaît que dans le motif du polystyrène.</li>
      <li><strong>Formule topologique</strong> : chaque sommet ou extrémité de la ligne brisée est un atome de carbone ; les atomes d’hydrogène portés par les carbones ne sont pas écrits (un carbone fait toujours 4 liaisons) ; les atomes O, N, Cl, Br sont écrits avec leurs H. Le dessin est plan, en zigzag : il ne représente ni la géométrie dans l’espace ni la stéréochimie (non traitée ici).</li>
      <li><strong>Règles de nomenclature fournies</strong> : elles sont simplifiées (chaînes linéaires, groupes alkyle de 1 à 4 carbones, substituants identiques sur N) et ne sont pas à mémoriser. Les cas à plusieurs substituants différents (classement alphabétique) ne sont pas traités.</li>
      <li><strong>Notation</strong> : R et R′ désignent des groupes alkyle ; –COO– se lit C(=O)–O ; la lettre n est un nombre entier (nombre de motifs), distinct d’un nombre d’atomes.</li>
      <li><strong>Polymère idéalisé</strong> : chaîne régulière, tous les motifs identiques, extrémités ignorées, n très grand. Dans un échantillon réel, les chaînes ont des longueurs différentes : n est une valeur moyenne.</li>
      <li><strong>Écriture du motif</strong> : on peut couper la chaîne où l’on veut (–CH₂–CHCl– ou –CHCl–CH₂– décrivent la même chaîne) ; la simulation utilise l’écriture usuelle [–CH₂–CHX–]ₙ, avec le groupe –CH₂– en premier.</li>
      <li><strong>Valeurs</strong> : les masses molaires atomiques sont arrondies (C : 12,0 ; H : 1,0 ; Cl : 35,5 g·mol⁻¹) ; ils ne servent qu’aux questions « pour aller plus loin » (masse molaire d’un motif ou d’une chaîne), qui ne font pas partie des capacités du programme ; les usages des polymères sont des exemples courants, non exhaustifs.</li>
      <li><strong>Hors périmètre</strong> : mécanismes réactionnels, synthèse des esters ou des polymères, isomérie de constitution (autre simulation) et stéréoisomérie.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène du parcours ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const MOL_GUIDE = { 1: 'éthanoate de propyle', 2: 'N-méthyléthanamine', 3: 'N-méthyléthanamine', 4: 'N-méthyléthanamide', 5: 'N-méthyléthanamide', 6: '2-chloropropane' };
  const sceneGuide = (() => {
    if (!enGuide) return null;
    if (idx === 0) return (<>
      {[mol('acide éthanoïque'), mol('éthanoate de méthyle')].map(m => <div key={m.nom} style={{ marginBottom: 6 }}><SvgMolecule mol={m} montrer="groupe" maxWidth={400}/><Legende m={m} nom/></div>)}</>);
    if (MOL_GUIDE[idx]) { const m = mol(MOL_GUIDE[idx]); return <><SvgMolecule mol={m} montrer="groupe" maxWidth={440}/><Legende m={m}/></>; }
    if (idx === 8 || idx === 9) return (<>
      <SvgPolymere id="pvc" crochets={idx === 9}/>
      <div style={{ textAlign: 'center', fontSize: 14, color: KIT.txt, marginTop: 2 }}>{idx === 8 ? <>Formule semi-développée : <strong>–CH₂–CHCl–CH₂–CHCl–CH₂–CHCl–</strong></> : <>Écriture avec le motif : <strong>[–CH₂–CHCl–]ₙ</strong></>}</div></>);
    return null;
  })();
  const reglesGuide = enGuide && (() => {
    const c = [];
    if (idx >= 1) c.push('ester'); if (idx >= 3) c.push('amine'); if (idx >= 5) c.push('amide'); if (idx >= 6) c.push('halogeno');
    return c;
  })();
  const boxScene = enGuide && sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;
  const boxRegles = enGuide && reglesGuide.length > 0 && idx <= 7 && <div style={cadre('regles')}><PanneauRegles cles={reglesGuide}/></div>;

  // ---------- scène du défi ----------
  const dd = enDefi && defi ? defi : null;
  const sceneDefi = dd && (dd.type === 'famille'
    ? <div style={styleBoite}><div style={aide}>Molécule tirée au hasard : formule topologique.</div><SvgMolecule mol={dd.mol} montrer="rien" maxWidth={440}/></div>
    : <div style={styleBoite}><div style={aide}>Segment de la chaîne d’un polymère (les traits aux extrémités montrent que la chaîne continue).</div><SvgPolymere id={dd.pol.id} maxWidth={440}/></div>);

  // ---------- exploration ----------
  const FAM_EX = [['ester', 'Esters'], ['amine', 'Amines'], ['amide', 'Amides'], ['halogeno', 'Halogénoalcanes'], ['polsynth', 'Polymères synthétiques'], ['polnat', 'Polymères naturels']];
  const estMol = ['ester', 'amine', 'amide', 'halogeno'].includes(ex.fam);
  const listeMol = estMol ? M.duFamille(ex.fam) : [];
  const m = estMol ? (listeMol.find(x => x.nom === ex.nom) || listeMol[0]) : null;
  const pol = ex.fam === 'polsynth' ? M.polParId(ex.pol) : null;
  const nat = ex.fam === 'polnat' ? M.NATURELS.find(x => x.nom === ex.nat) : null;
  const choisirFam = f => {
    if (['ester', 'amine', 'amide', 'halogeno'].includes(f)) setEx(s => ({ ...s, fam: f, nom: M.duFamille(f)[0].nom, aide: s.aide === 'motif' ? 'groupe' : s.aide }));
    else setEx(s => ({ ...s, fam: f, aide: f === 'polsynth' ? 'motif' : s.aide }));
  };
  const sceneEx = (
    <div style={styleBoite}>
      <div style={aide}>{estMol ? 'Formule topologique de la molécule choisie ; les atomes d’hydrogène portés par les carbones sont implicites.' : ex.fam === 'polsynth' ? 'Segment de chaîne : le motif répété est encadré par des crochets, n est le nombre de motifs.' : 'Un polymère naturel est lui aussi une chaîne de motifs répétés.'}</div>
      {estMol && m && <><SvgMolecule mol={m} montrer={ex.aide === 'rien' ? 'rien' : ex.aide === 'nomme' ? 'nomme' : 'groupe'} maxWidth={460}/><Legende m={m}/>{m.nom === '2-chlorobutane' && <div style={{ ...aide, marginTop: 6 }}>Remarque : le carbone n° 2 est asymétrique (4 groupes différents). Deux molécules en miroir, les énantiomères, portent ici le même nom : la stéréochimie n’est pas traitée dans cette simulation.</div>}</>}
      {pol && <><SvgPolymere id={pol.id} crochets={ex.aide !== 'rien'} maxWidth={460}/><div style={{ textAlign: 'center', fontSize: 14, color: KIT.txt }}>{ex.aide !== 'rien' ? <>Écriture : <strong>[–{pol.motif}–]ₙ</strong></> : <>Chaîne : <strong>–{pol.motif}–{pol.motif}–{pol.motif}–</strong></>}</div></>}
      {nat && <div style={{ fontSize: 15, color: KIT.txt, lineHeight: 1.6 }}><strong>{nat.nom}</strong> : longue chaîne formée par la répétition de {nat.motif}. Usage ou rôle : {nat.usage}.</div>}
    </div>);
  const mesuresEx = (
    <div style={styleBoite}>
      <div style={titreCarte}>Fiche de l’espèce</div>
      {m && <>
        <LigneMesure nom="Nom" valeur={m.nom}/>
        <LigneMesure nom="Famille" valeur={`${M.FAMILLES[m.famille]}${m.famille === 'amine' ? ` (${M.classeAmine(m, M.groupes(m)[0].atomes[0])})` : ''}`} couleur="#b45309"/>
        <LigneMesure nom="Groupe caractéristique" valeur={M.GROUPE_ECRIT[m.famille]}/>
        <LigneMesure nom="Formule brute" valeur={m.brute}/>
        <LigneMesure nom="Formule semi-développée" valeur={m.sd}/>
        <LigneMesure nom="Atomes de carbone" valeur={String(M.nbCarbones(m))}/>
      </>}
      {pol && <>
        <LigneMesure nom="Nom" valeur={`${pol.nom} (${pol.abr})`}/>
        <LigneMesure nom="Motif" valeur={`[–${pol.motif}–]ₙ`} couleur="#b45309"/>
        <LigneMesure nom="Formule brute du motif" valeur={pol.brute}/>
        <LigneMesure nom="Atomes de carbone par motif" valeur={String(pol.nC)}/>
        <LigneMesure nom="Origine" valeur={pol.origine}/>
        <div style={{ ...aide, marginTop: 6 }}>Usages courants : {pol.usages.join(', ')}.</div>
      </>}
      {nat && <>
        <LigneMesure nom="Nom" valeur={nat.nom}/>
        <LigneMesure nom="Unités répétées" valeur={nat.motif.replace(/^des /, '')}/>
        <LigneMesure nom="Origine" valeur="naturelle"/>
        <div style={{ ...aide, marginTop: 6 }}>Usage ou rôle : {nat.usage}.</div>
      </>}
    </div>);
  const reglagesEx = (
    <div style={styleBoite}>
      <div style={titreCarte}>Choisir une espèce</div>
      <div style={aide}>Choisissez une famille, puis une espèce : le dessin et la fiche se mettent à jour.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Famille
        <select value={ex.fam} onChange={e => choisirFam(e.target.value)} style={{ ...menu, marginTop: 2 }}>{FAM_EX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      {estMol && <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Espèce
        <select value={m ? m.nom : ''} onChange={e => setEx(s => ({ ...s, nom: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{listeMol.map(x => <option key={x.nom} value={x.nom}>{x.nom}</option>)}</select>
      </label>}
      {pol !== null && <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Polymère
        <select value={ex.pol} onChange={e => setEx(s => ({ ...s, pol: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.POLYMERES.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select>
      </label>}
      {ex.fam === 'polnat' && <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Polymère naturel
        <select value={ex.nat} onChange={e => setEx(s => ({ ...s, nat: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.NATURELS.map(x => <option key={x.nom} value={x.nom}>{x.nom}</option>)}</select>
      </label>}
      {(estMol || pol) && <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>{estMol ? 'Aide à la lecture' : 'Affichage du motif'}
        <select value={ex.aide} onChange={e => setEx(s => ({ ...s, aide: e.target.value }))} style={{ ...menu, marginTop: 2 }}>
          {estMol ? <><option value="rien">Dessin seul</option><option value="groupe">Groupe caractéristique entouré</option><option value="nomme">Groupe entouré et nommé</option></>
            : <><option value="rien">Chaîne seule</option><option value="motif">Motif encadré par des crochets</option></>}
        </select>
      </label>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Parmi les esters, comparez « éthanoate de méthyle » et « méthanoate d’éthyle » : même formule brute, mais le C=O n’est pas du même côté de l’oxygène simple. Que change la nomenclature ?</li>
        <li>Dans les amines, comparez l’éthanamine, la N-méthylméthanamine et la propan-2-amine : quelle est la classe de chacune ? Leur formule brute ?</li>
        <li>Comparez la N-méthyléthanamine (amine) et le N-méthyléthanamide : quel atome change la famille ?</li>
        <li>Pour un halogénoalcane, comparez le 1-chloropropane et le 2-chloropropane : qu’est-ce qui change dans le nom ? dans le dessin ?</li>
        <li>Passez aux polymères : combien d’atomes de carbone compte le motif du polypropylène ? du polystyrène ?</li>
      </ul>)}
    </Section>);
  const regles = (
    <Section titre="Règles de nomenclature (fournies)" ouvert={ouv.regles} onBascule={() => setOuv(o => ({ ...o, regles: !o.regles }))}>
      <PanneauRegles cles={['ester', 'amine', 'amide', 'halogeno']} sansTitre/>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Ester : –CO–O– ; amide : –CO–N ; amine : N sans C=O voisin (classe = nombre de C liés à N) ; halogénoalcane : liaison C–X</li>
          <li>Ester : « alcanoate d’alkyle » (le C=O compte dans la première partie)</li>
          <li>Amine et amide : alcane sans « e » + amine ou amide ; groupes sur N : préfixe N-</li>
          <li>Halogénoalcane : préfixe chloro ou bromo, numéro dès 3 C</li>
          <li>Polymère : motif répété n fois, écrit [motif]ₙ ; n est le nombre de motifs</li>
          <li>Polymères naturels : cellulose, amidon, protéines, ADN, caoutchouc naturel ; synthétiques : PE, PVC, PP, PS, nylon</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .po-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .po-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .po-l1.cote > * { min-width: 0; }
        .po-col { display: flex; flex-direction: column; gap: 12px; }
        .po-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .po-l1.cote > .po-carte { grid-column: 2; grid-row: 1 / span 4; } .po-l1.cote > .po-scene, .po-l1.cote > .po-regles, .po-l1.cote > .po-hypo { grid-column: 1; }
          .po-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .po-ex > * { grid-column: 1; } .po-ex > .po-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .po-l1.cote { grid-template-columns: minmax(0, 1fr); } .po-scene { order: 1; } .po-carte { order: 2; } .po-regles { order: 3; } .po-hypo { order: 4; } }
        @media (prefers-reduced-motion: no-preference) { .po-in { animation: po-fondu 0.35s ease-out; } @keyframes po-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Esters, amines, amides, halogénoalcanes et polymères</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Repérer le <strong>groupe caractéristique</strong> d’une molécule, la nommer avec des règles fournies, puis reconnaître le <strong>motif</strong> d’un polymère.</div>
      {!enExplore && <div className="po-l1 cote">
        {enGuide ? <div className="po-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="po-carte">{defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'famille' ? suiviF : suiviM}/></div>}</div> : null}
        {enGuide && boxScene && <div className="po-in po-scene">{boxScene}</div>}
        {enDefi && sceneDefi && <div className="po-in po-scene">{sceneDefi}</div>}
        {enGuide && boxRegles && <div className="po-in po-regles">{boxRegles}</div>}
        {enDefi && defi && defi.type === 'famille' && <div className="po-in po-regles"><PanneauRegles cles={['ester', 'amine', 'amide', 'halogeno']}/></div>}
        {enDefi && <div className="po-hypo">{panneauHypo}</div>}
      </div>}
      {enExplore && <div className="po-ex">
        <div>{sceneEx}</div>
        <div className="po-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{regles}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
