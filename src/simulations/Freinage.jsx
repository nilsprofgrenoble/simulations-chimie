import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./freinageModele";
import { QCM } from "./freinageQcm";
import { SceneFreinage, GrapheFreinage, SvgTheoreme, SvgProportion, SvgPente } from "./FreinageSchemas";

const SIM_ID = 260, CLE_GUIDE = 'freinage-guide-v1';
declarerDefis(SIM_ID, [['distance', 'Distance d’arrêt d’un véhicule'], ['vitesse', 'Vitesse maximale pour s’arrêter à temps']]);

// ====================================================
//  SIM 260 — DISTANCE DE FREINAGE : ÉNERGIE CINÉTIQUE ET TRAVAIL DE LA FORCE DE FREINAGE (TSTL, enseignement PCM, partie « Énergie mécanique »).
//  Une seule idée : le théorème de l'énergie cinétique donne la distance d'arrêt (d = ½ m v² ÷ F) ; d ∝ v², ∝ m, ∝ 1/F ; effet d'une pente par le travail du poids.
//  Capacités visées (jamais affichées) : travail d'une force constante, travail nul d'une force perpendiculaire, théorème de l'énergie cinétique, conversion km/h → m/s.
//  Modèle : freinageModele.js (test node). QCM : freinageQcm.js. Schémas : FreinageSchemas.jsx. Situation et valeurs inventées (aucune du Moodle).
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const moins = s => s.replace('-', '−');
const sp = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);

