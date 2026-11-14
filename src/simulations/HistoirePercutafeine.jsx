import SchemaFiolesClhp from './SchemaFiolesClhp';
import SchemasChromato from './SchemasChromato';
import { SchemaBurette } from './titrageCommun';
import { couleurIndicateur } from './acidesBasesModele.js';
import FichesPercutafeine from './FichesPercutafeine';
import { useState, useEffect, useRef } from "react";
import { useEtatPersistant, Formule } from "../commun";
import { Avatar as AvatarVisuel, STYLE_VISUELS } from './LaboVisuels';
import {
  CLE_ETAT, CLE_FINS, FINS, PNJ, SCENES, T_FIN, T_MIDI, T_PAUSE, NB_AVATARS, avatarDe, pn, CHAMPS_FORMULE, FORMULE_REPLI, etatInitial, texteDe, choixDe, visuelsDe, choisir, valider, estFin, peutRevenir, revenirHub,
  horloge, duree, nf, statutBg, resume, bilan, validerFormule, cliquerPiece, ajouterBase, ajouterPrevu, validerPh, observationsDe, resultatsVus, demanderAide, niveauAide, textesAide, noterObs, pointsRheo, ajusteRheo, MODELES_RHEO, validerRheo, ficheCorrection, cpgModele, CPG_LIM, cpgSimFin, chronologie, consequences, fiche, validerPlan, nombre, donneesTitr, GRANDEUR_TITR, phReel, docsDe,
} from "./percutafeineJeu";

// ====================================================
//  SIM 113 : CONTRE-TYPAGE DE LA PERCUTAFÉINE (BTS Métiers de la Chimie), histoire à choix d'après le TP / CCF4. Hors menu : ?sim=113.
//  Toute la logique est dans percutafeineJeu.js ; ce composant assemble l'affichage (scènes, stations, instruments dessinés).
// ====================================================
const C = { encre: '#1b2733', doux: '#5b6877', bord: '#dbe4ee', accent: '#0f766e', accentFond: '#e7f5f2', ambre: '#b45309', rouge: '#b91c1c', vert: '#15803d', bleu: '#1e3a8a', carte: '#ffffff', fond: '#f4f8fb' };
const NIVEAUX = { ok: ['✅', C.vert, 'Maîtrisé'], moyen: ['🟡', C.ambre, 'À consolider'], ko: ['❌', C.rouge, 'À retravailler'], nd: ['⚪', C.doux, 'Non évalué'] };
const TONS = { ok: C.vert, moyen: C.ambre, ko: C.rouge };
const ICONES = { es_balance: '⚖️', cpg_m: '⚖️', titr_carb_plan: '🧪', leurre_titrgel: '🧪', leurre_ir: '📈', leurre_refracto: '🔍', leurre_polar: '🔍', leurre_conduc: '🔌', choix_caf: '🧪', choix_eth: '🧪', docs: '📄', obs_video: '🎞️', es_prep: '🔥', es_calc1: '📊', eth1: '⚖️', formule: '📝', eq_base: '⚗️', fab_choix: '⚗️', fab_disp: '🧴', rheoC: '🌀', rheoF: '🌀', hplc_m: '📈', cpg_ei: '🔬', cpg_inj: '🔬', uv_ajouts_plan: '🌈', uv_ext_plan: '🌈', hplc_gamme_plan: '📈', hplc_ei: '📈', verdict: '✅', eq_ines: '✅' };
const FOND_LIEU = { 'Paillasse de formulation': '#ecf7ee', 'Salle de chromatographie': '#e8f1fa', 'Bureau': '#f3eefb', 'Bureau de Mme Dubreuil': '#f3eefb', 'Salle de rhéologie': '#fdf1e7', 'Salle des étuves': '#fdf1e7' };
const STYLE = `${STYLE_VISUELS}
@media print{body *{visibility:hidden!important}[data-impression],[data-impression] *{visibility:visible!important}[data-impression]{position:absolute;left:0;top:0;width:100%;padding:0 8mm;box-sizing:border-box;background:#fff}.pc-noprint{display:none!important}}
@keyframes pc-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pc-scene{animation:pc-in .35s ease-out}
.pc-choix{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;padding:12px 14px;margin:9px 0;border:1.5px solid #fdba74;border-radius:14px;background:#fff7ed;color:${C.encre};font:inherit;font-size:16px;line-height:1.45;cursor:pointer;transition:border-color .15s,background .15s,transform .15s,box-shadow .15s}
.pc-choix:hover,.pc-choix:focus-visible{border-color:${C.accent};background:${C.accentFond};outline:none;transform:translateY(-1px);box-shadow:0 4px 12px rgba(15,118,110,.12)}
.pc-badge{flex:none;width:26px;height:26px;border-radius:50%;background:#f97316;border:1.5px solid #ea580c;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
.pc-choix:hover .pc-badge,.pc-choix:focus-visible .pc-badge{background:${C.accent};border-color:${C.accent};color:#fff}
.pc-tache{display:flex;gap:12px;align-items:flex-start;text-align:left;padding:13px 14px;border:1.5px solid ${C.bord};border-radius:14px;background:#fff;color:${C.encre};font:inherit;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.pc-tache:hover,.pc-tache:focus-visible{border-color:${C.accent};outline:none;transform:translateY(-1px);box-shadow:0 6px 16px rgba(15,118,110,.14)}
.pc-btn{padding:10px 20px;border-radius:12px;border:none;background:${C.bleu};color:#fff;font:inherit;font-weight:700;cursor:pointer;transition:filter .15s}
.pc-btn:hover:not(:disabled){filter:brightness(1.12)}
.pc-btn:disabled{background:#94a3b8;cursor:default}
.pc-btn2{padding:7px 13px;border-radius:10px;border:1.5px solid ${C.bleu};background:#fff;color:${C.bleu};font:inherit;font-weight:600;cursor:pointer}
.pc-btn2:hover{background:#eef2ff}
.pc-bulle{position:relative;background:#fff;border:1.5px solid ${C.bord};border-radius:4px 16px 16px 16px;padding:11px 15px;margin:8px 0;line-height:1.6}
.pc-inst{border-radius:14px;padding:14px 16px;margin-top:14px}
.pc-grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px}
@keyframes pc-trace{to{stroke-dashoffset:0}}
@keyframes pc-lueur{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes pc-bulle{0%{transform:translateY(0);opacity:0}20%{opacity:.9}100%{transform:translateY(-22px);opacity:0}}
@media (prefers-reduced-motion:no-preference){.pc-trace{stroke-dasharray:1;stroke-dashoffset:1;animation:pc-trace 2.4s ease-out forwards}.pc-lueur{animation:pc-lueur 1.6s ease-in-out infinite}.pc-bull{animation:pc-bulle 2.2s ease-in infinite}}
.pc-poste{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px 8px;border:2px solid transparent;border-radius:14px;background:transparent;cursor:pointer;font:inherit;color:inherit;position:relative}
.pc-poste:hover,.pc-poste:focus-visible{background:rgba(255,255,255,.55);outline:none}
.pc-poste[aria-pressed="true"]{background:#fff;border-color:${C.accent};box-shadow:0 4px 14px rgba(15,118,110,.2)}
@media (prefers-reduced-motion:reduce){.pc-scene{animation:none}.pc-choix,.pc-tache{transition:none}}
`;

// ───────────── Relations de l'énoncé, en notation mathématique ─────────────
const sub = (a, b) => <msub><mi>{a}</mi><mi>{b}</mi></msub>;
const FORMULES = {
  es: <Formule><mi>ES</mi><mo>=</mo><mfrac><mrow>{sub('m', '2')}<mo>−</mo>{sub('m', '0')}</mrow>{sub('m', '1')}</mfrac><mo>×</mo><mn>100</mn></Formule>,
  hplcEI: <Formule>{sub('C', 'éch')}<mo>=</mo>{sub('C', 'réf')}<mo>×</mo><mfrac>{sub('A', 'benz,réf')}{sub('A', 'caf,réf')}</mfrac><mo>×</mo><mfrac>{sub('A', 'caf,éch')}{sub('A', 'benz,éch')}</mfrac></Formule>,
  ajouts: <Formule><mi>A</mi><mo>=</mo><mi>a</mi><mo>·</mo><mi>C</mi><mo>+</mo><mi>b</mi><mo>⇒</mo>{sub('C', 'x')}<mo>=</mo><mfrac><mi>b</mi><mi>a</mi></mfrac></Formule>,
  ext: <Formule><mi>C</mi><mo>=</mo><mfrac><mi>A</mi><mi>pente</mi></mfrac></Formule>,
  cpgEI: <Formule>{sub('V', 'éch')}<mo>=</mo>{sub('V', 'réf')}<mo>×</mo><mfrac>{sub('%A', 'EI,réf')}{sub('%A', 'EtOH,réf')}</mfrac><mo>×</mo><mfrac>{sub('%A', 'EtOH,éch')}{sub('%A', 'EI,éch')}</mfrac></Formule>,
  gamme: <Formule><mi>r</mi><mo>=</mo><mfrac>{sub('%A', 'EtOH')}{sub('%A', 'EI')}</mfrac><mo>=</mo><mi>a</mi><mo>·</mo><mi>V</mi><mo>+</mo><mi>b</mi></Formule>,
};

// ───────────── Instruments dessinés ─────────────
const Cadre = ({ titre, children }) => (
  <figure style={{ margin: '14px 0', background: '#0f2430', color: '#e2f0f5', borderRadius: 12, padding: '8px 10px 10px' }}>
    <figcaption style={{ fontSize: 12, letterSpacing: 1, color: '#9fc3d1', fontFamily: 'ui-monospace,monospace', marginBottom: 4 }}>{titre}</figcaption>{children}</figure>);

