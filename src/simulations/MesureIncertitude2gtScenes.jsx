// ====================================================
//  Scènes (schémas) de la simulation « Mesure : incertitude-type et résultat » (2GT, sim 194).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 18 unités (viewBox de 480 de large).
//  Règle : une scène ne montre jamais la valeur que l'élève doit trouver (paramètre « cache » → « ? »).
// ====================================================
import { COL, fmt } from "./mesureIncertitude2gtModele";

const NB = ' ';
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };

// ---------- axe gradué avec une ou plusieurs lignes de résultats ----------
// lignes : [{ nom, valeurs (série de mesures, facultatif), res (résolution), m (moyenne, trait), u (demi-largeur de la zone), couleur }]
// min, max, pas : axe ; dec : décimales des graduations ; titre : titre de l'axe ; ref : valeur de référence (trait vert) ; refTxt : légende
// mode : 'points' (un rond par mesure, empilés) ou 'barres' (histogramme : un rectangle par valeur lue)
export function SceneAxe({ lignes, min, max, pas, dec = 2, titre, reference = null, refTxt = 'référence', mode = 'points', aria, hauteurLigne = 82, etiquetteBande = null, reserveRef = false }) {
  const x0 = 34, x1 = 456, W = 480, Lw = x1 - x0, X = v => x0 + (v - min) / (max - min) * Lw;
  const top = reference != null || reserveRef ? 34 : 10, hl = hauteurLigne, yAxe = top + lignes.length * hl + 6, H = yAxe + 62;
  const ticks = []; for (let v = min; v <= max + pas / 2; v += pas) ticks.push(Number(v.toFixed(8)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl} role="img" aria-label={aria}>
      {lignes.map((l, i) => {
        const y0 = top + i * hl, yb = y0 + hl - 10, zone = hl - 34;     // yb : bas de la zone des points ; zone : hauteur disponible
        const bandeX = l.u != null && l.m != null ? [X(l.m - l.u), X(l.m + l.u)] : null;
        const bins = {};
        (l.valeurs || []).forEach(v => { const k = Math.round(v / (l.res || 0.01)); bins[k] = (bins[k] || 0) + 1; });
        const cles = Object.keys(bins).map(Number), maxC = Math.max(1, ...cles.map(k => bins[k]));
        const largeurBin = (l.res || 0.01) / (max - min) * Lw;
        return (
          <g key={i}>
            <rect x={x0 - 14} y={y0 + 2} width={Lw + 28} height={hl - 8} rx="6" fill={i % 2 ? '#ffffff' : '#f8fafc'}/>
            {l.nom && <text x={x0 + 6} y={y0 + 20} fontSize="18" fontWeight="700" fill={COL.txt}>{l.nom}</text>}
            {bandeX && <rect x={bandeX[0]} y={y0 + 24} width={Math.max(2, bandeX[1] - bandeX[0])} height={hl - 30} fill={COL.orangeClair} stroke={COL.orange} strokeWidth="1.5" opacity="0.85"/>}
            {bandeX && etiquetteBande && <text x={(bandeX[0] + bandeX[1]) / 2} y={y0 + 20} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.orange}>{etiquetteBande}</text>}
            {mode === 'barres'
              ? cles.map(k => { const unit = Math.min(12, zone / maxC), h = bins[k] * unit, xk = X(k * (l.res || 0.01));
                return <rect key={k} x={xk - largeurBin / 2 + 0.5} y={yb - h} width={Math.max(1.5, largeurBin - 1)} height={h} fill={l.couleur || COL.bleu} stroke="white" strokeWidth="0.8"/>; })
              : cles.map(k => { const r = Math.max(3, Math.min(7.5, largeurBin / 2 - 0.5, zone / (2 * maxC)));
                return Array.from({ length: bins[k] }, (_, j) => <circle key={`${k}-${j}`} cx={X(k * (l.res || 0.01))} cy={yb - r - j * 2 * r} r={r} fill={l.couleur || COL.bleu} stroke="white" strokeWidth="1"/>); })}
            {l.m != null && <g><line x1={X(l.m)} y1={y0 + 26} x2={X(l.m)} y2={yb + 4} stroke={COL.txt} strokeWidth="3"/><polygon points={`${X(l.m) - 6},${yb + 10} ${X(l.m) + 6},${yb + 10} ${X(l.m)},${yb + 3}`} fill={COL.txt}/></g>}
          </g>);
      })}
      {reference != null && <g>
        <line x1={X(reference)} y1={top - 4} x2={X(reference)} y2={yAxe} stroke={COL.vert} strokeWidth="3" strokeDasharray="6 5"/>
        <text x={Math.min(Math.max(X(reference), 96), W - 96)} y={top - 10} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.vert}>{refTxt}</text>
      </g>}
      <line x1={x0} y1={yAxe} x2={x1} y2={yAxe} stroke={COL.txt} strokeWidth="2.5"/>
      {ticks.map(v => <g key={v}><line x1={X(v)} y1={yAxe} x2={X(v)} y2={yAxe + 8} stroke={COL.txt} strokeWidth="2"/><text x={X(v)} y={yAxe + 28} textAnchor="middle" fontSize="18" fill={COL.txt}>{fmt(v, dec)}</text></g>)}
      <text x={W / 2} y={yAxe + 54} textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.gris}>{titre}</text>
    </svg>);
}

