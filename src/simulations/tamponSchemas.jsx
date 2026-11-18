// ====================================================
//  Schémas de la simulation 131 (solution tampon, niveau TG).
//  Cartes « À retenir » : viewBox de 300 de large, police ≥ 14 (≈ 12 px rendus sur téléphone). Scène : viewBox de 400, police ≥ 13.
//  Couleurs : bleu = forme acide AH, orange = forme basique A⁻, vert = bon, rouge = repère / pH mesuré, gris = eau pure.
//  Indices en caractères Unicode ou tspan abaissé (jamais baselineShift) ; tout le texte DANS le viewBox.
// ====================================================
import * as M from './tamponModele';

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', txt: '#0f172a', eau: '#475569', fondB: '#dbeafe', fondO: '#ffedd5' };
const Sb = ({ t }) => <tspan dy="4" fontSize="13">{t}</tspan>;
const Rs = ({ children }) => <tspan dy="-4">{children}</tspan>;
const stl = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const volTxt = V => (V >= 1000 ? `${nbf(V / 1000, V % 1000 === 0 ? 0 : 2)} L` : `${nbf(V, 0)} mL`);

// ---------- scène : béchers avec pH-mètre ----------
export function SceneBechers({ items }) {
  const un = items.length === 1, w = un ? 150 : 120, xs = un ? [200] : [105, 295];
  return (
    <svg viewBox="0 0 400 250" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={'Béchers avec pH-mètre : ' + items.map(it => `${it.titre}, volume ${volTxt(it.V)}, pH ${nbf(it.pH, 2)}`).join(' ; ') + '.'}>
      {items.map((it, i) => { const cx = xs[i], h = Math.max(10, Math.min(1, it.V / 300) * 100), yL = 176 - h;
        return <g key={it.titre}>
          <rect x={cx - 62} y="6" width="124" height="38" rx="6" fill={COL.txt}/>
          <text x={cx} y="33" fontSize="24" fontWeight="700" textAnchor="middle" fill="white">pH {nbf(it.pH, 2)}</text>
          <line x1={cx} y1="44" x2={cx} y2={Math.max(yL + 12, 120)} stroke={COL.gris} strokeWidth="3"/>
          <rect x={cx - w / 2 + 3} y={yL} width={w - 6} height={176 - yL - 1} fill={it.couleur || '#bfdbfe'} opacity="0.85"/>
          <path d={`M${cx - w / 2} 66 V176 H${cx + w / 2} V66`} fill="none" stroke={COL.txt} strokeWidth="2.5"/>
          <text x={cx} y="200" fontSize="19" fontWeight="700" textAnchor="middle" fill={COL.txt}>{it.titre}</text>
          <text x={cx} y="228" fontSize="17" textAnchor="middle" fill={COL.gris}>{it.sous || volTxt(it.V)}</text>
        </g>; })}
    </svg>);
}

