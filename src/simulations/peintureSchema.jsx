/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react";
import { KIT } from "../commun";

// ════════════════ COUPE SCHÉMATIQUE DU FILM SEC, SELON λ = CPV / CPVC ════════════════
//  λ < 1  (CPV < CPVC) : les grains sont noyés dans un liant en excès ; film non poreux, surface lisse (brillant → satiné).
//  λ ≈ 1  (CPV = CPVC) : les grains se touchent, il y a juste assez de liant pour remplir les interstices ; film mat, non poreux.
//  λ > 1  (CPV > CPVC) : pas assez de liant : des cavités d'air (porosité) apparaissent entre les grains ; film mat, poreux, peu cohésif.
//  Dessin schématique : tailles, nombres et positions des grains sont indicatifs ; seule la tendance est exacte.
//  Couleurs : grains rouges, liant bleu, vide d'air blanc cerclé de pointillés (le vide se reconnaît aussi à sa forme et à l'étiquette « porosité »).

function rng(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function regimeFilm(lambda) {
  if (lambda < 0.95) return { cle: 'inf', signe: '<', texte: 'CPV < CPVC', detail: lambda < 0.5 ? 'film brillant, non poreux' : 'film satiné, non poreux' };
  if (lambda <= 1.05) return { cle: 'egal', signe: '=', texte: 'CPV = CPVC', detail: 'film mat, non poreux' };
  return { cle: 'sup', signe: '>', texte: 'CPV > CPVC', detail: 'film mat, poreux, peu cohésif' };
}

function construire(lambda) {
  const W = 420, H = 210, xg = 20, xd = 400, yBase = 160, ep = 100;               // support : y > yBase ; film : de yBase − ep à yBase
  const r = rng(11);
  const l = Math.max(0.1, Math.min(1.8, isFinite(lambda) ? lambda : 1));
  const phi = 0.6 * Math.pow(Math.min(l, 1), 0.9);                                    // fraction de surface occupée par les grains
  const surf = (xd - xg) * ep, cible = phi * surf;
  const parts = []; let aire = 0, essais = 0;
  const tailles = [6, 8, 10, 13];
  const hautMax = l < 0.95 ? ep - 14 : ep - 4;                                        // au-dessus : liant seul (grains noyés si λ < 1)
  while (aire < cible && essais < 9000) {
    essais++;
    const R = tailles[Math.floor(r() * tailles.length)];
    const x = xg + R + r() * (xd - xg - 2 * R), y = yBase - R - r() * Math.max(1, hautMax - 2 * R);
    if (y - R < yBase - ep) continue;
    let ok = true;
    for (const p of parts) { const d = Math.hypot(p.x - x, p.y - y); if (d < p.R + R + (l < 1 ? 1.5 + (1 - l) * 5 : 0.3)) { ok = false; break; } }
    if (!ok) continue;
    parts.push({ x, y, R }); aire += Math.PI * R * R;
  }
  // Surface du film : lisse si λ faible, de plus en plus irrégulière quand les grains affleurent
  const amp = l < 0.5 ? 0.5 : l < 0.95 ? 2 + (l - 0.5) * 6 : 4 + (l - 0.95) * 6;
  const pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([xg + t * (xd - xg), yBase - ep + 6 + Math.sin(t * 17 + 0.5) * amp * 0.5 + Math.sin(t * 41 + 1.7) * amp * 0.5 + (l > 1 ? (l - 1) * 14 : 0)]); }
  // Cavités d'air entre les grains (λ > 1)
  const vides = [];
  if (l > 1.05) {
    const nbV = Math.round(Math.min(1, (l - 1) / 0.5) * 14);
    for (let k = 0, tent = 0; k < nbV && tent < 4000; tent++) {
      const R = 4 + r() * 4, x = xg + 10 + r() * (xd - xg - 20), y = yBase - 8 - r() * (ep - 22);
      if (parts.some(p => Math.hypot(p.x - x, p.y - y) < p.R + R * 0.4)) continue;
      if (vides.some(v => Math.hypot(v.x - x, v.y - y) < v.R + R + 2)) continue;
      vides.push({ x, y, R, e: 0.7 + r() * 0.8, a: r() * 180 }); k++;
    }
  }
  return { W, H, xg, xd, yBase, ep, parts, pts, vides, l };
}

