import { useId, useState } from "react";
import { KIT, avecIndices } from "../commun";

// ====================================================
//  SCHÉMAS ET MISE EN PAGE DES ÉNONCÉS (chapitre « Transmission de signaux numériques »)
// ====================================================
// Les banques d'exercices (fichiers .js, sans JSX) décrivent un visuel par un objet { type, …paramètres } ; Visuel() le dessine.
//   pont     : circuit diviseur de tension (générateur, R, photorésistance), tension mesurée surlignée
//   chaine   : chaîne de mesure (lumière → capteur → pont → CAN → programme)
//   courbe   : caractéristique à points (par ex. R_p en fonction de E), points surlignés
//   retard   : grandeur réelle et signal d'un capteur trop lent, avec le seuil de décision
//   arduino  : carte Arduino reliée à une DEL, un bouton, un pont diviseur ou l'ordinateur
// Tout est en SVG à largeur fluide (lisible sur téléphone) ; les indices sont de vrais indices (<tspan>), jamais « U_R ».

const TR = '#334155', BLEU = '#2563eb', GRIS = '#94a3b8', ORANGE = '#c2410c', VERT = '#15803d';
const boite = { background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 };

// Texte SVG avec indice : <Ind b="U" i="R" /> donne U avec R en indice
const Ind = ({ b, i }) => <><tspan>{b}</tspan><tspan fontSize="0.75em" dy="3">{i}</tspan><tspan dy="-3"> </tspan></>;
const F = props => <marker id={props.id} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={props.c}/></marker>;

// ── Circuit diviseur de tension ──
//   UG, R, Rp : textes affichés (valeur ou symbole) ; mesure : 'R' | 'Rp' | 'les deux' | null ; can : on montre la liaison vers l'entrée du CAN
function SchemaPont({ UG = 'U_G', R = 'R', Rp = 'R_p', mesure = 'R', can = true, lumiere = true, capteur = 'p', etiquette = '', titre = '' }) {
  const u = useId().replace(/:/g, '');
  // L'élément dont on mesure la tension est en bas (relié à la masse), l'autre en haut
  const bas = mesure === 'Rp' ? 'Rp' : 'R', haut = bas === 'R' ? 'Rp' : 'R';
  const txt = { R, Rp };
  const el = (nom, y0) => {
    const photo = nom === 'Rp';
    return (
      <g key={nom}>
        <rect x="252" y={y0} width="20" height="40" fill="white" stroke={TR} strokeWidth="2"/>
        {photo && lumiere && <g stroke="#ca8a04" strokeWidth="2" fill="none" markerEnd={`url(#${u}or)`}><line x1="336" y1={y0 - 4} x2="278" y2={y0 + 12}/><line x1="336" y1={y0 + 8} x2="278" y2={y0 + 24}/></g>}
        <text x="282" y={y0 + 24 + (photo && lumiere ? 14 : 0)} fontSize="13" fill="#0f172a"><Ind b="R" i={photo ? capteur : ''}/></text>
        {photo && etiquette && <text x="282" y={y0 + 38} fontSize="11.5" fill="#475569">{etiquette}</text>}
        {txt[nom] && !/^R(_p)?$/.test(txt[nom]) && <text x="282" y={y0 + 38 + (photo && lumiere ? 14 : 0)} fontSize="11.5" fill="#475569">{txt[nom]}</text>}
      </g>);
  };
  const surR = mesure === 'R' || mesure === 'les deux', surRp = mesure === 'Rp' || mesure === 'les deux';
  const fleche = (nom, y0, y1) => {
    if (!(mesure === nom || mesure === 'les deux')) return null;
    const c = nom === bas ? BLEU : '#64748b';
    return (
      <g>
        <line x1={nom === bas ? 222 : 204} y1={y1} x2={nom === bas ? 222 : 204} y2={y0 + 3} stroke={c} strokeWidth={nom === bas ? 3 : 2} markerEnd={`url(#${u}${nom === bas ? 'b' : 'g'})`} strokeDasharray={nom === bas ? '' : '5 3'}/>
        <text x={(nom === bas ? 222 : 204) - 7} y={(y0 + y1) / 2 + 4} fontSize="13" fontWeight="700" fill={c} textAnchor="end"><Ind b="U" i={nom === 'R' ? 'R' : (capteur === 'p' ? 'Rp' : capteur)}/></text>
      </g>);
  };
  return (
    <div style={boite} data-schema="pont">
      {titre && <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{titre}</div>}
      <svg viewBox="0 0 360 240" role="img" aria-label={`Pont diviseur de tension : générateur, résistance R et capteur Rp en série${mesure === 'R' || mesure === 'Rp' ? `, on mesure la tension aux bornes de ${mesure === 'R' ? 'R' : 'le capteur'}` : ''}`} style={{ width: '100%', maxWidth: 400, display: 'block', margin: '0 auto' }}>
        <defs><F id={`${u}b`} c={BLEU}/><F id={`${u}g`} c="#64748b"/><F id={`${u}or`} c="#ca8a04"/></defs>
        <g fill="none" stroke={TR} strokeWidth="2">
          <polyline points="95,95 95,30 262,30 262,60"/><line x1="262" y1="100" x2="262" y2="165"/><polyline points="262,205 262,222 95,222 95,125"/>
        </g>
        <circle cx="95" cy="110" r="15" fill="white" stroke={TR} strokeWidth="2"/>
        <text x="95" y="106" fontSize="16" textAnchor="middle" fill="#0f172a">+</text><text x="95" y="124" fontSize="16" textAnchor="middle" fill="#0f172a">−</text>
        <text x="50" y="108" fontSize="14" textAnchor="end" fill="#0f172a"><Ind b="U" i="G"/></text>
        {UG && UG !== 'U_G' && UG.split(' → ').map((l, k) => <text key={k} x="50" y={124 + 13 * k} fontSize="11.5" textAnchor="end" fill="#475569">{k ? '→ ' : ''}{l}</text>)}
        <line x1="58" y1="128" x2="58" y2="94" stroke="#64748b" strokeWidth="2" markerEnd={`url(#${u}g)`}/>
        {el(haut, 60)}{el(bas, 165)}
        <circle cx="262" cy="135" r="3.5" fill={TR}/>
        {can && (surR || surRp) && (
          <g>
            <line x1="262" y1="135" x2="308" y2="135" stroke={TR} strokeWidth="2"/>
            <text x="312" y="131" fontSize="11" fill="#0f172a">vers</text><text x="312" y="144" fontSize="11" fill="#0f172a">le CAN</text>
          </g>)}
        {fleche(bas, 165, 205)}{mesure === 'les deux' && fleche(haut, 60, 100)}
        <text x="95" y="238" fontSize="10" fill="#64748b" textAnchor="middle">masse (0 V)</text>
      </svg>
    </div>);
}

