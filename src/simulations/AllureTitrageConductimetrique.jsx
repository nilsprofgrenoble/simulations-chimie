import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, accepte, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./conductimetrieAllureModele";
import { QCM_PARCOURS as Q } from "./conductimetrieAllureQcm";
import { ExplorationDosage } from "./AllureDosageExploration";
import { SceneAllure, GraphiqueAllure, MiniCourbe, SvgIonsCarte, SvgPenteCarte, SvgVCarte, SvgFaibleCarte, SvgRecapCarte } from "./conductimetrieAllureSchemas";

const SIM_ID = 257, CLE_GUIDE = 'allure-titrage-conductimetrique-tstl-guide-v1';
declarerDefis(SIM_ID, [['associer', 'Associer chaque titrage à sa courbe'], ['pente', 'Pente d’une courbe de titrage conductimétrique']]);

// ====================================================
// SIM 257 — PRÉVOIR L'ALLURE D'UNE COURBE DE TITRAGE CONDUCTIMÉTRIQUE (TSTL SPCL, chapitre « Conductivité et titrages conductimétriques »).
//  Une méthode unique pour cinq titrages : repérer les ions qui disparaissent, apparaissent ou restent spectateurs, puis comparer les λ ; σ = Σ λ × c (Kohlrausch).
//  Capacités visées (jamais affichées à l'élève) : exploiter la loi de Kohlrausch ; prévoir l'allure d'une courbe de titrage conductimétrique ; déterminer le volume équivalent ;
//  écrire la relation à l'équivalence ; identifier les ions spectateurs ; distinguer acide fort / acide faible, précipitation.
//  Modèle : conductimetrieAllureModele.js (volume constant, droites). Situations originales ; aucune situation, valeur ni question du Moodle n'est reprise.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (v, d = 1) => { const [m, e] = Number(v).toExponential(d).split('e'); return `${m.replace('.', ',')}×10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const signe = (v, d) => `${v < 0 ? '−' : '+'}${nbf(Math.abs(v), d)}`;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const L = id => M.IONS[id].lambda, F = id => M.IONS[id].f;
const Lf = id => nbf(L(id), 1);

// ---------- parcours : même prise d'essai de 20,0 mL à 4,0×10⁻² mol/L, 180 mL d'eau, titrant à 0,100 mol/L (0,050 pour Ag⁺) ----------
const V_MAX = M.V_BURETTE;
const CA = 0.040, VA = M.VA0, EAU = M.EAU_DEFAUT;
const T1 = 'fortSoude', T2 = 'faibleSoude', T3 = 'soudeAcide', T4 = 'precip', T5 = 'ammoniacAcide';
const VE1 = M.volumeEquivalent(T1, CA), PAS = M.pasConc(T1, EAU), PA1 = M.penteAvant(T1, EAU), PP1 = M.penteApres(T1, EAU), S01 = M.sigma0(T1, CA, EAU), SEQ1 = M.sigmaEquivalence(T1, CA, EAU);
const PA2 = M.penteAvant(T2, EAU), VE4 = M.volumeEquivalent(T4, CA);
const IDS = ['pourquoi', 'spectateur', 'avant', 'apres', 'allure', 'equiv', 'verif', 'faible', 'faiblePente', 'inverse', 'precip', 'comparer', 'bilan'];
const TITRAGE_DE = { pourquoi: T1, spectateur: T1, avant: T1, apres: T1, allure: T1, equiv: T1, verif: T1, faible: T2, faiblePente: T2, inverse: T3, precip: T4, comparer: T5, bilan: T1 };
const IONS_VUS = { pourquoi: [], spectateur: [], avant: ['H3O', 'Na', 'HO', 'Cl'], apres: ['H3O', 'Na', 'HO', 'Cl'], allure: ['H3O', 'Na', 'HO', 'Cl'], equiv: ['H3O', 'Na', 'HO', 'Cl'], verif: ['H3O', 'Na', 'HO', 'Cl'],
  faible: ['AcO', 'Na'], faiblePente: ['AcO', 'Na'], inverse: ['H3O', 'Na', 'HO', 'Cl'], precip: ['Na', 'Cl', 'Ag', 'NO3'], comparer: ['NH4', 'H3O', 'Cl'], bilan: [] };
const yMaxPour = liste => {
  const m = Math.max(...liste.flatMap(({ t, cA, eau }) => [M.sigma(t, cA, 0, eau), M.sigma(t, cA, V_MAX, eau), M.sigmaEquivalence(t, cA, eau)])), pas = m > 150 ? 50 : m > 60 ? 20 : 10;
  return Math.max(pas * 2, Math.ceil(m * 1.06 / pas) * pas);
};
const ptsDe = (t, cA, eau) => M.courbe(t, cA, eau, V_MAX, 0.25);

// détail d'un calcul de pente (correction et diagnostic)
function detailPente(t, avant, eau) {
  const T = M.TITRAGES[t], d = avant ? T.avant : T.apres, pas = M.pasConc(t, eau), val = (avant ? M.penteAvant(t, eau) : M.penteApres(t, eau));
  const ent = Object.entries(d);
  const lit = ent.map(([i, nu], k) => `${nu < 0 ? (k ? ' − ' : '−') : (k ? ' + ' : '')}λ(${F(i)})`).join('');
  const num = ent.map(([i, nu], k) => `${nu < 0 ? (k ? ' − ' : '−') : (k ? ' + ' : '')}${Lf(i)}`).join('');
  return `Chaque mL de ${T.titrant} change les concentrations de ${nbf(pas, pas < 1 ? 3 : 2)} mol·m⁻³ (1 mL apporte ${nbf(T.cB, 3)} mmol de titrant, dilués dans ${nbf(M.Vdepart(eau), 0)} mL). ${avant ? 'Avant' : 'Après'} l’équivalence, les ions qui apparaissent (+) ou disparaissent (−) sont : ${ent.map(([i, nu]) => `${nu < 0 ? '−' : '+'} ${F(i)}`).join(', ')}. Pente = ${nbf(pas, pas < 1 ? 3 : 2)} × (${lit}) = ${nbf(pas, pas < 1 ? 3 : 2)} × (${num}) = ${nbf(val, 3)} mS·m⁻¹ par mL.`;
}
const resume = (t, eau) => {
  const a = M.penteAvant(t, eau), p = M.penteApres(t, eau), f = M.forme(t);
  const mot = x => x === 'baisse' ? 'baisse' : x === 'hausse' ? 'monte' : 'reste presque constante';
  return `avant l’équivalence σ ${mot(f.avant)} (pente ${signe(a, a > -1 && a < 1 ? 3 : 1)} mS·m⁻¹ par mL), après elle ${mot(f.apres)} (pente ${signe(p, 1)})`;
};

