import { useState, useEffect, useRef, useMemo } from "react";
import { Field, cardStyle } from "../commun";

// SIM 12 — SIMULATION CLHP (BTS)
// Modèle de X. Bataille (ENCPB/RNChimie, 2008)

export const MOLECULES_CLHP = [
  { nom: "Paracétamol",          logP:  0.34 },
  { nom: "Caféine",              logP: -0.13 },
  { nom: "Phénol",               logP:  1.48 },
  { nom: "Phénacétine",          logP:  1.63 },
  { nom: "o-nitrophénol",        logP:  1.71 },
  { nom: "Ac. 2-aminobenzoïque", logP:  1.21 },
  { nom: "Ac. 2-chlorobenzoïque",logP:  2.01 },
  { nom: "Benzophénone",         logP:  3.18 },
  { nom: "Benzoate de méthyle",  logP:  2.20 },
  { nom: "Lidocaïne",            logP:  2.36 },
  { nom: "4-nitrobenz. éthyle",  logP:  2.33 },
  { nom: "Triphénylcarbinol",    logP:  4.59 },
  { nom: "1,3-diphénylacétone",  logP:  2.99 },
  { nom: "Benzaldéhyde",         logP:  1.64 },
  { nom: "Diméthylaniline",      logP:  1.86 },
  { nom: "m-nitrophénol",        logP:  1.93 },
  { nom: "Hydrobenzoïne",        logP:  1.86 },
];

