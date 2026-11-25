import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./laserModele";
import { QCM } from "./laserQcm";
import { SceneLaser, SvgProprietes, SvgSection, SvgDistLaser, SvgEnergie, SvgNorme, SvgClasses } from "./LaserSchemas";

const SIM_ID = 230, CLE_GUIDE = 'laser-guide-v1';
declarerDefis(SIM_ID, [['secu', 'Sécurité d’un faisceau laser'], ['decoupe', 'Laser de découpe']]);

// ====================================================
//  SIM 230 — LASER : ÉCLAIREMENT, ÉNERGIE REÇUE ET SÉCURITÉ (TSTL, enseignement PCM, partie « Énergie et ondes »).
//  Une seule idée : un faisceau laser concentre son flux sur une très petite section (E = φ ÷ S, S = πD² ÷ 4) ; énergie reçue Q = φ × Δt ;
//  une norme limite l'éclairement et la durée d'exposition de l'œil (Δt max = H ÷ E) ; classes de laser et consignes de sécurité.
//  Aucune situation des documents du Moodle : laser de 4 mW (faisceau de 2,0 mm), laser de gravure de 2,0 W, laser de découpe, norme INVENTÉE (valeurs annoncées dans les hypothèses).
//  Capacités visées (jamais affichées à l'élève) : établir et exploiter la relation entre énergie reçue, flux et durée d'exposition ; citer les propriétés d'un faisceau laser ;
//  citer les consignes de sécurité et exploiter une norme pour déterminer la durée maximale d'exposition ; extraire d'une documentation les caractéristiques d'un laser.
//  Modèle : laserModele.js (test node). QCM : laserQcm.js. Schémas : LaserSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtV = v => String(Number(Number(v).toPrecision(3))).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const lu3 = x => Number(Number(x).toPrecision(3));
const sci = v => { if (v === 0 || !isFinite(v)) return String(v); const e = Math.floor(Math.log10(Math.abs(v))); return `${nbf(v / 10 ** e, 2)}${NB}×${NB}10^${e}`; };
const gdE = v => (v >= 1000 ? nbf(Math.round(v / 10) * 10, 0) : v >= 100 ? nbf(v, 0) : nbf(v, 1));
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const P = M.PARCOURS;

// ---------- valeurs de référence du parcours ----------
const S1 = M.sectionMm2(P.d), S1m = M.section(P.d), E1 = M.eclairement(P.phi, P.d);
const D5 = M.diametre(P.d, P.theta, P.L), E5 = M.eclairement(P.phi, D5);
const Q025 = M.energie(P.phi, M.T_REFLEXE) * 1000;                 // mJ
const DTGRAV = M.duree(P.Qgrav, P.Pgrav);
const PHIMAX = M.fluxMax(P.d) * 1e6;                               // µW
const DTMAX = M.dureeMax(E1) * 1000;                               // ms
const E1_L = lu3(E1), S1_L = lu3(S1);

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(Number(ev.target.value))} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);

