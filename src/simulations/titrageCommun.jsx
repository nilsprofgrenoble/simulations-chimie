import { useState } from "react";
import { fmt, sci, lireNombre, useEtatPersistant, KIT, stylePetitBouton, styleBoite, Curseur, ORANGE_GUIDE, Cadre } from "../commun";
import { Formule } from "./Avancement";

// ====================================================
// ÉLÉMENTS COMMUNS AUX DEUX TITRAGES (direct et en retour) :
// la burette et son zoom, la couleur de la solution, l'encadré de contexte, l'outil « titrage pour toute réaction ».
// ====================================================

export const V_BURETTE = 25;   // mL

// Concentration de diiode en dessous de laquelle l'œil ne voit plus de couleur (l'empois d'amidon ou le thiodène sont bien plus sensibles)
export const seuilVisible = indicateur => (indicateur ? 1e-7 : 6.6e-6);

// Couleur de la solution de diiode : rouge-brun → orangé → jaune → jaune pâle → incolore ;
// avec un indicateur (empois d'amidon, thiodène) : bleu très sombre tant qu'il reste du diiode.
// cRef : concentration de diiode au début du titrage (sert à étaler le dégradé).
export function couleurSolution(cI2, indicateur, cRef) {
  const mix = (a, b, t) => a.map((x, k) => Math.round(x + (b[k] - x) * t));
  const rgb = c => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  if (indicateur) {
    if (cI2 < seuilVisible(true)) return rgb([248, 250, 252]);
    return rgb(mix([186, 198, 255], [30, 27, 75], Math.sqrt(Math.min(1, cI2 / 2e-5))));
  }
  if (cI2 < seuilVisible(false)) return rgb([248, 250, 252]);
  const fonce = cRef > 0.01;                                   // solution concentrée (Lugol) : dégradé jusqu'au rouge-brun
  const pal = fonce ? [[248, 250, 252], [254, 249, 195], [253, 224, 71], [245, 158, 11], [194, 65, 12], [124, 45, 18]]
    : [[248, 250, 252], [254, 249, 195], [253, 224, 71], [245, 158, 11], [194, 65, 12]];
  const a = Math.min(1, Math.max(0, Math.log10(cI2 / seuilVisible(false)) / Math.log10(Math.max(cRef, 1e-5) / seuilVisible(false))));
  const x = a * (pal.length - 1), k = Math.min(pal.length - 2, Math.floor(x));
  return rgb(mix(pal[k], pal[k + 1], x - k));
}

// Encadré placé sous le schéma : l'équation (ou les équations) support du titrage, et, hors parcours guidé, le contenu de l'erlenmeyer et de la burette
export function ContexteBanc({ erlen, burette, equations }) {
  return (
    <div style={{ ...styleBoite, background: 'white', marginTop: 8, fontSize: 14, color: KIT.txt, lineHeight: 1.55 }}>
      {erlen && <div><strong>Dans l'erlenmeyer :</strong> {erlen}</div>}
      {burette && <div><strong>Dans la burette :</strong> {burette}</div>}
      {equations.map(([nom, eq], k) => (
        <div key={k} style={{ marginTop: erlen || k ? 6 : 0 }}>
          <strong>{nom} :</strong>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, textAlign: 'center', whiteSpace: 'nowrap', overflowX: 'auto', padding: '2px 0' }}>{eq}</div>
        </div>
      ))}
    </div>
  );
}

