import { useSignalerMode, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ARetenir, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { nbf, ROUGE, VERT, BLEU, ORANGE } from "./Travail";
import { SimulationSynthese } from "./Synthese";
import { SimulationCcm, Plaque, Kofler } from "./Ccm";
import * as T from "./tpModele";
import * as C from "./ccmModele";

// ====================================================
//  SIM 109 — TP DE LA CHALCONE (1G, chapitre 6) : une seule simulation, deux onglets dans l'ordre du TP
//   ① Du protocole au rendement (phases, quantités de matière, limitant, séchage, rendement, lavage, recristallisation)
//   ② Contrôler le produit (CCM, Rf, température de fusion)
//  + exploration « paillasse libre » : l'élève règle son TP et observe masse, rendement, CCM, Tf ; scénarios d'erreurs.
// ====================================================
const ONGLETS = [['synthese', '① Du protocole au rendement'], ['controle', '② Contrôler : CCM et Tf']];
const MESSAGES = {
  ok: ['ok', 'Aucune anomalie : solide sec, lavé, sans réactif résiduel visible, rendement inférieur à 100 %.'],
  humide: ['mal', 'Le solide n’est pas sec : l’eau résiduelle gonfle la masse (rendement apparent trop élevé) et abaisse la température de fusion. La CCM ne voit pas l’eau.'],
  soude: ['mal', 'Eaux de lavage encore basiques (pH > 10) : il reste de la soude dans le produit. Relaver à l’eau glacée. La CCM ne voit pas la soude non plus.'],
  exces: ['info', 'Les masses pesées ne sont pas stœchiométriques : un réactif est en excès et le limitant fixe la masse théorique.'],
  rdt100: ['mal', 'Rendement supérieur à 100 % : c’est impossible, le solide contient autre chose que la chalcone (eau, soude, réactif).'],
  peuDeSolvant: ['mal', 'Pas assez d’éthanol chaud : la chalcone ne se dissout pas complètement, les impuretés restent piégées dans les cristaux.'],
  tropDeSolvant: ['mal', 'Beaucoup trop d’éthanol : une grande partie de la chalcone reste dissoute à froid et le rendement s’effondre. Ajouter le solvant mL par mL.'],
  recristalliser: ['info', 'Une tache de réactif apparaît en CCM : le produit brut n’est pas pur, une recristallisation est utile.'],
};
const Etat = ({ n }) => <span aria-hidden="true" style={{ fontWeight: 800, color: n === 'ok' ? VERT : n === 'mal' ? ROUGE : ORANGE }}>{n === 'ok' ? '✓ ' : n === 'mal' ? '✗ ' : 'ℹ '}</span>;

function PaillasseLibre() {
  const [p, setP] = useState(T.SCENARIOS.reussi.p);
  const [scen, setScen] = useState('reussi'), [revele, setRevele] = useState(false), [hypoOuv, setHypoOuv] = useState(false);
  const r = T.simuler(p), plaque = T.plaqueTP(r);
  const set = (k, v) => { setP(q => ({ ...q, [k]: v })); setScen(''); };
  const slider = (lab, k, min, max, pas, u) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt }}>
      <span style={{ flex: '1 1 170px' }}>{lab}</span><input type="range" min={min} max={max} step={pas} value={p[k]} onChange={e => set(k, parseFloat(e.target.value))} aria-label={lab} style={{ flex: '2 1 140px', minHeight: 32 }}/>
      <strong style={{ minWidth: 70, textAlign: 'right' }}>{nbf(p[k], pas < 1 ? 2 : 0)}{NB}{u}</strong></label>);
  const fus = r.fusion, tf = fus.fin - fus.largeur / 2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Votre TP, votre choix</div>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Réglez chaque étape du TP, comme à la paillasse, ou chargez un TP « avec une erreur classique » et cherchez ce qui cloche avec les mesures.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }} role="group" aria-label="Scénarios">
          {Object.entries(T.SCENARIOS).map(([k, s]) => <button key={k} onClick={() => { setP(s.p); setScen(k); }} aria-pressed={scen === k} style={stylePetitBouton(scen === k, k === 'reussi' ? VERT : ORANGE)}>{s.nom}</button>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slider('Anisaldéhyde pesé', 'm1', 2, 5, 0.05, 'g')}{slider('4’-méthylacétophénone pesée', 'm2', 2, 5, 0.05, 'g')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt }}><span style={{ flex: '1 1 170px' }}>Lavages à l’eau glacée</span>
            <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Nombre de lavages">{[0, 1, 2, 3].map(n => <button key={n} onClick={() => set('nLav', n)} aria-pressed={p.nLav === n} style={{ ...stylePetitBouton(p.nLav === n, BLEU), minWidth: 36 }}>{n}</button>)}</div></div>
          {slider('Éthanol de recristallisation (0 = aucune)', 'vEtOH', 0, 150, 5, 'mL')}{slider('Durée à l’étuve', 'tSec', 0, 30, 1, 'min')}
        </div>
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Ce que vous mesurez</div>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}><tbody>
          {[['Réactif limitant', r.b.limitant === 'les deux' ? 'les deux (stœchiométrique)' : r.b.limitant === 'anisaldehyde' ? 'anisaldéhyde' : '4’-méthylacétophénone'],
            ['Masse théorique', `${nbf(r.b.mth, 2)} g`], ['pH des eaux de lavage', nbf(r.ph, 1)], ['Masse de solide pesée', `${nbf(r.m, 2)} g`], ['Rendement', `${nbf(100 * r.rApp, 0)} %`]]
            .map(([a, b2]) => <tr key={a}><td style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px' }}>{a}</td><td style={{ border: `1px solid ${KIT.bord}`, padding: '3px 8px', fontWeight: 700 }}>{b2}</td></tr>)}</tbody></table></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Plaque de CCM du produit</div><Plaque p={plaque} etat="eluee" titre="Plaque de CCM du produit"/></div>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Banc Kofler</div><Kofler tf={tf} largeur={fus.largeur > 1.5 ? 1 : 0}/>
            <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6, lineHeight: 1.5 }}>Fusion de <strong>{nbf(fus.debut, 0)}</strong> à <strong>{nbf(fus.fin, 0)}{NB}°C</strong> (littérature : {C.TF_LIT}{NB}°C, u = {C.U_TF}{NB}°C).</div></div>
        </div>
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Diagnostic</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }} role="status" aria-live="polite">{r.diag.map(d => <li key={d}><Etat n={MESSAGES[d][0]}/>{MESSAGES[d][1]}</li>)}</ul>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: KIT.txt, marginTop: 10 }}><input type="checkbox" checked={revele} onChange={e => setRevele(e.target.checked)} style={{ width: 20, height: 20 }}/>Révéler la composition réelle du solide</label>
        {revele && <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6, lineHeight: 1.6 }}>Chalcone : <strong>{nbf(r.chal, 2)}{NB}g</strong> ({nbf(100 * r.rVrai, 0)}{NB}% de la masse théorique) · eau : {nbf(r.eau, 2)}{NB}g · réactif en excès : {nbf(r.mExces, 2)}{NB}g · soude : {nbf(r.mNaoh, 3)}{NB}g · impuretés : {nbf(r.impPct, 1)}{NB}% de la masse.
          {r.recris && <> Éthanol minimal pour dissoudre à chaud : {nbf(r.Vmin, 0)}{NB}mL ; chalcone restée dissoute à froid : {nbf(r.perteRecris, 2)}{NB}g.</>}</div>}
      </div>
      <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
          <li><strong>Modèle qualitatif et illustratif</strong> : les chiffres (conversion de 90 %, soude résiduelle, perte par lavage de 1 %, solubilités de la chalcone dans l’éthanol de 0,25 g/mL à chaud et 0,02 g/mL à froid) sont des <strong>valeurs de travail</strong>, pas des mesures du TP.</li>
          <li><strong>Impuretés</strong> : réactif en excès, soude et eau ; la CCM ne détecte que les espèces organiques qui migrent (réactifs), pas l’eau ni la soude ; la température de fusion et la masse, elles, y sont sensibles.</li>
          <li><strong>Séchage</strong> : l’eau part de façon exponentielle ; le solide est « sec » quand il ne perd plus que moins de 0,02 g.</li>
          <li><strong>Recristallisation</strong> : si l’éthanol chaud suffit à tout dissoudre, 95 % des impuretés solubles sont éliminées (30 % sinon) ; le produit est supposé re-séché comme réglé.</li>
          <li><strong>Température de fusion</strong> : abaissement et étalement linéaires avec le taux d’impuretés ; incertitude de lecture u = 2 °C (type B, valeur de travail).</li>
        </ul>)}</Section></div>
      <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>Rendement &gt; 100 % ⇒ produit humide ou impur</li><li>La CCM ne voit pas l’eau ni la soude ; la Tf et la masse y sont sensibles</li><li>Trop peu d’éthanol : impuretés piégées ; trop : on perd du produit</li></ul></ARetenir>
    </div>);
}

