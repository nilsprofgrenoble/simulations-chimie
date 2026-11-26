import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./penteXtModele";
import { QCM } from "./penteXtQcm";
import { PenteExplore } from "./PenteExplore";
import { GrapheXT, SvgPenteCarte, SvgCordeCarte, SvgSommetCarte } from "./PenteXtSchemas";

const SIM_ID = 265, CLE_GUIDE = 'pente-xt-guide-v1';
declarerDefis(SIM_ID, [['tang', 'Lire une vitesse sur une tangente'], ['corde', 'Vitesse moyenne puis vitesse à une date']]);

// ====================================================
//  SIM 265 — LIRE UNE VITESSE SUR UN GRAPHIQUE x(t) (TSTL, enseignement PCM, partie « Mouvements »).
//  Une seule idée : la vitesse est la pente de la courbe x(t) (droite : vitesse constante ; corde : vitesse moyenne ; tangente : vitesse à une date = dérivée).
//  Capacités visées (jamais affichées) : vitesse comme dérivée de la position ; exploiter un graphique de position. Mouvements rectilignes imposés, valeurs inventées.
//  Modèle : penteXtModele.js (test node). QCM : penteXtQcm.js. Schémas : PenteXtSchemas.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
const bornes = (c, extra = []) => { const xs = [c.xmin, c.xmax, ...extra]; return { xmin: Math.floor(Math.min(...xs) / 5) * 5, xmax: Math.ceil(Math.max(...xs) / 5) * 5 }; };

