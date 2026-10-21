import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { nf, NB } from "./Distillation";
import { Pic } from "../Pictos";

const SIM_ID = 44;
declarerDefis(SIM_ID, [['principal', 'Positionner l’axe : pas, tours et durée']]);

// ====================================================
//  SIM 44 — MOTEUR PAS À PAS : du stator au rotor, puis du rotor à l'axe
// ====================================================

const PHI = [0, 90, 180, 270];                  // position des bobines 1 (haut), 2 (droite), 3 (bas), 4 (gauche)
const SEQS = {
  complet: { nom: 'Pas complet', d: 2, n0: 0, seq: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] },
  demi: { nom: 'Demi-pas', d: 1, n0: 0, seq: [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1]] },
  force: { nom: 'Pas complet, force maximale', d: 2, n0: 1, seq: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]] },
};
const W0 = 2 * Math.PI * 2.2, ZETA = 0.3;       // rotor : oscillateur amorti autour de la position d'équilibre
const N_AXE = 4096;                              // demi-pas pour un tour de l'axe
const T_DELAY = 0.005;                           // delay(5) : 5 ms entre deux pas
const ANG_AXE = 360 / N_AXE;                     // 0,0879 ° par demi-pas

function champ(c) {
  let bx = 0, by = 0;
  c.forEach((v, i) => { if (v) { const p = PHI[i] * Math.PI / 180; bx += Math.sin(p); by += Math.cos(p); } });
  return { bx, by, B: Math.hypot(bx, by), ang: Math.atan2(bx, by) * 180 / Math.PI };
}
const mod = (a, m) => ((a % m) + m) % m;
const ecartAngle = (a, b) => { const e = mod(a - b + 180, 360) - 180; return e; };
const memeEtat = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// Avance la séquence d'un pas (dir = +1 sens horaire, -1 antihoraire)
function avancer(s) {
  const q = SEQS[s.mode], L = q.seq.length;
  s.idx = mod(s.idx + s.dir, L);
  s.n += s.dir * q.d;
  s.cmd += 1;
  s.coils = q.seq[s.idx].slice();
}
function remiseAZero(s, mode = s.mode) {
  const q = SEQS[mode];
  s.mode = mode; s.idx = 0; s.n = q.n0; s.cmd = 0; s.acc = 0;
  s.coils = q.seq[0].slice();
  s.th = champ(s.coils).ang * Math.PI / 180; s.om = 0;
}