// ---------- composition du tampon : quantités de AH et de A⁻ (mmol), avant (contour) et après (plein) ----------
export function Composition({ AH, A, a0, b0, a1, b1, nombres = true }) {
  const ymax = Math.max(a0, b0, a1, b1, 1) * 1.2, Y = n => 150 - 110 * n / ymax, g = (x, n0, n1, col, nom) => (
    <g key={nom}>
      <rect x={x} y={Y(n0)} width="46" height={150 - Y(n0)} fill="none" stroke={col} strokeWidth="2" strokeDasharray="4 3"/>
      <rect x={x + 8} y={Y(n1)} width="30" height={150 - Y(n1)} fill={col}/>
      {nombres && <text x={x + 23} y={Math.min(Y(n0), Y(n1)) - 5} fontSize="18" fontWeight="700" textAnchor="middle" fill={col}>{nbf(n1, 2)}</text>}
      <text x={x + 23} y="174" fontSize="19" fontWeight="700" textAnchor="middle" fill={col}>{nom}</text>
    </g>);
  return (
    <svg viewBox="0 0 400 200" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Quantités de matière dans le tampon : ${AH} passe de ${nbf(a0, 2)} à ${nbf(a1, 2)} millimoles et ${A} de ${nbf(b0, 2)} à ${nbf(b1, 2)} millimoles.`}>
      <line x1="40" y1="150" x2="380" y2="150" stroke={COL.txt} strokeWidth="2"/>
      {g(100, a0, a1, COL.bleu, AH)}{g(250, b0, b1, COL.orange, A)}
      <text x="16" y="22" fontSize="17" fill={COL.gris}>mmol</text>
      <text x="200" y="196" fontSize="17" textAnchor="middle" fill={COL.gris}>pointillés : avant — plein : après</text>
    </svg>);
}

// ---------- courbe pH = f(volume ajouté) : acide à gauche (négatif), soude à droite ----------
export function CourbeAjout({ pts, v, phT, phE, pKa, AH, A }) {
  const X = x => 40 + 348 * (x + 150) / 300, Y = p => 200 - 12.857 * p;
  const ch = k => pts.map(q => `${X(q.v).toFixed(1)},${Y(q[k]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 400 276" style={{ ...stl, maxWidth: 480 }} role="img"
      aria-label={`Courbe du pH en fonction du volume d’acide (à gauche) ou de soude (à droite) ajouté. L’eau pure passe de pH 1 à pH 13 ; le tampon reste près de pH ${nbf(pKa, 2)} tant qu’il reste de la base ${A} ou de l’acide ${AH}. Point actuel : ${v < 0 ? `${-v} mL d’acide` : v > 0 ? `${v} mL de soude` : 'aucun ajout'}, pH eau ${nbf(phE, 2)}, pH tampon ${nbf(phT, 2)}.`}>
      <rect x="40" y={Y(pKa + 1)} width="348" height={Y(pKa - 1) - Y(pKa + 1)} fill={COL.fondO} opacity="0.7"/>
      <rect x="40" y="20" width="348" height="180" fill="none" stroke="#cbd5e1"/>
      {[0, 4, 8, 12].map(p => <g key={p}><line x1="36" y1={Y(p)} x2="40" y2={Y(p)} stroke={COL.txt}/><text x="32" y={Y(p) + 6} fontSize="17" textAnchor="end" fill={COL.txt}>{p}</text></g>)}
      <text x="40" y="15" fontSize="17" fill={COL.gris}>pH</text>
      {[-150, -100, -50, 0, 50, 100, 150].map(x => <g key={x}><line x1={X(x)} y1="200" x2={X(x)} y2="205" stroke={COL.txt}/><text x={X(x)} y="224" fontSize="17" textAnchor="middle" fill={COL.txt}>{Math.abs(x)}</text></g>)}
      <text x="40" y="246" fontSize="16" fill={COL.gris}>← acide (mL)</text><text x="388" y="246" fontSize="16" textAnchor="end" fill={COL.gris}>soude (mL) →</text>
      <line x1={X(0)} y1="20" x2={X(0)} y2="200" stroke="#94a3b8" strokeDasharray="3 3"/>
      <polyline points={ch('eau')} fill="none" stroke={COL.eau} strokeWidth="3" strokeDasharray="7 4"/><polyline points={ch('tampon')} fill="none" stroke={COL.orange} strokeWidth="3.5"/>
      <circle cx={X(v)} cy={Y(phE)} r="5.5" fill={COL.eau}/><circle cx={X(v)} cy={Y(phT)} r="5.5" fill={COL.orange}/>
      <text x="392" y="270" fontSize="17" textAnchor="end" fontWeight="700" fill={COL.orange}>── tampon</text><text x="196" y="270" fontSize="17" textAnchor="end" fontWeight="700" fill={COL.eau}>- - eau pure</text>
    </svg>);
}

// ====================== cartes « À retenir » (viewBox 300) ======================

// carte 1 : un tampon résiste (eau pure et tampon, ajout de 10 mL d'acide)
export function SvgResisteCarte() {
  const Y = p => 168 - 8.9 * p, col = [[90, 'eau pure', 7.0, 2.04, COL.eau], [210, 'tampon', 4.76, 4.67, COL.orange]];
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img" aria-label="Ajout de 10 millilitres d’acide dans 100 millilitres : le pH de l’eau pure chute de 7,0 à 2,0 alors que celui du tampon passe seulement de 4,76 à 4,67.">
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Un tampon résiste</text>
      <text x="150" y="40" fontSize="14" textAnchor="middle" fill={COL.gris}>+ 10 mL d’acide dans 100 mL</text>
      <line x1="30" y1={Y(0)} x2="280" y2={Y(0)} stroke={COL.txt}/><text x="12" y={Y(0) + 5} fontSize="14" fill={COL.txt}>0</text><text x="8" y={Y(14) + 5} fontSize="14" fill={COL.txt}>14</text>
      {col.map(([x, nom, p0, p1, c]) => <g key={nom}>
        <circle cx={x} cy={Y(p0)} r="7" fill="white" stroke={c} strokeWidth="3"/><circle cx={x} cy={Y(p1)} r="7" fill={c}/>
        {Math.abs(p0 - p1) > 1 && <line x1={x} y1={Y(p0) + 9} x2={x} y2={Y(p1) - 9} stroke={c} strokeWidth="3" strokeDasharray="5 3"/>}
        <text x={x} y="192" fontSize="14" fontWeight="700" textAnchor="middle" fill={c}>{nom}</text>
        <text x={x} y="212" fontSize="14" textAnchor="middle" fill={COL.txt}>{nbf(p0, p0 === 7 ? 1 : 2)} → {nbf(p1, p0 === 7 ? 1 : 2)}</text></g>)}
    </svg>);
}

// cartes 2 et 3 : réaction et quantités avant / après
function BarresCarte({ titre, reaction, ligne2, a0, b0, a1, b1, aria }) {
  const Y = n => 176 - 8 * n, b = (x, n, c, nom) => <g key={x}><rect x={x} y={Y(n)} width="36" height={176 - Y(n)} fill={c}/><text x={x + 18} y={Y(n) - 5} fontSize="14" fontWeight="700" textAnchor="middle" fill={c}>{n}</text><text x={x + 18} y="196" fontSize="14" fontWeight="700" textAnchor="middle" fill={c}>{nom}</text></g>;
  return (
    <svg viewBox="0 0 300 236" style={stl} role="img" aria-label={aria}>
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>{titre}</text>
      <text x="150" y="44" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>{reaction}</text>
      <text x="150" y="64" fontSize="14" textAnchor="middle" fill={COL.gris}>{ligne2}</text>
      <line x1="20" y1="176" x2="280" y2="176" stroke={COL.txt} strokeWidth="2"/>
      <text x="66" y="86" fontSize="14" textAnchor="middle" fill={COL.gris}>avant</text><text x="232" y="86" fontSize="14" textAnchor="middle" fill={COL.gris}>après</text>
      {b(32, a0, COL.bleu, 'AH')}{b(84, b0, COL.orange, 'A⁻')}{b(198, a1, COL.bleu, 'AH')}{b(250, b1, COL.orange, 'A⁻')}
      <text x="150" y="130" fontSize="26" textAnchor="middle" fill={COL.txt}>→</text>
      <text x="150" y="222" fontSize="13" textAnchor="middle" fill={COL.gris}>quantités en mmol</text>
    </svg>);
}
export const SvgAcideCarte = () => <BarresCarte titre="Ajout d’acide" reaction="A⁻ + H₃O⁺ → AH + H₂O" ligne2="la base A⁻ consomme l’acide ajouté" a0={10} b0={10} a1={11} b1={9}
  aria={'Ajout de 1 millimole d’acide fort : la base A moins est consommée, A moins passe de 10 à 9 millimoles et AH de 10 à 11.'}/>;
export const SvgBaseCarte = () => <BarresCarte titre="Ajout de base" reaction="AH + HO⁻ → A⁻ + H₂O" ligne2="l’acide AH consomme la base ajoutée" a0={10} b0={10} a1={9} b1={11}
  aria={'Ajout de 1 millimole de base forte : l’acide AH est consommé, AH passe de 10 à 9 millimoles et A moins de 10 à 11.'}/>;

// carte 4 : dilution
export function SvgDilCarte() {
  const bec = (cx, w, h, titre, sous) => <g key={titre}>
    <rect x={cx - w / 2 + 3} y={150 - h} width={w - 6} height={h - 1} fill="#bfdbfe" opacity="0.85"/><path d={`M${cx - w / 2} ${150 - h - 14} V150 H${cx + w / 2} V${150 - h - 14}`} fill="none" stroke={COL.txt} strokeWidth="2.5"/>
    <text x={cx} y="172" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>{titre}</text><text x={cx} y="192" fontSize="14" textAnchor="middle" fill={COL.gris}>{sous}</text></g>;
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img" aria-label="Dilution d’un facteur 10 d’un tampon : les quantités de AH et de A moins se répartissent dans un volume plus grand, leur rapport ne change pas, le pH reste voisin de 4,76.">
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Dilution : le rapport est inchangé</text>
      {bec(70, 80, 50, '100 mL', 'pH = 4,76')}{bec(230, 110, 100, '1,00 L', 'pH = 4,76')}
      <text x="150" y="112" fontSize="28" textAnchor="middle" fill={COL.txt}>→</text><text x="150" y="132" fontSize="14" textAnchor="middle" fill={COL.gris}>+ eau</text>
      <text x="150" y="216" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>[A⁻] / [AH] = 1 avant et après</text>
    </svg>);
}

