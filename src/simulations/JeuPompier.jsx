import { useState, useMemo, useEffect } from "react";
import { MISSIONS, DIAMETRES, N_MAX, LONG_TUYAU, DEBIT_MIN, DEBIT_MAX, DEBIT_PAS, DIST_SECU, BAR, FACTEUR_AIR, ABSORPTION, attaque, debitMini, energieUtileParLitre, reglageDepart, estLibre, etoilesNiveau } from "./pompierModele";
import { PompierScene, STYLE_POMPIER } from "./PompierScene";
import { chapitresDuJeu, allerChapitre } from "../chapitres";

// ====================================================
//  SIM 296 : POMPIERS — DE LA LANCE À LA PRESSION (jeu, TSTL, transport des fluides). On règle le diamètre du tuyau, sa longueur et le débit pour qu'au bout
//  de la lance la pression soit dans la bonne plage, que le jet atteigne le foyer et qu'il y ait assez d'eau pour absorber la puissance du feu.
//  Niveaux 1 à 3 : une seule idée à la fois (réglages verrouillés sauf un) ; niveaux 4 à 8 : tous les réglages. Objectif et voyants affichés en direct.
//  Modèle et tests : pompierModele.js (mêmes lois que « Circuits hydrauliques » : Bernoulli avec pertes de charge). Scène : PompierScene.jsx.
//  Page ordinaire aux couleurs de la Paillasse virtuelle (calculatrice flottante du site disponible). Accès : jeuxVisibles.js ; ?sim=296.
// ====================================================
const C = { fond: '#f4f8fc', panneau: '#ffffff', bord: '#d5dfeb', texte: '#0f172a', doux: '#475569', ambre: '#f5a31a', ambreTxt: '#b45309', vert: '#15803d', rouge: '#dc2626', bleu: '#0b4f94' };
const TITRE = "'Outfit', 'Inter', sans-serif";
const CLE = 'pompier-v2';
const lire = () => { try { return JSON.parse(window.localStorage.getItem(CLE) || '{}'); } catch { return {}; } };
const ecrire = o => { try { window.localStorage.setItem(CLE, JSON.stringify(o)); } catch { /* records gardés pour la séance seulement */ } };
const fr = (x, d = 1) => (isFinite(x) ? x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const bar = pa => pa / BAR;

const STYLE = `
@keyframes pp-pop{0%{transform:scale(.95);opacity:0}100%{transform:none;opacity:1}}
@keyframes pp-pulse{0%,100%{box-shadow:0 0 0 0 ${C.ambre}88}50%{box-shadow:0 0 0 7px ${C.ambre}00}}
.pp-pop{animation:pp-pop .3s ease-out}
.pp-libre{animation:pp-pulse 1.8s ease-in-out infinite}
.pp-btn{min-height:44px;padding:0 14px;border-radius:14px;border:1.5px solid ${C.bord};background:#fff;color:#334155;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}
.pp-btn:hover{border-color:${C.bleu};color:${C.bleu}}.pp-btn:focus-visible,.pp-dn:focus-visible{outline:3px solid ${C.ambre};outline-offset:2px}
.pp-btn:disabled{opacity:.45;cursor:not-allowed}
.pp-grand{min-height:54px;padding:0 26px;border-radius:999px;border:none;background:${C.ambre};color:#1b2b3a;font:800 18px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 0 #c47f08;width:100%}
.pp-grand:hover:not(:disabled){filter:brightness(1.05)}.pp-grand:disabled{opacity:.5;cursor:not-allowed;box-shadow:none;background:#cbd5e1}.pp-grand:focus-visible{outline:3px solid ${C.bleu};outline-offset:2px}
.pp-dn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 8px;border-radius:16px;border:2px solid ${C.bord};background:#fff;cursor:pointer;font:700 14px Inter,system-ui,sans-serif;color:#334155}
.pp-dn[aria-pressed=true]{border-color:${C.bleu};background:#eaf3fc;color:${C.bleu};box-shadow:0 0 0 2px ${C.bleu}33}
.pp-dn:disabled{cursor:not-allowed}
.pp-curseur{width:100%;height:36px;accent-color:${C.ambre}}
${STYLE_POMPIER}
@media (prefers-reduced-motion:reduce){.pp-pop,.pp-libre{animation:none}}
`;
const carte = { background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 20, padding: '12px 16px' };
const titreCarte = { font: `800 15px ${TITRE}`, color: C.bleu, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.04em' };

// Manomètre : aiguille sur 0 – 12 bar, plage de bon fonctionnement en vert
function Manometre({ valeur, pMin, pMax, titre, max = 12 }) {
  const cx = 100, cy = 100, r = 78;
  const ang = v => 150 + 240 * Math.max(0, Math.min(max * 1.04, v)) / max;
  const pt = (v, rr) => [cx + rr * Math.cos(ang(v) * Math.PI / 180), cy + rr * Math.sin(ang(v) * Math.PI / 180)];
  const arc = (v1, v2, rr) => { const [x1, y1] = pt(v1, rr), [x2, y2] = pt(v2, rr); return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${rr} ${rr} 0 ${(ang(v2) - ang(v1)) > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
  const dedans = pMin == null || (valeur >= pMin - 1e-9 && valeur <= pMax + 1e-9);
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg viewBox="0 0 200 196" width="100%" style={{ maxWidth: 230 }} role="img" aria-label={`${titre} : ${fr(valeur)} bar${pMin != null ? `, plage à respecter de ${pMin} à ${pMax} bar` : ''}`}>
        <circle cx={cx} cy={cy} r="95" fill="#1f2937" /><circle cx={cx} cy={cy} r="89" fill="#f8fafc" />
        <path d={arc(0, max, r)} fill="none" stroke="#cbd5e1" strokeWidth="9" />
        {pMin != null && <path d={arc(0, pMin, r)} fill="none" stroke="#f59e0b" strokeWidth="9" opacity=".75" />}
        {pMin != null && <path d={arc(pMin, pMax, r)} fill="none" stroke="#22c55e" strokeWidth="9" />}
        {pMin != null && <path d={arc(pMax, max, r)} fill="none" stroke="#ef4444" strokeWidth="9" opacity=".75" />}
        {Array.from({ length: max + 1 }).map((_, v) => { const [x1, y1] = pt(v, r - 9), [x2, y2] = pt(v, r - 16); const [tx, ty] = pt(v, r - 27); return <g key={v}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1.6" />{v % 2 === 0 && <text x={tx} y={ty + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">{v}</text>}</g>; })}
        <g style={{ transform: `rotate(${ang(valeur)}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform .45s cubic-bezier(.3,1.4,.5,1)' }}>
          <line x1={cx - 10} y1={cy} x2={cx + r - 14} y2={cy} stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="7" fill="#1f2937" />
        <text x={cx} y={cy + 58} textAnchor="middle" fontSize="22" fontWeight="900" fill={dedans ? '#166534' : '#b91c1c'}>{fr(valeur)} bar</text>
      </svg>
      <figcaption style={{ fontSize: 13.5, fontWeight: 700, color: C.doux, marginTop: -2 }}>{titre}</figcaption>
    </figure>);
}

// Où va la pression fournie par la pompe ? (bilan de Bernoulli en barres)
function BarreBilan({ a, m }) {
  const lin = Math.max(0, a.dpLin), sing = Math.max(0, a.dpSing), grav = a.dpGrav, lance = Math.max(0, a.pLance);
  const manque = Math.max(0, -a.pLance);
  const total = Math.max(a.pPompe, lin + sing + grav + lance);
  const segs = [['Pertes dans le tuyau', lin, '#ef4444'], ['Pertes dans les coudes', sing, '#f97316'], ['Hauteur (ρ·g·z)', grav, '#a855f7'], ['Pression à la lance', lance, '#16a34a']].filter(s => s[1] > 0);
  return (
    <div>
      <div style={{ display: 'flex', height: 30, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.bord}`, background: '#eef2f7' }} role="img"
        aria-label={`Pression de la pompe ${fr(m.pPompe, 0)} bar : ${segs.map(s => `${s[0]} ${fr(bar(s[1]))} bar`).join(', ')}${manque ? `, il manque ${fr(bar(manque))} bar` : ''}`}>
        {segs.map(([n, v, col]) => <div key={n} title={`${n} : ${fr(bar(v))} bar`} style={{ width: `${100 * v / total}%`, background: col, transition: 'width .4s', minWidth: 2 }} />)}
        {manque > 0 && <div style={{ flex: 1, background: 'repeating-linear-gradient(45deg,#fecaca,#fecaca 6px,#fff 6px,#fff 12px)' }} />}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 6, fontSize: 13 }}>
        {[['Pertes dans le tuyau', a.dpLin, '#ef4444'], ...(m.coudes ? [['Coudes', a.dpSing, '#f97316']] : []), ...(m.zLance ? [['Hauteur', a.dpGrav, '#a855f7']] : []), ['Lance', a.pLance, '#16a34a']].map(([n, v, col]) => (
          <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.doux }}><i style={{ width: 11, height: 11, borderRadius: 3, background: col, display: 'inline-block' }} />{n} <b style={{ color: C.texte }}>{fr(bar(v))} bar</b></span>))}
      </div>
      {manque > 0 && <div style={{ fontSize: 13, color: C.rouge, marginTop: 4, fontWeight: 700 }}>Les pertes dépassent la pression de la pompe : l'eau n'arrive plus à la lance.</div>}
    </div>);
}

