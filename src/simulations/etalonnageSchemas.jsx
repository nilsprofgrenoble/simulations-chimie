// ====================================================
//  Schémas de la simulation 136 (dosage conductimétrique par étalonnage : conductance, constante de cellule, courbe d'étalonnage ; niveau TG).
//  Scène : viewBox de 400, textes de 15 à 20. Cartes « À retenir » : viewBox de 400, police ≥ 16, aucun indice en tspan, fractions dessinées.
//  Public daltonien : jamais deux espèces ou deux séries distinguées par la couleur seule. Ions : taille (rayon symbolique) et signe + ou − dans chaque point ;
//  points du graphique : cercle plein (dans le domaine de validité) ou carré vide (hors domaine) ; droite pleine, prolongement et lecture en pointillés.
//  Le nombre de points de la scène est qualitatif : il croît avec la concentration, sans échelle.
// ====================================================

import { IONS_DESSIN as IONS_D } from './condEtalonnageModele';

const COL = { bleu: '#0369a1', vert: '#15803d', orange: '#b45309', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a' };
const stl = { width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const fr = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');

const SLOTS = (() => {
  const s = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) s.push([108 + c * 16.5 + (r % 2 ? 8 : 0), 182 + r * 17.5]);
  let g = 11; const al = () => { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(al() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
})();
const Point = ({ x, y, couleur, signe, r = 6.2 }) => { const a = r * 0.5, w = Math.max(1.4, r * 0.29);
  return (
    <g><circle cx={x} cy={y} r={r} fill={couleur} stroke="#fff" strokeWidth="0.8"/>
      <line x1={x - a} y1={y} x2={x + a} y2={y} stroke="#fff" strokeWidth={w}/>{signe > 0 && <line x1={x} y1={y - a} x2={x} y2={y + a} stroke="#fff" strokeWidth={w}/>}</g>); };
// ---------- petits outils de dessin ----------
const Fleche = ({ x1, y1, x2, y2, c = COL.txt, w = 2.5, deux = false }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), t = 10;
  const tete = (x, y, ang) => `${x},${y} ${x - t * Math.cos(ang - 0.45)},${y - t * Math.sin(ang - 0.45)} ${x - t * Math.cos(ang + 0.45)},${y - t * Math.sin(ang + 0.45)}`;
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w}/><polygon points={tete(x2, y2, a)} fill={c}/>{deux && <polygon points={tete(x1, y1, a + Math.PI)} fill={c}/>}</g>;
};
const Frac = ({ x, y, num, den, size = 20, fill = COL.txt }) => {
  const w = Math.max(num.length, den.length) * size * 0.56 + 10;
  return <g><text x={x} y={y - 6} fontSize={size} fontWeight="700" textAnchor="middle" fill={fill}>{num}</text><line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={fill} strokeWidth="2"/><text x={x} y={y + size + 1} fontSize={size} fontWeight="700" textAnchor="middle" fill={fill}>{den}</text></g>;
};
// deux plaques parallèles en perspective, surface S, distance L (centrées sur cx)
const Plaques = ({ cx, y, ecart = 112, h = 50 }) => {
  const g = cx - ecart / 2, d = cx + ecart / 2, plaque = x => `${x - 12},${y + 10} ${x + 12},${y} ${x + 12},${y + h} ${x - 12},${y + h + 10}`;
  return (
    <g>
      <polygon points={plaque(g)} fill="#334155" stroke="#0f172a"/><polygon points={plaque(d)} fill="#334155" stroke="#0f172a"/>
      <text x={g} y={y + h / 2 + 12} fontSize="17" fontWeight="700" textAnchor="middle" fill="#fff">S</text><text x={d} y={y + h / 2 + 12} fontSize="17" fontWeight="700" textAnchor="middle" fill="#fff">S</text>
      <Fleche x1={g + 16} y1={y + h / 2 + 6} x2={d - 16} y2={y + h / 2 + 6} c={COL.orange} deux/>
      <text x={cx} y={y + h / 2 - 2} fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.orange}>L</text>
    </g>);
};

