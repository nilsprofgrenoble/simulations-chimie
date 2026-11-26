import { useState, useMemo, useEffect } from "react";
import { FIOLES, PIPETTES, SERVICES, commandesDuService, realiser, retour, correction, fmtC, fmtF, teinte, points } from "./cuisineDilutionModele";

// ====================================================
//  SIM 291 : SERVICE EN CUISINE — DILUTIONS (jeu, 2GT → 1G). Des commandes arrivent : choisis pipette et fiole jaugées
//  pour préparer la bonne concentration avant que le client parte. Hors menu : réservé à l'administrateur (jeuxVisibles.js) ; ?sim=291.
//  Modèle et tests : cuisineDilutionModele.js.
// ====================================================
const C = { fond: '#1b1209', panneau: '#2a1d10', bord: '#5b4128', texte: '#fff4e0', doux: '#d9c0a0', ambre: '#ffc15a', vert: '#3be29a', rouge: '#ff6b6b', bleu: '#38b6ff', encre: '#2b1a08' };
const CLE = 'cuisine-dilution-v1';
const lire = () => { try { return JSON.parse(window.localStorage.getItem(CLE) || '{}'); } catch { return {}; } };
const ecrire = o => { try { window.localStorage.setItem(CLE, JSON.stringify(o)); } catch { /* sans stockage : records gardés pour la séance seulement */ } };
const GRAINE_JOUR = () => Math.floor(Date.now() / 86400000);   // ordre des commandes différent chaque jour (appelé seulement dans un gestionnaire)

const STYLE = `
@keyframes cd-pop{0%{transform:scale(.94);opacity:0}100%{transform:none;opacity:1}}
.cd-pop{animation:cd-pop .3s ease-out}
.cd-btn{min-height:44px;padding:0 14px;border-radius:14px;border:2px solid ${C.bord};background:${C.panneau};color:${C.texte};font:800 15px Inter,system-ui,sans-serif;cursor:pointer}
.cd-btn:hover{border-color:${C.ambre}}.cd-btn:focus-visible{outline:3px solid #fff;outline-offset:2px}
.cd-btn[aria-pressed=true]{background:${C.ambre};color:${C.encre};border-color:${C.ambre}}
.cd-btn:disabled{opacity:.45;cursor:not-allowed}
.cd-grand{min-height:52px;padding:0 24px;border-radius:999px;border:none;background:${C.ambre};color:${C.encre};font:800 17px Inter,system-ui,sans-serif;cursor:pointer}
.cd-grand:disabled{opacity:.45;cursor:not-allowed}.cd-grand:focus-visible{outline:3px solid #fff;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.cd-pop{animation:none}}
`;

// Fiole jaugée (dessin) remplie d'un colorant bleu dont la teinte suit la concentration
function Fiole({ V, conc, titre, largeur = 84 }) {
  const a = conc == null ? 0 : teinte(conc);
  return (
    <figure style={{ margin: 0, textAlign: 'center', width: largeur }}>
      <svg viewBox="0 0 84 112" width={largeur} role="img" aria-label={`${titre} : fiole${typeof V === 'number' ? ` de ${V} mL` : ''}${conc == null ? ', vide' : `, concentration ${fmtC(conc)} mol/L`}`}>
        <defs><clipPath id={`cd-f-${titre.replace(/\W/g, '')}`}><path d="M34 6 H50 V40 C70 50 78 66 78 82 C78 100 64 108 42 108 C20 108 6 100 6 82 C6 66 14 50 34 40 Z" /></clipPath></defs>
        <path d="M34 6 H50 V40 C70 50 78 66 78 82 C78 100 64 108 42 108 C20 108 6 100 6 82 C6 66 14 50 34 40 Z" fill="rgba(255,255,255,.06)" />
        <g clipPath={`url(#cd-f-${titre.replace(/\W/g, '')})`}><rect x="0" y="22" width="84" height="100" fill={C.bleu} fillOpacity={a} /></g>
        <path d="M34 6 H50 V40 C70 50 78 66 78 82 C78 100 64 108 42 108 C20 108 6 100 6 82 C6 66 14 50 34 40 Z" fill="none" stroke="#e7d7bd" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="31" y1="22" x2="53" y2="22" stroke="#ff6b6b" strokeWidth="2" />
        <text x="42" y="90" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff4e0" style={{ paintOrder: 'stroke' }} stroke="#1b1209" strokeWidth="3">{typeof V === 'number' ? `${V} mL` : V}</text>
      </svg>
      <figcaption style={{ fontSize: 12.5, color: C.doux, lineHeight: 1.3 }}>{titre}{conc != null && <><br /><b style={{ color: C.texte }}>{fmtC(conc)} mol/L</b></>}</figcaption>
    </figure>);
}

