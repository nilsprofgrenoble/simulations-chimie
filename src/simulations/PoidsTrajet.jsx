import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./poidsTrajetModele";
import { PoidsExplore } from "./PoidsExplore";
import { QCM } from "./poidsTrajetQcm";
import { SceneRail, SvgPoids, SvgPerp, SvgIndep, SvgBilan } from "./PoidsTrajetSchemas";

const SIM_ID = 250, CLE_GUIDE = 'poidstrajet-guide-v1';
declarerDefis(SIM_ID, [['signes', 'Moteur, nul ou résistant'], ['calcul', 'Travail du poids sur un trajet']]);

// ====================================================
//  SIM 250 — TRAVAIL DU POIDS : MOTEUR, RÉSISTANT OU NUL SELON LE TRAJET (TSTL, enseignement PCM, partie « Énergie mécanique »).
//  Une seule idée : le travail du poids ne dépend que des altitudes de départ et d'arrivée (moteur en descente, résistant en montée, nul à altitude égale) ;
//  une force perpendiculaire à la trajectoire ne travaille pas ; le frottement est toujours résistant.
//  Capacités visées (jamais affichées) : signe et expression du travail du poids ; travail nul d'une force perpendiculaire ; trajet fermé ; ΔEc = somme des travaux.
//  Modèle : poidsTrajetModele.js (test node). QCM : poidsTrajetQcm.js. Schémas : PoidsTrajetSchemas.jsx. Situation inventée (aucune du Moodle).
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', violet: '#6d28d9' };
const PG = M.PARCOURS;
const zTxt = id => `${nbf(M.pt(id).z, 1)}${NB}m`;

const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
const OPT_NAT = [['', 'Choisir…'], ...M.NATURES.map(n => [n, n])];
const OPT_PTS = M.PTS.map(p => [p.id, `${p.id} (${nbf(p.z, 1)} m)`]);

