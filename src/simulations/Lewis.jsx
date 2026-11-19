import { useState, useRef, useLayoutEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { configTxt, element } from "./atomesModele";
import { TableauPeriodique } from "./atomesVue";
import * as M from "./lewisModele";
import { QCM } from "./lewisQcm";
import { EditeurLewis, SchemaFixe } from "./LewisScene";
import { SvgValenceLiaisons, SvgMethode, SvgLiantsNonLiants, SvgDoubleTriple, SvgIons, SvgLacune, SvgVerifications } from "./LewisSchemas";

const SIM_ID = 154, CLE_GUIDE = 'lewis-1g-guide-v1';
declarerDefis(SIM_ID, [['programme', 'Établir le schéma de Lewis d’une entité'], ['hors', 'Au-delà du programme : O₃, AlCl₃, HCN']]);

// ====================================================
//  SIM 154 — SCHÉMA DE LEWIS : ÉTABLIR CELUI D'UNE MOLÉCULE OU D'UN ION (1G spé PC, thème « Constitution et transformations de la matière »,
//  partie « De la structure des entités aux propriétés physiques de la matière »).
//  Une seule idée : à partir du tableau périodique, compter les électrons de valence (n_T), les doublets (n_D), puis placer liaisons et doublets non liants
//  (octet, duet), les charges et la lacune électronique. Prolonge la sim 57 (2GT : octet) sans la modifier. Le modèle est dans lewisModele.js (testé).
//  Hors de cette simulation : géométrie, électronégativité, polarité (autre simulation du chapitre).
//  Capacité visée (jamais affichée à l'élève) : établir le schéma de Lewis de molécules et d'ions mono ou polyatomiques à partir du tableau périodique
//  (O₂, H₂, N₂, H₂O, CO₂, NH₃, CH₄, HCl, H⁺, H₃O⁺, Na⁺, NH₄⁺, Cl⁻, HO⁻, O²⁻) ; lacune électronique.
// ====================================================

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const Ind = ({ x, i }) => <>{x}<sub>{i}</sub></>;
const nT = <Ind x="n" i="T"/>, nD = <Ind x="n" i="D"/>;
const chStr = q => (q === 0 ? '0' : `${q > 0 ? '+' : '−'}${Math.abs(q)}`);

const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);

// ---------- atomes d'une entité avec leur configuration électronique ----------
function CartesAtomes({ ent }) {
  const noms = [...new Set(ent.atomes)];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {noms.map(s => {
        const Z = M.ZAtome(s), k = ent.atomes.filter(a => a === s).length;
        return (<div key={s} style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', padding: '6px 8px', background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 10, fontSize: 14.5 }}>
          <strong style={{ fontSize: 17 }}>{s}</strong>
          <span>Z = {Z}</span><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{configTxt(Z)}</span>
          {k > 1 && <span style={{ color: KIT.txt2 }}>({k} atomes dans l’entité)</span>}
        </div>);
      })}
    </div>);
}

// ---------- électrons de valence d'atomes seuls (étape « combien de liaisons ») ----------
function AtomesSeuls() {
  const L = [['H', 1], ['C', 4], ['N', 5], ['O', 6], ['Cl', 7]];
  return (
    <svg viewBox="0 0 300 120" width="100%" role="img" aria-label="Cinq atomes seuls avec leurs électrons de valence : H 1, C 4, N 5, O 6, Cl 7."
      style={{ maxWidth: 420, display: 'block', margin: '0 auto', background: 'white', borderRadius: 12, border: `1px solid ${KIT.bord}` }}>
      {L.map(([s, v], k) => {
        const cx = 31 + 59.5 * k, cy = 50;
        return (<g key={s}>
          {Array.from({ length: v }, (_, j) => { const a = (-90 + (360 / v) * j) * Math.PI / 180; return <circle key={j} cx={cx + 25 * Math.cos(a)} cy={cy + 25 * Math.sin(a)} r="3.6" fill={COL.orange}/>; })}
          <circle cx={cx} cy={cy} r="15" fill="#fff" stroke="#475569" strokeWidth="1.5"/>
          <text x={cx} y={cy + 5.5} fontSize="16" fontWeight="800" textAnchor="middle" fill={KIT.txt}>{s}</text>
          <text x={cx} y="102" fontSize="13" fontWeight="700" textAnchor="middle" fill={KIT.txt2}>{v} e⁻</text>
        </g>);
      })}
    </svg>);
}

// ---------- électrons « en vrac » à répartir (étape n_D de HCl) ----------
function ElectronsEnVrac({ n }) {
  return (
    <svg viewBox="0 0 300 54" width="100%" role="img" aria-label={`${n} électrons de valence, à répartir en doublets.`}
      style={{ maxWidth: 420, display: 'block', margin: '0 auto', background: 'white', borderRadius: 12, border: `1px solid ${KIT.bord}` }}>
      {Array.from({ length: n }, (_, k) => <circle key={k} cx={150 + (k - (n - 1) / 2) * 26} cy="27" r="8" fill={COL.orange}/>)}
    </svg>);
}

// Carte « À retenir » repliée par défaut sur téléphone (dans la carte du parcours) : elle ne masque plus la consigne. Dans « Mes fiches » elle reste dépliée, sans bouton.
function Repliable({ children }) {
  const ref = useRef(null);
  const [etat, setEtat] = useState({ dans: false, ouvert: true });
  useLayoutEffect(() => {
    const dans = !!(ref.current && ref.current.closest('[data-carte-parcours]'));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- le DOM (carte du parcours ou fiche) n'est connu qu'après le montage
    if (dans) setEtat({ dans: true, ouvert: window.innerWidth >= 700 });
  }, []);
  return (
    <div ref={ref}>
      {etat.dans && <button onClick={() => setEtat(e => ({ ...e, ouvert: !e.ouvert }))} aria-expanded={etat.ouvert}
        style={{ ...stylePetitBouton(!etat.ouvert, '#0369a1'), minHeight: 40, margin: '4px 0' }}>{etat.ouvert ? 'Replier la carte ▴' : 'Afficher la carte : schéma et points à retenir ▾'}</button>}
      {etat.ouvert && children}
    </div>);
}

