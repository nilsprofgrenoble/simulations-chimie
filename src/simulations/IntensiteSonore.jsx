import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./isnModele";
import { QCM_PARCOURS as Q } from "./isnQcm";
import { SceneIntensite, SceneSon, GrapheNiveau, SvgCarteIntensite, SvgCarteNiveau, SvgCarteRegles, SvgCarteGeometrique, SvgCarteAbsorption, SvgCarteRepereNiveaux } from "./isnSchemas";

const SIM_ID = 211, CLE_GUIDE = 'isn-tg-guide-v1';
declarerDefis(SIM_ID, [['niveau', 'Niveau sonore derrière une paroi'], ['distance', 'Distance où le niveau atteint un seuil']]);

// ====================================================
// SIM 211 — INTENSITÉ SONORE, NIVEAU D'INTENSITÉ ET ATTÉNUATION (TG spé PC, « Ondes et signaux », « Caractériser les phénomènes ondulatoires »).
//  Une seule idée : passer de l'intensité au niveau (échelle logarithmique) et prévoir les atténuations géométrique et par absorption.
//  Capacités visées (jamais affichées à l'élève) : exploiter l'expression du niveau d'intensité sonore ; illustrer l'atténuation géométrique et
//  par absorption ; utiliser le logarithme décimal et sa fonction réciproque.
//  Hors périmètre : pondération A, réflexion, diffraction, somme de sources de niveaux différents, mesure au smartphone (2GT).
//  Modèle de calcul : isnModele.js (W, m, W·m⁻², dB).
// ====================================================

const nbf = M.nbf, sci = M.sci;
const nbd = d => (Number.isInteger(d) ? String(d) : nbf(d, 1));
const BLEU = '#0369a1', VERT = '#15803d', COL_OR = '#b45309';
const IDS = ['intensite', 'niveau', 'reciproque', 'double', 'sphere', 'distance', 'prediction', 'paroi', 'total', 'seuil', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
const P_GUIDE = 1.0e-4, L1M = M.niveauSource(P_GUIDE, 1);          // source du parcours : 1,0×10⁻⁴ W ; 69,0 dB à 1 m
const CLOISON = M.materiau('cloison'), P_CONCERT = 1;

// ---------- formules (MathML) ----------
const gros = { mathDepth: 1, mathStyle: 'normal' };
const I0 = <msub><mi>I</mi><mn>0</mn></msub>;
const fracIdI0 = <mfrac><mi>I</mi>{I0}</mfrac>;
const FI = <Formule><mi>I</mi><mo>=</mo><mfrac><mi>P</mi><mi>S</mi></mfrac></Formule>;
const FL = <Formule><mi>L</mi><mo>=</mo><mn>10</mn><mo>×</mo><mi>log</mi><mo>(</mo>{fracIdI0}<mo>)</mo></Formule>;
const FIrec = <Formule><mi>I</mi><mo>=</mo>{I0}<mo>×</mo><msup><mn>10</mn><mfrac style={gros}><mi>L</mi><mn>10</mn></mfrac></msup></Formule>;
const FSphere = <Formule><mi>I</mi><mo>=</mo><mfrac><mi>P</mi><mrow><mn>4</mn><mi>π</mi><msup><mi>d</mi><mn>2</mn></msup></mrow></mfrac></Formule>;
const FLl = <FormuleEnLigne><mi>L</mi><mo>=</mo><mn>10</mn><mo>×</mo><mi>log</mi><mo>(</mo>{fracIdI0}<mo>)</mo></FormuleEnLigne>;
const FIrecL = <FormuleEnLigne><mi>I</mi><mo>=</mo>{I0}<mo>×</mo><msup><mn>10</mn><mfrac style={gros}><mi>L</mi><mn>10</mn></mfrac></msup></FormuleEnLigne>;
const FGeoL = <FormuleEnLigne><mi>L</mi><mo>=</mo><msub><mi>L</mi><mn>1</mn></msub><mo>−</mo><mn>20</mn><mo>×</mo><mi>log</mi><mo>⁡</mo><mi>d</mi></FormuleEnLigne>;
const FAbs = <FormuleEnLigne><mi>A</mi><mo>=</mo><msub><mi>L</mi><mtext>entrée</mtext></msub><mo>−</mo><msub><mi>L</mi><mtext>sortie</mtext></msub></FormuleEnLigne>;
const FTot = <FormuleEnLigne><msub><mi>A</mi><mtext>tot</mtext></msub><mo>=</mo><msub><mi>A</mi><mtext>géo</mtext></msub><mo>+</mo><msub><mi>A</mi><mtext>abs</mtext></msub></FormuleEnLigne>;
const FSphereL = <FormuleEnLigne><mi>I</mi><mo>=</mo><mfrac><mi>P</mi><mrow><mn>4</mn><mi>π</mi><msup><mi>d</mi><mn>2</mn></msup></mrow></mfrac></FormuleEnLigne>;
const p10 = e => <FormuleEnLigne><msup><mn>10</mn><mn>{e}</mn></msup></FormuleEnLigne>;           // puissance de 10 écrite avec un vrai exposant (e : texte)
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// contrôle de la distance : curseur sur une liste de valeurs + boutons − / + + Rétablir (un doigt ne vise pas un cran)
function ControleDistance({ valeur, liste, onChange, defaut, nom = 'Distance d de la source au sonomètre' }) {
  const k = Math.max(0, liste.indexOf(valeur));
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt }}>d = {nbd(valeur)}{NB}m</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label="Rapprocher le sonomètre" onClick={() => onChange(liste[Math.max(0, k - 1)])} style={btn}>−</button>
        <input type="range" min={0} max={liste.length - 1} step={1} value={k} onChange={e => onChange(liste[Number(e.target.value)])} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label="Éloigner le sonomètre" onClick={() => onChange(liste[Math.min(liste.length - 1, k + 1)])} style={btn}>+</button>
      </div>
      <div style={{ marginTop: 6 }}><button onClick={() => onChange(defaut)} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir (d = {nbd(defaut)}{NB}m)</button></div>
    </div>);
}

