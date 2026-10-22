import { useState, useEffect, useRef } from "react";
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import { useEtatPersistant } from "../commun";
import { CLE_ETAT, CLE_FINS, FINS, PNJ, SCENES, T_CLIENT, T_RAPPORT, T_FIN, etatInitial, texteDe, choixDe, choisir, valider, hhmm, bilan, resume, statutCmd, estFin, visuelDe, equipe } from "./laboJournee";
import Fiches from "./Fiches";
import { StationBanc } from "./StationsLabo";
import { ScenePlanche, Affiche, Equipe, Instrument, Avatar, STYLE_VISUELS } from "./LaboVisuels";

// ====================================================
//  SIM 81 : UNE JOURNÉE AU LABO (BTS Métiers de la Chimie), histoire à choix d'après le sujet de CCF4. Hors menu : ?sim=81.
//  Toute la logique est dans laboJournee.js, les dessins dans LaboVisuels.jsx ; ce composant assemble l'affichage.
// ====================================================
const C = { papier: '#fbf8f1', encre: '#1f2937', doux: '#5b6472', bord: '#d9d2c3', accent: '#0f766e', accentFond: '#e6f4f1', ambre: '#b45309', rouge: '#b91c1c', vert: '#15803d', carte: '#ffffff' };
const ENCRE = '#1e3a8a', HAND = "'Kalam','Segoe Print','Comic Sans MS',cursive";
const NIVEAUX = { ok: ['✅', C.vert, 'Maîtrisé'], moyen: ['🟡', C.ambre, 'À consolider'], ko: ['❌', C.rouge, 'À retravailler'], nd: ['⚪', C.doux, 'Non évalué'] };
const TONS = { ok: C.vert, moyen: C.ambre, ko: C.rouge };

const STYLE = `${STYLE_VISUELS}
@keyframes lab-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.lab-scene{animation:lab-in .35s ease-out}
.lab-ligne{animation:lab-in .4s ease-out both}
.lab-bulle{animation:lab-bulle .45s cubic-bezier(.2,.9,.3,1.2) both;transform-origin:0 0}
@keyframes lab-bulle{from{opacity:0;transform:scale(.92) translateY(6px)}to{opacity:1;transform:none}}
.lab-saut{position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(15,23,32,.92);color:#fff;pointer-events:none;animation:lab-voile 1.1s ease-in-out both;font-family:ui-monospace,monospace}
@keyframes lab-voile{0%{opacity:0}22%{opacity:1}68%{opacity:1}100%{opacity:0}}
.lab-instr{animation:lab-allume .6s ease-out .15s both}
@keyframes lab-allume{from{opacity:0;filter:brightness(2.2) blur(2px);transform:scale(.97)}to{opacity:1;filter:none;transform:none}}
.lab-cahier{position:relative;font-family:${HAND};font-size:17px;background-color:#fffef9;background-image:linear-gradient(#dfe9f5 1px,transparent 1px),linear-gradient(90deg,#dfe9f5 1px,transparent 1px);background-size:22px 22px;border-radius:6px 16px 16px 6px;box-shadow:0 2px 0 #e5e0d0,0 16px 34px rgba(0,0,0,.4)}
.lab-cahier::before{content:"";position:absolute;left:clamp(30px,6vw,60px);top:0;bottom:0;width:2px;background:#f2a1a1;pointer-events:none}
.lab-spirale{position:absolute;left:-9px;top:10px;bottom:10px;width:30px;pointer-events:none;background:radial-gradient(circle at 21px 13px,#3a3d46 0 4px,transparent 5px) 0 0/30px 26px repeat-y,repeating-linear-gradient(180deg,transparent 0 9px,#8f96a3 9px 11px,#e9ecf2 11px 14px,#8f96a3 14px 16px,transparent 16px 26px);-webkit-mask:linear-gradient(90deg,transparent 0,#000 6px);mask:linear-gradient(90deg,transparent 0,#000 6px)}
.lab-photo{position:relative;background:#fff;padding:8px;box-shadow:0 3px 12px rgba(0,0,0,.28);transform:rotate(var(--rot,-.5deg))}
.lab-photo::before,.lab-photo::after{content:"";position:absolute;top:-10px;width:68px;height:20px;background:rgba(250,222,120,.78);box-shadow:0 1px 2px rgba(0,0,0,.15)}
.lab-photo::before{left:-16px;transform:rotate(-34deg)}.lab-photo::after{right:-16px;transform:rotate(34deg)}
.lab-postit{background:var(--pc,#fff3a8);box-shadow:2px 4px 8px rgba(0,0,0,.2);transform:rotate(var(--rot,0deg));border-bottom-right-radius:22px 5px}
.lab-choix{display:block;width:100%;text-align:left;padding:7px 10px 7px 36px;margin:5px 0;border:none;border-bottom:1.5px dashed #9bb0c9;background:transparent;color:${ENCRE};font:inherit;font-size:17px;line-height:1.4;position:relative;cursor:pointer;transition:background .15s,transform .12s}
.lab-choix::before{content:"";position:absolute;left:7px;top:11px;width:15px;height:15px;border:2px solid ${ENCRE};border-radius:3px;background:#fff;color:#b91c1c;font-size:17px;line-height:11px;text-align:center;font-weight:700}
.lab-choix:hover,.lab-choix:focus-visible{background:linear-gradient(transparent 45%,#fde68a 45%);outline:none;transform:translateX(3px)}
.lab-choix:hover::before,.lab-choix:focus-visible::before{content:"✗"}
.lab-titre{text-decoration:underline double;text-decoration-thickness:2px;text-underline-offset:7px}
@media (prefers-reduced-motion:reduce){.lab-scene,.lab-ligne,.lab-bulle,.lab-instr{animation:none!important}.lab-photo,.lab-postit{transform:none}.lab-saut{animation-duration:.01s!important;display:none}.lab-choix:hover{transform:none}}
`;

