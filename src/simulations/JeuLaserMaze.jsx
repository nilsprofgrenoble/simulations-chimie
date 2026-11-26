import { useState, useRef, useMemo } from "react";
import { NIVEAUX, MATERIAUX, tracer, reglageInitial, segmentMiroir, sommetsBloc, etoiles } from "./laserMazeModele";

// ====================================================
//  SIM 290 : LASER MAZE (jeu, 2GT → 1G). Oriente miroirs, lame de verre et prisme pour envoyer le laser sur la cible.
//  Hors menu : réservé à l'administrateur (voir jeuxVisibles.js) ; lien direct ?sim=290. Modèle et tests : laserMazeModele.js.
// ====================================================
const C = { fond: '#070d24', panneau: '#0e1838', bord: '#26407a', texte: '#e8efff', doux: '#9db2d8', laser: '#ff3b4e', vert: '#3be29a', ambre: '#ffc15a', verre: '#7cc8ff', cyan: '#38e1ff' };
const CLE = 'laser-maze-etoiles-v1';
const lireEtoiles = () => { try { return JSON.parse(window.localStorage.getItem(CLE) || '{}'); } catch { return {}; } };
const ecrireEtoiles = o => { try { window.localStorage.setItem(CLE, JSON.stringify(o)); } catch { /* sans stockage : les étoiles ne sont gardées que pour la séance */ } };
const f1 = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
const fmt = x => Math.round(x).toString();
const f2 = x => x.toFixed(2).replace('.', ',');
const sinD = d => Math.sin(d * Math.PI / 180);
const modulo = (a, m) => ((a % m) + m) % m;

const STYLE = `
@keyframes lm-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes lm-pop{0%{transform:scale(.9);opacity:0}100%{transform:none;opacity:1}}
.lm-cible-ok{animation:lm-pulse 1s infinite}.lm-gagne{animation:lm-pop .35s ease-out}
.lm-el:focus-visible .lm-anneau{stroke:#fff;stroke-width:3}
.lm-btn{min-height:40px;padding:0 14px;border-radius:12px;border:1.5px solid ${C.bord};background:${C.panneau};color:${C.texte};font:700 14px Inter,system-ui,sans-serif;cursor:pointer}
.lm-btn:hover{border-color:${C.cyan}}.lm-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.lm-titre{display:none}@media (min-width:700px){.lm-titre{display:inline}}
.lm-btn[aria-pressed=true]{background:${C.cyan};color:#04122b;border-color:${C.cyan}}
@media (prefers-reduced-motion:reduce){.lm-cible-ok,.lm-gagne{animation:none}}
`;

export function SimulationLaserMaze() {
  const [idx, setIdx] = useState(0);
  const [sauv, setSauv] = useState(lireEtoiles);
  const niv = NIVEAUX[idx];
  const gagne = e => setSauv(s => { const n = { ...s, [niv.id]: Math.max(s[niv.id] || 0, e) }; ecrireEtoiles(n); return n; });
  const total = NIVEAUX.reduce((a, n) => a + (sauv[n.id] || 0), 0);
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', color: C.texte, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{STYLE}</style>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h1 style={{ margin: 0, font: "800 24px Outfit, Inter, sans-serif", color: C.texte }}>🔦 Laser Maze</h1>
        <span style={{ color: C.doux, fontSize: 14 }}>Fais toucher la cible par le laser</span>
        <span style={{ marginLeft: 'auto', fontWeight: 800, color: C.ambre }} aria-label={`${total} étoiles sur ${NIVEAUX.length * 3}`}>★ {total} / {NIVEAUX.length * 3}</span>
      </header>
      <nav aria-label="Niveaux" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {NIVEAUX.map((n, i) => (
          <button key={n.id} type="button" className="lm-btn" aria-label={`Niveau ${n.id} : ${n.titre}, ${sauv[n.id] || 0} étoile${(sauv[n.id] || 0) > 1 ? 's' : ''} sur 3`} aria-pressed={i === idx} aria-current={i === idx ? 'step' : undefined} onClick={() => setIdx(i)}>
            <span aria-hidden="true">{n.icone}</span> <span className="lm-nom">{n.id}<span className="lm-titre">. {n.titre}</span></span> <span aria-hidden="true" style={{ color: i === idx ? '#04122b' : C.ambre }}>{'★'.repeat(sauv[n.id] || 0)}{'☆'.repeat(3 - (sauv[n.id] || 0))}</span>
          </button>))}
      </nav>
      <Niveau key={niv.id} niv={niv} onGagne={gagne} dernier={idx === NIVEAUX.length - 1} onSuivant={() => setIdx(i => Math.min(i + 1, NIVEAUX.length - 1))} />
    </div>);
}