// ====================================================
export function SimulationAllureTitrageConductimetrique() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('associer');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ lambda: false, essayer: false, retenir: false });
  const [vbs, setVbs] = useState({});
  const [joue, setJoue] = useState(false);
  const [reduit] = useState(mouvementReduit);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const rang = id => IDS.indexOf(id);
  const reussie = !!(guide.reussies && guide.reussies[etape]);
  // ---------- situation affichée ----------
  const cleVb = enGuide ? idE : enDefi ? 'defi' : 'explore';
  const vb = vbs[cleVb] ?? 0;
  const setVb = v => setVbs(s => ({ ...s, [cleVb]: v }));
  useEffect(() => {
    if (!joue) return undefined;
    const h = setInterval(() => setVbs(s => { const v = Math.min(V_MAX, (s[cleVb] ?? 0) + 0.5); if (v >= V_MAX) setJoue(false); return { ...s, [cleVb]: v }; }), 150);
    return () => clearInterval(h);
  }, [joue, cleVb]);
  const t = enGuide ? TITRAGE_DE[idE] : dd ? (dd.type === 'pente' ? dd.t : 'fortSoude') : 'fortSoude';
  const cA = enGuide ? CA : dd ? (dd.cA ?? CA) : CA;
  const eau = enGuide ? EAU : dd ? (dd.eau ?? EAU) : EAU;
  const T = M.TITRAGES[t];
  const sig = M.sigma(t, cA, vb, eau), VE = M.volumeEquivalent(t, cA);
  // le conductimètre et le graphique : jamais avant la question qui demande de prévoir
  const lectureVisible = enGuide ? (idE === 'verif' || (rang(idE) > rang('verif') && idE !== 'bilan' && reussie) || idE === 'bilan') : false;
  const lecture = lectureVisible ? `${nbf(sig, sig >= 100 ? 0 : 1)} mS/m` : null;
  const ionsLambda = enGuide ? IONS_VUS[idE] : enDefi ? M.ORDRE_IONS : null;

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'pourquoi', titre: 'Pourquoi σ change-t-elle ?', focus: ['becher', 'burette'],
      texte: <>On titre <strong>20,0&nbsp;mL d’acide chlorhydrique</strong> (H₃O⁺&nbsp;+&nbsp;Cl⁻), de concentration c<sub>A</sub>&nbsp;=&nbsp;4,0×10⁻²&nbsp;mol/L, additionnés de 180&nbsp;mL d’eau, par une solution de <strong>soude</strong> (Na⁺&nbsp;+&nbsp;HO⁻) de concentration c<sub>B</sub>&nbsp;=&nbsp;0,100&nbsp;mol/L versée avec une burette. Une cellule plongée dans le bécher est reliée à un conductimètre : il mesure la conductivité σ, mais on ne la lira pas tout de suite, on va la <strong>prévoir</strong>. Déplacez le curseur de la burette et observez les ions du bécher (un point représente 0,1&nbsp;mmol).</>,
      tache: { type: 'qcm', q: 'Pourquoi la conductivité de la solution varie-t-elle pendant le titrage ?', ...Q.pourquoi,
        expl: 'La conductivité dépend des ions présents et de leurs conductivités ioniques molaires λ : σ = Σ λ × c (loi de Kohlrausch). Pendant le titrage, des ions disparaissent (H₃O⁺ réagit) et d’autres arrivent (Na⁺ de la burette) : la composition ionique change, donc σ aussi. L’eau formée conduit très peu.',
        indice: 'σ = Σ λ × c : qu’est-ce qui change dans le bécher quand on verse la soude, ion par ion ?' } },
    { id: 'spectateur', titre: 'La réaction de titrage et l’ion spectateur', focus: ['equation', 'becher'],
      texte: <>La réaction de titrage s’écrit <strong>H₃O⁺ + HO⁻ → 2 H₂O</strong>. Les ions H₃O⁺ (rouges) réagissent avec les ions HO⁻ versés, et les ions Na⁺ (bleus) de la burette s’accumulent. Un ion qui n’apparaît pas dans l’équation de réaction est un <strong>ion spectateur</strong> : sa quantité ne change pas.</>,
      tache: { type: 'qcm', q: 'Parmi les ions de la solution de départ, lequel ne participe pas à la réaction de titrage ?', ...Q.spectateur,
        expl: 'L’équation H₃O⁺ + HO⁻ → 2 H₂O ne fait intervenir ni Cl⁻ ni Na⁺ : ce sont des ions spectateurs. Dans le bécher, la quantité de Cl⁻ reste constante tout au long du titrage (Na⁺, lui, est ajouté par la burette).',
        indice: 'Cherchez, dans l’équation de réaction, quels ions sont écrits : celui qui n’y est pas reste inchangé.' } },
    { id: 'avant', titre: 'Avant l’équivalence : la pente', focus: ['becher'],
      retenirTitre: 'À retenir : trois sortes d’ions',
      retenir: <>
        <SvgIonsCarte/>
        <Ul>
          <li>Pendant un titrage, on classe les ions : ceux qui <strong>disparaissent</strong> (consommés par la réaction), ceux qui <strong>apparaissent</strong> (formés ou apportés par le titrant), et les <strong>spectateurs</strong> (quantité constante).</li>
          <li>Seuls les ions dont la quantité change font varier σ ; un spectateur n’y change rien (sans dilution).</li>
          <li>Moyen de s’en souvenir : <strong>« qui part, qui arrive, qui reste »</strong>. Idée fausse : « un ion spectateur n’a aucun effet sur σ ». Vrai : il contribue à σ, mais sa contribution ne change pas.</li>
        </Ul></>,
      texte: <>Tant qu’il reste des H₃O⁺, on est <strong>avant l’équivalence</strong> (l’équivalence est atteinte quand on a versé exactement la quantité de HO⁻ qui consomme tous les H₃O⁺). Le volume de la solution est de {nbf(M.Vdepart(EAU), 0)}&nbsp;mL (20,0&nbsp;mL + 180&nbsp;mL d’eau) ; on néglige la dilution due à la burette. Chaque mL de soude apporte 0,100&nbsp;mmol de HO⁻ : <strong>chaque concentration ionique varie de {nbf(PAS, 3)}&nbsp;mol·m⁻³ par mL versé</strong> (+ pour un ion qui apparaît, − pour un ion qui disparaît). Avec les λ ci-dessous, la conductivité σ varie de {nbf(PAS, 3)}&nbsp;×&nbsp;Σ(±&nbsp;λ) par mL.</>,
      tache: { type: 'num', q: 'Variation de σ pour 1 mL de soude versé, avant l’équivalence', unite: 'mS·m⁻¹ par mL', vrai: PA1, tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => [`Pour 1 mL de soude : H₃O⁺ disparaît (−${nbf(PAS, 3)} mol·m⁻³), Na⁺ apparaît (+${nbf(PAS, 3)} mol·m⁻³), Cl⁻ ne change pas.`, `Δσ = ${nbf(PAS, 3)} × (λ(Na⁺) − λ(H₃O⁺)) = ${nbf(PAS, 3)} × (${Lf('Na')} − ${Lf('H3O')}) = ${nbf(PA1, 2)} mS·m⁻¹ par mL.`],
        pieges: [[-PAS * L('H3O'), 'Vous avez compté le H₃O⁺ qui disparaît, mais pas le Na⁺ qui apparaît : il faut aussi ajouter λ(Na⁺).'], [-PA1, 'Signe inversé : H₃O⁺ (λ très grand) disparaît et Na⁺ (λ petit) apparaît, donc σ baisse : la variation est négative.'], [PA1 / PAS, `Il manque le facteur ${nbf(PAS, 3)} mol·m⁻³ par mL : multipliez la somme des λ par la variation de concentration.`], [PAS * L('Na'), 'Vous n’avez compté que Na⁺ qui apparaît : H₃O⁺ disparaît aussi, avec un λ bien plus grand.']],
        expl: `Δσ = ${nbf(PAS, 3)} × (${Lf('Na')} − ${Lf('H3O')}) = ${nbf(PA1, 2)} mS·m⁻¹ par mL (σ baisse).`,
        indice: 'Pour 1 mL : un ion disparaît (signe −), un autre apparaît (signe +). Calculez 0,500 × (λ de l’ion qui apparaît − λ de l’ion qui disparaît).' } },
    { id: 'apres', titre: 'Après l’équivalence : la pente', focus: ['becher'],
      texte: <>Avant l’équivalence, on a trouvé {nbf(PA1, 1)}&nbsp;mS·m⁻¹ par mL. <strong>Après l’équivalence</strong>, il n’y a plus de H₃O⁺ à consommer : les ions HO⁻ versés restent dans la solution, avec Na⁺. Chaque mL de soude ajoute donc {nbf(PAS, 3)}&nbsp;mol·m⁻³ de Na⁺ <strong>et</strong> de HO⁻ (Cl⁻ reste inchangé).</>,
      tache: { type: 'num', q: 'Variation de σ pour 1 mL de soude versé, après l’équivalence', unite: 'mS·m⁻¹ par mL', vrai: PP1, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`Après l’équivalence, les deux ions Na⁺ et HO⁻ apparaissent (+${nbf(PAS, 3)} mol·m⁻³ chacun).`, `Δσ = ${nbf(PAS, 3)} × (λ(Na⁺) + λ(HO⁻)) = ${nbf(PAS, 3)} × (${Lf('Na')} + ${Lf('HO')}) = ${nbf(PP1, 2)} mS·m⁻¹ par mL.`],
        pieges: [[PAS * L('Na'), 'Vous n’avez compté que Na⁺ : HO⁻ s’accumule aussi, avec un λ plus grand.'], [PAS * L('HO'), 'Vous n’avez compté que HO⁻ : Na⁺ s’accumule aussi.'], [PP1 / PAS, `Il manque le facteur ${nbf(PAS, 3)} mol·m⁻³ par mL : multipliez la somme des λ par la variation de concentration.`], [-PP1, 'Signe inversé : après l’équivalence, aucun ion ne disparaît, σ augmente.']],
        expl: `Δσ = ${nbf(PAS, 3)} × (${Lf('Na')} + ${Lf('HO')}) = ${nbf(PP1, 2)} mS·m⁻¹ par mL (σ augmente).`,
        indice: 'Après l’équivalence, aucun ion ne disparaît : deux ions apparaissent. Additionnez leurs λ puis multipliez par 0,500.' } },
    { id: 'allure', titre: 'L’allure prévue de la courbe', focus: [],
      retenirTitre: 'À retenir : la pente dépend des λ',
      retenir: <>
        <SvgPenteCarte/>
        <Ul>
          <li>La pente de σ en fonction du volume versé vaut, à un facteur près : <strong>Σ λ (ions apparus) − Σ λ (ions disparus)</strong>. Elle est positive, négative ou presque nulle selon le cas.</li>
          <li>On compare les λ, pas le nombre d’ions : H₃O⁺ et HO⁻ ont de très grands λ, les autres ions des λ voisins de 5 à 8 mS·m²·mol⁻¹.</li>
          <li>Moyen de s’en souvenir : <strong>« apparus moins disparus »</strong>. Idée fausse : « un ion qui disparaît fait toujours baisser σ ». Vrai : cela dépend du λ de l’ion qui le remplace.</li>
        </Ul></>,
      texte: <>Vous avez prévu deux pentes : <strong>{nbf(PA1, 1)}&nbsp;mS·m⁻¹ par mL avant l’équivalence</strong> et <strong>{signe(PP1, 2)}&nbsp;mS·m⁻¹ par mL après</strong>. La courbe σ = f(V) est donc formée de deux segments de droite. La conductivité de départ est positive (les ions H₃O⁺ et Cl⁻ conduisent).</>,
      tache: { type: 'qcm', q: 'Quelle est l’allure de la courbe σ = f(V) pour ce titrage ?', ...Q.allure,
        expl: 'Avant l’équivalence la pente est négative : σ baisse. Après l’équivalence la pente est positive : σ monte. Les deux segments se rejoignent à l’équivalence, où σ est minimale : la courbe a la forme d’un V.',
        indice: 'Regardez le signe de chaque pente : négative avant, positive après. Que fait la courbe à l’endroit où elle change de pente ?' } },
    { id: 'equiv', titre: 'Le volume équivalent', focus: ['burette'],
      retenirTitre: 'À retenir : une courbe en V',
      retenir: <>
        <SvgVCarte/>
        <Ul>
          <li>Quand un ion de grand λ est remplacé par un ion de plus petit λ, σ <strong>baisse</strong> ; après l’équivalence, le titrant en excès apporte des ions et σ <strong>monte</strong> : la courbe est en V.</li>
          <li>Le <strong>changement de pente</strong> marque l’équivalence : on lit le volume équivalent V<sub>E</sub> à l’intersection des deux droites.</li>
          <li>Moyen de s’en souvenir : <strong>« le coude, c’est l’équivalence »</strong>. Idée fausse : « σ s’annule à l’équivalence ». Vrai : σ est minimale, jamais nulle.</li>
        </Ul></>,
      texte: <>À l’équivalence, la quantité de HO⁻ versée est égale à la quantité initiale de H₃O⁺ : <strong>n(HO⁻ versé) = n(H₃O⁺ initial)</strong>, soit <strong>c<sub>B</sub> × V<sub>E</sub> = c<sub>A</sub> × V<sub>A</sub></strong>. Ici c<sub>A</sub>&nbsp;=&nbsp;4,0×10⁻²&nbsp;mol/L, V<sub>A</sub>&nbsp;=&nbsp;20,0&nbsp;mL et c<sub>B</sub>&nbsp;=&nbsp;0,100&nbsp;mol/L.</>,
      tache: { type: 'num', q: 'Volume équivalent V_E', unite: 'mL', vrai: VE1, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['n(H₃O⁺ initial) = c_A × V_A = 4,0×10⁻² × 20,0 = 0,80 mmol.', `À l’équivalence, n(HO⁻ versé) = c_B × V_E = 0,80 mmol, donc V_E = 0,80 / 0,100 = ${nbf(VE1, 1)} mL.`],
        pieges: [[CA * VA, 'C’est la quantité de matière en mmol : divisez-la par c_B pour obtenir un volume.'], [M.TITRAGES[T1].cB * VA / CA, 'Le rapport est inversé : V_E = c_A × V_A / c_B.'], [CA * VA * M.TITRAGES[T1].cB, 'Il faut diviser par c_B, pas la multiplier.']],
        expl: `V_E = c_A × V_A / c_B = 4,0×10⁻² × 20,0 / 0,100 = ${nbf(VE1, 1)} mL.`,
        indice: 'c_B × V_E = c_A × V_A : isolez V_E. Gardez V_A en mL, le résultat sera en mL.' } },
    { id: 'verif', titre: 'Vérifier avec la mesure', focus: ['lecture', 'cellule'],
      texte: <>On lit maintenant le conductimètre et on trace σ en fonction du volume de soude versé. Déplacez le curseur jusqu’à V<sub>E</sub>&nbsp;=&nbsp;{nbf(VE1, 1)}&nbsp;mL : la courbe a-t-elle bien la forme prévue (un V) ?</>,
      tache: { type: 'num', q: 'Conductivité σ à l’équivalence, lue sur le conductimètre', unite: 'mS·m⁻¹', vrai: SEQ1, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => [`σ(0) = ${nbf(S01, 1)} mS·m⁻¹ au départ ; de 0 à V_E, σ varie de ${nbf(PA1, 1)} × ${nbf(VE1, 1)} = ${nbf(PA1 * VE1, 1)} mS·m⁻¹.`, `σ(V_E) = ${nbf(S01, 1)} − ${nbf(-PA1 * VE1, 1)} = ${nbf(SEQ1, 1)} mS·m⁻¹ : c’est le minimum de la courbe.`],
        pieges: [[S01, 'C’est σ au départ (0 mL versé) : placez le curseur sur le volume équivalent.']],
        expl: `À V = ${nbf(VE1, 1)} mL, le conductimètre indique ${nbf(SEQ1, 1)} mS/m : c’est le minimum de la courbe en V.`,
        indice: 'Placez le curseur sur la valeur de V_E trouvée à l’étape précédente, puis lisez l’afficheur du conductimètre.' } },
    { id: 'faible', titre: 'Un acide faible par la soude', focus: ['equation', 'becher'],
      texte: <>Autre titrage, même méthode. On titre 20,0&nbsp;mL d’<strong>acide éthanoïque</strong> CH₃COOH (un acide faible), c<sub>A</sub>&nbsp;=&nbsp;4,0×10⁻²&nbsp;mol/L, additionnés de 180&nbsp;mL d’eau, par la même soude à 0,100&nbsp;mol/L. L’acide faible est presque entièrement sous forme de <strong>molécules</strong> (en gris) : on néglige les rares ions déjà présents. La réaction de titrage CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O fait disparaître une molécule (qui ne conduit pas) et apparaître un ion CH₃COO⁻ (λ&nbsp;=&nbsp;{Lf('AcO')}&nbsp;mS·m²·mol⁻¹), en plus de Na⁺ apporté par la burette. Prévoyez avant de regarder la mesure : le conductimètre s’affichera quand vous aurez répondu.</>,
      tache: { type: 'qcm', q: 'Avant l’équivalence, comment évolue la conductivité σ ?', ...Q.faible,
        expl: 'Chaque HO⁻ versé fait disparaître une molécule neutre et apparaître deux ions : CH₃COO⁻ et Na⁺. Aucun ion ne disparaît : σ augmente. Comme λ(CH₃COO⁻) et λ(Na⁺) sont petits, l’augmentation est lente.',
        indice: 'Quels ions apparaissent ? Y a-t-il un ion qui disparaît ? Comparez leurs λ à ceux de H₃O⁺ ou HO⁻.' } },
    { id: 'faiblePente', titre: 'Pente d’un acide faible', focus: ['becher'],
      retenirTitre: 'À retenir : deux pentes, acide faible',
      retenir: <>
        <SvgFaibleCarte/>
        <Ul>
          <li>Pour un <strong>acide faible</strong> titré par une base forte, aucun ion ne disparaît avant l’équivalence : σ <strong>augmente lentement</strong> ; après l’équivalence, HO⁻ (λ très grand) en excès la fait augmenter <strong>plus vite</strong>.</li>
          <li>Le titrage d’un acide faible se reconnaît donc à une <strong>rupture de pente</strong> (pente faible, puis pente forte), pas à un minimum.</li>
          <li>Moyen de s’en souvenir : <strong>« faible puis forte »</strong>. Idée fausse : « un acide faible donne aussi une courbe en V ». Vrai : la pente reste positive des deux côtés.</li>
        </Ul></>,
      texte: <>On a prévu que σ augmente lentement. Calculons de combien. Les ions qui apparaissent sont CH₃COO⁻ (λ&nbsp;=&nbsp;{Lf('AcO')}) et Na⁺ (λ&nbsp;=&nbsp;{Lf('Na')}), à raison de {nbf(PAS, 3)}&nbsp;mol·m⁻³ par mL de soude versé ; aucun ion ne disparaît.</>,
      tache: { type: 'num', q: 'Variation de σ pour 1 mL de soude versé, avant l’équivalence', unite: 'mS·m⁻¹ par mL', vrai: PA2, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`Δσ = ${nbf(PAS, 3)} × (λ(CH₃COO⁻) + λ(Na⁺)) = ${nbf(PAS, 3)} × (${Lf('AcO')} + ${Lf('Na')}) = ${nbf(PA2, 2)} mS·m⁻¹ par mL.`, `Après l’équivalence : ${nbf(PAS, 3)} × (${Lf('Na')} + ${Lf('HO')}) = ${nbf(M.penteApres(T2, EAU), 2)} mS·m⁻¹ par mL, bien plus grande.`],
        pieges: [[PAS * L('AcO'), 'Vous n’avez compté que CH₃COO⁻ : Na⁺ apparaît aussi.'], [PAS * L('Na'), 'Vous n’avez compté que Na⁺ : CH₃COO⁻ apparaît aussi.'], [PA2 / PAS, `Il manque le facteur ${nbf(PAS, 3)} mol·m⁻³ par mL.`], [-PA2, 'Signe inversé : aucun ion ne disparaît, σ augmente.']],
        expl: `Δσ = ${nbf(PAS, 3)} × (${Lf('AcO')} + ${Lf('Na')}) = ${nbf(PA2, 2)} mS·m⁻¹ par mL.`,
        indice: 'Additionnez les λ des deux ions qui apparaissent, puis multipliez par 0,500.' } },
    { id: 'inverse', titre: 'On inverse : la soude est dans le bécher', focus: ['equation', 'becher'],
      texte: <>On titre maintenant 20,0&nbsp;mL de <strong>soude</strong> (Na⁺&nbsp;+&nbsp;HO⁻), 4,0×10⁻²&nbsp;mol/L, additionnés de 180&nbsp;mL d’eau, par de l’<strong>acide chlorhydrique</strong> (H₃O⁺&nbsp;+&nbsp;Cl⁻) à 0,100&nbsp;mol/L. La réaction est toujours H₃O⁺ + HO⁻ → 2 H₂O. Avant l’équivalence, HO⁻ disparaît et Cl⁻ apparaît (Na⁺ est spectateur) ; après, H₃O⁺ et Cl⁻ s’accumulent.</>,
      tache: { type: 'qcm', q: 'Comment évolue σ avant puis après l’équivalence ?', ...Q.inverse,
        expl: `Avant l’équivalence, HO⁻ (λ = ${Lf('HO')}) est remplacé par Cl⁻ (λ = ${Lf('Cl')}) : σ baisse. Après, H₃O⁺ (λ = ${Lf('H3O')}) et Cl⁻ s’accumulent : σ monte, et plus vite que pour la soude versée dans l’acide, car λ(H₃O⁺) est le plus grand.`,
        indice: 'Avant : quel ion disparaît, quel ion le remplace, et lequel a le plus grand λ ? Après : quels ions s’accumulent ?' } },
    { id: 'precip', titre: 'Un titrage par précipitation', focus: ['equation', 'becher'],
      texte: <>On titre 20,0&nbsp;mL de chlorure de sodium (Na⁺&nbsp;+&nbsp;Cl⁻), 4,0×10⁻²&nbsp;mol/L, additionnés de 180&nbsp;mL d’eau, par du <strong>nitrate d’argent</strong> (Ag⁺&nbsp;+&nbsp;NO₃⁻) à 0,050&nbsp;mol/L. La réaction est Ag⁺ + Cl⁻ → AgCl(s) : le chlorure d’argent forme un solide (grains blancs), qui ne conduit pas. Avant l’équivalence, Cl⁻ disparaît et NO₃⁻ apparaît ; Na⁺ est spectateur. Chaque mL change les concentrations de {nbf(M.pasConc(T4, EAU), 3)}&nbsp;mol·m⁻³ ; V<sub>E</sub>&nbsp;=&nbsp;{nbf(VE4, 1)}&nbsp;mL.</>,
      tache: { type: 'qcm', q: 'Avant l’équivalence, comment évolue σ ?', ...Q.precip,
        expl: `Cl⁻ (λ = ${Lf('Cl')}) est remplacé par NO₃⁻ (λ = ${Lf('NO3')}) : les λ sont presque égaux, donc σ varie à peine (pente ≈ ${nbf(M.penteAvant(T4, EAU), 3)} mS·m⁻¹ par mL). Après l’équivalence, Ag⁺ et NO₃⁻ s’accumulent : σ monte nettement.`,
        indice: 'Comparez λ de l’ion qui disparaît (Cl⁻) et λ de l’ion qui le remplace (NO₃⁻).' } },
    { id: 'comparer', titre: 'Une base faible par un acide fort', focus: ['equation', 'becher'],
      texte: <>On titre 20,0&nbsp;mL d’<strong>ammoniac</strong> NH₃ (une base faible), 4,0×10⁻²&nbsp;mol/L, additionnés de 180&nbsp;mL d’eau, par de l’acide chlorhydrique à 0,100&nbsp;mol/L. La réaction NH₃ + H₃O⁺ → NH₄⁺ + H₂O fait disparaître une molécule et apparaître NH₄⁺ (λ&nbsp;=&nbsp;{Lf('NH4')}), avec Cl⁻ (λ&nbsp;=&nbsp;{Lf('Cl')}). Après l’équivalence, H₃O⁺ (λ&nbsp;=&nbsp;{Lf('H3O')}) et Cl⁻ s’accumulent. Les deux pentes sont positives.</>,
      tache: { type: 'qcm', q: 'Quelle pente est la plus forte, et pourquoi ?', ...Q.comparer,
        expl: `Avant : NH₄⁺ et Cl⁻ apparaissent, λ voisins de ${Lf('NH4')} : pente de ${nbf(M.penteAvant(T5, EAU), 2)} mS·m⁻¹ par mL. Après : H₃O⁺ et Cl⁻ apparaissent, avec le grand λ(H₃O⁺) : pente de ${nbf(M.penteApres(T5, EAU), 1)} mS·m⁻¹ par mL.`,
        indice: 'Calculez la somme des λ des ions qui apparaissent avant, puis après l’équivalence : comparez.' } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : cinq allures à reconnaître',
      retenir: <>
        <SvgRecapCarte/>
        <Ul>
          <li>Une seule méthode : <strong>ions apparus − ions disparus</strong>, en comparant les λ, avant puis après l’équivalence ; le volume équivalent vient de c<sub>B</sub> × V<sub>E</sub> = c<sub>A</sub> × V<sub>A</sub>.</li>
          <li>Acide ou base <strong>forts</strong> : courbe en V. Acide ou base <strong>faibles</strong> : deux pentes positives (faible, puis forte). <strong>Précipitation</strong> : presque plate puis montante.</li>
          <li>Moyen de s’en souvenir : <strong>« qui part, qui arrive, qui pèse (λ) »</strong>. Idée fausse : « on repère l’équivalence au point où σ est la plus petite » : vrai seulement pour la courbe en V, sinon c’est la rupture de pente.</li>
        </Ul></>,
      texte: <>Vous savez prévoir l’allure d’une courbe de titrage conductimétrique : classer les ions, comparer les λ avant et après l’équivalence, puis repérer le volume équivalent au changement de pente. Passez à l’exploration pour tester d’autres titrages et d’autres concentrations, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const aleatoire = tab => [...tab].sort(() => Math.random() - 0.5);
  const nouveauDefi = type => {
    setJoue(false);
    if (type === 'associer') { const d = M.tirageDefiAssocier(); setDefi({ type, ...d, lignes: aleatoire(d.ids), choix: {}, verifie: false }); }
    else setDefi({ type, ...M.tirageDefiPente(), rep: '', verifie: false });
  };
  function changerMode(md) {
    setMode(md); setJoue(false);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(tp) { setTypeDefi(tp); nouveauDefi(tp); }
  const TOL_P = 0.08;
  const lettreDe = (d, id) => 'ABC'[d.ordre.indexOf(id)];
  const verifier = () => {
    const d = defi; let diag, ok = false;
    if (d.type === 'associer') {
      const manque = d.lignes.some(id => !d.choix[id]), doublon = new Set(d.lignes.map(id => d.choix[id])).size < d.lignes.length;
      if (manque) diag = { msg: 'Associez chaque titrage à une courbe (A, B ou C) avant de vérifier.' };
      else if (doublon) diag = { msg: 'Chaque courbe correspond à un seul titrage : deux titrages ont reçu la même lettre.' };
      else {
        const faux = d.lignes.filter(id => d.choix[id] !== lettreDe(d, id));
        if (!faux.length) { ok = true; diag = { msg: '' }; }
        else diag = { msg: `${faux.length === 1 ? 'Un titrage est mal associé' : `${faux.length} titrages sont mal associés`} : ${faux.map(id => `pour ${M.TITRAGES[id].court}, ${resume(id, d.eau)}`).join(' ; ')}.` };
      }
      setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
      if (!(manque || doublon)) noterA(ok);
      return;
    }
    const v = lireNombre(d.rep), Tt = M.TITRAGES[d.t], pas = M.pasConc(d.t, d.eau), dic = d.avant ? Tt.avant : Tt.apres;
    if (!isFinite(v)) diag = { msg: 'Entrez un nombre (par exemple −15 ou 4,55), avec son signe, en mS·m⁻¹ par mL.' };
    else if (accepte(v, d.rep, d.vrai, TOL_P)) { ok = true; diag = { msg: '' }; }
    else {
      const somme = f => Object.entries(dic).filter(([, nu]) => f(nu)).reduce((s, [i, nu]) => s + nu * L(i), 0);
      const essais = [
        [-d.vrai, 'Signe inversé : les ions qui apparaissent comptent +, ceux qui disparaissent comptent −, donc la pente est (apparus − disparus).'],
        [d.vrai / pas, `Il manque la variation de concentration par mL (${nbf(pas, pas < 1 ? 3 : 2)} mol·m⁻³ par mL) : multipliez la somme des λ par ce facteur.`],
        [pas * somme(nu => nu > 0), 'Vous n’avez compté que les ions qui apparaissent : il faut retrancher λ des ions qui disparaissent.'],
        [pas * somme(nu => nu < 0), 'Vous n’avez compté que les ions qui disparaissent : il faut ajouter λ des ions qui apparaissent.'],
        [d.vrai / 1000, 'Vous avez divisé par 1 000 : la variation de concentration est déjà en mol·m⁻³, et λ en mS·m²·mol⁻¹ donne des mS·m⁻¹.'],
        [d.vrai * M.Vdepart(d.eau) / 1000, `Vous avez multiplié par le volume (${nbf(M.Vdepart(d.eau), 0)} mL) : on divise la quantité versée par ce volume pour avoir la variation de concentration.`],
      ].filter(([val]) => isFinite(val) && val !== 0);
      const trouve = essais.find(([val]) => Math.abs(val - d.vrai) > 0.03 * Math.abs(d.vrai) && Math.abs(v - val) <= 0.06 * Math.abs(val));
      diag = trouve ? { msg: trouve[1] } : { msg: `Votre valeur est ${v < d.vrai ? 'trop petite' : 'trop grande'} (en tenant compte du signe). Refaites le bilan des ions ${d.avant ? 'avant' : 'après'} l’équivalence, puis calculez variation de concentration × (Σ λ apparus − Σ λ disparus).` };
    }
    setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
    noterP(ok);
  };
  const correction = d => d.type === 'associer'
    ? `Bonne association : ${d.lignes.map(id => `${M.TITRAGES[id].court} → courbe ${lettreDe(d, id)} (${resume(id, d.eau)})`).join(' ; ')}.`
    : `${detailPente(d.t, d.avant, d.eau)} (marge acceptée : 8 %).`;
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['associer', 'Associer titrage et courbe'], ['pente', 'Pente de la courbe']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'associer' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle courbe pour quel titrage ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>On a titré, avec la même prise d’essai (20,0 mL à {sci(defi.cA, 1)} mol/L, avec {defi.eau} mL d’eau), trois solutions différentes. Les courbes σ = f(V), sans graduation, sont ci-dessous dans le désordre. <strong>Prévoyez</strong> l’allure de chaque titrage avec les λ, puis associez-lui sa courbe.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
          {defi.ordre.map((id, i) => <MiniCourbe key={id} t={id} cA={defi.cA} eau={defi.eau} nom={'ABC'[i]}/>)}
        </div>
        {defi.lignes.map(id => <div key={id} style={{ ...styleBoite, marginBottom: 6, padding: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{M.TITRAGES[id].titre}</div>
          <div style={{ fontSize: 14, color: KIT.txt2, margin: '2px 0 4px' }}>{M.TITRAGES[id].reaction}</div>
          <label style={{ display: 'block', fontSize: 13, color: KIT.txt2 }}>Courbe correspondante
            <select value={defi.choix[id] || ''} onChange={e => setDefi(s => ({ ...s, choix: { ...s.choix, [id]: e.target.value }, verifie: false, corr: false }))} style={{ ...menu, marginTop: 2 }}>
              <option value="">— choisir —</option>{['A', 'B', 'C'].map(l => <option key={l} value={l}>courbe {l}</option>)}
            </select></label>
        </div>)}
        <IndiceDefi cache={false}>Pour chaque titrage, cherchez les ions qui disparaissent et ceux qui apparaissent, puis comparez leurs λ avant l’équivalence : pente négative (courbe en V), faiblement positive (deux pentes) ou presque nulle (précipitation).</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est la pente de la courbe ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Titrage : <strong>{M.TITRAGES[defi.t].titre}</strong>. Prise d’essai : 20,0 mL à <strong>{sci(defi.cA, 1)}{NB}mol/L</strong>, avec <strong>{defi.eau}{NB}mL</strong> d’eau (volume de départ {M.Vdepart(defi.eau)} mL, supposé constant). Titrant à <strong>{nbf(M.TITRAGES[defi.t].cB, 3)}{NB}mol/L</strong>. Réaction : {M.TITRAGES[defi.t].reaction}. Calculez la variation de σ pour 1 mL de titrant versé <strong>{defi.avant ? 'avant' : 'après'} l’équivalence</strong>, en mS·m⁻¹ par mL, avec son signe et au moins 2 chiffres significatifs.</div>
      </>}
      {defi.type === 'pente' && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>pente =</span>
        <input value={defi.rep} aria-label="pente en mS par mètre par mL" onKeyDown={e => e.key === 'Enter' && document.getElementById('al-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>mS·m⁻¹ par mL</span>
      </div>}
      {defi.type === 'pente' && <IndiceDefi cache={false}>Variation de concentration par mL = c<sub>B</sub> × 1 mL / volume de départ (en mol·m⁻³). Puis pente = cette valeur × (Σ λ des ions qui apparaissent − Σ λ des ions qui disparaissent).</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="al-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? correction(defi) : defi.diag.msg))}
        {!defi.ok && defi.diag.msg && !/^Associez|^Chaque courbe|^Entrez/.test(defi.diag.msg) && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 42 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(correction(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; les conductivités ioniques molaires λ sont des valeurs usuelles arrondies au dixième (données du problème), supposées constantes. Le conductimètre est idéal et affiche directement σ.</li>
      <li><strong>Loi de Kohlrausch</strong> : σ = Σ λ × c, valable pour une solution <strong>diluée</strong> (ions à moins de 10 mol·m⁻³, soit 1,0×10⁻² mol/L). Ici les concentrations ioniques atteignent au plus 12,5 mol·m⁻³ à l’extrémité de certaines courbes (25 mL versés) : léger dépassement, sans conséquence pour l’allure.</li>
      <li><strong>Sans dilution</strong> (comme le programme l’autorise) : le volume de la solution est pris constant, égal au volume de départ (prise d’essai + eau, 200 ou 300 mL). En réalité, 25 mL ajoutés à 200 mL diluent d’environ 11 % : la courbe réelle s’incurve un peu après l’équivalence. C’est pourquoi on ajoute de l’eau avant le titrage.</li>
      <li><strong>Exploration : dilution réelle</strong>. Le conductimètre affiche σ mesurée, abaissée par la dilution (volume V<sub>0</sub> + V). On trace σ' = σ × (V<sub>0</sub> + V) / V<sub>0</sub>, avec V<sub>0</sub> = prise d’essai + eau : c’est exactement la grandeur « sans dilution » des autres modes. Autour de V<sub>E</sub> (à moins de 1,5 mL), la courbe est arrondie (hypothèse du modèle : bosse gaussienne de 0,9 mL de large, de hauteur 6 % de σ' maximale), ce qui oblige à écarter ces points. L’incertitude de mesure optionnelle est de ± 0,5 % (loi normale tronquée à ± 2 écarts-types, une mesure indépendante par palier).</li>
      <li><strong>Transformation de titrage totale et rapide</strong> ; l’équivalence est repérée au changement de pente. Les droites du modèle sont idéales : une courbe mesurée est un peu arrondie autour de l’équivalence.</li>
      <li><strong>Acide faible et base faible</strong> : les ions déjà présents au départ (dissociation partielle) sont négligés ; σ de départ est prise nulle. En réalité, elle part d’une petite valeur non nulle et peut baisser très légèrement au tout début ; le reste de la courbe est bien décrit par la droite d’avant l’équivalence.</li>
      <li><strong>Précipitation</strong> : le chlorure d’argent est supposé totalement insoluble et ne contribue pas à σ ; la solubilité résiduelle est négligée.</li>
      <li><strong>Schéma</strong> : un point représente 0,1 mmol d’espèce ; l’agitation est schématique et ne représente ni les vitesses ni les distances réelles. Aucun bruit de mesure n’est simulé.</li>
      <li><strong>Limites</strong> : pas de variation de température, pas de réaction acido-basique parasite de l’eau (K<sub>e</sub>) dans les calculs, pas de dosage en retour.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, curseur, graphique, données ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const montrerScene = enGuide ? { equation: rang(idE) >= rang('spectateur'), cellule: true, ions: true, burette: true, legende: true } : { equation: true, cellule: !(dd && dd.type === 'pente'), ions: true, burette: true, legende: true };
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <SceneAllure t={t} cA={cA} VB={vb} lecture={lecture} anime={!reduit} montrer={montrerScene} hl={hl}/>
    </div>);
  const boxCurseur = (
    <div style={styleBoite}>
      <Curseur nom={`Volume de ${T.titrant} versé`} valeur={vb} onChange={v => { setJoue(false); setVb(v); }} min={0} max={V_MAX} pas={0.5} unite="mL" decimales={1}/>
      <button type="button" onClick={() => { if (joue) setJoue(false); else { if (vb >= V_MAX) setVb(0); setJoue(true); } }} style={{ ...styleBouton(false), minHeight: 42 }}>{joue ? 'Pause' : (vb >= V_MAX ? 'Recommencer' : 'Verser la burette')}</button>
    </div>);
  const courbesAff = [{ pts: ptsDe(t, cA, eau), couleur: COL.bleu }];
  const yMax = yMaxPour([{ t, cA, eau }]);
  const grapheOk = enGuide && (idE === 'verif' || (rang(idE) > rang('verif') && idE !== 'bilan' && reussie));
  const veVisible = enGuide && rang(idE) >= rang('equiv') + 1 && (idE === 'verif' || reussie);
  const boxGraphe = grapheOk && (
    <div style={styleBoite}>
      <div style={titreCarte}>Conductivité en fonction du volume versé</div>
      <GraphiqueAllure courbes={courbesAff} marqueur={{ VB: vb, sigma: sig }} VE={veVisible ? VE : null} yMax={yMax} jusqua={vb} titre={`Courbe de titrage : ${T.titre}`}/>
    </div>);
  const lignesLambda = (ionsLambda || []).map(i => [F(i), L(i)]);
  const tableLambda = lignesLambda.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('donnees') }}>
      <div style={titreCarte}>Données : conductivités ioniques molaires λ</div>
      <div style={aide}>En mS·m²·mol⁻¹, à 25 °C.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>
        {lignesLambda.map(([f, l]) => <span key={f} style={{ whiteSpace: 'nowrap' }}>λ({f}) = <strong>{nbf(l, 1)}</strong></span>)}
      </div>
    </div>);

  const sectionLambda = enExplore && (
    <Section titre="Données : conductivités ioniques molaires" ouvert={ouv.lambda} onBascule={() => setOuv(o => ({ ...o, lambda: !o.lambda }))}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>
        {M.ORDRE_IONS.map(i => <span key={i} style={{ whiteSpace: 'nowrap' }}>λ({F(i)}) = <strong>{Lf(i)}</strong></span>)}
      </div>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>En mS·m²·mol⁻¹, à 25 °C.</div>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Versez tout le titrage de l’acide fort par paliers de 1 mL, affichez σ non corrigée (ronds gris) : pourquoi s’incurve-t-elle après l’équivalence, alors que σ' reste formée de deux droites ?</li>
        <li>Modélisez d’abord avec <strong>tous</strong> les points (droite 1 jusqu’à V<sub>E</sub>, droite 2 après), puis sans les points proches de l’équivalence : comment varie le volume équivalent trouvé ? Quel est le meilleur choix ?</li>
        <li>Combien de points faut-il sur chaque branche ? Essayez avec 2 points, puis 5 : l’écart sur V<sub>E</sub> change-t-il ? Activez l’incertitude de mesure pour voir son effet.</li>
        <li>Refaites l’exercice pour l’acide faible (pente faible puis forte) et pour la précipitation (presque plate puis montante) : la méthode des deux droites reste-t-elle valable ?</li>
        <li>Doublez c<sub>A</sub> : que deviennent V<sub>E</sub> et les pentes ? Retrouvez c<sub>A</sub> à partir du V<sub>E</sub> modélisé.</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>σ = Σ λ × c (loi de Kohlrausch) : seuls les ions dont la quantité change font varier σ ; les ions spectateurs n’y changent rien</li>
          <li>{avecIndices("Dilution : on trace σ' = σ × (V₀ + V) / V₀, qui est formée de deux droites ; V₀ = prise d’essai + eau")}</li>
          <li>On modélise <strong>chaque branche</strong> par une droite affine (au moins 3 points, loin de l’équivalence) ; V<sub>E</sub> est l’abscisse de leur intersection</li>
          <li>{avecIndices('Équivalence : c_B × V_E = c_A × V_A')}, repérée à la rupture de pente ; <strong>pas de point proche de l’équivalence</strong> (courbe arrondie)</li>
          <li>Acide ou base forts : courbe en V ; acide ou base faibles : pente faible puis forte ; précipitation : presque plate puis montante</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .al-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .al-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .al-col { display: flex; flex-direction: column; gap: 12px; }
        .al-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .al-l1.cote .al-carte { order: 2; } .al-l1.cote .al-main { order: 1; }
          .al-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .al-ex > * { grid-column: 1; } .al-ex > .al-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .al-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .al-in { animation: al-fondu 0.35s ease-out; } @keyframes al-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Allure d’une courbe de titrage conductimétrique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Au cours d’un titrage, des ions disparaissent, d’autres apparaissent : en comparant leurs <strong>conductivités ioniques molaires λ</strong>, on prévoit l’allure de la courbe σ = f(V) sans calcul compliqué.</div>
      {!enExplore && <div className={enGuide ? "al-l1 cote" : "al-l1"}>
        {enGuide ? <div className="al-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="al-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'associer' ? suiviA : suiviP}/></div>}
          <div className="al-col">
            {(enGuide || (enDefi && defi && defi.type === 'pente')) && <div className="al-in">{boxScene}</div>}
            {(enGuide || (enDefi && defi && defi.type === 'pente')) && <div className="al-in">{boxCurseur}</div>}
            {enGuide && boxGraphe && <div className="al-in">{boxGraphe}</div>}
            {tableLambda && enGuide && <div className="al-in">{tableLambda}</div>}
            {enDefi && defi && defi.type === 'pente' && <div>{tableLambda}</div>}
            {enDefi && defi && defi.type === 'associer' && <div>{tableLambda}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="al-ex">
        <ExplorationDosage aEssayer={aEssayer} retenir={retenirExplore} panneauHypo={panneauHypo} sectionLambda={sectionLambda} reduit={reduit}/>
      </div>}
      {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