// compact : version miniature (sans légende) pour comparer les trois cas
export function SchemaFilmSec({ lambda, compact = false, surligne = false }) {
  const g = useMemo(() => construire(lambda), [lambda]);
  const rg = regimeFilm(g.l);
  const chemin = `M${g.xg},${g.yBase} L${g.xg},${g.pts[0][1].toFixed(1)} ${g.pts.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} L${g.xd},${g.yBase} Z`;
  const poreux = rg.cle === 'sup' && g.vides.length > 0;
  return (
    <figure style={{ margin: 0, width: compact ? 'min(100%, 200px)' : 'min(100%, 460px)', outline: surligne ? `3px solid ${KIT.txt2}` : 'none', outlineOffset: 2, borderRadius: 6 }}>
      <svg viewBox={`0 0 ${g.W} ${g.H}`} role="img" aria-label={`Coupe schématique du film sec : ${rg.texte}, ${rg.detail}`} style={{ width: '100%', display: 'block', background: 'white', border: '1px solid #cbd5e1', borderRadius: 6 }}>
        <rect x={g.xg - 8} y={g.yBase} width={g.xd - g.xg + 16} height="34" rx="6" fill="#6b8e3a" stroke="#1f2937" strokeWidth="2"/>
        <path d={chemin} fill="#4aa3d8" stroke="#2b6ea3" strokeWidth="1.2"/>
        {g.vides.map((v, i) => <ellipse key={'v' + i} cx={v.x} cy={v.y} rx={v.R * v.e + 2} ry={v.R} transform={`rotate(${v.a.toFixed(0)} ${v.x.toFixed(1)} ${v.y.toFixed(1)})`} fill="white" stroke="#334155" strokeWidth="1" strokeDasharray="3 2"/>)}
        {g.parts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.R} fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.2"/>)}
        {poreux && !compact && <g><path d={`M${(g.vides[0].x + 8).toFixed(0)},${(g.vides[0].y - 4).toFixed(0)} L${g.xd - 70},${g.yBase - g.ep - 12}`} stroke="#334155" fill="none" strokeWidth="1"/>
          <text x={g.xd - 68} y={g.yBase - g.ep - 14} fontSize="13" fontWeight="700" fill="#334155">Porosité</text></g>}
        <text x={g.W / 2} y={g.yBase + 22} fontSize={compact ? 15 : 16} textAnchor="middle" fontWeight="700" fill="#ffffff" stroke="#1f2937" strokeWidth="0.6" paintOrder="stroke">{rg.texte}</text>
      </svg>
      {!compact && <figcaption style={{ fontSize: 13, color: KIT.txt, marginTop: 4, lineHeight: 1.5 }}>
        <b>{rg.texte}</b> : {rg.detail}.
        <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4, fontSize: 12, color: KIT.txt2 }}>
          <span><span style={{ display: 'inline-block', width: 11, height: 11, borderRadius: '50%', background: '#dc2626', border: '1px solid #7f1d1d', verticalAlign: -1 }}/> pigments et charges</span>
          <span><span style={{ display: 'inline-block', width: 14, height: 9, background: '#4aa3d8', border: '1px solid #2b6ea3', verticalAlign: -1 }}/> liant</span>
          <span><span style={{ display: 'inline-block', width: 12, height: 9, background: 'white', border: '1px dashed #334155', borderRadius: '50%', verticalAlign: -1 }}/> vide d’air (porosité)</span>
        </span>
      </figcaption>}
    </figure>);
}

// Le film du formulateur et les trois situations de référence, côte à côte
export function SchemasFilmSec({ lambda }) {
  const rg = regimeFilm(lambda);
  return (
    <div data-schema-film style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: KIT.txt, marginBottom: 4 }}>Coupe schématique de votre film sec (λ = CPV / CPVC = {Number(lambda).toLocaleString('fr-FR', { maximumFractionDigits: 2 })})</div>
      <SchemaFilmSec lambda={lambda}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '8px 0 4px' }}>Les trois situations à comparer :</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <SchemaFilmSec lambda={0.5} compact surligne={rg.cle === 'inf'}/>
        <SchemaFilmSec lambda={1} compact surligne={rg.cle === 'egal'}/>
        <SchemaFilmSec lambda={1.4} compact surligne={rg.cle === 'sup'}/>
      </div>
      <div style={{ fontSize: 11.5, color: KIT.txt2, fontStyle: 'italic', marginTop: 4 }}>Schémas : les tailles, les nombres et les positions des grains sont indicatifs.</div>
    </div>);
}