function Chroma({ v }) {
  const W = 360, H = 170, x0 = 28, x1 = 346, yb = 138, X = t => x0 + t / v.tmax * (x1 - x0), sg = v.tmax * 0.017;
  const N = 180, ys = Array.from({ length: N + 1 }, (_, i) => { const t = i / N * v.tmax; return [t, v.pics.reduce((s, p) => s + p.h * Math.exp(-((t - p.tr) ** 2) / (2 * sg * sg)), 0) + (v.bruit ? v.bruit * (((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 - 0.5) : 0)]; });
  const d = ys.map(([t, y], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${(yb - Math.min(y, 1.15) * 105).toFixed(1)}`).join('');
  return (<Cadre titre={v.titre.toUpperCase()}>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${v.titre} : ${v.pics.map(p => `${p.l || 'pic'} à ${p.tr} min`).join(', ')}`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
      <line x1={x0} y1={yb} x2={x1} y2={yb} stroke="#6b8794" /><path d={d} className="pc-trace" pathLength="1" fill="none" stroke="#5eead4" strokeWidth="2" />
      {Array.from({ length: Math.floor(v.tmax) + 1 }, (_, i) => <g key={i}><line x1={X(i)} y1={yb} x2={X(i)} y2={yb + 4} stroke="#6b8794" /><text x={X(i)} y={yb + 16} textAnchor="middle" fontSize="10" fill="#9fc3d1">{i}</text></g>)}
      <text x={x1} y={yb + 30} textAnchor="end" fontSize="10" fill="#9fc3d1">temps (min)</text>
      {v.pics.filter(p => p.l).map((p, i) => <text key={i} x={X(p.tr)} y={yb - Math.min(p.h, 1.15) * 105 - 6} textAnchor="middle" fontSize="11" fill="#fde68a">{p.l}</text>)}
    </svg></Cadre>);
}

// Graduations « rondes » (1, 2, 5 × 10^k) pour l'échelle linéaire
const gradsLin = (max, n = 4) => { const brut = max / n, p = Math.pow(10, Math.floor(Math.log10(brut))), f = brut / p, pas = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p, L = []; for (let x = pas; x <= max * 1.001; x += pas) L.push(Math.round(x / p * 1e6) / 1e6 * p); return L; };
function Rheo({ v }) {
  const [log, setLog] = useState(true);
  const W = 360, Hh = 150, x0 = 38, x1 = 346;
  const toutes = v.courbes.flatMap(c => c.pts), gMax = Math.max(...toutes.map(p => p.g));
  const etaMax = Math.max(...toutes.map(p => p.eta)), sMax = Math.max(...toutes.map(p => p.s)), sMin = Math.min(...toutes.map(p => p.s));
  const lx = g => log ? x0 + (Math.log10(g) + 1) / 3 * (x1 - x0) : x0 + g / gMax * (x1 - x0);
  const ly = e => log ? 128 - (Math.log10(e) - Math.log10(0.5)) / (Math.log10(etaMax * 1.2) - Math.log10(0.5)) * 110 : 128 - e / (etaMax * 1.1) * 110;
  const sy = s => log ? 128 - (Math.log10(s) - Math.log10(sMin / 1.5)) / (Math.log10(sMax * 1.2) - Math.log10(sMin / 1.5)) * 110 : 128 - s / (sMax * 1.1) * 110;
  const tr = (c, f) => c.pts.map((p, i) => `${i ? 'L' : 'M'}${lx(p.g).toFixed(1)} ${f(p).toFixed(1)}`).join('');
  const gTicks = log ? [0.1, 1, 10, 100] : gradsLin(gMax, 4), eTicks = log ? [1, 10, 100] : gradsLin(etaMax * 1.1, 3), sTicks = log ? [1, 10, 100].filter(s => s >= sMin / 1.5 && s <= sMax * 1.2) : gradsLin(sMax * 1.1, 3);
  const axes = <><line x1={x0} y1="128" x2={x1} y2="128" stroke="#6b8794" /><line x1={x0} y1="12" x2={x0} y2="128" stroke="#6b8794" />
    {gTicks.map(g => <text key={g} x={lx(g)} y="142" textAnchor="middle" fontSize="10" fill="#9fc3d1">{nf(g, g < 1 ? 1 : 0)}</text>)}</>;
  const ech = log ? 'échelle log' : 'échelle linéaire';
  return (<Cadre titre="RHÉOMÈTRE · COURBES D'ÉCOULEMENT">
    <svg viewBox={`0 0 ${W} ${2 * Hh + 20}`} role="img" aria-label={`Viscosité et contrainte en fonction du gradient de vitesse (${ech}) pour : ${v.courbes.map(c => c.nom).join(', ')}`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
      <g>{axes}<text x="4" y="14" fontSize="10" fill="#9fc3d1">η (Pa·s, {ech})</text>
        {eTicks.map(e => <text key={e} x={x0 - 4} y={ly(e) + 3} textAnchor="end" fontSize="9" fill="#9fc3d1">{nf(e, e < 1 ? 1 : 0)}</text>)}
        {v.courbes.map(c => { const col = c.couleur === '#1e3a8a' ? '#93c5fd' : '#fcd34d'; return c.points ? <g key={c.nom}>{c.pts.map((p, i) => <circle key={i} cx={lx(p.g)} cy={ly(p.eta)} r="3" fill={col} />)}</g> : <path key={c.nom} d={tr(c, p => ly(p.eta))} fill="none" stroke={col} strokeWidth="2.2" />; })}</g>
      <g transform={`translate(0 ${Hh + 6})`}>{axes}<text x="4" y="14" fontSize="10" fill="#9fc3d1">σ (Pa, {ech})</text>
        {sTicks.map(s => <text key={s} x={x0 - 4} y={sy(s) + 3} textAnchor="end" fontSize="9" fill="#9fc3d1">{nf(s, s < 1 ? 1 : 0)}</text>)}
        {v.courbes.map(c => { const col = c.couleur === '#1e3a8a' ? '#93c5fd' : '#fcd34d'; return c.points ? <g key={c.nom}>{c.pts.map((p, i) => <circle key={i} cx={lx(p.g)} cy={sy(p.s)} r="3" fill={col} />)}</g> : <path key={c.nom} d={tr(c, p => sy(p.s))} fill="none" stroke={col} strokeWidth="2.2" />; })}
        <text x={x1} y="156" textAnchor="end" fontSize="10" fill="#9fc3d1">γ̇ (s⁻¹, {ech})</text></g>
    </svg>
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>{v.courbes.map(c => <span key={c.nom}><span style={{ color: c.couleur === '#1e3a8a' ? '#93c5fd' : '#fcd34d' }}>━</span> {c.nom}</span>)}
      <button type="button" data-echelle aria-pressed={!log} onClick={() => setLog(!log)} style={{ font: 'inherit', fontSize: 13, marginLeft: 'auto', padding: '4px 12px', borderRadius: 99, border: '1.5px solid #9fc3d1', background: 'transparent', color: '#e2f1f6', cursor: 'pointer' }}>{log ? 'Passer en échelle linéaire' : 'Passer en échelle logarithmique'}</button></div>
  </Cadre>);
}

function Droite({ v }) {
  const W = 360, x0 = 40, x1 = 346, xs = v.pts.map(p => p[0]), ys = v.pts.map(p => p[1]), xmax = Math.max(...xs, v.ech ? v.ech[0] : 0) * 1.05, ymax = Math.max(...ys, v.ech ? v.ech[1] : 0) * 1.1;
  const X = x => x0 + x / xmax * (x1 - x0), Y = y => 124 - y / ymax * 104, rmax = Math.max(0.0001, ...v.residus.map(Math.abs));
  return (<Cadre titre={v.titre.toUpperCase()}>
    <svg viewBox={`0 0 ${W} 214`} role="img" aria-label={`${v.titre} : ${v.pts.length} points, droite a = ${v.a}, b = ${v.b}, et graphique des résidus`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
      <line x1={x0} y1="124" x2={x1} y2="124" stroke="#6b8794" /><line x1={x0} y1="12" x2={x0} y2="124" stroke="#6b8794" />
      <line x1={X(0)} y1={Y(v.b)} x2={X(xmax)} y2={Y(v.a * xmax + v.b)} stroke="#5eead4" strokeWidth="1.6" />
      {v.ech && <g><line x1={X(v.ech[0])} y1={Y(v.ech[1])} x2={X(v.ech[0])} y2="124" stroke="#fb923c" strokeDasharray="3 3" /><line x1={x0} y1={Y(v.ech[1])} x2={X(v.ech[0])} y2={Y(v.ech[1])} stroke="#fb923c" strokeDasharray="3 3" /><rect x={X(v.ech[0]) - 4} y={Y(v.ech[1]) - 4} width="8" height="8" fill="#fb923c" transform={`rotate(45 ${X(v.ech[0])} ${Y(v.ech[1])})`} /><text x={X(v.ech[0]) + 8} y={Y(v.ech[1]) - 6} fontSize="10" fill="#fdba74">gel</text></g>}
      {v.pts.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="3.6" fill="#fde68a" />)}
      <text x={x1} y="138" textAnchor="end" fontSize="10" fill="#9fc3d1">{v.xl}</text><text x="4" y="14" fontSize="10" fill="#9fc3d1">{v.yl}</text>
      <text x={x0} y="156" fontSize="10" fill="#9fc3d1">Résidus (mesure − droite)</text>
      <line x1={x0} y1="186" x2={x1} y2="186" stroke="#6b8794" strokeDasharray="3 3" />
      {v.residus.map((r, i) => <circle key={i} cx={X(v.pts[i][0])} cy={186 - r / rmax * 22} r="3.2" fill={Math.abs(r) / rmax > 0.9 ? '#f87171' : '#93c5fd'} />)}
    </svg></Cadre>);
}

function CourbeTitrage({ v }) {
  const W = 360, x0 = 40, x1 = 346, vmax = v.vmax || Math.max(...v.pts.map(p => p[0])) || 1, avecDer = v.der && v.der.length > 0, dmax = Math.max(0.1, ...(v.der || []).map(d => d[1]));
  const ys = v.pts.map(p => p[1]), yr = v.yr || [Math.min(...ys, 0), Math.max(...ys) * 1.1 || 1], [y0, y1] = yr, yl = v.y || 'pH';
  const X = x => x0 + x / vmax * (x1 - x0), Y = y => 124 - (y - y0) / (y1 - y0) * 112, Yd = y => 196 - Math.max(0, y) / dmax * 40;
  const pas = (y1 - y0) / 4, graduations = yl === 'pH' ? [4, 6, 8, 10, 12] : [0, 1, 2, 3, 4].map(k => y0 + k * pas);
  const fmtG = g => Math.abs(g) >= 10 ? String(Math.round(g)) : String(Math.round(g * 100) / 100).replace('.', ',');
  return (<Cadre titre={v.titre.toUpperCase()}>
    <svg viewBox={`0 0 ${W} ${avecDer ? 214 : 154}`} role="img" aria-label={`${v.titre} : ${v.pts.length} points${v.veq ? `, équivalence vers ${v.veq} mL` : ''}`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
      <line x1={x0} y1="124" x2={x1} y2="124" stroke="#6b8794" /><line x1={x0} y1="12" x2={x0} y2="124" stroke="#6b8794" />
      {graduations.map(h => <g key={h}><line x1={x0 - 3} y1={Y(h)} x2={x0} y2={Y(h)} stroke="#6b8794" /><text x={x0 - 6} y={Y(h) + 3} fontSize="9" textAnchor="end" fill="#9fc3d1">{fmtG(h)}</text></g>)}
      {v.droites && v.droites.map((r, i) => { const xa = i ? v.veq : 0, xb = i ? vmax : v.veq; return xa != null && xb != null ? <line key={i} x1={X(xa)} y1={Y(r.a + r.b * xa)} x2={X(xb)} y2={Y(r.a + r.b * xb)} stroke="#fb923c" strokeWidth="1.2" strokeDasharray="4 3" /> : null; })}
      {v.pts.length > 1 && <polyline points={v.pts.map(p => `${X(p[0])},${Y(p[1])}`).join(' ')} fill="none" stroke="#5eead4" strokeWidth="1.4" />}
      {v.pts.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="2.6" fill="#fde68a" />)}
      {Array.from({ length: Math.floor(vmax / (vmax > 12 ? 2 : 1)) + 1 }, (_, q) => q * (vmax > 12 ? 2 : 1)).filter(q => q <= vmax).map(q => <g key={q}><line x1={X(q)} y1="124" x2={X(q)} y2="127" stroke="#6b8794" /><text x={X(q)} y="136" fontSize="8.5" textAnchor="middle" fill="#9fc3d1">{q}</text></g>)}
      <text x={x1} y="147" textAnchor="end" fontSize="10" fill="#9fc3d1">V soude (mL)</text><text x="4" y="8" fontSize="10" fill="#9fc3d1">{yl}</text>
      {avecDer && <g><text x={x0} y="164" fontSize="10" fill="#9fc3d1">Dérivée dpH/dV</text><line x1={x0} y1="196" x2={x1} y2="196" stroke="#6b8794" />
        {v.der.map((d, i) => <circle key={i} cx={X(d[0])} cy={Yd(d[1])} r="2.6" fill={v.veq != null && d[0] === v.veq ? '#fb923c' : '#93c5fd'} />)}</g>}
    </svg></Cadre>);
}

function Tableau({ v }) {
  return (<div style={{ margin: '12px 0', overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }}>
    <caption style={{ textAlign: 'left', fontWeight: 700, paddingBottom: 4 }}>{v.titre}</caption>
    <thead><tr>{v.cols.map((c, i) => <th key={i} style={{ border: `1px solid ${C.bord}`, padding: '4px 8px', background: C.fond, textAlign: i ? 'right' : 'left' }}>{c}</th>)}</tr></thead>
    <tbody>{v.lignes.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} style={{ border: `1px solid ${C.bord}`, padding: '4px 8px', textAlign: j ? 'right' : 'left' }}>{c}</td>)}</tr>)}</tbody></table></div>);
}
function BalanceVue({ v }) {
  return (<Cadre titre={v.nom.toUpperCase()}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 6 }}>
      {v.lectures.map(([nom, x]) => <div key={nom} style={{ background: '#0b1b22', borderRadius: 10, padding: '8px 12px', border: '1px solid #2a4654' }}>
        <div style={{ fontSize: 12, color: '#9fc3d1' }}>{nom}</div>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 24, color: '#7ef0d4', letterSpacing: 1 }}>{nf(x, v.dec)} <span style={{ fontSize: 14, color: '#9fc3d1' }}>g</span></div></div>)}
    </div></Cadre>);
}
// Illustration générique d'un tube de gel (pas la reproduction de l'emballage commercial).
const TubeGel = () => (<figure style={{ margin: '12px 0', textAlign: 'center' }}>
  <svg viewBox="0 0 220 130" width="100%" style={{ maxWidth: 300 }} role="img" aria-label="Illustration d'un tube de gel à la caféine">
    <path d="M30 30 L170 22 Q196 20 196 40 L196 90 Q196 110 170 108 L30 100 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
    <rect x="12" y="38" width="22" height="54" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
    <path d="M6 44 L12 44 L12 86 L6 86 Z" fill="#94a3b8" />
    <rect x="58" y="34" width="120" height="68" rx="8" fill="#fff7ed" stroke="#fdba74" />
    <text x="118" y="62" textAnchor="middle" fontSize="15" fontWeight="700" fill="#9a3412">Gel à la caféine</text>
    <text x="118" y="82" textAnchor="middle" fontSize="12" fill="#9a3412">usage cutané</text>
  </svg>
  <figcaption style={{ fontSize: 13.5, color: C.doux }}>Le gel commercial à contre-typer (illustration).</figcaption></figure>);
