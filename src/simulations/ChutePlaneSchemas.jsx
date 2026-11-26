// Schémas de la simulation 269 (figure : v0 = 20 m/s, α = 40°) : trajectoire d'un projectile en chute libre, cartes « À retenir ».
import { C, Fl, VT } from './vecteursVASchemas';
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const T = ({ x, y, children, c = C.encre, s = 15, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" style={{ ...stl, maxWidth: 420, border: `1px solid ${C.clair}` }} aria-label={aria}>{children}</svg>;
const SOL = 160, X0 = 36, D = 320, HP = 67;           // parabole 20 m/s, 40° : H/D = tan α / 4
const parab = <path d={`M ${X0} ${SOL} Q ${X0 + D / 2} ${SOL - 2 * HP} ${X0 + D} ${SOL}`} fill="none" stroke={C.gris} strokeWidth="2.6" strokeDasharray="7 5"/>;
const Sol = () => <line x1="10" y1={SOL} x2="392" y2={SOL} stroke={C.gris} strokeWidth="2.6"/>;

// Scène du parcours : lancer à 40°, options : composantes de v0, accélération g, sommet, portée
export function SceneTrajet({ composantes = false, accel = false, sommet = false, portee = false, maxWidth = 460, aria }) {
  return (
    <svg viewBox="0 0 400 220" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || 'Un projectile lancé du sol avec une vitesse initiale inclinée de 40 degrés au-dessus de l’horizontale décrit une trajectoire en forme de parabole et retombe au sol.'}>
      <Sol/>{parab}
      <circle cx={X0} cy={SOL} r="7" fill="#dbeafe" stroke={C.bleu} strokeWidth="2.4"/>
      <Fl x1={X0} y1={SOL} x2={X0 + 74} y2={SOL - 62} c={C.bleu} w={3.8}/><VT x={X0 + 40} y={SOL - 58} t="v" i="0" c={C.bleu} s={19} halo/>
      <path d={`M ${X0 + 34} ${SOL} A 34 34 0 0 0 ${X0 + 26} ${SOL - 22}`} fill="none" stroke={C.gris} strokeWidth="2"/><T x={X0 + 40} y={SOL - 6} s={15} w={700} c={C.gris}>α</T>
      {composantes && <g><Fl x1={X0} y1={SOL} x2={X0 + 74} y2={SOL} c={C.vert} w={3.4} dash="6 4"/><Fl x1={X0 + 74} y1={SOL} x2={X0 + 74} y2={SOL - 62} c={C.orange} w={3.4} dash="6 4"/>
        <T x={X0 + 38} y={SOL + 22} s={15} w={700} c={C.vert} a="middle">v₀ₓ</T><T x={X0 + 84} y={SOL - 26} s={15} w={700} c={C.orange}>v₀ᵧ</T></g>}
      {sommet && <g><circle cx={X0 + D / 2} cy={SOL - HP} r="6" fill="#fff" stroke={C.rouge} strokeWidth="2.6"/><line x1={X0 + D / 2} y1={SOL - HP + 7} x2={X0 + D / 2} y2={SOL - 4} stroke={C.rouge} strokeWidth="1.8" strokeDasharray="4 4"/><T x={X0 + D / 2} y={SOL - HP - 12} s={15} w={800} c={C.rouge} a="middle">sommet S</T></g>}
      {accel && <g><Fl x1={X0 + D / 2 + 70} y1={SOL - 100} x2={X0 + D / 2 + 70} y2={SOL - 56} c={C.violet} w={4}/><VT x={X0 + D / 2 + 80} y={SOL - 72} t="g" c={C.violet} s={19} halo/></g>}
      {portee && <g><line x1={X0} y1={SOL + 22} x2={X0 + D} y2={SOL + 22} stroke={C.gris} strokeWidth="1.8"/><line x1={X0} y1={SOL + 14} x2={X0} y2={SOL + 30} stroke={C.gris} strokeWidth="1.8"/><line x1={X0 + D} y1={SOL + 14} x2={X0 + D} y2={SOL + 30} stroke={C.gris} strokeWidth="1.8"/><T x={X0 + D / 2} y={SOL + 46} s={16} w={800} c={C.gris} a="middle">portée D</T></g>}
    </svg>);
}
// Carte : accélération et composantes de la vitesse
export function SvgLoisCarte() {
  return (
    <Cadre h={208} aria="Chute libre : seule force, le poids ; l'accélération vaut g vers le bas. La composante horizontale de la vitesse reste constante ; la composante verticale diminue de g par seconde.">
      <Sol/>{parab}
      {[0.0, 0.25, 0.5, 0.75, 1.0].map((u, k) => { const x = X0 + D * u, y = SOL - 4 * HP * u * (1 - u); return <g key={k}><circle cx={x} cy={y} r="4.5" fill={C.bleu}/><Fl x1={x} y1={y} x2={x + 38} y2={y - 4 * HP * (1 - 2 * u) * 38 / D * 0.9} c={C.bleu} w={2.6} tete={7}/></g>; })}
      <Fl x1="316" y1="50" x2="316" y2="92" c={C.violet} w={4}/><VT x="326" y="76" t="a" c={C.violet} s={18} halo/><T x="262" y="38" s={13.5} w={700} c={C.violet}>a = g vers le bas</T>
      <T x="200" y="190" a="middle" s={14} w={700} c={C.encre}>v_x constante   ·   v_y diminue de g chaque seconde</T>
    </Cadre>);
}
// Carte : sommet, durée, portée
export function SvgSommetCarte() {
  return (
    <Cadre h={214} aria="Au sommet de la trajectoire la composante verticale de la vitesse est nulle. La durée de la montée vaut v0y divisée par g, la hauteur maximale v0y au carré divisé par deux g, la portée vx fois la durée totale du vol.">
      <Sol/>{parab}
      <circle cx={X0 + D / 2} cy={SOL - HP} r="6" fill="#fff" stroke={C.rouge} strokeWidth="2.6"/><line x1={X0 + D / 2} y1={SOL - HP + 7} x2={X0 + D / 2} y2={SOL - 4} stroke={C.rouge} strokeWidth="1.8" strokeDasharray="4 4"/>
      <T x={X0 + D / 2} y={SOL - HP - 12} s={14.5} w={800} c={C.rouge} a="middle">S : v_y = 0</T>
      <T x="200" y="22" s={14.5} w={800} c={C.violet} a="middle">v_y = v₀ᵧ − g t</T>
      <T x="200" y="184" a="middle" s={13.5} w={700} c={C.encre}>t_S = v₀ᵧ ÷ g   ·   H = v₀ᵧ² ÷ (2 g)</T>
      <T x="200" y="203" a="middle" s={13.5} w={700} c={C.encre}>durée du vol = 2 t_S   ·   D = v₀ₓ × 2 t_S</T>
    </Cadre>);
}
// Carte : effet de l'angle, mêmes vitesses initiales
export function SvgAngleCarte() {
  const arc = (D2, H2, c, dash) => <path d={`M ${X0} 150 Q ${X0 + D2 / 2} ${150 - 2 * H2} ${X0 + D2} 150`} fill="none" stroke={c} strokeWidth="3" strokeDasharray={dash}/>;
  return (
    <Cadre h={206} aria="À même vitesse initiale, les angles complémentaires, par exemple 30 et 60 degrés, donnent la même portée ; la portée est maximale pour 45 degrés quand le projectile revient à la hauteur de départ.">
      <line x1="10" y1="150" x2="392" y2="150" stroke={C.gris} strokeWidth="2.6"/>
      {arc(320, 40, C.bleu)}{arc(320, 136, C.orange, "8 5")}{arc(320, 80, C.vert)}
      <T x="40" y="40" s={13.5} w={800} c={C.orange}>60°</T><T x="40" y="104" s={13.5} w={800} c={C.vert}>45° : portée maximale</T><T x="320" y="128" s={13.5} w={800} c={C.bleu}>30°</T>
      <T x="200" y="176" a="middle" s={14} w={700} c={C.encre}>30° et 60° : même portée (angles complémentaires)</T>
      <T x="200" y="196" a="middle" s={14} w={700} c={C.encre}>la masse ne change pas la trajectoire</T>
    </Cadre>);
}