const Note = ({ t }) => (t ? <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.45, marginTop: 4 }}>{avecIndices(t)}</div> : null);

// ── Chaîne de mesure ──
const ETAPES = [['Lumière', 'E (lx)'], ['Capteur', 'Rp (kΩ)'], ['Diviseur', 'UR (V)'], ['CAN', 'N'], ['Programme', 'DEL']];
function ChaineMesure({ actif = [], inconnu = null, note = '' }) {
  const u = useId().replace(/:/g, '');
  const w = 62, g = 12;
  const cases = ETAPES;
  return (
    <div style={boite} data-schema="chaine">
      <svg viewBox="0 0 360 84" role="img" aria-label="Chaîne de mesure : lumière, capteur, pont diviseur, CAN, programme" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
        <defs><F id={`${u}c`} c={TR}/></defs>
        {cases.map(([nom, gr], i) => {
          const x = 1 + i * (w + g), on = actif.includes(i), inc = inconnu === i;
          return (
            <g key={nom}>
              <rect x={x} y="6" width={w} height="46" rx="6" fill={inc ? '#fef3c7' : on ? '#dbeafe' : '#f8fafc'} stroke={inc ? ORANGE : on ? BLEU : '#cbd5e1'} strokeWidth={on || inc ? 2 : 1.2}/>
              <text x={x + w / 2} y="25" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#0f172a">{nom}</text>
              <text x={x + w / 2} y="42" fontSize="10.5" textAnchor="middle" fill={inc ? ORANGE : '#475569'}>{inc ? '?' : gr.replace('Rp', 'Rₚ').replace('UR', 'Uᵣ')}</text>
              {i < cases.length - 1 && <line x1={x + w + 1} y1="29" x2={x + w + g - 1} y2="29" stroke={TR} strokeWidth="1.6" markerEnd={`url(#${u}c)`}/>}
            </g>);
        })}
        <text x="180" y="74" fontSize="10.5" fill="#64748b" textAnchor="middle">chaîne de mesure (sens de lecture : de la lumière au programme)</text>
      </svg>
      <Note t={note}/>
    </div>);
}

