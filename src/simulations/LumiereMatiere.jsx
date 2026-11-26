import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, Formule, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./lumMatModele";
import { QCM } from "./lumMatQcm";
import { SceneEchelle, SceneNiveaux, SceneAtome, SceneInteractions, SceneDeuxSpectres, SvgCarteConversions, SvgCarteNiveaux, SvgCarteBilan } from "./LumMatSchemas";

const SIM_ID = 300, CLE_GUIDE = 'lum-guide-v1';
declarerDefis(SIM_ID, [['ir', 'Convertir une bande infrarouge'], ['h', 'La raie de l’hydrogène']]);

// ====================================================
//  SIM 300 — PHOTONS, NIVEAUX D'ÉNERGIE ET DOMAINES SPECTRAUX (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : associer émission, absorption ou diffusion à un flux de photons ; distinguer absorption et extinction ;
//  distinguer spectre d'absorbance et de transmittance ; associer un domaine spectral à la nature de la transition ; établir un schéma d'absorption et d'émission
//  entre niveaux électroniques, vibrationnels, rotationnels ; associer à chaque spectroscopie l'ordre de grandeur de l'énergie échangée.
//  Modèle : lumMatModele.js. Schémas : LumMatSchemas.jsx.
// ====================================================

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = '\u00a0';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const sci = v => { const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e; return `${fr(m, 2)}·10${String(e).replace('-', '⁻').split('').map(c => ({ 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[c] ?? c)).join('')}`; };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['photon', 'calcE', 'sigma', 'domaines', 'atome', 'niveaux', 'transition', 'ordre', 'interactions', 'spectres', 'absorbance', 'extinction', 'bilan'];
const BASE = { lam: 550 };
const DEPART = { photon: { lam: 550 }, calcE: { lam: 450 }, sigma: { lam: 5000 }, domaines: { lam: 550 }, transition: { lam: 550 } };
const tToLam = t => 10 ** (2 + t / 1000 * 5), lamToT = l => Math.round((Math.log10(l) - 2) / 5 * 1000);
const arrondi3 = v => Number(Number(v).toPrecision(3));
const txtLam = l => (l >= 1e6 ? `${fr(l / 1e6, 2)}${NB}mm` : l >= 1000 ? `${fr(l / 1000, l >= 1e5 ? 0 : 1)}${NB}µm` : `${fr(l, 0)}${NB}nm`);
const EXEMPLES = [{ nom: 'Lampe UV germicide (254 nm)', lam: 254 }, { nom: 'LED bleue (450 nm)', lam: 450 }, { nom: 'Laser hélium-néon (633 nm)', lam: 633 }, { nom: 'Bande O–H libre (3620 cm⁻¹)', lam: M.lamDeSigma(3620) }, { nom: 'Bande C=O d’une cétone (1715 cm⁻¹)', lam: M.lamDeSigma(1715) }, { nom: 'Rotation d’une petite molécule (16 cm⁻¹)', lam: M.lamDeSigma(16) }];
const TRANS = { el: { nom: 'Transition électronique', dE: M.MOL.el }, vib: { nom: 'Transition vibrationnelle', dE: M.MOL.vib }, rot: { nom: 'Transition rotationnelle', dE: M.MOL.rot } };
const actifDe = lam => { const id = M.domaineDe(lam).id; return id === 'uv' || id === 'vis' ? 'el' : id === 'ir' ? 'vib' : id === 'fir' ? 'rot' : null; };
const Fe = <Formule><mi>E</mi><mo>=</mo><mi>h</mi><mo>·</mo><mi>ν</mi><mo>=</mo><mi>h</mi><mo>·</mo><mfrac><mi>c</mi><mi>λ</mi></mfrac><mo>=</mo><mi>h</mi><mo>·</mo><mi>c</mi><mo>·</mo><mi>σ</mi></Formule>;
const Fsig = <FormuleEnLigne><mi>σ</mi><mo>=</mo><mfrac><mn>1</mn><mi>λ</mi></mfrac></FormuleEnLigne>;
const Flog = <FormuleEnLigne><mi>A</mi><mo>=</mo><mi>log</mi><mfrac><mn>1</mn><mi>T</mi></mfrac></FormuleEnLigne>;
const num2 = s => parseFloat(String(s).replace(/\s|\u00a0/g, '').replace(',', '.').replace('−', '-'));

