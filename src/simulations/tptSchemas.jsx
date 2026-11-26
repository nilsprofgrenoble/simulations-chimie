// Schémas de la simulation 297 (titrage potentiométrique) : montage animé (burette, zoom de lecture, gouttes, bécher sur agitateur, électrode de platine,
// électrode de référence, voltmètre), graphique E = f(V) tracé en direct, cartes « À retenir ».
import { useId } from 'react';
import { KIT, Cadre, ORANGE_GUIDE } from '../commun';
import * as M from './tptModele';
const { COUL_BURETTE } = M;

const C = { ce: '#b45309', ceFond: '#fef3c7', fe: '#0f766e', feFond: '#ccfbf1', encre: '#0f172a', gris: '#475569', vert: '#15803d', rouge: '#b91c1c', orange: '#c2410c', bleu: '#1d4ed8' };
const css = `
@media (prefers-reduced-motion: no-preference) {
  .tpt-chute { animation: tpt-chute 0.42s ease-in both; }
  @keyframes tpt-chute { from { transform: translateY(0); opacity: 1; } 90% { opacity: 1; } to { transform: translateY(var(--chute)); opacity: 0; } }
  .tpt-onde { transform-box: fill-box; transform-origin: center; animation: tpt-onde 0.8s ease-out 0.4s both; }
  @keyframes tpt-onde { from { transform: scale(0.4); opacity: 0.8; } to { transform: scale(5); opacity: 0; } }
}
`;
export const StylesTpt = () => <style>{css}</style>;

