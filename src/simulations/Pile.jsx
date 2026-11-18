import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, indicesProfond, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./pileModele";
import { QCM_PARCOURS as Q } from "./pileQcm";
import { SceneContact, ScenePile, CourbeUsure, SvgTransfertCarte, SvgPontCarte, SvgPolariteCarte, SvgFonctionCarte, SvgCapaciteCarte, SvgUsureCarte } from "./pileSchemas";

const SIM_ID = 132, CLE_GUIDE = 'piles-tg-guide-v1';
declarerDefis(SIM_ID, [['polarite', 'Polarité et fonctionnement d’une pile inconnue'], ['capacite', 'Capacité et durée de fonctionnement d’une pile']]);

// ====================================================
// SIM 132 — LA PILE (TG spé PC, chapitre « Prévoir l'état final », partie A « Prévoir le sens de l'évolution spontanée d'un système chimique »).
//  Une seule idée : une pile sépare l'oxydant et le réducteur d'une réaction spontanée, pour que les électrons passent par un circuit extérieur.
//  Capacités visées (jamais affichées à l'élève) : illustrer un transfert spontané d'électrons par contact et par un circuit extérieur ;
//  justifier la séparation en deux demi-piles et le pont salin ; modéliser le fonctionnement d'une pile ; déterminer sa capacité électrique
//  à partir de sa constitution initiale ; tension à vide, polarité, rôle du pont salin ; usure (Qr → K).
//  Modèle : pileModele.js (tension à vide calculée par la loi de Nernst, hors programme, jamais affichée).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (x, cs = 2) => { if (x === 0) return '0'; const [m, e] = Number(x).toExponential(cs - 1).split('e'); return Number(e) === 0 ? m.replace('.', ',') : `${m.replace('.', ',')} × 10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const I_GUIDE = 50;      // mA, intensité supposée constante pendant le fonctionnement (parcours)
const DP = id => ({ id, c: 0.10, V: 100, m: 2.0 });
const PRESET = { g: DP('zn'), d: DP('cu'), pont: true, app: 'volt', borneV: 'd', t: 0, I: 50,
  gv: { plonge: false, pont: false, inv: false, debit: false, t: 0 } };
const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
const lu = U => `${U >= 0 ? '' : '−'}${nbf(Math.abs(U), 2)} V`;

