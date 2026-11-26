import { useRef, useState, useEffect } from "react";
import { KIT, styleBoite, styleBouton } from "../commun";
import { NB } from "./Distillation";
import { nbf, Seg, useEtroit, useLecture, coordSvg, StyleAnim } from "./exploAnim";
import * as M from "./chaineModele";

// ====================================================
//  Exploration animée de la simulation 233 (chaîne énergétique et rendement).
//  Un diagramme de flux vivant : l'énergie électrique entre dans un ou deux convertisseurs ; une bande verte (énergie utile) continue vers
//  l'appareil, des bandes rouges (énergie dissipée, transfert thermique) s'échappent en chaleur. L'épaisseur des bandes est proportionnelle à l'énergie.
//  On tire la poignée de puissance, on clique sur l'appareil pour en changer, on ajoute un convertisseur en amont : le rendement global baisse.
//  Aucun calcul propre : rendements et puissances viennent de chaineModele.js.
// ====================================================
const W = 700, H = 400, CY = 205;
const C = { rec: '#0369a1', utile: '#15803d', diss: '#dc2626', eta: '#6d28d9', ink: '#0f172a' };
const IDS = ['moteur', 'led', 'plaque', 'chargeur'];
const COURT = { moteur: 'Moteur', led: 'LED', plaque: 'Plaque', chargeur: 'Chargeur' };
const T_ANIM = 6;
const th = e => 6 + 56 * Math.max(Math.min(e, 1), 0);
const lum = P => Math.min(1, Math.log10(1 + Math.max(P, 0)) / Math.log10(400));
const nrj = v => (v >= 1000 ? `${nbf(v / 1000, v >= 1e4 ? 1 : 2)}${NB}kJ` : `${nbf(v, 0)}${NB}J`);
const pw = v => `${nbf(v, v >= 100 ? 0 : 1)}${NB}W`;
const pct = e => nbf(100 * e, Math.abs(100 * e - Math.round(100 * e)) < 1e-6 ? 0 : 1);
const XP = i => 70 + i * 100;   // positions de la poignée de puissance

