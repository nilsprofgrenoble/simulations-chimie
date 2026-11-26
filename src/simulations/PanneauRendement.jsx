import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as R from "./panneauRendementModele";
import { PanneauRendementExplore } from "./PanneauRendementExplore";
import { QCM } from "./panneauRendementQcm";
import { SceneCircuit, GrapheP, affInstrument } from "./PanneauPhotovoltaiqueSchemas";
import { BarreBilan, SvgPlum, SvgBilan, SvgPointFonct, SvgFacteurs, SvgDimension } from "./PanneauRendementSchemas";

const SIM_ID = 228, CLE_GUIDE = 'panneau-rendement-guide-v1';
declarerDefis(SIM_ID, [['eta', 'Rendement d’un panneau inconnu'], ['dimension', 'Dimensionner une installation']]);

// ====================================================
//  SIM 228 — RENDEMENT D'UN PANNEAU PHOTOVOLTAÏQUE (TSTL, enseignement PCM, partie « Énergie et ondes »).
//  Une seule idée : bilan énergétique d'un panneau ; Plum = E × S, Pél = U × I, η = Pél ÷ Plum, pertes = Plum − Pél ; le rendement dépend du point de fonctionnement et peu de l'éclairement.
//  Aucune situation des documents du Moodle : panneau de laboratoire de 6 cellules (37,5 cm²), mini-panneau, grand panneau, valeurs inventées.
//  Capacités visées (jamais affichées à l'élève) : relation flux énergétique / éclairement (Φ = E × S) ; estimer le rendement d'un panneau photovoltaïque à partir de données expérimentales et identifier les facteurs limitants ;
//  effectuer le bilan énergétique d'un panneau photovoltaïque ; puissance électrique P = U × I.
//  Modèle : panneauRendementModele.js (s'appuie sur panneauPvModele.js, 25 °C). QCM : panneauRendementQcm.js. Schémas : PanneauRendementSchemas.jsx (la scène et le graphe P(U) viennent de la sim 227).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtV = v => String(Number(Number(v).toPrecision(3))).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const PP = R.PANNEAU_PARCOURS, PA = R.PARCOURS, S_CM2 = R.surfaceCm2(PP), S_M2 = R.surface(PP);
const lu3 = x => Number(Number(x).toPrecision(3));
const libR = r => (r === 0 ? '0 Ω (fil de connexion)' : !isFinite(r) ? '∞ (circuit ouvert)' : `${nbf(r, 0)} Ω`);

// ---------- valeurs de référence du parcours (panneau de laboratoire) ----------
const PLUM1 = R.plum(PP, PA.E);                                        // 3,75 W
const q100 = R.point(PP, PA.E, PA.Ra), U100 = lu3(q100.U), I100 = lu3(1000 * q100.I), P100 = lu3(U100 * I100 / 1000);
const ETA100 = 100 * P100 / PLUM1, PERTES100 = PLUM1 - P100;
const ETAMAX1 = 100 * R.etaMax(PP, PA.E), PMAX1 = R.pointPmax(PP, PA.E).P;
const PLUM2 = R.plum(PP, PA.E2), ETAMAX2 = 100 * R.etaMax(PP, PA.E2);
const PLUMNEC = PA.Pel / PA.eta, PLUMNEC_AFF = lu3(PLUMNEC), SURF = PLUMNEC_AFF / PA.E3 * 1e4;

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const Psub = ({ s }) => <>P<sub>{s}</sub></>;

function SelectR({ id, valeur, onChange }) {
  return (
    <select id={id} value={isFinite(valeur) ? String(valeur) : 'inf'} onChange={ev => onChange(ev.target.value === 'inf' ? Infinity : Number(ev.target.value))} style={selectStyle}>
      {R.R_LISTE.map(r => <option key={String(r)} value={isFinite(r) ? String(r) : 'inf'}>{libR(r)}</option>)}
    </select>);
}
const ligneMesure = (p, E, r) => { const q = R.point(p, E, r); return { R: r, U: lu3(q.U), I: lu3(1000 * q.I) }; };

