import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./satellitesModele";
import { QCM_PARCOURS as Q } from "./satellitesQcm";
import { SceneOrbite, SceneEllipse, GrapheKepler, SvgCarteForce, SvgCarteUniforme, SvgCarteMasse, SvgCarteTroisieme, SvgCarteGeo, SvgCarteAires } from "./satellitesSchemas";

const SIM_ID = 177, CLE_GUIDE = 'kep-tg-guide-v1';
declarerDefis(SIM_ID, [['kep3', 'Retrouver la période, le rayon ou la masse de l’astre'], ['stat', 'Orbite stationnaire autour d’une autre planète']]);

// ====================================================
// SIM 177 — SATELLITES ET LOIS DE KEPLER (TG spé PC, « Mouvement et interactions », « Mouvement dans un champ de gravitation »).
//  Une seule idée : le mouvement circulaire d'un satellite (ou d'une planète) dans le champ de gravitation d'un astre, sa vitesse, sa période, les lois de Kepler.
//  Capacités visées (jamais affichées à l'élève) : déterminer les caractéristiques des vecteurs vitesse et accélération du centre de masse d'un système en mouvement
//  circulaire dans un champ de gravitation newtonien ; établir et exploiter la troisième loi de Kepler dans le cas circulaire ; satellite géostationnaire ;
//  tester (par données ou numériquement) les deuxième et troisième lois de Kepler.
//  Hors périmètre : énergie des satellites, vitesse de libération, trajectoires elliptiques démontrées. Modèle de calcul : satellitesModele.js (SI).
//  Recouvrement avec EscapeKepler.jsx (sim 79, « Mission Kepler ») : aucun — c'est un escape game (défis d'autres simulations), sans physique des orbites.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const BLEU = '#0369a1', VERT = '#15803d';
const IDS = ['force', 'accel', 'accelNum', 'uniforme', 'vitesse', 'periode', 'kepler3', 'donnees', 'masse', 'geoCond', 'geoAlt', 'aires', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
const T = M.ASTRES.terre, R800 = T.R + 800e3;
const A800 = M.acceleration(T.M, R800), V800 = M.vitesse(T.M, R800), T800 = M.periode(T.M, R800);
const GEO = M.orbiteStationnaire(T);
const THETA0 = 1.05;                                              // position de départ du satellite (rad)
const E_ELL = 0.6, D_SECT = 1 / 12;                               // orbite elliptique du parcours : excentricité, durée des secteurs (fraction de période)
const SEC_GUIDE = [{ f1: 0, f2: D_SECT }, { f1: 0.5 - D_SECT / 2, f2: 0.5 + D_SECT / 2 }];
const AIRE_GUIDE = [M.aireBalayee(E_ELL, 0, D_SECT), M.aireBalayee(E_ELL, 0.5 - D_SECT / 2, 0.5 + D_SECT / 2)];
const RATIO_J = M.LUNES_JUPITER.map(d => M.rapportKepler(d.T * M.JOUR, d.a * 1e3));
const RATIO_MOY = 3.11e-16;                                        // valeur affichée à l'étape « masse » (3 chiffres significatifs)
const M_JUP = 4 * Math.PI * Math.PI / (M.G * RATIO_MOY);

// ---------- formules (MathML) ----------
const sq = x => <msup>{x}<mn>2</mn></msup>;
const cu = x => <msup>{x}<mn>3</mn></msup>;
const mi = s => <mi>{s}</mi>, mn = s => <mn>{s}</mn>, mo = s => <mo>{s}</mo>;
const GM = <mrow>{mi('G')}{mi('M')}</mrow>;
const fr = (a, b) => <mfrac>{a}{b}</mfrac>;
const FForce = <Formule>{mi('F')}{mo('=')}{fr(<mrow>{mi('G')}{mo('×')}{mi('m')}{mo('×')}{mi('M')}</mrow>, sq(mi('r')))}</Formule>;
const aNorme = <FormuleEnLigne>{mi('a')}{mo('=')}{fr(GM, sq(mi('r')))}</FormuleEnLigne>;
const FFrenet = <Formule><mover><mi>a</mi><mo>→</mo></mover>{mo('=')}{fr(<mrow>{mi('d')}{mi('v')}</mrow>, <mrow>{mi('d')}{mi('t')}</mrow>)}<mover><msub><mi>u</mi><mi>t</mi></msub><mo>→</mo></mover>{mo('+')}{fr(sq(mi('v')), mi('r'))}<mover><msub><mi>u</mi><mi>n</mi></msub><mo>→</mo></mover></Formule>;
const vRacine = <FormuleEnLigne>{mi('v')}{mo('=')}<msqrt>{fr(GM, mi('r'))}</msqrt></FormuleEnLigne>;
const FPeriode = <Formule>{mi('T')}{mo('=')}{fr(<mrow>{mn('2')}{mi('π')}{mi('r')}</mrow>, mi('v'))}</Formule>;
const FT2 = <Formule>{sq(mi('T'))}{mo('=')}{fr(<mrow>{mn('4')}{sq(mi('π'))}{sq(mi('r'))}</mrow>, sq(mi('v')))}</Formule>;
const FKepler = <FormuleEnLigne>{fr(sq(mi('T')), cu(mi('r')))}{mo('=')}{fr(<mrow>{mn('4')}{sq(mi('π'))}</mrow>, GM)}</FormuleEnLigne>;
const FKeplerBloc = <Formule>{fr(sq(mi('T')), cu(mi('r')))}{mo('=')}{fr(<mrow>{mn('4')}{sq(mi('π'))}</mrow>, GM)}</Formule>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// ---------- commande du temps : curseur (fraction de période) + boutons − / + + Lancer ----------
function ControleTemps({ valeur, onChange, texte, joue, lancer, reduit, nom = 'Position sur l’orbite' }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt }}>{avecIndices(texte)}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label="Reculer un peu" onClick={() => onChange(((valeur - 0.02) % 1 + 1) % 1)} style={btn}>−</button>
        <input type="range" min={0} max={1} step={0.005} value={valeur} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label="Avancer un peu" onClick={() => onChange((valeur + 0.02) % 1)} style={btn}>+</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={lancer} style={stylePetitBouton(true, VERT)}>{reduit ? 'Avancer d’un cran' : joue ? 'Pause' : 'Lancer le mouvement'}</button>
        <button onClick={() => onChange(0)} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir</button>
      </div>
    </div>);
}

// ---------- tableau des données (lunes de Jupiter) ----------
function TableauLunes({ ratio }) {
  const th = { textAlign: 'right', padding: '4px 6px', fontSize: 13.5, borderBottom: `1.5px solid ${KIT.bord}`, fontWeight: 700 }, td = { textAlign: 'right', padding: '4px 6px', fontSize: 14 };
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', color: KIT.txt }} aria-label="Données sur quatre satellites naturels de Jupiter">
      <thead><tr><th style={{ ...th, textAlign: 'left' }}>Satellite</th><th style={th}>a (10³{NB}km)</th><th style={th}>T (jours)</th>{ratio && <th style={th}>{avecIndices('frac(T²|a³) (10⁻¹⁶ s²/m³)')}</th>}</tr></thead>
      <tbody>{M.LUNES_JUPITER.map((d, k) => <tr key={d.nom}><td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>{d.nom}</td><td style={td}>{nbf(d.a / 1e3, 1)}</td><td style={td}>{nbf(d.T, 3)}</td>{ratio && <td style={td}>{nbf(RATIO_J[k] / 1e-16, 2)}</td>}</tr>)}</tbody>
    </table>);
}
const pointsJupiter = M.LUNES_JUPITER.map(d => ({ x: Math.pow(d.a * 1e3, 3), y: Math.pow(d.T * M.JOUR, 2), nom: d.nom }));