// ---------- étape « u = s ÷ √n » : trois cases ----------
export function SceneCalculU({ n, s, unite, inconnu = true, u = null }) {
  const bloc = (x, titre, val, c, fond) => (
    <g>
      <rect x={x} y="22" width="140" height="118" rx="12" fill={fond} stroke={c} strokeWidth="2.5"/>
      <text x={x + 70} y="52" textAnchor="middle" fontSize="18" fontWeight="700" fill={c}>{titre}</text>
      <text x={x + 70} y="108" textAnchor="middle" fontSize="28" fontWeight="700" fill={COL.txt}>{val}</text>
    </g>);
  return (
    <svg viewBox="0 0 480 196" style={stl} role="img" aria-label={`Une série de ${n} mesures a un écart-type s de ${fmt(s, 2)} ${unite}. L'incertitude-type u est à calculer.`}>
      {bloc(14, 'nombre de mesures', `n = ${n}`, COL.bleu, '#eff6ff')}
      {bloc(170, 'dispersion', `s = ${fmt(s, 2)}${NB}${unite}`, COL.bleu, '#eff6ff')}
      {bloc(326, 'incertitude-type', inconnu ? `u = ?` : `u = ${fmt(u, 2)}${NB}${unite}`, COL.orange, '#fffbeb')}
      <text x="162" y="88" textAnchor="middle" fontSize="26" fontWeight="700" fill={COL.gris}>→</text>
      <text x="318" y="88" textAnchor="middle" fontSize="26" fontWeight="700" fill={COL.gris}>→</text>
      <text x="240" y="176" textAnchor="middle" fontSize="18" fill={COL.gris}>s mesure l’éparpillement des mesures</text>
    </svg>);
}

// ---------- étape « plus de mesures » : deux barres ----------
export function SceneNombre({ ex = { n: [4, 16], u: [0.06, 0.03], unite: 's' } }) {
  const Hmax = 120, y0 = 150, hs = ex.u.map(u => u / ex.u[0] * Hmax);
  return (
    <svg viewBox="0 0 480 232" style={stl} role="img" aria-label={`Exemple : avec ${ex.n[0]} mesures, u vaut ${fmt(ex.u[0], 2)} ${ex.unite} ; avec ${ex.n[1]} mesures, quatre fois plus, u vaut ${fmt(ex.u[1], 2)} ${ex.unite}, deux fois plus petite.`}>
      {[0, 1].map(i => { const x = 40 + i * 230; return (
        <g key={i}>
          <rect x={x} y={y0 - hs[i]} width="150" height={hs[i]} rx="6" fill={i ? COL.vert : COL.orange} opacity="0.85"/>
          <text x={x + 75} y={y0 - hs[i] - 10} textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.txt}>u = {fmt(ex.u[i], 2)}{NB}{ex.unite}</text>
          <text x={x + 75} y={y0 + 26} textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.txt}>n = {ex.n[i]} mesures</text>
        </g>); })}
      <line x1="30" y1={y0} x2="450" y2={y0} stroke={COL.txt} strokeWidth="2.5"/>
      <text x="240" y="66" textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.rouge}>× 4 mesures</text>
      <path d="M190,76 H290 M278,68 L290,76 L278,84" stroke={COL.rouge} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="240" y="216" textAnchor="middle" fontSize="18" fill={COL.gris}>u deux fois plus petite</text>
    </svg>);
}