function Niveau({ niv, onGagne, onSuivant, dernier }) {
  const [reglage, setReglage] = useState(() => reglageInitial(niv));
  const [gestes, setGestes] = useState(0);
  const [gain, setGain] = useState(null);     // { e: étoiles, g: réglages } figés au moment où la cible est touchée
  const [sel, setSel] = useState(() => [...niv.miroirs, ...niv.blocs][0].id);
  const [angles, setAngles] = useState(true);
  const svgRef = useRef(null), drag = useRef(null), precedent = useRef({ id: null, t: 0 });
  const tr = useMemo(() => tracer(niv, reglage), [niv, reglage]);
  const elements = [...niv.miroirs.map(m => ({ ...m, genre: 'miroir' })), ...niv.blocs.map(b => ({ ...b, genre: 'bloc' }))];
  const elSel = elements.find(e => e.id === sel);

  // enregistre un geste terminé (fin de glissé, clic sur un bouton, flèche du clavier) et teste la victoire
  const geste = (nouveau, compte = true) => {
    const g = compte ? gestes + 1 : gestes;
    if (compte) setGestes(g);
    if (!gain && tracer(niv, nouveau).atteint) { const e = etoiles(niv, g); setGain({ e, g }); onGagne(e); }
  };
  const tourner = (id, delta, instant) => {
    const m = niv.miroirs.some(x => x.id === id), cur = reglage.angles[id];
    const nouveau = { ...reglage, angles: { ...reglage.angles, [id]: modulo(cur + delta, m ? 180 : 360) } };
    const serie = precedent.current.id === id && instant - precedent.current.t < 700;   // appuis rapprochés sur le même élément = un seul réglage
    precedent.current = { id, t: instant };
    setReglage(nouveau); geste(nouveau, !serie);
  };
  const materiau = (id, mat) => { const nouveau = { ...reglage, mats: { ...reglage.mats, [id]: mat } }; setReglage(nouveau); geste(nouveau); };
  const recommencer = () => { setReglage(reglageInitial(niv)); setGestes(0); setGain(null); };

  const pointeur = ev => {
    const svg = svgRef.current, pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [q.x, q.y];
  };
  const debut = (ev, el) => {
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    const [px, py] = pointeur(ev);
    drag.current = { id: el.id, cx: el.x, cy: el.y, a0: reglage.angles[el.id], pa0: Math.atan2(py - el.y, px - el.x) * 180 / Math.PI, bouge: false, mir: el.genre === 'miroir' };
    setSel(el.id);
  };
  const bouge = ev => {
    const dg = drag.current; if (!dg) return;
    const [px, py] = pointeur(ev);
    if (Math.hypot(px - dg.cx, py - dg.cy) < 12) return;   // trop près du centre : l'angle serait instable
    const a = dg.a0 + (Math.atan2(py - dg.cy, px - dg.cx) * 180 / Math.PI - dg.pa0);
    const v = modulo(Math.round(a), dg.mir ? 180 : 360);
    dg.bouge = true;
    setReglage(r => ({ ...r, angles: { ...r.angles, [dg.id]: v } }));
  };
  const fin = () => { const dg = drag.current; drag.current = null; if (dg?.bouge) geste(reglage); };
  const clavier = (ev, el) => {
    const pas = ev.shiftKey ? 5 : 1;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { ev.preventDefault(); tourner(el.id, pas, ev.timeStamp); }
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { ev.preventDefault(); tourner(el.id, -pas, ev.timeStamp); }
  };

  const couleurRayon = tr.atteint ? C.vert : C.laser;
  const chemin = tr.points.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  const a0 = niv.source.a;

  return (
    <div>
      <div style={{ background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '10px 14px', marginBottom: 10 }}>
        <div style={{ fontWeight: 800 }}>Niveau {niv.id} · {niv.titre}</div>
        <div style={{ fontSize: 15, margin: '2px 0 4px' }}>{niv.consigne}</div>
        <details>
          <summary style={{ cursor: 'pointer', color: C.cyan, fontSize: 13.5 }}>Rappel de cours</summary>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: C.doux, lineHeight: 1.5 }}>{niv.savoir}</p>
        </details>
      </div>

      <svg ref={svgRef} viewBox="0 0 800 500" role="group" aria-label={`Plateau du niveau ${niv.id}`}
        style={{ width: '100%', display: 'block', borderRadius: 16, background: 'radial-gradient(ellipse at 50% 30%, #12214d 0%, #070d24 80%)', border: `1px solid ${C.bord}`, userSelect: 'none' }}
        onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin}>
        <defs>
          <pattern id="lm-grille" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#1a2c5e" strokeWidth="1" /></pattern>
          <pattern id="lm-mur" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#334155" /><rect width="3" height="8" fill="#1e293b" /></pattern>
          <filter id="lm-lueur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <rect width="800" height="500" fill="url(#lm-grille)" />

        {/* murs */}
        {(niv.murs || []).map((m, i) => <line key={i} x1={m[0]} y1={m[1]} x2={m[2]} y2={m[3]} stroke="url(#lm-mur)" strokeWidth="14" strokeLinecap="butt" />)}
        {(niv.murs || []).map((m, i) => <line key={'c' + i} x1={m[0]} y1={m[1]} x2={m[2]} y2={m[3]} stroke="#64748b" strokeWidth="14" strokeOpacity=".0" />)}

        {/* blocs transparents */}
        {niv.blocs.map(b => {
          const v = sommetsBloc(b, reglage.angles[b.id]), pts = v.map(p => p.join(',')).join(' '), actif = sel === b.id;
          const n = MATERIAUX[reglage.mats[b.id]].n;
          return (
            <g key={b.id} className="lm-el" tabIndex={0} role="slider" aria-label={`${b.nom} (${MATERIAUX[reglage.mats[b.id]].nom}), orientation ${reglage.angles[b.id]} degrés. Flèches : tourner de 1 degré, avec Maj : 5 degrés.`}
              aria-valuemin={0} aria-valuemax={359} aria-valuenow={reglage.angles[b.id]} onKeyDown={ev => clavier(ev, { ...b, genre: 'bloc' })} onFocus={() => setSel(b.id)}
              onPointerDown={ev => debut(ev, { ...b, genre: 'bloc' })} style={{ cursor: 'grab', outline: 'none', touchAction: 'none' }}>
              <polygon points={pts} fill={C.verre} fillOpacity={0.18 + Math.min(0.2, (n - 1) * 0.08)} stroke={C.verre} strokeWidth={actif ? 3.5 : 2} className="lm-anneau" strokeLinejoin="round" />
              <circle cx={b.x} cy={b.y} r="5" fill={C.verre} />
              <text x={b.x} y={b.y + 22} textAnchor="middle" fontSize="13" fill={C.verre} fontWeight="700" style={{ pointerEvents: 'none' }}>n = {f2(n)}</text>
              {actif && <circle cx={b.x} cy={b.y} r={(b.type === 'lame' ? Math.hypot(b.w, b.h) / 2 : b.c * 0.85) + 12} fill="none" stroke="#fff" strokeOpacity=".35" strokeDasharray="4 6" style={{ pointerEvents: 'none' }} />}
            </g>);
        })}

        {/* miroirs */}
        {niv.miroirs.map(m => {
          const s = segmentMiroir(m, reglage.angles[m.id]), actif = sel === m.id;
          return (
            <g key={m.id} className="lm-el" tabIndex={0} role="slider" aria-label={`${m.nom}, orientation ${reglage.angles[m.id]} degrés. Flèches : tourner de 1 degré, avec Maj : 5 degrés.`}
              aria-valuemin={0} aria-valuemax={179} aria-valuenow={reglage.angles[m.id]} onKeyDown={ev => clavier(ev, { ...m, genre: 'miroir' })} onFocus={() => setSel(m.id)}
              onPointerDown={ev => debut(ev, { ...m, genre: 'miroir' })} style={{ cursor: 'grab', outline: 'none', touchAction: 'none' }}>
              <line x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke="transparent" strokeWidth="34" strokeLinecap="round" />
              <line x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke="#c7d2fe" strokeWidth="7" strokeLinecap="round" className="lm-anneau" />
              <line x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={m.x} cy={m.y} r={actif ? 8 : 5} fill={actif ? C.ambre : '#94a3b8'} />
              {actif && <circle cx={m.x} cy={m.y} r={m.len / 2 + 14} fill="none" stroke="#fff" strokeOpacity=".35" strokeDasharray="4 6" style={{ pointerEvents: 'none' }} />}
              <text x={m.x + 12} y={m.y - 12} fontSize="16" fill={C.doux} fontWeight="700" style={{ pointerEvents: 'none' }}>{m.nom.replace('Miroir ', 'M')}</text>
            </g>);
        })}

        {/* normales et angles (rapporteur) */}
        {angles && tr.evts.filter(e => !(e.type === 'refraction' && e.i1 < 0.5)).map((e, k) => {
          const [x, y] = e.pt, [nx, ny] = e.nor, L = 46;
          const lab = e.type === 'refraction' ? `i₁ = ${fmt(e.i1)}°` : `i = ${fmt(e.i)}°`;
          return (
            <g key={k} style={{ pointerEvents: 'none' }}>
              <line x1={x - nx * L} y1={y - ny * L} x2={x + nx * L} y2={y + ny * L} stroke={C.ambre} strokeWidth="1.5" strokeDasharray="5 5" />
              <text x={x + nx * (L + 6) + (nx >= 0 ? 4 : -4)} y={y + ny * (L + 6)} fontSize="17" fontWeight="800" fill={C.ambre} textAnchor={nx >= 0 ? 'start' : 'end'} paintOrder="stroke" stroke="#070d24" strokeWidth="3">{lab}</text>
            </g>);
        })}

        {/* rayon */}
        <polyline points={chemin} fill="none" stroke={couleurRayon} strokeWidth="9" strokeOpacity=".35" strokeLinejoin="round" strokeLinecap="round" filter="url(#lm-lueur)" style={{ pointerEvents: 'none' }} />
        <polyline points={chemin} fill="none" stroke={couleurRayon} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
        <polyline points={chemin} fill="none" stroke="#fff" strokeWidth="1" strokeOpacity=".8" strokeLinejoin="round" strokeLinecap="round" style={{ pointerEvents: 'none' }} />

        {tr.atteint && gain && (
          <g className="lm-gagne" aria-hidden="true" style={{ pointerEvents: 'none' }}>
            <rect x="250" y="14" width="300" height="46" rx="23" fill="#0b3b2a" stroke={C.vert} strokeWidth="2" />
            <text x="400" y="45" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">🎯 Cible touchée !</text>
          </g>)}

        {/* source */}
        <g transform={`translate(${niv.source.x} ${niv.source.y}) rotate(${a0})`} style={{ pointerEvents: 'none' }}>
          <rect x="-32" y="-12" width="34" height="24" rx="5" fill="#475569" stroke="#94a3b8" /><rect x="2" y="-5" width="8" height="10" rx="2" fill="#1e293b" /><circle cx="-18" cy="0" r="4" fill={C.laser} />
        </g>

        {/* cible */}
        <g style={{ pointerEvents: 'none' }} className={tr.atteint ? 'lm-cible-ok' : undefined}>
          <circle cx={niv.cible.x} cy={niv.cible.y} r={niv.cible.r} fill={tr.atteint ? '#0b3b2a' : '#3b0b14'} stroke={tr.atteint ? C.vert : C.laser} strokeWidth="3" />
          <circle cx={niv.cible.x} cy={niv.cible.y} r={niv.cible.r * 0.62} fill="none" stroke={tr.atteint ? C.vert : C.laser} strokeWidth="2" />
          <circle cx={niv.cible.x} cy={niv.cible.y} r={niv.cible.r * 0.24} fill={tr.atteint ? C.vert : C.laser} />
        </g>
      </svg>

      <div aria-live="polite" style={{ minHeight: 4 }}>
        {tr.atteint && gain && (
          <div className="lm-gagne" style={{ margin: '10px 0', padding: '12px 14px', borderRadius: 14, background: '#0b3b2a', border: `1.5px solid ${C.vert}` }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>🎯 Cible touchée ! <span style={{ color: C.ambre }}>{'★'.repeat(gain.e)}{'☆'.repeat(3 - gain.e)}</span></div>
            <div style={{ fontSize: 13.5, color: '#bbf7d0', margin: '2px 0 8px' }}>En {gain.g} réglage{gain.g > 1 ? 's' : ''} (3 étoiles à {niv.par} réglages ou moins).</div>
            {!dernier && <button type="button" className="lm-btn" onClick={onSuivant} style={{ background: C.vert, color: '#04122b', borderColor: C.vert }}>Niveau suivant ▶</button>}
            {dernier && <span style={{ fontSize: 14 }}>Dernier niveau de la démo : bravo ! 🎉</span>}
          </div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 10, marginTop: 10 }}>
        <section aria-label="Réglage" style={{ background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {elements.map(e => <button key={e.id} type="button" className="lm-btn" aria-pressed={sel === e.id} onClick={() => setSel(e.id)}>{e.nom}</button>)}
          </div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>{elSel.nom} : {reglage.angles[sel]}°</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[-5, -1, 1, 5].map(d => <button key={d} type="button" className="lm-btn" onClick={ev => tourner(sel, d, ev.timeStamp)} aria-label={`Tourner de ${Math.abs(d)} degré${Math.abs(d) > 1 ? 's' : ''} ${d < 0 ? 'vers la gauche' : 'vers la droite'}`}>{d < 0 ? '↺' : '↻'} {Math.abs(d)}°</button>)}
          </div>
          <div style={{ fontSize: 12.5, color: C.doux, marginTop: 6 }}>Glisse le miroir sur le plateau pour le tourner, ou utilise les flèches du clavier (Maj : par 5°).</div>
          {elSel.genre === 'bloc' && elSel.choix && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Matériau du prisme</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(MATERIAUX).map(([k, m]) => <button key={k} type="button" className="lm-btn" aria-pressed={reglage.mats[elSel.id] === k} onClick={() => materiau(elSel.id, k)}>{m.nom} (n = {f2(m.n)})</button>)}
              </div>
            </div>)}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" className="lm-btn" onClick={recommencer}>↺ Recommencer</button>
            <span style={{ fontSize: 13, color: C.doux }}>Réglages : <b style={{ color: C.texte }}>{gestes}</b></span>
          </div>
        </section>

        <section aria-label="Rapporteur" style={{ background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <b>📐 Rapporteur</b>
            <button type="button" className="lm-btn" style={{ marginLeft: 'auto', minHeight: 32, fontSize: 13 }} aria-pressed={angles} onClick={() => setAngles(a => !a)}>{angles ? 'Angles affichés' : 'Angles masqués'}</button>
          </div>
          {!angles && <div style={{ color: C.doux, fontSize: 14 }}>Mode expert : à toi de prévoir les angles !</div>}
          {angles && tr.evts.length === 0 && <div style={{ color: C.doux, fontSize: 14 }}>Le laser ne rencontre encore aucun élément.</div>}
          {angles && tr.evts.map((e, k) => (
            <div key={k} style={{ fontSize: 14, lineHeight: 1.55, borderTop: k ? `1px solid ${C.bord}` : 'none', padding: '4px 0' }}>
              {e.type === 'miroir' && <><b>{e.nom}</b> : i = {fmt(e.i)}° et r = {fmt(e.i)}° (i = r).</>}
              {e.type === 'refraction' && <><b>{e.nom}</b>, {e.entre ? 'entrée' : 'sortie'} : i₁ = {fmt(e.i1)}°, i₂ = {f1(e.i2)}°.<br /><span style={{ color: C.doux }}>Vérif. : {f2(e.n1)} × sin {fmt(e.i1)}° = {f2(e.n1 * sinD(e.i1))} et {f2(e.n2)} × sin {f1(e.i2)}° = {f2(e.n2 * sinD(e.i2))}</span></>}
              {e.type === 'totale' && <><b>{e.nom}</b> : <span style={{ color: C.vert }}>réflexion totale</span> ! i = {fmt(e.i)}° &gt; angle limite {f1(e.limite)}° (sin i<sub>lim</sub> = {f2(e.n2)} / {f2(e.n1)}).</>}
            </div>))}
        </section>
      </div>

      <details style={{ marginTop: 10, background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '8px 14px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses du modèle</summary>
        <ul style={{ margin: '6px 0 2px', paddingLeft: 20, fontSize: 13.5, color: C.doux, lineHeight: 1.55 }}>
          <li>Le faisceau est très fin et d'une seule couleur : l'indice de réfraction ne dépend pas de la couleur (pas de dispersion).</li>
          <li>Les miroirs sont plans et parfaits : toute la lumière est réfléchie.</li>
          <li>À l'interface air/verre, on ne suit que le rayon réfracté : la petite partie réfléchie est négligée (sauf en réflexion totale, où elle est la seule).</li>
          <li>Les angles sont mesurés par rapport à la normale (pointillés) et affichés au degré près.</li>
          <li>Indices utilisés : air 1,00 ; eau 1,33 ; verre 1,50 ; diamant 2,42 (valeurs usuelles, arrondies).</li>
        </ul>
      </details>
    </div>);
}
