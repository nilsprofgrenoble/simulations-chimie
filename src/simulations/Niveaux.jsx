import { useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ARetenir, IndiceDefi, Formule, FormuleEnLigne, lireNombre, proche } from "../commun";
import { Pic } from "../Pictos";
import { EN_RECOLTE, EN_CONSULT } from "../fiches";
import * as N from "./nivModele";
import { QCM } from "./nivQcm";
import { COL } from "./photonStyle";
import { DiagrammeNiveaux, SpectreRaies, ScenePhoton, SvgNiveaux, SvgAbsorption, SvgConversion, SvgEmission, SvgDiagSpectre, SvgAbsSpectre } from "./nivSchemas";

const SIM_ID = 165, CLE_GUIDE = 'niveaux-1g-guide-v1';
declarerDefis(SIM_ID, [['identifier', 'Identifier un atome d’après ses raies'], ['exciter', 'Choisir la radiation qui excite une transition'], ['hors', 'Au-delà du programme : les raies de l’hydrogène']]);

// ====================================================
//  SIM 165 — NIVEAUX D'ÉNERGIE : ABSORPTION, ÉMISSION ET SPECTRES DE RAIES (1G spé PC, « Ondes et signaux », « Modèles ondulatoire et particulaire de la lumière »).
//  Une seule idée : un atome isolé n'a que certaines énergies (niveaux) ; il absorbe ou émet un photon dont l'énergie est EXACTEMENT l'écart entre deux niveaux
//  (ΔE = |E_f − E_i| = h·ν = h·c/λ) ; d'où les spectres de raies d'émission et d'absorption d'un gaz.
//  Modèle : nivModele.js (testé). HYPOTHÈSES (panneau + étapes) : atome isolé (gaz à basse pression), diagrammes SIMPLIFIÉS (quelques niveaux),
//  toutes les transitions entre niveaux représentés sont considérées, photon absorbé en entier ou pas du tout, absorption à partir du fondamental,
//  intensité des raies non modélisée, constantes arrondies (h = 6,63×10⁻³⁴ J·s ; c = 3,00×10⁸ m·s⁻¹ ; 1 eV = 1,60×10⁻¹⁹ J).
//  Atomes FICTIFS X, Y, Z pour le parcours (niveaux inventés) ; sodium (une seule raie, diagramme très simplifié) ; hydrogène « pour aller plus loin ».
//  Capacités visées (jamais affichées) : description qualitative de l'absorption et de l'émission ; quantification des niveaux d'énergie ;
//  exploiter un diagramme de niveaux avec λ = c/ν et ΔE = h·ν ; obtenir le spectre d'une source spectrale et l'interpréter avec le diagramme.
//  Non traité : molécules, diffusion, fluorescence, effet photoélectrique, modèle de Bohr. Parcours : 13 étapes ; 6 cartes « À retenir » ; trois défis.
// ====================================================
const NB = ' ';
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
// Carte « À retenir » repliée par défaut sous 900 px (elle repousserait la question) ; toujours dépliée sur ordinateur, en récolte des fiches et dans les contrôles automatiques.
function Repli({ children }) {
  const grand = typeof window !== 'undefined' && (window.innerWidth >= 900 || !!window.__PARCOURS_TEST__);
  const [ouvert, setOuvert] = useState(() => EN_RECOLTE || EN_CONSULT || grand);
  if (ouvert) return <>{children}{!(EN_RECOLTE || EN_CONSULT || grand) && <button type="button" onClick={() => setOuvert(false)} style={{ ...stylePetitBouton(false, '#475569'), marginTop: 6 }}>Replier la fiche</button>}</>;
  return <button type="button" onClick={() => setOuvert(true)} style={{ ...styleBouton(false, '#0b4f94'), width: '100%', textAlign: 'left' }}>Voir le schéma et le résumé</button>;
}

// ───────────── Formules (MathML) ─────────────
const sub = (b, i) => <msub><mi>{b}</mi><mi>{i}</mi></msub>;
const Ecart = <><mo>|</mo>{sub('E', 'f')}<mo>−</mo>{sub('E', 'i')}<mo>|</mo></>;
const FAbs = <Formule><mtext>{"E(photon)"}</mtext><mo>=</mo><mi>Δ</mi><mi>E</mi><mo>=</mo>{Ecart}</Formule>;
const FEmi = <Formule><mi>Δ</mi><mi>E</mi><mo>=</mo>{sub('E', 'i')}<mo>−</mo>{sub('E', 'f')}<mo>=</mo><mi>h</mi><mo>·</mo><mi>ν</mi></Formule>;
const FLam = <Formule><mi>λ</mi><mo>=</mo><mfrac><mrow><mi>h</mi><mo>·</mo><mi>c</mi></mrow><mrow><mi>Δ</mi><mi>E</mi></mrow></mfrac></Formule>;
const FLamLigne = <FormuleEnLigne><mi>λ</mi><mo>=</mo><mfrac><mrow><mi>h</mi><mo>·</mo><mi>c</mi></mrow><mrow><mi>Δ</mi><mi>E</mi></mrow></mfrac></FormuleEnLigne>;
const FDeltaLigne = <FormuleEnLigne><mi>Δ</mi><mi>E</mi><mo>=</mo>{Ecart}</FormuleEnLigne>;
const FEnuLigne = <FormuleEnLigne><mi>Δ</mi><mi>E</mi><mo>=</mo><mi>h</mi><mo>·</mo><mi>ν</mi><mo>=</mo><mfrac><mrow><mi>h</mi><mo>·</mo><mi>c</mi></mrow><mi>λ</mi></mfrac></FormuleEnLigne>;
const FNiveaux = <Formule><mtext>{"énergie\u00a0de\u00a0l’atome"}</mtext><mo>=</mo>{sub('E', '0')}<mtext>{"\u00a0ou\u00a0"}</mtext>{sub('E', '1')}<mtext>{"\u00a0ou\u00a0"}</mtext>{sub('E', '2')}<mo>…</mo></Formule>;
const FSens = <Formule><mtext>{"plus\u00a0"}</mtext><mi>Δ</mi><mi>E</mi><mtext>{"\u00a0est\u00a0grand,\u00a0plus\u00a0"}</mtext><mi>λ</mi><mtext>{"\u00a0est\u00a0petit"}</mtext></Formule>;
const FMemeLam = <Formule><mtext>{"λ\u00a0absorbée\u00a0=\u00a0λ\u00a0émise\u00a0(même\u00a0ΔE)"}</mtext></Formule>;