export function SimulationSatellites() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviK, noterK] = useCompteurDefi(), [suiviS, noterS] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('kep3');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ orbite: false, vecteurs: false, graphe: false, secteurs: false, essayer: false, retenir: false });
  const [fG, setFG] = useState(0.0);                                                                    // parcours : position sur l'orbite (fraction de période)
  const [ex, setEx] = useState({ vue: 'circ', astre: 'terre', orbite: 'h800', f: 0, e: 0.6, dur: 12, s1: 0, s2: 0.46, vV: true, vA: true, vU: false, droite: false });
  const [joue, setJoue] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= I[id];

  // ---------- lecture animée ----------
  const tickRef = useRef(null);
  useEffect(() => {
    tickRef.current = dt => { if (enExplore) setEx(s => ({ ...s, f: (s.f + dt / 14) % 1 })); else setFG(f => (f + dt / 14) % 1); };
  });
  useEffect(() => {
    if (!joue) return undefined;
    let raf, t0 = null;
    const boucle = tt => { if (t0 !== null) tickRef.current(Math.min(0.05, (tt - t0) / 1000)); t0 = tt; raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [joue]);
  const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lancer = () => { if (reduit) { if (enExplore) setEx(s => ({ ...s, f: (s.f + 0.1) % 1 })); else setFG(f => (f + 0.1) % 1); return; } setJoue(j => !j); };
  const changerMode = md => { setJoue(false); setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'force', titre: 'La force exercée par la Terre', focus: ['scene'],
      texte: <>Un satellite de masse m = 1,0{NB}×{NB}10³{NB}kg décrit une orbite circulaire autour de la Terre. On l’étudie dans le <strong>référentiel géocentrique</strong>, supposé galiléen, et on ne tient compte que de l’attraction gravitationnelle exercée par la Terre : c’est la seule force qui s’exerce sur lui.</>,
      tache: { type: 'qcm', q: 'Quelles sont la direction et le sens de la force vec(F) exercée par la Terre sur le satellite ?', options: Q.force.options, bonne: 0,
        expl: 'La gravitation est une force attractive dirigée selon la droite qui joint les centres des deux corps : vec(F) pointe vers le centre de la Terre. Elle n’est pas tangente à la trajectoire (la vitesse n’est pas une force), ni dirigée vers l’extérieur (la gravitation attire), ni perpendiculaire au plan de l’orbite.',
        indice: 'Deux corps s’attirent : la force passe par leurs deux centres. Est-elle dirigée vers la Terre ou à l’opposé ?' } },
    { id: 'accel', titre: 'Le vecteur accélération : deuxième loi de Newton', focus: ['scene'],
      texte: <>La norme de la force vaut :{FForce}où G est la constante de gravitation, M la masse de la Terre et r la distance entre les centres de la Terre et du satellite. Dans le référentiel géocentrique, la deuxième loi de Newton s’écrit m × vec(a) = vec(F).</>,
      tache: { type: 'qcm', q: 'Que peut-on dire du vecteur accélération vec(a) du satellite ?', options: Q.accel.options, bonne: 0,
        expl: <>En divisant m × vec(a) = vec(F) par m, la masse se simplifie : vec(a) a la direction et le sens de vec(F), vers le centre de la Terre, et sa norme vaut {aNorme}, sans dépendre de m. Deux satellites de masses différentes sur la même orbite ont donc la même accélération. Elle n’est pas tangente à la trajectoire, et elle n’est pas nulle : une force non nulle donne une accélération non nulle.</>,
        indice: 'Écrivez m × vec(a) = vec(F), puis divisez les deux membres par m : que devient la masse m ?' } },
    { id: 'accelNum', titre: 'Calculer la norme de l’accélération',  focus: ['scene'],
      retenirTitre: 'La gravitation : force et accélération',
      retenir: <>
        <SvgCarteForce/>
        <ul style={ULS}>
          <li>Force de gravitation : <strong><FormuleEnLigne>{mi('F')}{mo('=')}{fr(<mrow>{mi('G')}{mi('m')}{mi('M')}</mrow>, sq(mi('r')))}</FormuleEnLigne></strong>, dirigée vers le centre de l’astre (r : distance entre les centres).</li>
          <li>Deuxième loi de Newton : m × vec(a) = vec(F), donc <strong>vec(a)</strong> est dirigé vers le centre, de norme {aNorme}.</li>
          <li>Moyen de s’en souvenir : <strong>« la masse du satellite se simplifie »</strong>. Idée fausse : « un satellite lourd accélère plus ». Vrai : à la même distance, même accélération.</li>
        </ul></>,
      texte: <>Le satellite est à 800{NB}km d’altitude. Données : constante de gravitation G = 6,67{NB}×{NB}10⁻¹¹{NB}N·m²·kg⁻² ; masse de la Terre M = 5,97{NB}×{NB}10²⁴{NB}kg ; rayon de la Terre R_T = 6,37{NB}×{NB}10³{NB}km. La distance r se mesure depuis le <strong>centre</strong> de la Terre.</>,
      tache: { type: 'num', q: 'Calculez la norme a de l’accélération du satellite, en m/s² (2 chiffres significatifs)', unite: 'm/s²', vrai: A800, tol: 0.05, affiche: v => nbf(v, 2), cs: 2, carnet: 'Accélération du satellite à 800 km',
        calcul: () => ['r = R_T + h = 6,37×10³ km + 800 km = 7,17×10³ km = 7,17×10⁶ m (en mètres, pour garder des unités SI).', 'a = frac(G M|r²) = frac(6,67×10⁻¹¹ × 5,97×10²⁴|(7,17×10⁶)²) = 7,75 m/s².', 'La masse m du satellite n’intervient pas.'],
        pieges: [[M.acceleration(T.M, 800e3), 'Vous avez utilisé l’altitude h à la place de la distance r : r = R_T + h, mesurée depuis le centre de la Terre.'], [M.acceleration(T.M, 7170), 'r doit être en mètres : 7,17×10⁶ m (et non 7,17×10³ km).'], [M.acceleration(T.M, T.R), 'Vous avez utilisé le rayon de la Terre : la distance à prendre va du centre de la Terre jusqu’au satellite, soit r = R_T + h.'], [M.G * T.M / R800, 'Dans a = frac(G M|r²), la distance r est élevée au carré : n’oubliez pas le carré.'], [A800 * 1000, 'Vous avez calculé la force F = m × a, en newtons, avec m = 1,0×10³ kg : on demande l’accélération, c’est-à-dire F divisée par m.']],
        expl: 'a = frac(G M|r²) = frac(6,67×10⁻¹¹ × 5,97×10²⁴|(7,17×10⁶ m)²) = 7,75 m/s², dirigée vers le centre de la Terre.',
        indice: 'a = frac(G M|r²), avec r = R_T + h exprimée en mètres (1 km = 1 000 m).' } },
    { id: 'uniforme', titre: 'Un mouvement circulaire uniforme ?', focus: ['scene', 'curseurs'],
      texte: <>La simulation montre maintenant vec(a), dirigé vers le centre de la Terre, avec le repère de Frenet (vec(u)_t ; vec(u)_n) : vec(u)_t est tangent à la trajectoire dans le sens du mouvement, vec(u)_n est dirigé vers le centre. Dans ce repère :{FFrenet}Faites tourner le satellite et observez que ces vecteurs suivent le point.</>,
      tache: { type: 'qcm', q: 'Que valent a_t = frac(dv|dt), la coordonnée de vec(a) sur vec(u)_t, et quelle conséquence pour la valeur v de la vitesse ?', options: Q.uniforme.options, bonne: 0,
        expl: 'vec(a) est dirigé vers le centre : il est porté par vec(u)_n, donc sa coordonnée sur vec(u)_t est nulle : a_t = frac(dv|dt) = 0. La valeur v de la vitesse est constante : le mouvement est circulaire uniforme (la direction de vec(v) change, pas sa norme). Le satellite n’est pas immobile : il parcourt son orbite à la vitesse v.',
        indice: 'Comparez vec(a) aux deux vecteurs du repère : sur lequel est-il porté ? Une coordonnée nulle sur vec(u)_t veut dire que frac(dv|dt) est nulle.' } },
    { id: 'vitesse', titre: 'La valeur de la vitesse', focus: ['scene', 'mesures'],
      retenirTitre: 'Le mouvement circulaire uniforme',
      retenir: <>
        <SvgCarteUniforme/>
        <ul style={ULS}>
          <li>Seule force : la gravitation, vers le centre ⇒ vec(a) est <strong>centripète</strong> : a_t = 0 et a_n = frac(v²|r).</li>
          <li>a_t = frac(dv|dt) = 0 : la valeur v de la vitesse est <strong>constante</strong> ; vec(v) change de direction, pas de norme.</li>
          <li>Moyen de s’en souvenir : <strong>« accélérer, ce n’est pas forcément aller plus vite »</strong>. Idée fausse : « vitesse constante, donc accélération nulle ». Vrai : la direction de vec(v) change, donc vec(a) n’est pas nul.</li>
        </ul></>,
      texte: <>Dans le repère de Frenet, la coordonnée normale de vec(a) est a_n = frac(v²|r). Ici, vec(a) est entièrement normal : sa norme est donc a_n = frac(v²|r), qui est égale à la norme a = frac(G M|r²) trouvée à l’étape précédente. La distance au centre de la Terre est r = 7,17{NB}×{NB}10⁶{NB}m et a = 7,75{NB}m/s².</>,
      tache: { type: 'num', q: 'Calculez la valeur v de la vitesse du satellite, en km/s (2 chiffres significatifs)', unite: 'km/s', vrai: V800 / 1000, tol: 0.05, affiche: v => nbf(v, 2), cs: 2, carnet: 'Vitesse du satellite à 800 km',
        calcul: () => [<>On égale a_n et a : <FormuleEnLigne>{fr(sq(mi('v')), mi('r'))}{mo('=')}{fr(GM, sq(mi('r')))}</FormuleEnLigne>, donc <FormuleEnLigne>{sq(mi('v'))}{mo('=')}{fr(GM, mi('r'))}</FormuleEnLigne>.</>, <>{vRacine} = <FormuleEnLigne><msqrt>{fr(<mrow>{mn('6,67×10⁻¹¹')}{mo('×')}{mn('5,97×10²⁴')}</mrow>, mn('7,17×10⁶'))}</msqrt></FormuleEnLigne> = 7,45×10³ m/s = 7,45 km/s.</>, 'La vitesse ne dépend pas de la masse m du satellite.'],
        pieges: [[M.G * T.M / R800 / 1000, 'Vous avez oublié la racine carrée : v² = frac(G M|r), donc v est la racine carrée de ce résultat.'], [M.G * T.M / R800 / 1e6, 'Vous avez oublié la racine carrée (et converti en km/s) : on prend la racine carrée de frac(G M|r).'], [M.vitesse(T.M, T.R) / 1000, 'Vous avez pris le rayon de la Terre : la distance à utiliser est r = 7,17×10⁶ m.'], [Math.sqrt(A800) / 1000, 'Vous avez pris la racine carrée de a : il faut v² = a × r, donc v = racine carrée de (a × r).'], [A800 * R800 / 1000, 'Vous avez calculé a × r = v² : il reste à prendre la racine carrée.']],
        expl: <>{vRacine} = 7,45×10³ m/s = 7,45{NB}km/s, soit environ 27 000{NB}km/h.</>,
        indice: 'v² = a × r (puisque a = frac(v²|r)) ; prenez la racine carrée en m/s puis convertissez en km/s.' } },
    { id: 'periode', titre: 'La période de révolution', focus: ['scene', 'mesures'],
      texte: <>Le satellite parcourt un tour de l’orbite, de longueur 2πr, à la vitesse v = 7,45{NB}km/s, avec r = 7,17{NB}×{NB}10⁶{NB}m. La <strong>période de révolution</strong> T est la durée d’un tour. La flèche verte du schéma est maintenant vec(v), tangent à l’orbite.{FPeriode}</>,
      tache: { type: 'num', q: 'Calculez la période de révolution T du satellite, en minutes (2 chiffres significatifs)', unite: 'min', vrai: T800 / 60, tol: 0.05, affiche: v => nbf(v, 0), cs: 2, carnet: 'Période du satellite à 800 km',
        calcul: () => ['2π r = 2π × 7,17×10⁶ m = 4,51×10⁷ m.', 'T = frac(2π r|v) = frac(4,51×10⁷ m|7,45×10³ m/s) = 6,05×10³ s.', '6,05×10³ s = frac(6,05×10³|60) min = 101 min, soit 1 h 41 min.'],
        pieges: [[T800, 'Vous avez donné T en secondes : on demande des minutes (1 min = 60 s).'], [T800 / 3600, 'Vous avez donné T en heures : on demande des minutes.'], [R800 / V800 / 60, 'Vous avez oublié le facteur 2π : la longueur d’un tour est la circonférence 2π r.'], [2 * Math.PI * R800 / (V800 * 60) * 2 * Math.PI, 'La longueur du tour est 2π r : le facteur 2π ne figure qu’une seule fois.']],
        expl: 'T = frac(2π r|v) = frac(2π × 7,17×10⁶ m|7,45×10³ m/s) = 6,05×10³ s = 101 min : le satellite fait environ 14 tours par jour.',
        indice: 'T = frac(2π r|v), avec r en mètres et v en m/s : le résultat est en secondes ; divisez par 60 pour avoir des minutes.' } },
    { id: 'kepler3', titre: 'La troisième loi de Kepler', focus: ['scene'],
      retenirTitre: 'Vitesse et période ne dépendent pas de m',
      retenir: <>
        <SvgCarteMasse/>
        <ul style={ULS}>
          <li>Vitesse : {vRacine} ; période : <FormuleEnLigne>{mi('T')}{mo('=')}{fr(<mrow>{mn('2')}{mi('π')}{mi('r')}</mrow>, mi('v'))}</FormuleEnLigne>.</li>
          <li>Exemple : à 800{NB}km d’altitude, v = 7,45{NB}km/s et T = 101{NB}min, pour un satellite de 1{NB}t comme de 5{NB}t.</li>
          <li>Moyen de s’en souvenir : <strong>« v et T ne dépendent que de l’astre et de r »</strong>. Idée fausse : « un satellite plus lourd tourne plus vite ». Vrai : même orbite, même vitesse.</li>
        </ul></>,
      texte: <>Vous connaissez maintenant v² = frac(G M|r) et T = frac(2π r|v). En éliminant v entre ces deux relations, que peut-on dire de T et de r pour tous les satellites d’un même astre ?</>,
      tache: { type: 'qcm', q: 'Quelle relation est vérifiée par tous les satellites en orbite circulaire autour du même astre ?', options: Q.kepler3.options, bonne: 0,
        expl: <>T² = <FormuleEnLigne>{fr(<mrow>{mn('4')}{sq(mi('π'))}{sq(mi('r'))}</mrow>, sq(mi('v')))}</FormuleEnLigne> = <FormuleEnLigne>{fr(<mrow>{mn('4')}{sq(mi('π'))}{sq(mi('r'))}{mo('×')}{mi('r')}</mrow>, GM)}</FormuleEnLigne>, donc {FKepler} : c’est la troisième loi de Kepler (cas circulaire). Le second membre ne dépend que de la masse M de l’astre. La masse m du satellite ne figure pas dans la relation ; T²/r² et T/r ne sont pas constants : T augmente plus vite que r.</>,
        indice: 'Remplacez v² par frac(G M|r) dans T² = frac(4π² r²|v²), puis regroupez les puissances de r.' } },
    { id: 'donnees', titre: 'Tester la loi avec des données', focus: ['donnees', 'graphe'],
      texte: <>Les données ci-dessous concernent quatre satellites naturels de Jupiter, dont l’orbite est quasi circulaire : a est le rayon de l’orbite, T la période de révolution (valeurs publiées, arrondies). Le graphique représente T² en fonction de a³ pour ces satellites.</>,
      tache: { type: 'num', q: <>Pour Europe, calculez le rapport <FormuleEnLigne>{fr(sq(mi('T')), cu(mi('a')))}</FormuleEnLigne> en unités SI, en 10⁻¹⁶ s²/m³ (2 chiffres significatifs)</>, unite: '× 10⁻¹⁶ s²/m³', vrai: RATIO_J[1] / 1e-16, tol: 0.05, affiche: v => nbf(v, 2), cs: 2, carnet: 'Rapport T²/a³ pour Europe',
        calcul: () => ['a = 671 100 km = 6,711×10⁸ m ; T = 3,551 jours = 3,551 × 86 400 s = 3,068×10⁵ s.', 'frac(T²|a³) = frac((3,068×10⁵)²|(6,711×10⁸)³) = frac(9,413×10¹⁰|3,023×10²⁶) = 3,11×10⁻¹⁶ s²/m³.'],
        pieges: [[RATIO_J[1] / 1e-16 * 1e9, 'Vous avez gardé a en kilomètres : convertissez a en mètres (1 km = 1 000 m) avant de calculer.'], [RATIO_J[1] / 1e-16 / Math.pow(86400, 2), 'Vous avez gardé T en jours : convertissez T en secondes (1 jour = 86 400 s).'], [Math.pow(3.551, 2) / Math.pow(671100, 3) / 1e-16, 'Vous avez gardé T en jours et a en kilomètres : convertissez en secondes et en mètres.'], [(3.551 * 86400) / Math.pow(6.711e8, 3) / 1e-16, 'Il faut le carré de T : on calcule T² divisé par a³.']],
        expl: 'frac(T²|a³) = frac((3,068×10⁵ s)²|(6,711×10⁸ m)³) = 3,11×10⁻¹⁶ s²/m³.',
        indice: 'Convertissez a en mètres et T en secondes (1 jour = 86 400 s), puis calculez T² divisé par a³.' } },
    { id: 'masse', titre: 'Déduire la masse de l’astre central', focus: ['donnees', 'graphe'],
      retenirTitre: 'La troisième loi de Kepler',
      retenir: <>
        <SvgCarteTroisieme/>
        <ul style={ULS}>
          <li>Orbite circulaire autour d’un astre de masse M : {FKepler}</li>
          <li>Tous les satellites d’un même astre donnent la même valeur de <FormuleEnLigne>{fr(sq(mi('T')), cu(mi('r')))}</FormuleEnLigne> : les points (r³ ; T²) sont <strong>alignés sur une droite passant par l’origine</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« T au carré, r au cube »</strong>. Idée fausse : « T est proportionnel à r ». Vrai : T² est proportionnel à r³.</li>
        </ul></>,
      texte: <>Le tableau donne maintenant <FormuleEnLigne>{fr(sq(mi('T')), cu(mi('a')))}</FormuleEnLigne> pour chaque satellite : on trouve la même valeur, 3,11{NB}×{NB}10⁻¹⁶{NB}s²/m³, avec moins de 1{NB}% d’écart. La troisième loi donne alors la masse M de l’astre central :{FKeplerBloc}On prend G = 6,67{NB}×{NB}10⁻¹¹{NB}N·m²·kg⁻². La masse des satellites est négligeable devant celle de l’astre.</>,
      tache: { type: 'num', q: <>Calculez la masse M de Jupiter, en 10²⁷ kg (2 chiffres significatifs)</>, unite: '× 10²⁷ kg', vrai: M_JUP / 1e27, tol: 0.05, affiche: v => nbf(v, 2), cs: 2, carnet: 'Masse de Jupiter',
        calcul: () => [<>On isole M : <FormuleEnLigne>{mi('M')}{mo('=')}{fr(<mrow>{mn('4')}{sq(mi('π'))}</mrow>, <mrow>{mi('G')}{mo('×')}{fr(sq(mi('T')), cu(mi('a')))}</mrow>)}</FormuleEnLigne>.</>, 'M = frac(4π²|6,67×10⁻¹¹ × 3,11×10⁻¹⁶) = frac(39,5|2,07×10⁻²⁶) = 1,90×10²⁷ kg.', 'Le résultat est cohérent avec la valeur usuelle de la masse de Jupiter.'],
        pieges: [[1 / (M.G * RATIO_MOY) / 1e27, 'Vous avez oublié le facteur 4π² : frac(T²|a³) = frac(4π²|G M), donc M = frac(4π²|G) divisé par ce rapport.'], [2 * Math.PI / (M.G * RATIO_MOY) / 1e27, 'Le facteur est 4π² (et non 2π) : T = frac(2π r|v) est élevé au carré.'], [4 * Math.PI * Math.PI * M.G * RATIO_MOY / 1e27, 'Il faut diviser par G et par le rapport frac(T²|a³), pas les multiplier.'], [M_JUP / 1e27 * 1e3, 'Vérifiez la puissance de 10 : la réponse est demandée en 10²⁷ kg.']],
        expl: <>M = <FormuleEnLigne>{fr(<mrow>{mn('4')}{sq(mi('π'))}</mrow>, <mrow>{mi('G')}{mo('×')}{fr(sq(mi('T')), cu(mi('a')))}</mrow>)}</FormuleEnLigne> = 1,90{NB}×{NB}10²⁷{NB}kg, soit environ 318 fois la masse de la Terre.</>,
        indice: 'Isolez M dans frac(T²|a³) = frac(4π²|G M) : M = frac(4π²|G × R) avec R = frac(T²|a³). Attention aux puissances de 10 : 10⁻¹¹ × 10⁻¹⁶ = 10⁻²⁷.' } },
    { id: 'geoCond', titre: 'Un satellite immobile dans le ciel', focus: ['scene'],
      texte: <>Un satellite <strong>géostationnaire</strong> reste en permanence à la verticale d’un même point de la surface de la Terre (télécommunications, météorologie). La Terre tourne sur elle-même d’ouest en est : vue de dessus, au-dessus du pôle nord, c’est le sens inverse des aiguilles d’une montre. Un point de l’équateur est marqué sur le schéma.</>,
      tache: { type: 'qcm', q: 'Quelles conditions son orbite circulaire doit-elle remplir ?', options: Q.geo.options, bonne: 0,
        expl: 'Le point de l’équateur décrit un cercle dans le plan de l’équateur, dans le sens de rotation de la Terre, en un jour sidéral (23 h 56 min 4 s = 86 164 s : durée d’un tour de la Terre par rapport aux étoiles). Pour rester à sa verticale, le satellite doit décrire un cercle de même centre, dans ce plan, dans ce sens et avec cette période. Dans un plan incliné ou polaire, il ne resterait pas au-dessus du même point ; dans le sens opposé ou avec une autre période, il se déplacerait par rapport au sol.',
        indice: 'Pour rester à la verticale d’un point de l’équateur, le satellite doit tourner autour de l’axe de la Terre comme ce point : dans quel plan, dans quel sens, et en combien de temps ?' } },
    { id: 'geoAlt', titre: 'Altitude du satellite géostationnaire', focus: ['scene', 'curseurs'],
      texte: <>La période de révolution du satellite est le jour sidéral : T = 86 164{NB}s. Données : G = 6,67{NB}×{NB}10⁻¹¹{NB}N·m²·kg⁻², M = 5,97{NB}×{NB}10²⁴{NB}kg, R_T = 6,37{NB}×{NB}10³{NB}km. Utilisez la troisième loi de Kepler pour trouver r, puis l’altitude h. Sur le schéma, le satellite reste aligné avec le point de l’équateur : lancez le mouvement.</>,
      tache: { type: 'num', q: 'Calculez l’altitude h du satellite géostationnaire, en km (3 chiffres significatifs)', unite: 'km', vrai: GEO.h / 1e3, tol: 0.05, affiche: v => M.entier(v), cs: 3, carnet: 'Altitude géostationnaire',
        calcul: () => [<>On isole r³ dans {FKepler} : <FormuleEnLigne>{cu(mi('r'))}{mo('=')}{fr(<mrow>{mi('G')}{mi('M')}{sq(mi('T'))}</mrow>, <mrow>{mn('4')}{sq(mi('π'))}</mrow>)}</FormuleEnLigne>.</>, 'r³ = frac(6,67×10⁻¹¹ × 5,97×10²⁴ × (86 164)²|4π²) = 7,49×10²² m³, donc r = 4,22×10⁷ m = 4,22×10⁴ km.', 'h = r − R_T = 4,22×10⁴ km − 6,37×10³ km = 3,58×10⁴ km, soit environ 36 000 km.'],
        pieges: [[GEO.r / 1e3, 'Vous avez donné la distance r au centre de la Terre : l’altitude est r − R_T (il faut retrancher le rayon de la Terre).'], [(GEO.r + T.R) / 1e3, 'Il faut retrancher le rayon de la Terre à r, pas l’ajouter.'], [GEO.h / 1e3 / 1000, 'Vérifiez les unités : l’altitude est demandée en kilomètres.'], [(M.G * T.M * T.Trot * T.Trot / (4 * Math.PI * Math.PI)) / 1e3, 'r³ = frac(G M T²|4π²) : il faut encore prendre la racine cubique pour obtenir r.']],
        expl: 'r = (frac(G M T²|4π²))^(1/3) = 4,22×10⁷ m ; h = r − R_T = 3,58×10⁷ m = 3,58×10⁴ km, soit environ 36 000 km.',
        indice: 'r³ = frac(G M T²|4π²) : r est la racine cubique de ce nombre (en m). L’altitude est h = r − R_T.' } },
    { id: 'aires', titre: 'La loi des aires (deuxième loi de Kepler)', focus: ['scene'],
      retenirTitre: 'Le satellite géostationnaire',
      retenir: <>
        <SvgCarteGeo/>
        <ul style={ULS}>
          <li>Orbite <strong>dans le plan de l’équateur</strong>, <strong>dans le sens de rotation</strong> de la Terre, avec <strong>T = jour sidéral</strong> (86 164 s).</li>
          <li>Troisième loi : r ≈ 4,22×10⁷ m, soit r ≈ 6,6 R_T ; altitude h ≈ 3,6×10⁴ km ; vitesse v ≈ 3,07 km/s.</li>
          <li>Moyen de s’en souvenir : <strong>« 3 conditions : équateur, même sens, un jour sidéral »</strong>. Idée fausse : « il ne bouge pas ». Vrai : il tourne à 3,07 km/s, mais avec la Terre.</li>
        </ul></>,
      texte: <>L’orbite d’un satellite n’est pas toujours un cercle. D’après la première loi de Kepler, c’est en général une ellipse dont l’astre occupe un foyer. Sur l’ellipse du schéma (calculée numériquement à partir de la loi de Newton), le segment qui joint l’astre au satellite balaie l’aire A₁ pendant un douzième de la période à partir du point le plus proche de l’astre, et l’aire A₂ pendant un douzième de période autour du point le plus éloigné.</>,
      tache: { type: 'qcm', q: 'Les deux durées sont égales. Que peut-on dire des aires A₁ et A₂ et de la vitesse du satellite ?', options: Q.aires.options, bonne: 0,
        expl: 'D’après la deuxième loi de Kepler, le segment qui joint l’astre au satellite balaie des aires égales pendant des durées égales : A₁ = A₂. Près de l’astre, le secteur est étroit et son arc plus long : le satellite parcourt une plus grande distance dans la même durée, donc il va plus vite près de l’astre que loin de l’astre. L’aspect plus allongé d’un secteur ne signifie pas une aire plus grande, et la vitesse n’est pas constante sur une orbite elliptique.',
        indice: 'Que dit la loi des aires des surfaces balayées pendant des durées égales ? Observez ensuite la longueur de chaque arc.' } },
    { id: 'bilan', titre: 'Bilan', focus: ['scene'],
      retenirTitre: 'La loi des aires',
      retenir: <>
        <SvgCarteAires/>
        <ul style={ULS}>
          <li>Les trois lois de Kepler : <strong>1re loi</strong>, orbite elliptique avec l’astre à un foyer ; <strong>2e loi</strong>, aires égales en des durées égales ; <strong>3e loi</strong> : <FormuleEnLigne>{fr(sq(mi('T')), cu(mi('a')))}</FormuleEnLigne> est constant pour un même astre.</li>
          <li>Deuxième loi : le segment astre-satellite balaie des <strong>aires égales</strong> en des durées égales.</li>
          <li>Conséquence : le satellite va <strong>plus vite près de l’astre</strong> que loin de l’astre. Sur un cercle, la vitesse est constante.</li>
          <li>Moyen de s’en souvenir : <strong>« près, vite ; loin, lentement »</strong>. Idée fausse : « la vitesse est la même partout sur l’orbite ». Vrai : seulement sur une orbite circulaire.</li>
        </ul></>,
      texte: <>Le calcul numérique donne A₁ = {nbf(AIRE_GUIDE[0] * 100, 2)}{NB}% et A₂ = {nbf(AIRE_GUIDE[1] * 100, 2)}{NB}% de l’aire de l’ellipse, pour 1/12 = 8,33{NB}% de la période : la loi est vérifiée. Vous savez trouver la force, l’accélération, la vitesse et la période d’un satellite en orbite circulaire, énoncer les trois lois de Kepler, établir et utiliser la troisième (masse de l’astre, satellite géostationnaire) et tester la loi des aires. Passez à l’exploration (autres astres, autres orbites) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    setDefi(type === 'kep3' ? { type, ...M.tirageKepler3(), rep: '', verifie: false } : { type, ...M.tirageStationnaire(), rep: '', rep2: '', verifie: false });
  };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    const x = lireNombre(defi.rep);
    if (defi.type === 'kep3') {
      const ok = isFinite(x) && Math.abs(x - defi.vrai) <= M.TOL_KEP3 * defi.vrai;
      setDefi(d => ({ ...d, verifie: true, ok, ok1: ok, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterK(ok);
    } else {
      const ok1 = isFinite(x) && Math.abs(x - defi.h) <= M.TOL_STAT_H * defi.h, x2 = lireNombre(defi.rep2 || ''), ok2 = isFinite(x2) && Math.abs(x2 - defi.v) <= M.TOL_STAT_V * defi.v, ok = ok1 && ok2;
      setDefi(d => ({ ...d, verifie: true, ok, ok1, ok2, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterS(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite, bon) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('kep-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (bon ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const enonceKep3 = d => {
    const A = M.ASTRES[d.fam], uT = d.uT === 'jours' ? 'jours' : d.uT;
    const desc = d.mode === 'h' ? `à une altitude de ${M.entier(d.val)}${NB}km` : d.fam === 'jupiter' ? `à un rayon d’orbite de ${M.entier(d.val * 1e3)}${NB}km` : `à un rayon d’orbite de ${nbf(d.val, 0)}${NB}millions de km`;
    const astre = d.cherche === 'M' ? 'd’un astre dont on cherche la masse' : `de ${A.nom}`;
    const donneesM = d.cherche === 'M' ? '' : ` La masse de ${A.nom} vaut M = ${M.sci(A.M, 3)}${NB}kg.`;
    const donneesR = d.mode === 'h' && d.cherche !== 'M' ? ` Le rayon de ${A.nom} vaut ${M.entier(A.R / 1e3)}${NB}km.` : d.mode === 'h' ? ` Le rayon de l’astre vaut ${M.entier(A.R / 1e3)}${NB}km.` : '';
    const tAff = `${nbf(d.Taff, d.Taff < 10 ? 1 : 0)}${NB}${d.uT === 'jours' ? 'jours' : d.uT}`;
    if (d.cherche === 'T') return <>{d.sujet[0].toUpperCase() + d.sujet.slice(1)} décrit une orbite circulaire autour de {A.nom}, {desc}.{donneesM}{donneesR} Calculez sa période de révolution T, en {uT}, avec 2 chiffres significatifs (marge acceptée : 6{NB}%). On prend G = 6,67{NB}×{NB}10⁻¹¹{NB}N·m²·kg⁻².</>;
    if (d.cherche === 'r') return <>{d.sujet[0].toUpperCase() + d.sujet.slice(1)} décrit une orbite circulaire autour de {A.nom}, avec une période de révolution <strong>T = {tAff}</strong>.{donneesM}{donneesR} Calculez {d.mode === 'h' ? 'son altitude h, en km' : `le rayon r de son orbite, en ${d.unite}`}, avec 2 chiffres significatifs (marge acceptée : 6{NB}%). On prend G = 6,67{NB}×{NB}10⁻¹¹{NB}N·m²·kg⁻².</>;
    return <>{d.sujet[0].toUpperCase() + d.sujet.slice(1)} décrit une orbite circulaire autour {astre}, {desc}, avec une période de révolution <strong>T = {tAff}</strong>.{donneesR} Calculez la masse M de l’astre, en 10{d.kM === 24 ? '²⁴' : d.kM === 23 ? '²³' : d.kM === 27 ? '²⁷' : '³⁰'}{NB}kg, avec 2 chiffres significatifs (marge acceptée : 6{NB}%). On prend G = 6,67{NB}×{NB}10⁻¹¹{NB}N·m²·kg⁻².</>;
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['kep3', 'Période, rayon ou masse'], ['stat', 'Orbite stationnaire']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'kep3' ? (defi.cherche === 'T' ? 'Défi : quelle est la période de révolution ?' : defi.cherche === 'r' ? 'Défi : quel est le rayon (ou l’altitude) de l’orbite ?' : 'Défi : quelle est la masse de l’astre central ?') : 'Défi : une orbite stationnaire autour d’une autre planète'}</div>
      {defi.type === 'kep3' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>{enonceKep3(defi)}</div>
        {champ(defi.cherche === 'T' ? 'T' : defi.cherche === 'r' ? (defi.mode === 'h' ? 'h' : 'r') : 'M', 'rep', defi.uRep, defi.ok1)}
        <IndiceDefi cache={false}>{defi.cherche === 'T' ? <>La troisième loi donne T² = <FormuleEnLigne>{fr(<mrow>{mn('4')}{sq(mi('π'))}{cu(mi('r'))}</mrow>, GM)}</FormuleEnLigne>, avec r (distance au centre de l’astre) en mètres : T sort en secondes, à convertir.{defi.mode === 'h' ? ' Pensez à ajouter le rayon de l’astre à l’altitude.' : ''}</>
          : defi.cherche === 'r' ? <>La troisième loi donne r³ = <FormuleEnLigne>{fr(<mrow>{mi('G')}{mi('M')}{sq(mi('T'))}</mrow>, <mrow>{mn('4')}{sq(mi('π'))}</mrow>)}</FormuleEnLigne>, avec T en secondes ; r est la racine cubique, en mètres.{defi.mode === 'h' ? ' L’altitude vaut ensuite h = r − rayon de l’astre.' : ''}</>
          : <>La troisième loi donne M = <FormuleEnLigne>{fr(<mrow>{mn('4')}{sq(mi('π'))}{cu(mi('r'))}</mrow>, <mrow>{mi('G')}{sq(mi('T'))}</mrow>)}</FormuleEnLigne>, avec r en mètres et T en secondes.{defi.mode === 'h' ? ' Pensez à ajouter le rayon de l’astre à l’altitude.' : ''}</>}</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On veut placer un satellite sur une orbite stationnaire autour de <strong>{M.ASTRES[defi.astre].Nom}</strong>, c’est-à-dire une orbite circulaire dans le plan de l’équateur, parcourue dans le sens de rotation de la planète avec une période égale à sa période de rotation. Données : masse M = {M.sci(defi.M, 3)}{NB}kg ; rayon R = {M.entier(defi.R / 1e3)}{NB}km ; période de rotation T = {M.entier(defi.Trot)}{NB}s ; G = 6,67{NB}×{NB}10⁻¹¹{NB}N·m²·kg⁻². Avec 2 chiffres significatifs (marge acceptée : 6{NB}% sur h, 8{NB}% sur v).</div>
        {champ('h', 'rep', 'km', defi.ok1)}
        <div style={{ ...lbl, margin: '4px 0 8px' }}><strong>Deuxième question.</strong> Calculez la valeur v de la vitesse du satellite sur cette orbite, en km/s.</div>
        {champ('v', 'rep2', 'km/s', defi.ok2)}
        <IndiceDefi cache={false}><strong>Question 1</strong> : r³ = <FormuleEnLigne>{fr(<mrow>{mi('G')}{mi('M')}{sq(mi('T'))}</mrow>, <mrow>{mn('4')}{sq(mi('π'))}</mrow>)}</FormuleEnLigne> avec T en secondes ; r est la racine cubique, puis h = r − R. <strong>Question 2</strong> : v = <FormuleEnLigne>{fr(<mrow>{mn('2')}{mi('π')}{mi('r')}</mrow>, mi('T'))}</FormuleEnLigne> (ou <FormuleEnLigne><msqrt>{fr(GM, mi('r'))}</msqrt></FormuleEnLigne>), en m/s puis en km/s.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="kep-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {(defi.ok ? '✓ Correct. ' : defi.type === 'stat' ? `✗ Pas tout à fait (${defi.ok1 ? 'altitude juste' : 'altitude à revoir'}, ${defi.ok2 ? 'vitesse juste' : 'vitesse à revoir'}). ` : '✗ Pas tout à fait. ') + (defi.ok || (defi.essais || 0) >= 2
          ? (defi.type === 'kep3' ? `Réponse attendue : ${nbf(defi.vrai, defi.vrai < 10 ? 2 : defi.vrai < 100 ? 1 : 0)} ${defi.uRep} (marge acceptée : 6 %).` : `Réponse attendue : h = ${M.entier(defi.h)} km et v = ${nbf(defi.v, 2)} km/s.`)
          : 'Revoyez la troisième loi de Kepler, les unités (mètres et secondes) et, si l’altitude est demandée, le rayon de l’astre, puis vérifiez à nouveau (l’indice peut vous aider).')}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Astre central</strong> de symétrie sphérique, de masse M, qui attire le satellite comme si toute sa masse était au centre. <strong>Satellite</strong> (ou planète) de masse m négligeable devant M : il n’agit pas sur l’astre, et m n’intervient dans aucun résultat.</li>
      <li><strong>Référentiel</strong> galiléen centré sur l’astre (géocentrique pour la Terre, héliocentrique pour le Soleil). <strong>Seule la force de gravitation</strong> de l’astre est prise en compte : les autres astres, les frottements de la haute atmosphère (faibles à 400 km, mais réels), l’aplatissement et les marées sont négligés.</li>
      <li><strong>Orbites circulaires</strong> pour tous les calculs du parcours. Pour une planète ou une lune, le « rayon d’orbite » est le demi-grand axe publié (arrondi) : les orbites réelles sont presque circulaires et la troisième loi garde la même forme pour une ellipse en remplaçant r par le demi-grand axe (hors programme).</li>
      <li><strong>Valeurs tabulées</strong> : G = 6,67×10⁻¹¹ N·m²·kg⁻² ; masses et rayons des astres arrondis à 3 chiffres significatifs (ordres de grandeur usuels) ; rayons d’orbite et périodes des lunes et des planètes arrondis (4 à 5 chiffres significatifs). Le jour sidéral de la Terre vaut 86 164 s, différent des 86 400 s du jour solaire moyen.</li>
      <li><strong>Conventions et notations simplifiées</strong> : vec(u)_t (tangent, dans le sens du mouvement) et vec(u)_n (vers le centre) forment le repère de Frenet ; a_t = frac(dv|dt) et a_n = frac(v²|r) ; le sens de parcours est le sens inverse des aiguilles d’une montre. Sur le schéma, les vecteurs sont dessinés avec la même origine (le satellite) mais légèrement décalés pour rester lisibles ; chaque flèche est proportionnelle à sa norme, avec l’échelle donnée dans la légende (échelle recalculée pour chaque orbite : les longueurs ne se comparent pas d’une orbite à l’autre) ; le satellite est un point de taille fixe, hors échelle.</li>
      <li><strong>Loi des aires</strong> : l’orbite elliptique est obtenue par intégration numérique de la loi de Newton (méthode de Runge-Kutta d’ordre 4, unités réduites). Les aires sont calculées à partir des positions obtenues, et non imposées : leurs écarts relatifs (moins de 0,1 %) viennent de l’intégration numérique. Les valeurs affichées sont des résultats du modèle, pas des mesures indépendantes.</li>
      <li><strong>Chiffres significatifs</strong> : données à 3 chiffres significatifs, résultats demandés à 2 ou 3 chiffres (marge de 5 à 6 % sur les calculs).</li>
      <li><strong>Hors périmètre</strong> : énergie des satellites, vitesse de libération, démonstration de la loi des aires et des orbites elliptiques, mouvement de rotation propre.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, graphique, tableau ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };

  // exploration : astre et orbite choisis
  const astreEx = M.ASTRES[ex.astre], orbEx = M.ORBITES[ex.astre].find(o => o.id === ex.orbite) || M.ORBITES[ex.astre][0];
  const thetaEx = THETA0 + 2 * Math.PI * ex.f;
  const vEx = M.vitesse(astreEx.M, orbEx.r), aEx = M.acceleration(astreEx.M, orbEx.r), TEx = M.periode(astreEx.M, orbEx.r);
  const ptsEx = M.ORBITES[ex.astre].filter(o => ex.astre !== 'terre' || o.id !== 'lune' || o.id === orbEx.id).map(o => ({ x: Math.pow(o.r, 3), y: Math.pow(M.periode(astreEx.M, o.r), 2), id: o.id }));
  const actifEx = ptsEx.findIndex(p => p.id === orbEx.id);
  const droiteEx = ex.droite ? { pente: M.constanteKepler(astreEx.M) } : null;

  let sceneNode = null, grapheNode = null, donneesNode = null;
  if (enGuide) {
    const s = idx;
    if (s <= I.periode || s === I.kepler3) {
      const montre = { F: s >= I.accel && s <= I.accelNum ? 'direction' : false, a: s >= I.uniforme ? A800 : null, frenet: s >= I.uniforme, v: s >= I.periode ? V800 : null };
      sceneNode = <SceneOrbite astre={T} r={R800} theta={s >= I.uniforme ? THETA0 + 2 * Math.PI * fG : THETA0} montre={montre}
        aria={`Satellite en orbite circulaire autour de la Terre, à 800 km d’altitude. L’orbite et la Terre sont dessinées au même rapport d’échelle.${montre.F ? ' La force vec F part du satellite vers le centre de la Terre.' : ''}${montre.a != null ? ' Le vecteur accélération est dirigé vers le centre ; le repère de Frenet est tracé au satellite.' : ''}${montre.v != null ? ' Le vecteur vitesse est tangent à l’orbite.' : ''}`}/>;
    } else if (s === I.donnees || s === I.masse) {
      donneesNode = <TableauLunes ratio={s >= I.masse}/>;
      grapheNode = <GrapheKepler points={pointsJupiter} axeX="a" aria="Graphique de T au carré en fonction de a au cube pour quatre satellites naturels de Jupiter."/>;
    } else if (s === I.geoCond) {
      sceneNode = <SceneOrbite astre={T} r={GEO.r} theta={THETA0} sansOrbite rotation sol={THETA0} montre={{}} aria="Vue de dessus de la Terre, au-dessus du pôle nord : une flèche courbe indique le sens de rotation de la Terre, et un point de l’équateur est marqué."/>;
    } else if (s === I.geoAlt) {
      sceneNode = <SceneOrbite astre={T} r={GEO.r} theta={THETA0 + 2 * Math.PI * fG} sol={THETA0 + 2 * Math.PI * fG} rotation montre={{}} aria="Vue de dessus de la Terre et de l’orbite géostationnaire, à l’échelle : l’orbite a un rayon d’environ 6,6 fois celui de la Terre. Le satellite reste aligné avec un point de l’équateur."/>;
    } else {
      sceneNode = <SceneEllipse e={E_ELL} secteurs={SEC_GUIDE} aria="Orbite elliptique avec l’astre à un foyer. Deux secteurs sont balayés pendant des durées égales : le premier près de l’astre, le second loin de l’astre."/>;
    }
  } else if (enExplore) {
    if (ex.vue === 'circ') {
      sceneNode = <SceneOrbite astre={astreEx} r={orbEx.r} theta={thetaEx} montre={{ v: ex.vV ? vEx : null, a: ex.vA ? aEx : null, frenet: ex.vU }}
        aria={`Orbite circulaire autour de ${astreEx.nom} (${orbEx.court}), à l’échelle. Les vecteurs vitesse et accélération sont dessinés au satellite avec leur échelle donnée sous le schéma.`}/>;
      grapheNode = <GrapheKepler points={ptsEx} actif={actifEx} droite={droiteEx} aria={`Graphique de T au carré en fonction de r au cube pour les orbites proposées autour de ${astreEx.nom}.`}/>;
    } else {
      const d = 1 / ex.dur;
      sceneNode = <SceneEllipse e={ex.e} secteurs={[{ f1: ex.s1, f2: Math.min(1, ex.s1 + d) }, { f1: ex.s2, f2: Math.min(1, ex.s2 + d) }]} aria="Orbite elliptique avec l’astre à un foyer et deux secteurs balayés pendant des durées égales."/>;
    }
  } else if (enDefi) {
    sceneNode = null;
  }
  const grapheApart = enExplore && !!grapheNode;     // exploration : le graphique vient après les réglages (téléphone), sous le schéma (ordinateur)
  const boxScene = (sceneNode || (grapheNode && !grapheApart) || donneesNode) && (
    <div className="kep-box" style={{ ...styleBoite, ...(hl('scene') ? cadre('scene') : {}), ...(hl('donnees') ? cadre('donnees') : {}) }}>
      {enExplore && ex.vue === 'circ' && <div style={aide}>Un satellite (ou une planète) tourne autour de l’astre central. Orbite et astre sont à l’échelle (le satellite est un point, hors échelle). Chaque flèche a une échelle recalculée pour chaque orbite : lisez l’échelle sous le schéma.</div>}
      {enExplore && ex.vue === 'ell' && <div style={aide}>L’astre est au foyer de l’ellipse. Les deux secteurs sont balayés en des durées égales ; comparez leurs aires.</div>}
      {sceneNode}
      {donneesNode && <div style={{ marginBottom: 10 }}>{donneesNode}</div>}
      {grapheNode && !grapheApart && <div style={{ marginTop: sceneNode ? 10 : 0, ...cadre('graphe') }}>{grapheNode}</div>}
      {donneesNode && enGuide && <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>Les points sont placés dans l’ordre du tableau (a croissant) ; chaque axe est gradué avec sa puissance de 10.</div>}
    </div>);
  const boxGraphe = grapheApart && <div className="kep-box" style={styleBoite}><div style={cadre('graphe')}>{grapheNode}</div></div>;

  // ---------- commandes du parcours ----------
  const avecTemps = enGuide && (idx >= I.uniforme && idx <= I.kepler3 || idx === I.geoAlt);
  const boxCommandes = avecTemps && (
    <div style={{ ...styleBoite, ...cadre('curseurs') }}>
      <div style={titreCarte}>Mouvement du satellite</div>
      <div style={aide}>Faites tourner le satellite sur son orbite avec le curseur ou « Lancer le mouvement ».</div>
      <ControleTemps valeur={fG} onChange={setFG} texte={`${nbf(fG * 100, 0)}${NB}% d’un tour`} joue={joue} lancer={lancer} reduit={reduit}/>
    </div>);

  // ---------- mesures (parcours) ----------
  const lignesGuide = [];
  if (enGuide && idx >= I.uniforme && idx <= I.kepler3) {
    lignesGuide.push(['Distance r au centre', `${M.sci(R800, 3)}${NB}m`], ['Norme a de l’accélération', `${nbf(A800, 2)}${NB}m/s²`]);
    if (idx >= I.periode) lignesGuide.push(['Vitesse v', `${nbf(V800 / 1000, 2)}${NB}km/s`]);
    if (idx >= I.kepler3) lignesGuide.push(['Période T', `${nbf(T800 / 60, 0)}${NB}min`]);
  }
  const boxMesuresGuide = lignesGuide.length > 0 && idx >= I.vitesse && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Valeurs du modèle (étapes précédentes)</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={avecIndices(n)} valeur={v}/>)}
    </div>);
  const boxMesuresBilan = enGuide && idx === I.bilan && (
    <div style={styleBoite}>
      <div style={titreCarte}>Valeurs du modèle (intégration numérique)</div>
      <LigneMesure nom="Durée de chaque secteur" valeur={`1/12 de période (${nbf(100 / 12, 2)}${NB}%)`}/>
      <LigneMesure nom="Aire A₁ (près de l’astre)" valeur={`${nbf(AIRE_GUIDE[0] * 100, 2)}${NB}% de l’ellipse`}/>
      <LigneMesure nom="Aire A₂ (loin de l’astre)" valeur={`${nbf(AIRE_GUIDE[1] * 100, 2)}${NB}% de l’ellipse`}/>
    </div>);

  // ---------- exploration : réglages, mesures ----------
  const maj = f => setEx(s => ({ ...s, ...f }));
  const changerAstre = a => maj({ astre: a, orbite: M.ORBITES[a][0].id, droite: false });
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Ce que vous étudiez
        <select value={ex.vue} onChange={e => maj({ vue: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          <option value="circ">Orbite circulaire : vitesse, accélération, période</option>
          <option value="ell">Orbite elliptique : loi des aires</option></select></label>
      {ex.vue === 'circ' ? <>
        <div style={aide}>Choisissez l’astre central puis l’orbite : le schéma, les valeurs et le graphique se mettent à jour.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Astre central
          <select value={ex.astre} onChange={e => changerAstre(e.target.value)} style={{ ...menu, marginTop: 2 }}>{M.ORDRE_ASTRES.map(a => <option key={a} value={a}>{M.ASTRES[a].Nom}</option>)}</select></label>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Orbite du satellite
          <select value={orbEx.id} onChange={e => maj({ orbite: e.target.value })} style={{ ...menu, marginTop: 2 }}>{M.ORBITES[ex.astre].map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></label>
        <ControleTemps valeur={ex.f} onChange={f => maj({ f })} texte={`${nbf(ex.f * 100, 0)}${NB}% d’un tour`} joue={joue} lancer={lancer} reduit={reduit}/>
        <Section titre={`Vecteurs affichés : ${[ex.vV && 'vitesse', ex.vA && 'accélération', ex.vU && 'repère de Frenet'].filter(Boolean).join(', ') || 'aucun'}`} ouvert={ouv.vecteurs} onBascule={() => setOuv(o => ({ ...o, vecteurs: !o.vecteurs }))}>
          <div style={aide}>Chaque flèche est proportionnelle à sa norme, avec une échelle recalculée pour chaque orbite : lisez-la sous le schéma.</div>
          {[['vV', 'Vecteur vitesse (tangent à l’orbite)'], ['vA', 'Vecteur accélération (vers le centre)'], ['vU', 'Repère de Frenet (vecteurs unitaires)']].map(([c, l]) =>
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex[c]} onChange={e => maj({ [c]: e.target.checked })} style={{ width: 20, height: 20 }}/>{l}</label>)}
        </Section>
        <Section titre="Graphique T² en fonction de r³" ouvert={ouv.graphe} onBascule={() => setOuv(o => ({ ...o, graphe: !o.graphe }))}>
          <div style={aide}>Chaque point correspond à une orbite de la liste (le carré marque votre choix). Tracez la droite : la troisième loi prévoit que tous les points sont dessus. Les orbites de très petit rayon se confondent près de l’origine.</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 38, color: KIT.txt }}><input type="checkbox" checked={ex.droite} onChange={e => maj({ droite: e.target.checked })} style={{ width: 20, height: 20 }}/>Tracer la droite de pente {avecIndices('frac(4π²|G M)')}</label>
        </Section>
      </> : <>
        <div style={aide}>L’astre occupe un foyer de l’ellipse. Choisissez l’allongement de l’orbite, la durée de chaque secteur, puis la position des deux secteurs.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Excentricité e (0 : cercle ; plus e est grande, plus l’ellipse est allongée)
          <select value={ex.e} onChange={e => maj({ e: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>{[0, 0.3, 0.6, 0.8].map(v => <option key={v} value={v}>{nbf(v, 1)}</option>)}</select></label>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Durée de chaque secteur
          <select value={ex.dur} onChange={e => maj({ dur: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>{[24, 12, 8, 6].map(v => <option key={v} value={v}>1/{v} de la période</option>)}</select></label>
        <Section titre={`Position des secteurs : début à ${nbf(ex.s1 * 100, 0)} % et ${nbf(ex.s2 * 100, 0)} % de la période`} ouvert={ouv.secteurs} onBascule={() => setOuv(o => ({ ...o, secteurs: !o.secteurs }))}>
          <div style={aide}>0 % est le point le plus proche de l’astre, 50 % le plus éloigné. Déplacez chaque secteur avec le curseur ou les boutons − / +.</div>
          {[['s1', 'Début du secteur A₁'], ['s2', 'Début du secteur A₂']].map(([c, l]) => { const maxi = Math.max(0, 1 - 1 / ex.dur), val = Math.min(ex[c], maxi); return (
            <div key={c} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>{l} : {nbf(val * 100, 0)}{NB}%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button aria-label={`${l} : reculer`} onClick={() => maj({ [c]: Math.max(0, val - 0.02) })} style={{ ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 }}>−</button>
                <input type="range" min={0} max={maxi} step={0.005} value={val} onChange={e => maj({ [c]: Number(e.target.value) })} aria-label={l} style={{ flex: 1, minWidth: 0, accentColor: c === 's1' ? BLEU : '#b45309', height: 28 }}/>
                <button aria-label={`${l} : avancer`} onClick={() => maj({ [c]: Math.min(maxi, val + 0.02) })} style={{ ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 }}>+</button>
              </div>
            </div>); })}
          <button onClick={() => maj({ s1: 0, s2: Math.round((0.5 - 1 / ex.dur / 2) * 1000) / 1000 })} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir (près puis loin de l’astre)</button>
        </Section>
      </>}
    </div>);
  const dEll = 1 / ex.dur, s1c = Math.min(ex.s1, 1 - dEll), s2c = Math.min(ex.s2, 1 - dEll);
  const mesuresEx = enExplore && (ex.vue === 'circ' ? (
    <div style={styleBoite}>
      <div style={titreCarte}>Valeurs du modèle ({astreEx.nom}, {orbEx.court})</div>
      <div style={aide}>Valeurs calculées pour l’orbite choisie (elles ne dépendent pas de la position sur l’orbite).</div>
      <LigneMesure nom="Rayon d’orbite r (distance au centre)" valeur={`${M.entier(orbEx.r / 1e3)}${NB}km`}/>
      <LigneMesure nom="Vitesse v" valeur={`${nbf(vEx / 1000, vEx < 1e3 ? 3 : 2)}${NB}km/s`} couleur={VERT}/>
      <LigneMesure nom="Accélération a" valeur={`${aEx >= 0.01 ? nbf(aEx, 2) : M.sci(aEx, 2)}${NB}m/s²`} couleur="#b91c1c"/>
      <LigneMesure nom="Période de révolution T" valeur={M.duree(TEx)} couleur="#b45309"/>
      <LigneMesure nom={avecIndices('Rapport frac(T²|r³)')} valeur={`${M.sci(M.rapportKepler(TEx, orbEx.r), 3)}${NB}s²/m³`}/>
    </div>) : (
    <div style={styleBoite}>
      <div style={titreCarte}>Valeurs du modèle (intégration numérique)</div>
      <div style={aide}>Aires en pourcentage de l’aire totale de l’ellipse ; la distance parcourue est exprimée en demi-grand axes.</div>
      <LigneMesure nom="Durée de chaque secteur" valeur={`${nbf(100 / ex.dur, 1)}${NB}% de la période`}/>
      <LigneMesure nom="Aire A₁" valeur={`${nbf(M.aireBalayee(ex.e, s1c, s1c + dEll) * 100, 2)}${NB}%`} couleur={BLEU}/>
      <LigneMesure nom="Aire A₂" valeur={`${nbf(M.aireBalayee(ex.e, s2c, s2c + dEll) * 100, 2)}${NB}%`} couleur="#b45309"/>
      <LigneMesure nom="Distance parcourue pendant A₁" valeur={`${nbf(arc(ex.e, s1c, s1c + dEll), 2)}${NB}demi-grand axe`}/>
      <LigneMesure nom="Distance parcourue pendant A₂" valeur={`${nbf(arc(ex.e, s2c, s2c + dEll), 2)}${NB}demi-grand axe`}/>
      <LigneMesure nom="Rapport v au plus près / v au plus loin" valeur={`${nbf(M.rapportVitesses(ex.e), 2)}`}/>
    </div>));
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Autour de la Terre, comparez la station spatiale (400 km) et le satellite géostationnaire : lequel va le plus vite ? Lequel a la plus grande période ?</li>
        <li>Choisissez Jupiter puis tracez la droite sur le graphique : où se trouvent les quatre lunes par rapport à la droite ?</li>
        <li>Passez au Soleil : que devient la période quand le rayon d’orbite augmente ? Comparez Mercure et Jupiter.</li>
        <li>Comparez les accélérations de Mars en orbite autour du Soleil et de la Terre en orbite autour du Soleil : laquelle est la plus grande ? Pourquoi ?</li>
        <li>En orbite elliptique, déplacez le secteur A₂ : son aire change-t-elle ? Et la distance parcourue ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Gravitation : F = frac(G m M|r²), vers le centre ; vec(a) = frac(vec(F)|m) : norme {aNorme}, indépendante de m</li>
          <li>Orbite circulaire : mouvement uniforme (a_t = 0), a_n = frac(v²|r) ; {vRacine} ; T = frac(2π r|v)</li>
          <li>Troisième loi : {FKepler}</li>
          <li>Géostationnaire : plan de l’équateur, même sens que la Terre, T = jour sidéral ; h ≈ 3,6×10⁴ km</li>
          <li>Loi des aires : aires égales en durées égales ; vitesse plus grande près de l’astre</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .kep-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .kep-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .kep-col { display: flex; flex-direction: column; gap: 12px; }
        @media (max-width: 600px) { .kep-box { padding: 8px 4px !important; } }
        .kep-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .kep-l1.cote .kep-carte { order: 2; } .kep-l1.cote .kep-main { order: 1; }
          .kep-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .kep-ex > * { grid-column: 1; } .kep-ex > .kep-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .kep-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .kep-in { animation: kep-fondu 0.35s ease-out; } @keyframes kep-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Satellites et lois de Kepler</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un satellite ou une planète en orbite circulaire autour d’un astre : la gravitation fixe sa vitesse et sa période, reliées par la <strong>troisième loi de Kepler</strong>.</div>
      {!enExplore && <div className="kep-l1 cote">
        {enGuide ? <div className="kep-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="kep-carte">{panneauHypo}</div> : null}
        <div className="kep-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'kep3' ? suiviK : suiviS}/></div>}
          <div className="kep-col">
            {boxScene && <div className="kep-in" key={`sc-${idx}`}>{boxScene}</div>}
            {boxCommandes && <div className="kep-in">{boxCommandes}</div>}
            {boxMesuresGuide && <div className="kep-in">{boxMesuresGuide}</div>}
            {boxMesuresBilan && <div className="kep-in">{boxMesuresBilan}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="kep-ex">
        <div>{boxScene}</div>
        <div className="kep-ctrl">{reglagesEx}</div>
        {boxGraphe && <div>{boxGraphe}</div>}
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}

// longueur de l'arc parcouru entre deux dates (demi-grand axes) d'après les positions intégrées
function arc(e, f1, f2) {
  const o = M.ellipse(e); let L = 0;
  for (let i = Math.round(f1 * o.N); i < Math.round(f2 * o.N) && i < o.N; i++) L += Math.hypot(o.X[i + 1] - o.X[i], o.Y[i + 1] - o.Y[i]);
  return L;
}