export function SimulationCLHP({ plotlyReady }) {
  const [longueur, setLongueur] = useState(15);
  const [diametre, setDiametre] = useState(4.6);
  const [dp, setDp] = useState(5);
  const [nC, setNC] = useState(18);
  const [porosite, setPorosite] = useState(0.8);
  const [temperature, setTemperature] = useState(25);
  const [debit, setDebit] = useState(2.5);
  const [pctSolvOrg, setPctSolvOrg] = useState(50);
  const [mp, setMp] = useState(-0.64);
  const [mo, setMo] = useState(-0.61);
  const [bParam, setBParam] = useState(19);
  const [cParam, setCParam] = useState(-1.6);
  const [selected, setSelected] = useState([2, 4]);
  const [customMols, setCustomMols] = useState([]);
  const [newNom, setNewNom] = useState('');
  const [newLogP, setNewLogP] = useState(1.0);
  const [concs, setConcs] = useState({});
  const [epsilons, setEpsilons] = useState({});
  const [showExpData, setShowExpData] = useState(false);
  const [expTr, setExpTr] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const plotRef = useRef(null);

  const r = diametre / 20;
  const dpCm = dp * 1e-4;
  const phi = pctSolvOrg / 100;
  const tm = porosite * Math.PI * r * r * longueur / debit;
  const nPlateaux = longueur / (dpCm * nC);

  const allMols = [
    ...selected.map(i => ({
      ...MOLECULES_CLHP[i], idx: 'pre_' + i,
      conc: concs['pre_' + i] ?? 1,
      epsilon: epsilons['pre_' + i] ?? 10,
    })),
    ...customMols.map((m, i) => ({
      ...m, idx: 'cust_' + i,
      conc: concs['cust_' + i] ?? 1,
      epsilon: epsilons['cust_' + i] ?? 10,
    })),
  ];

  function calcMol(mol) {
    const ai = mp * mol.logP + mo;
    const lnk = phi > 0 ? ai * Math.log(phi) + bParam / temperature + cParam : -20;
    const k = Math.exp(lnk);
    const tr = tm * (1 + k);
    const W = nPlateaux > 0 ? 2.355 * tr / Math.sqrt(nPlateaux) : 0.1;
    const sigma = W / 2.355;
    return { k, tr, W, sigma };
  }

  const molsCalc = allMols.map(m => ({ ...m, ...calcMol(m) }))
    .sort((a, b) => a.tr - b.tr);

  const resolutions = molsCalc.slice(0, -1).map((m, i) => {
    const next = molsCalc[i + 1];
    if (m.W + next.W === 0) return null;
    return 1.18 * (next.tr - m.tr) / (m.W + next.W);
  });

  useEffect(() => {
    if (!plotlyReady || !plotRef.current || allMols.length === 0) return;
    const tMax = Math.max(tm * 2, ...molsCalc.map(m => m.tr + 3 * m.sigma));
    const N = 1200;
    const tArr = Array.from({ length: N }, (_, i) => i * tMax / (N - 1));
    const colors = ['#e63946','#2a9d8f','#6a4c93','#e9a824','#457b9d','#2d6a4f','#f4a261','#c77dff','#06d6a0'];
    const traces = [];
    const sigmaMort = Math.max(tm * 0.015, 0.005);
    traces.push({
      x: tArr, y: tArr.map(t => 0.3 * Math.exp(-0.5 * ((t - tm) / sigmaMort) ** 2)),
      mode: 'lines', name: 'Pic tps mort',
      line: { color: '#aaa', width: 1.5, dash: 'dot' },
    });
    const yTotal = new Array(N).fill(0);
    molsCalc.forEach((mol, idx) => {
      const { tr, sigma, conc, epsilon } = mol;
      const A = (conc ?? 1) * (epsilon ?? 10);
      const y = tArr.map(t => A * Math.exp(-0.5 * ((t - tr) / sigma) ** 2));
      y.forEach((v, i) => { yTotal[i] += v; });
      traces.push({
        x: tArr, y, mode: 'lines', name: mol.nom,
        line: { color: colors[idx % colors.length], width: 2 },
      });
    });
    traces.push({
      x: tArr, y: yTotal, mode: 'lines', name: 'Signal total',
      line: { color: '#333', width: 1.5, dash: 'dash' }, visible: 'legendonly',
    });
    Plotly.react(plotRef.current, traces, {
      xaxis: { title: 't (min)', gridcolor: 'rgba(128,128,128,0.15)', zeroline: false },
      yaxis: { title: 'Réponse détecteur', gridcolor: 'rgba(128,128,128,0.15)', zeroline: false },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      margin: { t: 20, r: 20, b: 50, l: 60 },
      legend: { bgcolor: 'transparent' }, font: { size: 12 },
    }, { responsive: true, displayModeBar: false });
  }, [plotlyReady, JSON.stringify(molsCalc.map(m => ({ tr: m.tr, sigma: m.sigma, conc: m.conc, epsilon: m.epsilon, nom: m.nom }))), pctSolvOrg, temperature, debit]);

  function toggleMol(idx) {
    setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  }
  function addCustomMol() {
    if (!newNom.trim()) return;
    setCustomMols(prev => [...prev, { nom: newNom.trim(), logP: newLogP }]);
    setNewNom(''); setNewLogP(1.0);
  }
  function removeCustom(i) { setCustomMols(prev => prev.filter((_, j) => j !== i)); }

  const inp = {
    width: 70, fontSize: 12, padding: '2px 6px',
    border: '1px solid var(--color-border-tertiary)', borderRadius: 4,
    background: 'var(--color-background-primary)', color: 'var(--color-text-primary)',
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, fontSize: 18, color: 'var(--color-text-primary)' }}>
        Simulation CLHP — Phase inverse — Niveau BTS
      </h2>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        D'après X. Bataille (ENCPB / RNChimie, 2008) — Phase inverse C{nC}, éluant acétonitrile/eau
      </div>

      {/* Paramètres */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>

        {/* Colonne */}
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 16px', minWidth: 220 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Colonne</div>
          {[
            ['Longueur (cm)', longueur, setLongueur, 1, 50, 1],
            ['Diamètre (mm)', diametre, setDiametre, 1, 10, 0.1],
            ['Taille particules dp (µm)', dp, setDp, 1, 20, 1],
            ['Greffage nC', nC, setNC, 1, 30, 1],
            ['Porosité ε', porosite, setPorosite, 0.1, 1, 0.05],
          ].map(([label, val, setter, min, max, step]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 5 }}>
              <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{label}</span>
              <input type="number" value={val} min={min} max={max} step={step}
                onChange={e => setter(parseFloat(e.target.value) || min)} style={inp}/>
            </div>
          ))}
        </div>

        {/* Éluant */}
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 16px', minWidth: 220 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Éluant</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            % solvant organique : <strong style={{ color: '#2a9d8f' }}>{pctSolvOrg} %</strong>
          </div>
          <input type="range" min={5} max={95} step={1} value={pctSolvOrg}
            onChange={e => setPctSolvOrg(Number(e.target.value))} style={{ width: '100%', marginBottom: 10 }}/>
          {[
            ['Débit (mL/min)', debit, setDebit, 0.1, 10, 0.1],
            ['Température (°C)', temperature, setTemperature, 5, 80, 1],
          ].map(([label, val, setter, min, max, step]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 5 }}>
              <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{label}</span>
              <input type="number" value={val} min={min} max={max} step={step}
                onChange={e => setter(parseFloat(e.target.value) || min)} style={inp}/>
            </div>
          ))}
        </div>

        {/* Infos colonne */}
        <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 16px', minWidth: 180 }}>
          <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Colonne calculée</div>
          {[
            ['Temps mort tₘ', tm.toFixed(3) + ' min'],
            ['Plateaux théoriques N', Math.round(nPlateaux).toLocaleString('fr-FR')],
            ['HEPT', (longueur / nPlateaux * 10).toFixed(2) + ' mm'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, gap: 12 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{l}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Paramètres avancés */}
      <button onClick={() => setShowAdvanced(v => !v)}
        style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 10,
          border: '1px solid var(--color-border-secondary)',
          background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }}>
        {showAdvanced ? '▲ Masquer paramètres avancés' : '▼ Paramètres avancés du modèle (mp, mo, b, c)'}
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16,
          padding: '12px 16px', background: 'var(--color-background-secondary)', borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: '100%', marginBottom: 4 }}>
            ln(k'ᵢ) = (mp·logPᵢ + mo)·ln(φ) + b/T + c &nbsp;—&nbsp; T en °C, φ = fraction vol. solvant organique
          </div>
          {[['mp', mp, setMp, -3, 0, 0.01],['mo', mo, setMo, -3, 1, 0.01],
            ['b', bParam, setBParam, 0, 50, 0.5],['c', cParam, setCParam, -5, 0, 0.1]].map(([label, val, setter, min, max, step]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--color-text-secondary)', minWidth: 20 }}>{label} =</span>
              <input type="number" value={val} min={min} max={max} step={step}
                onChange={e => setter(parseFloat(e.target.value))} style={{ ...inp, width: 80 }}/>
            </div>
          ))}
          <button onClick={() => { setMp(-0.64); setMo(-0.61); setBParam(19); setCParam(-1.6); }}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer',
              border: '1px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)', color: 'var(--color-text-secondary)' }}>
            Réinitialiser
          </button>
        </div>
      )}

      <hr style={{ margin: '12px 0', borderColor: 'var(--color-border-tertiary)' }}/>

      {/* Sélection molécules */}
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 10 }}>Composition du mélange</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {MOLECULES_CLHP.map((m, i) => (
          <button key={i} onClick={() => toggleMol(i)}
            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 16, cursor: 'pointer',
              border: selected.includes(i) ? '2px solid #2a9d8f' : '1px solid var(--color-border-tertiary)',
              background: selected.includes(i) ? '#e8f8f5' : 'var(--color-background-secondary)',
              color: selected.includes(i) ? '#1a7a6e' : 'var(--color-text-secondary)',
              fontWeight: selected.includes(i) ? 500 : 400 }}>
            {m.nom} <span style={{ opacity: 0.6, fontSize: 10 }}>logP={m.logP}</span>
          </button>
        ))}
      </div>

      {/* Ajout molécule custom */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
        <Field label="Nom de la molécule" value={newNom} onChange={setNewNom} width={160} type="text"/>
        <Field label="logP" value={newLogP} onChange={v => setNewLogP(parseFloat(v) || 0)} width={70}/>
        <button onClick={addCustomMol}
          style={{ padding: '5px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
            background: '#2a9d8f', color: 'white', border: 'none', fontWeight: 500 }}>
          + Ajouter
        </button>
        {customMols.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
            padding: '4px 10px', borderRadius: 16, border: '2px solid #6a4c93',
            background: '#f3eeff', color: '#6a4c93' }}>
            {m.nom} (logP={m.logP})
            <button onClick={() => removeCustom(i)}
              style={{ marginLeft: 4, background: 'none', border: 'none',
                cursor: 'pointer', color: '#6a4c93', fontSize: 14, padding: 0 }}>×</button>
          </div>
        ))}
      </div>

      {/* Tableau résultats */}
      {allMols.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)' }}>
                {['Molécule', 'logP', 'C (u.a.)', 'ε réponse', "tr calc. (min)", 'W½ (min)', "k'"].concat(
                  showExpData ? ['tr expéri. (min)', 'Écart (%)'] : []
                ).map(h => (
                  <th key={h} style={{ padding: '5px 8px', borderBottom: '1px solid var(--color-border-tertiary)',
                    textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {molsCalc.map((mol, idx) => {
                const ecart = showExpData && expTr[mol.idx]
                  ? Math.abs((mol.tr - expTr[mol.idx]) / expTr[mol.idx] * 100)
                  : null;
                const ecartColor = ecart !== null ? (ecart < 5 ? '#16a34a' : ecart < 15 ? '#d97706' : '#dc2626') : '';
                return (
                  <tr key={mol.idx} style={{ background: idx % 2 ? 'var(--color-background-secondary)' : 'transparent' }}>
                    <td style={{ padding: '4px 8px', fontWeight: 500 }}>{mol.nom}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--color-text-secondary)' }}>{mol.logP}</td>
                    <td style={{ padding: '4px 8px' }}>
                      <input type="number" value={concs[mol.idx] ?? 1} min={0} step={0.1}
                        onChange={e => setConcs(p => ({ ...p, [mol.idx]: parseFloat(e.target.value) || 0 }))}
                        style={{ ...inp, width: 60 }}/>
                    </td>
                    <td style={{ padding: '4px 8px' }}>
                      <input type="number" value={epsilons[mol.idx] ?? 10} min={0} step={1}
                        onChange={e => setEpsilons(p => ({ ...p, [mol.idx]: parseFloat(e.target.value) || 0 }))}
                        style={{ ...inp, width: 60 }}/>
                    </td>
                    <td style={{ padding: '4px 8px', fontWeight: 500 }}>{mol.tr.toFixed(3)}</td>
                    <td style={{ padding: '4px 8px' }}>{mol.W.toFixed(4)}</td>
                    <td style={{ padding: '4px 8px' }}>{mol.k.toFixed(3)}</td>
                    {showExpData && (
                      <>
                        <td style={{ padding: '4px 8px' }}>
                          <input type="number" value={expTr[mol.idx] ?? ''} min={0} step={0.01} placeholder="—"
                            onChange={e => setExpTr(p => ({ ...p, [mol.idx]: parseFloat(e.target.value) || '' }))}
                            style={{ ...inp, width: 70 }}/>
                        </td>
                        <td style={{ padding: '4px 8px', fontWeight: 500, color: ecartColor }}>
                          {ecart !== null ? ecart.toFixed(1) + ' %' : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {showExpData && molsCalc.some(m => expTr[m.idx]) && (() => {
                const vals = molsCalc.filter(m => expTr[m.idx])
                  .map(m => Math.abs((m.tr - expTr[m.idx]) / expTr[m.idx] * 100));
                const moy = vals.reduce((a, b) => a + b, 0) / vals.length;
                return (
                  <tr style={{ background: 'var(--color-background-secondary)', fontWeight: 500 }}>
                    <td colSpan={7} style={{ padding: '4px 8px' }}>Écart moyen</td>
                    <td/>
                    <td style={{ padding: '4px 8px', color: moy < 5 ? '#16a34a' : moy < 15 ? '#d97706' : '#dc2626' }}>
                      {moy.toFixed(1)} %
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Bouton comparaison expé */}
      <button onClick={() => setShowExpData(v => !v)}
        style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 12,
          border: '1px solid var(--color-border-secondary)',
          background: showExpData ? '#e8f8f5' : 'var(--color-background-secondary)',
          color: showExpData ? '#1a7a6e' : 'var(--color-text-secondary)' }}>
        {showExpData ? '✓ Comparaison expérimentale activée' : '+ Comparer avec des tr expérimentaux'}
      </button>

      {/* Résolutions */}
      {resolutions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {resolutions.map((R, i) => {
            if (R === null || isNaN(R)) return null;
            const color = R >= 1.5 ? '#16a34a' : R >= 1.0 ? '#d97706' : '#dc2626';
            const symbole = R >= 1.5 ? '✓' : R >= 1.0 ? '⚠' : '✗';
            return (
              <div key={i} style={{ background: 'var(--color-background-secondary)',
                borderRadius: 8, padding: '5px 10px', fontSize: 12,
                border: '1px solid var(--color-border-tertiary)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  R({molsCalc[i].nom.split(' ')[0]} / {molsCalc[i+1].nom.split(' ')[0]}) =
                </span>
                {' '}
                <strong style={{ color }}>{R.toFixed(2)} {symbole}</strong>
              </div>
            );
          })}
        </div>
      )}

      {/* Chromatogramme */}
      {allMols.length > 0
        ? <div ref={plotRef} style={{ width: '100%', height: 380 }}/>
        : (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: 13,
            color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', borderRadius: 10 }}>
            Sélectionnez au moins une molécule pour afficher le chromatogramme.
          </div>
        )
      }

      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
        Résolution : <span style={{ color: '#16a34a' }}>✓ R ≥ 1,5</span> pics séparés ·{' '}
        <span style={{ color: '#d97706' }}>⚠ 1,0 ≤ R &lt; 1,5</span> partiellement séparés ·{' '}
        <span style={{ color: '#dc2626' }}>✗ R &lt; 1,0</span> pics superposés
      </div>
    </div>
  );
}

