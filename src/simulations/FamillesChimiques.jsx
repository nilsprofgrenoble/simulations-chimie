import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression } from "../commun";
import { element, ELEMENTS, FAMILLES, HORS_LISTE, ionProbable, etatEntite, configTxt, valence, ionTxt, sub,
  REACTIONS, PRECIPITES, bilanEquation, composeIonique, formuleIonique, nomIonique, CATIONS, ANIONS } from "./atomesModele";
import { SchemaAtome, TableauPeriodique, COULEURS_FAMILLE } from "./atomesVue";

// ====================================================
//  SIM 58 — FAMILLES CHIMIQUES (2GT, « Modéliser la matière à l'échelle microscopique »)
//  Atelier 1 : le tableau périodique (colonnes = même nombre d'électrons de valence = même famille, même ion).
//  Atelier 2 : réactions des métaux alcalins et alcalino-terreux avec l'eau (équilibrer atomes et charges).
//  Atelier 3 : composés ioniques (électroneutralité, formule, nom). Atelier 4 : halogénures et ion argent (précipités).
//  Parcours guidé, exploration libre, 3 défis. Modèle : atomesModele.js.
// ====================================================

const SIM = 58;
declarerDefis(SIM, [
  ['famille', 'Reconnaître une famille'],
  ['equation', 'Équilibrer une équation'],
  ['formule', 'Formule d’un composé ionique'],
]);

const VERT = '#15803d', ORANGE = '#b45309';
const alea = l => l[Math.floor(Math.random() * l.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const eq = (reaction, coefs) => {
  const part = (liste, deb) => liste.map((e, k) => `${coefs[deb + k] > 1 ? coefs[deb + k] : ''}${e.f}`).join(' + ');
  const nR = reaction.reactifs.length;
  return `${part(reaction.reactifs, 0)} → ${part(reaction.produits, nR)}`;
};
const symFam = { alcalin: 'alcalin', terreux: 'alcalino-terreux', halogene: 'halogène', noble: 'gaz noble' };
const IONS_FAM = { 1: 'X⁺', 2: 'X²⁺', 17: 'X⁻', 18: 'aucun ion' };
const TITRES = { famille: 'Reconnaître une famille', equation: 'Équilibrer une équation', formule: 'Formule d’un composé ionique' };

function nouveauDefi(type, prec) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'famille') {
    let e; do { e = alea(ELEMENTS.filter(x => x.famille && x.Z > 2)); } while (prec && prec.type === 'famille' && prec.Z === e.Z);
    return { ...base, Z: e.Z };
  }
  if (type === 'equation') { let k; do { k = alea(Object.keys(REACTIONS)); } while (prec && prec.type === 'equation' && prec.cle === k); return { ...base, cle: k }; }
  let c, a; do { c = alea(CATIONS); a = alea(ANIONS); } while (prec && prec.type === 'formule' && prec.c === c.sym && prec.a === a.sym);
  return { ...base, c: c.sym, a: a.sym };
}

function Stepper({ valeur, onChange, min = 1, max = 4, label }) {
  const b = { width: 26, height: 26, borderRadius: 6, border: `1.5px solid ${KIT.bord}`, background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 15, color: KIT.txt, padding: 0 };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} role="group" aria-label={label}>
    <button onClick={() => onChange(clamp(valeur - 1, min, max))} style={b} aria-label={`diminuer ${label}`}>−</button>
    <strong style={{ minWidth: 18, textAlign: 'center', fontSize: 16 }}>{valeur}</strong>
    <button onClick={() => onChange(clamp(valeur + 1, min, max))} style={b} aria-label={`augmenter ${label}`}>+</button></span>;
}