// ---------- scène : bécher, solution, cellule de conductimétrie, conductimètre ----------
//  cat, an : identifiants de IONS_D ; n : nombre de points par ion ; lecture : texte du conductimètre ; titre : nom de la solution
export function SceneEtalonnage({ cat, an, n, lecture, titre = '' }) {
  const C = IONS_D[cat], A = IONS_D[an], dots = []; let k = 0;
  for (let i = 0; i < n && k < SLOTS.length; i++, k++) dots.push({ ...C, p: SLOTS[k] });
  for (let i = 0; i < n && k < SLOTS.length; i++, k++) dots.push({ ...A, p: SLOTS[k] });
  const leg = [C, A];
  return (
    <svg viewBox="0 0 400 326" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`${titre || 'Solution'} dans un bécher, avec des ions ${C.f} et ${A.f}. Une cellule de conductimétrie, dont les deux plaques de surface S sont distantes de L, plonge dans la solution et est reliée à un conductimètre qui affiche ${lecture}.`}>
      {/* plaques de la cellule (agrandissement) */}
      <rect x="8" y="6" width="196" height="108" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="106" y="25" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>plaques de la cellule</text>
      <Plaques cx={106} y={34} ecart={112} h={44}/>
      <text x="106" y="106" fontSize="15" textAnchor="middle" fill={COL.txt}>S : surface, L : distance</text>
      {/* conductimètre */}
      <rect x="262" y="8" width="132" height="62" rx="8" fill="#e2e8f0" stroke="#64748b" strokeWidth="2"/>
      <rect x="270" y="14" width="116" height="30" rx="4" fill="#0f172a"/>
      <text x="328" y="36" fontSize="20" fontWeight="700" textAnchor="middle" fill="#86efac" fontFamily="monospace">{lecture}</text>
      <text x="328" y="62" fontSize="15" textAnchor="middle" fill={COL.txt}>conductimètre</text>
      {titre && <text x="8" y="132" fontSize="16" fontWeight="700" fill={COL.txt}>{titre}</text>}
      {/* bécher */}
      <path d="M95 142 L95 270 Q95 276 101 276 L259 276 Q265 276 265 270 L265 142" fill="none" stroke="#475569" strokeWidth="3"/>
      <path d="M98 170 L98 270 Q98 273 101 273 L259 273 Q262 273 262 270 L262 170 Z" fill="#dbeafe" opacity="0.75"/>
      {/* ions */}
      {dots.map((d, i) => <Point key={i} x={d.p[0]} y={d.p[1]} couleur={d.c} signe={d.s} r={d.r}/>)}
      {/* cellule : câble, poignée, manchon de verre, deux plaques de platine noires */}
      <path d="M235 108 C235 72 262 90 300 70" fill="none" stroke="#334155" strokeWidth="3"/>
      <rect x="227" y="108" width="16" height="32" rx="3" fill="#475569"/>
      <rect x="222" y="138" width="26" height="92" rx="4" fill="#f8fafc" fillOpacity="0.7" stroke="#64748b" strokeWidth="1.8"/>
      <rect x="229" y="188" width="5" height="38" fill="#0f172a"/><rect x="236" y="188" width="5" height="38" fill="#0f172a"/>
      {[146, 158, 170].map(y => <line key={y} x1="225" y1={y} x2="245" y2={y} stroke="#94a3b8" strokeWidth="1.5"/>)}
      <text x="272" y="190" fontSize="15" fill={COL.txt}>cellule de</text><text x="272" y="208" fontSize="15" fill={COL.txt}>conductimétrie</text>
      <line x1="268" y1="186" x2="250" y2="202" stroke={COL.gris} strokeWidth="1.5"/>
      {/* légende */}
      {leg.map((l, i) => { const x = 10 + i * 130, y = 300;
        return <g key={l.f}><Point x={x + 9} y={y - 5} couleur={l.c} signe={l.s} r={l.r}/><text x={x + 24} y={y} fontSize="16" fill={COL.txt}>{l.f}</text></g>; })}
      <text x="8" y="320" fontSize="14" fill={COL.gris}>points : nombre qualitatif (plus = plus concentré)</text>
    </svg>);
}