// Le montage : potence, burette graduée avec zoom de lecture, erlenmeyer, agitateur magnétique, repères 1-2-3
// etiquetteBurette : texte ou contenu (titrant) ; etiquetteErlen : contenu de l'erlenmeyer (facultatif) ; reperes : repères 1-2-3 à légender ; legendeCouleur : encadré « couleur de la solution »
export function SchemaBurette({ V2, ouvert, coul, indicateur, hl = () => false, etiquetteBurette = 'S₂O₃²⁻', etiquetteErlen = null, reperes = true, legendeCouleur = true }) {
  const yB0 = 30, yB1 = 230;                       // burette : 0 mL en haut, 25 mL en bas
  const yNivB = yB0 + V2 / V_BURETTE * (yB1 - yB0);
  const coule = ouvert;
  return (
    <svg viewBox="0 0 640 380" role="img" aria-label="Montage du titrage : burette, erlenmeyer, agitateur magnétique"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {/* potence */}
      <rect x="150" y="350" width="260" height="10" fill="#94a3b8"/><rect x="330" y="20" width="8" height="332" fill="#94a3b8"/>
      <rect x="250" y="120" width="86" height="8" fill="#94a3b8"/>
      {/* burette */}
      <rect x="236" y={yB0 - 12} width="24" height={yB1 - yB0 + 12} fill="#f8fafc" stroke={KIT.txt} strokeWidth="2"/>
      <rect x="238" y={yNivB} width="20" height={yB1 - yNivB} fill="#e0f2fe"/>
      {Array.from({ length: 26 }, (_, k) => k).map(v => {
        const y = yB0 + v / V_BURETTE * (yB1 - yB0);
        return <g key={v}><line x1={260} y1={y} x2={v % 5 === 0 ? 270 : 265} y2={y} stroke={KIT.txt} strokeWidth="1"/>
          {v % 5 === 0 && <text x="274" y={y + 4} fontSize="11" fill={KIT.txt}>{v}</text>}</g>;
      })}
      <path d={`M 236 ${yB1} L 244 ${yB1 + 22} L 252 ${yB1 + 22} L 260 ${yB1} Z`} fill="#e0f2fe" stroke={KIT.txt} strokeWidth="2"/>
      <rect x="240" y={yB1 + 22} width="16" height="8" rx="2" fill={ouvert ? '#16a34a' : '#dc2626'}/>
      <line x1="248" y1={yB1 + 30} x2="248" y2={yB1 + 44} stroke={KIT.txt} strokeWidth="3"/>
      {coule && [0, 1, 2].map(k => <circle key={k} cx="248" cy={yB1 + 48} r="2.5" fill="#7dd3fc"><animate attributeName="cy" from={yB1 + 46} to={yB1 + 78} dur="0.45s" begin={`${k * 0.15}s`} repeatCount="indefinite"/></circle>)}
      {typeof etiquetteBurette === 'string'
        ? <text x="214" y={yB0 - 18} fontSize="12" fill={KIT.txt2} textAnchor="middle">{etiquetteBurette}</text>
        : <foreignObject x="350" y="22" width="286" height="62"><div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.45 }}>{etiquetteBurette}</div></foreignObject>}
      {etiquetteErlen && <foreignObject x="350" y="262" width="286" height="62"><div style={{ fontSize: 13, color: KIT.txt, lineHeight: 1.4 }}>{etiquetteErlen}</div></foreignObject>}
      {/* zoom de lecture */}
      {(() => {
        const z0 = 110, zy = 40, zh = 130, zw = 56, mlParPx = 2 / zh, Yz = v => zy + zh / 2 + (v - V2) / mlParPx;
        return <g>
          <rect x={z0} y={zy} width={zw} height={zh} fill="#f8fafc" stroke={KIT.txt} strokeWidth="1.5"/>
          <rect x={z0} y={Math.max(zy, Math.min(zy + zh, Yz(V2)))} width={zw} height={Math.max(0, zy + zh - Math.max(zy, Yz(V2)))} fill="#e0f2fe"/>
          {Array.from({ length: 41 }, (_, k) => Math.round(V2 * 10) / 10 - 2 + k * 0.1).map(v => {
            const y = Yz(v); if (y < zy || y > zy + zh || v < -0.001 || v > V_BURETTE + 0.001) return null;
            const r10 = Math.round(v * 10);
            return <g key={r10}><line x1={z0 + zw - (r10 % 10 === 0 ? 18 : r10 % 5 === 0 ? 13 : 8)} y1={y} x2={z0 + zw} y2={y} stroke={KIT.txt}/>
              {r10 % 10 === 0 && <text x={z0 - 4} y={y + 4} fontSize="12" fill={KIT.txt} textAnchor="end">{r10 / 10}</text>}</g>;
          })}
          <path d={`M ${z0} ${Yz(V2) - 2} Q ${z0 + zw / 2} ${Yz(V2) + 6} ${z0 + zw} ${Yz(V2) - 2}`} fill="none" stroke="#0284c7" strokeWidth="2"/>
          <text x={z0 + zw / 2} y={zy - 6} fontSize="12" fill={KIT.txt2} textAnchor="middle">zoom (mL)</text>
          <line x1={z0 + zw} y1={zy + zh / 2} x2="236" y2={yNivB} stroke="#94a3b8" strokeDasharray="3 3"/>
        </g>;
      })()}
      {/* erlenmeyer et agitateur */}
      <rect x="196" y="320" width="104" height="30" rx="5" fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/>
      <circle cx="222" cy="335" r="5" fill="none" stroke={KIT.txt}/><circle cx="240" cy="335" r="5" fill="none" stroke={KIT.txt}/>
      <path d="M 234 266 L 234 280 L 206 318 L 290 318 L 262 280 L 262 266 Z" fill="white" stroke={KIT.txt} strokeWidth="2"/>
      <path d="M 224 296 L 272 296 L 287 316 L 209 316 Z" fill={coul}/>
      <rect x="240" y="311" width="16" height="4" rx="2" fill="white" stroke={KIT.txt2}>
        <animateTransform attributeName="transform" type="rotate" from="0 248 313" to="360 248 313" dur="0.6s" repeatCount="indefinite"/>
      </rect>
      {/* repères à légender */}
      {reperes && [[290, 80, '1'], [300, 300, '2'], [312, 335, '3']].map(([x, y, n]) => (
        <g key={n}><line x1={x - 22} y1={y} x2={x + 16} y2={y} stroke={KIT.txt2} strokeDasharray="4 3"/>
          <circle cx={x + 28} cy={y} r="11" fill="white" stroke={ORANGE_GUIDE} strokeWidth="2"/><text x={x + 28} y={y + 4.5} fontSize="13" fontWeight="800" fill={KIT.txt} textAnchor="middle">{n}</text></g>
      ))}
      {/* légende de couleur */}
      {legendeCouleur && <>
        <text x="470" y="290" fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">couleur de la solution</text>
        <rect x="430" y="298" width="80" height="34" rx="6" fill={coul} stroke={KIT.txt}/>
        <text x="470" y="352" fontSize="12" fill={KIT.txt2} textAnchor="middle">{indicateur || 'sans indicateur'}</text>
      </>}
      <Cadre actif={hl('burette')} x={204} y={8} w={90} h={270}/>
      <Cadre actif={hl('erlen')} x={198} y={260} w={100} h={60}/>
      <Cadre actif={hl('agitateur')} x={190} y={318} w={116} h={36}/>
    </svg>
  );
}

