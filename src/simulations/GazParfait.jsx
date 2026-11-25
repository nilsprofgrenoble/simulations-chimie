import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./gazParfaitModele";
import { QCM_PARCOURS as Q } from "./gpfQcm";
import { SceneEchelles, SceneEnceinte, SceneDeuxEtats, GrapheIsothermes, GrapheReel, SvgCarteMicro, SvgCarteModele, SvgCarteEquation, SvgCarteEtats, SvgCarteRho, SvgCarteLimites } from "./gpfSchemas";

const SIM_ID = 215, CLE_GUIDE = 'gaz-parfait-tg-guide-v1';
declarerDefis(SIM_ID, [['etat', 'Prévoir l’état d’un gaz'], ['bouteille', 'Gaz dans une bouteille']]);

// ====================================================
// SIM 215 — GAZ PARFAIT : ÉQUATION D'ÉTAT ET LIMITES DU MODÈLE
//  (TG spé PC, « L'énergie : conversions et transferts », « Décrire un système thermodynamique : exemple du modèle du gaz parfait »).
//  Capacités visées (jamais affichées à l'élève) : relier qualitativement les grandeurs macroscopiques (pression, température thermodynamique, masse volumique)
//  aux propriétés microscopiques ; exploiter l'équation d'état PV = nRT (calcul d'une grandeur, comparaison de deux états, ρ = P M / (R T)) ; identifier quelques
//  limites du modèle. Prolonge la sim 162 (loi de Mariotte, 1G). Modèle : gazParfaitModele.js (test : gazParfaitModele.test.mjs).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const BLEU = '#0369a1', VERT = '#15803d';
const IDS = ['echelles', 'chocs', 'agitation', 'kelvin', 'modele', 'equation', 'calcul', 'etats', 'prevoir', 'rho', 'limites', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
const VMAX = 40;                                                   // L : volume maximal dessiné
const sciPa = P => { const e = Math.floor(Math.log10(P)), m = P / 10 ** e; return `${nbf(m, 2)} × 10${String(e).replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).replace('-', '⁻')} Pa`; };

// ---------- formules (MathML) ----------
const FEtat = <Formule><mi>P</mi><mo>×</mo><mi>V</mi><mo>=</mo><mi>n</mi><mo>×</mo><mi>R</mi><mo>×</mo><mi>T</mi></Formule>;
const sur = (a, b) => <mfrac>{a}{b}</mfrac>;
const sub = (l, i) => <msub><mi>{l}</mi><mn>{i}</mn></msub>;
const FDeuxEtats = <Formule>{sur(<mrow>{sub('P', 1)}<mo>×</mo>{sub('V', 1)}</mrow>, sub('T', 1))}<mo>=</mo>{sur(<mrow>{sub('P', 2)}<mo>×</mo>{sub('V', 2)}</mrow>, sub('T', 2))}</Formule>;
const FRho = <Formule><mi>ρ</mi><mo>=</mo>{sur(<mrow><mi>P</mi><mo>×</mo><mi>M</mi></mrow>, <mrow><mi>R</mi><mo>×</mo><mi>T</mi></mrow>)}</Formule>;
const eDeuxEtats = <FormuleEnLigne>{sur(<mrow>{sub('P', 1)}<mo>×</mo>{sub('V', 1)}</mrow>, sub('T', 1))}<mo>=</mo>{sur(<mrow>{sub('P', 2)}<mo>×</mo>{sub('V', 2)}</mrow>, sub('T', 2))}</FormuleEnLigne>;
const eEtat = <FormuleEnLigne><mi>P</mi><mo>×</mo><mi>V</mi><mo>=</mo><mi>n</mi><mo>×</mo><mi>R</mi><mo>×</mo><mi>T</mi></FormuleEnLigne>;
const eVolume = <FormuleEnLigne><mi>V</mi><mo>=</mo>{sur(<mrow><mi>n</mi><mo>×</mo><mi>R</mi><mo>×</mo><mi>T</mi></mrow>, <mi>P</mi>)}</FormuleEnLigne>;
const eRho = <FormuleEnLigne><mi>ρ</mi><mo>=</mo>{sur(<mrow><mi>P</mi><mo>×</mo><mi>M</mi></mrow>, <mrow><mi>R</mi><mo>×</mo><mi>T</mi></mrow>)}</FormuleEnLigne>;
const eP2 = <FormuleEnLigne>{sub('P', 2)}<mo>=</mo>{sur(<mrow>{sub('P', 1)}<mo>×</mo>{sub('V', 1)}<mo>×</mo>{sub('T', 2)}</mrow>, <mrow>{sub('T', 1)}<mo>×</mo>{sub('V', 2)}</mrow>)}</FormuleEnLigne>;
const eVq = <FormuleEnLigne><mi>v</mi><mo>=</mo><msqrt><mfrac><mrow><mn>3</mn><mo>×</mo><mi>R</mi><mo>×</mo><mi>T</mi></mrow><mi>M</mi></mfrac></msqrt></FormuleEnLigne>;
const eRacTM = <FormuleEnLigne><msqrt><mfrac><mi>T</mi><mi>M</mi></mfrac></msqrt></FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// contrôle d'une grandeur : curseur + boutons − / + (un doigt ne vise pas un cran) + rétablir
function Controle({ nom, valeur, min, max, pas, pasBouton, onChange, texte, retablir = 'Rétablir', onRetablir }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  const dec = Math.max(0, -Math.floor(Math.log10(pas))), arr = x => Math.max(min, Math.min(max, Number(x.toFixed(dec + 1))));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 2, fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt, textAlign: 'right', whiteSpace: 'nowrap' }}>{avecIndices(texte)}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label={`Diminuer : ${nom}`} onClick={() => onChange(arr(valeur - (pasBouton || pas)))} style={btn}>−</button>
        <input type="range" min={min} max={max} step={pas} value={valeur} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label={`Augmenter : ${nom}`} onClick={() => onChange(arr(valeur + (pasBouton || pas)))} style={btn}>+</button>
      </div>
      <div style={{ marginTop: 6 }}><button onClick={onRetablir} style={stylePetitBouton(false)}><Pic n="refresh"/>{retablir}</button></div>
    </div>);
}

