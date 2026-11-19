import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, IndiceDefi, indicesProfond } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./topoModele";
import { QCM_PARCOURS as Q } from "./topoQcm";
import { FormuleTopo, Planche, SvgLireCarte, SvgSquelettesCarte, SvgNomCarte, SvgIsomeresCarte, SvgMemeCarte, SvgTypesCarte } from "./topoSchemas";

const SIM_ID = 172, CLE_GUIDE = 'topo-tg-guide-v1';
declarerDefis(SIM_ID, [['tous', 'Trouver tous les isomères d’une formule brute'], ['relation', 'Dessiner un isomère de chaîne ou de position']]);

// ====================================================
// SIM 172 — FORMULES TOPOLOGIQUES ET ISOMÉRIE DE CONSTITUTION
//  (TG spé PC, « Constitution et transformations de la matière », partie « Élaborer des stratégies en synthèse organique »).
//  Capacités visées (jamais affichées à l'élève) : exploiter des règles de nomenclature fournies pour nommer une espèce ou représenter l'entité associée ;
//  représenter des formules topologiques d'isomères de constitution à partir d'une formule brute ou semi-développée ; squelettes saturés, insaturés, cycliques.
//  Hors périmètre : stéréoisomérie, familles esters/amines/amides/halogénoalcanes et polymères (sim 173).
//  Modèle de calcul : topoModele.js (graphe de la molécule, formule brute, semi-développée, nom, forme canonique, disposition du dessin).
// ====================================================

const IDS = ['sommets', 'hydrogenes', 'semi', 'cycle', 'alcool', 'nom', 'construire', 'isomeres', 'meme', 'c4h10', 'c4h8', 'types', 'bilan'];
const BLEU = '#0f766e';
const NB = ' ';
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

const g = M.mol;
const CIBLE_CONSTRUIRE = g('CC(C)C=C');                 // 3-méthylbut-1-ène
const MENU = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };

// ---------- formules (MathML) ----------
const Cn = <msub><mi>C</mi><mi>n</mi></msub>;
const FAlcane = <>
  <Formule><mtext>chaîne saturée :</mtext><mspace width="0.5em"/>{Cn}<msub><mi>H</mi><mrow><mn>2</mn><mi>n</mi><mo>+</mo><mn>2</mn></mrow></msub></Formule>
  <Formule><mtext>une seule C=C ou un seul cycle :</mtext><mspace width="0.5em"/>{Cn}<msub><mi>H</mi><mrow><mn>2</mn><mi>n</mi></mrow></msub></Formule></>;

// ---------- résumé d'un descripteur (pour les sections repliées) ----------
const resume = d => (d.type === 'cy'
  ? `Cycle de ${d.n} C${d.sub === 'methyl' ? ' · un méthyle' : d.sub === 'oh' ? ' · un –OH' : ''}`
  : `Chaîne de ${d.n} C${d.db ? ` · C=C entre C${d.db} et C${d.db + 1}` : ''}${d.oh ? ` · –OH sur C${d.oh}` : ''}${d.m1 || d.m2 ? ` · ${(d.m1 ? 1 : 0) + (d.m2 ? 1 : 0)} méthyle${d.m1 && d.m2 ? 's' : ''}` : ''}`);

// ---------- constructeur : menus déroulants qui construisent la molécule ----------
function Constructeur({ d, setD, replie = false, ouvert = false, onBascule = () => {} }) {
  const maj = f => setD(x => {
    const y = { ...x, ...f };
    if (y.type === 'ch') {
      if (y.db > y.n - 1) y.db = 0;
      if (y.oh > y.n) y.oh = 0;
      if (y.m1 > y.n) y.m1 = 0;
      if (y.m2 > y.n) y.m2 = 0;
    } else if (y.n < 3) y.n = 3;
    return y;
  });
  const lab = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8, fontWeight: 600 };
  const nums = Array.from({ length: d.n }, (_, i) => i + 1);
  const fin = (
    <>
      {d.type === 'ch' ? <>
        <label style={lab}>Double liaison C=C
          <select value={d.db} onChange={e => maj({ db: +e.target.value })} style={{ ...MENU, marginTop: 2 }}>
            <option value={0}>aucune</option>{nums.slice(0, -1).map(k => <option key={k} value={k}>entre C{k} et C{k + 1}</option>)}
          </select></label>
        <label style={lab}>Groupe hydroxyle –OH
          <select value={d.oh} onChange={e => maj({ oh: +e.target.value })} style={{ ...MENU, marginTop: 2 }}>
            <option value={0}>aucun</option>{nums.map(k => <option key={k} value={k}>sur C{k}</option>)}
          </select></label>
        <label style={lab}>Méthyle n° 1
          <select value={d.m1} onChange={e => maj({ m1: +e.target.value })} style={{ ...MENU, marginTop: 2 }}>
            <option value={0}>aucune</option>{nums.map(k => <option key={k} value={k}>sur C{k}</option>)}
          </select></label>
        <label style={lab}>Méthyle n° 2
          <select value={d.m2} onChange={e => maj({ m2: +e.target.value })} style={{ ...MENU, marginTop: 2 }}>
            <option value={0}>aucune</option>{nums.map(k => <option key={k} value={k}>sur C{k}</option>)}
          </select></label>
      </> : <label style={lab}>Substituant porté par le cycle
        <select value={d.sub} onChange={e => maj({ sub: e.target.value })} style={{ ...MENU, marginTop: 2 }}>
          <option value="aucun">aucun</option><option value="methyl">un groupe méthyle –CH₃</option><option value="oh">un groupe hydroxyle –OH</option>
        </select></label>}
    </>);
  return (
    <div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Choisissez le squelette puis les groupes (un méthyle est une ramification –CH₃) : la molécule se dessine seule. Les numéros gris donnent la position des carbones.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0 10px' }}>
        <label style={lab}>Squelette carboné
          <select value={d.type} onChange={e => maj({ type: e.target.value, n: e.target.value === 'cy' ? Math.max(3, d.n) : d.n })} style={{ ...MENU, marginTop: 2 }}>
            <option value="ch">chaîne de carbones</option><option value="cy">cycle de carbones</option>
          </select></label>
        <label style={lab}>{d.type === 'ch' ? 'Nombre de carbones de la chaîne' : 'Nombre de carbones du cycle'}
          <select value={d.n} onChange={e => maj({ n: +e.target.value })} style={{ ...MENU, marginTop: 2 }}>
            {(d.type === 'ch' ? [2, 3, 4, 5] : [3, 4, 5]).map(k => <option key={k} value={k}>{k} carbones</option>)}
          </select></label>
      </div>
      {replie ? <Section titre={`Groupes et ramifications : ${resume(d)}`} ouvert={ouvert} onBascule={onBascule}>{fin}</Section>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0 10px' }}>{fin}</div>}
      <button onClick={() => setD({ ...M.DESC_DEFAUT })} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir le réglage de départ</button>
    </div>);
}