// Graphique des travaux cumulés depuis le départ, en fonction de l'avancement sur le trajet
function GrapheTravaux({ m, dep, arr, frott, u }) {
  const c = M.chemin(dep, arr, 60), z0 = M.pt(dep).z;
  const Wp = c.map(p => M.travailPoids(m, z0, p.z)), Wr = c.map(p => frott ? M.travailFrottement(M.F_FROTT, p.s) : 0);
  const mx = Math.max(1, ...Wp.map(Math.abs), ...Wr.map(Math.abs)) * 1.15;
  const X = i => 50 + 330 * i / (c.length - 1), Y = w => 80 - 62 * w / mx;
  const poly = a => a.map((w, i) => `${X(i).toFixed(1)},${Y(w).toFixed(1)}`).join(' ');
  const k = Math.round(u * (c.length - 1));
  return (
    <svg viewBox="0 0 400 168" style={{ width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' }} role="img"
      aria-label="Graphique : travaux du poids et du frottement depuis le départ, en fonction de l'avancement sur le trajet.">
      <line x1="50" y1={Y(0)} x2="384" y2={Y(0)} stroke="#94a3b8" strokeWidth="1.5"/><line x1="50" y1="12" x2="50" y2="148" stroke="#94a3b8" strokeWidth="1.5"/>
      <text x="46" y="20" textAnchor="end" fontSize="13.5" fill={COL.gris}>{nbf(mx, 0)}</text><text x="46" y="146" textAnchor="end" fontSize="13.5" fill={COL.gris}>{nbf(-mx, 0)}</text>
      <text x="46" y={Y(0) + 5} textAnchor="end" fontSize="13.5" fill={COL.gris}>0</text>
      <text x="12" y="12" fontSize="13.5" fill={COL.gris} fontWeight="700">J</text>
      <text x="217" y="164" textAnchor="middle" fontSize="13.5" fill={COL.gris} fontWeight="600">avancement sur le trajet</text>
      <polyline points={poly(Wp)} fill="none" stroke={COL.bleu} strokeWidth="3.5" strokeLinejoin="round"/>
      {frott && <polyline points={poly(Wr)} fill="none" stroke={COL.orange} strokeWidth="3.5" strokeLinejoin="round"/>}
      <circle cx={X(k)} cy={Y(Wp[k])} r="5.5" fill={COL.bleu} stroke="white" strokeWidth="2"/>{frott && <circle cx={X(k)} cy={Y(Wr[k])} r="5.5" fill={COL.orange} stroke="white" strokeWidth="2"/>}
      <text x="60" y="30" fontSize="14" fontWeight="700" fill={COL.bleu}>W(P)</text>{frott && <text x="106" y="30" fontSize="14" fontWeight="700" fill={COL.orange}>W(f)</text>}
    </svg>);
}

// ====================================================
export function SimulationPoidsTrajet() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('signes');
  const [ouv, setOuv] = useState({});
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['forces', 'perp', 'descente', 'wab', 'montee', 'wbc', 'wac', 'indep', 'aller', 'frott', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);

  const ETAPES = [
    { id: 'forces', titre: 'Les forces sur le chariot', focus: ['scene'],
      texte: <>Un chariot de masse <strong>{nbf(PG.m, 1)} kg</strong> roule sur un rail <strong>sans frottement</strong>. Le rail passe par cinq points, de A à E, dont l’altitude est repérée à partir de la référence z = 0 (axe vertical vers le haut). On étudie le système « le chariot ». Un <strong>travail</strong> est l’énergie qu’une force transfère à un système : il faut donc d’abord faire l’inventaire des forces.</>,
      tache: { type: 'qcm', q: 'Quelles forces s’exercent sur le chariot ?', ...QCM.forces,
        expl: 'Le poids (vertical, vers le bas) et la réaction du rail. Sans frottement, la réaction est perpendiculaire au rail. Aucune force « dans le sens du mouvement » n’agit : la vitesse n’a pas besoin d’une force pour se maintenir.', indice: 'Pensez à la Terre et au rail : que font-ils au chariot ?' } },
    { id: 'perp', titre: 'Une force perpendiculaire ne travaille pas', focus: ['scene'],
      texte: <>Pour un déplacement très petit <strong>dl</strong>, le travail d’une force <strong>F</strong> est <strong>δW = F · dl</strong> (produit scalaire). Quand la force est <strong>perpendiculaire</strong> au déplacement, ce produit est nul à chaque instant : elle ne travaille pas.</>,
      tache: { type: 'qcm', q: 'Que vaut le travail de la réaction du rail (sans frottement) sur n’importe quel trajet ?', ...QCM.perp,
        expl: 'Sans frottement, la réaction est perpendiculaire au rail donc au déplacement : son travail est nul sur tout trajet.', indice: 'Dans quelle direction la réaction pousse-t-elle le chariot, par rapport à la trajectoire ?' } },
    { id: 'descente', titre: 'Le poids en descente', focus: ['scene'],
      retenirTitre: 'À retenir : une force perpendiculaire',
      retenir: <>
        <SvgPerp/>
        <ul style={puces}>
          <li>Une force <strong>perpendiculaire à la trajectoire</strong> a un travail <strong>nul</strong> : δW = F · dl = 0.</li>
          <li>Exemple : la tension d’une ficelle qui fait tourner une balle en cercle ; la réaction d’un support sans frottement.</li>
          <li>Moyen de s’en souvenir : <strong>« à angle droit, pas de travail »</strong>.</li></ul></>,
      texte: <>Le poids est vertical, dirigé vers le bas. Un travail est <strong>moteur</strong> si la force agit dans le sens du déplacement (l’énergie cinétique du système augmente), <strong>résistant</strong> si elle s’y oppose (elle diminue). Le chariot part de A ({zTxt('A')}) et descend jusqu’à B ({zTxt('B')}).</>,
      tache: { type: 'qcm', q: 'Sur le trajet A → B, le travail du poids est :', ...QCM.descente,
        expl: 'Le chariot perd de l’altitude : le poids agit dans le sens du déplacement vertical, son travail est moteur (positif).', indice: 'Le chariot descend ; le poids est dirigé vers le bas.' } },
    { id: 'wab', titre: 'Calculer le travail du poids', focus: ['scene'],
      texte: <>Le travail du poids ne dépend que des altitudes : <strong>W(P) = −m × g × (z<sub>arrivée</sub> − z<sub>départ</sub>)</strong>, avec z vers le haut. On prend <strong>m = {nbf(PG.m, 1)} kg</strong> et <strong>g = 9,8 N/kg</strong>. Le chariot va de A (z = {zTxt('A')}) à B (z = {zTxt('B')}).</>,
      tache: { type: 'num', q: 'Travail du poids sur A → B, en joules (J), avec son signe', unite: 'J', vrai: PG.WAB, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[-PG.WAB, 'Le signe est inversé : le chariot descend, le travail du poids est positif.'], [PG.m * (M.pt('A').z - M.pt('B').z), 'Il manque la valeur de g (9,8 N/kg).'], [PG.m * M.G * M.longueur('A', 'B'), 'On utilise ici la longueur du rail ; seule compte la différence d’altitude.']],
        calcul: () => [`W(P) = −m × g × (zB − zA) = −${nbf(PG.m, 1)} × 9,8 × (0 − ${nbf(M.pt('A').z, 1)}) = +${nbf(PG.WAB, 1)} J, soit +24 J.`],
        expl: 'W(P) = −2,0 × 9,8 × (0 − 1,2) ≈ +24 J.', indice: 'W(P) = −m × g × (z arrivée − z départ), avec g = 9,8 N/kg.' } },
    { id: 'montee', titre: 'Le poids en montée', focus: ['scene'],
      texte: <>Le chariot repart de B ({zTxt('B')}) et monte jusqu’à C ({zTxt('C')}).</>,
      tache: { type: 'qcm', q: 'Sur le trajet B → C, le travail du poids est :', ...QCM.montee,
        expl: 'Le chariot gagne de l’altitude : le poids s’oppose au déplacement vertical, son travail est résistant (négatif), et l’énergie cinétique diminue.', indice: 'Le chariot monte ; le poids est toujours dirigé vers le bas.' } },
    { id: 'wbc', titre: 'Le calcul en montée', focus: ['scene'],
      texte: <>Même formule, avec les altitudes de B ({zTxt('B')}) et de C ({zTxt('C')}) ; <strong>m = {nbf(PG.m, 1)} kg</strong>, <strong>g = 9,8 N/kg</strong>.</>,
      tache: { type: 'num', q: 'Travail du poids sur B → C, en joules (J), avec son signe', unite: 'J', vrai: PG.WBC, tol: 0.03, affiche: v => String(Math.round(v)).replace('-', '−'), cs: 2,
        pieges: [[-PG.WBC, 'Le signe est inversé : le chariot monte, le travail du poids est négatif.'], [PG.WAC, 'Ces altitudes sont celles de A et de C ; le chariot part ici de B.'], [-PG.m * (M.pt('C').z - M.pt('B').z), 'Il manque la valeur de g (9,8 N/kg).']],
        calcul: () => [`W(P) = −m × g × (zC − zB) = −${nbf(PG.m, 1)} × 9,8 × (${nbf(M.pt('C').z, 1)} − 0) = −${nbf(-PG.WBC, 1)} J, soit −16 J.`],
        expl: 'W(P) = −2,0 × 9,8 × (0,8 − 0) ≈ −16 J.', indice: 'W(P) = −m × g × (z arrivée − z départ), z arrivée = 0,8 m, z départ = 0 m.' } },
    { id: 'wac', titre: 'Un trajet en deux parties', focus: ['scene'],
      texte: <>Le chariot va de A à C en passant par B. Sur A → B, le travail du poids vaut <strong>+24 J</strong> ; sur B → C, il vaut <strong>−16 J</strong>. Les travaux se comptent avec leur signe et s’additionnent.</>,
      tache: { type: 'num', q: 'Travail du poids sur le trajet complet A → C, en joules (J), avec son signe', unite: 'J', vrai: PG.WAC, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[24 + 16, 'On additionne ici des valeurs absolues ; il faut tenir compte du signe de chaque travail.'], [-PG.WAC, 'Le signe est inversé : A est plus haut que C, le poids est moteur sur l’ensemble.'], [24, 'Il manque le travail de la deuxième portion, B → C.']],
        calcul: () => [`W(A→C) = W(A→B) + W(B→C) = +${nbf(PG.WAB, 1)} − ${nbf(-PG.WBC, 1)} = +${nbf(PG.WAC, 1)} J. Directement : −${nbf(PG.m, 1)} × 9,8 × (0,8 − 1,2) = +${nbf(PG.WAC, 1)} J.`],
        expl: 'W = 24 − 16 ≈ +7,8 J (directement : 2,0 × 9,8 × 0,4 ≈ 7,8 J).', indice: 'Additionnez les deux travaux avec leur signe, ou utilisez directement les altitudes de A et de C.' } },
    { id: 'indep', titre: 'Le chemin n’a pas d’importance', focus: ['scene'],
      retenirTitre: 'À retenir : le travail du poids',
      retenir: <>
        <SvgPoids/>
        <ul style={puces}>
          <li>Le <strong>travail du poids</strong> vaut <strong>m × g × (z départ − z arrivée)</strong> : il ne dépend que de la <strong>variation d’altitude</strong>.</li>
          <li>Exemple : 1,0 kg qui descend de 2,0 m reçoit environ +20 J ; s’il remonte de 2,0 m, son poids a un travail de −20 J.</li>
          <li>Moyen de s’en souvenir : <strong>« descendre : moteur, monter : résistant »</strong>.</li></ul></>,
      texte: <>Un second rail, plus long et beaucoup plus tortueux, relierait lui aussi A à C. Il passerait par des points plus hauts et plus bas que B, mais partirait de A et arriverait en C.</>,
      tache: { type: 'qcm', q: 'Par rapport au rail actuel, le travail du poids de A à C serait :', ...QCM.indep,
        expl: 'Le travail du poids ne dépend que de l’altitude de départ et de l’altitude d’arrivée, pas du chemin suivi : il vaudrait encore +7,8 J.', indice: 'Dans la formule du travail du poids, quelles grandeurs interviennent ?' } },
    { id: 'aller', titre: 'Un trajet qui finit à la même altitude', focus: ['scene'],
      texte: <>Le chariot parcourt tout le rail, de A jusqu’à E. Le point E est à <strong>{zTxt('E')}</strong>, comme le point A.</>,
      tache: { type: 'qcm', q: 'Le travail du poids sur le trajet A → E est :', ...QCM.aller,
        expl: 'A et E sont à la même altitude : le travail du poids est nul. Ce que le poids fournit dans les descentes, il le reprend dans les montées. Il serait nul aussi pour un aller-retour.', indice: 'Comparez l’altitude de départ et l’altitude d’arrivée.' } },
    { id: 'frott', titre: 'Avec frottement : le contraste', focus: ['scene'],
      retenirTitre: 'À retenir : le trajet ne compte pas',
      retenir: <>
        <SvgIndep/>
        <ul style={puces}>
          <li>Le travail du poids est le <strong>même</strong> pour tous les trajets qui relient les mêmes points ; il est <strong>nul</strong> sur un trajet <strong>fermé</strong>.</li>
          <li>Exemple : une balle qui revient à sa main après avoir été lancée : son poids a un travail total nul.</li>
          <li>Moyen de s’en souvenir : <strong>« seules comptent l’altitude de départ et celle d’arrivée »</strong>.</li></ul></>,
      texte: <>Le rail frotte maintenant : la réaction n’est plus perpendiculaire. Elle a une composante tangente au rail, le <strong>frottement f</strong>, de valeur constante et <strong>toujours opposée au mouvement</strong>. Le chariot descend de A à B, puis remonte de B à A.</>,
      tache: { type: 'qcm', q: 'Quel est le travail de la force de frottement sur la remontée de B à A ?', ...QCM.frott,
        expl: 'Le frottement est opposé au déplacement à l’aller comme au retour : son travail est résistant dans les deux sens. Sur l’aller-retour, celui du poids est nul mais celui du frottement ne l’est pas.', indice: 'Le frottement est-il dans le sens du mouvement ou dans le sens opposé ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : poids et frottement',
      retenir: <>
        <SvgBilan/>
        <ul style={puces}>
          <li>Le <strong>poids</strong> change de signe selon le sens du mouvement : il convertit de l’énergie cinétique en énergie potentielle et inversement (changement de forme).</li>
          <li>Le <strong>frottement</strong> est toujours résistant : l’énergie qu’il retire est dissipée.</li>
          <li>Moyen de s’en souvenir : <strong>« le poids rend, le frottement prend »</strong>.</li></ul></>,
      texte: <>Vous savez donner le signe et la valeur du travail du poids selon le trajet, et reconnaître les forces qui ne travaillent pas. Explorez, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // scène de chaque étape du parcours (aucun résultat sur le schéma)
  const SCENE = { forces: ['A', null, 0], perp: ['A', 'B', 0.4], descente: ['A', 'B', 0.35], wab: ['A', 'B', 0.35], montee: ['B', 'C', 0.4], wbc: ['B', 'C', 0.4], wac: ['A', 'C', 0.55], indep: ['A', 'C', 0.55], aller: ['A', 'E', 0.5], frott: ['A', 'B', 0.5], fin: ['A', 'E', 0.5] };

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'signes' ? { ...M.tirageDefiA(), reps: {}, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { w: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const attendu = (t, i) => { const b = M.bilan({ m: 1, ...t, frott: defi.frott }); return i === 'P' ? b.natureP : b.natureR; };
  const verifier = () => {
    if (defi.type === 'signes') {
      const bons = defi.trajets.map((t, i) => ({ P: defi.reps[`p${i}`] === attendu(t, 'P'), R: defi.reps[`r${i}`] === attendu(t, 'R') })), ok = bons.every(b => b.P && b.R);
      setDefi(x => ({ ...x, verifie: true, ok, bons })); noterA(ok);
    } else {
      const w = lireNombre(defi.reps.w), ok = isFinite(w) && proche(w, defi.W, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok })); noterB(ok);
    }
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnosticA = () => {
    const msgs = [];
    defi.trajets.forEach((t, i) => {
      const nom = `Trajet ${i + 1} (${t.dep} → ${t.arr})`;
      if (!defi.bons[i].P) msgs.push(defi.reps[`p${i}`] ? `${nom}, poids : comparez l’altitude de départ (${zTxt(t.dep)}) et celle d’arrivée (${zTxt(t.arr)}) : le chariot monte, descend ou reste à la même altitude ?` : `${nom} : choisissez la nature du travail du poids.`);
      if (!defi.bons[i].R) msgs.push(defi.reps[`r${i}`] ? `${nom}, réaction : ${defi.frott ? 'avec frottement, la réaction a une composante opposée au mouvement : dans quel sens le mouvement se fait-il, et que fait cette composante ?' : 'sans frottement, la réaction est dans quelle direction par rapport à la trajectoire ?'}` : `${nom} : choisissez la nature du travail de la réaction du rail.`);
    });
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, w = lireNombre(x.reps.w), dz = Math.abs(M.pt(x.arr).z - M.pt(x.dep).z), msgs = [];
    if (!isFinite(w)) return ['Écrivez un nombre avec son signe (virgule ou point).'];
    if (proche(w, -x.W, 0.05)) msgs.push(`Le signe est inversé : le chariot ${x.W > 0 ? 'descend, donc le travail du poids est positif' : 'monte, donc le travail du poids est négatif'}.`);
    else if (proche(Math.abs(w), x.m * M.G * x.L, 0.05)) msgs.push('Vous avez utilisé la longueur de rail parcourue : seule compte la différence d’altitude entre le départ et l’arrivée.');
    else if (proche(Math.abs(w), x.m * dz, 0.05)) msgs.push('Il manque la valeur de g (9,8 N/kg) dans votre calcul.');
    else if (proche(Math.abs(w), M.G * dz, 0.05)) msgs.push('Il manque la masse du chariot dans votre calcul.');
    else msgs.push(`W(P) = m × g × (z départ − z arrivée) = ${x.m} × 9,8 × (${nbf(M.pt(x.dep).z, 1)} − ${nbf(M.pt(x.arr).z, 1)}), en J. Votre valeur est ${w > x.W ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const correction = () => defi.type === 'signes'
    ? defi.trajets.map((t, i) => { const b = M.bilan({ m: 1, ...t, frott: defi.frott }); return `Trajet ${i + 1} (${t.dep} → ${t.arr}, de ${zTxt(t.dep)} à ${zTxt(t.arr)}) : poids ${b.natureP} (${b.dz < 0 ? 'le chariot descend' : b.dz > 0 ? 'il monte' : 'même altitude'}), réaction ${b.natureR} (${defi.frott ? 'le frottement s’oppose au mouvement' : 'perpendiculaire à la trajectoire'}).`; }).join(' ')
    : `W(P) = m × g × (z départ − z arrivée) = ${defi.m} × 9,8 × (${nbf(M.pt(defi.dep).z, 1)} − ${nbf(M.pt(defi.arr).z, 1)}) = ${defi.W > 0 ? '+' : '−'}${fmt2(Math.abs(defi.W))} J (le chariot ${defi.W > 0 ? 'descend' : 'monte'}).`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['signes', 'Moteur, nul ou résistant'], ['calcul', 'Travail du poids sur un trajet']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'signes' ? 'Défi : moteur, nul ou résistant' : 'Défi : travail du poids sur un trajet'}</div>
      {defi.type === 'signes' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un chariot de masse quelconque parcourt le rail ci-dessus. {defi.frott ? <>Le rail <strong>frotte</strong> : la réaction est inclinée vers l’arrière.</> : <>Le rail est <strong>sans frottement</strong> : la réaction est perpendiculaire au rail.</>} Pour chaque trajet, choisissez la nature du travail du poids et celle du travail de la réaction.</div>
        {defi.trajets.map((t, i) => <div key={i} style={{ marginBottom: 8, padding: 8, border: `1px solid ${KIT.bord}`, borderRadius: 10, background: 'white' }}>
          <div style={{ ...lbl, fontWeight: 700, marginBottom: 4 }}>Trajet {i + 1} : de {t.dep} ({zTxt(t.dep)}) à {t.arr} ({zTxt(t.arr)})</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label htmlFor={`pdt-p${i}`} style={libelle}>Poids</label>
              <select id={`pdt-p${i}`} value={defi.reps[`p${i}`] || ''} onChange={e2 => change(`p${i}`, e2.target.value)} style={{ ...selectStyle, borderColor: defi.verifie ? (defi.bons[i].P ? '#15803d' : '#dc2626') : KIT.bord }}>{OPT_NAT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div><label htmlFor={`pdt-r${i}`} style={libelle}>Réaction du rail</label>
              <select id={`pdt-r${i}`} value={defi.reps[`r${i}`] || ''} onChange={e2 => change(`r${i}`, e2.target.value)} style={{ ...selectStyle, borderColor: defi.verifie ? (defi.bons[i].R ? '#15803d' : '#dc2626') : KIT.bord }}>{OPT_NAT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div></div>)}
        <IndiceDefi cache={false}>Poids : le chariot descend (moteur), monte (résistant) ou reste à la même altitude (nul). Réaction : perpendiculaire au rail sans frottement (nul) ; avec frottement, sa composante tangente est opposée au mouvement.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un chariot de masse <strong>{defi.m} kg</strong> va du point {defi.dep} (z = <strong>{zTxt(defi.dep)}</strong>) au point {defi.arr} (z = <strong>{zTxt(defi.arr)}</strong>), en suivant le rail sur <strong>{nbf(defi.L, 1)} m</strong>. On prend g = 9,8 N/kg. Calculez le travail du poids sur ce trajet, en joules et avec son signe (2 chiffres significatifs).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>W(P) (J) =</span>
          <input value={defi.reps.w} aria-label="Travail du poids en joules, avec son signe" onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('pdt-verif')?.click()} onChange={e2 => change('w', e2.target.value)} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        </div>
        <IndiceDefi cache={false}>W(P) = m × g × (z départ − z arrivée), avec g = 9,8 N/kg : positif si le chariot descend, négatif s’il monte. Seules les altitudes comptent, pas la longueur de rail.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pdt-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'signes' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Le chariot est un point matériel</strong> ; le mouvement a lieu le long du rail, dont le profil est inventé pour la simulation.</li>
      <li><strong>Champ de pesanteur uniforme</strong>, g = 9,8 N/kg : le travail du poids vaut m × g × (z départ − z arrivée), quelle que soit la forme du trajet.</li>
      <li><strong>Sans frottement</strong>, la réaction du rail est perpendiculaire à la trajectoire : son travail est nul. <strong>Avec frottement</strong>, on le modélise par une force de valeur constante f = 1,5 N, toujours opposée au mouvement : W(f) = − f × longueur parcourue.</li>
      <li><strong>Théorème de l’énergie cinétique</strong> : ΔEc = somme des travaux. L’énergie dissipée par le frottement (échauffement) n’est pas détaillée ici.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, altitudes, frottement) : ce ne sont pas des mesures.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const [sd, sa, su] = SCENE[idEtape];
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La situation étudiée</div>
      <SceneRail dep={sd} arr={sa} u={su} frott={idEtape === 'frott'}/>
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Cliquez sur le chariot (départ A, arrivée E) : que vaut le travail du poids à la fin ? Et au milieu du trajet ?</li>
      <li>Échangez le départ et l’arrivée : que devient le signe du travail du poids ?</li>
      <li>Avec frottement, comparez le travail du poids et celui de la réaction sur A → B puis sur B → A.</li>
      <li>Doublez la masse : quelles grandeurs changent, et lesquelles ne changent pas ?</li>
      <li>Trouvez deux trajets différents qui ont exactement le même travail du poids.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Travail du poids : m × g × (z départ − z arrivée) ; moteur en descente, résistant en montée, nul à altitude égale</li>
        <li>Il ne dépend pas du trajet ; il est nul sur un trajet fermé</li>
        <li>Une force perpendiculaire à la trajectoire a un travail nul</li>
        <li>Le frottement est toujours résistant : son travail ne s’annule jamais sur un aller-retour</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pdt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pdt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pdt-col { display: flex; flex-direction: column; gap: 12px; }
        .pdt-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .pdt-l1.cote .pdt-carte { order: 2; } .pdt-l1.cote .pdt-main { order: 1; }
          .pdt-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .pdt-ex > * { grid-column: 1; }
          .pdt-ex > .pdt-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .pdt-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pdt-in { animation: pdt-fondu 0.35s ease-out; } @keyframes pdt-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Travail du poids : moteur, résistant ou nul selon le trajet</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le <strong>travail du poids</strong> ne dépend que des altitudes de départ et d’arrivée : moteur en descente, résistant en montée, nul sur un trajet fermé. Comparez-le à celui d’un frottement.</div>
      {!enExplore && <div className={`pdt-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="pdt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="pdt-carte">{panneauHypo}</div>}
        <div className="pdt-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'signes' ? suiviA : suiviB}/></div>}
          {enDefi && <div className="pdt-col"><div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le rail</div><SceneRail dep="A" chariot={false}/></div></div>}
          {enGuide && <div className="pdt-col"><div className="pdt-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <PoidsExplore/>
        <div style={{ height: 12 }}/>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
