import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./co2DissousModele";
import { QCM } from "./co2DissousQcm";
import { SceneCO2, SceneDiag, GrapheRepartition, SvgHenry, SvgAcide, SvgPredo, SvgPHGaz, SvgSolub } from "./Co2DissousSchemas";

const SIM_ID = 142, CLE_GUIDE = 'co2-dissous-guide-v1';
declarerDefis(SIM_ID, [['eau', 'L’eau en équilibre avec un gaz'], ['milieu', 'Un milieu de pH imposé']]);

// ====================================================
//  SIM 142 — CO₂ DISSOUS : COUPLES, RÉPARTITION DES ESPÈCES ET SOLUBILITÉ (TSTL, enseignement PCM, séquence 2 « Réactions acido-basiques »).
//  Une seule idée : le CO₂ dissous est un acide faible à deux couples ; sa concentration suit la loi de Henry, la répartition de ses espèces suit le pH,
//  et un milieu basique peut donc contenir beaucoup plus de carbone dissous qu'une eau pure.
//  Notions : loi de Henry, réaction du CO₂ avec l'eau, couples CO₂,H₂O / HCO₃⁻ et HCO₃⁻ / CO₃²⁻, ampholyte, diagramme de prédominance et de distribution,
//  pH d'un acide faible, solubilité apparente selon le pH.
//  Aucune situation des documents du Moodle (sang, océans, eau de chaux) : flacons, bouteille fermée, milieu de pH imposé inventés.
//  Capacités visées (jamais affichées à l'élève) : relier la solubilité du dioxyde de carbone dans différents milieux aux effets associés ;
//  tracer et exploiter un diagramme de prédominance ; écrire les équations acido-basiques ; expression du pH d'un acide faible.
//  Modèle : co2DissousModele.js. Schémas : Co2DissousSchemas.jsx. QCM : co2DissousQcm.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const fmtC = v => {
  if (v !== 0 && (v < 1e-3 || v >= 1e5)) { const e = Math.floor(Math.log10(v)), m = v / 10 ** e; return `${String(Number(m.toFixed(1))).replace('.', ',')} × 10${String(e).split('').map(ch => SUP[ch]).join('')}`; }
  return String(Number(v.toPrecision(3))).replace('.', ',');
};
const nbKPa = P => String(P).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c' };
const PRESET = { P: 20, T: 25, milieu: 'eau', pH: 8 };
const PA = M.PARCOURS, A25 = M.A_T[PA.T], c1 = M.concCO2(PA.P1, PA.T), pH1 = M.pHFormule(c1);
const mm = M.milieu(PA.Pmilieu, PA.T, PA.pHmilieu), rap7 = M.rapportHCO3(PA.pHrapport);
const cAcid1 = M.concCO2(0.4, PA.T), cAcid2 = M.concCO2(40, PA.T);

// ---------- formules (MathML) ----------
const FKa = <FormuleEnLigne><msub><mi>Ka</mi><mn>1</mn></msub><mo>=</mo><mfrac><mrow><mi mathvariant="normal">[HCO₃⁻]</mi><mo>×</mo><mi mathvariant="normal">[H₃O⁺]</mi></mrow><mi mathvariant="normal">[CO₂]</mi></mfrac></FormuleEnLigne>;
const FpH = <Formule><mi>pH</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>(</mo><msub><mi>pKa</mi><mn>1</mn></msub><mo>−</mo><mi>log</mi><mo>[</mo><mi mathvariant="normal">CO</mi><mn>₂</mn><mo>]</mo><mo>)</mo></Formule>;
const F10 = <FormuleEnLigne><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo><mi>pKa</mi></mrow></msup></FormuleEnLigne>;
const FRapport = <Formule><mfrac><mrow><mo>[</mo><mi mathvariant="normal">base</mi><mo>]</mo></mrow><mrow><mo>[</mo><mi mathvariant="normal">acide</mi><mo>]</mo></mrow></mfrac><mo>=</mo><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo><mi>pKa</mi></mrow></msup></Formule>;