// ====================================================
export function SimulationPanneauRendement() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('eta');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ pan: 'lab', E: 1000, R: 15 });
  const [gR, setGR] = useState(PA.Ra), [gE, setGE] = useState(PA.E), [gPts, setGPts] = useState([]);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- étapes du parcours ----------
  const IDS = ['chaine', 'plum', 'pel', 'eta', 'pertes', 'meilleur', 'point', 'eclair', 'eclairQ', 'facteurs', 'plumNec', 'surface', 'bilan'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const gEeff = enGuide && etape < IDS.indexOf('eclair') ? PA.E : gE;
  const gReff = enGuide && etape < IDS.indexOf('meilleur') ? PA.Ra : gR;      // R reste à 100 Ω tant que l'étape de recherche n'a pas commencé
  const choisirR = v => { setGR(v); setGPts(l => (l.includes(v) ? l : [...l, v])); };

  const ETAPES = [
    { id: 'chaine', titre: 'Où va la lumière reçue ?', focus: ['scene'],
      texte: <>Un panneau photovoltaïque de laboratoire, éclairé par une lampe, alimente une résistance. Il reçoit de l’énergie sous forme de <strong>lumière</strong> et fournit de l’énergie <strong>électrique</strong>. On compare les <strong>puissances</strong> (énergie par seconde, en watts) : la puissance lumineuse reçue et la puissance électrique fournie.</>,
      tache: { type: 'qcm', q: 'Que devient la puissance lumineuse reçue qui n’est pas convertie en puissance électrique ?', ...QCM.chaine,
        expl: 'L’énergie se conserve : ce qui n’est pas converti en électricité est perdu pour l’utilisateur, surtout sous forme de chaleur (le panneau s’échauffe) et de lumière non utilisée.', indice: 'L’énergie ne peut ni disparaître ni apparaître : puissance reçue = puissance électrique + puissance perdue. Où va la partie perdue ?' } },
    { id: 'plum', titre: 'La puissance lumineuse reçue', focus: ['scene'],
      texte: <>L’<strong>éclairement</strong> <strong>E</strong> est la puissance lumineuse reçue par mètre carré : ici <strong>E = {PA.E} W/m²</strong>. Le panneau a une <strong>surface</strong> <strong>S = {nbf(S_CM2, 1)} cm²</strong> (1 m² = 10 000 cm²). La puissance lumineuse reçue, notée <strong><Psub s="lum"/></strong>, est le produit de l’éclairement par la surface : <strong><Psub s="lum"/> = E × S</strong>, avec S en m².</>,
      tache: { type: 'num', q: `Puissance lumineuse reçue Plum par le panneau (E = ${PA.E} W/m², S = ${nbf(S_CM2, 1)} cm²), en watts (W)`, unite: 'W', vrai: PLUM1, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        pieges: [[PA.E * S_CM2, 'La surface est restée en cm² : convertissez-la en m² (1 cm² = 0,0001 m²) avant de multiplier.'], [PA.E / S_M2, 'Il faut multiplier l’éclairement par la surface, pas les diviser.']],
        calcul: () => [`S = ${nbf(S_CM2, 1)} cm² = ${nbf(S_CM2, 1)} × 0,0001 = ${nbf(S_M2, 5)} m²`, `Plum = E × S = ${PA.E} × ${nbf(S_M2, 5)} = ${nbf(PLUM1, 2)} W.`],
        expl: `S = ${nbf(S_CM2, 1)} cm² = ${nbf(S_M2, 5)} m² ; Plum = ${PA.E} × ${nbf(S_M2, 5)} = ${nbf(PLUM1, 2)} W.`, indice: 'Plum = E × S : convertissez d’abord la surface en m² (1 cm² = 0,0001 m²), puis multipliez par l’éclairement.' } },
    { id: 'pel', titre: 'La puissance électrique fournie', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : la puissance lumineuse reçue',
      retenir: <>
        <SvgPlum/>
        <ul style={puces}>
          <li>La <strong>puissance lumineuse reçue</strong> est <strong>Plum = E × S</strong> : éclairement en W/m², surface en <strong>m²</strong>, résultat en watts.</li>
          <li>Exemple d’un mini-panneau de 9 cm² sous 700 W/m² : S = 0,0009 m², donc Plum = 0,63 W.</li>
          <li>Moyen de s’en souvenir : <strong>« E × S : W/m² × m² = W »</strong>, et on convertit les cm² en m².</li>
        </ul></>,
      texte: <>Deux appareils de mesure apparaissent : un voltmètre (tension <strong>U</strong>, en volts) et un ampèremètre (intensité <strong>I</strong>, en mA). La résistance vaut <strong>R = {PA.Ra} Ω</strong>. La puissance électrique fournie, notée <strong><Psub s="él"/></strong>, vaut <strong><Psub s="él"/> = U × I</strong>. Rappel : la puissance lumineuse reçue est <strong>{nbf(PLUM1, 2)} W</strong>.</>,
      tache: { type: 'num', q: `Puissance électrique Pél fournie pour R = ${PA.Ra} Ω, en watts (W)`, unite: 'W', vrai: P100, tol: 0.05, affiche: v => nbf(v, 3), cs: 2,
        calcul: () => [`Lectures : U = ${nbf(U100, 2)} V et I = ${nbf(I100, 1)} mA = ${nbf(I100 / 1000, 4)} A`, `Pél = U × I = ${nbf(U100, 2)} × ${nbf(I100 / 1000, 4)} = ${nbf(P100, 3)} W.`],
        pieges: [[U100 * I100, 'I est lue en milliampères : U × I donne ici des milliwatts. Pour des watts, convertissez I en ampères (1 mA = 0,001 A).']],
        expl: `Pél = U × I = ${nbf(U100, 2)} V × ${nbf(I100 / 1000, 4)} A = ${nbf(P100, 3)} W.`, indice: 'Pél = U × I, avec U en volts et I en ampères : convertissez I (affichée en mA) avant de multiplier.' } },
    { id: 'eta', titre: 'Le rendement', focus: ['mesures'],
      texte: <>Le <strong>rendement</strong> du panneau, noté <strong>η</strong> (lettre grecque « êta »), est la part de la lumière reçue qui devient de l’électricité : <strong>η = <Psub s="él"/> ÷ <Psub s="lum"/></strong>. On l’exprime en pourcentage. Rappels : <Psub s="lum"/> = <strong>{nbf(PLUM1, 2)} W</strong> et <Psub s="él"/> = <strong>{nbf(P100, 3)} W</strong>.</>,
      tache: { type: 'num', q: 'Rendement η du panneau pour R = 100 Ω, en pourcentage (%)', unite: '%', vrai: 100 * P100 / PLUM1, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[P100 / PLUM1, 'Ce rapport est une fraction : pour un pourcentage, multipliez-le par 100.'], [PLUM1 / P100, 'Le rapport est inversé : η = Pél divisé par Plum (la partie utile sur le total).']],
        calcul: () => [`η = Pél ÷ Plum = ${nbf(P100, 3)} ÷ ${nbf(PLUM1, 2)} = ${nbf(P100 / PLUM1, 4)}`, `En pourcentage : η = ${nbf(100 * P100 / PLUM1, 1)} %.`],
        expl: `η = ${nbf(P100, 3)} ÷ ${nbf(PLUM1, 2)} = ${nbf(P100 / PLUM1, 3)} soit ${nbf(100 * P100 / PLUM1, 1)} %. Seule une petite part de la lumière devient de l’électricité à cette résistance.`, indice: 'η = Pél ÷ Plum : divisez la puissance électrique par la puissance lumineuse, puis multipliez par 100 pour obtenir un pourcentage.' } },
    { id: 'pertes', titre: 'La puissance perdue', focus: ['barre', 'mesures'],
      retenirTitre: 'À retenir : bilan et rendement',
      retenir: <>
        <SvgBilan/>
        <ul style={puces}>
          <li><strong>Plum = Pél + pertes</strong> (conservation de l’énergie) ; le <strong>rendement</strong> est <strong>η = Pél ÷ Plum</strong>, toujours inférieur à 100 %.</li>
          <li>Exemple du mini-panneau à 1000 W/m² : 0,90 W reçus, 0,14 W d’électricité, 0,76 W de pertes, donc η ≈ 16 %.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui est utile ÷ ce qui est reçu »</strong>.</li>
        </ul></>,
      texte: <>La barre de bilan montre la puissance lumineuse reçue (barre entière) et la part convertie en électricité (en vert). Le rendement affiché dans les mesures est celui de l’étape précédente. Rappels : <Psub s="lum"/> = <strong>{nbf(PLUM1, 2)} W</strong> et <Psub s="él"/> = <strong>{nbf(P100, 3)} W</strong>.</>,
      tache: { type: 'num', q: 'Puissance perdue (chaleur et lumière non utilisée), en watts (W)', unite: 'W', vrai: PERTES100, tol: 0.05, affiche: v => nbf(v, 2), cs: 3,
        pieges: [[P100, 'Cette valeur est la puissance électrique, pas la puissance perdue. Les pertes sont ce qui reste de la lumière reçue.'], [PLUM1 + P100, 'Les pertes sont la différence entre la lumière reçue et l’électricité, pas leur somme.']],
        calcul: () => [`pertes = Plum − Pél = ${nbf(PLUM1, 2)} − ${nbf(P100, 3)} = ${nbf(PERTES100, 2)} W.`],
        expl: `pertes = Plum − Pél = ${nbf(PLUM1, 2)} − ${nbf(P100, 3)} = ${nbf(PERTES100, 2)} W : presque toute la lumière reçue est perdue à cette résistance.`, indice: 'Plum = Pél + pertes, donc pertes = Plum − Pél.' } },
    { id: 'meilleur', titre: 'Chercher le meilleur rendement', focus: ['scene', 'mesures', 'graphe'],
      texte: <>Un sélecteur permet maintenant de changer la résistance R, et un graphique de la puissance Pél selon la tension U apparaît. L’éclairement reste E = {PA.E} W/m², donc <Psub s="lum"/> = <strong>{nbf(PLUM1, 2)} W</strong> ne change pas. Cherchez la plus grande puissance électrique, puis calculez le <strong>rendement maximal</strong> η = Pél ÷ Plum.</>,
      tache: { type: 'num', q: 'Rendement maximal η du panneau à 1000 W/m², en pourcentage (%), avec 2 chiffres significatifs', unite: '%', vrai: ETAMAX1, tol: 0.06, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [`Au maximum : Pél ≈ ${nbf(PMAX1, 2)} W (R voisine de 16 Ω).`, `η = ${nbf(PMAX1, 2)} ÷ ${nbf(PLUM1, 2)} = ${nbf(ETAMAX1 / 100, 3)} soit ${nbf(ETAMAX1, 1)} %.`],
        pieges: [[PMAX1 / PLUM1, 'Ce rapport est une fraction : multipliez-le par 100 pour avoir des %.']],
        expl: `Vers R = 15 à 20 Ω, Pél atteint environ ${nbf(PMAX1, 2)} W : η = ${nbf(PMAX1, 2)} ÷ ${nbf(PLUM1, 2)} ≈ ${nbf(ETAMAX1, 1)} %.`, indice: 'Essayez R = 10, 15, 20 et 30 Ω : gardez la plus grande puissance Pél, puis divisez-la par Plum et multipliez par 100.' } },
    { id: 'point', titre: 'Pourquoi le rendement change-t-il ?', focus: ['graphe'],
      texte: <>À R = {PA.Ra} Ω, le rendement vaut {nbf(ETA100, 1)} % ; au meilleur point, environ {nbf(ETAMAX1, 0)} %. Pourtant la puissance lumineuse reçue est la même : {nbf(PLUM1, 2)} W.</>,
      tache: { type: 'qcm', q: 'Pourquoi le rendement dépend-il de la résistance R ?', ...QCM.point,
        expl: 'La lumière reçue ne change pas, mais la puissance électrique U × I dépend du point de fonctionnement : elle est maximale au coude de la caractéristique et très faible quand la résistance est trop petite ou trop grande.', indice: 'Comparez les deux puissances : qu’est-ce qui change quand R change, et qu’est-ce qui reste constant ?' } },
    { id: 'eclair', titre: 'Avec moins de lumière', focus: ['scene', 'mesures'],
      retenirTitre: 'À retenir : le point de fonctionnement',
      retenir: <>
        <SvgPointFonct/>
        <ul style={puces}>
          <li>Pour une même lumière reçue, le rendement est <strong>maximal au point de puissance maximale</strong> (le « coude »), et faible si la résistance est trop grande ou trop petite.</li>
          <li>Exemple du mini-panneau à 1000 W/m² : η ≈ 16 % au coude (R ≈ 17 Ω) mais ≈ 4 % pour R = 100 Ω.</li>
          <li>Moyen de s’en souvenir : <strong>« bien choisir la charge pour récupérer le maximum »</strong>.</li>
        </ul></>,
      texte: <>Un curseur d’éclairement apparaît. Réglez <strong>E = {PA.E2} W/m²</strong> et cherchez de nouveau le meilleur rendement. Rappel : la puissance lumineuse reçue vaut maintenant Plum = E × S = {PA.E2} × {nbf(S_M2, 5)} = <strong>{nbf(PLUM2, 2)} W</strong>. Le rendement maximal à {PA.E} W/m² était d’environ {nbf(ETAMAX1, 1)} %.</>,
      tache: { type: 'num', q: `Rendement maximal η à ${PA.E2} W/m², en pourcentage (%), avec 2 chiffres significatifs`, unite: '%', vrai: ETAMAX2, tol: 0.06, affiche: v => nbf(v, 1), cs: 2,
        bloque: gEeff === PA.E2 ? null : `Réglez E sur ${PA.E2} W/m² avec le curseur, puis cherchez la plus grande puissance Pél.`,
        calcul: () => [`À ${PA.E2} W/m² : Pél maximale ≈ ${nbf(R.pointPmax(PP, PA.E2).P, 3)} W, et Plum = ${nbf(PLUM2, 2)} W.`, `η = ${nbf(R.pointPmax(PP, PA.E2).P, 3)} ÷ ${nbf(PLUM2, 2)} = ${nbf(ETAMAX2 / 100, 3)} soit ${nbf(ETAMAX2, 1)} %.`],
        pieges: [[R.pointPmax(PP, PA.E2).P / PLUM1, 'Vous avez divisé par la puissance lumineuse reçue à 1000 W/m². Divisez par celle de 400 W/m².']],
        expl: `À ${PA.E2} W/m², Pél max ≈ ${nbf(R.pointPmax(PP, PA.E2).P, 2)} W pour Plum = ${nbf(PLUM2, 2)} W : η ≈ ${nbf(ETAMAX2, 1)} %.`, indice: 'Cherchez la plus grande puissance Pél (R voisine de 40 Ω), puis divisez par Plum = 1,50 W et multipliez par 100.' } },
    { id: 'eclairQ', titre: 'Le rendement dépend-il de l’éclairement ?', focus: ['mesures'],
      texte: <>Quand l’éclairement passe de {PA.E} à {PA.E2} W/m², la puissance lumineuse reçue passe de {nbf(PLUM1, 2)} W à {nbf(PLUM2, 2)} W. Le rendement maximal est passé d’environ {nbf(ETAMAX1, 1)} % à {nbf(ETAMAX2, 1)} %.</>,
      tache: { type: 'qcm', q: `Comment évolue le rendement maximal quand l’éclairement passe de ${PA.E} à ${PA.E2} W/m² ?`, ...QCM.eclairE,
        expl: `Le rendement reste voisin (${nbf(ETAMAX1, 1)} % puis ${nbf(ETAMAX2, 1)} %) : la puissance électrique diminue à peu près comme la puissance lumineuse. Le rendement ne se divise pas par 2,5.`, indice: 'Calculez le rapport des deux rendements maximaux, puis comparez-le au rapport des éclairements (2,5).' } },
    { id: 'facteurs', titre: 'Pourquoi le rendement reste-t-il faible ?', focus: [],
      retenirTitre: 'À retenir : le rendement varie peu avec la lumière',
      retenir: <>
        <ul style={puces}>
          <li>Pour un panneau, le <strong>rendement maximal varie peu</strong> avec l’éclairement : la puissance électrique est à peu près proportionnelle à la lumière reçue.</li>
          <li>Exemple d’un mini-panneau : η ≈ 13 % à 100 W/m², ≈ 15 % à 400 W/m² et ≈ 16 % à 1000 W/m².</li>
          <li>Moyen de s’en souvenir : <strong>« moins de lumière, moins d’électricité, mais presque le même rendement »</strong>.</li>
        </ul></>,
      texte: <>Un panneau photovoltaïque s’échauffe quand il est éclairé, même si la température reste fixée à 25 °C dans la simulation. Son rendement n’atteint jamais 100 % ; pour un panneau au silicium courant, il est de l’ordre de 15 à 25 %.</>,
      tache: { type: 'qcm', q: 'Que traduit l’échauffement du panneau ?', ...QCM.facteurs,
        expl: 'L’échauffement montre qu’une partie de la puissance lumineuse est transformée en chaleur au lieu d’être convertie en électricité : c’est une perte, un facteur qui limite le rendement. Un panneau ne peut pas fournir plus d’énergie qu’il n’en reçoit.', indice: 'Pensez à la conservation de l’énergie : si l’énergie ne devient pas de l’électricité, sous quelle forme se retrouve-t-elle ?' } },
    { id: 'plumNec', titre: 'Dimensionner : la puissance lumineuse nécessaire', focus: [],
      retenirTitre: 'À retenir : les facteurs limitants',
      retenir: <>
        <SvgFacteurs/>
        <ul style={puces}>
          <li>Le rendement est limité par : la <strong>lumière réfléchie</strong>, les <strong>photons trop peu énergétiques</strong> (non absorbés), l’<strong>excès d’énergie</strong> des photons (chaleur), les <strong>pertes dans la cellule</strong> et une <strong>charge mal adaptée</strong>.</li>
          <li>Ordre de grandeur : de 15 à 25 % pour le silicium du commerce ; la chaleur due au Soleil fait encore baisser la tension, donc la puissance.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui n’est pas électricité est perte »</strong>.</li>
        </ul></>,
      texte: <>On veut alimenter un appareil qui demande une puissance électrique <strong><Psub s="él"/> = {nbf(PA.Pel, 1)} W</strong>, avec un panneau de rendement <strong>η = {nbf(100 * PA.eta, 0)} %</strong> (soit 0,15). Comme η = Pél ÷ Plum, on a <strong>Plum = Pél ÷ η</strong>.</>,
      tache: { type: 'num', q: 'Puissance lumineuse Plum que le panneau doit recevoir, en watts (W)', unite: 'W', vrai: PLUMNEC, tol: 0.05, affiche: v => nbf(v, 1), cs: 3,
        pieges: [[PA.Pel * PA.eta, 'Ce produit est Pél × η. Pour retrouver la lumière reçue, il faut diviser Pél par η, car le panneau ne convertit qu’une part de la lumière.'], [PA.Pel / (100 * PA.eta), 'Le rendement est ici 0,15 (ou 15 %) : écrivez-le en nombre décimal (0,15) pour diviser.']],
        calcul: () => [`Plum = Pél ÷ η = ${nbf(PA.Pel, 1)} ÷ ${nbf(PA.eta, 2)} = ${nbf(PLUMNEC, 1)} W.`],
        expl: `Plum = Pél ÷ η = ${nbf(PA.Pel, 1)} ÷ 0,15 = ${nbf(PLUMNEC, 1)} W : il faut recevoir plus de 6 fois la puissance électrique voulue.`, indice: 'η = Pél ÷ Plum, donc Plum = Pél ÷ η, avec η en nombre décimal (15 % = 0,15).' } },
    { id: 'surface', titre: 'Dimensionner : la surface du panneau', focus: [],
      texte: <>Le panneau sera éclairé avec <strong>E = {PA.E3} W/m²</strong>. La puissance lumineuse à recevoir est <Psub s="lum"/> = <strong>{nbf(PLUMNEC_AFF, 1)} W</strong>. Comme Plum = E × S, on a <strong>S = Plum ÷ E</strong>.</>,
      tache: { type: 'num', q: 'Surface S du panneau, en cm² (1 m² = 10 000 cm²), avec 2 chiffres significatifs', unite: 'cm²', vrai: SURF, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[SURF / 1e4, 'Cette valeur est en m². Convertissez en cm² : 1 m² = 10 000 cm².'], [PLUMNEC_AFF * PA.E3, 'Il faut diviser Plum par E, pas les multiplier.']],
        calcul: () => [`S = Plum ÷ E = ${nbf(PLUMNEC_AFF, 1)} ÷ ${PA.E3} = ${nbf(PLUMNEC_AFF / PA.E3, 4)} m²`, `S = ${nbf(PLUMNEC_AFF / PA.E3, 4)} × 10 000 = ${nbf(SURF, 0)} cm².`],
        expl: `S = ${nbf(PLUMNEC_AFF, 1)} ÷ ${PA.E3} = ${nbf(PLUMNEC_AFF / PA.E3, 4)} m², soit environ ${nbf(SURF, 0)} cm² (un carré d’environ 20 cm de côté).`, indice: 'S = Plum ÷ E, en m², puis multipliez par 10 000 pour obtenir des cm².' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : dimensionner une installation',
      retenir: <>
        <SvgDimension/>
        <ul style={puces}>
          <li>Pour une puissance électrique voulue : <strong>Plum = Pél ÷ η</strong>, puis <strong>S = Plum ÷ E</strong>, soit <strong>S = Pél ÷ (η × E)</strong>.</li>
          <li>Exemple : 2,0 W avec η = 15 % sous 1000 W/m² demandent 13,3 W reçus, donc 133 cm².</li>
          <li>Moyen de s’en souvenir : <strong>« on divise par le rendement, puis par l’éclairement »</strong>.</li>
        </ul></>,
      texte: <>Vous savez calculer la puissance lumineuse reçue, la puissance électrique fournie, le rendement et les pertes d’un panneau, voir que le rendement dépend du point de fonctionnement et peu de l’éclairement, citer des facteurs limitants et dimensionner une surface. Explorez avec d’autres panneaux, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- état affiché selon le mode ----------
  const p = enExplore ? R.PANNEAUX[ti.pan] : enDefi && defi?.p ? defi.p : PP;
  const E = enExplore ? ti.E : enDefi && defi?.type === 'eta' ? defi.E : gEeff;
  const r = enExplore ? ti.R : enDefi && defi?.type === 'eta' ? defi.R ?? 100 : gReff;
  const q = R.point(p, E, r), plumE = R.plum(p, E), pm = R.pointPmax(p, E);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'eta') { const d = R.tirageDefiA(); setDefi({ ...d, reps: { L: '', P: '', N: '' }, R: 100, rows: [ligneMesure(d.p, d.E, 100)], verifie: false, corr: false }); }
    else setDefi({ ...R.tirageDefiB(), reps: { L: '', S: '' }, verifie: false, corr: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const choisirRDefi = v => setDefi(d => ({ ...d, R: v, verifie: false, rows: d.rows.some(l => l.R === v) ? d.rows : [...d.rows, ligneMesure(d.p, d.E, v)] }));
  const verifier = () => {
    if (defi.type === 'eta') {
      const L = lireNombre(defi.reps.L), P = lireNombre(defi.reps.P), N = lireNombre(defi.reps.N);
      const okL = isFinite(L) && proche(L, defi.Plum, 0.05), okP = isFinite(P) && proche(P, defi.Pmax, 0.10), okN = isFinite(N) && proche(N, defi.eta, 0.12);
      setDefi(x => ({ ...x, verifie: true, ok: okL && okP && okN, okL, okP, okN, sig: x.rows.length })); noterA(okL && okP && okN);
    } else {
      const L = lireNombre(defi.reps.L), S = lireNombre(defi.reps.S);
      const okL = isFinite(L) && proche(L, defi.Plum, 0.05), okS = isFinite(S) && proche(S, defi.S, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok: okL && okS, okL, okS })); noterB(okL && okS);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('pr-verif')?.click()} onChange={e2 => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  // messages d'aide ciblés (la valeur du défi n'est jamais donnée avant la correction)
  const diagnosticA = () => {
    const d = defi, msgs = [], L = lireNombre(d.reps.L), P = lireNombre(d.reps.P), N = lireNombre(d.reps.N);
    const meilleur = d.rows.reduce((m, l) => (l.U * l.I / 1000 > m.P ? { P: l.U * l.I / 1000, R: l.R } : m), { P: -1, R: 0 });
    if (!isFinite(L)) msgs.push('Plum : écrivez un nombre (virgule ou point).');
    else if (!d.okL) {
      if (proche(L, d.E * d.S, 0.05)) msgs.push('Plum : la surface est restée en cm². Convertissez-la en m² (1 cm² = 0,0001 m²) avant de multiplier par E.');
      else if (proche(L, d.E / (d.S / 1e4), 0.05)) msgs.push('Plum : il faut multiplier E par S, pas les diviser.');
      else msgs.push(`Plum : Plum = E × S avec S en m² = ${d.E} × ${nbf(d.S / 1e4, 5)}. Votre valeur est ${L > d.Plum ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(P)) msgs.push('Pél maximale : écrivez un nombre (virgule ou point).');
    else if (!d.okP) {
      if (proche(P, d.Pmax * 1000, 0.15)) msgs.push('Pél maximale : facteur 1000. U est en volts mais I est lue en mA : convertissez I en ampères.');
      else if (meilleur.P < 0) msgs.push('Pél maximale : changez R pour noter des mesures dans le tableau, puis calculez U × I pour chacune.');
      else if (!proche(P, meilleur.P, 0.10)) msgs.push(`Pél maximale : avec votre tableau, le plus grand produit U × I vaut ${fmtV(meilleur.P)} W (pour R = ${libR(meilleur.R)}). Refaites le calcul en convertissant I en ampères.`);
      else msgs.push(`Pél maximale : votre calcul est cohérent avec votre tableau (${fmtV(meilleur.P)} W), mais le maximum est ${P < d.Pmax ? 'plus haut' : 'plus bas'} : essayez d’autres valeurs de R autour du coude.`);
    }
    if (!isFinite(N)) msgs.push('Rendement : écrivez un nombre en % (virgule ou point).');
    else if (!d.okN) {
      if (isFinite(L) && isFinite(P) && !proche(N, 100 * P / L, 0.05)) msgs.push(`Rendement : avec vos valeurs, η = Pél ÷ Plum × 100 = ${fmt2(100 * P / L)} %. Refaites ce calcul.`);
      else if (proche(N, d.eta / 100, 0.12)) msgs.push('Rendement : vous avez donné une fraction ; multipliez par 100 pour obtenir un pourcentage.');
      else if (proche(N, 100 / d.eta, 0.12) || proche(N, 100 * d.Plum / d.Pmax, 0.12)) msgs.push('Rendement : le rapport est inversé. η = Pél (utile) ÷ Plum (reçue).');
      else msgs.push(`Rendement : votre calcul est cohérent avec vos valeurs, mais elles s’écartent des bonnes : vérifiez Plum et cherchez le vrai maximum de Pél. Votre rendement est ${N > d.eta ? 'trop grand' : 'trop petit'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const d = defi, msgs = [], L = lireNombre(d.reps.L), S = lireNombre(d.reps.S);
    if (!isFinite(L)) msgs.push('Plum : écrivez un nombre (virgule ou point).');
    else if (!d.okL) {
      if (proche(L, d.Pel * d.etaPct / 100, 0.05)) msgs.push('Plum : vous avez multiplié Pél par η. Pour retrouver la lumière reçue, divisez Pél par η.');
      else if (proche(L, d.Pel / d.etaPct, 0.05)) msgs.push(`Plum : le rendement doit être en nombre décimal : ${d.etaPct} % = ${nbf(d.etaPct / 100, 2)}.`);
      else msgs.push(`Plum : Plum = Pél ÷ η = ${nbf(d.Pel, 1)} ÷ ${nbf(d.etaPct / 100, 2)}. Votre valeur est ${L > d.Plum ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(S)) msgs.push('Surface : écrivez un nombre (virgule ou point).');
    else if (!d.okS) {
      if (proche(S, d.S / 1e4, 0.05)) msgs.push('Surface : cette valeur est en m². Pour des cm², multipliez par 10 000.');
      else if (isFinite(L) && proche(S, L / d.E * 1e4, 0.05)) msgs.push(`Surface : votre calcul est cohérent avec votre Plum, mais votre Plum n’est pas la bonne : reprenez Plum = Pél ÷ η.`);
      else if (proche(S, d.Plum * d.E, 0.05)) msgs.push('Surface : il faut diviser Plum par E, pas les multiplier.');
      else msgs.push(`Surface : S = Plum ÷ E (en m²), puis × 10 000 pour des cm². Votre valeur est ${S > d.S ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'eta'
    ? `Plum = E × S = ${defi.E} × ${nbf(defi.S / 1e4, 5)} = ${fmt2(defi.Plum)} W (S = ${nbf(defi.S, 1)} cm² = ${nbf(defi.S / 1e4, 5)} m²). La puissance électrique maximale est Pél ≈ ${fmt2(defi.Pmax)} W, pour R voisine de ${nbf(defi.Rpm, 0)} Ω. Rendement η = Pél ÷ Plum = ${fmt2(defi.Pmax)} ÷ ${fmt2(defi.Plum)} ≈ ${fmt2(defi.eta)} %. Un écart vient souvent de la surface laissée en cm², d’un courant laissé en mA ou d’une résistance trop éloignée du coude.`
    : `Plum = Pél ÷ η = ${nbf(defi.Pel, 1)} ÷ ${nbf(defi.etaPct / 100, 2)} = ${fmt2(defi.Plum)} W ; S = Plum ÷ E = ${fmt2(defi.Plum)} ÷ ${defi.E} = ${nbf(defi.Plum / defi.E, 4)} m², soit ${fmt2(defi.S)} cm². On divise par le rendement (inférieur à 1, donc la lumière à recevoir est plus grande que l’électricité voulue), puis par l’éclairement.`;
  const verdictValide = defi?.verifie && (defi.type !== 'eta' || defi.sig === defi.rows.length);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['eta', 'Rendement d’un panneau'], ['dimension', 'Dimensionner']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'eta' ? 'Défi : rendement d’un panneau inconnu' : 'Défi : dimensionner une installation'}</div>
      {defi.type === 'eta' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un panneau photovoltaïque <strong>inconnu</strong>, de surface <strong>S = {nbf(defi.S, defi.S % 1 ? 2 : 0)} cm²</strong>, est éclairé avec <strong>E = {defi.E} W/m²</strong> (température et éclairement constants). Calculez la puissance lumineuse reçue <strong>Plum</strong>. Puis changez la résistance R pour relever des mesures et cherchez la plus grande puissance électrique <strong>Pél</strong>. Enfin, calculez le <strong>rendement</strong> η (en %). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ ...styleBoite, marginBottom: 8 }}>
          <SceneCircuit E={defi.E} instr U={q.U} I={q.I} R={r} ajustable/>
          <label htmlFor="pr-dr" style={{ ...libelle, marginTop: 8 }}>Résistance R</label>
          <SelectR id="pr-dr" valeur={r} onChange={choisirRDefi}/>
        </div>
        <div style={{ ...styleBoite, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>Tableau de mesures</div>
            <button onClick={() => setDefi(d => ({ ...d, rows: [ligneMesure(d.p, d.E, d.R)], verifie: false }))} style={stylePetitBouton(false)}>Vider</button>
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5, textAlign: 'right' }}>
            <thead><tr style={{ color: KIT.txt2 }}><th style={{ textAlign: 'left', padding: '2px 4px' }}>R</th><th style={{ padding: '2px 4px' }}>U (V)</th><th style={{ padding: '2px 4px' }}>I (mA)</th></tr></thead>
            <tbody>{[...defi.rows].sort((a, b) => a.R - b.R).map(l => <tr key={String(l.R)} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ textAlign: 'left', padding: '2px 4px' }}>{libR(l.R)}</td><td style={{ padding: '2px 4px' }}>{nbf(l.U, l.U >= 10 ? 1 : 2)}</td><td style={{ padding: '2px 4px' }}>{fmtV(l.I)}</td></tr>)}</tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Plum (W) =</span>{champ('L', 'Puissance lumineuse reçue en watts', verdictValide && defi.okL)}
          <span>Pél max (W) =</span>{champ('P', 'Puissance électrique maximale en watts', verdictValide && defi.okP)}
          <span>η (%) =</span>{champ('N', 'Rendement en pourcentage', verdictValide && defi.okN)}
        </div>
        <IndiceDefi cache={false}>Plum = E × S, avec S en m² (1 cm² = 0,0001 m²). Pél = U × I, avec I en ampères : cherchez le maximum en essayant des valeurs de R proches du « coude ». Rendement : η = Pél ÷ Plum, puis × 100 pour des %.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On veut alimenter un appareil qui demande une puissance électrique <strong>Pél = {nbf(defi.Pel, 1)} W</strong>, avec un panneau de rendement <strong>η = {defi.etaPct} %</strong>, éclairé avec <strong>E = {defi.E} W/m²</strong>. Trouvez la puissance lumineuse <strong>Plum</strong> à recevoir, puis la <strong>surface S</strong> du panneau en cm². Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Plum (W) =</span>{champ('L', 'Puissance lumineuse nécessaire en watts', verdictValide && defi.okL)}
          <span>S (cm²) =</span>{champ('S', 'Surface du panneau en centimètres carrés', verdictValide && defi.okS)}
        </div>
        <IndiceDefi cache={false}>η = Pél ÷ Plum, donc Plum = Pél ÷ η (η en nombre décimal : 15 % = 0,15). Puis Plum = E × S donne S = Plum ÷ E, en m² ; 1 m² = 10 000 cm².</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pr-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {verdictValide && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'eta' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(d => ({ ...d, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Rendement de conversion du panneau seul</strong> : Pél (fournie à la résistance) ÷ Plum (lumière reçue). Il ne tient pas compte d’une batterie, d’un convertisseur ni des câbles.</li>
      <li><strong>Plum = E × S</strong> : l’éclairement est uniforme et toute la surface du panneau est éclairée, perpendiculairement à la lumière ; la lumière a un spectre proche de celui du Soleil.</li>
      <li><strong>Température constante de 25 °C</strong> : en réalité, un panneau chauffé perd en tension, donc en puissance et en rendement.</li>
      <li><strong>Modèle simplifié à une diode</strong> (voir la simulation sur la caractéristique) : le rendement maximal obtenu va de 13 à 16 % selon l’éclairement, ordre de grandeur d’un panneau au silicium courant (15 à 25 %). Les trois panneaux ont la même technologie : leur rendement est le même, seule la surface change.</li>
      <li><strong>Les paramètres sont inventés pour la simulation</strong> ; les instruments sont supposés parfaits et affichent 3 chiffres significatifs.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, graphiques, mesures ----------
  const instrVisibles = enExplore || (enGuide && deja('pel'));
  const rReglable = enExplore || (enGuide && deja('meilleur'));
  const eReglable = enExplore || (enGuide && deja('eclair'));
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Panneau photovoltaïque éclairé</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le voltmètre mesure la tension U aux bornes du panneau, l’ampèremètre l’intensité I du courant qui traverse la résistance R.</div>}
      <SceneCircuit E={E} instr={instrVisibles} U={q.U} I={q.I} R={r} ajustable={rReglable}/>
      {enGuide && rReglable && <div style={{ marginTop: 8 }}>
        <label htmlFor="pr-r" style={libelle}>Résistance R</label>
        <SelectR id="pr-r" valeur={gR} onChange={choisirR}/>
        {eReglable && <div style={{ marginTop: 8 }}><Curseur nom="Éclairement E" valeur={gE} onChange={setGE} min={100} max={1000} pas={100} unite="W/m²" couleur="#b45309"/></div>}
      </div>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <label htmlFor="pr-pan" style={libelle}>Panneau</label>
      <select id="pr-pan" value={ti.pan} onChange={ev => setTi(s => ({ ...s, pan: ev.target.value }))} style={{ ...selectStyle, marginBottom: 8 }}>
        {R.IDS_PANNEAUX.map(id => <option key={id} value={id}>{R.PANNEAUX[id].nom}</option>)}
      </select>
      <Curseur nom="Éclairement E" valeur={ti.E} onChange={v => setTi(s => ({ ...s, E: v }))} min={100} max={1000} pas={100} unite="W/m²" couleur="#b45309"/>
      <label htmlFor="pr-rr" style={libelle}>Résistance R</label>
      <div style={{ marginBottom: 8 }}><SelectR id="pr-rr" valeur={ti.R} onChange={v => setTi(s => ({ ...s, R: v }))}/></div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Cherchez la résistance qui donne le meilleur rendement. Le point noir du graphique est le point de fonctionnement.</div>
    </div>);

  const afficherBarre = enExplore || (enGuide && deja('pertes'));
  const barre = afficherBarre && (
    <div style={{ ...styleBoite, ...cadre('barre') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Bilan énergétique</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>La barre entière est la lumière reçue ; la partie verte est la part convertie en électricité.</div>}
      <BarreBilan plum={plumE} pel={q.P}/>
    </div>);
  const ptsMesures = enGuide && E === PA.E ? [...new Set([...gPts, gR])].map(v => R.point(p, E, v)) : [];
  const courbesP = E !== PA.E && enGuide ? [{ E: PA.E, coul: '#94a3b8', tirets: true }, { E, coul: '#b45309' }] : [{ E }];
  const graphP = (enExplore || (enGuide && deja('meilleur'))) && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Puissance électrique fournie selon la tension</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Le sommet de la courbe est la puissance maximale : c’est là que le rendement est le plus grand.</div>}
      <GrapheP p={p} courbes={courbesP} pts={ptsMesures.map(z => ({ U: z.U, y: z.P }))} courant={{ U: q.U, y: q.P }}/>
    </div>);
  const montrerMesures = enExplore || (enGuide && deja('pel'));
  const mesures = montrerMesures && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Valeurs lues pour la résistance choisie, puis bilan énergétique du panneau.</div>}
      <LigneMesure nom="Éclairement E" valeur={`${E}${NB}W/m²`}/>
      <LigneMesure nom="Surface S" valeur={`${nbf(R.surfaceCm2(p), 1)}${NB}cm²`}/>
      <LigneMesure nom="Lumière reçue Plum = E × S" valeur={`${nbf(plumE, 2)}${NB}W`} couleur={COL.orange}/>
      <LigneMesure nom="Résistance R" valeur={libR(r)}/>
      <LigneMesure nom="Tension U" valeur={`${affInstrument(q.U)}${NB}V`} couleur={COL.bleu}/>
      <LigneMesure nom="Intensité I" valeur={`${affInstrument(1000 * q.I)}${NB}mA`} couleur={COL.bleu}/>
      <LigneMesure nom="Électricité Pél = U × I" valeur={`${affInstrument(q.P)}${NB}W`} couleur={COL.vert}/>
      {(enExplore || (enGuide && deja('pertes'))) && <LigneMesure nom="Rendement η = Pél ÷ Plum" valeur={`${nbf(100 * q.P / plumE, 1)}${NB}%`} couleur={COL.vert}/>}
      {(enExplore || (enGuide && deja('meilleur'))) && <LigneMesure nom="Pertes = Plum − Pél" valeur={`${nbf(plumE - q.P, 2)}${NB}W`} couleur={COL.gris}/>}
      {enExplore && <>
        <div style={{ height: 6 }}/>
        <LigneMesure nom="Puissance maximale Pmax" valeur={`${affInstrument(pm.P)}${NB}W (U = ${affInstrument(pm.U)}${NB}V)`}/>
        <LigneMesure nom="Rendement maximal" valeur={`${nbf(100 * pm.P / plumE, 1)}${NB}%`} couleur={COL.vert}/>
      </>}
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Cherchez la résistance qui donne le plus grand rendement. Est-ce la même que celle qui donne la plus grande puissance ?</li>
      <li>Comparez les trois panneaux au même éclairement : quelle grandeur change (Plum, Pél), laquelle ne change pas (η) ?</li>
      <li>Divisez l’éclairement par deux : comparez Plum, Pél maximale et rendement maximal.</li>
      <li>Avec le grand panneau, quelle surface faudrait-il pour fournir 5 W sous 800 W/m² ? Vérifiez avec la formule S = Pél ÷ (η × E).</li>
      <li>Quelle partie de la lumière reçue est perdue au meilleur point ? Quels facteurs l’expliquent ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Puissance lumineuse reçue : Plum = E × S (S en m²) ; puissance électrique : Pél = U × I</li>
        <li>Rendement : η = Pél ÷ Plum (en %) ; pertes = Plum − Pél</li>
        <li>Le rendement est maximal au point de puissance maximale et varie peu avec l’éclairement</li>
        <li>Facteurs limitants : lumière réfléchie, photons peu énergétiques, excès d’énergie en chaleur, pertes dans la cellule, charge mal adaptée</li>
        <li>Dimensionner : S = Pél ÷ (η × E)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pr-col { display: flex; flex-direction: column; gap: 12px; }
        .pr-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .pr-l1.cote .pr-carte { order: 2; } .pr-l1.cote .pr-main { order: 1; }
          .pr-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .pr-ex > * { grid-column: 1; }
          .pr-ex > .pr-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .pr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pr-in { animation: pr-fondu 0.35s ease-out; } @keyframes pr-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Rendement d’un panneau photovoltaïque</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un panneau convertit en électricité une <strong>partie seulement</strong> de la lumière qu’il reçoit. On fait le <strong>bilan énergétique</strong>, on calcule le <strong>rendement</strong> et on cherche les <strong>facteurs qui le limitent</strong>.</div>
      {!enExplore && <div className={`pr-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="pr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="pr-carte">{panneauHypo}</div>}
        <div className="pr-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'eta' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="pr-col">
            <div className="pr-in">{scene}</div>
            {mesures && <div className="pr-in">{mesures}</div>}
            {barre && <div className="pr-in">{barre}</div>}
            {graphP && <div className="pr-in">{graphP}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <>
        <PanneauRendementExplore ti={ti} setTi={setTi}/>
        <div style={{ margin: '12px 0' }}>
          <Section titre={`Réglages précis et mesures : ${R.PANNEAUX[ti.pan].nom.replace(/ \(.*\)/, '')} · E = ${ti.E} W/m² · R = ${isFinite(ti.R) ? `${ti.R} Ω` : 'circuit ouvert'}`} ouvert={!!ouv.precis} onBascule={() => bascule('precis')}>
            <div className="pr-ex">
              {scene}
              <div className="pr-reg">{reglages}</div>
              {mesures}
              {barre}
            </div>
          </Section>
        </div>
        <Section titre="Puissance électrique selon la tension" ouvert={!!ouv.graphe} onBascule={() => bascule('graphe')}>{graphP}</Section>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('bilan'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
