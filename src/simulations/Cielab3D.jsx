// Vue 3D de l'espace L*a*b* (exploration de la simulation 247), sur le modèle de la sphère 3D de Hansen : on la fait tourner avec la souris ou le doigt.
// Deux échelles : « autour de la cible » (la sphère ΔE*ab et l'ellipsoïde CMC à leur vraie taille) et « espace entier » (disque de couleurs et ellipsoïdes CMC agrandis).
import { useEffect, useRef } from "react";
import { srgb, xyzDeLab } from "./couleurModele";
import * as M from "./cielabModele";

// Plan coloré (couleurs à L* fixe) : maillage polaire de centre (a0, b0) et de rayon R, une couleur par sommet.
function planCouleur(L, a0, b0, R, nr, na) {
  const x = [], y = [], z = [], col = [], I = [], J = [], K = [];
  for (let r = 0; r <= nr; r++) for (let k = 0; k < (r === 0 ? 1 : na); k++) {
    const rho = R * r / nr, th = 2 * Math.PI * k / na, a = a0 + rho * Math.cos(th), b = b0 + rho * Math.sin(th), c = srgb(xyzDeLab({ L, a, b })), t = [c.r, c.g, c.b];
    x.push(a); y.push(b); z.push(L); col.push(`rgb(${t[0]},${t[1]},${t[2]})`);
  }
  const idx = (r, k) => (r === 0 ? 0 : 1 + (r - 1) * na + (k % na));
  for (let r = 0; r < nr; r++) for (let k = 0; k < na; k++) {
    if (r === 0) { I.push(0); J.push(idx(1, k)); K.push(idx(1, k + 1)); }
    else { I.push(idx(r, k), idx(r, k + 1)); J.push(idx(r + 1, k), idx(r + 1, k)); K.push(idx(r, k + 1), idx(r + 1, k + 1)); }
  }
  return { x, y, z, col, I, J, K };
}

export function VueLab3D({ plotlyReady, cible, lot, tolE, tolC, mode = 'proche', hauteur = 440 }) {
  const ref = useRef(null);
  const cle = JSON.stringify([cible, lot, tolE, tolC, mode]);
  useEffect(() => {
    const Plotly = window.Plotly, el = ref.current;
    if (!Plotly || !el) return;
    const proche = mode === 'proche', L0 = Math.round(cible.L);
    const plan = proche ? planCouleur(L0, cible.a, cible.b, 6.5, 12, 48) : planCouleur(L0, 0, 0, 60, 20, 72);
    const data = [{ type: 'mesh3d', x: plan.x, y: plan.y, z: plan.z, i: plan.I, j: plan.J, k: plan.K, vertexcolor: plan.col, flatshading: true, lighting: { ambient: 1, diffuse: 0, specular: 0, fresnel: 0 }, hoverinfo: 'skip', name: `Couleurs à L* = ${L0}`, showlegend: false }];
    const nappe = (m, couleur, nom, opacity) => ({ type: 'surface', x: m.x, y: m.y, z: m.z, opacity, colorscale: [[0, couleur], [1, couleur]], showscale: false, hoverinfo: 'skip', name: nom, showlegend: true });
    if (proche) {
      data.push(nappe(M.maillageSphere(cible, tolE), '#a78bfa', `Sphère ΔE*ab ≤ ${tolE.toFixed(1).replace('.', ',')}`, 0.22));
      data.push(nappe(M.maillageEllipsoide(cible, tolC), '#22c55e', `Ellipsoïde CMC ≤ ${tolC.toFixed(1).replace('.', ',')}`, 0.35));
    } else {
      const k = M.AGRANDI;
      M.POSITIONS_ELLIPSES.forEach((p, n) => data.push({ ...nappe(M.maillageEllipsoide({ L: L0, a: p.a, b: p.b }, tolC, k, 24, 12), '#16a34a', `Ellipsoïdes CMC ≤ ${tolC.toFixed(1).replace('.', ',')} (×${k})`, 0.7), showlegend: n === 0 }));
      data.push({ type: 'scatter3d', mode: 'lines', x: [0, 0], y: [0, 0], z: [0, 100], line: { color: '#0f172a', width: 5 }, hoverinfo: 'skip', name: 'Axe L* (0 noir, 100 blanc)' });
    }
    const pts = (l, nom, couleur, texte) => [{ type: 'scatter3d', mode: 'markers', name: nom, x: [l.a], y: [l.b], z: [l.L], marker: { color: couleur, size: proche ? 6 : 5, line: { color: '#ffffff', width: 1 } }, hovertext: [`${nom}<br>L* ${l.L.toFixed(1)} · a* ${l.a.toFixed(1)} · b* ${l.b.toFixed(1)}`], hoverinfo: 'text' },
      { type: 'scatter3d', mode: 'text', x: [l.a], y: [l.b], z: [l.L], text: [texte], textposition: texte === 'lot' ? 'bottom center' : 'top center', textfont: { size: 12, color: couleur }, hoverinfo: 'skip', showlegend: false }];
    data.push(...pts(cible, 'Cible', '#0f172a', 'cible'), ...pts(lot, 'Lot', '#c2410c', 'lot'));
    if (proche) data.push({ type: 'scatter3d', mode: 'lines', x: [cible.a, lot.a], y: [cible.b, lot.b], z: [cible.L, lot.L], line: { color: '#c2410c', width: 4, dash: 'dash' }, hoverinfo: 'skip', name: 'Écart cible → lot', showlegend: true });
    const dm = 6.5;
    const scene = proche
      ? { aspectmode: 'cube', xaxis: { title: 'a*', range: [cible.a - dm, cible.a + dm] }, yaxis: { title: 'b*', range: [cible.b - dm, cible.b + dm] }, zaxis: { title: 'L*', range: [L0 - dm, L0 + dm] } }
      : { aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: 0.8 }, xaxis: { title: 'a*', range: [-65, 65] }, yaxis: { title: 'b*', range: [-65, 65] }, zaxis: { title: 'L*', range: [0, 100] } };
    Plotly.react(el, data, { margin: { l: 0, r: 0, b: 0, t: 0 }, paper_bgcolor: 'white', font: { size: 12, color: '#0f172a' }, showlegend: true, legend: { orientation: 'h', y: 0, font: { size: 11 } },
      scene: { ...scene, dragmode: 'orbit', camera: { eye: proche ? { x: 1.25, y: -1.25, z: 0.8 } : { x: 1.4, y: -1.6, z: 0.8 } } } }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, cle]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { const P = window.Plotly; if (P && ref.current) { try { P.purge(ref.current); } catch { /* rien */ } } }, []);
  return (
    <div>
      {!(typeof window !== 'undefined' && window.Plotly) && <div style={{ fontSize: 13.5, color: '#64748b', padding: 20, textAlign: 'center' }}>Chargement de la vue 3D…</div>}
      <div ref={ref} role="img" aria-label="Espace L*a*b* en 3D : plan de couleurs, cible, lot, sphère de tolérance ΔE*ab et ellipsoïde CMC" style={{ width: '100%', height: hauteur, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}/>
    </div>);
}
