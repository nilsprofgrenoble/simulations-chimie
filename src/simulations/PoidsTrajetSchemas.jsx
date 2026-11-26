// Schémas de la simulation 250 (travail du poids selon le trajet) : scène du rail et cartes « À retenir ».
// Règles : police ≥ 14 dans un viewBox de 400 de large, tout le texte dans le viewBox, aucun résultat (signe ou valeur d'un travail) dans la scène.
import { PTS, chemin, zDe, pente } from './poidsTrajetModele';
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', violet: '#6d28d9', ciel: '#dbeafe', jaune: '#fde68a' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 220, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Txt = ({ x, y, t, c = COL.encre, size = 15, w = 700, anchor = 'middle' }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c} {...halo}>{t}</text>;
const Fleche = ({ x1, y1, x2, y2, c = COL.bleu, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 0.8, d = 0.5;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(a)} y2={y2 - (L - 2) * Math.sin(a)} stroke={c} strokeWidth={w}/><polygon points={p} fill={c}/></g>;
};
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',');

// ═════════ Scène : le rail, ses cinq points, le trajet choisi et le chariot avec ses forces ═════════
const OX = 22, SC = 79, OY = 182;                      // échelle (px/m), origine x, y de l'altitude 0
const px = x => OX + x * SC, py = z => OY - z * SC;
const COTE = { A: 'haut', B: 'bas', C: 'haut', D: 'bas', E: 'haut' };      // place de l'étiquette (au-dessus ou sous le point)
export function SceneRail({ dep = 'A', arr = null, u = 0, forces = true, frott = false, altitudes = true, chariot = true }) {
  let profil = ''; for (let i = 0; i <= 140; i++) { const x = PTS[0].x + (PTS[PTS.length - 1].x - PTS[0].x) * i / 140; profil += `${i ? 'L' : 'M'}${px(x).toFixed(1)},${py(zDe(x)).toFixed(1)} `; }
  const traj = arr && arr !== dep ? chemin(dep, arr) : null;
  const sens = traj ? Math.sign(PTS.find(p => p.id === arr).x - PTS.find(p => p.id === dep).x) : 1;
  // position du chariot
  const xs = traj ? traj[Math.round(u * (traj.length - 1))].x : PTS.find(p => p.id === dep).x;
  const zs = zDe(xs), cx = px(xs), cy = py(zs), th = Math.atan(pente(xs));         // th > 0 : le rail monte vers la droite
  const deg = -th * 180 / Math.PI;
  const aT = sens;                                                                    // le chariot avance dans le sens de x croissant (+1) ou décroissant (−1)
  const trace = traj ? traj.filter((_, i) => i % 3 === 0 || i === traj.length - 1).map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.z).toFixed(1)}`).join(' ') : '';
  const fin = traj ? traj[traj.length - 1] : null, av = traj ? traj[traj.length - 4] : null;
  return (
    <Fond h={236} label={`Schéma : un chariot sur un rail aux points A à E${arr ? `, trajet de ${dep} à ${arr}` : ''}. Le poids est vertical vers le bas, la réaction du rail est perpendiculaire au rail${frott ? ' et le frottement est opposé au mouvement' : ''}.`}>
      <line x1={px(-0.1)} y1={py(0)} x2={px(4.6)} y2={py(0)} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5"/>
      <Txt x={px(4.6)} y={py(0) + 16} t="z = 0" c={COL.gris} size={14} w={600} anchor="end"/>
      <path d={profil} fill="none" stroke={COL.gris} strokeWidth="4" strokeLinecap="round"/>
      {traj && <path d={trace} fill="none" stroke={COL.violet} strokeWidth="6" strokeLinecap="round" opacity="0.55"/>}
      {traj && <Fleche x1={px(av.x)} y1={py(av.z)} x2={px(fin.x)} y2={py(fin.z)} c={COL.violet} w={4}/>}
      {PTS.map(p => <g key={p.id}>
        <circle cx={px(p.x)} cy={py(p.z)} r="4.5" fill="white" stroke={COL.encre} strokeWidth="2.5"/>
        <Txt x={px(p.x) + (p.id === 'A' ? -10 : p.id === 'E' ? 10 : 0)} y={COTE[p.id] === 'haut' ? py(p.z) - 12 : py(p.z) + 38} t={altitudes ? `${p.id} · ${fr(p.z)} m` : p.id} c={COL.encre} size={14} anchor={p.id === 'A' ? 'start' : p.id === 'E' ? 'end' : 'middle'}/>
      </g>)}
      {chariot && <g transform={`translate(${cx},${cy}) rotate(${deg})`}>
        <rect x="-17" y="-26" width="34" height="18" rx="4" fill={COL.ciel} stroke={COL.bleu} strokeWidth="2.5"/>
        <circle cx="-9" cy="-4" r="4.5" fill="white" stroke={COL.encre} strokeWidth="2.5"/><circle cx="9" cy="-4" r="4.5" fill="white" stroke={COL.encre} strokeWidth="2.5"/>
      </g>}
      {chariot && forces && (() => {
        const ox = cx - Math.sin(th) * 17, oy = cy - Math.cos(th) * 17;                 // point d'application : centre du chariot
        const mx = aT * Math.cos(th), my = -aT * Math.sin(th);                           // sens du mouvement à l'écran
        const rx = ox - Math.sin(th) * 36, ry = oy - Math.cos(th) * 36;                  // réaction : perpendiculaire au rail, vers le haut
        const fx = ox - mx * 38, fy = oy - my * 38;                                      // frottement : opposé au mouvement
        return <g>
          <Fleche x1={ox} y1={oy} x2={ox} y2={oy + 38} c={COL.rouge} w={3.5}/><Txt x={ox + 9} y={oy + 40} t="P" c={COL.rouge} size={15} anchor="start"/>
          <Fleche x1={ox} y1={oy} x2={rx} y2={ry} c={COL.vert} w={3.5}/><Txt x={rx + (Math.sin(th) > 0.2 ? -9 : 9)} y={ry - 4} t="R" c={COL.vert} size={15} anchor={Math.sin(th) > 0.2 ? 'end' : 'start'}/>
          {frott && <g><Fleche x1={ox} y1={oy} x2={fx} y2={fy} c={COL.orange} w={3.5}/><Txt x={fx + (mx > 0 ? -8 : 8)} y={fy - 6} t="f" c={COL.orange} size={15} anchor={mx > 0 ? 'end' : 'start'}/></g>}
        </g>;
      })()}
    </Fond>);
}

// ═════════ Cartes « À retenir » ═════════
// Carte 1 : travail du poids selon la variation d'altitude
export function SvgPoids() {
  return (
    <Fond h={210} label="Schéma : le travail du poids vaut m g fois la différence entre l'altitude de départ et celle d'arrivée. Il est moteur si le système descend, résistant s'il monte, nul s'il garde la même altitude. Exemple : 1,0 kg qui descend de 2,0 m reçoit environ 20 joules.">
      <rect x="40" y="12" width="320" height="42" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2.5"/>
      <Txt x={200} y={39} t="W(P) = m × g × (z départ − z arrivée)" c={COL.rouge} size={16} w={800}/>
      <rect x="12" y="68" width="120" height="82" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/>
      <Txt x={72} y={92} t="il descend" c={COL.gris} size={14.5} w={600}/><Txt x={72} y={118} t="moteur" c={COL.vert} size={17} w={800}/><Txt x={72} y={140} t="W(P) > 0" c={COL.vert} size={15}/>
      <rect x="140" y="68" width="120" height="82" rx="10" fill="#fef2f2" stroke={COL.rouge} strokeWidth="2.5"/>
      <Txt x={200} y={92} t="il monte" c={COL.gris} size={14.5} w={600}/><Txt x={200} y={118} t="résistant" c={COL.rouge} size={17} w={800}/><Txt x={200} y={140} t="W(P) < 0" c={COL.rouge} size={15}/>
      <rect x="268" y="68" width="120" height="82" rx="10" fill="#f8fafc" stroke={COL.gris} strokeWidth="2.5"/>
      <Txt x={328} y={92} t="même altitude" c={COL.gris} size={14.5} w={600}/><Txt x={328} y={118} t="nul" c={COL.gris} size={17} w={800}/><Txt x={328} y={140} t="W(P) = 0" c={COL.gris} size={15}/>
      <Txt x={200} y={180} t="ex. : 1,0 kg qui descend de 2,0 m → W(P) ≈ +20 J" c={COL.encre} size={14.5}/>
      <Txt x={200} y={200} t="g = 9,8 N/kg" c={COL.gris} size={14} w={600}/>
    </Fond>);
}
// Carte 2 : une force perpendiculaire à la trajectoire ne travaille pas
export function SvgPerp() {
  return (
    <Fond h={200} label="Schéma : sur un rail incliné, la réaction est perpendiculaire à la trajectoire : son produit scalaire avec chaque déplacement élémentaire est nul, donc son travail est nul.">
      <line x1="30" y1="150" x2="370" y2="84" stroke={COL.gris} strokeWidth="4" strokeLinecap="round"/>
      <circle cx="200" cy="117" r="6" fill={COL.encre}/>
      <Fleche x1={200} y1={117} x2={248} y2={108} c={COL.bleu} w={3.5}/><Txt x={266} y={110} t="dl" c={COL.bleu} size={16}/>
      <Fleche x1={200} y1={117} x2={185} y2={64} c={COL.vert} w={3.5}/><Txt x={170} y={58} t="R" c={COL.vert} size={16}/>
      <path d="M 211 115 L 214 104 L 203 101" fill="none" stroke={COL.gris} strokeWidth="2"/>
      <Txt x={200} y={30} t="R ⊥ trajectoire" c={COL.vert} size={17} w={800}/>
      <Txt x={200} y={178} t="R · dl = 0 à chaque instant → W(R) = 0" c={COL.encre} size={15}/>
    </Fond>);
}
// Carte 3 : le travail du poids ne dépend pas du trajet
export function SvgIndep() {
  return (
    <Fond h={214} label="Schéma : deux trajets différents entre les mêmes points de départ et d'arrivée ont le même travail du poids ; un trajet qui revient au point de départ a un travail du poids nul.">
      <Txt x={200} y={26} t="même départ, même arrivée : même W(P)" c={COL.violet} size={16} w={800}/>
      <line x1="40" y1="140" x2="360" y2="140" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5"/>
      <path d="M 40 70 C 120 70, 150 140, 360 140" fill="none" stroke={COL.violet} strokeWidth="4" strokeLinecap="round"/>
      <path d="M 40 70 C 150 72, 250 96, 360 140" fill="none" stroke={COL.bleu} strokeWidth="4" strokeLinecap="round" strokeDasharray="1 9"/>
      <circle cx="40" cy="70" r="6" fill="white" stroke={COL.encre} strokeWidth="3"/><circle cx="360" cy="140" r="6" fill="white" stroke={COL.encre} strokeWidth="3"/>
      <Txt x={40} y={56} t="départ" c={COL.encre} size={15}/><Txt x={360} y={166} t="arrivée" c={COL.encre} size={15}/>
      <Txt x={200} y={196} t="départ = arrivée (trajet fermé) → W(P) = 0" c={COL.encre} size={15}/>
    </Fond>);
}
// Carte 4 : poids (changement de forme) et frottement (dissipation)
export function SvgBilan() {
  return (
    <Fond h={222} label="Schéma : le travail du poids change de signe selon le sens du mouvement et correspond à un changement de forme de l'énergie ; le travail du frottement est toujours résistant et correspond à une énergie dissipée.">
      <rect x="12" y="14" width="184" height="148" rx="10" fill="white" stroke={COL.rouge} strokeWidth="2.5"/>
      <Txt x={104} y={40} t="poids" c={COL.rouge} size={17} w={800}/>
      <Txt x={104} y={68} t="signe selon le sens :" c={COL.gris} size={14} w={600}/><Txt x={104} y={88} t="moteur ou résistant" c={COL.encre} size={14.5}/>
      <Txt x={104} y={118} t="Ec ⇄ Epp" c={COL.rouge} size={16} w={800}/><Txt x={104} y={142} t="changement de forme" c={COL.gris} size={14} w={600}/>
      <rect x="204" y="14" width="184" height="148" rx="10" fill="white" stroke={COL.orange} strokeWidth="2.5"/>
      <Txt x={296} y={40} t="frottement" c={COL.orange} size={17} w={800}/>
      <Txt x={296} y={68} t="s’oppose toujours" c={COL.gris} size={14} w={600}/><Txt x={296} y={88} t="au mouvement : résistant" c={COL.encre} size={14.5}/>
      <Txt x={296} y={118} t="énergie dissipée" c={COL.orange} size={16} w={800}/><Txt x={296} y={142} t="non récupérable" c={COL.gris} size={14} w={600}/>
      <Txt x={200} y={196} t="aller-retour : W(P) = 0, W(f) < 0" c={COL.encre} size={15}/>
    </Fond>);
}
