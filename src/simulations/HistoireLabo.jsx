import { useState, useEffect, useRef } from "react";
import { useEtatPersistant } from "../commun";
import { CLE_ETAT, CLE_FINS, FINS, PNJ, SCENES, T_CLIENT, T_RAPPORT, T_FIN, etatInitial, texteDe, choixDe, choisir, valider, hhmm, bilan, statutCmd, estFin, visuelDe, equipe } from "./laboJournee";
import { ScenePlanche, Affiche, Equipe, Instrument, STYLE_VISUELS } from "./LaboVisuels";

// ====================================================
//  SIM 81 : UNE JOURNÉE AU LABO (BTS Métiers de la Chimie), histoire à choix d'après le sujet de CCF4. Hors menu : ?sim=81.
//  Toute la logique est dans laboJournee.js, les dessins dans LaboVisuels.jsx ; ce composant assemble l'affichage.
// ====================================================
const C = { papier: '#fbf8f1', encre: '#1f2937', doux: '#5b6472', bord: '#d9d2c3', accent: '#0f766e', accentFond: '#e6f4f1', ambre: '#b45309', rouge: '#b91c1c', vert: '#15803d', carte: '#ffffff' };
const NIVEAUX = { ok: ['✅', C.vert, 'Maîtrisé'], moyen: ['🟡', C.ambre, 'À consolider'], ko: ['❌', C.rouge, 'À retravailler'], nd: ['⚪', C.doux, 'Non évalué'] };
const TONS = { ok: C.vert, moyen: C.ambre, ko: C.rouge };

const STYLE = `${STYLE_VISUELS}
@keyframes lab-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.lab-scene{animation:lab-in .3s ease-out}
.lab-choix{display:block;width:100%;text-align:left;padding:11px 14px;margin:8px 0;border:1.5px solid ${C.bord};border-radius:10px;background:${C.carte};color:${C.encre};font:inherit;font-size:15px;line-height:1.45;cursor:pointer;transition:transform .12s,border-color .12s,background .12s}
.lab-choix:hover,.lab-choix:focus-visible{border-color:${C.accent};background:${C.accentFond};outline:none;transform:translateX(3px)}
@media (prefers-reduced-motion:reduce){.lab-scene{animation:none}.lab-choix:hover{transform:none}}
`;