const X = N.ATOMES.X, Y = N.ATOMES.Y, Z = N.ATOMES.Z, NA = N.ATOMES.Na;
const ATOME_W = { id: 'W', nom: 'atome fictif W', niveaux: [0, 2.49], plage: [300, 1900] };
const th = { textAlign: 'left', padding: '4px 6px', fontSize: 13, color: KIT.txt2, borderBottom: `1.5px solid ${KIT.bord}`, fontWeight: 700 };
const td = { padding: '4px 6px', fontSize: 14, color: KIT.txt, borderBottom: `1px solid ${KIT.bord}`, verticalAlign: 'top' };
function TableauRaies() {
  return (
    <div style={{ marginTop: 8, overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <caption style={{ captionSide: 'top', textAlign: 'left', fontSize: 13, color: KIT.txt2, paddingBottom: 3 }}>Raies visibles des atomes fictifs X, Y et Z (longueurs d’onde en nm)</caption>
        <thead><tr><th style={th}>Atome</th><th style={th}>Raies visibles (nm)</th></tr></thead>
        <tbody>{[X, Y, Z].map(a => <tr key={a.id}><td style={{ ...td, fontWeight: 700 }}>{a.id}</td><td style={td}>{N.lignesVisibles(a).join(' ; ')}</td></tr>)}</tbody>
      </table>
    </div>);
}
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const dec = N.dec, eV = x => `${dec(x, 3)}${NB}eV`;

// ====================================================
export function SimulationNiveaux() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('identifier');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ex, setEx] = useState({ atome: 'X', mode: 'emission', sel: null, e: 2.0, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape;
  const reussie = !!(guide.reussies && guide.reussies[etape]);
  const setE = f => setEx(s => ({ ...s, ...f }));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'obs', titre: 'Un gaz, quelques couleurs',
      texte: <>Un tube contient un gaz d’atomes X (un atome <strong>fictif</strong>, inventé pour apprendre) à basse pression. Une décharge électrique excite les atomes, qui émettent de la lumière. Un spectroscope la décompose : on obtient un <strong>spectre de raies d’émission</strong>, comme en seconde. Les nombres sont les longueurs d’onde λ des raies, en nm. <strong>Hypothèse</strong> : on étudie des atomes isolés, comme dans un gaz à basse pression.</>,
      tache: { type: 'qcm', ...QCM.obs } },
    { id: 'fond', titre: 'Lire un diagramme',
      texte: <>On représente les énergies permises de l’atome X par un <strong>diagramme de niveaux</strong> : chaque trait horizontal est un niveau, et plus il est haut, plus l’énergie est grande (en eV). L’atome ne peut avoir que ces énergies, pas celles situées entre deux traits. Ici le zéro de l’énergie est placé sur E₀ : c’est un choix de repère (d’autres diagrammes, comme celui de l’hydrogène, ont des énergies négatives). <strong>Schéma simplifié</strong> : le diagramme ne montre que quelques niveaux de l’atome X.</>,
      tache: { type: 'qcm', ...QCM.fond } },
    { id: 'absorb', titre: 'Passer d’un niveau à un autre',
      retenirTitre: 'Niveaux d’énergie',
      retenir: <><Repli>
        <SvgNiveaux/>
        {FNiveaux}
        <ul style={liste}>
          <li>Dans un atome isolé, l’énergie ne peut prendre que certaines valeurs : les <strong>niveaux d’énergie</strong> (énergie <strong>quantifiée</strong>).</li>
          <li>Le niveau le plus bas est l’<strong>état fondamental</strong> ; les autres sont des <strong>états excités</strong>.</li>
          <li>Exemple : l’atome X n’a que E₀ = 0 ; E₁ = 1,90 ; E₂ = 2,85 ; E₃ = 3,55 eV (diagramme simplifié).</li>
          <li><strong>Moyen de s’en souvenir</strong> : « comme des marches : on est sur une marche, jamais entre deux ».</li>
          <li><strong>Idée fausse</strong> : « un atome peut avoir n’importe quelle énergie ». <strong>Vrai</strong> : seules les valeurs des niveaux sont possibles.</li>
        </ul></Repli>{renvoi}</>,
      texte: <>Un atome X est dans l’état excité E₁. Il peut <strong>absorber</strong> un photon et passer au niveau E₂. Pour cela, l’énergie du photon doit être égale à l’écart entre les deux niveaux : {FDeltaLigne}, où E<sub>i</sub> est le niveau de départ et E<sub>f</sub> le niveau d’arrivée (la valeur absolue rend l’écart positif). <strong>Hypothèse</strong> : un photon est absorbé en entier ou pas du tout. Calcule l’écart ΔE entre E₁ et E₂ (valeurs du diagramme).</>,
      tache: { type: 'num', q: 'Écart d’énergie ΔE entre E₁ et E₂, en eV', unite: 'eV', vrai: 0.95, tol: 0.02, cs: 2, affiche: v => dec(v, 2), carnet: 'Écart ΔE entre E₁ et E₂',
        aide: 'Écris le résultat avec une virgule ou un point, par exemple 7,5.',
        calcul: () => ['E₁ = 1,90 eV et E₂ = 2,85 eV.', 'ΔE = |E₂ − E₁| = 2,85 − 1,90 = 0,95 eV.'],
        pieges: [[4.75, 'Vous avez additionné les deux énergies : l’écart est une différence.'], [2.85, 'C’est l’énergie du niveau E₂, pas l’écart entre E₁ et E₂.'], [1.90, 'C’est l’énergie du niveau E₁, pas l’écart entre E₁ et E₂.']],
        indice: 'ΔE = |E_f − E_i| : soustrais l’énergie du niveau de départ à celle du niveau d’arrivée.',
        expl: 'ΔE = E₂ − E₁ = 2,85 − 1,90 = 0,95 eV. Le photon absorbé doit avoir exactement cette énergie.' } },
    { id: 'lambda', titre: 'De l’énergie à la couleur',
      retenirTitre: 'Absorber un photon',
      retenir: <><Repli>
        <SvgAbsorption/>
        {FAbs}
        <ul style={liste}>
          <li>Un photon est absorbé seulement si son énergie est <strong>exactement</strong> l’écart ΔE entre deux niveaux : c’est « tout ou rien ».</li>
          <li>Exemple : de 2,0 eV à 5,0 eV, il faut un photon de 3,0 eV.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « pile la bonne énergie, ni plus ni moins ».</li>
          <li><strong>Idée fausse</strong> : « il suffit que le photon ait plus d’énergie que ΔE ». <strong>Vrai</strong> : il faut exactement ΔE.</li>
        </ul></Repli>{renvoi}</>,
      texte: <>Le photon absorbé par X pour passer de E₀ à E₁ a une énergie ΔE = 1,90{NB}eV. Quelle est la longueur d’onde de cette lumière ? On utilise {FEnuLigne}, soit {FLamLigne}, avec h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s, c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹ et 1{NB}eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J. Il faut convertir ΔE en joules avant de calculer.</>,
      tache: { type: 'num', q: 'Longueur d’onde λ du photon, en nanomètres', unite: 'nm', vrai: N.lamNmDeEv(1.9), tol: 0.02, cs: 3, affiche: v => dec(v, 3), carnet: 'Longueur d’onde du photon de 1,90 eV',
        calcul: () => ['ΔE = 1,90 eV = 1,90 × 1,60 × 10⁻¹⁹ J = 3,04 × 10⁻¹⁹ J.', 'λ = frac(h × c|ΔE) = frac(6,63 × 10⁻³⁴ × 3,00 × 10⁸|3,04 × 10⁻¹⁹) ≈ 6,54 × 10⁻⁷ m = 654 nm.'],
        pieges: [[6.54e-7, 'Votre résultat est en mètres : la réponse est demandée en nanomètres (1 m = 10⁹ nm).'], [N.H * N.C / 1.9 * 1e9, 'L’énergie n’a pas été convertie en joules : 1,90 eV = 3,04 × 10⁻¹⁹ J.'], [1.90 * N.EV / (N.H * N.C) * 1e9, 'Vous avez inversé la relation : λ = h × c ÷ ΔE.']],
        indice: 'Convertis ΔE en joules (× 1,60 × 10⁻¹⁹), calcule λ = h × c ÷ ΔE en mètres, puis convertis en nanomètres (× 10⁹).',
        expl: 'λ = h × c ÷ ΔE ≈ 654 nm : c’est de la lumière visible, rouge.' } },
    { id: 'emi', titre: 'Quand l’atome redescend',
      retenirTitre: 'De ΔE à la longueur d’onde',
      retenir: <><Repli>
        <SvgConversion/>
        {FLam}
        <ul style={liste}>
          <li>Convertir l’énergie en joules (1 eV = 1,60 × 10⁻¹⁹ J), calculer λ en mètres, puis la donner en nm.</li>
          <li>Exemple : ΔE = 3,00 eV = 4,80 × 10⁻¹⁹ J donne λ ≈ 414 nm (violet).</li>
          <li><strong>Moyen de s’en souvenir</strong> : « eV vers J : × 1,6 × 10⁻¹⁹ ; m vers nm : × 10⁹ ».</li>
          <li><strong>Idée fausse</strong> : « plus l’écart d’énergie est grand, plus λ est grande ». <strong>Vrai</strong> : ΔE et λ varient en sens contraire.</li>
        </ul></Repli>{renvoi}</>,
      texte: <>Un atome X est excité au niveau E₃. Il revient au niveau E₁ en <strong>émettant</strong> un photon (le diagramme donne E₁ = 1,90{NB}eV et E₃ = 3,55{NB}eV).</>,
      tache: { type: 'qcm', ...QCM.emi } },
    { id: 'cascade', titre: 'Plusieurs chemins possibles',
      retenirTitre: 'Émettre un photon',
      retenir: <><Repli>
        <SvgEmission/>
        {FEmi}
        <ul style={liste}>
          <li>L’atome excité redescend vers un niveau plus bas : l’énergie qu’il perd est emportée par le photon émis.</li>
          <li>Exemple : de 3,0 eV à 1,0 eV, le photon émis a une énergie de 2,0 eV.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « ce que l’atome perd, le photon l’emporte ».</li>
          <li><strong>Idée fausse</strong> : « le photon émis a l’énergie du niveau de départ ». <strong>Vrai</strong> : il a l’énergie de l’écart entre départ et arrivée.</li>
        </ul></Repli>{renvoi}</>,
      texte: <>Des atomes X sont excités au niveau E₃. Chacun peut revenir au fondamental en un seul saut, ou en plusieurs sauts (par exemple E₃ → E₂ → E₁ → E₀). Un atome émet seulement quelques photons à la suite, mais le gaz contient énormément d’atomes : toutes les transitions possibles entre les quatre niveaux du diagramme se produisent. <strong>Hypothèse</strong> : on les compte toutes ; l’intensité des raies (plus ou moins brillantes dans la réalité) n’est pas modélisée. Combien de raies d’émission différentes le gaz peut-il émettre ?</>,
      tache: { type: 'num', q: 'Nombre de raies d’émission différentes', unite: 'raies', vrai: 6, tol: 0, carnet: 'Nombre de raies d’émission de X', affiche: v => String(v),
        calcul: () => ['Transitions depuis E₃ : E₃→E₂, E₃→E₁, E₃→E₀ (3).', 'Puis depuis E₂ : E₂→E₁, E₂→E₀ (2). Puis depuis E₁ : E₁→E₀ (1).', 'Total : 3 + 2 + 1 = 6 raies.'],
        pieges: [[3, 'Vous n’avez compté que les trois sauts qui partent de E₃ : les atomes peuvent aussi s’arrêter en E₂ ou E₁ puis repartir.'], [4, 'Vous avez compté les niveaux : il faut compter les transitions possibles entre deux niveaux.'], [12, 'Vous avez compté chaque transition deux fois : une raie correspond à une paire de niveaux, une seule fois.']],
        indice: 'Compte les transitions vers le bas : depuis E₃, puis depuis E₂, puis depuis E₁.',
        expl: '3 + 2 + 1 = 6 transitions différentes, donc 6 raies d’émission possibles (avec 4 niveaux).' } },
    { id: 'spectre', titre: 'Placer les raies sur une échelle',
      texte: <>Chaque transition donne un photon, donc une raie, à la longueur d’onde λ = h·c ÷ ΔE. Voici le spectre d’émission complet du gaz X, avec les six transitions rappelées sur le diagramme. Les longueurs d’onde augmentent vers la droite ; les zones « UV » et « IR » ne sont pas visibles à l’œil.</>,
      tache: { type: 'qcm', ...QCM.spectre } },
    { id: 'absorption', titre: 'De la lumière blanche à travers le gaz',
      retenirTitre: 'Du diagramme au spectre',
      retenir: <><Repli>
        <SvgDiagSpectre/>
        {FSens}
        <ul style={liste}>
          <li>Chaque transition possible donne une raie ; chacune se place à sa longueur d’onde sur l’échelle.</li>
          <li>Exemple : 3 niveaux donnent 3 raies (a, b, c) ; le plus grand écart (c) donne la plus petite longueur d’onde.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « grand saut, petite longueur d’onde (vers le violet et l’UV) ».</li>
          <li><strong>Idée fausse</strong> : « les raies sont rangées dans l’ordre des niveaux ». <strong>Vrai</strong> : elles sont rangées par écart ΔE.</li>
        </ul></Repli>{renvoi}</>,
      texte: <>On envoie maintenant de la <strong>lumière blanche</strong> (un spectre continu) à travers du gaz X <strong>froid</strong>. <strong>Hypothèse</strong> : tous ses atomes sont au niveau fondamental E₀. Un atome absorbe un photon seulement si son énergie est égale à un écart entre E₀ et un niveau plus haut. Dans le spectre de la lumière qui sort du gaz, des radiations manquent : elles forment des raies <strong>noires</strong>. Combien y en a-t-il ?</>,
      tache: { type: 'num', q: 'Nombre de raies noires (d’absorption)', unite: 'raies', vrai: 3, tol: 0, carnet: 'Nombre de raies noires de X', affiche: v => String(v),
        calcul: () => ['Atomes au fondamental E₀ : transitions possibles E₀→E₁, E₀→E₂ et E₀→E₃.', 'Il y a donc 3 photons absorbés possibles, donc 3 raies noires : 654 nm, 436 nm et 350 nm.'],
        pieges: [[6, 'Vous avez compté toutes les raies d’émission : l’absorption ne part que du niveau fondamental (atomes froids).'], [1, 'Il y a plusieurs niveaux au-dessus de E₀ : chacun donne une raie noire.'], [4, 'Vous avez compté les niveaux, E₀ compris : il faut compter les transitions depuis E₀.']],
        indice: 'Les atomes sont tous en E₀ : compte les niveaux plus hauts que E₀ qu’ils peuvent atteindre.',
        expl: 'Depuis E₀, on peut aller vers E₁, E₂ ou E₃ : 3 raies noires, aux mêmes longueurs d’onde que 3 raies d’émission.' } },
    { id: 'refus', titre: 'Un photon qui arrive sur un atome',
      retenirTitre: 'Spectres d’émission et d’absorption',
      retenir: <><Repli>
        <SvgAbsSpectre/>
        {FMemeLam}
        <ul style={liste}>
          <li><strong>Émission</strong> : raies colorées sur fond noir (atomes excités). <strong>Absorption</strong> : raies noires sur fond continu (lumière blanche, atomes au fondamental).</li>
          <li>Pour un même atome, les raies noires sont aux mêmes λ que certaines raies colorées.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « ce que l’atome absorbe, il peut le réémettre ».</li>
          <li><strong>Idée fausse</strong> : « il y a autant de raies noires que de raies colorées ». <strong>Vrai</strong> : seulement celles qui partent du fondamental.</li>
        </ul></Repli>{renvoi}</>,
      texte: <>Le gaz X est au fondamental (E₀ = 0). On l’éclaire avec une lumière monochromatique (une seule radiation) dont chaque photon a une énergie de 2,50{NB}eV. Rappel des écarts : E₁ − E₀ = 1,90{NB}eV ; E₂ − E₀ = 2,85{NB}eV ; E₃ − E₀ = 3,55{NB}eV.</>,
      tache: { type: 'qcm', ...QCM.refus } },
    { id: 'ident', titre: 'Reconnaître un gaz',
      texte: <>Chaque atome a ses propres niveaux, donc ses propres raies : le spectre est comme une <strong>signature</strong>. Un gaz inconnu, excité par une décharge, donne le spectre visible ci-dessus. Le tableau donne les raies visibles des atomes fictifs X, Y et Z.</>,
      tache: { type: 'qcm', ...QCM.ident } },
    { id: 'sodium', titre: 'Une lampe de rue',
      texte: <>Une lampe à vapeur de <strong>sodium</strong> éclaire certaines routes. Voici un diagramme <strong>très simplifié</strong> du sodium : seule la transition la plus lumineuse est représentée, entre le niveau fondamental et un niveau à 2,10{NB}eV (l’atome réel a d’autres niveaux, donc d’autres raies bien plus faibles). Données : h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s ; c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹ ; 1{NB}eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J.</>,
      tache: { type: 'qcm', ...QCM.sodium } },
    { id: 'inverse', titre: 'Faire le chemin inverse',
      texte: <>Pour un atome W (fictif), le spectre d’émission montre une raie de longueur d’onde λ = 500{NB}nm. Elle correspond au retour d’un niveau excité E₁ vers le niveau fondamental E₀ = 0. Quelle est l’énergie du niveau E₁ ? Utilise {FEnuLigne} avec les mêmes constantes qu’avant.</>,
      tache: { type: 'num', q: 'Énergie du niveau E₁, en eV', unite: 'eV', vrai: N.evDeLamNm(500), tol: 0.02, cs: 3, affiche: v => dec(v, 3), carnet: 'Énergie du niveau E₁ de W',
        aide: 'Écris le résultat avec une virgule ou un point, par exemple 7,5.',
        calcul: () => ['λ = 500 nm = 5,00 × 10⁻⁷ m.', 'ΔE = frac(h × c|λ) = frac(6,63 × 10⁻³⁴ × 3,00 × 10⁸|5,00 × 10⁻⁷) ≈ 3,98 × 10⁻¹⁹ J.', 'En eV : 3,98 × 10⁻¹⁹ ÷ 1,60 × 10⁻¹⁹ ≈ 2,49 eV, donc E₁ = 2,49 eV (E₀ = 0).'],
        pieges: [[3.98e-19, 'Votre résultat est en joules : la réponse est demandée en eV (÷ 1,60 × 10⁻¹⁹).'], [N.H * N.C / (500) / N.EV, 'La longueur d’onde n’a pas été convertie en mètres (500 nm = 5,00 × 10⁻⁷ m).'], [1 / N.evDeLamNm(500), 'Vous avez inversé la relation : ΔE = h × c ÷ λ.']],
        indice: 'ΔE = h × c ÷ λ avec λ en mètres (1 nm = 10⁻⁹ m), puis convertis en eV (÷ 1,60 × 10⁻¹⁹).',
        expl: 'ΔE = h × c ÷ λ ≈ 3,98 × 10⁻¹⁹ J ≈ 2,49 eV. Comme E₀ = 0, E₁ = 2,49 eV.' } },
    { id: 'bilan', titre: 'Le bilan',
      texte: <>Un atome isolé n’a que des énergies bien précises : ses <strong>niveaux</strong>. Il absorbe ou émet un photon dont l’énergie est <strong>exactement</strong> l’écart entre deux niveaux, {FEnuLigne}. Il en résulte des <strong>raies</strong> : colorées sur fond noir en émission, noires sur fond continu en absorption, aux mêmes longueurs d’onde, signature de l’atome.
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55, color: KIT.txt2 }}><strong>Limites du modèle</strong> : atome isolé ; diagrammes simplifiés (quelques niveaux seulement) ; intensité des raies non modélisée ; absorption supposée à partir du fondamental. Les atomes X, Y, Z et W sont inventés ; l’hydrogène (en exploration) est « pour aller plus loin ». Pour revoir les spectres d’émission d’une lampe ou d’un corps chaud, voir la simulation « Spectres d’émission : corps chauds et lampes à décharge » (seconde).</div></> },
  ];
  const derniereEtape = etape >= ETAPES.length - 1;
  const idE = enGuide ? ETAPES[Math.min(etape, ETAPES.length - 1)].id : null;

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'exciter') setDefi({ type, ...N.tirerExciter(Math.random, prec && prec.type === 'exciter' ? prec.cle : null), choix: null, verifie: false, ok: false });
    else if (type === 'hors') setDefi({ type, ...N.tirerBalmer(Math.random, prec && prec.type === 'hors' ? [prec.ni, prec.nf] : null), rep: '', verifie: false, ok: false });
    else setDefi({ type: 'identifier', ...N.tirerIdentifier(Math.random, prec && prec.type === 'identifier' ? prec.cle : null), choix: '', verifie: false, ok: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi, null); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifierDefi = () => {
    if (defi.type === 'identifier') { const ok = defi.choix === defi.bonne; setDefi(d => ({ ...d, verifie: true, ok })); noterI(ok); return; }
    if (defi.type === 'exciter') { const ok = defi.choix === defi.bonne; setDefi(d => ({ ...d, verifie: true, ok })); noterE(ok); return; }
    const x = lireNombre(defi.rep), ok = Number.isFinite(x) && proche(x, defi.vrai, 0.02);
    setDefi(d => ({ ...d, verifie: true, ok })); noterH(ok);
  };
  const peutVerifier = defi && (defi.type === 'hors' ? String(defi.rep).trim() !== '' : defi.type === 'exciter' ? defi.choix != null : !!defi.choix);
  const etiquette = (t, corps) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{t}{corps}</label>;
  const titreDefi = t => <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{t}</div>;
  const ordreExciter = defi && defi.type === 'exciter' ? [defi.bonne, ...defi.faux].map((v, i) => [v, (i * 7 + Math.round(defi.dE * 10)) % 11]).sort((a, b) => a[1] - b[1] || a[0] - b[0]).map(x => x[0]) : [];
  const atomeDefi = defi && defi.type === 'exciter' ? { id: 'D', nom: 'atome fictif D', niveaux: defi.niveaux } : null;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['identifier', 'Quel atome ?'], ['exciter', 'Quelle radiation ?'], ['hors', 'Au-delà du programme']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'identifier' && <>
        {titreDefi('Défi : identifier un atome')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un gaz inconnu est l’un des trois gaz A, B ou C. Son spectre d’émission montre (entre autres) les raies de longueurs d’onde <strong>{defi.raies.join(' nm ; ')}{NB}nm</strong>. Les niveaux d’énergie de chaque atome (diagramme simplifié) sont donnés ci-dessous. Lequel est-ce ?</div>
        <div style={{ overflowX: 'auto', marginBottom: 8 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr><th style={th}>Atome</th><th style={th}>Niveaux d’énergie (eV)</th></tr></thead>
            <tbody>{defi.atomes.map(a => <tr key={a.id}><td style={{ ...td, fontWeight: 700 }}>{a.id}</td><td style={td}>{a.niveaux.map(E => E.toFixed(2).replace('.', ',')).join(' ; ')}</td></tr>)}</tbody>
          </table></div>
        <SpectreRaies raies={defi.raies.map(l => ({ lam: l }))} plage={[100, 2300]} echelle="log" label={`Spectre d’émission du gaz inconnu : raies à ${defi.raies.join(', ')} nanomètres.`}/>
        <div style={{ marginTop: 8 }}>{etiquette('Atome', <select value={defi.choix} onChange={x => setDefi(d => ({ ...d, choix: x.target.value, verifie: false }))} style={sel} aria-label="Atome"><option value="">Choisis…</option>{defi.atomes.map(a => <option key={a.id} value={a.id}>Atome {a.id}</option>)}</select>)}</div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Pour chaque raie, calcule l’écart d’énergie ΔE = h × c ÷ λ en eV (λ en mètres, puis ÷ 1,60 × 10⁻¹⁹). Cherche ensuite, dans chaque atome, les écarts entre deux niveaux : le bon atome a un écart égal à chacune des trois valeurs.</IndiceDefi>
      </>}
      {defi.type === 'exciter' && <>
        {titreDefi('Défi : choisir la radiation')}
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un atome (fictif) a le diagramme ci-dessous. Il est au niveau {N.nomNiveauHtml(atomeDefi, defi.bas)} et on veut le faire passer au niveau {N.nomNiveauHtml(atomeDefi, defi.haut)}. Quelle radiation monochromatique (longueur d’onde dans le vide) faut-il envoyer ? Données : h = 6,63{NB}×{NB}10⁻³⁴{NB}J·s ; c = 3,00{NB}×{NB}10⁸{NB}m·s⁻¹ ; 1{NB}eV = 1,60{NB}×{NB}10⁻¹⁹{NB}J.</div>
        <DiagrammeNiveaux atome={atomeDefi} trans={[{ bas: defi.bas, haut: defi.haut, sens: 'abs', neutre: true }]} label={`Diagramme de niveaux d’un atome fictif ; la flèche va de ${N.nomNiveau(atomeDefi, defi.bas)} à ${N.nomNiveau(atomeDefi, defi.haut)}.`}/>
        <div role="group" aria-label="Radiations proposées" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
          {ordreExciter.map(v => <button key={v} onClick={() => setDefi(d => ({ ...d, choix: v, verifie: false }))} aria-pressed={defi.choix === v} style={{ ...stylePetitBouton(defi.choix === v, '#0369a1'), minHeight: 42, fontSize: 14.5 }}>{defi.choix === v ? '● ' : '○ '}{dec(v, 3)}{NB}nm</button>)}
        </div>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Calcule l’écart d’énergie ΔE = |E<sub>f</sub> − E<sub>i</sub>| entre les deux niveaux (en eV), convertis-le en joules (× 1,60 × 10⁻¹⁹), puis λ = h × c ÷ ΔE.</IndiceDefi>
      </>}
      {defi.type === 'hors' && <>
        {titreDefi('Défi au-delà du programme : l’hydrogène')}
        <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '5px 8px', marginBottom: 8, lineHeight: 1.5 }}><strong>Au-delà du programme de première</strong> : pour l’atome d’hydrogène, l’énergie du niveau n vaut E<sub>n</sub> = −13,6 ÷ n² (en eV), avec n = 1, 2, 3… (formule fournie, non exigible).</div>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un atome d’hydrogène passe du niveau n = {defi.ni} au niveau n = {defi.nf}. Calcule la longueur d’onde du photon échangé, en nm, avec 3 chiffres significatifs (notation décimale).</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, flexWrap: 'wrap', marginBottom: 8 }}>Longueur d’onde
          <input value={defi.rep} placeholder="?" aria-label="Longueur d’onde en nm" inputMode="decimal" onChange={x => setDefi(d => ({ ...d, rep: x.target.value, verifie: false }))} onKeyDown={x => { if (x.key === 'Enter' && peutVerifier) verifierDefi(); }}
            style={{ fontSize: 15, padding: '6px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130, minHeight: 36 }}/><span style={{ fontSize: 14, color: KIT.txt2 }}>nm</span></label>
        <IndiceDefi cache={!!(defi.verifie && defi.ok)}>Calcule E<sub>{defi.ni}</sub> et E<sub>{defi.nf}</sub> avec −13,6 ÷ n², fais la différence ΔE en eV, puis λ = h × c ÷ ΔE (ΔE en joules).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="nv-verif" onClick={verifierDefi} disabled={!peutVerifier} style={{ ...styleBouton(true, '#15803d'), opacity: peutVerifier ? 1 : 0.5 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouvelle question</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
        {defi.type === 'identifier' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : atome {defi.bonne}. <span style={{ fontWeight: 400, color: KIT.txt }}>Ses écarts d’énergie donnent exactement ces raies : {defi.choisies.map(t => `${dec(t.dE, 3)} eV → ${Math.round(t.lam)} nm`).join(' ; ')}.</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>Passe chaque raie en énergie (ΔE = h × c ÷ λ) et cherche cet écart entre deux niveaux de chaque atome : il faut les trois.</span></div>)}
        {defi.type === 'exciter' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : {dec(defi.bonne, 3)} nm. <span style={{ fontWeight: 400, color: KIT.txt }}>ΔE = {dec(defi.dE, 3)} eV, λ = h × c ÷ ΔE ≈ {dec(defi.bonne, 3)} nm.</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>Il faut l’écart d’énergie entre les deux niveaux (pas l’énergie d’un seul niveau), puis λ = h × c ÷ ΔE.</span></div>)}
        {defi.type === 'hors' && (defi.ok
          ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct : environ {dec(defi.vrai, 3)} nm. <span style={{ fontWeight: 400, color: KIT.txt }}>ΔE = {dec(defi.dE, 3)} eV ; λ = h × c ÷ ΔE.</span></div>
          : <div style={{ color: '#b91c1c', fontWeight: 700 }}>✗ Pas encore. <span style={{ fontWeight: 400, color: KIT.txt }}>Vérifie l’écart d’énergie en eV (E<sub>n</sub> = −13,6 ÷ n²), puis la conversion en joules et en mètres.</span></div>)}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Atome isolé</strong> : gaz à basse pression, atomes sans interaction entre eux. L’énergie de l’atome ne prend que des valeurs discrètes (niveaux).</li>
      <li><strong>Diagrammes simplifiés</strong> : quelques niveaux seulement, valeurs données. Les atomes X, Y, Z et W sont <strong>fictifs</strong> (inventés pour apprendre). Le diagramme du sodium est très simplifié (une seule raie) ; celui de l’hydrogène est « pour aller plus loin ».</li>
      <li><strong>Toutes les transitions</strong> entre les niveaux représentés sont considérées. L’<strong>intensité</strong> des raies n’est pas modélisée : dans la réalité, certaines raies sont bien plus brillantes que d’autres, et tous les atomes n’émettent pas toutes les raies en même temps.</li>
      <li><strong>Un photon est absorbé en entier ou pas du tout</strong> : il faut ΔE = |E<sub>f</sub> − E<sub>i</sub>| à la précision des valeurs données (trois chiffres significatifs).</li>
      <li><strong>Absorption</strong> : les atomes sont supposés au niveau fondamental (gaz froid) ; le spectre d’un gaz réel montre en pratique peu de raies noires.</li>
      <li><strong>Origine des énergies</strong> : E = 0 est placé sur le niveau fondamental pour X, Y, Z, W et le sodium ; pour l’hydrogène, E = 0 correspond à l’ionisation, d’où des énergies négatives. Seuls les écarts ont un sens physique.</li>
      <li><strong>Constantes arrondies</strong> : h = 6,63 × 10⁻³⁴ J·s ; c = 3,00 × 10⁸ m·s⁻¹ ; 1 eV = 1,60 × 10⁻¹⁹ J. Les λ calculées peuvent différer d’environ 1 % des valeurs mesurées (592 nm calculés pour la raie du sodium mesurée à 589 nm).</li>
      <li><strong>Couleurs</strong> : leur rendu à l’écran est une illustration ; les nombres (λ) font foi.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const tousX = N.transitions(X).map(t => ({ lam: t.lam }));
  const sceneGuide = (() => {
    if (!idE) return null;
    if (idE === 'obs') return boite('Spectre observé à l’œil', <><SpectreRaies raies={N.raiesVisibles(X).map(t => ({ lam: t.lam }))} plage={[400, 850]} label="Spectre d’émission du gaz X observé à l’œil : trois raies colorées sur fond noir, entre 400 et 800 nanomètres."/>{aide('Spectre simplifié : on ne voit à l’œil que les raies du domaine visible.')}</>);
    if (idE === 'fond') return boite('Diagramme de niveaux de l’atome X', <><DiagrammeNiveaux atome={X}/>{aide('Diagramme simplifié, énergies en eV.')}</>);
    if (idE === 'absorb') return boite('Absorption entre deux niveaux', <><DiagrammeNiveaux atome={X} trans={reussie ? [{ bas: 1, haut: 2, sens: 'abs', neutre: true, label: 'ΔE' }] : []} etiqFond/>{aide('Le diagramme est celui de l’atome X, au niveau fondamental indiqué.')}</>);
    if (idE === 'lambda') return boite('Un photon qui fait passer de E₀ à E₁', <><DiagrammeNiveaux atome={X} trans={[{ bas: 0, haut: 1, sens: 'abs', label: '1,90 eV' }]} etiqFond/></>);
    if (idE === 'emi') return boite('Retour vers un niveau plus bas', <><DiagrammeNiveaux atome={X} trans={[{ bas: 1, haut: 3, sens: 'emi', neutre: true }]} etiqFond/><ScenePhoton cas="emi" lam={753}/></>);
    if (idE === 'cascade') return boite('Les retours depuis E₃', <><DiagrammeNiveaux atome={X} trans={reussie ? [[2, 3], [1, 3], [0, 3], [1, 2], [0, 2], [0, 1]].map(([b, h]) => ({ bas: b, haut: h, sens: 'emi' })) : [[2, 3], [1, 3], [0, 3]].map(([b, h]) => ({ bas: b, haut: h, sens: 'emi' }))} etiqFond/>{aide(reussie ? 'Les six transitions possibles.' : 'Trois sauts partent de E₃ ; d’autres chemins passent par des niveaux intermédiaires.')}</>);
    if (idE === 'spectre') return <>{boite('Les six transitions', <DiagrammeNiveaux atome={X} trans={N.transitions(X).map(t => ({ bas: t.bas, haut: t.haut, sens: 'emi' }))}/>)}{boite('Spectre d’émission complet du gaz X', <SpectreRaies raies={tousX} plage={X.plage} label="Spectre d’émission complet du gaz X : six raies entre 300 et 1900 nanomètres, dont une dans l’ultraviolet et deux dans l’infrarouge."/>)}</>;
    if (idE === 'absorption') return <>{boite('Spectre d’émission de X (rappel)', <SpectreRaies raies={tousX} plage={X.plage} titre={false} label="Rappel : spectre d’émission du gaz X, six raies."/>)}{boite('Lumière blanche après la traversée du gaz froid', <><SpectreRaies mode="absorption" raies={reussie ? N.transitionsAbsorption(X).map(t => ({ lam: t.lam })) : []} plage={X.plage} label={reussie ? 'Spectre d’absorption du gaz X : fond continu avec trois raies noires.' : 'Spectre continu de la lumière blanche avant absorption par le gaz.'}/>{aide(reussie ? 'Spectre schématique : le fond continu est une illustration.' : 'Fond continu : schéma de la lumière blanche, à compléter par les raies noires.')}</>)}</>;
    if (idE === 'refus') return boite('Un photon arrive sur l’atome X', <><ScenePhoton cas={reussie ? 'non' : 'abs0'} lam={497}/>{aide('Schéma simplifié, sans échelle.')}</>);
    if (idE === 'ident') return <>{boite('Spectre du gaz inconnu', <SpectreRaies raies={N.raiesVisibles(Y).map(t => ({ lam: t.lam }))} plage={[400, 850]} label="Spectre d’émission du gaz inconnu : deux raies colorées visibles, à 478 et 654 nanomètres."/>)}{boite('Tableau de raies', <TableauRaies/>)}</>;
    if (idE === 'sodium') return boite('Diagramme très simplifié du sodium', <><DiagrammeNiveaux atome={NA} trans={[{ bas: 0, haut: 1, sens: 'emi', neutre: true }]} etiqFond/>{aide('Seule la transition la plus lumineuse est représentée.')}</>);
    if (idE === 'inverse') return boite('Une raie de 500 nm', <><DiagrammeNiveaux atome={ATOME_W} masques={reussie ? [] : [1]} trans={[{ bas: 0, haut: 1, sens: 'emi', label: '500 nm' }]} etiqFond/></>);
    return null;
  })();

  // ════════════════ EXPLORATION ════════════════
  const A = N.ATOMES[ex.atome], trAll = N.transitions(A), trMode = ex.mode === 'absorption' ? trAll.filter(t => t.depuisFond) : trAll;
  const selT = ex.sel && trMode.find(t => t.bas === ex.sel[0] && t.haut === ex.sel[1]);
  const eMax = Math.max(...A.niveaux) - Math.min(...A.niveaux), eMaxSlider = A.id === 'H' ? 13 : Math.ceil(eMax * 1.25 * 4) / 4;
  const ePh = Math.min(ex.e, eMaxSlider), lamPh = N.lamNmDeEv(ePh), absorbeur = trMode.find(t => Math.abs(t.dE - ePh) <= 0.002 * ePh);
  const pasPh = 0.05;
  const changerAtome = id => setE({ atome: id, sel: null, e: id === 'H' ? 10.2 : 2.0 });
  const exReglages = (<>
    {etiquette('Atome', <select value={ex.atome} onChange={x => changerAtome(x.target.value)} style={sel} aria-label="Atome">{Object.values(N.ATOMES).map(a => <option key={a.id} value={a.id}>{a.menu || a.nom}</option>)}</select>)}
    <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Ce qu’on observe</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Émission ou absorption">
      {[['emission', 'Émission'], ['absorption', 'Absorption']].map(([m, l]) => <button key={m} onClick={() => setE({ mode: m, sel: null })} aria-pressed={ex.mode === m} style={{ ...stylePetitBouton(ex.mode === m, '#334155'), minHeight: 42 }}>{ex.mode === m ? '● ' : '○ '}{l}</button>)}
    </div>
    {aide(ex.mode === 'emission' ? 'Émission : atomes excités qui redescendent (flèches vers le bas) ; raies colorées sur fond noir. Clique une flèche.' : 'Absorption : lumière blanche à travers un gaz froid (flèches vers le haut, depuis le fondamental) ; raies noires. Clique une flèche.')}
    {ex.mode === 'absorption' && <div style={{ marginTop: 10 }}>
      <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Énergie du photon qui arrive <span style={{ color: KIT.txt, marginLeft: 6 }}>{dec(ePh, 3)}{NB}eV (λ = {Math.round(lamPh)}{NB}nm)</span></label>
      <input type="range" min={0.5} max={eMaxSlider} step={pasPh} value={ePh} onChange={x => setE({ e: parseFloat(x.target.value) })} aria-label="Énergie du photon incident" aria-valuetext={`${dec(ePh, 3)} électronvolts`} style={{ width: '100%', accentColor: COL.repere, height: 32 }}/>
      {aide('Teste un photon sur le gaz froid : il n’est absorbé que si son énergie est un écart ΔE du diagramme.')}</div>}
  </>);
  const ligne = (nom, valeur, c) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: `1px dashed ${KIT.bord}`, fontSize: 14, flexWrap: 'wrap' }}>
      <span style={{ color: c || KIT.txt2, fontWeight: 700 }}>{nom}</span><span style={{ color: KIT.txt, fontWeight: 700, textAlign: 'right' }}>{valeur}</span></div>);
  const exMesures = (<div data-mesures="1">
    {selT ? <>
      {ligne('Transition', ex.mode === 'emission' ? `${N.nomNiveauHtml(A, selT.haut)} → ${N.nomNiveauHtml(A, selT.bas)}` : `${N.nomNiveauHtml(A, selT.bas)} → ${N.nomNiveauHtml(A, selT.haut)}`)}
      {ligne('Écart d’énergie ΔE', `${eV(selT.dE)} = ${N.sci(selT.dE * N.EV)}${NB}J`, COL.ener)}
      {ligne('Longueur d’onde λ', `${N.lambdaTexte(selT.lam * 1e-9)}`, COL.lam)}
      {ligne('Domaine', `${selT.dom.nom}${selT.couleur ? ` (${selT.couleur})` : ''}`)}
      {ligne('Photon', ex.mode === 'emission' ? 'émis par l’atome' : 'absorbé par l’atome')}
    </> : <div style={{ fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Clique une flèche du diagramme (ou une raie du spectre) pour voir l’écart ΔE, la longueur d’onde λ et le domaine.</div>}
    {ex.mode === 'absorption' && <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>
      <strong>Photon de {eV(ePh)} :</strong> {absorbeur ? `absorbé : l’atome passe de ${N.nomNiveauHtml(A, absorbeur.bas)} à ${N.nomNiveauHtml(A, absorbeur.haut)}.` : `non absorbé : aucun écart du diagramme depuis le fondamental ne vaut cette énergie.${ePh > eMax + 0.01 ? ' Cette énergie dépasse le dernier niveau du diagramme, qui est simplifié : il ne montre que quelques niveaux' + (A.id === 'H' ? ' (au-delà de 13,6 eV, l’atome serait ionisé : hors programme).' : ' ; un atome réel aurait d’autres niveaux.') : ''}`}</div>}
    {aide('Valeurs avec 3 chiffres significatifs, dans le vide. Intensité des raies non modélisée. Un photon est absorbé si son énergie est un écart ΔE à 0,2 % près.')}
    {A.id === 'Na' && aide('Valeur mesurée : 589 nm (en réalité un doublet, 589,0 et 589,6 nm). Le diagramme simplifié donne 592 nm : 2,10 eV est arrondi (valeur réelle environ 2,105 eV) et les constantes aussi.')}
    {A.id === 'H' && aide('Valeurs mesurées : 656 nm, 486 nm et 1 875 nm pour les raies de 658 nm, 488 nm et 1 884 nm ici : l’écart d’environ 1 % vient des niveaux (3 chiffres) et des constantes arrondis.')}
  </div>);
  const choisir = (b, h) => setE({ sel: ex.sel && ex.sel[0] === b && ex.sel[1] === h ? null : [b, h] });
  const exScene = (<>
    <DiagrammeNiveaux atome={A} onClick={choisir} etiqFond trans={trMode.map(t => ({ bas: t.bas, haut: t.haut, sens: ex.mode === 'absorption' ? 'abs' : 'emi', sel: !!selT && selT.bas === t.bas && selT.haut === t.haut, label: selT && selT.bas === t.bas && selT.haut === t.haut ? `${dec(t.dE, 3)} eV` : null }))}
      label={`Diagramme de niveaux : ${A.nom}. Les flèches sont cliquables.`}/>
    {ex.mode === 'absorption' && <ScenePhoton cas={absorbeur ? 'abs' : 'non'} lam={lamPh}/>}
  </>);
  const exSpectre = (<>
    <SpectreRaies mode={ex.mode} plage={A.plage} echelle={A.echelle} raies={trMode.map(t => ({ lam: t.lam, sel: !!selT && selT.bas === t.bas && selT.haut === t.haut }))}/>
    {aide(ex.mode === 'emission' ? 'Spectre d’émission construit à partir du diagramme (intensités non modélisées).' : 'Spectre d’absorption construit à partir du diagramme ; fond continu schématique.')}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Avec l’atome X en émission, clique chaque flèche : quelle transition donne la raie ultraviolette ? et les raies infrarouges ?</li>
      <li>Passe en absorption : combien de raies noires ? Compare avec les raies colorées de l’émission.</li>
      <li>En absorption, déplace le curseur du photon : pour quelles énergies le photon est-il absorbé ? Est-ce une plage ou des valeurs précises ?</li>
      <li>Compare les atomes X, Y et Z : ont-ils les mêmes raies visibles ?</li>
      <li>Au-delà du programme : avec l’hydrogène, repère les raies visibles (série de Balmer) et compare leurs écarts d’énergie.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir titre="Spectres d’émission et d’absorption">
      <SvgAbsSpectre/>
      <ul style={liste}>
        <li><strong>Moyen de s’en souvenir</strong> : « ce que l’atome absorbe, il peut le réémettre ».</li>
        <li>ΔE = |E<sub>f</sub> − E<sub>i</sub>| = h·ν = h·c ÷ λ.</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div className="nv-racine" style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        @font-face { font-family: 'NuGrec'; src: local('Times New Roman'), local('Liberation Serif'), local('Times'), local('Georgia'); unicode-range: U+03BD; }
        .nv-racine { font-family: 'NuGrec', var(--sans), system-ui, sans-serif; }
        .nv-racine button, .nv-racine select, .nv-racine input { font-family: inherit; }
        .nv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .nv-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .nv-main > * + * { margin-top: 12px; }
        @media (max-width: 900px) { .nv-hypo-defi { order: 2; } }
        .nv-l1.cote .nv-carte { order: 2; } .nv-l1.cote .nv-main { order: 1; }
        @media (min-width: 901px) { .nv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
          .nv-ex { grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr); } .nv-ex > .nv-ex-scene { grid-column: 1; grid-row: 1; } .nv-ex > .nv-ex-spectre { grid-column: 1; grid-row: 2; } .nv-ex > .nv-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } }
        @media (prefers-reduced-motion: no-preference) { .nv-in { animation: nv-fondu 0.35s ease-out; } @keyframes nv-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Niveaux d’énergie : absorption, émission et spectres de raies</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {!enGuide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un atome isolé n’a que certaines énergies : ses <strong>niveaux</strong>. Il absorbe ou émet un photon d’énergie ΔE = |E<sub>f</sub> − E<sub>i</sub>| = h·ν = h·c ÷ λ : d’où les <strong>raies</strong> de son spectre.</div>}
      {enExplore ? <>
        <div className="nv-ex">
          <div className="nv-ex-scene">{boite('Diagramme de niveaux (clique une flèche)', exScene)}</div>
          <div className="nv-ex-reglages">{boite('Choisir un atome', <>{exReglages}<div style={{ marginTop: 12, borderTop: `1px solid ${KIT.bord}`, paddingTop: 8 }}>{exMesures}</div></>)}</div>
          <div className="nv-ex-spectre">{boite(ex.mode === 'emission' ? 'Spectre d’émission' : 'Spectre d’absorption', exSpectre)}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`nv-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="nv-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="nv-carte nv-hypo-defi">{panneauHypo}</div> : null}
          <div className="nv-main">
            {enDefi && defi && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'identifier' ? suiviI : defi.type === 'exciter' ? suiviE : suiviH}/></div>}
            {enGuide && <div className="nv-in" key={idE}>{sceneGuide}</div>}
            {enGuide && (derniereEtape || guide.fini) && <div>{panneauHypo}</div>}
          </div>
        </div>
      </>}
    </div>
  );
}
