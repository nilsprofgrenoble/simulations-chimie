// Commandes et encart des scénarios des tirages de la simulation 314 (photons détectés : à quel élément appartient chacun ?).
import { styleBouton, KIT } from "../commun";
import * as M from "./icpModele";

const NB = ' ';
const fmtProba = v => { const p = 100 * v; return (p >= 10 ? String(Math.round(p)) : p >= 1 ? p.toFixed(1).replace('.', ',') : p === 0 ? '0' : p.toPrecision(2).replace('.', ',')) + NB + '%'; };

export function PanneauScenariosIcp({ T, etat, courant, demo, prog, tir }) {
  const vit = [['normal', 'Normal'], ['lent', 'Ralenti'], ['tres', 'Très ralenti']];
  return (<div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Six scénarios possibles pour un photon</div>
    <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>Chaque photon vient d’un des six éléments. Touchez une ligne pour voir le scénario seul, au ralenti. Colonnes : probabilité prévue, photons obtenus.</div>
    <div role="list" aria-label="Scénarios possibles">
      {M.ECH.map((s, i) => { const r = M.raie(s), on = courant === i, choisi = demo?.sc === i; return (
        <button role="listitem" key={s} className={`ic-sc${on ? ' on' : ''}`} onClick={() => tir.jouerScenario(i)} aria-label={`Voir le scénario ${i + 1} : photon de ${r.nom}, ${Math.round(r.lam)} nanomètres`}
          style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) 52px 54px', gap: 4, alignItems: 'center', width: '100%', textAlign: 'left', cursor: 'pointer', padding: '5px 6px', margin: 0, borderTop: 'none', borderRight: 'none', borderBottom: `1px dashed ${KIT.bord}`, borderLeft: on ? '4px solid #be185d' : '4px solid transparent', background: on ? '#fce7f3' : choisi ? '#f1f5f9' : 'transparent', fontSize: 13.5, color: KIT.txt, fontFamily: 'inherit' }}>
          <span aria-hidden="true" style={{ fontWeight: 700 }}>{on ? '◄' : '▶'}</span>
          <span><strong>{i + 1}.</strong> {r.nom} <span style={{ color: KIT.txt2 }}>({Math.round(r.lam)}{NB}nm)</span></span>
          <span style={{ textAlign: 'right', fontFamily: 'monospace' }} title="probabilité prévue">{fmtProba(M.partRelative(s, T))}</span>
          <span style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }} title="obtenus">{etat.par[s] ?? 0}</span>
        </button>); })}
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Démonstration :</span>
      {vit.map(([k, l]) => <button key={k} onClick={() => tir.setVitDemo(k)} aria-pressed={tir.vitDemo === k} style={styleBouton(tir.vitDemo === k, '#334155')}>{l}</button>)}
    </div>
    {demo && <div style={{ marginTop: 8 }}>
      <label htmlFor="ic-av" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Scénario {demo.sc + 1} seul (aucun comptage) : avancement</label>
      <input id="ic-av" type="range" min="0" max="100" step="1" value={Math.round(prog * 100)} onChange={ev => tir.setManuel(parseInt(ev.target.value, 10) / 100)} aria-label="Avancement de l’animation" style={{ width: '100%', accentColor: '#be185d' }}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={() => tir.jouerScenario(demo.sc)} style={styleBouton(true, '#be185d')}>↻ Rejouer ce scénario</button>
        <button onClick={tir.quitterDemo} style={styleBouton(false)}>Revenir aux tirages</button>
      </div>
    </div>}
  </div>);
}

export function CommandesTiragesIcp({ tir }) {
  const occupe = !tir.etat.n || tir.etat.lot > 1 || tir.lecture;
  const b = k => <button key={k} onClick={() => tir.lancer(k)} disabled={tir.plein} style={{ ...styleBouton(false), opacity: tir.plein ? 0.5 : 1 }}>{k === 1 ? '1 photon' : `× ${k}`}</button>;
  return (<div>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Détecter des photons du plasma</div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Chaque photon est tiré au hasard, avec la probabilité de son élément. « × 10 » et « × 100 » montrent chaque photon ; « × 1000 » les groupe et seul le bilan s’affiche : le spectre se construit.</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1, 10, 100, 1000].map(b)}
      <button onClick={() => tir.rejouer()} disabled={occupe} style={{ ...styleBouton(false), opacity: occupe ? 0.5 : 1 }}>↻ Rejouer</button>
      <button onClick={tir.effacer} style={styleBouton(false)}>Effacer</button>
    </div>
    {tir.lecture && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Encore {tir.restant} photon{tir.restant > 1 ? 's' : ''} à tirer.</div>}
    {tir.plein && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Maximum atteint ({M.MAX_PHOTONS.toLocaleString('fr-FR')}) : effacez pour recommencer.</div>}
  </div>);
}
