import { useState, useMemo } from "react";
import { cardStyle, KIT, styleBouton, stylePetitBouton, styleBoite, ORANGE_GUIDE, ARetenir, avecIndices, exParam } from "../commun";
import { useSuivi } from "../suivi";
import { parDomaine } from "./ordreDomaines";
import { FAMILLES, METHODE } from "./AtelierAnalyserBanque";

// ====================================================
//  SIM 37 — ATELIER « ANALYSER » (compétence S'APP : analyser)
// ====================================================
// Démarche travaillée : identifier ce que l'on cherche et le critère, trier les données, choisir les relations,
// expliciter les hypothèses, ordonner les calculs, conclure. Plus trois entraînements courts : choisir une relation,
// reconnaître les hypothèses d'un modèle, prévoir sans calculer (proportionnalité, carré, racine).

const NB = ' ';
// Espaces insécables (nombre + unité, milliers) puis indices (« Q_V »)
const T = s => (typeof s === 'string'
  ? avecIndices(s.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NB}`).replace(/(\d) (?=[A-Za-zµ°%€Ωθ²³]|h\b)/g, `$1${NB}`).replace(/ ([:;?!])/g, `${NB}$1`))
  : s);
const melange = n => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const VERT = '#15803d', ROUGE = '#b91c1c';
const Verdict = ({ ok, children }) => (
  <div style={{ fontSize: 14, marginTop: 8, fontWeight: 700, color: ok ? VERT : ROUGE }}>{ok ? '✅ ' : '❌ '}{children}</div>
);
const Expl = ({ ok, children }) => (
  <div style={{ fontSize: 13.5, marginTop: 3, marginLeft: 4, color: ok == null ? KIT.txt : ok ? '#166534' : '#991b1b', lineHeight: 1.5 }}>{children}</div>
);
const lien = { fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' };
const choix = (actif, etat) => ({
  ...styleBouton(actif, '#0ea5e9'), textAlign: 'left', padding: '6px 10px', fontWeight: 600, lineHeight: 1.45,
  ...(etat === 'bon' ? { background: '#dcfce7', borderColor: VERT, color: '#14532d' } : {}),
  ...(etat === 'faux' ? { background: '#fee2e2', borderColor: ROUGE, color: '#7f1d1d' } : {}),
  ...(etat === 'manque' ? { background: 'white', border: `2px dashed ${ORANGE_GUIDE}`, color: KIT.txt } : {}),
});

// ── Vérifications ──
const okQcm = (o, v) => v != null && o[v][1];
const okMulti = (o, sel) => o.every((x, i) => !!sel[i] === x[1]);
const okTri = (d, rep) => d.every((x, i) => rep[i] === x[1]);
function diagOrdre(dem, seq) {
  const pieges = seq.filter(i => i >= dem.etapes.length);
  if (pieges.length) return { ok: false, msg: `Une étape inutile s’est glissée dans la démarche : « ${dem.pieges[pieges[0] - dem.etapes.length][0]} ».` };
  const manque = dem.etapes.filter((_, i) => !seq.includes(i));
  if (manque.length) return { ok: false, msg: `Il manque ${manque.length > 1 ? `${manque.length} étapes` : 'une étape'}.` };
  for (let k = 0; k < seq.length; k++) {
    const e = dem.etapes[seq[k]];
    const avant = seq.slice(0, k).map(i => dem.etapes[i].id);
    const absent = e.dep.find(d => !avant.includes(d));
    if (absent) return { ok: false, msg: `« ${e.t} » utilise un résultat qui n’est pas encore calculé : « ${dem.etapes.find(x => x.id === absent).t} ».` };
  }
  return { ok: true, msg: '' };
}

// ── Briques d'interface ──
function Qcm({ o, perm, val, set, chk, vu }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {perm.map(i => {
        const etat = (chk || vu) && val === i ? (o[i][1] ? 'bon' : 'faux') : vu && o[i][1] ? 'manque' : null;
        return (
          <div key={`${i}-${T(o[i][0])}`}>
            <button data-ok={o[i][1] ? 'true' : 'false'} onClick={() => set(i)} style={{ ...choix(val === i && !etat, etat), width: '100%' }}>{T(o[i][0])}</button>
            {((chk && val === i) || vu) && <Expl ok={o[i][1]}>{o[i][1] ? '✔ ' : '✘ '}{T(o[i][2])}</Expl>}
          </div>);
      })}
    </div>);
}
function Multi({ o, perm, sel, toggle, chk, vu }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {perm.map(i => {
        const s = !!sel[i], juste = o[i][1];
        const etat = vu ? (juste ? (s ? 'bon' : 'manque') : (s ? 'faux' : null)) : chk && s ? (juste ? 'bon' : 'faux') : null;
        return (
          <div key={`${i}-${T(o[i][0])}`}>
            <button data-ok={juste ? 'true' : 'false'} aria-pressed={s} onClick={() => toggle(i)} style={{ ...choix(s && !etat, etat), width: '100%' }}>
              <span style={{ marginRight: 6 }}>{s ? '☑' : '☐'}</span>{T(o[i][0])}</button>
            {((chk && s) || vu) && <Expl ok={juste}>{juste ? '✔ Nécessaire : ' : '✘ Pas nécessaire : '}{T(o[i][2])}</Expl>}
          </div>);
      })}
    </div>);
}
function Tri({ d, rep, set, chk, vu }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {d.map(([t, utile, e], i) => {
        const faux = (chk || vu) && rep[i] != null && rep[i] !== utile;
        return (
          <div key={i} style={{ background: 'white', border: `1.5px solid ${faux ? ROUGE : (chk || vu) && rep[i] === utile ? VERT : KIT.bord}`, borderRadius: 8, padding: '6px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ flex: '1 1 180px', fontSize: 14.5, color: KIT.txt }}>{T(t)}</span>
              {[[true, 'Utile'], [false, 'Inutile']].map(([v, l]) => (
                <button key={l} data-ok={v === utile ? 'true' : 'false'} onClick={() => set(i, v)}
                  style={stylePetitBouton(rep[i] === v, v ? '#0f766e' : '#64748b')}>{l}</button>))}
            </div>
            {(faux || vu) && <Expl ok={!faux}>{utile ? 'Utile : ' : 'Inutile : '}{T(e)}</Expl>}
          </div>);
      })}
    </div>);
}
function Ordre({ dem, perm, seq, setSeq, chk, vu }) {
  const tout = [...dem.etapes.map(e => e.t), ...dem.pieges.map(p => p[0])];
  const libres = perm.filter(i => !seq.includes(i));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Étapes proposées : cliquez-les dans l’ordre où vous les feriez (laissez de côté les étapes inutiles).</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {libres.map(i => (
            <button key={i} data-rang={i < dem.etapes.length ? i : -1} onClick={() => setSeq([...seq, i])}
              style={{ ...choix(false), width: '100%' }}>＋ {T(tout[i])}</button>))}
          {!libres.length && <div style={{ fontSize: 13, color: KIT.txt2 }}>Toutes les étapes sont placées.</div>}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Votre démarche :</div>
        {!seq.length && <div style={{ fontSize: 13, color: KIT.txt2, fontStyle: 'italic' }}>Aucune étape pour l’instant.</div>}
        <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {seq.map((i, k) => (
            <li key={i} style={{ fontSize: 14.5, color: KIT.txt }}>
              <span style={{ background: 'white', border: `1.5px solid ${ORANGE_GUIDE}`, borderRadius: 7, padding: '3px 8px', display: 'inline-block' }}>{T(tout[i])}</span>
              <button aria-label="Retirer cette étape" onClick={() => setSeq(seq.filter((_, j) => j !== k))} style={{ ...lien, marginLeft: 6 }}>retirer</button>
            </li>))}
        </ol>
      </div>
      {vu && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 4 }}>Une démarche possible</div>
          <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
            {dem.etapes.map(e => <li key={e.id}>{T(e.t)} <span style={{ color: KIT.txt2 }}>→ {T(e.e)}</span></li>)}
          </ol>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, margin: '8px 0 4px' }}>Étapes inutiles</div>
          <ul style={{ margin: 0, paddingLeft: 22, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
            {dem.pieges.map(([t, e], i) => <li key={i}>{T(t)} <span style={{ color: '#991b1b' }}>→ {T(e)}</span></li>)}
          </ul>
          {dem.etapes.some(e => !e.dep.length && dem.etapes.indexOf(e) > 0) && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Les étapes indépendantes les unes des autres peuvent être faites dans un ordre différent.</div>}
        </div>)}
    </div>);
}

// ── Étapes d'un exercice ──
function etapesDe(fam, it) {
  if (fam === 'probleme') return [
    { id: 'cherche', type: 'qcm', titre: 'Que cherche-t-on ?', q: it.cherche.q, o: it.cherche.options },
    { id: 'donnees', type: 'tri', titre: 'Trier les données de l’énoncé', q: 'Pour chaque donnée, indiquez si elle est utile pour répondre.', d: it.donnees },
    ...(it.aConnaitre ? [{ id: 'connaitre', type: 'qcm', titre: 'Ce qui manque dans l’énoncé', q: it.aConnaitre.q, o: it.aConnaitre.options }] : []),
    { id: 'relations', type: 'multi', titre: 'Choisir les relations', q: 'Cochez toutes les relations nécessaires, et seulement elles.', o: it.relations.options },
    { id: 'hypotheses', type: 'multi', titre: 'Expliciter les hypothèses', q: 'Cochez les hypothèses nécessaires pour appliquer ces relations, et seulement elles.', o: it.hypotheses.options },
    { id: 'demarche', type: 'ordre', titre: 'Ordonner la démarche', dem: it.demarche },
  ];
  if (fam === 'hypothese') return [{ id: 'h', type: 'multi', titre: 'Hypothèses nécessaires', q: 'Cochez toutes les hypothèses nécessaires, et seulement elles.', o: it.options }];
  return [{ id: 'q', type: 'qcm', titre: fam === 'relation' ? 'Choisir la relation' : 'Prévoir', q: it.q, o: it.options }];
}
const permsDe = etapes => Object.fromEntries(etapes.map(e => [e.id,
  e.type === 'ordre' ? melange(e.dem.etapes.length + e.dem.pieges.length) : e.o ? melange(e.o.length) : null]));

export function SimulationAtelierAnalyser() {
  const depart = (() => { const [f, i] = (exParam() || '').split('.'); const fa = FAMILLES.find(x => x.id === f); const k = fa ? fa.liste.findIndex(x => x.id === i) : -1; return { f: fa ? f : 'probleme', i: Math.max(0, k) }; })();
  const [fam, setFam] = useState(depart.f);
  const famille = FAMILLES.find(f => f.id === fam);
  const [idx, setIdx] = useState(depart.i);
  const it = famille.liste[Math.min(idx, famille.liste.length - 1)];
  const etapes = useMemo(() => etapesDe(fam, it), [fam, it]);
  const [graine, setGraine] = useState(0);
  const perms = useMemo(() => permsDe(etapes), [etapes, graine]); // eslint-disable-line react-hooks/exhaustive-deps
  const [rep, setRep] = useState({});
  const [chk, setChk] = useState({});
  const [vu, setVu] = useState({});
  const [etp, setEtp] = useState(0);

  const charger = (f, i) => { try { document.activeElement?.blur?.(); } catch { /* sans effet */ } setFam(f); setIdx(i); setRep({}); setChk({}); setVu({}); setEtp(0); setGraine(g => g + 1); };
  const hasard = () => { const n = famille.liste.length; let j = idx; if (n > 1) while (j === idx) j = Math.floor(Math.random() * n); charger(fam, j); };
  const suivant = () => charger(fam, (idx + 1) % famille.liste.length);
  const majRep = (id, v) => { setRep(r => ({ ...r, [id]: v })); setChk(c => ({ ...c, [id]: false })); };

  const resultat = e => {
    const r = rep[e.id];
    if (e.type === 'qcm') return { ok: okQcm(e.o, r), msg: r == null ? 'Choisissez une réponse.' : '' };
    if (e.type === 'multi') {
      const sel = r || {}, o = e.o;
      const bons = o.filter((x, i) => x[1] && sel[i]).length, trop = o.filter((x, i) => !x[1] && sel[i]).length, manque = o.filter((x, i) => x[1] && !sel[i]).length;
      return { ok: okMulti(o, sel), msg: [trop && `${trop} réponse${trop > 1 ? 's' : ''} en trop`, manque && `il en manque ${manque}`].filter(Boolean).join(', ') + (bons && (trop || manque) ? ` (${bons} juste${bons > 1 ? 's' : ''})` : '') };
    }
    if (e.type === 'tri') {
      const t = r || {}, nonRep = e.d.filter((_, i) => t[i] == null).length, faux = e.d.filter((x, i) => t[i] != null && t[i] !== x[1]).length;
      return { ok: okTri(e.d, t), msg: nonRep ? `${nonRep} donnée${nonRep > 1 ? 's' : ''} non classée${nonRep > 1 ? 's' : ''}.` : faux ? `${faux} donnée${faux > 1 ? 's' : ''} mal classée${faux > 1 ? 's' : ''} (en rouge).` : '' };
    }
    return diagOrdre(e.dem, r || []);
  };
  const fini = etapes.every(e => chk[e.id] && (resultat(e).ok || vu[e.id]));
  const reussi = etapes.every(e => chk[e.id] && resultat(e).ok);
  const suivi = useSuivi(`37:${fam}:${it.id}`, reussi);

  const carte = (e, k) => {
    const r = resultat(e), c = !!chk[e.id], v = !!vu[e.id];
    return (
      <div key={e.id} data-etape={e.id} style={styleBoite}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: ORANGE_GUIDE, letterSpacing: 0.3, textTransform: 'uppercase' }}>{etapes.length > 1 ? `Étape ${k + 1} / ${etapes.length} — ` : ''}{e.titre}</div>
        {e.q && <div style={{ fontWeight: 700, fontSize: 14.5, color: KIT.txt, margin: '4px 0 8px', lineHeight: 1.5 }}>{T(e.q)}</div>}
        {e.type === 'qcm' && <Qcm o={e.o} perm={perms[e.id]} val={rep[e.id]} set={i => majRep(e.id, i)} chk={c} vu={v}/>}
        {e.type === 'multi' && <Multi o={e.o} perm={perms[e.id]} sel={rep[e.id] || {}} chk={c} vu={v}
          toggle={i => majRep(e.id, { ...(rep[e.id] || {}), [i]: !(rep[e.id] || {})[i] })}/>}
        {e.type === 'tri' && <Tri d={e.d} rep={rep[e.id] || {}} chk={c} vu={v} set={(i, x) => majRep(e.id, { ...(rep[e.id] || {}), [i]: x })}/>}
        {e.type === 'ordre' && <Ordre dem={e.dem} perm={perms[e.id]} seq={rep[e.id] || []} chk={c} vu={v} setSeq={s => majRep(e.id, s)}/>}
        {c && <Verdict ok={r.ok}>{r.ok ? 'Bravo !' : 'Pas encore.'}{!r.ok && r.msg ? <span style={{ fontWeight: 500, color: KIT.txt }}> {T(r.msg)}</span> : null}</Verdict>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          {!(c && r.ok) && <button onClick={() => { suivi.essai(); setChk(x => ({ ...x, [e.id]: true })); }} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>}
          {c && !v && <button onClick={() => { suivi.vue(); setVu(x => ({ ...x, [e.id]: true })); }} style={lien}>{r.ok ? 'voir toutes les explications' : 'voir la correction'}</button>}
          {(r.ok || v) && c && k === etp && k < etapes.length - 1 && <button onClick={() => setEtp(x => x + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Étape suivante ▶</button>}
        </div>
      </div>);
  };

  const enonce = (
    <div style={{ ...styleBoite, background: 'white' }}>
      <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{it.domaine}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: KIT.txt, margin: '2px 0 6px' }}>{it.titre}</div>
      <div style={{ fontSize: 15, color: KIT.txt, lineHeight: 1.65 }}>{T(it.enonce)}</div>
    </div>);
  const methode = fam === 'probleme' && (
    <div style={{ ...styleBoite, fontSize: 13.5, color: KIT.txt }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>La démarche d’analyse</div>
      <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.55 }}>{METHODE.map((m, i) => <li key={i} style={{ fontWeight: i === ({ cherche: 0, donnees: 1, connaitre: 1, relations: 2, hypotheses: 3 }[etapes[etp]?.id] ?? 4) ? 700 : 400 }}>{m}</li>)}</ol>
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ata-l1 { display: grid; align-items: start; gap: 12px; grid-template-columns: minmax(0, 1fr) minmax(320px, 1.15fr); }
        .ata-g { position: sticky; top: 8px; display: flex; flex-direction: column; gap: 10px; }
        @media (max-width: 960px) { .ata-l1 { grid-template-columns: minmax(0, 1fr); } .ata-g { position: static; } }
      `}</style>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, color: KIT.txt, fontWeight: 700 }}>ANA : analyser un problème</h2>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10 }}>Compétence travaillée : <b>Analyser</b> (ANA) — identifier ce que l’on cherche, trier les données, choisir les relations, expliciter les hypothèses, organiser la démarche. Ici, on ne calcule presque pas : on prépare la résolution.</div>
      <div style={{ ...styleBoite, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <label style={{ fontSize: 14 }}>Entraînement :{' '}
          <select aria-label="Type d’entraînement" value={fam} onChange={e => charger(e.target.value, 0)}
            style={{ fontSize: 14, padding: 4, borderRadius: 6, border: `1.5px solid ${KIT.bord}`, color: KIT.txt, background: 'white' }}>
            {FAMILLES.map(f => <option key={f.id} value={f.id}>{f.titre}</option>)}
          </select></label>
        <label style={{ fontSize: 14 }}>Énoncé :{' '}
          <select aria-label="Choix de l’énoncé" value={it.id} onChange={e => charger(fam, famille.liste.findIndex(x => x.id === e.target.value))}
            style={{ fontSize: 14, padding: 4, borderRadius: 6, border: `1.5px solid ${KIT.bord}`, color: KIT.txt, background: 'white', maxWidth: 320 }}>
            {parDomaine(famille.liste).map(([d, l]) => <optgroup key={d} label={d}>{l.map(x => <option key={x.id} value={x.id}>{x.titre}</option>)}</optgroup>)}
          </select></label>
        <button onClick={hasard} style={stylePetitBouton(false)}>🎲 Au hasard</button>
        <div style={{ flexBasis: '100%', fontSize: 13, color: KIT.txt2 }}>{famille.aide}</div>
      </div>
      <div className={fam === 'probleme' ? 'ata-l1' : ''} style={fam === 'probleme' ? {} : { maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fam === 'probleme' ? <div className="ata-g">{enonce}{methode}</div> : enonce}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {etapes.slice(0, etp + 1).map((e, k) => carte(e, k))}
          {fini && fam === 'probleme' && it.conclusion && (
            <div style={{ ...styleBoite, fontSize: 14, lineHeight: 1.55 }}>
              <b>Résultat de la démarche (pour vérifier si vous l’avez menée) :</b> {(o => <>{T(o[0])}. {T(o[2])}</>)(it.conclusion.options.find(o => o[1]) || it.conclusion.options[0])}
            </div>)}
          {fini && fam === 'probleme' && (
            <ARetenir titre="À RETENIR">
              <ol style={{ margin: '0 0 4px', paddingLeft: 20 }}>{METHODE.map((m, i) => <li key={i}>{m}</li>)}</ol>
              <ul style={{ margin: 0, paddingLeft: 20 }}>{it.retenir.map((x, i) => <li key={i}>{T(x)}</li>)}</ul>
            </ARetenir>)}
          {fini && <button onClick={suivant} style={{ ...styleBouton(true, '#334155'), alignSelf: 'flex-start' }}>Énoncé suivant ▶</button>}
        </div>
      </div>
    </div>
  );
}