function BarreHeure({ t }) {
  const pct = x => `${Math.min(100, x / T_FIN * 100)}%`, retard = t >= T_RAPPORT;
  return (
    <div style={{ marginBottom: 12 }} aria-label={`Il est ${hhmm(t)}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-block', transform: 'rotate(-2deg)', border: `2.5px solid ${retard ? C.rouge : ENCRE}`, borderRadius: 6, padding: '0 10px', fontWeight: 700, fontSize: 22, whiteSpace: 'nowrap', color: retard ? C.rouge : ENCRE, letterSpacing: 1 }} data-heure>🕗 {hhmm(t)}</span>
        <span style={{ fontSize: 12.5, color: C.doux }}>Appel client 15 h · Rapport avant 16 h 30</span>
      </div>
      <div style={{ position: 'relative', height: 12, background: '#e8e2d2', borderRadius: 6, border: '1px solid #cfc6b0' }}>
        <div style={{ width: pct(t), height: '100%', background: retard ? C.rouge : ENCRE, borderRadius: 6, transition: 'width .4s' }} />
        {[T_CLIENT, T_RAPPORT].map(x => <div key={x} style={{ position: 'absolute', left: pct(x), top: -3, width: 2, height: 18, background: C.ambre }} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.doux, marginTop: 3 }}>{['8 h', '10 h', '12 h', '14 h', '16 h', '17 h'].map(h => <span key={h}>{h}</span>)}</div>
    </div>);
}

// Vitesse de lecture : caractères affichés par tick de 30 ms ; « fixe » = tout est affiché d'un coup, sans animation
const LECTURES = [['lente', 'Lente', 1.2], ['normale', 'Normale', 2.4], ['rapide', 'Rapide', 6], ['fixe', 'Écran fixe', 0]];
const PAUSE = 10;   // pause (en caractères) entre deux répliques

// Le texte d'une scène : chaque réplique (ligne avec « ») apparaît « comme si la personne parlait », avec son portrait ;
// la narration s'écrit au crayon. Les enfants (choix, calcul, instrument) s'activent quand tout est affiché.
function Dialogue({ texte, pnj, lecture, children }) {
  const lignes = String(texte).split('\n').filter(l => l.trim());
  const p = PNJ[pnj];
  const pas = (LECTURES.find(l => l[0] === lecture) || LECTURES[1])[2], instant = pas === 0;
  const debuts = []; let total = 0;
  lignes.forEach(l => { debuts.push(total); total += l.length + PAUSE; });
  const [avance, setAvance] = useState(0), [prec, setPrec] = useState(texte);
  if (prec !== texte) { setPrec(texte); setAvance(0); }        // nouveau texte : on repart du début
  const fini = instant || avance >= total;
  useEffect(() => {
    if (fini) return undefined;
    const id = setInterval(() => setAvance(a => Math.min(total, a + pas)), 30);
    return () => clearInterval(id);
  }, [fini, pas, total]);
  return (<>
    <span data-texte style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{texte}</span>
    <div aria-hidden="true" onClick={() => setAvance(total)} title={fini ? undefined : 'Cliquer pour tout afficher'} style={{ display: 'flex', flexDirection: 'column', gap: 11, cursor: fini ? 'default' : 'pointer' }}>
      {lignes.map((l, i) => {
        const n = instant ? l.length : Math.max(0, Math.min(l.length, Math.floor(avance - debuts[i])));
        const commence = instant || avance >= debuts[i], enCours = commence && n < l.length;
        const typed = <>{l.slice(0, n)}<span style={{ visibility: 'hidden' }}>{l.slice(n)}</span></>;
        if (!l.includes('«')) return <div key={i} style={{ fontSize: 16.5, lineHeight: 1.6, color: '#4b5563', opacity: commence ? 1 : 0 }}>{typed}</div>;
        return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: commence ? 1 : 0, transition: 'opacity .2s' }}>
            <Avatar id={pnj} parle={enCours} />
            <div className="lab-postit" style={{ flex: 1, minWidth: 0, '--pc': `color-mix(in srgb, ${p.couleur} 14%, #fffbe0)`, '--rot': `${i % 2 ? 0.4 : -0.3}deg`, padding: '10px 16px', fontSize: 17, lineHeight: 1.55, borderLeft: `5px solid ${p.couleur}` }}>{typed}</div>
          </div>);
      })}
    </div>
    {!fini && <button type="button" onClick={() => setAvance(total)} style={{ display: 'block', marginLeft: 'auto', marginTop: 6, background: 'none', border: 'none', color: ENCRE, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontSize: 14 }}>Tout afficher ⏭</button>}
    <div inert={!fini} style={{ opacity: fini ? 1 : 0, transition: 'opacity .3s' }}>{children}</div>
  </>);
}

