// Scènes de la simulation 201 « Dispersion de la lumière blanche par un prisme » (2GT).
// Les tracés de rayons sont calculés par prisme2gtModele.js et mis en page par prisme2gtDispo.js ; ce fichier ne fait que les dessiner.
// Textes de 18 (viewBox de 480) à 13 (viewBox de 300) ; schémas plafonnés à maxWidth 480 (scènes) ou 320 (cartes).
import { useMemo } from "react";
import { dispo, SCENES } from "./prisme2gtDispo";
import * as M from "./prisme2gtModele";
import { COL } from "./prisme2gtCouleurs";

const FOND = { background: 'white', borderRadius: 10 };
const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', ...FOND });

// dessin d'une mise en page produite par dispo()
export function DessinDispo({ d, aria, max = 480, marges = 0 }) {
  const { W, H, ech } = d;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl(max)} role="img" aria-label={aria}>
      {d.polys.map((p, i) => <polygon key={`p${i}`} points={p.points.map(q => q.join(',')).join(' ')} fill={p.fill} stroke={p.stroke} strokeWidth={p.largeur} strokeLinejoin="round" />)}
      {d.lignes.filter(l => l.ecran).map((l, i) => <line key={`e${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.couleur} strokeWidth={l.largeur} strokeLinecap="butt" />)}
      {d.lignes.filter(l => l.tache).map((l, i) => <line key={`t${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.couleur} strokeWidth={l.largeur} strokeLinecap="butt" />)}
      {d.lignes.filter(l => !l.ecran && !l.tache).map((l, i) => <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.couleur} strokeWidth={l.largeur} strokeDasharray={l.tirets} strokeLinecap="round" />)}
      {d.arcs.map((a, i) => { const x1 = a.cx + a.r * Math.cos(a.a0), y1 = a.cy + a.r * Math.sin(a.a0), x2 = a.cx + a.r * Math.cos(a.a1), y2 = a.cy + a.r * Math.sin(a.a1);
        return <path key={`a${i}`} d={`M ${x1} ${y1} A ${a.r} ${a.r} 0 0 ${a.a1 > a.a0 ? 1 : 0} ${x2} ${y2}`} fill="none" stroke={a.couleur} strokeWidth={a.largeur} />; })}
      {d.taches.map((t, i) => <circle key={`c${i}`} cx={t.x} cy={t.y} r={t.r} fill={t.couleur} stroke="#0f172a" strokeWidth={1.2 * ech} />)}
      {d.fleches.map((f, i) => { const L = 12 * ech, h = 6.2 * ech; return (
        <polygon key={`f${i}`} transform={`translate(${f.x} ${f.y}) rotate(${f.ang * 180 / Math.PI})`} points={`${L / 2},0 ${-L / 2},${-h} ${-L / 2},${h}`} fill={f.couleur} stroke={f.bord || 'none'} strokeWidth={f.bord ? 1.5 * ech : 0} strokeLinejoin="round" />); })}
      {d.spectre && <g>
        <rect x={d.spectre.x0 - 6} y={d.spectre.y} width={d.spectre.x1 - d.spectre.x0 + 12} height={d.spectre.h} rx={3} fill="#111827" stroke="#0f172a" strokeWidth={1.5} />
        {d.spectre.raies.map((r, i) => <rect key={`r${i}`} x={r.x - 2.6} y={d.spectre.y} width={5.2} height={d.spectre.h} fill={r.couleur} />)}
        {d.spectre.reperes.map((l, i) => <line key={`n${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#64748b" strokeWidth={1.4 * ech} />)}
      </g>}
      {d.regle && <g stroke="#0f172a" strokeWidth={2 * ech}><line x1={d.regle.x1} y1={d.regle.y} x2={d.regle.x2} y2={d.regle.y} /><line x1={d.regle.x1} y1={d.regle.y - 5 * ech} x2={d.regle.x1} y2={d.regle.y + 5 * ech} /><line x1={d.regle.x2} y1={d.regle.y - 5 * ech} x2={d.regle.x2} y2={d.regle.y + 5 * ech} />
        <text x={d.regle.x2 + 8} y={d.regle.y + d.regle.taille * 0.33} fontSize={d.regle.taille} fill="#0f172a" stroke="none">{d.regle.texte}</text></g>}
      {d.legende && d.legende.map((l, i) => <g key={`g${i}`}><line x1={l.x} y1={l.y - d.fs * 0.3} x2={l.x + 20 * ech} y2={l.y - d.fs * 0.3} stroke={l.couleur} strokeWidth={4 * ech} /><text x={l.x + 26 * ech} y={l.y} fontSize={d.fs} fontWeight="700" fill="#0f172a">{l.texte}</text></g>)}
      {d.textes.map((t, i) => <text key={`x${i}`} textAnchor="middle" fontSize={t.taille} fontWeight={t.gras ? 800 : 600} fill={t.couleur} stroke="white" strokeWidth={3 * ech} paintOrder="stroke" strokeLinejoin="round">
        {(t.lignesT || [t.texte]).map((l, j) => <tspan key={j} x={t.x} y={t.y + j * t.taille * 1.05}>{l}</tspan>)}</text>)}
      {marges ? null : null}
    </svg>);
}

// scène prédéfinie du parcours (clé de SCENES) ou configuration libre
export function ScenePrisme({ cle, cfg, aria, max = 480 }) {
  const d = useMemo(() => dispo(cfg || SCENES[cle]()), [cle, cfg]);
  return <DessinDispo d={d} aria={aria} max={max} />;
}

// ---------- barre des longueurs d'onde (étapes 8 et 9, cartes) ----------
// repères : liste de [nm, texte] à marquer ; large : version de scène (480) ou de carte (300)
export function BarreSpectre({ reperes = [], large = true, max = 480, montrerIndices = false }) {
  const W = large ? 480 : 300, fs = large ? 18 : 13.5, x0 = large ? 30 : 20, x1 = W - x0, X = nm => x0 + (nm - 400) / 400 * (x1 - x0);
  const H = large ? 172 : 154, yb = large ? 62 : 56, hb = large ? 36 : 30;
  const bandes = []; for (let nm = 400; nm < 780; nm += 4) bandes.push(nm);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl(max)} role="img" aria-label="Échelle des longueurs d’onde de la lumière visible, de 400 nanomètres (violet) à 800 nanomètres (rouge)">
      <text x={W / 2} y={fs + 2} textAnchor="middle" fontSize={fs} fontWeight="800" fill={COL.encre}>longueur d’onde (nm)</text>
      {bandes.map(nm => <rect key={nm} x={X(nm)} y={yb} width={X(nm + 4) - X(nm) + 0.6} height={hb} fill={M.couleurClaire(nm)} />)}
      <rect x={x0} y={yb} width={x1 - x0} height={hb} fill="none" stroke={COL.encre} strokeWidth="1.5" />
      {[400, 500, 600, 700, 800].map(nm => <g key={nm}><line x1={X(nm)} y1={yb + hb} x2={X(nm)} y2={yb + hb + 8} stroke={COL.encre} strokeWidth="2" /><text x={X(nm)} y={yb + hb + 8 + fs} textAnchor="middle" fontSize={fs} fontWeight="700" fill={COL.encre}>{nm}</text></g>)}
      {reperes.map(([nm, t, c], i) => <g key={i}><line x1={X(nm)} y1={yb - 2} x2={X(nm)} y2={yb - 12} stroke={c || COL.encre} strokeWidth="3" /><text x={X(nm)} y={yb - 16} textAnchor="middle" fontSize={fs * 0.95} fontWeight="800" fill={c || COL.encre}>{t}</text></g>)}
      {montrerIndices && null}
    </svg>);
}

// ---------- tableau des indices du verre (parcours : rouge et violet seulement, puis d'autres couleurs) ----------
export function TableauIndices({ lignes, titre = 'Indice n du verre du cours' }) {
  return (
    <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 10, padding: '8px 10px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: COL.encre, marginBottom: 6 }}>{titre}</div>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 15 }}>
        <thead><tr>{['Couleur', 'Longueur d’onde', 'Indice n'].map(h => <th key={h} style={{ textAlign: 'left', padding: '3px 6px', borderBottom: '1px solid #cbd5e1', color: '#334155', fontSize: 13.5 }}>{h}</th>)}</tr></thead>
        <tbody>{lignes.map(l => <tr key={l.nm}>
          <td style={{ padding: '4px 6px', fontWeight: 800, color: M.couleurRayon(l.nm) }}>{l.nom || M.nomCouleur(l.nm)}</td>
          <td style={{ padding: '4px 6px' }}>{l.nm}{M.NB}nm</td>
          <td style={{ padding: '4px 6px', fontWeight: 700 }}>{M.nombreFR(M.indiceTable(l.nm), 2)}</td></tr>)}</tbody>
      </table>
    </div>);
}
