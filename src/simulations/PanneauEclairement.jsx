import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./panneauEclairementModele";
import { PanneauEclairementExplore } from "./PanneauEclairementExplore";
import { QCM } from "./panneauEclairementQcm";
import { SceneEclairement, GrapheE, SvgSphere, SvgEclair, SvgLoi, SvgChaine, SvgDistance, SvgLimite } from "./PanneauEclairementSchemas";

const SIM_ID = 229, CLE_GUIDE = 'panneau-eclairement-guide-v1';
declarerDefis(SIM_ID, [['source', 'Source de lumière inconnue'], ['placer', 'Placer un panneau à la bonne distance']]);

// ====================================================
//  SIM 229 — ÉCLAIREMENT ET DISTANCE À LA SOURCE (TSTL, enseignement PCM, partie « Énergie et ondes »).
//  Une seule idée : une source ponctuelle répartit son flux sur une sphère de surface 4πd² ; E = Φ ÷ (4πd²) varie comme 1/d² ; Plum = E × S ; part du flux reçue ; distance pour un éclairement voulu.
//  Aucune situation des documents du Moodle : source de 300 W, panneau de laboratoire de 37,5 cm², valeurs inventées.
//  Capacités visées (jamais affichées à l'élève) : relation entre flux énergétique et éclairement (E = Φ ÷ S) ; bilan énergétique d'un panneau photovoltaïque ; effectuer des calculs de puissance et de rendement.
//  Modèle : panneauEclairementModele.js (test node). QCM : panneauEclairementQcm.js. Schémas : PanneauEclairementSchemas.jsx.
//  Notation : la surface de la sphère n'a pas de lettre (écrite 4πd²), S désigne uniquement la surface du panneau.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtV = v => String(Number(Number(v).toPrecision(3))).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const lu3 = x => Number(Number(x).toPrecision(3));
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const P = M.PARCOURS, ETA = P.eta, S_PAN = P.Scm2 / 1e4;

// ---------- valeurs de référence du parcours ----------
const SPH1 = M.surfaceSphere(P.d1), E1 = M.eclairement(P.phi, P.d1), E2 = M.eclairement(P.phi, P.d2), E3 = M.eclairement(P.phi, P.d3);
const SPH2 = M.surfaceSphere(P.d2);
const EPAN = M.eclairement(P.phi, P.dPan), EPAN_L = lu3(EPAN);
const PLUM = M.plumRecue(P.phi, P.dPan, S_PAN), PLUM_L = lu3(PLUM);
const PEL = ETA * PLUM_L, PART = 100 * PLUM / P.phi;
const D_VOUL = M.distancePour(P.phi, P.Ecible) * 100;                       // cm

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const Psub = ({ s }) => <>P<sub>{s}</sub></>;
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };

// ====================================================
export function SimulationPanneauEclairement() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('source');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ phi: 300, d: 0.5, S: 37.5 });
  const [gd, setGd] = useState(P.d1);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['source', 'sphere', 'eclair', 'e2', 'tiers', 'double', 'loi', 'plum', 'pel', 'part', 'distance', 'limite', 'bilan'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const curseurD = enExplore || (enGuide && deja('double'));
  // distance affichée dans la scène du parcours : fixée par l'étape tant que le curseur n'est pas introduit
  const dEtape = IDS[Math.min(etape, IDS.length - 1)] === 'e2' ? P.d2 : IDS[Math.min(etape, IDS.length - 1)] === 'tiers' ? P.d3 : P.d1;

  const ETAPES = [
    { id: 'source', titre: 'Une source qui éclaire dans tous les sens', focus: ['scene'],
      texte: <>Une petite lampe émet de la lumière <strong>dans toutes les directions</strong>. La puissance lumineuse qu’elle émet s’appelle son <strong>flux</strong>, noté <strong>Φ</strong> (lettre grecque « phi »), en watts (W). Ici <strong>Φ = {P.phi} W</strong>. Un panneau est placé à la <strong>distance d = {nbf(P.d1, 2)} m</strong> de la lampe.</>,
      tache: { type: 'qcm', q: `Quelle puissance lumineuse le panneau reçoit-il, sachant que la lampe émet Φ = ${P.phi} W ?`, ...QCM.flux,
        expl: 'La lumière part dans toutes les directions : le panneau n’en reçoit qu’une petite part, la plus grande partie passe à côté. Il reçoit donc bien moins que les 300 W émis.', indice: 'Imaginez une ampoule au centre d’une pièce : toute sa lumière arrive-t-elle sur une petite feuille de papier ?' } },
    { id: 'sphere', titre: 'La lumière se répartit sur une sphère', focus: ['scene'],
      texte: <>À la distance d, la lumière émise est répartie sur une <strong>sphère</strong> de rayon d, centrée sur la lampe (le cercle en pointillés). La surface d’une sphère vaut <strong>4π d²</strong>, avec d en mètres (m) et un résultat en m².</>,
      tache: { type: 'num', q: `Surface de la sphère de rayon d = ${nbf(P.d1, 2)} m, en m²`, unite: 'm²', vrai: SPH1, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        pieges: [[2 * Math.PI * P.d1 ** 2, 'Il faut multiplier par 4π, pas par 2π.'], [4 * Math.PI * P.d1, 'La distance est au carré : 4π × d × d.'], [Math.PI * P.d1 ** 2, 'N’oubliez pas le facteur 4 : 4π d².']],
        calcul: () => [`surface = 4π d² = 4 × π × ${nbf(P.d1, 2)}² = ${nbf(SPH1, 3)} m².`],
        expl: `4π × ${nbf(P.d1, 2)}² = ${nbf(SPH1, 3)} m², soit environ ${nbf(SPH1, 2)} m².`, indice: 'surface = 4 × π × d × d, avec d = 0,50 m. Calculez d² d’abord.' } },
    { id: 'eclair', titre: 'L’éclairement', focus: ['scene'],
      retenirTitre: 'À retenir : la lumière sur une sphère',
      retenir: <>
        <SvgSphere/>
        <ul style={puces}>
          <li>À la distance d, le flux de la source est réparti sur une sphère de surface <strong>4π d²</strong> (d en m, résultat en m²).</li>
          <li>Exemple : à d = 1,0 m, la surface vaut 4π × 1,0² ≈ 12,6 m².</li>
          <li>Moyen de s’en souvenir : <strong>« plus on s’éloigne, plus la sphère est grande »</strong>.</li>
        </ul></>,
      texte: <>La puissance lumineuse reçue <strong>par mètre carré</strong> s’appelle l’<strong>éclairement</strong>, noté <strong>E</strong>, en W/m². Ici toute la puissance émise Φ = {P.phi} W est répartie sur la sphère de {nbf(SPH1, 2)} m² : <strong>E = Φ ÷ (surface de la sphère)</strong>.</>,
      tache: { type: 'num', q: `Éclairement E à d = ${nbf(P.d1, 2)} m, en W/m²`, unite: 'W/m²', vrai: E1, tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        pieges: [[P.phi * SPH1, 'Il faut diviser le flux par la surface, pas les multiplier.'], [SPH1 / P.phi, 'Le rapport est inversé : E = Φ ÷ surface.']],
        calcul: () => [`E = Φ ÷ (4π d²) = ${P.phi} ÷ ${nbf(SPH1, 2)} = ${nbf(E1, 1)} W/m².`],
        expl: `E = ${P.phi} ÷ ${nbf(SPH1, 2)} = ${nbf(E1, 1)} W/m².`, indice: 'E = Φ ÷ surface de la sphère : divisez 300 W par la surface trouvée à l’étape précédente.' } },
    { id: 'e2', titre: 'À deux fois plus loin', focus: ['scene'],
      retenirTitre: 'À retenir : la formule de l’éclairement',
      retenir: <>
        <SvgEclair/>
        <ul style={puces}>
          <li><strong>E = Φ ÷ (4π d²)</strong> : le flux divisé par la surface de la sphère.</li>
          <li>Exemple : Φ = 100 W à d = 2,0 m donne 100 ÷ 50,3 ≈ 2,0 W/m².</li>
          <li>Moyen de s’en souvenir : <strong>« le flux se partage sur toute la sphère »</strong>.</li>
        </ul></>,
      texte: <>On éloigne le panneau à <strong>d = {nbf(P.d2, 1)} m</strong>, soit 2 fois plus loin. Le flux de la lampe est toujours Φ = {P.phi} W. Rappel : à 0,50 m, l’éclairement valait E = <strong>{nbf(lu3(E1), 1)} W/m²</strong>.</>,
      tache: { type: 'num', q: `Éclairement E à d = ${nbf(P.d2, 1)} m, en W/m²`, unite: 'W/m²', vrai: E2, tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        pieges: [[E1 / 2, 'L’éclairement ne varie pas comme 1/d : calculez la nouvelle surface de la sphère 4π d² avec d = 1,0 m.'], [E1 * 2, 'Plus loin de la source, l’éclairement diminue.']],
        calcul: () => [`surface = 4π × ${nbf(P.d2, 1)}² = ${nbf(SPH2, 2)} m²`, `E = ${P.phi} ÷ ${nbf(SPH2, 2)} = ${nbf(E2, 1)} W/m².`],
        expl: `La sphère mesure ${nbf(SPH2, 2)} m² : E = ${P.phi} ÷ ${nbf(SPH2, 2)} = ${nbf(E2, 1)} W/m².`, indice: 'Même méthode : surface = 4π d² avec d = 1,0 m, puis E = Φ ÷ surface.' } },
    { id: 'tiers', titre: 'Deux fois plus près', focus: ['scene'],
      texte: <>On rapproche maintenant le panneau à <strong>d = {nbf(P.d3, 2)} m</strong>, soit 2 fois plus près qu’à 0,50 m. Rappel : à 0,50 m, E = <strong>{nbf(lu3(E1), 1)} W/m²</strong>.</>,
      tache: { type: 'num', q: `Éclairement E à d = ${nbf(P.d3, 2)} m, en W/m²`, unite: 'W/m²', vrai: E3, tol: 0.05, affiche: v => nbf(v, 0), cs: 3,
        pieges: [[E1 * 2, 'Calculez la nouvelle surface de la sphère 4π d² avec d = 0,25 m : elle est plus petite que la précédente.'], [E1 / 4, 'Plus près de la source, l’éclairement augmente.']],
        calcul: () => [`surface = 4π × ${nbf(P.d3, 2)}² = ${nbf(M.surfaceSphere(P.d3), 3)} m²`, `E = ${P.phi} ÷ ${nbf(M.surfaceSphere(P.d3), 3)} = ${nbf(E3, 0)} W/m².`],
        expl: `surface = 4π × ${nbf(P.d3, 2)}² = ${nbf(M.surfaceSphere(P.d3), 3)} m² ; E = ${P.phi} ÷ ${nbf(M.surfaceSphere(P.d3), 3)} = ${nbf(E3, 0)} W/m².`, indice: 'Surface = 4π × 0,25 × 0,25, puis E = Φ ÷ surface.' } },
    { id: 'double', titre: 'Que devient E quand d double ?', focus: ['scene', 'graphe', 'mesures'],
      texte: <>Un curseur de distance apparaît, avec le graphique de E selon d. Vos résultats : E = <strong>{nbf(lu3(E1), 1)} W/m²</strong> à 0,50 m et <strong>{nbf(lu3(E2), 1)} W/m²</strong> à 1,0 m, soit 2 fois plus loin. Essayez d’autres distances avec le curseur.</>,
      tache: { type: 'qcm', q: 'Quand la distance d est multipliée par 2, que devient l’éclairement E ?', ...QCM.double,
        expl: `E passe de ${nbf(lu3(E1), 1)} à ${nbf(lu3(E2), 1)} W/m² : il est divisé par 4, car la surface de la sphère 4π d² est multipliée par 2² = 4.`, indice: 'Calculez le rapport entre les deux éclairements, puis comparez-le aux rapports 2 et 4.' } },
    { id: 'loi', titre: 'La loi de l’éclairement', focus: ['graphe'],
      texte: <>D’après vos calculs : à 0,50 m, E = <strong>{nbf(lu3(E1), 1)} W/m²</strong> ; à 1,0 m (2 fois plus loin), E ÷ 4 ; à 0,25 m (2 fois plus près), E = <strong>{nbf(E3, 0)} W/m²</strong>, soit 4 fois plus. La courbe du graphique descend vite puis s’aplatit.</>,
      tache: { type: 'qcm', q: 'Comment l’éclairement E dépend-il de la distance d à la source ?', ...QCM.loi,
        expl: 'E = Φ ÷ (4π d²) : E est proportionnel à 1/d², l’inverse du carré de la distance. Distance × 2 : E ÷ 4 ; distance ÷ 2 : E × 4.', indice: 'Dans E = Φ ÷ (4π d²), la distance est élevée au carré. Où se trouve d dans la formule : au numérateur ou au dénominateur ?' } },
    { id: 'plum', titre: 'La puissance reçue par un panneau', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : 1/d²',
      retenir: <>
        <SvgLoi/>
        <ul style={puces}>
          <li><strong>Distance × 2 : surface × 4, donc E ÷ 4</strong> ; distance ÷ 2 : E × 4. On dit que E varie comme 1/d².</li>
          <li>Exemple avec Φ = 100 W : 8,0 W/m² à 1 m, 2,0 à 2 m, 0,88 à 3 m.</li>
          <li>Moyen de s’en souvenir : <strong>« deux fois plus loin, quatre fois moins de lumière »</strong>.</li>
        </ul></>,
      texte: <>Le panneau a une surface <strong>S = {nbf(P.Scm2, 1)} cm²</strong> = {nbf(S_PAN, 5)} m² (1 cm² = 0,0001 m²). Réglez le curseur sur <strong>d = {nbf(P.dPan, 2)} m</strong> et lisez l’éclairement E dans les mesures. La puissance lumineuse reçue par le panneau est <strong><Psub s="lum"/> = E × S</strong>.</>,
      tache: { type: 'num', q: `Puissance lumineuse Plum reçue par le panneau à d = ${nbf(P.dPan, 2)} m, en watts (W)`, unite: 'W', vrai: PLUM, tol: 0.05, affiche: v => nbf(v, 3), cs: 3,
        bloque: Math.abs(gd - P.dPan) < 1e-9 ? null : `Réglez d sur ${nbf(P.dPan, 2)} m avec le curseur, puis lisez E dans les mesures.`,
        pieges: [[EPAN * P.Scm2, 'La surface est restée en cm² : convertissez-la en m² (1 cm² = 0,0001 m²) avant de multiplier.'], [EPAN / S_PAN, 'Il faut multiplier l’éclairement par la surface, pas les diviser.']],
        calcul: () => [`E = ${P.phi} ÷ (4π × ${nbf(P.dPan, 2)}²) = ${nbf(EPAN, 1)} W/m²`, `Plum = E × S = ${nbf(EPAN, 1)} × ${nbf(S_PAN, 5)} = ${nbf(PLUM, 3)} W.`],
        expl: `À 0,40 m, E = ${nbf(EPAN, 1)} W/m² ; Plum = ${nbf(EPAN, 1)} × ${nbf(S_PAN, 5)} = ${nbf(PLUM, 3)} W.`, indice: 'Plum = E × S, avec S en m² : 37,5 cm² = 0,00375 m².' } },
    { id: 'pel', titre: 'L’électricité fournie', focus: ['mesures'],
      texte: <>Le panneau convertit en électricité une part de la lumière reçue, son <strong>rendement</strong> <strong>η</strong> : ici <strong>η = 15 %</strong>, soit 0,15. La puissance électrique fournie est <strong><Psub s="él"/> = η × <Psub s="lum"/></strong>. Rappel : <Psub s="lum"/> = <strong>{nbf(PLUM_L, 3)} W</strong>.</>,
      tache: { type: 'num', q: 'Puissance électrique Pél fournie par le panneau, en watts (W)', unite: 'W', vrai: PEL, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        pieges: [[PLUM_L / ETA, 'Il faut multiplier la lumière reçue par le rendement, pas la diviser.'], [PLUM_L * 15, 'Le rendement doit être écrit en nombre décimal : 15 % = 0,15.']],
        calcul: () => [`Pél = η × Plum = ${nbf(ETA, 2)} × ${nbf(PLUM_L, 3)} = ${nbf(PEL, 4)} W.`],
        expl: `Pél = 0,15 × ${nbf(PLUM_L, 3)} = ${nbf(PEL, 3)} W, soit environ ${nbf(1000 * PEL, 0)} mW.`, indice: 'Pél = η × Plum, avec η = 15 % = 0,15.' } },
    { id: 'part', titre: 'Quelle part de la lumière émise est reçue ?', focus: ['mesures'],
      retenirTitre: 'À retenir : de la lampe à l’électricité',
      retenir: <>
        <SvgChaine/>
        <ul style={puces}>
          <li>Quatre étapes : <strong>flux Φ, éclairement E = Φ ÷ (4π d²), puissance reçue Plum = E × S, électricité Pél = η × Plum</strong>.</li>
          <li>Exemple : 100 W émis, 25 cm² à 0,50 m, η = 12 % : 0,080 W reçus et environ 9,5 mW d’électricité.</li>
          <li>Moyen de s’en souvenir : <strong>« on divise par la sphère, on multiplie par le panneau, on multiplie par le rendement »</strong>.</li>
        </ul></>,
      texte: <>La lampe émet Φ = <strong>{P.phi} W</strong> et le panneau reçoit <Psub s="lum"/> = <strong>{nbf(PLUM_L, 3)} W</strong>. La <strong>part du flux émis</strong> qui atteint le panneau est <strong><Psub s="lum"/> ÷ Φ</strong>.</>,
      tache: { type: 'num', q: 'Part du flux émis reçue par le panneau, en pourcentage (%), avec 2 chiffres significatifs', unite: '%', vrai: PART, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        pieges: [[PART / 100, 'Ce rapport est une fraction : multipliez-le par 100 pour avoir un pourcentage.'], [100 * P.phi / PLUM_L, 'Le rapport est inversé : part = Plum ÷ Φ.']],
        calcul: () => [`Plum ÷ Φ = ${nbf(PLUM_L, 3)} ÷ ${P.phi} = ${nbf(PLUM_L / P.phi, 5)}`, `soit ${nbf(PART, 2)} %.`],
        expl: `${nbf(PLUM_L, 3)} ÷ ${P.phi} = ${nbf(PLUM_L / P.phi, 5)}, soit ${nbf(PART, 2)} % : moins de 0,2 % de la lumière émise arrive sur ce petit panneau.`, indice: 'Divisez Plum par Φ, puis multipliez par 100.' } },
    { id: 'distance', titre: 'Trouver la bonne distance', focus: [],
      texte: <>On veut que le panneau reçoive un éclairement <strong>E = {P.Ecible} W/m²</strong> avec la même lampe (Φ = {P.phi} W). Comme E = Φ ÷ (4π d²), on obtient <strong>d = √( Φ ÷ (4π E) )</strong>, en mètres : on calcule Φ ÷ (4π E), puis on prend la racine carrée.</>,
      tache: { type: 'num', q: 'Distance d à laquelle placer le panneau, en centimètres (cm), avec 2 chiffres significatifs', unite: 'cm', vrai: D_VOUL, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[D_VOUL / 100, 'Cette valeur est en mètres : multipliez par 100 pour des centimètres.'], [100 * Math.sqrt(P.phi / P.Ecible), 'Il manque le facteur 4π : 4π d² = Φ ÷ E.'], [100 * P.phi / (4 * Math.PI * P.Ecible), 'Vous avez donné d² : prenez la racine carrée pour obtenir d.']],
        calcul: () => [`4π d² = Φ ÷ E = ${P.phi} ÷ ${P.Ecible} = ${nbf(P.phi / P.Ecible, 2)} m²`, `d² = ${nbf(P.phi / P.Ecible, 2)} ÷ 4π = ${nbf(P.phi / P.Ecible / (4 * Math.PI), 4)} m²`, `d = √${nbf(P.phi / P.Ecible / (4 * Math.PI), 4)} = ${nbf(D_VOUL / 100, 3)} m = ${nbf(D_VOUL, 1)} cm.`],
        expl: `d² = ${P.phi} ÷ (4π × ${P.Ecible}) = ${nbf(P.phi / P.Ecible / (4 * Math.PI), 4)} m² ; d = ${nbf(D_VOUL / 100, 3)} m, soit environ ${nbf(D_VOUL, 0)} cm.`, indice: 'Calculez Φ ÷ (4π × E) = 300 ÷ (4π × 500), puis prenez la racine carrée (en m) et convertissez en cm.' } },
    { id: 'limite', titre: 'Jusqu’où le modèle est-il valable ?', focus: [],
      retenirTitre: 'À retenir : trouver la distance',
      retenir: <>
        <SvgDistance/>
        <ul style={puces}>
          <li>Pour un éclairement voulu : <strong>surface de la sphère = Φ ÷ E</strong>, puis <strong>d² = Φ ÷ (4π E)</strong>, puis <strong>d = √(Φ ÷ (4π E))</strong>.</li>
          <li>Exemple : Φ = 100 W et E = 250 W/m² donnent d ≈ 0,18 m.</li>
          <li>Moyen de s’en souvenir : <strong>« on remonte la formule : diviser, puis racine carrée »</strong>.</li>
        </ul></>,
      texte: <>Notre modèle suppose une source <strong>ponctuelle</strong> et un panneau placé <strong>perpendiculairement</strong> aux rayons. Cela suppose que le panneau soit petit devant la distance qui le sépare de la lampe.</>,
      tache: { type: 'qcm', q: 'Dans quel cas le modèle E = Φ ÷ (4π d²) est-il le mieux vérifié ?', ...QCM.limite,
        expl: 'Quand d est très grande devant les dimensions de la source et du panneau, tous les points du panneau sont à peu près à la même distance et les rayons arrivent presque perpendiculairement : le modèle est bien vérifié. Très près, il ne l’est plus.', indice: 'Pensez à un panneau de 3 cm de côté placé à 3 cm de la lampe, puis à 50 cm : les rayons arrivent-ils de la même façon sur tout le panneau ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : les limites du modèle',
      retenir: <>
        <SvgLimite/>
        <ul style={puces}>
          <li>Le modèle suppose une <strong>source ponctuelle</strong>, un milieu transparent et une <strong>distance grande devant la taille du panneau</strong> (rayons presque perpendiculaires).</li>
          <li>Exemple : un panneau de 9 cm² (3 cm de côté) donne un bon résultat à 50 cm, plus à 3 cm.</li>
          <li>Moyen de s’en souvenir : <strong>« loin, la lampe est un point »</strong>.</li>
        </ul></>,
      texte: <>Vous savez calculer l’éclairement à une distance donnée, prévoir son évolution en 1/d², en déduire la puissance reçue et l’électricité fournie, calculer la part de lumière reçue et la distance pour un éclairement voulu. Explorez avec d’autres lampes et panneaux, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- état affiché selon le mode ----------
  const phi = enExplore ? ti.phi : enDefi && defi?.type === 'source' ? defi.phi : P.phi;
  const d = enExplore ? ti.d : enDefi && defi?.type === 'source' ? defi.d : curseurD ? gd : dEtape;
  const Spanneau = enExplore ? ti.S / 1e4 : S_PAN;
  const eta = enExplore ? M.ETA_EXPLO : ETA;
  const Ecour = M.eclairement(phi, d), Pl = Ecour * Spanneau, Pe = eta * Pl;

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'source') {
      const t = M.tirageDefiA(); const lst = M.D_LISTE_CM.filter(c => Math.abs(c / 100 - t.d3) > 1e-9);
      const d0 = lst.includes(50) ? 0.5 : lst[0] / 100;
      setDefi({ ...t, liste: lst, d: d0, rows: [{ d: d0, E: lu3(M.eclairement(t.phi, d0)) }], reps: { F: '', E: '' }, verifie: false, corr: false });
    } else setDefi({ ...M.tirageDefiB(), reps: { E: '', D: '' }, verifie: false, corr: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const choisirDDefi = c => setDefi(x => ({ ...x, d: c / 100, verifie: false, rows: x.rows.some(l => Math.abs(l.d - c / 100) < 1e-9) ? x.rows : [...x.rows, { d: c / 100, E: lu3(M.eclairement(x.phi, c / 100)) }] }));
  const verifier = () => {
    if (defi.type === 'source') {
      const F = lireNombre(defi.reps.F), E = lireNombre(defi.reps.E);
      const okF = isFinite(F) && proche(F, defi.phi, 0.05), okE = isFinite(E) && proche(E, defi.E3, 0.08);
      setDefi(x => ({ ...x, verifie: true, ok: okF && okE, okF, okE, sig: x.rows.length })); noterA(okF && okE);
    } else {
      const E = lireNombre(defi.reps.E), D = lireNombre(defi.reps.D);
      const okE = isFinite(E) && proche(E, defi.E, 0.05), okD = isFinite(D) && proche(D, defi.dCm, 0.06);
      setDefi(x => ({ ...x, verifie: true, ok: okE && okD, okE, okD })); noterB(okE && okD);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('pe-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  // messages d'aide ciblés (la valeur du défi n'est jamais donnée avant la correction)
  const diagnosticA = () => {
    const x = defi, msgs = [], F = lireNombre(x.reps.F), E = lireNombre(x.reps.E), l0 = x.rows[0], phi0 = l0.E * M.surfaceSphere(l0.d);
    if (!isFinite(F)) msgs.push('Φ : écrivez un nombre (virgule ou point).');
    else if (!x.okF) {
      if (x.rows.some(l => proche(F, l.E * (4 * Math.PI * (100 * l.d) ** 2), 0.08))) msgs.push('Φ : la distance est restée en centimètres. Convertissez d en mètres (1 m = 100 cm) avant de la mettre au carré.');
      else if (x.rows.some(l => proche(F, l.E * l.d * l.d, 0.08))) msgs.push('Φ : il manque le facteur 4π : Φ = E × 4π d².');
      else if (x.rows.some(l => proche(F, l.E * 4 * Math.PI * l.d, 0.08))) msgs.push('Φ : la distance doit être élevée au carré : Φ = E × 4π × d × d.');
      else if (x.rows.some(l => proche(F, l.E / M.surfaceSphere(l.d), 0.08))) msgs.push('Φ : il faut multiplier E par la surface de la sphère, pas la diviser.');
      else msgs.push(`Φ : avec votre première mesure (d = ${fmtV(l0.d)} m, E = ${fmtV(l0.E)} W/m²), Φ = E × 4π d² = ${fmt2(phi0)} W. Votre valeur est ${F > x.phi ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(E)) msgs.push('E à la distance demandée : écrivez un nombre (virgule ou point).');
    else if (!x.okE) {
      if (isFinite(F) && proche(E, M.eclairement(F, x.d3), 0.08) && !x.okF) msgs.push('E à la distance demandée : votre calcul est cohérent avec votre Φ, mais votre Φ n’est pas le bon. Reprenez Φ = E × 4π d².');
      else if (proche(E, x.E3 * (x.d3 * x.d3), 0.2) || proche(E, x.phi / x.d3, 0.08)) msgs.push('E à la distance demandée : E varie comme 1/d² : E = Φ ÷ (4π d²).');
      else if (proche(E, x.phi * M.surfaceSphere(x.d3), 0.08)) msgs.push('E à la distance demandée : il faut diviser Φ par la surface de la sphère, pas les multiplier.');
      else msgs.push(`E à la distance demandée : E = Φ ÷ (4π d²) avec d = ${nbf(x.d3, 2)} m (distance demandée, en mètres). Votre valeur est ${E > x.E3 ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, msgs = [], E = lireNombre(x.reps.E), D = lireNombre(x.reps.D), S = x.Scm2 / 1e4;
    if (!isFinite(E)) msgs.push('Éclairement : écrivez un nombre (virgule ou point).');
    else if (!x.okE) {
      if (proche(E, x.Pel / (x.etaPct / 100 * x.Scm2), 0.08)) msgs.push('Éclairement : la surface est restée en cm². Convertissez-la en m² (1 cm² = 0,0001 m²).');
      else if (proche(E, x.Pel / (x.etaPct * S), 0.08)) msgs.push(`Éclairement : le rendement doit être en nombre décimal : ${x.etaPct} % = ${nbf(x.etaPct / 100, 2)}.`);
      else if (proche(E, x.Pel / S, 0.08)) msgs.push('Éclairement : vous avez oublié le rendement. La lumière à recevoir est Plum = Pél ÷ η, puis E = Plum ÷ S.');
      else msgs.push(`Éclairement : E = Pél ÷ (η × S) = ${nbf(x.Pel, 3)} ÷ (${nbf(x.etaPct / 100, 2)} × ${nbf(S, 5)}). Votre valeur est ${E > x.E ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(D)) msgs.push('Distance : écrivez un nombre (virgule ou point).');
    else if (!x.okD) {
      const dE = isFinite(E) ? 100 * M.distancePour(x.phi, E) : NaN;
      if (proche(D, x.dCm / 100, 0.06)) msgs.push('Distance : cette valeur est en mètres. Pour des centimètres, multipliez par 100.');
      else if (isFinite(dE) && proche(D, dE, 0.06) && !x.okE) msgs.push('Distance : votre calcul est cohérent avec votre éclairement, mais celui-ci n’est pas le bon. Reprenez E = Pél ÷ (η × S).');
      else if (proche(D, 100 * Math.sqrt(x.phi / x.E), 0.06)) msgs.push('Distance : il manque le facteur 4π : 4π d² = Φ ÷ E.');
      else if (proche(D, 100 * x.phi / (4 * Math.PI * x.E), 0.06) || proche(D, x.phi / (4 * Math.PI * x.E), 0.06)) msgs.push('Distance : vous avez donné d², pas d : prenez la racine carrée.');
      else msgs.push(`Distance : d = √(Φ ÷ (4π E)) en mètres, puis × 100 pour des centimètres. Votre valeur est ${D > x.dCm ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'source'
    ? `Avec une mesure (d = ${fmtV(defi.rows[0].d)} m, E = ${fmtV(defi.rows[0].E)} W/m²) : Φ = E × 4π d² = ${fmtV(defi.rows[0].E)} × 4π × ${fmtV(defi.rows[0].d)}² ≈ ${fmt2(defi.phi)} W (les autres mesures donnent le même flux). À d = ${nbf(defi.d3, 2)} m : E = Φ ÷ (4π d²) = ${fmt2(defi.phi)} ÷ ${nbf(M.surfaceSphere(defi.d3), 3)} ≈ ${fmt2(defi.E3)} W/m². Un écart vient souvent d’une distance laissée en cm ou de l’oubli du facteur 4π.`
    : `E = Pél ÷ (η × S) = ${nbf(defi.Pel, defi.Pel < 0.1 ? 3 : 2)} ÷ (${nbf(defi.etaPct / 100, 2)} × ${nbf(defi.Scm2 / 1e4, 5)}) ≈ ${fmt2(defi.E)} W/m² (S converti en m²). Puis d = √(Φ ÷ (4π E)) = √(${defi.phi} ÷ (4π × ${fmt2(defi.E)})) ≈ ${nbf(defi.dCm / 100, 3)} m, soit environ ${fmt2(defi.dCm)} cm.`;
  const verdictValide = defi?.verifie && (defi.type !== 'source' || defi.sig === defi.rows.length);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['source', 'Source inconnue'], ['placer', 'Placer un panneau']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'source' ? 'Défi : une source de lumière inconnue' : 'Défi : placer un panneau à la bonne distance'}</div>
      {defi.type === 'source' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une lampe <strong>inconnue</strong> émet de la lumière dans toutes les directions. Un capteur mesure l’éclairement E à la distance d que vous choisissez. Déduisez-en le <strong>flux Φ</strong> de la lampe (en W), puis <strong>prévoyez l’éclairement E</strong> à la distance <strong>d = {nbf(defi.d3, 2)} m</strong> (en W/m²). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ ...styleBoite, marginBottom: 8 }}>
          <SceneEclairement d={defi.d}/>
          <label htmlFor="pe-dd" style={{ ...libelle, marginTop: 8 }}>Distance du capteur</label>
          <select id="pe-dd" value={String(Math.round(defi.d * 100))} onChange={ev => choisirDDefi(Number(ev.target.value))} style={selectStyle}>
            {defi.liste.map(c => <option key={c} value={c}>{c} cm</option>)}
          </select>
        </div>
        <div style={{ ...styleBoite, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>Tableau de mesures</div>
            <button onClick={() => setDefi(x => ({ ...x, rows: [x.rows.find(l => Math.abs(l.d - x.d) < 1e-9) || x.rows[0]], verifie: false }))} style={stylePetitBouton(false)}>Vider</button>
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5, textAlign: 'right' }}>
            <thead><tr style={{ color: KIT.txt2 }}><th style={{ textAlign: 'left', padding: '2px 4px' }}>d (cm)</th><th style={{ padding: '2px 4px' }}>E (W/m²)</th></tr></thead>
            <tbody>{[...defi.rows].sort((a, b) => a.d - b.d).map(l => <tr key={l.d} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ textAlign: 'left', padding: '2px 4px' }}>{Math.round(l.d * 100)}</td><td style={{ padding: '2px 4px' }}>{fmtV(l.E)}</td></tr>)}</tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Φ (W) =</span>{champ('F', 'Flux de la lampe en watts', verdictValide && defi.okF)}
          <span>E à {nbf(defi.d3, 2)} m (W/m²) =</span>{champ('E', 'Éclairement prévu en watts par mètre carré', verdictValide && defi.okE)}
        </div>
        <IndiceDefi cache={false}>E = Φ ÷ (4π d²), donc Φ = E × 4π d², avec d en mètres (1 m = 100 cm). Une seule mesure suffit ; les autres servent à vérifier. Pour la prévision, utilisez E = Φ ÷ (4π d²) avec la nouvelle distance en mètres.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une lampe émet un flux <strong>Φ = {defi.phi} W</strong> dans toutes les directions. Un panneau de surface <strong>S = {nbf(defi.Scm2, defi.Scm2 % 1 ? 1 : 0)} cm²</strong> et de rendement <strong>η = {defi.etaPct} %</strong>, placé face à la lampe, doit fournir une puissance électrique <strong>Pél = {nbf(defi.Pel, defi.Pel < 0.1 ? 3 : 2)} W</strong>. Calculez l’<strong>éclairement E</strong> nécessaire (en W/m²), puis la <strong>distance d</strong> à laquelle placer le panneau (en cm). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>E (W/m²) =</span>{champ('E', 'Éclairement nécessaire en watts par mètre carré', verdictValide && defi.okE)}
          <span>d (cm) =</span>{champ('D', 'Distance du panneau en centimètres', verdictValide && defi.okD)}
        </div>
        <IndiceDefi cache={false}>η = Pél ÷ Plum et Plum = E × S, donc E = Pél ÷ (η × S), avec S en m² (1 cm² = 0,0001 m²) et η en nombre décimal. Puis E = Φ ÷ (4π d²) donne d = √(Φ ÷ (4π E)) en mètres : × 100 pour des cm.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pe-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {verdictValide && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'source' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Source ponctuelle et isotrope</strong> : la lampe est assimilée à un point qui émet le même flux dans toutes les directions. Une vraie lampe n’est pas parfaitement isotrope.</li>
      <li><strong>Milieu transparent</strong> : l’air n’absorbe pas la lumière ; aucune lumière parasite réfléchie par les murs.</li>
      <li><strong>Panneau perpendiculaire aux rayons</strong>, petit devant la distance d (au moins quelques fois plus petite) : l’éclairement est le même sur toute sa surface. Très près de la lampe, le modèle n’est plus valable (distances réglables de 20 cm à 1,5 m).</li>
      <li><strong>Flux et rendement</strong> : le flux de 300 W et les valeurs des lampes sont inventés pour la simulation ; le flux est la puissance lumineuse émise, pas la puissance électrique consommée par la lampe. Le rendement du panneau est pris constant (15 %).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, graphique, mesures ----------
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Une lampe et un panneau</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>La lampe émet dans toutes les directions : à la distance d, sa lumière est répartie sur la sphère en pointillés.</div>}
      <SceneEclairement d={d}/>
      {enGuide && curseurD && <div style={{ marginTop: 8 }}>
        <Curseur nom="Distance d" valeur={gd} onChange={setGd} min={M.D_MIN} max={M.D_MAX} pas={0.05} unite="m" decimales={2} couleur="#0369a1"/>
      </div>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="pe-phi" style={libelle}>Flux de la lampe Φ</label>
      <select id="pe-phi" value={ti.phi} onChange={ev => setTi(s => ({ ...s, phi: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.FLUX_LISTE.map(v => <option key={v} value={v}>{v} W</option>)}
      </select>
      <Curseur nom="Distance d" valeur={ti.d} onChange={v => setTi(s => ({ ...s, d: v }))} min={M.D_MIN} max={M.D_MAX} pas={0.05} unite="m" decimales={2} couleur="#0369a1"/>
      <label htmlFor="pe-s" style={libelle}>Surface du panneau S</label>
      <select id="pe-s" value={ti.S} onChange={ev => setTi(s => ({ ...s, S: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {M.SURFACES_CM2.map(v => <option key={v} value={v}>{nbf(v, v % 1 ? 1 : 0)} cm²</option>)}
      </select>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Éloignez la lampe : comparez E à d et à 2 d. Le rendement du panneau est fixé à 15 %.</div>
    </div>);
  const graphE = (enExplore || (enGuide && deja('double'))) && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Éclairement selon la distance</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le point noir indique la distance réglée ; la courbe descend vite puis s’aplatit.</div>}
      <GrapheE phi={phi} d={d}/>
    </div>);
  const mesures = (enExplore || (enGuide && deja('double'))) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs pour la distance choisie, puis puissance reçue et électricité fournie par le panneau.</div>}
      <LigneMesure nom="Flux de la lampe Φ" valeur={`${phi}${NB}W`} couleur={COL.orange}/>
      <LigneMesure nom="Distance d" valeur={`${nbf(d, 2)}${NB}m`}/>
      <LigneMesure nom="Surface de la sphère 4π d²" valeur={`${nbf(M.surfaceSphere(d), 2)}${NB}m²`}/>
      <LigneMesure nom="Éclairement E = Φ ÷ (4π d²)" valeur={`${nbf(Ecour, Ecour >= 100 ? 0 : 1)}${NB}W/m²`} couleur={COL.bleu}/>
      {(enExplore || deja('plum')) && <LigneMesure nom="Surface du panneau S" valeur={`${nbf(Spanneau * 1e4, 1)}${NB}cm²`}/>}
      {(enExplore || deja('pel')) && <LigneMesure nom="Lumière reçue Plum = E × S" valeur={`${nbf(Pl, 3)}${NB}W`} couleur={COL.bleu}/>}
      {(enExplore || deja('part')) && <LigneMesure nom="Électricité Pél = η × Plum" valeur={`${nbf(1000 * Pe, 1)}${NB}mW`} couleur={COL.vert}/>}
      {(enExplore || deja('distance')) && <LigneMesure nom="Part du flux émis reçue" valeur={`${nbf(100 * Pl / phi, 3)}${NB}%`} couleur={COL.gris}/>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Placez la lampe à 0,50 m puis à 1,0 m : par combien l’éclairement est-il divisé ? Et à 1,5 m par rapport à 0,50 m (distance × 3) ?</li>
      <li>Doublez le flux Φ à distance fixée : que devient l’éclairement ? Et la puissance reçue par le panneau ?</li>
      <li>Comparez les trois panneaux à la même distance : quelle grandeur change (Plum, Pél), laquelle ne change pas (E) ?</li>
      <li>Quelle part du flux émis est reçue par le panneau de 100 cm² à 0,20 m ? Même à cette distance, est-ce beaucoup ?</li>
      <li>À quelle distance faut-il placer la lampe de 500 W pour obtenir 500 W/m² ? Vérifiez avec d = √(Φ ÷ (4π E)).</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Éclairement : E = Φ ÷ (4π d²), avec d en m (la sphère a pour surface 4π d²)</li>
        <li>Distance × 2 : éclairement ÷ 4 (E varie comme 1/d²)</li>
        <li>Puissance reçue : Plum = E × S (S en m²) ; électricité : Pél = η × Plum</li>
        <li>Distance pour un éclairement voulu : d = √(Φ ÷ (4π E))</li>
        <li>Modèle valable si d est grande devant la taille du panneau</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pe-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pe-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pe-col { display: flex; flex-direction: column; gap: 12px; }
        .pe-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .pe-l1.cote .pe-carte { order: 2; } .pe-l1.cote .pe-main { order: 1; }
          .pe-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .pe-ex > * { grid-column: 1; }
          .pe-ex > .pe-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .pe-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pe-in { animation: pe-fondu 0.35s ease-out; } @keyframes pe-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Éclairement et distance à la source</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une lampe émet dans toutes les directions : plus on s’éloigne, plus sa lumière est <strong>étalée</strong>. On calcule l’<strong>éclairement</strong> à une distance donnée, la <strong>puissance reçue</strong> par un panneau et la <strong>distance</strong> nécessaire pour un éclairement voulu.</div>
      {!enExplore && <div className={`pe-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="pe-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="pe-carte">{panneauHypo}</div>}
        <div className="pe-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'source' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="pe-col">
            <div className="pe-in">{scene}</div>
            {mesures && <div className="pe-in">{mesures}</div>}
            {graphE && <div className="pe-in">{graphE}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <PanneauEclairementExplore ti={ti} setTi={setTi}/>
        <div style={{ margin: '12px 0' }}>
          <Section titre={`Réglages précis et mesures : Φ = ${ti.phi} W · d = ${String(ti.d).replace('.', ',')} m · S = ${String(ti.S).replace('.', ',')} cm²`} ouvert={!!ouv.precis} onBascule={() => bascule('precis')}>
            <div className="pe-ex">
              {scene}
              <div className="pe-reg">{reglages}</div>
              {mesures}
            </div>
            {graphE}
          </Section>
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