// ── Courbe à points ──
const nbf = (v, d = 1) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d });
function Courbe({ note = '', pts, x: [x0, x1, px], y: [y0, y1, py], xnom = 'E', xu = 'lx', ynom = 'Rp', yu = 'kΩ', surligne = [] }) {
  const L = 50, B = 38, T = 12, R = 14, W = 296, H = 150;
  const X = v => L + ((v - x0) / (x1 - x0)) * W, Y = v => T + H - ((v - y0) / (y1 - y0)) * H;
  const gx = [], gy = [];
  for (let v = x0; v <= x1 + 1e-9; v += px) gx.push(+v.toFixed(6));
  for (let v = y0; v <= y1 + 1e-9; v += py) gy.push(+v.toFixed(6));
  const P = pts.map(([a, b]) => [X(a), Y(b)]);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {               // courbe lissée (Catmull-Rom → Bézier)
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return (
    <div style={boite} data-schema="courbe">
      <svg viewBox={`0 0 ${L + W + R} ${T + H + B}`} role="img" aria-label={`Caractéristique : ${ynom} en fonction de ${xnom}`} style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
        {gx.map(v => <g key={'x' + v}><line x1={X(v)} y1={T} x2={X(v)} y2={T + H} stroke="#e2e8f0"/><text x={X(v)} y={T + H + 14} fontSize="11" textAnchor="middle" fill="#334155">{nbf(v, 0)}</text></g>)}
        {gy.map(v => <g key={'y' + v}><line x1={L} y1={Y(v)} x2={L + W} y2={Y(v)} stroke="#e2e8f0"/><text x={L - 5} y={Y(v) + 4} fontSize="11" textAnchor="end" fill="#334155">{nbf(v, 1)}</text></g>)}
        <line x1={L} y1={T} x2={L} y2={T + H} stroke={TR} strokeWidth="1.5"/><line x1={L} y1={T + H} x2={L + W} y2={T + H} stroke={TR} strokeWidth="1.5"/>
        <text x={L + W / 2} y={T + H + 30} fontSize="12" textAnchor="middle" fill="#0f172a">{xnom} ({xu})</text>
        <text x="11" y={T + H / 2} fontSize="12" textAnchor="middle" fill="#0f172a" transform={`rotate(-90 11 ${T + H / 2})`}>{ynom === 'Rp' ? <Ind b="R" i="p"/> : ynom} ({yu})</text>
        <path d={d} fill="none" stroke="#64748b" strokeWidth="2"/>
        {pts.map(([a, b], i) => {
          const on = surligne.includes(i);
          return (
            <g key={i}>
              {on && <g stroke={ORANGE} strokeWidth="1.5" strokeDasharray="4 3"><line x1={X(a)} y1={Y(b)} x2={X(a)} y2={T + H}/><line x1={L} y1={Y(b)} x2={X(a)} y2={Y(b)}/></g>}
              <circle cx={X(a)} cy={Y(b)} r={on ? 5 : 3.5} fill={on ? ORANGE : '#475569'} stroke="white" strokeWidth="1.2"/>
              <text x={i === pts.length - 1 ? X(a) - 7 : X(a) + 7} y={Y(b) - 7} textAnchor={i === pts.length - 1 ? 'end' : 'start'} fontSize="11" fill={on ? ORANGE : '#475569'} fontWeight={on ? 700 : 400}>{nbf(b, 2)} {yu}</text>
            </g>);
        })}
      </svg>
      <Note t={note || 'Courbe lissée passant par les points donnés : entre deux points, la valeur est estimée (interpolation), pas mesurée ; ne pas extrapoler au-delà des points.'}/>
    </div>);
}

// ── Capteur trop lent : grandeur réelle, signal du capteur, seuil ──
function Retard({ annote = false, note = '', sens = 'baisse', tau = 1.6, rampe = false, grandeur = 'éclairement', seuilNom = 'seuil' }) {
  const u = useId().replace(/:/g, '');
  const L = 14, B = 34, T = 14, R = 12, W = 320, H = 130, TMAX = 10, t0 = 2;
  const haut = sens === 'hausse';
  const reel = t => (rampe ? Math.min(1.12, 0.12 + Math.max(0, t - 1) * 0.16) : (t < t0 ? (haut ? 0.12 : 0.88) : (haut ? 0.88 : 0.12)));
  const seuil = rampe ? 0.8 : 0.5;
  const N = 400, dt = TMAX / N, mes = [], re = [];
  let y = reel(0);
  for (let i = 0; i <= N; i++) { const t = i * dt; y += (reel(t) - y) * (dt / tau); mes.push([t, y]); re.push([t, reel(t)]); }
  const X = t => L + (t / TMAX) * W, Y = v => T + H - (v / 1.2) * H;
    const croise = s => { for (let i = 1; i < s.length; i++) { const a = s[i - 1][1] - seuil, b = s[i][1] - seuil; if (a * b <= 0 && a !== b) return s[i][0]; } return null; };
  const tR = croise(re), tM = croise(mes);
  const poly = s => s.map(([t, v]) => `${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  return (
    <div style={boite} data-schema="retard">
      <svg viewBox={`0 0 ${L + W + R} ${T + H + B + 20}`} role="img" aria-label={`Un capteur trop lent : grandeur réelle et valeur mesurée par le capteur, avec le seuil (${grandeur})`} style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
        <defs><F id={`${u}r`} c={TR}/><F id={`${u}rr`} c="#b91c1c"/></defs>
        <line x1={L} y1={T + H} x2={L} y2={T} stroke={TR} strokeWidth="1.5" markerEnd={`url(#${u}r)`}/><line x1={L} y1={T + H} x2={L + W + 4} y2={T + H} stroke={TR} strokeWidth="1.5" markerEnd={`url(#${u}r)`}/>
        <text x={L + W} y={T + H + 14} fontSize="11.5" textAnchor="end" fill="#0f172a">temps</text>
        <line x1={L} y1={Y(seuil)} x2={L + W} y2={Y(seuil)} stroke={ORANGE} strokeWidth="1.5" strokeDasharray="6 4"/>
        <text x={rampe ? L + 4 : L + W} y={Y(seuil) - 5} fontSize="11.5" textAnchor={rampe ? 'start' : 'end'} fill={ORANGE} fontWeight="700">{seuilNom}</text>
        {annote && tR != null && tM != null && (
          <g>
            <line x1={X(tR)} y1={Y(seuil)} x2={X(tR)} y2={T + H} stroke={VERT} strokeWidth="1.5" strokeDasharray="3 3"/>
            <line x1={X(tM)} y1={Y(seuil)} x2={X(tM)} y2={T + H} stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="3 3"/>
            <line x1={X(tR)} y1={T + H + 8} x2={X(tM) - 2} y2={T + H + 8} stroke="#b91c1c" strokeWidth="2" markerEnd={`url(#${u}rr)`}/>
            <text x={(X(tR) + X(tM)) / 2} y={T + H + 22} fontSize="11.5" textAnchor="middle" fill="#b91c1c" fontWeight="700">retard</text>
          </g>)}
        <polyline points={poly(re)} fill="none" stroke={VERT} strokeWidth="2.5"/>
        <polyline points={poly(mes)} fill="none" stroke={BLEU} strokeWidth="2.5" strokeDasharray="1 0"/>
        <text x={L + 6} y={T + 12} fontSize="12" fill="#0f172a" fontWeight="700">{grandeur}</text>
        <g fontSize="11.5" fill="#0f172a">
          <line x1={L} y1={T + H + 40} x2={L + 22} y2={T + H + 40} stroke={VERT} strokeWidth="2.5"/><text x={L + 27} y={T + H + 44}>grandeur réelle</text>
          <line x1={L + 120} y1={T + H + 40} x2={L + 142} y2={T + H + 40} stroke={BLEU} strokeWidth="2.5"/><text x={L + 147} y={T + H + 44}>valeur mesurée</text>
        </g>
      </svg>
      <Note t={note || 'Modèle simplifié : le capteur rattrape la valeur réelle progressivement, comme la charge d’un condensateur. La durée et les échelles sont illustratives.'}/>
    </div>);
}

// ── Carte Arduino ──
function Arduino({ cas = 'led' }) {
  const carte = (
    <g>
      <rect x="8" y="14" width="104" height="112" rx="6" fill="#0e7490" stroke="#164e63" strokeWidth="2"/>
      <text x="60" y="34" fontSize="11" fontWeight="700" textAnchor="middle" fill="white">Carte Arduino</text>
    </g>);
  const broche = (y, nom) => <g><line x1="112" y1={y} x2="150" y2={y} stroke={TR} strokeWidth="2"/><text x="108" y={y + 4} fontSize="11" textAnchor="end" fill="white" fontWeight="700">{nom}</text></g>;
  const masse = (x, y) => <g stroke={TR} strokeWidth="2"><line x1={x} y1={y} x2={x} y2={y + 8}/><line x1={x - 10} y1={y + 8} x2={x + 10} y2={y + 8}/><line x1={x - 6} y1={y + 12} x2={x + 6} y2={y + 12}/><line x1={x - 2} y1={y + 16} x2={x + 2} y2={y + 16}/></g>;
  let corps = null, legende = '';
  if (cas === 'led') {
    legende = 'montage : carte, résistance et DEL';
    corps = <g>{broche(60, '11')}
      <rect x="150" y="52" width="40" height="16" fill="white" stroke={TR} strokeWidth="2"/><line x1="190" y1="60" x2="230" y2="60" stroke={TR} strokeWidth="2"/>
      <polygon points="230,48 230,72 254,60" fill="#fde68a" stroke={TR} strokeWidth="2"/><line x1="254" y1="46" x2="254" y2="74" stroke={TR} strokeWidth="2.5"/><line x1="254" y1="60" x2="290" y2="60" stroke={TR} strokeWidth="2"/>
      <line x1="290" y1="60" x2="290" y2="96" stroke={TR} strokeWidth="2"/>{masse(290, 96)}
      <text x="170" y="86" fontSize="10.5" textAnchor="middle" fill="#334155">résistance</text><text x="242" y="42" fontSize="11" fontWeight="700" textAnchor="middle" fill="#0f172a">DEL</text></g>;
  } else if (cas === 'bouton') {
    legende = 'montage : carte et bouton poussoir';
    corps = <g>{broche(60, '2')}
      <line x1="150" y1="60" x2="205" y2="60" stroke={TR} strokeWidth="2"/><circle cx="160" cy="60" r="3.5" fill={TR}/>
      <line x1="160" y1="14" x2="160" y2="22" stroke={TR} strokeWidth="2"/><rect x="152" y="22" width="16" height="26" fill="white" stroke={TR} strokeWidth="2"/><line x1="160" y1="48" x2="160" y2="60" stroke={TR} strokeWidth="2"/>
      <text x="172" y="16" fontSize="11" fill="#0f172a">5 V</text><text x="172" y="40" fontSize="11" fill="#334155">résistance</text>
      <circle cx="205" cy="60" r="3.5" fill={TR}/><line x1="205" y1="60" x2="240" y2="42" stroke={TR} strokeWidth="2"/><circle cx="250" cy="60" r="3.5" fill={TR}/>
      <line x1="250" y1="60" x2="290" y2="60" stroke={TR} strokeWidth="2"/><line x1="290" y1="60" x2="290" y2="96" stroke={TR} strokeWidth="2"/>{masse(290, 96)}
      <text x="228" y="86" fontSize="11" fontWeight="700" textAnchor="middle" fill="#0f172a">bouton poussoir</text></g>;
  } else if (cas === 'analog') {
    legende = 'montage : carte et pont diviseur de tension';
    corps = <g>{broche(80, 'A0')}
      <line x1="150" y1="80" x2="250" y2="80" stroke={TR} strokeWidth="2"/><circle cx="250" cy="80" r="3.5" fill={TR}/>
      <line x1="250" y1="22" x2="250" y2="38" stroke={TR} strokeWidth="2"/><text x="258" y="30" fontSize="10.5" fill="#0f172a">5 V</text>
      <rect x="240" y="38" width="20" height="30" fill="white" stroke={TR} strokeWidth="2"/><line x1="250" y1="68" x2="250" y2="92" stroke={TR} strokeWidth="2"/>
      <rect x="240" y="92" width="20" height="30" fill="white" stroke={TR} strokeWidth="2"/><line x1="250" y1="122" x2="250" y2="128" stroke={TR} strokeWidth="2"/>{masse(250, 128)}
      <text x="272" y="57" fontSize="11" fill="#0f172a"><Ind b="R" i="p"/></text><text x="272" y="111" fontSize="11" fill="#0f172a">R</text>
      <text x="228" y="72" fontSize="11" fontWeight="700" fill={BLEU} textAnchor="end"><Ind b="U" i="R"/></text></g>;
  } else {
    legende = 'carte reliée à l’ordinateur par le câble USB';
    corps = <g><line x1="112" y1="70" x2="188" y2="70" stroke={TR} strokeWidth="3" strokeDasharray="2 0"/><text x="150" y="62" fontSize="10.5" textAnchor="middle" fill="#334155">USB</text>
      <rect x="190" y="30" width="150" height="86" rx="6" fill="#0f172a" stroke={TR} strokeWidth="2"/><text x="265" y="48" fontSize="10" textAnchor="middle" fill="#94a3b8">Moniteur série</text>
      <rect x="204" y="66" width="90" height="7" rx="3" fill="#4ade80"/><rect x="204" y="86" width="70" height="7" rx="3" fill="#4ade80"/></g>;
  }
  return (
    <div style={boite} data-schema="arduino">
      <svg viewBox="0 0 360 160" role="img" aria-label={`Carte Arduino : ${legende}`} style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
        {carte}{corps}
        <text x="180" y="152" fontSize="12" textAnchor="middle" fill="#475569">{legende}</text>
      </svg>
    </div>);
}


// ── Essai : on fait varier une grandeur du pont diviseur et on lit les tensions (après la prédiction) ──
// variable : 'Rp' (R_p varie), 'R' (R varie) ou 'UG' (U_G varie) ; les autres grandeurs restent fixes.
const fr = (v, d = 2) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
function Essai({ variable = 'Rp', UG = 5, R = 1, Rp = 1.5, min, max, step = 0.05, mesure = 'R', consigne = '', n = false }) {
  const init = variable === 'Rp' ? Rp : variable === 'R' ? R : UG;
  const [x, setX] = useState(init);
  const g = variable === 'UG' ? x : UG, r = variable === 'R' ? x : R, rp = variable === 'Rp' ? x : Rp;
  const ur = g * r / (r + rp), urp = g * rp / (r + rp);
  const u = mesure === 'Rp' ? urp : ur, autre = mesure === 'Rp' ? ur : urp;
  const nom = variable === 'Rp' ? 'R_p' : variable === 'R' ? 'R' : 'U_G', unite = variable === 'UG' ? 'V' : 'kΩ';
  const nomLong = variable === 'Rp' ? 'résistance de la photorésistance' : variable === 'R' ? 'résistance R' : 'tension d’alimentation';
  const lib = mesure === 'Rp' ? 'U_Rp' : 'U_R', libAutre = mesure === 'Rp' ? 'U_R' : 'U_Rp';
  const part = 100 * ur / g;
  const N = Math.min(1023, Math.max(0, Math.round(u * 1023 / 5)));
  const txt = `${fr(x, variable === 'UG' ? 1 : 2)} ${unite}`;
  return (
    <div style={boite} data-schema="essai">
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>À vous de tester</div>
      <div style={{ fontSize: 13, color: '#475569', margin: '2px 0 6px', lineHeight: 1.45 }}>{avecIndices(consigne || `Faites varier ${nom} et comparez avec votre prédiction.`)}</div>
      <label style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>
        <span style={{ fontWeight: 700 }}>{avecIndices(nom)} = {txt}</span>
        <input type="range" min={min} max={max} step={step} value={x} onChange={e => setX(Number(e.target.value))} aria-label={`Valeur de la ${nomLong}`} aria-valuetext={txt}
          style={{ width: '100%', accentColor: BLEU, margin: '6px 0 2px' }}/>
      </label>
      <div style={{ position: 'relative', height: 22, borderRadius: 4, overflow: 'hidden', border: `1px solid ${KIT.bord}`, display: 'flex', margin: '6px 0' }} role="img"
        aria-label={`Répartition de la tension d’alimentation : ${fr(part, 0)} % aux bornes de R, ${fr(100 - part, 0)} % aux bornes de la photorésistance`}>
        <div style={{ width: `${part}%`, background: mesure === 'Rp' ? '#cbd5e1' : '#93c5fd', transition: 'width .1s' }}/>
        <div style={{ flex: 1, background: mesure === 'Rp' ? '#93c5fd' : '#cbd5e1' }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b' }}><span>{avecIndices('U_R')} (aux bornes de R)</span><span>{avecIndices('U_Rp')}</span></div>
      <div style={{ fontSize: 14.5, color: '#0f172a', marginTop: 6, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, color: BLEU }}>{avecIndices(lib)} = {fr(u)} V{n ? <> → N = {N}</> : null}</div>
        <div style={{ color: '#475569' }}>{avecIndices(libAutre)} = {fr(autre)} V{variable === 'UG' ? '' : <> · {avecIndices('U_G')} = {fr(g, 1)} V</>}</div>
      </div>
      <Note t={n ? 'Hypothèses : le CAN ne prélève pas de courant (impédance d’entrée très grande) ; N = U × 1 023 / 5,0, arrondi à l’entier.'
        : variable === 'UG' ? 'La barre ne bouge pas : la part de U_G prise par R ne dépend que de R et de R_p. Seule la tension totale change.'
        : 'Hypothèse : tout ce qui n’est pas manipulé reste constant, et la mesure ne perturbe pas le montage.'}/>
    </div>);
}

// ── Répartition ──
const DESSINS = { pont: SchemaPont, chaine: ChaineMesure, courbe: Courbe, retard: Retard, arduino: Arduino, essai: Essai };
export function Visuel({ schema, revele = false }) {
  if (!schema) return null;
  const liste = Array.isArray(schema) ? schema : [schema];
  return <div data-visuels style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0 0' }}>
    {liste.map((s, i) => { const D = DESSINS[s.type]; if (!D || (s.seulementApres && !revele)) return null; const base = { ...s }; delete base.apres; delete base.seulementApres; return <D key={i} {...base} {...(revele ? s.apres : {})}/>; })}
  </div>;
}

// ── Énoncé en paragraphes ──
// Si l'exercice fournit presentation = { contexte, liste: [[nom, valeur]…], question }, on affiche contexte, puis les données en liste, puis la question isolée.
// Sinon, un énoncé long est découpé en phrases (une par ligne) et la dernière phrase, si c'est une question, est mise en évidence.
const coupe = t => String(t).split(/(?<=[.!?])\s+(?=[A-ZÉÈÀÂÎÔÛÇ«“(])/).map(s => s.trim()).filter(Boolean);
export function EnonceLisible({ it, T }) {
  const base = { fontSize: 15, color: KIT.txt, lineHeight: 1.6 };
  const questionBox = q => <div data-question style={{ ...base, fontWeight: 700, margin: '8px 0 0', padding: '6px 10px', background: '#fff7ed', borderLeft: '4px solid #fb923c', borderRadius: 4 }}>{T(q)}</div>;
  const p = it.presentation;
  if (p) {
    const ctx = Array.isArray(p.contexte) ? p.contexte : coupe(p.contexte || '');
    return (
      <div>
        {ctx.map((s, i) => <p key={i} style={{ ...base, margin: '0 0 6px' }}>{T(s)}</p>)}
        {p.liste && p.liste.length > 0 && (
          <ul data-donnees style={{ margin: '4px 0 6px', padding: '6px 10px 6px 26px', background: '#f1f5f9', borderRadius: 6, ...base, lineHeight: 1.7 }}>
            {p.liste.map(([a, b], i) => <li key={i}>{a ? <span style={{ color: KIT.txt2 }}>{T(a)} : </span> : null}<b>{T(b)}</b></li>)}
          </ul>)}
        {(Array.isArray(p.suite) ? p.suite : coupe(p.suite || '')).map((t, i) => <p key={'s' + i} style={{ ...base, margin: '0 0 6px' }}>{T(t)}</p>)}
        {p.question && questionBox(p.question)}
      </div>);
  }
  const texte = it.enonce || it.contexte || '';
  const phr = texte.length > 150 ? coupe(texte) : [texte];
  const derniere = phr[phr.length - 1], estQuestion = phr.length > 1 && /\?$/.test(derniere);
  const corps = estQuestion ? phr.slice(0, -1) : phr;
  return (
    <div>
      {corps.map((s, i) => <p key={i} style={{ ...base, margin: '0 0 6px' }}>{T(s)}</p>)}
      {estQuestion && questionBox(derniere)}
    </div>);
}
