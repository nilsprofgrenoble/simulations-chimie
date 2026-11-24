import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./quantiteMatiereModele";
import { QCM } from "./quantiteMatiereQcm";
import { SvgMole, SvgMasseMolaire, SvgTriangle, SvgVolumeMolaire, SvgChemins } from "./quantiteMatiereSchemas";
import { ScenePaquet, SceneEchantillons, SceneAtomes, SceneBalance, SceneGaz, SceneLiquide, SceneMelange } from "./quantiteMatiereScenes";

const SIM_ID = 152, CLE_GUIDE = 'quantite-matiere-1g-guide-v1';
declarerDefis(SIM_ID, [['solide', 'Quelle masse de solide faut-il peser ?'], ['gaz', 'Quelle est la masse de gaz du ballon ?']]);

// ====================================================
//  SIM 152 — QUANTITÉ DE MATIÈRE : MASSE MOLAIRE, VOLUME MOLAIRE (1G spé PC, thème « Constitution et transformations de la matière »,
//  partie « Suivi de l'évolution d'un système » : composition du système initial).
//  Une seule idée : passer d'une grandeur mesurable (masse, volume d'un gaz, volume d'un liquide) à la quantité de matière n (en mol).
//  Parcours : mole et N_A, masse molaire (somme des masses molaires atomiques), n = m/M, volume molaire, n = V/V_m, n = ρ·V/M, composition d'un mélange.
//  La concentration, la dissolution et la dilution relèvent d'une autre simulation. Le modèle est dans quantiteMatiereModele.js (testé).
//  Capacités visées (jamais affichées à l'élève) : déterminer la masse molaire d'une espèce à partir des masses molaires atomiques ; déterminer la
//  quantité de matière d'un échantillon de corps pur (masse, volume d'un gaz) ; n de chaque espèce d'un mélange liquide ou solide à partir de sa composition.
// ====================================================

const NB = ' ';
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sciF = (x, cs = 3) => { const [a, e] = Number(x).toExponential(cs - 1).split('e'); return `${a.replace('.', ',')}${NB}×${NB}10${[...String(Number(e))].map(c => (c === '-' ? '⁻' : SUP[c])).join('')}`; };
const nbs = (x, cs = 3) => {
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) return sciF(x, cs);
  return Number(x.toPrecision(cs)).toFixed(Math.max(0, cs - 1 - Math.floor(Math.log10(a)))).replace('.', ',');
};
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };
const PRESET = { Tg: 0, tVus: [0] };
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- formules (MathML) ----------
const FN = <Formule><mi>N</mi><mo>=</mo><mi>n</mi><mo>·</mo><msub><mi>N</mi><mi>A</mi></msub></Formule>;
const FnM = <Formule><mi>n</mi><mo>=</mo><mfrac><mi>m</mi><mi>M</mi></mfrac></Formule>;
const FnV = <Formule><mi>n</mi><mo>=</mo><mfrac><mi>V</mi><msub><mi>V</mi><mi>m</mi></msub></mfrac></Formule>;
const FnRho = <Formule><mi>n</mi><mo>=</mo><mfrac><mrow><mi>ρ</mi><mo>·</mo><mi>V</mi></mrow><mi>M</mi></mfrac></Formule>;
const FMsomme = <Formule><mi>M</mi><mo>=</mo><msub><mi>k</mi><mn>1</mn></msub><mo>·</mo><msub><mi>M</mi><mn>1</mn></msub><mo>+</mo><msub><mi>k</mi><mn>2</mn></msub><mo>·</mo><msub><mi>M</mi><mn>2</mn></msub><mo>+</mo><mo>…</mo></Formule>;

// ---------- tableau du calcul d'une masse molaire ----------
function TableauMM({ e, cacher }) {
  const L = M.lignesMasseMolaire(e), tot = M.masseMolaire(e);
  const td = { padding: '4px 6px', borderBottom: `1px solid ${KIT.bord}`, textAlign: 'center' };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ color: KIT.txt2, fontSize: 13 }}>
          <th style={td}>Atome</th><th style={td}>Nombre d’atomes</th><th style={td}>M de l’atome (g/mol)</th><th style={td}>Nombre × M (g/mol)</th>
        </tr></thead>
        <tbody>
          {L.map(([a, k, ma, c]) => (
            <tr key={a}><td style={{ ...td, fontWeight: 700 }}><span style={{ color: M.COULEUR_ATOME[a] || COL.gris }}>●</span> {a}</td><td style={td}>{k}</td><td style={td}>{nbf(ma, 1)}</td>
              <td style={td}>{cacher ? '?' : `${k} × ${nbf(ma, 1)} = ${nbf(c, 1)}`}</td></tr>))}
          <tr><td colSpan={3} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>M({M.formuleTexte(e)}) =</td>
            <td style={{ ...td, fontWeight: 700, color: cacher ? KIT.txt2 : COL.orange }}>{cacher ? '? g/mol' : `${nbf(tot, 1)}${NB}g/mol`}</td></tr>
        </tbody>
      </table>
    </div>);
}

const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);