export function SimulationGazParfait() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviE, noterE] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('etat');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ gaz: false, temp: false, regle: false, comp: false, reel: false, essayer: false, retenir: false });
  const [nG, setNG] = useState(1.0), [TG, setTG] = useState(300);                                  // parcours : réglages des étapes 2 à 6
  const EX0 = { mode: 'V', V: 20, P: 1.2, n: 1.0, th: 20, gaz: 'N2', comparer: false, th2: 100, reelTh: 20, reelV: 0.5 };
  const [ex, setEx] = useState(EX0);                                                                  // exploration
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- état de l'exploration ----------
  const Tex = M.kelvin(ex.th), gazEx = M.gazDe(ex.gaz), Mex = gazEx.M / 1000;
  const Pmin = Math.ceil(M.Pa_bar(M.pression(ex.n, Tex, M.L_m3(VMAX))) * 10) / 10, Pmaxi = Math.floor(M.Pa_bar(M.pression(ex.n, Tex, M.L_m3(2))) * 10) / 10;
  const Pex = ex.mode === 'P' ? Math.max(Pmin, Math.min(Pmaxi, ex.P)) : M.Pa_bar(M.pression(ex.n, Tex, M.L_m3(ex.V)));
  const Vex = ex.mode === 'P' ? M.m3_L(M.volume(ex.n, Tex, M.bar_Pa(Pex))) : ex.V;
  const rhoEx = M.masseVolumique(M.bar_Pa(Pex), Mex, Tex), vqEx = M.vitesseQuadratique(Tex, Mex);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'echelles', titre: 'Deux échelles pour décrire un gaz', focus: ['scene'],
      texte: <>Un gaz enfermé dans une enceinte se décrit à deux échelles. À l’échelle <strong>macroscopique</strong> (vu de loin), on s’intéresse à l’enceinte entière et à ce que des instruments de mesure indiquent. À l’échelle <strong>microscopique</strong> (vu de près), on s’intéresse aux molécules : chacune a sa position et sa vitesse, et il y en a un nombre immense, qui se déplacent dans tous les sens.</>,
      tache: { type: 'qcm', q: 'Parmi ces grandeurs, laquelle est une grandeur macroscopique du gaz ?', options: Q.echelles.options, bonne: 0,
        expl: 'La pression est exercée par l’ensemble des molécules sur la paroi : on la mesure sur l’enceinte entière, avec un manomètre. La vitesse, la position et la direction d’une molécule précise décrivent une seule molécule : ce sont des grandeurs microscopiques, qu’aucun instrument de laboratoire ne mesure pour un gaz.',
        indice: 'Une grandeur macroscopique concerne le gaz dans son ensemble et se mesure avec un instrument sur l’enceinte ; une grandeur microscopique concerne une molécule.' } },
    { id: 'chocs', titre: 'La pression : des chocs sur la paroi', focus: ['scene', 'reglages'],
      texte: <>Les molécules se déplacent en tous sens et frappent la paroi mobile (le piston) : chaque choc est marqué par un petit trait orange. Changez la quantité de gaz avec le menu et regardez le piston. La <strong>pression</strong> exercée par le gaz sur une paroi est due à l’ensemble de ces chocs. Le dessin est qualitatif : un vrai gaz contient des milliards de milliards de molécules, impossibles à dessiner.</>,
      tache: { type: 'qcm', q: 'À volume et température inchangés, on ajoute du gaz dans l’enceinte. Comment expliquer l’augmentation de la pression ?', options: Q.chocs.options, bonne: 0,
        expl: 'Plus de molécules dans le même volume, c’est plus de molécules qui atteignent la paroi à chaque seconde : les chocs sont plus nombreux, donc la pression augmente. Chaque choc n’est pas plus violent, car la température, donc l’agitation moyenne, n’a pas changé ; les molécules ne vont pas plus vite pour la même raison ; et dans le modèle étudié, elles n’interagissent pas à distance.',
        indice: 'Température inchangée : chaque molécule garde en moyenne la même vitesse. Qu’est-ce qui change alors dans le nombre de chocs ?' } },
    { id: 'agitation', titre: 'La température : l’agitation des molécules', focus: ['scene', 'reglages'],
      texte: <>Les molécules ne s’arrêtent jamais : c’est l’<strong>agitation</strong>. La <strong>température thermodynamique</strong> T, exprimée en kelvins (K), traduit cette agitation : plus T est grande, plus l’agitation des molécules est grande en moyenne. Choisissez une température dans le menu et comparez les mouvements.</>,
      tache: { type: 'qcm', q: 'On chauffe un gaz enfermé dans une enceinte de volume fixe. Qu’observe-t-on à l’échelle microscopique ?', options: Q.agitation.options, bonne: 0,
        expl: 'Chauffer augmente la température, donc l’agitation : les molécules vont en moyenne plus vite. Leur nombre ne change pas (le gaz est enfermé) et elles ne grossissent pas : leur masse et leur taille ne dépendent pas de la température. Dans un volume fixe, elles ne se rapprochent pas non plus : elles sont aussi espacées qu’avant, mais frappent les parois plus souvent et plus fort.',
        indice: 'Relisez le lien entre T et l’agitation : que devient l’agitation quand T augmente ?' } },
    { id: 'kelvin', titre: 'Température en kelvins', focus: ['scene', 'reglages'],
      retenirTitre: 'Pression et température : à l’échelle des molécules',
      retenir: <>
        <SvgCarteMicro/>
        <ul style={ULS}>
          <li><strong>Pression</strong> : due aux chocs des molécules sur les parois ; plus de chocs par seconde, donc pression plus grande.</li>
          <li><strong>Température T</strong> (en K) : mesure de l’agitation ; T plus grande, molécules plus rapides, chocs plus nombreux et plus forts.</li>
          <li>Moyen de s’en souvenir : <strong>« pression = chocs, température = agitation »</strong>. Idée fausse : « chauffer fait grossir les molécules ». Vrai : elles vont plus vite, leur taille ne change pas.</li>
        </ul></>,
      texte: <>On donne souvent une température en degrés Celsius, notée θ. La température thermodynamique T en kelvins s’en déduit : T (en K) = θ (en °C) + 273,15. Un écart de 1 K est égal à un écart de 1 °C. T ne peut pas être négative : quand T diminue, l’agitation diminue ; la valeur T = 0 K est appelée zéro absolu.</>,
      tache: { type: 'num', q: 'Une enceinte contient du gaz à θ = 37 °C. Quelle est sa température thermodynamique T, en K ?', unite: 'K', vrai: 310.15, tol: 0.01, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['T = θ + 273,15 = 37 + 273,15 = 310,15 K, soit environ 310 K.'],
        pieges: [[37, 'Vous avez laissé la température en °C : il faut ajouter 273,15 pour obtenir des kelvins.'], [-236.15, 'Vous avez soustrait 273,15 : c’est l’inverse, T (en K) = θ (en °C) + 273,15.'], [37 * 273.15, 'Il faut additionner 273,15, pas multiplier.']],
        expl: 'T = θ + 273,15 = 37 + 273,15 = 310,15 K : environ 310 K.',
        indice: 'T (en K) = θ (en °C) + 273,15.' } },
    { id: 'modele', titre: 'Le modèle du gaz parfait', focus: ['scene', 'reglages'],
      texte: <>Pour décrire quantitativement un gaz, on utilise un <strong>modèle</strong> simple, le modèle du gaz parfait. Les molécules y sont assimilées à des <strong>points matériels</strong> (leur volume propre est négligé), elles <strong>n’interagissent pas entre elles</strong> à distance, et elles ne subissent des chocs <strong>élastiques</strong> que sur les parois. C’est un modèle : un gaz réel ne vérifie ces hypothèses que dans certaines conditions, que l’on précisera plus loin.</>,
      tache: { type: 'qcm', q: 'Deux molécules passent très près l’une de l’autre. Que prévoit le modèle du gaz parfait ?', options: Q.modele.options, bonne: 0,
        expl: 'Sans interaction entre molécules, chacune poursuit sa trajectoire en ligne droite comme si l’autre n’existait pas. Une attraction, une répulsion ou une liaison provisoire sont des interactions : elles sont exclues du modèle. Dans un gaz réel, elles existent, mais elles sont faibles quand les molécules sont éloignées.',
        indice: 'Relisez les hypothèses : « n’interagissent pas entre elles ».' } },
    { id: 'equation', titre: 'L’équation d’état et ses unités', focus: ['scene', 'reglages'],
      retenirTitre: 'Le modèle du gaz parfait',
      retenir: <>
        <SvgCarteModele/>
        <ul style={ULS}>
          <li>Gaz parfait : molécules <strong>ponctuelles</strong>, <strong>sans interaction</strong>, chocs <strong>élastiques</strong> sur les parois.</li>
          <li>C’est un <strong>modèle</strong> : un gaz réel s’en rapproche dans certaines conditions, à préciser.</li>
          <li>Moyen de s’en souvenir : <strong>« des points qui s’ignorent et rebondissent »</strong>. Idée fausse : « le gaz parfait existe dans la nature ». Vrai : c’est une description simplifiée.</li>
        </ul></>,
      texte: <>Le modèle conduit à l’<strong>équation d’état</strong> du gaz parfait :{FEtat}P est la pression, V le volume, n la quantité de matière de gaz, T la température thermodynamique et R = 8,314{NB}J·K⁻¹·mol⁻¹ la constante des gaz parfaits (valeur fournie). Pour n et T constants, on retrouve P × V = constante : c’est la loi de Mariotte, étudiée en première (simulation « Fluide au repos : pression, force pressante et loi de Mariotte »). Ici, V est fixé à {nbf(20, 0)}{NB}L et le manomètre indique la pression : changez n ou T et observez.</>,
      tache: { type: 'qcm', q: 'Avec R = 8,314 J·K⁻¹·mol⁻¹, dans quelles unités faut-il exprimer P, V et T ?', options: Q.unites.options, bonne: 0,
        expl: 'R est exprimée en J·K⁻¹·mol⁻¹, unités du système international : P doit être en pascals, V en mètres cubes et T en kelvins. Une pression en bar ou en hPa, un volume en L ou en mL, une température en °C donneraient un résultat faux d’un facteur 10⁵, 10³ ou 10⁶, ou d’un décalage de 273,15.',
        indice: 'R contient des joules (1 J = 1 Pa × 1 m³), des kelvins et des moles : quelles sont les unités du système international de P, V et T ?' } },
    { id: 'calcul', titre: 'Calculer une grandeur avec PV = nRT', focus: ['scene'],
      retenirTitre: 'L’équation d’état et ses unités',
      retenir: <>
        <SvgCarteEquation/>
        <ul style={ULS}>
          <li><strong>P V = n R T</strong> avec P en Pa, V en m³, n en mol, T en K, R = 8,314 J·K⁻¹·mol⁻¹.</li>
          <li>Conversions : 1 bar = 10⁵ Pa ; 1 L = 10⁻³ m³ ; T = θ + 273,15.</li>
          <li>Exemple : 1 mol de gaz à 20 °C sous 1,013 bar occupe environ 24 L.</li>
          <li>Moyen de s’en souvenir : <strong>« tout en unités du système international, T en kelvins »</strong>. Idée fausse : « on peut garder la température en °C ». Vrai : toujours en kelvins.</li>
        </ul></>,
      texte: <>Un ballon contient n = 0,500{NB}mol d’un gaz, à la température θ = 27{NB}°C, sous la pression P = 1,20{NB}bar (le manomètre l’indique). Le gaz est assimilé à un gaz parfait ; R = 8,314{NB}J·K⁻¹·mol⁻¹. Le volume du ballon est inconnu : ce sera le résultat de l’étape.</>,
      tache: { type: 'num', q: 'Quel est le volume V du ballon, en litres ? (2 chiffres significatifs)', unite: 'L', vrai: M.m3_L(M.volume(0.5, M.kelvin(27), M.bar_Pa(1.2))), tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Conversions : T = 27 + 273,15 = 300,15 K ; P = 1,20 bar = 1,20 × 10⁵ Pa.', <>{eVolume} = {avecIndices('frac(0,500 × 8,314 × 300,15|1,20 × 10⁵)')} = 1,04 × 10⁻² m³ = 10,4 L.</>],
        pieges: [[0.0104, 'Vous avez donné V en m³ : la réponse est attendue en litres (1 m³ = 1000 L).'], [1040, 'La pression n’a pas été convertie en pascals : 1,20 bar = 1,20 × 10⁵ Pa.'], [0.935, 'La température n’a pas été convertie en kelvins : T = θ + 273,15.'], [0.5 * 8.314 * 300.15 * 1.2e5 / 1000, 'Le volume est obtenu en divisant n R T par P, pas en multipliant.']],
        expl: <>V = {avecIndices('frac(n × R × T|P)')} = {avecIndices('frac(0,500 × 8,314 × 300,15|1,20 × 10⁵)')} = 1,04 × 10⁻² m³ = 10,4 L.</>,
        indice: <>Isolez V : {eVolume}. Convertissez d’abord T en kelvins et P en pascals, puis le résultat de m³ en L.</> } },
    { id: 'etats', titre: 'Comparer deux états d’un même gaz', focus: ['scene'],
      texte: <>Une quantité fixe de gaz (n constant) passe d’un état 1 à un état 2, sans fuite. Comme n et R sont constantes, le rapport {avecIndices('frac(P × V|T)')} = n × R garde la même valeur :{FDeuxEtats}avec T en kelvins, P₁ et P₂ dans la même unité, V₁ et V₂ dans la même unité. État 1 : P₁ = 1,50{NB}bar, V₁ = 4,0{NB}L, θ₁ = 17{NB}°C. État 2 : V₂ = 2,0{NB}L, θ₂ = 77{NB}°C.</>,
      tache: { type: 'num', q: 'Quelle est la pression P₂ dans l’état 2, en bar ? (2 chiffres significatifs)', unite: 'bar', vrai: M.pressionEtat2(1.5, 4.0, M.kelvin(17), 2.0, M.kelvin(77)), tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Conversions : T₁ = 17 + 273,15 = 290,15 K ; T₂ = 77 + 273,15 = 350,15 K (les bar et les L n’ont pas besoin d’être convertis : ils se simplifient).', <>{eP2} = {avecIndices('frac(1,50 × 4,0 × 350,15|290,15 × 2,0)')} = 3,6 bar.</>],
        pieges: [[3.0, 'Vous n’avez pas tenu compte du changement de température : T₂ ≠ T₁ ici.'], [2.49, 'Le rapport des températures est inversé : P₂ est proportionnelle à T₂ (et inversement proportionnelle à V₂).'], [13.6, 'Les températures sont restées en °C : il faut les convertir en kelvins.'], [1.81, 'Vous avez oublié le facteur V₁ / V₂ : le volume a été divisé par 2.']],
        expl: <>{eP2} = {avecIndices('frac(1,50 × 4,0 × 350,15|290,15 × 2,0)')} = 3,6 bar : la pression augmente car le volume diminue et la température augmente.</>,
        indice: <>{eP2}. Convertissez les deux températures en kelvins ; bar et L peuvent rester tels quels.</> } },
    { id: 'prevoir', titre: 'Prévoir sans calculer', focus: ['scene'],
      texte: <>La relation précédente permet de prévoir un effet sans faire de calcul. Deux transformations d’un même gaz enfermé (n constant) : <strong>(a)</strong> le volume reste constant et la température thermodynamique T double ; <strong>(b)</strong> la température reste constante et le volume V est divisé par 2.</>,
      tache: { type: 'qcm', q: 'Que devient la pression P dans chaque cas ?', options: Q.prevoir.options, bonne: 0,
        expl: <>Avec {eDeuxEtats} : en (a), V₂ = V₁ et T₂ = 2 T₁ donc P₂ = 2 P₁. En (b), T₂ = T₁ et V₂ = {avecIndices('frac(V₁|2)')} donc P₂ = 2 P₁ : c’est la loi de Mariotte. La pression ne peut pas être divisée par 2 quand on chauffe à volume constant (plus d’agitation, donc plus de chocs), ni inchangée quand on comprime un gaz à température constante.</>,
        indice: 'P est proportionnelle à T quand V est constant, et inversement proportionnelle à V quand T est constante.' } },
    { id: 'rho', titre: 'Masse volumique d’un gaz', focus: ['scene'],
      retenirTitre: 'Comparer deux états d’un même gaz',
      retenir: <>
        <SvgCarteEtats/>
        <ul style={ULS}>
          <li>À n constant : {avecIndices('frac(P₁ × V₁|T₁)')} = {avecIndices('frac(P₂ × V₂|T₂)')}, avec T en kelvins.</li>
          <li>Prévoir : à V constant, T double ⇒ P double ; à T constante, V divisé par 2 ⇒ P double.</li>
          <li>Moyen de s’en souvenir : <strong>« P proportionnelle à T, inversement proportionnelle à V »</strong>. Idée fausse : « on peut garder θ en °C dans le rapport ». Vrai : T en kelvins.</li>
        </ul></>,
      texte: <>La masse volumique d’un gaz est ρ = m divisée par V. Avec m = n × M (M : masse molaire, en kg·mol⁻¹) et n = {avecIndices('frac(P × V|R × T)')} tirés de l’équation d’état, on obtient :{FRho}On étudie du dioxyde de carbone (M = 44,0{NB}g·mol⁻¹) à θ = 25{NB}°C sous P = 1,00{NB}bar.</>,
      tache: { type: 'num', q: 'Quelle est la masse volumique ρ de ce gaz, en kg·m⁻³ ? (2 chiffres significatifs)', unite: 'kg·m⁻³', vrai: M.masseVolumique(1e5, 0.044, M.kelvin(25)), tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Conversions : M = 44,0 g·mol⁻¹ = 0,0440 kg·mol⁻¹ ; P = 1,00 bar = 1,00 × 10⁵ Pa ; T = 25 + 273,15 = 298,15 K.', <>{eRho} = {avecIndices('frac(1,00 × 10⁵ × 0,0440|8,314 × 298,15)')} = 1,8 kg·m⁻³.</>],
        pieges: [[1775, 'La masse molaire doit être en kg·mol⁻¹ (0,0440), pas en g·mol⁻¹ : le résultat serait 1000 fois trop grand.'], [21.2, 'La température n’a pas été convertie en kelvins : T = θ + 273,15.'], [1.77e-5, 'La pression n’a pas été convertie en pascals : 1,00 bar = 1,00 × 10⁵ Pa.'], [0.56, 'Le rapport est inversé : ρ = P × M divisé par R × T.']],
        expl: <>ρ = {avecIndices('frac(P × M|R × T)')} = {avecIndices('frac(1,00 × 10⁵ × 0,0440|8,314 × 298,15)')} = 1,8 kg·m⁻³ : le dioxyde de carbone est plus dense que l’air (M plus grande).</>,
        indice: <>{eRho} avec P en pascals, M en kg·mol⁻¹ et T en kelvins.</> } },
    { id: 'limites', titre: 'Les limites du modèle', focus: ['graphe'],
      retenirTitre: 'La masse volumique d’un gaz',
      retenir: <>
        <SvgCarteRho/>
        <ul style={ULS}>
          <li><strong>ρ = frac(P × M|R × T)</strong> avec M en kg·mol⁻¹.</li>
          <li>Air à 20 °C sous 1,013 bar : ρ ≈ 1,2 kg·m⁻³. À pression fixée, ρ diminue quand T augmente : le gaz chaud est plus dilué.</li>
          <li>Moyen de s’en souvenir : <strong>« gaz chaud = gaz dilué »</strong>. Idée fausse : « la masse volumique d’un gaz est toujours la même ». Vrai : elle dépend de P, de T et de la nature du gaz (M).</li>
        </ul></>,
      texte: <>Le gaz parfait est un modèle. Le graphique compare, pour 1,00{NB}mol de dioxyde de carbone à 20{NB}°C (293{NB}K), la pression prévue par P × V = n × R × T (trait plein) et des valeurs fournies pour le gaz réel (tirets ; allure qualitative, valeurs approchées calculées avec un modèle plus complet, hors programme). Sur le palier horizontal, la pression ne change plus quand le volume diminue : le gaz se liquéfie.</>,
      tache: { type: 'qcm', q: 'Où le modèle du gaz parfait décrit-il le moins bien ce gaz ?', options: Q.limites.options, bonne: 0,
        expl: 'Aux petits volumes, les molécules sont proches : leur volume propre et leurs interactions, négligés par le modèle, comptent, et le gaz peut même se liquéfier ; les deux courbes s’écartent beaucoup. Aux grands volumes (basse pression), les molécules sont éloignées : les deux courbes se confondent presque. L’écart n’est donc pas le même partout. Et une température plus élevée rapproche le gaz réel du gaz parfait, elle ne l’en éloigne pas.',
        indice: 'Comparez les deux courbes à droite (grands volumes) puis à gauche (petits volumes) du graphique.' } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'Les limites du modèle du gaz parfait',
      retenir: <>
        <SvgCarteLimites/>
        <ul style={ULS}>
          <li>Écarts entre gaz réel et gaz parfait : <strong>hautes pressions</strong> (volume propre des molécules, interactions) et <strong>basses températures</strong> (liquéfaction).</li>
          <li>À très haute pression, le volume propre des molécules rend la pression réelle supérieure à celle du gaz parfait.</li>
          <li>Modèle très bon pour l’air à pression et température usuelles ; il le devient de moins en moins quand le gaz est comprimé ou refroidi.</li>
          <li>Moyen de s’en souvenir : <strong>« comprimé ou refroidi : le modèle se dégrade »</strong>. Idée fausse : « un gaz parfait existe ». Vrai : c’est un modèle, dont il faut connaître le domaine de validité.</li>
        </ul></>,
      texte: <>Vous savez relier pression et température à l’agitation et aux chocs des molécules, utiliser l’équation d’état {eEtat} avec les bonnes unités, comparer deux états d’un même gaz, prévoir sans calculer, calculer une masse volumique et reconnaître les limites du modèle du gaz parfait. Passez à l’exploration (enceinte à piston, isothermes, comparaison avec un gaz réel) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  // tirage : rep1, rep2, rep3 = valeurs attendues (calculées avec les données AFFICHÉES) ; saisies de l'élève : s1, s2, s3
  const nouveauDefi = type => { setDefi({ ...(type === 'etat' ? M.tirageEtat() : M.tirageBouteille()), type, s1: '', s2: '', s3: '', verifie: false, essais: 0 }); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const tolDe = (type, k) => (type === 'bouteille' && k === 2 ? 0.08 : 0.06);
  const verifier = () => {
    const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
    const res = [1, 2, 3].map(k => pr(lireNombre(defi[`s${k}`] || ''), defi[`rep${k}`], tolDe(defi.type, k)));
    const ok = res.every(Boolean);
    setDefi(d => ({ ...d, verifie: true, ok, res, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'etat' ? noterE : noterB)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('gpf-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.res[+cle.slice(1) - 1] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const v1 = x => nbf(x, 1), v2 = x => nbf(x, 2);
  const solutionDefi = d => d.type === 'etat'
    ? <>P₁ = {avecIndices('frac(n × R × T₁|V)')} = {avecIndices(`frac(${v2(d.n)} × 8,314 × ${v2(M.kelvin(d.th1))}|${nbf(d.V, 0)} × 10⁻³)`)}… soit {v1(d.rep1)} bar ; à volume constant P₂ = P₁ × {avecIndices('frac(T₂|T₁)')} = {v1(d.rep2)} bar ; T₃ = {avecIndices('frac(P₃ × V|n × R)')} = {nbf(d.rep3, 0)} K.</>
    : <>n = {avecIndices('frac(P × V|R × T)')} = {v2(d.rep1)} mol ; m = n × M = {v2(d.rep1)} × {nbf(d.gaz.M, 1)} = {nbf(d.rep2, 0)} g ; à même température, P × V est constant : V′ = {avecIndices(`frac(${nbf(d.P, 1)} × ${d.V}|1,013)`)} = {nbf(d.rep3, 0)} L.</>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['etat', 'Prévoir l’état d’un gaz'], ['bouteille', 'Gaz dans une bouteille']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'etat' ? 'Défi : prévoir la pression d’un gaz enfermé' : 'Défi : combien de gaz dans une bouteille ?'}</div>
      {defi.type === 'etat' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une enceinte rigide (volume constant) de <strong>V = {nbf(defi.V, 0)}{NB}L</strong> contient <strong>n = {v2(defi.n)}{NB}mol</strong> de gaz, assimilé à un gaz parfait, à <strong>θ = {defi.th1}{NB}°C</strong>. R = 8,314{NB}J·K⁻¹·mol⁻¹. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Pression P₁ du gaz, en bar.</div>
        {champ('P₁', 's1', 'bar')}
        <IndiceDefi cache={false}>P = {avecIndices('frac(n × R × T|V)')} avec T en kelvins (θ + 273,15), V en m³ (1 L = 10⁻³ m³) ; le résultat est en pascals, à diviser par 10⁵ pour des bar.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> On chauffe le gaz, toujours à volume constant, jusqu’à <strong>θ₂ = {defi.th2}{NB}°C</strong>. Pression P₂, en bar.</div>
        {champ('P₂', 's2', 'bar')}
        <IndiceDefi cache={false}>À V et n constants : {avecIndices('frac(P₂|T₂)')} = {avecIndices('frac(P₁|T₁)')}, avec T₁ et T₂ en kelvins.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> L’enceinte supporte au plus <strong>P₃ = {v1(defi.P3)}{NB}bar</strong>. Quelle température T₃ (en kelvins) fait atteindre cette pression, à volume constant ?</div>
        {champ('T₃', 's3', 'K')}
        <IndiceDefi cache={false}>Isolez T dans P × V = n × R × T : T = {avecIndices('frac(P × V|n × R)')}, avec P en pascals et V en m³.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une bouteille de <strong>V = {defi.V}{NB}L</strong> contient du <strong>{defi.gaz.nom.toLowerCase()}</strong> (M = {nbf(defi.gaz.M, 1)}{NB}g·mol⁻¹), supposé parfait, sous la pression <strong>P = {v1(defi.P)}{NB}bar</strong>, à <strong>θ = {defi.th}{NB}°C</strong>. R = 8,314{NB}J·K⁻¹·mol⁻¹. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%, 8{NB}% pour la question 2).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Quantité de matière n de gaz, en mol.</div>
        {champ('n', 's1', 'mol')}
        <IndiceDefi cache={false}>n = {avecIndices('frac(P × V|R × T)')} avec P en pascals, V en m³ et T en kelvins.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Masse m de gaz dans la bouteille, en grammes (gardez un chiffre de plus pour n dans le calcul).</div>
        {champ('m', 's2', 'g')}
        <IndiceDefi cache={false}>m = n × M, avec M en g·mol⁻¹ pour obtenir des grammes.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> On laisse le gaz se détendre à la même température jusqu’à la pression atmosphérique <strong>P′ = 1,013{NB}bar</strong>. Quel volume V′ (en litres) occupe-t-il alors ?</div>
        {champ('V′', 's3', 'L')}
        <IndiceDefi cache={false}>La quantité de matière et la température sont les mêmes dans les deux états : P × V = P′ × V′ (bar et L peuvent rester tels quels).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="gpf-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : `✗ Pas tout à fait (question 1 ${defi.res[0] ? 'juste' : 'à revoir'}, question 2 ${defi.res[1] ? 'juste' : 'à revoir'}, question 3 ${defi.res[2] ? 'juste' : 'à revoir'}). `}
        {defi.ok || (defi.essais || 0) >= 3
          ? <span style={{ fontWeight: 400 }}>{solutionDefi(defi)}</span>
          : <span style={{ fontWeight: 400 }}>{defi.type === 'etat' ? 'Vérifiez les conversions (°C en K, L en m³, Pa en bar) et la relation utilisée, puis vérifiez à nouveau (les indices peuvent aider).' : 'Vérifiez les conversions (bar en Pa, L en m³, °C en K, g et kg) et la relation utilisée, puis vérifiez à nouveau (les indices peuvent aider).'}</span>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle du gaz parfait</strong> : molécules assimilées à des points matériels (volume propre négligé), sans interaction entre elles à distance, chocs élastiques sur les parois. L’équation d’état P V = n R T en découle. C’est un <strong>modèle</strong> : il décrit bien un gaz réel à basse pression et à température pas trop basse, et de moins en moins bien quand le gaz est comprimé ou refroidi.</li>
      <li><strong>Système</strong> : un gaz enfermé, de quantité de matière n constante (pas de fuite), à l’équilibre : pression et température uniformes ; piston sans frottement. Un gaz pur (ou l’air, mélange traité comme un gaz de masse molaire 29,0 g·mol⁻¹).</li>
      <li><strong>Unités et constante</strong> : P en pascals, V en m³, T en kelvins (T = θ + 273,15), R = 8,314 J·K⁻¹·mol⁻¹ (fournie). Les conversions (bar, hPa, L, mL, °C) sont écrites dans les corrigés. P désigne la pression absolue.</li>
      <li><strong>Masses molaires</strong> : valeurs usuelles arrondies (diazote 28,0 ; dioxygène 32,0 ; hélium 4,0 ; dioxyde de carbone 44,0 g·mol⁻¹), ordres de grandeur typiques.</li>
      <li><strong>Animation</strong> : qualitative et pas à l’échelle. Le nombre de molécules dessinées augmente avec n (de 8 à 32, alors qu’un vrai gaz en contient des milliards de milliards) ; l’agitation dessinée est proportionnelle à {eRacTM} en valeur relative (plus rapide quand T augmente ou quand M diminue). Les rares chocs entre molécules ne sont pas représentés (aucune interaction à distance non plus) ; les chocs sur le piston sont marqués en orange.</li>
      <li><strong>Vitesse quadratique</strong> (exploration) : {eVq}, avec M en kg·mol⁻¹ ; ordre de grandeur de la vitesse des molécules (≈ 500 m·s⁻¹ pour le diazote à 300 K). Cette relation n’est pas exigible.</li>
      <li><strong>Gaz réel</strong> : les « valeurs fournies » pour le dioxyde de carbone sont calculées avec un modèle plus complet que le gaz parfait (volume propre des molécules et interactions, hors programme), avec un palier de liquéfaction ; allure qualitative, valeurs approchées : à 20 °C, le palier est à environ 64 bar ici contre environ 57 bar mesurés, et le volume du liquide est surestimé ; l’écart avec le gaz réel peut atteindre quelques dizaines de pour cent près de la liquéfaction (température critique ≈ 304 K, pression critique ≈ 74 bar).</li>
      <li><strong>Valeurs des exercices et des défis</strong> : fictives mais réalistes, avec des pressions modérées (quelques bar) pour lesquelles le gaz parfait est une bonne approximation.</li>
      <li><strong>Hors périmètre</strong> : énergie interne, premier principe, théorie cinétique quantitative, forces pressantes (voir la simulation sur la pression en première), mélanges de gaz.</li>
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
  const N_MENU = [0.25, 0.5, 1.0, 1.5, 2.0], T_MENU_K = [150, 300, 450, 600], TH_MENU = [-50, 0, 20, 50, 100, 200];
  const selectN = (val, on) => (<label style={lblMenu}>Quantité de gaz (n)<select value={val} onChange={e => on(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{N_MENU.map(v => <option key={v} value={v}>{nbf(v, 2)} mol</option>)}</select></label>);
  const selectTK = (val, on) => (<label style={lblMenu}>Température thermodynamique (T)<select value={val} onChange={e => on(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{T_MENU_K.map(v => <option key={v} value={v}>{v} K</option>)}</select></label>);
  const selectTh = (val, on, nom = 'Température du gaz') => (<label style={lblMenu}>{nom}<select value={val} onChange={e => on(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{TH_MENU.map(v => <option key={v} value={v}>{v} °C ({nbf(M.kelvin(v), 2)} K)</option>)}</select></label>);

  // ---------- scène du parcours / du défi ----------
  const anime = !reduit;
  let sceneGuide = null;
  if (enGuide) {
    const P6 = M.Pa_bar(M.pression(nG, TG, M.L_m3(20)));
    if (idx === I.echelles) sceneGuide = <SceneEchelles/>;
    else if (idx === I.chocs) sceneGuide = <SceneEnceinte n={nG} T={300} V={20} Vmax={VMAX} montre={{ n: true }} anime={anime} flecheVitesse={reduit}/>;
    else if (idx >= I.agitation && idx <= I.modele) sceneGuide = <SceneEnceinte n={nG} T={TG} V={20} Vmax={VMAX} montre={{ n: true, T: true }} anime={anime} flecheVitesse={reduit}/>;
    else if (idx === I.equation) sceneGuide = <SceneEnceinte n={nG} T={TG} V={20} Vmax={VMAX} P={P6} montre={{ n: true, T: true, V: true, P: true }} anime={anime} flecheVitesse={reduit}/>;
    // étape « calcul » : pas de scène (un piston dessiné à une position donnerait une indication sur le volume cherché, et T en K livrerait la conversion)
    else if (idx === I.etats) sceneGuide = <SceneDeuxEtats V1={4} V2={2} Vmax={4} lignes1={[{ t: 'P₁ = 1,50 bar' }, { t: 'V₁ = 4,0 L' }, { t: 'θ₁ = 17 °C' }]} lignes2={[{ t: 'P₂ = ?', c: '#c2410c' }, { t: 'V₂ = 2,0 L' }, { t: 'θ₂ = 77 °C' }]}/>;
    else if (idx === I.prevoir) sceneGuide = <SceneEnceinte n={1} T={300} V={20} Vmax={VMAX} montre={{}} anime={anime} flecheVitesse={reduit}/>;
    else if (idx === I.rho) sceneGuide = <SceneEnceinte n={1} T={298.15} V={20} Vmax={VMAX} Mg={44} P={1.0} montre={{ P: true }} anime={anime} flecheVitesse={reduit} aria="Une enceinte à piston contient du dioxyde de carbone sous 1,00 bar ; sa masse volumique est à calculer."/>;
  } else if (dd) {
    sceneGuide = <SceneEnceinte n={dd.n ?? 1} T={dd.type === 'etat' ? M.kelvin(dd.th1) : M.kelvin(dd.th)} V={dd.V} Vmax={Math.max(VMAX, dd.V)} Mg={dd.gaz ? dd.gaz.M : 28} montre={dd.type === 'etat' ? { n: true, V: true } : { V: true }} anime={anime} flecheVitesse={reduit}
      aria={dd.type === 'etat' ? 'Une enceinte rigide contient une quantité de gaz donnée dans l’énoncé.' : 'Une bouteille, schématisée par une enceinte, contient un gaz sous pression.'}/>;
  }
  const grapheLimites = enGuide && idx === I.limites && <GrapheReel n={1} T={293.15} vmax={1.0} pmax={120}/>;
  const controlesGuide = enGuide && idx >= I.chocs && idx <= I.equation && (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={titreCarte}>Réglages du gaz</div>
      {selectN(nG, setNG)}
      {idx >= I.agitation && selectTK(TG, setTG)}
      <button onClick={() => { setNG(1.0); setTG(300); }} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir (1,00 mol, 300 K)</button>
    </div>);
  const boxScene = (sceneGuide || grapheLimites) && (
    <div style={{ ...styleBoite, ...cadre('scene'), ...cadre('graphe') }}>
      {dd && <div style={aide}>{dd.type === 'etat' ? 'Schéma de l’enceinte (le piston est bloqué : le volume est constant). Les molécules sont dessinées de façon qualitative.' : 'Bouteille schématisée. Les molécules sont dessinées de façon qualitative.'}</div>}
      {sceneGuide}
      {grapheLimites}
    </div>);

  // ---------- exploration ----------
  const retablirEx = () => setEx(EX0);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Déplacez le piston (ou fixez la pression) avec le curseur et les boutons − / +, puis changez le gaz ou la température dans les rubriques ci-dessous.</div>
      {ex.mode === 'V'
        ? <Controle nom="Volume V" valeur={ex.V} min={2} max={VMAX} pas={1} pasBouton={1} onChange={V => setEx(s => ({ ...s, V }))} texte={`V = ${nbf(ex.V, 0)}${NB}L`} onRetablir={retablirEx} retablir="Tout rétablir"/>
        : <Controle nom="Pression P" valeur={Pex} min={Pmin} max={Pmaxi} pas={0.1} pasBouton={0.1} onChange={P => setEx(s => ({ ...s, P }))} texte={`P = ${nbf(Pex, 1)}${NB}bar`} onRetablir={retablirEx} retablir="Tout rétablir"/>}
      <Section titre={`Gaz : ${gazEx.nom.toLowerCase()} · ${nbf(ex.n, 2)} mol`} ouvert={ouv.gaz} onBascule={() => setOuv(o => ({ ...o, gaz: !o.gaz }))}>
        <div style={aide}>La nature du gaz fixe sa masse molaire M (donc ρ et la vitesse des molécules) ; la quantité de matière n fixe le nombre de molécules dessinées.</div>
        <label style={lblMenu}>Gaz<select value={ex.gaz} onChange={e => setEx(s => ({ ...s, gaz: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.GAZ.map(g => <option key={g.id} value={g.id}>{g.nom} (M = {nbf(g.M, 1)} g·mol⁻¹)</option>)}</select></label>
        {selectN(ex.n, n => setEx(s => ({ ...s, n })))}
      </Section>
      <Section titre={`Température : ${nbf(ex.th, 0)} °C = ${nbf(Tex, 2)} K`} ouvert={ouv.temp} onBascule={() => setOuv(o => ({ ...o, temp: !o.temp }))}>
        <div style={aide}>La température fixe l’agitation des molécules et, avec n et V, la pression.</div>
        {selectTh(ex.th, th => setEx(s => ({ ...s, th })))}
      </Section>
      <Section titre={ex.mode === 'V' ? 'Ce que je règle : le volume' : 'Ce que je règle : la pression'} ouvert={ouv.regle} onBascule={() => setOuv(o => ({ ...o, regle: !o.regle }))}>
        <div style={aide}>Volume réglé : le piston est bloqué, la pression s’en déduit. Pression réglée : le piston est libre, le volume s’adapte (V = n R T divisé par P).</div>
        <label style={lblMenu}>Grandeur réglée<select value={ex.mode} onChange={e => { const m = e.target.value; setEx(s => (m === 'P' ? { ...s, mode: 'P', P: Math.max(Pmin, Math.min(Pmaxi, Number(Pex.toFixed(1)))) } : { ...s, mode: 'V', V: Math.max(2, Math.min(VMAX, Math.round(Vex))) })); }} style={{ ...menu, marginTop: 2 }}><option value="V">Le volume V (piston bloqué)</option><option value="P">La pression P (piston libre)</option></select></label>
      </Section>
      <Section titre={ex.comparer ? `Comparer avec une 2ᵉ température : ${nbf(ex.th2, 0)} °C` : 'Comparer avec une 2ᵉ température'} ouvert={ouv.comp} onBascule={() => setOuv(o => ({ ...o, comp: !o.comp }))}>
        <div style={aide}>Affiche sur le graphique une 2ᵉ isotherme (courbe P(V) à température constante) pour la même quantité de gaz.</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex.comparer} onChange={e => setEx(s => ({ ...s, comparer: e.target.checked }))} style={{ width: 20, height: 20 }}/>Afficher la 2ᵉ isotherme</label>
        {ex.comparer && selectTh(ex.th2, th2 => setEx(s => ({ ...s, th2 })), '2ᵉ température')}
      </Section>
    </div>);
  const sceneEx = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>Un gaz enfermé sous un piston : les chocs des molécules sur le piston (traits orange) créent la pression lue sur le manomètre.</div>
      <SceneEnceinte n={ex.n} T={Tex} V={Vex} Vmax={VMAX} Mg={gazEx.M} P={Pex} montre={{ n: true, T: true, V: true, P: true }} anime={anime} flecheVitesse={reduit}/>
    </div>);
  const courbesEx = [{ T: Tex, nom: `${nbf(Tex, 0)} K` }, ...(ex.comparer ? [{ T: M.kelvin(ex.th2), nom: `${nbf(M.kelvin(ex.th2), 0)} K`, trait: 'tirets' }] : [])];
  const grapheEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Pression en fonction du volume (à T constante)</div>
      <div style={aide}>Le point rouge est l’état actuel du gaz : il suit la courbe quand le volume change.</div>
      <GrapheIsothermes n={ex.n} courbes={courbesEx} point={{ V: Vex, P: Pex }} vmax={VMAX}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Calculées avec P × V = n × R × T pour l’état actuel.</div>
      <LigneMesure nom="Pression P" valeur={`${nbf(Pex, 2)}${NB}bar (${sciPa(M.bar_Pa(Pex))})`} couleur={BLEU}/>
      <LigneMesure nom="Volume V" valeur={`${nbf(Vex, 1)}${NB}L (${nbf(M.L_m3(Vex), 4)}${NB}m³)`}/>
      <LigneMesure nom="Température T" valeur={`${nbf(Tex, 2)}${NB}K (${nbf(ex.th, 0)}${NB}°C)`}/>
      <LigneMesure nom="Quantité de matière n" valeur={`${nbf(ex.n, 2)}${NB}mol`}/>
      <LigneMesure nom="Masse volumique ρ" valeur={`${nbf(rhoEx, 2)}${NB}kg·m⁻³`} couleur="#b45309"/>
      <LigneMesure nom="Produit P × V" valeur={`${nbf(M.bar_Pa(Pex) * M.L_m3(Vex), 0)}${NB}J (= n R T)`}/>
      <LigneMesure nom="Vitesse quadratique (ordre de grandeur)" valeur={`${nbf(vqEx, 0)}${NB}m·s⁻¹`}/>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>La vitesse quadratique ({eVq}) donne l’ordre de grandeur de la vitesse des molécules ; son expression n’est pas à connaître.</div>
    </div>);
  // gaz réel : mini-simulation autonome (CO₂, 1,00 mol)
  const TreelK = M.kelvin(ex.reelTh), Vr = ex.reelV, nR = 1.0;
  const Pid = M.Pa_bar(M.pression(nR, TreelK, M.L_m3(Vr))), Pre = M.Pa_bar(M.pressionReelle(nR, TreelK, M.L_m3(Vr)));
  const satR = M.volumesSaturation(TreelK);
  const etatR = satR ? (Vr / nR * 1e-3 < satR.liquide ? 'liquide (très peu compressible)' : Vr / nR * 1e-3 <= satR.gaz ? 'gaz et liquide coexistent (liquéfaction)' : 'gaz') : 'gaz (au-dessus de 31 °C, pas de liquéfaction par compression)';
  const reelEx = enExplore && (
    <Section titre="Comparer avec un gaz réel (CO₂)" ouvert={ouv.reel} onBascule={() => setOuv(o => ({ ...o, reel: !o.reel }))}>
      <div style={aide}>Trait plein : gaz parfait. Tirets : valeurs fournies pour le gaz réel (allure qualitative, valeurs approchées : palier vers 64 bar ici, environ 57 bar mesurés à 20 °C ; le volume du liquide est surestimé). Choisissez une température et faites varier le volume.</div>
      <label style={lblMenu}>Température du dioxyde de carbone<select value={ex.reelTh} onChange={e => setEx(s => ({ ...s, reelTh: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{[20, 50, 100].map(v => <option key={v} value={v}>{v} °C ({nbf(M.kelvin(v), 2)} K)</option>)}</select></label>
      <Controle nom="Volume V" valeur={ex.reelV} min={0.1} max={1.0} pas={0.01} pasBouton={0.02} onChange={reelV => setEx(s => ({ ...s, reelV }))} texte={`V = ${nbf(ex.reelV, 2)}${NB}L`} onRetablir={() => setEx(s => ({ ...s, reelV: 0.5 }))} retablir="Rétablir (0,50 L)"/>
      <GrapheReel n={nR} T={TreelK} vmax={1.0} pmax={120} curseur={{ V: Vr, Pid, Pre }}/>
      <LigneMesure nom="Pression, gaz parfait" valeur={`${nbf(Pid, 1)}${NB}bar`} couleur={BLEU}/>
      <LigneMesure nom="Pression, gaz réel (valeur fournie)" valeur={`${nbf(Pre, 1)}${NB}bar`} couleur="#c2410c"/>
      <LigneMesure nom="Écart relatif : (P parfait − P réel) divisé par P réel" valeur={`${nbf(100 * (Pid - Pre) / Pre, 0)}${NB}%`}/>
      <LigneMesure nom="État du dioxyde de carbone" valeur={etatR}/>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec le volume réglé, doublez la quantité de gaz n : que devient la pression ? Et le nombre de chocs sur le piston ?</li>
        <li>Passez de 20 °C à 200 °C sans toucher au volume : la pression est-elle multipliée par 2 ? (Attention : la température doit être en kelvins.)</li>
        <li>Choisissez « Comparer avec une 2ᵉ température » : les deux isothermes se croisent-elles ? Laquelle est au-dessus ?</li>
        <li>Remplacez le diazote par l’hélium : que changent la masse volumique et la vitesse des molécules, à T et P fixées ?</li>
        <li>Avec le dioxyde de carbone à 20 °C, diminuez le volume jusqu’au palier : à quel volume la liquéfaction commence-t-elle ? Que se passe-t-il à 50 °C ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Pression : chocs des molécules sur les parois ; température : agitation des molécules</li>
          <li>Gaz parfait : points matériels, sans interaction, chocs élastiques (un modèle)</li>
          <li>Équation d’état : {eEtat} (SI : Pa, m³, mol, K ; R = 8,314 J·K⁻¹·mol⁻¹)</li>
          <li>Deux états, n constant : {eDeuxEtats} (T en kelvins)</li>
          <li>Masse volumique : {eRho} (M en kg·mol⁻¹)</li>
          <li>Limites : hautes pressions, basses températures (liquéfaction)</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .gpf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .gpf-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .gpf-col { display: flex; flex-direction: column; gap: 12px; }
        .gpf-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .gpf-l1.cote .gpf-carte { order: 2; } .gpf-l1.cote .gpf-main { order: 1; }
          .gpf-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .gpf-ex > * { grid-column: 1; } .gpf-ex > .gpf-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .gpf-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .gpf-in { animation: gpf-fondu 0.35s ease-out; } @keyframes gpf-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Gaz parfait : équation d’état et limites du modèle</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un gaz enfermé se décrit par sa pression, son volume, sa température et sa quantité de matière{(enGuide && !deja('equation')) ? '.' : <> : le modèle du gaz parfait les relie par l’équation {eEtat}.</>}</div>
      {!enExplore && <div className="gpf-l1 cote">
        {enGuide ? <div className="gpf-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="gpf-carte">{panneauHypo}</div> : null}
        <div className="gpf-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'etat' ? suiviE : suiviB}/></div>}
          <div className="gpf-col">
            {boxScene && <div className="gpf-in">{boxScene}</div>}
            {controlesGuide && <div className="gpf-in">{controlesGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="gpf-ex">
        <div>{sceneEx}</div>
        <div className="gpf-ctrl">{reglagesEx}</div>
        <div>{grapheEx}</div>
        <div>{mesuresEx}</div>
        <div>{reelEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