const Visuel = ({ v }) => v.type === 'balance' ? <BalanceVue v={v} /> : v.type === 'chroma' ? <Chroma v={v} /> : v.type === 'rheo' ? <Rheo v={v} /> : v.type === 'droite' ? <Droite v={v} /> : v.type === 'titrage' ? <CourbeTitrage v={v} /> : v.type === 'tableau' ? <Tableau v={v} /> : v.type === 'fioles' ? <SchemaFiolesClhp /> : v.type === 'tube' ? <TubeGel /> : null;


// ───────────── Briques d'interaction ─────────────
const inst = { background: '#fffaf0', border: '1.5px solid #ecd9a6' };
function Avatar({ pnj, taille = 40, e }) {
  return <span aria-hidden="true" style={{ flex: 'none', display: 'inline-flex' }}><AvatarVisuel id={pnj === 'moi' ? avatarDe(e) : pnj} taille={taille} /></span>;
}

function BlocAideCalcul({ e, sc, onEtat }) {
  const aide = niveauAide(e), conseils = textesAide(e), pnjAide = PNJ[sc.aide.pnj];
  return (<div data-aide style={{ marginBottom: 12 }}>
    {conseils.map((c, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '8px 0' }}><Avatar pnj={sc.aide.pnj} e={e} taille={36} /><div style={{ flex: 1, background: '#fff', border: `1.5px solid ${C.bord}`, borderRadius: 12, padding: '8px 12px', fontSize: 15, lineHeight: 1.5 }}>{c}</div></div>)}
    {aide < 3 && <button type="button" data-aide-btn onClick={() => onEtat(demanderAide(e))} style={{ font: 'inherit', fontSize: 14.5, padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${C.accent}`, background: '#fff', color: C.accent, cursor: 'pointer' }}>{aide === 0 ? `💬 Demander conseil à ${pnjAide.nom}` : aide === 1 ? `💬 Demander plus de précisions à ${pnjAide.nom}` : `💬 Demander à ${pnjAide.nom} comment poser le calcul`}</button>}
  </div>);
}
function Calcul({ e, sc, onEtat }) {
  const [saisie, setSaisie] = useState(''), [message, setMessage] = useState('');
  const soumettre = ev => { ev.preventDefault(); const r = valider(e, saisie); onEtat(r.etat); if (!r.juste) setMessage(r.message || ''); };
  return (
    <form onSubmit={soumettre} data-calcul className="pc-inst" style={inst}>
      {sc.aide && <BlocAideCalcul e={e} sc={sc} onEtat={onEtat} />}
      <div style={{ fontWeight: 700, marginBottom: 10 }}>🧮 {sc.calcul.q}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={saisie} onChange={ev => setSaisie(ev.target.value)} inputMode="decimal" autoComplete="off" aria-label="Ta réponse" placeholder="?" style={{ width: 130, fontSize: 18, padding: '7px 11px', border: `1.5px solid ${C.bleu}`, borderRadius: 10, fontFamily: 'inherit', background: '#fff' }} />
        <span style={{ color: C.doux }}>{sc.calcul.unite}</span>
        <button type="submit" className="pc-btn" disabled={!saisie.trim()}>Vérifier</button>
      </div>
      {message && <div role="alert" style={{ marginTop: 10, color: C.ambre, fontSize: 14.5, lineHeight: 1.5 }}>Pas tout à fait. {message}<br /><span style={{ color: C.doux }}>(Chaque essai te coûte 5 minutes. Au deuxième, un collègue refait le calcul avec toi et on avance.)</span></div>}
    </form>);
}

function StationFormule({ e, onEtat }) {
  // Pré-remplissage d'après la fiche de formulation de l'élève : pour 200 g de gel, la masse en g est le pourcentage × 2
  const DE_FICHE = { caf: 'caf', carb: 'carb', coc: 'coc', eth96: 'eth', trol: 'trol', eau: 'eau' };
  const gDeFiche = k => { const v = lireTeneur((e.fichePct || {})[DE_FICHE[k]]); return v === null ? '' : String(Math.round(v * 2 * 100) / 100).replace('.', ','); };
  const [fm, setFm] = useState(() => Object.fromEntries(CHAMPS_FORMULE.map(([k]) => [k, gDeFiche(k)])));
  const prerempli = CHAMPS_FORMULE.some(([k]) => gDeFiche(k) !== '');
  const [lignes, setLignes] = useState([]);
  const verifier = ev => { ev.preventDefault(); const r = validerFormule(e, fm); setLignes(r.lignes); onEtat(r.etat); };
  const sc = SCENES[e.scene], aide = niveauAide(e), conseils = textesAide(e), pnjAide = PNJ[sc.aide.pnj];
  const demander = () => { const n = demanderAide(e); if (niveauAide(n) === 3) setFm(Object.fromEntries(CHAMPS_FORMULE.map(([k]) => [k, String(sc.aide.valeurs()[k]).replace('.', ',')]))); onEtat(n); };
  const tot = CHAMPS_FORMULE.reduce((s, [k]) => s + (parseFloat(String(fm[k]).replace(',', '.')) || 0), 0);
  return (
    <form onSubmit={verifier} data-formule className="pc-inst" style={inst}>
      <div data-aide style={{ marginBottom: 10 }}>
        {conseils.map((c, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '8px 0' }}><Avatar pnj={sc.aide.pnj} e={e} taille={36} /><div style={{ flex: 1, background: '#fff', border: `1.5px solid ${C.bord}`, borderRadius: 12, padding: '8px 12px', fontSize: 15, lineHeight: 1.5 }}>{c}</div></div>)}
        {aide < 3 && <button type="button" data-aide-btn onClick={demander} style={{ font: 'inherit', fontSize: 14.5, padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${C.accent}`, background: '#fff', color: C.accent, cursor: 'pointer' }}>{aide === 0 ? `💬 Demander conseil à ${pnjAide.nom}` : aide === 1 ? `💬 Demander plus de précisions à ${pnjAide.nom}` : `💬 Demander à ${pnjAide.nom} ce qu'il ferait`}</button>}
      </div>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>📝 Masses à peser pour environ 200 g (en g)</div>
      {prerempli && <div data-prerempli style={{ fontSize: 14, color: C.doux, margin: '-4px 0 10px' }}>Les cases sont pré-remplies d'après ta fiche de formulation (masse en g = pourcentage × 2). Tu peux tout modifier.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 8 }}>
        {CHAMPS_FORMULE.map(([k, nom]) => <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 15, background: '#fff', border: `1px solid ${C.bord}`, borderRadius: 10, padding: '6px 10px' }}>{nom}
          <input value={fm[k]} onChange={ev => setFm({ ...fm, [k]: ev.target.value })} inputMode="decimal" autoComplete="off" aria-label={`${nom}, en grammes`} style={{ width: 84, fontSize: 16, padding: '5px 8px', border: `1.5px solid ${C.bleu}`, borderRadius: 8, textAlign: 'right' }} /></label>)}
      </div>
      <div style={{ margin: '10px 0', fontSize: 14.5, color: C.doux }}>Total : <b style={{ color: C.encre, fontSize: 17 }}>{nf(tot, 1)} g</b></div>
      <button type="submit" className="pc-btn" disabled={tot <= 0}>Valider ma formule</button>
      {lignes.length > 0 && <div data-controles role="status" style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.5, color: C.ambre }}>{lignes.map((l, i) => <div key={i}>{l.t}</div>)}</div>}
    </form>);
}