// Entité de l'étape « Repérer une erreur » : NH₄⁺ dessiné sans sa charge
const ENT_BILAN = M.entite('NH4p');
const ST_BILAN = (() => { const st = M.structureRef(ENT_BILAN); st.ch = ENT_BILAN.atomes.map(() => 0); return st; })();

// Étapes « construire » : entité, outils disponibles, compteur de doublets, indice
const BUILD = {
  hcl: { ent: 'HCl', outils: ['lien', 'doublet'], nd: true, indice: 'Il y a 4 doublets. Un doublet sert à la liaison entre H et Cl ; les autres vont sur l’atome qui n’a pas encore 8 électrons autour de lui (H n’en veut que 2).' },
  h2o: { ent: 'H2O', outils: ['lien', 'doublet'], nd: true, indice: 'L’oxygène forme autant de liaisons qu’il lui manque d’électrons pour en avoir 8. Les doublets qui restent à placer sont des doublets non liants.' },
  co2: { ent: 'CO2', outils: ['lien', 'doublet'], nd: false, indice: 'Compte d’abord les doublets à placer (n_T puis n_D). Avec des liaisons simples seulement, le carbone n’aurait que 4 électrons autour de lui : que peut-on faire pour qu’il en ait 8 ?' },
  n2: { ent: 'N2', outils: ['lien', 'doublet'], nd: false, indice: 'Chaque atome N doit avoir 8 électrons autour de lui. Combien de doublets liants faut-il partager pour y arriver, sans dépasser le nombre total de doublets ?' },
  h3o: { ent: 'H3Op', outils: ['lien', 'doublet', 'charge'], nd: true, indice: 'La charge se place sur l’atome dont le nombre d’électrons possédés dans l’ion (1 par liaison, 2 par doublet non liant) diffère de son nombre d’électrons de valence quand il est seul.' },
  hp: { ent: 'Hp', outils: ['lien', 'doublet', 'charge', 'lacune'], nd: false, indice: 'Combien d’électrons l’atome H possède-t-il seul ? Combien dans H⁺ ? Reste-t-il un doublet à placer ? Et le duet de H est-il atteint ?' },
};

const PRESET_Z = 7;
// Tirage d'une entité de défi (différente de la précédente) : hors du composant, car il utilise le hasard
function tirerEntite(type, exclu) {
  const possibles = (type === 'hors' ? M.ENTITES_HORS : M.ENTITES_PROGRAMME).filter(e => e.id !== exclu);
  return possibles[Math.floor(Math.random() * possibles.length)];
}

