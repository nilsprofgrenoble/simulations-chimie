import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./terreAtmModele";
import { QCM_PARCOURS as Q } from "./terAtmQcm";
import { SceneTerre, GraphePuissance, SvgCarteAbsorbe, SvgCarteEquilibre, SvgCarteSerre, SvgCarteBilan } from "./terAtmSchemas";

const SIM_ID = 236, CLE_GUIDE = 'terre-atm-tg-guide-v1';
declarerDefis(SIM_ID, [['planete', 'Température d’une planète'], ['albedo', 'Quel albédo pour quelle température ?']]);

// ====================================================
// SIM 236 — BILAN THERMIQUE DU SYSTÈME TERRE-ATMOSPHÈRE : ALBÉDO, EFFET DE SERRE
//  (TG spé PC, « L'énergie : conversions et transferts », « Effectuer des bilans d'énergie sur un système »).
//  Capacités visées (jamais affichées à l'élève) : effectuer un bilan quantitatif d'énergie pour estimer la température terrestre moyenne
//  (loi de Stefan-Boltzmann donnée) ; discuter qualitativement l'influence de l'albédo et de l'effet de serre sur la température moyenne.
//  Modèle : terreAtmModele.js (test : terreAtmModele.test.mjs).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const BLEU = '#0369a1';
const IDS = ['albedo', 'absorbe', 'emission', 'equilibre', 'temperature', 'ecart', 'serre', 'prevoir', 'planetes', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));

// ---------- formules (MathML) ----------
const sur = (a, b) => <mfrac>{a}{b}</mfrac>;
const Pabs = <msub><mi>P</mi><mtext>abs</mtext></msub>;
const Pem = <msub><mi>P</mi><mtext>émise</mtext></msub>;
const S0 = <msub><mi>S</mi><mn>0</mn></msub>;
const FAbs = <Formule>{Pabs}<mo>=</mo>{sur(<mrow><mo>(</mo><mn>1</mn><mo>−</mo><mi>A</mi><mo>)</mo><mo>×</mo>{S0}</mrow>, <mn>4</mn>)}</Formule>;
const FEm = <Formule>{Pem}<mo>=</mo><mi>σ</mi><mo>×</mo><msup><mi>T</mi><mn>4</mn></msup></Formule>;
const eAbs = <FormuleEnLigne>{Pabs}<mo>=</mo>{sur(<mrow><mo>(</mo><mn>1</mn><mo>−</mo><mi>A</mi><mo>)</mo><mo>×</mo>{S0}</mrow>, <mn>4</mn>)}</FormuleEnLigne>;
const eEm = <FormuleEnLigne>{Pem}<mo>=</mo><mi>σ</mi><mo>×</mo><msup><mi>T</mi><mn>4</mn></msup></FormuleEnLigne>;
const eEq = <FormuleEnLigne><mi>σ</mi><mo>×</mo><msup><mi>T</mi><mn>4</mn></msup><mo>=</mo>{Pabs}</FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const P0 = M.absorbee(1361, 0.30), T0 = M.tempEq(P0);   // Terre : 238 W·m⁻², 255 K

// contrôle d'une grandeur : curseur + boutons − / + + rétablir
function Controle({ nom, valeur, min, max, pas, onChange, texte, retablir = 'Rétablir', onRetablir }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  const dec = Math.max(0, -Math.floor(Math.log10(pas))), arr = x => Math.max(min, Math.min(max, Number(x.toFixed(dec + 1))));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 2, fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt, textAlign: 'right', whiteSpace: 'nowrap' }}>{avecIndices(texte)}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label={`Diminuer : ${nom}`} onClick={() => onChange(arr(valeur - pas))} style={btn}>−</button>
        <input type="range" min={min} max={max} step={pas} value={valeur} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label={`Augmenter : ${nom}`} onClick={() => onChange(arr(valeur + pas))} style={btn}>+</button>
      </div>
      <div style={{ marginTop: 6 }}><button onClick={onRetablir} style={stylePetitBouton(false)}><Pic n="refresh"/>{retablir}</button></div>
    </div>);
}


