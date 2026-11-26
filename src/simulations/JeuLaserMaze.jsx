import { useState, useRef, useMemo } from "react";
import { NIVEAUX, MATERIAUX, LASERS, indice, nomCouleur, teinteLambda, tracer, reglageInitial, segmentMiroir, sommetsBloc, etoiles } from "./laserMazeModele";
import { chapitresDuJeu, allerChapitre } from "../chapitres";

// ====================================================
//  SIM 290 : LASER MAZE (jeu, 2GT → 1G). Oriente miroirs, lame de verre et prisme pour envoyer le laser sur la cible.
//  Aux couleurs de la Paillasse virtuelle (page ordinaire, tons clairs). Réservé à l'administrateur tant que le jeu n'est pas ouvert (jeuxVisibles.js) ;
//  lien direct ?sim=290, carte « Jouer » sur la page du chapitre (chapitres.js, champ « jeux »). Modèle et tests : laserMazeModele.js.
// ====================================================
const C = { fond: '#f4f8fc', panneau: '#ffffff', bord: '#d5dfeb', texte: '#0f172a', doux: '#475569', laser: '#e11d48', vert: '#15803d', ambre: '#f5a31a', ambreTxt: '#b45309', verre: '#2b8fd6', bleu: '#0b4f94', teal: '#2cc4ae' };
const TITRE = "'Outfit', 'Inter', sans-serif";
const CLE = 'laser-maze-etoiles-v1';
const lireEtoiles = () => { try { return JSON.parse(window.localStorage.getItem(CLE) || '{}'); } catch { return {}; } };
const ecrireEtoiles = o => { try { window.localStorage.setItem(CLE, JSON.stringify(o)); } catch { /* sans stockage : les étoiles ne sont gardées que pour la séance */ } };
const f1 = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
const fmt = x => Math.round(x).toString();
const f2 = x => x.toFixed(2).replace('.', ',');
const sinD = d => Math.sin(d * Math.PI / 180);
const modulo = (a, m) => ((a % m) + m) % m;

const STYLE = `
@keyframes lm-pop{0%{transform:scale(.92);opacity:0}100%{transform:none;opacity:1}}
@keyframes lm-pulse{0%,100%{opacity:1}50%{opacity:.55}}
.lm-gagne{animation:lm-pop .35s ease-out}.lm-cible-ok{animation:lm-pulse 1.1s infinite}
.lm-el:focus-visible .lm-anneau{stroke:${C.bleu};stroke-width:4}
.lm-btn{min-height:40px;padding:0 14px;border-radius:14px;border:1.5px solid ${C.bord};background:#fff;color:#334155;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}
.lm-btn:hover{border-color:${C.bleu};color:${C.bleu}}.lm-btn:focus-visible{outline:3px solid ${C.ambre};outline-offset:2px}
.lm-btn[aria-pressed=true]{background:${C.bleu};color:#fff;border-color:${C.bleu}}
.lm-suite{min-height:44px;padding:0 22px;border:none;border-radius:999px;background:${C.ambre};color:#1b2b3a;font:800 15px Inter,system-ui,sans-serif;cursor:pointer}
.lm-suite:focus-visible{outline:3px solid ${C.bleu};outline-offset:2px}
.lm-titre{display:none}@media (min-width:700px){.lm-titre{display:inline}}
@media (prefers-reduced-motion:reduce){.lm-cible-ok,.lm-gagne{animation:none}}
`;
const carte = { background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 20, padding: '12px 16px' };