const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
function Equation({ deux }) {
  return (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>Réactions acido-basiques du CO₂ dissous (25 °C)</div>
      <div style={{ fontSize: 17, color: KIT.txt, lineHeight: 1.7 }} aria-label="Équations des réactions du dioxyde de carbone dissous avec l’eau">
        <div><Esp>CO₂,H₂O(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> ⇌ <Esp>HCO₃⁻(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp></div>
        {deux && <div><Esp>HCO₃⁻(aq)</Esp> + <Esp>H₂O(ℓ)</Esp> ⇌ <Esp>CO₃²⁻(aq)</Esp> + <Esp>H₃O⁺(aq)</Esp></div>}
      </div>
    </div>);
}
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- flacons de la scène ----------
const ligC = (e, vu) => ({ texte: vu ? `[CO₂] = ${fmtC(e.c)} mmol/L` : '[CO₂] = ?', couleur: COL.orange });
const ligPH = (e, vu) => ({ texte: vu ? `pH = ${nbf(e.pH, 2)}` : 'pH = ?', couleur: COL.bleu });
function flaconGaz(P, T, { c = false, pH = null, avecT = false } = {}) {
  const e = M.eauPure(P, T);
  return { P, T: avecT ? T : null, c: e.c, titre: `P = ${nbKPa(P)} kPa · ${T} °C`, lignes: [ligC(e, c), ...(pH === null ? [] : [ligPH(e, pH)])] };
}
const ionsDe = (P, T, pH) => { const m = M.milieu(P, T, pH); return Math.max(0, Math.min(14, Math.round(2.5 * Math.log10(Math.max(m.hco3 / m.c, 1))))); };
function flaconMilieu(P, T, pH, { ions = false, hco3 = false } = {}) {
  const m = M.milieu(P, T, pH);
  return { P, c: m.c, ions: ions ? ionsDe(P, T, pH) : 0, lignes: [{ texte: `pH imposé : ${nbf(pH, 1)}`, couleur: COL.orange }, hco3 ? { texte: `[HCO₃⁻] = ${fmtC(m.hco3)} mmol/L`, couleur: COL.orange } : { texte: `[CO₂] = ${fmtC(m.c)} mmol/L`, couleur: COL.bleu }] };
}

// ====================================================
export function SimulationCo2Dissous() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviE, noterE] = useCompteurDefi(), [suiviM, noterM] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('eau');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['henry', 'pression', 'temp', 'acide', 'couples', 'diagramme', 'rapport', 'phacide', 'acidifier', 'degaz', 'hco3', 'total', 'basique', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée à chaque étape ----------
  const SC = {
    henry:     { flacons: [flaconGaz(PA.P1, 25)] },
    pression:  { flacons: [flaconGaz(PA.P3, 25)] },
    temp:      { flacons: [flaconGaz(PA.P1, 25, { c: true, avecT: true }), flaconGaz(PA.P1, PA.Tchaud, { avecT: true })] },
    acide:     { flacons: [flaconGaz(PA.P1, 25, { c: true, pH: false })] },
    couples:   { flacons: [flaconGaz(PA.P1, 25, { c: true, pH: false })] },
    diagramme: { diag: { pH: PA.pHdiag, revele: false } },
    rapport:   { diag: { pH: PA.pHrapport, revele: true } },
    phacide:   { flacons: [flaconGaz(PA.P1, 25, { c: true, pH: false })] },
    acidifier: { flacons: [flaconGaz(0.4, 25, { c: true, pH: false }), flaconGaz(40, 25, { c: true, pH: false })] },
    degaz:     { flacons: [flaconGaz(PA.Pbouteille, 25, { c: true, pH: false }), flaconGaz(PA.Pair, 25, { c: true, pH: false })] },
    hco3:      { flacons: [flaconMilieu(PA.Pmilieu, 25, PA.pHmilieu)] },
    total:     { flacons: [flaconMilieu(PA.Pmilieu, 25, PA.pHmilieu, { ions: true, hco3: true })] },
    basique:   { flacons: PA.milieux.map(pH => ({ P: PA.Pmilieu, c: M.concCO2(PA.Pmilieu, 25), lignes: [{ texte: `pH ${pH}`, couleur: COL.orange }] })) },
    bilan:     { flacons: PA.milieux.map(pH => ({ P: PA.Pmilieu, c: M.concCO2(PA.Pmilieu, 25), ions: ionsDe(PA.Pmilieu, 25, pH), lignes: [{ texte: `pH ${pH}`, couleur: COL.orange }] })) },
  };

  const ETAPES = [
    { id: 'henry', titre: 'Un gaz qui se dissout', focus: ['scene'],
      texte: <>Un flacon fermé contient de l’eau pure surmontée d’un gaz qui renferme du dioxyde de carbone : sa <strong>pression partielle</strong> est P(CO₂) = <strong>{PA.P1}{NB}kPa</strong>, à {PA.T}{NB}°C. À l’équilibre, le CO₂ dissous suit la <strong>loi de Henry</strong> : [CO₂] = a × P(CO₂). Le coefficient de solubilité vaut <strong>a = {nbf(A25, 2)}{NB}mmol·L⁻¹·kPa⁻¹</strong> à {PA.T}{NB}°C.</>,
      tache: { type: 'num', q: 'Concentration en CO₂ dissous [CO₂] (en mmol/L)', unite: 'mmol/L', vrai: c1, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [`[CO₂] = a × P(CO₂) = ${nbf(A25, 2)} × ${PA.P1}`, `[CO₂] = ${nbf(c1, 1)} mmol/L (soit ${nbf(c1, 1)} × 10⁻³ mol/L).`],
        pieges: [[PA.P1 / A25, 'Il faut multiplier a par P(CO₂), pas les diviser : [CO₂] = a × P(CO₂).'], [c1 / 1000, 'L’unité demandée est le mmol/L : ne convertissez pas en mol/L ici.'], [A25, 'C’est la valeur de a ; [CO₂] = a × P(CO₂).'], [PA.P1, 'C’est la pression partielle ; [CO₂] = a × P(CO₂).']],
        expl: `[CO₂] = ${nbf(A25, 2)} × ${PA.P1} = ${nbf(c1, 1)} mmol/L.`, indice: 'Loi de Henry : [CO₂] = a × P(CO₂), avec a en mmol·L⁻¹·kPa⁻¹ et P en kPa ; le résultat est directement en mmol/L.' } },
    { id: 'pression', titre: 'Plus de gaz au-dessus, plus de gaz dissous', focus: ['scene'],
      texte: <>On garde la même température ({PA.T}{NB}°C) mais on <strong>triple la pression partielle</strong> du CO₂ : P(CO₂) = <strong>{PA.P3}{NB}kPa</strong>. Rappel : pour {PA.P1}{NB}kPa, [CO₂] valait {nbf(c1, 1)}{NB}mmol/L.</>,
      tache: { type: 'qcm', q: 'Que devient la concentration en CO₂ dissous ?', ...QCM.pression,
        expl: `La loi de Henry est une proportionnalité : [CO₂] = a × P(CO₂). Avec une pression triplée, la concentration est triplée : ${nbf(M.concCO2(PA.P3, 25), 1)} mmol/L.`, indice: 'Dans [CO₂] = a × P(CO₂), a ne change pas à température constante : que devient le produit si P est multipliée par 3 ?' } },
    { id: 'temp', titre: 'Chauffer fait dégazer', focus: ['scene'],
      texte: <>On revient à P(CO₂) = {PA.P1}{NB}kPa et on <strong>chauffe</strong> l’eau de {PA.T} à {PA.Tchaud}{NB}°C. Le coefficient de solubilité est tabulé : a({PA.T}{NB}°C) = <strong>{nbf(A25, 2)}</strong> et a({PA.Tchaud}{NB}°C) = <strong>{nbf(M.A_T[PA.Tchaud], 2)}</strong> mmol·L⁻¹·kPa⁻¹.</>,
      tache: { type: 'qcm', q: 'Comment varie la concentration en CO₂ dissous quand on chauffe ?', ...QCM.temp,
        expl: `[CO₂] = a × P(CO₂) : a passe de ${nbf(A25, 2)} à ${nbf(M.A_T[PA.Tchaud], 2)}, donc [CO₂] passe de ${nbf(c1, 1)} à ${nbf(M.concCO2(PA.P1, PA.Tchaud), 1)} mmol/L. Un gaz est moins soluble dans l’eau chaude.`, indice: 'Comparez les deux valeurs de a : laquelle est la plus grande ? La pression reste égale à 20 kPa.' } },
    { id: 'acide', titre: 'Le CO₂ dissous est un acide', focus: ['scene'],
      retenirTitre: 'À RETENIR : LA LOI DE HENRY',
      retenir: <>
        <SvgHenry/>
        <ul style={puces}>
          <li>À température fixée, la concentration en CO₂ dissous est <strong>proportionnelle</strong> à sa pression partielle : [CO₂] = a × P(CO₂) (loi de Henry).</li>
          <li>Exemple de la simulation : à 25 °C, 20 kPa donnent {nbf(c1, 1)} mmol/L et 60 kPa donnent trois fois plus. Un gaz est <strong>moins soluble à chaud</strong> : a diminue quand T augmente.</li>
          <li>Moyen de s’en souvenir : <strong>« plus de gaz au-dessus, plus de gaz dissous ; plus chaud, moins dissous »</strong>.</li>
        </ul></>,
      texte: <>Le CO₂ dissous réagit en partie avec l’eau : <strong>CO₂,H₂O + H₂O ⇌ HCO₃⁻ + H₃O⁺</strong> (couple CO₂,H₂O / HCO₃⁻). L’eau pure, de pH 7,0, est maintenant en équilibre avec le gaz à {PA.P1}{NB}kPa : [CO₂] = {nbf(c1, 1)}{NB}mmol/L. Le pH de l’eau est affiché « ? » dans le flacon.</>,
      tache: { type: 'qcm', q: 'Le pH de cette eau est…', ...QCM.acide,
        expl: 'La réaction du CO₂ dissous avec l’eau forme des ions H₃O⁺ : l’eau devient acide, son pH est inférieur à 7. Le pH ne dépend pas du volume d’eau, seulement de [CO₂].', indice: 'Regardez le second produit de la réaction CO₂,H₂O + H₂O ⇌ HCO₃⁻ + H₃O⁺ : quelle espèce rend une solution acide ?' } },
    { id: 'couples', titre: 'Deux couples acide/base', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE CO₂ DISSOUS EST UN ACIDE',
      retenir: <>
        <SvgAcide/>
        <ul style={puces}>
          <li>Le CO₂ dissous est un <strong>acide faible</strong> : CO₂,H₂O + H₂O ⇌ HCO₃⁻ + H₃O⁺. Il rend l’eau <strong>acide</strong> (pH inférieur à 7).</li>
          <li>Exemple de la simulation : l’eau en équilibre avec l’air, à 25 °C, a un pH voisin de {nbf(M.eauPure(M.PARCOURS.Pair).pH, 1)}.</li>
          <li>Moyen de s’en souvenir : <strong>« le CO₂ dissous est un acide faible »</strong>.</li>
        </ul></>,
      texte: <>Le CO₂ dissous met en jeu <strong>deux couples</strong> : CO₂,H₂O / HCO₃⁻ de <strong>pKa1 = {nbf(M.PKA1, 2)}</strong> et HCO₃⁻ / CO₃²⁻ de <strong>pKa2 = {nbf(M.PKA2, 1)}</strong> (25 °C). L’ion hydrogénocarbonate HCO₃⁻ apparaît dans les deux couples.</>,
      tache: { type: 'qcm', q: 'Quel est le rôle de l’ion HCO₃⁻ ?', ...QCM.couples,
        expl: 'HCO₃⁻ est la base du couple CO₂,H₂O / HCO₃⁻ (il capte un proton) et l’acide du couple HCO₃⁻ / CO₃²⁻ (il en cède un) : c’est un ampholyte.', indice: 'Dans chaque couple, repérez si HCO₃⁻ est écrit à droite (base) ou à gauche (acide) du « / ».' } },
    { id: 'diagramme', titre: 'Quelle espèce prédomine ?', focus: ['scene'],
      texte: <>À {PA.T}{NB}°C, pKa1 = {nbf(M.PKA1, 2)} et pKa2 = {nbf(M.PKA2, 1)}. On étudie une solution de <strong>pH {nbf(PA.pHdiag, 1)}</strong> (repère rouge sur l’axe). Une espèce d’un couple <strong>prédomine</strong> quand sa concentration est la plus grande.</>,
      tache: { type: 'qcm', q: 'Quelle espèce prédomine à pH 8,0 ?', ...QCM.diagramme,
        expl: 'Pour un couple : l’acide prédomine si pH < pKa, la base si pH > pKa. À pH 8,0, on a pKa1 < pH < pKa2 : CO₂,H₂O n’est plus majoritaire (pH > pKa1) et CO₃²⁻ non plus (pH < pKa2) : c’est HCO₃⁻.', indice: 'Placez pH 8,0 par rapport à pKa1 = 6,35 puis par rapport à pKa2 = 10,3 : au-dessus d’un pKa, c’est la base du couple qui prédomine.' } },
    { id: 'rapport', titre: 'Le rapport des deux formes', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : DEUX COUPLES, TROIS ESPÈCES',
      retenir: <>
        <SvgPredo/>
        <ul style={puces}>
          <li>Deux couples, CO₂,H₂O / HCO₃⁻ (pKa1 = 6,35) et HCO₃⁻ / CO₃²⁻ (pKa2 = 10,3) : <strong>HCO₃⁻ est un ampholyte</strong>. Une espèce prédomine selon le pH ; <strong>à pH = pKa</strong>, les deux formes du couple ont la même concentration.</li>
          <li>Rapport des deux formes d’un couple : {FRapport}</li>
          <li>Moyen de s’en souvenir : <strong>« pKa, c’est le point 50-50 »</strong>.</li>
        </ul></>,
      texte: <>Pour un couple acide/base : {FRapport}Dans une solution de <strong>pH {nbf(PA.pHrapport, 1)}</strong>, on s’intéresse au couple 1, CO₂,H₂O / HCO₃⁻, de pKa1 = {nbf(M.PKA1, 2)}.</>,
      tache: { type: 'num', q: 'Rapport frac([HCO₃⁻]|[CO₂]) à pH 7,0 (sans unité)', unite: '(sans unité)', vrai: rap7, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [`pH − pKa1 = ${nbf(PA.pHrapport, 1)} − ${nbf(M.PKA1, 2)} = ${nbf(PA.pHrapport - M.PKA1, 2)}`, `frac([HCO₃⁻]|[CO₂]) = 10^(${nbf(PA.pHrapport - M.PKA1, 2)}) = ${nbf(rap7, 1)} (sans unité).`],
        pieges: [[1 / rap7, 'Le rapport est inversé : on demande la base HCO₃⁻ sur l’acide CO₂,H₂O.'], [PA.pHrapport - M.PKA1, 'C’est pH − pKa1, le logarithme du rapport : il faut calculer 10 puissance cette valeur (touche 10ˣ).'], [10 ** (PA.pHrapport - M.PKA2), 'Vous avez utilisé pKa2 : le couple CO₂,H₂O / HCO₃⁻ a pour pKa1 = 6,35.']],
        expl: `10^(${nbf(PA.pHrapport - M.PKA1, 2)}) ≈ ${nbf(rap7, 1)} : à pH 7,0, HCO₃⁻ est environ ${nbf(rap7, 1)} fois plus concentré que CO₂,H₂O.`, indice: 'Rapport base sur acide = 10 puissance (pH − pKa) : calculez d’abord pH − pKa1, puis 10 puissance ce nombre.' } },
    { id: 'phacide', titre: 'Le pH de l’eau en équilibre avec le gaz', focus: ['scene'],
      texte: <>Pour l’eau pure en équilibre avec le gaz à {PA.P1}{NB}kPa, [CO₂] = {nbf(c1, 1)}{NB}mmol/L = <strong>{nbf(c1, 1)} × 10⁻³ mol/L</strong>. Le CO₂ dissous est un acide faible : la réaction forme autant de H₃O⁺ que de HCO₃⁻ ([H₃O⁺] = [HCO₃⁻]) et, avec {FKa}, on obtient (on néglige CO₃²⁻ et HO⁻) : {FpH}Utilisez pKa1 = {nbf(M.PKA1, 2)} et [CO₂] en mol/L.</>,
      tache: { type: 'num', q: 'pH de l’eau en équilibre avec le gaz à 20 kPa', unite: '(sans unité)', vrai: pH1, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => [`[CO₂] = ${nbf(c1, 1)} × 10⁻³ mol/L, donc log([CO₂]) = ${nbf(Math.log10(c1 * 1e-3), 2)}`, `pH = ½ (6,35 − (${nbf(Math.log10(c1 * 1e-3), 2)})) = ½ × ${nbf(M.PKA1 - Math.log10(c1 * 1e-3), 2)} = ${nbf(pH1, 2)}.`],
        pieges: [[M.PKA1 - Math.log10(c1 * 1e-3), 'Il manque le facteur ½ : pH = ½ (pKa1 − log [CO₂]).'], [-Math.log10(c1 * 1e-3), 'C’est − log [CO₂] seulement : il faut ½ (pKa1 − log [CO₂]).'], [0.5 * (M.PKA1 - Math.log10(c1)), 'La concentration doit être en mol/L : 6,6 mmol/L = 6,6 × 10⁻³ mol/L.']],
        expl: `pH = ½ (6,35 − log(${nbf(c1, 1)} × 10⁻³)) = ${nbf(pH1, 2)} : une eau saturée en CO₂ à 20 kPa est nettement acide.`, indice: 'Convertissez [CO₂] en mol/L (÷ 1 000), calculez son logarithme décimal (négatif), soustrayez-le à pKa1 puis divisez par 2.' } },
    { id: 'acidifier', titre: 'Un gaz plus riche en CO₂', focus: ['scene'],
      texte: <>On compare deux flacons d’eau pure à {PA.T}{NB}°C : le gaz du premier est à <strong>0,40{NB}kPa</strong> et celui du second à <strong>40{NB}kPa</strong>, soit une pression partielle <strong>multipliée par 100</strong>. Les concentrations [CO₂] sont {fmtC(cAcid1)} et {fmtC(cAcid2)}{NB}mmol/L : elles aussi dans un rapport 100. Utilisez la formule du pH de l’étape précédente.</>,
      tache: { type: 'num', q: 'De combien d’unités le pH baisse-t-il entre le premier et le second flacon ?', unite: 'unités de pH', vrai: 1, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Avec [CO₂] multipliée par 100, log([CO₂]) augmente de log(100) = 2.', 'pH = ½ (pKa1 − log [CO₂]) diminue de ½ × 2 = 1,0 unité.'],
        pieges: [[2, 'Vous avez oublié le facteur ½ : pH = ½ (pKa1 − log [CO₂]), donc la variation est la moitié de celle de log [CO₂].'], [0.5, 'Une variation de 0,5 unité correspond à une pression multipliée par 10, pas par 100.'], [100, 'Le pH varie comme le logarithme de la concentration, pas comme la concentration.']],
        expl: 'log(100) = 2, et le pH est la moitié de (pKa1 − log [CO₂]) : le pH baisse de 1,0 unité quand la pression est multipliée par 100 (0,5 unité par facteur 10).', indice: 'Comparez les deux valeurs de log([CO₂]) : de combien augmentent-elles quand [CO₂] est multipliée par 100 ? Puis prenez la moitié.' } },
    { id: 'degaz', titre: 'Ouvrir la bouteille', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE pH SELON LA PRESSION DE CO₂',
      retenir: <>
        <SvgPHGaz/>
        <ul style={puces}>
          <li>Eau pure en équilibre avec un gaz : [H₃O⁺] = [HCO₃⁻] et {FKa} donnent <strong>pH = ½ (pKa1 − log [CO₂])</strong>, avec [CO₂] en mol/L.</li>
          <li>Exemple de la simulation (25 °C) : à 1 kPa, pH 4,9 ; à 100 kPa, pH 3,9 : <strong>pression × 100, pH − 1 unité</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« plus de CO₂ dans le gaz, eau plus acide »</strong>.</li>
        </ul></>,
      texte: <>Une <strong>bouteille fermée</strong> contient de l’eau en équilibre avec un gaz à <strong>{PA.Pbouteille}{NB}kPa</strong> de CO₂. On l’ouvre et on la laisse longtemps à l’air, où la pression partielle du CO₂ vaut <strong>{nbKPa(PA.Pair)}{NB}kPa</strong> : le CO₂ dissous s’échappe jusqu’à un nouvel équilibre.</>,
      tache: { type: 'qcm', q: 'Que devient le pH de l’eau ?', ...QCM.degaz,
        expl: `Quand la pression partielle diminue, [CO₂] diminue, donc il se forme moins d’ions H₃O⁺ : le pH augmente (de ${nbf(M.eauPure(PA.Pbouteille).pH, 1)} environ à ${nbf(M.eauPure(PA.Pair).pH, 1)}). Il ne devient pas 7 : l’air contient encore un peu de CO₂.`, indice: 'Reprenez pH = ½ (pKa1 − log [CO₂]) : que devient le pH quand [CO₂] diminue ? Et l’air contient-il du CO₂ ?' } },
    { id: 'hco3', titre: 'Un milieu de pH imposé', focus: ['scene'],
      texte: <>Un milieu naturel, dont le <strong>pH est maintenu à {nbf(PA.pHmilieu, 1)}</strong> par d’autres espèces dissoutes, est en équilibre à {PA.T}{NB}°C avec un gaz à <strong>{nbKPa(PA.Pmilieu)}{NB}kPa</strong> de CO₂ : la loi de Henry donne toujours [CO₂] = <strong>{fmtC(mm.c)}{NB}mmol/L</strong>. Mais à ce pH, le CO₂ dissous se répartit entre ses trois espèces. On a : [HCO₃⁻] = [CO₂] × {F10} avec pKa = pKa1.</>,
      tache: { type: 'num', q: 'Concentration [HCO₃⁻] dans ce milieu (en mmol/L)', unite: 'mmol/L', vrai: mm.hco3, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [`frac([HCO₃⁻]|[CO₂]) = 10^(${nbf(PA.pHmilieu, 1)} − ${nbf(M.PKA1, 2)}) = 10^(${nbf(PA.pHmilieu - M.PKA1, 2)}) = ${nbf(M.rapportHCO3(PA.pHmilieu), 1)}`, `[HCO₃⁻] = ${fmtC(mm.c)} × ${nbf(M.rapportHCO3(PA.pHmilieu), 1)} = ${nbf(mm.hco3, 1)} mmol/L.`],
        pieges: [[mm.c / M.rapportHCO3(PA.pHmilieu), 'Le rapport est inversé : [HCO₃⁻] est plus grand que [CO₂] à ce pH, car pH > pKa1.'], [M.rapportHCO3(PA.pHmilieu), 'C’est le rapport frac([HCO₃⁻]|[CO₂]) : il faut encore le multiplier par [CO₂] = 0,132 mmol/L.'], [mm.c * M.rapportCO3(PA.pHmilieu), 'Vous avez calculé [CO₃²⁻] : on demande [HCO₃⁻], avec pKa1 et non pKa2.']],
        expl: `[HCO₃⁻] = ${fmtC(mm.c)} × ${nbf(M.rapportHCO3(PA.pHmilieu), 1)} = ${nbf(mm.hco3, 1)} mmol/L : environ ${nbf(M.rapportHCO3(PA.pHmilieu), 0)} fois plus que le CO₂ moléculaire.`, indice: 'Calculez d’abord le rapport 10 puissance (pH − pKa1), puis multipliez-le par [CO₂] = 0,132 mmol/L.' } },
    { id: 'total', titre: 'Le carbone dissous total', focus: ['scene', 'mesures'],
      texte: <>Dans ce milieu de pH {nbf(PA.pHmilieu, 1)} : [CO₂] = {fmtC(mm.c)}{NB}mmol/L, [HCO₃⁻] = {nbf(mm.hco3, 1)}{NB}mmol/L et [CO₃²⁻] = {nbf(mm.co3, 3)}{NB}mmol/L. Le <strong>carbone inorganique dissous total</strong> est C<sub>T</sub> = [CO₂] + [HCO₃⁻] + [CO₃²⁻]. Dans une eau pure qui ne contiendrait que du CO₂ moléculaire, il vaudrait [CO₂].</>,
      tache: { type: 'num', q: 'Combien de fois plus de carbone dissous (frac(C_T|[CO₂]), sans unité) ?', unite: '(sans unité)', vrai: mm.solub, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => [`C_T = ${fmtC(mm.c)} + ${nbf(mm.hco3, 1)} + ${nbf(mm.co3, 3)} = ${nbf(mm.ct, 2)} mmol/L`, `frac(C_T|[CO₂]) = frac(${nbf(mm.ct, 2)}|${fmtC(mm.c)}) = ${nbf(mm.solub, 0)} (sans unité).`],
        pieges: [[mm.ct, 'C’est C_T en mmol/L : on demande le rapport C_T divisé par [CO₂].'], [mm.c / mm.ct, 'Le rapport est inversé : C_T est plus grand que [CO₂].'], [1, 'Ce serait le cas sans HCO₃⁻ ni CO₃²⁻ : à ce pH, le CO₂ s’est transformé en grande partie.']],
        expl: `C_T = ${nbf(mm.ct, 2)} mmol/L pour [CO₂] = ${fmtC(mm.c)} mmol/L : le milieu contient environ ${nbf(mm.solub, 0)} fois plus de carbone dissous qu’une eau pure à la même pression. À pH 8,0, CO₃²⁻ est négligeable.`, indice: 'Additionnez les trois concentrations pour obtenir C_T, puis divisez C_T par [CO₂] = 0,132 mmol/L.' } },
    { id: 'basique', titre: 'Quel milieu dissout le plus de CO₂ ?', focus: ['scene'],
      texte: <>On compare quatre milieux dont le pH est imposé à <strong>3, 6, 8 et 10</strong>, tous à {PA.T}{NB}°C et en équilibre avec le même gaz ({nbKPa(PA.Pmilieu)}{NB}kPa) : [CO₂] est donc la même dans les quatre. On compare le <strong>carbone dissous total</strong> C<sub>T</sub>.</>,
      tache: { type: 'qcm', q: 'Quel milieu contient le plus de carbone dissous ?', ...QCM.basique,
        expl: 'La loi de Henry ne fixe que [CO₂]. À pH 10, pH > pKa1 de plus de 3 unités : le CO₂ est transformé en HCO₃⁻ et en CO₃²⁻, qui s’ajoutent à [CO₂]. À pH 3, pH < pKa1 : presque tout le carbone reste sous forme de CO₂ moléculaire.', indice: 'Pour chaque pH, comparez-le à pKa1 et à pKa2 : plus le pH est supérieur, plus la part de HCO₃⁻ et de CO₃²⁻ augmente.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : PLUS BASIQUE, PLUS DE CO₂ DISSOUS',
      retenir: <>
        <SvgSolub/>
        <ul style={puces}>
          <li>Dans un milieu de pH imposé, [CO₂] reste fixée par la loi de Henry, mais le CO₂ se transforme en HCO₃⁻ puis CO₃²⁻ : le milieu contient d’autant plus de carbone dissous qu’il est <strong>basique</strong>.</li>
          <li>Exemple de la simulation : le carbone dissous total est 1,0 fois [CO₂] à pH 3, {nbf(M.milieu(0.4, 25, 8).solub, 0)} fois à pH 8 et plus de 6 000 fois à pH 10.</li>
          <li>Moyen de s’en souvenir : <strong>« milieu basique : le CO₂ se dissout et se transforme ; milieu acide : il s’échappe »</strong>.</li>
        </ul></>,
      texte: <>Vous savez appliquer la loi de Henry, écrire les deux couples du CO₂ dissous, placer les domaines de prédominance, calculer le pH d’une eau en équilibre avec un gaz et comparer la quantité de carbone dissous selon le pH du milieu. Explorez maintenant, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'eau' ? { ...M.tirageEau(), reps: { c: '', pH: '' }, verifie: false } : { ...M.tirageMilieu(), reps: { hco3: '', s: '' }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'eau') {
      const c = lireNombre(defi.reps.c), ph = lireNombre(defi.reps.pH);
      const ok = isFinite(c) && isFinite(ph) && proche(c, defi.c, 0.05) && proche(ph, defi.pH, 0.02);
      setDefi(d => ({ ...d, verifie: true, ok })); noterE(ok);
    } else {
      const h = lireNombre(defi.reps.hco3), s = lireNombre(defi.reps.s);
      const ok = isFinite(h) && isFinite(s) && proche(h, defi.hco3, 0.05) && proche(s, defi.solub, 0.05);
      setDefi(d => ({ ...d, verifie: true, ok })); noterM(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('co-verif')?.click()} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e2.target.value }, verifie: false }))} inputMode="decimal"
      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['eau', 'Eau et gaz'], ['milieu', 'Milieu de pH imposé']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'eau' ? 'Défi : l’eau en équilibre avec un gaz' : 'Défi : un milieu de pH imposé'}</div>
      {defi.type === 'eau' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une eau pure est en équilibre, à <strong>{defi.T}{NB}°C</strong>, avec un gaz dont la pression partielle en CO₂ vaut <strong>{nbKPa(defi.P)}{NB}kPa</strong>. Le coefficient de solubilité vaut a = <strong>{nbf(defi.a, 2)}{NB}mmol·L⁻¹·kPa⁻¹</strong> et pKa1 = {nbf(M.PKA1, 2)}. Calculez [CO₂] (en mmol/L, 2 chiffres significatifs), puis le pH de l’eau (2 décimales).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>[CO₂] (mmol/L) =</span>{champ('c', 'Concentration en CO₂ dissous en millimoles par litre', defi.ok || proche(lireNombre(defi.reps.c), defi.c, 0.05))}
          <span>pH =</span>{champ('pH', 'pH de l’eau', defi.ok || proche(lireNombre(defi.reps.pH), defi.pH, 0.02))}
        </div>
        <IndiceDefi cache={false}>Loi de Henry : [CO₂] = a × P(CO₂) (en mmol/L). Puis pH = ½ (pKa1 − log [CO₂]) avec [CO₂] converti en mol/L (1 mmol/L = 10⁻³ mol/L).</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un milieu dont le pH est maintenu à <strong>{nbf(defi.pH, 1)}</strong> est en équilibre, à <strong>{defi.T}{NB}°C</strong>, avec un gaz de pression partielle en CO₂ <strong>{nbKPa(defi.P)}{NB}kPa</strong> (a = {nbf(defi.a, 2)}{NB}mmol·L⁻¹·kPa⁻¹ ; pKa1 = {nbf(M.PKA1, 2)} ; pKa2 = {nbf(M.PKA2, 1)}). Calculez [HCO₃⁻] (en mmol/L, 2 chiffres significatifs), puis le rapport {avecIndices('frac(C_T|[CO₂])')} où C<sub>T</sub> = [CO₂] + [HCO₃⁻] + [CO₃²⁻] (2 chiffres significatifs).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>[HCO₃⁻] (mmol/L) =</span>{champ('hco3', 'Concentration en HCO₃⁻ en millimoles par litre', defi.ok || proche(lireNombre(defi.reps.hco3), defi.hco3, 0.05))}
          <span>C<sub>T</sub> sur [CO₂] =</span>{champ('s', 'Rapport du carbone dissous total à la concentration en CO₂', defi.ok || proche(lireNombre(defi.reps.s), defi.solub, 0.05))}
        </div>
        <IndiceDefi cache={false}>[CO₂] = a × P(CO₂). Puis [HCO₃⁻] = [CO₂] × 10 puissance (pH − pKa1) et [CO₃²⁻] = [HCO₃⁻] × 10 puissance (pH − pKa2) ; enfin C<sub>T</sub> est la somme des trois et on divise par [CO₂].</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="co-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.type === 'eau'
          ? `[CO₂] = ${nbf(defi.a, 2)} × ${nbKPa(defi.P)} = ${fmtC(defi.c)} mmol/L ; pH = ½ (${nbf(M.PKA1, 2)} − log(${fmtC(defi.c)} × 10⁻³)) = ${nbf(defi.pH, 2)}.`
          : `[CO₂] = ${fmtC(defi.c)} mmol/L ; [HCO₃⁻] = ${fmtC(defi.c)} × 10^(${nbf(defi.pH - M.PKA1, 2)}) = ${fmtC(defi.hco3)} mmol/L ; [CO₃²⁻] = ${fmtC(defi.co3)} mmol/L ; frac(C_T|[CO₂]) = frac(${fmtC(defi.ct)}|${fmtC(defi.c)}) = ${nbf(M.arrondiCS(defi.solub, 2), defi.solub >= 10 ? 0 : 1)}.`))}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Les pKa sont ceux de 25 °C</strong> (6,35 et 10,3, valeurs usuelles données et non à retrouver). La température ne modifie ici que le coefficient de Henry a(T), tabulé (valeurs arrondies à 5, 15, 25 et 35 °C) : on néglige l’effet de la température sur les pKa.</li>
      <li><strong>Loi de Henry</strong> : [CO₂] = a × P(CO₂), valable pour de faibles concentrations ; le gaz est un <strong>réservoir</strong> dont la pression partielle ne change pas quand du CO₂ se dissout. 1 mmol/L = 10⁻³ mol/L ; activités ≈ concentrations.</li>
      <li><strong>Eau pure</strong> : le pH affiché est calculé avec la conservation de la charge (H₃O⁺, HCO₃⁻, CO₃²⁻, HO⁻). La formule du cours pH = ½ (pKa1 − log [CO₂]) néglige CO₃²⁻ et HO⁻ ; elle s’écarte de ce calcul de moins de 0,01 unité dans toutes les situations proposées.</li>
      <li><strong>Milieu de pH imposé</strong> : on suppose que d’autres espèces dissoutes, qui ne contiennent pas de carbone, maintiennent le pH constant. C’est une hypothèse forte : dans un milieu réel peu tamponné, le CO₂ dissous ferait varier le pH. Les concentrations très élevées (pH élevé, gaz riche en CO₂) ne sont pas réalistes : on ne tient pas compte de la limite de solubilité des sels.</li>
      <li><strong>Carbone dissous total</strong> C<sub>T</sub> = [CO₂] + [HCO₃⁻] + [CO₃²⁻] : c’est la grandeur qui mesure la « solubilité apparente » du CO₂ dans le milieu. Seule la part [CO₂] suit la loi de Henry.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, réglages, mesures ----------
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const eExp = M.eauPure(ti.P, ti.T), mExp = M.milieu(ti.P, ti.T, ti.pH), tampon = ti.milieu === 'tampon';
  const sg = enGuide ? SC[idE] : null;
  const flaconsExplore = [tampon
    ? { P: ti.P, c: mExp.c, ions: ionsDe(ti.P, ti.T, ti.pH), titre: '', lignes: [{ texte: `pH imposé : ${nbf(ti.pH, 1)}`, couleur: COL.orange }, { texte: `[CO₂] = ${fmtC(mExp.c)} mmol/L`, couleur: COL.bleu }] }
    : { P: ti.P, c: eExp.c, ions: 0, lignes: [{ texte: `[CO₂] = ${fmtC(eExp.c)} mmol/L`, couleur: COL.orange }, { texte: `pH = ${nbf(eExp.pH, 2)}`, couleur: COL.bleu }] }];
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enGuide ? (sg.diag ? 'Axe de pH' : sg.flacons.length > 1 ? 'Flacons fermés' : 'Flacon fermé') : 'Flacon fermé : gaz et eau'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Les points noirs sont des molécules de CO₂ (dans le gaz ou dissoutes) ; les points orange sont des ions HCO₃⁻.</div>}
      {enGuide && sg.diag ? <SceneDiag pH={sg.diag.pH} revele={sg.diag.revele}/> : <SceneCO2 flacons={enGuide ? sg.flacons : flaconsExplore}/>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="co-p" style={libelle}>Pression partielle du CO₂ dans le gaz</label>
      <select id="co-p" value={ti.P} onChange={ev => setTi(s => ({ ...s, P: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.PRESSIONS.map(P => <option key={P} value={P}>{nbKPa(P)} kPa{P === 0.04 ? ' (air)' : P === 300 ? ' (bouteille fermée)' : ''}</option>)}
      </select>
      <label htmlFor="co-t" style={libelle}>Température</label>
      <select id="co-t" value={ti.T} onChange={ev => setTi(s => ({ ...s, T: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.TEMPS.map(T => <option key={T} value={T}>{T} °C (a = {nbf(M.A_T[T], 2)})</option>)}
      </select>
      <label htmlFor="co-m" style={libelle}>Milieu</label>
      <select id="co-m" value={ti.milieu} onChange={ev => setTi(s => ({ ...s, milieu: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
        <option value="eau">Eau pure (le pH vient du CO₂)</option>
        <option value="tampon">Milieu de pH imposé</option>
      </select>
      {tampon && <Curseur nom="pH imposé" valeur={ti.pH} onChange={v => setTi(s => ({ ...s, pH: v }))} min={2} max={13} pas={0.5} decimales={1} couleur="#c2410c"/>}
      <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0 0', lineHeight: 1.5 }}>{tampon ? 'Le pH est maintenu constant par d’autres espèces dissoutes ; [CO₂] reste fixée par la loi de Henry.' : 'Le pH de l’eau pure est calculé à partir de [CO₂] seule.'}</div>
    </div>);
  const MES = {
    henry:     [['a (25 °C)', `${nbf(A25, 2)}${NB}mmol·L⁻¹·kPa⁻¹`]],
    pression:  [['a (25 °C)', `${nbf(A25, 2)}${NB}mmol·L⁻¹·kPa⁻¹`], ['[CO₂] pour 20 kPa', `${nbf(c1, 1)}${NB}mmol/L`, COL.orange]],
    temp:      [['a (25 °C)', `${nbf(A25, 2)}`], ['a (35 °C)', `${nbf(M.A_T[PA.Tchaud], 2)}`]],
    acide:     [['P(CO₂)', `${PA.P1}${NB}kPa`], ['[CO₂]', `${nbf(c1, 1)}${NB}mmol/L`, COL.orange]],
    couples:   [['pKa1', nbf(M.PKA1, 2)], ['pKa2', nbf(M.PKA2, 1)]],
    diagramme: [['pKa1', nbf(M.PKA1, 2)], ['pKa2', nbf(M.PKA2, 1)]],
    rapport:   [['pKa1', nbf(M.PKA1, 2)], ['pH de la solution', nbf(PA.pHrapport, 1), COL.rouge]],
    phacide:   [['[CO₂]', `${nbf(c1, 1)}${NB}mmol/L`, COL.orange], ['pKa1', nbf(M.PKA1, 2)]],
    acidifier: [['[CO₂] du flacon 1', `${fmtC(cAcid1)}${NB}mmol/L`, COL.orange], ['[CO₂] du flacon 2', `${fmtC(cAcid2)}${NB}mmol/L`, COL.orange]],
    degaz:     [['Pression avant', `${PA.Pbouteille}${NB}kPa`], ['Pression après', `${nbKPa(PA.Pair)}${NB}kPa`]],
    hco3:      [['pH imposé', nbf(PA.pHmilieu, 1), COL.rouge], ['[CO₂]', `${fmtC(mm.c)}${NB}mmol/L`, COL.orange]],
    total:     [['[CO₂]', `${fmtC(mm.c)}${NB}mmol/L`, COL.orange], ['[HCO₃⁻]', `${nbf(mm.hco3, 1)}${NB}mmol/L`, COL.bleu], ['[CO₃²⁻]', `${nbf(mm.co3, 3)}${NB}mmol/L`, COL.vert]],
  };
  const lignesGuide = enGuide ? (MES[idE] ?? []) : [];
  const montrerMesures = enExplore || (enGuide && lignesGuide.length > 0);
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Données'}</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Concentrations des espèces du carbone, pH et carbone dissous total pour le réglage choisi.</div>}
      {enGuide ? lignesGuide.map(([n, v, col]) => <LigneMesure key={n} nom={n} valeur={v} couleur={col}/>) : <>
        <LigneMesure nom="a (loi de Henry)" valeur={`${nbf(M.A_T[ti.T], 2)}${NB}mmol·L⁻¹·kPa⁻¹`}/>
        <LigneMesure nom="[CO₂]" valeur={`${fmtC(tampon ? mExp.c : eExp.c)}${NB}mmol/L`} couleur={COL.bleu}/>
        <LigneMesure nom={tampon ? 'pH imposé' : 'pH de l’eau'} valeur={nbf(tampon ? ti.pH : eExp.pH, 2)} couleur="#b91c1c"/>
        {!tampon && <LigneMesure nom="pH par la formule du cours" valeur={nbf(eExp.pHFormule, 2)}/>}
        <LigneMesure nom="[HCO₃⁻]" valeur={`${fmtC(tampon ? mExp.hco3 : eExp.hco3)}${NB}mmol/L`} couleur={COL.orange}/>
        <LigneMesure nom="[CO₃²⁻]" valeur={`${fmtC(tampon ? mExp.co3 : eExp.co3)}${NB}mmol/L`} couleur={COL.vert}/>
        <LigneMesure nom={'Carbone dissous total C_T'} valeur={`${fmtC(tampon ? mExp.ct : eExp.ct)}${NB}mmol/L`}/>
        <LigneMesure nom={'Rapport frac(C_T|[CO₂])'} valeur={fmtC(tampon ? mExp.solub : eExp.ct / eExp.c)}/>
        {tampon && mExp.ct > 1000 && <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, fontWeight: 700, color: COL.rouge }}>Concentration irréaliste (plus de 1 mol/L) : un vrai milieu ne garderait pas ce pH.</div>}
        {tampon && <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, fontWeight: 700, color: COL.vert }}>Espèce prédominante : {{ CO2: 'CO₂,H₂O', HCO3: 'HCO₃⁻', CO3: 'CO₃²⁻' }[M.especePredominante(ti.pH)]}.</div>}
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Triplez la pression : que devient [CO₂] ? Passez de 25 à 35 °C : que devient-elle ?</li>
      <li>Eau pure : comparez le pH de l’eau en équilibre avec l’air (0,04 kPa) et avec la bouteille fermée (300 kPa).</li>
      <li>Milieu de pH imposé : déplacez le curseur de pH 4 à 12 et suivez [HCO₃⁻] et [CO₃²⁻] : à quel pH chaque espèce prédomine-t-elle ?</li>
      <li>Réglez le pH sur 6,35 puis 10,3 : que valent les rapports entre les formes ? Que dit le diagramme de distribution ?</li>
      <li>À pression égale, comparez le carbone dissous total à pH 4 et à pH 10.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Loi de Henry : [CO₂] = a × P(CO₂) ; a diminue quand la température augmente</li>
        <li>CO₂,H₂O + H₂O ⇌ HCO₃⁻ + H₃O⁺ (pKa1 = 6,35) ; HCO₃⁻ + H₂O ⇌ CO₃²⁻ + H₃O⁺ (pKa2 = 10,3) ; HCO₃⁻ est un ampholyte</li>
        <li>Prédominance : CO₂,H₂O si pH &lt; pKa1 ; HCO₃⁻ entre pKa1 et pKa2 ; CO₃²⁻ si pH &gt; pKa2 ; {F10} = rapport base sur acide</li>
        <li>Eau en équilibre avec un gaz : pH = ½ (pKa1 − log [CO₂]) ; pression × 100, pH − 1 unité</li>
        <li>Milieu basique : le CO₂ se transforme en HCO₃⁻ et CO₃²⁻ : le carbone dissous total augmente avec le pH</li>
      </ul>
    </ARetenir>);
  const resume = `${nbKPa(ti.P)} kPa · ${ti.T} °C · ${tampon ? `pH imposé ${nbf(ti.pH, 1)}` : 'eau pure'}`;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .co-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .co-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .co-col { display: flex; flex-direction: column; gap: 12px; }
        .co-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .co-l1.cote .co-carte { order: 2; } .co-l1.cote .co-main { order: 1; }
          .co-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .co-ex > * { grid-column: 1; }
          .co-ex > .co-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .co-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .co-in { animation: co-fondu 0.35s ease-out; } @keyframes co-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>CO₂ dissous : couples, répartition des espèces et solubilité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le <strong>CO₂ dissous</strong> est un acide faible qui met en jeu deux couples. Sa concentration suit la <strong>loi de Henry</strong> ; ses espèces se répartissent selon le <strong>pH</strong>. On apprend à calculer le pH d’une eau en équilibre avec un gaz et à comparer la quantité de CO₂ dissous selon le milieu.</div>
      {!enExplore && <div className={`co-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="co-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="co-carte">{panneauHypo}</div>}
        <div className="co-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'eau' ? suiviE : suiviM}/></div>}
          {enGuide && <div className="co-col">
            {deja('acide') && <Equation deux={apres('couples')}/>}
            <div className="co-in">{scene}</div>
            {mesures && <div className="co-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="co-ex">
          <Equation deux/>
          {scene}
          <div className="co-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre={`Diagramme de distribution des espèces du CO₂ dissous${tampon ? ` (pH ${nbf(ti.pH, 1)})` : ''}`} ouvert={!!ouv.graphe} onBascule={() => bascule('graphe')}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Part de chaque espèce du carbone dissous selon le pH. Le repère rouge est le pH imposé (en milieu de pH imposé) ou le pH de l’eau pure (pour l’eau pure) : <strong>{resume}</strong>.</div>
          <GrapheRepartition pH={tampon ? ti.pH : eExp.pH}/>
        </Section>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
