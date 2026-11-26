import { useRef, useMemo, useEffect, useState } from "react";
import { KIT, styleBoite, styleBouton, LigneMesure } from "../commun";
import { NB } from "./Distillation";
import * as M from "./radPcmModele";
import { SceneNoyau, PointsNoyaux, GrapheDecroissance, SceneProtection } from "./RadPcmSchemas";
import { COL, nbf, useEtroit, useLecture, StyleAnim, BarreLecture, Chips, Seg } from "./exploAnim";

// ====================================================
//  Partie animée de l'exploration de la simulation 310 (radioactivité, TSTL) : trois vues.
//  « Un noyau » : le noyau père émet sa particule, le noyau fils apparaît, les sommes de A et de Z s'affichent.
//  « Beaucoup de noyaux » : chaque noyau se désintègre au hasard ; la courbe suit la loi N₀ e^(−λt) quand N est grand ; pas d'Euler au choix.
//  « Se protéger » : rayonnement, écran, distance et durée d'exposition (indication qualitative).
// ====================================================
const T_NOYAU = 2.5, T_POP = 9;
const ENTREES = [...M.parMode('a'), ...M.parMode('b-'), ...M.parMode('b+')];
const GAMMA_NI = { A: 60, Z: 28, s: 'Ni', nom: 'nickel' };
const cleN = n => `${n.s}${n.A}`;
const libN = n => `${M.noyau(n.A, n.Z, n.s)} (${n.nom} ${n.A})`;

