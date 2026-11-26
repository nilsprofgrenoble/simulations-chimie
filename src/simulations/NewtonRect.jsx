import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./newtonRectModele";
import { QCM } from "./newtonRectQcm";
import { NewtonRectExplore } from "./NewtonRectExplore";
import { SceneChariot, SvgBilanCarte, SvgDeuxiemeLoiCarte, SvgInertieCarte } from "./NewtonRectSchemas";

const SIM_ID = 268, CLE_GUIDE = 'newton-rect-guide-v1';
declarerDefis(SIM_ID, [['acc', 'Accélération d’un chariot poussé'], ['frott', 'Force de frottement sur un chariot']]);

// ====================================================
//  SIM 268 — BILAN DES FORCES ET LOIS DE NEWTON SUR UN MOUVEMENT RECTILIGNE (TSTL, enseignement PCM, partie « Interactions »).
//  Une seule idée : on fait le bilan des forces sur l'axe du mouvement ; ΣF = m a ; ΣF = 0 ⇔ vitesse constante (principe d'inertie) ; actions réciproques.
//  Capacités visées (jamais affichées) : bilan des forces sur un système ; relier somme des forces, masse et accélération ; principe d'inertie ; actions réciproques. Chariot sur un rail : situation inventée.
//  Modèle : newtonRectModele.js (test node). QCM : newtonRectQcm.js. Schémas : NewtonRectSchemas.jsx. Exploration animée : NewtonRectExplore.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };

// ====================================================
export function SimulationNewtonRect() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('acc');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ F: 8, f: 2, m: 2, v0: 0 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const IDS = ['vertical', 'uniforme', 'somme', 'acc', 'masse', 'masse2', 'arret', 'inertie', 'reciproque', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const ETAPES = [
    { id: 'vertical', titre: 'Un chariot immobile', focus: ['scene'],
      texte: <>Un chariot repose sur un rail horizontal. Deux forces s’exercent sur lui : son <strong>poids P</strong>, de valeur <strong>20 N</strong>, vers le bas, et la <strong>réaction R du rail</strong>, perpendiculaire au rail. Le chariot reste immobile : on fait le <strong>bilan des forces</strong>, c’est-à-dire la liste de toutes les forces qui s’exercent sur lui.</>,
      tache: { type: 'qcm', q: 'La réaction R du rail est :', ...QCM.reaction,
        expl: 'Le chariot est immobile : la somme des forces est nulle. La réaction du rail compense le poids : même valeur (20 N), sens opposé (vers le haut).', indice: 'Immobile : les deux forces verticales se compensent. Quelle valeur et quel sens faut-il pour compenser un poids de 20 N ?' } },
    { id: 'uniforme', titre: 'À vitesse constante', focus: ['scene'],
      texte: <>On tire le chariot : il avance en ligne droite à <strong>vitesse constante</strong> sous l’action d’une poussée horizontale <strong>F = 6 N</strong> (vers la droite). Outre le poids P et la réaction R, un <strong>frottement f</strong> du rail s’oppose au glissement, vers l’arrière.</>,
      tache: { type: 'qcm', q: 'La force de frottement f est :', ...QCM.uniforme,
        expl: 'La vitesse est constante : la somme des forces est nulle. Sur l’axe horizontal, le frottement compense la poussée : f = F = 6 N, vers l’arrière.', indice: 'Vitesse constante : que vaut la somme des forces horizontales ? Que doit valoir f pour compenser F ?' } },
    { id: 'somme', titre: 'La somme des forces', focus: ['scene'],
      retenirTitre: 'À retenir : le bilan des forces',
      retenir: <>
        <SvgBilanCarte/>
        <ul style={puces}>
          <li>Pour étudier un mouvement, on dresse le <strong>bilan des forces</strong> sur le système, puis on cherche leur <strong>somme ΣF</strong> (en tenant compte des sens).</li>
          <li>Sur le <strong>rail horizontal</strong>, le poids et la réaction se compensent : seules comptent la poussée F et le frottement f.</li>
          <li>Moyen de s’en souvenir : <strong>« on additionne dans le sens du mouvement, on soustrait contre le mouvement »</strong>. Idée fausse : « une force qui ne bouge pas n’est pas une force ». Vrai : elle existe, mais elle est compensée.</li></ul></>,
      texte: <>La poussée est maintenant <strong>F = 10 N</strong> vers la droite et le frottement vaut <strong>f = 4 N</strong> vers la gauche (le poids et la réaction se compensent toujours). On cherche la valeur de la <strong>somme des forces ΣF</strong> sur l’axe horizontal, orienté vers la droite.</>,
      tache: { type: 'num', q: 'Valeur de la somme des forces ΣF, en N', unite: 'N', vrai: PG.S, tol: 0.03, affiche: v => nbf(v, 0), cs: 1,
        pieges: [[PG.F + PG.f, 'Le frottement est dirigé vers la gauche, à l’opposé de la poussée : on le soustrait au lieu de l’ajouter.'], [PG.F, 'Vous avez oublié le frottement : il s’oppose à la poussée et diminue la somme des forces.']],
        calcul: () => ['Axe vers la droite : F = +10 N, frottement = −4 N.', 'ΣF = 10 − 4 = 6 N, dirigée vers la droite.'], expl: 'ΣF = 10 − 4 = 6 N, vers la droite.', indice: 'La poussée et le frottement sont de sens opposés : calculez la différence de leurs valeurs.' } },
    { id: 'acc', titre: 'La deuxième loi : ΣF = m a', focus: ['scene'],
      texte: <>La somme des forces sur l’axe horizontal vaut <strong>ΣF = 6 N</strong> (vers la droite). Le chariot a une <strong>masse m = 2,0 kg</strong>. D’après la <strong>deuxième loi de Newton</strong>, <strong>ΣF = m × a</strong> : la somme des forces est égale à la masse multipliée par l’accélération <strong>a</strong> (en m/s²).</>,
      tache: { type: 'num', q: 'Accélération a du chariot, en m/s²', unite: 'm/s²', vrai: PG.a, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.F / PG.m, 'Vous avez utilisé la poussée seule (10 N) : il faut la somme des forces ΣF = 6 N.'], [PG.S * PG.m, 'On divise la somme des forces par la masse : a = ΣF ÷ m (et non ΣF × m).']],
        calcul: () => ['ΣF = m × a, donc a = ΣF ÷ m.', 'a = 6 ÷ 2,0 = 3,0 m/s².'], expl: 'a = 6 ÷ 2,0 = 3,0 m/s², dirigée vers la droite.', indice: 'Isolez a dans ΣF = m a : a = ΣF ÷ m, avec ΣF en newtons et m en kilogrammes.' } },
    { id: 'masse', titre: 'Un chariot deux fois plus lourd', focus: ['scene'],
      texte: <>On refait l’expérience avec un chariot de <strong>masse double</strong> (4,0 kg), soumis à la <strong>même somme des forces</strong> ΣF = 6 N. Le premier chariot avait l’accélération <strong>a = 3,0 m/s²</strong>.</>,
      tache: { type: 'qcm', q: 'L’accélération du chariot de 4,0 kg est :', ...QCM.masse,
        expl: 'a = ΣF ÷ m : pour une même somme des forces, une masse deux fois plus grande donne une accélération deux fois plus petite : 1,5 m/s².', indice: 'Dans a = ΣF ÷ m, que devient le quotient quand le dénominateur double ?' } },
    { id: 'masse2', titre: 'Retrouver la masse', focus: ['scene'],
      texte: <>Un autre chariot, soumis à une somme des forces <strong>ΣF = 12 N</strong>, acquiert une accélération <strong>a = 4,0 m/s²</strong>. On cherche sa <strong>masse</strong> m, en kilogrammes.</>,
      tache: { type: 'num', q: 'Masse m du chariot, en kg', unite: 'kg', vrai: PG.m2, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.S2 * PG.a2, 'On a multiplié ΣF par a : de ΣF = m a, on tire m = ΣF ÷ a.'], [PG.a2 / PG.S2 * 10, 'Le quotient est inversé : m = ΣF ÷ a (et non a ÷ ΣF).']],
        calcul: () => ['ΣF = m × a, donc m = ΣF ÷ a.', 'm = 12 ÷ 4,0 = 3,0 kg.'], expl: 'm = 12 ÷ 4,0 = 3,0 kg.', indice: 'De ΣF = m a, on tire m = ΣF ÷ a.' } },
    { id: 'arret', titre: 'On cesse de pousser', focus: ['scene'],
      retenirTitre: 'À retenir : la deuxième loi de Newton',
      retenir: <>
        <SvgDeuxiemeLoiCarte/>
        <ul style={puces}>
          <li><strong>ΣF = m a</strong> : l’accélération a <strong>même direction et même sens</strong> que la somme des forces ; sa valeur est a = ΣF ÷ m (ΣF en N, m en kg, a en m/s²).</li>
          <li>Exemple : ΣF = 8 N sur un chariot de 4,0 kg : a = 2,0 m/s². À même ΣF, une masse double donne une accélération deux fois plus petite.</li>
          <li>Moyen de s’en souvenir : <strong>« plus c’est lourd, moins ça accélère »</strong>. Idée fausse : « la vitesse est proportionnelle à la force ». Vrai : c’est l’<strong>accélération</strong> qui est proportionnelle à ΣF.</li></ul></>,
      texte: <>Le chariot avance vers la droite. On <strong>cesse de le pousser</strong> (F = 0) ; il reste seulement le frottement f, dirigé vers l’arrière, ainsi que le poids et la réaction qui se compensent.</>,
      tache: { type: 'qcm', q: 'Après l’arrêt de la poussée, la vitesse du chariot :', ...QCM.arret,
        expl: 'ΣF = −f est dirigée vers l’arrière : l’accélération est dirigée vers l’arrière, donc la vitesse diminue jusqu’à s’annuler (puis le chariot reste immobile, le frottement ne le fait pas repartir).', indice: 'Quelle est la somme des forces horizontales ? Dans quel sens est alors l’accélération, par rapport à la vitesse ?' } },
    { id: 'inertie', titre: 'Le principe d’inertie', focus: ['scene'],
      texte: <>Un chariot glisse sur un rail <strong>presque sans frottement</strong> : la somme des forces qui s’exercent sur lui est <strong>nulle</strong> (ΣF = 0). On l’observe en mouvement rectiligne.</>,
      tache: { type: 'qcm', q: 'Peut-on en conclure que le chariot est immobile ?', ...QCM.inertie,
        expl: 'D’après le principe d’inertie, si la somme des forces est nulle, le système est immobile ou en mouvement rectiligne uniforme : sa vitesse reste constante.', indice: 'ΣF = 0 donne a = 0. Que dit alors l’accélération nulle de la vitesse ?' } },
    { id: 'reciproque', titre: 'Les actions réciproques', focus: ['scene'],
      texte: <>Un moteur pousse le chariot avec une force de valeur <strong>10 N</strong>, dirigée vers la droite. D’après le <strong>principe des actions réciproques</strong>, si un système A exerce une force sur un système B, alors B exerce sur A une force de même valeur, de même direction et de sens opposé.</>,
      tache: { type: 'qcm', q: 'Le chariot exerce sur le moteur une force de :', ...QCM.reciproque,
        expl: 'Actions réciproques : le chariot exerce sur le moteur une force de 10 N, vers la gauche. Ces deux forces s’exercent sur des systèmes différents : elles ne se compensent pas.', indice: 'Les deux forces ont la même valeur et la même direction ; leur sens est-il identique ou opposé ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : le principe d’inertie',
      retenir: <>
        <SvgInertieCarte/>
        <ul style={puces}>
          <li><strong>ΣF = 0</strong> ⇔ vitesse constante : le système est immobile ou en mouvement rectiligne uniforme (principe d’inertie).</li>
          <li><strong>ΣF ≠ 0</strong> : la vitesse varie ; ΣF = m a donne l’accélération. Actions réciproques : A sur B et B sur A, même valeur, sens opposés.</li>
          <li>Moyen de s’en souvenir : <strong>« force nulle = vitesse qui ne change pas »</strong>. Idée fausse : « sans force, tout finit par s’arrêter ». Vrai : un objet s’arrête à cause des frottements, qui sont des forces.</li></ul></>,
      texte: <>Vous savez faire le bilan des forces sur un mouvement rectiligne, calculer la somme des forces, appliquer ΣF = m a, utiliser le principe d’inertie et les actions réciproques. Explorez en poussant le chariot vous-même, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SC = {
    vertical: { verticales: true }, uniforme: { poussee: 6, frott: 6, mouvement: true }, somme: { poussee: 10, frott: 4, somme: true }, acc: { poussee: 10, frott: 4, somme: true },
    masse: { poussee: 10, frott: 4, somme: true }, masse2: { poussee: 16, frott: 4, somme: true }, arret: { poussee: 0, frott: 4, mouvement: true },
    inertie: { poussee: 0, frott: 0, somme: true, mouvement: true }, reciproque: { poussee: 10, frott: 0 }, fin: { poussee: 10, frott: 4, somme: true },
  };

  // ════════════════ EXPLORATION ════════════════
  const animee = enExplore && <NewtonRectExplore ex={ex} setEx={setEx}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le chariot et les forces</div>
      <SceneChariot {...SC[idEtape]}/>
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'acc' ? { ...M.tirageDefiAcc(), type, reps: { s: '', a: '' }, verifie: false, corr: false } : { ...M.tirageDefiFrott(), type, reps: { f: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const ok = defi.type === 'acc' ? (proche(lireNombre(defi.reps.s), defi.S, 0.06) && proche(lireNombre(defi.reps.a), defi.a, 0.06)) : proche(lireNombre(defi.reps.f), defi.fv, 0.06);
    setDefi(x => ({ ...x, verifie: true, ok })); (defi.type === 'acc' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, msgs = [];
    if (x.type === 'acc') {
      const s = lireNombre(x.reps.s), a = lireNombre(x.reps.a);
      if (!isFinite(s) || !isFinite(a)) return ['Écrivez deux nombres (virgule ou point) : ΣF en N et a en m/s².'];
      if (!proche(s, x.S, 0.06)) msgs.push(proche(s, x.F, 0.05) ? 'Vous avez oublié le frottement : il s’oppose à la poussée, donc ΣF = F − f.' : proche(s, x.F + x.f, 0.05) ? 'Le frottement est dirigé à l’opposé de la poussée : il faut le soustraire (ΣF = F − f), pas l’ajouter.' : `Refaites ΣF = F − f = ${x.F} − ${x.f} : votre valeur est ${s > x.S ? 'trop grande' : 'trop petite'}.`);
      if (!proche(a, x.a, 0.06)) msgs.push(proche(a, x.F / x.m, 0.05) ? 'Utilisez la somme des forces ΣF, pas la poussée seule : a = ΣF ÷ m.' : proche(a, x.S * x.m, 0.05) ? 'On divise ΣF par la masse : a = ΣF ÷ m (et non ΣF × m).' : proche(a, x.a, 0.06) ? '' : `Calculez a = ΣF ÷ m avec ΣF = ${fr(x.S)} N et m = ${fr(x.m.toFixed(1))} kg : votre valeur est ${a > x.a ? 'trop grande' : 'trop petite'}.`);
      return msgs.filter(Boolean);
    }
    const f = lireNombre(x.reps.f);
    if (!isFinite(f)) return ['Écrivez un nombre (virgule ou point), en N.'];
    if (proche(f, x.F + x.m * x.a, 0.05)) return ['Le frottement s’oppose à la poussée : ΣF = F − f, donc f = F − m a (et non F + m a).'];
    if (proche(f, x.m * x.a, 0.05)) return ['m a est la somme des forces ΣF, pas le frottement : f = F − ΣF = F − m a.'];
    if (proche(f, x.F, 0.05)) return ['F est la poussée ; le frottement est ce qui manque pour retrouver ΣF = m a : f = F − m a.'];
    return [`Refaites : ΣF = m a = ${fr(x.m.toFixed(1))} × ${fr(x.a)}, puis f = F − ΣF. Votre valeur est ${f > x.fv ? 'trop grande' : 'trop petite'}.`];
  };
  const correction = () => defi.type === 'acc'
    ? `ΣF = F − f = ${defi.F} − ${defi.f} = ${defi.S} N ; a = ΣF ÷ m = ${defi.S} ÷ ${fr(defi.m.toFixed(1))} = ${nbf(defi.a, 2)} m/s², dirigée dans le sens de la poussée.`
    : `ΣF = m × a = ${fr(defi.m.toFixed(1))} × ${fr(defi.a)} = ${nbf(defi.m * defi.a, 2)} N ; ΣF = F − f, donc f = F − ΣF = ${defi.F} − ${nbf(defi.m * defi.a, 2)} = ${nbf(defi.fv, 1)} N.`;
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} ({unite}) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en ${unite}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('nrc-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['acc', 'Accélération'], ['frott', 'Force de frottement']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0b4f94')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'acc' ? 'Défi : l’accélération d’un chariot poussé' : 'Défi : la force de frottement'}</div>
      {defi.type === 'acc'
        ? <div style={{ ...lbl, marginBottom: 8 }}>Un chariot de masse <strong>m = {fr(defi.m.toFixed(1))} kg</strong> glisse sur un rail horizontal. Il est poussé vers la droite par une force <strong>F = {defi.F} N</strong> ; le rail exerce un frottement <strong>f = {defi.f} N</strong> vers la gauche. Donnez la valeur de la somme des forces ΣF sur l’axe horizontal (en N) et celle de l’accélération a (en m/s²) (2 chiffres significatifs ; marge acceptée : 6 %).</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>Un chariot de masse <strong>m = {fr(defi.m.toFixed(1))} kg</strong> est poussé vers la droite par une force <strong>F = {defi.F} N</strong>. On mesure son accélération : <strong>a = {fr(defi.a)} m/s²</strong>, dirigée vers la droite. Le poids et la réaction se compensent. Donnez la valeur de la force de frottement f (en N) (2 chiffres significatifs ; marge acceptée : 6 %).</div>}
      {defi.type === 'acc' ? <>{champ('s', 'ΣF', 'N', 'nrc-defi-s')}{champ('a', 'a', 'm/s²', 'nrc-defi-a')}</> : champ('f', 'f', 'N', 'nrc-defi-f')}
      <IndiceDefi cache={false}>{defi.type === 'acc' ? 'ΣF = F − f (le frottement s’oppose à la poussée) ; a = ΣF ÷ m, avec m en kg.' : 'ΣF = m × a ; ΣF = F − f, donc f = F − ΣF.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="nrc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
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
      <li><strong>Mouvement rectiligne</strong> : le chariot est étudié sur un axe horizontal, orienté vers la droite ; il est assimilé à un point matériel de masse constante.</li>
      <li><strong>Référentiel</strong> : le rail, lié au sol, est supposé galiléen : les lois de Newton s’y appliquent.</li>
      <li><strong>Poids et réaction</strong> : verticalement, ils se compensent (le chariot ne décolle pas du rail et ne s’y enfonce pas) ; seules les forces horizontales changent le mouvement.</li>
      <li><strong>Frottement</strong> : modélisé par une force constante f, opposée au glissement ; à l’arrêt, il compense la poussée tant que celle-ci ne dépasse pas f ; il ne fait jamais repartir le chariot. C’est un modèle simple, pas une mesure réelle.</li>
      <li><strong>Pas de frottement de l’air</strong> et pas de variation de la masse ; le poids de 20 N correspond à g arrondi à 10 N/kg dans le parcours (9,8 N/kg dans l’exploration) ; toutes les valeurs sont inventées.</li>
      <li><strong>Calcul de l’exploration</strong> : l’accélération est constante tant que les forces ne changent pas ; la vitesse et la position sont calculées pas à pas à partir de ΣF = m a.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0b4f94')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Règle la poussée F égale au frottement f : que devient la vitesse ? et la somme des forces ?</li>
      <li>Garde la même poussée et double la masse : que devient l’accélération ?</li>
      <li>Lance le chariot à 3 m/s sans le pousser (F = 0), avec puis sans frottement : comparez les courbes v(t).</li>
      <li>Pousse vers la gauche (flèche à gauche du chariot) alors qu’il avance vers la droite : que devient sa vitesse ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Bilan des forces : poids et réaction se compensent ; sur l’axe du mouvement, ΣF = F + (frottement)</li>
        <li>Deuxième loi de Newton : ΣF = m a ; a a le sens de ΣF</li>
        <li>ΣF = 0 : vitesse constante (immobile ou mouvement rectiligne uniforme)</li>
        <li>Actions réciproques : même valeur, sens opposés, sur deux systèmes différents</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .nrc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .nrc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .nrc-col { display: flex; flex-direction: column; gap: 12px; }
        .nrc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .nrc-l1.cote .nrc-carte { order: 2; } .nrc-l1.cote .nrc-main { order: 1; } }
        @media (max-width: 900px) { .nrc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .nrc-in { animation: nrc-fondu 0.35s ease-out; } @keyframes nrc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Bilan des forces et lois de Newton sur un mouvement rectiligne</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On dresse le <strong>bilan des forces</strong> sur un chariot, on en déduit la <strong>somme ΣF</strong>, puis son mouvement : <strong>ΣF = m a</strong> ; si ΣF = 0, la vitesse est constante.</div>
      {!enExplore && <div className={`nrc-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="nrc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="nrc-carte">{panneauHypo}</div>}
        <div className="nrc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'acc' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="nrc-col"><div className="nrc-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="nrc-ex">{animee}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