function StationPh({ e, onEtat }) {
  const add = g => onEtat(ajouterBase(e, g));
  const ph = e.f.phMes, reprise = e.scene === 'ph2';
  return (
    <div data-ph className="pc-inst" style={inst}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ background: '#0f2430', color: '#7ef0d4', borderRadius: 12, padding: '8px 16px', minWidth: 130 }}><div style={{ fontSize: 12, color: '#9fc3d1', letterSpacing: 1 }}>pH-MÈTRE</div><div style={{ fontSize: 32, fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>{ph == null ? '—' : nf(ph, 2)}</div></div>
        <div style={{ background: '#0f2430', color: '#fde68a', borderRadius: 12, padding: '8px 16px', minWidth: 150 }}><div style={{ fontSize: 12, color: '#9fc3d1', letterSpacing: 1 }}>TROLAMINE AJOUTÉE</div><div style={{ fontSize: 32, fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>{nf(e.f.trolAdd || 0, 2)} g</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {e.f.trolAdd == null && !reprise && <button type="button" className="pc-btn" data-prevu onClick={() => onEtat(ajouterPrevu(e))}>Verser les {nf(e.f.fm?.trol ?? 0, 2)} g prévus dans la formule (5 min)</button>}
        {(e.f.trolAdd != null || reprise) && <>
          {[0.1, 0.3].map(g => <button key={g} type="button" className="pc-btn2" onClick={() => add(g)}>Corriger : + {nf(g, 1)} g (2 min)</button>)}
          <button type="button" className="pc-btn" onClick={() => onEtat(validerPh(e).etat)}>{reprise ? 'Valider et remettre en pot (15 min)' : 'Valider et mettre en pot (10 min)'}</button></>}</div>
    </div>);
}


function StationPlan({ e, sc, onEtat }) {
  const P = sc.plan, prec = (e.f.plans || {})[e.scene] || {};
  const [vals, setVals] = useState(() => Object.fromEntries(P.champs.map(c => [c.id, prec[c.id] != null ? String(prec[c.id]).replace('.', ',') : ''])));
  const [msg, setMsg] = useState('');
  const aide = niveauAide(e), conseils = textesAide(e), pnjAide = sc.aide && PNJ[sc.aide.pnj];
  const demander = () => { const n = demanderAide(e); if (niveauAide(n) === 3 && sc.aide.valeurs) setVals(Object.fromEntries(P.champs.map(c => [c.id, String(sc.aide.valeurs(n)[c.id]).replace('.', ',')]))); setMsg(''); onEtat(n); };
  const num = Object.fromEntries(P.champs.map(c => [c.id, nombre(vals[c.id])]));
  const complet = P.champs.every(c => num[c.id] != null);
  let ap = null, dur = null;
  if (complet) { try { ap = P.apercu(num); dur = P.duree(num); } catch { ap = null; } }
  const valider = () => { const r = validerPlan(e, vals); if (!r.ok) setMsg(r.message); else { setMsg(''); onEtat(r.etat); } };
  return (
    <div data-plan className="pc-inst" style={inst}>
      {sc.aide && <div data-aide style={{ marginBottom: 12 }}>
        {conseils.map((c, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '8px 0' }}><Avatar pnj={sc.aide.pnj} e={e} taille={36} /><div style={{ flex: 1, background: '#fff', border: `1.5px solid ${C.bord}`, borderRadius: 12, padding: '8px 12px', fontSize: 15, lineHeight: 1.5 }}>{c}</div></div>)}
        {aide < 3 && <button type="button" data-aide-btn onClick={demander} style={{ font: 'inherit', fontSize: 14.5, padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${C.accent}`, background: '#fff', color: C.accent, cursor: 'pointer' }}>{aide === 0 ? `💬 Demander conseil à ${pnjAide.nom}` : aide === 1 ? `💬 Demander plus de précisions à ${pnjAide.nom}` : `💬 Demander à ${pnjAide.nom} ce qu'${sc.aide.pnj === 'ines' ? 'elle' : 'il'} ferait`}<span style={{ color: C.doux }}> ({aide === 2 ? 5 : 3} min)</span></button>}
      </div>}
      <div style={{ fontWeight: 700, marginBottom: 6 }}>🧪 Ma préparation</div>
      <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 14, color: C.doux, lineHeight: 1.5 }}>{P.infos.map((t, i) => <li key={i}>{t}</li>)}</ul>
      <div style={{ display: 'grid', gap: 10 }}>{P.champs.map(c => (
        <label key={c.id} style={{ display: 'grid', gap: 4, fontSize: 15 }}>
          <span>{c.l}{c.u ? ` (${c.u})` : ''}</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={vals[c.id]} data-champ={c.id} onChange={x => { setVals(v => ({ ...v, [c.id]: x.target.value })); setMsg(''); }} style={{ font: 'inherit', fontSize: 17, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.bord}`, background: '#fff', width: '100%', maxWidth: 220, boxSizing: 'border-box' }} />
        </label>))}
      </div>
      {ap && <div data-apercu style={{ marginTop: 12, overflowX: 'auto' }}><div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>📋 Récapitulatif de ta préparation <span style={{ fontWeight: 400, color: C.doux }}>(calculé à partir de tes valeurs)</span></div><table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%', maxWidth: 480 }}><thead><tr>{ap.cols.map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: `1.5px solid ${C.bord}` }}>{h}</th>)}</tr></thead><tbody>{ap.lignes.map((l, i) => <tr key={i}>{l.map((x, j) => <td key={j} style={{ padding: '3px 8px', borderBottom: `1px solid ${C.bord}` }}>{x}</td>)}</tr>)}</tbody></table></div>}
      {msg && <div role="alert" data-plan-msg style={{ marginTop: 10, background: '#fff1f0', border: '1px solid #f3b7b0', borderRadius: 10, padding: '8px 12px', fontSize: 14.5 }}>{msg}</div>}
      <button type="button" className="pc-btn" style={{ marginTop: 12 }} disabled={!complet} onClick={valider}>Préparer et mesurer{dur ? ` (${dur} min)` : ''}</button>
    </div>);
}

function StationSchema({ e, sc, onEtat }) {
  const [msg, setMsg] = useState(''), [der, setDer] = useState(null), [ind, setInd] = useState(null);
  const clic = id => { const r = cliquerPiece(e, id); if (r.ok) { setMsg(''); onEtat(r.etat); } else { setMsg(r.message); setDer(id); setInd(r.indice); onEtat(r.etat); } };
  return (<div data-schema className="pc-inst" style={inst}>
    <SchemasChromato type={sc.schema} onClic={clic} derniere={der} indice={ind} />
    {msg && <div role="alert" style={{ marginTop: 10, fontSize: 14.5, lineHeight: 1.5, color: C.ambre }}>{msg}<br /><span style={{ color: C.doux }}>(Chaque erreur te coûte 2 minutes.)</span></div>}
  </div>);
}
const btn = (actif) => ({ padding: '9px 13px', borderRadius: 10, border: `1px solid ${actif ? C.accent : C.bord}`, background: actif ? C.accent : '#fff', color: actif ? '#fff' : C.encre, fontSize: 14.5, cursor: 'pointer', minHeight: 44, font: 'inherit' });
function StationRheo({ e, onEtat }) {
  const pts = pointsRheo(e, 1, 'rc'), [essais, setEssais] = useState([]), [log, setLog] = useState(true), [cur, setCur] = useState(null), [retenu, setRetenu] = useState(null), [tau, setTau] = useState(''), [msg, setMsg] = useState('');
  const fits = Object.fromEntries(MODELES_RHEO.map(m => [m.id, ajusteRheo(pts, m.id)]));
  const W = 360, H = 190, x0 = 38, x1 = 346, sMax = Math.max(...pts.map(p => p.s)) * (log ? 1.4 : 1.1), sMin = Math.min(...pts.map(p => p.s)) / 1.8, gMax = Math.max(...pts.map(p => p.g));
  const lx = g => log ? x0 + (Math.log10(g) + 1) / 3 * (x1 - x0) : x0 + g / gMax * (x1 - x0), sy = s => log ? 160 - (Math.log10(s) - Math.log10(sMin)) / (Math.log10(sMax) - Math.log10(sMin)) * 140 : 160 - s / sMax * 140;
  const f = cur && fits[cur].f, tr = f && Array.from({ length: 61 }, (_, i) => { const g = log ? Math.pow(10, -1 + i / 20) : 0.1 + i / 60 * (gMax - 0.1); return `${i ? 'L' : 'M'}${lx(g).toFixed(1)} ${sy(Math.max(f(g), log ? sMin : 0)).toFixed(1)}`; }).join('');
  const valeurs = p => Object.entries(p).map(([k, v]) => `${{ eta: 'η', K: 'K', n: 'n', tau0: 'τ₀', etap: 'ηₚ' }[k]} = ${nf(v, k === 'n' ? 2 : 1)}`).join(' ; ');
  const tester = id => { setCur(id); if (!essais.includes(id)) setEssais([...essais, id]); setMsg(''); };
  const valider = () => { const x = nombre(tau); if (!retenu) return setMsg('Choisis le modèle que tu retiens.'); if (x === null || x < 0) return setMsg('Donne la valeur du seuil τ₀ en pascals.'); onEtat(validerRheo(e, retenu, x, essais.length)); };
  return (<div data-station-rheo className="pc-inst" style={inst}>
    <Cadre titre="RHÉOMÈTRE · POINTS DE MESURE">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Contrainte en fonction du gradient de vitesse, échelles logarithmiques, points de mesure du gel commercial" style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
        <line x1={x0} y1="160" x2={x1} y2="160" stroke="#6b8794" /><line x1={x0} y1="16" x2={x0} y2="160" stroke="#6b8794" />
        {(log ? [0.1, 1, 10, 100] : [0, 25, 50, 75, 100]).map(g => <text key={g} x={lx(g)} y="175" textAnchor="middle" fontSize="10" fill="#9fc3d1">{nf(g, g < 1 && g > 0 ? 1 : 0)}</text>)}
        {(log ? [20, 50, 100, 200] : [0, 25, 50, 75, 100]).filter(s => s <= sMax && (!log || s >= sMin)).map(s => <text key={s} x={x0 - 4} y={sy(s) + 3} textAnchor="end" fontSize="9" fill="#9fc3d1">{s}</text>)}
        <text x="4" y="12" fontSize="10" fill="#9fc3d1">σ (Pa, échelle {log ? 'log' : 'linéaire'})</text><text x={x1} y="188" textAnchor="end" fontSize="10" fill="#9fc3d1">γ̇ (s⁻¹, échelle {log ? 'log' : 'linéaire'})</text>
        {tr && <path d={tr} fill="none" stroke="#fcd34d" strokeWidth="2.2" />}
        {pts.map((p, i) => <circle key={i} cx={lx(p.g)} cy={sy(p.s)} r="3.4" fill="#93c5fd" />)}
      </svg>
      <button type="button" data-echelle-rheo aria-pressed={!log} onClick={() => setLog(!log)} style={{ font: 'inherit', fontSize: 13, padding: '4px 12px', borderRadius: 99, border: '1.5px solid #9fc3d1', background: 'transparent', color: '#e6f4f8', cursor: 'pointer' }}>{log ? 'Passer en échelle linéaire' : 'Passer en échelle logarithmique'}</button></Cadre>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, margin: '8px 0' }}><thead><tr style={{ textAlign: 'left', color: C.doux }}><th>γ̇ (s⁻¹)</th><th>σ (Pa)</th></tr></thead><tbody>{pts.map((p, i) => <tr key={i}><td>{nf(p.g, p.g < 1 ? 1 : 0)}</td><td>{nf(p.s, 1)}</td></tr>)}</tbody></table>
    <div style={{ fontWeight: 700, margin: '10px 0 4px' }}>1. Teste des modèles</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{MODELES_RHEO.map(m => <button key={m.id} type="button" data-modele={m.id} style={btn(cur === m.id)} onClick={() => tester(m.id)}>{m.nom}<span style={{ display: 'block', fontSize: 12.5, opacity: .85 }}>{m.eq}</span></button>)}</div>
    {cur && <div role="status" style={{ margin: '8px 2px', fontSize: 14.5, lineHeight: 1.5 }}>Ajustement « {MODELES_RHEO.find(m => m.id === cur).nom} » : {valeurs(fits[cur].p)} · écart relatif moyen entre le modèle et les points : <strong>{nf(fits[cur].rms, 1)} %</strong>.</div>}
    <div style={{ fontWeight: 700, margin: '12px 0 4px' }}>2. Retiens un modèle et donne le seuil</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{MODELES_RHEO.filter(m => essais.includes(m.id)).map(m => <button key={m.id} type="button" data-retenu={m.id} aria-pressed={retenu === m.id} style={btn(retenu === m.id)} onClick={() => setRetenu(m.id)}>Je retiens : {m.nom}</button>)}{!essais.length && <span style={{ color: C.doux, fontSize: 14 }}>Teste au moins un modèle pour pouvoir le retenir.</span>}</div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}><label>Seuil d'écoulement τ₀ ≈ <input data-tau inputMode="decimal" value={tau} onChange={ev => setTau(ev.target.value)} style={{ font: 'inherit', width: 90, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${C.bord}` }} /> Pa</label>
      <button type="button" data-valider-rheo style={btn(true)} onClick={valider}>Valider</button></div>
    {msg && <div role="alert" style={{ marginTop: 8, color: C.ambre, fontSize: 14.5 }}>{msg}</div>}
  </div>);
}
function StationCpgSim({ e, sc, onEtat }) {
  const L = CPG_LIM, [r, setR] = useState({ Tinj: L.Tinj[2], Tfour: L.Tfour[2], Tdet: L.Tdet[2], P: L.P[2] }), [n, setN] = useState(0), [m, setM] = useState(null);
  void sc;
  const inj = () => { setM(cpgModele(r)); setN(k => k + 1); };
  const W = 360, H = 170, x0 = 28, x1 = 346, yb = 138, X = t => x0 + t / 3 * (x1 - x0);
  const gauss = (t, c, w, a) => a / (w / 4 * Math.sqrt(2 * Math.PI)) * Math.exp(-((t - c) ** 2) / (2 * (w / 4) ** 2));
  const trace = m && Array.from({ length: 241 }, (_, i) => { const t = i / 80, y = gauss(t, m.tE, m.wE, 0.5) + gauss(t, m.tP, m.wP, 1.0) + m.bruit * Math.sin(i * 12.9898 + 4.1) * Math.cos(i * 3.7); return [t, y]; });
  const ymax = trace ? Math.max(...trace.map(p => p[1]), 0.6) : 1;
  const d = trace && trace.map(([t, y], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${(yb - Math.max(y, 0) / ymax * 105).toFixed(1)}`).join('');
  const reglages = [['Tinj', 'Température de l\'injecteur', '°C', 10], ['Tfour', 'Température du four (isotherme)', '°C', 5], ['Tdet', 'Température du détecteur (FID)', '°C', 10], ['P', 'Pression du gaz vecteur', 'kPa', 10]];
  return (<div data-station-cpgsim className="pc-inst" style={inst}>
    <div style={{ display: 'grid', gap: 10, margin: '4px 0 10px' }}>{reglages.map(([k, nom, u, pas]) => <label key={k} style={{ fontSize: 14.5 }}>{nom} : <strong>{r[k]} {u}</strong>
      <input type="range" data-reglage={k} min={L[k][0]} max={L[k][1]} step={pas} value={r[k]} onChange={ev => setR({ ...r, [k]: +ev.target.value })} style={{ width: '100%' }} /></label>)}</div>
    <button type="button" data-injecter style={btn(true)} onClick={inj}>Injecter (3 min)</button>
    {m && <><Cadre titre="CPG · ÉTHANOL + PROPAN-1-OL">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Chromatogramme : résolution ${nf(m.Rs, 2)}`} style={{ width: '100%', maxWidth: 640, margin: '0 auto', display: 'block' }}>
        <line x1={x0} y1={yb} x2={x1} y2={yb} stroke="#6b8794" /><path d={d} fill="none" stroke="#5eead4" strokeWidth="2" />
        {[0, 1, 2, 3].map(i => <g key={i}><line x1={X(i)} y1={yb} x2={X(i)} y2={yb + 4} stroke="#6b8794" /><text x={X(i)} y={yb + 16} textAnchor="middle" fontSize="10" fill="#9fc3d1">{i}</text></g>)}
        <text x={x1} y={yb + 30} textAnchor="end" fontSize="10" fill="#9fc3d1">temps (min), durée d'analyse 3 min</text></svg></Cadre>
      <div role="status" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '6px 2px' }}>Résolution entre les deux pics : <strong>R<sub>s</sub> = {nf(m.Rs, 2)}</strong> (≥ 1,5 pour des pics séparés). Temps de rétention : éthanol {nf(m.tE, 2)} min, propan-1-ol {nf(m.tP, 2)} min.
        {m.horsFenetre && <div style={{ color: C.ambre }}>Le propan-1-ol sort après la fin des 3 minutes d'analyse : son pic est coupé.</div>}
        {m.tailing && <div style={{ color: C.ambre }}>Injecteur trop froid : l'échantillon se vaporise mal, les pics s'élargissent et traînent.</div>}
        {m.condens && <div style={{ color: C.ambre }}>Détecteur trop froid : de l'eau peut condenser, le signal est instable.</div>}</div></>}
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
      <button type="button" data-conclure style={btn(false)} disabled={!n} onClick={() => onEtat(cpgSimFin(e, n, true))}>Les deux pics ne se séparent pas : je change d'étalon interne</button>
      <button type="button" data-retour-ref style={btn(false)} onClick={() => onEtat(cpgSimFin(e, n, false))}>Retour à la référence</button></div>
  </div>);
}
function StationTitrage({ e, sc, onEtat }) {
  const d = donneesTitr(e), ind = d.ind, g = GRANDEUR_TITR[d.suivi], N = d.pts.length, [i, setI] = useState(0), [auto, setAuto] = useState(false);
  const virage = ind && d.iVirage != null && i >= d.iVirage, fini = i >= N - 1 || (!!ind && virage);
  const marche = auto && !fini;
  useEffect(() => {
    if (!marche) return undefined;
    const h = setInterval(() => setI(k => k + 1), 380); return () => clearInterval(h);
  }, [marche]);
  const k = Math.min(i, N - 1), v = d.pts[k][0], lecture = ind ? null : `${nf(d.pts[k][1], g.dec)}${g.unite ? ' ' + g.unite : ''}`;
  const coul = ind ? couleurIndicateur(ind, phReel(e, v)) : '#eef2f7';
  const prochain = k < N - 1 ? d.pts[k + 1][0] - v : 0;
  const bt = (actif) => ({ padding: '10px 14px', borderRadius: 10, border: `1px solid ${actif ? C.accent : C.bord}`, background: actif ? C.accent : '#fff', color: actif ? '#fff' : C.encre, fontSize: 15, cursor: 'pointer', minHeight: 44, font: 'inherit' });
  return (<div data-titrage className="pc-inst" style={inst}>
    <SchemaBurette V2={v} ouvert={marche} coul={coul} indicateur={ind ? ind.nom : null} legendeCouleur={!!ind} reperes={false} etiquetteBurette={`NaOH ${nf(d.P.c, 2)} M`} sonde={ind ? null : { nom: g.nom, valeur: lecture }} />
    <div role="status" aria-live="polite" style={{ margin: '8px 2px', fontSize: 16, lineHeight: 1.5 }}>
      Volume de soude versé : <strong>{nf(v, 2)} mL</strong>{lecture && <> · {g.nom} : <strong>{lecture}</strong></>}
      {ind && <> · couleur de la dispersion : <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: coul, border: '1px solid #475569', verticalAlign: 'middle' }} /></>}
      {virage && <div style={{ color: C.ambre, marginTop: 4 }}>La couleur a viré : tu notes V = {nf(d.vEq, 2)} mL.</div>}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0 10px' }}>
      {!fini && <button type="button" style={bt(false)} onClick={() => { setAuto(false); setI(k + 1); }}>Verser {nf(prochain, 2)} mL</button>}
      {!fini && <button type="button" style={bt(marche)} onClick={() => setAuto(a => !a)}>{marche ? '⏸ Pause' : '▶ Verser en continu'}</button>}
      {!fini && <button type="button" style={bt(false)} onClick={() => { setAuto(false); setI(ind && d.iVirage != null ? d.iVirage : N - 1); }}>{ind && d.iVirage != null ? 'Verser jusqu\'au virage' : 'Tout verser'}</button>}
      {fini && <button type="button" style={bt(true)} onClick={() => onEtat(choisir(e, sc.choix[0]))}>Terminer le titrage</button>}
    </div>
    {!ind && <CourbeTitrage v={{ titre: 'Courbe de titrage en direct', pts: d.pts.slice(0, k + 1), der: [], veq: null, vmax: d.P.vfin, y: g.y, yr: g.yr || [0, Math.max(...d.pts.map(p => p[1])) * 1.1] }} />}
  </div>);
}
function StationObs({ e, onEtat }) {
  const [sel, setSel] = useState([]);
  const bascule = id => setSel(x => x.includes(id) ? x.filter(i => i !== id) : [...x, id]);
  return (
    <div data-obs className="pc-inst" style={inst}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>📓 Qu'as-tu observé ? (coche ce que tu notes dans ton cahier)</div>
      {observationsDe(e).map(([id, t]) => <label key={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 4px', fontSize: 15.5, cursor: 'pointer' }}><input type="checkbox" checked={sel.includes(id)} onChange={() => bascule(id)} style={{ marginTop: 4, width: 18, height: 18 }} />{t}</label>)}
      <button type="button" className="pc-btn" style={{ marginTop: 10 }} onClick={() => onEtat(noterObs(e, sel))}>Noter dans mon cahier (5 min)</button>
    </div>);
}


// ───────────── La paillasse : cinq postes de travail illustrés ─────────────
const POSTES = [
  { id: 'etuve', nom: 'Étuve et balance', vers: ['es_balance', 'es_prep', 'es_calc1', 'es_calc2b'] },
  { id: 'bureau', nom: 'Bureau', vers: ['docs', 'eth1', 'formule', 'obs_video', 'eq_ines', 'verdict'] },
  { id: 'ir', nom: 'Spectrométrie IR', vers: ['leurre_ir'] },
  { id: 'formulation', nom: 'Formulation', vers: ['relance', 'eq_base', 'fab_choix', 'fab_relance', 'fab_disp'] },
  { id: 'optique', nom: 'Réfractomètre, polarimètre', vers: ['leurre_refracto', 'leurre_polar'] },
  { id: 'rheo', nom: 'Rhéologie', vers: ['rheoC', 'rheoF'] },
  { id: 'titrage', nom: 'Titrage', vers: ['titr_suivi', 'titr_carb_plan', 'leurre_titrgel'] },
  { id: 'conduc', nom: 'Conductimètre', vers: ['leurre_conduc'] },
  { id: 'chroma', nom: 'Chromatographie, UV', vers: ['choix_caf', 'choix_eth', 'rapide_caf', 'rapide_eth', 'hplc_m', 'hplc_ei', 'hplc_gamme_plan', 'cpg_m', 'cpg_ei', 'cpg_sim', 'cpg_inj', 'uv_ajouts_plan', 'uv_ext_plan'] },
];
const posteDe = vers => (POSTES.find(p => p.vers.includes(vers)) || POSTES[1]).id;
function Dessin({ id, actif, termine }) {
  const T = '#334155', L = '#cbd5e1', O = '#f59e0b';
  const cadre = { width: 92, height: 68, display: 'block' };
  if (id === 'etuve') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="14" y="8" width="56" height="46" rx="5" fill="#e2e8f0" stroke={T} strokeWidth="2" />
    <rect x="22" y="16" width="40" height="28" rx="3" fill={actif ? '#fb923c' : termine ? '#86efac' : '#94a3b8'} className={actif ? 'pc-lueur' : undefined} stroke={T} strokeWidth="1.5" />
    <circle cx="78" cy="18" r="5" fill={actif ? O : '#cbd5e1'} stroke={T} /><rect x="74" y="28" width="9" height="3" fill={T} />
    <rect x="62" y="60" width="32" height="6" rx="2" fill={T} /><rect x="68" y="52" width="20" height="8" fill="#f1f5f9" stroke={T} /><text x="78" y="58.5" textAnchor="middle" fontSize="6" fill={T}>0,0</text></svg>);
  if (id === 'bureau') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="22" y="8" width="46" height="32" rx="3" fill="#f1f5f9" stroke={T} strokeWidth="2" /><rect x="27" y="13" width="36" height="22" fill="#bae6fd" />
    <path d="M30 30 L38 22 L45 27 L55 17" fill="none" stroke="#0369a1" strokeWidth="2" /><rect x="40" y="40" width="10" height="7" fill={T} /><rect x="30" y="47" width="30" height="5" rx="2" fill={L} stroke={T} />
    <rect x="70" y="36" width="20" height="26" rx="2" fill="#fff" stroke={T} /><path d="M74 44h12M74 50h12M74 56h8" stroke={L} strokeWidth="2" /></svg>);
  if (id === 'formulation') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="14" y="58" width="60" height="8" rx="2" fill={T} /><circle cx="44" cy="42" r="17" fill="#e0f2fe" stroke={T} strokeWidth="2" /><path d="M29 44 Q44 36 59 44" fill="#7dd3fc" opacity=".8" />
    <rect x="40" y="8" width="8" height="14" fill={L} stroke={T} /><path d="M44 8 V2" stroke={T} strokeWidth="2" />
    {actif && [0, 1, 2].map(i => <circle key={i} className="pc-bull" style={{ animationDelay: `${i * .7}s` }} cx={37 + i * 7} cy="48" r="2" fill="#fff" stroke="#0369a1" strokeWidth=".8" />)}
    <rect x="80" y="30" width="10" height="28" rx="2" fill="#bbf7d0" stroke={T} /></svg>);
  if (id === 'ir') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="10" y="30" width="54" height="26" rx="3" fill="#e2e8f0" stroke={T} strokeWidth="2" /><rect x="22" y="22" width="18" height="10" fill={L} stroke={T} /><circle cx="31" cy="27" r="3" fill="#94a3b8" stroke={T} />
    <rect x="68" y="12" width="26" height="22" rx="2" fill="#0f2430" stroke={T} strokeWidth="1.5" /><path d="M71 30 L74 18 L77 28 L80 16 L83 29 L86 22 L91 30" fill="none" stroke="#5eead4" strokeWidth="1.3" /></svg>);
  if (id === 'optique') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="8" y="34" width="48" height="12" rx="2" fill={L} stroke={T} strokeWidth="2" /><circle cx="14" cy="40" r="7" fill="#fff" stroke={T} /><rect x="56" y="36" width="14" height="8" fill="#f1f5f9" stroke={T} /><circle cx="76" cy="40" r="8" fill="#fff" stroke={T} strokeWidth="2" /><path d="M76 40 L81 36" stroke="#b91c1c" strokeWidth="2" />
    <rect x="12" y="52" width="60" height="8" rx="2" fill={T} /></svg>);
  if (id === 'titrage') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="30" y="4" width="6" height="30" rx="2" fill="#f1f5f9" stroke={T} strokeWidth="1.5" /><path d="M33 34 V42" stroke={T} strokeWidth="2" /><path d="M26 44 H64 L58 66 H32 Z" fill="#e0f2fe" stroke={T} strokeWidth="2" />
    <rect x="70" y="18" width="20" height="14" rx="2" fill="#f1f5f9" stroke={T} strokeWidth="1.5" /><text x="80" y="29" textAnchor="middle" fontSize="8" fill={T}>pH</text><path d="M80 32 V54 L64 58" fill="none" stroke={T} strokeWidth="1.5" /></svg>);
  if (id === 'conduc') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="12" y="10" width="34" height="20" rx="3" fill="#f1f5f9" stroke={T} strokeWidth="2" /><text x="29" y="24" textAnchor="middle" fontSize="9" fill={T}>µS/cm</text>
    <path d="M46 20 H64 V46" fill="none" stroke={T} strokeWidth="2" /><rect x="58" y="44" width="12" height="14" rx="2" fill="#bae6fd" stroke={T} /><rect x="74" y="40" width="14" height="24" rx="2" fill="#e0f2fe" stroke={T} strokeWidth="2" /></svg>);
  if (id === 'rheo') return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="30" y="8" width="36" height="12" rx="2" fill={L} stroke={T} strokeWidth="2" /><rect x="44" y="20" width="8" height="18" fill={T} /><path d="M32 40 H64 L56 46 H40 Z" fill="#94a3b8" stroke={T} /><rect x="22" y="50" width="52" height="14" rx="3" fill="#e2e8f0" stroke={T} strokeWidth="2" />
    <circle cx="80" cy="30" r="9" fill="#fff" stroke={T} strokeWidth="2" /><path d="M80 30 L85 25" stroke="#b91c1c" strokeWidth="2" /></svg>);
  return (<svg viewBox="0 0 100 74" style={cadre} aria-hidden="true">
    <rect x="12" y="10" width="46" height="12" rx="2" fill="#e2e8f0" stroke={T} strokeWidth="1.5" /><rect x="12" y="25" width="46" height="12" rx="2" fill="#e2e8f0" stroke={T} strokeWidth="1.5" /><rect x="12" y="40" width="46" height="12" rx="2" fill="#e2e8f0" stroke={T} strokeWidth="1.5" />
    <circle cx="50" cy="16" r="2.5" fill="#22c55e" /><circle cx="50" cy="31" r="2.5" fill="#22c55e" />
    <rect x="62" y="10" width="28" height="30" rx="3" fill="#0f2430" stroke={T} strokeWidth="1.5" /><path d="M65 34 L72 34 L75 18 L78 34 L87 34" fill="none" stroke="#5eead4" strokeWidth="1.8" /><path d="M20 62 H80" stroke={L} strokeWidth="3" strokeLinecap="round" /></svg>);
}
function Paillasse({ e, s, choix, onChoix }) {
  const parPoste = Object.fromEntries(POSTES.map(p => [p.id, []]));
  const conseil = choix.find(c => c.vers === 'conseil'), pause = choix.find(c => c.pause);
  choix.forEach((c, i) => { if (c.vers !== 'conseil' && !c.pause) parPoste[posteDe(c.vers)].push({ c, i }); });
  const [sel, setSel] = useState(null);
  const actuel = sel;   // aucun poste n'est présélectionné : c'est à l'élève de choisir où aller
  const etuveActive = !!s.es && e.bg.es > e.t, etuveFinie = !!s.es && !etuveActive, gelActif = !!s.gel && e.bg.gel > e.t;
  return (<div data-paillasse>
    {conseil && <button type="button" data-conseil onClick={() => onChoix(conseil)} style={{ font: 'inherit', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 10, borderRadius: 14, border: `1.5px solid ${C.accent}`, background: '#fff', color: C.accent, cursor: 'pointer' }}><span aria-hidden="true" style={{ fontSize: 22 }}>💬</span><span><b>Perdu·e, ou un doute ?</b> Demander conseil à un collègue ou à Mme Dubreuil</span></button>}
    {pause && <button type="button" data-pause onClick={() => onChoix(pause)} style={{ font: 'inherit', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '10px 14px', marginBottom: 10, borderRadius: 14, border: `1.5px solid ${C.bord}`, background: '#fff', color: C.encre, cursor: 'pointer' }}><span aria-hidden="true" style={{ fontSize: 22 }}>☕</span><span><b>Prendre une pause de 10 minutes</b><span style={{ display: 'block', fontSize: 13.5, color: C.doux }}>Les appareils continuent de tourner pendant ce temps.</span></span></button>}
    <div style={{ background: 'linear-gradient(180deg,#e9eef3 0%,#dde5ec 100%)', borderRadius: 16, padding: '12px 8px 0', border: `1px solid ${C.bord}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(104px,1fr))', gap: 4 }}>
        {POSTES.map(p => { const actif = (p.id === 'etuve' && etuveActive) || (p.id === 'formulation' && gelActif), fini = (p.id === 'etuve' && etuveFinie);
          return <button key={p.id} type="button" className="pc-poste" aria-pressed={actuel === p.id} onClick={() => setSel(p.id)} aria-label={`${p.nom}${actif ? ', un appareil tourne' : ''}`}>
            <Dessin id={p.id} actif={actif} termine={fini} />
            <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>{p.nom}</span>
            {(actif || fini) && <span aria-hidden="true" style={{ fontSize: 11.5, color: actif ? C.ambre : C.vert, fontWeight: 700 }}>{actif ? (p.id === 'etuve' ? `encore ${duree(e.bg.es - e.t)}` : `encore ${duree(e.bg.gel - e.t)}`) : 'terminé'}</span>}
          </button>; })}
      </div>
      <div aria-hidden="true" style={{ height: 14, margin: '4px -8px 0', borderRadius: '0 0 16px 16px', background: 'repeating-linear-gradient(90deg,#8a6a4c 0 22px,#7d5f43 22px 24px)', borderTop: '3px solid #5d452f' }} />
    </div>
    <div className="pc-grille" style={{ marginTop: 12 }}>{(parPoste[actuel] || []).map(({ c, i }) => (
      <button key={i} type="button" className="pc-tache" data-choix={i} data-bloque={c.bloque ? 'oui' : undefined} disabled={!!c.bloque} aria-disabled={!!c.bloque} style={c.bloque ? { opacity: .55, filter: 'grayscale(1)', cursor: 'not-allowed' } : undefined} onClick={() => !c.bloque && onChoix(c)}><span style={{ fontSize: 26, lineHeight: 1 }} aria-hidden="true">{ICONES[c.vers] || '▪️'}</span><span><b style={{ fontSize: 16 }}>{c.t}</b>{c.bloque ? <span style={{ display: 'block', fontSize: 13.5, color: C.doux, marginTop: 3, lineHeight: 1.4 }}>🔒 {c.bloque}</span> : c.d && <span style={{ display: 'block', fontSize: 13.5, color: C.doux, marginTop: 3, lineHeight: 1.4 }}>{c.d}</span>}</span></button>))}
      {!actuel && <div style={{ color: C.doux, fontSize: 14.5 }}>Choisis un poste de travail.</div>}{actuel && !(parPoste[actuel] || []).length && <div style={{ color: C.doux, fontSize: 14.5 }}>Rien à faire à ce poste pour l'instant.</div>}</div>
  </div>);
}

function FicheCorrection({ e }) {
  const L = ficheCorrection(e), nom = pn(e);
  const fmt = v => v == null ? '—' : nf(v, Math.abs(v) < 10 ? 2 : 1);
  return (<section data-impression data-fiche-correction>
    <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Fiche de correction{nom ? ` · ${nom}` : ''}</h4>
    <button type="button" className="pc-btn pc-noprint" data-imprimer onClick={() => window.print()} style={{ marginBottom: 12 }}>🖨️ Imprimer la fiche (ou l'enregistrer en PDF)</button>
    <div style={{ fontWeight: 700, margin: '8px 0 6px' }}>Les calculs de la journée</div>
    {!L.length && <div style={{ color: C.doux }}>Aucun calcul saisi pendant cette partie.</div>}
    {L.map((c, i) => (<div key={c.id + i} style={{ border: `1px solid ${C.bord}`, borderLeft: `5px solid ${c.juste ? C.vert : C.ambre}`, borderRadius: 10, padding: '10px 12px', margin: '8px 0', fontSize: 14.5, lineHeight: 1.5, breakInside: 'avoid', background: '#fff' }}>
      <div style={{ fontWeight: 700 }}>{i + 1}. {c.titre}{c.juste ? ' ✅' : ' · corrigé avec l\'aide d\'un collègue'}</div>
      <div style={{ color: C.doux, whiteSpace: 'pre-line' }}>{c.donnees}</div>
      <div><b>Question :</b> {c.q}</div>
      <div><b>Ta réponse :</b> {c.saisies.map(fmt).join(' puis ')} · <b>Valeur attendue :</b> {c.attendu}</div>
      <div><b>Démarche :</b><ul style={{ margin: '2px 0 0', paddingLeft: 20 }}>{c.demarche.map((d, k) => <li key={k}>{d}</li>)}</ul></div>
    </div>))}
    <div style={{ fontWeight: 700, margin: '14px 0 6px' }}>Bilan par compétence</div>
    {bilan(e).map(b => { const [ic, col, lib] = NIVEAUX[b.niveau]; return <div key={b.comp} style={{ margin: '6px 0', fontSize: 14.5, lineHeight: 1.5, breakInside: 'avoid' }}>{ic} <b>{b.comp}</b> · {b.titre} <span style={{ color: col, fontWeight: 700 }}>({lib})</span><div style={{ color: C.doux }}>{b.texte}</div></div>; })}
  </section>);
}

// ───────────── Le film de la journée (fin de partie) ─────────────
function Film({ e }) {
  const [etroit, setEtroit] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(max-width: 560px)').matches);
  useEffect(() => { if (!window.matchMedia) return undefined; const m = window.matchMedia('(max-width: 560px)'), f = () => setEtroit(m.matches); m.addEventListener?.('change', f); return () => m.removeEventListener?.('change', f); }, []);
  const ch = chronologie(e), W = etroit ? 360 : 680, x0 = etroit ? 8 : 120, x1 = W - 16, X = t => x0 + t / T_FIN * (x1 - x0), tmax = Math.min(e.t, T_FIN);
  const pas = etroit ? 46 : 30, h0 = etroit ? 22 : 14, bh = 18, haut = h0 + 4 * pas - 10, H = haut + 34;
  const rangs = [['Toi (actif)', ch.actif, '#1e3a8a'], ['Étuve', ch.etuve, '#f59e0b'], ['Dispersion gel', ch.gel, '#7c3aed'], ['Attente subie', ch.attentes, '#dc2626']];
  const barres = a => a.map((b, i) => { const t0 = b.t0; return <rect key={i} x={X(t0)} y="0" width={Math.max(2, X(Math.min(b.t1, T_FIN)) - X(t0))} height={bh} rx="3" />; });
  const ticks = [0, 60, 120, 180, 240, 300, 360, 420, 480, 540].filter(t => !etroit || t % 120 === 0).map(t => [t, `${8 + t / 60} h`]);
  return (<figure data-film style={{ margin: '8px 0' }}>
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Frise horaire de ta journée : ton travail actif, l'étuve, la dispersion du gel et les attentes subies" style={{ display: 'block', background: C.fond, borderRadius: 12, border: `1px solid ${C.bord}` }}>
      {rangs.map(([nom, a, col], r) => <g key={nom} transform={`translate(0 ${h0 + r * pas - (etroit ? 6 : 0)})`}><text x="8" y={etroit ? -4 : 13} fontSize={etroit ? 13 : 12} fill={C.encre}>{nom}</text><rect x={x0} y="0" width={x1 - x0} height={bh} rx="3" fill="#e8eef4" /><g fill={col}>{barres(a)}</g></g>)}
      <rect x={X(T_MIDI)} y="8" width={X(T_MIDI + T_PAUSE) - X(T_MIDI)} height={haut - 8} fill={C.ambre} opacity=".18" />
      <rect x={X(tmax)} y="8" width={Math.max(0, x1 - X(tmax))} height={haut - 8} fill="#fff" opacity=".6" />
      {ticks.map(([t, l]) => <g key={t}><line x1={X(t)} y1={haut} x2={X(t)} y2={haut + 5} stroke={C.doux} /><text x={X(t)} y={haut + 19} fontSize={etroit ? 13 : 11} textAnchor="middle" fill={C.doux}>{l}</text></g>)}
      <text x={X(T_MIDI) + 2} y="18" fontSize={etroit ? 12 : 10} fill={C.ambre}>déj.</text>
    </svg>
    <figcaption style={{ fontSize: 13.5, color: C.doux, marginTop: 6, lineHeight: 1.5 }}>Un technicien efficace lance d'abord les opérations longues (étuve, dispersion du Synthalen K), puis prépare calculs, rhéologie du témoin et analyses pendant qu'elles tournent. Tes attentes subies : <b>{duree(e.f.attente || 0)}</b>.</figcaption>
  </figure>);
}
function Conseq({ e }) {
  const L = consequences(e);
  if (!L.length) return null;
  return (<div data-conseq style={{ display: 'grid', gap: 8 }}>{L.map((c, i) => <div key={i} style={{ display: 'flex', gap: 10, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '9px 12px', background: '#fff', fontSize: 14.5, lineHeight: 1.5 }}>
    <span aria-hidden="true" style={{ color: C.accent, fontWeight: 700 }}>→</span><div><b>{c.cause}</b>{c.quand && <span style={{ color: C.doux }}> ({c.quand})</span>} : {c.effet}.</div></div>)}</div>);
}
function Fiche({ e }) {
  const [copie, setCopie] = useState(false), txt = fiche(e).join('\n');
  const copier = async () => { try { await navigator.clipboard.writeText(txt); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* copie indisponible */ } };
  return (<div data-fiche style={{ border: `1.5px dashed ${C.bord}`, borderRadius: 12, padding: '10px 14px', background: '#fff' }}>
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}>{txt}</pre>
    <button type="button" className="pc-btn2" style={{ marginTop: 8 }} onClick={copier}>{copie ? 'Copié' : 'Copier ma fiche'}</button></div>);
}

function RevoirResultats({ e }) {
  const ids = resultatsVus(e), [id, setId] = useState(null);
  if (!ids.length) return null;
  const e2 = id ? { ...e, scene: id } : null, sc = id ? SCENES[id] : null;
  return (<details data-resultats style={{ marginTop: 12, border: `1.5px dashed ${C.bord}`, borderRadius: 14, padding: '10px 14px', background: C.fond }}>
    <summary style={{ cursor: 'pointer', fontWeight: 700 }}>📂 Revoir mes résultats ({ids.length})</summary>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>{ids.map(i => <button key={i} type="button" data-revoir={i} aria-pressed={id === i} onClick={() => setId(id === i ? null : i)} style={{ font: 'inherit', fontSize: 13.5, padding: '5px 11px', borderRadius: 99, border: `1.5px solid ${id === i ? C.accent : C.bord}`, background: id === i ? '#e6f4f1' : '#fff', cursor: 'pointer' }}>{SCENES[i].titre}</button>)}</div>
    {sc && <div data-revoir-contenu style={{ borderTop: `1px solid ${C.bord}`, paddingTop: 6 }}>
      {String(texteDe(e2)).split('\n').filter(l => l.trim()).map((l, k) => <p key={k} style={{ margin: '6px 0', lineHeight: 1.55, fontSize: 15 }}>{l}</p>)}
      {visuelsDe(e2).map((v, k) => <Visuel key={k} v={v} />)}
    </div>}
  </details>);
}

function BarreTemps({ t }) {
  const pct = x => `${Math.min(100, x / T_FIN * 100)}%`, fin = t > T_FIN * 0.85;
  return (
    <div style={{ marginBottom: 14, background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '10px 14px' }} aria-label={`${horloge(t)}, il reste ${duree(Math.max(0, T_FIN - t))}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}><b style={{ fontSize: 16 }}>🕐 {horloge(Math.min(t, T_FIN))}</b><span style={{ fontSize: 14, color: fin ? C.rouge : C.doux, fontWeight: fin ? 700 : 400 }}>Reste {duree(Math.max(0, T_FIN - t))}</span></div>
      <div style={{ position: 'relative', height: 10, background: '#dbe4ee', borderRadius: 6 }}>
        <div style={{ width: pct(t), height: '100%', background: fin ? C.rouge : C.accent, borderRadius: 6, transition: 'width .4s' }} />
        <div style={{ position: 'absolute', left: pct(T_MIDI), top: -3, width: `${T_PAUSE / T_FIN * 100}%`, height: 16, borderRadius: 2, background: C.ambre, opacity: .7 }} title="Pause déjeuner" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.doux, marginTop: 3 }}><span>8 h</span><span>Pause · 12 h</span><span>17 h</span></div>
    </div>);
}