export function SimulationIntensiteSonore() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviN, noterN] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('niveau');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ source: false, paroi: false, graphe: false, essayer: false, retenir: false });
  const [dG, setDG] = useState(1);                                                                   // parcours : distance du sonomètre (étape « doubler la distance »)
  const [ex, setEx] = useState({ src: 'conv', d: 4, mat: 'aucun', dMur: 2, cmp: false, dB: 8, axe: 'lin' });   // exploration
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- étapes du parcours ----------
  const L2m = M.niveauSource(P_GUIDE, 2), L8m = M.niveauSource(P_GUIDE, 8), L4cl = M.niveauAvecParoi(P_GUIDE, 4, 2, CLOISON.A);
  const I85 = M.intensiteDepuisNiveau(85), dSeuil = M.distanceSeuil(P_CONCERT, 85);
  const ETAPES = [
    { id: 'intensite', titre: 'L’intensité sonore : puissance par mètre carré', focus: ['scene'],
      texte: <>Une source sonore émet une puissance acoustique P. Cette puissance traverse une surface S perpendiculaire à la direction de propagation. L’<strong>intensité sonore</strong> I est la puissance reçue par unité de surface :{FI}Elle s’exprime en W·m⁻² (watt par mètre carré). Ici, P = {sci(2e-5)}{NB}W et S = 0,50{NB}m².</>,
      tache: { type: 'num', q: 'Intensité sonore I, en W·m⁻² (2 chiffres significatifs ; l’écriture 4e-5 est acceptée)', unite: 'W·m⁻²', vrai: 4e-5, tol: 0.05, affiche: v => sci(v, 1), carnet: 'Intensité sonore I',
        calcul: () => ['I = frac(P|S) avec P = 2,0×10⁻⁵ W et S = 0,50 m².', 'I = frac(2,0×10⁻⁵ W|0,50 m²) = 4,0×10⁻⁵ W·m⁻².'],
        pieges: [[1e-5, 'Vous avez multiplié P par S : l’intensité est la puissance divisée par la surface, I = frac(P|S).'], [25000, 'Le rapport est inversé : I = frac(P|S), la puissance divisée par la surface.'], [2e-5, 'Vous avez oublié de diviser par S : la même puissance, étalée sur 0,50 m², donne une intensité plus grande que P.']],
        expl: 'I = frac(P|S) = frac(2,0×10⁻⁵ W|0,50 m²) = 4,0×10⁻⁵ W·m⁻² : valeur très inférieure à 1 W·m⁻², donc un son très faible.',
        indice: 'I est la puissance P divisée par la surface S : W divisés par m² donnent des W·m⁻². Pensez à la puissance de 10 dans le résultat.' } },
    { id: 'niveau', titre: 'Le niveau d’intensité sonore', focus: ['scene'],
      retenirTitre: 'L’intensité sonore',
      retenir: <>
        <SvgCarteIntensite/>
        <ul style={ULS}>
          <li>L’<strong>intensité sonore</strong> est la puissance reçue par unité de surface : {FI}</li>
          <li>Elle s’exprime en <strong>W·m⁻²</strong>. Seuil d’audibilité : <strong>I₀ = 1,0×10⁻¹² W·m⁻²</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« I = puissance par mètre carré »</strong>. Idée fausse : « l’intensité est la puissance de la source ». Vrai : c’est la puissance reçue par m², elle dépend de l’endroit où l’on écoute.</li>
        </ul></>,
      texte: <>L’oreille perçoit des intensités qui s’étendent sur douze puissances de 10 : on utilise donc une échelle logarithmique. Le <strong>niveau d’intensité sonore</strong> L, en décibels (dB), se calcule avec la formule suivante, qui est donnée :{FL}Ici log est le logarithme décimal et I₀ = 1,0×10⁻¹²{NB}W·m⁻² est l’intensité de référence (seuil d’audibilité). Reprenons l’intensité trouvée : I = {sci(4e-5)}{NB}W·m⁻².</>,
      tache: { type: 'num', q: 'Niveau d’intensité sonore L, en dB (2 chiffres significatifs)', unite: 'dB', vrai: M.niveau(4e-5), tol: 0.015, affiche: v => nbf(v, 1), cs: 2, carnet: 'Niveau L pour I = 4,0×10⁻⁵ W·m⁻²',
        calcul: () => ['frac(I|I₀) = frac(4,0×10⁻⁵ W·m⁻²|1,0×10⁻¹² W·m⁻²) = 4,0×10⁷ (sans unité).', 'log(4,0×10⁷) = log 4,0 + 7 = 0,60 + 7 = 7,60.', 'L = 10 × 7,60 = 76 dB.'],
        pieges: [[10 * Math.log10(4e-5), 'Vous avez oublié de diviser I par I₀ : on prend le logarithme du rapport frac(I|I₀).'], [7.6, 'Vous avez oublié le facteur 10 devant le logarithme : L = 10 × log(frac(I|I₀)).'], [175.0, 'Vous avez utilisé le logarithme népérien (touche ln) : ici log est le logarithme décimal (touche log).']],
        expl: 'frac(I|I₀) = 4,0×10⁷, log(4,0×10⁷) = 7,60 et L = 10 × 7,60 = 76 dB : un son de niveau moyen, comparable à celui d’une rue animée.',
        indice: 'Calculez d’abord le rapport frac(I|I₀) (une puissance de 10), puis son logarithme décimal (touche log), puis multipliez par 10.' } },
    { id: 'reciproque', titre: 'Retrouver l’intensité à partir du niveau', focus: ['scene'],
      texte: <>La fonction réciproque du logarithme décimal est la fonction « 10 puissance » : si y = log x, alors x = 10<sup>y</sup>. En isolant I dans la formule du niveau, on obtient :{FIrec}Un sonomètre placé devant une enceinte indique L = 85{NB}dB, niveau à partir duquel la durée d’exposition doit être limitée.</>,
      tache: { type: 'num', q: 'Intensité sonore I correspondant à 85 dB, en W·m⁻² (2 chiffres significatifs)', unite: 'W·m⁻²', vrai: I85, tol: 0.07, affiche: v => sci(v, 1), carnet: 'Intensité sonore à 85 dB',
        calcul: () => ['frac(L|10) = frac(85|10) = 8,5.', <>{p10('8,5')} = 3,2×10⁸ (touche 10ˣ de la calculatrice).</>, <>I = I₀ × {p10('8,5')} = 1,0×10⁻¹² × 3,2×10⁸ = 3,2×10⁻⁴ W·m⁻².</>],
        pieges: [[3.1623e8, 'Vous avez oublié de multiplier par I₀ = 1,0×10⁻¹² W·m⁻² : 10 puissance 8,5 est le rapport frac(I|I₀), pas I.'], [1e-12 * Math.pow(10, 85 / 20), 'L’exposant est frac(L|10) (et non frac(L|20)) pour une intensité : 85 divisé par 10 donne 8,5.'], [8.5e-11, 'Vous avez multiplié I₀ par 85 : il faut multiplier I₀ par 3,2×10⁸ (c’est 10 élevé à la puissance 8,5, le rapport frac(I|I₀)).']],
        expl: <>I = I₀ × {p10('8,5')} = 1,0×10⁻¹² × 3,2×10⁸ = 3,2×10⁻⁴ W·m⁻² : 85 dB correspondent à une intensité environ 3×10⁸ fois celle du seuil d’audibilité.</>,
        indice: 'Divisez L par 10, élevez 10 à cette puissance (touche 10ˣ), puis multipliez par I₀.' } },
    { id: 'double', titre: 'Doubler l’intensité : que devient le niveau ?', focus: ['scene'],
      retenirTitre: 'Niveau d’intensité et logarithme',
      retenir: <>
        <SvgCarteNiveau/>
        <ul style={ULS}>
          <li>{FL}{FIrec}</li>
          <li><strong>log</strong> est le logarithme décimal : log(10ⁿ) = n ; sa réciproque est la fonction « 10 puissance ».</li>
          <li>Repères : I₀ donne <strong>0 dB</strong> ; I = 10⁻⁹ W·m⁻² donne <strong>30 dB</strong> ; I = 1 W·m⁻² donne <strong>120 dB</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« le décibel compte les puissances de 10 »</strong>. Idée fausse : « L est proportionnel à I ». Vrai : L varie comme le logarithme de I.</li>
        </ul></>,
      texte: <>En un point d’écoute, l’intensité sonore est I₁ = {sci(1e-6)}{NB}W·m⁻². On double l’intensité : I₂ = {sci(2e-6)}{NB}W·m⁻². Calculez les niveaux L₁ et L₂ avec la formule, puis leur écart ΔL = L₂ − L₁.</>,
      tache: { type: 'num', q: 'Augmentation du niveau ΔL = L₂ − L₁, en dB (2 chiffres significatifs)', unite: 'dB', vrai: M.variationNiveau(2), tol: 0.05, affiche: v => nbf(v, 1), carnet: 'Augmentation de L quand I est doublée',
        calcul: () => ['L₁ = 10 × log(frac(1,0×10⁻⁶|1,0×10⁻¹²)) = 10 × log(10⁶) = 60 dB.', 'L₂ = 10 × log(frac(2,0×10⁻⁶|1,0×10⁻¹²)) = 10 × log(2,0×10⁶) = 10 × 6,30 = 63 dB.', 'ΔL = 63,0 − 60,0 = 3,0 dB (en fait 10 × log 2 = 3,01 dB, quelle que soit l’intensité de départ).'],
        pieges: [[6.02, 'Vous avez utilisé 20 au lieu de 10 : pour une intensité, L = 10 × log(frac(I|I₀)).'], [0.3, 'Vous avez oublié le facteur 10 : ΔL = 10 × log 2.'], [10, 'Une augmentation de 10 dB correspond à une intensité multipliée par 10, pas par 2.'], [30, 'Vous avez calculé 10 × log 1000 : doubler l’intensité, c’est multiplier par 2 (et non par 1 000).']],
        expl: 'ΔL = L₂ − L₁ = 10 × log(frac(I₂|I₀)) − 10 × log(frac(I₁|I₀)) = 10 × log(frac(I₂|I₁)) = 10 × log 2 = 3,0 dB : doubler l’intensité ajoute toujours 3 dB.',
        indice: 'Calculez L₁ puis L₂ avec la formule, ou utilisez le fait que log a − log b = log de frac(a|b) : ΔL = 10 × log(frac(I₂|I₁)).' } },
    { id: 'sphere', titre: 'Source ponctuelle : l’intensité diminue avec la distance', focus: ['scene'],
      retenirTitre: 'Les règles du décibel',
      retenir: <>
        <SvgCarteRegles/>
        <ul style={ULS}>
          <li>Intensité <strong>× 2</strong> : le niveau gagne <strong>3 dB</strong> (10 × log 2 ≈ 3,0). Intensité <strong>× 10</strong> : le niveau gagne <strong>10 dB</strong> (10 × log 10 = 10).</li>
          <li>Moyen de s’en souvenir : <strong>« × 2, + 3 dB ; × 10, + 10 dB »</strong>. Idée fausse : « si l’intensité double, le niveau double ». Vrai : il augmente seulement de 3 dB.</li>
        </ul></>,
      texte: <>Une source ponctuelle envoie le même son dans toutes les directions (source isotrope). À la distance d, sa puissance P est répartie sur une sphère de surface 4π d², donc :{FSphere}La source du parcours émet P = {sci(P_GUIDE)}{NB}W (une voix forte, en champ libre). Le sonomètre est placé à d = 2,0{NB}m.</>,
      tache: { type: 'num', q: 'Intensité sonore I à d = 2,0 m, en W·m⁻² (2 chiffres significatifs)', unite: 'W·m⁻²', vrai: M.intensiteSphere(P_GUIDE, 2), tol: 0.05, affiche: v => sci(v, 1), carnet: 'Intensité à 2,0 m',
        calcul: () => ['S = 4π d² = 4π × (2,0 m)² = 50 m².', 'I = frac(P|S) = frac(1,0×10⁻⁴ W|50 m²) = 2,0×10⁻⁶ W·m⁻².'],
        pieges: [[P_GUIDE / 4, 'Vous avez oublié le facteur 4π : la surface de la sphère est 4π d², pas d².'], [P_GUIDE / (4 * Math.PI * 2), 'La surface de la sphère varie comme d² (le carré de la distance), pas comme d.'], [P_GUIDE / (Math.PI * 4), 'Vous avez oublié de diviser par d² : la surface de la sphère est 4π d², pas 4π.']],
        expl: 'S = 4π d² = 4π × 2,0² = 50 m² ; I = frac(P|S) = frac(1,0×10⁻⁴|50) = 2,0×10⁻⁶ W·m⁻².',
        indice: 'Calculez d’abord la surface S = 4π d² (d en m, S en m²), puis I = frac(P|S).' } },
    { id: 'distance', titre: 'Doubler la distance', focus: ['scene', 'curseurs', 'mesures'],
      texte: <>Le sonomètre affiche maintenant l’intensité I et le niveau L à la distance d choisie (valeurs du modèle, calculées pour la même source, P = {sci(P_GUIDE)}{NB}W). Placez-le à 1{NB}m, à 2{NB}m puis à 4{NB}m et comparez les niveaux lus.</>,
      tache: { type: 'qcm', q: 'Chaque fois que la distance d double, le niveau L…', options: Q.distance.options, bonne: 0,
        expl: 'À chaque doublement de d, la surface 4π d² est multipliée par 4 : l’intensité est divisée par 4 et le niveau diminue de 10 × log 4 = 6,0 dB (69, 63, 57 dB à 1, 2, 4 m). 3 dB correspond à une intensité divisée par 2, pas par 4 ; « divisé par deux » confond le niveau et l’intensité ; 12 dB correspondrait à deux doublements de la distance, de 1 m à 4 m.',
        indice: 'Relevez L pour d = 1 m, 2 m et 4 m : de combien de dB baisse-t-il à chaque fois ?' } },
    { id: 'prediction', titre: 'Prévoir le niveau plus loin', focus: ['scene'],
      texte: <>Le niveau à 1,0{NB}m de la source vaut {nbf(L1M, 1)}{NB}dB. Sans refaire tout le calcul, prévoyez le niveau à d = 8,0{NB}m : l’affichage du sonomètre est masqué.</>,
      tache: { type: 'num', q: 'Niveau L à d = 8,0 m, en dB (2 chiffres significatifs)', unite: 'dB', vrai: L8m, tol: 0.03, affiche: v => nbf(v, 1), cs: 2, carnet: 'Niveau à 8,0 m',
        calcul: () => ['De 1 m à 8 m, la distance double trois fois (1 → 2 → 4 → 8).', 'Chaque doublement retire 6,0 dB : 3 × 6,0 = 18 dB.', 'L = 69,0 − 18 = 51 dB (avec la formule : 69,0 − 20 × log 8 = 50,9 dB).'],
        pieges: [[M.niveauSource(P_GUIDE, 2), 'Un seul doublement : de 1 m à 8 m, la distance double trois fois (1, 2, 4, 8).'], [M.niveauSource(P_GUIDE, 4), 'Deux doublements seulement : de 1 m à 8 m, il y en a trois.'], [L1M - 9, 'Vous avez retiré 3 dB par doublement : doubler la distance divise l’intensité par 4, soit 6 dB.'], [L1M / 8, 'Le niveau n’est pas divisé par 8 : c’est l’intensité qui est divisée par 64 ; le niveau diminue de 6 dB par doublement.']],
        expl: 'Trois doublements de la distance : L = 69,0 − 3 × 6,0 = 51 dB. La formule exacte, L(d) = L(1 m) − 20 × log d, donne 69,0 − 20 × log 8 = 50,9 dB.',
        indice: 'Combien de fois la distance a-t-elle doublé entre 1 m et 8 m ? À chaque doublement, de combien de dB le niveau baisse-t-il ?' } },
    { id: 'paroi', titre: 'L’atténuation par une paroi', focus: ['scene'],
      retenirTitre: 'L’atténuation géométrique',
      retenir: <>
        <SvgCarteGeometrique/>
        <ul style={ULS}>
          <li>Source ponctuelle isotrope : {FSphere}</li>
          <li>Distance <strong>doublée</strong> : intensité <strong>4 fois plus petite</strong>, niveau <strong>6 dB de moins</strong>. En général, à la distance d (en m) : {FGeoL} où L₁ est le niveau à 1 m de la source.</li>
          <li>Moyen de s’en souvenir : <strong>« distance double, 6 dB de moins »</strong>. Idée fausse : « à distance double, le niveau est divisé par 2 ». Vrai : il baisse de 6 dB.</li>
          <li>Hypothèse : champ libre, sans mur ni sol qui réfléchit le son.</li>
        </ul></>,
      texte: <>Une paroi absorbe une partie de l’énergie sonore : le niveau chute quand le son la traverse. Pour la même source (P = {sci(P_GUIDE)}{NB}W), deux sonomètres mesurent le niveau juste avant et juste après une cloison en plâtre (valeurs fictives, à titre d’exemple) placée à 2,0{NB}m de la source. L’<strong>atténuation par absorption</strong> A est l’écart entre ces deux niveaux, en dB.</>,
      tache: { type: 'num', q: 'Atténuation A de la cloison, en dB (2 chiffres significatifs)', unite: 'dB', vrai: CLOISON.A, tol: 0.03, affiche: v => nbf(v, 0), cs: 2, carnet: 'Atténuation de la cloison',
        calcul: () => ['Niveau juste avant la cloison : L(entrée) = 63,0 dB ; niveau juste après : L(sortie) = 28,0 dB.', 'A = L(entrée) − L(sortie) = 63,0 − 28,0 = 35 dB.'],
        pieges: [[63 + 28, 'On calcule un écart entre les deux niveaux, pas une somme : A = L(entrée) − L(sortie).'], [28 - 63, 'L’atténuation est positive : on retire la valeur « après » de la valeur « avant » (A = L(entrée) − L(sortie)).'], [63 / 28, 'Un rapport de niveaux n’a pas de sens ici : en dB, une atténuation se calcule par une différence.']],
        expl: 'A = L(entrée) − L(sortie) = 63,0 − 28,0 = 35 dB : la cloison retire 35 dB, soit une intensité divisée par plus de 3 000.',
        indice: 'Lisez les deux niveaux sur les sonomètres : A est leur écart, avant moins après.' } },
    { id: 'total', titre: 'Atténuations géométrique et par absorption', focus: ['scene'],
      texte: <>Même source (P = {sci(P_GUIDE)}{NB}W, niveau {nbf(L1M, 1)}{NB}dB à 1,0{NB}m) et même cloison en plâtre à 2,0{NB}m, d’atténuation A = {CLOISON.A}{NB}dB (valeur fictive, à titre d’exemple). Un sonomètre est placé derrière la cloison, à d = 4,0{NB}m de la source. En dB, les atténuations s’ajoutent : le niveau est celui à 1,0{NB}m moins l’atténuation géométrique (de 1,0{NB}m à 4,0{NB}m) moins l’atténuation par absorption.</>,
      tache: { type: 'num', q: 'Niveau L à 4,0 m, derrière la cloison, en dB (2 chiffres significatifs)', unite: 'dB', vrai: L4cl, tol: 0.04, affiche: v => nbf(v, 0), cs: 2, carnet: 'Niveau derrière la cloison à 4,0 m',
        calcul: () => ['De 1 m à 4 m, la distance double deux fois : atténuation géométrique 2 × 6,0 = 12 dB (formule : 20 × log 4 = 12,0 dB).', 'Atténuation totale : 12,0 + 35 = 47 dB.', 'L = 69,0 − 47 = 22 dB.'],
        pieges: [[L1M - CLOISON.A, 'Vous avez oublié l’atténuation géométrique : de 1 m à 4 m, le niveau baisse déjà de 12 dB.'], [M.niveauSource(P_GUIDE, 4), 'Vous avez oublié la cloison : elle retire encore A = 35 dB.'], [L1M - CLOISON.A - 6, 'De 1 m à 4 m, la distance double deux fois (et non une) : l’atténuation géométrique est 12 dB.'], [L1M * CLOISON.A / 100, 'Les atténuations en dB s’additionnent et se retirent du niveau ; elles ne se multiplient pas.']],
        expl: 'Atténuation géométrique : 20 × log 4 = 12,0 dB ; absorption : 35 dB ; total : 47 dB. L = 69,0 − 47 = 22 dB, un niveau proche de celui d’une pièce très calme.',
        indice: 'Atténuation géométrique de 1 m à 4 m (deux doublements de d), puis ajoutez l’atténuation de la cloison, puis retirez le total du niveau à 1 m.' } },
    { id: 'seuil', titre: 'Jusqu’où l’exposition prolongée est-elle déconseillée ?', focus: ['scene'],
      retenirTitre: 'Absorption et atténuation totale',
      retenir: <>
        <SvgCarteAbsorption/>
        <ul style={ULS}>
          <li><strong>Atténuation par absorption</strong> : {FAbs}, niveaux mesurés juste avant et juste après la paroi. Elle dépend du matériau.</li>
          <li>En dB, les atténuations <strong>s’additionnent</strong> : {FTot} (A<sub>géo</sub> : atténuation géométrique ; A<sub>abs</sub> : par absorption).</li>
          <li>Moyen de s’en souvenir : <strong>« en dB, on additionne les atténuations »</strong>. Idée fausse : « on multiplie les atténuations ». Vrai : on additionne les dB (on multiplierait les rapports d’intensité).</li>
        </ul></>,
      texte: <>Une enceinte de concert (source ponctuelle de puissance acoustique P = {sci(P_CONCERT)}{NB}W, en champ libre, sans paroi) fonctionne à pleine puissance. Au-delà de 85{NB}dB, l’exposition prolongée est déconseillée. À l’étape 3, vous avez trouvé qu’un niveau de 85{NB}dB correspond à une intensité I = {sci(I85)}{NB}W·m⁻². À quelle distance minimale d faut-il se placer pour que le niveau ne dépasse pas 85{NB}dB ?</>,
      tache: { type: 'num', q: 'Distance d minimale, en m (2 chiffres significatifs)', unite: 'm', vrai: dSeuil, tol: 0.06, affiche: v => nbf(v, 1), carnet: 'Distance où L = 85 dB',
        calcul: () => ['I = frac(P|4π d²) donc d² = frac(P|4π I) = frac(1,0 W|4π × 3,2×10⁻⁴ W·m⁻²) = 2,5×10² m².', 'd = √(2,5×10²) = 16 m.', <>Autre voie : L(1 m) = 109 dB, il faut perdre 24 dB : 20 × log d = 24, donc d = {p10('1,2')} = 16 m.</>],
        pieges: [[P_CONCERT / (4 * Math.PI * I85), 'Vous avez oublié la racine carrée : le calcul donne d², et la distance est d = √(d²).'], [Math.sqrt(P_CONCERT / (2 * Math.PI * I85)), 'La surface de la sphère est 4π d², pas 2π d².'], [Math.sqrt(P_CONCERT / (4 * Math.PI * I85)) * 4 * Math.PI, 'Revoyez l’isolement de d : d² = frac(P|4π I), puis d = √(d²).']],
        expl: 'd² = frac(P|4π I) = frac(1,0|4π × 3,2×10⁻⁴) = 2,5×10² m² : d = 16 m. Par un autre calcul, L(1 m) = 109 dB et 20 × log d = 24 dB donnent aussi d = 16 m. Au-delà de 85 dB, il faut limiter la durée d’exposition ou se protéger.',
        indice: 'Isolez d dans I = frac(P|4π d²) : d² = frac(P|4π I), puis prenez la racine carrée. Utilisez I = 3,2×10⁻⁴ W·m⁻².' } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'Repères de niveau et sécurité auditive',
      retenir: <>
        <SvgCarteRepereNiveaux/>
        <ul style={ULS}>
          <li>Repères (ordres de grandeur, à ± 10 dB) : conversation <strong>60 dB</strong>, seuil de douleur <strong>120 dB</strong>.</li>
          <li>À partir de <strong>85 dB</strong>, la durée d’exposition doit être limitée : s’éloigner de la source ou se protéger.</li>
          <li>Trois réflexes : {FLl} ; intensité × 2 : + 3 dB ; distance × 2 : − 6 dB.</li>
        </ul></>,
      texte: <>Vous savez passer de l’intensité au niveau d’intensité sonore et inversement avec le logarithme décimal et sa réciproque, utiliser les règles « I × 2 : + 3 dB » et « I × 10 : + 10 dB », et prévoir l’atténuation géométrique (distance double : − 6 dB) et l’atténuation par absorption d’une paroi (en dB, on additionne). Passez à l’exploration (source, distance, paroi) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'niveau' ? { ...M.tirageNiveau(), type, rep: '', rep2: '', verifie: false } : { ...M.tirageDistance(), type, rep: '', rep2: '', verifie: false });
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const TOL = { niveau: [0.05, 0.05], distance: [0.08, 0.05] };
  const vraiDefi = d => (d.type === 'niveau' ? [d.L1, d.L2] : [d.d, d.I]);
  const verifier = () => {
    const [t1, t2] = TOL[defi.type], [v1, v2] = vraiDefi(defi), x1 = lireNombre(defi.rep), x2 = lireNombre(defi.rep2);
    const ok1 = isFinite(x1) && Math.abs(x1 - v1) <= t1 * Math.abs(v1), ok2 = isFinite(x2) && Math.abs(x2 - v2) <= t2 * Math.abs(v2), ok = ok1 && ok2;
    setDefi(d => ({ ...d, verifie: true, ok, ok1, ok2, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'niveau' ? noterN : noterD)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite, ok) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{aria} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('isn-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const revele = defi && (defi.ok || (defi.essais || 0) >= 3);
  const corrige = defi && (defi.type === 'niveau'
    ? <>Sans paroi : I = frac(P|4π d²) = {sci(M.intensiteSphere(defi.P, defi.d), 1)} W·m⁻², donc L = 10 × log(frac(I|I₀)) = {nbf(defi.L1, 1)} dB (autre voie : {nbf(M.niveauSource(defi.P, 1), 1)} dB à 1 m moins 20 × log {defi.d} = {nbf(20 * Math.log10(defi.d), 1)} dB). Avec la paroi : {nbf(defi.L1, 1)} − {defi.A} = {nbf(defi.L2, 1)} dB (marge acceptée : 5 %).</>
    : <>I = I₀ × {p10(nbf(defi.Ls / 10, 1))} = {sci(defi.I, 2)} W·m⁻², puis d² = frac(P|4π I), d = {nbf(defi.d, 1)} m (marge acceptée : 8 %) ; l’intensité à cette distance vaut {sci(defi.I, 2)} W·m⁻² (marge acceptée : 5 %).</>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['niveau', 'Niveau derrière une paroi'], ['distance', 'Distance de seuil']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'niveau' ? 'Défi : quel niveau sonore derrière la paroi ?' : 'Défi : à quelle distance le niveau tombe-t-il au seuil ?'}</div>
      {defi.type === 'niveau' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une source ponctuelle de puissance acoustique <strong>P = {sci(defi.P)}{NB}W</strong> émet en champ libre. Un sonomètre est placé à <strong>d = {defi.d}{NB}m</strong> de la source. Une paroi (<strong>{defi.mat.nom.toLowerCase()}</strong>, atténuation <strong>A = {defi.A}{NB}dB</strong>, valeur fournie, fictive) est placée à {defi.dp}{NB}m de la source, entre la source et le sonomètre. Donnez vos résultats en dB, avec 2 chiffres significatifs (marge acceptée : 5{NB}%).</div>
        <div style={{ ...lbl, margin: '0 0 4px' }}><strong>Question 1.</strong> Quel serait le niveau L au sonomètre <strong>sans la paroi</strong> ?</div>
        {champ('L sans paroi', 'rep', 'dB', defi.ok1)}
        <IndiceDefi cache={false}>Intensité à d : {FSphereL} ; puis {FLl} avec I₀ = 1,0×10⁻¹² W·m⁻². Ou bien L = L₁ − 20 × log d, où L₁ est le niveau à 1 m.</IndiceDefi>
        <div style={{ ...lbl, margin: '8px 0 4px' }}><strong>Question 2.</strong> Quel est le niveau L au sonomètre <strong>avec la paroi</strong> ?</div>
        {champ('L avec paroi', 'rep2', 'dB', defi.ok2)}
        <IndiceDefi cache={false}>En dB, les atténuations s’additionnent : retirez l’atténuation A de la paroi au niveau trouvé à la question 1.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une source ponctuelle de puissance acoustique <strong>P = {sci(defi.P)}{NB}W</strong> émet en champ libre, sans paroi. On cherche la distance à laquelle le niveau d’intensité sonore vaut <strong>L = {defi.Ls}{NB}dB</strong>. Écriture scientifique acceptée (par exemple 3,2e-4).</div>
        <div style={{ ...lbl, margin: '0 0 4px' }}><strong>Question 1.</strong> À quelle distance d de la source le niveau vaut-il {defi.Ls}{NB}dB ? (2 chiffres significatifs, marge acceptée : 8{NB}%)</div>
        {champ('d', 'rep', 'm', defi.ok1)}
        <IndiceDefi cache={false}>Passez par l’intensité : {FIrecL}, puis d² = frac(P|4π I) et d = √(d²). Autre voie : L = L₁ − 20 × log d, où L₁ est le niveau à 1 m.</IndiceDefi>
        <div style={{ ...lbl, margin: '8px 0 4px' }}><strong>Question 2.</strong> Quelle est l’intensité sonore I à cette distance ? (2 chiffres significatifs, marge acceptée : 5{NB}%)</div>
        {champ('I', 'rep2', 'W·m⁻²', defi.ok2)}
        <IndiceDefi cache={false}>La fonction réciproque du logarithme : {FIrecL}, avec I₀ = 1,0×10⁻¹² W·m⁻².</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="isn-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : `✗ Pas tout à fait (question 1 : ${defi.ok1 ? 'juste' : 'à revoir'} ; question 2 : ${defi.ok2 ? 'juste' : 'à revoir'}). `}
        {revele ? indicesProfond(corrige) : 'Relisez la formule, les unités et l’ordre de grandeur, puis vérifiez à nouveau (l’indice peut vous aider). La correction s’affiche après une réussite ou trois essais.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Champ libre</strong> : pas de sol ni de mur qui réfléchit le son, pas de réverbération ni de diffraction. <strong>Source ponctuelle isotrope</strong> dans un milieu homogène, sans absorption par l’air : {FSphereL}, valable loin de la source (d de l’ordre du mètre au moins).</li>
      <li><strong>Niveau d’intensité sonore</strong> : {FLl}, avec log le logarithme décimal et I₀ = 1,0×10⁻¹² W·m⁻² (seuil d’audibilité, qui correspond à une pression acoustique d’environ 20 µPa vers 1 kHz). Niveau <strong>non pondéré</strong> (pas de dB(A)). Un niveau négatif est sous le seuil d’audibilité.</li>
      <li><strong>Paroi</strong> : elle retire une atténuation A constante (en dB), A = L(entrée) − L(sortie), mesurée juste avant et juste après. Les valeurs de A (rideau 5 dB, vitre simple 25 dB, cloison en plâtre 35 dB, mur de béton 50 dB) sont <strong>fictives</strong> : des ordres de grandeur plausibles ; dans la réalité, A dépend de la fréquence, de l’épaisseur et du matériau.</li>
      <li><strong>Sources</strong> : les puissances acoustiques (chuchotement 10⁻⁸ W, conversation 10⁻⁵ W, cri 10⁻³ W, trompette 0,1 W, enceinte de concert 1 W) sont des ordres de grandeur, à un facteur 10 près ; la puissance acoustique est très inférieure à la puissance électrique d’une enceinte.</li>
      <li><strong>Plusieurs sources</strong> : le niveau d’une somme de sources n’est pas traité dans cette simulation.</li>
      <li><strong>Valeurs affichées</strong> : elles sont calculées par le modèle (ce ne sont pas des mesures indépendantes). <strong>Repères</strong> : niveaux typiques à ± 10 dB ; au-delà de 85 dB, la durée d’exposition doit être limitée ; seuil de douleur vers 120 dB.</li>
      <li><strong>Chiffres significatifs</strong> : données à 2 chiffres significatifs, résultats demandés aussi ; marges de 3 à 8 % selon les questions.</li>
      <li><strong>Hors périmètre</strong> : pondération A, réflexion, diffraction, interférences (autres simulations).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène et graphe ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const lev = (L, d = 1) => `L = ${nbf(L, d)} dB`;
  const sceneGuide = (() => {
    if (!enGuide) return null;
    const P1 = `P = ${sci(P_GUIDE)} W`;
    switch (IDS[idx]) {
      case 'intensite': return <SceneIntensite pLabel={`P = ${sci(2e-5)} W`} sLabel="S = 0,50 m²" aria="Une source sonore de puissance P égale à 2,0 fois 10 puissance moins 5 watts envoie ses ondes vers une surface S de 0,50 mètre carré, perpendiculaire à la propagation."/>;
      case 'niveau': return <SceneIntensite pLabel={`P = ${sci(2e-5)} W`} sLabel="S = 0,50 m²" lignes={[{ t: `I = ${sci(4e-5)} W·m⁻²`, c: BLEU }]} aria="La même source et la même surface ; l'intensité sonore I vaut 4,0 fois 10 puissance moins 5 watts par mètre carré."/>;
      case 'reciproque': return <SceneIntensite surface="micro" sLabel="L = 85 dB" lignes={[{ t: 'I = ? (en W·m⁻²)', c: BLEU }]} aria="Un sonomètre placé devant une enceinte indique un niveau de 85 décibels."/>;
      case 'double': return <SceneIntensite surface="micro" sLabel="L = ?" lignes={[{ t: `I₁ = ${sci(1e-6)} W·m⁻²`, c: BLEU }, { t: `I₂ = ${sci(2e-6)} W·m⁻²`, c: COL_OR }]} aria="Un sonomètre dont l'intensité sonore passe de 1,0 fois 10 puissance moins 6 à 2,0 fois 10 puissance moins 6 watts par mètre carré."/>;
      case 'sphere': return <SceneSon portee={4} pLabel={P1} capteurs={[{ d: 2, etiq: 'I = ?', c: BLEU }]} aria="Vue de dessus d'une source ponctuelle de puissance 1,0 fois 10 puissance moins 4 watt et d'un sonomètre à 2,0 mètres."/>;
      case 'distance': return <SceneSon portee={5} pLabel={P1} capteurs={[{ d: dG, etiq: lev(M.niveauSource(P_GUIDE, dG)) }]} aria={`Vue de dessus d'une source ponctuelle et d'un sonomètre à ${nbd(dG)} mètre${dG > 1 ? 's' : ''} ; il indique ${nbf(M.niveauSource(P_GUIDE, dG), 1)} décibels.`}/>;
      case 'prediction': return <SceneSon portee={10} pLabel={P1} capteurs={[{ d: 8, etiq: 'L = ?', c: BLEU }]} aria="Vue de dessus d'une source ponctuelle et d'un sonomètre à 8,0 mètres ; l'affichage du niveau est masqué."/>;
      case 'paroi': return <SceneSon portee={5} cote={false} mur={{ d: 2, nom: CLOISON.nom }} capteurs={[{ d: 1.65, etiq: 'avant : ' + lev(M.niveauSource(P_GUIDE, 2)), w: 176 }, { d: 2.35, etiq: 'après : ' + lev(M.niveauAvecParoi(P_GUIDE, 2.0001, 2, CLOISON.A)), haut: false, c: COL_OR, w: 176 }]} aria="Vue de dessus d'une source et d'une cloison en plâtre à 2,0 mètres ; un sonomètre juste avant indique 63,0 décibels et un autre juste après indique 28,0 décibels."/>;
      case 'total': return <SceneSon portee={5} pLabel={P1} mur={{ d: 2, nom: CLOISON.nom }} capteurs={[{ d: 4, etiq: 'L = ?', c: BLEU }]} aria="Vue de dessus d'une source, d'une cloison en plâtre à 2,0 mètres et d'un sonomètre à 4,0 mètres derrière la cloison ; l'affichage du niveau est masqué."/>;
      case 'seuil': return <SceneSon portee={20} sansEchelle pLabel={`P = ${sci(P_CONCERT)} W`} capteurs={[{ d: 19, etiq: 'L = 85 dB', inconnue: true, c: BLEU }]} aria="Schéma sans échelle : une enceinte de concert de puissance 1,0 watt et un sonomètre qui indique 85 décibels à une distance à trouver."/>;
      default: return null;
    }
  })();

  // défi / exploration : paramètres
  const srcEx = M.source(ex.src), matEx = M.materiau(ex.mat), PEx = srcEx.P;
  const nivEx = d => M.niveauSource(PEx, d, matEx.A > 0 && d > ex.dMur ? matEx.A : 0);
  const porteeEx = (() => { const m = Math.max(ex.d, ex.cmp ? ex.dB : 0, matEx.A > 0 ? ex.dMur : 0); return m <= 3.6 ? 4 : m <= 7.2 ? 8 : 20; })();
  const sceneDefi = dd && (dd.type === 'niveau'
    ? <SceneSon portee={dd.d <= 8 ? 10 : dd.d <= 16 ? 20 : 25} pLabel={`P = ${sci(dd.P)} W`} mur={{ d: dd.dp, nom: dd.mat.nom }} capteurs={[{ d: dd.d, etiq: 'L = ?', c: BLEU }]} aria={`Vue de dessus d'une source ponctuelle de puissance ${sci(dd.P)} watt, d'une paroi (${dd.mat.nom}) et d'un sonomètre à ${dd.d} mètres.`}/>
    : <SceneSon portee={20} sansEchelle pLabel={`P = ${sci(dd.P)} W`} capteurs={[{ d: 19, etiq: `L = ${dd.Ls} dB`, inconnue: true, c: BLEU }]} aria={`Schéma sans échelle : une source ponctuelle de puissance ${sci(dd.P)} watt et un sonomètre qui indique ${dd.Ls} décibels à une distance à trouver.`}/>);
  const sceneEx = enExplore && (
    <SceneSon portee={porteeEx} pLabel={`P = ${sci(PEx)} W`} mur={matEx.A > 0 ? { d: ex.dMur, nom: matEx.nom } : null}
      capteurs={[{ d: ex.d, etiq: `A : ${nbf(nivEx(ex.d), 1)} dB`, c: BLEU }, ...(ex.cmp ? [{ d: ex.dB, etiq: `B : ${nbf(nivEx(ex.dB), 1)} dB`, haut: false, c: '#15803d' }] : [])]}
      aria={`Vue de dessus de la source « ${srcEx.nom} » (P = ${sci(PEx)} watt), sonomètre A à ${nbd(ex.d)} mètres : ${nbf(nivEx(ex.d), 1)} décibels${ex.cmp ? `, sonomètre B à ${nbd(ex.dB)} mètres : ${nbf(nivEx(ex.dB), 1)} décibels` : ''}${matEx.A > 0 ? `, paroi (${matEx.nom}) à ${ex.dMur} mètres` : ''}.`}/>);
  const grapheEx = enExplore && (
    <div style={{ marginTop: 10 }}><GrapheNiveau P={PEx} mat={matEx} dMur={ex.dMur} dA={ex.d} dB={ex.cmp ? ex.dB : null} axe={ex.axe} aria={`Niveau d'intensité sonore en fonction de la distance, échelle ${ex.axe === 'log' ? 'logarithmique' : 'linéaire'} en distance, avec le point A à ${nbd(ex.d)} mètres${ex.cmp ? ` et le point B à ${nbd(ex.dB)} mètres` : ''}.`}/></div>);
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Vue de dessus : la source (haut-parleur) envoie du son dans toutes les directions ; les cercles repèrent les distances. Le sonomètre A indique le niveau à la distance choisie.</div>}
      {dd && dd.type === 'niveau' && <div style={aide}>Vue de dessus (les cercles pointillés sont derrière la paroi). Valeurs de P, d et A fournies dans l’énoncé.</div>}
      {enGuide ? sceneGuide : dd ? sceneDefi : sceneEx}
      {grapheEx}
    </div>);

  // ---------- commandes ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const boxCommandes = enGuide && IDS[idx] === 'distance' && (
    <div style={{ ...styleBoite, ...cadre('curseurs') }}>
      <div style={titreCarte}>Réglage</div>
      <div style={aide}>Déplacez le sonomètre : 1 m, 2 m ou 4 m de la source.</div>
      <ControleDistance valeur={dG} liste={M.D_GUIDE} onChange={setDG} defaut={1}/>
    </div>);
  const boxMesuresGuide = enGuide && IDS[idx] === 'distance' && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <LigneMesure nom="Distance d" valeur={`${nbd(dG)}${NB}m`}/>
      <LigneMesure nom="Intensité sonore I" valeur={`${sci(M.intensiteSphere(P_GUIDE, dG), 1)}${NB}W·m⁻²`}/>
      <LigneMesure nom="Niveau d’intensité sonore L" valeur={`${nbf(M.niveauSource(P_GUIDE, dG), 1)}${NB}dB`} couleur={BLEU}/>
    </div>);
  const mesuresEx = enExplore && (() => {
    const I1 = M.intensiteSphere(PEx, ex.d), Lg = M.attenuationGeometrique(1, ex.d), Aa = matEx.A > 0 && ex.d > ex.dMur ? matEx.A : 0;
    return (
      <div style={styleBoite}>
        <div style={titreCarte}>Mesures au sonomètre A (valeurs du modèle)</div>
        <div style={aide}>Valeurs à la distance choisie ; la source est celle du menu « Source ».</div>
        <LigneMesure nom="Intensité sonore I" valeur={`${sci(I1 * Math.pow(10, -Aa / 10), 1)}${NB}W·m⁻²`}/>
        <LigneMesure nom="Niveau L" valeur={`${nbf(nivEx(ex.d), 1)}${NB}dB`} couleur={BLEU}/>
        <LigneMesure nom="Niveau à 1 m de la source" valeur={`${nbf(M.niveauSource(PEx, 1), 1)}${NB}dB`}/>
        <LigneMesure nom="Atténuation géométrique depuis 1 m" valeur={`${nbf(Lg, 1)}${NB}dB`}/>
        <LigneMesure nom="Atténuation par absorption" valeur={`${nbf(Aa, 0)}${NB}dB`}/>
        <LigneMesure nom="Atténuation totale depuis 1 m" valeur={`${nbf(Lg + Aa, 1)}${NB}dB`} couleur="#b45309"/>
        {ex.cmp && <>
          <div style={{ ...titreCarte, marginTop: 8 }}>Comparaison des positions A et B</div>
          <LigneMesure nom="Niveau en B" valeur={`${nbf(nivEx(ex.dB), 1)}${NB}dB`} couleur={VERT}/>
          <LigneMesure nom="Écart de niveau L(A) − L(B)" valeur={`${nbf(nivEx(ex.d) - nivEx(ex.dB), 1)}${NB}dB`}/>
          <LigneMesure nom="Intensité en A divisée par intensité en B" valeur={`${nbf(Math.pow(10, (nivEx(ex.d) - nivEx(ex.dB)) / 10), 2)}`}/>
        </>}
      </div>);
  })();
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez une source, puis déplacez le sonomètre A pour voir le niveau changer.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Source sonore
        <select value={ex.src} onChange={e => setEx(s => ({ ...s, src: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.SOURCES.map(s => <option key={s.id} value={s.id}>{s.nom} : P = {sci(s.P)} W</option>)}</select></label>
      <ControleDistance valeur={ex.d} liste={M.D_LISTE} onChange={d => setEx(s => ({ ...s, d }))} defaut={4} nom="Distance d du sonomètre A"/>
      <Section titre={`Paroi : ${matEx.A > 0 ? `${matEx.nom} (A = ${matEx.A} dB) à ${ex.dMur} m` : 'aucune'}`} ouvert={ouv.paroi} onBascule={() => setOuv(o => ({ ...o, paroi: !o.paroi }))}>
        <div style={aide}>Une paroi retire A dB au niveau (valeurs fictives, ordres de grandeur). Elle agit sur les sonomètres placés derrière elle.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Matériau
          <select value={ex.mat} onChange={e => setEx(s => ({ ...s, mat: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.MATERIAUX.map(m => <option key={m.id} value={m.id}>{m.nom}{m.A > 0 ? ` : A = ${m.A} dB` : ''}</option>)}</select></label>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Position de la paroi
          <select value={ex.dMur} onChange={e => setEx(s => ({ ...s, dMur: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{[1, 2, 3, 5].map(x => <option key={x} value={x}>à {x} m de la source</option>)}</select></label>
      </Section>
      <Section titre={`Comparer deux positions et graphique${ex.cmp ? ` : B à ${nbd(ex.dB)} m` : ''}`} ouvert={ouv.graphe} onBascule={() => setOuv(o => ({ ...o, graphe: !o.graphe }))}>
        <div style={aide}>Placez un second sonomètre B pour comparer deux positions, et choisissez l’échelle des distances du graphique.</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex.cmp} onChange={e => setEx(s => ({ ...s, cmp: e.target.checked }))} style={{ width: 20, height: 20 }}/>Afficher un second sonomètre B</label>
        {ex.cmp && <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, margin: '4px 0 8px' }}>Distance du sonomètre B
          <select value={ex.dB} onChange={e => setEx(s => ({ ...s, dB: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{M.D_LISTE.map(x => <option key={x} value={x}>{nbd(x)} m</option>)}</select></label>}
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Échelle des distances du graphique
          <select value={ex.axe} onChange={e => setEx(s => ({ ...s, axe: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="lin">Linéaire (courbe qui s’aplatit)</option><option value="log">Logarithmique (la courbe devient une droite)</option></select></label>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Placez A à 1 m, 2 m puis 4 m : de combien de dB le niveau baisse-t-il à chaque doublement de la distance ? Est-ce le même pour toutes les sources ?</li>
        <li>Comparez « Conversation » et « Cri » à la même distance : quel écart de niveau ? Par quel facteur la puissance a-t-elle été multipliée ?</li>
        <li>Choisissez l’échelle logarithmique des distances : pourquoi la courbe devient-elle une droite ?</li>
        <li>Ajoutez une paroi entre la source et A : comparez le niveau avant et après, puis la baisse obtenue. Dépend-elle de la source ?</li>
        <li>Avec l’enceinte de concert, à partir de quelle distance le niveau passe-t-il sous 85 dB ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Intensité sonore : I = frac(P|S) (W·m⁻²) ; source ponctuelle : I = frac(P|4π d²)</li>
          <li>Niveau : {FLl}, avec I₀ = 1,0×10⁻¹² W·m⁻² ; réciproque : {FIrecL}</li>
          <li>Intensité × 2 : + 3 dB ; intensité × 10 : + 10 dB ; deux sources identiques : + 3 dB</li>
          <li>Distance × 2 : − 6 dB (atténuation géométrique) ; paroi : A = L(entrée) − L(sortie), les atténuations en dB s’additionnent</li>
          <li>Au-delà de 85 dB, la durée d’exposition doit être limitée</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .isn-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .isn-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .isn-col { display: flex; flex-direction: column; gap: 12px; }
        .isn-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .isn-l1.cote .isn-carte { order: 2; } .isn-l1.cote .isn-main { order: 1; }
          .isn-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .isn-ex > * { grid-column: 1; } .isn-ex > .isn-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .isn-l1.cote { grid-template-columns: minmax(0, 1fr); } .isn-l1.avant .isn-main, .isn-l1.avant .isn-col { display: contents; } .isn-l1.avant .isn-sc { order: 1; } .isn-l1.avant .isn-carte { order: 2; } .isn-l1.avant .isn-mes { order: 3; } }
        @media (prefers-reduced-motion: no-preference) { .isn-in { animation: isn-fondu 0.35s ease-out; } @keyframes isn-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Intensité sonore, niveau d’intensité et atténuation</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Pour décrire la force d’un son, on utilise une échelle logarithmique : le <strong>niveau d’intensité sonore</strong>, en décibels. Il diminue quand on s’éloigne de la source (atténuation géométrique) ou quand le son traverse un matériau (atténuation par absorption).</div>
      {!enExplore && <div className={`isn-l1 cote${enGuide && IDS[idx] === 'distance' ? ' avant' : ''}`}>
        {enGuide ? <div className="isn-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="isn-carte">{panneauHypo}</div> : null}
        <div className="isn-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'niveau' ? suiviN : suiviD}/></div>}
          <div className="isn-col">
            {(!enDefi || defi) && <div className="isn-in isn-sc" key={enGuide ? `s${idx}` : 'd'}>{boxScene}</div>}
            {boxCommandes && <div className="isn-in isn-sc">{boxCommandes}</div>}
            {boxMesuresGuide && <div className="isn-in isn-mes">{boxMesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="isn-ex">
        <div>{boxScene}</div>
        <div className="isn-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