// ====================================================
export function SimulationFreinage() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('distance');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ m: 1000, vkmh: 72, F: 8000, p: 0, u: 0.4 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['frein', 'conv', 'ec0', 'arret', 'theoreme', 'dist', 'v2', 'double', 'masse', 'mouille', 'descente', 'pente', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const VOITURE = <>Une voiture de masse <strong>m = {sp(PG.m)} kg</strong> roule sur une route droite et horizontale. Pour s’arrêter, le conducteur freine : la route exerce alors sur la voiture une <strong>force de freinage F</strong>, constante, opposée au déplacement, de valeur <strong>{sp(PG.F)} N</strong>.</>;

  const ETAPES = [
    { id: 'frein', titre: 'La force de freinage', focus: ['scene'],
      texte: <>{VOITURE} On étudie le système « la voiture » entre le début du freinage et l’arrêt. Le <strong>travail d’une force constante</strong> est W = F × d × cos θ, où θ est l’angle entre la force et le déplacement.</>,
      tache: { type: 'qcm', q: 'Le travail de la force de freinage pendant le freinage est :', ...QCM.frein,
        expl: 'La force de freinage est opposée au déplacement (θ = 180°, cos θ = −1) : son travail W(F) = − F × d est négatif, on dit qu’il est résistant.', indice: 'Dans quel sens agit la force de freinage par rapport au déplacement ? Quel est alors le signe de cos θ ?' } },
    { id: 'conv', titre: 'Convertir la vitesse', focus: ['scene'],
      texte: <>La voiture roule à <strong>{PG.vkmh} km/h</strong> au début du freinage. Pour calculer une énergie en joules, la vitesse doit être exprimée en <strong>mètres par seconde</strong> (m/s) : 1 m/s = 3,6 km/h.</>,
      tache: { type: 'num', q: 'Vitesse de la voiture au début du freinage, en m/s', unite: 'm/s', vrai: PG.v0, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.vkmh * 3.6, 'Pour passer de km/h à m/s, on divise par 3,6 (et non on multiplie).'], [PG.vkmh / 1000, 'Il faut diviser par 3,6 : 1 km = 1 000 m et 1 h = 3 600 s.']],
        calcul: () => [`v = ${PG.vkmh} ÷ 3,6 = ${nbf(PG.v0, 1)} m/s, soit 20 m/s.`], expl: 'v = 72 ÷ 3,6 = 20 m/s.', indice: 'Divisez la vitesse en km/h par 3,6.' } },
    { id: 'ec0', titre: 'L’énergie cinétique à dissiper', focus: ['scene'],
      texte: <>La voiture (m = {sp(PG.m)} kg) a au début du freinage la vitesse <strong>v = {PG.v0} m/s</strong>. L’énergie cinétique du système est Ec = ½ × m × v².</>,
      tache: { type: 'num', q: 'Énergie cinétique de la voiture avant le freinage, en joules (J)', unite: 'J', vrai: PG.Ec0, tol: 0.03, affiche: v => sp(v), cs: 2,
        pieges: [[2 * PG.Ec0, 'Il manque le facteur ½ : Ec = ½ × m × v².'], [0.5 * PG.m * PG.v0, 'La vitesse doit être élevée au carré : Ec = ½ × m × v².']],
        calcul: () => [`Ec = ½ × m × v² = ½ × ${sp(PG.m)} × ${PG.v0}² = ${sp(PG.Ec0)} J, soit 2,0 × 10⁵ J (200 kJ).`], expl: 'Ec = ½ × 1 000 × 20² = 200 000 J.', indice: 'Ec = ½ × m × v² : calculez d’abord v².' } },
    { id: 'arret', titre: 'À l’arrêt', focus: ['scene'],
      texte: <>À la fin du freinage, la voiture est immobile. Le <strong>théorème de l’énergie cinétique</strong> s’écrit : <strong>ΔEc = somme des travaux des forces</strong>, avec ΔEc = Ec(finale) − Ec(initiale).</>,
      tache: { type: 'qcm', q: 'Entre le début du freinage et l’arrêt, la variation d’énergie cinétique ΔEc de la voiture est :', ...QCM.arret,
        expl: 'À l’arrêt Ec(finale) = 0 : ΔEc = 0 − 200 000 J = − 200 000 J, négative. La voiture a perdu toute son énergie cinétique.', indice: 'Que vaut la vitesse, donc Ec, à la fin du freinage ?' } },
    { id: 'theoreme', titre: 'Quelles forces travaillent ?', focus: ['scene'],
      texte: <>Sur la route horizontale, la voiture est soumise à trois forces : son <strong>poids P</strong> (vertical), la <strong>réaction normale R</strong> de la route (perpendiculaire à la route) et la <strong>force de freinage F</strong> (le long de la route). Une force perpendiculaire au déplacement a un travail nul (cos 90° = 0).</>,
      tache: { type: 'qcm', q: 'Parmi ces forces, celle(s) dont le travail n’est pas nul pendant le freinage :', ...QCM.theoreme,
        expl: 'Le poids et la réaction normale sont perpendiculaires au déplacement (route horizontale) : leur travail est nul. Seule la force de freinage travaille.', indice: 'Quelles forces sont perpendiculaires à la route horizontale ?' } },
    { id: 'dist', titre: 'La distance d’arrêt', focus: ['scene'],
      texte: <>Seule la force de freinage travaille : <strong>0 − Ec = − F × d</strong>. L’énergie cinétique de la voiture vaut {sp(PG.Ec0)} J et la force de freinage {sp(PG.F)} N.</>,
      tache: { type: 'num', q: 'Distance d’arrêt de la voiture, en mètres (m)', unite: 'm', vrai: PG.d, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.Ec0 / (2 * PG.F), 'Le facteur ½ est déjà compris dans l’énergie cinétique : ne le comptez pas deux fois.'], [PG.Ec0 * PG.F, 'Le travail de la force de freinage vaut − F × d : la distance s’obtient en divisant Ec par F.']],
        calcul: () => [`d = Ec ÷ F = ${sp(PG.Ec0)} ÷ ${sp(PG.F)} = ${nbf(PG.d, 1)} m, soit 25 m.`], expl: 'd = 200 000 ÷ 8 000 = 25 m.', indice: 'De 0 − Ec = − F × d, isolez d.' } },
    { id: 'v2', titre: 'Roulant deux fois plus vite', focus: ['scene'],
      retenirTitre: 'À retenir : la distance d’arrêt',
      retenir: <>
        <SvgTheoreme/>
        <ul style={puces}>
          <li>Seule la force de freinage travaille : <strong>d = ½ m v² ÷ F</strong> (v en m/s).</li>
          <li>La voiture perd son énergie cinétique : le travail de F est négatif.</li>
          <li>Moyen de s’en souvenir : <strong>« Ec de départ = F × d »</strong>.</li></ul></>,
      texte: <>La même voiture ({sp(PG.m)} kg), avec la même force de freinage ({sp(PG.F)} N), roule maintenant à <strong>{PG.vkmh2} km/h</strong> au début du freinage, soit {PG.v02} m/s. Reprenez le calcul de l’énergie cinétique puis de la distance.</>,
      tache: { type: 'num', q: `Distance d’arrêt à ${PG.vkmh2} km/h, en mètres (m)`, unite: 'm', vrai: PG.d2, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[2 * PG.d, 'La distance n’est pas proportionnelle à la vitesse : Ec = ½ m v² dépend de v².'], [0.5 * PG.m * PG.vkmh2 * PG.vkmh2 / PG.F, 'La vitesse doit être convertie en m/s avant de calculer.']],
        calcul: () => [`Ec = ½ × ${sp(PG.m)} × ${PG.v02}² = ${sp(0.5 * PG.m * PG.v02 ** 2)} J ; d = ${sp(0.5 * PG.m * PG.v02 ** 2)} ÷ ${sp(PG.F)} = ${nbf(PG.d2, 0)} m.`], expl: 'Ec = ½ × 1 000 × 40² = 800 000 J ; d = 800 000 ÷ 8 000 = 100 m.', indice: 'Calculez Ec avec v = 40 m/s, puis d = Ec ÷ F.' } },
    { id: 'double', titre: 'Comparer les deux freinages', focus: ['scene'],
      texte: <>À {PG.vkmh} km/h la distance d’arrêt est de {nbf(PG.d, 0)} m ; à {PG.vkmh2} km/h, la vitesse étant doublée, elle est de {PG.d2} m. Voyons ce que cela dit de la dépendance de d envers la vitesse.</>,
      tache: { type: 'qcm', q: 'Quand la vitesse double, la distance d’arrêt :', ...QCM.double,
        expl: 'Ec = ½ m v² est proportionnelle à v² : doubler v multiplie Ec, donc la distance d’arrêt, par 2² = 4.', indice: 'Comparez les deux distances : 25 m et 100 m.' } },
    { id: 'masse', titre: 'Un véhicule plus lourd', focus: ['scene'],
      texte: <>Un camion de masse <strong>{sp(2 * PG.m)} kg</strong> (deux fois celle de la voiture) roule à {PG.vkmh} km/h et freine avec la même force de freinage {sp(PG.F)} N.</>,
      tache: { type: 'qcm', q: 'Par rapport à la voiture, la distance d’arrêt du camion est :', ...QCM.masse,
        expl: 'Ec = ½ m v² est proportionnelle à m : le camion a 2 fois plus d’énergie à dissiper, donc d = Ec ÷ F est 2 fois plus grande.', indice: 'Ec est proportionnelle à la masse ; F est la même.' } },
    { id: 'mouille', titre: 'Route mouillée', focus: ['scene'],
      texte: <>Sur route mouillée, l’adhérence est moins bonne : à la même vitesse, la force de freinage maximale est <strong>deux fois plus petite</strong> ({sp(PG.F / 2)} N au lieu de {sp(PG.F)} N). Même voiture, même vitesse.</>,
      tache: { type: 'qcm', q: 'Par rapport à la route sèche, la distance d’arrêt sur route mouillée est :', ...QCM.mouille,
        expl: 'À Ec fixée, d = Ec ÷ F : la force est divisée par 2, donc la distance est multipliée par 2.', indice: 'Ec est la même ; F est divisée par 2 dans d = Ec ÷ F.' } },
    { id: 'descente', titre: 'Dans une descente', focus: ['scene'],
      retenirTitre: 'À retenir : ce qui fait varier d',
      retenir: <>
        <SvgProportion/>
        <ul style={puces}>
          <li><strong>d = ½ m v² ÷ F</strong> : proportionnelle à m, au carré de v, et inversement proportionnelle à F.</li>
          <li>Doubler la vitesse multiplie d par 4 : une vitesse plus grande coûte beaucoup en distance.</li>
          <li>Moyen de s’en souvenir : <strong>« la vitesse compte au carré »</strong>.</li></ul></>,
      texte: <>La voiture ({sp(PG.m)} kg) roule maintenant à {PG.vkmh} km/h dans une <strong>descente</strong>, avec la même force de freinage {sp(PG.F)} N. Le poids n’est plus perpendiculaire à la route : il a une composante le long de la route, dans le sens du mouvement.</>,
      tache: { type: 'qcm', q: 'Par rapport à la route horizontale, la distance d’arrêt dans la descente est :', ...QCM.descente,
        expl: 'Dans la descente, le travail du poids est moteur : il apporte de l’énergie. Le freinage doit dissiper plus d’énergie, donc la distance augmente.', indice: 'Le poids aide-t-il la voiture à avancer ou à s’arrêter dans une descente ?' } },
    { id: 'pente', titre: 'Distance dans la descente', focus: ['scene'],
      texte: <>La route descend de <strong>5 %</strong> (sin α = −0,05). Le travail du poids vaut <strong>W(P) = − m g (z<sub>B</sub> − z<sub>A</sub>)</strong> ; sur une distance d, z<sub>B</sub> − z<sub>A</sub> = d × sin α = − 0,05 d. Avec g = 9,8 N/kg, le théorème de l’énergie cinétique donne 0 − Ec = − F d − m g sin α × d.</>,
      tache: { type: 'num', q: 'Distance d’arrêt dans la descente, en mètres (m)', unite: 'm', vrai: PG.dDesc, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.Ec0 / (PG.F + PG.m * M.G * 0.05) , 'Dans la descente, le poids est moteur : il s’oppose au freinage et la distance augmente.'], [PG.d, 'Le poids travaille dans la descente : la distance n’est pas celle de la route horizontale.']],
        calcul: () => [`d = Ec ÷ (F + m g sin α) = ${sp(PG.Ec0)} ÷ (${sp(PG.F)} − ${sp(PG.m * M.G * 0.05)}) = ${nbf(PG.dDesc, 1)} m, soit 27 m.`], expl: 'd = 200 000 ÷ (8 000 − 1 000 × 9,8 × 0,05) = 200 000 ÷ 7 510 ≈ 27 m.', indice: 'La force qui s’oppose au mouvement vaut F + m g sin α, avec sin α = −0,05 : calculez-la, puis d = Ec ÷ (cette force).' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : l’effet de la pente',
      retenir: <>
        <SvgPente/>
        <ul style={puces}>
          <li>Montée : le poids s’oppose au mouvement, la distance diminue. Descente : le poids est moteur, la distance augmente.</li>
          <li><strong>d = ½ m v² ÷ (F + m g sin α)</strong>, avec sin α &gt; 0 en montée et &lt; 0 en descente.</li>
          <li>Moyen de s’en souvenir : <strong>« en descente, le poids pousse »</strong>.</li></ul></>,
      texte: <>Vous savez calculer une distance d’arrêt par le théorème de l’énergie cinétique et prévoir l’effet de la vitesse, de la masse, de la route et de la pente. Explorez en changeant les réglages, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  // scène de chaque étape (aucune réponse écrite sur le schéma)
  const SC = {
    frein: { u: 0.3, v: 0.7 }, conv: { u: 0, v: 1, force: false }, ec0: { u: 0, v: 1, force: false }, arret: { u: 1, v: 0 }, theoreme: { u: 0.5, v: 0.5, poids: true }, dist: { u: 0.6, v: 0.45 },
    v2: { u: 0.4, v: 0.8 }, double: { u: 0.3, v: 0.9 }, masse: { u: 0.3, v: 0.7 }, mouille: { u: 0.3, v: 0.7 }, descente: { u: 0.3, v: 0.7, p: -0.05, poids: true }, pente: { u: 0.4, v: 0.6, p: -0.05, poids: true }, fin: { u: 0.5, v: 0.5 } };

  // ════════════════ EXPLORATION ════════════════
  const { m: mz, vkmh: vkz, F: Fz, p: pz } = ex, vz = M.kmhEnMs(vkz);
  const pr = useMemo(() => M.profil({ m: mz, v0: vz, F: Fz, p: pz, n: 60 }), [mz, vz, Fz, pz]);
  const arrete = isFinite(pr.d), k = arrete ? Math.round(ex.u * (pr.pts.length - 1)) : 0, pt = arrete ? pr.pts[k] : null;
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures à l’instant choisi</div>
      <LigneMesure nom="Vitesse au début du freinage" valeur={`${nbf(vz, 1)}${NB}m/s`}/>
      <LigneMesure nom="Énergie cinétique au début" valeur={`${nbf(M.energieCin(mz, vz) / 1000, 0)}${NB}kJ`} couleur="#0369a1"/>
      {arrete ? <>
        <LigneMesure nom="Distance d’arrêt" valeur={`${nbf(pr.d, 1)}${NB}m`} couleur="#6d28d9"/>
        <LigneMesure nom="Distance déjà parcourue" valeur={`${nbf(pt.x, 1)}${NB}m`}/>
        <LigneMesure nom="Vitesse à cet instant" valeur={`${nbf(pt.v, 1)}${NB}m/s`}/>
        <LigneMesure nom="Énergie cinétique Ec" valeur={`${nbf(pt.Ec / 1000, 1)}${NB}kJ`} couleur="#0369a1"/>
        <LigneMesure nom="Travail de la force de freinage" valeur={`${moins(nbf(pt.WF / 1000, 1))}${NB}kJ`} couleur="#c2410c"/>
        {pz !== 0 && <LigneMesure nom="Travail du poids" valeur={`${moins(nbf(pt.WP / 1000, 1))}${NB}kJ`} couleur="#15803d"/>}
      </> : <div style={{ fontSize: 14, color: '#b91c1c', lineHeight: 1.5, fontWeight: 700 }}>Le véhicule ne s’arrête pas : dans cette descente, la composante du poids est plus grande que la force de freinage.</div>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="dfr-m" label="Masse du véhicule" valeur={ex.m} onChange={v => setEx(s => ({ ...s, m: Number(v) }))} options={[500, 1000, 2000, 5000].map(v => [v, `${sp(v)} kg`])}/>
      <Sel id="dfr-v" label="Vitesse au début du freinage" valeur={ex.vkmh} onChange={v => setEx(s => ({ ...s, vkmh: Number(v) }))} options={[30, 50, 72, 90, 110, 130].map(v => [v, `${v} km/h`])}/>
      <Sel id="dfr-f" label="Force de freinage" valeur={ex.F} onChange={v => setEx(s => ({ ...s, F: Number(v) }))} options={[[2000, '2 000 N (très faible)'], [4000, '4 000 N (route mouillée ou verglacée)'], [8000, '8 000 N (route sèche)'], [16000, '16 000 N (freinage très efficace)']]}/>
      <Sel id="dfr-p" label="Pente de la route" valeur={ex.p} onChange={v => setEx(s => ({ ...s, p: Number(v) }))} options={[[-0.1, 'descente de 10 %'], [-0.05, 'descente de 5 %'], [0, 'horizontale'], [0.05, 'montée de 5 %'], [0.1, 'montée de 10 %']]}/>
      <Curseur nom="Avancée pendant le freinage" valeur={Math.round(ex.u * 100)} onChange={v => setEx(s => ({ ...s, u: v / 100 }))} min={0} max={100} pas={2} unite="%" decimales={0} couleur="#475569"/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Avancez dans le freinage : le véhicule, les points du graphique et les mesures suivent. Changez un réglage à la fois pour voir ce qui fait varier la distance d’arrêt.</div>
    </div>);
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Le véhicule qui freine' : 'La situation étudiée'}</div>
      {enExplore
        ? <SceneFreinage u={arrete ? ex.u : 0} p={pz} v={arrete ? Math.max(0, pt.v / vz) : 1} cote={arrete && ex.u > 0.02 ? `${nbf(pt.x, 1)} m` : null} poids={pz !== 0}/>
        : <SceneFreinage {...SC[idEtape]}/>}
    </div>);
  const graphe = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Énergie cinétique et travaux pendant le freinage</div>
      {arrete ? <GrapheFreinage pr={pr} u={ex.u}/> : <div style={{ ...lbl, color: '#b91c1c' }}>Pas de graphique : le véhicule ne s’arrête pas.</div>}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'distance') setDefi({ ...M.tirageDefiA(), type, reps: { d: '' }, verifie: false, corr: false });
    else setDefi({ ...M.tirageDefiB(), type, reps: { v: '' }, verifie: false, corr: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'distance') { const d = lireNombre(defi.reps.d), ok = isFinite(d) && proche(d, defi.d, 0.06); setDefi(x => ({ ...x, verifie: true, ok })); noterA(ok); }
    else { const v = lireNombre(defi.reps.v), ok = isFinite(v) && proche(v, defi.vmax, 0.06); setDefi(x => ({ ...x, verifie: true, ok })); noterB(ok); }
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnosticA = () => {
    const x = defi, d = lireNombre(x.reps.d), v = M.kmhEnMs(x.vkmh), Ec = M.energieCin(x.m, v), msgs = [];
    if (!isFinite(d)) return ['Écrivez un nombre (virgule ou point), en mètres.'];
    if (proche(d, M.energieCin(x.m, x.vkmh) / x.F, 0.05)) msgs.push('La vitesse doit être convertie de km/h en m/s (÷ 3,6) avant de calculer l’énergie cinétique.');
    else if (proche(d, 2 * x.d, 0.05)) msgs.push('Le facteur ½ de l’énergie cinétique a été oublié : Ec = ½ × m × v².');
    else if (proche(d, x.d / 2, 0.05)) msgs.push('Le facteur ½ est compté deux fois : la distance est d = Ec ÷ F avec Ec = ½ × m × v².');
    else if (proche(d, 0.5 * x.m * v / x.F, 0.05)) msgs.push('La vitesse doit être élevée au carré : Ec = ½ × m × v².');
    else msgs.push(`Refaites le calcul avec vos données : v = ${x.vkmh} ÷ 3,6 = ${nbf(v, 1)} m/s ; Ec = ½ × ${sp(x.m)} × ${nbf(v, 1)}² = ${sp(Ec)} J ; d = Ec ÷ ${sp(x.F)}. Votre valeur est ${d > x.d ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, v = lireNombre(x.reps.v), msgs = [];
    if (!isFinite(v)) return ['Écrivez un nombre (virgule ou point), en km/h.'];
    if (proche(v, x.vms, 0.05)) msgs.push('Votre résultat est en m/s : la question demande des km/h (multipliez par 3,6).');
    else if (proche(v, M.msEnKmh(Math.sqrt(x.F * x.D / x.m)), 0.05)) msgs.push('Il manque un facteur 2 : ½ m v² = F × D donne v² = 2 F D ÷ m.');
    else if (proche(v, M.msEnKmh(2 * x.F * x.D / x.m), 0.05)) msgs.push('Il faut prendre la racine carrée : v² = 2 F D ÷ m, donc v = √(2 F D ÷ m).');
    else msgs.push(`Refaites le calcul : v² = 2 × F × D ÷ m = 2 × ${sp(x.F)} × ${x.D} ÷ ${sp(x.m)}, puis v = √(v²) en m/s, enfin × 3,6 pour les km/h. Votre valeur est ${v > x.vmax ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const correction = () => defi.type === 'distance'
    ? `d = Ec ÷ F avec v = ${defi.vkmh} ÷ 3,6 = ${nbf(M.kmhEnMs(defi.vkmh), 1)} m/s et Ec = ½ × ${sp(defi.m)} × ${nbf(M.kmhEnMs(defi.vkmh), 1)}² = ${sp(M.energieCin(defi.m, M.kmhEnMs(defi.vkmh)))} J, donc d = ${nbf(defi.d, 1)} m.`
    : `½ m v² = F × D donne v = √(2 F D ÷ m) = √(2 × ${sp(defi.F)} × ${defi.D} ÷ ${sp(defi.m)}) = ${nbf(defi.vms, 1)} m/s, soit ${nbf(defi.vmax, 0)} km/h.`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['distance', 'Distance d’arrêt'], ['vitesse', 'Vitesse maximale']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'distance' ? 'Défi : distance d’arrêt' : 'Défi : vitesse maximale pour s’arrêter à temps'}</div>
      {defi.type === 'distance' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un véhicule de masse <strong>{sp(defi.m)} kg</strong> roule à <strong>{defi.vkmh} km/h</strong> sur une route horizontale. Il freine jusqu’à l’arrêt avec une force de freinage constante de <strong>{sp(defi.F)} N</strong>. Calculez sa distance d’arrêt, en mètres (2 chiffres significatifs).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>d (m) =</span>
          <input value={defi.reps.d} aria-label="Distance d’arrêt en mètres" onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('dfr-verif')?.click()} onChange={e2 => change('d', e2.target.value)} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        </div>
        <IndiceDefi cache={false}>Convertissez d’abord la vitesse en m/s (÷ 3,6), puis Ec = ½ × m × v² et d = Ec ÷ F (seule la force de freinage travaille).</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un véhicule de masse <strong>{sp(defi.m)} kg</strong> freine avec une force de freinage constante de <strong>{sp(defi.F)} N</strong> sur une route horizontale. Un obstacle se trouve à <strong>{defi.D} m</strong>. Quelle est la <strong>vitesse maximale</strong>, en km/h, à laquelle le véhicule peut rouler pour s’arrêter juste avant l’obstacle (2 chiffres significatifs) ?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>v<sub>max</sub> (km/h) =</span>
          <input value={defi.reps.v} aria-label="Vitesse maximale en kilomètres par heure" onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('dfr-verif')?.click()} onChange={e2 => change('v', e2.target.value)} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        </div>
        <IndiceDefi cache={false}>Le théorème de l’énergie cinétique donne ½ m v² = F × D : isolez v (en m/s, avec une racine carrée), puis multipliez par 3,6 pour obtenir des km/h.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="dfr-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'distance' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Le véhicule est un point matériel</strong> en mouvement rectiligne ; g = 9,8 N/kg.</li>
      <li><strong>La force de freinage est supposée constante</strong> et parallèle à la route, opposée au déplacement. Dans la réalité elle varie (adhérence, ABS, usure des freins) : le modèle donne un ordre de grandeur.</li>
      <li><strong>On néglige</strong> la résistance de l’air et le roulement, ainsi que le temps de réaction du conducteur : la distance calculée est la distance de freinage seule, pas la distance d’arrêt totale.</li>
      <li><strong>Sur route horizontale</strong>, le poids et la réaction normale sont perpendiculaires au déplacement : leur travail est nul. Dans une pente, le travail du poids est W(P) = − m g (z<sub>B</sub> − z<sub>A</sub>).</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, forces de freinage, pentes) : ce ne sont pas des mesures sur un véhicule réel.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Passez de 30 à 90 km/h : la vitesse est multipliée par 3. Par combien la distance d’arrêt est-elle multipliée ?</li>
      <li>Doublez la masse : comparez avec ce que donne un doublement de la vitesse.</li>
      <li>Réduisez la force de freinage (route mouillée) : comment varie la distance ?</li>
      <li>Choisissez une montée puis une descente : quel est le signe du travail du poids dans chaque cas ?</li>
      <li>Camion de 5 000 kg, descente de 10 % et force de 2 000 N : que se passe-t-il ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Seule la force de freinage travaille sur route horizontale : d = ½ m v² ÷ F</li>
        <li>d est proportionnelle à m, au carré de v, et inversement proportionnelle à F</li>
        <li>Vitesse en m/s : km/h ÷ 3,6</li>
        <li>Pente : d = ½ m v² ÷ (F + m g sin α) ; le poids freine en montée, pousse en descente</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .dfr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .dfr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .dfr-col { display: flex; flex-direction: column; gap: 12px; }
        .dfr-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .dfr-l1.cote .dfr-carte { order: 2; } .dfr-l1.cote .dfr-main { order: 1; }
          .dfr-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .dfr-ex > * { grid-column: 1; }
          .dfr-ex > .dfr-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .dfr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .dfr-in { animation: dfr-fondu 0.35s ease-out; } @keyframes dfr-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Distance de freinage : énergie cinétique et travail de la force de freinage</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le théorème de l’énergie cinétique relie la <strong>vitesse</strong> d’un véhicule, la <strong>force de freinage</strong> et la <strong>distance d’arrêt</strong>.</div>
      {!enExplore && <div className={`dfr-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="dfr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="dfr-carte">{panneauHypo}</div>}
        <div className="dfr-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'distance' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="dfr-col"><div className="dfr-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="dfr-ex">
          {scene}
          <div className="dfr-reg">{reglages}</div>
          {graphe}
          {mesures}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