// ---------- affichage d'une structure construite : dessin, formule brute, semi-développée (et nom) ----------
function Structure({ d, avecNom = false, ecritures = true }) {
  const { g: gr, erreur } = M.construire(d);
  if (!gr) return (
    <div role="status" aria-live="polite" style={{ padding: '10px 12px', borderRadius: 10, background: '#fffbeb', border: '1.5px solid #b45309', color: '#7c2d12', fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
      <Pic n="ko"/>{erreur.msg}</div>);
  const sd = M.semiDev(gr);
  return (
    <div>
      <FormuleTopo m={gr} opts={d.type === 'ch' ? { racine: 0 } : {}} numeros={d.type === 'ch' ? d.n : 0} maxW={360}/>
      {ecritures && <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7, color: KIT.txt, textAlign: 'center' }}>
        <div>Formule brute : <strong>{M.bruteTexte(gr)}</strong></div>
        <div>Formule semi-développée : <strong style={{ whiteSpace: 'nowrap' }}>{sd.texte}</strong>{sd.cycle && <span style={{ fontSize: 13, color: KIT.txt2 }}> (les deux extrémités sont liées : cycle)</span>}</div>
        {avecNom && <div>Nom : <strong>{M.nom(gr)}</strong></div>}
      </div>}
    </div>);
}

// ---------- recherche d'isomères : liste des structures trouvées ----------
function ListeTrouves({ liste, avecNom = true }) {
  if (!liste.length) return <div style={{ fontSize: 14, color: KIT.txt2 }}>Votre liste est vide pour le moment.</div>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {liste.map((it, k) => (
        <div key={it.cle} style={{ background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, padding: 6, width: 124, boxSizing: 'border-box', textAlign: 'center' }}>
          <FormuleTopo m={it.g} L={26} maxW={110} aria={`Isomère n° ${k + 1} de la liste : ${M.nom(it.g)}`}/>
          {avecNom && <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt, lineHeight: 1.3 }}>{M.nom(it.g)}</div>}
        </div>))}
    </div>);
}

// ajoute la structure à la liste (retourne la nouvelle liste et le message)
function ajouter(d, liste, cle) {
  const { g: gr, erreur } = M.construire(d);
  if (!gr) return { liste, msg: { ok: false, t: erreur.msg } };
  const c = M.canon(gr), cible = M.cleVersTexte(cle);
  if (M.cleBrute(gr) !== cle) return { liste, msg: { ok: false, t: `Ce n’est pas un isomère de ${cible} : cette structure a pour formule brute ${M.bruteTexte(gr)}. Un isomère garde exactement les mêmes atomes (même formule brute).` } };
  const deja = liste.find(x => x.cle === c);
  if (deja) return { liste, msg: { ok: false, t: `Déjà dans votre liste : c’est la même molécule que « ${M.nom(deja.g)} », peut-être dessinée autrement.` } };
  return { liste: [...liste, { cle: c, g: gr }], msg: { ok: true, t: `Nouvel isomère de ${cible} ajouté : ${M.nom(gr)}.` } };
}

