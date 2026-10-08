import { useState, useEffect } from "react";
import { cardStyle, fmt, sci, lireNombre, proche, CarteParcours, useEtatPersistant, KIT, styleBouton,
  stylePetitBouton, styleBoite, Section, LigneMesure, Curseur, ORANGE_GUIDE, avecIndices } from "../commun";

// ====================================================
// LOI DE BEER-LAMBERT ET DOSAGE PAR ÉTALONNAGE (1re spé PC)
// Parcours : TP « Bouillie bordelaise » — dosage des ions cuivre(II) par étalonnage au spectrophotomètre.
// Exploration : le spectrophotomètre (plusieurs espèces colorées) et un outil de courbe d'étalonnage.
// Loi de Beer-Lambert : A = ε(λ) × L × c, avec L = 1 cm ; au-delà de A ≈ 1,2, l'appareil s'écarte un peu de la droite.
// ====================================================

const L_CUVE = 1;                 // cm
const M_CUSO4 = 249.68;           // g/mol (CuSO₄, 5 H₂O)
const LAMBDA_MIN = 380, LAMBDA_MAX = 900;

// Espèces colorées : ε(λ) en L·mol⁻¹·cm⁻¹, somme de bandes gaussiennes [centre, largeur, εmax]
const ESPECES = {
  cuivre: { nom: 'Ions cuivre(II) Cu²⁺ (sulfate de cuivre)', couleur: [37, 99, 235], bandes: [[810, 135, 12], [380, 40, 0.3]],
    unite: 'mol/L', facteur: 1, gamme: [0.020, 0.040, 0.080, 0.120, 0.160], cMax: 0.2, pas: 0.005 },
  permanganate: { nom: 'Ions permanganate MnO₄⁻', couleur: [190, 24, 150], bandes: [[525, 22, 2200], [547, 14, 1500], [507, 14, 1300], [311, 30, 1700]],
    unite: 'mmol/L', facteur: 1e-3, gamme: [0.05, 0.10, 0.20, 0.30, 0.40], cMax: 0.5, pas: 0.01 },
  e133: { nom: 'Bleu brillant E133 (colorant alimentaire)', couleur: [14, 116, 220], bandes: [[630, 38, 100000], [410, 30, 9000]],
    unite: 'µmol/L', facteur: 1e-6, gamme: [2, 4, 6, 8, 10], cMax: 14, pas: 0.2 },
  dichromate: { nom: 'Ions dichromate Cr₂O₇²⁻', couleur: [234, 120, 0], bandes: [[350, 45, 3100], [440, 40, 370]],
    unite: 'mmol/L', facteur: 1e-3, gamme: [0.5, 1.0, 1.5, 2.0, 2.5], cMax: 3, pas: 0.05 },
};
export const epsilon = (esp, l) => ESPECES[esp].bandes.reduce((s, [c, w, e]) => s + e * Math.exp(-(((l - c) / w) ** 2)), 0);
// Ligne de base avant calibration : la cuve et l'eau absorbent un peu (réflexions, eau), un peu plus aux grandes longueurs d'onde
const ligneDeBase = l => 0.045 + 0.025 * (l - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) + 0.03 * Math.exp(-(((l - 970) / 60) ** 2));
// Ce qu'affiche l'appareil : légère saturation aux fortes absorbances
const affiche = A => (A <= 1 ? A : A / (1 + 0.04 * (A - 1) ** 2));
// Petit bruit reproductible pour chaque cuve
const bruit = (graine, k) => { const x = Math.sin(graine * 12.9898 + k * 78.233) * 43758.5453; return (x - Math.floor(x) - 0.5) * 0.006; };
function absorbance(esp, cMolL, l, blanc, graine = 1, k = 0) {
  const A = epsilon(esp, l) * L_CUVE * cMolL;
  return affiche(A) + (blanc ? 0 : ligneDeBase(l)) + bruit(graine, k);
}
// Couleur de la solution vue à l'œil : du blanc vers la couleur de l'espèce, selon l'absorbance au maximum
function couleurCuve(esp, cMolL) {
  if (!esp || cMolL <= 0) return 'rgb(248, 250, 252)';
  const lmax = ESPECES[esp].bandes[0][0], A = epsilon(esp, Math.min(LAMBDA_MAX, lmax)) * cMolL;
  const t = 1 - Math.pow(10, -0.85 * A), c = ESPECES[esp].couleur;
  return `rgb(${Math.round(248 + (c[0] - 248) * t)}, ${Math.round(250 + (c[1] - 250) * t)}, ${Math.round(252 + (c[2] - 252) * t)})`;
}
// Régression linéaire (passant par l'origine, ou affine), avec R²
function regression(xs, ys, origine) {
  const n = xs.length; if (n < 2) return null;
  const my = ys.reduce((a, b) => a + b, 0) / n, mx = xs.reduce((a, b) => a + b, 0) / n;
  let a, b;
  if (origine) { a = xs.reduce((s, x, i) => s + x * ys[i], 0) / xs.reduce((s, x) => s + x * x, 0); b = 0; }
  else { const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0); a = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx; b = my - a * mx; }
  const ssr = ys.reduce((s, y, i) => s + (y - (a * xs[i] + b)) ** 2, 0), sst = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  return { a, b, R2: sst > 0 ? 1 - ssr / sst : 1 };
}
// Pas de graduation « rond » (1, 2, 2,5 ou 5 × 10ⁿ) pour environ 5 intervalles
const pasRond = max => { const brut = max / 5, p = Math.pow(10, Math.floor(Math.log10(brut))); const r = brut / p; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p; };
// Longueur d'onde → couleur (pour le faisceau et la bande du spectre)
function couleurLambda(nm) {
  if (nm > 780) return '#7f1d1d';
  if (nm < 450) return `hsl(${270 - (nm - 380) / 70 * 30}, 90%, 50%)`;
  if (nm < 495) return `hsl(${240 - (nm - 450) / 45 * 60}, 90%, 50%)`;
  if (nm < 570) return `hsl(${180 - (nm - 495) / 75 * 120}, 85%, 45%)`;
  if (nm < 620) return `hsl(${60 - (nm - 570) / 50 * 40}, 95%, 50%)`;
  return `hsl(0, 85%, ${50 - (nm - 620) / 160 * 15}%)`;
}

