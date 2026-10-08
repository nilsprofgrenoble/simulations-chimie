import { useState, useEffect, useRef } from "react";
import { cardStyle, fmt, sci, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices } from "../commun";
import { Formule } from "./Avancement";
import { V_BURETTE, seuilVisible, couleurSolution, ContexteBanc, SchemaBurette } from "./titrageCommun";

// ====================================================
// TITRAGE EN RETOUR (1re spé PC) : on ajoute un excès connu d'un réactif, puis on titre ce qui n'a pas réagi
// Parcours : DS « Titrage de la vitamine C dans une gélule » — titrage en retour :
//   C₆H₈O₆ + I₂ → C₆H₆O₆ + 2 H⁺ + 2 I⁻ (diiode en excès), puis I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻.
// Exploration : le banc de titrage (masse, attente, volumes, empois d'amidon) et un titrage en retour pour toute réaction.
// ====================================================

const M_VITC = 176.12;      // g/mol
const V_FIOLE = 100;        // mL
const TAU_DEGR = 3.56;      // h : une solution restée 8 h à la lumière garde 10,6 % de sa vitamine C (DS : V₂,ₑ = 19,1 mL)

// ── Modèle du titrage ──
function modeleTitrage({ m, attente = 0, V0 = 25, V1 = 10, c1 = 0.010, c2 = 0.010 }) {
  const mReste = m * Math.exp(-attente / TAU_DEGR);          // mg de vitamine C encore présente dans S₀
  const c0 = mReste / 1000 / M_VITC / (V_FIOLE / 1000);       // mol/L
  const n0 = c0 * V0 / 1000, n1 = c1 * V1 / 1000;
  const nI2reste = Math.max(0, n1 - n0);
  const Veq = 2 * nI2reste / c2 * 1000;                        // mL
  return { mReste, c0, n0, n1, nI2reste, Veq, V0, V1, c1, c2, toutConsomme: n0 >= n1 };
}
// État de l'erlenmeyer après un volume V2 (mL) de thiosulfate
function etatErlen(mod, V2) {
  const nI2 = Math.max(0, mod.nI2reste - mod.c2 * V2 / 1000 / 2);
  const Vtot = (mod.V0 + mod.V1 + V2) / 1000;
  return { nI2, cI2: nI2 / Vtot, nThioExces: Math.max(0, mod.c2 * V2 / 1000 - 2 * mod.nI2reste) };
}
// ════════════════ TITRAGE EN RETOUR POUR TOUTE RÉACTION ════════════════
// Réaction 1 (dans l'erlenmeyer) : a A + r₁ R → … avec R en excès connu.
// Réaction 2 (titrage) : r₂ R + t T → … : on titre le R restant par le titrant T.
function OutilTitrageRetour() {
  const [A, setA] = useEtatPersistant('titrage-retour-A', { f: 'C6H8O6(aq)', a: 1, c: 1.7e-3, V: 25 });
  const [R, setR] = useEtatPersistant('titrage-retour-R', { f: 'I2(aq)', r1: 1, r2: 1, c: 0.010, V: 10 });
  const [T, setT] = useEtatPersistant('titrage-retour-T', { f: 'S2O32-(aq)', t: 2, c: 0.010 });
  const [VT, setVT] = useState(0);
  const nA = A.c * A.V / 1000, nR0 = R.c * R.V / 1000;
  const nRreagi = R.r1 / A.a * nA;
  const enExces = nRreagi < nR0;
  const nRrest = Math.max(0, nR0 - nRreagi);
  const Veq = T.t / R.r2 * nRrest / Math.max(T.c, 1e-12) * 1000;
  const VTmax = Math.max(1, Math.ceil(Veq * 1.6));
  const nRerlen = v => Math.max(0, nRrest - R.r2 / T.t * T.c * v / 1000);
  const nTexces = v => Math.max(0, T.c * v / 1000 - T.t / R.r2 * nRrest);
  const inp = { fontSize: 14, padding: '4px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 };
  const nombre = (val, set, label, w = 80) => <input defaultValue={val} aria-label={label} onBlur={e => { const x = lireNombre(e.target.value); if (isFinite(x) && x >= 0) set(x); }}
    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} style={{ ...inp, width: w }}/>;
  const entier = (val, set, label) => <input type="number" min={1} max={20} value={val} aria-label={label} onChange={e => set(Math.max(1, parseInt(e.target.value, 10) || 1))} style={{ ...inp, width: 54 }}/>;
  const formule = (val, set, label) => <input value={val} aria-label={label} onChange={e => set(e.target.value)} style={{ ...inp, flex: 1, minWidth: 0 }}/>;
  const k = x => (x === 1 ? '' : `${x} `);
  const W = 520, H = 220, g = 56, d = 14, h = 14, b = 40;
  const nMaxG = Math.max(1e-12, nRrest, nTexces(VTmax));
  const X = v => g + v / VTmax * (W - g - d), Y = n => H - b - n / nMaxG * (H - b - h);
  const courbe = f => Array.from({ length: 121 }, (_, i) => { const v = i * VTmax / 120; return `${X(v).toFixed(1)},${Y(f(v)).toFixed(1)}`; }).join(' ');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Réaction 1, dans l'erlenmeyer (le réactif R est en excès connu)</div>
        <div style={{ fontSize: 21, fontFamily: 'Georgia, serif', color: KIT.txt, textAlign: 'center', margin: '2px 0 8px' }}>
          {k(A.a)}<Formule texte={A.f}/> + {k(R.r1)}<Formule texte={R.f}/> → produits</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Réaction 2, le titrage du R restant</div>
        <div style={{ fontSize: 21, fontFamily: 'Georgia, serif', color: KIT.txt, textAlign: 'center', margin: '2px 0 4px' }}>
          {k(R.r2)}<Formule texte={R.f}/> + {k(T.t)}<Formule texte={T.f}/> → produits</div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center' }}>Formules au clavier : I2 → I₂, S2O32- → S₂O₃²⁻, MnO4- → MnO₄⁻.</div>
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COUL_R[0], marginBottom: 6 }}>A : l'espèce à doser</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>{entier(A.a, v => setA(x => ({ ...x, a: v })), 'Coefficient de A')}{formule(A.f, v => setA(x => ({ ...x, f: v })), 'Formule de A')}</div>
          <div style={{ fontSize: 13.5, color: KIT.txt2 }}>c = {nombre(A.c, v => setA(x => ({ ...x, c: v })), 'Concentration de A', 90)} mol/L ; V = {nombre(A.V, v => setA(x => ({ ...x, V: v })), 'Volume de A', 56)} mL</div>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>En vrai, c'est la grandeur inconnue : on la retrouve grâce au titrage.</div>
        </div>
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COUL_R[1], marginBottom: 6 }}>R : le réactif en excès</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>{formule(R.f, v => setR(x => ({ ...x, f: v })), 'Formule de R')}</div>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>coefficient dans la réaction 1 : {entier(R.r1, v => setR(x => ({ ...x, r1: v })), 'Coefficient de R dans la réaction 1')} ; dans la réaction 2 : {entier(R.r2, v => setR(x => ({ ...x, r2: v })), 'Coefficient de R dans la réaction 2')}</div>
          <div style={{ fontSize: 13.5, color: KIT.txt2 }}>c = {nombre(R.c, v => setR(x => ({ ...x, c: v })), 'Concentration de R', 90)} mol/L ; V = {nombre(R.V, v => setR(x => ({ ...x, V: v })), 'Volume de R', 56)} mL</div>
        </div>
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COUL_R[2], marginBottom: 6 }}>T : le titrant (burette)</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>{entier(T.t, v => setT(x => ({ ...x, t: v })), 'Coefficient de T')}{formule(T.f, v => setT(x => ({ ...x, f: v })), 'Formule de T')}</div>
          <div style={{ fontSize: 13.5, color: KIT.txt2 }}>c = {nombre(T.c, v => setT(x => ({ ...x, c: v })), 'Concentration de T', 90)} mol/L</div>
        </div>
      </div>
      <div style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Ce que devient le réactif R</div>
        {!enExces ? <div style={{ fontSize: 14, color: '#b91c1c', fontWeight: 700 }}>R n'est pas en excès : tout le réactif R réagit avec A, il n'en reste rien à titrer. Augmentez la quantité de R.</div> : <>
          <div style={{ display: 'flex', height: 34, borderRadius: 6, overflow: 'hidden', border: `1px solid ${KIT.bord}`, fontSize: 12.5 }}>
            <div style={{ width: `${nRreagi / nR0 * 100}%`, background: '#cbd5e1', padding: '8px 6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>a réagi avec A : {sci(nRreagi, 3)} mol</div>
            <div style={{ width: `${nRrest / nR0 * 100}%`, background: '#fdba74', padding: '8px 6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>restant, titré : {sci(nRrest, 3)} mol</div>
          </div>
          <div style={{ fontSize: 14, color: KIT.txt, marginTop: 8, lineHeight: 1.6 }}>
            n(R) introduit = {sci(nR0, 3)} mol. Volume équivalent du titrage : <strong>V<sub>éq</sub> = {fmt(Veq, 2)} mL</strong>.
            <br/>Pour remonter à A : n(A) = ({A.a} / {R.r1}) × [n(R)<sub>introduit</sub> − ({R.r2} / {T.t}) × c<sub>T</sub> × V<sub>éq</sub>] = <strong>{sci(nA, 3)} mol</strong>.
          </div>
        </>}
      </div>
      {enExces && <div style={styleBoite}>
        <Curseur nom="Volume de titrant versé" valeur={VT} onChange={setVT} min={0} max={VTmax} pas={VTmax / 200} unite="mL" decimales={2} couleur="#e63946"/>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Réactif R restant et titrant en excès en fonction du volume versé" style={{ width: '100%', maxWidth: 640, height: 'auto', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
          <polyline points={courbe(nRerlen)} fill="none" stroke={COUL_R[1]} strokeWidth="2.5"/>
          <polyline points={courbe(nTexces)} fill="none" stroke={COUL_R[2]} strokeWidth="2.5"/>
          <line x1={X(Veq)} y1={h} x2={X(Veq)} y2={H - b} stroke="#94a3b8" strokeDasharray="5 4"/>
          <line x1={X(VT)} y1={h} x2={X(VT)} y2={H - b} stroke={ORANGE_GUIDE} strokeWidth="2"/>
          <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={h} x2={g} y2={H - b} stroke={KIT.txt}/>
          <text x={X(Veq)} y={h + 10} fontSize="12" fill={KIT.txt2} textAnchor="middle">V éq</text>
          <text x={(g + W - d) / 2} y={H - 6} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">volume de titrant versé (mL)</text>
          <text x={W - d - 4} y={h + 12} fontSize="12" fill={COUL_R[1]} textAnchor="end">R restant</text>
          <text x={W - d - 4} y={h + 28} fontSize="12" fill={COUL_R[2]} textAnchor="end">T en excès</text>
        </svg>
        <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Pour V = {fmt(VT, 2)} mL : il reste {sci(nRerlen(VT), 3)} mol de R dans l'erlenmeyer{nTexces(VT) > 0 ? `, et ${sci(nTexces(VT), 3)} mol de titrant en excès` : ''}.</div>
      </div>}
    </div>
  );
}
const COUL_R = ['#2563eb', '#ea580c', '#16a34a'];

// ════════════════ SIMULATION ════════════════
export function SimulationTitrageIndirect() {
  const [mode, setMode] = useState('explore');   // on arrive sur l'exploration libre
  const [onglet, setOnglet] = useState('general');
  const [guide, setGuide] = useEtatPersistant('titrage-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [mes, setMes] = useEtatPersistant('titrage-mesures-v1', { Ve: null, VeVieille: null });
  const [ouverts, setOuverts] = useState({ commandes: true, mesures: true });
  // Banc
  const [V2, setV2] = useState(0);
  const [ouvert, setOuvert] = useState(false);              // robinet de la burette
  const [amidon, setAmidon] = useState(false);
  const [declare, setDeclare] = useState(null);             // retour sur la déclaration d'équivalence
  // Réglages de l'exploration
  const [mExp, setMExp] = useState(30), [attExp, setAttExp] = useState(0), [V1Exp, setV1Exp] = useState(10), [c1Exp, setC1Exp] = useState(0.010), [c2Exp, setC2Exp] = useState(0.010);
  // Parcours : saisies du tableau et légendes du montage
  const [tab, setTab] = useState({ init: ['', '', '', ''], cours: ['', '', '', ''], fin: ['', '', '', ''], verif: {} });
  const [leg, setLeg] = useState({ l1: '', l2: '', l3: '', titrant: '', verif: false });
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;
  const ETAPE_TECHNICIEN = 18;                                // à partir de là, la solution S₀ est celle du technicien
  const params = enGuide ? { m: 30, attente: etape >= ETAPE_TECHNICIEN ? 8 : 0 }
    : enDefi && defi ? { m: defi.m, attente: 0 }
      : { m: mExp, attente: attExp, V1: V1Exp, c1: c1Exp, c2: c2Exp };
  const mod = modeleTitrage(params);
  const er = etatErlen(mod, V2);
  const coul = couleurSolution(er.cI2, amidon, 1.64e-3);

  // Écoulement de la burette (0,6 mL/s robinet ouvert)
  const refOuvert = useRef(ouvert); refOuvert.current = ouvert;
  useEffect(() => {
    if (!ouvert) return;
    let prec = performance.now(), id;
    const pas = now => {
      const dt = Math.min(0.1, (now - prec) / 1000); prec = now;
      setV2(v => { const nv = Math.min(V_BURETTE, v + 0.6 * dt); if (nv >= V_BURETTE) setOuvert(false); return nv; });
      if (refOuvert.current) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [ouvert]);
  function verser(dv) { setOuvert(false); setV2(v => Math.min(V_BURETTE, Math.round((v + dv) * 100) / 100)); setDeclare(null); }
  function nouveauTitrage() { setOuvert(false); setV2(0); setAmidon(false); setDeclare(null); }
  useEffect(() => { nouveauTitrage(); }, [mode, params.m, params.attente, params.V1, params.c1, params.c2]);
  function declarer() {
    setOuvert(false);
    // on juge sur ce que l'élève voit : tant que la solution est colorée, l'équivalence n'est pas atteinte
    const ecart = V2 - mod.Veq;
    const r = er.cI2 > seuilVisible(amidon) ? { ok: false, msg: 'Pas encore : il reste du diiode, la solution est encore colorée. Continuez, de plus en plus lentement.' }
      : ecart > 0.4 ? { ok: false, msg: `Vous avez dépassé l’équivalence de ${fmt(ecart, 1)} mL. Recommencez le titrage, en finissant goutte à goutte.` }
        : { ok: true, msg: `Équivalence repérée : V₂,ₑ = ${fmt(V2, 2)} mL.` };
    setDeclare(r);
    if (r.ok && enGuide) setMes(x => (etape >= ETAPE_TECHNICIEN ? { ...x, VeVieille: Math.round(V2 * 10) / 10 } : { ...x, Ve: Math.round(V2 * 10) / 10 }));
    if (r.ok && enDefi) setDefi(d => ({ ...d, Vmes: Math.round(V2 * 10) / 10 }));
  }

  // ── Valeurs de référence du DS ──
  const ref = modeleTitrage({ m: 30 });
  const vieille = modeleTitrage({ m: 30, attente: 8 });
  const n0 = ref.n0, n1 = ref.n1, nR = ref.nI2reste;

  // ── Tableau d'avancement à compléter ──
  const OPT = [['n₀ − x', 'n₀ − 2x', 'n₀ + x'], ['n₁ − x', 'n₁ − 2x', 'n₁ + x'], ['x', '2x', '0'], ['2x', 'x', '0']];
  const BON = ['n₀ − x', 'n₁ − x', 'x', '2x'];
  const vraiInit = [n0, n1, 0, 0], vraiFin = [0, nR, n0, 2 * n0];
  const okVal = (s, v) => { const x = lireNombre(s); return isFinite(x) && (Math.abs(v) < 1e-12 ? Math.abs(x) < 1e-7 : proche(x, v, 0.04)); };
  const initOk = tab.init.every((s, k) => okVal(s, vraiInit[k]));
  const coursOk = tab.cours.every((s, k) => s === BON[k]);
  const finOk = tab.fin.every((s, k) => okVal(s, vraiFin[k]));
  // ── Légendes du montage ──
  const LEGENDES = ['burette graduée', 'erlenmeyer', 'agitateur magnétique', 'bécher', 'pipette jaugée', 'éprouvette graduée'];
  const legOk = leg.l1 === 'burette graduée' && leg.l2 === 'erlenmeyer' && leg.l3 === 'agitateur magnétique' && leg.titrant === 'thio';

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'contexte', titre: 'Doser la vitamine C d’une gélule', focus: [],
      texte: <>Une gélule de Timoferol doit contenir <strong>30 mg de vitamine C</strong>. Pour le vérifier, on fait un <strong>titrage
        en retour</strong> : on ajoute un excès connu de diiode I₂, qui réagit avec toute la vitamine C ; puis on titre l'excès de
        diiode, celui qui n'a pas réagi.
        <div style={{ display: 'flex', margin: '8px 0', borderRadius: 6, overflow: 'hidden', border: `1px solid ${KIT.bord}`, fontSize: 12.5 }}>
          <div style={{ flex: 43, background: '#cbd5e1', padding: '5px 6px' }}>I₂ qui a réagi avec la vitamine C</div>
          <div style={{ flex: 57, background: '#fdba74', padding: '5px 6px' }}>I₂ restant : titré par le thiosulfate</div>
        </div>
        Plus il y avait de vitamine C, moins il reste de diiode à titrer.</>, tache: null },
    { id: 'c0', titre: 'La solution S₀', focus: ['erlen'],
      texte: <>On dissout la poudre de la gélule (on suppose m = 30 mg de vitamine C) dans une fiole de 100 mL. M(C₆H₈O₆) = 176,12 g/mol.</>,
      tache: { type: 'num', q: 'Concentration c₀ de la vitamine C dans S₀', unite: 'mol/L', vrai: ref.c0, tol: 0.03,
        pieges: [[ref.c0 * 1000, 'Convertissez la masse en grammes (30 mg = 0,030 g).'], [ref.c0 / 1000, 'Convertissez le volume en litres (100 mL = 0,100 L).'], [30e-3 / M_VITC, 'C’est une quantité de matière : divisez aussi par le volume de la fiole.']],
        aide: 'Écriture scientifique acceptée : 4,5e-3 par exemple.' } },
    { id: 'n0', titre: 'La prise d’essai', focus: ['erlen'],
      texte: <>On prélève V₀ = 25 mL de S₀, que l'on verse dans l'erlenmeyer.</>,
      tache: { type: 'num', q: 'Quantité de vitamine C n₀ dans la prise d’essai', unite: 'mol', vrai: n0, tol: 0.04,
        pieges: [[n0 * 1000, 'Le volume doit être en litres : 25 mL = 0,025 L.']] } },
    { id: 'n1', titre: 'Le diiode ajouté', focus: ['erlen'],
      texte: <>On ajoute V₁ = 10,0 mL de diiode à c₁ = 0,010 mol/L, et on agite 5 minutes : la réaction est lente, mais totale.</>,
      tache: { type: 'num', q: 'Quantité de diiode n₁ ajoutée', unite: 'mol', vrai: n1, tol: 0.02,
        pieges: [[n1 * 1000, 'Le volume doit être en litres.']] } },
    { id: 'limitant', titre: 'Le réactif limitant', focus: [],
      texte: <>C₆H₈O₆ + I₂ → C₆H₆O₆ + 2 H⁺ + 2 I⁻. Les deux réactifs ont le coefficient 1.</>,
      tache: { type: 'qcm', q: 'Quel est le réactif limitant ?', options: ['La vitamine C', 'Le diiode', 'Aucun des deux'], bonne: 0,
        expl: `n₀ / 1 = ${sci(n0, 2)} mol < n₁ / 1 = ${sci(n1, 2)} mol. C’est voulu : le diiode doit être en excès, pour qu’il en reste à titrer.` } },
    { id: 'xmax', titre: 'L’avancement maximal', focus: [],
      texte: <>La réaction s'arrête quand la vitamine C est épuisée.</>,
      tache: { type: 'num', q: 'Avancement maximal x_max', unite: 'mol', vrai: n0, tol: 0.04, pieges: [[n1, 'Le diiode n’est pas limitant.']] } },
    { id: 'tabInit', titre: 'Tableau d’avancement : état initial', focus: ['tableau'],
      texte: <>Le tableau est apparu sous le montage. Les ions H⁺ sont en large excès (milieu acide) : leur colonne est déjà remplie.</>,
      tache: { type: 'action', ok: initOk, consigne: initOk ? null : 'Remplissez la ligne, puis « Vérifier la ligne ».' } },
    { id: 'tabCours', titre: 'Tableau d’avancement : en cours', focus: ['tableau'],
      texte: <>On note n₀ et n₁ les quantités initiales de vitamine C et de diiode. Pensez au coefficient 2 devant I⁻.</>,
      tache: { type: 'action', ok: coursOk, consigne: coursOk ? null : 'Choisissez chaque expression, puis vérifiez la ligne.' } },
    { id: 'tabFin', titre: 'Tableau d’avancement : état final', focus: ['tableau'],
      texte: <>Remplissez l'état final, avec x<sub>max</sub> = n₀.</>,
      tache: { type: 'action', ok: finOk, consigne: finOk ? null : 'Remplissez la ligne, puis vérifiez-la.' } },
    { id: 'reste', titre: 'Le diiode restant', focus: ['erlen'],
      texte: <>C'est ce diiode restant qui va être titré par le thiosulfate.</>,
      tache: { type: 'num', q: 'Quantité de diiode restant n(I₂)restant', unite: 'mol', vrai: nR, tol: 0.03,
        pieges: [[n1 + n0, 'Le diiode est consommé : n₁ − x_max.']] } },
    { id: 'demi', titre: 'Partie 2 · Les demi-équations', focus: ['burette'],
      texte: <>Couples : I₂ / I⁻ et S₄O₆²⁻ / S₂O₃²⁻. Réaction de titrage : I₂ + 2 S₂O₃²⁻ → 2 I⁻ + S₄O₆²⁻ (rapide et totale).</>,
      tache: { type: 'qcm', q: 'Laquelle de ces demi-équations est une oxydation ?', options: ['2 S₂O₃²⁻ → S₄O₆²⁻ + 2 e⁻', 'I₂ + 2 e⁻ → 2 I⁻', 'S₄O₆²⁻ + 2 e⁻ → 2 S₂O₃²⁻'], bonne: 0,
        expl: 'Une oxydation est une perte d’électrons : les électrons sont du côté des produits.' } },
    { id: 'roles', titre: 'Oxydant et réducteur', focus: ['burette'],
      texte: <>Dans la réaction de titrage, une espèce capte les électrons, l'autre les cède.</>,
      tache: { type: 'qcm', q: 'Quel est le rôle de chaque réactif ?', options: ['I₂ est l’oxydant, S₂O₃²⁻ est le réducteur', 'I₂ est le réducteur, S₂O₃²⁻ est l’oxydant', 'Les deux sont des oxydants'], bonne: 0 } },
    { id: 'montage', titre: 'Le montage', focus: ['burette', 'erlen', 'agitateur'],
      texte: <>Légendez le montage (repères 1, 2 et 3 sur le schéma) et indiquez la solution titrante, dans le cadre « Légendes » sous le schéma.</>,
      tache: { type: 'action', ok: legOk, consigne: legOk ? null : 'Choisissez les quatre légendes, puis vérifiez.' } },
    { id: 'equiv', titre: 'L’équivalence', focus: [],
      texte: <>On verse le thiosulfate peu à peu.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce que l’équivalence ?', options: ['Le moment où les réactifs ont été introduits dans les proportions stœchiométriques', 'Le moment où l’on a versé autant de mL de titrant que de solution titrée', 'Le moment où la burette est vide'], bonne: 0,
        expl: 'À l’équivalence, le titrant versé est tout juste suffisant pour consommer tout le diiode restant.' } },
    { id: 'titrer', titre: 'Titrez !', focus: ['burette', 'erlen'],
      texte: <>Les commandes de la burette sont apparues. Versez le thiosulfate : rapidement d'abord, puis goutte à goutte quand la couleur pâlit.
        Quand la solution devient incolore, cliquez sur « C'est l'équivalence ! ».</>,
      tache: { type: 'action', ok: mes.Ve != null, consigne: mes.Ve != null ? `✅ V₂,ₑ mesuré = ${fmt(mes.Ve, 1)} mL` : `Versé : ${fmt(V2, 2)} mL` } },
    { id: 'couleur', titre: 'Pourquoi la couleur change-t-elle ?', focus: ['erlen'],
      texte: <>Toutes les espèces sont incolores, sauf le diiode.</>,
      tache: { type: 'qcm', q: 'Pourquoi la solution devient-elle incolore à l’équivalence ?', options: ['Il ne reste plus de diiode, seule espèce colorée', 'Le thiosulfate est un colorant blanc', 'La vitamine C a été détruite'], bonne: 0 } },
    { id: 'relation', titre: 'La relation à l’équivalence', focus: [],
      texte: <>À l'équivalence, le diiode restant et le thiosulfate versé sont dans les proportions de l'équation : 1 I₂ pour 2 S₂O₃²⁻.</>,
      tache: { type: 'qcm', q: 'Quelle relation est juste ?', options: ['n(I₂)restant = n(S₂O₃²⁻)ₑ / 2', 'n(I₂)restant = 2 n(S₂O₃²⁻)ₑ', 'n(I₂)restant = n(S₂O₃²⁻)ₑ'], bonne: 0 } },
    { id: 'Vth', titre: 'Le volume équivalent théorique', focus: ['burette'],
      texte: <>Avec n(S₂O₃²⁻)ₑ = c₂ × V₂,ₑ et c₂ = 0,010 mol/L.{mes.Ve != null && guide.reussies?.[etape] ? ` Vous avez mesuré ${fmt(mes.Ve, 1)} mL.` : ''}</>,
      tache: { type: 'num', q: 'V₂,ₑ théorique = 2 n(I₂)restant / c₂, en mL', unite: 'mL', vrai: ref.Veq, tol: 0.025,
        pieges: [[ref.Veq / 4, 'n(S₂O₃²⁻) = 2 n(I₂) : multipliez par 2, ne divisez pas.'], [ref.Veq / 1000, 'La réponse est demandée en mL.']] } },
    { id: 'technicien', titre: 'Partie 3 · Le technicien', focus: ['erlen'],
      texte: <>Un technicien a préparé S₀ le matin, mais ne l'a titrée qu'en fin d'après-midi : la solution est restée <strong>toute la
        journée à la lumière</strong>. Refaites le titrage avec sa solution (elle a été remplacée dans l'erlenmeyer).</>,
      tache: { type: 'action', ok: mes.VeVieille != null, consigne: mes.VeVieille != null ? `✅ V₂,ₑ mesuré = ${fmt(mes.VeVieille, 1)} mL` : `Versé : ${fmt(V2, 2)} mL` } },
    { id: 'plusPetite', titre: 'Plus ou moins de vitamine C ?', focus: ['burette'],
      texte: <>Il a fallu bien plus que 11,5 mL de thiosulfate.</>,
      tache: { type: 'qcm', q: 'La solution du technicien contenait-elle plus ou moins de 30 mg de vitamine C ?',
        options: ['Moins : il restait plus de diiode à titrer, donc moins de vitamine C l’avait consommé', 'Plus : on a versé plus de thiosulfate', 'Autant : seule la couleur change'], bonne: 0 } },
    { id: 'masse', titre: 'Combien en reste-t-il ? (pour aller plus loin)', focus: [],
      texte: <>n(I₂)restant = c₂ × V₂,ₑ / 2 ; n(vitamine C) = n₁ − n(I₂)restant dans 25 mL, donc 4 fois plus dans la fiole.</>,
      tache: { type: 'num', q: 'Masse de vitamine C encore présente dans S₀ (V₂,ₑ = 19,1 mL)', unite: 'mg', vrai: vieille.mReste, tol: 0.06,
        pieges: [[vieille.mReste / 4, 'Vous avez la masse dans 25 mL : la fiole en contient 100 mL.']], aide: 'Facultatif : vous pouvez voir la réponse.' } },
    { id: 'conclusion', titre: 'Peut-on conclure sur la gélule ?', focus: [],
      texte: <>La vitamine C se dégrade vite en solution, à la lumière et à température ambiante.</>,
      tache: { type: 'qcm', q: 'Peut-on estimer la masse de vitamine C de la gélule avec ce titrage ?',
        options: ['Non : on mesure ce qui reste après la dégradation, pas ce que contenait la gélule. Il faut titrer juste après avoir préparé S₀.', 'Oui : la gélule contenait environ 3 mg', 'Oui : il suffit de multiplier par 4'], bonne: 0 } },
    { id: 'amidon', titre: 'Une astuce de TP : l’empois d’amidon', focus: ['erlen'],
      texte: <>Près de l'équivalence, le jaune très pâle est difficile à voir. En TP, on ajoute alors quelques gouttes d'empois d'amidon (le bouton
        est apparu) : il colore en bleu sombre la moindre trace de diiode. Essayez sur un nouveau titrage.</>,
      tache: { type: 'qcm', q: 'Pourquoi ajoute-t-on l’empois d’amidon ?', options: ['Pour rendre le changement de couleur à l’équivalence bien plus net', 'Pour accélérer la réaction', 'Pour neutraliser l’acide'], bonne: 0,
        expl: 'Le bleu sombre disparaît brusquement à l’équivalence. On l’ajoute près de la fin, quand la solution est déjà jaune pâle.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez réalisé un titrage en retour complet. En exploration libre, réglez la masse de vitamine C, le temps d'attente de la
        solution, les volumes et les concentrations ; un second onglet permet de simuler le titrage de n'importe quelle réaction. Le défi
        vous propose une gélule mystère.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);
  const vu = id => !enGuide || etape >= idx(id);
  const passe = id => !enGuide || etape > idx(id);          // étape dépassée (toujours vrai hors parcours guidé)
  // En arrivant sur l'étape du technicien (ou d'un titrage), on repart d'une burette pleine ; à l'étape « V₂,ₑ théorique », on la remet aussi à zéro pour qu'elle n'affiche plus la valeur mesurée
  useEffect(() => { if (enGuide && (etape === idx('titrer') || etape === idx('Vth') || etape === idx('technicien'))) nouveauTitrage(); }, [etape, enGuide]);

  // ════════════════ SCHÉMA : BURETTE, ERLENMEYER, AGITATEUR ════════════════
  const yB0 = 30, yB1 = 230;                       // burette : 0 mL en haut, 25 mL en bas
  const yNivB = yB0 + V2 / V_BURETTE * (yB1 - yB0);
  const coule = ouvert;
  const schema = <SchemaBurette V2={V2} ouvert={ouvert} coul={coul} indicateur={amidon ? 'avec empois d’amidon' : null} hl={hl}
    etiquetteBurette={passe('montage') ? 'S₂O₃²⁻' : '?'}/>;   // en parcours, le titrant est l'objet de l'étape « Le montage »

  // ════════════════ TABLEAU ET LÉGENDES ════════════════
  const cell = { padding: '5px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 14 };
  const bord = ok => ({ width: 90, fontSize: 14, padding: '3px 5px', border: `1.5px solid ${ok === true ? '#16a34a' : ok === false ? '#dc2626' : KIT.bord}`, borderRadius: 5 });
  const ligneSaisie = (cle, vrais) => [0, 1, 2, 'H', 3].map(k => k === 'H' ? <td key="h" style={{ ...cell, color: '#2563eb', fontStyle: 'italic' }}>excès</td> : (
    <td key={k} style={cell}><input value={tab[cle][k]} aria-label={`${cle} case ${k + 1}`} onChange={e => { const v = e.target.value; setTab(x => ({ ...x, [cle]: x[cle].map((y, j) => (j === k ? v : y)), verif: { ...x.verif, [cle]: false } })); }}
      style={bord(tab.verif[cle] ? okVal(tab[cle][k], vrais[k]) : undefined)}/></td>));
  const btnVerif = cle => <td style={cell}><button onClick={() => setTab(x => ({ ...x, verif: { ...x.verif, [cle]: true } }))} style={stylePetitBouton(true, '#16a34a')}>Vérifier la ligne</button>
    {tab.verif[cle] && <span> {(cle === 'init' ? initOk : cle === 'cours' ? coursOk : finOk) ? '✅' : '❌'}</span>}</td>;
  const tableau = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
        <thead><tr><th style={cell}/><th style={cell}>C₆H₈O₆</th><th style={cell}>+ I₂</th><th style={cell}>→ C₆H₆O₆</th><th style={cell}>+ 2 H⁺</th><th style={cell}>+ 2 I⁻</th><th style={cell}/></tr></thead>
        <tbody>
          <tr><td style={cell}>état initial : x = 0</td>{ligneSaisie('init', vraiInit)}{btnVerif('init')}</tr>
          {vu('tabCours') && <tr><td style={cell}>en cours : x</td>{[0, 1, 2, 'H', 3].map(k => k === 'H' ? <td key="h" style={{ ...cell, color: '#2563eb', fontStyle: 'italic' }}>excès</td> : (
            <td key={k} style={cell}><select value={tab.cours[k]} aria-label={`en cours case ${k + 1}`} onChange={e => { const v = e.target.value; setTab(x => ({ ...x, cours: x.cours.map((y, j) => (j === k ? v : y)), verif: { ...x.verif, cours: false } })); }}
              style={{ ...bord(tab.verif.cours ? tab.cours[k] === BON[k] : undefined), width: 92 }}><option value="">?</option>{OPT[k].map(o => <option key={o} value={o}>{o}</option>)}</select></td>))}{btnVerif('cours')}</tr>}
          {vu('tabFin') && <tr><td style={cell}>état final : x<sub>max</sub> = n₀</td>{ligneSaisie('fin', vraiFin)}{btnVerif('fin')}</tr>}
        </tbody>
      </table>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Quantités en mol ; écriture scientifique acceptée (4,5e-5).</div>
    </div>
  );
  const sel = (k, label) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 14, color: KIT.txt }}>
      <span style={{ minWidth: 80, fontWeight: 700 }}>{label}</span>
      <select value={leg[k]} aria-label={`Légende ${label}`} onChange={e => { const v = e.target.value; setLeg(x => ({ ...x, [k]: v, verif: false })); }}
        style={{ ...bord(leg.verif ? (k === 'titrant' ? leg.titrant === 'thio' : leg[k] === { l1: 'burette graduée', l2: 'erlenmeyer', l3: 'agitateur magnétique' }[k]) : undefined), width: 220 }}>
        <option value="">?</option>
        {k === 'titrant' ? [['thio', 'thiosulfate, S₂O₃²⁻, c₂ = 0,010 mol/L'], ['iode', 'diiode, I₂, c₁ = 0,010 mol/L'], ['vitc', 'vitamine C, c₀ = 1,7 × 10⁻³ mol/L']].map(([v, t]) => <option key={v} value={v}>{t}</option>)
          : LEGENDES.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
  const legendes = (
    <div>
      {sel('l1', 'Repère 1')}{sel('l2', 'Repère 2')}{sel('l3', 'Repère 3')}{sel('titrant', 'Titrant')}
      <button onClick={() => setLeg(x => ({ ...x, verif: true }))} style={stylePetitBouton(true, '#16a34a')}>Vérifier</button>
      {leg.verif && <span style={{ marginLeft: 8 }}>{legOk ? '✅ Montage légendé' : '❌ Une légende est à revoir'}</span>}
    </div>
  );

  // ════════════════ COMMANDES ET MESURES ════════════════
  const commandes = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => { setDeclare(null); setOuvert(o => !o); }} style={styleBouton(true, ouvert ? '#dc2626' : '#16a34a')}>{ouvert ? '⏹ Fermer le robinet' : '▶ Ouvrir le robinet'}</button>
        <button onClick={() => verser(1)} style={styleBouton(false)}>+ 1 mL</button>
        <button onClick={() => verser(0.1)} style={styleBouton(false)}>+ 0,1 mL</button>
        <button onClick={() => verser(0.05)} style={styleBouton(false)}>💧 1 goutte</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={declarer} style={styleBouton(true, ORANGE_GUIDE)}>🎯 C'est l'équivalence !</button>
        <button onClick={nouveauTitrage} style={styleBouton(false)}>↺ Nouveau titrage</button>
        {vu('amidon') && <button onClick={() => setAmidon(a => !a)} style={styleBouton(amidon, '#4338ca')}>{amidon ? 'Empois d’amidon ajouté' : '🧪 Ajouter l’empois d’amidon'}</button>}
      </div>
      {declare && <div style={{ fontSize: 14, fontWeight: 700, color: declare.ok ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>{declare.ok ? '✅ ' : '❌ '}{declare.msg}</div>}
      {mode === 'explore' && <div style={{ marginTop: 8 }}>
        <Curseur nom="Masse de vitamine C dans la gélule" valeur={mExp} onChange={setMExp} min={0} max={60} pas={1} unite="mg" couleur="#e63946"/>
        <Curseur nom="Attente de S₀ à la lumière avant le titrage" valeur={attExp} onChange={setAttExp} min={0} max={10} pas={0.5} unite="h" decimales={1} couleur="#e63946"/>
        <Curseur nom="Volume de diiode V₁" valeur={V1Exp} onChange={setV1Exp} min={2} max={20} pas={0.5} unite="mL" decimales={1} couleur="#e63946"/>
        <Curseur nom="Concentration du diiode c₁" valeur={c1Exp * 1000} onChange={v => setC1Exp(v / 1000)} min={2} max={20} pas={1} unite="mmol/L" couleur="#e63946"/>
        <Curseur nom="Concentration du thiosulfate c₂" valeur={c2Exp * 1000} onChange={v => setC2Exp(v / 1000)} min={2} max={20} pas={1} unite="mmol/L" couleur="#e63946"/>
      </div>}
    </>
  );
  const mesures = (
    <>
      <LigneMesure nom="Volume versé (lu sur la burette)" valeur={vu('titrer') || !enGuide ? `${fmt(V2, 2)} mL` : '—'} couleur="#0284c7"/>
      {!enGuide && <>
        <LigneMesure nom="Vitamine C dans S₀ (après attente)" valeur={`${fmt(mod.mReste, 1)} mg`}/>
        <LigneMesure nom="n(I₂) restant avant titrage" valeur={`${sci(mod.nI2reste, 3)} mol`}/>
        <LigneMesure nom="n(I₂) dans l'erlenmeyer" valeur={`${sci(er.nI2, 3)} mol`} couleur="#c2410c"/>
        {mode === 'explore' && <LigneMesure nom="Volume équivalent" valeur={mod.toutConsomme ? 'pas de titrage possible' : `${fmt(mod.Veq, 2)} mL`}/>}
        {mod.toutConsomme && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6 }}>Tout le diiode a été consommé par la vitamine C : il n'en reste pas à titrer. Il faut ajouter plus de diiode.</div>}
        {mod.Veq > V_BURETTE && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 6 }}>Le volume équivalent dépasse la burette de 25 mL : diminuez le diiode ou augmentez c₂.</div>}
      </>}
    </>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi(type) {
    const r = Math.random();
    const m = type === 'mystere' ? 15 + Math.round(r * 25) : [24, 26, 28, 29, 30, 31, 33, 35, 37][Math.floor(r * 9)];
    setDefi({ type, m, reps: {}, verifie: false, Vmes: null });
  }
  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => nouveauDefi('mystere')} style={styleBouton(defi?.type === 'mystere', '#0ea5e9')}>❓ Gélule mystère</button>
        <button onClick={() => nouveauDefi('qualite')} style={styleBouton(defi?.type === 'qualite', '#0ea5e9')}>🏭 Contrôle qualité</button>
      </div>
      {defi && <>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          {defi.type === 'mystere' ? 'Une gélule contient une masse inconnue de vitamine C.' : 'Une gélule sort de l’usine : elle doit contenir 30 mg de vitamine C, à 10 % près.'}
          {' '}Même protocole que dans le DS (S₀ de 100 mL, prise d'essai de 25 mL, 10,0 mL de diiode à 0,010 mol/L, thiosulfate à 0,010 mol/L), titrage fait aussitôt.
          Titrez, puis calculez.
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: defi.Vmes != null ? '#15803d' : KIT.txt2 }}>
          {defi.Vmes != null ? `Votre volume équivalent : ${fmt(defi.Vmes, 1)} mL` : 'Repérez d’abord l’équivalence avec les commandes de la burette.'}
        </div>
        {[{ id: 'm', q: 'Masse de vitamine C dans la gélule', unite: 'mg' }, ...(defi.type === 'qualite' ? [{ id: 'conf', q: 'La gélule est-elle conforme ? (oui ou non)', unite: '' }] : [])].map((q, k) => {
          const vraiM = defi.Vmes != null ? (1e-4 - 0.010 * defi.Vmes / 1000 / 2) * 4 * M_VITC * 1000 : defi.m;
          const ok = q.id === 'm' ? proche(lireNombre(defi.reps.m || ''), vraiM, 0.05)
            : (defi.reps.conf || '').trim().toLowerCase() === (Math.abs(defi.m - 30) <= 3 ? 'oui' : 'non');
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const v = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 13, color: KIT.txt2 }}>{q.unite}</span>{defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {q.id === 'm' ? `${fmt(vraiM, 1)} mg` : (Math.abs(defi.m - 30) <= 3 ? 'oui' : 'non')}</div>}
            </div>
          );
        })}
        <div><button onClick={() => setDefi(d => ({ ...d, verifie: true }))} disabled={defi.Vmes == null} style={{ ...styleBouton(defi.Vmes != null, '#16a34a'), opacity: defi.Vmes != null ? 1 : 0.5 }}>✓ Vérifier</button></div>
        {defi.verifie && <div style={{ fontSize: 13, color: KIT.txt2 }}>Valeur réelle : {defi.m} mg. Votre résultat dépend de la précision de votre lecture de V₂,ₑ.</div>}
      </>}
    </div>
  );

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi('mystere'); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const vueBanc = mode !== 'explore' || onglet === 'banc';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ti-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ti-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .ti-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Titrage en retour</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {mode === 'explore' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['general', '📋 Titrage en retour pour toute réaction'], ['banc', '🧪 Exemple du dosage de la vitamine C d’une gélule']].map(([k, n]) =>
            <button key={k} onClick={() => setOnglet(k)} style={stylePetitBouton(onglet === k, '#e63946')}>{n}</button>)}
        </div>
      )}
      {mode === 'explore' && onglet === 'general' && <OutilTitrageRetour/>}
      {vueBanc && <>
        <div className="ti-l1">
          <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>
              {enGuide && etape >= ETAPE_TECHNICIEN ? 'Exemple : le titrage du technicien (solution restée 8 h à la lumière)' : 'Exemple : le dosage de la vitamine C d’une gélule'}
            </div>
            {schema}
            {/* les deux équations, toujours sous le schéma ; hors parcours, aussi le contenu de l'erlenmeyer et de la burette */}
            <ContexteBanc
              erlen={!enGuide && <>la prise d'essai de S₀ (V₀ = 25 mL, vitamine C) et le diiode en excès ({enDefi ? '10,0' : fmt(V1Exp, 1)} mL à {enDefi ? '0,010' : fmt(c1Exp, 3)} mol/L), après 5 minutes d'agitation.</>}
              burette={!enGuide && <>le thiosulfate de sodium, à {enDefi ? '0,010' : fmt(c2Exp, 3)} mol/L.</>}
              equations={[['Réaction préalable, dans l’erlenmeyer (lente, totale ; le diiode est en excès)', <>C₆H₈O₆<sub>(aq)</sub> + I₂<sub>(aq)</sub> → C₆H₆O₆<sub>(aq)</sub> + 2 H⁺<sub>(aq)</sub> + 2 I⁻<sub>(aq)</sub></>],
                ['Réaction support du titrage de l’excès de diiode (rapide, totale)', <>I₂<sub>(aq)</sub> + 2 S₂O₃²⁻<sub>(aq)</sub> → 2 I⁻<sub>(aq)</sub> + S₄O₆²⁻<sub>(aq)</sub></>]]}/>
            <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
              L'erlenmeyer contient la prise d'essai de S₀ et le diiode, après 5 minutes d'agitation.{passe('montage') ? ' La burette contient le thiosulfate.' : ''}{' '}
              Le zoom permet de lire le volume versé au dixième de millilitre.
            </div>
          </div>
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : enDefi ? <div style={styleBoite}>{voletDefi}</div>
              : <div style={styleBoite}>
                <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
                  <li>Mettez 60 mg de vitamine C : que se passe-t-il ? Pourquoi faut-il un excès de diiode ?</li>
                  <li>Laissez S₀ attendre 2 h, 4 h, 8 h : comment évolue le volume équivalent ?</li>
                  <li>Titrez sans indicateur, puis avec l'empois d'amidon : où voyez-vous le mieux l'équivalence ?</li>
                </ul>
              </div>}
        </div>
        <div className="ti-l2">
          <div data-apparait={`${idx('titrer')} ${idx('technicien')} ${idx('amidon')}`}>
            <Section titre="Commandes de la burette" ouvert={ouverts.commandes} onBascule={() => setOuverts(o => ({ ...o, commandes: !o.commandes }))}>
              {enGuide && !vu('titrer') ? <div style={{ fontSize: 13, color: KIT.txt2 }}>Les commandes apparaîtront au fil du parcours.</div> : commandes}
            </Section>
          </div>
          <div><Section titre="Mesures" ouvert={ouverts.mesures} onBascule={() => setOuverts(o => ({ ...o, mesures: !o.mesures }))}>{mesures}</Section></div>
          {enGuide && vu('montage') && etape <= idx('titrer') && <div style={{ ...styleBoite, position: 'relative' }} data-apparait={`${idx('montage')}`}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Légendes du montage</div>
            {legendes}
          </div>}
          {enGuide && vu('tabInit') && etape < idx('demi') && <div style={{ ...styleBoite, gridColumn: '1 / -1', position: 'relative' }} data-apparait={`${idx('tabInit')}`}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Tableau d'avancement de la réaction préalable</div>
            {tableau}
            {hl('tableau') && <div style={{ position: 'absolute', inset: -3, border: `3px dashed ${ORANGE_GUIDE}`, borderRadius: 12, pointerEvents: 'none' }}/>}
          </div>}
        </div>
      </>}
    </div>
  );
}