export function SimulationLumiereMatiere() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState({ onglet: 'photon', lam: 550, trans: 'el', ni: 3, nf: 2 });
  const [ouv, setOuv] = useState({});
  const [suiviI, noterI] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('ir');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const lamV = vie.lam, okIR = M.domaineDe(lamV).id === 'ir';
  const E450 = M.energieEV(450), L32 = M.raieH(3, 2), S1700 = M.eVDeSigma(1700), A25 = M.absorbance(0.25);
  const ETAPES = [
    { id: 'photon', titre: 'Un photon et son énergie', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Un rayonnement de longueur d’onde <strong>λ</strong> est un flux de <strong>photons</strong>, chacun transportant l’énergie {Fe}Faites varier λ avec le curseur et regardez, dans les mesures, l’énergie d’un photon.</>,
      tache: { type: 'qcm', q: 'Quand la longueur d’onde d’un photon diminue, son énergie…', ...QCM.photon,
        expl: 'E = h·c/λ : l’énergie est inversement proportionnelle à la longueur d’onde. Un photon UV (λ petite) est plus énergétique qu’un photon visible, lui-même plus énergétique qu’un photon infrarouge.', indice: 'Déplacez le curseur vers la gauche (λ plus petite) et regardez la ligne « Énergie du photon ».' } },
    { id: 'calcE', titre: 'Calculer l’énergie d’un photon', focus: ['scene'],
      texte: <>Un photon de longueur d’onde <strong>450{NB}nm</strong> (lumière bleue). Données : h = 6,63·10⁻³⁴{NB}J·s ; c = 3,00·10⁸{NB}m/s ; 1{NB}eV = 1,60·10⁻¹⁹{NB}J. Convertissez λ en mètres, calculez E en joules, puis en électronvolts.</>,
      tache: { type: 'num', q: 'Énergie E d’un photon de 450 nm', unite: 'eV', vrai: arrondi3(E450), tol: 0.05, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['λ = 450 nm = 4,50·10⁻⁷ m.', `E = h·c/λ = 6,63·10⁻³⁴ × 3,00·10⁸ / 4,50·10⁻⁷ = ${sci(M.energieJ(450))} J.`, `E = ${sci(M.energieJ(450))} / 1,60·10⁻¹⁹ = ${fr(E450, 2)} eV.`],
        pieges: [[M.energieJ(450), 'Vous avez laissé le résultat en joules : divisez par 1,60·10⁻¹⁹ pour obtenir des électronvolts.'], [E450 * 1e-9, 'Vous avez utilisé λ = 450 en nanomètres dans la formule : convertissez-la en mètres (450 nm = 4,50·10⁻⁷ m).'], [M.energieJ(450) * 1e19, 'Vous avez donné E en unités de 10⁻¹⁹ J : pour l’exprimer en eV, divisez par 1,60 (1 eV = 1,60·10⁻¹⁹ J).']],
        expl: 'On convertit λ en mètres, on applique E = h·c/λ, puis on divise par 1,60·10⁻¹⁹ J/eV. Un photon bleu transporte environ 2,8 eV.', indice: 'E = h·c/λ avec λ en mètres ; puis E(eV) = E(J) / 1,60·10⁻¹⁹.' } },
    { id: 'sigma', titre: 'Le nombre d’onde σ', retenirTitre: 'À retenir : un photon, quatre grandeurs', retenir: <SvgCarteConversions/>, focus: ['scene'],
      texte: <>En infrarouge, on repère un rayonnement par son <strong>nombre d’onde</strong> {Fsig}, exprimé en <strong>cm⁻¹</strong> (λ doit alors être en cm), et on a E = h·c·σ. Un rayonnement infrarouge a pour longueur d’onde <strong>5,0{NB}µm</strong> (1{NB}µm = 10⁻⁴{NB}cm).</>,
      tache: { type: 'num', q: 'Nombre d’onde σ d’un rayonnement de longueur d’onde 5,0 µm', unite: 'cm⁻¹', vrai: 2000, tol: 0.05, affiche: v => String(Math.round(v)), cs: 2,
        calcul: () => ['λ = 5,0 µm = 5,0·10⁻⁴ cm.', 'σ = 1/λ = 1 / 5,0·10⁻⁴ = 2,0·10³ cm⁻¹, soit 2000 cm⁻¹.'],
        pieges: [[5e-4, 'Vous avez donné λ en centimètres : σ est son inverse.'], [0.2, 'Vous avez calculé 1/5 sans convertir les micromètres en centimètres (1 µm = 10⁻⁴ cm).'], [20000, 'Il y a une erreur de puissance de 10 : 1 µm vaut 10⁻⁴ cm, donc σ = 10⁴ / 5,0.'], [200, 'Il y a une erreur de puissance de 10 : 1 µm vaut 10⁻⁴ cm, donc σ = 10⁴ / 5,0.']],
        expl: 'σ = 1/λ avec λ en cm : 1 / (5,0·10⁻⁴ cm) = 2000 cm⁻¹. En pratique, σ(cm⁻¹) = 10 000 / λ(µm).', indice: 'Convertissez d’abord 5,0 µm en centimètres, puis prenez l’inverse.' } },
    { id: 'domaines', titre: 'Les domaines spectraux', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Les molécules absorbent un photon seulement si son énergie correspond à un écart entre deux niveaux d’énergie : l’énergie échangée est <strong>quantifiée</strong>. Le domaine du rayonnement (UV, visible, infrarouge) indique donc la nature de la transition. Parcourez l’échelle avec le curseur : le nom de la transition associée apparaît sous chaque domaine.</>,
      tache: { type: 'qcm', q: 'Quel rayonnement fait vibrer les liaisons d’une molécule ?', ...QCM.domaines,
        expl: 'Les vibrations de liaisons correspondent à des énergies de l’ordre de 0,06 à 0,5 eV, soit des nombres d’onde de 500 à 4000 cm⁻¹ : c’est l’infrarouge. Les transitions électroniques demandent des photons UV-visibles.', indice: 'Regardez sous quel domaine de l’échelle est écrit « vibration ».' } },
    { id: 'atome', titre: 'Un atome : l’hydrogène',
      texte: <>Un atome n’émet que des radiations bien précises. Dans le diagramme de l’hydrogène (énergies en eV), un électron passe du niveau <strong>n = 3</strong> au niveau <strong>n = 2</strong> : l’atome émet un photon d’énergie égale à la différence d’énergie. On rappelle E(eV) × λ(nm) = 1243.</>,
      focus: ['scene'],
      tache: { type: 'num', q: 'Longueur d’onde de la radiation émise lors de la transition n = 3 → n = 2', unite: 'nm', vrai: arrondi3(L32), tol: 0.05, affiche: v => fr(v, 0), cs: 3,
        calcul: () => [`ΔE = E₃ − E₂ = ${fr(M.niveauH(3), 2)} − (${fr(M.niveauH(2), 2)}) = ${fr(M.niveauH(3) - M.niveauH(2), 2)} eV, soit un photon de ${fr(Math.abs(M.niveauH(3) - M.niveauH(2)), 2)} eV.`, `λ = 1243 / ${fr(Math.abs(M.niveauH(3) - M.niveauH(2)), 2)} ≈ ${fr(L32, 0)} nm : raie rouge de la série de Balmer.`],
        pieges: [[M.raieH(3, 1), 'Vous avez pris le niveau n = 1 au lieu de n = 2 : repérez bien le niveau final dans le diagramme.'], [1243 / (Math.abs(M.niveauH(3)) + Math.abs(M.niveauH(2))), 'Vous avez additionné les énergies : l’énergie du photon est la différence entre les deux niveaux.'], [Math.abs(M.niveauH(3) - M.niveauH(2)), 'Vous avez donné l’énergie en eV : il faut en déduire la longueur d’onde, λ = 1243 / E.']],
        expl: 'Le photon emporte l’énergie perdue par l’électron, ΔE = 1,89 eV. λ = 1243 / 1,89 ≈ 658 nm (en réalité 656 nm : les 13,6 eV sont arrondis). Chaque raie d’émission correspond à une transition entre deux niveaux.', indice: 'Calculez |E₃ − E₂| en eV, puis λ = 1243 / ΔE.' } },
    { id: 'niveaux', titre: 'Une molécule : trois types de niveaux',
      retenirTitre: 'À retenir : trois types d’énergie', retenir: <SvgCarteNiveaux/>, focus: ['scene'],
      texte: <>Une molécule a, en plus des niveaux électroniques, des niveaux de <strong>vibration</strong> (les atomes oscillent autour de leur position d’équilibre) et de <strong>rotation</strong> (la molécule tourne sur elle-même, surtout dans les gaz). Chaque niveau électronique contient des sous-niveaux de vibration, eux-mêmes divisés en sous-niveaux de rotation. Les énergies de ces trois types sont de grandeurs très différentes (schéma non à l’échelle).</>,
      tache: { type: 'qcm', q: 'Comment se classent les trois énergies ?', ...QCM.niveaux,
        expl: 'La rotation demande très peu d’énergie (10⁻⁴ à 10⁻² eV), la vibration davantage (0,06 à 0,5 eV), les électrons beaucoup plus (1 à 10 eV) : E rot ≪ E vib ≪ E él.', indice: 'Regardez la longueur des flèches : plus l’écart est grand, plus il faut d’énergie.' } },
    { id: 'transition', titre: 'Quelle transition pour quel photon ?', focus: ['scene', 'curseur'],
      texte: <>On veut faire <strong>vibrer</strong> les liaisons d’une molécule en lui envoyant un photon. Réglez la longueur d’onde avec le curseur : le schéma indique la transition que le photon peut provoquer d’après son domaine.</>,
      tache: { type: 'action', ok: okIR, label: 'Régler λ dans le domaine de la vibration', faire: () => setVie(v => ({ ...v, lam: 6000 })), consigne: 'Placez le curseur dans le domaine « IR moyen » (de 2,5 à 20 µm)' } },
    { id: 'ordre', titre: 'L’énergie d’une bande infrarouge', focus: [],
      texte: <>Dans un spectre infrarouge, la bande de la liaison C=O d’une cétone est située à <strong>1700{NB}cm⁻¹</strong>. On utilise E = h·c·σ, avec σ en m⁻¹ (1700{NB}cm⁻¹ = 1,70·10⁵{NB}m⁻¹). Mêmes constantes que précédemment.</>,
      tache: { type: 'num', q: 'Énergie du photon absorbé à 1700 cm⁻¹', unite: 'eV', vrai: arrondi3(S1700), tol: 0.05, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['σ = 1700 cm⁻¹ = 1,70·10⁵ m⁻¹.', `E = h·c·σ = 6,63·10⁻³⁴ × 3,00·10⁸ × 1,70·10⁵ = ${sci(M.H * M.CL * 1.7e5)} J.`, `E = ${sci(M.H * M.CL * 1.7e5)} / 1,60·10⁻¹⁹ ≈ ${fr(S1700, 2)} eV : de l’ordre de 0,1 eV, bien moins qu’un photon visible.`],
        pieges: [[S1700 / 100, 'Vous avez utilisé σ en m⁻¹ sans convertir : 1700 cm⁻¹ = 1,70·10⁵ m⁻¹ (facteur 100).'], [M.H * M.CL * 1.7e5, 'Vous avez laissé le résultat en joules : divisez par 1,60·10⁻¹⁹.'], [S1700 * 100, 'Vous avez converti dans le mauvais sens : 1 cm⁻¹ = 100 m⁻¹.']],
        expl: 'E = h·c·σ ≈ 0,21 eV : c’est bien l’ordre de grandeur d’une vibration (0,06 à 0,5 eV), environ dix fois plus faible qu’un photon visible.', indice: 'Convertissez σ en m⁻¹, calculez E en joules, puis en eV.' } },
    { id: 'interactions', titre: 'Émission, absorption, diffusion', focus: ['scene'],
      texte: <>La lumière interagit de trois façons avec la matière. <strong>Émission</strong> : la matière émet des photons (lampe à vapeur de mercure). <strong>Absorption</strong> : des photons disparaissent, leur énergie est transférée à la matière. <strong>Diffusion</strong> : des photons sont relancés dans toutes les directions.</>,
      tache: { type: 'qcm', q: 'Le ciel est bleu parce que les molécules de l’air…', ...QCM.interactions,
        expl: 'Les molécules de dioxygène et de diazote diffusent la lumière du Soleil dans toutes les directions, bien plus le bleu que le rouge : c’est de la diffusion, pas de l’absorption.', indice: 'La lumière n’est ni créée ni retirée du faisceau : elle change de direction.' } },
    { id: 'spectres', titre: 'Spectre d’absorbance, spectre de transmittance', focus: ['scene'],
      texte: <>On trace le spectre UV-visible en <strong>absorbance A</strong> en fonction de λ (une bande est un maximum). Le spectre infrarouge se trace en <strong>transmittance T</strong> (fraction de lumière transmise) en fonction du nombre d’onde σ, souvent de 4000 à 500{NB}cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Dans un spectre infrarouge tracé en transmittance, une bande d’absorption est…', ...QCM.spectres,
        expl: 'Quand la molécule absorbe, moins de lumière est transmise : la transmittance chute, d’où un creux. En absorbance, c’est l’inverse : une bande est un pic.', indice: 'Absorber plus, c’est transmettre moins.' } },
    { id: 'absorbance', titre: 'De la transmittance à l’absorbance', focus: [],
      texte: <>À une longueur d’onde donnée, un échantillon transmet <strong>25{NB}%</strong> de la lumière : T = 0,25. L’absorbance est {Flog} (logarithme décimal, touche « log » de la calculatrice).</>,
      tache: { type: 'num', q: 'Absorbance A de l’échantillon (T = 0,25)', unite: '', vrai: arrondi3(A25), tol: 0.05, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['A = log(1/T) = log(1/0,25) = log(4).', `A ≈ ${fr(A25, 2)}. Hypothèse : on néglige la lumière diffusée ou réfléchie.`],
        pieges: [[Math.log(4), 'Vous avez utilisé le logarithme népérien (ln) : l’absorbance utilise le logarithme décimal (log).'], [0.75, 'Vous avez calculé 1 − T, la part de lumière absorbée : l’absorbance vaut log(1/T).'], [4, 'Vous avez calculé 1/T sans prendre le logarithme.']],
        expl: 'A = log(1/T) = log 4 ≈ 0,60. Une absorbance de 0,60 correspond à une transmittance de 25 % : 75 % de la lumière n’arrive pas au détecteur.', indice: 'A = log(1/T) : calculez 1/0,25, puis prenez le logarithme décimal.' } },
    { id: 'extinction', titre: 'Absorption ou extinction ?', focus: [],
      texte: <>Lors d’une mesure d’absorbance, la lumière qui n’arrive pas au détecteur n’a pas toujours été absorbée : une partie peut avoir été <strong>diffusée</strong> (échantillon trouble, suspension). L’<strong>extinction</strong> regroupe tout ce qui retire de la lumière au faisceau. La loi de Beer-Lambert A = ε·l·C utilise le <strong>coefficient d’extinction molaire</strong> ε, en L·mol⁻¹·cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Que désigne l’extinction ?', ...QCM.extinction,
        expl: 'L’extinction est la superposition de l’absorption et de la diffusion. Pour une solution limpide, la diffusion est négligeable et l’extinction se confond avec l’absorption.', indice: 'Pensez aux deux phénomènes qui retirent de la lumière au faisceau.' } },
    { id: 'bilan', titre: 'Le bilan : IR et UV-visible', focus: [],
      retenirTitre: 'À retenir : IR et UV-visible', retenir: <><SvgCarteBilan/>
        <ul style={puces}><li>E = h·c/λ = h·c·σ : plus λ est petite, plus le photon est énergétique.</li><li>L’énergie échangée est quantifiée : le domaine indique la nature de la transition.</li></ul></>,
      texte: <>Vous savez associer un photon à son énergie, passer de λ à σ et à E, relier un domaine spectral à une transition électronique, vibrationnelle ou rotationnelle, et distinguer absorbance, transmittance, absorption et extinction. En exploration, convertissez des grandeurs, étudiez une molécule ou l’atome d’hydrogène ; les défis testent la conversion d’une bande infrarouge et le calcul d’une raie. Pour la suite : les simulations sur la fluorescence, l’infrarouge et l’UV-visible.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, ORDRE.length - 1);
    if (ni !== Math.min(guide.etape, ORDRE.length - 1)) setVie(() => ({ ...BASE, ...(DEPART[ORDRE[ni]] ?? {}) }));
    setGuide(nv);
  };
  const sc = idE;
  const sceneGuide = !enGuide ? null
    : ['photon', 'calcE', 'sigma', 'domaines'].includes(sc) ? <SceneEchelle lam={vie.lam}/>
    : sc === 'atome' ? <SceneAtome ni={3} nf={2}/>
    : sc === 'niveaux' ? <SceneNiveaux/>
    : sc === 'transition' ? <><SceneEchelle lam={vie.lam}/><div style={{ height: 6 }}/><SceneNiveaux actif={actifDe(vie.lam)}/></>
    : sc === 'interactions' ? <SceneInteractions/>
    : sc === 'spectres' ? <SceneDeuxSpectres/>
    : null;
  const d = M.domaineDe(lamV);
  const MES_GUIDE = {
    photon: [['Longueur d’onde', txtLam(lamV)], ['Énergie du photon', `${fr(M.energieEV(lamV), M.energieEV(lamV) < 0.1 ? 3 : 2)}${NB}eV`], ['Domaine', d.nom]],
    domaines: [['Longueur d’onde', txtLam(lamV)], ['Nombre d’onde σ', `${fr(M.sigmaCm(lamV), M.sigmaCm(lamV) < 100 ? 1 : 0)}${NB}cm⁻¹`], ['Domaine', d.nom]],
    transition: [['Longueur d’onde', txtLam(lamV)], ['Domaine', d.nom]],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab_, val, min, max, step, onCh, aide, couleur = '#7c3aed') => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: couleur }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurLam = (id, lam, onT) => curs(id, `Longueur d’onde : ${txtLam(lam)}`, lamToT(lam), 0, 1000, 1, ev => onT(tToLam(parseFloat(ev.target.value))), 'Échelle logarithmique, de 100 nm à 1 cm.', '#7c3aed');
  const curseurGuide = enGuide && ['photon', 'domaines', 'transition'].includes(sc) ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{curseurLam('lm-lam', vie.lam, l => setVie(v => ({ ...v, lam: arrondi3(l) })))}</div> : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'ir' ? { ...M.tirageDefiIR(Math.random), rep1: '', rep2: '', verifie: false } : { ...M.tirageDefiH(Math.random), rep1: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => {
    let ok;
    if (defi.kind === 'ir') { const a = num2(defi.rep1), b = num2(defi.rep2); ok = Math.abs(a - defi.lamUm) <= 0.05 * defi.lamUm && Math.abs(b - defi.eV) <= 0.05 * defi.eV; noterI(ok); }
    else { const a = num2(defi.rep1); ok = Math.abs(a - defi.lamNm) <= 0.05 * defi.lamNm; noterH(ok); }
    setDefi(x => ({ ...x, verifie: true, ok }));
  };
  const champ = (id, lab_, val, onCh) => (<div style={{ marginTop: 8 }}><label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} inputMode="decimal" value={val} onChange={onCh} style={{ ...selectStyle, maxWidth: 220 }} autoComplete="off"/></div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ir', 'Convertir une bande IR'], ['h', 'La raie de l’hydrogène']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'ir' ? 'Défi : convertir une bande infrarouge' : 'Défi : la raie de l’hydrogène'}</div>
      {defi.kind === 'ir' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Un spectre infrarouge présente une bande à <strong>σ = {defi.sigma}{NB}cm⁻¹</strong>. Donnez la longueur d’onde correspondante en micromètres et l’énergie du photon en électronvolts (2 chiffres significatifs ; précision attendue : 5 %).</div>
        {champ('lm-d1', 'Longueur d’onde λ (µm)', defi.rep1, ev => maj({ rep1: ev.target.value }))}
        {champ('lm-d2', 'Énergie E (eV)', defi.rep2, ev => maj({ rep2: ev.target.value }))}</>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Dans l’atome d’hydrogène, un électron passe du niveau <strong>n = {defi.ni}</strong> au niveau <strong>n = {defi.nf}</strong>. Quelle est la longueur d’onde du photon émis ? (précision attendue : 5 %)</div>
        <SceneAtome ni={defi.ni} nf={defi.nf}/>
        {champ('lm-d3', 'Longueur d’onde λ (nm)', defi.rep1, ev => maj({ rep1: ev.target.value }))}</>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'ir'
        ? <>σ en cm⁻¹ : λ(µm) = 10 000 / σ. Puis E = h·c·σ avec σ en m⁻¹ (×100), ou E(eV) × λ(nm) = 1243.</>
        : <>ΔE = |E<sub>n</sub> − E<sub>m</sub>| avec E<sub>n</sub> = −13,6 / n² (eV), puis λ(nm) = 1243 / ΔE(eV). Une raie UV a une longueur d’onde inférieure à 400 nm.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'ir' ? <>Réponse : λ = {fr(defi.lamUm, 2)}{NB}µm et E = {fr(defi.eV, 2)}{NB}eV.</> : <>Réponse : λ ≈ {fr(defi.lamNm, 0)}{NB}nm.</>}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const lamE = ex.lam, dE = M.domaineDe(lamE);
  const tr = TRANS[ex.trans], lamTr = M.lamDeEV(tr.dE);
  const niCorr = Math.max(ex.ni, ex.nf + 1), lamH = M.raieH(niCorr, ex.nf);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{ex.onglet === 'photon' ? 'Réglez le photon' : ex.onglet === 'molecule' ? 'Choisissez la transition' : 'Choisissez les niveaux'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.onglet === 'photon' ? 'Le curseur règle la longueur d’onde (échelle logarithmique). Les mesures donnent l’énergie, la fréquence et le nombre d’onde du photon, le domaine spectral et la transition associée.'
        : ex.onglet === 'molecule' ? 'Chaque type de transition a un écart d’énergie typique (valeurs schématiques). Le photon doit avoir exactement cette énergie pour être absorbé.'
        : 'L’électron passe d’un niveau supérieur à un niveau inférieur : l’atome émet un photon dont l’énergie est la différence entre les deux niveaux.'}</div>
      {ex.onglet === 'photon' && <>
        {selecteur('lm-ex', 'Essayer un exemple', '', ev => { const x = EXEMPLES[ev.target.value]; if (x) setEx(e => ({ ...e, lam: arrondi3(x.lam) })); }, EXEMPLES.map((x, i) => ({ id: i, nom: x.nom })), 'Choisir…')}
        {curseurLam('lm-elam', lamE, l => setEx(e => ({ ...e, lam: arrondi3(l) })))}</>}
      {ex.onglet === 'molecule' && selecteur('lm-etr', 'Transition', ex.trans, ev => setEx(e => ({ ...e, trans: ev.target.value })), Object.entries(TRANS).map(([id, t]) => ({ id, nom: t.nom })))}
      {ex.onglet === 'atome' && <>
        {selecteur('lm-eni', 'Niveau de départ (n)', niCorr, ev => setEx(e => ({ ...e, ni: parseInt(ev.target.value, 10) })), [2, 3, 4, 5, 6].filter(n => n > ex.nf).map(n => ({ id: n, nom: `n = ${n}` })))}
        {selecteur('lm-enf', 'Niveau d’arrivée (n)', ex.nf, ev => { const nf = parseInt(ev.target.value, 10); setEx(e => ({ ...e, nf, ni: Math.max(e.ni, nf + 1) })); }, [1, 2, 3].map(n => ({ id: n, nom: `n = ${n}` })))}</>}
    </div>);
  const pilules = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {[['photon', 'Un photon'], ['molecule', 'Une molécule'], ['atome', 'L’atome d’hydrogène']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, onglet: k }))} aria-pressed={ex.onglet === k} style={stylePetitBouton(ex.onglet === k, '#7c3aed')}>{l}</button>)}
    </div>);
  const voletScene = (
    <div style={styleBoite}>
      {pilules}
      {ex.onglet === 'photon' ? <><SceneEchelle lam={lamE}/><div style={{ height: 6 }}/><SceneNiveaux actif={actifDe(lamE)}/></>
        : ex.onglet === 'molecule' ? <SceneNiveaux actif={ex.trans}/>
        : <SceneAtome ni={niCorr} nf={ex.nf}/>}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {ex.onglet === 'photon' ? <>
        <LigneMesure nom="Longueur d’onde λ" valeur={txtLam(lamE)}/>
        <LigneMesure nom="Fréquence ν" valeur={`${sci(M.frequence(lamE))}${NB}Hz`}/>
        <LigneMesure nom="Nombre d’onde σ" valeur={`${fr(M.sigmaCm(lamE), M.sigmaCm(lamE) < 100 ? 1 : 0)}${NB}cm⁻¹`}/>
        <LigneMesure nom="Énergie E" valeur={`${sci(M.energieJ(lamE))}${NB}J = ${M.energieEV(lamE) < 0.1 ? fr(M.energieEV(lamE), 4) : fr(M.energieEV(lamE), 2)}${NB}eV`}/>
        <LigneMesure nom="Domaine" valeur={dE.nom}/>
        <LigneMesure nom="Transition possible" valeur={dE.transition}/></>
      : ex.onglet === 'molecule' ? <>
        <LigneMesure nom="Écart d’énergie ΔE" valeur={`${tr.dE < 0.01 ? sci(tr.dE) : fr(tr.dE, tr.dE < 1 ? 2 : 1)}${NB}eV`}/>
        <LigneMesure nom="Photon absorbé : λ" valeur={txtLam(lamTr)}/>
        <LigneMesure nom="Nombre d’onde σ" valeur={`${fr(M.sigmaCm(lamTr), M.sigmaCm(lamTr) < 100 ? 1 : 0)}${NB}cm⁻¹`}/>
        <LigneMesure nom="Domaine" valeur={M.domaineDe(lamTr).nom}/></>
      : <>
        <LigneMesure nom="Énergie des niveaux" valeur={`${fr(M.niveauH(niCorr), 2)} eV ; ${fr(M.niveauH(ex.nf), 2)} eV`}/>
        <LigneMesure nom="Énergie du photon émis" valeur={`${fr(Math.abs(M.niveauH(niCorr) - M.niveauH(ex.nf)), 2)}${NB}eV`}/>
        <LigneMesure nom="Longueur d’onde λ" valeur={txtLam(lamH)}/>
        <LigneMesure nom="Série" valeur={M.serieH(ex.nf)}/></>}
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Photon : choisissez la lampe UV germicide, puis la LED bleue, puis une bande infrarouge. Comment varie l’énergie ? Dans quel domaine chaque photon se trouve-t-il ?</li>
      <li>Photon : cherchez les longueurs d’onde où une transition électronique est possible, puis vibrationnelle, puis rotationnelle.</li>
      <li>Molécule : comparez les trois transitions. Quel photon faut-il pour chacune ? Quel est le rapport entre l’énergie électronique et l’énergie de vibration ?</li>
      <li>Atome : quelles transitions arrivent au niveau n = 2 ? Dans quel domaine sont leurs raies ? Et celles qui arrivent au niveau n = 1 ?</li>
      <li>Atome : la transition 6 → 2 a-t-elle une longueur d’onde plus petite ou plus grande que 3 → 2 ? Pourquoi ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>E = h·c/λ = h·c·σ : λ petite, E grande</li>
        <li>σ(cm⁻¹) = 10 000 / λ(µm) ; E(eV) × λ(nm) ≈ 1243</li>
        <li>E rot ≪ E vib ≪ E él : IR lointain, IR, UV-visible</li>
        <li>L’énergie absorbée ou émise est quantifiée : ΔE = différence entre deux niveaux</li>
        <li>Spectre UV-visible : absorbance A en fonction de λ ; spectre IR : transmittance T en fonction de σ</li>
        <li>Extinction = absorption + diffusion</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Constantes</strong> : h = 6,63·10⁻³⁴ J·s ; c = 3,00·10⁸ m/s ; 1 eV = 1,60·10⁻¹⁹ J (valeurs arrondies : E(eV) × λ(nm) = 1243 au lieu de 1240 environ).</li>
      <li><strong>Domaines spectraux</strong> : les limites (UV, visible, proche et moyen infrarouge, IR lointain) sont des conventions ; les domaines se recouvrent un peu selon les ouvrages. L’infrarouge moyen est pris de 2,5 à 20 µm (500 à 4000 cm⁻¹).</li>
      <li><strong>Molécule</strong> : écarts d’énergie schématiques (électronique 4 eV, vibration 0,2 eV, rotation 0,002 eV), choisis pour illustrer les ordres de grandeur ; une vraie molécule a beaucoup de niveaux. Le schéma n’est pas à l’échelle. La rotation n’est observable que dans les gaz.</li>
      <li><strong>Hydrogène</strong> : E<sub>n</sub> = −13,6 / n² (modèle de Bohr, valable pour l’atome d’hydrogène seul) ; les longueurs d’onde calculées avec des constantes arrondies diffèrent de moins de 1 % des valeurs mesurées (656 nm pour 3 → 2).</li>
      <li><strong>Absorbance</strong> : A = log(1/T) suppose que toute la lumière manquante est absorbée ; en réalité la diffusion et les réflexions contribuent à l’extinction.</li>
      <li><strong>Hors modèle</strong> : largeur des bandes, règles de sélection, intensité des transitions, couplage vibration-rotation.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .lm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .lm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .lm-col { display: flex; flex-direction: column; gap: 12px; }
        .lm-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .lm-l1.cote .lm-carte { order: 2; } .lm-l1.cote .lm-main { order: 1; }
          .lm-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .lm-ex > * { grid-column: 1; }
          .lm-ex > .lm-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .lm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .lm-in { animation: lm-fondu 0.35s ease-out; } @keyframes lm-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .lm-l1 *, .lm-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Photons, niveaux d’énergie et domaines spectraux</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La lumière est un flux de <strong>photons</strong>. La matière absorbe, émet ou diffuse ces photons, et ses niveaux d’énergie sont <strong>quantifiés</strong>. On relie la longueur d’onde, le nombre d’onde et l’énergie d’un photon, puis le domaine spectral à la nature de la transition (électronique, vibration, rotation).</div>
      {enGuide && <div className="lm-l1 cote">
        <div className="lm-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="lm-main">
          <div className="lm-col">
            {sceneBloc && <div className="lm-in">{sceneBloc}</div>}
            {curseurGuide && <div className="lm-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="lm-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'ir' ? suiviI : suiviH}/></div>}
      {enExplore && <>
        <div className="lm-ex">
          {voletScene}
          <div className="lm-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