// ====================================================
export function SimulationQuantiteMatiere() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviS, noterS] = useCompteurDefi(), [suiviG, noterG] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('solide');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ti, setTi] = useState(PRESET);
  // exploration
  const [ex, setEx] = useState({ objet: 'corps', esp: 'glucose', m: 90, V: 20, gA: 'o2', gB: 'h2', Vg: 1.0, T: 20, P: 1013, mel: 0, m1: 18, m2: 23, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setT = f => setTi(s => ({ ...s, ...f }));
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['paquet', 'avogadro', 'molaire', 'mh2o', 'mgluc', 'nsolide', 'nmg', 'mpeser', 'vmcommun', 'vmtp', 'ngaz', 'nliq', 'nmel', 'melange'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant

  const eau = M.espece('eau'), gluc = M.espece('glucose');
  const nEthaLiq = M.quantiteLiquide(0.79, 20.0, 46.0);

  const ETAPES = [
    { id: 'paquet', titre: 'Compter des entités par paquets', focus: ['scene'],
      texte: <>Un échantillon de matière contient un nombre gigantesque d’entités (atomes, molécules, ions). Pour les compter, les chimistes les regroupent en <strong>paquets</strong> appelés <strong>moles</strong>. Une mole contient 6,02 × 10²³ entités : c’est la <strong>constante d’Avogadro</strong>, N<sub>A</sub> = 6,02 × 10²³ mol⁻¹.</>,
      tache: { type: 'qcm', ...QCM.paquet } },
    { id: 'avogadro', titre: 'Du nombre de moles au nombre d’entités', focus: ['scene'],
      texte: <>Si un échantillon contient une quantité de matière <em>n</em> (en mol), il contient <em>N</em> = <em>n</em> × N<sub>A</sub> entités. Un échantillon de 9,00{NB}g d’eau contient <strong>0,500{NB}mol</strong> de molécules d’eau.{FN}</>,
      tache: { type: 'num', q: 'Nombre de molécules d’eau dans 0,500 mol', carnet: 'Nombre de molécules d’eau (0,500 mol)', unite: '× 10²³ molécules', vrai: 3.01, tol: 0.02, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['N = n × N_A avec n = 0,500 mol et N_A = 6,02 × 10²³ mol⁻¹ (les mol se simplifient).', 'N = 0,500 × 6,02 × 10²³ = 3,01 × 10²³ molécules, soit la moitié d’un paquet.'],
        pieges: [[12.04, 'Vous avez divisé N_A par n : N = n × N_A (on multiplie).'], [6.02, 'Il s’agit de 0,500 mol, pas d’une mole entière : N = 0,500 × N_A.'], [0.083, 'Vous avez divisé n par N_A : on multiplie, N = n × N_A.']],
        expl: 'N = 0,500 × 6,02 × 10²³ = 3,01 × 10²³ molécules d’eau.', indice: 'N = n × N_A : multipliez 0,500 par 6,02 ; la puissance de 10 ne change pas.' } },
    { id: 'molaire', titre: 'Même nombre d’entités, même masse ?', focus: ['scene'],
      texte: <>On a pesé trois échantillons qui contiennent chacun <strong>une mole d’atomes</strong> : du carbone, du sodium et du cuivre. Chaque échantillon contient donc le même nombre d’atomes, 6,02 × 10²³.</>,
      tache: { type: 'qcm', ...QCM.molaire } },
    { id: 'mh2o', titre: 'La masse molaire d’une molécule', focus: ['scene', 'tableau'],
      texte: <>La <strong>masse molaire</strong> M d’une espèce est la masse d’une mole de cette espèce ; elle s’exprime en g/mol. Celle d’un atome se lit dans le tableau périodique. Celle d’une molécule est la <strong>somme des masses molaires de ses atomes</strong>. La molécule d’eau H₂O contient 2 atomes H et 1 atome O ; M(H) = 1,0{NB}g/mol et M(O) = 16,0{NB}g/mol.</>,
      tache: { type: 'num', q: 'Masse molaire de l’eau H₂O', carnet: 'M(H₂O)', unite: 'g/mol', vrai: 18.0, tol: 0.005, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['M(H₂O) = 2 × M(H) + 1 × M(O) (2 atomes H, 1 atome O).', 'M(H₂O) = 2 × 1,0 + 16,0 = 18,0 g/mol.'],
        pieges: [[17.0, 'Il y a 2 atomes d’hydrogène : l’indice 2 de H₂O multiplie M(H).'], [33.0, 'Les indices sont inversés : H₂O contient 2 atomes H et 1 atome O.'], [16.0, 'Il manque les atomes d’hydrogène : M(H₂O) = 2 × M(H) + M(O).']],
        expl: 'M(H₂O) = 2 × 1,0 + 16,0 = 18,0 g/mol.', indice: 'Multipliez chaque masse molaire atomique par le nombre d’atomes (l’indice), puis additionnez.' },
      retenirTitre: 'À RETENIR : LA MOLE, UN PAQUET D’ENTITÉS',
      retenir: <>
        <SvgMole/>
        <ul style={liste}>
          <li><strong>1 mol = 6,02 × 10²³ entités</strong> (atomes, molécules, ions). Constante d’Avogadro : N<sub>A</sub> = 6,02 × 10²³ mol⁻¹.</li>
          <li>Exemple de la simulation : 1 mol de molécules d’eau = 6,02 × 10²³ molécules ; 2 mol = 1,20 × 10²⁴ molécules.</li>
          <li><strong>Idée fausse</strong> : « une mole, c’est une masse ». <strong>Vrai</strong> : c’est un nombre d’entités. Comme la douzaine, mais en bien plus grand.</li>
        </ul></> },
    { id: 'mgluc', titre: 'Une molécule plus grosse', focus: ['scene', 'tableau'],
      texte: <>Le glucose a pour formule C₆H₁₂O₆ : <strong>6 atomes C, 12 atomes H et 6 atomes O</strong>. M(C) = 12,0{NB}g/mol, M(H) = 1,0{NB}g/mol et M(O) = 16,0{NB}g/mol.</>,
      tache: { type: 'num', q: 'Masse molaire du glucose C₆H₁₂O₆', carnet: 'M(glucose)', unite: 'g/mol', vrai: 180.0, tol: 0.005, affiche: v => nbf(v, 1),
        calcul: () => ['M = 6 × M(C) + 12 × M(H) + 6 × M(O).', 'M = 6 × 12,0 + 12 × 1,0 + 6 × 16,0 = 72,0 + 12,0 + 96,0 = 180,0 g/mol.'],
        pieges: [[29.0, 'Il faut multiplier chaque masse molaire par le nombre d’atomes : 6 × 12,0, 12 × 1,0 et 6 × 16,0.'], [24.0, 'Vous avez compté les atomes (6 + 12 + 6 = 24) : il faut additionner leurs masses molaires.'], [270.0, 'Les indices sont mal attribués : 12 est le nombre d’atomes H (M = 1,0) et 6 le nombre d’atomes O (M = 16,0).']],
        expl: 'M(C₆H₁₂O₆) = 72,0 + 12,0 + 96,0 = 180,0 g/mol.', indice: '6 × 12,0 pour le carbone, 12 × 1,0 pour l’hydrogène, 6 × 16,0 pour l’oxygène ; puis on additionne.' } },
    { id: 'nsolide', titre: 'De la masse à la quantité de matière', focus: ['scene'],
      texte: <>Une mole de glucose pèse M grammes : le nombre de moles d’un échantillon est donc sa masse divisée par M. On pèse un échantillon de glucose C₆H₁₂O₆ de masse <strong>m = 90,0{NB}g</strong>, de masse molaire M = 180,0{NB}g/mol (calculée à l’étape précédente).{FnM}</>,
      tache: { type: 'num', q: 'Quantité de matière de glucose dans l’échantillon', carnet: 'n de glucose (90,0 g)', unite: 'mol', vrai: 0.500, tol: 0.01, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => ['n = frac(m|M) : les grammes se simplifient, il reste des moles (g ÷ g/mol = mol).', 'n = 90,0 g ÷ 180,0 g/mol = 0,500 mol.'],
        pieges: [[2.0, 'Le rapport est inversé : n = frac(m|M) (la masse en haut).'], [16200, 'Il faut diviser m par M, pas les multiplier.']],
        expl: 'n = frac(90,0|180,0) = 0,500 mol : l’échantillon pèse la moitié d’une mole.', indice: 'n = frac(m|M) avec m en g et M en g/mol ; le résultat est en mol.' },
      retenirTitre: 'À RETENIR : LA MASSE MOLAIRE',
      retenir: <>
        <SvgMasseMolaire/>
        {FMsomme}
        <ul style={liste}>
          <li><strong>M = masse d’une mole</strong>, en g/mol, lue dans le tableau périodique pour un atome. Molécule : somme des M des atomes, chacun multiplié par son indice.</li>
          <li>Exemple de la simulation : M(H₂O) = 2 × 1,0 + 16,0 = 18,0 g/mol.</li>
          <li><strong>Idée fausse</strong> : « une mole pèse toujours pareil ». <strong>Vrai</strong> : même nombre d’entités, mais masse différente selon l’espèce. Un ion : on néglige la masse des électrons (M(Na⁺) ≈ M(Na)).</li>
        </ul></> },
    { id: 'nmg', titre: 'Un comprimé de vitamine C', focus: ['scene'],
      texte: <>Un comprimé contient une masse <strong>m = 500{NB}mg</strong> de vitamine C, de formule C₆H₈O₆, de masse molaire M = 176,0{NB}g/mol. Pour que les unités se simplifient, la masse doit être en grammes (1{NB}g = 1000{NB}mg).</>,
      tache: { type: 'num', q: 'Quantité de matière de vitamine C dans le comprimé', carnet: 'n de vitamine C (500 mg)', unite: '× 10⁻³ mol', vrai: 2.84, tol: 0.01, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['m = 500 mg = 0,500 g (1 mg = 10⁻³ g).', 'n = frac(m|M) = 0,500 g ÷ 176,0 g/mol = 2,84 × 10⁻³ mol (soit 2,84 mmol).'],
        pieges: [[2841, 'Vous n’avez pas converti les milligrammes en grammes : 500 mg = 0,500 g.'], [352, 'Le rapport est inversé et les mg n’ont pas été convertis : n = frac(m|M) avec m = 0,500 g.'], [352000, 'Le rapport est inversé : n = frac(m|M) (la masse en haut, la masse molaire en bas).']],
        expl: 'n = frac(0,500|176,0) = 2,84 × 10⁻³ mol.', indice: 'Convertissez d’abord : 500 mg = 0,500 g. Puis n = frac(m|M). Le résultat attendu est de l’ordre du millième de mole.' } },
    { id: 'mpeser', titre: 'Quelle masse faut-il peser ?', focus: ['scene'],
      texte: <>Pour une expérience, il faut <strong>0,250{NB}mol</strong> de glucose, de masse molaire M = 180,0{NB}g/mol. On cherche la masse à placer sur la balance : on isole m dans la relation n = {avecIndices('frac(m|M)')}.</>,
      tache: { type: 'num', q: 'Masse de glucose à peser', carnet: 'Masse de glucose pour 0,250 mol', unite: 'g', vrai: 45.0, tol: 0.01, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['De n = frac(m|M), on tire m = n × M.', 'm = 0,250 mol × 180,0 g/mol = 45,0 g.'],
        pieges: [[0.00139, 'Vous avez divisé n par M : m = n × M.'], [720, 'Vous avez divisé M par n : m = n × M.']],
        expl: 'm = n × M = 0,250 × 180,0 = 45,0 g.', indice: 'm = n × M : les mol se simplifient, il reste des grammes.' } },
    { id: 'vmcommun', titre: 'Le volume molaire d’un gaz', focus: ['scene'],
      texte: <>Pour un gaz, il est plus simple de mesurer un volume qu’une masse. Le <strong>volume molaire</strong> V<sub>m</sub> est le volume occupé par une mole de gaz, dans des conditions de température et de pression données ; il s’exprime en L/mol. Voici une mole de dioxygène O₂ (M = 32,0{NB}g/mol) et une mole de dihydrogène H₂ (M = 2,0{NB}g/mol), à la même température et à la même pression.</>,
      tache: { type: 'qcm', ...QCM.vmcommun },
      retenirTitre: 'À RETENIR : n = m / M',
      retenir: <>
        <SvgTriangle/>
        {FnM}
        <ul style={liste}>
          <li><strong>n = {avecIndices('frac(m|M)')}</strong> : m en g, M en g/mol, n en mol. Le triangle aide à isoler la grandeur cherchée.</li>
          <li>Exemples de la simulation : 90,0 g de glucose → 0,500 mol ; 500 mg = 0,500 g de vitamine C → 2,84 × 10⁻³ mol.</li>
          <li><strong>Piège</strong> : convertir les mg en g avant de calculer (1 g = 1000 mg).</li>
        </ul></> },
    { id: 'vmtp', titre: 'Le volume molaire et la température', focus: ['scene'],
      texte: <>Choisissez la température du gaz dans le menu : le flacon de droite contient toujours <strong>une mole</strong> de gaz, à la pression atmosphérique (1013{NB}hPa) ; celui de gauche sert de référence (0{NB}°C). Essayez au moins deux températures, puis répondez.</>,
      tache: { type: 'qcm', ...QCM.vmtp, bloque: ti.tVus.length >= 2 ? null : 'Choisissez d’abord deux températures différentes dans le menu (sous les flacons).' } },
    { id: 'ngaz', titre: 'La quantité de matière d’un gaz', focus: ['scene'],
      texte: <>On a vu que V<sub>m</sub> dépend de la température et de la pression : on le lit toujours dans l’énoncé. Un flacon de volume <strong>V = 600{NB}mL</strong> contient du dioxygène O₂ à 20{NB}°C et 1013{NB}hPa ; dans ces conditions, <strong>V<sub>m</sub> = 24,0{NB}L/mol</strong>. Le volume et V<sub>m</sub> doivent être dans la même unité de volume.{FnV}</>,
      tache: { type: 'num', q: 'Quantité de matière de dioxygène dans le flacon', carnet: 'n de dioxygène (600 mL)', unite: 'mol', vrai: 0.0250, tol: 0.01, affiche: v => nbf(v, 4), cs: 3,
        calcul: () => ['V = 600 mL = 0,600 L (1 mL = 10⁻³ L).', 'n = frac(V|V_m) = 0,600 L ÷ 24,0 L/mol = 0,0250 mol.'],
        pieges: [[25.0, 'Vous n’avez pas converti les mL en L : 600 mL = 0,600 L.'], [40.0, 'Le rapport est inversé : n = frac(V|V_m).']],
        expl: 'n = frac(0,600|24,0) = 0,0250 mol, soit 2,50 × 10⁻² mol.', indice: 'Convertissez 600 mL en litres, puis n = frac(V|V_m) avec V_m en L/mol.' } },
    { id: 'nliq', titre: 'Un liquide : la masse volumique', focus: ['scene'],
      texte: <>Un liquide se prélève plus facilement au volume qu’à la balance. Sa <strong>masse volumique</strong> ρ donne la masse d’un millilitre : m = ρ × V, puis n = {avecIndices('frac(m|M)')}. On prélève <strong>V = 20,0{NB}mL</strong> d’éthanol C₂H₆O, de masse volumique ρ = 0,79{NB}g/mL et de masse molaire M = 46,0{NB}g/mol.{FnRho}</>,
      tache: { type: 'num', q: 'Quantité de matière d’éthanol prélevée', carnet: 'n d’éthanol (20,0 mL)', unite: 'mol', vrai: nEthaLiq, tol: 0.02, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['m = ρ × V = 0,79 g/mL × 20,0 mL = 15,8 g (les mL se simplifient).', 'n = frac(m|M) = 15,8 g ÷ 46,0 g/mol = 0,343 mol, soit 0,34 mol : on garde 2 chiffres significatifs, comme la masse volumique ρ = 0,79 g/mL.'],
        pieges: [[15.8, 'C’est la masse m = ρ × V (15,8 g) : il reste à la diviser par M pour obtenir n.'], [1.82, 'Vous avez calculé ρ × M ÷ V : la bonne relation est n = ρ × V ÷ M.'], [0.435, 'Il manque la masse volumique : il faut d’abord passer du volume à la masse, m = ρ × V.']],
        expl: 'm = 0,79 × 20,0 = 15,8 g ; n = frac(15,8|46,0) = 0,343 mol, soit 0,34 mol avec 2 chiffres significatifs (ρ n’en a que 2).', indice: 'm = ρ × V (en g), puis n = m ÷ M : la masse n’est qu’une étape du calcul.' },
      retenirTitre: 'À RETENIR : LE VOLUME MOLAIRE',
      retenir: <>
        <SvgVolumeMolaire/>
        {FnV}
        <ul style={liste}>
          <li><strong>V<sub>m</sub> = volume d’une mole de gaz</strong> (L/mol) ; il dépend de T et de P, <strong>pas du gaz</strong>. Exemples : 22,4 L/mol à 0 °C, 24,0 L/mol à 20 °C (1013 hPa).</li>
          <li>Même volume, même T, même P : <strong>même nombre de molécules</strong>, quel que soit le gaz.</li>
          <li><strong>Idée fausse</strong> : « un gaz plus lourd a un plus grand volume molaire ». <strong>Vrai</strong> : seule sa masse molaire change.</li>
        </ul></> },
    { id: 'nmel', titre: 'La composition d’un mélange', focus: ['scene'],
      texte: <>Pour connaître la composition d’un mélange, on calcule la quantité de matière de chaque constituant. Un mélange liquide contient <strong>18,0{NB}g d’eau</strong> (M = 18,0{NB}g/mol, soit n(eau) = 1,00{NB}mol) et <strong>23,0{NB}g d’éthanol</strong> C₂H₆O (M = 46,0{NB}g/mol).{FnM}</>,
      tache: { type: 'num', q: 'Quantité de matière d’éthanol dans le mélange', carnet: 'n d’éthanol (23,0 g)', unite: 'mol', vrai: 0.500, tol: 0.01, affiche: v => nbf(v, 3), cs: 3,
        calcul: () => ['n(éthanol) = frac(m|M) : les grammes se simplifient.', 'n(éthanol) = 23,0 g ÷ 46,0 g/mol = 0,500 mol.'],
        pieges: [[2.0, 'Le rapport est inversé : n = frac(m|M) (la masse en haut).'], [1.00, 'Vous avez repris la quantité d’eau : pour l’éthanol, M = 46,0 g/mol et m = 23,0 g.'], [0.391, 'Vous avez utilisé la masse molaire de l’eau (18,0 g/mol) : pour l’éthanol, M = 46,0 g/mol.']],
        expl: 'n(éthanol) = frac(23,0|46,0) = 0,500 mol.', indice: 'n = frac(m|M) avec m = 23,0 g et M = 46,0 g/mol (la masse molaire de l’éthanol, pas celle de l’eau).' } },
    { id: 'melange', titre: 'Comparer deux constituants', focus: ['scene'],
      texte: <>Dans ce mélange, n(eau) = 1,00{NB}mol et n(éthanol) = 0,500{NB}mol (calculé à l’étape précédente), alors que l’éthanol a la plus grande masse (23,0{NB}g contre 18,0{NB}g).</>,
      tache: { type: 'qcm', ...QCM.melange },
      retenirTitre: 'À RETENIR : TROIS CHEMINS VERS n',
      retenir: <>
        <SvgChemins/>
        <ul style={liste}>
          <li><strong>On choisit la relation selon ce qu’on connaît</strong> : m (solide ou liquide pesé), V d’un gaz avec V<sub>m</sub>, V d’un liquide avec ρ.</li>
          <li>Exemple de la simulation : 20,0 mL d’éthanol → 15,8 g → 0,34 mol. Pour un mélange : un calcul par constituant.</li>
          <li><strong>Moyen de s’en souvenir</strong> : « je regarde l’unité de ce que j’ai : g, L ou mL ». <strong>Idée fausse</strong> : plus de masse = plus de moles.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'solide' ? M.tirerDefiSolide() : M.tirerDefiGaz()), reps: {}, verifie: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, 0.01);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'solide' ? noterS : noterG)(ok);
  };
  const atomesDe = e => e.f.map(([a]) => `M(${a}) = ${nbf(M.MM_ATOME[a], 1)}${NB}g/mol`).join(' ; ');
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('qm-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['solide', 'Masse de solide à peser'], ['gaz', 'Masse d’un gaz']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'solide' ? 'Défi : quelle masse faut-il peser ?' : 'Défi : quelle masse de gaz contient le ballon ?'}</div>
      {defi.type === 'solide' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Pour une expérience, il faut préparer <strong>{nbf(defi.n, defi.n < 0.1 ? 4 : 3)}{NB}mol</strong> de {defi.e.nom}, de formule <strong>{M.formuleTexte(defi.e)}</strong>. Quelle masse faut-il peser ? Masses molaires atomiques : {atomesDe(defi.e)}. Donnez le résultat en grammes avec 3{NB}chiffres significatifs (marge acceptée : ± 1{NB}%).</div>
        {champ('Masse à peser', 'g')}
        <IndiceDefi cache={false}>Calculez d’abord la masse molaire : M = somme des masses molaires atomiques, chacune multipliée par son indice dans la formule {M.formuleTexte(defi.e)}. Puis m = n × M (en g, avec M en g/mol).</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un ballon de volume <strong>V = {defi.V}{NB}mL</strong> contient du {defi.e.nom} <strong>{M.formuleTexte(defi.e)}</strong> à {defi.theta}{NB}°C et 1013{NB}hPa ; dans ces conditions, <strong>V<sub>m</sub> = {nbf(defi.Vm, 1)}{NB}L/mol</strong>. Quelle est la masse de gaz dans le ballon ? Masses molaires atomiques : {atomesDe(defi.e)}. Donnez le résultat en grammes avec 3{NB}chiffres significatifs (marge acceptée : ± 1{NB}%).</div>
        {champ('Masse de gaz', 'g')}
        <IndiceDefi cache={false}>Trois étapes : (1) convertir V en litres ; (2) n = {avecIndices('frac(V|V_m)')} avec V_m en L/mol ; (3) calculer M = somme des masses molaires atomiques de {M.formuleTexte(defi.e)}, puis m = n × M.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="qm-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct. M = ${nbf(defi.M, 1)} g/mol${defi.type === 'gaz' ? `, n = ${nbs(defi.n, 3)} mol` : ''}, soit ${nbs(defi.vrai, 3)} g (marge acceptée : ± 1 %).`
          : defi.type === 'solide' ? '✗ Vérifiez : M = somme des masses molaires atomiques × indices ; puis m = n × M, en grammes.'
            : '✗ Vérifiez : V en litres (mL ÷ 1000), n = V ÷ V_m, puis m = n × M avec M en g/mol.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Masses molaires atomiques</strong> : valeurs d’un tableau périodique de lycée, arrondies au dixième (H = 1,0 ; C = 12,0 ; O = 16,0 g/mol…). Les masses molaires calculées dépendent de ces arrondis : avec d’autres tables (H = 1,008), le troisième chiffre significatif peut changer.</li>
      <li><strong>Constante d’Avogadro</strong> : N<sub>A</sub> = 6,02 × 10²³ mol⁻¹, arrondi de la valeur exacte 6,02214076 × 10²³ mol⁻¹ (fixée par définition de la mole).</li>
      <li><strong>Ions</strong> : la masse des électrons est négligée devant celle des noyaux, donc M(ion) ≈ somme des masses molaires atomiques (M(Na⁺) ≈ M(Na)).</li>
      <li><strong>Corps pur et mélange</strong> : l’échantillon est supposé pur (pas d’eau d’hydratation, pas d’impureté). Dans un mélange, chaque constituant est traité séparément ; les masses s’additionnent, les volumes ne sont pas toujours additifs, et aucune réaction n’a lieu entre les constituants.</li>
      <li><strong>Volume molaire</strong> : V<sub>m</sub> dépend de la température et de la pression : il faut toujours donner la valeur utilisée (22,4 L/mol à 0 °C, 24,0 L/mol à 20 °C, 24,5 L/mol à 25 °C, à pression atmosphérique, valeurs arrondies). Le fait qu’il ne dépende pas du gaz est exact pour un <strong>gaz parfait</strong> (molécules sans interaction, de volume négligeable) ; pour un gaz réel, l’écart à pression atmosphérique est de quelques pour mille pour O₂, N₂, H₂ et CH₄, et de 1 à 3 % pour NH₃, Cl₂ et le butane ; il augmente si la pression est grande ou si la température est proche de celle de liquéfaction (le butane, qui bout vers −1 °C, est liquide à 0 °C et n’est donc pas proposé à cette température).</li>
      <li><strong>Exploration</strong> : la simulation calcule V<sub>m</sub> par V<sub>m</sub> = R·{avecIndices('frac(T|P)')} (R = 8,314 J·mol⁻¹·K⁻¹, T en kelvin, P en pascal) : 24,05 L/mol à 20 °C sous 1013 hPa, que les exercices arrondissent à 24,0 L/mol (cet écart d’arrondi est inférieur à 0,5 %).</li>
      <li><strong>Liquides</strong> : masses volumiques à 20 °C, valeurs arrondies (eau 1,00 ; éthanol 0,79 g/mL). Elles varient avec la température.</li>
      <li><strong>Chiffres significatifs</strong> : un résultat ne doit pas avoir plus de chiffres significatifs que la donnée la moins précise ; les calculs intermédiaires gardent un chiffre de plus.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const TV = [0, 20, 25];
  const Vm = M.VM_USUEL[ti.Tg];
  const sceneGuide = (() => {
    switch (idE) {
      case 'paquet': case 'avogadro': return boite('Une entité, puis un paquet : la mole', <ScenePaquet/>, cadre('scene'));
      case 'molaire': return boite('Trois échantillons d’une mole d’atomes', <SceneEchantillons masses={fait('molaire')}/>, cadre('scene'));
      case 'mh2o': case 'mgluc': {
        const e = idE === 'mh2o' ? eau : gluc;
        return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {boite(`Les atomes de la molécule ${M.formuleTexte(e)}`, <SceneAtomes e={e}/>, cadre('scene'))}
          {boite('Calcul de la masse molaire', <TableauMM e={e} cacher={!fait(idE)}/>, cadre('tableau'))}
        </div>);
      }
      case 'nsolide': return boite('Un échantillon de glucose',
        <><SceneBalance nom="glucose C₆H₁₂O₆" masse="90,0 g" couleur="#f8fafc"/><div style={{ marginTop: 8 }}>
          {donnee('Masse de l’échantillon m', `90,0${NB}g`)}{donnee('Masse molaire M', `180,0${NB}g/mol`)}
          {fait('nsolide') && donnee('Quantité de matière n', `0,500${NB}mol`, COL.orange)}</div></>, cadre('scene'));
      case 'nmg': return boite('Un comprimé de vitamine C',
        <><SceneBalance nom="vitamine C C₆H₈O₆" masse="500 mg" couleur="#fef9c3"/><div style={{ marginTop: 8 }}>
          {donnee('Masse du comprimé m', `500${NB}mg`)}{donnee('Masse molaire M', `176,0${NB}g/mol`)}
          {fait('nmg') && donnee('Quantité de matière n', `2,84${NB}×${NB}10⁻³${NB}mol`, COL.orange)}</div></>, cadre('scene'));
      case 'mpeser': return boite('Peser la bonne masse de glucose',
        <><SceneBalance nom="glucose C₆H₁₂O₆" masse={fait('mpeser') ? '45,0 g' : '? g'} couleur="#f8fafc"/><div style={{ marginTop: 8 }}>
          {donnee('Quantité de matière voulue n', `0,250${NB}mol`)}{donnee('Masse molaire M', `180,0${NB}g/mol`)}
          {fait('mpeser') && donnee('Masse à peser m', `45,0${NB}g`, COL.orange)}</div></>, cadre('scene'));
      case 'vmcommun': return boite('Deux gaz, mêmes conditions de température et de pression',
        <SceneGaz titre="Une mole de chaque gaz" flacons={[{ f: 'O₂', vTxt: 'V = ?', sous: '1 mol · M = 32,0 g/mol', inconnu: true }, { f: 'H₂', vTxt: 'V = ?', sous: '1 mol · M = 2,0 g/mol', inconnu: true }]}/>, cadre('scene'));
      case 'vmtp': return boite('Une mole de gaz à deux températures',
        <>
          <SceneGaz titre="Une mole de gaz, pression 1013 hPa" flacons={[{ f: '1 mol', vTxt: `${nbf(M.VM_USUEL[0], 1)} L`, sous: 'à 0 °C (référence)', points: 8, k: 1 }, { f: '1 mol', vTxt: `${nbf(Vm, 1)} L`, sous: `à ${ti.Tg} °C`, points: 8, k: Vm / M.VM_USUEL[0], couleur: COL.orange }]}/>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8, fontSize: 14, fontWeight: 700, color: KIT.txt2 }}>Température du gaz de droite
            <select value={ti.Tg} onChange={x => { const v = Number(x.target.value); setT({ Tg: v, tVus: ti.tVus.includes(v) ? ti.tVus : [...ti.tVus, v] }); }}
              style={{ minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}` }}>
              {TV.map(t => <option key={t} value={t}>{t} °C</option>)}</select></label>
          <div style={{ marginTop: 6 }}>{donnee('Volume molaire V_m', `${nbf(Vm, 1)}${NB}L/mol`, COL.orange)}</div>
        </>, cadre('scene'));
      case 'ngaz': return boite('Un flacon de dioxygène',
        <><SceneGaz titre="Dioxygène à 20 °C et 1013 hPa" flacons={[{ f: 'O₂', vTxt: '600 mL', sous: '20 °C · 1013 hPa', points: 12 }]}/><div style={{ marginTop: 8 }}>
          {donnee('Volume du flacon V', `600${NB}mL`)}{donnee('Volume molaire V_m', `24,0${NB}L/mol`)}
          {fait('ngaz') && donnee('Quantité de matière n', `0,0250${NB}mol`, COL.orange)}</div></>, cadre('scene'));
      case 'nliq': return boite('Un volume d’éthanol prélevé',
        <><SceneLiquide nom="éthanol" V={20.0} couleur="#fde68a"/><div style={{ marginTop: 8 }}>
          {donnee('Volume prélevé V', `20,0${NB}mL`)}{donnee('Masse volumique ρ', `0,79${NB}g/mL`)}{donnee('Masse molaire M', `46,0${NB}g/mol`)}
          {fait('nliq') && donnee('Quantité de matière n', `${nbf(nEthaLiq, 2)}${NB}mol`, COL.orange)}</div></>, cadre('scene'));
      case 'nmel': case 'melange': return boite('Un mélange d’eau et d’éthanol',
        <><SceneMelange titre="Deux liquides miscibles" a={{ nom: 'eau', txt: '18,0 g', col: '#7dd3fc', h: 58 }} b={{ nom: 'éthanol', txt: '23,0 g', col: '#fde68a', h: 72 }}/><div style={{ marginTop: 8 }}>
          {donnee('Eau : m · M', `18,0${NB}g · 18,0${NB}g/mol`)}{donnee('Éthanol : m · M', `23,0${NB}g · 46,0${NB}g/mol`)}
          {(idE === 'melange' || fait('nmel')) && <>{donnee('n(eau)', `1,00${NB}mol`, COL.bleu)}{donnee('n(éthanol)', `0,500${NB}mol`, COL.orange)}</>}</div></>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const optsEsp = etats => etats.map(et => (
    <optgroup key={et.l} label={et.l}>{M.parEtat(et.k).map(e => <option key={e.id} value={e.id}>{e.nom} {M.formuleTexte(e)}</option>)}</optgroup>));
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });

  // --- objet 1 : corps pur solide ou liquide ---
  const eC = M.espece(ex.esp), MC = M.masseMolaire(eC), liquideC = eC.etat === 'l', ionC = eC.etat === 'ion';
  const maxC = liquideC ? Math.ceil(2.5 * MC / eC.rho / 10) * 10 : Math.ceil(2.5 * MC / 10) * 10;
  const mC = liquideC ? eC.rho * ex.V : ex.m;
  const nC = M.quantiteMasse(mC, MC);
  const choisirEsp = id => { const e = M.espece(id), Me = M.masseMolaire(e); setE(e.etat === 'l' ? { esp: id, V: Math.round(Me / e.rho / 2 / 0.5) * 0.5 } : { esp: id, m: Math.round(Me / 2 / (Me < 100 ? 0.5 : 1)) * (Me < 100 ? 0.5 : 1) }); };   // une demi-mole, calée sur la graduation du curseur
  const mettreUneMole = () => setE(liquideC ? { V: Math.round(MC / eC.rho * 10) / 10 } : { m: MC });
  const corpsReglages = (<>
    {etiquette('Espèce chimique', <select value={ex.esp} onChange={x => choisirEsp(x.target.value)} style={sel}>{optsEsp([{ l: 'Solides', k: 's' }, { l: 'Liquides', k: 'l' }, { l: 'Ions (masse molaire seulement)', k: 'ion' }])}</select>)}
    {!ionC && <>
      <Curseur nom={liquideC ? 'Volume de liquide prélevé' : 'Masse de l’échantillon'} valeur={liquideC ? ex.V : ex.m} onChange={v => setE(liquideC ? { V: v } : { m: v })} min={0} max={maxC} pas={liquideC ? 0.5 : (MC < 100 ? 0.5 : 1)} unite={liquideC ? 'mL' : 'g'} decimales={1} couleur="#b45309"/>
      <button onClick={mettreUneMole} style={stylePetitBouton(false, '#475569')}>Peser exactement 1 mol</button>
      {aide('Le curseur règle la masse (ou le volume pour un liquide) ; le bouton place exactement une mole : lisez alors la masse et le nombre d’entités.')}
    </>}
    {ionC && aide('Un ion est une entité isolée : on calcule sa masse molaire, mais on ne « pèse » pas un ion seul.')}
  </>);
  const corpsMesures = (<>
    {donnee('Espèce', `${eC.nom} ${M.formuleTexte(eC)}`)}
    {donnee('Masse molaire M', `${nbf(MC, 1)}${NB}g/mol`, COL.orange)}
    {!ionC && <>
      {liquideC && donnee('Masse volumique ρ', `${nbf(eC.rho, 2)}${NB}g/mL`)}
      {liquideC && donnee('Masse m = ρ·V', `${nbf(mC, 1)}${NB}g`)}
      {!liquideC && donnee('Masse m', `${nbf(mC, 1)}${NB}g`)}
      {donnee('Quantité de matière n', `${nbs(nC, 3)}${NB}mol`, COL.vert)}
      {donnee('Nombre d’entités N = n·N_A', `${nC === 0 ? '0' : sciF(M.nombreEntites(nC), 3)}`, COL.violet)}
    </>}
  </>);
  const barreN = (n, max = 3) => (
    <svg viewBox="0 0 480 78" style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={`Quantité de matière n = ${nbs(n, 3)} mol sur une échelle de 0 à ${max} mol.`}>
      <rect x="20" y="22" width="440" height="22" rx="4" fill="#e2e8f0" />
      <rect x="20" y="22" width={440 * Math.min(1, n / max)} height="22" rx="4" fill={COL.vert} />
      {Array.from({ length: max + 1 }, (_, k) => <g key={k}><line x1={20 + 440 * k / max} y1="22" x2={20 + 440 * k / max} y2="50" stroke="#475569" /><text x={20 + 440 * k / max} y="70" fontSize="16" textAnchor={k === 0 ? 'start' : k === max ? 'end' : 'middle'} fill="#334155">{k} mol</text></g>)}
    </svg>);
  const corpsScene = (<>
    <SceneBalance nom={`${eC.nom} ${M.formuleTexte(eC)}`} masse={ionC ? '—' : `${nbf(mC, 1)} g`} couleur={liquideC ? '#fde68a' : '#f1f5f9'} liquide={liquideC}/>
    {!ionC && <div style={{ marginTop: 8 }}>{barreN(nC, Math.max(2, Math.ceil(nC)))}</div>}
  </>);
  const corpsTableau = (
    <Section titre={`Calcul de la masse molaire : M = ${nbf(MC, 1)} g/mol`} ouvert={ex.ouv.mm !== false} onBascule={() => setE({ ouv: { ...ex.ouv, mm: ex.ouv.mm === false } })}>
      <TableauMM e={eC} cacher={false}/>
    </Section>);

  // --- objet 2 : gaz ---
  const VmG = M.volumeMolaireGP(ex.T, ex.P), nG = ex.Vg / VmG;
  const gA = M.espece(ex.gA), gB = M.espece(ex.gB), MA = M.masseMolaire(gA), MB = M.masseMolaire(gB);
  const ptsG = Math.min(40, Math.max(1, Math.round(nG / 0.0125)));
  const optsGaz = M.parEtat('g').map(e => <option key={e.id} value={e.id} disabled={!M.gazPossible(e, ex.T)}>{e.nom} {M.formuleTexte(e)}{M.gazPossible(e, ex.T) ? '' : ' (liquide à cette température)'}</option>);
  const gazReglages = (<>
    <Curseur nom="Volume du flacon" valeur={ex.Vg} onChange={v => setE({ Vg: v })} min={0.1} max={5} pas={0.05} unite="L" decimales={2} couleur="#b45309"/>
    {etiquette('Température', <select value={ex.T} onChange={x => { const T = Number(x.target.value); setE({ T, gA: M.gazPossible(M.espece(ex.gA), T) ? ex.gA : 'o2', gB: M.gazPossible(M.espece(ex.gB), T) ? ex.gB : 'h2' }); }} style={sel}>{[0, 10, 20, 25, 40, 60].map(t => <option key={t} value={t}>{t} °C{t === 0 ? ' (glace fondante)' : t === 20 ? ' (salle de TP)' : ''}</option>)}</select>)}
    {etiquette('Pression', <select value={ex.P} onChange={x => setE({ P: Number(x.target.value) })} style={sel}>{[900, 1013, 1100].map(p => <option key={p} value={p}>{p} hPa{p === 1013 ? ' (pression atmosphérique usuelle)' : ''}</option>)}</select>)}
    <Section titre={`Gaz comparés : ${M.formuleTexte(gA)} et ${M.formuleTexte(gB)}`} ouvert={!!ex.ouv.gaz} onBascule={() => ouvrir('gaz')}>
      {etiquette('Gaz A (flacon de gauche)', <select value={ex.gA} onChange={x => setE({ gA: x.target.value })} style={sel}>{optsGaz}</select>)}
      {etiquette('Gaz B (flacon de droite)', <select value={ex.gB} onChange={x => setE({ gB: x.target.value })} style={sel}>{optsGaz}</select>)}
    </Section>
    {aide('Les deux flacons ont le même volume, la même température et la même pression : comparez le nombre de molécules et la masse de chaque gaz.')}
  </>);
  const gazScene = (<SceneGaz titre={`${nbf(ex.Vg, 2)} L de gaz à ${ex.T} °C et ${ex.P} hPa`}
    flacons={[{ f: M.formuleTexte(gA), vTxt: `${nbf(ex.Vg, 2)} L`, sous: `n = ${nbs(nG, 3)} mol`, points: ptsG, couleur: COL.orange }, { f: M.formuleTexte(gB), vTxt: `${nbf(ex.Vg, 2)} L`, sous: `n = ${nbs(nG, 3)} mol`, points: ptsG, couleur: COL.bleu }]}/>);
  const gazMesures = (<>
    {donnee('Volume molaire V_m (modèle)', `${nbf(VmG, 2)}${NB}L/mol`, COL.orange)}
    {donnee('Quantité de matière n = V / V_m', `${nbs(nG, 3)}${NB}mol`, COL.vert)}
    {donnee('Nombre de molécules N', sciF(M.nombreEntites(nG), 3), COL.violet)}
    {donnee(`Masse de ${M.formuleTexte(gA)} : n × M`, `${nbs(nG * MA, 3)}${NB}g (M = ${nbf(MA, 1)})`, COL.orange)}
    {donnee(`Masse de ${M.formuleTexte(gB)} : n × M`, `${nbs(nG * MB, 3)}${NB}g (M = ${nbf(MB, 1)})`, COL.bleu)}
  </>);

  // --- objet 3 : mélange ---
  const MELANGES = [['eau', 'ethanol'], ['nacl', 'saccharose'], ['eau', 'acideEthanoique']].map(([a, b]) => [M.espece(a), M.espece(b)]);
  const [cA, cB] = MELANGES[ex.mel], MmA = M.masseMolaire(cA), MmB = M.masseMolaire(cB);
  const nA = ex.m1 / MmA, nB = ex.m2 / MmB, mTot = ex.m1 + ex.m2, nTot = nA + nB;
  const pM = mTot > 0 ? [100 * ex.m1 / mTot, 100 * ex.m2 / mTot] : [0, 0], pN = nTot > 0 ? [100 * nA / nTot, 100 * nB / nTot] : [0, 0];
  const bande = (y, p, titre) => (
    <g>
      <text x="20" y={y - 8} fontSize="16" fontWeight="700" fill={KIT.txt}>{titre}</text>
      <rect x="20" y={y} width="440" height="30" rx="4" fill="#e2e8f0" />
      <rect x="20" y={y} width={440 * p[0] / 100} height="30" rx="4" fill={COL.bleu} />
      <rect x={20 + 440 * p[0] / 100} y={y} width={440 * p[1] / 100} height="30" rx="4" fill={COL.orange} />
      {p[0] > 12 && <text x={20 + 220 * p[0] / 100} y={y + 21} fontSize="16" fontWeight="700" textAnchor="middle" fill="white">{nbf(p[0], 0)} %</text>}
      {p[1] > 12 && <text x={20 + 440 * p[0] / 100 + 220 * p[1] / 100} y={y + 21} fontSize="16" fontWeight="700" textAnchor="middle" fill="white">{nbf(p[1], 0)} %</text>}
    </g>);
  const melScene = (
    <svg viewBox="0 0 480 182" style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={`Composition du mélange ${cA.nom} et ${cB.nom} : en masse ${nbf(pM[0], 0)} pour cent et ${nbf(pM[1], 0)} pour cent ; en nombre d’entités ${nbf(pN[0], 0)} pour cent et ${nbf(pN[1], 0)} pour cent.`}>
      {bande(32, pM, 'Part de la masse')}
      {bande(98, pN, 'Part du nombre d’entités (molécules)')}
      <rect x="20" y="152" width="14" height="14" fill={COL.bleu} /><text x="40" y="164" fontSize="16" fill={KIT.txt}>{cA.nom}</text>
      <rect x="248" y="152" width="14" height="14" fill={COL.orange} /><text x="268" y="164" fontSize="16" fill={KIT.txt}>{cB.nom}</text>
    </svg>);
  const melReglages = (<>
    {etiquette('Mélange étudié', <select value={ex.mel} onChange={x => setE({ mel: Number(x.target.value), m1: 18, m2: 23 })} style={sel}>
      {MELANGES.map(([a, b], i) => <option key={i} value={i}>{a.nom} + {b.nom}{a.etat === 'l' ? ' (liquides)' : ' (solides)'}</option>)}</select>)}
    <Curseur nom={`Masse de ${cA.nom}`} valeur={ex.m1} onChange={v => setE({ m1: v })} min={0} max={100} pas={0.5} unite="g" decimales={1} couleur={COL.bleu}/>
    <Curseur nom={`Masse de ${cB.nom}`} valeur={ex.m2} onChange={v => setE({ m2: v })} min={0} max={100} pas={0.5} unite="g" decimales={1} couleur={COL.orange}/>
    {aide('Règlez la masse de chaque constituant : le graphique compare la part de chacun en masse et en nombre de molécules.')}
  </>);
  const melMesures = (<>
    {donnee(`${cA.nom} ${M.formuleTexte(cA)} : M`, `${nbf(MmA, 1)}${NB}g/mol`)}
    {donnee(`n(${cA.nom}) = m / M`, `${nbs(nA, 3)}${NB}mol`, COL.bleu)}
    {donnee(`${cB.nom} ${M.formuleTexte(cB)} : M`, `${nbf(MmB, 1)}${NB}g/mol`)}
    {donnee(`n(${cB.nom}) = m / M`, `${nbs(nB, 3)}${NB}mol`, COL.orange)}
  </>);

  const objets = [['corps', 'Un solide ou un liquide pur'], ['gaz', 'Un gaz'], ['melange', 'Un mélange']];
  const parObjet = { corps: [corpsReglages, corpsScene, corpsMesures, 'Corps pur : de la masse à la quantité de matière'], gaz: [gazReglages, gazScene, gazMesures, 'Gaz : du volume à la quantité de matière'], melange: [melReglages, melScene, melMesures, 'Mélange : la composition de chaque constituant'] }[ex.objet];
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Solide : choisissez le glucose, le saccharose, puis le chlorure de sodium et cliquez sur « Peser exactement 1 mol » : que valent la masse et le nombre d’entités ?</li>
      <li>Ouvrez le tableau du calcul de la masse molaire pour un ion (sulfate, phosphate) : pourquoi peut-on négliger la masse des électrons ?</li>
      <li>Liquide : comparez 50 mL d’eau et 50 mL d’éthanol. Lequel contient le plus de molécules ?</li>
      <li>Gaz : changez la température de 0 °C à 60 °C : que devient n pour le même flacon ? Changez ensuite de gaz : n change-t-il ? la masse change-t-elle ?</li>
      <li>Mélange eau + éthanol à masses égales : la part de la masse et la part des molécules sont-elles les mêmes ? Pourquoi ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>N = n × N<sub>A</sub>, avec N<sub>A</sub> = 6,02 × 10²³ mol⁻¹</li>
        <li>masse molaire d’une molécule : somme des masses molaires des atomes, chacune multipliée par son indice</li>
        <li>solide ou liquide pesé : n = {avecIndices('frac(m|M)')} (m en g, M en g/mol)</li>
        <li>gaz : n = {avecIndices('frac(V|V_m)')} (V<sub>m</sub> en L/mol, à donner pour une température et une pression)</li>
        <li>liquide en volume : n = ρ·{avecIndices('frac(V|M)')}</li>
        <li>mélange : un calcul par constituant ; plus de masse ne veut pas dire plus de moles</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .qm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .qm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .qm-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .qm-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .qm-l1.cote .qm-carte { order: 2; } .qm-l1.cote .qm-main { order: 1; }
          .qm-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .qm-ex > .qm-ex-scene { grid-column: 1; grid-row: 1; } .qm-ex > .qm-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .qm-ex > .qm-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .qm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .qm-in { animation: qm-fondu 0.35s ease-out; } @keyframes qm-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Quantité de matière : masse molaire, volume molaire</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une masse ou un volume se mesure ; la <strong>quantité de matière</strong> <em>n</em>, en <strong>mole</strong>, compte les entités. On passe de l’une à l’autre avec la <strong>masse molaire</strong> M, le <strong>volume molaire</strong> V<sub>m</sub> d’un gaz ou la <strong>masse volumique</strong> ρ d’un liquide.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {etiquette('Que voulez-vous étudier ?', <select value={ex.objet} onChange={x => setE({ objet: x.target.value })} style={sel}>{objets.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>)}
        </div>
        <div className="qm-ex">
          <div className="qm-ex-scene">{boite(parObjet[3], <>{ex.objet === 'corps' ? corpsScene : ex.objet === 'gaz' ? gazScene : melScene}</>)}</div>
          <div className="qm-ex-reglages">{boite('Réglages', parObjet[0])}{ex.objet === 'corps' && corpsTableau}</div>
          <div className="qm-ex-mesures">{boite('Mesures et calculs', parObjet[2])}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`qm-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="qm-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="qm-carte qm-hypo-defi">{panneauHypo}</div> : null}
          <div className="qm-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'solide' ? suiviS : suiviG}/></div>}
            {enDefi && defi && <div className="qm-in">{boite(defi.type === 'solide' ? 'La balance' : 'Le ballon de gaz',
              defi.type === 'solide' ? <SceneBalance nom={`${defi.e.nom} ${M.formuleTexte(defi.e)}`} masse="? g" couleur="#f8fafc"/>
                : <SceneGaz titre={`${defi.e.nom} à ${defi.theta} °C et 1013 hPa`} flacons={[{ f: M.formuleTexte(defi.e), vTxt: `${defi.V} mL`, sous: `${defi.theta} °C · 1013 hPa`, points: 12, couleur: COL.orange }]}/>)}</div>}
            {enGuide && <div className="qm-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && fait('melange') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