// ---------- graphique G = f(c) ----------
//  points : [{ c, G, hors }] ; droite : coefficient directeur a (mS par mmol/L) ou null ; marqueur : { G, a } (lecture de la solution S′) ou null
const pasNet = (max, cible) => { const b = max / cible, p = 10 ** Math.floor(Math.log10(b)), m = b / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
export function GraphiqueEtalonnage({ points = [], droite = null, xMax = 12, yMax = 1.8, marqueur = null, titre = '' }) {
  const X = c => 56 + 330 * c / xMax, Y = g => 196 - 176 * g / yMax;
  const px = pasNet(xMax, 6), py = pasNet(yMax, 5), gx = [], gy = [];
  for (let v = 0; v <= xMax + 1e-9; v += px) gx.push(v); for (let v = 0; v <= yMax + 1e-9; v += py) gy.push(v);
  const cMax = Math.min(10, xMax), aHors = points.some(p => p.hors);
  const cLu = marqueur && droite ? marqueur.G / droite : null;
  const lignes = [['pt', 'étalon mesuré (dans le domaine)'], ...(aHors ? [['carre', 'étalon hors domaine (c > 10 mmol/L)']] : []), ...(droite ? [['droite', 'droite d’étalonnage']] : []), ...(marqueur ? [['lecture', 'lecture pour la solution S′']] : [])];
  return (
    <svg viewBox={`0 0 400 ${262 + 18 * lignes.length + 4}`} style={{ ...stl, maxWidth: 520 }} role="img"
      aria-label={`${titre || 'Courbe d’étalonnage'} : conductance G en mS en fonction de la concentration c en mmol par litre, de 0 à ${fr(xMax, 0)} mmol par litre. ${points.length} points mesurés${droite ? ', droite d’étalonnage passant par l’origine' : ''}${marqueur ? `, conductance de la solution S′ : ${fr(marqueur.G, 3)} mS` : ''}.`}>
      <rect x="56" y="20" width="330" height="176" fill="#f8fafc" stroke="#cbd5e1"/>
      {gy.map(g => <g key={g}><line x1="56" y1={Y(g)} x2="386" y2={Y(g)} stroke="#e2e8f0"/><text x="50" y={Y(g) + 5} fontSize="16" textAnchor="end" fill={COL.txt}>{fr(g, py < 1 ? (py < 0.1 ? 2 : 1) : 0)}</text></g>)}
      {gx.map(v => <g key={v}><line x1={X(v)} y1="196" x2={X(v)} y2="202" stroke={COL.txt}/><text x={X(v)} y="220" fontSize="16" textAnchor="middle" fill={COL.txt}>{fr(v, 0)}</text></g>)}
      <text x="56" y="14" fontSize="16" fill={COL.gris}>G (mS)</text>
      <text x="386" y="242" fontSize="16" textAnchor="end" fill={COL.gris}>concentration c (mmol/L)</text>
      {droite && <g>
        <line x1={X(0)} y1={Y(0)} x2={X(cMax)} y2={Math.max(20, Y(droite * cMax))} stroke={COL.bleu} strokeWidth="3"/>
        {xMax > 10 && <line x1={X(10)} y1={Y(droite * 10)} x2={X(xMax)} y2={Math.max(20, Y(droite * xMax))} stroke={COL.bleu} strokeWidth="2.5" strokeDasharray="7 6"/>}</g>}
      {marqueur && <g>
        <line x1="56" y1={Y(marqueur.G)} x2={cLu != null ? X(cLu) : 386} y2={Y(marqueur.G)} stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>
        {cLu != null && <line x1={X(cLu)} y1={Y(marqueur.G)} x2={X(cLu)} y2="196" stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>}
        <text x="62" y={Y(marqueur.G) - 6} fontSize="16" fontWeight="700" fill={COL.rouge}>S′</text></g>}
      {points.map(p => p.hors
        ? <rect key={p.c} x={X(p.c) - 6} y={Y(p.G) - 6} width="12" height="12" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/>
        : <circle key={p.c} cx={X(p.c)} cy={Y(p.G)} r="5.5" fill={COL.bleu} stroke="#fff" strokeWidth="1.2"/>)}
      {lignes.map(([t, txt], i) => { const y = 262 + 18 * i;
        return <g key={t}>
          {t === 'pt' && <circle cx="20" cy={y - 5} r="5.5" fill={COL.bleu}/>}
          {t === 'carre' && <rect x="14" y={y - 11} width="12" height="12" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/>}
          {t === 'droite' && <line x1="10" y1={y - 5} x2="30" y2={y - 5} stroke={COL.bleu} strokeWidth="3"/>}
          {t === 'lecture' && <line x1="10" y1={y - 5} x2="30" y2={y - 5} stroke={COL.rouge} strokeWidth="2" strokeDasharray="5 4"/>}
          <text x="38" y={y} fontSize="15" fill={COL.txt}>{txt}</text></g>; })}
    </svg>);
}

// ================= cartes « À retenir » =================
// carte 1 : G, σ, k
export function SvgGSigmaKCarte() {
  const ligne = (y, sym, nom, dep) => <g><rect x="12" y={y - 18} width="44" height="30" rx="6" fill="#f1f5f9" stroke="#94a3b8"/><text x="34" y={y + 4} fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt}>{sym}</text>
    <text x="66" y={y - 2} fontSize="16" fontWeight="700" fill={COL.txt}>{nom}</text><text x="66" y={y + 17} fontSize="16" fill={COL.txt}>{dep}</text></g>;
  return (
    <svg viewBox="0 0 400 300" style={stl} role="img" aria-label="Deux plaques de surface S distantes de L forment la cellule. La conductance G, en siemens, dépend de la solution et de la cellule. La conductivité sigma, en siemens par mètre, ne dépend que de la solution. La constante de cellule k égale L divisée par S, en mètre moins un. Sigma égale k fois G.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>G, σ et k : trois grandeurs</text>
      <Plaques cx={96} y={44} ecart={120} h={56}/>
      <text x="96" y="126" fontSize="16" textAnchor="middle" fill={COL.txt}>la cellule</text>
      <text x="252" y="80" fontSize="22" fontWeight="700" fill={COL.bleu}>σ = k × G</text>
      <text x="252" y="114" fontSize="22" fontWeight="700" fill={COL.txt}>k =</text><Frac x={320} y={108} num="L" den="S" size={22}/>
      {ligne(160, 'G', 'conductance, en S', 'dépend de la solution et de la cellule')}
      {ligne(206, 'σ', 'conductivité, en S·m⁻¹', 'dépend de la solution seule')}
      {ligne(252, 'k', 'constante de cellule, en m⁻¹', 'dépend de la cellule seule')}
      <text x="200" y="292" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>G change avec la cellule, pas σ</text>
    </svg>);
}