// phase en boucle pour les particules de la vue « Se protéger » (immobile si l'élève préfère les animations réduites)
function useBoucle(actif) {
  const [ph, setPh] = useState(0);
  useEffect(() => {
    if (!actif || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return undefined;
    let id = 0, d = performance.now();
    const pas = now => { setPh(((now - d) / 2600) % 1); id = requestAnimationFrame(pas); };
    id = requestAnimationFrame(pas); return () => cancelAnimationFrame(id);
  }, [actif]);
  return actif ? ph : null;
}

const select = (id, label, valeur, onChange, groupes) => (
  <div style={{ minWidth: 0 }}>
    <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{label}</label>
    <select id={id} value={valeur} onChange={e => onChange(e.target.value)} style={{ width: '100%', minHeight: 42, borderRadius: 8, border: `1.5px solid ${KIT.bord}`, padding: '0 10px', fontSize: 15 }}>{groupes}</select>
  </div>);

function VueNoyau({ ex, setEx }) {
  const L = useLecture(T_NOYAU, false), p = L.touche || L.t > 0 ? Math.min(1, L.t / T_NOYAU) : null;
  const gam = ex.noyau === 'gamma', n = gam ? null : ENTREES.find(x => cleN(x) === ex.noyau) || ENTREES[0];
  const mode = gam ? 'g' : n.mode, fini = p !== null && p >= 1;
  const change = v => { L.reset(); L.setTouche(false); setEx(x => ({ ...x, noyau: v })); };
  const aria = gam ? 'Un noyau de nickel 60 excité émet un photon gamma : A et Z ne changent pas.' : `Désintégration du noyau ${M.noyau(n.A, n.Z, n.s)} : ${M.equation(n)}.`;
  const nomMode = { a: 'radioactivité α', 'b-': 'radioactivité β⁻', 'b+': 'radioactivité β⁺', g: 'émission γ' }[mode];
  const message = p === null ? 'Choisis un noyau puis appuie sur « Désintégrer » : regarde ce qui part du noyau, et ce qui reste.'
    : !fini ? 'Le noyau se transforme : il émet une particule et devient un noyau fils.'
      : gam ? 'Le noyau excité émet un photon γ et retrouve son état fondamental : son nombre de nucléons et sa charge ne changent pas.'
        : `${nomMode[0].toUpperCase()}${nomMode.slice(1)} : le noyau fils a ${n.fils.A} nucléons et ${n.fils.Z} protons. Les sommes de A et de Z sont les mêmes avant et après.`;
  return (
    <div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {select('rp-noyau', 'Le noyau père', ex.noyau, change, <>
          <optgroup label="Radioactivité α">{M.parMode('a').map(x => <option key={cleN(x)} value={cleN(x)}>{libN(x)}</option>)}</optgroup>
          <optgroup label="Radioactivité β⁻">{M.parMode('b-').map(x => <option key={cleN(x)} value={cleN(x)}>{libN(x)}</option>)}</optgroup>
          <optgroup label="Radioactivité β⁺">{M.parMode('b+').map(x => <option key={cleN(x)} value={cleN(x)}>{libN(x)}</option>)}</optgroup>
          <optgroup label="Émission γ"><option value="gamma">{M.noyau(60, 28, 'Ni')}* (nickel 60 excité)</option></optgroup></>)}
      </div>
      <SceneNoyau n={n || M.NUCLEIDES[0]} gamma={gam ? GAMMA_NI : null} phase={p} bilan={fini} maxWidth={460} aria={aria}/>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T_NOYAU} libelle="▶ Désintégrer"/>
      <Chips items={[['Noyau père', gam ? `${M.noyau(60, 28, 'Ni')}*` : M.noyau(n.A, n.Z, n.s), '#1d4ed8'], ['Type', nomMode.replace('radioactivité ', '').replace('émission ', ''), '#b45309'], ['Nucléons A', gam ? '60 → 60' : `${n.A} → ${n.fils.A} + ${M.PART[mode].A}`, '#0f172a'], ['Charge Z', gam ? '28 → 28' : `${n.Z} → ${n.fils.Z} + ${M.PART[mode].Z < 0 ? '(−1)' : M.PART[mode].Z}`, '#15803d']]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Équation de la désintégration</div>
        {fini ? <div style={{ fontSize: 18, fontWeight: 700, color: KIT.txt }}>{gam ? `${M.noyau(60, 28, 'Ni')}* → ${M.noyau(60, 28, 'Ni')} + γ` : M.equation(n)}</div>
          : <div style={{ fontSize: 14, color: KIT.txt2 }}>Elle s’affiche à la fin de la désintégration. Essaie de la prévoir avec les lois de conservation.</div>}
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Convention : α = ⁴₂He, β⁻ = électron ⁰₋₁e, β⁺ = positon ⁰₊₁e. Le (anti)neutrino ⁰₀ν, émis en β, n’a ni nucléon ni charge : il ne change aucun calcul.</div>
      </div>
    </div>);
}

function VuePopulation({ ex, setEx }) {
  const boite = useRef(null), etroit = useEtroit(boite);
  const L = useLecture(T_POP, false), jeu = L.t > 0 || L.joue;
  const { n, th, graine, dtRel } = ex, l = M.lambdaDe(th), tMax = 4 * th, t = (L.t / T_POP) * tMax;
  const instants = useMemo(() => M.instantsDeces(n, th, graine), [n, th, graine]);
  const trace = useMemo(() => { const pts = [], K = 80; for (let i = 0; i <= K; i++) { const tt = (i / K) * tMax; pts.push({ t: tt, f: M.restantsA(instants, tt) / n }); } return pts; }, [instants, n, tMax]);
  const nRest = M.restantsA(instants, t), nTheo = n * Math.exp(-l * t);
  const dt = dtRel ? th / dtRel : null;
  const change = (cle, v) => { L.reset(); setEx(x => ({ ...x, [cle]: v })); };
  const message = !jeu ? 'Appuie sur « Lancer » : chaque noyau se désintègre à un instant imprévisible. Compare la courbe grise (hasard) à la courbe bleue (loi moyenne).'
    : n <= 10 ? 'Avec peu de noyaux, la courbe grise fait des marches irrégulières et s’écarte de la loi : on ne peut rien prévoir de précis.'
      : n <= 100 ? 'Avec une centaine de noyaux, la courbe grise suit la loi mais avec des écarts visibles.' : 'Avec beaucoup de noyaux, la courbe grise se confond presque avec la loi : le hasard individuel se moyenne.';
  return (
    <div ref={boite}>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Nombre de noyaux au départ" valeur={n} onChange={v => change('n', v)} options={[[10, '10'], [100, '100'], [1000, '1 000']]}/>
        <Seg label="Demi-vie du noyau (h)" valeur={th} onChange={v => change('th', v)} options={[[2, '2 h'], [6, '6 h'], [12, '12 h']]}/>
        <Seg label="Calcul pas à pas (Δt)" valeur={dtRel} onChange={v => setEx(x => ({ ...x, dtRel: v }))} options={[[0, 'aucun'], [2, 't½ ÷ 2'], [4, 't½ ÷ 4'], [8, 't½ ÷ 8']]}/>
      </div>
      <PointsNoyaux n={n} instants={instants} t={t} maxWidth={etroit ? 440 : 520} hauteur={n === 1000 ? 150 : 110} aria={`${n} noyaux : ${nRest} intacts (bleu) et ${n - nRest} désintégrés (gris), à l’instant ${nbf(t, 1)} heures.`}/>
      <GrapheDecroissance l={l} tMax={tMax} xStep={tMax / 4 >= 3 ? tMax / 4 : tMax / 4} trace={jeu ? trace.filter(p => p.t <= t) : null} euler={dt} cursor={jeu ? t : null} yTicks={[[0, '0'], [0.5, 'N₀ ÷ 2'], [1, 'N₀']]} maxWidth={etroit ? 440 : 520}
        aria={`Courbe de décroissance de N divisé par N zéro, demi-vie ${th} heures : loi exponentielle en bleu, tirage au hasard en gris${dt ? ', pas d’Euler en orange' : ''}.`}/>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '8px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <BarreLecture L={L} tFin={T_POP} libelle="▶ Lancer"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 920, margin: '8px auto 0' }}>
        <button type="button" onClick={() => change('graine', 1 + Math.floor(Math.random() * 900000))} style={styleBouton(false)}>↻ Nouveau tirage au hasard</button>
      </div>
      <Chips items={[['Instant', `${nbf(t, 1)}${NB}h`, '#0f172a'], ['Noyaux intacts', `${nRest}`, '#1d4ed8'], ['Loi : N₀ e^(−λt)', `${nbf(nTheo, n >= 100 ? 0 : 1)}`, '#15803d'], ['λ', `${nbf(l, 3)}${NB}h⁻¹`, '#b45309']]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
        <LigneMesure nom="Constante de désintégration λ = ln 2 ÷ t½" valeur={`${nbf(l, 3)}${NB}h⁻¹`} couleur="#b45309"/>
        <LigneMesure nom="Activité à cet instant : λ N (loi)" valeur={`${nbf(l * nTheo, n >= 100 ? 1 : 2)}${NB}désint./h, soit ${nbf(l * nTheo / 3600, 3)}${NB}Bq`} couleur="#15803d"/>
        {dt && <LigneMesure nom={`Pas d’Euler : ΔN = −λ N Δt avec Δt = ${nbf(dt, 2)} h`} valeur="courbe orange" couleur={COL.rouge}/>}
        <div style={{ marginTop: 6, fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Chaque noyau a la même probabilité λ dt de se désintégrer pendant dt, quel que soit son âge. L’orange (pas d’Euler) se rapproche de la loi quand Δt diminue.</div>
      </div>
    </div>);
}

const ECRANS = [['aucun', 'Aucun écran'], ['air', 'Feuille de papier'], ['alu', 'Quelques mm d’aluminium'], ['plomb', 'Plomb épais']];
function VueProtection({ ex, setEx }) {
  const { rayon, ecran, dist, duree } = ex, ph = useBoucle(true), tr = ecran === 'aucun' ? 'passe' : M.TRANSMIS[rayon][ecran];
  const score = ({ passe: 1, reduit: 0.15, arrete: 0 })[tr] * duree / dist, niveau = score === 0 ? 'nulle' : score < 0.8 ? 'faible' : score < 2.5 ? 'moyenne' : 'élevée';
  const col = niveau === 'nulle' || niveau === 'faible' ? '#15803d' : niveau === 'moyenne' ? '#b45309' : '#b91c1c';
  const message = tr === 'arrete' ? `L’écran choisi arrête le ${M.NOM_RAYON[rayon]} : plus rien n’atteint la personne.` : tr === 'reduit' ? 'Le plomb épais atténue fortement le rayonnement γ, sans jamais l’arrêter complètement.' : 'Le rayonnement traverse l’écran (ou il n’y a pas d’écran) : change d’écran, éloigne la personne ou réduis la durée.';
  return (
    <div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Rayonnement émis par la source" valeur={rayon} onChange={v => setEx(x => ({ ...x, rayon: v }))} options={[['a', 'α'], ['b', 'β'], ['g', 'γ']]}/>
        {select('rp-ecran', 'Écran placé devant la source', ecran, v => setEx(x => ({ ...x, ecran: v })), ECRANS.map(([v, l]) => <option key={v} value={v}>{l}</option>))}
        <Seg label="Distance à la source" valeur={dist} onChange={v => setEx(x => ({ ...x, dist: v }))} options={[[1, 'proche'], [2, 'moyenne'], [3, 'loin']]}/>
        <Seg label="Durée d’exposition" valeur={duree} onChange={v => setEx(x => ({ ...x, duree: v }))} options={[[1, 'courte'], [2, 'moyenne'], [3, 'longue']]}/>
      </div>
      <SceneProtection rayon={rayon} ecran={ecran === 'aucun' ? null : ecran} distance={dist} phase={ph} maxWidth={480} aria={`Source émettant un ${M.NOM_RAYON[rayon]}, ${ecran === 'aucun' ? 'sans écran' : `avec un écran : ${ECRANS.find(e => e[0] === ecran)[1]}`}, personne ${dist === 1 ? 'proche' : dist === 2 ? 'à distance moyenne' : 'éloignée'}. ${tr === 'arrete' ? 'Le rayonnement est arrêté.' : tr === 'reduit' ? 'Le rayonnement est fortement atténué.' : 'Le rayonnement atteint la personne.'}`}/>
      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '8px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <Chips items={[['Rayonnement', `${{ a: 'α', b: 'β', g: 'γ' }[rayon]}`, '#7c3aed'], ['Après l’écran', { passe: 'traverse', reduit: 'atténué', arrete: 'arrêté' }[tr], tr === 'arrete' ? '#15803d' : tr === 'reduit' ? '#b45309' : '#b91c1c'], ['Exposition', niveau, col]]}/>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>À savoir</div>
        <div style={{ fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Pour se protéger : <strong>s’éloigner</strong> de la source, mettre un <strong>écran adapté</strong>, <strong>réduire la durée</strong> d’exposition. Le niveau d’exposition affiché est qualitatif : il monte avec la durée, baisse avec la distance et avec un écran adapté.</div>
      </div>
    </div>);
}

export function RadPcmExplore({ ex, setEx }) {
  return (
    <div>
      <StyleAnim/>
      <div style={{ maxWidth: 920, margin: '0 auto 12px' }}>
        <Seg label="Que veux-tu explorer ?" valeur={ex.vue} onChange={v => setEx(x => ({ ...x, vue: v }))} options={[['noyau', 'Un noyau qui se désintègre'], ['pop', 'Beaucoup de noyaux'], ['prot', 'Se protéger']]}/>
      </div>
      {ex.vue === 'noyau' && <VueNoyau ex={ex} setEx={setEx}/>}
      {ex.vue === 'pop' && <VuePopulation ex={ex} setEx={setEx}/>}
      {ex.vue === 'prot' && <VueProtection ex={ex} setEx={setEx}/>}
    </div>);
}

// ═══════════ Scènes du parcours guidé (même composants que l'exploration, réglages réduits) ═══════════
// Un noyau : père seul (anim = false) ou désintégration animée ; bilan = sommes de A et de Z affichées en fin d'animation
export function NoyauGuide({ n, gamma = false, anim = true, bilan = true, aria }) {
  const L = useLecture(T_NOYAU, false), p = L.touche || L.t > 0 ? Math.min(1, L.t / T_NOYAU) : null, fini = p !== null && p >= 1;
  return (
    <div>
      <SceneNoyau n={n} gamma={gamma ? GAMMA_NI : null} phase={anim ? p : null} bilan={bilan && fini} maxWidth={440} aria={aria}/>
      {anim && <BarreLecture L={L} tFin={T_NOYAU} libelle="▶ Désintégrer"/>}
    </div>);
}
// Hasard : n noyaux identiques, une durée égale à une demi-vie
export function PopGuide({ th = 10, tailles = [10, 1000] }) {
  const [n, setN] = useState(tailles[0]), [graine, setGraine] = useState(() => 1 + Math.floor(Math.random() * 900000));
  const L = useLecture(4, false), t = (L.t / 4) * th, instants = useMemo(() => M.instantsDeces(n, th, graine), [n, th, graine]), rest = M.restantsA(instants, t);
  const change = v => { L.reset(); setN(v); setGraine(1 + Math.floor(Math.random() * 900000)); };
  return (
    <div>
      <Seg label="Nombre de noyaux au départ" valeur={n} onChange={change} options={tailles.map(x => [x, String(x).replace(/\B(?=(\d{3})+$)/g, NB)])}/>
      <div style={{ height: 8 }}/>
      <PointsNoyaux n={n} instants={instants} t={t} maxWidth={440} hauteur={n >= 1000 ? 150 : 100} aria={`${n} noyaux, dont ${rest} intacts (bleu) à l’instant ${nbf(t, 1)} heures.`}/>
      <BarreLecture L={L} tFin={4} libelle="▶ Laisser passer le temps"/>
      <Chips items={[['Instant', `${nbf(t, 1)}${NB}h`, '#0f172a'], ['Noyaux intacts', `${rest} sur ${n}`, '#1d4ed8'], ['Proportion intacte', `${nbf(100 * rest / n, 0)}${NB}%`, '#b45309']]}/>
    </div>);
}
// Calcul pas à pas : escalier d'Euler pour le noyau fictif R (λ = 0,12 h⁻¹) ; l'écart avec la loi à t = 12 h s'affiche
export function EulerGuide({ l = M.PG.lamR }) {
  const [dt, setDt] = useState(4), esc = M.escalier(1, l, dt, 12), fin = esc[esc.length - 1], ecart = 100 * (fin.N - Math.exp(-l * fin.t)) / Math.exp(-l * fin.t);
  return (
    <div>
      <Seg label="Durée du pas Δt" valeur={dt} onChange={setDt} options={[[4, '4 h'], [2, '2 h'], [1, '1 h'], [0.5, '0,5 h']]}/>
      <div style={{ height: 8 }}/>
      <GrapheDecroissance l={l} tMax={12} euler={dt} yTicks={[[0, '0'], [0.5, 'N₀ ÷ 2'], [1, 'N₀']]} maxWidth={440} aria={`Courbe de décroissance du noyau R en bleu et calcul pas à pas en orange, avec des pas de ${nbf(dt, 1)} heure.`}/>
      <Chips items={[['Pas Δt', `${nbf(dt, 1)}${NB}h`, '#b45309'], ['Écart avec la loi à 12 h', `${ecart >= 0 ? '+' : '−'}${nbf(Math.abs(ecart), 1)}${NB}%`, ecart === 0 ? '#15803d' : '#b91c1c']]}/>
    </div>);
}
// Courbe de décroissance ; curseur d'instant ; niveau N₀ ÷ 2 optionnel ; yLabel : 'N' ou 'A'
export function CourbeGuide({ l, niveau = false, curseur = false, tMax = 12, grandeur = 'N', marque = null }) {
  const [t, setT] = useState(0), f = Math.exp(-l * t);
  return (
    <div>
      <GrapheDecroissance l={l} tMax={tMax} niveau={niveau ? 0.5 : null} cursor={curseur ? t : marque} yLabel={grandeur === 'N' ? 'N (noyaux)' : 'A (Bq)'} yTicks={[[0, '0'], [0.5, grandeur === 'N' ? 'N₀ ÷ 2' : 'A₀ ÷ 2'], [1, grandeur === 'N' ? 'N₀' : 'A₀']]} maxWidth={440}
        aria={`Courbe de décroissance exponentielle de ${grandeur} en fonction du temps${niveau ? ', avec le niveau moitié en pointillés orange' : ''}.`}/>
      {curseur && <div style={{ marginTop: 6 }}>
        <label style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Instant t = {nbf(t, 1)}{NB}h
          <input type="range" min={0} max={tMax} step={0.1} value={t} aria-label="Instant t en heures" onChange={e => setT(Number(e.target.value))} style={{ width: '100%', minHeight: 32 }}/></label>
        <Chips items={[['Instant t', `${nbf(t, 1)}${NB}h`, '#7c3aed'], ['N ÷ N₀', `${nbf(f, 2)}`, '#1d4ed8']]}/>
      </div>}
    </div>);
}
// Protection pour un rayonnement donné : l'élève essaie les écrans
export function ProtGuide({ rayon = 'b' }) {
  const [ecran, setEcran] = useState('aucun'), ph = useBoucle(true), tr = ecran === 'aucun' ? 'passe' : M.TRANSMIS[rayon][ecran];
  return (
    <div>
      {select('rp-ecran-g', 'Écran placé devant la source', ecran, setEcran, ECRANS.map(([v, l]) => <option key={v} value={v}>{l}</option>))}
      <div style={{ height: 8 }}/>
      <SceneProtection rayon={rayon} ecran={ecran === 'aucun' ? null : ecran} distance={1} phase={ph} maxWidth={440} aria={`Source de rayonnement ${rayon === 'b' ? 'bêta' : rayon}, ${ecran === 'aucun' ? 'sans écran' : 'avec un écran'}. ${tr === 'arrete' ? 'Le rayonnement est arrêté.' : tr === 'reduit' ? 'Le rayonnement est atténué.' : 'Le rayonnement atteint la personne.'}`}/>
    </div>);
}
