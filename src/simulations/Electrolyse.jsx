import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, indicesProfond, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./electrolyseModele";
import { QCM_PARCOURS as Q } from "./electrolyseQcm";
import { SceneAccu, EchelleQr, SvgForcerCarte, SvgNomsCarte, SvgQrCarte, SvgQuantiteCarte, SvgAccuCarte } from "./electrolyseSchemas";

const { puiss10 } = M;
const SIM_ID = 133, CLE_GUIDE = 'electrolyse-tg-guide-v1';
declarerDefis(SIM_ID, [['sens', 'Pile ou électrolyse : qui impose le sens ?'], ['quantite', 'Quantités de matière transformées par une électrolyse']]);

// ====================================================
// SIM 133 — ÉLECTROLYSE ET ACCUMULATEUR (TG spé PC, chapitre « Prévoir l'état final », partie C « Forcer le sens d'évolution d'un système »).
//  Une seule idée : un générateur dont la tension dépasse la tension à vide d'une pile impose le sens du courant et force la
//  transformation inverse de la réaction spontanée (électrolyse) ; c'est ainsi qu'on recharge un accumulateur.
//  Suite de la sim 132 (la pile) : même pile zinc-cuivre, déjà utilisée.
//  Capacités visées (jamais affichées à l'élève) : modéliser et schématiser, à partir de résultats expérimentaux, les transferts
//  d'électrons aux électrodes ; identifier les produits formés lors du passage forcé d'un courant ; déterminer les variations de
//  quantité de matière à partir de la durée de l'électrolyse et de l'intensité ; relier durée, intensité et quantités de produits ;
//  citer des dispositifs de stockage d'énergie chimique (piles, accumulateurs, organismes chlorophylliens) et leurs enjeux.
//  Modèle : electrolyseModele.js (tension à vide par la loi de Nernst, hors programme, jamais affichée).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (x, cs = 2) => { if (x === 0) return '0'; const [m, e] = Number(x).toExponential(cs - 1).split('e'); return Number(e) === 0 ? m.replace('.', ',') : `${m.replace('.', ',')} × 10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
const coef = k => (k === 1 ? '' : `${k} `);
const eqInverse = (moins, plus) => {
  const { a, c } = M.equation(moins, plus), A = M.METAUX[moins], C = M.METAUX[plus];
  return `${coef(a)}${A.ion}(aq) + ${coef(c)}${C.m}(s) → ${coef(a)}${A.m}(s) + ${coef(c)}${C.ion}(aq)`;
};
// découpe une équation en blocs insécables (un terme par bloc) pour qu'elle passe à la ligne sur téléphone
const blocs = txt => txt.split(' ').reduce((acc, m) => (m === '+' || m === '→' ? [...acc, m] : acc.length && acc[acc.length - 1] !== '+' && acc[acc.length - 1] !== '→' ? [...acc.slice(0, -1), acc[acc.length - 1] + ' ' + m] : [...acc, m]), []).map((m, i) => <span key={i}>{i ? ' ' : ''}<Esp>{m}</Esp></span>);
const UG_GUIDE = [0.6, 1.1, 1.6];
const PRESET = { g: { id: 'zn', c: 0.15, m: M.M_LAME }, d: { id: 'cu', c: 0.05, m: M.M_LAME }, UG: 1.5, t: 0,
  gv: { ug: 0, t: 0, vu06: false, vu16: false, vuT: false } };

