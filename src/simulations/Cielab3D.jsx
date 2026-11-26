// Vue 3D de l'espace L*a*b* (exploration de la simulation 247), sur le modèle de la sphère 3D de Hansen : on la fait tourner avec la souris ou le doigt.
// Deux échelles : « autour de la cible » (la sphère ΔE*ab et l'ellipsoïde CMC à leur vraie taille) et « espace entier » (disque de couleurs et ellipsoïdes CMC agrandis).
import { useEffect, useRef } from "react";
import { srgbAffichable } from "./couleurModele";
import * as M from "./cielabModele";
import * as C from "./couleurModele";
import * as SO from "./cielabSolide";
import * as SPH from "./cielabSphere";

// Plan coloré (couleurs à L* fixe) : maillage polaire de centre (a0, b0) et de rayon R, une couleur par sommet.
function planCouleur(L, a0, b0, R, nr, na, zPlan = L) {
  const x = [], y = [], z = [], col = [], I = [], J = [], K = [];
  for (let r = 0; r <= nr; r++) for (let k = 0; k < (r === 0 ? 1 : na); k++) {
    const rho = R * r / nr, th = 2 * Math.PI * k / na, a = a0 + rho * Math.cos(th), b = b0 + rho * Math.sin(th), c = srgbAffichable({ L, a, b }), t = [c.r, c.g, c.b];
    x.push(a); y.push(b); z.push(zPlan); col.push(`rgb(${t[0]},${t[1]},${t[2]})`);
  }
  const idx = (r, k) => (r === 0 ? 0 : 1 + (r - 1) * na + (k % na));
  for (let r = 0; r < nr; r++) for (let k = 0; k < na; k++) {
    if (r === 0) { I.push(0); J.push(idx(1, k)); K.push(idx(1, k + 1)); }
    else { I.push(idx(r, k), idx(r, k + 1)); J.push(idx(r + 1, k), idx(r + 1, k)); K.push(idx(r, k + 1), idx(r + 1, k + 1)); }
  }
  return { x, y, z, col, I, J, K };
}