export function SimulationCuisineDilution() {
  const [ecran, setEcran] = useState(null);      // null = menu ; sinon { service, graine }
  const [detente, setDetente] = useState(false);
  const [rec, setRec] = useState(lire);
  const fini = (service, score, etoiles) => setRec(r => { const o = { ...r, [service.id]: { score: Math.max(r[service.id]?.score || 0, score), etoiles: Math.max(r[service.id]?.etoiles || 0, etoiles) } }; ecrire(o); return o; });
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', color: C.texte, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{STYLE}</style>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h1 style={{ margin: 0, font: "800 24px Outfit, Inter, sans-serif", color: C.texte }}>🍽️ Service en cuisine : dilutions</h1>
        {ecran && <button type="button" className="cd-btn" style={{ marginLeft: 'auto', minHeight: 36 }} onClick={() => setEcran(null)}>← Menu</button>}
      </header>
      {!ecran && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 15.5, lineHeight: 1.55, color: C.doux }}>
            Tu es le chef du labo-cuisine : les clients commandent des solutions de concentration précise. Pour chaque commande, choisis <b style={{ color: C.texte }}>la pipette jaugée</b> pour prélever la solution mère et <b style={{ color: C.texte }}>la fiole jaugée</b> pour la diluer jusqu'au trait. Sers vite, et juste !
          </p>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 12px', fontSize: 15 }}>
            <input type="checkbox" checked={detente} onChange={ev => setDetente(ev.target.checked)} style={{ width: 20, height: 20 }} />
            Mode détente (sans chronomètre)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
            {SERVICES.map(s => (
              <section key={s.id} aria-label={`Service ${s.id}`} style={{ background: C.panneau, border: `1.5px solid ${C.bord}`, borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ font: "800 18px Outfit, Inter, sans-serif" }}>{s.icone} Service {s.id} · {s.nom}</div>
                <div style={{ fontSize: 14, color: C.doux, lineHeight: 1.45, flex: 1 }}>{s.textes} <span style={{ whiteSpace: 'nowrap' }}>({s.nb} commandes)</span></div>
                <div style={{ fontSize: 13.5, color: C.ambre }}>{rec[s.id] ? <>Record : {rec[s.id].score} pts · {'★'.repeat(rec[s.id].etoiles)}{'☆'.repeat(3 - rec[s.id].etoiles)}</> : 'Pas encore joué'}</div>
                <button type="button" className="cd-grand" onClick={() => setEcran({ service: s, graine: GRAINE_JOUR() + Math.floor(Math.random() * 1000) })}>Ouvrir le service ▶</button>
              </section>))}
          </div>
          <details style={{ marginTop: 14, background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '8px 14px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses du modèle</summary>
            <ul style={{ margin: '6px 0 2px', paddingLeft: 20, fontSize: 13.5, color: C.doux, lineHeight: 1.55 }}>
              <li>La verrerie jaugée est supposée parfaite : on ne tient pas compte de son incertitude (en vrai, elle compte !).</li>
              <li>Les volumes sont supposés additifs et le mélange parfaitement homogène après agitation.</li>
              <li>Le prélèvement à la pipette est exact et la fiole est complétée exactement au trait de jauge.</li>
              <li>On travaille avec des solutions diluées : l'état « dilué » ne change pas la nature de la solution mère.</li>
              <li>La teinte bleue est une illustration : plus la solution est concentrée, plus elle est foncée.</li>
            </ul>
          </details>
        </div>)}
      {ecran && <Service key={ecran.graine + '-' + ecran.service.id} service={ecran.service} graine={ecran.graine} detente={detente} onFin={fini} onMenu={() => setEcran(null)} />}
    </div>);
}

