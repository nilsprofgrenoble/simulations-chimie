import { useState, useEffect, useMemo } from "react";
import { analyser, objectifs, TITRES } from "../carnet";
import { aRevoir, raisonRevision, dansJours } from "../revision";
import { tousLesExercices } from "./Entrainement";
import { etiquettesDefis } from "../suivi";
import { Etoiles } from "../commun";
import { ACCENT } from "../theme";
import { Pic } from "../Pictos";

// ═══════════════════════════════════════════════════════════════════════════
//  « MON CARNET » : l'espace élève (étoiles, niveau, compétences, badges, prochains objectifs).
//  Tout est calculé par ../carnet.js à partir des lignes d'activité de l'élève.
// ═══════════════════════════════════════════════════════════════════════════


export function Anneau({ frac, n, mont }) {
  const r = 50, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" width="128" height="128" role="img" aria-label={`Niveau ${n}`} style={{ flex: 'none' }}>
      <defs><linearGradient id="cn-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6cf6b" /><stop offset="1" stopColor="#e9a824" /></linearGradient></defs>
      <circle cx="60" cy="60" r={r} fill="rgba(255,255,255,.55)" stroke="#cfe0dc" strokeWidth="9" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#cn-or)" strokeWidth="9" strokeLinecap="round" transform="rotate(-90 60 60)"
        strokeDasharray={c} strokeDashoffset={mont ? c * (1 - Math.max(0.04, frac)) : c} style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)' }} />
      <text x="60" y="44" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3a746e" letterSpacing="2">NIVEAU</text>
      <text x="60" y="80" textAnchor="middle" fontSize="38" fontWeight="800" fill="#134e4a">{n}</text>
    </svg>);
}

const ICONES_OBJECTIF = { terminer: '⏳', ameliorer: '⬆️', decouvrir: '🧭', defi: '🎯' };
const TITRES_OBJECTIF = { terminer: 'À terminer', ameliorer: 'À améliorer', decouvrir: 'À découvrir', defi: 'Défi à relever' };