// ====================================================================== LE MONTAGE
export function SceneDosagePotentio({ anime = true, V, coul, ouvert, goutteCle = 0, lecture = null, mot = 'jaune très pâle', etiqBurette = null, etiqBecher = null, hl = () => false }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const yB0 = 46, yB1 = 226, yNiv = yB0 + V / M.V_BURETTE * (yB1 - yB0), ySurf = 358 - V * 1.0, yBout = 292;
  const BECHER = 'M 204 296 L 204 396 Q 204 400 208 400 L 336 400 Q 340 400 340 396 L 340 296';
  const fmtU = lecture == null ? '– – –' : (lecture < 0 ? '−' : '') + Math.abs(lecture).toFixed(3).replace('.', ',');
  return (
    <svg viewBox="0 0 640 440" role="img" aria-label="Montage du titrage potentiométrique : burette de cérium(IV), bécher de fer(II) sur agitateur, électrode de platine, électrode de référence et voltmètre"
      style={{ width: '100%', height: 'auto', display: 'block', background: '#f1f5f9', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <defs><clipPath id={`${id}b`}><path d={`${BECHER} Z`}/></clipPath>
        <linearGradient id={`${id}v`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.5"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
      {/* potence */}
      <rect x="120" y="420" width="512" height="12" rx="3" fill="#94a3b8"/><rect x="620" y="24" width="10" height="398" fill="#94a3b8"/>
      <rect x="232" y="131" width="390" height="8" fill="#94a3b8"/><rect x="224" y="124" width="36" height="22" rx="5" fill="#64748b"/>
      <rect x="296" y="213" width="326" height="8" fill="#94a3b8"/>
      {/* burette */}
      <g transform="translate(-30 0)">
      <rect x="258" y="30" width="24" height={yB1 - 30} fill="#fff" stroke={KIT.txt} strokeWidth="2"/>
      <rect x="260" y={yNiv} width="20" height={yB1 - yNiv} fill={COUL_BURETTE}/>
      <rect x="263" y={yNiv} width="4" height={yB1 - yNiv} fill="#fff" opacity="0.35"/>
      <path d={`M 260 ${yNiv} Q 270 ${yNiv + 4} 280 ${yNiv}`} fill="none" stroke="#92400e" strokeWidth="1.6"/>
      {Array.from({ length: 26 }, (_, k) => k).map(v => { const y = yB0 + v / M.V_BURETTE * (yB1 - yB0);
        return <g key={v}><line x1="282" y1={y} x2={v % 5 === 0 ? 296 : 289} y2={y} stroke={KIT.txt} strokeWidth="1"/>{v % 5 === 0 && <text x="300" y={y + 7} fontSize="20" fill={KIT.txt}>{v}</text>}</g>; })}
      <path d={`M 258 ${yB1} L 266 ${yB1 + 20} L 274 ${yB1 + 20} L 282 ${yB1} Z`} fill={V < M.V_BURETTE ? COUL_BURETTE : '#fff'} stroke={KIT.txt} strokeWidth="2"/>
      <rect x="262" y={yB1 + 20} width="16" height="10" rx="2" fill="#cbd5e1" stroke={KIT.txt}/>
      <g style={{ transformBox: 'fill-box' }}><rect x="278" y={yB1 + 22} width="28" height="6" rx="3" fill={ouvert ? C.vert : C.rouge} transform={ouvert ? `rotate(-90 278 ${yB1 + 25})` : undefined}/></g>
      <path d={`M 266 ${yB1 + 30} L 266 ${yBout - 12} L 270 ${yBout} L 274 ${yBout - 12} L 274 ${yB1 + 30} Z`} fill={V < M.V_BURETTE ? COUL_BURETTE : '#fff'} stroke={KIT.txt} strokeWidth="1.8"/>
      <rect x="262" y="38" width="3" height={yB1 - 44} fill={`url(#${id}v)`} opacity="0.6"/>
      </g>
      <text x="346" y="40" fontSize="20" fontWeight="700" fill={KIT.txt2}>Burette</text>
      {etiqBurette ? etiqBurette.map((t, k) => <text key={k} x="346" y={68 + k * 25} fontSize="19.5" fill={KIT.txt}>{t}</text>) : <text x="346" y="84" fontSize="40" fontWeight="800" fill={ORANGE_GUIDE}>?</text>}
      {/* zoom de lecture */}
      {(() => { const z0 = 70, zy = 56, zh = 150, zw = 62, mlParPx = 2 / zh, Yz = v => zy + zh / 2 + (v - V) / mlParPx;
        return <g>
          <rect x={z0} y={zy} width={zw} height={zh} fill="#fff" stroke={KIT.txt} strokeWidth="1.5"/>
          <rect x={z0 + 1} y={Math.max(zy, Math.min(zy + zh, Yz(V)))} width={zw - 2} height={Math.max(0, zy + zh - Math.max(zy, Yz(V)))} fill={COUL_BURETTE}/>
          {Array.from({ length: 41 }, (_, k) => Math.round(V * 10) / 10 - 2 + k * 0.1).map(v => { const y = Yz(v); if (y < zy || y > zy + zh || v < -0.001 || v > M.V_BURETTE + 0.001) return null; const r10 = Math.round(v * 10);
            return <g key={r10}><line x1={z0 + zw - (r10 % 10 === 0 ? 20 : r10 % 5 === 0 ? 14 : 8)} y1={y} x2={z0 + zw} y2={y} stroke={r10 % 5 === 0 ? '#fff' : '#fde68a'} strokeWidth="1.4"/>{r10 % 10 === 0 && <text x={z0 - 4} y={y + 7} fontSize="20" fill={KIT.txt} textAnchor="end">{r10 / 10}</text>}</g>; })}
          <path d={`M ${z0} ${Yz(V) - 2} Q ${z0 + zw / 2} ${Yz(V) + 7} ${z0 + zw} ${Yz(V) - 2}`} fill="none" stroke="#92400e" strokeWidth="2"/>
          <line x1={z0 - 8} y1={zy + zh / 2} x2={z0 + zw + 8} y2={zy + zh / 2} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x={z0 + zw / 2} y={zy - 10} fontSize="20" fill={KIT.txt2} textAnchor="middle">zoom (mL)</text>
          <line x1={z0 + zw} y1={zy + zh / 2} x2="228" y2={yNiv} stroke="#94a3b8" strokeDasharray="3 3"/></g>; })()}
      {/* fond blanc, agitateur, bécher */}
      <rect x="190" y="290" width="164" height="110" rx="10" fill="#fff" stroke="#cbd5e1"/>
      <rect x="196" y="400" width="152" height="20" rx="4" fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/><circle cx="214" cy="410" r="5" fill="none" stroke={KIT.txt}/><circle cx="332" cy="410" r="4" fill="#22c55e"/>
      <g clipPath={`url(#${id}b)`}>
        <rect x="200" y={ySurf} width="144" height={402 - ySurf} fill={coul}/>
        <rect x="262" y="390" width="26" height="6" rx="3" fill="#fff" stroke="#64748b">{anime && <animate attributeName="width" values="26;6;26" dur="0.5s" repeatCount="indefinite"/>}{anime && <animate attributeName="x" values="262;272;262" dur="0.5s" repeatCount="indefinite"/>}</rect>
      </g>
      <line x1="208" y1={ySurf} x2="336" y2={ySurf} stroke="#fff" strokeOpacity="0.55" clipPath={`url(#${id}b)`}/>
      <path d={BECHER} fill="none" stroke={KIT.txt} strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M 204 296 L 198 292 M 340 296 L 346 292" stroke={KIT.txt} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M 210 306 L 210 392" stroke="#fff" strokeWidth="3.5" opacity="0.7"/>
      {/* électrode de platine (fil de platine au bout d’un tube de verre) et électrode de référence (ECS : tube, KCl, fritté) */}
      <g transform="translate(8 0)">
        <rect x="299" y="206" width="8" height="166" rx="3" fill="#f8fafc" stroke={KIT.txt} strokeWidth="1.6"/><rect x="298" y="198" width="10" height="14" rx="3" fill="#64748b"/>
        <path d="M 303 372 q -4 5 0 8 q 4 3 0 7" fill="none" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round"/>
        <rect x="318" y="206" width="16" height="170" rx="4" fill="#f8fafc" stroke={KIT.txt} strokeWidth="1.6"/><rect x="320" y="290" width="12" height="82" fill="#e0f2fe" opacity="0.8"/><rect x="317" y="196" width="18" height="16" rx="3" fill="#dc2626"/>
        <rect x="321" y="376" width="10" height="9" rx="2" fill="#fff" stroke="#94a3b8" strokeDasharray="2 2"/>
        <rect x="298" y="206" width="3" height="120" fill="#fff" opacity="0.7"/>
      </g>
      <text x="314" y="188" fontSize="17" fontWeight="700" fill={KIT.txt} textAnchor="end">Pt</text><text x="324" y="188" fontSize="17" fontWeight="700" fill={C.rouge}>ECS</text>
      {/* goutte(s) */}
      {ouvert && [0, 1, 2].map(k => <circle key={k} cx="240" cy={yBout + 4} r="3.4" fill={COUL_BURETTE}>{anime && <animate attributeName="cy" from={yBout + 3} to={ySurf - 2} dur="0.5s" begin={`${k * 0.17}s`} repeatCount="indefinite"/>}</circle>)}
      {ouvert && <ellipse cx="240" cy={ySurf} rx="6" ry="2" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.7">{anime && <animate attributeName="rx" values="4;24" dur="0.5s" repeatCount="indefinite"/>}{anime && <animate attributeName="opacity" values="0.8;0" dur="0.5s" repeatCount="indefinite"/>}</ellipse>}
      {!ouvert && goutteCle > 0 && <g key={goutteCle}><circle className="tpt-chute" style={{ '--chute': `${ySurf - yBout - 6}px` }} cx="240" cy={yBout + 5} r="4" fill={COUL_BURETTE}/><ellipse className="tpt-onde" cx="240" cy={ySurf} rx="8" ry="2.5" fill="none" stroke="#d97706" strokeWidth="1.6"/></g>}
      {/* voltmètre et fils */}
      <path d="M 311 198 C 311 150 380 150 420 248" fill="none" stroke={KIT.txt} strokeWidth="2.4"/>
      <path d="M 334 196 C 338 160 440 150 470 248" fill="none" stroke={C.rouge} strokeWidth="2.4"/>
      <rect x="392" y="248" width="214" height="156" rx="14" fill="#1e293b" stroke="#0f172a" strokeWidth="2"/>
      <circle cx="420" cy="248" r="7" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2"/><circle cx="470" cy="248" r="7" fill={C.rouge} stroke="#0f172a" strokeWidth="2"/>
      <rect x="408" y="268" width="182" height="74" rx="8" fill="#d9f99d" stroke="#365314" strokeWidth="2"/>
      <text x="580" y="332" fontSize="38" fontWeight="800" fill="#1a2e05" textAnchor="end" fontFamily="ui-monospace, monospace">{fmtU}</text>
      <text x="418" y="288" fontSize="15" fontWeight="700" fill="#365314">U (volt)</text>
      <text x="499" y="366" fontSize="20" fontWeight="700" fill="#e2e8f0" textAnchor="middle">Voltmètre</text>
      <text x="499" y="390" fontSize="15" fill="#94a3b8" textAnchor="middle">U = E(Pt) − E(ECS)</text>
      {/* étiquettes */}
      <text x="10" y="300" fontSize="20" fontWeight="700" fill={KIT.txt2}>Bécher</text>
      {etiqBecher && etiqBecher.map((t, k) => <text key={k} x="10" y={326 + k * 25} fontSize="19.5" fill={KIT.txt}>{t}</text>)}
      <rect x="376" y="150" width="214" height="46" rx="10" fill="#fff" stroke={KIT.bord}/>
      <rect x="384" y="160" width="36" height="26" rx="6" fill={coul} stroke={KIT.txt}/><text x="428" y="180" fontSize="18" fill={KIT.txt}>{mot}</text>
      <Cadre actif={hl('burette')} x={174} y={20} w={110} h={282}/>
      <Cadre actif={hl('becher')} x={190} y={290} w={164} h={112}/>
      <Cadre actif={hl('electrodes')} x={290} y={174} w={72} h={218}/>
      <Cadre actif={hl('voltmetre')} x={388} y={238} w={222} h={170}/>
    </svg>
  );
}

// ====================================================================== GRAPHIQUE E = f(V), tracé jusqu'au volume versé
export function GraphE({ s, V, e, montrer = {} }) {
  const W = 460, H = 270, x0 = 54, x1 = W - 14, y0 = 30, y1 = H - 46, Emin = 0.4, Emax = 1.6;
  const X = v => x0 + (v / M.V_BURETTE) * (x1 - x0), Y = E => y1 - ((E - Emin) / (Emax - Emin)) * (y1 - y0);
  const pas = 0.1, pts = []; for (let v = 0; v <= V + 1e-9; v += pas) pts.push(v); if (pts[pts.length - 1] < V) pts.push(V);
  const d = pts.map((v, k) => `${k ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(M.etat(s, v).E).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Potentiel E de l’électrode de platine en fonction du volume de cérium(IV) versé" style={{ width: '100%', height: 'auto', display: 'block', background: '#fff', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {[0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6].map(E => <g key={E}><line x1={x0} x2={x1} y1={Y(E)} y2={Y(E)} stroke="#e2e8f0"/><text x={x0 - 6} y={Y(E) + 6} fontSize="16" fill={KIT.txt2} textAnchor="end">{E.toFixed(1).replace('.', ',')}</text></g>)}
      <text x="8" y="16" fontSize="16" fill={KIT.txt2}>E (V)</text>
      {[0, 5, 10, 15, 20, 25].map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={y1} y2={y1 + 5} stroke={KIT.txt}/><text x={X(v)} y={y1 + 22} fontSize="16" fill={KIT.txt2} textAnchor="middle">{v}</text></g>)}
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={KIT.txt}/><line x1={x0} x2={x0} y1={y0} y2={y1} stroke={KIT.txt}/>
      <text x={(x0 + x1) / 2} y={H - 6} fontSize="16" fill={KIT.txt2} textAnchor="middle">volume de cérium(IV) versé (mL)</text>
      {montrer.eq && V >= s.Veq && <g><line x1={X(s.Veq)} x2={X(s.Veq)} y1={y0} y2={y1} stroke={ORANGE_GUIDE} strokeDasharray="4 4" strokeWidth="2"/><text x={X(s.Veq) + 5} y={y1 - 8} fontSize="16" fontWeight="700" fill={C.orange}>équivalence</text></g>}
      <path d={d} fill="none" stroke={C.bleu} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={X(V)} cy={Y(e.E)} r="5.5" fill={C.bleu} stroke="#fff" strokeWidth="1.5"/>
    </svg>
  );
}

// ====================================================================== CARTES « À RETENIR » (viewBox 300 de large)
const Fond = ({ h, children, titre }) => <svg viewBox={`0 0 300 ${h}`} width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }} role="img"><title>{titre}</title>{children}</svg>;
const Titre = ({ t }) => <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.encre}>{t}</text>;
const Ind = ({ t }) => t.split(/_([A-Za-z])/).map((m, i) => i % 2 ? <tspan key={i} fontSize="0.75em" dy="3">{m}</tspan> : (i > 0 && m ? <tspan key={i} dy="-3">{m}</tspan> : m));
const SG = M.situation(M.SIT_GUIDE);
const courbe = (X, Y, v0 = 0, v1 = 25) => { let d = ''; for (let v = v0, k = 0; v <= v1 + 1e-9; v += 0.25, k++) d += `${k ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(M.etat(SG, v).E).toFixed(1)}`; return d; };

export function SvgMontageCarte() {
  return <Fond h="244" titre="Deux électrodes et un voltmètre">
    <Titre t="Deux électrodes, une tension"/>
    <path d="M 40 70 V 140 L 36 150 V 196 Q 36 202 42 202 H 118 Q 124 202 124 196 V 150 L 120 140 V 70" fill="#fff" stroke={C.encre} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M 38 148 H 122 V 194 Q 122 200 116 200 H 44 Q 38 200 38 194 Z" fill="#fdf6c8"/>
    <rect x="64" y="60" width="9" height="116" rx="3" fill="#fff" stroke={C.encre} strokeWidth="1.8"/><path d="M 68 176 q -4 5 0 8 q 4 3 0 7" fill="none" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round"/>
    <rect x="86" y="60" width="16" height="122" rx="4" fill="#fff" stroke={C.encre} strokeWidth="1.8"/><rect x="85" y="52" width="18" height="14" rx="3" fill="#dc2626"/>
    <line x1="32" y1="100" x2="63" y2="100" stroke={C.encre} strokeWidth="1"/><text x="22" y="104" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.encre}>Pt</text><line x1="103" y1="100" x2="134" y2="100" stroke={C.rouge} strokeWidth="1"/><text x="150" y="104" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.rouge}>ECS</text>
    <path d="M 68 58 C 68 34 190 30 200 64" fill="none" stroke={C.encre} strokeWidth="2"/><path d="M 94 52 C 100 40 230 36 238 64" fill="none" stroke={C.rouge} strokeWidth="2"/>
    <rect x="176" y="64" width="112" height="64" rx="10" fill="#1e293b"/><rect x="184" y="72" width="96" height="34" rx="6" fill="#d9f99d"/><text x="274" y="98" textAnchor="end" fontSize="22" fontWeight="800" fill="#1a2e05" fontFamily="ui-monospace, monospace">0,363</text>
    <text x="232" y="121" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#e2e8f0">voltmètre (V)</text>
    <rect x="12" y="150" width="0" height="0"/>
    <rect x="140" y="146" width="148" height="76" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
    <text x="214" y="166" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.encre}><Ind t="U = E(Pt) − E(ECS)"/></text>
    <text x="214" y="186" textAnchor="middle" fontSize="12.5" fill={C.gris}>ECS : potentiel constant,</text><text x="214" y="203" textAnchor="middle" fontSize="12.5" fill={C.gris}>0,245 V (référence)</text>
    <text x="150" y="238" textAnchor="middle" fontSize="12.5" fill={C.gris}>on suit E(Pt) : il « ressent » la solution</text>
  </Fond>;
}
export function SvgCourbeCarte() {
  const x0 = 38, x1 = 290, y0 = 36, y1 = 190, X = v => x0 + v / 25 * (x1 - x0), Y = E => y1 - (E - 0.5) / 1.1 * (y1 - y0), Ve = SG.Veq;
  return <Fond h="262" titre="Allure de la courbe de titrage potentiométrique">
    <Titre t="Allure de la courbe E = f(V)"/>
    <line x1={x0} y1={y1} x2={x1} y2={y1} stroke={C.encre}/><line x1={x0} y1={y0} x2={x0} y2={y1} stroke={C.encre}/>
    <text x={x0 - 4} y={y0 - 6} fontSize="12.5" fill={C.gris}>E</text><text x={x1} y={y1 + 16} fontSize="12.5" fill={C.gris} textAnchor="end">V versé</text>
    <rect x={X(Ve - 1.2)} y={y0} width={X(Ve + 1.2) - X(Ve - 1.2)} height={y1 - y0} fill="#fed7aa" opacity="0.7"/>
    <line x1={X(Ve)} y1={y0} x2={X(Ve)} y2={y1} stroke={ORANGE_GUIDE} strokeDasharray="4 3" strokeWidth="1.8"/>
    <path d={courbe(X, Y)} fill="none" stroke={C.bleu} strokeWidth="3.4" strokeLinecap="round"/>
    <text x={X(Ve)} y={y1 + 16} fontSize="12.5" fontWeight="700" fill={C.orange} textAnchor="middle"><Ind t="V_E"/></text>
    <g fontSize="12.5" fontWeight="700"><text x="46" y="118" fill={C.fe}>avant :</text><text x="46" y="133" fill={C.fe}>Fe²⁺ en excès</text>
      <text x="232" y="78" fill={C.ce}>après :</text><text x="232" y="93" fill={C.ce}>Ce⁴⁺ en</text><text x="232" y="108" fill={C.ce}>excès</text>
      <text x={X(Ve) + 6} y="152" fill={C.orange}>saut</text></g>
    <rect x="12" y="222" width="276" height="32" rx="10" fill="#fff7ed" stroke={C.orange} strokeWidth="1.5"/>
    <text x="150" y="243" textAnchor="middle" fontSize="13" fontWeight="700" fill="#9a3412">l’équivalence est au milieu du saut</text>
  </Fond>;
}
export function SvgDeriveeCarte() {
  const x0 = 38, x1 = 290, X = v => x0 + v / 25 * (x1 - x0), Ve = SG.Veq;
  const Y1 = E => 108 - (E - 0.5) / 1.1 * 70, pts = M.pointsTableur(SG, 0.5), der = pts.slice(1).map((p, k) => [(p[0] + pts[k][0]) / 2, (p[1] - pts[k][1]) / 0.5]), dmax = Math.max(...der.map(d => d[1]));
  const Y2 = d => 214 - d / dmax * 62;
  return <Fond h="250" titre="Méthode de la dérivée">
    <Titre t="Méthode de la dérivée"/>
    <line x1={x0} y1="108" x2={x1} y2="108" stroke={C.encre}/><line x1={x0} y1="36" x2={x0} y2="108" stroke={C.encre}/><path d={courbe(X, Y1)} fill="none" stroke={C.bleu} strokeWidth="3" strokeLinecap="round"/>
    <text x={x0 - 4} y="32" fontSize="12.5" fill={C.gris}>E</text>
    <line x1={x0} y1="214" x2={x1} y2="214" stroke={C.encre}/><line x1={x0} y1="140" x2={x0} y2="214" stroke={C.encre}/>
    <path d={der.map((p, k) => `${k ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y2(p[1]).toFixed(1)}`).join(' ')} fill="none" stroke={C.vert} strokeWidth="3" strokeLinecap="round"/>
    <text x={x0 - 4} y="136" fontSize="12.5" fill={C.gris}>dE/dV</text><text x={x1} y="230" fontSize="12.5" fill={C.gris} textAnchor="end">V versé (mL)</text>
    <line x1={X(Ve)} y1="36" x2={X(Ve)} y2="214" stroke={ORANGE_GUIDE} strokeDasharray="4 3" strokeWidth="1.8"/>
    <text x={X(Ve) + 6} y="156" fontSize="13" fontWeight="700" fill={C.orange}>maximum</text><text x={X(Ve) + 6} y="171" fontSize="13" fontWeight="700" fill={C.orange}>= <Ind t="V_E"/></text>
  </Fond>;
}
export function SvgStandardCarte() {
  const x0 = 38, x1 = 290, y0 = 36, y1 = 186, X = v => x0 + v / 25 * (x1 - x0), Y = E => y1 - (E - 0.5) / 1.1 * (y1 - y0), Ve = SG.Veq;
  return <Fond h="258" titre="Potentiels standards lus sur la courbe">
    <Titre t="Lire un potentiel standard"/>
    <line x1={x0} y1={y1} x2={x1} y2={y1} stroke={C.encre}/><line x1={x0} y1={y0} x2={x0} y2={y1} stroke={C.encre}/><path d={courbe(X, Y)} fill="none" stroke={C.bleu} strokeWidth="3.2" strokeLinecap="round"/>
    {[[Ve / 2, 0.77, C.fe, 'V_E/2', 'middle'], [2 * Ve, 1.44, C.ce, '2 V_E', 'end']].map(([v, E, c, a, anc]) => <g key={a}>
      <line x1={X(v)} y1={y1} x2={X(v)} y2={Y(E)} stroke={c} strokeDasharray="3 3"/><line x1={x0} y1={Y(E)} x2={X(v)} y2={Y(E)} stroke={c} strokeDasharray="3 3"/><circle cx={X(v)} cy={Y(E)} r="5" fill={c} stroke="#fff" strokeWidth="1.5"/>
      <text x={X(v)} y={y1 + 16} fontSize="12.5" fontWeight="700" fill={c} textAnchor={anc}><Ind t={a}/></text></g>)}
    <text x={x0 + 6} y={Y(0.77) - 6} fontSize="12.5" fontWeight="700" fill={C.fe}>E° (Fe³⁺/Fe²⁺)</text><text x={x0 + 6} y={Y(1.44) - 6} fontSize="12.5" fontWeight="700" fill={C.ce}>E° (Ce⁴⁺/Ce³⁺)</text>
    <rect x="12" y="216" width="276" height="34" rx="10" fill="#f0fdfa" stroke={C.fe} strokeWidth="1.5"/>
    <text x="150" y="238" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.fe}>[Ox] = [Red] : E = E° (log 1 = 0)</text>
  </Fond>;
}
export function SvgCalculCarte() {
  const L = [['1', 'quantité de cérium versée', 'n(Ce⁴⁺) = c_B × V_E', 'exemple : 0,0500 × 15,0 = 0,750 mmol', C.ce], ['2', 'relation 1 pour 1', 'n(Fe²⁺) = n(Ce⁴⁺)', 'exemple : 0,750 mmol de Fe²⁺ dosées', C.fe], ['3', 'concentration prélevée', 'c_A = n(Fe²⁺) / V_A', 'exemple : 0,750 / 25,0 = 0,0300 mol/L', C.bleu]];
  return <Fond h="236" titre="Du volume équivalent à la concentration"><Titre t="Du volume équivalent à la concentration"/>
    {L.map(([n, t, f, e, c], i) => <g key={n} transform={`translate(0 ${32 + i * 68})`}>
      <rect x="10" y="0" width="280" height="60" rx="12" fill="#fff" stroke={c} strokeWidth="2"/><circle cx="30" cy="30" r="13" fill={c}/><text x="30" y="35" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">{n}</text>
      <text x="52" y="19" fontSize="12.5" fontWeight="700" fill={c}>{t}</text><text x="52" y="37" fontSize="13.5" fontWeight="700" fill={C.encre}><Ind t={f}/></text><text x="52" y="53" fontSize="12.5" fill={C.gris}>{e}</text></g>)}
  </Fond>;
}