// ====================================================
export function SimulationLewis() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('programme');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ZChoisi, setZChoisi] = useState(PRESET_Z);
  const [ed, setEd] = useState({ cle: '', st: null, verifie: false });
  const [ex, setEx] = useState({ id: 'H2O', st: M.structureVide(M.entite('H2O')), verifie: false, ouv: { suivi: true } });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['valence', 'liaisons', 'hcl-nt', 'hcl-nd', 'hcl', 'h2o-nd', 'h2o', 'co2', 'n2', 'h3o-nd', 'h3o', 'hp', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;

  // éditeur de l'étape en cours (réinitialisé quand on change d'étape)
  const bd = idE ? BUILD[idE] : null;
  const entG = bd ? M.entite(bd.ent) : null;
  const stG = bd ? (ed.cle === idE && ed.st ? ed.st : M.structureVide(entG)) : null;
  const verG = bd ? M.verifier(entG, stG, { sansNombres: !bd.nd }) : null;
  const okG = !!(bd && ed.cle === idE && ed.verifie && verG.ok);
  const majG = st => setEd({ cle: idE, st, verifie: false });
  const verifierG = () => setEd({ cle: idE, st: stG, verifie: true });

  const ent = id => M.entite(id);
  const consigneBuild = 'Place les liaisons et les doublets non liants dans le schéma, puis clique sur « Vérifier mon schéma ».';
  const consigneIon = 'Place les liaisons, les doublets non liants et la charge, puis clique sur « Vérifier mon schéma ».';

  const ETAPES = [
    { id: 'valence', titre: 'Les électrons de valence d’un atome', focus: ['scene'],
      texte: <>Les <strong>électrons de valence</strong> sont les électrons de la <strong>couche la plus externe</strong> de l’atome : ce sont eux qui servent à former des liaisons. Dans le tableau, l’azote (N) est sélectionné : sa configuration électronique est écrite sous le tableau. Touche d’autres cases pour voir d’autres configurations.</>,
      tache: { type: 'num', q: 'Combien l’atome d’azote a-t-il d’électrons de valence ?', carnet: 'Électrons de valence de N', unite: 'électrons', vrai: 5, tol: 0.001, affiche: v => String(v),
        calcul: () => ['Configuration de l’azote : 1s² 2s² 2p³.', 'La couche la plus externe est la couche n = 2 (sous-couches 2s et 2p) : 2 + 3 = 5 électrons de valence.'],
        pieges: [[7, 'Tu as compté tous les électrons (Z = 7). Les électrons de valence sont seulement ceux de la couche la plus externe, n = 2.'], [3, 'Tu n’as compté que les électrons 2p. La couche n = 2 comprend aussi la sous-couche 2s.'], [2, 'Tu n’as compté que les électrons 2s. La couche n = 2 comprend aussi la sous-couche 2p.']],
        expl: '1s² 2s² 2p³ : la couche de valence est la couche n = 2, avec 2 + 3 = 5 électrons.', indice: 'Repère la couche la plus externe dans 1s² 2s² 2p³ : c’est celle dont le numéro est le plus grand. Additionne ses électrons (2s et 2p).' } },
    { id: 'liaisons', titre: 'Un atome, combien de liaisons ?', focus: ['scene'],
      texte: <>Un atome est stable quand il est entouré de <strong>8 électrons</strong> (règle de l’<strong>octet</strong>), ou de <strong>2 électrons</strong> pour l’hydrogène (règle du <strong>duet</strong>). Une <strong>liaison covalente</strong> est un doublet d’électrons partagé entre deux atomes : pour chacun des deux, elle compte comme un électron de plus autour de lui. Voici des atomes seuls avec leurs électrons de valence.</>,
      tache: { type: 'qcm', ...QCM.liaisons } },
    { id: 'hcl-nt', titre: 'Compter les électrons de valence de HCl', focus: ['scene'],
      texte: <>La méthode commence par un comptage. La molécule de chlorure d’hydrogène HCl est formée d’un atome H (Z = 1) et d’un atome Cl (Z = 17). Leurs configurations électroniques sont données. Le nombre total d’électrons de valence de la molécule est noté {nT}.</>,
      tache: { type: 'num', q: <>Nombre total {nT} d’électrons de valence de HCl</>, carnet: 'n_T de HCl', unite: 'électrons', vrai: 8, tol: 0.001, affiche: v => String(v),
        calcul: () => ['H : 1s¹ → 1 électron de valence. Cl : 1s² 2s² 2p⁶ 3s² 3p⁵ → couche n = 3 : 2 + 5 = 7 électrons de valence.', 'n_T = 1 + 7 = 8 électrons.'],
        pieges: [[18, 'Tu as additionné les numéros atomiques Z (1 + 17). Il faut les électrons de valence de chaque atome seul, pas tous leurs électrons.'], [1, 'Il faut aussi compter les électrons de valence de Cl, dans la couche n = 3.'], [7, 'Il faut aussi compter l’électron de valence de H.']],
        expl: 'n_T = 1 (H) + 7 (Cl) = 8 électrons de valence.', indice: 'Pour chaque atome, compte les électrons de la couche la plus externe : n = 1 pour H, n = 3 pour Cl. Puis additionne les deux nombres.' } },
    { id: 'hcl-nd', titre: 'Du nombre d’électrons au nombre de doublets', focus: ['scene'],
      texte: <>Les électrons se placent par <strong>paires</strong> : des doublets, liants (une liaison) ou non liants (portés par un seul atome). Pour HCl, on a trouvé {nT} = 8 électrons de valence.</>,
      tache: { type: 'num', q: <>Nombre {nD} de doublets d’électrons de HCl</>, carnet: 'n_D de HCl', unite: 'doublets', vrai: 4, tol: 0.001, affiche: v => String(v),
        calcul: () => ['Un doublet contient 2 électrons : n_D = n_T ÷ 2.', 'n_D = 8 ÷ 2 = 4 doublets.'],
        pieges: [[8, 'Tu as repris n_T : un doublet contient deux électrons, il faut regrouper les électrons par deux.'], [16, 'Il faut diviser n_T par 2, pas le multiplier.'], [2, 'Tu as divisé deux fois : un doublet contient 2 électrons, une seule division suffit.']],
        expl: 'n_D = 8 ÷ 2 = 4 doublets.', indice: 'Chaque doublet est formé de 2 électrons : regroupe les électrons par deux.' },
      retenirTitre: 'À RETENIR : VALENCE ET NOMBRE DE LIAISONS',
      retenir: <Repliable key="14219">
        <SvgValenceLiaisons/>
        <ul style={liste}>
          <li><strong>Nombre de liaisons d’un atome neutre = 8 − électrons de valence</strong> (2 − 1 pour H) : l’oxygène (6 électrons de valence) en forme 2. Pour un ion, la charge change ce nombre : on le verra plus loin.</li>
          <li>Moyen de s’en souvenir : <strong>H – O – N – C = 1 – 2 – 3 – 4</strong> liaisons ; Cl en forme 1, comme H.</li>
          <li><strong>Idée fausse</strong> : « un atome partage tous ses électrons de valence ». <strong>Vrai</strong> : il en partage juste assez pour atteindre 8 (ou 2 pour H).</li>
        </ul></Repliable> },
    { id: 'hcl', titre: 'Construire le schéma de HCl', focus: ['scene'],
      texte: <>Il reste à <strong>placer</strong> les 4 doublets de HCl : d’abord la liaison, puis les doublets non liants. À la fin, chaque atome doit avoir 8 électrons autour de lui (2 pour H) : un doublet liant compte pour les deux atomes qu’il relie. Ici, on te donne le squelette : les deux atomes sont reliés. Le schéma de Lewis est un modèle : l’octet est une règle, qui a des exceptions.</>,
      tache: { type: 'action', ok: okG, consigne: consigneBuild } },
    { id: 'h2o-nd', titre: 'Les doublets de la molécule d’eau', focus: ['scene'],
      texte: <>La molécule d’eau H₂O contient <strong>deux atomes d’hydrogène</strong> (Z = 1) et <strong>un atome d’oxygène</strong> (Z = 8). Leurs configurations électroniques sont données : applique le comptage, puis le regroupement par deux.</>,
      tache: { type: 'num', q: <>Nombre {nD} de doublets d’électrons de H₂O</>, carnet: 'n_D de H₂O', unite: 'doublets', vrai: 4, tol: 0.001, affiche: v => String(v),
        calcul: () => ['H : 1 électron de valence (× 2 atomes). O : 1s² 2s² 2p⁴ → 2 + 4 = 6 électrons de valence.', 'n_T = 2 × 1 + 6 = 8 électrons, donc n_D = 8 ÷ 2 = 4 doublets.'],
        pieges: [[3.5, 'Il y a deux atomes d’hydrogène : l’indice 2 de H₂O compte, il faut ajouter deux électrons pour H.'], [5, 'Tu as utilisé Z pour O (8) au lieu de ses électrons de valence : seuls comptent ceux de la couche la plus externe.'], [8, 'C’est n_T : un doublet contient deux électrons, il faut regrouper les électrons par deux.']],
        expl: 'n_T = 2 × 1 + 6 = 8 électrons ; n_D = 8 ÷ 2 = 4 doublets.', indice: 'Additionne les électrons de valence de tous les atomes (les deux H comptent), puis divise par 2.' } },
    { id: 'h2o', titre: 'Construire le schéma de H₂O', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA MÉTHODE EN TROIS TEMPS',
      retenir: <Repliable key="16565">
        <SvgMethode/>
        <ul style={liste}>
          <li><strong>n<sub>T</sub> → n<sub>D</sub> → placer</strong> : on compte, on regroupe par deux, puis on dessine.</li>
          <li>Exemple de la simulation : HCl, 1 + 7 = 8 électrons, soit 4 doublets, dont 1 liant et 3 non liants.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « Compter, Regrouper, Placer ». On vérifie toujours le schéma à la fin : 8 autour de chaque atome, 2 autour de H.</li>
        </ul></Repliable>,
      texte: <>Pour H₂O, on a trouvé {nD} = 4 doublets. L’atome d’oxygène est au centre, relié aux deux atomes d’hydrogène (le dessin est aligné, mais l’angle n’a pas de sens ici : la forme réelle de la molécule viendra plus tard). Place les doublets : chaque H doit avoir 2 électrons autour de lui, l’oxygène 8.</>,
      tache: { type: 'action', ok: okG, consigne: consigneBuild } },
    { id: 'co2', titre: 'Construire le schéma de CO₂', focus: ['scene'],
      retenirTitre: 'À RETENIR : DOUBLETS LIANTS ET NON LIANTS',
      retenir: <Repliable key="17513">
        <SvgLiantsNonLiants/>
        <ul style={liste}>
          <li><strong>Doublet liant</strong> : partagé entre deux atomes (un trait entre eux). <strong>Doublet non liant</strong> : appartient à un seul atome (un tiret sur lui).</li>
          <li>Exemple de la simulation : H₂O a 4 doublets, soit 2 liants et 2 non liants ; autour de O : 2 × 2 + 2 × 2 = 8 électrons.</li>
          <li><strong>Idée fausse</strong> : « le doublet liant compte une seule fois ». <strong>Vrai</strong> : il compte pour les deux atomes qu’il relie (un trait = 2 électrons autour de chacun).</li>
        </ul></Repliable>,
      texte: <>Le dioxyde de carbone CO₂ est formé d’un atome de carbone (Z = 6), au centre, et de deux atomes d’oxygène (Z = 8). Applique toute la méthode : compte les électrons de valence, puis les doublets, puis place-les pour que chaque atome ait 8 électrons autour de lui.</>,
      tache: { type: 'action', ok: okG, consigne: consigneBuild } },
    { id: 'n2', titre: 'Construire le schéma de N₂', focus: ['scene'],
      texte: <>La molécule de diazote N₂ est formée de deux atomes d’azote (Z = 7). Même méthode : compte, regroupe par deux, place, puis vérifie l’octet pour chaque atome.</>,
      tache: { type: 'action', ok: okG, consigne: consigneBuild } },
    { id: 'h3o-nd', titre: 'Compter les doublets d’un ion', focus: ['scene'],
      retenirTitre: 'À RETENIR : LIAISONS SIMPLES, DOUBLES ET TRIPLES',
      retenir: <Repliable key="18974">
        <SvgDoubleTriple/>
        <ul style={liste}>
          <li><strong>Liaison simple = 1 doublet partagé, double = 2, triple = 3.</strong> Quand l’octet n’est pas atteint avec des liaisons simples, on augmente l’ordre de la liaison.</li>
          <li>Exemples de la simulation : CO₂ a 8 doublets (4 liants et 4 non liants), N₂ en a 5 (3 liants et 2 non liants).</li>
          <li><strong>Moyen de s’en souvenir</strong> : pas assez d’électrons autour d’un atome ? on passe à une liaison double ou triple, sans ajouter d’électrons : on regroupe ceux qui existent.</li>
          <li><strong>Idée fausse</strong> : « entre deux atomes, il n’y a toujours qu’une liaison simple ». <strong>Vrai</strong> : CO₂ a deux liaisons doubles, N₂ une liaison triple.</li>
        </ul></Repliable>,
      texte: <>L’ion oxonium H₃O⁺ contient un atome d’oxygène (Z = 8) et trois atomes d’hydrogène (Z = 1). Cet ion est un <strong>cation</strong> de charge +1 : par rapport aux atomes seuls, il a <strong>perdu un électron</strong>. Il faut en tenir compte dans le comptage.</>,
      tache: { type: 'num', q: <>Nombre {nD} de doublets d’électrons de H₃O⁺</>, carnet: 'n_D de H₃O⁺', unite: 'doublets', vrai: 4, tol: 0.001, affiche: v => String(v),
        calcul: () => ['O : 6 électrons de valence ; 3 H : 3 × 1 = 3. Atomes seuls : 6 + 3 = 9 électrons.', 'L’ion a perdu un électron : n_T = 9 − 1 = 8, donc n_D = 8 ÷ 2 = 4 doublets.'],
        pieges: [[4.5, 'Tu as oublié la charge : l’ion a perdu un électron, donc n_T = (électrons des atomes seuls) − 1.'], [5, 'Un cation a perdu un électron : on le retire de n_T, on ne l’ajoute pas.'], [3.5, 'Il y a trois atomes d’hydrogène dans H₃O⁺ : chacun apporte 1 électron.']],
        expl: 'n_T = 6 + 3 × 1 − 1 = 8 électrons ; n_D = 8 ÷ 2 = 4 doublets.', indice: 'Additionne les électrons de valence des atomes seuls (3 atomes H et 1 atome O), puis retire un électron car l’ion est positif. Divise enfin par 2.' } },
    { id: 'h3o', titre: 'Construire le schéma de H₃O⁺', focus: ['scene'],
      texte: <>Pour H₃O⁺, on a trouvé {nD} = 4 doublets. L’oxygène est au centre. Un nouvel outil apparaît : la <strong>charge</strong>. Une charge se place sur l’atome qui possède, dans l’ion, un nombre d’électrons différent de celui de l’atome seul : un électron par liaison, deux par doublet non liant.</>,
      tache: { type: 'action', ok: okG, consigne: consigneIon } },
    { id: 'hp', titre: 'Construire le schéma de H⁺', focus: ['scene'],
      retenirTitre: 'À RETENIR : LES IONS',
      retenir: <Repliable key="21396">
        <SvgIons/>
        <ul style={liste}>
          <li><strong>n<sub>T</sub> = somme des électrons de valence − charge de l’ion</strong> : cation, on en retire ; anion, on en ajoute.</li>
          <li>Exemples de la simulation : H₃O⁺, 6 + 3 − 1 = 8 électrons ; HO⁻, 6 + 1 + 1 = 8 électrons. La charge se place sur l’atome qui n’a pas le même nombre d’électrons que seul. HO⁻ n’est pas construit dans le parcours : essaie-le dans l’exploration libre.</li>
          <li><strong>Moyen de s’en souvenir</strong> : le « t » de cation ressemble à un + ; un cation a perdu des électrons.</li>
        </ul></Repliable>,
      texte: <>L’ion hydrogène H⁺ est un atome H (Z = 1) qui a perdu son unique électron. Un dernier outil apparaît : la <strong>lacune</strong>, un rectangle vide qui montre qu’un doublet manque autour d’un atome. Établis son schéma.</>,
      tache: { type: 'action', ok: okG, consigne: consigneIon } },
    { id: 'bilan', titre: 'Repérer une erreur dans un schéma', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA LACUNE ÉLECTRONIQUE',
      retenir: <Repliable key="22407">
        <SvgLacune/>
        <ul style={liste}>
          <li><strong>Lacune électronique</strong> : un rectangle vide quand il manque un doublet autour d’un atome. H⁺ n’a plus d’électron : il manque le doublet du duet.</li>
          <li>Exemple : Na⁺ a perdu son électron de valence, mais sa couche n = 2 est pleine (8 électrons) : pas de lacune. Dessine-le dans l’exploration libre pour le vérifier.</li>
          <li><strong>Idée fausse</strong> : « pas d’électron de valence = lacune ». <strong>Vrai</strong> : lacune seulement si un doublet manque pour l’octet ou le duet.</li>
        </ul></Repliable>,
      texte: <>Le schéma ci-dessous a été proposé par un élève pour l’ion ammonium NH₄⁺ (N, Z = 7, au centre ; 4 atomes H, Z = 1). Cet ion est un cation de charge +1.</>,
      tache: { type: 'qcm', ...QCM.bilan } },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { const e = tirerEntite(type, defi && defi.id); setDefi({ type, id: e.id, st: M.structureVide(e), nT: '', nD: '', verifie: false, ok: false, res: null, echecs: 0 }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setEd({ cle: '', st: null, verifie: false });
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const entD = defi ? M.entite(defi.id) : null;
  const verifierDefi = () => {
    const e = entD, a = lireNombre(defi.nT), b = lireNombre(defi.nD), res = M.verifier(e, defi.st, { sansNombres: true, indiceLacune: (defi.echecs || 0) >= 1 });
    const okT = a === M.nT(e), okD = b === M.nD(e), ok = okT && okD && res.ok;
    setDefi(d => ({ ...d, verifie: true, ok, res, okT, okD, echecs: ok ? 0 : (d.echecs || 0) + 1 })); (defi.type === 'programme' ? noterP : noterH)(ok);
  };
  const champNb = (cle, label, aria) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5 }}>
      <span style={{ minWidth: 150 }}>{label}</span>
      <input value={defi[cle]} inputMode="numeric" aria-label={aria} onChange={x => setDefi(d => ({ ...d, [cle]: x.target.value, verifie: false }))}
        style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? ((cle === 'nT' ? defi.okT : defi.okD) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }}/>
    </label>);
  const donneesZ = e => [...new Set(e.atomes)].map(s => `Z(${s}) = ${M.ZAtome(s)}`).join(' ; ');
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['programme', 'Entités du programme'], ['hors', 'Au-delà du programme']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : établis le schéma de Lewis de {entD.nom} <span style={{ whiteSpace: 'nowrap' }}>{entD.formule}</span></div>
      {entD.horsProgramme && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '5px 8px', marginBottom: 8, lineHeight: 1.5 }}>
        <strong>Au-delà du programme</strong> : cette entité n’est pas exigible en première, pour s’entraîner. {entD.id === 'O3' && 'L’ozone a deux écritures équivalentes : l’une ou l’autre est acceptée. '}{entD.id === 'AlCl3' && 'L’atome d’aluminium n’atteint pas l’octet : il porte une lacune. '}</div>}
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        Données : {donneesZ(entD)}.{entD.q !== 0 && <> L’entité porte la charge <strong>{chStr(entD.q)}</strong>.</>} L’atome central est le premier atome de la formule. Donne {nT} et {nD}, puis dessine le schéma.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {champNb('nT', <>Électrons de valence {nT}</>, 'Nombre total d’électrons de valence')}{champNb('nD', <>Doublets {nD}</>, 'Nombre de doublets')}
      </div>
      <EditeurLewis key={`${defi.id}-${defi.type}`} ent={entD} st={defi.st} outils={['lien', 'doublet', 'charge', 'lacune']} onChange={st => setDefi(d => ({ ...d, st, verifie: false }))}
        erreurs={defi.verifie && defi.res ? defi.res.messages.map(m => m.atome).filter(a => a !== null) : []}/>
      <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Méthode : n_T = somme des électrons de valence des atomes seuls, puis on retire la charge d’un cation ou on ajoute celle d’un anion ; n_D = n_T ÷ 2. Place d’abord les liaisons entre l’atome central et les autres, puis les doublets non liants pour que chaque atome ait 8 électrons autour de lui (2 pour H). Une charge se place sur l’atome dont le nombre d’électrons possédés (1 par liaison, 2 par doublet non liant) diffère de celui de l’atome seul ; un rectangle vide marque un doublet manquant.</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="lw-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouvelle entité</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : {nT} = {M.nT(entD)}, {nD} = {M.nD(entD)}, et le schéma de {entD.formule} est juste.</div> : <>
          {!defi.okT && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ {nT} : additionne les électrons de valence de tous les atomes seuls, puis tiens compte de la charge.</div>}
          {!defi.okD && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ {nD} : un doublet contient 2 électrons ({nD} = {nT} ÷ 2).</div>}
          {!defi.res.ok && <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Schéma : {defi.res.messages[0] && defi.res.messages[0].txt}</div>}
        </>}</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Le schéma de Lewis est un modèle</strong>, pas une photographie : il compte les électrons de valence en doublets. Il ne donne ni les angles ni la forme réelle de l’entité (la géométrie relève d’une autre étude), et la disposition du dessin n’a pas de sens physique.</li>
      <li><strong>Règle de l’octet</strong> : chaque atome est entouré de 8 électrons, et H de 2 (duet). C’est une règle qui marche très bien pour H, C, N, O et Cl mais qui a des <strong>exceptions</strong> hors programme de première (atomes qui dépassent l’octet comme le soufre ou le phosphore, entités avec un nombre impair d’électrons).</li>
      <li><strong>Squelette donné</strong> : l’atome central est le premier atome de la formule et il est relié à tous les autres ; pour une entité diatomique, les deux atomes sont reliés entre eux. On ne cherche pas quels atomes sont liés.</li>
      <li><strong>Comptage</strong> : n<sub>T</sub> = somme des électrons de valence des atomes seuls − charge de l’entité ; n<sub>D</sub> = n<sub>T</sub> ÷ 2. Chaque liaison simple, double ou triple compte pour 1, 2 ou 3 doublets.</li>
      <li><strong>Charge portée par un atome</strong> : électrons de valence de l’atome seul − électrons qu’il possède dans l’entité (un par liaison, deux par doublet non liant). C’est la <strong>charge formelle</strong> : la somme des charges des atomes est la charge de l’entité. Quand plusieurs schémas respectent l’octet, on retient celui qui comporte le moins de charges : c’est une <strong>règle de choix</strong>, pas une loi (CO₂ avec une liaison triple et une liaison simple respecte l’octet, mais pas la neutralité des atomes).</li>
      <li><strong>Cas à part</strong> : H⁺ n’a plus d’électron, il manque un doublet : lacune électronique (rectangle vide). <strong>Convention</strong> : pour Na⁺, on compte les électrons de valence de l’atome seul moins la charge (n<sub>T</sub> = 0) et on ne représente pas la couche n = 2, déjà pleine à 8 électrons : on ne dessine rien autour de lui, pas de lacune.</li>
      <li><strong>Au-delà du programme</strong> (défi seulement) : l’ozone O₃ a deux écritures équivalentes (formes mésomères, étudiées après le lycée) ; AlCl₃ est une entité à lacune sur l’atome d’aluminium.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const compteur = (e, st, avecTotal) => (
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>Doublets placés : <span style={{ color: COL.orange }}>{M.doubletsPlaces(st)}</span>{avecTotal ? <> sur {M.nD(e)}</> : null}</div>);
  const retourVerif = (res, verifie) => verifie ? (
    <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, fontWeight: 700, color: res.ok ? '#15803d' : '#9a3412',
      background: res.ok ? '#f0fdf4' : '#fff7ed', border: `1px solid ${res.ok ? '#86efac' : '#fdba74'}`, borderRadius: 8, padding: '6px 10px' }}>
      {res.ok ? '✓ Schéma correct.' : <>✗ Pas encore : {res.messages[0] && res.messages[0].txt}</>}</div>) : null;
  const sceneGuide = (() => {
    if (!idE) return null;
    if (idE === 'valence') {
      return boite('Le tableau périodique',
        <>
          <TableauPeriodique choisi={ZChoisi} onChoisir={setZChoisi} colorier="aucun" compact aide={false}/>
          <div style={{ marginTop: 8, padding: '6px 8px', background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 10, fontSize: 15 }}>
            <strong>{element(ZChoisi).nom}</strong> (Z = {ZChoisi}) : <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{configTxt(ZChoisi)}</span></div>
        </>, cadre('scene'));
    }
    if (idE === 'liaisons') return boite('Des atomes seuls', <><AtomesSeuls/>{aide('Chaque point orange est un électron de valence.')}</>, cadre('scene'));
    if (idE === 'hcl-nt') return boite('Les atomes de la molécule HCl', <CartesAtomes ent={ent('HCl')}/>, cadre('scene'));
    if (idE === 'hcl-nd') return boite('Les électrons de valence de HCl', <><ElectronsEnVrac n={8}/>{aide('Ces électrons vont se regrouper par deux.')}<CartesAtomes ent={ent('HCl')}/></>, cadre('scene'));
    if (idE === 'h2o-nd') return boite('Les atomes de la molécule H₂O', <CartesAtomes ent={ent('H2O')}/>, cadre('scene'));
    if (idE === 'h3o-nd') return boite('Les atomes de l’ion H₃O⁺', <CartesAtomes ent={ent('H3Op')}/>, cadre('scene'));
    if (idE === 'bilan') return boite('Le schéma proposé pour NH₄⁺', <SchemaFixe ent={ENT_BILAN} st={ST_BILAN} titre="Schéma proposé par un élève pour l’ion ammonium." maxWidth={380} s={1} />, cadre('scene'));
    if (bd) {
      return boite(`Schéma de Lewis : ${entG.nom} ${entG.formule}`, <>
        {compteur(entG, stG, bd.nd)}
        <EditeurLewis key={idE} ent={entG} st={stG} outils={bd.outils} onChange={majG} erreurs={ed.verifie && ed.cle === idE ? verG.messages.map(m => m.atome).filter(a => a !== null) : []}/>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <button onClick={verifierG} style={styleBouton(true, '#15803d')}>Vérifier mon schéma</button>
          <IndiceDefi cache={okG}>{bd.indice}</IndiceDefi>
        </div>
        {retourVerif(verG, ed.verifie && ed.cle === idE)}
      </>, cadre('scene'));
    }
    return null;
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const eX = M.entite(ex.id), vX = M.verifier(eX, ex.st, { sansNombres: true });
  const setE = f => setEx(s => ({ ...s, ...f }));
  const choisirX = id => setEx(s => ({ ...s, id, st: M.structureVide(M.entite(id)), verifie: false, aVerifie: false }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const optsGroupe = (titre, liste) => <optgroup label={titre}>{liste.map(e => <option key={e.id} value={e.id}>{e.formule} : {e.nom}</option>)}</optgroup>;
  const molecules = M.ENTITES_PROGRAMME.filter(e => e.q === 0 && e.atomes.length > 1), ions = M.ENTITES_PROGRAMME.filter(e => e.q !== 0);
  const exReglages = (<>
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>Entité à étudier
      <select value={ex.id} onChange={x => choisirX(x.target.value)} style={sel}>
        {optsGroupe('Molécules', molecules)}{optsGroupe('Ions', ions)}{optsGroupe('Au-delà du programme', M.ENTITES_HORS)}</select></label>
    {aide('Choisis une entité, dessine son schéma avec les outils, puis vérifie. Le tableau de suivi (replié) montre en direct les électrons autour de chaque atome.')}
  </>);
  const exScene = (<>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>Doublets placés : <span style={{ color: COL.orange }}>{M.doubletsPlaces(ex.st)}</span></div>
    <EditeurLewis key={ex.id} ent={eX} st={ex.st} outils={['lien', 'doublet', 'charge', 'lacune']} onChange={st => setE({ st, verifie: false })}
      erreurs={ex.verifie ? vX.messages.map(m => m.atome).filter(a => a !== null) : []}/>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
      <button onClick={() => setE({ verifie: true, aVerifie: true })} style={styleBouton(true, '#15803d')}>Vérifier mon schéma</button>
      <button onClick={() => setE({ st: M.structureRef(eX), verifie: true })} disabled={!ex.aVerifie} title="Vérifie d’abord ton propre schéma" style={{ ...styleBouton(false), opacity: ex.aVerifie ? 1 : 0.45, cursor: ex.aVerifie ? 'pointer' : 'not-allowed' }}>Montrer le schéma</button>
    </div>
    {retourVerif(vX, ex.verifie)}
  </>);
  const lignesSuivi = vX.par.map(a => (
    <tr key={a.i} style={{ borderBottom: `1px solid ${KIT.bord}` }}>
      <td style={{ padding: '4px 6px', fontWeight: 800 }}>{a.sym}</td>
      <td style={{ padding: '4px 6px', textAlign: 'center' }}>{M.valenceAtome(a.sym)}</td>
      <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: a.exempt ? COL.gris : a.autour === a.cible ? COL.vert : a.autour > a.cible ? COL.rouge : COL.orange }}>{a.exempt ? 'couche n = 2 pleine' : `${a.autour} sur ${a.cible}${a.autour === a.cible - 2 && ex.st.lac[a.i] ? ' (lacune)' : ''}`}</td>
      <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{chStr(a.formelle)}</td>
    </tr>));
  const exSuivi = (
    <Section titre="Suivi atome par atome" ouvert={!!ex.ouv.suivi} onBascule={() => ouvrir('suivi')}>
      {aide('Pour chaque atome du schéma : ses électrons de valence quand il est seul, les électrons qu’il a autour de lui (8 pour l’octet, 2 pour H) et la charge qui en résulte.')}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead><tr style={{ color: KIT.txt2, fontSize: 12.5 }}><th style={{ padding: '2px 6px', textAlign: 'left' }}>Atome</th><th style={{ padding: '2px 6px' }}>Valence (seul)</th><th style={{ padding: '2px 6px' }}>Autour de lui</th><th style={{ padding: '2px 6px' }}>Charge calculée</th></tr></thead>
          <tbody>{lignesSuivi}</tbody></table></div>
    </Section>);
  const exComptage = (
    <Section titre="Comptage des électrons et des doublets (à ouvrir après avoir essayé)" ouvert={!!ex.ouv.compte} onBascule={() => ouvrir('compte')}>
      <div style={{ fontSize: 14, lineHeight: 1.7 }}>
        {[...new Set(eX.atomes)].map(s => { const k = eX.atomes.filter(a => a === s).length; return <div key={s}>{s} (Z = {M.ZAtome(s)}) : {k > 1 ? `${k} × ` : ''}{M.valenceAtome(s)} électron{M.valenceAtome(s) > 1 ? 's' : ''} de valence</div>; })}
        {eX.q !== 0 && <div>Charge de l’entité : <strong>{chStr(eX.q)}</strong> ({eX.q > 0 ? 'électrons perdus : on les retire' : 'électrons gagnés : on les ajoute'})</div>}
        <div><strong>n<sub>T</sub> = {M.nT(eX)}</strong> électrons de valence, donc <strong>n<sub>D</sub> = {M.nD(eX)}</strong> doublet{M.nD(eX) > 1 ? 's' : ''}.</div>
        {eX.id === 'Nap' && <div style={{ color: KIT.txt2 }}>n<sub>T</sub> = 0 (convention : on ne représente pas la couche n = 2, déjà pleine à 8 électrons) : rien à dessiner, pas de lacune.</div>}
        {eX.id === 'Hp' && <div style={{ color: KIT.txt2 }}>n<sub>T</sub> = 0 : il manque le doublet du duet, d’où la lacune.</div>}
      </div>
    </Section>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Compare NH₃ et NH₄⁺ : combien de doublets chacun ? Où est la charge de l’ion ?</li>
      <li>Compare H₃O⁺ et NH₃ : que remarques-tu sur n<sub>T</sub> et sur le schéma ?</li>
      <li>Dessine H⁺ puis Na⁺ : tous deux ont n<sub>T</sub> = 0. Pourquoi l’un a-t-il une lacune et pas l’autre ?</li>
      <li>Essaie N₂ avec une liaison double puis avec une liaison triple, et lis le suivi atome par atome.</li>
      <li>Au-delà du programme : dessine l’ozone O₃ (deux écritures équivalentes) et AlCl₃ (une lacune sur Al).</li>
    </ul>);
  const retenirExplore = (
    <ARetenir titre="À RETENIR : LES QUATRE VÉRIFICATIONS">
      <SvgVerifications/>
      <ul style={liste}>
        <li>Après avoir dessiné : <strong>n<sub>D</sub> doublets placés</strong>, <strong>8 électrons autour de chaque atome</strong> (2 pour H), <strong>charges correctes</strong>, <strong>lacune</strong> seulement si un doublet manque.</li>
        <li>Exemple de la simulation : NH₄⁺ a 4 doublets, tous liants ; N possède 4 électrons, un de moins que seul : charge +.</li>
        <li><strong>Moyen de s’en souvenir</strong> : « Doublets, Octet, Charges, Lacune ».</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .lw-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .lw-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .lw-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .lw-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .lw-l1.cote .lw-carte { order: 2; } .lw-l1.cote .lw-main { order: 1; }
          .lw-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .lw-ex > .lw-ex-scene { grid-column: 1; grid-row: 1 / span 2; } .lw-ex > .lw-ex-reglages { grid-column: 2; grid-row: 1; } .lw-ex > .lw-ex-suivi { grid-column: 2; grid-row: 2; } }
        @media (max-width: 900px) { .lw-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .lw-in { animation: lw-fondu 0.35s ease-out; } @keyframes lw-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Schéma de Lewis : établir celui d’une molécule ou d’un ion</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le <strong>schéma de Lewis</strong> montre les <strong>électrons de valence</strong> d’une entité sous forme de <strong>doublets</strong> : liants (les liaisons) ou non liants. On le construit en <strong>comptant</strong> les électrons, en les <strong>regroupant par deux</strong>, puis en les <strong>plaçant</strong> pour que chaque atome ait 8 électrons autour de lui (2 pour H).</div>
      {enExplore ? <>
        <div className="lw-ex">
          <div className="lw-ex-reglages">{boite('Choix de l’entité', exReglages)}</div>
          <div className="lw-ex-scene">{boite(`Schéma de Lewis : ${eX.nom} ${eX.formule}`, exScene)}</div>
          <div className="lw-ex-suivi">{exSuivi}{exComptage}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`lw-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="lw-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="lw-carte lw-hypo-defi">{panneauHypo}</div> : null}
          <div className="lw-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'programme' ? suiviP : suiviH}/></div>}
            {enDefi && defi && <div className="lw-in">{boite('Tableau périodique (pour lire les numéros atomiques)', <>
              <TableauPeriodique colorier="aucun" compact aide={false} surligne={[...new Set(entD.atomes)].map(M.ZAtome)}/>
              {aide('Les cases entourées sont les atomes de l’entité. Le numéro atomique Z est écrit dans chaque case.')}</>)}</div>}
            {enGuide && <div className="lw-in" key={idE}>{sceneGuide}</div>}
            {enGuide && (idE === 'bilan' || guide.fini) && <div style={{ marginTop: 12 }}>{panneauHypo}</div>}
          </div>
        </div>
      </>}
    </div>
  );
}