// ====================================================
export function SimulationPile() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ g: false, d: false, essayer: false, retenir: false });
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));
  const setGv = f => setTi(s => ({ ...s, gv: { ...s.gv, ...f } }));

  // ---------- étapes du parcours ----------
  const IDS = ['contact', 'separer', 'pont', 'polarite', 'sens', 'electrodes', 'ions', 'limitant', 'capacite', 'usure', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);
  const gv = ti.gv;

  // ---------- situation affichée ----------
  const g = enGuide ? DP('zn') : ti.g, d = enGuide ? DP('cu') : ti.d;
  const pont = enGuide ? (idE === 'separer' ? false : idE === 'pont' ? gv.pont : true) : ti.pont;
  const I = enGuide ? I_GUIDE : ti.I;
  const debitPossible = enGuide ? ['electrodes', 'ions', 'limitant', 'capacite'].includes(idE) && gv.debit : ti.app === 'res' && pont;
  const tH = enGuide ? (deja('usure') ? gv.t : 0) : (pont ? ti.t : 0);
  const ne = I / 1000 * tH * 3600 / M.F;
  const et = M.etat(g, d, ne), et0 = M.etat(g, d, 0);
  const app = enGuide ? (idE === 'contact' ? 'aucun' : ['electrodes', 'ions', 'limitant', 'capacite'].includes(idE) && gv.debit ? 'res' : 'volt') : ti.app;
  const borneV = enGuide ? (idE === 'polarite' && gv.inv ? 'g' : 'd') : ti.borneV;
  const U = pont ? M.lecture(g, d, ne, borneV) : 0;
  const tMax = et0.Qmax / (I / 1000) / 3600;
  const tCurseurMax = enGuide ? 12 : Math.max(1, Math.ceil(tMax * 1.15));

  const bloquePlonge = gv.plonge ? null : 'Plongez d’abord la lame de zinc avec le bouton « Plonger la lame de zinc » sous le schéma.';
  const bloquePont = gv.pont ? null : 'Ajoutez d’abord le pont salin avec le bouton « Ajouter le pont salin » sous le schéma.';
  const bloqueInv = gv.invVu ? null : 'Inversez d’abord les deux fils avec le bouton « Inverser les branchements » sous le schéma, puis revenez au premier branchement si vous le souhaitez.';
  const bloqueDebit = gv.debit ? null : 'Faites d’abord débiter la pile avec le bouton « Brancher un conducteur ohmique » sous le schéma.';
  const bloqueUsure = gv.t >= 11 ? null : 'Avec le curseur « Durée de fonctionnement », faites fonctionner la pile au moins 11 h.';

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'contact', titre: 'Du zinc dans une solution d’ions cuivre', focus: ['scene'],
      texte: <>Un bécher contient une solution bleue de sulfate de cuivre(II) : elle contient des ions Cu²⁺ (responsables de la couleur bleue) et SO₄²⁻. Plongez-y une lame de zinc Zn avec le bouton sous le schéma, puis observez la lame et la couleur de la solution.</>,
      tache: { type: 'qcm', q: 'Que s’est-il passé entre la lame de zinc et la solution ?', ...Q.contact, bloque: bloquePlonge,
        expl: 'Le zinc est oxydé (Zn → Zn²⁺ + 2 e⁻) et les ions Cu²⁺ sont réduits (Cu²⁺ + 2 e⁻ → Cu). Bilan : Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s). Les électrons passent directement du zinc aux ions Cu²⁺, au contact de la lame : la transformation est spontanée, son énergie part en chaleur.',
        indice: 'Le dépôt rouge est du cuivre métallique Cu ; la solution pâlit car il reste moins d’ions Cu²⁺. Pour passer de Cu²⁺ à Cu, il faut gagner des électrons : qui les a donnés ?' } },
    { id: 'separer', titre: 'Séparer les deux réactifs', focus: ['scene'],
      texte: <>On sépare maintenant les réactifs. À gauche, une lame de zinc plonge dans 100{NB}mL de sulfate de zinc (Zn²⁺ à 0,10{NB}mol/L) : c’est une <strong>demi-pile</strong>. À droite, une lame de cuivre plonge dans 100{NB}mL de sulfate de cuivre (Cu²⁺ à 0,10{NB}mol/L) : seconde demi-pile. Un voltmètre relie les deux lames. Il indique 0,00{NB}V : pour l’instant, rien ne relie les deux solutions.</>,
      tache: { type: 'qcm', q: 'Pourquoi place-t-on le zinc et les ions Cu²⁺ dans deux béchers séparés ?', ...Q.separer,
        expl: 'Au contact direct, les électrons passent du zinc aux ions Cu²⁺ sans que l’on puisse les utiliser. En séparant les deux réactifs, les électrons sont obligés de passer par les fils et l’appareil branché entre les lames : on récupère l’énergie de la réaction sous forme électrique.',
        indice: 'Au contact, les électrons vont directement du zinc aux ions Cu²⁺. Si les réactifs ne se touchent plus, par où les électrons doivent-ils passer ?' } },
    { id: 'pont', titre: 'Le pont salin', focus: ['scene'],
      retenirTitre: 'À RETENIR : MÊME RÉACTION, DEUX CHEMINS',
      retenir: <>
        <SvgTransfertCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Zinc dans une solution d’ions Cu²⁺ : transfert <strong>direct</strong> d’électrons, Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s) ; l’énergie part en chaleur.</li>
          <li>Dans une <strong>pile</strong>, le réducteur (Zn) et l’oxydant (Cu²⁺) sont <strong>séparés</strong> dans deux demi-piles : les électrons passent par le <strong>circuit extérieur</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« séparer pour récupérer »</strong>. Idée fausse : « on sépare les réactifs pour qu’ils ne réagissent pas ». Vrai : ils réagissent, mais à distance, par le fil.</li>
        </ul></>,
      texte: <>On ajoute un <strong>pont salin</strong> : un tube en U rempli d’un gel contenant des ions potassium K⁺ et nitrate NO₃⁻, qui plonge dans les deux solutions. Ajoutez-le avec le bouton sous le schéma et lisez le voltmètre.</>,
      tache: { type: 'qcm', q: 'Le voltmètre indique maintenant 1,10 V. Quel est le rôle du pont salin ?', ...Q.pont, bloque: bloquePont,
        expl: 'Les électrons circulent dans les fils et les lames, jamais dans les solutions. Le pont salin ferme le circuit : ses ions K⁺ et NO₃⁻ se déplacent et assurent l’électroneutralité de chaque solution. Sans pont salin, le circuit est ouvert et la pile ne fonctionne pas.',
        indice: 'Les électrons ne peuvent pas traverser une solution aqueuse. Que contient le pont salin, et qu’est-ce qui peut s’y déplacer ?' } },
    { id: 'polarite', titre: 'Polarité et tension à vide', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE PONT SALIN',
      retenir: <>
        <SvgPontCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Le <strong>pont salin</strong> (gel d’ions K⁺ et NO₃⁻) relie les deux solutions : il <strong>ferme le circuit</strong> et maintient chaque solution <strong>électriquement neutre</strong>.</li>
          <li>Exemple de la simulation : sans pont salin, 0,00 V ; avec le pont salin, 1,10 V pour la pile zinc-cuivre.</li>
          <li>Moyen de s’en souvenir : <strong>« les électrons par les fils, les ions par le pont »</strong>. Idée fausse : « les électrons traversent le pont salin ». Vrai : aucun électron ne traverse une solution.</li>
        </ul></>,
      texte: <>Le voltmètre affiche 1,10{NB}V. Cette tension mesurée quand la pile ne débite aucun courant (le voltmètre ne laisse passer presque aucun courant) est la <strong>tension à vide</strong> de la pile. Sa borne V est reliée à la lame de cuivre, sa borne COM à la lame de zinc. Inversez les deux fils avec le bouton sous le schéma et observez le signe de la valeur affichée.</>,
      tache: { type: 'qcm', q: 'Avec la borne V sur le cuivre et la borne COM sur le zinc, le voltmètre affiche + 1,10 V. Quelle électrode est le pôle + ?', ...Q.polarite, bloque: bloqueInv,
        expl: 'Un voltmètre affiche une valeur positive quand sa borne V est reliée au pôle + : la lame de cuivre est le pôle +, la lame de zinc le pôle −. En inversant les fils, la valeur change de signe (− 1,10 V) mais la polarité de la pile ne change pas.',
        indice: 'Un voltmètre affiche U = V(borne V) − V(borne COM). Une valeur positive signifie que la borne V est sur le pôle de plus haut potentiel, le pôle +.' } },
    { id: 'sens', titre: 'Le sens d’évolution confirme la polarité', focus: ['equation'],
      retenirTitre: 'À RETENIR : POLARITÉ ET TENSION À VIDE',
      retenir: <>
        <SvgPolariteCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>La <strong>tension à vide</strong> est la tension entre les bornes d’une pile qui ne débite pas (mesurée au voltmètre).</li>
          <li>Si le voltmètre affiche une valeur <strong>positive</strong>, sa <strong>borne V</strong> est reliée au <strong>pôle +</strong>. Exemple : + 1,10 V avec V sur le cuivre : le cuivre est le pôle +.</li>
          <li>Moyen de s’en souvenir : <strong>« V comme valeur positive, V sur le + »</strong>. Idée fausse : « une tension négative veut dire que la pile est à l’envers ». Vrai : c’est le voltmètre qui est branché à l’envers.</li>
        </ul></>,
      texte: <>La pile met en jeu la même réaction que le contact direct : Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s), de constante d’équilibre K ≈ 1,9 × 10³⁷ à 25{NB}°C. Au départ, les deux solutions ont la même concentration (0,10{NB}mol/L), donc le quotient de réaction initial vaut Q_r,i = frac([Zn²⁺]|[Cu²⁺]) = frac(0,10|0,10) = 1.</>,
      tache: { type: 'qcm', q: 'On compare Q_r,i = 1 et K ≈ 1,9 × 10³⁷. Dans quel sens le système évolue-t-il spontanément ?', ...Q.sens,
        expl: 'Q_r,i < K : le système évolue spontanément dans le sens direct. Le zinc est oxydé et cède des électrons, qui sortent par la lame de zinc : c’est bien le pôle −, comme le montre le voltmètre. La lame de cuivre, où les ions Cu²⁺ sont réduits, est le pôle +.',
        indice: 'Critère d’évolution : si Q_r < K, le système évolue dans le sens direct de l’équation écrite ; si Q_r > K, dans le sens inverse ; si Q_r = K, il est à l’équilibre.' } },
    { id: 'electrodes', titre: 'La pile débite', focus: ['scene'],
      texte: <>On remplace le voltmètre par un conducteur ohmique : la pile débite un courant. Branchez-le avec le bouton sous le schéma et observez le déplacement des électrons (en vert) dans les fils. La lame de zinc est le pôle −, la lame de cuivre le pôle +.</>,
      tache: { type: 'qcm', q: 'Quelle réaction a lieu à la surface de la lame de zinc (pôle −) ?', ...Q.electrodes, bloque: bloqueDebit,
        expl: 'Au pôle −, le zinc est oxydé : Zn(s) → Zn²⁺(aq) + 2 e⁻. Les électrons libérés partent dans le fil, vers le pôle +, où les ions Cu²⁺ sont réduits : Cu²⁺(aq) + 2 e⁻ → Cu(s). L’électrode où a lieu l’oxydation s’appelle l’anode, celle où a lieu la réduction la cathode.',
        indice: 'Les électrons sortent de la pile par le pôle − : la lame de zinc doit les fournir. Quelle demi-équation libère des électrons à partir du zinc métallique ?' } },
    { id: 'ions', titre: 'Et dans le pont salin ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE FONCTIONNEMENT D’UNE PILE',
      retenir: <>
        <SvgFonctionCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Pôle − (<strong>anode</strong>) : <strong>oxydation</strong> du réducteur, Zn(s) → Zn²⁺(aq) + 2 e⁻. Pôle + (<strong>cathode</strong>) : <strong>réduction</strong> de l’oxydant, Cu²⁺(aq) + 2 e⁻ → Cu(s).</li>
          <li>Dans le circuit extérieur, les <strong>électrons</strong> vont du pôle − vers le pôle + ; le courant électrique I va en sens inverse.</li>
          <li>Moyen de s’en souvenir : <strong>« Anode-Oxydation, deux voyelles ; Cathode-Réduction, deux consonnes »</strong>. Idée fausse : « le pôle + reçoit des ions positifs du fil ». Vrai : il reçoit des électrons.</li>
        </ul></>,
      texte: <>Pendant le fonctionnement, des ions Zn²⁺ apparaissent dans le bécher du zinc et des ions Cu²⁺ disparaissent du bécher du cuivre. Sans compensation, la solution du zinc deviendrait chargée positivement et celle du cuivre négativement. Ce sont les ions K⁺ et NO₃⁻ du pont salin qui rétablissent l’électroneutralité.</>,
      tache: { type: 'qcm', q: 'Comment se déplacent les ions du pont salin quand la pile débite ?', ...Q.ions,
        expl: 'Dans le bécher du zinc, il apparaît des charges positives (Zn²⁺) : les anions NO₃⁻ y migrent. Dans le bécher du cuivre, des charges positives disparaissent (Cu²⁺) : les cations K⁺ y migrent. Le schéma montre maintenant ces déplacements. Les électrons, eux, ne quittent jamais les fils et les lames.',
        indice: 'Le bécher du zinc gagne des ions positifs Zn²⁺ : quels ions du pont faut-il y apporter pour le garder neutre ? Le bécher du cuivre perd des ions positifs Cu²⁺ : que faut-il y apporter ?' } },
    { id: 'limitant', titre: 'Jusqu’où la pile peut-elle fonctionner ?', focus: ['mesures'],
      texte: <>La pile fonctionne tant que la réaction Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s) peut avancer. Sa constitution initiale : 100{NB}mL de solution d’ions Cu²⁺ à 0,10{NB}mol/L, et une lame de zinc dont la partie immergée a une masse de 2,0{NB}g (M(Zn) = 65,4{NB}g/mol). Les ions Zn²⁺ et le cuivre sont des produits : ils ne limitent pas la réaction.</>,
      tache: { type: 'num', q: 'Avancement maximal x_max de la réaction', unite: 'mol', vrai: 0.010, tol: 0.05, cs: 2, affiche: x => sci(x, 2),
        calcul: () => ['n(Cu²⁺) = c × V = 0,10 mol/L × 0,100 L = 1,0 × 10⁻² mol.', 'n(Zn) = frac(m|M) = frac(2,0 g|65,4 g/mol) = 3,1 × 10⁻² mol.', 'Coefficients stœchiométriques égaux à 1 : x_max est la plus petite des deux quantités, x_max = 1,0 × 10⁻² mol (Cu²⁺ est le réactif limitant).'],
        pieges: [[0.0306, 'C’est la quantité de zinc : le zinc est en excès. Comparez avec la quantité d’ions Cu²⁺.'], [10, 'Valeur en mmol : convertissez le volume en litres (100 mL = 0,100 L) pour obtenir des moles.'], [0.020, 'C’est la quantité d’électrons échangés (2 par ion Cu²⁺), pas l’avancement maximal.'], [0.0406, 'Ne faites pas la somme des deux quantités : x_max est la plus petite d’entre elles.']],
        expl: 'n(Cu²⁺) = 1,0 × 10⁻² mol et n(Zn) = 3,1 × 10⁻² mol : les ions Cu²⁺ sont limitants, x_max = 1,0 × 10⁻² mol.',
        indice: 'Calculez n(Cu²⁺) = c × V (V en L) et n(Zn) = frac(m|M). Avec les coefficients 1 et 1 de l’équation, l’avancement maximal est la plus petite des deux quantités.' } },
    { id: 'capacite', titre: 'La capacité électrique de la pile', focus: ['mesures'],
      texte: <>La <strong>capacité électrique</strong> Q d’une pile est la charge électrique maximale qu’elle peut faire circuler : Q = n(e⁻) × F, où n(e⁻) est la quantité d’électrons échangés et F = 9,65 × 10⁴{NB}C/mol la charge d’une mole d’électrons (constante de Faraday). Vous avez trouvé x_max = 1,0 × 10⁻²{NB}mol. Au pôle +, Cu²⁺(aq) + 2 e⁻ → Cu(s) : deux électrons par ion Cu²⁺ réduit.</>,
      tache: { type: 'num', q: 'Capacité électrique Q de la pile', unite: 'C', vrai: 1930, tol: 0.05, cs: 2, affiche: x => sci(x, 2),
        calcul: () => ['Deux électrons échangés par ion Cu²⁺ réduit : n(e⁻) = 2 × x_max = 2 × 1,0 × 10⁻² = 2,0 × 10⁻² mol.', 'Q = n(e⁻) × F = 2,0 × 10⁻² mol × 9,65 × 10⁴ C/mol = 1,9 × 10³ C.'],
        pieges: [[965, 'Vous avez oublié que chaque ion Cu²⁺ capte 2 électrons : n(e⁻) = 2 × x_max.'], [482.5, 'Il faut multiplier x_max par 2, pas le diviser : 2 électrons par ion Cu²⁺.'], [1.93e6, 'Vous avez utilisé x_max en mmol : il faut des moles (F est en C/mol).'], [5900, 'Vous êtes parti de la quantité de zinc, qui est en excès : c’est le réactif limitant qui fixe la capacité.']],
        expl: 'n(e⁻) = 2 x_max = 2,0 × 10⁻² mol ; Q = 2,0 × 10⁻² × 9,65 × 10⁴ = 1,9 × 10³ C.',
        indice: 'D’abord n(e⁻) = 2 × x_max (deux électrons par ion Cu²⁺), puis Q = n(e⁻) × F avec n(e⁻) en mol.' } },
    { id: 'usure', titre: 'L’usure de la pile', focus: ['reglage', 'courbe'],
      retenirTitre: 'À RETENIR : LA CAPACITÉ D’UNE PILE',
      retenir: <>
        <SvgCapaciteCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>La <strong>capacité</strong> d’une pile est la charge maximale qu’elle peut débiter : Q = n(e⁻) × F, avec F = 9,65 × 10⁴ C/mol.</li>
          <li>n(e⁻) se déduit du <strong>réactif limitant</strong> et de la demi-équation. Exemple : x_max = 1,0 × 10⁻² mol et Cu²⁺ + 2 e⁻ → Cu, donc n(e⁻) = 2,0 × 10⁻² mol et Q = 1,9 × 10³ C.</li>
          <li>Moyen de s’en souvenir : <strong>« d’abord le limitant, puis les électrons, puis F »</strong>. Piège classique : oublier le facteur 2 (Q = x_max × F).</li>
        </ul></>,
      texte: <>La pile (capacité Q = 1,9 × 10³{NB}C) débite maintenant un courant d’intensité constante I = 50{NB}mA. Avec le curseur, faites-la fonctionner de plus en plus longtemps : après chaque durée, le voltmètre mesure sa tension à vide. Le graphique montre la tension à vide selon la charge débitée.</>,
      tache: { type: 'qcm', q: 'Pourquoi la tension à vide finit-elle par devenir nulle ?', ...Q.usure, bloque: bloqueUsure,
        expl: 'Après 1,9 × 10³ C (environ 10,7 h à 50 mA), tous les ions Cu²⁺ ont été réduits : le réactif limitant est épuisé. Le quotient de réaction Q_r = frac([Zn²⁺]|[Cu²⁺]) est alors devenu égal à K : le système est à l’équilibre, il n’évolue plus, la pile est usée. Il reste du zinc (la lame pèse encore environ 1,3 g).',
        indice: 'Regardez dans les mesures la quantité d’ions Cu²⁺ et la masse de zinc restantes quand la tension s’annule. Quel réactif a disparu ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : UNE PILE S’USE',
      retenir: <>
        <SvgUsureCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Tant que Q_r &lt; K, la réaction évolue dans le sens direct et la pile débite ; sa tension à vide reste presque constante.</li>
          <li>Quand le <strong>réactif limitant</strong> est épuisé, Q_r = K : le système est à l’<strong>équilibre</strong>, la tension s’annule, la pile est <strong>usée</strong>. Exemple : 1,9 × 10³ C, soit 10,7 h à 50 mA.</li>
          <li>Moyen de s’en souvenir : <strong>« pile usée = pile à l’équilibre »</strong>. Idée fausse : « une pile usée a perdu ses électrons ». Vrai : un de ses réactifs est épuisé.</li>
        </ul></>,
      texte: <>Vous savez expliquer une pile : un transfert spontané d’électrons, rendu indirect en séparant les réactifs dans deux demi-piles reliées par un pont salin ; une polarité et une tension à vide mesurées au voltmètre ; une oxydation au pôle − et une réduction au pôle + ; une capacité Q = n(e⁻) × F fixée par le réactif limitant ; une usure quand Q_r atteint K. Passez à l’exploration (autres métaux, concentrations, volumes) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'polarite') {
      const t = M.tirageDefiPolarite(), ox = [M.demiOx(t.moins), M.demiRed(t.moins), M.demiOx(t.plus), M.demiRed(t.plus)];
      const ordre = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      setDefi({ type, ...t, options: ordre.map(i => ox[i]), bonneOx: ordre.indexOf(0), reps: { plus: null, ox: null, anions: null }, verifie: false });
    } else setDefi({ type, ...M.tirageDefiCapacite(), reps: { Q: '', t: '' }, verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi('polarite');
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s, g: s.g || PRESET.g }));
  }
  const TOL_Q = 0.065, TOL_T = 0.10;   // pire écart d'un élève qui arrondit chaque étape à 2 chiffres significatifs : 6,0 % sur Q, 7,6 % sur la durée (calculé par script)
  const verifier = () => {
    if (defi.type === 'polarite') {
      const coteMoins = defi.g.id === defi.moins ? 'g' : 'd';
      const ok = defi.reps.plus === defi.plus && defi.reps.ox === defi.bonneOx && defi.reps.anions === coteMoins;
      setDefi(x => ({ ...x, verifie: true, ok })); noterP(ok);
    } else {
      const q = lireNombre(defi.reps.Q), t = lireNombre(defi.reps.t);
      const okQ = isFinite(q) && Math.abs(q - defi.Q) / defi.Q <= TOL_Q, okT = isFinite(t) && Math.abs(t - defi.duree) / defi.duree <= TOL_T;
      setDefi(x => ({ ...x, verifie: true, ok: okQ && okT, okQ, okT })); noterC(okQ && okT);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const saisie = (val, cle, aria, ok) => <input value={val} aria-label={aria} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('pl-verif')?.click()}
    onChange={e => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e.target.value }, verifie: false }))}
    style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi && defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>;
  const choix = (cle, val, txt, bon) => <button key={String(val)} onClick={() => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: val }, verifie: false }))} aria-pressed={defi.reps[cle] === val}
    style={{ ...stylePetitBouton(defi.reps[cle] === val, defi.verifie ? (bon ? '#15803d' : '#dc2626') : '#475569'), textAlign: 'left' }}>{txt}</button>;
  const voletDefi = defi && (() => {
    const A = defi.type === 'polarite' ? null : M.METAUX[defi.moins], C = defi.type === 'polarite' ? null : M.METAUX[defi.plus];
    return (
      <div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['polarite', 'Polarité d’une pile'], ['capacite', 'Capacité d’une pile']].map(([t, l]) => <button key={t} onClick={() => nouveauDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
        </div>
        {defi.type === 'polarite' ? <>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : comment fonctionne cette pile ?</div>
          <div style={{ ...lbl, marginBottom: 8 }}>Deux demi-piles sont reliées par un pont salin (K⁺, NO₃⁻). Le voltmètre a sa borne V sur la lame de <strong>{M.METAUX[defi.borneV === 'g' ? defi.g.id : defi.d.id].nom}</strong> et sa borne COM sur la lame de <strong>{M.METAUX[defi.borneV === 'g' ? defi.d.id : defi.g.id].nom}</strong> ; il affiche <strong>{lu(defi.lu)}</strong>.</div>
          <ScenePile g={defi.g} d={defi.d} et={M.etat(defi.g, defi.d, 0)} pont appareil="volt" borneV={defi.borneV} affichage={lu(defi.lu)}/>
          <div style={{ ...lbl, fontWeight: 700, margin: '6px 0 4px' }}>1. Quel métal est le pôle + ?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[defi.g.id, defi.d.id].map(id => choix('plus', id, `la lame de ${M.METAUX[id].nom}`, id === defi.plus))}</div>
          <div style={{ ...lbl, fontWeight: 700, margin: '8px 0 4px' }}>2. Quelle réaction a lieu au pôle − quand la pile débite ?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{defi.options.map((o, i) => choix('ox', i, o, i === defi.bonneOx))}</div>
          <div style={{ ...lbl, fontWeight: 700, margin: '8px 0 4px' }}>3. Vers quel bécher migrent les ions NO₃⁻ du pont salin ?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{[['g', 'bécher de gauche'], ['d', 'bécher de droite']].map(([c, t]) => choix('anions', c, `${t} (${M.METAUX[c === 'g' ? defi.g.id : defi.d.id].nom})`, (c === 'g' ? defi.g.id : defi.d.id) === defi.moins))}</div>
          <IndiceDefi cache={defi.verifie && defi.ok}>Valeur positive : la borne V est sur le pôle +. Au pôle −, le métal est oxydé et libère des électrons. Les anions NO₃⁻ vont là où apparaissent des cations, donc vers le pôle −.</IndiceDefi>
        </> : <>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle charge cette pile peut-elle débiter ?</div>
          <div style={{ ...lbl, marginBottom: 6 }}>Réaction de fonctionnement : <Esp><strong>{M.equationTexte(defi.moins, defi.plus)}</strong></Esp>.</div>
          <ul style={{ ...lbl, margin: '0 0 8px', paddingLeft: 18 }}>
            <li>Pôle + : {nbf(defi.V, 0)}{NB}mL de solution de {C.sol} ; concentration en ions {C.ion} : {nbf(defi.c, defi.c < 0.1 ? 3 : 2)}{NB}mol/L.</li>
            <li>Pôle − : lame de {A.nom} dont la partie immergée a une masse de {nbf(defi.m, defi.m < 1 ? 2 : 1)}{NB}g ; M({A.m}) = {nbf(A.M, 1)}{NB}g/mol.</li>
            <li>Demi-équations : {M.demiRed(defi.plus)} ; {M.demiOx(defi.moins)}. F = 9,65 × 10⁴{NB}C/mol.</li>
          </ul>
          <div style={{ ...lbl, marginBottom: 6 }}>Calculez la capacité Q de la pile, puis la durée de fonctionnement si elle débite un courant constant de <strong>{defi.I}{NB}mA</strong>. Donnez vos résultats avec 2 chiffres significatifs (gardez 3 chiffres dans les calculs intermédiaires).</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}><span>Q =</span>{saisie(defi.reps.Q, 'Q', 'Capacité de la pile en coulombs', defi.okQ)}<span>C</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}><span>Durée =</span>{saisie(defi.reps.t, 't', 'Durée de fonctionnement en heures', defi.okT)}<span>h</span></div>
          <IndiceDefi cache={defi.verifie && defi.ok}>Calculez les quantités initiales des deux réactifs (n = c × V, V en L ; n = frac(m|M)), puis la quantité d’électrons que chacun peut échanger (demi-équations). Le plus petit nombre d’électrons fixe n(e⁻). Ensuite Q = n(e⁻) × F, puis Δt = frac(Q|I) avec I en A ; 1 h = 3 600 s.</IndiceDefi>
        </>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button id="pl-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
          <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
          <strong>{defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}</strong>
          {defi.type === 'polarite'
            ? `Le pôle + est la lame de ${M.METAUX[defi.plus].nom} (valeur ${defi.lu > 0 ? 'positive : la borne V y est reliée' : 'négative : la borne V est sur le pôle −'}). Au pôle −, ${M.demiOx(defi.moins)} (oxydation). Les ions NO₃⁻ migrent vers le bécher du ${M.METAUX[defi.moins].nom}, où apparaissent des ions ${M.METAUX[defi.moins].ion}.`
            : indicesProfond(`Réactif limitant : ${defi.limitant === 'ion' ? `ions ${C.ion} (${sci(defi.nIon, 3)} mol, soit ${sci(defi.neIon, 3)} mol d’électrons)` : `${A.nom} (${sci(defi.nMet, 3)} mol, soit ${sci(defi.neMet, 3)} mol d’électrons)`}. `
              + `Q = ${sci(defi.ne, 3)} × 9,65 × 10⁴ = ${sci(defi.Q, 2)} C ; Δt = frac(${sci(defi.Q, 3)} C|${nbf(defi.I / 1000, 3)} A) = ${sci(defi.Q / (defi.I / 1000), 3)} s, soit ${sci(defi.duree, 2)} h `
              + `(marges acceptées : ${Math.round(TOL_Q * 100)} % sur Q, ${Math.round(TOL_T * 100)} % sur la durée).`)}
        </div>}
      </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; solutions diluées (activités ≈ concentrations).</li>
      <li><strong>Tension à vide</strong> : elle est « mesurée » par un voltmètre idéal (aucun courant). La simulation la calcule par une loi hors programme (loi de Nernst) à partir des concentrations ; en Terminale, on la mesure, on ne la calcule pas. Une vraie pile zinc-cuivre donne un peu moins de 1,10 V.</li>
      <li><strong>Pont salin</strong> au nitrate de potassium (K⁺, NO₃⁻), jamais épuisé ; il ne réagit avec aucune espèce (un pont au chlorure de potassium précipiterait avec les ions Ag⁺).</li>
      <li><strong>Pas de réaction parasite</strong> : pas d’action des ions H₃O⁺ ni du dioxygène dissous sur les métaux, pas d’oxydation des ions Fe²⁺ par l’air.</li>
      <li><strong>Toute la partie immergée de la lame peut réagir</strong> ; la masse indiquée est celle de cette partie.</li>
      <li><strong>Intensité constante</strong> pendant le fonctionnement (en réalité, elle diminue un peu) ; on ne modélise pas la résistance interne de la pile.</li>
      <li><strong>Usure</strong> : la réaction est quasi totale (K très grand) ; la pile est usée quand le réactif limitant est épuisé, c’est-à-dire quand Q_r atteint K.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(hypotheses)}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène et commandes ----------
  const affichage = app === 'volt' ? lu(U) : '';
  const bouton = (txt, onClick, actif, c = '#0369a1', pressed) => <button key={txt} onClick={onClick} aria-pressed={pressed} style={stylePetitBouton(actif, c)}>{txt}</button>;
  const commandesGuide = enGuide && (
    (idE === 'contact' && !gv.plonge && bouton('Plonger la lame de zinc', () => setGv({ plonge: true }), true))
    || (idE === 'pont' && !gv.pont && bouton('Ajouter le pont salin', () => setGv({ pont: true }), true))
    || (idE === 'polarite' && bouton('Inverser les branchements', () => setGv({ inv: !gv.inv, invVu: true }), true, '#0369a1'))
    || (idE === 'electrodes' && !gv.debit && bouton('Brancher un conducteur ohmique', () => setGv({ debit: true }), true))
    || null);
  // ---------- exploration : réglages dans des menus déroulants, blocs repliables ----------
  const ouvre = k => ouv[k], bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const liste = (nom, valeur, options, onChange, large) => (
    <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, gridColumn: large ? '1 / -1' : undefined, minWidth: 0 }}>{nom}
      <select value={valeur} onChange={e => onChange(e.target.value)} style={{ ...menu, marginTop: 2 }}>
        {options.map(o => <option key={o.v} value={o.v} disabled={o.off}>{o.t}</option>)}
      </select>
    </label>);
  const resume = cote => { const x = ti[cote]; return `${M.METAUX[x.id].ion} / ${M.METAUX[x.id].m} · ${nbf(x.c, x.c < 1 ? 2 : 1)}${NB}mol/L · ${x.V}${NB}mL · ${nbf(x.m, 1)}${NB}g`; };
  const reglesCote = cote => {
    const x = ti[cote], autre = cote === 'g' ? ti.d.id : ti.g.id, maj = f => setT({ [cote]: { ...x, ...f }, t: 0 });
    return (
      <Section key={cote} titre={<span><span style={{ display: 'block' }}>Demi-pile de {cote === 'g' ? 'gauche' : 'droite'}</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{resume(cote)}</span></span>}
        ouvert={ouvre(cote)} onBascule={() => bascule(cote)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {liste('Couple (lame et solution)', x.id, M.ORDRE.map(id => ({ v: id, t: `${M.METAUX[id].ion} / ${M.METAUX[id].m}`, off: id === autre })), v => maj({ id: v }), true)}
          {liste(`Concentration en ions ${M.METAUX[x.id].ion}`, String(x.c), [0.01, 0.05, 0.10, 0.50, 1.0].map(c => ({ v: String(c), t: `${nbf(c, c < 1 ? 2 : 1)} mol/L` })), v => maj({ c: Number(v) }), true)}
          {liste('Volume de solution', String(x.V), [50, 100, 200].map(V => ({ v: String(V), t: `${V} mL` })), v => maj({ V: Number(v) }))}
          {liste('Masse de lame immergée', String(x.m), [0.5, 1.0, 2.0, 5.0].map(m => ({ v: String(m), t: `${nbf(m, 1)} g` })), v => maj({ m: Number(v) }))}
        </div>
      </Section>);
  };
  const reglagesExplore = enExplore && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Construire la pile</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6, lineHeight: 1.4 }}>Touchez une demi-pile pour changer le métal, la concentration, le volume ou la masse.</div>
      {reglesCote('g')}{reglesCote('d')}
    </div>);
  const commandesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Brancher et faire fonctionner</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 8, lineHeight: 1.4 }}>Sans pont salin, le circuit est ouvert. Le voltmètre mesure la tension à vide ; le conducteur ohmique fait débiter la pile.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        {liste('Pont salin', ti.pont ? 'oui' : 'non', [{ v: 'oui', t: 'Présent' }, { v: 'non', t: 'Retiré' }], v => setT({ pont: v === 'oui' }))}
        {liste('Appareil branché', ti.app, [{ v: 'volt', t: 'Voltmètre' }, { v: 'res', t: 'Conducteur ohmique' }], v => setT({ app: v }))}
        {ti.app === 'volt' && liste('Borne V reliée au pôle', ti.borneV, [{ v: 'd', t: 'de droite' }, { v: 'g', t: 'de gauche' }], v => setT({ borneV: v }))}
        {liste('Intensité du courant I', String(ti.I), [20, 50, 100].map(i => ({ v: String(i), t: `${i} mA` })), v => setT({ I: Number(v), t: 0 }))}
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, margin: '10px 0 2px', lineHeight: 1.4 }}>Le curseur règle depuis combien de temps la pile débite I.</div>
      <Curseur nom="Durée de fonctionnement" valeur={ti.t} onChange={t => setT({ t })} min={0} max={tCurseurMax} pas={tCurseurMax > 40 ? 1 : 0.5} decimales={tCurseurMax > 40 ? 0 : 1} unite="h"/>
      {!ti.pont && <div style={{ fontSize: 13.5, color: COL.rouge }}>Sans pont salin, la pile ne débite pas : la durée n’a pas d’effet.</div>}
    </div>);
  const reglageUsure = enGuide && deja('usure') && (
    <div style={{ ...styleBoite, ...cadre('reglage') }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>La pile débite I = 50{NB}mA ; le curseur règle depuis combien de temps elle fonctionne.</div>
      <Curseur nom="Durée de fonctionnement" valeur={gv.t} onChange={t => setGv({ t })} min={0} max={12} pas={0.5} decimales={1} unite="h"/>
    </div>);

  const montrerEq = enExplore || apres('contact');
  const boxEquation = !dd && montrerEq && idE !== 'contact' && (
    <div style={{ ...styleBoite, textAlign: 'center', ...cadre('equation') }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 2 }}>Réaction de fonctionnement de la pile</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: KIT.txt, lineHeight: 1.6 }}>{M.equationTexte(et.moins, et.plus).split(' ').reduce((acc, m) => (m === '+' || m === '→' ? [...acc, m] : acc.length && acc[acc.length - 1] !== '+' && acc[acc.length - 1] !== '→' ? [...acc.slice(0, -1), acc[acc.length - 1] + ' ' + m] : [...acc, m]), []).map((m, i) => <span key={i}>{i ? ' ' : ''}<Esp>{m}</Esp></span>)}</div>
      {(enExplore || apres('electrodes')) && <div style={{ fontSize: 15, color: KIT.txt, marginTop: 4, lineHeight: 1.6 }}>
        <div>pôle − ({M.METAUX[et.moins].nom}, anode) : <Esp>{M.demiOx(et.moins)}</Esp></div>
        <div>pôle + ({M.METAUX[et.plus].nom}, cathode) : <Esp>{M.demiRed(et.plus)}</Esp></div>
      </div>}
    </div>);
  const boxScene = !dd && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{idE === 'contact' ? 'Le bécher' : 'La pile'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Les signes + et − donnent la polarité ; les flèches du pont montrent les ions qui migrent quand la pile débite.</div>}
      {idE === 'contact' ? <SceneContact plonge={gv.plonge}/>
        : <ScenePile g={g} d={d} et={et} pont={pont} appareil={app} borneV={borneV} affichage={affichage}
          polarite={enExplore ? pont : apres('polarite')} debit={app === 'res' && pont && !et.use && (enExplore || debitPossible)} ions={app === 'res' && pont && (enExplore || apres('ions'))}/>}
      {commandesGuide && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>{commandesGuide}</div>}
    </div>);
  const boxCourbe = !dd && (enExplore || deja('usure')) && (
    <div style={{ ...styleBoite, ...cadre('courbe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La tension à vide au fil de l’usure</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le point bleu suit le curseur ; la chute finale marque l’épuisement du réactif limitant.</div>}
      {pont ? <CourbeUsure pts={M.courbeUsure(g, d)} Q={et.Q} U={et.U} Qmax={et0.Qmax}/> : <div style={{ fontSize: 14, color: COL.rouge }}>Sans pont salin, la pile ne fonctionne pas.</div>}
    </div>);

  // ---------- mesures ----------
  const A = M.METAUX[et.moins], C = M.METAUX[et.plus];
  const mesures = !dd && (enExplore || deja('limitant')) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>État de la pile à l’instant choisi par le curseur.</div>}
      {enGuide && !deja('usure') && <>
        <LigneMesure nom={`Volume de la solution d’ions ${C.ion}`} valeur={`${nbf(et.P.V, 0)}${NB}mL`} couleur={COL.bleu}/>
        <LigneMesure nom={`Concentration initiale en ions ${C.ion}`} valeur={`${nbf(et.P.c, 2)}${NB}mol/L`} couleur={COL.bleu}/>
        <LigneMesure nom={`Masse de ${A.nom} immergée`} valeur={`${nbf(et.Mo.m, 1)}${NB}g`} couleur={COL.gris}/>
      </>}
      {enExplore && <LigneMesure nom={`Ions ${C.ion} au départ`} valeur={`${sci(et.nIonPlus0, 2)}${NB}mol`} couleur={COL.bleu}/>}
      {(enExplore || deja('usure')) && <>
        <LigneMesure nom="Durée de fonctionnement" valeur={`${nbf(tH, 1)}${NB}h`}/>
        <LigneMesure nom="Charge débitée Q = I × Δt" valeur={`${sci(et.Q, 3)}${NB}C`} couleur={COL.orange}/>
        <LigneMesure nom={`Quantité d’ions ${C.ion} restante`} valeur={`${sci(et.nIonPlus, 2)}${NB}mol`} couleur={COL.bleu}/>
        <LigneMesure nom={`Masse de ${A.nom} restante`} valeur={`${nbf(et.mMoins, 2)}${NB}g`} couleur={COL.gris}/>
        <LigneMesure nom="Tension à vide" valeur={`${nbf(et.U, 2)}${NB}V`} couleur={COL.rouge}/>
        {et.use && <div style={{ fontSize: 14, fontWeight: 700, color: COL.rouge, marginTop: 4 }}>Pile usée : {et.limitant === 'ion' ? `plus d’ions ${C.ion}` : `plus de ${A.nom}`}.</div>}
      </>}
      {enExplore && <>
        <LigneMesure nom="Capacité de la pile" valeur={`${sci(et0.Qmax, 3)}${NB}C`} couleur={COL.orange}/>
        <LigneMesure nom="Réactif limitant" valeur={et0.limitant === 'ion' ? `ions ${C.ion}` : A.nom}/>
        <LigneMesure nom="Quotient de réaction Q_r" valeur={et.use ? 'K (équilibre)' : sci(10 ** et.logQr, 2)}/>
      </>}
    </div>);

  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouvre('essayer')} onBascule={() => bascule('essayer')}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>{indicesProfond(<>
        <li>Retirez le pont salin : que devient la tension ? Les électrons peuvent-ils encore circuler ?</li>
        <li>Construisez les piles zinc-cuivre, fer-cuivre et cuivre-argent : quel métal est le pôle + dans chacune ? Le cuivre est-il toujours au même pôle ?</li>
        <li>Doublez le volume de la solution du pôle + : la tension à vide change-t-elle ? Et la capacité ?</li>
        <li>Réduisez la masse de métal du pôle − à 0,5 g : quel réactif devient limitant ? Que devient la capacité ?</li>
        <li>Passez de 20 mA à 100 mA : la capacité change-t-elle ? Et la durée de fonctionnement ?</li>
        <li>Faites fonctionner la pile jusqu’au bout : quand la tension s’annule, que vaut le quotient de réaction Q_r ?</li></>)}
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouvre('retenir')} onBascule={() => bascule('retenir')}>
    <ARetenir titre="IDÉES CLÉS">
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Pile = oxydant et réducteur séparés dans deux demi-piles, reliées par un pont salin et un circuit extérieur</li>
        <li>Électrons dans les fils (du pôle − au pôle +), ions dans les solutions et le pont salin</li>
        <li>Pôle − : oxydation (anode) ; pôle + : réduction (cathode) ; borne V sur le pôle + ⇒ tension positive</li>
        <li>Capacité Q = n(e⁻) × F, n(e⁻) fixé par le réactif limitant ; durée Δt = frac(Q|I)</li>
        <li>Pile usée : réactif limitant épuisé, Q_r = K</li>
      </ul>
    </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pl-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .pl-col { display: flex; flex-direction: column; gap: 12px; }
        .pl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .pl-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .pl-ex > * { grid-column: 1; } .pl-ex > .pl-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (min-width: 901px) { .pl-l1.cote .pl-carte { order: 2; } .pl-l1.cote .pl-main { order: 1; } }
        @media (max-width: 900px) { .pl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pl-in { animation: pl-fondu 0.35s ease-out; } @keyframes pl-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>La pile : demi-piles, pont salin, tension à vide et capacité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une <strong>pile</strong> convertit l’énergie d’une réaction d’oxydo-réduction spontanée en énergie électrique : l’oxydant et le réducteur sont séparés, et les électrons passent par un circuit extérieur.</div>
      <div className={`pl-l1${enExplore ? '' : ' cote'}`}>
        {enGuide ? <div className="pl-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="pl-carte">{panneauHypo}</div> : null}
        <div className="pl-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'polarite' ? suiviP : suiviC}/></div>}
          {!dd && <div className={enExplore ? 'pl-ex' : 'pl-col'}>
            {!enExplore && boxEquation && <div className="pl-in">{boxEquation}</div>}
            {boxScene && <div className="pl-in">{boxScene}</div>}
            {enExplore && <div className="pl-ctrl pl-col">{reglagesExplore}{commandesExplore}{aEssayer}{retenirExplore}</div>}
            {enExplore && boxEquation && <div className="pl-in">{boxEquation}</div>}
            {reglageUsure && <div className="pl-in">{reglageUsure}</div>}
            {mesures && <div className="pl-in">{mesures}</div>}
            {boxCourbe && <div className="pl-in">{boxCourbe}</div>}
          </div>}
        </div>
      </div>
      {!enDefi && (!enGuide || deja('bilan')) && <div className="pl-l2">{panneauHypo}</div>}
    </div>
  );
}
