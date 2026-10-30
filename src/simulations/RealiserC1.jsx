import { useRef } from "react";
import { KIT, stylePetitBouton } from "../commun";

// ====================================================
//  Exercices « Réaliser » du chapitre « Transmission de signaux numériques » (capteur, conditionneur, CAN) :
//    • R1 — tracer une courbe à partir d'un tableau de valeurs (composant TraceCourbe)
//    • R2 — application numérique : pont diviseur de tension
//    • R3 — temps de réponse à 5 % d'un capteur (échelon montant ou descendant)
//  Mêmes conventions que le reste de l'atelier : { intro, figure?, questions: [...], retenir }.
// ====================================================

const NB = ' ';                                      // espace insécable
const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const alea = (min, max, cs = 3) => Number((min + Math.random() * (max - min)).toPrecision(cs));
// Nombre à la française, avec cs chiffres significatifs (zéros finals conservés : 1,50 reste 1,50)
function nb(x, cs = 3) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(cs)), e = Math.floor(Math.log10(Math.abs(r)));
  const d = Math.max(0, cs - 1 - e);
  return r.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: Math.abs(r) >= 10000 }).replace(/ | /g, NB);
}
// Nombre « lisible » sur un axe (valeur de graduation)
const grad = v => Number(v.toPrecision(6)).toLocaleString('fr-FR', { maximumFractionDigits: 6, useGrouping: false });

// ──────────────────────── R1 : tracer une courbe ────────────────────────
// Pas « raisonnables » (1, 2, 5 × 10^k) pour une graduation d'axe : 10 graduations par axe, on part de 0.
const PAS = (() => { const l = []; for (let k = -4; k <= 6; k++) [1, 2, 5].forEach(m => l.push(m * Math.pow(10, k))); return l; })();
const rond = x => Number(x.toPrecision(6));
// Échelle qui convient : la plus grande valeur occupe au moins la moitié de l'axe sans en sortir (10 graduations)
const bonPas = max => PAS.filter(p => rond(10 * p) >= rond(max) && rond(10 * p) <= rond(2 * max));
function optionsPas(max) {
  const bons = bonPas(max), trop = PAS.filter(p => rond(10 * p) < rond(max)), grands = PAS.filter(p => rond(10 * p) > rond(2 * max));
  const o = [...bons, trop[trop.length - 1], grands[0], grands[1]].filter(x => x !== undefined);
  return [...new Set(o)].sort((a, b) => a - b);
}

// Vérification d'une réponse de type « trace » : { ok, msg }
export function verifierTrace(q, val) {
  if (!val || val.sx == null || val.sy == null) return { ok: false, msg: 'Choisis d’abord l’échelle de chaque axe (la valeur d’une graduation).' };
  const maxX = Math.max(...q.xs), maxY = Math.max(...q.ys);
  for (const [axe, s, mx] of [['des abscisses', val.sx, maxX], ['des ordonnées', val.sy, maxY]]) {
    if (rond(10 * s) < rond(mx)) return { ok: false, msg: `Échelle de l’axe ${axe} trop petite : la plus grande valeur (${grad(mx)}) sort de la grille (10 graduations × ${grad(s)} = ${grad(10 * s)}).` };
    if (rond(10 * s) > rond(2 * mx)) return { ok: false, msg: `Échelle de l’axe ${axe} trop grande : la courbe n’occupe qu’une petite partie du graphique, on perd en précision. Choisis une graduation plus petite pour exploiter la grille.` };
  }
  const n = q.xs.length, pts = val.pts || [];
  if (pts.length < n) return { ok: false, msg: `Il reste ${n - pts.length} point${n - pts.length > 1 ? 's' : ''} à placer.` };
  const mal = [];
  q.xs.forEach((x, i) => { const [px, py] = pts[i]; if (Math.abs(px - x) > 0.4 * val.sx || Math.abs(py - q.ys[i]) > 0.4 * val.sy) mal.push(i + 1); });
  if (mal.length) return { ok: false, msg: `${mal.length === 1 ? 'Le point n°' + mal[0] + ' est mal placé' : 'Les points n°' + mal.join(', ') + ' sont mal placés'} (marqués en rouge). Pour chaque point, cherche la valeur de ${q.xnom} sur l’axe horizontal, puis celle de ${q.ynom} sur l’axe vertical.`, mal };
  return { ok: true, msg: '' };
}