function Service({ service, graine, detente, onFin, onMenu }) {
  const cmds = useMemo(() => commandesDuService(service, graine), [service, graine]);
  const [i, setI] = useState(0);
  const [etapes, setEtapes] = useState([{ p: null, f: null }]);
  const [essais, setEssais] = useState(0);
  const [indices, setIndices] = useState(0);
  const [ecoule, setEcoule] = useState(0);
  const [phase, setPhase] = useState('jeu');          // jeu | ok | rate
  const [msg, setMsg] = useState(null);
  const [score, setScore] = useState(0);
  const [serie, setSerie] = useState(0);
  const [resultats, setResultats] = useState([]);     // un booléen par commande terminée
  const [bilan, setBilan] = useState(null);
  const cmd = cmds[i];
  const patience = service.patience;
  const expire = !detente && ecoule >= patience;
  useEffect(() => {
    if (phase !== 'jeu' || detente || expire || bilan) return undefined;
    const id = setInterval(() => setEcoule(e => e + 0.25), 250);
    return () => clearInterval(id);
  }, [phase, detente, expire, i, bilan]);

  const restant = Math.max(0, patience - ecoule);
  const choisi = (k, cle, v) => setEtapes(es => es.map((e, j) => (j === k ? { ...e, [cle]: e[cle] === v ? null : v } : e)));
  const complet = etapes.every(e => e.p && e.f);
  const concIntermediaire = k => { const r = realiser(cmd.C0, etapes.slice(0, k)); return r.ok ? { C: r.C, V: r.V } : null; };

  const servir = () => {
    const rt = retour(cmd, etapes);
    if (rt.juste) {
      const pts = points({ restant, patience, essais, indices, serie, detente });
      setScore(s => s + pts); setSerie(s => s + 1); setMsg({ ...rt, pts }); setPhase('ok');
    } else {
      const e = essais + 1;
      setEssais(e); setSerie(0); setMsg(rt);
      if (e >= 3) setPhase('rate');
    }
  };
  const suivant = reussi => {
    const res = [...resultats, reussi];
    if (!reussi) setSerie(0);
    if (i + 1 >= cmds.length) {
      const ok = res.filter(Boolean).length, part = ok / cmds.length, etoiles = part === 1 ? 3 : part >= 0.6 ? 2 : 1;
      setResultats(res); setBilan({ ok, etoiles }); onFin(service, score, etoiles);
      return;
    }
    setResultats(res); setI(i + 1); setEtapes([{ p: null, f: null }]); setEssais(0); setIndices(0); setEcoule(0); setPhase('jeu'); setMsg(null);
  };

  if (bilan) {
    return (
      <div className="cd-pop" style={{ background: C.panneau, border: `1.5px solid ${C.bord}`, borderRadius: 18, padding: '18px 18px 16px' }}>
        <div style={{ font: "800 22px Outfit, Inter, sans-serif" }}>Service terminé ! <span style={{ color: C.ambre }}>{'★'.repeat(bilan.etoiles)}{'☆'.repeat(3 - bilan.etoiles)}</span></div>
        <p style={{ fontSize: 16, margin: '8px 0' }}>{bilan.ok} commande{bilan.ok > 1 ? 's' : ''} réussie{bilan.ok > 1 ? 's' : ''} sur {cmds.length} · <b style={{ color: C.ambre }}>{score} points</b></p>
        <div style={{ background: C.fond, borderRadius: 12, padding: '10px 14px', fontSize: 14.5, lineHeight: 1.6 }}>
          <b>À retenir</b><br />
          • Pendant une dilution, la quantité de matière ne change pas : <b>C₀ × V<sub>prélevé</sub> = C × V<sub>fiole</sub></b>.<br />
          • Le facteur de dilution est <b>F = C₀ / C = V<sub>fiole</sub> / V<sub>prélevé</sub></b>.<br />
          • Pour une dilution en deux temps, les facteurs se multiplient : <b>F = F₁ × F₂</b>.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" className="cd-grand" onClick={onMenu}>Retour au menu</button>
        </div>
      </div>);
  }

  const F = cmd.C0 / cmd.Ct;
  const sol = (phase === 'rate' || expire) ? correction(cmd, service.etapesMax) : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: 14.5 }}>
        <b>Service {service.id} · {service.nom}</b>
        <span style={{ color: C.doux }}>Commande {i + 1} / {cmds.length}</span>
        <span style={{ marginLeft: 'auto', color: C.ambre, fontWeight: 800 }}>{score} pts{serie >= 2 ? ` · série ×${serie}` : ''}</span>
      </div>

      {/* ticket */}
      <section aria-label="Commande" style={{ background: '#fff8e8', color: C.encre, borderRadius: 14, padding: '12px 16px', boxShadow: '0 4px 14px rgba(0,0,0,.35)', marginBottom: 10 }}>
        <div style={{ font: "800 13px Inter, sans-serif", letterSpacing: '.08em', textTransform: 'uppercase', color: '#92400e' }}>Table {cmd.table}</div>
        <div style={{ fontSize: 18, fontWeight: 800, margin: '2px 0' }}>{cmd.Vt} mL de solution à {fmtC(cmd.Ct)} mol/L</div>
        <div style={{ fontSize: 14.5 }}>à préparer à partir de la solution mère S₀ : <b>{fmtC(cmd.C0)} mol/L</b>{service.etapesMax > 1 ? ' (une seule étape ne suffira pas)' : ''}.</div>
        {!detente && (
          <div role="progressbar" aria-label="Patience du client" aria-valuemin={0} aria-valuemax={patience} aria-valuenow={Math.round(restant)} style={{ marginTop: 8, height: 10, borderRadius: 999, background: '#e8d9b8', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${100 * restant / patience}%`, background: restant / patience > 0.4 ? '#16a34a' : restant / patience > 0.2 ? '#d97706' : '#dc2626', transition: 'width .25s linear' }} />
          </div>)}
      </section>

      {phase === 'jeu' && !expire && (
        <section aria-label="Plan de travail" style={{ background: C.panneau, border: `1.5px solid ${C.bord}`, borderRadius: 18, padding: '12px 14px' }}>
          {etapes.map((e, k) => {
            const src = k === 0 ? { C: cmd.C0, V: null } : concIntermediaire(k);
            return (
              <div key={k} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', borderTop: k ? `1px dashed ${C.bord}` : 'none', paddingTop: k ? 10 : 0, marginTop: k ? 10 : 0 }}>
                <Fiole V={`S${'₀₁₂'[k]}`} conc={src ? src.C : null} titre={k === 0 ? 'Solution mère' : `Solution intermédiaire (étape ${k})`} />
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Étape {k + 1} : je prélève… <span style={{ fontWeight: 500, color: C.doux }}>(pipette jaugée)</span></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {PIPETTES.map(p => <button key={p} type="button" className="cd-btn" aria-pressed={e.p === p} onClick={() => choisi(k, 'p', p)}>{p} mL</button>)}
                  </div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>…et je complète jusqu'au trait dans une fiole de <span style={{ fontWeight: 500, color: C.doux }}>(fiole jaugée)</span></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {FIOLES.map(f => <button key={f} type="button" className="cd-btn" aria-pressed={e.f === f} onClick={() => choisi(k, 'f', f)}>{f} mL</button>)}
                  </div>
                  {k > 0 && <button type="button" className="cd-btn" style={{ minHeight: 34, marginTop: 8, fontSize: 13 }} onClick={() => setEtapes(es => es.slice(0, k))}>✕ Supprimer cette étape</button>}
                </div>
              </div>);
          })}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            <button type="button" className="cd-grand" disabled={!complet} onClick={servir}>Servir 🍽️</button>
            {etapes.length < service.etapesMax && <button type="button" className="cd-btn" onClick={() => setEtapes(es => [...es, { p: null, f: null }])}>＋ Ajouter une étape (dilution en deux temps)</button>}
            <button type="button" className="cd-btn" disabled={indices >= 2} onClick={() => setIndices(n => n + 1)} style={{ marginLeft: 'auto' }}>💡 Indice (−20 pts)</button>
          </div>
          {indices >= 1 && <div className="cd-pop" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: C.fond, fontSize: 14.5, lineHeight: 1.55 }}>
            Facteur de dilution : <b>F = C₀ / C = {fmtC(cmd.C0)} / {fmtC(cmd.Ct)} = {fmtF(F)}</b>.
            {indices >= 2 && (service.etapesMax === 1
              ? <> Volume à prélever = V<sub>fiole</sub> / F = {cmd.Vt} / {fmtF(F)} = <b>{fmtF(cmd.Vt / F)} mL</b>.</>
              : <> En deux étapes, F = F₁ × F₂ : choisis deux facteurs dont le produit vaut {fmtF(F)} (ex. un facteur de {fmtF(Math.sqrt(F))} environ pour chaque étape).</>)}
          </div>}
          {msg && !msg.juste && <div role="alert" className="cd-pop" style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#4b1d1d', border: `1.5px solid ${C.rouge}`, fontSize: 14.5, lineHeight: 1.5 }}>
            ❌ {msg.texte}{msg.C != null && <> Tu as obtenu <b>{fmtC(msg.C)} mol/L</b> au lieu de {fmtC(cmd.Ct)} mol/L.</>} <span style={{ color: C.doux }}>(essai {essais} / 3)</span>
          </div>}
        </section>)}

      {phase === 'ok' && (
        <section className="cd-pop" aria-live="polite" style={{ background: '#0b3b2a', border: `1.5px solid ${C.vert}`, borderRadius: 18, padding: '14px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>✅ Commande servie ! <span style={{ color: C.ambre }}>+{msg.pts} pts</span></div>
          <Recap cmd={cmd} etapes={etapes} />
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}><Fiole V={cmd.Vt} conc={cmd.Ct} titre="Demandée" /><Fiole V={cmd.Vt} conc={msg.C} titre="Obtenue" /></div>
          <button type="button" className="cd-grand" style={{ marginTop: 12 }} onClick={() => suivant(true)}>{i + 1 >= cmds.length ? 'Voir le bilan ▶' : 'Commande suivante ▶'}</button>
        </section>)}

      {(phase === 'rate' || (expire && phase === 'jeu')) && (
        <section className="cd-pop" aria-live="polite" style={{ background: '#4b1d1d', border: `1.5px solid ${C.rouge}`, borderRadius: 18, padding: '14px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{expire && phase === 'jeu' ? '⏰ Le client est parti…' : '😕 Commande ratée'}</div>
          {sol && <>
            <p style={{ margin: '6px 0 0', fontSize: 14.5 }}>Une préparation possible :</p>
            <Recap cmd={cmd} etapes={sol} />
          </>}
          <button type="button" className="cd-grand" style={{ marginTop: 12 }} onClick={() => suivant(false)}>{i + 1 >= cmds.length ? 'Voir le bilan ▶' : 'Commande suivante ▶'}</button>
        </section>)}
    </div>);
}

// Explication : facteur de dilution et loi de dilution, étape par étape
function Recap({ cmd, etapes }) {
  const concAvant = k => etapes.slice(0, k).reduce((c, e) => c * e.p / e.f, cmd.C0);   // concentration de la solution dont on prélève à l'étape k
  const lignes = etapes.map((e, k) => (
    <li key={k}>Étape {k + 1} : {e.p} mL de {`S${'₀₁₂'[k]}`} ({fmtC(concAvant(k))} mol/L) dans une fiole de {e.f} mL → F{etapes.length > 1 ? <sub>{k + 1}</sub> : null} = {e.f} / {e.p} = {fmtF(e.f / e.p)} → <b>{fmtC(concAvant(k + 1))} mol/L</b></li>));
  const Ft = etapes.reduce((a, e) => a * e.f / e.p, 1);
  return (
    <div style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 6 }}>
      <ul style={{ margin: '0 0 4px', paddingLeft: 20 }}>{lignes}</ul>
      Facteur de dilution total : F = C₀ / C = {fmtC(cmd.C0)} / {fmtC(cmd.Ct)} = <b>{fmtF(cmd.C0 / cmd.Ct)}</b>{etapes.length > 1 ? <> = {etapes.map(e => fmtF(e.f / e.p)).join(' × ')} = {fmtF(Ft)}</> : <> = {etapes[0].f} / {etapes[0].p}</>}.
    </div>);
}