export function SimulationTpChalcone() {
  const [mode, setMode] = useState(() => modeOuverture('synthese-guide-v1'));
  useSignalerMode(mode);
  const [ong, setOng] = useEtatPersistant('tp-chalcone-onglet-v1', { i: 0 });
  const i = ong.i === 1 ? 1 : 0;
  const suite = i === 0 ? { label: 'Passer au contrôle', action: () => setOng({ i: 1 }) } : undefined;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>TP de la chalcone : préparer la séance</h2>
        <BoutonsModes mode={mode} setMode={setMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Dans l’ordre du TP : <strong>synthèse, rendement</strong> puis <strong>contrôle</strong> (CCM, température de fusion). En exploration, la <strong>paillasse libre</strong> vous laisse régler votre TP et en observer les conséquences.</div>
      {mode !== 'explore' && <div role="tablist" aria-label="Étapes du TP" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {ONGLETS.map(([k, nom], n) => <button key={k} role="tab" aria-selected={i === n} onClick={() => setOng({ i: n })} style={styleBouton(i === n, '#0f766e')}>{nom}</button>)}</div>}
      {mode === 'explore' ? <PaillasseLibre/> : i === 0
        ? <SimulationSynthese key="s" integre modeExt={mode} setModeExt={setMode} suite={suite}/>
        : <SimulationCcm key="c" integre modeExt={mode} setModeExt={setMode}/>}
    </div>);
}
