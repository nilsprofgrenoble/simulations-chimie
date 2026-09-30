import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle } from "../commun";

// ====================================================
// SIM — ESSAIS D'APTITUDE / Z-SCORE
// ====================================================

export function genererLabos(n, moyenneCible, includeOutlier) {
  const cv = 0.015;
  const sPop = Math.abs(moyenneCible) * cv || 0.1;

  function gaussRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const valeurs = Array.from({ length: n }, () => moyenneCible + gaussRandom() * sPop);

  if (includeOutlier && n >= 3) {
    const idx = Math.floor(Math.random() * n);
    const signe = Math.random() < 0.5 ? -1 : 1;
    let factor = 3.0;
    // Ajuste le décalage jusqu'à ce que le Z-score RÉEL (calculé sur
    // l'échantillon complet, outlier inclus) dépasse bien 2.5 en valeur absolue
    for (let iter = 0; iter < 30; iter++) {
      valeurs[idx] = moyenneCible + signe * factor * sPop;
      const mean = valeurs.reduce((a, b) => a + b, 0) / n;
      const variance = valeurs.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
      const s = Math.sqrt(variance);
      const z = s > 0 ? (valeurs[idx] - mean) / s : 0;
      if (Math.abs(z) >= 2.5) break;
      factor += 0.5;
    }
  }

  return valeurs.map((v, i) => ({ nom: `Technicien ${i + 1}`, valeur: v }));
}

export function decimales(v) {
  const av = Math.abs(v);
  if (av === 0) return 2;
  if (av < 1) return 4;
  if (av < 10) return 3;
  return 2;
}

export function parseLabos(texte) {
  const lignes = texte.trim().split('\n');
  const labos = [];
  for (const ligne of lignes) {
    const cols = ligne.trim().split(/[\t;]+/);
    if (cols.length < 2) continue;
    const nom = cols[0].trim();
    const v = parseFloat(cols[1].replace(',', '.'));
    if (nom && !isNaN(v)) labos.push({ nom, valeur: v });
  }
  return labos;
}

