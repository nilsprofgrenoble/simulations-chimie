import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./gravitationModele";
import { QCM } from "./gravitationQcm";
import { GravExplore } from "./GravExplore";
import { SceneDeuxCorps, GrapheG, SvgForcesCarte, SvgPoidsCarte, SvgAltitudeCarte } from "./GravitationSchemas";

const SIM_ID = 266, CLE_GUIDE = 'gravitation-guide-v1';
declarerDefis(SIM_ID, [['force', 'Force gravitationnelle entre deux masses'], ['poids', 'Intensité de pesanteur et poids sur une planète']]);

// ====================================================
//  SIM 266 — GRAVITATION ET POIDS (TSTL, enseignement PCM, partie « Interactions »).
//  Une seule idée : la force gravitationnelle F = G mA mB / d² ; au sol, g = G M / R² et le poids P = m g ; masse ≠ poids ; g diminue avec l'altitude mais n'est pas nul.
//  Capacités visées (jamais affichées) : force d'interaction gravitationnelle, poids. Données astronomiques arrondies ; situations génériques inventées.
//  Modèle : gravitationModele.js (test node). QCM : gravitationQcm.js. Schémas : GravitationSchemas.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS, TE = M.CORPS.terre, LU = M.CORPS.lune;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
const DONNEES_G = <>G = 6,67×10⁻¹¹{NB}N·m²·kg⁻²</>;

