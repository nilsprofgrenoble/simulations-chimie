import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as S from "./statiqueFluidesModele";
import { QCM } from "./statiqueFluidesQcm";
import { SceneCuve, SceneVases, SceneParoi, GraphePH } from "./statiqueFluidesScenes";
import { milliers, COL } from "./statiqueFluidesOutils";
import { SvgRelation, SvgAbsolue, SvgOrdre, SvgNiveau, SvgParoi, SvgLoi } from "./statiqueFluidesSchemas";

const SIM_ID = 163, CLE_GUIDE = 'statique-fluides-1g-guide-v1';
declarerDefis(SIM_ID, [['cuve', 'Quelle est la hauteur de liquide dans la cuve ?'], ['rho', 'Quelle est la masse volumique du liquide inconnu ?']]);

// ====================================================
//  SIM 163 — STATIQUE DES FLUIDES : PRESSION ET PROFONDEUR (1G spé PC, thème « Mouvement et interactions », partie « Décrire un fluide au repos »).
//  Prérequis : la simulation 162 (fluide au repos : pression, force pressante F = P·S, loi de Mariotte).
//  Une seule idée : dans un fluide incompressible au repos, la pression augmente avec la profondeur (P_B − P_A = ρ·g·(z_A − z_B), axe z vers le haut).
//  Parcours (12 étapes) : sonde, tableau de mesures, relation fournie et signes, différence de pression, pression absolue, profondeur à partir de P,
//  ordre de grandeur, même niveau, force sur une paroi, tester la loi (graphe), pente et masse volumique, limites du modèle.
//  Capacités visées (jamais affichées à l'élève) : utiliser la relation fournie P_B − P_A = ρ·g·(z_A − z_B) pour un fluide incompressible au repos ;
//  tester la loi fondamentale de la statique des fluides ; (expérimental) mesurer une pression dans un liquide ; ordres de grandeur dans l'eau et l'atmosphère.
//  Le modèle est dans statiqueFluidesModele.js (testé). Hypothèses : fluide au repos, incompressible (ρ constante), g constant, Patm = 1 013 hPa, manomètre en pression absolue.
// ====================================================

const NB = ' ';
const nbs = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const EAU = S.LIQUIDES.eau;
const INCONNU = { ...S.LIQUIDES.eau, nom: 'Liquide inconnu', couleur: ['#ebe5f7', '#b9a9de'] };

// ---------- formules (MathML) ----------
const sub = (a, b) => <msub><mi>{a}</mi><mi>{b}</mi></msub>;
const FREL = <Formule>{sub('P', 'B')}<mo>−</mo>{sub('P', 'A')}<mo>=</mo><mi>ρ</mi><mo>·</mo><mi>g</mi><mo>·</mo><mo>(</mo>{sub('z', 'A')}<mo>−</mo>{sub('z', 'B')}<mo>)</mo></Formule>;
const FABS = <Formule><mi>P</mi><mo>=</mo>{sub('P', 'atm')}<mo>+</mo><mi>ρ</mi><mo>·</mo><mi>g</mi><mo>·</mo><mi>h</mi></Formule>;
const FNIV = <Formule>{sub('z', 'A')}<mo>=</mo>{sub('z', 'B')}<mo>⇒</mo>{sub('P', 'A')}<mo>=</mo>{sub('P', 'B')}</Formule>;
const FFORCE = <Formule><mi>F</mi><mo>=</mo><mi>P</mi><mo>·</mo><mi>S</mi></Formule>;
const FLOI = <Formule><mi>P</mi><mo>=</mo>{sub('P', 'surface')}<mo>+</mo><mi>ρ</mi><mo>·</mo><mi>g</mi><mo>·</mo><mi>h</mi></Formule>;

// données figées du parcours
const H_PEN = [0, 1, 2, 3, 4];                                   // profondeurs des relevés de l'étape « tester la loi » (huile, ρ = 920 kg·m⁻³)
const RELEVES = H_PEN.map(h => ({ x: h, y: S.hPa(S.pression(S.PATM, 920, h)) }));
const TAB_PROF = [0, 2, 4, 6].map(h => [h, S.hPa(S.pression(S.PATM, 1000, h))]);
const RHO_PENTE = S.rhoDepuisReleves(0, RELEVES[0].y, 4, RELEVES[4].y);

