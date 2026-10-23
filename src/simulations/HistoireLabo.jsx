import { useState, useEffect, useRef } from "react";
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import { useEtatPersistant } from "../commun";
import { CLE_ETAT, CLE_FINS, FINS, PNJ, SCENES, T_CLIENT, T_RAPPORT, T_FIN, etatInitial, NB_AVATARS, avatarDe, pn, texteDe, choixDe, choisir, valider, hhmm, bilan, resume, statutCmd, estFin, visuelDe, equipe, agirLibre, demanderIdees } from "./laboJournee";
import Fiches from "./Fiches";
import Dossier from "./DossierLabo";
import { StationBanc, StationCourbe, StationHuile, StationCpg, StationFormule, StationPlan, StationVisco } from "./StationsLabo";
import FicheCcf from "./FicheCcf";
import { ScenePlanche, Affiche, Equipe, Instrument, Avatar, STYLE_VISUELS } from "./LaboVisuels";

// ====================================================
//  SIM 81 : UNE JOURNÉE AU LABO (BTS Métiers de la Chimie), histoire à choix d'après le sujet de CCF4. Hors menu : ?sim=81.
//  Toute la logique est dans laboJournee.js, les dessins dans LaboVisuels.jsx ; ce composant assemble l'affichage.
// ====================================================
const C = { papier: '#fbf8f1', encre: '#1f2937', doux: '#5b6472', bord: '#d9d2c3', accent: '#0f766e', accentFond: '#e6f4f1', ambre: '#b45309', rouge: '#b91c1c', vert: '#15803d', carte: '#ffffff' };
const ENCRE = '#1e3a8a', HAND = "'Kalam','Segoe Print','Comic Sans MS',cursive", SANS = "system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
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
.lab-cahier{position:relative;font-family:${SANS};font-size:16px;background-color:#fffef9;border-radius:6px 16px 16px 6px;box-shadow:0 2px 0 #e5e0d0,0 16px 34px rgba(0,0,0,.4)}
.lab-cahier::before{content:"";position:absolute;left:clamp(30px,6vw,60px);top:0;bottom:0;width:2px;background:#f2a1a1;pointer-events:none}
.lab-spirale{position:absolute;left:-9px;top:10px;bottom:10px;width:30px;pointer-events:none;background:radial-gradient(circle at 21px 13px,#3a3d46 0 4px,transparent 5px) 0 0/30px 26px repeat-y,repeating-linear-gradient(180deg,transparent 0 9px,#8f96a3 9px 11px,#e9ecf2 11px 14px,#8f96a3 14px 16px,transparent 16px 26px);-webkit-mask:linear-gradient(90deg,transparent 0,#000 6px);mask:linear-gradient(90deg,transparent 0,#000 6px)}
.lab-photo{position:relative;background:#fff;padding:8px;box-shadow:0 3px 12px rgba(0,0,0,.28);transform:rotate(var(--rot,-.5deg))}
.lab-photo::before,.lab-photo::after{content:"";position:absolute;top:-10px;width:68px;height:20px;background:rgba(250,222,120,.78);box-shadow:0 1px 2px rgba(0,0,0,.15)}
.lab-photo::before{left:-16px;transform:rotate(-34deg)}.lab-photo::after{right:-16px;transform:rotate(34deg)}
.lab-postit{background:var(--pc,#fff3a8);box-shadow:2px 4px 8px rgba(0,0,0,.2);transform:rotate(var(--rot,0deg));border-bottom-right-radius:22px 5px}
.lab-choix{display:block;width:100%;text-align:left;padding:7px 10px 7px 36px;margin:5px 0;border:none;border-bottom:1.5px dashed #9bb0c9;background:transparent;color:${ENCRE};font:inherit;font-size:16px;line-height:1.4;position:relative;cursor:pointer;transition:background .15s,transform .12s}
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
        <span style={{ fontSize: 12.5, color: C.doux }}>Appel client 15 h · Rapport avant 17 h 30</span>
      </div>
      <div style={{ position: 'relative', height: 12, background: '#e8e2d2', borderRadius: 6, border: '1px solid #cfc6b0' }}>
        <div style={{ width: pct(t), height: '100%', background: retard ? C.rouge : ENCRE, borderRadius: 6, transition: 'width .4s' }} />
        {[T_CLIENT, T_RAPPORT].map(x => <div key={x} style={{ position: 'absolute', left: pct(x), top: -3, width: 2, height: 18, background: C.ambre }} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.doux, marginTop: 3 }}>{['8 h', '10 h', '12 h', '14 h', '16 h', '17 h 30'].map(h => <span key={h}>{h}</span>)}</div>
    </div>);
}

// Vitesse de lecture : caractères affichés par tick de 30 ms ; « fixe » = tout est affiché d'un coup, sans animation
const LECTURES = [['lente', 'Lente', 1.2], ['normale', 'Normale', 2.4], ['rapide', 'Rapide', 6], ['fixe', 'Écran fixe', 0]];
const PAUSE = 10;   // pause (en caractères) entre deux répliques

// Le texte d'une scène : chaque réplique (ligne avec « ») apparaît « comme si la personne parlait », avec son portrait ;
// la narration s'écrit au crayon. Les enfants (choix, calcul, instrument) s'activent quand tout est affiché.
function Dialogue({ texte, pnj, lecture, moi, children }) {
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
            <Avatar id={pnj === 'moi' ? moi : pnj} parle={enCours} />
            <div className="lab-postit" style={{ flex: 1, minWidth: 0, '--pc': `color-mix(in srgb, ${p.couleur} 14%, #fffbe0)`, '--rot': `${i % 2 ? 0.4 : -0.3}deg`, padding: '10px 16px', fontFamily: HAND, fontSize: 17, lineHeight: 1.55, borderLeft: `5px solid ${p.couleur}` }}>{typed}</div>
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

// Hub ouvert : l'élève écrit ce qu'il veut faire ; la liste des idées n'apparaît que s'il la demande (5 min)
function ActionLibre({ e, onAgir, onIdees }) {
  const [txt, setTxt] = useState(''), [msg, setMsg] = useState('');
  const soumettre = ev => { ev.preventDefault(); const r = agirLibre(e, txt); if (r.ok) { setTxt(''); setMsg(''); onAgir(r.etat); } else setMsg(r.message); };
  return (
    <form onSubmit={soumettre} data-action-libre style={{ margin: '14px 0 6px', background: '#fff9d6', border: '1.5px dashed #c9b86a', borderRadius: 6, padding: '12px 14px' }}>
      <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>🗣 Que fais-tu maintenant ?</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input data-libre value={txt} onChange={ev => setTxt(ev.target.value)} autoComplete="off" placeholder="Écris ce que tu fais, avec tes mots…" style={{ flex: '1 1 220px', fontSize: 16, padding: '7px 10px', border: `1.5px solid ${ENCRE}`, borderRadius: 6, background: '#fff', fontFamily: 'inherit' }} />
        <button type="submit" data-libre-ok disabled={!txt.trim()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: ENCRE, color: '#fff', fontWeight: 700, cursor: txt.trim() ? 'pointer' : 'default', opacity: txt.trim() ? 1 : 0.5, font: 'inherit' }}>Faire</button>
      </div>
      {msg && <div role="alert" data-libre-msg style={{ marginTop: 8, color: C.ambre, fontSize: 14, lineHeight: 1.5 }}>{msg}</div>}
      {!e.f.idees && <div style={{ fontSize: 13, marginTop: 8 }}><button type="button" data-idees onClick={onIdees} style={{ background: 'none', border: 'none', padding: 0, color: C.accent, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>💡 Je ne sais pas quoi lancer : faire le point (5 min)</button></div>}
    </form>);
}

function Calcul({ e, sc, onEtat, onCalculette }) {
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
      <div style={{ fontSize: 12.5, marginTop: 8 }}><button type="button" data-ouvrir-calculette onClick={onCalculette} style={{ background: 'none', border: 'none', padding: 0, color: C.accent, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>🧮 Ouvrir la calculette de formulation (CPV, CPVC, λ, extrait sec…)</button></div>
    </form>);
}

export function SimulationHistoireLabo() {
  const [etat, setEtat] = useEtatPersistant(CLE_ETAT, null);
  const [fins, setFins] = useEtatPersistant(CLE_FINS, []);
  const [joueur, setJoueur] = useEtatPersistant('labo-joueur-v1', { prenom: '', avatar: 0 });
  const [lecture, setLecture] = useEtatPersistant('labo-lecture-v1', () => (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'fixe' : 'normale'));
  const [carnetOuvert, setCarnetOuvert] = useState(false);
  const [ficheOuverte, setFicheOuverte] = useState(false);
  const [dossier, setDossier] = useState(null);   // null | 'docs' | 'calc'
  const [saut, setSaut] = useState(null);   // voile « quelques minutes plus tard » quand une action fait avancer l'horloge
  const refTitre = useRef(null);
  const e = etat && SCENES[etat.scene] ? etat : null;
  const fin = !!e && estFin(e.scene);

  const refCadre = useRef(null);
  useEffect(() => { if (e) refTitre.current?.focus({ preventScroll: true }); }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
  // Chaque réponse ramène en haut de la nouvelle scène
  useEffect(() => { if (e && typeof window !== 'undefined' && refCadre.current) { try { const y = refCadre.current.getBoundingClientRect().top + window.scrollY - 8; window.scrollTo(0, Math.max(0, y)); } catch { /* sans défilement */ } } }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
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
        Tu es technicien·ne dans un laboratoire de R&amp;D de peintures. Aujourd'hui, de 8 h à 18 h : remplacer la résine d'une base de peinture blanche, corriger un défaut de fabrication et contrôler la qualité de la nouvelle formule, avec des collègues à qui déléguer les analyses, une responsable à prévenir quand il le faut et une cliente au téléphone à 15 h.
      </p>
      <ul style={{ lineHeight: 1.7, color: '#4b5563', fontSize: 16, paddingLeft: 20 }}>
        <li>Tu joues <b style={{ color: C.encre }}>seul·e</b>, en <b style={{ color: C.encre }}>moins d'une heure</b> de temps réel.</li>
        <li>Tes choix ont des <b style={{ color: C.encre }}>conséquences</b> : <b style={{ color: C.encre }}>{FINS.length} fins</b> possibles. Tu peux rejouer pour explorer les autres.</li>
        <li>Certaines étapes se font <b style={{ color: C.encre }}>au banc</b> : courbe de défloculation, pré-essai de TMFF, prises d'huile, dosage par CPG. Les paramètres cachés sont à trouver par la mesure, et chaque erreur est expliquée.</li>
        <li>Tu poses toi-même ta <b style={{ color: C.encre }}>formule finale</b>, et tu décides par écrit des analyses à lancer : personne ne te donne la liste.</li>
        <li>Les calculs sont à faire (calculatrice autorisée) ; le Dossier (documents déjà vus) et la calculette de formulation sont accessibles à tout moment.</li>
        <li>En fin de partie, un résumé de tes choix et un bilan relient ta journée aux compétences du référentiel. Rien n'est transmis à ton enseignant.</li>
      </ul>
      <fieldset data-joueur style={{ border: '1.5px dashed #9bb0c9', borderRadius: 8, padding: '10px 14px', margin: '14px 0', maxWidth: 560 }}>
        <legend style={{ fontWeight: 800, padding: '0 6px' }}>Qui es-tu ?</legend>
        <label style={{ display: 'block', fontSize: 15 }}>Ton prénom (tes collègues t'appelleront ainsi) :{' '}
          <input data-prenom value={joueur.prenom} maxLength={20} onChange={ev => setJoueur({ ...joueur, prenom: ev.target.value })} placeholder="facultatif" style={{ padding: '6px 10px', fontSize: 16, borderRadius: 8, border: '2px solid #94a3b8', width: 170 }} /></label>
        <div role="radiogroup" aria-label="Ton avatar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {Array.from({ length: NB_AVATARS }, (_, i) => (
            <button key={i} type="button" role="radio" aria-checked={joueur.avatar === i} aria-label={`Avatar ${i + 1}`} data-avatar={i} onClick={() => setJoueur({ ...joueur, avatar: i })} style={{ padding: 3, borderRadius: '50%', border: joueur.avatar === i ? '3px solid #1e3a8a' : '3px solid transparent', background: 'none', cursor: 'pointer' }}>
              <Avatar id={'moi' + i} taille={52} />
            </button>))}
        </div>
      </fieldset>
      <button type="button" data-commencer onClick={() => setEtat(etatInitial(joueur.prenom, joueur.avatar))} style={{ padding: '10px 22px', borderRadius: 4, border: `2px solid ${ENCRE}`, background: '#fff', color: ENCRE, fontWeight: 700, fontSize: 18, boxShadow: '3px 3px 0 ' + ENCRE, cursor: 'pointer', font: 'inherit' }}>▶ Commencer la journée</button>
      {boiteFins}
      <div style={{ fontSize: 12.5, color: C.doux, marginTop: 14 }}>Scénario fictif d'après le sujet de CCF4 (Lycée Argouges, 2025). Les mesures déléguées aux collègues sont des données de scénario.</div>
    </div>);

  const sc = SCENES[e.scene], choix = choixDe(e), st = statutCmd(e).filter(x => x.etat !== 'lu'), vis = visuelDe(e);
  const hub = e.scene === 'labo';
  const appliquer = n => {
    if (n.t - e.t >= 20 && n.t < T_FIN) setSaut(s0 => ({ id: (s0?.id ?? 0) + 1, de: e.t, a: n.t })); else setSaut(null);
    setEtat(n);
  };
  const avancer = c => appliquer(choisir(e, c));
  const recommencer = () => { setEtat(null); setCarnetOuvert(false); setFicheOuverte(false); };

  const carnet = (
    <div style={{ background: 'rgba(255,255,255,.85)', border: '1.5px dashed #9bb0c9', borderRadius: 6, padding: '10px 14px' }} data-carnet>
      <button type="button" onClick={() => setCarnetOuvert(o => !o)} aria-expanded={carnetOuvert} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 800, cursor: 'pointer', padding: 0, color: C.encre }}>📒 Cahier de laboratoire ({e.carnet.length}) {carnetOuvert ? '▾' : '▸'}</button>
      {carnetOuvert && (e.carnet.length ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontFamily: HAND, fontSize: 14.5, lineHeight: 1.55, color: C.doux }}>{e.carnet.map((l, i) => <li key={i}>{l}</li>)}</ul> : <div style={{ fontSize: 13.5, color: C.doux, marginTop: 6 }}>Rien de noté pour l'instant.</div>)}
    </div>);

  return (
    <div className="lab-cahier" ref={refCadre} style={cadre} data-labo={fin ? 'fin' : 'jeu'}><style>{STYLE}</style><div className="lab-spirale" aria-hidden="true" />
      {saut && <div key={saut.id} className="lab-saut" aria-hidden="true"><div style={{ fontSize: 13, letterSpacing: 2, opacity: .7 }}>{saut.a - saut.de >= 60 ? 'PLUS TARD…' : 'QUELQUES MINUTES PLUS TARD…'}</div><div style={{ fontSize: 'clamp(34px,9vw,56px)', fontWeight: 800 }}>{hhmm(saut.a)}</div></div>}
      {pn(e) && <div data-joueur-nom style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 6px', fontWeight: 700, color: C.doux }}><Avatar id={avatarDe(e)} taille={30} /><span>{pn(e)}</span></div>}
      <BarreHeure t={Math.min(e.t, T_FIN)} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 10px' }} data-dossier-boutons>
        {[['docs', '📁 Dossier'], ['calc', '🧮 Calculette']].map(([id, nom]) => <button key={id} type="button" data-dossier-bouton={id} onClick={() => setDossier(id)} style={{ padding: '4px 12px', borderRadius: 8, border: `1.5px solid ${ENCRE}`, background: '#fff', color: ENCRE, fontWeight: 700, cursor: 'pointer', font: 'inherit', fontSize: 14 }}>{nom}</button>)}
      </div>
      {dossier && <Dossier e={e} onglet={dossier} onChange={setDossier} onFermer={() => setDossier(null)} />}
      <ChoixLecture lecture={lecture} onChange={setLecture} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div key={e.scene} className="lab-scene">
          <div className="lab-photo" style={{ '--rot': `${(e.scene.length % 3 - 1) * 0.5}deg` }}><ScenePlanche lieu={sc.lieu} pnj={hub ? 'moi' : sc.pnj} t={Math.min(e.t, T_FIN)} ton={fin ? sc.fin.ton : undefined} equipe={hub} /></div>
        </div>
        {hub && <Equipe occup={equipe(e)} />}
        <div className="lab-scene" key={`c-${e.scene}`} style={{ minWidth: 0, padding: '4px 0' }}>
          <h3 ref={refTitre} tabIndex={-1} className="lab-titre" style={{ margin: '0 0 12px', fontSize: 25, fontWeight: 700, outline: 'none', color: fin ? TONS[sc.fin.ton] : C.encre }} data-titre>{sc.titre}</h3>
          <Dialogue texte={texteDe(e)} pnj={sc.pnj} moi={avatarDe(e)} lecture={lecture}>
          {vis && <div className="lab-instr" style={{ margin: '16px auto 6px', maxWidth: 460 }}><div className="lab-photo" style={{ '--rot': '0.8deg' }}><Instrument v={vis} /></div></div>}

          {sc.fiches && <Fiches ids={sc.fiches} />}

          {sc.station === 'banc' && <StationBanc e={e} onEtat={setEtat} onValider={avancer} choixDose={g => choix.find(c => c.g === g)} />}

          {sc.station === 'cpg' && <StationCpg e={e} onEtat={setEtat} onValider={avancer} choixConcl={choix} />}

          {sc.station === 'huile' && <StationHuile e={e} onEtat={setEtat} onValider={avancer} choixFin={choix[0]} />}

          {sc.station === 'visco' && <StationVisco key={e.scene} e={e} onEtat={setEtat} onValider={avancer} choix={choix} />}

          {sc.station === 'plan' && <StationPlan key={e.scene} e={e} onValider={avancer} />}

          {sc.station === 'formule' && <StationFormule key={e.scene + e.t} e={e} onValider={avancer} />}

          {sc.station === 'courbe' && <StationCourbe e={e} onEtat={setEtat} onValider={avancer} choixDose={x => choix.find(c => c.x === x)} />}

          {sc.debrief && sc.debrief(e).length > 0 && <div data-debrief style={{ margin: '14px 0', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '10px 14px' }}>
            {sc.debrief(e).map((l, i) => <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 15, lineHeight: 1.5, borderTop: i ? `1px solid ${C.bord}` : 'none' }}><b style={{ color: l.ok === true ? C.vert : l.ok === false ? C.rouge : C.ambre }}>{l.ok === true ? '✔' : l.ok === false ? '✖' : '➜'}</b><span>{l.t}</span></div>)}
          </div>}

          {sc.calcul && <Calcul key={e.scene} e={e} sc={sc} onEtat={setEtat} onCalculette={() => setDossier('calc')} />}

          {hub && <ActionLibre e={e} onAgir={appliquer} onIdees={() => setEtat(demanderIdees(e))} />}

          {!sc.calcul && !sc.station && choix.filter(c => !c.masque || e.f.idees).map((c, i) => (
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
            <button type="button" data-ouvrir-fiche onClick={() => setFicheOuverte(o => !o)} style={{ marginTop: 14, marginRight: 10, padding: '10px 18px', borderRadius: 10, border: `2px solid ${C.encre}`, background: '#fff', color: C.encre, fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>📄 Éditer ma fiche d'auto-évaluation (modèle CCF4)</button>
            {ficheOuverte && <FicheCcf e={e} onFermer={() => setFicheOuverte(false)} />}
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 0' }} data-dossier-boutons-bas>
          {[['docs', '📁 Dossier'], ['calc', '🧮 Calculette']].map(([id, nom]) => <button key={id} type="button" data-dossier-bouton-bas={id} onClick={() => setDossier(id)} style={{ padding: '4px 12px', borderRadius: 8, border: `1.5px solid ${ENCRE}`, background: '#fff', color: ENCRE, fontWeight: 700, cursor: 'pointer', font: 'inherit', fontSize: 14 }}>{nom}</button>)}
      </div>
          {!fin && <div style={{ fontSize: 12.5, color: C.doux }}>Ta partie est enregistrée sur cet appareil. <button type="button" onClick={() => { if (window.confirm('Abandonner cette journée et recommencer ?')) recommencer(); }} style={{ background: 'none', border: 'none', color: C.doux, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontSize: 12.5 }}>Recommencer</button></div>}
        </div>
      </div>
    </div>);
}