// carte 5 : composition d'un tampon, pH = pKA ± 1
export function SvgMelangeCarte() {
  const X = r => 150 + 62 * Math.log10(r), pts = [0.1, 1, 10];
  return (
    <svg viewBox="0 0 300 226" style={stl} role="img" aria-label="Composition d’un tampon : acide faible AH et base conjuguée A moins en quantités comparables, rapport entre 0,1 et 10 ; le pH vaut alors pKA plus ou moins 1, et exactement pKA quand les quantités sont égales.">
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>AH et A⁻ en quantités comparables</text>
      <rect x={X(0.1)} y="40" width={X(10) - X(0.1)} height="46" fill={COL.fondO}/>
      <line x1="20" y1="86" x2="280" y2="86" stroke={COL.txt} strokeWidth="2"/>
      {pts.map(r => <g key={r}><line x1={X(r)} y1="80" x2={X(r)} y2="92" stroke={COL.txt} strokeWidth="2"/>
        <text x={X(r)} y="112" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>{nbf(r, r < 1 ? 1 : 0)}</text></g>)}
      <text x="150" y="64" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>zone tampon</text>
      <text x="150" y="134" fontSize="14" textAnchor="middle" fill={COL.gris}>rapport n(A⁻) / n(AH)</text>
      <text x="150" y="164" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.txt}>pH = pK<Sb t="A"/><Rs> + log (n(A⁻) / n(AH))</Rs></text>
      <text x="150" y="190" fontSize="14" textAnchor="middle" fill={COL.txt}>quantités égales ⇒ pH = pK<Sb t="A"/></text>
      <text x="150" y="214" fontSize="14" textAnchor="middle" fill={COL.txt}>zone tampon : pK<Sb t="A"/><Rs> ± 1</Rs></text>
    </svg>);
}