// Courbe lisse (Catmull-Rom) passant par des points en pixels
function cheminLisse(P) {
  if (P.length < 2) return '';
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// Composant : choix des échelles, puis placement des points sur la grille (au doigt ou à la souris)
export function TraceCourbe({ q, val, onChange, resultat, solution }) {
  const svg = useRef(null);
  const v = val || { sx: null, sy: null, pts: [] };
  const L = 64, B = 44, T = 14, R = 14, W = 360, H = 270, VW = L + W + R, VH = T + H + B;
  // en mode solution : échelle conseillée et points exacts
  const sx = solution ? q.sxBon : v.sx, sy = solution ? q.syBon : v.sy;
  const pts = solution ? q.xs.map((x, i) => [x, q.ys[i]]) : (v.pts || []);
  const ok = sx != null && sy != null;
  const px = x => L + (x / (10 * sx)) * W, py = y => T + H - (y / (10 * sy)) * H;
  const suivant = !solution && ok ? (v.pts || []).length : -1;
  const place = e => {
    if (solution || !ok || (v.pts || []).length >= q.xs.length) return;
    const r = svg.current.getBoundingClientRect(), mx = (e.clientX - r.left) * (VW / r.width), my = (e.clientY - r.top) * (VH / r.height);
    if (mx < L - 6 || mx > L + W + 6 || my < T - 6 || my > T + H + 6) return;
    const x = ((mx - L) / W) * 10 * sx, y = ((T + H - my) / H) * 10 * sy;
    onChange({ ...v, pts: [...(v.pts || []), [x, y]] });
  };
  const mal = (resultat && resultat.mal) || [];
  const complet = pts.length === q.xs.length;
  const choix = (axe, opts, cle, ref) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 13.5, color: KIT.txt, flexBasis: '100%' }}>Axe {axe} : une graduation vaut</span>
      {opts.map(o => <button key={o} type="button" disabled={solution} onClick={() => onChange({ ...v, [cle]: o, pts: [] })}
        style={{ ...stylePetitBouton((solution ? ref : v[cle]) === o), minHeight: 36 }}>{grad(o)}{NB}{axe === 'horizontal' ? q.xunite : q.yunite}</button>)}
    </div>);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {choix('horizontal', q.sxOpts, 'sx', q.sxBon)}
      {choix('vertical', q.syOpts, 'sy', q.syBon)}
      {ok && !solution && <div style={{ fontSize: 14, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '6px 10px' }}>
        {suivant < q.xs.length
          ? <>Place le point n°<b>{suivant + 1}</b> sur {q.xs.length} : <b>{q.xnom} = {grad(q.xs[suivant])}{NB}{q.xunite}</b> ; <b>{q.ynom} = {nb(q.ys[suivant], 3)}{NB}{q.yunite}</b>.</>
          : <>Tous les points sont placés : clique sur « Corriger ».</>}
      </div>}
      {ok
        ? <svg ref={svg} viewBox={`0 0 ${VW} ${VH}`} onPointerDown={place} role="img" aria-label="Grille pour tracer la courbe"
            style={{ width: '100%', maxWidth: 520, touchAction: 'manipulation', background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, cursor: solution ? 'default' : 'crosshair' }}>
            {Array.from({ length: 11 }, (_, k) => <g key={k}>
              <line x1={L + k * W / 10} y1={T} x2={L + k * W / 10} y2={T + H} stroke={k % 5 === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={k === 0 ? 1.6 : 1}/>
              <line x1={L} y1={T + k * H / 10} x2={L + W} y2={T + k * H / 10} stroke={k % 5 === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={k === 10 ? 1.6 : 1}/>
              {k % 2 === 0 && <text x={L + k * W / 10} y={T + H + 15} fontSize="11" textAnchor="middle" fill="#334155">{grad(k * sx)}</text>}
              {k % 2 === 0 && <text x={L - 6} y={T + H - k * H / 10 + 4} fontSize="11" textAnchor="end" fill="#334155">{grad(k * sy)}</text>}
            </g>)}
            <text x={L + W / 2} y={VH - 6} fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700">{q.xnom} ({q.xunite})</text>
            <text x={12} y={T + H / 2} fontSize="12" textAnchor="middle" fill="#0f172a" fontWeight="700" transform={`rotate(-90 12 ${T + H / 2})`}>{q.ynom} ({q.yunite})</text>
            {complet && <path d={cheminLisse(pts.map(([x, y]) => [px(x), py(y)]))} fill="none" stroke={solution ? '#15803d' : '#2563eb'} strokeWidth="2" opacity="0.85"/>}
            {pts.map(([x, y], i) => <g key={i}>
              <circle cx={px(x)} cy={py(y)} r="5.5" fill={solution ? '#15803d' : mal.includes(i + 1) ? '#dc2626' : '#2563eb'} stroke="white" strokeWidth="1.5"/>
              <text x={px(x) + 8} y={py(y) - 7} fontSize="10" fill="#475569">{i + 1}</text>
            </g>)}
          </svg>
        : <div style={{ fontSize: 13.5, color: KIT.txt2 }}>La grille apparaît quand les deux échelles sont choisies.</div>}
      {solution && <div style={{ fontSize: 13.5, color: '#15803d', fontWeight: 700 }}>Solution : points verts = positions attendues, avec les échelles conseillées.</div>}
      {ok && !solution && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => onChange({ ...v, pts: (v.pts || []).slice(0, -1) })} disabled={!(v.pts || []).length} style={stylePetitBouton(false)}>↶ Annuler le dernier point</button>
        <button type="button" onClick={() => onChange({ ...v, pts: [] })} disabled={!(v.pts || []).length} style={stylePetitBouton(false)}>Tout effacer</button>
      </div>}
    </div>
  );
}