export function VueLab3D({ plotlyReady, cible, lot, tolE, tolC, mode = 'entier', hauteur = 440 }) {
  const ref = useRef(null);
  const cle = JSON.stringify([cible, lot, tolE, tolC, mode]);
  useEffect(() => {
    const Plotly = window.Plotly, el = ref.current;
    if (!Plotly || !el) return;
    const proche = mode === 'proche', L0 = Math.round(cible.L);
    if (!proche) { // espace entier : la sphère des couleurs (représentation schématique, comme la sphère de Hansen), coupée par le plan a*b* à la luminosité de la cible
      const R = SPH.R, k = M.AGRANDI, rD = SPH.rayonDisque(L0);
      const sph = SPH.maillage(24, 48);
      const plat = { ambient: 1, diffuse: 0, specular: 0, fresnel: 0 };
      const ligne = (c, couleur, largeur, tirets) => ({ type: 'scatter3d', mode: 'lines', x: c.x, y: c.y, z: c.z, line: { color: couleur, width: largeur, ...(tirets ? { dash: tirets } : {}) }, hoverinfo: 'skip', showlegend: false });
      const disque = planCouleur(L0, 0, 0, rD, 16, 72);
      const pos = SO.positionsEllipses(L0).filter(p => Math.hypot(p.a, p.b) <= rD - 6);
      const ellipses = SO.contoursEllipses(pos, L0, tolC, k, L0 + 0.4), ellCible = SO.contoursEllipses([{ a: cible.a, b: cible.b }], cible.L, tolC, k, L0 + 0.7);
      const cercle = (rr, z, n = 72) => { const x = [], y = [], zz = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; x.push(rr * Math.cos(t)); y.push(rr * Math.sin(t)); zz.push(z); } return { x, y, z: zz }; };
      const meridien = th => { const x = [], y = [], z = []; for (let i = 0; i <= 48; i++) { const f = Math.PI * i / 48; x.push(R * Math.sin(f) * Math.cos(th)); y.push(R * Math.sin(f) * Math.sin(th)); z.push(50 + 50 * Math.cos(f)); } return { x, y, z }; };
      const tx = (x, y, z, t) => ({ x, y, z, text: t });
      const m = rD + 16;
      const etiq = [tx(m, 0, L0, '+a*<br>rouge'), tx(-m, 0, L0, '−a*<br>vert'), tx(0, m, L0, '+b*<br>jaune'), tx(0, -m, L0, '−b*<br>bleu'), tx(0, 0, 112, 'Blanc (L* = 100)'), tx(14, -34, -4, 'Noir (L* = 0)')];
      const dat = [
        { type: 'mesh3d', x: sph.x, y: sph.y, z: sph.z, i: sph.I, j: sph.J, k: sph.K, vertexcolor: sph.col, opacity: 0.28, flatshading: false, lighting: plat, hoverinfo: 'skip', showlegend: false },
        ligne(cercle(R, 50), '#64748b', 1.5), ligne(cercle(R * Math.sqrt(0.75), 75), '#94a3b8', 1), ligne(cercle(R * Math.sqrt(0.75), 25), '#94a3b8', 1),
        ...[0, 45, 90, 135].map(d => ligne(meridien(d * Math.PI / 180), '#94a3b8', 1)), ...[180, 225, 270, 315].map(d => ligne(meridien(d * Math.PI / 180), '#94a3b8', 1)),
        { type: 'mesh3d', x: disque.x, y: disque.y, z: disque.z, i: disque.I, j: disque.J, k: disque.K, vertexcolor: disque.col, flatshading: true, lighting: plat, hoverinfo: 'skip', showlegend: false },
        ligne(cercle(rD, L0 + 0.3), '#0f172a', 2.5),
        ligne(ellipses, '#0f172a', 1.5), ligne(ellCible, '#15803d', 6),
        ligne({ x: [-rD, rD], y: [0, 0], z: [L0 + 0.5, L0 + 0.5] }, '#0f172a', 2), ligne({ x: [0, 0], y: [-rD, rD], z: [L0 + 0.5, L0 + 0.5] }, '#0f172a', 2),
        ligne({ x: [0, 0], y: [0, 0], z: [0, 100] }, '#0f172a', 4),
        { type: 'scatter3d', mode: 'text', x: etiq.map(e => e.x), y: etiq.map(e => e.y), z: etiq.map(e => e.z), text: etiq.map(e => e.text), textfont: { size: 12, color: '#0f172a' }, hoverinfo: 'skip', showlegend: false },
        { type: 'scatter3d', mode: 'markers', x: [0, 0], y: [0, 0], z: [100, 0], marker: { color: ['#ffffff', '#000000'], size: 7, line: { color: '#0f172a', width: 1 } }, hoverinfo: 'skip', showlegend: false },
        { type: 'scatter3d', mode: 'markers', x: [cible.a], y: [cible.b], z: [L0 + 1], marker: { color: '#0f172a', size: 5, line: { color: '#fff', width: 1 } }, hovertext: [`Cible<br>L* ${cible.L.toFixed(1)} · a* ${cible.a.toFixed(1)} · b* ${cible.b.toFixed(1)}`], hoverinfo: 'text', showlegend: false },
        { type: 'scatter3d', mode: 'markers', x: [lot.a], y: [lot.b], z: [lot.L], marker: { color: '#c2410c', size: 5, line: { color: '#fff', width: 1 } }, hovertext: [`Lot<br>L* ${lot.L.toFixed(1)} · a* ${lot.a.toFixed(1)} · b* ${lot.b.toFixed(1)}`], hoverinfo: 'text', showlegend: false }];
      const nu = { showticklabels: false, showgrid: false, zeroline: false, showbackground: false, showline: false, showspikes: false, title: '' };
      // échelle verticale resserrée : 50 unités de L* (rayon vertical) occupent la même longueur que R unités de a* ou b*, pour que la sphère paraisse ronde
      const W = R + 24, Z0 = -20, Z1 = 116;
      Plotly.react(el, dat, { margin: { l: 0, r: 0, b: 0, t: 0 }, paper_bgcolor: 'white', showlegend: false, font: { size: 12, color: '#0f172a' },
        scene: { aspectmode: 'manual', aspectratio: { x: 1, y: 1, z: ((Z1 - Z0) / 50) / (2 * W / R) }, xaxis: { ...nu, range: [-W, W] }, yaxis: { ...nu, range: [-W, W] }, zaxis: { ...nu, range: [Z0, Z1] }, dragmode: 'orbit',
          camera: { eye: { x: 0.85, y: -1.3, z: 0.68 }, center: { x: 0, y: 0, z: -0.02 } } } }, { displayModeBar: false, responsive: true });
      return;
    }
    // échelle de la vue proche : assez large pour voir toute la sphère, l'ellipsoïde et le lot (jamais plus large que nécessaire, pour que la sphère se voie)
    const ax = C.ellipseCMC(cible, tolC), grand = Math.max(tolE, ax.rC, ax.rH, ax.rL), ecartMax = Math.max(Math.abs(lot.a - cible.a), Math.abs(lot.b - cible.b), Math.abs(lot.L - cible.L));
    const dm = Math.max(1.5 * grand, 1.25 * ecartMax, 2.5), zSol = L0 - dm;
    const plan = proche ? planCouleur(L0, cible.a, cible.b, dm, 10, 48, zSol) : planCouleur(L0, 0, 0, 60, 20, 72);
    const data = [{ type: 'mesh3d', x: plan.x, y: plan.y, z: plan.z, i: plan.I, j: plan.J, k: plan.K, vertexcolor: plan.col, flatshading: true, lighting: { ambient: 1, diffuse: 0, specular: 0, fresnel: 0 }, hoverinfo: 'skip', name: `Couleurs à L* = ${L0}`, showlegend: false }];
    const nappe = (m, couleur, nom, opacity, filets) => ({ type: 'surface', x: m.x, y: m.y, z: m.z, opacity, colorscale: [[0, couleur], [1, couleur]], showscale: false, hoverinfo: 'skip', name: nom, showlegend: true,
      ...(filets ? { contours: { z: { show: true, usecolormap: false, color: filets, width: 2, start: m.z[m.z.length - 1][0], end: m.z[0][0], size: (m.z[0][0] - m.z[m.z.length - 1][0]) / 6 } } } : {}) });
    const trait = (x, y, z, couleur, nom, dash) => ({ type: 'scatter3d', mode: 'lines', x, y, z, line: { color: couleur, width: 4, dash }, hoverinfo: 'skip', name: nom, showlegend: false });
    if (proche) {
      data.push(nappe(M.maillageSphere(cible, tolE), '#a78bfa', `Sphère ΔE*ab ≤ ${tolE.toFixed(1).replace('.', ',')}`, 0.3, '#6d28d9'));
      data.push(nappe(M.maillageEllipsoide(cible, tolC), '#22c55e', `Ellipsoïde CMC ≤ ${tolC.toFixed(1).replace('.', ',')}`, 0.45, '#15803d'));
      // « ombres » sur le plan coloré : le cercle et l'ellipse du plan 2D
      const eq = M.maillageSphere(cible, tolE, 60, 3), ee = M.maillageEllipsoide(cible, tolC, 1, 60, 3);
      data.push(trait(eq.x[1], eq.y[1], eq.x[1].map(() => zSol + 0.04 * dm), '#6d28d9', 'Ombre de la sphère'), trait(ee.x[1], ee.y[1], ee.x[1].map(() => zSol + 0.04 * dm), '#15803d', 'Ombre de l’ellipsoïde'));
      data.push(trait([cible.a, cible.a], [cible.b, cible.b], [cible.L, zSol], '#64748b', '', 'dot'), trait([lot.a, lot.a], [lot.b, lot.b], [lot.L, zSol], '#c2410c', '', 'dot'));
    }
    const pts = (l, nom, couleur, texte) => [{ type: 'scatter3d', mode: 'markers', name: nom, x: [l.a], y: [l.b], z: [l.L], marker: { color: couleur, size: proche ? 6 : 5, line: { color: '#ffffff', width: 1 } }, hovertext: [`${nom}<br>L* ${l.L.toFixed(1)} · a* ${l.a.toFixed(1)} · b* ${l.b.toFixed(1)}`], hoverinfo: 'text' },
      { type: 'scatter3d', mode: 'text', x: [l.a], y: [l.b], z: [l.L], text: [texte], textposition: texte === 'lot' ? 'bottom center' : 'top center', textfont: { size: 12, color: couleur }, hoverinfo: 'skip', showlegend: false }];
    data.push(...pts(cible, 'Cible', '#0f172a', 'cible'), ...pts(lot, 'Lot', '#c2410c', 'lot'));
    if (proche) data.push({ type: 'scatter3d', mode: 'lines', x: [cible.a, lot.a], y: [cible.b, lot.b], z: [cible.L, lot.L], line: { color: '#c2410c', width: 4, dash: 'dash' }, hoverinfo: 'skip', name: 'Écart cible → lot', showlegend: true });
    const scene = proche
      ? { aspectmode: 'data', xaxis: { title: 'a*', range: [cible.a - dm, cible.a + dm], nticks: 4, tickfont: { size: 10 } }, yaxis: { title: 'b*', range: [cible.b - dm, cible.b + dm], nticks: 4, tickfont: { size: 10 } }, zaxis: { title: 'L*', range: [zSol - 0.15 * dm, L0 + dm], nticks: 4, tickfont: { size: 10 } } }
        : {};
    Plotly.react(el, data, { margin: { l: 0, r: 0, b: 0, t: 0 }, paper_bgcolor: 'white', font: { size: 12, color: '#0f172a' }, showlegend: true, legend: { orientation: 'h', y: 0, font: { size: 11 } },
      scene: { ...scene, dragmode: 'orbit', camera: { eye: { x: 1.3, y: -1.45, z: 0.9 } } } }, { displayModeBar: false, responsive: true });
  }, [plotlyReady, cle]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { const P = window.Plotly; if (P && ref.current) { try { P.purge(ref.current); } catch { /* rien */ } } }, []);
  return (
    <div>
      {!(typeof window !== 'undefined' && window.Plotly) && <div style={{ fontSize: 13.5, color: '#64748b', padding: 20, textAlign: 'center' }}>Chargement de la vue 3D…</div>}
      <div ref={ref} role="img" aria-label="Espace L*a*b* en 3D : solide des couleurs de l’écran, cible, lot, tolérances CMC" style={{ width: '100%', height: hauteur, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}/>
    </div>);
}