// équation avec coefficients modifiables
function EquationEditable({ reaction, coefs, setCoefs }) {
  const nR = reaction.reactifs.length;
  const especes = [...reaction.reactifs, ...reaction.produits];
  const bil = bilanEquation(reaction, coefs);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 17, fontWeight: 700, color: KIT.txt, margin: '6px 0' }}>
        {especes.map((e, k) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {k === nR ? <span style={{ margin: '0 6px' }}>→</span> : k > 0 ? <span>+</span> : null}
          <Stepper valeur={coefs[k]} onChange={v => setCoefs(c => c.map((x, i) => (i === k ? v : x)))} label={`coefficient de ${e.f}`}/>
          <span>{e.f}<span style={{ fontSize: 12, color: KIT.txt2, fontWeight: 600 }}> ({e.etat})</span></span></span>)}
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: 13.5, margin: '6px 0' }}>
        <thead><tr style={{ color: KIT.txt2, textAlign: 'left' }}><th style={{ padding: '2px 10px 2px 0' }}>Conservation</th><th style={{ padding: '2px 10px' }}>à gauche</th><th style={{ padding: '2px 10px' }}>à droite</th><th/></tr></thead>
        <tbody>
          {bil.lignes.map(l => <tr key={l.a} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '2px 10px 2px 0' }}>atomes {l.a}</td><td style={{ padding: '2px 10px' }}>{l.g}</td><td style={{ padding: '2px 10px' }}>{l.d}</td>
            <td style={{ fontWeight: 800, color: l.g === l.d ? VERT : ORANGE }}>{l.g === l.d ? '✓' : '≠'}</td></tr>)}
          <tr style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '2px 10px 2px 0' }}>charge électrique</td><td style={{ padding: '2px 10px' }}>{bil.qG}</td><td style={{ padding: '2px 10px' }}>{bil.qD}</td>
            <td style={{ fontWeight: 800, color: bil.qG === bil.qD ? VERT : ORANGE }}>{bil.qG === bil.qD ? '✓' : '≠'}</td></tr>
        </tbody></table>
      <div style={{ fontWeight: 700, color: bil.equilibree ? VERT : ORANGE, fontSize: 14 }}>{bil.equilibree ? '✅ Équation équilibrée (atomes et charge).' : '⚠️ Pas encore équilibrée : modifiez les coefficients.'}</div>
    </div>);
}

// composé ionique : visuel simple des ions
function Compose({ cat, an }) {
  const { x, y } = composeIonique(cat, an), p = cat.q, m = -an.q;
  const pastille = (k, txt, c) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 38, height: 38, borderRadius: 19, background: c, color: '#0f172a', fontWeight: 800, border: '2px solid #0f172a', fontSize: 14, padding: '0 4px' }}>{txt}</span>;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', margin: '6px 0' }}>
        {Array.from({ length: x }, (_, k) => pastille(`c${k}`, ionTxt(cat.sym, p), '#fde7b5'))}
        {Array.from({ length: y }, (_, k) => pastille(`a${k}`, ionTxt(an.sym, -m), '#cfe9f8'))}</div>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
        Charges positives : {x} × (+{p}) = <strong>+{x * p}</strong> · Charges négatives : {y} × (−{m}) = <strong>−{y * m}</strong> → total <strong>0</strong> : le solide est électriquement neutre.</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: KIT.txt, marginTop: 4 }}>Formule : {formuleIonique(cat, an)} <span style={{ fontWeight: 600, color: KIT.txt2, fontSize: 14 }}>— {nomIonique(cat, an)}</span></div>
    </div>);
}

// ====================================================
//  DÉFIS
// ====================================================
function evaluerDefi(d, coefs, cat, an, xy) {
  if (d.type === 'famille') {
    const e = element(d.Z), v = valence(d.Z);
    const o1 = d.reps.col === e.colonne, o2 = d.reps.ion === (IONS_FAM[e.colonne]);
    return { ok: o1 && o2, lignes: [
      [o1, o1 ? 'Colonne correcte.' : `Colonne : elle se lit avec le nombre d’électrons de valence (${v} ici) ; ${v === 8 ? 'c’est la dernière colonne' : v <= 2 ? `la colonne ${v}` : `la colonne ${10 + v}`}.`],
      [o2, o2 ? 'Ion correct.' : 'Ion : l’élément cherche la configuration du gaz noble le plus proche (perdre ou gagner des électrons, ou rester tel quel).']] };
  }
  if (d.type === 'equation') {
    const b = bilanEquation(REACTIONS[d.cle], coefs);
    return { ok: b.equilibree, lignes: [[b.equilibree, b.equilibree ? 'Équation équilibrée : mêmes atomes et même charge de chaque côté.' : 'Pas équilibrée : regarde les lignes « ≠ » du tableau de conservation.']] };
  }
  const c = CATIONS.find(x => x.sym === d.c), a = ANIONS.find(x => x.sym === d.a), r = composeIonique(c, a);
  const ok = xy.x === r.x && xy.y === r.y;
  return { ok, lignes: [[ok, ok ? `Correct : la formule est ${formuleIonique(c, a)}.` : `Pas encore : vérifie que x × (charge du cation) + y × (charge de l’anion) = 0.`]] };
}

