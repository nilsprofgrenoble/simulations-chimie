import { useState, useEffect, useMemo, useRef } from "react";
import { cardStyle, fmt, sci, lireNombre, proche, CarteParcours, Cadre, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices } from "../commun";

// ====================================================
// AVANCEMENT D'UNE TRANSFORMATION CHIMIQUE (1re spé PC)
// Parcours : TP « détermination du volume molaire d'un gaz » (Mg + 2 H⁺ → Mg²⁺ + H₂).
// Exploration : la manip, et un outil général de tableau d'avancement (formules saisies au clavier).
// ====================================================

const M_MG = 24.0;          // g/mol (valeur de l'énoncé)
const P_ATM = 101325;       // Pa
const R_GP = 8.314;
const VM_REF = 24.1;        // L/mol, valeur de référence à 20 °C sous 1013 hPa (gaz sec)
// Pression de vapeur saturante de l'eau (formule de Magnus), en Pa
const pVap = T => 610.94 * Math.exp(17.625 * T / (T + 243.04));
// Volume molaire apparent du gaz recueilli sur l'eau (dihydrogène + vapeur d'eau), en L/mol
const vmApparent = T => R_GP * (T + 273.15) / (P_ATM - pVap(T)) * 1000;

// Générateur pseudo-aléatoire reproductible
function rng(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ── Modèle de l'expérience ──
function modele({ m, Va, c, T }) {
  const n1 = m / 1000 / M_MG, n2 = c * Va / 1000;
  const xmax = Math.max(0, Math.min(n1, n2 / 2));
  const limitant = n1 <= n2 / 2 ? 'Mg' : 'H+';
  const tau = 60 * Math.pow(2 / Math.max(c, 0.05), 0.7) * Math.pow(Math.max(m, 5) / 65, 0.3);   // s, durée de la réaction
  const Vm = vmApparent(T);
  return { n1, n2, xmax, limitant, tau, Vm, Vfinal: xmax * Vm * 1000 };
}
// Avancement et échauffement du gaz à l'instant t (s)
function aT(mod, t) {
  const u = Math.min(1, t / mod.tau);
  const x = mod.xmax * (1 - Math.pow(1 - u, 2));
  const dTmax = 7 * Math.min(1.5, mod.xmax / 0.0028);                 // K, la réaction est exothermique
  const dT = t <= mod.tau ? dTmax * u : dTmax * Math.exp(-(t - mod.tau) / 70);
  return { x, dT, finie: t >= mod.tau };
}

// ── Formules chimiques saisies au clavier : HCO3- → HCO₃⁻, SO42- → SO₄²⁻, Fe3+ → Fe³⁺, Mg2+(aq) → Mg²⁺(aq) ──
export function analyserFormule(brut) {
  let s = String(brut || '').trim();
  let etat = '';
  const mEtat = s.match(/\((aq|s|l|g)\)$/i);
  if (mEtat) { etat = mEtat[0].toLowerCase(); s = s.slice(0, -mEtat[0].length).trim(); }
  let charge = '';
  const mForce = s.match(/\^(\d*[+-])$/);                        // charge forcée : Fe^3+, SO4^2-
  if (mForce) { charge = mForce[1]; s = s.slice(0, -mForce[0].length); }
  else {
    const mCh = s.match(/(\d*)([+-])$/);
    if (mCh) {
      const chiffres = mCh[1], signe = mCh[2], corps = s.slice(0, -mCh[0].length);
      if (chiffres.length >= 2) { charge = chiffres.slice(-1) + signe; s = corps + chiffres.slice(0, -1); }   // SO42- → SO4 + 2-
      else if (chiffres.length === 1 && /^[A-Z][a-z]?$/.test(corps)) { charge = chiffres + signe; s = corps; } // Fe3+ (ion monoatomique)
      else if (chiffres.length === 1 && corps === 'e') { charge = chiffres + signe; s = corps; }
      else { charge = signe; s = corps + chiffres; }                                                          // HCO3- → HCO3 + -
    }
  }
  const segs = [];
  for (const morceau of s.match(/\d+|[^\d]+/g) || []) {
    const estIndice = /^\d+$/.test(morceau) && segs.length > 0;
    segs.push({ t: morceau, type: estIndice ? 'sub' : 'n' });
  }
  if (charge) segs.push({ t: charge.replace('-', '−').replace(/^1(?=[+−])/, ''), type: 'sup' });
  if (etat) segs.push({ t: etat, type: 'etat' });
  return segs;
}
export function Formule({ texte, taille = 1 }) {
  const segs = analyserFormule(texte);
  if (!segs.length) return <span style={{ color: '#94a3b8' }}>?</span>;
  return (
    <span style={{ whiteSpace: 'nowrap', fontSize: `${taille}em` }}>
      {segs.map((g, k) => g.type === 'sub' ? <sub key={k}>{g.t}</sub>
        : g.type === 'sup' ? <sup key={k}>{g.t}</sup>
          : g.type === 'etat' ? <sub key={k} style={{ fontSize: '0.7em' }}>{g.t}</sub>
            : <span key={k}>{g.t}</span>)}
    </span>
  );
}

const COUL = { gaz: '#e0f2fe', acide: '#fef9c3', eau: '#bfdbfe', mg: '#64748b', h2: '#0284c7', hist: '#60a5fa', moy: '#dc2626', ec: '#2563eb' };

// ════════════════ OUTIL GÉNÉRAL : TABLEAU D'AVANCEMENT ════════════════
const COUL_ESP = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#ca8a04', '#db2777'];
function OutilGeneral() {
  const [reactifs, setReactifs] = useEtatPersistant('avancement-outil-reactifs', [
    { f: 'CH4(g)', a: 1, n: 0.2 }, { f: 'O2(g)', a: 2, n: 0.3 }]);
  const [produits, setProduits] = useEtatPersistant('avancement-outil-produits', [
    { f: 'CO2(g)', a: 1, n: 0 }, { f: 'H2O(l)', a: 2, n: 0 }]);
  const [xRel, setXRel] = useState(1);                     // avancement en fraction de x_max
  const xmax = (() => {
    const r = reactifs.filter(e => e.a > 0).map(e => Math.max(0, e.n) / e.a);
    return r.length ? Math.min(...r) : 0;
  })();
  const x = xRel * xmax;
  const limitants = reactifs.map((e, i) => (e.a > 0 && Math.abs(Math.max(0, e.n) / e.a - xmax) < 1e-12 ? i : -1)).filter(i => i >= 0);
  const especes = [...reactifs.map((e, i) => ({ ...e, cote: 'r', i, nx: e.n - e.a * x })), ...produits.map((e, i) => ({ ...e, cote: 'p', i, nx: e.n + e.a * x }))];
  const majEsp = (cote, i, champ, v) => (cote === 'r' ? setReactifs : setProduits)(l => l.map((e, k) => (k === i ? { ...e, [champ]: v } : e)));
  const nbBtn = (cote, liste, delta) => {
    const set = cote === 'r' ? setReactifs : setProduits;
    if (delta > 0 && liste.length < 4) set(l => [...l, { f: '', a: 1, n: cote === 'r' ? 0.1 : 0 }]);
    if (delta < 0 && liste.length > 1) set(l => l.slice(0, -1));
  };
  const coefTxt = a => (a === 1 ? '' : `${a} `);
  const equation = (
    <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: KIT.txt, textAlign: 'center', padding: '6px 0', overflowX: 'auto' }}>
      {reactifs.map((e, i) => <span key={`r${i}`}>{i > 0 && ' + '}{coefTxt(e.a)}<Formule texte={e.f}/></span>)}
      {' → '}
      {produits.map((e, i) => <span key={`p${i}`}>{i > 0 && ' + '}{coefTxt(e.a)}<Formule texte={e.f}/></span>)}
    </div>
  );
  const inp = { fontSize: 14, padding: '4px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 };
  const editeur = (cote, liste) => (
    <div style={{ ...styleBoite, flex: '1 1 300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: KIT.txt }}>{cote === 'r' ? 'Réactifs' : 'Produits'} ({liste.length})</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => nbBtn(cote, liste, -1)} disabled={liste.length <= 1} style={stylePetitBouton(false)} aria-label={`Retirer un ${cote === 'r' ? 'réactif' : 'produit'}`}>−</button>
          <button onClick={() => nbBtn(cote, liste, 1)} disabled={liste.length >= 4} style={stylePetitBouton(false)} aria-label={`Ajouter un ${cote === 'r' ? 'réactif' : 'produit'}`}>+</button>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '58px minmax(0,1fr) 92px', gap: 6, fontSize: 12.5, color: KIT.txt2, fontWeight: 700, marginBottom: 2 }}>
        <span>coef.</span><span>formule</span><span>n initiale (mol)</span>
      </div>
      {liste.map((e, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '58px minmax(0,1fr) 92px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <input type="number" min={1} max={20} value={e.a} aria-label={`Coefficient ${cote === 'r' ? 'réactif' : 'produit'} ${i + 1}`}
            onChange={v => majEsp(cote, i, 'a', Math.max(1, Math.min(20, parseInt(v.target.value, 10) || 1)))} style={inp}/>
          <div>
            <input value={e.f} placeholder="ex. HCO3-(aq)" aria-label={`Formule ${cote === 'r' ? 'réactif' : 'produit'} ${i + 1}`}
              onChange={v => majEsp(cote, i, 'f', v.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }}/>
            <div style={{ fontSize: 15, marginTop: 2, color: COUL_ESP[(cote === 'r' ? 0 : 4) + i] }}><Formule texte={e.f}/></div>
          </div>
          <input value={e.n} aria-label={`Quantité initiale ${cote === 'r' ? 'réactif' : 'produit'} ${i + 1}`}
            onChange={v => { const n = lireNombre(v.target.value); majEsp(cote, i, 'n', isFinite(n) && n >= 0 ? n : v.target.value === '' ? 0 : e.n); }} style={inp}/>
        </div>
      ))}
    </div>
  );
  // Graphique des quantités en fonction de l'avancement
  const W = 520, H = 240, g = 52, d = 14, h = 14, b = 40;
  const nMaxG = Math.max(1e-9, ...especes.map(e => Math.max(e.n, e.cote === 'r' ? e.n : e.n + e.a * xmax)));
  const Xg = v => g + (xmax > 0 ? v / xmax : 0) * (W - g - d);
  const Yg = v => H - b - Math.max(0, v) / nMaxG * (H - b - h);
  const graphe = (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Quantités de matière en fonction de l'avancement"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}><line x1={g} y1={Yg(f * nMaxG)} x2={W - d} y2={Yg(f * nMaxG)} stroke="#e2e8f0"/>
          <text x={g - 5} y={Yg(f * nMaxG) + 4} fontSize="12" fill={KIT.txt2} textAnchor="end">{sci(f * nMaxG, 2)}</text></g>
      ))}
      {especes.map((e, k) => (
        <line key={k} x1={Xg(0)} y1={Yg(e.n)} x2={Xg(xmax)} y2={Yg(e.cote === 'r' ? e.n - e.a * xmax : e.n + e.a * xmax)}
          stroke={COUL_ESP[(e.cote === 'r' ? 0 : 4) + e.i]} strokeWidth="2.5"/>
      ))}
      <line x1={Xg(x)} y1={h} x2={Xg(x)} y2={H - b} stroke={ORANGE_GUIDE} strokeWidth="2"/>
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={h} x2={g} y2={H - b} stroke={KIT.txt}/>
      <text x={g} y={H - b + 16} fontSize="12" fill={KIT.txt2} textAnchor="middle">0</text>
      <text x={W - d} y={H - b + 16} fontSize="12" fill={KIT.txt2} textAnchor="end">x_max = {sci(xmax, 3)}</text>
      <text x={(g + W - d) / 2} y={H - 6} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">avancement x (mol)</text>
    </svg>
  );
  const nTxt = v => (Math.abs(v) < 1e-12 ? '0' : sci(v, 3));
  const expr = e => (e.cote === 'p' && Math.abs(e.n) < 1e-12 ? `${e.a === 1 ? '' : e.a}x` : `${nTxt(e.n)} ${e.cote === 'r' ? '−' : '+'} ${e.a === 1 ? '' : e.a}x`);
  const cell = { padding: '5px 8px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 14 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        {equation}
        <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center' }}>
          Tapez les formules au clavier : chiffres en indice et charge en exposant sont reconnus (HCO3- → HCO₃⁻, SO42- → SO₄²⁻, Fe3+ → Fe³⁺).
          L'état se note entre parenthèses à la fin : Na+(aq). Pour forcer une charge, utilisez ^ : Hg2^2+.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{editeur('r', reactifs)}{editeur('p', produits)}</div>
      <div style={styleBoite}>
        <Curseur nom="Avancement x (en % de x_max)" valeur={xRel * 100} onChange={v => setXRel(v / 100)} min={0} max={100} pas={1} unite="%"/>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8 }}>
          x = <strong>{sci(x, 3)} mol</strong> ; x<sub>max</sub> = <strong>{sci(xmax, 3)} mol</strong> ;
          réactif limitant : <strong>{limitants.length ? limitants.map(i => <span key={i}><Formule texte={reactifs[i].f}/> </span>) : '—'}</strong>
          {limitants.length > 1 && <> (mélange stœchiométrique)</>}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }}>
            <thead><tr>
              <th style={cell}>État</th><th style={cell}>Avancement</th>
              {especes.map((e, k) => <th key={k} style={{ ...cell, color: COUL_ESP[(e.cote === 'r' ? 0 : 4) + e.i] }}><Formule texte={e.f}/></th>)}
            </tr></thead>
            <tbody>
              <tr><td style={cell}>initial</td><td style={cell}>x = 0</td>{especes.map((e, k) => <td key={k} style={cell}>{nTxt(e.n)}</td>)}</tr>
              <tr><td style={cell}>en cours</td><td style={cell}>x</td>{especes.map((e, k) => <td key={k} style={cell}>{expr(e)}</td>)}</tr>
              <tr style={{ background: '#fff7ed' }}><td style={cell}>pour x = {sci(x, 3)}</td><td style={cell}>{fmt(xRel * 100, 0)} %</td>
                {especes.map((e, k) => <td key={k} style={{ ...cell, fontWeight: 700 }}>{nTxt(Math.max(0, e.nx))}</td>)}</tr>
              <tr><td style={cell}>final</td><td style={cell}>x<sub>f</sub> = x<sub>max</sub></td>
                {especes.map((e, k) => <td key={k} style={cell}>{nTxt(Math.max(0, e.cote === 'r' ? e.n - e.a * xmax : e.n + e.a * xmax))}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Quantités pour x = {sci(x, 3)} mol</div>
          <svg viewBox="0 0 520 220" role="img" aria-label="Histogramme des quantités de matière"
            style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
            {especes.map((e, k) => {
              const w = 440 / especes.length, xb = 50 + k * w, hb = Math.max(0, e.nx) / nMaxG * 160;
              return (
                <g key={k}>
                  <rect x={xb + w * 0.15} y={185 - hb} width={w * 0.7} height={hb} fill={COUL_ESP[(e.cote === 'r' ? 0 : 4) + e.i]} opacity="0.85"/>
                  <text x={xb + w / 2} y={180 - hb} fontSize="12" fill={KIT.txt} textAnchor="middle">{nTxt(Math.max(0, e.nx))}</text>
                  <foreignObject x={xb} y={190} width={w} height={26}><div style={{ textAlign: 'center', fontSize: 14 }}><Formule texte={e.f}/></div></foreignObject>
                </g>
              );
            })}
            <line x1="45" y1="185" x2="510" y2="185" stroke={KIT.txt}/>
          </svg>
        </div>
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Quantités en fonction de l'avancement</div>
          {graphe}
        </div>
      </div>
    </div>
  );
}