// Données d'un tracé : jeu de points et échelles proposées
function donneesTrace() {
  const ctx = tire(['photo', 'ctn', 'charge']);
  for (let essai = 0; essai < 60; essai++) {
    let c;
    if (ctx === 'photo') {
      const a = alea(40, 60, 3), b = alea(0.48, 0.6, 2), E = [200, 450, 720, 1020, 1500, 2120, 2570, 3110, 3430].map(e => Math.round(e * (0.9 + 0.2 * Math.random()) / 10) * 10);
      c = { xs: E, ys: E.map(e => Number((a * Math.pow(e, -b)).toPrecision(3))), xnom: 'E', xunite: 'lx', ynom: 'Rp', yunite: 'kΩ', ynomJSX: <>R<sub>p</sub></>, xnomJSX: <>E</>,
        sujet: 'photorésistance : sa résistance R_p diminue quand l’éclairement E augmente', var: 'E' };
    } else if (ctx === 'ctn') {
      const R0 = alea(8, 12, 2), B = alea(3300, 4100, 3), th = [0, 10, 20, 30, 40, 50, 60, 70, 80];
      c = { xs: th, ys: th.map(t => Number((R0 * Math.exp(B * (1 / (t + 273.15) - 1 / 298.15))).toPrecision(3))), xnom: 'θ', xunite: '°C', ynom: 'R', yunite: 'kΩ', ynomJSX: <>R</>, xnomJSX: <>θ</>,
        sujet: 'thermistance CTN : sa résistance R diminue quand la température θ augmente', var: 'θ' };
    } else {
      const U = alea(3.3, 5, 2), tau = alea(8, 25, 2), pas = tire([5, 10]), t = Array.from({ length: 9 }, (_, i) => i * pas);
      c = { xs: t, ys: t.map(x => Number((U * (1 - Math.exp(-x / tau))).toPrecision(3))), xnom: 't', xunite: 'ms', ynom: 'u', yunite: 'V', ynomJSX: <>u</>, xnomJSX: <>t</>,
        sujet: 'charge d’un condensateur : la tension u à ses bornes augmente avec le temps t', var: 't' };
    }
    const mx = Math.max(...c.xs), my = Math.max(...c.ys);
    if (bonPas(mx).length === 1 && bonPas(my).length === 1 && new Set(c.xs).size === c.xs.length && c.ys.every(y => y > 0 || ctx === 'charge')) {
      return { ...c, sxOpts: optionsPas(mx), syOpts: optionsPas(my), sxBon: bonPas(mx)[0], syBon: bonPas(my)[0] };
    }
  }
  return null;
}