// Instruments qui tournent pendant que l'élève travaille
function Instruments({ e, s }) {
  if (!s.es && !s.gel) return null;
  const carte = (icone, nom, fin, dureeMax, txt) => {
    const r = Math.max(0, fin - e.t), p = Math.max(0, Math.min(1, 1 - r / dureeMax));
    return <div key={nom} style={{ background: r > 0 ? '#fff7ed' : '#ecfdf3', border: `1.5px solid ${r > 0 ? '#fdba74' : '#86d9a5'}`, borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700, fontSize: 15 }}><span>{icone} {nom}</span><span style={{ color: r > 0 ? C.ambre : C.vert }}>{r > 0 ? `encore ${duree(r)}` : 'terminé'}</span></div>
      <div style={{ height: 7, background: 'rgba(0,0,0,.08)', borderRadius: 4, margin: '8px 0 5px', overflow: 'hidden' }}><div style={{ width: `${p * 100}%`, height: '100%', background: r > 0 ? '#f59e0b' : '#22c55e', transition: 'width .4s' }} /></div>
      <div style={{ fontSize: 13, color: C.doux }}>{txt}</div></div>; };
  return <div data-attentes className="pc-grille" style={{ margin: '4px 0 14px' }}>
    {s.es && carte('🔥', 'Étuve à 105 °C', e.bg.es, 60, 'Extrait sec en cours')}
    {s.clhp && carte('🔧', 'Réparation de la CLHP', e.bg.clhp, 75, 'CLHP en réparation')}
    {s.gel && carte('⚗️', 'Dispersion du gel', e.bg.gel, 90, 'Le Synthalen K se disperse')}</div>;
}

