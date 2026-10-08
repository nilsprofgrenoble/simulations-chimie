import { useState, useEffect, useRef, useMemo } from "react";
import { fmt, lireNombre, KIT, styleBoite, stylePetitBouton, Section, LigneMesure } from "../commun";

// ============================================================
//  PARAMÈTRES DE SOLUBILITÉ DE HANSEN — exploration libre
//  Reprend toutes les fonctions de la simulation d'origine (sphère 3D, banque de solvants, mélanges de 2 ou 3 solvants,
//  optimisation, résine modifiable, propriétés d'évaporation), avec la mise en page et les couleurs du parcours guidé.
//  Distance de Hansen : Ra² = 4(Δδd)² + (Δδp)² + (Δδh)² ; un solvant dissout le polymère si RED = Ra / R0 < 1.
// ============================================================

// Banque de solvants, rangée par familles. d = [δd, δp, δh] (MPa½) ; pvap en hPa à 20 °C ; ie : indice d'évaporation
// (acétate de butyle = 1), null si la donnée n'est pas renseignée ; rho en g/mL ; M en g/mol.
// Valeurs de δ : tables usuelles (C. M. Hansen, Hansen Solubility Parameters: A User's Handbook). pvap et ie : indicatifs.
export const FAMILLES = [
  { nom: 'Alcools', solvants: {
    'Méthanol':                 { d: [14.7, 12.3, 22.3], pvap: 129, ie: 4.5, rho: 0.791, M: 32.0 },
    'Éthanol':                  { d: [15.8, 8.8, 19.4], pvap: 59, ie: 2.7, rho: 0.789, M: 46.1 },
    '1-Propanol':               { d: [16.0, 6.8, 17.4], pvap: 20, ie: 0.42, rho: 0.803, M: 60.1 },
    'Isopropanol (2-propanol)': { d: [15.8, 6.1, 16.4], pvap: 44, ie: 1.7, rho: 0.786, M: 60.1 },
    '1-Butanol':                { d: [16.0, 5.7, 15.8], pvap: 6.7, ie: 0.46, rho: 0.810, M: 74.1 },
    'Alcool benzylique':        { d: [18.4, 6.3, 13.7], pvap: 0.1, ie: null, rho: 1.045, M: 108.1 },
    'Diacétone alcool':         { d: [15.8, 8.2, 10.8], pvap: 2, ie: 0.18, rho: 0.938, M: 116.2 },
  } },
  { nom: 'Glycols et éthers de glycol', solvants: {
    'Éthylène glycol':                    { d: [17.0, 11.0, 26.0], pvap: 0.08, ie: null, rho: 1.113, M: 62.1 },
    'Glycérol':                           { d: [17.4, 12.1, 29.3], pvap: 0.0001, ie: null, rho: 1.261, M: 92.1 },
    'Méthoxypropanol (PM)':               { d: [15.6, 6.3, 11.6], pvap: 12, ie: 0.7, rho: 0.92, M: 90.1 },
    'Butylglycol (2-butoxyéthanol)':      { d: [16.0, 5.1, 12.3], pvap: 0.8, ie: 0.08, rho: 0.90, M: 118.2 },
    'Acétate de méthoxypropyle (PGMEA)':  { d: [15.6, 5.6, 9.8], pvap: 5, ie: 0.33, rho: 0.97, M: 132.2 },
  } },
  { nom: 'Esters', solvants: {
    'Acétate de méthyle':      { d: [15.5, 7.2, 7.6], pvap: 228, ie: 8.5, rho: 0.934, M: 74.1 },
    'Acétate d\'éthyle':       { d: [15.8, 5.3, 7.2], pvap: 97, ie: 4.1, rho: 0.902, M: 88.1 },
    'Acétate de butyle':       { d: [15.8, 3.7, 6.3], pvap: 11, ie: 1.0, rho: 0.882, M: 116.2 },
    'Lactate d\'éthyle':       { d: [16.0, 7.6, 12.5], pvap: 2, ie: 0.22, rho: 1.03, M: 118.1 },
    'Carbonate de propylène':  { d: [20.0, 18.0, 4.1], pvap: 0.04, ie: null, rho: 1.20, M: 102.1 },
  } },
  { nom: 'Cétones', solvants: {
    'Acétone':                       { d: [15.5, 10.4, 7.0], pvap: 233, ie: 7.7, rho: 0.791, M: 58.1 },
    'Butanone (MEK)':                { d: [16.0, 9.0, 5.1], pvap: 95, ie: 3.7, rho: 0.805, M: 72.1 },
    'Méthylisobutylcétone (MIBK)':   { d: [15.3, 6.1, 4.1], pvap: 21, ie: 1.6, rho: 0.80, M: 100.2 },
    'Cyclohexanone':                 { d: [17.8, 8.4, 5.1], pvap: 4.5, ie: 0.29, rho: 0.95, M: 98.1 },
  } },
  { nom: 'Éthers', solvants: {
    'Diéthyl éther':            { d: [14.5, 2.9, 4.6], pvap: 587, ie: 19.0, rho: 0.713, M: 74.1 },
    'Tétrahydrofurane (THF)':   { d: [16.8, 5.7, 8.0], pvap: 200, ie: 6.3, rho: 0.889, M: 72.1 },
  } },
  { nom: 'Hydrocarbures', solvants: {
    'Hexane':       { d: [14.9, 0.0, 0.0], pvap: 160, ie: 8.3, rho: 0.659, M: 86.2 },
    'Heptane':      { d: [15.3, 0.0, 0.0], pvap: 48, ie: null, rho: 0.684, M: 100.2 },
    'Cyclohexane':  { d: [16.8, 0.0, 0.2], pvap: 103, ie: 3.1, rho: 0.779, M: 84.2 },
    'Toluène':      { d: [18.0, 1.4, 2.0], pvap: 37, ie: 2.0, rho: 0.867, M: 92.1 },
    'Xylène':       { d: [17.6, 1.0, 3.1], pvap: 9, ie: 0.67, rho: 0.864, M: 106.2 },
    'D-limonène':   { d: [17.2, 1.8, 4.3], pvap: 2, ie: null, rho: 0.84, M: 136.2 },
  } },
  { nom: 'Solvants chlorés', solvants: {
    'Dichlorométhane': { d: [18.2, 6.3, 6.1], pvap: 470, ie: 14.0, rho: 1.325, M: 84.9 },
    'Chloroforme':     { d: [18.0, 3.1, 5.7], pvap: 211, ie: 6.7, rho: 1.489, M: 119.4 },
  } },
  { nom: 'Solvants polaires aprotiques', solvants: {
    'Acétonitrile':              { d: [15.3, 18.0, 6.1], pvap: 97, ie: 4.7, rho: 0.786, M: 41.1 },
    'Diméthylformamide (DMF)':   { d: [17.4, 13.7, 11.3], pvap: 4, ie: 0.03, rho: 0.944, M: 73.1 },
    'Diméthylsulfoxyde (DMSO)':  { d: [18.4, 16.4, 10.2], pvap: 0.8, ie: 0.01, rho: 1.100, M: 78.1 },
    'N-méthylpyrrolidone (NMP)': { d: [18.0, 12.3, 7.2], pvap: 0.4, ie: 0.01, rho: 1.028, M: 99.1 },
  } },
  { nom: 'Eau', solvants: {
    'Eau': { d: [15.5, 16.0, 42.3], pvap: 23, ie: 0.3, rho: 1.000, M: 18.0 },
  } },
];