function ChoixLecture({ lecture, onChange }) {
  return (
    <div role="group" aria-label="Vitesse de lecture" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13.5, margin: '0 0 12px', color: C.doux }}>
      <span>📖 Lecture :</span>
      {LECTURES.map(([id, nom]) => (
        <button key={id} type="button" data-lecture={id} aria-pressed={lecture === id} onClick={() => onChange(id)}
          style={{ padding: '2px 10px', borderRadius: 99, border: `1.5px solid ${lecture === id ? ENCRE : '#b8c4d6'}`, background: lecture === id ? ENCRE : '#fff', color: lecture === id ? '#fff' : ENCRE, cursor: 'pointer', font: 'inherit', fontSize: 13.5 }}>{nom}</button>))}
    </div>);
}

function Calcul({ e, sc, onEtat }) {
  const [saisie, setSaisie] = useState('');
  const [message, setMessage] = useState('');
  const soumettre = ev => { ev.preventDefault(); const r = valider(e, saisie); onEtat(r.etat); if (!r.juste) setMessage(r.message || ''); };
  return (
    <form onSubmit={soumettre} style={{ marginTop: 14, background: '#fff9d6', border: '1.5px dashed #c9b86a', borderRadius: 6, padding: '12px 14px' }} data-calcul>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>🧮 {sc.calcul.q}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={saisie} onChange={ev => setSaisie(ev.target.value)} inputMode="decimal" autoComplete="off" aria-label="Ta réponse" placeholder="?"
          style={{ width: 130, fontSize: 18, padding: '6px 10px', border: 'none', borderBottom: `2px solid ${ENCRE}`, background: 'transparent', color: ENCRE, borderRadius: 0, fontFamily: 'inherit' }} />
        <span style={{ color: C.doux }}>{sc.calcul.unite}</span>
        <button type="submit" disabled={!saisie.trim()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: ENCRE, color: '#fff', fontWeight: 700, cursor: saisie.trim() ? 'pointer' : 'default', opacity: saisie.trim() ? 1 : 0.5, font: 'inherit' }}>Valider</button>
      </div>
      {message && <div role="alert" style={{ marginTop: 8, color: C.ambre, fontSize: 14, lineHeight: 1.5 }}>❌ Pas tout à fait. {message}<br /><span style={{ color: C.doux }}>(Chaque erreur te coûte 5 minutes.)</span></div>}
      <div style={{ fontSize: 12.5, marginTop: 8 }}><a href="?sim=14" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>Ouvrir la simulation « Peinture à l'eau » (outil de calcul) ↗</a></div>
    </form>);
}