function Dialogue({ sc, paragraphes, p, e }) {
  return <div>{paragraphes.map((l, i) => l.startsWith('«') || /^[A-ZÉÈÀ][\w'’ éèêàùçî-]* : «/.test(l) ?
    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '10px 0' }}><Avatar pnj={sc.pnj} e={e} /><div className="pc-bulle" style={{ flex: 1, margin: 0, borderColor: p.couleur + '66', background: p.couleur + '0d' }}>{l}</div></div>
    : <p key={i} style={{ lineHeight: 1.65, margin: '10px 0', color: '#334155' }}>{l}</p>)}</div>;
}

const CONSTITUANTS_FICHE = [['caf', 'Caféine'], ['carb', 'Synthalen K'], ['coc', 'Cocoate de macrogol 7 glycérol'], ['eth', 'Éthanol à 96 %'], ['trol', 'Trolamine'], ['eau', 'Eau purifiée']];
const lireTeneur = x => { const v = Number(String(x ?? '').replace(',', '.').trim()); return String(x ?? '').trim() !== '' && Number.isFinite(v) ? v : null; };
// Fiche de formulation remise par Mme Dubreuil : toujours consultable, les pourcentages se notent au fur et à mesure (bloc-notes de l'élève, rien n'est corrigé ici)
function FicheFormulation({ e, setEtat }) {
  const val = e.fichePct || {}, nombres = CONSTITUANTS_FICHE.map(([id]) => lireTeneur(val[id])), saisis = nombres.filter(x => x !== null), somme = saisis.reduce((a, b) => a + b, 0);
  return (<details data-fichepct style={{ marginTop: 20, border: `1.5px dashed ${C.bord}`, borderRadius: 14, padding: '10px 14px', background: C.fond }}>
    <summary style={{ cursor: 'pointer', fontWeight: 700, color: C.encre }}>🧪 Fiche de formulation de Mme Dubreuil{saisis.length ? ` (${saisis.length} sur ${CONSTITUANTS_FICHE.length} notés)` : ' (à compléter)'}</summary>
    <div style={{ fontSize: 14, color: C.doux, margin: '8px 0' }}>Note ici les pourcentages massiques au fur et à mesure que tu les trouves. Cette fiche est un bloc-notes : rien n'y est corrigé.</div>
    <table style={{ borderCollapse: 'collapse', fontSize: 15, width: '100%', maxWidth: 480 }}>
      <thead><tr><th style={{ textAlign: 'left', padding: '4px 8px', border: `1px solid ${C.bord}`, background: '#fff' }}>Constituant</th><th style={{ textAlign: 'right', padding: '4px 8px', border: `1px solid ${C.bord}`, background: '#fff' }}>% massique</th></tr></thead>
      <tbody>{CONSTITUANTS_FICHE.map(([id, nom]) => <tr key={id}><td style={{ padding: '4px 8px', border: `1px solid ${C.bord}`, background: '#fff' }}><label htmlFor={`fp-${id}`}>{nom}</label></td>
        <td style={{ padding: 2, border: `1px solid ${C.bord}`, background: '#fff', textAlign: 'right' }}><input id={`fp-${id}`} data-fp={id} inputMode="decimal" autoComplete="off" value={val[id] ?? ''} placeholder="?" onChange={ev => setEtat({ ...e, fichePct: { ...val, [id]: ev.target.value } })} style={{ width: 90, textAlign: 'right', font: 'inherit', padding: '6px 8px', border: `1px solid ${C.bord}`, borderRadius: 8 }} /></td></tr>)}
        <tr><td style={{ padding: '4px 8px', border: `1px solid ${C.bord}`, background: '#fff', fontWeight: 700 }}>Total</td><td style={{ padding: '4px 10px', border: `1px solid ${C.bord}`, background: '#fff', textAlign: 'right' }}>{saisis.length ? `${nf(somme, 2)} %` : '100 %'}</td></tr></tbody>
    </table>
  </details>);
}