// ════════════════ LE SPECTRE ════════════════
function Spectre({ courbes, lambda, onLambda, yMax = 2, titre }) {
  const W = 560, H = 250, g = 46, d = 14, h = 14, b = 40;
  const X = l => g + (l - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN) * (W - g - d);
  const Y = A => H - b - Math.max(0, Math.min(yMax, A)) / yMax * (H - b - h);
  const clic = e => {
    if (!onLambda) return;
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
    onLambda(Math.round(Math.max(LAMBDA_MIN, Math.min(LAMBDA_MAX, LAMBDA_MIN + (x - g) / (W - g - d) * (LAMBDA_MAX - LAMBDA_MIN)))));
  };
  const pas = yMax > 1.5 ? 0.5 : yMax > 0.6 ? 0.2 : 0.05;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titre || 'Spectre d’absorption'} onClick={clic}
      style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}`, cursor: onLambda ? 'crosshair' : 'default' }}>
      {/* au-delà de 780 nm : proche infrarouge, invisible à l'œil */}
      <rect x={X(780)} y={h} width={X(LAMBDA_MAX) - X(780)} height={H - b - h} fill="#f1f5f9"/>
      <text x={(X(780) + X(LAMBDA_MAX)) / 2} y={H - b - 6} fontSize="11" fill={KIT.txt2} textAnchor="middle">proche infrarouge</text>
      {/* bande des couleurs du visible */}
      {Array.from({ length: 52 }, (_, k) => LAMBDA_MIN + k * 10).map(l => <rect key={l} x={X(l)} y={H - b + 2} width={X(l + 10) - X(l) + 0.5} height="6" fill={couleurLambda(l)}/>)}
      {Array.from({ length: Math.floor(yMax / pas) + 1 }, (_, k) => k * pas).map(A => (
        <g key={A}><line x1={g} y1={Y(A)} x2={W - d} y2={Y(A)} stroke="#e2e8f0"/>
          <text x={g - 5} y={Y(A) + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">{fmt(A, pas < 0.1 ? 2 : 1)}</text></g>
      ))}
      {[400, 500, 600, 700, 800, 900].map(l => <text key={l} x={X(l)} y={H - b + 22} fontSize="11.5" fill={KIT.txt2} textAnchor="middle">{l}</text>)}
      {courbes.map((c, k) => (
        <polyline key={k} fill="none" stroke={c.couleur} strokeWidth="2.5" strokeDasharray={c.pointilles ? '5 4' : undefined}
          points={Array.from({ length: 105 }, (_, i) => LAMBDA_MIN + i * 5).map(l => `${X(l).toFixed(1)},${Y(c.f(l)).toFixed(1)}`).join(' ')}/>
      ))}
      {lambda != null && <g>
        <line x1={X(lambda)} y1={h} x2={X(lambda)} y2={H - b} stroke={ORANGE_GUIDE} strokeWidth="2"/>
        <text x={Math.min(W - d - 4, X(lambda) + 5)} y={h + 12} fontSize="12" fontWeight="700" fill="#c2410c" textAnchor={X(lambda) > W - 90 ? 'end' : 'start'}>λ = {lambda} nm</text>
      </g>}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={h} x2={g} y2={H - b} stroke={KIT.txt}/>
      <text x={(g + W - d) / 2} y={H - 4} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">longueur d'onde λ (nm)</text>
      <text x="13" y={(h + H - b) / 2} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 13 ${(h + H - b) / 2})`}>absorbance A</text>
      {courbes.length > 1 && courbes.map((c, k) => (
        <g key={`l${k}`}><line x1={g + 12} y1={h + 12 + k * 16} x2={g + 32} y2={h + 12 + k * 16} stroke={c.couleur} strokeWidth="2.5" strokeDasharray={c.pointilles ? '5 4' : undefined}/>
          <text x={g + 37} y={h + 16 + k * 16} fontSize="11.5" fill={KIT.txt}>{c.nom}</text></g>
      ))}
    </svg>
  );
}

// ════════════════ LA COURBE D'ÉTALONNAGE ════════════════
function CourbeEtalonnage({ points, inconnue, modele, unite, cMax, aMax }) {
  const W = 560, H = 260, g = 52, d = 16, h = 14, b = 40;
  const xm = cMax || Math.max(1e-9, ...points.map(p => p[0])) * 1.1, ym = aMax || Math.max(0.1, ...points.map(p => p[1]), inconnue || 0) * 1.12;
  const X = c => g + c / xm * (W - g - d), Y = A => H - b - A / ym * (H - b - h);
  const pasY = ym > 1.5 ? 0.5 : ym > 0.6 ? 0.2 : 0.1;
  const cX = modele && inconnue != null ? (inconnue - modele.b) / modele.a : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Courbe d'étalonnage A = f(c)" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {Array.from({ length: Math.floor(ym / pasY) + 1 }, (_, k) => k * pasY).map(A => (
        <g key={A}><line x1={g} y1={Y(A)} x2={W - d} y2={Y(A)} stroke="#e2e8f0"/><text x={g - 5} y={Y(A) + 4} fontSize="11.5" fill={KIT.txt2} textAnchor="end">{fmt(A, 1)}</text></g>
      ))}
      {(() => { const pc = pasRond(xm), dec = Math.max(0, -Math.floor(Math.log10(pc)) + (pc / Math.pow(10, Math.floor(Math.log10(pc))) === 2.5 ? 1 : 0));
        return Array.from({ length: Math.floor(xm / pc + 1e-9) + 1 }, (_, k) => k * pc).map(c => <text key={c} x={X(c)} y={H - b + 16} fontSize="11.5" fill={KIT.txt2} textAnchor="middle">{fmt(c, dec)}</text>); })()}
      {modele && <line x1={X(0)} y1={Y(modele.b)} x2={X(xm)} y2={Y(modele.a * xm + modele.b)} stroke="#2563eb" strokeWidth="2"/>}
      {cX != null && cX > 0 && cX < xm && <g>
        <line x1={g} y1={Y(inconnue)} x2={X(cX)} y2={Y(inconnue)} stroke="#dc2626" strokeDasharray="5 4"/>
        <line x1={X(cX)} y1={Y(inconnue)} x2={X(cX)} y2={H - b} stroke="#dc2626" strokeDasharray="5 4"/>
        <circle cx={X(cX)} cy={Y(inconnue)} r="6" fill="#fecaca" stroke="#dc2626" strokeWidth="2"/>
      </g>}
      {points.map(([c, A], k) => <circle key={k} cx={X(c)} cy={Y(A)} r="5" fill="#1e3a8a"/>)}
      <line x1={g} y1={H - b} x2={W - d} y2={H - b} stroke={KIT.txt}/><line x1={g} y1={h} x2={g} y2={H - b} stroke={KIT.txt}/>
      <text x={(g + W - d) / 2} y={H - 6} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">concentration c ({unite})</text>
      <text x="13" y={(h + H - b) / 2} fontSize="12.5" fontWeight="700" fill={KIT.txt} textAnchor="middle" transform={`rotate(-90 13 ${(h + H - b) / 2})`}>absorbance A</text>
    </svg>
  );
}