function BarreHeure({ t }) {
  const pct = x => `${Math.min(100, x / T_FIN * 100)}%`, retard = t >= T_RAPPORT;
  return (
    <div style={{ marginBottom: 12 }} aria-label={`Il est ${hhmm(t)}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 800, fontSize: 22, whiteSpace: 'nowrap', color: retard ? C.rouge : C.accent }} data-heure>🕗 {hhmm(t)}</span>
        <span style={{ fontSize: 12.5, color: C.doux }}>Appel client 15 h · Rapport avant 16 h 30</span>
      </div>
      <div style={{ position: 'relative', height: 12, background: '#ece7da', borderRadius: 6 }}>
        <div style={{ width: pct(t), height: '100%', background: retard ? C.rouge : C.accent, borderRadius: 6, transition: 'width .4s' }} />
        {[T_CLIENT, T_RAPPORT].map(x => <div key={x} style={{ position: 'absolute', left: pct(x), top: -3, width: 2, height: 18, background: C.ambre }} />)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.doux, marginTop: 3 }}>{['8 h', '10 h', '12 h', '14 h', '16 h', '17 h'].map(h => <span key={h}>{h}</span>)}</div>
    </div>);
}

// Le texte d'une scène : les répliques (lignes avec « ») deviennent des bulles de dialogue, le reste est de la narration
function Dialogue({ texte, pnj }) {
  const lignes = String(texte).split('\n').filter(l => l.trim());
  const p = PNJ[pnj];
  return (
    <div aria-live="polite" data-texte style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lignes.map((l, i) => l.includes('«')
        ? <div key={i} style={{ position: 'relative', background: p.couleur + '14', border: `1.5px solid ${p.couleur}55`, borderRadius: '4px 16px 16px 16px', padding: '9px 14px', fontSize: 15.5, lineHeight: 1.6 }}>{l}</div>
        : <div key={i} style={{ fontSize: 15, lineHeight: 1.6, color: C.doux, fontStyle: 'italic' }}>{l}</div>)}
    </div>);
}

function Calcul({ e, sc, onEtat }) {
  const [saisie, setSaisie] = useState('');
  const [message, setMessage] = useState('');
  const soumettre = ev => { ev.preventDefault(); const r = valider(e, saisie); onEtat(r.etat); if (!r.juste) setMessage(r.message || ''); };
  return (
    <form onSubmit={soumettre} style={{ marginTop: 12, background: '#f5f1e6', border: `1.5px dashed ${C.bord}`, borderRadius: 12, padding: '12px 14px' }} data-calcul>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>🧮 {sc.calcul.q}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={saisie} onChange={ev => setSaisie(ev.target.value)} inputMode="decimal" autoComplete="off" aria-label="Ta réponse" placeholder="?"
          style={{ width: 130, fontSize: 18, padding: '6px 10px', border: `2px solid ${C.bord}`, borderRadius: 8, fontFamily: 'ui-monospace,monospace' }} />
        <span style={{ color: C.doux }}>{sc.calcul.unite}</span>
        <button type="submit" disabled={!saisie.trim()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontWeight: 800, cursor: saisie.trim() ? 'pointer' : 'default', opacity: saisie.trim() ? 1 : 0.5, font: 'inherit' }}>Valider</button>
      </div>
      {message && <div role="alert" style={{ marginTop: 8, color: C.ambre, fontSize: 14, lineHeight: 1.5 }}>❌ Pas tout à fait. {message}<br /><span style={{ color: C.doux }}>(Chaque erreur te coûte 5 minutes.)</span></div>}
      <div style={{ fontSize: 12.5, marginTop: 8 }}><a href="?sim=14" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>Ouvrir la simulation « Peinture à l'eau » (outil de calcul) ↗</a></div>
    </form>);
}

export function SimulationHistoireLabo() {
  const [etat, setEtat] = useEtatPersistant(CLE_ETAT, null);
  const [fins, setFins] = useEtatPersistant(CLE_FINS, []);
  const [carnetOuvert, setCarnetOuvert] = useState(false);
  const refTitre = useRef(null);
  const e = etat && SCENES[etat.scene] ? etat : null;
  const fin = !!e && estFin(e.scene);

  useEffect(() => { if (e) refTitre.current?.focus({ preventScroll: true }); }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (fin && !fins.includes(e.scene)) setFins([...fins, e.scene]); }, [fin, e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps

  const cadre = { background: C.papier, color: C.encre, borderRadius: 16, padding: 'clamp(12px, 3vw, 22px)', maxWidth: 1000, margin: '0 auto', border: `1px solid ${C.bord}` };
  const boiteFins = (
    <div style={{ fontSize: 13.5, color: C.doux, marginTop: 12 }} data-fins>
      <b style={{ color: C.encre }}>Fins découvertes : {fins.length} / {FINS.length}</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
        {FINS.map(([id, nom]) => <span key={id} style={{ padding: '2px 9px', borderRadius: 99, border: `1px solid ${fins.includes(id) ? C.accent : C.bord}`, background: fins.includes(id) ? C.accentFond : 'transparent', color: fins.includes(id) ? C.accent : C.doux }}>{fins.includes(id) ? nom : '???'}</span>)}
      </div>
    </div>);

  if (!e) return (
    <div style={cadre} data-labo="intro"><style>{STYLE}</style>
      <Affiche />
      <div style={{ fontSize: 12.5, letterSpacing: 2, color: C.accent, fontFamily: 'ui-monospace,monospace', marginTop: 14 }}>BTS MÉTIERS DE LA CHIMIE · HISTOIRE À CHOIX</div>
      <h2 style={{ margin: '6px 0 10px', fontSize: 'clamp(24px,5vw,32px)', color: C.encre }}>🧪 Une journée au laboratoire</h2>
      <p style={{ lineHeight: 1.65, fontSize: 15.5, maxWidth: 740 }}>
        Tu es technicien·ne dans un laboratoire de R&amp;D de peintures. Aujourd'hui, de 8 h à 17 h : remplacer la résine d'une base de peinture blanche, corriger un défaut de fabrication et contrôler la qualité de la nouvelle formule, avec des collègues à qui déléguer les analyses, une responsable à prévenir quand il le faut et une cliente au téléphone à 15 h.
      </p>
      <ul style={{ lineHeight: 1.7, color: C.doux, fontSize: 14.5, paddingLeft: 20 }}>
        <li>Tu joues <b style={{ color: C.encre }}>seul·e</b>, en <b style={{ color: C.encre }}>moins d'une heure</b> de temps réel.</li>
        <li>Tes choix ont des <b style={{ color: C.encre }}>conséquences</b> : <b style={{ color: C.encre }}>{FINS.length} fins</b> possibles. Tu peux rejouer pour explorer les autres.</li>
        <li>Les calculs sont à faire (calculatrice autorisée) ; la simulation « Peinture à l'eau » peut t'aider.</li>
        <li>En fin de partie, un bilan relie ta journée aux compétences du référentiel.</li>
      </ul>
      <button type="button" data-commencer onClick={() => setEtat(etatInitial())} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: C.accent, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', font: 'inherit' }}>▶ Commencer la journée</button>
      {boiteFins}
      <div style={{ fontSize: 12.5, color: C.doux, marginTop: 14 }}>Scénario fictif d'après le sujet de CCF4 (Lycée Argouges, 2025). Les mesures déléguées aux collègues sont des données de scénario.</div>
    </div>);

  const sc = SCENES[e.scene], choix = choixDe(e), st = statutCmd(e).filter(x => x.etat !== 'lu'), vis = visuelDe(e);
  const hub = e.scene === 'labo';
  const avancer = c => setEtat(choisir(e, c));
  const recommencer = () => { setEtat(null); setCarnetOuvert(false); };

  const carnet = (
    <div style={{ background: C.carte, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '10px 14px' }} data-carnet>
      <button type="button" onClick={() => setCarnetOuvert(o => !o)} aria-expanded={carnetOuvert} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 800, cursor: 'pointer', padding: 0, color: C.encre }}>📒 Cahier de laboratoire ({e.carnet.length}) {carnetOuvert ? '▾' : '▸'}</button>
      {carnetOuvert && (e.carnet.length ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55, color: C.doux }}>{e.carnet.map((l, i) => <li key={i}>{l}</li>)}</ul> : <div style={{ fontSize: 13.5, color: C.doux, marginTop: 6 }}>Rien de noté pour l'instant.</div>)}
    </div>);

  return (
    <div style={cadre} data-labo={fin ? 'fin' : 'jeu'}><style>{STYLE}</style>
      <BarreHeure t={Math.min(e.t, T_FIN)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div key={e.scene} className="lab-scene">
          <ScenePlanche lieu={sc.lieu} pnj={hub ? 'moi' : sc.pnj} t={Math.min(e.t, T_FIN)} ton={fin ? sc.fin.ton : undefined} equipe={hub} />
        </div>
        {hub && <Equipe occup={equipe(e)} />}
        <div className="lab-scene" key={`c-${e.scene}`} style={{ minWidth: 0, background: C.carte, border: `1.5px solid ${fin ? TONS[sc.fin.ton] : C.bord}`, borderRadius: 14, padding: '14px 16px' }}>
          <h3 ref={refTitre} tabIndex={-1} style={{ margin: '0 0 10px', fontSize: 21, outline: 'none', color: fin ? TONS[sc.fin.ton] : C.encre }} data-titre>{sc.titre}</h3>
          <Dialogue texte={texteDe(e)} pnj={sc.pnj} />
          {vis && <Instrument v={vis} />}

          {sc.calcul && <Calcul key={e.scene} e={e} sc={sc} onEtat={setEtat} />}

          {!sc.calcul && choix.map((c, i) => (
            <button key={i} type="button" className="lab-choix" data-choix={i} onClick={() => avancer(c)}>
              {c.t}{c.d && <div style={{ fontSize: 12.5, color: C.doux, marginTop: 2 }}>{c.d}</div>}
            </button>))}

          {fin && (<>
            <h4 style={{ margin: '18px 0 6px' }}>Bilan de ta journée par compétence</h4>
            <div data-bilan>{bilan(e).map(b => { const [ic, col, lib] = NIVEAUX[b.niveau]; return (
              <div key={b.comp} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: `1px solid ${C.bord}`, fontSize: 14, lineHeight: 1.5 }}>
                <span aria-label={lib} title={lib} style={{ fontSize: 18 }}>{ic}</span>
                <div><b>{b.comp}</b> · {b.titre} <span style={{ color: col, fontWeight: 700 }}>({lib})</span><div style={{ color: C.doux }}>{b.texte}</div></div>
              </div>); })}</div>
            <button type="button" data-rejouer onClick={recommencer} style={{ marginTop: 14, padding: '10px 18px', borderRadius: 10, border: `2px solid ${C.accent}`, background: C.accentFond, color: C.accent, fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>↺ Rejouer une journée (autre stratégie ?)</button>
            {boiteFins}
          </>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
          {!fin && st.length > 0 && (
            <div style={{ background: C.carte, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '10px 14px' }} data-attentes>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>En cours</div>
              {st.map(x => <div key={x.cle} style={{ fontSize: 13.5, color: x.etat === 'pret' ? C.vert : C.doux, lineHeight: 1.6 }}>{x.etat === 'pret' ? '📄 Résultat prêt : ' : '⏳ '}{x.label}{x.etat === 'cours' ? ` (vers ${hhmm(x.pret)})` : ''}</div>)}
            </div>)}
          {carnet}
          {!fin && <div style={{ fontSize: 12.5, color: C.doux }}>Ta partie est enregistrée sur cet appareil. <button type="button" onClick={() => { if (window.confirm('Abandonner cette journée et recommencer ?')) recommencer(); }} style={{ background: 'none', border: 'none', color: C.doux, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontSize: 12.5 }}>Recommencer</button></div>}
        </div>
      </div>
    </div>);
}