export function genTrace() {
  const d = donneesTrace() || donneesTrace();
  const tab = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 13.5, margin: '4px 0' }}>
        <tbody>
          <tr><th style={cel(true)}>{d.xnomJSX} ({d.xunite})</th>{d.xs.map((x, i) => <td key={i} style={cel()}>{grad(x)}</td>)}</tr>
          <tr><th style={cel(true)}>{d.ynomJSX} ({d.yunite})</th>{d.ys.map((y, i) => <td key={i} style={cel()}>{nb(y, 3)}</td>)}</tr>
        </tbody>
      </table>
    </div>);
  const q0opts = melange([`${d.xnom} (la grandeur que l’on fait varier)`, `${d.ynom} (la grandeur mesurée en réponse)`]);
  return {
    intro: `On a mesuré ${d.sujet}. Le tableau ci-dessous donne les mesures. Il faut représenter ce phénomène par une courbe : choisir les axes, les échelles, placer les points, puis les relier.`,
    figure: <div style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '6px 10px' }}>{tab}</div>,
    questions: [
      { id: 'a0', type: 'qcm', q: <>Quelle grandeur place-t-on <b>en abscisse</b> (axe horizontal) ?</>, options: q0opts, bonne: q0opts.findIndex(o => o.startsWith(d.xnom + ' ')),
        aide: 'En abscisse, on place la grandeur que l’on choisit ou que l’on fait varier ; en ordonnée, celle qui en dépend.',
        expl: <>On trace <b>{d.ynomJSX} en fonction de {d.xnomJSX}</b> : {d.xnomJSX} est la grandeur qui varie, {d.ynomJSX} est la réponse mesurée. « y en fonction de x » : y en ordonnée, x en abscisse.</> },
      { id: 'a1', type: 'trace', q: <>Choisis l’échelle de chaque axe, puis place les {d.xs.length} points du tableau dans l’ordre.</>, xs: d.xs, ys: d.ys, xnom: d.xnom, xunite: d.xunite, ynom: d.ynom, yunite: d.yunite,
        sxOpts: d.sxOpts, syOpts: d.syOpts, sxBon: d.sxBon, syBon: d.syBon,
        aide: 'L’axe comporte 10 graduations à partir de 0. Choisis une échelle pour que la plus grande valeur tienne dans la grille tout en occupant au moins la moitié de l’axe.',
        expl: <>Échelles adaptées : <b>{grad(d.sxBon)}{NB}{d.xunite}</b> par graduation en abscisse (axe de 0 à {grad(10 * d.sxBon)}) et <b>{grad(d.syBon)}{NB}{d.yunite}</b> en ordonnée (axe de 0 à {grad(10 * d.syBon)}). La plus grande valeur ({grad(Math.max(...d.xs))} et {grad(Math.max(...d.ys))}) occupe plus de la moitié de la grille.</> },
      (() => { const o = melange(['Par une courbe lissée, sans angle, passant au plus près des points', 'Par des segments droits, d’un point au suivant (ligne brisée)', 'Par une seule droite, quelle que soit la forme des points', 'On ne les relie pas : on laisse les points isolés']);
        return { id: 'a2', type: 'qcm', q: <>Comment relier les points ?</>, options: o, bonne: 0 + o.findIndex(x => x.startsWith('Par une courbe')),
          aide: 'La grandeur varie de façon continue, et chaque mesure est entachée d’une incertitude.',
          expl: <>La grandeur varie de façon <b>continue</b> : on trace une courbe lissée, sans angle. Une ligne brisée ferait croire à des variations brusques entre deux mesures. Une droite n’est justifiée que si les points sont alignés : ici, ils ne le sont pas.</> }; })(),
    ],
    retenir: ['En abscisse : la grandeur que l’on fait varier ; en ordonnée : la grandeur mesurée.', 'Échelle : valeurs rondes (1, 2 ou 5 × 10ⁿ par graduation), la plus grande valeur occupe au moins la moitié de l’axe.', 'Titre et unité sur chaque axe.', 'On relie les points par une courbe lissée (pas une ligne brisée), ou par une droite seulement si les points sont alignés.'],
  };
}
const cel = tete => ({ border: `1px solid ${KIT.bord}`, padding: '3px 8px', textAlign: tete ? 'left' : 'right', background: tete ? '#f1f5f9' : 'white', whiteSpace: 'nowrap', fontWeight: tete ? 700 : 400 });

