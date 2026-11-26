import { useState, useMemo, useEffect } from "react";
import { FIOLES, PIPETTES, SERVICES, BONUS_REUSSITE, PENALITE_ECHEC, COUT_INDICE, commandesDuService, realiser, retour, correction, fmtC, fmtF, teinte, urgence, temperature, etoilesMission } from "./cuisineDilutionModele";
import { LaboScene, STYLE_LABO } from "./LaboScene";
import { chapitresDuJeu, allerChapitre } from "../chapitres";
import { enregistrerJeu } from "./jeuxScores";

// ====================================================
//  SIM 291 : URGENCE AU LABO — DILUTIONS (jeu, 2GT → 1G). Scénario : le ballon de réaction sous la paillasse s'emballe ; avant l'explosion,
//  il faut préparer à la pipette et à la fiole jaugées les solutions d'inhibiteur demandées (loi de dilution, facteur de dilution).
//  Page ordinaire aux couleurs de la Paillasse virtuelle (la calculatrice flottante du site reste disponible). Ouvert à tous (jeuxVisibles.js) ; scores envoyés au classement par jeuxScores.js ; ?sim=291 ; carte « Jouer » sur les chapitres 2GT Solutions et 1G Évolution (chapitres.js, champ « jeux »).
//  Modèle et tests : cuisineDilutionModele.js. Fiction : aucune manipulation réelle de ce type ne se fait dans l'urgence.
// ====================================================
const C = { fond: '#f4f8fc', panneau: '#ffffff', bord: '#d5dfeb', texte: '#0f172a', doux: '#475569', ambre: '#f5a31a', ambreTxt: '#b45309', vert: '#15803d', rouge: '#dc2626', bleu: '#0b4f94', verre: '#2b8fd6' };
const TITRE = "'Outfit', 'Inter', sans-serif";
const CLE = 'urgence-labo-v1';
const lire = () => { try { return JSON.parse(window.localStorage.getItem(CLE) || '{}'); } catch { return {}; } };
const ecrire = o => { try { window.localStorage.setItem(CLE, JSON.stringify(o)); } catch { /* sans stockage : records gardés pour la séance seulement */ } };
const GRAINE_JOUR = () => Math.floor(Date.now() / 86400000);   // appelé seulement dans un gestionnaire
const mmss = s => { const t = Math.max(0, Math.ceil(s)); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const ouvrirCalculatrice = () => { const b = document.querySelector('[data-calculatrice-bouton]'); if (b) b.click(); };

const STYLE = `
@keyframes ul-pop{0%{transform:scale(.95);opacity:0}100%{transform:none;opacity:1}}
.ul-pop{animation:ul-pop .3s ease-out}
.ul-mob{display:flex}@media (min-width:700px){.ul-mob{display:none}}
.ul-btn{min-height:44px;padding:0 14px;border-radius:14px;border:1.5px solid ${C.bord};background:#fff;color:#334155;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}
.ul-btn:hover{border-color:${C.bleu};color:${C.bleu}}.ul-btn:focus-visible{outline:3px solid ${C.ambre};outline-offset:2px}
.ul-btn[aria-pressed=true]{background:${C.bleu};color:#fff;border-color:${C.bleu}}
.ul-btn:disabled{opacity:.45;cursor:not-allowed}
.ul-grand{min-height:50px;padding:0 24px;border-radius:999px;border:none;background:${C.ambre};color:#1b2b3a;font:800 16px Inter,system-ui,sans-serif;cursor:pointer}
.ul-grand:disabled{opacity:.45;cursor:not-allowed}.ul-grand:focus-visible{outline:3px solid ${C.bleu};outline-offset:2px}
@media (prefers-reduced-motion:reduce){.ul-pop{animation:none}}
${STYLE_LABO}
`;
const carte = { background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 20, padding: '12px 16px' };

// Fiole jaugée (dessin) remplie d'un colorant bleu dont la teinte suit la concentration
function Fiole({ V, conc, titre, largeur = 78 }) {
  const a = conc == null ? 0 : teinte(conc), id = `ul-f-${titre.replace(/\W/g, '')}`;
  const d = 'M34 6 H50 V40 C70 50 78 66 78 82 C78 100 64 108 42 108 C20 108 6 100 6 82 C6 66 14 50 34 40 Z';
  return (
    <figure style={{ margin: 0, textAlign: 'center', width: largeur }}>
      <svg viewBox="0 0 84 112" width={largeur} role="img" aria-label={`${titre} : fiole${typeof V === 'number' ? ` de ${V} mL` : ''}${conc == null ? ', vide' : `, concentration ${fmtC(conc)} mol/L`}`}>
        <defs><clipPath id={id}><path d={d} /></clipPath></defs>
        <path d={d} fill="#f1f7fc" />
        <g clipPath={`url(#${id})`}><rect x="0" y="22" width="84" height="100" fill={C.verre} fillOpacity={a} /></g>
        <path d={d} fill="none" stroke="#7c93ab" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="31" y1="22" x2="53" y2="22" stroke="#dc2626" strokeWidth="2" />
        <text x="42" y="90" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a" style={{ paintOrder: 'stroke' }} stroke="#fff" strokeWidth="3">{typeof V === 'number' ? `${V} mL` : V}</text>
      </svg>
      <figcaption style={{ fontSize: 12.5, color: C.doux, lineHeight: 1.3 }}>{titre}{conc != null && <><br /><b style={{ color: C.texte }}>{fmtC(conc)} mol/L</b></>}</figcaption>
    </figure>);
}

export function SimulationCuisineDilution({ naviguer }) {
  const [ecran, setEcran] = useState(null);      // null = menu ; sinon { service, graine }
  const [detente, setDetente] = useState(false);
  const [rec, setRec] = useState(lire);
  const chap = chapitresDuJeu(291)[0];
  const fini = (service, etoiles, reste) => { if (reste != null) enregistrerJeu('urgence', service.id, etoiles, reste); setRec(r => { const o = { ...r, [service.id]: Math.max(r[service.id] || 0, etoiles) }; ecrire(o); return o; }); };
  return (
    <div style={{ maxWidth: 940, margin: '0 auto', color: C.texte, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'left' }}>
      <style>{STYLE}</style>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h1 style={{ margin: 0, font: `800 28px ${TITRE}`, color: C.bleu }}>🧪 Urgence au labo</h1>
        <span style={{ color: C.doux, fontSize: 14.5 }}>Dilutions sous pression</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chap && naviguer && <button type="button" className="ul-btn" onClick={() => allerChapitre(naviguer, chap.id)}>📚 Chapitre et exercices</button>}
          {ecran && <button type="button" className="ul-btn" onClick={() => setEcran(null)}>← Missions</button>}
        </span>
      </header>
      {!ecran && (
        <div>
          <LaboScene etat="calme" u={0.05} temp={35} stock="1,0" />
          <p style={{ margin: '12px 0 10px', fontSize: 15.5, lineHeight: 1.6 }}>
            Une réaction s'emballe dans le ballon, <b>sous la paillasse</b> ! Pour la calmer, il faut préparer en urgence des solutions d'<b>inhibiteur</b> de concentrations précises, par dilution de la solution mère S₀. Pour chaque demande, choisis la <b>pipette jaugée</b> (prélèvement) et la <b>fiole jaugée</b> (dilution jusqu'au trait). Chaque solution réussie refroidit le ballon et te fait gagner du temps. Tu peux utiliser la <b>calculatrice</b> (bouton 🧮 en bas de l'écran).
          </p>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '0 0 12px', fontSize: 15 }}>
            <input type="checkbox" checked={detente} onChange={ev => setDetente(ev.target.checked)} style={{ width: 20, height: 20 }} />
            Mode détente (sans compte à rebours : le ballon ne risque rien)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
            {SERVICES.map(s => (
              <section key={s.id} aria-label={`Mission ${s.id}`} style={{ ...carte, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ font: `800 18px ${TITRE}`, color: C.bleu }}>{s.icone} Mission {s.id} · {s.nom}</div>
                <div style={{ fontSize: 14, color: C.doux, lineHeight: 1.45, flex: 1 }}>{s.nb} solutions à préparer, en {s.etapesTxt}. {!detente && <>Temps : {mmss(s.temps)}.</>}</div>
                <div style={{ fontSize: 13.5, color: C.ambreTxt, fontWeight: 700 }}>{rec[s.id] ? <>Meilleur résultat : {'★'.repeat(rec[s.id])}{'☆'.repeat(3 - rec[s.id])}</> : 'Pas encore tentée'}</div>
                <button type="button" className="ul-grand" onClick={() => setEcran({ service: s, graine: GRAINE_JOUR() + Math.floor(Math.random() * 1000) })}>Lancer la mission ▶</button>
              </section>))}
          </div>
          <details style={{ ...carte, marginTop: 12, padding: '8px 16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses du modèle</summary>
            <ul style={{ margin: '6px 0 2px', paddingLeft: 20, fontSize: 14, color: C.doux, lineHeight: 1.55 }}>
              <li>Scénario fictif : en vrai, on ne prépare jamais des solutions dans la précipitation, et on ne manipule pas près d'un ballon qui chauffe.</li>
              <li>La verrerie jaugée est supposée parfaite : on ne tient pas compte de son incertitude (en vrai, elle compte !).</li>
              <li>Les volumes sont supposés additifs et le mélange parfaitement homogène après agitation.</li>
              <li>Le prélèvement à la pipette est exact et la fiole est complétée exactement au trait de jauge.</li>
              <li>La teinte bleue et la température du ballon sont des illustrations (la température suit le temps restant, pas une vraie cinétique).</li>
            </ul>
          </details>
        </div>)}
      {ecran && <Mission key={ecran.graine + '-' + ecran.service.id} service={ecran.service} graine={ecran.graine} detente={detente} onFin={fini} onMenu={() => setEcran(null)} />}
    </div>);
}