// carte 2 : étalonner la cellule
export function SvgEtalonCelluleCarte() {
  return (
    <svg viewBox="0 0 400 290" style={stl} role="img" aria-label="Étalonnage de la cellule : on plonge la cellule dans une solution étalon dont la conductivité sigma est écrite sur le flacon, on mesure la conductance G, puis k égale sigma divisée par G.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Étalonner la cellule</text>
      <rect x="10" y="40" width="108" height="112" rx="10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2"/>
      <text x="64" y="64" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>flacon étalon</text><text x="64" y="86" fontSize="16" textAnchor="middle" fill={COL.txt}>σ connue</text>
      <text x="64" y="108" fontSize="16" textAnchor="middle" fill={COL.txt}>écrite sur</text><text x="64" y="128" fontSize="16" textAnchor="middle" fill={COL.txt}>l’étiquette</text>
      <Fleche x1={122} y1={96} x2={146} y2={96} c={COL.gris}/>
      <rect x="150" y="40" width="108" height="112" rx="10" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2"/>
      <text x="204" y="64" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>on mesure</text><text x="204" y="86" fontSize="16" textAnchor="middle" fill={COL.txt}>la conductance</text>
      <text x="204" y="118" fontSize="22" fontWeight="700" textAnchor="middle" fill={COL.bleu}>G</text><text x="204" y="140" fontSize="16" textAnchor="middle" fill={COL.txt}>avec la cellule</text>
      <Fleche x1={262} y1={96} x2={286} y2={96} c={COL.gris}/>
      <rect x="290" y="40" width="100" height="112" rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="2"/>
      <text x="340" y="64" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>on calcule</text>
      <text x="316" y="112" fontSize="22" fontWeight="700" textAnchor="middle" fill={COL.orange}>k =</text><Frac x={358} y={106} num="σ" den="G" size={22} fill={COL.orange}/>
      <text x="200" y="196" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>exemple : σ = 141 mS·m⁻¹ et G = 1,76 mS</text>
      <text x="200" y="222" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>donnent k ≈ 80 m⁻¹</text>
      <text x="200" y="256" fontSize="16" textAnchor="middle" fill={COL.txt}>k est une propriété de la cellule :</text>
      <text x="200" y="278" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>on la mesure une fois, puis on la réutilise</text>
    </svg>);
}