// ════════════════ SIMULATION ════════════════
export function Simulation1() {
  const [mode, setMode] = useState('guide');
  const [onglet, setOnglet] = useState('manip');          // exploration : manip | tableau | metro
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true });
  // L'échantillon de magnésium de l'élève (prépesé, différent pour chacun), gardé sur l'appareil
  const [ech] = useEtatPersistant('avancement-echantillon-v1', (() => {
    const g = Math.floor(Math.random() * 1e6);
    return { graine: g, m: 50 + Math.floor(rng(g)() * 31), delta: rng(g + 1)() - 0.5 };
  })());
  const [guide, setGuide] = useEtatPersistant('avancement-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [mes, setMes] = useEtatPersistant('avancement-mesures-v1', { V: null, Vm: null });
  // Réglages de l'exploration
  const [mExp, setMExp] = useState(65), [VaExp, setVaExp] = useState(50), [cExp, setCExp] = useState(2), [TExp, setTExp] = useState(20);
  // Déroulement de la manip
  const [phase, setPhase] = useState('vide');             // vide | acide | reaction
  const [t, setT] = useState(0);
  const [vitesse, setVitesse] = useState(5);
  const [tab, setTab] = useState({ init: ['', '', '', ''], cours: ['', '', '', ''], fin: ['', '', '', ''], xf: '', verif: {} });
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;
  // Paramètres de la manip : ceux de l'élève en parcours, ceux du défi ou de l'exploration sinon
  const params = enGuide ? { m: ech.m + ech.delta, Va: 50, c: 2, T: 20 }
    : enDefi && defi && defi.params ? defi.params : { m: mExp, Va: VaExp, c: cExp, T: TExp };
  const mAffiche = enGuide ? ech.m : enDefi && defi && defi.params ? defi.params.m : mExp;
  const mod = useMemo(() => modele(params), [params.m, params.Va, params.c, params.T]);
  const inst = phase === 'reaction' ? aT(mod, t) : { x: 0, dT: 0, finie: false };
  const T_K = params.T + 273.15;
  const Vgaz = phase === 'reaction' ? inst.x * mod.Vm * 1000 * (T_K + inst.dT) / T_K : 0;     // mL
  const deborde = Vgaz > 100;
  const Vlu = Math.min(100, Vgaz);
  const refroidi = phase === 'reaction' && inst.finie && inst.dT < 0.15;

  // Horloge de la manip
  const refV = useRef(vitesse); refV.current = vitesse;
  useEffect(() => {
    if (phase !== 'reaction') return;
    let prec = performance.now(), id;
    const pas = now => {
      const dt = Math.min(0.1, (now - prec) / 1000); prec = now;
      setT(x => (x > mod.tau + 600 ? x : x + dt * refV.current));
      id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [phase, mod.tau]);
  function nouvelleManip() { setPhase('vide'); setT(0); }
  useEffect(() => { nouvelleManip(); }, [mode, params.m, params.Va, params.c, params.T]);

  // Valeurs de l'élève (reprises dans les calculs suivants)
  const Veleve = mes.V ?? mod.Vfinal;
  const n1 = mod.n1, n2 = mod.n2, xmax = mod.xmax;
  const n1Aff = ech.m / 1000 / M_MG;                       // ce que l'élève calcule avec la masse affichée
  const VmEleve = (Veleve / 1000) / n1Aff;
  // ── Tableau d'avancement à compléter (parcours) ──
  const OPT_COURS = [
    ['n₁ − x', 'n₁ − 2x', 'n₁ + x'], ['n₂ − 2x', 'n₂ − x', '2n₂ − x'], ['x', '2x', '0'], ['x', '2x', 'n₂ − x']];
  const BON_COURS = ['n₁ − x', 'n₂ − 2x', 'x', 'x'];
  const vraiInit = [n1Aff, n2, 0, 0];
  const vraiFin = [0, n2 - 2 * n1Aff, n1Aff, n1Aff];
  const okVal = (s, vrai) => { const x = lireNombre(s); return isFinite(x) && (Math.abs(vrai) < 1e-9 ? Math.abs(x) < 1e-6 : proche(x, vrai, 0.03)); };
  const initOk = tab.init.every((s, k) => okVal(s, vraiInit[k]));
  const coursOk = tab.cours.every((s, k) => s === BON_COURS[k]);
  const finOk = tab.fin.every((s, k) => okVal(s, vraiFin[k])) && okVal(tab.xf, n1Aff);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'contexte', titre: 'Le volume molaire d’un gaz', focus: ['erlen'],
      texte: <>Une mole de n'importe quel gaz occupe, à température et pression données, le même volume : le <strong>volume
        molaire</strong> V<sub>m</sub>. On va le mesurer avec la réaction du magnésium sur l'acide chlorhydrique, qui produit du dihydrogène :
        <div style={{ textAlign: 'center', fontSize: 17, margin: '6px 0' }}>Mg<sub>(s)</sub> + 2 H⁺<sub>(aq)</sub> → Mg²⁺<sub>(aq)</sub> + H<sub>2 (g)</sub></div>
        Les ions chlorure Cl⁻ sont <strong>spectateurs</strong> : ils ne participent pas à la réaction.</>, tache: null },
    { id: 'securite', titre: 'Sécurité', focus: ['erlen'],
      texte: <>L'acide chlorhydrique à 2 mol/L est corrosif (lunettes, blouse, gants). Et le gaz formé ?</>,
      tache: { type: 'qcm', q: 'Quel danger présente le dihydrogène ?', options: ['Il est inflammable : aucune flamme à proximité', 'Il est toxique', 'Il n’est pas dangereux'], bonne: 0 } },
    { id: 'masse', titre: 'La masse de magnésium', focus: ['balance'],
      texte: <>Votre ruban de magnésium a été prépesé : lisez sa masse sur la balance.</>,
      tache: { type: 'num', q: 'Masse de magnésium m, en grammes', unite: 'g', vrai: ech.m / 1000, tol: 0.005,
        pieges: [[ech.m, 'La balance affiche des milligrammes : 1 mg = 0,001 g.']] } },
    { id: 'manip', titre: 'L’expérience', focus: ['erlen'],
      texte: <>L'éprouvette retournée est remplie d'eau : le gaz formé va chasser l'eau, c'est un recueil par <strong>déplacement d'eau</strong>.
        Versez les 50 mL d'acide, puis introduisez le ruban et rebouchez aussitôt.</>,
      tache: { type: 'action', ok: phase === 'reaction', consigne: phase === 'vide' ? 'Étape 1 : verser l’acide' : phase === 'acide' ? 'Étape 2 : introduire le ruban' : '✅ La réaction a démarré' } },
    { id: 'lecture', titre: 'Lire le volume de gaz', focus: ['eprouvette'],
      texte: <>Attendez que le ruban ait complètement disparu, <strong>et que le volume ne bouge plus</strong>. Lisez ensuite le volume de
        gaz dans le zoom de l'éprouvette (graduations de 1 mL).</>,
      tache: { type: 'num', q: 'Volume de dihydrogène recueilli V(H₂)', unite: 'mL', vrai: mod.Vfinal, tol: 1.2 / Math.max(mod.Vfinal, 1),
        bloque: phase !== 'reaction' ? 'Faites d’abord l’expérience.' : !inst.finie ? 'Attendez la fin de la réaction.' : null,
        pieges: refroidi ? [] : [[Vgaz, 'Le volume diminue encore : la réaction a chauffé le gaz. Attendez qu’il revienne à température ambiante.']],
        surReussite: v => setMes(x => ({ ...x, V: v })) } },
    { id: 'nMg', titre: 'La quantité de magnésium', focus: ['balance'],
      texte: <>On rappelle n = m / M, avec M(Mg) = 24,0 g/mol et m = {ech.m} mg.</>,
      tache: { type: 'num', q: 'Quantité de matière de magnésium n₁', unite: 'mol', vrai: n1Aff, tol: 0.02,
        pieges: [[ech.m / M_MG, 'Convertissez d’abord la masse en grammes.'], [M_MG / (ech.m / 1000), 'C’est m / M, et non M / m.']], aide: 'Écriture scientifique acceptée : par exemple 4,5e-3.' } },
    { id: 'nH', titre: 'La quantité d’ions H⁺', focus: ['erlen'],
      texte: <>On a versé V = 50 mL d'acide à c = 2 mol/L. On rappelle n = c × V.</>,
      tache: { type: 'num', q: 'Quantité de matière d’ions H⁺ n₂', unite: 'mol', vrai: n2, tol: 0.02,
        pieges: [[100, 'Le volume doit être en litres : 50 mL = 0,050 L.'], [2 / 0.05, 'C’est c × V.']] } },
    { id: 'tabInit', titre: 'Le tableau d’avancement : état initial', focus: ['tableau'],
      texte: <>Le tableau d'avancement est apparu sous le schéma. Remplissez la ligne de l'<strong>état initial</strong> (en mol) : au départ,
        il n'y a encore aucun produit.</>,
      tache: { type: 'action', ok: initOk, consigne: initOk ? null : 'Remplissez les 4 cases, puis cliquez sur « Vérifier la ligne ».' } },
    { id: 'tabCours', titre: 'Le tableau d’avancement : en cours', focus: ['tableau'],
      texte: <>Pour un avancement x, combien de chaque espèce reste-t-il, ou s'est-il formé ? Pensez aux coefficients de l'équation.
        On note n₁ et n₂ les quantités initiales de Mg et de H⁺.</>,
      tache: { type: 'action', ok: coursOk, consigne: coursOk ? null : 'Choisissez l’expression de chaque case, puis vérifiez la ligne.' } },
    { id: 'limitant', titre: 'Le réactif limitant', focus: ['tableau'],
      texte: <>La réaction s'arrête quand un réactif est épuisé. Si c'est Mg : n₁ − x = 0. Si c'est H⁺ : n₂ − 2x = 0.</>,
      tache: { type: 'qcm', q: 'Quel est le réactif limitant ?', options: ['Le magnésium Mg', 'Les ions H⁺', 'Aucun des deux'], bonne: 0,
        expl: `x = n₁ = ${sci(n1Aff, 2)} mol pour Mg, et x = n₂/2 = ${sci(n2 / 2, 2)} mol pour H⁺ : le plus petit gagne. L’acide est en large excès.` } },
    { id: 'xmax', titre: 'L’avancement maximal', focus: ['tableau'],
      texte: <>La transformation est totale : l'avancement final x<sub>f</sub> est égal à l'avancement maximal x<sub>max</sub>.</>,
      tache: { type: 'num', q: 'Avancement maximal x_max', unite: 'mol', vrai: n1Aff, tol: 0.02,
        pieges: [[n2 / 2, 'C’est la valeur obtenue si H⁺ était limitant : prenez la plus petite des deux.'], [n2, 'Pensez au coefficient 2 devant H⁺, et comparez avec n₁.']] } },
    { id: 'tabFin', titre: 'Le tableau d’avancement : état final', focus: ['tableau'],
      texte: <>Remplissez la dernière ligne avec x<sub>f</sub> = x<sub>max</sub>.</>,
      tache: { type: 'action', ok: finOk, consigne: finOk ? null : 'Remplissez x_f et les 4 cases, puis vérifiez la ligne.' } },
    { id: 'Vm', titre: 'Le volume molaire', focus: ['eprouvette'],
      texte: <>Le dihydrogène formé a la quantité n(H₂) = x<sub>max</sub>, et il occupe le volume V(H₂) = {fmt(Veleve, 1)} mL que vous avez mesuré.
        Le volume molaire est le volume occupé par une mole : V<sub>m</sub> = V(H₂) / n(H₂).</>,
      tache: { type: 'num', q: 'Volume molaire V_m, en L/mol', unite: 'L/mol', vrai: VmEleve, tol: 0.02,
        pieges: [[VmEleve * 1000, 'Le volume doit être en litres.'], [1 / VmEleve, 'C’est V / n, et non n / V.'], [VmEleve / 2, 'n(H₂) = x_max, et non 2 x_max.']],
        surReussite: v => setMes(x => ({ ...x, Vm: v })) } },
    { id: 'ecart', titre: 'Comparer à la valeur attendue', focus: [],
      texte: <>À 20 °C et sous 1013 hPa, le volume molaire d'un gaz vaut environ <strong>{fmt(VM_REF, 1)} L/mol</strong>. L'écart relatif vaut
        |V<sub>m</sub> − {fmt(VM_REF, 1)}| / {fmt(VM_REF, 1)}.</>,
      tache: { type: 'num', q: 'Écart relatif, en %', unite: '%', vrai: Math.abs((mes.Vm ?? VmEleve) - VM_REF) / VM_REF * 100, tol: 0.15,
        aide: 'Multipliez par 100 pour obtenir un pourcentage.' } },
    { id: 'erreurs', titre: 'Les sources d’erreur', focus: ['eprouvette'],
      texte: <>Votre valeur est un peu plus grande que {fmt(VM_REF, 1)} L/mol. Le gaz recueilli sur l'eau n'est pas du dihydrogène pur.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce qui peut expliquer un volume un peu trop grand ?',
        options: ['De la vapeur d’eau se mélange au dihydrogène, et le gaz peut être encore tiède', 'Il manque du magnésium', 'L’acide était trop concentré'], bonne: 0,
        expl: 'La vapeur d’eau ajoute environ 2 % au volume à 20 °C. D’autres erreurs, comme une fuite au bouchon ou du gaz perdu avant de reboucher, donneraient au contraire un volume trop petit.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez mené une étude quantitative complète : quantités de matière, tableau d'avancement, réactif limitant et volume
        molaire. En exploration libre, vous trouverez la manip avec tous les réglages, et un tableau d'avancement pour n'importe quelle
        réaction.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);
  const vu = id => !enGuide || etape >= idx(id);
  // ════════════════ SCHÉMA DE LA MANIP ════════════════
  const fMg = phase === 'reaction' ? Math.max(0, 1 - inst.x / Math.max(mod.n1, 1e-12)) : 1;     // part de ruban restante
  const enReaction = phase === 'reaction' && !inst.finie;
  const yHaut = 46, yBas = 266;                              // éprouvette : 0 mL en haut, 100 mL à yBas
  const yNiv = yHaut + Math.min(100, Vgaz) / 100 * (yBas - yHaut);
  const schema = (
    <svg viewBox="0 0 640 330" role="img" aria-label="Montage de recueil du dihydrogène par déplacement d'eau"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {/* balance */}
      <rect x="18" y="268" width="120" height="36" rx="6" fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/>
      <rect x="34" y="276" width="88" height="20" rx="3" fill="#0f172a"/>
      <text x="78" y="291" fontSize="15" fill="#86efac" textAnchor="middle" fontFamily="monospace" fontWeight="700">{mAffiche} mg</text>
      <text x="78" y="320" fontSize="13" fill={KIT.txt2} textAnchor="middle">balance</text>
      {phase === 'vide' || phase === 'acide' ? <rect x="58" y="258" width="40" height="5" fill={COUL.mg} rx="1"/> : null}
      {/* erlenmeyer */}
      <path d="M 186 120 L 186 170 L 150 262 L 262 262 L 226 170 L 226 120 Z" fill="white" stroke={KIT.txt} strokeWidth="2"/>
      {phase !== 'vide' && <path d="M 172 214 L 240 214 L 258 260 L 154 260 Z" fill={COUL.acide}/>}
      {phase === 'vide' && <text x="206" y="244" fontSize="12" fill={KIT.txt2} textAnchor="middle">vide</text>}
      {phase === 'reaction' && fMg > 0.001 && <rect x={190} y={248} width={32 * fMg + 2} height="6" fill={COUL.mg} rx="1"/>}
      {enReaction && [0, 1, 2, 3, 4].map(k => (
        <circle key={k} cx={196 + k * 6} cy="240" r="2.5" fill="white" stroke={COUL.h2}>
          <animate attributeName="cy" from="246" to="216" dur={`${0.8 + k * 0.15}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <rect x="198" y="106" width="16" height="16" fill={phase === 'reaction' ? '#c2410c' : 'none'} stroke={phase === 'reaction' ? KIT.txt : 'none'}/>
      <text x="206" y="316" fontSize="13" fill={KIT.txt} textAnchor="middle">H⁺ + Cl⁻ {phase !== 'vide' ? `(${fmt(params.Va, 0)} mL, ${fmt(params.c, 1)} mol/L)` : ''}</text>
      {/* tuyau */}
      <polyline points="206,106 206,80 300,80 300,284 352,284 352,262" fill="none" stroke={KIT.txt2} strokeWidth="5" strokeLinejoin="round"/>
      {/* cuve à eau et éprouvette retournée */}
      <rect x="316" y="214" width="196" height="84" fill={COUL.eau} opacity="0.7"/>
      <polyline points="316,170 316,298 512,298 512,170" fill="none" stroke={KIT.txt} strokeWidth="2"/>
      <rect x="338" y={yHaut} width="40" height={yBas - yHaut + 34} fill={COUL.eau} opacity="0.9"/>
      <rect x="338" y={yHaut} width="40" height={yNiv - yHaut} fill={COUL.gaz}/>
      <rect x="338" y={yHaut - 4} width="40" height={yBas - yHaut + 38} fill="none" stroke={KIT.txt} strokeWidth="2"/>
      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => {
        const y = yHaut + v / 100 * (yBas - yHaut);
        return <g key={v}><line x1="378" y1={y} x2="386" y2={y} stroke={KIT.txt}/>{v % 20 === 0 && <text x="390" y={y + 4} fontSize="11" fill={KIT.txt}>{v}</text>}</g>;
      })}
      {enReaction && [0, 1, 2].map(k => (
        <circle key={k} cx={352 + k * 5} cy="250" r="2.5" fill="white" stroke={COUL.h2}>
          <animate attributeName="cy" from="270" to={Math.max(yHaut + 6, yNiv - 4)} dur={`${0.9 + k * 0.2}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <text x="358" y="30" fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">éprouvette 100 mL</text>
      {deborde && <text x="358" y="16" fontSize="13" fontWeight="800" fill="#b91c1c" textAnchor="middle">l'éprouvette déborde !</text>}
      {/* zoom de lecture */}
      {(() => {
        const zc = Math.min(100, Math.max(0, Vlu)), z0 = 432, zy = 52, zh = 150, zw = 60, mlParPx = 10 / zh;
        const Yz = v => zy + zh / 2 + (v - zc) / mlParPx;
        return (
          <g>
            <rect x={z0} y={zy} width={zw} height={zh} fill={COUL.eau} stroke={KIT.txt} strokeWidth="1.5"/>
            <rect x={z0} y={zy} width={zw} height={Math.max(0, Math.min(zh, Yz(zc) - zy))} fill={COUL.gaz}/>
            {Array.from({ length: 21 }, (_, k) => Math.round(zc) - 10 + k).filter(v => v >= 0 && v <= 100).map(v => {
              const y = Yz(v); if (y < zy || y > zy + zh) return null;
              return <g key={v}><line x1={z0 + zw - (v % 5 === 0 ? 18 : 10)} y1={y} x2={z0 + zw} y2={y} stroke={KIT.txt}/>
                {v % 5 === 0 && <text x={z0 + zw + 4} y={y + 4} fontSize="12" fill={KIT.txt}>{v}</text>}</g>;
            })}
            <path d={`M ${z0} ${Yz(zc) - 2} Q ${z0 + zw / 2} ${Yz(zc) + 6} ${z0 + zw} ${Yz(zc) - 2}`} fill="none" stroke={COUL.h2} strokeWidth="2"/>
            <text x={z0 + zw / 2} y={zy - 6} fontSize="12" fill={KIT.txt2} textAnchor="middle">zoom (mL)</text>
            <line x1="380" y1={yNiv} x2={z0} y2={zy + zh / 2} stroke="#94a3b8" strokeDasharray="3 3"/>
          </g>
        );
      })()}
      <text x="560" y="250" fontSize="12" fill={KIT.txt2}>t = {fmt(phase === 'reaction' ? t : 0, 0)} s</text>
      <Cadre actif={hl('balance')} x={12} y={252} w={132} h={74}/>
      <Cadre actif={hl('erlen')} x={142} y={98} w={128} h={202}/>
      <Cadre actif={hl('eprouvette')} x={330} y={36} w={190} h={272}/>
    </svg>
  );

  // ════════════════ TABLEAU D'AVANCEMENT À COMPLÉTER ════════════════
  const cell = { padding: '5px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 14 };
  const inpT = ok => ({ width: 92, fontSize: 14, padding: '3px 5px', border: `1.5px solid ${ok === true ? '#16a34a' : ok === false ? '#dc2626' : KIT.bord}`, borderRadius: 5 });
  const ligneSaisie = (cle, vrais) => tab[cle].map((s, k) => (
    <td key={k} style={cell}>
      <input value={s} aria-label={`${cle} case ${k + 1}`} onChange={e => { const v = e.target.value; setTab(x => ({ ...x, [cle]: x[cle].map((y, j) => (j === k ? v : y)), verif: { ...x.verif, [cle]: false } })); }}
        style={inpT(tab.verif[cle] ? okVal(s, vrais[k]) : undefined)}/>
    </td>
  ));
  const tableau = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
        <thead>
          <tr><th style={cell}/><th style={cell}>Mg<sub>(s)</sub></th><th style={cell}>+ 2 H⁺<sub>(aq)</sub></th><th style={cell}>→ Mg²⁺<sub>(aq)</sub></th><th style={cell}>+ H<sub>2 (g)</sub></th><th style={cell}/></tr>
        </thead>
        <tbody>
          <tr><td style={cell}>état initial : x = 0</td>{ligneSaisie('init', vraiInit)}
            <td style={cell}><button onClick={() => setTab(x => ({ ...x, verif: { ...x.verif, init: true } }))} style={stylePetitBouton(true, '#16a34a')}>Vérifier la ligne</button>{tab.verif.init && <span> {initOk ? '✅' : '❌'}</span>}</td></tr>
          {vu('tabCours') && <tr><td style={cell}>en cours : x</td>
            {tab.cours.map((s, k) => (
              <td key={k} style={cell}>
                <select value={s} aria-label={`en cours case ${k + 1}`} onChange={e => { const v = e.target.value; setTab(x => ({ ...x, cours: x.cours.map((y, j) => (j === k ? v : y)), verif: { ...x.verif, cours: false } })); }}
                  style={{ ...inpT(tab.verif.cours ? s === BON_COURS[k] : undefined), width: 96 }}>
                  <option value="">?</option>{OPT_COURS[k].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
            ))}
            <td style={cell}><button onClick={() => setTab(x => ({ ...x, verif: { ...x.verif, cours: true } }))} style={stylePetitBouton(true, '#16a34a')}>Vérifier la ligne</button>{tab.verif.cours && <span> {coursOk ? '✅' : '❌'}</span>}</td></tr>}
          {vu('tabFin') && <tr><td style={cell}>état final : x<sub>f</sub> = <input value={tab.xf} aria-label="x_f" onChange={e => { const v = e.target.value; setTab(x => ({ ...x, xf: v, verif: { ...x.verif, fin: false } })); }}
            style={{ ...inpT(tab.verif.fin ? okVal(tab.xf, n1Aff) : undefined), width: 80 }}/></td>{ligneSaisie('fin', vraiFin)}
            <td style={cell}><button onClick={() => setTab(x => ({ ...x, verif: { ...x.verif, fin: true } }))} style={stylePetitBouton(true, '#16a34a')}>Vérifier la ligne</button>{tab.verif.fin && <span> {finOk ? '✅' : '❌'}</span>}</td></tr>}
        </tbody>
      </table>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Quantités en mol ; écriture scientifique acceptée (4,5e-3). Une case verte est juste, une case rouge est à revoir.</div>
    </div>
  );

  // ════════════════ COMMANDES ET MESURES ════════════════
  const commandesManip = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setPhase('acide')} disabled={phase !== 'vide'} style={{ ...styleBouton(phase === 'vide', '#ca8a04'), opacity: phase === 'vide' ? 1 : 0.5 }}>🧪 Verser l'acide</button>
        <button onClick={() => { setT(0); setPhase('reaction'); }} disabled={phase !== 'acide'} style={{ ...styleBouton(phase === 'acide', '#2563eb'), opacity: phase === 'acide' ? 1 : 0.5 }}>🎗️ Introduire le ruban et reboucher</button>
        {!enGuide && <button onClick={nouvelleManip} style={styleBouton(false)}>↺ Recommencer</button>}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700, marginBottom: 3 }}>Vitesse du temps</div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        {[1, 5, 20].map(v => <button key={v} onClick={() => setVitesse(v)} style={stylePetitBouton(vitesse === v, '#334155')}>× {v}</button>)}
      </div>
      {mode === 'explore' && <>
        <Curseur nom="Masse de magnésium" valeur={mExp} onChange={setMExp} min={10} max={150} pas={1} unite="mg"/>
        <Curseur nom="Volume d'acide" valeur={VaExp} onChange={setVaExp} min={1} max={100} pas={1} unite="mL"/>
        <Curseur nom="Concentration de l'acide" valeur={cExp} onChange={setCExp} min={0.1} max={4} pas={0.1} unite="mol/L" decimales={1}/>
        <Curseur nom="Température de la salle" valeur={TExp} onChange={setTExp} min={5} max={35} pas={1} unite="°C"/>
      </>}
    </>
  );
  const mesuresManip = (
    <>
      {!enGuide && <LigneMesure nom="Volume de gaz dans l'éprouvette" valeur={phase === 'reaction' ? `${deborde ? '> 100' : fmt(Vlu, 1)} mL` : '—'} couleur={COUL.h2}/>}
      <LigneMesure nom="État" valeur={phase !== 'reaction' ? 'prêt' : !inst.finie ? 'réaction en cours' : refroidi ? 'terminée, gaz refroidi' : 'terminée, le gaz refroidit'}/>
      {mode === 'explore' && <>
        <LigneMesure nom="n(Mg) initial" valeur={`${sci(n1, 3)} mol`}/>
        <LigneMesure nom="n(H⁺) initial" valeur={`${sci(n2, 3)} mol`}/>
        <LigneMesure nom="Réactif limitant" valeur={mod.limitant === 'Mg' ? 'Mg' : 'H⁺'} couleur="#b45309"/>
        <LigneMesure nom="x_max" valeur={`${sci(xmax, 3)} mol`}/>
        <LigneMesure nom={`Volume molaire apparent à ${fmt(params.T, 0)} °C`} valeur={`${fmt(mod.Vm, 2)} L/mol`}/>
      </>}
    </>
  );
  // ════════════════ DÉFI ════════════════
  function nouveauDefi(type) {
    const r = Math.random;
    if (type === 'prevoir') { const m = 40 + Math.floor(r() * 56); setDefi({ type, params: { m, Va: 50, c: 2, T: 20 }, reps: {}, verifie: false }); }
    else if (type === 'deborder') setDefi({ type, params: { m: 60, Va: 50, c: 2, T: 20 }, reps: {}, verifie: false });
    else { const m = 50 + Math.floor(r() * 150), Va = 2 + Math.floor(r() * 18), c = [0.5, 1, 1.5, 2][Math.floor(r() * 4)];
      setDefi({ type, params: { m, Va, c, T: 20 }, reps: {}, verifie: false }); }
  }
  const VmDefi = vmApparent(20);
  const questionsDefi = !defi ? [] : defi.type === 'prevoir' ? [
    { id: 'v', q: `Avec ${defi.params.m} mg de magnésium et l'acide en excès, quel volume de gaz attendez-vous ? (V_m = ${fmt(VmDefi, 1)} L/mol dans la salle)`, unite: 'mL', vrai: defi.params.m / 1000 / M_MG * VmDefi * 1000, tol: 0.03 },
  ] : defi.type === 'deborder' ? [
    { id: 'm', q: `Quelle masse maximale de magnésium peut-on utiliser sans faire déborder l'éprouvette de 100 mL ? (V_m = ${fmt(VmDefi, 1)} L/mol)`, unite: 'mg', vrai: 0.1 / VmDefi * M_MG * 1000, tol: 0.03 },
  ] : [
    { id: 'l', q: `${defi.params.m} mg de magnésium, ${defi.params.Va} mL d'acide à ${fmt(defi.params.c, 1)} mol/L. Réactif limitant (tapez Mg ou H+)`, unite: '', texte: true, vrai: mod.limitant },
    { id: 'x', q: 'Avancement maximal x_max', unite: 'mol', vrai: mod.xmax, tol: 0.03 },
  ];
  const justeD = q => {
    const s = (defi.reps[q.id] || '').trim();
    if (q.texte) return s.replace(/\s/g, '').replace('⁺', '+').toLowerCase() === q.vrai.toLowerCase();
    const x = lireNombre(s); return isFinite(x) && proche(x, q.vrai, q.tol);
  };
  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => nouveauDefi('prevoir')} style={styleBouton(defi?.type === 'prevoir', '#0ea5e9')}>🔮 Prévoir le volume</button>
        <button onClick={() => nouveauDefi('deborder')} style={styleBouton(defi?.type === 'deborder', '#0ea5e9')}>🌊 Ne pas déborder</button>
        <button onClick={() => nouveauDefi('limitant')} style={styleBouton(defi?.type === 'limitant', '#0ea5e9')}>⚖️ Qui est limitant ?</button>
      </div>
      {!defi && <div style={{ fontSize: 14, color: KIT.txt2 }}>Choisissez un défi.</div>}
      {defi && <>
        {questionsDefi.map((q, k) => {
          const ok = defi.verifie && justeD(q);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`}
                  onChange={x => { const v = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 120 }}/>
                <span style={{ fontSize: 13, color: KIT.txt2 }}>{q.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.texte ? (q.vrai === 'Mg' ? 'Mg' : 'H+') : `${sci(q.vrai)} ${q.unite}`}</div>}
            </div>
          );
        })}
        <div><button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button></div>
        <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>
          {defi.type === 'deborder' ? 'Pour vérifier : passez en exploration libre, réglez la masse que vous avez trouvée, et faites la manip.'
            : 'Puis faites la manip avec les commandes sous le schéma pour vérifier.'}
        </div>
      </>}
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi('prevoir'); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const boutonsModes = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
      <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
    </div>
  );
  const vueManip = mode !== 'explore' || onglet === 'manip';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .av-l1 { display: grid; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .av-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .av-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Avancement d'une transformation chimique</h2>
        {boutonsModes}
      </div>
      {mode === 'explore' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['manip', '🧪 La manip du volume molaire'], ['tableau', '📋 Tableau d’avancement (toute réaction)']].map(([k, n]) =>
            <button key={k} onClick={() => setOnglet(k)} style={stylePetitBouton(onglet === k, '#2a9d8f')}>{n}</button>)}
        </div>
      )}
      {mode === 'explore' && onglet === 'tableau' && <OutilGeneral/>}
      {vueManip && <>
        <div className="av-l1">
          <div style={styleBoite}>
            {<>
              <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Recueil du dihydrogène par déplacement d'eau</div>
              {schema}
              <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
                Le gaz formé chasse l'eau de l'éprouvette retournée. Le zoom de droite permet de lire le volume au millilitre près.
                {enGuide ? ' L’élément encadré en orange est celui dont parle l’étape en cours.' : ''}
              </div>
            </>}
          </div>
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : enDefi ? <div style={styleBoite}>{voletDefi}</div>
              : <div style={styleBoite}>
                <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
                  <li>Mettez très peu d'acide (2 mL) : quel réactif devient limitant ? Que reste-t-il dans l'erlenmeyer ?</li>
                  <li>Quelle masse fait déborder l'éprouvette ?</li>
                  <li>Changez la température : le volume molaire change-t-il ?</li>
                  <li>Lisez le volume pendant que le gaz est encore chaud, puis à la fin.</li>
                </ul>
              </div>}
        </div>
        <div className="av-l2">
          {<div>
            <Section titre="Commandes" ouvert={ouverts.commandes} onBascule={() => setOuverts(o => ({ ...o, commandes: !o.commandes }))}>
              {enGuide && !vu('manip') ? <div style={{ fontSize: 13, color: KIT.txt2 }}>Les commandes apparaîtront au fil du parcours.</div> : commandesManip}
            </Section>
          </div>}
          {<div><Section titre="Mesures" ouvert={ouverts.mesures} onBascule={() => setOuverts(o => ({ ...o, mesures: !o.mesures }))}>{mesuresManip}</Section></div>}
          {enGuide && vu('tabInit') && <div style={{ ...styleBoite, gridColumn: '1 / -1', position: 'relative' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Tableau d'avancement</div>
            {tableau}
            {hl('tableau') && <div style={{ position: 'absolute', inset: -3, border: `3px dashed ${ORANGE_GUIDE}`, borderRadius: 12, pointerEvents: 'none' }}/>}
          </div>}
        </div>
      </>}
    </div>
  );
}