// ════════════════ TITRAGE DIRECT POUR TOUTE RÉACTION ════════════════
const COUL_ESP = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c'];
export function OutilTitrageGeneral() {
  const [titre, setTitre] = useEtatPersistant('titrage-outil-titre', { f: 'Fe2+(aq)', a: 5, mode: 'cV', c: 0.05, V: 20, n: 1e-3, m: 0.1, M: 55.8 });
  const [titrant, setTitrant] = useEtatPersistant('titrage-outil-titrant', { f: 'MnO4-(aq)', b: 1, c: 0.02 });
  const [produits, setProduits] = useEtatPersistant('titrage-outil-produits', [{ f: 'Fe3+(aq)', a: 5 }, { f: 'Mn2+(aq)', a: 1 }]);
  const [VB, setVB] = useState(0);
  const nA0 = titre.mode === 'cV' ? titre.c * titre.V / 1000 : titre.mode === 'n' ? titre.n : titre.m / titre.M;
  const Veq = nA0 * titrant.b / titre.a / Math.max(titrant.c, 1e-12) * 1000;       // mL
  const VBmax = Math.max(1, Math.ceil(Veq * 2));
  const quant = v => {
    const x = Math.min(titrant.c * v / 1000 / titrant.b, nA0 / titre.a);           // l'avancement suit le titrant tant qu'il reste du titré
    return { A: nA0 - titre.a * x, B: titrant.c * v / 1000 - titrant.b * x, P: produits.map(p => p.a * x) };
  };
  const q = quant(VB);
  const especes = [{ f: titre.f, n: q.A, c: COUL_ESP[0] }, { f: titrant.f, n: q.B, c: COUL_ESP[1] },
    ...produits.map((p, k) => ({ f: p.f, n: q.P[k], c: COUL_ESP[2 + k] }))];
  const nMax = Math.max(1e-12, nA0, ...produits.map(p => p.a * nA0 / titre.a), quant(VBmax).B);
  const inp = { fontSize: 14, padding: '4px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 };
  const num = (val, set, label, w = 80) => <input value={val} aria-label={label} onChange={e => { const x = lireNombre(e.target.value); if (isFinite(x) && x >= 0) set(x); }} style={{ ...inp, width: w }}/>;
  const coef = a => (a === 1 ? '' : `${a} `);
  const V25 = Math.min(VB, V_BURETTE);
  const etiqBur = <><div><strong>Burette :</strong> <Formule texte={titrant.f}/></div><div>c = {sci(titrant.c, 3)} mol/L</div></>;
  const etiqErl = <>
    <div><strong>Erlenmeyer :</strong> <Formule texte={titre.f}/></div>
    <div>{titre.mode === 'cV' ? <>c = {sci(titre.c, 3)} mol/L ; V = {fmt(titre.V, 1)} mL</> : titre.mode === 'n' ? <>n = {sci(titre.n, 3)} mol</> : <>m = {fmt(titre.m, 3)} g ; M = {fmt(titre.M, 1)} g/mol</>}</div>
  </>;
  // graphique n = f(V)
  const W = 520, H = 240, g = 56, d = 14, h = 14, b = 40;
  const X = v => g + v / VBmax * (W - g - d), Y = n => H - b - Math.max(0, n) / nMax * (H - b - h);
  const pts = k => Array.from({ length: 121 }, (_, i) => { const v = i * VBmax / 120, qq = quant(v); const n = k === 0 ? qq.A : k === 1 ? qq.B : qq.P[k - 2]; return `${X(v).toFixed(1)},${Y(n).toFixed(1)}`; }).join(' ');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: KIT.txt, textAlign: 'center', padding: '6px 0', overflowX: 'auto' }}>
          {coef(titre.a)}<Formule texte={titre.f}/> + {coef(titrant.b)}<Formule texte={titrant.f}/> → {produits.map((p, k) => <span key={k}>{k > 0 && ' + '}{coef(p.a)}<Formule texte={p.f}/></span>)}
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center' }}>Formules au clavier : MnO4- → MnO₄⁻, Fe2+ → Fe²⁺, S2O32- → S₂O₃²⁻. Les espèces spectatrices (H⁺, H₂O…) peuvent être omises.</div>
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Espèce titrée (dans l'erlenmeyer)</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <input type="number" min={1} max={20} value={titre.a} aria-label="Coefficient de l'espèce titrée" onChange={e => setTitre(t => ({ ...t, a: Math.max(1, parseInt(e.target.value, 10) || 1) }))} style={{ ...inp, width: 54 }}/>
            <input value={titre.f} aria-label="Formule de l'espèce titrée" onChange={e => setTitre(t => ({ ...t, f: e.target.value }))} style={{ ...inp, flex: 1 }}/>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
            {[['cV', 'c et V'], ['n', 'n'], ['mM', 'm et M']].map(([k, t]) => <button key={k} onClick={() => setTitre(x => ({ ...x, mode: k }))} style={stylePetitBouton(titre.mode === k, '#e63946')}>{t}</button>)}
          </div>
          {titre.mode === 'cV' && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>c = {num(titre.c, v => setTitre(t => ({ ...t, c: v })), 'Concentration du titré')} mol/L ; V = {num(titre.V, v => setTitre(t => ({ ...t, V: v })), 'Volume du titré', 60)} mL</div>}
          {titre.mode === 'n' && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>n = {num(titre.n, v => setTitre(t => ({ ...t, n: v })), 'Quantité du titré', 100)} mol</div>}
          {titre.mode === 'mM' && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>m = {num(titre.m, v => setTitre(t => ({ ...t, m: v })), 'Masse du titré', 70)} g ; M = {num(titre.M, v => setTitre(t => ({ ...t, M: v })), 'Masse molaire du titré', 70)} g/mol</div>}
        </div>
        <div style={styleBoite}>
          <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Solution titrante (dans la burette)</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <input type="number" min={1} max={20} value={titrant.b} aria-label="Coefficient du titrant" onChange={e => setTitrant(t => ({ ...t, b: Math.max(1, parseInt(e.target.value, 10) || 1) }))} style={{ ...inp, width: 54 }}/>
            <input value={titrant.f} aria-label="Formule du titrant" onChange={e => setTitrant(t => ({ ...t, f: e.target.value }))} style={{ ...inp, flex: 1 }}/>
          </div>
          <div style={{ fontSize: 13.5, color: KIT.txt2 }}>c = {num(titrant.c, v => setTitrant(t => ({ ...t, c: v })), 'Concentration du titrant')} mol/L</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, margin: '10px 0 4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Produits ({produits.length})</span>
            <span style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => produits.length > 1 && setProduits(l => l.slice(0, -1))} style={stylePetitBouton(false)} aria-label="Retirer un produit">−</button>
              <button onClick={() => produits.length < 3 && setProduits(l => [...l, { f: '', a: 1 }])} style={stylePetitBouton(false)} aria-label="Ajouter un produit">+</button>
            </span>
          </div>
          {produits.map((p, k) => (
            <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <input type="number" min={1} max={20} value={p.a} aria-label={`Coefficient du produit ${k + 1}`} onChange={e => setProduits(l => l.map((x, j) => (j === k ? { ...x, a: Math.max(1, parseInt(e.target.value, 10) || 1) } : x)))} style={{ ...inp, width: 54 }}/>
              <input value={p.f} aria-label={`Formule du produit ${k + 1}`} onChange={e => setProduits(l => l.map((x, j) => (j === k ? { ...x, f: e.target.value } : x)))} style={{ ...inp, flex: 1 }}/>
            </div>
          ))}
        </div>
      </div>
      <div style={styleBoite}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ flex: '1 1 340px', maxWidth: 560 }}>
            <SchemaBurette V2={V25} ouvert={false} coul="#dbeafe" indicateur={null} etiquetteBurette={etiqBur} etiquetteErlen={etiqErl} reperes={false} legendeCouleur={false}/>
            <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Le schéma suit vos réglages : contenu de la burette, de l’erlenmeyer et volume versé. La couleur de la solution n’est pas modélisée pour une réaction quelconque.</div>
            {(Veq > V_BURETTE || VB > V_BURETTE) && <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 4 }}>La burette ne contient que {V_BURETTE} mL : au-delà, il faudrait la remplir à nouveau (ou prendre un titrant plus concentré, ou moins de titré).</div>}
          </div>
          <div style={{ flex: '1 1 260px' }}>
        <Curseur nom="Volume de titrant versé V" valeur={VB} onChange={setVB} min={0} max={VBmax} pas={VBmax / 200} unite="mL" decimales={2} couleur="#e63946"/>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8 }}>
          Volume équivalent : <strong>V<sub>éq</sub> = {fmt(Veq, 2)} mL</strong> ; relation à l'équivalence : n(<Formule texte={titre.f}/>)<sub>initial</sub> / {titre.a} = n(<Formule texte={titrant.f}/>)<sub>versé</sub> / {titrant.b}.
          {' '}{VB < Veq ? 'Avant l’équivalence : le titrant est le réactif limitant.' : VB > Veq ? 'Après l’équivalence : le titré est épuisé, le titrant s’accumule.' : 'À l’équivalence.'}
        </div>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <svg viewBox="0 0 520 220" role="img" aria-label="Quantités de matière" style={{ width: '100%', height: 'auto', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
            {especes.map((e, k) => {
              const w = 440 / especes.length, xb = 50 + k * w, hb = Math.max(0, e.n) / nMax * 160;
              return <g key={k}>
                <rect x={xb + w * 0.15} y={185 - hb} width={w * 0.7} height={hb} fill={e.c} opacity="0.85"/>
                <text x={xb + w / 2} y={180 - hb} fontSize="12" fill={KIT.txt} textAnchor="middle">{sci(Math.max(0, e.n), 3)}</text>
                <foreignObject x={xb} y={190} width={w} height={26}><div style={{ textAlign: 'center', fontSize: 14 }}><Formule texte={e.f}/></div></foreignObject>
              </g>;
            })}
            <line x1="45" y1="185" x2="510" y2="185" stroke={KIT.txt}/>
          </svg>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Quantités en fonction du volume versé" style={{ width: '100%', height: 'auto', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
            {especes.map((e, k) => <polyline key={k} points={pts(k)} fill="none" stroke={e.c} strokeWidth="2.5"/>)}
            <line x1={X(Veq)} y1={h} x2={X(Veq)} y2={H - b} stroke="#94a3b8" strokeDasharray="5 4"/>
            <text x={X(Veq)} y={h + 10} fontSize="12" fill={KIT.txt2} textAnchor="middle">V éq</text>
            <line x1={X(VB)} y1={h} x2={X(VB)} y2={H - b} stroke={ORANGE_GUIDE} strokeWidth="2"/>
            <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={h} x2={g} y2={H - b} stroke={KIT.txt}/>
            <text x={g} y={H - b + 16} fontSize="12" fill={KIT.txt2} textAnchor="middle">0</text>
            <text x={W - d} y={H - b + 16} fontSize="12" fill={KIT.txt2} textAnchor="end">{fmt(VBmax, 1)} mL</text>
            <text x={(g + W - d) / 2} y={H - 6} fontSize="13" fontWeight="700" fill={KIT.txt} textAnchor="middle">volume versé V (mL)</text>
            <text x="14" y={(h + H - b) / 2} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 14 ${(h + H - b) / 2})`}>n (mol)</text>
          </svg>
        </div>
      </div>
    </div>
  );
}