// parties : quelles parties afficher (toutes par défaut) ; revoirToujours : montrer « À revoir » même s'il n'y a encore rien à revoir
export function Carnet({ lignes, naviguer, parties }) {
  const P = { hero: true, vide: true, revoir: true, revoirToujours: false, revoirMax: Infinity, objectifs: true, competences: true, badges: true, regularite: true, ...parties };
  const [mont, setMont] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMont(true), 80); return () => clearTimeout(t); }, []);
  const items = useMemo(() => [...tousLesExercices(), ...etiquettesDefis().map(d => ({ cle: d.cle, comp: 'DÉFI', titre: d.titre, sim: d.sim }))], []);
  const A = useMemo(() => analyser(items, lignes), [items, lignes]);
  const obj = useMemo(() => objectifs(items, A), [items, A]);
  const rev = useMemo(() => aRevoir(items, lignes), [items, lignes]);
  const { niveau, comps, badges, semaines } = A;
  const suivant = TITRES[Math.min(niveau.n + 1, TITRES.length) - 1];
  const nbBadges = badges.filter(b => b.ok).length, nbSem = semaines.filter(s => s.actif).length;
  const ouvrir = i => (i.atelier ? naviguer(i.atelier, i.ex) : naviguer(i.sim));

  return (
    <div data-carnet className="cn">
      <style>{`
        .cn { margin-top: 12px; }
        .cn-hero { position: relative; overflow: hidden; border-radius: 20px; padding: 20px; color: #134e4a; display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
          background: #e3f3f0; border: 1px solid #cfe6e1; }
        .cn-hero::after { content: ''; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: rgba(233,168,36,.16); }
        .cn-spark { position: absolute; color: #e9a824; animation: cn-twinkle 3.2s ease-in-out infinite; pointer-events: none; }
        .cn-corps { flex: 1; min-width: 220px; position: relative; z-index: 1; }
        .cn-puce { background: rgba(255,255,255,.75); border: 1px solid #cfe6e1; color: #134e4a; border-radius: 999px; padding: 4px 12px; font-size: 13.5px; font-weight: 700; white-space: nowrap; }
        .cn-h { margin: 22px 0 10px; font-size: 18px; font-weight: 800; color: #0f172a; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .cn-h small { font-size: 13px; font-weight: 600; color: #64748b; }
        .cn-repli { margin-top: 22px; }
        .cn-repli > summary { list-style: none; cursor: pointer; margin: 0 0 10px; padding: 10px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; font-size: 17px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cn-repli > summary::-webkit-details-marker { display: none; }
        .cn-repli > summary::after { content: '▾'; margin-left: auto; color: #64748b; transition: transform .2s; }
        .cn-repli[open] > summary::after { transform: rotate(180deg); }
        .cn-repli > summary:hover { border-color: #cbd5e1; background: #fafcfc; }
        .cn-repli > summary small { font-size: 13px; font-weight: 600; color: #64748b; }
        .cn-mini { font-size: 18px; letter-spacing: 1px; }
        .cn-grille { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }
        .cn-carte { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; box-shadow: 0 2px 10px rgba(15,23,42,.05); transition: transform .2s, box-shadow .2s; }
        .cn-carte:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,23,42,.1); }
        .cn-barre { height: 10px; border-radius: 6px; background: #e2e8f0; position: relative; overflow: hidden; }
        .cn-barre > i { display: block; height: 100%; border-radius: 6px; transition: width 1.2s cubic-bezier(.2,.8,.2,1); }
        .cn-medaille { width: 68px; height: 68px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 8px; position: relative; }
        .cn-medaille.ok { background: #fbbf24; box-shadow: 0 0 0 3px #fff, 0 0 0 5px #fbbf24; animation: cn-pop .6s both; }
        .cn-medaille.non { background: #e2e8f0; box-shadow: inset 0 0 0 2px #cbd5e1; filter: grayscale(1); opacity: .6; }
        .cn-badge { text-align: center; padding: 12px 8px; }
        .cn-sem { width: 26px; height: 26px; border-radius: 7px; background: #e2e8f0; }
        .cn-sem.on { background: #059669; }
        .cn-btn { border: none; border-radius: 10px; padding: 8px 14px; font-weight: 800; font-size: 14px; cursor: pointer; color: #fff; background: ${ACCENT}; box-shadow: 0 3px 10px rgba(15,23,42,.18); }
        .cn-btn:hover { filter: brightness(1.08); }
        @keyframes cn-twinkle { 0%, 100% { opacity: .25; transform: scale(.8) rotate(0deg); } 50% { opacity: 1; transform: scale(1.15) rotate(20deg); } }
        @keyframes cn-pop { 0% { transform: scale(.3); opacity: 0; } 70% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .cn *, .cn *::before, .cn *::after { animation: none !important; transition: none !important; } }
      `}</style>

      {/* ── En-tête : niveau et étoiles ── */}
      {P.hero && <section className="cn-hero" aria-label="Mon niveau">
        <span className="cn-spark" style={{ left: '46%', top: 14, fontSize: 18, animationDelay: '0s' }}>✦</span>
        <span className="cn-spark" style={{ left: '62%', bottom: 18, fontSize: 13, animationDelay: '1.1s' }}>✦</span>
        <span className="cn-spark" style={{ right: 28, top: 40, fontSize: 22, animationDelay: '2s' }}>✦</span>
        <Anneau frac={niveau.frac} n={niveau.n} mont={mont} />
        <div className="cn-corps">
          <div style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#3a746e', fontWeight: 700 }}>Mon carnet</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, margin: '2px 0 4px' }}>{niveau.titre}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#a16207' }}><Pic n="star"/>{A.total} étoile{A.total > 1 ? 's' : ''}</div>
          <div className="cn-barre" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(niveau.frac * 100)} aria-label="Progression vers le niveau suivant"
            style={{ background: '#cfe0dc', margin: '10px 0 6px', maxWidth: 380 }}>
            <i style={{ width: mont ? `${Math.max(3, niveau.frac * 100)}%` : '0%', background: '#e9a824' }} />
          </div>
          <div style={{ fontSize: 13.5, color: '#2f5f59' }}>Encore <b>{niveau.reste} ★</b> pour atteindre le niveau {niveau.n + 1} : <b>{suivant}</b></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <span className="cn-puce"><Pic n="ok"/>{A.stat.reussisExo} exercice{A.stat.reussisExo > 1 ? 's' : ''}</span>
            <span className="cn-puce"><Pic n="target"/>{A.stat.reussisDefi} défi{A.stat.reussisDefi > 1 ? 's' : ''}</span>
            <span className="cn-puce"><Pic n="medal"/>{nbBadges} / {badges.length} badges</span>
          </div>
        </div>
      </section>}

      {P.vide && A.aucun && (
        <div style={{ marginTop: 14, padding: 16, borderRadius: 16, background: '#fff7ed', border: '1px solid #fed7aa', textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#9a3412' }}>Ton carnet est encore vide. Ça va changer vite !</div>
          <div style={{ fontSize: 14, color: '#7c2d12', margin: '6px 0 12px' }}>Réussis un exercice pour gagner ta première étoile ★</div>
          <button className="cn-btn" onClick={() => naviguer(38)}>Commencer à m’entraîner ▶</button>
        </div>)}

      {/* ── À revoir aujourd'hui (révision espacée, voir ../revision.js) ── */}
      {P.revoir && (P.revoirToujours || (!A.aucun && rev.suivis > 0)) && (
        <>
          <h3 className="cn-h">🔁 À revoir <small>revoir au bon moment, c’est ce qui fait retenir longtemps</small></h3>
          {rev.liste.length === 0 ? (
            <div className="cn-carte" style={{ fontSize: 15, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 30 }} aria-hidden="true">🧊</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <b>{rev.suivis > 0 ? 'Rien à revoir pour le moment : ta mémoire est au frais !' : 'Rien à revoir : tout va bien !'}</b>
                <div style={{ fontSize: 13.5, color: '#475569', marginTop: 2 }}>
                  {rev.suivis === 0 && <>Les exercices que tu réussis reviendront ici au bon moment, pour que tu les retiennes longtemps.</>}
                  {rev.prochaine ? <>Prochaine révision conseillée : <b>{dansJours(rev.prochaine)}</b>. </> : null}
                  {rev.solides > 0 && <>🧠 {rev.solides} exercice{rev.solides > 1 ? 's' : ''} déjà bien ancré{rev.solides > 1 ? 's' : ''} dans ta mémoire.</>}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="cn-grille">
                {rev.liste.slice(0, P.revoirMax).map(({ item, statut }) => { const comp = A.comps.find(c => c.code === item.comp);
                  return (
                    <div key={item.cle} className="cn-carte" style={{ borderTop: `4px solid ${comp.couleur}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: comp.couleur, textTransform: 'uppercase', letterSpacing: 0.6 }}>🔁 À revoir</div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', lineHeight: 1.35 }}><span style={{ color: comp.couleur }}>{item.comp === 'DÉFI' ? '' : `${item.comp} · `}</span>{item.titre}</div>
                      <div style={{ fontSize: 13.5, color: '#475569', flex: 1 }}>{raisonRevision(statut)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <Etoiles n={A.d(item.cle).etoiles} taille={17} />
                        <button className="cn-btn" onClick={() => ouvrir(item)}>Revoir ▶</button>
                      </div>
                    </div>); })}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                Pas besoin de tout faire d’un coup : {rev.autres + Math.max(0, rev.liste.length - P.revoirMax) > 0 ? `il en reste ${rev.autres + Math.max(0, rev.liste.length - P.revoirMax)} d’autres pour plus tard. Chaque` : 'chaque'} révision réussie t’éloigne de l’oubli, et l’exercice disparaît d’ici jusqu’à sa prochaine date idéale.
              </div>
            </>)}
        </>)}

      {/* ── Prochains objectifs ── */}
      {P.objectifs && !A.aucun && (
        <>
          <h3 className="cn-h"><Pic n="target"/>Mes prochains objectifs</h3>
          {obj.length === 0 ? <div className="cn-carte" style={{ fontSize: 15 }}><Pic n="party"/>Tu as tout réussi avec toutes les étoiles. Bravo ! D’autres exercices arrivent bientôt.</div> : (
            <div className="cn-grille">
              {obj.map(o => { const comp = A.comps.find(c => c.code === o.item.comp);
                return (
                  <div key={o.item.cle} className="cn-carte" style={{ borderTop: `4px solid ${comp.couleur}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: comp.couleur, textTransform: 'uppercase', letterSpacing: 0.6 }}>{ICONES_OBJECTIF[o.type]} {TITRES_OBJECTIF[o.type]}</div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a', lineHeight: 1.35 }}><span style={{ color: comp.couleur }}>{o.item.comp === 'DÉFI' ? '' : `${o.item.comp} · `}</span>{o.item.titre}</div>
                    <div style={{ fontSize: 13.5, color: '#475569', flex: 1 }}>{o.texte}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Etoiles n={A.d(o.item.cle).etoiles} taille={17} />
                      <button className="cn-btn" onClick={() => ouvrir(o.item)}>Y aller ▶</button>
                    </div>
                  </div>); })}
            </div>)}
        </>)}

      {/* ── Compétences ── */}
      {P.competences && <>
      <h3 className="cn-h">🧗 Mes compétences <small>le palier dépend des étoiles gagnées</small></h3>
      <div className="cn-grille">
        {comps.map(c => {
          const p = c.palier;
          return (
            <div key={c.code} data-comp-carnet={c.code} className="cn-carte" style={{ opacity: c.bientot ? 0.7 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: 16, background: c.clair, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icone}</div>
                <div style={{ flex: '1 1 90px', minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: c.couleur, fontSize: 15 }}>{c.code === 'DÉFI' ? 'Défis' : c.code}</div>
                  <div style={{ fontSize: 13, color: '#475569' }}>{c.code === 'DÉFI' ? 'simulations' : c.nom}</div>
                </div>
                {!c.bientot && <span style={{ fontSize: 12, fontWeight: 800, color: c.couleur, background: c.clair, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{p.icone} {p.nom}</span>}
              </div>
              {c.bientot ? <div style={{ margin: '14px 0 4px', fontSize: 14, fontWeight: 700, color: '#64748b' }}>🚧 Bientôt disponible</div> : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '12px 0 5px', fontSize: 13.5, color: '#475569' }}>
                    <span><b style={{ color: '#0f172a', fontSize: 17 }}>{c.etoiles}</b> / {c.max} ★</span>
                    <span>{c.reussis} / {c.n} réussis</span>
                  </div>
                  <div className="cn-barre" role="progressbar" aria-valuemin={0} aria-valuemax={c.max} aria-valuenow={c.etoiles} aria-label={`Étoiles en ${c.nom}`}>
                    <i style={{ width: mont ? `${Math.max(c.etoiles ? 3 : 0, p.frac * 100)}%` : '0%', background: c.couleur }} />
                    {[20, 45, 75].map(s => <span key={s} style={{ position: 'absolute', left: `${s}%`, top: 0, bottom: 0, width: 2, background: '#fff' }} />)}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 6 }}>
                    {p.suivant ? <>Encore <b>{p.reste} ★</b> pour le palier <b>{p.suivant.icone} {p.suivant.nom}</b></> : <b style={{ color: c.couleur }}>Palier maximum atteint !</b>}
                  </div>
                </>)}
            </div>); })}
      </div>

      </>}

      {/* ── Badges ── */}
      {P.badges && <details className="cn-repli" data-repli="badges">
      <summary><Pic n="medal"/>Mes badges <small>{nbBadges} sur {badges.length}</small><span className="cn-mini" aria-hidden="true">{badges.filter(b => b.ok).map(b => <span key={b.id}>{b.icone}</span>)}</span></summary>
      <div className="cn-grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
        {badges.map(b => (
          <div key={b.id} data-badge={b.id} data-ok={b.ok} className="cn-carte cn-badge" title={b.desc}>
            <div className={`cn-medaille ${b.ok ? 'ok' : 'non'}`} aria-hidden="true">{b.icone}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: b.ok ? '#0f172a' : '#64748b' }}>{b.nom}</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, margin: '3px 0 6px' }}>{b.desc}</div>
            {b.ok ? <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309' }}>Obtenu ✓</div> : (
              <>
                <div className="cn-barre" style={{ height: 6 }}><i style={{ width: mont ? `${(100 * b.val) / b.cible}%` : '0%', background: '#94a3b8' }} /></div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>{b.val} / {b.cible}</div>
              </>)}
          </div>))}
      </div>
      </details>}

      {/* ── Régularité ── */}
      {P.regularite && <details className="cn-repli" data-repli="regularite">
      <summary>📅 Ma régularité <small>{nbSem} semaine{nbSem > 1 ? 's' : ''} active{nbSem > 1 ? 's' : ''} sur 8</small></summary>
      <div className="cn-carte" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }} role="img" aria-label={`${nbSem} semaine${nbSem > 1 ? 's' : ''} active${nbSem > 1 ? 's' : ''} sur 8`}>
          {semaines.map((s, k) => <div key={k} className={`cn-sem${s.actif ? ' on' : ''}`} title={`Semaine du ${s.debut.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}${s.actif ? ' : active' : ''}`} />)}
        </div>
        <div style={{ flex: 1, minWidth: 200, fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
          <b style={{ color: '#0f172a' }}>{nbSem} semaine{nbSem > 1 ? 's' : ''} active{nbSem > 1 ? 's' : ''}</b> sur 8. Pas de série à perdre : chaque semaine où tu travailles compte, même un peu.
        </div>
      </div>
      </details>}
    </div>
  );
}