export function SimulationFormulesTopologiques() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviT, noterT] = useCompteurDefi(), [suiviR, noterR] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('tous');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ groupes: false, essayer: false, retenir: false, regles: false, defiGroupes: true });
  const [dG, setDG] = useState({ ...M.DESC_DEFAUT }), [dE, setDE] = useState({ ...M.DESC_DEFAUT, n: 4, db: 1 }), [dD, setDD] = useState({ ...M.DESC_DEFAUT });
  const [trouvesG, setTrouvesG] = useState({}), [msgG, setMsgG] = useState(null);
  const [trouvesE, setTrouvesE] = useState([]), [msgE, setMsgE] = useState(null), [formE, setFormE] = useState('');
  const [trouvesD, setTrouvesD] = useState([]), [msgD, setMsgD] = useState(null);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;

  // ---------- étapes du parcours ----------
  const gTrouve = (k) => trouvesG[k] || [];
  const construit = M.construire(dG).g;
  const okConstruire = !!construit && M.memeMolecule(construit, CIBLE_CONSTRUIRE);
  const rechercheEtape = id => { const cle = id === 'c4h10' ? 'C4H10' : 'C4H8'; return { cle, liste: gTrouve(id), n: M.nbIsomeres(cle) }; };
  const r10 = rechercheEtape('c4h10'), r11 = rechercheEtape('c4h8');
  const ETAPES = [
    { id: 'sommets', titre: 'Lire une formule topologique', focus: ['scene'],
      texte: <>Voici une molécule dessinée en <strong>formule topologique</strong> : on ne dessine que le squelette carboné, une ligne brisée. Convention : chaque <strong>extrémité</strong> et chaque <strong>sommet</strong> de la ligne est un atome de <strong>carbone</strong> ; les atomes d’hydrogène liés aux carbones ne sont pas écrits.</>,
      tache: { type: 'num', q: 'Combien d’atomes de carbone compte cette molécule ?', unite: 'atomes de carbone', vrai: 5, tol: 0, carnet: false, affiche: v => String(v),
        calcul: () => ['On compte les bouts de ligne et les sommets : 4 carbones sur la chaîne la plus longue, plus 1 carbone dans la ramification.', 'Au total : 5 atomes de carbone.'],
        pieges: [[4, 'Vous avez oublié l’atome de carbone au bout de la ramification : il compte aussi.']],
        expl: 'La chaîne la plus longue compte 4 carbones (3 traits) et la ramification en ajoute un : 5 atomes de carbone.', indice: 'Comptez chaque extrémité et chaque coin de la ligne brisée, sans oublier le petit bout qui part de la chaîne.' } },
    { id: 'hydrogenes', titre: 'Retrouver les hydrogènes non dessinés', focus: ['scene'],
      texte: <>On retrouve les hydrogènes grâce à une règle : un atome de carbone forme <strong>toujours 4 liaisons</strong> (un trait double compte pour 2). Les liaisons qui manquent à un carbone sont des liaisons C–H. Cette molécule compte 6 atomes de carbone.</>,
      tache: { type: 'num', q: 'Combien d’atomes d’hydrogène compte cette molécule ?', unite: 'atomes d’hydrogène', vrai: 14, tol: 0, carnet: false, affiche: v => String(v),
        calcul: () => ['Les 4 carbones des extrémités ne portent qu’un trait : chacun a 3 liaisons C–H, soit 4 × 3 = 12 H.', 'Les 2 carbones centraux portent 3 traits : chacun a 1 liaison C–H, soit 2 H.', 'Au total : 12 + 2 = 14 atomes d’hydrogène.'],
        pieges: [[12, 'Vous avez oublié les hydrogènes des deux carbones centraux : ils portent chacun un H.'], [10, 'Vous avez compté les liaisons C–C : il faut compter les liaisons qui manquent à chaque carbone pour atteindre 4.'], [24, 'Vous avez compté toutes les liaisons des 6 carbones (6 × 4) : il faut retirer celles qui relient deux carbones.']],
        expl: '4 carbones en bout de chaîne (CH₃) : 12 H ; 2 carbones centraux (CH) : 2 H ; soit 14 H.', indice: 'Pour chaque carbone : 4 moins le nombre de traits qui en partent. Additionnez ensuite sur les 6 carbones.' } },
    { id: 'semi', titre: 'De la formule topologique à la formule semi-développée', focus: ['scene'],
      retenirTitre: 'À RETENIR : LIRE UNE FORMULE TOPOLOGIQUE',
      retenir: <>
        <SvgLireCarte/>
        <ul style={ULS}>
          <li>Chaque <strong>sommet</strong> et chaque <strong>bout de trait</strong> est un atome de <strong>carbone</strong> ; les H ne sont <strong>pas dessinés</strong>.</li>
          <li>On les retrouve : un carbone fait <strong>toujours 4 liaisons</strong> (trait double = 2). Ce qui manque, ce sont des H.</li>
          <li>Moyen de s’en souvenir : <strong>« 4 liaisons par C : le reste, ce sont des H »</strong>. Idée fausse : « un bout de trait est un atome d’hydrogène ». Vrai : c’est un carbone (CH₃ s’il est en bout de chaîne).</li>
        </ul></>,
      texte: <>Une <strong>formule semi-développée</strong> écrit l’enchaînement des atomes de carbone avec les hydrogènes liés à chacun (CH₃, CH₂, CH…). Dans une formule topologique, un <strong>trait double</strong> entre deux carbones est une double liaison C=C. Rappel : chaque carbone fait 4 liaisons.</>,
      tache: { type: 'qcm', q: 'Quelle est la formule semi-développée de cette molécule ?', ...Q.semi,
        expl: 'Le dessin compte 5 carbones alignés, avec le trait double entre le premier (CH₂=) et le deuxième (=CH–), soit CH₂=CH–CH₂–CH₂–CH₃. Dans CH₃–CH=CH–CH₂–CH₃ la double liaison est entre C2 et C3 ; CH₂=CH–CH₂–CH₃ n’a que 4 carbones ; CH₂=C(CH₃)–CH₂–CH₃ ajoute une ramification que le dessin n’a pas.',
        indice: 'Numérotez les carbones depuis le bout où se trouve le trait double : entre quels carbones est-il ? Complétez chaque carbone à 4 liaisons.' } },
    { id: 'cycle', titre: 'Quand la chaîne se referme : le cycle', focus: ['scene'],
      texte: <>Quand la ligne se referme sur elle-même, la chaîne carbonée forme un <strong>cycle</strong> : il n’y a plus d’extrémité. Ce cycle compte 5 atomes de carbone, chacun lié à deux autres carbones du cycle.</>,
      tache: { type: 'qcm', q: 'Quelle est la formule brute de cette molécule ?', ...Q.cycle,
        expl: 'Chaque carbone du cycle a 2 liaisons C–C, il lui en manque 2 : 2 H par carbone, soit 5 × 2 = 10 H. C₅H₁₂ serait la chaîne saturée non cyclique (le cycle retire 2 H) ; C₅H₈ compterait un retrait de H en trop ; C₅H₅ oublie qu’il manque 2 liaisons à chaque carbone.',
        indice: 'Combien de liaisons C–C part-il de chaque carbone du cycle ? Combien de liaisons C–H faut-il alors pour arriver à 4 ?' } },
    { id: 'alcool', titre: 'Le groupe hydroxyle : un atome qui s’écrit', focus: ['scene'],
      retenirTitre: 'À RETENIR : TROIS SQUELETTES, TROIS FORMULES',
      retenir: <>
        <SvgSquelettesCarte/>
        {FAlcane}
        <ul style={ULS}>
          <li>À même nombre de carbones : une chaîne saturée a le <strong>maximum d’H</strong> ; une <strong>double liaison C=C</strong> ou un <strong>cycle</strong> fait perdre <strong>2 H</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« 1 C=C ou 1 cycle = 2 H en moins »</strong>. Idée fausse : « un cycle ne change pas le nombre d’H ». Vrai : en refermant la chaîne, on supprime 2 H.</li>
        </ul></>,
      texte: <>Le groupe caractéristique hydroxyle –OH (alcool) s’écrit toujours en toutes lettres dans une formule topologique, avec son atome d’hydrogène. L’oxygène forme 2 liaisons. Le squelette carboné de cette molécule compte 4 atomes de carbone.</>,
      tache: { type: 'num', q: 'Combien d’atomes d’hydrogène la molécule compte-t-elle en tout, y compris celui du groupe –OH ?', unite: 'atomes d’hydrogène', vrai: 10, tol: 0, carnet: false, affiche: v => String(v),
        calcul: () => ['Carbone en bout de chaîne : CH₃, 3 H. Carbone relié au groupe –OH : CH, 1 H. Carbone de la chaîne entre les deux : CH₂, 2 H. Dernier carbone : CH₃, 3 H.', 'Sur les carbones : 3 + 1 + 2 + 3 = 9 H, auxquels s’ajoute l’H du groupe –OH : 10 atomes d’hydrogène.'],
        pieges: [[9, 'Vous avez oublié l’atome d’hydrogène du groupe –OH : il compte aussi.'], [8, 'Vérifiez le carbone relié à –OH : il porte 1 H (il a déjà 3 liaisons avec C, C et O).'], [11, 'Un carbone de plus ? Le carbone relié au groupe –OH ne porte qu’un seul H, pas deux.']],
        expl: 'Carbones : CH₃ (3 H), CH(OH) (1 H), CH₂ (2 H), CH₃ (3 H) = 9 H ; plus l’H du groupe –OH : 10 H.', indice: 'Écrivez le groupe de chaque carbone (CH₃, CH₂, CH, C), additionnez les H, puis ajoutez celui du groupe –OH.' } },
    { id: 'nom', titre: 'Nommer avec les règles fournies', focus: ['scene', 'regles'],
      texte: <>Les <strong>règles de nomenclature</strong> sont fournies dans le cadre « Règles » : il ne s’agit pas de les apprendre mais de les appliquer. Repérez la chaîne principale, numérotez-la, puis nommez la ramification.</>,
      tache: { type: 'qcm', q: 'Quel est le nom de cette molécule ?', ...Q.nom,
        expl: 'La plus longue chaîne compte 5 carbones : « pentane ». La ramification méthyle est portée par le carbone 2 en numérotant par la gauche du dessin (4 en numérotant par l’autre bout : on garde le plus petit numéro). 4-méthylpentane est donc faux ; 1,1-diméthylbutane et 2-éthylbutane partent d’une chaîne principale trop courte.',
        indice: 'La chaîne principale est la plus longue suite de carbones, même si le dessin la plie. Numérotez-la de façon que la ramification ait le plus petit numéro.' } },
    { id: 'construire', titre: 'Du nom au dessin : le constructeur', focus: ['scene', 'constructeur'],
      retenirTitre: 'À RETENIR : LIRE UN NOM',
      retenir: <>
        <SvgNomCarte/>
        <ul style={ULS}>
          <li>Nom = <strong>ramification(s) + chaîne principale + terminaison</strong>. La chaîne principale est la <strong>plus longue</strong> (elle contient la double liaison et le carbone du –OH s’il y en a) ; on la numérote pour avoir les plus petits numéros.</li>
          <li>Moyen de s’en souvenir : <strong>« la plus longue chaîne donne le nom, le reste est ramification »</strong>. Idée fausse : « la chaîne principale est celle qui est dessinée en ligne droite ». Vrai : c’est la plus longue, même pliée sur le dessin.</li>
        </ul></>,
      texte: <>Passons du nom au dessin. Le <strong>constructeur</strong> (menus déroulants) dessine la molécule choisie et écrit ses formules brute et semi-développée. Réglez les menus pour représenter le <strong>3-méthylbut-1-ène</strong>. Un carbone ne peut jamais avoir plus de 4 liaisons : le constructeur le signale.</>,
      tache: { type: 'action', ok: okConstruire, consigne: 'Objectif : représenter le 3-méthylbut-1-ène avec le constructeur.' } },
    { id: 'isomeres', titre: 'Isomères de constitution', focus: ['scene'],
      texte: <>Deux molécules sont des <strong>isomères de constitution</strong> si elles ont la <strong>même formule brute</strong> mais des <strong>enchaînements d’atomes différents</strong>. Voici trois molécules A, B et C (les atomes d’hydrogène ne sont pas dessinés).</>,
      tache: { type: 'qcm', q: 'Quelles molécules sont des isomères de A ?', ...Q.isomeres,
        expl: 'A et B ont chacune 4 carbones et 10 H (C₄H₁₀) mais ne s’enchaînent pas pareil : isomères. C porte un trait double : 4 carbones mais 8 H (C₄H₈), la formule brute n’est pas la même, donc ce n’est pas un isomère de A.',
        indice: 'Pour chaque molécule, comptez les carbones puis les hydrogènes (4 liaisons par carbone) : les formules brutes sont-elles égales ?' } },
    { id: 'meme', titre: 'Même molécule ou isomères ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : ISOMÈRES DE CONSTITUTION',
      retenir: <>
        <SvgIsomeresCarte/>
        <ul style={ULS}>
          <li>Des <strong>isomères de constitution</strong> ont la <strong>même formule brute</strong> mais un <strong>enchaînement d’atomes différent</strong> (qui est lié à qui).</li>
          <li>Moyen de s’en souvenir : <strong>« même formule, autre enchaînement »</strong>. Idée fausse : « même formule brute, donc même molécule ». Vrai : les atomes sont les mêmes, pas leur assemblage.</li>
        </ul></>,
      texte: <>Voici deux dessins A et B. Pour comparer deux molécules, on regarde l’enchaînement des atomes (qui est lié à qui), pas l’allure du dessin.</>,
      tache: { type: 'qcm', q: 'Que représentent A et B ?', ...Q.meme,
        expl: 'Dans les deux dessins, 4 carbones s’enchaînent en une seule ligne, sans ramification : c’est le butane. Plier ou retourner le dessin ne change pas l’enchaînement. Pour que ce soient deux isomères, il faudrait un enchaînement différent (comme une ramification), et les formules brutes sont ici identiques (C₄H₁₀).',
        indice: 'Suivez la chaîne carbone par carbone sur chaque dessin : y a-t-il une ramification ? Combien de carbones à la suite ?' } },
    { id: 'c4h10', titre: 'Représenter tous les isomères de C₄H₁₀', focus: ['constructeur', 'liste'],
      retenirTitre: 'À RETENIR : UNE MOLÉCULE, PLUSIEURS DESSINS',
      retenir: <>
        <SvgMemeCarte/>
        <ul style={ULS}>
          <li>Plier, retourner ou tourner le dessin <strong>ne change pas la molécule</strong> : seul compte l’enchaînement des atomes.</li>
          <li>Pour vérifier : chercher la <strong>chaîne la plus longue</strong> et les <strong>ramifications</strong>, puis comparer.</li>
          <li>Moyen de s’en souvenir : <strong>« même enchaînement = même molécule »</strong>. Idée fausse : « un dessin différent est une molécule différente ». Vrai : on compare les enchaînements, pas les dessins.</li>
        </ul></>,
      texte: <>Formule brute <strong>C₄H₁₀</strong> : cherchez tous les isomères de constitution. Pour chacun, réglez le constructeur puis cliquez sur « Ajouter à ma liste » ; si la structure est déjà dans la liste ou n’a pas la bonne formule brute, un message vous le dit. Méthode : commencez par la chaîne la plus longue, puis raccourcissez-la en ajoutant une ramification.</>,
      tache: { type: 'action', ok: r10.liste.length >= r10.n, consigne: 'Objectif : ajouter tous les isomères de constitution de C₄H₁₀ à votre liste.' } },
    { id: 'c4h8', titre: 'Représenter tous les isomères de C₄H₈', focus: ['constructeur', 'liste'],
      texte: <>Formule brute <strong>C₄H₈</strong> : 2 H de moins que la chaîne saturée C₄H₁₀. La structure comporte donc une double liaison C=C ou un cycle. Trouvez-en au moins trois (le but-2-ène ne compte qu’une fois : on ne distingue pas ici ses deux formes dans l’espace).</>,
      tache: { type: 'action', ok: r11.liste.length >= 3, consigne: 'Objectif : ajouter au moins 3 isomères de constitution de C₄H₈ à votre liste.' } },
    { id: 'types', titre: 'Isomères de chaîne et de position', focus: ['scene'],
      texte: <>Deux vocabulaires précisent l’isomérie de constitution : isomères de <strong>chaîne</strong> (squelette carboné différent, même type de groupe) et isomères de <strong>position</strong> (même squelette, groupe ou double liaison placé ailleurs). Les trois molécules ont la même formule brute, C₄H₁₀O : A est le butan-1-ol, B le butan-2-ol, C le 2-méthylpropan-1-ol.</>,
      tache: { type: 'qcm', q: 'Quelle paire est formée d’isomères de position ?', ...Q.types,
        expl: 'A et B ont le même squelette de 4 carbones en ligne, le groupe –OH étant sur le carbone 1 pour A et sur le carbone 2 pour B : isomères de position. A et C, comme B et C, diffèrent par le squelette (C est ramifié) : ce sont des isomères de chaîne. Il existe donc bien une paire de position.',
        indice: 'Pour chaque paire, dessinez les squelettes carbonés sans le groupe –OH : sont-ils identiques ? Si oui, où est placé –OH ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : CHAÎNE OU POSITION',
      retenir: <>
        <SvgTypesCarte/>
        <ul style={ULS}>
          <li><strong>Isomères de chaîne</strong> : le squelette carboné change (longueur, ramification), le groupe reste de même nature. <strong>Isomères de position</strong> : même squelette, le groupe ou la double liaison change de place.</li>
          <li>But-1-ène et cyclobutane : isomères de constitution, mais ni de chaîne ni de position ici (la nature de la liaison change).</li>
          <li>Pour dénombrer : on classe d’abord par <strong>squelette</strong>, puis on déplace le groupe ou la double liaison, et on n’oublie pas les <strong>cycles</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« d’abord le squelette, ensuite la position »</strong>.</li>
        </ul></>,
      texte: <>Vous savez lire une formule topologique (carbones aux sommets, H implicites, 4 liaisons par carbone), passer à la formule semi-développée et à la formule brute, nommer ou représenter une molécule avec des règles fournies, et trouver des isomères de constitution. Passez à l’exploration (constructeur et vérificateur d’isomérie) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- règles de nomenclature fournies ----------
  const regles = (
    <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
      <li><strong>Chaîne principale</strong> : la plus longue suite de carbones (elle contient la double liaison C=C et le carbone qui porte –OH, s’il y en a). Son nom vient du nombre de carbones : 1 méth, 2 éth, 3 prop, 4 but, 5 pent, 6 hex, puis « ane » (liaisons simples).</li>
      <li><strong>Numérotation</strong> : on numérote la chaîne pour que le carbone du groupe –OH, puis la double liaison, puis les ramifications aient les plus petits numéros possibles.</li>
      <li><strong>Ramification</strong> : un groupe méthyl (1 carbone) ou éthyl (2 carbones) est écrit avant le nom de la chaîne, précédé de son numéro (2-méthyl). Plusieurs groupes identiques : di, tri (2,2-diméthyl).</li>
      <li><strong>Double liaison</strong> : « ane » devient « -n-ène » (n = numéro du premier carbone de la double liaison) : but-1-ène. <strong>Groupe –OH</strong> : « e » final remplacé par « -n-ol » : propan-2-ol. <strong>Cycle</strong> : préfixe « cyclo ». Quand il n’y a qu’une position possible, on n’écrit pas de numéro (propène, éthanol, cyclopropane).</li>
    </ol>);
  const sectionRegles = (ouvert, bascule) => <Section titre="Règles de nomenclature (fournies)" ouvert={ouvert} onBascule={bascule}>{regles}</Section>;
  const boxRegles = enGuide && idx >= 5 && idx <= 6 && (
    <div style={{ ...styleBoite, ...cadre('regles') }}>
      <Section titre="Règles de nomenclature (fournies)" ouvert={idx === 5 ? true : ouv.regles} onBascule={() => setOuv(o => ({ ...o, regles: !o.regles }))}>{regles}</Section>
    </div>);

  // ---------- actions « ajouter à la liste » ----------
  const ajouterG = id => {
    const { cle } = rechercheEtape(id), r = ajouter(dG, gTrouve(id), cle);
    setTrouvesG(t => ({ ...t, [id]: r.liste })); setMsgG(r.msg);
  };
  const msgBox = m => m && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: m.ok ? '#15803d' : '#b91c1c' }}>{m.ok ? '✓ ' : '✗ '}{m.t}</div>;

  // ---------- zones de la scène du parcours ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const sceneGuide = (() => {
    const c = idx;
    if (c === 0) return <FormuleTopo m={g('CC(C)CC')} aria="Formule topologique d’une molécule : une ligne brisée de quatre carbones avec une ramification d’un carbone"/>;
    if (c === 1) return <FormuleTopo m={g('CC(C)C(C)C')} aria="Formule topologique d’une molécule de six carbones : une chaîne de quatre carbones portant deux ramifications"/>;
    if (c === 2) return <FormuleTopo m={g('C=CCCC')} aria="Formule topologique d’une chaîne de cinq carbones dont les deux premiers sont reliés par un trait double"/>;
    if (c === 3) return <FormuleTopo m={g('C1CCCC1')} aria="Formule topologique d’un cycle de cinq carbones"/>;
    if (c === 4) return <FormuleTopo m={g('CCC(C)O')} aria="Formule topologique d’une chaîne de quatre carbones portant un groupe OH sur le deuxième carbone"/>;
    if (c === 5) return <FormuleTopo m={g('CC(C)CCC')} aria="Formule topologique d’une chaîne de cinq carbones portant une ramification d’un carbone sur le deuxième carbone"/>;
    if (c === 7) return <Planche items={[{ m: 'CCCC' }, { m: 'CC(C)C' }, { m: 'C=CCC' }]} aria="Trois molécules : A est une chaîne de quatre carbones, B une chaîne de trois carbones portant une ramification, C une chaîne de quatre carbones avec un trait double"/>;
    if (c === 8) return <Planche items={[{ m: 'CCCC' }, { m: 'CCCC', opts: { plie: true } }]} aria="Deux dessins d’une chaîne de quatre carbones : A est en zigzag, B est plié en forme de C"/>;
    if (c === 11) return <Planche items={[{ m: 'CCCCO' }, { m: 'CCC(C)O' }, { m: 'CC(C)CO' }]} aria="Trois molécules : A est une chaîne de quatre carbones avec un groupe OH au bout, B est une chaîne de quatre carbones avec un groupe OH sur le deuxième carbone, C est une chaîne de trois carbones ramifiée avec un groupe OH au bout"/>;
    return null;
  })();
  const boxSceneGuide = enGuide && idx !== 6 && idx !== 9 && idx !== 10 && idx !== 12 && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={titreCarte}>{idx === 7 || idx === 8 || idx === 11 ? 'Molécules à comparer' : 'La molécule'}</div>
      {sceneGuide}
    </div>);
  const boxConstructeurGuide = enGuide && (idx === 6 || idx === 9 || idx === 10) && (
    <>
      <div style={{ ...styleBoite, ...cadre('scene') }}>
        <div style={titreCarte}>Structure construite</div>
        <Structure d={dG} avecNom={idx !== 6}/>
      </div>
      <div style={{ ...styleBoite, ...cadre('constructeur') }}>
        <div style={titreCarte}>Constructeur</div>
        <Constructeur d={dG} setD={setDG}/>
        {(idx === 9 || idx === 10) && <div style={{ marginTop: 8 }}><button onClick={() => ajouterG(IDS[idx])} style={styleBouton(true, '#15803d')}>Ajouter à ma liste</button></div>}
        {(idx === 9 || idx === 10) && msgBox(msgG)}
      </div>
      {(idx === 9 || idx === 10) && <div style={{ ...styleBoite, ...cadre('liste') }}>
        <div style={titreCarte}>Ma liste d’isomères de {M.cleVersTexte(rechercheEtape(IDS[idx]).cle)} ({rechercheEtape(IDS[idx]).liste.length} trouvé{rechercheEtape(IDS[idx]).liste.length > 1 ? 's' : ''})</div>
        <ListeTrouves liste={rechercheEtape(IDS[idx]).liste}/>
        {idx === 10 && rechercheEtape('c4h8').liste.length >= 3 && <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: KIT.txt, lineHeight: 1.5 }}>Il y en a 5 au total dans cette simulation, dont un cycle à 3 carbones (le méthylcyclopropane) : l’exploration et les défis permettent de les chercher tous.</div>}
      </div>}
    </>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'tous') {
      setDefi({ type, ...M.tirageDefiTous(), essais: 0, ok: false, msg: null }); setTrouvesD([]);
    } else {
      setDefi({ type, ...M.tirageDefiRelation(), essais: 0, ok: false, msg: null });
    }
    setMsgD(null); setDD({ ...M.DESC_DEFAUT });
  };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  // ---------- fin de parcours ----------
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  const ajouterD = () => { const r = ajouter(dD, trouvesD, defi.cle); setTrouvesD(r.liste); setMsgD(r.msg); setDefi(x => ({ ...x, ok: false, msg: null })); };
  const toutTrouve = () => {
    const ok = trouvesD.length >= M.nbIsomeres(defi.cle);
    setDefi(x => ({ ...x, ok, essais: x.essais + 1, msg: ok ? { ok: true, t: `Bravo : les ${M.nbIsomeres(defi.cle)} isomères de constitution de ${M.cleVersTexte(defi.cle)} (dans cette simulation) sont dans votre liste.` } : { ok: false, t: `Il en manque au moins un. Vous en avez ${trouvesD.length} : pensez à une autre longueur de chaîne, à une ramification, à la place de la double liaison ou du groupe –OH, et aux cycles.` } }));
    noterT(ok);
  };
  const verifierRel = () => {
    const { g: essai, erreur } = M.construire(dD), ref = g(defi.smi), r = M.relation(ref, essai);
    let msg, ok = false;
    if (!essai) msg = erreur.msg;
    else if (!r.ok && r.motif === 'formule') msg = `Ce n’est pas un isomère : sa formule brute est ${M.bruteTexte(essai)}, alors que celle de la molécule de départ est ${M.bruteTexte(ref)}.`;
    else if (!r.ok && r.motif === 'meme') msg = 'C’est la même molécule que celle de départ, simplement dessinée autrement : il faut un enchaînement différent.';
    else if (defi.kind === 'position' && r.position) { ok = true; msg = `Correct : même squelette carboné, groupe ou double liaison déplacé. Votre molécule : ${M.nom(essai)}.`; }
    else if (defi.kind === 'chaine' && r.chaine) { ok = true; msg = `Correct : le squelette carboné est différent et la nature du groupe reste la même. Votre molécule : ${M.nom(essai)}.`; }
    else if (r.autre) msg = 'C’est bien un isomère, mais il a changé de nature (cycle à la place de la double liaison, par exemple) : gardez le même type de groupe ou de liaison.';
    else msg = defi.kind === 'position' ? 'C’est un isomère de chaîne : le squelette carboné a changé. Il faut garder le même squelette et déplacer le groupe ou la double liaison.' : 'C’est un isomère de position : le squelette est identique. Il faut modifier le squelette carboné (ramification, longueur de la chaîne).';
    setDefi(x => ({ ...x, ok, essais: x.essais + 1, msg: { ok, t: msg } })); noterR(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['tous', 'Tous les isomères'], ['relation', 'Isomère demandé']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'tous' ? 'Défi : trouvez tous les isomères' : 'Défi : dessinez l’isomère demandé'}</div>
      {defi.type === 'tous' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Formule brute : <strong>{M.cleVersTexte(defi.cle)}</strong>. Avec le constructeur, ajoutez à votre liste tous les isomères de constitution de cette formule{defi.cle.endsWith('O') ? ' (uniquement des alcools : les éthers ne sont pas étudiés ici)' : ''}. Quand vous pensez les avoir tous, cliquez sur « J’ai tout trouvé ».</div>
        <IndiceDefi cache={defi.ok}>Procédez par ordre : d’abord la chaîne la plus longue, puis des chaînes plus courtes avec une ramification méthyle ; pour chaque squelette, déplacez la double liaison ou le groupe –OH ; pensez aussi aux cycles quand la formule le permet (2 H de moins qu’une chaîne saturée).</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Molécule de départ : <strong>{M.nom(g(defi.smi))}</strong>, de formule brute <strong>{M.bruteTexte(g(defi.smi))}</strong>. Dessinez avec le constructeur <strong>un isomère de {defi.kind === 'position' ? 'position' : 'chaîne'}</strong> :{' '}
          {defi.kind === 'position' ? 'même squelette carboné, mais le groupe ou la double liaison est placé ailleurs.' : 'le squelette carboné est différent (autre longueur de chaîne, ramification), le groupe ou la liaison reste de même nature.'}</div>
        <div style={{ maxWidth: 220, margin: '0 auto 8px' }}><FormuleTopo m={g(defi.smi)} L={30} maxW={200} aria={`Molécule de départ : ${M.nom(g(defi.smi))}`}/></div>
        <IndiceDefi cache={defi.ok}>Dessinez le squelette carboné seul, puis placez le groupe –OH ou la double liaison. Isomère de position : même squelette, autre place. Isomère de chaîne : autre squelette, même type de groupe. Vérifiez que la formule brute reste la même.</IndiceDefi>
      </>}
      <div style={{ ...styleBoite, margin: '8px 0' }}>
        <div style={titreCarte}>Constructeur</div>
        <Structure d={dD} ecritures avecNom={false}/>
        <Section titre={`Réglages du constructeur : ${resume(dD)}`} ouvert={ouv.defiGroupes} onBascule={() => setOuv(o => ({ ...o, defiGroupes: !o.defiGroupes }))}>
          <Constructeur d={dD} setD={setDD}/>
        </Section>
      </div>
      {defi.type === 'tous' && <div style={{ ...styleBoite, marginBottom: 8 }}>
        <div style={titreCarte}>Ma liste ({trouvesD.length} trouvé{trouvesD.length > 1 ? 's' : ''})</div>
        <ListeTrouves liste={trouvesD}/>
      </div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        {defi.type === 'tous'
          ? <><button onClick={ajouterD} style={styleBouton(true, '#15803d')}>Ajouter à ma liste</button><button onClick={toutTrouve} style={styleBouton(true, '#1d4ed8')}>J’ai tout trouvé</button></>
          : <button onClick={verifierRel} style={styleBouton(true, '#15803d')}>Vérifier</button>}
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.type === 'tous' && msgBox(msgD)}
      {defi.msg && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? '✓ ' : '✗ '}{defi.msg.t}</div>}
    </div>);

  // ---------- exploration ----------
  const exploreChoix = formE;
  const ajouterE = () => { const r = ajouter(dE, trouvesE, exploreChoix); setTrouvesE(r.liste); setMsgE(r.msg); };
  const { g: grE } = M.construire(dE);
  const statutE = (() => {
    if (!grE) return null;
    if (!exploreChoix) return null;
    const cible = M.cleVersTexte(exploreChoix);
    if (M.cleBrute(grE) !== exploreChoix) return { ok: false, t: `Pas un isomère de ${cible} : formule brute ${M.bruteTexte(grE)}.` };
    const c = M.canon(grE), d = trouvesE.find(x => x.cle === c);
    return d ? { ok: true, t: `Isomère de ${cible}, déjà dans la liste.` } : { ok: true, t: `Isomère de ${cible} : nouveau, vous pouvez l’ajouter à la liste.` };
  })();
  const sceneExplore = (
    <div style={styleBoite}>
      <div style={aide}>La molécule choisie avec le constructeur s’affiche en formule topologique, avec ses formules brute et semi-développée.</div>
      <Structure d={dE} avecNom/>
    </div>);
  const reglagesExplore = (
    <div style={styleBoite}>
      <div style={titreCarte}>Constructeur de molécule</div>
      <Constructeur d={dE} setD={setDE} replie ouvert={ouv.groupes} onBascule={() => setOuv(o => ({ ...o, groupes: !o.groupes }))}/>
    </div>);
  const verificateur = (
    <div style={styleBoite}>
      <div style={titreCarte}>Vérificateur d’isomérie</div>
      <div style={aide}>Choisissez une formule brute : le vérificateur dit si la structure construite en est un isomère, puis garde vos trouvailles.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8, fontWeight: 600 }}>Formule brute à étudier
        <select value={formE} onChange={e => { setFormE(e.target.value); setTrouvesE([]); setMsgE(null); }} style={{ ...MENU, marginTop: 2 }}>
          <option value="">aucune (construction libre)</option>
          {M.FORMULES.map(k => <option key={k} value={k}>{M.cleVersTexte(k)}</option>)}
        </select></label>
      {exploreChoix && <>
        {statutE && <div role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, color: statutE.ok ? '#15803d' : '#b91c1c', marginBottom: 8 }}>{statutE.ok ? '✓ ' : '✗ '}{statutE.t}</div>}
        <button onClick={ajouterE} style={styleBouton(true, '#15803d')}>Ajouter à ma liste</button>
        {msgBox(msgE)}
        <div style={{ ...titreCarte, marginTop: 10 }}>Ma liste ({trouvesE.length} sur {M.nbIsomeres(exploreChoix)} dans cette simulation)</div>
        <ListeTrouves liste={trouvesE}/>
      </>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Placez une ramification méthyle sur un carbone qui porte déjà une double liaison et le groupe –OH : que dit le constructeur ?</li>
        <li>Mettez une ramification méthyle sur C1 d’une chaîne de 4 carbones : comment se nomme la molécule, et pourquoi le nom ne parle-t-il pas de « méthyle » ?</li>
        <li>Comparez les formules brutes d’une chaîne de 4 carbones saturée, avec une double liaison, et d’un cycle de 4 carbones.</li>
        <li>Choisissez C₄H₁₀O : combien d’alcools différents trouvez-vous ? Lesquels sont de chaîne, lesquels de position ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Formule topologique : sommets et bouts de trait = carbones ; H non dessinés ; un carbone fait toujours 4 liaisons</li>
          <li>Une double liaison C=C ou un cycle : 2 H de moins que la chaîne saturée de même nombre de carbones</li>
          <li>Nom = ramifications + chaîne principale la plus longue + terminaison (-ène, -ol) ; numéros les plus petits possibles</li>
          <li>Isomères de constitution : même formule brute, enchaînement des atomes différent</li>
          <li>Isomères de chaîne (squelette modifié) et de position (groupe ou C=C déplacé)</li>
          <li>Plier ou retourner un dessin ne change pas la molécule</li>
        </ul>
      </ARetenir>
    </Section>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Règles de nomenclature fournies</strong> : elles sont affichées pour être appliquées, pas apprises. Les locants sont omis quand il n’y a pas d’ambiguïté (propène, éthanol).</li>
      <li><strong>Famille étudiée</strong> : squelettes saturés, avec une seule double liaison C=C, ou cycliques de 3 à 5 carbones ; un seul groupe –OH ; ramifications méthyle (l’éthyle n’apparaît que dans les noms). Les autres familles et les polymères sont traités dans une autre simulation.</li>
      <li><strong>Conventions de dessin</strong> : sommet = carbone, H implicites, trait double = C=C, groupe –OH écrit. Les angles de 120° du dessin sont une convention : ils ne donnent pas la géométrie réelle (en trois dimensions) de la molécule.</li>
      <li><strong>Notation</strong> : indices en notation à indices (CH₃, C₄H₁₀) ; la semi-développée d’un cycle est écrite en ligne puis « refermée » ; le nom ne distingue pas les deux formes dans l’espace d’un alcène (but-2-ène compté une fois) ni celles d’un carbone portant quatre groupes différents (butan-2-ol compté une fois) : la stéréoisomérie n’est pas traitée ici.</li>
      <li><strong>Dénombrement</strong> : pour C₃H₈O et C₄H₁₀O on ne cherche que les alcools (famille du programme de première) ; en comptant aussi les éthers, il y en aurait 3 et 7.</li>
      <li><strong>Dessin à plusieurs formes</strong> : un même enchaînement peut se dessiner de plusieurs façons (zigzag, plié, retourné) ; deux molécules sont les mêmes si leurs enchaînements d’atomes coïncident.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tp-col { display: flex; flex-direction: column; gap: 12px; }
        .tp-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .tp-l1.cote .tp-carte { order: 2; } .tp-l1.cote .tp-main { order: 1; }
          .tp-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tp-ex > * { grid-column: 1; } .tp-ex > .tp-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .tp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tp-in { animation: tp-fondu 0.35s ease-out; } @keyframes tp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Formules topologiques et isomérie de constitution</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La <strong>formule topologique</strong> ne dessine que le squelette carboné. Avec elle, on retrouve la formule brute, on nomme une molécule et on cherche ses <strong>isomères de constitution</strong> : mêmes atomes, enchaînement différent.</div>
      {!enExplore && <div className="tp-l1 cote">
        {enGuide ? <div className="tp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="tp-carte"><div style={{ ...styleBoite, marginBottom: 12 }}>{sectionRegles(ouv.regles, () => setOuv(o => ({ ...o, regles: !o.regles })))}</div>{panneauHypo}</div> : null}
        <div className="tp-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type === 'tous' ? 'tous' : 'relation'}`} etat={defi.type === 'tous' ? suiviT : suiviR}/></div>}
          {enGuide && <div className="tp-col">
            {boxSceneGuide && <div className="tp-in">{boxSceneGuide}</div>}
            {boxConstructeurGuide && <div className="tp-col tp-in">{boxConstructeurGuide}</div>}
            {boxRegles && <div className="tp-in">{boxRegles}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <div className="tp-ex">
        <div>{sceneExplore}</div>
        <div className="tp-ctrl">{reglagesExplore}</div>
        <div>{verificateur}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div style={styleBoite}>{sectionRegles(ouv.regles, () => setOuv(o => ({ ...o, regles: !o.regles })))}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