// carte 3 : de G à la concentration (chaîne G → σ → c)
export function SvgChaineCarte() {
  const boite = (x, titre, l1, l2, coul) => <g><rect x={x} y="40" width="112" height="108" rx="10" fill="#f8fafc" stroke={coul} strokeWidth="2.5"/>
    <text x={x + 56} y="64" fontSize="22" fontWeight="700" textAnchor="middle" fill={coul}>{titre}</text><text x={x + 56} y="92" fontSize="16" textAnchor="middle" fill={COL.txt}>{l1}</text><text x={x + 56} y="114" fontSize="16" textAnchor="middle" fill={COL.txt}>{l2}</text></g>;
  return (
    <svg viewBox="0 0 400 296" style={stl} role="img" aria-label="Chaîne de calcul : la conductance G mesurée est multipliée par la constante de cellule k pour donner la conductivité sigma ; sigma est divisée par la somme des conductivités ioniques molaires pour donner la concentration c.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>De G à la concentration c</text>
      {boite(6, 'G', 'conductance', 'mesurée (mS)', COL.bleu)}
      {boite(144, 'σ', 'conductivité', '(mS·m⁻¹)', COL.orange)}
      {boite(282, 'c', 'concentration', '(mmol/L)', COL.vert)}
      <Fleche x1={120} y1={94} x2={140} y2={94} c={COL.gris}/><Fleche x1={258} y1={94} x2={278} y2={94} c={COL.gris}/>
      <text x="64" y="176" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>× k</text>
      <text x="200" y="176" fontSize="16" textAnchor="middle" fill={COL.txt}>σ = k × G</text>
      <text x="340" y="176" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>÷ Σλ</text>
      <text x="200" y="208" fontSize="16" textAnchor="middle" fill={COL.txt}>puis loi de Kohlrausch : σ = Σ λ × c</text>
      <text x="200" y="236" fontSize="16" textAnchor="middle" fill={COL.txt}>exemple : 0,780 mS → 62,4 mS·m⁻¹ → 4,95 mmol/L</text>
      <text x="200" y="268" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>il faut connaître k et les λ, et une solution diluée</text>
    </svg>);
}

// carte 4 : la droite d'étalonnage
export function SvgDroiteCarte() {
  return (
    <svg viewBox="0 0 400 296" style={stl} role="img" aria-label="Droite d’étalonnage : la conductance G est proportionnelle à la concentration c, G égale a fois c, la droite passe par l’origine. On mesure la conductance de la solution à doser, on la lit sur la droite et on en déduit sa concentration.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>La droite d’étalonnage</text>
      <line x1="44" y1="40" x2="44" y2="196" stroke={COL.txt} strokeWidth="2"/><line x1="44" y1="196" x2="300" y2="196" stroke={COL.txt} strokeWidth="2"/>
      <text x="52" y="52" fontSize="17" fontWeight="700" fill={COL.gris}>G</text><text x="300" y="220" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.gris}>c</text>
      <line x1="44" y1="196" x2="290" y2="58" stroke={COL.bleu} strokeWidth="4"/>
      {[[88, 171], [132, 146], [176, 121], [220, 97]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="6" fill={COL.bleu} stroke="#fff" strokeWidth="1.2"/>)}
      <line x1="44" y1="132" x2="168" y2="132" stroke={COL.rouge} strokeWidth="2.5" strokeDasharray="6 5"/><line x1="168" y1="132" x2="168" y2="196" stroke={COL.rouge} strokeWidth="2.5" strokeDasharray="6 5"/>
      <text x="52" y="124" fontSize="16" fontWeight="700" fill={COL.rouge}>G mesurée</text><text x="176" y="218" fontSize="16" fontWeight="700" fill={COL.rouge}>c cherchée</text>
      <text x="304" y="100" fontSize="19" fontWeight="700" fill={COL.bleu}>G = a × c</text>
      <text x="304" y="124" fontSize="16" fill={COL.txt}>a : coefficient</text><text x="304" y="144" fontSize="16" fill={COL.txt}>directeur</text>
      <text x="200" y="252" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.txt}>droite par l’origine : G = 0 si c = 0</text>
      <text x="200" y="276" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>c = G / a : on lit la concentration</text>
    </svg>);
}