// Polymères proposés (on peut tout modifier). R0 : rayon de la sphère de solubilité.
const POLYMERES = [
  { id: 'nc-tp', nom: 'Nitrocellulose (données du TP)', d: 17, p: 8.7, h: 9.3, R0: 9.0, source: 'Données fournies avec l’activité.' },
  { id: 'nc-h', nom: 'Nitrocellulose (moyenne citée par Hansen)', d: 16.2, p: 14.1, h: 9.5, R0: 10.7, source: 'Moyenne de valeurs citées par C. M. Hansen (Handbook, 2007).' },
  { id: 'pmma', nom: 'PMMA', d: 18.6, p: 10.5, h: 5.1, R0: 8.6, source: 'Valeur usuelle des tables de Hansen.' },
  { id: 'ps', nom: 'Polystyrène', d: 21.3, p: 5.8, h: 4.3, R0: 12.7, source: 'Valeur usuelle des tables de Hansen.' },
];

const C_DANS = '#15803d', C_HORS = '#b91c1c', C_POLY = '#166534', C_MEL = '#facc15';
const distance = (P, s) => Math.sqrt(4 * (s[0] - P[0]) ** 2 + (s[1] - P[1]) ** 2 + (s[2] - P[2]) ** 2);
const fmtPvap = v => (v < 0.01 ? '< 0,01' : fmt(v, v < 1 ? 2 : v < 10 ? 1 : 0));