// carte 6 : limites (pouvoir tampon épuisé)
export function SvgLimiteCarte() {
  const q = M.quantites(0.20, 0.5), pts = M.courbeAjout({ pKa: 4.76, ...q }, 150, 76), X = v => 30 + 250 * (v + 150) / 300, Y = p => 150 - 9.6 * p;
  const ch = pts.map(p => `${X(p.v).toFixed(1)},${Y(p.tampon).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 300 232" style={stl} role="img" aria-label="Limites d’un tampon : le pH reste voisin de 4,76 pour un ajout modéré de soude ou d’acide, puis il chute quand toute la base A moins (acide ajouté) ou tout l’acide AH (soude ajoutée) est consommé.">
      <text x="150" y="20" fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.txt}>Un tampon a des limites</text>
      <rect x={X(-50)} y="34" width={X(50) - X(-50)} height="116" fill={COL.fondO} opacity="0.8"/>
      <line x1="30" y1="150" x2="280" y2="150" stroke={COL.txt}/><line x1="30" y1="34" x2="30" y2="150" stroke={COL.txt}/>
      <line x1={X(0)} y1="34" x2={X(0)} y2="150" stroke="#94a3b8" strokeDasharray="3 3"/>
      <polyline points={ch} fill="none" stroke={COL.orange} strokeWidth="3.5"/>
      <text x="26" y="52" fontSize="14" textAnchor="end" fill={COL.txt}>pH</text>
      <text x="30" y="172" fontSize="14" fill={COL.gris}>← acide</text><text x="280" y="172" fontSize="14" textAnchor="end" fill={COL.gris}>soude →</text>
      <text x={X(0)} y="112" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.orange}>plateau</text>
      <text x="150" y="196" fontSize="14" textAnchor="middle" fill={COL.txt}>au-delà de la quantité de A⁻ ou de AH,</text>
      <text x="150" y="216" fontSize="14" fontWeight="700" textAnchor="middle" fill={COL.rouge}>le pH s’effondre : tampon épuisé</text>
    </svg>);
}