const tableau = (lignes, entetes) => (
  <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 380, margin: '0 auto', fontSize: 15 }}>
    <thead><tr>{entetes.map(e => <th key={e} style={{ padding: '6px 8px', textAlign: 'center', background: '#e0f2fe', border: `1px solid ${KIT.bord}`, color: KIT.txt }}>{e}</th>)}</tr></thead>
    <tbody>{lignes.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${KIT.bord}`, fontFamily: 'monospace', fontWeight: 700 }}>{c}</td>)}</tr>)}</tbody>
  </table>);

// ====================================================
export function SimulationStatiqueFluides1G() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviR, noterR] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('cuve');
  const [sh, setSh] = useState(0);                  // profondeur de la sonde dans le parcours (m)
  // exploration
  const [ex, setEx] = useState({ liq: 'eau', forme: 'large', hA: 2, hB: 6, relative: false, releves: [], droite: false, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['sonde', 'tableau', 'relation', 'delta', 'absolue', 'profondeur', 'ordre', 'niveau', 'paroi', 'graphe', 'pente', 'limite'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);

  const ETAPES = [
    { id: 'sonde', titre: 'Une sonde dans l’eau', focus: ['scene'],
      texte: <>Un <strong>manomètre</strong> relié à une sonde mesure la <strong>pression absolue</strong> P (en hPa ; 1{NB}hPa = 100{NB}Pa), c’est-à-dire la pression totale à l’endroit de la sonde. Hors de l’eau, au niveau de la surface, il indique la pression de l’atmosphère : P<sub>atm</sub> = 1{NB}013{NB}hPa. On plonge la sonde dans l’eau d’une piscine (profondeur h sous la surface).</>,
      tache: { type: 'action', label: 'Descendre la sonde à 5,0 m', faire: () => setSh(5), ok: Math.abs(sh - 5) < 0.01,
        consigne: 'Descendez la sonde jusqu’à h = 5,0 m (avec le curseur ou le bouton) et observez l’afficheur.' } },
    { id: 'tableau', titre: 'Lire un tableau de mesures', focus: ['scene'],
      texte: <>On relève la pression absolue pour plusieurs profondeurs, dans l’eau de la piscine (tableau ci-dessous).</>,
      tache: { type: 'qcm', ...QCM.tableau } },
    { id: 'relation', titre: 'Une relation entre deux points', focus: ['scene'],
      texte: <>On étudie un liquide <strong>au repos</strong>, supposé <strong>incompressible</strong> : sa masse volumique ρ ne change pas d’un point à l’autre ; l’intensité de la pesanteur g = 9,81{NB}N·kg⁻¹ est aussi supposée constante. On oriente un axe vertical <em>z</em> <strong>vers le haut</strong>. Pour deux points A et B du liquide, la relation suivante est fournie (ρ en kg·m⁻³, z en m, P en Pa) :{FREL}</>,
      tache: { type: 'qcm', ...QCM.relation } },
    { id: 'delta', titre: 'Calculer une différence de pression', focus: ['scene'],
      texte: <>Dans l’eau (ρ = 1,00{NB}×{NB}10³{NB}kg·m⁻³, g = 9,81{NB}N·kg⁻¹), le point A est à la surface (z<sub>A</sub> = 0) et le point B est 3,0{NB}m plus bas (z<sub>B</sub> = −3,0{NB}m). Utilisez la relation fournie pour calculer la différence de pression P<sub>B</sub> − P<sub>A</sub>, en hPa.</>,
      tache: { type: 'num', q: 'Différence de pression P_B − P_A', carnet: 'P_B − P_A (B à 3,0 m sous A)', unite: 'hPa', vrai: S.diffPression(1000, 0, -3) / 100, tol: 0.01, affiche: v => nbs(v, 1), cs: 3,
        calcul: () => ['z_A − z_B = 0 − (−3,0 m) = +3,0 m (A est plus haut que B, donc cette différence est positive).', 'P_B − P_A = ρ·g·(z_A − z_B) = 1,00 × 10³ × 9,81 × 3,0 = 2,94 × 10⁴ Pa, soit 294 hPa (1 hPa = 100 Pa). Hypothèses : eau incompressible, g constant.'],
        pieges: [[29430, 'Le résultat est demandé en hPa : 1 hPa = 100 Pa, donc 2,94 × 10⁴ Pa = 294 hPa.'], [-294.3, 'Attention au signe : z_A − z_B = 0 − (−3,0) = +3,0 m. B est plus bas que A, donc P_B est plus grande que P_A.'], [30.0, 'Il manque g dans le calcul : ρ·g·(z_A − z_B) avec g = 9,81 N·kg⁻¹.']],
        expl: 'P_B − P_A = ρ·g·(z_A − z_B) = 1,00 × 10³ × 9,81 × 3,0 = 2,94 × 10⁴ Pa = 294 hPa.', indice: 'z_A − z_B = 0 − (−3,0 m). Multipliez ρ, g et cette différence (en m), puis convertissez les pascals en hectopascals.' } },
    { id: 'absolue', titre: 'Ce que lit le manomètre au fond', focus: ['scene'],
      texte: <>Un manomètre est posé au fond d’une piscine, à h = 8,0{NB}m sous la surface (eau : ρ = 1,00{NB}×{NB}10³{NB}kg·m⁻³, g = 9,81{NB}N·kg⁻¹). À la surface, la pression est celle de l’atmosphère : P<sub>atm</sub> = 1{NB}013{NB}hPa. Quelle pression absolue le manomètre indique-t-il ?</>,
      tache: { type: 'num', q: 'Pression absolue au fond', carnet: 'P absolue à 8,0 m de profondeur', unite: 'hPa', vrai: S.pression(S.PATM, 1000, 8) / 100, tol: 0.01, affiche: v => nbs(v, 1), cs: 4,
        calcul: () => ['Point A à la surface : P_A = P_atm = 1 013 hPa. Point B au fond : z_A − z_B = +8,0 m.', 'P_B = P_A + ρ·g·(z_A − z_B) = 101 300 + 1,00 × 10³ × 9,81 × 8,0 = 101 300 + 78 480 = 179 780 Pa ≈ 1 798 hPa.'],
        pieges: [[784.8, 'Vous avez calculé seulement la partie due à l’eau (ρ·g·h) : le manomètre mesure la pression absolue, il faut ajouter P_atm.'], [179780, 'Le résultat est demandé en hPa : 1 hPa = 100 Pa.'], [1013, 'La pression augmente avec la profondeur : il faut ajouter ρ·g·h à la pression de la surface.']],
        expl: 'P = P_atm + ρ·g·h = 1 013 + 785 ≈ 1 798 hPa (ρ·g·h = 7,85 × 10⁴ Pa = 785 hPa).', indice: 'Appliquez la relation avec A à la surface (P_A = 1 013 hPa) et B au fond : P_B = P_A + ρ·g·(z_A − z_B). Convertissez 1 013 hPa en pascals pour additionner.' },
      retenirTitre: 'La relation et l’axe z',
      retenir: <>
        <SvgRelation/>{FREL}
        <ul style={liste}>
          <li><strong>Plus on descend, plus la pression augmente.</strong> Axe z vers le haut : z<sub>A</sub> − z<sub>B</sub> {'>'} 0 si A est au-dessus de B.</li>
          <li>Exemple : A à la surface, B 3,0 m plus bas : z<sub>A</sub> − z<sub>B</sub> = +3,0 m, donc P<sub>B</sub> {'>'} P<sub>A</sub>.</li>
          <li><strong>Piège</strong> : z<sub>B</sub> − z<sub>A</sub> change le signe.</li>
        </ul></> },
    { id: 'profondeur', titre: 'Retrouver la profondeur', focus: ['scene'],
      texte: <>Un plongeur lit <strong>1{NB}500{NB}hPa</strong> sur son manomètre (pression absolue) dans un lac d’eau douce (ρ = 1,00{NB}×{NB}10³{NB}kg·m⁻³, g = 9,81{NB}N·kg⁻¹). À la surface, P<sub>atm</sub> = 1{NB}013{NB}hPa. À quelle profondeur se trouve-t-il ?</>,
      tache: { type: 'num', q: 'Profondeur du plongeur', carnet: 'Profondeur pour P = 1 500 hPa', unite: 'm', vrai: S.profondeur(150000, S.PATM, 1000), tol: 0.01, affiche: v => nbs(v, 2), cs: 3,
        calcul: () => ['P − P_atm = 1 500 − 1 013 = 487 hPa = 4,87 × 10⁴ Pa (la partie due à l’eau).', 'h = (P − P_atm) / (ρ·g) = 4,87 × 10⁴ ÷ (1,00 × 10³ × 9,81) = 4,96 m.'],
        pieges: [[15.29, 'Il faut retrancher la pression de l’atmosphère : seule la différence P − P_atm est due à l’eau.'], [0.0496, 'Convertissez les hectopascals en pascals : 487 hPa = 4,87 × 10⁴ Pa.'], [496.4, 'Le résultat est demandé en m : 4,96 m ; n’oubliez pas de convertir les hPa en Pa.']],
        expl: 'h = (P − P_atm) / (ρ·g) = (1 500 − 1 013) × 100 / (1,00 × 10³ × 9,81) = 4,96 m.', indice: 'Isolez h dans P = P_atm + ρ·g·h : h = (P − P_atm) / (ρ·g), avec des pressions en pascals.' },
      retenirTitre: 'Pression absolue ou relative',
      retenir: <>
        <SvgAbsolue/>{FABS}
        <ul style={liste}>
          <li><strong>Le manomètre lit l’atmosphère PLUS le liquide</strong> ; la pression relative, P − P<sub>atm</sub>, ne contient que ρ·g·h.</li>
          <li>Exemple de la simulation : à 8,0 m dans l’eau, 1 013 + 785 ≈ 1 798 hPa.</li>
          <li><strong>Piège</strong> : oublier P<sub>atm</sub> pour une pression absolue.</li>
        </ul></> },
    { id: 'ordre', titre: 'Un plongeur à 30 m', focus: ['scene'],
      texte: <>On cherche seulement un <strong>ordre de grandeur</strong>. L’eau de mer a une masse volumique voisine de 1{NB}000{NB}kg·m⁻³ ; g = 9,81{NB}N·kg⁻¹ ; 1{NB}bar = 10⁵{NB}Pa ; P<sub>atm</sub> est voisine de 1{NB}bar.</>,
      tache: { type: 'qcm', ...QCM.ordre } },
    { id: 'niveau', titre: 'Trois branches reliées', focus: ['scene'],
      texte: <>Trois récipients de formes très différentes sont reliés par le bas. Ils contiennent le même liquide au repos. Les points A, B et C sont à la même profondeur.</>,
      tache: { type: 'qcm', ...QCM.niveau },
      retenirTitre: 'Ordre de grandeur dans l’eau',
      retenir: <>
        <SvgOrdre/>
        <ul style={liste}>
          <li><strong>10 m d’eau ≈ 1 bar de plus</strong> ; l’atmosphère seule vaut déjà environ 1 bar (10⁵ Pa = 1 000 hPa).</li>
          <li>Exemple : à 30 m, 1 bar + 3 bar ≈ 4 bar.</li>
          <li><strong>Piège</strong> : compter 1 bar par mètre, ou oublier le bar de l’atmosphère.</li>
          <li>Pour information (au-delà des capacités exigibles) : dans l’air, près du niveau de la mer, la pression baisse d’environ 1 hPa tous les 8 m d’altitude.</li>
        </ul></> },
    { id: 'paroi', titre: 'Un bouchon dans la paroi', focus: ['scene'],
      texte: <>Un réservoir d’eau (ρ = 1,00{NB}×{NB}10³{NB}kg·m⁻³, g = 9,81{NB}N·kg⁻¹) est ouvert à l’air libre. Un bouchon de surface <strong>S = 25{NB}cm²</strong> ferme un trou dans la paroi, à <strong>h = 2,0{NB}m</strong> sous la surface. Le liquide exerce sur lui une force pressante vec(F), perpendiculaire à la paroi, de norme F = P × S (voir la simulation 162). Sur l’autre face, l’air pousse le bouchon avec la pression atmosphérique P<sub>atm</sub> : la différence entre la poussée de l’eau et celle de l’air est la <strong>force nette</strong>. La pression qui la crée est la pression due à l’eau, P<sub>eau</sub> − P<sub>atm</sub> = ρ·g·h. Quelle est la norme de cette force nette, en newtons ?</>,
      tache: { type: 'num', q: 'Norme de la force nette sur le bouchon', carnet: 'Force nette sur le bouchon', unite: 'N', vrai: S.force(1000 * S.G * 2.0, 25e-4), tol: 0.02, affiche: v => nbs(v, 1), cs: 2,
        calcul: () => ['Pression due à l’eau : P_eau − P_atm = ρ·g·h = 1,00 × 10³ × 9,81 × 2,0 = 1,96 × 10⁴ Pa. Surface : S = 25 cm² = 25 × 10⁻⁴ m² = 2,5 × 10⁻³ m².', 'F = (P_eau − P_atm) × S = 1,96 × 10⁴ × 2,5 × 10⁻³ = 49 N. Hypothèse : la pression est la même sur toute la petite surface du bouchon.'],
        pieges: [[490500, 'Convertissez la surface en m² : 25 cm² = 25 × 10⁻⁴ m².'], [302.3, 'Vous avez utilisé la pression absolue : la pression atmosphérique s’exerce aussi sur l’autre face du bouchon, elle se retranche.'], [19620, 'C’est la pression due à l’eau, en Pa : il reste à multiplier par la surface S (en m²) pour obtenir une force en N.']],
        expl: 'F = ρ·g·h × S = 1,00 × 10³ × 9,81 × 2,0 × 25 × 10⁻⁴ = 49 N. La force est perpendiculaire à la paroi, dirigée du liquide vers l’extérieur.', indice: 'Pression due à l’eau : ρ·g·h (en Pa). Puis F = P × S avec S convertie en m² (1 cm² = 10⁻⁴ m²).' },
      retenirTitre: 'Même niveau, même pression',
      retenir: <>
        <SvgNiveau/>{FNIV}
        <ul style={liste}>
          <li><strong>La pression ne connaît que la profondeur</strong> : ni la forme du récipient, ni la quantité de liquide.</li>
          <li>Exemple : dans trois branches reliées de formes différentes, le liquide monte au même niveau.</li>
          <li><strong>Idée fausse</strong> : « plus de liquide, plus de pression ». <strong>Vrai</strong> : seule compte la hauteur au-dessus du point.</li>
        </ul></> },
    { id: 'graphe', titre: 'Tester la relation', focus: ['scene'],
      texte: <>Un élève mesure la pression absolue d’un liquide (masse volumique inconnue) à plusieurs profondeurs h (tableau ci-dessous). Pour tester la relation fournie, il va tracer le graphique P en fonction de h.</>,
      tache: { type: 'qcm', ...QCM.graphe },
      retenirTitre: 'La force sur une paroi',
      retenir: <>
        <SvgParoi/>{FFORCE}
        <ul style={liste}>
          <li><strong>La force vec(F) est perpendiculaire à la paroi</strong>, du liquide vers la paroi ; sa norme est F = P × S (S en m²).</li>
          <li>Exemple : bouchon de 25 cm² à 2,0 m sous la surface, environ 49 N de force nette.</li>
          <li><strong>Piège</strong> : l’atmosphère pousse aussi de l’autre côté ; convertir cm² en m².</li>
        </ul></> },
    { id: 'pente', titre: 'Exploiter la droite', focus: ['scene'],
      texte: <>Les points du graphique sont alignés, à la précision du manomètre près : la relation est vérifiée. On lit P = {RELEVES[0].y}{NB}hPa à h = 0{NB}m et P = {milliers(RELEVES[4].y)}{NB}hPa à h = 4,00{NB}m. La pente de la droite, ΔP / Δh, est égale à ρ·g. Calculez la masse volumique ρ du liquide (g = 9,81{NB}N·kg⁻¹).</>,
      tache: { type: 'num', q: 'Masse volumique du liquide', carnet: 'Masse volumique du liquide (pente)', unite: 'kg·m⁻³', vrai: RHO_PENTE, tol: 0.03, affiche: v => nbs(v, 0), cs: 3,
        calcul: () => [`ΔP = ${milliers(RELEVES[4].y)} − ${RELEVES[0].y} = ${RELEVES[4].y - RELEVES[0].y} hPa = ${(RELEVES[4].y - RELEVES[0].y) * 100} Pa ; Δh = 4,00 m. Pente = ΔP / Δh = ${nbs((RELEVES[4].y - RELEVES[0].y) * 100 / 4, 0)} Pa·m⁻¹.`, `ρ = pente / g = ${nbs((RELEVES[4].y - RELEVES[0].y) * 100 / 4, 0)} ÷ 9,81 ≈ ${nbs(RHO_PENTE, 0)} kg·m⁻³. Hypothèse : liquide incompressible, donc pente constante.`],
        pieges: [[(RELEVES[4].y - RELEVES[0].y) * 100 / 4, 'C’est la pente ρ·g (en Pa·m⁻¹) : il reste à la diviser par g pour obtenir ρ.'], [(RELEVES[4].y - RELEVES[0].y) / 4 / 9.81, 'Convertissez les hPa en Pa avant de diviser (1 hPa = 100 Pa).'], [RELEVES[4].y * 100 / (4 * 9.81), 'Il faut l’écart ΔP entre les deux points, pas la pression P elle-même : P comprend aussi l’atmosphère.']],
        expl: `ρ = ΔP / (g·Δh) = ${(RELEVES[4].y - RELEVES[0].y) * 100} / (9,81 × 4,00) ≈ ${nbs(RHO_PENTE, 0)} kg·m⁻³.`, indice: 'ρ·g = ΔP / Δh avec ΔP en pascals (1 hPa = 100 Pa) et Δh en mètres. Divisez ensuite par g.' } },
    { id: 'limite', titre: 'Jusqu’où le modèle est-il valable ?', focus: ['scene'],
      texte: <>La relation fournie suppose que ρ et g sont les mêmes en A et en B. Les <strong>hypothèses du modèle</strong> sont rappelées ci-contre.</>,
      tache: { type: 'qcm', ...QCM.limite },
      retenirTitre: 'Tester la loi',
      retenir: <>
        <SvgLoi/>{FLOI}
        <ul style={liste}>
          <li><strong>P(h) est une droite</strong> : ordonnée à l’origine = pression à la surface, pente = ρ·g.</li>
          <li>Exemple : pente ≈ 9,0 × 10³ Pa par mètre, donc ρ ≈ 9,2 × 10² kg·m⁻³.</li>
          <li><strong>Piège</strong> : garder des hPa (il faut des Pa), ou prendre P au lieu de ΔP.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { const g = S.graineAleatoire(); setDefi({ ...(type === 'cuve' ? S.tirerDefiCuve(g) : S.tirerDefiRho(g)), reps: {}, verifie: false }); };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, defi.vrai, defi.type === 'rho' ? 0.015 : 0.03);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'cuve' ? noterC : noterR)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('sf-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['cuve', 'Cuve : hauteur de liquide'], ['rho', 'Liquide inconnu : masse volumique']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'cuve' ? 'Défi : quelle est la hauteur de liquide dans la cuve ?' : 'Défi : quelle est la masse volumique du liquide ?'}</div>
      {defi.type === 'cuve' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Une cuve ouverte à l’air libre contient du liquide ({defi.l.nom.toLowerCase()}, ρ = {defi.l.aff}{NB}kg·m⁻³ ; g = 9,81{NB}N·kg⁻¹). Une sonde posée au fond indique la pression absolue <strong>P = {milliers(defi.P)}{NB}hPa</strong> ; à la surface libre, P<sub>atm</sub> = 1{NB}013{NB}hPa. Quelle est la hauteur de liquide dans la cuve ? Donnez le résultat en mètres avec 3{NB}chiffres significatifs (marge acceptée : ± 3{NB}%).</div>
        {champ('Hauteur de liquide', 'm')}
        <IndiceDefi cache={defi.verifie && defi.ok}>Seule la partie due au liquide dépend de la hauteur : P − P<sub>atm</sub> = ρ·g·h. Convertissez les hPa en Pa (1 hPa = 100 Pa), puis h = (P − P<sub>atm</sub>) / (ρ·g).</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Une cuve ouverte contient un liquide inconnu. Une sonde relève la pression absolue <strong>P = {milliers(defi.P1)}{NB}hPa</strong> à la profondeur <strong>h = {nbs(defi.h1, 2)}{NB}m</strong>, puis <strong>P = {milliers(defi.P2)}{NB}hPa</strong> à <strong>h = {nbs(defi.h2, 2)}{NB}m</strong> (g = 9,81{NB}N·kg⁻¹). Quelle est la masse volumique du liquide ? Donnez le résultat en kg·m⁻³ avec 3{NB}chiffres significatifs (marge acceptée : ± 1,5{NB}%).</div>
        {champ('Masse volumique', 'kg·m⁻³')}
        <IndiceDefi cache={defi.verifie && defi.ok}>Entre les deux relevés, la pression augmente de ΔP = ρ·g·Δh. Calculez ΔP (en Pa, 1 hPa = 100 Pa) et Δh (en m), puis ρ = ΔP / (g·Δh).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="sf-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'cuve' ? `✓ Correct. h = (P − P_atm) / (ρ·g) = ${nbs(defi.vrai, 2)} m (marge acceptée : ± 3 %).`
          : `✓ Correct. ρ = ΔP / (g·Δh) ≈ ${nbs(defi.vrai, 0)} kg·m⁻³ (marge acceptée : ± 1,5 %). C’est ${defi.l.nom.toLowerCase().startsWith('e') || defi.l.nom.toLowerCase().startsWith('h') ? 'l’' : 'du '}${defi.l.nom.toLowerCase()}.`)
          : defi.type === 'cuve' ? '✗ Vérifiez : retranchez P_atm, convertissez en pascals, puis divisez par ρ·g.'
            : '✗ Vérifiez : utilisez l’écart ΔP entre les deux relevés (en Pa), pas la pression P elle-même ; puis divisez par g·Δh.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (air) => (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Fluide au repos</strong> : pas d’écoulement ni d’agitation ; la relation P<sub>B</sub> − P<sub>A</sub> = ρ·g·(z<sub>A</sub> − z<sub>B</sub>) ne s’applique pas à un fluide en mouvement.</li>
      <li><strong>Fluide incompressible</strong> : la masse volumique ρ ne dépend pas de la profondeur. {air ? 'Très bon pour un liquide (l’eau est comprimée de moins de 0,02 % à 30 m). Pour un gaz comme l’air, ρ varie avec l’altitude : la relation ne donne qu’un ordre de grandeur sur quelques dizaines de mètres, et ne convient plus sur plusieurs kilomètres.' : 'Valeurs de ρ : eau 1,00 × 10³, eau de mer 1,03 × 10³, huile d’olive 9,2 × 10², mercure 1,36 × 10⁴ kg·m⁻³ (valeurs usuelles, qui varient un peu avec la température).'}</li>
      <li><strong>g constant</strong> : g = 9,81 N·kg⁻¹ sur toute la hauteur étudiée (variation négligeable sur quelques kilomètres).</li>
      <li><strong>Pression à la surface</strong> : le liquide est à l’air libre, sous la pression atmosphérique P<sub>atm</sub> = 1 013 hPa, supposée constante.</li>
      <li><strong>Pression absolue ou relative</strong> : le manomètre de cette simulation mesure la pression <em>absolue</em> (résolution de 1 hPa) ; la pression relative est P − P<sub>atm</sub>. Unités : 1 bar = 10⁵ Pa = 1 000 hPa.</li>
      <li><strong>Chiffres significatifs</strong> : un résultat n’a pas plus de chiffres significatifs que la donnée la moins précise ; on garde un chiffre de plus dans les calculs intermédiaires.</li>
    </ul>);
  const panneauHypo = (air) => <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses(air)}</div>;

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const PabsSonde = S.hPa(S.pression(S.PATM, EAU.rho, sh));
  const sceneGuide = (() => {
    switch (idE) {
      case 'sonde': return boite('Une piscine et une sonde de pression', <>
        <SceneCuve h={sh} hmax={10} dec={1} liquide={EAU} forme="large" ecran={{ valeur: milliers(PabsSonde), unite: 'hPa', nom: 'pression absolue' }} titre="Une sonde dans une piscine"/>
        <div style={{ marginTop: 8 }}><Curseur nom="Profondeur de la sonde h" valeur={sh} onChange={setSh} min={0} max={10} pas={0.5} unite="m" decimales={1} couleur="#c2410c"/></div></>, cadre('scene'));
      case 'tableau': return boite('Pression en fonction de la profondeur', <>
        <SceneCuve h={sh} hmax={10} dec={1} liquide={EAU} forme="large" ecran={{ valeur: milliers(PabsSonde), unite: 'hPa', nom: 'pression absolue' }} titre="Une sonde dans une piscine"/>
        <div style={{ marginTop: 8 }}><Curseur nom="Profondeur de la sonde h" valeur={sh} onChange={setSh} min={0} max={10} pas={0.5} unite="m" decimales={1} couleur="#c2410c"/></div>
        <div style={{ marginTop: 6 }}>{tableau(TAB_PROF.map(([h, p]) => [nbs(h, 1), milliers(p)]), ['h (m)', 'P (hPa)'])}</div></>, cadre('scene'));
      case 'relation': return boite('Deux points dans le liquide', <SceneCuve hmax={10} liquide={EAU} forme="large" axe points={[{ nom: 'A', h: 1.5 }, { nom: 'B', h: 5 }]} titre="Deux points A et B, axe z vers le haut"/>, cadre('scene'));
      case 'delta': return boite('A à la surface, B à 3,0 m', <SceneCuve hmax={10} liquide={EAU} forme="large" axe points={[{ nom: 'A', h: 0 }, { nom: 'B', h: 3 }]} titre="A à la surface, B plus bas"/>, cadre('scene'));
      case 'absolue': return boite('Un manomètre au fond de la piscine', <SceneCuve h={8} hmax={10} liquide={EAU} forme="large" ecran={{ valeur: fait('absolue') ? milliers(1798) : '?', unite: 'hPa', nom: 'pression absolue' }} titre="Un manomètre au fond de la piscine"/>, cadre('scene'));
      case 'profondeur': return boite('La lecture du plongeur', <SceneCuve h={fait('profondeur') ? S.profondeur(150000, S.PATM, 1000) : 4} hmax={10} liquide={EAU} forme="large" ecran={{ valeur: milliers(1500), unite: 'hPa', nom: 'pression absolue' }} coteTxt={fait('profondeur') ? 'h = 4,96 m' : 'h = ?'} titre="Un plongeur dans un lac (profondeur à trouver)"/>, cadre('scene'));
      case 'ordre': return boite('Un plongeur dans la mer', <SceneCuve h={30} hmax={40} dec={0} liquide={S.LIQUIDES.mer} forme="large" ecran={{ valeur: '?', unite: 'bar', nom: 'pression absolue' }} note="schéma non à l’échelle" titre="Un plongeur à 30 m de profondeur"/>, cadre('scene'));
      case 'niveau': return boite('Trois branches communicantes', <SceneVases liquide={EAU}/>, cadre('scene'));
      case 'paroi': return boite('Le bouchon dans la paroi', <SceneParoi/>, cadre('scene'));
      case 'graphe': return boite('Les relevés de l’élève', tableau(RELEVES.map(p => [nbs(p.x, 1), milliers(p.y)]), ['h (m)', 'P (hPa)']), cadre('scene'));
      case 'pente': return boite('Pression en fonction de la profondeur', <GraphePH pts={RELEVES} droite={S.ajuste(RELEVES)} xMax={4} pasX={1} yMin={1000} yMax={1400} pasY={100}/>, cadre('scene'));
      case 'limite': return <div style={cadre('scene')}>{panneauHypo(fait('limite'))}</div>;
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const liq = S.liquideDe(ex.liq), hmax = liq.hmax, rho = liq.rho;
  const hAc = Math.min(ex.hA, hmax), hBc = Math.min(ex.hB, hmax);
  const dec = hmax < 2 ? 2 : 1;
  const PAabs = S.hPa(S.pression(S.PATM, rho, hAc)), PBabs = S.hPa(S.pression(S.PATM, rho, hBc));
  const aff = p => ex.relative ? p - S.PATM_HPA : p;
  const changerLiquide = id => { const l = S.liquideDe(id), r = v => Math.min(l.hmax, Math.round(Math.min(v, l.hmax) / l.pas) * l.pas);
    setE({ liq: id, hA: id === 'mercure' ? 0.3 : r(ex.hA), hB: id === 'mercure' ? 0.7 : r(ex.hB), releves: [] }); };
  const ajust = S.ajuste(ex.releves);
  const pasY = hmax < 2 ? 500 : 200, yMaxG = Math.ceil((S.PATM_HPA + rho * S.G * hmax / 100) / pasY) * pasY;
  const relever = () => setEx(s => (s.releves.some(p => Math.abs(p.x - hAc) < 1e-9) ? s : { ...s, releves: [...s.releves, { x: hAc, y: PAabs }].sort((a, b) => a.x - b.x) }));

  const expReglages = (<>
    {etiquette('Liquide', <select value={ex.liq} onChange={x => changerLiquide(x.target.value)} style={sel}>{S.ORDRE_LIQUIDES.map(k => <option key={k} value={k}>{S.LIQUIDES[k].nom} (ρ = {S.LIQUIDES[k].aff} kg·m⁻³)</option>)}</select>)}
    {etiquette('Forme du récipient', <select value={ex.forme} onChange={x => setE({ forme: x.target.value })} style={sel}>{['large', 'etroit', 'evase'].map(k => <option key={k} value={k}>{k === 'large' ? 'Cuve large' : k === 'etroit' ? 'Éprouvette étroite' : 'Vase évasé'}</option>)}</select>)}
    <Curseur nom="Profondeur de la sonde A, h_A" valeur={hAc} onChange={v => setE({ hA: v, ouv: ex.ouv })} min={0} max={hmax} pas={liq.pas} unite="m" decimales={dec} couleur="#c2410c"/>
    {aide('La sonde A mesure la pression ; l’afficheur indique la pression absolue. Changez le liquide, la forme ou la quantité : que devient la pression à une profondeur donnée ?')}
    <Section titre={`Un second point B (${nbs(hBc, dec)} m) et l’affichage ${ex.relative ? 'relatif' : 'absolu'}`} ouvert={!!ex.ouv.b} onBascule={() => ouvrir('b')}>
      <Curseur nom="Profondeur du point B, h_B" valeur={hBc} onChange={v => setE({ hB: v })} min={0} max={hmax} pas={liq.pas} unite="m" decimales={dec} couleur="#334155"/>
      {etiquette('Le manomètre affiche', <select value={ex.relative ? 'rel' : 'abs'} onChange={x => setE({ relative: x.target.value === 'rel' })} style={sel}><option value="abs">la pression absolue P</option><option value="rel">la pression relative P − P_atm</option></select>)}
      {aide('Le point B sert à comparer deux profondeurs avec la relation fournie. La pression relative ne compte que la partie due au liquide.')}
    </Section>
  </>);
  const expScene = <SceneCuve h={hAc} hmax={hmax} dec={dec} liquide={liq} forme={ex.forme} axe xs={205 + (ex.forme === 'etroit' ? -2 : 0) - 0} cote nomSonde="A"
    points={[{ nom: 'B', h: hBc, x: ex.forme === 'etroit' ? 247 : 262 }]} ecran={{ valeur: milliers(aff(PAabs)), unite: 'hPa', nom: ex.relative ? 'pression relative' : 'pression absolue' }} titre={`${liq.nom} : sonde A et point B`} cleGrad="ex"/>;
  const ecartLu = PBabs - PAabs, ecartRel = S.diffPression(rho, -hAc, -hBc) / 100;
  const expMesures = (<>
    {donnee('Pression en A (absolue)', `${milliers(PAabs)}${NB}hPa = ${nbs(PAabs / 1000, 3)}${NB}bar`, COL.orange)}
    {donnee('Pression en A (relative, P − P_atm)', `${milliers(PAabs - S.PATM_HPA)}${NB}hPa`, COL.gris)}
    {donnee('Pression en B (absolue)', `${milliers(PBabs)}${NB}hPa`, COL.bleu)}
    {donnee('P_B − P_A lue sur les manomètres', `${ecartLu}${NB}hPa`, COL.vert)}
    {donnee('ρ·g·(z_A − z_B) calculée', `${nbs(ecartRel, 1)}${NB}hPa`, COL.violet)}
    {aide('Les deux dernières lignes sont égales, à la résolution du manomètre près (1 hPa). Elles ne dépendent ni de la forme du récipient, ni de la quantité de liquide.')}
  </>);
  const expGraphe = (<>
    <GraphePH pts={ex.releves} droite={ex.droite && ajust ? ajust : null} xMax={hmax} pasX={hmax / 5} yMin={1000} yMax={yMaxG} pasY={pasY} cur={{ x: hAc, y: PAabs }}/>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
      <button onClick={relever} style={styleBouton(true, '#0369a1')}>Relever le point A</button>
      <button onClick={() => setE({ releves: [], droite: false })} style={styleBouton(false)}><Pic n="refresh"/>Effacer</button>
      <button onClick={() => setE({ droite: !ex.droite })} aria-pressed={ex.droite} style={stylePetitBouton(ex.droite, '#15803d')}>Droite d’ajustement</button>
    </div>
    {aide('Déplacez la sonde A, puis « Relever le point A » : le point (h, P) s’ajoute au graphique (cercle orange : position actuelle). Relevez au moins deux profondeurs, puis tracez la droite.')}
    {ajust && ex.droite && <div style={{ marginTop: 4 }}>
      {donnee('Pente de la droite', `${nbs(ajust.pente, 1)}${NB}hPa/m`, COL.vert)}
      {donnee('Ordonnée à l’origine', `${nbs(ajust.ord, 0)}${NB}hPa`, COL.orange)}
      {donnee('ρ déduite = pente / g', `${nbs(ajust.pente * 100 / S.G, 0)}${NB}kg·m⁻³`, COL.violet)}
      {donnee(`ρ du liquide (donnée)`, `${nbs(rho, 0)}${NB}kg·m⁻³`)}
    </div>}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Gardez la sonde à 2,0 m et changez la forme du récipient. La pression change-t-elle ?</li>
      <li>Placez A et B à la même profondeur : que vaut P_B − P_A ? Et si B est plus haut que A ?</li>
      <li>Passez de l’eau à l’huile, puis au mercure : à profondeur égale, quel liquide donne la plus grande pression ?</li>
      <li>Passez en pression relative : que vaut-elle à la surface ?</li>
      <li>Relevez 4 ou 5 profondeurs et tracez la droite : que représentent sa pente et son ordonnée à l’origine ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>P<sub>B</sub> − P<sub>A</sub> = ρ·g·(z<sub>A</sub> − z<sub>B</sub>), axe z vers le haut (liquide incompressible au repos)</li>
        <li>à la profondeur h : P = P<sub>atm</sub> + ρ·g·h ; pression relative = P − P<sub>atm</sub></li>
        <li>même profondeur, même pression : ni la forme, ni la quantité de liquide n’interviennent</li>
        <li>force sur une paroi : F = P·S, perpendiculaire à la paroi ; dans l’eau, environ +1 bar tous les 10 m</li>
        <li>graphe P(h) : droite d’ordonnée P à la surface et de pente ρ·g</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  const defiScene = defi && (defi.type === 'cuve'
    ? <SceneCuve h={defi.l.hmax} hmax={defi.l.hmax} dec={0} liquide={defi.l} forme="large" ecran={{ valeur: milliers(defi.P), unite: 'hPa', nom: 'pression absolue' }} coteTxt="hauteur ?" note="schéma non à l’échelle" titre="Une cuve dont on cherche la hauteur de liquide" cleGrad="d1"/>
    : <SceneCuve h={4} hmax={10} dec={0} liquide={INCONNU} forme="large" ecran={{ valeur: '?', unite: 'hPa', nom: 'pression absolue' }} coteTxt="h variable" note="schéma non à l’échelle" titre="Un liquide inconnu, deux relevés de pression" cleGrad="d2"/>);
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sf-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .sf-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .sf-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .sf-l1.cote .sf-carte { order: 2; } .sf-l1.cote .sf-main { order: 1; }
          .sf-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .sf-ex > .sf-ex-scene { grid-column: 1; grid-row: 1; } .sf-ex > .sf-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .sf-ex > .sf-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .sf-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sf-in { animation: sf-fondu 0.35s ease-out; } @keyframes sf-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Statique des fluides : pression et profondeur</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On étudie la <strong>pression</strong> dans un <strong>liquide au repos</strong> : on la mesure à différentes profondeurs, on utilise une relation fournie pour la calculer, on la teste, puis on discute les hypothèses du modèle.</div>
      {enExplore ? <>
        <div className="sf-ex">
          <div className="sf-ex-scene">{boite('Le récipient, la sonde A et le point B', expScene)}</div>
          <div className="sf-ex-reglages">{boite('Réglages', expReglages)}</div>
          <div className="sf-ex-mesures">{boite('Mesures et calculs', expMesures)}</div>
        </div>
        <Section titre="Graphique P(h) : tester la loi" ouvert={!!ex.ouv.graphe} onBascule={() => ouvrir('graphe')}>{expGraphe}</Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses(true)}</Section>
      </> : <>
        <div className={`sf-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="sf-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="sf-carte sf-hypo-defi">{panneauHypo(true)}</div> : null}
          <div className="sf-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'cuve' ? suiviC : suiviR}/></div>}
            {enDefi && defi && <div className="sf-in">{boite(defi.type === 'cuve' ? 'La cuve' : 'Le liquide inconnu', defiScene)}</div>}
            {enGuide && <div className="sf-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && fait('limite') && <div style={{ marginBottom: 12 }}>{panneauHypo(true)}</div>}
      </>}
    </div>
  );
}
