import { useState, useEffect, useMemo, useRef } from "react";
import { useEtatPersistant } from "../commun";
import { CLE_HORODATAGE } from "../suivi";
import { CLE_PARTIE_KEPLER } from "./escapeKeplerConstantes";
import { MODULES, CONTROLE, DUREE_MIN, MALUS_INDICE_S, MALUS_CODE_S, chiffre, codeAttendu, nouvellePartie, reparee, nbReparees, controleReussi, nbIndices, ecoule, restant, mmss } from "./escapeKeplerModele";

// ====================================================
//  SIM 79 : MISSION KEPLER (escape game). Cinq épreuves = cinq défis de simulations existantes ; voir escapeKeplerModele.js.
//  Hors menu : on l'ouvre par son lien (?sim=79). La partie est mémorisée sur l'appareil ; un bouton flottant (RetourMission)
//  ramène à la station depuis la simulation en cours.
// ====================================================
const CLE_PARTIE = CLE_PARTIE_KEPLER;
const C = { fond: '#040a1c', panneau: '#0a1530', bord: '#1c3a6b', texte: '#e6f0ff', doux: '#8fa6c9', cyan: '#38e1ff', rouge: '#ff4d5e', vert: '#3be29a', ambre: '#ffc15a' };

// Hors composant : mémorise le mode « défi » demandé et la mission en cours (lu par RetourMission)
function memoriserLancement(m) {
  try {
    window.sessionStorage.setItem('mode-demande', JSON.stringify({ mode: 'defi', t: Date.now() }));
    window.sessionStorage.setItem('escape-retour', JSON.stringify({ id: m.id, sim: m.sim }));
  } catch { /* sans mémorisation : la simulation s'ouvrira sur le parcours guidé */ }
}

const lireHorodatages = () => { try { return JSON.parse(window.localStorage.getItem(CLE_HORODATAGE) || '{}'); } catch { return {}; } };

// Étoiles : positions fixes (générateur congruentiel), pour que le fond ne change pas d'un rendu à l'autre
const ETOILES = (() => { let s = 7; const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  return Array.from({ length: 90 }, () => ({ x: Math.round(r() * 800), y: Math.round(r() * 380), r: 0.5 + r() * 1.3, d: (r() * 4).toFixed(1) })); })();

// Pictogrammes des modules (dessinés autour de l'origine, dans un carré de 40)
const Glyphe = ({ id, couleur }) => {
  const p = { fill: 'none', stroke: couleur, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'orientation') return <g {...p}><path d="M-15 -7 Q0 20 15 -7 Z" /><path d="M0 5 L0 -13" /><circle cx="0" cy="-15" r="2.5" fill={couleur} /><path d="M-7 15 H7" /></g>;
  if (id === 'thermique') return <g {...p}><rect x="-4" y="-15" width="8" height="22" rx="4" /><circle cx="0" cy="11" r="6.5" /><path d="M9 -8 h6 M9 -2 h6 M9 4 h6" /></g>;
  if (id === 'eau') return <g {...p}><path d="M0 -16 C11 -3 12 4 0 14 C-12 4 -11 -3 0 -16 Z" /><path d="M-4 5 Q-3 9 1 9" /></g>;
  if (id === 'reservoir') return <g {...p}><rect x="-13" y="-14" width="26" height="28" rx="4" /><path d="M-13 -2 Q-6.5 -6 0 -2 T13 -2" /><path d="M-13 6 Q-6.5 2 0 6 T13 6" /></g>;
  return <g {...p}><rect x="-15" y="-12" width="30" height="20" rx="3" /><path d="M-8 15 H8 M0 8 V15" /><path d="M-9 0 L-4 -4 L1 1 L9 -6" /></g>;
};
const Cadenas = ({ ouvert, couleur }) => <g fill="none" stroke={couleur} strokeWidth="2.4" strokeLinecap="round">
  <rect x="-10" y="-2" width="20" height="15" rx="3" fill={couleur} fillOpacity="0.18" />
  <path d={ouvert ? 'M-6 -2 V-8 A6 6 0 0 1 6 -8' : 'M-6 -2 V-7 A6 6 0 0 1 6 -7 V-2'} /></g>;