export function SimulationTerreAtmosphere() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('planete');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ serre: false, essayer: false, retenir: false });
  const EX0 = { pl: 'terre', A: 0.30, g: 0 };
  const [ex, setEx] = useState(EX0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- état de l'exploration ----------
  const plEx = M.planeteDe(ex.pl), PEx = M.absorbee(plEx.S0, ex.A), TeqEx = M.tempEq(PEx), TsEx = M.tempSerre(plEx.S0, ex.A, ex.g), Tmont = ex.g > 0 ? TsEx : TeqEx;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'albedo', titre: 'L’albédo', focus: ['scene'],
      texte: <>La Terre reçoit de l’énergie du Soleil sous forme de lumière. Une partie est <strong>réfléchie</strong> vers l’espace par les nuages, la neige, la glace, l’océan, le sol… sans chauffer la Terre. La fraction réfléchie s’appelle l’<strong>albédo</strong>, notée A : un nombre sans unité, entre 0 et 1. Par exemple, A = 0,8 signifie que 80 % de la lumière reçue est réfléchie.</>,
      tache: { type: 'qcm', q: 'Quelle surface réfléchit la plus grande part du rayonnement solaire ?', options: Q.albedo.options, bonne: 0,
        expl: 'La neige fraîche est très claire : elle réfléchit environ 80 % de la lumière reçue (albédo voisin de 0,8). Une surface sombre (océan, forêt, asphalte) en absorbe la plus grande partie : son albédo est petit.',
        indice: 'Une surface claire réfléchit beaucoup de lumière, une surface sombre en absorbe beaucoup.' } },
    { id: 'absorbe', titre: 'La puissance absorbée', focus: ['scene'],
      texte: <>Face au Soleil, la Terre reçoit une puissance de <strong>S<sub>0</sub> = 1361{NB}W·m⁻²</strong> par mètre carré perpendiculaire aux rayons. Mais la Terre est une sphère : elle intercepte le rayonnement sur un disque de surface π R², alors qu’elle émet par toute sa surface, 4 π R², soit 4 fois plus. En moyenne, par mètre carré de surface terrestre, la puissance reçue est donc S<sub>0</sub> divisé par 4, dont la fraction (1 − A) est absorbée :{FAbs}Pour la Terre, l’albédo moyen est <strong>A = 0,30</strong>.</>,
      tache: { type: 'num', q: 'Quelle puissance P_abs la Terre absorbe-t-elle en moyenne par mètre carré de sa surface, en W·m⁻² ?', unite: 'W·m⁻²', vrai: P0, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['S₀ = 1361 W·m⁻² ; A = 0,30.', <>P<sub>abs</sub> = {avecIndices('frac((1 − 0,30) × 1361|4)')} = {avecIndices('frac(952,7|4)')} ≈ 238 W·m⁻².</>],
        pieges: [[1361 / 4, 'La part réfléchie n’est pas retirée : il faut multiplier par (1 − A).'], [0.7 * 1361, 'Le facteur 4 a été oublié : la puissance est répartie sur toute la sphère (division par 4).'], [0.3 * 1361 / 4, 'Ce résultat est la puissance réfléchie : la puissance absorbée est la fraction (1 − A).']],
        expl: <>P<sub>abs</sub> = {avecIndices('frac((1 − 0,30) × 1361|4)')} ≈ 238 W·m⁻² : en moyenne, chaque mètre carré de la Terre absorbe 238 joules par seconde.</>,
        indice: <>{eAbs}, avec A = 0,30 et S<sub>0</sub> = 1361 W·m⁻² : d’abord (1 − A), puis le produit, puis la division par 4.</> } },
    { id: 'emission', titre: 'La puissance émise', focus: [], retenirTitre: 'La puissance absorbée', retenir: <>
        <SvgCarteAbsorbe/>
        <ul style={ULS}>
          <li>Albédo A : part du rayonnement réfléchie (0 à 1). Absorbé : fraction (1 − A).</li>
          <li>Par m² de surface terrestre : S<sub>0</sub> divisé par 4, car la Terre intercepte sur un disque et émet par une sphère.</li>
          <li>Moyen de s’en souvenir : <strong>« disque reçu, sphère émise : un quart »</strong>. Idée fausse : « la Terre absorbe tout ce que le Soleil lui envoie ». Vrai : environ 30 % est réfléchi.</li>
        </ul></>,
      texte: <>Tout corps à la température T émet un rayonnement, surtout infrarouge. La <strong>loi de Stefan-Boltzmann</strong> (donnée) indique la puissance émise par mètre carré de sa surface :{FEm}avec <strong>σ = 5,67 × 10⁻⁸{NB}W·m⁻²·K⁻⁴</strong> et T la température en <strong>kelvins</strong> (T = θ + 273, θ en °C). Un sol est à <strong>300{NB}K</strong> (27{NB}°C).</>,
      tache: { type: 'num', q: 'Quelle puissance P_émise ce sol émet-il par mètre carré, en W·m⁻² ?', unite: 'W·m⁻²', vrai: M.emise(300), tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['σ = 5,67×10⁻⁸ ; T = 300 K.', <>P<sub>émise</sub> = σ × T⁴ = 5,67×10⁻⁸ × 300⁴ = 5,67×10⁻⁸ × 8,1×10⁹ ≈ 459 W·m⁻².</>],
        pieges: [[5.67e-8 * 300, 'T est à la puissance 4 : P_émise = σ × T⁴, pas σ × T.'], [5.67e-8 * 27 ** 4, 'La température doit être en kelvins : 300 K, pas 27 °C.'], [5.67e-8 * 300 ** 2, 'T est à la puissance 4, pas 2.']],
        expl: <>P<sub>émise</sub> = σ × T⁴ = 5,67×10⁻⁸ × 300⁴ ≈ 459 W·m⁻². La puissance émise croît très vite avec la température (T⁴).</>,
        indice: <>{eEm}, avec T = 300 K : on élève 300 à la puissance 4 (300 × 300 × 300 × 300), puis on multiplie par σ.</> } },
    { id: 'equilibre', titre: 'L’équilibre', focus: [],
      texte: <>Au fil des années, la température moyenne de la Terre varie très peu : on la suppose <strong>constante</strong> (équilibre). Pour que la température ne varie pas, le système Terre ne doit ni gagner ni perdre d’énergie : il faut comparer la puissance absorbée {Pabs} à la puissance émise {Pem}.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de la puissance émise et de la puissance absorbée quand la température est constante ?', options: Q.equilibre.options, bonne: 0,
        expl: 'Si la Terre absorbait plus qu’elle n’émet, son énergie augmenterait et elle se réchaufferait ; si elle émettait plus qu’elle n’absorbe, elle se refroidirait. À température constante, les deux puissances sont égales : P_émise = P_absorbée.',
        indice: 'Si le bilan d’énergie n’est pas nul, la température change : que faut-il pour qu’elle reste constante ?' } },
    { id: 'temperature', titre: 'La température d’équilibre', focus: [], retenirTitre: 'L’équilibre et la loi de Stefan-Boltzmann', retenir: <>
        <SvgCarteEquilibre/>
        <ul style={ULS}>
          <li>À température constante : P<sub>émise</sub> = P<sub>absorbée</sub>, soit σ × T⁴ = P<sub>abs</sub>.</li>
          <li>T s’exprime en kelvins : T (K) = θ (°C) + 273.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui rentre = ce qui sort »</strong>. Idée fausse : « pas de variation de température, donc pas d’échange d’énergie ». Vrai : la Terre échange sans cesse, mais reçoit autant qu’elle émet.</li>
        </ul></>,
      texte: <>Pour la Terre, la puissance absorbée est P<sub>abs</sub> = <strong>238{NB}W·m⁻²</strong> (étape 2). À l’équilibre, {eEq}. Pour trouver T, on isole T⁴, puis on prend la <strong>racine quatrième</strong> (touche ⁴√ ou x^(1/y) de la calculatrice, ou deux fois la touche √).</>,
      tache: { type: 'num', q: 'Quelle est la température d’équilibre T de la Terre sans atmosphère, en K ? (3 chiffres significatifs)', unite: 'K', vrai: T0, tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => ['σ × T⁴ = P_abs = 238 W·m⁻² ; σ = 5,67×10⁻⁸ W·m⁻²·K⁻⁴.', <>T⁴ = {avecIndices('frac(P_abs|σ)')} = {avecIndices('frac(238|5,67×10⁻⁸)')} ≈ 4,2×10⁹ K⁴ ; T = (4,2×10⁹)^(1/4) ≈ 255 K.</>],
        pieges: [[P0 / 5.67e-8, 'Il manque la racine quatrième : P_abs divisé par σ donne T⁴, pas T.'], [Math.sqrt(P0 / 5.67e-8), 'Il faut une racine quatrième, pas une racine carrée (une seule fois la touche √ ne suffit pas).'], [T0 - 273, 'Ce résultat est en °C : l’énoncé demande des kelvins (T = θ + 273).']],
        expl: <>T⁴ = {avecIndices('frac(238|5,67×10⁻⁸)')} ≈ 4,2×10⁹ K⁴, donc T ≈ 255 K, soit environ −18 °C : une Terre sans atmosphère serait gelée.</>,
        indice: <>De {eEq}, on tire T⁴ = {avecIndices('frac(P_abs|σ)')} ; puis T est la racine quatrième de ce nombre. Rappel : racine quatrième = deux racines carrées à la suite.</> } },
    { id: 'ecart', titre: 'Comparer à la réalité', focus: [],
      texte: <>La température d’équilibre trouvée est T<sub>éq</sub> ≈ <strong>255{NB}K</strong> (environ −18 °C). Or la température moyenne réellement observée à la surface de la Terre est <strong>288{NB}K</strong> (15{NB}°C).</>,
      tache: { type: 'num', q: 'Quel est l’écart entre la température observée et la température d’équilibre calculée, en K ?', unite: 'K', vrai: 33, tol: 0.06, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['T observée = 288 K ; T d’équilibre = 255 K.', <>Écart = 288 − 255 = 33 K.</>],
        pieges: [[543, 'Un écart est une différence : 288 − 255, pas une somme.'], [255 / 288, 'Un écart est une différence : 288 − 255, pas un rapport.']],
        expl: <>Écart = 288 − 255 = 33 K : la Terre réelle est nettement plus chaude que le calcul pour une Terre sans atmosphère. Quelque chose manque dans le modèle.</>,
        indice: 'Soustrayez la plus petite température de la plus grande, toutes deux en kelvins (ou en °C : l’écart est le même).' } },
    { id: 'serre', titre: 'L’explication de l’écart', focus: [],
      texte: <>Dans le calcul, l’albédo observé (0,30) est déjà utilisé, et l’énergie venant de l’intérieur de la Terre est négligeable devant celle du Soleil (environ 0,03 %). L’écart de 33 K a donc une autre origine, liée à l’atmosphère qui entoure la Terre.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce qui explique que la Terre soit plus chaude que sa température d’équilibre sans atmosphère ?', options: Q.serre.options, bonne: 0,
        expl: 'Les gaz à effet de serre (vapeur d’eau, dioxyde de carbone, méthane…) laissent passer le visible du Soleil mais absorbent une partie de l’infrarouge émis par le sol et en renvoient vers lui : c’est l’effet de serre. Le sol se réchauffe jusqu’à ce que la Terre évacue vers l’espace autant d’énergie qu’elle en reçoit.',
        indice: 'Le sol émet de l’infrarouge vers le haut : que fait l’atmosphère de cet infrarouge ?' } },
    { id: 'prevoir', titre: 'Prévoir l’effet de l’albédo', focus: [], retenirTitre: 'L’effet de serre', retenir: <>
        <SvgCarteSerre/>
        <ul style={ULS}>
          <li>Le visible du Soleil traverse l’atmosphère ; le sol émet de l’infrarouge, en partie absorbé puis renvoyé vers le sol par les gaz à effet de serre.</li>
          <li>Sans effet de serre : environ −18 °C ; avec : environ 15 °C. L’effet de serre naturel rend la Terre habitable ; c’est son <strong>renforcement</strong> (plus de gaz) qui réchauffe la planète.</li>
          <li>Moyen de s’en souvenir : <strong>« visible entre, infrarouge piégé »</strong>. Idée fausse : « l’effet de serre est le trou dans l’atmosphère ». Vrai : c’est l’absorption de l’infrarouge par les gaz, sans lien avec la couche d’ozone.</li>
        </ul></>,
      texte: <>Avec la fonte des glaces, l’albédo moyen de la Terre diminue : il passe de <strong>0,30</strong> à <strong>0,25</strong>. La puissance S<sub>0</sub> reçue du Soleil ne change pas.</>,
      tache: { type: 'qcm', q: 'Que devient la température d’équilibre T ?', options: Q.prevoir.options, bonne: 0,
        expl: <>{eAbs} : quand A diminue, (1 − A) augmente, donc la puissance absorbée augmente. À l’équilibre, la puissance émise, σ × T⁴, doit augmenter aussi, donc T augmente (de 255 K à environ 258 K). Une Terre plus sombre se réchauffe.</>,
        indice: <>{eAbs} : que devient (1 − A) quand A diminue ? Puis, à l’équilibre, {eEq} : comment T évolue-t-elle quand {Pabs} augmente ?</> } },
    { id: 'planetes', titre: 'Mars et Vénus', focus: [],
      texte: <>On applique le même calcul à deux autres planètes (valeurs arrondies). <strong>Mars</strong> : S<sub>0</sub> = 586{NB}W·m⁻², A = 0,25, donc T<sub>éq</sub> ≈ 210{NB}K ; sa température moyenne observée est d’environ <strong>210{NB}K</strong>. <strong>Vénus</strong> : S<sub>0</sub> = 2601{NB}W·m⁻², A = 0,77, donc T<sub>éq</sub> ≈ 227{NB}K ; sa température moyenne observée est d’environ <strong>737{NB}K</strong>. L’atmosphère de Mars est très ténue ; celle de Vénus est très épaisse et riche en dioxyde de carbone.</>,
      tache: { type: 'qcm', q: 'Que montre la comparaison des températures calculées et observées ?', options: Q.planetes.options, bonne: 0,
        expl: 'Pour Mars, T observée ≈ T d’équilibre : presque pas d’effet de serre. Pour Vénus, la température observée dépasse de plus de 500 K celle du calcul : son atmosphère très épaisse produit un effet de serre énorme. La distance au Soleil est déjà dans S₀, donc elle n’explique pas l’écart.',
        indice: 'Comparez, pour chaque planète, la température calculée sans atmosphère et la température observée : où l’écart est-il nul, où est-il énorme ?' } },
    { id: 'bilan', titre: 'Le bilan', focus: [], retenirTitre: 'Méthode pour une planète', retenir: <>
        <SvgCarteBilan/>
        <ul style={ULS}>
          <li>P<sub>abs</sub> = (1 − A) × S<sub>0</sub> divisé par 4 ; équilibre σ × T⁴ = P<sub>abs</sub> ; T = racine quatrième de (P<sub>abs</sub> divisé par σ), en K.</li>
          <li>L’écart entre la température observée et la température d’équilibre mesure l’effet de serre : environ 33 K pour la Terre, presque rien pour Mars, plus de 500 K pour Vénus.</li>
          <li>Moyen de s’en souvenir : <strong>« reçu, réfléchi, émis, égal »</strong>. Idée fausse : « −18 °C est la température de la Terre ». Vrai : c’est celle d’une Terre sans atmosphère ; la vraie est 15 °C grâce à l’effet de serre.</li>
        </ul></>,
      texte: <>Vous savez calculer la puissance absorbée {eAbs}, la puissance émise {eEm}, en déduire la température d’équilibre par {eEq}, puis discuter l’effet de l’albédo et de l’effet de serre. Passez à l’exploration (planète, albédo, effet de serre) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'planete' ? M.tiragePlanete() : M.tirageAlbedo()), type, s1: '', s2: '', s3: '', verifie: false, essais: 0, corr: false }); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
  const TOLP = [0.06, 0.05, 0.05];
  const juste = (d, k, s) => (d.type === 'albedo' && k === 3 ? isFinite(s) && Math.abs(s - d.rep3) <= 0.03 : pr(s, d[`rep${k}`], d.type === 'albedo' ? 0.06 : TOLP[k - 1]));
  const verifier = () => {
    const res = [1, 2, 3].map(k => juste(defi, k, lireNombre(defi[`s${k}`] || '')));
    const ok = res.every(Boolean);
    setDefi(d => ({ ...d, verifie: true, ok, res, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'planete' ? noterP : noterA)(ok);
  };
  // Retour diagnostique par question.
  const diagnostic = k => {
    const s = lireNombre(defi[`s${k}`] || ''), vrai = defi[`rep${k}`];
    if (!isFinite(s)) return 'écrivez un nombre (la virgule ou le point conviennent).';
    if (juste(defi, k, s)) return 'juste.';
    const s1 = lireNombre(defi.s1 || ''), s2 = lireNombre(defi.s2 || '');
    if (defi.type === 'planete') {
      if (k === 2 && isFinite(s1) && s1 > 0 && pr(s, M.tempEq(s1), 0.04)) return 'votre calcul est cohérent avec votre réponse à la question 1 : c’est celle-là qu’il faut revoir.';
      if (k === 1 && (pr(s, (1 - defi.A) * defi.S0, 0.06))) return 'le facteur 4 a été oublié : la puissance reçue se répartit sur toute la sphère (division par 4).';
      if (k === 1 && pr(s, defi.S0 / 4, 0.06)) return 'la part réfléchie n’est pas retirée : multipliez par (1 − A).';
      if (k >= 2 && Math.abs(s - (vrai - 273)) <= 0.04 * Math.abs(vrai - 273) + 1) return 'votre résultat semble en °C : la température demandée est en kelvins (T = θ + 273).';
      if (k >= 2 && s > 5e5) return 'il manque la racine quatrième : P divisé par σ donne T⁴, pas T.';
    } else {
      if (k === 1 && pr(s, M.SIGMA * defi.Tc, 0.06)) return 'T est à la puissance 4 : P_émise = σ × T⁴.';
      if (k === 2 && pr(s, defi.S0, 0.06)) return 'la puissance reçue en moyenne par m² de surface est S₀ divisé par 4.';
      if (k === 3 && isFinite(s1) && isFinite(s2) && s2 !== 0 && Math.abs(s - (1 - s1 / s2)) <= 0.02) return 'votre calcul est cohérent avec vos réponses aux questions 1 et 2 : ce sont elles qu’il faut revoir.';
      if (k === 3 && Math.abs(s - (1 - vrai)) <= 0.03) return 'vous avez donné la part absorbée (1 − A) : l’albédo est la part réfléchie, A = 1 − (P_émise divisé par S₀/4).';
    }
    if (defi.type === 'albedo' && k === 3) return 'votre albédo s’écarte de plus de 0,03 : refaites A = 1 − (puissance émise divisée par la puissance reçue par m²), en gardant 3 chiffres significatifs dans les calculs intermédiaires.';
    return s < vrai ? 'votre résultat est trop petit : revoyez la formule utilisée.' : 'votre résultat est trop grand : revoyez la formule utilisée.';
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('tat-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.res[+cle.slice(1) - 1] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const f0 = x => nbf(x, 0), f2 = x => nbf(x, 2);
  const solutionDefi = d => d.type === 'planete'
    ? <>P<sub>abs</sub> = {avecIndices('frac((1 − A) × S₀|4)')} = {avecIndices(`frac((1 − ${f2(d.A)}) × ${d.S0}|4)`)} = {f0(d.rep1)} W·m⁻² ; σ × T⁴ = P<sub>abs</sub> donne T = ({f0(d.rep1)} / 5,67×10⁻⁸)^(1/4) = {f0(d.rep2)} K ; avec A′ = {f2(d.A2)} : P′ = {f0(M.absorbee(d.S0, d.A2))} W·m⁻², T′ = {f0(d.rep3)} K. Gardez un chiffre de plus dans les calculs intermédiaires pour ne pas arrondir trop tôt.</>
    : <>P<sub>émise</sub> = σ × T⁴ = 5,67×10⁻⁸ × {d.Tc}⁴ = {f0(d.rep1)} W·m⁻² ; puissance reçue par m² : S₀ divisé par 4 = {d.S0} / 4 = {f0(d.rep2)} W·m⁻² ; à l’équilibre elle est absorbée à hauteur de (1 − A) : 1 − A = {f0(d.rep1)} / {f0(d.rep2)}, donc A = {f2(d.rep3)}. Gardez 3 chiffres significatifs dans les calculs intermédiaires.</>;
  const nomPl = d => (d.reelle ? d.nom : 'une planète fictive');
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['planete', 'Température d’une planète'], ['albedo', 'Quel albédo pour quelle température ?']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'planete' ? 'Défi : température d’une planète' : 'Défi : quel albédo pour quelle température ?'}</div>
      {defi.type === 'planete' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On étudie <strong>{nomPl(defi)}</strong> sans atmosphère : elle reçoit <strong>S<sub>0</sub> = {defi.S0}{NB}W·m⁻²</strong> face au Soleil et son albédo est <strong>A = {f2(defi.A)}</strong>. Donnez vos résultats avec 3 chiffres significatifs (marge acceptée : 6{NB}% pour la question 1, 5{NB}% pour les autres) ; σ = 5,67 × 10⁻⁸{NB}W·m⁻²·K⁻⁴.</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Puissance absorbée P_abs par mètre carré de surface, en W·m⁻².</div>
        {champ('P_abs', 's1', 'W·m⁻²')}
        <IndiceDefi cache={false}>P<sub>abs</sub> = (1 − A) × S<sub>0</sub> divisé par 4.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Température d’équilibre T, en K.</div>
        {champ('T', 's2', 'K')}
        <IndiceDefi cache={false}>σ × T⁴ = P<sub>abs</sub> : T est la racine quatrième de P<sub>abs</sub> divisé par σ (deux fois la touche √).</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> L’albédo devient <strong>A′ = {f2(defi.A2)}</strong>, S<sub>0</sub> étant inchangé. Quelle est la nouvelle température d’équilibre T′, en K ?</div>
        {champ('T′', 's3', 'K')}
        <IndiceDefi cache={false}>Refaites les deux calculs précédents avec A′ à la place de A : P′ = (1 − A′) × S<sub>0</sub> divisé par 4, puis T′.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une planète sans atmosphère reçoit <strong>S<sub>0</sub> = {defi.S0}{NB}W·m⁻²</strong> face au Soleil. On veut que sa température d’équilibre soit <strong>T = {defi.Tc}{NB}K</strong>. Donnez vos résultats avec 3 chiffres significatifs (marge acceptée : 6{NB}% pour les questions 1 et 2, 0,03 pour l’albédo) ; σ = 5,67 × 10⁻⁸{NB}W·m⁻²·K⁻⁴.</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Puissance P_émise par mètre carré à cette température, en W·m⁻².</div>
        {champ('P_émise', 's1', 'W·m⁻²')}
        <IndiceDefi cache={false}>P<sub>émise</sub> = σ × T⁴, avec T en kelvins.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Puissance reçue en moyenne par mètre carré de surface (avant réflexion), en W·m⁻².</div>
        {champ('P_reçue', 's2', 'W·m⁻²')}
        <IndiceDefi cache={false}>La puissance reçue par m² de surface est S<sub>0</sub> divisé par 4 (disque éclairé, sphère qui émet).</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Quel albédo A faut-il ? (nombre entre 0 et 1)</div>
        {champ('A', 's3', '')}
        <IndiceDefi cache={false}>À l’équilibre, la puissance émise est égale à la puissance absorbée, (1 − A) × (puissance reçue par m²) : donc 1 − A = P<sub>émise</sub> divisé par P<sub>reçue</sub>.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="tat-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? '✓ Correct.' : '✗ Pas tout à fait.'}</div>
        {!defi.ok && <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{[1, 2, 3].map(k => <li key={k}><strong>Question {k}</strong> : {diagnostic(k)}</li>)}</ul>}
        {!defi.ok && !defi.corr && <div style={{ marginTop: 6 }}><button onClick={() => setDefi(d => ({ ...d, corr: true }))} style={stylePetitBouton(false)}>Voir la correction</button></div>}
        {(defi.ok || defi.corr) && <div style={{ marginTop: 6, color: KIT.txt }}>{solutionDefi(defi)}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle global</strong> : la Terre est un corps unique, à une température moyenne T uniforme (pas de différence entre pôles, équateur, jour et nuit), en équilibre : la puissance émise vers l’espace est égale à la puissance reçue du Soleil et absorbée.</li>
      <li><strong>Puissance reçue</strong> : S<sub>0</sub> = 1361 W·m⁻² face au Soleil (valeur arrondie) ; la Terre intercepte sur un disque de surface π R² et émet par sa sphère de surface 4 π R² : d’où la division par 4. L’albédo A est un coefficient moyen sur toute la Terre (0,30).</li>
      <li><strong>Loi de Stefan-Boltzmann</strong> (donnée) : P<sub>émise</sub> = σ T⁴ par mètre carré, avec σ = 5,67 × 10⁻⁸ W·m⁻²·K⁻⁴ et T en kelvins. On suppose que la Terre émet comme un corps noir (émissivité égale à 1), approximation courante à ce niveau.</li>
      <li><strong>Effet de serre</strong> : discuté qualitativement dans le parcours. Dans l’exploration, le curseur g (« modèle simplifié, pour aller plus loin ») représente la part de l’infrarouge émis par la surface renvoyée vers elle : σ T⁴ (1 − g) = (1 − A) S<sub>0</sub> divisé par 4. Ce n’est pas un modèle réaliste de l’atmosphère (une seule couche, pas de convection ni de nuages) : il montre seulement qu’une atmosphère qui renvoie de l’infrarouge réchauffe la surface. g ≈ 0,39 reproduit 288 K pour la Terre ; aucune valeur raisonnable ne reproduit les 737 K de Vénus.</li>
      <li><strong>Valeurs</strong> : S<sub>0</sub>, albédos et températures moyennes observées arrondis (Terre 1361 W·m⁻², 0,30, 288 K ; Mars 586 W·m⁻², 0,25, 210 K ; Vénus 2601 W·m⁻², 0,77, 737 K) ; les planètes « fictives » des défis ont des valeurs choisies.</li>
      <li><strong>Hors périmètre</strong> : bilan par couches de l’atmosphère, rôle des nuages et de la vapeur d’eau, variations de S<sub>0</sub> au cours du temps, rétroactions, températures locales.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- menus ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lblMenu = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };

  // ---------- scène du parcours / du défi ----------
  let sceneGuide = null;
  if (enGuide) {
    if (idx === I.albedo) sceneGuide = <SceneTerre montre={{ refl: true }}/>;
    else if (idx === I.absorbe) sceneGuide = <SceneTerre montre={{ S0: true, refl: true }}/>;
    else if (idx === I.emission) sceneGuide = <SceneTerre montre={{ S0: true, refl: true, emis: true }}/>;
    else if (idx === I.equilibre || idx === I.temperature) sceneGuide = <SceneTerre montre={{ S0: true, refl: true, emis: true }}/>;
    else if (idx === I.ecart || idx === I.serre) sceneGuide = <SceneTerre montre={{ S0: true, refl: true, emis: true }}/>;
    else if (idx === I.prevoir) sceneGuide = <SceneTerre montre={{ S0: true, refl: true, emis: true, serre: true }}/>;
  } else if (dd) {
    sceneGuide = <SceneTerre montre={{ S0: true, refl: true, emis: true }} aria="Le Soleil envoie du rayonnement vers la planète, qui en réfléchit une partie et émet un rayonnement infrarouge : les valeurs sont données dans l’énoncé."/>;
  }
  const boxScene = sceneGuide && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {dd && <div style={aide}>Schéma : le rayonnement du Soleil, la part réfléchie et l’infrarouge émis (valeurs dans l’énoncé).</div>}
      {sceneGuide}
    </div>);

  // ---------- exploration ----------
  const retablirEx = () => setEx(EX0);
  const changerPlanete = id => { const p = M.planeteDe(id); setEx(s => ({ ...s, pl: id, A: p.A })); };
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez une planète (elle fixe S₀), puis réglez l’albédo : la puissance absorbée et la température d’équilibre changent.</div>
      <label style={lblMenu}>Planète<select value={ex.pl} onChange={e => changerPlanete(e.target.value)} style={{ ...menu, marginTop: 2 }}>{M.PLANETES.map(g => <option key={g.id} value={g.id}>{g.court} (S₀ = {g.S0} W·m⁻², A = {String(g.A).replace('.', ',')})</option>)}</select></label>
      <Controle nom="Albédo A" valeur={ex.A} min={0} max={0.9} pas={0.01} onChange={A => setEx(s => ({ ...s, A: Number(A.toFixed(2)) }))} texte={nbf(ex.A, 2)} onRetablir={() => setEx(s => ({ ...s, A: plEx.A }))} retablir="Rétablir l’albédo"/>
      <Section titre={`Effet de serre (modèle simplifié) : g = ${nbf(ex.g, 2)}`} ouvert={ouv.serre} onBascule={() => setOuv(o => ({ ...o, serre: !o.serre }))}>
        <div style={aide}>Pour aller plus loin : g est la part de l’infrarouge émis par la surface que l’atmosphère lui renvoie. g = 0 : pas d’atmosphère. Essayez g = 0,39 pour la Terre : vous retrouvez environ 288 K. Ce modèle est très simplifié (voir les hypothèses).</div>
        <Controle nom="Part d’infrarouge renvoyée g" valeur={ex.g} min={0} max={0.6} pas={0.01} onChange={g => setEx(s => ({ ...s, g: Number(g.toFixed(2)) }))} texte={nbf(ex.g, 2)} onRetablir={() => setEx(s => ({ ...s, g: 0 }))} retablir="Supprimer l’effet de serre"/>
      </Section>
      <div style={{ marginTop: 8 }}><button onClick={retablirEx} style={stylePetitBouton(false)}><Pic n="refresh"/>Tout rétablir</button></div>
    </div>);
  const sceneEx = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>Flèches orange : le rayonnement du Soleil. Flèche grise : la part réfléchie. Flèches rouges : l’infrarouge émis{ex.g > 0 ? ' et celui que l’atmosphère renvoie vers le sol' : ''}.</div>
      <SceneTerre montre={{ S0: true, refl: true, emis: true, serre: ex.g > 0 }}/>
    </div>);
  const grapheEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>L’équilibre sur un graphique</div>
      <div style={aide}>La courbe rouge est la puissance émise σ T⁴ ; la droite orange est la puissance absorbée. L’équilibre est au croisement : lisez la température sur l’axe.</div>
      <GraphePuissance P={PEx} g={ex.g} Teq={Tmont}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Calculées avec P_abs = (1 − A) × S₀ divisé par 4, puis σ × T⁴ = P_abs.</div>
      <LigneMesure nom="Puissance absorbée P_abs" valeur={`${nbf(PEx, 0)}${NB}W·m⁻²`} couleur="#c2410c"/>
      <LigneMesure nom="Température d’équilibre T (sans atmosphère)" valeur={`${nbf(TeqEx, 0)}${NB}K (${nbf(M.celsius(TeqEx), 0)}${NB}°C)`} couleur="#b91c1c"/>
      {ex.g > 0 && <LigneMesure nom="Température de surface avec effet de serre" valeur={`${nbf(TsEx, 0)}${NB}K (${nbf(M.celsius(TsEx), 0)}${NB}°C)`} couleur={BLEU}/>}
      <LigneMesure nom={`Température moyenne observée (${plEx.court})`} valeur={`${nbf(plEx.Tobs, 0)}${NB}K (${nbf(M.celsius(plEx.Tobs), 0)}${NB}°C)`}/>
      {ex.pl === 'venus' && ex.g > 0 && <div role="status" style={{ ...aide, marginTop: 6, marginBottom: 0 }}>Même avec g = 0,6, le modèle reste très loin de 737 K : l’atmosphère de Vénus est bien plus complexe qu’une seule couche.</div>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Sur la Terre, faites baisser l’albédo de 0,30 à 0,20 : de combien de kelvins la température d’équilibre augmente-t-elle ? Est-ce beaucoup ?</li>
        <li>Pour la Terre, quel albédo donnerait 273 K (0 °C) sans atmosphère ? Est-ce réaliste ?</li>
        <li>Comparez Mars, la Terre et Vénus avec leur albédo actuel : classez les températures d’équilibre. Cet ordre est-il celui des températures observées ?</li>
        <li>Ouvrez le réglage de l’effet de serre, sur la Terre : quelle valeur de g reproduit la température observée ? Que se passe-t-il quand g augmente ?</li>
        <li>Vérifiez à la main la température d’équilibre affichée pour une planète et un albédo de votre choix.</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Puissance absorbée par m² : {eAbs} ; A est l’albédo</li>
          <li>Loi de Stefan-Boltzmann (donnée) : {eEm}, T en kelvins</li>
          <li>À l’équilibre : {eEq}, puis T = racine quatrième de P<sub>abs</sub> divisé par σ</li>
          <li>Terre sans atmosphère : environ 255 K (−18 °C) ; observée : 288 K (15 °C) ; l’écart vient de l’effet de serre</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tat-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tat-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tat-col { display: flex; flex-direction: column; gap: 12px; }
        .tat-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .tat-l1.cote .tat-carte { order: 2; } .tat-l1.cote .tat-main { order: 1; }
          .tat-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tat-ex > * { grid-column: 1; } .tat-ex > .tat-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .tat-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tat-in { animation: tat-fondu 0.35s ease-out; } @keyframes tat-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Bilan thermique de la Terre : albédo et effet de serre</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La température moyenne de la Terre résulte d’un bilan entre l’énergie absorbée du Soleil et l’énergie émise vers l’espace{(enGuide && !deja('temperature')) ? '.' : <> ; à l’équilibre, {eEq}.</>}</div>
      {!enExplore && <div className="tat-l1 cote">
        {enGuide ? <div className="tat-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="tat-carte">{panneauHypo}</div> : null}
        <div className="tat-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'planete' ? suiviP : suiviA}/></div>}
          <div className="tat-col">
            {boxScene && <div className="tat-in">{boxScene}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="tat-ex">
        <div>{sceneEx}</div>
        <div className="tat-ctrl">{reglagesEx}</div>
        <div>{grapheEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