export function HansenExploration({ plotlyReady }) {
  // ── Le polymère ──
  const [polyId, setPolyId] = useState('nc-tp');
  const [poly, setPoly] = useState({ ...POLYMERES[0] });
  function choisirPolymere(id) { const q = POLYMERES.find(x => x.id === id); setPolyId(id); setPoly({ ...q }); }
  function modifierPoly(k, v) { setPolyId('perso'); setPoly(o => ({ ...o, [k]: k === 'nom' ? v : lireNombre(v) })); }
  const centre = [poly.d, poly.p, poly.h];
  const R0 = poly.R0 > 0 ? poly.R0 : NaN;

  // ── La banque de solvants (avec les solvants ajoutés par l'utilisateur) ──
  const [ajoutes, setAjoutes] = useState({});
  const familles = useMemo(() => (Object.keys(ajoutes).length ? [...FAMILLES, { nom: 'Mes solvants', solvants: ajoutes }] : FAMILLES), [ajoutes]);
  const SOLVANTS = useMemo(() => Object.assign({}, ...familles.map(f => f.solvants)), [familles]);
  const [coches, setCoches] = useState(() => new Set(['Acétate d\'éthyle', 'Acétate de butyle', 'Éthanol', 'Isopropanol (2-propanol)', 'Acétone']));
  const cochesListe = Object.keys(SOLVANTS).filter(s => coches.has(s));
  const basculer = s => setCoches(c => { const n = new Set(c); if (n.has(s)) n.delete(s); else n.add(s); return n; });
  const basculerFamille = f => setCoches(c => { const noms = Object.keys(f.solvants), tous = noms.every(s => c.has(s)), n = new Set(c); noms.forEach(s => (tous ? n.delete(s) : n.add(s))); return n; });
  const [recherche, setRecherche] = useState('');
  const [nouveau, setNouveau] = useState({ nom: '', d: '', p: '', h: '' });
  function ajouterSolvant() {
    const v = [lireNombre(nouveau.d), lireNombre(nouveau.p), lireNombre(nouveau.h)];
    if (!nouveau.nom.trim() || v.some(x => !isFinite(x))) return;
    setAjoutes(a => ({ ...a, [nouveau.nom.trim()]: { d: v, pvap: null, ie: null, rho: null, M: null } }));
    setCoches(c => new Set(c).add(nouveau.nom.trim()));
    setNouveau({ nom: '', d: '', p: '', h: '' });
  }
  const red = s => distance(centre, SOLVANTS[s].d) / R0;

  // ── Le mélange : ses solvants sont choisis parmi les solvants cochés ──
  const [mix, setMix] = useState([{ s: 'Acétate d\'éthyle', pct: 50 }, { s: 'Éthanol', pct: 50 }, { s: 'Acétate de butyle', pct: 0 }]);
  const [trois, setTrois] = useState(false);
  const [voirMel, setVoirMel] = useState(true);
  useEffect(() => {   // si un solvant du mélange est décoché, on le remplace par un solvant coché
    setMix(m => {
      let change = false; const pris = new Set();
      const n = m.map(x => {
        if (coches.has(x.s) && !pris.has(x.s)) { pris.add(x.s); return x; }
        const libre = cochesListe.find(s => !pris.has(s) && !m.some(y => y.s === s && coches.has(y.s)));
        change = true; if (libre) pris.add(libre); return { ...x, s: libre ?? x.s };
      });
      return change ? n : m;
    });
  }, [coches]); // eslint-disable-line react-hooks/exhaustive-deps
  const actifs = mix.slice(0, trois ? 3 : 2);
  const melangePossible = cochesListe.length >= 2 && actifs.every(x => coches.has(x.s)) && new Set(actifs.map(x => x.s)).size === actifs.length;
  const totPct = actifs.reduce((a, x) => a + (x.pct || 0), 0);
  const ptMel = melangePossible && totPct > 0 ? [0, 1, 2].map(k => actifs.reduce((a, x) => a + x.pct / totPct * SOLVANTS[x.s].d[k], 0)) : null;
  const redMel = ptMel ? distance(centre, ptMel) / R0 : null;

  // Optimiser les proportions des solvants choisis (on minimise la distance de Hansen Ra au polymère)
  function optimiser() {
    const sv = actifs.map(x => SOLVANTS[x.s].d); let best = null, bs = Infinity;
    const essai = f => { const pt = [0, 1, 2].map(k => f.reduce((a, fi, i) => a + fi * sv[i][k], 0)); const sc = distance(centre, pt); if (sc < bs - 1e-9) { bs = sc; best = f; } };
    if (sv.length === 2) for (let i = 0; i <= 100; i++) essai([i / 100, 1 - i / 100]);
    else for (let i = 0; i <= 100; i += 2) for (let j = 0; j <= 100 - i; j += 2) essai([i / 100, j / 100, (100 - i - j) / 100]);
    setMix(m => m.map((x, i) => (i < sv.length ? { ...x, pct: Math.round(best[i] * 100) } : x))); setVoirMel(true);
  }
  // Chercher le meilleur mélange de 2 ou 3 solvants parmi tous les solvants cochés
  const [infoMeilleur, setInfoMeilleur] = useState(null);
  function meilleurParmiCoches() {
    const L = cochesListe, d = L.map(s => SOLVANTS[s].d); let best = null, bs = Infinity;
    const score = (idx, f) => { const pt = [0, 1, 2].map(k => idx.reduce((a, ii, n) => a + f[n] * d[ii][k], 0)); return distance(centre, pt); };
    for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) for (let i = 0; i <= 100; i++) { const sc = score([a, b], [i / 100, 1 - i / 100]); if (sc < bs - 1e-9) { bs = sc; best = { idx: [a, b], f: [i, 100 - i] }; } }
    if (L.length <= 40) for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) for (let c = b + 1; c < L.length; c++)
      for (let i = 5; i <= 90; i += 5) for (let j = 5; j <= 95 - i; j += 5) { const sc = score([a, b, c], [i / 100, j / 100, (100 - i - j) / 100]); if (sc < bs - 0.05) { bs = sc; best = { idx: [a, b, c], f: [i, j, 100 - i - j] }; } }
    if (!best) return;
    const n = best.idx.map((ii, k) => ({ s: L[ii], pct: best.f[k] }));
    setTrois(n.length === 3); setMix(m => [...n, ...m.slice(n.length)].slice(0, 3)); setVoirMel(true);
    setInfoMeilleur(`Meilleur mélange trouvé parmi les ${L.length} solvants cochés : RED = ${fmt(bs / R0, 2)}${n.length === 3 ? ' (un 3e solvant n’est retenu que s’il rapproche nettement du centre)' : ''}.`);
  }

  const cleCoches = cochesListe.join('|'), cleMel = ptMel ? ptMel.join() : '', cleActifs = JSON.stringify(actifs);
  // ── Propriétés d'évaporation du mélange (approximations, voir l'encadré) ──
  const [voirEvap, setVoirEvap] = useState(false);
  const evap = useMemo(() => {
    if (!ptMel) return null;
    const S = actifs.map(x => ({ ...SOLVANTS[x.s], nom: x.s, fv: x.pct / totPct }));
    const manque = S.filter(x => x.ie == null || x.rho == null || x.M == null || x.pvap == null).map(x => x.nom);
    if (manque.length) return { manque };
    const masses = S.map(x => x.fv * x.rho), tm = masses.reduce((a, b) => a + b, 0);
    const moles = S.map((x, i) => masses[i] / tm / x.M), tn = moles.reduce((a, b) => a + b, 0);
    return { ie: S.reduce((a, x) => a + x.fv * x.ie, 0), pvap: S.reduce((a, x, i) => a + moles[i] / tn * x.pvap, 0) };
  }, [cleActifs, cleMel, SOLVANTS]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Les graphiques (Plotly) ──
  const [vue, setVue] = useState('deux');
  const [noms, setNoms] = useState(true);
  const ref3d = useRef(null), ref2d = useRef(null);
  useEffect(() => {
    const Plotly = window.Plotly;
    if (!Plotly || !isFinite(R0)) return;
    const dans = cochesListe.filter(s => red(s) < 1), hors = cochesListe.filter(s => red(s) >= 1);
    const mode = noms ? 'markers+text' : 'markers';
    const survol = l => l.map(s => `${s}<br>RED = ${fmt(red(s), 2)}`);
    // 3D : axes 2δd, δp, δh — avec le facteur 2 sur δd, le domaine de solubilité est une vraie sphère
    if (ref3d.current) {
      const u = [], v = []; for (let i = 0; i < 48; i++) u.push(2 * Math.PI * i / 47); for (let i = 0; i < 24; i++) v.push(Math.PI * i / 23);
      const X = v.map(a => u.map(b => R0 * Math.sin(a) * Math.cos(b) + 2 * centre[0])), Y = v.map(a => u.map(b => R0 * Math.sin(a) * Math.sin(b) + centre[1])), Z = v.map(a => u.map(() => R0 * Math.cos(a) + centre[2]));
      const nuage = (l, c, nom) => ({ type: 'scatter3d', mode, name: nom, x: l.map(s => 2 * SOLVANTS[s].d[0]), y: l.map(s => SOLVANTS[s].d[1]), z: l.map(s => SOLVANTS[s].d[2]),
        text: l, hovertext: survol(l), hoverinfo: 'text', textposition: 'top center', textfont: { size: 11, color: c }, marker: { color: c, size: 5 } });
      const data = [
        { type: 'surface', x: X, y: Y, z: Z, opacity: 0.22, colorscale: [[0, '#86efac'], [1, '#86efac']], showscale: false, hoverinfo: 'skip', name: 'Sphère' },
        nuage(dans, C_DANS, 'Dans la sphère (RED < 1)'), nuage(hors, C_HORS, 'Hors de la sphère'),
        { type: 'scatter3d', mode: 'markers+text', name: poly.nom || 'Polymère', x: [2 * centre[0]], y: [centre[1]], z: [centre[2]], text: [poly.nom], textposition: 'top center',
          textfont: { color: C_POLY, size: 12 }, marker: { color: C_POLY, size: 7, symbol: 'diamond' }, hoverinfo: 'text', hovertext: [poly.nom] },
      ];
      if (ptMel && voirMel) data.push({ type: 'scatter3d', mode: 'markers+text', name: 'Mélange', x: [2 * ptMel[0]], y: [ptMel[1]], z: [ptMel[2]], text: ['mélange'], textposition: 'bottom center',
        marker: { color: C_MEL, size: 7, symbol: 'diamond', line: { color: KIT.txt, width: 2 } }, hoverinfo: 'text', hovertext: [`Mélange<br>RED = ${fmt(redMel, 2)}`] });
      Plotly.react(ref3d.current, data, {
        margin: { l: 0, r: 0, b: 0, t: 0 }, paper_bgcolor: 'white', font: { color: KIT.txt, size: 12 }, showlegend: true, legend: { orientation: 'h', y: 0, font: { size: 11 } },
        scene: { aspectmode: 'data', dragmode: 'orbit', xaxis: { title: '2·δd (MPa½)' }, yaxis: { title: 'δp (MPa½)' }, zaxis: { title: 'δh (MPa½)' } },
      }, { displayModeBar: false, responsive: true });
    }
    // 2D : projection de la sphère sur le plan δp–δh, axes orthonormés
    if (ref2d.current) {
      const cx = [], cy = []; for (let t = 0; t <= 2 * Math.PI + 0.01; t += 0.04) { cx.push(centre[1] + R0 * Math.cos(t)); cy.push(centre[2] + R0 * Math.sin(t)); }
      const nuage = (l, c, nom) => ({ type: 'scatter', mode, name: nom, x: l.map(s => SOLVANTS[s].d[1]), y: l.map(s => SOLVANTS[s].d[2]), text: l, hovertext: survol(l), hoverinfo: 'text',
        textposition: 'top center', textfont: { size: 11, color: c }, marker: { color: c, size: 8 } });
      const data = [
        { type: 'scatter', mode: 'lines', x: cx, y: cy, fill: 'toself', fillcolor: 'rgba(134,239,172,0.25)', line: { color: '#16a34a', width: 2 }, name: 'Projection de la sphère', hoverinfo: 'skip' },
        nuage(dans, C_DANS, 'Dans la sphère'), nuage(hors, C_HORS, 'Hors de la sphère'),
        { type: 'scatter', mode: 'markers+text', x: [centre[1]], y: [centre[2]], text: [poly.nom], textposition: 'top center', textfont: { color: C_POLY }, marker: { color: C_POLY, size: 11, symbol: 'diamond' }, name: poly.nom || 'Polymère' },
      ];
      if (ptMel && voirMel) {
        const sv = actifs.map(x => SOLVANTS[x.s].d), cols = ['#e9a824', '#6a4c93', '#2a9d8f'];
        if (sv.length === 2) data.push({ type: 'scatter', mode: 'lines', x: sv.map(s => s[1]), y: sv.map(s => s[2]), line: { color: '#94a3b8', dash: 'dot', width: 2 }, showlegend: false, hoverinfo: 'skip' });
        else data.push({ type: 'scatter', mode: 'lines', x: [...sv, sv[0]].map(s => s[1]), y: [...sv, sv[0]].map(s => s[2]), line: { color: '#94a3b8', dash: 'dot', width: 2 }, showlegend: false, hoverinfo: 'skip' });
        actifs.forEach((x, i) => data.push({ type: 'scatter', mode: 'lines', x: [ptMel[1], sv[i][1]], y: [ptMel[2], sv[i][2]], line: { color: cols[i], width: 2.5 }, name: `${Math.round(x.pct / totPct * 100)} % ${x.s}`, hoverinfo: 'skip' }));
        data.push({ type: 'scatter', mode: 'markers', x: [ptMel[1]], y: [ptMel[2]], marker: { color: C_MEL, size: 13, symbol: 'diamond', line: { color: KIT.txt, width: 2 } }, name: 'Mélange', hovertext: [`Mélange<br>RED = ${fmt(redMel, 2)}`], hoverinfo: 'text' });
      }
      Plotly.react(ref2d.current, data, {
        xaxis: { title: 'δp (MPa½)', scaleanchor: 'y', scaleratio: 1, zeroline: false, gridcolor: '#eef2f7' },
        yaxis: { title: 'δh (MPa½)', zeroline: false, gridcolor: '#eef2f7' },
        margin: { t: 10, b: 40, l: 50, r: 10 }, paper_bgcolor: 'white', plot_bgcolor: 'white', font: { color: KIT.txt, size: 12 },
        legend: { orientation: 'h', y: -0.22, font: { size: 11 } },
      }, { displayModeBar: false, responsive: true });
    }
  }, [plotlyReady, vue, noms, poly, cleCoches, SOLVANTS, voirMel, cleMel, cleActifs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ════════════════ BLOCS ════════════════
  const champ = { fontSize: 14, padding: '4px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 70 };
  const blocVue = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>L'espace de Hansen</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[['deux', 'Les deux'], ['3d', 'Sphère 3D'], ['2d', 'Projection δp–δh']].map(([k, n]) => <button key={k} onClick={() => setVue(k)} style={stylePetitBouton(vue === k, '#334155')}>{n}</button>)}
          <button onClick={() => setNoms(v => !v)} style={stylePetitBouton(!noms, '#334155')} title="Afficher ou masquer les noms des solvants">🏷️ {noms ? 'Masquer les noms' : 'Afficher les noms'}</button>
        </div>
      </div>
      {!window.Plotly && <div style={{ fontSize: 13.5, color: KIT.txt2, padding: 20, textAlign: 'center' }}>Chargement des graphiques…</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {vue !== '2d' && <div ref={ref3d} style={{ flex: '1 1 320px', minWidth: 280, height: 430, background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}/>}
        {vue !== '3d' && <div ref={ref2d} style={{ flex: '1 1 320px', minWidth: 280, height: 430, background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}/>}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.45 }}>
        Sphère 3D : faites-la tourner dans tous les sens avec la souris ; les axes sont 2δd, δp et δh, pour que le domaine de solubilité soit une vraie sphère.
        Projection : c'est l'« ombre » de la sphère sur le plan δp–δh (axes orthonormés). Un point dans le disque peut être hors de la sphère à cause de son δd : la couleur,
        elle, tient compte des trois paramètres (vert : RED &lt; 1). Survolez un point pour lire son RED.
      </div>
    </div>
  );
  const blocPoly = (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Le polymère</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {POLYMERES.map(q => <button key={q.id} onClick={() => choisirPolymere(q.id)} style={stylePetitBouton(polyId === q.id, '#15803d')}>{q.nom}</button>)}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>Nom
        <input value={poly.nom} onChange={e => modifierPoly('nom', e.target.value)} style={{ ...champ, width: 200 }}/></label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['d', 'δd'], ['p', 'δp'], ['h', 'δh'], ['R0', 'R0']].map(([k, n]) => (
          <label key={k} style={{ display: 'flex', flexDirection: 'column', fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{n} (MPa½)
            <input type="number" step="0.1" value={isFinite(poly[k]) ? poly[k] : ''} onChange={e => modifierPoly(k, e.target.value)} style={champ}/></label>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>{polyId === 'perso' ? 'Valeurs personnalisées.' : POLYMERES.find(q => q.id === polyId).source}</div>
    </div>
  );
  const selectSolvant = (i) => (
    <select value={mix[i].s} onChange={e => { const v = e.target.value; setMix(m => m.map((x, j) => (j === i ? { ...x, s: v } : x))); }} aria-label={`Solvant ${i + 1} du mélange`}
      style={{ fontSize: 13.5, padding: '3px 4px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, maxWidth: 210 }}>
      {cochesListe.map(s => <option key={s} value={s} disabled={mix.some((x, j) => j !== i && j < (trois ? 3 : 2) && x.s === s)}>{s}</option>)}
    </select>
  );
  const blocMel = (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mon mélange</div>
      {cochesListe.length < 2 ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Cochez au moins deux solvants dans la banque : le mélange se compose parmi les solvants cochés.</div> : <>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>Choisis parmi les {cochesListe.length} solvants cochés ; proportions en volume.</div>
        {[0, 1, 2].map(i => (i < 2 || trois) && (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            {selectSolvant(i)}
            <input type="number" min="0" max="100" value={mix[i].pct} aria-label={`Proportion du solvant ${i + 1}`}
              onChange={e => { const v = Math.max(0, lireNombre(e.target.value) || 0); setMix(m => m.map((x, j) => (j === i ? { ...x, pct: v } : x))); }} style={{ ...champ, width: 60 }}/>
            <span style={{ fontSize: 13 }}>%</span>
          </div>
        ))}
        <label style={{ display: 'flex', gap: 6, fontSize: 13.5, color: KIT.txt, margin: '4px 0 8px' }}>
          <input type="checkbox" checked={trois} disabled={cochesListe.length < 3} onChange={e => setTrois(e.target.checked)}/> un 3e solvant{cochesListe.length < 3 ? ' (cochez-en au moins trois)' : ''}</label>
        {totPct > 0 && Math.abs(totPct - 100) > 0.5 && <div style={{ fontSize: 12.5, color: '#b45309', marginBottom: 6 }}>Total : {fmt(totPct, 0)} % — les proportions sont ramenées à 100 %.</div>}
        {ptMel && <>
          <LigneMesure nom="Point du mélange (δd ; δp ; δh)" valeur={`${fmt(ptMel[0], 1)} ; ${fmt(ptMel[1], 1)} ; ${fmt(ptMel[2], 1)}`}/>
          <LigneMesure nom="RED du mélange" valeur={`${fmt(redMel, 2)} : ${redMel < 1 ? 'dissout le polymère' : 'ne le dissout pas'}`} couleur={redMel < 1 ? C_DANS : C_HORS}/>
        </>}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
          <button onClick={optimiser} disabled={!melangePossible} style={stylePetitBouton(true, '#6a4c93')} title="Proportions qui rapprochent le plus le mélange du centre de la sphère">Optimiser les proportions</button>
          <button onClick={meilleurParmiCoches} style={stylePetitBouton(false, '#6a4c93')} title="Essaie tous les mélanges de 2 ou 3 solvants cochés">Meilleur mélange parmi les cochés</button>
          <button onClick={() => setVoirMel(v => !v)} style={stylePetitBouton(false)}>{voirMel ? 'Masquer sur le graphique' : 'Visualiser'}</button>
        </div>
        {infoMeilleur && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>{infoMeilleur}</div>}
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>« Optimiser » minimise la distance de Hansen Ra entre le mélange et le polymère. Le point d'un mélange est la moyenne des points des solvants, pondérée par leurs fractions volumiques.</div>
      </>}
    </div>
  );
  const filtre = recherche.trim().toLowerCase();
  const blocBanque = (
    <div style={{ ...styleBoite, gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>Banque de solvants <span style={{ fontWeight: 400, fontSize: 13, color: KIT.txt2 }}>({cochesListe.length} coché{cochesListe.length > 1 ? 's' : ''} sur {Object.keys(SOLVANTS).length})</span></div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔎 Rechercher" aria-label="Rechercher un solvant" style={{ ...champ, width: 150 }}/>
          <button onClick={() => setCoches(new Set(Object.keys(SOLVANTS)))} style={stylePetitBouton(false)}>Tout cocher</button>
          <button onClick={() => setCoches(new Set())} style={stylePetitBouton(false)}>Tout décocher</button>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {familles.map(f => {
          const liste = Object.keys(f.solvants).filter(s => !filtre || s.toLowerCase().includes(filtre));
          if (!liste.length) return null;
          const tous = Object.keys(f.solvants).every(s => coches.has(s));
          return (
            <div key={f.nom} style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '6px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>{f.nom}</span>
                <button onClick={() => basculerFamille(f)} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, border: `1px solid ${KIT.bord}`, background: tous ? '#e2e8f0' : 'white', cursor: 'pointer' }}>{tous ? 'décocher' : 'tout cocher'}</button>
              </div>
              {liste.map(s => {
                const r = isFinite(R0) ? red(s) : NaN, c = coches.has(s);
                return (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: KIT.txt, cursor: 'pointer', padding: '1px 0' }}>
                    <input type="checkbox" checked={c} onChange={() => basculer(s)}/>
                    <span style={{ flex: 1 }}>{s}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r < 1 ? C_DANS : C_HORS, minWidth: 74, textAlign: 'right' }} title="RED = Ra / R0">RED {fmt(r, 2)}</span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 10, fontSize: 13.5, color: KIT.txt }}>
        <strong>Ajouter un solvant :</strong>
        <input value={nouveau.nom} onChange={e => setNouveau(o => ({ ...o, nom: e.target.value }))} placeholder="nom" aria-label="Nom du nouveau solvant" style={{ ...champ, width: 150 }}/>
        {['d', 'p', 'h'].map(k => <input key={k} value={nouveau[k]} onChange={e => setNouveau(o => ({ ...o, [k]: e.target.value }))} placeholder={`δ${k}`} aria-label={`δ${k} du nouveau solvant`} style={{ ...champ, width: 60 }}/>)}
        <button onClick={ajouterSolvant} style={stylePetitBouton(true, '#0f766e')}>+ Ajouter</button>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>Valeurs de δ : tables usuelles de Hansen. RED = Ra / R0, avec Ra² = 4(Δδd)² + (Δδp)² + (Δδh)² : vert si RED &lt; 1 (le solvant doit dissoudre le polymère), rouge sinon.</div>
    </div>
  );
  const blocEvap = (
    <div style={{ ...styleBoite, gridColumn: '1 / -1' }}>
      <Section titre="Propriétés d'évaporation du mélange" ouvert={voirEvap} onBascule={() => setVoirEvap(v => !v)}>
        {!evap ? <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Composez d'abord un mélange.</div>
          : evap.manque ? <div style={{ fontSize: 13.5, color: '#b45309' }}>Données d'évaporation non renseignées pour : {evap.manque.join(', ')}.</div> : <>
            <LigneMesure nom="Indice d'évaporation du mélange (acétate de butyle = 1)" valeur={`${fmt(evap.ie, 2)} : ${evap.ie > 3 ? 'séchage rapide' : evap.ie > 1 ? 'séchage moyen' : 'séchage lent'}`}
              couleur={evap.ie > 3 ? '#0f766e' : evap.ie > 1 ? '#b45309' : '#b91c1c'}/>
            <LigneMesure nom="Pression de vapeur du mélange à 20 °C (loi de Raoult)" valeur={`${fmt(evap.pvap, 1)} hPa`}/>
          </>}
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
            <thead><tr>{['Solvant coché', 'δd', 'δp', 'δh', 'Pvap 20 °C (hPa)', 'Indice d’évap.', 'RED'].map(h => <th key={h} style={cell}>{h}</th>)}</tr></thead>
            <tbody>{cochesListe.map(s => { const q = SOLVANTS[s], r = red(s); return (
              <tr key={s}><td style={{ ...cell, textAlign: 'left' }}>{s}</td><td style={cell}>{fmt(q.d[0], 1)}</td><td style={cell}>{fmt(q.d[1], 1)}</td><td style={cell}>{fmt(q.d[2], 1)}</td>
                <td style={cell}>{q.pvap == null ? '—' : fmtPvap(q.pvap)}</td><td style={cell}>{q.ie == null ? '—' : fmt(q.ie, 2)}</td>
                <td style={{ ...cell, fontWeight: 700, color: r < 1 ? C_DANS : C_HORS }}>{fmt(r, 2)}</td></tr>); })}</tbody>
          </table>
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.5, padding: '6px 10px', background: '#f8f4ff', borderLeft: '3px solid #6a4c93', borderRadius: 6 }}>
          <strong>Méthode de calcul.</strong> Indice d'évaporation du mélange : moyenne pondérée par les fractions volumiques (convention industrielle, approximation linéaire).
          Pression de vapeur : loi de Raoult, Σ xᵢ × Pvap,ᵢ, avec les fractions molaires calculées à partir des fractions volumiques, des masses volumiques et des masses molaires.
          En réalité, les solvants s'évaporent à des vitesses différentes, et les mélanges ne sont pas idéaux. Données indicatives : à vérifier dans la{' '}
          <a href="https://www.inrs.fr/publications/bdd/solvants.html" target="_blank" rel="noreferrer">base de données solvants de l'INRS</a> avant tout usage professionnel.
        </div>
      </Section>
    </div>
  );

  return (
    <>
      <div className="ha-l1">
        {blocVue}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{blocPoly}{blocMel}</div>
      </div>
      <div className="ha-l2">
        {blocBanque}
        {blocEvap}
      </div>
    </>
  );
}

const cell = { padding: '4px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