// carte 5 : limites de la droite d'étalonnage
export function SvgLimitesCarte() {
  return (
    <svg viewBox="0 0 400 300" style={stl} role="img" aria-label="Au-delà d’environ 10 millimoles par litre, les points d’étalonnage s’écartent de la droite : la loi de Kohlrausch n’est plus valable. Pour doser une solution trop concentrée, on la dilue d’un facteur connu.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>La droite n’est valable que pour c faible</text>
      <line x1="44" y1="40" x2="44" y2="190" stroke={COL.txt} strokeWidth="2"/><line x1="44" y1="190" x2="386" y2="190" stroke={COL.txt} strokeWidth="2"/>
      <text x="52" y="52" fontSize="17" fontWeight="700" fill={COL.gris}>G</text><text x="386" y="214" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.gris}>c</text>
      <rect x="44" y="40" width="70" height="150" fill="#f0fdf4" opacity="0.8"/>
      <line x1="44" y1="190" x2="114" y2="150" stroke={COL.bleu} strokeWidth="4"/><line x1="114" y1="150" x2="370" y2="46" stroke={COL.bleu} strokeWidth="3" strokeDasharray="7 6"/>
      {[[62, 180], [88, 165], [112, 151]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="6" fill={COL.bleu} stroke="#fff" strokeWidth="1.2"/>)}
      {[[170, 128], [250, 96], [340, 76]].map(([x, y]) => <rect key={x} x={x - 6} y={y - 6} width="12" height="12" fill="#fff" stroke={COL.orange} strokeWidth="2.5"/>)}
      <line x1="114" y1="190" x2="114" y2="198" stroke={COL.txt} strokeWidth="2"/>
      <text x="114" y="214" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>10</text>
      <text x="150" y="214" fontSize="16" fill={COL.gris}>mmol/L</text>
      <text x="200" y="244" fontSize="16" textAnchor="middle" fill={COL.txt}>● domaine de validité : points alignés sur la droite</text>
      <text x="200" y="266" fontSize="16" textAnchor="middle" fill={COL.txt}>□ au-delà : les points sont sous la droite</text>
      <text x="200" y="290" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>solution trop concentrée : on la dilue</text>
    </svg>);
}

// carte 6 : démarche du dosage par étalonnage
export function SvgDemarcheCarte() {
  const etape = (y, n, t1, t2) => <g><circle cx="28" cy={y} r="16" fill="#f1f5f9" stroke={COL.txt} strokeWidth="2"/><text x="28" y={y + 6} fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>{n}</text>
    <text x="54" y={y - 3} fontSize="16" fontWeight="700" fill={COL.txt}>{t1}</text><text x="54" y={y + 16} fontSize="16" fill={COL.txt}>{t2}</text></g>;
  return (
    <svg viewBox="0 0 400 300" style={stl} role="img" aria-label="Démarche du dosage par étalonnage en quatre étapes : préparer des étalons de concentrations connues, mesurer leur conductance, tracer la droite G en fonction de c, mesurer la conductance de la solution diluée et lire sa concentration. Même cellule, même soluté, même température.">
      <text x="200" y="22" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.txt}>Doser par étalonnage</text>
      {etape(56, '1', 'préparer des étalons', 'concentrations connues, diluées')}
      {etape(108, '2', 'mesurer G de chaque étalon', 'même cellule, même température')}
      {etape(160, '3', 'tracer G en fonction de c', 'droite par l’origine : G = a × c')}
      {etape(212, '4', 'mesurer G de la solution', 'diluée, puis lire c et multiplier par F')}
      <text x="200" y="270" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.vert}>même cellule, même soluté, même température</text>
      <text x="200" y="291" fontSize="16" textAnchor="middle" fill={COL.txt}>et G de la solution dans la gamme des étalons</text>
    </svg>);
}
