import { useState, useEffect, useMemo, useRef } from "react";
import { useEtatPersistant } from "../commun";
import { CLE_HORODATAGE } from "../suivi";
import { MODULES, CONTROLE, DUREE_MIN, MALUS_INDICE_S, MALUS_CODE_S, CLE_PARTIE_AQUA, chiffre, codeAttendu, nouvellePartie, reparee, nbReparees, controleReussi, nbIndices, ecoule, restant, mmss } from "./escapeAquaModele";

// ====================================================
//  SIM 80 : MISSION AQUA (mini escape game, chapitre « Transport des fluides »). Hors menu : ?sim=80.
// ====================================================
const C = { fond: '#06182b', panneau: '#0b2540', bord: '#1d4a7a', texte: '#e8f4ff', doux: '#93b4d3', cyan: '#4fd8ff', rouge: '#ff5a5f', vert: '#3be29a', ambre: '#ffc15a' };
const lireHorodatages = () => { try { return JSON.parse(window.localStorage.getItem(CLE_HORODATAGE) || '{}'); } catch { return {}; } };
function memoriserLancement(m) {
  try {
    window.sessionStorage.setItem('mode-demande', JSON.stringify({ mode: 'defi', t: Date.now() }));
    window.sessionStorage.setItem('escape-retour', JSON.stringify({ jeu: 'aqua', id: m.id, sim: m.sim }));
  } catch { /* sans mémorisation : la simulation s'ouvrira sur le parcours guidé */ }
}