export function SimulationHistoirePercutafeine() {
  const [etat, setEtat] = useEtatPersistant(CLE_ETAT, null);
  const [fins, setFins] = useEtatPersistant(CLE_FINS, []);
  const [joueur, setJoueur] = useEtatPersistant('percu-joueur-v1', { prenom: '', avatar: 0 });
  const [carnetOuvert, setCarnetOuvert] = useState(false);
  const refTitre = useRef(null), refCadre = useRef(null);
  const e = etat && SCENES[etat.scene] ? etat : null, fin = !!e && estFin(e.scene);
  useEffect(() => { if (e) refTitre.current?.focus({ preventScroll: true }); }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (e && typeof window !== 'undefined' && refCadre.current) { try { window.scrollTo(0, Math.max(0, refCadre.current.getBoundingClientRect().top + window.scrollY - 8)); } catch { /* sans défilement */ } } }, [e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (fin && !fins.includes(e.scene)) setFins([...fins, e.scene]); }, [fin, e?.scene]); // eslint-disable-line react-hooks/exhaustive-deps

  const cadre = { color: C.encre, background: C.carte, borderRadius: 20, padding: 'clamp(14px, 3vw, 28px)', maxWidth: 920, margin: '0 auto', fontSize: 16, boxShadow: '0 14px 40px rgba(0,0,0,.38)' };
  const boiteFins = (
    <div style={{ fontSize: 13.5, color: C.doux, marginTop: 14 }} data-fins>
      <b style={{ color: C.encre }}>Fins découvertes : {fins.length} / {FINS.length}</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{FINS.map(([id, nom]) => <span key={id} style={{ padding: '3px 10px', borderRadius: 99, border: `1px solid ${fins.includes(id) ? C.accent : C.bord}`, background: fins.includes(id) ? C.accentFond : 'transparent', color: fins.includes(id) ? C.accent : C.doux }}>{fins.includes(id) ? nom : '???'}</span>)}</div>
    </div>);

  if (!e) return (
    <div style={cadre} data-percu="intro"><style>{STYLE}</style>
      <div style={{ background: 'linear-gradient(135deg,#0f4c5c,#0b2f3a)', color: '#fff', borderRadius: 16, padding: 'clamp(16px,4vw,28px)', marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, letterSpacing: 2, color: '#7ef0d4', fontFamily: 'ui-monospace,monospace' }}>BTS MÉTIERS DE LA CHIMIE · HISTOIRE À CHOIX</div>
        <h2 style={{ margin: '8px 0 10px', fontSize: 'clamp(26px,6vw,38px)', color: '#fff', lineHeight: 1.15 }}>🧴 Contre-typer la Percutaféine</h2>
        <p style={{ margin: 0, lineHeight: 1.6, maxWidth: 640, color: '#d7eef2' }}>Tu es technicien·ne de R&amp;D. Pendant une journée de TP (8 h – 17 h), tu retrouves la formule d'un gel à la caféine, tu en fabriques 200 g, puis tu contrôles sa qualité.</p>
      </div>
      <div className="pc-grille" style={{ marginBottom: 14 }}>
        {[['⏱️', 'Environ 1 h', 'Tu joues seul·e, sur une journée de TP simulée. Ta partie est sauvegardée : tu peux t\'arrêter et reprendre.'], ['🔥', 'Le temps compte', "L'étuve et le ballon chauffent pendant que tu travailles."], ['🧮', 'Calculs et choix libres', 'Aucune alerte : tes choix ont des conséquences que tu verras plus loin.'], ['🏁', `${FINS.length} fins possibles`, 'Selon tes choix, tes résultats et ton organisation.']].map(([ic, t, d]) => <div key={t} style={{ display: 'flex', gap: 12, background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 14, padding: '11px 14px' }}><span style={{ fontSize: 24 }}>{ic}</span><div><b>{t}</b><div style={{ fontSize: 14, color: C.doux }}>{d}</div></div></div>)}
      </div>
      <fieldset data-joueur style={{ border: `1.5px dashed ${C.bord}`, borderRadius: 12, padding: '10px 14px', margin: '0 0 16px', maxWidth: 560 }}>
        <legend style={{ fontWeight: 800, padding: '0 6px' }}>Qui es-tu ?</legend>
        <label style={{ display: 'block', fontSize: 15 }}>Ton prénom (tes collègues t'appelleront ainsi) :{' '}
          <input data-prenom value={joueur.prenom} maxLength={20} onChange={ev => setJoueur({ ...joueur, prenom: ev.target.value })} placeholder="facultatif" style={{ padding: '6px 10px', fontSize: 16, borderRadius: 8, border: `2px solid ${C.bord}`, width: 170 }} /></label>
        <div role="radiogroup" aria-label="Ton avatar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          {Array.from({ length: NB_AVATARS }, (_, i) => (
            <button key={i} type="button" role="radio" aria-checked={joueur.avatar === i} aria-label={`Avatar ${i + 1}`} data-avatar={i} onClick={() => setJoueur({ ...joueur, avatar: i })} style={{ padding: 3, borderRadius: '50%', border: joueur.avatar === i ? `3px solid ${C.accent}` : '3px solid transparent', background: 'none', cursor: 'pointer' }}>
              <AvatarVisuel id={'moi' + i} taille={52} />
            </button>))}
        </div>
      </fieldset>
      <button type="button" className="pc-btn" data-commencer onClick={() => setEtat(etatInitial(undefined, joueur.prenom, joueur.avatar))} style={{ fontSize: 17, padding: '12px 28px' }}>Commencer</button>
      {boiteFins}
      <div style={{ fontSize: 12.5, color: C.doux, marginTop: 14 }}>Bilan final par compétence du référentiel. Rien n'est transmis à ton enseignant. Scénario fictif d'après le TP de contre-typage (BTS MDC, lycée Argouges) ; les valeurs mesurées sont des données de scénario calées sur des mesures d'élèves.</div>
    </div>);

  const sc = SCENES[e.scene], choix = choixDe(e), vis = visuelsDe(e), p = PNJ[sc.pnj], s = statutBg(e);
  const avancer = c => setEtat(choisir(e, c));
  const paragraphes = String(texteDe(e)).split('\n').filter(l => l.trim() && !(e.scene === 'hub' && /^(🔥|⚗️)/.test(l)));
  const hub = e.scene === 'hub', lettre = i => String.fromCharCode(65 + i);
  return (
    <div style={cadre} ref={refCadre} data-percu={fin ? 'fin' : 'jeu'}><style>{STYLE}</style>
      <BarreTemps t={e.t} />
      <div key={e.scene} className="pc-scene">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: C.doux, background: FOND_LIEU[sc.lieu] || C.fond, borderRadius: 99, padding: '4px 12px 4px 6px' }}>
          <Avatar pnj={sc.pnj} taille={24} e={e} /><span>{sc.lieu} · {sc.pnj === 'moi' && pn(e) ? pn(e) : p.nom}</span></div>
        {peutRevenir(e) && <div><button type="button" data-retour onClick={() => setEtat(revenirHub(e))} style={{ marginTop: 8, background: 'none', border: 'none', color: C.accent, font: 'inherit', fontSize: 14.5, cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}>← Revenir à la paillasse, sans rien faire</button></div>}
        {fin && <div style={{ marginTop: 10, borderRadius: 14, padding: '14px 18px', background: TONS[sc.fin.ton] + '14', border: `1.5px solid ${TONS[sc.fin.ton]}55` }}><div style={{ fontSize: 12, letterSpacing: 1.5, color: TONS[sc.fin.ton], fontWeight: 700 }}>FIN DU TP</div>
          <h3 ref={refTitre} tabIndex={-1} data-titre style={{ margin: '2px 0 0', fontSize: 'clamp(22px,5vw,28px)', outline: 'none', color: TONS[sc.fin.ton] }}>{sc.titre}</h3></div>}
        {!fin && <h3 ref={refTitre} tabIndex={-1} data-titre style={{ margin: '10px 0 6px', fontSize: 'clamp(21px,4.5vw,26px)', outline: 'none', color: C.encre }}>{sc.titre}</h3>}
        {e.f.corrige && <div data-corrige role="status" style={{ background: '#fef3c7', border: '1px solid #f5d98a', borderRadius: 12, padding: '9px 13px', fontSize: 14.5, margin: '8px 0' }}>🤝 {e.f.corrige}</div>}
        <Dialogue sc={sc} paragraphes={paragraphes} p={p} e={e} />
        {sc.fiches && <FichesPercutafeine ids={e.scene === 'docs' ? docsDe(e) : sc.fiches} ouvert={e.scene === 'docs'} />}
        {!fin && !['hub', 'docs', 'intro', 'intro2'].includes(e.scene) && (() => { const autres = docsDe(e).filter(d => !(sc.fiches || []).includes(d)); return autres.length ? <details data-dossier style={{ margin: '12px 0', background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '8px 14px' }}><summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>📄 Dossier du TP : notice, fiches techniques, modes opératoires</summary><FichesPercutafeine ids={autres} /></details> : null; })()}
        {sc.formule && <div data-relation style={{ margin: '12px 0', background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '8px 12px', overflowX: 'auto' }}>{FORMULES[sc.formule]}</div>}
        {sc.video && <figure data-video style={{ margin: '12px 0' }}><video controls playsInline preload="metadata" aria-label={sc.video.legende} src={`${import.meta.env.BASE_URL}${sc.video.src}`} style={{ width: '100%', maxWidth: 520, maxHeight: '60vh', display: 'block', margin: '0 auto', borderRadius: 14, background: '#0f2430', boxShadow: '0 6px 18px rgba(0,0,0,.2)' }} /><figcaption style={{ fontSize: 13, color: C.doux, textAlign: 'center', marginTop: 6 }}>{sc.video.legende}</figcaption></figure>}
        {vis.map((v, i) => <Visuel key={i} v={v} />)}
        {sc.hyp && <details data-hyp open style={{ margin: '12px 0', background: C.fond, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '9px 14px', fontSize: 14.5, lineHeight: 1.55 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Hypothèses de travail</summary>{sc.hyp}</details>}

        {sc.station === 'formule' && <StationFormule key={e.scene + e.t} e={e} onEtat={setEtat} />}
        {sc.station === 'ph' && <StationPh e={e} onEtat={setEtat} />}
        {sc.station === 'plan' && <StationPlan key={e.scene + e.t} e={e} sc={sc} onEtat={setEtat} />}
        {sc.station === 'obs' && <StationObs e={e} onEtat={setEtat} />}
        {sc.station === 'titrage' && <StationTitrage key={e.scene} e={e} sc={sc} onEtat={setEtat} />}
        {sc.station === 'rheo' && <StationRheo key={e.scene} e={e} onEtat={setEtat} />}
        {sc.station === 'cpgsim' && <StationCpgSim key={e.scene} e={e} sc={sc} onEtat={setEtat} />}
        {sc.station === 'schema' && <StationSchema key={e.scene} e={e} sc={sc} onEtat={setEtat} />}
        {sc.calcul && <Calcul key={e.scene} e={e} sc={sc} onEtat={setEtat} />}

        {hub && <Paillasse e={e} s={s} choix={choix} onChoix={avancer} />}
        {!hub && !sc.calcul && !sc.station && choix.map((c, i) => (
          <button key={i} type="button" className="pc-choix" data-choix={i} onClick={() => avancer(c)}><span className="pc-badge" aria-hidden="true">{lettre(i)}</span><span>{c.t}{c.d && <span style={{ display: 'block', fontSize: 13.5, color: C.doux, marginTop: 3 }}>{c.d}</span>}</span></button>))}

        {fin && (<>
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Résumé de tes choix</h4>
          <ul data-resume style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.6 }}>{resume(e).map((t, i) => <li key={i}>{t}</li>)}</ul>
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Le film de ta journée</h4>
          <Film e={e} />
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Tes choix et leurs conséquences</h4>
          <Conseq e={e} />
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Bilan par compétence</h4>
          <div data-bilan className="pc-grille">{bilan(e).map(b => { const [ic, col, lib] = NIVEAUX[b.niveau]; return (
            <div key={b.comp} style={{ display: 'flex', gap: 10, padding: '10px 12px', border: `1px solid ${C.bord}`, borderLeft: `5px solid ${col}`, borderRadius: 12, fontSize: 14.5, lineHeight: 1.5, background: '#fff' }}>
              <span aria-label={lib} title={lib} style={{ fontSize: 20 }}>{ic}</span>
              <div><b>{b.comp}</b> · {b.titre} <span style={{ color: col, fontWeight: 700 }}>({lib})</span><div style={{ color: C.doux }}>{b.texte}</div></div>
            </div>); })}</div>
          <FicheCorrection e={e} />
          <h4 style={{ margin: '20px 0 8px', fontSize: 17 }}>Ta fiche de fabrication</h4>
          <Fiche e={e} />
          <button type="button" className="pc-btn" data-rejouer onClick={() => { setEtat(null); setCarnetOuvert(false); }} style={{ marginTop: 16 }}>Rejouer</button>
          {boiteFins}
        </>)}
      </div>
      {!fin && <FicheFormulation e={e} setEtat={setEtat} />}
      <div data-carnet style={{ marginTop: 20, border: `1.5px dashed ${C.bord}`, borderRadius: 14, padding: '10px 14px', background: C.fond }}>
        <button type="button" onClick={() => setCarnetOuvert(o => !o)} aria-expanded={carnetOuvert} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 700, cursor: 'pointer', padding: 0, color: C.encre }}>📓 Cahier de laboratoire ({e.carnet.length}) {carnetOuvert ? '▾' : '▸'}</button>
        {carnetOuvert && (e.carnet.length ? <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6, color: C.doux }}>{e.carnet.map((l, i) => <li key={i}>{l}</li>)}</ul> : <div style={{ fontSize: 14, color: C.doux, marginTop: 6 }}>Rien de noté pour l'instant.</div>)}
      </div>
      {!fin && <RevoirResultats e={e} />}
      {!fin && <div style={{ fontSize: 12.5, color: C.doux, marginTop: 10 }}>Ta partie est enregistrée sur cet appareil. <button type="button" onClick={() => { if (window.confirm('Abandonner cette partie et recommencer ?')) { setEtat(null); setCarnetOuvert(false); } }} style={{ background: 'none', border: 'none', padding: 0, color: C.accent, textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>Recommencer</button></div>}
    </div>);
}
