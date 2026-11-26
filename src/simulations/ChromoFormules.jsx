// Formules topologiques des molécules de la simulation 303 (exploration libre). SVG, sans rien coder par la couleur :
// un sommet = un atome de carbone, les H portés par les C ne sont pas dessinés, ceux des hétéroatomes (OH, NH₂, NH₃⁺) le sont.
// Les cycles sont dessinés en formule de Kékulé (3 C=C alternées), ce qui montre la conjugaison.
import { K } from "./schemaOutils";

const R = 26, B = 26, RAD = Math.PI / 180;
const FIL = { stroke: '#0f172a', strokeWidth: 2.2, strokeLinecap: 'round' };
const H_VUE = 150;                      // hauteur commune des vues : la mise en page ne saute pas quand on change de molécule

function creer() {
  const els = []; let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const pt = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  const trait = (a, b, c, d) => { pt(a, b); pt(c, d); els.push(<line key={n++} x1={a} y1={b} x2={c} y2={d} {...FIL}/>); };
  const dir = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; };
  // liaison simple de p à q, raccourcie de ra au départ et de rb à l'arrivée (place des symboles d'atomes)
  const lien = (p, q, ra = 0, rb = 0) => { const [ux, uy] = dir(p, q); trait(p[0] + ux * ra, p[1] + uy * ra, q[0] - ux * rb, q[1] - uy * rb); };
  const lienDouble = (p, q, ra = 0, rb = 0, s = 2.4) => { const [ux, uy] = dir(p, q), px = -uy * s, py = ux * s;
    for (const k of [-1, 1]) trait(p[0] + ux * ra + k * px, p[1] + uy * ra + k * py, q[0] - ux * rb + k * px, q[1] - uy * rb + k * py); };
  // cycle à 6 sommets : le sommet k est à l'angle a0 + 60 k ; les arêtes de parité `dbl` portent les C=C (formule de Kékulé)
  const cycle = (cx, cy, a0, dbl) => {
    const v = k => [cx + R * Math.cos((a0 + 60 * k) * RAD), cy + R * Math.sin((a0 + 60 * k) * RAD)];
    for (let k = 0; k < 6; k++) {
      const p = v(k), q = v((k + 1) % 6); trait(p[0], p[1], q[0], q[1]);
      if (k % 2 === dbl) { const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, [nx, ny] = dir([mx, my], [cx, cy]), e = [q[0] - p[0], q[1] - p[1]];
        trait(p[0] + e[0] * 0.14 + nx * 4.8, p[1] + e[1] * 0.14 + ny * 4.8, q[0] - e[0] * 0.14 + nx * 4.8, q[1] - e[1] * 0.14 + ny * 4.8); }
    }
    return v;
  };
  // symbole d'atome centré en (x, y) ; h = hydrogènes écrits à sa droite
  const atome = (x, y, sym, h = '') => {
    pt(x - 8, y - 9); pt(x + 6 + (h ? 8 + 9 * h.length : 0), y + 9);
    els.push(<text key={n++} x={x} y={y} fontSize="15" fontWeight="700" textAnchor="middle" dominantBaseline="central" fill={K.txt}>{sym}</text>);
    if (h) els.push(<text key={n++} x={x + 6} y={y} fontSize="15" fontWeight="700" textAnchor="start" dominantBaseline="central" fill={K.txt}>{h}</text>);
  };
  // charge portée par un atome : signe entouré d'un cercle (lisible sans couleur)
  const charge = (x, y, s) => { pt(x - 6, y - 6); pt(x + 6, y + 6);
    els.push(<g key={n++}><circle cx={x} cy={y} r="5.5" fill="#fff" stroke={K.txt} strokeWidth="1.3"/><line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke={K.txt} strokeWidth="1.4"/>{s === '+' && <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke={K.txt} strokeWidth="1.4"/>}</g>); };
  return { els, trait, lien, lienDouble, cycle, atome, charge, boite: () => [x0, y0, x1, y1] };
}

// substituant porté par le sommet du haut (0) ou du bas (3) d'un cycle centré en (0, 0)
const HAUT = [0, -R - 28], BAS = [0, R + 28];
const OH = (b, v, anion = false) => { b.lien(v(0), HAUT, 0, 8); b.atome(HAUT[0], HAUT[1], 'O', anion ? '' : 'H'); if (anion) b.charge(HAUT[0] + 13, HAUT[1] - 9, '−'); };
const NITRO = (b, v) => {
  const N = BAS, O1 = [N[0] - 26, N[1] + 15], O2 = [N[0] + 26, N[1] + 15];
  b.lien(v(3), N, 0, 9); b.lienDouble(N, O1, 9, 9); b.lien(N, O2, 9, 9);
  b.atome(N[0], N[1], 'N'); b.charge(N[0] + 13, N[1] - 9, '+'); b.atome(O1[0], O1[1], 'O'); b.atome(O2[0], O2[1], 'O'); b.charge(O2[0] + 13, O2[1] - 9, '−');
};
const AMINE = (b, v, h, plus) => { b.lien(v(0), HAUT, 0, 8); b.atome(HAUT[0], HAUT[1], 'N', h); if (plus) b.charge(HAUT[0] + 6 + 9 * h.length + 6, HAUT[1] - 9, '+'); };