const STYLE = `
@keyframes kep-pulse{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes kep-flow{to{stroke-dashoffset:-28}}
@keyframes kep-twinkle{0%,100%{opacity:.9}50%{opacity:.25}}
@keyframes kep-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
.kep-led-panne{animation:kep-pulse 1s infinite}
.kep-led-ouvert{animation:kep-pulse 1.6s infinite}
.kep-flow{stroke-dasharray:6 8;animation:kep-flow 1.2s linear infinite}
.kep-star{animation:kep-twinkle 4s infinite}
.kep-shake{animation:kep-shake .45s}
.kep-mod{cursor:pointer;outline:none}
.kep-mod:hover .kep-cadre,.kep-mod:focus-visible .kep-cadre{stroke-width:3.2}
@media (prefers-reduced-motion:reduce){.kep-led-panne,.kep-led-ouvert,.kep-flow,.kep-star,.kep-shake{animation:none}}
`;

// Positions des modules sur le plan (centres)
const POS = { orientation: [150, 105], thermique: [650, 105], eau: [150, 265], reservoir: [650, 265], controle: [400, 185] };

function Station({ etat, chiffres, sel, onSel, hub, ariaLabel }) {
  const ligne = (id, [x, y]) => {
    const ok = etat[id] === 'repare';
    return <g key={id}>
      <line x1={400} y1={185} x2={x} y2={y} stroke={ok ? C.vert : '#27406e'} strokeWidth="5" strokeLinecap="round" opacity={ok ? 0.35 : 0.7} />
      {ok && <line className="kep-flow" x1={x} y1={y} x2={400} y2={185} stroke={C.vert} strokeWidth="2.2" />}
    </g>;
  };
  const carte = (m, i) => {
    const [x, y] = POS[m.id], st = etat[m.id], coul = st === 'repare' ? C.vert : C.rouge, choisi = sel === m.id;
    const ouvrir = () => onSel(m.id);
    return (
      <g key={m.id} className="kep-mod" role="button" tabIndex={0} aria-label={`${m.nom} : ${st === 'repare' ? 'réparé' : 'en panne'}`} transform={`translate(${x - 82} ${y - 38})`}
        onClick={ouvrir} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); } }}>
        <rect className="kep-cadre" width="164" height="76" rx="12" fill={C.panneau} stroke={coul} strokeWidth={choisi ? 3.4 : 1.8} />
        {choisi && <rect x="-5" y="-5" width="174" height="86" rx="16" fill="none" stroke={C.cyan} strokeWidth="1.4" strokeDasharray="5 5" />}
        <g transform="translate(34 38)"><Glyphe id={m.id} couleur={coul} /></g>
        <text x="64" y="30" fill={C.texte} fontSize="13.5" fontWeight="700">{m.court}</text>
        <text x="64" y="50" fill={coul} fontSize="11.5" fontWeight="700" letterSpacing="1">{st === 'repare' ? 'RÉPARÉ' : 'EN PANNE'}</text>
        <circle className={st === 'repare' ? '' : 'kep-led-panne'} cx="148" cy="14" r="5" fill={coul} />
        <circle cx="138" cy="60" r="11" fill="#050d24" stroke={st === 'repare' ? C.vert : C.bord} />
        <text x="138" y="65" textAnchor="middle" fontSize="14" fontWeight="800" fill={st === 'repare' ? C.vert : C.doux} fontFamily="ui-monospace,monospace">{st === 'repare' ? chiffres[i] : '?'}</text>
      </g>);
  };
  const [hx, hy] = POS.controle, hcoul = hub === 'repare' ? C.vert : hub === 'ouvert' ? C.cyan : C.doux;
  return (
    <svg viewBox="0 0 800 440" role="group" aria-label={ariaLabel} style={{ width: '100%', display: 'block', borderRadius: 14, background: C.fond }}>
      <defs>
        <linearGradient id="kep-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#02061a" /><stop offset="1" stopColor="#0a1f4a" /></linearGradient>
        <radialGradient id="kep-terre" cx="0.5" cy="0.12" r="0.9"><stop offset="0" stopColor="#4fc3ff" /><stop offset="0.35" stopColor="#1769c9" /><stop offset="1" stopColor="#06204a" /></radialGradient>
        <pattern id="kep-cellules" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#12408a" /><path d="M0 0H12M0 0V12" stroke="#5fa8ff" strokeWidth="0.8" opacity="0.7" /></pattern>
      </defs>
      <rect width="800" height="440" fill="url(#kep-ciel)" />
      {ETOILES.map((s, i) => <circle key={i} className="kep-star" cx={s.x} cy={s.y} r={s.r} fill="#cfe4ff" style={{ animationDelay: `${s.d}s` }} />)}
      <circle cx="400" cy="720" r="360" fill="#38b6ff" opacity="0.18" /><circle cx="400" cy="720" r="348" fill="url(#kep-terre)" />
      <path d="M52 410 Q200 372 400 366 Q600 372 748 410" fill="none" stroke="#8fd8ff" strokeWidth="2" opacity="0.5" />
      <g stroke="#2a4a86" strokeWidth="2"><rect x="330" y="62" width="140" height="32" rx="3" fill="url(#kep-cellules)" /><rect x="330" y="276" width="140" height="32" rx="3" fill="url(#kep-cellules)" /></g>
      <line x1="400" y1="94" x2="400" y2="150" stroke="#27406e" strokeWidth="4" /><line x1="400" y1="220" x2="400" y2="276" stroke="#27406e" strokeWidth="4" />
      {MODULES.map(m => ligne(m.id, POS[m.id]))}
      {MODULES.map(carte)}
      <g className="kep-mod" role="button" tabIndex={0} aria-label={`Salle de contrôle : ${hub === 'verrouille' ? 'verrouillée' : hub === 'repare' ? 'validée' : 'ouverte'}`} transform={`translate(${hx} ${hy})`}
        onClick={() => onSel('controle')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel('controle'); } }}>
        <circle className="kep-cadre" r="52" fill={C.panneau} stroke={hcoul} strokeWidth={sel === 'controle' ? 3.6 : 2} />
        <circle r="43" fill="none" stroke={hcoul} strokeWidth="1" strokeDasharray="3 5" opacity="0.7" />
        {sel === 'controle' && <circle r="60" fill="none" stroke={C.cyan} strokeWidth="1.4" strokeDasharray="5 5" />}
        {hub === 'verrouille' ? <g transform="translate(0 -6)"><Cadenas couleur={hcoul} /></g> : <g transform="translate(0 -8)"><Glyphe id="controle" couleur={hcoul} /></g>}
        <text y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill={hcoul} letterSpacing="1">{hub === 'verrouille' ? 'VERROUILLÉ' : hub === 'repare' ? 'VALIDÉ' : 'OUVERT'}</text>
        {hub === 'ouvert' && <circle className="kep-led-ouvert" cx="38" cy="-38" r="5" fill={C.cyan} />}
      </g>
      <text x="16" y="428" fontSize="11" fill="#7fb7ff" opacity="0.8" fontFamily="ui-monospace,monospace">STATION KEPLER · ORBITE BASSE</text>
    </svg>);
}