export function SimulationLaserMaze({ naviguer }) {
  const [idx, setIdx] = useState(0);
  const [sauv, setSauv] = useState(lireEtoiles);
  const niv = NIVEAUX[idx];
  const chap = chapitresDuJeu(290)[0];
  const gagne = e => setSauv(s => { const n = { ...s, [niv.id]: Math.max(s[niv.id] || 0, e) }; ecrireEtoiles(n); return n; });
  const total = NIVEAUX.reduce((a, n) => a + (sauv[n.id] || 0), 0);
  return (
    <div style={{ maxWidth: 940, margin: '0 auto', color: C.texte, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'left' }}>
      <style>{STYLE}</style>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h1 style={{ margin: 0, font: `800 28px ${TITRE}`, color: C.bleu }}>🔦 Laser Maze</h1>
        <span style={{ color: C.doux, fontSize: 14.5 }}>Fais toucher la cible par le laser</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {chap && naviguer && <button type="button" className="lm-btn" onClick={() => allerChapitre(naviguer, chap.id)}>📚 Chapitre et exercices</button>}
          <span style={{ fontWeight: 800, color: C.ambreTxt, background: '#fff3d6', borderRadius: 999, padding: '6px 14px' }} aria-label={`${total} étoiles sur ${NIVEAUX.length * 3}`}>★ {total} / {NIVEAUX.length * 3}</span>
        </span>
      </header>
      <nav aria-label="Niveaux" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {NIVEAUX.map((n, i) => (
          <button key={n.id} type="button" className="lm-btn" aria-label={`Niveau ${n.id} : ${n.titre}, ${sauv[n.id] || 0} étoile${(sauv[n.id] || 0) > 1 ? 's' : ''} sur 3`} aria-pressed={i === idx} aria-current={i === idx ? 'step' : undefined} onClick={() => setIdx(i)}>
            <span aria-hidden="true">{n.icone}</span> <span>{n.id}<span className="lm-titre">. {n.titre}</span></span> <span aria-hidden="true" style={{ color: i === idx ? '#ffd88a' : C.ambre }}>{'★'.repeat(sauv[n.id] || 0)}{'☆'.repeat(3 - (sauv[n.id] || 0))}</span>
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
  const couleur = l => { const nv = { ...reglage, lambda: l }; setReglage(nv); geste(nv); };
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

  const colore = !!(niv.source.choix || niv.source.blanc);
  const cibles = niv.cibles || [niv.cible];
  const pts = r => r.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  // lumière blanche : le tronc commun (avant la première séparation) est dessiné en blanc, puis chaque couleur à part
  const tronc = (() => {
    if (!niv.source.blanc) return 1;
    const R = tr.rayons;
    let k = 1;
    while (R.every(r => r.points[k] && Math.abs(r.points[k][0] - R[0].points[k][0]) < 1e-6 && Math.abs(r.points[k][1] - R[0].points[k][1]) < 1e-6)) k++;
    return k;
  })();
  const lasersLed = niv.source.blanc ? '#ffffff' : colore ? teinteLambda(reglage.lambda) : C.laser;
  const a0 = niv.source.a;

  return (
    <div>
      <div style={{ ...carte, marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontFamily: TITRE, fontSize: 17, color: C.bleu }}>Niveau {niv.id} · {niv.titre}</div>
        <div style={{ fontSize: 15.5, margin: '2px 0 4px' }}>{niv.consigne}</div>
        <details>
          <summary style={{ cursor: 'pointer', color: C.bleu, fontSize: 14, fontWeight: 700 }}>Rappel de cours</summary>
          <p style={{ margin: '6px 0 0', fontSize: 14.5, color: C.doux, lineHeight: 1.55 }}>{niv.savoir}</p>
        </details>
      </div>

      <svg ref={svgRef} viewBox="0 0 800 500" role="group" aria-label={`Plateau du niveau ${niv.id}`}
        style={{ width: '100%', display: 'block', borderRadius: 22, background: '#fbfdff', border: `2px solid ${C.bord}`, boxShadow: '0 6px 20px rgba(11,79,148,.10)', userSelect: 'none' }}
        onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin}>
        <defs>
          <pattern id="lm-grille" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#dbe7f3" strokeWidth="1.2" /></pattern>
          <pattern id="lm-mur" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#cbd5e1" /><rect width="3.5" height="9" fill="#64748b" /></pattern>
          <linearGradient id="lm-argent" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".5" stopColor="#cbd5e1" /><stop offset="1" stopColor="#94a3b8" /></linearGradient>
          <linearGradient id="lm-corps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b7fa8" /><stop offset="1" stopColor="#2f4f78" /></linearGradient>
          <filter id="lm-lueur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5" /></filter>
        </defs>
        <rect width="800" height="500" fill="url(#lm-grille)" />
        <rect x="0" y="476" width="800" height="24" fill="#eef4fa" />
        {Array.from({ length: 81 }, (_, k) => <line key={k} x1={k * 10} y1="476" x2={k * 10} y2={k % 5 === 0 ? 492 : 484} stroke="#94a3b8" strokeWidth="1.2" />)}

        {/* murs */}
        {(niv.murs || []).map((m, i) => <line key={i} x1={m[0]} y1={m[1]} x2={m[2]} y2={m[3]} stroke="#475569" strokeWidth="18" />)}
        {(niv.murs || []).map((m, i) => <line key={'h' + i} x1={m[0]} y1={m[1]} x2={m[2]} y2={m[3]} stroke="url(#lm-mur)" strokeWidth="14" />)}

        {/* blocs transparents */}
        {niv.blocs.map(b => {
          const v = sommetsBloc(b, reglage.angles[b.id]), pts = v.map(p => p.join(',')).join(' '), actif = sel === b.id;
          const n = indice(reglage.mats[b.id], tr.lambdaSuivi);
          return (
            <g key={b.id} className="lm-el" tabIndex={0} role="slider" aria-label={`${b.nom} (${MATERIAUX[reglage.mats[b.id]].nom}), orientation ${reglage.angles[b.id]} degrés. Flèches : tourner de 1 degré, avec Maj : 5 degrés.`}
              aria-valuemin={0} aria-valuemax={359} aria-valuenow={reglage.angles[b.id]} onKeyDown={ev => clavier(ev, { ...b, genre: 'bloc' })} onFocus={() => setSel(b.id)}
              onPointerDown={ev => debut(ev, { ...b, genre: 'bloc' })} style={{ cursor: 'grab', outline: 'none', touchAction: 'none' }}>
              <polygon points={pts} fill={C.verre} fillOpacity={0.14 + Math.min(0.2, (n - 1) * 0.08)} stroke={actif ? C.bleu : C.verre} strokeWidth={actif ? 4 : 2.5} className="lm-anneau" strokeLinejoin="round" />
              <circle cx={b.x} cy={b.y} r="5" fill={C.bleu} />
              <text x={b.x} y={b.y + 24} textAnchor="middle" fontSize="16" fill="#1e6aa3" fontWeight="800" style={{ pointerEvents: 'none' }}>n = {f2(n)}</text>
              {actif && <circle cx={b.x} cy={b.y} r={(b.type === 'lame' ? Math.hypot(b.w, b.h) / 2 : b.c * 0.85) + 12} fill="none" stroke={C.bleu} strokeOpacity=".4" strokeDasharray="5 7" strokeWidth="2" style={{ pointerEvents: 'none' }} />}
            </g>);
        })}

        {/* miroirs */}
        {niv.miroirs.map(m => {
          const s = segmentMiroir(m, reglage.angles[m.id]), actif = sel === m.id;
          return (
            <g key={m.id} className="lm-el" tabIndex={0} role="slider" aria-label={`${m.nom}, orientation ${reglage.angles[m.id]} degrés. Flèches : tourner de 1 degré, avec Maj : 5 degrés.`}
              aria-valuemin={0} aria-valuemax={179} aria-valuenow={reglage.angles[m.id]} onKeyDown={ev => clavier(ev, { ...m, genre: 'miroir' })} onFocus={() => setSel(m.id)}
              onPointerDown={ev => debut(ev, { ...m, genre: 'miroir' })} style={{ cursor: 'grab', outline: 'none', touchAction: 'none' }}>
              <line x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke="transparent" strokeWidth="38" strokeLinecap="round" />
              <line x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={actif ? C.bleu : '#475569'} strokeWidth="11" strokeLinecap="round" className="lm-anneau" />
              <line x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke="url(#lm-argent)" strokeWidth="7" strokeLinecap="round" />
              <circle cx={m.x} cy={m.y} r={actif ? 8 : 5.5} fill={actif ? C.ambre : '#64748b'} stroke="#fff" strokeWidth="2" />
              {actif && <circle cx={m.x} cy={m.y} r={m.len / 2 + 14} fill="none" stroke={C.bleu} strokeOpacity=".4" strokeDasharray="5 7" strokeWidth="2" style={{ pointerEvents: 'none' }} />}
              <text x={m.x + 14} y={m.y - 14} fontSize="17" fill="#334155" fontWeight="800" paintOrder="stroke" stroke="#fbfdff" strokeWidth="4" style={{ pointerEvents: 'none' }}>{m.nom.replace('Miroir ', 'M')}</text>
            </g>);
        })}

        {/* normales et angles (rapporteur) */}
        {angles && tr.evts.filter(e => !(e.type === 'refraction' && e.i1 < 0.5)).map((e, k) => {
          const [x, y] = e.pt, [nx, ny] = e.nor, L = 46;
          const lab = e.type === 'refraction' ? `i₁ = ${fmt(e.i1)}°` : `i = ${fmt(e.i)}°`;
          return (
            <g key={k} style={{ pointerEvents: 'none' }}>
              <line x1={x - nx * L} y1={y - ny * L} x2={x + nx * L} y2={y + ny * L} stroke={C.ambre} strokeWidth="2" strokeDasharray="6 5" />
              <text x={x + nx * (L + 6) + (nx >= 0 ? 4 : -4)} y={y + ny * (L + 6)} fontSize="17" fontWeight="800" fill={C.ambreTxt} textAnchor={nx >= 0 ? 'start' : 'end'} paintOrder="stroke" stroke="#fbfdff" strokeWidth="4">{lab}</text>
            </g>);
        })}

        {/* rayon */}
        {tr.rayons.map(r => {
          const col = colore ? teinteLambda(r.lambda) : (tr.atteint ? '#16a34a' : C.laser);
          const halo = colore ? col : (tr.atteint ? '#4ade80' : '#fb7185');
          const debut = niv.source.blanc ? tronc - 1 : 0, ch = pts(r.points.slice(debut));
          return (
            <g key={r.lambda} style={{ pointerEvents: 'none' }}>
              <polyline points={ch} fill="none" stroke={halo} strokeWidth="10" strokeOpacity=".3" strokeLinejoin="round" strokeLinecap="round" filter="url(#lm-lueur)" />
              <polyline points={ch} fill="none" stroke={col} strokeWidth={niv.source.blanc ? 2.6 : 3.4} strokeLinejoin="round" strokeLinecap="round" />
            </g>);
        })}
        {niv.source.blanc && (
          <g style={{ pointerEvents: 'none' }}>
            <polyline points={pts(tr.rayons[0].points.slice(0, tronc))} fill="none" stroke="#64748b" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={pts(tr.rayons[0].points.slice(0, tronc))} fill="none" stroke="#ffffff" strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" />
          </g>)}

        {/* source : pointeur laser */}
        <g transform={`translate(${niv.source.x} ${niv.source.y}) rotate(${a0})`} style={{ pointerEvents: 'none' }}>
          <rect x="-40" y="-13" width="42" height="26" rx="7" fill="url(#lm-corps)" stroke="#27466f" strokeWidth="1.5" />
          <rect x="-34" y="-8" width="14" height="5" rx="2.5" fill="#fff" fillOpacity=".5" />
          <rect x="2" y="-6" width="9" height="12" rx="3" fill="#334155" /><circle cx="-26" cy="5" r="3.5" fill={lasersLed} stroke="#475569" strokeWidth="1" />
        </g>

        {/* cibles */}
        {cibles.map((c, k) => {
          const ok = tr.atteintes[k], teinte = c.bande ? teinteLambda((c.bande[0] + c.bande[1]) / 2) : C.ambre, bord = ok ? '#16a34a' : teinte;
          return (
            <g key={k} style={{ pointerEvents: 'none' }} className={ok ? 'lm-cible-ok' : undefined}>
              <circle cx={c.x} cy={c.y} r={c.r} fill={ok ? '#dcfce7' : c.bande ? '#fff' : '#ffeccc'} stroke={bord} strokeWidth="4" />
              <circle cx={c.x} cy={c.y} r={c.r * 0.62} fill={c.bande ? teinte : '#fff'} fillOpacity={c.bande ? 0.25 : 1} stroke={bord} strokeWidth="2.5" />
              <circle cx={c.x} cy={c.y} r={c.r * 0.26} fill={ok ? '#16a34a' : c.bande ? teinte : C.laser} />
              {c.nom && <text x={c.x > 560 ? c.x - c.r - 8 : c.x + c.r + 8} textAnchor={c.x > 560 ? 'end' : 'start'} y={c.y + 5} fontSize="16" fontWeight="800" fill={ok ? '#14532d' : teinte} paintOrder="stroke" stroke="#fbfdff" strokeWidth="4">cible {c.nom}</text>}
            </g>);
        })}

        {tr.atteint && gain && (
          <g className="lm-gagne" aria-hidden="true" style={{ pointerEvents: 'none' }}>
            <rect x="240" y="14" width="320" height="48" rx="24" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
            <text x="400" y="46" textAnchor="middle" fontSize="23" fontWeight="800" fill="#14532d">🎯 Cible touchée !</text>
          </g>)}
      </svg>

      <div aria-live="polite" style={{ minHeight: 4 }}>
        {tr.atteint && gain && (
          <div className="lm-gagne" style={{ margin: '10px 0', padding: '12px 16px', borderRadius: 20, background: '#ecfdf3', border: '1.5px solid #16a34a' }}>
            <div style={{ fontWeight: 800, fontSize: 18, fontFamily: TITRE, color: '#14532d' }}>🎯 Cible touchée ! <span style={{ color: C.ambre }}>{'★'.repeat(gain.e)}{'☆'.repeat(3 - gain.e)}</span></div>
            <div style={{ fontSize: 14, color: '#166534', margin: '2px 0 8px' }}>En {gain.g} réglage{gain.g > 1 ? 's' : ''} (3 étoiles à {niv.par} réglages ou moins).</div>
            {!dernier && <button type="button" className="lm-suite" onClick={onSuivant}>Niveau suivant ▶</button>}
            {dernier && <span style={{ fontSize: 15, fontWeight: 700 }}>Dernier niveau : bravo, tu maîtrises la lumière ! 🎉</span>}
          </div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 10, marginTop: 10 }}>
        <section aria-label="Réglage" style={carte}>
          {niv.source.choix && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Couleur du laser</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LASERS.map(l => <button key={l.lambda} type="button" className="lm-btn" aria-pressed={reglage.lambda === l.lambda} onClick={() => couleur(l.lambda)}><span aria-hidden="true" style={{ color: reglage.lambda === l.lambda ? '#fff' : teinteLambda(l.lambda) }}>●</span> {l.nom} · {l.lambda} nm</button>)}
              </div>
            </div>)}
          {niv.source.blanc && <div style={{ fontSize: 13.5, color: C.doux, marginBottom: 8, lineHeight: 1.45 }}>⚪ Lumière blanche : un mélange de couleurs de 430 nm (violet) à 670 nm (rouge), ici représenté par 7 rayons.</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {elements.map(e => <button key={e.id} type="button" className="lm-btn" aria-pressed={sel === e.id} onClick={() => setSel(e.id)}>{e.nom}</button>)}
          </div>
          <div style={{ fontWeight: 800, marginBottom: 6, fontFamily: TITRE, fontSize: 17 }}>{elSel.nom} : {reglage.angles[sel]}°</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[-5, -1, 1, 5].map(d => <button key={d} type="button" className="lm-btn" onClick={ev => tourner(sel, d, ev.timeStamp)} aria-label={`Tourner de ${Math.abs(d)} degré${Math.abs(d) > 1 ? 's' : ''} ${d < 0 ? 'vers la gauche' : 'vers la droite'}`}>{d < 0 ? '↺' : '↻'} {Math.abs(d)}°</button>)}
          </div>
          <div style={{ fontSize: 13, color: C.doux, marginTop: 6, lineHeight: 1.45 }}>Glisse l’élément sur le plateau pour le tourner, ou utilise les flèches du clavier (Maj : par 5°).</div>
          {elSel.genre === 'bloc' && elSel.choix && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Matériau du prisme</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(MATERIAUX).map(([k, m]) => <button key={k} type="button" className="lm-btn" aria-pressed={reglage.mats[elSel.id] === k} onClick={() => materiau(elSel.id, k)}>{m.nom} (n ≈ {f2(m.n)})</button>)}
              </div>
            </div>)}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" className="lm-btn" onClick={recommencer}>↺ Recommencer</button>
            <span style={{ fontSize: 13.5, color: C.doux }}>Réglages : <b style={{ color: C.texte }}>{gestes}</b></span>
          </div>
        </section>

        <section aria-label="Rapporteur" style={carte}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <b style={{ fontFamily: TITRE, fontSize: 16 }}>📐 Rapporteur</b>
            <button type="button" className="lm-btn" style={{ marginLeft: 'auto', minHeight: 32, fontSize: 13 }} aria-pressed={angles} onClick={() => setAngles(a => !a)}>{angles ? 'Angles affichés' : 'Angles masqués'}</button>
          </div>
          {angles && colore && <div style={{ fontSize: 14, marginBottom: 4 }}>Rayon suivi : <b style={{ color: teinteLambda(tr.lambdaSuivi) }}>{nomCouleur(tr.lambdaSuivi)} ({tr.lambdaSuivi} nm)</b></div>}
          {!angles && <div style={{ color: C.doux, fontSize: 14.5 }}>Mode expert : à toi de prévoir les angles !</div>}
          {angles && tr.evts.length === 0 && <div style={{ color: C.doux, fontSize: 14.5 }}>Le laser ne rencontre encore aucun élément.</div>}
          {angles && tr.evts.map((e, k) => (
            <div key={k} style={{ fontSize: 14.5, lineHeight: 1.55, borderTop: k ? `1px solid ${C.bord}` : 'none', padding: '4px 0' }}>
              {e.type === 'miroir' && <><b>{e.nom}</b> : i = {fmt(e.i)}° et r = {fmt(e.i)}° (i = r).</>}
              {e.type === 'refraction' && <><b>{e.nom}</b>, {e.entre ? 'entrée' : 'sortie'} : i₁ = {fmt(e.i1)}°, i₂ = {f1(e.i2)}°.<br /><span style={{ color: C.doux }}>Vérif. : {f2(e.n1)} × sin {fmt(e.i1)}° = {f2(e.n1 * sinD(e.i1))} et {f2(e.n2)} × sin {f1(e.i2)}° = {f2(e.n2 * sinD(e.i2))}</span></>}
              {e.type === 'totale' && <><b>{e.nom}</b> : <span style={{ color: C.vert, fontWeight: 700 }}>réflexion totale</span> ! i = {fmt(e.i)}° &gt; angle limite {f1(e.limite)}° (sin i<sub>lim</sub> = {f2(e.n2)} / {f2(e.n1)}).</>}
            </div>))}
        </section>
      </div>

      <details style={{ ...carte, marginTop: 10, padding: '8px 16px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses du modèle</summary>
        <ul style={{ margin: '6px 0 2px', paddingLeft: 20, fontSize: 14, color: C.doux, lineHeight: 1.55 }}>
          <li>Le faisceau est très fin. Un laser est monochromatique ; la lumière blanche est représentée par 7 rayons de longueurs d’onde différentes.</li>
          <li>Dispersion : l’indice dépend de la longueur d’onde, n(λ) = n₅₈₉ + D × ((589/λ)² − 1) (modèle simple). Le coefficient D est <b>volontairement exagéré</b> (environ ×3 à ×5) pour que l’étalement du spectre soit bien visible ; dans la réalité, il est bien plus faible.</li>
          <li>Les couleurs affichées sont des teintes approchées (la couleur perçue dépend aussi de l’écran).</li>
          <li>Les miroirs sont plans et parfaits : toute la lumière est réfléchie.</li>
          <li>À l’interface air/verre, on ne suit que le rayon réfracté : la petite partie réfléchie est négligée (sauf en réflexion totale, où elle est la seule).</li>
          <li>Les angles sont mesurés par rapport à la normale (pointillés) et affichés au degré près.</li>
          <li>Indices à 589 nm (jaune) : air 1,00 ; eau 1,33 ; verre 1,50 ; diamant 2,42 (valeurs usuelles, arrondies).</li>
        </ul>
      </details>
    </div>);
}
