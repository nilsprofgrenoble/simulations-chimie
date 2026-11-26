// Commandes et encart des scénarios des tirages de la simulation 313 (photons absorbés en SAA ; instantanés d'atomes excités en SEF).
import { styleBouton, KIT } from "../commun";
import * as M from "./flammeModele";
import { MAX_UNITES } from "./flammeHook";

const NB = ' ';
const fmtProba = v => { const p = 100 * v; return (p >= 10 ? String(Math.round(p)) : p >= 1 ? p.toFixed(1).replace('.', ',') : p === 0 ? '0' : p.toPrecision(2).replace('.', ',')) + NB + '%'; };

export function PanneauScenariosFlamme({ t, etat, courant, demo, prog, tir }) {
  const el = M.element(t.el), fl = M.flamme(t.fl), em = t.methode === 'emission';
  const f = M.fractionExcitee(el, fl.T), pT = M.transmittance(el, t.fl, t.c);
  const pr = em ? [1 - f, f] : [pT, 1 - pT];
  const obs = em ? [etat.n * 10000 - etat.nEx, etat.nEx] : [etat.n - etat.nEx, etat.nEx];
  const lignes = em ? [['Le choc est trop faible : l’atome reste au fondamental', 'aucune lumière'], ['Le choc excite l’atome, qui émet un photon', 'un photon émis']]
    : [['Le photon traverse la flamme', 'un coup au détecteur'], ['Un atome absorbe le photon', 'aucun coup']];
  const vit = [['normal', 'Normal'], ['lent', 'Ralenti'], ['tres', 'Très ralenti']];
  return (<div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Deux scénarios possibles pour {em ? 'un atome' : 'un photon'}</div>
    <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>Touchez une ligne pour voir le scénario seul, au ralenti. Colonnes : probabilité prévue, {em ? 'atomes obtenus' : 'photons obtenus'}.</div>
    <div role="list" aria-label="Scénarios possibles">
      {lignes.map(([nom, suite], i) => { const on = courant === i, choisi = demo?.sc === i; return (
        <button role="listitem" key={i} className={`fm-sc${on ? ' on' : ''}`} onClick={() => tir.jouerScenario(i)} aria-label={`Voir le scénario ${i + 1} : ${nom}, ${suite}`}
          style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) 52px 54px', gap: 4, alignItems: 'center', width: '100%', textAlign: 'left', cursor: 'pointer', padding: '6px 6px', margin: 0, borderTop: 'none', borderRight: 'none', borderBottom: `1px dashed ${KIT.bord}`, borderLeft: on ? '5px solid #d97706' : '5px solid transparent', background: on ? '#fef3c7' : 'transparent', fontSize: 13.5, lineHeight: 1.3, color: KIT.txt, fontFamily: 'inherit', outline: choisi ? '2px solid #d97706' : 'none', outlineOffset: -2 }}>
          <span aria-hidden="true" style={{ fontWeight: 700 }}>{on ? '◄' : '▶'}</span>
          <span><strong>{i + 1}.</strong> {nom} <span style={{ color: KIT.txt2 }}>→ {suite}</span></span>
          <span style={{ textAlign: 'right', fontFamily: 'monospace' }} title="probabilité prévue">{fmtProba(pr[i])}</span>
          <span style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }} title="obtenus">{obs[i]}</span>
        </button>); })}
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Démonstration :</span>
      {vit.map(([k, l]) => <button key={k} onClick={() => tir.setVitDemo(k)} aria-pressed={tir.vitDemo === k} style={styleBouton(tir.vitDemo === k, '#334155')}>{l}</button>)}
    </div>
    {demo && <div style={{ marginTop: 8 }}>
      <label htmlFor="fm-av" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>Scénario {demo.sc + 1} seul (aucun comptage) : avancement</label>
      <input id="fm-av" type="range" min="0" max="100" step="1" value={Math.round(prog * 100)} onChange={ev => tir.setManuel(parseInt(ev.target.value, 10) / 100)} aria-label="Avancement de l’animation" style={{ width: '100%', accentColor: '#d97706' }}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button onClick={() => tir.jouerScenario(demo.sc)} style={styleBouton(true, '#d97706')}>↻ Rejouer ce scénario</button>
        <button onClick={tir.quitterDemo} style={styleBouton(false)}>Revenir aux tirages</button>
      </div>
    </div>}
  </div>);
}

export function CommandesTiragesFlamme({ tir }) {
  const em = tir.t.methode === 'emission', occupe = !tir.etat.n || tir.etat.lot > 1 || tir.lecture;
  const b = k => <button key={k} onClick={() => tir.lancer(k)} disabled={tir.plein} style={{ ...styleBouton(false), opacity: tir.plein ? 0.5 : 1 }}>{k === 1 ? (em ? '1 instantané' : '1 photon') : `× ${k}`}</button>;
  return (<div>
    <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>{em ? 'Photographier les atomes de la flamme' : 'Envoyer des photons'}</div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>{em ? 'Chaque instantané montre 10 000 atomes libres : les atomes excités s’allument. « × 10 » en enchaîne dix ; « × 1000 » les groupe et seul le bilan s’affiche.' : 'Les photons défilent un par un : « × 10 » dure une quinzaine de secondes. « × 1000 » les groupe : seul le bilan s’affiche.'}</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {[1, 10, 100, 1000].map(b)}
      <button onClick={() => tir.rejouer()} disabled={occupe} style={{ ...styleBouton(false), opacity: occupe ? 0.5 : 1 }}>↻ Rejouer</button>
      <button onClick={tir.effacer} style={styleBouton(false)}>Effacer</button>
    </div>
    {tir.lecture && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Encore {tir.restant} {em ? 'instantané' : 'photon'}{tir.restant > 1 ? 's' : ''} à tirer.</div>}
    {tir.plein && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Maximum atteint ({MAX_UNITES.toLocaleString('fr-FR')}) : effacez pour recommencer.</div>}
  </div>);
}
