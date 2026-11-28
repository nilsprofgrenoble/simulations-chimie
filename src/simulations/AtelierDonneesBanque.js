import { PDT_SAPP } from "./poidsTrajetExos.js";
import * as SEV from "./sensEvolutionModele.js";
import * as MAB from "./mabModele.js";
import { LCV_SAPP } from "./lancerChuteExos.js";
import { DFR_SAPP } from "./freinageExos.js";
import { CHH_SAPP } from "./chuteExos.js";
import { LPG_SAPP } from "./loopingExos.js";
import { FLP_SAPP } from "./flipperExos.js";
import { PXT_SAPP } from "./penteXtExos.js";
import { GRV_SAPP } from "./gravitationExos.js";
import { CEL_SAPP } from "./champElecExos.js";
import { FVI_SAPP } from "./chuteVisqueuseExos.js";
import { EUL_SAPP } from './eulerChuteExos.js';
import { PILP_SAPP } from './pilePcmExos.js';
import { RPM_SAPP } from './radPcmExos.js';
import { RMNS_SAPP } from './rmnStlExos.js';
import { UVS_SAPP } from './uvirStlExos.js';
import { KSQ_SAPP } from './ksqExos.js';
import { HYD_SAPP } from './hydExos.js';
import { TSOL_SAPP } from './tsolExos.js';
import { FILT_SAPP } from './filtreExos.js';
import { GAB_SAPP } from './gabExos.js';
import { AMP_SAPP } from './ampExos.js';
import { BIOT_SAPP } from './biotExos.js';
import { MESO_SAPP } from './mesoExos.js';
import { STA_SAPP } from './staExos.js';
import { OSL_SAPP } from './oslExos.js';
import { CLP_SAPP } from "./chutePlaneExos.js";
import { NWR_SAPP } from "./newtonRectExos.js";
import { MTR_SAPP } from "./modesTransfertExos.js";
import { FRM_SAPP } from "./formesExos.js";
import { CHA_SAPP } from "./chaineExos.js";
import { SGN_SAPP } from "./signeExos.js";
import { JOU_SAPP } from "./jouleExos.js";
import { BAT_SAPP } from "./batterieExos.js";
import { LAS_SAPP } from "./laserExos.js";
import { PVE_SAPP } from "./panneauEclairementExos.js";
// ====================================================
//  ATELIER « EXTRAIRE LES DONNÉES D'UN ÉNONCÉ » — BANQUE D'ÉNONCÉS
// ====================================================
// Chaque énoncé est un petit problème de TSTL dont les nombres sont tirés au hasard. Il est construit par build(p, q) :
//   • texte : liste de morceaux de texte et de « données » cliquables {t: identifiant}
//   • tokens : pour chaque donnée, ce qu'elle représente (quoi), son affichage (aff) et la valeur à utiliser dans le calcul (use : val + unité)
//   • utiles : identifiants des données utiles POUR LA QUESTION posée (une même donnée peut être utile à une question et inutile à une autre)
//   • raisons : pour chaque donnée inutile, pourquoi elle l'est
//   • derivees : grandeurs à calculer avant d'appliquer la formule (surface, écart de température, section…)
//   • cherche : la grandeur cherchée (bonne réponse) et des propositions fausses plausibles
//   • manque : l'information qui n'est pas dans l'énoncé et qu'il faudra calculer ou chercher (facultatif)
//   • solution : le calcul final (affiché seulement dans le parcours guidé, pour montrer à quoi servent les données)
// Aucune de ces fonctions ne dépend de React : elles sont testables seules.

import { PVR_SAPP } from "./panneauRendementExos.js";
import { PVC_SAPP } from "./panneauPvExos.js";
import { ACIDES as AAM, ORDRE as AAM_ORDRE } from "./aminoAcidesModele";
import { IONS as CDT_IONS } from "./conductimetrieModele";
import * as ACF from "./acideFaibleModele";
import * as AB from "./acidesBasesModele";
import * as PRE from "./predoTstlModele";
import * as TMP from "./tamponTstlModele";
import * as CO2 from "./co2DissousModele";
import * as EXT from "./extractionAcideBaseModele";
import * as QM from "./quantiteMatiereModele";
import * as QM2 from "./quantiteMatiere2gtModele";
import * as SS2 from "./signalSonore2gtModele";
import * as SN from "./niveauSonore2gtModele";
import * as MI2 from "./mesureIncertitude2gtModele";
import * as SON2 from "./sonEmission2gtModele";
import * as CD from "./concentrationModele";
import * as LW from "./lewisModele";
import * as EQM from "./equationReactionModele";
import * as ETM from "./changementEtat2gtModele";
import * as SV from "./savonModele";
import * as RL from "./reactifLimitantModele";
import * as DM from "./dissolutionModele";
import * as CMB from "./combustionModele";
import * as RX from "./redoxModele";
import * as CL from "./couleursModele";
import * as KEP from "./satellitesModele";
import * as BRN from "./brnModele";
import * as PUR from "./corpsPur2gtModele";
import * as M_ISN from "./isnModele";
import * as PRISME2GT from "./prisme2gtModele";
import { OEIL2GT_SAPP } from "./oeilReduit2gtExos.js";
import { NOY2GT_SAPP } from "./noyauAtome2gtExos.js";
import { NUC2GT_SAPP } from "./nucleaire2gtExos.js";
import { RHC_SAPP } from "./rheoCourbesExos.js";
import { ITT_SAPP } from "./itt3Exos.js";
import { TGPB_SAPP } from "./tgPhysiqueBExos.js";
const CDT_SELS = [{ nom: 'chlorure de sodium', f: 'NaCl', cat: 'Na', an: 'Cl' }, { nom: 'nitrate de sodium', f: 'NaNO₃', cat: 'Na', an: 'NO3' }, { nom: 'éthanoate de sodium', f: 'CH₃COONa', cat: 'Na', an: 'AcO' }];
const tire = t => t[Math.floor(Math.random() * t.length)];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci3 = x => { const [m, e] = Number(x).toExponential(2).split('e'); return `${Number(m).toLocaleString('fr-FR')} × 10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
export const nb = (x, d = null) => (d == null
  ? (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e7) ? sci3(x) : Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: 4 }))
  : Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }));
// Sujet de la phrase d'un énoncé d'extraction (article et nature du composé corrects)
const SUJET_EXT = { benz: 'L’acide benzoïque', phenol: 'Le phénol (acide faible)', aniline: 'L’aniline (base faible)', tea: 'La triéthylamine (base faible)' };
const NB = s => s.replace(/ /g, ' ');                       // espace insécable : une donnée ne se coupe pas en fin de ligne
const sg = x => (x < 0 ? '−' + nb(Math.abs(x)) : nb(x));          // nombre avec « vrai » signe moins
const T = id => ({ t: id });
const sciR = x => { const [m, e] = Number(x).toExponential(1).split('e'); return `${m.replace('.', ',')} × 10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };   // 2 chiffres significatifs, notation scientifique
const tok = (aff, quoi, val, u) => ({ aff: NB(aff), quoi, use: { val, u } });
// ne garde que les données citées dans l'énoncé de la question posée (une donnée absente du texte ne s'afficherait pas)
const epure = f => (p, q) => { const b = f(p, q); return { ...b, tokens: Object.fromEntries(Object.entries(b.tokens).filter(([k]) => b.texte.some(t => t && t.t === k))) }; };

const lNom = nom => (/^[aeiouyhéèêâîôû]/i.test(nom) ? 'l’' : 'la ') + nom;       // « l’eau », « la méthylamine »
const dNom = nom => (/^[aeiouyhéèêâîôû]/i.test(nom) ? 'd’' : 'de ') + nom;      // « d’eau », « de méthylamine »

export const ENONCES = [
  // ───────────────────────────── 0. Projecteur de diapositives (1G : lentille mince)
  {
    id: 'lum1-projecteur', schema: () => ({ type: 'projection' }), domaine: 'Lentille mince', titre: 'Un projecteur de diapositives', noms: ['Position de l’écran', 'Hauteur de l’image'],
    gen: () => { const f = tire([80, 100, 120]), k = tire([1.2, 1.3, 1.5]); return { f, d: Math.round(f * k / 10), AB: tire([24, 36]), P: tire([150, 250]) }; },
    build: (p, q) => {
      const f = p.f / 1000, d = p.d / 100, OA = -d, OAp = 1 / (1 / f + 1 / OA), gam = OAp / OA, AB = p.AB / 1000;
      const tokens = {
        f: tok(`${p.f} mm`, 'Distance focale de la lentille', f, 'm'),
        d: tok(`${p.d} cm`, 'Distance entre la diapositive et la lentille (diapositive avant la lentille : OA = −d)', d, 'm'),
        P: tok(`${p.P} W`, 'Puissance de la lampe', p.P, 'W'),
      };
      const debut = ['Un projecteur contient une lentille mince convergente de distance focale ', T('f'), '. La diapositive est placée à ', T('d'),
        ' devant la lentille, et la lampe qui l’éclaire a une puissance de ', T('P'), '. On cherche à obtenir une image nette sur un écran, de l’autre côté de la lentille. '];
      const derivees = [{ id: 'OA', nom: 'Position OA de la diapositive (algébrique, origine O)', expr: 'OA = −d', val: OA, u: 'm' }];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'À quelle distance de la lentille faut-il placer l’écran ?'],
        utiles: ['f', 'd'],
        raisons: { P: 'La puissance de la lampe donne la luminosité de l’image, pas sa position.' },
        cherche: { bonne: 'La position OA′ de l’image (en m)', faux: ['Le grandissement γ de la lentille (sans unité)', 'La vergence C de la lentille (en δ)', 'La hauteur de l’image A′B′ (en m)'] },
        manque: null, solution: { txt: '1/OA′ = 1/f′ + 1/OA (relation de conjugaison)', val: OAp, u: 'm' } };
      tokens.AB = tok(`${p.AB} mm`, 'Hauteur de la diapositive', AB, 'm');
      return { tokens, derivees: [...derivees, { id: 'OAp', nom: 'Position OA′ de l’image', expr: '1/OA′ = 1/f′ + 1/OA', val: OAp, u: 'm' }],
        texte: [...debut, 'Les diapositives mesurent ', T('AB'), ' de haut. Quelle est la hauteur de l’image sur l’écran ?'],
        utiles: ['f', 'd', 'AB'],
        raisons: { P: 'La puissance de la lampe donne la luminosité de l’image, pas sa taille.' },
        cherche: { bonne: 'La hauteur algébrique A′B′ de l’image (en m)', faux: ['La position OA′ de l’image (en m)', 'La vergence C de la lentille (en δ)', 'Le grandissement γ de la lentille (sans unité)'] },
        manque: null, solution: { txt: 'A′B′ = γ × AB avec γ = frac(OA′|OA)', val: gam * AB, u: 'm' } };
    },
  },
  // ───────────────────────────── Ondes mécaniques (1G) : le sondeur d'un bateau (écho)
  {
    id: 'ond1g-celerite-sonar', domaine: 'Ondes mécaniques : célérité et retard', titre: 'Le sondeur d’un bateau', noms: ['Profondeur de la mer', 'Célérité du son dans l’eau'],
    gen: () => { const dt = tire([40, 60, 80, 100, 120, 160, 200]); return { dt, f: tire([40, 50, 200]), L: tire([8, 12, 15, 20]) }; },
    build: (p, q) => {
      const c = 1500, dt = p.dt / 1000, H = c * dt / 2;
      const tokens = {
        dt: tok(`${p.dt} ms`, 'Durée entre l’émission du signal et le retour de l’écho', dt, 's'),
        f: tok(`${p.f} kHz`, 'Fréquence du signal émis', p.f * 1000, 'Hz'),
        L: tok(`${p.L} m`, 'Longueur du bateau', p.L, 'm'),
      };
      const raisons = { f: 'La fréquence du signal ne change pas la célérité du son dans l’eau : elle ne sert pas à calculer une distance.', L: 'La longueur du bateau n’intervient pas dans le trajet du signal vers le fond.' };
      if (q === 0) {
        tokens.c = tok('1 500 m/s', 'Célérité du son dans l’eau', c, 'm·s⁻¹');
        return { tokens, derivees: [{ id: 'dAR', nom: 'Distance parcourue par le signal (aller-retour)', expr: 'd = c × Δt', val: c * dt, u: 'm' }],
          texte: ['Le sondeur d’un bateau de ', T('L'), ' de long émet vers le fond un signal sonore de fréquence ', T('f'), '. L’écho revient ', T('dt'), ' après l’émission. La célérité du son dans l’eau est ', T('c'), '. Quelle est la profondeur de la mer ?'],
          utiles: ['dt', 'c'], raisons,
          cherche: { bonne: 'La profondeur de la mer (en m)', faux: ['La longueur de l’onde sonore (en m)', 'La fréquence de l’écho (en Hz)', 'La durée de l’aller seul (en ms)'] },
          manque: null, solution: { txt: 'profondeur = frac(c × Δt|2) (le signal fait un aller-retour)', val: H, u: 'm' } };
      }
      tokens.H = tok(`${nb(H, 0)} m`, 'Profondeur de la mer sous le bateau', H, 'm');
      return { tokens, derivees: [{ id: 'dAR', nom: 'Distance parcourue par le signal (aller-retour)', expr: 'd = 2 × H', val: 2 * H, u: 'm' }],
        texte: ['Pour étalonner son sondeur, un bateau de ', T('L'), ' de long émet un signal de fréquence ', T('f'), ' au-dessus d’un fond situé à ', T('H'), ' de profondeur. L’écho revient ', T('dt'), ' après l’émission. Quelle est la célérité du son dans l’eau ?'],
        utiles: ['H', 'dt'], raisons,
        cherche: { bonne: 'La célérité du son dans l’eau (en m/s)', faux: ['La profondeur de la mer (en m)', 'La longueur d’onde du signal (en m)', 'La durée de l’aller seul (en s)'] },
        manque: null, solution: { txt: 'c = frac(2 × H|Δt) (le signal fait un aller-retour)', val: c, u: 'm·s⁻¹' } };
    },
  },
  // ───────────────────────────── Ondes mécaniques (1G) : une station sismique
  {
    id: 'ond1g-celerite-station', domaine: 'Ondes mécaniques : célérité et retard', titre: 'Une station sismique', noms: ['Distance station – foyer du séisme', 'Célérité des ondes sismiques'],
    gen: () => ({ c: tire([5.5, 6.0, 6.5, 7.0]), dt: tire([6, 8, 10, 12, 15, 20]), M: tire([4.2, 5.0, 5.8, 6.3]) }),
    build: (p, q) => {
      const c = p.c * 1000, dt = p.dt, d = c * dt;
      const tokens = {
        dt: tok(`${p.dt} s`, 'Durée entre le séisme et l’arrivée de l’onde à la station', dt, 's'),
        M: tok(`${nb(p.M, 1)}`, 'Magnitude du séisme', p.M, ''),
      };
      const raisons = { M: 'La magnitude mesure l’énergie libérée par le séisme : elle n’intervient pas dans la durée de propagation.' };
      if (q === 0) {
        tokens.c = tok(`${nb(p.c, 1)} km/s`, 'Célérité des ondes sismiques P dans la croûte', c, 'm·s⁻¹');
        return { tokens, derivees: [], texte: ['Un séisme de magnitude ', T('M'), ' se produit près de la surface (séisme superficiel : on assimile le foyer à l’épicentre). Les ondes P, de célérité ', T('c'), ', atteignent une station sismique ', T('dt'), ' après le séisme (on suppose l’instant du séisme connu). Quelle est la distance entre la station et le foyer du séisme ?'],
          utiles: ['dt', 'c'], raisons,
          cherche: { bonne: 'La distance station – foyer (en m)', faux: ['La magnitude du séisme', 'La durée de l’onde réfléchie (en s)', 'L’énergie libérée par le séisme (en J)'] },
          manque: null, solution: { txt: 'd = c × Δt', val: d, u: 'm' } };
      }
      tokens.d = tok(`${nb(d / 1000)} km`, 'Distance entre la station et le foyer du séisme', d, 'm');
      return { tokens, derivees: [], texte: ['Un séisme de magnitude ', T('M'), ' superficiel est enregistré à ', T('d'), ' de la station (on assimile le foyer à l’épicentre). L’onde P arrive à la station ', T('dt'), ' après le séisme (on suppose l’instant du séisme connu). Quelle est la célérité de l’onde ?'],
        utiles: ['d', 'dt'], raisons,
        cherche: { bonne: 'La célérité de l’onde P (en m/s)', faux: ['La distance station – foyer (en m)', 'La durée de propagation (en s)', 'La magnitude du séisme'] },
        manque: null, solution: { txt: 'c = frac(d|Δt)', val: c, u: 'm·s⁻¹' } };
    },
  },
  // ───────────────────────────── 1G : ondes mécaniques périodiques, une onde sur une corde
  {
    id: 'ond1g-periode-corde', schema: () => ({ type: 'cordeCapteurs' }), domaine: 'Ondes mécaniques périodiques', titre: 'Une onde sur une corde', noms: ['Longueur d’onde de l’onde', 'Célérité de l’onde'],
    gen: () => { const [c, f] = tire([[2, 4], [2, 5], [2.5, 5], [4, 5], [3, 5], [2, 2], [1, 2]]); return { c, f, A: tire([1.5, 2, 3]), Lc: tire([2.5, 3, 4]), m: tire([120, 200, 250]) }; },
    build: (p, q) => {
      const lam = p.c / p.f, Tp = 1 / p.f;
      const tokens = {
        L: tok(`${nb(p.Lc, 1)} m`, 'Longueur de la corde', p.Lc, 'm'),
        A: tok(`${nb(p.A, 1)} cm`, 'Amplitude du mouvement de la main', p.A / 100, 'm'),
        m: tok(`${p.m} g`, 'Masse de la corde', p.m / 1000, 'kg'),
      };
      if (q === 0) {
        tokens.f = tok(`${p.f} Hz`, 'Fréquence de la source (la main)', p.f, 'Hz');
        tokens.c = tok(`${nb(p.c, 1)} m/s`, 'Célérité de l’onde le long de la corde', p.c, 'm·s⁻¹');
        return { tokens, derivees: [],
          texte: ['Un élève secoue l’extrémité d’une corde de longueur ', T('L'), ' et de masse ', T('m'), ', avec une amplitude de ', T('A'), ', à la fréquence de ', T('f'), '. Une onde sinusoïdale se propage le long de la corde avec la célérité ', T('c'), '. Quelle est sa longueur d’onde ?'],
          utiles: ['f', 'c'],
          raisons: { L: 'La longueur de la corde ne fixe pas la longueur d’onde : celle-ci dépend de la célérité et de la fréquence.', m: 'La masse de la corde intervient dans la célérité, déjà donnée ici : elle ne sert pas pour trouver λ.', A: 'L’amplitude règle la hauteur de l’onde, pas la distance entre deux crêtes.' },
          cherche: { bonne: 'La longueur d’onde λ (en m)', faux: ['La période T de l’onde (en s)', 'La célérité de l’onde (en m/s)', 'L’amplitude de l’onde (en cm)'] },
          manque: null, solution: { txt: 'λ = frac(c|f) (soit λ = c × T)', val: lam, u: 'm' } };
      }
      tokens.lam = tok(`${nb(lam * 100)} cm`, 'Distance entre deux crêtes voisines sur la photo de la corde (longueur d’onde)', lam, 'm');
      delete tokens.m;
      tokens.T = tok(`${nb(Tp)} s`, 'Durée entre deux sommets successifs sur l’enregistrement d’un point (période)', Tp, 's');
      return { tokens, derivees: [],
        texte: ['Sur une corde de longueur ', T('L'), ', une onde sinusoïdale de ', T('A'), ' d’amplitude se propage. Sur la photo de la corde, deux crêtes voisines sont distantes de ', T('lam'), '. Sur l’enregistrement du mouvement d’un point, deux sommets successifs sont séparés de ', T('T'), '. Quelle est la célérité de l’onde ?'],
        utiles: ['lam', 'T'],
        raisons: { L: 'La longueur de la corde ne fixe pas la célérité de l’onde.', A: 'L’amplitude ne change ni la période ni la longueur d’onde, donc pas la célérité.' },
        cherche: { bonne: 'La célérité c de l’onde (en m/s)', faux: ['La fréquence f de l’onde (en Hz)', 'La longueur d’onde λ de l’onde (en m)', 'La durée de propagation sur toute la corde (en s)'] },
        manque: null, solution: { txt: 'c = frac(λ|T)', val: lam / Tp, u: 'm·s⁻¹' } };
    },
  },
  // ───────────────────────────── Effet Doppler (TSTL) : un chariot sur un rail
  {
    id: 'dop-chariot', domaine: 'Ondes', titre: 'Un chariot sur un rail', noms: ['Vitesse du chariot', 'Décalage Doppler prévu'],
    gen: () => { const fe = tire([25000, 40000]), v = tire([0.2, 0.3, 0.4, 0.6, 0.8, 1.0]); return { fe, v, df: Math.round(fe * v / 340), L: tire([1.2, 1.5, 2.0]), m: tire([250, 400, 500]) }; },
    build: (p, q) => {
      const c = 340;
      const tokens = {
        fe: tok(`${nb(p.fe / 1000, 0)} kHz`, 'Fréquence de l’onde émise par l’émetteur', p.fe, 'Hz'),
        c: tok(`${c} m/s`, 'Célérité du son dans l’air du laboratoire', c, 'm·s⁻¹'),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du rail', p.L, 'm'),
        m: tok(`${p.m} g`, 'Masse du chariot', p.m / 1000, 'kg'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' roule à vitesse constante sur un rail de ', T('L'), ' de long. Il porte un émetteur ultrasonore de fréquence ', T('fe'),
        ', et se rapproche d’un récepteur fixe. La célérité du son dans l’air est ', T('c'), '. '];
      if (q === 0) {
        tokens.df = tok(`${p.df} Hz`, 'Décalage Doppler lu sur le spectre (écart entre la fréquence reçue et la fréquence émise)', p.df, 'Hz');
        return { tokens, derivees: [{ id: 'rap', nom: 'Rapport δf / f_e (égal à v / c)', expr: 'δf / f_e', val: p.df / p.fe, u: '' }],
          texte: [...debut, 'Sur le spectre du signal reçu, le décalage Doppler lu vaut ', T('df'), '. À quelle vitesse roule le chariot ?'],
          utiles: ['fe', 'c', 'df'],
          raisons: { L: 'La longueur du rail ne joue pas dans l’effet Doppler : seule la vitesse compte, pas la distance parcourue.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
          cherche: { bonne: 'La vitesse v du chariot (en m/s)', faux: ['La fréquence reçue f_r (en Hz)', 'La longueur d’onde émise λ (en m)', 'La durée de l’enregistrement T (en s)'] },
          manque: null, solution: { txt: 'v = c × δf / f_e (v très inférieure à c)', val: 340 * p.df / p.fe, u: 'm/s' } };
      }
      tokens.v = tok(`${nb(p.v, 2)} m/s`, 'Vitesse du chariot', p.v, 'm·s⁻¹');
      return { tokens, derivees: [{ id: 'rap', nom: 'Rapport v / c', expr: 'v / c', val: p.v / c, u: '' }],
        texte: [...debut, 'Le chariot roule à ', T('v'), '. Quel décalage Doppler s’attend-on à lire sur le spectre ?'],
        utiles: ['fe', 'c', 'v'],
        raisons: { L: 'La longueur du rail ne joue pas dans l’effet Doppler.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
        cherche: { bonne: 'Le décalage Doppler δf (en Hz)', faux: ['La vitesse v du chariot (en m/s)', 'La fréquence reçue f_r (en Hz)', 'La durée du trajet sur le rail (en s)'] },
        manque: null, solution: { txt: 'δf = frac(f_e × v|c) (v très inférieure à c)', val: p.fe * p.v / c, u: 'Hz' } };
    },
  },
  // ───────────────────────────── Effet Doppler (TG) : un laser sur un chariot
  {
    id: 'dopg-laser', domaine: 'Ondes', titre: 'Un laser sur un chariot', noms: ['Décalage Doppler du laser', 'Vitesse du chariot'],
    gen: () => ({ lam: tire([532, 633, 650]), v: tire([0.2, 0.5, 1.0, 2.0]), P: tire([1, 5]), m: tire([250, 400, 500]) }),
    build: (p, q) => {
      const c = 3e8, lam = p.lam * 1e-9, fe = c / lam, df = fe * p.v / c;
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de la lumière émise', lam, 'm'),
        c: tok('3,00 × 10⁸ m/s', 'Célérité de la lumière', c, 'm·s⁻¹'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P / 1000, 'W'),
        m: tok(`${p.m} g`, 'Masse du chariot', p.m / 1000, 'kg'),
      };
      const debut = ['Une diode laser de puissance ', T('P'), ' est fixée sur un chariot de masse ', T('m'), ' qui roule à vitesse constante vers un récepteur fixe. La lumière émise a pour longueur d’onde ', T('lam'),
        ' ; la célérité de la lumière est ', T('c'), '. La vitesse du chariot est très inférieure à celle de la lumière. '];
      const derivees = [{ id: 'fe', nom: 'Fréquence émise f_e', expr: 'f_e = frac(c|λ)', val: fe, u: 'Hz' }];
      if (q === 0) {
        tokens.v = tok(`${nb(p.v, 1)} m/s`, 'Vitesse du chariot', p.v, 'm·s⁻¹');
        return { tokens, derivees, texte: [...debut, 'Le chariot roule à ', T('v'), '. Quel décalage Doppler observe-t-on sur la fréquence de la lumière reçue ?'],
          utiles: ['lam', 'c', 'v'],
          raisons: { P: 'La puissance du laser donne l’intensité lumineuse, pas la fréquence : elle n’intervient pas dans le décalage.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
          cherche: { bonne: 'Le décalage Doppler δf (en Hz)', faux: ['La fréquence émise f_e uniquement (en Hz)', 'La vitesse du chariot (en m/s)', 'Le décalage relatif δf / f_e (sans unité)'] },
          manque: null, solution: { txt: 'f_e = frac(c|λ) puis δf = frac(f_e × v|c)', val: df, u: 'Hz' } };
      }
      const dfAff = Number((df / 1e6).toFixed(2));
      tokens.df = tok(`${nb(dfAff, 2)} MHz`, 'Décalage Doppler mesuré sur la lumière reçue', dfAff * 1e6, 'Hz');
      return { tokens, derivees, texte: [...debut, 'On mesure un décalage Doppler de ', T('df'), '. À quelle vitesse roule le chariot ?'],
        utiles: ['lam', 'c', 'df'],
        raisons: { P: 'La puissance du laser n’intervient pas dans le décalage de fréquence.', m: 'La masse du chariot n’intervient pas dans le décalage de fréquence.' },
        cherche: { bonne: 'La vitesse v du chariot (en m/s)', faux: ['La fréquence émise f_e (en Hz)', 'La fréquence reçue f_r (en Hz)', 'L’énergie d’un photon (en J)'] },
        manque: null, solution: { txt: 'f_e = frac(c|λ) puis v = c × δf / f_e', val: c * dfAff * 1e6 / fe, u: 'm/s' } };
    },
  },
  // ───────────────────────────── Cinétique (TG) : vitesse volumique et loi d’ordre 1
  {
    id: 'cinv-vitesse', domaine: 'Cinétique : vitesse volumique et ordre 1', titre: 'Vitesse volumique à partir d’un tableau de mesures', noms: ['Disparition d’un réactif', 'Apparition d’un produit'],
    gen: () => { const c1 = tire([0.080, 0.100, 0.120, 0.150]), t1 = tire([2, 4, 5]), dt = tire([3, 4, 5, 6]), kk = tire([0.05, 0.08, 0.10]);
      const c2 = Number((c1 * Math.exp(-kk * dt)).toFixed(3)); return { c1, c2, t1, t2: t1 + dt, V: tire([100, 250, 500]), T: tire([25, 30, 35]) }; },
    build: (p, q) => {
      const tokens = {
        t1: tok(`${p.t1},0 min`, 'Premier instant de mesure', p.t1, 'min'), t2: tok(`${p.t2},0 min`, 'Second instant de mesure', p.t2, 'min'),
        V: tok(`${p.V} mL`, 'Volume du mélange réactionnel', p.V, 'mL'), T: tok(`${p.T} °C`, 'Température du bain thermostaté', p.T, '°C'),
      };
      const debut = ['Une transformation totale est suivie dans un bain thermostaté à ', T('T'), ' ; le mélange réactionnel a un volume de ', T('V'), '. '];
      const raisons = { V: 'Le volume n’intervient pas : la vitesse volumique se calcule avec des concentrations (déjà ramenées au litre).', T: 'La température est constante : elle ne sert pas à calculer la vitesse volumique entre deux instants.' };
      if (q === 0) {
        tokens.c1 = tok(`${nb(p.c1, 3)} mol/L`, 'Concentration du réactif au premier instant', p.c1, 'mol·L⁻¹');
        tokens.c2 = tok(`${nb(p.c2, 3)} mol/L`, 'Concentration du réactif au second instant', p.c2, 'mol·L⁻¹');
        return { tokens, derivees: ['Δc = c₂ − c₁', 'Δt = t₂ − t₁'], texte: [...debut, 'La concentration du réactif vaut ', T('c1'), ' à l’instant ', T('t1'), ' et ', T('c2'), ' à l’instant ', T('t2'), '. Quelle est la vitesse volumique moyenne de disparition du réactif entre ces deux instants ?'],
          utiles: ['c1', 'c2', 't1', 't2'], raisons,
          cherche: { bonne: 'La vitesse volumique moyenne de disparition v (en mol·L⁻¹·min⁻¹)', faux: ['La constante de vitesse k (en min⁻¹)', 'Le temps de demi-réaction (en min)', 'La quantité de réactif consommée (en mol)'] },
          manque: null, solution: { txt: 'v = −Δc / Δt = frac(c₁ − c₂|t₂ − t₁)', val: (p.c1 - p.c2) / (p.t2 - p.t1), u: 'mol·L⁻¹·min⁻¹' } };
      }
      tokens.p1 = tok(`${nb(p.c1, 3)} mol/L`, 'Concentration du produit au premier instant', p.c1, 'mol·L⁻¹');
      tokens.p2 = tok(`${nb(p.c1 + p.c1 - p.c2, 3)} mol/L`, 'Concentration du produit au second instant', p.c1 + p.c1 - p.c2, 'mol·L⁻¹');
      return { tokens, derivees: ['Δc = c₂ − c₁', 'Δt = t₂ − t₁'], texte: [...debut, 'La concentration d’un produit vaut ', T('p1'), ' à l’instant ', T('t1'), ' et ', T('p2'), ' à l’instant ', T('t2'), '. Quelle est la vitesse volumique moyenne d’apparition de ce produit entre ces deux instants ?'],
        utiles: ['p1', 'p2', 't1', 't2'], raisons,
        cherche: { bonne: 'La vitesse volumique moyenne d’apparition v (en mol·L⁻¹·min⁻¹)', faux: ['La constante de vitesse k (en min⁻¹)', 'Le temps de demi-réaction (en min)', 'La quantité de produit formée (en mol)'] },
        manque: null, solution: { txt: 'v = Δc / Δt = frac(c₂ − c₁|t₂ − t₁)', val: (p.c1 - p.c2) / (p.t2 - p.t1), u: 'mol·L⁻¹·min⁻¹' } };
    },
  },
  {
    id: 'cinv-k', domaine: 'Cinétique : vitesse volumique et ordre 1', titre: 'Constante k d’une loi d’ordre 1', noms: ['Avec le graphique de ln c', 'Avec v et c à un instant'],
    gen: () => ({ l1: tire([-3.22, -3.00, -2.53]), k: tire([0.05, 0.08, 0.10, 0.15]), t2: tire([6, 8, 10]), c: tire([20, 30, 40, 50]), kv: tire([0.08, 0.12, 0.15, 0.20]), V: tire([100, 250, 500]), T: tire([25, 30, 35]) }),
    build: (p, q) => {
      const debut = ['La disparition d’un réactif suit une loi de vitesse d’ordre 1 (v = k × c) dans un bain thermostaté à ', T('T'), ', le volume du mélange étant de ', T('V'), '. '];
      const tokens = { T: tok(`${p.T} °C`, 'Température du bain', p.T, '°C'), V: tok(`${p.V} mL`, 'Volume du mélange', p.V, 'mL') };
      const raisons = { T: 'La température est constante pendant le suivi : elle fixe la valeur de k mais ne sert pas à la calculer ici.', V: 'Le volume du mélange n’intervient pas dans le calcul de k.' };
      if (q === 0) {
        const l2 = Number((p.l1 - p.k * p.t2).toFixed(2));
        tokens.l1 = tok(`${nb(p.l1, 2)}`, 'ln(frac(c|c°)) à t = 0', p.l1, ''); tokens.l2 = tok(`${nb(l2, 2)}`, 'ln(frac(c|c°)) au second instant', l2, ''); tokens.t2 = tok(`${p.t2},0 min`, 'Second instant', p.t2, 'min');
        return { tokens, derivees: ['pente = Δ ln(frac(c|c°)) / Δt'], texte: [...debut, 'Sur le graphique de ln(frac(c|c°)) en fonction du temps, la droite passe par le point (0 ; ', T('l1'), ') et par le point (', T('t2'), ' ; ', T('l2'), '). Quelle est la constante de vitesse k ?'],
          utiles: ['l1', 'l2', 't2'], raisons,
          cherche: { bonne: 'La constante de vitesse k (en min⁻¹), opposée de la pente de la droite', faux: ['La vitesse volumique v (en mol·L⁻¹·min⁻¹)', 'La concentration initiale c₀ (en mol/L)', 'Le temps de demi-réaction (en min)'] },
          manque: null, solution: { txt: 'k = −pente = −frac(l₂ − l₁|t₂)', val: (p.l1 - l2) / p.t2, u: 'min⁻¹' } };
      }
      const v = Number((p.kv * p.c).toFixed(2));
      tokens.c = tok(`${p.c},0 mmol/L`, 'Concentration à un instant', p.c, 'mmol·L⁻¹'); tokens.v = tok(`${nb(v, 2)} mmol·L⁻¹·min⁻¹`, 'Vitesse volumique de disparition au même instant', v, 'mmol·L⁻¹·min⁻¹');
      return { tokens, derivees: [], texte: [...debut, 'À un instant donné, la concentration du réactif est ', T('c'), ' et la vitesse volumique de disparition vaut ', T('v'), '. Quelle est la constante de vitesse k ?'],
        utiles: ['c', 'v'], raisons,
        cherche: { bonne: 'La constante de vitesse k (en min⁻¹)', faux: ['Le temps de demi-réaction (en min)', 'La concentration initiale c₀ (en mol/L)', 'La pente de la tangente à la courbe c(t)'] },
        manque: null, solution: { txt: 'k = frac(v|c)', val: v / p.c, u: 'min⁻¹' } };
    },
  },
  // ───────────────────────────── Radioactivité (TG) : activité et datation
  {
    id: 'rad-activite', domaine: 'Radioactivité : décroissance et demi-vie', titre: 'Activité d’un échantillon d’iode 131', noms: ['Activité initiale', 'Constante radioactive λ'],
    gen: () => { const th = 8 /* demi-vie réelle de l’iode 131 : 8,0 jours */, N0 = tire([2.0e7, 4.0e7, 5.0e7, 8.0e7]); return { th, N0, lam: Number((Math.LN2 / (th * 86400)).toPrecision(2)), m: tire([12, 25, 40]) }; },
    build: (p, q) => {
      const tokens = {
        th: tok(`${p.th},0 jours`, 'Demi-vie de l’iode 131 (valeur utilisée)', p.th, 'j'),
        N0: tok(`${sciR(p.N0)} noyaux`, 'Nombre de noyaux radioactifs à l’instant initial', p.N0, ''),
        m: tok(`${p.m} g`, 'Masse du flacon qui contient l’échantillon', p.m, 'g'),
      };
      const raisons = { m: 'La masse du flacon n’intervient ni dans λ ni dans l’activité : l’activité dépend du nombre de noyaux et de λ.' };
      const debut = ['Un échantillon d’iode 131 est conservé dans un flacon de masse ', T('m'), '. À l’instant initial, il contient ', T('N0'), '. '];
      if (q === 0) {
        tokens.lam = tok(`${sciR(p.lam)} s⁻¹`, 'Constante radioactive de l’iode 131', p.lam, 's⁻¹');
        return { tokens, derivees: [], texte: [...debut, 'La constante radioactive de l’iode 131 vaut ', T('lam'), ' (sa demi-vie est de ', T('th'), '). Quelle est l’activité initiale de l’échantillon ?'],
          utiles: ['N0', 'lam'], raisons: { ...raisons, th: 'λ est déjà donnée en s⁻¹ : la demi-vie n’est pas nécessaire pour calculer A₀.' },
          cherche: { bonne: 'L’activité initiale A₀ (en Bq)', faux: ['La demi-vie de l’échantillon (en jours)', 'Le nombre de noyaux restant après une demi-vie', 'L’âge de l’échantillon (en années)'] },
          manque: null, solution: { txt: 'A₀ = λ·N₀', val: p.lam * p.N0, u: 'Bq' } };
      }
      return { tokens, derivees: ['t½ en secondes : t½ × 86 400 s par jour'], texte: [...debut, 'La demi-vie de l’iode 131 vaut ', T('th'), '. On veut calculer sa constante radioactive λ, en s⁻¹.'],
        utiles: ['th'], raisons: { ...raisons, N0: 'λ est une caractéristique du noyau : elle ne dépend pas du nombre de noyaux de l’échantillon.' },
        cherche: { bonne: 'La constante radioactive λ (en s⁻¹)', faux: ['L’activité initiale A₀ (en Bq)', 'Le nombre de noyaux restant après une demi-vie', 'L’âge de l’échantillon (en années)'] },
        manque: null, solution: { txt: 'λ = frac(ln 2|t½), avec t½ converti en secondes', val: Math.LN2 / (p.th * 86400), u: 's⁻¹' } };
    },
  },
  {
    id: 'rad-age', domaine: 'Radioactivité : décroissance et demi-vie', titre: 'Dater un échantillon avec le carbone 14', noms: ['Avec le nombre de noyaux', 'Avec le pourcentage restant'],
    gen: () => { const N0 = tire([8.0e6, 6.4e6, 9.6e6]), n = tire([2, 3, 4]); return { N0, n, N: N0 / 2 ** n, f: tire([80, 70, 60, 45, 35]), m: tire([15, 30, 50]), z: tire([1.5, 2.0, 3.0]) }; },
    build: (p, q) => {
      const tokens = {
        th: tok('5 730 ans', 'Demi-vie du carbone 14', 5730, 'ans'),
        m: tok(`${p.m} g`, 'Masse de l’échantillon prélevé', p.m, 'g'),
        z: tok(`${nb(p.z, 1)} m`, 'Profondeur de la fouille où l’échantillon a été trouvé', p.z, 'm'),
      };
      const raisons = { m: 'La masse prélevée n’intervient pas : seule la fraction de carbone 14 restante compte.', z: 'La profondeur de la fouille ne sert pas à calculer l’âge avec la décroissance du carbone 14.' };
      const debut = ['Un échantillon organique de masse ', T('m'), ' a été trouvé à ', T('z'), ' de profondeur. La demi-vie du carbone 14 est de ', T('th'), '. '];
      if (q === 0) {
        tokens.N0 = tok(`${sciR(p.N0)} noyaux`, 'Nombre de noyaux de carbone 14 dans un échantillon vivant de même masse', p.N0, '');
        tokens.N = tok(`${sciR(p.N)} noyaux`, 'Nombre de noyaux de carbone 14 mesuré dans l’échantillon', p.N, '');
        return { tokens, derivees: ['nombre de demi-vies : n tel que frac(N₀|N) = 2ⁿ'], texte: [...debut, 'Un échantillon vivant de même masse contient ', T('N0'), ' de carbone 14 ; on en mesure ', T('N'), ' dans l’échantillon. Quel est l’âge de l’échantillon ?'],
          utiles: ['th', 'N0', 'N'], raisons,
          cherche: { bonne: 'L’âge de l’échantillon (en années)', faux: ['La constante radioactive λ (en s⁻¹)', 'L’activité de l’échantillon (en Bq)', 'Le nombre de noyaux disparus (en nombre de noyaux)'] },
          manque: null, solution: { txt: 'frac(N₀|N) = 2ⁿ, âge = n × t½', val: p.n * 5730, u: 'ans' } };
      }
      tokens.f = tok(`${p.f} %`, 'Pourcentage de carbone 14 restant par rapport à un échantillon vivant', p.f, '%');
      return { tokens, derivees: ['λ = frac(ln 2|t½)', 'rapport frac(N₀|N) = 100 / pourcentage restant'], texte: [...debut, 'On mesure ', T('f'), ' du carbone 14 d’un échantillon vivant. Quel est l’âge de l’échantillon ?'],
        utiles: ['th', 'f'], raisons,
        cherche: { bonne: 'L’âge de l’échantillon (en années)', faux: ['La constante radioactive λ (en s⁻¹)', 'L’activité de l’échantillon (en Bq)', 'Le nombre de noyaux disparus (en nombre de noyaux)'] },
        manque: null, solution: { txt: 't = (t½ / ln 2) × ln(frac(N₀|N))', val: (5730 / Math.LN2) * Math.log(100 / p.f), u: 'ans' } };
    },
  },
  // ───────────────────────────── Quantité de matière (1G) : masse molaire, volume molaire
  {
    id: 'mol1g-qte-solide', domaine: 'Quantité de matière : masse molaire et volume molaire', titre: 'Un comprimé de paracétamol', noms: ['Quantité de matière dans le comprimé', 'Nombre de molécules dans le comprimé'],
    gen: () => { const m = tire([300, 500, 650, 1000]); return { m, mTot: tire([0.9, 1.2, 1.5, 2.0].filter(t => t >= 1.3 * m / 1000)), verre: tire([100, 150, 200]) }; },   // la masse du comprimé dépasse toujours celle de la substance active (excipients)
    build: (p, q) => {
      const e = QM.espece('paracetamol'), M = QM.masseMolaire(e), n = p.m / 1000 / M;
      const tokens = {
        m: tok(`${p.m} mg`, 'Masse de paracétamol contenue dans le comprimé', p.m / 1000, 'g'),
        M: tok(`${nb(M, 1)} g/mol`, 'Masse molaire du paracétamol', M, 'g/mol'),
        mTot: tok(`${nb(p.mTot, 1)} g`, 'Masse totale du comprimé (paracétamol et excipients)', p.mTot, 'g'),
        verre: tok(`${p.verre} mL`, 'Volume d’eau du verre dans lequel on dissout le comprimé', p.verre, 'mL'),
      };
      const raisons = { mTot: 'La masse totale du comprimé contient aussi des excipients : seule la masse de paracétamol compte.', verre: 'Le volume d’eau du verre ne sert pas à calculer la quantité de matière de paracétamol.' };
      const debut = ['Un comprimé de masse totale ', T('mTot'), ' contient ', T('m'), ' de paracétamol ', QM.formuleTexte(e), ' (masse molaire ', T('M'), '). On le dissout dans un verre de ', T('verre'), ' d’eau. '];
      if (q === 0) return { tokens, derivees: ['masse en grammes : frac(m (mg)|1000)'], texte: [...debut, 'Quelle est la quantité de matière de paracétamol dans le comprimé ?'],
        utiles: ['m', 'M'], raisons,
        cherche: { bonne: 'La quantité de matière n de paracétamol (en mol)', faux: ['La masse molaire du paracétamol (en g/mol)', 'La concentration du paracétamol dans le verre (en mol/L)', 'Le nombre de molécules de paracétamol, sans passer par n'] },
        manque: null, solution: { txt: 'n = frac(m|M), avec m converti en grammes', val: n, u: 'mol' } };
      tokens.NA = tok('6,02 × 10²³ mol⁻¹', 'Constante d’Avogadro', QM.NA, 'mol⁻¹');
      return { tokens, derivees: ['masse en grammes : frac(m (mg)|1000)', { id: 'n', nom: 'Quantité de matière de paracétamol', expr: 'n = frac(m|M)', val: n, u: 'mol' }],
        texte: [...debut, 'On donne la constante d’Avogadro ', T('NA'), '. Combien de molécules de paracétamol le comprimé contient-il ?'],
        utiles: ['m', 'M', 'NA'], raisons,
        cherche: { bonne: 'Le nombre N de molécules de paracétamol', faux: ['La quantité de matière n de paracétamol (en mol)', 'La masse d’une seule molécule de paracétamol (en g)', 'La masse molaire du paracétamol (en g/mol)'] },
        manque: null, solution: { txt: 'N = n × N_A, avec n = frac(m|M)', val: n * QM.NA, u: 'molécules' } };
    },
  },
  {
    id: 'mol1g-qte-gaz', domaine: 'Quantité de matière : masse molaire et volume molaire', titre: 'Un ballon de gaz', noms: ['Quantité de matière de gaz', 'Masse de gaz'],
    gen: () => { const theta = tire([0, 20, 25]); return { e: tire(['o2', 'n2', 'co2', 'ch4']), theta, Vm: QM.VM_USUEL[theta], V: tire([250, 500, 750, 1000]), mB: tire([35, 48, 62]) }; },
    build: (p, q) => {
      const e = QM.espece(p.e), M = QM.masseMolaire(e), n = p.V / 1000 / p.Vm;
      const tokens = {
        V: tok(`${p.V} mL`, 'Volume du ballon, entièrement rempli de gaz', p.V / 1000, 'L'),
        Vm: tok(`${nb(p.Vm, 1)} L/mol`, `Volume molaire d’un gaz à ${p.theta} °C et 1013 hPa`, p.Vm, 'L/mol'),
        mB: tok(`${p.mB} g`, 'Masse du ballon vide', p.mB, 'g'),
        th: tok(`${p.theta} °C`, 'Température du gaz', p.theta, '°C'),
      };
      const debut = ['Un ballon de volume ', T('V'), ' est rempli de ', e.nom, ' ', QM.formuleTexte(e), ' à ', T('th'), ' et 1013 hPa ; dans ces conditions, le volume molaire des gaz est ', T('Vm'), '. Le ballon vide pèse ', T('mB'), '. '];
      if (q === 0) return { tokens, derivees: ['volume en litres : frac(V (mL)|1000)'], texte: [...debut, 'Quelle est la quantité de matière de gaz dans le ballon ?'],
        utiles: ['V', 'Vm'], raisons: { mB: 'La masse du ballon vide ne dit rien sur la quantité de gaz qu’il contient.', th: 'La température est déjà prise en compte dans la valeur de V_m donnée.' },
        cherche: { bonne: 'La quantité de matière n de gaz (en mol)', faux: ['La masse molaire du gaz (en g/mol)', 'La masse totale du ballon rempli (en g)', 'La masse volumique du gaz (en g/L)'] },
        manque: null, solution: { txt: 'n = frac(V|V_m), avec V converti en litres', val: n, u: 'mol' } };
      tokens.M = tok(`${nb(M, 1)} g/mol`, `Masse molaire du ${e.nom}`, M, 'g/mol');
      return { tokens, derivees: ['volume en litres : frac(V (mL)|1000)', { id: 'n', nom: 'Quantité de matière de gaz', expr: 'n = frac(V|V_m)', val: n, u: 'mol' }],
        texte: [...debut, 'La masse molaire du ', e.nom, ' est ', T('M'), '. Quelle est la masse de gaz contenue dans le ballon (sans le ballon) ?'],
        utiles: ['V', 'Vm', 'M'], raisons: { mB: 'On demande la masse du gaz seul : la masse du ballon vide ne sert pas.', th: 'La température est déjà prise en compte dans la valeur de V_m donnée.' },
        cherche: { bonne: 'La masse m de gaz dans le ballon (en g)', faux: ['La masse totale du ballon rempli de gaz (en g)', 'La quantité de matière de gaz (en mol)', 'La masse volumique du gaz (en g/L)'] },
        manque: null, solution: { txt: 'm = n × M, avec n = frac(V|V_m)', val: n * M, u: 'g' } };
    },
  },
  // ───────────────────────────── Schéma de Lewis (1G) : électrons de valence et doublets
  {
    id: 'lewis1g-entite', domaine: 'Schéma de Lewis des molécules et des ions', titre: 'Une entité dont on veut le schéma de Lewis', noms: ['Nombre d’électrons de valence de l’entité', 'Nombre de doublets de l’entité'],
    gen: () => ({ e: tire(['H2O', 'NH3', 'CO2', 'CH4', 'H3Op', 'NH4p', 'HOm']), Tb: tire([20, 25, 30]) }),
    build: (p, q) => {
      const e = LW.entite(p.e), n = LW.nT(e), noms = [...new Set(e.atomes)], M = e.atomes.reduce((t, a) => t + ({ H: 1.0, C: 12.0, N: 14.0, O: 16.0 })[a], 0);
      const tokens = {
        Z1: tok(`Z(${noms[0]}) = ${LW.ZAtome(noms[0])}`, `Numéro atomique de l’atome ${noms[0]}`, LW.ZAtome(noms[0]), ''),
        Z2: tok(`Z(${noms[1]}) = ${LW.ZAtome(noms[1])}`, `Numéro atomique de l’atome ${noms[1]}`, LW.ZAtome(noms[1]), ''),
        M: tok(`${nb(M, 1)} g/mol`, `Masse molaire de ${e.nom}`, M, 'g/mol'),
        Tb: tok(`${p.Tb} °C`, 'Température de la salle', p.Tb, '°C'),
      };
      if (e.q !== 0) tokens.q = tok(`${e.q > 0 ? '+' : '−'}${Math.abs(e.q)}`, `Charge de l’ion ${e.formule} (en unités de charge élémentaire)`, e.q, 'e');
      const raisons = { M: 'La masse molaire sert à passer de la masse à la quantité de matière : elle ne compte pas d’électrons de valence.', Tb: 'La température de la salle n’intervient pas dans la structure électronique de l’entité.' };
      const debut = ['On étudie ', e.q !== 0 ? 'l’ion ' : 'la molécule ', e.nom, ' ', e.formule, ' (masse molaire ', T('M'), '), dans une salle à ', T('Tb'), '. Ses atomes ont pour numéros atomiques ', T('Z1'), ' et ', T('Z2'), ...(e.q !== 0 ? [' ; l’ion porte la charge ', T('q'), '.'] : [' ; l’entité est électriquement neutre.'])];
      const utiles = e.q !== 0 ? ['Z1', 'Z2', 'q'] : ['Z1', 'Z2'];
      if (q === 0) return { tokens, derivees: ['électrons de valence de chaque atome seul, d’après son numéro atomique (configuration électronique)'], texte: [...debut, ' On veut établir son schéma de Lewis : combien d’électrons de valence faut-il représenter au total ?'],
        utiles, raisons,
        cherche: { bonne: 'Le nombre total n_T d’électrons de valence de l’entité', faux: ['La quantité de matière de l’entité (en mol)', 'La masse molaire de l’entité (en g/mol)', 'Le nombre total d’électrons de tous les atomes de l’entité'] },
        manque: null, solution: { txt: 'n_T = somme des électrons de valence des atomes seuls − charge de l’entité', val: n, u: 'électrons' } };
      return { tokens, derivees: ['électrons de valence de chaque atome seul, d’après son numéro atomique (configuration électronique)', { id: 'nT', nom: 'Nombre total d’électrons de valence', expr: 'n_T = somme des électrons de valence − charge', val: n, u: 'électrons' }],
        texte: [...debut, ' On veut placer les électrons de valence par paires : combien de doublets faut-il répartir ?'],
        utiles, raisons,
        cherche: { bonne: 'Le nombre n_D de doublets d’électrons à répartir', faux: ['Le nombre de liaisons de l’atome central', 'Le nombre total n_T d’électrons de valence', 'Le nombre d’atomes de l’entité'] },
        manque: null, solution: { txt: 'n_D = frac(n_T|2)', val: n / 2, u: 'doublets' } };
    },
  },
  // ───────────────────────────── Savons et amphiphilie (1G) : quantité de matière de savon
  {
    id: 'savon1g-pain', domaine: 'Savons et amphiphilie', titre: 'Un pain de savon à base de sel de sodium d’acide gras', noms: ['Quantité de matière d’ions carboxylate dans le pain', 'Masse de savon pour une quantité de matière donnée'],
    gen: () => ({ n: tire([10, 12, 14, 16]), m: tire([10.0, 20.0, 25.0, 50.0, 100.0]), nT: tire([0.0500, 0.100, 0.200, 0.500]), mE: tire([8.0, 12.0, 15.0]), Te: tire([20, 30, 40]) }),
    build: epure((p, q) => {
      const c = SV.carboxylate(p.n), nom = SV.SERIE.find(s => s[0] === p.n)[1], M = c.M, formule = `CH₃–(CH₂)${[...String(p.n)].map(d => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('')}–COO⁻ Na⁺`;
      const tokens = {
        m: tok(`${nb(p.m, 1)} g`, 'Masse de savon (sel de sodium)', p.m, 'g'),
        M: tok(`${nb(M, 1)} g/mol`, `Masse molaire du ${nom} de sodium`, M, 'g/mol'),
        nT: tok(`${nb(p.nT, 3)} mol`, 'Quantité de matière de savon voulue', p.nT, 'mol'),
        mE: tok(`${nb(p.mE, 1)} g`, 'Masse de l’emballage en carton', p.mE, 'g'),
        Te: tok(`${p.Te} °C`, 'Température de l’eau de lavage', p.Te, '°C'),
      };
      const raisons = { mE: 'La masse de l’emballage ne fait pas partie du savon : elle ne sert pas pour la quantité de matière de savon.', Te: 'La température de l’eau de lavage n’intervient pas dans le calcul d’une quantité de matière à partir d’une masse.' };
      const debut = ['Un savon est constitué de ', nom, ' de sodium, de formule semi-développée ', formule, ' ; sa masse molaire est ', T('M'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'n', nom: 'Quantité de matière de savon', expr: 'n = frac(m|M)', val: p.m / M, u: 'mol' }],
        texte: [...debut, 'Un pain de savon pur pèse ', T('m'), ', dans un emballage de ', T('mE'), ' ; il sert à laver dans une eau à ', T('Te'), '. Quelle quantité de matière de savon contient-il ?'],
        utiles: ['m', 'M'], raisons,
        cherche: { bonne: 'La quantité de matière n de savon (en mol)', faux: ['La masse molaire du savon (en g/mol)', 'Le nombre d’atomes de carbone de l’ion carboxylate', 'La concentration du savon dans l’eau de lavage (en mol/L)'] },
        manque: null, solution: { txt: 'n = frac(m|M)', val: p.m / M, u: 'mol' } };
      return { tokens, derivees: [],
        texte: [...debut, 'On veut préparer un lot qui contient ', T('nT'), ' de savon. Le savon est livré dans un emballage de ', T('mE'), ', et l’eau de lavage est à ', T('Te'), '. Quelle masse de savon faut-il peser ?'],
        utiles: ['nT', 'M'], raisons,
        cherche: { bonne: 'La masse m de savon à peser (en g)', faux: ['La quantité de matière de savon (en mol)', 'La masse molaire du savon (en g/mol)', 'La masse totale de savon et d’emballage (en g)'] },
        manque: null, solution: { txt: 'm = n × M', val: p.nT * M, u: 'g' } };
    }),
  },
  // ───────────────────────────── Concentration en quantité de matière (1G) : dissolution et dilution
  {
    id: 'mol1g-conc-dissol', domaine: 'Concentration en quantité de matière : dissolution et dilution', titre: 'Une solution à préparer par dissolution', noms: ['Concentration de la solution préparée', 'Masse de solide à peser'],
    gen: () => {
      const s = tire(CD.SOLUTES.filter(x => x.id !== 'nahco3')), M = CD.masseMolaireSoluteDe(s), V = tire([100, 250, 500]);
      const c = tire([0.050, 0.100, 0.200, 0.500].filter(x => x * M <= 0.3 * s.solub));
      return { id: s.id, V, c, m: Number((c * V / 1000 * M).toPrecision(3)), th: tire([20, 25]), mF: tire([62.4, 78.4, 85.3]) };
    },
    build: epure((p, q) => {
      const s = CD.soluteDe(p.id), M = CD.masseMolaireSoluteDe(s), f = CD.formuleSolute(s);
      const tokens = {
        m: tok(`${nb(p.m)} g`, `Masse de ${s.nom} pesée`, p.m, 'g'),
        M: tok(`${nb(M, 1)} g/mol`, `Masse molaire du ${s.nom}`, M, 'g/mol'),
        V: tok(`${p.V} mL`, 'Volume de la fiole jaugée, donc volume de la solution', p.V / 1000, 'L'),
        c: tok(`${nb(p.c, 3)} mol/L`, 'Concentration voulue de la solution', p.c, 'mol/L'),
        th: tok(`${p.th} °C`, 'Température du laboratoire', p.th, '°C'),
        mF: tok(`${nb(p.mF, 1)} g`, 'Masse de la fiole jaugée vide', p.mF, 'g'),
      };
      const raisons = { th: 'La température ne change pas la quantité de matière de soluté à dissoudre dans ce modèle de solution idéale.', mF: 'La masse de la fiole vide ne sert pas : seule la masse de soluté compte.' };
      if (q === 0) return { tokens, derivees: ['volume en litres : frac(V (mL)|1000)', { id: 'n', nom: 'Quantité de matière de soluté', expr: 'n = frac(m|M)', val: p.m / M, u: 'mol' }],
        texte: ['Pour préparer une solution aqueuse de ', s.nom, ' ', f, ', on pèse ', T('m'), ' de solide ; sa masse molaire est ', T('M'), '. Le solide est dissous dans une fiole jaugée de ', T('V'), ', complétée jusqu’au trait de jauge. La fiole vide pèse ', T('mF'), ' et le laboratoire est à ', T('th'), '. Quelle est la concentration de la solution préparée ?'],
        utiles: ['m', 'M', 'V'], raisons,
        cherche: { bonne: 'La concentration c de la solution (en mol/L)', faux: ['La masse molaire du soluté (en g/mol)', 'La masse volumique de la solution (en g/L)', 'La quantité de matière d’eau dans la fiole (en mol)'] },
        manque: null, solution: { txt: 'c = frac(n|V), avec n = frac(m|M) et V converti en litres', val: p.m / M / (p.V / 1000), u: 'mol/L' } };
      return { tokens, derivees: ['volume en litres : frac(V (mL)|1000)'],
        texte: ['On veut préparer une solution aqueuse de ', s.nom, ' ', f, ' de concentration ', T('c'), ' dans une fiole jaugée de ', T('V'), '. La masse molaire du soluté est ', T('M'), ' ; la fiole vide pèse ', T('mF'), ' et le laboratoire est à ', T('th'), '. Quelle masse de solide faut-il peser ?'],
        utiles: ['c', 'V', 'M'], raisons,
        cherche: { bonne: 'La masse m de solide à peser (en g)', faux: ['Le volume d’eau à ajouter dans la fiole (en mL)', 'La masse totale de la fiole remplie de solution (en g)', 'La masse volumique de la solution (en g/L)'] },
        manque: null, solution: { txt: 'm = n × M, avec n = c × V (V en litres)', val: p.c * (p.V / 1000) * M, u: 'g' } };
    }),
  },
  {
    id: 'mol1g-conc-dilution', schema: () => ({ type: 'dilution', mere: 'solution mère', eau: 'eau distillée' }), domaine: 'Concentration en quantité de matière : dissolution et dilution', titre: 'Une solution à préparer par dilution', noms: ['Concentration de la solution fille', 'Volume de solution mère à prélever'],
    gen: () => { const d = tire(CD.dilutionsPossibles()); return { ...d, id: tire(['nacl', 'glucose', 'saccharose', 'cacl2']), b: tire([50, 100, 150]), th: tire([20, 25]) }; },
    build: epure((p, q) => {
      const s = CD.soluteDe(p.id), f = CD.formuleSolute(s);
      const tokens = {
        c0: tok(`${nb(p.c0, 3)} mol/L`, 'Concentration de la solution mère', p.c0, 'mol/L'),
        V0: tok(`${p.V0} mL`, 'Volume de solution mère prélevé à la pipette jaugée', p.V0, 'mL'),
        V1: tok(`${p.V1} mL`, 'Volume de la fiole jaugée, donc de la solution fille', p.V1, 'mL'),
        c1: tok(`${nb(p.c1, 3)} mol/L`, 'Concentration voulue de la solution fille', p.c1, 'mol/L'),
        b: tok(`${p.b} mL`, 'Volume de solution mère versé dans le bécher de prélèvement', p.b, 'mL'),
        th: tok(`${p.th} °C`, 'Température du laboratoire', p.th, '°C'),
      };
      const raisons = { b: 'Le bécher de prélèvement sert à puiser la solution mère : son volume ne dit rien sur la quantité de soluté prélevée.', th: 'La température ne change pas la quantité de soluté conservée dans la dilution.' };
      if (q === 0) return { tokens, derivees: [{ id: 'n', nom: 'Quantité de soluté prélevée', expr: 'n = c_mère × V_mère', val: p.c0 * p.V0 / 1000, u: 'mol' }],
        texte: ['Une solution mère de ', s.nom, ' ', f, ' a pour concentration ', T('c0'), '. On en verse ', T('b'), ' dans un bécher, on y prélève ', T('V0'), ' à la pipette jaugée et on les place dans une fiole jaugée de ', T('V1'), ', complétée jusqu’au trait de jauge à ', T('th'), '. Quelle est la concentration de la solution fille ?'],
        utiles: ['c0', 'V0', 'V1'], raisons,
        cherche: { bonne: 'La concentration c de la solution fille (en mol/L)', faux: ['Le facteur de dilution (sans unité)', 'La concentration en masse de la solution mère (en g/L)', 'Le volume d’eau à ajouter (en mL)'] },
        manque: null, solution: { txt: 'c_fille = frac(c_mère × V_mère|V_fille) (la quantité de soluté se conserve)', val: p.c0 * p.V0 / p.V1, u: 'mol/L' } };
      return { tokens, derivees: ['les volumes peuvent rester en mL : ils se simplifient dans le rapport'],
        texte: ['À partir d’une solution mère de ', s.nom, ' ', f, ' de concentration ', T('c0'), ', on veut préparer ', T('V1'), ' de solution fille de concentration ', T('c1'), ', dans une fiole jaugée, à ', T('th'), '. On dispose d’un bécher contenant ', T('b'), ' de solution mère. Quel volume de solution mère faut-il prélever ?'],
        utiles: ['c0', 'c1', 'V1'], raisons,
        cherche: { bonne: 'Le volume de solution mère à prélever (en mL)', faux: ['Le volume d’eau distillée à ajouter (en mL)', 'La quantité de matière d’eau dans la fiole (en mol)', 'Le facteur de dilution (sans unité)'] },
        manque: null, solution: { txt: 'V_mère = frac(c_fille × V_fille|c_mère)', val: p.c1 * p.V1 / p.c0, u: 'mL' } };
    }),
  },
  // ───────────────────────────── Dissolution d'un solide ionique (1G) : équation et concentration des ions
  {
    id: 'diss1g-sapp-solution', schema: () => ({ type: 'becher', gauche: 'solide ionique + eau', soluteGauche: true }), domaine: 'Dissolution d’un solide ionique : équation et concentration des ions', titre: 'Une solution de solide ionique à préparer', noms: ['Concentration en soluté apporté', 'Concentration effective d’un ion'],
    gen: () => {
      const s = tire(DM.SELS), M = DM.masseMolaire(s), V = tire([100, 250, 500]), c = tire([0.050, 0.100, 0.200, 0.500]);
      return { id: s.id, V, m: Number((c * V / 1000 * M).toPrecision(3)), th: tire([20, 25]), mF: tire([62.4, 78.4, 85.3]), ion: tire(['cat', 'an']) };
    },
    build: epure((p, q) => {
      const s = DM.selDe(p.id), M = DM.masseMolaire(s), I = s[p.ion];
      const tokens = {
        m: tok(`${nb(p.m)} g`, `Masse de ${s.nom} dissoute`, p.m, 'g'),
        M: tok(`${nb(M, 1)} g/mol`, `Masse molaire du ${s.nom}`, M, 'g/mol'),
        V: tok(`${nb(p.V, 1)} mL`, 'Volume de la fiole jaugée, donc volume de la solution', p.V / 1000, 'L'),
        th: tok(`${p.th} °C`, 'Température du laboratoire', p.th, '°C'),
        mF: tok(`${nb(p.mF, 1)} g`, 'Masse de la fiole jaugée vide', p.mF, 'g'),
      };
      const raisons = { th: 'La température ne change pas la quantité de matière de soluté dans ce modèle de solution idéale.', mF: 'La masse de la fiole vide ne sert pas : seule la masse de soluté dissous compte.' };
      const c = p.m / M / (p.V / 1000);
      const debut = ['On dissout ', T('m'), ' de ', s.nom, ' ', s.f, ' anhydre (solide ionique, de masse molaire ', T('M'), ') dans une fiole jaugée de ', T('V'), ', complétée jusqu’au trait de jauge. La fiole vide pèse ', T('mF'), ' et le laboratoire est à ', T('th'), '. '];
      if (q === 0) return { tokens, derivees: ['volume en litres : frac(V (mL)|1000)', { id: 'n', nom: 'Quantité de matière de soluté', expr: 'n = frac(m|M)', val: p.m / M, u: 'mol' }],
        texte: [...debut, 'Quelle est la concentration en soluté apporté de la solution ?'],
        utiles: ['m', 'M', 'V'], raisons,
        cherche: { bonne: 'La concentration c en soluté apporté (en mol/L)', faux: ['La concentration en masse de la solution (en g/L)', 'La concentration effective d’un seul ion (en mol/L)', 'Le volume d’eau versé dans la fiole (en mL)'] },
        manque: null, solution: { txt: 'c = frac(n|V), avec n = frac(m|M) et V converti en litres', val: c, u: 'mol/L' } };
      return { tokens, derivees: ['volume en litres : frac(V (mL)|1000)', { id: 'n', nom: 'Quantité de matière de soluté', expr: 'n = frac(m|M)', val: p.m / M, u: 'mol' }, { id: 'c', nom: 'Concentration en soluté apporté', expr: 'c = frac(n|V)', val: c, u: 'mol/L' }],
        texte: [...debut, 'Le solide est formé d’ions ', s.cat.s, ' et ', s.an.s, '. Quelle est la concentration effective en ions ', I.s, ' dans la solution ?'],
        utiles: ['m', 'M', 'V'], raisons,
        cherche: { bonne: `La concentration [${I.s}] de l’ion ${I.s} (en mol/L)`, faux: ['La concentration c en soluté apporté (en mol/L)', 'La quantité de matière de soluté dissous (en mol)', 'La concentration totale de tous les ions (en mol/L)'] },
        manque: { bonne: 'Il manque la relation entre [ion] et c, à écrire avec l’équation de dissolution', faux: ['Il manque la solubilité du solide dans l’eau', 'Il manque la masse volumique de la solution', 'Il manque le volume de la solution'],
          expl: `La masse, la masse molaire et le volume donnent c = frac(n|V), mais la concentration effective de l’ion vaut [${I.s}] = coefficient × c : cette relation s’écrit avec l’équation de dissolution ${DM.equation(s)}, que l’énoncé ne donne pas (il donne seulement les ions). Le coefficient de ${I.s} est ${I.nu}.` },
        solution: { txt: `[${I.s}] = ${I.nu} × c, avec c = frac(n|V) et n = frac(m|M)`, val: I.nu * c, u: 'mol/L' } };
    }),
  },
  // ───────────────────────────── Équilibre chimique (TG) : Qr, K, taux d'avancement final
  {
    id: 'equ-sapp-qr', domaine: 'Équilibre chimique : Qr, K et taux d’avancement', titre: 'Quotient de réaction et taux d’avancement d’un mélange acide-base', noms: ['Quotient de réaction du mélange', 'Taux d’avancement final'],
    gen: () => { const v = [0.050, 0.10, 0.20, 0.40], c0 = tire([0.10, 0.20, 0.40]), K = tire([0.10, 5.0, 25]), tf = Math.sqrt(K) / (1 + Math.sqrt(K)); /* état final cohérent avec K : (τ / (1 − τ))² = K */ return { a: tire(v), b: tire(v), c: tire(v), d: tire(v), K, V: tire([100, 250, 500]), c0, cf: Math.round(c0 * tf * 1000) / 1000 }; },
    build: (p, q) => {
      const tokens = {
        K: tok(`${nb(p.K)}`, 'Constante d’équilibre de la réaction à la température de l’expérience', p.K, ''),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
      };
      const rK = 'K sert à comparer Qr au système (sens d’évolution) ; elle n’intervient pas dans le calcul de Qr ni dans celui de τ.';
      const rV = 'Les concentrations sont déjà données : le volume de la solution n’intervient ni dans Qr ni dans τ.';
      const debut = ['On étudie la réaction CH₃COOH + HCOO⁻ ⇌ CH₃COO⁻ + HCOOH dans ', T('V'), ' d’eau, de constante d’équilibre ', T('K'), '. '];
      if (q === 0) {
        tokens.a = tok(`${nb(p.a, 3)} mol/L`, 'Concentration de CH₃COOH', p.a, 'mol/L'); tokens.b = tok(`${nb(p.b, 3)} mol/L`, 'Concentration de HCOO⁻', p.b, 'mol/L');
        tokens.c = tok(`${nb(p.c, 3)} mol/L`, 'Concentration de CH₃COO⁻', p.c, 'mol/L'); tokens.d = tok(`${nb(p.d, 3)} mol/L`, 'Concentration de HCOOH', p.d, 'mol/L');
        return { tokens, derivees: [], texte: [...debut, 'Dans un mélange, [CH₃COOH] = ', T('a'), ', [HCOO⁻] = ', T('b'), ', [CH₃COO⁻] = ', T('c'), ' et [HCOOH] = ', T('d'), '. Quel est le quotient de réaction du mélange ?'],
          utiles: ['a', 'b', 'c', 'd'], raisons: { K: rK, V: rV },
          cherche: { bonne: 'Le quotient de réaction Qr (sans unité)', faux: ['La constante d’équilibre K', 'Le taux d’avancement final τ', 'L’avancement maximal (en mol)'] },
          manque: null, solution: { txt: 'Qr = frac([CH₃COO⁻] × [HCOOH]|[CH₃COOH] × [HCOO⁻])', val: p.c * p.d / (p.a * p.b), u: '' } };
      }
      tokens.c0 = tok(`${nb(p.c0, 3)} mol/L`, 'Concentration initiale de CH₃COOH et de HCOO⁻ (identiques, sans produit au départ)', p.c0, 'mol/L');
      tokens.cf = tok(`${nb(p.cf, 3)} mol/L`, 'Concentration de CH₃COO⁻ à l’état final', p.cf, 'mol/L');
      return { tokens, derivees: ['avancement maximal : x_max = c₀ × V (réactif limitant), avancement final : x_f = [CH₃COO⁻] × V'], texte: [...debut, 'On part de ', T('c0'), ' de CH₃COOH et de HCOO⁻, sans produit. À l’état final, [CH₃COO⁻] = ', T('cf'), '. Quel est le taux d’avancement final ?'],
        utiles: ['c0', 'cf'], raisons: { K: rK, V: 'Le volume se simplifie : τ = frac(x_f|x_max) = frac([CH₃COO⁻] × V|c₀ × V).' },
        cherche: { bonne: 'Le taux d’avancement final τ (sans unité)', faux: ['Le quotient de réaction à l’état final', 'La concentration finale en CH₃COOH (en mol/L)', 'L’avancement final x_f (en mol)'] },
        manque: null, solution: { txt: 'τ = frac(x_f|x_max) = [CH₃COO⁻]_f / c₀', val: p.cf / p.c0, u: '' } };
    },
  },
  {
    id: 'equ-sapp-etat', domaine: 'Équilibre chimique : Qr, K et taux d’avancement', titre: 'État initial ou état final : quelles données pour K et pour le sens ?', noms: ['Constante d’équilibre K', 'Quotient de réaction au départ'],
    gen: () => { const mel = tire([[0.20, 0.10, 0.10, 0.050], [0.10, 0.10, 0.20, 0.20], [0.40, 0.20, 0.050, 0.050], [0.40, 0.10, 0.10, 0.20]]), T25 = tire([20, 25, 30]); return { mel, T25 }; },
    build: (p, q) => {
      const [a0, b0, c0, d0] = p.mel;
      // état final de la réaction CH₃COOH + HCOO⁻ ⇌ CH₃COO⁻ + HCOOH (K = 0,10) : (c0 + x)(d0 + x) = K (a0 − x)(b0 − x), soit (1 − K) x² + (c0 + d0 + K (a0 + b0)) x + c0 d0 − K a0 b0 = 0
      const K = 0.10, A2 = 1 - K, B2 = c0 + d0 + K * (a0 + b0), C2 = c0 * d0 - K * a0 * b0, x = (-B2 + Math.sqrt(B2 * B2 - 4 * A2 * C2)) / (2 * A2);
      const r3 = v => Math.round(v * 1000) / 1000, fin = [a0 - x, b0 - x, c0 + x, d0 + x].map(r3);
      const noms = ['CH₃COOH', 'HCOO⁻', 'CH₃COO⁻', 'HCOOH'], ini = [a0, b0, c0, d0];
      const tokens = { T: tok(`${p.T25} °C`, 'Température du mélange (constante)', p.T25, '°C') };
      ['a', 'b', 'c', 'd'].forEach((k, i) => { tokens[k + 'i'] = tok(`${nb(ini[i], 3)} mol/L`, `Concentration initiale de ${noms[i]}`, ini[i], 'mol/L'); tokens[k + 'f'] = tok(`${nb(fin[i], 3)} mol/L`, `Concentration de ${noms[i]} à l’état final`, fin[i], 'mol/L'); });
      const debut = ['On étudie CH₃COOH + HCOO⁻ ⇌ CH₃COO⁻ + HCOOH à la température constante de ', T('T'), '. Concentrations initiales : [CH₃COOH] = ', T('ai'), ', [HCOO⁻] = ', T('bi'), ', [CH₃COO⁻] = ', T('ci'), ', [HCOOH] = ', T('di'),
        '. Concentrations à l’état final : [CH₃COOH] = ', T('af'), ', [HCOO⁻] = ', T('bf'), ', [CH₃COO⁻] = ', T('cf'), ', [HCOOH] = ', T('df'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la constante d’équilibre K de cette réaction ?'],
        utiles: ['af', 'bf', 'cf', 'df'], raisons: { T: 'La température est constante : elle n’intervient pas dans le calcul, elle indique seulement que K ne change pas.', ai: 'À l’état final, K = Qr : seules les concentrations finales servent ; les concentrations initiales donnent un Qr de départ, qui n’est pas K.', bi: 'Les concentrations initiales ne donnent pas K : à l’état final, K = Qr calculé avec la composition finale.', ci: 'Les concentrations initiales ne donnent pas K : à l’état final, K = Qr calculé avec la composition finale.', di: 'Les concentrations initiales ne donnent pas K : à l’état final, K = Qr calculé avec la composition finale.' },
        cherche: { bonne: 'La constante d’équilibre K (sans unité)', faux: ['Le quotient de réaction au départ', 'Le taux d’avancement final', 'La température d’équilibre'] },
        manque: null, solution: { txt: 'K = Qr à l’état final = frac([CH₃COO⁻] × [HCOOH]|[CH₃COOH] × [HCOO⁻]), concentrations finales', val: (fin[2] * fin[3]) / (fin[0] * fin[1]), u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le quotient de réaction du mélange au départ (pour prévoir son sens d’évolution) ?'],
        utiles: ['ai', 'bi', 'ci', 'di'], raisons: { T: 'La température est constante : elle n’intervient pas dans le calcul de Qr.', af: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.', bf: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.', cf: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.', df: 'L’état final est celui où Qr = K : il ne sert pas à prévoir le sens d’évolution du mélange de départ.' },
        cherche: { bonne: 'Le quotient de réaction Qr du mélange de départ (sans unité)', faux: ['La constante d’équilibre K', 'Le quotient de réaction à l’état final', 'Le taux d’avancement final'] },
        manque: null, solution: { txt: 'Qr = frac([CH₃COO⁻] × [HCOOH]|[CH₃COOH] × [HCOO⁻]), concentrations initiales', val: (c0 * d0) / (a0 * b0), u: '' } };
    },
  },
  // ───────────────────────────── Acide faible (TSTL, PCM) : coefficient de dissociation, conservation de la matière, Ka, pKa
  {
    id: 'dissoc-sapp-alpha', domaine: 'Acide faible, coefficient de dissociation et Ka', titre: 'Coefficient de dissociation d’un acide faible', noms: ['Coefficient de dissociation', 'Concentration en acide restant'],
    gen: () => { const c = tire(ACF.CANDIDATS.filter(x => ACF.mesure(x.id, x.C).alpha >= 0.08)); return { C: c.C, pH: ACF.mesure(c.id, c.C).pH, V: tire([100, 200, 250]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration en soluté apporté de l’acide', p.C, 'mol/L'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        V: tok(`${p.V} mL`, 'Volume de la solution préparée', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['On prépare ', T('V'), ' d’une solution d’un acide faible AH, de concentration en soluté apporté ', T('C'), ', à ', T('T'), '. Le pH-mètre indique ', T('pH'), '. '];
      const h = 10 ** -p.pH;
      if (q === 0) return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH)'], texte: [...debut, 'Quel est le coefficient de dissociation α de cet acide ?'],
        utiles: ['C', 'pH'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas dans le calcul de α.', T: 'La température est constante : elle n’intervient pas dans le calcul de α.' },
        cherche: { bonne: 'Le coefficient de dissociation α de l’acide (sans unité)', faux: ['La constante d’acidité Ka de l’acide (sans unité)', 'Le pKa de l’acide (sans unité)', 'La concentration en ions oxonium [H₃O⁺] (en mol/L)'] },
        manque: null, solution: { txt: 'α = [A⁻] divisé par C₀, avec [A⁻] = [H₃O⁺] = 10^(−pH)', val: h / p.C, u: '' } };
      return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH)'], texte: [...debut, 'Quelle est la concentration en acide AH restant dans la solution ?'],
        utiles: ['C', 'pH'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas.', T: 'La température est constante : elle n’intervient pas dans la conservation de la matière.' },
        cherche: { bonne: 'La concentration en acide restant [AH] (en mol/L)', faux: ['La concentration en base conjuguée [A⁻] (en mol/L)', 'La concentration en soluté apporté C₀ (en mol/L)', 'Le coefficient de dissociation α (sans unité)'] },
        manque: null, solution: { txt: '[AH] = C₀ − [A⁻] (conservation de la matière)', val: p.C - h, u: 'mol/L' } };
    },
  },
  {
    id: 'dissoc-sapp-ka', domaine: 'Acide faible, coefficient de dissociation et Ka', titre: 'Constante d’acidité et pKa d’un couple acide-base', noms: ['Constante d’acidité', 'pKa'],
    gen: () => { const c = tire(ACF.CANDIDATS), m = ACF.mesure(c.id, c.C); return { C: c.C, pH: m.pH, M: tire([46, 60, 74, 122]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration en soluté apporté de l’acide', p.C, 'mol/L'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        M: tok(`${p.M} g/mol`, 'Masse molaire de l’acide', p.M, 'g/mol'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un acide faible AH, de masse molaire ', T('M'), ', est dissous dans l’eau à ', T('T'), ' avec une concentration en soluté apporté de ', T('C'), '. Le pH-mètre indique ', T('pH'), '. '];
      const h = 10 ** -p.pH, Ka = h * h / (p.C - h);
      const raisons = { M: 'La masse molaire sert à convertir une masse en quantité de matière : ici la concentration est déjà donnée.', T: 'La température est constante : elle n’intervient pas dans le calcul, elle indique seulement que Ka garde sa valeur.' };
      if (q === 0) return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH) ; [AH] = C₀ − [H₃O⁺]'], texte: [...debut, 'Quelle est la constante d’acidité Ka du couple AH / A⁻ ?'],
        utiles: ['C', 'pH'], raisons,
        cherche: { bonne: 'La constante d’acidité Ka (sans unité)', faux: ['Le coefficient de dissociation α (sans unité)', 'Le pKa du couple (sans unité)', 'La concentration en acide restant [AH] (en mol/L)'] },
        manque: null, solution: { txt: 'Ka = [H₃O⁺]² divisé par (C₀ − [H₃O⁺]), avec [H₃O⁺] = 10^(−pH)', val: Ka, u: '' } };
      return { tokens, derivees: ['[A⁻] = [H₃O⁺] = 10^(−pH) ; [AH] = C₀ − [H₃O⁺] ; Ka'], texte: [...debut, 'Quel est le pKa du couple AH / A⁻ ?'],
        utiles: ['C', 'pH'], raisons,
        cherche: { bonne: 'Le pKa du couple, pKa = −log Ka (sans unité)', faux: ['La constante d’acidité Ka du couple (sans unité)', 'Le pH de la solution (sans unité)', 'Le coefficient de dissociation α (sans unité)'] },
        manque: null, solution: { txt: 'pKa = −log Ka, après calcul de Ka = [H₃O⁺]² divisé par (C₀ − [H₃O⁺])', val: -Math.log10(Ka), u: '' } };
    },
  },
  // ───────────────────────────── pH, pKa et prédominance (TSTL, PCM) : rapport des concentrations, indicateur coloré, Beer-Lambert
  {
    id: 'predo-sapp-rapport', domaine: 'pH, pKa et diagramme de prédominance', titre: 'Rapport des concentrations d’un couple acide-base', noms: ['Rapport des concentrations', 'Concentration de la base'],
    gen: () => { const c = tire(PRE.CANDIDATS_RATIO); return { id: c.id, C: c.C, pH: c.pH, V: tire([50, 100, 250]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const cp = PRE.COUPLES[p.id];
      const tokens = {
        pKa: tok(`${nb(cp.pKa, 1)}`, 'pKa du couple AH / A⁻', cp.pKa, ''),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution (imposé par un tampon)', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale du couple [AH] + [A⁻]', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Une solution de volume ', T('V'), ', à ', T('T'), ', contient un couple acide/base AH / A⁻ de pKa ', T('pKa'), ', avec une concentration totale ', T('C'), '. Son pH est imposé à ', T('pH'), '. '];
      const r = 10 ** (p.pH - cp.pKa), A = p.C * r / (1 + r);
      const raisons = { V: 'Le volume ne change pas les concentrations : il n’intervient pas dans le calcul.', T: 'La température est constante : elle indique seulement que le pKa garde sa valeur.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le rapport [A⁻] sur [AH] des concentrations des deux formes ?'],
        utiles: ['pKa', 'pH'], raisons: { ...raisons, C: 'La concentration totale ne change pas le rapport des deux formes : seuls le pH et le pKa le fixent.' },
        cherche: { bonne: 'Le rapport [A⁻] sur [AH] (sans unité)', faux: ['Le pKa du couple (sans unité)', 'La concentration totale C du couple (en mol/L)', 'Le pH de la solution (sans unité)'] },
        manque: null, solution: { txt: '[A⁻] sur [AH] = 10^(pH − pKa)', val: r, u: '' } };
      return { tokens, derivees: ['rapport [A⁻] sur [AH] = 10^(pH − pKa)'], texte: [...debut, 'Quelle est la concentration de la forme basique A⁻ ?'],
        utiles: ['pKa', 'pH', 'C'], raisons,
        cherche: { bonne: 'La concentration de la base [A⁻] (en mol/L)', faux: ['La concentration de l’acide [AH] (en mol/L)', 'La concentration totale C du couple (en mol/L)', 'Le rapport [A⁻] sur [AH] (sans unité)'] },
        manque: null, solution: { txt: '[A⁻] = C × r divisée par (1 + r), avec r = 10^(pH − pKa)', val: A, u: 'mol/L' } };
    },
  },
  {
    id: 'predo-sapp-beer', schema: () => ({ type: 'spectrophotometre' }), domaine: 'pH, pKa et diagramme de prédominance', titre: 'Spectrophotométrie d’un indicateur coloré', noms: ['Concentration de la forme basique', 'pKa de l’indicateur'],
    gen: () => { const u = PRE.tirageIndicateur(); return { ...u, lam: tire([520, 560, 590, 620]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C)} mol/L`, 'Concentration totale de l’indicateur HInd + Ind⁻', p.C, 'mol/L'),
        eps: tok(`${nb(p.eps)} L·mol⁻¹·cm⁻¹`, 'Coefficient d’absorption molaire ε de Ind⁻', p.eps, 'L/(mol·cm)'),
        l: tok(`${nb(p.l, 2)} cm`, 'Longueur de la cuve ℓ', p.l, 'cm'),
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de mesure (seule Ind⁻ absorbe)', p.lam, 'nm'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        A: tok(`${nb(p.abs, 3)}`, 'Absorbance A mesurée', p.abs, ''),
      };
      const debut = ['Une solution d’indicateur coloré HInd / Ind⁻ de concentration totale ', T('C'), ' est étudiée à la longueur d’onde ', T('lam'), ', où seule la forme basique Ind⁻ absorbe, dans une cuve de longueur ', T('l'), ' ; ε vaut ', T('eps'), '. Le pH-mètre indique ', T('pH'), ' et l’absorbance mesurée est ', T('A'), '. '];
      const Ind = p.abs / (p.eps * p.l), r = Ind / (p.C - Ind);
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration de la forme basique [Ind⁻] ?'],
        utiles: ['A', 'eps', 'l'], raisons: { C: 'La concentration totale n’est pas nécessaire pour appliquer la loi de Beer-Lambert à Ind⁻ seule.', lam: 'La longueur d’onde est déjà choisie : elle ne se calcule pas, elle sert seulement à savoir que Ind⁻ est seule à absorber.', pH: 'Le pH ne sert pas à convertir une absorbance en concentration.' },
        cherche: { bonne: 'La concentration de la forme basique [Ind⁻] (en mol/L)', faux: ['La concentration totale C de l’indicateur (en mol/L)', 'Le coefficient d’absorption molaire ε (en L/(mol·cm))', 'Le pKa de l’indicateur (sans unité)'] },
        manque: null, solution: { txt: '[Ind⁻] = A divisée par (ε × ℓ)', val: Ind, u: 'mol/L' } };
      return { tokens, derivees: ['[Ind⁻] = A divisée par (ε × ℓ) ; [HInd] = C − [Ind⁻]'], texte: [...debut, 'Quel est le pKa de l’indicateur ?'],
        utiles: ['C', 'eps', 'l', 'pH', 'A'], raisons: { lam: 'La longueur d’onde sert seulement à savoir que Ind⁻ absorbe seule : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le pKa du couple HInd / Ind⁻, pKa = pH − log(r), avec r = [Ind⁻] sur [HInd] (sans unité)', faux: ['La concentration de la forme basique [Ind⁻] (en mol/L)', 'Le pH de la solution (sans unité)', 'Le rapport [Ind⁻] sur [HInd] (sans unité)'] },
        manque: null, solution: { txt: 'pKa = pH − log(r) où r = [Ind⁻] sur [HInd], avec [Ind⁻] = A divisée par (ε × ℓ) et [HInd] = C − [Ind⁻]', val: p.pH - Math.log10(r), u: '' } };
    },
  },
  // ───────────────────────────── Solution tampon (TSTL, PCM) : choix du couple, préparation, ajout d'acide ou de base
  {
    id: 'tampstl-sapp-prepa', domaine: 'Solution tampon : choix du couple et préparation', titre: 'Préparer une solution tampon de pH donné', noms: ['Rapport des quantités base sur acide', 'Volume de solution de base conjuguée'],
    gen: () => { const t = TMP.tiragePrep(); return { id: t.coupleId, pH: t.pH, V: t.V, C: t.C, T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const cp = TMP.COUPLES[p.id], r = 10 ** (p.pH - cp.pKa);
      const tokens = {
        pKa: tok(`${nb(cp.pKa, 1)}`, 'pKa du couple AH / A⁻', cp.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH visé pour le tampon', p.pH, ''),
        V: tok(`${p.V} mL`, 'Volume de tampon à préparer', p.V, 'mL'),
        C: tok(`${nb(p.C, 2)} mol/L`, 'Concentration commune des deux solutions de départ', p.C, 'mol/L'),
        T: tok(`${p.T} °C`, 'Température de travail', p.T, '°C'),
      };
      const debut = ['On veut préparer un volume ', T('V'), ' de solution tampon de pH ', T('pH'), ', à ', T('T'), ', avec le couple acide/base AH / A⁻ de pKa ', T('pKa'), ', en mélangeant une solution de AH et une solution de A⁻ (sel de sodium), toutes deux de même concentration ', T('C'), '. '];
      const raisons = { T: 'La température est constante : elle indique seulement que le pKa garde sa valeur.', C: 'Les deux solutions ont la même concentration : le rapport des quantités est le rapport des volumes, la valeur de la concentration ne sert pas.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel doit être le rapport n(A⁻) sur n(AH) des quantités de matière à mélanger ?'],
        utiles: ['pKa', 'pH'], raisons: { ...raisons, V: 'Le volume ne change pas le rapport des quantités : il intervient seulement pour répartir les volumes.' },
        cherche: { bonne: 'Le rapport n(A⁻) sur n(AH) (sans unité)', faux: ['Le volume de solution de A⁻ à prélever (en mL)', 'Le pKa du couple (sans unité)', 'La concentration commune des solutions (en mol/L)'] },
        manque: null, solution: { txt: 'n(A⁻) sur n(AH) = 10^(pH − pKa)', val: r, u: '' } };
      return { tokens, derivees: ['rapport n(A⁻) sur n(AH) = 10^(pH − pKa) = rapport des volumes'], texte: [...debut, 'Quel volume de la solution de A⁻ faut-il prélever ?'],
        utiles: ['pKa', 'pH', 'V'], raisons,
        cherche: { bonne: 'Le volume de la solution de A⁻ à prélever (en mL)', faux: ['Le volume de la solution de AH à prélever (en mL)', 'Le rapport n(A⁻) sur n(AH) (sans unité)', 'La quantité de matière de A⁻ (en mmol)'] },
        manque: null, solution: { txt: 'V(A⁻) = frac(V × r|1 + r), avec r = 10^(pH − pKa)', val: p.V * r / (1 + r), u: 'mL' } };
    },
  },
  {
    id: 'ab-acf-sapp-ph', domaine: 'Acides et bases', titre: 'pH et coefficient de dissociation d’un acide faible', noms: ['pH de la solution', 'Coefficient de dissociation dans l’eau'],
    gen: () => { for (;;) { const pKa = tire([3.8, 4.2, 4.7, 4.9]), C = tire([0.01, 0.02, 0.05, 0.1]); if (Math.abs(AB.pHAcideFaibleApprox(C, pKa) - AB.pH({ C, pKas: [pKa] })) < 0.02) return { pKa, C, V: tire([50, 100, 250]) }; } },
    build: (p, q) => {
      const pH = AB.pHAcideFaibleApprox(p.C, p.pKa);
      const tokens = {
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKa du couple AH / A⁻', p.pKa, ''),
        C: tok(`${nb(p.C, 2)} mol/L`, 'Concentration de la solution', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution préparé', p.V, 'mL'),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
      };
      const debut = ['On prépare ', T('V'), ' de solution d’un acide faible AH de concentration ', T('C'), ' à ', T('T'), '. Le pKa du couple AH / A⁻ vaut ', T('pKa'), '. '];
      const raisons = { V: 'Le volume ne change ni le pH ni le coefficient de dissociation : seule la concentration compte.', T: 'La température est constante : elle indique seulement que le pKa garde sa valeur.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le pH de la solution ?'], utiles: ['pKa', 'C'], raisons,
        cherche: { bonne: 'Le pH de la solution (sans unité)', faux: ['La concentration en ions H₃O⁺ (en mol/L)', 'Le coefficient de dissociation α (sans unité)', 'Le pH d’un acide fort de même concentration (sans unité)'] },
        manque: null, solution: { txt: 'pH = ½ × (pKa − log C)', val: pH, u: '' } };
      return { tokens, derivees: ['pH = ½ × (pKa − log C)', '[H₃O⁺] = 10^(−pH)'], texte: [...debut, 'Quel est le coefficient de dissociation α de l’acide ?'], utiles: ['pKa', 'C'], raisons,
        cherche: { bonne: 'Le coefficient de dissociation α (sans unité)', faux: ['Le pH de la solution (sans unité)', 'La concentration en ions H₃O⁺ (en mol/L)', 'La concentration en ions A⁻ (en mol/L)'] },
        manque: null, solution: { txt: 'α = [H₃O⁺] divisé par C', val: 10 ** -pH / p.C, u: '' } };
    },
  },
  {
    id: 'ab-acf-sapp-dilution', schema: () => ({ type: 'dilution', mere: 'acide fort', eau: 'eau distillée' }), domaine: 'Acides et bases', titre: 'Diluer une solution d’acide fort', noms: ['Concentration après dilution', 'pH après dilution'],
    gen: () => { for (;;) { const f = tire([10, 20, 50, 100]), Vp = tire([5, 10, 20]); if (f * Vp <= 1000) return { C: tire([0.05, 0.1, 0.2]), Vp, Vf: f * Vp }; } },
    build: (p, q) => {
      const C1 = p.C * p.Vp / p.Vf, pH = -Math.log10(C1);
      const tokens = {
        C: tok(`${nb(p.C, 2)} mol/L`, 'Concentration de la solution mère d’acide fort', p.C, 'mol/L'),
        Vp: tok(`${p.Vp} mL`, 'Volume de solution mère prélevé', p.Vp, 'mL'),
        Vf: tok(`${p.Vf} mL`, 'Volume de la fiole jaugée', p.Vf, 'mL'),
        T: tok('25 °C', 'Température de travail', 25, '°C'),
      };
      const debut = ['On prélève ', T('Vp'), ' d’une solution d’acide fort de concentration ', T('C'), ', puis on complète avec de l’eau distillée dans une fiole jaugée de ', T('Vf'), ', à ', T('T'), '. '];
      const raisons = { T: 'La température est constante : elle ne change pas le calcul.' };
      if (q === 0) return { tokens, derivees: ['facteur de dilution = frac(Vf|Vp)'], texte: [...debut, 'Quelle est la concentration de la solution diluée ?'], utiles: ['C', 'Vp', 'Vf'], raisons,
        cherche: { bonne: 'La concentration après dilution (en mol/L)', faux: ['Le facteur de dilution (sans unité)', 'Le pH de la solution diluée (sans unité)', 'La quantité d’acide prélevée (en mmol)'] },
        manque: null, solution: { txt: 'C′ = frac(C × Vp|Vf)', val: C1, u: 'mol/L' } };
      return { tokens, derivees: ['concentration après dilution C′ = frac(C × Vp|Vf)'], texte: [...debut, 'Quel est le pH de la solution diluée ?'], utiles: ['C', 'Vp', 'Vf'], raisons,
        cherche: { bonne: 'Le pH de la solution diluée (sans unité)', faux: ['La concentration après dilution (en mol/L)', 'Le pH de la solution mère (sans unité)', 'Le facteur de dilution (sans unité)'] },
        manque: null, solution: { txt: 'pH = −log C′ (acide fort, réaction totale)', val: pH, u: '' } };
    },
  },
  {
    id: 'ab-pred-sapp-rapport', domaine: 'Acides et bases', titre: 'Rapport des formes d’un couple selon le pH', noms: ['Rapport [A⁻] sur [AH]', 'Pourcentage de forme basique'],
    gen: () => { const pKa = tire([3.8, 4.2, 4.9, 7.5]); return { pKa, pH: Math.round((pKa + tire([-1.4, -1, -0.6, 0.6, 1, 1.4])) * 10) / 10, C: tire([0.01, 0.05, 0.1]) }; },
    build: (p, q) => {
      const r = 10 ** (p.pH - p.pKa);
      const tokens = {
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKa du couple AH / A⁻', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la solution', p.pH, ''),
        C: tok(`${nb(p.C, 2)} mol/L`, 'Concentration totale en AH et A⁻', p.C, 'mol/L'),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
      };
      const debut = ['Dans une solution de pH ', T('pH'), ', le couple AH / A⁻ de pKa ', T('pKa'), ' est présent à la concentration totale ', T('C'), ' (à ', T('T'), '). '];
      const raisons = { T: 'La température est constante : elle indique seulement que le pKa garde sa valeur.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le rapport [A⁻] sur [AH] ?'], utiles: ['pKa', 'pH'], raisons: { ...raisons, C: 'Un rapport de concentrations ne dépend pas de la concentration totale.' },
        cherche: { bonne: 'Le rapport [A⁻] sur [AH] (sans unité)', faux: ['La concentration en A⁻ (en mol/L)', 'Le pourcentage de forme basique (en %)', 'La différence pH − pKa (sans unité)'] },
        manque: null, solution: { txt: '[A⁻] sur [AH] = 10^(pH − pKa)', val: r, u: '' } };
      return { tokens, derivees: ['rapport [A⁻] sur [AH] = 10^(pH − pKa)'], texte: [...debut, 'Quel pourcentage du couple est sous la forme basique A⁻ ?'], utiles: ['pKa', 'pH'], raisons: { ...raisons, C: 'Un pourcentage ne dépend pas de la concentration totale.' },
        cherche: { bonne: 'Le pourcentage de forme basique A⁻ (en %)', faux: ['Le rapport [A⁻] sur [AH] (sans unité)', 'La concentration en A⁻ (en mol/L)', 'Le pourcentage de forme acide AH (en %)'] },
        manque: null, solution: { txt: 'pourcentage de A⁻ = frac(100 × r|1 + r), avec r = 10^(pH − pKa)', val: 100 * r / (1 + r), u: '%' } };
    },
  },
  {
    id: 'ab-pred-sapp-conc', domaine: 'Acides et bases', titre: 'Concentrations des deux formes d’un couple', noms: ['Concentration en A⁻', 'Concentration en AH'],
    gen: () => { const pKa = tire([3.8, 4.2, 4.9, 7.5]); return { pKa, pH: Math.round((pKa + tire([-1.4, -1, -0.6, 0.6, 1, 1.4])) * 10) / 10, C: tire([0.01, 0.02, 0.05, 0.1]), V: tire([100, 250, 500]) }; },
    build: (p, q) => {
      const r = 10 ** (p.pH - p.pKa), cA = p.C * r / (1 + r), cAH = p.C / (1 + r);
      const tokens = {
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKa du couple AH / A⁻', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la solution', p.pH, ''),
        C: tok(`${nb(p.C, 2)} mol/L`, 'Concentration totale en AH et A⁻', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
      };
      const debut = ['Une solution de ', T('V'), ' a un pH de ', T('pH'), '. Elle contient le couple AH / A⁻ de pKa ', T('pKa'), ', avec une concentration totale [AH] + [A⁻] = ', T('C'), '. '];
      const raisons = { V: 'Le volume ne change pas les concentrations, qui sont déjà données.' };
      if (q === 0) return { tokens, derivees: ['rapport r = [A⁻] sur [AH] = 10^(pH − pKa)'], texte: [...debut, 'Quelle est la concentration de la forme basique A⁻ ?'], utiles: ['pKa', 'pH', 'C'], raisons,
        cherche: { bonne: 'La concentration en A⁻ (en mol/L)', faux: ['La concentration en AH (en mol/L)', 'Le rapport [A⁻] sur [AH] (sans unité)', 'La concentration en ions H₃O⁺ (en mol/L)'] },
        manque: null, solution: { txt: '[A⁻] = frac(C × r|1 + r)', val: cA, u: 'mol/L' } };
      return { tokens, derivees: ['rapport r = [A⁻] sur [AH] = 10^(pH − pKa)'], texte: [...debut, 'Quelle est la concentration de la forme acide AH ?'], utiles: ['pKa', 'pH', 'C'], raisons,
        cherche: { bonne: 'La concentration en AH (en mol/L)', faux: ['La concentration en A⁻ (en mol/L)', 'Le rapport [A⁻] sur [AH] (sans unité)', 'La concentration en ions H₃O⁺ (en mol/L)'] },
        manque: null, solution: { txt: '[AH] = frac(C|1 + r)', val: cAH, u: 'mol/L' } };
    },
  },
  {
    id: 'ab-tamp-sapp-melange', domaine: 'Acides et bases', titre: 'pH d’une solution tampon obtenue par mélange', noms: ['Rapport des quantités de matière', 'pH du mélange'],
    gen: () => { for (;;) { const C1 = tire([0.1, 0.2]), V1 = tire([20, 40, 50]), C2 = tire([0.1, 0.2]), V2 = tire([20, 30, 60]), r = C2 * V2 / (C1 * V1); if (r > 0.2 && r < 5 && Math.abs(r - 1) > 0.1) return { pKa: tire([4.2, 4.9, 7.5]), C1, V1, C2, V2 }; } },
    build: (p, q) => {
      const r = (p.C2 * p.V2) / (p.C1 * p.V1);
      const tokens = {
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKa du couple AH / A⁻', p.pKa, ''),
        C1: tok(`${nb(p.C1, 2)} mol/L`, 'Concentration de la solution d’acide AH', p.C1, 'mol/L'),
        V1: tok(`${p.V1} mL`, 'Volume de solution d’acide AH', p.V1, 'mL'),
        C2: tok(`${nb(p.C2, 2)} mol/L`, 'Concentration de la solution de base A⁻', p.C2, 'mol/L'),
        V2: tok(`${p.V2} mL`, 'Volume de solution de base A⁻', p.V2, 'mL'),
        T: tok('25 °C', 'Température du mélange', 25, '°C'),
      };
      const debut = ['On mélange ', T('V1'), ' d’une solution de AH à ', T('C1'), ' et ', T('V2'), ' d’une solution de A⁻ (sel de sodium) à ', T('C2'), '. Le pKa du couple AH / A⁻ vaut ', T('pKa'), ' (mélange à ', T('T'), '). '];
      const raisons = { T: 'La température est constante : elle indique seulement que le pKa garde sa valeur.' };
      if (q === 0) return { tokens, derivees: ['n(AH) = C₁ × V₁', 'n(A⁻) = C₂ × V₂'], texte: [...debut, 'Quel est le rapport n(A⁻) sur n(AH) dans le mélange ?'], utiles: ['C1', 'V1', 'C2', 'V2'], raisons: { ...raisons, pKa: 'Le pKa ne sert pas pour un rapport de quantités de matière.' },
        cherche: { bonne: 'Le rapport n(A⁻) sur n(AH) (sans unité)', faux: ['Le pH du mélange (sans unité)', 'La quantité de matière de AH (en mmol)', 'Le volume total du mélange (en mL)'] },
        manque: null, solution: { txt: 'rapport = frac(C₂ × V₂|C₁ × V₁)', val: r, u: '' } };
      return { tokens, derivees: ['n(AH) = C₁ × V₁', 'n(A⁻) = C₂ × V₂', 'rapport n(A⁻) sur n(AH)'], texte: [...debut, 'Quel est le pH du mélange ?'], utiles: ['pKa', 'C1', 'V1', 'C2', 'V2'], raisons,
        cherche: { bonne: 'Le pH du mélange (sans unité)', faux: ['Le rapport n(A⁻) sur n(AH) (sans unité)', 'Le pKa du couple (sans unité)', 'La concentration en ions H₃O⁺ (en mol/L)'] },
        manque: null, solution: { txt: 'pH = pKa + log(frac(n(A⁻)|n(AH)))', val: p.pKa + Math.log10(r), u: '' } };
    },
  },
  {
    id: 'tampstl-sapp-ajout', domaine: 'Solution tampon : choix du couple et préparation', titre: 'pH d’un tampon après l’ajout d’un acide ou d’une base fort', noms: ['Quantité de base après réaction', 'pH du tampon après l’ajout'],
    gen: () => { const a = TMP.tirageAjout(); return { id: a.coupleId, nA: a.nA, nAH: a.nAH, x: a.x, sens: a.sens, V: tire([50, 100, 200]) }; },
    build: (p, q) => {
      const cp = TMP.COUPLES[p.id], b = TMP.bilan({ nA: p.nA, nAH: p.nAH, nAcide: p.sens === 'acide' ? p.x : 0, nBase: p.sens === 'base' ? p.x : 0 });
      const tokens = {
        pKa: tok(`${nb(cp.pKa, 1)}`, 'pKa du couple AH / A⁻', cp.pKa, ''),
        nA: tok(`${nb(p.nA, 1)} mmol`, 'Quantité de base A⁻ dans le tampon', p.nA, 'mmol'),
        nAH: tok(`${nb(p.nAH, 1)} mmol`, 'Quantité d’acide AH dans le tampon', p.nAH, 'mmol'),
        x: tok(`${nb(p.x, 1)} mmol`, p.sens === 'acide' ? 'Quantité d’ions H₃O⁺ ajoutée (acide fort)' : 'Quantité d’ions HO⁻ ajoutée (base forte)', p.x, 'mmol'),
        V: tok(`${p.V} mL`, 'Volume du tampon', p.V, 'mL'),
      };
      const debut = ['Un tampon de volume ', T('V'), ' contient ', T('nA'), ' de base A⁻ et ', T('nAH'), ' d’acide AH, avec un pKa de ', T('pKa'), '. On y ajoute ', T('x'), p.sens === 'acide' ? ' d’ions H₃O⁺, qui réagissent totalement sur A⁻. ' : ' d’ions HO⁻, qui réagissent totalement sur AH. '];
      const raisons = { V: 'Le volume se simplifie dans le rapport des quantités de matière : il ne sert pas ici.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de base A⁻ reste-t-il après la réaction ?'],
        utiles: ['nA', 'x'], raisons: { ...raisons, pKa: 'Le pKa ne sert pas pour un bilan de matière.', nAH: p.sens === 'acide' ? 'L’acide AH n’est pas consommé par un acide fort : il en est formé.' : 'L’acide AH est consommé, mais la quantité de A⁻ ne dépend que de ce qui est formé.' },
        cherche: { bonne: 'La quantité de A⁻ après la réaction (en mmol)', faux: ['La quantité d’acide AH après la réaction (en mmol)', 'Le pH du tampon après la réaction (sans unité)', 'Le rapport n(A⁻) sur n(AH) (sans unité)'] },
        manque: null, solution: { txt: p.sens === 'acide' ? 'n(A⁻) final = n(A⁻) − quantité d’ions H₃O⁺ ajoutée' : 'n(A⁻) final = n(A⁻) + quantité d’ions HO⁻ ajoutée', val: b.nA, u: 'mmol' } };
      return { tokens, derivees: ['bilan de matière : n(A⁻) et n(AH) après la réaction'], texte: [...debut, 'Quel est le pH du tampon après l’ajout ?'],
        utiles: ['pKa', 'nA', 'nAH', 'x'], raisons,
        cherche: { bonne: 'Le pH du tampon après l’ajout (sans unité)', faux: ['La quantité de A⁻ après la réaction (en mmol)', 'Le rapport n(A⁻) sur n(AH) après la réaction (sans unité)', 'Le pH initial du tampon (sans unité)'] },
        manque: null, solution: { txt: 'pH = pKa + log(n(A⁻) sur n(AH)), avec les quantités après la réaction', val: cp.pKa + Math.log10(b.nA / b.nAH), u: '' } };
    },
  },
  // ───────────────────────────── CO₂ dissous (TSTL, PCM) : loi de Henry, pH de l'eau, milieu de pH imposé
  {
    id: 'co2dis-sapp-eau', domaine: 'CO₂ dissous : couples et solubilité', titre: 'Eau en équilibre avec un gaz contenant du CO₂', noms: ['Concentration en CO₂ dissous', 'pH de l’eau'],
    gen: () => { const t = CO2.tirageEau(); return { P: t.P, T: t.T, V: tire([50, 100, 250]) }; },
    build: (p, q) => {
      const a = CO2.A_T[p.T], c = a * p.P, fP = p.P < 1 ? nb(p.P, 1) : nb(p.P, 0);
      const tokens = {
        P: tok(`${fP} kPa`, 'Pression partielle du CO₂ dans le gaz', p.P, 'kPa'),
        a: tok(`${nb(a, 2)} mmol·L⁻¹·kPa⁻¹`, 'Coefficient de solubilité du CO₂ à cette température', a, 'mmol/L/kPa'),
        pKa: tok('6,35', 'pKa du couple CO₂,H₂O / HCO₃⁻', CO2.PKA1, ''),
        T: tok(`${p.T} °C`, 'Température de l’eau', p.T, '°C'),
        V: tok(`${p.V} mL`, 'Volume d’eau dans le flacon', p.V, 'mL'),
      };
      const debut = ['Un flacon de volume d’eau ', T('V'), ', à ', T('T'), ', est en équilibre avec un gaz dont la pression partielle en CO₂ vaut ', T('P'), '. Le coefficient de solubilité du CO₂ vaut ', T('a'), ' et le pKa du couple CO₂,H₂O / HCO₃⁻ vaut ', T('pKa'), '. '];
      const raisons = { V: 'Le volume d’eau ne change pas la concentration à l’équilibre : elle ne dépend que de a et de la pression partielle.', T: 'La température a servi à fixer la valeur de a, déjà donnée : elle n’intervient plus dans le calcul.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en CO₂ dissous ?'],
        utiles: ['a', 'P'], raisons: { ...raisons, pKa: 'Le pKa sert à calculer le pH, pas la concentration en CO₂ dissous.' },
        cherche: { bonne: 'La concentration en CO₂ dissous [CO₂] (en mmol/L)', faux: ['Le pH de l’eau à l’équilibre (sans unité)', 'La quantité de CO₂ dissous dans le flacon (en mmol)', 'La concentration en ions HCO₃⁻ (en mmol/L)'] },
        manque: null, solution: { txt: '[CO₂] = a × P(CO₂) (loi de Henry)', val: c, u: 'mmol/L' } };
      return { tokens, derivees: ['[CO₂] = a × P(CO₂), à convertir en mol/L (1 mmol/L = 10⁻³ mol/L)'], texte: [...debut, 'Quel est le pH de l’eau ?'],
        utiles: ['a', 'P', 'pKa'], raisons,
        cherche: { bonne: 'Le pH de l’eau à l’équilibre (sans unité)', faux: ['La concentration en CO₂ dissous (en mmol/L)', 'La concentration en ions H₃O⁺ (en mol/L)', 'Le pKa du couple (sans unité)'] },
        manque: null, solution: { txt: 'pH = ½ (pKa − log [CO₂]), avec [CO₂] en mol/L', val: CO2.pHFormule(c), u: '' } };
    },
  },
  {
    id: 'co2dis-sapp-milieu', domaine: 'CO₂ dissous : couples et solubilité', titre: 'CO₂ dans un milieu de pH imposé', noms: ['Concentration en HCO₃⁻', 'Rapport du carbone dissous total à [CO₂]'],
    gen: () => { const t = CO2.tirageMilieu(); return { P: t.P, T: t.T, pH: t.pH, V: tire([100, 250, 500]) }; },
    build: (p, q) => {
      const a = CO2.A_T[p.T], m = CO2.milieu(p.P, p.T, p.pH), fP = p.P < 1 ? nb(p.P, 2) : nb(p.P, 0);
      const tokens = {
        P: tok(`${fP} kPa`, 'Pression partielle du CO₂ dans le gaz', p.P, 'kPa'),
        a: tok(`${nb(a, 2)} mmol·L⁻¹·kPa⁻¹`, 'Coefficient de solubilité du CO₂', a, 'mmol/L/kPa'),
        pH: tok(`${nb(p.pH, 1)}`, 'pH imposé au milieu', p.pH, ''),
        pKa1: tok('6,35', 'pKa1 du couple CO₂,H₂O / HCO₃⁻', CO2.PKA1, ''),
        pKa2: tok('10,3', 'pKa2 du couple HCO₃⁻ / CO₃²⁻', CO2.PKA2, ''),
        T: tok(`${p.T} °C`, 'Température du milieu', p.T, '°C'),
        V: tok(`${p.V} mL`, 'Volume du milieu', p.V, 'mL'),
      };
      const debut = ['Un milieu de volume ', T('V'), ' dont le pH est maintenu à ', T('pH'), ' est en équilibre, à ', T('T'), ', avec un gaz de pression partielle en CO₂ ', T('P'), '. On donne a = ', T('a'), ', pKa1 = ', T('pKa1'), ' et pKa2 = ', T('pKa2'), '. '];
      const raisons = { V: 'Le volume du milieu ne change pas les concentrations à l’équilibre : il n’intervient pas.', T: 'La température a servi à fixer la valeur de a, déjà donnée : elle n’intervient plus dans le calcul.' };
      if (q === 0) return { tokens, derivees: ['[CO₂] = a × P(CO₂)'], texte: [...debut, 'Quelle est la concentration en ions HCO₃⁻ ?'],
        utiles: ['a', 'P', 'pH', 'pKa1'], raisons: { ...raisons, pKa2: 'Le pKa2 concerne le couple HCO₃⁻ / CO₃²⁻ : il ne sert pas pour [HCO₃⁻].' },
        cherche: { bonne: 'La concentration en ions HCO₃⁻ (en mmol/L)', faux: ['La concentration en CO₂ dissous (en mmol/L)', 'La concentration en ions CO₃²⁻ (en mmol/L)', 'Le rapport [HCO₃⁻] sur [CO₂] (sans unité)'] },
        manque: null, solution: { txt: '[HCO₃⁻] = [CO₂] × 10^(pH − pKa1), avec [CO₂] = a × P(CO₂)', val: m.hco3, u: 'mmol/L' } };
      return { tokens, derivees: ['[HCO₃⁻] = [CO₂] × 10^(pH − pKa1) et [CO₃²⁻] = [HCO₃⁻] × 10^(pH − pKa2)'], texte: [...debut, 'Combien de fois le carbone inorganique dissous total C_T = [CO₂] + [HCO₃⁻] + [CO₃²⁻] dépasse-t-il [CO₂] ?'],
        utiles: ['pH', 'pKa1', 'pKa2'], raisons: { ...raisons, a: 'La valeur de a et la pression se simplifient dans le rapport C_T sur [CO₂] : elles ne servent pas.', P: 'La valeur de a et la pression se simplifient dans le rapport C_T sur [CO₂] : elles ne servent pas.' },
        cherche: { bonne: 'Le rapport C_T sur [CO₂] (sans unité)', faux: ['Le carbone dissous total C_T (en mmol/L)', 'Le rapport [HCO₃⁻] sur [CO₂] (sans unité)', 'La concentration en CO₂ dissous (en mmol/L)'] },
        manque: null, solution: { txt: 'C_T sur [CO₂] = 1 + 10^(pH − pKa1) + 10^(2 pH − pKa1 − pKa2)', val: m.solub, u: '' } };
    },
  },
  // ───────────────────────────── Extraction acide-base (TSTL, PCM) : forme neutre, rapport de distribution, part extraite
  {
    id: 'extrac-sapp-distrib', domaine: 'Extraction acide-base : choix du pH', titre: 'Part de forme neutre et rapport de distribution', noms: ['Fraction de forme neutre', 'Rapport de distribution'],
    gen: () => { const t = EXT.tirageExtraction(); return { e: t.e.id, pH: t.pH, r: t.r, Ve: tire([50, 100, 200]) }; },
    build: (p, q) => {
      const e = EXT.ESPECES[p.e], acide = e.type === 'acide', al = EXT.alpha(e, p.pH), D = e.K * al, Vo = p.r * p.Ve;
      const tokens = {
        K: tok(`${e.K}`, 'Coefficient de partage de la forme neutre', e.K, ''),
        pKa: tok(`${nb(e.pKa, 1)}`, acide ? 'pKa du couple HA / A⁻' : 'pKa du couple BH⁺ / B', e.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la phase aqueuse', p.pH, ''),
        Ve: tok(`${p.Ve} mL`, 'Volume de phase aqueuse', p.Ve, 'mL'),
        Vo: tok(`${Vo} mL`, 'Volume de solvant organique', Vo, 'mL'),
      };
      const debut = [SUJET_EXT[e.id], ' (', acide ? 'couple HA / A⁻' : 'couple BH⁺ / B', ', pKa = ', T('pKa'), ') est dans ', T('Ve'), ' d’eau dont le pH est maintenu à ', T('pH'), '. On l’extrait avec ', T('Vo'), ' d’un solvant organique non miscible. Le coefficient de partage de sa forme neutre est K = ', T('K'), '. '];
      const raisons = { Ve: 'Les volumes ne servent que pour la part extraite : ils n’interviennent pas dans α.', Vo: 'Les volumes ne servent que pour la part extraite : ils n’interviennent pas dans α.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle fraction du composé est sous forme neutre dans la phase aqueuse ?'],
        utiles: ['pKa', 'pH'], raisons: { ...raisons, K: 'Le coefficient de partage K intervient pour D, pas pour la fraction α.' },
        cherche: { bonne: 'La fraction α de forme neutre (sans unité)', faux: ['Le rapport de distribution D (sans unité)', 'La part extraite dans l’organique (en %)', 'Le volume de solvant à utiliser (en mL)'] },
        manque: null, solution: { txt: acide ? 'α = frac(1|1 + 10^(pH − pKa))' : 'α = frac(1|1 + 10^(pKa − pH))', val: al, u: '' } };
      return { tokens, derivees: [acide ? 'α = frac(1|1 + 10^(pH − pKa))' : 'α = frac(1|1 + 10^(pKa − pH))'], texte: [...debut, 'Quel est le rapport de distribution D du composé ?'],
        utiles: ['K', 'pKa', 'pH'], raisons,
        cherche: { bonne: 'Le rapport de distribution D (sans unité)', faux: ['La fraction α de forme neutre (sans unité)', 'La part extraite dans l’organique (en %)', 'Le coefficient de partage K (sans unité)'] },
        manque: null, solution: { txt: 'D = K × α', val: D, u: '' } };
    },
  },
  {
    id: 'extrac-sapp-passes', domaine: 'Extraction acide-base : choix du pH', titre: 'Part extraite et extractions successives', noms: ['Part extraite en un contact', 'Reste après deux extractions'],
    gen: () => { const t = EXT.tirageExtraction(); return { e: t.e.id, pH: t.pH, r: t.r, Ve: tire([50, 100, 200]) }; },
    build: (p, q) => {
      const e = EXT.ESPECES[p.e], acide = e.type === 'acide', D = e.K * EXT.alpha(e, p.pH), Vo = p.r * p.Ve;
      const tokens = {
        K: tok(`${e.K}`, 'Coefficient de partage de la forme neutre', e.K, ''),
        pKa: tok(`${nb(e.pKa, 1)}`, acide ? 'pKa du couple HA / A⁻' : 'pKa du couple BH⁺ / B', e.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la phase aqueuse', p.pH, ''),
        Ve: tok(`${p.Ve} mL`, 'Volume de phase aqueuse', p.Ve, 'mL'),
        Vo: tok(`${Vo} mL`, 'Volume de solvant organique à chaque contact', Vo, 'mL'),
      };
      const debut = [SUJET_EXT[e.id], ' (pKa = ', T('pKa'), ') est dans ', T('Ve'), ' d’eau dont le pH est maintenu à ', T('pH'), '. On l’extrait avec ', T('Vo'), ' de solvant organique ; le coefficient de partage de sa forme neutre est K = ', T('K'), '. '];
      if (q === 0) return { tokens, derivees: ['D = K × α, avec α la fraction de forme neutre', 'r = Vorg divisé par Veau'], texte: [...debut, 'Quelle part du composé est extraite en un seul contact ?'],
        utiles: ['K', 'pKa', 'pH', 'Ve', 'Vo'], raisons: {},
        cherche: { bonne: 'La part extraite en un contact (en %)', faux: ['Le rapport de distribution D (sans unité)', 'La part restant dans l’eau (en %)', 'La fraction α de forme neutre (sans unité)'] },
        manque: null, solution: { txt: 'extrait = frac(D × r|1 + D × r)', val: 100 * EXT.fractionExtraite(D, p.r), u: '%' } };
      return { tokens, derivees: ['D = K × α, avec α la fraction de forme neutre', 'r = Vorg divisé par Veau'], texte: [...debut, 'On recommence deux fois avec du solvant neuf. Quelle part reste dans l’eau ?'],
        utiles: ['K', 'pKa', 'pH', 'Ve', 'Vo'], raisons: {},
        cherche: { bonne: 'La part restant dans l’eau après deux extractions (en %)', faux: ['La part extraite au total (en %)', 'La part restant dans l’eau après une seule extraction (en %)', 'Le rapport de distribution D (sans unité)'] },
        manque: null, solution: { txt: 'reste = (frac(1|1 + D × r)) au carré', val: 100 * EXT.resteApres(D, p.r, 2), u: '%' } };
    },
  },
  {
    id: 'stereo-compter', domaine: 'Stéréoisomères : énantiomères, diastéréoisomères, Z et E', titre: 'Compter les stéréoisomères d’une molécule', noms: ['Nombre de stéréoisomères', 'Nombre de diastéréoisomères'],
    gen: () => ({ n: tire([2, 3, 4]), M: tire([105, 138, 152, 180, 210]) }),
    build: (p, q) => {
      const tokens = {
        n: tok(`n = ${p.n}`, 'Nombre de carbones asymétriques', p.n, ''),
        M: tok(`${p.M} g/mol`, 'Masse molaire de la molécule', p.M, 'g/mol'),
      };
      const debut = ['Une molécule possède ', T('n'), ' carbones asymétriques, tous de substituants différents : il n’y a pas de composé méso. Sa masse molaire est ', T('M'), '. '];
      const raisons = { M: 'La masse molaire ne sert pas à compter les stéréoisomères.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de stéréoisomères cette molécule possède-t-elle au maximum ?'], utiles: ['n'], raisons,
        cherche: { bonne: 'Le nombre de stéréoisomères de configuration (sans unité)', faux: ['Le nombre de carbones asymétriques de la molécule (sans unité)', 'La masse molaire d’un stéréoisomère (en g/mol)', 'Le nombre d’énantiomères d’un seul stéréoisomère (sans unité)'] },
        manque: null, solution: { txt: 'chaque carbone asymétrique a 2 configurations : 2 puissance n', val: 2 ** p.n, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de diastéréoisomères l’un de ces stéréoisomères possède-t-il ?'], utiles: ['n'], raisons,
        cherche: { bonne: 'Le nombre de diastéréoisomères d’un stéréoisomère donné (sans unité)', faux: ['Le nombre total de stéréoisomères de la molécule (sans unité)', 'La masse molaire d’un diastéréoisomère (en g/mol)', 'Le nombre de couples d’énantiomères de la molécule (sans unité)'] },
        manque: null, solution: { txt: '2ⁿ stéréoisomères, moins lui-même et moins son énantiomère : 2ⁿ − 2', val: 2 ** p.n - 2, u: '' } };
    },
  },
  {
    id: 'stereo-biologique', domaine: 'Stéréoisomères : énantiomères, diastéréoisomères, Z et E', titre: 'Mélange racémique et énantiomère actif', noms: ['Masse d’énantiomère actif du lot', 'Masse de mélange à prélever'],
    gen: () => ({ m: tire([120, 200, 250, 400]), d: tire([30, 50, 75, 100]), Tf: tire([88, 112, 134, 156]) }),
    build: (p, q) => {
      const tokens = {
        m: tok(`${p.m} mg`, 'Masse du lot de mélange racémique', p.m, 'mg'),
        d: tok(`${p.d} mg`, 'Masse d’énantiomère actif souhaitée', p.d, 'mg'),
        Tf: tok(`${p.Tf} °C`, 'Température de fusion de chaque énantiomère', p.Tf, '°C'),
      };
      const debut = ['Une molécule fictive Q existe sous deux énantiomères, (R)-Q et (S)-Q ; seul (R)-Q agit sur l’organisme. Un lot de mélange racémique de Q (à parts égales des deux énantiomères) a une masse de ', T('m'), '. Chaque énantiomère fond à ', T('Tf'), '. Pour une étude, on veut disposer de ', T('d'), ' de (R)-Q. '];
      const raisons = { Tf: 'La température de fusion ne sert pas à calculer des masses.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle masse de (R)-Q le lot contient-il ?'], utiles: ['m'], raisons: { ...raisons, d: 'Cette masse souhaitée sert à la question suivante, pas à connaître le contenu du lot.' },
        cherche: { bonne: 'La masse de (R)-Q contenue dans le lot (en mg)', faux: ['La masse de mélange racémique à prélever pour l’étude (en mg)', 'La masse de (S)-Q multipliée par 2 (en mg)', 'La température de fusion de (R)-Q (en °C)'] },
        manque: null, solution: { txt: 'racémique : 50 % de (R)-Q, soit la moitié de la masse du lot', val: p.m / 2, u: 'mg' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle masse de mélange racémique faut-il prélever pour obtenir cette masse de (R)-Q ?'], utiles: ['d'], raisons: { ...raisons, m: 'La masse du lot ne sert pas ici : on part de la masse de (R)-Q souhaitée.' },
        cherche: { bonne: 'La masse de mélange racémique à prélever (en mg)', faux: ['La masse de (R)-Q contenue dans le lot (en mg)', 'La moitié de la masse souhaitée de (R)-Q (en mg)', 'La température de fusion du mélange (en °C)'] },
        manque: null, solution: { txt: 'la moitié du mélange est (R)-Q : il en faut le double de la masse souhaitée', val: 2 * p.d, u: 'mg' } };
    },
  },
  {
    id: 'tens-libres', domaine: 'Tensioactifs : de la structure à la CMC', titre: 'Tensioactif au-dessus de la CMC : monomères libres et micelles', noms: ['Concentration en monomères libres', 'Concentration engagée dans les micelles'],
    gen: () => ({ cmc: tire([2, 4, 5, 8]), c: tire([20, 30, 40]), T: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        cmc: tok(`CMC = ${p.cmc} mmol/L`, 'Concentration micellaire critique du tensioactif', p.cmc, 'mmol/L'),
        c: tok(`${p.c} mmol/L`, 'Concentration totale de tensioactif dans la solution', p.c, 'mmol/L'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un tensioactif a une CMC de ', T('cmc'), ' à ', T('T'), '. On prépare dans l’eau une solution de concentration totale ', T('c'), ' en ce tensioactif. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en molécules isolées (monomères libres) ?'], utiles: ['cmc'], raisons: { c: 'La concentration totale ne donne pas les monomères libres : au-dessus de la CMC, ils restent à la valeur de la CMC.', T: 'La température ne sert pas au calcul.' },
        cherche: { bonne: 'La concentration en monomères libres (en mmol/L)', faux: ['La concentration de tensioactif engagé dans les micelles (en mmol/L)', 'La concentration totale de tensioactif (en mmol/L)', 'Le nombre de molécules par micelle (sans unité)'] },
        manque: null, solution: { txt: 'au-dessus de la CMC, les monomères libres restent à la concentration de la CMC', val: p.cmc, u: 'mmol/L' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle concentration de tensioactif est engagée dans les micelles ?'], utiles: ['c', 'cmc'], raisons: { T: 'La température ne sert pas au calcul.' },
        cherche: { bonne: 'La concentration de tensioactif engagé dans les micelles (en mmol/L)', faux: ['La concentration en monomères libres (en mmol/L)', 'La concentration totale de tensioactif (en mmol/L)', 'Le nombre de micelles par litre (sans unité)'] },
        manque: null, solution: { txt: 'concentration totale moins monomères libres (égaux à la CMC)', val: p.c - p.cmc, u: 'mmol/L' } };
    },
  },
  {
    id: 'tens-micelles', domaine: 'Tensioactifs : de la structure à la CMC', titre: 'Part du tensioactif sous forme de monomères et concentration en micelles', noms: ['Part de monomères libres', 'Concentration en micelles'],
    gen: () => ({ cmc: tire([4, 8, 10]), c: tire([40, 60, 80]), N: tire([40, 50, 80]) }),
    build: (p, q) => {
      const tokens = {
        cmc: tok(`CMC = ${p.cmc} mmol/L`, 'Concentration micellaire critique du tensioactif', p.cmc, 'mmol/L'),
        c: tok(`${p.c} mmol/L`, 'Concentration totale de tensioactif', p.c, 'mmol/L'),
        N: tok(`${p.N} molécules`, 'Nombre de molécules par micelle (nombre d’agrégation)', p.N, ''),
      };
      const debut = ['Un tensioactif a une CMC de ', T('cmc'), '. Une solution contient ', T('c'), ' de ce tensioactif au total ; chaque micelle réunit ', T('N'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel pourcentage du tensioactif est sous forme de monomères libres ?'], utiles: ['c', 'cmc'], raisons: { N: 'Le nombre d’agrégation ne sert pas à comparer monomères et total.' },
        cherche: { bonne: 'La part de tensioactif sous forme de monomères libres (en %)', faux: ['La part de tensioactif engagée dans les micelles (en %)', 'La concentration en monomères libres (en mmol/L)', 'Le nombre de micelles par litre (sans unité)'] },
        manque: null, solution: { txt: 'monomères libres = CMC ; part = CMC divisée par la concentration totale', val: 100 * p.cmc / p.c, u: '%' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en micelles (en mmol/L) ?'], utiles: ['c', 'cmc', 'N'], raisons: {},
        cherche: { bonne: 'La concentration en micelles (en mmol/L)', faux: ['La concentration de tensioactif engagé dans les micelles (en mmol/L)', 'La concentration en monomères libres (en mmol/L)', 'Le nombre de molécules par micelle (sans unité)'] },
        manque: null, solution: { txt: '(concentration totale − CMC) divisée par le nombre de molécules par micelle', val: (p.c - p.cmc) / p.N, u: 'mmol/L' } };
    },
  },
  // ───────────────────────────── Force des acides (TG) : K_A, pH, taux d'avancement
  {
    id: 'fab-sapp-ka', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Estimer la constante d’acidité d’un acide à partir du pH', noms: ['Constante d’acidité', 'Concentration en ions oxonium'],
    gen: () => { const pKa = tire([4.2, 4.4, 4.6, 4.8, 5.0]), C = tire([0.010, 0.020, 0.050, 0.10]), Ka = 10 ** -pKa, x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2, pH = Math.round(-Math.log10(x) * 100) / 100; return { C, pH, V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration apportée de l’acide', p.C, 'mol/L'),
        pH: tok(`${nb(p.pH, 2)}`, 'pH de la solution mesuré avec un pH-mètre', p.pH, ''),
        V: tok(`${p.V} mL`, 'Volume de la solution préparée', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['On prépare ', T('V'), ' d’une solution d’un acide faible, de concentration apportée ', T('C'), ', à ', T('T'), '. Le pH-mètre indique ', T('pH'), '. '];
      const h = 10 ** -p.pH;
      if (q === 0) return { tokens, derivees: ['[H₃O⁺] = 10^(−pH) = [A⁻] ; [AH] = C − [H₃O⁺]'], texte: [...debut, 'Quelle est la constante d’acidité K_A de cet acide ?'],
        utiles: ['C', 'pH'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas dans le calcul de K_A.', T: 'La température est constante : elle n’intervient pas dans le calcul, elle indique seulement que K_A garde sa valeur.' },
        cherche: { bonne: 'La constante d’acidité K_A (sans unité)', faux: ['Le taux d’avancement final τ (sans unité)', 'Le produit ionique de l’eau K_e (sans unité)', 'Le pK_A de l’acide (sans unité)'] },
        manque: null, solution: { txt: 'K_A = [H₃O⁺]² / (C − [H₃O⁺]), avec [H₃O⁺] = 10^(−pH)', val: h * h / (p.C - h), u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en ions oxonium de la solution ?'],
        utiles: ['pH'], raisons: { C: 'La concentration apportée sert à calculer K_A ou τ, pas [H₃O⁺] : celle-ci se déduit du pH seul.', V: 'Le volume ne change pas le pH : il n’intervient pas.', T: 'La température est constante : elle n’intervient pas dans la relation entre pH et [H₃O⁺].' },
        cherche: { bonne: 'La concentration en ions oxonium [H₃O⁺] (en mol/L)', faux: ['La constante d’acidité K_A de l’acide (sans unité)', 'Le taux d’avancement final τ de la solution', 'La concentration en ions hydroxyde [HO⁻] de la solution (en mol/L)'] },
        manque: null, solution: { txt: '[H₃O⁺] = 10^(−pH)', val: h, u: 'mol/L' } };
    },
  },
  {
    id: 'fab-sapp-compar', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Comparer la force de deux acides', noms: ['Constante d’acidité de l’acide A', 'Taux d’avancement de l’acide B'],
    gen: () => {
      const fa = (pKa, C) => { const Ka = 10 ** -pKa, x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2; return Math.round(-Math.log10(x) * 100) / 100; };
      const pA = tire([4.0, 4.2, 4.4]), pB = tire([4.6, 4.8, 5.0]), CA = tire([0.010, 0.020, 0.050]), CB = tire([0.010, 0.020, 0.050, 0.10]);
      return { CA, CB, pHA: fa(pA, CA), pHB: fa(pB, CB), V: tire([100, 200, 250]) };
    },
    build: (p, q) => {
      const tokens = {
        CA: tok(`${nb(p.CA, 3)} mol/L`, 'Concentration apportée de l’acide A', p.CA, 'mol/L'), pHA: tok(`${nb(p.pHA, 2)}`, 'pH de la solution de l’acide A', p.pHA, ''),
        CB: tok(`${nb(p.CB, 3)} mol/L`, 'Concentration apportée de l’acide B', p.CB, 'mol/L'), pHB: tok(`${nb(p.pHB, 2)}`, 'pH de la solution de l’acide B', p.pHB, ''),
        V: tok(`${p.V} mL`, 'Volume prélevé pour chaque mesure de pH', p.V, 'mL'),
      };
      const debut = ['On compare deux acides faibles à 25 °C. L’acide A, de concentration apportée ', T('CA'), ', donne un pH de ', T('pHA'), '. L’acide B, de concentration apportée ', T('CB'), ', donne un pH de ', T('pHB'), '. On prélève ', T('V'), ' de chaque solution pour mesurer le pH. '];
      const hA = 10 ** -p.pHA, hB = 10 ** -p.pHB;
      if (q === 0) return { tokens, derivees: ['[H₃O⁺] = 10^(−pH) pour l’acide A'], texte: [...debut, 'Quelle est la constante d’acidité K_A de l’acide A ?'],
        utiles: ['CA', 'pHA'], raisons: { CB: 'Ces données sont celles de l’acide B : elles ne servent pas pour K_A de l’acide A.', pHB: 'Ce pH est celui de l’acide B : il ne sert pas pour K_A de l’acide A.', V: 'Le volume prélevé ne change ni le pH ni les concentrations : il n’intervient pas.' },
        cherche: { bonne: 'La constante d’acidité K_A de l’acide A (sans unité)', faux: ['La constante d’acidité K_A de l’acide B (sans unité)', 'Le taux d’avancement final de l’acide A (sans unité)', 'Le pK_A de l’acide A (sans unité)'] },
        manque: null, solution: { txt: 'K_A = [H₃O⁺]² / (C − [H₃O⁺]), avec [H₃O⁺] = 10^(−pH) de l’acide A', val: hA * hA / (p.CA - hA), u: '' } };
      return { tokens, derivees: ['[H₃O⁺] = 10^(−pH) pour l’acide B'], texte: [...debut, 'Quel est le taux d’avancement final de l’acide B ?'],
        utiles: ['CB', 'pHB'], raisons: { CA: 'Ces données sont celles de l’acide A : elles ne servent pas pour l’acide B.', pHA: 'Ce pH est celui de l’acide A : il ne sert pas pour l’acide B.', V: 'Le volume prélevé ne change ni le pH ni les concentrations : il n’intervient pas (le volume se simplifie dans τ).' },
        cherche: { bonne: 'Le taux d’avancement final τ de l’acide B (sans unité)', faux: ['Le taux d’avancement final τ de l’acide A (sans unité)', 'La constante d’acidité K_A de l’acide B (sans unité)', 'La concentration en ions oxonium de l’acide A (mol/L)'] },
        manque: null, solution: { txt: 'τ = [H₃O⁺] / C, avec [H₃O⁺] = 10^(−pH) de l’acide B', val: hB / p.CB, u: '' } };
    },
  },
  // ───────────────────────────── Couples acide-base (TG) : rapport des formes, pourcentages
  {
    id: 'pdi-sapp-couple', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Composition d’un couple acide-base à un pH donné', noms: ['Rapport des deux formes', 'Concentration de la forme basique'],
    gen: () => { const pKa = tire([3.75, 4.20, 4.76, 9.20]), d = tire([-1, -0.5, 0.5, 1, 1.5]); return { pKa, pH: Math.round((pKa + d) * 10) / 10, C: tire([0.010, 0.020, 0.050, 0.10]), V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        pKa: tok(`${nb(p.pKa, 2)}`, 'pKA du couple acide-base', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la solution', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale du couple (AH + A⁻)', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un couple acide-base AH / A⁻ de pKA égal à ', T('pKa'), ' est en solution à pH = ', T('pH'), ' ; sa concentration totale (AH + A⁻) est ', T('C'), ', dans un volume de ', T('V'), ' à ', T('T'), '. '];
      const r = 10 ** (p.pH - p.pKa);
      if (q === 0) return { tokens, derivees: ['frac([A⁻]|[AH]) = 10^(pH − pK_A)'], texte: [...debut, 'Quel est le rapport frac([A⁻]|[AH]) ?'],
        utiles: ['pKa', 'pH'], raisons: { C: 'La concentration totale ne change pas le rapport des deux formes : elle fixe seulement leurs valeurs.', V: 'Le volume n’intervient pas dans le rapport de deux concentrations.', T: 'La température est constante : elle n’intervient pas dans le calcul, elle suppose que pKA garde sa valeur.' },
        cherche: { bonne: 'Le rapport frac([A⁻]|[AH]) (sans unité)', faux: ['La concentration de A⁻ (en mol/L)', 'Le pourcentage de la forme AH (en %)', 'Le produit ionique de l’eau Ke (sans unité)'] },
        manque: null, solution: { txt: 'frac([A⁻]|[AH]) = 10^(pH − pK_A)', val: r, u: '' } };
      return { tokens, derivees: ['[A⁻] = frac(C · r|1 + r) avec r = 10^(pH − pK_A)'], texte: [...debut, 'Quelle est la concentration de la forme basique A⁻ ?'],
        utiles: ['pKa', 'pH', 'C'], raisons: { V: 'Le volume ne change pas les concentrations : il n’intervient pas ici.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Concentration de la forme basique A⁻ (mol/L)', faux: ['Le rapport frac([A⁻]|[AH]) des deux formes (sans unité)', 'La concentration en ions oxonium (en mol/L)', 'Le pourcentage de forme basique (en %)'] },
        manque: null, solution: { txt: '[A⁻] = frac(C · r|1 + r), avec r = 10^(pH − pK_A)', val: p.C * r / (1 + r), u: 'mol/L' } };
    },
  },
  {
    id: 'pdi-sapp-indic', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Teinte d’un indicateur coloré à un pH donné', noms: ['Rapport des formes de l’indicateur', 'Pourcentage de la forme basique'],
    gen: () => { const pKa = tire([4.6, 6.8, 8.8, 11.0]), d = tire([-2, -1.5, -1, 1, 1.5, 2]); return { pKa, pH: Math.round((pKa + d) * 10) / 10, mi: tire([2, 5, 10]), T: tire([20, 25, 30]), V: tire([5, 10, 20]) }; },
    build: (p, q) => {
      const tokens = {
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKA de l’indicateur coloré', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH de la solution', p.pH, ''),
        mi: tok(`${p.mi} gouttes`, 'Nombre de gouttes d’indicateur versées', p.mi, ''),
        V: tok(`${p.V} mL`, 'Volume de solution testée', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un indicateur coloré HIn / In⁻ de pKA égal à ', T('pKa'), ' est ajouté (', T('mi'), ') à ', T('V'), ' d’une solution de pH ', T('pH'), ' à ', T('T'), '. '];
      const r = 10 ** (p.pH - p.pKa);
      if (q === 0) return { tokens, derivees: ['frac([In⁻]|[HIn]) = 10^(pH − pK_A)'], texte: [...debut, 'Quel est le rapport frac([In⁻]|[HIn]) ?'],
        utiles: ['pKa', 'pH'], raisons: { mi: 'Le nombre de gouttes fixe la quantité d’indicateur, pas le rapport de ses deux formes.', V: 'Le volume ne change pas un rapport de concentrations : il n’intervient pas.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le rapport frac([In⁻]|[HIn]) (sans unité)', faux: ['Le pourcentage de la forme HIn (en %)', 'La largeur de la zone de virage (en unités de pH)', 'La concentration de In⁻ (en mol/L)'] },
        manque: null, solution: { txt: 'frac([In⁻]|[HIn]) = 10^(pH − pK_A)', val: r, u: '' } };
      return { tokens, derivees: ['r = frac([In⁻]|[HIn]) = 10^(pH − pK_A)'], texte: [...debut, 'Quel est le pourcentage de la forme basique In⁻ ?'],
        utiles: ['pKa', 'pH'], raisons: { mi: 'Le nombre de gouttes ne modifie pas la proportion entre les deux formes.', V: 'Le volume n’intervient pas dans un pourcentage.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le pourcentage de forme basique In⁻ (en %)', faux: ['Le rapport frac([In⁻]|[HIn]) (sans unité)', 'Le pourcentage de la forme acide HIn (en %)', 'Le pH de début de virage (sans unité)'] },
        manque: null, solution: { txt: '% In⁻ = frac(100 × r|1 + r), avec r = 10^(pH − pK_A)', val: 100 * r / (1 + r), u: '%' } };
    },
  },
  // ───────────────────────────── Solution tampon (TG) : ajout d'acide, composition à préparer
  {
    id: 'tmp-sapp-ajout', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Ajout d’acide dans une solution tampon', noms: ['Quantité d’ions oxonium ajoutés', 'Quantité de base A⁻ restante'],
    gen: () => { const n0 = tire([10, 15, 20, 25]); return { n0, nAH: n0, nA: n0, V: tire([100, 150, 200]), Ca: tire([0.10, 0.20, 0.50]), Va: tire([2.0, 5.0, 10.0]), pKa: tire([4.76, 9.20]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const tokens = {
        nAH: tok(`${nb(p.nAH, 1)} mmol`, 'Quantité d’acide faible AH dans le tampon', p.nAH, 'mmol'),
        nA: tok(`${nb(p.nA, 1)} mmol`, 'Quantité de base conjuguée A⁻ dans le tampon', p.nA, 'mmol'),
        V: tok(`${p.V} mL`, 'Volume du tampon', p.V, 'mL'),
        Ca: tok(`${nb(p.Ca, 2)} mol/L`, 'Concentration de l’acide fort versé', p.Ca, 'mol/L'),
        Va: tok(`${nb(p.Va, 1)} mL`, 'Volume d’acide fort versé', p.Va, 'mL'),
        pKa: tok(`${nb(p.pKa, 2)}`, 'pKA du couple du tampon', p.pKa, ''),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Un tampon de ', T('V'), ' contient ', T('nAH'), ' d’acide faible AH et ', T('nA'), ' de sa base conjuguée A⁻ (pKA = ', T('pKa'), ', à ', T('T'), '). On y verse ', T('Va'), ' d’acide chlorhydrique de concentration ', T('Ca'), '. '];
      const nH = p.Ca * p.Va;
      if (q === 0) return { tokens, derivees: ['n(H₃O⁺) = C × V'], texte: [...debut, 'Quelle quantité d’ions oxonium a-t-on versée ?'],
        utiles: ['Ca', 'Va'], raisons: { nAH: 'La quantité d’acide du tampon n’intervient pas dans la quantité d’ions versés.', nA: 'La quantité de base du tampon n’intervient pas dans la quantité d’ions versés.', V: 'Le volume du tampon ne change pas la quantité d’acide versée.', pKa: 'Le pKA n’intervient pas dans une quantité de matière versée.', T: 'La température est constante : elle n’intervient pas dans ce calcul.' },
        cherche: { bonne: 'La quantité d’ions oxonium versés (en mmol)', faux: ['Le pH du tampon après l’ajout (sans unité)', 'La concentration de l’acide faible AH (en mol/L)', 'Le volume total de la solution (en mL)'] },
        manque: null, solution: { txt: 'n(H₃O⁺) = C × V', val: nH, u: 'mmol' } };
      return { tokens, derivees: ['n(H₃O⁺) versé = C × V', 'n(A⁻) restant = n(A⁻) initial − n(H₃O⁺) versé'], texte: [...debut, 'Quelle quantité de base A⁻ reste-t-il après la réaction avec l’acide versé ?'],
        utiles: ['nA', 'Ca', 'Va'], raisons: { nAH: 'La forme acide AH n’est pas consommée par un acide : elle n’intervient pas dans la quantité de A⁻ restante.', V: 'Le volume du tampon ne change pas les quantités de matière.', pKa: 'Le pKA n’intervient pas dans un bilan de quantités de matière.', T: 'La température est constante : elle n’intervient pas dans ce bilan.' },
        cherche: { bonne: 'La quantité de base A⁻ restante (en mmol)', faux: ['La quantité d’acide AH formée (en mmol)', 'La quantité d’ions oxonium versés (en mmol)', 'Le pH du tampon après l’ajout (sans unité)'] },
        manque: null, solution: { txt: 'n(A⁻) = n(A⁻) initial − C × V', val: p.nA - nH, u: 'mmol' } };
    },
  },
  {
    id: 'tmp-sapp-prepa', domaine: 'Force des acides et des bases : Ka et tampon', titre: 'Préparer un tampon de pH donné', noms: ['Rapport des quantités à introduire', 'Quantité de base A⁻ à introduire'],
    gen: () => { for (;;) { const pKa = tire([4.76, 9.20]), d = tire([-0.7, -0.5, -0.3, 0.3, 0.5, 0.7]), pH = Math.round((pKa + d) * 10) / 10, nAH = tire([10, 20, 25, 50]), V = tire([100, 250, 500]), Cs = tire([0.10, 0.50, 1.0]); /* le volume de solution de base à verser doit tenir dans le tampon à préparer */ if (nAH * 10 ** (pH - pKa) / Cs <= 0.5 * V) return { pKa, pH, nAH, V, Cs }; } },
    build: (p, q) => {
      const tokens = {
        pKa: tok(`${nb(p.pKa, 2)}`, 'pKA du couple acide-base choisi', p.pKa, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH visé pour le tampon', p.pH, ''),
        nAH: tok(`${p.nAH} mmol`, 'Quantité d’acide faible AH introduite', p.nAH, 'mmol'),
        V: tok(`${p.V} mL`, 'Volume du tampon à préparer', p.V, 'mL'),
        Cs: tok(`${nb(p.Cs, 2)} mol/L`, 'Concentration de la solution de base A⁻ disponible', p.Cs, 'mol/L'),
      };
      const debut = ['On veut préparer ', T('V'), ' d’un tampon de pH ', T('pH'), ' avec un couple acide-base de pKA égal à ', T('pKa'), '. On introduit ', T('nAH'), ' d’acide faible AH ; la base conjuguée A⁻ est disponible en solution à ', T('Cs'), '. '];
      const r = 10 ** (p.pH - p.pKa);
      if (q === 0) return { tokens, derivees: ['frac(n(A⁻)|n(AH)) = 10^(pH − pKA)'], texte: [...debut, 'Quel rapport frac(n(A⁻)|n(AH)) faut-il réaliser ?'],
        utiles: ['pKa', 'pH'], raisons: { nAH: 'La quantité d’acide fixe la valeur de n(A⁻), mais pas le rapport demandé.', V: 'Le volume ne change pas un rapport de quantités de matière.', Cs: 'La concentration de la solution de base n’intervient pas dans le rapport.' },
        cherche: { bonne: 'Le rapport frac(n(A⁻)|n(AH)) (sans unité)', faux: ['La quantité de A⁻ à introduire (en mmol)', 'Le volume de solution de base à verser (en mL)', 'La concentration de AH dans le tampon (en mol/L)'] },
        manque: null, solution: { txt: 'frac(n(A⁻)|n(AH)) = 10^(pH − pKA)', val: r, u: '' } };
      return { tokens, derivees: ['n(A⁻) = n(AH) × 10^(pH − pKA)'], texte: [...debut, 'Quelle quantité de base A⁻ faut-il introduire ?'],
        utiles: ['pKa', 'pH', 'nAH'], raisons: { V: 'Le volume du tampon ne change pas le rapport des quantités ni n(A⁻).', Cs: 'La concentration de la solution de base ne sert qu’à convertir n(A⁻) en volume, ce que l’on ne demande pas ici.' },
        cherche: { bonne: 'La quantité de base A⁻ à introduire (en mmol)', faux: ['Le rapport frac(n(A⁻)|n(AH)) (sans unité)', 'Le volume de solution de base à verser (en mL)', 'La concentration de A⁻ dans le tampon (en mol/L)'] },
        manque: null, solution: { txt: 'n(A⁻) = n(AH) × 10^(pH − pKA)', val: p.nAH * r, u: 'mmol' } };
    },
  },
  // ───────────────────────────── Acides α-aminés (TG, sim 134) : rapport des formes et pourcentages près d’une frontière
  {
    id: 'aam-sapp-cation', domaine: 'Acides α-aminés : forme selon le pH', titre: 'Cation et zwitterion d’un acide α-aminé', noms: ['Rapport zwitterion / cation', 'Pourcentage de cation'],
    gen: () => { const a = AAM[tire(AAM_ORDRE)], d = tire([-1, -0.5, 0.5, 1, 1.5]); return { ac: a.id, pKa1: a.pKa1, pKa2: a.pKa2, pH: Math.round((a.pKa1 + d) * 10) / 10, C: tire([0.010, 0.020, 0.050, 0.10]), V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const a = AAM[p.ac];
      const tokens = {
        pKa1: tok(`${nb(p.pKa1, 2)}`, 'pKA1 du couple cation / zwitterion (groupe –COOH)', p.pKa1, ''),
        pKa2: tok(`${nb(p.pKa2, 2)}`, 'pKA2 du couple zwitterion / anion (groupe –NH₃⁺)', p.pKa2, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH imposé à la solution', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale en acide α-aminé', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Pour ' + (/^[aeiouéè]/i.test(a.nom) ? 'l’' : 'la '), a.nom, ', les constantes d’acidité sont pKA1 = ', T('pKa1'), ' et pKA2 = ', T('pKa2'), '. La solution, de concentration totale ', T('C'), ' et de volume ', T('V'), ' à ', T('T'), ', a un pH imposé égal à ', T('pH'), '. '];
      const r = 10 ** (p.pH - p.pKa1);
      if (q === 0) return { tokens, derivees: ['[zwitterion] / [cation] = 10^(pH − pKA1)'], texte: [...debut, 'Quel est le rapport [zwitterion] / [cation] ?'],
        utiles: ['pKa1', 'pH'], raisons: { pKa2: 'pKA2 est trop éloigné du pH : près de pKA1, on lit seulement le couple cation / zwitterion.', C: 'La concentration totale ne change pas le rapport des deux formes : elle fixe seulement leurs valeurs.', V: 'Le volume n’intervient pas dans un rapport de deux concentrations.', T: 'La température est constante : elle suppose seulement que pKA garde sa valeur.' },
        cherche: { bonne: 'Le rapport [zwitterion] / [cation] (sans unité)', faux: ['La concentration du zwitterion (en mol/L)', 'Le pourcentage de cation (en %)', 'Le pH de la solution (sans unité)'] },
        manque: null, solution: { txt: '[zwitterion] / [cation] = 10^(pH − pKA1)', val: r, u: '' } };
      return { tokens, derivees: ['% cation = frac(100|1 + r) avec r = 10^(pH − pKA1)'], texte: [...debut, 'Quel pourcentage de l’acide α-aminé est sous forme de cation ? (la forme anionique est négligeable à ce pH)'],
        utiles: ['pKa1', 'pH'], raisons: { pKa2: 'pKA2 est trop éloigné du pH : l’anion est négligeable, on ne lit que le couple 1.', C: 'Un pourcentage ne dépend pas de la concentration totale.', V: 'Le volume ne change pas une proportion.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'Le pourcentage de cation (en %)', faux: ['Le rapport [zwitterion] / [cation] (sans unité)', 'La concentration du cation (en mol/L)', 'Le pourcentage d’anion (en %)'] },
        manque: null, solution: { txt: '% cation = frac(100|1 + r), avec r = 10^(pH − pKA1)', val: 100 / (1 + r), u: '%' } };
    },
  },
  {
    id: 'aam-sapp-anion', domaine: 'Acides α-aminés : forme selon le pH', titre: 'Zwitterion et anion d’un acide α-aminé en solution basique', noms: ['Rapport anion / zwitterion', 'Concentration de l’anion'],
    gen: () => { const a = AAM[tire(AAM_ORDRE)], d = tire([-1.5, -1, -0.5, 0.5, 1]); return { ac: a.id, pKa1: a.pKa1, pKa2: a.pKa2, pH: Math.round((a.pKa2 + d) * 10) / 10, C: tire([0.010, 0.020, 0.050, 0.10]), V: tire([100, 250, 500]), T: tire([20, 25, 30]) }; },
    build: (p, q) => {
      const a = AAM[p.ac];
      const tokens = {
        pKa1: tok(`${nb(p.pKa1, 2)}`, 'pKA1 du couple cation / zwitterion (groupe –COOH)', p.pKa1, ''),
        pKa2: tok(`${nb(p.pKa2, 2)}`, 'pKA2 du couple zwitterion / anion (groupe –NH₃⁺)', p.pKa2, ''),
        pH: tok(`${nb(p.pH, 1)}`, 'pH imposé à la solution', p.pH, ''),
        C: tok(`${nb(p.C, 3)} mol/L`, 'Concentration totale en acide α-aminé', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
      };
      const debut = ['Pour ' + (/^[aeiouéè]/i.test(a.nom) ? 'l’' : 'la '), a.nom, ', les constantes d’acidité sont pKA1 = ', T('pKa1'), ' et pKA2 = ', T('pKa2'), '. La solution, de concentration totale ', T('C'), ' et de volume ', T('V'), ' à ', T('T'), ', a un pH imposé égal à ', T('pH'), '. '];
      const r = 10 ** (p.pH - p.pKa2);
      if (q === 0) return { tokens, derivees: ['[anion] / [zwitterion] = 10^(pH − pKA2)'], texte: [...debut, 'Quel est le rapport [anion] / [zwitterion] ?'],
        utiles: ['pKa2', 'pH'], raisons: { pKa1: 'pKA1 est trop éloigné du pH : près de pKA2, on lit seulement le couple zwitterion / anion.', C: 'La concentration totale ne change pas le rapport des deux formes.', V: 'Le volume n’intervient pas dans un rapport de deux concentrations.', T: 'La température est constante : elle suppose seulement que pKA garde sa valeur.' },
        cherche: { bonne: 'Le rapport [anion] / [zwitterion] (sans unité)', faux: ['La concentration de l’anion (en mol/L)', 'Le pourcentage de zwitterion (en %)', 'Le pH de la solution (sans unité)'] },
        manque: null, solution: { txt: '[anion] / [zwitterion] = 10^(pH − pKA2)', val: r, u: '' } };
      return { tokens, derivees: ['[anion] = frac(C × r|1 + r) avec r = 10^(pH − pKA2)'], texte: [...debut, 'Quelle est la concentration de l’anion ? (la forme cationique est négligeable à ce pH)'],
        utiles: ['pKa2', 'pH', 'C'], raisons: { pKa1: 'pKA1 est trop éloigné du pH : le cation est négligeable, on ne lit que le couple 2.', V: 'Le volume ne change pas les concentrations : il n’intervient pas ici.', T: 'La température est constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'La concentration de l’anion (en mol/L)', faux: ['Le rapport [anion] / [zwitterion] (sans unité)', 'La concentration en ions oxonium (en mol/L)', 'Le pourcentage d’anion (en %)'] },
        manque: null, solution: { txt: '[anion] = frac(C × r|1 + r), avec r = 10^(pH − pKA2)', val: p.C * r / (1 + r), u: 'mol/L' } };
    },
  },
  // ───────────────────────────── Conductimétrie (TG, sim 135) : conductivité d’une solution et titrage conductimétrique
  {
    id: 'cdt-sapp-sel', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Conductivité d’une solution de sel', noms: ['Conductivité de la solution', 'Concentration à partir de la conductivité'],
    gen: () => { const s = tire(CDT_SELS); return { s, C: tire([0.0020, 0.0030, 0.0040, 0.0050, 0.0080]), V: tire([100, 250, 500]) }; },
    build: (p, q) => {
      const s = p.s, lc = CDT_IONS[s.cat].lambda, la = CDT_IONS[s.an].lambda, somme = lc + la;
      const sigma = Math.round(somme * p.C * 1000 * 10) / 10;
      const tokens = {
        lc: tok(`${nb(lc, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${CDT_IONS[s.cat].f} à 25 °C`, lc, 'mS·m²·mol⁻¹'),
        la: tok(`${nb(la, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${CDT_IONS[s.an].f} à 25 °C`, la, 'mS·m²·mol⁻¹'),
        C: tok(`${nb(p.C, 4)} mol/L`, 'Concentration en soluté apporté', p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        sigma: tok(`${nb(sigma, 1)} mS·m⁻¹`, 'Conductivité mesurée à 25 °C', sigma, 'mS·m⁻¹'),
      };
      const debut = ['Une solution de ', s.nom, ' (', s.f, ', totalement dissocié en ', CDT_IONS[s.cat].f, ' et ', CDT_IONS[s.an].f, ') est diluée : ', 'λ(', CDT_IONS[s.cat].f, ') = ', T('lc'), ' et λ(', CDT_IONS[s.an].f, ') = ', T('la'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'cm', nom: 'Concentration en mol·m⁻³ (1 mol/L = 1 000 mol·m⁻³)', expr: 'c × 1 000', val: p.C * 1000, u: 'mol·m⁻³' }], texte: [...debut, 'La solution, de concentration ', T('C'), ', occupe un volume de ', T('V'), '. Quelle est sa conductivité ?'],
        utiles: ['lc', 'la', 'C'], raisons: { V: 'Le volume ne change pas la concentration, donc pas la conductivité : σ dépend des concentrations, pas de la quantité de solution.' },
        cherche: { bonne: 'La conductivité σ (en mS·m⁻¹)', faux: ['La concentration du soluté (en mol/L)', 'La conductivité ionique molaire du soluté (en mS·m²·mol⁻¹)', 'La résistance électrique de la cellule (en Ω)'] },
        manque: null, solution: { txt: 'σ = (λ(cation) + λ(anion)) × c, avec c en mol·m⁻³', val: somme * p.C * 1000, u: 'mS·m⁻¹' } };
      return { tokens, derivees: [{ id: 'som', nom: 'Somme des conductivités ioniques molaires', expr: 'λ(cation) + λ(anion)', val: somme, u: 'mS·m²·mol⁻¹' }], texte: [...debut, 'La conductivité mesurée vaut ', T('sigma'), ' ; le volume de solution est ', T('V'), '. Quelle est la concentration du soluté ?'],
        utiles: ['lc', 'la', 'sigma'], raisons: { V: 'Le volume ne change pas une concentration : on la déduit de σ et des conductivités ioniques molaires.' },
        cherche: { bonne: 'La concentration du soluté (en mol/L)', faux: ['La conductivité de la solution (en mS·m⁻¹)', 'La quantité de soluté dissous (en mmol)', 'La conductivité ionique molaire de la solution (en mS·m²·mol⁻¹)'] },
        manque: null, solution: { txt: 'c = frac(σ|λ(cation) + λ(anion)) = en mol·m⁻³, soit en mol/L après division par 1 000', val: sigma / somme / 1000, u: 'mol/L' } };
    },
  },
  {
    id: 'cdt-sapp-equiv', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Volume équivalent d’un titrage conductimétrique', noms: ['Concentration de l’acide', 'Quantité d’ions HO⁻ versée à l’équivalence'],
    gen: () => ({ cB: tire([0.050, 0.100, 0.200]), VA: tire([10.0, 20.0, 25.0]), VE: tire([8.0, 10.5, 12.0, 14.5, 16.0]), eau: tire([150, 180, 190]) }),
    build: (p, q) => {
      const tokens = {
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de la prise d’essai d’acide', p.VA, 'mL'),
        eau: tok(`${p.eau} mL`, 'Volume d’eau ajouté avant le titrage', p.eau, 'mL'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, 'Concentration de la solution d’hydroxyde de sodium', p.cB, 'mol/L'),
        VE: tok(`${nb(p.VE, 1)} mL`, 'Volume équivalent lu à la rupture de pente de la courbe', p.VE, 'mL'),
      };
      const debut = ['On titre une prise d’essai de ', T('VA'), ' d’acide chlorhydrique, de concentration cA inconnue, diluée dans ', T('eau'), ' d’eau, par une solution d’hydroxyde de sodium de concentration ', T('cB'), '. Le suivi de la conductivité donne une rupture de pente pour un volume versé ', T('VE'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'nHO', nom: 'Quantité d’ions HO⁻ versée à l’équivalence', expr: 'n(HO⁻) = cB × VE', val: p.cB * p.VE, u: 'mmol' }], texte: [...debut, 'Quelle est la concentration cA de l’acide ?'],
        utiles: ['VA', 'cB', 'VE'], raisons: { eau: 'L’eau ajoutée dilue l’acide mais ne change pas sa quantité de matière : elle ne sert pas au calcul de cA.' },
        cherche: { bonne: 'La concentration cA de l’acide (en mol/L)', faux: ['La quantité d’acide titré (en mmol)', 'La concentration de la solution de soude (en mol/L)', 'La concentration de l’acide après dilution (en mol/L)'] },
        manque: null, solution: { txt: 'cA = cB × frac(VE|VA) (quantités égales à l’équivalence)', val: p.cB * p.VE / p.VA, u: 'mol/L' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle quantité d’ions HO⁻ a-t-on versée à l’équivalence ?'],
        utiles: ['cB', 'VE'], raisons: { VA: 'La prise d’essai sert à calculer la concentration de l’acide, pas la quantité de HO⁻ versée.', eau: 'L’eau de dilution ne contient pas d’ions HO⁻ : elle n’intervient pas.' },
        cherche: { bonne: 'La quantité n(HO⁻) versée (en mmol)', faux: ['La concentration en ions HO⁻ dans le bécher (en mol/L)', 'La quantité d’ions H₃O⁺ restants (en mmol)', 'Le volume équivalent (en mL)'] },
        manque: null, solution: { txt: 'n(HO⁻) = cB × VE (mol/L × mL = mmol)', val: p.cB * p.VE, u: 'mmol' } };
    },
  },
  {
    id: 'cdt-sapp-pente', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Variation de la conductivité en cours de titrage', noms: ['Variation de σ avant l’équivalence', 'Variation de σ après l’équivalence'],
    gen: () => ({ dn: tire([0.10, 0.20, 0.30, 0.50]), Vt: tire([200, 210, 220, 250]), acide: tire(['chlorhydrique', 'nitrique']) }),
    build: (p, q) => {
      const an = p.acide === 'chlorhydrique' ? 'Cl' : 'NO3', I = CDT_IONS;
      const tokens = {
        dn: tok(`${nb(p.dn, 2)} mmol`, 'Quantité d’ions HO⁻ ajoutée', p.dn, 'mmol'),
        Vt: tok(`${p.Vt} mL`, 'Volume total de la solution (supposé constant)', p.Vt, 'mL'),
        lH: tok(`${nb(I.H3O.lambda, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de H₃O⁺', I.H3O.lambda, 'mS·m²·mol⁻¹'),
        lNa: tok(`${nb(I.Na.lambda, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de Na⁺', I.Na.lambda, 'mS·m²·mol⁻¹'),
        lHO: tok(`${nb(I.HO.lambda, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de HO⁻', I.HO.lambda, 'mS·m²·mol⁻¹'),
        lAn: tok(`${nb(I[an].lambda, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${I[an].f}`, I[an].lambda, 'mS·m²·mol⁻¹'),
      };
      const fac = 1000 * p.dn / p.Vt;
      const debut = ['On titre une solution d’acide ', p.acide, ' par la soude (Na⁺, HO⁻). Conductivités ioniques molaires à 25 °C : λ(H₃O⁺) = ', T('lH'), ', λ(Na⁺) = ', T('lNa'), ', λ(HO⁻) = ', T('lHO'), ' et λ(', I[an].f, ') = ', T('lAn'), '. On ajoute ', T('dn'), ' d’ions HO⁻ ; le volume total, ', T('Vt'), ', est supposé constant. '];
      if (q === 0) return { tokens, derivees: [{ id: 'dc', nom: 'Variation de concentration en mol·m⁻³ (1 mmol/mL = 1 000 mol·m⁻³)', expr: 'Δc = 1 000 × Δn / Vt', val: fac, u: 'mol·m⁻³' }], texte: [...debut, 'Avant l’équivalence, chaque ion HO⁻ réagit avec un ion H₃O⁺ et un ion Na⁺ apparaît. Quelle est la variation de la conductivité ?'],
        utiles: ['lH', 'lNa', 'dn', 'Vt'], raisons: { lHO: 'Avant l’équivalence, HO⁻ est consommé : il ne reste pas en solution, sa conductivité ionique molaire n’intervient pas.', lAn: 'L’ion spectateur ne change pas : sa concentration reste la même (à volume constant).' },
        cherche: { bonne: 'La variation Δσ de la conductivité (en mS·m⁻¹)', faux: ['La conductivité σ finale de la solution (en mS·m⁻¹)', 'La variation de la quantité d’ions Na⁺ (en mmol)', 'La variation du pH de la solution (sans unité)'] },
        manque: null, solution: { txt: 'Δσ = (λ(Na⁺) − λ(H₃O⁺)) × Δc, avec Δc = Δn / Vt en mol·m⁻³', val: (I.Na.lambda - I.H3O.lambda) * fac, u: 'mS·m⁻¹' } };
      return { tokens, derivees: [{ id: 'dc', nom: 'Variation de concentration en mol·m⁻³ (1 mmol/mL = 1 000 mol·m⁻³)', expr: 'Δc = 1 000 × Δn / Vt', val: fac, u: 'mol·m⁻³' }], texte: [...debut, 'Après l’équivalence, les ions HO⁻ ajoutés ne réagissent plus : ils s’accumulent avec les ions Na⁺ correspondants. Quelle est la variation de la conductivité ?'],
        utiles: ['lNa', 'lHO', 'dn', 'Vt'], raisons: { lH: 'Après l’équivalence, il n’y a plus d’ions H₃O⁺ à consommer : cet ion n’intervient pas dans la variation.', lAn: 'L’ion spectateur ne change pas : sa concentration reste la même (à volume constant).' },
        cherche: { bonne: 'La variation Δσ de la conductivité (en mS·m⁻¹)', faux: ['La conductivité σ finale de la solution (en mS·m⁻¹)', 'La variation de la quantité d’ions HO⁻ (en mmol)', 'La variation du volume équivalent (en mL)'] },
        manque: null, solution: { txt: 'Δσ = (λ(Na⁺) + λ(HO⁻)) × Δc, avec Δc = Δn / Vt en mol·m⁻³', val: (I.Na.lambda + I.HO.lambda) * fac, u: 'mS·m⁻¹' } };
    },
  },
  {
    id: 'cdt-sapp-compo', domaine: 'Conductimétrie : conductivité et titrage', titre: 'Composition après l’équivalence d’un titrage', noms: ['Quantité d’ions HO⁻ restants', 'Concentration en ions HO⁻'],
    gen: () => ({ cA: tire([0.040, 0.050, 0.060]), VA: 20.0, cB: 0.100, VB: tire([14.0, 16.0, 18.0]), eau: tire([150, 180]) }),
    build: (p, q) => {
      const tokens = {
        cA: tok(`${nb(p.cA, 3)} mol/L`, 'Concentration de l’acide chlorhydrique titré', p.cA, 'mol/L'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de la prise d’essai d’acide', p.VA, 'mL'),
        eau: tok(`${p.eau} mL`, 'Volume d’eau ajouté avant le titrage', p.eau, 'mL'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, 'Concentration de la solution d’hydroxyde de sodium', p.cB, 'mol/L'),
        VB: tok(`${nb(p.VB, 1)} mL`, 'Volume de soude versé', p.VB, 'mL'),
      };
      const reste = p.cB * p.VB - p.cA * p.VA, Vt = p.VA + p.eau + p.VB;
      const debut = ['Une prise d’essai de ', T('VA'), ' d’acide chlorhydrique à ', T('cA'), ' est diluée dans ', T('eau'), ' d’eau, puis titrée par de la soude à ', T('cB'), '. On a versé ', T('VB'), ' de soude, soit plus que le volume équivalent (la transformation est totale). '];
      if (q === 0) return { tokens, derivees: [{ id: 'nH', nom: 'Quantité initiale d’ions H₃O⁺', expr: 'n(H₃O⁺) = cA × VA', val: p.cA * p.VA, u: 'mmol' }, { id: 'nB', nom: 'Quantité d’ions HO⁻ versée', expr: 'n(HO⁻) = cB × VB', val: p.cB * p.VB, u: 'mmol' }], texte: [...debut, 'Quelle quantité d’ions HO⁻ reste-t-il dans le bécher ?'],
        utiles: ['cA', 'VA', 'cB', 'VB'], raisons: { eau: 'L’eau de dilution ne change pas les quantités de matière : elle intervient seulement dans les concentrations.' },
        cherche: { bonne: 'La quantité n(HO⁻) restante (en mmol)', faux: ['La concentration en HO⁻ dans le bécher (en mol/L)', 'La quantité d’ions H₃O⁺ du départ (en mmol)', 'La quantité d’ions HO⁻ versés (en mmol)'] },
        manque: null, solution: { txt: 'n(HO⁻) restant = cB × VB − cA × VA', val: reste, u: 'mmol' } };
      return { tokens, derivees: [{ id: 'nres', nom: 'Quantité d’ions HO⁻ restants', expr: 'n(HO⁻) = cB × VB − cA × VA', val: reste, u: 'mmol' }, { id: 'Vt', nom: 'Volume total du bécher', expr: 'VA + volume d’eau + VB', val: Vt, u: 'mL' }], texte: [...debut, 'Quelle est la concentration en ions HO⁻ dans le bécher ?'],
        utiles: ['cA', 'VA', 'eau', 'cB', 'VB'], raisons: {},
        cherche: { bonne: 'La concentration en HO⁻ (en mol/L)', faux: ['La quantité d’ions HO⁻ restants (en mmol)', 'La concentration de la soude versée (en mol/L)', 'La concentration en ions Na⁺ (en mol/L)'] },
        manque: null, solution: { txt: '[HO⁻] = frac(cB × VB − cA × VA|VA + volume d’eau + VB) ; mmol / mL = mol/L', val: reste / Vt, u: 'mol/L' } };
    },
  },
  {
    id: 'cdp-sapp-equiv', domaine: 'Titrage conductimétrique par précipitation', titre: 'Dosage des ions chlorure : volume équivalent et précipité formé', noms: ['Volume équivalent', 'Quantité de précipité AgCl formée'],
    gen: () => ({ cA: tire([0.020, 0.030, 0.040, 0.050]), VA: tire([10.0, 20.0, 25.0]), cB: tire([0.050, 0.100]), eau: tire([150, 180, 190]) }),
    build: (p, q) => {
      const tokens = {
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de la prise d’essai d’eau salée', p.VA, 'mL'),
        cA: tok(`${nb(p.cA, 3)} mol/L`, 'Concentration en ions chlorure de la prise d’essai', p.cA, 'mol/L'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, 'Concentration de la solution de nitrate d’argent', p.cB, 'mol/L'),
        eau: tok(`${p.eau} mL`, 'Volume d’eau ajouté avant le dosage', p.eau, 'mL'),
      };
      const debut = ['On dose une prise d’essai de ', T('VA'), ' d’une eau salée, de concentration en ions chlorure ', T('cA'), ', diluée dans ', T('eau'), ' d’eau, par une solution de nitrate d’argent de concentration ', T('cB'), ', en suivant la conductivité. '];
      if (q === 0) return { tokens, derivees: [{ id: 'nCl', nom: 'Quantité d’ions Cl⁻ à doser', expr: 'n(Cl⁻) = cA × VA', val: p.cA * p.VA, u: 'mmol' }], texte: [...debut, 'Quel volume de nitrate d’argent faut-il verser pour atteindre l’équivalence ?'],
        utiles: ['VA', 'cA', 'cB'], raisons: { eau: 'L’eau ajoutée dilue les ions chlorure mais ne change pas leur quantité : elle ne sert pas au calcul du volume équivalent.' },
        cherche: { bonne: 'Le volume équivalent VE (en mL)', faux: ['La quantité d’ions Cl⁻ à doser (en mmol)', 'La concentration des ions chlorure après dilution (en mol/L)', 'La masse de précipité formée (en mg)'] },
        manque: null, solution: { txt: 'cB × VE = cA × VA (un Ag⁺ pour un Cl⁻), donc VE = cA × VA / cB', val: p.cA * p.VA / p.cB, u: 'mL' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de chlorure d’argent AgCl(s) s’est formée à l’équivalence ?'],
        utiles: ['VA', 'cA'], raisons: { cB: 'La concentration du titrant sert à trouver le volume équivalent ; la quantité de précipité vient de la quantité de Cl⁻ dosée.', eau: 'L’eau ajoutée ne change pas la quantité de Cl⁻ : elle n’intervient pas.' },
        cherche: { bonne: 'La quantité de AgCl(s) formée (en mmol)', faux: ['La concentration en AgCl dans le bécher (en mol/L)', 'La quantité d’ions Ag⁺ restants (en mmol)', 'Le volume équivalent (en mL)'] },
        manque: null, solution: { txt: 'n(AgCl) = n(Cl⁻) initial = cA × VA (mol/L × mL = mmol)', val: p.cA * p.VA, u: 'mmol' } };
    },
  },
  {
    id: 'cdp-sapp-sigma', domaine: 'Titrage conductimétrique par précipitation', titre: 'Dosage des chlorures : conductivité à l’équivalence et pente après', noms: ['Conductivité à l’équivalence', 'Variation de σ par mL versé après l’équivalence'],
    gen: () => { const cat = tire([['Na⁺', 5.0], ['K⁺', 7.4]]); return { cat, cA: tire([0.020, 0.030, 0.040, 0.050]), cB: tire([0.050, 0.100]), eau: tire([150, 180, 190]) }; },
    build: (p, q) => {
      const VA = 20.0, Vt = VA + p.eau, lAg = 6.2, lNO3 = 7.1;
      const tokens = {
        lc: tok(`${nb(p.cat[1], 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${p.cat[0]} à 25 °C`, p.cat[1], 'mS·m²·mol⁻¹'),
        lN: tok(`${nb(lNO3, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de NO₃⁻ à 25 °C', lNO3, 'mS·m²·mol⁻¹'),
        lA: tok(`${nb(lAg, 1)} mS·m²·mol⁻¹`, 'Conductivité ionique molaire de Ag⁺ à 25 °C', lAg, 'mS·m²·mol⁻¹'),
        cA: tok(`${nb(p.cA, 3)} mol/L`, 'Concentration en ions chlorure de la prise d’essai', p.cA, 'mol/L'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, 'Concentration de la solution de nitrate d’argent', p.cB, 'mol/L'),
        Vt: tok(`${Vt} mL`, 'Volume de la solution dans le bécher (prise d’essai de 20,0 mL et eau), supposé constant', Vt, 'mL'),
      };
      const debut = ['On dose les ions chlorure de ', T('cA'), ' d’une prise d’essai de 20,0 mL (cation spectateur ', p.cat[0], ') par du nitrate d’argent à ', T('cB'), '. Le bécher contient ', T('Vt'), ' de solution, volume supposé constant. Données : λ(', p.cat[0], ') = ', T('lc'), ', λ(NO₃⁻) = ', T('lN'), ', λ(Ag⁺) = ', T('lA'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'cm', nom: 'Concentration des ions spectateurs à l’équivalence', expr: 'cA × frac(20,0|Vt) × 1 000', val: p.cA * VA / Vt * 1000, u: 'mol·m⁻³' }], texte: [...debut, 'Quelle est la conductivité σ à l’équivalence ?'],
        utiles: ['lc', 'lN', 'cA', 'Vt'], raisons: { lA: 'À l’équivalence, il ne reste plus d’ions Ag⁺ en excès : leur contribution est nulle.', cB: 'La concentration du titrant fixe le volume équivalent, pas la concentration des ions spectateurs dans le bécher.' },
        cherche: { bonne: 'La conductivité σ à l’équivalence (en mS·m⁻¹)', faux: ['La conductivité σ au départ (en mS·m⁻¹)', 'La concentration des ions spectateurs (en mol/L)', 'La variation de σ par mL versé (en mS·m⁻¹ par mL)'] },
        manque: null, solution: { txt: 'σ = (λ(cation) + λ(NO₃⁻)) × [cation], avec [cation] = [NO₃⁻] = cA × frac(20,0|Vt) en mol·m⁻³', val: (p.cat[1] + lNO3) * p.cA * VA / Vt * 1000, u: 'mS·m⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'De combien σ augmente-t-elle par mL de nitrate d’argent versé, après l’équivalence ?'],
        utiles: ['lA', 'lN', 'cB', 'Vt'], raisons: { lc: 'Après l’équivalence, la quantité du cation spectateur ne change plus : il ne contribue pas à la variation de σ.', cA: 'La concentration en chlorure fixe le volume équivalent, pas la pente après l’équivalence.' },
        cherche: { bonne: 'La variation de σ par mL versé (en mS·m⁻¹ par mL)', faux: ['La conductivité σ à l’équivalence (en mS·m⁻¹)', 'La quantité d’ions Ag⁺ versée par mL (en mmol)', 'La concentration en ions Ag⁺ dans le bécher (en mol/L)'] },
        manque: null, solution: { txt: 'Δσ par mL = (λ(Ag⁺) + λ(NO₃⁻)) × cB × 1 000 / Vt (chaque mL apporte cB mmol de chaque ion)', val: (lAg + lNO3) * p.cB * 1000 / Vt, u: 'mS·m⁻¹ par mL' } };
    },
  },
  {
    id: 'kcd-sapp-x', domaine: 'Constante d’un acide faible par conductimétrie', titre: 'Acide faible : concentration en ions et acide restant à partir de la conductivité', noms: ['Concentration en ions H₃O⁺ à l’équilibre', 'Concentration en acide restant'],
    gen: () => {
      const ac = tire([{ nom: 'acide méthanoïque', f: 'HCOOH', base: 'HCOO⁻', lA: 5.46, pKa: 3.75 }, { nom: 'acide propanoïque', f: 'C₂H₅COOH', base: 'C₂H₅COO⁻', lA: 3.58, pKa: 4.87 }]);
      const c = tire([0.0030, 0.0060, 0.012, 0.025, 0.040]), K = 10 ** -ac.pKa, x = (-K + Math.sqrt(K * K + 4 * K * c)) / 2;
      return { ac, c, sig: Number(((35.0 + ac.lA) * x * 1000).toPrecision(3)) };
    },
    build: (p, q) => {
      const L = 35.0 + p.ac.lA, x = p.sig / L / 1000;
      const tokens = {
        sig: tok(`${nb(p.sig)} mS·m⁻¹`, 'Conductivité de la solution à 25 °C', p.sig, 'mS·m⁻¹'),
        c: tok(`${sciR(p.c)} mol/L`, 'Concentration apportée en acide', p.c, 'mol/L'),
        lH: tok('35,0 mS·m²·mol⁻¹', 'Conductivité ionique molaire de H₃O⁺', 35.0, 'mS·m²·mol⁻¹'),
        lA: tok(`${nb(p.ac.lA, 2)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${p.ac.base}`, p.ac.lA, 'mS·m²·mol⁻¹'),
        pKa: tok(`${nb(p.ac.pKa, 2)}`, 'pKa du couple acide/base (valeur tabulée)', p.ac.pKa, ''),
      };
      const debut = ['Une solution d’', p.ac.nom, ' (', p.ac.f, '), de concentration apportée ', T('c'), ', a une conductivité ', T('sig'), ' à 25 °C. On néglige les ions HO⁻. Données : λ(H₃O⁺) = ', T('lH'), ', λ(', p.ac.base, ') = ', T('lA'), ' ; le pKa du couple ', p.ac.f, ' / ', p.ac.base, ' vaut ', T('pKa'), '. '];
      const der = [{ id: 'S', nom: 'Somme des conductivités ioniques molaires', expr: 'λ(H₃O⁺) + λ(A⁻)', val: L, u: 'mS·m²·mol⁻¹' }];
      if (q === 0) return { tokens, derivees: der, texte: [...debut, 'Quelle est la concentration en ions H₃O⁺ à l’équilibre ?'],
        utiles: ['sig', 'lH', 'lA'], raisons: { c: 'La concentration apportée ne sert pas à trouver [H₃O⁺] : elle se déduit de σ et des λ.', pKa: 'Le pKa est une valeur tabulée : on ne s’en sert pas pour exploiter la mesure de σ.' },
        cherche: { bonne: 'La concentration en H₃O⁺ (en mol/L)', faux: ['La concentration en acide restant (en mol/L)', 'La constante d’équilibre K (sans unité)', 'Le taux d’avancement final (en %)'] },
        manque: null, solution: { txt: 'σ = (λ(H₃O⁺) + λ(A⁻)) × [H₃O⁺] ; [H₃O⁺] en mol·m⁻³, puis diviser par 1 000 pour obtenir des mol/L', val: x, u: 'mol/L' } };
      return { tokens, derivees: [...der, { id: 'x', nom: 'Concentration en ions H₃O⁺ à l’équilibre', expr: 'frac(σ|λ(H₃O⁺) + λ(A⁻))', val: x, u: 'mol/L' }], texte: [...debut, 'Quelle est la concentration en acide HA restant à l’équilibre ?'],
        utiles: ['sig', 'lH', 'lA', 'c'], raisons: { pKa: 'Le pKa n’intervient pas dans un bilan de matière : il se compare à la valeur de K calculée.' },
        cherche: { bonne: 'La concentration en acide restant HA (en mol/L)', faux: ['La concentration en ions H₃O⁺ (en mol/L)', 'La concentration apportée c (en mol/L)', 'La constante d’équilibre K (sans unité)'] },
        manque: null, solution: { txt: '[HA] = c − [H₃O⁺] (tableau d’avancement : chaque H₃O⁺ formé a consommé une molécule HA)', val: p.c - x, u: 'mol/L' } };
    },
  },
  {
    id: 'kcd-sapp-K', domaine: 'Constante d’un acide faible par conductimétrie', titre: 'Acide faible : constante d’équilibre et taux d’avancement final', noms: ['Constante d’équilibre K', 'Taux d’avancement final'],
    gen: () => {
      const ac = tire([{ nom: 'acide méthanoïque', f: 'HCOOH', base: 'HCOO⁻', pKa: 3.75 }, { nom: 'acide propanoïque', f: 'C₂H₅COOH', base: 'C₂H₅COO⁻', pKa: 4.87 }]);
      const c = tire([0.0030, 0.0060, 0.012, 0.025, 0.040]), Kt = 10 ** -ac.pKa, x0 = (-Kt + Math.sqrt(Kt * Kt + 4 * Kt * c)) / 2;
      return { ac, c, x: Number(x0.toPrecision(2)), V: tire([50, 100, 200]) };
    },
    build: (p, q) => {
      const tokens = {
        x: tok(`${sciR(p.x)} mol/L`, 'Concentration en ions H₃O⁺ à l’équilibre', p.x, 'mol/L'),
        c: tok(`${sciR(p.c)} mol/L`, 'Concentration apportée en acide', p.c, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de la solution préparée', p.V, 'mL'),
      };
      const debut = ['On prépare ', T('V'), ' d’une solution d’', p.ac.nom, ' (', p.ac.f, ') de concentration apportée ', T('c'), '. À 25 °C, la conductimétrie donne, à l’équilibre, ', T('x'), ' en ions H₃O⁺ (et autant en ', p.ac.base, '). '];
      if (q === 0) return { tokens, derivees: [{ id: 'HA', nom: 'Concentration en acide restant', expr: 'c − x', val: p.c - p.x, u: 'mol/L' }], texte: [...debut, 'Quelle est la constante d’équilibre K de la réaction de l’acide avec l’eau ?'],
        utiles: ['x', 'c'], raisons: { V: 'K se calcule avec des concentrations : le volume de la solution n’intervient pas.' },
        cherche: { bonne: 'La constante d’équilibre K (sans unité)', faux: ['Le taux d’avancement final (en %)', 'La concentration en acide restant (en mol/L)', 'La quantité de matière d’acide introduite (en mmol)'] },
        manque: null, solution: { txt: 'K = [A⁻] × [H₃O⁺] / [HA] = frac(x²|c − x)', val: p.x * p.x / (p.c - p.x), u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le taux d’avancement final de la réaction ?'],
        utiles: ['x', 'c'], raisons: { V: 'Le taux d’avancement est un rapport de deux concentrations : le volume se simplifie.' },
        cherche: { bonne: 'Le taux d’avancement final τ (en %)', faux: ['La constante d’équilibre K (sans unité)', 'La concentration en acide restant (en mol/L)', 'La quantité d’ions formés (en mmol)'] },
        manque: null, solution: { txt: 'τ = frac(x|c), multiplié par 100 pour l’exprimer en pourcentage', val: 100 * p.x / p.c, u: '%' } };
    },
  },
  {
    id: 'acd-sapp-pente', schema: () => ({ type: 'titrage', sonde: 'conductimètre', burette: 'base forte', becher: 'acide fort' }), domaine: 'Allure d’une courbe de titrage conductimétrique', titre: 'Acide fort et base forte : variation de σ avant et après l’équivalence', noms: ['Variation de σ par mL versé avant l’équivalence', 'Variation de σ par mL versé après l’équivalence'],
    gen: () => ({ cas: tire(['acide', 'base']), cA: tire([0.020, 0.030, 0.040, 0.050]), cB: tire([0.100, 0.200]), eau: tire([150, 180, 190]) }),
    build: (p, q) => {
      const Vt = 20.0 + p.eau, acide = p.cas === 'acide', pas = p.cB * 1000 / Vt;
      const tokens = {
        lH: tok('35,0 mS·m²·mol⁻¹', 'Conductivité ionique molaire de H₃O⁺ à 25 °C', 35.0, 'mS·m²·mol⁻¹'),
        lO: tok('19,9 mS·m²·mol⁻¹', 'Conductivité ionique molaire de HO⁻ à 25 °C', 19.9, 'mS·m²·mol⁻¹'),
        lN: tok('5,0 mS·m²·mol⁻¹', 'Conductivité ionique molaire de Na⁺ à 25 °C', 5.0, 'mS·m²·mol⁻¹'),
        lC: tok('7,6 mS·m²·mol⁻¹', 'Conductivité ionique molaire de Cl⁻ à 25 °C', 7.6, 'mS·m²·mol⁻¹'),
        cA: tok(`${nb(p.cA, 3)} mol/L`, acide ? 'Concentration en acide chlorhydrique de la prise d’essai' : 'Concentration en soude de la prise d’essai', p.cA, 'mol/L'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, acide ? 'Concentration de la soude versée' : 'Concentration de l’acide chlorhydrique versé', p.cB, 'mol/L'),
        Vt: tok(`${Vt} mL`, 'Volume de la solution dans le bécher (prise d’essai de 20,0 mL et eau), supposé constant', Vt, 'mL'),
      };
      const debut = acide
        ? ['On titre une prise d’essai de 20,0 mL d’acide chlorhydrique (H₃O⁺ + Cl⁻) de concentration ', T('cA'), ' par de la soude (Na⁺ + HO⁻) à ', T('cB'), '. Le bécher contient ', T('Vt'), ' de solution, volume supposé constant. Données : λ(H₃O⁺) = ', T('lH'), ', λ(HO⁻) = ', T('lO'), ', λ(Na⁺) = ', T('lN'), ', λ(Cl⁻) = ', T('lC'), '. ']
        : ['On titre une prise d’essai de 20,0 mL de soude (Na⁺ + HO⁻) de concentration ', T('cA'), ' par de l’acide chlorhydrique (H₃O⁺ + Cl⁻) à ', T('cB'), '. Le bécher contient ', T('Vt'), ' de solution, volume supposé constant. Données : λ(H₃O⁺) = ', T('lH'), ', λ(HO⁻) = ', T('lO'), ', λ(Na⁺) = ', T('lN'), ', λ(Cl⁻) = ', T('lC'), '. '];
      const cherche = av => ({ bonne: `La variation de σ par mL versé ${av ? 'avant' : 'après'} l’équivalence, avec son signe (en mS·m⁻¹ par mL)`, faux: ['La conductivité σ au départ (en mS·m⁻¹)', 'La variation de concentration d’un ion par mL versé (en mol·m⁻³ par mL)', 'La quantité d’ions versée par mL (en mmol)'] });
      const calcul = (av, sol, lib) => ({ txt: `${lib} ; chaque mL versé change la concentration de chaque ion de cB × 1 000 / Vt mol·m⁻³ (cB mmol dans Vt mL)`, val: sol, u: 'mS·m⁻¹ par mL' });
      if (q === 0) {
        if (acide) return { tokens, derivees: [{ id: 'dc', nom: 'Variation de concentration d’un ion par mL versé', expr: 'cB × 1 000 / Vt', val: pas, u: 'mol·m⁻³ par mL' }], texte: [...debut, 'De combien σ varie-t-elle par mL de soude versé avant l’équivalence ? (valeur algébrique, négative si σ baisse)'],
          utiles: ['lH', 'lN', 'cB', 'Vt'], raisons: { lO: 'Avant l’équivalence, les ions HO⁻ versés sont consommés aussitôt : il n’y en a pas dans le bécher.', lC: 'Cl⁻ est un ion spectateur : sa quantité ne change pas, il ne modifie pas σ.', cA: 'La concentration de la prise d’essai fixe le volume équivalent, pas la pente.' },
          cherche: cherche(true), manque: null, solution: calcul(true, pas * (5.0 - 35.0), 'Δσ = (λ(Na⁺) − λ(H₃O⁺)) × variation de concentration : Na⁺ apparaît, H₃O⁺ disparaît') };
        return { tokens, derivees: [{ id: 'dc', nom: 'Variation de concentration d’un ion par mL versé', expr: 'cB × 1 000 / Vt', val: pas, u: 'mol·m⁻³ par mL' }], texte: [...debut, 'De combien σ varie-t-elle par mL d’acide versé avant l’équivalence ? (valeur algébrique, négative si σ baisse)'],
          utiles: ['lO', 'lC', 'cB', 'Vt'], raisons: { lH: 'Avant l’équivalence, les ions H₃O⁺ versés sont consommés aussitôt : il n’y en a pas dans le bécher.', lN: 'Na⁺ est un ion spectateur : sa quantité ne change pas, il ne modifie pas σ.', cA: 'La concentration de la prise d’essai fixe le volume équivalent, pas la pente.' },
          cherche: cherche(true), manque: null, solution: calcul(true, pas * (7.6 - 19.9), 'Δσ = (λ(Cl⁻) − λ(HO⁻)) × variation de concentration : Cl⁻ apparaît, HO⁻ disparaît') };
      }
      if (acide) return { tokens, derivees: [], texte: [...debut, 'De combien σ varie-t-elle par mL de soude versé après l’équivalence ?'],
        utiles: ['lN', 'lO', 'cB', 'Vt'], raisons: { lH: 'Après l’équivalence, il ne reste plus de H₃O⁺ : aucun ion H₃O⁺ ne disparaît ni n’apparaît.', lC: 'Cl⁻ est un ion spectateur : sa quantité ne change pas.', cA: 'La concentration de la prise d’essai fixe le volume équivalent, pas la pente.' },
        cherche: cherche(false), manque: null, solution: calcul(false, pas * (5.0 + 19.9), 'Δσ = (λ(Na⁺) + λ(HO⁻)) × variation de concentration : Na⁺ et HO⁻ s’accumulent') };
      return { tokens, derivees: [], texte: [...debut, 'De combien σ varie-t-elle par mL d’acide versé après l’équivalence ?'],
        utiles: ['lH', 'lC', 'cB', 'Vt'], raisons: { lO: 'Après l’équivalence, il ne reste plus de HO⁻ : aucun ion HO⁻ ne disparaît ni n’apparaît.', lN: 'Na⁺ est un ion spectateur : sa quantité ne change pas.', cA: 'La concentration de la prise d’essai fixe le volume équivalent, pas la pente.' },
        cherche: cherche(false), manque: null, solution: calcul(false, pas * (35.0 + 7.6), 'Δσ = (λ(H₃O⁺) + λ(Cl⁻)) × variation de concentration : H₃O⁺ et Cl⁻ s’accumulent') };
    },
  },
  {
    id: 'acd-sapp-faible', domaine: 'Allure d’une courbe de titrage conductimétrique', titre: 'Acide faible ou base faible : volume équivalent et variation de σ avant l’équivalence', noms: ['Volume équivalent', 'Variation de σ par mL versé avant l’équivalence'],
    gen: () => ({ cas: tire(['acide', 'base']), cA: tire([0.020, 0.030, 0.040, 0.050]), VA: tire([10.0, 20.0, 25.0]), cB: tire([0.100, 0.200]), eau: tire([150, 180, 190]) }),
    build: (p, q) => {
      const Vt = p.VA + p.eau, acide = p.cas === 'acide', pas = p.cB * 1000 / Vt;
      const a = acide ? { n: 'd’acide éthanoïque CH₃COOH', tit: 'de la soude (Na⁺ + HO⁻)', l1: 4.1, l2: 5.0, f1: 'CH₃COO⁻', f2: 'Na⁺', ld: 19.9, fd: 'HO⁻', cn: 'Concentration en acide éthanoïque de la prise d’essai', ct: 'Concentration de la soude versée', ap: 'Les ions CH₃COO⁻ et Na⁺' }
        : { n: 'd’ammoniac NH₃', tit: 'de l’acide chlorhydrique (H₃O⁺ + Cl⁻)', l1: 7.4, l2: 7.6, f1: 'NH₄⁺', f2: 'Cl⁻', ld: 35.0, fd: 'H₃O⁺', cn: 'Concentration en ammoniac de la prise d’essai', ct: 'Concentration de l’acide chlorhydrique versé', ap: 'Les ions NH₄⁺ et Cl⁻' };
      const tokens = {
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de la prise d’essai', p.VA, 'mL'),
        cA: tok(`${nb(p.cA, 3)} mol/L`, a.cn, p.cA, 'mol/L'),
        cB: tok(`${nb(p.cB, 3)} mol/L`, a.ct, p.cB, 'mol/L'),
        Vt: tok(`${Vt} mL`, 'Volume de la solution dans le bécher (prise d’essai et eau), supposé constant', Vt, 'mL'),
        l1: tok(`${nb(a.l1, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${a.f1} à 25 °C`, a.l1, 'mS·m²·mol⁻¹'),
        l2: tok(`${nb(a.l2, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${a.f2} à 25 °C`, a.l2, 'mS·m²·mol⁻¹'),
        ld: tok(`${nb(a.ld, 1)} mS·m²·mol⁻¹`, `Conductivité ionique molaire de ${a.fd} à 25 °C`, a.ld, 'mS·m²·mol⁻¹'),
      };
      const debut = ['On titre ', T('VA'), ' ', a.n, ' (', T('cA'), ') par ', a.tit, ' à ', T('cB'), ', en suivant la conductivité. Le bécher contient ', T('Vt'), ' de solution, volume supposé constant ; les ions présents au départ sont négligés. Données : λ(', a.f1, ') = ', T('l1'), ', λ(', a.f2, ') = ', T('l2'), ', λ(', a.fd, ') = ', T('ld'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel volume de titrant faut-il verser pour atteindre l’équivalence ?'],
        utiles: ['VA', 'cA', 'cB'], raisons: { Vt: 'Le volume de la solution dilue les ions mais ne change pas leur quantité : il ne sert pas au calcul du volume équivalent.', l1: 'Les conductivités ioniques servent à prévoir l’allure de la courbe, pas à calculer le volume équivalent.', l2: 'Les conductivités ioniques servent à prévoir l’allure de la courbe, pas à calculer le volume équivalent.', ld: 'Les conductivités ioniques servent à prévoir l’allure de la courbe, pas à calculer le volume équivalent.' },
        cherche: { bonne: 'Le volume équivalent VE (en mL)', faux: ['La quantité de matière à doser (en mmol)', 'La concentration après dilution (en mol/L)', 'La variation de σ par mL versé (en mS·m⁻¹ par mL)'] },
        manque: null, solution: { txt: 'cB × VE = cA × VA (une mole de titrant pour une mole d’espèce titrée), donc VE = cA × VA / cB', val: p.cA * p.VA / p.cB, u: 'mL' } };
      return { tokens, derivees: [{ id: 'dc', nom: 'Variation de concentration d’un ion par mL versé', expr: 'cB × 1 000 / Vt', val: pas, u: 'mol·m⁻³ par mL' }], texte: [...debut, 'De combien σ augmente-t-elle par mL versé avant l’équivalence ?'],
        utiles: ['l1', 'l2', 'cB', 'Vt'], raisons: { ld: `Avant l’équivalence, ${a.fd} est consommé dès qu’il est versé ou n’existe pas dans le bécher : il n’intervient pas.`, cA: 'La concentration de la prise d’essai fixe le volume équivalent, pas la pente.', VA: 'Le volume de la prise d’essai fixe le volume équivalent, pas la pente.' },
        cherche: { bonne: 'La variation de σ par mL versé avant l’équivalence (en mS·m⁻¹ par mL)', faux: ['La conductivité σ à l’équivalence (en mS·m⁻¹)', 'La variation de concentration d’un ion par mL versé (en mol·m⁻³ par mL)', 'Le volume équivalent (en mL)'] },
        manque: null, solution: { txt: `${a.ap} apparaissent, rien ne disparaît côté ions : Δσ = (λ(${a.f1}) + λ(${a.f2})) × cB × 1 000 / Vt`, val: (a.l1 + a.l2) * pas, u: 'mS·m⁻¹ par mL' } };
    },
  },
  {
    id: 'cet-sapp-dilution', domaine: 'Dosage par étalonnage conductimétrique', titre: 'Dosage par étalonnage : facteur de dilution et concentration de la solution à doser', noms: ['Facteur de dilution de la solution à doser', 'Concentration de la solution à doser'],
    gen: () => { const [Vp, Vf] = tire([[10, 100], [25, 250], [5, 100], [10, 200], [25, 500], [20, 500], [10, 250], [5, 250], [10, 500]]); return { Vp, Vf, a: tire([0.100, 0.120, 0.150, 0.180, 0.240]), cD: tire([3.5, 4.5, 5.5, 6.5, 7.5]), k: tire([50, 80, 100, 150]), sel: tire(['nitrate de sodium (Na⁺ + NO₃⁻)', 'chlorure de sodium (Na⁺ + Cl⁻)', 'éthanoate de sodium (CH₃COO⁻ + Na⁺)']) }; },
    build: (p, q) => {
      const F = p.Vf / p.Vp, G = Number((p.a * p.cD).toPrecision(3)), cL = G / p.a;
      const tokens = {
        Vp: tok(`${nb(p.Vp, 1)} mL`, 'Volume de la solution à doser prélevé à la pipette', p.Vp, 'mL'),
        Vf: tok(`${nb(p.Vf, 1)} mL`, 'Volume de la fiole jaugée utilisée pour la dilution', p.Vf, 'mL'),
        a: tok(`${nb(p.a, 3)} mS par mmol/L`, 'Coefficient directeur de la droite d’étalonnage G = a × c', p.a, 'mS par mmol/L'),
        G: tok(`${nb(G, 3)} mS`, 'Conductance mesurée pour la solution diluée', G, 'mS'),
        k: tok(`${p.k} m⁻¹`, 'Constante de la cellule de conductimétrie', p.k, 'm⁻¹'),
        T: tok('25 °C', 'Température des étalons et de la solution mesurée', 25, '°C'),
      };
      const debut = ['On dose une solution X de ', p.sel, ' par étalonnage conductimétrique. On prélève ', T('Vp'), ' de X à la pipette jaugée, qu’on complète avec de l’eau distillée dans une fiole jaugée de ', T('Vf'), ' (solution diluée X′). Étalons et solution X′ sont mesurés à ', T('T'), ' avec la même cellule, de constante ', T('k'), '. La droite d’étalonnage a pour coefficient directeur ', T('a'), ' ; la solution X′ donne une conductance ', T('G'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le facteur de dilution F de la solution à doser ?'],
        utiles: ['Vp', 'Vf'], raisons: { a: 'Le coefficient directeur sert à lire la concentration sur la droite, pas à calculer le facteur de dilution.', G: 'La conductance sert à lire la concentration de X′, pas à calculer F.', k: 'La constante de cellule est déjà contenue dans le coefficient directeur a.', T: 'La température est la même pour tous : elle n’intervient pas dans le calcul de F.' },
        cherche: { bonne: 'Le facteur de dilution F (sans unité)', faux: ['La concentration de la solution diluée X′ (en mmol/L)', 'Le volume d’eau ajouté dans la fiole (en mL)', 'La concentration de la solution à doser X (en mmol/L)'] },
        manque: null, solution: { txt: 'F = frac(Vf|Vp)', val: F, u: '' } };
      return { tokens, derivees: [{ id: 'F', nom: 'Facteur de dilution', expr: 'frac(Vf|Vp)', val: F, u: '' }, { id: 'cD', nom: 'Concentration de la solution diluée X′ lue sur la droite', expr: 'G / a', val: cL, u: 'mmol/L' }], texte: [...debut, 'Quelle est la concentration de la solution à doser X (en mmol/L) ?'],
        utiles: ['Vp', 'Vf', 'a', 'G'], raisons: { k: 'La constante de cellule est déjà contenue dans le coefficient directeur a : on n’en a pas besoin.', T: 'La température est la même pour tous : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'La concentration de la solution à doser X (en mmol/L)', faux: ['La concentration de la solution diluée X′ (en mmol/L)', 'Le facteur de dilution (sans unité)', 'La constante de cellule (en m⁻¹)'] },
        manque: null, solution: { txt: 'c(X′) = frac(G|a), puis c(X) = F × c(X′) avec F = frac(Vf|Vp)', val: F * cL, u: 'mmol/L' } };
    },
  },
  {
    id: 'cet-sapp-gamme', domaine: 'Dosage par étalonnage conductimétrique', titre: 'Préparer un étalon par dilution et en déduire le coefficient directeur', noms: ['Concentration de l’étalon', 'Coefficient directeur de la droite d’étalonnage'],
    gen: () => { const c0 = tire([50, 100, 200]), Vf = tire([100, 200, 250]); const cands = [2, 4, 5, 8, 10].filter(c => { const v = c * Vf / c0; return v >= 1 && v <= 50 && Math.abs(v * 10 - Math.round(v * 10)) < 1e-9; }); const c = tire(cands.length ? cands : [4]); return { c0, Vf, c, Vp: c * Vf / c0, k: tire([50, 80, 100, 150]), Sl: tire([12.1, 12.6]) }; },
    build: (p, q) => {
      const G = Number((p.Sl * p.c / p.k * (1 - 0.002 * p.c)).toPrecision(3)), a = G / p.c;
      const tokens = {
        c0: tok(`${p.c0} mmol/L`, 'Concentration de la solution mère', p.c0, 'mmol/L'),
        Vp: tok(`${nb(p.Vp, 1)} mL`, 'Volume de solution mère prélevé à la pipette', p.Vp, 'mL'),
        Vf: tok(`${nb(p.Vf, 1)} mL`, 'Volume de la fiole jaugée', p.Vf, 'mL'),
        G: tok(`${nb(G, 3)} mS`, 'Conductance mesurée pour cet étalon', G, 'mS'),
        k: tok(`${p.k} m⁻¹`, 'Constante de la cellule de conductimétrie', p.k, 'm⁻¹'),
        T: tok('25 °C', 'Température de la mesure', 25, '°C'),
      };
      const debut = ['Pour étalonner une cellule de conductimétrie, on prélève ', T('Vp'), ' d’une solution mère à ', T('c0'), ' qu’on complète avec de l’eau distillée dans une fiole jaugée de ', T('Vf'), '. La mesure à ', T('T'), ', avec une cellule de constante ', T('k'), ', donne une conductance ', T('G'), ' pour cet étalon. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration de l’étalon préparé (en mmol/L) ?'],
        utiles: ['c0', 'Vp', 'Vf'], raisons: { G: 'La conductance est une mesure faite sur l’étalon : elle ne sert pas à calculer sa concentration par dilution.', k: 'La constante de cellule relie G à la conductivité, pas la concentration au protocole de dilution.', T: 'La température n’intervient pas dans le calcul d’une dilution.' },
        cherche: { bonne: 'La concentration de l’étalon (en mmol/L)', faux: ['Le facteur de dilution (sans unité)', 'La conductivité de l’étalon (en mS·m⁻¹)', 'La quantité de matière prélevée (en µmol)'] },
        manque: null, solution: { txt: 'c₀ × Vp = c × Vf, donc c = frac(c₀ × Vp|Vf)', val: p.c, u: 'mmol/L' } };
      return { tokens, derivees: [{ id: 'c', nom: 'Concentration de l’étalon', expr: 'frac(c₀ × Vp|Vf)', val: p.c, u: 'mmol/L' }], texte: [...debut, 'Quel est le coefficient directeur a de la droite d’étalonnage G = a × c (en mS par mmol/L), en supposant que la droite passe par l’origine ?'],
        utiles: ['c0', 'Vp', 'Vf', 'G'], raisons: { k: 'La constante de cellule est déjà incluse dans la conductance mesurée : le coefficient directeur se calcule directement avec G et c.', T: 'La température est la même pour tous les points : elle n’intervient pas dans le calcul de a.' },
        cherche: { bonne: 'Le coefficient directeur a de la droite d’étalonnage (en mS par mmol/L)', faux: ['La concentration de l’étalon (en mmol/L)', 'La conductivité de l’étalon (en mS·m⁻¹)', 'La constante de cellule (en m⁻¹)'] },
        manque: null, solution: { txt: 'a = frac(G|c) : la droite passe par l’origine et par le point de l’étalon', val: a, u: 'mS par mmol/L' } };
    },
  },
  {
    id: 'nrn-sapp-nernst', domaine: 'Potentiel et relation de Nernst', titre: 'Demi-pile métallique : potentiel du couple et concentration inconnue', noms: ['Potentiel du couple', 'Concentration de la solution'],
    gen: () => ({ id: tire(['cu', 'zn', 'ag']), c: tire([0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5]), V: tire([50, 100, 200]) }),
    build: (p, q) => {
      const D = { cu: { ox: 'Cu²⁺', m: 'cuivre', E0: 0.34, n: 2, demi: 'Cu²⁺ + 2 e⁻ = Cu' }, zn: { ox: 'Zn²⁺', m: 'zinc', E0: -0.76, n: 2, demi: 'Zn²⁺ + 2 e⁻ = Zn' }, ag: { ox: 'Ag⁺', m: 'argent', E0: 0.80, n: 1, demi: 'Ag⁺ + e⁻ = Ag' } }[p.id];
      const lg = Math.log10(p.c), E = D.E0 + 0.06 / D.n * lg, Em = Number(E.toFixed(3)), lgM = (Em - D.E0) * D.n / 0.06, cM = Math.pow(10, lgM);
      const tokens = {
        c: tok(`${sciR(p.c)} mol/L`, `Concentration en ${D.ox} de la solution`, p.c, 'mol/L'),
        Em: tok(`${sg(Em)} V`, 'Tension à vide mesurée entre l’ESH et la demi-pile', Em, 'V'),
        E0: tok(`${sg(D.E0)} V`, `Potentiel standard du couple ${D.ox} / ${D.m === 'cuivre' ? 'Cu' : D.m === 'zinc' ? 'Zn' : 'Ag'}`, D.E0, 'V'),
        n: tok(`${D.n} électron${D.n > 1 ? 's' : ''}`, `Nombre d’électrons de la demi-équation ${D.demi}`, D.n, ''),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
        V: tok(`${p.V} mL`, 'Volume de solution dans le bécher', p.V, 'mL'),
      };
      const debut = ['Une lame de ', D.m, ' plonge dans une solution contenant des ions ', D.ox, '. On l’associe à l’électrode standard à hydrogène (ESH) par un pont salin et on mesure la tension à vide. Demi-équation : ', D.demi, ' ; potentiel standard ', T('E0'), ' ; température ', T('T'), ' ; volume de solution ', T('V'), '. '];
      if (q === 0) return { tokens: { c: tokens.c, E0: tokens.E0, n: tokens.n, T: tokens.T, V: tokens.V }, derivees: [{ id: 'lg', nom: `Logarithme décimal de la concentration en ${D.ox}`, expr: 'log c', val: lg, u: '' }], texte: [...debut, 'La concentration en ', D.ox, ' est ', T('c'), ' (nombre d’électrons : ', T('n'), '). Quel est le potentiel du couple (en V) ?'],
        utiles: ['c', 'E0', 'n'], raisons: { T: 'La température fixe le coefficient 0,06 de la relation de Nernst, mais n’est pas une donnée du calcul.', V: 'Le volume de solution n’intervient pas dans le potentiel : E dépend des concentrations, pas des quantités.' },
        cherche: { bonne: 'Le potentiel E du couple (en V)', faux: ['La tension aux bornes d’une pile (en V) lorsqu’elle débite', 'Le potentiel standard du couple (en V)', 'La concentration de la solution (en mol/L)'] },
        manque: null, solution: { txt: 'E = E° + (frac(0,06|n)) × log c (le métal solide vaut 1)', val: E, u: 'V' } };
      return { tokens: { Em: tokens.Em, E0: tokens.E0, n: tokens.n, T: tokens.T, V: tokens.V }, derivees: [{ id: 'lg', nom: `Logarithme décimal de la concentration en ${D.ox}`, expr: 'frac((E − E°) × n|0,06)', val: lgM, u: '' }], texte: [...debut, 'La tension mesurée vaut ', T('Em'), ' (nombre d’électrons : ', T('n'), '). Quelle est la concentration en ', D.ox, ' de la solution (en mol/L) ?'],
        utiles: ['Em', 'E0', 'n'], raisons: { T: 'La température fixe le coefficient 0,06 de la relation de Nernst, mais n’est pas une donnée du calcul.', V: 'Le volume de solution n’intervient pas : E dépend de la concentration, pas du volume.' },
        cherche: { bonne: `La concentration en ${D.ox} (en mol/L)`, faux: ['Le logarithme de la concentration (sans unité)', 'Le potentiel standard du couple (en V)', 'La quantité de matière d’ions dans le bécher (en mmol)'] },
        manque: null, solution: { txt: 'log c = frac((E − E°) × n|0,06), puis c = 10^(log c)', val: cM, u: 'mol/L' } };
    },
  },
  {
    id: 'nrn-sapp-fer', domaine: 'Potentiel et relation de Nernst', titre: 'Couple Fe³⁺ / Fe²⁺ : potentiel et rapport des concentrations', noms: ['Potentiel du couple', 'Rapport des concentrations'],
    gen: () => { const cr = tire([0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1]), r = tire([0.1, 0.2, 0.5, 2, 5, 10, 20, 50]); return { cRed: cr, ratio: r, S: tire([1.0, 2.0, 4.0]) }; },
    build: (p, q) => {
      const E0 = 0.77, cOx = p.cRed * p.ratio, E = E0 + 0.06 * Math.log10(p.ratio), Em = Number(E.toFixed(3)), rM = Math.pow(10, (Em - E0) / 0.06);
      const tokens = {
        cOx: tok(`${sciR(cOx)} mol/L`, 'Concentration en Fe³⁺', cOx, 'mol/L'),
        cRed: tok(`${sciR(p.cRed)} mol/L`, 'Concentration en Fe²⁺', p.cRed, 'mol/L'),
        Em: tok(`${sg(Em)} V`, 'Tension à vide mesurée entre l’ESH et la demi-pile', Em, 'V'),
        E0: tok('0,77 V', 'Potentiel standard du couple Fe³⁺ / Fe²⁺', E0, 'V'),
        n: tok('1 électron', 'Nombre d’électrons de la demi-équation Fe³⁺ + e⁻ = Fe²⁺', 1, ''),
        S: tok(`${nb(p.S, 1)} cm²`, 'Surface de l’électrode de platine', p.S, 'cm²'),
      };
      const debut = ['Une électrode de platine plonge dans une solution contenant les ions Fe³⁺ et Fe²⁺ ; on l’associe à l’électrode standard à hydrogène (ESH) par un pont salin et on mesure la tension à vide à 25 °C. Demi-équation : Fe³⁺ + e⁻ = Fe²⁺ (', T('n'), ') ; potentiel standard ', T('E0'), ' ; électrode de surface ', T('S'), '. '];
      if (q === 0) return { tokens: { cOx: tokens.cOx, cRed: tokens.cRed, E0: tokens.E0, n: tokens.n, S: tokens.S }, derivees: [{ id: 'r', nom: 'Rapport [Fe³⁺] / [Fe²⁺]', expr: '[Fe³⁺] / [Fe²⁺]', val: p.ratio, u: '' }], texte: [...debut, 'La solution contient [Fe³⁺] = ', T('cOx'), ' et [Fe²⁺] = ', T('cRed'), '. Quel est le potentiel du couple (en V) ?'],
        utiles: ['cOx', 'cRed', 'E0', 'n'], raisons: { S: 'La surface de l’électrode n’intervient pas : à vide, aucun courant ne passe et E ne dépend que des concentrations.' },
        cherche: { bonne: 'Le potentiel E du couple (en V)', faux: ['La différence entre les concentrations des deux ions (en mol/L)', 'Le potentiel standard du couple (en V)', 'L’intensité du courant à vide (en mA)'] },
        manque: null, solution: { txt: 'E = E° + (frac(0,06|n)) × log([Fe³⁺] / [Fe²⁺])', val: E, u: 'V' } };
      return { tokens: { Em: tokens.Em, E0: tokens.E0, n: tokens.n, S: tokens.S }, derivees: [{ id: 'lr', nom: 'Logarithme décimal du rapport', expr: 'frac((E − E°) × n|0,06)', val: (Em - E0) / 0.06, u: '' }], texte: [...debut, 'La tension mesurée vaut ', T('Em'), '. Quel est le rapport [Fe³⁺] / [Fe²⁺] dans la solution (sans unité) ?'],
        utiles: ['Em', 'E0', 'n'], raisons: { S: 'La surface de l’électrode n’intervient pas : à vide, aucun courant ne passe et E ne dépend que des concentrations.' },
        cherche: { bonne: 'Le rapport [Fe³⁺] / [Fe²⁺] (sans unité)', faux: ['Le logarithme de ce rapport (sans unité)', 'La concentration en Fe³⁺ (en mol/L)', 'Le potentiel standard du couple (en V)'] },
        manque: null, solution: { txt: 'log([Fe³⁺] / [Fe²⁺]) = frac((E − E°) × n|0,06), puis le rapport = 10^(ce logarithme)', val: rM, u: '' } };
    },
  },
  {
    id: 'sev-sapp-k', domaine: 'Sens d’évolution en oxydo-réduction', titre: 'Constante d’équilibre d’une réaction d’oxydo-réduction : log K et écart de potentiels', noms: ['Constante d’équilibre de la réaction', 'Écart de potentiels standards'],
    gen: () => { const [a, b] = tire(SEV.PAIRES); return { a, b, V: tire([50, 100, 200]) }; },
    build: (p, q) => {
      const P = SEV.paire(p.a, p.b), lkM = Number(P.logK.toFixed(1)), dE = lkM * 0.06 / P.N;
      const tokens = {
        E1: tok(`${sg(P.ox1.E0)} V`, `Potentiel standard du couple ${P.ox1.nom} (le plus grand)`, P.ox1.E0, 'V'),
        E2: tok(`${sg(P.red2.E0)} V`, `Potentiel standard du couple ${P.red2.nom}`, P.red2.E0, 'V'),
        n1: tok(`${P.ox1.n} électron${P.ox1.n > 1 ? 's' : ''}`, `Nombre d’électrons de la demi-équation du couple ${P.ox1.nom}`, P.ox1.n, ''),
        n2: tok(`${P.red2.n} électron${P.red2.n > 1 ? 's' : ''}`, `Nombre d’électrons de la demi-équation du couple ${P.red2.nom}`, P.red2.n, ''),
        lk: tok(nb(lkM, 1), 'Logarithme décimal de la constante d’équilibre de la réaction', lkM, ''),
        N: tok(`${P.N} électron${P.N > 1 ? 's' : ''}`, 'Nombre d’électrons échangés dans l’équation écrite', P.N, ''),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
        V: tok(`${p.V} mL`, 'Volume de solution dans le bécher', p.V, 'mL'),
      };
      const debut = [`Dans un bécher de `, T('V'), `, à `, T('T'), `, on met en présence les couples ${P.ox1.nom} (potentiel standard `, T('E1'), `, `, T('n1'), `) et ${P.red2.nom} (potentiel standard `, T('E2'), `, `, T('n2'), `). La réaction spontanée s’écrit ${SEV.equationTexte(P, false)}. `];
      if (q === 0) return { tokens: { E1: tokens.E1, E2: tokens.E2, n1: tokens.n1, n2: tokens.n2, T: tokens.T, V: tokens.V }, derivees: [{ id: 'N', nom: 'Nombre d’électrons échangés dans l’équation écrite', expr: 'ppcm(n₁, n₂)', val: P.N, u: '' }], texte: [...debut, 'Quel est le logarithme décimal log K de la constante d’équilibre de cette réaction (sans unité) ?'],
        utiles: ['E1', 'E2', 'n1', 'n2'], raisons: { T: 'La température fixe le coefficient 0,06 de la relation, mais n’est pas une donnée du calcul.', V: 'Le volume de solution n’intervient pas : K ne dépend que des potentiels standards et de l’équation.' },
        cherche: { bonne: 'Le logarithme décimal de la constante d’équilibre (sans unité)', faux: ['Le quotient de réaction à l’état initial (sans unité)', 'Le potentiel d’un couple dans la solution (en V)', 'La quantité d’électrons échangés (en mmol)'] },
        manque: null, solution: { txt: 'N = ppcm(n₁, n₂) ; log K = frac(N × (E°₁ − E°₂)|0,06)', val: P.logK, u: '' } };
      return { tokens: { lk: tokens.lk, N: tokens.N, T: tokens.T, V: tokens.V }, derivees: [{ id: 'lk0', nom: 'Produit de log K par 0,06', expr: 'log K × 0,06', val: lkM * 0.06, u: '' }], texte: [`Dans un bécher de `, T('V'), `, à `, T('T'), `, la réaction ${SEV.equationTexte(P, false)} (`, T('N'), ` échangés) a pour logarithme de constante d’équilibre log K = `, T('lk'), `. Quel est l’écart E°₁ − E°₂ entre les potentiels standards des deux couples (en V) ?`],
        utiles: ['lk', 'N'], raisons: { T: 'La température fixe le coefficient 0,06 de la relation, mais n’est pas une donnée du calcul.', V: 'Le volume de solution n’intervient pas : K ne dépend que des potentiels et de l’équation.' },
        cherche: { bonne: 'L’écart des potentiels standards E°₁ − E°₂ (en V)', faux: ['La constante d’équilibre K (sans unité)', 'Le potentiel d’un couple dans la solution (en V)', 'Le nombre d’électrons échangés (sans unité)'] },
        manque: null, solution: { txt: 'E°₁ − E°₂ = 0,06 × frac(log K|N)', val: dE, u: 'V' } };
    },
  },
  {
    id: 'sev-sapp-qr', domaine: 'Sens d’évolution en oxydo-réduction', titre: 'Quotient de réaction et écart des potentiels de Nernst', noms: ['Quotient de réaction', 'Écart des potentiels des deux couples'],
    gen: () => {
      for (let k = 0; ; k++) {
        const [a, b] = tire(SEV.PAIRES), P = SEV.paire(a, b), c = {}; for (const e of P.dissoutes) c[e] = tire([0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5]);
        const lkM = Number(P.logK.toFixed(1)), lq = SEV.logQ(P, c), val = 0.06 / P.N * (lkM - Math.log10(Number(Math.pow(10, lq).toPrecision(2))));
        if ((Math.abs(val) >= 0.03 && Math.abs(lq - lkM) >= 0.4) || k > 200) return { a, b, c, V: tire([50, 100, 200]) };
      }
    },
    build: (p, q) => {
      const P = SEV.paire(p.a, p.b), lkM = Number(P.logK.toFixed(1)), lq = SEV.logQ(P, p.c), QrM = Number(Math.pow(10, lq).toPrecision(2)), dE = 0.06 / P.N * (lkM - Math.log10(QrM));
      const tokens = {
        lk: tok(nb(lkM, 1), 'Logarithme décimal de la constante d’équilibre de la réaction', lkM, ''),
        N: tok(`${P.N} électron${P.N > 1 ? 's' : ''}`, 'Nombre d’électrons échangés dans l’équation écrite', P.N, ''),
        Qr: tok(nb(QrM), 'Quotient de réaction du système', QrM, ''),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
        V: tok(`${p.V} mL`, 'Volume de solution dans le bécher', p.V, 'mL'),
      };
      P.dissoutes.forEach((e, i) => { tokens['c' + i] = tok(`${sciR(p.c[e])} mol/L`, `Concentration en ${e}`, p.c[e], 'mol/L'); });
      const ids = P.dissoutes.map((e, i) => 'c' + i), concTxt = P.dissoutes.flatMap((e, i) => [i ? ', ' : '', `[${e}] = `, T('c' + i)]).filter(x => x !== '');
      const solides = P.solides.length ? ` (${P.solides.join(' et ')} solide${P.solides.length > 1 ? 's' : ''}, en excès)` : '';
      const debut = [`Dans un bécher de `, T('V'), `, à `, T('T'), `, la réaction ${SEV.equationTexte(P, false)}${solides} a pour constante d’équilibre log K = `, T('lk'), ` (`, T('N'), ` échangés). `];
      if (q === 0) return { tokens: Object.fromEntries([...ids, 'T', 'V'].map(i => [i, tokens[i]])), derivees: [{ id: 'lq', nom: 'Logarithme décimal du quotient de réaction', expr: 'log Qr', val: lq, u: '' }], texte: [`Dans un bécher de `, T('V'), `, à `, T('T'), `, on étudie ${SEV.equationTexte(P, false)}${solides}. La solution contient `, ...concTxt, `. Quel est le quotient de réaction Qr de ce système (sans unité) ?`],
        utiles: ids, raisons: { T: 'La température n’intervient pas dans le calcul d’un quotient de réaction.', V: 'Le volume de solution n’intervient pas : Qr se calcule avec les concentrations.' },
        cherche: { bonne: 'Le quotient de réaction Qr (sans unité)', faux: ['La constante d’équilibre K (sans unité)', 'La quantité d’ions dans le bécher (en mmol)', 'Le potentiel d’un couple dans la solution (en V)'] },
        manque: null, solution: { txt: 'Qr = [produits]^coef / [réactifs]^coef (les solides valent 1)', val: Math.pow(10, lq), u: '' } };
      return { tokens: { lk: tokens.lk, N: tokens.N, Qr: tokens.Qr, T: tokens.T, V: tokens.V }, derivees: [{ id: 'rap', nom: 'Logarithme décimal de K / Qr', expr: 'log K − log Qr', val: lkM - Math.log10(QrM), u: '' }], texte: [...debut, `Le quotient de réaction du système vaut Qr = `, T('Qr'), `. Quelle est la différence E₁ − E₂ entre les potentiels de Nernst des deux couples (en V, avec son signe) ?`],
        utiles: ['lk', 'N', 'Qr'], raisons: { T: 'La température fixe le coefficient 0,06 de la relation, mais n’est pas une donnée du calcul.', V: 'Le volume de solution n’intervient pas : E₁ − E₂ dépend de K et de Qr.' },
        cherche: { bonne: 'La différence E₁ − E₂ des potentiels de Nernst (en V)', faux: ['La constante d’équilibre K (sans unité)', 'Le potentiel standard d’un couple (en V)', 'Le rapport frac(Qr|K) (sans unité)'] },
        manque: null, solution: { txt: 'E₁ − E₂ = (frac(0,06|N)) × log(frac(K|Qr))', val: dE, u: 'V' } };
    },
  },
  // ───────────────────────────── Équations d'oxydo-réduction en milieu acide ou basique (TSTL, sim 294)
  {
    id: 'mab-sapp-electrons', domaine: 'Équations en milieu acide ou basique', titre: 'Demi-équation : bilan des charges pour trouver les électrons ou les ions H⁺', noms: ['Nombre d’électrons de la demi-équation', 'Nombre d’ions H⁺ de la demi-équation'],
    gen: () => ({ c: tire(MAB.COUPLES_SAPP), V: tire([50, 100, 200]) }),
    build: (p, q) => {
      const d = MAB.demiEquation(p.c), st = d.stades.find(x => x.cle === 'hydrogene'), cOx = d.a * MAB.ESPECES[d.ox].q, cRed = d.b * MAB.ESPECES[d.red].q, h = d.h, w = d.w, n = d.n;
      const ch = x => (x > 0 ? `+${x}` : x < 0 ? `−${Math.abs(x)}` : '0');
      const tokens = {
        cOx: tok(ch(cOx), `Charge totale de l’oxydant ${MAB.texte(d.ox)} écrit à gauche`, cOx, ''),
        cRed: tok(ch(cRed), `Charge totale du réducteur ${MAB.texte(d.red)} écrit à droite`, cRed, ''),
        h: tok(`${h} ions H⁺`, 'Nombre d’ions H⁺ écrits à gauche', h, ''),
        w: tok(`${w} molécules H₂O`, 'Nombre de molécules d’eau écrites', w, ''),
        n: tok(`${n} électrons`, 'Nombre d’électrons de la demi-équation', n, ''),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
      };
      const debut = [`Dans un bécher de `, T('V'), `, à `, T('T'), `, on établit en milieu acide la demi-équation du couple ${MAB.coupleTxt(p.c)}. Après équilibrage de O avec H₂O et de H avec H⁺, on a écrit ${MAB.membre(st.gauche)} = ${MAB.membre(st.droite)} : les charges ne sont pas encore équilibrées. L’oxydant porte la charge totale `, T('cOx'), `, le réducteur `, T('cRed'), `, il y a `, T('h'), ` et `, T('w'), `. `];
      const raisons = { T: 'La température n’intervient pas dans un bilan de charges.', V: 'Le volume de solution n’intervient pas dans l’équation d’une demi-réaction.', w: 'Les molécules d’eau sont neutres : elles ne changent pas la charge totale.' };
      if (q === 0) return { tokens: { cOx: tokens.cOx, cRed: tokens.cRed, h: tokens.h, w: tokens.w, T: tokens.T, V: tokens.V }, derivees: [{ id: 'cg', nom: 'Charge totale du membre de gauche avant ajout des électrons', expr: 'charge de l’oxydant + nombre de H⁺', val: cOx + h, u: '' }], texte: [...debut, 'Combien d’électrons faut-il ajouter à gauche ?'],
        utiles: ['cOx', 'cRed', 'h'], raisons: { T: raisons.T, V: raisons.V, w: raisons.w },
        cherche: { bonne: 'Le nombre d’électrons à ajouter (sans unité)', faux: ['Le nombre de molécules d’eau à ajouter (sans unité)', 'La charge totale de l’équation finale (sans unité)', 'La quantité d’ions H⁺ dans le bécher (en mmol)'] },
        manque: null, solution: { txt: 'n = (charge de l’oxydant + nombre de H⁺) − charge du réducteur', val: n, u: '' } };
      return { tokens: { cOx: tokens.cOx, cRed: tokens.cRed, n: tokens.n, w: tokens.w, T: tokens.T, V: tokens.V }, derivees: [{ id: 'cd', nom: 'Charge du membre de droite (égale à celle de gauche après ajout des électrons)', expr: 'charge du réducteur', val: cRed, u: '' }],
        texte: [`Dans un bécher de `, T('V'), `, à `, T('T'), `, on établit en milieu acide la demi-équation du couple ${MAB.coupleTxt(p.c)} : ${MAB.membre(d.stades.find(x => x.cle === 'oxygene').gauche)} + ... H⁺ + `, T('n'), ` = ${MAB.membre(d.stades.find(x => x.cle === 'oxygene').droite)}. L’oxydant porte la charge totale `, T('cOx'), `, le réducteur `, T('cRed'), `, et la demi-équation compte `, T('w'), `. Combien d’ions H⁺ faut-il écrire à gauche pour que les charges soient égales ?`],
        utiles: ['cOx', 'cRed', 'n'], raisons: { T: raisons.T, V: raisons.V, w: raisons.w },
        cherche: { bonne: 'Le nombre d’ions H⁺ à écrire à gauche (sans unité)', faux: ['Le nombre d’électrons de la demi-équation (sans unité)', 'Le nombre de molécules d’eau à droite (sans unité)', 'La concentration en ions H⁺ de la solution (en mol/L)'] },
        manque: null, solution: { txt: 'nombre de H⁺ = charge du réducteur + n − charge de l’oxydant', val: h, u: '' } };
    },
  },
  {
    id: 'mab-sapp-basique', domaine: 'Équations en milieu acide ou basique', titre: 'Demi-équation en milieu basique : nombre de HO⁻ et de H₂O', noms: ['Nombre d’ions HO⁻ de la demi-équation en milieu basique', 'Nombre de molécules H₂O de la demi-équation en milieu basique'],
    gen: () => ({ c: tire(MAB.COUPLES_BASIQUE), V: tire([50, 100, 200]) }),
    build: (p, q) => {
      const d = MAB.demiEquation(p.c), h = d.k, w = MAB.coefDe(d.acide.droite, 'H2O') + MAB.coefDe(d.acide.gauche, 'H2O'), net = h - w, n = d.n;
      const tokens = {
        h: tok(`${h} ions H⁺`, 'Nombre d’ions H⁺ de la demi-équation écrite en milieu acide', h, ''),
        w: tok(w ? `${w} molécules H₂O` : 'aucune molécule H₂O', 'Nombre de molécules d’eau de la demi-équation écrite en milieu acide (côté droit)', w, ''),
        n: tok(`${n} électrons`, 'Nombre d’électrons de la demi-équation', n, ''),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
      };
      const debut = [`Dans un bécher de `, T('V'), `, à `, T('T'), `, la demi-équation du couple ${MAB.coupleTxt(p.c)} s’écrit en milieu acide ${MAB.demiTxt(d, 'acide')}, avec `, T('h'), `, `, T('w'), ` et `, T('n'), `. On la réécrit en milieu basique : on ajoute des ions HO⁻ des deux côtés, H⁺ + HO⁻ donne H₂O, puis on simplifie. `];
      const raisons = { T: 'La température n’intervient pas dans l’écriture d’une demi-équation.', V: 'Le volume de solution n’intervient pas dans l’écriture d’une demi-équation.', n: 'Le nombre d’électrons ne change pas quand on passe du milieu acide au milieu basique.' };
      if (q === 0) return { tokens: { h: tokens.h, w: tokens.w, n: tokens.n, T: tokens.T, V: tokens.V }, derivees: [{ id: 'oh', nom: 'Nombre d’ions HO⁻ ajoutés des deux côtés', expr: 'nombre de H⁺', val: h, u: '' }], texte: [...debut, 'Combien d’ions HO⁻ la demi-équation en milieu basique compte-t-elle (après simplification) ?'],
        utiles: ['h'], raisons: { T: raisons.T, V: raisons.V, n: raisons.n, w: 'Le nombre de molécules d’eau change le nombre de H₂O après simplification, mais pas celui des ions HO⁻.' },
        cherche: { bonne: 'Le nombre d’ions HO⁻ de la demi-équation en milieu basique (sans unité)', faux: ['Le nombre d’ions H⁺ restant en milieu basique (sans unité)', 'La concentration en HO⁻ de la solution (en mol/L)', 'Le nombre de molécules d’eau en milieu basique (sans unité)'] },
        manque: null, solution: { txt: 'on ajoute autant de HO⁻ que de H⁺ : nombre de HO⁻ = nombre de H⁺', val: h, u: '' } };
      return { tokens: { h: tokens.h, w: tokens.w, n: tokens.n, T: tokens.T, V: tokens.V }, derivees: [{ id: 'eau', nom: 'Molécules H₂O formées par H⁺ + HO⁻', expr: 'nombre de H⁺', val: h, u: '' }], texte: [...debut, 'Combien de molécules H₂O reste-t-il dans la demi-équation en milieu basique, après simplification ?'],
        utiles: ['h', 'w'], raisons: { T: raisons.T, V: raisons.V, n: raisons.n },
        cherche: { bonne: 'Le nombre de molécules H₂O après simplification (sans unité)', faux: ['Le nombre d’ions HO⁻ de la demi-équation (sans unité)', 'Le nombre de molécules H₂O formées avant simplification (sans unité)', 'La masse d’eau dans le bécher (en g)'] },
        manque: null, solution: { txt: 'H₂O restantes = nombre de H⁺ − nombre de H₂O du milieu acide', val: net, u: '' } };
    },
  },
  {
    id: 'tpt-sapp-derivee', domaine: 'Titrage potentiométrique', titre: 'Titrage potentiométrique : dérivée entre deux points voisins', noms: ['Pente de la courbe entre les deux points', 'Volume moyen de l’intervalle'],
    gen: () => ({ V1: tire([10.4, 11.0, 11.6, 12.0, 12.4, 12.8, 13.4]), E1: tire([0.86, 0.91, 0.96, 1.02, 1.08, 1.14]), dE: tire([0.03, 0.05, 0.08, 0.11, 0.15, 0.19]), cB: tire([0.0500, 0.0800, 0.1000]) }),
    build: (p, q) => {
      const V2 = Math.round((p.V1 + 0.2) * 10) / 10, E2 = Math.round((p.E1 + p.dE) * 100) / 100, pente = (E2 - p.E1) / 0.2, Vm = Math.round((p.V1 + V2) / 2 * 100) / 100, cs = x => String(x).replace('.', ',');
      const tokens = {
        V1: tok(`${cs(p.V1)} mL`, 'Volume de cérium(IV) versé au premier point', p.V1, 'mL'), E1: tok(`${cs(p.E1.toFixed(2))} V`, 'Potentiel mesuré au premier point', p.E1, 'V'),
        V2: tok(`${cs(V2)} mL`, 'Volume de cérium(IV) versé au second point', V2, 'mL'), E2: tok(`${cs(E2.toFixed(2))} V`, 'Potentiel mesuré au second point', E2, 'V'),
        cB: tok(`${cs((p.cB * 100).toFixed(2))}×10⁻² mol/L`, 'Concentration du cérium(IV) dans la burette', p.cB, 'mol/L'), ref: tok('0,245 V', 'Potentiel de l’électrode de référence', 0.245, 'V'),
      };
      const debut = ['Dans un titrage potentiométrique, on relève le potentiel E de la solution après chaque ajout de cérium(IV) de concentration ', T('cB'), ' (électrode de référence à ', T('ref'), '). Deux mesures voisines donnent : E = ', T('E1'), ' pour V = ', T('V1'), ', puis E = ', T('E2'), ' pour V = ', T('V2'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la pente dE/dV entre ces deux points (méthode de la dérivée) ?'], utiles: ['E1', 'E2', 'V1', 'V2'],
        raisons: { cB: 'La concentration du titrant n’intervient pas dans la pente entre deux mesures.', ref: 'Le potentiel de référence est le même aux deux points : il n’intervient pas dans la variation de E.' },
        cherche: { bonne: 'La pente dE/dV entre les deux points (en V/mL)', faux: ['Le potentiel moyen entre les deux points (en V)', 'La quantité de cérium(IV) versée entre les deux points (en mmol)', 'Le volume équivalent du dosage (en mL)'] },
        manque: null, solution: { txt: 'dE/dV ≈ frac(E₂ − E₁|V₂ − V₁)', val: pente, u: 'V/mL' } };
      return { tokens, derivees: [], texte: [...debut, 'À quel volume moyen associe-t-on cette pente, pour tracer la courbe dérivée ?'], utiles: ['V1', 'V2'],
        raisons: { E1: 'Le volume moyen ne dépend que des volumes versés.', E2: 'Le volume moyen ne dépend que des volumes versés.', cB: 'La concentration du titrant n’intervient pas dans le volume moyen.', ref: 'Le potentiel de référence n’intervient pas dans le volume moyen.' },
        cherche: { bonne: 'Le volume moyen de l’intervalle (en mL)', faux: ['Le volume équivalent du dosage (en mL)', 'Le volume de la prise d’essai (en mL)', 'L’écart entre les deux volumes versés (en mL)'] },
        manque: null, solution: { txt: 'V moyen = frac(V₁ + V₂|2)', val: Vm, u: 'mL' } };
    },
  },
  {
    id: 'tpt-sapp-concentration', domaine: 'Titrage potentiométrique', titre: 'Titrage potentiométrique : concentration du fer(II)', noms: ['Quantité de cérium(IV) versée à l’équivalence', 'Concentration de la solution de fer(II)'],
    gen: () => ({ cB: tire([0.0500, 0.0800, 0.1000]), VA: tire([10, 20, 25]), Ve: tire([8.6, 9.8, 11.4, 12.6, 14.2, 16.4, 18.8]) }),
    build: (p, q) => {
      const nB = p.cB * p.Ve, cA = nB / p.VA, cs = x => String(x).replace('.', ',');
      const tokens = {
        cB: tok(`${cs((p.cB * 100).toFixed(2))}×10⁻² mol/L`, 'Concentration du cérium(IV) dans la burette', p.cB, 'mol/L'), Ve: tok(`${cs(p.Ve)} mL`, 'Volume équivalent repéré par la méthode de la dérivée', p.Ve, 'mL'),
        VA: tok(`${p.VA} mL`, 'Volume de la solution de fer(II) prélevé', p.VA, 'mL'), rap: tok('1 Ce⁴⁺ pour 1 Fe²⁺', 'Coefficients de l’équation de titrage', 1, ''),
        Eref: tok('0,245 V', 'Potentiel de l’électrode de référence', 0.245, 'V'), E0: tok('0,77 V', 'Potentiel lu à la demi-équivalence', 0.77, 'V'), nB: tok(`${nb(nB)} mmol`, 'Quantité de cérium(IV) versée à l’équivalence', nB, 'mmol'),
      };
      const debut = ['On dose ', T('VA'), ' d’une solution de fer(II) par du cérium(IV) de concentration ', T('cB'), '. L’équation du titrage ', T('rap'), ' est totale. La méthode de la dérivée donne ', T('Ve'), '. Le potentiel lu à la demi-équivalence est ', T('E0'), ' (électrode de référence à ', T('Eref'), '). '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de cérium(IV) a-t-on versée jusqu’à l’équivalence ?'], utiles: ['cB', 'Ve'],
        raisons: { VA: 'Le volume de fer(II) prélevé intervient pour la concentration, pas pour la quantité de cérium versée.', rap: 'Le rapport des coefficients relie ensuite la quantité de fer(II) à celle du cérium.', Eref: 'Le potentiel de référence n’intervient pas dans les quantités de matière.', E0: 'Le potentiel standard ne sert pas à calculer des quantités de matière.' },
        cherche: { bonne: 'La quantité de cérium(IV) versée à l’équivalence (en mmol)', faux: ['La concentration de la solution de fer(II) (en mol/L)', 'La quantité de fer(III) formée au début du dosage (en mmol)', 'Le potentiel à l’équivalence (en V)'] },
        manque: null, solution: { txt: 'n(Ce⁴⁺) = c_B × V_E', val: nB, u: 'mmol' } };
      return { tokens, derivees: [{ id: 'nB', nom: 'Quantité de cérium(IV) versée', expr: 'c_B × V_E', val: nB, u: 'mmol' }], texte: [...debut, 'Quelle est la concentration de la solution de fer(II) ?'], utiles: ['cB', 'Ve', 'VA', 'rap'],
        raisons: { Eref: 'Le potentiel de référence n’intervient pas dans le calcul d’une concentration.', E0: 'Le potentiel standard ne sert pas à calculer une concentration.' },
        cherche: { bonne: 'La concentration c_A de la solution de fer(II) (en mol/L)', faux: ['La quantité de fer(II) dosée (en mmol)', 'La concentration du cérium(IV) à l’équivalence (en mol/L)', 'Le volume de fer(II) à prélever (en mL)'] },
        manque: null, solution: { txt: 'c_A = frac(c_B × V_E|V_A)', val: cA, u: 'mol/L' } };
    },
  },
  {
    id: 'tix-sapp-chaine', domaine: 'Titrage indirect', titre: 'Titrage indirect : du thiosulfate à l’eau de Javel', noms: ['Quantité de diiode dosée', 'Quantité d’ions hypochlorite dans la prise d’essai'],
    gen: () => ({ cB: tire([0.0500, 0.0800, 0.1000]), VA: tire([10, 20, 25]), Ve: tire([8.6, 9.8, 11.4, 12.6, 14.2, 16.4, 18.8]) }),
    build: (p, q) => {
      const nI2 = p.cB * p.Ve / 2, cs = x => String(x).replace('.', ',');
      const tokens = {
        cB: tok(`${cs((p.cB * 100).toFixed(2))}×10⁻² mol/L`, 'Concentration du thiosulfate dans la burette', p.cB, 'mol/L'), Ve: tok(`${cs(p.Ve)} mL`, 'Volume de thiosulfate versé à l’équivalence', p.Ve, 'mL'),
        VA: tok(`${p.VA} mL`, 'Volume d’eau de Javel diluée prélevé', p.VA, 'mL'), rap: tok('1 I₂ pour 2 S₂O₃²⁻', 'Coefficients de l’équation de titrage du diiode', 2, ''),
        rap1: tok('1 ClO⁻ pour 1 I₂', 'Coefficients de l’équation de formation du diiode', 1, ''), nI2: tok(`${nb(nI2)} mmol`, 'Quantité de diiode dosée', nI2, 'mmol'),
      };
      const debut = ['On dose ', T('VA'), ' d’eau de Javel diluée. Un excès d’iodure transforme tous les ions ClO⁻ en diiode (', T('rap1'), '), qu’on titre avec du thiosulfate de concentration ', T('cB'), ' (', T('rap'), '). Le bleu de l’empois d’amidon disparaît après avoir versé ', T('Ve'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de diiode a-t-on dosée ?'], utiles: ['cB', 'Ve', 'rap'],
        raisons: { VA: 'Le volume d’eau de Javel prélevé intervient pour la concentration, pas pour la quantité de diiode.', rap1: 'Ce rapport relie ensuite le diiode aux ions ClO⁻ de l’eau de Javel.' },
        cherche: { bonne: 'La quantité de diiode dosée à l’équivalence (en mmol)', faux: ['La quantité de thiosulfate versée à l’équivalence (en mmol)', 'La concentration de l’eau de Javel diluée (en mol/L)', 'Le volume de diiode formé (en mL)'] },
        manque: null, solution: { txt: 'n(I₂) = frac(c_B × V_E|2)', val: nI2, u: 'mmol' } };
      return { tokens, derivees: [{ id: 'nI2', nom: 'Quantité de diiode dosée', expr: 'frac(c_B × V_E|2)', val: nI2, u: 'mmol' }], texte: [...debut, 'Quelle quantité d’ions hypochlorite contenait la prise d’essai ?'], utiles: ['cB', 'Ve', 'rap', 'rap1'],
        raisons: { VA: 'Le volume prélevé servira pour la concentration, pas pour la quantité d’ions hypochlorite.' },
        cherche: { bonne: 'La quantité d’ions ClO⁻ dans la prise d’essai (en mmol)', faux: ['La quantité d’ions iodure introduits en excès (en mmol)', 'La concentration en ions ClO⁻ de la prise d’essai (en mol/L)', 'La quantité de thiosulfate versée (en mmol)'] },
        manque: null, solution: { txt: 'n(ClO⁻) = n(I₂) = frac(c_B × V_E|2)', val: nI2, u: 'mmol' } };
    },
  },
  {
    id: 'tix-sapp-concentration', schema: () => ({ type: 'titrage', sonde: '', burette: 'thiosulfate', becher: 'eau de Javel + iodure' }), domaine: 'Titrage indirect', titre: 'Titrage indirect : concentration de l’eau de Javel', noms: ['Concentration de la solution diluée', 'Concentration de l’eau de Javel du commerce'],
    gen: () => ({ cB: tire([0.0500, 0.0800, 0.1000]), VA: tire([20, 25]), Ve: tire([8.6, 9.8, 11.4, 12.6, 14.2, 16.4]), dil: tire([10, 20]) }),
    build: (p, q) => {
      const nI2 = p.cB * p.Ve / 2, cA = nI2 / p.VA, c0 = p.dil * cA, cs = x => String(x).replace('.', ',');
      const tokens = {
        cB: tok(`${cs((p.cB * 100).toFixed(2))}×10⁻² mol/L`, 'Concentration du thiosulfate dans la burette', p.cB, 'mol/L'), Ve: tok(`${cs(p.Ve)} mL`, 'Volume de thiosulfate versé à l’équivalence', p.Ve, 'mL'),
        VA: tok(`${p.VA} mL`, 'Volume de solution diluée prélevé', p.VA, 'mL'), dil: tok(`${p.dil} fois`, 'Dilution de l’eau de Javel du commerce', p.dil, ''),
        rap: tok('1 I₂ pour 2 S₂O₃²⁻', 'Coefficients de l’équation de titrage du diiode', 2, ''), rap1: tok('1 ClO⁻ pour 1 I₂', 'Coefficients de l’équation de formation du diiode', 1, ''),
        cA: tok(`${nb(cA)} mol/L`, 'Concentration de la solution diluée', cA, 'mol/L'),
      };
      const debut = ['On dilue ', T('dil'), ' une eau de Javel du commerce, puis on dose ', T('VA'), ' de la solution diluée : un excès d’iodure forme du diiode (', T('rap1'), '), titré par du thiosulfate de concentration ', T('cB'), ' (', T('rap'), '). Le bleu de l’amidon disparaît après avoir versé ', T('Ve'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en ions ClO⁻ de la solution diluée ?'], utiles: ['cB', 'Ve', 'VA', 'rap', 'rap1'],
        raisons: { dil: 'La dilution intervient ensuite, pour passer à l’eau de Javel du commerce.' },
        cherche: { bonne: 'La concentration c_A de la solution diluée (en mol/L)', faux: ['La concentration de l’eau de Javel du commerce (en mol/L)', 'La quantité de thiosulfate versée (en mmol)', 'La concentration du diiode formé dans l’erlenmeyer (en mol/L)'] },
        manque: null, solution: { txt: 'c_A = frac(c_B × V_E|2 × V_A)', val: cA, u: 'mol/L' } };
      return { tokens, derivees: [{ id: 'cA', nom: 'Concentration de la solution diluée', expr: 'frac(c_B × V_E|2 × V_A)', val: cA, u: 'mol/L' }], texte: [...debut, 'Quelle est la concentration en ions ClO⁻ de l’eau de Javel du commerce ?'], utiles: ['cB', 'Ve', 'VA', 'rap', 'rap1', 'dil'],
        raisons: {},
        cherche: { bonne: 'La concentration c₀ de l’eau de Javel du commerce (en mol/L)', faux: ['La concentration de la solution diluée (en mol/L)', 'La quantité d’ions ClO⁻ dans la prise d’essai (en mmol)', 'Le volume d’eau de Javel à prélever (en mL)'] },
        manque: null, solution: { txt: 'c₀ = dilution × c_A', val: c0, u: 'mol/L' } };
    },
  },
  {
    id: 'tcr-sapp-quantites', domaine: 'Titrage redox direct', titre: 'Dosage au permanganate : quantités de matière à l’équivalence', noms: ['Quantité de permanganate versée à l’équivalence', 'Quantité d’eau oxygénée dans l’erlenmeyer'],
    gen: () => ({ cB: tire([0.0100, 0.0150, 0.0200, 0.0250]), VA: tire([10, 20, 25]), Ve: tire([9.4, 11.8, 13.6, 15.2, 17.9, 19.3, 21.1]), Vac: tire([5, 10]) }),
    build: (p, q) => {
      const nB = p.cB * p.Ve, nA = 2.5 * nB, cs = x => String(x).replace('.', ',');
      const cBt = `${cs((p.cB * 100).toFixed(2))}×10⁻² mol/L`;
      const tokens = {
        cB: tok(cBt, 'Concentration du permanganate de potassium dans la burette', p.cB, 'mol/L'),
        Ve: tok(`${cs(p.Ve)} mL`, 'Volume de permanganate versé à l’équivalence', p.Ve, 'mL'),
        VA: tok(`${p.VA} mL`, 'Volume d’eau oxygénée diluée prélevé', p.VA, 'mL'),
        Vac: tok(`${p.Vac} mL`, 'Volume d’acide sulfurique ajouté dans l’erlenmeyer', p.Vac, 'mL'),
        rap: tok('5 H₂O₂ pour 2 MnO₄⁻', 'Coefficients de l’équation de titrage', 2.5, ''),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
        nB: tok(`${nb(nB)} mmol`, 'Quantité de permanganate versée à l’équivalence', nB, 'mmol'),
      };
      const debut = [`On dose `, T('VA'), ` d’eau oxygénée diluée, acidifiée avec `, T('Vac'), ` d’acide sulfurique, à `, T('T'), `, avec du permanganate de potassium de concentration `, T('cB'), `. L’équation du titrage s’écrit 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O : `, T('rap'), `. La teinte rose persiste après avoir versé `, T('Ve'), `. `];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de permanganate a été versée jusqu’à l’équivalence ?'], utiles: ['cB', 'Ve'],
        raisons: { VA: 'Le volume d’eau oxygénée prélevé intervient pour la concentration, pas pour la quantité de permanganate versée.', Vac: 'L’acide est en excès : son volume n’intervient pas dans la quantité de permanganate.', rap: 'Le rapport des coefficients relie ensuite la quantité d’eau oxygénée à celle du permanganate.', T: 'La température n’intervient pas dans ce calcul.' },
        cherche: { bonne: 'La quantité de permanganate versée à l’équivalence (en mmol)', faux: ['La quantité d’eau oxygénée dans l’erlenmeyer (en mmol)', 'La concentration de l’eau oxygénée diluée (en mol/L)', 'Le volume de permanganate à verser (en mL)'] },
        manque: null, solution: { txt: 'n(MnO₄⁻) = c_B × V_E', val: nB, u: 'mmol' } };
      return { tokens, derivees: [{ id: 'nB', nom: 'Quantité de permanganate versée à l’équivalence', expr: 'c_B × V_E', val: nB, u: 'mmol' }], texte: [...debut, 'Quelle quantité d’eau oxygénée contenaient les ', T('VA'), ' prélevés ?'],
        utiles: ['cB', 'Ve', 'rap'], raisons: { VA: 'Le volume prélevé donne la concentration, pas la quantité d’eau oxygénée dosée.', Vac: 'L’acide est en excès : son volume n’intervient pas dans la quantité d’eau oxygénée.', T: 'La température n’intervient pas dans ce calcul.' },
        cherche: { bonne: 'La quantité d’eau oxygénée dans l’erlenmeyer (en mmol)', faux: ['La quantité de permanganate versée (en mmol)', 'La concentration de l’eau oxygénée diluée (en mol/L)', 'La masse d’eau oxygénée dosée (en g)'] },
        manque: null, solution: { txt: 'n(H₂O₂) = 5/2 × c_B × V_E', val: nA, u: 'mmol' } };
    },
  },
  {
    id: 'tcr-sapp-concentration', domaine: 'Titrage redox direct', titre: 'Dosage au permanganate : concentration de l’eau oxygénée du commerce', noms: ['Concentration de l’eau oxygénée diluée', 'Concentration de l’eau oxygénée du commerce'],
    gen: () => { for (let k = 0; k < 500; k++) { const p = { cB: tire([0.0100, 0.0150, 0.0200, 0.0250]), VA: tire([10, 20, 25]), Ve: tire([9.4, 11.8, 13.6, 15.2, 17.9, 19.3, 21.1]), dil: tire([10, 20, 50]) }; const c0 = 2.5 * p.cB * p.Ve * p.dil / p.VA; if (c0 > 0.35 && c0 < 1.5) return p; } return { cB: 0.02, VA: 10, Ve: 17.9, dil: 10 }; },
    build: (p, q) => {
      const cA = 2.5 * p.cB * p.Ve / p.VA, c0 = cA * p.dil, cs = x => String(x).replace('.', ',');
      const tokens = {
        cB: tok(`${cs((p.cB * 100).toFixed(2))}×10⁻² mol/L`, 'Concentration du permanganate de potassium dans la burette', p.cB, 'mol/L'),
        Ve: tok(`${cs(p.Ve)} mL`, 'Volume de permanganate versé à l’équivalence', p.Ve, 'mL'),
        VA: tok(`${p.VA} mL`, 'Volume d’eau oxygénée diluée prélevé', p.VA, 'mL'),
        dil: tok(`${p.dil} fois`, 'Facteur de dilution de l’eau oxygénée du commerce', p.dil, ''),
        rap: tok('5 H₂O₂ pour 2 MnO₄⁻', 'Coefficients de l’équation de titrage', 2.5, ''),
        T: tok('25 °C', 'Température de la solution', 25, '°C'),
        cA: tok(`${nb(cA)} mol/L`, 'Concentration de l’eau oxygénée diluée', cA, 'mol/L'),
      };
      const debut = [`On dose `, T('VA'), ` d’une eau oxygénée obtenue en diluant `, T('dil'), ` l’eau oxygénée d’un désinfectant, à `, T('T'), `, avec du permanganate de potassium de concentration `, T('cB'), ` en milieu acide (équation : 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O, soit `, T('rap'), `). La teinte rose persiste après `, T('Ve'), ` de permanganate versé. `];
      if (q === 0) return { tokens, derivees: [{ id: 'nB', nom: 'Quantité de permanganate versée', expr: 'c_B × V_E', val: p.cB * p.Ve, u: 'mmol' }, { id: 'nA', nom: 'Quantité d’eau oxygénée dosée', expr: '5/2 × n(MnO₄⁻)', val: 2.5 * p.cB * p.Ve, u: 'mmol' }], texte: [...debut, 'Quelle est la concentration de l’eau oxygénée diluée, c_A ?'],
        utiles: ['cB', 'Ve', 'rap', 'VA'], raisons: { dil: 'La dilution intervient ensuite, pour passer à l’eau oxygénée du commerce.', T: 'La température n’intervient pas dans ce calcul.' },
        cherche: { bonne: 'La concentration c_A de l’eau oxygénée diluée (en mol/L)', faux: ['La concentration c_0 de l’eau oxygénée du commerce (en mol/L)', 'La quantité d’eau oxygénée dosée (en mmol)', 'Le titre massique de l’eau oxygénée diluée (en g/L)'] },
        manque: null, solution: { txt: 'c_A = frac(5/2 × c_B × V_E|V_A)', val: cA, u: 'mol/L' } };
      return { tokens, derivees: [], texte: [...debut, 'On a calculé c_A = ', T('cA'), '. Quelle est la concentration de l’eau oxygénée du désinfectant ?'], utiles: ['cA', 'dil'],
        raisons: { cB: 'La concentration en permanganate a déjà servi à calculer c_A.', Ve: 'Le volume équivalent a déjà servi à calculer c_A.', VA: 'Le volume prélevé a déjà servi à calculer c_A.', rap: 'Le rapport des coefficients a déjà servi à calculer c_A.', T: 'La température n’intervient pas dans ce calcul.' },
        cherche: { bonne: 'La concentration c_0 de l’eau oxygénée du commerce (en mol/L)', faux: ['La concentration c_A de l’eau oxygénée diluée (en mol/L)', 'La quantité d’eau oxygénée dosée (en mmol)', 'La concentration du permanganate (en mol/L)'] },
        manque: null, solution: { txt: 'c_0 = facteur de dilution × c_A', val: c0, u: 'mol/L' } };
    },
  },
  // ───────────────────────────── Conductimétrie (TG, sim 136) : étalonnage, conductance et constante de cellule
  {
    id: 'etl-sapp-cellule', domaine: 'Conductimétrie : étalonnage et conductance', titre: 'Constante de cellule et conductivité d’une solution', noms: ['Constante de la cellule', 'Conductivité d’une solution à partir de sa conductance'],
    gen: () => { const k = tire([50, 60, 80, 100]); return { k, Ge: Number((141 / k).toPrecision(3)), Gx: tire([0.60, 0.85, 1.20, 1.55]) }; },
    build: (p, q) => {
      const tokens = {
        sE: tok('141 mS·m⁻¹', 'Conductivité de la solution étalon de chlorure de potassium (écrite sur le flacon)', 141, 'mS·m⁻¹'),
        Ge: tok(`${nb(p.Ge, 3)} mS`, 'Conductance de la solution étalon, mesurée avec la cellule', p.Ge, 'mS'),
        Gx: tok(`${nb(p.Gx, 2)} mS`, 'Conductance de la solution à étudier, mesurée avec la même cellule', p.Gx, 'mS'),
        k: tok(`${p.k} m⁻¹`, 'Constante de la cellule', p.k, 'm⁻¹'),
      };
      const debut = ['Un conductimètre mesure une conductance G ; la conductivité σ s’en déduit grâce à la constante de cellule k. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La cellule plonge dans une solution étalon de conductivité ', T('sE'), ' : elle affiche ', T('Ge'), '. Avec la même cellule, une autre solution affiche ', T('Gx'), '. Quelle est la constante de la cellule ?'],
        utiles: ['sE', 'Ge'], raisons: { Gx: 'La conductance de la solution étudiée ne sert pas à étalonner la cellule : l’étalonnage utilise la solution de conductivité connue.' },
        cherche: { bonne: 'La constante de cellule k (en m⁻¹)', faux: ['La conductivité de la solution étudiée (en mS·m⁻¹)', 'La concentration de la solution étudiée (en mmol/L)', 'La conductance de la cellule dans l’air (en mS)'] },
        manque: null, solution: { txt: 'k = frac(σ(étalon)|G(étalon)) (des mS·m⁻¹ divisés par des mS donnent des m⁻¹)', val: 141 / p.Ge, u: 'm⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'La cellule, de constante ', T('k'), ', plonge dans une solution étalon de conductivité ', T('sE'), ' (conductance ', T('Ge'), ') puis dans une solution à étudier. Cette dernière affiche ', T('Gx'), '. Quelle est sa conductivité ?'],
        utiles: ['k', 'Gx'], raisons: { sE: 'La conductivité de l’étalon a déjà servi à déterminer k : elle ne sert pas à calculer celle de la solution étudiée.', Ge: 'La conductance de l’étalon a déjà servi à déterminer k : elle n’intervient plus.' },
        cherche: { bonne: 'La conductivité σ de la solution étudiée (en mS·m⁻¹)', faux: ['La constante de cellule k (en m⁻¹)', 'La concentration de la solution étudiée (en mmol/L)', 'La conductance de la solution à 25 °C (en mS)'] },
        manque: null, solution: { txt: 'σ = k × G (des m⁻¹ multipliés par des mS donnent des mS·m⁻¹)', val: p.k * p.Gx, u: 'mS·m⁻¹' } };
    },
  },
  {
    id: 'etl-sapp-droite', domaine: 'Conductimétrie : étalonnage et conductance', titre: 'Doser avec une droite d’étalonnage', noms: ['Concentration lue sur la droite d’étalonnage', 'Concentration de la solution avant dilution'],
    gen: () => ({ a: tire([0.095, 0.120, 0.155, 0.210]), G: tire([0.45, 0.62, 0.78, 0.93]), F: tire([10, 20, 25, 50]) }),
    build: (p, q) => {
      const tokens = {
        a: tok(`${nb(p.a, 3)} mS par mmol/L`, 'Coefficient directeur de la droite d’étalonnage G = a × c (droite passant par l’origine)', p.a, 'mS·L·mmol⁻¹'),
        G: tok(`${nb(p.G, 2)} mS`, 'Conductance de la solution diluée, mesurée avec la même cellule que les étalons', p.G, 'mS'),
        F: tok(`${p.F}`, 'Facteur de dilution (volume final divisé par volume prélevé)', p.F, ''),
      };
      const debut = ['On trace la droite d’étalonnage G = a × c avec des étalons dilués (c inférieure à 10 mmol/L) : son coefficient directeur vaut ', T('a'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La solution diluée affiche ', T('G'), ', mesurée avec la même cellule. Le facteur de dilution est ', T('F'), '. Quelle est la concentration de la solution diluée ?'],
        utiles: ['a', 'G'], raisons: { F: 'Le facteur de dilution sert à remonter à la solution de départ, pas à lire la concentration de la solution diluée.' },
        cherche: { bonne: 'La concentration de la solution diluée (en mmol/L)', faux: ['La concentration de la solution de départ (en mol/L)', 'La conductivité de la solution diluée (en mS·m⁻¹)', 'La constante de la cellule (en m⁻¹)'] },
        manque: null, solution: { txt: 'c = frac(G|a) (G en mS, a en mS par mmol/L, donc c en mmol/L)', val: p.G / p.a, u: 'mmol/L' } };
      return { tokens, derivees: [{ id: 'cd', nom: 'Concentration de la solution diluée', expr: 'c′ = frac(G|a)', val: p.G / p.a, u: 'mmol/L' }], texte: [...debut, 'La solution étudiée a été diluée ', T('F'), ' fois ; la solution diluée affiche ', T('G'), '. Quelle est la concentration de la solution de départ ?'],
        utiles: ['a', 'G', 'F'], raisons: {},
        cherche: { bonne: 'La concentration de la solution de départ (en mol/L)', faux: ['La concentration de la solution diluée (en mmol/L)', 'La conductance de la solution de départ (en mS)', 'La quantité de soluté dans la solution diluée (en mmol)'] },
        manque: null, solution: { txt: 'c(S) = frac(F × G|a), en mmol/L, puis diviser par 1 000 pour obtenir des mol/L', val: p.F * p.G / p.a / 1000, u: 'mol/L' } };
    },
  },
  // ───────────────────────────── Mouvement circulaire (TG, sim 167) : repère de Frenet, accélération
  {
    id: 'fre-sapp-circ', schema: () => ({ type: 'virage', point: true }), domaine: 'Mouvement circulaire et repère de Frenet', titre: 'Accélération d’un point en mouvement circulaire', noms: ['Accélération d’un point en mouvement circulaire uniforme', 'Norme de l’accélération en mouvement circulaire non uniforme'],
    gen: () => {
      // on écarte les tirages où a_n seule, a_t seule ou leur somme donnerait la norme à 8 % près (réponse fausse acceptée par la tolérance)
      const MV = [2.0, 3.0, 4.0, 5.0], MR = [1.5, 2.0, 2.5, 4.0], MA = [1.5, 2.0, 3.0], ok = [];
      MV.forEach(v => MR.forEach(R => MA.forEach(at => { const an = v * v / R, a = Math.hypot(at, an); if ([an, at, at + an].every(x => Math.abs(x - a) > 0.08 * a)) ok.push([v, R, at]); })));
      const [v, R, at] = tire(ok);
      return { v, R, at, m: tire([0.20, 0.50, 1.5]), t: tire([10, 20, 30]) };
    },
    build: (p, q) => {
      const tokens = {
        v: tok(`${nb(p.v, 2)} m/s`, 'Norme de la vitesse du point à l’instant étudié', p.v, 'm/s'),
        R: tok(`${nb(p.R, 2)} m`, 'Rayon du cercle décrit par le point', p.R, 'm'),
        at: tok(`${nb(p.at, 2)} m/s²`, 'Variation de la norme de la vitesse par seconde (le point accélère)', p.at, 'm/s²'),
        m: tok(`${nb(p.m, 2)} kg`, 'Masse du point', p.m, 'kg'),
        t: tok(`${p.t} s`, 'Durée totale de l’enregistrement du mouvement', p.t, 's'),
      };
      const debut = ['Un point matériel décrit un cercle. On étudie son accélération dans le repère de Frenet. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Le point tourne à vitesse de norme constante ', T('v'), ' sur un cercle de rayon ', T('R'), '. Sa masse est ', T('m'), ' ; le mouvement a été enregistré pendant ', T('t'), '. Quelle est la norme de son accélération ?'],
        utiles: ['v', 'R'], raisons: { m: 'La masse n’intervient pas dans la description du mouvement (cinématique) : elle ne sert pas à calculer l’accélération.', t: 'La durée de l’enregistrement ne change ni la vitesse ni le rayon : elle ne sert pas ici.' },
        cherche: { bonne: 'La norme de l’accélération a (en m/s²)', faux: ['La variation de la vitesse frac(dv|dt) (en m/s²)', 'La durée d’un tour (en s)', 'La force exercée sur le point (en N)'] },
        manque: null, solution: { txt: 'frac(dv|dt) = 0 : a = a_n = frac(v²|R) (v en m/s, R en m)', val: p.v * p.v / p.R, u: 'm/s²' } };
      return { tokens, derivees: [{ id: 'an', nom: 'Coordonnée normale de l’accélération', expr: 'a_n = frac(v²|R)', val: p.v * p.v / p.R, u: 'm/s²' }], texte: [...debut, 'À l’instant étudié, le point accélère : sa vitesse vaut ', T('v'), ', et la variation de sa vitesse par unité de temps vaut ', T('at'), ', sur un cercle de rayon ', T('R'), '. Sa masse est ', T('m'), '. Quelle est la norme de son accélération ?'],
        utiles: ['v', 'R', 'at'], raisons: { m: 'La masse n’intervient pas dans les coordonnées de l’accélération.' },
        cherche: { bonne: 'La norme de l’accélération a (en m/s²)', faux: ['La coordonnée normale a_n seule (en m/s²)', 'La coordonnée tangentielle a_t seule (en m/s²)', 'La vitesse angulaire (en rad/s)'] },
        manque: null, solution: { txt: 'a_t = frac(dv|dt) ; a_n = frac(v²|R) ; a = sqrt(a_t² + a_n²)', val: Math.hypot(p.at, p.v * p.v / p.R), u: 'm/s²' } };
    },
  },
  // ───────────────────────────── Spectroscopie UV-visible (TG, sim 169) : dosage d'un colorant par la loi de Beer-Lambert
  {
    id: 'uvv-sapp-dosage', domaine: 'Spectroscopie UV-visible et loi de Beer-Lambert', titre: 'Dosage d’un colorant par spectrophotométrie', noms: ['Concentration de la solution diluée', 'Concentration de la boisson initiale'],
    gen: () => {
      // ε typiques (L·mol⁻¹·cm⁻¹) : A reste ≤ 1 (domaine de validité de la loi de Beer-Lambert)
      const C = [{ art: 'de la', nom: 'tartrazine', lam: 427, eps: 2.7e4 }, { art: 'du', nom: 'rouge cochenille A', lam: 507, eps: 2.5e4 }, { art: 'du', nom: 'bleu patenté V', lam: 638, eps: 1.0e5 }];
      const col = tire(C), A = tire([0.35, 0.52, 0.74, 0.96]), l = tire([1.00, 2.00]), F = tire([5, 10]);
      return { col, A, l, F, V: tire([2.5, 3.0]), T: tire([20, 25]) };
    },
    build: (p, q) => {
      const cp = p.A / (p.col.eps * p.l) * 1e6, c0 = cp * p.F;                  // µmol/L
      const tokens = {
        A: tok(`${nb(p.A, 2)}`, 'Absorbance mesurée au maximum d’absorption de la solution diluée (sans unité)', p.A, ''),
        eps: tok(`${sciR(p.col.eps)} L·mol⁻¹·cm⁻¹`, `Coefficient d’absorption molaire du ${p.col.nom} à ${p.col.lam} nm (valeur tabulée)`, p.col.eps, 'L·mol⁻¹·cm⁻¹'),
        l: tok(`${nb(p.l, 2)} cm`, 'Longueur de la cuve traversée par la lumière', p.l, 'cm'),
        lam: tok(`${p.col.lam} nm`, 'Longueur d’onde de la mesure (λ_max)', p.col.lam, 'nm'),
        V: tok(`${nb(p.V, 1)} mL`, 'Volume de solution contenu dans la cuve', p.V, 'mL'),
        T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'),
        F: tok(`${p.F}`, 'Facteur de dilution (la boisson a été diluée F fois)', p.F, ''),
      };
      const debut = ['Une boisson contient ', `${p.col.art} ${p.col.nom}`, '. On en dilue un échantillon ', T('F'), ' fois, puis on mesure l’absorbance de la solution diluée au maximum d’absorption, à ', T('lam'), ' : ', T('A'), ' dans une cuve de longueur ', T('l'), ' contenant ', T('V'), ' de solution à ', T('T'), '. La valeur tabulée de ε à cette longueur d’onde est ', T('eps'), '. '];
      const rLam = 'La longueur d’onde est déjà prise en compte par la valeur de ε, donnée à cette longueur d’onde : elle ne sert pas dans le calcul.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration de la solution diluée ?'],
        utiles: ['A', 'eps', 'l'], raisons: { lam: rLam, V: 'Le volume dans la cuve ne change pas l’absorbance : A dépend de la longueur traversée et de la concentration, pas du volume.', T: 'La température est supposée constante (ε tabulée à 25 °C) : elle n’intervient pas dans le calcul.', F: 'Le facteur de dilution sert à remonter à la boisson initiale, pas à la concentration de la solution diluée.' },
        cherche: { bonne: 'La concentration c′ de la solution diluée (en µmol/L)', faux: ['La concentration c de la boisson initiale (en µmol/L)', 'Le coefficient ε à une autre longueur d’onde (en L·mol⁻¹·cm⁻¹)', 'L’absorbance de la boisson initiale (sans unité)'] },
        manque: null, solution: { txt: 'c′ = frac(A|ε × l) en mol/L, puis × 10⁶ pour obtenir des µmol/L', val: cp, u: 'µmol/L' } };
      return { tokens, derivees: [{ id: 'cd', nom: 'Concentration de la solution diluée', expr: 'c′ = frac(A|ε × l)', val: cp, u: 'µmol/L' }], texte: [...debut, 'Quelle est la concentration de la boisson initiale ?'],
        utiles: ['A', 'eps', 'l', 'F'], raisons: { lam: rLam, V: 'Le volume dans la cuve ne change pas l’absorbance : il ne sert pas.', T: 'La température est supposée constante : elle n’intervient pas dans le calcul.' },
        cherche: { bonne: 'La concentration c de la boisson initiale (en µmol/L)', faux: ['La concentration c′ de la solution diluée, mesurée (en µmol/L)', 'L’absorbance de la boisson initiale (sans unité)', 'La quantité de colorant dans la cuve (en µmol)'] },
        manque: null, solution: { txt: 'c = F × c′, avec c′ = frac(A|ε × l) (en mol/L, puis × 10⁶ pour des µmol/L)', val: c0, u: 'µmol/L' } };
    },
  },
  // ───────────────────────────── Spectroscopie infrarouge (TG, sim 170) : lire une bande pour la comparer au tableau de données
  {
    id: 'irt-sapp-bande', domaine: 'Spectroscopie infrarouge : données tabulées', titre: 'Lire une bande d’un spectre infrarouge', noms: ['Nombre d’onde à comparer au tableau', 'Part du rayonnement absorbée par la bande'],
    gen: () => ({ lam: tire([2.90, 3.00, 3.30, 5.75, 5.85, 5.95]), T: tire([12, 18, 25, 35]), e: tire([25, 50, 100]) }),
    build: (p, q) => {
      const tokens = {
        lam: tok(`${nb(p.lam, 2)} µm`, 'Longueur d’onde du minimum de la bande, lue sur le spectre', p.lam * 1e-4, 'cm'),
        T: tok(`${p.T} %`, 'Transmittance au minimum de la bande', p.T, '%'),
        e: tok(`${p.e} µm`, 'Épaisseur du film de liquide traversé par le faisceau', p.e * 1e-4, 'cm'),
        res: tok('4 cm⁻¹', 'Résolution du spectromètre (plus petit écart de nombre d’onde distingué)', 4, 'cm⁻¹'),
      };
      const debut = ['Un spectromètre infrarouge enregistre le spectre d’un film de liquide pur d’épaisseur ', T('e'), '. Une bande d’absorption a son minimum à la longueur d’onde ', T('lam'), ', où la transmittance vaut ', T('T'), ' ; la résolution de l’appareil est ', T('res'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'On veut comparer cette bande aux intervalles d’un tableau de données donnés en cm⁻¹ : quelle grandeur faut-il calculer ?'],
        utiles: ['lam'], raisons: { T: 'La transmittance renseigne sur l’intensité de la bande, pas sur sa position.', e: 'L’épaisseur du film règle la profondeur des bandes, pas leur position.', res: 'La résolution est la précision de l’appareil : elle ne sert pas à convertir λ en σ.' },
        cherche: { bonne: 'Le nombre d’onde σ de la bande (en cm⁻¹)', faux: ['La fréquence ν de la bande (en Hz)', 'L’énergie du photon absorbé par la bande (en J)', 'La largeur de la bande à mi-hauteur (en cm⁻¹)'] },
        manque: null, solution: { txt: 'σ = frac(1|λ) (λ converti en cm)', val: 1 / (p.lam * 1e-4), u: 'cm⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'Pour en classer l’intensité (forte, moyenne ou faible, comme dans la colonne du tableau), quelle part du rayonnement la bande absorbe-t-elle à son minimum ?'],
        utiles: ['T'], raisons: { lam: 'La position de la bande ne dit rien sur la part de rayonnement absorbée.', e: 'L’épaisseur est déjà « comptée » dans la transmittance mesurée : on n’en a pas besoin pour le pourcentage absorbé.', res: 'La résolution n’intervient pas dans une transmittance.' },
        cherche: { bonne: 'Le pourcentage du rayonnement absorbé (en %)', faux: ['Le nombre d’onde σ du minimum de la bande (en cm⁻¹)', 'La largeur de la bande à mi-hauteur (en cm⁻¹)', 'La concentration de l’échantillon en mol/L'] },
        manque: null, solution: { txt: 'absorbé = 100 % − T', val: 100 - p.T, u: '%' } };
    },
  },
  // ───────────────────────────── Lunette afocale (TG, sim 171)
  {
    id: 'lun-sapp-fiche', domaine: 'Lunette afocale : schéma, faisceau et grossissement', titre: 'Une lunette achetée en ligne', noms: ['Grossissement avec l’oculaire livré', 'Distance entre l’objectif et l’oculaire'],
    gen: () => { const [D, f1] = tire([[60, 700], [70, 700], [70, 900], [80, 400], [80, 900], [90, 1000], [102, 900]]); return { D, f1, f2: tire([10, 20, 25, 40]), m: tire([2.4, 3.5, 4.8]), prix: tire([149, 229, 319]) }; },
    build: (p, q) => {
      const tokens = {
        D: tok(`${p.D} mm`, 'Diamètre de l’objectif', p.D / 1000, 'm'),
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire livré avec la lunette', p.f2 / 1000, 'm'),
        m: tok(`${nb(p.m, 1)} kg`, 'Masse de la lunette', p.m, 'kg'),
        prix: tok(`${p.prix} €`, 'Prix de la lunette', p.prix, '€'),
      };
      const debut = ['Une lunette astronomique vendue en ligne a un objectif de diamètre ', T('D'), ' et de distance focale ', T('f1'), '. Elle est livrée avec un oculaire de distance focale ', T('f2'), ', pèse ', T('m'), ' et coûte ', T('prix'), '. On la règle pour qu’elle soit afocale. '];
      const raisons = { D: 'Le diamètre de l’objectif règle la lumière recueillie, pas le grossissement ni les distances entre les lentilles.', m: 'La masse de la lunette ne joue aucun rôle dans ce calcul.', prix: 'Le prix n’a aucun lien avec les grandeurs optiques.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est son grossissement ?'], utiles: ['f1', 'f2'], raisons,
        cherche: { bonne: 'Le grossissement G de la lunette (sans unité)', faux: ['La distance O₁O₂ entre l’objectif et l’oculaire (en m)', 'Le diamètre apparent de l’astre (en rad)', 'L’angle θ′ du faisceau émergent (en °)'] },
        manque: null, solution: { txt: 'G = rapport des distances focales, f′obj sur f′oc', val: p.f1 / p.f2, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle distance doit séparer l’objectif et l’oculaire ?'], utiles: ['f1', 'f2'], raisons,
        cherche: { bonne: 'La distance O₁O₂ entre l’objectif et l’oculaire (en m)', faux: ['Le grossissement G de la lunette (sans unité)', 'La taille A₁B₁ de l’image intermédiaire (en m)', 'L’angle θ′ du faisceau émergent (en °)'] },
        manque: null, solution: { txt: 'O₁O₂ = f′obj + f′oc (foyers F′obj et Foc confondus)', val: (p.f1 + p.f2) / 1000, u: 'm' } };
    },
  },
  // ───────────────────────────── Circuit RC (TG, sim 174) : temps caractéristique et intensité initiale
  {
    id: 'rc-sapp-circuit', schema: () => ({ type: 'rcSerie', i: false, uC: false }), domaine: 'Circuit RC : charge et décharge d’un condensateur', titre: 'Un condensateur dans un montage de laboratoire', noms: ['Temps caractéristique du circuit', 'Intensité au début de la charge'],
    gen: () => ({ E: tire([3, 5, 6, 9, 12]), R: tire([1, 2.2, 4.7, 10, 22, 47]), C: tire([0.47, 1, 4.7, 10, 22, 47, 100]), L: tire([15, 25, 40]), T: tire([19, 21, 23]) }),
    build: (p, q) => {
      const tokens = {
        E: tok(`${nb(p.E, 0)} V`, 'Tension du générateur', p.E, 'V'),
        R: tok(`${nb(p.R, p.R < 10 ? 1 : 0)} kΩ`, 'Résistance du résistor en série avec le condensateur', p.R, 'kΩ'),
        C: tok(`${nb(p.C, p.C < 1 ? 2 : p.C < 10 ? 1 : 0)} µF`, 'Capacité du condensateur', p.C, 'µF'),
        L: tok(`${p.L} cm`, 'Longueur des fils de connexion', p.L, 'cm'),
        T: tok(`${p.T} °C`, 'Température de la salle de TP', p.T, '°C'),
      };
      const debut = ['Un élève monte en série un générateur de tension continue ', T('E'), ', un résistor de résistance ', T('R'), ' et un condensateur de capacité ', T('C'), ', initialement déchargé. Les fils mesurent ', T('L'), ' et la salle est à ', T('T'), '. À t = 0, il ferme l’interrupteur. '];
      const raisons = { L: 'Les fils sont supposés de résistance nulle : leur longueur n’intervient pas dans l’étude du circuit RC.', T: 'La température de la salle ne joue aucun rôle dans le modèle du circuit RC idéal.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le temps caractéristique du circuit ?'], utiles: ['R', 'C'], raisons: { ...raisons, E: 'La tension du générateur fixe la tension finale du condensateur, pas la durée du phénomène : τ = R × C ne dépend pas de E.' },
        cherche: { bonne: 'Le temps caractéristique τ du circuit (en ms)', faux: ['La charge maximale q du condensateur (en µC)', 'L’intensité maximale du courant (en mA)', 'La tension finale aux bornes du condensateur (en V)'] },
        manque: null, solution: { txt: 'τ = R × C (kΩ × µF = ms)', val: p.R * p.C, u: 'ms' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est l’intensité du courant juste après la fermeture de l’interrupteur ?'], utiles: ['E', 'R'], raisons: { ...raisons, C: 'À t = 0 le condensateur est déchargé : u_C = 0, donc u_R = E et i(0) = frac(E|R). La capacité n’intervient pas dans cette valeur.' },
        cherche: { bonne: 'L’intensité i(0) à la fermeture de l’interrupteur (en mA)', faux: ['Le temps caractéristique τ du circuit (en ms)', 'La charge finale q = C × E du condensateur (en µC)', 'La tension aux bornes du condensateur en régime stationnaire (en V)'] },
        manque: null, solution: { txt: 'u_C(0) = 0 donc i(0) = frac(E|R) (V divisés par kΩ donnent des mA)', val: p.E / p.R, u: 'mA' } };
    },
  },
  // ───────────────────────────── Deuxième loi de Newton (TG, sim 168) : somme des forces, accélération du centre de masse
  {
    id: 'nwt-sapp-chariot', domaine: 'Deuxième loi de Newton', titre: 'Chariot tiré par un fil', noms: ['Somme des forces sur l’axe du rail', 'Accélération du chariot'],
    gen: () => ({ m: tire([1.5, 2.0, 2.5, 3.0]), T: tire([6.0, 7.0, 8.0, 9.0]), f: tire([1.0, 1.5, 2.0]), L: tire([1.2, 1.5, 2.0]), v0: tire([0.40, 0.60, 0.80]) }),
    build: (p, q) => {
      const tokens = {
        m: tok(`${nb(p.m, 1)} kg`, 'Masse du chariot', p.m, 'kg'),
        T: tok(`${nb(p.T, 1)} N`, 'Tension du fil (horizontal, vers l’avant)', p.T, 'N'),
        f: tok(`${nb(p.f, 1)} N`, 'Intensité des frottements (opposés au mouvement)', p.f, 'N'),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du rail', p.L, 'm'),
        v0: tok(`${nb(p.v0, 2)} m/s`, 'Vitesse du chariot au début de l’étude', p.v0, 'm/s'),
      };
      const debut = ['Un chariot de masse ', T('m'), ' roule vers l’avant sur un rail horizontal de longueur ', T('L'), '. Il est tiré par un fil horizontal de tension ', T('T'), ' et subit des frottements ', T('f'), ' ; sa vitesse initiale est ', T('v0'), '. Les forces sont constantes ; on prend un axe orienté vers l’avant. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la composante de la somme des forces sur cet axe ?'],
        utiles: ['T', 'f'], raisons: { m: 'La masse ne sert pas pour additionner les forces : elle interviendra quand on passera à l’accélération.', L: 'La longueur du rail n’influence pas la somme des forces.', v0: 'La vitesse ne change pas les forces ici : on ne l’utilise pas pour faire le bilan.' },
        cherche: { bonne: 'La composante ΣF_x de la somme des forces (en N)', faux: ['La composante a_x de l’accélération (en m/s²)', 'Le poids du chariot (en N)', 'La variation de vitesse sur la longueur du rail (en m/s)'] },
        manque: null, solution: { txt: 'ΣF_x = T − f (la tension est vers l’avant : +, les frottements vers l’arrière : −)', val: p.T - p.f, u: 'N' } };
      return { tokens, derivees: [{ id: 'S', nom: 'Composante de la somme des forces', expr: 'ΣF_x = T − f', val: p.T - p.f, u: 'N' }], texte: [...debut, 'Quelle est la composante de l’accélération de son centre de masse sur cet axe ?'],
        utiles: ['m', 'T', 'f'], raisons: { L: 'La longueur du rail ne sert pas : les forces étant constantes, l’accélération ne dépend pas de la position.', v0: 'Une vitesse initiale ne change pas l’accélération, qui est fixée par la somme des forces.' },
        cherche: { bonne: 'La composante a_x de l’accélération (en m/s²)', faux: ['La composante ΣF_x de la somme des forces (en N)', 'La vitesse atteinte au bout du rail (en m/s)', 'La durée de parcours du rail (en s)'] },
        manque: null, solution: { txt: 'a_x = frac(ΣF_x|m), avec ΣF_x = T − f', val: (p.T - p.f) / p.m, u: 'm/s²' } };
    },
  },
  {
    id: 'nwt-sapp-cabine', domaine: 'Deuxième loi de Newton', titre: 'Une cabine d’ascenseur qui démarre', noms: ['Accélération de la cabine', 'Tension du câble'],
    gen: () => ({ m: tire([600, 800, 1000]), v2: tire([1.2, 1.6, 2.0]), dt: tire([2.0, 2.5, 4.0]), H: tire([18, 24, 30]) }),
    build: (p, q) => {
      const tokens = {
        m: tok(`${p.m} kg`, 'Masse de la cabine et de ses occupants', p.m, 'kg'),
        v1: tok('0 m/s', 'Vitesse de la cabine à l’instant initial (elle part de l’arrêt)', 0, 'm/s'),
        v2: tok(`${nb(p.v2, 1)} m/s`, 'Vitesse de la cabine à la fin de la phase de démarrage', p.v2, 'm/s'),
        dt: tok(`${nb(p.dt, 1)} s`, 'Durée de la phase de démarrage', p.dt, 's'),
        H: tok(`${p.H} m`, 'Hauteur de la cage d’ascenseur', p.H, 'm'),
        g: tok('9,8 m/s²', 'Intensité de la pesanteur', 9.8, 'm/s²'),
      };
      const a = p.v2 / p.dt;
      const debut = ['Une cabine de masse ', T('m'), ' part de l’arrêt (', T('v1'), ') et monte dans une cage de hauteur ', T('H'), '. Sa vitesse atteint ', T('v2'), ' au bout de ', T('dt'), ', avec des forces constantes. On prend g = ', T('g'), ' et un axe vertical orienté vers le haut. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la composante de l’accélération de la cabine ?'],
        utiles: ['v1', 'v2', 'dt'], raisons: { m: 'La masse ne sert pas pour calculer une accélération à partir de la vitesse : elle servira pour passer aux forces.', H: 'La hauteur de la cage ne donne pas l’accélération.', g: 'Les frottements et le poids n’interviennent pas dans le calcul de a à partir du mouvement.' },
        cherche: { bonne: 'La composante a_y de l’accélération (en m/s²)', faux: ['La tension T du câble (en N)', 'La distance parcourue pendant le démarrage (en m)', 'Le poids de la cabine (en N)'] },
        manque: null, solution: { txt: 'a_y = frac(v₂ − v₁|Δt)', val: a, u: 'm/s²' } };
      return { tokens, derivees: [{ id: 'a', nom: 'Composante de l’accélération de la cabine', expr: 'a_y = frac(v₂ − v₁|Δt)', val: a, u: 'm/s²' }], texte: [...debut, 'Quelle est l’intensité de la tension du câble ?'],
        utiles: ['m', 'v1', 'v2', 'dt', 'g'], raisons: { H: 'La hauteur de la cage ne sert pas à trouver la tension du câble.' },
        cherche: { bonne: 'La tension T du câble (en N)', faux: ['La composante a_y de l’accélération (en m/s²)', 'La somme des forces ΣF_y (en N)', 'Le poids P de la cabine (en N)'] },
        manque: null, solution: { txt: 'T − P = m × a_y, donc T = m × (g + a_y)', val: p.m * (9.8 + a), u: 'N' } };
    },
  },
  {
    id: 'pes-sapp-lancer', domaine: 'Mouvement dans un champ de pesanteur uniforme', titre: 'Balle lancée depuis une terrasse', noms: ['Composante verticale de la vitesse initiale', 'Date du sommet de la trajectoire'],
    gen: () => ({ m: tire([0.45, 0.50, 0.60]), v0: tire([8, 10, 12, 15]), alpha: tire([30, 40, 50, 60]), h: tire([1.5, 2.0, 2.5]), d: tire([25, 30, 35, 40]) }),
    build: (p, q) => {
      const tokens = {
        m: tok(`${nb(p.m, 2)} kg`, 'Masse de la balle', p.m, 'kg'),
        v0: tok(`${p.v0} m/s`, 'Norme de la vitesse initiale', p.v0, 'm/s'),
        alpha: tok(`${p.alpha}°`, 'Angle du lancer au-dessus de l’horizontale', p.alpha, '°'),
        h: tok(`${nb(p.h, 1)} m`, 'Hauteur de la terrasse (altitude du point de lancer)', p.h, 'm'),
        d: tok(`${p.d} m`, 'Distance entre le pied de la terrasse et un mur', p.d, 'm'),
        g: tok('9,8 m/s²', 'Intensité de la pesanteur', 9.8, 'm/s²'),
      };
      const al = p.alpha * Math.PI / 180, vy0 = p.v0 * Math.sin(al);
      const debut = ['Un joueur lance une balle de masse ', T('m'), ' depuis une terrasse située à ', T('h'), ' au-dessus du sol, avec une vitesse initiale de norme ', T('v0'), ' inclinée de ', T('alpha'), ' au-dessus de l’horizontale. Un mur se trouve à ', T('d'), ' du pied de la terrasse. L’air est négligé ; on prend g = ', T('g'), ' et un axe Oy vertical vers le haut. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la composante verticale de la vitesse initiale ?'],
        utiles: ['v0', 'alpha'], raisons: { m: 'La masse ne joue aucun rôle dans la décomposition d’un vecteur vitesse.', h: 'La hauteur de la terrasse n’intervient pas dans la décomposition de la vitesse initiale.', d: 'La distance au mur ne sert pas à décomposer la vitesse.', g: 'La pesanteur n’intervient pas dans la décomposition de la vitesse initiale.' },
        cherche: { bonne: 'La composante v_y(0) à t = 0 (en m/s)', faux: ['La composante horizontale v_x de la vitesse (en m/s)', 'La date du sommet de la trajectoire (en s)', 'L’altitude maximale atteinte par la balle (en m)'] },
        manque: null, solution: { txt: 'v_y(0) = v_0 sin α', val: vy0, u: 'm/s' } };
      return { tokens, derivees: [{ id: 'vy0', nom: 'Composante verticale de la vitesse initiale', expr: 'v_y(0) = v_0 sin α', val: vy0, u: 'm/s' }], texte: [...debut, 'Quelle est la date du sommet de la trajectoire ?'],
        utiles: ['v0', 'alpha', 'g'], raisons: { m: 'La masse se simplifie dans la deuxième loi de Newton : la date du sommet n’en dépend pas.', h: 'La hauteur de la terrasse change l’altitude du sommet, pas sa date (v_y = 0).', d: 'La distance au mur ne détermine pas la date du sommet.' },
        cherche: { bonne: 'La date t_s du sommet (en s)', faux: ['La durée du vol jusqu’au sol (en s)', 'L’altitude maximale atteinte (en m)', 'La portée au sol (en m)'] },
        manque: null, solution: { txt: 'v_y(t_s) = 0 donne t_s = frac(v_0 sin α|g)', val: vy0 / 9.8, u: 's' } };
    },
  },
  {
    id: 'rda-sapp-fils', domaine: 'Radioactivité : diagramme (N, Z) et équations de désintégration', titre: 'Noyau père, particule émise et noyau fils', noms: ['Nombre de nucléons du noyau fils', 'Nombre de protons du noyau fils'],
    gen: () => {
      // noyaux réels, mode principal et demi-vie (AIEA) : demi-vie en unité d'énoncé, arrondie à 2 chiffres significatifs
      const L = [{ n: 'radium 226', Z: 88, A: 226, mode: 'a', T: [1600, 'ans'] }, { n: 'américium 241', Z: 95, A: 241, mode: 'a', T: [433, 'ans'] }, { n: 'polonium 210', Z: 84, A: 210, mode: 'a', T: [138, 'jours'] }, { n: 'radon 222', Z: 86, A: 222, mode: 'a', T: [3.8, 'jours'] },
        { n: 'cobalt 60', Z: 27, A: 60, mode: 'b-', T: [5.3, 'ans'] }, { n: 'iode 131', Z: 53, A: 131, mode: 'b-', T: [8.0, 'jours'] }, { n: 'césium 137', Z: 55, A: 137, mode: 'b-', T: [30, 'ans'] }, { n: 'strontium 90', Z: 38, A: 90, mode: 'b-', T: [29, 'ans'] },
        { n: 'fluor 18', Z: 9, A: 18, mode: 'b+', T: [110, 'minutes'] }, { n: 'carbone 11', Z: 6, A: 11, mode: 'b+', T: [20, 'minutes'] }, { n: 'sodium 22', Z: 11, A: 22, mode: 'b+', T: [2.6, 'ans'] }];
      return tire(L);
    },
    build: (p, q) => {
      const part = { a: { A: 4, Z: 2, txt: 'une particule α' }, 'b-': { A: 0, Z: -1, txt: 'un électron' }, 'b+': { A: 0, Z: 1, txt: 'un positon' } }[p.mode];
      const NOM = { a: 'α', 'b-': 'β⁻', 'b+': 'β⁺' }[p.mode];
      const tokens = {
        A: tok(`A = ${p.A}`, 'Nombre de nucléons du noyau père', p.A, ''),
        Z: tok(`Z = ${p.Z}`, 'Nombre de protons du noyau père', p.Z, ''),
        Ap: tok(`A = ${part.A}`, 'Nombre de nucléons de la particule émise', part.A, ''),
        Zp: tok(`Z = ${sg(part.Z)}`, 'Charge (nombre de charges élémentaires) de la particule émise', part.Z, ''),
        T: tok(`${nb(p.T[0], Number.isInteger(p.T[0]) ? 0 : 1)} ${p.T[1]}`, 'Demi-vie du noyau père', p.T[0], p.T[1]),
      };
      const debut = [`Un échantillon ${/^[aeiouyhéèâî]/i.test(p.n) ? 'd’' : 'de '}${p.n} (noyau père : `, T('A'), ', ', T('Z'), `) est radioactif ${NOM}. Sa demi-vie est de `, T('T'), `. Chaque noyau se désintègre en émettant ${part.txt} (`, T('Ap'), ', ', T('Zp'), '). '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le nombre de nucléons du noyau fils ?'],
        utiles: ['A', 'Ap'], raisons: { Z: 'Z du père sert à la charge, pas au nombre de nucléons.', Zp: 'La charge de la particule sert à calculer Z du noyau fils, pas son nombre de nucléons.', T: 'La demi-vie décrit la rapidité de la décroissance : elle ne joue aucun rôle dans l’équation de désintégration.' },
        cherche: { bonne: 'Le nombre de nucléons A du noyau fils', faux: ['Le nombre de protons Z du noyau fils', 'Le nombre de noyaux restant dans l’échantillon', 'La durée avant la désintégration d’un noyau donné'] },
        manque: null, solution: { txt: 'Conservation de A : A du fils = A du père − A de la particule', val: p.A - part.A, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le nombre de protons Z du noyau fils ?'],
        utiles: ['Z', 'Zp'], raisons: { A: 'Le nombre de nucléons sert à calculer A du noyau fils, pas Z.', Ap: 'Le nombre de nucléons de la particule sert à calculer A du noyau fils, pas Z.', T: 'La demi-vie ne joue aucun rôle dans l’équation de désintégration.' },
        cherche: { bonne: 'Le nombre de protons Z du noyau fils', faux: ['Le nombre de nucléons A du noyau fils', 'L’activité de l’échantillon après une demi-vie', 'Le nombre de neutrons du noyau père'] },
        manque: null, solution: { txt: 'Conservation de la charge : Z du fils = Z du père − Z de la particule', val: p.Z - part.Z, u: '' } };
    },
  },
  {
    id: 'pes-sapp-energie', domaine: 'Mouvement dans un champ de pesanteur uniforme', titre: 'Vitesse d’arrivée d’un projectile', noms: ['Variation d’énergie cinétique', 'Vitesse à l’arrivée au sol'],
    gen: () => {
      // la durée du vol affichée est celle du modèle (racine positive de y(t) = 0), arrondie au dixième : les données sont cohérentes entre elles
      const v0 = tire([8, 10, 12, 15]), alpha = tire([30, 40, 50, 60]), h = tire([3.0, 5.0, 8.0, 12.0]), vy = v0 * Math.sin(alpha * Math.PI / 180);
      return { m: tire([0.30, 0.45, 0.60, 2.0]), v0, alpha, h, tv: Math.round((vy + Math.sqrt(vy * vy + 2 * 9.8 * h)) / 9.8 * 10) / 10 };
    },
    build: (p, q) => {
      const tokens = {
        m: tok(`${nb(p.m, 2)} kg`, 'Masse du projectile', p.m, 'kg'),
        v0: tok(`${p.v0} m/s`, 'Norme de la vitesse initiale', p.v0, 'm/s'),
        alpha: tok(`${p.alpha}°`, 'Angle du lancer au-dessus de l’horizontale', p.alpha, '°'),
        h: tok(`${nb(p.h, 1)} m`, 'Dénivelée entre le point de lancer et le sol', p.h, 'm'),
        tv: tok(`${nb(p.tv, 1)} s`, 'Durée du vol mesurée à la vidéo', p.tv, 's'),
        g: tok('9,8 m/s²', 'Intensité de la pesanteur', 9.8, 'm/s²'),
      };
      const dEc = p.m * 9.8 * p.h, vf = Math.sqrt(p.v0 * p.v0 + 2 * 9.8 * p.h);
      const debut = ['Un projectile de masse ', T('m'), ' est lancé depuis un point situé à ', T('h'), ' au-dessus du sol, avec une vitesse initiale de norme ', T('v0'), ' inclinée de ', T('alpha'), ' au-dessus de l’horizontale. Sur la vidéo, la durée du vol est ', T('tv'), '. L’air est négligé ; g = ', T('g'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la variation d’énergie cinétique du projectile entre le lancer et l’arrivée au sol ?'],
        utiles: ['m', 'h', 'g'], raisons: { v0: 'La vitesse initiale n’intervient pas : seul le travail du poids (m g h) fixe la variation d’énergie cinétique.', alpha: 'L’angle du lancer ne change pas le travail du poids, qui ne dépend que de la dénivelée.', tv: 'La durée du vol n’est pas nécessaire : le théorème de l’énergie cinétique se passe du temps.' },
        cherche: { bonne: 'La variation ΔE_c d’énergie cinétique (en J)', faux: ['La norme de la vitesse à l’arrivée (en m/s)', 'L’énergie mécanique du projectile au lancer (en J)', 'La portée du lancer (en m)'] },
        manque: null, solution: { txt: 'ΔE_c = W(vec(P)) = m g h', val: dEc, u: 'J' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la norme de la vitesse du projectile à l’arrivée au sol ?'],
        utiles: ['v0', 'h', 'g'], raisons: { m: 'La masse se simplifie dans le théorème de l’énergie cinétique : la vitesse d’arrivée n’en dépend pas.', alpha: 'Le théorème de l’énergie cinétique ne dépend pas de la direction du lancer, seulement de v_0 et de la dénivelée.', tv: 'On n’a pas besoin de la durée du vol : le théorème de l’énergie cinétique relie directement les vitesses et la dénivelée.' },
        cherche: { bonne: 'La norme v_f de la vitesse à l’arrivée (en m/s)', faux: ['La composante verticale de la vitesse initiale (en m/s)', 'La variation d’énergie cinétique (en J)', 'La vitesse moyenne du vol (en m/s)'] },
        manque: null, solution: { txt: 'frac(1|2) m v_f² − frac(1|2) m v_0² = m g h, donc v_f = sqrt(v_0² + 2 g h)', val: vf, u: 'm/s' } };
    },
  },
  // ───────────────────────────── Incertitudes-types composées et comparaison à une référence (TG, sim 185)
  {
    id: 'icc-sapp-resistance', schema: () => ({ type: 'circuitSimple', dipole: 'conducteur ohmique', generateur: 'générateur', appareils: true }), domaine: 'Incertitudes-types composées et comparaison à une valeur de référence', titre: 'Incertitude sur la résistance d’un conducteur ohmique', noms: ['Incertitude relative de la résistance', 'Incertitude-type de la résistance'],
    gen: () => ({ U: tire([3.50, 4.58, 5.20, 6.30, 7.40, 9.10]), uU: tire([0.02, 0.03, 0.05, 0.10]), I: tire([25.0, 32.5, 45.1, 52.0, 68.4, 85.0]), uI: tire([0.3, 0.5, 0.8, 1.0]), th: tire([19, 21, 23]), L: tire([0.5, 1.0, 1.5]) }),
    build: (p, q) => {
      const R = 1000 * p.U / p.I, rel = Math.sqrt((p.uU / p.U) ** 2 + (p.uI / p.I) ** 2);
      const tokens = {
        U: tok(`${nb(p.U, 2)} V`, 'Tension mesurée aux bornes du conducteur', p.U, 'V'),
        uU: tok(`${nb(p.uU, 2)} V`, 'Incertitude-type sur la tension', p.uU, 'V'),
        I: tok(`${nb(p.I, 1)} mA`, 'Intensité mesurée', p.I / 1000, 'A'),
        uI: tok(`${nb(p.uI, 1)} mA`, 'Incertitude-type sur l’intensité', p.uI / 1000, 'A'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur des fils de connexion', p.L, 'm'),
      };
      const debut = ['Un élève mesure la tension ', T('U'), ' aux bornes d’un conducteur ohmique, avec une incertitude-type ', T('uU'), ', et l’intensité ', T('I'), ' qui le traverse, avec une incertitude-type ', T('uI'), '. La salle est à ', T('th'), ' et les fils de connexion mesurent ', T('L'), '. On suppose les deux mesures indépendantes. La résistance se calcule par R = frac(U|I). '];
      const raisons = { th: 'La température de la salle n’intervient pas dans la composition des incertitudes-types.', L: 'La longueur des fils ne sert pas à composer les incertitudes de U et de I.' };
      if (q === 0) return { tokens, derivees: ['frac(u(U)|U) et frac(u(I)|I) : incertitudes relatives de chaque grandeur'], texte: [...debut, 'Quelle est l’incertitude relative de la résistance, c’est-à-dire u(R) rapportée à R ?'],
        utiles: ['U', 'uU', 'I', 'uI'], raisons,
        cherche: { bonne: 'L’incertitude relative de R (en %)', faux: ['La résistance R du conducteur (en Ω)', 'L’incertitude relative sur la tension seule (en %)', 'La puissance dissipée dans le conducteur (en W)'] },
        manque: null, solution: { txt: 'frac(u(R)|R) = sqrt(frac(u(U)|U)² + frac(u(I)|I)²)', val: 100 * rel, u: '%' } };
      return { tokens, derivees: ['R = frac(U|I) : valeur calculée de la résistance', 'frac(u(R)|R) : incertitude relative, composée avec la formule du quotient'], texte: [...debut, 'Quelle est l’incertitude-type u(R) de la résistance ?'],
        utiles: ['U', 'uU', 'I', 'uI'], raisons,
        cherche: { bonne: 'L’incertitude-type u(R) de R (en Ω)', faux: ['L’incertitude relative de la résistance (en %)', 'La résistance R du conducteur (en Ω)', 'L’incertitude-type u(I) de l’intensité (en A)'] },
        manque: null, solution: { txt: 'u(R) = R × sqrt(frac(u(U)|U)² + frac(u(I)|I)²)', val: R * rel, u: 'Ω' } };
    },
  },
  {
    id: 'icc-sapp-reference', domaine: 'Incertitudes-types composées et comparaison à une valeur de référence', titre: 'Un cylindre est-il en aluminium ?', noms: ['Quotient de comparaison à la valeur de référence'],
    gen: () => ({ rho: tire([2.71, 2.74, 2.77, 2.82, 2.88, 2.95]), u: tire([0.02, 0.03, 0.05, 0.08]), m: tire([54.2, 63.8, 71.5]), th: tire([19, 21, 23]) }),
    build: (p) => {
      const tokens = {
        rho: tok(`${nb(p.rho, 2)} g/cm³`, 'Masse volumique du cylindre, déduite des mesures', p.rho, 'g/cm³'),
        u: tok(`${nb(p.u, 2)} g/cm³`, 'Incertitude-type de cette masse volumique', p.u, 'g/cm³'),
        ref: tok('2,70 g/cm³', 'Valeur de référence de l’aluminium pur (table)', 2.70, 'g/cm³'),
        m: tok(`${nb(p.m, 1)} g`, 'Masse du cylindre', p.m, 'g'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
      };
      return { tokens, derivees: ['l’écart entre le résultat et la référence, en valeur absolue'], texte: ['Un élève veut savoir si un cylindre est en aluminium. Il en déduit une masse volumique ', T('rho'), ' avec une incertitude-type ', T('u'), '. Le cylindre, de masse ', T('m'), ', est dans une salle à ', T('th'), '. La table donne pour l’aluminium pur ', T('ref'), ' (valeur de référence, supposée connue sans incertitude). On compare le résultat à la référence avec le quotient z. Que calcule-t-on ?'],
        utiles: ['rho', 'u', 'ref'], raisons: { m: 'La masse a déjà servi à calculer la masse volumique : le quotient de comparaison n’en a plus besoin.', th: 'La température de la salle n’intervient pas dans le quotient de comparaison.' },
        cherche: { bonne: 'Le quotient z : écart divisé par u (sans unité)', faux: ['L’incertitude-type u(ρ) du résultat (en g/cm³)', 'L’écart relatif à la valeur de référence (sans unité)', 'La masse volumique corrigée du cylindre (en g/cm³)'] },
        manque: null, solution: { txt: 'z = frac(écart|u(ρ)), où écart = |ρ_mes − ρ_ref| (valeur absolue)', val: Math.abs(p.rho - 2.70) / p.u, u: '' } };
    },
  },
  // ───────────────────────────── Particule chargée dans un condensateur plan (TG, sim 176) : champ entre les plaques, accélération
  {
    id: 'cpl-sapp-particule', schema: () => ({ type: 'plaques', objet: 'particule chargée' }), domaine: 'Particule chargée dans un condensateur plan', titre: 'Une particule entre dans un condensateur plan', noms: ['Champ électrique entre les plaques', 'Accélération de la particule'],
    gen: () => {
      const pa = tire([{ nom: 'un électron', z: -1, m: 9.11e-31, v: [1.0e7, 2.0e7, 3.0e7] }, { nom: 'un proton', z: 1, m: 1.67e-27, v: [2.0e5, 5.0e5, 1.0e6] }, { nom: 'un ion sodium Na⁺', z: 1, m: 3.82e-26, v: [5.0e4, 1.0e5, 2.0e5] }]);
      return { pa, U: tire([200, 300, 400, 500, 800, 1000]), d: tire([1.0, 1.5, 2.0]), L: tire([4.0, 5.0, 6.0, 8.0]), v0: tire(pa.v), T: tire([19, 21, 23]) };
    },
    build: (p, q) => {
      const tokens = {
        U: tok(`${p.U} V`, 'Tension entre les plaques', p.U, 'V'),
        d: tok(`${nb(p.d, 1)} cm`, 'Distance entre les plaques', p.d, 'cm'),
        q: tok(`${p.pa.z < 0 ? '−' : ''}1,60 × 10⁻¹⁹ C`, 'Charge de la particule', Math.abs(p.pa.z) * 1.60e-19, 'C'),
        m: tok(`${sci3(p.pa.m)} kg`, 'Masse de la particule', p.pa.m, 'kg'),
        v0: tok(`${sciR(p.v0)} m/s`, 'Vitesse d’entrée de la particule', p.v0, 'm/s'),
        L: tok(`${nb(p.L, 1)} cm`, 'Longueur des plaques', p.L, 'cm'),
        T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
      };
      const debut = ['Dans le vide, ', p.pa.nom, ' de charge ', T('q'), ' et de masse ', T('m'), ' entre avec la vitesse ', T('v0'), ' au milieu de deux plaques parallèles longues de ', T('L'), ', distantes de ', T('d'), ' et soumises à la tension ', T('U'), '. La salle est à ', T('T'), '. '];
      const E = p.U / (p.d / 100);
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la norme du champ électrique entre les plaques ?'], utiles: ['U', 'd'],
        raisons: { q: 'La charge de la particule ne change pas le champ créé par les plaques : elle intervient dans la force qu’elle subit.', m: 'La masse n’intervient ni dans le champ ni dans la force électrique, seulement dans l’accélération.', v0: 'Le champ est créé par les plaques : il ne dépend pas de la vitesse de la particule.', L: 'Le champ est uniforme : sa norme ne dépend pas de la longueur des plaques.', T: 'La température de la salle ne joue aucun rôle dans ce modèle.' },
        cherche: { bonne: 'La norme E du champ (en V/m)', faux: ['La norme F de la force électrique (en N)', 'La déviation de la particule à la sortie (en mm)', 'La durée de la traversée des plaques (en ns)'] },
        manque: null, solution: { txt: 'E = frac(U|d) (convertir d en mètres)', val: E, u: 'V/m' } };
      return { tokens, derivees: [{ id: 'E', nom: 'Norme du champ électrique entre les plaques', expr: 'E = frac(U|d)', val: E, u: 'V/m' }], texte: [...debut, 'Quelle est la norme de l’accélération de la particule (poids négligé) ?'], utiles: ['U', 'd', 'q', 'm'],
        raisons: { v0: 'L’accélération est fixée par la force électrique et la masse : elle ne dépend pas de la vitesse d’entrée.', L: 'La longueur des plaques intervient dans la déviation à la sortie, pas dans l’accélération.', T: 'La température de la salle ne joue aucun rôle dans ce modèle.' },
        cherche: { bonne: 'La norme a de l’accélération (en m/s²)', faux: ['La norme E du champ électrique entre les plaques (en V/m)', 'La déviation de la particule à la sortie (en mm)', 'La vitesse de la particule à la sortie (en m/s)'] },
        manque: null, solution: { txt: 'a = frac(|q| × E|m), avec E = frac(U|d)', val: Math.abs(p.pa.z) * 1.60e-19 * E / p.pa.m, u: 'm/s²' } };
    },
  },
  // ───────────────────────────── Vecteurs vitesse et accélération (TG, sim 166) : exploiter une chronophotographie
  {
    id: 'vac-sapp-chrono', domaine: 'Vecteurs vitesse et accélération', titre: 'Exploiter une chronophotographie', noms: ['Vitesse au point M4', 'Accélération au point M4'],
    gen: () => {
      const tau = tire([0.20, 0.50, 1.0]), v = tire([2.0, 3.0, 4.0, 5.0]), a = tire([0.5, 1.0, 1.5, -0.5, -1.0, -1.5]), xa = tire([1.0, 2.0, 4.0]);
      const xb = Number((xa + 2 * tau * v).toFixed(3)), x4 = Number(((xa + xb) / 2 - a * tau * tau / 2).toFixed(3));
      return { tau, v, a, xa, xb, x4, m: tire([800, 1200, 1500]) };
    },
    build: (p, q) => {
      const tokens = {
        tau: tok(`${nb(p.tau, 2)} s`, 'Durée entre deux photographies successives', p.tau, 's'),
        m: tok(`${p.m} kg`, 'Masse du mobile', p.m, 'kg'),
      };
      const debut = ['Un mobile de masse ', T('m'), ' se déplace sur l’axe Ox ; on le photographie toutes les ', T('tau'), ' (chronophotographie). '];
      if (q === 0) {
        tokens.x3 = tok(`${nb(p.xa, 2)} m`, 'Position (abscisse) du point M3', p.xa, 'm');
        tokens.x4 = tok(`${nb(p.x4, 3)} m`, 'Position (abscisse) du point M4', p.x4, 'm');
        tokens.x5 = tok(`${nb(p.xb, 2)} m`, 'Position (abscisse) du point M5', p.xb, 'm');
        return { tokens, derivees: [], texte: [...debut, 'Le point M3 est à ', T('x3'), ' de l’origine, le point M4 à ', T('x4'), ' et le point M5 à ', T('x5'), '. Quelle est la vitesse du mobile au point M4 ?'],
          utiles: ['x3', 'x5', 'tau'], raisons: { x4: 'La position du point M4 lui-même ne sert pas : la vitesse s’obtient avec la variation de position entre le point précédent (M3) et le point suivant (M5).', m: 'La masse ne joue aucun rôle dans la description du mouvement (la cinématique décrit le mouvement sans en chercher la cause).' },
          cherche: { bonne: 'La coordonnée v_x du vecteur vitesse en M4 (en m/s)', faux: ['La coordonnée a_x du vecteur accélération en M4 (en m/s²)', 'La distance parcourue entre M3 et M5 (en m)', 'La durée du trajet entre M3 et M5 (en s)'] },
          manque: null, solution: { txt: 'v_x(4) ≈ frac(x_5 − x_3|2τ) (des m divisés par des s donnent des m/s)', val: p.v, u: 'm/s' } };
      }
      tokens.x3 = tok(`${nb(p.xa, 2)} m`, 'Position (abscisse) du point M3', p.xa, 'm');
      tokens.v3 = tok(`${nb(p.v - p.a * p.tau, 3)} m/s`, 'Coordonnée de la vitesse au point M3 (déjà estimée)', p.v - p.a * p.tau, 'm/s');
      tokens.v5 = tok(`${nb(p.v + p.a * p.tau, 3)} m/s`, 'Coordonnée de la vitesse au point M5 (déjà estimée)', p.v + p.a * p.tau, 'm/s');
      return { tokens, derivees: [], texte: [...debut, 'Le point M3 est à ', T('x3'), ' de l’origine. On a déjà estimé la vitesse en M3 : ', T('v3'), ', puis en M5 : ', T('v5'), '. Quelle est l’accélération du mobile au point M4 ?'],
        utiles: ['v3', 'v5', 'tau'], raisons: { x3: 'Les positions ont déjà servi à estimer les vitesses : pour l’accélération, on utilise ces vitesses.', m: 'La masse ne joue aucun rôle dans la description du mouvement (la cinématique décrit le mouvement sans en chercher la cause).' },
        cherche: { bonne: 'La coordonnée a_x de l’accélération en M4 (m/s²)', faux: ['La coordonnée v_x du vecteur vitesse en M4 (en m/s)', 'La variation de vitesse entre M3 et M5 (en m/s)', 'La force exercée sur le mobile (en N)'] },
        manque: null, solution: { txt: 'a_x(4) ≈ frac(v_x(5) − v_x(3)|2τ) (des m/s divisés par des s donnent des m/s²)', val: p.a, u: 'm/s²' } };
    },
  },
  // ───────────────────────────── Vecteurs vitesse et accélération (TG, sim 166) : dériver la position x(t) d’un mobile
  {
    id: 'vac-sapp-derivee', schema: () => ({ type: 'mobile', objet: 'chariot', sol: 'rail' }), domaine: 'Vecteurs vitesse et accélération', titre: 'Dériver la position d’un chariot', noms: ['Vitesse à une date donnée', 'Accélération du chariot'],
    gen: () => {
      // on écarte les tirages où une réponse fausse classique (B seul, vitesse moyenne, position, 2C, constante A non annulée) tomberait à 12 % de la bonne
      for (;;) {
        const A = tire([1.0, 2.0, 3.0]), B = tire([1.0, 2.0, 3.0]), C = tire([0.50, 1.0, 1.5, 2.0]), t1 = tire([2.0, 3.0, 4.0]), v = B + 2 * C * t1;
        if ([B, B + C * t1, A + B * t1 + C * t1 * t1, 2 * C, v + A].every(x => Math.abs(x - v) > 0.12 * v)) return { A, B, C, t1, m: tire([0.50, 1.0, 2.0]) };
      }
    },
    build: (p, q) => {
      const tokens = {
        A: tok(`${nb(p.A, 1)} m`, 'Terme constant de x(t) : position du chariot à la date t = 0', p.A, 'm'),
        B: tok(`${nb(p.B, 1)} m/s`, 'Coefficient du terme en t de x(t)', p.B, 'm/s'),
        C: tok(`${nb(p.C, 2)} m/s²`, 'Coefficient du terme en t² de x(t)', p.C, 'm/s²'),
        m: tok(`${nb(p.m, 2)} kg`, 'Masse du chariot', p.m, 'kg'),
      };
      const debut = ['Un chariot se déplace sur l’axe Ox. Sa position est donnée par x(t) = A + B·t + C·t² (x en m, t en s), avec A = ', T('A'), ', B = ', T('B'), ' et C = ', T('C'), '. Sa masse est ', T('m'), '. '];
      const mTexte = 'La masse ne joue aucun rôle dans la description du mouvement (la cinématique décrit le mouvement sans en chercher la cause).';
      if (q === 0) {
        tokens.t1 = tok(`${nb(p.t1, 1)} s`, 'Date à laquelle on étudie le chariot', p.t1, 's');
        return { tokens, derivees: [], texte: [...debut, 'On étudie le chariot à la date ', T('t1'), '. Quelle est la coordonnée de sa vitesse à cet instant ?'],
          utiles: ['B', 'C', 't1'], raisons: { A: 'Le terme constant A disparaît quand on dérive : la position initiale ne change pas la vitesse.', m: mTexte },
          cherche: { bonne: 'La coordonnée v_x de la vitesse à la date t₁ (en m/s)', faux: ['La position x(t₁) du chariot à cette date (en m)', 'La coordonnée a_x de l’accélération (en m/s²)', 'La vitesse moyenne entre t = 0 et t = t₁ (en m/s)'] },
          manque: null, solution: { txt: 'v_x(t) = frac(dx|dt) = B + 2C·t, donc v_x(t₁) = B + 2C·t₁', val: p.B + 2 * p.C * p.t1, u: 'm/s' } };
      }
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la coordonnée de son accélération ?'],
        utiles: ['C'], raisons: { A: 'Le terme constant A disparaît dès la première dérivation : il n’intervient ni dans la vitesse, ni dans l’accélération.', B: 'Le terme en B·t donne une vitesse constante B : sa dérivée est nulle, il n’intervient pas dans l’accélération.', m: mTexte },
        cherche: { bonne: 'La coordonnée a_x de l’accélération (en m/s²)', faux: ['La coordonnée v_x de la vitesse à la date t = 0 (en m/s)', 'La force exercée sur le chariot (en N)', 'La position x du chariot à la date t = 0 (en m)'] },
        manque: null, solution: { txt: 'v_x(t) = frac(dx|dt) = B + 2C·t puis a_x = frac(dv_x|dt) = 2C', val: 2 * p.C, u: 'm/s²' } };
    },
  },
  // ───────────────────────────── Pile (TG) : capacité à partir de la constitution initiale, durée de fonctionnement
  {
    id: 'pil-sapp-capacite', domaine: 'Piles : fonctionnement et capacité', titre: 'Capacité d’une pile zinc-cuivre', noms: ['Quantité d’ions cuivre initiale', 'Capacité électrique de la pile'],
    gen: () => ({ c: tire([0.050, 0.10, 0.20]), V: tire([50, 100, 150]), m: tire([3.0, 4.0, 5.0]), V2: tire([100, 150, 200]), U: tire([1.08, 1.10]), T: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        c: tok(`${nb(p.c, 2)} mol/L`, 'Concentration de la solution de sulfate de cuivre', p.c, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de la solution de sulfate de cuivre', p.V / 1000, 'L'),
        m: tok(`${nb(p.m, 1)} g`, 'Masse de la partie immergée de la lame de zinc', p.m, 'g'),
        M: tok('65,4 g/mol', 'Masse molaire du zinc', 65.4, 'g/mol'),
        V2: tok(`${p.V2} mL`, 'Volume de la solution de sulfate de zinc', p.V2 / 1000, 'L'),
        U: tok(`${nb(p.U, 2)} V`, 'Tension à vide mesurée', p.U, 'V'),
        T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
        F: tok('9,65 × 10⁴ C/mol', 'Charge d’une mole d’électrons (constante de Faraday)', 96500, 'C/mol'),
      };
      const debut = ['Une pile est formée d’une lame de cuivre plongeant dans ', T('V'), ' de solution de sulfate de cuivre à ', T('c'), ', et d’une lame de zinc (partie immergée : ', T('m'), ' ; M(Zn) = ', T('M'),
        ') plongeant dans ', T('V2'), ' de solution de sulfate de zinc. Un pont salin relie les deux solutions ; à ', T('T'), ', sa tension à vide vaut ', T('U'),
        '. Réaction de fonctionnement : Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s) ; F = ', T('F'), '. '];
      const nCu = p.c * p.V / 1000;
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité d’ions Cu²⁺ la pile contient-elle au départ ?'],
        utiles: ['c', 'V'], raisons: { m: 'La masse de zinc concerne l’autre réactif, pas les ions Cu²⁺.', M: 'La masse molaire du zinc ne sert qu’à calculer la quantité de zinc.', V2: 'Ce volume est celui de la solution de sulfate de zinc, pas de la solution d’ions Cu²⁺.', U: 'La tension à vide ne renseigne pas sur une quantité de matière.', T: 'La température n’intervient pas dans le calcul d’une quantité de matière.', F: 'La constante de Faraday sert à passer aux charges électriques, pas à compter les ions.' },
        cherche: { bonne: 'La quantité initiale d’ions Cu²⁺ (en mol)', faux: ['La capacité électrique de la pile (en C)', 'La quantité de zinc de la lame (en mol)', 'La concentration finale en ions Zn²⁺ (en mol/L)'] },
        manque: null, solution: { txt: 'n(Cu²⁺) = c × V', val: nCu, u: 'mol' } };
      return { tokens, derivees: [{ id: 'nCu', nom: 'Quantité initiale d’ions Cu²⁺', expr: 'n(Cu²⁺) = c × V', val: nCu, u: 'mol' }, { id: 'nZn', nom: 'Quantité initiale de zinc', expr: 'n(Zn) = frac(m|M)', val: p.m / 65.4, u: 'mol' }, { id: 'ne', nom: 'Quantité d’électrons échangés (réactif limitant)', expr: 'n(e⁻) = 2 × x_max', val: 2 * Math.min(nCu, p.m / 65.4), u: 'mol' }], texte: [...debut, 'Quelle est la capacité électrique de cette pile ?'],
        utiles: ['c', 'V', 'm', 'M', 'F'], raisons: { V2: 'Le volume de la solution de sulfate de zinc ne change pas la quantité des réactifs Zn et Cu²⁺.', U: 'La tension à vide ne dépend pas de la quantité de réactifs : elle ne sert pas à calculer la capacité.', T: 'La température n’intervient pas dans le bilan de matière.' },
        cherche: { bonne: 'La capacité Q de la pile (en C)', faux: ['La tension à vide de la pile (en V)', 'La quantité initiale d’ions Cu²⁺ (en mol)', 'La masse de cuivre déposée (en g)'] },
        manque: null, solution: { txt: 'Q = n(e⁻) × F = 2 × x_max × F', val: 2 * Math.min(nCu, p.m / 65.4) * 96500, u: 'C' } };
    },
  },
  {
    id: 'pil-sapp-duree', domaine: 'Piles : fonctionnement et capacité', titre: 'Combien de temps la pile fonctionnera-t-elle ?', noms: ['Durée de fonctionnement', 'Charge déjà débitée'],
    gen: () => ({ Q: tire([1200, 1900, 2900, 3900]), I: tire([20, 40, 50, 80]), t: tire([2.0, 3.0, 4.0]), U: tire([1.10, 0.78, 1.53]), mp: tire([180, 250, 320]) }),
    build: (p, q) => {
      const tokens = {
        Q: tok(`${nb(p.Q)} C`, 'Capacité électrique de la pile', p.Q, 'C'),
        I: tok(`${p.I} mA`, 'Intensité du courant débité (constante)', p.I / 1000, 'A'),
        t: tok(`${nb(p.t, 1)} h`, 'Durée de fonctionnement déjà écoulée', p.t * 3600, 's'),
        U: tok(`${nb(p.U, 2)} V`, 'Tension à vide de la pile', p.U, 'V'),
        mp: tok(`${p.mp} g`, 'Masse totale du montage', p.mp, 'g'),
      };
      const debut = ['Une pile de laboratoire a une capacité de ', T('Q'), ' et une tension à vide de ', T('U'), ' ; le montage complet pèse ', T('mp'), '. Elle alimente un petit moteur et débite un courant d’intensité constante ', T('I'), '. Elle fonctionne déjà depuis ', T('t'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'IA', nom: 'Intensité du courant en ampères', expr: 'I = frac(I (en mA)|1000)', val: p.I / 1000, u: 'A' }], texte: [...debut, 'Quelle est la durée totale de fonctionnement de la pile, depuis sa mise en service ?'],
        utiles: ['Q', 'I'], raisons: { t: 'La durée déjà écoulée ne change pas la durée totale de fonctionnement.', U: 'La tension à vide n’intervient pas dans la relation Q = I × Δt.', mp: 'La masse du montage n’intervient pas dans la durée de fonctionnement.' },
        cherche: { bonne: 'La durée totale de fonctionnement (en s)', faux: ['La charge déjà débitée par la pile (en C)', 'L’énergie stockée dans la pile au départ (en J)', 'La tension aux bornes du moteur (en V)'] },
        manque: null, solution: { txt: 'Δt = frac(Q|I)', val: p.Q / (p.I / 1000), u: 's' } };
      return { tokens, derivees: [{ id: 'IA', nom: 'Intensité du courant en ampères', expr: 'I = frac(I (en mA)|1000)', val: p.I / 1000, u: 'A' }, { id: 'ts', nom: 'Durée écoulée en secondes', expr: 'Δt = 3 600 × durée en h', val: p.t * 3600, u: 's' }], texte: [...debut, 'Quelle charge électrique la pile a-t-elle déjà débitée ?'],
        utiles: ['I', 't'], raisons: { Q: 'La capacité est la charge maximale ; on demande ici la charge réellement débitée jusqu’à maintenant.', U: 'La tension à vide n’intervient pas dans la relation Q = I × Δt.', mp: 'La masse du montage n’intervient pas dans la charge débitée.' },
        cherche: { bonne: 'La charge déjà débitée (en C)', faux: ['La durée totale de fonctionnement (en h)', 'La capacité électrique de la pile (en C)', 'L’intensité maximale du courant (en A)'] },
        manque: null, solution: { txt: 'Q = I × Δt', val: (p.I / 1000) * p.t * 3600, u: 'C' } };
    },
  },
  // ───────────────────────────── Électrolyse (TG) : zingage d'une pièce, recharge d'un accumulateur
  {
    id: 'ely-sapp-zingage', domaine: 'Électrolyse : forcer le sens d’évolution', titre: 'Déposer du zinc par électrolyse', noms: ['Charge électrique passée', 'Quantité de zinc déposé'],
    gen: () => ({ I: tire([0.20, 0.50, 1.0]), t: tire([10, 20, 30]), U: tire([2.5, 3.0]), S: tire([12, 20, 25]), c: tire([0.50, 1.0]), Vb: tire([1.0, 2.0]) }),
    build: (p, q) => {
      const tokens = {
        I: tok(`${nb(p.I, 2)} A`, 'Intensité du courant (constante)', p.I, 'A'),
        t: tok(`${p.t} min`, 'Durée de l’électrolyse', p.t * 60, 's'),
        U: tok(`${nb(p.U, 1)} V`, 'Tension du générateur', p.U, 'V'),
        S: tok(`${p.S} cm²`, 'Surface de la pièce à recouvrir', p.S, 'cm²'),
        c: tok(`${nb(p.c, 2)} mol/L`, 'Concentration du bain de sulfate de zinc', p.c, 'mol/L'),
        Vb: tok(`${nb(p.Vb, 1)} L`, 'Volume du bain', p.Vb, 'L'),
        M: tok('65,4 g/mol', 'Masse molaire du zinc', 65.4, 'g/mol'),
        F: tok('9,65 × 10⁴ C/mol', 'Charge d’une mole d’électrons (constante de Faraday)', 96500, 'C/mol'),
      };
      const debut = ['Pour protéger de la corrosion une pièce d’acier de ', T('S'), ', on la recouvre de zinc par électrolyse (zingage). La pièce, reliée à la borne − d’un générateur réglé sur ', T('U'), ', plonge dans ', T('Vb'),
        ' d’une solution de sulfate de zinc à ', T('c'), '. Le générateur fait passer un courant d’intensité constante ', T('I'), ' pendant ', T('t'), '. Sur la pièce : Zn²⁺(aq) + 2 e⁻ → Zn(s) ; M(Zn) = ', T('M'), ' ; F = ', T('F'), '. '];
      const Q = p.I * p.t * 60;
      const rU = 'La tension du générateur doit être assez grande pour forcer la réaction, mais elle n’intervient pas dans le calcul des quantités.';
      const rS = 'La surface de la pièce fixe l’épaisseur du dépôt, pas la quantité de zinc déposé.';
      const rc = 'La concentration du bain ne limite pas le dépôt tant qu’il reste des ions Zn²⁺ (le bain en contient beaucoup).';
      const rV = 'Le volume du bain ne limite pas le dépôt : il reste largement assez d’ions Zn²⁺.';
      if (q === 0) return { tokens, derivees: [{ id: 'ts', nom: 'Durée en secondes', expr: 'Δt = 60 × durée en min', val: p.t * 60, u: 's' }], texte: [...debut, 'Quelle charge électrique a traversé le circuit pendant l’électrolyse ?'],
        utiles: ['I', 't'], raisons: { U: rU, S: rS, c: rc, Vb: rV, M: 'La masse molaire ne sert qu’à calculer une masse de zinc, non demandée ici.', F: 'La constante de Faraday sert à passer de la charge aux quantités de matière, pas à calculer la charge.' },
        cherche: { bonne: 'La charge électrique Q passée (en C)', faux: ['La quantité de zinc déposé (en mol)', 'L’épaisseur du dépôt de zinc (en µm)', 'L’énergie fournie par le générateur (en J)'] },
        manque: null, solution: { txt: 'Q = I × Δt', val: Q, u: 'C' } };
      return { tokens, derivees: [{ id: 'Q', nom: 'Charge électrique passée', expr: 'Q = I × Δt', val: Q, u: 'C' }, { id: 'ne', nom: 'Quantité d’électrons échangés', expr: 'n(e⁻) = frac(Q|F)', val: Q / 96500, u: 'mol' }], texte: [...debut, 'Quelle quantité de zinc s’est déposée sur la pièce ?'],
        utiles: ['I', 't', 'F'], raisons: { U: rU, S: rS, c: rc, Vb: rV, M: 'La masse molaire ne sert qu’à passer à la masse de zinc ; on demande ici une quantité de matière.' },
        cherche: { bonne: 'La quantité de zinc déposé (en mol)', faux: ['La masse de zinc déposé (en g)', 'La charge électrique passée (en C)', 'La quantité d’ions Zn²⁺ restant dans le bain (en mol)'] },
        manque: null, solution: { txt: 'n(Zn) = frac(n(e⁻)|2) = frac(I × Δt|2 F)', val: Q / (2 * 96500), u: 'mol' } };
    },
  },
  {
    id: 'ely-sapp-recharge', domaine: 'Électrolyse : forcer le sens d’évolution', titre: 'Recharger un accumulateur zinc-cuivre', noms: ['Durée de la recharge', 'Masse de zinc reformé'],
    gen: () => ({ Q: tire([1200, 1930, 2900]), I: tire([0.10, 0.20, 0.25]), UG: tire([1.6, 1.8]), Tp: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        Q: tok(`${nb(p.Q)} C`, 'Charge déjà débitée par l’accumulateur', p.Q, 'C'),
        I: tok(`${nb(p.I, 2)} A`, 'Intensité du courant de charge (constante)', p.I, 'A'),
        E: tok('1,10 V', 'Tension à vide de l’accumulateur', 1.10, 'V'),
        UG: tok(`${nb(p.UG, 1)} V`, 'Tension du générateur', p.UG, 'V'),
        Tp: tok(`${p.Tp} °C`, 'Température de la salle', p.Tp, '°C'),
        M: tok('65,4 g/mol', 'Masse molaire du zinc', 65.4, 'g/mol'),
        F: tok('9,65 × 10⁴ C/mol', 'Charge d’une mole d’électrons (constante de Faraday)', 96500, 'C/mol'),
      };
      const debut = ['Un accumulateur zinc-cuivre, de tension à vide ', T('E'), ', a débité une charge de ', T('Q'), '. Pour le recharger complètement, il faut faire repasser la même charge en sens inverse : on le relie à un générateur de tension ', T('UG'),
        ' qui fait passer un courant constant ', T('I'), '. Pendant la charge, sur la lame de zinc : Zn²⁺(aq) + 2 e⁻ → Zn(s) ; M(Zn) = ', T('M'), ' ; F = ', T('F'), '. La salle est à ', T('Tp'), '. '];
      const rE = 'La tension à vide sert seulement à vérifier que le générateur peut forcer la charge (tension du générateur plus grande) ; elle n’entre pas dans le calcul.';
      const rUG = 'La tension du générateur doit dépasser la tension à vide, mais elle n’intervient pas dans les relations Q = I × Δt et n(e⁻) = frac(Q|F).';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de temps dure la recharge complète ?'],
        utiles: ['Q', 'I'], raisons: { E: rE, UG: rUG, Tp: 'La température n’intervient pas dans la relation entre charge, intensité et durée.', M: 'La masse molaire ne sert qu’à calculer une masse de zinc.', F: 'La constante de Faraday sert à passer aux quantités de matière, pas à calculer une durée.' },
        cherche: { bonne: 'La durée de la recharge complète (en s)', faux: ['La masse de zinc reformé (en g)', 'L’énergie stockée pendant la charge (en J)', 'L’intensité nécessaire pour recharger en 1 h (en A)'] },
        manque: null, solution: { txt: 'Δt = frac(Q|I)', val: p.Q / p.I, u: 's' } };
      return { tokens, derivees: [{ id: 'ne', nom: 'Quantité d’électrons à faire repasser', expr: 'n(e⁻) = frac(Q|F)', val: p.Q / 96500, u: 'mol' }, { id: 'nZn', nom: 'Quantité de zinc reformé', expr: 'n(Zn) = frac(n(e⁻)|2)', val: p.Q / 2 / 96500, u: 'mol' }], texte: [...debut, 'Quelle masse de zinc se reforme sur la lame pendant la recharge complète ?'],
        utiles: ['Q', 'M', 'F'], raisons: { I: 'L’intensité fixe la durée de la recharge, pas la quantité de zinc reformé, qui ne dépend que de la charge à faire repasser.', E: rE, UG: rUG, Tp: 'La température n’intervient pas dans le bilan de matière.' },
        cherche: { bonne: 'La masse de zinc reformé (en g)', faux: ['La durée de la recharge (en h)', 'La quantité d’électrons échangés (en mol)', 'La masse de cuivre déposé (en g)'] },
        manque: null, solution: { txt: 'm(Zn) = frac(Q|2 F) × M', val: p.Q / 2 / 96500 * 65.4, u: 'g' } };
    },
  },
  // ───────────────────────────── Titrage pH-métrique (TG) : concentration et composition
  {
    id: 'titph-ca', domaine: 'Titrage pH-métrique', titre: 'Contrôle d’une solution d’acide', noms: ['Concentration de l’acide', 'Volume équivalent attendu'],
    gen: () => ({ CA: tire([0.050, 0.060, 0.080, 0.100]), VA: tire([10.0, 20.0, 25.0]), pKa: tire([3.75, 4.2, 4.8]), prix: tire([12, 18, 25]) }),
    build: (p, q) => {
      const CB = 0.100, VE = p.CA * p.VA / CB;
      const tokens = {
        CB: tok('0,100 mol/L', 'Concentration de la solution de soude', CB, 'mol·L⁻¹'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume d’acide prélevé à la pipette', p.VA, 'mL'),
        pKa: tok(nb(p.pKa, 2), 'pK_A du couple de l’acide', p.pKa, ''),
        prix: tok(`${p.prix} €`, 'Prix de la burette', p.prix, '€'),
      };
      const debut = ['Un technicien contrôle une solution d’acide monoprotique faible (réaction totale avec les ions HO⁻). Il prélève ', T('VA'), ' d’acide (burette achetée ', T('prix'), ') et le titre par une solution d’hydroxyde de sodium de concentration ', T('CB'), ' ; le pK_A du couple est ', T('pKa'), '. '];
      const raisons = { pKa: 'Le pK_A ne sert ni à relier les quantités à l’équivalence ni à calculer V_E ou C_A ; il sert à prévoir le pH.', prix: 'Le prix du matériel n’intervient pas dans le calcul.' };
      if (q === 0) {
        const VEaff = Number(VE.toFixed(1));
        tokens.VE = tok(`${nb(VEaff, 1)} mL`, 'Volume équivalent repéré sur la courbe', VEaff, 'mL');
        return { tokens, derivees: [], texte: [...debut, 'Le maximum de la dérivée du pH est obtenu pour un volume de soude ', T('VE'), '. Quelle est la concentration de la solution d’acide ?'],
          utiles: ['CB', 'VA', 'VE'], raisons,
          cherche: { bonne: 'La concentration C_A de l’acide (en mol/L)', faux: ['La quantité de soude versée (en mmol)', 'Le pH à l’équivalence', 'La constante K de la réaction de titrage'] },
          manque: null, solution: { txt: 'C_A × V_A = C_B × V_E, donc C_A = frac(C_B × V_E|V_A)', val: CB * VEaff / p.VA, u: 'mol/L' } };
      }
      tokens.CA = tok(`${nb(p.CA, 3)} mol/L`, 'Concentration annoncée sur l’étiquette', p.CA, 'mol·L⁻¹');
      return { tokens, derivees: [], texte: [...debut, 'L’étiquette annonce une concentration ', T('CA'), '. Quel volume de soude doit-on verser pour atteindre l’équivalence ?'],
        utiles: ['CB', 'VA', 'CA'], raisons,
        cherche: { bonne: 'Le volume équivalent V_E (en mL)', faux: ['Le pH à l’équivalence', 'La quantité d’acide restant à V_E (en mmol)', 'Le volume d’eau à ajouter'] },
        manque: null, solution: { txt: 'V_E = frac(C_A × V_A|C_B)', val: VE, u: 'mL' } };
    },
  },
  {
    id: 'titph-compo', schema: () => ({ type: 'titrage', sonde: 'pH-mètre', burette: 'soude', becher: 'acide' }), domaine: 'Titrage pH-métrique', titre: 'Composition en cours de titrage', noms: ['Acide restant', 'Excès de soude'],
    gen: () => ({ CA: tire([0.050, 0.080, 0.100]), VA: tire([10.0, 20.0]), T: tire([20, 25, 30]), Ka: tire([3.75, 4.2, 4.8]) }),
    build: (p, q) => {
      const CB = 0.100, n0 = p.CA * p.VA, VE = n0 / CB;
      const tokens = {
        CA: tok(`${nb(p.CA, 3)} mol/L`, 'Concentration de l’acide', p.CA, 'mol·L⁻¹'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume d’acide dans l’erlenmeyer', p.VA, 'mL'),
        CB: tok('0,100 mol/L', 'Concentration de la soude', CB, 'mol·L⁻¹'),
        T: tok(`${p.T} °C`, 'Température du laboratoire', p.T, '°C'),
        Ka: tok(nb(p.Ka, 2), 'pK_A du couple de l’acide', p.Ka, ''),
      };
      const debut = ['Dans un erlenmeyer, ', T('VA'), ' d’une solution d’acide faible de concentration ', T('CA'), ' est titré par une solution d’hydroxyde de sodium de concentration ', T('CB'), '. La température du laboratoire est ', T('T'), ' et le pK_A du couple vaut ', T('Ka'), '. La transformation est totale. '];
      const raisons = { T: 'La température n’intervient pas dans un bilan de quantités de matière pour une transformation totale.', Ka: 'Le pK_A permet de prévoir le pH, pas de faire le bilan des quantités de matière.' };
      if (q === 0) {
        const VB = Number((VE / 2).toFixed(1));
        tokens.VB = tok(`${nb(VB, 1)} mL`, 'Volume de soude versé', VB, 'mL');
        return { tokens, derivees: [], texte: [...debut, 'On a versé ', T('VB'), ' de soude, soit moins que le volume équivalent. Quelle quantité d’acide reste-t-il dans l’erlenmeyer ?'],
          utiles: ['CA', 'VA', 'CB', 'VB'], raisons,
          cherche: { bonne: 'La quantité d’acide restant (en mmol)', faux: ['Le pH de la solution', 'La quantité d’ions HO⁻ en excès (en mmol)', 'Le volume équivalent V_E (en mL)'] },
          manque: null, solution: { txt: 'n(acide) restant = C_A V_A − C_B V_B', val: n0 - CB * VB, u: 'mmol' } };
      }
      const VB = Number((VE + 5).toFixed(1));
      tokens.VB = tok(`${nb(VB, 1)} mL`, 'Volume de soude versé', VB, 'mL');
      return { tokens, derivees: [], texte: [...debut, 'On a versé ', T('VB'), ' de soude, soit plus que le volume équivalent. Quelle quantité d’ions HO⁻ est en excès ?'],
        utiles: ['CA', 'VA', 'CB', 'VB'], raisons,
        cherche: { bonne: 'La quantité d’ions HO⁻ en excès (en mmol)', faux: ['La quantité d’acide restant (en mmol)', 'Le pH de la solution', 'La concentration de l’acide (en mol/L)'] },
        manque: null, solution: { txt: 'n(HO⁻) en excès = C_B V_B − C_A V_A', val: CB * VB - n0, u: 'mmol' } };
    },
  },
  // ───────────────────────────── 0 bis. Examen d'un objet à la loupe (TSTL : œil et loupe)
  {
    id: 'oeil-loupe-timbre', domaine: 'Œil et loupe', titre: 'Un philatéliste examine un timbre', noms: ['Grossissement', 'Diamètre apparent'],
    gen: () => ({ f: tire([2.5, 4, 5, 8]), AB: tire([0.3, 0.5, 0.8]), prix: tire([12, 18, 25]) }),
    build: (p, q) => {
      const f = p.f / 100, dm = 0.25, AB = p.AB / 100, G = dm / f, thp = AB / f;
      const tokens = {
        f: tok(`${p.f} cm`, 'Distance focale de la loupe', f, 'm'),
        dm: tok('25 cm', 'Distance minimale de vision distincte de l’œil', dm, 'm'),
        prix: tok(`${p.prix} €`, 'Prix de la loupe', p.prix, '€'),
      };
      const debut = ['Un philatéliste utilise une loupe, modélisée par une lentille mince convergente de distance focale ', T('f'), ', achetée ', T('prix'),
        '. Il place le timbre dans le plan focal objet de la loupe et l’observe avec un œil sans défaut de vision ; sans loupe, il le regarderait à la distance minimale de vision distincte ', T('dm'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De combien l’angle sous lequel il voit le timbre est-il multiplié grâce à la loupe ?'],
        utiles: ['f', 'dm'], raisons: { prix: 'Le prix n’intervient pas dans la physique de la loupe.' },
        cherche: { bonne: 'Le grossissement G de la loupe (sans unité)', faux: ['La position OA′ de l’image (en m)', 'Le diamètre apparent θ′ de l’image (en rad)', 'La vergence de la loupe (en δ)'] },
        manque: null, solution: { txt: 'G = dm / f′', val: G, u: '' } };
      tokens.AB = tok(`${p.AB} cm`, 'Hauteur du détail observé sur le timbre', AB, 'm');
      return { tokens, derivees: [], texte: [...debut, 'Le détail observé mesure ', T('AB'), ' de haut. Sous quel angle le philatéliste voit-il ce détail à travers la loupe ?'],
        utiles: ['f', 'AB'], raisons: { prix: 'Le prix n’intervient pas dans la physique de la loupe.', dm: 'La distance minimale de vision distincte sert pour l’œil nu, pas pour l’image à l’infini donnée par la loupe.' },
        cherche: { bonne: 'Le diamètre apparent θ′ de l’image (en rad)', faux: ['Le grossissement G de la loupe (sans unité)', 'La position OA′ de l’image (en m)', 'La hauteur A′B′ de l’image (en m)'] },
        manque: null, solution: { txt: 'θ′ ≈ frac(AB|f′) (petits angles)', val: thp, u: 'rad' } };
    },
  },
  // ───────────────────────────── 0 ter. Observation au microscope (TSTL)
  {
    id: 'microsc-fibre', domaine: 'Microscope', titre: 'Un technicien observe une fibre', noms: ['Grossissement', 'Taille de l’image intermédiaire'],
    gen: () => ({ f1: tire([20, 10, 8]), f2: tire([25, 20, 50]), AB: tire([10, 20, 30, 40]), prix: tire([450, 900, 1500]) }),
    build: (p, q) => {
      const D = 160, dm = 250, G = D * dm / (p.f1 * p.f2), A1B1 = D / p.f1 * p.AB / 1000;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        D: tok('160 mm', 'Intervalle optique F₁′F₂', 0.16, 'm'),
        dm: tok('250 mm', 'Distance minimale de vision distincte', 0.25, 'm'),
        prix: tok(`${p.prix} €`, 'Prix du microscope', p.prix, '€'),
      };
      const debut = ['Un technicien examine une fibre au microscope, modélisé par deux lentilles minces convergentes : un objectif de distance focale ', T('f1'), ' et un oculaire de distance focale ', T('f2'),
        '. L’intervalle optique est ', T('D'), ' ; le microscope, acheté ', T('prix'), ', est mis au point (image définitive à l’infini). L’œil nu verrait la fibre à ', T('dm'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De combien l’angle sous lequel il voit la fibre est-il multiplié grâce au microscope ?'],
        utiles: ['f1', 'f2', 'D', 'dm'], raisons: { prix: 'Le prix n’intervient pas dans la physique du microscope.' },
        cherche: { bonne: 'Le grossissement G du microscope (sans unité)', faux: ['Le grandissement γ₁ de l’objectif seul', 'La distance O₁A₁ entre objectif et image intermédiaire (en m)', 'Le diamètre apparent θ₂ de l’image (en rad)'] },
        manque: null, solution: { txt: 'G = Δ·dm / (f₁′ f₂′)', val: G, u: '' } };
      tokens.AB = tok(`${p.AB} µm`, 'Taille du détail observé sur la fibre', p.AB * 1e-6, 'm');
      return { tokens, derivees: [], texte: [...debut, 'Le détail observé mesure ', T('AB'), '. Quelle est la taille de l’image intermédiaire qu’en donne l’objectif ?'],
        utiles: ['f1', 'D', 'AB'], raisons: { f2: 'L’oculaire n’intervient pas dans la taille de l’image intermédiaire.', dm: 'La distance minimale de vision distincte sert pour l’œil nu, pas pour l’image donnée par l’objectif.', prix: 'Le prix n’intervient pas dans la physique du microscope.' },
        cherche: { bonne: 'La taille A₁B₁ de l’image intermédiaire (en mm)', faux: ['Le grossissement G du microscope (sans unité)', 'Le diamètre apparent θ₂ de l’image définitive (en rad)', 'La distance objet–objectif (en mm)'] },
        manque: null, solution: { txt: 'A₁B₁ = |γ₁| × AB = (frac(Δ|f₁′)) × AB', val: A1B1, u: 'mm' } };
    },
  },
  {
    id: 'microsc-mise-au-point-reglage', schema: () => ({ type: 'microscope', lumiere: 'lumière blanche' }), domaine: 'Microscope', titre: 'Un étudiant règle son microscope', noms: ['Position de l’image intermédiaire', 'Grandissement de l’objectif'],
    gen: () => ({ f1: tire([20, 10, 8]), f2: tire([25, 20, 50]), grad: tire([4, 6, 8]), nom: tire([100, 200, 300]) }),
    build: (p, q) => {
      const D = 160, g = D / p.f1, O1A1 = p.f1 + D;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        D: tok('160 mm', 'Intervalle optique F₁′F₂', 0.16, 'm'),
        nom: tok(`${p.nom} g`, 'Masse du microscope', p.nom / 1000, 'kg'),
      };
      const debut = ['Un étudiant règle un microscope formé d’un objectif de distance focale ', T('f1'), ' et d’un oculaire de distance focale ', T('f2'), '. L’intervalle optique est ', T('D'),
        ' et la masse du microscope vaut ', T('nom'), '. Il tourne la molette jusqu’à ce que l’image définitive soit à l’infini. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'À quelle distance de l’objectif se forme alors l’image intermédiaire ?'],
        utiles: ['f1', 'D'], raisons: { f2: 'Une fois A₁ en F₂, la distance O₁A₁ ne dépend que de f₁′ et de Δ.', nom: 'La masse du microscope n’intervient pas.' },
        cherche: { bonne: 'La distance O₁A₁ (en m)', faux: ['Le grossissement G du microscope (sans unité)', 'La distance objet–objectif (en m)', 'La taille de l’image intermédiaire (en m)'] },
        manque: null, solution: { txt: 'O₁A₁ = f₁′ + Δ', val: O1A1 / 1000, u: 'm' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le grandissement de l’objectif ?'],
        utiles: ['f1', 'D'], raisons: { f2: 'L’oculaire n’intervient pas dans le grandissement de l’objectif.', nom: 'La masse du microscope n’intervient pas.' },
        cherche: { bonne: 'Le grandissement γ₁ de l’objectif (sans unité, avec son signe)', faux: ['Le grossissement G du microscope (sans unité)', 'La distance O₁A₁ (en m)', 'La vergence de l’objectif (en δ)'] },
        manque: null, solution: { txt: 'γ₁ = −frac(Δ|f₁′)', val: -g, u: '' } };
    },
  },
  // ───────────────────────────── 0 quater. Lunette astronomique (TSTL)
  {
    id: 'lunet-astre', domaine: 'Lunette astronomique', titre: 'Un amateur observe un astre', noms: ['Grossissement', 'Image intermédiaire'],
    gen: () => ({ f1: tire([600, 800, 1000, 1200]), f2: tire([10, 20, 25, 40]), th: tire([1.5, 2, 3, 4]), D: tire([80, 100, 150]) }),
    build: (p, q) => {
      const G = p.f1 / p.f2, A1B1 = p.f1 * p.th / 1000;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        D: tok(`${p.D} mm`, 'Diamètre de l’objectif', p.D / 1000, 'm'),
      };
      const debut = ['Un amateur observe un astre avec une lunette afocale, modélisée par deux lentilles minces convergentes : un objectif de distance focale ', T('f1'), ' et de diamètre ', T('D'), ', et un oculaire de distance focale ', T('f2'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De combien l’angle sous lequel il voit l’astre est-il multiplié grâce à la lunette ?'],
        utiles: ['f1', 'f2'], raisons: { D: 'Le diamètre de l’objectif joue sur la luminosité et la résolution, pas sur le grossissement.' },
        cherche: { bonne: 'Le grossissement G de la lunette (sans unité)', faux: ['La distance O₁O₂ entre les lentilles (en m)', 'La taille A₁B₁ de l’image intermédiaire (en m)', 'Le diamètre apparent θ₂ de l’image (en rad)'] },
        manque: null, solution: { txt: 'G = frac(f₁′|f₂′)', val: G, u: '' } };
      tokens.th = tok(`${p.th} mrad`, 'Diamètre apparent de l’astre', p.th / 1000, 'rad');
      return { tokens, derivees: [], texte: [...debut, 'L’astre a un diamètre apparent de ', T('th'), '. Quelle est la taille de l’image intermédiaire formée par l’objectif ?'],
        utiles: ['f1', 'th'], raisons: { f2: 'L’oculaire n’intervient pas dans la taille de l’image intermédiaire.', D: 'Le diamètre de l’objectif ne change pas la taille de l’image intermédiaire.' },
        cherche: { bonne: 'La taille A₁B₁ de l’image intermédiaire (en mm)', faux: ['Le grossissement G de la lunette (sans unité)', 'Le diamètre apparent θ₂ de l’image définitive (en rad)', 'La distance O₁O₂ entre les lentilles (en mm)'] },
        manque: null, solution: { txt: 'A₁B₁ = f₁′ × θ₀ (petits angles)', val: A1B1, u: 'mm' } };
    },
  },
  {
    id: 'lunet-reglage', domaine: 'Lunette astronomique', titre: 'Un élève règle sa lunette', noms: ['Distance entre les lentilles', 'Diamètre apparent de l’image'],
    gen: () => ({ f1: tire([600, 800, 1000, 1200]), f2: tire([10, 20, 25, 40]), th: tire([1.5, 2, 3, 4]), m: tire([300, 450, 600]) }),
    build: (p, q) => {
      const d = p.f1 + p.f2, th2 = p.th * p.f1 / p.f2;
      const tokens = {
        f1: tok(`${p.f1} mm`, 'Distance focale de l’objectif', p.f1 / 1000, 'm'),
        f2: tok(`${p.f2} mm`, 'Distance focale de l’oculaire', p.f2 / 1000, 'm'),
        m: tok(`${p.m} g`, 'Masse de l’oculaire et de son support', p.m / 1000, 'kg'),
      };
      const debut = ['Un élève monte une lunette avec un objectif de distance focale ', T('f1'), ' et un oculaire de distance focale ', T('f2'), ' (l’oculaire et son support pèsent ', T('m'), '). Il vise un astre lointain et règle la lunette pour observer sans accommoder. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle distance sépare alors l’objectif et l’oculaire ?'],
        utiles: ['f1', 'f2'], raisons: { m: 'La masse de l’oculaire n’intervient pas.' },
        cherche: { bonne: 'La distance O₁O₂ entre l’objectif et l’oculaire (en m)', faux: ['Le grossissement G de la lunette (sans unité)', 'La taille A₁B₁ de l’image intermédiaire (en m)', 'La vergence de l’oculaire (en δ)'] },
        manque: null, solution: { txt: 'O₁O₂ = f₁′ + f₂′', val: d / 1000, u: 'm' } };
      tokens.th = tok(`${p.th} mrad`, 'Diamètre apparent de l’astre', p.th / 1000, 'rad');
      return { tokens, derivees: [], texte: [...debut, 'L’astre a un diamètre apparent de ', T('th'), '. Sous quel angle voit-il l’image définitive ?'],
        utiles: ['f1', 'f2', 'th'], raisons: { m: 'La masse de l’oculaire n’intervient pas.' },
        cherche: { bonne: 'Le diamètre apparent θ₂ de l’image définitive (en rad)', faux: ['Le grossissement G de la lunette (sans unité)', 'La taille A₁B₁ de l’image intermédiaire (en m)', 'La distance O₁O₂ (en m)'] },
        manque: null, solution: { txt: 'θ₂ = G × θ₀ = (frac(f₁′|f₂′)) × θ₀', val: th2 / 1000, u: 'rad' } };
    },
  },
  // ───────────────────────────── 0 quinquies. Chiralité et configuration R/S (TSTL, PCM)
  {
    id: 'chir-halogenes', domaine: 'Configuration absolue R/S', titre: 'Classer les groupes d’un carbone asymétrique (halogènes)', noms: ['Priorité 1', 'Priorité 3'],
    gen: () => { const at = [['F', 9, 19.0], ['Cl', 17, 35.5], ['Br', 35, 79.9], ['I', 53, 126.9]]; const L = [...at].sort(() => Math.random() - 0.5).slice(0, 3); return { L, M: Math.round(13.0 + L.reduce((t, a) => t + a[2], 0)), Teb: tire([2, 5, 10, 20]) }; },
    build: (p, q) => {
      const tri = [...p.L].sort((a, b) => b[1] - a[1]);
      const tokens = {
        a: tok(`Z = ${p.L[0][1]}`, `Numéro atomique de ${p.L[0][0]}`, p.L[0][1], ''),
        b: tok(`Z = ${p.L[1][1]}`, `Numéro atomique de ${p.L[1][0]}`, p.L[1][1], ''),
        c: tok(`Z = ${p.L[2][1]}`, `Numéro atomique de ${p.L[2][0]}`, p.L[2][1], ''),
        M: tok(`${p.M} g/mol`, 'Masse molaire de la molécule', p.M, 'g/mol'),
        Teb: tok(`${p.Teb} g`, 'Masse de l’échantillon préparé', p.Teb, 'g'),
      };
      const debut = ['Un carbone asymétrique est lié à un atome d’hydrogène et à trois atomes d’halogène : ', p.L[0][0], ' (', T('a'), '), ', p.L[1][0], ' (', T('b'), ') et ', p.L[2][0], ' (', T('c'), '). La molécule a une masse molaire de ', T('M'), ' ; on en a préparé ', T('Teb'), '. On classe les quatre groupes avec les règles de Cahn, Ingold et Prelog. '];
      const raisons = { M: 'La masse molaire ne sert pas à classer les groupes.', Teb: 'La masse de l’échantillon ne sert pas à classer les groupes.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le numéro atomique de l’atome de priorité 1 ?'], utiles: ['a', 'b', 'c'], raisons,
        cherche: { bonne: 'Le numéro atomique Z de l’atome de priorité 1 (sans unité)', faux: ['La masse molaire de la molécule (en g/mol)', 'La somme des trois numéros atomiques (sans unité)', 'Le nombre de groupes différents autour du carbone (sans unité)'] },
        manque: null, solution: { txt: 'priorité 1 = plus grand Z', val: tri[0][1], u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le numéro atomique de l’atome de priorité 3 ?'], utiles: ['a', 'b', 'c'], raisons,
        cherche: { bonne: 'Le numéro atomique Z de l’atome de priorité 3 (sans unité)', faux: ['La masse de l’échantillon préparé (en g)', 'Le numéro atomique de l’atome de priorité 1 (sans unité)', 'Le numéro atomique de l’hydrogène (sans unité)'] },
        manque: null, solution: { txt: 'priorité 3 = plus petit Z des trois (H est le n°4)', val: tri[2][1], u: '' } };
    },
  },
  {
    id: 'chir-heteroatomes', domaine: 'Configuration absolue R/S', titre: 'Classer les groupes d’un carbone asymétrique (O, N, C)', noms: ['Priorité 1', 'Priorité 3'],
    gen: () => ({ M: 75, F: 173 }),   // valeurs réelles du 2-aminopropan-1-ol (M ≈ 75 g/mol ; ébullition vers 173 °C)
    build: (p, q) => {
      const tokens = {
        o: tok('Z = 8', 'Numéro atomique de O', 8, ''),
        n: tok('Z = 7', 'Numéro atomique de N', 7, ''),
        c: tok('Z = 6', 'Numéro atomique de C', 6, ''),
        M: tok(`${p.M} g/mol`, 'Masse molaire', p.M, 'g/mol'),
        F: tok(`${p.F} °C`, 'Température d’ébullition', p.F, '°C'),
      };
      const debut = ['Dans une molécule de formule CH₃–CH(NH₂)–CH₂OH, le carbone asymétrique est lié à un groupe NH₂ (atome lié : N, ', T('n'), '), à un groupe CH₂OH (atome lié : C, ', T('c'), '), à un groupe CH₃ (atome lié : C) et à H. L’atome O a pour numéro atomique ', T('o'), '. La molécule a une masse molaire de ', T('M'), ' et bout vers ', T('F'), '. '];
      const raisons = { M: 'La masse molaire ne sert pas à classer les groupes.', F: 'La température d’ébullition ne sert pas à classer les groupes.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le numéro atomique de l’atome lié au C* du groupe de priorité 1 ?'], utiles: ['n', 'c'], raisons: { ...raisons, o: 'L’atome O n’est pas lié directement au C* : il est dans le groupe CH₂OH, au deuxième rang.' },
        cherche: { bonne: 'Le numéro atomique Z de l’atome lié au C* dans le groupe de priorité 1 (sans unité)', faux: ['Le numéro atomique de l’atome O du groupe CH₂OH (sans unité)', 'La masse molaire de la molécule (en g/mol)', 'Le numéro atomique de H (sans unité)'] },
        manque: null, solution: { txt: 'NH₂ : l’atome lié est N, Z = 7, le plus grand des atomes liés (N, C, C, H)', val: 7, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'CH₂OH et CH₃ sont tous deux liés par C : quel est le numéro atomique de l’atome commun qui les met à égalité ?'], utiles: ['c'], raisons: { ...raisons, n: 'N est l’atome lié de NH₂, groupe déjà classé 1er.', o: 'O est un voisin du carbone de CH₂OH : il sert au deuxième rang, pas à l’égalité.' },
        cherche: { bonne: 'Le numéro atomique Z de l’atome lié qui est le même pour CH₂OH et CH₃ (sans unité)', faux: ['Le numéro atomique de l’atome O (sans unité)', 'Le numéro atomique de N (sans unité)', 'La température d’ébullition de la molécule (en °C)'] },
        manque: null, solution: { txt: 'C : Z = 6, pour CH₂OH et CH₃ ; on compare ensuite leurs voisins', val: 6, u: '' } };
    },
  },
  {
    id: 'chir-miroir-distance', domaine: 'Chiralité et carbone asymétrique', titre: 'Une molécule chirale devant un miroir plan', noms: ['Distance de l’image au miroir', 'Distance molécule – image'],
    gen: () => ({ d: tire([10, 15, 20, 25, 30]), M: tire([75, 89, 105, 119]) }),
    build: (p, q) => {
      const tokens = {
        d: tok(`${p.d} cm`, 'Distance de la molécule au miroir', p.d, 'cm'),
        M: tok(`${p.M} g/mol`, 'Masse molaire', p.M, 'g/mol'),
      };
      const debut = ['On place le modèle moléculaire d’une molécule chirale à ', T('d'), ' d’un miroir plan. La molécule a une masse molaire de ', T('M'), '. L’image se forme symétriquement, de l’autre côté du miroir. '];
      const raisons = { M: 'La masse molaire ne sert pas à trouver une distance.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'À quelle distance du miroir se trouve l’image ?'], utiles: ['d'], raisons,
        cherche: { bonne: 'La distance de l’image au miroir (en cm)', faux: ['La distance entre la molécule et son image (en cm)', 'La masse molaire de la molécule (en g/mol)', 'Le nombre d’images formées (sans unité)'] },
        manque: null, solution: { txt: 'l’image est à la même distance du miroir que la molécule', val: p.d, u: 'cm' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle distance sépare la molécule de son image ?'], utiles: ['d'], raisons,
        cherche: { bonne: 'La distance entre la molécule et son image (en cm)', faux: ['La distance de la molécule au miroir (en cm)', 'La masse molaire de la molécule (en g/mol)', 'La moitié de la distance au miroir (en cm)'] },
        manque: null, solution: { txt: 'molécule – miroir puis miroir – image : 2 × distance', val: 2 * p.d, u: 'cm' } };
    },
  },
  {
    id: 'chir-cram-liaisons', domaine: 'Chiralité et carbone asymétrique', titre: 'Compter les liaisons d’un carbone en représentation de Cram', noms: ['Liaisons au total', 'Liaisons hors du plan'],
    gen: () => { const [t, c, d] = tire([[2, 1, 1], [1, 2, 1], [1, 1, 2], [0, 2, 2]]); return { t, c, d, Teb: tire([60, 80, 110]) }; },
    build: (p, q) => {
      const tokens = {
        t: tok(`${p.t}`, 'Traits pleins (dans le plan)', p.t, ''),
        c: tok(`${p.c}`, 'Coins pleins (devant)', p.c, ''),
        d: tok(`${p.d}`, 'Tirets (derrière)', p.d, ''),
        Teb: tok(`${p.Teb} °C`, 'Température d’ébullition', p.Teb, '°C'),
      };
      const debut = ['Sur le dessin de Cram d’un carbone asymétrique, on compte ', T('t'), ' trait(s) plein(s) dans le plan de la feuille, ', T('c'), ' coin(s) plein(s) vers l’observateur et ', T('d'), ' groupe(s) en tirets vers l’arrière. La molécule bout à ', T('Teb'), '. '];
      const raisons = { Teb: 'La température d’ébullition ne sert pas à compter des liaisons.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de liaisons ce carbone porte-t-il en tout ?'], utiles: ['t', 'c', 'd'], raisons,
        cherche: { bonne: 'Le nombre total de liaisons du carbone (sans unité)', faux: ['Le nombre de liaisons dans le plan seulement (sans unité)', 'La température d’ébullition (en °C)', 'Le nombre de groupes en tirets (sans unité)'] },
        manque: null, solution: { txt: 'traits + coins + tirets', val: p.t + p.c + p.d, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de liaisons sortent du plan de la feuille (devant ou derrière) ?'], utiles: ['c', 'd'], raisons: { ...raisons, t: 'Les traits pleins sont dans le plan de la feuille : ils ne sortent pas du plan.' },
        cherche: { bonne: 'Le nombre de liaisons hors du plan : coins pleins et tirets (sans unité)', faux: ['Le nombre total de liaisons du carbone (sans unité)', 'Le nombre de liaisons dans le plan (sans unité)', 'La température d’ébullition (en °C)'] },
        manque: null, solution: { txt: 'coins pleins + tirets', val: p.c + p.d, u: '' } };
    },
  },
  // ───────────────────────────── 1. Mur (transferts thermiques)
  {
    id: 'paroi', domaine: 'Transferts thermiques', titre: 'Les pertes thermiques d’un mur', noms: ['Puissance perdue', 'Coût de l’énergie perdue'],
    gen: () => ({ e: tire([15, 20, 25, 30]), L: tire([3, 4, 5, 6]), h: 2.5, lam: 0.25, Ti: tire([19, 20, 21]), Te: tire([-5, -2, 0, 2, 5]),
      an: tire([1975, 1985, 1995, 2005]), prix: 0.17, dur: 24 }),
    build: (p, q) => {
      const S = p.L * p.h, dT = p.Ti - p.Te, e = p.e / 100;
      const tokens = {
        an: tok(`${p.an}`, 'Année de construction', p.an, ''),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du mur', p.L, 'm'),
        h: tok(`${nb(p.h, 1)} m`, 'Hauteur du mur', p.h, 'm'),
        e: tok(`${p.e} cm`, 'Épaisseur du mur', e, 'm'),
        lam: tok(`${nb(p.lam, 2)} W·m⁻¹·K⁻¹`, 'Conductivité thermique de la brique', p.lam, 'W·m⁻¹·K⁻¹'),
        Ti: tok(`${sg(p.Ti)} °C`, 'Température intérieure', p.Ti, '°C'),
        Te: tok(`${sg(p.Te)} °C`, 'Température extérieure', p.Te, '°C'),
        prix: tok(`${nb(p.prix, 2)} € par kWh`, 'Prix de l’électricité', p.prix, '€·kWh⁻¹'),
      };
      const debut = ['Un mur de brique, construit en ', T('an'), ', mesure ', T('L'), ' de long et ', T('h'), ' de haut. Son épaisseur est de ', T('e'),
        ' et la conductivité thermique de la brique vaut ', T('lam'), '. La température de l’air est de ', T('Ti'), ' à l’intérieur et de ', T('Te'),
        ' à l’extérieur. L’électricité coûte ', T('prix'), '. On suppose le régime permanent, un mur sans porte ni fenêtre, et des faces à la température de l’air de chaque côté. '];
      const derivees = [
        { id: 'S', nom: 'Surface S du mur', expr: 'S = longueur × hauteur', val: S, u: 'm²' },
        { id: 'dT', nom: 'Écart de température ΔT', expr: 'ΔT = T_int − T_ext', val: dT, u: 'K' },
      ];
      const P = p.lam * S * dT / e;
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quelle est la puissance thermique perdue à travers ce mur ?'],
        utiles: ['L', 'h', 'e', 'lam', 'Ti', 'Te'],
        raisons: { an: 'La date de construction n’intervient pas dans la loi de la conduction thermique.', prix: 'Le prix servirait à calculer un coût, pas une puissance.' },
        cherche: { bonne: 'La puissance thermique P perdue par le mur (en W)', faux: ['La résistance thermique R_th du mur (en K·W⁻¹)', 'L’énergie perdue en une journée (en kWh)', 'Le flux thermique surfacique φ à travers le mur (en W·m⁻²)'] },
        manque: null, solution: { txt: 'P = λ·S·ΔT / e', val: P, u: 'W' } };
      tokens.dur = tok(`${p.dur} heures`, 'Durée', p.dur, 'h');
      return { tokens, derivees, texte: [...debut, 'Les températures restent constantes et l’énergie perdue est compensée par un chauffage électrique. Quel est le coût de l’énergie perdue à travers ce mur pendant ', T('dur'), ' ?'],
        utiles: ['L', 'h', 'e', 'lam', 'Ti', 'Te', 'prix', 'dur'],
        raisons: { an: 'La date de construction n’intervient ni dans la puissance perdue ni dans son coût.' },
        cherche: { bonne: 'Le coût de l’énergie thermique perdue (en €)', faux: ['La puissance thermique P perdue par le mur (en W)', 'La résistance thermique R_th du mur (en K·W⁻¹)', 'L’énergie thermique perdue pendant cette durée (en kWh)'] },
        manque: null, solution: { txt: 'coût = P × durée × prix, avec P = λ·S·ΔT / e', val: P / 1000 * p.dur * p.prix, u: '€' } };
    },
  },
  // ───────────────────────────── 2. Conduite (transport des fluides)
  {
    id: 'conduite', domaine: 'Transport des fluides', titre: 'Une pompe et sa conduite', noms: ['Vitesse de l’eau', 'Masse d’eau refoulée'],
    gen: () => ({ D: tire([50, 63, 80, 100]), Lc: tire([60, 120, 200]), Q: tire([6, 9, 12]), Pel: tire([1.1, 1.5, 2.2]) }),
    build: (p, q) => {
      const tokens = {
        Pel: tok(`${nb(p.Pel, 1)} kW`, 'Puissance électrique de la pompe', p.Pel * 1000, 'W'),
        D: tok(`${p.D} mm`, 'Diamètre intérieur de la conduite', p.D / 1000, 'm'),
        Lc: tok(`${p.Lc} m`, 'Longueur de la conduite', p.Lc, 'm'),
        Q: tok(`${p.Q} m³·h⁻¹`, 'Débit volumique', p.Q / 3600, 'm³·s⁻¹'),
      };
      const debut = ['Une pompe de puissance électrique ', T('Pel'), ' refoule de l’eau dans une conduite cylindrique de diamètre intérieur ', T('D'),
        ' et de longueur ', T('Lc'), '. La conduite est pleine, l’eau est incompressible et l’écoulement est permanent ; le débit volumique est de ', T('Q'), '. '];
      const S = Math.PI * (p.D / 1000) ** 2 / 4;
      if (q === 0) return { tokens, texte: [...debut, 'Quelle est la vitesse moyenne de l’eau dans la conduite ?'],
        utiles: ['D', 'Q'],
        raisons: { Pel: 'La puissance de la pompe n’intervient pas dans la relation entre débit, section et vitesse.', Lc: 'La longueur de la conduite compte pour les pertes de charge (frottements), pas pour la vitesse de l’eau.' },
        derivees: [{ id: 'S', nom: 'Section S de la conduite', expr: 'S = frac(π·D²|4)', val: S, u: 'm²' }],
        cherche: { bonne: 'La vitesse moyenne v de l’eau (en m·s⁻¹)', faux: ['Le débit massique de l’eau (en kg·s⁻¹)', 'La perte de charge dans la conduite (en Pa)', 'La puissance hydraulique de la pompe (en W)'] },
        manque: null,
        solution: { txt: 'v = frac(Q|S)', val: (p.Q / 3600) / S, u: 'm·s⁻¹' } };
      tokens.tdur = tok('1 heure', 'Durée', 3600, 's');
      return { tokens, texte: [...debut, 'Quelle masse d’eau la pompe refoule-t-elle en ', T('tdur'), ' ?'],
        utiles: ['Q', 'tdur'],
        raisons: { Pel: 'La puissance de la pompe ne donne pas la masse d’eau déplacée.', D: 'Le diamètre n’intervient pas : le débit est déjà donné.', Lc: 'La longueur de la conduite n’intervient pas dans la masse d’eau refoulée.' },
        derivees: [{ id: 'V', nom: 'Volume V d’eau refoulé', expr: 'V = Q × durée', val: p.Q, u: 'm³' }],
        cherche: { bonne: 'La masse m d’eau refoulée (en kg)', faux: ['Le débit massique de l’eau (en kg·s⁻¹)', 'La vitesse moyenne de l’eau (en m·s⁻¹)', 'Le volume d’eau contenu dans la conduite (en m³)'] },
        manque: { bonne: 'Il manque la masse volumique de l’eau', faux: ['Il manque le débit volumique de l’eau', 'Il ne manque que la durée de refoulement', 'Il ne manque aucune donnée pour ce calcul'],
          expl: `Pour passer d’un volume à une masse, il faut la masse volumique : m = ρ·V, avec ρ = 1000 kg·m⁻³ pour l’eau. L’énoncé ne la donne pas. En revanche, le débit volumique (${tokens.Q.aff}) et la durée (${tokens.tdur.aff}) y figurent bien : V = Q × durée.` },
        solution: { txt: 'm = ρ·Q·durée', val: 1000 * p.Q, u: 'kg' } };
    },
  },
  // ───────────────────────────── 3. Dosage d'un comprimé (chimie analytique)
  {
    id: 'aspirine', domaine: 'Chimie', titre: 'Dosage d’un comprimé d’aspirine', noms: ['Concentration de la solution', 'Masse d’acide dans le comprimé'],
    gen: () => {
      const [VA, cB] = tire([[20, 0.1], [20, 0.05], [10, 0.05]]), m = tire([480, 500]), Vf = 100;
      const VE = Math.round(((m / 180) * (VA / Vf) / cB) * 10) / 10;
      return { mc: tire([0.6, 0.65, 0.7]), M: 180, Vf, VA, cB, VE };
    },
    build: (p, q) => {
      const tokens = {
        mc: tok(`${nb(p.mc, 2)} g`, 'Masse du comprimé', p.mc, 'g'),
        M: tok(`${p.M} g·mol⁻¹`, 'Masse molaire de l’acide', p.M, 'g·mol⁻¹'),
        Vf: tok(`${nb(p.Vf, 1)} mL`, 'Volume de la fiole jaugée', p.Vf / 1000, 'L'),
        VA: tok(`${nb(p.VA, 1)} mL`, 'Volume de solution titré', p.VA / 1000, 'L'),
        cB: tok(`${nb(p.cB, 3)} mol·L⁻¹`, 'Concentration de la soude', p.cB, 'mol·L⁻¹'),
        pH: tok('8,2 à 10', 'Zone de virage de l’indicateur', 8.2, 'pH'),
        VE: tok(`${nb(p.VE, 1)} mL`, 'Volume de soude versé à l’équivalence', p.VE / 1000, 'L'),
      };
      const texte = ['Un comprimé d’aspirine, de masse ', T('mc'), ', contient de l’acide acétylsalicylique (noté AH, de masse molaire ', T('M'),
        ') et des excipients, qui ne réagissent pas avec la soude. Le comprimé est broyé puis l’acide est entièrement dissous dans un mélange eau–éthanol, dans une fiole jaugée de ', T('Vf'),
        ' (solution S₀). On prélève ', T('VA'), ' de S₀ que l’on titre avec une solution de soude (Na⁺ + HO⁻) de concentration ', T('cB'),
        ', en présence de phénolphtaléine (zone de virage de pH ', T('pH'), '). L’équivalence est repérée pour un volume de soude versé de ', T('VE'), '. ',
        q === 0 ? 'Quelle est la concentration en acide acétylsalicylique de la solution S₀ ?' : 'Quelle masse d’acide acétylsalicylique contient un comprimé ?'];
      const manque = null;
      const c0 = p.cB * p.VE / p.VA;
      if (q === 0) return { tokens, texte, utiles: ['VA', 'cB', 'VE'], derivees: [], manque,
        raisons: { mc: 'La masse du comprimé servirait à calculer un pourcentage en masse, pas la concentration de S₀.', M: 'La masse molaire servirait à passer d’une quantité de matière à une masse : ce n’est pas demandé ici.',
          Vf: 'Le volume de la fiole servirait à calculer la quantité de matière totale ; la concentration, elle, se déduit du titrage de la prise.', pH: 'La zone de virage sert à choisir l’indicateur, pas à calculer une concentration.' },
        cherche: { bonne: 'La concentration c₀ en AH de S₀ (en mol·L⁻¹)', faux: ['La masse d’acide AH dans le comprimé (en g)', 'La quantité de matière de soude versée (en mol)', 'Le pourcentage en masse d’acide dans le comprimé'] },
        solution: { txt: 'c₀ = frac(c_B·V_E|V_A)', val: c0, u: 'mol·L⁻¹' } };
      return { tokens, texte, utiles: ['Vf', 'VA', 'cB', 'VE', 'M'], derivees: [], manque,
        raisons: { mc: 'La masse du comprimé entier n’intervient pas : on cherche la masse d’acide, qu’on déduit de la concentration, du volume de la fiole et de la masse molaire.', pH: 'La zone de virage sert à choisir l’indicateur, pas à calculer une masse.' },
        cherche: { bonne: 'La masse m d’acide AH dans le comprimé (en g)', faux: ['La concentration c₀ en AH de S₀ (en mol·L⁻¹)', 'Le pourcentage en masse d’acide dans le comprimé', 'La quantité de matière de soude versée (en mol)'] },
        solution: { txt: 'm = c₀·V_f·M avec c₀ = frac(c_B·V_E|V_A)', val: c0 * (p.Vf / 1000) * p.M, u: 'g' } };
    },
  },
  // ───────────────────────────── 4. CAN (transmission de signaux numériques)
  {
    id: 'can', domaine: 'Transmission de signaux numériques', titre: 'Un capteur et son convertisseur', noms: ['Quantum du CAN', 'Plus petite variation détectable'],
    gen: () => {
      const [vmin, vmax] = tire([[0, 5], [-5, 5], [0, 3.3], [-2.5, 2.5]]);
      return { n: tire([8, 10, 12, 16]), vmin, vmax, fe: tire([1, 10, 100]), sens: tire([10, 20]) };
    },
    build: (p, q) => {
      const E = p.vmax - p.vmin, N = 2 ** p.n, qt = E / (N - 1);
      const tokens = {
        sens: tok(`${p.sens} mV·°C⁻¹`, 'Sensibilité du capteur', p.sens / 1000, 'V·°C⁻¹'),
        n: tok(`${p.n} bits`, 'Nombre de bits du CAN', p.n, 'bits'),
        vmin: tok(`${sg(p.vmin)} V`, 'Tension minimale de la plage d’entrée', p.vmin, 'V'),
        vmax: tok(`${sg(p.vmax)} V`, 'Tension maximale de la plage d’entrée', p.vmax, 'V'),
        fe: tok(`${p.fe} Hz`, 'Fréquence d’échantillonnage', p.fe, 'Hz'),
      };
      const debut = ['Un capteur de température délivre une tension proportionnelle à la température, avec une sensibilité de ', T('sens'),
        '. Cette tension est numérisée par un convertisseur analogique-numérique (CAN) de ', T('n'), ' dont la plage d’entrée va de ', T('vmin'), ' à ', T('vmax'),
        '. La fréquence d’échantillonnage est de ', T('fe'), '. On suppose le capteur parfaitement linéaire et le CAN idéal (son nombre N va de 0 à 2ⁿ − 1 : la plage d’entrée est découpée en 2ⁿ − 1 intervalles égaux). '];
      const derivees = [
        { id: 'E', nom: 'Étendue de la plage d’entrée', expr: 'étendue = V_max − V_min', val: E, u: 'V' },
        { id: 'N', nom: 'Nombre de valeurs numériques possibles', expr: 'N = 2^n', val: N, u: '' },
        { id: 'I', nom: 'Nombre d’intervalles égaux', expr: '2^n − 1', val: N - 1, u: '' },
      ];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quel est le quantum q du CAN (le plus petit écart de tension qu’il distingue) ?'], utiles: ['n', 'vmin', 'vmax'],
        raisons: { sens: 'La sensibilité du capteur sert à convertir une tension en température, pas à calculer le quantum du CAN.', fe: 'La fréquence d’échantillonnage fixe le nombre de mesures par seconde, pas la finesse de la numérisation.' },
        cherche: { bonne: 'Le quantum q du convertisseur (en V)', faux: ['La plus petite variation de température détectable (en °C)', 'La durée minimale entre deux mesures successives (en s)', 'Le nombre de valeurs numériques que le CAN peut fournir (sans unité)'] },
        manque: null, solution: { txt: 'q = frac(V_max − V_min|2^n − 1)', val: qt, u: 'V' } };
      return { tokens, texte: [...debut, 'Quelle est la plus petite variation de température que cette chaîne de mesure peut détecter ?'], utiles: ['sens', 'n', 'vmin', 'vmax'],
        derivees: [...derivees, { id: 'q', nom: 'Quantum q du CAN', expr: 'q = étendue / (2^n − 1)', val: qt, u: 'V' }],
        raisons: { fe: 'La fréquence d’échantillonnage fixe le nombre de mesures par seconde, pas la plus petite variation détectable.' },
        cherche: { bonne: 'La plus petite variation de température détectable (en °C)', faux: ['Le quantum q du convertisseur, plus petit écart de tension distingué (en V)', 'La durée minimale entre deux mesures successives (en s)', 'La plage de températures que le capteur peut mesurer (en °C)'] },
        manque: null, solution: { txt: 'Δθ = q / sensibilité', val: qt / (p.sens / 1000), u: '°C' } };
    },
  },
  // ───────────────────────────── 5. Échangeur (transferts thermiques)
  {
    id: 'echangeur', domaine: 'Transferts thermiques', titre: 'Un échangeur eau chaude – eau froide', noms: ['Puissance cédée par l’eau chaude', 'Température de sortie de l’eau froide'],
    schema: (p, b, q) => ({ type: 'echangeur', qc: b.tokens.qc.aff, Tce: b.tokens.Tce.aff, Tcs: b.tokens.Tcs.aff, qf: b.tokens.qf.aff, Tfe: b.tokens.Tfe.aff, Tfs: q === 1 ? '?' : '' }),
    gen: () => {
      for (;;) {
        const p = { qc: tire([0.2, 0.3, 0.4]), Tce: tire([70, 80, 90]), Tcs: tire([50, 55, 60]), qf: tire([0.3, 0.5]), Tfe: tire([10, 15, 20]) };
        const Tfs = p.Tfe + p.qc * (p.Tce - p.Tcs) / p.qf;
        if (Tfs < p.Tcs - 3) return p;                              // résultat physiquement cohérent quel que soit le sens des écoulements
      }
    },
    build: (p, q) => {
      const tokens = {
        qc: tok(`${nb(p.qc, 2)} kg·s⁻¹`, 'Débit massique de l’eau chaude', p.qc, 'kg·s⁻¹'),
        Tce: tok(`${p.Tce} °C`, 'Température d’entrée de l’eau chaude', p.Tce, '°C'),
        Tcs: tok(`${p.Tcs} °C`, 'Température de sortie de l’eau chaude', p.Tcs, '°C'),
        c: tok('4,18 kJ·kg⁻¹·K⁻¹', 'Capacité thermique massique de l’eau', 4180, 'J·kg⁻¹·K⁻¹'),
        qf: tok(`${nb(p.qf, 2)} kg·s⁻¹`, 'Débit massique de l’eau froide', p.qf, 'kg·s⁻¹'),
        Tfe: tok(`${p.Tfe} °C`, 'Température d’entrée de l’eau froide', p.Tfe, '°C'),
      };
      const debut = ['Dans un échangeur thermique, de l’eau chaude, de débit massique ', T('qc'), ', entre à ', T('Tce'), ' et ressort à ', T('Tcs'),
        '. De l’eau froide, de débit massique ', T('qf'), ', entre à ', T('Tfe'), '. La capacité thermique massique de l’eau vaut ', T('c'),
        ' (supposée constante sur la plage de température ; l’eau reste liquide, sans changement d’état). L’échangeur fonctionne en régime permanent et les pertes thermiques vers l’extérieur sont négligées. '];
      const dTc = p.Tce - p.Tcs, P = p.qc * 4180 * dTc;
      const derivees = [{ id: 'dTc', nom: 'Variation de température de l’eau chaude', expr: 'ΔT = T_entrée − T_sortie', val: dTc, u: 'K' }];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Quelle puissance thermique l’eau chaude cède-t-elle ?'], utiles: ['qc', 'Tce', 'Tcs', 'c'],
        raisons: { qf: 'Le débit de l’eau froide ne change pas l’énergie cédée par l’eau chaude.', Tfe: 'La température d’entrée de l’eau froide ne change pas l’énergie cédée par l’eau chaude.' },
        cherche: { bonne: 'La puissance thermique cédée par l’eau chaude (en W)', faux: ['L’énergie thermique cédée en une heure (en kJ)', 'La température de sortie de l’eau froide (en °C)', 'La variation de température de l’eau chaude (en K)'] },
        manque: null, solution: { txt: 'P = q_m,chaud · c · (T_entrée − T_sortie)', val: P, u: 'W' } };
      return { tokens, derivees: [...derivees, { id: 'P', nom: 'Puissance cédée par l’eau chaude', expr: 'P = q_m · c · ΔT', val: P, u: 'W' }],
        texte: [...debut, 'Quelle est la température de sortie de l’eau froide ?'], utiles: ['qc', 'Tce', 'Tcs', 'c', 'qf', 'Tfe'], raisons: {},
        cherche: { bonne: 'La température de sortie de l’eau froide (en °C)', faux: ['La puissance thermique cédée par l’eau chaude (en W)', 'La variation de température de l’eau chaude (en K)', 'La température moyenne dans l’échangeur (en °C)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la capacité thermique massique de l’eau', 'Il manque la température d’entrée de l’eau froide', 'Il ne manque que la surface d’échange'],
          expl: `Tout est dans l’énoncé : la capacité thermique massique de l’eau (${tokens.c.aff}), le débit de l’eau froide (${tokens.qf.aff}) et sa température d’entrée (${tokens.Tfe.aff}). Les pertes étant négligées, la puissance reçue par l’eau froide est celle que cède l’eau chaude (P_reçue = P_cédée) : ni la surface d’échange ni le coefficient U ne sont nécessaires.` },
        solution: { txt: 'T_sortie,froid = T_entrée,froid + frac(P|q_m,froid · c)', val: p.Tfe + P / (p.qf * 4180), u: '°C' } };
    },
  },
  // ───────────────────────────── 6. Beer-Lambert (spectrophotométrie)
  {
    id: 'beer', domaine: 'Chimie', titre: 'Une solution de permanganate', noms: ['Concentration', 'Transmittance'],
    gen: () => ({ lam: tire([520, 525, 530]), l: tire([1, 2]), A: tire([0.25, 0.452, 0.6, 0.8]), eps: 2400, theta: tire([20, 25]) }),
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde de la mesure', p.lam, 'nm'),
        l: tok(`${nb(p.l, 1)} cm`, 'Largeur de la cuve', p.l, 'cm'),
        A: tok(`${nb(p.A, 3)}`, 'Absorbance', p.A, ''),
        eps: tok('2,4×10³ L·mol⁻¹·cm⁻¹', 'Coefficient d’absorption molaire', p.eps, 'L·mol⁻¹·cm⁻¹'),
        theta: tok(`${p.theta} °C`, 'Température de la solution', p.theta, '°C'),
      };
      const debut = ['On mesure l’absorbance d’une solution aqueuse de permanganate de potassium à ', T('lam'), ' avec un spectrophotomètre, dans une cuve de largeur ', T('l'),
        '. On lit A = ', T('A'), '. À cette longueur d’onde, le coefficient d’absorption molaire des ions permanganate vaut ε = ', T('eps'), '. La solution est à ', T('theta'), '. La mesure est faite contre un blanc (solvant seul), avec une lumière monochromatique, et seuls les ions permanganate absorbent à cette longueur d’onde. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la concentration en ions permanganate de la solution (en mol·L⁻¹), en supposant la solution assez diluée pour que la loi de Beer-Lambert soit vérifiée ?'], utiles: ['A', 'l', 'eps'],
        raisons: { lam: 'La longueur d’onde est déjà « contenue » dans la valeur de ε donnée pour cette longueur d’onde.', theta: 'La température n’apparaît pas dans la loi de Beer-Lambert (son effet éventuel sur ε est négligé ici).' },
        cherche: { bonne: 'La concentration c en ions permanganate (en mol·L⁻¹)', faux: ['La transmittance T de la solution (en %)', 'La concentration en masse de permanganate (en g·L⁻¹)', 'La quantité de matière de permanganate dans la cuve (en mol)'] },
        manque: null, solution: { txt: 'c = frac(A|ε·ℓ)', val: p.A / (p.eps * p.l), u: 'mol·L⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la transmittance de la solution, c’est-à-dire la proportion de la lumière incidente qui la traverse (en %) ?'], utiles: ['A'],
        raisons: { lam: 'La longueur d’onde n’intervient pas pour passer de l’absorbance à la transmittance.', l: 'La largeur de la cuve est déjà prise en compte dans l’absorbance mesurée.',
          eps: 'ε et ℓ relient l’absorbance à la concentration ; ici on passe directement de A à T.', theta: 'La température n’intervient pas dans la relation entre absorbance et transmittance.' },
        cherche: { bonne: 'La transmittance T de la solution (en %)', faux: ['La concentration c en ions permanganate (en mol·L⁻¹)', 'La proportion de lumière absorbée par la solution (en %)', 'L’intensité lumineuse incidente (en W·m⁻²)'] },
        manque: null, solution: { txt: 'T = 10^(−A)', val: 100 * 10 ** (-p.A), u: '%' } };
    },
  },
  // ───────────────────────────── 7. Réservoir (statique des fluides)
  {
    id: 'reservoir', domaine: 'Transport des fluides', titre: 'Un réservoir d’eau', noms: ['Pression au fond', 'Masse d’eau contenue'],
    gen: () => ({ rho: 1000, h: tire([2, 3, 4, 5]), D: tire([1, 2, 3]), Patm: tire([1010, 1013, 1020]) }),
    build: (p, q) => {
      const tokens = {
        rho: tok(`${nb(p.rho)} kg·m⁻³`, 'Masse volumique de l’eau', p.rho, 'kg·m⁻³'),
        h: tok(`${nb(p.h, 1)} m`, 'Hauteur d’eau', p.h, 'm'),
        D: tok(`${nb(p.D, 1)} m`, 'Diamètre du réservoir', p.D, 'm'),
        Patm: tok(`${p.Patm} hPa`, 'Pression atmosphérique', p.Patm * 100, 'Pa'),
      };
      const debut = ['Un réservoir cylindrique, ouvert à l’air libre, contient de l’eau au repos (de masse volumique ', T('rho'), ') sur une hauteur de ', T('h'),
        '. Son diamètre est de ', T('D'), '. La pression atmosphérique vaut ', T('Patm'), '. '];
      const S = Math.PI * p.D ** 2 / 4;
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la pression absolue au fond du réservoir ?'], utiles: ['rho', 'h', 'Patm'],
        raisons: { D: 'La pression hydrostatique ne dépend que de la hauteur d’eau : le diamètre n’intervient pas.' },
        cherche: { bonne: 'La pression absolue au fond du réservoir (en Pa)', faux: ['La force exercée par l’eau sur le fond (en N)', 'La masse d’eau contenue dans le réservoir (en kg)', 'La pression due uniquement au poids de l’eau, sans la pression atmosphérique (en Pa)'] },
        manque: { bonne: 'Il manque l’intensité de la pesanteur g', faux: ['Il manque la masse volumique de l’eau', 'Il ne manque que la viscosité de l’eau', 'Il ne manque aucune donnée pour ce calcul'],
          expl: `La relation fondamentale de l’hydrostatique, P = P_atm + ρ·g·h, fait intervenir g, que l’énoncé ne donne pas (g = 9,81 N·kg⁻¹ sur Terre). Contrairement à π, g n’est pas une constante mathématique : elle dépend de l’astre, donc l’énoncé doit la préciser. La masse volumique (${tokens.rho.aff}), la hauteur d’eau (${tokens.h.aff}) et la pression atmosphérique (${tokens.Patm.aff}) y figurent bien ; la viscosité n’intervient pas pour un fluide au repos.` },
        solution: { txt: 'P_fond − P_atm = ρ·g·h  (ΔP = ρ·g·Δz), donc P_fond = P_atm + ρ·g·h', val: p.Patm * 100 + p.rho * 9.81 * p.h, u: 'Pa' } };
      return { tokens, texte: [...debut, 'Quelle est la masse d’eau contenue dans le réservoir ?'], utiles: ['rho', 'h', 'D'],
        derivees: [{ id: 'S', nom: 'Section S du réservoir', expr: 'S = frac(π·D²|4)', val: S, u: 'm²' }, { id: 'V', nom: 'Volume V d’eau', expr: 'V = S × h', val: S * p.h, u: 'm³' }],
        raisons: { Patm: 'La pression atmosphérique ne change pas la masse d’eau contenue.' },
        cherche: { bonne: 'La masse m d’eau contenue dans le réservoir (en kg)', faux: ['La pression absolue au fond du réservoir (en Pa)', 'Le poids de l’eau (en N)', 'Le débit d’eau nécessaire pour remplir le réservoir (en m³·s⁻¹)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la masse volumique de l’eau', 'Il manque le diamètre du réservoir', 'Il ne manque que l’intensité de la pesanteur g'],
          expl: `Tout est dans l’énoncé : la masse volumique (${tokens.rho.aff}), la hauteur d’eau (${tokens.h.aff}) et le diamètre (${tokens.D.aff}) pour calculer le volume V = π·D²/4 × h (π est une constante mathématique). On cherche une masse, pas un poids : g n’intervient pas (m = ρ·V).` },
        solution: { txt: 'm = ρ·V = ρ·S·h', val: p.rho * S * p.h, u: 'kg' } };
    },
  },
  // ───────────────────────────── Régulation
  {
    id: 'regulP', domaine: 'Régulation', titre: 'Régulation proportionnelle du niveau d’un réservoir', noms: ['Commande nécessaire', 'Écart statique', 'Niveau en régime permanent'],
    schema: (p, b) => ({ type: 'regul', Qmax: b.tokens.Qmax.aff, Qp: b.tokens.Qp.aff, hc: b.tokens.hc.aff, Kp: b.tokens.Kp.aff }),
    gen: () => ({ hc: tire([3, 4, 5]), Kp: tire([50, 80, 100, 150]), Qmax: tire([100, 120, 150]), Qp: tire([30, 36, 45, 60]), S: tire([2, 3, 4]), Ti: tire([20, 50, 100]) }),
    build: (p, q) => {
      const Y = p.Qp / p.Qmax * 100, e = Y / p.Kp;
      const tokens = {
        S: tok(`${p.S} m²`, 'Section du réservoir', p.S, 'm²'),
        Qmax: tok(`${p.Qmax} m³·h⁻¹`, 'Débit maximal de la pompe (commande de 100 %)', p.Qmax, 'm³·h⁻¹'),
        Qp: tok(`${p.Qp} m³·h⁻¹`, 'Débit de soutirage', p.Qp, 'm³·h⁻¹'),
        hc: tok(`${p.hc} m`, 'Consigne de niveau', p.hc, 'm'),
        Kp: tok(`${p.Kp} %·m⁻¹`, 'Gain proportionnel du régulateur', p.Kp, '%·m⁻¹'),
        Ti: tok(`${p.Ti} h`, 'Temps intégral (indiqué sur la fiche du régulateur)', p.Ti, 'h'),
      };
      const debut = ['Un réservoir de section ', T('S'), ' est rempli par une pompe dont le débit est proportionnel à la commande Y (100 % ↔ ', T('Qmax'), '). Un soutirage constant de ', T('Qp'),
        ' vide le réservoir.\n\nLe régulateur proportionnel calcule Y = K_p × (consigne − H), où H est le niveau du liquide dans le réservoir, sans commande de base (Y est limitée entre 0 et 100 %), avec K_p = ', T('Kp'), ' ; la consigne est de ', T('hc'), '.\n\nLa fiche du régulateur (réglable en PI) indique un temps intégral de ', T('Ti'), ', mais l’action intégrale est désactivée : le régulateur est utilisé en proportionnel seul.\n\nLe capteur de niveau et la pompe sont supposés parfaits (sans retard). On admet que le niveau finit par se stabiliser. '];
      const rS = 'La section règle la vitesse d’évolution du niveau, pas sa valeur en régime permanent.', rTi = 'Le régulateur est proportionnel seul : sa loi Y = K_p × (consigne − H) ne contient pas de temps intégral, ce réglage ne sert pas dans ce calcul.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'En régime permanent, quelle commande Y le régulateur doit-il envoyer à la pompe ?'], utiles: ['Qmax', 'Qp'],
        raisons: { S: rS, hc: 'La consigne intervient dans le calcul de l’écart, pas dans la commande nécessaire pour compenser le soutirage.', Kp: 'Le gain relie la commande à l’écart de niveau, mais ne dit pas quelle commande est nécessaire.', Ti: rTi },
        cherche: { bonne: 'La commande Y envoyée à la pompe (en %)', faux: ['Le niveau de liquide en régime permanent (en m)', 'L’écart entre la consigne et le niveau (en m)', 'La durée de vidange du réservoir sans pompe (en h)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le débit maximal de la pompe', 'Il manque le débit de soutirage', 'Il ne manque que la masse volumique du liquide'],
          expl: `Tout est dans l’énoncé : le débit maximal de la pompe (${tokens.Qmax.aff} pour 100 %) et le débit de soutirage (${tokens.Qp.aff}). En régime permanent, le niveau est stable, donc le débit de la pompe est égal au soutirage : Y/100 × Q_max = Q_p. La masse volumique n’intervient pas : les deux débits sont déjà des débits volumiques.` },
        solution: { txt: 'Y = frac(Q_p|Q_max) × 100', val: Y, u: '%' } };
      if (q === 1) return { tokens, texte: [...debut, 'Quel est l’écart statique, c’est-à-dire l’écart (consigne − niveau) qui subsiste en régime permanent ?'], utiles: ['Qmax', 'Qp', 'Kp'],
        derivees: [{ id: 'Y', nom: 'Commande nécessaire', expr: 'Y = frac(Q_p|Q_max) × 100', val: Y, u: '%' }],
        raisons: { S: rS, hc: 'L’écart ne dépend pas de la valeur de la consigne, seulement de la commande à fournir et du gain.', Ti: rTi },
        cherche: { bonne: 'L’écart statique entre la consigne et le niveau (en m)', faux: ['La commande Y (en %)', 'Le niveau de liquide (en m)', 'Le temps pour atteindre le régime permanent (en h)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le gain proportionnel du régulateur', 'Il manque le débit maximal de la pompe', 'Il ne manque que la hauteur du réservoir'],
          expl: `Tout est dans l’énoncé : le gain K_p (${tokens.Kp.aff}), ainsi que le débit maximal de la pompe (${tokens.Qmax.aff}) et le débit de soutirage (${tokens.Qp.aff}) qui donnent la commande Y. Le régulateur ne fournit Y que s’il y a un écart : écart = frac(Y|K_p). La hauteur du réservoir n’intervient pas.` },
        solution: { txt: 'écart = frac(Y|K_p)', val: e, u: 'm' } };
      return { tokens, texte: [...debut, 'Quel est le niveau du liquide en régime permanent ?'], utiles: ['Qmax', 'Qp', 'Kp', 'hc'],
        derivees: [{ id: 'Y', nom: 'Commande nécessaire', expr: 'Y = frac(Q_p|Q_max) × 100', val: Y, u: '%' }, { id: 'e', nom: 'Écart statique', expr: 'écart = frac(Y|K_p)', val: e, u: 'm' }],
        raisons: { S: rS, Ti: rTi },
        cherche: { bonne: 'Le niveau H en régime permanent (en m)', faux: ['L’écart statique (en m)', 'La commande Y (en %)', 'Le volume de liquide contenu dans le réservoir (en m³)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la consigne de niveau', 'Il manque le gain proportionnel du régulateur', 'Il ne manque que le débit de soutirage'],
          expl: `Tout est dans l’énoncé : la consigne (${tokens.hc.aff}), le gain K_p (${tokens.Kp.aff}), le débit maximal de la pompe (${tokens.Qmax.aff}) et le débit de soutirage (${tokens.Qp.aff}). Un régulateur proportionnel (sans action intégrale) laisse le niveau sous la consigne (le soutirage demande une commande non nulle) : H = consigne − écart.` },
        solution: { txt: 'H = consigne − écart', val: p.hc - e, u: 'm' } };
    },
  },
  {
    id: 'premord', schema: () => ({ type: 'capteurBain' }), domaine: 'Régulation', titre: 'Réponse d’un capteur de température (1er ordre)', noms: ['Temps de réponse à 5 %', 'Température lue après une durée t'],
    gen: () => {
      const tau = tire([15, 20, 30, 40]), k = tire([1, 2, 4]);   // jamais t = 3τ : ce serait la réponse du temps de réponse à 5 %
      return { tau, T0: tire([15, 20, 25]), Tf: tire([60, 80, 100]), t: tau * k, res: tire([0.1, 0.5]), m: tire([12, 15, 20]) };
    },
    build: (p, q) => {
      const tokens = {
        tau: tok(`${p.tau} s`, 'Constante de temps du capteur', p.tau, 's'),
        T0: tok(`${p.T0} °C`, 'Température initiale du capteur', p.T0, '°C'),
        Tf: tok(`${p.Tf} °C`, 'Température du bain', p.Tf, '°C'),
        res: tok(`${nb(p.res, 1)} °C`, 'Résolution de l’afficheur', p.res, '°C'),
        m: tok(`${p.m} g`, 'Masse du capteur', p.m, 'g'),
      };
      const debut = ['Un capteur de température se comporte comme un système du 1er ordre de constante de temps ', T('tau'), '. À l’instant initial, il est à ', T('T0'), ' et on le plonge dans un bain maintenu à ', T('Tf'),
        '. L’afficheur a une résolution de ', T('res'), ' et le capteur a une masse de ', T('m'), '. '];
      const rRes = 'La résolution de l’afficheur ne change pas la réponse du capteur : elle limite seulement le nombre de chiffres affichés, pas la température réelle.', rM = 'La masse est déjà prise en compte dans la constante de temps donnée.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le temps de réponse à 5 % du capteur, c’est-à-dire la durée au bout de laquelle il a atteint 95 % de la variation totale de température ?'], utiles: ['tau'],
        raisons: { T0: 'Un temps de réponse à 5 % ne dépend pas des températures de départ et d’arrivée.', Tf: 'Un temps de réponse à 5 % ne dépend pas des températures de départ et d’arrivée.', res: rRes, m: rM },
        cherche: { bonne: 'Le temps de réponse à 5 % du capteur (en s)', faux: ['La température du capteur au bout d’une durée τ (en °C)', 'La fréquence de coupure du capteur (en Hz)', 'La durée pour atteindre 99 % de la variation (en s)'] },
        manque: null,
        solution: { txt: `t₅ % = τ·ln 20 ≈ 3 × τ (valeur exacte ${nb(Math.log(20) * p.tau, 3)} s, arrondie à 3τ = ${3 * p.tau} s)`, val: 3 * p.tau, u: 's' } };
      tokens.t = tok(`${p.t} s`, 'Durée écoulée depuis l’immersion', p.t, 's');
      const f = 1 - Math.exp(-p.t / p.tau), dT = p.Tf - p.T0;
      return { tokens, texte: [...debut, 'Quelle est la température réelle du capteur ', T('t'), ' après l’immersion ?'], utiles: ['tau', 'T0', 'Tf', 't'],
        derivees: [{ id: 'dT', nom: 'Écart total à parcourir', expr: 'ΔT = T_f − T_0', val: dT, u: '°C' }, { id: 'f', nom: 'Fraction de l’écart atteinte', expr: 'f = 1 − e^(−t/τ)', val: f, u: '' }],
        raisons: { res: rRes, m: rM },
        cherche: { bonne: 'La température réelle du capteur à l’instant t (en °C)', faux: ['Le temps de réponse à 5 % (en s)', 'La vitesse de variation de la température à l’instant t (en °C·s⁻¹)', 'La durée pour atteindre 99 % de la variation (en s)'] },
        manque: null,
        solution: { txt: 'T = T_0 + (T_f − T_0)·(1 − e^(−t/τ))', val: p.T0 + dT * f, u: '°C' } };
    },
  },
  // ───────────────────────────── Distillation
  {
    id: 'distil', domaine: 'Distillation', titre: 'Distillation d’un mélange eau–éthanol', noms: ['Volume d’éthanol présent', 'Rendement de la distillation'],
    gen: () => {
      const V = tire([200, 250, 300, 400, 500]), x = tire([10, 12, 15, 20]), y = tire([80, 85, 90]), P = tire([400, 500, 600]);
      const Vd = Math.round(V * x / 100 * tire([0.6, 0.7, 0.75, 0.8]) / (y / 100));
      return { V, x, y, P, Vd, Te: 78.4 };
    },
    build: (p, q) => {
      const tokens = {
        V: tok(`${p.V} mL`, 'Volume du mélange initial', p.V, 'mL'),
        x: tok(`${p.x} %`, 'Proportion d’éthanol dans le mélange (en volume)', p.x, '%'),
        P: tok(`${p.P} W`, 'Puissance du chauffe-ballon', p.P, 'W'),
        Te: tok(`${nb(p.Te, 1)} °C`, 'Température d’ébullition de l’éthanol', p.Te, '°C'),
        Vd: tok(`${p.Vd} mL`, 'Volume de distillat recueilli', p.Vd, 'mL'),
        y: tok(`${p.y} %`, 'Proportion d’éthanol dans le distillat (en volume)', p.y, '%'),
      };
      const debut = ['On distille avec une colonne (distillation fractionnée) ', T('V'), ' d’un mélange eau–éthanol qui contient ', T('x'), ' d’éthanol en volume. Le chauffe-ballon a une puissance de ', T('P'),
        '. L’éthanol bout à ', T('Te'), ' (l’eau à 100 °C). On recueille ', T('Vd'), ' d’un distillat qui contient ', T('y'), ' d’éthanol en volume (pourcentages mesurés à la même température). L’éthanol qui n’est pas dans le distillat reste dans le ballon. '];
      const Vi = p.V * p.x / 100, Vr = p.Vd * p.y / 100;
      const rTemp = 'La température d’ébullition explique la séparation, mais n’entre pas dans le calcul d’un volume ou d’un rendement.';
      const rPuis = 'La puissance de chauffe fixe la vitesse de chauffage (donc la durée de la distillation), pas les volumes.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel volume d’éthanol contenait le mélange initial ?'], utiles: ['V', 'x'],
        raisons: { P: rPuis, Te: rTemp, Vd: 'Le distillat est ce que l’on récupère après la distillation : il ne dit pas ce qu’il y avait au départ.', y: 'La pureté du distillat concerne ce que l’on récupère, pas le mélange initial.' },
        cherche: { bonne: 'Le volume d’éthanol présent dans le mélange initial (en mL)', faux: ['Le volume d’éthanol récupéré dans le distillat (en mL)', 'Le rendement de la distillation, part d’éthanol récupérée (en %)', 'La masse d’éthanol présente dans le mélange initial (en g)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le volume du mélange initial', 'Il manque la proportion d’éthanol dans le mélange', 'Il ne manque que la masse volumique de l’éthanol'],
          expl: `Tout est dans l’énoncé : le volume du mélange (${tokens.V.aff}) et sa proportion d’éthanol en volume (${tokens.x.aff}). Un pourcentage en volume s’applique à un volume : V_éthanol = x × V. Aucune masse volumique n’est nécessaire.` },
        solution: { txt: 'V_éthanol = (frac(x|100)) × V', val: Vi, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quel est le rendement de la distillation (volume d’éthanol récupéré par rapport au volume d’éthanol présent) ?'], utiles: ['V', 'x', 'Vd', 'y'],
        derivees: [{ id: 'Vi', nom: 'Volume d’éthanol présent au départ', expr: 'V_i = frac(V × x|100)', val: Vi, u: 'mL' }, { id: 'Vr', nom: 'Volume d’éthanol dans le distillat', expr: 'V_r = frac(V_distillat × y|100)', val: Vr, u: 'mL' }],
        raisons: { P: rPuis, Te: rTemp },
        cherche: { bonne: 'Le rendement : éthanol récupéré / éthanol présent (en %)', faux: ['Le rendement : volume de distillat / volume de mélange initial (en %)', 'Le volume d’éthanol récupéré dans le distillat (en mL)', 'Le volume d’éthanol non récupéré dans le distillat (en mL)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le volume de distillat recueilli', 'Il manque la proportion d’éthanol dans le distillat', 'Il ne manque que la masse volumique de l’éthanol'],
          expl: `Tout est dans l’énoncé : pour l’éthanol présent au départ, le volume du mélange (${tokens.V.aff}) et sa proportion d’éthanol (${tokens.x.aff}) ; pour l’éthanol récupéré, le volume de distillat (${tokens.Vd.aff}) et sa proportion d’éthanol (${tokens.y.aff}). Ces quantités d’éthanol se calculent à partir de volumes et de pourcentages en volume (aucune masse volumique n’est nécessaire) ; le rendement est leur rapport.` },
        solution: { txt: 'η = frac(V_r|V_i) × 100', val: Vr / Vi * 100, u: '%' } };
    },
  },
  // ───────────────────────────── Évaporation et cristallisation
  {
    id: 'cristal', schema: () => ({ type: 'refroidissement' }), domaine: 'Évaporation et cristallisation', titre: 'Refroidir une solution saturée de nitrate de potassium', noms: ['Masse dissoute à 60 °C', 'Masse de cristaux obtenue'],
    gen: () => ({ me: tire([100, 150, 200, 250]), s60: tire([108, 110, 112]), s20: tire([31, 32, 33]), dur: tire([30, 45, 60]), mb: tire([80, 120, 150]) }),
    build: (p, q) => {
      const tokens = {
        me: tok(`${p.me} g`, 'Masse d’eau', p.me, 'g'),
        mb: tok(`${p.mb} g`, 'Masse du bécher vide', p.mb, 'g'),
        s60: tok(`${p.s60} g pour 100 g d’eau`, 'Solubilité du nitrate de potassium à 60 °C', p.s60, 'g pour 100 g d’eau'),
        s20: tok(`${p.s20} g pour 100 g d’eau`, 'Solubilité du nitrate de potassium à 20 °C', p.s20, 'g pour 100 g d’eau'),
        dur: tok(`${p.dur} minutes`, 'Durée du refroidissement', p.dur, 'min'),
      };
      const debut = ['On prépare à 60 °C une solution saturée de nitrate de potassium dans ', T('me'), ' d’eau, dans un bécher de masse ', T('mb'), ' (vide). À 60 °C, la solubilité du nitrate de potassium est de ',
        T('s60'), ' ; à 20 °C, elle est de ', T('s20'), '. On refroidit la solution lentement jusqu’à 20 °C en ', T('dur'), '. '];
      const m60 = p.s60 * p.me / 100, m20 = p.s20 * p.me / 100;
      const rB = 'Le bécher n’intervient pas dans la quantité de soluté dissous.', rD = 'La durée du refroidissement ne change pas les masses à l’équilibre.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle masse de nitrate de potassium est dissoute dans la solution à 60 °C ?'], utiles: ['me', 's60'],
        raisons: { mb: rB, dur: rD, s20: 'Cette solubilité concerne 20 °C : la solution de départ est à 60 °C.' },
        cherche: { bonne: 'La masse de nitrate de potassium dissoute à 60 °C (en g)', faux: ['La masse de cristaux formés au refroidissement (en g)', 'La masse de nitrate de potassium encore dissoute à 20 °C (en g)', 'La masse totale de solution (en g)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la masse d’eau de la solution', 'Il manque la solubilité du nitrate de potassium à 60 °C', 'Il ne manque que la masse molaire du nitrate de potassium'],
          expl: `Tout est dans l’énoncé : la masse d’eau (${tokens.me.aff}) et la solubilité à 60 °C (${tokens.s60.aff}). La solubilité est proportionnelle à la masse d’eau : on ramène la valeur donnée « pour 100 g d’eau » à la masse d’eau de l’énoncé. La masse molaire n’intervient pas : on raisonne en masses.` },
        solution: { txt: 'm_dissoute(60 °C) = frac(s₆₀ × m_eau|100)', val: m60, u: 'g' } };
      return { tokens, texte: [...debut, 'On suppose que la solution est de nouveau saturée à 20 °C et qu’il n’y a pas d’évaporation. Quelle masse de cristaux obtient-on à 20 °C ?'], utiles: ['me', 's60', 's20'],
        derivees: [{ id: 'm60', nom: 'Masse dissoute à 60 °C', expr: 'm₆₀ = frac(s₆₀ × m_eau|100)', val: m60, u: 'g' }, { id: 'm20', nom: 'Masse encore dissoute à 20 °C', expr: 'm₂₀ = frac(s₂₀ × m_eau|100)', val: m20, u: 'g' }],
        raisons: { mb: rB, dur: rD },
        cherche: { bonne: 'La masse de cristaux formés au refroidissement (en g)', faux: ['La masse de nitrate de potassium dissoute à 60 °C (en g)', 'La masse de nitrate de potassium encore dissoute à 20 °C (en g)', 'La masse totale de solution à 60 °C (en g)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque la solubilité du nitrate de potassium à 20 °C', 'Il manque la masse d’eau de la solution', 'Il ne manque que la masse volumique de la solution'],
          expl: `Tout est dans l’énoncé : la masse d’eau (${tokens.me.aff}), la solubilité à 60 °C (${tokens.s60.aff}) et la solubilité à 20 °C (${tokens.s20.aff}). Ce qui cristallise est la différence entre la masse dissoute à 60 °C et celle qui peut encore l’être à 20 °C. La masse volumique de la solution n’intervient pas.` },
        solution: { txt: 'm_cristaux = m₆₀ − m₂₀', val: m60 - m20, u: 'g' } };
    },
  },
  // ───────────────────────────── Mesure et incertitudes (TSTL)
  {
    id: 'incertA', domaine: 'Mesure et incertitudes', titre: 'Incertitude d’une série de mesures répétées', noms: ['Incertitude-type de la moyenne', 'Incertitude élargie', 'Borne haute de l’intervalle'],
    gen: () => { const n = tire([9, 16, 25]), u0 = tire([0.03, 0.04, 0.05]); return { n, s: Math.round(u0 * Math.sqrt(n) * 100) / 100, xm: tire([12.4, 15.2, 18.6, 20.3, 22.7, 24.1]), k: 2, res: tire([0.01, 0.02]), dur: tire([10, 15, 20]) }; },
    build: (p, q) => {
      const u = p.s / Math.sqrt(p.n), U = p.k * u;
      const tokens = {
        n: tok(`${p.n}`, 'Nombre de mesures de la série', p.n, ''),
        xm: tok(`${nb(p.xm, 1)} mL`, 'Moyenne des mesures', p.xm, 'mL'),
        s: tok(`${nb(p.s, 2)} mL`, 'Écart-type expérimental de la série', p.s, 'mL'),
        k: tok('k = 2', 'Facteur d’élargissement', p.k, ''),
        res: tok(`${nb(p.res, 2)} mL`, 'Résolution de la burette', p.res, 'mL'),
        dur: tok(`${p.dur} min`, 'Durée de la série', p.dur, 'min'),
      };
      const debut = ['On répète ', T('n'), ' fois le titrage d’une même solution, dans les mêmes conditions.\n\nLe volume équivalent moyen est ', T('xm'), ' et l’écart-type expérimental de la série vaut ', T('s'),
        '.\n\nLa burette (numérique) a une résolution de ', T('res'), ' ; la série a duré ', T('dur'), '.\n\nOn élargit l’incertitude avec ', T('k'), ' (convention : niveau de confiance voisin de 95 % si les mesures sont indépendantes et suivent une loi normale, hypothèses faites ici ; un peu moins pour un petit nombre de mesures). '];
      const ur = p.res / Math.sqrt(6), pc = (Math.sqrt(1 + (ur / u) ** 2) - 1) * 100;   // deux lectures de burette, loi rectangulaire : u_res = r / (2√3) par lecture
      const rRes0 = `La résolution de la burette est une autre source d’incertitude (type B) : pour deux lectures, u_res = frac(r|sqrt(6)) ≈ ${nb(ur, 3)} mL. Ajoutée en quadrature à u ≈ ${nb(u, 3)} mL, elle ne la modifierait que d’environ ${nb(pc, 1)} % : négligeable devant la dispersion, donc on se limite ici à l’incertitude de type A, u = frac(s|sqrt(n)).`;
      const rRes = q === 0 ? rRes0 : q === 1 ? rRes0.replace('on se limite ici à l’incertitude de type A, u = frac(s|sqrt(n)).', 'on calcule U = k × u avec l’incertitude de type A seule.') : rRes0.replace('on se limite ici à l’incertitude de type A, u = frac(s|sqrt(n)).', 'l’intervalle x̄ ± U se calcule avec l’incertitude de type A seule.');
      const rDur = 'La durée de la série n’intervient pas dans le calcul de l’incertitude.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est l’incertitude-type de type A, u, de la moyenne de la série ?'], utiles: ['s', 'n'],
        raisons: { xm: 'La valeur de la moyenne ne change pas l’incertitude : elle dépend de la dispersion et du nombre de mesures.', k: 'Le facteur d’élargissement sert pour l’incertitude élargie, pas pour l’incertitude-type.', res: rRes, dur: rDur },
        cherche: { bonne: 'L’incertitude-type u de la moyenne (en mL)', faux: ['L’incertitude élargie U (en mL)', 'L’incertitude relative frac(u|x̄) (sans unité)', 'La variance de la série (en mL²)'] },
        manque: null, solution: { txt: 'u = frac(s|sqrt(n))', val: u, u: 'mL' } };
      if (q === 1) return { tokens, texte: [...debut, 'Quelle est l’incertitude élargie U associée à la moyenne de la série, obtenue à partir de l’incertitude-type de type A ?'], utiles: ['s', 'n', 'k'],
        derivees: [{ id: 'u', nom: 'Incertitude-type de la moyenne', expr: 'u = frac(s|sqrt(n))', val: u, u: 'mL' }],
        raisons: { xm: 'La moyenne ne sert pas à calculer l’incertitude.', res: rRes, dur: rDur },
        cherche: { bonne: 'L’incertitude élargie U de la moyenne (en mL)', faux: ['L’incertitude-type u de la moyenne (en mL)', 'La borne basse x̄ − U de l’intervalle (en mL)', 'L’incertitude relative frac(U|x̄) (en %)'] },
        manque: null, solution: { txt: 'U = k × u', val: U, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quelle est la borne haute de l’intervalle x̄ ± U (x̄ : volume moyen de la série ; U : incertitude élargie associée à cette moyenne, obtenue à partir de l’incertitude-type de type A) ?'], utiles: ['xm', 's', 'n', 'k'],
        derivees: [{ id: 'u', nom: 'Incertitude-type de la moyenne', expr: 'u = frac(s|sqrt(n))', val: u, u: 'mL' }, { id: 'U', nom: 'Incertitude élargie', expr: 'U = k × u', val: U, u: 'mL' }],
        raisons: { res: rRes, dur: rDur },
        cherche: { bonne: 'La plus grande valeur de l’intervalle centré sur x̄ (en mL)', faux: ['La plus petite valeur de l’intervalle centré sur x̄ (en mL)', 'La demi-largeur de l’intervalle centré sur x̄ (en mL)', 'La largeur totale de l’intervalle centré sur x̄ (en mL)'] },
        manque: null, solution: { txt: 'x̄ + U', val: p.xm + U, u: 'mL' } };
    },
  },
  {
    id: 'compatS', domaine: 'Mesure et incertitudes', titre: 'Une mesure et sa valeur de référence', noms: ['Écart à la référence', 'Compatibilité avec la référence'],
    gen: () => {
      const cref = tire([0.05, 0.1, 0.2]), sg_ = tire([-1, 1]), compat = Math.random() < 0.5;   // un tirage sur deux compatible ; jamais proche du seuil 2
      for (;;) {
        const d = tire([0.001, 0.002, 0.003, 0.004, 0.006]), u = tire([0.001, 0.002, 0.003]), r = d / u;
        if (compat ? r <= 1.51 : r >= 2.5) return { cref, x: Math.round((cref + sg_ * d) * 1000) / 1000, d, u, n: tire([20, 25, 30, 40]), theta: tire([20, 22, 25]) };
      }
    },
    build: (p, q) => {
      const tokens = {
        x: tok(`${nb(p.x, 3)} mol·L⁻¹`, 'Concentration mesurée', p.x, 'mol·L⁻¹'),
        u: tok(`${nb(p.u, 3)} mol·L⁻¹`, 'Incertitude-type de la mesure', p.u, 'mol·L⁻¹'),
        cref: tok(`${nb(p.cref, 3)} mol·L⁻¹`, 'Valeur de référence (solution étalon)', p.cref, 'mol·L⁻¹'),
        n: tok(`${p.n} dosages`, 'Nombre de dosages de la série', p.n, ''),
        theta: tok(`${p.theta} °C`, 'Température du laboratoire', p.theta, '°C'),
      };
      const debut = ['On dose une solution étalon et on trouve ', T('x'), ', avec une incertitude-type ', T('u'), ' (déjà calculée à partir de ', T('n'), '). La valeur de référence de l’étalon est ', T('cref'),
        '. Le laboratoire est à ', T('theta'), '. '];
      const rN = 'Le nombre de dosages a déjà servi à calculer l’incertitude-type, qui est donnée.', rT = 'La température n’intervient pas dans la comparaison.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’écart entre la mesure et la référence ?'], utiles: ['x', 'cref'],
        raisons: { u: 'L’incertitude-type sert à juger l’écart, pas à le calculer.', n: rN, theta: rT },
        cherche: { bonne: 'L’écart |x − x_ref| entre mesure et référence (en mol·L⁻¹)', faux: ['L’incertitude élargie U de la mesure (en mol·L⁻¹)', 'Le rapport de l’écart à l’incertitude-type (sans unité)', 'L’erreur relative de la mesure par rapport à la référence (en %)'] },
        manque: null, solution: { txt: '|x − x_ref|', val: p.d, u: 'mol·L⁻¹' } };
      return { tokens, texte: [...debut, 'La mesure est-elle compatible avec la référence ? (On admet que les résultats suivent une loi normale, que la valeur de référence est connue avec une incertitude négligeable et que le nombre de dosages est assez grand pour que l’incertitude donnée soit bien connue. On applique le critère usuel : la mesure est jugée compatible si l’écart normalisé est au plus égal à 2 ; si la mesure et la référence étaient réellement en accord, un écart normalisé supérieur à 2 apparaîtrait moins d’une fois sur vingt environ.)'], utiles: ['x', 'cref', 'u'],
        derivees: [{ id: 'e', nom: 'Écart à la référence', expr: '|x − x_ref|', val: p.d, u: 'mol·L⁻¹' }, { id: 'r', nom: 'Écart rapporté à l’incertitude-type', expr: '|x − x_ref| / u', val: p.d / p.u, u: '' }],
        raisons: { n: 'Le nombre de dosages a déjà servi à calculer l’incertitude-type, qui est donnée ; on le suppose assez grand (20 dosages ou plus) pour que le seuil 2 convienne : avec peu de dosages, le seuil serait plus grand.', theta: rT },
        cherche: { bonne: 'Si la mesure est compatible avec la référence (oui ou non)', faux: ['L’écart |x − x_ref| entre mesure et référence (en mol·L⁻¹)', 'L’incertitude élargie U de la mesure (en mol·L⁻¹)', 'Le pourcentage d’erreur par rapport à la référence (en %)'] },
        manque: null, solution: { txt: `écart normalisé = |x − x_ref| / u = ${nb(p.d / p.u, 2)} ; seuil 2 : ${p.d / p.u <= 2 ? 'rapport au plus égal à 2, la mesure est compatible avec la référence (réponse : oui)' : 'rapport supérieur à 2, la mesure n’est pas compatible avec la référence (réponse : non)'}`, val: p.d / p.u, u: '' } };
    },
  },

  // ───────────────────────────── Contrôle des systèmes (TSTL) : moteur pas à pas et champ magnétique
  {
    id: 'moteurPas', domaine: 'Contrôle des systèmes', titre: 'Un moteur pas à pas piloté par un programme', noms: ['Angle d’un pas', 'Fréquence des pas', 'Vitesse de rotation', 'Rotation obtenue'],
    gen: () => ({ N: tire([20, 48, 200]), D: tire([4, 5, 8, 10]), Np: tire([100, 200, 400, 600]), U: tire([12, 24]), R: tire([8, 10, 20]) }),
    build: (p, q) => {
      const f = 1000 / p.D;
      const tokens = {
        N: tok(`${p.N} pas par tour`, 'Nombre de pas pour faire un tour complet', p.N, 'pas/tour'),
        D: tok(`${p.D} ms`, 'Attente entre deux pas dans le programme (instruction delay)', p.D, 'ms'),
        Np: tok(`${p.Np} pas`, 'Nombre de pas commandés par le programme', p.Np, 'pas'),
        U: tok(`${p.U} V`, 'Tension d’alimentation', p.U, 'V'),
        R: tok(`${p.R} Ω`, 'Résistance d’une bobine', p.R, 'Ω'),
      };
      const debut = ['Un moteur pas à pas fait ', T('N'), '. Un programme allume les bobines pas après pas, en attendant ', T('D'), ' entre deux pas, et commande ', T('Np'),
        ' au total. Le moteur est alimenté sous ', T('U'), ' et chaque bobine a une résistance de ', T('R'), '. On suppose que chaque instruction fait avancer le rotor d’un pas entier, sans pas manqué, et que le temps d’exécution des instructions est négligeable. '];
      const rU = 'La tension d’alimentation fixe le couple disponible, pas l’angle ni la fréquence des pas.', rR = 'La résistance des bobines fixe le courant, pas l’angle ni la fréquence des pas.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De quel angle tourne le rotor à chaque pas ?'], utiles: ['N'],
        raisons: { D: 'Le délai fixe la vitesse, pas l’angle d’un pas.', Np: 'Le nombre de pas commandés dit combien de pas on fait, pas de quel angle chacun tourne.', U: rU, R: rR },
        cherche: { bonne: 'L’angle d’un pas (en °)', faux: ['La vitesse de rotation (en tr/min)', 'La fréquence des pas (en Hz)', 'Le nombre de tours effectués'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le nombre de pas pour faire un tour complet', 'Il manque le nombre de pas commandés par le programme', 'Il ne manque que la masse du rotor'],
          expl: `Tout est dans l’énoncé : le rotor fait ${tokens.N.aff}. Un tour complet fait 360° et se décompose en N pas égaux. Le nombre de pas commandés (${tokens.Np.aff}) est aussi donné, mais il ne sert pas pour l’angle d’un seul pas.` },
        solution: { txt: 'α = frac(360°|N)', val: 360 / p.N, u: '°' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'Combien de pas le moteur fait-il par seconde ?'], utiles: ['D'],
        raisons: { N: 'Le nombre de pas par tour ne change pas le nombre de pas par seconde.', Np: 'Le nombre total de pas ne donne pas le rythme auquel ils s’enchaînent.', U: rU, R: rR },
        cherche: { bonne: 'La fréquence des pas (en pas par seconde)', faux: ['La vitesse de rotation (en tr/min)', 'La durée totale du programme (en s)', 'L’angle d’un pas (en °)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque l’attente entre deux pas dans le programme', 'Il manque le nombre de pas pour faire un tour complet', 'Il ne manque que le couple résistant'],
          expl: `Tout est dans l’énoncé : l’attente entre deux pas (${tokens.D.aff}). Un pas dure D millisecondes et 1 s = 1 000 ms : en 1 000 ms, on fait 1 000 / D pas. Le nombre de pas par tour (${tokens.N.aff}) est donné, mais il ne sert pas pour compter les pas par seconde.` },
        solution: { txt: 'f = 1 000 / D (D en ms)', val: f, u: 'pas/s' } };
      if (q === 2) return { tokens, texte: [...debut, 'Quelle est la vitesse de rotation du moteur, en tours par minute ?'], utiles: ['N', 'D'],
        derivees: [{ id: 'f', nom: 'Fréquence des pas', expr: 'f = 1 000 / D', val: f, u: 'pas/s' }],
        raisons: { Np: 'Le nombre total de pas ne change pas la vitesse, seulement la durée de la rotation.', U: 'La tension d’alimentation fixe le couple disponible, pas la vitesse de rotation : celle-ci dépend du rythme des pas.', R: 'La résistance des bobines fixe le courant, pas la vitesse de rotation : celle-ci dépend du rythme des pas.' },
        cherche: { bonne: 'La vitesse de rotation n (en tr/min)', faux: ['La fréquence des pas (en Hz)', 'Le nombre de tours effectués', 'L’angle tourné en un pas (en °)'] },
        manque: { bonne: 'Il ne manque aucune donnée pour ce calcul', faux: ['Il manque le nombre de pas pour faire un tour complet', 'Il manque l’attente entre deux pas dans le programme', 'Il ne manque que le courant dans les bobines'],
          expl: `Tout est dans l’énoncé : l’attente entre deux pas (${tokens.D.aff}) et le nombre de pas par tour (${tokens.N.aff}). f = 1 000 / D pas par seconde ; diviser par N pas par tour = f/N tours par seconde ; × 60 (1 min = 60 s) pour passer en tours par minute.` },
        solution: { txt: 'n = frac(60 × f|N)', val: 60 * f / p.N, u: 'tr/min' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de tours le rotor fait-il au total ?'], utiles: ['N', 'Np'],
        raisons: { D: 'Le délai fixe la vitesse, pas le nombre de tours : il change seulement la durée.', U: 'La tension ne change pas le nombre de tours : il ne dépend que du nombre de pas commandés et du nombre de pas par tour.', R: 'La résistance des bobines ne change pas le nombre de tours : il ne dépend que du nombre de pas commandés et du nombre de pas par tour.' },
        cherche: { bonne: 'Le nombre de tours effectués', faux: ['La vitesse de rotation (en tr/min)', 'La durée du programme (en s)', 'L’angle d’un pas (en °)'] },
        manque: null, solution: { txt: 'tours = frac(N_p|N)', val: p.Np / p.N, u: 'tours' } };
    },
  },
  {
    id: 'champB', domaine: 'Contrôle des systèmes', titre: 'Une boussole près d’un aimant', noms: ['Champ total', 'Déviation de l’aiguille', 'Champ de l’aimant plus loin'],
    schema: (p, b) => ({ type: 'boussole', r1: b.tokens.r1.aff, Ba: b.tokens.Ba.aff, BT: b.tokens.BT.aff }),
    gen: () => {
      const Ba = tire([10, 20, 40, 60, 160]), r1 = tire([8, 10, 12]);
      return { BT: 20, Ba, mT: tire([true, false]), r1, r2: r1 * tire([2, 3]), T: tire([19, 21, 23]) };
    },
    build: (p, q) => {
      const tokens = {
        BT: tok('20 µT', 'Composante horizontale du champ magnétique terrestre', p.BT, 'µT'),
        Ba: tok(p.mT ? `${nb(p.Ba / 1000, 3)} mT` : `${p.Ba} µT`, 'Champ de l’aimant à la distance r₁', p.Ba, 'µT'),
        r1: tok(`${p.r1} cm`, 'Distance boussole – aimant', p.r1, 'cm'),
        r2: tok(`${p.r2} cm`, 'Nouvelle distance boussole – aimant', p.r2, 'cm'),
        T: tok(`${p.T} °C`, 'Température de la salle', p.T, '°C'),
      };
      const debut = ['Une boussole est placée à une distance r₁ = ', T('r1'), ' du centre d’un aimant droit, sur l’axe de cet aimant, orienté perpendiculairement à la direction du nord.\n\nSur l’axe d’un aimant droit, le champ de l’aimant est dirigé selon cet axe : il est donc perpendiculaire à la composante horizontale du champ de la Terre.\n\nÀ cet endroit, le champ de l’aimant vaut ',
        T('Ba'), ' et la composante horizontale du champ de la Terre vaut ', T('BT'), '.\n\nOn néglige tout autre champ magnétique. La salle est à ', T('T'), '. On pourra éloigner la boussole à une distance r₂ = ', T('r2'), ' ; tant que la distance reste grande devant la taille de l’aimant, son champ décroît comme 1/r³. '];
      const rT = 'La température n’intervient pas ici.';
      const rr1 = 'La distance est déjà contenue dans la valeur du champ de l’aimant donnée à cet endroit.', rr2 = 'Cette distance ne concerne pas cette question : le champ utilisé est celui donné à r₁.';
      const Bt = Math.hypot(p.BT, p.Ba);
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le champ magnétique total à l’endroit de la boussole (placée à r₁) ?'], utiles: ['BT', 'Ba'],
        raisons: { r1: rr1, r2: rr2, T: rT },
        cherche: { bonne: 'L’intensité du champ magnétique total (en µT)', faux: ['L’angle de déviation de l’aiguille (en °)', 'Le champ de l’aimant à la distance r₂ (en µT)', 'Le champ total à la distance r₂ (en µT)'] },
        manque: null,
        solution: { txt: 'B = sqrt(B_T² + B_a²) (les deux champs sont perpendiculaires : côtés d’un triangle rectangle)', val: Bt, u: 'µT' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'De quel angle l’aiguille de la boussole dévie-t-elle par rapport au nord ?'], utiles: ['BT', 'Ba'],
        raisons: { r1: rr1, r2: rr2, T: rT },
        cherche: { bonne: 'L’angle de déviation α de l’aiguille (en °)', faux: ['L’intensité du champ total (en µT)', 'Le champ de l’aimant à la distance r₂ (en µT)', 'L’angle entre le champ de l’aimant et le champ de la Terre (en °)'] },
        manque: null,
        solution: { txt: 'α = arctan(frac(B_a|B_T)) (l’aiguille se place selon le champ total : tan α = frac(B_a|B_T))', val: Math.atan(p.Ba / p.BT) * 180 / Math.PI, u: '°' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le champ de l’aimant lorsque la boussole est à la distance r₂ ?'], utiles: ['Ba', 'r1', 'r2'],
        raisons: { BT: 'Le champ de la Terre ne dépend pas de la distance à l’aimant, et on cherche le champ de l’aimant seul.', T: rT },
        cherche: { bonne: 'Le champ magnétique de l’aimant à la distance r₂ (en µT)', faux: ['Le champ magnétique total à la distance r₂ (en µT)', 'La déviation de l’aiguille de la boussole à r₂ (en °)', 'La variation du champ de l’aimant entre r₁ et r₂ (en µT)'] },
        manque: null, solution: { txt: 'B₂ = B_a × (frac(r₁|r₂))³', val: p.Ba * (p.r1 / p.r2) ** 3, u: 'µT' } };
    },
  },

  // ───────────────────────────── Mouvement et vitesse (seconde)
  {
    id: 'trajet', schema: () => ({ type: 'mobile', objet: 'train', sol: 'rail' }), domaine: 'Mouvement et vitesse', titre: 'Un trajet en train', noms: ['Vitesse moyenne du train', 'Durée d’un autre trajet'],
    gen: () => { const v = tire([80, 100, 120, 150]), dur = tire([90, 120, 150, 180]), h0 = tire([7, 8, 9, 14]), m0 = tire([0, 15, 30, 45]);
      return { v, dur, h0, m0, d: v * dur / 60, pass: tire([180, 240, 320, 410]), prix: tire([24, 32, 45]) }; },
    build: (p, q) => {
      const hm = min => `${Math.floor(min / 60) % 24} h ${String(min % 60).padStart(2, '0')}`;
      const dep = p.h0 * 60 + p.m0, arr = dep + p.dur;
      const tokens = {
        d: tok(`${p.d} km`, 'Distance parcourue par le train', p.d, 'km'),
        dep: tok(hm(dep), 'Heure de départ', dep / 60, 'h'),
        arr: tok(hm(arr), 'Heure d’arrivée', arr / 60, 'h'),
        pass: tok(`${p.pass} passagers`, 'Nombre de passagers', p.pass, ''),
        prix: tok(`${p.prix} €`, 'Prix du billet', p.prix, '€'),
      };
      if (q === 0) return { tokens,
        derivees: [{ id: 'dt', nom: 'Durée Δt du trajet', expr: 'Δt = heure d’arrivée − heure de départ', val: p.dur / 60, u: 'h' }],
        texte: ['Un train part de la gare à ', T('dep'), ' et arrive à destination à ', T('arr'), '. Il transporte ', T('pass'), ' et parcourt ', T('d'), '. Le billet coûte ', T('prix'), '. Quelle est la vitesse moyenne du train ?'],
        utiles: ['d', 'dep', 'arr'],
        raisons: { pass: 'Le nombre de passagers ne change pas la vitesse du train dans cet exercice.', prix: 'Le prix du billet n’a aucun rapport avec la vitesse.' },
        cherche: { bonne: 'La vitesse moyenne v du train (en km·h⁻¹)', faux: ['La vitesse maximale atteinte par le train (en km·h⁻¹)', 'La durée du trajet (en h)', 'L’accélération du train (en m·s⁻²)'] },
        manque: null, solution: { txt: 'v = d / Δt', val: p.v, u: 'km·h⁻¹' } };
      tokens.v = tok(`${p.v} km·h⁻¹`, 'Vitesse moyenne d’un autre train', p.v, 'km·h⁻¹'); delete tokens.arr;
      return { tokens, derivees: [],
        texte: ['Un autre train roule à la vitesse moyenne de ', T('v'), '. Il part à ', T('dep'), ' avec ', T('pass'), ' et doit parcourir ', T('d'), '. Le billet coûte ', T('prix'), '. Combien de temps dure ce trajet ?'],
        utiles: ['v', 'd'],
        raisons: { dep: 'L’heure de départ permettrait de calculer l’heure d’arrivée, mais on demande seulement la durée.', pass: 'Le nombre de passagers ne change pas la durée du trajet.', prix: 'Le prix du billet n’a aucun rapport avec la durée.' },
        cherche: { bonne: 'La durée Δt de ce trajet du train (en h)', faux: ['L’heure d’arrivée du train (en h)', 'La vitesse du train à l’arrivée (en km·h⁻¹)', 'L’accélération du train au départ (en m·s⁻²)'] },
        manque: null, solution: { txt: 'Δt = frac(d|v)', val: p.dur / 60, u: 'h' } };
    },
  },
  {
    id: 'course', domaine: 'Mouvement et vitesse', titre: 'Une course à pied ou à vélo', noms: ['Vitesse en m·s⁻¹', 'Distance parcourue en roulant'],
    gen: () => { const [d, t] = tire([[5, 28], [6, 33], [8, 42], [10, 55]]); return { d, t, v: tire([15, 20, 25, 30]), tv: tire([30, 45, 90]), age: tire([17, 24, 31, 45]), dos: tire([128, 245, 316, 470]) }; },
    build: (p, q) => {
      const tokens = {
        age: tok(`${p.age} ans`, 'Âge de la personne', p.age, 'ans'),
        dos: tok(`n° ${p.dos}`, 'Numéro de dossard', p.dos, ''),
      };
      if (q === 0) {
        tokens.d = tok(`${p.d} km`, 'Distance parcourue', p.d * 1000, 'm');
        tokens.t = tok(`${p.t} min`, 'Durée de la course', p.t * 60, 's');
        return { tokens, derivees: [],
          texte: ['Un coureur de ', T('age'), ' porte le dossard ', T('dos'), '. Il parcourt ', T('d'), ' en ', T('t'), '. Quelle est sa vitesse moyenne, en mètres par seconde ?'],
          utiles: ['d', 't'],
          raisons: { age: 'L’âge du coureur ne change pas le calcul de sa vitesse.', dos: 'Le numéro de dossard sert à identifier le coureur, pas à calculer sa vitesse.' },
          cherche: { bonne: 'La vitesse moyenne v du coureur (en m·s⁻¹)', faux: ['L’accélération moyenne du coureur (en m·s⁻²)', 'La durée pour courir 1 km à cette allure (en s)', 'L’énergie dépensée par le coureur (en J)'] },
          manque: null, solution: { txt: 'v = d / Δt, avec d en m et Δt en s', val: p.d * 1000 / (p.t * 60), u: 'm·s⁻¹' } };
      }
      tokens.v = tok(`${p.v} km·h⁻¹`, 'Vitesse du cycliste', p.v, 'km·h⁻¹');
      tokens.tv = tok(`${p.tv} min`, 'Durée du trajet à vélo', p.tv / 60, 'h');
      return { tokens, derivees: [],
        texte: ['Un cycliste de ', T('age'), ' roule à la vitesse constante de ', T('v'), ' pendant ', T('tv'), '. Il porte le dossard ', T('dos'), '. Quelle distance parcourt-il, en kilomètres ?'],
        utiles: ['v', 'tv'],
        raisons: { age: 'L’âge du cycliste ne change pas la distance parcourue.', dos: 'Le numéro de dossard sert à identifier le cycliste, pas à calculer une distance.' },
        cherche: { bonne: 'La distance d parcourue par le cycliste (en km)', faux: ['L’accélération du cycliste (en m·s⁻²)', 'La durée pour parcourir 1 km à cette vitesse (en min)', 'Le nombre de tours de roue'] },
        manque: null, solution: { txt: 'd = v × Δt, avec Δt en h', val: p.v * p.tv / 60, u: 'km' } };
    },
  },
  // ───────────────────────────── Interactions et champs (1re spécialité)
  {
    id: 'gravi', domaine: 'Interactions et champs', titre: 'Interaction gravitationnelle', noms: ['Force entre deux satellites', 'Champ de gravitation d’une planète'],
    gen: () => { const [M, ex, R] = tire([[6.42, 23, 3390], [4.87, 24, 6052], [5.97, 24, 6371]]); return { M, ex, R, m1: tire([2, 5, 8]), m2: tire([3, 4, 6]), d: tire([10, 20, 50]), an: tire([1999, 2008, 2015]),
      h: tire([200, 400, 800]), m: tire([50, 70, 90]), G: 6.674e-11 }; },
    build: (p, q) => {
      const sci = x => nb(Number((x).toPrecision(3))).replace('.', ',');
      const tokens = { G: tok('G = 6,674 × 10⁻¹¹ N·m²·kg⁻²', 'Constante de gravitation universelle', p.G, 'N·m²·kg⁻²') };
      if (q === 0) {
        tokens.m1 = tok(`${p.m1} tonnes`, 'Masse du satellite 1', p.m1 * 1000, 'kg');
        tokens.m2 = tok(`${p.m2} tonnes`, 'Masse du satellite 2', p.m2 * 1000, 'kg');
        tokens.d = tok(`${p.d} m`, 'Distance entre les centres des satellites', p.d, 'm');
        tokens.an = tok(`${p.an}`, 'Année de lancement', p.an, '');
        return { tokens, derivees: [],
          texte: ['Deux satellites, lancés en ', T('an'), ', ont pour masses ', T('m1'), ' et ', T('m2'), '. Leurs centres sont distants de ', T('d'), '. On les assimile à des points (leur taille est négligeable devant la distance). On donne ', T('G'), '. Quelle est la valeur de la force d’attraction gravitationnelle entre eux ?'],
          utiles: ['G', 'm1', 'm2', 'd'],
          raisons: { an: 'L’année de lancement n’intervient pas dans la loi de la gravitation.' },
          cherche: { bonne: 'La force gravitationnelle F entre les deux satellites (en N)', faux: ['Le champ de gravitation créé par un satellite (en N·kg⁻¹)', 'Le poids d’un satellite sur la Terre (en N)', 'La force exercée par la Terre sur un satellite (en N)'] },
          manque: null, solution: { txt: 'F = frac(G·m₁·m₂|d²)', val: p.G * p.m1 * p.m2 * 1e6 / (p.d * p.d), u: 'N' } };
      }
      tokens.M = tok(`${sci(p.M)} × 10${p.ex === 23 ? '²³' : '²⁴'} kg`, 'Masse de la planète', p.M * Math.pow(10, p.ex), 'kg');
      tokens.R = tok(`${p.R} km`, 'Rayon de la planète', p.R * 1000, 'm');
      tokens.h = tok(`${p.h} km`, 'Altitude du point étudié', p.h * 1000, 'm');
      tokens.m = tok(`${p.m} kg`, 'Masse d’une sonde posée sur le sol', p.m, 'kg');
      return { tokens,
        derivees: [{ id: 'd', nom: 'Distance d au centre de la planète', expr: 'd = rayon + altitude', val: (p.R + p.h) * 1000, u: 'm' }],
        texte: ['Une planète sphérique de masse ', T('M'), ' a un rayon de ', T('R'), '. Une sonde de ', T('m'), ' est posée sur le sol. On donne ', T('G'), '. Quelle est la valeur du champ de gravitation créé par la planète en un point situé à ', T('h'), ' d’altitude (au-dessus du sol) ?'],
        utiles: ['G', 'M', 'R', 'h'],
        raisons: { m: 'Le champ de gravitation créé par la planète ne dépend pas de la masse de la sonde qui s’y trouve.' },
        cherche: { bonne: 'Le champ de gravitation g créé par la planète (en N·kg⁻¹)', faux: ['La force de gravitation subie par la sonde (en N)', 'L’intensité de la pesanteur à la surface de la planète (en N·kg⁻¹)', 'La distance d du point au centre de la planète (en m)'] },
        manque: null, solution: { txt: 'g = frac(G·M|d²), avec d = R + h', val: p.G * p.M * Math.pow(10, p.ex) / Math.pow((p.R + p.h) * 1000, 2), u: 'N·kg⁻¹' } };
    },
  },
  {
    id: 'electro', schema: () => ({ type: 'deuxCharges', objet: 'bille' }), domaine: 'Interactions et champs', titre: 'Interaction électrostatique', noms: ['Force entre deux charges', 'Force dans un champ uniforme'],
    gen: () => ({ q1: tire([2, 4, 5]), q2: tire([3, 6, 8]), d: tire([2, 4, 5]), U: tire([100, 200, 300]), e: tire([2, 4, 5]), q: tire([2, 5, 10]), mp: tire([20, 50, 100]) }),
    build: (p, q) => {
      const tokens = {};
      if (q === 0) {
        tokens.k = tok('k = 9,0 × 10⁹ N·m²·C⁻²', 'Constante de la loi de Coulomb', 9.0e9, 'N·m²·C⁻²');
        tokens.q1 = tok(`${p.q1} nC`, 'Charge de la bille 1', p.q1 * 1e-9, 'C');
        tokens.q2 = tok(`${p.q2} nC`, 'Charge de la bille 2', p.q2 * 1e-9, 'C');
        tokens.d = tok(`${p.d} cm`, 'Distance entre les billes', p.d * 1e-2, 'm');
        tokens.mp = tok(`${p.mp} g`, 'Masse de chaque bille', p.mp * 1e-3, 'kg');
        return { tokens, derivees: [],
          texte: ['Deux petites billes de ', T('mp'), ' portent des charges de ', T('q1'), ' et ', T('q2'), '. Leurs centres sont distants de ', T('d'), '. On donne ', T('k'), '. Les billes sont assimilées à des charges ponctuelles placées dans l’air (assimilé au vide). Quelle est la valeur de la force électrostatique entre les billes ?'],
          utiles: ['k', 'q1', 'q2', 'd'],
          raisons: { mp: 'La masse des billes n’intervient pas dans la loi de Coulomb (elle servirait pour calculer leur poids ou leur accélération).' },
          cherche: { bonne: 'La force électrostatique F entre les deux billes (en N)', faux: ['Le champ électrique créé par une bille (en V·m⁻¹)', 'La force gravitationnelle entre les deux billes (en N)', 'Le poids des billes (en N)'] },
          manque: null, solution: { txt: 'F = k·|q₁·q₂| / d²', val: 9.0e9 * p.q1 * 1e-9 * p.q2 * 1e-9 / Math.pow(p.d * 1e-2, 2), u: 'N' } };
      }
      tokens.U = tok(`${p.U} V`, 'Tension entre les plaques', p.U, 'V');
      tokens.e = tok(`${p.e} mm`, 'Distance entre les plaques', p.e * 1e-3, 'm');
      tokens.q = tok(`${p.q} nC`, 'Charge de la petite boule', p.q * 1e-9, 'C');
      tokens.mp = tok(`${p.mp} mg`, 'Masse de la petite boule', p.mp * 1e-6, 'kg');
      return { tokens,
        derivees: [{ id: 'E', nom: 'Valeur du champ électrique E entre les plaques', expr: 'E = U / distance', val: p.U / (p.e * 1e-3), u: 'V·m⁻¹' }],
        texte: ['Deux plaques parallèles, distantes de ', T('e'), ', sont reliées à un générateur qui impose une tension de ', T('U'), '. Une petite boule de ', T('mp'), ', portant une charge de ', T('q'), ', est placée entre les plaques. On néglige les effets de bord : le champ est uniforme entre les plaques. Quelle est la valeur de la force électrique qu’elle subit ?'],
        utiles: ['U', 'e', 'q'],
        raisons: { mp: 'La masse de la boule n’intervient pas dans la force électrique F = q·E (elle servirait pour son poids).' },
        cherche: { bonne: 'La force électrique F subie par la boule (en N)', faux: ['Le champ électrique E entre les plaques (en V·m⁻¹)', 'Le poids de la boule (en N)', 'L’énergie potentielle électrique de la boule (en J)'] },
        manque: null, solution: { txt: 'F = q·E, avec E = U / distance', val: p.q * 1e-9 * p.U / (p.e * 1e-3), u: 'N' } };
    },
  },
  // ───────────────────────────── Seconde et première : « de quelle grandeur s'agit-il ? » (masse ou volume, kg ou g, mL ou L, min ou h…)
  {
    id: 'rho2', domaine: 'Solutions et concentration', titre: 'La masse volumique d’un liquide', noms: ['Masse volumique du liquide', 'Masse d’un volume de liquide'],
    gen: () => { const liq = tire([['de l’huile', 0.92], ['de l’éthanol', 0.79], ['du glycérol', 1.26], ['du sirop', 1.30]]); const V = tire([20, 25, 40, 50]), mv = tire([45, 52, 60]);
      return { nom: liq[0], rho: liq[1], V, mv, mt: Math.round((mv + liq[1] * V) * 10) / 10, T: tire([18, 20, 22]), VL: tire([0.25, 0.5, 1.5, 2]) }; },
    build: (p, q) => {
      const tokens = { T: tok(`${p.T} °C`, 'Température du laboratoire', p.T, '°C') };
      if (q === 0) {
        tokens.mv = tok(`${nb(p.mv, 1)} g`, 'Masse de l’éprouvette vide', p.mv, 'g');
        tokens.mt = tok(`${nb(p.mt, 1)} g`, 'Masse de l’éprouvette contenant le liquide', p.mt, 'g');
        tokens.V = tok(`${p.V} mL`, 'Volume de liquide dans l’éprouvette', p.V, 'mL');
        return { tokens, derivees: [{ id: 'm', nom: 'Masse m du liquide seul', expr: 'm = masse avec le liquide − masse de l’éprouvette vide', val: Math.round((p.mt - p.mv) * 10) / 10, u: 'g' }],
          texte: ['Pour déterminer la masse volumique d’un liquide, on pèse une éprouvette graduée vide : ', T('mv'), '. On y verse du liquide jusqu’à lire ', T('V'), ', et on pèse l’ensemble : ', T('mt'), '. La température du laboratoire est de ', T('T'), '. Quelle est la masse volumique de ce liquide (en g·mL⁻¹) ?'],
          utiles: ['mv', 'mt', 'V'],
          raisons: { T: 'On mesure directement m et V : la température ne figure pas dans la formule ρ = m / V. Elle précise seulement à quelle température la valeur de ρ est valable (un volume varie un peu avec la température).' },
          cherche: { bonne: 'La masse volumique ρ du liquide (en g·mL⁻¹)', faux: ['La masse m du liquide seul (en g)', 'Le poids du liquide (en N)', 'La quantité de matière de liquide (en mol)'] },
          manque: null, solution: { txt: 'ρ = m / V, avec m = m_avec liquide − m_éprouvette', val: (p.mt - p.mv) / p.V, u: 'g·mL⁻¹' } };
      }
      delete tokens.T;
      tokens.rho = tok(`${nb(p.rho, 2)} g·mL⁻¹`, 'Masse volumique du liquide', p.rho, 'g·mL⁻¹');
      tokens.VL = tok(`${nb(p.VL, 2)} L`, 'Volume de liquide à peser', p.VL * 1000, 'mL');
      tokens.mv = tok(`${nb(p.mv, 1)} g`, 'Masse du flacon vide', p.mv, 'g');
      return { tokens, derivees: [],
        texte: ['La masse volumique ' + p.nom + ' vaut ', T('rho'), '. Un technicien en verse ', T('VL'), ' dans un flacon vide de masse ', T('mv'), '. Quelle est la masse de liquide versé (en g) ?'],
        utiles: ['rho', 'VL'],
        raisons: { mv: 'La masse du flacon vide ne compte pas : on demande la masse du liquide seul.' },
        cherche: { bonne: 'La masse m de liquide versé (en g)', faux: ['La masse totale flacon + liquide (en g)', 'Le poids du liquide (en N)', 'La quantité de matière de liquide (en mol)'] },
        manque: null, solution: { txt: 'm = ρ × V (avec V converti en mL)', val: p.rho * p.VL * 1000, u: 'g' } };
    },
  },
  {
    id: 'conc2', domaine: 'Solutions et concentration', titre: 'Préparer une solution de sel', noms: ['Concentration en masse de la solution', 'Masse de sel à peser'],
    gen: () => { const Vf = tire([100, 250, 500]); return { m: tire([2, 5, 10, 15]), Vf, Vi: Math.round(Vf * tire([0.4, 0.6])), t: tire([9, 20, 40]), M: 58.5 }; },
    build: (p, q) => {
      const tokens = { M: tok('1,0 g·mL⁻¹', 'Masse volumique de l’eau', 1, 'g·mL⁻¹') };
      if (q === 0) {
        tokens.m = tok(`${p.m} g`, 'Masse de sel pesée', p.m, 'g');
        tokens.Vi = tok(`${p.Vi} mL`, 'Volume d’eau versé pour dissoudre le sel', p.Vi / 1000, 'L');
        tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution (fiole jaugée)', p.Vf / 1000, 'L');
        return { tokens, derivees: [],
          texte: ['Un élève pèse ', T('m'), ' de chlorure de sodium. Il les dissout dans environ ', T('Vi'), ' d’eau distillée dans une fiole jaugée de ', T('Vf'), ', puis complète avec de l’eau jusqu’au trait de jauge. Donnée : masse volumique de l’eau ', T('M'), '. Quelle est la concentration en masse de la solution (en g·L⁻¹) ?'],
          utiles: ['m', 'Vf'],
          raisons: { Vi: 'C’est le volume d’eau versé au début, pas le volume de la solution : le volume de la solution, c’est celui de la fiole jaugée (jusqu’au trait de jauge).', M: 'La masse volumique de l’eau permettrait de calculer la masse d’eau versée, pas la concentration en masse du sel : on divise la masse de sel par le volume de la solution.' },
          cherche: { bonne: 'La concentration en masse t de la solution (en g·L⁻¹)', faux: ['La quantité de matière de sel dissous (en mol)', 'La masse volumique de la solution (en g·L⁻¹)', 'La masse d’eau versée pour dissoudre le sel (en g)'] },
          manque: null, solution: { txt: 't = m / V (avec V converti en L)', val: p.m / (p.Vf / 1000), u: 'g·L⁻¹' } };
      }
      tokens.t = tok(`${p.t} g·L⁻¹`, 'Concentration en masse souhaitée', p.t, 'g·L⁻¹');
      tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution à préparer (fiole jaugée)', p.Vf / 1000, 'L');
      tokens.Vi = tok(`${p.Vi} mL`, 'Volume d’eau versé pour dissoudre le sel', p.Vi / 1000, 'L');
      return { tokens, derivees: [],
        texte: ['On veut préparer une solution de chlorure de sodium de concentration en masse ', T('t'), ', dans une fiole jaugée de ', T('Vf'), '. On dissoudra d’abord le sel dans environ ', T('Vi'), ' d’eau. Donnée : masse volumique de l’eau ', T('M'), '. Quelle masse de sel faut-il peser (en g) ?'],
        utiles: ['t', 'Vf'],
        raisons: { Vi: 'C’est le volume d’eau versé au début : la solution finale fait le volume de la fiole jaugée.', M: 'La masse volumique de l’eau n’intervient pas : la concentration en masse relie la masse de sel au volume de la solution.' },
        cherche: { bonne: 'La masse de chlorure de sodium solide nécessaire (en g)', faux: ['La quantité de matière de sel à peser (en mol)', 'La masse volumique de la solution (en g·L⁻¹)', 'La masse d’eau versée pour dissoudre le sel (en g)'] },
        manque: null, solution: { txt: 'm = t × V (avec V converti en L)', val: p.t * p.Vf / 1000, u: 'g' } };
    },
  },
  {
    id: 'poids2', domaine: 'Forces et principe d’inertie', titre: 'Le poids d’un objet', noms: ['Poids sur la Terre', 'Poids sur un autre astre'],
    gen: () => { const a = tire([['la Lune', 1.6], ['Mars', 3.7], ['Vénus', 8.9]]); const mat = tire([['fer', 7.9], ['aluminium', 2.7], ['cuivre', 9.0], ['laiton', 8.5]]); const mg = tire([250, 350, 500, 650, 750, 900]);
      return { astre: a[0], ga: a[1], mat: mat[0], mg, V: Math.round(mg / mat[1]), mk: tire([2.4, 3.5, 12, 60]) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { mg: tok(`${p.mg} g`, 'Masse de l’objet', p.mg / 1000, 'kg'), g: tok('g = 9,81 N·kg⁻¹', 'Intensité de la pesanteur sur Terre', 9.81, 'N·kg⁻¹'), V: tok(`${p.V} cm³`, 'Volume de l’objet', p.V, 'cm³') };
        return { tokens, derivees: [],
          texte: ['Un objet en ' + p.mat + ' de ', T('mg'), ' et de volume ', T('V'), ' est accroché à un dynamomètre sur Terre. Donnée : intensité de la pesanteur sur Terre, ', T('g'), '. Quel est le poids de l’objet (en N) ?'],
          utiles: ['mg', 'g'],
          raisons: { V: 'Le volume de l’objet n’intervient pas dans le calcul du poids : c’est la masse (en kg) qui compte.' },
          cherche: { bonne: 'Le poids P de l’objet suspendu au dynamomètre (en N)', faux: ['La masse volumique de l’objet (en g·cm⁻³)', 'L’énergie potentielle de pesanteur de l’objet (en J)', 'Le poids de l’objet s’il était sur la Lune (en N)'] },
          manque: null, solution: { txt: 'P = m × g (avec m convertie en kg)', val: p.mg / 1000 * 9.81, u: 'N' } };
      }
      const tokens = { mk: tok(`${nb(p.mk)} kg`, 'Masse de l’objet', p.mk, 'kg'), ga: tok(`${nb(p.ga, 1)} N·kg⁻¹`, 'Intensité de la pesanteur sur ' + p.astre, p.ga, 'N·kg⁻¹'), g: tok('9,81 N·kg⁻¹', 'Intensité de la pesanteur sur Terre', 9.81, 'N·kg⁻¹') };
      const sur = p.astre === 'Mars' || p.astre === 'Vénus' ? 'sur ' + p.astre : 'sur la Lune';
      return { tokens, derivees: [],
        texte: ['Un objet de ', T('mk'), ' est envoyé ' + sur + ', où l’intensité de la pesanteur vaut ', T('ga'), '. Sur Terre, elle vaut ', T('g'), '. Quel est le poids de l’objet ' + sur + ' (en N) ?'],
        utiles: ['mk', 'ga'],
        raisons: { g: 'La valeur de g sur Terre ne sert pas : on cherche le poids ' + sur + ', où la pesanteur est différente.' },
        cherche: { bonne: 'Le poids P de l’objet ' + sur + ' (en N)', faux: ['La variation de poids de l’objet entre la Terre et ' + sur.replace('sur ', '') + ' (en N)', 'Le poids de l’objet sur Terre (en N)', 'L’énergie potentielle de l’objet à 1 m du sol (en J)'] },
        manque: null, solution: { txt: 'P = m × g (avec g de ' + p.astre + ')', val: p.mk * p.ga, u: 'N' } };
    },
  },
  {
    id: 'chute2', schema: () => ({ type: 'chuteLibre' }), domaine: 'Forces et principe d’inertie', titre: 'Une chronophotographie de chute libre', noms: ['Vitesse de la bille en M₃', 'Variation de vitesse entre deux photos'],
    gen: () => { const tau = tire([0.10, 0.20, 0.25]); return { tau, d: Math.round(39.2 * tau * tau * 100) / 100, H: Math.round(313.6 * tau * tau * 10) / 10, m: tire([20, 50, 100]),
      v1: Math.round(29.4 * tau * 100) / 100, v2: Math.round(39.2 * tau * 100) / 100 }; },
    build: (p, q) => {
      const tokens = { tau: tok(`${nb(p.tau, 2)} s`, 'Durée entre deux photos successives', p.tau, 's'), m: tok(`${p.m} g`, 'Masse de la bille', p.m / 1000, 'kg') };
      const debut = ['Une bille est lâchée sans vitesse initiale et filmée en chute libre : une photo est prise toutes les ', T('tau'), '. La bille a une masse de ', T('m'), '. '];
      if (q === 0) {
        tokens.d = tok(`${nb(p.d, 2)} m`, 'Distance entre les positions M₂ et M₄', p.d, 'm');
        tokens.H = tok(`${nb(p.H, 1)} m`, 'Hauteur totale de chute sur les 9 photos', p.H, 'm');
        return { tokens, derivees: [{ id: 'dur', nom: 'Durée entre M₂ et M₄ (deux intervalles)', expr: '2 × τ', val: 2 * p.tau, u: 's' }],
          texte: [...debut, 'Sur les 9 photos, la hauteur totale de chute est ', T('H'), ', et la distance M₂M₄ vaut ', T('d'), '. Quelle est la valeur de la vitesse de la bille au point M₃ (en m/s) ?'],
          utiles: ['tau', 'd'],
          raisons: { H: 'La hauteur totale de chute ne sert pas : la vitesse en M₃ se déduit de la distance M₂M₄ et de la durée correspondante.', m: 'La masse de la bille n’intervient pas pour déduire une vitesse d’une chronophotographie.' },
          cherche: { bonne: 'La valeur de la vitesse v de la bille au point M₃ (en m/s)', faux: ['La valeur de la variation de vitesse Δv entre deux photos (en m/s)', 'La valeur du poids de la bille (en N)', 'La durée totale de la chute (en s)'] },
          manque: null, solution: { txt: 'v ≈ M₂M₄ / (2τ)', val: p.d / (2 * p.tau), u: 'm/s' } };
      }
      tokens.v1 = tok(`${nb(p.v1, 2)} m/s`, 'Valeur de la vitesse à une photo', p.v1, 'm/s');
      tokens.v2 = tok(`${nb(p.v2, 2)} m/s`, 'Valeur de la vitesse à la photo suivante', p.v2, 'm/s');
      return { tokens, derivees: [],
        texte: [...debut, 'La valeur de sa vitesse est ', T('v1'), ' à une photo, puis ', T('v2'), ' à la photo suivante, vers le bas dans les deux cas. Quelle est la valeur de la variation de vitesse Δv entre ces deux photos (en m/s) ?'],
        utiles: ['v1', 'v2'],
        raisons: { tau: 'La durée entre deux photos ne sert pas pour la valeur de Δv : on compare simplement les deux vitesses.', m: 'La masse de la bille n’intervient pas dans la variation de vitesse (frottements négligés).' },
        cherche: { bonne: 'La valeur de la variation de vitesse Δv entre les deux photos (en m/s)', faux: ['La valeur moyenne de la vitesse entre les deux photos (en m/s)', 'La distance parcourue entre les deux photos (en m)', 'La valeur du poids de la bille (en N)'] },
        manque: null, solution: { txt: 'Δv = v₂ − v₁ (même sens)', val: p.v2 - p.v1, u: 'm/s' } };
    },
  },
  {
    id: 'vitesse2', domaine: 'Mouvement et vitesse', titre: 'La vitesse d’un cycliste', noms: ['Vitesse moyenne', 'Durée du trajet'],
    gen: () => { const [d, t] = tire([[6, 20], [9, 20], [9, 25], [3, 10], [4.5, 15], [15, 40], [12, 25]]); const [v, tt] = tire([[18, 200], [21.6, 300], [25.2, 400], [28.8, 600]]);
      return { d, t, m: tire([65, 72, 80]), v, dm: Math.round(v / 3.6 * tt) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { d: tok(`${nb(p.d)} km`, 'Distance parcourue', p.d * 1000, 'm'), t: tok(`${p.t} min`, 'Durée du trajet', p.t * 60, 's'), m: tok(`${p.m} kg`, 'Masse du cycliste', p.m, 'kg') };
        return { tokens, derivees: [],
          texte: ['Un cycliste de ', T('m'), ' parcourt ', T('d'), ' en ', T('t'), '. Quelle est sa vitesse moyenne (en m·s⁻¹) ?'],
          utiles: ['d', 't'],
          raisons: { m: 'La masse du cycliste ne sert pas à calculer sa vitesse : c’est une masse, pas une distance ni une durée.' },
          cherche: { bonne: 'La vitesse moyenne v du cycliste (en m·s⁻¹)', faux: ['L’accélération moyenne du cycliste (en m·s⁻²)', 'La distance qu’il parcourrait en une heure à cette vitesse (en km)', 'L’énergie cinétique du cycliste (en J)'] },
          manque: null, solution: { txt: 'v = d / Δt (d en m, Δt en s)', val: p.d * 1000 / (p.t * 60), u: 'm·s⁻¹' } };
      }
      const tokens = { dm: tok(`${p.dm} m`, 'Distance à parcourir', p.dm, 'm'), v: tok(`${nb(p.v)} km·h⁻¹`, 'Vitesse moyenne du cycliste', p.v / 3.6, 'm·s⁻¹'), m: tok(`${p.m} kg`, 'Masse du cycliste', p.m, 'kg') };
      return { tokens, derivees: [],
        texte: ['Un cycliste de ', T('m'), ' doit parcourir ', T('dm'), ' à la vitesse moyenne de ', T('v'), '. Quelle est la durée du trajet (en s) ?'],
        utiles: ['dm', 'v'],
        raisons: { m: 'La masse du cycliste n’intervient pas : on cherche une durée à partir d’une distance et d’une vitesse.' },
        cherche: { bonne: 'La durée Δt du trajet (en s)', faux: ['L’accélération moyenne du cycliste (en m·s⁻²)', 'La distance parcourue en 10 s à cette vitesse (en m)', 'L’énergie cinétique du cycliste (en J)'] },
        manque: null, solution: { txt: 'Δt = frac(d|v) (v convertie en m·s⁻¹)', val: p.dm / (p.v / 3.6), u: 's' } };
    },
  },
  {
    id: 'ohm2', schema: () => ({ type: 'circuitSimple', dipole: 'résistor', generateur: 'générateur' }), domaine: 'Circuits électriques', titre: 'Un résistor dans un circuit', noms: ['Tension aux bornes du résistor', 'Intensité du courant'],
    gen: () => ({ R: tire([1.0, 2.2, 4.7]), I: tire([1, 2]), Rm: tire([470, 1000, 2200]), U: tire([3, 6, 9]), L: tire([20, 40]) }),
    build: (p, q) => {
      if (q === 0) {
        const tokens = { R: tok(`${nb(p.R, 1)} kΩ`, 'Résistance du résistor', p.R * 1000, 'Ω'), I: tok(`${p.I} mA`, 'Intensité du courant', p.I / 1000, 'A'), L: tok(`${p.L} cm`, 'Longueur du fil de connexion', p.L / 100, 'm') };
        return { tokens, derivees: [],
          texte: ['Un résistor ohmique de résistance ', T('R'), ' est traversé par un courant d’intensité ', T('I'), '. Il est relié au circuit par un fil de ', T('L'), '. Quelle est la tension à ses bornes (en V) ?'],
          utiles: ['R', 'I'],
          raisons: { L: 'La longueur du fil est une longueur : elle n’apparaît pas dans la loi d’Ohm U = R × I (et la résistance de ce fil est négligeable devant celle du résistor).' },
          cherche: { bonne: 'La différence de potentiel aux bornes du résistor (en V)', faux: ['La puissance reçue par le résistor (en W)', 'L’énergie reçue par le résistor en 1 min (en J)', 'La charge traversant le résistor en 1 min (en C)'] },
          manque: null, solution: { txt: 'U = R × I (R en Ω, I en A)', val: p.R * 1000 * p.I / 1000, u: 'V' } };
      }
      const tokens = { U: tok(`${p.U} V`, 'Tension aux bornes du résistor', p.U, 'V'), Rm: tok(`${p.Rm} Ω`, 'Résistance du résistor', p.Rm, 'Ω'), L: tok(`${p.L} cm`, 'Longueur du fil de connexion', p.L / 100, 'm') };
      return { tokens, derivees: [],
        texte: ['Un générateur impose une tension de ', T('U'), ' aux bornes d’un résistor ohmique de résistance ', T('Rm'), ', relié par un fil de ', T('L'), '. Quelle est l’intensité du courant qui traverse le résistor (en mA) ?'],
        utiles: ['U', 'Rm'],
        raisons: { L: 'La longueur du fil n’intervient pas dans la loi d’Ohm (et la résistance de ce fil est négligeable devant celle du résistor).' },
        cherche: { bonne: 'Le courant électrique dans le résistor (en mA)', faux: ['La puissance reçue par le résistor (en W)', 'L’énergie reçue par le résistor en 1 min (en J)', 'La charge traversant le résistor en 1 min (en C)'] },
        manque: null, solution: { txt: 'I = frac(U|R) (R en Ω, I d’abord en A puis en mA)', val: p.U / p.Rm * 1000, u: 'mA' } };
    },
  },
  {
    id: 'indice2', schema: () => ({ type: 'blocTransparent', milieu: 'un bloc transparent' }), domaine: 'Lumière', titre: 'Indice de réfraction et vitesse de la lumière', noms: ['Indice de réfraction', 'Vitesse de la lumière dans le milieu'],
    gen: () => ({ milieu: tire([['un bloc de verre', 200000, 1.5, [2, 5, 10]], ['un bloc de verre crown', 197000, 1.52, [2, 5, 10]], ['une cuve remplie d’eau', 225000, 1.33, [5, 10, 20]], ['un diamant', 124000, 2.42, [0.5, 1]]]) }),
    build: (p, q) => {
      const [obj, vkm, n, eps] = p.milieu, ep = tire(eps);
      const tokens = { c: tok('c = 3,00 × 10⁸ m·s⁻¹', 'Vitesse de la lumière dans le vide', 3.0e8, 'm·s⁻¹'), ep: tok(`${nb(ep)} cm`, 'Épaisseur traversée', ep / 100, 'm') };
      if (q === 0) {
        tokens.v = tok(`${nb(vkm)} km·s⁻¹`, 'Vitesse de la lumière dans le milieu', vkm * 1000, 'm·s⁻¹');
        return { tokens, derivees: [],
          texte: ['Un faisceau lumineux traverse un échantillon de milieu transparent inconnu, d’épaisseur ', T('ep'), '. Dans ce milieu, la lumière se propage à la vitesse de ', T('v'), '. On donne ', T('c'), '. Quel est l’indice de réfraction du milieu ?'],
          utiles: ['c', 'v'],
          raisons: { ep: 'L’épaisseur traversée n’intervient pas dans l’indice (elle servirait à calculer une durée de traversée).' },
          cherche: { bonne: 'L’indice de réfraction n du milieu (sans unité)', faux: ['La longueur d’onde de la lumière dans le milieu (en nm)', 'La durée de la traversée du milieu (en s)', 'L’angle de réfraction (en °)'] },
          manque: null, solution: { txt: 'n = frac(c|v) (v convertie en m·s⁻¹)', val: 3.0e8 / (vkm * 1000), u: '' } };
      }
      tokens.n = tok(`n = ${nb(n, 2)}`, 'Indice de réfraction du milieu', n, '');
      return { tokens, derivees: [],
        texte: ['Un faisceau lumineux traverse ' + obj + ' sur une épaisseur de ', T('ep'), '. Le milieu a pour ', T('n'), ' (pour la lumière utilisée). On donne ', T('c'), '. Quelle est la vitesse de la lumière dans ce milieu (en m·s⁻¹) ?'],
        utiles: ['c', 'n'],
        raisons: { ep: 'L’épaisseur traversée n’intervient pas : la vitesse dépend seulement de l’indice du milieu.' },
        cherche: { bonne: 'La vitesse v de la lumière dans le milieu (en m·s⁻¹)', faux: ['La durée de la traversée du milieu (en s)', 'La longueur d’onde de la lumière dans le milieu (en nm)', 'La fréquence de la lumière (en Hz)'] },
        manque: null, solution: { txt: 'v = frac(c|n)', val: 3.0e8 / n, u: 'm·s⁻¹' } };
    },
  },
  {
    id: 'snell2', domaine: 'Lumière', titre: 'Réfraction : loi de Snell-Descartes', noms: ['Angle de réfraction', 'Indice du second milieu'],
    schema: (p, b) => b.dansTexte.has('n2') ? { type: 'optique', cas: 'dioptre', n1: 1.0, n2: p.n2, i: p.i1 } : { type: 'optique', cas: 'dioptre', n1: 1.0, n2: null, inconnu: 'n2', i: p.i1, i2: p.i2 },
    gen: () => { const m = tire([['l’eau', 1.33], ['le verre', 1.50], ['le plexiglas', 1.49]]); const i1 = tire([20, 30, 45, 60]); const n2 = m[1];
      return { milieu: m[0], n2, i1, lam: tire([532, 633, 650]), i2: Math.round(Math.asin(Math.sin(i1 * Math.PI / 180) / n2) * 180 / Math.PI * 10) / 10 }; },
    build: (p, q) => {
      const tokens = { n1: tok('n₁ = 1,00', 'Indice de réfraction de l’air', 1.0, ''), i1: tok(`${p.i1}°`, 'Angle d’incidence', p.i1, '°'), lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm') };
      if (q === 0) {
        tokens.n2 = tok(`n₂ = ${nb(p.n2, 2)}`, 'Indice de réfraction du second milieu', p.n2, '');
        return { tokens, derivees: [],
          texte: ['Un faisceau laser de longueur d’onde ', T('lam'), ' passe de l’air (', T('n1'), ') vers ' + p.milieu + ' (', T('n2'), ') avec un angle d’incidence de ', T('i1'), '. Les angles sont mesurés par rapport à la normale à la surface. Quel est l’angle de réfraction ?'],
          utiles: ['n1', 'n2', 'i1'],
          raisons: { lam: 'Les indices sont déjà donnés pour cette radiation : la longueur d’onde n’apparaît pas dans la loi n₁ sin i₁ = n₂ sin i₂.' },
          cherche: { bonne: 'L’angle de réfraction i₂ dans le second milieu (en °)', faux: ['L’angle de réflexion (en °)', 'La déviation i₁ − i₂ du rayon (en °)', 'La vitesse de la lumière dans le second milieu (en m·s⁻¹)'] },
          manque: null, solution: { txt: 'sin i₂ = n₁ × sin frac(i₁|n₂) ; on en déduit i₂ avec la touche sin⁻¹ de la calculatrice (mode degrés)', val: p.i2, u: '°' } };
      }
      tokens.i2 = tok(`${nb(p.i2, 1)}°`, 'Angle de réfraction', p.i2, '°');
      return { tokens, derivees: [],
        texte: ['Un faisceau laser de longueur d’onde ', T('lam'), ' passe de l’air (', T('n1'), ') vers un milieu transparent inconnu avec un angle d’incidence de ', T('i1'), '. L’angle de réfraction mesuré vaut ', T('i2'), '. Les angles sont mesurés par rapport à la normale à la surface. Quel est l’indice de ce milieu ?'],
        utiles: ['n1', 'i1', 'i2'],
        raisons: { lam: 'La longueur d’onde n’apparaît pas dans la loi n₁ sin i₁ = n₂ sin i₂ : l’indice trouvé vaut pour cette radiation.' },
        cherche: { bonne: 'L’indice de réfraction n₂ du milieu inconnu (sans unité)', faux: ['L’angle de réflexion (en °)', 'La vitesse de la lumière dans le milieu (en m·s⁻¹)', 'La longueur d’onde de la lumière dans le milieu (en nm)'] },
        manque: null, solution: { txt: 'n₂ = n₁ × sin i₁ / sin i₂', val: Math.sin(p.i1 * Math.PI / 180) / Math.sin(p.i2 * Math.PI / 180), u: '' } };
    },
  },
  {
    id: 'noyau2', domaine: 'Matière à l’échelle microscopique', titre: 'Le noyau d’un atome', noms: ['Nombre de neutrons', 'Charge électrique du noyau'],
    gen: () => ({ at: tire([['lithium', 3, 7], ['fluor', 9, 19], ['sodium', 11, 23], ['aluminium', 13, 27], ['phosphore', 15, 31], ['chlore', 17, 35], ['potassium', 19, 39], ['fer', 26, 56], ['cuivre', 29, 63]]) }),
    build: (p, q) => {
      const [nom, Z, A] = p.at;
      const tokens = { A: tok(`${A}`, 'Nombre de nucléons de l’atome', A, ''), Z: tok(`${Z}`, 'Numéro atomique (nombre de protons)', Z, ''), e: tok('e = 1,6 × 10⁻¹⁹ C', 'Charge élémentaire', 1.6e-19, 'C'), mp: tok('1,67 × 10⁻²⁷ kg', 'Masse d’un nucléon', 1.67e-27, 'kg') };
      const base = ['Un atome ' + (/^[aeiouyéèh]/.test(nom) ? 'd’' : 'de ') + nom + ' contient ', T('A'), ' nucléons (les particules du noyau) dont ', T('Z'), ' protons. '];
      if (q === 0) return { tokens, derivees: [],
        texte: [...base, 'La charge d’un proton est égale à la charge élémentaire (', T('e'), ') et le neutron n’a pas de charge ; la masse d’un nucléon vaut ', T('mp'), '. Quel est le nombre de neutrons de son noyau ?'],
        utiles: ['A', 'Z'],
        raisons: { e: 'La charge élémentaire sert à calculer une charge électrique, pas un nombre de particules.', mp: 'La masse d’un nucléon sert à calculer une masse, pas un nombre de particules.' },
        cherche: { bonne: 'Le nombre N de neutrons du noyau', faux: ['La charge électrique du noyau (en C)', 'Le nombre d’électrons de l’atome neutre', 'La masse du noyau (en kg)'] },
        manque: null, solution: { txt: 'N = A − Z', val: A - Z, u: '' } };
      return { tokens, derivees: [],
        texte: [...base, 'La charge d’un proton est égale à la charge élémentaire (', T('e'), ') et le neutron n’a pas de charge ; la masse d’un nucléon vaut ', T('mp'), '. Quelle est la charge électrique du noyau (en C) ?'],
        utiles: ['Z', 'e'],
        raisons: { A: 'Le nombre de nucléons compte aussi les neutrons, qui n’ont pas de charge : seul le nombre de protons intervient.', mp: 'La masse d’un nucléon n’intervient pas dans le calcul d’une charge.' },
        cherche: { bonne: 'La charge électrique Q du noyau (en C)', faux: ['Le nombre de neutrons du noyau', 'La masse du noyau (en kg)', 'La charge électrique de l’atome (en C)'] },
        manque: null, solution: { txt: 'Q = Z × e', val: Z * 1.6e-19, u: 'C' } };
    },
  },
  {
    id: 'dissol2', domaine: 'Cohésion et solubilité', titre: 'Dissoudre un soluté : quantité de matière et concentration', noms: ['Concentration en quantité de matière', 'Masse de soluté à peser'],
    gen: () => { const s = tire([['chlorure de sodium', 58.5], ['glucose', 180], ['saccharose', 342], ['chlorure de potassium', 74.6]]);
      return { nom: s[0], M: s[1], m: tire([2, 5, 10]), Vf: tire([100, 250, 500]), c: tire([0.05, 0.1, 0.2]), Ve: tire([50, 60, 80]), T: tire([18, 20, 25]) }; },
    build: (p, q) => {
      const tokens = { M: tok(`${nb(p.M)} g·mol⁻¹`, 'Masse molaire du ' + p.nom, p.M, 'g·mol⁻¹'), T: tok(`${p.T} °C`, 'Température de la solution', p.T, '°C'), Ve: tok(`${p.Ve} mL`, 'Volume d’eau versé pour dissoudre', p.Ve / 1000, 'L') };
      if (q === 0) {
        tokens.m = tok(`${p.m} g`, 'Masse de soluté pesée', p.m, 'g');
        tokens.Vf = tok(`${p.Vf} mL`, 'Volume de la solution (fiole jaugée)', p.Vf / 1000, 'L');
        return { tokens, derivees: [{ id: 'n', nom: 'Quantité de matière n de soluté', expr: 'n = frac(m|M)', val: p.m / p.M, u: 'mol' }],
          texte: ['On dissout ', T('m'), ' de ' + p.nom + ' (', T('M'), ') dans environ ', T('Ve'), ' d’eau, puis on complète à ', T('Vf'), ' avec de l’eau distillée dans une fiole jaugée. La température de la solution est de ', T('T'), '. Quelle est la concentration en quantité de matière du soluté dans la solution (en mol·L⁻¹) ?'],
          utiles: ['m', 'M', 'Vf'],
          raisons: { Ve: 'C’est le volume d’eau versé au début : la solution finale a le volume de la fiole jaugée.', T: 'La température n’est pas une donnée de la formule c = frac(n|V).' },
          cherche: { bonne: 'La concentration c en quantité de matière (en mol·L⁻¹)', faux: ['La quantité de matière n de soluté (en mol)', 'La concentration en masse t du soluté (en g·L⁻¹)', 'La solubilité du soluté dans l’eau (en g·L⁻¹)'] },
          manque: null, solution: { txt: 'c = frac(n|V) avec n = frac(m|M) (V converti en L)', val: p.m / p.M / (p.Vf / 1000), u: 'mol·L⁻¹' } };
      }
      tokens.c = tok(`${nb(p.c, 2)} mol·L⁻¹`, 'Concentration souhaitée', p.c, 'mol·L⁻¹');
      tokens.Vf = tok(`${p.Vf} mL`, 'Volume de solution à préparer', p.Vf / 1000, 'L');
      return { tokens, derivees: [{ id: 'n', nom: 'Quantité de matière n de soluté à dissoudre', expr: 'n = c × V', val: p.c * p.Vf / 1000, u: 'mol' }],
        texte: ['On veut préparer une solution de ' + p.nom + ' de concentration ', T('c'), ' dans une fiole jaugée de ', T('Vf'), '. La solution est à ', T('T'), '. On dissout d’abord le soluté dans environ ', T('Ve'), ' d’eau. Donnée : ', T('M'), '. Quelle masse de soluté faut-il peser (en g) ?'],
        utiles: ['c', 'Vf', 'M'],
        raisons: { Ve: 'C’est le volume d’eau versé au début, pas le volume de la solution.', T: 'La température ne joue aucun rôle dans le calcul de la masse à peser.' },
        cherche: { bonne: 'La masse m de soluté à peser (en g)', faux: ['La quantité de matière n de soluté (en mol)', 'La concentration en masse t (en g·L⁻¹)', 'La solubilité du soluté dans l’eau (en g·L⁻¹)'] },
        manque: null, solution: { txt: 'm = n × M avec n = c × V (V converti en L)', val: p.c * (p.Vf / 1000) * p.M, u: 'g' } };
    },
  },
  {
    id: 'ener2', schema: () => ({ type: 'circuitSimple', dipole: 'four électrique', generateur: 'prise secteur' }), domaine: 'Énergie électrique', titre: 'Énergie et effet Joule', noms: ['Énergie consommée', 'Puissance dissipée par effet Joule'],
    gen: () => ({ P: tire([800, 1500, 2000]), dmin: tire([15, 30, 45, 90]), prix: 0.25, R: tire([1.0, 2.2, 4.7]), I: tire([1, 2, 5]), L: tire([6, 9, 12]) }),
    build: (p, q) => {
      if (q === 0) {
        const tokens = { P: tok(`${p.P} W`, 'Puissance de l’appareil', p.P / 1000, 'kW'), d: tok(`${p.dmin} min`, 'Durée de fonctionnement', p.dmin / 60, 'h'), prix: tok(`${nb(p.prix, 2)} € par kWh`, 'Prix de l’électricité', p.prix, '€·kWh⁻¹') };
        return { tokens, derivees: [],
          texte: ['Un four électrique de puissance ', T('P'), ' (supposée constante) fonctionne pendant ', T('d'), '. L’électricité coûte ', T('prix'), '. Quelle énergie électrique a-t-il consommée (en kWh) ?'],
          utiles: ['P', 'd'],
          raisons: { prix: 'Le prix servirait à calculer le coût de l’énergie, pas l’énergie elle-même.' },
          cherche: { bonne: 'L’énergie électrique E consommée (en kWh)', faux: ['L’énergie consommée en une heure de fonctionnement (en kWh)', 'Le coût de l’énergie consommée (en €)', 'L’intensité du courant dans le four (en A)'] },
          manque: null, solution: { txt: 'E = P × Δt (P en kW, Δt en h)', val: p.P / 1000 * p.dmin / 60, u: 'kWh' } };
      }
      const tokens = { R: tok(`${nb(p.R, 1)} kΩ`, 'Résistance du résistor', p.R * 1000, 'Ω'), I: tok(`${p.I} mA`, 'Intensité du courant', p.I / 1000, 'A'), L: tok(`${p.L} mm`, 'Longueur du résistor', p.L / 1000, 'm') };
      return { tokens, derivees: [],
        texte: ['Un résistor de résistance ', T('R'), ' et de longueur ', T('L'), ' est traversé par un courant continu d’intensité ', T('I'), '. Quelle puissance dissipe-t-il par effet Joule (en W) ?'],
        utiles: ['R', 'I'],
        raisons: { L: 'La longueur ne compte pas ici : la résistance R est déjà donnée, et P = R × I².' },
        cherche: { bonne: 'La puissance P dissipée par effet Joule (en W)', faux: ['La tension U aux bornes du résistor (en V)', 'L’énergie dissipée en une heure (en kWh)', 'La résistivité du matériau du résistor (en Ω·m)'] },
        manque: null, solution: { txt: 'P = R × I² (R en Ω, I en A)', val: p.R * 1000 * Math.pow(p.I / 1000, 2), u: 'W' } };
    },
  },
  {
    id: 'meca2', schema: () => ({ type: 'mobile', objet: 'véhicule', sol: 'route' }), domaine: 'Mécanique', titre: 'Énergie cinétique et travail', noms: ['Énergie cinétique', 'Travail d’une force'],
    gen: () => { const [mt, L] = tire([[0.8, 3.6], [0.95, 3.8], [1.1, 4.0], [1.2, 4.2], [1.35, 4.4], [1.5, 4.6]]); let F; do F = tire([0.5, 0.8, 1.2, 1.5, 2, 3]); while (F === mt);   // F ≠ m : deux données de même valeur se confondraient
    return { mt, L, v: tire([36, 54, 72, 90, 108, 126]), F, d: tire([50, 80, 120, 200, 300]), a: tire([0, 30, 45, 60]) }; },
    build: (p, q) => {
      if (q === 0) {
        const tokens = { m: tok(`${nb(p.mt)} t`, 'Masse du véhicule', p.mt * 1000, 'kg'), v: tok(`${p.v} km·h⁻¹`, 'Vitesse du véhicule', p.v / 3.6, 'm·s⁻¹'), L: tok(`${nb(p.L)} m`, 'Longueur du véhicule', p.L, 'm') };
        return { tokens, derivees: [],
          texte: ['Un véhicule de ', T('m'), ' et de ', T('L'), ' de long roule à ', T('v'), ' (dans le référentiel terrestre ; on le modélise par un point matériel en translation). Quelle est son énergie cinétique (en J) ?'],
          utiles: ['m', 'v'],
          raisons: { L: 'La longueur du véhicule n’intervient pas dans Ec = ½ m v².' },
          cherche: { bonne: 'L’énergie cinétique Ec du véhicule (en J)', faux: ['La puissance du moteur du véhicule (en W)', 'Le travail de la force motrice (en J)', 'L’énergie potentielle de pesanteur du véhicule (en J)'] },
          manque: null, solution: { txt: 'Ec = ½ × m × v² (m en kg, v en m·s⁻¹)', val: 0.5 * p.mt * 1000 * Math.pow(p.v / 3.6, 2), u: 'J' } };
      }
      const tokens = { F: tok(`${nb(p.F)} kN`, 'Valeur de la force', p.F * 1000, 'N'), d: tok(`${p.d} cm`, 'Distance parcourue', p.d / 100, 'm'), a: tok(`${p.a}°`, 'Angle entre la force et le déplacement', p.a, '°'), mt: tok(`${nb(p.mt)} t`, 'Masse de l’objet déplacé', p.mt * 1000, 'kg') };
      return { tokens, derivees: [],
        texte: ['Une force constante de valeur ', T('F'), ' agit sur un objet de ', T('mt'), ' qui se déplace en ligne droite de ', T('d'), '. L’angle entre la force et le déplacement est de ', T('a'), '. Quel est le travail de la force pendant ce déplacement (en J) ?'],
        utiles: ['F', 'd', 'a'],
        raisons: { mt: 'La masse de l’objet n’intervient pas dans W = F × d × cos α.' },
        cherche: { bonne: 'Le travail W de la force (en J)', faux: ['L’énergie cinétique de l’objet (en J)', 'La puissance de la force (en W)', 'L’énergie potentielle de pesanteur (en J)'] },
        manque: null, solution: { txt: 'W = F × d × cos α (F en N, d en m)', val: p.F * 1000 * p.d / 100 * Math.cos(p.a * Math.PI / 180), u: 'J' } };
    },
  },
  {
    id: 'hydrodist', domaine: 'Distillation', titre: 'Hydrodistillation d’une huile essentielle de lavande', noms: ['Rendement d’extraction', 'Volume d’huile essentielle', 'Énergie dépensée par gramme d’huile'],
    schema: (p, b) => ({ type: 'hydrodistillation', mp: b.tokens.mp.aff, Veau: b.tokens.Veau.aff, P: b.tokens.P.aff, T: b.dansTexte.has('T') ? b.tokens.T.aff : '', mh: b.dansTexte.has('mh') ? b.tokens.mh.aff : '' }),
    gen: () => {
      const mp = tire([20, 25, 30, 40, 50]), eta = tire([0.6, 0.8, 1.0, 1.2, 1.5]);
      const P = tire(mp <= 25 ? [9, 12] : [12, 15]), t = tire([2, 2.5, 3]), Veau = tire([60, 80, 100]);
      // énergie électrique disponible (kWh) ; il faut chauffer l’eau de 20 à 100 °C puis en vaporiser Vh, avec ≥ 30 % de pertes
      const Vh = tire([4, 6, 8, 10, 12].filter(v => Veau * 0.0929 + v * 0.628 <= 0.7 * P * t));
      return { mp, mh: Math.round(mp * 10 * eta), Veau, P, t, T: tire([98, 99]), rho: tire([0.88, 0.89, 0.90]), Vh };
    },
    build: (p, q) => {
      const tokens = {
        mp: tok(`${p.mp} kg`, 'Masse de fleurs fraîches', p.mp * 1000, 'g'),
        Veau: tok(`${p.Veau} L`, 'Volume d’eau chargé dans l’alambic', p.Veau, 'L'),
        P: tok(`${p.P} kW`, 'Puissance électrique de chauffe', p.P, 'kW'),
        t: tok(`${nb(p.t, 1)} h`, 'Durée de la distillation', p.t, 'h'),
        T: tok(`${p.T} °C`, 'Température de la vapeur en tête de colonne', p.T, '°C'),
        mh: tok(`${p.mh} g`, 'Masse d’huile essentielle recueillie', p.mh, 'g'),
        rho: tok(`${nb(p.rho, 2)} g·mL⁻¹`, 'Masse volumique de l’huile essentielle', p.rho, 'g·mL⁻¹'),
        Vh: tok(`${p.Vh} L`, 'Volume d’hydrolat recueilli', p.Vh, 'L'),
      };
      const debut = ['Un producteur extrait l’huile essentielle de lavande par hydrodistillation. Il charge l’alambic avec ', T('mp'), ' de fleurs fraîches et ', T('Veau'), ' d’eau, puis chauffe avec une résistance électrique de puissance ', T('P'),
        ' (supposée constante) pendant ', T('t'), '. La vapeur en tête de colonne est à ', T('T'), '. Dans l’essencier, il recueille ', T('mh'), ' d’huile essentielle, de masse volumique ', T('rho'),
        ', en plus de ', T('Vh'), ' d’hydrolat (l’eau aromatique). '];
      const rEau = 'Le volume d’eau chargé n’entre pas dans le calcul demandé : la masse d’huile recueillie est donnée directement, il n’y a pas à la déduire de l’eau chargée.';
      const rT = 'La température de la vapeur explique le procédé (le mélange eau–huile bout sous 100 °C), mais n’entre pas dans le calcul demandé.';
      const rHyd = 'L’hydrolat est la phase aqueuse du distillat : il ne donne pas la quantité d’huile essentielle, qui est comptée à part.';
      const rMp = 'La masse de fleurs sert à comparer l’huile obtenue à la matière végétale, pas à calculer un volume ni une énergie.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le rendement massique d’extraction, c’est-à-dire la masse d’huile essentielle recueillie par rapport à la masse de fleurs fraîches ?'], utiles: ['mp', 'mh'],
        raisons: { Veau: rEau, P: 'La puissance de chauffe détermine l’énergie dépensée, pas la quantité d’huile extraite.', t: 'La durée de distillation n’apparaît pas dans un rapport de masses.', T: rT, rho: 'La masse volumique servirait à passer d’une masse à un volume : ici on compare deux masses.', Vh: rHyd },
        cherche: { bonne: 'Le rendement massique : masse d’huile / masse de fleurs fraîches (en %)', faux: ['La teneur en huile de l’hydrolat : masse d’huile / volume d’hydrolat (en g·L⁻¹)', 'La masse d’huile obtenue par litre d’eau chargée (en g·L⁻¹)', 'Le volume d’huile essentielle recueillie (en mL)'] },
        manque: null,
        solution: { txt: 'η = frac(m_huile|m_fleurs) × 100', val: p.mh / (p.mp * 1000) * 100, u: '%' } };
      if (q === 1) return { tokens, derivees: [], texte: [...debut, 'Quel volume occupe l’huile essentielle recueillie dans l’essencier ?'], utiles: ['mh', 'rho'],
        raisons: { mp: rMp, Veau: rEau, P: 'La puissance de chauffe n’a aucun lien avec le volume d’huile recueillie.', t: 'La durée de distillation n’intervient pas dans le calcul d’un volume à partir d’une masse.', T: rT, Vh: rHyd },
        cherche: { bonne: 'Le volume d’huile essentielle recueillie (en mL)', faux: ['La masse d’huile essentielle recueillie (en g)', 'Le volume total du distillat, huile et hydrolat (en L)', 'La masse volumique de l’hydrolat (en g·mL⁻¹)'] },
        manque: null,
        solution: { txt: 'V = frac(m_huile|ρ)', val: p.mh / p.rho, u: 'mL' } };
      return { tokens, texte: [...debut, 'Quelle énergie électrique a été dépensée, en moyenne, pour obtenir un gramme d’huile essentielle ?'], utiles: ['P', 't', 'mh'],
        derivees: [{ id: 'E', nom: 'Énergie électrique dépensée E', expr: 'E = P × Δt', val: p.P * p.t, u: 'kWh' }],
        raisons: { mp: rMp, Veau: rEau, T: rT, rho: 'La masse volumique de l’huile ne sert pas à calculer une énergie.', Vh: rHyd },
        cherche: { bonne: 'L’énergie électrique dépensée par gramme d’huile essentielle (en Wh·g⁻¹)', faux: ['L’énergie électrique totale dépensée (en kWh)', 'L’énergie électrique dépensée par kilogramme de fleurs (en kWh·kg⁻¹)', 'La puissance moyenne de chauffe par gramme d’huile (en W·g⁻¹)'] },
        manque: null,
        solution: { txt: 'e = P × Δt / m_huile', val: p.P * p.t * 1000 / p.mh, u: 'Wh·g⁻¹' } };
    },
  },
  // ───────────────────────────── Évaporation et cristallisation : évaporateur industriel
  {
    id: 'crist-evaporateur', domaine: 'Évaporation et cristallisation', titre: 'Concentrer un jus sucré dans un évaporateur', noms: ['Débit de saccharose entrant', 'Débit d’eau évaporée', 'Masse d’eau évaporée sur une campagne'],
    schema: (p, b) => ({ type: 'evaporateur', q1: b.tokens.q1.aff, w1: b.tokens.w1.aff, w2: b.tokens.w2.aff, Pv: b.tokens.Pv.aff }),
    gen: () => ({ q1: tire([8, 10, 12, 15, 20]), w1: tire([10, 12, 15, 18]), w2: tire([60, 65]), S: tire([150, 200, 250, 300]), Pv: tire([2, 2.5, 3]), th: tire([75, 85, 95]), dur: tire([8, 12, 24]) }),
    build: (p, q) => {
      const tokens = {
        q1: tok(`${p.q1} t·h⁻¹`, 'Débit massique de jus à l’entrée', p.q1, 't·h⁻¹'),
        w1: tok(`${p.w1} %`, 'Teneur en saccharose du jus d’entrée (en masse)', p.w1, '%'),
        w2: tok(`${p.w2} %`, 'Teneur en saccharose du sirop de sortie (en masse)', p.w2, '%'),
        S: tok(`${p.S} m²`, 'Surface d’échange de l’évaporateur', p.S, 'm²'),
        Pv: tok(`${nb(p.Pv, 1)} bar`, 'Pression de la vapeur de chauffe', p.Pv, 'bar'),
        th: tok(`${p.th} °C`, 'Température d’ébullition du jus dans l’évaporateur', p.th, '°C'),
      };
      const debut = ['Dans une sucrerie, un évaporateur fonctionne en continu et en régime permanent. Il reçoit un jus sucré (solution aqueuse de saccharose) au débit massique de ', T('q1'), ', qui contient ', T('w1'),
        ' de saccharose en masse. Il en sort un sirop concentré à ', T('w2'), ' de saccharose en masse, et de la vapeur d’eau pure.\n\nL’évaporateur a une surface d’échange de ', T('S'), ' ; il est chauffé par de la vapeur sous ', T('Pv'),
        ' et le jus y bout à ', T('th'), '. Le saccharose n’est pas entraîné avec la vapeur et ne cristallise pas. '];
      const qs = p.q1 * p.w1 / 100, q2 = qs / (p.w2 / 100), qe = p.q1 - q2;
      const rTher = 'Les caractéristiques thermiques de l’évaporateur (surface, pression de chauffe, température) fixent la puissance et la vitesse d’évaporation, pas le bilan de matière.';
      const rW2 = 'La teneur du sirop de sortie sert à calculer ce qui sort, pas la quantité de saccharose qui entre.';
      const rThermique = { S: rTher, Pv: rTher, th: rTher };
      const dQs = { id: 'qs', nom: 'Débit massique de saccharose (le même à l’entrée et à la sortie)', expr: 'q_saccharose = frac(q₁ × w₁|100)', val: qs, u: 't·h⁻¹' };
      const dQ2 = { id: 'q2', nom: 'Débit massique de sirop de sortie', expr: 'q₂ = frac(q_saccharose|w₂ / 100)', val: q2, u: 't·h⁻¹' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le débit massique de saccharose qui entre dans l’évaporateur ?'], utiles: ['q1', 'w1'],
        raisons: { w2: rW2, ...rThermique },
        cherche: { bonne: 'Le débit massique de saccharose dans le jus d’entrée (en t·h⁻¹)', faux: ['Le débit massique d’eau dans le jus d’entrée (en t·h⁻¹)', 'Le débit massique de sirop à la sortie (en t·h⁻¹)', 'Le débit massique d’eau évaporée (en t·h⁻¹)'] },
        manque: null, solution: { txt: 'q_saccharose = frac(q₁ × w₁|100)', val: qs, u: 't·h⁻¹' } };
      if (q === 1) return { tokens, derivees: [dQs, dQ2], texte: [...debut, 'Quel est le débit massique d’eau évaporée ?'], utiles: ['q1', 'w1', 'w2'],
        raisons: rThermique,
        cherche: { bonne: 'Le débit massique d’eau évaporée (en t·h⁻¹)', faux: ['Le débit massique de sirop à la sortie (en t·h⁻¹)', 'Le débit massique de saccharose dans le jus (en t·h⁻¹)', 'Le débit massique d’eau contenue dans le jus d’entrée (en t·h⁻¹)'] },
        manque: null, solution: { txt: 'q_évaporée = q₁ − q₂, avec q₂ = frac(q₁ × w₁|w₂)', val: qe, u: 't·h⁻¹' } };
      tokens.dur = tok(`${p.dur} heures`, 'Durée de fonctionnement de la campagne', p.dur, 'h');
      return { tokens, derivees: [dQs, dQ2, { id: 'qe', nom: 'Débit massique d’eau évaporée', expr: 'q_évaporée = q₁ − q₂', val: qe, u: 't·h⁻¹' }],
        texte: [...debut, 'L’évaporateur fonctionne sans interruption pendant ', T('dur'), '. Quelle masse d’eau a-t-il évaporée pendant cette durée ?'], utiles: ['q1', 'w1', 'w2', 'dur'],
        raisons: rThermique,
        cherche: { bonne: 'La masse d’eau évaporée pendant la durée de fonctionnement (en t)', faux: ['Le débit massique d’eau évaporée (en t·h⁻¹)', 'La masse de sirop produite pendant la durée de fonctionnement (en t)', 'La masse de jus traitée pendant la durée de fonctionnement (en t)'] },
        manque: null, solution: { txt: 'm_évaporée = (q₁ − frac(q₁ × w₁|w₂)) × durée', val: qe * p.dur, u: 't' } };
    },
  },
  // ───────────────────────────── Transport des fluides : statique des fluides (capteur de pression, cuve d’huile)
  {
    id: 'flu-statique', domaine: 'Transport des fluides', titre: 'Un capteur de pression au fond d’une cuve d’huile', noms: ['Hauteur d’huile dans la cuve', 'Force sur la trappe de vidange', 'Baisse de pression pendant la vidange'],
    schema: (p, b, q) => ({ type: 'cuveHuile', hInconnue: q === 0, P: b.tokens.P.aff, rho: b.tokens.rho.aff, d: b.tokens.d ? b.tokens.d.aff : null }),
    gen: () => ({ rho: tire([910, 915, 920, 925]), g: 9.81, P: tire([0.20, 0.25, 0.30, 0.35, 0.40, 0.45]), th: tire([15, 20, 25]), Vc: tire([10, 15, 20, 30]),
      Patm: tire([1005, 1013, 1020]), d: tire([100, 150, 200, 250]), dh: tire([0.5, 0.8, 1.0, 1.2, 1.5]) }),
    build: (p, q) => {
      const tokens = {
        rho: tok(`${p.rho} kg·m⁻³`, 'Masse volumique de l’huile', p.rho, 'kg·m⁻³'),
        g: tok(`${nb(p.g, 2)} N·kg⁻¹`, 'Intensité de la pesanteur', p.g, 'N·kg⁻¹'),
        P: tok(`${nb(p.P, 2)} bar`, 'Pression relative indiquée par le capteur', p.P * 1e5, 'Pa'),
        th: tok(`${p.th} °C`, 'Température de l’huile', p.th, '°C'),
        Vc: tok(`${p.Vc} m³`, 'Volume total de la cuve', p.Vc, 'm³'),
        Patm: tok(`${p.Patm} hPa`, 'Pression atmosphérique', p.Patm * 100, 'Pa'),
      };
      const debut = ['Une cuve cylindrique, ouverte à l’air libre et de volume total ', T('Vc'), ', contient une huile végétale au repos, de masse volumique ', T('rho'), ' à ', T('th'),
        ' (supposée uniforme dans toute l’huile).\n\nUn capteur de pression relative (il mesure l’écart avec la pression atmosphérique, qui vaut ', T('Patm'), ' ce jour-là) est fixé au fond de la cuve et indique ', T('P'),
        '. L’intensité de la pesanteur vaut ', T('g'), '. '];
      const rTh = 'La température intervient seulement par la valeur de la masse volumique, qui est déjà donnée pour cette température.';
      const rVc = 'Le volume total de la cuve ne donne pas la hauteur d’huile : il faudrait aussi connaître la section de la cuve, et elle n’est pas nécessaire ici.';
      const rPatm = 'Le capteur indique une pression relative : la pression atmosphérique est déjà retranchée, elle n’intervient donc pas.';
      const rRhoG = 'La pression est déjà donnée : ρ et g serviraient à la calculer à partir d’une hauteur, ce qui n’est pas demandé.';
      const Prel = p.P * 1e5;
      if (q === 0) return { tokens, texte: [...debut, 'Quelle est la hauteur d’huile au-dessus du capteur ?'], utiles: ['rho', 'g', 'P'],
        derivees: [{ id: 'Pa', nom: 'Pression relative en pascals', expr: 'P_rel = P(en bar) × 10⁵   (1 bar = 10⁵ Pa)', val: Prel, u: 'Pa' }],
        raisons: { th: rTh, Vc: rVc, Patm: rPatm },
        cherche: { bonne: 'La hauteur h d’huile au-dessus du capteur (en m)', faux: ['La pression absolue au fond de la cuve (en Pa)', 'Le volume d’huile contenu dans la cuve (en m³)', 'La masse d’huile contenue dans la cuve (en kg)'] },
        manque: null, solution: { txt: 'h = frac(P_rel|ρ·g), avec P_rel en pascals', val: Prel / (p.rho * p.g), u: 'm' } };
      if (q === 1) {
        tokens.d = tok(`${p.d} mm`, 'Diamètre de la trappe de vidange', p.d / 1000, 'm');
        return { tokens, texte: [...debut, 'Une trappe de vidange horizontale, de forme circulaire et de diamètre ', T('d'), ', est située au fond de la cuve, à la hauteur du capteur ; sous la trappe, l’air est à la pression atmosphérique. Le poids de la trappe est négligé. Quelle est la valeur de la force pressante résultante qui s’exerce sur la trappe ?'],
          utiles: ['P', 'd'],
          derivees: [{ id: 'Pa', nom: 'Pression relative en pascals', expr: 'P_rel = P(en bar) × 10⁵   (1 bar = 10⁵ Pa)', val: Prel, u: 'Pa' }, { id: 'S', nom: 'Section S de la trappe', expr: 'S = frac(π·d²|4)', val: Math.PI * (p.d / 1000) ** 2 / 4, u: 'm²' }],
          raisons: { rho: rRhoG, g: rRhoG, th: rTh, Vc: 'Le volume de la cuve ne donne pas la force sur la trappe : celle-ci ne dépend que de la pression au fond et de la surface de la trappe.',
            Patm: 'La pression atmosphérique s’exerce aussi sous la trappe : elle se compense, et le capteur la retranche déjà. Seule la pression relative compte.' },
          cherche: { bonne: 'La force pressante résultante F sur la trappe (en N)', faux: ['La pression relative exercée sur la trappe (en Pa)', 'Le poids de l’huile contenue dans la cuve (en N)', 'La force pressante exercée par la seule atmosphère sur la trappe (en N)'] },
          manque: null, solution: { txt: 'F = P_rel × S, avec S = frac(π·d²|4)', val: Prel * Math.PI * (p.d / 1000) ** 2 / 4, u: 'N' } };
      }
      tokens.dh = tok(`${nb(p.dh, 1)} m`, 'Baisse du niveau d’huile', p.dh, 'm');
      return { tokens, texte: [...debut, 'Pendant la vidange, le niveau d’huile baisse de ', T('dh'), ' (la masse volumique de l’huile ne change pas). De combien diminue la pression indiquée par le capteur ?'],
        utiles: ['rho', 'g', 'dh'], derivees: [],
        raisons: { P: 'La valeur de la pression lue au départ ne sert pas : on cherche une variation, qui ne dépend que de la variation de hauteur.', th: rTh, Vc: 'Le volume total de la cuve n’intervient pas dans la variation de pression due à une variation de hauteur.', Patm: rPatm },
        cherche: { bonne: 'La diminution ΔP de la pression indiquée par le capteur (en mbar)', faux: ['La nouvelle pression relative indiquée par le capteur (en mbar)', 'La masse d’huile évacuée pendant la vidange (en kg)', 'Le volume d’huile évacué pendant la vidange (en m³)'] },
        manque: null, solution: { txt: 'ΔP = ρ·g·Δh (en pascals ; 1 mbar = 100 Pa)', val: p.rho * p.g * p.dh / 100, u: 'mbar' } };
    },
  },
  // ───────────────────────────── Transport des fluides : débits massique et volumique (fût sur une balance)
  {
    id: 'flu-debit', domaine: 'Transport des fluides', titre: 'Contrôler le débit d’une pompe doseuse avec une balance', noms: ['Débit massique de la pompe', 'Masse volumique du liquide', 'Débit volumique de la pompe'],
    gen: () => {
      const rho = tire([1040, 1080, 1100, 1140]), V = tire([20, 25, 30, 40, 50]), mv = tire([1.8, 2.2, 2.5, 3.0]);
      const mnet = Math.round(rho * V / 100) / 10;                 // masse de liquide (kg), exacte à 0,1 kg près
      return { rho, V, mv, mt: Math.round((mv + mnet) * 10) / 10, dt: tire([2, 3, 4, 5]), Bmax: tire([100, 150]), Pm: tire([0.25, 0.37, 0.55]), th: tire([15, 20, 25]) };
    },
    build: (p, q) => {
      const tokens = {
        Pm: tok(`${nb(p.Pm, 2)} kW`, 'Puissance du moteur de la pompe', p.Pm, 'kW'),
        Bmax: tok(`${p.Bmax} kg`, 'Portée maximale de la balance', p.Bmax, 'kg'),
        mv: tok(`${nb(p.mv, 1)} kg`, 'Masse du fût vide', p.mv, 'kg'),
        th: tok(`${p.th} °C`, 'Température de la saumure', p.th, '°C'),
        dt: tok(`${p.dt} min`, 'Durée de remplissage', p.dt * 60, 's'),
        mt: tok(`${nb(p.mt, 1)} kg`, 'Masse indiquée par la balance en fin de remplissage (fût compris)', p.mt, 'kg'),
      };
      const debut = ['Pour contrôler le débit d’une pompe doseuse (moteur de puissance ', T('Pm'), '), un opérateur la fait remplir un fût posé sur une balance de portée maximale ', T('Bmax'),
        '. Le fût vide a été pesé : ', T('mv'), '. Le liquide pompé est une saumure (solution aqueuse de chlorure de sodium) à ', T('th'),
        '. L’opérateur déclenche le chronomètre au démarrage de la pompe et l’arrête au bout de ', T('dt'), ' : la balance indique alors ', T('mt'), ', fût compris. On suppose le débit constant pendant le remplissage. '];
      const rB = 'La portée maximale indique seulement jusqu’à quelle masse la balance peut mesurer : ce n’est pas une mesure du liquide.';
      const rPm = 'La puissance du moteur ne donne pas la quantité de liquide débitée : ici, le débit se déduit directement de la pesée et du chronomètre.';
      const rTh = 'La température n’intervient pas dans un rapport entre masses, volumes et durées déjà mesurés.';
      const mnet = Math.round((p.mt - p.mv) * 10) / 10, Qm = mnet / (p.dt * 60);
      const dM = { id: 'm', nom: 'Masse m de saumure recueillie', expr: 'm = m_balance − m_fût', val: mnet, u: 'kg' };
      if (q === 0) return { tokens, derivees: [dM], texte: [...debut, 'Quel est le débit massique de la pompe ?'], utiles: ['mv', 'mt', 'dt'],
        raisons: { Pm: rPm, Bmax: rB, th: rTh },
        cherche: { bonne: 'Le débit massique q_m de la pompe (en kg·s⁻¹)', faux: ['Le débit volumique de la pompe (en m³·h⁻¹)', 'La masse de saumure recueillie (en kg)', 'La masse volumique de la saumure (en kg·m⁻³)'] },
        manque: null, solution: { txt: 'q_m = (m_balance − m_fût) / Δt', val: Qm, u: 'kg·s⁻¹' } };
      if (q === 1) {
        tokens.V = tok(`${p.V} L`, 'Volume de saumure lu sur le fût gradué', p.V / 1000, 'm³');
        return { tokens, derivees: [dM], texte: [...debut, 'Le niveau de la saumure dans le fût se trouve alors au repère ', T('V'), '. Quelle est la masse volumique de la saumure ?'], utiles: ['mv', 'mt', 'V'],
          raisons: { Pm: 'La puissance du moteur ne renseigne ni sur la masse ni sur le volume de liquide recueilli : la masse volumique se déduit de la pesée et du volume lu sur le fût.', Bmax: rB, th: rTh, dt: 'La durée de remplissage donne un débit, pas la masse volumique, qui ne relie que la masse et le volume du liquide recueilli.' },
          cherche: { bonne: 'La masse volumique ρ de la saumure (en kg·m⁻³)', faux: ['Le débit massique de la pompe (en kg·s⁻¹)', 'La masse de saumure recueillie (en kg)', 'Le volume massique de la saumure (en m³·kg⁻¹)'] },
          manque: null, solution: { txt: 'ρ = m / V, avec m = m_balance − m_fût', val: p.rho, u: 'kg·m⁻³' } };
      }
      return { tokens, derivees: [dM, { id: 'qm', nom: 'Débit massique de la pompe', expr: 'q_m = m / Δt', val: Qm, u: 'kg·s⁻¹' }],
        texte: [...debut, 'Quel est le débit volumique de la pompe ?'], utiles: ['mv', 'mt', 'dt'],
        raisons: { Pm: rPm, Bmax: rB, th: 'La température ne permettrait de lire la masse volumique d’une saumure dans une table qu’avec sa concentration, qui n’est pas donnée : elle ne remplace pas la donnée manquante.' },
        cherche: { bonne: 'Le débit volumique q_V de la pompe (en m³·h⁻¹)', faux: ['Le débit massique de la pompe (en kg·s⁻¹)', 'La masse volumique de la saumure (en kg·m⁻³)', 'Le volume de saumure recueilli (en m³)'] },
        manque: { bonne: 'Il manque la masse volumique de la saumure', faux: ['Il manque la durée de remplissage', 'Il manque la masse du fût vide', 'Il ne manque aucune donnée pour ce calcul'],
          expl: `Pour passer d’un débit massique à un débit volumique, il faut la masse volumique : q_V = frac(q_m|ρ). L’énoncé ne la donne pas, et ne donne pas non plus le volume recueilli. Elle peut se mesurer en lisant le volume sur le fût et en calculant ρ = m / V. La masse du fût vide (${tokens.mv.aff}), la masse finale (${tokens.mt.aff}) et la durée (${tokens.dt.aff}) y figurent bien : elles donnent le débit massique.` },
        solution: { txt: `q_V = frac(q_m|ρ) (ici ρ = ${nb(p.rho)} kg·m⁻³, valeur à mesurer ; 1 m³·s⁻¹ = 3 600 m³·h⁻¹)`, val: Qm / p.rho * 3600, u: 'm³·h⁻¹' } };
    },
  },
  // ───────────────────────────── Transport des fluides : conservation du débit dans une réduction de section
  {
    id: 'flu-section', domaine: 'Transport des fluides', titre: 'Une conduite d’eau qui se rétrécit', noms: ['Débit volumique dans la conduite', 'Vitesse dans la partie étroite', 'Durée de remplissage d’un bassin'],
    schema: (p, b) => ({ type: 'conduiteConvergent', D1: b.tokens.D1.aff, L: b.tokens.L.aff, P1: b.tokens.P1.aff, v1: b.tokens.v1.aff, D2: b.tokens.D2.aff }),
    gen: () => {
      const [D1, D2] = tire([[80, 40], [80, 50], [100, 50], [100, 65], [125, 65], [125, 80], [150, 80], [150, 100]]);
      const v1 = tire([0.5, 0.8, 1.0, 1.2, 1.5].filter(v => v * (D1 / D2) ** 2 <= 6));
      return { D1, D2, v1, P1: tire([2, 2.5, 3, 4]), L: tire([30, 50, 80]), th: tire([10, 15, 20]), Vr: tire([30, 60, 100]) };
    },
    build: (p, q) => {
      const tokens = {
        th: tok(`${p.th} °C`, 'Température de l’eau', p.th, '°C'),
        D1: tok(`${p.D1} mm`, 'Diamètre intérieur de la conduite amont', p.D1 / 1000, 'm'),
        L: tok(`${p.L} m`, 'Longueur de la conduite amont', p.L, 'm'),
        P1: tok(`${nb(p.P1, 1)} bar`, 'Pression de l’eau dans la conduite amont', p.P1 * 1e5, 'Pa'),
        v1: tok(`${nb(p.v1, 1)} m·s⁻¹`, 'Vitesse moyenne de l’eau dans la conduite amont', p.v1, 'm·s⁻¹'),
        D2: tok(`${p.D2} mm`, 'Diamètre intérieur de la conduite étroite', p.D2 / 1000, 'm'),
      };
      const debut = ['De l’eau, à ', T('th'), ', circule en régime permanent dans une conduite cylindrique pleine, de diamètre intérieur ', T('D1'), ' et de longueur ', T('L'), '. Sa pression y vaut ', T('P1'),
        ' et sa vitesse moyenne ', T('v1'), '. La conduite se raccorde ensuite, par un convergent, à une conduite plus étroite de diamètre intérieur ', T('D2'),
        '. L’eau est considérée comme incompressible et sa vitesse comme uniforme sur chaque section. '];
      const S1 = Math.PI * (p.D1 / 1000) ** 2 / 4, S2 = Math.PI * (p.D2 / 1000) ** 2 / 4, Q = p.v1 * S1;
      const rP = 'Pour un liquide incompressible en régime permanent, la conservation du débit ne fait pas intervenir la pression (celle-ci intervient dans le bilan d’énergie de Bernoulli).';
      const rL = 'La longueur de la conduite joue sur les pertes de charge, pas sur le lien entre débit, section et vitesse.';
      const rTh = 'La température n’intervient pas ici : l’eau est supposée incompressible, sa masse volumique est constante.';
      const dS1 = { id: 'S1', nom: 'Section S₁ de la conduite amont', expr: 'S₁ = frac(π·D₁²|4)', val: S1, u: 'm²' };
      const dS2 = { id: 'S2', nom: 'Section S₂ de la conduite étroite', expr: 'S₂ = frac(π·D₂²|4)', val: S2, u: 'm²' };
      if (q === 0) return { tokens, derivees: [dS1], texte: [...debut, 'Quel est le débit volumique de l’eau dans la conduite ?'], utiles: ['D1', 'v1'],
        raisons: { th: rTh, L: rL, P1: rP, D2: 'Le diamètre de la conduite plus étroite sert à calculer la vitesse dans cette partie, pas le débit, qui est le même dans toute la conduite.' },
        cherche: { bonne: 'Le débit volumique Q_V de l’eau (en m³·h⁻¹)', faux: ['La vitesse moyenne de l’eau dans la conduite étroite (en m·s⁻¹)', 'Le débit massique de l’eau (en kg·s⁻¹)', 'La section de la conduite amont (en m²)'] },
        manque: null, solution: { txt: 'Q_V = v₁ × S₁', val: Q * 3600, u: 'm³·h⁻¹' } };
      if (q === 1) return { tokens, derivees: [dS1, dS2], texte: [...debut, 'Quelle est la vitesse moyenne de l’eau dans la conduite étroite ?'], utiles: ['D1', 'v1', 'D2'],
        raisons: { th: rTh, L: rL, P1: rP },
        cherche: { bonne: 'La vitesse moyenne v₂ de l’eau dans la conduite étroite (en m·s⁻¹)', faux: ['Le débit volumique de l’eau dans la conduite étroite (en m³·h⁻¹)', 'La pression de l’eau dans la conduite étroite (en bar)', 'Le rapport S₁/S₂ des sections (sans unité)'] },
        manque: null, solution: { txt: 'Q_V = v₁·S₁ = v₂·S₂, donc v₂ = frac(v₁·S₁|S₂)', val: p.v1 * S1 / S2, u: 'm·s⁻¹' } };
      tokens.Vr = tok(`${p.Vr} m³`, 'Volume du bassin à remplir', p.Vr, 'm³');
      return { tokens, derivees: [dS1, { id: 'Q', nom: 'Débit volumique de l’eau', expr: 'Q_V = v₁ × S₁', val: Q, u: 'm³·s⁻¹' }],
        texte: [...debut, 'Toute cette eau est envoyée dans un bassin vide de volume ', T('Vr'), '. Quelle est la durée nécessaire pour le remplir ?'], utiles: ['D1', 'v1', 'Vr'],
        raisons: { th: rTh, L: rL, P1: rP, D2: 'Le diamètre de la conduite plus étroite n’intervient pas : le débit est le même dans les deux conduites, on le calcule avec la conduite dont on connaît la vitesse.' },
        cherche: { bonne: 'La durée de remplissage du bassin (en h)', faux: ['Le débit volumique de l’eau (en m³·h⁻¹)', 'La masse d’eau contenue dans le bassin plein (en kg)', 'La vitesse moyenne de l’eau dans la conduite étroite (en m·s⁻¹)'] },
        manque: null, solution: { txt: 't = frac(V_bassin|Q_V), avec Q_V = v₁ × S₁', val: p.Vr / Q / 3600, u: 'h' } };
    },
  },
  // ───────────────────────────── Transport des fluides : bilan d’énergie, puissance hydraulique et rendement d’une pompe
  {
    id: 'flu-pompe', domaine: 'Transport des fluides', titre: 'Une pompe qui alimente un château d’eau', noms: ['Pression à fournir par la pompe', 'Puissance hydraulique', 'Rendement du groupe motopompe'],
    schema: (p, b) => ({ type: 'pompeChateau', dz: b.tokens.dz.aff, L: b.tokens.L.aff, dp: b.tokens.dp.aff, Q: b.tokens.Q.aff }),
    gen: () => {
      const rho = 1000, g = 9.81, dz = tire([15, 20, 25, 30, 40]), dp = tire([0.5, 0.8, 1.0, 1.5, 2.0]), Q = tire([20, 30, 40, 60]), eta0 = tire([0.5, 0.55, 0.6, 0.65, 0.7, 0.75]);
      const Ph = (rho * g * dz + dp * 1e5) * (Q / 3600);
      return { rho, g, dz, dp, Q, Pel: Math.ceil(Ph / eta0 / 100) / 10, L: tire([50, 100, 200, 400]), th: tire([10, 15, 20]), Patm: tire([1005, 1013, 1020]) };
    },
    build: (p, q) => {
      const tokens = {
        rho: tok(`${nb(p.rho)} kg·m⁻³`, 'Masse volumique de l’eau', p.rho, 'kg·m⁻³'),
        th: tok(`${p.th} °C`, 'Température de l’eau', p.th, '°C'),
        dz: tok(`${p.dz} m`, 'Dénivelé entre les deux surfaces libres', p.dz, 'm'),
        Patm: tok(`${p.Patm} hPa`, 'Pression atmosphérique', p.Patm * 100, 'Pa'),
        L: tok(`${p.L} m`, 'Longueur de la conduite', p.L, 'm'),
        dp: tok(`${nb(p.dp, 1)} bar`, 'Perte de charge totale de la conduite (exprimée en pression)', p.dp * 1e5, 'Pa'),
        Q: tok(`${p.Q} m³·h⁻¹`, 'Débit volumique', p.Q / 3600, 'm³·s⁻¹'),
        Pel: tok(`${nb(p.Pel, 1)} kW`, 'Puissance électrique absorbée par le groupe motopompe', p.Pel * 1000, 'W'),
        g: tok(`${nb(p.g, 2)} N·kg⁻¹`, 'Intensité de la pesanteur', p.g, 'N·kg⁻¹'),
      };
      const debut = ['Une pompe aspire de l’eau (masse volumique ', T('rho'), ', température ', T('th'), ') dans un bassin et la refoule dans un château d’eau dont la surface libre est ', T('dz'),
        ' plus haut que celle du bassin.\n\nLes deux surfaces libres sont à l’air libre (pression atmosphérique ', T('Patm'), ') et l’eau y est pratiquement immobile.\n\nLes frottements dans la conduite, de longueur ', T('L'),
        ', provoquent une perte de charge totale de ', T('dp'), ' pour le débit de ', T('Q'), ' choisi.\n\nLe groupe motopompe absorbe une puissance électrique de ', T('Pel'), '. On prendra g = ', T('g'), '. '];
      const Pp = p.rho * p.g * p.dz + p.dp * 1e5, Ph = Pp * (p.Q / 3600);
      const rL = 'La longueur de la conduite explique l’origine des pertes de charge, mais celles-ci sont déjà données : elle n’intervient pas dans le calcul.';
      const rTh = 'La température n’intervient pas ici : seule compte la masse volumique de l’eau, qui est donnée.';
      const rPatm = 'Les deux surfaces libres sont à la même pression atmosphérique : elle s’élimine dans le bilan d’énergie entre les deux surfaces.';
      const dPp = { id: 'Pp', nom: 'Pression à fournir par la pompe', expr: 'frac(P_hyd|Q_V) = ρ·g·Δz + Δp_charges', val: Pp, u: 'Pa' };
      if (q === 0) return { tokens, derivees: [dPp], texte: [...debut, 'Quelle pression la pompe doit-elle apporter à l’eau, pour la monter jusqu’au château d’eau et compenser les frottements ?'], utiles: ['rho', 'g', 'dz', 'dp'],
        raisons: { th: rTh, Patm: rPatm, L: rL, Q: 'Le débit sert à calculer une puissance ; la perte de charge est déjà donnée pour ce débit.', Pel: 'La puissance électrique sert à calculer un rendement, pas la hauteur que doit fournir la pompe.' },
        cherche: { bonne: 'La pression que la pompe doit apporter à l’eau, frac(P_hyd|Q_V) (en Pa)', faux: ['La pression due à la seule hauteur de refoulement ρ·g·Δz, sans la perte de charge (en Pa)', 'La puissance hydraulique communiquée à l’eau (en W)', 'Le débit volumique de la pompe (en m³·h⁻¹)'] },
        manque: null, solution: { txt: 'frac(P_hyd|Q_V) = ρ·g·Δz + Δp_charges  (Bernoulli entre les deux surfaces libres, avec la pompe)', val: Pp, u: 'Pa' } };
      if (q === 1) return { tokens, derivees: [dPp], texte: [...debut, 'Quelle puissance hydraulique la pompe communique-t-elle à l’eau ?'], utiles: ['rho', 'g', 'dz', 'dp', 'Q'],
        raisons: { th: rTh, Patm: rPatm, L: rL, Pel: 'La puissance électrique absorbée sert à calculer le rendement ; la puissance communiquée à l’eau se calcule sans elle.' },
        cherche: { bonne: 'La puissance hydraulique P_hyd communiquée à l’eau (en W)', faux: ['La puissance électrique absorbée par le groupe (en W)', 'La pression que la pompe doit apporter à l’eau (en Pa)', 'L’énergie communiquée à l’eau en une heure (en kWh)'] },
        manque: null, solution: { txt: 'P_hyd = (ρ·g·Δz + Δp_charges) × Q_V', val: Ph, u: 'W' } };
      return { tokens, derivees: [dPp, { id: 'Ph', nom: 'Puissance hydraulique communiquée à l’eau', expr: 'P_hyd = frac(P_hyd|Q_V) × Q_V', val: Ph, u: 'W' }],
        texte: [...debut, 'Quel est le rendement global du groupe motopompe ?'], utiles: ['rho', 'g', 'dz', 'dp', 'Q', 'Pel'],
        raisons: { th: rTh, Patm: rPatm, L: rL },
        cherche: { bonne: 'Le rendement global η du groupe motopompe (en %)', faux: ['La puissance hydraulique communiquée à l’eau (en W)', 'La puissance perdue dans le groupe motopompe (en W)', 'La pression que la pompe doit apporter à l’eau (en Pa)'] },
        manque: null, solution: { txt: 'η = frac(P_hyd|P_él) × 100, avec P_hyd = (ρ·g·Δz + Δp_charges) × Q_V', val: Ph / (p.Pel * 1000) * 100, u: '%' } };
    },
  },
  // ───────────────────────────── Ondes (TSTL) : diffraction, interférences, réseaux
  {
    id: 'ondDiffraction', schema: () => ({ type: 'diffraction', obstacle: 'fente' }), domaine: 'Ondes', titre: 'Largeur d’une fente par diffraction', noms: ['Angle d’ouverture', 'Largeur de la fente'],
    gen: () => { const lam = tire([532, 633, 650]), a = tire([40, 50, 60, 80, 100]), D = tire([1.5, 2.0, 2.5, 3.0]); return { lam, a, D, L: Math.round(2 * lam * 1e-9 * D / (a * 1e-6) * 1e4) / 10, P: tire([1, 5]) }; },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P, 'mW'),
        D: tok(`${nb(p.D, 1)} m`, 'Distance entre la fente et l’écran', p.D, 'm'),
        L: tok(`${nb(p.L, 1)} mm`, 'Largeur de la tache centrale', p.L, 'mm'),
      };
      const theta = p.L * 1e-3 / (2 * p.D);
      const debut = ['Un laser de longueur d’onde ', T('lam'), ' et de puissance ', T('P'), ' éclaire une fente fine et verticale. Sur un écran placé à ', T('D'), ' de la fente, la tache centrale de diffraction, mesurée entre ses deux premières extinctions, a une largeur ', T('L'),
        '. Les angles sont petits : on prend tan θ ≈ θ, avec θ en radian ; l’angle d’ouverture θ est la demi-largeur angulaire de la tache centrale, vue depuis la fente, et on admet θ = λ / a pour une fente de largeur a. '];
      const rP = 'La puissance du laser change l’éclat de la figure, pas ses dimensions.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’angle d’ouverture θ de la figure ?'], utiles: ['L', 'D'],
        raisons: { lam: 'La longueur d’onde servira ensuite à relier θ à la largeur de la fente, mais elle n’intervient pas pour obtenir θ à partir de la géométrie.', P: rP },
        cherche: { bonne: 'L’angle d’ouverture θ de la figure (en rad)', faux: ['La largeur a de la fente (en µm)', 'La largeur L de la tache centrale (en mm)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'θ = frac(L|2D)', val: theta, u: 'rad' } };
      return { tokens, texte: [...debut, 'Quelle est la largeur a de la fente ?'], utiles: ['lam', 'L', 'D'],
        derivees: [{ id: 'theta', nom: 'Angle d’ouverture', expr: 'θ = frac(L|2D)', val: theta, u: 'rad' }],
        raisons: { P: rP },
        cherche: { bonne: 'La largeur a de la fente (en µm)', faux: ['L’angle d’ouverture θ de la figure (en rad)', 'La largeur L de la tache centrale (en mm)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'a = frac(λ|θ) = 2λD / L', val: p.lam * 1e-9 / theta * 1e6, u: 'µm' } };
    },
  },
  {
    id: 'ondYoung', domaine: 'Ondes', titre: 'Franges de Young : interfrange et distance entre les fentes', noms: ['Interfrange', 'Distance entre les fentes'],
    gen: () => {
      for (;;) {
        const lam = tire([532, 633, 650]), l = tire([200, 250, 300, 400, 500]), a = tire([30, 40, 50]), D = tire([1.5, 2.0, 2.5, 3.0]), N = tire([7, 9, 11]);
        if ((N - 1) / 2 > 0.6 * l / a) continue;                       // les franges comptées restent bien lumineuses, dans la tache centrale de diffraction
        const i = lam * 1e-9 * D / (l * 1e-6) * 1e3;                   // mm
        return { lam, l, a, D, N, X: Math.round((N - 1) * i * 10) / 10 };
      }
    },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        a: tok(`${p.a} µm`, 'Largeur de chaque fente', p.a, 'µm'),
        D: tok(`${nb(p.D, 1)} m`, 'Distance entre les fentes et l’écran', p.D, 'm'),
        N: tok(`${p.N} franges brillantes`, 'Nombre de franges brillantes comptées', p.N, ''),
        X: tok(`${nb(p.X, 1)} mm`, 'Distance entre le centre de la première et celui de la dernière frange comptée', p.X, 'mm'),
      };
      const i = p.X / (p.N - 1);
      const debut = ['Un laser de longueur d’onde ', T('lam'), ' éclaire deux fentes identiques, de largeur ', T('a'), ' chacune, séparées par une distance l. L’écran est à ', T('D'), ' des fentes. On compte ', T('N'), ' consécutives, régulièrement espacées (la lumière diffractée par chaque fente étale la figure, mais on n’en tient pas compte ici) ; la distance entre le centre de la première et celui de la dernière vaut ', T('X'), '. '];
      const rA = 'La largeur de chaque fente règle l’étendue de la zone éclairée (diffraction par chaque fente), pas l’écart entre deux franges voisines.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’interfrange i (distance entre deux franges brillantes consécutives) ?'], utiles: ['X', 'N'],
        raisons: { lam: 'La longueur d’onde permettrait de calculer l’interfrange si l était connue ; ici l’interfrange est mesurée directement sur l’écran.', a: rA, D: 'La distance fentes-écran ne sert pas à mesurer une distance déjà relevée sur l’écran.' },
        cherche: { bonne: 'L’interfrange i (en mm)', faux: ['La distance l entre les deux fentes (en µm)', 'La distance X divisée par le nombre N de franges (en mm)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'i = frac(X|N − 1) : N franges délimitent N − 1 interfranges', val: i, u: 'mm' } };
      return { tokens, texte: [...debut, 'Quelle est la distance l entre les deux fentes ?'], utiles: ['lam', 'D', 'X', 'N'],
        derivees: [{ id: 'i', nom: 'Interfrange', expr: 'i = frac(X|N − 1)', val: i, u: 'mm' }],
        raisons: { a: rA },
        cherche: { bonne: 'La distance l entre les deux fentes (en µm)', faux: ['L’interfrange i (en mm)', 'La largeur a de chaque fente (en µm)', 'La distance D entre les fentes et l’écran (en m)'] },
        manque: null, solution: { txt: 'l = frac(λ·D|i)', val: p.lam * 1e-9 * p.D / (i * 1e-3) * 1e6, u: 'µm' } };
    },
  },
  {
    id: 'ondReseau', domaine: 'Ondes', titre: 'Un réseau éclairé par un laser', noms: ['Angle de déviation de l’ordre 1', 'Pas du réseau', 'Longueur d’onde du laser'],
    gen: () => {
      const lam = tire([405, 532, 650]), n = tire([200, 250, 400, 500]), D = tire([1.0, 1.5]), a = 1e3 / n;           // a en µm
      const th = Math.asin(lam * 1e-3 / a);                                                                               // sin θ₁ = λ / a (λ en nm, a en µm : facteur 10⁻³)
      return { lam, n, D, a, x1: Math.round(D * Math.tan(th) * 1e3) / 10, P: tire([1, 5]) };                              // x₁ en cm, au mm près
    },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        n: tok(`${p.n} traits par mm`, 'Nombre de traits par millimètre du réseau', p.n, 'mm⁻¹'),
        D: tok(`${nb(p.D, 1)} m`, 'Distance entre le réseau et l’écran', p.D, 'm'),
        x1: tok(`${nb(p.x1, 1)} cm`, 'Distance entre la tache d’ordre 1 et la tache centrale', p.x1, 'cm'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P, 'mW'),
      };
      const th = Math.atan(p.x1 * 1e-2 / p.D), s1 = Math.sin(th);
      const rP = 'La puissance du laser change l’éclat des taches, pas leur position.';
      const entete = ['Un laser éclaire sous incidence normale un réseau, placé à ', T('D'), ' d’un écran. '];
      if (q === 0) return { tokens: { D: tokens.D, x1: tokens.x1, P: tokens.P }, derivees: [], texte: [...entete, 'Le laser a une puissance ', T('P'), '. La tache d’ordre 1 est à ', T('x1'), ' de la tache centrale (ordre 0). Quel est l’angle de déviation θ₁ de l’ordre 1 (en degré) ? '],
        utiles: ['x1', 'D'], raisons: { P: rP },
        cherche: { bonne: 'L’angle de déviation θ₁ de l’ordre 1 (en degré)', faux: ['Le pas a du réseau (en µm)', 'La distance x₁ entre les deux taches (en cm)', 'Le sinus de l’angle θ₁ (sans unité)'] },
        manque: null, solution: { txt: 'tan θ₁ = frac(x₁|D), donc θ₁ = arctan(frac(x₁|D))', val: th * 180 / Math.PI, u: '°' } };
      if (q === 1) return { tokens: { lam: tokens.lam, D: tokens.D, x1: tokens.x1, P: tokens.P }, texte: [...entete, 'Le laser a une longueur d’onde ', T('lam'), ' et une puissance ', T('P'), '. La tache d’ordre 1 est à ', T('x1'), ' de la tache centrale (ordre 0). Quel est le pas a du réseau, sachant que sin θ₁ = frac(λ|a) pour l’ordre 1 ? '],
        utiles: ['lam', 'x1', 'D'], derivees: [{ id: 'th', nom: 'Angle de déviation de l’ordre 1', expr: 'θ₁ = arctan(frac(x₁|D))', val: th * 180 / Math.PI, u: '°' }],
        raisons: { P: rP },
        cherche: { bonne: 'Le pas a du réseau (en µm)', faux: ['L’angle de déviation θ₁ de l’ordre 1 (en degré)', 'Le nombre de traits par millimètre du réseau (en mm⁻¹)', 'La longueur d’onde λ du laser (en nm)'] },
        manque: null, solution: { txt: 'a = λ / sin θ₁', val: p.lam * 1e-9 / s1 * 1e6, u: 'µm' } };
      return { tokens: { n: tokens.n, D: tokens.D, x1: tokens.x1, P: tokens.P }, texte: [...entete, 'Le réseau comporte ', T('n'), '. Le laser a une puissance ', T('P'), ' ; sa longueur d’onde est inconnue. La tache d’ordre 1 est à ', T('x1'), ' de la tache centrale (ordre 0). Quelle est la longueur d’onde λ du laser, sachant que sin θ₁ = frac(λ|a) pour l’ordre 1 ? '],
        utiles: ['n', 'x1', 'D'], derivees: [{ id: 'a', nom: 'Pas du réseau', expr: 'a = frac(1|n)', val: 1e3 / p.n, u: 'µm' }, { id: 'th', nom: 'Angle de déviation de l’ordre 1', expr: 'θ₁ = arctan(frac(x₁|D))', val: th * 180 / Math.PI, u: '°' }],
        raisons: { P: rP },
        cherche: { bonne: 'La longueur d’onde λ du laser (en nm)', faux: ['Le pas a du réseau (en µm)', 'L’angle de déviation θ₁ de l’ordre 1 (en degré)', 'La fréquence du laser (en Hz)'] },
        manque: null, solution: { txt: 'λ = a·sin θ₁', val: 1e3 / p.n * s1 * 1e3, u: 'nm' } };
    },
  },
  {
    id: 'ondEcho', domaine: 'Ondes', titre: 'Une sonde échographique', noms: ['Profondeur d’une interface', 'Retard d’un écho'],
    gen: () => ({ f: tire([3, 5, 7.5]), v: tire([1480, 1540, 1570]), d: tire([4, 6, 8, 10, 12]), P: tire([50, 100, 150]) }),
    build: (p, q) => {
      const dt = Math.round(2 * p.d * 1e-2 / p.v * 1e6);                 // retard de l’écho en µs, arrondi à la microseconde
      const tokens = {
        f: tok(`${nb(p.f, 1)} MHz`, 'Fréquence des ultrasons émis', p.f, 'MHz'),
        v: tok(`${nb(p.v, 0)} m/s`, 'Célérité des ultrasons dans les tissus mous', p.v, 'm·s⁻¹'),
        P: tok(`${p.P} W`, 'Puissance électrique de l’appareil', p.P, 'W'),
      };
      const raisons = { f: 'La fréquence fixe la finesse des détails visibles (la résolution), pas la durée du trajet de l’impulsion.', P: 'La puissance de l’appareil n’intervient pas dans le calcul d’une profondeur ou d’un retard.' };
      const debut = ['Une sonde échographique, utilisée à la fréquence ', T('f'), ', envoie une impulsion ultrasonore dans les tissus mous (appareil de puissance ', T('P'), '). La célérité des ultrasons y est ', T('v'), '. '];
      if (q === 0) {
        tokens.dt = tok(`${dt} µs`, 'Durée entre l’émission de l’impulsion et la réception de l’écho', dt, 'µs');
        return { tokens, derivees: [], texte: [...debut, 'Un écho est reçu ', T('dt'), ' après l’émission : il provient d’une interface entre deux organes. À quelle profondeur se trouve cette interface ?'],
          utiles: ['v', 'dt'], raisons,
          cherche: { bonne: 'La profondeur d de l’interface (en cm)', faux: ['Le trajet total aller-retour de l’impulsion (en cm)', 'La longueur d’onde des ultrasons (en mm)', 'La fréquence de l’écho reçu (en MHz)'] },
          manque: null, solution: { txt: 'd = v × Δt / 2 : l’impulsion fait un aller-retour', val: p.v * dt * 1e-6 / 2 * 100, u: 'cm' } };
      }
      tokens.d = tok(`${p.d} cm`, 'Profondeur de l’interface entre deux organes', p.d, 'cm');
      return { tokens, derivees: [], texte: [...debut, 'Une interface entre deux organes se trouve à ', T('d'), ' de la sonde. Quel retard présente l’écho de cette interface par rapport à l’émission ?'],
        utiles: ['v', 'd'], raisons,
        cherche: { bonne: 'Le retard Δt de l’écho (en µs)', faux: ['La profondeur de l’interface (en cm)', 'La période des ultrasons émis (en µs)', 'La vitesse de l’écho au retour (en m/s)'] },
        manque: null, solution: { txt: 'Δt = frac(2d|v) : l’impulsion fait un aller-retour', val: 2 * p.d * 1e-2 / p.v * 1e6, u: 'µs' } };
    },
  },
  {
    id: 'abTampon', domaine: 'Acides et bases', titre: 'Solution tampon : pH et concentration', noms: ['pH du tampon', 'Concentration en ion éthanoate'],
    gen: () => ({ m1: tire([1.50, 3.00, 6.00]), m2: tire([2.05, 4.10, 8.20, 12.30]), V: tire([100, 200, 250, 500]), pKa: 4.8, Mh: 60.05, Mn: 82.03, prix: tire([4, 6, 9]) }),
    build: (p, q) => {
      const tokens = {
        m1: tok(`${nb(p.m1, 2)} g`, 'Masse d’acide éthanoïque dissoute', p.m1, 'g'),
        m2: tok(`${nb(p.m2, 2)} g`, 'Masse d’éthanoate de sodium dissous', p.m2, 'g'),
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
        pKa: tok(`${nb(p.pKa, 1)}`, 'pKa du couple CH₃COOH / CH₃COO⁻', p.pKa, ''),
        Mh: tok(`${nb(p.Mh, 2)} g·mol⁻¹`, 'Masse molaire de l’acide éthanoïque', p.Mh, 'g/mol'),
        Mn: tok(`${nb(p.Mn, 2)} g·mol⁻¹`, 'Masse molaire de l’éthanoate de sodium', p.Mn, 'g/mol'),
        prix: tok(`${p.prix} € le kilogramme`, 'Prix de l’éthanoate de sodium', p.prix, '€/kg'),
      };
      const nAH = p.m1 / p.Mh, nA = p.m2 / p.Mn, ph = p.pKa + Math.log10(nA / nAH);
      const debut = ['On prépare une solution tampon en dissolvant ', T('m1'), ' d’acide éthanoïque et ', T('m2'), ' d’éthanoate de sodium dans de l’eau, pour obtenir un volume ', T('V'), ' de solution. Le pKa du couple acide éthanoïque / ion éthanoate vaut ', T('pKa'), ' à 25 °C. Les masses molaires sont : ', T('Mh'), ' pour l’acide éthanoïque et ', T('Mn'), ' pour l’éthanoate de sodium. Ce dernier coûte ', T('prix'), '. '];
      const rP = 'Le prix n’a aucune influence sur la grandeur cherchée.';
      if (q === 0) return { tokens, derivees: [
          { id: 'nAH', nom: 'Quantité d’acide éthanoïque', expr: 'n(AH) = frac(m₁|M(AH))', val: nAH, u: 'mol' },
          { id: 'nA', nom: 'Quantité d’ion éthanoate', expr: 'n(A⁻) = frac(m₂|M(A⁻))', val: nA, u: 'mol' }],
        texte: [...debut, 'Quel est le pH du tampon ?'], utiles: ['m1', 'm2', 'pKa', 'Mh', 'Mn'],
        raisons: { V: 'Le pH ne dépend que du rapport [A⁻] / [AH], égal à frac(n(A⁻)|n(AH)) : le volume se simplifie.', prix: rP },
        cherche: { bonne: 'Le pH du tampon', faux: ['La concentration en acide éthanoïque (en mol·L⁻¹)', 'La concentration en ion éthanoate (en mol·L⁻¹)', 'La quantité de matière totale (en mol)'] },
        manque: null, solution: { txt: 'pH = pKa + log(frac(n(A⁻)|n(AH)))', val: ph, u: '' } };
      return { tokens, texte: [...debut, 'Quelle est la concentration en ion éthanoate dans la solution ?'], utiles: ['m2', 'Mn', 'V'],
        derivees: [{ id: 'nA', nom: 'Quantité d’ion éthanoate', expr: 'n(A⁻) = frac(m₂|M(A⁻))', val: nA, u: 'mol' }],
        raisons: { m1: 'La masse d’acide éthanoïque sert à calculer [AH] et le pH, pas [A⁻].', pKa: 'Le pKa sert à calculer un pH, pas une concentration.', Mh: 'Cette masse molaire sert à calculer la quantité d’acide, qui n’intervient pas ici.', prix: rP },
        cherche: { bonne: 'La concentration en ion éthanoate (en mol·L⁻¹)', faux: ['La concentration en acide éthanoïque (en mol·L⁻¹)', 'Le pH du tampon', 'La quantité de matière d’ion éthanoate (en mol)'] },
        manque: null, solution: { txt: '[A⁻] = frac(n(A⁻)|V)', val: nA / (p.V * 1e-3), u: 'mol/L' } };
    },
  },
  {
    id: 'estRendement', domaine: 'Synthèse organique', titre: 'Estérification : réactif limitant et rendement', noms: ['Quantité d’ester obtenue', 'Rendement'],
    gen: () => {
      const Va = tire([10, 12, 15]), Vb = tire([15, 20, 25]), eta = tire([0.50, 0.55, 0.60, 0.65]);
      const na = Va * 1.05 / 60.05, nb_ = Vb * 0.80 / 60.10, nlim = Math.min(na, nb_);
      return { Va, Vb, m: Math.round(eta * nlim * 102.13 * 10) / 10, t: tire([60, 90, 120]) };
    },
    build: (p, q) => {
      const tokens = {
        Va: tok(`${p.Va} mL`, 'Volume d’acide éthanoïque', p.Va, 'mL'),
        Vb: tok(`${p.Vb} mL`, 'Volume de propan-1-ol', p.Vb, 'mL'),
        ra: tok('1,05 g·mL⁻¹', 'Masse volumique de l’acide éthanoïque', 1.05, 'g/mL'),
        rb: tok('0,80 g·mL⁻¹', 'Masse volumique du propan-1-ol', 0.80, 'g/mL'),
        Ma: tok('60,05 g·mol⁻¹', 'Masse molaire de l’acide éthanoïque', 60.05, 'g/mol'),
        Mb: tok('60,10 g·mol⁻¹', 'Masse molaire du propan-1-ol', 60.10, 'g/mol'),
        Me: tok('102,13 g·mol⁻¹', 'Masse molaire de l’éthanoate de propyle', 102.13, 'g/mol'),
        m: tok(`${nb(p.m, 1)} g`, 'Masse d’ester pur obtenue', p.m, 'g'),
        t: tok(`${p.t} minutes`, 'Durée du chauffage à reflux', p.t, 'min'),
      };
      const na = p.Va * 1.05 / 60.05, nb_ = p.Vb * 0.80 / 60.10, nlim = Math.min(na, nb_), ne = p.m / 102.13;
      const debut = ['On chauffe à reflux, pendant ', T('t'), ', ', T('Va'), ' d’acide éthanoïque (masse volumique ', T('ra'), ', masse molaire ', T('Ma'), ') avec ', T('Vb'), ' de propan-1-ol (masse volumique ', T('rb'), ', masse molaire ', T('Mb'), '), en présence d’acide sulfurique. Après lavage, séchage et distillation, on obtient ', T('m'), ' d’éthanoate de propyle pur (masse molaire ', T('Me'), '). L’équation est CH₃COOH + C₃H₇OH = CH₃COOC₃H₇ + H₂O. '];
      const rT = 'La durée du chauffage n’intervient pas dans un bilan de matière.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de matière d’ester a-t-on obtenue ?'], utiles: ['m', 'Me'],
        raisons: { Va: 'Les volumes de réactifs servent à calculer la quantité maximale d’ester, pas la quantité obtenue.', Vb: 'Les volumes de réactifs servent à calculer la quantité maximale d’ester, pas la quantité obtenue.', ra: 'Cette masse volumique sert à calculer la quantité d’acide, qui n’intervient pas ici.', rb: 'Cette masse volumique sert à calculer la quantité d’alcool, qui n’intervient pas ici.', Ma: 'Cette masse molaire sert à calculer la quantité d’acide, qui n’intervient pas ici.', Mb: 'Cette masse molaire sert à calculer la quantité d’alcool, qui n’intervient pas ici.', t: rT },
        cherche: { bonne: 'La quantité de matière d’ester obtenue (en mol)', faux: ['Le rendement de la synthèse (en %)', 'La quantité maximale d’ester (en mol)', 'La masse maximale d’ester (en g)'] },
        manque: null, solution: { txt: 'n(ester) = frac(m|M(ester))', val: ne, u: 'mol' } };
      return { tokens, texte: [...debut, 'Quel est le rendement de la synthèse ?'], utiles: ['Va', 'Vb', 'ra', 'rb', 'Ma', 'Mb', 'm', 'Me'],
        derivees: [
          { id: 'na', nom: 'Quantité d’acide', expr: 'n(acide) = frac(ρ·V|M)', val: na, u: 'mol' },
          { id: 'nb', nom: 'Quantité d’alcool', expr: 'n(alcool) = frac(ρ·V|M)', val: nb_, u: 'mol' },
          { id: 'ne', nom: 'Quantité d’ester obtenue', expr: 'n(ester) = frac(m|M)', val: ne, u: 'mol' }],
        raisons: { t: rT },
        cherche: { bonne: 'Le rendement de la synthèse (en %)', faux: ['La quantité d’ester obtenue (en mol)', 'La masse maximale d’ester (en g)', 'La constante d’équilibre K de la réaction'] },
        manque: null, solution: { txt: 'η = frac(n(ester obtenu)|n(réactif limitant))', val: ne / nlim * 100, u: '%' } };
    },
  },
  // ───────────────────────────── pH et concentration en ions oxonium (TG)
  {
    id: 'phc-ph-hcl', domaine: 'pH et concentration en ions oxonium', titre: 'Une solution d’acide chlorhydrique', noms: ['pH de la solution', 'Concentration en ions oxonium'],
    gen: () => ({ m: tire([1.5, 2.0, 2.5, 4.0, 5.0, 8.0]), n: tire([2, 3, 4]), pH: Math.round((1.2 + Math.random() * 4.3) * 100) / 100, V: tire([100, 250, 500]), prix: tire([8, 12, 15]) }),
    build: (p, q) => {
      const C = Number(`${p.m}e-${p.n}`), c0 = 1;
      const tokens = {
        V: tok(`${p.V} mL`, 'Volume de la solution', p.V, 'mL'),
        prix: tok(`${p.prix} €`, 'Prix du flacon d’acide', p.prix, '€'),
        c0: tok('1 mol/L', 'Concentration standard c°', c0, 'mol·L⁻¹'),
      };
      const raisons = { V: 'Le pH ne dépend que de la concentration en ions oxonium, pas du volume de solution.', prix: 'Le prix du flacon n’intervient pas dans le calcul.' };
      if (q === 0) {
        tokens.C = tok(`${nb(p.m, 1)} × 10${p.n === 2 ? '⁻²' : p.n === 3 ? '⁻³' : '⁻⁴'} mol/L`, 'Concentration en soluté apporté (acide fort : [H₃O⁺] = C)', C, 'mol·L⁻¹');
        return { tokens, derivees: [], texte: ['Un technicien prépare ', T('V'), ' d’une solution d’acide chlorhydrique (acide fort, totalement dissocié) de concentration en soluté apporté ', T('C'), ', à partir d’un flacon payé ', T('prix'), '. La concentration standard est ', T('c0'), '. Quel est le pH de la solution ?'],
          utiles: ['C', 'c0'], raisons,
          cherche: { bonne: 'Le pH de la solution', faux: ['La concentration en ions oxonium (en mol/L)', 'Le volume d’acide à prélever (en mL)', 'La quantité de matière de HCl (en mmol)'] },
          manque: null, solution: { txt: 'pH = −log([H₃O⁺] / c°) avec [H₃O⁺] = C', val: -Math.log10(C / c0), u: '' } };
      }
      tokens.pH = tok(nb(p.pH, 2), 'pH lu sur le pH-mètre', p.pH, '');
      return { tokens, derivees: [], texte: ['Un pH-mètre plongé dans ', T('V'), ' d’une solution d’acide chlorhydrique (flacon payé ', T('prix'), ') indique pH = ', T('pH'), '. La concentration standard est ', T('c0'), '. Quelle est la concentration en ions oxonium de la solution ?'],
        utiles: ['pH', 'c0'], raisons,
        cherche: { bonne: 'La concentration en ions oxonium [H₃O⁺] (en mol/L)', faux: ['Le pH de la solution', 'Le volume d’acide chlorhydrique (en mL)', 'La concentration en ions chlorure après dilution'] },
        manque: null, solution: { txt: '[H₃O⁺] = c° × 10^(−pH)', val: c0 * 10 ** -p.pH, u: 'mol/L' } };
    },
  },
  {
    id: 'phc-dilution-ph', domaine: 'pH et concentration en ions oxonium', titre: 'Dilution d’une solution d’acide chlorhydrique', noms: ['pH après dilution', 'Facteur de dilution'],
    gen: () => { const [V1, V2] = tire([[10.0, 100], [1.0, 100], [5.0, 500], [10.0, 1000], [1.0, 1000], [2.0, 200]]); const pHmax = Math.min(3.5, 6 - Math.log10(V2 / V1)); /* pH final ≤ 6 : au-delà, l’autoprotolyse de l’eau fausse pH = −log c */ return { pH0: Math.round((1.5 + Math.random() * (pHmax - 1.5)) * 100) / 100, V1, V2, duree: tire([2, 5, 10]), prix: tire([6, 9, 14]) }; },
    build: (p, q) => {
      const F = p.V2 / p.V1;
      const tokens = {
        V1: tok(`${nb(p.V1, 1)} mL`, 'Volume de solution prélevé à la pipette jaugée', p.V1, 'mL'),
        V2: tok(`${p.V2} mL`, 'Volume de la fiole jaugée', p.V2, 'mL'),
        duree: tok(`${p.duree} min`, 'Durée d’agitation de la fiole', p.duree, 'min'),
        prix: tok(`${p.prix} €`, 'Prix de la pipette', p.prix, '€'),
      };
      const debut = ['On prélève ', T('V1'), ' d’une solution d’acide chlorhydrique avec une pipette jaugée (', T('prix'), '), qu’on place dans une fiole jaugée de ', T('V2'), ' ; on complète avec de l’eau distillée puis on agite pendant ', T('duree'), '. '];
      const raisons = { duree: 'La durée d’agitation n’intervient pas dans le calcul du facteur de dilution ni du pH.', prix: 'Le prix du matériel n’intervient pas dans le calcul.' };
      if (q === 0) {
        tokens.pH0 = tok(nb(p.pH0, 2), 'pH de la solution avant dilution', p.pH0, '');
        return { tokens, derivees: [{ id: 'F', nom: 'Facteur de dilution F', expr: 'F = frac(V₂|V₁)', val: F, u: '' }], texte: [...debut, 'Avant la dilution, le pH de la solution vaut ', T('pH0'), '. Quel est le pH de la solution diluée ?'],
          utiles: ['pH0', 'V1', 'V2'], raisons,
          cherche: { bonne: 'Le pH de la solution diluée', faux: ['Le facteur de dilution F', 'La concentration en ions oxonium avant dilution (en mol/L)', 'Le volume d’eau ajouté (en mL)'] },
          manque: null, solution: { txt: 'pH final = pH initial + log F, avec F = frac(V₂|V₁)', val: p.pH0 + Math.log10(F), u: '' } };
      }
      tokens.pH0 = tok(nb(p.pH0, 2), 'pH de la solution avant dilution', p.pH0, '');
      return { tokens, derivees: [], texte: [...debut, 'Le pH de la solution avant dilution vaut ', T('pH0'), '. Quel est le facteur de dilution ?'],
        utiles: ['V1', 'V2'], raisons: { ...raisons, pH0: 'Le facteur de dilution ne dépend que des volumes prélevé et final, pas du pH.' },
        cherche: { bonne: 'Le facteur de dilution F (sans unité)', faux: ['Le pH de la solution diluée', 'La concentration finale en ions oxonium (en mol/L)', 'Le volume d’eau ajouté (en mL)'] },
        manque: null, solution: { txt: 'F = frac(V₂|V₁)', val: F, u: '' } };
    },
  },
  // ───────────────────────────── Plans d'expériences (BTS) : plan de mélange, rouge à lèvres
  {
    id: 'pmel-melange', domaine: 'Plans', titre: 'Un rouge à lèvres à trois corps gras', noms: ['Fraction de cire d’abeille', 'Écart au milieu du mélange AB'],
    gen: () => {
      const m = tire([[1.088, 0.704, 1.408], [1.2, 0.8, 1.0], [0.9, 1.1, 1.0], [1.5, 0.5, 1.0]]);
      const y = tire([[5, 2, 8], [5, 3, 7], [4, 2, 6]]);
      return { mA: m[0], mB: m[1], mC: m[2], T: tire([70, 80, 85]), yA: y[0], yB: y[1], yAB: y[2] };
    },
    build: (p, q) => {
      const tot = p.mA + p.mB + p.mC, xC = p.mC / tot, ecart = p.yAB - (p.yA + p.yB) / 2;
      const tokens = {
        mA: tok(`${nb(p.mA)} g`, 'Masse de cire de candelilla (A)', p.mA, 'g'),
        mB: tok(`${nb(p.mB)} g`, 'Masse d’huile de ricin (B)', p.mB, 'g'),
        mC: tok(`${nb(p.mC)} g`, 'Masse de cire d’abeille (C)', p.mC, 'g'),
        T: tok(`${p.T} °C`, 'Température de coulée', p.T, '°C'),
      };
      const debut = ['Pour un rouge à lèvres, on mélange ', T('mA'), ' de cire de candelilla (A), ', T('mB'), ' d’huile de ricin (B) et ', T('mC'), ' de cire d’abeille (C), coulés à ', T('T'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'tot', nom: 'Masse totale des corps gras', expr: 'm_A + m_B + m_C', val: tot, u: 'g' }],
        texte: [...debut, 'On veut décrire la composition par les fractions massiques. Quelle est la fraction de cire d’abeille ?'],
        utiles: ['mA', 'mB', 'mC'],
        raisons: { T: 'La température de coulée ne change pas la composition du mélange.' },
        cherche: { bonne: 'La fraction massique x_C de cire d’abeille (sans unité)', faux: ['La masse totale des corps gras (en g)', 'Le rapport frac(m_C|m_B) (sans unité)', 'La masse de cire d’abeille à ajouter (en g)'] },
        manque: null, solution: { txt: 'x_C = frac(m_C|m_A + m_B + m_C)', val: xC, u: '' } };
      tokens.yA = tok(`${p.yA}`, 'Note du jury pour A pur (sur 10)', p.yA, '');
      tokens.yB = tok(`${p.yB}`, 'Note du jury pour B pur (sur 10)', p.yB, '');
      tokens.yAB = tok(`${p.yAB}`, 'Note du jury pour le mélange à parts égales de A et B (sur 10)', p.yAB, '');
      return { tokens, derivees: [{ id: 'moy', nom: 'Moyenne des notes de A et B purs', expr: 'frac(y_A + y_B|2)', val: (p.yA + p.yB) / 2, u: '' }],
        texte: ['Le jury note les mélanges sur 10. La cire de candelilla seule (A) obtient ', T('yA'), ', l’huile de ricin seule (B) obtient ', T('yB'), ', et le mélange à parts égales de A et B obtient ', T('yAB'), '. La formule de référence utilise ', T('mA'), ' de A, ', T('mB'), ' de B et ', T('mC'), ' de C, coulés à ', T('T'), '. On cherche l’écart au milieu pour savoir si A et B interagissent.'],
        utiles: ['yA', 'yB', 'yAB'],
        raisons: { mA: 'Les masses de la formule de référence donnent sa composition ; l’écart au milieu n’utilise que les trois notes.', mB: 'Les masses de la formule de référence donnent sa composition ; l’écart au milieu n’utilise que les trois notes.', mC: 'Les masses de la formule de référence donnent sa composition ; l’écart au milieu n’utilise que les trois notes.', T: 'La température de coulée est la même pour tous les essais : elle n’intervient pas.' },
        cherche: { bonne: 'L’écart au milieu : note du mélange moins moyenne des notes des deux corps purs (en points)', faux: ['La moyenne des trois notes (en points)', 'La somme des notes de A et de B (en points)', 'Le rapport de la note du mélange à celle de A (sans unité)'] },
        manque: null, solution: { txt: 'écart = y_AB − frac(y_A + y_B|2)', val: ecart, u: '' } };
    },
  },
  // ───────────────────────────── Plans d'expériences (BTS) : plan factoriel 2^k, flan au chocolat
  {
    id: 'pfac-flan', schema: () => ({ type: 'planFlan' }), domaine: 'Plans', titre: 'Un plan factoriel sur un flan au chocolat', noms: ['Nombre d’essais du plan complet', 'Coefficient d’un facteur'],
    gen: () => {
      const c = tire([{ nom: 'la recette végétale (+1)', nomm: 'la recette animale (−1)', rep: 'la note moyenne du jury', mp: 2.375, mm: 6.25, d: 3 },
        { nom: 'la température de 102 °C (+1)', nomm: 'la température de 75 °C (−1)', rep: 'la viscosité moyenne', mp: 5309.5, mm: 1486.25, d: 2 }]);
      return { k: tire([3, 4]), c };
    },
    build: (p, q) => {
      const N = 2 ** p.k, a = (p.c.mp - p.c.mm) / 2;
      const tokens = {
        k: tok(`${p.k} facteurs`, 'Nombre de facteurs étudiés', p.k, ''),
        niv: tok('deux niveaux', 'Nombre de niveaux de chaque facteur', 2, ''),
        duree: tok('20 min', 'Durée de cuisson, identique pour tous les essais', 20, 'min'),
      };
      if (q === 0) return { tokens, derivees: [],
        texte: ['On étudie ', T('k'), ' sur un flan au chocolat. Chaque facteur est testé à ', T('niv'), ' (niveau bas −1, niveau haut +1) et la cuisson dure toujours ', T('duree'), '. On réalise toutes les combinaisons de niveaux. Combien d’essais comporte ce plan complet ?'],
        utiles: ['k', 'niv'],
        raisons: { duree: 'La durée de cuisson est fixée, elle ne change pas le nombre de combinaisons.' },
        cherche: { bonne: 'Le nombre d’essais du plan complet (sans unité)', faux: ['Le nombre de degrés de liberté du modèle (sans unité)', 'Le nombre d’interactions doubles (sans unité)', 'La durée totale de cuisson (en min)'] },
        manque: null, solution: { txt: 'N = 2^k (niveaux^facteurs)', val: N, u: '' } };
      tokens.mp = tok(`${nb(p.c.mp, p.c.d === 3 ? 3 : 1)}`, `Moyenne de ${p.c.rep} sur les 4 essais où le facteur est au niveau haut (+1)`, p.c.mp, '');
      tokens.mm = tok(`${nb(p.c.mm, p.c.d === 3 ? 2 : 2)}`, `Moyenne de ${p.c.rep} sur les 4 essais où le facteur est au niveau bas (−1)`, p.c.mm, '');
      return { tokens, derivees: [],
        texte: ['Dans le plan complet à ', T('k'), ' (', T('niv'), '), on regroupe les essais selon le niveau d’un facteur. ', T('mp'), ' est la moyenne de ' + p.c.rep + ' pour ' + p.c.nom + ', et ', T('mm'), ' la moyenne pour ' + p.c.nomm + '. La cuisson dure ', T('duree'), '. Quel est le coefficient de ce facteur dans le modèle ?'],
        utiles: ['mp', 'mm'],
        raisons: { k: 'Le nombre de facteurs ne sert pas : le coefficient se calcule à partir des deux moyennes.', niv: 'Le nombre de niveaux (2) est déjà pris en compte dans le codage −1 / +1.', duree: 'La durée de cuisson est identique pour tous les essais.' },
        cherche: { bonne: 'Le coefficient du facteur : demi-écart entre les deux moyennes', faux: ['L’effet total du facteur : écart entre les deux moyennes', 'La moyenne générale de tous les essais', 'Le nombre d’essais du plan'] },
        manque: null, solution: { txt: 'a = frac(Moy⁺ − Moy⁻|2)', val: a, u: '' } };
    },
  },
  // ───────────────────────────── Géométrie, électronégativité et polarité (1G)
  {
    id: 'geo1g-sapp-liaison', domaine: 'Géométrie et polarité des entités', titre: 'Polarité d’une liaison et d’une molécule', noms: ['Écart d’électronégativité de la liaison', 'Nombre de liaisons polarisées de la molécule'],
    gen: () => ({ l: tire([['H', 'Cl', 2.2, 3.0, 127, 432], ['N', 'H', 3.0, 2.2, 101, 391], ['O', 'H', 3.5, 2.2, 96, 463], ['C', 'H', 2.5, 2.2, 109, 413], ['C', 'Cl', 2.5, 3.0, 177, 339]]), m: tire([['eau', 'H₂O', 'O', 'H', 2, 3.5, 2.2, 18.0], ['ammoniac', 'NH₃', 'N', 'H', 3, 3.0, 2.2, 17.0], ['tétrachlorométhane', 'CCl₄', 'C', 'Cl', 4, 2.5, 3.0, 154], ['dioxyde de carbone', 'CO₂', 'C', 'O', 2, 2.5, 3.5, 44.0]]) }),
    build: (p, q) => {
      const [a, b, xa, xb, d, E] = p.l;
      const dchi = Math.round(Math.abs(xa - xb) * 10) / 10;
      const tokens = {
        xa: tok(`χ(${a}) = ${nb(xa, 1)}`, `Électronégativité de l’atome ${a} (échelle de Pauling)`, xa, ''),
        xb: tok(`χ(${b}) = ${nb(xb, 1)}`, `Électronégativité de l’atome ${b} (échelle de Pauling)`, xb, ''),
        d: tok(`${d} pm`, `Longueur de la liaison ${a}–${b}`, d, 'pm'),
        E: tok(`${E} kJ/mol`, `Énergie de la liaison ${a}–${b}`, E, 'kJ/mol'),
      };
      if (q === 0) return { tokens, derivees: [],
        texte: ['Dans une molécule, on étudie la liaison covalente ', a, '–', b, '. Sa longueur est ', T('d'), ' et son énergie ', T('E'), '. Les électronégativités sont ', T('xa'), ' et ', T('xb'), '. Quel est l’écart d’électronégativité Δχ de cette liaison ?'],
        utiles: ['xa', 'xb'], raisons: { d: 'La longueur d’une liaison ne dit rien sur le partage des électrons : seul l’écart de χ compte.', E: 'L’énergie d’une liaison mesure sa solidité, pas la polarité.' },
        cherche: { bonne: 'L’écart d’électronégativité Δχ de la liaison', faux: ['La longueur de la liaison (en pm)', 'L’énergie de la liaison (en kJ/mol)', 'Le nombre de liaisons polarisées de la molécule'] },
        manque: null, solution: { txt: 'Δχ = |χ(A) − χ(B)|, écart entre les deux électronégativités', val: dchi, u: '' } };
      const [nom, f, c, x, n, xc, xx, Mm] = p.m, lien = f === 'CO₂' ? '=' : '–';
      const t2 = {
        xc: tok(`χ(${c}) = ${nb(xc, 1)}`, `Électronégativité de l’atome ${c}`, xc, ''),
        xx: tok(`χ(${x}) = ${nb(xx, 1)}`, `Électronégativité de l’atome ${x}`, xx, ''),
        seuil: tok('0,4', 'Seuil de polarisation retenu en cours (convention : liaison non polarisée si Δχ ≤ 0,4)', 0.4, ''),
        n: tok(`${n} liaisons`, `Nombre de liaisons ${c}${lien}${x} de la molécule`, n, ''),
        M: tok(`${nb(Mm, 1)} g/mol`, 'Masse molaire de la molécule', Mm, 'g/mol'),
      };
      const dm = Math.round(Math.abs(xc - xx) * 10) / 10;
      const nPol = dm > 0.4 + 1e-9 ? n : 0;
      return { tokens: t2, derivees: [{ id: 'dm', nom: `Écart d’électronégativité Δχ de la liaison ${c}${lien}${x}`, expr: 'Δχ = |χ(A) − χ(B)|', val: dm, u: '' }],
        texte: ['La molécule de ', nom, ' ', f, ' possède ', T('n'), ' ', c, lien, x, ' (masse molaire ', T('M'), '). Les électronégativités sont ', T('xc'), ' et ', T('xx'), '. Par convention, une liaison est considérée comme non polarisée si Δχ ≤ ', T('seuil'), '. Combien de liaisons polarisées cette molécule possède-t-elle ?'],
        utiles: ['xc', 'xx', 'seuil', 'n'], raisons: { M: 'La masse molaire ne renseigne pas sur la polarité des liaisons.' },
        cherche: { bonne: 'Le nombre de liaisons polarisées de la molécule', faux: ['L’écart d’électronégativité Δχ de la liaison, sans conclure', 'La polarité de la molécule entière (polaire ou apolaire)', 'La masse molaire de la molécule (en g/mol)'] },
        manque: null, solution: { txt: nPol === 0 ? 'Δχ ≤ 0,4 : aucune liaison n’est polarisée' : 'Δχ > 0,4 : chacune des ' + n + ' liaisons est polarisée', val: nPol, u: 'liaisons' } };
    },
  },
  // ───────────────────────────── Oxydo-réduction (1G) : transfert d'électrons et équation de réaction
  {
    id: 'redox1g-equation', domaine: 'Oxydo-réduction : couples, demi-équations et équation de réaction', titre: 'Une transformation dont on veut l’équation de réaction', noms: ['Nombre d’électrons échangés dans l’équation', 'Coefficient de l’oxydant dans l’équation'],
    gen: () => ({ t: tire(RX.TRANSFORMATIONS.map(x => x.id)), c: tire([0.10, 0.20, 0.50]), V: tire([50, 100, 200]), Tb: tire([20, 25]), m: tire([2.0, 5.0, 10.0]) }),
    build: (p, q) => {
      const t = RX.TRANSFORMATIONS.find(x => x.id === p.t), r = RX.equationDe(t), [oxId, redId] = [RX.COUPLES[t.couple1][0], RX.COUPLES[t.couple2][1]];
      const tokens = {
        d1: tok(RX.demiTxt(r.d1), `Demi-équation du couple ${RX.coupleTxt(t.couple1)} (${r.n1} électron${r.n1 > 1 ? 's' : ''} échangé${r.n1 > 1 ? 's' : ''})`, r.n1, 'électrons'),
        d2: tok(RX.demiTxt(r.d2), `Demi-équation du couple ${RX.coupleTxt(t.couple2)} (${r.n2} électron${r.n2 > 1 ? 's' : ''} échangé${r.n2 > 1 ? 's' : ''})`, r.n2, 'électrons'),
        c: tok(`${nb(p.c, 2)} mol/L`, 'Concentration de la solution', p.c, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de solution', p.V, 'mL'),
        Tb: tok(`${p.Tb} °C`, 'Température de la salle', p.Tb, '°C'),
      };
      const raisons = { c: 'La concentration ne change ni les couples ni les nombres d’électrons : elle servirait à un calcul de quantité de matière, pas à écrire l’équation.', V: 'Le volume intervient dans un calcul de quantité de matière, pas dans l’écriture de l’équation de réaction.', Tb: 'La température de la salle ne modifie pas les demi-équations ni l’équation de réaction à ce niveau.' };
      const debut = ['On réalise la transformation suivante : ', t.obs, ' Le réducteur est ', RX.texte(redId), ' et l’oxydant est ', RX.texte(oxId), ' ; la solution a une concentration ', T('c'), ' et un volume de ', T('V'), ', dans une salle à ', T('Tb'), '. Les demi-équations de leurs couples sont ', T('d1'), ' et ', T('d2'), '. '];
      if (q === 0) return { tokens, derivees: ['les électrons captés par l’oxydant et cédés par le réducteur doivent être en même nombre : multiplier chaque demi-équation par un nombre entier'], texte: [...debut, 'Combien d’électrons sont échangés dans l’équation de réaction (plus petits coefficients entiers) ?'],
        utiles: ['d1', 'd2'], raisons,
        cherche: { bonne: 'Le nombre E d’électrons échangés dans l’équation', faux: ['La quantité de matière d’électrons cédés par le réducteur (en mol)', 'La charge électrique de l’ion oxydant (en unités e)', 'Le nombre d’atomes du réducteur dans sa formule brute'] },
        manque: null, solution: { txt: 'E = plus petit multiple commun de n₁ et n₂', val: r.E, u: 'électrons' } };
      return { tokens, derivees: [{ id: 'E', nom: 'Nombre E d’électrons échangés', expr: 'E = plus petit multiple commun de n₁ et n₂', val: r.E, u: 'électrons' }],
        texte: [...debut, 'Quel est le coefficient de l’oxydant dans l’équation de réaction (plus petits coefficients entiers) ?'],
        utiles: ['d1', 'd2'], raisons,
        cherche: { bonne: 'Le coefficient stœchiométrique de l’oxydant dans l’équation', faux: ['Le nombre d’électrons de sa demi-équation avant multiplication', 'La concentration de l’oxydant dans la solution (en mol/L)', 'La charge de l’oxydant en unités de charge élémentaire'] },
        manque: null, solution: { txt: 'coefficient = multiplicateur m₁ de la demi-équation × coefficient de l’oxydant dans cette demi-équation', val: r.reactifs.find(([id]) => id === oxId)?.[1] ?? r.m1 * r.d1.a, u: '' } };
    },
  },
  // ───────────────────────────── Mesure et incertitudes (1G) : incertitude-type d'une série et d'une mesure unique
  {
    id: 'mes1g-sapp-serie', domaine: 'Mesure et incertitudes (1G)', titre: 'Une durée de chute mesurée plusieurs fois', noms: ['Incertitude-type de type A de la moyenne', 'Incertitude-type de type B d’une mesure unique'],
    gen: () => ({ N: tire([4, 9, 16, 25, 36]), s: tire([0.06, 0.08, 0.12, 0.15]), a: tire([0.1, 0.2, 0.3]), h: tire([1.20, 1.50, 2.00]), th: tire([19, 21, 23]) }),
    build: epure((p, q) => {
      p = { ...p, xb: Math.round(Math.sqrt(2 * p.h / 9.81) * 100) / 100 };
      const tokens = {
        N: tok(`${p.N} mesures`, 'Nombre de mesures de la série', p.N, ''),
        s: tok(`${nb(p.s, 2)} s`, 'Écart-type expérimental de la série', p.s, 's'),
        xb: tok(`${nb(p.xb, 2)} s`, 'Durée moyenne de chute de la série', p.xb, 's'),
        h: tok(`${nb(p.h, 2)} m`, 'Hauteur de chute de la bille', p.h, 'm'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
        a: tok(`${nb(p.a, 1)} s`, 'Demi-largeur de l’intervalle donnée par la notice du chronomètre', p.a, 's'),
      };
      const raisons = { xb: 'La durée moyenne sert à écrire le résultat, pas à calculer l’incertitude-type.', h: 'La hauteur de chute ne change pas la façon d’évaluer l’incertitude-type.', th: 'La température de la salle n’intervient pas dans l’évaluation de l’incertitude-type.' };
      const debut = ['Un élève laisse tomber une bille d’une hauteur de ', T('h'), ' dans une salle à ', T('th'), '. Il chronomètre la chute à la main en faisant ', T('N'), ' dans les mêmes conditions : la durée moyenne est ', T('xb'), ' et l’écart-type expérimental de la série est ', T('s'), '. '];
      if (q === 0) return { tokens, derivees: ['sqrt(N) : racine carrée du nombre de mesures'],
        texte: [...debut, 'Quelle est l’incertitude-type de type A sur la durée moyenne ?'],
        utiles: ['s', 'N'], raisons: { ...raisons, a: 'Cette donnée sert à une évaluation de type B ; ici on dispose d’une série de mesures.' },
        cherche: { bonne: 'L’incertitude-type u de la moyenne, de type A (en s)', faux: ['La vitesse moyenne de la bille (en m/s)', 'L’incertitude de type B d’une mesure unique (en s)', 'La durée moyenne de chute (en s)'] },
        manque: null, solution: { txt: 'u = frac(s|sqrt(N))', val: p.s / Math.sqrt(p.N), u: 's' } };
      return { tokens, derivees: ['la demi-largeur est déjà donnée : aucun calcul préalable'],
        texte: ['Un autre élève ne chronomètre qu’une seule fois la chute d’une bille. La notice de son chronomètre, avec le temps de réaction de l’opérateur, indique une demi-largeur d’intervalle ', T('a'), '. La salle est à ', T('th'), ' ; l’élève a laissé tomber la bille de ', T('h'), '. Un premier élève, lui, avait obtenu avec 25 mesures un écart-type de ', T('s'), '. Quelle est l’incertitude-type de type B de la mesure unique ?'],
        utiles: ['a'], raisons: { ...raisons, s: 'Cet écart-type vient d’une autre série : il ne sert pas pour une mesure unique évaluée par les caractéristiques de l’instrument.' },
        cherche: { bonne: 'L’incertitude-type de type B de la mesure unique (en s)', faux: ['L’incertitude-type de type A de la moyenne (en s)', 'La hauteur de chute (en m)', 'La durée moyenne de chute (en s)'] },
        manque: null, solution: { txt: 'u = frac(a|sqrt(3)) (loi uniforme sur ± a)', val: p.a / Math.sqrt(3), u: 's' } };
    }),
  },
  {
    id: 'mes1g-sapp-instrument', schema: () => ({ type: 'eprouvette', liquide: 'liquide' }), domaine: 'Mesure et incertitudes (1G)', titre: 'Un volume lu sur une éprouvette graduée', noms: ['Incertitude-type de type B d’une lecture unique'],
    gen: () => ({ grad: tire([1, 2, 5]), V: tire([34, 46, 62, 78]), th: tire([19, 21, 23]), M: tire([20, 30]), mL: tire([0.5, 1.0]) }),
    build: epure((p, q) => {
      const a = p.grad / 2;
      const tokens = {
        grad: tok(`${p.grad} mL`, 'Écart entre deux graduations de l’éprouvette', p.grad, 'mL'),
        V: tok(`${p.V} mL`, 'Volume lu sur l’éprouvette', p.V, 'mL'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
        M: tok(`${p.M} g`, 'Masse d’eau pesée au préalable', p.M, 'g'),
      };
      return { tokens, derivees: ['a = graduation / 2 : demi-largeur de l’intervalle de lecture'],
        texte: ['Un élève lit une seule fois le volume d’eau dans une éprouvette graduée : le niveau est à ', T('V'), '. Deux graduations successives sont séparées de ', T('grad'), ' ; on admet que la valeur vraie est située dans l’intervalle d’une demi-graduation de part et d’autre de la lecture, avec la même probabilité en tout point (loi uniforme). La salle est à ', T('th'), ' et l’eau avait été pesée : ', T('M'), '. Quelle est l’incertitude-type de type B de cette lecture ?'],
        utiles: ['grad'], raisons: { V: 'Le volume lu donne la valeur mesurée, pas son incertitude-type.', th: 'La température de la salle n’intervient pas dans cette évaluation de type B.', M: 'La masse d’eau ne sert pas à évaluer l’incertitude-type de la lecture.' },
        cherche: { bonne: 'L’incertitude-type de type B de la lecture (en mL)', faux: ['L’incertitude-type de type A d’une série (en mL)', 'La masse volumique de l’eau (en g/mL)', 'Le volume lu (en mL)'] },
        manque: null, solution: { txt: 'u = frac(a|sqrt(3)) avec a = graduation / 2', val: a / Math.sqrt(3), u: 'mL' } };
    }),
  },
  // ───────────────────────────── Couleurs (1G) : radiations renvoyées ou absorbées par un objet
  {
    id: 'coul1g-sapp-objet', schema: () => ({ type: 'lampeFiltre', lampe: 'lampe colorée', filtre: 'objet', couleurLampe: '#fde047', couleurFiltre: '#a7f3d0' }), domaine: 'Couleurs : synthèses additive et soustractive, couleur des objets', titre: 'Un objet éclairé par une lampe colorée', noms: ['Nombre de radiations renvoyées par l’objet éclairé en lumière colorée', 'Nombre de radiations absorbées par l’objet en lumière blanche'],
    gen: () => ({ o: tire(CL.OBJETS.filter(o => !['papier', 'ardoise'].includes(o.id))), l: tire(CL.LUMIERES.filter(l => l.id !== 'blanche')), P: tire([20, 40, 60, 100]), d: tire([0.5, 1.0, 2.0]), t: tire([5, 10, 15]) }),
    build: epure((p, q) => {
      const nObj = CL.bandesPresentes(p.o.v).length, nLum = CL.bandesPresentes(p.l.v).length, communes = CL.bandesPresentes(CL.traverse(p.l.v, p.o.v)).length;
      const tokens = {
        o: tok(CL.nomCouleur(p.o.v), `Couleur de l’objet en lumière blanche (il diffuse ${nObj} radiation${nObj > 1 ? 's' : ''} sur les trois)`, nObj, 'radiations'),
        l: tok(CL.nomCouleur(p.l.v), `Couleur de la lampe (elle envoie ${nLum} radiation${nLum > 1 ? 's' : ''} sur les trois)`, nLum, 'radiations'),
        P: tok(`${p.P} W`, 'Puissance de la lampe', p.P, 'W'),
        d: tok(`${nb(p.d, 1)} m`, 'Distance entre la lampe et l’objet', p.d, 'm'),
        t: tok(`${p.t} min`, 'Durée de l’éclairage', p.t, 'min'),
      };
      const raisons = { P: 'La puissance règle l’intensité de la lumière, pas les radiations absorbées ou diffusées : elle ne change pas la couleur perçue dans ce modèle.', d: 'La distance ne change pas la nature des radiations reçues : elle n’intervient pas pour savoir lesquelles sont diffusées.', t: 'La durée de l’éclairage ne change pas les radiations absorbées ou diffusées par l’objet.', l: 'En lumière blanche, l’objet reçoit les trois radiations : la lampe colorée utilisée dans une autre expérience ne change pas ce qu’il absorbe.' };
      const debut = [`${cap(p.o.nom)} est de couleur `, T('o'), ' en lumière blanche. '];
      if (q === 0) return { tokens, derivees: [],
        texte: [...debut, 'On l’éclaire uniquement avec une lampe de couleur ', T('l'), ', de puissance ', T('P'), ', placée à ', T('d'), ' de l’objet pendant ', T('t'), ', dans une pièce sans autre lumière. Combien de radiations (rouge, vert, bleu) l’objet renvoie-t-il vers l’œil ?'],
        utiles: ['o', 'l'], raisons,
        cherche: { bonne: 'Le nombre de radiations communes à la lumière reçue et à celles que l’objet diffuse', faux: ['Le nombre de radiations que la lampe envoie', 'La puissance lumineuse totale renvoyée par l’objet (en W)', 'Le nombre de radiations que l’objet diffuse en lumière blanche'] },
        manque: null,
        solution: { txt: 'radiations renvoyées = radiations reçues qui sont aussi diffusées par l’objet', val: communes, u: 'radiations' } };
      return { tokens, derivees: [],
        texte: [...debut, 'Plus tard, on l’éclaire avec une lampe de couleur ', T('l'), ', de puissance ', T('P'), ', pendant ', T('t'), '. Combien de radiations (rouge, vert, bleu) l’objet absorbe-t-il quand on l’éclaire en lumière blanche ?'],
        utiles: ['o'], raisons: { ...raisons, l: 'La lampe colorée est utilisée plus tard : la question porte sur la lumière blanche, qui contient les trois radiations.' },
        cherche: { bonne: 'Le nombre de radiations absorbées en lumière blanche (3 moins celles qu’il diffuse)', faux: ['Le nombre de radiations que l’objet diffuse en lumière blanche', 'Le nombre de radiations que la lampe colorée envoie', 'La durée nécessaire pour absorber la lumière (en min)'] },
        manque: null,
        solution: { txt: 'radiations absorbées = 3 − radiations diffusées', val: 3 - nObj, u: 'radiations' } };
    }),
  },
  // ───────────────────────────── Combustions (1G) : énergie molaire de réaction et pouvoir calorifique
  {
    id: 'comb1g-sapp-combustion', schema: () => ({ type: 'bruleurBecher', contenu: 'eau' }), domaine: 'Combustions : énergie de réaction et énergies de liaison', titre: 'Un combustible à étudier', noms: ['Énergie molaire de réaction estimée', 'Pouvoir calorifique estimé'],
    gen: () => {
      const c = tire(CMB.COMBUSTIBLES);
      return { id: c.id, th: tire([15, 20, 25]), P: tire([1.0, 1.2]), m: tire([10, 25, 50]) };
    },
    build: epure((p, q) => {
      const c = CMB.combustible(p.id), M = CMB.masseMolaire(c), D = CMB.D_LIAISON;
      const tokens = {
        CH: tok(`${D.CH} kJ/mol`, 'Énergie de la liaison C–H', D.CH, 'kJ/mol'), CC: tok(`${D.CC} kJ/mol`, 'Énergie de la liaison C–C', D.CC, 'kJ/mol'),
        CO: tok(`${D.CO} kJ/mol`, 'Énergie de la liaison C–O', D.CO, 'kJ/mol'), OH: tok(`${D.OH} kJ/mol`, 'Énergie de la liaison O–H', D.OH, 'kJ/mol'),
        OO: tok(`${D.OO} kJ/mol`, 'Énergie de la liaison O=O', D.OO, 'kJ/mol'), CdO: tok(`${D.CdO} kJ/mol`, 'Énergie de la liaison C=O de CO₂', D.CdO, 'kJ/mol'),
        M: tok(`${nb(M, 1)} g/mol`, `Masse molaire du ${c.nom}`, M, 'g/mol'),
        th: tok(`${p.th} °C`, 'Température du local', p.th, '°C'), P: tok(`${nb(p.P, 2)} bar`, 'Pression dans le local', p.P, 'bar'), m: tok(`${p.m} g`, 'Masse de combustible dans le réservoir', p.m, 'g'),
      };
      const presentes = Object.keys({ ...CMB.liaisonsRompues(c), ...CMB.liaisonsFormees(c) });
      const raisons = { th: 'La température n’intervient pas dans l’estimation avec les énergies de liaison moyennes.', P: 'La pression n’intervient pas : on raisonne sur une mole de combustible, tous les corps gazeux.', m: 'La masse du réservoir ne sert pas pour une énergie par mole ou par kilogramme de combustible.' };
      ['CH', 'CC', 'CO', 'OH', 'OO', 'CdO'].filter(t => !presentes.includes(t)).forEach(t => { raisons[t] = `Aucune liaison ${CMB.NOM_LIAISON[t]} n’est rompue ni formée dans cette combustion : cette énergie ne sert pas.`; });
      const utilesLiaisons = presentes;
      const lis = L => Object.entries(L).map(([t, n]) => `${n} × ${CMB.NOM_LIAISON[t]}`).join(' + ');
      const debut = ['On étudie la combustion complète du ', c.nom, ' ', c.f, ' (', c.usage, ') ; hypothèse du modèle : tous les corps pris à l’état gazeux. Équation : ', CMB.equation(c), '. Données de liaison : C–H ', T('CH'), ' ; C–C ', T('CC'), ' ; C–O ', T('CO'), ' ; O–H ', T('OH'), ' ; O=O ', T('OO'), ' ; C=O ', T('CdO'), '. Le local est à ', T('th'), ', sous ', T('P'), ', et le réservoir contient ', T('m'), ' de combustible. Masse molaire : ', T('M'), '. '];
      const derivees = [{ id: 'R', nom: 'Énergie pour rompre les liaisons des réactifs', expr: `Σ D(rompues) = ${lis(CMB.liaisonsRompues(c))} (avec leurs D)`, val: CMB.energieRompue(c), u: 'kJ/mol' },
        { id: 'F', nom: 'Énergie libérée par la formation des liaisons des produits', expr: `Σ D(formées) = ${lis(CMB.liaisonsFormees(c))} (avec leurs D)`, val: CMB.energieFormee(c), u: 'kJ/mol' }];
      if (q === 0) return { tokens, derivees: derivees.slice(0, 2), texte: [...debut, 'Quelle est l’énergie molaire de réaction estimée E_r de cette combustion ?'],
        utiles: utilesLiaisons, raisons: { ...raisons, M: 'La masse molaire sert pour le pouvoir calorifique (énergie par kilogramme), pas pour l’énergie par mole de combustible.' },
        cherche: { bonne: 'L’énergie molaire de réaction E_r (en kJ/mol)', faux: ['L’énergie de liaison moyenne d’une liaison du combustible (en kJ/mol)', 'L’énergie libérée par la combustion de tout le réservoir (en kJ)', 'Le pouvoir calorifique du combustible (en MJ/kg)'] },
        manque: null, solution: { txt: 'E_r = Σ D(rompues) − Σ D(formées)', val: CMB.energieReaction(c), u: 'kJ/mol' } };
      return { tokens, derivees: [...derivees, { id: 'Er', nom: 'Énergie molaire de réaction estimée', expr: 'E_r = Σ D(rompues) − Σ D(formées)', val: CMB.energieReaction(c), u: 'kJ/mol' }],
        texte: [...debut, 'Quel est le pouvoir calorifique estimé de ce combustible ?'],
        utiles: [...utilesLiaisons, 'M'], raisons,
        cherche: { bonne: 'Le pouvoir calorifique PC (en MJ/kg)', faux: ['L’énergie molaire de réaction E_r (en kJ/mol)', 'La quantité de matière de combustible dans le réservoir (en mol)', 'L’énergie libérée par la combustion de tout le réservoir (en kJ)'] },
        manque: null, solution: { txt: 'PC = frac(∣E_r∣|M), avec E_r = Σ D(rompues) − Σ D(formées)', val: CMB.pouvoirCalorifique(c), u: 'MJ/kg' } };
    }),
  },
  // ───────────────────────────── Formules topologiques et isomérie de constitution (TG, sim 172)
  {
    id: 'top-sapp-formule', domaine: 'Formules topologiques et isomérie de constitution', titre: 'Formule brute d’une molécule à partir de son squelette', noms: ['Hydrogènes d’un composé avec une double liaison', 'Hydrogènes d’un alcool saturé'],
    // données liées par des couples plausibles (hex-1-ène, hept-1-ène… ; pentan-1-ol, hexan-1-ol…) : température d'ébullition (°C), masse volumique (g/mL)
    gen: () => { const n = tire([5, 6, 7, 8]); return { n, ene: { 5: [30, 0.64], 6: [63, 0.67], 7: [94, 0.70], 8: [121, 0.71] }[n], ol: { 5: [138, 0.81], 6: [157, 0.82], 7: [176, 0.82], 8: [195, 0.82] }[n] }; },
    build: (p, q) => {
      const [teb, rho] = q === 0 ? p.ene : p.ol, M = q === 0 ? 14 * p.n : 14 * p.n + 18;
      const tokens = {
        n: tok(`${p.n} atomes de carbone`, 'Nombre d’atomes de carbone de la molécule', p.n, ''),
        teb: tok(`${teb} °C`, 'Température d’ébullition de l’espèce', teb, '°C'),
        rho: tok(`${nb(rho, 2)} g/mL`, 'Masse volumique de l’espèce', rho, 'g/mL'),
        M: tok(`${M} g/mol`, 'Masse molaire de l’espèce', M, 'g/mol'),
      };
      const raisons = { teb: 'La température d’ébullition ne dit rien de l’enchaînement des atomes : elle ne sert pas à trouver le nombre d’hydrogènes.', rho: 'La masse volumique est une propriété du liquide, pas une donnée sur la structure de la molécule.', M: 'La masse molaire est une conséquence de la formule brute : ici on cherche justement cette formule, à partir du squelette, sans l’utiliser.' };
      const cherche = { bonne: 'Le nombre d’atomes d’hydrogène de la molécule', faux: ['La masse molaire de la molécule (en g/mol)', 'Le nombre de liaisons C–C de la molécule', 'La masse volumique de la molécule (en g/mL)'] };
      if (q === 0) return { tokens, derivees: [], texte: ['Un composé liquide, de température d’ébullition ', T('teb'), ', de masse volumique ', T('rho'), ' et de masse molaire ', T('M'), ', a une molécule formée d’une chaîne de ', T('n'), ' non cyclique, avec une seule double liaison C=C et rien d’autre (que des atomes de carbone et d’hydrogène). Combien d’atomes d’hydrogène la molécule compte-t-elle ?'],
        utiles: ['n'], raisons, cherche, manque: null, solution: { txt: 'chaîne saturée : 2n + 2 H ; une double liaison C=C retire 2 H, donc 2n H', val: 2 * p.n, u: 'atomes d’hydrogène' } };
      return { tokens, derivees: [], texte: ['Un alcool liquide, de température d’ébullition ', T('teb'), ', de masse volumique ', T('rho'), ' et de masse molaire ', T('M'), ', a une molécule formée d’une chaîne de ', T('n'), ' saturée, non cyclique, portant un seul groupe –OH. Combien d’atomes d’hydrogène la molécule compte-t-elle, en comptant celui du groupe –OH ?'],
        utiles: ['n'], raisons, cherche, manque: null, solution: { txt: 'le groupe –OH remplace un H de la chaîne saturée (2n + 2 H) et en apporte un : 2n + 2 H au total', val: 2 * p.n + 2, u: 'atomes d’hydrogène' } };
    },
  },
  // ───────────────────────────── Familles fonctionnelles et polymères (TG, sim 173) : masse molaire du motif, nombre de motifs d'une chaîne de PVC
  {
    id: 'pol-sapp-pvc', schema: () => ({ type: 'polymereTuyau' }), domaine: 'Familles fonctionnelles et polymères', titre: 'Une chaîne de PVC dans un tuyau', noms: ['Masse molaire du motif', 'Nombre de motifs d’une chaîne'],
    gen: () => ({ n: tire([800, 1000, 1600, 2000, 3200]), d: tire([32, 40, 50]), L: tire([1.0, 2.0, 3.0]), prix: tire([4, 6, 9]) }),
    build: (p, q) => {
      const M = p.n * 62.5;
      const tokens = {
        M: tok(`${nb(M)} g·mol⁻¹`, 'Masse molaire moyenne d’une chaîne de polymère', M, 'g·mol⁻¹'),
        mC: tok('12,0 g·mol⁻¹', 'Masse molaire atomique du carbone', 12.0, 'g·mol⁻¹'),
        mH: tok('1,0 g·mol⁻¹', 'Masse molaire atomique de l’hydrogène', 1.0, 'g·mol⁻¹'),
        mCl: tok('35,5 g·mol⁻¹', 'Masse molaire atomique du chlore', 35.5, 'g·mol⁻¹'),
        d: tok(`${p.d} mm`, 'Diamètre extérieur du tuyau', p.d, 'mm'),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du tuyau', p.L, 'm'),
        prix: tok(`${p.prix} €`, 'Prix du tuyau', p.prix, '€'),
      };
      const debut = ['Un tuyau de ', T('L'), ' de long et de ', T('d'), ' de diamètre, vendu ', T('prix'), ', est en poly(chlorure de vinyle) (PVC), de motif –CH₂–CHCl– (formule brute C₂H₃Cl). Une chaîne de polymère a une masse molaire moyenne de ', T('M'), '. On donne les masses molaires atomiques : C ', T('mC'), ', H ', T('mH'), ', Cl ', T('mCl'), '. '];
      const raisonsComm = { d: 'Le diamètre du tuyau n’a aucun lien avec la masse molaire d’un motif ou d’une chaîne.', L: 'La longueur du tuyau ne change pas la composition d’une chaîne.', prix: 'Le prix n’a aucun lien avec la chimie du polymère.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la masse molaire du motif ?'], utiles: ['mC', 'mH', 'mCl'],
        raisons: { ...raisonsComm, M: 'La masse molaire de la chaîne entière est celle de n motifs : elle ne sert pas à trouver celle d’un seul motif à partir de sa formule.' },
        cherche: { bonne: 'La masse molaire du motif C₂H₃Cl (g·mol⁻¹)', faux: ['Le nombre de motifs d’une chaîne (sans unité)', 'La masse d’un atome de carbone (en g)', 'La masse du tuyau (en kg)'] },
        manque: null, solution: { txt: 'M(motif) = 2 × M(C) + 3 × M(H) + M(Cl)', val: 62.5, u: 'g·mol⁻¹' } };
      return { tokens, derivees: [{ id: 'Mm', nom: 'Masse molaire du motif C₂H₃Cl', expr: 'M(motif) = 2 × M(C) + 3 × M(H) + M(Cl)', val: 62.5, u: 'g·mol⁻¹' }], texte: [...debut, 'Combien de motifs une chaîne contient-elle ?'], utiles: ['M', 'mC', 'mH', 'mCl'],
        raisons: raisonsComm,
        cherche: { bonne: 'Le nombre n de motifs d’une chaîne (sans unité)', faux: ['La masse molaire du motif (g·mol⁻¹)', 'Le nombre d’atomes de carbone dans tout le tuyau', 'La longueur d’une chaîne (en m)'] },
        manque: null, solution: { txt: 'n = frac(M(chaîne)|M(motif)), avec M(motif) = 2 × M(C) + 3 × M(H) + M(Cl)', val: p.n, u: '' } };
    },
  },
  // ───────────────────────────── Lumière (1G) : domaines spectraux et énergie d'un photon (sim 164) : fréquence et énergie d'un photon d'un laser
  {
    id: 'phot1g-sapp-photon', domaine: 'Domaines spectraux et énergie d’un photon', titre: 'Un laser et ses photons', noms: ['Fréquence de la lumière du laser', 'Énergie d’un photon du laser'],
    gen: () => ({ nm: tire([405, 450, 532, 590, 633, 650, 520]), P: tire([1.0, 2.0, 5.0]), d: tire([1.5, 2.0, 3.0]), t: tire([5, 10, 20]) }),
    build: epure((p, q) => {
      const lam = p.nm * 1e-9, nu = 3.00e8 / lam, E = 6.63e-34 * nu;
      const tokens = {
        lam: tok(`${p.nm} nm`, 'Longueur d’onde de la lumière dans le vide', lam, 'm'),
        c: tok('3,00 × 10⁸ m·s⁻¹', 'Célérité de la lumière dans le vide', 3.00e8, 'm·s⁻¹'),
        h: tok('6,63 × 10⁻³⁴ J·s', 'Constante de Planck', 6.63e-34, 'J·s'),
        P: tok(`${nb(p.P, 1)} mW`, 'Puissance du laser', p.P * 1e-3, 'W'),
        d: tok(`${nb(p.d, 1)} m`, 'Distance entre le laser et l’écran', p.d, 'm'),
        t: tok(`${p.t} s`, 'Durée pendant laquelle le laser reste allumé', p.t, 's'),
      };
      const raisons = { P: 'La puissance du laser change le nombre de photons émis chaque seconde, pas la fréquence ni l’énergie d’un photon.', d: 'Dans le vide, la longueur d’onde et la fréquence ne dépendent pas de la distance parcourue.', t: 'La durée d’allumage ne change ni la fréquence ni l’énergie d’un photon.' };
      const debut = ['Un laser émet dans le vide une lumière de longueur d’onde ', T('lam'), '. Sa puissance est ', T('P'), ' ; il éclaire un écran placé à ', T('d'), ' et reste allumé ', T('t'), '. On donne c = ', T('c'), ' et h = ', T('h'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la fréquence de cette lumière ?'], utiles: ['lam', 'c'],
        raisons: { ...raisons, h: 'La constante de Planck sert à calculer l’énergie d’un photon, pas la fréquence.' },
        cherche: { bonne: 'La fréquence ν de la lumière (en Hz)', faux: ['L’énergie d’un photon de cette lumière (en J)', 'La longueur d’onde de cette lumière dans l’eau (en m)', 'Le nombre de photons émis chaque seconde (en s⁻¹)'] },
        manque: null, solution: { txt: 'ν = frac(c|λ)', val: nu, u: 'Hz' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est l’énergie d’un photon de cette lumière ?'], utiles: ['lam', 'c', 'h'], raisons,
        cherche: { bonne: 'L’énergie E d’un photon de cette lumière (en J)', faux: ['La puissance transportée par le faisceau (en W)', 'La fréquence de cette lumière (en Hz)', 'Le nombre de photons émis chaque seconde (en s⁻¹)'] },
        manque: null, solution: { txt: 'E = h × ν = frac(h × c|λ)', val: E, u: 'J' } };
    }),
  },
  // ───────────────────────────── Fluide au repos : pression, force pressante et loi de Mariotte (1G)
  {
    id: 'fl1g-pression-sapp-piston', schema: () => ({ type: 'piston' }), domaine: 'Fluide au repos : pression et loi de Mariotte', titre: 'Un gaz qui pousse sur un piston', noms: ['Force pressante exercée par le gaz sur le piston', 'Pression du gaz enfermé'],
    gen: () => ({ P: tire([1.2, 1.5, 2.0, 2.5]), S: tire([2.0, 4.0, 5.0, 6.0, 8.0]), V: tire([20, 30, 40, 50]), th: tire([18, 20, 22]), m: tire([8, 12, 15]) }),
    build: epure((p, q) => {
      const F = p.P * p.S * 10;
      const tokens = {
        P: tok(`${nb(p.P, 1)} bar`, 'Pression du gaz', p.P * 1e5, 'Pa'),
        S: tok(`${nb(p.S, 1)} cm²`, 'Surface de la face du piston', p.S * 1e-4, 'm²'),
        V: tok(`${p.V} mL`, 'Volume de gaz enfermé', p.V * 1e-6, 'm³'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
        m: tok(`${p.m} g`, 'Masse du piston', p.m / 1000, 'kg'),
        F: tok(`${nb(F, 0)} N`, 'Norme de la force pressante exercée par le gaz sur le piston', F, 'N'),
      };
      const raisons = { V: 'Le volume du gaz ne sert pas à calculer la force pressante : celle-ci dépend de la pression et de la surface.', th: 'La température n’intervient pas ici : la pression du gaz est déjà donnée.', m: 'La masse du piston n’est pas la force pressante du gaz : elle ne sert pas à calculer F = P × S.' };
      if (q === 0) return { tokens, derivees: [],
        texte: ['Dans une seringue bouchée, un gaz de volume ', T('V'), ' est à la température ', T('th'), ' et à la pression ', T('P'), '. Le piston, de masse ', T('m'), ', a une face de surface ', T('S'), '. Quelle est la norme de la force pressante exercée par le gaz sur le piston ?'],
        utiles: ['P', 'S'], raisons,
        cherche: { bonne: 'La norme de la force pressante exercée par le gaz sur le piston (en N)', faux: ['La pression de l’air extérieur (en Pa)', 'Le poids du piston (en N)', 'Le volume du gaz après compression (en mL)'] },
        manque: null, solution: { txt: 'F = P × S, avec P en Pa et S en m²', val: F, u: 'N' } };
      return { tokens, derivees: [],
        texte: ['Le gaz d’une seringue (volume ', T('V'), ', salle à ', T('th'), ') exerce sur la face du piston, de surface ', T('S'), ', une force pressante de norme ', T('F'), '. Quelle est la pression du gaz ?'],
        utiles: ['F', 'S'], raisons: { V: raisons.V, th: 'La température n’intervient pas ici : on connaît directement la force et la surface.' },
        cherche: { bonne: 'La pression du gaz enfermé (en Pa)', faux: ['La surface du piston (en m²)', 'La force de l’air extérieur sur le piston (en N)', 'Le volume du gaz (en mL)'] },
        manque: null, solution: { txt: 'P = frac(F|S), avec F en N et S en m²', val: p.P * 1e5, u: 'Pa' } };
    }),
  },
  {
    id: 'fl1g-pression-sapp-mariotte', domaine: 'Fluide au repos : pression et loi de Mariotte', titre: 'Une seringue bouchée que l’on comprime', noms: ['Pression finale du gaz', 'Volume final du gaz'],
    gen: () => {
      for (let i = 0; i < 200; i++) {
        const P1 = tire([1.0, 1.5, 2.0, 2.5]), V1 = tire([60, 80, 100]), V2 = tire([20, 25, 40, 50]), P2 = P1 * V1 / V2;
        if (V2 < V1 && P2 <= 5 && Math.abs(Number(P2.toPrecision(3)) - P2) < 1e-9) return { P1, V1, V2, P2, S: tire([2.0, 4.0, 6.0]), dt: tire([2, 5, 10]), th: tire([20, 22]) };
      }
      return { P1: 1.5, V1: 60, V2: 25, P2: 3.6, S: 6.0, dt: 5, th: 20 };
    },
    build: epure((p, q) => {
      const tokens = {
        P1: tok(`${nb(p.P1, 1)} bar`, 'Pression initiale du gaz', p.P1, 'bar'),
        V1: tok(`${p.V1} mL`, 'Volume initial du gaz', p.V1, 'mL'),
        V2: tok(`${p.V2} mL`, 'Volume final du gaz', p.V2, 'mL'),
        P2: tok(`${nb(p.P2)} bar`, 'Pression finale du gaz', p.P2, 'bar'),
        S: tok(`${nb(p.S, 1)} cm²`, 'Surface de la face du piston', p.S, 'cm²'),
        dt: tok(`${p.dt} s`, 'Durée de la compression', p.dt, 's'),
        th: tok(`${p.th} °C`, 'Température du gaz, constante pendant l’expérience', p.th, '°C'),
      };
      const raisons = { S: 'La surface du piston ne sert pas dans la loi de Mariotte : elle relie la pression à la force, pas la pression au volume.', dt: 'La durée de la compression n’intervient pas : on compare l’état initial et l’état final, à température constante.', th: 'La température est constante : elle garantit que la loi de Mariotte s’applique, mais sa valeur ne sert pas au calcul.' };
      const debut = ['Une seringue bouchée contient du gaz à la température constante ', T('th'), ', à la pression ', T('P1'), ' pour un volume ', T('V1'), '. On pousse le piston pendant ', T('dt'), ' ; la face du piston a pour surface ', T('S'), '. '];
      if (q === 0) return { tokens, derivees: [],
        texte: [...debut, 'Le volume final est ', T('V2'), '. Quelle est la pression finale du gaz ?'],
        utiles: ['P1', 'V1', 'V2'], raisons,
        cherche: { bonne: 'La pression finale du gaz (en bar)', faux: ['La force pressante sur le piston (en N)', 'La quantité de matière de gaz (en mol)', 'Le volume final du gaz (en mL)'] },
        manque: null, solution: { txt: 'P₂ = frac(P₁ × V₁|V₂), à température et quantité de gaz constantes', val: p.P2, u: 'bar' } };
      return { tokens, derivees: [],
        texte: [...debut, 'On s’arrête quand la pression atteint ', T('P2'), '. Quel est alors le volume du gaz ?'],
        utiles: ['P1', 'V1', 'P2'], raisons,
        cherche: { bonne: 'Le volume final du gaz (en mL)', faux: ['La pression finale du gaz (en bar)', 'La force pressante sur le piston (en N)', 'La surface du piston (en m²)'] },
        manque: null, solution: { txt: 'V₂ = frac(P₁ × V₁|P₂), à température et quantité de gaz constantes', val: p.V2, u: 'mL' } };
    }),
  },
  // ───────────────────────────── Statique des fluides : pression et profondeur (1G)
  {
    id: 'fl1g-statique-sapp-piscine', domaine: 'Statique des fluides : pression et profondeur', titre: 'Un manomètre dans une piscine', noms: ['Pression absolue au fond', 'Profondeur du manomètre'],
    gen: () => {
      const h = tire([2.0, 2.5, 3.0, 3.5, 4.0, 5.0]), Patm = tire([1008, 1013, 1020]);
      const S = tire([20, 30, 50, 60]), D = h + tire([1.0, 1.5, 2.0]);   // profondeur de la piscine > profondeur du manomètre ; V = S × D
      return { h, Patm, P: Math.round((Patm * 100 + 1000 * 9.81 * h) / 100), V: Math.round(S * D), S, th: tire([20, 24, 26, 28]) };
    },
    build: epure((p, q) => {
      const tokens = {
        rho: tok('1,00 × 10³ kg·m⁻³', 'Masse volumique de l’eau', 1000, 'kg·m⁻³'),
        g: tok('9,81 N·kg⁻¹', 'Intensité de la pesanteur', 9.81, 'N·kg⁻¹'),
        Patm: tok(`${nb(p.Patm)} hPa`, 'Pression atmosphérique, qui règne à la surface de l’eau', p.Patm * 100, 'Pa'),
        h: tok(`${nb(p.h, 1)} m`, 'Profondeur du manomètre sous la surface', p.h, 'm'),
        P: tok(`${nb(p.P)} hPa`, 'Pression absolue indiquée par le manomètre', p.P * 100, 'Pa'),
        V: tok(`${p.V} m³`, 'Volume d’eau de la piscine', p.V, 'm³'),
        S: tok(`${p.S} m²`, 'Superficie de la surface de l’eau', p.S, 'm²'),
        th: tok(`${p.th} °C`, 'Température de l’eau', p.th, '°C'),
      };
      const raisons = {
        V: 'La pression à une profondeur donnée ne dépend pas de la quantité d’eau de la piscine, mais seulement de la profondeur.',
        S: 'La pression à une profondeur donnée ne dépend pas de la superficie de la piscine ni de la forme du récipient.',
        th: 'Dans ce modèle, la masse volumique de l’eau est supposée constante : la température ne change pas le calcul.',
      };
      if (q === 0) return { tokens, derivees: [],
        texte: ['Une piscine d’eau douce, de masse volumique ', T('rho'), ', contient un volume ', T('V'), ' d’eau à ', T('th'), ' ; la surface de l’eau mesure ', T('S'), '. Un manomètre est posé à ', T('h'), ' sous la surface. À la surface, la pression est ', T('Patm'), ' et l’intensité de la pesanteur vaut ', T('g'), '. Quelle pression absolue le manomètre indique-t-il ?'],
        utiles: ['rho', 'g', 'h', 'Patm'], raisons,
        cherche: { bonne: 'La pression absolue P au niveau du manomètre (en hPa)', faux: ['La force pressante sur le fond de la piscine (en N)', 'La masse d’eau de la piscine (en kg)', 'La profondeur de la piscine (en m)'] },
        manque: null, solution: { txt: 'P = P_atm + ρ·g·h', val: p.Patm * 100 + 1000 * 9.81 * p.h, u: 'Pa' } };
      return { tokens, derivees: [],
        texte: ['Une piscine d’eau douce, de masse volumique ', T('rho'), ', contient un volume ', T('V'), ' d’eau à ', T('th'), ' ; la surface de l’eau mesure ', T('S'), '. Un manomètre posé sous la surface indique la pression absolue ', T('P'), '. À la surface, la pression est ', T('Patm'), ' et l’intensité de la pesanteur vaut ', T('g'), '. À quelle profondeur se trouve-t-il ?'],
        utiles: ['rho', 'g', 'P', 'Patm'], raisons,
        cherche: { bonne: 'La profondeur h du manomètre (en m)', faux: ['La pression relative en surface (en hPa)', 'Le volume d’eau situé au-dessus du manomètre (en m³)', 'La masse volumique de l’eau (en kg·m⁻³)'] },
        manque: null, solution: { txt: 'h = frac(P − P_atm|ρ·g)', val: (p.P - p.Patm) * 100 / (1000 * 9.81), u: 'm' } };
    }),
  },
  // ───────────────────────────── Satellites et lois de Kepler (TG, sim 177) : période et vitesse d'un satellite en orbite circulaire
  {
    id: 'kep-sapp-satellite', domaine: 'Satellites et lois de Kepler', titre: 'Un satellite d’observation en orbite autour de la Terre', noms: ['Période de révolution du satellite', 'Vitesse du satellite'],
    gen: () => ({ h: tire([400, 600, 800, 1200]), m: tire([800, 1500, 2500]), P: tire([2.0, 3.5, 5.0]) }),
    build: (p, q) => {
      const esp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'), r = 6.37e6 + p.h * 1e3, Tmin = Math.round(KEP.periode(5.97e24, r) / 60), vq = 2 * Math.PI * r / (Tmin * 60) / 1000;
      const tokens = {
        h: tok(`${esp(p.h)}\u00a0km`, 'Altitude du satellite au-dessus de la surface de la Terre', p.h, 'km'),
        R: tok('6,37 × 10³ km', 'Rayon de la Terre', 6370, 'km'),
        M: tok('5,97 × 10²⁴ kg', 'Masse de la Terre', 5.97e24, 'kg'),
        G: tok('6,67 × 10⁻¹¹ N·m²·kg⁻²', 'Constante de gravitation', 6.67e-11, 'N·m²·kg⁻²'),
        m: tok(`${esp(p.m)}\u00a0kg`, 'Masse du satellite', p.m, 'kg'),
        P: tok(`${nb(p.P, 1)} kW`, 'Puissance électrique des panneaux solaires', p.P, 'kW'),
        ...(q === 1 ? { T: tok(`${Tmin} min`, 'Période de révolution du satellite', Tmin, 'min') } : {}),
      };
      const debut = ['Un satellite d’observation de masse ', T('m'), ' décrit une orbite circulaire à l’altitude ', T('h'), ' autour de la Terre ; ses panneaux solaires fournissent ', T('P'), '. On donne le rayon de la Terre ', T('R'), ', sa masse ', T('M'), ' et la constante de gravitation ', T('G'), '. '];
      const raisonsComm = { P: 'La puissance électrique des panneaux n’a aucun rapport avec le mouvement orbital du satellite.', m: 'La masse du satellite se simplifie dans la deuxième loi de Newton : la période et la vitesse n’en dépendent pas.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la période de révolution du satellite ?'], utiles: ['h', 'R', 'M', 'G'], raisons: raisonsComm,
        cherche: { bonne: 'La période de révolution T du satellite (en min)', faux: ['La force F exercée par la Terre sur le satellite (en N)', 'L’accélération a du satellite, en m/s²', 'L’énergie fournie par les panneaux en un tour (en kWh)'] },
        manque: null, solution: { txt: 'T² = frac(4π² r³|G M), avec r = R + h (distance au centre de la Terre)', val: KEP.periode(5.97e24, r) / 60, u: 'min' } };
      return { tokens, derivees: [], texte: [...debut, 'La période de révolution du satellite est ', T('T'), '. Quelle est la valeur de sa vitesse ?'], utiles: ['h', 'R', 'T'], raisons: { ...raisonsComm, M: 'La période est donnée : la vitesse se calcule avec la longueur d’un tour et la durée d’un tour, sans connaître la masse de la Terre.', G: 'La période est donnée : v = frac(2π r|T), sans la constante de gravitation.' },
        cherche: { bonne: 'La valeur v de la vitesse du satellite (en km/s)', faux: ['La distance r du satellite au centre de la Terre (en km)', 'La période T du satellite, exprimée en heures', 'La puissance reçue du Soleil par les panneaux (en kW)'] },
        manque: null, solution: { txt: 'v = frac(2π r|T), avec r = R + h (distance au centre de la Terre)', val: vq, u: 'km/s' } };
    },
  },
  // ───────────────────────────── Niveaux d'énergie (1G) : absorption d'un photon par un atome fictif (sim 165) : écart d'énergie et longueur d'onde
  {
    id: 'niv1g-sapp-transition', schema: () => ({ type: 'niveaux' }), domaine: 'Niveaux d’énergie : absorption, émission et spectres de raies', titre: 'Un atome qui absorbe un photon', noms: ['Énergie du photon absorbé', 'Longueur d’onde du photon absorbé'],
    gen: () => ({ Ei: tire([-9.0, -7.5, -6.0]), g: tire([1.8, 2.4, 3.0]), P: tire([5, 10, 20]), U: tire([1.2, 1.5, 2.0]), t: tire([10, 20, 30]) }),
    build: epure((p, q) => {
      const d1 = x => (x < 0 ? '−' : '') + Math.abs(x).toFixed(1).replace('.', ',');
      const Ef = Math.round((p.Ei + p.g) * 10) / 10, dE = Ef - p.Ei, lam = 6.63e-34 * 3.00e8 / (dE * 1.60e-19);
      const tokens = {
        Ei: tok(`${d1(p.Ei)} eV`, 'Énergie du niveau de départ E_i', p.Ei, 'eV'),
        Ef: tok(`${d1(Ef)} eV`, 'Énergie du niveau d’arrivée E_f', Ef, 'eV'),
        h: tok('6,63 × 10⁻³⁴ J·s', 'Constante de Planck', 6.63e-34, 'J·s'),
        c: tok('3,00 × 10⁸ m·s⁻¹', 'Célérité de la lumière dans le vide', 3.00e8, 'm·s⁻¹'),
        ev: tok('1 eV = 1,60 × 10⁻¹⁹ J', 'Conversion de l’électronvolt en joule', 1.60e-19, 'J/eV'),
        P: tok(`${p.P} Pa`, 'Pression du gaz', p.P, 'Pa'),
        U: tok(`${nb(p.U, 1)} kV`, 'Tension appliquée au tube', p.U * 1000, 'V'),
        t: tok(`${p.t} min`, 'Durée de fonctionnement du tube', p.t * 60, 's'),
      };
      const raisons = { P: 'Le gaz est supposé à basse pression : les atomes sont isolés et la pression ne change pas l’écart entre deux niveaux.', U: 'La tension sert à exciter le gaz ; elle ne change pas les niveaux d’énergie de l’atome ni l’énergie du photon.', t: 'La durée de fonctionnement ne change ni les niveaux de l’atome ni l’énergie du photon.' };
      const debut = ['Un tube contient un gaz d’atomes fictifs sous une pression ', T('P'), ', soumis à une tension ', T('U'), ' pendant ', T('t'), '. Un atome passe du niveau d’énergie ', T('Ei'), ' au niveau ', T('Ef'), ' en absorbant un photon. On donne h = ', T('h'), ', c = ', T('c'), ' et ', T('ev'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est l’énergie de ce photon ?'], utiles: ['Ei', 'Ef'],
        raisons: { ...raisons, h: 'La constante de Planck servirait à relier l’énergie à la fréquence ou à la longueur d’onde, pas à l’écart d’énergie lui-même.', c: 'La célérité servirait à calculer une longueur d’onde, pas l’énergie du photon.', ev: 'La conversion en joules n’est utile que si l’on veut l’énergie en J ou calculer une longueur d’onde.' },
        cherche: { bonne: 'L’écart d’énergie ΔE entre les deux niveaux (en eV)', faux: ['La fréquence du photon (en Hz)', 'L’énergie de l’atome après absorption (en eV)', 'La longueur d’onde du photon (en nm)'] },
        manque: null, solution: { txt: 'ΔE = |E_f − E_i|', val: dE, u: 'eV' } };
      return { tokens, derivees: ['écart d’énergie : ΔE = |E_f − E_i|', 'conversion : ΔE en joules (× 1,60 × 10⁻¹⁹)'], texte: [...debut, 'Quelle est la longueur d’onde de ce photon dans le vide ?'], utiles: ['Ei', 'Ef', 'h', 'c', 'ev'], raisons,
        cherche: { bonne: 'La longueur d’onde λ du photon (en m ou en nm)', faux: ['L’énergie du photon (en eV)', 'La fréquence ν du photon (en Hz)', 'L’énergie du niveau d’arrivée (en eV)'] },
        manque: null, solution: { txt: 'λ = frac(h × c|ΔE), avec ΔE = |E_f − E_i| en joules', val: lam, u: 'm' } };
    }),
  },
  // ───────────────────────────── Quantité de matière (2GT) : compter les entités et la mole
  {
    id: 'mol2gt-balance', schema: () => ({ type: 'balance', objet: 'sac de petits objets', lot: true }), domaine: 'Quantité de matière (2GT)', titre: 'Un sac de petits objets à compter', noms: ['Nombre d’objets dans le sac', 'Nombre de paquets d’objets'],
    gen: () => ({ o: tire(['lentille', 'riz', 'perle', 'coquillette']), N: tire([1000, 2000, 4000, 5000, 8000]), paquet: tire([100, 250, 500, 1000]), prix: tire([2.5, 3.2, 4.5]) }),
    build: (p, q) => {
      const o = QM2.objet(p.o), totG = Math.round(p.N * o.m * 1e6) / 1e6, aff = totG >= 1000 ? `${nb(totG / 1000)} kg` : `${nb(totG)} g`;
      const tokens = {
        mTot: tok(aff, 'Masse totale du sac', totG, 'g'),
        mObj: tok(`${nb(o.m)} g`, `Masse d’${o.art === 'un' ? 'un' : 'une'} ${o.nom}`, o.m, 'g'),
        prix: tok(`${nb(p.prix, 2)} €`, 'Prix du sac', p.prix, '€'),
        paquet: tok(`${p.paquet} ${o.pluriel}`, 'Nombre d’objets dans un paquet', p.paquet, 'objets'),
      };
      const raisons = { prix: 'Le prix du sac ne dit rien sur le nombre d’objets qu’il contient.' };
      const debut = ['Un sac contient des ', o.pluriel, '. Il pèse ', T('mTot'), ' et ', o.art === 'un' ? 'un ' : 'une ', o.nom, ' pèse ', T('mObj'), '. Le sac est vendu ', T('prix'), '. '];
      const derivees = totG >= 1000 ? ['masse du sac en grammes : m (kg) × 1000'] : [];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Combien d’objets le sac contient-il ?'],
        utiles: ['mTot', 'mObj'], raisons,
        cherche: { bonne: 'Le nombre N d’objets dans le sac', faux: ['La masse totale du sac, en kg', 'La masse d’un seul objet, en g', 'Le prix d’un seul objet, en €'] },
        manque: null, solution: { txt: 'N = frac(m|m_entité), les deux masses étant dans la même unité (ici des grammes)', val: p.N, u: 'objets' } };
      return { tokens, derivees: [...derivees, { id: 'N', nom: 'Nombre d’objets dans le sac', expr: 'N = frac(m|m_entité)', val: p.N, u: 'objets' }],
        texte: [...debut, 'On range les objets du sac en paquets de ', T('paquet'), '. Combien de paquets obtient-on ?'],
        utiles: ['mTot', 'mObj', 'paquet'], raisons,
        cherche: { bonne: 'Le nombre de paquets obtenus', faux: ['Le nombre d’objets dans le sac', 'La masse d’un paquet, en g', 'Le prix d’un paquet, en €'] },
        manque: null, solution: { txt: 'nombre de paquets = frac(N|nombre d’objets par paquet), avec N = frac(m|m_entité)', val: p.N / p.paquet, u: 'paquets' } };
    },
  },
  {
    id: 'mol2gt-echantillon', domaine: 'Quantité de matière (2GT)', titre: 'Un échantillon d’atomes ou de molécules', noms: ['Nombre d’entités dans l’échantillon', 'Quantité de matière de l’échantillon'],
    gen: () => ({ e: tire(['al', 'cu', 'fe', 'h2o', 'co2']), m: tire([0.50, 1.0, 2.0, 5.0, 10]), th: tire([15, 20, 25]), V: tire([50, 100, 250]) }),
    build: (p, q) => {
      const e = QM2.entite(p.e), mEnt = QM2.masseEntite(e), N = p.m / 1000 / mEnt, n = N / QM2.NA, art = e.type === 'atome' ? 'un' : 'une';
      const tokens = {
        m: tok(`${nb(p.m, 2)} g`, 'Masse de l’échantillon', p.m / 1000, 'kg'),
        mEnt: tok(QM2.sci(mEnt, 3) + ' kg', `Masse d’${art} ${e.nom}`, mEnt, 'kg'),
        th: tok(`${p.th} °C`, 'Température de la pièce', p.th, '°C'),
        V: tok(`${p.V} mL`, 'Volume du flacon qui contient l’échantillon', p.V, 'mL'),
      };
      const raisons = { th: 'La température de la pièce ne change ni la masse ni le nombre d’entités.', V: 'Le volume du flacon ne sert pas à compter les entités à partir de la masse.' };
      const debut = ['Un échantillon pur pèse ', T('m'), ' ; chaque entité est ', art, ' ', e.nom, ' (', QM2.formuleTexte(e), '), de masse ', T('mEnt'), '. La pièce est à ', T('th'), ' et l’échantillon est dans un flacon de ', T('V'), '. '];
      const derivees = ['masse en kilogrammes : m (g) × 10⁻³'];
      if (q === 0) return { tokens, derivees, texte: [...debut, 'Combien d’entités l’échantillon contient-il ?'],
        utiles: ['m', 'mEnt'], raisons,
        cherche: { bonne: 'Le nombre N d’entités dans l’échantillon', faux: ['La quantité de matière n de l’échantillon (en mol)', 'La masse d’une seule entité (en kg)', 'Le volume occupé par une entité (en mL)'] },
        manque: null, solution: { txt: 'N = frac(m|m_entité), avec m en kg', val: N, u: 'entités' } };
      tokens.NA = tok('6,02 × 10²³ mol⁻¹', 'Constante d’Avogadro', QM2.NA, 'mol⁻¹');
      return { tokens, derivees: [...derivees, { id: 'N', nom: 'Nombre d’entités', expr: 'N = frac(m|m_entité)', val: N, u: 'entités' }],
        texte: [...debut, 'On donne la constante d’Avogadro ', T('NA'), '. Quelle est la quantité de matière de l’échantillon ?'],
        utiles: ['m', 'mEnt', 'NA'], raisons,
        cherche: { bonne: 'La quantité de matière n de l’échantillon (en mol)', faux: ['Le nombre N d’entités, sans passer par n', 'La masse d’une mole de cette entité (en g)', 'La masse de l’échantillon, en kg'] },
        manque: null, solution: { txt: 'n = frac(N|N_A), avec N = frac(m|m_entité)', val: n, u: 'mol' } };
    },
  },
  // ───────────────────────────── Signal sonore (2GT) : période et fréquence
  {
    id: 'son2gt-per-sapp-note', domaine: 'Signal sonore : période et fréquence (2GT)', titre: 'Une note enregistrée avec un micro', noms: ['Période T du son', 'Fréquence f du son'],
    gen: () => ({ n: tire([4, 5, 8, 10]), T: tire([0.5, 1, 2, 2.5, 4, 5]), A: tire([0.4, 0.6, 0.8]), prix: tire([15, 25, 40]) }),
    build: (p, q) => {
      const dt = Math.round(p.n * p.T * 1e6) / 1e6, Tp = p.T;
      const tokens = {
        dt: tok(`${nb(dt)} ms`, 'Durée des motifs comptés', dt, 'ms'),
        n: tok(`${p.n} motifs`, 'Nombre de motifs complets comptés', p.n, 'motifs'),
        A: tok(`${nb(p.A, 1)} V`, 'Amplitude du signal', p.A, 'V'),
        prix: tok(`${p.prix} €`, 'Prix du micro', p.prix, '€'),
      };
      const raisons = { A: 'L’amplitude donne la force du son, pas sa période ni sa fréquence.', prix: 'Le prix du micro ne dit rien sur le signal enregistré.' };
      const debut = ['Un micro enregistre une note de musique tenue ; son oscillogramme est périodique. Sur l’écran, ', T('n'), ' durent ', T('dt'), '. L’amplitude du signal est ', T('A'), ' et le micro a coûté ', T('prix'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la période du son ?'], utiles: ['dt', 'n'], raisons,
        cherche: { bonne: 'La période T du son (durée d’un motif)', faux: ['La fréquence f du son (en Hz)', 'La durée totale de l’enregistrement', 'L’amplitude du signal (en V)'] },
        manque: null, solution: { txt: 'T = frac(Δt|N) : durée des motifs comptés divisée par leur nombre', val: Tp, u: 'ms' } };
      return { tokens, derivees: [{ id: 'T', nom: 'Période du son', expr: 'T = frac(Δt|N)', val: Tp, u: 'ms' }, 'période en secondes : frac(T (ms)|1 000)'],
        texte: [...debut, 'Quelle est la fréquence du son ?'], utiles: ['dt', 'n'], raisons,
        cherche: { bonne: 'La fréquence f du son (en Hz)', faux: ['La période T du son (en ms)', 'L’amplitude du signal (en V)', 'Le nombre de motifs par minute'] },
        manque: null, solution: { txt: 'f = frac(1|T), avec T = frac(Δt|N) en secondes', val: SS2.frequenceHz(Tp), u: 'Hz' } };
    },
  },
  {
    id: 'son2gt-per-sapp-ecran', domaine: 'Signal sonore : période et fréquence (2GT)', titre: 'Lire l’écran d’un oscilloscope', noms: ['Période T du signal', 'Fréquence f du signal'],
    gen: () => ({ base: tire([0.2, 0.5, 1, 2, 5]), k: tire([2, 4, 5]), sens: tire([0.5, 1, 2]), h: tire([2, 3]) }),
    build: (p, q) => {
      const Tp = Math.round(p.base * p.k * 1e6) / 1e6;
      const tokens = {
        base: tok(`${nb(p.base)} ms par carreau`, 'Durée d’un carreau (base de temps)', p.base, 'ms'),
        k: tok(`${p.k} carreaux`, 'Nombre de carreaux occupés par un motif', p.k, 'carreaux'),
        sens: tok(`${nb(p.sens)} V par carreau`, 'Sensibilité verticale', p.sens, 'V'),
        h: tok(`${p.h} carreaux`, 'Hauteur du sommet au-dessus de la ligne du milieu', p.h, 'carreaux'),
      };
      const raisons = { sens: 'La sensibilité verticale sert à lire une tension, pas une durée.', h: 'La hauteur du signal donne son amplitude, pas sa période.' };
      const debut = ['Sur l’écran d’un oscilloscope, la base de temps est réglée sur ', T('base'), '. Un motif du signal occupe ', T('k'), ' en largeur. La sensibilité verticale est ', T('sens'), ' et les sommets montent à ', T('h'), ' au-dessus de la ligne du milieu. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la période du signal ?'], utiles: ['base', 'k'], raisons,
        cherche: { bonne: 'La période T du signal (en ms)', faux: ['La fréquence f du signal (en Hz)', 'L’amplitude du signal (en V)', 'Le nombre de motifs à l’écran'] },
        manque: null, solution: { txt: 'T = nombre de carreaux d’un motif × durée d’un carreau', val: Tp, u: 'ms' } };
      return { tokens, derivees: [{ id: 'T', nom: 'Période du signal', expr: 'T = carreaux × durée d’un carreau', val: Tp, u: 'ms' }, 'période en secondes : frac(T (ms)|1 000)'],
        texte: [...debut, 'Quelle est la fréquence du signal ?'], utiles: ['base', 'k'], raisons,
        cherche: { bonne: 'La fréquence f du signal (en Hz)', faux: ['La période T du signal (en ms)', 'L’amplitude du signal (en V)', 'La durée de tout l’écran'] },
        manque: null, solution: { txt: 'f = frac(1|T), avec T en secondes', val: SS2.frequenceHz(Tp), u: 'Hz' } };
    },
  },
  // ───────────────────────────── Équation de réaction (2GT, sim 179) : lire les coefficients, repérer les données utiles
  {
    id: 'eq2gt-sapp-metal', domaine: 'Équation de réaction (2GT)', titre: 'Un métal dans l’acide chlorhydrique', noms: ['Ions H⁺ consommés', 'Molécules H₂ formées'],
    gen: () => { const m = tire(['zinc', 'fer', 'magnesium', 'aluminium']), c = EQM.coefsAjustes(EQM.reaction(m)); return { m, N: c[0] * tire([2, 3, 4, 5]), th: tire([18, 20, 22]), V: tire([50, 100, 200]) }; },
    build: epure((p, q) => {
      const r = EQM.reaction(p.m), c = EQM.coefsAjustes(r), met = EQM.ESPECES[r.reactifs[0]], k = p.N / c[0];
      const voy = /^[aeiouyéèh]/i.test(met.nom), de = voy ? `d’${met.nom}` : `de ${met.nom}`, du = voy ? `de l’${met.nom}` : `du ${met.nom}`;
      const tokens = {
        N: tok(`${p.N} atomes`, `Nombre d’atomes ${de} qui réagissent`, p.N, ''),
        th: tok(`${p.th} °C`, 'Température de la solution', p.th, '°C'),
        V: tok(`${p.V} mL`, 'Volume d’acide chlorhydrique', p.V / 1000, 'L'),
      };
      const raisons = { th: 'La température ne change pas les proportions entre les atomes, molécules et ions : elle ne sert pas à lire l’équation.', V: 'Le volume de solution ne donne pas le nombre de particules qui réagissent : on le lit sur l’équation et sur le nombre d’atomes de métal.' };
      const debut = [`On plonge ${du} (${met.f}) dans de l’acide chlorhydrique de volume `, T('V'), ', à ', T('th'), '. L’équation de réaction est : ', EQM.equationAttendue(r), '. ', T('N'), ` ${de} réagissent, et l’on suppose que tout le métal est consommé. `];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien d’ions H⁺ sont consommés ?'], utiles: ['N'], raisons,
        cherche: { bonne: 'Le nombre d’ions H⁺ consommés', faux: ['Le nombre d’atomes de métal qui réagissent', 'La charge électrique totale de la solution (en coulombs)', 'Le volume de gaz formé (en mL)'] },
        manque: null, solution: { txt: `l’équation donne ${c[1]} H⁺ pour ${c[0]} ${met.f} : on multiplie par ${k}`, val: c[1] * k, u: 'ions H⁺' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de molécules de dihydrogène H₂ se forment ?'], utiles: ['N'], raisons,
        cherche: { bonne: 'Le nombre de molécules de dihydrogène H₂ formées', faux: ['Le nombre d’ions H⁺ consommés', 'Le nombre d’atomes de métal qui réagissent', 'La masse de dihydrogène formée (en g)'] },
        manque: null, solution: { txt: `l’équation donne ${c[3]} H₂ pour ${c[0]} ${met.f} : on multiplie par ${k}`, val: c[3] * k, u: 'molécules H₂' } };
    }),
  },
  {
    id: 'eq2gt-sapp-methane', domaine: 'Équation de réaction (2GT)', titre: 'Brûler du méthane dans une cuisine', noms: ['Molécules O₂ consommées', 'Molécules CO₂ formées'],
    gen: () => ({ N: tire([3, 4, 5, 6, 7]), th: tire([18, 20, 22]) }),
    build: epure((p, q) => {
      const r = EQM.reaction('methane'), c = EQM.coefsAjustes(r);
      const tokens = {
        N: tok(`${p.N} molécules`, 'Nombre de molécules de méthane qui brûlent', p.N, ''),
        th: tok(`${p.th} °C`, 'Température de la cuisine', p.th, '°C'),
      };
      const raisons = { th: 'La température de la cuisine ne dit rien sur les proportions de la réaction.' };
      const debut = ['Dans une cuisine à ', T('th'), ', ', T('N'), ' de méthane CH₄ brûlent complètement. Équation de réaction : ', EQM.equationAttendue(r), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de molécules de dioxygène O₂ sont consommées ?'], utiles: ['N'], raisons,
        cherche: { bonne: 'Le nombre de molécules de dioxygène consommées', faux: ['Le nombre de molécules de méthane qui brûlent', 'Le volume de dioxygène de la pièce (en m³)', 'Le nombre de molécules d’eau formées'] },
        manque: null, solution: { txt: 'l’équation donne 2 O₂ pour 1 CH₄ : on multiplie par le nombre de molécules de méthane', val: c[1] * p.N, u: 'molécules O₂' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de molécules de dioxyde de carbone CO₂ se forment ?'], utiles: ['N'], raisons,
        cherche: { bonne: 'Le nombre de molécules de dioxyde de carbone formées', faux: ['Le nombre de molécules de dioxygène consommées', 'La masse de dioxyde de carbone formée (en g)', 'Le nombre de molécules d’eau formées'] },
        manque: null, solution: { txt: 'l’équation donne 1 CO₂ pour 1 CH₄ : même nombre', val: c[2] * p.N, u: 'molécules CO₂' } };
    }),
  },
  {
    id: 'eq2gt-sapp-dba', domaine: 'Équation de réaction (2GT)', titre: 'Fabriquer un solide jaune en TP', noms: ['Molécules de benzaldéhyde consommées', 'Molécules d’eau formées'],
    // Situation inspirée d’une activité de synthèse : énoncés réécrits ; 2 C₇H₆O + C₃H₆O → C₁₇H₁₄O + 2 H₂O
    gen: () => ({ N: tire([2, 3, 4, 5, 6]), th: tire([20, 25, 30]), t: tire([15, 20, 30]), V: tire([5, 10, 20]) }),
    build: epure((p, q) => {
      const r = EQM.reaction('dba'), c = EQM.coefsAjustes(r);
      const tokens = {
        N: tok(`${p.N} molécules`, 'Nombre de molécules de propanone qui réagissent', p.N, ''),
        th: tok(`${p.th} °C`, 'Température du mélange', p.th, '°C'),
        t: tok(`${p.t} min`, 'Durée d’agitation', p.t * 60, 's'),
        V: tok(`${p.V} mL`, 'Volume de solution de soude ajoutée', p.V / 1000, 'L'),
      };
      const raisons = { th: 'La température du mélange ne change pas les proportions de l’équation.', t: 'La durée d’agitation ne donne pas le nombre de molécules qui réagissent.', V: 'La soude aide la réaction mais n’est pas consommée : on ne l’écrit pas dans l’équation et son volume ne sert pas.' };
      const debut = ['En TP, on prépare un solide jaune, la dibenzalacétone, à partir de benzaldéhyde (C₇H₆O) et de propanone (C₃H₆O), avec ', T('V'), ' de soude, à ', T('th'), ', en agitant ', T('t'), '. Équation de réaction : ', EQM.equationAttendue(r), '. ', T('N'), ' de propanone réagissent, avec tout le benzaldéhyde nécessaire. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de molécules de benzaldéhyde C₇H₆O sont consommées ?'], utiles: ['N'], raisons,
        cherche: { bonne: 'Le nombre de molécules de benzaldéhyde consommées', faux: ['Le nombre de molécules de propanone qui réagissent', 'La masse de benzaldéhyde consommée (en g)', 'Le nombre de molécules d’eau formées'] },
        manque: null, solution: { txt: 'l’équation donne 2 C₇H₆O pour 1 C₃H₆O : on multiplie par le nombre de molécules de propanone', val: c[0] * p.N, u: 'molécules C₇H₆O' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de molécules d’eau H₂O se forment ?'], utiles: ['N'], raisons,
        cherche: { bonne: 'Le nombre de molécules d’eau formées', faux: ['Le nombre de molécules de dibenzalacétone formées', 'Le volume d’eau formé (en mL)', 'Le nombre de molécules de benzaldéhyde consommées'] },
        manque: null, solution: { txt: 'l’équation donne 2 H₂O pour 1 C₃H₆O : on multiplie par le nombre de molécules de propanone', val: c[3] * p.N, u: 'molécules H₂O' } };
    }),
  },
  // ───────────────────────────── Synthèse et reflux (2GT, sim 204) : lire un protocole de synthèse (volumes, capacité du ballon, durées)
  {
    id: 'syn2gt-sapp-ballon', domaine: 'Synthèse et reflux (2GT)', titre: 'Choisir le ballon pour la synthèse de l’arôme de banane', noms: ['Volume du mélange réactionnel', 'Capacité minimale du ballon'],
    gen: () => ({ Va: tire([10, 12, 15, 20]), Vb: tire([8, 10, 12, 15]), t: tire([30, 45, 60, 90]), T: tire([90, 100, 110]), ng: tire([3, 4, 5]) }),
    build: epure((p, q) => {
      const tokens = {
        Va: tok(`${p.Va}\u00a0mL`, 'Volume d’alcool isoamylique du protocole', p.Va, 'mL'),
        Vb: tok(`${p.Vb}\u00a0mL`, 'Volume d’acide éthanoïque du protocole', p.Vb, 'mL'),
        r: tok('la moitié', 'Fraction maximale du ballon occupée par le liquide', 0.5, ''),
        t: tok(`${p.t}\u00a0min`, 'Durée du chauffage à reflux', p.t, 'min'),
        T: tok(`${p.T}\u00a0°C`, 'Température du chauffe-ballon', p.T, '°C'),
        ng: tok(`${p.ng} grains`, 'Nombre de grains de pierre ponce', p.ng, ''),
      };
      const raisons = { t: 'La durée du chauffage ne change ni le volume du mélange ni la capacité du ballon.', T: 'La température du chauffe-ballon n’intervient pas dans le choix du ballon.', ng: 'Quelques grains de pierre ponce ont un volume négligeable : ils ne changent pas le choix du ballon.', r: 'La règle sur la moitié du ballon sert au choix de la capacité, pas au volume du mélange.' };
      const debut = ['Un protocole de synthèse de l’arôme de banane indique : introduire ', T('Va'), ' d’alcool isoamylique et ', T('Vb'), ' d’acide éthanoïque dans le ballon, ajouter ', T('ng'), ' de pierre ponce et quelques gouttes de catalyseur (volume négligeable), puis chauffer à reflux pendant ', T('t'), ' avec le chauffe-ballon réglé à ', T('T'), '. Le protocole précise que le liquide ne doit pas occuper plus de ', T('r'), ' du ballon. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le volume du mélange réactionnel ?'], utiles: ['Va', 'Vb'], raisons: { ...raisons, r: 'La règle sur la moitié ne sert pas encore : on cherche d’abord le volume du mélange.' },
        cherche: { bonne: 'Le volume du mélange (en mL)', faux: ['La durée totale de la synthèse (en min)', 'La masse de pierre ponce ajoutée (en g)', 'La température d’ébullition du mélange (en °C)'] },
        manque: null, solution: { txt: 'volume du mélange = volume d’alcool + volume d’acide (le catalyseur est négligeable)', val: p.Va + p.Vb, u: 'mL' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle capacité minimale doit avoir le ballon ?'], utiles: ['Va', 'Vb', 'r'], raisons,
        cherche: { bonne: 'La capacité minimale du ballon (en mL)', faux: ['Le volume de liquide à introduire (en mL)', 'La durée de chauffage du ballon (en min)', 'La quantité de pierre ponce nécessaire (en grains)'] },
        manque: null, solution: { txt: 'le liquide occupe au plus la moitié du ballon : capacité minimale = 2 × (volume d’alcool + volume d’acide)', val: 2 * (p.Va + p.Vb), u: 'mL' } };
    }),
  },
  {
    id: 'syn2gt-sapp-duree', schema: () => ({ type: 'reflux' }), domaine: 'Synthèse et reflux (2GT)', titre: 'Les durées d’un chauffage à reflux', noms: ['Durée totale de la manipulation', 'Durée de refroidissement et de chauffage en heures'],
    gen: () => ({ tp: tire([20, 30, 40]), tc: tire([30, 45, 60, 90]), tr: tire([15, 30]), V: tire([10, 15, 20]), T: tire([90, 100, 110]) }),
    build: epure((p, q) => {
      const tokens = {
        tp: tok(`${p.tp}\u00a0min`, 'Durée du montage et de la préparation', p.tp, 'min'),
        tc: tok(`${p.tc}\u00a0min`, 'Durée du chauffage à reflux', p.tc, 'min'),
        tr: tok(`${p.tr}\u00a0min`, 'Durée du refroidissement du ballon', p.tr, 'min'),
        V: tok(`${p.V}\u00a0mL`, 'Volume d’alcool isoamylique du protocole', p.V, 'mL'),
        T: tok(`${p.T}\u00a0°C`, 'Température du chauffe-ballon', p.T, '°C'),
      };
      const raisons = { V: 'Le volume de liquide n’intervient pas dans le calcul des durées.', T: 'La température du chauffe-ballon n’intervient pas dans le calcul des durées.', tp: 'La préparation du montage a lieu avant le chauffage : elle ne compte pas dans la durée de chauffage et de refroidissement.' };
      const debut = ['Un protocole de synthèse prévoit : montage et préparation en ', T('tp'), ', puis chauffage à reflux pendant ', T('tc'), ' (chauffe-ballon à ', T('T'), ', ', T('V'), ' d’alcool isoamylique), puis refroidissement du ballon pendant ', T('tr'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la durée totale de la manipulation ?'], utiles: ['tp', 'tc', 'tr'], raisons: { V: raisons.V, T: raisons.T },
        cherche: { bonne: 'La durée totale (en min)', faux: ['La durée de chauffage seule (en min)', 'Le volume de liquide chauffé (en mL)', 'La température finale du ballon (en °C)'] },
        manque: null, solution: { txt: 'durée totale = préparation + chauffage + refroidissement', val: p.tp + p.tc + p.tr, u: 'min' } };
      return { tokens, derivees: [], texte: [...debut, 'L’eau du réfrigérant circule pendant le chauffage et le refroidissement. Pendant combien d’heures circule-t-elle ?'], utiles: ['tc', 'tr'], raisons,
        cherche: { bonne: 'La durée de circulation de l’eau (en h)', faux: ['Le volume d’eau consommé (en L)', 'La durée totale de la manipulation (en min)', 'La température de l’eau du réfrigérant (en °C)'] },
        manque: null, solution: { txt: 'durée = chauffage + refroidissement, convertie en heures (60\u00a0min = 1\u00a0h)', val: (p.tc + p.tr) / 60, u: 'h' } };
    }),
  },
  // ───────────────────────────── Chromatographie sur couche mince (2GT, sim 197) : écart de hauteur, rapport frontal, données utiles
  {
    id: 'ccm2gt-sapp-comparer', domaine: 'Chromatographie sur couche mince (2GT)', titre: 'Comparer un arôme de synthèse et un arôme naturel', noms: ['Écart de hauteur entre les deux taches', 'Rapport frontal de la tache naturelle'],
    gen: () => { const h1 = tire([2.4, 2.7, 3.1, 3.6, 4.2]); return { h1, h2: Math.round((h1 + tire([0.3, 0.5, 0.8, 1.2])) * 10) / 10, F: tire([5.5, 6.0, 6.5, 7.0]), t: tire([12, 15, 20, 25]), V: tire([8, 10, 12]) }; },
    build: epure((p, q) => {
      const tokens = {
        h1: tok(`${nb(p.h1, 2)}\u00a0cm`, 'Hauteur de la tache de l’arôme de synthèse', p.h1, 'cm'),
        h2: tok(`${nb(p.h2, 2)}\u00a0cm`, 'Hauteur de la tache de l’arôme naturel', p.h2, 'cm'),
        F: tok(`${nb(p.F, 2)}\u00a0cm`, 'Distance parcourue par le front de l’éluant', p.F, 'cm'),
        t: tok(`${p.t}\u00a0min`, 'Durée de la migration', p.t, 'min'),
        V: tok(`${p.V} mL`, 'Volume d’éluant dans la cuve', p.V, 'mL'),
      };
      const raisons = { t: 'La durée de la migration ne dit rien sur les hauteurs déjà mesurées sur la plaque.', V: 'Le volume d’éluant ne change pas la comparaison des hauteurs ni le rapport frontal.', F: 'La distance du front ne sert pas à comparer deux hauteurs entre elles : il suffit de leur différence.', h1: 'La tache de synthèse ne sert pas pour le rapport frontal de la tache naturelle.' };
      const debut = ['On compare par CCM un arôme de synthèse et un arôme extrait d’une gousse de vanille, sur la même plaque avec le même éluant (', T('V'), ' dans la cuve, migration de ', T('t'), '). Sous lampe UV, on mesure depuis la ligne de dépôt : la tache de synthèse est à ', T('h1'), ', la tache naturelle à ', T('h2'), ' et le front à ', T('F'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’écart de hauteur entre les deux taches ?'], utiles: ['h1', 'h2'], raisons,
        cherche: { bonne: 'L’écart de hauteur entre les deux taches (en mm)', faux: ['La durée de migration de chaque tache (en min)', 'Le rapport entre le volume d’éluant et la hauteur', 'La masse d’arôme déposée sur la plaque (en mg)'] },
        manque: null, solution: { txt: 'écart = |h₂ − h₁|, converti en mm (1\u00a0cm = 10\u00a0mm)', val: Math.round(Math.abs(p.h2 - p.h1) * 10), u: 'mm' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le rapport frontal Rf de la tache naturelle ?'], utiles: ['h2', 'F'], raisons,
        cherche: { bonne: 'Le rapport frontal Rf de la tache naturelle (sans unité)', faux: ['La vitesse de la tache naturelle (en cm/min)', 'L’écart entre la tache naturelle et la ligne de dépôt (en mm)', 'La proportion d’éluant restant dans la cuve'] },
        manque: null, solution: { txt: 'Rf = frac(distance de la tache|distance du front)', val: p.h2 / p.F, u: '' } };
    }),
  },
  {
    id: 'ccm2gt-sapp-colorant', domaine: 'Chromatographie sur couche mince (2GT)', titre: 'Un colorant de bonbon sur une plaque de CCM', noms: ['Rapport frontal de la tache', 'Distance parcourue par la tache sur une autre plaque'],
    gen: () => { const F = tire([5.5, 6.0, 6.5, 7.0]); return { d: Math.round(tire([0.25, 0.35, 0.45, 0.55, 0.65, 0.75]) * F * 10) / 10, F, F2: tire([5.0, 6.0, 7.0]), t: tire([12, 15, 20, 25]), V: tire([8, 10, 12]) }; },
    build: epure((p, q) => {
      const R = Number((p.d / p.F).toPrecision(2));
      const tokens = {
        d: tok(`${nb(p.d, 2)}\u00a0cm`, 'Distance parcourue par la tache depuis la ligne de dépôt', p.d, 'cm'),
        F: tok(`${nb(p.F, 2)}\u00a0cm`, 'Distance parcourue par le front depuis la ligne de dépôt', p.F, 'cm'),
        R: tok(`${nb(R, 2)}`, 'Rapport frontal du colorant avec cet éluant', R, ''),
        F2: tok(`${nb(p.F2, 2)}\u00a0cm`, 'Distance parcourue par le front sur la deuxième plaque', p.F2, 'cm'),
        t: tok(`${p.t}\u00a0min`, 'Durée de la migration', p.t, 'min'),
        V: tok(`${p.V} mL`, 'Volume d’éluant dans la cuve', p.V, 'mL'),
        b: tok('1,0\u00a0cm', 'Hauteur de la ligne de dépôt au-dessus du bas de la plaque', 1.0, 'cm'),
      };
      const raisons = { t: 'La durée de la migration n’intervient pas : on compare des distances.', V: 'Le volume d’éluant ne change pas les distances lues sur la plaque.', b: 'Les distances sont déjà mesurées depuis la ligne de dépôt : sa hauteur par rapport au bas de la plaque n’intervient pas.', d: 'Cette distance a déjà servi à trouver le rapport frontal : pour la deuxième plaque, on utilise ce rapport.', F: 'Le front de la première plaque a déjà servi à trouver le rapport frontal : pour la deuxième plaque, on utilise celui de la deuxième.' };
      const debut = ['On étudie un colorant de bonbon par CCM (', T('V'), ' d’éluant, migration de ', T('t'), ', ligne de dépôt à ', T('b'), ' du bas de la plaque). '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Sur une plaque, la tache du colorant est à ', T('d'), ' de la ligne de dépôt et le front à ', T('F'), ' de la même ligne. Quel est le rapport frontal Rf de la tache ?'], utiles: ['d', 'F'], raisons,
        cherche: { bonne: 'Le rapport frontal Rf de la tache (sans unité)', faux: ['La vitesse de migration de la tache (en cm/min)', 'La hauteur de la ligne de dépôt (en cm)', 'La différence entre les distances du front et de la tache (en cm)'] },
        manque: null, solution: { txt: 'Rf = frac(distance de la tache|distance du front)', val: p.d / p.F, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Avec le même éluant, le rapport frontal du colorant est ', T('R'), '. Sur une deuxième plaque, le front est à ', T('F2'), ' de la ligne de dépôt. À quelle distance de la ligne de dépôt sera la tache ?'], utiles: ['R', 'F2'], raisons,
        cherche: { bonne: 'La distance de la tache sur la deuxième plaque (en cm)', faux: ['Le rapport frontal sur la deuxième plaque (sans unité)', 'La durée de migration nécessaire (en min)', 'La distance entre la tache et le front (en cm)'] },
        manque: null, solution: { txt: 'distance de la tache = Rf × distance du front', val: R * p.F2, u: 'cm' } };
    }),
  },
  // ───────────────────────────── Changement d'état (2GT, sim 195) : E = m × L, repérer les données utiles, convertir les grammes en kilogrammes
  {
    id: 'etat2gt-sapp-glacon', domaine: 'Changement d’état (2GT)', titre: 'Refroidir une boisson avec de la glace', noms: ['Énergie pour faire fondre la glace', 'Masse de glace qui fond'],
    gen: () => ({ m: tire([150, 200, 250, 300, 400, 500]), E: tire([40, 60, 80, 100, 120]), th: tire([20, 22, 25]), V: tire([200, 250, 330]) }),
    build: epure((p, q) => {
      const L = ETM.L('eau', 'fusion');
      const tokens = {
        m: tok(`${p.m} g`, 'Masse de glace, à 0 °C', p.m / 1000, 'kg'),
        E: tok(`${p.E} kJ`, 'Énergie reçue par la glace', p.E, 'kJ'),
        L: tok(`${L} kJ/kg`, 'Énergie massique de fusion de l’eau', L, 'kJ/kg'),
        th: tok(`${p.th} °C`, 'Température de la pièce', p.th, '°C'),
        V: tok(`${p.V} mL`, 'Volume de la boisson', p.V / 1000, 'L'),
      };
      const raisons = { th: 'La température de la pièce ne change pas l’énergie nécessaire pour faire fondre la glace : seule la masse qui fond et L comptent.', V: 'Le volume de la boisson ne dit pas combien de glace fond : on utilise la masse de glace (ou l’énergie reçue) et L.' };
      const debut = ['Dans une pièce à ', T('th'), ', on refroidit une boisson de ', T('V'), ' avec de la glace à 0 °C. L’énergie massique de fusion de l’eau est ', T('L'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'On met ', T('m'), ' de glace, qui fond entièrement. Quelle énergie la glace reçoit-elle de la boisson ?'], utiles: ['m', 'L'], raisons,
        cherche: { bonne: 'L’énergie reçue par la glace (en kJ)', faux: ['La température finale de la boisson (en °C)', 'La masse de la boisson (en kg)', 'La durée de la fonte de la glace (en min)'] },
        manque: null, solution: { txt: 'E = m × L, avec la masse convertie en kg', val: (p.m / 1000) * L, u: 'kJ' } };
      return { tokens, derivees: [], texte: [...debut, 'La glace reçoit ', T('E'), ' de la boisson et fond. Quelle masse de glace a fondu ?'], utiles: ['E', 'L'], raisons,
        cherche: { bonne: 'La masse de glace fondue (en kg)', faux: ['L’énergie qu’il faut encore fournir (en kJ)', 'Le volume de la boisson refroidie (en L)', 'La température de la glace (en °C)'] },
        manque: null, solution: { txt: 'm = frac(E|L)', val: p.E / L, u: 'kg' } };
    }),
  },
  {
    id: 'etat2gt-sapp-ethanol', schema: () => ({ type: 'casserole', liquide: 'éthanol liquide' }), domaine: 'Changement d’état (2GT)', titre: 'Un flacon d’éthanol qui se vaporise', noms: ['Énergie pour vaporiser l’éthanol', 'Énergie cédée par la vapeur qui se liquéfie'],
    gen: () => ({ m: tire([20, 40, 50, 80, 120, 150]), th: tire([18, 20, 22]), t: tire([10, 15, 30]) }),
    build: epure((p, q) => {
      const c = ETM.corps('ethanol'), Lv = c.Lvap, Lf = c.Lfus;
      const tokens = {
        m: tok(`${p.m} g`, 'Masse d’éthanol', p.m / 1000, 'kg'),
        Lv: tok(`${Lv} kJ/kg`, 'Énergie massique de vaporisation de l’éthanol', Lv, 'kJ/kg'),
        Lf: tok(`${Lf} kJ/kg`, 'Énergie massique de fusion de l’éthanol', Lf, 'kJ/kg'),
        th: tok(`${p.th} °C`, 'Température de la pièce', p.th, '°C'),
        t: tok(`${p.t} min`, 'Durée de l’expérience', p.t * 60, 's'),
      };
      const raisons = { Lf: 'L de fusion sert pour le passage solide-liquide ; ici l’éthanol passe du liquide au gaz (ou du gaz au liquide) : il faut L de vaporisation.', th: 'La température de la pièce n’intervient pas dans E = m × L.', t: 'La durée de l’expérience ne donne pas l’énergie échangée : E = m × L ne dépend pas du temps.' };
      const debut = ['Dans une pièce à ', T('th'), ', une expérience dure ', T('t'), '. Pour l’éthanol, L de fusion vaut ', T('Lf'), ' et L de vaporisation vaut ', T('Lv'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'On vaporise entièrement ', T('m'), ' d’éthanol liquide. Quelle énergie faut-il lui fournir ?'], utiles: ['m', 'Lv'], raisons,
        cherche: { bonne: 'L’énergie à fournir à l’éthanol (en kJ)', faux: ['La température d’ébullition de l’éthanol (en °C)', 'La masse d’éthanol restante (en kg)', 'La puissance du réchaud (en W)'] },
        manque: null, solution: { txt: 'E = m × L(vaporisation), avec la masse convertie en kg', val: (p.m / 1000) * Lv, u: 'kJ' } };
      return { tokens, derivees: [], texte: [...debut, 'Ensuite, ', T('m'), ' de vapeur d’éthanol se liquéfient. Quelle énergie la vapeur cède-t-elle au milieu ?'], utiles: ['m', 'Lv'], raisons,
        cherche: { bonne: 'L’énergie cédée par la vapeur (en kJ)', faux: ['L’énergie qu’il faut fournir pour fondre l’éthanol (en kJ)', 'La masse de liquide qui s’évapore (en kg)', 'La durée de la liquéfaction (en min)'] },
        manque: null, solution: { txt: 'même L que pour la vaporisation ; E = m × L, avec la masse convertie en kg', val: (p.m / 1000) * Lv, u: 'kJ' } };
    }),
  },
  // ───────────────────────────── Image réelle et grandissement avec une lentille convergente (2GT, sim 199)
  {
    id: 'img2gt-sapp-bougie', domaine: 'Image par une lentille (2GT)', titre: 'Une bougie, une lentille et un écran', noms: ['Hauteur de l’image de la bougie', 'Grandissement du montage'],
    gen: () => ({ AB: tire([2, 3, 4, 5, 6]), ...tire([{ f: 4, OA: 6, OAp: 12 }, { f: 4, OA: 12, OAp: 6 }, { f: 6, OA: 9, OAp: 18 }, { f: 6, OA: 18, OAp: 9 }, { f: 3, OA: 9, OAp: 4.5 }, { f: 2, OA: 3, OAp: 6 }, { f: 2, OA: 6, OAp: 3 }, { f: 8, OA: 12, OAp: 24 }, { f: 8, OA: 24, OAp: 12 }, { f: 10, OA: 15, OAp: 30 }, { f: 10, OA: 30, OAp: 15 }]), th: tire([20, 22, 25]) }),   // (f′, OA, OAp) cohérents : la distance focale est celle qui donne bien cette image
    build: epure((p, q) => {
      const tokens = {
        AB: tok(`${p.AB}\u00a0cm`, 'Hauteur de la bougie', p.AB, 'cm'),
        OA: tok(`${p.OA}\u00a0cm`, 'Distance de la bougie à la lentille', p.OA, 'cm'),
        OAp: tok(`${nb(p.OAp)}\u00a0cm`, 'Distance de l’écran à la lentille (image nette)', p.OAp, 'cm'),
        f: tok(`${p.f}\u00a0cm`, 'Distance focale de la lentille', p.f, 'cm'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
      };
      const raisons = { f: 'La distance focale ne sert pas ici : on connaît déjà la position de l’objet et celle de l’image, et le grandissement se calcule avec ces deux distances.', th: 'La température de la salle ne change pas la taille de l’image.', AB: 'Pour le grandissement, seules comptent les distances OA et OA′ : la hauteur de la bougie est inutile.' };
      const debut = ['Une lentille convergente de distance focale ', T('f'), ' est dans une salle à ', T('th'), '. Une bougie est placée à ', T('OA'), ' de la lentille et son image est nette sur un écran à ', T('OAp'), ' de la lentille. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La bougie mesure ', T('AB'), ' de haut. Quelle est la hauteur de l’image ?'], utiles: ['AB', 'OA', 'OAp'], raisons: { f: raisons.f, th: raisons.th },
        cherche: { bonne: 'La hauteur de l’image de la bougie (en cm)', faux: ['La distance entre la bougie et son image (en cm)', 'La température de l’écran (en °C)', 'Le temps de pose de l’image (en s)'] },
        manque: null, solution: { txt: 'A′B′ = frac(AB × OA′|OA)', val: p.AB * p.OAp / p.OA, u: 'cm' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le grandissement du montage (sans unité) ?'], utiles: ['OA', 'OAp'], raisons: { f: raisons.f, th: raisons.th },
        cherche: { bonne: 'Le grandissement du montage (sans unité)', faux: ['La hauteur de la flamme (en cm)', 'La distance focale de la lentille (en cm)', 'La durée de combustion de la bougie (en min)'] },
        manque: null, solution: { txt: 'grandissement = frac(OA′|OA)', val: p.OAp / p.OA, u: '' } };
    }),
  },
  {
    id: 'img2gt-sapp-projecteur', domaine: 'Image par une lentille (2GT)', titre: 'Un projecteur de diapositives', noms: ['Hauteur de l’image sur l’écran', 'Grandissement du projecteur'],
    gen: () => ({ AB: tire([24, 36]), OA: tire([51, 52, 55, 60, 75]), f: 50, V: tire([60, 80, 100]) }),
    build: epure((p, q) => {
      const OAp = Math.round(p.OA * p.f / (p.OA - p.f));                 // en mm : image nette d'une diapositive (valeur choisie, cohérente avec la lentille de 50 mm)
      const OApm = OAp / 1000;
      const tokens = {
        AB: tok(`${p.AB}\u00a0mm`, 'Hauteur de la diapositive', p.AB / 1000, 'm'),
        OA: tok(`${p.OA}\u00a0mm`, 'Distance de la diapositive à la lentille', p.OA / 1000, 'm'),
        OAp: tok(`${nb(OApm)}\u00a0m`, 'Distance de l’écran à la lentille (image nette)', OApm, 'm'),
        f: tok(`${p.f}\u00a0mm`, 'Distance focale de la lentille', p.f / 1000, 'm'),
        V: tok(`${p.V} W`, 'Puissance de la lampe', p.V, 'W'),
      };
      const raisons = { f: 'La distance focale ne sert pas ici : l’énoncé donne déjà les positions de la diapositive et de l’écran.', V: 'La puissance de la lampe change la luminosité de l’image, pas sa taille.', AB: 'Pour le grandissement, seules comptent les distances OA et OA′.' };
      const debut = ['Un projecteur contient une lentille de distance focale ', T('f'), ' et une lampe de ', T('V'), '. La diapositive est à ', T('OA'), ' de la lentille ; l’image est nette sur un écran à ', T('OAp'), ' de la lentille. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'La diapositive mesure ', T('AB'), ' de haut. Quelle est la hauteur de l’image sur l’écran ?'], utiles: ['AB', 'OA', 'OAp'], raisons: { f: raisons.f, V: raisons.V },
        cherche: { bonne: 'La hauteur de l’image sur l’écran (en m)', faux: ['La luminosité de l’image (en lux)', 'La distance entre la lampe et l’écran (en m)', 'La durée de projection (en min)'] },
        manque: null, solution: { txt: 'A′B′ = frac(AB × OA′|OA), avec les distances dans la même unité (en m)', val: (p.AB / 1000) * OApm / (p.OA / 1000), u: 'm' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le grandissement du projecteur (sans unité) ?'], utiles: ['OA', 'OAp'], raisons: { f: raisons.f, V: raisons.V, AB: raisons.AB },
        cherche: { bonne: 'Le grandissement du projecteur (sans unité)', faux: ['La hauteur de la diapositive (en mm)', 'La distance focale de la lentille (en mm)', 'La consommation électrique de la lampe (en kWh)'] },
        manque: null, solution: { txt: 'grandissement = frac(OA′|OA), avec les distances dans la même unité', val: OApm / (p.OA / 1000), u: '' } };
    }),
  },
  // ───────────────────────────── Tests chimiques (2GT, sim 198) : combien de tests pour identifier un gaz, essais avec la poudre blanche
  {
    id: 'test2gt-sapp-gaz-inconnu', domaine: 'Tests chimiques (2GT)', titre: 'Un gaz inconnu dans un tube', noms: ['Durée maximale des tests pour un tube', 'Durée maximale des tests pour plusieurs tubes'],
    gen: () => ({ n: tire([3, 4]), t: tire([2, 3, 5]), m: tire([2, 3, 4, 5]), V: tire([20, 50, 100]), th: tire([18, 20, 22]) }),
    build: epure((p, q) => {
      const tokens = {
        n: tok(`${p.n} gaz`, 'Nombre de gaz possibles dans le tube', p.n, ''),
        t: tok(`${p.t} min`, 'Durée d’un test', p.t * 60, 's'),
        m: tok(`${p.m} tubes`, 'Nombre de tubes à identifier', p.m, ''),
        V: tok(`${p.V} mL`, 'Volume de gaz dans un tube', p.V / 1000, 'L'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
      };
      const raisons = { V: 'Le volume de gaz dans le tube ne change ni le nombre de tests ni leur durée.', th: 'La température de la salle n’intervient pas dans le nombre de tests à faire.' };
      const debut = ['Dans une salle à ', T('th'), ', un élève doit identifier le gaz contenu dans un tube de ', T('V'), '. Ce gaz pur est l’un de ', T('n'), ' gaz possibles ; chaque test est positif pour un seul de ces gaz, et le dernier gaz restant se déduit par élimination. Chaque test dure ', T('t'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle durée maximale faut-il prévoir pour identifier le gaz d’un tube ?'], utiles: ['n', 't'], raisons,
        cherche: { bonne: 'La durée maximale des tests pour un tube (en min)', faux: ['La durée du premier test seulement (en min)', 'La durée de tous les tests faits sur chacun des gaz possibles (en min)', 'Le nombre de gaz possibles dans le tube'] },
        manque: null, solution: { txt: '(n − 1) tests × durée d’un test : le dernier gaz se déduit par élimination', val: (p.n - 1) * p.t, u: 'min' } };
      return { tokens, derivees: [{ id: 'un', nom: 'Durée maximale pour un tube', expr: '(n − 1) × durée d’un test', val: (p.n - 1) * p.t, u: 'min' }],
        texte: [...debut, 'Il doit identifier le gaz de ', T('m'), ' tubes, un après l’autre. Quelle durée maximale faut-il prévoir pour l’ensemble ?'], utiles: ['n', 't', 'm'], raisons,
        cherche: { bonne: 'La durée maximale des tests pour l’ensemble des tubes (en min)', faux: ['La durée maximale des tests pour un seul tube (en min)', 'Le nombre total de tests faits sur tous les gaz possibles de chaque tube', 'Le volume total de gaz contenu dans les tubes (en mL)'] },
        manque: null, solution: { txt: 'nombre de tubes × (n − 1) tests × durée d’un test', val: p.m * (p.n - 1) * p.t, u: 'min' } };
    }),
  },
  {
    id: 'test2gt-sapp-poudre', domaine: 'Tests chimiques (2GT)', titre: 'Tester des liquides avec la poudre blanche', noms: ['Masse de poudre pour une série d’essais', 'Nombre d’essais possibles avec un flacon'],
    gen: () => ({ n: tire([4, 5, 6, 8]), m: tire([0.5, 1, 2]), M: tire([20, 30, 50]), V: tire([2, 5, 10]), th: tire([18, 20, 22]) }),
    build: epure((p, q) => {
      const tokens = {
        n: tok(`${p.n} liquides`, 'Nombre de liquides à tester', p.n, ''),
        m: tok(`${nb(p.m, 1)} g`, 'Masse de poudre blanche utilisée pour un essai', p.m / 1000, 'kg'),
        M: tok(`${p.M} g`, 'Masse de poudre blanche dans un flacon', p.M / 1000, 'kg'),
        V: tok(`${p.V} mL`, 'Volume de chaque liquide', p.V / 1000, 'L'),
        th: tok(`${p.th} °C`, 'Température de la salle', p.th, '°C'),
      };
      const raisons = { V: 'Le volume du liquide ne change pas la masse de poudre nécessaire pour un essai.', th: 'La température de la salle n’intervient pas dans la masse de poudre utilisée.' };
      const debut = ['Dans une salle à ', T('th'), ', on veut savoir lesquels de plusieurs liquides contiennent de l’eau. Pour chaque essai, on met ', T('m'), ' de poudre blanche de sulfate de cuivre anhydre au contact d’un échantillon de ', T('V'), ' d’un liquide. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'On teste ', T('n'), ', un essai par liquide. Quelle masse de poudre faut-il en tout ?'], utiles: ['n', 'm'], raisons,
        cherche: { bonne: 'La masse totale de poudre utilisée (en g)', faux: ['La masse de poudre d’un seul essai (en g)', 'Le nombre de liquides qui contiennent de l’eau', 'Le volume total de liquide testé (en mL)'] },
        manque: null, solution: { txt: 'masse totale = nombre d’essais × masse par essai', val: p.n * p.m, u: 'g' } };
      return { tokens, derivees: [], texte: [...debut, 'Un flacon contient ', T('M'), ' de poudre. Combien d’essais peut-on faire au maximum avec un flacon ?'], utiles: ['M', 'm'], raisons,
        cherche: { bonne: 'Le nombre d’essais possibles avec un flacon', faux: ['La masse de poudre qui reste après un essai (en g)', 'Le nombre de liquides qui contiennent de l’eau', 'Le volume de liquide nécessaire pour tous les essais (en mL)'] },
        manque: null, solution: { txt: 'nombre d’essais = frac(masse du flacon|masse par essai)', val: p.M / p.m, u: 'essais' } };
    }),
  },
  // ───────────────────────────── Seconde : réactif limitant
  {
    id: 'rl2gt-donnees', domaine: 'Réactif limitant (2GT)', titre: 'Un mélange de réactifs : quelles données pour trouver le limitant ?', noms: ['Réactif limitant', 'Quantité de réactif en excès'],
    gen: () => ({ rId: tire(['methane', 'calcaire', 'dba']), iLim: tire([0, 1]), m: tire([1, 2, 3]), e: tire([1, 2]), T: tire([20, 25, 30]), V: tire([250, 500, 1000]) }),
    build: (p, q) => {
      const r = RL.reactionDe(p.rId), n = RL.melangeAvecLimitant(r, p.iLim, p.m, p.e), b = RL.bilan(r, n), iEx = 1 - p.iLim, dec = r.dec;
      const intro = { methane: 'On fait brûler du méthane dans du dioxygène. ', calcaire: 'On verse de l’acide sur du calcaire. ', dba: 'On réalise la synthèse de la DBA. ' }[p.rId];
      const GN = { methane: ['de méthane CH₄', 'de dioxygène O₂'], calcaire: ['de calcaire CaCO₃', 'd’ions H⁺ (l’acide)'], dba: ['de benzaldéhyde C₇H₆O', 'd’acétone C₃H₆O'] }[p.rId];
      const cR = r.reactifs.findIndex(e => e.coef > 1), cP = r.produits.findIndex(e => e.coef > 1);
      // gaz (méthane) : 1 mol occupe environ 24 L, donc le récipient se compte en litres (jusqu'à 11 mol ≈ 270 L) ; solides et liquides : en mL
      const gaz = p.rId === 'methane', uV = gaz ? 'L' : 'mL', Vr = gaz ? ({ 250: 300, 500: 500, 1000: 1000 }[p.V]) : p.V;
      const tokens = {
        nA: tok(`${RL.fr(n[0], dec)} mol`, `Quantité de matière initiale ${GN[0]}`, n[0], 'mol'),
        nB: tok(`${RL.fr(n[1], dec)} mol`, `Quantité de matière initiale ${GN[1]}`, n[1], 'mol'),
        c: tok(String(r.reactifs[cR].coef), `Coefficient de ${r.reactifs[cR].f} dans l’équation`, r.reactifs[cR].coef, ''),
        T: tok(`${p.T} °C`, 'Température du mélange', p.T, '°C'),
        V: tok(`${Vr} ${uV}`, 'Volume du récipient', Vr, uV),
        ...(cP >= 0 ? { cp: tok(String(r.produits[cP].coef), `Coefficient de ${r.produits[cP].f} dans l’équation`, r.produits[cP].coef, '') } : {}),
      };
      const terme = (e, id) => (e.coef > 1 ? [T(id), ` ${e.f}`] : [e.f]);
      const eq = [...terme(r.reactifs[0], 'c'), ' + ', ...terme(r.reactifs[1], 'c'), ' → ', ...r.produits.flatMap((e, j) => [...(j ? [' + '] : []), ...terme(e, 'cp')])];
      const texte = [intro + 'On mélange ', T('nA'), ` ${GN[0]} et `, T('nB'), ` ${GN[1]}, selon l’équation `, ...eq,
        '. La transformation est totale ; elle a lieu à ', T('T'), ' dans un récipient de ', T('V'), q === 0 ? '. Quel est le réactif limitant ?' : '. Quelle quantité de matière du réactif en excès reste-t-il à la fin ?'];
      const raisons = { T: 'La température n’intervient pas : la transformation est supposée totale et rapide.', V: 'Le volume du récipient ne change pas le réactif limitant ni ce qui reste : seules les quantités de matière et les coefficients comptent.',
        cp: 'Ce coefficient concerne un produit : il ne sert pas à trouver le réactif limitant ni la quantité de réactif qui reste.' };
      const derivees = r.reactifs.map((e, i) => ({ id: `r${i}`, nom: `Nombre de recettes permises par ${e.nom} (frac(quantité|coefficient))`, expr: `frac(${RL.fr(n[i], dec)}|${e.coef})`, val: b.rec[i], u: 'recettes' }));
      if (q === 0) return { tokens, derivees, texte, utiles: ['nA', 'nB', 'c'], raisons,
        cherche: { bonne: 'Le réactif limitant', faux: ['La quantité de produit formée (en mol)', 'La masse totale du mélange de départ (en g)', 'Le réactif dont il restera le plus à la fin'] },
        manque: null, solution: { txt: 'on compare frac(quantité|coefficient) pour chaque réactif : le plus petit résultat désigne le réactif limitant', val: b.rmin, u: 'recettes' } };
      return { tokens, derivees, texte, utiles: ['nA', 'nB', 'c'], raisons,
        cherche: { bonne: 'La quantité du réactif en excès qui reste (mol)', faux: ['La quantité de matière du réactif limitant qui reste (en mol)', 'La quantité de produit formée (en mol)', 'Le réactif limitant'] },
        manque: null, solution: { txt: `reste de ${r.reactifs[iEx].nom} = quantité de départ − coefficient × nombre de recettes`, val: b.restes[iEx], u: 'mol' } };
    },
  },
  // ───────────────────────────── Diffraction d'une onde : angle caractéristique (TG, sim 181)
  {
    id: 'dif-sapp-fente', schema: () => ({ type: 'diffraction', obstacle: 'fente' }), domaine: 'Diffraction d’une onde : angle caractéristique', titre: 'Un laser éclaire une fente fine', noms: ['Angle caractéristique de diffraction', 'Largeur de la tache centrale'],
    gen: () => ({ lam: tire([405, 532, 633, 650]), a: tire([50, 80, 100, 150]), D: tire([1.5, 2.0, 3.0]), P: tire([1, 5, 30]), d: tire([20, 30, 50]) }),
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        a: tok(`${p.a} µm`, 'Largeur de la fente', p.a, 'µm'),
        D: tok(`${nb(p.D, 2)} m`, 'Distance entre la fente et l’écran', p.D, 'm'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P, 'mW'),
        d: tok(`${p.d} cm`, 'Distance entre le laser et la fente', p.d, 'cm'),
      };
      const debut = ['Un laser de longueur d’onde ', T('lam'), ' et de puissance ', T('P'), ', placé à ', T('d'), ' d’une fente verticale de largeur ', T('a'), ', éclaire un écran situé à ', T('D'), ' de la fente. On observe la figure de diffraction. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’angle caractéristique de diffraction (en radians) ?'],
        utiles: ['lam', 'a'], raisons: { D: 'La distance à l’écran n’intervient pas dans l’angle θ : elle sert à passer de θ à la largeur de la tache sur l’écran.', P: 'La puissance du laser change la luminosité de la figure, pas l’étalement de la lumière.', d: 'La distance entre le laser et la fente ne change pas l’angle de diffraction.' },
        cherche: { bonne: 'L’angle caractéristique θ de diffraction (en rad)', faux: ['La largeur de la tache centrale sur l’écran (en mm)', 'La puissance reçue par l’écran (en mW)', 'La fréquence de la lumière du laser (en Hz)'] },
        manque: null, solution: { txt: 'θ ≈ frac(λ|a)', val: p.lam * 1e-9 / (p.a * 1e-6), u: 'rad' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la largeur de la tache centrale sur l’écran ?'],
        utiles: ['lam', 'a', 'D'], raisons: { P: 'La puissance du laser change la luminosité de la figure, pas sa largeur.', d: 'La distance entre le laser et la fente ne change pas la largeur de la tache sur l’écran.' },
        cherche: { bonne: 'La largeur L de la tache centrale (en mm)', faux: ['L’angle caractéristique θ de diffraction (en rad)', 'La largeur a de la fente (en µm)', 'La puissance reçue par l’écran (en mW)'] },
        manque: null, solution: { txt: 'L = frac(2 λ D|a)', val: 2 * p.lam * p.D / p.a, u: 'mm' } };
    },
  },
  // ───────────────────────────── Trous d’Young (TG, sim 182) : interfrange, distance entre les trous
  {
    id: 'you-sapp-young', domaine: 'Trous d’Young et interfrange', titre: 'Un laser et deux trous', noms: ['Interfrange sur l’écran', 'Distance entre les trous'],
    gen: () => {
      let c = null;
      for (let k = 0; k < 60 && !c; k++) {
        const lam = tire([405, 450, 532, 633, 650]), a = tire([0.20, 0.30, 0.40, 0.50, 0.60, 0.80]), D = tire([1.5, 2.0, 2.5, 3.0]), i = lam * 1e-9 * D / (a * 1e-3) * 1e3;
        if (i >= 1.0 && i <= 8.0) c = { lam, a, D, i };
      }
      c = c || { lam: 650, a: 0.50, D: 2.5, i: 3.25 };
      const N = tire([4, 5, 6, 8]);
      return { ...c, N, d: Math.round(N * c.i * 10) / 10, P: tire([1, 3, 5]), w: tire([20, 30, 50]) };
    },
    build: (p, q) => {
      const tokens = {
        lam: tok(`${p.lam} nm`, 'Longueur d’onde du laser', p.lam, 'nm'),
        D: tok(`${nb(p.D, 2)} m`, 'Distance entre la plaque et l’écran', p.D, 'm'),
        P: tok(`${p.P} mW`, 'Puissance du laser', p.P, 'mW'),
        w: tok(`${p.w} µm`, 'Diamètre de chaque trou', p.w, 'µm'),
        ...(q === 0 ? { a: tok(`${nb(p.a, 2)} mm`, 'Distance entre les deux trous', p.a, 'mm') }
          : { d: tok(`${nb(p.d, 1)} mm`, 'Distance mesurée entre deux franges brillantes', p.d, 'mm'), N: tok(`${p.N}`, 'Nombre d’interfranges entre ces deux franges', p.N, '') }),
      };
      const debut = ['Un laser de longueur d’onde ', T('lam'), ' et de puissance ', T('P'), ' éclaire une plaque opaque percée de deux trous très fins, de diamètre ', T('w'), ' chacun. Un écran est placé à la distance ', T('D'), ' de la plaque : on y observe des franges brillantes et sombres régulièrement espacées. '];
      const raisons = { P: 'La puissance du laser règle l’éclat des franges, pas leur position : elle n’intervient pas dans l’interfrange.', w: 'Le diamètre des trous ne change pas la position des franges (il règle seulement l’étendue de la figure) : l’interfrange ne dépend que de λ, D et de la distance entre les trous.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Les deux trous sont distants de ', T('a'), '. Quelle est l’interfrange sur l’écran ?'], utiles: ['lam', 'a', 'D'], raisons,
        cherche: { bonne: 'L’interfrange i entre deux franges brillantes (en mm)', faux: ['La différence de chemin δ au point central de l’écran (en nm)', 'La largeur totale de la figure visible sur l’écran (en mm)', 'La période de l’onde lumineuse du laser (en fs)'] },
        manque: null, solution: { txt: 'i = frac(λ × D|a), avec λ et a convertis en mètres', val: p.i, u: 'mm' } };
      return { tokens, derivees: ['interfrange mesurée : i = frac(d|N)'], texte: [...debut, 'On mesure sur l’écran la distance ', T('d'), ' entre deux franges brillantes séparées par ', T('N'), ' interfranges. Quelle est la distance a entre les deux trous ?'], utiles: ['lam', 'D', 'd', 'N'], raisons,
        cherche: { bonne: 'La distance a entre les deux trous (en mm)', faux: ['L’interfrange i sur l’écran (en mm)', 'La différence de chemin δ au point mesuré (en nm)', 'La longueur d’onde du laser (en nm)'] },
        manque: null, solution: { txt: 'i = frac(d|N), puis a = frac(λ × D|i)', val: p.a, u: 'mm' } };
    },
  },
  // ───────────────────────────── Interférences de deux ondes (TG, sim 183) : cuve à ondes, haut-parleurs
  {
    id: 'itf-sapp-cuve', domaine: 'Interférences de deux ondes : conditions constructives et destructives', titre: 'Deux vibreurs dans une cuve à ondes', noms: ['Différence de chemin en un point M', 'Déphasage entre les deux ondes en M'],
    gen: () => {
      const s = tire([5, 6, 8]), f = tire([16, 20, 25]), r1 = tire([12.4, 14.0, 15.6, 17.2, 18.8]), dl = tire([1.5, 2.0, 2.5, 3.0, 3.5, 4.0]);
      return { s, f, r1, r2: Math.round((r1 + dl) * 10) / 10, prof: tire([4, 5, 6]), amp: tire([1.0, 1.5, 2.0]) };
    },
    build: (p, q) => {
      const tokens = {
        s: tok(`${p.s} cm`, 'Distance entre les deux vibreurs', p.s, 'cm'),
        f: tok(`${p.f} Hz`, 'Fréquence du générateur', p.f, 'Hz'),
        v: tok('0,40 m/s', 'Célérité des ondes à la surface de l’eau', 0.4, 'm/s'),
        r1: tok(`${nb(p.r1, 1)} cm`, 'Distance du point M au vibreur S₁', p.r1, 'cm'),
        r2: tok(`${nb(p.r2, 1)} cm`, 'Distance du point M au vibreur S₂', p.r2, 'cm'),
        prof: tok(`${p.prof} mm`, 'Profondeur de l’eau', p.prof, 'mm'),
        amp: tok(`${nb(p.amp, 1)} mm`, 'Amplitude de chaque onde', p.amp, 'mm'),
      };
      const dl = p.r2 - p.r1, lam = 0.4 / p.f * 100, dphi = 2 * Math.PI * dl / lam;
      const debut = ['Dans une cuve à ondes, deux vibreurs ponctuels S₁ et S₂, distants de ', T('s'), ', sont reliés au même générateur de fréquence ', T('f'), '. Les ondes se propagent à ', T('v'), ' dans une eau de profondeur ', T('prof'), ', avec une amplitude de ', T('amp'), ' chacune. Un point M est à ', T('r1'), ' de S₁ et à ', T('r2'), ' de S₂. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la différence de chemin δ au point M ?'],
        utiles: ['r1', 'r2'], raisons: { s: 'L’écartement des vibreurs ne sert pas à calculer δ : il suffit des deux distances à M.', f: 'La fréquence n’intervient pas dans une différence de distances.', v: 'La célérité servirait à calculer un retard ou une longueur d’onde, pas une différence de distances.', prof: 'La profondeur de l’eau ne joue aucun rôle dans le calcul d’une différence de chemin.', amp: 'L’amplitude des ondes n’intervient pas dans une différence de distances.' },
        cherche: { bonne: 'La différence de chemin δ = |r₂ − r₁| (en cm)', faux: ['Le retard τ de la deuxième onde (en ms)', 'La longueur d’onde λ (en cm)', 'La somme des deux distances parcourues (en cm)'] },
        manque: null, solution: { txt: 'δ = |r₂ − r₁|', val: dl, u: 'cm' } };
      return { tokens, derivees: [{ id: 'dl', nom: 'Différence de chemin au point M', expr: 'δ = |r₂ − r₁|', val: dl, u: 'cm' }, { id: 'lam', nom: 'Longueur d’onde des ondes', expr: 'λ = frac(v|f)', val: lam, u: 'cm' }], texte: [...debut, 'Quel est le déphasage Δφ entre les deux ondes en M ?'],
        utiles: ['r1', 'r2', 'v', 'f'], raisons: { s: 'L’écartement des vibreurs n’intervient pas : les distances r₁ et r₂ à M sont déjà données.', prof: 'La célérité est donnée : la profondeur n’est pas nécessaire.', amp: 'Le déphasage ne dépend pas de l’amplitude des ondes.' },
        cherche: { bonne: 'Le déphasage Δφ en M (en rad)', faux: ['L’amplitude de la somme des deux ondes (en mm)', 'La différence de chemin δ seule (en cm)', 'Le nombre de lignes d’interférence (sans unité)'] },
        manque: null, solution: { txt: 'Δφ = 2π × frac(δ|λ), avec δ = |r₂ − r₁| et λ = frac(v|f)', val: dphi, u: 'rad' } };
    },
  },
  {
    id: 'itf-sapp-hp', domaine: 'Interférences de deux ondes : conditions constructives et destructives', titre: 'Deux haut-parleurs et un auditeur', noms: ['Longueur d’onde du son', 'Nature de l’interférence en P'],
    gen: () => {
      const f = tire([340, 425, 500, 680, 850]), lam = 340 / f, m = tire([2, 3, 4, 5]), d1 = tire([2.5, 3.0, 3.5, 4.0]);
      return { f, a: tire([1.5, 2.0, 2.5, 3.0, 3.5].filter(x => x > m * lam / 2 + 0.3)), d1, d2: Math.round((d1 + m * lam / 2) * 100) / 100, W: tire([10, 20, 30]) };      // la différence de chemin reste inférieure à l’écartement des haut-parleurs
    },
    build: (p, q) => {
      const tokens = {
        f: tok(`${p.f} Hz`, 'Fréquence du son émis', p.f, 'Hz'),
        v: tok('340 m/s', 'Célérité du son dans l’air', 340, 'm/s'),
        a: tok(`${nb(p.a, 2)} m`, 'Distance entre les deux haut-parleurs', p.a, 'm'),
        d1: tok(`${nb(p.d1, 2)} m`, 'Distance de l’auditeur au haut-parleur HP₁', p.d1, 'm'),
        d2: tok(`${nb(p.d2, 2)} m`, 'Distance de l’auditeur au haut-parleur HP₂', p.d2, 'm'),
        W: tok(`${p.W} W`, 'Puissance électrique de chaque haut-parleur', p.W, 'W'),
      };
      const lam = 340 / p.f, dl = p.d2 - p.d1, ratio = dl / lam;
      const debut = ['Deux haut-parleurs identiques, de puissance ', T('W'), ' chacun et distants de ', T('a'), ', sont alimentés en phase par le même générateur et émettent un son pur de fréquence ', T('f'), ' ; la célérité du son est ', T('v'), '. Un auditeur est à ', T('d1'), ' de HP₁ et à ', T('d2'), ' de HP₂. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la longueur d’onde du son ?'],
        utiles: ['v', 'f'], raisons: { a: 'La distance entre les haut-parleurs ne sert pas à calculer la longueur d’onde.', d1: 'Les distances de l’auditeur aux haut-parleurs ne servent pas à calculer λ.', d2: 'Les distances de l’auditeur aux haut-parleurs ne servent pas à calculer λ.', W: 'La puissance électrique n’intervient pas dans la longueur d’onde.' },
        cherche: { bonne: 'La longueur d’onde λ du son (en m)', faux: ['La différence de chemin δ (en m)', 'La période T du son (en s)', 'Le nombre de lignes de silence (sans unité)'] },
        manque: null, solution: { txt: 'λ = frac(v|f)', val: lam, u: 'm' } };
      return { tokens, derivees: [{ id: 'lam', nom: 'Longueur d’onde du son', expr: 'λ = frac(v|f)', val: lam, u: 'm' }, { id: 'dl', nom: 'Différence de chemin en P', expr: 'δ = d₂ − d₁', val: dl, u: 'm' }], texte: [...debut, 'L’interférence en P est-elle constructive ou destructive ?'],
        utiles: ['d1', 'd2', 'v', 'f'], raisons: { a: 'La distance entre les haut-parleurs est déjà prise en compte dans d₁ et d₂ : elle ne sert plus.', W: 'La puissance ne décide pas de la nature de l’interférence.' },
        cherche: { bonne: 'Le nombre de longueurs d’onde dans δ (sans unité)', faux: ['Le niveau d’intensité sonore reçu en P (en dB)', 'La période T du son, calculée à partir de f (en s)', 'Le déphasage exprimé en degrés (sans conversion)'] },
        manque: null, solution: { txt: 'frac(δ|λ), avec δ = d₂ − d₁ et λ = frac(v|f) : entier, constructive ; demi-entier, destructive', val: ratio, u: '' } };
    },
  },
  // ───────────────────────────── Intensité sonore, niveau d'intensité et atténuation (TG, sim 211) : repérer les données utiles
  {
    id: 'isn-sapp-niveau', domaine: 'Intensité sonore, niveau d’intensité et atténuation', titre: 'Un concert en plein air', noms: ['Niveau sonore à la distance d', 'Niveau sonore derrière la paroi'],
    gen: () => ({ P: tire([2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3]), d: tire([2, 4, 5, 8, 10]), f: tire([250, 500, 1000, 2000]), m: tire([8, 12, 20]), T: tire([18, 20, 22]), L1: tire([70, 75, 80, 85]), A: tire([25, 35, 50]), e: tire([6, 10, 20]) }),
    build: epure((p, q) => {
      const tokens = {
        P: tok(`${sciR(p.P)} W`, 'Puissance acoustique émise par la source', p.P, 'W'),
        d: tok(`${p.d} m`, 'Distance entre la source et le sonomètre', p.d, 'm'),
        I0: tok('1,0 × 10⁻¹² W·m⁻²', 'Intensité sonore de référence (seuil d’audibilité)', 1e-12, 'W·m⁻²'),
        f: tok(`${p.f} Hz`, 'Fréquence du son émis', p.f, 'Hz'),
        m: tok(`${p.m} kg`, 'Masse de l’enceinte', p.m, 'kg'),
        T: tok(`${p.T} °C`, 'Température de l’air', p.T, '°C'),
        L1: tok(`${p.L1} dB`, 'Niveau mesuré juste avant la paroi', p.L1, 'dB'),
        A: tok(`${p.A} dB`, 'Atténuation par absorption de la paroi', p.A, 'dB'),
        e: tok(`${p.e} cm`, 'Épaisseur de la paroi', p.e, 'cm'),
      };
      const debut0 = ['Une enceinte de masse ', T('m'), ', assimilée à une source ponctuelle isotrope, émet en champ libre, à la fréquence ', T('f'), ', une puissance acoustique ', T('P'), '. L’air est à ', T('T'), ' et l’intensité de référence vaut ', T('I0'), '. Un sonomètre est placé à ', T('d'), ' de la source. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut0, 'Quel est le niveau d’intensité sonore indiqué par le sonomètre ?'], utiles: ['P', 'd', 'I0'],
        raisons: { f: 'La fréquence n’intervient ni dans I = frac(P|4π d²) ni dans L = 10 × log(frac(I|I₀)) : le modèle étudié ici est sans pondération.', m: 'La masse de l’enceinte n’a aucun rôle dans la propagation du son dans l’air.', T: 'La température de l’air n’intervient pas dans le modèle du champ libre (pas d’absorption par l’air).' },
        cherche: { bonne: 'Le niveau sonore L au sonomètre (en dB)', faux: ['La puissance électrique de l’enceinte (en W)', 'La longueur d’onde du son émis (en m)', 'La durée d’exposition admissible (en min)'] },
        manque: null, solution: { txt: 'L = 10 × log(frac(I|I₀)) avec I = frac(P|4π d²)', val: M_ISN.niveauSource(p.P, p.d), u: 'dB' } };
      return { tokens, derivees: [], texte: ['Un sonomètre placé juste avant une paroi de ', T('e'), ' d’épaisseur indique ', T('L1'), '. L’atténuation par absorption de cette paroi vaut ', T('A'), '. Un second sonomètre est placé juste après la paroi. Quel niveau indique-t-il ?'], utiles: ['L1', 'A'],
        raisons: { e: 'L’épaisseur est déjà prise en compte dans l’atténuation A fournie : on ne s’en sert pas pour calculer le niveau.' },
        cherche: { bonne: 'Le niveau L derrière la paroi (en dB)', faux: ['La puissance acoustique de la source (en W)', 'L’intensité sonore avant la paroi (en W·m⁻²)', 'La fréquence du son transmis (en Hz)'] },
        manque: null, solution: { txt: 'L(sortie) = L(entrée) − A', val: p.L1 - p.A, u: 'dB' } };
    }),
  },
  // ───────────────────────────── Niveau sonore et dangers de l'exposition (2GT, sim 192) : repérer les données utiles
  {
    id: 'son2gt-niv-sapp-ecart', schema: () => ({ type: 'sonMicro' }), domaine: 'Niveau sonore (2GT)', titre: 'Deux sons mesurés : combien de fois plus intense ?', noms: ['Écart de niveau entre les deux sons', 'Nombre de fois plus intense'],
    gen: () => { const A = tire([30, 40, 50, 60]), delta = tire([20, 30, 40]); return { A, B: A + delta, delta, prix: tire([29, 39, 49]), t: tire([10, 20, 30]) }; },
    build: (p, q) => {
      const tokens = {
        LA: tok(`${p.A} dB`, 'Niveau sonore du son A', p.A, 'dB'),
        LB: tok(`${p.B} dB`, 'Niveau sonore du son B', p.B, 'dB'),
        prix: tok(`${p.prix} €`, 'Prix du sonomètre', p.prix, '€'),
        t: tok(`${p.t} s`, 'Durée de chaque enregistrement', p.t, 's'),
      };
      const raisons = { prix: 'Le prix de l’appareil ne dit rien sur la force des sons.', t: 'La durée de l’enregistrement ne change pas le niveau mesuré.' };
      const debut = ['Un élève mesure deux sons avec un sonomètre acheté ', T('prix'), '. Le son A a un niveau de ', T('LA'), ' et le son B un niveau de ', T('LB'), '. Chaque mesure dure ', T('t'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De combien de dB le niveau du son B dépasse-t-il celui du son A ?'],
        utiles: ['LA', 'LB'], raisons,
        cherche: { bonne: 'L’écart de niveau entre le son B et le son A (en dB)', faux: ['Le nombre de fois que B est plus intense que A', 'Le niveau du son B seul (en dB)', 'Le prix d’un décibel (en €)'] },
        manque: null, solution: { txt: 'écart = L_B − L_A', val: p.delta, u: 'dB' } };
      return { tokens, derivees: [{ id: 'ecart', nom: 'Écart de niveau', expr: 'L_B − L_A', val: p.delta, u: 'dB' }],
        texte: [...debut, 'Repère : + 10 dB correspond à une intensité environ 10 fois plus grande. Combien de fois le son B est-il plus intense que le son A ?'],
        utiles: ['LA', 'LB'], raisons,
        cherche: { bonne: 'Le nombre de fois que B est plus intense que A (sans unité)', faux: ['L’écart de niveau entre B et A (en dB)', 'Le rapport des deux niveaux frac(B|A)', 'La durée pendant laquelle B est dangereux (en min)'] },
        manque: null, solution: { txt: 'écart = L_B − L_A ; chaque tranche de 10 dB multiplie l’intensité par 10', val: SN.facteurIntensite(p.delta), u: 'fois' } };
    },
  },
  {
    id: 'son2gt-niv-sapp-duree', domaine: 'Niveau sonore (2GT)', titre: 'Une soirée bruyante : durée repère et durée passée', noms: ['Durée passée au-delà de la durée repère', 'Durée passée par rapport à la durée repère'],
    gen: () => ({ L: tire([91, 94, 97, 100]), k: tire([2, 3, 4]), age: tire([15, 16, 17]), prix: tire([8, 10, 12]) }),
    build: (p, q) => {
      const D = SN.dureeRepere(p.L), T1 = Math.round(p.k * D * 10) / 10;
      const tokens = {
        L: tok(`${p.L} dB`, 'Niveau sonore dans la salle', p.L, 'dB'),
        rep: tok(SN.formatDuree(D), 'Durée repère à ce niveau (tableau de prévention)', D, 'min'),
        t: tok(SN.formatDuree(T1), 'Durée passée dans la salle', T1, 'min'),
        age: tok(`${p.age} ans`, 'Âge de l’élève', p.age, 'ans'),
        prix: tok(`${p.prix} €`, 'Prix de l’entrée', p.prix, '€'),
      };
      const debut = ['Un tableau de prévention indique qu’à ', T('L'), ' la durée repère d’exposition est de ', T('rep'), '. Un élève de ', T('age'), ' passe ', T('t'), ' dans une salle de concert à ce niveau (entrée : ', T('prix'), '). '];
      const raisonsBase = { age: 'L’âge ne change pas la durée repère indiquée par le tableau.', prix: 'Le prix de l’entrée n’a aucun lien avec le niveau ni avec la durée.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de temps l’élève a-t-il passé au-delà de la durée repère ?'],
        utiles: ['t', 'rep'], raisons: { ...raisonsBase, L: 'Le niveau a déjà servi à lire la durée repère : une fois celle-ci connue, il ne sert plus au calcul.' },
        cherche: { bonne: 'Le temps passé au-delà de la durée repère (en min)', faux: ['Le rapport entre les deux durées (sans unité)', 'Le niveau sonore à ne pas dépasser (en dB)', 'La durée de vie des oreilles (en années)'] },
        manque: null, solution: { txt: 'temps au-delà du repère = durée passée − durée repère, les deux durées étant dans la même unité', val: T1 - D, u: 'min' } };
      return { tokens, derivees: [], texte: [...debut, 'La durée passée dans la salle est-elle plus longue ou plus courte que la durée repère ? Combien de fois ?'],
        utiles: ['t', 'rep'], raisons: { ...raisonsBase, L: 'Le niveau a déjà servi à lire la durée repère : une fois celle-ci connue, il ne sert plus au calcul.' },
        cherche: { bonne: 'Le rapport frac(durée passée|durée repère) (sans unité)', faux: ['La différence entre les deux durées (en min)', 'Le niveau sonore à ne pas dépasser (en dB)', 'Le nombre de concerts par an'] },
        manque: null, solution: { txt: 'rapport = frac(durée passée|durée repère), les deux durées étant dans la même unité', val: T1 / D, u: 'fois' } };
    },
  },
  // ───────────────────────────── Mesure : incertitude-type et résultat (2GT, sim 194) : repérer les données utiles
  {
    id: 'mes2gt-inc-sapp-incertitude', schema: () => ({ type: 'balance' }), domaine: 'Incertitude-type et résultat (2GT)', titre: 'Une série de pesées : incertitude-type et nombre de mesures', noms: ['Incertitude-type de la moyenne', 'Nombre de mesures pour diviser u par 2'],
    gen: () => { const id = tire(['piece', 'chute', 'concentration', 'longueur']), ss = { piece: [0.08, 0.1, 0.12, 0.15], chute: [0.05, 0.06, 0.08], concentration: [0.2, 0.25, 0.3], longueur: [0.2, 0.25, 0.3] };
      return { id, s: tire(ss[id]), n: tire([4, 9, 16, 25, 36]), prix: tire([12, 25, 40]), duree: tire([15, 20, 30]) }; },
    build: (p, q) => {
      const sit = MI2.SITUATIONS[p.id], un = sit.unite, u = p.s / Math.sqrt(p.n), m = sit.ref + 0.01;
      const tokens = {
        n: tok(`${p.n} fois`, 'Nombre de mesures de la série', p.n, ''),
        s: tok(`${nb(p.s, 2)} ${un}`, 'Écart-type s de la série', p.s, un),
        m: tok(`${nb(m, 2)} ${un}`, 'Moyenne de la série', m, un),
        prix: tok(`${p.prix} €`, 'Prix de l’instrument', p.prix, '€'),
        d: tok(`${p.duree} min`, 'Durée de l’expérience', p.duree, 'min'),
      };
      const raisons = { m: 'La moyenne donne la valeur centrale ; elle ne sert pas à calculer l’incertitude-type.', prix: 'Le prix de l’instrument ne dit rien sur la dispersion des mesures.', d: 'La durée de l’expérience ne change pas le calcul de u.' };
      const debut = ['Un élève répète ', T('n'), ' la mesure de ' + sit.mesurande + '. Il a payé son instrument ', T('prix'), '. La moyenne de la série est ', T('m'), ' et son écart-type est ', T('s'), '. L’expérience a duré ', T('d'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est l’incertitude-type u de la moyenne ?'],
        utiles: ['s', 'n'], raisons,
        cherche: { bonne: 'L’incertitude-type u de la moyenne (dans l’unité de la mesure)', faux: ['L’écart entre la moyenne et la valeur de référence', 'Le nombre de mesures à ajouter', 'Le prix d’une mesure (en €)'] },
        manque: null, solution: { txt: 'u = frac(s|sqrt(n))', val: u, u: un } };
      return { tokens, derivees: [{ id: 'u', nom: 'Incertitude-type actuelle', expr: 'u = frac(s|sqrt(n))', val: u, u: un }], texte: [...debut, 'Combien de mesures faudrait-il faire en tout pour que u soit deux fois plus petite, avec le même instrument et le même protocole ?'],
        utiles: ['n'], raisons: { ...raisons, s: 'Déjà utilisé pour calculer u : pour la diviser par 2, il suffit de savoir que cela demande 4 fois plus de mesures.' },
        cherche: { bonne: 'Le nombre total de mesures à faire (sans unité)', faux: ['Le nombre de mesures à ajouter à la série', 'La nouvelle incertitude-type (dans l’unité de la mesure)', 'Le temps nécessaire pour refaire l’expérience (en min)'] },
        manque: null, solution: { txt: 'diviser u par 2 demande 4 fois plus de mesures : n × 4', val: 4 * p.n, u: 'mesures' } };
    },
  },
  {
    id: 'mes2gt-inc-sapp-reference', domaine: 'Incertitude-type et résultat (2GT)', titre: 'Un résultat et une valeur de référence : la zone des valeurs', noms: ['Écart entre la valeur mesurée et la référence', 'Plus grande valeur de la zone [m − u ; m + u]'],
    gen: () => { const id = tire(['piece', 'chute', 'concentration', 'longueur']), sit = MI2.SITUATIONS[id], dm = { piece: [-0.04, -0.02, 0.03, 0.05], chute: [-0.04, -0.02, 0.02, 0.05], concentration: [-0.15, -0.08, 0.07, 0.15], longueur: [-0.18, -0.07, 0.08, 0.16] }, uu = { piece: [0.02, 0.03, 0.04], chute: [0.02, 0.03], concentration: [0.05, 0.08], longueur: [0.05, 0.08] };
      return { id, m: Number((sit.ref + tire(dm[id])).toFixed(2)), u: tire(uu[id]), n: tire([9, 16, 25]), an: tire([2024, 2025]) }; },
    build: (p, q) => {
      const sit = MI2.SITUATIONS[p.id], un = sit.unite, ref = sit.ref, ecart = Number(Math.abs(p.m - ref).toFixed(4)), haut = Number((p.m + p.u).toFixed(4));
      const tokens = {
        m: tok(`${nb(p.m, 2)} ${un}`, 'Valeur mesurée (moyenne)', p.m, un),
        u: tok(`${nb(p.u, 2)} ${un}`, 'Incertitude-type u', p.u, un),
        ref: tok(`${nb(ref, 2)} ${un}`, 'Valeur de référence', ref, un),
        n: tok(`${p.n} mesures`, 'Nombre de mesures de la série', p.n, ''),
        an: tok(`${p.an}`, 'Année de la mesure', p.an, ''),
      };
      const raisons = { n: 'Le nombre de mesures a déjà servi à calculer u : il ne sert plus ici.', an: 'L’année de la mesure n’intervient pas dans la comparaison.' };
      const debut = ['En ', T('an'), ', une série de ', T('n'), ' donne pour ' + sit.mesurande + ' une moyenne de ', T('m'), ', avec une incertitude-type ', T('u'), '. La valeur de référence est ', T('ref'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’écart entre la valeur mesurée et la valeur de référence ?'],
        utiles: ['m', 'ref'], raisons: { ...raisons, u: 'L’incertitude-type sert ensuite à juger si l’écart est grand ou petit ; elle ne sert pas à calculer l’écart.' },
        cherche: { bonne: 'L’écart |m − référence| (dans l’unité de la mesure)', faux: ['La plus grande valeur de la zone de valeurs raisonnables', 'Le nombre de mesures à ajouter', 'L’incertitude-type de la référence'] },
        manque: null, solution: { txt: 'écart = |m − valeur de référence|', val: ecart, u: un } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la plus grande valeur de la zone des valeurs raisonnables ?'],
        utiles: ['m', 'u'], raisons: { ...raisons, ref: 'La référence sert à comparer avec la zone, pas à la calculer.' },
        cherche: { bonne: 'La borne supérieure m + u de la zone (dans l’unité de la mesure)', faux: ['L’écart entre la valeur mesurée et la référence', 'La borne inférieure m − u de la zone', 'Le nombre de mesures à ajouter'] },
        manque: null, solution: { txt: 'borne supérieure = m + u', val: haut, u: un } };
    },
  },
  // ───────────────────────────── Seconde : le son, émission et propagation (vitesse du son)
  {
    id: 'son2gt-emis-sapp-orage', domaine: 'Son : émission et propagation (2GT)', titre: 'Un orage au loin : distance et retard du tonnerre', noms: ['Distance du premier éclair', 'Retard du tonnerre du deuxième éclair'],
    gen: () => ({ dt: tire([2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10]), dkm: tire([0.85, 1.2, 1.7, 2.5]), duree: tire([20, 30, 45]) }),
    build: epure((p, q) => {
      const tokens = {
        dt: tok(`${nb(p.dt, 1)} s`, 'Retard du tonnerre sur le premier éclair', p.dt, 's'),
        v: tok('340 m/s', 'Vitesse du son dans l’air', SON2.V_AIR, 'm/s'),
        c: tok('3,0 × 10⁸ m/s', 'Vitesse de la lumière', SON2.V_LUMIERE, 'm/s'),
        dkm: tok(`${nb(p.dkm, 2)} km`, 'Distance du deuxième éclair', p.dkm, 'km'),
        duree: tok(`${p.duree} min`, 'Durée de l’orage', p.duree, 'min'),
      };
      const debut = ['Pendant un orage, un observateur voit un éclair, puis entend le tonnerre ', T('dt'), ' plus tard. Dans l’air, le son va à ', T('v'), ' et la lumière à ', T('c'),
        '. L’orage dure ', T('duree'), '. Un deuxième éclair tombe ensuite à ', T('dkm'), ' de l’observateur. '];
      const commun = { c: 'La lumière arrive presque instantanément : seul le trajet du son compte dans le retard.', duree: 'La durée de l’orage ne change ni la vitesse du son ni la distance d’un éclair.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'À quelle distance de l’observateur le premier éclair est-il tombé ?'],
        utiles: ['dt', 'v'], raisons: { ...commun, dkm: 'Cette distance concerne le deuxième éclair, pas le premier.' },
        cherche: { bonne: 'La distance d du premier éclair (en m ou en km)', faux: ['La vitesse du son dans l’air (en m/s)', 'La durée de l’orage (en min)', 'Le temps mis par la lumière pour arriver (en s)'] },
        manque: null, solution: { txt: 'd = v × Δt, avec v = 340 m/s et Δt en secondes', val: SON2.V_AIR * p.dt, u: 'm' } };
      return { tokens, derivees: [{ id: 'dm', nom: 'Distance du deuxième éclair, en mètres', expr: 'd = d_km × 1 000', val: p.dkm * 1000, u: 'm' }], texte: [...debut, 'Au bout de combien de temps entend-il le tonnerre du deuxième éclair ?'],
        utiles: ['dkm', 'v'], raisons: { ...commun, dt: 'Ce retard concerne le premier éclair, pas le deuxième.' },
        cherche: { bonne: 'Le retard Δt du tonnerre du deuxième éclair (en s)', faux: ['La distance du premier éclair (en km)', 'La vitesse du son pour le deuxième éclair (en m/s)', 'La durée totale de l’orage (en min)'] },
        manque: null, solution: { txt: 'Δt = frac(d|v), avec d en mètres et v = 340 m/s', val: p.dkm * 1000 / SON2.V_AIR, u: 's' } };
    }),
  },
  {
    id: 'son2gt-emis-sapp-micros', domaine: 'Son : émission et propagation (2GT)', titre: 'Mesurer la vitesse du son avec deux micros', noms: ['Vitesse du son mesurée', 'Distance parcourue par le son pendant une durée donnée'],
    gen: () => { const d = tire([34, 51, 68, 85, 102]), v0 = tire([325, 335, 345, 355]); return { d, dt: SON2.arrondiSig(d / v0, 2), P: tire([20, 50, 100]), T: tire([15, 20, 25]), dt2: tire([2.0, 3.0, 5.0]) }; },
    build: epure((p, q) => {
      const v = p.d / p.dt;
      const tokens = {
        d: tok(`${p.d} m`, 'Distance entre les deux micros', p.d, 'm'),
        dt: tok(`${nb(p.dt, 2)} s`, 'Retard lu sur le chronomètre entre les deux micros', p.dt, 's'),
        P: tok(`${p.P} W`, 'Puissance électrique de l’amplificateur du haut-parleur', p.P, 'W'),
        T: tok(`${p.T} °C`, 'Température de l’air', p.T, '°C'),
        dt2: tok(`${nb(p.dt2, 1)} s`, 'Durée de propagation du son pendant une expérience plus longue', p.dt2, 's'),
      };
      const debut = ['Un haut-parleur, branché sur un amplificateur de ', T('P'), ', émet un son bref dans l’air à ', T('T'), '. Deux micros, distants de ', T('d'), ', sont reliés à un chronomètre qui affiche ', T('dt'), ' entre leurs deux déclenchements (mesures fictives). '];
      const raisons = { P: 'La puissance de l’amplificateur change le volume du son, pas sa vitesse : elle ne sert pas dans le calcul.', T: 'La température explique de petites variations de la vitesse du son, mais la mesure se fait avec d et Δt seulement.', dt2: 'Cette durée ne concerne que la deuxième question : elle ne sert pas à mesurer la vitesse.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la vitesse du son ainsi mesurée ?'],
        utiles: ['d', 'dt'], raisons,
        cherche: { bonne: 'La vitesse v du son (en m/s)', faux: ['La puissance de l’amplificateur (en W)', 'Le retard entre les deux micros (en s)', 'La température de l’air (en °C)'] },
        manque: null, solution: { txt: 'v = frac(d|Δt), avec d en mètres et Δt en secondes', val: v, u: 'm/s' } };
      return { tokens, derivees: [{ id: 'v', nom: 'Vitesse du son mesurée', expr: 'v = frac(d|Δt)', val: v, u: 'm/s' }], texte: [...debut, 'Avec cette vitesse, quelle distance le son parcourt-il pendant ', T('dt2'), ' ?'],
        utiles: ['d', 'dt', 'dt2'], raisons: { P: raisons.P, T: raisons.T },
        cherche: { bonne: 'La distance parcourue par le son pendant la durée donnée (en m)', faux: ['La vitesse du son (en m/s)', 'La puissance de l’amplificateur (en W)', 'La distance entre les deux micros (en m)'] },
        manque: null, solution: { txt: 'd′ = v × Δt′, avec v = frac(d|Δt) calculée avant', val: v * p.dt2, u: 'm' } };
    }),
  },
  {
    id: 'mrx-sapp-chocs', domaine: 'Mécanismes réactionnels et flèches courbes', titre: 'Compter les chocs dans une boîte : quelles données utiliser ?', noms: ['Nombre de chocs efficaces par seconde', 'Part des chocs qui sont efficaces'],
    gen: () => {
      const N = tire([200, 400, 500]), pc = tire([5, 10, 12, 20, 25]);
      return { N, E: N * pc / 100, D: tire([20, 40, 50, 60]), nB: tire([4, 10, 20]), th: tire([['basse', 1], ['moyenne', 2], ['élevée', 3]]) };      // E est un nombre entier de chocs
    },
    build: epure((p, q) => {
      const tokens = {
        D: tok(`${p.D} s`, 'Durée du comptage', p.D, 's'),
        N: tok(`${p.N} chocs`, 'Nombre total de chocs entre A et B comptés', p.N, 'chocs'),
        E: tok(`${p.E} chocs efficaces`, 'Nombre de chocs efficaces', p.E, 'chocs'),
        nB: tok(`${p.nB} entités B`, 'Nombre d’entités B dans la boîte', p.nB, 'entités'),
        th: tok(`${p.th[0]}`, 'Niveau de température du milieu (échelle relative du modèle : basse, moyenne, élevée)', p.th[1], ''),
      };
      const debut = ['Dans une boîte plane contenant des entités A et ', T('nB'), ', agitées à une température ', T('th'), ', on compte pendant ', T('D'), ' : ', T('N'), ' entre A et B, dont ', T('E'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de chocs efficaces y a-t-il par seconde ?'],
        utiles: ['E', 'D'], raisons: { N: 'Le nombre total de chocs ne sert pas : on ne cherche que les chocs efficaces, rapportés à la durée.', nB: 'Le nombre d’entités B explique la fréquence des chocs, mais il est déjà pris en compte dans les chocs comptés.', th: 'La température explique l’efficacité des chocs, mais elle est déjà prise en compte dans le comptage.' },
        cherche: { bonne: 'Les chocs efficaces par seconde (en s⁻¹)', faux: ['La part des chocs efficaces (en %)', 'La durée d’un choc (en s)', 'Le nombre total de chocs par seconde (en s⁻¹)'] },
        manque: null, solution: { txt: 'frac(E|D)', val: p.E / p.D, u: 's⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle part des chocs est efficace ?'],
        utiles: ['E', 'N'], raisons: { D: 'La durée du comptage ne change pas le rapport entre chocs efficaces et chocs totaux.', nB: 'Le nombre d’entités B n’intervient pas : la part se calcule avec les chocs comptés.', th: 'La température explique la valeur de la part efficace, mais on la calcule avec les chocs comptés.' },
        cherche: { bonne: 'La proportion de chocs efficaces parmi les chocs (en %)', faux: ['Le nombre de chocs efficaces par seconde (en s⁻¹)', 'La probabilité qu’une entité B soit présente (en %)', 'La température à laquelle les chocs deviennent efficaces (en °C)'] },
        manque: null, solution: { txt: 'frac(E|N) × 100', val: 100 * p.E / p.N, u: '%' } };
    }),
  },
  // ───────────────────────────── Transferts de H⁺ : acides carboxyliques, amines (TG, sim 188)
  {
    id: 'brn-sapp-lewis', domaine: 'Transferts de H⁺ : acides carboxyliques, amines et leurs formes conjuguées', titre: 'Schéma de Lewis d’un ion ou d’une molécule : quelles données utiliser ?', noms: ['Nombre total d’électrons de valence', 'Nombre de doublets à répartir'],
    gen: () => ({ e: tire(BRN.TOUTES_ESPECES.filter(x => x.graphe)).id, C: tire([0.10, 0.20, 0.50]) }),
    build: (p, q) => {
      const e = BRN.espece(p.e), VAL = BRN.VALENCE, MM = { C: 12.0, H: 1.0, N: 14.0, O: 16.0 }, NOM = { C: 'carbone', H: 'hydrogène', N: 'azote', O: 'oxygène' };
      const els = Object.keys(e.atomes).sort(), M = els.reduce((t, el) => t + e.atomes[el] * MM[el], 0), S = els.reduce((t, el) => t + e.atomes[el] * VAL[el], 0), nT = S - e.charge;
      const tokens = { M: tok(`${nb(M, 1)} g/mol`, 'Masse molaire de l’espèce', M, 'g/mol'), C: tok(`${nb(p.C, 2)} mol/L`, 'Concentration de la solution', p.C, 'mol/L') };
      const de = el => dNom(NOM[el]);
      els.forEach(el => { tokens['n' + el] = tok(`${e.atomes[el]} atome${e.atomes[el] > 1 ? 's' : ''} ${de(el)}`, `Nombre d’atomes ${de(el)} dans l’espèce`, e.atomes[el], '');
        tokens['v' + el] = tok(`${VAL[el]} électron${VAL[el] > 1 ? 's' : ''} de valence`, `Électrons de valence d’un atome ${de(el)} seul`, VAL[el], ''); });
      if (e.charge !== 0) tokens.q = tok(`${e.charge > 0 ? '+' : '−'}${Math.abs(e.charge)}`, 'Charge de l’espèce, en unités de charge élémentaire', e.charge, '');
      const liste = ids => ids.reduce((a, id, k) => [...a, ...(k === 0 ? [] : [k === ids.length - 1 ? ' et ' : ', ']), T(id)], []);
      const debut = [`On veut établir le schéma de Lewis de ${lNom(e.nom)} ${e.formule}. Cette espèce contient `, ...liste(els.map(el => 'n' + el)), '. ',
        ...els.reduce((a2, el, k) => [...a2, `${k === 0 ? 'Un' : ' ; un'} atome ${de(el)} seul possède `, T('v' + el)], []), '. ',
        ...(e.charge !== 0 ? ['La charge de l’espèce est ', T('q'), '. '] : ['L’espèce est neutre. ']), 'Sa masse molaire est ', T('M'), ' et on la dissout à la concentration ', T('C'), '. '];
      const utiles = [...els.map(el => 'n' + el), ...els.map(el => 'v' + el), ...(e.charge !== 0 ? ['q'] : [])];
      const raisons = { M: 'La masse molaire sert à passer d’une masse à une quantité de matière : elle n’intervient pas dans le comptage des électrons.', C: 'La concentration de la solution ne change pas le schéma de Lewis d’une entité.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le nombre total d’électrons de valence à répartir dans le schéma ?'], utiles, raisons,
        cherche: { bonne: 'Le nombre total n_T d’électrons de valence (sans unité)', faux: ['Le nombre de doublets non liants (sans unité)', 'La charge de l’espèce (en e)', 'Le nombre de liaisons du schéma (sans unité)'] },
        manque: null, solution: { txt: 'n_T = somme des électrons de valence des atomes seuls − charge de l’espèce', val: nT, u: '' } };
      return { tokens, derivees: [{ id: 'nT', nom: 'Nombre total n_T d’électrons de valence', expr: 'n_T = somme des électrons de valence des atomes seuls − charge', val: nT, u: '' }], texte: [...debut, 'Combien de doublets d’électrons faut-il répartir dans le schéma ?'], utiles, raisons,
        cherche: { bonne: 'Le nombre n_D de doublets à répartir (sans unité)', faux: ['Le nombre total d’électrons de valence (sans unité)', 'Le nombre de doublets liants seulement (sans unité)', 'La charge de l’espèce (en e)'] },
        manque: null, solution: { txt: 'n_D = frac(n_T|2)', val: nT / 2, u: '' } };
    },
  },
  {
    id: 'brn-sapp-melange', domaine: 'Transferts de H⁺ : acides carboxyliques, amines et leurs formes conjuguées', titre: 'Réaction d’un acide avec une base : quelles données utiliser ?', noms: ['Quantité d’ion carboxylate formé', 'Masse de l’ion ammonium formé'],
    gen: () => ({ ac: tire(['CH3COOH', 'HCOOH']), ba: tire(['NH3', 'CH3NH2']), C: tire([0.10, 0.20, 0.50]), V: tire([10, 20, 25, 40, 50]), Vb: tire([50, 100]), th: tire([20, 25]) }),
    build: (p, q) => {
      const MM = { C: 12.0, H: 1.0, N: 14.0, O: 16.0 }, mm = id => Object.entries(BRN.espece(id).atomes).reduce((t, [el, k]) => t + k * MM[el], 0);
      const cpl = BRN.COUPLES.find(c => c.acide === p.ac), cb = BRN.COUPLES.find(c => c.base === p.ba), carbox = BRN.espece(cpl.base), amm = BRN.espece(cb.acide);
      const n = p.C * p.V, m = n * mm(amm.id);
      const tokens = {
        C: tok(`${nb(p.C, 2)} mol/L`, `Concentration de la solution d’${BRN.espece(p.ac).nom}`, p.C, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume de la solution d’acide versé', p.V, 'mL'),
        Vb: tok(`${p.Vb} mL`, 'Volume de la solution de base, en excès', p.Vb, 'mL'),
        th: tok(`${p.th} °C`, 'Température du mélange', p.th, '°C'),
        Ma: tok(`${nb(mm(p.ac), 1)} g/mol`, `Masse molaire ${dNom(BRN.espece(p.ac).nom)}`, mm(p.ac), 'g/mol'),
        Mb: tok(`${nb(mm(amm.id), 1)} g/mol`, `Masse molaire ${dNom(amm.nom)}`, mm(amm.id), 'g/mol'),
      };
      const debut = [`On verse `, T('V'), ` d’une solution d’${BRN.espece(p.ac).nom} ${BRN.espece(p.ac).formule} de concentration `, T('C'), ` dans `, T('Vb'), ` d’une solution ${dNom(BRN.espece(p.ba).nom)} ${BRN.espece(p.ba).formule}, en excès, à `, T('th'), `. L’acide cède un ion H⁺ à la base, ce qui forme ${lNom(carbox.nom)} ${carbox.formule} et ${lNom(amm.nom)} ${amm.formule} (équation : 1 mole d’acide donne 1 mole de chaque produit ; la transformation est supposée totale). Masses molaires : `, T('Ma'), ` pour l’acide, `, T('Mb'), ` pour ${lNom(amm.nom)}. `];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, `Quelle quantité de matière d’${carbox.nom} se forme ?`], utiles: ['C', 'V'],
        raisons: { Vb: 'La base est en excès : l’acide est le réactif limitant, la quantité formée ne dépend pas du volume de base.', th: 'La température ne change pas la quantité formée quand la transformation est totale pour le réactif limitant.', Ma: 'La masse molaire sert à passer d’une masse à une quantité de matière : on part ici d’une concentration et d’un volume.', Mb: 'La masse molaire de l’ion ammonium servirait à calculer sa masse, pas la quantité d’ion carboxylate.' },
        cherche: { bonne: `La quantité n d’${carbox.nom} formé (en mmol)`, faux: [`La masse d’${carbox.nom} formé (en mg)`, 'La concentration de la solution de base (en mol/L)', 'Le volume de base nécessaire (en mL)'] },
        manque: null, solution: { txt: 'n = C × V (coefficients 1 pour 1 dans l’équation)', val: n, u: 'mmol' } };
      return { tokens, derivees: [{ id: 'n', nom: `Quantité d’${carbox.nom} formé (= quantité d’acide consommé)`, expr: 'n = C × V', val: n, u: 'mmol' }], texte: [...debut, `Quelle masse d’${amm.nom} se forme ?`], utiles: ['C', 'V', 'Mb'],
        raisons: { Vb: 'La base est en excès : le volume de base n’intervient pas dans la quantité formée.', th: 'La température ne change pas la masse formée ici : on la calcule avec la quantité de matière et la masse molaire.', Ma: 'La masse molaire de l’acide ne sert pas : on cherche la masse de l’ion ammonium, pas celle de l’acide.' },
        cherche: { bonne: `La masse m d’${amm.nom} formé (en mg)`, faux: [`La quantité d’${amm.nom} formé (en mmol)`, 'La masse d’acide consommé (en mg)', 'La concentration finale en ions (en mol/L)'] },
        manque: null, solution: { txt: 'm = n × M, avec n = C × V (1 mole d’acide donne 1 mole d’ion)', val: m, u: 'mg' } };
    },
  },
  // ───────────────────────────── Mesure : variabilité, histogramme, moyenne et écart-type (2GT, sim 193) : repérer les données utiles
  {
    id: 'mes2gt-var-sapp-moyenne', domaine: 'Variabilité de la mesure (2GT)', titre: 'Cinq chutes de bille chronométrées : moyenne et écart à la moyenne', noms: ['Moyenne de la série de durées', 'Écart entre la plus grande durée et la moyenne'],
    gen: () => {
      for (let essai = 0; essai < 200; essai++) {
        const centre = tire([0.55, 0.6, 0.65]), v = Array.from({ length: 5 }, () => Math.round((centre + (Math.random() - 0.5) * 0.16) * 100) / 100);
        const m = v.reduce((a, b) => a + b, 0) / 5;
        if (new Set(v).size === 5 && v.every(x => Math.abs(x - m) > 0.004)) return { v, H: tire([1.2, 1.5, 1.8, 2]), prix: tire([8, 12, 15]) };
      }
      return { v: [0.58, 0.64, 0.61, 0.55, 0.66], H: 1.8, prix: 12 };
    },
    build: (p, q) => {
      const m = p.v.reduce((a, b) => a + b, 0) / 5, max = Math.max(...p.v);
      const tokens = {
        H: tok(`${nb(p.H, 2)}\u00a0m`, 'Hauteur de chute de la bille', p.H, 'm'),
        prix: tok(`${p.prix}\u00a0€`, 'Prix du chronomètre', p.prix, '€'),
        ...Object.fromEntries(p.v.map((x, i) => [`t${i + 1}`, tok(`${nb(x, 2)}\u00a0s`, `Durée de chute n° ${i + 1}`, x, 's')])),
      };
      const debut = ['Un élève lâche une bille de ', T('H'), ' de haut et chronomètre cinq fois sa chute, avec un chronomètre à ', T('prix'), ' : ', T('t1'), ' ; ', T('t2'), ' ; ', T('t3'), ' ; ', T('t4'), ' ; ', T('t5'), '. '];
      const raisons = { H: 'La hauteur sert à calculer la durée théorique de la chute, pas à résumer les cinq mesures.', prix: 'Le prix de l’appareil ne change pas les valeurs mesurées.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la durée moyenne de chute ?'], utiles: ['t1', 't2', 't3', 't4', 't5'], raisons,
        cherche: { bonne: 'La moyenne des cinq durées mesurées (en s)', faux: ['Le nombre de mesures de la série (sans unité)', 'La plus grande durée de la série (en s)', 'Le prix d’une mesure (en €)'] },
        manque: null, solution: { txt: 'moyenne = frac(somme des cinq durées|5)', val: m, u: 's' } };
      return { tokens, derivees: [{ id: 'moy', nom: 'Moyenne des cinq durées', expr: 'frac(somme des durées|5)', val: m, u: 's' }], texte: [...debut, 'De combien la plus grande durée dépasse-t-elle la moyenne des cinq durées ?'], utiles: ['t1', 't2', 't3', 't4', 't5'], raisons,
        cherche: { bonne: 'L’écart entre la plus grande durée et la moyenne (en s)', faux: ['La différence entre la plus grande et la plus petite durée (en s)', 'La moyenne des cinq durées (en s)', 'Le rapport entre la plus grande durée et la hauteur (en s/m)'] },
        manque: null, solution: { txt: 'écart = plus grande durée − moyenne', val: max - m, u: 's' } };
    },
  },
  {
    id: 'mes2gt-var-sapp-histo', domaine: 'Variabilité de la mesure (2GT)', titre: 'Un histogramme de gouttes : lire les effectifs', noms: ['Nombre de mesures dans deux classes voisines', 'Part des mesures dans la classe centrale'],
    gen: () => ({ e: tire([[2, 5, 9, 6, 3], [1, 4, 10, 7, 3], [3, 6, 8, 5, 3], [2, 6, 8, 5, 4]]), prix: tire([5, 9, 14]) }),
    build: (p, q) => {
      const [, e2, e3] = p.e, bornes = ['1,10', '1,15', '1,20', '1,25', '1,30', '1,35'];
      const tokens = { N: tok('25 mesures', 'Nombre total de mesures', 25, ''), prix: tok(`${p.prix}\u00a0€`, 'Prix du chronomètre', p.prix, '€'),
        ...Object.fromEntries(p.e.map((x, i) => [`e${i + 1}`, tok(`${x} mesures`, `Mesures de ${bornes[i]}\u00a0s à ${bornes[i + 1]}\u00a0s`, x, '')])) };
      const debut = ['Un élève chronomètre ', T('N'), ' la durée entre deux gouttes d’un robinet (chronomètre à ', T('prix'), ') et les range dans un histogramme, par classes de 0,05 s. De 1,10 s à 1,15 s : ', T('e1'), ' ; de 1,15 s à 1,20 s : ', T('e2'), ' ; de 1,20 s à 1,25 s : ', T('e3'), ' ; de 1,25 s à 1,30 s : ', T('e4'), ' ; de 1,30 s à 1,35 s : ', T('e5'), '. '];
      const pasClasse = 'Cette classe ne fait pas partie de la zone demandée.';
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien de mesures sont comprises entre 1,15 s et 1,25 s ?'], utiles: ['e2', 'e3'],
        raisons: { N: 'Le nombre total n’est pas nécessaire pour additionner deux barres voisines.', prix: 'Le prix de l’appareil ne dit rien sur les mesures.', e1: pasClasse, e4: pasClasse, e5: pasClasse },
        cherche: { bonne: 'Le nombre de mesures dans les classes de 1,15 s à 1,25 s (sans unité)', faux: ['Le nombre de mesures dans la classe la plus haute seulement', 'La durée moyenne entre deux gouttes (en s)', 'Le nombre de classes de l’histogramme'] },
        manque: null, solution: { txt: 'effectif de la classe de 1,15 à 1,20 + effectif de la classe de 1,20 à 1,25', val: e2 + e3, u: 'mesures' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle part des mesures (en %) se trouve dans la classe centrale, de 1,20 s à 1,25 s ?'], utiles: ['e3', 'N'],
        raisons: { prix: 'Le prix de l’appareil ne dit rien sur la répartition des mesures.', e1: 'Cette classe n’est pas la classe centrale.', e2: 'Cette classe n’est pas la classe centrale.', e4: 'Cette classe n’est pas la classe centrale.', e5: 'Cette classe n’est pas la classe centrale.' },
        cherche: { bonne: 'La part des mesures de la classe centrale (en %)', faux: ['Le nombre de mesures de la classe centrale (sans unité)', 'La largeur d’une classe (en s)', 'La durée moyenne entre deux gouttes (en s)'] },
        manque: null, solution: { txt: 'part = frac(effectif de la classe centrale|nombre total de mesures) × 100', val: e3 / 25 * 100, u: '%' } };
    },
  },
  // ───────────────────────────── Optimisation d'une étape de synthèse : vitesse et rendement (TG, sim 189)
  {
    id: 'opt-sapp-rendement', domaine: 'Optimisation d’une étape de synthèse : vitesse et rendement', titre: 'Rendement d’une synthèse d’ester : quelles données utiliser ?', noms: ['Quantité maximale d’ester', 'Rendement de la synthèse'],
    gen: () => {
      const a = tire([0.10, 0.20, 0.25, 0.40]), b = tire([0.15, 0.30, 0.50, 0.60].filter(x => x !== a && Math.max(a, x) / Math.min(a, x) >= 1.25)), mn = Math.min(a, b);
      return { a, b, ob: Number((tire([0.55, 0.60, 0.65, 0.70, 0.75, 0.80]) * mn).toFixed(3)), T: tire([70, 75, 78]), d: tire([1, 2]) };
    },
    build: epure((p, q) => {
      const mn = Math.min(p.a, p.b);
      const tokens = {
        a: tok(`${nb(p.a, 2)} mol`, 'Quantité d’acide éthanoïque introduit', p.a, 'mol'),
        b: tok(`${nb(p.b, 2)} mol`, 'Quantité d’éthanol introduit', p.b, 'mol'),
        ob: tok(`${nb(p.ob, 3)} mol`, 'Quantité d’ester isolée à la fin', p.ob, 'mol'),
        T: tok(`${p.T} °C`, 'Température du chauffage à reflux', p.T, '°C'),
        d: tok(`${p.d} h`, 'Durée du chauffage', p.d, 'h'),
      };
      const debut = ['On chauffe à reflux pendant ', T('d'), ', à ', T('T'), ', un mélange de ', T('a'), ' d’acide éthanoïque et de ', T('b'), ' d’éthanol, avec quelques gouttes d’acide sulfurique concentré. On isole ensuite ', T('ob'), ' d’éthanoate d’éthyle. Dans l’équation de la réaction, tous les coefficients valent 1. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle quantité maximale d’ester aurait-on pu obtenir si la transformation avait été totale ?'],
        utiles: ['a', 'b'], raisons: { ob: 'La quantité isolée est ce qu’on a obtenu, pas le maximum possible.', T: 'La température du chauffage agit sur la vitesse de la réaction, pas sur la quantité maximale.', d: 'La durée du chauffage ne fixe pas la quantité maximale d’ester.' },
        cherche: { bonne: 'La quantité maximale n_max d’ester (en mol)', faux: ['Le rendement de la synthèse (en %)', 'La quantité d’ester à l’équilibre (en mol)', 'La quantité d’éthanol restante à la fin (en mol)'] },
        manque: null, solution: { txt: 'n_max est la quantité du réactif limitant, celui dont la quantité est la plus faible (coefficients égaux à 1)', val: mn, u: 'mol' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le rendement de cette synthèse ?'],
        utiles: ['a', 'b', 'ob'], raisons: { T: 'La température du chauffage n’intervient pas dans le calcul du rendement.', d: 'La durée du chauffage n’intervient pas dans le calcul du rendement.' },
        cherche: { bonne: 'Le rendement η de la synthèse (en %)', faux: ['La quantité maximale d’ester (en mol)', 'La constante d’équilibre de la réaction (sans unité)', 'Le temps de demi-réaction (en min)'] },
        manque: null, solution: { txt: 'η = frac(ester obtenu|n_max) × 100, avec n_max donnée par le réactif limitant', val: 100 * p.ob / mn, u: '%' } };
    }),
  },
  {
    id: 'opt-sapp-exces', domaine: 'Optimisation d’une étape de synthèse : vitesse et rendement', titre: 'Ajout d’éthanol à l’équilibre : quelles données utiliser ?', noms: ['Quotient de réaction après l’ajout', 'Rendement à l’équilibre avant l’ajout'],
    gen: () => {
      // départ : n mol d'acide et r × n mol d'éthanol ; à l'équilibre (K = 4) l'avancement vaut 2n/3 (r = 1) ou 0,845 n (r = 2)
      const n = tire([0.40, 0.60, 0.80]), r = tire([1, 2]), x = Number(((r === 1 ? 2 / 3 : 0.845) * n).toFixed(3));
      return { n, r, m: Number((r * n).toFixed(3)), nA: Number((n - x).toFixed(3)), nB: Number((r * n - x).toFixed(3)), nE: x, aj: Number((tire([1, 2, 3]) * n / 2).toFixed(3)), T: tire([70, 75, 78]), d: tire([2, 3]) };
    },
    build: epure((p, q) => {
      const d3 = x => Number(x).toFixed(3).replace('.', ',');
      const tokens = {
        nA: tok(`${d3(p.nA)} mol`, 'Quantité d’acide à l’équilibre', p.nA, 'mol'),
        nB: tok(`${d3(p.nB)} mol`, 'Quantité d’éthanol à l’équilibre', p.nB, 'mol'),
        nE: tok(`${d3(p.nE)} mol`, 'Quantité d’ester à l’équilibre (idem pour l’eau)', p.nE, 'mol'),
        aj: tok(`${d3(p.aj)} mol`, 'Quantité d’éthanol ajoutée', p.aj, 'mol'),
        n: tok(`${d3(p.n)} mol`, 'Quantité initiale d’acide', p.n, 'mol'),
        m: tok(`${d3(p.m)} mol`, 'Quantité initiale d’éthanol', p.m, 'mol'),
        K: tok('K = 4', 'Constante d’équilibre de l’estérification', 4, ''),
        T: tok(`${p.T} °C`, 'Température du chauffage à reflux', p.T, '°C'),
        d: tok(`${p.d} h`, 'Durée du chauffage avant l’ajout', p.d, 'h'),
      };
      const Qr = (p.nE * p.nE) / (p.nA * (p.nB + p.aj));
      const debut = ['Une estérification (', T('K'), ') est menée à reflux, à ', T('T'), ', pendant ', T('d'), ', à partir de ', T('n'), ' d’acide et de ', T('m'), ' d’éthanol. À l’équilibre, le mélange contient ', T('nA'), ' d’acide, ', T('nB'), ' d’éthanol, et ', T('nE'), ' d’ester et d’eau. On ajoute alors ', T('aj'), ' d’éthanol. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le quotient de réaction Qr juste après l’ajout, avant toute évolution ?'],
        utiles: ['nA', 'nB', 'nE', 'aj'], raisons: { n: 'La quantité initiale a déjà servi à trouver la composition à l’équilibre : on utilise cette composition.', m: 'La quantité initiale d’éthanol a déjà servi à trouver la composition à l’équilibre : on utilise cette composition.', K: 'K sert à comparer Qr, pas à le calculer.', T: 'La température n’intervient pas dans le calcul de Qr.', d: 'La durée du chauffage n’intervient pas dans le calcul de Qr.' },
        cherche: { bonne: 'Le quotient Qr après l’ajout (sans unité)', faux: ['La constante d’équilibre K du mélange (sans unité)', 'Le rendement à l’équilibre (en %)', 'La quantité d’éthanol restante à la fin (en mol)'] },
        manque: null, solution: { txt: 'Qr = frac(n(ester) × n(eau)|n(acide) × n(éthanol)), avec n(éthanol) = quantité à l’équilibre + quantité ajoutée', val: Qr, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel était le rendement de la synthèse à l’équilibre, avant l’ajout ?'],
        utiles: ['nE', 'n'], raisons: { nA: 'La quantité d’acide restante ne donne pas directement le rendement : on compare l’ester formé à la quantité maximale.', nB: 'La quantité d’éthanol restante ne sert pas à calculer le rendement.', m: 'L’éthanol n’est pas le réactif limitant : la quantité maximale d’ester est fixée par l’acide.', aj: 'L’ajout d’éthanol a lieu après : il ne change pas le rendement avant l’ajout.', K: 'K a servi à établir la composition à l’équilibre, déjà donnée.', T: 'La température n’intervient pas dans le calcul du rendement.', d: 'La durée du chauffage n’intervient pas dans le calcul du rendement.' },
        cherche: { bonne: 'Le rendement à l’équilibre avant l’ajout (en %)', faux: ['Le rendement après l’ajout d’éthanol (en %)', 'Le quotient de réaction à l’équilibre (sans unité)', 'La quantité d’ester formée par l’ajout (en mol)'] },
        manque: null, solution: { txt: 'η = frac(n(ester)|n_max) × 100, avec n_max égale à la quantité initiale d’acide (réactif limitant)', val: 100 * p.nE / p.n, u: '%' } };
    }),
  },
  // ───────────────────────────── Stratégie de synthèse multi-étapes et synthèses écoresponsables (TG, sim 210)
  {
    id: 'str-sapp-rendement', domaine: 'Stratégie de synthèse multi-étapes et synthèses écoresponsables', titre: 'Rendement global d’une synthèse en deux étapes : quelles données utiliser ?', noms: ['Rendement global de la synthèse', 'Quantité de produit final'],
    gen: () => ({ e1: tire([70, 75, 80, 85, 90]), e2: tire([50, 60, 65, 70, 75]), n0: tire([0.20, 0.40, 0.50, 0.80]), T1: tire([60, 70, 80]), T2: tire([100, 110, 120]) }),
    build: epure((p, q) => {
      const d2 = x => Number(x).toFixed(2).replace('.', ',');
      const tokens = {
        e1: tok(`${p.e1} %`, 'Rendement de l’étape 1', p.e1, '%'),
        e2: tok(`${p.e2} %`, 'Rendement de l’étape 2', p.e2, '%'),
        n0: tok(`${d2(p.n0)} mol`, 'Quantité de réactif de départ', p.n0, 'mol'),
        T1: tok(`${p.T1} °C`, 'Température de l’étape 1', p.T1, '°C'),
        T2: tok(`${p.T2} °C`, 'Température de l’étape 2', p.T2, '°C'),
      };
      const debut = ['Une synthèse en deux étapes part de ', T('n0'), ' de réactif ; les coefficients stœchiométriques valent tous 1. L’étape 1, menée à ', T('T1'), ', a un rendement de ', T('e1'), ' ; l’étape 2, menée à ', T('T2'), ', a un rendement de ', T('e2'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le rendement global de la synthèse ?'],
        utiles: ['e1', 'e2'], raisons: { n0: 'La quantité de départ sert à calculer une quantité de produit, pas un rendement.', T1: 'La température de l’étape n’intervient pas dans le calcul d’un rendement global.', T2: 'La température de l’étape n’intervient pas dans le calcul d’un rendement global.' },
        cherche: { bonne: 'Le rendement global de la synthèse (en %)', faux: ['La quantité de produit final obtenue (en mol)', 'Le rendement moyen des deux étapes (en %)', 'La température moyenne de la synthèse (en °C)'] },
        manque: null, solution: { txt: 'η global = η₁ × η₂, les rendements étant écrits comme des nombres compris entre 0 et 1', val: p.e1 * p.e2 / 100, u: '%' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de produit final obtient-on ?'],
        utiles: ['n0', 'e1', 'e2'], raisons: { T1: 'La température de l’étape n’intervient pas dans le calcul d’une quantité de produit.', T2: 'La température de l’étape n’intervient pas dans le calcul d’une quantité de produit.' },
        cherche: { bonne: 'La quantité de produit final (en mol)', faux: ['Le rendement global de la synthèse (en %)', 'La quantité de réactif restant à la fin (en mol)', 'La quantité obtenue à l’étape 1 seulement (en mol)'] },
        manque: null, solution: { txt: 'n final = n départ × η₁ × η₂ (rendements écrits entre 0 et 1, coefficients égaux à 1)', val: p.n0 * p.e1 * p.e2 / 10000, u: 'mol' } };
    }),
  },
  {
    id: 'str-sapp-dechets', domaine: 'Stratégie de synthèse multi-étapes et synthèses écoresponsables', titre: 'Déchets d’une synthèse : quelles données utiliser ?', noms: ['Masse de déchets pour une préparation', 'Déchets par kilogramme de produit'],
    gen: () => ({ k1: tire([1.5, 2.0, 2.5, 3.0]), k2: tire([1.0, 1.5, 2.0]), m: tire([100, 200, 250, 400]), eta: tire([57, 65, 70]), T: tire([100, 110]) }),
    build: epure((p, q) => {
      const d1 = x => Number(x).toFixed(1).replace('.', ',');
      const tokens = {
        k1: tok(`${d1(p.k1)} kg`, 'Déchets de l’étape 1, pour 1,0 kg de produit final', p.k1, 'kg'),
        k2: tok(`${d1(p.k2)} kg`, 'Déchets de l’étape 2, pour 1,0 kg de produit final', p.k2, 'kg'),
        m: tok(`${p.m} g`, 'Masse de produit final à préparer', p.m, 'g'),
        eta: tok(`${p.eta} %`, 'Rendement global de la synthèse', p.eta, '%'),
        T: tok(`${p.T} °C`, 'Température de l’étape 2', p.T, '°C'),
      };
      const debut = ['Une voie de synthèse en deux étapes produit ', T('k1'), ' de déchets à l’étape 1 et ', T('k2'), ' à l’étape 2, pour 1,0 kg de produit final obtenu. Son rendement global est de ', T('eta'), ' et l’étape 2 est menée à ', T('T'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, ['On veut préparer ', T('m'), ' de produit final. Quelle masse de déchets la synthèse produit-elle ?']].flat(),
        utiles: ['k1', 'k2', 'm'], raisons: { eta: 'Le rendement global est déjà pris en compte dans les déchets donnés par kg de produit obtenu.', T: 'La température n’intervient pas dans le calcul d’une masse de déchets.' },
        cherche: { bonne: 'La masse de déchets pour cette préparation (en g)', faux: ['La masse de déchets de l’étape 1 seulement (en kg)', 'Le rendement global de la synthèse (en %)', 'La masse de produit obtenue à l’étape 1 (en g)'] },
        manque: null, solution: { txt: 'déchets = (déchets de l’étape 1 + déchets de l’étape 2, par kg de produit) × masse de produit en kg, puis conversion en g', val: (p.k1 + p.k2) * p.m, u: 'g' } };
      return { tokens, derivees: [], texte: [...debut, 'Quels sont les déchets totaux produits par la synthèse pour 1,0 kg de produit final ?'],
        utiles: ['k1', 'k2'], raisons: { m: 'La masse à préparer ne sert pas quand on raisonne pour 1,0 kg de produit.', eta: 'Le rendement global est déjà pris en compte dans les déchets donnés par kg de produit obtenu.', T: 'La température n’intervient pas dans le calcul d’une masse de déchets.' },
        cherche: { bonne: 'Les déchets totaux par kg de produit (en kg)', faux: ['La masse de déchets pour 100 g de produit (en g)', 'Le rendement global de la synthèse (en %)', 'Les déchets de l’étape 2 seulement (en kg)'] },
        manque: null, solution: { txt: 'déchets totaux = déchets de l’étape 1 + déchets de l’étape 2', val: p.k1 + p.k2, u: 'kg' } };
    }),
  },
  // ───────────────────────────── Modification de la chaîne carbonée (TG, sim 241)
  {
    id: 'chc-sapp-carbone', domaine: 'Modification de la chaîne carbonée', titre: 'Atomes de carbone du produit d’une addition d’organomagnésien : quelles données utiliser ?', noms: ['Atomes de carbone de l’alcool formé', 'Atomes de carbone perdus ou gagnés par rapport au bromoalcane'],
    gen: () => ({ n1: tire([2, 3, 4]), n2: tire([2, 3, 4]), e1: tire([80, 85, 90]), e2: tire([60, 65, 70, 75]), T: tire([20, 25, 35]) }),
    build: epure((p, q) => {
      const tokens = {
        n1: tok(`${p.n1} atomes de carbone`, 'Atomes de carbone du bromoalcane R–Br (groupe R)', p.n1, ''),
        n2: tok(`${p.n2} atomes de carbone`, 'Atomes de carbone du composé carbonylé', p.n2, ''),
        e1: tok(`${p.e1} %`, 'Rendement de la formation de l’organomagnésien', p.e1, '%'),
        e2: tok(`${p.e2} %`, 'Rendement de l’addition suivie de l’hydrolyse', p.e2, '%'),
        T: tok(`${p.T} °C`, 'Température de l’addition', p.T, '°C'),
      };
      const debut = ['Un bromoalcane R–Br dont le groupe R compte ', T('n1'), ' est transformé en organomagnésien (rendement ', T('e1'), '). Celui-ci réagit à ', T('T'), ' avec un composé carbonylé de ', T('n2'), ', puis on hydrolyse (rendement ', T('e2'), '). '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Combien d’atomes de carbone compte l’alcool formé ?'],
        utiles: ['n1', 'n2'], raisons: { e1: 'Un rendement dit quelle part des réactifs est transformée, pas combien d’atomes de carbone contient le produit.', e2: 'Un rendement dit quelle part des réactifs est transformée, pas combien d’atomes de carbone contient le produit.', T: 'La température de la réaction ne change pas le nombre d’atomes de carbone du produit.' },
        cherche: { bonne: 'Le nombre d’atomes de carbone de l’alcool formé', faux: ['Le rendement global de la synthèse (en %)', 'Le nombre d’atomes de carbone du bromoalcane seul', 'Le nombre de liaisons C–C du composé carbonylé'] },
        manque: null, solution: { txt: 'nombre d’atomes de carbone du produit = atomes de carbone du groupe R + atomes de carbone du composé carbonylé (la nouvelle liaison C–C réunit les deux squelettes)', val: p.n1 + p.n2, u: 'atomes de carbone' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien d’atomes de carbone l’alcool compte-t-il de plus que le groupe R du bromoalcane ?'],
        utiles: ['n2'], raisons: { n1: 'On cherche un écart par rapport à R : le nombre d’atomes de carbone de R n’est pas la donnée utile, c’est celui du composé carbonylé qui s’ajoute.', e1: 'Un rendement ne dit rien du nombre d’atomes de carbone.', e2: 'Un rendement ne dit rien du nombre d’atomes de carbone.', T: 'La température ne change pas le nombre d’atomes de carbone du produit.' },
        cherche: { bonne: 'Le nombre d’atomes de carbone gagnés par R', faux: ['Le nombre total d’atomes de carbone de l’alcool formé', 'Le rendement global de la synthèse (en %)', 'Le nombre d’atomes de carbone du bromoalcane'] },
        manque: null, solution: { txt: 'atomes de carbone gagnés = atomes de carbone du composé carbonylé (ils s’ajoutent au groupe R, conservé)', val: p.n2, u: 'atomes de carbone' } };
    }),
  },
  {
    id: 'chc-sapp-masse', domaine: 'Modification de la chaîne carbonée', titre: 'Masse de butan-2-ol obtenue en deux étapes : quelles données utiliser ?', noms: ['Masse de butan-2-ol obtenue', 'Rendement global de la synthèse'],
    gen: () => ({ n0: tire([0.20, 0.25, 0.40, 0.50]), e1: tire([80, 85, 90]), e2: tire([60, 65, 70, 75]), T: tire([20, 25, 35]) }),
    build: epure((p, q) => {
      const d2 = x => Number(x).toFixed(2).replace('.', ',');
      const tokens = {
        n0: tok(`${d2(p.n0)} mol`, 'Quantité de bromoéthane de départ', p.n0, 'mol'),
        e1: tok(`${p.e1} %`, 'Rendement de la formation de l’organomagnésien', p.e1, '%'),
        e2: tok(`${p.e2} %`, 'Rendement de l’addition de l’éthanal suivie de l’hydrolyse', p.e2, '%'),
        M: tok('74,1 g/mol', 'Masse molaire du butan-2-ol', 74.1, 'g/mol'),
        T: tok(`${p.T} °C`, 'Température de l’addition', p.T, '°C'),
      };
      const debut = ['On part de ', T('n0'), ' de bromoéthane. Il est transformé en organomagnésien (rendement ', T('e1'), '), qui réagit à ', T('T'), ' avec l’éthanal ; après hydrolyse (rendement ', T('e2'), '), on obtient du butan-2-ol de masse molaire ', T('M'), '. Les coefficients stœchiométriques valent tous 1. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle masse de butan-2-ol obtient-on ?'],
        utiles: ['n0', 'e1', 'e2', 'M'], raisons: { T: 'La température de l’addition n’intervient pas dans le calcul d’une masse de produit.' },
        cherche: { bonne: 'La masse de butan-2-ol obtenue (en g)', faux: ['Le rendement global de la synthèse (en %)', 'La quantité de butan-2-ol obtenue à la première étape (en mol)', 'Le nombre d’atomes de carbone du butan-2-ol'] },
        manque: null, solution: { txt: 'm = n départ × η₁ × η₂ × M (rendements écrits entre 0 et 1, coefficients égaux à 1)', val: p.n0 * p.e1 * p.e2 / 10000 * 74.1, u: 'g' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le rendement global de la synthèse ?'],
        utiles: ['e1', 'e2'], raisons: { n0: 'La quantité de départ sert à calculer une quantité de produit, pas un rendement.', M: 'La masse molaire sert à convertir une quantité en masse, pas à calculer un rendement.', T: 'La température de l’addition n’intervient pas dans le calcul d’un rendement global.' },
        cherche: { bonne: 'Le rendement global de la synthèse (en %)', faux: ['La masse de butan-2-ol obtenue (en g)', 'Le rendement moyen des deux étapes (en %)', 'La quantité de butan-2-ol obtenue (en mol)'] },
        manque: null, solution: { txt: 'η global = η₁ × η₂, les rendements étant écrits comme des nombres compris entre 0 et 1', val: p.e1 * p.e2 / 100, u: '%' } };
    }),
  },
  // ───────────────────────────── Facteurs cinétiques, catalyse et choix d’un capteur (TG, sim 187)
  {
    id: 'cin-sapp-temperature', domaine: 'Facteurs cinétiques, catalyse et choix d’un capteur', titre: 'Deux expériences à deux températures', noms: ['Rapport des temps de demi-réaction', 'Durée gagnée pour atteindre la demi-réaction'],
    gen: () => { const t1 = tire([12, 18, 24, 30, 40]), dT = tire([10, 20]), f = dT === 10 ? 2 : 4; return { T1: tire([20, 25]), dT, t1, t2: Number((t1 / f).toFixed(1)), c0: tire([0.050, 0.10, 0.20]), V: tire([50, 100, 200]) }; },
    build: (p, q) => {
      const tokens = {
        T1: tok(`${p.T1} °C`, 'Température de l’expérience A', p.T1, '°C'),
        T2: tok(`${p.T1 + p.dT} °C`, 'Température de l’expérience B', p.T1 + p.dT, '°C'),
        t1: tok(`${nb(p.t1, 1)} min`, 'Temps de demi-réaction de l’expérience A', p.t1, 'min'),
        t2: tok(`${nb(p.t2, 1)} min`, 'Temps de demi-réaction de l’expérience B', p.t2, 'min'),
        c0: tok(`${nb(p.c0, 3)} mol/L`, 'Concentration initiale du réactif, la même dans les deux expériences', p.c0, 'mol/L'),
        V: tok(`${p.V} mL`, 'Volume du mélange, le même dans les deux expériences', p.V, 'mL'),
      };
      const debut = ['On suit la même transformation lente, sans catalyseur, dans deux expériences qui ne diffèrent que par la température : A à ', T('T1'), ' et B à ', T('T2'), '. Le mélange initial est le même (', T('c0'), ', ', T('V'), '). Les courbes donnent les temps de demi-réaction ', T('t1'), ' pour A et ', T('t2'), ' pour B. '];
      const raisons = { T1: 'La température sert à comparer les conditions, pas à calculer une durée ou un rapport de durées.', T2: 'La température sert à comparer les conditions, pas à calculer une durée ou un rapport de durées.', c0: 'La concentration initiale est identique dans les deux expériences : elle n’intervient pas dans la comparaison des temps de demi-réaction.', V: 'Le volume du mélange est le même dans les deux expériences et ne sert pas ici.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De quel facteur l’expérience B est-elle plus rapide que l’expérience A ?'],
        utiles: ['t1', 't2'], raisons,
        cherche: { bonne: 'Le rapport t½(A) divisé par t½(B) (sans unité)', faux: ['La différence des températures (en °C)', 'La vitesse volumique moyenne de disparition du réactif (en mol/L/min)', 'La quantité de matière de réactif consommée (en mol)'] },
        manque: null, solution: { txt: 'rapport = frac(t½(A)|t½(B)) : la transformation la plus rapide a le temps de demi-réaction le plus court', val: p.t1 / p.t2, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Combien de temps l’expérience B gagne-t-elle pour atteindre la demi-réaction ?'],
        utiles: ['t1', 't2'], raisons,
        cherche: { bonne: 'La différence t½(A) − t½(B) (en min)', faux: ['Le rapport des temps de demi-réaction (sans unité)', 'La durée totale de l’expérience B (en min)', 'La différence de température entre A et B (en °C)'] },
        manque: null, solution: { txt: 'durée gagnée = t½(A) − t½(B)', val: p.t1 - p.t2, u: 'min' } };
    },
  },
  {
    id: 'cin-sapp-catalyse', domaine: 'Facteurs cinétiques, catalyse et choix d’un capteur', titre: 'Un ajout qui accélère la transformation', noms: ['Facteur d’accélération', 'Quantité de catalyseur retrouvée à la fin'],
    gen: () => { const nI = tire([1.0, 2.0, 5.0]), nFe = tire([0.010, 0.020, 0.050]), ts = tire([12, 18, 25]), f = tire([5, 8, 10, 12]); return { nI, nFe, ts, ta: Number((ts / f).toFixed(1)) }; },
    build: (p, q) => {
      const tokens = {
        nI1: tok(`${nb(p.nI, 1)} mmol`, 'Quantité finale de produit formé sans l’ajout', p.nI, 'mmol'),
        nI2: tok(`${nb(p.nI, 1)} mmol`, 'Quantité finale de produit formé avec l’ajout', p.nI, 'mmol'),
        ts: tok(`${nb(p.ts, 1)} min`, 'Temps de demi-réaction sans l’ajout', p.ts, 'min'),
        ta: tok(`${nb(p.ta, 1)} min`, 'Temps de demi-réaction avec l’ajout', p.ta, 'min'),
        nA: tok(`${nb(p.nFe, 3)} mmol`, 'Quantité de l’espèce ajoutée, avant la transformation', p.nFe, 'mmol'),
        nB: tok(`${nb(p.nFe, 3)} mmol`, 'Quantité de l’espèce ajoutée, après la transformation (dosage)', p.nFe, 'mmol'),
      };
      const debut = ['On réalise deux fois la même transformation, à la même température : sans, puis avec l’ajout d’une espèce qui n’apparaît pas dans l’équation de la réaction. Le produit formé atteint la même quantité finale dans les deux cas (', T('nI1'), ' sans l’ajout, ', T('nI2'), ' avec). Les temps de demi-réaction sont ', T('ts'), ' sans l’ajout et ', T('ta'), ' avec. L’espèce ajoutée vaut ', T('nA'), ' avant la transformation et ', T('nB'), ' après, d’après un dosage. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'De quel facteur l’ajout accélère-t-il la transformation ?'],
        utiles: ['ts', 'ta'], raisons: { nI1: 'La quantité finale de produit est la même avec et sans l’ajout : elle ne mesure pas la rapidité.', nI2: 'La quantité finale de produit est la même avec et sans l’ajout : elle ne mesure pas la rapidité.', nA: 'La quantité de l’espèce ajoutée ne renseigne pas sur la rapidité de la transformation.', nB: 'La quantité de l’espèce ajoutée ne renseigne pas sur la rapidité de la transformation.' },
        cherche: { bonne: 'Le rapport t½(sans) divisé par t½(avec) (sans unité)', faux: ['La différence des quantités finales de produit (en mmol)', 'La quantité de l’espèce consommée (en mmol)', 'La durée totale de la transformation avec l’ajout (en min)'] },
        manque: null, solution: { txt: 'facteur = frac(t½(sans)|t½(avec))', val: p.ts / p.ta, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle quantité de l’espèce ajoutée retrouve-t-on à la fin de la transformation ?'],
        utiles: ['nB'], raisons: { nI1: 'La quantité de produit ne dit rien sur la quantité de l’espèce ajoutée.', nI2: 'La quantité de produit ne dit rien sur la quantité de l’espèce ajoutée.', ts: 'Les temps de demi-réaction ne donnent pas une quantité de matière.', ta: 'Les temps de demi-réaction ne donnent pas une quantité de matière.', nA: 'C’est la quantité avant la transformation : la question porte sur la quantité retrouvée après.' },
        cherche: { bonne: 'La quantité de l’espèce ajoutée à la fin (en mmol)', faux: ['La quantité de produit formé avec l’ajout (en mmol)', 'La quantité de l’espèce ajoutée qui a été consommée (en mmol)', 'La quantité de réactif restant à la fin (en mmol)'] },
        manque: null, solution: { txt: 'quantité retrouvée = valeur du dosage après la transformation (identique à la quantité ajoutée : l’espèce est un catalyseur)', val: p.nFe, u: 'mmol' } };
    },
  },
  // ───────────────────────────── Corps pur ou mélange (2GT, sim 196) : écart avec une référence, zone de la vraie température
  {
    id: 'pur2gt-sapp-flacon', schema: () => ({ type: 'becher', gauche: 'solvant' }), domaine: 'Corps purs et mélanges (2GT)', titre: 'Un flacon de solvant sans étiquette', noms: ['Écart avec la référence', 'Plus haute valeur possible de la température'],
    gen: () => { const id = tire(['acetone', 'ethanol', 'cyclohexane', 'eau']), prec = tire([0.5, 1, 1, 2]), ref = PUR.CORPS[id].Tvap; return { id, prec, lue: Math.round((ref + tire([-0.6, -0.4, -0.2, 0.2, 0.4, 0.6]) * prec) * 10) / 10, m: tire([20, 30, 50, 80, 120]), v: tire([50, 100, 250]) }; },
    build: epure((p, q) => {
      const c = PUR.CORPS[p.id], ref = c.Tvap;
      const tokens = {
        lue: tok(`${nb(p.lue, 1)}\u00a0°C`, 'Température lue pendant l’ébullition', p.lue, '°C'),
        ref: tok(`${ref}\u00a0°C`, `Température d’ébullition de référence ${c.de}`, ref, '°C'),
        prec: tok(`± ${nb(p.prec, 1)}\u00a0°C`, 'Précision du thermomètre', p.prec, '°C'),
        m: tok(`${p.m}\u00a0g`, 'Masse de liquide dans le flacon', p.m / 1000, 'kg'),
        v: tok(`${p.v}\u00a0mL`, 'Volume du flacon', p.v / 1000, 'L'),
      };
      const raisons = { m: 'La masse de liquide ne change pas la température d’ébullition d’un corps pur : elle n’intervient pas ici.', v: 'Le volume du flacon ne change pas la température d’ébullition : il n’intervient pas ici.', prec: 'La précision sert à décider si deux valeurs sont compatibles ; pour calculer un simple écart, on ne l’utilise pas.', ref: 'La référence sert à comparer ; la zone de la vraie température ne dépend que de la valeur lue et de la précision.', lue: 'La valeur lue est utilisée dans tous les calculs de cet exercice.' };
      const debut = ['On chauffe à la pression atmosphérique un flacon de ', T('v'), ' contenant ', T('m'), ' d’un liquide pur. Le thermomètre indique ', T('lue'), ' pendant l’ébullition, avec une précision de ', T('prec'), '. La température d’ébullition de référence ', c.de, ' est ', T('ref'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’écart entre la valeur lue et la valeur de référence ?'], utiles: ['lue', 'ref'], raisons: { m: raisons.m, v: raisons.v, prec: raisons.prec },
        cherche: { bonne: 'L’écart entre la valeur lue et la référence (en °C)', faux: ['La masse de liquide qui s’est évaporée pendant l’ébullition (en g)', 'La durée du chauffage nécessaire pour atteindre l’ébullition (en min)', 'La quantité d’énergie reçue par le liquide pendant l’ébullition (en kJ)'] },
        manque: null, solution: { txt: 'écart = |valeur lue − référence|', val: Math.abs(p.lue - ref), u: '°C' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la plus haute valeur que peut avoir la vraie température ?'], utiles: ['lue', 'prec'], raisons: { m: raisons.m, v: raisons.v, ref: raisons.ref },
        cherche: { bonne: 'La plus haute valeur possible de la vraie température (en °C)', faux: ['La plus haute valeur possible de la masse de liquide dans le flacon (en g)', 'La température qu’atteindrait la vapeur si on continuait de chauffer (en °C)', 'La différence entre la plus haute et la plus basse valeur du tableau (en °C)'] },
        manque: null, solution: { txt: 'valeur lue + précision', val: p.lue + p.prec, u: '°C' } };
    }),
  },
  {
    id: 'pur2gt-sapp-saumure', domaine: 'Corps purs et mélanges (2GT)', titre: 'Une eau qui bout trop haut', noms: ['Écart avec l’eau pure', 'Plus basse valeur possible de la température'],
    gen: () => ({ lue: tire([101.5, 102, 102.5, 103]), prec: tire([0.5, 0.5, 1]), sel: tire([50, 100, 150]), V: tire([250, 500, 1000]) }),
    build: epure((p, q) => {
      const tokens = {
        lue: tok(`${nb(p.lue, 1)}\u00a0°C`, 'Température lue pendant l’ébullition', p.lue, '°C'),
        ref: tok('100 °C', 'Température d’ébullition de référence de l’eau pure', 100, '°C'),
        prec: tok(`± ${nb(p.prec, 1)}\u00a0°C`, 'Précision du thermomètre', p.prec, '°C'),
        sel: tok(`${p.sel}\u00a0g`, 'Masse de sel dissous', p.sel / 1000, 'kg'),
        V: tok(`${p.V}\u00a0mL`, 'Volume de liquide', p.V / 1000, 'L'),
      };
      const raisons = { sel: 'La masse de sel dissous n’entre pas dans le calcul d’un écart ou d’une zone de valeurs : on exploite seulement les températures.', V: 'Le volume de liquide ne change pas la température d’ébullition lue : il n’intervient pas ici.', prec: 'La précision sert à décider si la valeur est compatible ; pour calculer un simple écart, on ne l’utilise pas.', ref: 'La référence sert à comparer ; la plus basse valeur de la vraie température ne dépend que de la valeur lue et de la précision.' };
      const debut = ['Dans un laboratoire, on fait bouillir ', T('V'), ' d’une eau dans laquelle on a dissous ', T('sel'), ' de sel. À la pression atmosphérique, le thermomètre indique ', T('lue'), ' pendant l’ébullition, avec une précision de ', T('prec'), '. La température d’ébullition de référence de l’eau pure est ', T('ref'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est l’écart entre la valeur lue et la référence de l’eau pure ?'], utiles: ['lue', 'ref'], raisons: { sel: raisons.sel, V: raisons.V, prec: raisons.prec },
        cherche: { bonne: 'L’écart entre la valeur lue et 100 °C (en °C)', faux: ['L’énergie qu’il faut apporter pour vaporiser toute l’eau salée (en kJ)', 'La masse d’eau qui s’est évaporée depuis le début de l’ébullition (en g)', 'La température qu’aurait l’eau pure à la même pression (en °C)'] },
        manque: null, solution: { txt: 'écart = valeur lue − référence', val: p.lue - 100, u: '°C' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la plus basse valeur que peut avoir la vraie température ?'], utiles: ['lue', 'prec'], raisons: { sel: raisons.sel, V: raisons.V, ref: raisons.ref },
        cherche: { bonne: 'La plus basse valeur possible de la vraie température (en °C)', faux: ['La valeur de la température d’ébullition de l’eau pure donnée en référence (en °C)', 'La température du liquide avant de commencer à le chauffer (en °C)', 'La plus basse température qu’atteindra le liquide en refroidissant (en °C)'] },
        manque: null, solution: { txt: 'valeur lue − précision', val: p.lue - p.prec, u: '°C' } };
    }),
  },
  ...OEIL2GT_SAPP,
  ...NOY2GT_SAPP,
  ...PVC_SAPP,
  ...PVR_SAPP,
  ...PVE_SAPP,
  ...LAS_SAPP,
  ...BAT_SAPP,
  ...JOU_SAPP,
  ...CHA_SAPP,
  ...SGN_SAPP,
  ...FRM_SAPP,
  ...MTR_SAPP,
  ...PDT_SAPP,
  ...LCV_SAPP,
  ...DFR_SAPP,
  ...CHH_SAPP,
  ...LPG_SAPP,
  ...FLP_SAPP,
  ...PXT_SAPP,
  ...GRV_SAPP,
  ...CEL_SAPP,
  ...NWR_SAPP,
  ...CLP_SAPP,
  ...FVI_SAPP,
  ...EUL_SAPP,
  ...PILP_SAPP,
  ...RPM_SAPP,
  ...RMNS_SAPP,
  ...UVS_SAPP,
  ...KSQ_SAPP,
  ...HYD_SAPP,
  ...TSOL_SAPP,
  ...FILT_SAPP,
  ...GAB_SAPP,
  ...AMP_SAPP,
  ...BIOT_SAPP,
  ...MESO_SAPP,
  ...STA_SAPP,
  ...OSL_SAPP,
  ...NUC2GT_SAPP,
  ...RHC_SAPP,
  ...ITT_SAPP,
  ...TGPB_SAPP,
  // ───────────────────────────── Dispersion par un prisme (2GT, sim 201) : repérer les données utiles pour un angle de réfraction
  {
    id: 'prisme2gt-sapp-angle', domaine: 'Dispersion de la lumière (2GT)', titre: 'Un rayon de couleur dans un prisme', noms: ['Angle i₂ dans le verre', 'Angle i₄ dans l’air'],
    gen: () => ({ nm: tire([400, 700]), i1: tire([50, 55, 60, 65, 70]), i3: tire([26, 28, 30, 32]), cote: tire([3, 4, 5]), dist: tire([40, 50, 60, 80]), puis: tire([1, 3, 5]) }),
    build: epure((p, q) => {
      const n = p.nm === 400 ? PRISME2GT.N_VIOLET : PRISME2GT.N_ROUGE, coul = p.nm === 400 ? 'violet' : 'rouge';
      const tokens = {
        i1: tok(`${p.i1} °`, 'Angle d’incidence sur la première face', p.i1, '°'),
        i3: tok(`${p.i3} °`, 'Angle d’incidence sur la seconde face, dans le verre', p.i3, '°'),
        n: tok(`${nb(n, 2)}`, `Indice du verre pour la couleur ${coul}`, n, ''),
        nm: tok(`${p.nm} nm`, 'Longueur d’onde du rayon', p.nm, 'nm'),
        cote: tok(`${p.cote} cm`, 'Côté du prisme', p.cote / 100, 'm'),
        dist: tok(`${p.dist} cm`, 'Distance du prisme à l’écran', p.dist / 100, 'm'),
        puis: tok(`${p.puis} mW`, 'Puissance du laser', p.puis / 1000, 'W'),
      };
      const raisons = { nm: 'La longueur d’onde sert à reconnaître la couleur ; le calcul de l’angle n’utilise que l’indice, déjà donné pour cette couleur.', cote: 'La taille du prisme ne change pas les angles : elle n’intervient pas ici.', dist: 'La distance à l’écran sert à placer la tache, pas à calculer un angle dans le prisme.', puis: 'La puissance du laser ne change pas les angles : elle n’intervient pas ici.', i1: 'L’angle d’incidence sur la première face est utilisé seulement pour l’angle i₂.', i3: 'L’angle d’incidence sur la seconde face est utilisé seulement pour l’angle i₄.' };
      const debut = ['Un laser de ', T('puis'), ' et de longueur d’onde ', T('nm'), ' (couleur ', coul, ') éclaire un prisme de ', T('cote'), ' de côté, placé à ', T('dist'), ' d’un écran. L’indice du verre pour cette couleur est ', T('n'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Le rayon arrive sur la première face avec un angle d’incidence de ', T('i1'), '. Quel est l’angle i₂ du rayon dans le verre ?'], utiles: ['i1', 'n'], raisons: { nm: raisons.nm, cote: raisons.cote, dist: raisons.dist, puis: raisons.puis },
        cherche: { bonne: 'L’angle i₂ du rayon dans le verre (en °)', faux: ['L’angle i₄ du rayon à la sortie du prisme (en °)', 'La distance entre la tache et le bord de l’écran (en cm)', 'La longueur d’onde du rayon après la traversée du verre (en nm)'] },
        manque: null, solution: { txt: 'sin i₂ = frac(sin i₁|n), puis sin⁻¹', val: PRISME2GT.angleRefracte(p.i1, n), u: '°' } };
      return { tokens, derivees: [], texte: [...debut, 'Dans le verre, le rayon arrive sur la seconde face avec un angle de ', T('i3'), '. Quel est l’angle i₄ du rayon dans l’air ?'], utiles: ['i3', 'n'], raisons: { nm: raisons.nm, cote: raisons.cote, dist: raisons.dist, puis: raisons.puis, i1: raisons.i1 },
        cherche: { bonne: 'L’angle i₄ du rayon dans l’air (en °)', faux: ['L’angle i₂ du rayon à l’entrée du prisme (en °)', 'La déviation du laser à cause du prisme (en cm)', 'La distance parcourue dans le verre par le rayon (en cm)'] },
        manque: null, solution: { txt: 'sin i₄ = n × sin i₃, puis sin⁻¹', val: PRISME2GT.angleSortie(p.i3, n), u: '°' } };
    }),
  },
  {
    id: 'prisme2gt-sapp-ecart', domaine: 'Dispersion de la lumière (2GT)', titre: 'Deux couleurs, un prisme', noms: ['Écart d’indice', 'Angle i₂ du rouge'],
    gen: () => ({ i1: tire([50, 55, 60, 65, 70]), dv: tire([57, 56, 55, 58]), puis: tire([2, 5, 10]), angle: tire([60]), lam: tire([40, 50]) }),
    build: epure((p, q) => {
      const tokens = {
        nv: tok(`${nb(PRISME2GT.N_VIOLET, 2)}`, 'Indice du verre pour le violet', PRISME2GT.N_VIOLET, ''),
        nr: tok(`${nb(PRISME2GT.N_ROUGE, 2)}`, 'Indice du verre pour le rouge', PRISME2GT.N_ROUGE, ''),
        i1: tok(`${p.i1} °`, 'Angle d’incidence sur la première face', p.i1, '°'),
        a: tok(`${p.angle} °`, 'Angle au sommet du prisme', p.angle, '°'),
        puis: tok(`${p.puis} W`, 'Puissance de la lampe', p.puis, 'W'),
        dv: tok(`${p.dv} °`, 'Déviation du violet', p.dv, '°'),
      };
      const raisons = { a: 'L’angle au sommet ne sert pas à calculer l’angle dans le verre à la première face.', puis: 'La puissance de la lampe ne change ni les indices ni les angles.', dv: 'La déviation du violet est une grandeur à la sortie : elle n’intervient pas dans le calcul à la première face.', i1: 'L’angle d’incidence ne sert pas à calculer un écart d’indice.', nv: 'L’indice du violet ne sert pas à calculer l’angle i₂ du rouge.', nr: 'Pour un écart d’indice, il faut les deux indices : le rouge est utile.' };
      const debut = ['Un prisme d’angle au sommet ', T('a'), ' est éclairé par une lampe de ', T('puis'), ' qui émet de la lumière blanche. L’indice du verre est ', T('nv'), ' pour le violet et ', T('nr'), ' pour le rouge. L’angle d’incidence est ', T('i1'), ' et le violet est dévié de ', T('dv'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la différence d’indice entre le violet et le rouge ?'], utiles: ['nv', 'nr'], raisons: { a: raisons.a, puis: raisons.puis, dv: raisons.dv, i1: raisons.i1 },
        cherche: { bonne: 'La différence entre l’indice du violet et celui du rouge', faux: ['La différence entre les angles de déviation des deux couleurs (en °)', 'La puissance reçue par le violet par rapport au rouge (en W)', 'Le rapport entre les angles d’incidence des deux couleurs'] },
        manque: null, solution: { txt: 'n(violet) − n(rouge)', val: PRISME2GT.N_VIOLET - PRISME2GT.N_ROUGE, u: '' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est l’angle i₂ du rayon rouge dans le verre ?'], utiles: ['i1', 'nr'], raisons: { a: raisons.a, puis: raisons.puis, dv: raisons.dv, nv: raisons.nv },
        cherche: { bonne: 'L’angle i₂ du rayon rouge dans le verre (en °)', faux: ['L’angle de déviation du rayon rouge à la sortie (en °)', 'L’angle entre le rayon violet et le rayon rouge (en °)', 'La somme des angles i₂ du rouge et du violet (en °)'] },
        manque: null, solution: { txt: 'sin i₂ = frac(sin i₁|n), puis sin⁻¹', val: PRISME2GT.angleRefracte(p.i1, PRISME2GT.N_ROUGE), u: '°' } };
    }),
  // ───────────────────────────── Loi de Newton et thermostat (TG, sim 212) : temps caractéristique et flux thermique initial
  },
  {
    id: 'thm-sapp-tasse', domaine: 'Loi de Newton et thermostat : température d’un système au cours du temps', titre: 'Une tasse de café qui refroidit', noms: ['Temps caractéristique de la tasse', 'Flux thermique initial'],
    gen: () => ({ m: tire([0.15, 0.20, 0.25, 0.30]), hS: tire([0.30, 0.45, 0.60]), T0: tire([70, 80, 90]), Te: tire([18, 20, 22]), P: tire([800, 1000, 2000]), g: tire([8, 10, 12]) }),
    build: (p, q) => {
      const tokens = {
        m: tok(`${nb(p.m, 2)} kg`, 'Masse de café dans la tasse', p.m, 'kg'),
        c: tok('4 180 J·kg⁻¹·K⁻¹', 'Capacité thermique massique du café (assimilé à de l’eau)', 4180, 'J·kg⁻¹·K⁻¹'),
        hS: tok(`${nb(p.hS, 2)} W·K⁻¹`, 'Produit h × S de la loi de Newton pour cette tasse', p.hS, 'W·K⁻¹'),
        T0: tok(`${p.T0} °C`, 'Température du café à l’instant initial', p.T0, '°C'),
        Te: tok(`${p.Te} °C`, 'Température de la pièce (thermostat)', p.Te, '°C'),
        P: tok(`${p.P} W`, 'Puissance de la bouilloire qui a chauffé l’eau', p.P, 'W'),
        g: tok(`${p.g} g`, 'Masse de café moulu utilisée', p.g, 'g'),
      };
      const debut = ['Pour préparer un café, on a chauffé de l’eau avec une bouilloire de puissance ', T('P'), ' et utilisé ', T('g'), ' de café moulu. La tasse contient ', T('m'), ' de café à ', T('T0'), ', assimilé à de l’eau (capacité thermique massique ', T('c'), '). Elle est posée dans une pièce à ', T('Te'), ' ; la loi de Newton est appliquée avec h × S = ', T('hS'), '. '];
      const raisonsComm = { P: 'La puissance de la bouilloire a servi à chauffer l’eau avant : elle n’intervient pas dans le refroidissement de la tasse.', g: 'La masse de café moulu est une donnée de préparation : le café est assimilé à de l’eau, de masse m.' };
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le temps caractéristique du refroidissement ?'], utiles: ['m', 'c', 'hS'], raisons: { ...raisonsComm, T0: 'Le temps caractéristique τ = frac(C|h × S) ne dépend pas de la température initiale.', Te: 'Le temps caractéristique ne dépend pas de la température de la pièce : elle fixe seulement la température finale.' },
        cherche: { bonne: 'Le temps caractéristique τ du refroidissement (en min)', faux: ['Le flux thermique initial reçu par le café (en W)', 'La variation de température pendant la première seconde (en K)', 'La température du café au bout d’une heure (en °C)'] },
        manque: null, solution: { txt: 'τ = frac(C|h × S) avec C = m × c, converti en minutes', val: p.m * 4180 / p.hS / 60, u: 'min' } };
      return { tokens, derivees: [], texte: [...debut, 'Quel est le flux thermique reçu par le café à l’instant initial ?'], utiles: ['hS', 'T0', 'Te'], raisons: { ...raisonsComm, m: 'La masse et la capacité thermique fixent C, donc τ, mais le flux φ = h × S × (T_ext − T) n’en dépend pas.', c: 'La capacité thermique massique sert à calculer C ; elle n’intervient pas dans l’expression du flux thermique.' },
        cherche: { bonne: 'Le flux thermique φ reçu à t = 0 (en W)', faux: ['Le temps caractéristique τ de la tasse (en min)', 'La capacité thermique C du café (en J·K⁻¹)', 'La température finale du café (en °C)'] },
        manque: null, solution: { txt: 'φ = h × S × (T_ext − T) avec T = T_0 : négatif, le café cède de l’énergie', val: p.hS * (p.Te - p.T0), u: 'W' } };
    },
  },
  // ───────────────────────────── Gaz parfait (TG, sim 215) : pression d'un gaz enfermé, masse volumique
  {
    id: 'gpf-sapp-ballon', schema: () => ({ type: 'piston', gaz: 'gaz dans un récipient' }), domaine: 'Gaz parfait : équation d’état et limites du modèle', titre: 'Un récipient de gaz de laboratoire', noms: ['Pression du gaz', 'Masse volumique du gaz'],
    gen: () => ({ n: tire([0.20, 0.50, 1.00, 2.00]), V: tire([5, 10, 20]), th: tire([17, 20, 27]), g: tire([{ nom: 'dioxygène', M: 32.0 }, { nom: 'diazote', M: 28.0 }, { nom: 'dioxyde de carbone', M: 44.0 }]), mR: tire([0.35, 0.50, 0.80]), P: tire([1.0, 2.0, 3.0, 5.0]), prix: tire([12, 18, 25]) }),
    build: (p, q) => {
      const Mtok = tok(`${nb(p.g.M, 1)} g·mol⁻¹`, `Masse molaire du ${p.g.nom}`, p.g.M, 'g·mol⁻¹'), THtok = tok(`${p.th} °C`, 'Température du gaz', p.th, '°C');
      if (q === 0) {
        const tokens = { n: tok(`${nb(p.n, 2)} mol`, 'Quantité de matière de gaz', p.n, 'mol'), V: tok(`${p.V} L`, 'Volume du récipient rigide', p.V, 'L'), th: THtok, M: Mtok, mR: tok(`${nb(p.mR, 2)} kg`, 'Masse du récipient vide', p.mR, 'kg') };
        return { tokens, derivees: [], texte: ['Un récipient rigide de ', T('V'), ' et de masse ', T('mR'), ' à vide contient ', T('n'), ' de ', p.g.nom, ' (masse molaire ', T('M'), ') à ', T('th'), '. Quelle est la pression du gaz ?'], utiles: ['n', 'V', 'th'],
          raisons: { M: 'La masse molaire sert à passer de la quantité de matière à la masse : elle n’intervient pas dans P × V = n × R × T.', mR: 'La masse du récipient vide ne dit rien sur le gaz qu’il contient : elle n’intervient pas dans le calcul de la pression.' },
          cherche: { bonne: 'La pression P du gaz piégé (en bar)', faux: ['La masse volumique du gaz (en kg·m⁻³)', 'La masse de gaz (en g)', 'Le volume molaire du gaz (en L·mol⁻¹)'] },
          manque: null, solution: { txt: 'P = frac(n × R × T|V), en unités SI, puis converti en bar', val: p.n * 8.314 * (p.th + 273.15) / (p.V * 1e-3) / 1e5, u: 'bar' } };
      }
      const tokens = { P: tok(`${nb(p.P, 1)} bar`, 'Pression du gaz', p.P, 'bar'), th: THtok, M: Mtok, V: tok(`${p.V} L`, 'Volume du récipient', p.V, 'L'), prix: tok(`${p.prix} €`, 'Prix de la recharge de gaz', p.prix, '€') };
      return { tokens, derivees: [], texte: ['Une recharge de ', p.g.nom, ' (masse molaire ', T('M'), ') coûte ', T('prix'), '. Le gaz, à ', T('th'), ' sous ', T('P'), ', occupe un récipient de ', T('V'), '. Quelle est la masse volumique du gaz ?'], utiles: ['P', 'th', 'M'],
        raisons: { V: 'La masse volumique d’un gaz parfait, ρ = frac(P × M|R × T), ne dépend pas de la taille du récipient.', prix: 'Le prix de la recharge n’a aucun rapport avec les propriétés physiques du gaz.' },
        cherche: { bonne: 'La masse volumique ρ du gaz (en kg·m⁻³)', faux: ['La quantité de matière de gaz (en mol)', 'La masse de gaz contenue dans le récipient (en g)', 'Le volume molaire du gaz (en L·mol⁻¹)'] },
        manque: null, solution: { txt: 'ρ = frac(P × M|R × T), avec P en Pa, M en kg·mol⁻¹, T en K', val: p.P * 1e5 * p.g.M * 1e-3 / (8.314 * (p.th + 273.15)), u: 'kg·m⁻³' } };
    },
  },
  // ───────────────────────────── Premier principe (TG, sim 216) : variation d'énergie interne, température finale
  {
    id: 'pp1-sapp-bloc', domaine: 'Premier principe : énergie interne, transferts et bilan d’énergie', titre: 'Un liquide chauffé et brassé', noms: ['Variation d’énergie interne', 'Température finale'],
    gen: () => ({ m: tire([0.50, 1.00, 2.00]), g: tire([{ nom: 'eau', c: 4180 }, { nom: 'huile', c: 2000 }]), th: tire([15, 20, 25]), Q: tire([10, 20, 30]), W: tire([2, 5]), d: tire([3, 5, 8]) }),
    build: (p, q) => {
      const tokens = { m: tok(`${nb(p.m, 2)} kg`, 'Masse de liquide', p.m, 'kg'), c: tok(`${p.g.c} J·kg⁻¹·K⁻¹`, `Capacité thermique massique de ${p.g.nom === 'eau' ? 'l’eau' : 'l’huile'}`, p.g.c, 'J·kg⁻¹·K⁻¹'), th: tok(`${p.th} °C`, 'Température initiale', p.th, '°C'), Q: tok(`${p.Q} kJ`, 'Transfert thermique reçu', p.Q, 'kJ'), W: tok(`${p.W} kJ`, 'Travail reçu de la pale', p.W, 'kJ'), d: tok(`${p.d} min`, 'Durée du chauffage', p.d, 'min') };
      const debut = ['Un récipient contient ', T('m'), ' d’', p.g.nom, ' (capacité thermique massique ', T('c'), ') à ', T('th'), '. Pendant ', T('d'), ', il reçoit de la plaque chauffante un transfert thermique ', T('Q'), ' et de la pale un travail ', T('W'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la variation d’énergie interne du liquide ? (pas de changement d’état)'], utiles: ['Q', 'W'],
        raisons: { m: 'La masse sert à passer de ΔU à ΔT (C = m × c), pas à calculer ΔU = W + Q.', c: 'La capacité thermique massique sert à passer de ΔU à ΔT, pas à calculer ΔU = W + Q.', th: 'La température initiale ne sert pas à calculer la variation d’énergie interne ΔU = W + Q.', d: 'La durée n’intervient pas : les énergies reçues sont données directement.' },
        cherche: { bonne: 'La variation d’énergie interne ΔU du liquide (en kJ)', faux: ['La variation de température ΔT du liquide (en K)', 'La capacité thermique C du liquide (en J·K⁻¹)', 'La température finale du liquide (en °C)'] },
        manque: null, solution: { txt: 'ΔU = W + Q, énergies reçues', val: p.W + p.Q, u: 'kJ' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la température finale du liquide ? (pas de changement d’état)'], utiles: ['m', 'c', 'th', 'Q', 'W'],
        raisons: { d: 'La durée ne sert pas : les énergies Q et W reçues sont données directement.' },
        cherche: { bonne: 'La température finale du liquide (en °C)', faux: ['La variation de température ΔT du liquide (en K)', 'La variation d’énergie interne ΔU du liquide (en kJ)', 'La capacité thermique C du liquide (en J·K⁻¹)'] },
        manque: null, solution: { txt: 'θ_f = θ_i + frac(W + Q|m × c), énergies en J', val: p.th + (p.W + p.Q) * 1000 / (p.m * p.g.c), u: '°C' } };
    },
  },
  {
    id: 'tht-sapp-paroi', domaine: 'Transferts thermiques et bilan de la Terre (TG)', titre: 'Les pertes d’une fenêtre', noms: ['Flux thermique à travers la fenêtre', 'Énergie perdue pendant la durée'],
    gen: () => ({ g: tire([{ nom: 'à simple vitrage', R: 0.11 }, { nom: 'à double vitrage', R: 0.24 }]), Ti: tire([19, 20, 21]), Te: tire([-5, 0, 3, 5]), h: tire([5, 8, 10, 12]), prix: tire([0.18, 0.20, 0.25]) }),
    build: (p, q) => {
      const dT = p.Ti - p.Te, phi = dT / p.g.R;
      const tokens = { R: tok(`${nb(p.g.R, 2)} K·W⁻¹`, 'Résistance thermique de la fenêtre', p.g.R, 'K·W⁻¹'), Ti: tok(`${p.Ti} °C`, 'Température intérieure', p.Ti, '°C'), Te: tok(`${String(p.Te).replace('-', '−')} °C`, 'Température extérieure', p.Te, '°C'), h: tok(`${p.h} h`, 'Durée', p.h, 'h'), prix: tok(`${nb(p.prix, 2)} €·kWh⁻¹`, 'Prix de l’énergie', p.prix, '€·kWh⁻¹') };
      const debut = ['Une fenêtre ', p.g.nom, ' a une résistance thermique ', T('R'), '. La pièce est à ', T('Ti'), ' et l’extérieur à ', T('Te'), ' (régime permanent). Cette situation dure ', T('h'), ', avec une énergie facturée ', T('prix'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quel est le flux thermique à travers la fenêtre ?'], utiles: ['R', 'Ti', 'Te'],
        raisons: { h: 'La durée ne sert pas à calculer le flux (une puissance) : elle sert pour l’énergie transférée.', prix: 'Le prix de l’énergie ne sert pas à calculer un flux thermique.' },
        cherche: { bonne: 'Le flux thermique φ à travers la fenêtre (en W)', faux: ['L’énergie perdue pendant la durée (en kWh)', 'Le coût de l’énergie perdue (en €)', 'La résistance thermique de la fenêtre (en K·W⁻¹)'] },
        manque: null, solution: { txt: 'φ = frac(ΔT|R_th), avec ΔT = θ_int − θ_ext', val: phi, u: 'W' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle énergie la fenêtre laisse-t-elle passer pendant cette durée ?'], utiles: ['R', 'Ti', 'Te', 'h'],
        raisons: { prix: 'Le prix sert à calculer un coût, pas l’énergie elle-même.' },
        cherche: { bonne: 'L’énergie perdue pendant la durée (en kWh)', faux: ['Le flux thermique à travers la fenêtre (en W)', 'Le coût de l’énergie perdue (en €)', 'L’écart de température entre les faces (en K)'] },
        manque: null, solution: { txt: 'E = φ × Δt, avec φ = frac(ΔT|R_th), en kWh', val: phi * p.h / 1000, u: 'kWh' } };
    },
  },
  {
    id: 'ber-sapp-venturi', domaine: 'Écoulement d’un fluide : débit, relation de Bernoulli et effet Venturi', titre: 'De l’eau dans un tuyau à col', noms: ['Vitesse dans le col', 'Différence de pression entre l’entrée et le col'],
    gen: () => { const [dA, dB] = tire([[25, 12], [25, 16], [32, 16], [32, 20], [40, 20], [40, 25]]); return { dA, dB, vA: tire([0.5, 0.8, 1.0, 1.2]), L: tire([1.2, 1.5, 2.0]), th: tire([12, 15, 18]), PrA: tire([6, 8, 10]) }; },
    build: (p, q) => {
      const vB = p.vA * (p.dA / p.dB) ** 2;
      const tokens = {
        dA: tok(`${p.dA} mm`, 'Diamètre du tuyau à l’entrée', p.dA, 'mm'),
        dB: tok(`${p.dB} mm`, 'Diamètre du col', p.dB, 'mm'),
        vA: tok(`${nb(p.vA, 1)} m·s⁻¹`, 'Vitesse de l’eau à l’entrée', p.vA, 'm·s⁻¹'),
        rho: tok('1000 kg·m⁻³', 'Masse volumique de l’eau', 1000, 'kg·m⁻³'),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur du tuyau', p.L, 'm'),
        th: tok(`${p.th} °C`, 'Température de l’eau', p.th, '°C'),
        P: tok(`${p.PrA} kPa`, 'Pression à l’entrée, au-dessus de la pression atmosphérique', p.PrA, 'kPa'),
      };
      const debut = ['De l’eau à ', T('th'), ' (masse volumique ', T('rho'), ') s’écoule dans un tuyau horizontal de longueur ', T('L'), '. Elle entre à la vitesse ', T('vA'), ' dans une section de diamètre ', T('dA'), ', avec une pression de ', T('P'), ' au-dessus de la pression atmosphérique, puis traverse un col de diamètre ', T('dB'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle est la vitesse de l’eau dans le col ?'], utiles: ['dA', 'vA', 'dB'], raisons: { rho: 'La conservation du débit d’un fluide incompressible ne fait pas intervenir sa masse volumique.', L: 'La longueur du tuyau n’intervient pas : sans pertes de charge, seule la variation de section compte.', th: 'La température de l’eau ne change pas la conservation du débit (masse volumique supposée constante).', P: 'La pression à l’entrée ne sert pas à calculer une vitesse : c’est la conservation du débit qui la donne.' },
        cherche: { bonne: 'La vitesse de l’eau dans le col (en m·s⁻¹)', faux: ['Le débit volumique à l’entrée (en L·min⁻¹)', 'La pression de l’eau dans le col (en kPa)', 'L’écart de hauteur entre deux tubes manométriques (en cm)'] },
        manque: null, solution: { txt: 'v_B = v_A × frac(d_A²|d_B²)', val: vB, u: 'm·s⁻¹' } };
      return { tokens, derivees: [], texte: [...debut, 'Quelle est la différence de pression entre l’entrée et le col ?'], utiles: ['dA', 'vA', 'dB', 'rho'], raisons: { L: 'La longueur du tuyau n’intervient pas : la relation de Bernoulli sans pertes de charge ne la contient pas.', th: 'La température de l’eau ne change pas ici : la masse volumique est donnée.', P: 'La pression à l’entrée ne sert pas à calculer l’écart de pression : seul l’écart des pressions cinétiques intervient (conduite horizontale).' },
        cherche: { bonne: 'L’écart de pression entre l’entrée et le col (en kPa)', faux: ['La vitesse moyenne de l’eau dans le col (en m·s⁻¹)', 'La pression absolue de l’eau à la sortie du col (en kPa)', 'La hauteur de la colonne en B (en cm)'] },
        manque: null, solution: { txt: 'P_A − P_B = ½ρ(v_B² − v_A²), avec v_B = v_A × frac(d_A²|d_B²)', val: 0.5 * 1000 * (vB ** 2 - p.vA ** 2) / 1000, u: 'kPa' } };
    },
  },
  // ───────────────────────────── Poussée d'Archimède (TG, sim 213) : poussée sur un flotteur à l'équilibre ou sur un cube maintenu immergé
  {
    id: 'arc-sapp-flotteur', schema: () => ({ type: 'cubeImmerge' }), domaine: 'Poussée d’Archimède : origine, expression et flottaison', titre: 'Un cube de bois dans un bassin', noms: ['Poussée sur le cube qui flotte', 'Poussée sur le cube maintenu immergé'],
    gen: () => ({ rhoB: tire([500, 600, 700, 750]), V: tire([200, 500, 800, 1000]), rhoE: tire([1000, 1030]), th: tire([12, 15, 18, 22]), h: tire([40, 50, 60, 80]) }),
    build: (p, q) => {
      const tokens = {
        rhoB: tok(`${nb(p.rhoB, 0)} kg·m⁻³`, 'Masse volumique du bois du cube', p.rhoB, 'kg·m⁻³'),
        V: tok(`${nb(p.V, 0)} cm³`, 'Volume du cube', p.V, 'cm³'),
        rhoE: tok(`${nb(p.rhoE, 0)} kg·m⁻³`, 'Masse volumique de l’eau du bassin', p.rhoE, 'kg·m⁻³'),
        g: tok('9,8 N·kg⁻¹', 'Intensité de la pesanteur', 9.8, 'N·kg⁻¹'),
        th: tok(`${p.th} °C`, 'Température de l’eau du bassin', p.th, '°C'),
        h: tok(`${p.h} cm`, 'Profondeur du bassin', p.h, 'cm'),
      };
      const debut = ['Un cube de bois, de volume ', T('V'), ' et de masse volumique ', T('rhoB'), ', est lâché dans un bassin d’eau de masse volumique ', T('rhoE'), '. L’eau est à ', T('th'), ' et le bassin a une profondeur de ', T('h'), '. On prend g = ', T('g'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Le cube flotte, immobile. Quelle est la norme de la poussée d’Archimède exercée par l’eau sur lui ?'], utiles: ['rhoB', 'V', 'g'], raisons: {
          rhoE: 'À l’équilibre, la poussée est égale au poids du cube : la masse volumique de l’eau fixe le volume immergé, mais pas la valeur de la poussée.', th: 'La température de l’eau n’intervient pas dans le calcul de la poussée : seule compte sa masse volumique, déjà donnée.', h: 'La profondeur du bassin ne change pas la poussée sur un flotteur ni sur un solide immergé.' },
        cherche: { bonne: 'La poussée d’Archimède Π (en N)', faux: ['Le volume immergé du cube (en cm³)', 'La masse du cube (en g)', 'La pression au fond du bassin (en Pa)'] },
        manque: null, solution: { txt: 'À l’équilibre Π = P = ρ_bois × V × g, avec V converti en m³', val: p.rhoB * p.V * 1e-6 * 9.8, u: 'N' } };
      return { tokens, derivees: [], texte: [...debut, 'On maintient maintenant le cube totalement immergé. Quelle est la norme de la poussée d’Archimède exercée par l’eau sur lui ?'], utiles: ['rhoE', 'V', 'g'], raisons: {
          rhoB: 'La masse volumique du bois fixe le poids du cube, mais pas la poussée : Π = ρ_fluide × V_immergé × g ne dépend pas de la nature du solide.', th: 'La température de l’eau n’intervient pas dans l’expression de la poussée (la masse volumique de l’eau est donnée).', h: 'La poussée ne dépend pas de la profondeur du bassin ni de celle du cube.' },
        cherche: { bonne: 'La poussée d’Archimède Π (en N)', faux: ['Le poids du cube (en N)', 'La force à exercer pour le maintenir immergé (en N)', 'Le volume d’eau déplacé (en L)'] },
        manque: null, solution: { txt: 'Π = ρ_eau × V × g, avec V converti en m³ (cube totalement immergé)', val: p.rhoE * p.V * 1e-6 * 9.8, u: 'N' } };
    },
  },
  // ───────────────────────────── Lot 2 (1G) : énergie électrique et mouvement d'un système
  {
    id: 'ene-charge-sapp', domaine: 'Énergie électrique', titre: 'Un courant dans un fil : charge et électrons', noms: ['Charge qui traverse le fil', 'Nombre d’électrons'],
    gen: () => ({ I: tire([20, 50, 80, 150, 250]), dmin: tire([2, 5, 10, 20]), U: tire([3, 6, 9, 12]), L: tire([30, 60, 120]) }),
    build: epure((p, q) => {
      const tokens = {
        I: tok(`${p.I} mA`, 'Intensité du courant continu', p.I / 1000, 'A'),
        d: tok(`${p.dmin} min`, 'Durée de passage du courant', p.dmin * 60, 's'),
        U: tok(`${p.U} V`, 'Tension du générateur', p.U, 'V'),
        L: tok(`${p.L} cm`, 'Longueur du fil', p.L / 100, 'm'),
        e: tok('e = 1,602 × 10⁻¹⁹ C', 'Charge élémentaire (valeur absolue de la charge d’un électron)', 1.602e-19, 'C'),
      };
      const Q = p.I / 1000 * p.dmin * 60;
      const raisons = { U: 'La tension du générateur n’intervient pas : la charge qui traverse une section se calcule avec l’intensité et la durée.', L: 'La longueur du fil ne sert pas : on s’intéresse à la charge qui traverse une section du fil, quelle que soit sa longueur.' };
      const debut = ['Un fil de ', T('L'), ' de long est relié à un générateur de ', T('U'), '. Il est parcouru par un courant continu d’intensité ', T('I'), ' pendant ', T('d'), '. '];
      if (q === 0) return { tokens, derivees: [], texte: [...debut, 'Quelle charge électrique a traversé une section du fil pendant cette durée ?'],
        utiles: ['I', 'd'], raisons,
        cherche: { bonne: 'La charge électrique Δq qui a traversé la section (en C)', faux: ['L’énergie électrique transférée par le générateur (en J)', 'Le nombre d’électrons qui ont traversé la section', 'La puissance électrique du générateur (en W)'] },
        manque: null, solution: { txt: 'Δq = I × Δt, avec I en A et Δt en s', val: Q, u: 'C' } };
      return { tokens, derivees: [{ id: 'q', nom: 'Charge Δq qui a traversé la section', expr: 'Δq = I × Δt', val: Q, u: 'C' }],
        texte: [...debut, 'La valeur absolue de la charge d’un électron est ', T('e'), '. Combien d’électrons ont traversé une section du fil pendant cette durée ?'],
        utiles: ['I', 'd', 'e'], raisons,
        cherche: { bonne: 'Le nombre N d’électrons qui ont traversé la section', faux: ['La charge électrique Δq qui a traversé la section (en C)', 'La masse des électrons qui ont traversé la section (en kg)', 'La durée de passage d’un électron dans le fil (en s)'] },
        manque: null, solution: { txt: 'N = Δq / e, avec Δq = I × Δt', val: Q / 1.602e-19, u: 'électrons' } };
    }),
  },
  {
    id: 'mec-deltav-sapp', domaine: 'Mécanique', titre: 'Une poussée sur un chariot', noms: ['Variation de vitesse'],
    gen: () => ({ m: tire([200, 250, 400, 500]), F: tire([0.15, 0.25, 0.35, 0.45]), dt: tire([50, 80, 120, 200]), v0: tire([0.3, 0.6, 0.9]) }),
    build: epure(p => {
      const tokens = {
        m: tok(`${p.m} g`, 'Masse du chariot', p.m / 1000, 'kg'),
        v0: tok(`${nb(p.v0, 1)} m·s⁻¹`, 'Valeur de la vitesse initiale du chariot', p.v0, 'm·s⁻¹'),
        F: tok(`${nb(p.F, 2)} N`, 'Valeur de la force horizontale constante', p.F, 'N'),
        dt: tok(`${p.dt} ms`, 'Durée de la poussée', p.dt / 1000, 's'),
      };
      return { tokens, derivees: [],
        texte: ['Un chariot de ', T('m'), ' roule sans frottement sur un rail horizontal à la vitesse ', T('v0'), '. On le pousse dans le sens de son mouvement avec une force horizontale constante de ', T('F'), ' pendant ', T('dt'), ' (le poids et la réaction du rail se compensent). Quelle est la variation de la valeur de sa vitesse pendant cette poussée ?'],
        utiles: ['m', 'F', 'dt'], raisons: { v0: 'La vitesse initiale ne change pas la variation de vitesse : Δv ≈ (ΣF / m) × Δt ne dépend que de la force, de la masse et de la durée.' },
        cherche: { bonne: 'La variation Δv de la valeur de la vitesse (en m·s⁻¹)', faux: ['La valeur de la vitesse finale du chariot (en m·s⁻¹)', 'L’accélération moyenne du chariot (en m·s⁻²)', 'Le travail de la force pendant la poussée (en J)'] },
        manque: null, solution: { txt: 'Δv ≈ ΣF × Δt / m (en unités SI)', val: p.F * (p.dt / 1000) / (p.m / 1000), u: 'm·s⁻¹' } };
    }),
  },
  {
    id: 'mec-force-sapp', domaine: 'Mécanique', titre: 'Un palet qui accélère', noms: ['Valeur de la somme des forces'],
    gen: () => { const v1 = tire([0.2, 0.4, 0.6]), dv = tire([0.1, 0.3, 0.5]); return { m: tire([150, 200, 300, 400]), v1, v2: Math.round((v1 + dv) * 10) / 10, dt: tire([40, 50, 100, 250]), L: tire([1.2, 1.5, 2.0]) }; },
    build: epure(p => {
      const dv = p.v2 - p.v1;
      const tokens = {
        m: tok(`${p.m} g`, 'Masse du palet', p.m / 1000, 'kg'),
        v1: tok(`${nb(p.v1, 1)} m·s⁻¹`, 'Valeur de la vitesse initiale', p.v1, 'm·s⁻¹'),
        v2: tok(`${nb(p.v2, 1)} m·s⁻¹`, 'Valeur de la vitesse finale', p.v2, 'm·s⁻¹'),
        dt: tok(`${p.dt} ms`, 'Durée du souffle', p.dt / 1000, 's'),
        L: tok(`${nb(p.L, 1)} m`, 'Longueur de la table', p.L, 'm'),
      };
      return { tokens, derivees: [{ id: 'dv', nom: 'Variation Δv de la valeur de la vitesse', expr: 'Δv = v₂ − v₁', val: dv, u: 'm·s⁻¹' }],
        texte: ['Un palet de ', T('m'), ' glisse sans frottement sur une table horizontale de ', T('L'), ' de long. Un souffle d’air, dirigé dans le sens du mouvement, fait passer sa vitesse de ', T('v1'), ' à ', T('v2'), ' en ', T('dt'), '. Quelle est la valeur de la somme des forces horizontales qui s’exercent sur le palet pendant ce souffle ?'],
        utiles: ['m', 'v1', 'v2', 'dt'], raisons: { L: 'La longueur de la table ne sert pas : on connaît directement la variation de vitesse et sa durée.' },
        cherche: { bonne: 'La valeur de la somme des forces ΣF (en N)', faux: ['La variation Δv de la valeur de la vitesse (en m·s⁻¹)', 'Le poids du palet (en N)', 'L’énergie cinétique finale du palet (en J)'] },
        manque: null, solution: { txt: 'ΣF ≈ m × Δv / Δt, avec Δv = v₂ − v₁ (unités SI)', val: (p.m / 1000) * dv / (p.dt / 1000), u: 'N' } };
    }),
  },
  {
    id: 'ene-pile-sapp', domaine: 'Énergie électrique', titre: 'Deux points de fonctionnement d’une pile réelle', noms: ['Résistance interne', 'Force électromotrice'],
    gen: () => { let E, r, I1, I2; do { E = tire([3.0, 4.5, 6.0, 9.0]); r = tire([0.5, 1.0, 1.5, 2.0, 3.0]); I1 = tire([100, 200]); I2 = tire([500, 600, 800]); } while (E - r * I2 / 1000 < 0.6 * E); return { E, r, I1, I2, U1: Math.round((E - r * I1 / 1000) * 100) / 100, U2: Math.round((E - r * I2 / 1000) * 100) / 100, C: tire([1500, 2000, 2800]) }; },
    build: epure((p, q) => {
      const tokens = {
        I1: tok(`${p.I1} mA`, 'Intensité du courant, premier point', p.I1 / 1000, 'A'),
        U1: tok(`${nb(p.U1, 2)} V`, 'Tension aux bornes de la pile, premier point', p.U1, 'V'),
        I2: tok(`${p.I2} mA`, 'Intensité du courant, second point', p.I2 / 1000, 'A'),
        U2: tok(`${nb(p.U2, 2)} V`, 'Tension aux bornes de la pile, second point', p.U2, 'V'),
        C: tok(`${nb(p.C)} mAh`, 'Capacité de la pile', p.C, 'mAh'),
      };
      const rI = { id: 'r', nom: 'Résistance interne r de la pile', expr: 'r = frac(U₁ − U₂|I₂ − I₁)', val: p.r, u: 'Ω' };
      const raisons = { C: 'La capacité de la pile (charge stockée) ne sert pas à déterminer sa force électromotrice ni sa résistance interne.' };
      const debut = ['Une pile réelle est modélisée par U = E − r × I. Quand elle débite ', T('I1'), ', la tension à ses bornes vaut ', T('U1'), ' ; quand elle débite ', T('I2'), ', elle vaut ', T('U2'), '. La pile a une capacité de ', T('C'), '. '];
      if (q === 0) return { tokens, derivees: [{ id: 'dU', nom: 'Écart de tension U₁ − U₂', expr: 'ΔU = U₁ − U₂', val: p.U1 - p.U2, u: 'V' }, { id: 'dI', nom: 'Écart d’intensité I₂ − I₁', expr: 'ΔI = I₂ − I₁', val: (p.I2 - p.I1) / 1000, u: 'A' }],
        texte: [...debut, 'Quelle est la résistance interne r de la pile ?'], utiles: ['I1', 'U1', 'I2', 'U2'], raisons,
        cherche: { bonne: 'La résistance interne r de la pile (en Ω)', faux: ['La force électromotrice E de la pile (en V)', 'La puissance fournie par la pile (en W)', 'La durée de fonctionnement de la pile (en h)'] },
        manque: null, solution: { txt: 'r = frac(U₁ − U₂|I₂ − I₁)', val: p.r, u: 'Ω' } };
      return { tokens, derivees: [rI],
        texte: [...debut, 'Quelle est la force électromotrice E de la pile ?'], utiles: ['I1', 'U1', 'I2', 'U2'], raisons,
        cherche: { bonne: 'La force électromotrice E de la pile (en V)', faux: ['La résistance interne r de la pile (en Ω)', 'La tension de la pile pour I = 1 A (en V)', 'La charge stockée dans la pile (en C)'] },
        manque: null, solution: { txt: 'E = U₁ + r × I₁', val: p.E, u: 'V' } };
    }),
  },
];

// Mélange reproductible (pour que l’ordre des propositions ne change pas à chaque affichage)
export function melange(tab, graine) {
  const a = tab.slice(); let s = (graine * 2654435761) >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Symbole de chaque donnée tel qu'il apparaît dans la formule (affiché à côté du nom de la grandeur)
const SYMBOLES = {
  'vac-sapp-derivee': { A: 'A', B: 'B', C: 'C', m: 'm', t1: 't₁' },
  'ber-sapp-venturi': { dA: 'd_A', dB: 'd_B', vA: 'v_A', rho: 'ρ', L: 'L', th: 'θ', P: 'P_A − P_atm' },
  'flu-statique': { rho: 'ρ', g: 'g', P: 'P_rel', th: 'θ', Vc: 'V_cuve', Patm: 'P_atm', d: 'd', dh: 'Δh' },
  'flu-debit': { mv: 'm_fût', mt: 'm_balance', dt: 'Δt', V: 'V', Bmax: 'm_max', Pm: 'P_moteur', th: 'θ' },
  'flu-section': { D1: 'D₁', D2: 'D₂', v1: 'v₁', P1: 'P₁', L: 'L', th: 'θ', Vr: 'V_bassin' },
  'flu-pompe': { rho: 'ρ', g: 'g', dz: 'Δz', dp: 'Δp_charges', Q: 'Q_V', Pel: 'P_él', L: 'L', th: 'θ', Patm: 'P_atm' },
  hydrodist: { mp: 'm_fleurs', Veau: 'V_eau', P: 'P', t: 'Δt', T: 'θ', mh: 'm_huile', rho: 'ρ', Vh: 'V_hydrolat' },
  'crist-evaporateur': { q1: 'q₁', w1: 'w₁', w2: 'w₂', S: 'S', Pv: 'P', th: 'θ', dur: 'Δt' },
  paroi: { an: '', L: 'L', h: 'h', e: 'e', lam: 'λ', Ti: 'T_int', Te: 'T_ext', prix: 'prix', dur: 'durée' },
  conduite: { Pel: 'P_él', D: 'D', Lc: 'L', Q: 'Q_V', tdur: 'Δt' },
  aspirine: { mc: 'm_comprimé', M: 'M', Vf: 'V_f', VA: 'V_A', cB: 'c_B', pH: 'pH', VE: 'V_E' },
  can: { sens: 's', n: 'n', vmin: 'V_min', vmax: 'V_max', fe: 'f_e' },
  echangeur: { qc: 'q_m,chaud', Tce: 'T_ce', Tcs: 'T_cs', c: 'c', qf: 'q_m,froid', Tfe: 'T_fe' },
  beer: { lam: 'λ', l: 'ℓ', A: 'A', eps: 'ε', theta: 'θ' },
  reservoir: { rho: 'ρ', h: 'h', D: 'D', Patm: 'P_atm' },
  regulP: { hc: 'consigne', Kp: 'K_p', Qmax: 'Q_max', Qp: 'Q_p', S: 'S', Ti: 'T_i' },
  premord: { tau: 'τ', T0: 'T₀', Tf: 'T_f', t: 't', res: '', m: 'm' },
  incertA: { n: 'n', xm: 'x̄', s: 's', k: 'k', res: '', dur: '' },
  compatS: { x: 'x', u: 'u', cref: 'x_ref', n: '', theta: '' },
  moteurPas: { N: 'N', D: 'D', Np: 'N_p', U: 'U', R: 'R' },
  champB: { BT: 'B_T', Ba: 'B_a', r1: 'r₁', r2: 'r₂', T: 'θ' },
  rho2: { T: '', mv: 'm_vide', mt: 'm_avec liquide', V: 'V', rho: 'ρ', VL: 'V' },
  conc2: { M: 'M', m: 'm', Vi: 'V_eau', Vf: 'V', t: 't' },
  poids2: { mg: 'm', g: 'g', V: 'V', mk: 'm', ga: 'g' },
  vitesse2: { d: 'd', t: 'Δt', m: 'm', dm: 'd', v: 'v' },
  ohm2: { R: 'R', I: 'I', L: 'ℓ', U: 'U', Rm: 'R' },
  indice2: { c: 'c', ep: 'e', v: 'v', n: 'n' },
  snell2: { n1: 'n₁', i1: 'i₁', lam: 'λ', n2: 'n₂', i2: 'i₂' },
  noyau2: { A: 'A', Z: 'Z', e: 'e', mp: 'm_nucléon' },
  dissol2: { M: 'M', T: '', Ve: 'V_eau', m: 'm', Vf: 'V', c: 'c' },
  ener2: { P: 'P', d: 'Δt', prix: 'prix', R: 'R', I: 'I', L: 'ℓ' },
  meca2: { m: 'm', v: 'v', L: 'ℓ', F: 'F', d: 'd', a: 'α', mt: 'm' },
  'ene-charge-sapp': { I: 'I', d: 'Δt', U: 'U', L: 'ℓ', e: 'e' },
  'ene-pile-sapp': { I1: 'I₁', U1: 'U₁', I2: 'I₂', U2: 'U₂', C: 'C' },
  'mec-deltav-sapp': { m: 'm', v0: 'v₀', F: 'ΣF', dt: 'Δt' },
  'mec-force-sapp': { m: 'm', v1: 'v₁', v2: 'v₂', dt: 'Δt', L: 'L' },
  distil: { V: 'V', x: 'x', y: 'y', Vd: 'V_distillat', Te: 'θ_éb', P: 'P' },
  cristal: { me: 'm_eau', mb: 'm_bécher', s60: 's₆₀', s20: 's₂₀', dur: 'Δt' },
  'phot1g-sapp-photon': { lam: 'λ', c: 'c', h: 'h', P: 'P', d: 'd', t: 'Δt' },
  'you-sapp-young': { lam: 'λ', a: 'a', D: 'D', P: 'P', w: '', d: 'd', N: 'N' },
  'son2gt-per-sapp-note': { dt: 'Δt', n: 'N', A: 'A', prix: '' },
  'mes2gt-inc-sapp-incertitude': { n: 'n', s: 's', m: 'm', prix: '', d: 'Δt' },
  'mes2gt-inc-sapp-reference': { m: 'm', u: 'u', ref: 'm_réf', n: 'n', an: '' },
  'son2gt-per-sapp-ecran': { base: '', k: '', sens: '', h: '' },
  'niv1g-sapp-transition': { Ei: 'E_i', Ef: 'E_f', h: 'h', c: 'c', ev: '1 eV', P: 'P', U: 'U', t: 'Δt' },
};
export function nouvelEnonce(id, q, forceParams) {
  const def = ENONCES.find(e => e.id === id);
  const p = forceParams || def.gen();
  const b = def.build(p, q);
  b.dansTexte = new Set(b.texte.filter(m => typeof m !== 'string').map(m => m.t));
  b.schema = def.schema ? def.schema(p, b, q) : null;
  Object.entries(b.tokens).forEach(([k, t]) => { t.sym = (SYMBOLES[id] || {})[k] || ''; });
  return { id, q, p, b, graine: 1 + Math.floor(Math.random() * 99999) };
}