export function SimulationAptitude({ plotlyReady }) {
  const [mode, setMode] = useState(null); // null | 'generer' | 'coller'
  const [mesurande, setMesurande] = useState('m(vitamine C)');
  const [unite, setUnite] = useState('mg');
  const [nTech, setNTech] = useState(9);
  const [moyenneCible, setMoyenneCible] = useState(31.5);
  const [outlier, setOutlier] = useState(true);
  const [jeuMode, setJeuMode] = useState(false);
  const [laboACalculer, setLaboACalculer] = useState(0);
  const [reponsesStatut, setReponsesStatut] = useState({});
  const [zSaisi, setZSaisi] = useState('');
  const [verifie, setVerifie] = useState(false);
  const [intervalleS, setIntervalleS] = useState(null);
  const [texteColle, setTexteColle] = useState('');

  const [labos, setLabos] = useState([]);
  const [valide, setValide] = useState(false);

  function generer() {
    const l = genererLabos(nTech, moyenneCible, outlier);
    setLabos(l);
    setValide(true);
    setReponsesStatut({}); setZSaisi(''); setVerifie(false);
    setLaboACalculer(Math.floor(Math.random() * nTech));
  }

  function validerColle() {
    const l = parseLabos(texteColle);
    setLabos(l);
    setValide(l.length >= 3);
    setReponsesStatut({}); setZSaisi(''); setVerifie(false);
    setLaboACalculer(Math.floor(Math.random() * l.length));
  }

  // Statistiques
  const stats = useMemo(() => {
    if (!valide || labos.length < 3) return null;
    const vals = labos.map(l => l.valeur);
    const n = vals.length;
    const moy = vals.reduce((s, v) => s + v, 0) / n;
    const variance = vals.reduce((s, v) => s + (v - moy) ** 2, 0) / (n - 1);
    const s = Math.sqrt(variance);
    const avecZ = labos.map(l => ({ ...l, z: s > 0 ? (l.valeur - moy) / s : 0 }));
    return { moy, s, avecZ, n };
  }, [labos, valide]);

  function zStatut(z) {
    const az = Math.abs(z);
    if (az <= 2) return { label: 'satisfaisant', color: '#15803d', bg: '#dcfce7' };
    if (az < 3) return { label: 'douteux', color: '#b45309', bg: '#fef3c7' };
    return { label: 'non satisfaisant', color: '#b91c1c', bg: '#fee2e2' };
  }

  // Diagramme en barres
  useEffect(() => {
    if (!plotlyReady || !stats) return;
    const { moy, s, avecZ } = stats;
    const colors = avecZ.map(l => zStatut(l.z).color);

    Plotly.react('apt-bars', [
      { x: avecZ.map(l => l.nom), y: avecZ.map(l => l.valeur), type: 'bar',
        marker: { color: colors }, name: mesurande },
    ], {
      margin: { l: 56, r: 16, t: 10, b: 70 },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#1e293b', size: 11 },
      xaxis: { color: '#1e293b', tickangle: -30 },
            yaxis: { title: `${mesurande} (${unite})`, gridcolor: 'rgba(0,0,0,0.1)',
        color: '#1e293b', zeroline: false,
        range: [moy - 3.5*s, moy + 3.5*s] },
      showlegend: false,
      shapes: [
        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: moy, y1: moy,
          line: { color: '#1e293b', width: 2 } },
        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: moy + s, y1: moy + s,
          line: { color: '#d97706', width: 1, dash: 'dash' } },
        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: moy - s, y1: moy - s,
          line: { color: '#d97706', width: 1, dash: 'dash' } },
        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: moy + 2*s, y1: moy + 2*s,
          line: { color: '#dc2626', width: 1, dash: 'dot' } },
        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: moy - 2*s, y1: moy - 2*s,
          line: { color: '#dc2626', width: 1, dash: 'dot' } },
      ],
      annotations: [
        { x: 1, xref: 'paper', xanchor: 'left', y: moy, text: 'moy', showarrow: false,
          font: { color: '#1e293b', size: 10 } },
        { x: 1, xref: 'paper', xanchor: 'left', y: moy+s, text: '+s', showarrow: false,
          font: { color: '#d97706', size: 10 } },
        { x: 1, xref: 'paper', xanchor: 'left', y: moy-s, text: '-s', showarrow: false,
          font: { color: '#d97706', size: 10 } },
        { x: 1, xref: 'paper', xanchor: 'left', y: moy+2*s, text: '+2s', showarrow: false,
          font: { color: '#dc2626', size: 10 } },
        { x: 1, xref: 'paper', xanchor: 'left', y: moy-2*s, text: '-2s', showarrow: false,
          font: { color: '#dc2626', size: 10 } },
      ],
    }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, stats, mesurande, unite]);

  // Courbe gaussienne
  useEffect(() => {
    if (!plotlyReady || !stats) return;
    const { moy, s, avecZ } = stats;
    const xs = [], ys = [];
    const xMin = moy - 4*s, xMax = moy + 4*s;
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xMax - xMin) * i / 200;
      const y = (1/(s*Math.sqrt(2*Math.PI))) * Math.exp(-0.5*((x-moy)/s)**2);
      xs.push(x); ys.push(y);
    }
    const pdfAt = x => (1/(s*Math.sqrt(2*Math.PI))) * Math.exp(-0.5*((x-moy)/s)**2);

    const traces = [];

    if (intervalleS) {
      const xsZone = [], ysZone = [];
      const bMin = moy - intervalleS*s, bMax = moy + intervalleS*s;
      for (let i = 0; i <= 100; i++) {
        const x = bMin + (bMax - bMin) * i / 100;
        xsZone.push(x); ysZone.push(pdfAt(x));
      }
      traces.push({
        x: xsZone, y: ysZone, mode: 'lines', fill: 'tozeroy',
        fillcolor: 'rgba(42,157,143,0.25)', line: { width: 0 },
        hoverinfo: 'skip', showlegend: false,
      });
    }

    traces.push({ x: xs, y: ys, mode: 'lines', line: { color: '#334155', width: 2 },
      hoverinfo: 'skip', showlegend: false });

    avecZ.forEach(l => {
      const c = zStatut(l.z).color;
      const yTop = pdfAt(l.valeur);
      traces.push({
        x: [l.valeur, l.valeur], y: [0, yTop], mode: 'lines',
        line: { color: c, width: 2 }, hoverinfo: 'text',
        text: `${l.nom}<br>${l.valeur.toFixed(decimales(moy))} ${unite}<br>Z = ${l.z.toFixed(2)}`,
        showlegend: false,
      });
    });

    Plotly.react('apt-gauss', traces, {
      margin: { l: 56, r: 16, t: 10, b: 46 },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#1e293b', size: 11 },
      xaxis: { title: `${mesurande} (${unite})`, gridcolor: 'rgba(0,0,0,0.1)',
        color: '#1e293b', zeroline: false },
      yaxis: { title: 'Densité de probabilité', gridcolor: 'rgba(0,0,0,0.1)',
        color: '#1e293b', zeroline: false, showticklabels: false },
      showlegend: false,
      shapes: [
        { type: 'line', x0: moy, x1: moy, y0: 0, y1: 1, yref: 'paper',
          line: { color: '#1e293b', width: 1.5, dash: 'dash' } },
        { type: 'line', x0: moy+2*s, x1: moy+2*s, y0: 0, y1: 1, yref: 'paper',
          line: { color: '#dc2626', width: 1, dash: 'dot' } },
        { type: 'line', x0: moy-2*s, x1: moy-2*s, y0: 0, y1: 1, yref: 'paper',
          line: { color: '#dc2626', width: 1, dash: 'dot' } },
      ],
    }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, stats, mesurande, unite, intervalleS]);

  const TXT = '#0f172a';
  const TXT2 = '#475569';
  const BORDER = '#cbd5e1';
  const BG = '#f8fafc';

  const boxStyle = { background: BG, borderRadius: 10, padding: '14px 16px',
    border: `1px solid ${BORDER}` };
  const inpStyle = { fontSize: 13, padding: '5px 9px', border: `1.5px solid ${BORDER}`,
    borderRadius: 6, background: 'white', color: TXT };
  const btnStyle = { padding: '10px 22px', borderRadius: 8, border: 'none',
    cursor: 'pointer', fontWeight: 700, fontSize: 14, background: '#2a9d8f', color: 'white' };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, fontSize: 18, color: TXT, fontWeight: 700 }}>
        Essais d'aptitude — critère du Z-score
      </h2>

      {/* ── CHOIX MODE ── */}
      {!mode && (
        <div style={{ ...boxStyle, textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: TXT, marginBottom: 16 }}>
            Comment obtenir les résultats des différents laboratoires ?
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setMode('generer')}
              style={{ ...btnStyle, background: '#2a9d8f' }}>
              🎲 Générer un jeu de données
            </button>
            <button onClick={() => setMode('coller')}
              style={{ ...btnStyle, background: '#0ea5e9' }}>
              📋 Coller mes données de classe
            </button>
          </div>
        </div>
      )}

      {/* ── PARAMÈTRES COMMUNS (nom / unité) ── */}
      {mode && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Grandeur mesurée</div>
              <input value={mesurande} onChange={e => setMesurande(e.target.value)}
                style={{ ...inpStyle, width: 160 }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, color: TXT2, marginBottom: 3, fontWeight: 600 }}>Unité</div>
              <input value={unite} onChange={e => setUnite(e.target.value)}
                style={{ ...inpStyle, width: 70 }}/>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            color: TXT, cursor: 'pointer', fontWeight: 600, marginRight: 10 }}>
            <input type="checkbox" checked={jeuMode}
              onChange={e => { setJeuMode(e.target.checked); setVerifie(false); setReponsesStatut({}); setZSaisi(''); }}/>
            🎮 Mode jeu
          </label>
          <button onClick={() => { setMode(null); setValide(false); setLabos([]); }}
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${BORDER}`, background: 'white', color: TXT2 }}>
            ↺ Recommencer
          </button>
        </div>
      )}

      {/* ── MODE GÉNÉRER ── */}
      {mode === 'generer' && (
        <div style={{ ...boxStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>
                Nombre de techniciens
              </div>
              <input type="number" min={3} max={20} value={nTech}
                onChange={e => setNTech(Math.max(3, Math.min(20, parseInt(e.target.value) || 3)))}
                style={{ ...inpStyle, width: 90 }}/>
            </div>
            <div>
              <div style={{ fontSize: 12, color: TXT2, marginBottom: 3, fontWeight: 600 }}>
                Valeur moyenne cible ({unite})
              </div>
              <input type="number" step="0.1" value={moyenneCible}
                onChange={e => setMoyenneCible(parseFloat(e.target.value) || 0)}
                style={{ ...inpStyle, width: 110 }}/>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: TXT, cursor: 'pointer', fontWeight: 600, paddingBottom: 6 }}>
              <input type="checkbox" checked={outlier}
                onChange={e => setOutlier(e.target.checked)}/>
              Inclure un labo défectueux
            </label>
            <button onClick={generer} style={btnStyle}>🎲 Générer</button>
          </div>
        </div>
      )}

      {/* ── MODE COLLER ── */}
      {mode === 'coller' && (
        <div style={{ ...boxStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: TXT2, marginBottom: 6 }}>
            Collez vos données (2 colonnes séparées par tabulation ou point-virgule :
            nom du technicien/labo, résultat) :
          </div>
          <textarea value={texteColle} onChange={e => setTexteColle(e.target.value)}
            rows={7}
            style={{ width: '100%', fontSize: 12, fontFamily: 'monospace', padding: 8,
              boxSizing: 'border-box', borderRadius: 6, border: `1px solid ${BORDER}`,
              background: 'white', color: TXT, resize: 'vertical', colorScheme: 'light' }}
            placeholder={"Michel\t31.33\nSarah\t32.03\nLéo\t31.95\n..."}
          />
          <button onClick={validerColle} style={{ ...btnStyle, marginTop: 10 }}>
            ✓ Valider les données
          </button>
          {texteColle && !valide && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 600 }}>
              ⚠ Au moins 3 lignes valides (nom + valeur numérique) sont nécessaires.
            </div>
          )}
        </div>
      )}

      {/* ── RÉSULTATS ── */}
      {valide && stats && (
        <>
          {/* Résumé stats */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              ['n', stats.n],
              ['Moyenne', `${stats.moy.toFixed(decimales(stats.moy))} ${unite}`],
              ['Écart-type s', `${stats.s.toFixed(decimales(stats.s))} ${unite}`],
            ].map(([l, v]) => (
              <div key={l} style={{ ...boxStyle, padding: '8px 16px' }}>
                <div style={{ fontSize: 11, color: TXT2, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TXT }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            <div style={boxStyle}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
                Résultats par technicien
              </div>
              <div id="apt-bars" style={{ width: '100%', height: 340 }}/>
            </div>
            <div style={boxStyle}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: TXT }}>
                Distribution gaussienne et Z-scores
              </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: TXT2, fontWeight: 600 }}>Visualiser l'intervalle :</span>
          {[1, 2, 3].map(k => (
            <button key={k} onClick={() => setIntervalleS(intervalleS === k ? null : k)}
              style={{ padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
                fontWeight: 700, fontSize: 12,
                border: `1.5px solid ${intervalleS === k ? '#2a9d8f' : BORDER}`,
                background: intervalleS === k ? '#2a9d8f' : 'white',
                color: intervalleS === k ? 'white' : TXT2 }}>
              ± {k}s
            </button>
          ))}
          {intervalleS && (
            <span style={{ fontSize: 12, color: '#2a9d8f', fontWeight: 700 }}>
              ≈ {intervalleS === 1 ? '68,3' : intervalleS === 2 ? '95,4' : '99,7'} % des mesures attendues dans cet intervalle
            </span>
          )}
        </div>
              <div id="apt-gauss" style={{ width: '100%', height: 340 }}/>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div style={boxStyle}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: TXT }}>
              Détail par technicien
              {jeuMode && !verifie && (
                <span style={{ fontSize: 12, fontWeight: 500, color: TXT2, marginLeft: 10 }}>
                  — classez chaque labo, et calculez le Z-score du labo surligné
                </span>
              )}
            </div>
            <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
              <thead>
                <tr style={{ background: 'white' }}>
                  {[
                    'Technicien / Labo',
                    `${mesurande} (${unite})`,
                    jeuMode && !verifie ? 'Votre réponse' : 'Z-score',
                    jeuMode && !verifie ? '' : 'Statut',
                  ].filter(h => h !== '').map(h => (
                    <th key={h} style={{ padding: '7px 12px', borderBottom: `1.5px solid ${BORDER}`,
                      textAlign: h === 'Technicien / Labo' ? 'left' : 'right',
                      fontWeight: 700, fontSize: 12, color: TXT2 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.avecZ.map((l, i) => {
                  const st = zStatut(l.z);
                  const estLaboCalcul = jeuMode && i === laboACalculer;

                  // Mode jeu, avant vérification
                  if (jeuMode && !verifie) {
                    const reponse = reponsesStatut[i];
                    return (
                      <tr key={i} style={{ background: estLaboCalcul ? '#fef9c3'
                        : (i % 2 ? 'white' : 'transparent') }}>
                        <td style={{ padding: '7px 12px', color: TXT, fontWeight: estLaboCalcul ? 700 : 400 }}>
                          {l.nom} {estLaboCalcul && '🧮'}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: TXT,
                          fontFamily: 'monospace' }}>{l.valeur.toFixed(decimales(stats.moy))}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {['satisfaisant', 'douteux', 'non satisfaisant'].map(opt => (
                              <button key={opt}
                                onClick={() => setReponsesStatut(prev => ({ ...prev, [i]: opt }))}
                                style={{ padding: '3px 9px', borderRadius: 6, cursor: 'pointer',
                                  fontSize: 10, fontWeight: 700,
                                  border: `1.5px solid ${reponse === opt ? '#2a9d8f' : BORDER}`,
                                  background: reponse === opt ? '#2a9d8f' : 'white',
                                  color: reponse === opt ? 'white' : TXT2 }}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          {estLaboCalcul && (
                            <div style={{ marginTop: 6 }}>
                              <input type="number" step="0.01" value={zSaisi}
                                onChange={e => setZSaisi(e.target.value)}
                                placeholder="Z calculé ?"
                                style={{ ...inpStyle, width: 100, textAlign: 'right' }}/>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  // Affichage normal (pas de jeu, ou jeu vérifié)
                  const reponse = reponsesStatut[i];
                  const bonneCategorie = jeuMode ? reponse === st.label : null;
                  return (
                    <tr key={i} style={{ background: i % 2 ? 'white' : 'transparent' }}>
                      <td style={{ padding: '7px 12px', color: TXT }}>{l.nom} {estLaboCalcul && '🧮'}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: TXT,
                        fontFamily: 'monospace' }}>{l.valeur.toFixed(decimales(stats.moy))}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'monospace',
                        fontWeight: 700, color: st.color }}>
                        {l.z.toFixed(2)}
                        {estLaboCalcul && zSaisi !== '' && (
                          <span style={{ marginLeft: 6, fontSize: 12 }}>
                            {Math.abs(parseFloat(zSaisi) - l.z) < 0.15 ? '✅' : `❌ (vous : ${zSaisi})`}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                        <span style={{ background: st.bg, color: st.color, fontWeight: 700,
                          fontSize: 11, padding: '2px 10px', borderRadius: 12 }}>{st.label}</span>
                        {jeuMode && (
                          <span style={{ marginLeft: 6, fontSize: 12 }}>
                            {bonneCategorie ? '✅' : reponse ? '❌' : '⬜'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {jeuMode && !verifie && (
              <button onClick={() => setVerifie(true)}
                style={{ ...btnStyle, marginTop: 14 }}>
                ✓ Vérifier mes réponses
              </button>
            )}
            {jeuMode && verifie && (
              <button onClick={() => {
                setVerifie(false); setReponsesStatut({}); setZSaisi('');
                setLaboACalculer(Math.floor(Math.random() * stats.n));
              }}
                style={{ ...btnStyle, marginTop: 14, background: '#0ea5e9' }}>
                🔄 Rejouer avec un autre labo
              </button>
            )}

            <div style={{ fontSize: 12, color: TXT2, marginTop: 12, lineHeight: 1.7 }}>
              <strong>Lecture :</strong> Z<sub>i</sub> = (y<sub>i</sub> − ȳ) / s. Un labo est jugé
              <strong style={{ color: '#15803d' }}> satisfaisant</strong> si |Z| ≤ 2,
              <strong style={{ color: '#b45309' }}> douteux</strong> si 2 &lt; |Z| &lt; 3,
              et <strong style={{ color: '#b91c1c' }}>non satisfaisant</strong> si |Z| ≥ 3 —
              il convient alors de revoir sa manière de manipuler.
            </div>
          </div>
        </>
      )}
    </div>
  );
}