// ──────────────────────── R2 : pont diviseur de tension ────────────────────────
export function genPont() {
  const cas = tire([
    { nom: 'photorésistance', Rp: () => alea(0.5, 3, 2), unRp: 'kΩ', R: 1.0, unR: 'kΩ', UG: 5.0 },
    { nom: 'thermistance CTN', Rp: () => alea(2, 25, 2), unRp: 'kΩ', R: 10, unR: 'kΩ', UG: 5.0 },
    { nom: 'photorésistance', Rp: () => alea(0.5, 3, 2), unRp: 'kΩ', R: 1000, unR: 'Ω', UG: 3.3 },   // conversion cachée : Ω et kΩ
    { nom: 'thermistance CTN', Rp: () => alea(2, 25, 2), unRp: 'kΩ', R: 4700, unR: 'Ω', UG: 5.0 },
  ]);
  const aux = tire(['R', 'Rp']);        // tension mesurée aux bornes de R, ou du capteur
  const Rk = cas.unR === 'Ω' ? cas.R / 1000 : cas.R;
  let Rp = cas.Rp();
  while (Math.abs(Rp / Rk - 1) < 0.25) Rp = cas.Rp();      // R_p ≠ R : sinon les deux expressions donnent le même nombre et l'erreur de numérateur passerait inaperçue
  const Rpk = Rp;
  const vrai = aux === 'R' ? cas.UG * Rk / (Rk + Rpk) : cas.UG * Rpk / (Rk + Rpk);
  const faux = aux === 'R' ? cas.UG * Rpk / (Rk + Rpk) : cas.UG * Rk / (Rk + Rpk);
  const nonConv = aux === 'R' ? cas.UG * (cas.unR === 'Ω' ? cas.R : cas.R) / (cas.R + Rp) : cas.UG * Rp / (cas.R + Rp);
  const brnJ = aux === 'R' ? <>R</> : <>R<sub>p</sub></>;
  const UJ = aux === 'R' ? <>U<sub>R</sub></> : <>U<sub>Rp</sub></>;
  const num = aux === 'R' ? <>R</> : <>R<sub>p</sub></>, den = <>R + R<sub>p</sub></>;
  const exprs = melange([
    { t: aux === 'R' ? 'U_G × R / (R + R_p)' : 'U_G × R_p / (R + R_p)', j: aux === 'R' ? <>U<sub>G</sub> × R / (R + R<sub>p</sub>)</> : <>U<sub>G</sub> × R<sub>p</sub> / (R + R<sub>p</sub>)</>, ok: true },
    { t: 'x', j: aux === 'R' ? <>U<sub>G</sub> × R<sub>p</sub> / (R + R<sub>p</sub>)</> : <>U<sub>G</sub> × R / (R + R<sub>p</sub>)</>, ok: false },
    { t: 'y', j: <>U<sub>G</sub> × (R + R<sub>p</sub>) / {brnJ}</>, ok: false },
    { t: 'z', j: <>U<sub>G</sub> × {brnJ} / R<sub>p</sub></>, ok: false },
  ]);
  const unG = nb(cas.UG, 2), Rtxt = `${nb(cas.R, 2)}${NB}${cas.unR}`;
  const figure = (
    <div style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 }}>
      <svg viewBox="0 0 330 150" role="img" aria-label="Pont diviseur : générateur, résistance R et capteur Rp en série" style={{ width: '100%', maxWidth: 360 }}>
        <rect x="40" y="20" width="250" height="100" fill="none" stroke="#334155" strokeWidth="2" rx="4"/>
        <rect x="140" y="12" width="70" height="16" fill="white" stroke="#334155" strokeWidth="2"/><text x="175" y="42" fontSize="12" textAnchor="middle" fill="#0f172a">R = {Rtxt}</text>
        <rect x="278" y="55" width="24" height="40" fill="white" stroke="#334155" strokeWidth="2"/><text x="244" y="78" fontSize="12" textAnchor="end" fill="#0f172a">R</text><text x="249" y="82" fontSize="9" fill="#0f172a">p</text>
        <circle cx="40" cy="70" r="14" fill="white" stroke="#334155" strokeWidth="2"/><text x="40" y="74" fontSize="11" textAnchor="middle" fill="#0f172a">U</text><text x="47" y="78" fontSize="8" fill="#0f172a">G</text>
        <text x="62" y="68" fontSize="12" fill="#0f172a">{unG} V</text>
        <text x="175" y="140" fontSize="12" textAnchor="middle" fill="#2563eb" fontWeight="700">on mesure U<tspan fontSize="9" dy="3">{aux === 'R' ? 'R' : 'Rp'}</tspan><tspan dy="-3"> : tension aux bornes {aux === 'R' ? 'de R' : 'du capteur'}</tspan></text>
      </svg>
    </div>);
  const qs = [
    { id: 'p0', type: 'qcm', q: <>Quelle est l’<b>expression littérale</b> de {UJ} (diviseur de tension) ?</>, options: exprs.map(e => e.j), bonne: exprs.findIndex(e => e.ok),
      aide: 'La tension aux bornes d’une résistance en série vaut la tension totale multipliée par (cette résistance) / (somme des résistances).',
      expl: <>Dans un diviseur de tension, la tension aux bornes d’une résistance est <b>U<sub>G</sub> × (cette résistance) / (somme des résistances)</b> : {UJ} = U<sub>G</sub> × {num} / ({den}).</> },
    { id: 'p1', type: 'num', q: <>Calculez {UJ} pour R<sub>p</sub> = <b>{nb(Rp, 2)}{NB}kΩ</b>, R = <b>{Rtxt}</b> et U<sub>G</sub> = <b>{unG}{NB}V</b>.</>, unite: 'V', vrai, csMin: 2, tolRel: 0.01,
      pieges: [[faux, 'Vous avez pris la mauvaise résistance au numérateur : le numérateur est la résistance aux bornes de laquelle on mesure la tension.'], ...(cas.unR === 'Ω' ? [[nonConv, 'R et R_p ne sont pas dans la même unité : convertissez (1 kΩ = 10³ Ω) avant de calculer.']] : [])],
      aide: 'Mettez R et R_p dans la même unité (1 kΩ = 10³ Ω), écrivez l’expression littérale, puis remplacez par les valeurs.',
      expl: <>{cas.unR === 'Ω' ? <>D’abord la même unité : R = {nb(cas.R, 2)} Ω = {nb(Rk, 2)} kΩ (1 kΩ = 10³ Ω). </> : null}{UJ} = U<sub>G</sub> × {num} / ({den}) = {unG} × {nb(aux === 'R' ? Rk : Rpk, 2)} / ({nb(Rk, 2)} + {nb(Rpk, 2)}) = <b>{nb(vrai, 3)}{NB}V</b>. Les unités de résistance se simplifient : peu importe laquelle, pourvu que ce soit la même.</> },
    (() => { const o = melange([`entre 0 et U_G (soit entre 0 et ${unG} V)`, `entre 0 et U_G / 2`, `entre U_G et 2 U_G`, `entre −U_G et +U_G`]);
      return { id: 'p2', type: 'qcm', q: <>Contrôle de plausibilité : entre quelles valeurs doit se trouver {UJ} ?</>, options: o, bonne: o.findIndex(x => x.startsWith('entre 0 et U_G (')),
        aide: 'Une tension aux bornes d’une partie du circuit ne peut pas dépasser la tension totale appliquée.',
        expl: <>{UJ} est une <b>fraction</b> de U<sub>G</sub> (le rapport {num} / ({den}) est compris entre 0 et 1) : donc 0 &lt; {UJ} &lt; U<sub>G</sub> = {unG} V. Un résultat de {nb(vrai, 3)} V est bien dans cet intervalle.</> }; })(),
  ];
  return { intro: `Un capteur résistif (${cas.nom}), de résistance R_p, est placé en série avec une résistance R et un générateur de tension U_G. Un conditionneur de ce type transforme la variation de résistance du capteur en variation de tension, que l’on peut mesurer.`,
    figure, questions: qs,
    retenir: ['Diviseur de tension : la tension aux bornes d’une résistance = U_G × (cette résistance) / (somme des résistances).', 'On écrit l’expression littérale avant l’application numérique, avec toutes les résistances dans la même unité.', 'Contrôle : 0 < U < U_G. Si la mesure se fait aux bornes du capteur au lieu de R, la tension varie en sens inverse.'] };
}