// ---------- Schéma : stator (4 bobines) et rotor (aimant) ----------
export function Moteur({ coils, thDeg, cible, onBobine, surligne }) {
  const f = champ(coils), k = 36;
  const pos = [[180, 46, 0], [314, 180, 90], [180, 314, 180], [46, 180, 270]];
  const fl = f.B > 0 ? (() => {
    const L = k * f.B, ex = 180 + L * Math.sin(f.ang * Math.PI / 180), ey = 180 - L * Math.cos(f.ang * Math.PI / 180);
    return <line x1="180" y1="180" x2={ex} y2={ey} stroke="#ea580c" strokeWidth="5" strokeLinecap="round" markerEnd="url(#pta)"/>;
  })() : null;
  return (
    <svg viewBox="0 0 360 360" style={{ width: '100%', maxWidth: 440, display: 'block', margin: '0 auto' }} role="img"
      aria-label="Moteur pas à pas : quatre bobines fixes (stator) autour d’un aimant mobile (rotor)">
      <defs>
        <marker id="pta" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6 z" fill="#ea580c"/></marker>
      </defs>
      <circle cx="180" cy="180" r="160" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2"/>
      <text x="8" y="16" fontSize="11" fill="#64748b" fontWeight="600">STATOR (fixe)</text>
      {pos.map(([cx, cy, a], i) => {
        const on = coils[i];
        const hor = a === 0 || a === 180;
        const w = hor ? 84 : 44, h = hor ? 44 : 84;
        const dx = Math.sin(a * Math.PI / 180), dy = -Math.cos(a * Math.PI / 180);   // direction du centre vers l'extérieur
        const interne = [cx - dx * (hor ? 0 : 22), cy - dy * (hor ? 22 : 0)];
        return (
          <g key={i} onClick={() => onBobine && onBobine(i)} style={{ cursor: onBobine ? 'pointer' : 'default' }}>
            <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="8" fill={on ? '#fde68a' : '#e2e8f0'}
              stroke={on ? '#d97706' : '#64748b'} strokeWidth={on ? 3 : 1.5} style={on ? { filter: 'drop-shadow(0 0 6px #f59e0b)' } : {}}/>
            {[-2, -1, 0, 1, 2].map(j => hor
              ? <line key={j} x1={cx + j * 14 - 4} x2={cx + j * 14 + 4} y1={cy - 12} y2={cy + 12} stroke={on ? '#b45309' : '#94a3b8'} strokeWidth="2"/>
              : <line key={j} y1={cy + j * 14 - 4} y2={cy + j * 14 + 4} x1={cx - 12} x2={cx + 12} stroke={on ? '#b45309' : '#94a3b8'} strokeWidth="2"/>)}
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={on ? '#92400e' : '#475569'}>{i + 1}</text>
            {on ? <>
              <circle cx={interne[0]} cy={interne[1]} r="9" fill="#2563eb"/><text x={interne[0]} y={interne[1] + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="white">S</text>
            </> : null}
          </g>);
      })}
      {cible != null && <line x1="180" y1="180" x2={180 + 62 * Math.sin(cible * Math.PI / 180)} y2={180 - 62 * Math.cos(cible * Math.PI / 180)} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4"/>}
      <g transform={`translate(180 180) rotate(${thDeg})`}>
        <rect x="-17" y="-56" width="34" height="56" rx="6" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.5"/>
        <rect x="-17" y="0" width="34" height="56" rx="6" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5"/>
        <text x="0" y="-30" textAnchor="middle" fontSize="18" fontWeight="800" fill="white">N</text>
        <text x="0" y="40" textAnchor="middle" fontSize="18" fontWeight="800" fill="white">S</text>
        <circle cx="0" cy="0" r="5" fill="#0f172a"/>
      </g>
      {fl}
      <text x="180" y="352" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">ROTOR : aimant mobile</text>
      {surligne}
    </svg>);
}

// ---------- Chronogramme : tensions appliquées aux 4 bobines ----------
export function Chrono({ seq, idx, grille, setGrille, editable, verifie }) {
  const L = seq.length;
  const cell = (b, j) => {
    const val = editable ? grille[j][b] : seq[j][b];
    const bon = verifie && editable && grille[j][b] === seq[j][b];
    const mauvais = verifie && editable && grille[j][b] !== seq[j][b];
    return (
      <td key={j} style={{ padding: 0 }}>
        <button disabled={!editable} onClick={() => setGrille(g => g.map((c, jj) => jj === j ? c.map((v, bb) => bb === b ? 1 - v : v) : c))}
          aria-label={`Bobine ${b + 1}, étape ${j + 1} : ${val ? 'alimentée' : 'éteinte'}`}
          style={{ width: 34, height: 28, border: `1px solid ${mauvais ? '#dc2626' : bon ? '#16a34a' : KIT.bord}`, borderRadius: 4, margin: 1,
            cursor: editable ? 'pointer' : 'default', fontWeight: 800, fontSize: 12,
            background: val ? '#f59e0b' : 'white', color: val ? 'white' : '#94a3b8' }}>{val ? '5 V' : '0'}</button>
      </td>);
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr><th style={{ textAlign: 'left', paddingRight: 8, color: KIT.txt2 }}>Pas n°</th>
          {seq.map((_, j) => <th key={j} style={{ padding: '2px 0', width: 36, color: j === idx ? '#b45309' : KIT.txt2,
            background: j === idx ? '#fef3c7' : 'transparent', borderRadius: 4 }}>{j + 1}</th>)}</tr></thead>
        <tbody>{[0, 1, 2, 3].map(b => (
          <tr key={b}><td style={{ paddingRight: 8, fontWeight: 700, color: KIT.txt2, whiteSpace: 'nowrap' }}>Bobine {b + 1}</td>
            {Array.from({ length: L }, (_, j) => cell(b, j))}</tr>))}</tbody>
      </table>
    </div>);
}

// ---------- Rotor → axe : le réducteur ----------
function Reducteur({ n2 }) {
  const thR = n2 * 45, thA = n2 * ANG_AXE, tours = n2 / 8;
  const dents = (r, nb, c) => Array.from({ length: nb }, (_, i) => <rect key={i} x={-3} y={-r - 6} width="6" height="9" fill={c} transform={`rotate(${i * 360 / nb})`}/>);
  return (
    <svg viewBox="0 0 560 300" style={{ width: '100%', maxWidth: 640, display: 'block', margin: '0 auto' }} role="img"
      aria-label="Le rotor tourne vite, un réducteur à engrenages fait tourner l’axe lentement">
      <defs><marker id="rfl" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#0f172a"/></marker></defs>
      <g transform="translate(90 150)">
        <circle r="56" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2"/>
        <g transform={`rotate(${thR})`}>
          <rect x="-12" y="-44" width="24" height="44" rx="5" fill="#dc2626"/><rect x="-12" y="0" width="24" height="44" rx="5" fill="#2563eb"/>
          <text y="-22" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">N</text><text y="32" textAnchor="middle" fontSize="14" fontWeight="800" fill="white">S</text>
        </g>
        <text y="82" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Rotor</text>
      </g>
      <g transform="translate(262 150)">
        <rect x="-62" y="-70" width="124" height="140" rx="12" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4"/>
        <g transform={`translate(-22 -8) rotate(${thR / 8})`} fill="#94a3b8" stroke="#475569"><circle r="14"/>{dents(14, 8, '#475569')}</g>
        <g transform={`translate(18 14) rotate(${-thR / 64})`} fill="#cbd5e1" stroke="#475569"><circle r="28"/>{dents(28, 16, '#475569')}</g>
        <text y="-78" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Réducteur à engrenages</text>
        <text y="96" textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">1 tour de l’axe = 512 tours du rotor</text>
      </g>
      <line x1="150" y1="150" x2="198" y2="150" stroke="#0f172a" strokeWidth="2" markerEnd="url(#rfl)"/>
      <line x1="326" y1="150" x2="400" y2="150" stroke="#0f172a" strokeWidth="2" markerEnd="url(#rfl)"/>
      <g transform="translate(470 150)">
        <circle r="64" fill="#ecfeff" stroke="#0e7490" strokeWidth="2.5"/>
        {Array.from({ length: 12 }, (_, i) => <line key={i} y1="-64" y2="-56" stroke="#0e7490" strokeWidth="2" transform={`rotate(${i * 30})`}/>)}
        <path d={`M0,-48 A48,48 0 ${mod(thA, 360) > 180 ? 1 : 0} 1 ${48 * Math.sin(mod(thA, 360) * Math.PI / 180)},${-48 * Math.cos(mod(thA, 360) * Math.PI / 180)}`}
          fill="none" stroke="#06b6d4" strokeWidth="6" opacity="0.5"/>
        <g transform={`rotate(${thA})`}><line y2="-56" stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/><circle r="6" fill="#0f172a"/></g>
        <text y="88" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0f172a">Axe de sortie</text>
      </g>
      <text x="90" y="20" textAnchor="middle" fontSize="12" fill="#b91c1c" fontWeight="700">{nf(tours, 1)} tours</text>
      <text x="470" y="20" textAnchor="middle" fontSize="12" fill="#0e7490" fontWeight="700">{nf(mod(thA, 360), 1)}{NB}°</text>
    </svg>);
}

export function SimulationMoteurPasAPas({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('pap-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('pap-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [vue, setVue] = useState('stator');
  const [tPas, setTPas] = useState(0.6);
  const [rate, setRate] = useState(8);               // demi-pas par seconde d'animation (vue axe)
  const [modeAxe, setModeAxe] = useState('demi');   // pour les durées (vue axe)
  const [grille, setGrille] = useState(() => Array.from({ length: 8 }, () => [0, 0, 0, 0]));
  const [grilleVerif, setGrilleVerif] = useState(false);
  const [, setT] = useState(0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';

  const S = useRef(null);
  if (!S.current) { S.current = { mode: 'complet', idx: 0, n: 0, cmd: 0, acc: 0, dir: 1, playing: false, coils: [1, 0, 0, 0], th: 0, om: 0, n2: 0, playing2: false, vue: 'stator', tPas: 0.6, rate: 8 }; remiseAZero(S.current, 'complet'); }
  const s = S.current;
  s.tPas = tPas; s.rate = rate; s.vue = vue;

  useEffect(() => {
    let raf, last = performance.now();
    const boucle = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const st = S.current;
      let bouge = false;
      if (st.vue === 'stator') {
        if (st.playing) { st.acc += dt; while (st.acc >= st.tPas) { st.acc -= st.tPas; avancer(st); } bouge = true; }
        const f = champ(st.coils);
        const nsub = Math.max(1, Math.round(dt / 0.002)), hh = dt / nsub;
        for (let i = 0; i < nsub; i++) {
          const a = -W0 * W0 * (Math.sin(st.th) * f.by - Math.cos(st.th) * f.bx) - 2 * ZETA * W0 * st.om;
          st.om += a * hh; st.th += st.om * hh;
        }
        if (Math.abs(st.om) > 0.005) bouge = true;
      } else if (st.playing2) {
        st.n2 = Math.min(N_AXE * 2, st.n2 + st.rate * dt);
        if (st.n2 >= N_AXE * 2) st.playing2 = false;
        bouge = true;
      }
      if (bouge || st.sale) { st.sale = false; setT(t => (t + 1) % 1e9); }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, []);

  const maj = () => { S.current.sale = true; setT(t => (t + 1) % 1e9); };
  const thDeg = s.th * 180 / Math.PI;
  const f = champ(s.coils);
  const alignee = f.B > 0 && Math.abs(ecartAngle(thDeg, f.ang)) < 4 && Math.abs(s.om) < 0.25;
  const seqMode = SEQS[s.mode];

  const lecture = () => { s.playing = !s.playing; s.acc = 0; maj(); };
  const pasSuivant = () => { s.playing = false; avancer(s); maj(); };
  const choisirMode = m => { s.playing = false; remiseAZero(s, m); maj(); };
  const bobine = i => { s.playing = false; s.coils = s.coils.map((v, j) => j === i ? 1 - v : v); maj(); };
  const toutEteindre = () => { s.playing = false; s.coils = [0, 0, 0, 0]; maj(); };
  const sens = () => { s.dir = -s.dir; maj(); };

  const changerVue = v => { setVue(v); s.vue = v; s.playing = false; s.playing2 = false; maj(); };
  const lecture2 = () => { if (s.n2 >= N_AXE * 2) s.n2 = 0; s.playing2 = !s.playing2; maj(); };
  const raz2 = () => { s.playing2 = false; s.n2 = 0; maj(); };

  const n2 = s.n2;
  const dN = modeAxe === 'demi' ? 1 : 2;
  const pasCmd2 = Math.floor(n2 / dN);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const grilleDemi = SEQS.demi.seq;
  const grilleOk = grille.every((c, j) => memeEtat(c, grilleDemi[j]));
  const etape = guide.etape;
  const ETAPES = [
    { id: 'principe', titre: 'Le stator et le rotor', focus: ['schema'],
      texte: <>Le moteur pas à pas comporte une partie <strong>fixe</strong>, le <strong>stator</strong>, formé de 4 bobines placées à 90° les unes des autres, et une partie <strong>mobile</strong>, le <strong>rotor</strong>, qui est un aimant (pôle N rouge, pôle S bleu). Le microcontrôleur n’alimente que certaines bobines à la fois.</>,
      tache: { type: 'qcm', q: 'Quelle pièce est fixe ?', options: ['le stator : les 4 bobines', 'le rotor : l’aimant', 'l’axe de sortie'], bonne: 0,
        expl: 'Les bobines sont fixes et c’est l’aimant (rotor) qui tourne, à l’intérieur.' } },
    { id: 'bobine1', titre: 'Alimenter la bobine 1', focus: ['schema', 'commandes'],
      texte: <>Une bobine parcourue par un courant crée un <strong>champ magnétique</strong> (flèche orange). Le rotor, qui est un aimant, s’oriente dans le sens du champ : son pôle N se tourne vers la bobine alimentée. Alimentez la seule bobine 1 (cliquez sur la bobine ou sur son bouton) et observez le rotor.</>,
      tache: { type: 'action', ok: memeEtat(s.coils, [1, 0, 0, 0]) && alignee && !s.playing, label: 'Alimenter la bobine 1',
        faire: () => { s.playing = false; s.coils = [1, 0, 0, 0]; maj(); },
        consigne: memeEtat(s.coils, [1, 0, 0, 0]) ? 'Attendez que le rotor se stabilise' : 'Alimentez seulement la bobine 1' } },
    { id: 'bobine2', titre: 'Passer à la bobine 2', focus: ['schema', 'commandes'],
      texte: <>On éteint la bobine 1 et on alimente la bobine 2 (à droite). Le champ change de direction : le rotor tourne pour se réaligner.</>,
      tache: { type: 'action', ok: memeEtat(s.coils, [0, 1, 0, 0]) && alignee && !s.playing, label: 'Alimenter la bobine 2',
        faire: () => { s.playing = false; s.coils = [0, 1, 0, 0]; maj(); },
        consigne: memeEtat(s.coils, [0, 1, 0, 0]) ? 'Attendez que le rotor se stabilise' : 'Éteignez la bobine 1 et alimentez seulement la bobine 2' } },
    { id: 'angle', titre: 'De quel angle a-t-il tourné ?', focus: ['schema'],
      texte: <>Le rotor était aligné sur la bobine 1 (en haut), il est maintenant aligné sur la bobine 2 (à droite).</>,
      tache: { type: 'num', q: 'Angle dont le rotor a tourné en passant de la bobine 1 à la bobine 2', unite: '°', vrai: 90, tol: 0.03, affiche: v => nf(v, 0), cs: 2,
        expl: 'Les bobines sont à 90° l’une de l’autre : le rotor tourne d’un quart de tour. C’est un « pas ».' } },
    { id: 'complet', titre: 'La séquence 1 – 2 – 3 – 4', focus: ['schema', 'commandes', 'chrono'],
      texte: <>En alimentant les bobines l’une après l’autre dans l’ordre 1-2-3-4, le champ « tourne » et entraîne le rotor : c’est le <strong>pas complet</strong>. Lancez la séquence et observez au moins quatre pas, ainsi que le chronogramme qui indique quelle bobine est alimentée à chaque pas.</>,
      tache: { type: 'action', ok: s.mode === 'complet' && s.cmd >= 4, label: 'Lancer la séquence en pas complet',
        faire: () => { remiseAZero(s, 'complet'); s.dir = 1; s.playing = true; maj(); },
        consigne: s.mode !== 'complet' ? 'Choisissez « Pas complet »' : 'Lancez la lecture et attendez 4 pas' } },
    { id: 'tour', titre: 'Un tour du rotor', focus: ['schema'],
      texte: <>À chaque pas, le rotor tourne d’un quart de tour.</>,
      tache: { type: 'num', q: 'Nombre de pas complets pour un tour du rotor', unite: '', vrai: 4, tol: 0.01, affiche: v => nf(v, 0), cs: 1,
        expl: '360° / 90° = 4 pas complets pour un tour.' } },
    { id: 'chrono', titre: 'Le chronogramme du demi-pas', focus: ['chrono'],
      texte: <>On peut obtenir des positions intermédiaires en <strong>alimentant parfois deux bobines voisines</strong> : le champ résultant pointe entre les deux. La séquence du demi-pas comporte 8 étapes : une bobine, puis deux, puis une, etc., en partant de la bobine 1 seule. <strong>Complétez le tableau</strong> (cliquez sur les cases : 5{NB}V = alimentée, 0 = éteinte), puis vérifiez.</>,
      tache: { type: 'action', ok: grilleOk && grilleVerif, label: 'Voir la solution', faire: () => { setGrille(grilleDemi.map(c => c.slice())); setGrilleVerif(true); },
        consigne: grilleOk ? (grilleVerif ? null : 'Appuyez sur « Vérifier le tableau »') : 'Complétez le tableau puis appuyez sur « Vérifier le tableau »' } },
    { id: 'demi', titre: 'Lancer le demi-pas', focus: ['schema', 'commandes', 'chrono'],
      texte: <>Lancez maintenant cette séquence et observez le rotor : le champ pointe tantôt vers une bobine, tantôt entre deux.</>,
      tache: { type: 'action', ok: s.mode === 'demi' && s.cmd >= 8, label: 'Lancer la séquence en demi-pas',
        faire: () => { remiseAZero(s, 'demi'); s.dir = 1; s.playing = true; maj(); },
        consigne: s.mode !== 'demi' ? 'Choisissez « Demi-pas »' : 'Lancez la lecture et attendez 8 pas' } },
    { id: 'angledemi', titre: 'L’angle d’un demi-pas', focus: ['schema'],
      texte: <>Entre deux positions successives du rotor, il y a maintenant moitié moins d’angle qu’en pas complet.</>,
      tache: { type: 'num', q: 'Angle dont le rotor tourne à chaque demi-pas', unite: '°', vrai: 45, tol: 0.02, affiche: v => nf(v, 0), cs: 2,
        expl: '90° / 2 = 45° : il faut 8 demi-pas pour un tour du rotor. Le positionnement est deux fois plus fin.' } },
    { id: 'force', titre: 'Pas complet à force maximale', focus: ['schema', 'commandes', 'mesures'],
      texte: <>Il existe une autre façon de faire des pas complets : alimenter <strong>deux bobines voisines</strong> à chaque pas (1+2, puis 2+3, puis 3+4, puis 4+1). Le rotor fait toujours des quarts de tour, mais le champ résultant est plus intense : le moteur est plus puissant. Lancez cette séquence et lisez la valeur du champ résultant.</>,
      tache: { type: 'action', ok: s.mode === 'force' && s.cmd >= 4, label: 'Lancer le pas complet à force maximale',
        faire: () => { remiseAZero(s, 'force'); s.dir = 1; s.playing = true; maj(); },
        consigne: s.mode !== 'force' ? 'Choisissez « Force maximale »' : 'Lancez la lecture et attendez 4 pas' } },
    { id: 'champ', titre: 'Le champ de deux bobines', focus: ['mesures'],
      texte: <>Une seule bobine crée un champ d’intensité 1 (unité : le champ d’une bobine). Deux bobines voisines, perpendiculaires, créent deux vecteurs champ à 90° : on les <strong>additionne comme des vecteurs</strong>.</>,
      tache: { type: 'num', q: 'Intensité du champ résultant de deux bobines voisines (en unité du champ d’une bobine)', unite: '', vrai: Math.SQRT2, tol: 0.03, affiche: v => nf(v, 2), cs: 3,
        pieges: [[2, 'Les deux champs ne sont pas dans la même direction : on ne peut pas simplement additionner les intensités.']],
        expl: 'Deux vecteurs perpendiculaires de norme 1 : la norme de la somme est √2 ≈ 1,41, soit 41 % de plus.' } },
    { id: 'boucle', titre: 'Le rotor est-il surveillé ?', focus: ['schema'],
      texte: <>Dans le montage étudié, aucun capteur ne mesure la position du rotor.</>,
      tache: { type: 'qcm', q: 'Que fait le microcontrôleur ?', options: ['il compte les pas commandés et suppose que le rotor les a suivis (boucle ouverte)', 'il mesure l’angle réel et corrige', 'il ne commande qu’une seule bobine'], bonne: 0,
        expl: 'La commande est en boucle ouverte : si le moteur est trop chargé ou trop rapide, il peut perdre des pas sans que le programme le sache. Ici, le modèle suppose que le rotor suit toujours.' } },
    { id: 'axe', titre: 'Du rotor à l’axe', focus: ['commandes'],
      texte: <>Le rotor ne fait pas tourner directement l’axe de sortie : entre les deux, un <strong>réducteur à engrenages</strong> démultiplie le mouvement. Passez à la vue « Du rotor à l’axe ».</>,
      tache: { type: 'action', ok: vue === 'axe', label: 'Aller à la vue « Du rotor à l’axe »', faire: () => changerVue('axe'), consigne: 'Cliquez sur l’onglet « Du rotor à l’axe »' } },
    { id: 'n4096', titre: 'Combien de demi-pas pour un tour d’axe ?', focus: ['reducteur', 'compteurs'],
      texte: <>La documentation du moteur indique : <strong>à chaque demi-pas du rotor, l’axe tourne de 0,0879°</strong> (valeur exacte : 5,625°/64). Lancez l’animation pour voir l’aiguille de l’axe avancer lentement, puis calculez.</>,
      tache: { type: 'num', q: 'Nombre de demi-pas pour que l’axe fasse un tour (360°)', unite: '', vrai: N_AXE, tol: 0.005, affiche: v => nf(v, 0), cs: 4,
        pieges: [[4000, 'Avec 0,09° (valeur arrondie) vous trouvez 4000 : gardez 0,0879° pour obtenir 4096.']],
        expl: '360° / 0,0879° ≈ 4096 demi-pas.' } },
    { id: 'tours', titre: 'Combien de tours du rotor ?', focus: ['compteurs'],
      texte: <>Il faut 8 demi-pas (de 45°) pour un tour du rotor.</>,
      tache: { type: 'num', q: 'Nombre de tours du rotor pour un tour d’axe', unite: '', vrai: 512, tol: 0.005, affiche: v => nf(v, 0), cs: 3,
        pieges: [[4096, 'C’est le nombre de demi-pas : divisez par 8 pour avoir des tours.']],
        expl: '4096 / 8 = 512 tours du rotor pour un seul tour de l’axe : le rapport de réduction est de 1/512.' } },
    { id: 'duree', titre: 'Durée d’un tour d’axe', focus: ['compteurs'],
      texte: <>Le programme Arduino contient <code>delay(5)</code> : le microcontrôleur attend 5{NB}ms entre deux pas.</>,
      tache: { type: 'num', q: 'Durée d’un tour de l’axe en demi-pas', unite: 's', vrai: N_AXE * T_DELAY, tol: 0.01, affiche: v => nf(v, 2), cs: 4,
        pieges: [[N_AXE * T_DELAY * 1000, 'Facteur 1000 : 5 ms = 0,005 s.']],
        expl: '4096 × 5 ms = 20 480 ms ≈ 20,48 s.' } },
    { id: 'duree2', titre: 'Et en pas complet ?', focus: ['compteurs'],
      texte: <>En pas complet, le rotor avance de 2 demi-pas à chaque pas.</>,
      tache: { type: 'num', q: 'Durée d’un tour de l’axe en pas complet', unite: 's', vrai: N_AXE / 2 * T_DELAY, tol: 0.01, affiche: v => nf(v, 2), cs: 4,
        expl: '2048 pas × 5 ms = 10,24 s : deux fois plus rapide, mais deux fois moins précis.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>stator fixe (bobines), rotor mobile (aimant) : le rotor s’aligne sur le champ magnétique</li>
        <li>alimenter les bobines successivement « fait tourner » le champ : pas complet = 1/4 de tour, demi-pas = 1/8</li>
        <li>deux bobines voisines : champ ×√2 (≈ +41 %) : force maximale</li>
        <li>le réducteur : 4096 demi-pas = 512 tours du rotor = 1 tour de l’axe</li>
        <li>à delay(5) : 20,48 s (demi-pas) ou 10,24 s (pas complet) par tour d’axe</li></ul>,
      texte: <>Vous savez expliquer comment des bobines alimentées successivement font tourner un rotor, puis comment un réducteur transforme ce mouvement en rotation lente de l’axe.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const idCourant = ETAPES[Math.min(etape, ETAPES.length - 1)].id;

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    s.playing2 = false; s.n2 = 0;
    setDefi({ theta: tire([22.5, 45, 90, 135, 180, 270, 360, 720]), m: tire(['demi', 'complet']), reps: {}, verifie: false });
    setVue('axe'); s.vue = 'axe';
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') { if (!defi) nouveauDefi(); else { setVue('axe'); s.vue = 'axe'; } }
    if (md === 'guide') { s.playing = false; s.playing2 = false; s.coils = [0, 0, 0, 0]; s.th = 215 * Math.PI / 180; s.om = 0; s.cmd = 0; s.mode = 'complet'; s.idx = 0; s.n = 0; s.dir = 1; s.n2 = 0;
      setGrille(Array.from({ length: 8 }, () => [0, 0, 0, 0])); setGrilleVerif(false); setVue('stator'); s.vue = 'stator'; }
    maj();
  }
  const sol = defi && (() => {
    const nDemi = defi.theta * N_AXE / 360, nPas = nDemi / (defi.m === 'demi' ? 1 : 2);
    return [
      { id: 'pas', q: 'Nombre de pas commandés', v: nPas, u: '', d: 0 },
      { id: 'tours', q: 'Nombre de tours du rotor', v: nDemi / 8, u: '', d: 1 },
      { id: 'duree', q: 'Durée avec delay(5)', v: nPas * T_DELAY, u: 's', d: 2 },
    ];
  })();
  const voletDefi = defi && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : positionner l’axe</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>On veut que l’<strong>axe</strong> du moteur tourne de <strong>{nf(defi.theta, defi.theta % 1 ? 1 : 0)}{NB}°</strong>, en <strong>{defi.m === 'demi' ? 'demi-pas' : 'pas complet'}</strong> avec <code>delay(5)</code>. Données : 4096 demi-pas par tour d’axe, 8 demi-pas par tour du rotor.</div>
      {sol.map(q => {
        const x = lireNombre(defi.reps[q.id]);
        const bon = defi.verifie && isFinite(x) && proche(x, q.v, 0.01);
        return (
          <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
            <span style={{ minWidth: 190, color: KIT.txt }}>{q.q}</span>
            <input value={defi.reps[q.id] ?? ''} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [q.id]: e.target.value }, verifie: false }))}
              aria-label={q.q} style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (bon ? '#16a34a' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
            <span style={{ color: KIT.txt2 }}>{q.u}</span>
            {defi.verifie && (bon ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
              : <span style={{ color: '#dc2626', fontWeight: 700 }}>✗ {nf(q.v, q.d)}{q.u ? NB + q.u : ''}</span>)}
          </div>);
      })}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => { noterDefi(sol.every(q => proche(lireNombre(defi.reps[q.id]), q.v, 0.01))); setDefi(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
      </div>
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Moteur idéalisé</strong> : stator à 4 bobines à 90°, rotor à 2 pôles (aimant). Les bobines sont supposées identiques et alimentées en tout ou rien.</li>
      <li><strong>Sans charge</strong> : le rotor suit toujours la commande, aucun pas n’est perdu. Dans la réalité, un couple résistant trop fort ou une cadence trop élevée fait « décrocher » le moteur.</li>
      <li><strong>Boucle ouverte</strong> : aucun capteur ne mesure la position du rotor ; le programme compte seulement les pas commandés.</li>
      <li><strong>Animation ralentie</strong> : un pas dure ici quelques dixièmes de seconde ; dans le programme Arduino, <code>delay(5)</code> fixe 5{NB}ms entre deux pas.</li>
      <li><strong>Champ des bobines</strong> : chaque bobine crée un champ de même intensité (unité 1) dirigé vers elle ; deux bobines voisines s’ajoutent comme des vecteurs.</li>
      <li><strong>Réducteur</strong> : valeurs de la documentation, 5,625°/64 ≈ 0,0879° à chaque demi-pas ; avec le rotor à 2 pôles de ce modèle (8 demi-pas par tour), 4096 demi-pas correspondent à 512 tours du rotor. Le moteur réel est construit un peu différemment.</li>
    </ul>);
  const panneauHypo = (
    <div style={styleBoite}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défi</button>
    </span>);

  const onglets = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, ...cadre('commandes') }}>
      <button onClick={() => changerVue('stator')} style={styleBouton(vue === 'stator', '#b45309')}>① Du stator au rotor</button>
      <button onClick={() => changerVue('axe')} style={styleBouton(vue === 'axe', '#0e7490')}>② Du rotor à l’axe</button>
    </div>);

  const nomMode = { complet: 'Pas complet', demi: 'Demi-pas', force: 'Force maximale' };
  const commandes1 = (
    <div style={{ ...styleBoite, ...cadre('commandes') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Commande des bobines</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.keys(SEQS).map(m => <button key={m} onClick={() => choisirMode(m)} style={stylePetitBouton(s.mode === m, '#b45309')}>{nomMode[m]}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={lecture} style={styleBouton(true, s.playing ? '#dc2626' : '#16a34a')}>{s.playing ? '⏸ Pause' : '▶ Lecture'}</button>
        <button onClick={pasSuivant} style={styleBouton(false)}>⏭ Pas suivant</button>
        <button onClick={sens} style={styleBouton(false)}>{s.dir > 0 ? '↻ Sens horaire' : '↺ Sens antihoraire'}</button>
        <button onClick={() => choisirMode(s.mode)} style={styleBouton(false)}>↺ Remise à zéro</button>
      </div>
      <Curseur nom="Durée entre deux pas (animation ralentie)" valeur={tPas} onChange={setTPas} min={0.2} max={1.5} pas={0.05} unite="s" decimales={2} couleur="#b45309"/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4, fontWeight: 700 }}>Bobines alimentées (cliquez aussi sur le schéma)</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[0, 1, 2, 3].map(i => <button key={i} onClick={() => bobine(i)} aria-pressed={!!s.coils[i]} style={stylePetitBouton(!!s.coils[i], '#d97706')}>Bobine {i + 1}</button>)}
        <button onClick={toutEteindre} style={stylePetitBouton(false)}>Tout éteindre</button>
      </div>
    </div>);
  const angleRotor = mod(thDeg, 360);
  const mesures1 = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Bobines alimentées" valeur={s.coils.some(Boolean) ? s.coils.map((v, i) => v ? i + 1 : null).filter(Boolean).join(' + ') : 'aucune'}/>
      <LigneMesure nom={<>Champ résultant B (unité : champ d’une bobine)</>} valeur={nf(f.B, 2)} couleur="#ea580c"/>
      <LigneMesure nom="Direction du champ (depuis le haut, sens horaire)" valeur={f.B > 0 ? `${nf(mod(f.ang, 360), 0)}${NB}°` : '–'}/>
      <LigneMesure nom="Angle du rotor" valeur={`${nf(angleRotor, 0)}${NB}°`}/>
      <LigneMesure nom="Pas commandés" valeur={String(s.cmd)}/>
      <LigneMesure nom="Rotation commandée du rotor" valeur={`${nf(s.n * 45, 0)}${NB}°`}/>
    </div>);
  const chrono = (
    <div style={{ ...styleBoite, ...cadre('chrono') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>
        Chronogramme des tensions{idCourant === 'chrono' && enGuide ? ' à compléter (demi-pas)' : ` : ${seqMode.nom.toLowerCase()}`}
      </div>
      {enGuide && idCourant === 'chrono'
        ? <>
          <Chrono seq={grilleDemi} idx={-1} grille={grille} setGrille={g => { setGrille(g); setGrilleVerif(false); }} editable verifie={grilleVerif}/>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setGrilleVerif(true)} style={styleBouton(true, '#16a34a')}>✓ Vérifier le tableau</button>
            {grilleVerif && <span style={{ fontWeight: 700, color: grilleOk ? '#16a34a' : '#dc2626' }}>{grilleOk ? '✓ Séquence exacte' : '✗ Cases erronées en rouge'}</span>}
          </div></>
        : <Chrono seq={seqMode.seq} idx={s.idx} editable={false}/>}
      <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 4 }}>La colonne en jaune est le pas en cours. 5{NB}V : bobine alimentée ; 0 : éteinte. Après le dernier pas, on recommence.</div>
    </div>);

  const figure1 = (
    <div style={{ ...styleBoite, ...cadre('schema') }}>
      <Moteur coils={s.coils} thDeg={thDeg} cible={null} onBobine={bobine}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 4 }}>
        Flèche orange : champ magnétique résultant. Pastille S bleue : la bobine alimentée attire le pôle N du rotor.
      </div>
    </div>);

  // ---------- vue 2 ----------
  const figure2 = (
    <div style={{ ...styleBoite, ...cadre('reducteur') }}>
      <Reducteur n2={n2}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        <button onClick={lecture2} style={styleBouton(true, s.playing2 ? '#dc2626' : '#16a34a')}>{s.playing2 ? '⏸ Pause' : '▶ Lecture'}</button>
        <button onClick={raz2} style={styleBouton(false)}>↺ Remise à zéro</button>
        {[[8, '1 tour/s'], [64, '8 tours/s'], [512, '64 tours/s'], [4096, '512 tours/s']].map(([r, l]) =>
          <button key={r} onClick={() => setRate(r)} style={stylePetitBouton(rate === r, '#0e7490')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 6 }}>
        Vitesse de rotation du rotor dans l’animation. Au-delà de quelques tours par seconde, on ne distingue plus le rotor : suivez le compteur.
      </div>
    </div>);
  const compteurs = (
    <div style={{ ...styleBoite, ...cadre('compteurs') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Compteurs</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <button onClick={() => setModeAxe('demi')} style={stylePetitBouton(modeAxe === 'demi', '#0e7490')}>Demi-pas</button>
        <button onClick={() => setModeAxe('complet')} style={stylePetitBouton(modeAxe === 'complet', '#0e7490')}>Pas complet</button>
      </div>
      <LigneMesure nom="Demi-pas effectués" valeur={nf(Math.floor(n2), 0)}/>
      <LigneMesure nom="Pas commandés (dans le mode choisi)" valeur={nf(pasCmd2, 0)}/>
      <LigneMesure nom="Tours du rotor" valeur={nf(n2 / 8, 1)} couleur="#b91c1c"/>
      <LigneMesure nom="Angle de l’axe" valeur={`${nf(n2 * ANG_AXE, 1)}${NB}°`} couleur="#0e7490"/>
      <LigneMesure nom="Angle de l’axe par demi-pas" valeur={`${nf(ANG_AXE, 4)}${NB}°`}/>
      <LigneMesure nom="Durée écoulée dans le programme (delay(5))" valeur={`${nf(pasCmd2 * T_DELAY, 2)}${NB}s`}/>
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Alimentez une seule bobine, puis la voisine : de quel angle tourne le rotor ?</li>
        <li>Alimentez deux bobines opposées (1 et 3) : que se passe-t-il ? Pourquoi ?</li>
        <li>Comparez le champ résultant en pas complet et en « force maximale ».</li>
        <li>Inversez le sens de la séquence : que devient le sens de rotation du rotor ?</li>
        <li>Dans la vue ②, lancez 512 tours par seconde : combien de temps l’axe met-il à faire un tour ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>le rotor (aimant) s’aligne sur le champ créé par les bobines (stator)</li>
        <li>pas complet = 1/4 de tour ; demi-pas = 1/8 de tour ; deux bobines : champ ×√2</li>
        <li>4096 demi-pas = 512 tours du rotor = 1 tour de l’axe</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pap-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pap-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pap-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .pap-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(300px, 1fr) minmax(300px, 1fr); }
        .pap-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (max-width: 900px) { .pap-l1.cote, .pap-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Moteur pas à pas : du stator à l’axe</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>moteur pas à pas</strong> tourne par petits angles bien définis : le microcontrôleur alimente les bobines du <strong>stator</strong> dans un certain ordre et le <strong>rotor</strong> (un aimant) s’aligne sur le champ magnétique. Un <strong>réducteur</strong> transmet ensuite le mouvement à l’axe de sortie.</div>
      {onglets}
      <div className={`pap-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div>
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}><>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></></div>}
          {vue === 'stator' ? (
            <div className={`pap-pri${mode !== 'explore' ? ' pile' : ''}`}>
              {figure1}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{commandes1}{mesures1}</div>
            </div>
          ) : (
            <div className={`pap-pri${mode !== 'explore' ? ' pile' : ''}`}>
              {figure2}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{compteurs}</div>
            </div>
          )}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : enDefi ? panneauHypo : null}
      </div>
      {vue === 'stator' && <div className="pap-l2">{chrono}{enDefi ? null : panneauHypo}</div>}
      {vue === 'axe' && !enDefi && <div className="pap-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="pap-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