export function SimulationHistoireLabo() {
  const [etat, setEtat] = useEtatPersistant(CLE_ETAT, null);
  const [fins, setFins] = useEtatPersistant(CLE_FINS, []);
  const [lecture, setLecture] = useEtatPersistant('labo-lecture-v1', () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'fixe' : 'normale'));
  const [carnetOuvert, setCarnetOuvert] = useState(false);
  const [saut, setSaut] = useState(null);   // voile « quelques minutes plus tard » quand une action fait avancer l'horloge
  const refTitre = useRef(null);
  const e = etat && SCENES[etat.scene] ? etat : null;
  const fin = !!e && estFin(e.scene);

  useEffect(() => { if (e) refTitre.current?.focus({ preventScroll: true }); }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (fin && !fins.includes(e.scene)) setFins([...fins, e.scene]); }, [fin, e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps

  const cadre = { color: C.encre, padding: 'clamp(14px, 3vw, 24px) clamp(14px, 3vw, 24px) clamp(14px, 3vw, 24px) clamp(40px, 8vw, 84px)', maxWidth: 1000, margin: '0 auto' };
  const boiteFins = (
    <div style={{ fontSize: 13.5, color: C.doux, marginTop: 12 }} data-fins>
      <b style={{ color: C.encre }}>Fins découvertes : {fins.length} / {FINS.length}</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {FINS.map(([id, nom]) => <span key={id} style={{ padding: '2px 9px', borderRadius: 99, border: `1px solid ${fins.includes(id) ? C.accent : C.bord}`, background: fins.includes(id) ? C.accentFond : 'transparent', color: fins.includes(id) ? C.accent : C.doux }}>{fins.includes(id) ? nom : '???'}</span>)}
      </div>
    </div>);

  if (!e) return (
    <div className="lab-cahier" style={cadre} data-labo="intro"><style>{STYLE}</style><div className="lab-spirale" aria-hidden="true" />
      <div className="lab-photo" style={{ '--rot': '-0.7deg', marginTop: 6 }}><Affiche /></div>
      <div style={{ fontSize: 12.5, letterSpacing: 2, color: C.accent, fontFamily: 'ui-monospace,monospace', marginTop: 14 }}>BTS MÉTIERS DE LA CHIMIE · HISTOIRE À CHOIX</div>
      <h2 className="lab-titre" style={{ margin: '8px 0 14px', fontSize: 'clamp(26px,5.5vw,36px)', color: '#b91c1c' }}>🧪 Une journée au laboratoire</h2>
      <p style={{ lineHeight: 1.65, fontSize: 17, maxWidth: 740 }}>
        Tu es technicien·ne dans un laboratoire de R&amp;D de peintures. Aujourd'hui, de 8 h à 17 h : remplacer la résine d'une base de peinture blanche, corriger un défaut de fabrication et contrôler la qualité de la nouvelle formule, avec des collègues à qui déléguer les analyses, une responsable à prévenir quand il le faut et une cliente au téléphone à 15 h.
      </p>
      <ul style={{ lineHeight: 1.7, color: '#4b5563', fontSize: 16, paddingLeft: 20 }}>
        <li>Tu joues <b style={{ color: C.encre }}>seul·e</b>, en <b style={{ color: C.encre }}>moins d'une heure</b> de temps réel.</li>
        <li>Tes choix ont des <b style={{ color: C.encre }}>conséquences</b> : <b style={{ color: C.encre }}>{FINS.length} fins</b> possibles. Tu peux rejouer pour explorer les autres.</li>
        <li>Les calculs sont à faire (calculatrice autorisée) ; la simulation « Peinture à l'eau » peut t'aider.</li>
        <li>En fin de partie, un bilan relie ta journée aux compétences du référentiel.</li>
      </ul>
      <button type="button" data-commencer onClick={() => setEtat(etatInitial())} style={{ padding: '10px 22px', borderRadius: 4, border: `2px solid ${ENCRE}`, background: '#fff', color: ENCRE, fontWeight: 700, fontSize: 18, boxShadow: '3px 3px 0 ' + ENCRE, cursor: 'pointer', font: 'inherit' }}>▶ Commencer la journée</button>
      {boiteFins}
      <div style={{ fontSize: 12.5, color: C.doux, marginTop: 14 }}>Scénario fictif d'après le sujet de CCF4 (Lycée Argouges, 2025). Les mesures déléguées aux collègues sont des données de scénario.</div>
    </div>);

  const sc = SCENES[e.scene], choix = choixDe(e), st = statutCmd(e).filter(x => x.etat !== 'lu'), vis = visuelDe(e);
  const hub = e.scene === 'labo';
  const avancer = c => {
    const n = choisir(e, c);
    if (n.t - e.t >= 20 && n.t < T_FIN) setSaut(s0 => ({ id: (s0?.id ?? 0) + 1, de: e.t, a: n.t })); else setSaut(null);
    setEtat(n);
  };
  const recommencer = () => { setEtat(null); setCarnetOuvert(false); };

  const carnet = (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1.5px dashed #9bb0c9', borderRadius: 6, padding: '10px 14px' }} data-carnet>
      <button type="button" onClick={() => setCarnetOuvert(o => !o)} aria-expanded={carnetOuvert} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 800, cursor: 'pointer', padding: 0, color: C.encre }}>📒 Cahier de laboratoire ({e.carnet.length}) {carnetOuvert ? '▾' : '▸'}</button>
      {carnetOuvert && (e.carnet.length ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55, color: C.doux }}>{e.carnet.map((l, i) => <li key={i}>{l}</li>)}</ul> : <div style={{ fontSize: 13.5, color: C.doux, marginTop: 6 }}>Rien de noté pour l'instant.</div>)}
    </div>);

  return (
    <div className="lab-cahier" style={cadre} data-labo={fin ? 'fin' : 'jeu'}><style>{STYLE}</style><div className="lab-spirale" aria-hidden="true" />
      {saut && <div key={saut.id} className="lab-saut" aria-hidden="true"><div style={{ fontSize: 13, letterSpacing: 2, opacity: .7 }}>{saut.a - saut.de >= 60 ? 'PLUS TARD…' : 'QUELQUES MINUTES PLUS TARD…'}</div><div style={{ fontSize: 'clamp(34px,9vw,56px)', fontWeight: 800 }}>{hhmm(saut.a)}</div></div>}
      <BarreHeure t={Math.min(e.t, T_FIN)} />
      <ChoixLecture lecture={lecture} onChange={setLecture} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div key={e.scene} className="lab-scene">
          <div className="lab-photo" style={{ '--rot': `${(e.scene.length % 3 - 1) * 0.5}deg` }}><ScenePlanche lieu={sc.lieu} pnj={hub ? 'moi' : sc.pnj} t={Math.min(e.t, T_FIN)} ton={fin ? sc.fin.ton : undefined} equipe={hub} /></div>
        </div>
        {hub && <Equipe occup={equipe(e)} />}
        <div className="lab-scene" key={`c-${e.scene}`} style={{ minWidth: 0, padding: '4px 0' }}>
          <h3 ref={refTitre} tabIndex={-1} className="lab-titre" style={{ margin: '0 0 12px', fontSize: 25, fontWeight: 700, outline: 'none', color: fin ? TONS[sc.fin.ton] : C.encre }} data-titre>{sc.titre}</h3>
          <Dialogue texte={texteDe(e)} pnj={sc.pnj} lecture={lecture}>
          {vis && <div className="lab-instr" style={{ margin: '16px auto 6px', maxWidth: 460 }}><div className="lab-photo" style={{ '--rot': '0.8deg' }}><Instrument v={vis} /></div></div>}

          {sc.fiches && <Fiches ids={sc.fiches} />}

          {sc.station === 'banc' && <StationBanc e={e} onEtat={setEtat} onValider={avancer} choixDose={g => choix.find(c => c.g === g)} />}

          {sc.debrief && <div data-debrief style={{ margin: '14px 0', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '10px 14px' }}>
            {sc.debrief(e).map((l, i) => <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 15, lineHeight: 1.5, borderTop: i ? `1px solid ${C.bord}` : 'none' }}><b style={{ color: l.ok === true ? C.vert : l.ok === false ? C.rouge : C.ambre }}>{l.ok === true ? '✔' : l.ok === false ? '✖' : '➜'}</b><span>{l.t}</span></div>)}
          </div>}

          {sc.calcul && <Calcul key={e.scene} e={e} sc={sc} onEtat={setEtat} />}

          {!sc.calcul && !sc.station && choix.map((c, i) => (
            <button key={i} type="button" className="lab-choix lab-ligne" style={{ animationDelay: `${i * 0.1}s` }} data-choix={i} onClick={() => avancer(c)}>
              {c.t}{c.d && <div style={{ fontSize: 12.5, color: C.doux, marginTop: 2 }}>{c.d}</div>}
            </button>))}

          {fin && (<>
            <h4 style={{ margin: '18px 0 6px' }}>Résumé de tes choix</h4>
            <ul data-resume style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.55 }}>{resume(e).map((t, i) => <li key={i}>{t}</li>)}</ul>
            <h4 style={{ margin: '18px 0 6px' }}>Bilan de ta journée par compétence</h4>
            <div data-bilan>{bilan(e).map(b => { const [ic, col, lib] = NIVEAUX[b.niveau]; return (
              <div key={b.comp} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: `1px solid ${C.bord}`, fontSize: 14, lineHeight: 1.5 }}>
                <span aria-label={lib} title={lib} style={{ fontSize: 18 }}>{ic}</span>
                <div><b>{b.comp}</b> · {b.titre} <span style={{ color: col, fontWeight: 700 }}>({lib})</span><div style={{ color: C.doux }}>{b.texte}</div></div>
              </div>); })}</div>
            <button type="button" data-rejouer onClick={recommencer} style={{ marginTop: 14, padding: '10px 18px', borderRadius: 10, border: `2px solid ${C.accent}`, background: C.accentFond, color: C.accent, fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>↺ Rejouer une journée (autre stratégie ?)</button>
            {boiteFins}
          </>)}
          </Dialogue>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
          {!fin && st.length > 0 && (
            <div className="lab-postit" style={{ '--pc': '#fff3a8', '--rot': '1deg', padding: '10px 16px' }} data-attentes>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>En cours</div>
              {st.map(x => <div key={x.cle} style={{ fontSize: 13.5, color: x.etat === 'pret' ? C.vert : C.doux, lineHeight: 1.6 }}>{x.etat === 'pret' ? '📄 Résultat prêt : ' : '⏳ '}{x.label}{x.etat === 'cours' ? ` (vers ${hhmm(x.pret)})` : ''}</div>)}
            </div>)}
          {carnet}
          {!fin && <div style={{ fontSize: 12.5, color: C.doux }}>Ta partie est enregistrée sur cet appareil. <button type="button" onClick={() => { if (window.confirm('Abandonner cette journée et recommencer ?')) recommencer(); }} style={{ background: 'none', border: 'none', color: C.doux, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontSize: 12.5 }}>Recommencer</button></div>}
        </div>
      </div>
    </div>);
}