// Un voyant : rond vert (✓) ou rouge (✗), ce qu'on mesure, la cible, et un mot qui dit dans quel sens agir
function Voyant({ ok, titre, valeur, cible, sens }) {
  return (
    <li style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.bord}` }}>
      <span aria-hidden="true" style={{ flex: 'none', width: 30, height: 30, borderRadius: 15, background: ok ? '#16a34a' : '#dc2626', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 17, transition: 'background .25s' }}>{ok ? '✓' : '✗'}</span>
      <span style={{ flex: 1, lineHeight: 1.35 }}>
        <b style={{ fontSize: 15 }}>{titre}</b><span style={{ position: 'absolute', left: -9999 }}>{ok ? ' : réussi' : ' : à régler'}</span><br />
        <span style={{ fontSize: 13.5, color: C.doux }}>{valeur} <span style={{ color: '#94a3b8' }}>→</span> cible : {cible}{!ok && sens ? <b style={{ color: C.rouge }}> · {sens}</b> : null}</span>
      </span>
    </li>);
}

function Mission({ m, onFin, onMenu, onSuivant, derniere }) {
  const [reg, setReg] = useState(() => reglageDepart(m));
  const [etat, setEtat] = useState('prepa');       // prepa | ok
  const [aide, setAide] = useState(false);         // indice affiché (coûte une étoile)
  const [calculs, setCalculs] = useState(false);
  const [rep, setRep] = useState(null);            // réponse choisie à la question du capitaine
  const a = useMemo(() => attaque(m, reg), [m, reg]);
  const eu = energieUtileParLitre();               // J/L
  const pAbs = reg.qLmin / 60 * eu / 1e6;         // MW absorbés
  const fige = etat === 'ok';
  const regle = (k, v) => { if (!fige && estLibre(m, k)) setReg(r => ({ ...r, [k]: v })); };
  const actifs = m.actifs;
  const qcmJuste = rep != null && rep === m.qcm.bonne;
  const et = etoilesNiveau({ indice: aide, qcmJuste });
  const repondre = i => { if (rep != null) return; setRep(i); onFin(m.id, etoilesNiveau({ indice: aide, qcmJuste: i === m.qcm.bonne })); };
  useEffect(() => { window.scrollTo?.({ top: 0 }); }, []);

  const libres = ['dMm', 'nTuyaux', 'qLmin'].filter(k => estLibre(m, k));
  const accent = k => (m.appren && libres.length === 1 && libres[0] === k);
  const verrou = (k, texte) => !estLibre(m, k) && <div style={{ fontSize: 13, color: C.ambreTxt, fontWeight: 700, marginTop: 6 }}>🔒 Imposé dans ce niveau : {texte}</div>;

  return (
    <div>
      <div style={{ ...carte, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div style={{ font: `800 22px ${TITRE}`, color: C.bleu }}>{m.icone} Niveau {m.id} · {m.nom}</div>
          {m.appren && <span style={{ fontSize: 12.5, fontWeight: 800, background: '#dbeafe', color: C.bleu, borderRadius: 999, padding: '2px 10px' }}>🎓 on apprend une idée</span>}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.5, color: C.doux }}>{m.histoire}</p>
        <div style={{ marginTop: 8, background: '#fff7e0', border: `2px solid ${C.ambre}`, borderRadius: 14, padding: '8px 14px', fontSize: 16, lineHeight: 1.45 }}>
          🎯 <b>Objectif :</b> {m.objectif}
        </div>
        <div style={{ marginTop: 8, fontSize: 13.5, color: C.doux }}><b>Comment jouer :</b> ① règle {libres.length === 1 ? 'le curseur libre' : 'les trois cartes'} ② regarde les voyants et le manomètre ③ quand tout est vert, lance l'attaque.</div>
      </div>

      <PompierScene m={m} a={a} etat={etat} tentative={0} />

      <div style={{ ...carte, margin: '10px 0', display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 14.5, alignItems: 'center' }}>
        <span>🔥 Feu : <b>{fr(m.puissanceMW)} MW</b></span>
        <span>⛽ Pompe : <b>{fr(m.pPompe, 0)} bar</b> (fixée)</span>
        <span>📏 Foyer à <b>{m.distFeu} m</b> du camion{m.hFeu ? <>, <b>{m.hFeu} m</b> de haut</> : null}</span>
        {m.coudes > 0 && <span>↪️ <b>{m.coudes}</b> coude{m.coudes > 1 ? 's' : ''} sur le trajet</span>}
        {m.zLance > 0 && <span>🪜 Lance à <b>{m.zLance} m</b> de haut</span>}
      </div>

      <div className="pp-cols" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: 12 }}>
        <style>{`@media (max-width:820px){.pp-cols{grid-template-columns:1fr !important}}`}</style>
        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <section style={carte} className={accent('dMm') ? 'pp-libre' : undefined} aria-label="Diamètre du tuyau">
            <h2 style={titreCarte}>Diamètre du tuyau</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {DIAMETRES.map(d => (
                <button key={d} type="button" className="pp-dn" aria-pressed={reg.dMm === d} disabled={fige || !estLibre(m, 'dMm')} style={!estLibre(m, 'dMm') && reg.dMm !== d ? { opacity: 0.35 } : undefined} onClick={() => regle('dMm', d)}>
                  <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r={d / 110 * 21 + 1} fill={d === 45 ? '#f5a31a' : d === 70 ? '#e2432f' : '#2b6fd6'} stroke="#111827" strokeOpacity=".4" strokeWidth="2" /><circle cx="23" cy="23" r={d / 110 * 21 - 3} fill="#bfe6ff" /></svg>
                  DN {d}
                </button>))}
            </div>
            <p style={{ fontSize: 13.5, color: C.doux, margin: '8px 0 0', lineHeight: 1.5 }}>Vitesse de l'eau <b style={{ color: C.texte }}>v = {fr(a.v, 1)} m/s</b></p>
            {verrou('dMm', `DN ${m.fixe?.dMm}`)}
          </section>

          <section style={carte} className={accent('nTuyaux') ? 'pp-libre' : undefined} aria-label="Longueur du tuyau">
            <h2 style={titreCarte}>Longueur de tuyau</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <button type="button" className="pp-btn" aria-label="Retirer un tuyau" disabled={fige || !estLibre(m, 'nTuyaux') || reg.nTuyaux <= 1} onClick={() => regle('nTuyaux', reg.nTuyaux - 1)}>−</button>
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div style={{ font: `900 30px ${TITRE}`, color: C.bleu }}>{a.L} m</div>
                <div style={{ fontSize: 13, color: C.doux }}>{reg.nTuyaux} tuyau{reg.nTuyaux > 1 ? 'x' : ''} de {LONG_TUYAU} m</div>
              </div>
              <button type="button" className="pp-btn" aria-label="Ajouter un tuyau" disabled={fige || !estLibre(m, 'nTuyaux') || reg.nTuyaux >= N_MAX} onClick={() => regle('nTuyaux', reg.nTuyaux + 1)}>+</button>
            </div>
            {verrou('nTuyaux', `${m.fixe?.nTuyaux} tuyaux (${(m.fixe?.nTuyaux || 0) * LONG_TUYAU} m)`)}
          </section>

          <section style={carte} className={accent('qLmin') ? 'pp-libre' : undefined} aria-label="Débit">
            <h2 style={titreCarte}>Débit</h2>
            <div style={{ textAlign: 'center', font: `900 30px ${TITRE}`, color: C.bleu }}>{reg.qLmin} L/min</div>
            <input className="pp-curseur" type="range" min={DEBIT_MIN} max={DEBIT_MAX} step={DEBIT_PAS} value={reg.qLmin} disabled={fige || !estLibre(m, 'qLmin')} aria-label="Débit en litres par minute" onChange={ev => regle('qLmin', Number(ev.target.value))} />
            <div style={{ fontSize: 13.5, color: C.doux }}>Q = {fr(a.Q * 1000, 2)} L/s = {fr(a.Q * 3600, 1)} m³/h</div>
            {verrou('qLmin', `${m.fixe?.qLmin} L/min`)}
          </section>
        </div>

        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <section style={{ ...carte, borderColor: a.reussi ? C.vert : C.bord, borderWidth: 2 }} aria-label="Voyants">
            <h2 style={titreCarte}>Voyants : tout doit être vert</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {actifs.includes('pression') && <Voyant ok={a.ok.pressionHaute && a.ok.pressionBasse} titre="Pression à la lance" valeur={`${fr(a.pLanceBar)} bar`} cible={`${fr(m.pMin)} à ${fr(m.pMax)} bar`} sens={a.ok.pressionHaute ? 'trop faible' : 'trop forte'} />}
              {actifs.includes('debit') && <Voyant ok={a.ok.debit} titre="Assez d'eau pour le feu" valeur={`${fr(pAbs, 2)} MW absorbés`} cible={`au moins ${fr(m.puissanceMW)} MW`} sens="pas assez de débit" />}
              {actifs.includes('portee') && <Voyant ok={a.ok.portee} titre="Le jet atteint le foyer" valeur={`le jet porte ${fr(a.porteeMax, 0)} m`} cible={`foyer à ${fr(Math.max(0, a.dx), 0)} m`} sens={a.dx > a.porteeMax ? 'trop loin ou jet trop faible' : 'jet trop faible'} />}
              {actifs.includes('secu') && <Voyant ok={a.ok.securite} titre="Distance de sécurité" valeur={`lance à ${fr(Math.max(0, a.dx), 0)} m du foyer`} cible={`au moins ${DIST_SECU} m`} sens="trop près des flammes" />}
            </ul>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="pp-grand" disabled={!a.reussi || fige} onClick={() => setEtat('ok')}>{a.reussi ? "🚒 Lancer l'attaque !" : 'Mets tous les voyants au vert'}</button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {!aide ? <button type="button" className="pp-btn" disabled={fige} onClick={() => setAide(true)}>💡 Besoin d'aide ? <span style={{ fontWeight: 500, fontSize: 12.5 }}>(−1 étoile)</span></button> : null}
              <button type="button" className="pp-btn" onClick={() => setCalculs(c => !c)} aria-expanded={calculs}>🧮 {calculs ? 'Masquer' : 'Voir'} les calculs</button>
            </div>
            {aide && <p className="pp-pop" style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.55, background: '#fff7e0', border: `1px dashed ${C.ambre}`, borderRadius: 12, padding: '8px 12px' }}>💡 {m.astuce}</p>}
          </section>

          <section style={{ ...carte, padding: '8px 6px' }} aria-label="Manomètre à la lance"><Manometre valeur={a.pLanceBar} pMin={m.pMin} pMax={m.pMax} titre="Manomètre à la lance (zone verte = bonne pression)" /></section>
        </div>
      </div>

      <section style={{ ...carte, marginTop: 12 }} aria-label="Bilan des pressions">
        <h2 style={titreCarte}>Où passe la pression de la pompe ({fr(m.pPompe, 0)} bar) ?</h2>
        <BarreBilan a={a} m={m} />
        <div style={{ fontSize: 13.5, color: C.doux, marginTop: 8, lineHeight: 1.6 }}>
          Jet : vitesse <b style={{ color: C.texte }}>{fr(a.vJet, 0)} m/s</b>, ouverture de la lance <b style={{ color: C.texte }}>{fr(a.dJet, 0)} mm</b>. Écoulement <b style={{ color: C.texte }}>{a.regime}</b> (Re = {fr(a.Re, 0)}).
        </div>
      </section>

      {calculs && (
        <section className="pp-pop" style={{ ...carte, marginTop: 10, fontSize: 14.5, lineHeight: 1.75 }} aria-label="Calculs">
          <b>Les calculs du jeu, pas à pas (tu peux les refaire avec la calculatrice) :</b><br />
          Q = {reg.qLmin} L/min = {fr(a.Q, 5)} m³·s⁻¹ ; S = π·D²/4 = {fr(a.S, 5)} m² ; <b>v = Q/S = {fr(a.v, 2)} m·s⁻¹</b><br />
          Re = ρ·v·D/μ = {fr(a.Re, 0)} → {a.regime} : λ = {a.regime === 'laminaire' ? '64/Re' : '0,316·Re^−0,25'} = {fr(a.lambda, 4)}<br />
          ΔP<sub>tuyau</sub> = λ·(L/D)·½ρv² = {fr(a.lambda, 4)} × ({a.L}/{fr(a.D, 3)}) × {fr(a.qdyn, 0)} = <b>{fr(a.dpLin / 1000, 1)} kPa</b><br />
          {m.coudes > 0 && <>ΔP<sub>coudes</sub> = {m.coudes} × 0,9 × ½ρv² = <b>{fr(a.dpSing / 1000, 1)} kPa</b><br /></>}
          {m.zLance > 0 && <>ρ·g·z = 1000 × 9,81 × {m.zLance} = <b>{fr(a.dpGrav / 1000, 1)} kPa</b><br /></>}
          <b>P<sub>lance</sub> = P<sub>pompe</sub> − ΔP<sub>charge</sub>{m.zLance > 0 && <> − ρ·g·z</>} = {fr(a.pLance / 1000, 1)} kPa = {fr(a.pLanceBar, 2)} bar</b><br />
          Jet : ½ρv<sub>j</sub>² = P<sub>lance</sub> + ½ρv² → v<sub>j</sub> = {fr(a.vJet, 1)} m·s⁻¹. Seule la fraction {fr(FACTEUR_AIR * 100, 0)} % de cette énergie sert à atteindre le foyer (air, gouttelettes).<br />
          Eau : chaque litre absorbe {fr(eu / 1e6, 2)} MJ utiles (= {ABSORPTION * 100} % de c·Δθ + L<sub>v</sub>) → débit minimal = {fr(m.puissanceMW, 1)} MW ÷ {fr(eu / 1e6, 2)} MJ·L⁻¹ ≈ <b>{debitMini(m.puissanceMW)} L/min</b>.
        </section>)}

      {etat === 'ok' && (
        <section className="pp-pop" role="status" style={{ ...carte, marginTop: 10, borderColor: C.vert, background: '#f0fdf4' }}>
          <div style={{ font: `800 22px ${TITRE}`, color: '#14532d' }}>✅ Feu maîtrisé !{rep != null && <span style={{ color: C.ambreTxt }}> {'★'.repeat(et)}{'☆'.repeat(3 - et)}</span>}</div>
          <p style={{ margin: '8px 0', fontSize: 15, lineHeight: 1.6 }}>
            Bilan : <b>{fr(m.pPompe, 0)} bar</b> à la pompe − <b>{fr(bar(a.dpLin + a.dpSing))} bar</b> de pertes de charge{m.zLance > 0 && <> − <b>{fr(bar(a.dpGrav))} bar</b> de hauteur</>} = <b>{fr(a.pLanceBar)} bar</b> à la lance, avec un jet à <b>{fr(a.vJet, 0)} m/s</b>.
          </p>
          <div style={{ background: '#fff', border: `1.5px solid ${C.bleu}`, borderRadius: 14, padding: '10px 14px' }}>
            <div style={{ font: `800 16px ${TITRE}`, color: C.bleu }}>🧑‍🚒 La question du capitaine {rep == null && <span style={{ fontWeight: 600, fontSize: 13, color: C.doux }}>(juste du premier coup : +1 étoile)</span>}</div>
            <p style={{ margin: '6px 0', fontSize: 15.5 }}>{m.qcm.q}</p>
            <div style={{ display: 'grid', gap: 6 }}>
              {m.qcm.options.map((o, i) => {
                const choisi = rep === i, bonne = rep != null && i === m.qcm.bonne;
                return <button key={i} type="button" className="pp-btn" disabled={rep != null && !choisi && !bonne} onClick={() => repondre(i)}
                  style={{ textAlign: 'left', borderColor: bonne ? C.vert : choisi ? C.rouge : undefined, background: bonne ? '#dcfce7' : choisi ? '#fee2e2' : undefined }}>{bonne ? '✅ ' : choisi ? '❌ ' : ''}{o}</button>;
              })}
            </div>
            {rep != null && <p style={{ margin: '8px 0 0', fontSize: 14.5, lineHeight: 1.55 }}>{qcmJuste ? '👍 Bravo. ' : 'Pas tout à fait. '}{m.qcm.expl}</p>}
          </div>
          {rep != null && (
            <div className="pp-pop">
              <div style={{ background: '#eef5fc', borderRadius: 14, padding: '10px 14px', fontSize: 14.5, lineHeight: 1.65, marginTop: 10 }}>
                <b>À retenir</b><br />{m.retenir}<br />
                P<sub>pompe</sub> = P<sub>lance</sub> + ρ·g·z + ΔP<sub>charge</sub>, avec ΔP<sub>charge</sub> = (λ·L/D + n·K) × ½ρv².
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {!derniere && <button type="button" className="pp-grand" style={{ width: 'auto' }} onClick={onSuivant}>Niveau suivant ▶</button>}
                <button type="button" className="pp-btn" onClick={onMenu}>← Tous les niveaux</button>
              </div>
            </div>)}
        </section>)}
    </div>);
}

export function SimulationPompier({ naviguer }) {
  const [ecran, setEcran] = useState(null);      // null = menu ; sinon identifiant de niveau
  const [rec, setRec] = useState(lire);
  const chap = chapitresDuJeu(296)[0];
  const fini = (id, etoiles) => setRec(r => { const o = { ...r, [id]: Math.max(r[id] || 0, etoiles) }; ecrire(o); return o; });
  const m = ecran ? MISSIONS.find(x => x.id === ecran) : null;
  const prochain = (MISSIONS.find(x => !rec[x.id]) || {}).id;
  const carteNiveau = x => (
    <section key={x.id} aria-label={`Niveau ${x.id}`} style={{ ...carte, display: 'flex', flexDirection: 'column', gap: 6, borderColor: prochain === x.id ? C.ambre : C.bord, borderWidth: prochain === x.id ? 2 : 1 }}>
      <div style={{ font: `800 18px ${TITRE}`, color: C.bleu }}>{x.icone} Niveau {x.id} · {x.nom}</div>
      <div style={{ fontSize: 14, color: C.doux, lineHeight: 1.45, flex: 1 }}>{x.objectif}</div>
      <div style={{ fontSize: 13.5, color: C.ambreTxt, fontWeight: 700 }}>{rec[x.id] ? <>Meilleur résultat : {'★'.repeat(rec[x.id])}{'☆'.repeat(3 - rec[x.id])}</> : prochain === x.id ? '👉 Commence ici' : 'Pas encore tenté'}</div>
      <button type="button" className="pp-grand" style={{ width: 'auto' }} onClick={() => setEcran(x.id)}>{x.appren ? 'Apprendre ▶' : 'Intervenir ▶'}</button>
    </section>);
  return (
    <div style={{ maxWidth: 940, margin: '0 auto', color: C.texte, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'left' }}>
      <style>{STYLE}</style>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <h1 style={{ margin: 0, font: `800 28px ${TITRE}`, color: C.bleu }}>🚒 Pompiers</h1>
        <span style={{ color: C.doux, fontSize: 14.5 }}>De la lance à la pression</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chap && naviguer && <button type="button" className="pp-btn" onClick={() => allerChapitre(naviguer, chap.id)}>📚 Chapitre et exercices</button>}
          {m && <button type="button" className="pp-btn" onClick={() => setEcran(null)}>← Niveaux</button>}
        </span>
      </header>
      {!m && (
        <div>
          <div style={{ ...carte, marginBottom: 12, fontSize: 15.5, lineHeight: 1.65 }}>
            <b>Le but du jeu.</b> Le camion envoie l'eau avec une <b>pression fixe</b>. Mais en chemin, le tuyau « mange » de la pression (frottements, virages, hauteur). Toi, tu règles le <b>diamètre</b>, la <b>longueur</b> et le <b>débit</b> pour qu'au bout de la lance :
            <ul style={{ margin: '6px 0 6px', paddingLeft: 22 }}>
              <li>la <b>pression</b> soit dans la zone verte du manomètre ;</li>
              <li>il y ait <b>assez d'eau</b> pour absorber la puissance du feu ;</li>
              <li>le <b>jet atteigne le foyer</b>, sans que tu sois trop près des flammes.</li>
            </ul>
            Des <b>voyants</b> passent au vert quand c'est bon. Les 3 premiers niveaux t'apprennent <b>une idée à la fois</b> ; la calculatrice (🧮 en bas de l'écran) est disponible.
          </div>
          <h2 style={{ font: `800 17px ${TITRE}`, color: C.bleu, margin: '4px 0 8px' }}>🎓 Pour apprendre : un seul réglage à la fois</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: 12 }}>{MISSIONS.filter(x => x.appren).map(carteNiveau)}</div>
          <h2 style={{ font: `800 17px ${TITRE}`, color: C.bleu, margin: '16px 0 8px' }}>🚒 Les interventions : tous les réglages</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: 12 }}>{MISSIONS.filter(x => !x.appren).map(carteNiveau)}</div>
          <details style={{ ...carte, marginTop: 12, padding: '8px 16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses du modèle</summary>
            <ul style={{ margin: '6px 0 2px', paddingLeft: 20, fontSize: 14, color: C.doux, lineHeight: 1.55 }}>
              <li>Eau incompressible (ρ = 1 000 kg·m⁻³, μ = 1,0 × 10⁻³ Pa·s), écoulement permanent : on applique le théorème de Bernoulli avec pertes de charge, comme en cours.</li>
              <li>Pertes linéiques ΔP = λ·(L/D)·½ρv², avec λ = 64/Re (laminaire) ou 0,316·Re<sup>−0,25</sup> (Blasius, turbulent) ; chaque coude à 90° a un coefficient K = 0,9. Les raccords entre tuyaux sont négligés.</li>
              <li>Pression de la pompe <b>fixée</b> à chaque niveau (en vrai, le pompier règle aussi le régime de la pompe). Le tuyau est supposé posé à plat et droit, hors coudes.</li>
              <li>Lance à section réglable : le jet part à la vitesse donnée par ½ρv<sub>j</sub>² = P<sub>lance</sub> + ½ρv². Hypothèse de jeu : seul 25 % de l'énergie du jet sert à atteindre le foyer (frottement de l'air, gouttelettes), à l'angle de tir optimal.</li>
              <li>Feu : chaque litre d'eau porté de 20 à 100 °C puis vaporisé absorbe c·Δθ + L<sub>v</sub> ≈ 2,6 MJ, mais seul un quart refroidit réellement le foyer. Les puissances de feu sont des ordres de grandeur du jeu, pas des mesures.</li>
              <li>Scénario fictif et simplifié : une vraie intervention suit des procédures strictes, avec un matériel bien plus complexe.</li>
            </ul>
          </details>
        </div>)}
      {m && <Mission key={m.id} m={m} onFin={fini} onMenu={() => setEcran(null)} onSuivant={() => setEcran(m.id + 1)} derniere={m.id === MISSIONS.length} />}
    </div>);
}
