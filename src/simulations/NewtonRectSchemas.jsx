// Schémas de la simulation 268 : chariot sur un rail, forces, cartes « À retenir ».
import { C, Fl, VT } from './vecteursVASchemas';
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: '#fff', borderRadius: 8 };
const T = ({ x, y, children, c = C.encre, s = 15, w = 400, a = 'start' }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Cadre = ({ h, aria, children }) => <svg viewBox={`0 0 400 ${h}`} role="img" style={{ ...stl, maxWidth: 420, border: `1px solid ${C.clair}` }} aria-label={aria}>{children}</svg>;
const FOR = { F: C.bleu, f: C.rouge, P: C.vert, R: C.vert, S: C.violet };

// Chariot (corps + roues) centré en cx, posé sur la ligne sol y = 156
export const Chariot = ({ cx = 200, w = 100, h = 40, sol = 156, c = '#dbeafe', s = C.bleu }) => (
  <g><rect x={cx - w / 2} y={sol - 16 - h} width={w} height={h} rx="6" fill={c} stroke={s} strokeWidth="2.2"/>
    <circle cx={cx - w / 2 + 20} cy={sol - 8} r="8" fill="#e2e8f0" stroke={C.gris} strokeWidth="2"/><circle cx={cx + w / 2 - 20} cy={sol - 8} r="8" fill="#e2e8f0" stroke={C.gris} strokeWidth="2"/></g>);
const Sol = ({ y = 156, x0 = 10, x1 = 390 }) => <g><line x1={x0} y1={y} x2={x1} y2={y} stroke={C.gris} strokeWidth="3"/>{Array.from({ length: Math.floor((x1 - x0) / 16) }, (_, i) => <line key={i} x1={x0 + 8 + i * 16} y1={y} x2={x0 + i * 16} y2={y + 9} stroke={C.clair} strokeWidth="2"/>)}</g>;

// Scène du parcours : chariot, poids et réaction (option), poussée F, frottement f, somme ΣF (option) ; valeurs en N (échelle 9 px par N)
export function SceneChariot({ poussee = 0, frott = 0, verticales = true, somme = false, mouvement = false, maxWidth = 460, aria }) {
  const k = 9, cx = 200, yc = 120, lf = Math.min(Math.abs(poussee) * k, 120), lr = Math.min(Math.abs(frott) * k, 120), S = poussee - frott, lS = Math.min(Math.abs(S) * k, 120);
  return (
    <svg viewBox="0 0 400 230" role="img" style={{ ...stl, maxWidth, border: `1px solid ${C.clair}` }} aria-label={aria || `Un chariot sur un rail horizontal${verticales ? ', avec son poids vers le bas et la réaction du rail vers le haut' : ''}${poussee ? ', poussé vers la droite' : ''}${frott ? ', freiné par un frottement vers la gauche' : ''}.`}>
      <Sol/>
      <Chariot cx={cx} sol={156}/>
      {verticales && <g><Fl x1={cx} y1={yc} x2={cx} y2={yc + 30} c={FOR.P} w={3.4}/><Fl x1={cx} y1={yc} x2={cx} y2={yc - 30} c={FOR.R} w={3.4}/>
        <VT x={cx + 8} y={yc + 28} t="P" c={FOR.P} s={20} halo/><VT x={cx + 8} y={yc - 14} t="R" c={FOR.R} s={20} halo/></g>}
      {lf > 1 && <g><Fl x1={cx + 52} y1={yc - 8} x2={cx + 52 + lf} y2={yc - 8} c={FOR.F} w={4.2}/><VT x={cx + 56 + lf / 2} y={yc - 20} t="F" c={FOR.F} s={20} a="middle" halo/></g>}
      {lr > 1 && <g><Fl x1={cx - 52} y1={yc + 16} x2={cx - 52 - lr} y2={yc + 16} c={FOR.f} w={4.2}/><VT x={cx - 56 - lr / 2} y={yc + 10} t="f" c={FOR.f} s={20} a="middle" halo/></g>}
      {somme && <g><Fl x1={cx} y1={50} x2={cx + Math.sign(S) * lS} y2={50} c={FOR.S} w={5}/><VT x={cx} y={36} t="ΣF" c={FOR.S} s={20} a="middle" halo/>{lS < 1 && <T x={cx + 18} y={55} s={14} c={FOR.S} w={700}>= 0</T>}</g>}
      {mouvement && <g><Fl x1={24} y1={196} x2={84} y2={196} c={C.gris} w={2.4}/><T x={92} y={201} s={14} c={C.gris} w={700}>mouvement</T></g>}
    </svg>);
}

// Carte : le bilan des forces
export function SvgBilanCarte() {
  return (
    <Cadre h={216} aria="Un chariot en mouvement rectiligne uniforme : le poids et la réaction du rail se compensent ; la poussée et le frottement se compensent aussi. La somme des forces est nulle.">
      <Sol y={140} x0={10} x1={390}/><Chariot cx={200} sol={140}/>
      <Fl x1="200" y1="90" x2="200" y2="124" c={FOR.P} w={3.4}/><Fl x1="200" y1="90" x2="200" y2="56" c={FOR.R} w={3.4}/>
      <VT x="208" y="120" t="P" c={FOR.P} s={17} halo/><VT x="208" y="68" t="R" c={FOR.R} s={17} halo/>
      <Fl x1="252" y1="84" x2="324" y2="84" c={FOR.F} w={4.2}/><VT x="290" y="74" t="F" c={FOR.F} s={17} a="middle" halo/>
      <Fl x1="148" y1="106" x2="76" y2="106" c={FOR.f} w={4.2}/><VT x="112" y="130" t="f" c={FOR.f} s={17} a="middle" halo/>
      <T x="200" y="176" a="middle" s={14.5} w={700} c={C.encre}>P = R (vertical)   et   F = f (horizontal)</T>
      <T x="200" y="198" a="middle" s={14.5} w={700} c={FOR.S}>donc ΣF = 0 : vitesse constante</T>
    </Cadre>);
}
// Carte : ΣF = m a (même somme des forces, masses différentes)
export function SvgDeuxiemeLoiCarte() {
  return (
    <Cadre h={220} aria="Deuxième loi de Newton : la somme des forces ΣF est égale à la masse m multipliée par l'accélération a. Pour une même somme des forces, un chariot de masse double a une accélération deux fois plus petite.">
      <T x="200" y="22" a="middle" s={18} w={800} c={FOR.S}>ΣF = m × a</T>
      <Sol y={92} x0={10} x1={390}/><Chariot cx={90} w={70} h={30} sol={92}/>
      <Fl x1="130" y1="66" x2="190" y2="66" c={FOR.S} w={4}/><VT x="160" y="56" t="ΣF" c={FOR.S} s={15} a="middle" halo/>
      <Fl x1="130" y1="76" x2="210" y2="76" c={C.orange} w={3.6} dash="6 4"/><T x="222" y="80" s={15} w={700} c={C.orange}>a</T>
      <Sol y={190} x0={10} x1={390}/><Chariot cx={95} w={90} h={40} sol={190} c="#ede9fe" s={C.violet}/>
      <Fl x1="145" y1="154" x2="205" y2="154" c={FOR.S} w={4}/><VT x="175" y="144" t="ΣF" c={FOR.S} s={15} a="middle" halo/>
      <Fl x1="145" y1="164" x2="185" y2="164" c={C.orange} w={3.6} dash="6 4"/><T x="196" y="168" s={15} w={700} c={C.orange}>a ÷ 2</T>
      <T x="270" y="76" s={14} w={700} c={C.gris}>masse m</T><T x="270" y="160" s={14} w={700} c={C.gris}>masse 2 m</T>
    </Cadre>);
}
// Carte : principe d'inertie, chronophotographies
export function SvgInertieCarte() {
  const reg = [40, 100, 160, 220, 280, 340], acc = [40, 62, 100, 160, 244, 352];
  return (
    <Cadre h={214} aria="Principe d'inertie. Si la somme des forces est nulle, des positions successives à intervalles de temps égaux sont régulièrement espacées : la vitesse est constante. Si la somme des forces n'est pas nulle, l'espacement change : la vitesse varie.">
      <T x="14" y="24" s={14.5} w={800} c={FOR.S}>ΣF = 0 : vitesse constante</T>
      <line x1="30" y1="52" x2="372" y2="52" stroke={C.clair} strokeWidth="1.5"/>{reg.map(x => <circle key={x} cx={x} cy="52" r="8" fill="#dbeafe" stroke={C.bleu} strokeWidth="2.2"/>)}
      <T x="200" y="86" a="middle" s={13.5} w={600} c={C.gris}>mêmes écarts entre positions successives</T>
      <T x="14" y="126" s={14.5} w={800} c={C.rouge}>ΣF ≠ 0 : vitesse qui varie</T>
      <line x1="30" y1="154" x2="372" y2="154" stroke={C.clair} strokeWidth="1.5"/>{acc.map(x => <circle key={x} cx={x} cy="154" r="8" fill="#fee2e2" stroke={C.rouge} strokeWidth="2.2"/>)}
      <T x="200" y="188" a="middle" s={13.5} w={600} c={C.gris}>écarts qui grandissent : le chariot accélère</T>
    </Cadre>);
}