const Glyphe = ({ id, couleur }) => {
  const p = { fill: 'none', stroke: couleur, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (id === 'manometre') return <g {...p}><circle cx="0" cy="-2" r="13" /><path d="M0 -2 L7 -9" /><path d="M-8 9 H8 M0 11 V15" /><circle cx="0" cy="-2" r="1.6" fill={couleur} /></g>;
  if (id === 'cuve') return <g {...p}><path d="M-12 -14 V10 Q0 17 12 10 V-14" /><path d="M-12 -4 Q-6 -8 0 -4 T12 -4" /><path d="M0 -17 V-9" /></g>;
  if (id === 'canalisation') return <g {...p}><path d="M-17 -8 H-4 L2 -4 H17 M-17 8 H-4 L2 4 H17" /><path d="M-10 0 H0 M-3 -3 L0 0 L-3 3" /></g>;
  return <g {...p}><circle cx="0" cy="0" r="12" /><path d="M0 -12 V-17 M-3 -17 H3" /><path d="M-6 3 Q0 -9 6 3" /></g>;
};
const Cadenas = ({ couleur }) => <g fill="none" stroke={couleur} strokeWidth="2.4" strokeLinecap="round"><rect x="-10" y="-2" width="20" height="15" rx="3" fill={couleur} fillOpacity="0.18" /><path d="M-6 -2 V-7 A6 6 0 0 1 6 -7 V-2" /></g>;

const STYLE = `
@keyframes aq-pulse{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes aq-flow{to{stroke-dashoffset:-28}}
@keyframes aq-wave{to{transform:translateX(-40px)}}
@keyframes aq-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
.aq-led{animation:aq-pulse 1s infinite}.aq-flow{stroke-dasharray:6 8;animation:aq-flow 1s linear infinite}
.aq-wave{animation:aq-wave 2.4s linear infinite}.aq-shake{animation:aq-shake .45s}
.aq-mod{cursor:pointer;outline:none}.aq-mod:hover .aq-cadre,.aq-mod:focus-visible .aq-cadre{stroke-width:3.2}
@media (prefers-reduced-motion:reduce){.aq-led,.aq-flow,.aq-wave,.aq-shake{animation:none}}
`;
const POS = { manometre: [150, 330], cuve: [400, 330], canalisation: [650, 330] };
const HUB = [400, 110];

function Station({ etat, chiffres, sel, onSel, hub, nb, ariaLabel }) {
  const niveau = hub === 'repare' ? 1 : nb / 3 * 0.75 + (hub === 'ouvert' ? 0.1 : 0);
  const hauteur = 60 * niveau, yEau = 138 - hauteur;
  return (
    <svg viewBox="0 0 800 440" role="group" aria-label={ariaLabel} style={{ width: '100%', display: 'block', borderRadius: 14, background: C.fond }}>
      <defs>
        <linearGradient id="aq-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a2a52" /><stop offset="1" stopColor="#1d5a8a" /></linearGradient>
        <clipPath id="aq-cuve"><rect x="360" y="78" width="80" height="62" rx="8" /></clipPath>
      </defs>
      <rect width="800" height="440" fill="url(#aq-ciel)" />
      <circle cx="690" cy="62" r="24" fill="#ffd98a" opacity="0.85" />
      <path d="M0 250 Q140 190 300 235 T560 220 T800 245 V440 H0 Z" fill="#12395e" /><path d="M0 300 Q200 270 400 295 T800 285 V440 H0 Z" fill="#0d2e4d" />
      {/* Château d'eau */}
      <path d="M385 140 L372 262 M415 140 L428 262 M386 190 H414 M380 225 H420" stroke="#5b86b0" strokeWidth="5" strokeLinecap="round" fill="none" />
      <g><rect x="360" y="78" width="80" height="62" rx="8" fill="#08233c" />
        <g clipPath="url(#aq-cuve)"><rect x="350" y={yEau} width="100" height="80" fill="#2aa7e8" opacity="0.9" /><path className="aq-wave" d={`M340 ${yEau} q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0`} stroke="#9fe2ff" strokeWidth="2" fill="none" /></g>
        <rect x="360" y="78" width="80" height="62" rx="8" fill="none" stroke={hub === 'repare' ? C.vert : hub === 'ouvert' ? C.cyan : C.doux} strokeWidth="3" /></g>
      {MODULES.map(m => {
        const [x, y] = POS[m.id], ok = etat[m.id] === 'repare';
        return <g key={m.id}><path d={`M${x} ${y - 38} V${y - 70} H${x < 400 ? 372 : x > 400 ? 428 : 400} V262`} fill="none" stroke={ok ? C.cyan : '#2a4d78'} strokeWidth="6" strokeLinejoin="round" opacity={ok ? 0.45 : 0.8} />
          {ok && <path className="aq-flow" d={`M${x} ${y - 38} V${y - 70} H${x < 400 ? 372 : x > 400 ? 428 : 400} V262`} fill="none" stroke="#bff0ff" strokeWidth="2.2" />}</g>;
      })}
      {MODULES.map((m, i) => {
        const [x, y] = POS[m.id], st = etat[m.id], coul = st === 'repare' ? C.vert : C.rouge, choisi = sel === m.id, ouvrir = () => onSel(m.id);
        return (
          <g key={m.id} className="aq-mod" role="button" tabIndex={0} aria-label={`${m.nom} : ${st === 'repare' ? 'réparé' : 'en panne'}`} transform={`translate(${x - 82} ${y - 38})`}
            onClick={ouvrir} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); } }}>
            <rect className="aq-cadre" width="164" height="76" rx="12" fill={C.panneau} stroke={coul} strokeWidth={choisi ? 3.4 : 1.8} />
            {choisi && <rect x="-5" y="-5" width="174" height="86" rx="16" fill="none" stroke={C.cyan} strokeWidth="1.4" strokeDasharray="5 5" />}
            <g transform="translate(34 38)"><Glyphe id={m.id} couleur={coul} /></g>
            <text x="64" y="30" fill={C.texte} fontSize="13.5" fontWeight="700">{m.court}</text>
            <text x="64" y="50" fill={coul} fontSize="11.5" fontWeight="700" letterSpacing="1">{st === 'repare' ? 'RÉPARÉ' : 'EN PANNE'}</text>
            <circle className={st === 'repare' ? '' : 'aq-led'} cx="148" cy="14" r="5" fill={coul} />
            <circle cx="138" cy="60" r="11" fill="#04142a" stroke={st === 'repare' ? C.vert : C.bord} />
            <text x="138" y="65" textAnchor="middle" fontSize="14" fontWeight="800" fill={st === 'repare' ? C.vert : C.doux} fontFamily="ui-monospace,monospace">{st === 'repare' ? chiffres[i] : '?'}</text>
          </g>);
      })}
      <g className="aq-mod" role="button" tabIndex={0} aria-label={`Pompe principale : ${hub === 'verrouille' ? 'verrouillée' : hub === 'repare' ? 'validée' : 'ouverte'}`} transform="translate(520 105)"
        onClick={() => onSel('pompe')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel('pompe'); } }}>
        <circle className="aq-cadre" r="36" fill={C.panneau} stroke={hub === 'repare' ? C.vert : hub === 'ouvert' ? C.cyan : C.doux} strokeWidth={sel === 'pompe' ? 3.6 : 2} />
        {sel === 'pompe' && <circle r="44" fill="none" stroke={C.cyan} strokeWidth="1.4" strokeDasharray="5 5" />}
        {hub === 'verrouille' ? <g transform="translate(0 -3)"><Cadenas couleur={C.doux} /></g> : <g transform="translate(0 -3)"><Glyphe id="pompe" couleur={hub === 'repare' ? C.vert : C.cyan} /></g>}
        <text y="28" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={hub === 'repare' ? C.vert : hub === 'ouvert' ? C.cyan : C.doux} letterSpacing="1">{hub === 'verrouille' ? 'VERROUILLÉE' : hub === 'repare' ? 'EN MARCHE' : 'OUVERTE'}</text>
      </g>
      <text x="16" y="428" fontSize="11" fill="#8fc4ee" opacity="0.85" fontFamily="ui-monospace,monospace">STATION DE POMPAGE · CHÂTEAU D’EAU</text>
    </svg>);
}