function VoletDefi({ defi, setDefi, changerType, coefs, setCoefs, xy, setXy }) {
  const cat = defi.type === 'formule' ? CATIONS.find(x => x.sym === defi.c) : null, an = defi.type === 'formule' ? ANIONS.find(x => x.sym === defi.a) : null;
  const res = defi.verifie ? evaluerDefi(defi, coefs, cat, an, xy) : null, reussi = !!res && res.ok;
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, reussi);
  const prog = lireProgression();
  const rep = (k, x) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: x }, verifie: false }));
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const choix = (k, options) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{options.map(([v, l]) =>
    <button key={String(v)} onClick={() => rep(k, v)} style={stylePetitBouton(defi.reps[k] === v, '#0ea5e9')}>{l}</button>)}</div>;
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }, q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{t}</div>;
  const e = defi.type === 'famille' ? element(defi.Z) : null;
  const rea = defi.type === 'equation' ? REACTIONS[defi.cle] : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      {defi.type === 'famille' && <>
        <div style={txt}>🎯 Un élément du tableau a pour numéro atomique <strong>Z = {e.Z}</strong>. Sa configuration est <strong>{configTxt(e.Z)}</strong> : il a <strong>{valence(e.Z)}</strong> électron{valence(e.Z) > 1 ? 's' : ''} de valence et se trouve en période {e.periode}.</div>
        {q('Dans quelle colonne du tableau se trouve-t-il ?')}{choix('col', [[1, 'colonne 1'], [2, 'colonne 2'], [17, 'colonne 17'], [18, 'colonne 18']])}
        {q('Quel ion forme-t-il (X = son symbole) ?')}{choix('ion', Object.values(IONS_FAM).map(v => [v, v]))}</>}
      {defi.type === 'equation' && <div style={txt}>🎯 {rea.titre} : équilibrez l’équation de la réaction avec les boutons + et − (atomes <strong>et</strong> charge), puis cliquez sur « Vérifier ».
        <EquationEditable reaction={rea} coefs={coefs} setCoefs={setCoefs}/></div>}
      {defi.type === 'formule' && <>
        <div style={txt}>🎯 Un solide ionique est formé d’ions <strong>{ionTxt(cat.sym, cat.q)}</strong> ({cat.nom}) et <strong>{ionTxt(an.sym, an.q)}</strong> ({an.nom}). Combien de chaque ion faut-il pour que le solide soit neutre ?</div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
          <span>Nombre de {ionTxt(cat.sym, cat.q)} : <Stepper valeur={xy.x} onChange={v => { setXy(s => ({ ...s, x: v })); setDefi(d => ({ ...d, verifie: false })); }} max={3} label="nombre de cations"/></span>
          <span>Nombre de {ionTxt(an.sym, an.q)} : <Stepper valeur={xy.y} onChange={v => { setXy(s => ({ ...s, y: v })); setDefi(d => ({ ...d, verifie: false })); }} max={3} label="nombre d’anions"/></span></div>
        <div style={{ fontSize: 14, color: KIT.txt2 }}>Formule obtenue : <strong>{cat.sym}{xy.x > 1 ? sub(xy.x) : ''}{an.sym}{xy.y > 1 ? sub(xy.y) : ''}</strong></div></>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}>🔄 Nouveau tirage</button>
        {!reussi && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {res && <div style={{ marginTop: 8, fontSize: 14 }}>
        {res.lignes.map(([ok, t], k) => <div key={k} style={{ color: ok ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{ok ? '✅' : '❌'} {t}</div>)}
        {res.ok && <div style={{ color: '#15803d', fontWeight: 700, marginTop: 4 }}>🎉 Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'famille' && <>Z = {e.Z} : {configTxt(e.Z)}, {valence(e.Z)} électron{valence(e.Z) > 1 ? 's' : ''} de valence → colonne <strong>{e.colonne}</strong> ({symFam[e.famille]}), il forme {e.colonne === 18 ? 'aucun ion (couche de valence déjà pleine)' : <>l’ion <strong>{IONS_FAM[e.colonne].replace('X', e.sym)}</strong></>}. C’est <strong>{e.nom}</strong>.</>}
        {defi.type === 'equation' && <>Solution : <strong>{eq(rea, rea.coefs)}</strong></>}
        {defi.type === 'formule' && (() => { const r = composeIonique(cat, an); return <>x × (+{cat.q}) + y × (−{-an.q}) = 0 donne x = {r.x} et y = {r.y} : <strong>{formuleIonique(cat, an)}</strong> ({nomIonique(cat, an)}).</>; })()}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
export function SimulationFamillesChimiques() {
  const [mode, setMode] = useState(() => modeOuverture('familles-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('familles-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('tableau');      // 'tableau' | 'eau' | 'ionique' | 'halogene'
  const [Z, setZ] = useState(11);
  const [cleR, setCleR] = useState('Na');
  const [coefs, setCoefs] = useState([1, 1, 1, 1, 1]);
  const [cat, setCat] = useState(CATIONS[0]);
  const [an, setAn] = useState(ANIONS[0]);
  const [xy, setXy] = useState({ x: 1, y: 1 });
  const [hal, setHal] = useState('Cl');
  const [colSel, setColSel] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const atelierEff = enDefi ? (defi.type === 'famille' ? 'tableau' : defi.type === 'equation' ? 'eau' : 'ionique') : atelier;

  const e = element(Z), ion = ionProbable(Z), E = ion ? etatEntite(Z, Z - ion.q) : etatEntite(Z, Z);
  const reaction = REACTIONS[cleR];
  const bil = bilanEquation(reaction, coefs);
  const choisirR = k => { setCleR(k); setCoefs(Array(REACTIONS[k].reactifs.length + REACTIONS[k].produits.length).fill(1)); };

  const voirTab = (z, col = null) => { setAtelier('tableau'); setZ(z); setColSel(col); };
  const voirEau = k => { setAtelier('eau'); choisirR(k); };
  const voirIon = (c, a) => { setAtelier('ionique'); setCat(CATIONS.find(x => x.sym === c)); setAn(ANIONS.find(x => x.sym === a)); };
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '6px 0' }}>{label}</button>;

  const ETAPES = [
    { id: 'colonnes', titre: 'Les colonnes du tableau périodique', depart: () => voirTab(3, 1),
      texte: <>Le tableau périodique range les éléments par numéro atomique croissant. Chaque <strong>colonne</strong> rassemble des éléments qui ont <strong>le même nombre d’électrons de valence</strong> : ils ont des propriétés chimiques semblables, ils forment une <strong>famille</strong>.
        <ExempleResolu>Lithium Li (Z = 3) : {configTxt(3)}, 1 électron de valence. Sodium Na (Z = 11) : {configTxt(11)}, 1 électron de valence. Tous deux sont dans la <strong>colonne 1</strong>.
          {bouton('Voir le sodium', () => voirTab(11, 1))}</ExempleResolu>
        À vous : regardez le potassium (colonne 1 aussi).</>,
      tache: { type: 'qcm', q: 'Combien d’électrons de valence a le potassium K (Z = 19) ?', options: ['1', '19', '4', '8'], bonne: 0, expl: `Potassium : ${configTxt(19)} : un seul électron sur la dernière couche (4s¹). Même colonne que Li et Na.` } },
    { id: 'alcalins', titre: 'La famille des alcalins', depart: () => voirTab(11, 1),
      texte: <>La colonne 1 (sauf l’hydrogène) forme la famille des <strong>alcalins</strong> : lithium, sodium, potassium… Ils ont <strong>1 électron de valence</strong> qu’ils perdent facilement pour atteindre la configuration d’un gaz noble.
        <ExempleResolu>Na → Na⁺ + e⁻. Na⁺ a 10 électrons : {configTxt(10)}, comme le néon. Tous les alcalins forment des ions de charge <strong>+1</strong> : Li⁺, Na⁺, K⁺.</ExempleResolu>
        À vous : quel ion forme le lithium ?</>,
      tache: { type: 'qcm', q: 'Quel ion forme le lithium Li (Z = 3) ?', options: ['Li⁺', 'Li⁻', 'Li²⁺', 'Li³⁻'], bonne: 0, expl: 'Li : 1 électron de valence. En le perdant, il reste 2 électrons (configuration de l’hélium) : Li⁺.' } },
    { id: 'terreux', titre: 'Les alcalino-terreux', depart: () => voirTab(12, 2),
      texte: <>La colonne 2 : béryllium, magnésium, calcium… ce sont les <strong>alcalino-terreux</strong>. Ils ont <strong>2 électrons de valence</strong> et en perdent 2 pour devenir stables.
        <ExempleResolu>Mg → Mg²⁺ + 2 e⁻. Mg²⁺ a 12 − 2 = 10 électrons, comme le néon. Les alcalino-terreux forment des ions de charge <strong>+2</strong>.</ExempleResolu>
        À vous : le calcium (Z = 20).</>,
      tache: { type: 'qcm', q: 'Quel ion forme le calcium Ca (Z = 20) ?', options: ['Ca²⁺', 'Ca⁺', 'Ca²⁻', 'Ca⁶⁺'], bonne: 0, expl: 'Ca : colonne 2, 2 électrons de valence → il les perd : Ca²⁺ (18 électrons, comme l’argon).' } },
    { id: 'halogenes', titre: 'Les halogènes', depart: () => voirTab(17, 17),
      texte: <>La colonne 17 : fluor, chlore, brome, iode… les <strong>halogènes</strong>. Ils ont <strong>7 électrons de valence</strong> : il leur en manque un. Ils le gagnent facilement.
        <ExempleResolu>Cl + e⁻ → Cl⁻. Cl⁻ a 18 électrons : {configTxt(18)}, comme l’argon. Les halogènes forment des ions de charge <strong>−1</strong> : F⁻, Cl⁻, Br⁻, I⁻.</ExempleResolu>
        À vous : le fluor.</>,
      tache: { type: 'qcm', q: 'Quel ion forme le fluor F (Z = 9) ?', options: ['F⁻', 'F⁺', 'F²⁻', 'F⁷⁺'], bonne: 0, expl: 'F : 7 électrons de valence, il lui en manque 1 : il le gagne → F⁻ (10 électrons, comme le néon).' } },
    { id: 'nobles', titre: 'Les gaz nobles', depart: () => voirTab(10, 18),
      texte: <>La colonne 18 : hélium, néon, argon… les <strong>gaz nobles</strong>. Leur couche de valence est déjà pleine : ils sont <strong>stables</strong> et ne forment pas d’ions ni de liaisons dans les conditions habituelles.</>,
      tache: { type: 'qcm', q: 'Pourquoi le néon ne forme-t-il pas d’ion ?', options: ['Sa couche de valence est déjà pleine (octet)', 'Il a un seul électron de valence', 'Il est trop lourd', 'Il n’a pas de noyau'], bonne: 0, expl: 'Néon : 2 + 6 = 8 électrons de valence, c’est déjà un octet : il est stable tel quel.' } },
    { id: 'retenir1', titre: 'À retenir : les familles', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Même <strong>colonne</strong> = même nombre d’électrons de valence = même <strong>famille</strong>.</li>
        <li>Alcalins (colonne 1) → ion <strong>X⁺</strong> · alcalino-terreux (colonne 2) → <strong>X²⁺</strong> · halogènes (colonne 17) → <strong>X⁻</strong> · gaz nobles (colonne 18) : aucun ion.</li></ul></ARetenir>, tache: null },
    { id: 'reac1', titre: 'Le sodium dans l’eau', depart: () => voirEau('Na'),
      texte: <>Les éléments d’une même famille réagissent de la même façon. Le sodium réagit avec l’eau : il se transforme en ion Na⁺ et il se forme du dihydrogène H₂ et des ions hydroxyde HO⁻. Pour écrire l’<strong>équation</strong>, il faut que les <strong>atomes</strong> et la <strong>charge électrique</strong> soient conservés : on ajuste des <strong>coefficients</strong> devant chaque espèce.
        <ExempleResolu>Dans <em>Na + H₂O → Na⁺ + H₂ + HO⁻</em> avec tous les coefficients à 1, il y a 2 atomes H à droite (dans H₂) plus 1 dans HO⁻ = 3, contre 2 à gauche : ce n’est pas équilibré. On ajuste jusqu’à ce que chaque ligne du tableau affiche ✓.</ExempleResolu>
        À vous : équilibrez l’équation du sodium.</>,
      tache: { type: 'action', ok: atelierEff === 'eau' && cleR === 'Na' && bil.equilibree, consigne: 'Équilibrez l’équation : tous les ✓ du tableau, atomes et charge.' } },
    { id: 'reac2', titre: 'Même famille, même réaction', depart: () => voirEau('K'),
      texte: <>Le potassium (comme le sodium, colonne 1) réagit de la même façon avec l’eau, plus violemment : K⁺ remplace Na⁺, et l’équation a la <strong>même forme</strong>.</>,
      tache: { type: 'action', ok: atelierEff === 'eau' && cleR === 'K' && bil.equilibree, consigne: 'Équilibrez l’équation du potassium dans l’eau.' } },
    { id: 'reac3', titre: 'Les alcalino-terreux : charge 2+', depart: () => voirEau('Mg'),
      texte: <>Avec le magnésium (colonne 2), l’ion formé est Mg²⁺ : <strong>deux</strong> charges positives. Pour que la charge se conserve, il faut <strong>deux</strong> ions HO⁻ pour un ion Mg²⁺.
        <ExempleResolu>Charge à droite : (+2) + 2 × (−1) = 0 : c’est bien la charge de Mg + H₂O (neutres).</ExempleResolu></>,
      tache: { type: 'action', ok: atelierEff === 'eau' && cleR === 'Mg' && bil.equilibree, consigne: 'Équilibrez l’équation du magnésium dans l’eau.' } },
    { id: 'ionique', titre: 'Un solide ionique est neutre', depart: () => voirIon('Na', 'Cl'),
      texte: <>Le sodium et le chlore forment le <strong>chlorure de sodium</strong> (sel de table) : un solide <strong>ionique</strong>, fait d’ions Na⁺ et Cl⁻. Il est <strong>électriquement neutre</strong> : charges positives et négatives se compensent.
        <ExempleResolu>Na⁺ et Cl⁻ : 1 × (+1) + 1 × (−1) = 0. Formule : <strong>NaCl</strong>. On cite l’anion en premier dans le nom : <em>chlorure de sodium</em>.</ExempleResolu>
        À vous : combinez Mg²⁺ et Cl⁻.</>,
      tache: { type: 'qcm', q: 'Quelle est la formule du chlorure de magnésium (ions Mg²⁺ et Cl⁻) ?', options: ['MgCl₂', 'MgCl', 'Mg₂Cl', 'Mg₂Cl₂'], bonne: 0, expl: 'Il faut 2 Cl⁻ (2 × −1 = −2) pour compenser un Mg²⁺ (+2) : MgCl₂.' } },
    { id: 'ionique2', titre: 'À vous : oxyde d’aluminium', depart: () => voirIon('Al', 'O'),
      texte: <>Al³⁺ (+3) et O²⁻ (−2). Il faut trouver x et y tels que <strong>x × 3 = y × 2</strong>, les plus petits possibles.
        <ExempleResolu>Pour Ca²⁺ et Cl⁻ : x × 2 = y × 1 → x = 1, y = 2 : CaCl₂. Pour Na⁺ et O²⁻ : x × 1 = y × 2 → x = 2, y = 1 : Na₂O.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Formule de l’oxyde d’aluminium (Al³⁺ et O²⁻) ?', options: ['Al₂O₃', 'AlO', 'Al₃O₂', 'Al₂O'], bonne: 0, expl: '2 Al³⁺ = +6 et 3 O²⁻ = −6 : Al₂O₃.' } },
    { id: 'halogenures', titre: 'Reconnaître les ions halogénure', depart: () => { setAtelier('halogene'); setHal('Cl'); },
      texte: <>Comment reconnaître un ion halogénure en solution ? On ajoute des ions <strong>argent Ag⁺</strong> : il se forme un <strong>précipité</strong> (un solide), dont l’aspect dépend de l’halogénure : <strong>blanc</strong> pour Cl⁻, <strong>jaune pâle</strong> pour Br⁻, <strong>jaune</strong> pour I⁻. L’équation : <strong>Ag⁺ + X⁻ → AgX</strong>.</>,
      tache: { type: 'qcm', q: 'On ajoute des ions argent à une solution : un précipité blanc se forme. Quel ion contenait-elle ?', options: ['Cl⁻ (chlorure)', 'I⁻ (iodure)', 'Na⁺ (sodium)', 'Mg²⁺'], bonne: 0, expl: 'Précipité blanc : AgCl, donc la solution contenait des ions chlorure Cl⁻.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Colonne = famille : alcalins (X⁺), alcalino-terreux (X²⁺), halogènes (X⁻), gaz nobles (stables).</li>
        <li>Une équation conserve les <strong>atomes</strong> et la <strong>charge</strong>.</li>
        <li>Un solide ionique est <strong>neutre</strong> : x × charge du cation + y × charge de l’anion = 0.</li>
        <li>Ag⁺ + Cl⁻ → AgCl (précipité blanc) : test de reconnaissance des ions chlorure.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type, prec) {
    const d = nouveauDefi(type, prec); setDefi(d);
    if (type === 'equation') setCoefs(Array(REACTIONS[d.cle].reactifs.length + REACTIONS[d.cle].produits.length).fill(1));
    if (type === 'formule') setXy({ x: 1, y: 1 });
  }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'famille', null); }

  // ════════════════ PANNEAUX ════════════════
  const famE = e.famille ? FAMILLES[e.famille] : null;
  const panneauTableau = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <TableauPeriodique choisi={enDefi ? defi.Z : Z} onChoisir={enDefi ? undefined : z => { setZ(z); setColSel(null); }} colorier={enDefi ? 'aucun' : 'famille'} montrerValence={!enDefi} colonneSurlignee={colSel} compact/>
          {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700 }}>Surligner une colonne :</span>
            {[1, 2, 17, 18].map(c => <button key={c} onClick={() => setColSel(colSel === c ? null : c)} style={stylePetitBouton(colSel === c, '#b45309')}>{c}</button>)}</div>}
        </div>
        {!enDefi && <div style={{ flex: '1 1 250px', minWidth: 230 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{e.nom} ({e.sym}, Z = {e.Z})</div>
          <SchemaAtome Z={Z} n={Z} taille={200}/>
          <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%', marginTop: 6 }}><tbody>
            {[['Configuration', configTxt(Z)], ['Électrons de valence', valence(Z)], ['Colonne · période', `${e.colonne} · ${e.periode}`],
              ['Famille', famE ? famE.court : (Z === 1 ? 'aucune (cas particulier)' : '—')],
              ['Ion le plus simple', ion ? (ion.special ? 'H⁺ (cas particulier)' : ionTxt(e.sym, ion.q)) : (e.colonne === 18 ? 'aucun (stable)' : 'pas d’ion simple (forme des liaisons)')]].map(([l, v]) => (
              <tr key={l} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '3px 6px 3px 0', color: KIT.txt2, fontWeight: 600 }}>{l}</td><td style={{ padding: '3px 0', fontWeight: 700 }}>{v}</td></tr>))}</tbody></table>
          {ion && !ion.special && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt }}>{E.formule} : {E.n} électrons ({configTxt(E.n)}) {E.gaz ? `= configuration de ${E.gaz.sym}` : ''}.</div>}
        </div>}
      </div>
    </div>);
  const panneauEau = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enDefi ? 'Équation à équilibrer' : reaction.titre}</div>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {Object.entries(REACTIONS).map(([k, r]) => <button key={k} onClick={() => choisirR(k)} style={stylePetitBouton(cleR === k, COULEURS_FAMILLE[r.fam].bord)}>{k} <span style={{ fontWeight: 500 }}>({FAMILLES[r.fam].court.toLowerCase()})</span></button>)}</div>}
      {!enDefi && <EquationEditable reaction={reaction} coefs={coefs} setCoefs={setCoefs}/>}
      {!enDefi && bil.equilibree && <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt }}>Équation : <strong>{eq(reaction, coefs)}</strong>. {reaction.fam === 'alcalin' ? 'Un alcalin forme un ion de charge +1.' : 'Un alcalino-terreux forme un ion de charge +2 : il faut deux HO⁻ pour compenser.'}</div>}
      {enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Utilisez les boutons + et − de l’énoncé ci-dessus.</div>}
    </div>);
  const panneauIonique = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Composé ionique</div>
      {!enDefi && <>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Cation</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{CATIONS.map(c => <button key={c.sym} onClick={() => setCat(c)} style={stylePetitBouton(cat.sym === c.sym, '#b97800')}>{ionTxt(c.sym, c.q)}</button>)}</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Anion</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{ANIONS.map(a => <button key={a.sym} onClick={() => setAn(a)} style={stylePetitBouton(an.sym === a.sym, '#1f7fb5')}>{ionTxt(a.sym, a.q)}</button>)}</div>
        <Compose cat={cat} an={an}/></>}
      {enDefi && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Utilisez les boutons + et − de l’énoncé ci-dessus. Règle : x × charge du cation + y × charge de l’anion = 0.</div>}
    </div>);
  const panneauHal = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Test à l’ion argent</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{Object.entries(PRECIPITES).map(([k, p]) => <button key={k} onClick={() => setHal(k)} style={stylePetitBouton(hal === k, '#a84c82')}>{p.anion}</button>)}</div>
      {(() => { const p = PRECIPITES[hal], c = hal === 'Cl' ? '#f8fafc' : hal === 'Br' ? '#f6eeb4' : '#f2d95a';
        return <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
            <svg viewBox="0 0 90 120" width="90" role="img" aria-label={`Tube à essai avec précipité ${p.aspect}`}>
              <path d="M20 8 H70 V92 Q70 112 45 112 Q20 112 20 92 Z" fill="#e0f2fe" stroke="#334155" strokeWidth="2.5"/>
              <path d="M21 70 H69 V92 Q69 111 45 111 Q21 111 21 92 Z" fill={c} stroke="#64748b" strokeWidth="1.5"/>
              <text x="45" y="36" textAnchor="middle" fontSize="11" fill="#334155" fontWeight="700">solution</text>
              <text x="45" y="98" textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="700">{p.formule}</text></svg>
            <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
              Ag⁺ + {p.anion} → <strong>{p.formule}</strong> (s)<br/>
              Précipité de <strong>{p.nom}</strong> : <strong>{p.aspect}</strong>.</div></div>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>La couleur est toujours écrite : le texte « {p.aspect} » suffit à identifier l’ion.</div>
          <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Brome et iode ({HORS_LISTE.halogene.join(', ')}) sont des halogènes des périodes 4 et 5 : ils ont aussi 7 électrons de valence.</div></div>; })()}
    </div>);

  const ateliers = (enExplore || enGuide) && (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>Atelier :</span>
      {[['tableau', '🧩 Tableau périodique'], ['eau', '💧 Réactions dans l’eau'], ['ionique', '🧂 Solides ioniques'], ['halogene', '🧪 Test à l’ion argent']].map(([k, l]) =>
        <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}
    </div>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Tableau limité</strong> aux blocs s et p des quatre premières périodes (Z = 1 à 20). Les colonnes 3 à 12 (métaux de transition) ne sont pas représentées.</li>
      <li><strong>Famille</strong> : colonnes 1 (alcalins, sans l’hydrogène), 2, 17 et 18. L’hydrogène est en colonne 1 mais n’est pas un alcalin (c’est un gaz).</li>
      <li><strong>Ion « le plus simple »</strong> : celui qui donne la configuration du gaz noble le plus proche (modèle de l’octet).</li>
      <li><strong>Réactions avec l’eau</strong> : on donne les produits (ion métallique, dihydrogène, ions hydroxyde) ; seul l’équilibrage est demandé. Les coefficients sont des entiers de 1 à 4.</li>
      <li><strong>Composés ioniques</strong> : le solide est formé d’ions en proportions telles qu’il soit neutre ; la formule donne ces proportions, pas une « molécule ».</li>
      <li><strong>Halogénures et argent</strong> : seule la couleur du précipité est décrite, pas sa structure. Br et I sortent de la liste Z ≤ 20 : seul leur nom compte.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Surlignez la colonne 1 puis la colonne 17 : que remarquez-vous sur le chiffre orange (électrons de valence) ?</li>
        <li>Cliquez sur Li, Na, K : comparez leurs ions. Faites de même avec F et Cl.</li>
        <li>Équilibrez l’équation du calcium : combien d’ions HO⁻ faut-il pour un Ca²⁺ ?</li>
        <li>Combinez Al³⁺ avec Cl⁻, puis avec O²⁻ : comment varient les nombres d’ions ?</li>
        <li>Atelier « Test à l’ion argent » : quel ion donne le précipité jaune ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>même colonne = même famille = même ion</li>
    <li>une équation conserve atomes et charge</li>
    <li>solide ionique : charges + et − se compensent</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .fc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Familles chimiques : même colonne, mêmes comportements</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Dans le tableau périodique, les éléments d’une même colonne ont le même nombre d’électrons de valence : ils forment les mêmes ions et réagissent de la même manière. Explorez les familles, équilibrez des équations et construisez des solides ioniques.</div>
      {ateliers}
      <div className={`fc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefi defi={defi} setDefi={setDefi} coefs={coefs} setCoefs={setCoefs} xy={xy} setXy={setXy} changerType={t => lancer(t, defi)}/></div>}
          {atelierEff === 'tableau' && panneauTableau}
          {atelierEff === 'eau' && !enDefi && panneauEau}
          {atelierEff === 'ionique' && !enDefi && panneauIonique}
          {atelierEff === 'halogene' && !enDefi && panneauHal}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="fc-l2">{panneauHypo}</div>}
      {enExplore && <div className="fc-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
