// Schémas de la simulation 267 : armatures planes, champ et force, cartes « À retenir ».
import { C, Fl, VT } from './vecteursVASchemas';
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const T = ({ x, y, children, c = C.encre, s = 15, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" style={{ ...stl, maxWidth: 420, border: `1px solid ${C.clair}` }} aria-label={aria}>{children}</svg>;

// Deux armatures verticales (+ à gauche, − à droite) ; options : tension, distance, flèche E, particule (signe) et sa force
export function SceneArmatures({ U = null, d = null, champE = true, q = 0, force = false, maxWidth = 460, aria }) {
  const xa = 100, xb = 300, y0 = 36, y1 = 160;
  const signes = (x, s) => [58, 82, 106, 130, 154].map(y => <text key={y} x={x} y={y + 5} textAnchor="middle" fontSize="18" fontWeight="800" fill={s > 0 ? C.rouge : C.bleu}>{s > 0 ? '+' : '−'}</text>);
  return (
    <svg viewBox="0 0 400 220" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || `Deux armatures planes parallèles, l'armature de gauche chargée positivement et celle de droite négativement${U ? `, tension ${U}` : ''}${d ? `, distance ${d}` : ''}. Le champ électrostatique entre elles est uniforme et dirigé de la gauche vers la droite.`}>
      <rect x={xa - 9} y={y0} width="9" height={y1 - y0} rx="2" fill="#fecaca" stroke={C.rouge} strokeWidth="2"/><rect x={xb} y={y0} width="9" height={y1 - y0} rx="2" fill="#bfdbfe" stroke={C.bleu} strokeWidth="2"/>
      {signes(xa - 22, 1)}{signes(xb + 22, -1)}
      {champE && [64, 98, 132].map(y => <Fl key={y} x1={xa + 14} y1={y} x2={xb - 14} y2={y} c={C.bleu} w={2.4} tete={8}/>)}
      {champE && <VT x={200} y={52} t="E" c={C.bleu} s={18} a="middle" halo/>}
      {q !== 0 && <g><circle cx={200} cy={98} r="14" fill={q > 0 ? '#fee2e2' : '#dbeafe'} stroke={q > 0 ? C.rouge : C.bleu} strokeWidth="2.4"/><text x="200" y="104" textAnchor="middle" fontSize="18" fontWeight="800" fill={q > 0 ? C.rouge : C.bleu}>{q > 0 ? '+' : '−'}</text></g>}
      {q !== 0 && force && (q > 0 ? <Fl x1={216} y1={98} x2={266} y2={98} c={C.orange} w={4}/> : <Fl x1={184} y1={98} x2={134} y2={98} c={C.orange} w={4}/>)}
      {q !== 0 && force && <VT x={q > 0 ? 241 : 159} y={88} t="F" c={C.orange} s={18} a="middle" halo/>}
      {d && <g><line x1={xa} y1={y1 + 20} x2={xb} y2={y1 + 20} stroke={C.gris} strokeWidth="1.6"/><line x1={xa} y1={y1 + 12} x2={xa} y2={y1 + 28} stroke={C.gris}/><line x1={xb} y1={y1 + 12} x2={xb} y2={y1 + 28} stroke={C.gris}/><T x={200} y={y1 + 44} a="middle" s={16} w={700} c={C.gris}>d = {d}</T></g>}
      {U && <T x={200} y={22} a="middle" s={16} w={700} c={C.rouge}>U = {U}</T>}
    </svg>);
}

export function SvgChampCarte() {
  return (
    <Cadre h={200} aria="Entre deux armatures planes parallèles, le champ électrostatique est uniforme, perpendiculaire aux armatures, dirigé de l'armature positive vers l'armature négative, de valeur E = U ÷ d.">
      <rect x="70" y="20" width="9" height="110" rx="2" fill="#fecaca" stroke={C.rouge} strokeWidth="2"/><rect x="320" y="20" width="9" height="110" rx="2" fill="#bfdbfe" stroke={C.bleu} strokeWidth="2"/>
      {[42, 75, 108].map(y => <Fl key={y} x1="92" y1={y} x2="300" y2={y} c={C.bleu} w={2.6}/>)}
      <T x="60" y="78" a="end" s={20} w={800} c={C.rouge}>+</T><T x="340" y="78" a="start" s={22} w={800} c={C.bleu}>−</T>
      <T x="200" y="32" a="middle" s={14} c={C.gris}>champ uniforme : même E partout</T>
      <line x1="74" y1="148" x2="324" y2="148" stroke={C.gris} strokeWidth="1.6"/><T x="200" y="168" a="middle" s={15} c={C.gris}>distance d</T>
      <T x="200" y="192" a="middle" s={18} w={700}>E = U ÷ d  (V/m)</T>
    </Cadre>);
}
export function SvgForceCarte() {
  return (
    <Cadre h={206} aria="La force sur une particule de charge q est F = q E : de même sens que le champ pour une charge positive, de sens opposé pour une charge négative ; sa valeur est la valeur absolue de q fois E.">
      <rect x="20" y="14" width="360" height="84" rx="8" fill="#fef2f2" stroke={C.rouge}/>
      <circle cx="120" cy="56" r="13" fill="#fee2e2" stroke={C.rouge} strokeWidth="2"/><T x="120" y="62" a="middle" s={18} w={800} c={C.rouge}>+</T>
      <Fl x1="138" y1="56" x2="204" y2="56" c={C.orange} w={4}/><T x="170" y="44" a="middle" s={15} w={700} c={C.orange}>F</T><T x="222" y="52" s={15}>q &gt; 0 : F de même sens que E</T>
      <rect x="20" y="108" width="360" height="84" rx="8" fill="#eff6ff" stroke={C.bleu}/>
      <circle cx="280" cy="150" r="13" fill="#dbeafe" stroke={C.bleu} strokeWidth="2"/><T x="280" y="156" a="middle" s={20} w={800} c={C.bleu}>−</T>
      <Fl x1="262" y1="150" x2="196" y2="150" c={C.orange} w={4}/><T x="230" y="138" a="middle" s={15} w={700} c={C.orange}>F</T><T x="34" y="146" s={15}>q &lt; 0 : F de sens</T><T x="34" y="166" s={15}>opposé à E</T>
    </Cadre>);
}
export function SvgBilanElecCarte() {
  return (
    <Cadre h={210} aria="Deux relations : E = U ÷ d relie le champ à la tension et à la distance entre les armatures ; F = |q| × E donne la valeur de la force sur une particule chargée.">
      <rect x="14" y="12" width="372" height="88" rx="8" fill="#eff6ff" stroke={C.bleu}/><T x="26" y="38" s={16} w={700} c={C.bleu}>Le champ : E = U ÷ d</T><T x="26" y="64" s={14}>U en volts, d en mètres, E en V/m</T><T x="26" y="86" s={14} c={C.gris}>double d : E divisé par 2</T>
      <rect x="14" y="110" width="372" height="90" rx="8" fill="#fff7ed" stroke={C.orange}/><T x="26" y="136" s={16} w={700} c={C.orange}>La force : F = |q| × E</T><T x="26" y="162" s={14}>q en coulombs, E en V/m, F en newtons</T><T x="26" y="184" s={14} c={C.gris}>q &gt; 0 : sens de E ; q &lt; 0 : sens opposé</T>
    </Cadre>);
}