// ════════════════ LE SPECTROPHOTOMÈTRE (schéma) ════════════════
function SchemaSpectro({ lambda, couleurSol, A, enMesure }) {
  const coulF = couleurLambda(lambda);
  const sortie = Math.pow(10, -Math.max(0, A || 0));
  return (
    <svg viewBox="0 0 560 150" role="img" aria-label="Principe du spectrophotomètre" style={{ width: '100%', height: 'auto', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      <rect x="14" y="48" width="70" height="54" rx="8" fill="#334155"/><circle cx="72" cy="75" r="10" fill="#fde68a"/>
      <text x="49" y="122" fontSize="12" fill={KIT.txt} textAnchor="middle">source</text>
      <polygon points="120,48 160,75 120,102" fill="#e0f2fe" stroke={KIT.txt}/>
      <text x="140" y="122" fontSize="12" fill={KIT.txt} textAnchor="middle">monochromateur</text>
      <line x1="84" y1="75" x2="120" y2="75" stroke="#fde68a" strokeWidth="6"/>
      <line x1="160" y1="75" x2="282" y2="75" stroke={coulF} strokeWidth="6"/>
      <text x="221" y="64" fontSize="12" fill="#c2410c" textAnchor="middle" fontWeight="700">λ = {lambda} nm</text>
      <rect x="282" y="40" width="44" height="70" fill={couleurSol} stroke={KIT.txt} strokeWidth="2"/>
      <text x="304" y="128" fontSize="12" fill={KIT.txt} textAnchor="middle">cuve (L = 1 cm)</text>
      <line x1="326" y1="75" x2="420" y2="75" stroke={coulF} strokeWidth="6" opacity={0.15 + 0.85 * sortie}/>
      <rect x="420" y="50" width="40" height="50" rx="4" fill="#1e293b"/>
      <text x="440" y="122" fontSize="12" fill={KIT.txt} textAnchor="middle">détecteur</text>
      <rect x="474" y="54" width="76" height="42" rx="5" fill="#0f172a"/>
      <text x="512" y="81" fontSize="15" fill="#86efac" textAnchor="middle" fontFamily="monospace" fontWeight="700">{enMesure && A != null ? fmt(A, 3) : '—'}</text>
      <text x="512" y="112" fontSize="11.5" fill={KIT.txt2} textAnchor="middle">absorbance A</text>
    </svg>
  );
}

// ════════════════ OUTIL : COURBE D'ÉTALONNAGE À PARTIR DE SES DONNÉES ════════════════
function OutilEtalonnage() {
  const [texte, setTexte] = useEtatPersistant('beer1g-outil-donnees', '0 0\n0,020 0,241\n0,040 0,479\n0,080 0,962\n0,120 1,425\n0,160 1,861');
  const [unite, setUnite] = useEtatPersistant('beer1g-outil-unite', 'mol/L');
  const [aX, setAX] = useEtatPersistant('beer1g-outil-ax', '0,722');
  const [origine, setOrigine] = useState(true);
  const points = texte.split('\n').map(l => l.trim().split(/[\s;\t]+/).map(lireNombre)).filter(p => p.length >= 2 && isFinite(p[0]) && isFinite(p[1])).map(p => [p[0], p[1]]);
  const m = regression(points.map(p => p[0]), points.map(p => p[1]), origine);
  const ax = lireNombre(aX), cX = m && isFinite(ax) ? (ax - m.b) / m.a : NaN;
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <div style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Mes mesures</div>
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={8} aria-label="Concentrations et absorbances"
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 14, fontFamily: 'monospace', padding: 6, border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/>
        <div style={{ fontSize: 12.5, color: KIT.txt2, margin: '4px 0 8px' }}>Une ligne par solution : concentration, puis absorbance (copier-coller depuis un tableur possible).</div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Unité de concentration :
          <input value={unite} onChange={e => setUnite(e.target.value)} aria-label="Unité" style={{ width: 80, fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/></label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Absorbance de l'inconnue A<sub>X</sub> :
          <input value={aX} onChange={e => setAX(e.target.value)} aria-label="Absorbance de l'inconnue" style={{ width: 80, fontSize: 14, padding: '3px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/></label>
        <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
          <button onClick={() => setOrigine(true)} style={stylePetitBouton(origine, '#2563eb')}>droite passant par l'origine (A = k × c)</button>
          <button onClick={() => setOrigine(false)} style={stylePetitBouton(!origine, '#2563eb')}>droite affine</button>
        </div>
        {m && <>
          <LigneMesure nom={origine ? 'Coefficient directeur k' : 'Coefficient directeur a'} valeur={`${sci(m.a, 4)} (par ${unite})`} couleur="#2563eb"/>
          {!origine && <LigneMesure nom="Ordonnée à l'origine b" valeur={sci(m.b, 3)}/>}
          <LigneMesure nom="Coefficient de détermination R²" valeur={fmt(m.R2, 4)} couleur={m.R2 >= 0.999 ? '#15803d' : '#b45309'}/>
          {isFinite(cX) && <LigneMesure nom="Concentration de l'inconnue c_X" valeur={`${sci(cX, 3)} ${unite}`} couleur="#dc2626"/>}
        </>}
      </div>
      <div style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Courbe d'étalonnage</div>
        <CourbeEtalonnage points={points} inconnue={isFinite(ax) ? ax : null} modele={m} unite={unite}/>
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>En rouge : la lecture graphique de la concentration de l'inconnue.</div>
      </div>
    </div>
  );
}

// ════════════════ SIMULATION ════════════════
export function BeerLambert1G() {
  const [mode, setMode] = useState('explore');   // on arrive sur l'exploration libre
  const [onglet, setOnglet] = useState('spectro');
  const [guide, setGuide] = useEtatPersistant('beer1g-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  // L'échantillon de l'élève : bouillie bordelaise un peu différente de 15 g/L, et une pureté du solide du lycée
  const [ech] = useEtatPersistant('beer1g-echantillon-v1', (() => {
    const r = Math.random(), r2 = Math.random();
    return { graine: Math.floor(Math.random() * 1e5), cX: Math.round((15 * (0.95 + 0.1 * r)) / M_CUSO4 * 1e4) / 1e4, purete: Math.round((95 + 4 * r2) * 10) / 10 };
  })());
  const [ouverts, setOuverts] = useState({ commandes: true, tableau: true });
  // Spectrophotomètre
  const [cuve, setCuve] = useState('eau');            // cuve placée dans l'appareil
  const [blanc, setBlanc] = useState(false);         // calibration faite
  const [spectreVu, setSpectreVu] = useState({});    // spectres enregistrés : { eau: true, X: true }
  const [lambda, setLambda] = useState(500);
  const [mesures, setMesures] = useState({});        // absorbances notées : { S1: 0.24, … }
  const [lambdaMesures, setLambdaMesures] = useState(null);
  const [modelise, setModelise] = useState(false);
  const [preparee, setPreparee] = useState(false);   // solution P pour la pureté
  // Exploration : espèce, concentration
  const [espExp, setEspExp] = useState('cuivre'), [cExp, setCExp] = useState(0.06);
  const [defi, setDefi] = useState(null);

  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const etape = guide.etape;
  // La série de cuves : eau, S1…S5, X (et P pour la pureté)
  const esp = enDefi && defi ? defi.esp : 'cuivre';
  const E = ESPECES[esp];
  const gammeC = enDefi && defi ? E.gamme : ESPECES.cuivre.gamme;
  const cXvrai = enDefi && defi ? defi.cX : ech.cX;                       // dans l'unité de l'espèce
  const cP = 0.080 * ech.purete / 100;                                      // solution préparée avec 2,00 g pesés
  const CUVES = [['eau', 'eau', 0], ...gammeC.map((c, k) => [`S${k + 1}`, `S${k + 1}`, c]), ['X', enDefi ? 'X' : 'bouillie X', cXvrai], ...(preparee && !enDefi ? [['P', 'solution P', cP]] : [])];
  const cMolL = nom => { const e = CUVES.find(x => x[0] === nom); return e ? e[2] * (enDefi ? E.facteur : 1) : 0; };
  const indexCuve = nom => CUVES.findIndex(x => x[0] === nom);
  const graine = enDefi && defi ? defi.graine : ech.graine;
  const Acuve = (nom, l = lambda) => absorbance(esp, cMolL(nom), l, blanc, graine, indexCuve(nom));
  const spectreAffiche = spectreVu[cuve] || mode === 'explore';
  const lmaxEsp = E.bandes[0][0];

  // ── Exploration (onglet spectrophotomètre) ──
  const Eexp = ESPECES[espExp];
  const cExpMol = cExp * Eexp.facteur;
  const Aexp = absorbance(espExp, cExpMol, lambda, blanc, 3, 0);
  useEffect(() => { setCExp(ESPECES[espExp].gamme[2]); setLambda(Math.min(LAMBDA_MAX, ESPECES[espExp].bandes[0][0] < LAMBDA_MIN ? 440 : ESPECES[espExp].bandes[0][0])); }, [espExp]);

  function mesurerA() {
    setMesures(m => ({ ...m, [cuve]: Math.round(Acuve(cuve) * 1000) / 1000 }));
    if (lambdaMesures == null) setLambdaMesures(lambda);
  }
  function changerLambda(l) {
    setLambda(l);
    // changer de longueur d'onde invalide les mesures de la gamme
    if (lambdaMesures != null && l !== lambdaMesures) { setMesures({}); setLambdaMesures(null); setModelise(false); }
  }
  useEffect(() => { setCuve('eau'); setBlanc(false); setSpectreVu({}); setMesures({}); setLambdaMesures(null); setModelise(false); setPreparee(false); if (mode !== 'guide') setLambda(500); }, [mode, defi?.id]);

  // ── Valeurs pour le parcours (à partir des mesures de l'élève) ──
  const cAff = nom => { const e = CUVES.find(x => x[0] === nom); return e ? e[2] : 0; };          // concentration dans l'unité de l'espèce
  const ptsGamme = ['eau', 'S1', 'S2', 'S3', 'S4', 'S5'].filter(n => mesures[n] != null).map(n => [cAff(n), mesures[n]]);
  const toutesMesurees = ['eau', 'S1', 'S2', 'S3', 'S4', 'S5', 'X'].every(n => mesures[n] != null);
  const reg = ptsGamme.length >= 3 ? regression(ptsGamme.map(p => p[0]), ptsGamme.map(p => p[1]), true) : null;
  const k = reg ? reg.a : epsilon('cuivre', 810);
  const AX = mesures.X ?? Acuve('X');
  const cXcalc = AX / k, cmX = cXcalc * M_CUSO4;
  const AP = mesures.P;
  const pureteCalc = AP != null ? (AP / k) / 0.080 * 100 : null;
  const prochesMax = Math.abs(lambda - lmaxEsp) <= 30;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'contexte', titre: 'La bouillie bordelaise', focus: [],
      texte: <>La bouillie bordelaise est un fongicide utilisé au jardin. Sa couleur bleue vient des ions cuivre(II) Cu²⁺. Le fabricant
        annonce environ <strong>15 g/L de sulfate de cuivre pentahydraté</strong> CuSO₄, 5 H₂O (M = 249,68 g/mol). Pour le vérifier, on va
        faire un <strong>dosage par étalonnage</strong> : on compare la bouillie à une gamme de solutions de concentrations connues.</>, tache: null },
    { id: 'oeil', titre: 'À l’œil nu', focus: [],
      texte: <>Sous le schéma, les cuves sont alignées : l'eau, la gamme étalon S1 à S5, et la bouillie X. Comparez les couleurs.</>,
      tache: { type: 'qcm', q: 'Entre quelles solutions de la gamme se situe la bouillie ?', options: ['Entre S1 et S2 (0,020 et 0,040 mol/L)', 'Entre S2 et S3 (0,040 et 0,080 mol/L)', 'Entre S4 et S5 (0,120 et 0,160 mol/L)'], bonne: 1,
        expl: 'On a déjà un ordre de grandeur : entre 0,040 et 0,080 mol/L. Le spectrophotomètre va donner une valeur bien plus précise.' } },
    { id: 'principe', titre: 'Le spectrophotomètre', focus: [],
      texte: <>Le spectrophotomètre envoie sur la cuve une lumière d'une seule longueur d'onde λ, et mesure la part de lumière qui en ressort.</>,
      tache: { type: 'qcm', q: 'Que mesure l’absorbance A ?', options: ['La lumière absorbée par la solution : plus A est grand, moins il ressort de lumière', 'La couleur de la solution', 'La concentration, directement'], bonne: 0 } },
    { id: 'eau', titre: 'Le spectre de l’eau', focus: [],
      texte: <>Les commandes sont apparues. La cuve d'eau distillée est dans l'appareil : cliquez sur « Mesurer le spectre ».</>,
      tache: { type: 'action', ok: !!spectreVu.eau, consigne: spectreVu.eau ? null : 'Mesurez le spectre de l’eau, avant de calibrer.' } },
    { id: 'pourquoiBlanc', titre: 'Pourquoi calibrer ?', focus: [],
      texte: <>L'eau est incolore, et pourtant son absorbance n'est pas nulle.</>,
      tache: { type: 'qcm', q: 'Pourquoi faut-il calibrer (faire le « blanc ») ?', options: ['La cuve et l’eau absorbent ou réfléchissent un peu la lumière : on les prend comme référence A = 0, pour ne mesurer que l’espèce colorée', 'Pour chauffer la lampe', 'Pour choisir la longueur d’onde'], bonne: 0 } },
    { id: 'calibrer', titre: 'Faire le blanc', focus: [],
      texte: <>Avec la cuve d'eau dans l'appareil, cliquez sur « Calibrer (faire le blanc) », puis mesurez à nouveau le spectre de l'eau : il doit être plat, à A = 0.</>,
      tache: { type: 'action', ok: blanc && !!spectreVu.eauBlanc, consigne: !blanc ? 'Calibrez.' : !spectreVu.eauBlanc ? 'Remesurez le spectre de l’eau.' : null } },
    { id: 'spectreX', titre: 'Le spectre de la bouillie', focus: [],
      texte: <>Placez la bouillie X dans l'appareil (cliquez sur sa cuve), puis mesurez son spectre.</>,
      tache: { type: 'action', ok: !!spectreVu.X && blanc, consigne: spectreVu.X ? null : 'Placez la cuve X, puis mesurez le spectre.' } },
    { id: 'lambda', titre: 'Choisir la longueur d’onde', focus: [],
      texte: <>Pour mesurer les absorbances avec la meilleure précision, choisissez une longueur d'onde en cliquant sur le spectre.</>,
      tache: { type: 'action', ok: prochesMax && !!spectreVu.X, consigne: prochesMax ? `✅ λ = ${lambda} nm` : `λ = ${lambda} nm : visez le maximum d’absorption.` } },
    { id: 'pourquoiMax', titre: 'Pourquoi au maximum ?', focus: [],
      texte: <>Vous avez choisi λ = {lambda} nm, au maximum du spectre.</>,
      tache: { type: 'qcm', q: 'Pourquoi travailler au maximum d’absorption ?', options: ['L’absorbance y est la plus grande : la mesure est la plus sensible et la plus précise', 'C’est la couleur de la solution', 'Pour ne pas abîmer la cuve'], bonne: 0,
        expl: 'Au maximum, une petite variation de concentration donne la plus grande variation d’absorbance. Le spectre y est aussi presque plat : une petite erreur sur λ change peu A.' } },
    { id: 'couleur', titre: 'Couleur et spectre', focus: [],
      texte: <>La bouillie est bleue. Regardez où se trouve le maximum d'absorption sur la bande de couleurs du spectre.</>,
      tache: { type: 'qcm', q: 'Pourquoi la solution est-elle bleue ?', options: ['Elle absorbe surtout le rouge-orangé : on voit la lumière qui n’est pas absorbée', 'Elle absorbe surtout le bleu', 'Elle émet de la lumière bleue'], bonne: 0,
        expl: 'La couleur perçue est (à peu près) la couleur complémentaire de celle qui est absorbée.' } },
    { id: 'mesures', titre: 'Mesurer la gamme étalon', focus: [],
      texte: <>À λ = {lambdaMesures ?? lambda} nm, placez chaque cuve dans l'appareil (l'eau, S1 à S5, puis X) et cliquez sur « Mesurer A ». Les valeurs
        s'inscrivent dans le tableau. Vérifiez au passage que l'eau donne bien A = 0.</>,
      tache: { type: 'action', ok: toutesMesurees, consigne: toutesMesurees ? null : `Mesurées : ${['eau', 'S1', 'S2', 'S3', 'S4', 'S5', 'X'].filter(n => mesures[n] != null).length} / 7` } },
    { id: 'trace', titre: 'La courbe A = f(c)', focus: [],
      texte: <>Les points de la gamme sont tracés sous le tableau.</>,
      tache: { type: 'qcm', q: 'Comment sont disposés les points ?', options: ['Ils sont presque alignés sur une droite passant par l’origine : A est proportionnelle à c', 'Ils forment une courbe qui monte de plus en plus vite', 'Ils sont dispersés au hasard'], bonne: 0 } },
    { id: 'modele', titre: 'La modélisation', focus: [],
      texte: <>Cliquez sur « Modéliser » sous la courbe : le logiciel trace la droite A = k × c qui passe au plus près des points, et donne R².
        On considère que R² ≥ 0,999 est la marque d'un très bon alignement.</>,
      tache: { type: 'action', ok: modelise, consigne: modelise ? `k = ${fmt(k, 2)} L/mol ; R² = ${fmt(reg?.R2 ?? 1, 4)}` : 'Cliquez sur « Modéliser ».' } },
    { id: 'R2', titre: 'Un bon alignement ?', focus: [],
      texte: <>Vous obtenez R² = {fmt(reg?.R2 ?? 1, 4)}. Regardez le dernier point, S5, le plus concentré.</>,
      tache: { type: 'qcm', q: 'Que penser de l’alignement ?', options: (reg?.R2 ?? 1) >= 0.999 ? ['Très bon : R² ≥ 0,999', 'Mauvais : il faut tout refaire'] : ['Assez bon, mais S5 s’écarte un peu de la droite : aux fortes absorbances, l’appareil sort de son domaine de linéarité', 'Très bon : R² ≥ 0,999'], bonne: 0,
        expl: 'La loi de Beer-Lambert n’est vérifiée que pour des absorbances pas trop grandes (en pratique, A < 1,5 environ avec ce type d’appareil).' } },
    { id: 'epsilon', titre: 'La loi de Beer-Lambert', focus: [],
      texte: <>La loi s'écrit A = ε × L × c : k = ε × L, où ε est le coefficient d'absorption molaire de l'espèce (il dépend de λ) et L = 1 cm la
        largeur de la cuve.</>,
      tache: { type: 'num', q: 'Coefficient d’absorption molaire ε à cette longueur d’onde', unite: 'L·mol⁻¹·cm⁻¹', vrai: k / L_CUVE, tol: 0.02, affiche: v => fmt(v, 1),
        pieges: [[k * 100, 'L = 1 cm : il ne faut pas convertir en mètres ici.']] } },
    { id: 'methode', titre: 'Trouver c_X', focus: [],
      texte: <>Vous avez mesuré A<sub>X</sub> = {fmt(AX, 3)} pour la bouillie.</>,
      tache: { type: 'qcm', q: 'Comment obtenir la concentration c_X de la bouillie ?', options: ['Par le calcul c_X = A_X / k, ou par lecture graphique sur la droite', 'c_X = k × A_X', 'En prenant la concentration de S3'], bonne: 0 } },
    { id: 'cX', titre: 'La concentration de la bouillie', focus: [],
      texte: <>Avec k = {fmt(k, 2)} L/mol et A<sub>X</sub> = {fmt(AX, 3)}.</>,
      tache: { type: 'num', q: 'Concentration c_X des ions cuivre(II)', unite: 'mol/L', vrai: cXcalc, tol: 0.02, affiche: v => fmt(v, 4),
        pieges: [[AX * k, 'C’est A_X / k, et non A_X × k.']] } },
    { id: 'cm', titre: 'La concentration en masse', focus: [],
      texte: <>On a c<sub>m</sub> = c × M, avec M(CuSO₄, 5 H₂O) = 249,68 g/mol.</>,
      tache: { type: 'num', q: 'Concentration en masse c_m de la bouillie', unite: 'g/L', vrai: cmX, tol: 0.02, affiche: v => fmt(v, 1),
        pieges: [[cXcalc / M_CUSO4, 'C’est c × M, et non c / M.']] } },
    { id: 'conclusion', titre: 'Conclusion', focus: [],
      texte: <>Vous trouvez {fmt(cmX, 1)} g/L, soit un écart de {fmt(Math.abs(cmX - 15) / 15 * 100, 1)} % avec l'indication.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['La mesure est en accord avec l’indication « de l’ordre de 15 g/L »', 'L’étiquette est fausse'], bonne: 0 } },
    { id: 'masse', titre: 'Pour aller plus loin : la pureté', focus: [],
      texte: <>On veut vérifier la pureté du sulfate de cuivre du lycée. On prépare 100 mL d'une solution en milieu de gamme, à 0,080 mol/L, en
        supposant le solide pur.</>,
      tache: { type: 'num', q: 'Masse de solide à peser', unite: 'g', vrai: 0.080 * 0.100 * M_CUSO4, tol: 0.01, affiche: v => fmt(v, 2),
        pieges: [[0.080 * M_CUSO4, 'Pour 100 mL = 0,100 L, et non 1 L.']] } },
    { id: 'purete', titre: 'La pureté du solide', focus: [],
      texte: <>On a pesé 2,00 g et préparé la solution P. Cliquez sur « Préparer la solution P », placez sa cuve dans l'appareil et mesurez son
        absorbance{AP != null ? ` : A_P = ${fmt(AP, 3)}` : ''}. La pureté est le rapport entre la concentration réelle et 0,080 mol/L.</>,
      tache: { type: 'num', q: 'Pureté du sulfate de cuivre', unite: '%', vrai: pureteCalc ?? 0, tol: 0.012, affiche: v => fmt(v, 1),
        bloque: AP == null ? 'Préparez la solution P et mesurez son absorbance.' : null } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous avez réalisé un dosage par étalonnage complet. En exploration libre, testez d'autres espèces colorées (permanganate, colorant
        E133…), et traitez vos propres mesures avec l'outil de courbe d'étalonnage. Le défi vous propose une solution inconnue.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const vu = id => !enGuide || etape >= idx(id);

  // ════════════════ BLOCS D'AFFICHAGE ════════════════
  const rangee = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', margin: '8px 0 4px' }}>
      {CUVES.map(([n, nom, c]) => {
        const actif = cuve === n;
        return (
          <button key={n} onClick={() => setCuve(n)} aria-label={`Cuve ${nom}`} aria-pressed={actif}
            style={{ border: `2px solid ${actif ? ORANGE_GUIDE : KIT.bord}`, borderRadius: 8, background: 'white', padding: '4px 6px', cursor: 'pointer', minWidth: 56 }}>
            <div style={{ height: 46, width: 26, margin: '0 auto', background: couleurCuve(esp, c * (enDefi ? E.facteur : 1)), border: `1.5px solid ${KIT.txt}`, borderTop: 'none' }}/>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: KIT.txt, marginTop: 3 }}>{nom}</div>
            <div style={{ fontSize: 11, color: KIT.txt2 }}>{n === 'X' || n === 'P' ? '?' : `${fmt(c, enDefi && E.facteur < 1e-3 ? 1 : 3)}`}</div>
          </button>
        );
      })}
    </div>
  );
  const courbesSpectre = mode === 'explore'
    ? [{ f: l => absorbance(espExp, cExpMol, l, blanc, 3, 0), couleur: `rgb(${Eexp.couleur.join(',')})`, nom: 'solution' }]
    : [
      ...(spectreVu.eau && !blanc ? [{ f: l => absorbance(esp, 0, l, false, graine, 0), couleur: '#64748b', nom: 'eau (avant calibration)', pointilles: true }] : []),
      ...(spectreVu.eauBlanc && blanc ? [{ f: l => absorbance(esp, 0, l, true, graine, 0), couleur: '#64748b', nom: 'eau (après calibration)', pointilles: true }] : []),
      ...(spectreVu.X ? [{ f: l => absorbance(esp, cMolL('X'), l, blanc, graine, indexCuve('X')), couleur: `rgb(${E.couleur.join(',')})`, nom: enDefi ? 'solution X' : 'bouillie X' }] : []),
    ];
  const yMaxSpectre = mode === 'explore' ? Math.max(0.2, Math.ceil(Math.max(...Array.from({ length: 53 }, (_, i) => absorbance(espExp, cExpMol, 380 + i * 10, blanc, 3, 0))) * 5) / 5)
    : spectreVu.X ? Math.max(0.4, Math.ceil(Math.max(...Array.from({ length: 53 }, (_, i) => absorbance(esp, cMolL('X'), 380 + i * 10, blanc, graine, 0))) * 5) / 5) : 0.2;
  const Aaffiche = mode === 'explore' ? Aexp : Acuve(cuve);
  const couleurDansAppareil = mode === 'explore' ? couleurCuve(espExp, cExpMol) : couleurCuve(esp, cMolL(cuve));
  const commandes = (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {mode !== 'explore' && <button onClick={() => setSpectreVu(s => ({ ...s, [cuve === 'eau' && blanc ? 'eauBlanc' : cuve]: true }))} style={styleBouton(true, '#0284c7')}>📈 Mesurer le spectre</button>}
        <button onClick={() => { if (mode === 'explore' || cuve === 'eau') setBlanc(true); }} disabled={mode !== 'explore' && cuve !== 'eau'}
          style={{ ...styleBouton(blanc, '#334155'), opacity: mode !== 'explore' && cuve !== 'eau' ? 0.5 : 1 }}>{blanc ? '✅ Blanc fait' : '⚪ Calibrer (faire le blanc)'}</button>
        {mode !== 'explore' && vu('mesures') && <button onClick={mesurerA} disabled={!blanc} style={{ ...styleBouton(blanc, '#16a34a'), opacity: blanc ? 1 : 0.5 }}>📏 Mesurer A</button>}
      </div>
      {mode !== 'explore' && cuve !== 'eau' && !blanc && <div style={{ fontSize: 13, color: '#b45309', marginBottom: 6 }}>Le blanc se fait avec la cuve d'eau distillée.</div>}
      <Curseur nom="Longueur d'onde λ (ou cliquez sur le spectre)" valeur={lambda} onChange={mode === 'explore' ? setLambda : changerLambda} min={LAMBDA_MIN} max={LAMBDA_MAX} pas={1} unite="nm" couleur="#c2410c"/>
      {mode === 'explore' && <>
        <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, margin: '6px 0 4px' }}>Espèce colorée</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.entries(ESPECES).map(([kk, e]) => <button key={kk} onClick={() => setEspExp(kk)} style={stylePetitBouton(espExp === kk, '#1a7abf')}>{e.nom}</button>)}
        </div>
        <Curseur nom="Concentration" valeur={cExp} onChange={setCExp} min={0} max={Eexp.cMax} pas={Eexp.pas} unite={Eexp.unite} decimales={Eexp.pas < 0.01 ? 3 : 2} couleur="#1a7abf"/>
        <LigneMesure nom={`ε à ${lambda} nm`} valeur={`${fmt(epsilon(espExp, lambda), epsilon(espExp, lambda) < 100 ? 1 : 0)} L·mol⁻¹·cm⁻¹`}/>
        <LigneMesure nom="A = ε × L × c (théorie)" valeur={fmt(epsilon(espExp, lambda) * cExpMol, 3)}/>
        <LigneMesure nom="A affichée par l'appareil" valeur={fmt(Aexp, 3)} couleur="#15803d"/>
        {epsilon(espExp, lambda) * cExpMol > 1.5 && <div style={{ fontSize: 13, color: '#b45309', marginTop: 6 }}>Absorbance élevée : l'appareil sort de son domaine de linéarité, la valeur affichée est trop faible. Diluez la solution.</div>}
        {!blanc && <div style={{ fontSize: 13, color: '#b45309', marginTop: 6 }}>Le blanc n'est pas fait : la ligne de base de la cuve et de l'eau s'ajoute à l'absorbance.</div>}
      </>}
      {enGuide && vu('purete') && !preparee && <button onClick={() => setPreparee(true)} style={{ ...styleBouton(true, '#7c3aed'), marginTop: 6 }}>⚖️ Préparer la solution P (2,00 g dans 100 mL)</button>}
    </>
  );
  const tableau = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}>
        <thead><tr>
          <th style={cellule}>Solution</th>{CUVES.map(([n, nom]) => <th key={n} style={cellule}>{nom}</th>)}
        </tr></thead>
        <tbody>
          <tr><td style={cellule}>c ({enDefi ? E.unite : 'mol/L'})</td>{CUVES.map(([n, , c]) => <td key={n} style={cellule}>{n === 'X' ? <>c<sub>X</sub> = ?</> : n === 'P' ? '?' : fmt(c, enDefi && E.facteur < 1e-3 ? 1 : 3)}</td>)}</tr>
          <tr><td style={cellule}>A</td>{CUVES.map(([n]) => <td key={n} style={{ ...cellule, fontWeight: 700, color: '#15803d' }}>{mesures[n] != null ? fmt(mesures[n], 3) : ''}</td>)}</tr>
        </tbody>
      </table>
      {lambdaMesures != null && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Mesures à λ = {lambdaMesures} nm. Changer de longueur d'onde efface les mesures.</div>}
    </div>
  );
  const courbe = (
    <div>
      <CourbeEtalonnage points={ptsGamme} inconnue={modelise && mesures.X != null && (!enGuide || etape > idx('cX')) ? mesures.X : null} modele={modelise ? reg : null}
        unite={enDefi ? E.unite : 'mol/L'} cMax={Math.max(...gammeC) * 1.15}/>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setModelise(true)} disabled={ptsGamme.length < 3} style={{ ...styleBouton(ptsGamme.length >= 3, '#2563eb'), opacity: ptsGamme.length >= 3 ? 1 : 0.5 }}>📐 Modéliser (A = k × c)</button>
        {modelise && reg && (!enGuide || etape >= idx('modele')) && <span style={{ fontSize: 14, color: KIT.txt }}>k = <strong>{sci(reg.a, 4)} {uniteInverse(enDefi ? E.unite : 'mol/L')}</strong> ; R² = <strong>{fmt(reg.R2, 4)}</strong></span>}
      </div>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const choix = ['cuivre', 'permanganate', 'e133'];
    const e = choix[Math.floor(Math.random() * choix.length)], G = ESPECES[e].gamme;
    const cX = Math.round((G[0] + Math.random() * (G[4] - G[0])) / ESPECES[e].pas) * ESPECES[e].pas;
    setDefi({ id: Math.random(), esp: e, cX, graine: Math.floor(Math.random() * 1e5), reps: {}, verifie: false });
  }
  const voletDefi = defi && (() => {
    const kD = reg ? reg.a : null;
    const cXD = kD && mesures.X != null ? mesures.X / kD : null;            // dans l'unité de l'espèce
    const c05 = kD ? 0.5 / kD : null;
    const Q = [{ id: 'c', q: `Concentration de la solution X (en ${E.unite})`, vrai: cXD }, { id: 'c05', q: `Concentration à préparer pour avoir A = 0,50 à cette longueur d'onde (en ${E.unite})`, vrai: c05 }];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          <strong>{E.nom}</strong>. Une solution X de concentration inconnue, et une gamme étalon de 5 solutions. Faites le blanc, choisissez la longueur
          d'onde, mesurez la gamme et X, modélisez, puis répondez.
        </div>
        {!prochesMax && spectreVu.X && <div style={{ fontSize: 13, color: '#b45309' }}>Votre longueur d'onde n'est pas au maximum d'absorption : la mesure sera moins précise.</div>}
        {Q.map((q, kk) => {
          const ok = q.vrai != null && proche(lireNombre(defi.reps[q.id] || ''), q.vrai, 0.03);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{kk + 1}. {avecIndices(q.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse ${kk + 1}`} onChange={x => { const v = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: v } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 13, color: KIT.txt2 }}>{E.unite}</span>{defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>{q.vrai == null ? 'Mesurez d’abord la gamme et X, puis modélisez.' : `Réponse attendue : ${fmt(q.vrai, 3)} ${E.unite}`}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouvelle solution</button>
        </div>
        {defi.verifie && <div style={{ fontSize: 13, color: KIT.txt2 }}>Valeur réelle : c = {fmt(defi.cX, 3)} {E.unite}.</div>}
      </div>
    );
  })();

  // ════════════════ MISE EN PAGE ════════════════
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );
  const vueBanc = mode !== 'explore' || onglet === 'spectro';
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .bl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .bl-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 900px) { .bl-l1 { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt }}>Loi de Beer-Lambert et dosage par étalonnage</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => changerMode('guide')} style={styleBouton(mode === 'guide', ORANGE_GUIDE)}>🧭 Parcours guidé</button>
          <button onClick={() => changerMode('explore')} style={styleBouton(mode === 'explore', '#334155')}>🔍 Exploration libre</button>
          <button onClick={() => changerMode('defi')} style={styleBouton(mode === 'defi', '#0ea5e9')}>🎯 Défi</button>
        </div>
      </div>
      {mode === 'explore' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['spectro', '🌈 Le spectrophotomètre'], ['etalonnage', '📐 Courbe d’étalonnage de mes mesures']].map(([kk, n]) =>
            <button key={kk} onClick={() => setOnglet(kk)} style={stylePetitBouton(onglet === kk, '#1a7abf')}>{n}</button>)}
        </div>
      )}
      {mode === 'explore' && onglet === 'etalonnage' && <OutilEtalonnage/>}
      {vueBanc && <>
        <div className="bl-l1">
          <div style={styleBoite}>
            <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>
              {mode === 'explore' ? 'Le spectrophotomètre' : enDefi ? 'Une solution inconnue' : 'Exemple : le dosage des ions cuivre(II) de la bouillie bordelaise'}</div>
            <SchemaSpectro lambda={lambda} couleurSol={couleurDansAppareil} A={Aaffiche} enMesure={mode === 'explore' || (vu('eau') && (blanc || !!spectreVu[cuve]))}/>
            {mode !== 'explore' && vu('oeil') && <>
              <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 8 }}>Les cuves {vu('eau') ? '(cliquez pour placer une cuve dans l’appareil)' : ''} :</div>
              {rangee}
            </>}
            {(mode === 'explore' || (vu('eau') && Object.keys(spectreVu).length > 0)) && <div style={{ marginTop: 8 }}>
              <Spectre courbes={courbesSpectre} lambda={vu('lambda') || mode !== 'guide' ? lambda : null} onLambda={vu('lambda') ? (mode === 'explore' ? setLambda : changerLambda) : null} yMax={yMaxSpectre}
                titre="Spectre d'absorption"/>
              <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>{vu('lambda') ? 'Cliquez sur le spectre pour choisir la longueur d’onde.' : 'Spectre d’absorption mesuré.'}</div>
            </div>}
            {/* la loi support du dosage, sous le schéma */}
            {vu('principe') && <div style={{ ...styleBoite, background: 'white', marginTop: 8, fontSize: 14, color: KIT.txt }}>
              <strong>Loi de Beer-Lambert :</strong> <span style={{ fontFamily: 'Georgia, serif', fontSize: 16 }}>A = ε × L × c</span>
              <span style={{ color: KIT.txt2 }}> — ε : coefficient d'absorption molaire (dépend de l'espèce et de λ) ; L : largeur de la cuve ; c : concentration.</span>
            </div>}
          </div>
          {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
            : enDefi ? <div style={styleBoite}>{voletDefi}</div>
              : <div style={styleBoite}>
                <div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
                  <li>Comparez la couleur de chaque solution et la position de son maximum d'absorption.</li>
                  <li>Doublez la concentration : que devient l'absorbance ? Jusqu'où cela reste-t-il vrai ?</li>
                  <li>Mesurez sans faire le blanc : quelle erreur commet-on ?</li>
                  <li>Le permanganate a plusieurs maxima rapprochés : lequel choisir ?</li>
                </ul>
              </div>}
        </div>
        <div className="bl-l2">
          <div data-apparait={`${idx('eau')} ${idx('mesures')} ${idx('purete')}`}>
            <Section titre="Commandes du spectrophotomètre" ouvert={ouverts.commandes} onBascule={() => setOuverts(o => ({ ...o, commandes: !o.commandes }))}>
              {enGuide && !vu('eau') ? <div style={{ fontSize: 13, color: KIT.txt2 }}>Les commandes apparaîtront au fil du parcours.</div> : commandes}
            </Section>
          </div>
          {mode !== 'explore' && vu('mesures') && <div data-apparait={`${idx('mesures')} ${idx('trace')}`}>
            <Section titre="Mesures et courbe d'étalonnage" ouvert={ouverts.tableau} onBascule={() => setOuverts(o => ({ ...o, tableau: !o.tableau }))}>
              {tableau}
              {(vu('trace') || enDefi) && <div style={{ marginTop: 10 }}>{courbe}</div>}
            </Section>
          </div>}
        </div>
      </>}
    </div>
  );
}

// Unité de k : l'inverse de l'unité de concentration (A est sans unité)
const uniteInverse = u => { const m = u.match(/^(\w+)\/L$/); return m ? `L/${m[1]}` : `(${u})⁻¹`; };
const cellule = { padding: '5px 6px', border: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5 };