// ====================================================
export function SimulationLaser() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('secu');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ mw: 4, D: 2, L: 2, th: 0.1, ms: 250 });
  const [gL, setGL] = useState(0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['brillant', 'section', 'eclair', 'distance', 'energie', 'gravure', 'limite', 'fluxmax', 'dureemax', 'reflexe', 'classe', 'consigne', 'bilan'];
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const curseurL = enExplore || (enGuide && deja('limite'));

  const ETAPES = [
    { id: 'brillant', titre: 'Un faisceau très brillant', focus: ['scene'],
      texte: <>Un laser émet un <strong>faisceau</strong> de lumière rouge très mince. Son <strong>flux énergétique</strong>, noté <strong>φ</strong> (lettre grecque « phi »), est la puissance lumineuse émise, en watts (W). Ici <strong>φ = 4,0 mW</strong> (1 mW = 0,001 W). Une petite lampe de 4,0 mW éclaire à peine, alors que ce faisceau éblouit si on le regarde.</>,
      tache: { type: 'qcm', q: 'Pourquoi ce faisceau éblouit-il bien plus qu’une lampe de même flux (4,0 mW) ?', ...QCM.brillant,
        expl: 'Le flux est le même, mais le faisceau est très mince : toute la puissance tombe sur une toute petite surface. La puissance reçue par mètre carré (l’éclairement) est donc énorme.', indice: 'Les deux sources ont le même flux. Qu’est-ce qui diffère : la surface sur laquelle la lumière arrive ?' } },
    { id: 'section', titre: 'La section du faisceau', focus: ['scene'],
      texte: <>Le faisceau est un cylindre de lumière. Sa <strong>section</strong>, notée <strong>S</strong>, est un disque de <strong>diamètre D = {nbf(P.d, 1)} mm</strong> : <strong>S = π D² ÷ 4</strong> (D en mm, S en mm²).</>,
      tache: { type: 'num', q: `Section S du faisceau de diamètre D = ${nbf(P.d, 1)} mm, en mm²`, unite: 'mm²', vrai: S1, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        pieges: [[Math.PI * P.d * P.d, 'Il faut diviser par 4 : S = π D² ÷ 4.'], [Math.PI * P.d, 'Le diamètre est au carré : S = π × D × D ÷ 4.'], [Math.PI * P.d * P.d / 2, 'Le facteur est 1/4, pas 1/2 : S = π D² ÷ 4.']],
        calcul: () => [`S = π D² ÷ 4 = π × ${nbf(P.d, 1)}² ÷ 4 = ${nbf(S1, 3)} mm².`],
        expl: `S = π × ${nbf(P.d, 1)}² ÷ 4 = ${nbf(S1, 3)} mm², soit environ ${nbf(S1, 2)} mm².`, indice: 'S = π × D × D ÷ 4, avec D = 2,0 mm. Calculez D² d’abord.' } },
    { id: 'eclair', titre: 'L’éclairement du faisceau', focus: ['scene'],
      retenirTitre: 'À retenir : trois propriétés du laser',
      retenir: <>
        <SvgProprietes/>
        <ul style={puces}>
          <li>Un laser émet un faisceau <strong>monochromatique</strong> (une seule couleur), <strong>directif</strong> (il s’ouvre à peine) et à <strong>éclairement élevé</strong> (flux concentré sur une petite surface).</li>
          <li>Exemple : 4 mW dans un faisceau de 2 mm de diamètre éclaire beaucoup plus qu’une lampe de 4 mW qui éclaire une pièce.</li>
          <li>Moyen de s’en souvenir : <strong>« une couleur, une direction, un point brillant »</strong>.</li>
        </ul></>,
      texte: <>L’<strong>éclairement</strong> <strong>E</strong> est la puissance reçue par mètre carré (W/m²) : <strong>E = φ ÷ S</strong>, avec φ en watts et S en m². Rappels : φ = <strong>4,0 mW = 0,0040 W</strong> et S = <strong>{nbf(S1_L, 2)} mm²</strong> = {nbf(S1_L, 2)} × 10⁻⁶ m² (1 mm² = 10⁻⁶ m²).</>,
      tache: { type: 'num', q: 'Éclairement E du faisceau, en W/m²', unite: 'W/m²', vrai: E1, tol: 0.05, affiche: v => nbf(v, 0), cs: 3,
        pieges: [[0.004 / S1_L, 'La section est restée en mm² : convertissez-la en m² (1 mm² = 10⁻⁶ m²).'], [4 / S1_L * 1e6, 'Le flux est resté en mW : convertissez-le en watts (4,0 mW = 0,0040 W).'], [0.004 * S1_L * 1e-6, 'Il faut diviser le flux par la section, pas les multiplier.']],
        calcul: () => [`φ = 4,0 mW = 0,0040 W ; S = ${nbf(S1_L, 2)} mm² = ${nbf(S1_L, 2)} × 10⁻⁶ m²`, `E = φ ÷ S = 0,0040 ÷ (${nbf(S1_L, 2)} × 10⁻⁶) = ${nbf(E1, 0)} W/m².`],
        expl: `E = 0,0040 ÷ ${nbf(S1_L, 2)}·10⁻⁶ ≈ ${nbf(E1, 0)} W/m² : un éclairement de plus de 1 000 W/m², de l’ordre de celui du soleil.`, indice: 'E = φ ÷ S avec φ = 0,0040 W et S = 3,14 × 10⁻⁶ m². Attention aux puissances de dix.' } },
    { id: 'distance', titre: 'En éloignant le mur', focus: ['scene'],
      retenirTitre: 'À retenir : section et éclairement',
      retenir: <>
        <SvgSection/>
        <ul style={puces}>
          <li>La section est un disque : <strong>S = π D² ÷ 4</strong> (D en mm, S en mm², 1 mm² = 10⁻⁶ m²) ; l’éclairement est <strong>E = φ ÷ S</strong>.</li>
          <li>Exemple : 2 mW dans un faisceau de 1,0 mm de diamètre : S ≈ 0,785 mm², E ≈ 2 500 W/m².</li>
          <li>Moyen de s’en souvenir : <strong>« diamètre ÷ 2, éclairement × 4 »</strong>.</li>
        </ul></>,
      texte: <>Le faisceau s’ouvre très légèrement : son diamètre augmente de <strong>0,10 mm par mètre</strong> (divergence θ = 0,10 mrad), soit <strong>D = 2,0 + 0,10 × L</strong> (D en mm, L en m). Le mur est maintenant à <strong>L = {P.L} m</strong>. Le flux reste φ = 4,0 mW = 0,0040 W.</>,
      tache: { type: 'num', q: `Éclairement E sur le mur à L = ${P.L} m, en W/m²`, unite: 'W/m²', vrai: E5, tol: 0.05, affiche: v => nbf(v, 0), cs: 3,
        pieges: [[E1, 'Le diamètre a un peu augmenté : recalculez la section avec D = 2,5 mm.'], [E1 / 25, 'Ce n’est pas une lumière qui s’étale dans toutes les directions : la section d’un faisceau laser augmente très peu.']],
        calcul: () => [`D = 2,0 + 0,10 × ${P.L} = ${nbf(D5, 1)} mm`, `S = π × ${nbf(D5, 1)}² ÷ 4 = ${nbf(M.sectionMm2(D5), 2)} mm² = ${nbf(M.sectionMm2(D5), 2)} × 10⁻⁶ m²`, `E = 0,0040 ÷ (${nbf(M.sectionMm2(D5), 2)} × 10⁻⁶) = ${nbf(E5, 0)} W/m².`],
        expl: `D = ${nbf(D5, 1)} mm, S = ${nbf(M.sectionMm2(D5), 2)} mm², E = ${nbf(E5, 0)} W/m² : à 5 m, l’éclairement n’a diminué que d’environ un tiers.`, indice: 'Calculez D = 2,0 + 0,10 × 5 (en mm), puis S = π D² ÷ 4, puis E = φ ÷ S avec S en m².' } },
    { id: 'energie', titre: 'L’énergie reçue', focus: ['scene'],
      retenirTitre: 'À retenir : un laser s’étale très peu',
      retenir: <>
        <SvgDistLaser/>
        <ul style={puces}>
          <li>Le faisceau laser garde une section <strong>presque constante</strong> : son éclairement diminue très peu avec la distance, alors que celui d’une lampe ponctuelle est divisé par 25 quand la distance est multipliée par 5.</li>
          <li>Exemple : diamètre de 2,0 mm au départ et 2,5 mm à 5 m, soit un éclairement divisé par 1,6 seulement.</li>
          <li>Moyen de s’en souvenir : <strong>« la lampe s’étale, le laser reste fin »</strong>.</li>
        </ul></>,
      texte: <>L’<strong>énergie</strong> <strong>Q</strong> reçue par une cible est le produit du flux par la durée d’exposition <strong>Δt</strong> : <strong>Q = φ × Δt</strong> (Q en joules, φ en watts, Δt en secondes). Le faisceau (φ = <strong>0,0040 W</strong>) tombe sur une cible pendant <strong>Δt = 0,25 s</strong>.</>,
      tache: { type: 'num', q: 'Énergie Q reçue par la cible, en millijoules (mJ), avec 2 chiffres significatifs', unite: 'mJ', vrai: Q025, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[1000 * 0.004 / 0.25, 'Il faut multiplier le flux par la durée, pas les diviser.'], [Q025 / 1000, 'Cette valeur est en joules : 1 J = 1 000 mJ.']],
        calcul: () => [`Q = φ × Δt = 0,0040 × 0,25 = 0,0010 J = ${nbf(Q025, 1)} mJ.`],
        expl: `Q = 0,0040 × 0,25 = 0,0010 J, soit ${nbf(Q025, 1)} mJ.`, indice: 'Q = φ × Δt avec φ en watts (0,0040 W) et Δt en secondes. Le résultat est en joules : 1 J = 1 000 mJ.' } },
    { id: 'gravure', titre: 'Une durée pour une énergie voulue', focus: [],
      texte: <>Un laser de gravure a un flux <strong>φ = {nbf(P.Pgrav, 1)} W</strong>. Pour marquer un motif, la pièce doit recevoir une énergie <strong>Q = {nbf(P.Qgrav, 2)} J</strong>. Comme Q = φ × Δt, on a <strong>Δt = Q ÷ φ</strong>.</>,
      tache: { type: 'num', q: 'Durée d’exposition Δt nécessaire, en secondes (s)', unite: 's', vrai: DTGRAV, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        pieges: [[P.Pgrav / P.Qgrav, 'Le rapport est inversé : Δt = Q ÷ φ.'], [P.Qgrav * P.Pgrav, 'Il faut diviser l’énergie par le flux, pas les multiplier.']],
        calcul: () => [`Δt = Q ÷ φ = ${nbf(P.Qgrav, 2)} ÷ ${nbf(P.Pgrav, 1)} = ${nbf(DTGRAV, 2)} s.`],
        expl: `Δt = ${nbf(P.Qgrav, 2)} ÷ ${nbf(P.Pgrav, 1)} = ${nbf(DTGRAV, 2)} s.`, indice: 'Δt = Q ÷ φ, avec Q en joules et φ en watts.' } },
    { id: 'limite', titre: 'Le faisceau est-il dangereux pour l’œil ?', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : l’énergie reçue',
      retenir: <>
        <SvgEnergie/>
        <ul style={puces}>
          <li>L’énergie reçue est <strong>Q = φ × Δt</strong> (J = W × s) ; pour une énergie voulue, <strong>Δt = Q ÷ φ</strong>.</li>
          <li>Exemple : 20 mW pendant 2,0 s donnent 40 mJ ; 1 mW pendant 1 s donne 1 mJ.</li>
          <li>Moyen de s’en souvenir : <strong>« watts × secondes = joules »</strong>.</li>
        </ul></>,
      texte: <>Un curseur de distance et des mesures apparaissent. Pour l’œil, une norme <strong>(valeurs inventées pour la simulation)</strong> limite l’éclairement à <strong>10 W/m²</strong> quand l’exposition dure plus de 0,25 s. Rappel : le faisceau de départ (L = 0 m, D = {nbf(P.d, 1)} mm) a un éclairement E = <strong>{nbf(E1_L, 0)} W/m²</strong>.</>,
      tache: { type: 'qcm', q: 'Comment se situe l’éclairement du faisceau par rapport à la limite de 10 W/m² ?', ...QCM.limite,
        expl: `E ≈ ${nbf(E1_L, 0)} W/m² est environ ${nbf(E1_L / 10, 0)} fois la limite de 10 W/m² : même avec un flux de seulement 4 mW, le faisceau est dangereux pour l’œil.`, indice: 'Divisez l’éclairement du faisceau par la limite : le résultat est-il plus petit ou plus grand que 1 ?' } },
    { id: 'fluxmax', titre: 'Le flux maximal permis', focus: ['mesures'],
      texte: <>Quel flux ce faisceau (S = <strong>{nbf(S1_L, 2)} mm²</strong> = {nbf(S1_L, 2)} × 10⁻⁶ m²) pourrait-il avoir sans dépasser la limite de <strong>10 W/m²</strong> ? Comme E = φ ÷ S, on a <strong>φ max = E max × S</strong>.</>,
      tache: { type: 'num', q: 'Flux maximal permis φ max, en microwatts (µW) (1 µW = 10⁻⁶ W)', unite: 'µW', vrai: PHIMAX, tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        pieges: [[10 * S1_L * 1e-6, 'Cette valeur est en watts : multipliez par 1 000 000 pour des microwatts.'], [10 * S1_L * 1e-3, 'Cette valeur est en milliwatts : 1 mW = 1 000 µW.']],
        calcul: () => [`φ max = E max × S = 10 × ${nbf(S1_L, 2)} × 10⁻⁶ = ${sci(10 * S1_L * 1e-6)} W = ${nbf(PHIMAX, 1)} µW.`],
        expl: `φ max = 10 × ${nbf(S1_L, 2)}·10⁻⁶ ≈ ${nbf(PHIMAX, 1)} µW : environ 100 fois moins que les 4 mW du laser.`, indice: 'φ max = E max × S avec S en m² : 3,14 × 10⁻⁶ m². Le résultat en watts se convertit en µW (× 10⁶).' } },
    { id: 'dureemax', titre: 'La durée maximale d’exposition', focus: ['mesures'],
      texte: <>Pour une exposition de <strong>0,25 s ou moins</strong>, la norme limite l’énergie reçue par mètre carré à <strong>H = 2,5 J/m²</strong>, soit E × Δt ≤ H. La durée maximale est donc <strong>Δt max = H ÷ E</strong>. Rappel : E = <strong>{nbf(E1_L, 0)} W/m²</strong>.</>,
      tache: { type: 'num', q: 'Durée maximale d’exposition Δt max, en millisecondes (ms) (1 s = 1 000 ms)', unite: 'ms', vrai: DTMAX, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        pieges: [[DTMAX / 1000, 'Cette valeur est en secondes : multipliez par 1 000 pour des millisecondes.'], [E1_L / 2.5, 'Le rapport est inversé : Δt max = H ÷ E.']],
        calcul: () => [`Δt max = H ÷ E = 2,5 ÷ ${nbf(E1_L, 0)} = ${nbf(DTMAX / 1000, 5)} s = ${nbf(DTMAX, 2)} ms.`],
        expl: `Δt max = 2,5 ÷ ${nbf(E1_L, 0)} = ${nbf(DTMAX / 1000, 4)} s, soit environ ${nbf(DTMAX, 1)} ms.`, indice: 'Δt max = H ÷ E, avec H = 2,5 J/m² et E = 1 270 W/m², en secondes puis × 1 000 pour des ms.' } },
    { id: 'reflexe', titre: 'Le réflexe palpébral protège-t-il l’œil ?', focus: [],
      retenirTitre: 'À retenir : une norme et une durée maximale',
      retenir: <>
        <SvgNorme/>
        <ul style={puces}>
          <li>Une norme donne <strong>E max</strong> (durée &gt; 0,25 s) et <strong>H max</strong> (durée ≤ 0,25 s) ; on en déduit <strong>Δt max = H ÷ E</strong>.</li>
          <li>Exemple : E = 500 W/m² et H = 2,5 J/m² donnent Δt max = 2,5 ÷ 500 = 5,0 ms. (Valeurs de la norme inventées.)</li>
          <li>Moyen de s’en souvenir : <strong>« plus E est grand, plus la durée permise est courte »</strong>.</li>
        </ul></>,
      texte: <>Quand une lumière vive arrive sur l’œil, la paupière se ferme par réflexe, mais ce <strong>réflexe palpébral</strong> dure environ <strong>0,25 s</strong> (250 ms). Rappel : la durée maximale d’exposition trouvée est Δt max ≈ <strong>{nbf(DTMAX, 1)} ms</strong>.</>,
      tache: { type: 'qcm', q: 'Le réflexe palpébral protège-t-il l’œil contre ce faisceau ?', ...QCM.reflexe,
        expl: `Δt max ≈ ${nbf(DTMAX, 1)} ms est environ 130 fois plus court que 250 ms : l’énergie dangereuse est déjà reçue quand la paupière commence à se fermer.`, indice: 'Comparez Δt max (en ms) à la durée du réflexe (250 ms).' } },
    { id: 'classe', titre: 'La classe du laser', focus: [],
      texte: <>La classe d’un laser visible est liée à son flux : <strong>classe 2</strong> : jusqu’à 1 mW ; <strong>classe 3R</strong> : de 1 à 5 mW ; <strong>classe 3B</strong> : de 5 à 500 mW ; <strong>classe 4</strong> : plus de 500 mW. (Classes simplifiées.) Notre laser a un flux de <strong>4,0 mW</strong>.</>,
      tache: { type: 'qcm', q: 'À quelle classe appartient ce laser ?', ...QCM.classe,
        expl: 'Le flux de 4,0 mW est compris entre 1 mW et 5 mW : classe 3R. Au-dessus de 1 mW, le réflexe palpébral ne suffit plus à protéger l’œil.', indice: 'Placez 4,0 mW dans l’échelle : au-dessus de quelle limite et en dessous de laquelle ?' } },
    { id: 'consigne', titre: 'Les consignes de sécurité', focus: [],
      texte: <>Un laser de classe 3R ou plus peut abîmer l’œil, et pas seulement par le faisceau direct : un <strong>reflet</strong> sur une surface brillante (montre, verre, métal) reste dangereux.</>,
      tache: { type: 'qcm', q: 'Quelle consigne de sécurité est correcte ?', ...QCM.consigne,
        expl: 'Il ne faut jamais regarder le faisceau, ni directement ni par réflexion ; on écarte les objets brillants (bijoux, montre, verre) de son trajet, et on porte des lunettes adaptées au laser si nécessaire.', indice: 'Pensez au trajet de la lumière : un reflet sur une surface brillante envoie-t-il aussi le faisceau vers les yeux ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : classes et consignes',
      retenir: <>
        <SvgClasses/>
        <ul style={puces}>
          <li>La classe d’un laser visible dépend de son flux : <strong>2 (≤ 1 mW), 3R (jusqu’à 5 mW), 3B (jusqu’à 500 mW), 4 (au-delà)</strong> ; plus la classe est élevée, plus le risque est grand.</li>
          <li>Exemple : 4,0 mW donne la classe 3R ; avec la norme de la simulation, la durée maximale d’exposition de l’œil est de l’ordre de 2 ms.</li>
          <li>Moyen de s’en souvenir : <strong>« ne jamais regarder le faisceau, ni son reflet »</strong>.</li>
        </ul></>,
      texte: <>Vous savez que le faisceau laser concentre son flux sur une petite section (E = φ ÷ S), qu’il s’élargit très peu avec la distance, que l’énergie reçue est Q = φ × Δt, comment une norme donne la durée maximale d’exposition de l’œil, et les consignes de sécurité. Explorez avec d’autres lasers, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- état affiché selon le mode ----------
  const phi = enExplore ? ti.mw / 1000 : P.phi;
  const d0 = enExplore ? ti.D : P.d;
  const theta = enExplore ? ti.th : P.theta;
  const Lscene = enExplore ? ti.L : curseurL ? gL : idEtape === 'distance' ? P.L : 2;
  const D = M.diametre(d0, theta, Lscene), S = M.sectionMm2(D), E = M.eclairement(phi, D);
  const rapport = E / M.E_MAX, tmax = M.dureeMax(E);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'secu' ? { ...M.tirageDefiA(), reps: { E: '', T: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { Q: '', E: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'secu') {
      const e = lireNombre(defi.reps.E), t = lireNombre(defi.reps.T);
      const okE = isFinite(e) && proche(e, defi.E, 0.05), okT = isFinite(t) && proche(t, defi.tMs, 0.08);
      setDefi(x => ({ ...x, verifie: true, ok: okE && okT, okE, okT })); noterA(okE && okT);
    } else {
      const q = lireNombre(defi.reps.Q), e = lireNombre(defi.reps.E);
      const okQ = isFinite(q) && proche(q, defi.Q, 0.05), okE = isFinite(e) && proche(e, defi.Emm, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok: okQ && okE, okQ, okE })); noterB(okQ && okE);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('las-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  // messages d'aide ciblés (la valeur du défi n'est jamais donnée avant la correction)
  const diagnosticA = () => {
    const x = defi, msgs = [], e = lireNombre(x.reps.E), t = lireNombre(x.reps.T), Smm = Math.PI * x.D * x.D / 4;
    if (!isFinite(e)) msgs.push('E : écrivez un nombre (virgule ou point).');
    else if (!x.okE) {
      if (proche(e, x.phiMw / Smm, 0.08)) msgs.push('E : le flux est resté en mW et la section en mm². Convertissez : 1 mW = 0,001 W et 1 mm² = 10⁻⁶ m².');
      else if (proche(e, x.phiMw / 1000 / Smm, 0.08)) msgs.push('E : la section est restée en mm². Convertissez-la en m² (1 mm² = 10⁻⁶ m²).');
      else if (proche(e, x.E / 4, 0.08) || proche(e, 4 * x.E, 0.08)) msgs.push('E : vérifiez la section d’un disque : S = π D² ÷ 4 (D est un diamètre, pas un rayon).');
      else msgs.push(`E : E = φ ÷ S avec φ = ${nbf(x.phiMw / 1000, 4)} W et S = π × ${fmtV(x.D)}² ÷ 4 = ${fmt2(Smm)} mm² (soit ${fmt2(Smm)} × 10⁻⁶ m²). Votre valeur est ${e > x.E ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(t)) msgs.push('Durée maximale : écrivez un nombre (virgule ou point).');
    else if (!x.okT) {
      if (isFinite(e) && !x.okE && proche(t, 2500 / e, 0.08)) msgs.push('Durée maximale : votre calcul est cohérent avec votre éclairement, mais celui-ci n’est pas le bon. Reprenez E = φ ÷ S.');
      else if (proche(t, x.tMs / 1000, 0.08)) msgs.push('Durée maximale : cette valeur est en secondes. Pour des millisecondes, multipliez par 1 000.');
      else if (proche(t, 250, 0.08)) msgs.push('Durée maximale : 250 ms est la durée du réflexe palpébral, pas la durée maximale. Calculez Δt max = H ÷ E avec H = 2,5 J/m².');
      else if (proche(t, x.E / 2.5, 0.08)) msgs.push('Durée maximale : le rapport est inversé : Δt max = H ÷ E, avec H = 2,5 J/m².');
      else msgs.push(`Durée maximale : Δt max = H ÷ E = 2,5 ÷ E, en secondes, puis × 1 000 pour des ms. Votre valeur est ${t > x.tMs ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, msgs = [], q = lireNombre(x.reps.Q), e = lireNombre(x.reps.E);
    if (!isFinite(q)) msgs.push('Énergie : écrivez un nombre (virgule ou point).');
    else if (!x.okQ) {
      if (proche(q, x.phi * x.tMs, 0.05)) msgs.push('Énergie : la durée est restée en millisecondes. Pour des joules, convertissez-la en secondes (1 ms = 0,001 s).');
      else if (proche(q, x.phi / (x.tMs / 1000), 0.05)) msgs.push('Énergie : il faut multiplier le flux par la durée, pas les diviser (Q = φ × Δt).');
      else msgs.push(`Énergie : Q = φ × Δt = ${x.phi} × ${nbf(x.tMs / 1000, 3)} (durée en s). Votre valeur est ${q > x.Q ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(e)) msgs.push('Éclairement : écrivez un nombre (virgule ou point).');
    else if (!x.okE) {
      if (proche(e, 4 * x.Emm, 0.05) || proche(e, x.Emm / 4, 0.05)) msgs.push('Éclairement : vérifiez la section d’un disque : S = π D² ÷ 4 (D est un diamètre).');
      else if (proche(e, x.Emm * 1e6, 0.05)) msgs.push('Éclairement : il est demandé en W/mm², pas en W/m². Gardez la section en mm².');
      else if (proche(e, x.phi * Math.PI * x.D * x.D / 4, 0.05)) msgs.push('Éclairement : il faut diviser le flux par la section, pas les multiplier.');
      else msgs.push(`Éclairement : E = φ ÷ S avec S = π D² ÷ 4 = ${fmt2(Math.PI * x.D * x.D / 4)} mm² (D = ${x.D} mm). Votre valeur est ${e > x.Emm ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'secu'
    ? `Section : S = π D² ÷ 4 = π × ${fmtV(defi.D)}² ÷ 4 = ${fmt2(Math.PI * defi.D * defi.D / 4)} mm² = ${fmt2(Math.PI * defi.D * defi.D / 4)} × 10⁻⁶ m². Éclairement : E = φ ÷ S = ${nbf(defi.phiMw / 1000, 4)} ÷ (${fmt2(Math.PI * defi.D * defi.D / 4)} × 10⁻⁶) ≈ ${fmt2(defi.E)} W/m². Durée maximale : Δt max = H ÷ E = 2,5 ÷ ${fmt2(defi.E)} ≈ ${fmt2(defi.tMs / 1000)} s, soit environ ${fmt2(defi.tMs)} ms. Un écart vient souvent d’une section laissée en mm² ou du flux laissé en mW.`
    : `Énergie : Q = φ × Δt = ${defi.phi} × ${nbf(defi.tMs / 1000, 3)} = ${fmt2(defi.Q)} J (durée convertie en secondes). Éclairement : S = π D² ÷ 4 = π × ${defi.D}² ÷ 4 = ${fmt2(Math.PI * defi.D * defi.D / 4)} mm² ; E = φ ÷ S = ${defi.phi} ÷ ${fmt2(Math.PI * defi.D * defi.D / 4)} ≈ ${fmt2(defi.Emm)} W/mm².`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['secu', 'Sécurité d’un faisceau'], ['decoupe', 'Laser de découpe']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'secu' ? 'Défi : sécurité d’un faisceau laser' : 'Défi : laser de découpe'}</div>
      {defi.type === 'secu' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un laser visible émet un faisceau de section circulaire de diamètre <strong>D = {fmtV(defi.D)} mm</strong>, avec un flux <strong>φ = {defi.phiMw} mW</strong>. Calculez l’<strong>éclairement E</strong> du faisceau (en W/m²), puis la <strong>durée maximale d’exposition</strong> de l’œil (en ms) avec la norme de la simulation : pour une durée de 0,25 s ou moins, E × Δt ≤ H avec H = 2,5 J/m². Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>E (W/m²) =</span>{champ('E', 'Éclairement du faisceau en watts par mètre carré', defi.verifie && defi.okE)}
          <span>Δt max (ms) =</span>{champ('T', 'Durée maximale d’exposition en millisecondes', defi.verifie && defi.okT)}
        </div>
        <IndiceDefi cache={false}>S = π D² ÷ 4 (D en mm, S en mm² ; 1 mm² = 10⁻⁶ m²). E = φ ÷ S avec φ en watts (1 mW = 0,001 W) et S en m². Puis Δt max = H ÷ E en secondes (H = 2,5 J/m²) ; × 1 000 pour des ms.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un laser de découpe de flux <strong>φ = {defi.phi} W</strong> est concentré sur une tache circulaire de diamètre <strong>D = {defi.D} mm</strong> pendant <strong>Δt = {defi.tMs} ms</strong>. Calculez l’<strong>énergie Q</strong> reçue par la pièce (en J) et l’<strong>éclairement E</strong> sur la tache (en W/mm²). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Q (J) =</span>{champ('Q', 'Énergie reçue en joules', defi.verifie && defi.okQ)}
          <span>E (W/mm²) =</span>{champ('E', 'Éclairement en watts par millimètre carré', defi.verifie && defi.okE)}
        </div>
        <IndiceDefi cache={false}>Q = φ × Δt avec Δt en secondes (1 ms = 0,001 s). S = π D² ÷ 4 (D en mm, S en mm²) puis E = φ ÷ S, ici en W/mm².</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="las-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'secu' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Faisceau uniforme</strong> : l’éclairement est le même sur toute la section circulaire (un vrai faisceau est plus intense au centre).</li>
      <li><strong>Divergence constante</strong> : le diamètre augmente de θ × L (θ en mrad, L en m, résultat en mm) ; pas d’absorption par l’air.</li>
      <li><strong>Norme inventée pour la simulation</strong> : éclairement maximal de 10 W/m² pour une exposition de plus de 0,25 s, et exposition énergétique maximale de 2,5 J/m² pour 0,25 s ou moins (10 × 0,25 = 2,5). Les vraies normes dépendent de la longueur d’onde et de la durée : il faut consulter la norme en vigueur.</li>
      <li><strong>Classes simplifiées</strong> pour un faisceau visible : 2 (jusqu’à 1 mW), 3R (jusqu’à 5 mW), 3B (jusqu’à 500 mW), 4 (au-delà). Le flux est la puissance lumineuse émise, pas la puissance électrique consommée.</li>
      <li><strong>Œil exposé directement</strong>, sans lunettes de protection ; le flux est entièrement reçu par la pupille (cas le plus défavorable).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, mesures ----------
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Un laser et un mur</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le faisceau est dessiné plus large que dans la réalité : le schéma n’est pas à l’échelle.</div>}
      <SceneLaser d0={d0} theta={theta} L={Lscene}/>
      {enGuide && curseurL && <div style={{ marginTop: 8 }}>
        <Curseur nom="Distance L" valeur={gL} onChange={setGL} min={0} max={20} pas={0.5} unite="m" decimales={1} couleur="#b91c1c"/>
      </div>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="las-phi" label="Flux du laser φ" valeur={ti.mw} onChange={v => setTi(s => ({ ...s, mw: v }))} options={M.FLUX_LISTE_MW.map(v => [v, `${v} mW`])}/>
      <Sel id="las-d" label="Diamètre du faisceau au départ" valeur={ti.D} onChange={v => setTi(s => ({ ...s, D: v }))} options={M.D_LISTE_MM.map(v => [v, `${v} mm`])}/>
      <Curseur nom="Distance L" valeur={ti.L} onChange={v => setTi(s => ({ ...s, L: v }))} min={0} max={20} pas={0.5} unite="m" decimales={1} couleur="#b91c1c"/>
      <Sel id="las-th" label="Divergence θ du faisceau" valeur={ti.th} onChange={v => setTi(s => ({ ...s, th: v }))} options={M.THETA_LISTE.map(v => [v, `${nbf(v, 1)} mrad`])}/>
      <Sel id="las-t" label="Durée d’exposition de l’œil" valeur={ti.ms} onChange={v => setTi(s => ({ ...s, ms: v }))} options={M.DUREES_MS.map(v => [v, v >= 1000 ? `${v / 1000} s` : `${v} ms`])}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Diminuez le diamètre ou augmentez le flux : l’éclairement et le danger augmentent.</div>
    </div>);
  const exposeOK = enExplore ? (ti.ms > 250 ? E <= M.E_MAX : E * ti.ms / 1000 <= M.H_MAX) : true;
  const mesures = (enExplore || (enGuide && deja('limite'))) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs pour la distance choisie, puis comparaison à la norme de la simulation.</div>}
      <LigneMesure nom="Flux φ" valeur={`${nbf(phi * 1000, phi * 1000 % 1 ? 1 : 0)}${NB}mW`} couleur={COL.orange}/>
      <LigneMesure nom="Distance L" valeur={`${nbf(Lscene, 1)}${NB}m`}/>
      <LigneMesure nom="Diamètre D du faisceau" valeur={`${nbf(D, 2)}${NB}mm`}/>
      <LigneMesure nom="Section S = π D² ÷ 4" valeur={`${nbf(S, 2)}${NB}mm²`}/>
      <LigneMesure nom="Éclairement E = φ ÷ S" valeur={`${gdE(E)}${NB}W/m²`} couleur={COL.bleu}/>
      {(enExplore || deja('fluxmax')) && <LigneMesure nom="E ÷ limite (10 W/m²)" valeur={`${gdE(rapport)}${NB}fois`} couleur={rapport > 1 ? COL.rouge : COL.vert}/>}
      {(enExplore || deja('reflexe')) && <LigneMesure nom="Flux maximal permis" valeur={`${nbf(M.fluxMax(D) * 1e6, 1)}${NB}µW`} couleur={COL.gris}/>}
      {(enExplore || deja('classe')) && <LigneMesure nom="Durée maximale (≤ 0,25 s)" valeur={isFinite(tmax) ? `${nbf(tmax * 1000, tmax * 1000 < 10 ? 2 : 0)}${NB}ms` : 'pas de limite'} couleur={COL.gris}/>}
      {(enExplore || deja('consigne')) && <LigneMesure nom="Classe du laser" valeur={`${M.classe(phi)}`} couleur={COL.vert}/>}
      {enExplore && <LigneMesure nom={`Énergie reçue en ${ti.ms >= 1000 ? ti.ms / 1000 + ' s' : ti.ms + ' ms'}`} valeur={`${nbf(phi * ti.ms, 2)}${NB}mJ`}/>}
      {enExplore && <LigneMesure nom="Exposition de l’œil" valeur={exposeOK ? 'sous la limite' : 'au-dessus de la limite'} couleur={exposeOK ? COL.vert : COL.rouge}/>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Passez le diamètre de 2 mm à 1 mm à flux constant : par combien l’éclairement est-il multiplié ?</li>
      <li>Comparez 1 mW, 4 mW et 50 mW : dans quels cas l’exposition de l’œil reste-t-elle sous la limite ?</li>
      <li>Augmentez la distance avec une divergence de 1 mrad : que devient le diamètre à 20 m ? Et l’éclairement ?</li>
      <li>Avec le laser de 500 mW, quelle est la durée maximale d’exposition de l’œil ? Comparez-la à la durée du réflexe palpébral (250 ms).</li>
      <li>Pour 50 mW pendant 1 s, quelle énergie est reçue ? Vérifiez avec Q = φ × Δt.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Un laser : faisceau monochromatique, directif, à éclairement élevé</li>
        <li>Section : S = π D² ÷ 4 ; éclairement : E = φ ÷ S (φ en W, S en m²)</li>
        <li>Énergie reçue : Q = φ × Δt ; durée pour une énergie voulue : Δt = Q ÷ φ</li>
        <li>Norme : E ≤ E max (longue durée) ou E × Δt ≤ H (0,25 s ou moins) : Δt max = H ÷ E</li>
        <li>Ne jamais regarder le faisceau ni son reflet ; classes 2, 3R, 3B et 4 selon le flux</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .las-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .las-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .las-col { display: flex; flex-direction: column; gap: 12px; }
        .las-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .las-l1.cote .las-carte { order: 2; } .las-l1.cote .las-main { order: 1; }
          .las-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .las-ex > * { grid-column: 1; }
          .las-ex > .las-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .las-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .las-in { animation: las-fondu 0.35s ease-out; } @keyframes las-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Laser : énergie reçue et sécurité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un faisceau laser concentre sa puissance sur une <strong>très petite surface</strong> : son <strong>éclairement</strong> est énorme. On calcule l’<strong>énergie reçue</strong>, on exploite une <strong>norme</strong> pour la durée maximale d’exposition et on retient les <strong>consignes de sécurité</strong>.</div>
      {!enExplore && <div className={`las-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="las-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="las-carte">{panneauHypo}</div>}
        <div className="las-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'secu' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="las-col">
            <div className="las-in">{scene}</div>
            {mesures && <div className="las-in">{mesures}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="las-ex">
          {scene}
          <div className="las-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