export function ChaineExplore({ ti, setTi }) {
  const boite = useRef(null), svgRef = useRef(null), drag = useRef(false);
  const etroit = useEtroit(boite);
  const L = useLecture(T_ANIM);
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0, dernier = performance.now();
    const pas = now => { setAnim(a => a + Math.min((now - dernier) / 1000, 0.05)); dernier = now; raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, []);

  const app1 = M.APPAREILS.find(a => a.id === ti.app), app2 = ti.amont === 'aucun' ? null : M.APPAREILS.find(a => a.id === ti.amont);
  const apps = app2 ? [app2, app1] : [app1];                       // l'appareil en amont est placé en premier
  const etas = apps.map(a => a.eta), etaG = M.rendementSerie(...etas);
  const Pr = ti.Pr, Pu = Pr * etaG, Pd = Pr - Pu, dt = ti.dt;
  const tau = Math.min(L.t / T_ANIM, 1);
  const Er = Pr * dt * 60 * tau, Eu = Pu * dt * 60 * tau, Ed = Pd * dt * 60 * tau;
  const Fm = etroit ? 1.7 : 1;
  const n = apps.length, xb = n === 1 ? [250] : [180, 350];       // abscisses gauches des boîtes (largeur 104)
  const eIn = i => M.rendementSerie(...etas.slice(0, i)), eOut = i => M.rendementSerie(...etas.slice(0, i + 1));
  const iP = M.PUISSANCES.indexOf(Pr);

  const regler = ch => { setTi(s => ({ ...s, ...ch })); L.demarrer(); };
  const debut = ev => { ev.stopPropagation(); ev.currentTarget.setPointerCapture(ev.pointerId); drag.current = true; L.setTouche(true); bouge(ev); };
  const bouge = ev => {
    if (!drag.current) return;
    const { X } = coordSvg(svgRef.current, ev);
    const i = Math.min(Math.max(Math.round((X - 70) / 100), 0), M.PUISSANCES.length - 1);
    if (M.PUISSANCES[i] !== Pr) regler({ Pr: M.PUISSANCES[i] });
  };
  const fait = ev => { drag.current = false; try { ev.currentTarget.releasePointerCapture(ev.pointerId); } catch { /* déjà relâché */ } };
  const clavierP = ev => {
    const s = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -1 : 0; if (!s) return;
    ev.preventDefault(); regler({ Pr: M.PUISSANCES[Math.min(Math.max(iP + s, 0), M.PUISSANCES.length - 1)] });
  };
  const changerAppareil = () => {
    const suivant = IDS[(IDS.indexOf(ti.app) + 1) % IDS.length];
    regler({ app: suivant, amont: ti.amont === suivant ? 'aucun' : ti.amont });
  };

  const defile = -anim * 70;
  const bande = (x1, x2, e, col, cle) => (
    <g key={cle}>
      <rect x={x1} y={CY - th(e) / 2} width={x2 - x1} height={th(e)} fill={col} opacity="0.28"/>
      <line x1={x1} y1={CY} x2={x2} y2={CY} stroke={col} strokeWidth={Math.max(th(e) - 6, 2)} strokeDasharray="14 18" strokeDashoffset={defile} opacity="0.85"/>
    </g>);
  const ox = 566;                                                // abscisse de l'appareil final
  const message = !L.touche && !L.fin ? 'Tire la poignée de puissance, clique sur l’appareil pour en changer, ajoute un convertisseur en amont : l’épaisseur des bandes montre où va l’énergie.'
    : L.fin ? `Sur ${nrj(Pr * dt * 60)} reçus en ${dt} min, ${nrj(Pu * dt * 60)} sont utiles et ${nrj(Pd * dt * 60)} sont dissipés en chaleur : η = ${pct(etaG)} %.` : '';

  return (
    <div ref={boite}>
      <StyleAnim/>
      <svg ref={svgRef} className="xa-svg" viewBox={etroit ? '0 10 700 390' : `0 0 ${W} ${H}`} role="img"
        aria-label={`Diagramme animé : ${nbf(Pr, 0)} watts d'énergie électrique entrent dans ${n === 2 ? 'deux convertisseurs en série' : 'un convertisseur'} ; ${nbf(Pu, 1)} watts sont utiles et ${nbf(Pd, 1)} watts sont dissipés en chaleur ; rendement global ${nbf(100 * etaG, 0)} pour cent.`}>
        <defs>
          <linearGradient id="cx-fond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fafc"/><stop offset="1" stopColor="#e8eef6"/></linearGradient>
          <linearGradient id="cx-boite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#dbe4f0"/></linearGradient>
          <linearGradient id="cx-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d6c7ae"/><stop offset="1" stopColor="#b8a68a"/></linearGradient>
          <filter id="cx-ombre" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28"/></filter>
        </defs>
        <rect width={W} height={H} fill="url(#cx-fond)"/>
        <rect x="0" y="318" width={W} height="82" fill="url(#cx-table)"/><rect x="0" y="316" width={W} height="4" fill="#8a7a5f"/>
        {!etroit && <text x="350" y="28" textAnchor="middle" fontSize="17" fontWeight="800" fill={C.ink} stroke="#fff" strokeWidth="4" paintOrder="stroke">Où va l’énergie ? Un diagramme de flux</text>}

        {/* bandes : énergie qui entre, énergie utile de sortie de chaque convertisseur */}
        {bande(98, xb[0], 1, C.rec, 'in')}
        {apps.map((a, i) => i === 0 && n === 2 ? bande(xb[0] + 104, xb[1], eOut(0), C.utile, 'm') : null)}
        {bande(xb[n - 1] + 104, ox, eOut(n - 1), C.utile, 'out')}

        {/* source : prise du réseau */}
        <g filter="url(#cx-ombre)">
          <rect x="22" y={CY - 46} width="76" height="92" rx="12" fill="url(#cx-boite)" stroke="#94a3b8" strokeWidth="2.5"/>
          <path d={`M 52 ${CY - 18} v 14 M 68 ${CY - 18} v 14`} stroke="#334155" strokeWidth="5" strokeLinecap="round"/>
          <path d={`M 46 ${CY + 6} h 28 v 6 q 0 14 -14 14 q -14 0 -14 -14 z`} fill="#fde047" stroke="#a16207" strokeWidth="2"/>
        </g>
        <text x="60" y={CY + 66} textAnchor="middle" fontSize={14 * Fm} fontWeight="800" fill={C.rec} stroke="#fff" strokeWidth="4" paintOrder="stroke">réseau</text>
        <text x="60" y={CY - 56} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill={C.rec} stroke="#fff" strokeWidth="4" paintOrder="stroke">{pw(Pr)}</text>

        {/* convertisseurs + chaleur dissipée */}
        {apps.map((a, i) => {
          const x = xb[i], cx = x + 52, ed = eIn(i) - eOut(i), g = Math.min(1, ed * 1.6 + 0.1);
          return (
            <g key={a.id + i}>
              {/* bande de chaleur vers le haut */}
              <rect x={cx - th(ed) / 2} y="86" width={th(ed)} height={CY - 55 - 86} fill={C.diss} opacity="0.28"/>
              <line x1={cx} y1={CY - 55} x2={cx} y2="86" stroke={C.diss} strokeWidth={Math.max(th(ed) - 6, 2)} strokeDasharray="14 18" strokeDashoffset={-defile} opacity="0.85"/>
              {[0, 1, 2].map(k => { const ph = (anim * 0.6 + k / 3) % 1; return <path key={k} d={`M ${cx - 24 + k * 24} ${96 - ph * 38} q 7 -8 14 0 t 14 0`} fill="none" stroke={C.diss} strokeWidth="3.5" strokeLinecap="round" opacity={(1 - ph) * g}/>; })}
              <text x={cx} y={etroit ? 48 : 64} textAnchor="middle" fontSize={14 * Fm} fontWeight="800" fill={C.diss} stroke="#fff" strokeWidth="4" paintOrder="stroke">{etroit ? '' : 'chaleur '}{pw(Pr * ed)}</text>
              <g filter="url(#cx-ombre)">
                <rect x={x} y={CY - 55} width="104" height="110" rx="16" fill="url(#cx-boite)" stroke="#64748b" strokeWidth="2.5"/>
              </g>
              <text x={cx} y={CY - 18} textAnchor="middle" fontSize={15 * (etroit ? 1.3 : 1)} fontWeight="800" fill={C.ink}>{COURT[a.id]}</text>
              <text x={cx} y={CY + 10} textAnchor="middle" fontSize={20 * (etroit ? 1.15 : 1)} fontWeight="800" fill={C.eta}>η = {nbf(100 * a.eta, 0)} %</text>
              <text x={cx} y={CY + 38} textAnchor="middle" fontSize={13 * (etroit ? 1.25 : 1)} fontWeight="700" fill="#475569">{i === 0 && n === 2 ? 'en amont' : 'convertisseur'}</text>
            </g>);
        })}

        {/* appareil final : utile visible */}
        <g className="xa-poignee" role="button" tabIndex={0} aria-label={`Appareil : ${app1.nom}. Cliquer pour changer d'appareil.`} style={{ cursor: 'pointer' }}
          onClick={changerAppareil} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); changerAppareil(); } }}>
          <rect x={ox} y={CY - 66} width="128" height="150" rx="16" fill="#fff" stroke={C.utile} strokeWidth="3" filter="url(#cx-ombre)"/>
          {iconeAppareil(app1.id, ox + 64, CY + 6, { tau, etaG, Pu, anim })}
          <text x={ox + 64} y={CY + 100} textAnchor="middle" fontSize={14 * (etroit ? 1.35 : 1)} fontWeight="800" fill={C.utile} stroke="#fff" strokeWidth="4" paintOrder="stroke">utile {pw(Pu)}</text>
          {!L.touche && <circle className="xa-pulse" cx={ox + 112} cy={CY - 50} r="13" fill="none" stroke={C.utile} strokeWidth="3"/>}
          <circle cx={ox + 112} cy={CY - 50} r="11" fill="#f0fdf4" stroke={C.utile} strokeWidth="3"/>
          <path d={`M ${ox + 106} ${CY - 50} h 12 m -4 -4 l 4 4 l -4 4`} fill="none" stroke={C.utile} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <text x={ox + 64} y={CY - 76} textAnchor="middle" fontSize={15 * Fm} fontWeight="800" fill={C.ink} stroke="#fff" strokeWidth="4" paintOrder="stroke">{COURT[app1.id]}</text>

        {/* rendement global (convertisseurs en série) */}
        {n === 2 && <g>
          <rect x={xb[0]} y={CY + 66} width={xb[1] + 104 - xb[0]} height={etroit ? 44 : 36} rx="12" fill="#faf5ff" stroke={C.eta} strokeWidth="2.5"/>
          <text x={(xb[0] + xb[1] + 104) / 2} y={CY + (etroit ? 96 : 90)} textAnchor="middle" fontSize={17 * (etroit ? 1.3 : 1)} fontWeight="800" fill={C.eta}>{etroit ? `global : ${pct(etaG)} %` : `global : ${nbf(100 * etas[0], 0)} % × ${nbf(100 * etas[1], 0)} % = ${pct(etaG)} %`}</text>
        </g>}

        {/* poignée de puissance */}
        <g>
          <text x="52" y="338" fontSize={14 * (etroit ? 1.6 : 1)} fontWeight="800" fill={C.rec}>puissance reçue (W)</text>
          <line x1={XP(0)} y1="364" x2={XP(3)} y2="364" stroke="#7c6f57" strokeWidth="6" strokeLinecap="round"/>
          <rect x={XP(0) - 14} y="344" width={XP(3) - XP(0) + 28} height="40" fill="transparent" style={{ cursor: 'pointer', touchAction: 'none' }} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait}/>
          {M.PUISSANCES.map((v, i) => <g key={v}><circle cx={XP(i)} cy="364" r="5" fill="#fff" stroke="#7c6f57" strokeWidth="2"/><text x={XP(i)} y="392" textAnchor="middle" fontSize={13 * (etroit ? 1.45 : 1)} fontWeight="700" fill="#3f3a2e">{v}</text></g>)}
          <g className="xa-poignee" role="slider" tabIndex={0} aria-label="Puissance reçue" aria-valuemin={10} aria-valuemax={500} aria-valuenow={Pr} aria-valuetext={`${Pr} watts`}
            onPointerDown={debut} onPointerMove={bouge} onPointerUp={fait} onPointerCancel={fait} onKeyDown={clavierP}>
            <rect x={XP(iP) - (etroit ? 52 : 26)} y="338" width={etroit ? 104 : 52} height="52" fill="transparent"/>
            {!L.touche && <circle className="xa-pulse" cx={XP(iP)} cy="364" r="15" fill="none" stroke={C.rec} strokeWidth="3"/>}
            <circle className="xa-anneau" cx={XP(iP)} cy="364" r="12" fill="#e0f2fe" stroke={C.rec} strokeWidth="3.5" filter="url(#cx-ombre)"/>
            <path d={`M ${XP(iP) - 5} 364 h 10 M ${XP(iP) - 2} 360 l -4 4 l 4 4 M ${XP(iP) + 2} 360 l 4 4 l -4 4`} fill="none" stroke={C.rec} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </g>
      </svg>

      <div role="status" aria-live="polite" style={{ minHeight: 44, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, fontWeight: L.fin ? 700 : 400, color: L.fin ? '#15803d' : KIT.txt2 }}>{message}</div>

      <div className="xa-ctrl lect" style={{ maxWidth: 920, margin: '10px auto 0' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {L.joue
            ? <button type="button" onClick={() => L.setJoue(false)} style={styleBouton(true, '#475569')}>⏸ Pause</button>
            : <button type="button" onClick={L.demarrer} style={styleBouton(true, '#0369a1')}>{L.fin ? '↻ Rejouer' : '▶ Lancer'}</button>}
        </div>
        <label style={{ display: 'block', minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Temps écoulé : {nbf(tau * dt, 1)} min sur {dt} min (accéléré)</span>
          <input type="range" min={0} max={T_ANIM} step={1 / 60} value={Math.min(L.t, T_ANIM)} aria-label="Temps écoulé" onChange={ev => { L.setJoue(false); L.setT(Number(ev.target.value)); L.setTouche(true); }} style={{ width: '100%', minHeight: 32 }}/>
        </label>
        <Seg label="Vitesse de lecture" valeur={L.vit} onChange={L.setVit} options={[[1, '×1'], [0.5, '×½'], [0.25, '×¼']]}/>
      </div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '10px auto 0', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <Seg label="Appareil" valeur={ti.app} onChange={v => regler({ app: v, amont: ti.amont === v ? 'aucun' : ti.amont })} options={M.APPAREILS.map(a => [a.id, a.nom])}/>
        <Seg label="Convertisseur placé avant" valeur={ti.amont} onChange={v => regler({ amont: v })} options={[['aucun', 'aucun'], ...M.APPAREILS.filter(a => a.id !== ti.app).map(a => [a.id, COURT[a.id]])]}/>
        <Seg label="Durée de fonctionnement" valeur={dt} onChange={v => regler({ dt: v })} options={M.DUREES.map(v => [v, `${v} min`])}/>
      </div>

      <div className="xa-chips" style={{ maxWidth: 920, margin: '10px auto 0', '--n': 4 }}>
        {[['Énergie reçue', nrj(Er), C.rec], ['Énergie utile', nrj(Eu), C.utile], ['Énergie dissipée', nrj(Ed), C.diss], ['Rendement global η', `${pct(etaG)} %`, C.eta]].map(([nom, v, c]) => (
          <div key={nom} style={{ ...styleBoite, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{nom}</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
          </div>))}
      </div>
      <div style={{ ...styleBoite, maxWidth: 920, margin: '10px auto 0', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        Conservation de l’énergie : énergie reçue = énergie utile + énergie dissipée. Rendement : η = énergie utile ÷ énergie reçue = <strong style={{ color: C.eta }}>{pct(etaG)} %</strong>{n === 2 ? <> = {nbf(100 * etas[0], 0)} % × {nbf(100 * etas[1], 0)} % (convertisseurs en série : les rendements se multiplient)</> : null}.
      </div>
    </div>);
}

// Icône de l'appareil final, dessinée autour de (cx, cy) ; l'état « utile » (hauteur, luminosité, vapeur, niveau) suit le rendement et le temps.
function iconeAppareil(id, cx, cy, { tau, etaG, Pu, anim }) {
  const l = lum(Pu);
  if (id === 'moteur') {
    const h = 56 * tau * etaG / 0.75;                                         // la charge monte avec le travail utile
    const yc = cy + 40 - Math.min(h, 66);
    return (
      <g>
        <rect x={cx - 44} y={cy - 56} width="88" height="12" rx="4" fill="#475569"/>
        <circle cx={cx} cy={cy - 34} r="18" fill="#cbd5e1" stroke="#334155" strokeWidth="3"/>
        <path d={`M ${cx - 12} ${cy - 34} L ${cx + 12} ${cy - 34} M ${cx} ${cy - 46} L ${cx} ${cy - 22}`} stroke="#334155" strokeWidth="3" transform={`rotate(${anim * 40 * Math.max(etaG, 0.2)} ${cx} ${cy - 34})`}/>
        <line x1={cx} y1={cy - 16} x2={cx} y2={yc} stroke="#78350f" strokeWidth="3"/>
        <rect x={cx - 18} y={yc} width="36" height="30" rx="3" fill="#d97706" stroke="#78350f" strokeWidth="2.5"/>
        <path d={`M ${cx - 18} ${yc + 10} h 36 M ${cx - 18} ${yc + 20} h 36`} stroke="#78350f" strokeWidth="1.5"/>
        <rect x={cx - 40} y={cy + 72} width="80" height="6" rx="3" fill="#94a3b8"/>
      </g>);
  }
  if (id === 'led') {
    return (
      <g>
        {[-60, -30, 0, 30, 60].map((a, k) => <line key={k} x1={cx + Math.sin(a * Math.PI / 180) * 36} y1={cy - 20 - Math.cos(a * Math.PI / 180) * 36} x2={cx + Math.sin(a * Math.PI / 180) * (46 + 22 * l)} y2={cy - 20 - Math.cos(a * Math.PI / 180) * (46 + 22 * l)} stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" opacity={0.25 + 0.75 * l}/>)}
        <circle cx={cx} cy={cy - 20} r="30" fill="#fef9c3" stroke="#a16207" strokeWidth="3" opacity={0.45 + 0.55 * l}/>
        <circle cx={cx} cy={cy - 20} r="30" fill="#fde047" opacity={0.15 + 0.7 * l}/>
        <path d={`M ${cx - 10} ${cy - 6} q 10 -30 20 0`} fill="none" stroke="#a16207" strokeWidth="2.5"/>
        <rect x={cx - 16} y={cy + 10} width="32" height="26" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="2.5"/>
        <path d={`M ${cx - 16} ${cy + 20} h 32 M ${cx - 16} ${cy + 28} h 32`} stroke="#475569" strokeWidth="1.5"/>
      </g>);
  }
  if (id === 'plaque') {
    return (
      <g>
        {[0, 1, 2].map(k => { const ph = (anim * 0.5 + k / 3) % 1; return <path key={k} d={`M ${cx - 18 + k * 18} ${cy - 24 - ph * 30} q 6 -8 12 0 t 12 0`} fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity={(1 - ph) * l}/>; })}
        <path d={`M ${cx - 36} ${cy - 18} h 72 l -6 40 h -60 z`} fill="#94a3b8" stroke="#334155" strokeWidth="3" strokeLinejoin="round"/>
        <path d={`M ${cx - 36} ${cy - 18} h -12 M ${cx + 36} ${cy - 18} h 12`} stroke="#334155" strokeWidth="4" strokeLinecap="round"/>
        <rect x={cx - 52} y={cy + 28} width="104" height="22" rx="6" fill="#1e293b"/>
        <ellipse cx={cx} cy={cy + 28} rx="34" ry="5" fill={`rgba(239,68,68,${0.25 + 0.7 * l})`} stroke="#7f1d1d" strokeWidth="1.5"/>
      </g>);
  }
  const niveau = Math.min(1, tau * etaG / 0.8);                                // chargeur : la batterie se remplit
  return (
    <g>
      <rect x={cx - 34} y={cy - 40} width="68" height="92" rx="9" fill="#f1f5f9" stroke="#334155" strokeWidth="3"/>
      <rect x={cx - 12} y={cy - 48} width="24" height="9" rx="3" fill="#334155"/>
      <rect x={cx - 28} y={cy + 46 - 80 * niveau} width="56" height={80 * niveau} rx="5" fill="#22c55e" opacity="0.9"/>
      <path d={`M ${cx + 4} ${cy - 14} l -14 22 h 12 l -4 20 l 16 -26 h -12 z`} fill="#fff" stroke="#14532d" strokeWidth="1.5" strokeLinejoin="round"/>
    </g>);
}
