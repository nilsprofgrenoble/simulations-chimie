// ═══════════════════════════════════════════════════════════════════════════
//  « Échographe 2D : balayage sectoriel » (Terminale STL — Ondes), suite de la simulation « Échographe » (sim 88).
//  La sonde pivote : chaque tir (mode A) devient une colonne de points brillants, l'image en éventail se construit tir par tir.
//  Le modèle physique est dans echo2D.js (pur, testé par echo2D.test.mjs).
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useMemo } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, avecIndices, fmt, lireNombre, proche, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import { SCENES, V_APPAREIL, marcher, tirerExacts, dAppCm, positionApparente } from "./echo2D";

const SIM_ID = 91;
declarerDefis(SIM_ID, [['principal', 'Lire une échographie 2D']]);

const W = 470, H = 470, PIV = { x: 235, y: 34 }, S = 44;   // 44 px par cm
const px = (thetaDeg, dCm) => {
  const th = thetaDeg * Math.PI / 180;
  return [PIV.x + Math.sin(th) * dCm * S, PIV.y + Math.cos(th) * dCm * S];
};
const gris = niv => {
  const v = Math.round(70 + 185 * Math.min(1, Math.max(0, (niv + 80) / 70)));
  return `rgb(${v},${v},${v})`;
};
const TEAL = 'rgba(45,212,191,0.95)';

// Légende : contours et étiquettes projetés par la MÊME physique que l'image (profondeur apparente). Calculée une fois par scène.
function calculerLegende(scene) {
  const contours = [];
  for (let a = -40; a <= 40; a += 1) for (const p of marcher(scene, a, {}).pass) {
    const [x, y] = px(a, dAppCm(p.tUs));
    if (x > 1 && x < W - 1 && y > 1 && y < H - 1) contours.push([x, y]);
  }
  const bord = marcher(scene, -40, {}).pass.filter(p => ['graisse', 'muscle'].includes(p.vers) && ['peau', 'graisse'].includes(p.de));
  const refs = [[0.35, 'peau'], ...bord.map(p => [dAppCm(p.tUs), p.vers === 'graisse' ? 'graisse' : 'muscle'])]
    .map(([r, nom]) => ({ nom, pt: px(-40, r) }));
  const structs = [];
  for (const st of scene.structures) {
    const { pass } = marcher(scene, st.angle, {});
    const p = st.dedans ? pass.find(q => q.vers === st.cible) : pass.find(q => q.vers === st.cible || q.de === st.cible);
    if (p) structs.push({ label: st.label, pt: px(st.angle, dAppCm(p.tUs)) });
  }
  return { contours, refs, structs };
}