// ====================================================
export function SimulationGravitation() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('force');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ c: 'terre', m: 70, rr: 1 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const IDS = ['force', 'calcul', 'distance', 'gterre', 'masse', 'plune', 'alt', 'altq', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const ETAPES = [
    { id: 'force', titre: 'Deux corps qui s’attirent', focus: ['scene'],
      texte: <>Deux corps A et B, de masses m<sub>A</sub> et m<sub>B</sub>, s’attirent : c’est l’<strong>interaction gravitationnelle</strong>. A exerce sur B une force <strong>F<sub>A/B</sub></strong>, et B exerce sur A une force <strong>F<sub>B/A</sub></strong>. Les masses sont différentes : A est plus grand et plus massif que B.</>,
      tache: { type: 'qcm', q: 'Comment se comparent les deux forces ?', ...QCM.force,
        expl: 'Les deux forces d’une interaction ont la même valeur, la même direction (la droite AB) et des sens opposés : chacune est dirigée vers l’autre corps.', indice: 'Pensez à l’action réciproque : si A attire B, que fait B sur A ?' } },
    { id: 'calcul', titre: 'Calculer la valeur de la force', focus: ['scene'],
      texte: <>La valeur de la force est <strong>F = G × m<sub>A</sub> × m<sub>B</sub> ÷ d²</strong>, où d est la distance entre les centres des deux corps. Deux blocs de <strong>1 000 kg</strong> chacun sont séparés de <strong>d = 2,0 m</strong> (centre à centre). Avec {DONNEES_G}, la force est très petite : on l’exprime en <strong>micronewtons</strong> (1 µN = 10⁻⁶ N).</>,
      tache: { type: 'num', q: 'Valeur de la force gravitationnelle entre les deux blocs, en µN', unite: 'µN', vrai: PG.F * 1e6, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.F * 1e6 * 2, 'La distance doit être élevée au carré : d² = 4,0 m², et non d = 2,0 m.'], [PG.F, 'Le résultat est en N : 1 N = 10⁶ µN. Multipliez par 10⁶ pour l’exprimer en µN.']],
        calcul: () => ['F = 6,67×10⁻¹¹ × 1 000 × 1 000 ÷ 2,0² = 6,67×10⁻¹¹ × 10⁶ ÷ 4,0 = 1,67×10⁻⁵ N.', '1,67×10⁻⁵ N = 16,7 µN.'], expl: 'F = 6,67×10⁻¹¹ × 10⁶ ÷ 4,0 ≈ 1,7×10⁻⁵ N, soit 17 µN.', indice: 'Calculez d² = 2,0² = 4,0, puis G × mA × mB ÷ d². Le résultat est en newtons : multipliez par 10⁶ pour les µN.' } },
    { id: 'distance', titre: 'Si l’on éloigne les corps', focus: ['scene'],
      texte: <>La force entre les deux blocs vaut <strong>{nbf(PG.F * 1e6, 1)} µN</strong> pour d = 2,0 m. On <strong>double la distance</strong> : d = 4,0 m, les masses restent les mêmes.</>,
      tache: { type: 'qcm', q: 'Que devient la valeur de la force ?', ...QCM.distance,
        expl: 'F varie comme 1/d² : doubler d divise F par 2² = 4. On trouve 4,2 µN.', indice: 'Dans F = G × mA × mB ÷ d², la distance est élevée au carré : que devient d² quand d double ?' } },
    { id: 'gterre', titre: 'L’intensité de pesanteur sur Terre', focus: ['scene'],
      texte: <>Un objet de masse m est posé au sol, sur la Terre. La force de la Terre sur lui est F = G × M × m ÷ R², où R est le rayon de la Terre : c’est le <strong>poids</strong> P = m × g, avec <strong>g = G × M ÷ R²</strong> l’intensité de pesanteur. Données : masse de la Terre M = <strong>5,97×10²⁴ kg</strong>, rayon R = <strong>6,37×10⁶ m</strong> ; {DONNEES_G}.</>,
      tache: { type: 'num', q: 'Intensité de pesanteur à la surface de la Terre, en N/kg', unite: 'N/kg', vrai: PG.gT, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        pieges: [[M.G * TE.M / TE.R, 'Le rayon doit être élevé au carré : g = G × M ÷ R².'], [M.G * TE.M / (TE.R * TE.R) * 1e3, 'Vérifiez la puissance de 10 : R = 6,37×10⁶ m (6 370 km), donc R² ≈ 4,06×10¹³ m².']],
        calcul: () => ['g = 6,67×10⁻¹¹ × 5,97×10²⁴ ÷ (6,37×10⁶)² = 3,98×10¹⁴ ÷ 4,06×10¹³.', 'g = 9,81 N/kg (soit 9,8 N/kg).'], expl: 'g = 3,98×10¹⁴ ÷ 4,06×10¹³ ≈ 9,8 N/kg.', indice: 'Calculez le numérateur G × M, puis R², puis divisez. Utilisez la touche puissance de 10 de la calculatrice.' } },
    { id: 'masse', titre: 'Masse et poids', focus: ['scene'],
      retenirTitre: 'À retenir : la force gravitationnelle',
      retenir: <>
        <SvgForcesCarte/>
        <ul style={puces}>
          <li>Deux corps s’attirent avec des forces de <strong>même valeur</strong> et de sens opposés : <strong>F = G × m<sub>A</sub> × m<sub>B</sub> ÷ d²</strong>. Doubler la distance divise F par 4.</li>
          <li>Exemple de la simulation : deux blocs de 1 000 kg à 2,0 m : F ≈ 17 µN ; à la surface de la Terre, g = G M ÷ R² ≈ 9,8 N/kg.</li>
          <li>Moyen de s’en souvenir : <strong>« plus loin, c’est le carré qui compte »</strong>. Idée fausse : « le plus gros attire plus fort ». Vrai : les deux forces ont la même valeur.</li></ul></>,
      texte: <>Un astronaute de masse <strong>70 kg</strong> va de la Terre à la Lune, où l’intensité de pesanteur est plus petite que sur Terre. On rappelle que le poids est <strong>P = m × g</strong>.</>,
      tache: { type: 'qcm', q: 'Sur la Lune, la masse de l’astronaute et son poids sont :', ...QCM.masse,
        expl: 'La masse est la même partout (c’est la quantité de matière) ; le poids P = m × g dépend de l’astre : plus petit sur la Lune.', indice: 'Quelle grandeur dépend de g : la masse ou le poids ?' } },
    { id: 'plune', titre: 'Le poids sur la Lune', focus: ['scene'],
      texte: <>Données pour la Lune : masse <strong>7,35×10²² kg</strong>, rayon <strong>1,74×10⁶ m</strong> ; {DONNEES_G}. L’astronaute a une masse de <strong>70 kg</strong>. On calcule d’abord g à la surface de la Lune, puis le poids P = m × g.</>,
      tache: { type: 'num', q: 'Poids de l’astronaute à la surface de la Lune, en N', unite: 'N', vrai: PG.PL, tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        pieges: [[PG.PL / 70, 'C’est l’intensité de pesanteur g (en N/kg) : le poids est P = m × g = 70 × g.'], [70 * M.gAlt(TE.M, TE.R), 'C’est le poids sur la Terre : utilisez la masse et le rayon de la Lune.']],
        calcul: () => ['g = 6,67×10⁻¹¹ × 7,35×10²² ÷ (1,74×10⁶)² = 4,90×10¹² ÷ 3,03×10¹² = 1,62 N/kg.', 'P = 70 × 1,62 = 113 N.'], expl: 'P = 70 × 1,62 ≈ 113 N (contre 687 N sur la Terre).', indice: 'Calculez g = G × M ÷ R² avec les données de la Lune, puis multipliez par la masse 70 kg.' } },
    { id: 'alt', titre: 'À 400 km d’altitude', focus: ['scene'],
      retenirTitre: 'À retenir : masse et poids',
      retenir: <>
        <SvgPoidsCarte/>
        <ul style={puces}>
          <li>La <strong>masse</strong> m (en kg) ne dépend pas du lieu ; le <strong>poids</strong> P = m × g (en N) dépend de l’astre, car g = G × M ÷ R² en dépend.</li>
          <li>Exemple de la simulation : 70 kg sur la Terre, P ≈ 687 N ; 70 kg sur la Lune, P ≈ 113 N.</li>
          <li>Moyen de s’en souvenir : <strong>« la masse voyage, le poids change »</strong>. Idée fausse : « le poids se mesure en kilogrammes ». Vrai : en newtons.</li></ul></>,
      texte: <>Un satellite est à l’altitude <strong>h = 400 km</strong> au-dessus de la Terre. Sa distance au centre de la Terre est <strong>R + h = 6,37×10⁶ + 4,0×10⁵ = 6,77×10⁶ m</strong>. L’intensité de pesanteur à cette altitude est <strong>g = G × M ÷ (R + h)²</strong> (M = 5,97×10²⁴ kg).</>,
      tache: { type: 'num', q: 'Intensité de pesanteur à 400 km d’altitude, en N/kg', unite: 'N/kg', vrai: PG.gH, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        pieges: [[PG.gT, 'C’est la valeur au sol : à 400 km, la distance au centre est R + h, pas R.'], [M.G * TE.M / (TE.R * TE.R + 4.0e5 * 4.0e5), 'Il faut élever au carré la somme R + h, et non R² + h².']],
        calcul: () => ['g = 6,67×10⁻¹¹ × 5,97×10²⁴ ÷ (6,77×10⁶)² = 3,98×10¹⁴ ÷ 4,58×10¹³.', 'g = 8,69 N/kg.'], expl: 'g = 3,98×10¹⁴ ÷ 4,58×10¹³ ≈ 8,7 N/kg.', indice: 'Remplacez R par R + h = 6,77×10⁶ m dans g = G × M ÷ R².' } },
    { id: 'altq', titre: 'Apesanteur ou gravitation ?', focus: ['scene'],
      texte: <>À 400 km d’altitude, g vaut <strong>{nbf(PG.gH, 2)} N/kg</strong>, contre <strong>{nbf(PG.gT, 2)} N/kg</strong> au sol. Pourtant, les astronautes d’une station spatiale à cette altitude flottent dans la station.</>,
      tache: { type: 'qcm', q: 'À cette altitude, par rapport à sa valeur au sol, l’intensité de pesanteur g est :', ...QCM.alt,
        expl: 'g = 8,7 N/kg, soit 89 % de 9,8 N/kg : la gravitation agit encore presque autant. Les astronautes flottent parce que la station et eux tombent ensemble autour de la Terre, pas parce que g est nul.', indice: 'Comparez les deux valeurs données : 8,69 et 9,81 N/kg. Quel pourcentage cela représente-t-il ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : g et l’altitude',
      retenir: <>
        <SvgAltitudeCarte/>
        <ul style={puces}>
          <li>g = G × M ÷ (R + h)² <strong>diminue</strong> quand l’altitude h augmente, mais n’est pas nul : à 400 km, il vaut encore près de 90 % de sa valeur au sol.</li>
          <li>Exemple de la simulation : 9,8 N/kg au sol, 8,7 N/kg à 400 km d’altitude.</li>
          <li>Moyen de s’en souvenir : <strong>« flotter n’est pas échapper à la gravitation »</strong>. Idée fausse : « loin de la Terre, il n’y a plus de pesanteur ». Vrai : g diminue seulement comme 1/(R + h)².</li></ul></>,
      texte: <>Vous savez calculer la force gravitationnelle entre deux corps, l’intensité de pesanteur à la surface d’un astre et à une altitude, et le poids d’un objet, en le distinguant de sa masse. Explorez avec différents astres, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SC = {
    force: { rA: 38, rB: 20, flA: 50, nomA: 'A', nomB: 'B' }, calcul: { rA: 26, rB: 26, flA: 46, cote: '2,0 m' }, distance: { rA: 26, rB: 26, flA: 30, cote: '4,0 m' },
    gterre: { rA: 44, rB: 12, flA: 40, nomA: 'Terre', nomB: 'm' }, masse: { rA: 44, rB: 12, flA: 40, nomA: 'Terre', nomB: 'm' }, plune: { rA: 28, rB: 12, flA: 26, nomA: 'Lune', nomB: 'm' },
    alt: { rA: 44, rB: 10, flA: 36, nomA: 'Terre', nomB: 'sat.', cote: '6,77×10⁶ m au centre' }, altq: { rA: 44, rB: 10, flA: 36, nomA: 'Terre', nomB: 'sat.' }, fin: { rA: 44, rB: 10, flA: 36, nomA: 'Terre', nomB: 'sat.' },
  };

  // ════════════════ EXPLORATION ════════════════
  const animee = enExplore && <GravExplore ex={ex} setEx={setEx}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les deux corps et leurs forces</div>
      {idEtape === 'fin' ? <GrapheG g0={PG.gT} rr={1.0628}/> : <SceneDeuxCorps {...SC[idEtape]}/>}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'force' ? { ...M.tirageDefiForce(), type, reps: { f: '' }, verifie: false, corr: false } : { ...M.tirageDefiPoids(), type, reps: { g: '', p: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const ok = defi.type === 'force' ? proche(lireNombre(defi.reps.f), defi.F, 0.06) : (proche(lireNombre(defi.reps.g), defi.g, 0.06) && proche(lireNombre(defi.reps.p), defi.P, 0.06));
    setDefi(x => ({ ...x, verifie: true, ok })); (defi.type === 'force' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, msgs = [];
    if (x.type === 'force') {
      const f = lireNombre(x.reps.f);
      if (!isFinite(f)) return ['Écrivez un nombre (virgule ou point), en µN.'];
      if (proche(f, x.F * x.d, 0.05)) msgs.push('La distance doit être élevée au carré : divisez par d², pas par d.');
      else if (proche(f, x.F / 1e6, 0.05)) msgs.push('Votre résultat semble être en N : 1 N = 10⁶ µN.');
      else if (proche(f, x.F * 1e6, 0.05)) msgs.push('Vérifiez l’unité : le résultat en N est de l’ordre de 10⁻⁵ ; en µN, on multiplie par 10⁶.');
      else msgs.push(`Refaites le calcul : F = 6,67×10⁻¹¹ × ${x.m1} × ${x.m2} ÷ ${fr(x.d)}², puis × 10⁶ pour les µN. Votre valeur est ${f > x.F ? 'trop grande' : 'trop petite'}.`);
    } else {
      const g = lireNombre(x.reps.g), p = lireNombre(x.reps.p);
      if (!isFinite(g) || !isFinite(p)) return ['Écrivez deux nombres (virgule ou point) : g en N/kg et P en N.'];
      if (!proche(g, x.g, 0.06)) msgs.push(proche(g, M.G * x.M * 1e23 / (x.R * 1e6), 0.05) ? 'Le rayon doit être élevé au carré dans g = G × M ÷ R².' : `g = 6,67×10⁻¹¹ × ${x.M}×10²³ ÷ (${x.R}×10⁶)². Votre valeur est ${g > x.g ? 'trop grande' : 'trop petite'}.`);
      else if (!proche(p, x.P, 0.06)) msgs.push(proche(p, x.m / x.g, 0.05) ? 'Il faut multiplier la masse par g : P = m × g.' : `Votre g est bon ; P = m × g = ${x.m} × g. Votre valeur est ${p > x.P ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'force'
    ? `F = G × mA × mB ÷ d² = 6,67×10⁻¹¹ × ${defi.m1} × ${defi.m2} ÷ ${fr(defi.d)}² = ${nbf(defi.F, 1)} µN.`
    : `g = G × M ÷ R² = 6,67×10⁻¹¹ × ${defi.M}×10²³ ÷ (${defi.R}×10⁶)² = ${nbf(defi.g, 2)} N/kg ; P = m × g = ${defi.m} × ${nbf(defi.g, 2)} = ${nbf(defi.P, 1)} N.`;
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} ({unite}) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en ${unite}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('grv-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['force', 'Force entre deux masses'], ['poids', 'g et poids sur une planète']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0e7490')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'force' ? 'Défi : la force gravitationnelle' : 'Défi : g et poids sur une planète'}</div>
      {defi.type === 'force'
        ? <div style={{ ...lbl, marginBottom: 8 }}>Deux blocs de masses <strong>{defi.m1} kg</strong> et <strong>{defi.m2} kg</strong> sont séparés de <strong>{fr(defi.d.toFixed(1))} m</strong> (centre à centre). Avec G = 6,67×10⁻¹¹ N·m²·kg⁻², donnez la valeur de la force gravitationnelle entre eux, en <strong>µN</strong> (2 chiffres significatifs ; marge acceptée : 6 % de la valeur).</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>Une planète a pour masse <strong>{defi.M}×10²³ kg</strong> et pour rayon <strong>{defi.R}×10⁶ m</strong>. Avec G = 6,67×10⁻¹¹ N·m²·kg⁻², donnez l’intensité de pesanteur g à sa surface, puis le poids d’un objet de <strong>{defi.m} kg</strong> posé à la surface (2 chiffres significatifs ; marge acceptée : 6 % de la valeur).</div>}
      {defi.type === 'force' ? champ('f', 'F', 'µN', 'grv-champ-f') : <>{champ('g', 'g', 'N/kg', 'grv-champ-g')}{champ('p', 'P', 'N', 'grv-champ-p')}</>}
      <IndiceDefi cache={false}>{defi.type === 'force' ? 'F = G × mA × mB ÷ d² (d au carré). Le résultat est en newtons : × 10⁶ pour les µN.' : 'g = G × M ÷ R² (R au carré, en m, M en kg). Puis P = m × g.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="grv-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
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
      <li><strong>Corps à répartition sphérique</strong> : un astre est assimilé à une sphère homogène ; la distance d est celle des centres, et l’objet posé au sol est à la distance R du centre.</li>
      <li><strong>Poids = attraction de l’astre</strong> : on néglige la rotation de l’astre (et donc la force d’inertie d’entraînement) : le poids est la force gravitationnelle de l’astre sur l’objet, P = m × g.</li>
      <li><strong>Données astronomiques arrondies</strong> : G = 6,67×10⁻¹¹ N·m²·kg⁻² ; Terre : 5,97×10²⁴ kg et 6,37×10⁶ m ; Lune : 7,35×10²² kg et 1,74×10⁶ m ; Mars : 6,42×10²³ kg et 3,39×10⁶ m ; Jupiter : 1,90×10²⁷ kg et 7,15×10⁷ m (rayon équatorial, sans tenir compte de son atmosphère).</li>
      <li><strong>Blocs du parcours</strong> : deux blocs de 1 000 kg sont inventés pour la simulation ; la force entre objets usuels est minuscule (de l’ordre de 10⁻⁵ N), ce qui explique qu’on ne la remarque pas.</li>
      <li><strong>Interaction réciproque</strong> : les deux forces ont la même valeur et des sens opposés, même quand les masses sont très différentes ; seul leur effet sur le mouvement diffère.</li>
      <li><strong>Planètes inventées des défis</strong> : leurs masses et rayons sont fictifs, pour s’exercer sans reconnaître un astre.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0e7490')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Comparez g sur la Terre, la Lune, Mars et Jupiter. Pourquoi un objet pèse-t-il plus sur Jupiter ?</li>
      <li>Éloignez l’objet jusqu’à 2 R, puis 3 R : par combien g est-il divisé ?</li>
      <li>Changez la masse de l’objet : g change-t-il ? et le poids ?</li>
      <li>Comparez la force gravitationnelle de l’astre et le poids de l’objet : que constatez-vous ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Force gravitationnelle : F = G × m<sub>A</sub> × m<sub>B</sub> ÷ d², même valeur pour les deux corps, sens opposés</li>
        <li>Poids : P = m × g, avec g = G × M ÷ R² au sol (et g = G × M ÷ (R + h)² à l’altitude h)</li>
        <li>La masse est la même partout ; le poids dépend de l’astre</li>
        <li>g diminue avec l’altitude comme 1/(distance au centre)², sans s’annuler</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .grv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .grv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .grv-col { display: flex; flex-direction: column; gap: 12px; }
        .grv-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .grv-l1.cote .grv-carte { order: 2; } .grv-l1.cote .grv-main { order: 1; }
          .grv-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .grv-ex > * { grid-column: 1; }
          .grv-ex > .grv-reg { grid-column: 2; grid-row: 1 / span 3; }
        }
        @media (max-width: 900px) { .grv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .grv-in { animation: grv-fondu 0.35s ease-out; } @keyframes grv-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Gravitation et poids</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Deux corps <strong>s’attirent</strong> avec une force en <strong>1/d²</strong> ; à la surface d’un astre, cette attraction est le <strong>poids</strong> P = m g, et la <strong>masse</strong> ne change pas d’un astre à l’autre.</div>
      {!enExplore && <div className={`grv-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="grv-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="grv-carte">{panneauHypo}</div>}
        <div className="grv-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'force' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="grv-col"><div className="grv-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="grv-ex">{animee}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