// ====================================================
export function SimulationElectrolyse() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviS, noterS] = useCompteurDefi(), [suiviQ, noterQ] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ accu: false, essayer: false, retenir: false });
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));
  const setGv = f => setTi(s => ({ ...s, gv: { ...s.gv, ...f } }));

  // ---------- étapes du parcours ----------
  const IDS = ['spontane', 'generateur', 'forcer', 'electrodes', 'noms', 'qr', 'charge', 'nzn', 'duree', 'accu', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);
  const gv = ti.gv;

  // ---------- situation affichée ----------
  const accu = enGuide ? M.ACCU_GUIDE : { g: ti.g, d: ti.d };
  const m0 = { g: accu.g.m, d: accu.d.m };
  // tension choisie (null : générateur branché mais pas encore réglé dans le parcours)
  const UGsel = enGuide ? (idE === 'spontane' ? 0 : ['generateur', 'forcer'].includes(idE) ? (gv.ug || null) : 1.6) : ti.UG;
  const UG = UGsel ?? M.etat(accu, 0).E;
  const tH = enGuide ? (deja('electrodes') ? gv.t : 0) : ti.t;
  const et = M.fonctionner(accu, UG, tH), e0 = M.etat(accu, 0);
  const I = et.I, appareil = UGsel === 0 ? 'res' : 'gen';
  const A = M.METAUX[et.moins], C = M.METAUX[et.plus];
  const tMax = M.dureeMax(accu, UG);
  const tCurseurMax = enGuide ? 3 : (isFinite(tMax) ? Math.min(60, Math.max(1, Math.ceil(tMax * 1.1))) : 3);
  const pasT = tCurseurMax <= 6 ? 0.1 : tCurseurMax <= 24 ? 0.5 : 1;

  const bloque06 = gv.vu06 ? null : 'Réglez d’abord la tension du générateur sur 0,60 V avec le menu sous le schéma.';
  const bloque16 = gv.vu16 ? null : 'Réglez maintenant la tension du générateur sur 1,60 V avec le menu sous le schéma.';
  const bloqueT = gv.vuT ? null : 'Avec le curseur « Durée de l’électrolyse », faites fonctionner le générateur au moins 1 h.';

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'spontane', titre: 'Une pile qui débite', focus: ['scene'],
      texte: <>Voici la pile zinc-cuivre de la simulation précédente. Elle a déjà débité 965{NB}C dans un conducteur ohmique : [Zn²⁺] = 0,15{NB}mol/L et [Cu²⁺] = 0,05{NB}mol/L (100{NB}mL de chaque solution) ; la lame de zinc ne pèse plus que 1,7{NB}g et celle de cuivre 2,3{NB}g. Son quotient de réaction vaut Q_r = frac([Zn²⁺]|[Cu²⁺]) = frac(0,15|0,05) = 3,0, très loin de la constante d’équilibre K ≈ 1,9 × 10³⁷.</>,
      tache: { type: 'qcm', q: 'On la laisse branchée sur le conducteur ohmique. Comment le système évolue-t-il ?', ...Q.spontane,
        expl: 'Q_r = 3,0 < K : le système évolue spontanément dans le sens direct. Le zinc est oxydé, les ions Cu²⁺ sont réduits : [Zn²⁺] augmente, [Cu²⁺] diminue, donc Q_r augmente vers K. Laissée à elle-même, une pile ne fait que s’user : elle ne revient jamais seule vers son état de départ.',
        indice: 'Critère d’évolution spontanée : si Q_r < K, le système évolue dans le sens direct de l’équation écrite, et Q_r se rapproche de K.' } },
    { id: 'generateur', titre: 'On branche un générateur', focus: ['scene'],
      texte: <>Pour ramener la pile vers son état de départ, on remplace le conducteur ohmique par un <strong>générateur</strong> de tension réglable U_G et un ampèremètre. La borne + du générateur est reliée au pôle + de la pile (cuivre), sa borne − au pôle − (zinc). La tension à vide de la pile, mesurée avant de brancher, vaut 1,09{NB}V. Réglez le générateur sur 0,60{NB}V avec le menu sous le schéma et regardez le sens des électrons (flèche verte).</>,
      tache: { type: 'qcm', q: 'À 0,60 V, l’ampèremètre indique 0,10 A et les électrons sortent toujours par le zinc. Que se passe-t-il ?', ...Q.generateur, bloque: bloque06,
        expl: 'À 0,60 V, moins que la tension à vide (1,09 V), le générateur ne l’emporte pas : la pile continue de débiter, elle fait même passer un courant dans le générateur. Le zinc est toujours oxydé et Q_r continue d’augmenter vers K.',
        indice: 'Comparez avec l’étape précédente : les électrons vont-ils dans le même sens qu’avec le conducteur ohmique ? Si oui, quelle réaction a toujours lieu ?' } },
    { id: 'forcer', titre: 'Forcer le sens du courant', focus: ['scene'],
      texte: <>Réglez maintenant le générateur sur 1,60{NB}V, une tension supérieure à la tension à vide de la pile (1,09{NB}V), et regardez de nouveau la flèche des électrons.</>,
      tache: { type: 'qcm', q: 'À 1,60 V, l’ampèremètre indique encore 0,10 A, mais les électrons entrent maintenant par le zinc. Pourquoi le sens s’est-il inversé ?', ...Q.forcer, bloque: bloque16,
        expl: 'Le générateur et la pile poussent les électrons en sens contraires. Quand U_G dépasse la tension à vide (1,60 V > 1,09 V), le générateur l’emporte : il impose le sens du courant, inverse du sens spontané. Il force l’évolution du système : c’est une électrolyse. Ses bornes n’ont pas changé.',
        indice: 'Le générateur pousse les électrons dans un sens, la pile dans l’autre. Lequel l’emporte quand U_G dépasse la tension à vide ?' } },
    { id: 'electrodes', titre: 'Que se passe-t-il sur la lame de zinc ?', focus: ['reglage', 'scene'],
      texte: <>Le générateur (1,60{NB}V) fait passer un courant de 0,10{NB}A. Avec le curseur « Durée de l’électrolyse », faites-le fonctionner au moins 1{NB}h, puis observez les deux lames et la couleur de la solution de droite. Les masses des lames s’affichent dans les mesures.</>,
      tache: { type: 'qcm', q: 'La lame de zinc s’épaissit (sa masse augmente) et la solution de droite redevient plus bleue. Quelle réaction a lieu sur la lame de zinc ?', ...Q.electrodes, bloque: bloqueT,
        expl: 'Les électrons imposés par le générateur arrivent sur la lame de zinc : les ions Zn²⁺ y sont réduits, Zn²⁺(aq) + 2 e⁻ → Zn(s), et du zinc se dépose. Sur la lame de cuivre, le cuivre est oxydé, Cu(s) → Cu²⁺(aq) + 2 e⁻ : la lame s’amincit et la solution redevient bleue. Bilan : Zn²⁺(aq) + Cu(s) → Zn(s) + Cu²⁺(aq), l’inverse de la réaction de la pile.',
        indice: 'Les électrons entrent dans la lame de zinc. Une espèce qui gagne des électrons est réduite : laquelle, dans le bécher du zinc ?' } },
    { id: 'noms', titre: 'Anode ou cathode ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : FORCER LE SENS D’ÉVOLUTION',
      retenir: <>
        <SvgForcerCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Un générateur branché sur une pile (borne + sur le pôle +) impose le sens du courant si sa tension U_G est <strong>supérieure à la tension à vide</strong> de la pile.</li>
          <li>Exemple : tension à vide 1,09 V ; à 0,60 V la pile débite encore, à 1,60 V le générateur force la transformation <strong>inverse</strong> de la réaction spontanée : c’est une <strong>électrolyse</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« le plus fort impose le sens »</strong>. Idée fausse : « brancher un générateur suffit pour recharger ». Vrai : sous la tension à vide, la pile continue de débiter.</li>
        </ul></>,
      texte: <>Rappel : l’<strong>anode</strong> est l’électrode où a lieu une oxydation, la <strong>cathode</strong> celle où a lieu une réduction. Quand la pile débitait, la lame de zinc (pôle −) était l’anode. Pendant la charge, le zinc se dépose : Zn²⁺(aq) + 2 e⁻ → Zn(s).</>,
      tache: { type: 'qcm', q: 'Pendant la charge forcée, la lame de zinc est…', ...Q.noms,
        expl: 'Sur la lame de zinc a lieu maintenant une réduction : c’est la cathode. Elle reste pourtant le pôle − : elle est reliée à la borne − du générateur, et la polarité de l’accumulateur ne change pas. Les noms anode et cathode suivent la réaction ; les pôles + et − restent les mêmes. Le schéma affiche maintenant ces noms.',
        indice: 'Le nom d’une électrode dépend de la réaction qui s’y produit (oxydation ou réduction), pas de la borne à laquelle elle est reliée.' } },
    { id: 'qr', titre: 'Le système s’éloigne de l’équilibre', focus: ['qr'],
      retenirTitre: 'À RETENIR : ANODE ET CATHODE',
      retenir: <>
        <SvgNomsCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Anode</strong> : électrode siège d’une <strong>oxydation</strong> ; <strong>cathode</strong> : siège d’une <strong>réduction</strong>.</li>
          <li>Pendant la charge : Zn²⁺(aq) + 2 e⁻ → Zn(s) sur la lame de zinc, qui devient la cathode ; Cu(s) → Cu²⁺(aq) + 2 e⁻ sur la lame de cuivre, qui devient l’anode.</li>
          <li>Moyen de s’en souvenir : <strong>« les pôles restent, les noms suivent la réaction »</strong>. Idée fausse : « l’anode est toujours le pôle − ». Vrai : c’est le cas dans une pile, pas dans un électrolyseur.</li>
        </ul></>,
      texte: <>L’échelle des Q_r est apparue sous le schéma. Avant la charge, Q_r = frac([Zn²⁺]|[Cu²⁺]) valait 3,0 (cercle blanc). Après 1{NB}h de charge à 0,10{NB}A, [Zn²⁺] ≈ 0,13{NB}mol/L et [Cu²⁺] ≈ 0,069{NB}mol/L, donc Q_r ≈ 1,9 (point bleu quand le curseur est sur 1{NB}h).</>,
      tache: { type: 'qcm', q: 'Pendant la charge, comment évolue Q_r par rapport à K ≈ 1,9 × 10³⁷ ?', ...Q.qr,
        expl: 'Q_r diminue (de 3,0 à 1,9) alors que K est immense : Q_r s’éloigne de K. Spontanément, un système évolue toujours vers l’équilibre (Q_r vers K) ; s’en éloigner n’est possible que si on lui fournit de l’énergie, ici l’énergie électrique du générateur. C’est cela, forcer le sens d’évolution d’un système.',
        indice: 'Comparez 3,0 et 1,9 : Q_r augmente-t-il ou diminue-t-il ? K est-il plus grand ou plus petit que ces deux valeurs ?' } },
    { id: 'charge', titre: 'La charge électrique qui traverse le circuit', focus: ['mesures'],
      retenirTitre: 'À RETENIR : SPONTANÉ VERS K, FORCÉ LOIN DE K',
      retenir: <>
        <SvgQrCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Spontanément, Q_r évolue vers K. Une <strong>électrolyse</strong> fait évoluer le système en sens inverse : Q_r <strong>s’éloigne de K</strong>, grâce à l’énergie fournie par le générateur.</li>
          <li>Exemple : 1 h de charge à 0,10 A, Q_r passe de 3,0 à 1,9 alors que K ≈ 1,9 × 10³⁷.</li>
          <li>Moyen de s’en souvenir : <strong>« spontané vers K, forcé loin de K »</strong>. Idée fausse : « une électrolyse est une transformation spontanée ». Vrai : elle s’arrête dès qu’on coupe le générateur.</li>
        </ul></>,
      texte: <>Lors d’une autre électrolyse, le générateur fait passer un courant d’intensité constante I = 0,10{NB}A pendant Δt = 30{NB}min. La charge électrique Q qui traverse le circuit vaut Q = I × Δt (I en A, Δt en s, Q en C).</>,
      tache: { type: 'num', q: 'Charge électrique Q qui a traversé le circuit', unite: 'C', vrai: 180, tol: 0.05, cs: 2, affiche: x => sci(x, 2),
        calcul: () => ['Conversion : Δt = 30 min = 30 × 60 s = 1 800 s.', 'Q = I × Δt = 0,10 A × 1 800 s = 1,8 × 10² C (180 C).', 'Hypothèse : l’intensité reste constante pendant toute l’électrolyse.'],
        pieges: [[3, 'Vous avez laissé Δt en minutes : convertissez en secondes (1 min = 60 s).'], [0.05, 'Vous avez exprimé Δt en heures : pour obtenir des coulombs, Δt doit être en secondes.'], [18000, 'Il faut multiplier I par Δt, pas diviser Δt par I.'], [180000, 'I est déjà en ampères (0,10 A) : ne le convertissez pas en mA.']],
        expl: 'Δt = 1 800 s ; Q = 0,10 × 1 800 = 1,8 × 10² C.',
        indice: 'Convertissez d’abord la durée en secondes, puis multipliez par l’intensité en ampères.' } },
    { id: 'nzn', titre: 'La quantité de zinc déposé', focus: ['mesures'],
      texte: <>Vous avez trouvé Q = 1,8 × 10²{NB}C (180{NB}C). Une mole d’électrons transporte la charge F = 9,65 × 10⁴{NB}C/mol (constante de Faraday), donc la quantité d’électrons échangés vaut n(e⁻) = frac(Q|F). Sur la lame de zinc : Zn²⁺(aq) + 2 e⁻ → Zn(s) ; M(Zn) = 65,4{NB}g/mol.</>,
      tache: { type: 'num', q: 'Quantité de zinc déposé n(Zn)', unite: 'mol', vrai: 180 / (2 * M.F), tol: 0.05, cs: 2, affiche: x => sci(x, 2),
        calcul: () => ['n(e⁻) = frac(Q|F) = frac(180 C|9,65 × 10⁴ C/mol) = 1,87 × 10⁻³ mol.', 'Deux électrons par atome de zinc déposé : n(Zn) = frac(n(e⁻)|2) = 9,3 × 10⁻⁴ mol.', 'Masse de zinc correspondante : m = n × M = 9,3 × 10⁻⁴ mol × 65,4 g/mol = 6,1 × 10⁻² g.'],
        pieges: [[180 / M.F, 'C’est la quantité d’électrons n(e⁻) : il faut encore la diviser par 2 (deux électrons par atome de zinc).'], [2 * 180 / M.F, 'Il faut diviser n(e⁻) par 2, pas le multiplier.'], [180 / (2 * M.F) * 65.4, 'C’est la masse de zinc en grammes ; on demande la quantité de matière en mol.'], [180 / 2 / 96.5, 'F vaut 9,65 × 10⁴ C/mol, pas 96,5.']],
        expl: 'n(e⁻) = 180 ÷ 9,65 × 10⁴ = 1,87 × 10⁻³ mol ; n(Zn) = 9,3 × 10⁻⁴ mol (soit 6,1 × 10⁻² g de zinc).',
        indice: 'D’abord n(e⁻) = frac(Q|F) avec Q en C, puis la demi-équation : 2 électrons pour 1 atome de zinc.' } },
    { id: 'duree', titre: 'Combien de temps pour recharger ?', focus: ['reglage', 'mesures'],
      texte: <>Au départ, la pile avait débité 965{NB}C. Pour la ramener à son état neuf ([Zn²⁺] = [Cu²⁺] = 0,10{NB}mol/L), il faut faire repasser la même charge, Q = 965{NB}C, en sens inverse. Le générateur maintient I = 0,10{NB}A.</>,
      tache: { type: 'num', q: 'Durée de la recharge complète', unite: 'h', vrai: 965 / 0.10 / 3600, tol: 0.05, cs: 2, affiche: x => nbf(x, 1),
        calcul: () => ['Q = I × Δt, donc Δt = frac(Q|I) = frac(965 C|0,10 A) = 9 650 s.', 'En heures : frac(9 650 s|3 600 s/h) = 2,7 h.', 'Vérification : placez le curseur sur 2,7 h ; les deux concentrations reviennent à 0,10 mol/L.'],
        pieges: [[9650, 'C’est la durée en secondes : divisez par 3 600 pour l’obtenir en heures.'], [160.8, 'C’est la durée en minutes : divisez encore par 60.'], [965 * 0.1 / 3600, 'Il faut diviser Q par I, pas les multiplier.'], [2 * 965 / 0.1 / 3600, 'La charge à faire repasser est 965 C, pas le double.']],
        expl: 'Δt = 965 ÷ 0,10 = 9 650 s, soit 2,7 h.',
        indice: 'Q = I × Δt, donc Δt = frac(Q|I) en secondes ; 1 h = 3 600 s.' } },
    { id: 'accu', titre: 'Un accumulateur, une pile qu’on recharge', focus: [],
      retenirTitre: 'À RETENIR : DE LA DURÉE AUX QUANTITÉS DE MATIÈRE',
      retenir: <>
        <SvgQuantiteCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Charge électrique : <strong>Q = I × Δt</strong> (I en A, Δt en s) ; quantité d’électrons : <strong>n(e⁻) = frac(Q|F)</strong>, avec F = 9,65 × 10⁴ C/mol.</li>
          <li>La demi-équation donne la quantité de produit : Zn²⁺ + 2 e⁻ → Zn, donc n(Zn) = frac(n(e⁻)|2). Exemple : 0,10 A pendant 30 min, Q = 180 C, n(Zn) = 9,3 × 10⁻⁴ mol.</li>
          <li>Moyen de s’en souvenir : <strong>« ampères × secondes = coulombs, puis F, puis la demi-équation »</strong>. Piège classique : laisser Δt en minutes.</li>
        </ul></>,
      texte: <>Une pile que l’on peut recharger ainsi s’appelle un <strong>accumulateur</strong> (batterie lithium-ion d’un téléphone, batterie au plomb d’une voiture). Pendant la décharge, il fonctionne comme une pile ; pendant la charge, comme un électrolyseur.</>,
      tache: { type: 'qcm', q: 'Pendant la charge, l’accumulateur convertit de l’énergie…', ...Q.accu,
        expl: 'Le générateur fournit de l’énergie électrique, qui force la transformation inverse : elle est stockée sous forme d’énergie chimique (les réactifs de la pile sont reformés). À la décharge, cette énergie chimique redevient électrique. D’autres dispositifs stockent de l’énergie sous forme chimique : électrolyseurs qui produisent du dihydrogène avec l’électricité solaire ou éolienne, organismes chlorophylliens (photosynthèse : énergie lumineuse → énergie chimique).',
        indice: 'Pendant la charge, qui fournit l’énergie, et sous quelle forme la retrouve-t-on dans l’accumulateur ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : L’ACCUMULATEUR',
      retenir: <>
        <SvgAccuCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Accumulateur : <strong>décharge = pile</strong> (spontané, énergie chimique → électrique) ; <strong>charge = électrolyse</strong> (forcée, énergie électrique → chimique).</li>
          <li>Stocker de l’énergie sous forme chimique : accumulateurs (lithium-ion, plomb), dihydrogène produit par électrolyse de l’eau, photosynthèse. Enjeu : stocker l’électricité des sources intermittentes (solaire, éolien).</li>
          <li>Moyen de s’en souvenir : <strong>« recharger, c’est électrolyser »</strong>. Idée fausse : « on remplit la batterie d’électrons ». Vrai : on reforme ses réactifs.</li>
        </ul></>,
      texte: <>Vous savez expliquer une électrolyse : un générateur dont la tension dépasse la tension à vide impose le sens du courant ; la transformation inverse de la réaction spontanée a lieu (réduction à la cathode, oxydation à l’anode) et Q_r s’éloigne de K. Les quantités transformées se déduisent de Q = I × Δt, de n(e⁻) = frac(Q|F) et des demi-équations. Passez à l’exploration (autres métaux, autres tensions) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'sens') {
      const t = M.tirageDefiSens(), dem = [M.demiOx(t.moins), M.demiRed(t.moins), M.demiOx(t.plus), M.demiRed(t.plus)];
      const ordre = [0, 1, 2, 3].sort(() => Math.random() - 0.5), bonne = t.sens === 'force' ? 1 : 0;
      setDefi({ type, ...t, options: ordre.map(i => dem[i]), bonneDem: ordre.indexOf(bonne), reps: { sens: null, dem: null, qr: null }, verifie: false });
    } else setDefi({ type, ...M.tirageDefiQuantite(), reps: { n: '', m: '' }, verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi('sens');
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s, gv: s.gv }));
  }
  const TOL_N = 0.06, TOL_M = 0.08;   // pires écarts d'un élève qui arrondit chaque étape à 2 chiffres significatifs : 3,5 % sur n, 5,7 % sur m (calculés par script)
  const verifier = () => {
    if (defi.type === 'sens') {
      const ok = defi.reps.sens === defi.sens && defi.reps.dem === defi.bonneDem && defi.reps.qr === (defi.sens === 'force' ? 'loin' : 'vers');
      setDefi(x => ({ ...x, verifie: true, ok })); noterS(ok);
    } else {
      const n = lireNombre(defi.reps.n), m = lireNombre(defi.reps.m);
      const okN = isFinite(n) && Math.abs(n - defi.nDep) / defi.nDep <= TOL_N, okM = isFinite(m) && Math.abs(m - defi.mDiss) / defi.mDiss <= TOL_M;
      setDefi(x => ({ ...x, verifie: true, ok: okN && okM, okN, okM })); noterQ(okN && okM);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const saisie = (val, cle, aria, ok) => <input value={val} aria-label={aria} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('el-verif')?.click()}
    onChange={e => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e.target.value }, verifie: false }))}
    style={{ width: 120, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi && defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>;
  const choix = (cle, val, txt, bon) => <button key={String(val)} onClick={() => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: val }, verifie: false }))} aria-pressed={defi.reps[cle] === val}
    style={{ ...stylePetitBouton(defi.reps[cle] === val, defi.verifie ? (bon ? '#15803d' : '#dc2626') : '#475569'), textAlign: 'left' }}>{txt}</button>;
  const voletDefi = defi && (() => {
    const Am = M.METAUX[defi.moins], Cp = M.METAUX[defi.plus];
    return (
      <div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['sens', 'Qui impose le sens ?'], ['quantite', 'Quantités transformées']].map(([t, l]) => <button key={t} onClick={() => nouveauDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
        </div>
        {defi.type === 'sens' ? <>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : pile ou électrolyse ?</div>
          <div style={{ ...lbl, marginBottom: 8 }}>{indicesProfond(<>Une pile {Am.nom}-{Cp.nom} (pôle + : lame de {Cp.nom} ; pôle − : lame de {Am.nom}) a une tension à vide de <strong>{nbf(defi.E, 2)}{NB}V</strong>. On la relie à un générateur réglé sur <strong>U_G = {nbf(defi.UG, 2)}{NB}V</strong>, borne + du générateur sur le pôle + de la pile, puis on ferme le circuit.</>)}</div>
          <SceneAccu g={defi.a.g} d={defi.a.d} et={{ ...M.fonctionner(defi.a, defi.UG, 0), arret: false }} m0={{ g: 2, d: 2 }} appareil="gen" UG={defi.UG} I={0} cache flux={false}/>
          <div style={{ ...lbl, fontWeight: 700, margin: '6px 0 4px' }}>1. Que se passe-t-il ?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[['spontane', 'la pile débite, dans le sens spontané'], ['force', 'le générateur force le sens inverse'], ['aucun', 'aucun courant ne circule']].map(([v, t]) => choix('sens', v, t, v === defi.sens))}</div>
          <div style={{ ...lbl, fontWeight: 700, margin: '8px 0 4px' }}>2. Quelle réaction a lieu sur la lame du pôle − ({Am.nom}) ?</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{defi.options.map((o, i) => choix('dem', i, o, i === defi.bonneDem))}</div>
          <div style={{ ...lbl, fontWeight: 700, margin: '8px 0 4px' }}>{indicesProfond('3. Comment évolue le quotient de réaction Q_r de la réaction de la pile ?')}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{[['vers', 'il se rapproche de K'], ['loin', 'il s’éloigne de K']].map(([v, t]) => choix('qr', v, t, v === (defi.sens === 'force' ? 'loin' : 'vers')))}</div>
          <IndiceDefi cache={defi.verifie && defi.ok}>Comparez la tension du générateur à la tension à vide : le plus fort impose le sens du courant. Si la pile débite, le métal du pôle − est oxydé ; si le générateur force, les électrons entrent par le pôle − et y réduisent les ions métalliques. Spontané : Q_r va vers K ; forcé : Q_r s’en éloigne.</IndiceDefi>
        </> : <>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : que produit cette électrolyse ?</div>
          <div style={{ ...lbl, marginBottom: 6 }}>Un accumulateur {Am.nom}-{Cp.nom} est rechargé par un générateur. Réaction forcée : <Esp><strong>{eqInverse(defi.moins, defi.plus)}</strong></Esp>.</div>
          <ul style={{ ...lbl, margin: '0 0 8px', paddingLeft: 18 }}>
            <li>Intensité constante : <strong>I = {nbf(defi.I, 2)}{NB}A</strong> pendant <strong>Δt = {defi.dtMin}{NB}min</strong>.</li>
            <li>Lame du pôle − ({Am.nom}) : <Esp>{M.demiRed(defi.moins)}</Esp>. Lame du pôle + ({Cp.nom}) : <Esp>{M.demiOx(defi.plus)}</Esp>.</li>
            <li>M({Cp.m}) = {nbf(Cp.M, 1)}{NB}g/mol ; F = 9,65 × 10⁴{NB}C/mol.</li>
          </ul>
          <div style={{ ...lbl, marginBottom: 6 }}>Calculez la quantité de {Am.nom} déposé sur la lame du pôle −, puis la masse de {Cp.nom} qui a disparu de la lame du pôle +. Donnez vos résultats avec 2 chiffres significatifs (gardez 3 chiffres dans les calculs intermédiaires).</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}><span>n({Am.m}) déposé =</span>{saisie(defi.reps.n, 'n', `Quantité de ${Am.nom} déposé en moles`, defi.okN)}<span>mol</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}><span>m({Cp.m}) disparu =</span>{saisie(defi.reps.m, 'm', `Masse de ${Cp.nom} disparu en grammes`, defi.okM)}<span>g</span></div>
          <IndiceDefi cache={defi.verifie && defi.ok}>Convertissez Δt en secondes, puis Q = I × Δt et n(e⁻) = frac(Q|F). Chaque demi-équation donne le nombre d’électrons par atome : n(métal) = frac(n(e⁻)|z), où z est le nombre d’électrons de la demi-équation. Enfin m = n × M.</IndiceDefi>
        </>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button id="el-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
          <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
          <strong>{defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}</strong>
          {defi.type === 'sens'
            ? indicesProfond(defi.sens === 'force'
              ? `U_G = ${nbf(defi.UG, 2)} V dépasse la tension à vide (${nbf(defi.E, 2)} V) : le générateur force le sens inverse (électrolyse). Les électrons entrent par le pôle − : ${M.demiRed(defi.moins)} (réduction). Q_r s’éloigne de K.`
              : `U_G = ${nbf(defi.UG, 2)} V est inférieure à la tension à vide (${nbf(defi.E, 2)} V) : la pile débite dans le sens spontané. Au pôle − : ${M.demiOx(defi.moins)} (oxydation). Q_r se rapproche de K.`)
            : indicesProfond(`Δt = ${defi.dtMin} × 60 = ${defi.dtMin * 60} s ; Q = ${nbf(defi.I, 2)} × ${defi.dtMin * 60} = ${nbf(defi.Q, 0)} C ; n(e⁻) = frac(${nbf(defi.Q, 0)} C|9,65 × 10⁴ C/mol) = ${sci(defi.Q / M.F, 3)} mol. `
              + `n(${Am.m}) = frac(n(e⁻)|${Am.z}) = ${sci(defi.nDep, 2)} mol ; n(${Cp.m}) = frac(n(e⁻)|${Cp.z}) = ${sci(defi.Q / (Cp.z * M.F), 3)} mol, donc m(${Cp.m}) = ${sci(defi.Q / (Cp.z * M.F), 3)} × ${nbf(Cp.M, 1)} = ${sci(defi.mDiss, 2)} g `
              + `(marges acceptées : ${Math.round(TOL_N * 100)} % sur n, ${Math.round(TOL_M * 100)} % sur m).`)}
        </div>}
      </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; solutions diluées (activités ≈ concentrations) ; 100 mL de chaque solution ; dans l’exploration, 2,0 g de chaque lame sont immergés.</li>
      <li><strong>Tension à vide</strong> : la simulation la calcule par une loi hors programme (loi de Nernst) ; en Terminale, on la mesure au voltmètre.</li>
      <li><strong>Intensité</strong> : la simulation calcule l’intensité au départ à partir de l’écart entre la tension du générateur et la tension à vide (résistance du circuit : 5 Ω), puis la suppose <strong>constante</strong> (on réajuste le générateur). En réalité, elle varie un peu.</li>
      <li><strong>Aucune réaction parasite</strong> : tous les électrons servent à la transformation étudiée. En réalité, pendant la charge, un peu de dihydrogène peut se dégager sur la lame du pôle − (réduction de l’eau), et vers 2 V ou plus l’eau elle-même peut être électrolysée.</li>
      <li><strong>Dépôt compact</strong> : le métal déposé adhère à la lame (en réalité, il peut être poreux et se détacher, ce qui use les accumulateurs).</li>
      <li><strong>Pont salin</strong> au nitrate de potassium (K⁺, NO₃⁻), jamais épuisé.</li>
      <li><strong>Fin de l’électrolyse</strong> : elle s’arrête quand un réactif de la transformation forcée est épuisé (ions du pôle − ou métal du pôle +). En pratique, on arrête la charge avant.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(hypotheses)}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- menus déroulants ----------
  const ouvre = k => ouv[k], bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const liste = (nom, valeur, options, onChange, large) => (
    <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, gridColumn: large ? '1 / -1' : undefined, minWidth: 0 }}>{avecIndices(nom)}
      <select value={valeur} onChange={e => onChange(e.target.value)} style={{ ...menu, marginTop: 2 }}>
        {options.map(o => <option key={o.v} value={o.v} disabled={o.off}>{o.t}</option>)}
      </select>
    </label>);

  // ---------- commandes du parcours ----------
  const reglageGuide = enGuide && ['generateur', 'forcer'].includes(idE) && (
    <div style={{ marginTop: 6, maxWidth: 320 }}>
      {liste('Tension du générateur U_G', gv.ug ? String(gv.ug) : '', [{ v: '', t: 'choisir…', off: true }, ...UG_GUIDE.map(u => ({ v: String(u), t: `${nbf(u, 2)} V` }))],
        v => { const u = Number(v); setGv({ ug: u, ...(u === 0.6 ? { vu06: true } : {}), ...(u === 1.6 && idE === 'forcer' ? { vu16: true } : {}) }); })}
    </div>);
  const reglageDuree = enGuide && deja('electrodes') && (
    <div style={{ ...styleBoite, ...cadre('reglage') }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>Le générateur (1,60{NB}V) fait passer 0,10{NB}A ; le curseur règle depuis combien de temps il fonctionne.</div>
      <Curseur nom="Durée de l’électrolyse" valeur={gv.t} onChange={t => setGv({ t, ...(t >= 1 ? { vuT: true } : {}) })} min={0} max={3} pas={0.1} decimales={1} unite="h"/>
    </div>);

  // ---------- exploration : réglages dans des menus déroulants, blocs repliables ----------
  const resumeAccu = `${M.METAUX[ti.g.id].ion}/${M.METAUX[ti.g.id].m} ${nbf(ti.g.c, 2)}${NB}mol/L · ${M.METAUX[ti.d.id].ion}/${M.METAUX[ti.d.id].m} ${nbf(ti.d.c, 2)}${NB}mol/L`;
  const concOpts = [0.05, 0.10, 0.15, 0.20].map(c => ({ v: String(c), t: `${nbf(c, 2)} mol/L` }));
  const reglagesAccu = enExplore && (
    <Section titre={<span><span style={{ display: 'block' }}>L’accumulateur</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{resumeAccu}</span></span>}
      ouvert={ouvre('accu')} onBascule={() => bascule('accu')}>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6, lineHeight: 1.4 }}>Choisissez le métal et la concentration de chaque demi-pile (100{NB}mL de solution, 2,0{NB}g de lame immergée).</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        {liste('Demi-pile de gauche', ti.g.id, M.ORDRE.map(id => ({ v: id, t: `${M.METAUX[id].ion} / ${M.METAUX[id].m}`, off: id === ti.d.id })), v => setT({ g: { ...ti.g, id: v }, t: 0 }))}
        {liste('Concentration à gauche', String(ti.g.c), concOpts, v => setT({ g: { ...ti.g, c: Number(v) }, t: 0 }))}
        {liste('Demi-pile de droite', ti.d.id, M.ORDRE.map(id => ({ v: id, t: `${M.METAUX[id].ion} / ${M.METAUX[id].m}`, off: id === ti.g.id })), v => setT({ d: { ...ti.d, id: v }, t: 0 }))}
        {liste('Concentration à droite', String(ti.d.c), concOpts, v => setT({ d: { ...ti.d, c: Number(v) }, t: 0 }))}
      </div>
    </Section>);
  const commandesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Brancher et faire fonctionner</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 8, lineHeight: 1.4 }}>La borne + du générateur est reliée au pôle + de la pile. Comparez sa tension à la tension à vide de la pile (dans les mesures).</div>
      {liste('Tension du générateur U_G', String(ti.UG), M.UG_LISTE.map(u => ({ v: String(u), t: u === 0 ? '0 V (simple conducteur ohmique)' : `${nbf(u, 2)} V` })), v => setT({ UG: Number(v), t: 0 }), true)}
      <div style={{ fontSize: 13, color: KIT.txt2, margin: '10px 0 2px', lineHeight: 1.4 }}>Le curseur règle depuis combien de temps le courant circule.</div>
      <Curseur nom="Durée de fonctionnement" valeur={Math.min(ti.t, tCurseurMax)} onChange={t => setT({ t })} min={0} max={tCurseurMax} pas={pasT} decimales={pasT < 0.5 ? 1 : pasT < 1 ? 1 : 0} unite="h"/>
      {I === 0 && <div style={{ fontSize: 13.5, color: COL.gris }}>Aucun courant : la tension du générateur compense la tension à vide, rien n’évolue.</div>}
    </div>);

  // ---------- équation ----------
  const sensAff = enGuide ? (apres('forcer') ? 'force' : apres('generateur') || idE === 'spontane' ? 'spontane' : null) : et.sens;
  const boxEquation = !dd && (
    <div style={{ ...styleBoite, textAlign: 'center', ...cadre('equation') }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 2 }}>Réaction de la pile (sens spontané), K ≈ {puiss10(e0.logK)}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: sensAff === 'spontane' || !apres('electrodes') ? KIT.txt : COL.gris, lineHeight: 1.6 }}>{blocs(M.equationTexte(et.moins, et.plus))}</div>
      {apres('electrodes') && <>
        <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '6px 0 2px' }}>Transformation forcée (électrolyse, charge)</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: sensAff === 'force' ? COL.orange : COL.gris, lineHeight: 1.6 }}>{blocs(eqInverse(et.moins, et.plus))}</div>
      </>}
      {apres('noms') && I !== 0 && <div style={{ fontSize: 15, color: KIT.txt, marginTop: 6, lineHeight: 1.6 }}>
        <div>pôle − ({A.nom}, {I > 0 ? 'cathode' : 'anode'}) : <Esp>{I > 0 ? M.demiRed(et.moins) : M.demiOx(et.moins)}</Esp></div>
        <div>pôle + ({C.nom}, {I > 0 ? 'anode' : 'cathode'}) : <Esp>{I > 0 ? M.demiOx(et.plus) : M.demiRed(et.plus)}</Esp></div>
      </div>}
    </div>);
  const boxScene = !dd && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{appareil === 'res' ? 'La pile débite dans un conducteur ohmique' : 'La pile reliée au générateur'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>La flèche verte montre le sens des électrons ; les flèches du pont, les ions qui migrent.</div>}
      <SceneAccu g={accu.g} d={accu.d} et={et} m0={m0} appareil={appareil} UG={UGsel} I={I} lecture={appareil === 'gen' && UGsel != null}
        flux={UGsel != null} ions={enExplore || apres('electrodes')} noms={enExplore || apres('noms')}/>
      {reglageGuide}
    </div>);
  const boxQr = !dd && (enExplore || deja('qr')) && (
    <div style={{ ...styleBoite, ...cadre('qr') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{indicesProfond('Le quotient de réaction Q_r et la constante K')}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{indicesProfond('Cercle blanc : Q_r au départ ; point bleu : Q_r à la durée choisie.')}</div>}
      <EchelleQr logQr={et.logQr} logK={et.logK} depart={e0.logQr} sens={enGuide && !apres('qr') ? null : et.sens}/>
    </div>);

  // ---------- mesures ----------
  const sensTxt = I > 0 ? 'forcé (électrolyse)' : I < 0 ? 'spontané (pile)' : 'aucun courant';
  const mesures = !dd && (enExplore || deja('generateur')) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>État du système à la durée choisie par le curseur.</div>}
      <LigneMesure nom="Tension à vide de la pile, avant de brancher" valeur={`${nbf(e0.E, 2)}${NB}V`} couleur={COL.rouge}/>
      <LigneMesure nom="Intensité du courant" valeur={UGsel == null ? '—' : `${nbf(Math.abs(I), 2)}${NB}A`}/>
      {(enExplore || apres('forcer')) && <LigneMesure nom="Sens de l’évolution" valeur={sensTxt} couleur={I > 0 ? COL.orange : COL.vert}/>}
      {(enExplore || deja('electrodes')) && <>
        <LigneMesure nom="Durée de fonctionnement" valeur={`${nbf(tH, 1)}${NB}h`}/>
        <LigneMesure nom={`Masse de la lame de ${A.nom} (pôle −)`} valeur={`${nbf(et.mM, 2)}${NB}g`} couleur={COL.gris}/>
        <LigneMesure nom={`Masse de la lame de ${C.nom} (pôle +)`} valeur={`${nbf(et.mP, 2)}${NB}g`} couleur={COL.gris}/>
      </>}
      {(enExplore || deja('qr')) && <LigneMesure nom="Quotient de réaction Q_r" valeur={nbf(10 ** et.logQr, 2).length < 8 ? nbf(10 ** et.logQr, 2) : sci(10 ** et.logQr, 2)} couleur={COL.bleu}/>}
      {(enExplore || apres('charge')) && <LigneMesure nom="Charge passée Q = I × Δt" valeur={`${nbf(et.Q, 0)}${NB}C`} couleur={COL.orange}/>}
      {(enExplore || apres('nzn')) && <>
        <LigneMesure nom="Quantité d’électrons échangés n(e⁻)" valeur={`${sci(et.ne, 2)}${NB}mol`} couleur={COL.vert}/>
        <LigneMesure nom={I < 0 ? `Quantité de ${A.nom} oxydé` : `Quantité de ${A.nom} déposé`} valeur={`${sci(et.ne / A.z, 2)}${NB}mol`}/>
      </>}
      {(enExplore || apres('duree')) && <LigneMesure nom="Tension à vide actuelle" valeur={`${nbf(et.E, 2)}${NB}V`} couleur={COL.rouge}/>}
      {et.arret && <div style={{ fontSize: 14, fontWeight: 700, color: COL.rouge, marginTop: 4 }}>
        {I > 0 ? `Arrêt : ${et.limitantCharge === 'ion' ? `plus d’ions ${A.ion} à réduire` : `plus de ${C.nom} à oxyder`}.` : `Pile usée : ${et.limitantDech === 'ion' ? `plus d’ions ${C.ion}` : `plus de ${A.nom}`}.`}</div>}
    </div>);

  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouvre('essayer')} onBascule={() => bascule('essayer')}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>{indicesProfond(<>
        <li>Pour la pile zinc-cuivre, essayez toutes les tensions du générateur : à partir de quelle valeur le sens des électrons s’inverse-t-il ? Comparez à la tension à vide.</li>
        <li>Pile zinc-argent : sa tension à vide est plus grande. Le générateur à 1,50 V peut-il encore la recharger ?</li>
        <li>Rechargez jusqu’au bout : quel réactif de la transformation forcée s’épuise en premier ? Que devient Q_r ?</li>
        <li>Doublez la tension au-dessus de la tension à vide : la masse déposée en 1 h change-t-elle ? Pourquoi ?</li>
        <li>Pendant la charge, que devient la tension à vide de la pile ? Et pendant la décharge ?</li></>)}
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouvre('retenir')} onBascule={() => bascule('retenir')}>
      <ARetenir titre="IDÉES CLÉS">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>U_G &gt; tension à vide : le générateur force la transformation inverse (électrolyse) ; sinon la pile débite</li>
          <li>Anode : oxydation ; cathode : réduction ; les pôles + et − ne changent pas</li>
          <li>Spontané : Q_r va vers K ; forcé : Q_r s’éloigne de K</li>
          <li>Q = I × Δt ; n(e⁻) = frac(Q|F) ; n(produit) d’après la demi-équation</li>
          <li>Accumulateur : décharge = pile, charge = électrolyse</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .el-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .el-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .el-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .el-col { display: flex; flex-direction: column; gap: 12px; }
        .el-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .el-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .el-ex > * { grid-column: 1; } .el-ex > .el-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (min-width: 901px) { .el-l1.cote .el-carte { order: 2; } .el-l1.cote .el-main { order: 1; } }
        @media (max-width: 900px) { .el-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .el-in { animation: el-fondu 0.35s ease-out; } @keyframes el-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Électrolyse et accumulateur : forcer le sens d’évolution d’un système</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>générateur</strong> peut obliger une réaction d’oxydo-réduction à se faire dans le sens inverse de son sens spontané : c’est une <strong>électrolyse</strong>. C’est ainsi qu’on recharge un <strong>accumulateur</strong>.</div>
      <div className={`el-l1${enExplore ? '' : ' cote'}`}>
        {enGuide ? <div className="el-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="el-carte">{panneauHypo}</div> : null}
        <div className="el-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'sens' ? suiviS : suiviQ}/></div>}
          {!dd && <div className={enExplore ? 'el-ex' : 'el-col'}>
            {boxEquation && <div className="el-in">{boxEquation}</div>}
            {boxScene && <div className="el-in">{boxScene}</div>}
            {enExplore && <div className="el-ctrl el-col">{commandesExplore}{reglagesAccu}{aEssayer}{retenirExplore}</div>}
            {reglageDuree && <div className="el-in">{reglageDuree}</div>}
            {mesures && <div className="el-in">{mesures}</div>}
            {boxQr && <div className="el-in">{boxQr}</div>}
          </div>}
        </div>
      </div>
      {!enDefi && (!enGuide || deja('bilan')) && <div className="el-l2">{panneauHypo}</div>}
    </div>
  );
}
