import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./champElecModele";
import { QCM } from "./champElecQcm";
import { ChampElecExplore } from "./ChampElecExplore";
import { SceneArmatures, SvgChampCarte, SvgForceCarte, SvgBilanElecCarte } from "./ChampElecSchemas";

const SIM_ID = 267, CLE_GUIDE = 'champ-elec-guide-v1';
declarerDefis(SIM_ID, [['champ', 'Champ électrostatique entre deux armatures'], ['force', 'Force sur une particule chargée']]);

// ====================================================
//  SIM 267 — CHAMP ET FORCE ÉLECTROSTATIQUES ENTRE DEUX ARMATURES (TSTL, enseignement PCM, partie « Interactions »).
//  Une seule idée : entre deux armatures planes parallèles, le champ est uniforme, de valeur E = U / d, dirigé de l'armature + vers l'armature − ; une particule de charge q subit F = q E (sens de E si q > 0, opposé si q < 0).
//  Capacités visées (jamais affichées) : relation entre force électrostatique et champ ; caractériser le champ entre deux armatures planes ; exploiter E = U / d. Valeurs inventées, situations génériques (ions).
//  Modèle : champElecModele.js (test node). QCM : champElecQcm.js. Schémas : ChampElecSchemas.jsx. Exploration animée : ChampElecExplore.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };

// ====================================================
export function SimulationChampElec() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('champ');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ U: 300, d: 3.0, q: 1 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const IDS = ['sens', 'champ', 'dist', 'uniforme', 'forceval', 'sensf', 'tension', 'double', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const ETAPES = [
    { id: 'sens', titre: 'Deux armatures chargées', focus: ['scene'],
      texte: <>Deux <strong>armatures</strong> planes parallèles sont reliées aux bornes d’un générateur : l’une porte des charges positives (+), l’autre des charges négatives (−). Entre elles règne un <strong>champ électrostatique</strong> noté <strong>E</strong>, qui permet de prévoir la force sur une particule chargée placée entre les armatures.</>,
      tache: { type: 'qcm', q: 'Entre les armatures, le champ électrostatique est dirigé :', ...QCM.sens,
        expl: 'Par convention, le champ électrostatique entre deux armatures est dirigé de l’armature positive vers l’armature négative, perpendiculairement aux armatures.', indice: 'Le champ part des charges positives et va vers les charges négatives.' } },
    { id: 'champ', titre: 'La valeur du champ : E = U ÷ d', focus: ['scene'],
      texte: <>Entre les armatures, la valeur du champ est <strong>E = U ÷ d</strong>, où <strong>U</strong> est la tension entre les armatures (en volts, V) et <strong>d</strong> la distance qui les sépare (en <strong>mètres</strong>) : E s’exprime en V/m. Ici U = <strong>300 V</strong> et d = <strong>3,0 cm</strong>.</>,
      tache: { type: 'num', q: 'Valeur du champ E, en kV/m', unite: 'kV/m', vrai: PG.E / 1e3, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.U / 3.0 / 1e3, 'La distance doit être en mètres : 3,0 cm = 0,030 m.'], [PG.E, 'Ce résultat est en V/m : 1 kV = 1 000 V, donc divisez par 1 000 pour l’exprimer en kV/m.']],
        calcul: () => ['d = 3,0 cm = 0,030 m.', 'E = U ÷ d = 300 ÷ 0,030 = 1,0×10⁴ V/m = 10 kV/m.'], expl: 'E = 300 ÷ 0,030 = 1,0×10⁴ V/m, soit 10 kV/m.', indice: 'Convertissez d en mètres (1 cm = 0,01 m), puis divisez U par d. Divisez enfin par 1 000 pour passer de V/m à kV/m.' } },
    { id: 'dist', titre: 'Si l’on écarte les armatures', focus: ['scene'],
      texte: <>La tension reste <strong>U = 300 V</strong> ; le champ valait <strong>{nbf(PG.E / 1e3, 1)} kV/m</strong> pour d = 3,0 cm. On <strong>double la distance</strong> : d = 6,0 cm.</>,
      tache: { type: 'qcm', q: 'Que devient la valeur du champ ?', ...QCM.distance,
        expl: 'E = U ÷ d : si d est multipliée par 2 (et U inchangée), E est divisé par 2, soit 5,0 kV/m. E est inversement proportionnelle à d (et non à d²).', indice: 'Dans E = U ÷ d, que devient le quotient quand le dénominateur double ?' } },
    { id: 'uniforme', titre: 'Un champ uniforme', focus: ['scene'],
      texte: <>On place une petite particule près de l’armature +, puis au milieu, puis près de l’armature − (loin des bords des armatures).</>,
      tache: { type: 'qcm', q: 'Le champ électrostatique est-il le même aux trois endroits ?', ...QCM.uniforme,
        expl: 'Entre deux armatures planes parallèles, loin des bords, le champ est uniforme : même direction, même sens et même valeur E = U ÷ d en tout point.', indice: 'Le mot « uniforme » veut dire que la valeur et le sens ne dépendent pas de l’endroit.' } },
    { id: 'forceval', titre: 'La force sur une particule : F = |q| E', focus: ['scene'],
      retenirTitre: 'À retenir : le champ entre deux armatures',
      retenir: <>
        <SvgChampCarte/>
        <ul style={puces}>
          <li>Entre deux armatures planes parallèles, le champ est <strong>uniforme</strong>, perpendiculaire aux armatures et dirigé de l’armature <strong>+</strong> vers l’armature <strong>−</strong>.</li>
          <li>Sa valeur est <strong>E = U ÷ d</strong> (U en V, d en m, E en V/m). Exemple de la simulation : 300 V sur 3,0 cm donnent 10 kV/m.</li>
          <li>Moyen de s’en souvenir : <strong>« plus près, plus fort »</strong> : doubler d divise E par 2. Idée fausse : « le champ est plus fort près de l’armature + ». Vrai : il est le même partout.</li></ul></>,
      texte: <>Un ion de charge <strong>q = +1,6×10⁻¹⁹ C</strong> est placé entre les armatures, où le champ vaut <strong>E = 1,0×10⁴ V/m</strong>. La force électrostatique sur une particule de charge q est <strong>F = q × E</strong> : sa valeur est <strong>F = |q| × E</strong> (|q| : valeur de la charge sans son signe, en coulombs, C).</>,
      tache: { type: 'num', q: 'Valeur de la force F, en 10⁻¹⁵ N', unite: '×10⁻¹⁵ N', vrai: PG.F * 1e15, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.F * 1e15 / 1e3, 'E doit être exprimé en V/m (1,0×10⁴ V/m), pas en kV/m.'], [PG.F, 'Le résultat est en N : 1,6×10⁻¹⁵ N = 1,6 dans l’unité demandée (10⁻¹⁵ N).']],
        calcul: () => ['F = |q| × E = 1,6×10⁻¹⁹ × 1,0×10⁴ = 1,6×10⁻¹⁵ N.', 'En unité de 10⁻¹⁵ N : 1,6.'], expl: 'F = 1,6×10⁻¹⁹ × 1,0×10⁴ = 1,6×10⁻¹⁵ N.', indice: 'Multipliez la valeur de la charge par la valeur du champ : F = |q| × E, puis exprimez en 10⁻¹⁵ N.' } },
    { id: 'sensf', titre: 'Le sens de la force', focus: ['scene'],
      texte: <>Le champ est dirigé de l’armature + vers l’armature −. On remplace l’ion positif par un ion de charge <strong>négative</strong> q = −1,6×10⁻¹⁹ C. Rappel : <strong>F = q × E</strong> (vectoriel).</>,
      tache: { type: 'qcm', q: 'Cette particule est poussée :', ...QCM.sensForce,
        expl: 'Pour q < 0, la force F = q E est de sens opposé à celui du champ : la particule négative est attirée par l’armature positive.', indice: 'Si q est négatif, le vecteur F = q E a-t-il le même sens que E, ou le sens contraire ?' } },
    { id: 'tension', titre: 'Retrouver la tension', focus: ['scene'],
      retenirTitre: 'À retenir : la force sur une particule',
      retenir: <>
        <SvgForceCarte/>
        <ul style={puces}>
          <li>La force sur une particule de charge q est <strong>F = q E</strong> : sa valeur est <strong>|q| × E</strong>.</li>
          <li>Si <strong>q &gt; 0</strong>, F a le sens de E ; si <strong>q &lt; 0</strong>, F est de sens opposé.</li>
          <li>Exemple de la simulation : ion de charge +1,6×10⁻¹⁹ C dans 10 kV/m : F = 1,6×10⁻¹⁵ N. Moyen de s’en souvenir : <strong>« + suit le champ, − le fuit »</strong>.</li></ul></>,
      texte: <>Une particule de charge <strong>q = 3,2×10⁻¹⁹ C</strong> subit entre les armatures une force de valeur <strong>F = 4,8×10⁻¹⁵ N</strong>. Les armatures sont distantes de <strong>d = 2,0 cm</strong>. On cherche la tension U entre les armatures : on calcule d’abord le champ E = F ÷ |q|, puis U = E × d.</>,
      tache: { type: 'num', q: 'Tension U entre les armatures, en V', unite: 'V', vrai: PG.U2, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[PG.E2, 'C’est le champ E (en V/m) : il reste à multiplier par d pour obtenir la tension.'], [PG.E2 * 2.0, 'La distance doit être en mètres : 2,0 cm = 0,020 m.']],
        calcul: () => ['E = F ÷ |q| = 4,8×10⁻¹⁵ ÷ 3,2×10⁻¹⁹ = 1,5×10⁴ V/m.', 'U = E × d = 1,5×10⁴ × 0,020 = 300 V.'], expl: 'E = 1,5×10⁴ V/m ; U = 1,5×10⁴ × 0,020 = 300 V.', indice: 'De F = |q| × E, on tire E = F ÷ |q| ; puis, de E = U ÷ d, on tire U = E × d (d en mètres).' } },
    { id: 'double', titre: 'Deux changements à la fois', focus: ['scene'],
      texte: <>La tension U reste constante. On <strong>double la charge q</strong> de la particule <strong>et</strong> on <strong>double la distance d</strong> entre les armatures.</>,
      tache: { type: 'qcm', q: 'La valeur de la force sur la particule est :', ...QCM.double,
        expl: 'F = |q| × E = |q| × U ÷ d : q double (F × 2) et d double (E ÷ 2), donc F est inchangée.', indice: 'Écrivez F = |q| × U ÷ d et regardez ce que devient chaque grandeur.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : champ et force',
      retenir: <>
        <SvgBilanElecCarte/>
        <ul style={puces}>
          <li><strong>E = U ÷ d</strong> (champ uniforme entre deux armatures planes parallèles) et <strong>F = |q| × E</strong>, avec le sens donné par le signe de q.</li>
          <li>Exemple : U = 300 V, d = 2,0 cm : E = 1,5×10⁴ V/m ; q = 3,2×10⁻¹⁹ C : F = 4,8×10⁻¹⁵ N.</li>
          <li>Moyen de s’en souvenir : <strong>« la tension crée le champ, le champ pousse la charge »</strong>. Idée fausse : « la force dépend de l’endroit entre les armatures ». Vrai : elle est la même partout.</li></ul></>,
      texte: <>Vous savez caractériser le champ entre deux armatures planes (uniforme, de l’armature + vers l’armature −, E = U ÷ d) et calculer la force sur une particule chargée (F = |q| E, sens selon le signe de q). Explorez en déplaçant les armatures et la particule, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SC = {
    sens: { champE: false }, champ: { U: '300 V', d: '3,0 cm' }, dist: { U: '300 V', d: '6,0 cm' }, uniforme: { U: '300 V', d: '3,0 cm' },
    forceval: { U: '300 V', d: '3,0 cm', q: 1 }, sensf: { q: -1, force: false }, tension: { d: '2,0 cm', q: 1, force: true }, double: { U: '300 V', q: 1, force: true }, fin: { U: '300 V', d: '2,0 cm', q: 1, force: true },
  };

  // ════════════════ EXPLORATION ════════════════
  const animee = enExplore && <ChampElecExplore ex={ex} setEx={setEx}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les armatures, le champ et la force</div>
      <SceneArmatures {...SC[idEtape]}/>
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'champ' ? { ...M.tirageDefiChamp(), type, reps: { e: '' }, verifie: false, corr: false } : { ...M.tirageDefiForce(), type, reps: { e: '', f: '', s: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const sensVrai = x => (x.signe > 0 ? '-' : '+'); // + : particule poussée vers l'armature +, - : vers l'armature −
  const verifier = () => {
    const ok = defi.type === 'champ' ? proche(lireNombre(defi.reps.e), defi.E, 0.06) : (proche(lireNombre(defi.reps.e), defi.E, 0.06) && proche(lireNombre(defi.reps.f), defi.F, 0.06) && defi.reps.s === sensVrai(defi));
    setDefi(x => ({ ...x, verifie: true, ok })); (defi.type === 'champ' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnosticChamp = e => {
    const x = defi;
    if (!isFinite(e)) return ['Écrivez un nombre (virgule ou point), en kV/m.'];
    if (proche(e, x.E * 10, 0.05)) return ['La distance doit être en mètres avant de diviser : ' + fr(x.dcm) + ' cm = ' + fr(x.dcm / 100) + ' m.'];
    if (proche(e, x.E * 1e3, 0.05)) return ['Votre résultat semble être en V/m : divisez par 1 000 pour l’exprimer en kV/m.'];
    if (proche(e, x.E / 10, 0.05)) return ['Vérifiez la conversion de d en mètres (1 cm = 0,01 m) : votre valeur est trop petite.'];
    return [`Refaites le calcul : E = U ÷ d = ${x.U} ÷ ${fr(x.dcm / 100)}, puis ÷ 1 000 pour les kV/m. Votre valeur est ${e > x.E ? 'trop grande' : 'trop petite'}.`];
  };
  const diagnostic = () => {
    const x = defi, msgs = [];
    if (x.type === 'champ') return diagnosticChamp(lireNombre(x.reps.e));
    const e = lireNombre(x.reps.e), f = lireNombre(x.reps.f);
    if (!isFinite(e) || !isFinite(f)) return ['Écrivez deux nombres (virgule ou point) : E en kV/m et F en 10⁻¹⁵ N, puis choisissez le sens.'];
    if (!proche(e, x.E, 0.06)) return diagnosticChamp(e);
    if (!proche(f, x.F, 0.06)) msgs.push(proche(f, x.F * 1e3, 0.05) ? 'E doit être en V/m dans F = |q| × E : 1 kV/m = 1 000 V/m.' : proche(f, x.F / x.n, 0.05) ? 'N’oubliez pas le nombre de charges élémentaires : |q| = ' + x.n + ' × 1,6×10⁻¹⁹ C.' : `Votre E est bon ; F = |q| × E = ${x.n} × 1,6×10⁻¹⁹ × E (en V/m). Votre valeur est ${f > x.F ? 'trop grande' : 'trop petite'}.`);
    if (x.reps.s !== sensVrai(x)) msgs.push(x.signe > 0 ? 'La charge est positive : la force a le sens du champ, donc vers l’armature −.' : 'La charge est négative : la force est de sens opposé au champ, donc vers l’armature +.');
    return msgs;
  };
  const correction = () => defi.type === 'champ'
    ? `E = U ÷ d = ${defi.U} ÷ ${fr(defi.dcm / 100)} = ${nbf(defi.E * 1e3, 0)} V/m = ${nbf(defi.E, 1)} kV/m.`
    : `E = U ÷ d = ${defi.U} ÷ ${fr(defi.dcm / 100)} = ${nbf(defi.E, 1)} kV/m ; F = |q| × E = ${defi.n} × 1,6×10⁻¹⁹ × ${nbf(defi.E * 1e3, 0)} = ${nbf(defi.F, 1)}×10⁻¹⁵ N ; la charge est ${defi.signe > 0 ? 'positive : F a le sens du champ, vers l’armature −' : 'négative : F est de sens opposé au champ, vers l’armature +'}.`;
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} ({unite}) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en ${unite}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('cel-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['champ', 'Champ entre deux armatures'], ['force', 'Force sur une particule']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'champ' ? 'Défi : le champ entre deux armatures' : 'Défi : la force sur une particule'}</div>
      {defi.type === 'champ'
        ? <div style={{ ...lbl, marginBottom: 8 }}>Deux armatures planes parallèles sont reliées à un générateur qui impose la tension <strong>U = {defi.U} V</strong>. Elles sont distantes de <strong>d = {fr(defi.dcm.toFixed(1))} cm</strong>. Donnez la valeur du champ électrostatique entre elles, en <strong>kV/m</strong> (2 chiffres significatifs ; marge acceptée : 6 % de la valeur).</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>Une particule de charge <strong>q = {defi.signe > 0 ? '+' : '−'}{defi.n} × 1,6×10⁻¹⁹ C</strong> est placée entre deux armatures planes parallèles, distantes de <strong>d = {fr(defi.dcm.toFixed(1))} cm</strong>, entre lesquelles la tension est <strong>U = {defi.U} V</strong>. Donnez la valeur du champ E (en kV/m), la valeur de la force F (en 10⁻¹⁵ N) et le sens vers lequel la particule est poussée (2 chiffres significatifs ; marge acceptée : 6 %). L’armature + est à gauche et l’armature − à droite.</div>}
      {defi.type === 'champ' ? champ('e', 'E', 'kV/m', 'cel-champ-e') : <>{champ('e', 'E', 'kV/m', 'cel-champ-e')}{champ('f', 'F', '10⁻¹⁵ N', 'cel-champ-f')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8, fontSize: 14 }}><span>Sens :</span>
          {[['+', 'vers l’armature + (gauche)'], ['-', 'vers l’armature − (droite)']].map(([v, l]) => <button key={v} onClick={() => change('s', v)} aria-pressed={defi.reps.s === v} style={stylePetitBouton(defi.reps.s === v, '#7c3aed')}>{l}</button>)}</div></>}
      <IndiceDefi cache={false}>{defi.type === 'champ' ? 'E = U ÷ d avec d en mètres (1 cm = 0,01 m). Le résultat est en V/m : ÷ 1 000 pour les kV/m.' : 'E = U ÷ d ; F = |q| × E avec E en V/m. Pour le sens : q positive, F a le sens de E (de + vers −) ; q négative, sens opposé.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cel-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{diagnostic().map((m, i) => <li key={i}>{avecIndices(m)}</li>)}{diagnostic().length === 0 && <li>Il manque le sens de la force : choisissez-le ci-dessus.</li>}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Champ uniforme</strong> : les armatures sont planes, parallèles, très grandes devant leur distance d ; on néglige les effets de bord, donc E = U ÷ d est la même valeur en tout point entre les armatures.</li>
      <li><strong>Tension constante</strong> : le générateur maintient U ; quand on change d, c’est U qui reste fixée (et non la charge des armatures).</li>
      <li><strong>Vide ou air</strong> : le milieu entre les armatures n’intervient pas dans la valeur du champ.</li>
      <li><strong>Particule ponctuelle</strong> : on étudie la force électrostatique seule ; le poids de la particule (extrêmement petit) est négligé devant elle et la particule ne modifie pas le champ.</li>
      <li><strong>Charge élémentaire arrondie</strong> : e = 1,6×10⁻¹⁹ C ; les valeurs des tensions et distances sont inventées pour la simulation.</li>
      <li><strong>Mouvement de l’exploration</strong> : quand on lâche la particule, son mouvement est montré au ralenti et de façon qualitative (il ne sert qu’à voir le sens de la force) ; son étude fait l’objet d’autres simulations.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Écartez les armatures sans changer la tension : que devient le champ ? et la force sur la particule ?</li>
      <li>Déplacez la particule d’une armature à l’autre : la flèche de force change-t-elle ?</li>
      <li>Passez d’une charge positive à une charge négative : que devient le sens de la force ?</li>
      <li>Doublez la tension : que deviennent E et F ? Même question en doublant la charge.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Champ entre deux armatures planes : uniforme, de + vers −, E = U ÷ d (U en V, d en m, E en V/m)</li>
        <li>Force sur une charge q : F = q E, de valeur |q| × E</li>
        <li>q &gt; 0 : F de même sens que E ; q &lt; 0 : F de sens opposé</li>
        <li>Même E et même F en tout point entre les armatures</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cel-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cel-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cel-col { display: flex; flex-direction: column; gap: 12px; }
        .cel-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .cel-l1.cote .cel-carte { order: 2; } .cel-l1.cote .cel-main { order: 1; } }
        @media (max-width: 900px) { .cel-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cel-in { animation: cel-fondu 0.35s ease-out; } @keyframes cel-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Champ et force électrostatiques entre deux armatures</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Entre deux armatures planes, le <strong>champ</strong> est uniforme, de valeur <strong>E = U ÷ d</strong> ; une particule chargée subit la <strong>force F = q E</strong>, dans le sens du champ si q &gt; 0, en sens opposé si q &lt; 0.</div>
      {!enExplore && <div className={`cel-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="cel-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="cel-carte">{panneauHypo}</div>}
        <div className="cel-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'champ' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="cel-col"><div className="cel-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="cel-ex">{animee}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