const bouton = (couleur, plein = true) => ({ padding: '9px 16px', borderRadius: 9, border: `1.5px solid ${couleur}`, background: plein ? couleur : 'transparent', color: plein ? '#04122e' : couleur, fontWeight: 800, cursor: 'pointer', fontSize: 14, font: 'inherit' });

export function SimulationEscapeKepler({ naviguer }) {
  const [partie, setPartie] = useEtatPersistant(CLE_PARTIE, null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [horo, setHoro] = useState(lireHorodatages);
  const [sel, setSel] = useState(null);
  const [code, setCode] = useState('');
  const [refus, setRefus] = useState(0);
  const [modeChoisi, setModeChoisi] = useState('classe');
  const [groupe, setGroupe] = useState(0);
  const refCode = useRef(null);
  useEffect(() => { const t = setInterval(() => { setMaintenant(Date.now()); setHoro(lireHorodatages()); }, 1000); return () => clearInterval(t); }, []);

  const partieOk = partie && typeof partie.debut === 'number';
  const etat = useMemo(() => Object.fromEntries(MODULES.map(m => [m.id, partieOk && reparee(partie, horo, m.sim) ? 'repare' : 'panne'])), [partie, partieOk, horo]);
  const nb = partieOk ? nbReparees(partie, horo) : 0;
  const finie = partieOk && (partie.fin != null || controleReussi(partie, horo));
  const hub = !partieOk ? 'verrouille' : finie ? 'repare' : partie.codeOkAt ? 'ouvert' : 'verrouille';
  useEffect(() => { if (partieOk && !partie.fin && controleReussi(partie, horo)) setPartie(p => ({ ...p, fin: Date.now() })); }, [partie, partieOk, horo, setPartie]);

  const g = partieOk ? partie.groupe || 0 : 0;
  const chiffres = MODULES.map((_, i) => chiffre(i, g));
  const lancer = m => { memoriserLancement(m); naviguer(m.sim); };
  const demanderIndice = m => setPartie(p => { const n = p.indices?.[m.id] || 0; return n >= 2 ? p : { ...p, indices: { ...p.indices, [m.id]: n + 1 } }; });
  const valider = e => {
    e.preventDefault();
    if (code === codeAttendu(g)) { setPartie(p => ({ ...p, codeOkAt: Date.now() })); setSel('controle'); setCode(''); }
    else { setPartie(p => ({ ...p, codeEssais: (p.codeEssais || 0) + 1 })); setRefus(r => r + 1); setCode(''); refCode.current?.focus(); }
  };
  const recommencer = () => { if (window.confirm('Recommencer la mission à zéro ? La partie en cours sera perdue.')) { setPartie(null); setSel(null); setCode(''); } };

  const cadre = { background: C.fond, color: C.texte, borderRadius: 16, padding: 'clamp(12px, 3vw, 22px)', maxWidth: 1000, margin: '0 auto', fontFamily: 'inherit' };
  const panneau = { background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '12px 14px' };

  if (!partieOk) return (
    <div style={cadre} data-escape="intro"><style>{STYLE}</style>
      <div style={{ fontFamily: 'ui-monospace,monospace', color: C.cyan, fontSize: 12.5, letterSpacing: 2 }}>CENTRE DE CONTRÔLE · ALERTE ROUGE</div>
      <h2 style={{ margin: '6px 0 10px', color: C.texte, fontSize: 'clamp(24px,5vw,34px)' }}>🛰️ Mission Kepler</h2>
      <p style={{ color: C.doux, lineHeight: 1.65, fontSize: 15.5, maxWidth: 720 }}>
        Une tempête solaire a grillé les automates de la station orbitale <b style={{ color: C.texte }}>Kepler</b>. Dans <b style={{ color: C.texte }}>{DUREE_MIN} minutes</b>, elle passera derrière la Terre et le contact radio sera perdu.
        Vous êtes l’équipe d’ingénieurs au sol : réparez à distance les <b style={{ color: C.texte }}>quatre modules</b> (chacun donne un chiffre), recomposez le <b style={{ color: C.texte }}>code du verrou d’amarrage</b>, puis validez la dernière mesure en <b style={{ color: C.texte }}>salle de contrôle</b>.
      </p>
      <Station etat={etat} chiffres={chiffres} sel={null} onSel={() => {}} hub="verrouille" ariaLabel="Plan de la station Kepler" />
      <div style={{ ...panneau, marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Règles de la mission</div>
        <ul style={{ margin: 0, paddingLeft: 20, color: C.doux, lineHeight: 1.7, fontSize: 14.5 }}>
          <li>Chaque module se répare en <b style={{ color: C.texte }}>réussissant le défi</b> de sa simulation. Vous pouvez vous répartir les modules dans le groupe, chacun sur son écran.</li>
          <li>Seules comptent les réparations réussies <b style={{ color: C.texte }}>après le début de la partie</b>.</li>
          <li>En mode classe : {DUREE_MIN} minutes, un indice coûte {MALUS_INDICE_S / 60} minutes, un code refusé {MALUS_CODE_S / 60} minute.</li>
        </ul>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '14px 0 4px' }}>
          <button type="button" aria-pressed={modeChoisi === 'classe'} onClick={() => setModeChoisi('classe')} style={bouton(C.ambre, modeChoisi === 'classe')}>⏱️ Mode classe</button>
          <button type="button" aria-pressed={modeChoisi === 'libre'} onClick={() => setModeChoisi('libre')} style={bouton(C.cyan, modeChoisi === 'libre')}>🧭 Mode libre (sans chrono)</button>
          <label style={{ color: C.doux, fontSize: 14 }}>Groupe n°{' '}
            <select value={groupe} onChange={e => setGroupe(Number(e.target.value))} style={{ background: C.fond, color: C.texte, border: `1px solid ${C.bord}`, borderRadius: 6, padding: '5px 8px', font: 'inherit' }}>
              <option value={0}>—</option>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
            </select></label>
          <button type="button" data-demarrer onClick={() => { setPartie(nouvellePartie(modeChoisi, groupe)); setSel(null); }} style={{ ...bouton(C.vert), marginLeft: 'auto' }}>🚀 Démarrer la mission</button>
        </div>
        <div style={{ fontSize: 12.5, color: C.doux }}>Le numéro de groupe change le code : deux groupes n’ont pas le même.</div>
      </div>
    </div>);

  const restantS = restant(partie, maintenant), classe = partie.mode === 'classe';
  const tempsEcoule = restantS <= 0 && classe && !finie;
  const mod = sel === 'controle' ? CONTROLE : MODULES.find(m => m.id === sel);
  const nIndices = mod ? partie.indices?.[mod.id] || 0 : 0;

  if (finie) return (
    <div style={cadre} data-escape="fin"><style>{STYLE}</style>
      <div style={{ fontFamily: 'ui-monospace,monospace', color: C.vert, fontSize: 12.5, letterSpacing: 2 }}>MISSION ACCOMPLIE</div>
      <h2 style={{ margin: '6px 0 10px', fontSize: 'clamp(24px,5vw,34px)' }}>🎉 Kepler est sauvée !</h2>
      <Station etat={etat} chiffres={chiffres} sel={null} onSel={() => {}} hub="repare" ariaLabel="Station Kepler, tous les modules réparés" />
      <div style={{ ...panneau, marginTop: 14, lineHeight: 1.7 }}>
        <p style={{ margin: 0, fontSize: 16 }}>Les cinq systèmes sont rétablis : l’antenne s’oriente, les batteries sont refroidies, l’eau est recyclée, le réservoir est régulé et la télémesure est validée. Le contact radio est maintenu.</p>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '12px 0', fontFamily: 'ui-monospace,monospace' }}>
          <div>Temps<br /><b style={{ fontSize: 22, color: C.cyan }}>{mmss(ecoule(partie, maintenant))}</b></div>
          {classe && <div>Avec pénalités<br /><b style={{ fontSize: 22, color: restantS >= 0 ? C.vert : C.ambre }}>{mmss(DUREE_MIN * 60 - restantS)}</b></div>}
          <div>Indices<br /><b style={{ fontSize: 22, color: C.cyan }}>{nbIndices(partie)}</b></div>
          <div>Codes refusés<br /><b style={{ fontSize: 22, color: C.cyan }}>{partie.codeEssais || 0}</b></div>
          {partie.groupe ? <div>Groupe<br /><b style={{ fontSize: 22, color: C.cyan }}>{partie.groupe}</b></div> : null}
        </div>
        {classe && <div style={{ color: restantS >= 0 ? C.vert : C.ambre, fontWeight: 700 }}>{restantS >= 0 ? `Dans les temps : il restait ${mmss(restantS)}.` : `Hors délai de ${mmss(-restantS)}, mais la mission est réussie.`}</div>}
        <div style={{ marginTop: 12 }}><button type="button" onClick={() => { setPartie(null); setSel(null); }} style={bouton(C.cyan, false)}>↺ Nouvelle mission</button></div>
      </div>
    </div>);

  return (
    <div style={cadre} data-escape="jeu"><style>{STYLE}</style>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, fontFamily: 'ui-monospace,monospace' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: tempsEcoule ? C.rouge : restantS < 300 && classe ? C.ambre : C.cyan }} data-chrono aria-label="Temps">
          {classe ? <>T − {mmss(Math.max(0, restantS))}</> : <>⏱ {mmss(ecoule(partie, maintenant))}</>}
        </div>
        <div style={{ color: C.doux, fontSize: 13.5 }}>Modules réparés : <b style={{ color: C.texte }} data-nb>{nb}/4</b> · Indices : <b style={{ color: C.texte }}>{nbIndices(partie)}</b>{partie.groupe ? <> · Groupe <b style={{ color: C.texte }}>{partie.groupe}</b></> : null}</div>
        <button type="button" onClick={recommencer} style={{ background: 'none', border: 'none', color: C.doux, textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5 }}>Recommencer</button>
      </div>
      {tempsEcoule && <div role="alert" style={{ ...panneau, borderColor: C.rouge, color: '#ffc2c8', marginBottom: 10 }}>📡 <b>Contact perdu.</b> Le temps est écoulé, mais vous pouvez terminer la mission : elle sera comptée « hors délai ».</div>}
      <Station etat={etat} chiffres={chiffres} sel={sel} onSel={setSel} hub={hub} ariaLabel="Plan de la station Kepler : choisissez un module" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={panneau} data-module-panel>
          {!mod && <div style={{ color: C.doux, lineHeight: 1.6 }}>👆 Choisis un module sur le plan pour voir la panne et lancer la réparation. Les quatre modules sont indépendants : répartissez-vous le travail.</div>}
          {mod && (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="38" height="38" viewBox="-20 -20 40 40" aria-hidden="true"><Glyphe id={mod.id} couleur={C.cyan} /></svg>
              <div><div style={{ fontWeight: 800, fontSize: 17 }}>{mod.nom}</div>
                <div style={{ fontSize: 12, letterSpacing: 1, fontWeight: 700, color: mod.id === 'controle' ? (hub === 'verrouille' ? C.doux : C.cyan) : etat[mod.id] === 'repare' ? C.vert : C.rouge }}>
                  {mod.id === 'controle' ? (hub === 'verrouille' ? 'VERROUILLÉE' : 'OUVERTE') : etat[mod.id] === 'repare' ? 'RÉPARÉ' : 'EN PANNE'}</div></div>
            </div>
            {mod.id === 'controle' && hub === 'verrouille'
              ? <p style={{ color: C.doux, lineHeight: 1.6 }}>🔒 La salle de contrôle s’ouvre avec le <b style={{ color: C.texte }}>code du verrou d’amarrage</b>. Réparez d’abord les quatre modules : chacun vous donne un chiffre.</p>
              : (<>
                <p style={{ color: C.doux, lineHeight: 1.6, margin: '10px 0 6px' }}>{mod.panne}</p>
                <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}><b style={{ color: C.ambre }}>Mission :</b> {mod.mission}</p>
                {mod.id !== 'controle' && etat[mod.id] === 'repare'
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ color: C.vert, fontWeight: 800 }}>✅ Réparé. Chiffre du code :</span><span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 30, fontWeight: 800, color: C.vert, border: `2px solid ${C.vert}`, borderRadius: 8, padding: '0 12px' }} data-chiffre={mod.id}>{chiffres[MODULES.indexOf(mod)]}</span></div>
                  : <button type="button" data-lancer={mod.id} onClick={() => lancer(mod)} style={bouton(C.cyan)}>🔧 Lancer la réparation ▶</button>}
                {(mod.id === 'controle' || etat[mod.id] !== 'repare') && <div style={{ marginTop: 12 }}>
                  {mod.indices.slice(0, nIndices).map((t, i) => <div key={i} style={{ background: '#0d2149', borderLeft: `3px solid ${C.ambre}`, padding: '6px 10px', margin: '6px 0', fontSize: 14, lineHeight: 1.55 }}>💡 {t}</div>)}
                  {nIndices < 2 && <button type="button" data-indice={mod.id} onClick={() => demanderIndice(mod)} style={{ ...bouton(C.ambre, false), padding: '6px 12px', fontSize: 13 }}>💡 Un indice{classe ? ` (−${MALUS_INDICE_S / 60} min)` : ''}</button>}
                </div>}
              </>)}
          </>)}
        </div>

        <div style={{ ...panneau, borderColor: hub === 'verrouille' ? C.bord : C.cyan }} data-verrou>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🔐 Verrou d’amarrage</div>
          {hub !== 'verrouille'
            ? <div style={{ color: C.cyan, lineHeight: 1.6 }}>✔ Code accepté. La <b>salle de contrôle</b> est ouverte : lancez l’épreuve finale.</div>
            : (<form onSubmit={valider}>
              <div style={{ color: C.doux, fontSize: 14, lineHeight: 1.55, marginBottom: 8 }}>Entre les quatre chiffres, dans l’ordre : <b style={{ color: C.texte }}>{MODULES.map(m => m.court).join(' · ')}</b>.</div>
              <div key={refus} className={refus ? 'kep-shake' : ''} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input ref={refCode} value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} inputMode="numeric" autoComplete="off" aria-label="Code à quatre chiffres" placeholder="••••"
                  style={{ width: 130, fontSize: 28, letterSpacing: 8, textAlign: 'center', fontFamily: 'ui-monospace,monospace', background: C.fond, color: C.texte, border: `2px solid ${C.bord}`, borderRadius: 8, padding: '4px 6px' }} />
                <button type="submit" disabled={code.length < 4} style={{ ...bouton(C.vert), opacity: code.length < 4 ? 0.45 : 1, cursor: code.length < 4 ? 'default' : 'pointer' }}>Valider</button>
              </div>
              {refus > 0 && <div role="alert" style={{ color: C.rouge, marginTop: 8, fontSize: 14 }}>❌ Code refusé{classe ? ` (−${MALUS_CODE_S / 60} min)` : ''}. Vérifiez les chiffres de chaque module et leur ordre.</div>}
              <div style={{ color: C.doux, fontSize: 12.5, marginTop: 8 }}>Chiffres obtenus : {MODULES.map((m, i) => <span key={m.id} style={{ fontFamily: 'ui-monospace,monospace', marginRight: 6 }}>{etat[m.id] === 'repare' ? chiffres[i] : '?'}</span>)}</div>
            </form>)}
        </div>
      </div>
    </div>);
}