// ---------- étape « arrondir u » : un nombre avec son premier chiffre qui compte ----------
// texte : u écrit ; indice : position (0 = premier caractère) du premier chiffre non nul
export function SceneArrondi({ texte, rang, unite, cache = false }) {
  const cw = 24, w = texte.length * cw, uw = unite ? 14 + unite.length * 18 : 0, tot = 4 * cw + w + uw, x = (480 - tot) / 2;
  return (
    <svg viewBox="0 0 480 190" style={stl} role="img" aria-label={`La calculatrice affiche u = ${texte} ${unite}. Le premier chiffre non nul est repéré en orange : c’est lui que l’on garde.`}>
      <text x="240" y="32" textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.gris}>La calculatrice affiche</text>
      <rect x={x - 20} y="46" width={tot + 40} height="74" rx="10" fill="#0f172a"/>
      <text x={x} y="98" fontSize="40" fontWeight="700" fill="#e2e8f0" style={{ fontFamily: 'monospace' }}>u = </text>
      {[...texte].map((c, i) => <text key={i} x={x + 4 * cw + i * cw} y="98" fontSize="40" fontWeight="700" fill={i === rang ? '#fb923c' : '#94a3b8'} style={{ fontFamily: 'monospace' }}>{c}</text>)}
      {unite && <text x={x + 4 * cw + w + 8} y="98" fontSize="30" fontWeight="700" fill="#e2e8f0" style={{ fontFamily: 'monospace' }}>{unite}</text>}
      <path d={`M${x + 4 * cw + rang * cw + cw / 2},124 V146`} stroke={COL.orange} strokeWidth="3" fill="none"/>
      <polygon points={`${x + 4 * cw + rang * cw + cw / 2 - 7},142 ${x + 4 * cw + rang * cw + cw / 2 + 7},142 ${x + 4 * cw + rang * cw + cw / 2},126`} fill={COL.orange}/>
      <text x="240" y="176" textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.orange}>{cache ? '' : 'premier chiffre qui compte'}</text>
    </svg>);
}

// ---------- étape « écrire le résultat » : trois cases ----------
export function SceneEcriture({ m, u, unite, sym }) {
  return (
    <svg viewBox="0 0 480 196" style={stl} role="img" aria-label={`Données : moyenne ${m} ${unite}, incertitude-type ${u} ${unite}. Le résultat est à écrire.`}>
      <rect x="14" y="16" width="214" height="72" rx="12" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2.5"/>
      <text x="121" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.bleu}>moyenne (calculatrice)</text>
      <text x="121" y="76" textAnchor="middle" fontSize="26" fontWeight="700" fill={COL.txt}>{m}{NB}{unite}</text>
      <rect x="252" y="16" width="214" height="72" rx="12" fill="#fffbeb" stroke={COL.orange} strokeWidth="2.5"/>
      <text x="359" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.orange}>incertitude-type u</text>
      <text x="359" y="76" textAnchor="middle" fontSize="26" fontWeight="700" fill={COL.txt}>{u}{NB}{unite}</text>
      <path d="M121,94 V118 M359,94 V118 M121,118 H359" stroke={COL.gris} strokeWidth="2.5" fill="none"/>
      <path d="M240,118 V132 M233,126 L240,134 L247,126" stroke={COL.gris} strokeWidth="2.5" fill="none"/>
      <rect x="90" y="140" width="300" height="46" rx="12" fill="white" stroke={COL.vert} strokeWidth="2.5" strokeDasharray="7 5"/>
      <text x="240" y="172" textAnchor="middle" fontSize="24" fontWeight="700" fill={COL.vert}>{sym} = ?</text>
    </svg>);
}

// ---------- bilan : la chaîne complète ----------
export function SceneBilanMesure() {
  const lignes = [['1', 'mesures répétées', 'moyenne et écart-type s'], ['2', 'incertitude-type', 'u = s ÷ √n'], ['3', 'arrondir', 'u : 1 chiffre ; valeur : même rang'], ['4', 'écrire', '(valeur ± u) unité'], ['5', 'comparer', 'référence dans l’intervalle ?']];
  return (
    <svg viewBox="0 0 480 330" style={stl} role="img" aria-label="Les cinq étapes : mesures répétées, incertitude-type, arrondir, écrire, comparer à la référence.">
      {lignes.map(([n, t, d], i) => { const y = 12 + i * 62; return (
        <g key={n}>
          <rect x="14" y={y} width="452" height="54" rx="10" fill={i % 2 ? '#fffbeb' : '#eff6ff'} stroke={i % 2 ? COL.orange : COL.bleu} strokeWidth="2"/>
          <circle cx="42" cy={y + 27} r="16" fill={i % 2 ? COL.orange : COL.bleu}/><text x="42" y={y + 34} textAnchor="middle" fontSize="20" fontWeight="700" fill="white">{n}</text>
          <text x="70" y={y + 24} fontSize="18" fontWeight="700" fill={COL.txt}>{t}</text>
          <text x="70" y={y + 46} fontSize="18" fill={COL.txt}>{d}</text>
        </g>); })}
    </svg>);
}