function Mission({ service, graine, detente, onFin, onMenu }) {
  const cmds = useMemo(() => commandesDuService(service, graine), [service, graine]);
  const seuil = Math.ceil(cmds.length * 0.6);
  const [i, setI] = useState(0);
  const [etapes, setEtapes] = useState([{ p: null, f: null }]);
  const [essais, setEssais] = useState(0);
  const [indices, setIndices] = useState(0);
  const [reste, setReste] = useState(service.temps);
  const [phase, setPhase] = useState('intro');        // intro | jeu | verse | ok | rate | fin
  const [msg, setMsg] = useState(null);
  const [resultats, setResultats] = useState([]);
  const [delta, setDelta] = useState(null);
  const cmd = cmds[i];
  const boom = !detente && reste <= 0 && (phase === 'jeu' || phase === 'ok' || phase === 'rate') && phase !== 'fin';
  const enCours = phase === 'jeu' && !detente && !boom;
  useEffect(() => {
    if (!enCours) return undefined;
    const id = setInterval(() => setReste(r => Math.max(0, r - 0.25)), 250);
    return () => clearInterval(id);
  }, [enCours]);
  useEffect(() => {
    if (phase !== 'verse') return undefined;
    const id = setTimeout(() => setPhase('ok'), 2200);
    return () => clearTimeout(id);
  }, [phase]);

  const u = detente ? 0.08 : urgence(reste, service.temps);
  const temp = detente ? 35 : temperature(reste, service.temps);
  const choisi = (k, cle, v) => setEtapes(es => es.map((e, j) => (j === k ? { ...e, [cle]: e[cle] === v ? null : v } : e)));
  const complet = etapes.every(e => e.p && e.f);
  const concIntermediaire = k => { const r = realiser(cmd.C0, etapes.slice(0, k)); return r.ok ? { C: r.C, V: r.V } : null; };
  const perdre = s => setReste(r => Math.max(0, r - s));

  const servir = () => {
    const rt = retour(cmd, etapes);
    if (rt.juste) {
      const apres = Math.min(service.temps, reste + BONUS_REUSSITE);
      setDelta(Math.max(0, temperature(reste, service.temps) - temperature(apres, service.temps)));
      setReste(apres); setMsg(rt); setPhase('verse');
    } else {
      const e = essais + 1;
      setEssais(e); setMsg(rt);
      if (!detente) perdre(PENALITE_ECHEC);
      if (e >= 3) setPhase('rate');
    }
  };
  const suivant = reussi => {
    const res = [...resultats, reussi];
    setResultats(res);
    if (i + 1 >= cmds.length) {
      const ok = res.filter(Boolean).length;
      if (ok >= seuil) onFin(service, detente ? 1 : etoilesMission(reste, service.temps), detente ? null : reste);
      setPhase('fin');
      return;
    }
    setI(i + 1); setEtapes([{ p: null, f: null }]); setEssais(0); setIndices(0); setPhase('jeu'); setMsg(null); setDelta(null);
  };

  const ok = resultats.filter(Boolean).length;
  const etatScene = boom ? 'boom' : phase === 'fin' ? (ok >= seuil ? 'sauve' : 'boom') : phase === 'verse' ? 'verse' : phase === 'intro' ? 'calme' : 'jeu';
  const scene = <LaboScene u={u} etat={etatScene} temp={temp} temps={detente || phase === 'intro' ? '' : mmss(reste)} stock={cmd ? fmtC(cmd.C0) : '1,0'} beaker={phase === 'verse' && msg ? { V: cmd.Vt, conc: msg.C } : null} delta={delta} />;

  if (phase === 'intro') {
    return (
      <div>
        {scene}
        <section className="ul-pop" style={{ ...carte, marginTop: 10 }}>
          <div style={{ font: `800 20px ${TITRE}`, color: C.bleu }}>{service.icone} Mission {service.id} · {service.nom}</div>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: '6px 0' }}>{service.histoire}</p>
          <p style={{ fontSize: 14.5, color: C.doux, margin: '0 0 10px', lineHeight: 1.5 }}>
            {cmds.length} solutions à préparer ({seuil} au minimum pour maîtriser la réaction). {detente ? 'Mode détente : pas de compte à rebours.' : <>Tu disposes de <b>{mmss(service.temps)}</b> ; chaque solution réussie ajoute {BONUS_REUSSITE} s, chaque erreur en retire {PENALITE_ECHEC}, chaque indice {COUT_INDICE}.</>}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="ul-grand" onClick={() => setPhase('jeu')}>{detente ? 'Commencer ▶' : 'Démarrer le compte à rebours ▶'}</button>
            <button type="button" className="ul-btn" onClick={ouvrirCalculatrice}>🧮 Calculatrice</button>
          </div>
        </section>
      </div>);
  }

  if (phase === 'fin') {
    const gagne = ok >= seuil, et = detente ? 0 : etoilesMission(reste, service.temps);
    return (
      <div>
        {scene}
        <section className="ul-pop" style={{ ...carte, marginTop: 10, borderColor: gagne ? '#16a34a' : '#dc2626' }}>
          <div style={{ font: `800 22px ${TITRE}`, color: gagne ? '#14532d' : '#991b1b' }}>
            {gagne ? '✅ Réaction maîtrisée !' : '💥 Pas assez de solutions…'} {gagne && !detente && <span style={{ color: C.ambre }}>{'★'.repeat(et)}{'☆'.repeat(3 - et)}</span>}
          </div>
          <p style={{ fontSize: 16, margin: '8px 0' }}>{ok} solution{ok > 1 ? 's' : ''} réussie{ok > 1 ? 's' : ''} sur {cmds.length}{!detente && gagne ? <> · il restait {mmss(reste)}</> : null}.</p>
          <div style={{ background: '#eef5fc', borderRadius: 14, padding: '10px 14px', fontSize: 14.5, lineHeight: 1.65 }}>
            <b>À retenir</b><br />
            • Pendant une dilution, la quantité de matière ne change pas : <b>C₀ × V<sub>prélevé</sub> = C × V<sub>fiole</sub></b>.<br />
            • Le facteur de dilution est <b>F = C₀ / C = V<sub>fiole</sub> / V<sub>prélevé</sub></b>.<br />
            • Pour une dilution en deux temps, les facteurs se multiplient : <b>F = F₁ × F₂</b>.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button type="button" className="ul-grand" onClick={onMenu}>Retour aux missions</button>
          </div>
        </section>
      </div>);
  }

  const F = cmd.C0 / cmd.Ct;
  const sol = (phase === 'rate' || boom) ? correction(cmd, service.etapesMax) : null;
  return (
    <div>
      {!detente && <div className="ul-mob" aria-hidden="true" style={{ justifyContent: 'space-between', alignItems: 'center', margin: '0 0 6px', padding: '6px 14px', borderRadius: 14, background: '#fff', border: `1px solid ${C.bord}`, font: `800 20px ${TITRE}` }}><span style={{ color: u > 0.75 ? C.rouge : u > 0.5 ? C.ambreTxt : C.vert }}>⏱ {mmss(reste)}</span><span>🌡️ {temp} °C</span></div>}
      {scene}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '10px 0 8px', fontSize: 14.5 }}>
        <b>Mission {service.id} · {service.nom}</b>
        <span style={{ color: C.doux }}>Solution {i + 1} / {cmds.length}</span>
        <button type="button" className="ul-btn" style={{ marginLeft: 'auto', minHeight: 38 }} onClick={ouvrirCalculatrice}>🧮 Calculatrice</button>
      </div>

      {/* bon de commande */}
      <section aria-label="Demande" style={{ background: '#fffaf0', border: `1.5px solid ${C.ambre}`, borderRadius: 18, padding: '12px 16px', marginBottom: 10 }}>
        <div style={{ font: '800 12.5px Inter, sans-serif', letterSpacing: '.08em', textTransform: 'uppercase', color: C.ambreTxt }}>Protocole d'urgence · solution n° {cmd.table}</div>
        <div style={{ fontSize: 18, fontWeight: 800, margin: '2px 0' }}>{cmd.Vt} mL d'inhibiteur à {fmtC(cmd.Ct)} mol/L</div>
        <div style={{ fontSize: 14.5 }}>À préparer à partir de la solution mère S₀ : <b>{fmtC(cmd.C0)} mol/L</b>{service.etapesMax > 1 ? ' (une seule étape ne suffira pas)' : ''}.</div>
      </section>

      {phase === 'jeu' && !boom && (
        <section aria-label="Plan de travail" style={carte}>
          {etapes.map((e, k) => {
            const src = k === 0 ? { C: cmd.C0, V: null } : concIntermediaire(k);
            return (
              <div key={k} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', borderTop: k ? `1px dashed ${C.bord}` : 'none', paddingTop: k ? 10 : 0, marginTop: k ? 10 : 0 }}>
                <Fiole V={`S${'₀₁₂'[k]}`} conc={src ? src.C : null} titre={k === 0 ? 'Solution mère' : `Solution intermédiaire (étape ${k})`} />
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Étape {k + 1} : je prélève… <span style={{ fontWeight: 500, color: C.doux }}>(pipette jaugée)</span></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {PIPETTES.map(p => <button key={p} type="button" className="ul-btn" aria-pressed={e.p === p} onClick={() => choisi(k, 'p', p)}>{p} mL</button>)}
                  </div>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>…et je complète jusqu'au trait dans une fiole de <span style={{ fontWeight: 500, color: C.doux }}>(fiole jaugée)</span></div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {FIOLES.map(f => <button key={f} type="button" className="ul-btn" aria-pressed={e.f === f} onClick={() => choisi(k, 'f', f)}>{f} mL</button>)}
                  </div>
                  {k > 0 && <button type="button" className="ul-btn" style={{ minHeight: 34, marginTop: 8, fontSize: 13 }} onClick={() => setEtapes(es => es.slice(0, k))}>✕ Supprimer cette étape</button>}
                </div>
              </div>);
          })}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            <button type="button" className="ul-grand" disabled={!complet} onClick={servir}>Verser dans le ballon 🧪</button>
            {etapes.length < service.etapesMax && <button type="button" className="ul-btn" onClick={() => setEtapes(es => [...es, { p: null, f: null }])}>＋ Ajouter une étape (dilution en deux temps)</button>}
            <button type="button" className="ul-btn" disabled={indices >= 2} onClick={() => { setIndices(n => n + 1); if (!detente) perdre(COUT_INDICE); }} style={{ marginLeft: 'auto' }}>💡 Indice{detente ? '' : ` (−${COUT_INDICE} s)`}</button>
          </div>
          {indices >= 1 && <div className="ul-pop" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 12, background: '#eef5fc', fontSize: 14.5, lineHeight: 1.55 }}>
            Facteur de dilution : <b>F = C₀ / C = {fmtC(cmd.C0)} / {fmtC(cmd.Ct)} = {fmtF(F)}</b>.
            {indices >= 2 && (service.etapesMax === 1
              ? <> Volume à prélever = V<sub>fiole</sub> / F = {cmd.Vt} / {fmtF(F)} = <b>{fmtF(cmd.Vt / F)} mL</b>.</>
              : <> En deux étapes, F = F₁ × F₂ : choisis deux facteurs dont le produit vaut {fmtF(F)} (ex. un facteur de {fmtF(Math.sqrt(F))} environ pour chaque étape).</>)}
          </div>}
          {msg && !msg.juste && <div role="alert" className="ul-pop" style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: '#fef2f2', border: `1.5px solid ${C.rouge}`, fontSize: 14.5, lineHeight: 1.5 }}>
            ❌ {msg.texte}{msg.C != null && <> Tu as obtenu <b>{fmtC(msg.C)} mol/L</b> au lieu de {fmtC(cmd.Ct)} mol/L.</>} <span style={{ color: C.doux }}>(essai {essais} / 3{detente ? '' : `, −${PENALITE_ECHEC} s`})</span>
          </div>}
        </section>)}

      {phase === 'verse' && <div aria-live="polite" className="ul-pop" style={{ ...carte, borderColor: '#16a34a', background: '#ecfdf3', fontWeight: 800 }}>🧪 Tu verses la solution dans le ballon…</div>}

      {phase === 'ok' && !boom && (
        <section className="ul-pop" aria-live="polite" style={{ ...carte, background: '#ecfdf3', borderColor: '#16a34a' }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#14532d' }}>✅ Solution conforme ! Le ballon refroidit{detente ? '' : <span style={{ color: C.ambreTxt }}> (+{BONUS_REUSSITE} s)</span>}</div>
          <Recap cmd={cmd} etapes={etapes} />
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}><Fiole V={cmd.Vt} conc={cmd.Ct} titre="Demandée" /><Fiole V={cmd.Vt} conc={msg.C} titre="Obtenue" /></div>
          <button type="button" className="ul-grand" style={{ marginTop: 12 }} onClick={() => suivant(true)}>{i + 1 >= cmds.length ? 'Voir le bilan ▶' : 'Solution suivante ▶'}</button>
        </section>)}

      {(phase === 'rate' || (boom && phase !== 'fin')) && (
        <section className="ul-pop" aria-live="polite" style={{ ...carte, background: '#fef2f2', borderColor: C.rouge }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#991b1b' }}>{boom ? '💥 Le ballon a explosé… trop tard !' : '😕 Solution ratée'}</div>
          {sol && <>
            <p style={{ margin: '6px 0 0', fontSize: 14.5 }}>Une préparation possible :</p>
            <Recap cmd={cmd} etapes={sol} />
          </>}
          {boom
            ? <button type="button" className="ul-grand" style={{ marginTop: 12 }} onClick={onMenu}>Retour aux missions</button>
            : <button type="button" className="ul-grand" style={{ marginTop: 12 }} onClick={() => suivant(false)}>{i + 1 >= cmds.length ? 'Voir le bilan ▶' : 'Solution suivante ▶'}</button>}
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