const bouton = (couleur, plein = true) => ({ padding: '9px 16px', borderRadius: 9, border: `1.5px solid ${couleur}`, background: plein ? couleur : 'transparent', color: plein ? '#04122e' : couleur, fontWeight: 800, cursor: 'pointer', fontSize: 14, font: 'inherit' });

export function SimulationEscapeAqua({ naviguer }) {
  const [partie, setPartie] = useEtatPersistant(CLE_PARTIE_AQUA, null);
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
    if (code === codeAttendu(g)) { setPartie(p => ({ ...p, codeOkAt: Date.now() })); setSel('pompe'); setCode(''); }
    else { setPartie(p => ({ ...p, codeEssais: (p.codeEssais || 0) + 1 })); setRefus(r => r + 1); setCode(''); refCode.current?.focus(); }
  };
  const recommencer = () => { if (window.confirm('Recommencer la mission à zéro ? La partie en cours sera perdue.')) { setPartie(null); setSel(null); setCode(''); } };

  const cadre = { background: C.fond, color: C.texte, borderRadius: 16, padding: 'clamp(12px, 3vw, 22px)', maxWidth: 1000, margin: '0 auto', fontFamily: 'inherit' };
  const panneau = { background: C.panneau, border: `1px solid ${C.bord}`, borderRadius: 12, padding: '12px 14px' };

  if (!partieOk) return (
    <div style={cadre} data-escape="intro"><style>{STYLE}</style>
      <div style={{ fontFamily: 'ui-monospace,monospace', color: C.cyan, fontSize: 12.5, letterSpacing: 2 }}>ALERTE · RÉSEAU D’EAU POTABLE</div>
      <h2 style={{ margin: '6px 0 10px', color: C.texte, fontSize: 'clamp(24px,5vw,34px)' }}>💧 Mission Aqua</h2>
      <p style={{ color: C.doux, lineHeight: 1.65, fontSize: 15.5, maxWidth: 720 }}>
        Après un orage, la station de pompage qui alimente le château d’eau du village est en panne. Le château d’eau sera <b style={{ color: C.texte }}>à sec dans {DUREE_MIN} minutes</b>.
        Vous êtes les techniciens d’astreinte : remettez en état les <b style={{ color: C.texte }}>trois capteurs</b> (chacun donne un chiffre), composez le <b style={{ color: C.texte }}>code de la vanne d’accès</b>, puis relancez la <b style={{ color: C.texte }}>pompe principale</b>.
      </p>
      <Station etat={etat} chiffres={chiffres} sel={null} onSel={() => {}} hub="verrouille" nb={0} ariaLabel="Plan de la station de pompage" />
      <div style={{ ...panneau, marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Règles de la mission</div>
        <ul style={{ margin: 0, paddingLeft: 20, color: C.doux, lineHeight: 1.7, fontSize: 14.5 }}>
          <li>Chaque capteur se répare en <b style={{ color: C.texte }}>réussissant le défi</b> de sa simulation. Répartissez-vous les trois capteurs dans le groupe.</li>
          <li>Seules comptent les réparations réussies <b style={{ color: C.texte }}>après le début de la partie</b>.</li>
          <li>En mode classe : {DUREE_MIN} minutes, un indice coûte {MALUS_INDICE_S / 60} minutes, un code refusé coûte {MALUS_CODE_S / 60} minute.</li>
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
  const mod = sel === 'pompe' ? CONTROLE : MODULES.find(m => m.id === sel);
  const nIndices = mod ? partie.indices?.[mod.id] || 0 : 0;

  if (finie) return (
    <div style={cadre} data-escape="fin"><style>{STYLE}</style>
      <div style={{ fontFamily: 'ui-monospace,monospace', color: C.vert, fontSize: 12.5, letterSpacing: 2 }}>MISSION ACCOMPLIE</div>
      <h2 style={{ margin: '6px 0 10px', color: C.texte, fontSize: 'clamp(24px,5vw,34px)' }}>🎉 Le village a de l’eau !</h2>
      <Station etat={etat} chiffres={chiffres} sel={null} onSel={() => {}} hub="repare" nb={3} ariaLabel="Château d’eau rempli, pompe en marche" />
      <div style={{ ...panneau, marginTop: 14, lineHeight: 1.7 }}>
        <p style={{ margin: 0, fontSize: 16 }}>Le manomètre est étalonné, les débits sont connus, les vitesses maîtrisées et la pompe est relancée : le château d’eau se remplit.</p>
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
        <div style={{ color: C.doux, fontSize: 13.5 }}>Capteurs réparés : <b style={{ color: C.texte }} data-nb>{nb}/3</b> · Indices : <b style={{ color: C.texte }}>{nbIndices(partie)}</b>{partie.groupe ? <> · Groupe <b style={{ color: C.texte }}>{partie.groupe}</b></> : null}</div>
        <button type="button" onClick={recommencer} style={{ background: 'none', border: 'none', color: C.doux, textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5 }}>Recommencer</button>
      </div>
      {tempsEcoule && <div role="alert" style={{ ...panneau, borderColor: C.rouge, color: '#ffc2c8', marginBottom: 10 }}>🚰 <b>Le château d’eau est à sec.</b> Le temps est écoulé, mais vous pouvez terminer la mission : elle sera comptée « hors délai ».</div>}
      <Station etat={etat} chiffres={chiffres} sel={sel} onSel={setSel} hub={hub} nb={nb} ariaLabel="Plan de la station de pompage : choisissez un capteur" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={panneau} data-module-panel>
          {!mod && <div style={{ color: C.doux, lineHeight: 1.6 }}>👆 Choisis un capteur sur le plan pour voir la panne et lancer la réparation. Les trois capteurs sont indépendants : répartissez-vous le travail.</div>}
          {mod && (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="38" height="38" viewBox="-20 -20 40 40" aria-hidden="true"><Glyphe id={mod.id} couleur={C.cyan} /></svg>
              <div><div style={{ fontWeight: 800, fontSize: 17 }}>{mod.nom}</div>
                <div style={{ fontSize: 12, letterSpacing: 1, fontWeight: 700, color: mod.id === 'pompe' ? (hub === 'verrouille' ? C.doux : C.cyan) : etat[mod.id] === 'repare' ? C.vert : C.rouge }}>
                  {mod.id === 'pompe' ? (hub === 'verrouille' ? 'VERROUILLÉE' : 'OUVERTE') : etat[mod.id] === 'repare' ? 'RÉPARÉ' : 'EN PANNE'}</div></div>
            </div>
            {mod.id === 'pompe' && hub === 'verrouille'
              ? <p style={{ color: C.doux, lineHeight: 1.6 }}>🔒 La pompe s’ouvre avec le <b style={{ color: C.texte }}>code de la vanne d’accès</b>. Réparez d’abord les trois capteurs : chacun vous donne un chiffre.</p>
              : (<>
                <p style={{ color: C.doux, lineHeight: 1.6, margin: '10px 0 6px' }}>{mod.panne}</p>
                <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}><b style={{ color: C.ambre }}>Mission :</b> {mod.mission}</p>
                {mod.id !== 'pompe' && etat[mod.id] === 'repare'
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ color: C.vert, fontWeight: 800 }}>✅ Réparé. Chiffre du code :</span><span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 30, fontWeight: 800, color: C.vert, border: `2px solid ${C.vert}`, borderRadius: 8, padding: '0 12px' }} data-chiffre={mod.id}>{chiffres[MODULES.indexOf(mod)]}</span></div>
                  : <button type="button" data-lancer={mod.id} onClick={() => lancer(mod)} style={bouton(C.cyan)}>🔧 Lancer la réparation ▶</button>}
                {(mod.id === 'pompe' || etat[mod.id] !== 'repare') && <div style={{ marginTop: 12 }}>
                  {mod.indices.slice(0, nIndices).map((t, i) => <div key={i} style={{ background: '#0d2f55', borderLeft: `3px solid ${C.ambre}`, padding: '6px 10px', margin: '6px 0', fontSize: 14, lineHeight: 1.55 }}>💡 {t}</div>)}
                  {nIndices < 2 && <button type="button" data-indice={mod.id} onClick={() => demanderIndice(mod)} style={{ ...bouton(C.ambre, false), padding: '6px 12px', fontSize: 13 }}>💡 Un indice{classe ? ` (−${MALUS_INDICE_S / 60} min)` : ''}</button>}
                </div>}
              </>)}
          </>)}
        </div>

        <div style={{ ...panneau, borderColor: hub === 'verrouille' ? C.bord : C.cyan }} data-verrou>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🔐 Vanne d’accès</div>
          {hub !== 'verrouille'
            ? <div style={{ color: C.cyan, lineHeight: 1.6 }}>✔ Code accepté. La <b>pompe principale</b> est accessible : lancez l’épreuve finale.</div>
            : (<form onSubmit={valider}>
              <div style={{ color: C.doux, fontSize: 14, lineHeight: 1.55, marginBottom: 8 }}>Entre les trois chiffres, dans l’ordre : <b style={{ color: C.texte }}>{MODULES.map(m => m.court).join(' · ')}</b>.</div>
              <div key={refus} className={refus ? 'aq-shake' : ''} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input ref={refCode} value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} inputMode="numeric" autoComplete="off" aria-label="Code à trois chiffres" placeholder="•••"
                  style={{ width: 110, fontSize: 28, letterSpacing: 8, textAlign: 'center', fontFamily: 'ui-monospace,monospace', background: C.fond, color: C.texte, border: `2px solid ${C.bord}`, borderRadius: 8, padding: '4px 6px' }} />
                <button type="submit" disabled={code.length < 3} style={{ ...bouton(C.vert), opacity: code.length < 3 ? 0.45 : 1, cursor: code.length < 3 ? 'default' : 'pointer' }}>Valider</button>
              </div>
              {refus > 0 && <div role="alert" style={{ color: C.rouge, marginTop: 8, fontSize: 14 }}>❌ Code refusé{classe ? ` (−${MALUS_CODE_S / 60} min)` : ''}. Vérifiez les chiffres de chaque capteur et leur ordre.</div>}
              <div style={{ color: C.doux, fontSize: 12.5, marginTop: 8 }}>Chiffres obtenus : {MODULES.map((m, i) => <span key={m.id} style={{ fontFamily: 'ui-monospace,monospace', marginRight: 6 }}>{etat[m.id] === 'repare' ? chiffres[i] : '?'}</span>)}</div>
            </form>)}
        </div>
      </div>
    </div>);
}