function Dessin({ scene, shots, f, grain, legende, angle, cal, calOn }) {
  const ref = useRef(null);
  const leg = useMemo(() => legende ? calculerLegende(scene) : null, [scene, legende]);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, W, H);
    // arcs de profondeur
    ctx.strokeStyle = 'rgba(148,163,184,0.20)'; ctx.lineWidth = 1;
    [2, 4, 6, 8].forEach(d => {
      ctx.beginPath(); ctx.arc(PIV.x, PIV.y, d * S, Math.PI * 0.083, Math.PI * 0.917); ctx.stroke();
      const [gx, gy] = px(-40.6, d);
      ctx.fillStyle = 'rgba(148,163,184,0.55)'; ctx.font = '9.5px sans-serif';
      ctx.fillText(`${d}`, gx - 2, gy + 3);
    });
    ctx.beginPath(); ctx.moveTo(PIV.x, PIV.y); const [e1x, e1y] = px(-40, 9.5); ctx.lineTo(e1x, e1y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PIV.x, PIV.y); const [e2x, e2y] = px(40, 9.5); ctx.lineTo(e2x, e2y); ctx.stroke();
    // tirs : grain puis échos (à la profondeur apparente)
    if (grain) for (const sh of shots) for (const sp of sh.speckle) {
      const [x, y] = px(sh.thetaDeg, dAppCm(sp.tUs));
      ctx.fillStyle = `rgba(200,205,215,${Math.max(0, Math.min(0.32, (sp.niv + 80) / 140))})`;
      ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
    }
    const rayon = (0.32 / f + 0.045) * S;
    for (const sh of shots) for (const e of sh.events) {
      const d = dAppCm(e.tUs);
      if (d > 9.5) continue;
      const [x, y] = px(sh.thetaDeg, d);
      // écho dessiné en ellipse étirée latéralement → les contours forment des lignes continues
      const rx = Math.max(rayon * 1.5, 4.5), ry = rayon;
      // halo léger autour des échos forts : aspect « écho saturé » des vraies images
      if (e.detecte && e.niveau > -45) {
        ctx.fillStyle = gris(e.niveau).replace('rgb', 'rgba').replace(')', ',0.22)');
        ctx.beginPath(); ctx.ellipse(x, y, rx * 1.9, ry * 1.9, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = e.detecte ? gris(e.niveau) : 'rgba(110,110,110,0.22)';
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
    // ----- légende : contours et étiquettes, projetés par la MÊME physique (profondeur apparente) -----
    if (leg) {
      ctx.fillStyle = TEAL;
      for (const [x, y] of leg.contours) ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
      let yPrec = 44;
      leg.refs.forEach(({ nom, pt: [pxr, pyr] }, i) => {
        const ty = i === 0 ? 44 : Math.max(yPrec + 15, Math.min(pyr - 4, H - 30));
        ctx.strokeStyle = 'rgba(45,212,191,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(66, ty + 3); ctx.lineTo(pxr - 3, pyr); ctx.stroke();
        ctx.fillStyle = TEAL; ctx.font = '600 11px sans-serif';
        ctx.fillText(nom, 8, ty + 7);
        yPrec = ty;
      });
      leg.structs.forEach(({ label, pt: [x, y] }) => {
        ctx.fillStyle = TEAL; ctx.font = '600 10.5px sans-serif';
        const tx = x - 10, ty = Math.max(12, y - 10);
        ctx.textAlign = 'right';
        ctx.fillText(label, tx, ty);
        ctx.beginPath(); ctx.moveTo(tx + 2, ty - 3); ctx.lineTo(x, y - 2); ctx.stroke();
        ctx.textAlign = 'left';
      });
    }
    // sonde + faisceaux : direction du dernier tir ( faible), et direction à venir (angle du curseur, bien visible)
    const last = shots[shots.length - 1];
    const faisceau = (a, opacite) => {
      const [bx, by] = px(a, 9.5);
      const g = ctx.createLinearGradient(PIV.x, PIV.y, bx, by);
      g.addColorStop(0, `rgba(56,189,248,${opacite})`); g.addColorStop(1, `rgba(56,189,248,0)`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(PIV.x, PIV.y); ctx.lineTo(bx, by); ctx.stroke();
    };
    if (last && last.thetaDeg !== angle) faisceau(last.thetaDeg, 0.18);
    faisceau(angle, 0.55);
    ctx.save();
    ctx.translate(PIV.x, PIV.y); ctx.rotate(-angle * Math.PI / 180);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-16, -15, 32, 13);
    ctx.restore();
    ctx.fillStyle = '#94a3b8'; ctx.font = '9.5px sans-serif';
    ctx.fillText('sonde', PIV.x + 24, PIV.y + 4);
    // ----- calipers (mesure, comme sur les vraies échographies) -----
    if (calOn) {
      const [c1, c2] = cal;
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
      ctx.setLineDash([]);
      for (const p of cal) {
        ctx.beginPath();
        ctx.moveTo(p.x - 7, p.y - 7); ctx.lineTo(p.x + 7, p.y + 7);
        ctx.moveTo(p.x + 7, p.y - 7); ctx.lineTo(p.x - 7, p.y + 7);
        ctx.stroke();
      }
      const d = Math.hypot(c1.x - c2.x, c1.y - c2.y) / S;   // cm dans le plan apparent de l'image
      const mx = (c1.x + c2.x) / 2, my = (c1.y + c2.y) / 2;
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${d.toFixed(2).replace('.', ',')} cm`, mx + 10, my - 8);
    }
  }, [scene, shots, f, grain, leg, angle, cal, calOn]);
  return <canvas ref={ref} width={W} height={H} role="img" aria-label="Image échographique en éventail" style={{ width: '100%', maxWidth: W, borderRadius: 10, border: '1px solid #334155', display: 'block', cursor: 'crosshair' }} />;
}


// ---------- Échogramme (mode A du dernier tir) ----------
function EchoA({ shot, f }) {
  const TMAX = 130;
  if (!shot) return <div style={{ color: '#94a3b8', fontSize: 13, padding: 20 }}>Aucun tir pour l’instant : lancez le balayage ou tirez à la main.</div>;
  const X0 = 40, L = 300, TOP = 14, HH = 130;
  const x = t => X0 + t / TMAX * L;
  const sig = 1 / f;
  const pts = [];
  for (let i = 0; i <= 300; i++) {
    const t = (i / 300) * TMAX;
    let env = 0;
    for (const e of shot.events) {
      const h = Math.max(0, (e.niveau + 80) / 80);
      env += h * Math.exp(-0.5 * ((t - e.tUs) / sig) ** 2);
    }
    pts.push(`${x(t).toFixed(1)},${(TOP + HH - Math.min(1.04, env) * HH).toFixed(1)}`);
  }
  const yB = TOP + HH;
  return (
    <svg viewBox="0 0 355 222" style={{ width: '100%', background: '#0f172a', borderRadius: 10, border: '1px solid #334155' }}>
      <line x1={X0} y1={yB} x2={X0 + L} y2={yB} stroke="#475569" />
      {[0, 2, 4, 6, 8, 10].map(d => {
        const t = 2 * d / V_APPAREIL * 1e4;
        return <g key={d}>
          <line x1={x(t)} y1={yB} x2={x(t)} y2={yB + 4} stroke="#64748b" />
          <text x={x(t)} y={yB + 16} fontSize="10" fill="#64748b" textAnchor="middle">{d}</text>
        </g>;
      })}
      <text x={X0 + L} y={yB + 31} fontSize="9.5" fill="#64748b" textAnchor="end">profondeur apparente (cm)</text>
      <text x={X0 - 6} y={TOP + 10} fontSize="10" fill="#64748b" textAnchor="end">0 dB</text>
      <text x={X0 - 6} y={yB} fontSize="10" fill="#64748b" textAnchor="end">−80</text>
      <polyline points={pts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
      {shot.events.map((e, i) => (
        <g key={i}>
          <line x1={x(e.tUs)} y1={TOP} x2={x(e.tUs)} y2={yB} stroke={e.detecte ? 'rgba(14,116,144,0.5)' : 'rgba(148,163,184,0.25)'} strokeDasharray="3 3" />
          {!e.detecte && <text x={x(e.tUs) + 3} y={TOP + 12} fontSize="9" fill="#94a3b8">non détecté</text>}
        </g>
      ))}
      <text x={12} y={216} fontSize="10.5" fill="#94a3b8">Échogramme (mode A) du dernier tir — angle {shot.thetaDeg}°</text>
    </svg>
  );
}


const nbf = (v, d = 1) => fmt(v, d);
const tiree = (scene, a, f, gel = true) => tirerExacts(scene, a, f, gel);
const nbDetectes = (sh) => sh.events.filter(e => e.detecte).length;

// Extrémités du fémur (scène obstétricale) en coordonnées de l'image : base des calipers prépositionnés et de la mesure attendue.
const extremitesFemur = () => {
  const sc = SCENES.foetus, [cx, cz, rx, , ang] = sc.femur1, a = ang * Math.PI / 180;
  return [-1, 1].map(k => {
    const p = positionApparente(sc, cx + k * rx * Math.cos(a), cz + k * rx * Math.sin(a));
    const [x, y] = px(p.thetaDeg, p.dApp);
    return { x, y };
  });
};
const CAL_FEMUR = extremitesFemur();
const LONGUEUR_FEMUR = Math.hypot(CAL_FEMUR[0].x - CAL_FEMUR[1].x, CAL_FEMUR[0].y - CAL_FEMUR[1].y) / S;   // cm, mesurée sur l'image

// ── Défi : un tir vers le kyste, tirage de l'angle, de la fréquence et de l'épaisseur de graisse ──
function tirerDefi() {
  const sc = SCENES.organe;
  for (let k = 0; k < 50; k++) {
    const a = [16, 20, 24, 28][Math.floor(Math.random() * 4)], f = [2.5, 3, 4, 5][Math.floor(Math.random() * 4)];
    const n2 = nbDetectes(tiree(sc, a, 2)), n8 = nbDetectes(tiree(sc, a, 8));
    const ev = tiree(sc, a, f).events.filter(e => e.detecte);
    if (n2 > n8 && ev.length >= 2) {
      const t2 = Math.round(ev[1].tUs * 10) / 10;
      return { a, f, n2, n8, t2, e: [1.0, 1.2, 1.3, 1.5][Math.floor(Math.random() * 4)], reps: {}, verifie: false };
    }
  }
  return { a: 20, f: 3, n2: 5, n8: 2, t2: 20, e: 1.3, reps: {}, verifie: false };
}
const questionsDefi = d => [
  { id: 'q1', type: 'num', unite: 'cm', vrai: dAppCm(d.t2), tol: 0.03,
    q: `Tirez à ${d.a}° avec f = ${nbf(d.f, 1)} MHz. Le deuxième écho détecté revient au bout de t = ${nbf(d.t2, 1)} µs (aller-retour). Quelle profondeur l'appareil affiche-t-il pour cet écho ?`,
    indice: "L'appareil suppose v = 1 540 m/s partout, et le temps mesuré est un aller-retour : d = v·t/2 (1 µs aller-retour ≈ 0,077 cm).",
    detail: `d = 1 540 × ${nbf(d.t2, 1)}·10⁻⁶ / 2 = ${nbf(dAppCm(d.t2), 2)} cm.` },
  { id: 'q2', type: 'num', unite: '', vrai: d.n2, tol: 0.001,
    q: `Réglez la fréquence à 2 MHz et tirez à ${d.a}° : combien d'échos sont détectés (« Dernier tir ») ?`,
    indice: 'Changez la fréquence avec le curseur, tirez, puis lisez « Échos détectés ».', detail: `Le tir à ${d.a}° donne ${d.n2} échos détectés à 2 MHz.` },
  { id: 'q3', type: 'num', unite: '', vrai: d.n8, tol: 0.001,
    q: `Même question à 8 MHz (même angle ${d.a}°).`,
    indice: 'Même méthode : seule la fréquence change.', detail: `À 8 MHz, ${d.n8} échos seulement : les plus profonds passent sous le seuil de −80 dB.` },
  { id: 'q4', type: 'qcm', bonne: 1,
    q: 'Pourquoi les échos profonds disparaissent-ils quand la fréquence augmente ?',
    options: ['Les interfaces profondes réfléchissent moins à haute fréquence', "L'absorption par les tissus augmente avec la fréquence : l'écho aller-retour passe sous le seuil", "La célérité diminue quand la fréquence augmente"],
    indice: "L'absorption s'exprime en dB par cm et par MHz : plus f est grande, plus on perd de niveau par centimètre.",
    detail: "L'atténuation est proportionnelle à f : elle s'ajoute sur tout l'aller-retour." },
  { id: 'q5', type: 'num', unite: 'µs', vrai: 2 * d.e * 1e-2 / 1450 * 1e6, tol: 0.03,
    q: `Une couche de graisse de ${nbf(d.e, 1)} cm d'épaisseur (célérité 1 450 m/s) est traversée à l'aller puis au retour. Quelle durée représente cet aller-retour (en µs) ?`,
    indice: 'Durée = distance parcourue / célérité, avec une distance égale à 2 × l’épaisseur.',
    detail: `t = 2 × ${nbf(d.e, 1)}·10⁻² / 1 450 = ${nbf(2 * d.e * 1e-2 / 1450 * 1e6, 1)} µs.` },
  { id: 'q6', type: 'qcm', bonne: 0,
    q: "L'appareil suppose 1 540 m/s partout. Les structures situées sous la graisse (1 450 m/s) apparaissent…",
    options: ['un peu plus profondes que la réalité', 'un peu moins profondes que la réalité', 'exactement à leur profondeur réelle'],
    indice: 'La graisse est plus lente que 1 540 m/s : le trajet y dure-t-il plus ou moins longtemps que ce que l’appareil attend ?',
    detail: "Dans la graisse l'écho met plus de temps que prévu : l'appareil croit que la structure est plus loin." },
];

export function SimulationEchographe2D() {
  const [mode, setMode] = useState(() => modeOuverture('echo2d-guide-v1'));
  useSignalerMode(mode);
  const [suiviDefi, noterDefi] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('echo2d-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [sceneKey, setSceneKey] = useState('organe');
  const [f, setF] = useState(3);
  const [gel, setGel] = useState(true);
  const [grain, setGrain] = useState(true);
  const [legende, setLegende] = useState(false);
  const [angle, setAngle] = useState(20);
  const [shots, setShots] = useState([]);
  const [auto, setAuto] = useState(false);
  const [calOn, setCalOn] = useState(false);
  const [cal, setCal] = useState(CAL_FEMUR);
  const [df, setDf] = useState(() => tirerDefi());
  const [hypoOuv, setHypoOuv] = useState(false);
  const nextA = useRef(-40);
  const drag = useRef(null);
  const scene = SCENES[sceneKey];

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      if (nextA.current > 40) { setAuto(false); return; }
      const a1 = nextA.current, a2 = Math.min(40, a1 + 0.5); nextA.current += 1;   // deux tirs par image : balayage plus rapide
      setShots(p => [...p, tirerExacts(scene, a1, f, gel), tirerExacts(scene, a2, f, gel)]);
    }, 35);
    return () => clearInterval(id);
  }, [auto, f, gel, scene]);

  const lancer = () => { setShots([]); nextA.current = -40; setAuto(true); };
  const tirSimple = (a = angle) => { setAuto(false); setShots(p => [...p, tirerExacts(scene, a, f, gel)]); };
  const effacer = () => { setAuto(false); setShots([]); };
  const changerScene = k => { setAuto(false); setShots([]); setSceneKey(k); };
  const ptCanvas = e => { const r = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  const aPres = p => Math.max(-40, Math.min(40, Math.atan2(p.x - PIV.x, p.y - PIV.y) * 180 / Math.PI));
  const onPointerDown = e => {
    const p = ptCanvas(e);
    if (calOn) {
      const d0 = Math.hypot(p.x - cal[0].x, p.y - cal[0].y), d1 = Math.hypot(p.x - cal[1].x, p.y - cal[1].y);
      drag.current = d0 <= d1 ? 0 : 1;
      if (d0 >= 16 && d1 >= 16) setCal(c => c.map((pt, k) => k === drag.current ? p : pt));
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } else { const a = Math.round(aPres(p)); setAngle(a); tirSimple(a); }
  };
  const onPointerMove = e => { if (drag.current == null) return; const p = ptCanvas(e), i = drag.current; setCal(c => c.map((pt, k) => k === i ? p : pt)); };
  const onPointerUp = () => { drag.current = null; };

  const last = shots[shots.length - 1];
  const ndet = last ? nbDetectes(last) : 0;
  const lCal = Math.hypot(cal[0].x - cal[1].x, cal[0].y - cal[1].y) / S;

  // ── Parcours guidé ──
  const etapes = [
    { titre: 'Un tir, des échos', texte: <>Comme dans la simulation « Échographe », la sonde envoie une brève salve et écoute les <strong>échos</strong>. Ici la sonde est en haut de l'image et vise dans une direction. <strong>Cliquez sur l'image</strong> pour orienter la sonde et tirer.</>,
      tache: { type: 'action', ok: shots.length > 0, label: 'Tirer pour moi', faire: () => tirSimple(20), consigne: 'Faire au moins un tir',
        indice: "Cliquez n'importe où dans l'image sombre : la sonde s'oriente vers ce point et tire." } },
    { titre: "Ce que signale un point brillant", texte: <>Sur la ligne du tir apparaissent des points brillants. Regardez aussi l'échogramme (mode A) à droite : chaque pic correspond à un point.</>,
      tache: { type: 'qcm', q: 'Un point brillant sur l’image correspond à…', options: ["une interface entre deux milieux, où une partie de l'onde est réfléchie", 'la sonde elle-même', 'un endroit où la célérité est nulle'], bonne: 0,
        indice: "Un écho revient quand l'onde rencontre un changement de milieu.",
        expl: <>Une partie de l'énergie est réfléchie à chaque interface : c'est le coefficient de réflexion <em>R</em>. Plus <em>R</em> est grand, plus le point est brillant.</> } },
    { titre: 'Pourquoi un éventail ?', texte: <>Lancez le <strong>balayage complet</strong> : la sonde pivote de −40° à +40° et l'image se construit tir par tir.</>,
      tache: { type: 'action', ok: shots.length >= 150, label: 'Lancer le balayage', faire: lancer, consigne: 'Laisser le balayage se terminer',
        indice: "Appuyez sur « Balayage complet » et attendez quelques secondes : l'image est terminée quand la sonde a tout parcouru." } },
    { titre: 'Le kyste est sombre', texte: <>Sur la coupe d'organe, repérez le <strong>kyste</strong> (poche de liquide) : activez « Légende » si besoin. Il paraît presque noir.</>,
      tache: { type: 'qcm', q: 'Pourquoi le kyste apparaît-il sombre ?', options: ["Il contient du liquide homogène : très peu d'interfaces, donc presque pas d'échos à l'intérieur", 'Il absorbe toute l’onde dès l’entrée', "Il est plus profond que l'organe"], bonne: 0,
        indice: "Un écho a besoin d'une interface. Que rencontre l'onde à l'intérieur d'un liquide homogène ?",
        expl: <>Dans un liquide homogène, l'onde ne rencontre pas d'interface : pas d'écho, donc une zone noire. Les parois du kyste, elles, renvoient des échos.</> } },
    { titre: 'Convertir un temps en profondeur', texte: <>Le temps que met l'écho à revenir est un <strong>aller-retour</strong> : l'appareil calcule la profondeur avec <em>d</em> = <em>v</em>·<em>t</em>/2, en supposant <em>v</em> = 1 540 m/s.</>,
      tache: { type: 'num', q: "Un écho revient au bout de t = 26 µs (aller-retour). Quelle profondeur l'appareil affiche-t-il ? (en cm)", unite: 'cm', vrai: dAppCm(26), tol: 0.02, cs: 2, detail: true,
        calcul: () => ['d = v·t/2 avec v = 1 540 m/s et t = 26 µs.', `d = 1 540 × 26·10⁻⁶ / 2 = ${nbf(dAppCm(26), 2)} cm.`],
        pieges: [[dAppCm(52), 'Vous avez oublié que le temps mesuré est un aller-retour : il faut diviser par 2.']],
        indice: "Une profondeur est un trajet simple. Le temps mesuré correspond à l'aller et au retour : divisez par 2. Attention aux µs (10⁻⁶ s) et aux cm." } },
    { titre: 'La graisse décale tout', texte: <>La couche de graisse a une célérité de 1 450 m/s, plus faible que les 1 540 m/s supposés par l'appareil. Cochez « Légende » : les contours sont tracés aux profondeurs <em>apparentes</em>.</>,
      tache: { type: 'qcm', q: 'Les structures situées sous la graisse apparaissent…', options: ['un peu plus profondes que la réalité', 'un peu moins profondes que la réalité', 'exactement à leur profondeur réelle'], bonne: 0,
        indice: 'Dans la graisse, la durée de l’aller-retour est-elle plus longue ou plus courte que ce que l’appareil attend ?',
        expl: <>Dans la graisse l'onde va moins vite : l'écho revient plus tard, donc l'appareil croit la structure plus profonde.</> } },
    { titre: 'Fréquence : voir loin ou voir net', texte: <>Réglez la fréquence à <strong>8 MHz</strong> puis à <strong>2 MHz</strong>, puis relancez un balayage : comparez la netteté et la profondeur atteinte.</>,
      tache: { type: 'qcm', q: 'Pour observer une structure profonde, quel réglage choisir ?', options: ['Une fréquence plus basse : moins d’absorption, mais une image moins nette', 'Une fréquence plus haute : image plus nette et meilleure pénétration', 'La fréquence ne change rien'], bonne: 0,
        indice: "L'absorption croît avec la fréquence. Et la netteté ?",
        expl: <>L'atténuation est proportionnelle à la fréquence : à 8 MHz le fond disparaît. À 2 MHz on voit loin, mais les petits détails fusionnent : c'est un compromis.</> } },
    { titre: 'Sans gel', texte: <>Décochez « Gel » puis tirez : l'image est presque noire sous la peau.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’image est-elle noire sans gel ?', options: ["L'air entre la sonde et la peau réfléchit environ 99 % de l'énergie", 'La peau absorbe tout', 'Le gel produit les ultrasons'], bonne: 0,
        indice: "Regardez le coefficient de réflexion air/peau dans la liste des échos : R = 0,99.",
        expl: <>Avec R = 0,99, seule 1 % de l'énergie entre dans le corps à l'aller (et 1 % au retour) : 40 dB de perte, la plupart des échos passent sous le seuil.</> } },
    { titre: "Échographie obstétricale", texte: <>Passez à la scène <strong>« Échographie obstétricale »</strong> et activez les <strong>calipers</strong> : les ✕ jaunes sont déjà placés sur les extrémités du fémur du fœtus (os très réfléchissant).</>,
      tache: { type: 'action', ok: sceneKey === 'foetus' && calOn, label: 'Le faire pour moi', faire: () => { changerScene('foetus'); setCal(CAL_FEMUR); setCalOn(true); setGel(true); },
        consigne: 'Scène obstétricale + calipers activés', indice: 'Boutons « Échographie obstétricale » puis « Calipers » sous l’image.' } },
    { titre: 'Mesurer le fémur', texte: <>On mesure la longueur du fémur (os de la cuisse) pour estimer l'âge de la grossesse. Lisez la distance affichée par les calipers.</>,
      tache: { type: 'num', q: 'Quelle longueur de fémur lisez-vous ? (en cm)', unite: 'cm', vrai: LONGUEUR_FEMUR, tol: 0.1, cs: 2, detail: true, bloque: (sceneKey === 'foetus' && calOn) ? null : 'Activez d’abord la scène obstétricale et les calipers.',
        calcul: () => [`Les calipers affichent la distance entre les deux ✕ : environ ${nbf(LONGUEUR_FEMUR, 1)} cm.`],
        indice: 'La valeur en jaune est affichée à côté du trait pointillé des calipers.' } },
  ];
  const finParcours = guide.etape >= etapes.length;

  const panneauScene = (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(SCENES).map(([k, sc]) => <button key={k} style={stylePetitBouton(sceneKey === k, '#0284c7')} onClick={() => changerScene(k)}>{sc.nom}</button>)}
      </div>
      <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{ touchAction: calOn ? 'none' : 'auto' }}>
        <Dessin scene={scene} shots={shots} f={f} grain={grain} legende={legende} angle={angle} cal={cal} calOn={calOn} />
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
        {calOn ? 'Calipers : tirez les ✕ jaunes (le plus proche du doigt se déplace).' : "Cliquez sur l'image pour orienter la sonde et tirer dans cette direction."}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0 6px' }}>
        <button style={stylePetitBouton(auto, '#0284c7')} onClick={lancer}>▶ Balayage complet</button>
        <button style={stylePetitBouton(false)} onClick={() => tirSimple()}>Tir simple</button>
        <button style={stylePetitBouton(false)} onClick={effacer}>↺ Effacer l'image</button>
        <button style={stylePetitBouton(calOn, '#b45309')} onClick={() => setCalOn(!calOn)}>Calipers</button>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['Gel', gel, () => { setGel(!gel); effacer(); }], ['Grain du tissu (speckle)', grain, () => setGrain(!grain)], ['Légende', legende, () => setLegende(!legende)]].map(([lab, v, toggle]) => (
          <label key={lab} style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 14, color: KIT.txt, cursor: 'pointer' }}>
            <input type="checkbox" checked={v} onChange={toggle} />{lab}</label>
        ))}
      </div>
      <div style={{ fontSize: 14, color: KIT.txt }}>Angle de la sonde : <strong>{angle}°</strong>{auto && <span style={{ color: '#0284c7' }}> (balayage en cours…)</span>}</div>
      <input type="range" min={-40} max={40} step={1} value={angle} aria-label="Angle de la sonde" onChange={e => setAngle(+e.target.value)} style={{ width: '100%', accentColor: '#0284c7' }} />
      <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6 }}>Fréquence : <strong>{nbf(f, 1)} MHz</strong></div>
      <input type="range" min={2} max={8} step={0.5} value={f} aria-label="Fréquence" onChange={e => { setF(+e.target.value); effacer(); }} style={{ width: '100%', accentColor: '#0284c7' }} />
    </div>
  );

  const panneauMesures = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <EchoA shot={last} f={f} />
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Dernier tir</div>
        <div style={{ fontSize: 14, color: KIT.txt }}>Échos détectés : <strong>{ndet}</strong>{last && <> · angle <strong>{last.thetaDeg}°</strong></>}</div>
        {last && last.events.filter(e => e.detecte).slice(0, 7).map((e, i) => (
          <div key={i} style={{ color: KIT.txt2, fontSize: 13 }}>t = {nbf(e.tUs, 1)} µs → {nbf(dAppCm(e.tUs), 1)} cm · niveau {fmt(e.niveau, 0)} dB</div>
        ))}
        {calOn && <div style={{ color: '#b45309', fontSize: 13.5, marginTop: 4, fontWeight: 700 }}>Calipers : {nbf(lCal, 2)} cm</div>}
      </div>
    </div>
  );

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, fontSize: 14, color: KIT.txt }}>
      <li><strong>Rayon infiniment fin</strong>, sans réfraction (le faisceau ne se courbe pas aux interfaces) et sans réflexions multiples : un modèle simplifié.</li>
      <li><strong>Scènes inventées</strong> pour la pédagogie : les célérités, les absorptions et les coefficients de réflexion sont des valeurs arrondies (celles de la simulation « Échographe », complétées pour le kyste, le liquide et l'os).</li>
      <li>Niveau d'un écho = 10·log₁₀(<em>R</em>·<em>T</em>²) − absorption aller-retour (absorption proportionnelle à la fréquence) ; seuil de détection −80 dB.</li>
      <li><strong>Profondeur apparente</strong> : l'appareil suppose 1 540 m/s partout. Les contours de la légende sont tracés à ces profondeurs apparentes : un petit décalage avec l'anatomie réelle n'est pas un défaut, c'est l'effet physique (l'os, à 3 200 m/s, paraît plus mince ; la graisse, à 1 450 m/s, décale tout ce qui est dessous).</li>
      <li><strong>Netteté</strong> : la taille des points (≈ 0,32/<em>f</em> + 0,045 cm) est un choix d'affichage qui illustre qu'une fréquence basse donne une image plus floue ; ce n'est pas calculé à partir de la forme du faisceau.</li>
      <li><strong>Grain du tissu (speckle)</strong> : granulosité due à la diffusion dans le tissu ; ici purement cosmétique (ce n'est pas du bruit de l'appareil).</li>
    </ul>
  );

  // ── Défi ──
  const Q = questionsDefi(df);
  const juste = q => q.type === 'num' ? proche(lireNombre(df.reps[q.id] ?? ''), q.vrai, q.tol) : df.reps[q.id] === q.bonne;
  const voletDefi = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
        Sur la <strong>coupe d'organe</strong>, un médecin cherche un kyste. Utilisez l'image ci-dessus (scène « Coupe d'organe ») pour répondre.
      </div>
      {Q.map((q, k) => {
        const ok = juste(q);
        return (
          <div key={q.id} style={{ borderLeft: `3px solid ${df.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
            <IndiceDefi cache={df.verifie && ok}>{avecIndices(q.indice)}</IndiceDefi>
            {q.type === 'qcm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {q.options.map((o, i) => (
                  <button key={i} onClick={() => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: i } }))}
                    style={{ textAlign: 'left', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${df.reps[q.id] === i ? '#0284c7' : KIT.bord}`, background: df.reps[q.id] === i ? '#e0f2fe' : 'white', color: KIT.txt }}>{o}</button>
                ))}
                {df.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={df.reps[q.id] || ''} placeholder="?" aria-label={`Réponse au défi ${k + 1}`}
                  onChange={e => setDf(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: e.target.value } }))}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130 }} />
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.unite}</span>
                {df.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
            )}
            {df.verifie && !ok && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>
              {q.type === 'num' ? <>Réponse attendue : <strong>{fmt(q.vrai, q.vrai < 10 && q.unite !== '' ? 2 : 0)} {q.unite}</strong> — </> : null}{avecIndices(q.detail)}</div>}
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { noterDefi(Q.every(juste)); setDf(d => ({ ...d, verifie: true })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => setDf(tirerDefi())} style={styleBouton(false)}><Pic n="refresh" />Nouvelles données</button>
        {df.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{Q.filter(juste).length} / {Q.length} réponses justes</span>}
      </div>
    </div>
  );

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 21 }}>Échographe 2D</h2>
        <BoutonsModes mode={mode} setMode={m => { if (m === 'defi') { changerScene('organe'); setCalOn(false); } setMode(m); }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
        <div style={{ flex: '1 1 440px', minWidth: 280, maxWidth: 500 }}>{panneauScene}</div>
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          {mode === 'guide' && <>
            <CarteParcours etapes={etapes} etat={guide} setEtat={setGuide} fin={finParcours} />
            {finParcours && <ARetenir titre="À RETENIR">
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Chaque <strong>écho</strong> vient d'une interface ; l'image est faite de tous les échos de tous les tirs.</li>
                <li>Profondeur affichée : <em>d</em> = <em>v</em>·<em>t</em>/2 avec <em>v</em> = 1 540 m/s supposé : une couche plus lente (graisse) décale les structures plus profond.</li>
                <li>Un liquide homogène (kyste) ne renvoie presque pas d'échos : zone noire.</li>
                <li>Fréquence élevée : image plus nette, mais absorption plus forte (on voit moins loin) ; sans gel, l'air réfléchit 99 % de l'énergie.</li>
              </ul>
            </ARetenir>}
          </>}
          {mode === 'explore' && <>
            {panneauMesures}
            <div style={{ ...styleBoite, marginTop: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer — {scene.nom}</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>{scene.essais.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          </>}
          {mode === 'defi' && <>
            <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.principal`} etat={suiviDefi} /></div>
            <div style={{ marginTop: 12 }}>{panneauMesures}</div>
          </>}
          {mode === 'guide' && <div style={{ marginTop: 12 }}>{panneauMesures}</div>}
        </div>
      </div>
      <div style={{ ...styleBoite, marginTop: 12 }}>
        <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
      </div>
    </div>
  );
}
