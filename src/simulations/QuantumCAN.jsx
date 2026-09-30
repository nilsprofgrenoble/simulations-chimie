import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle } from "../commun";

// ====================================================
// SIM 15 — QUANTUM DU CAN → RÉSOLUTION EN TEMPÉRATURE
// ====================================================

// Régression polynomiale (ordre 2 ou 3)
export function polyReg(xs, ys, ordre) {
  const n = xs.length;
  const deg = ordre + 1;
  // Matrice de Vandermonde
  const A = xs.map(x => Array.from({length: deg}, (_, k) => Math.pow(x, k)));
  // Moindres carrés : (A^T A) c = A^T y
  const ATA2 = Array.from({length: deg}, (_, i) =>
    Array.from({length: deg}, (_, j) =>
      xs.reduce((s, x, k) => s + Math.pow(x, i) * Math.pow(x, j), 0)
    )
  );
  const ATy = Array.from({length: deg}, (_, i) =>
    xs.reduce((s, x, k) => s + Math.pow(x, i) * ys[k], 0)
  );
  // Résolution par élimination de Gauss
  const M = ATA2.map((row, i) => [...row, ATy[i]]);
  for (let col = 0; col < deg; col++) {
    let maxRow = col;
    for (let row = col + 1; row < deg; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    for (let row = col + 1; row < deg; row++) {
      const f = M[row][col] / M[col][col];
      for (let k = col; k <= deg; k++) M[row][k] -= f * M[col][k];
    }
  }
  const coeffs = new Array(deg).fill(0);
  for (let i = deg - 1; i >= 0; i--) {
    coeffs[i] = M[i][deg] / M[i][i];
    for (let k = i - 1; k >= 0; k--) M[k][deg] -= M[k][i] * coeffs[i];
  }
  // R²
  const yMean = ys.reduce((s, v) => s + v, 0) / n;
  const ssTot = ys.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = ys.reduce((s, v, i) => {
    const yHat = coeffs.reduce((sum, c, k) => sum + c * Math.pow(xs[i], k), 0);
    return s + (v - yHat) ** 2;
  }, 0);
  const r2 = 1 - ssRes / ssTot;
  return { coeffs, r2 };
}

export function evalPoly(coeffs, x) {
  return coeffs.reduce((s, c, k) => s + c * Math.pow(x, k), 0);
}

// Données exemple (CTN 10kΩ, β≈3950K, série 10kΩ, Vcc=5V)
export const CAN_EXEMPLE = `T (°C)\tUr (V)
5\t4.21
10\t4.02
15\t3.81
20\t3.58
25\t3.34
30\t3.09
35\t2.84
40\t2.59
45\t2.35
50\t2.12
55\t1.91
60\t1.71
65\t1.53
70\t1.37`;

export function parseDonnees(texte) {
  const lignes = texte.trim().split('\n');
  const pts = [];
  for (const ligne of lignes) {
        // Séparateur : tabulation ou point-virgule uniquement
    // (la virgule est réservée au séparateur décimal FR)
    const cols = ligne.trim().split(/[\t;]+/);
    if (cols.length < 2) continue;
    const t = parseFloat(cols[0].replace(',', '.'));
    const u = parseFloat(cols[1].replace(',', '.'));
    if (!isNaN(t) && !isNaN(u)) pts.push({ t, u });
  }
  return pts.sort((a, b) => a.u - b.u);
}

export function SimulationCAN({ plotlyReady }) {
  const [source, setSource] = useState(null); // null | 'exemple' | 'perso'
  const [texte, setTexte] = useState('');
  const [ordre, setOrdre] = useState(2);
  const [vmin, setVmin] = useState(0);
  const [vmax, setVmax] = useState(5);
  const [nbits, setNbits] = useState(10);
  const [urVal, setUrVal] = useState(null);
  const [showQuant, setShowQuant] = useState(false);

  const [etapeDonnees, setEtapeDonnees] = useState(false);
  const [etapeModele, setEtapeModele] = useState(false);
  const [etapeZoom, setEtapeZoom] = useState(false);

  const pts = useMemo(() => parseDonnees(texte), [texte]);
  const valide = pts.length >= ordre + 2;
  const quantum = (vmax - vmin) / (Math.pow(2, nbits) - 1);

  const reg = useMemo(() => {
    if (!valide) return null;
    return polyReg(pts.map(p => p.u), pts.map(p => p.t), ordre);
  }, [pts, ordre, valide]);

  const urMin = valide ? Math.min(...pts.map(p => p.u)) : 0;
  const urMax = valide ? Math.max(...pts.map(p => p.u)) : 5;
  const urCur = urVal !== null ? urVal : (urMin + urMax) / 2;

  function choisirExemple() {
    setTexte(CAN_EXEMPLE);
    setSource('exemple');
    setEtapeDonnees(false); setEtapeModele(false); setEtapeZoom(false);
  }
  function choisirPerso() {
    setTexte('');
    setSource('perso');
    setEtapeDonnees(false); setEtapeModele(false); setEtapeZoom(false);
  }

  // Graphe principal — nuage de points (+ modèle si étape suivante active)
  useEffect(() => {
    if (!plotlyReady || !valide || !etapeDonnees) return;
    const traces = [
      { x: pts.map(p => p.u), y: pts.map(p => p.t), mode: 'markers',
        marker: { color: '#334155', size: 8 }, name: 'Points exp.' },
    ];
    let shapes = [];
    if (etapeModele && reg) {
      const xs = [], ys = [];
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const u = urMin + (urMax - urMin) * i / N;
        xs.push(u); ys.push(evalPoly(reg.coeffs, u));
      }
      const T0 = evalPoly(reg.coeffs, urCur);
      traces.push({ x: xs, y: ys, mode: 'lines',
        line: { color: '#2a9d8f', width: 2.5 }, name: 'Modèle' });
      if (etapeZoom) {
        traces.push({ x: [urCur], y: [T0], mode: 'markers',
          marker: { color: '#f59e0b', size: 11 }, name: 'Point choisi' });
        shapes = [
          { type: 'line', x0: urCur, x1: urCur, y0: 0, y1: T0,
            line: { color: '#f59e0b', width: 1, dash: 'dot' } },
          { type: 'line', x0: urMin, x1: urCur, y0: T0, y1: T0,
            line: { color: '#f59e0b', width: 1, dash: 'dot' } },
        ];
      }
    }

     // Niveaux de quantification : segments Ur (verticaux, s'arrêtent sur le modèle)
    // + segments T (horizontaux, jusqu'à l'axe)
    if (showQuant && etapeModele && reg) {
      const kMin = Math.ceil((urMin - vmin) / quantum);
      const kMax = Math.floor((urMax - vmin) / quantum);
      const nLevels = kMax - kMin;
      if (nLevels > 0 && nLevels <= 80) {
        const yAxisMin = Math.min(...pts.map(p => p.t)) - 5;
        for (let k = kMin; k <= kMax; k++) {
          const u = vmin + k * quantum;
          if (u < urMin || u > urMax) continue;
          const tSurModele = evalPoly(reg.coeffs, u);
          // Segment vertical : du bas jusqu'au modèle (pas jusqu'en haut)
          shapes.push({ type: 'line', x0: u, x1: u, y0: yAxisMin, y1: tSurModele,
            line: { color: 'rgba(148,163,184,0.6)', width: 1 } });
          // Segment horizontal : du modèle jusqu'à l'axe Y (gauche)
          shapes.push({ type: 'line', x0: urMin, x1: u, y0: tSurModele, y1: tSurModele,
            line: { color: 'rgba(148,163,184,0.6)', width: 1 } });
        }
      }
    }

    Plotly.react('can-main', traces, {
      margin: { l: 52, r: 16, t: 10, b: 44 },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#1e293b', size: 12 },
      xaxis: { title: 'Ur (V)', gridcolor: showQuant ? 'transparent' : 'rgba(0,0,0,0.1)', zeroline: false, color: '#1e293b' },
      yaxis: { title: 'T (°C)', gridcolor: showQuant ? 'transparent' : 'rgba(0,0,0,0.1)', zeroline: false, color: '#1e293b' },
      legend: { x: 0.02, y: 0.98, bgcolor: 'transparent', font: { color: '#1e293b' } },
      showlegend: true,
      shapes,
    }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, pts, reg, urCur, urMin, urMax, etapeDonnees, etapeModele, etapeZoom, showQuant, quantum, vmin]);

  // Graphe zoom
  const dTmax = useMemo(() => {
    if (!reg) return 0.2;
    let max = 0;
    for (let i = 0; i <= 100; i++) {
      const u = urMin + (urMax - urMin) * i / 100;
      const dT = Math.abs(evalPoly(reg.coeffs, u + quantum) - evalPoly(reg.coeffs, u));
      if (dT > max) max = dT;
    }
    return max;
  }, [reg, urMin, urMax, quantum]);

  useEffect(() => {
    if (!plotlyReady || !valide || !reg || !etapeZoom) return;
    const T0 = evalPoly(reg.coeffs, urCur);
    const T1 = evalPoly(reg.coeffs, urCur + quantum);
    const span = quantum * 5;
    const xs = [], ys = [];
    for (let i = 0; i <= 80; i++) {
      const u = (urCur - span) + 2 * span * i / 80;
      xs.push(u); ys.push(evalPoly(reg.coeffs, u));
    }

    let quantShapesZoom = [];
    if (showQuant) {
      const kMin = Math.floor((urCur - span - vmin) / quantum);
      const kMax = Math.ceil((urCur + span - vmin) / quantum);
      for (let k = kMin; k <= kMax; k++) {
        const u = vmin + k * quantum;
        quantShapesZoom.push({ type: 'line', x0: u, x1: u, y0: 0, y1: 1, yref: 'paper',
          line: { color: 'rgba(148,163,184,0.7)', width: 1 } });
      }
    }

    Plotly.react('can-zoom', [
      { x: xs, y: ys, mode: 'lines',
        line: { color: '#2a9d8f', width: 2.5 }, hoverinfo: 'skip' },
      { x: [urCur, urCur + quantum], y: [T0, T1], mode: 'markers',
        marker: { color: '#f59e0b', size: 8 }, hoverinfo: 'skip' },
    ], {
      margin: { l: 56, r: 16, t: 10, b: 44 },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#1e293b', size: 11 },
      xaxis: { title: 'Ur (V)', gridcolor: 'rgba(0,0,0,0.1)',
        zeroline: false, tickformat: '.4f', color: '#1e293b',
        range: [urCur - quantum*5, urCur + quantum*6] },
      yaxis: { title: 'T (°C)', gridcolor: 'rgba(0,0,0,0.1)',
        zeroline: false, tickformat: '.2f', color: '#1e293b',
        range: [Math.min(T0,T1) - dTmax*4, Math.max(T0,T1) + dTmax*4] },
      showlegend: false,
      shapes: [
        ...quantShapesZoom,
        { type: 'line', x0: urCur, x1: urCur, y0: Math.min(T0,T1), y1: T0,
          line: { color: '#f59e0b', width: 1, dash: 'dot' } },
        { type: 'line', x0: urCur+quantum, x1: urCur+quantum, y0: Math.min(T0,T1), y1: T1,
          line: { color: '#f59e0b', width: 1, dash: 'dot' } },
        { type: 'line', x0: urCur, x1: urCur+quantum, y0: Math.min(T0,T1), y1: Math.min(T0,T1),
          line: { color: '#f59e0b', width: 1.5 } },
        { type: 'rect', x0: urCur, x1: urCur+quantum,
          y0: Math.min(T0,T1), y1: Math.max(T0,T1),
          fillcolor: 'rgba(245,158,11,0.15)', line: { color: '#f59e0b', width: 1 } },
      ],
    }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, reg, urCur, quantum, etapeZoom, dTmax, showQuant, vmin]);

  const T0 = reg ? evalPoly(reg.coeffs, urCur) : 0;
  const dT = reg ? Math.abs(evalPoly(reg.coeffs, urCur + quantum) - T0) : 0;

  const TXT = '#0f172a';
  const TXT2 = '#475569';
  const BORDER = '#cbd5e1';
  const BG = '#f8fafc';

  const inpStyle = {
    fontSize: 13, padding: '5px 9px',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 6, background: 'white', color: TXT, width: 120,
  };

  const boxStyle = {
    background: BG, borderRadius: 10,
    padding: '14px 16px', border: `1px solid ${BORDER}`,
  };

  const stepBtnStyle = () => ({
    padding: '10px 22px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontWeight: 700, fontSize: 14,
    background: '#2a9d8f', color: 'white', marginTop: 12,
  });

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, fontSize: 18, color: TXT, fontWeight: 700 }}>
        Quantum du CAN → résolution en température
      </h2>

      {/* ── CHOIX DE LA SOURCE ── */}
      {!source && (
        <div style={{ ...boxStyle, textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: TXT, marginBottom: 16 }}>
            Quelle source de données utiliser ?
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={choisirExemple}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                background: '#2a9d8f', color: 'white' }}>
              📊 Générer des données exemple (T, Ur)
            </button>
            <button onClick={choisirPerso}
              style={{ padding: '12px 24px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                background: '#0ea5e9', color: 'white' }}>
              📋 Utiliser mes données expérimentales
            </button>
          </div>
        </div>
      )}

      {/* ── DONNÉES + PARAMÈTRES CAN ── */}
      {source && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={boxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: TXT }}>Données expérimentales</div>
              <button onClick={() => setSource(null)}
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
                  border: `1px solid ${BORDER}`, background: 'white', color: TXT2 }}>
                ↺ Changer de source
              </button>
            </div>
            {source === 'perso' && (
              <div style={{ fontSize: 12, color: TXT2, marginBottom: 6 }}>
                Collez vos données depuis Google Sheets (2 colonnes : T en °C, U<sub>r</sub> en V) :
              </div>
            )}
            <textarea value={texte} onChange={e => setTexte(e.target.value)}
              rows={7}
              style={{ width: '100%', fontSize: 12, fontFamily: 'monospace', padding: 8,
                boxSizing: 'border-box', borderRadius: 6,
                border: `1px solid ${BORDER}`, background: 'white',
                color: TXT, resize: 'vertical', colorScheme: 'light' }}
              placeholder={"T (°C)\tUr (V)\n5\t4.21\n10\t4.02\n..."}
            />
            <div style={{ fontSize: 12, color: valide ? '#15803d' : '#dc2626', marginTop: 6, fontWeight: 600 }}>
              {valide ? `✓ ${pts.length} points chargés` : `⚠ Saisissez au moins ${ordre + 2} points`}
            </div>
            {valide && !etapeDonnees && (
              <button onClick={() => setEtapeDonnees(true)} style={stepBtnStyle()}>
                Afficher la courbe d'étalonnage →
              </button>
            )}
          </div>

          <div style={boxStyle}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: TXT }}>Paramètres du CAN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Tension min (V)</div>
                <input type="number" value={vmin} step="0.1"
                  onChange={e => setVmin(parseFloat(e.target.value) || 0)} style={inpStyle}/>
              </div>
              <div>
                <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Tension max (V)</div>
                <input type="number" value={vmax} step="0.1"
                  onChange={e => setVmax(parseFloat(e.target.value) || 5)} style={inpStyle}/>
              </div>
              <div>
                <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Nombre de bits</div>
                <input type="number" value={nbits} min={4} max={16}
                  onChange={e => setNbits(parseInt(e.target.value) || 10)} style={inpStyle}/>
              </div>
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px',
              background: 'white', borderRadius: 7, border: `1px solid ${BORDER}`,
              fontFamily: 'monospace', fontSize: 12, color: TXT }}>
              ΔU = ({vmax}−{vmin}) / (2<sup>{nbits}</sup>−1)<br/>
              = <strong style={{ color: '#d97706' }}>{(quantum * 1000).toFixed(2)} mV</strong>
            </div>
          </div>
        </div>
      )}

            {/* ── NUAGE DE POINTS + MODÈLE (fusionnés) ── */}
      {source && valide && etapeDonnees && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={boxStyle}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
              Courbe d'étalonnage
            </div>
            <div id="can-main" style={{ width: '100%', height: 380 }}/>
          </div>

          <div style={boxStyle}>
            {!etapeModele ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: TXT }}>
                  Ajuster un modèle
                </div>
                <button onClick={() => setEtapeModele(true)} style={{ ...stepBtnStyle(), width: '100%', marginTop: 0 }}>
                  Ajuster un modèle →
                </button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: TXT }}>Modèle polynomial</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {[1, 2, 3].map(o => (
                    <button key={o} onClick={() => setOrdre(o)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                        cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        background: ordre === o ? '#2a9d8f' : 'white',
                        border: `1.5px solid ${ordre === o ? '#2a9d8f' : BORDER}`,
                        color: ordre === o ? 'white' : TXT2 }}>
                      Ordre {o}
                    </button>
                  ))}
                </div>
                {reg && (
                  <div style={{ fontSize: 12, color: TXT, fontFamily: 'monospace', lineHeight: 1.9 }}>
                    {reg.coeffs.map((c, k) => (
                      <div key={k}>a<sub>{k}</sub> = {c.toFixed(5)}</div>
                    ))}
                    <div style={{ marginTop: 6, fontSize: 12, fontStyle: 'italic', color: TXT, lineHeight: 1.6 }}>
                      T = {reg.coeffs.map((c, k) => {
                        const signe = c >= 0 && k > 0 ? '+' : '';
                        if (k === 0) return `${c.toFixed(3)}`;
                        if (k === 1) return ` ${signe}${c.toFixed(3)}·Ur`;
                        return ` ${signe}${c.toFixed(3)}·Ur${k === 2 ? '²' : '³'}`;
                      }).join('')}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13,
                      color: reg.r2 > 0.9999 ? '#15803d' : '#b45309', fontWeight: 700 }}>
                      R² = {reg.r2.toFixed(6)}
                    </div>
                  </div>
                )}
                {!etapeZoom && (
                  <button onClick={() => setEtapeZoom(true)} style={{ ...stepBtnStyle(), width: '100%' }}>
                    Activer le zoom →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}


      {/* ── ZOOM + ENCART CHIFFRÉ ── */}
      {source && valide && etapeZoom && reg && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={boxStyle}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
              Curseur sur la courbe (voir graphique principal ci-dessus)
            </div>
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 12, color: TXT2, marginBottom: 4, fontWeight: 600 }}>
                <span>Ur = {urMin.toFixed(3)} V</span>
                <span style={{ color: '#d97706', fontWeight: 700 }}>Ur = {urCur.toFixed(3)} V</span>
                <span>Ur = {urMax.toFixed(3)} V</span>
              </div>
                <input type="range"
                min={vmin + Math.ceil((urMin - vmin) / quantum) * quantum}
                max={vmin + Math.floor((urMax - vmin) / quantum) * quantum}
                step={quantum}
                value={urCur}
                onChange={e => setUrVal(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}/>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
              color: TXT2, marginTop: 14, cursor: 'pointer', fontWeight: 600 }}>
              <input type="checkbox" checked={showQuant}
                onChange={e => setShowQuant(e.target.checked)}/>
              Afficher les niveaux de quantification du CAN
            </label>
            {showQuant && (urMax - urMin) / quantum > 80 && (
              <div style={{ fontSize: 11, color: '#b45309', marginTop: 6 }}>
                ⚠ Trop de niveaux pour être visibles sur cette courbe — regardez le graphique zoomé à droite.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={boxStyle}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
                Zoom — à l'échelle réelle
              </div>
              <div id="can-zoom" style={{ width: '100%', height: 260 }}/>
            </div>
            <div style={{ ...boxStyle, fontFamily: 'monospace', fontSize: 13 }}>
              {[
                ['Ur choisi', `${urCur.toFixed(3)} V`],
                ['T correspondante', `${T0.toFixed(2)} °C`],
                ['ΔU (quantum CAN)', `${(quantum * 1000).toFixed(2)} mV`],
                ['ΔT résultant', `${dT.toFixed(3)} °C`, true],
              ].map(([k, v, hi]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: `1px dashed ${BORDER}` }}>
                  <span style={{ color: TXT2, fontSize: 12, fontWeight: 600 }}>{k}</span>
                  <span style={{ fontWeight: 700, color: hi ? '#d97706' : TXT }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