const DESSINS = {
  benzene: { aria: 'cycle benzénique seul', f: b => { b.cycle(0, 0, -90, 1); } },
  phenol: { aria: 'cycle benzénique portant un groupe hydroxyle OH', f: b => { OH(b, b.cycle(0, 0, -90, 1)); } },
  phenolate: { aria: 'cycle benzénique portant un atome d’oxygène chargé négativement O moins', f: b => { OH(b, b.cycle(0, 0, -90, 1), true); } },
  aniline: { aria: 'cycle benzénique portant un groupe amino NH2', f: b => { AMINE(b, b.cycle(0, 0, -90, 1), 'H₂', false); } },
  anilinium: { aria: 'cycle benzénique portant un groupe ammonium NH3 plus', f: b => { AMINE(b, b.cycle(0, 0, -90, 1), 'H₃', true); } },
  nitrophenol: { aria: 'cycle benzénique portant en position para un groupe hydroxyle OH et un groupe nitro NO2', f: b => { const v = b.cycle(0, 0, -90, 1); OH(b, v); NITRO(b, v); } },
  nitrophenolate: { aria: 'cycle benzénique portant en position para un atome d’oxygène chargé négativement et un groupe nitro NO2', f: b => { const v = b.cycle(0, 0, -90, 1); OH(b, v, true); NITRO(b, v); } },
  transstil: { aria: 'deux cycles benzéniques reliés par une double liaison C=C, de part et d’autre de la double liaison (isomère trans)', f: b => {
    const R1 = [0, 0], Ca = [B, 0], Cb = [1.5 * B, 0.866 * B], R2 = [2.5 * B, 0.866 * B];
    b.cycle(-R, 0, 0, 0); b.lien(R1, Ca); b.lienDouble(Ca, Cb); b.lien(Cb, R2); b.cycle(R2[0] + R, R2[1], 0, 0); } },
  cisstil: { aria: 'deux cycles benzéniques reliés par une double liaison C=C, du même côté de la double liaison (isomère cis)', f: b => {
    const R1 = [0, 0], Ca = [B, 0], Cb = [1.5 * B, 0.866 * B], R2 = [B, 1.732 * B];
    b.cycle(-R, 0, 0, 0); b.lien(R1, Ca); b.lienDouble(Ca, Cb); b.lien(Cb, R2); b.cycle(R2[0] - 0.5 * R, R2[1] + 0.866 * R, 0, 0); } },
};

function Vue({ b, aria, largeurVue = null, hauteur = H_VUE }) {
  const [x0, y0, x1, y1] = b.boite(), W = largeurVue ?? x1 - x0 + 16, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return (<svg role="img" aria-label={aria} viewBox={`${cx - W / 2} ${cy - hauteur / 2} ${W} ${hauteur}`} style={{ display: 'block', width: '100%', height: 'auto', margin: '0 auto' }}>{b.els}</svg>);
}
const legende = { textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: '#334155', lineHeight: 1.3 };
const note = { fontSize: 12.5, color: '#475569', textAlign: 'center', lineHeight: 1.4, margin: '4px 0 0' };

// Une ou deux molécules côte à côte (la première est la référence, tracée en tirets sur le spectre)
export function FormulesMolecules({ ids, noms, reference = null }) {
  const vues = ids.map(id => { const b = creer(); DESSINS[id].f(b); const [x0, , x1] = b.boite(); return { id, b, W: x1 - x0 + 16 }; });
  return (<div style={{ margin: '4px 0 10px' }}>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'flex-start' }}>
      {vues.map(({ id, b, W }, i) => (<figure key={`${i}-${id}`} style={{ margin: 0, flex: `${Math.max(W, 130)} 1 0`, minWidth: 0, maxWidth: Math.max(W * 1.1, 150) }}>
        <div style={{ width: '100%', maxWidth: W * 1.1, margin: '0 auto' }}><Vue b={b} aria={`Formule topologique : ${noms[id]}, ${DESSINS[id].aria}`} largeurVue={W}/></div>
        <figcaption style={legende}>{noms[id]}{reference === id ? ' (référence, tirets)' : ''}</figcaption>
      </figure>))}
    </div>
    <p style={note}>Formule topologique : chaque sommet du cycle est un atome de carbone ; les H liés aux C ne sont pas dessinés.</p>
  </div>);
}

// Chaîne carbonée d'un polyène à n liaisons C=C conjuguées (2n atomes de carbone en zigzag)
export function FormulePolyene({ n, nom, note: complement = '' }) {
  const N = 2 * n, dx = Math.min(26, 290 / (N - 1)), dy = dx * 0.58, b = creer();
  const p = i => [i * dx, (i % 2) * dy];
  for (let i = 0; i < N - 1; i++) (i % 2 === 0 ? b.lienDouble : b.lien)(p(i), p(i + 1));
  return (<div style={{ margin: '4px 0 10px' }}>
    <div style={{ maxWidth: 360, margin: '0 auto' }}><Vue b={b} aria={`Formule topologique : ${nom}, chaîne de ${N} atomes de carbone avec ${n} double${n > 1 ? 's' : ''} liaison${n > 1 ? 's' : ''} C=C conjuguée${n > 1 ? 's' : ''}`} largeurVue={320} hauteur={64}/></div>
    <div style={legende}>{nom} · {n} C=C conjuguée{n > 1 ? 's' : ''}</div>
    <p style={note}>Formule topologique : chaque sommet est un atome de carbone ; les H ne sont pas dessinés.{complement}</p>
  </div>);
}