// ====================================================
export function SimulationPenteXt() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('tang');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ c: 'acceleree', t: 4, dt: 2, corde: true, tang: true });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const par = x => (x < 0 ? `(${nbf(x, 2)})` : nbf(x, 2));
  const IDS = ['pente', 'mru', 'recul', 'courbe', 'corde', 'rapproche', 'tangente', 'derivee', 'sommet', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const COURBE = <>x(t) = 0,50 t² + 1,0 t</>;
  const ETAPES = [
    { id: 'pente', titre: 'Un mobile à vitesse constante', focus: ['scene'],
      texte: <>Un chariot roule sur un rail droit, à <strong>vitesse constante</strong>. Le graphique donne sa position <strong>x</strong> (en m) en fonction de la date <strong>t</strong> (en s) : c’est une droite montante. On s’intéresse à la <strong>pente</strong> de cette droite, c’est-à-dire à la variation de x divisée par la variation de t.</>,
      tache: { type: 'qcm', q: 'Que représente la pente de la droite x(t) ?', ...QCM.pente,
        expl: 'La pente vaut Δx ÷ Δt : une variation de position divisée par la durée correspondante, c’est la vitesse (en m/s).', indice: 'Les unités de Δx ÷ Δt sont des mètres divisés par des secondes : quelle grandeur se mesure en m/s ?' } },
    { id: 'mru', titre: 'Calculer la pente d’une droite', focus: ['scene'],
      texte: <>Sur la droite, on repère deux points : A, à la date <strong>1,0 s</strong> pour la position <strong>3,0 m</strong>, et B, à la date <strong>5,0 s</strong> pour la position <strong>11,0 m</strong>. Pour une droite, la vitesse vaut <strong>v = Δx ÷ Δt = (x<sub>B</sub> − x<sub>A</sub>) ÷ (t<sub>B</sub> − t<sub>A</sub>)</strong>.</>,
      tache: { type: 'num', q: 'Vitesse du chariot, en m/s', unite: 'm/s', vrai: 2.0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[11 / 5, 'La durée est t_B − t_A = 4,0 s, pas la date de B seule (5,0 s).'], [8.0, 'Il faut diviser la variation de position (8,0 m) par la durée (4,0 s).']],
        calcul: () => ['Δx = 11,0 − 3,0 = 8,0 m et Δt = 5,0 − 1,0 = 4,0 s.', 'v = 8,0 ÷ 4,0 = 2,0 m/s.'], expl: 'v = (11,0 − 3,0) ÷ (5,0 − 1,0) = 2,0 m/s.', indice: 'Calculez d’abord Δx = x_B − x_A, puis Δt = t_B − t_A, puis divisez.' } },
    { id: 'recul', titre: 'Une droite qui descend', focus: ['scene'],
      texte: <>Un autre chariot recule : sur le graphique, la position <strong>x diminue</strong> régulièrement, de 12 m à la date 0 jusqu’à 0 m à la date 8 s (droite descendante). Le sens positif de l’axe Ox est celui des x croissants.</>,
      tache: { type: 'qcm', q: 'La coordonnée v_x de la vitesse de ce chariot est :', ...QCM.recul,
        expl: 'La droite descend : sa pente est négative, donc v_x < 0. Le signe de v_x donne le sens du déplacement par rapport à l’axe.', indice: 'Si x diminue, la variation Δx est-elle positive ou négative ? Que devient alors Δx ÷ Δt ?' } },
    { id: 'courbe', titre: 'Quand la courbe se redresse', focus: ['scene'],
      retenirTitre: 'À retenir : la pente est la vitesse',
      retenir: <>
        <SvgPenteCarte/>
        <ul style={puces}>
          <li>Sur un graphique x(t), la <strong>pente</strong> donne la vitesse : <strong>v = Δx ÷ Δt</strong>. Droite montante : v &gt; 0 ; droite descendante : v &lt; 0.</li>
          <li>Exemple de la simulation : de A (1,0 s ; 3,0 m) à B (5,0 s ; 11,0 m), v = 8,0 ÷ 4,0 = 2,0 m/s.</li>
          <li>Moyen de s’en souvenir : <strong>« plus c’est raide, plus ça va vite »</strong>. Idée fausse : « une courbe qui monte, c’est un mobile qui monte ». Vrai : x est une position sur un axe, pas une altitude.</li></ul></>,
      texte: <>Un mobile accélère sur un rail : sa position suit <strong>{COURBE}</strong> (x en m, t en s). Le graphique est maintenant une <strong>courbe</strong> de plus en plus raide, et non plus une droite.</>,
      tache: { type: 'qcm', q: 'Que dire de la vitesse de ce mobile au fil du temps ?', ...QCM.courbe,
        expl: 'La pente de la courbe augmente quand t augmente : la vitesse augmente, le mobile accélère.', indice: 'Comparez la raideur de la courbe près de t = 0 et près de t = 8 s.' } },
    { id: 'corde', titre: 'La vitesse moyenne : la corde', focus: ['scene'],
      texte: <>Sur la courbe {COURBE}, on relie par une <strong>corde</strong> (tirets orange) les points aux dates <strong>4,0 s</strong> et <strong>6,0 s</strong> : x(4,0 s) = <strong>12,0 m</strong> et x(6,0 s) = <strong>24,0 m</strong>. La pente de la corde est la <strong>vitesse moyenne</strong> entre ces deux dates.</>,
      tache: { type: 'num', q: 'Vitesse moyenne entre 4,0 s et 6,0 s, en m/s', unite: 'm/s', vrai: PG.vCorde, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[12.0, 'La durée à utiliser est 6,0 − 4,0 = 2,0 s : 12,0 m est la variation de position, pas la vitesse.'], [24 / 6, 'Il faut la variation de position (24,0 − 12,0) ÷ la durée (6,0 − 4,0), pas la position finale ÷ la date finale.']],
        calcul: () => ['Δx = 24,0 − 12,0 = 12,0 m et Δt = 6,0 − 4,0 = 2,0 s.', 'v moyenne = 12,0 ÷ 2,0 = 6,0 m/s.'], expl: 'v moyenne = (24,0 − 12,0) ÷ (6,0 − 4,0) = 6,0 m/s.', indice: 'Même calcul que pour la droite : Δx ÷ Δt entre les deux points de la corde.' } },
    { id: 'rapproche', titre: 'Rapprocher les deux points', focus: ['scene'],
      texte: <>La corde 4,0 s – 6,0 s donne 6,0 m/s. Si l’on prend maintenant deux dates plus proches, 4,0 s et 5,0 s (x = 12,0 m et 17,5 m), on trouve <strong>5,5 m/s</strong> ; avec 4,0 s et 4,5 s, on trouve <strong>5,25 m/s</strong>. On continue à rapprocher la seconde date de 4,0 s.</>,
      tache: { type: 'qcm', q: 'Que devient la corde quand les deux points se rapprochent ?', ...QCM.rapproche,
        expl: 'La corde pivote autour du point fixe et se confond peu à peu avec la tangente à la courbe en ce point : les vitesses moyennes (6,0 puis 5,5 puis 5,25 m/s) tendent vers la vitesse à la date 4,0 s.', indice: 'Regardez la suite des vitesses moyennes : 6,0 ; 5,5 ; 5,25. Vers quelle valeur semble-t-elle se rapprocher ?' } },
    { id: 'tangente', titre: 'La vitesse à une date : la tangente', focus: ['scene'],
      retenirTitre: 'À retenir : corde et tangente',
      retenir: <>
        <SvgCordeCarte/>
        <ul style={puces}>
          <li>La pente de la <strong>corde</strong> entre deux dates est la <strong>vitesse moyenne</strong>. La pente de la <strong>tangente</strong> à une date est la <strong>vitesse à cette date</strong>.</li>
          <li>Exemple de la simulation : corde de 4,0 s à 6,0 s : 6,0 m/s ; en rapprochant les points : 5,5 puis 5,25 m/s, qui tendent vers la vitesse en 4,0 s.</li>
          <li>Moyen de s’en souvenir : <strong>« la tangente, c’est la corde dont les deux points se sont rejoints »</strong>. Idée fausse : « la vitesse en un point, c’est x ÷ t ». Vrai : c’est la pente de la tangente.</li></ul></>,
      texte: <>On trace la <strong>tangente</strong> à la courbe à la date <strong>4,0 s</strong> (trait bleu). Elle passe par le point C (<strong>2,0 s</strong> ; <strong>2,0 m</strong>) et par le point D (<strong>6,0 s</strong> ; <strong>22,0 m</strong>). Sa pente est la vitesse du mobile à la date 4,0 s.</>,
      tache: { type: 'num', q: 'Vitesse du mobile à la date 4,0 s, en m/s', unite: 'm/s', vrai: PG.vTang, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.vCorde, 'C’est la vitesse moyenne entre 4,0 s et 6,0 s (pente de la corde) : ici on demande la pente de la tangente, entre C et D.'], [20 / 6, 'La durée entre C et D est 6,0 − 2,0 = 4,0 s, pas 6,0 s.']],
        calcul: () => ['Δx = 22,0 − 2,0 = 20,0 m et Δt = 6,0 − 2,0 = 4,0 s.', 'v(4,0 s) = 20,0 ÷ 4,0 = 5,0 m/s.'], expl: 'v = (22,0 − 2,0) ÷ (6,0 − 2,0) = 5,0 m/s.', indice: 'Prenez les deux points de la tangente, C et D : Δx ÷ Δt.' } },
    { id: 'derivee', titre: 'La dérivée donne la même vitesse', focus: ['scene'],
      texte: <>La pente de la tangente est la <strong>dérivée</strong> de x(t) : <strong>v = dx/dt</strong>. Pour {COURBE}, on dérive : (a t²)′ = 2 a t et (b t)′ = b, donc <strong>v(t) = 1,0 t + 1,0</strong> (en m/s). On retrouve v(4,0 s) = 5,0 m/s, comme avec la tangente. On cherche la vitesse à la date <strong>6,0 s</strong>.</>,
      tache: { type: 'num', q: 'Vitesse du mobile à la date 6,0 s, en m/s', unite: 'm/s', vrai: PG.vD, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[24 / 6, 'C’est x(6,0 s) ÷ 6,0 s, une vitesse moyenne depuis le départ : la vitesse à 6,0 s est la dérivée v(t) = 1,0 t + 1,0.'], [24.0, 'C’est la position x(6,0 s) : il faut la vitesse v(6,0 s) = 1,0 × 6,0 + 1,0.']],
        calcul: () => ['v(t) = 1,0 t + 1,0, donc v(6,0 s) = 1,0 × 6,0 + 1,0 = 7,0 m/s.'], expl: 'v(6,0 s) = 6,0 + 1,0 = 7,0 m/s.', indice: 'Remplacez t par 6,0 dans v(t) = 1,0 t + 1,0.' } },
    { id: 'sommet', titre: 'Au sommet de la courbe', focus: ['scene'],
      texte: <>Un mobile part, s’éloigne de l’origine, puis revient : sa courbe x(t) monte, atteint un <strong>sommet</strong> à la date 3,0 s (x = 9,0 m), puis redescend. La tangente tracée au sommet (trait bleu) est <strong>horizontale</strong>.</>,
      tache: { type: 'qcm', q: 'À la date 3,0 s, la vitesse du mobile est :', ...QCM.sommet,
        expl: 'Une tangente horizontale a une pente nulle : v = 0 à cet instant. Le mobile est au plus loin de l’origine, il s’arrête un instant avant de repartir en sens inverse (v change de signe).', indice: 'Quelle est la pente d’une droite horizontale ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : tangente horizontale',
      retenir: <>
        <SvgSommetCarte/>
        <ul style={puces}>
          <li>Tangente <strong>horizontale</strong> : pente nulle, donc <strong>v = 0</strong> à cet instant (le mobile fait demi-tour ou s’arrête).</li>
          <li>Exemple de la simulation : au sommet de la courbe, v = 0 un instant ; avant, v &gt; 0 ; après, v &lt; 0.</li>
          <li>Moyen de s’en souvenir : <strong>« vitesse nulle, tangente à plat »</strong>. Idée fausse : « v = 0 veut dire que le mobile reste immobile ». Vrai : v peut être nulle un seul instant.</li></ul></>,
      texte: <>Vous savez lire une vitesse sur un graphique de position : <strong>droite</strong> (pente = vitesse), <strong>corde</strong> (vitesse moyenne), <strong>tangente</strong> (vitesse à une date, dérivée de x(t)), signe de la vitesse et tangente horizontale. Explorez en déplaçant la date et l’écart Δt, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const U = M.COURBES.uniforme, A = M.COURBES.acceleree, R = M.COURBES.recul, Q = M.COURBES.aller;
  const SC = {
    pente: { c: U }, mru: { c: U, points: [[1, 3, 'A'], [5, 11, 'B']] }, recul: { c: R }, courbe: { c: A }, corde: { c: A, corde: [4, 6] },
    rapproche: { c: A, corde: [4, 6] }, tangente: { c: A, tangente: { t0: 4, v: 5 }, points: [[2, 2, 'C'], [6, 22, 'D']] }, derivee: { c: A, repere: 6 },
    sommet: { c: Q, tangente: { t0: 3, v: 0 } }, fin: { c: A, tangente: { t0: 4, v: 5 }, corde: [4, 6] },
  };
  const grapheDe = s => { const b = bornes(s.c); return <GrapheXT fn={s.c.x} tmax={s.c.tmax} xmin={b.xmin} xmax={b.xmax} corde={s.corde} tangente={s.tangente} points={s.points || []} repere={s.repere ?? null}
    aria={`Graphique de la position x en fonction de la date t : ${s.c.nom}.${s.corde ? ' Une corde relie deux points de la courbe.' : ''}${s.tangente ? ' Une tangente est tracée.' : ''}`}/>; };

  const animee = enExplore && <PenteExplore ex={ex} setEx={setEx}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Graphique de la position x en fonction de la date t</div>
      {grapheDe(SC[idEtape])}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'tang' ? { ...M.tirageDefiTangente(), type, reps: { v: '' }, verifie: false, corr: false } : { ...M.tirageDefiCorde(), type, reps: { m: '', i: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const ok = defi.type === 'tang' ? proche(lireNombre(defi.reps.v), defi.v, 0.06) : (proche(lireNombre(defi.reps.m), defi.vMoy, 0.06) && proche(lireNombre(defi.reps.i), defi.vInst, 0.06));
    setDefi(x => ({ ...x, verifie: true, ok })); (defi.type === 'tang' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, msgs = [];
    if (x.type === 'tang') {
      const v = lireNombre(x.reps.v), dx = x.x2 - x.x1;
      if (!isFinite(v)) return ['Écrivez un nombre (virgule ou point), en m/s.'];
      if (proche(v, -x.v, 0.05)) msgs.push('Vérifiez le signe : il est celui de la pente, donc de x₂ − x₁ (la tangente ' + (x.v > 0 ? 'monte' : 'descend') + ').');
      else if (proche(v, dx / x.t2, 0.05)) msgs.push('La durée est t₂ − t₁, pas la date t₂ seule.');
      else if (proche(v, dx, 0.05)) msgs.push('Il faut diviser la variation de position par la durée t₂ − t₁.');
      else if (proche(v, x.x2 / x.t2, 0.05)) msgs.push('x₂ ÷ t₂ est une vitesse moyenne depuis le départ : prenez la pente de la tangente, entre les deux points A et B.');
      else msgs.push(`Refaites le calcul : v = (${nbf(x.x2, 2)} − ${par(x.x1)}) ÷ (${x.t2} − ${x.t1}). Votre valeur est ${v > x.v ? 'trop grande' : 'trop petite'}.`);
    } else {
      const m = lireNombre(x.reps.m), i = lireNombre(x.reps.i);
      if (!isFinite(m) || !isFinite(i)) return ['Écrivez deux nombres (virgule ou point), en m/s.'];
      if (!proche(m, x.vMoy, 0.06)) msgs.push(proche(m, x.vInst, 0.05) ? 'Pour la vitesse moyenne, calculez (x₂ − x₁) ÷ Δt avec les positions aux deux dates : ce n’est pas la vitesse à la date t₀.' : `Vitesse moyenne : (${nbf(x.x1, 1)} − ${nbf(x.x0, 1)}) ÷ ${x.dt} (positions à t₀ + Δt et t₀). Votre valeur est ${m > x.vMoy ? 'trop grande' : 'trop petite'}.`);
      if (!proche(i, x.vInst, 0.06)) msgs.push(proche(i, x.vMoy, 0.05) ? 'Pour la vitesse à la date t₀, dérivez x(t) : v(t) = a t + b.' : `Vitesse à t₀ : dérivez x(t) puis remplacez t par ${x.t0}. Votre valeur est ${i > x.vInst ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'tang'
    ? `v = Δx ÷ Δt = (${nbf(defi.x2, 2)} − ${par(defi.x1)}) ÷ (${defi.t2} − ${defi.t1}) = ${nbf(defi.v, 2)} m/s.`
    : `Moyenne : x(${defi.t0}) = ${nbf(defi.x0, 2)} m et x(${defi.t0 + defi.dt}) = ${nbf(defi.x1, 2)} m, donc v moyenne = (${nbf(defi.x1, 2)} − ${nbf(defi.x0, 2)}) ÷ ${defi.dt} = ${nbf(defi.vMoy, 2)} m/s. À la date ${defi.t0} s : v(t) = ${defi.a} t + ${defi.b}, donc v = ${nbf(defi.vInst, 2)} m/s.`;
  const fnTang = defi && defi.type === 'tang' ? (t => 0.5 * defi.a * t * t + defi.b * t) : null;
  const graphDefi = defi && defi.type === 'tang' && (() => { const b = bornes({ xmin: 0, xmax: fnTang(8) }, [defi.x1, defi.x2]); return (
    <GrapheXT fn={fnTang} tmax={8} xmin={b.xmin} xmax={b.xmax} tangente={{ t0: defi.t0, v: defi.v }} points={[[defi.t1, defi.x1, 'A'], [defi.t2, defi.x2, 'B']]}
      aria={`Graphique de la position x en fonction de la date t. Une tangente à la courbe est tracée, elle passe par le point A (${defi.t1} s ; ${fr(defi.x1)} m) et le point B (${defi.t2} s ; ${fr(defi.x2)} m).`}/>); })();
  const champ = (cle, nom, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} (m/s) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en mètres par seconde`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('pxt-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['tang', 'Lire sur une tangente'], ['corde', 'Moyenne puis instantanée']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'tang' ? 'Défi : la vitesse d’après une tangente' : 'Défi : vitesse moyenne, puis vitesse à une date'}</div>
      {defi.type === 'tang'
        ? <div style={{ ...lbl, marginBottom: 8 }}>Sur le graphique de la position d’un mobile sur un rail, la <strong>tangente</strong> à la date <strong>{defi.t0} s</strong> passe par le point A (<strong>{defi.t1} s</strong> ; <strong>{nbf(defi.x1, 2)} m</strong>) et par le point B (<strong>{defi.t2} s</strong> ; <strong>{nbf(defi.x2, 2)} m</strong>). Donnez la coordonnée v<sub>x</sub> de la vitesse à la date {defi.t0} s, avec son signe (2 chiffres significatifs ; marge acceptée : 6 % de la valeur).</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>La position d’un mobile sur un rail est <strong>x(t) = {nbf(defi.a / 2, 2)} t² + {defi.b} t</strong> (x en m, t en s). Calculez la <strong>vitesse moyenne</strong> entre les dates {defi.t0} s et {defi.t0 + defi.dt} s, puis la <strong>vitesse à la date {defi.t0} s</strong> (2 chiffres significatifs ; marge acceptée : 6 % de la valeur).</div>}
      {defi.type === 'tang' ? champ('v', 'v_x', 'pxt-champ-v') : <>{champ('m', 'vitesse moyenne', 'pxt-champ-m')}{champ('i', 'vitesse à la date t₀', 'pxt-champ-i')}</>}
      <IndiceDefi cache={false}>{defi.type === 'tang' ? 'La vitesse est la pente de la tangente : v = (x_B − x_A) ÷ (t_B − t_A), avec le signe.' : 'Moyenne : (x₂ − x₁) ÷ (t₂ − t₁), avec x calculé aux deux dates. À la date t₀ : dérivez x(t) (la dérivée de a t² est 2 a t) puis remplacez t.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pxt-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{diagnostic().map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Mouvements rectilignes imposés</strong> : la position x(t) sur un axe Ox est donnée par une fonction choisie (droite ou polynôme du second degré). Les causes du mouvement ne sont pas étudiées ici.</li>
      <li><strong>Vitesse moyenne et vitesse à une date</strong> : la pente de la corde est une vitesse moyenne sur la durée Δt ; la pente de la tangente est la vitesse à une date, limite de la vitesse moyenne quand Δt tend vers zéro (c’est la dérivée de x(t)).</li>
      <li><strong>Lecture graphique idéale</strong> : les valeurs lues sur le graphique sont données avec leurs chiffres ; sur un vrai graphique, la lecture d’une pente a une incertitude de quelques pour cent.</li>
      <li><strong>Pente et échelles</strong> : la pente se calcule avec les valeurs de x et de t (en m et en s), pas avec l’angle apparent de la droite, qui dépend des échelles choisies sur les axes.</li>
      <li><strong>Vocabulaire</strong> : « v » désigne ici la coordonnée v<sub>x</sub> de la vitesse sur l’axe ; elle est négative si le mobile va vers les x décroissants. Seule la norme de la vitesse est toujours positive.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation : ce ne sont pas des mesures sur un dispositif réel.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Mouvement uniforme : changez la date t. La vitesse moyenne et la vitesse à la date t sont-elles différentes ?</li>
      <li>Mouvement qui accélère : diminuez Δt. Que deviennent la vitesse moyenne et la corde ?</li>
      <li>Mouvement de recul : quel est le signe de la vitesse ? Que fait la tangente ?</li>
      <li>Aller puis retour : cherchez la date où la tangente est horizontale. Que vaut la vitesse juste avant, juste après ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Sur x(t), la pente donne la vitesse : v = Δx ÷ Δt (corde : vitesse moyenne ; tangente : vitesse à une date)</li>
        <li>La vitesse à une date est la dérivée de la position : v = dx/dt</li>
        <li>Pente positive : v &gt; 0 ; pente négative : v &lt; 0 ; tangente horizontale : v = 0</li>
        <li>Quand Δt diminue, la vitesse moyenne tend vers la vitesse à la date t</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pxt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pxt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pxt-col { display: flex; flex-direction: column; gap: 12px; }
        .pxt-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .pxt-l1.cote .pxt-carte { order: 2; } .pxt-l1.cote .pxt-main { order: 1; }
          .pxt-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .pxt-ex > * { grid-column: 1; }
          .pxt-ex > .pxt-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .pxt-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pxt-in { animation: pxt-fondu 0.35s ease-out; } @keyframes pxt-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Lire une vitesse sur un graphique x(t)</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Sur le graphique de la position en fonction du temps, la <strong>pente</strong> donne la <strong>vitesse</strong> : celle de la <strong>corde</strong> est une vitesse moyenne, celle de la <strong>tangente</strong> est la vitesse à une date.</div>
      {!enExplore && <div className={`pxt-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="pxt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="pxt-carte">{panneauHypo}</div>}
        <div className="pxt-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'tang' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="pxt-col"><div className="pxt-in">{scene}</div></div>}
          {enDefi && graphDefi && <div className="pxt-col"><div style={styleBoite}>{graphDefi}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="pxt-ex">{animee}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