// ──────────────────────── R3 : temps de réponse à 5 % ────────────────────────
// Réponse d'un capteur du premier ordre à un échelon : V(t) = V_fin + (V_ini − V_fin) exp(−(t − t0)/τ) pour t ≥ t0 (modèle du premier ordre, hypothèse de travail).
function FigureEchelon({ g }) {
  const L = 56, B = 40, T = 12, R = 12, W = 380, H = 220, VW = L + W + R, VH = T + H + B;
  const x = t => L + (t / g.tmax) * W, y = v => T + H - ((v - g.vmin) / (g.vmax - g.vmin)) * H;
  const pts = []; for (let t = 0; t <= g.tmax + 1e-9; t += g.tmax / 160) pts.push([x(t), y(g.V(t))]);
  const gx = []; for (let t = 0; t <= g.tmax + 1e-9; t += g.pasT) gx.push(t);
  const gy = []; for (let v = g.vmin; v <= g.vmax + 1e-9; v += g.pasV) gy.push(Number(v.toFixed(6)));
  return (
    <div style={{ background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label="Réponse du capteur à un échelon de la grandeur mesurée" style={{ width: '100%', maxWidth: 560 }}>
        {gx.map(t => <g key={'x' + t}><line x1={x(t)} y1={T} x2={x(t)} y2={T + H} stroke={t % (2 * g.pasT) === 0 ? '#cbd5e1' : '#eef2f7'}/>{t % (2 * g.pasT) === 0 && <text x={x(t)} y={T + H + 14} fontSize="11" textAnchor="middle" fill="#334155">{grad(t)}</text>}</g>)}
        {gy.map(v => <g key={'y' + v}><line x1={L} y1={y(v)} x2={L + W} y2={y(v)} stroke="#cbd5e1"/><text x={L - 6} y={y(v) + 4} fontSize="11" textAnchor="end" fill="#334155">{grad(v)}</text></g>)}
        <line x1={L} y1={T} x2={L} y2={T + H} stroke="#334155" strokeWidth="1.5"/><line x1={L} y1={T + H} x2={L + W} y2={T + H} stroke="#334155" strokeWidth="1.5"/>
        <path d={'M' + pts.map(p => p.join(',')).join(' L')} fill="none" stroke="#2563eb" strokeWidth="2.2"/>
        <text x={L + W / 2} y={VH - 6} fontSize="12" textAnchor="middle" fontWeight="700" fill="#0f172a">t (ms)</text>
        <text x={12} y={T + H / 2} fontSize="12" textAnchor="middle" fontWeight="700" fill="#0f172a" transform={`rotate(-90 12 ${T + H / 2})`}>V (V)</text>
      </svg>
    </div>);
}

export function genTemps() {
  const montant = Math.random() < 0.55;
  const ctx = tire([{ nom: 'photorésistance', evt: montant ? 'l’éclairement passe brusquement d’une valeur faible à une valeur élevée' : 'l’éclairement chute brusquement (entrée dans un tunnel)' },
    { nom: 'capteur de température', evt: montant ? 'la température passe brusquement d’une valeur basse à une valeur haute' : 'la température chute brusquement' }]);
  const a = alea(0.8, 1.8, 2), b = alea(2.9, 4.2, 2), Vini = montant ? a : b, Vfin = montant ? b : a;
  const tau = tire([10, 12, 15, 18, 20, 25, 30]), t0 = tire([10, 15, 20, 25]);
  const dV = Math.abs(Vfin - Vini), t1 = t0 + tau * Math.log(20), tR = tau * Math.log(20);       // t1 − t0 = τ ln 20 ≈ 3 τ
  const seuil = montant ? Vfin - 0.05 * dV : Vfin + 0.05 * dV;
  const tmax = Math.ceil((t0 + tau * 4.4) / 20) * 20, pasT = tmax > 100 ? 10 : 5;
  const vmin = Math.floor((Math.min(Vini, Vfin) - 0.3) * 2) / 2, vmax = Math.ceil((Math.max(Vini, Vfin) + 0.3) * 2) / 2;
  const g = { tmax, pasT, vmin, vmax, pasV: 0.5, V: t => t < t0 ? Vini : Vfin + (Vini - Vfin) * Math.exp(-(t - t0) / tau) };
  const sens = montant ? 'monte' : 'descend';
  const q = [
    { id: 't0', type: 'num', q: <>Calculez l’amplitude de l’échelon <b>ΔV</b> = |V<sub>fin</sub> − V<sub>ini</sub>| (valeur positive), avec V<sub>ini</sub> = <b>{nb(Vini, 2)}{NB}V</b> et V<sub>fin</sub> = <b>{nb(Vfin, 2)}{NB}V</b>.</>, unite: 'V', vrai: dV, csMin: 2, tolRel: 0.012,
      aide: 'Amplitude = différence entre la valeur finale et la valeur initiale, prise positive.', expl: <>ΔV = |{nb(Vfin, 2)} − {nb(Vini, 2)}| = <b>{nb(dV, 2)}{NB}V</b>.</> },
    { id: 't1', type: 'num', q: <>Calculez 5 % de ΔV, puis le <b>seuil</b> à atteindre : la tension est à moins de 5 % de ΔV de sa valeur finale. {montant ? <>Ici V monte : seuil = V<sub>fin</sub> − 5 % ΔV.</> : <>Ici V descend : seuil = V<sub>fin</sub> + 5 % ΔV.</>} Donnez le seuil en volts.</>, unite: 'V', vrai: seuil, csMin: 3, tolRel: 0.006,
      pieges: [[montant ? Vfin + 0.05 * dV : Vfin - 0.05 * dV, `Mauvais sens : la tension ${sens}, le seuil est ${montant ? 'en dessous' : 'au-dessus'} de V_fin.`], [0.05 * dV, 'Vous avez donné 5 % de ΔV, il faut ensuite le soustraire ou l’ajouter à V_fin pour obtenir le seuil.']],
      aide: `5 % de ΔV = 0,05 × ΔV. Le capteur « a répondu » quand V est entre le seuil et V_fin (la tension ${sens}).`,
      expl: <>5 % de ΔV = 0,05 × {nb(dV, 2)} = {nb(0.05 * dV, 3)} V. Seuil = V<sub>fin</sub> {montant ? '−' : '+'} 0,05 ΔV = {nb(Vfin, 2)} {montant ? '−' : '+'} {nb(0.05 * dV, 3)} = <b>{nb(seuil, 3)}{NB}V</b>.</> },
    { id: 't2', type: 'num', q: <>Sur le graphique, la variation commence à l’instant <b>t<sub>0</sub> = {t0}{NB}ms</b>. Lisez l’instant <b>t<sub>1</sub></b> où la courbe atteint le seuil ({nb(seuil, 3)} V).</>, unite: 'ms', vrai: t1, tolRel: 0.05, csMin: 2,
      aide: 'Tracez mentalement une ligne horizontale à la valeur du seuil : t₁ est l’abscisse du point où elle coupe la courbe.', expl: <>On lit t<sub>1</sub> ≈ <b>{nb(t1, 3)}{NB}ms</b> (à ± 2 ms près sur le graphique).</> },
    { id: 't3', type: 'num', q: <>Calculez le <b>temps de réponse à 5 %</b> : t<sub>R</sub> = t<sub>1</sub> − t<sub>0</sub>.</>, unite: 'ms', vrai: tR, tolRel: 0.07, csMin: 2,
      aide: 'Le temps de réponse se compte à partir du début de la variation (t₀), pas à partir de l’instant 0.', pieges: [[t1, 'Vous avez donné t₁ : le temps de réponse se compte depuis t₀, donc t_R = t₁ − t₀.']],
      expl: <>t<sub>R</sub> = t<sub>1</sub> − t<sub>0</sub> ≈ {nb(t1, 3)} − {t0} = <b>{nb(tR, 2)}{NB}ms</b> (à quelques ms près, selon la lecture).</> },
  ];
  return { intro: `Un conditionneur délivre une tension V proportionnelle à la grandeur mesurée par un capteur (${ctx.nom}). À l’instant t₀, ${ctx.evt} : la tension V change et se stabilise à une valeur finale V_fin. On suppose une réponse de type exponentiel (premier ordre) et on définit le temps de réponse à 5 % : durée au bout de laquelle V est à moins de 5 % de ΔV de sa valeur finale.`,
    figure: <FigureEchelon g={g}/>, questions: q,
    retenir: ['Temps de réponse à 5 % : t_R = t₁ − t₀, où t₁ est l’instant où V est à moins de 5 % de ΔV de V_fin (c’est une définition conventionnelle).', 'Seuil : V_fin − 5 % ΔV si V monte, V_fin + 5 % ΔV si V descend.', 'Pour un système du premier ordre, t_R ≈ 3 τ.'] };
}
