import { teinte } from "./cuisineDilutionModele";

// Scène de labo (SVG animé, tons clairs) du jeu « Urgence au labo » (sim 291).
// Le ballon de réaction est dans le meuble sous la paillasse ; il chauffe d'autant plus que le temps restant diminue (u de 0 à 1).
// états : calme (menu, histoire) · jeu · verse (la solution est versée dans l'entonnoir) · boom (explosion) · sauve (réaction maîtrisée)
const mix = (a, b, t) => { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = h(a), B = h(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const COULEUR_LIQUIDE = u => (u < 0.5 ? mix('#7fd1ff', '#ffc27a', u / 0.5) : mix('#ffc27a', '#ff5a4a', (u - 0.5) / 0.5));
const COULEUR_TEMPS = u => (u < 0.5 ? '#15803d' : u < 0.75 ? '#b45309' : '#dc2626');
const FRAGMENTS = [[-120, -90, 40], [-60, -140, -70], [10, -150, 110], [90, -120, -30], [140, -50, 80], [-150, -20, -110], [120, 40, 150], [-90, 60, 60], [40, 70, -140], [-20, -60, 20], [70, -80, -90], [-130, -110, 130]];

export const STYLE_LABO = `
@keyframes lb-tremble{0%,100%{transform:translate(0,0)}25%{transform:translate(calc(var(--amp)*-1),calc(var(--amp)*.5))}50%{transform:translate(var(--amp),calc(var(--amp)*-.5))}75%{transform:translate(calc(var(--amp)*-.6),calc(var(--amp)*-.4))}}
@keyframes lb-bulle{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-52px);opacity:0}}
@keyframes lb-vapeur{0%{transform:translateY(0) scale(.7);opacity:0}30%{opacity:.7}100%{transform:translateY(-46px) scale(1.5);opacity:0}}
@keyframes lb-alarme{0%,49%{opacity:1}50%,100%{opacity:.15}}
@keyframes lb-debit{to{stroke-dashoffset:-30}}
@keyframes lb-verse{0%{transform:rotate(0)}30%,70%{transform:rotate(-52deg)}100%{transform:rotate(0)}}
@keyframes lb-flash{0%{opacity:0}8%{opacity:.95}100%{opacity:0}}
@keyframes lb-eclat{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot));opacity:0}}
@keyframes lb-fumee{0%{transform:scale(.3);opacity:.85}100%{transform:scale(2.6);opacity:0}}
@keyframes lb-secousse{0%,100%{transform:translate(0,0)}10%{transform:translate(-9px,5px)}20%{transform:translate(8px,-6px)}30%{transform:translate(-7px,-4px)}45%{transform:translate(6px,5px)}60%{transform:translate(-4px,3px)}80%{transform:translate(2px,-2px)}}
@keyframes lb-boum{0%{transform:scale(.2) rotate(-8deg);opacity:0}25%{transform:scale(1.15) rotate(-4deg);opacity:1}100%{transform:scale(1) rotate(-4deg);opacity:1}}
@keyframes lb-etoile{0%{transform:scale(.2);opacity:0}40%{opacity:1}100%{transform:scale(1.2) translateY(-20px);opacity:0}}
.lb-tremble{animation:lb-tremble var(--dur) ease-in-out infinite}
.lb-bulle{animation:lb-bulle var(--bd) ease-in infinite}
.lb-vapeur{animation:lb-vapeur 2.4s ease-out infinite}
.lb-alarme{animation:lb-alarme .7s steps(1) infinite}
.lb-debit{stroke-dasharray:9 7;animation:lb-debit .5s linear infinite}
.lb-verse{animation:lb-verse 2s ease-in-out both}
.lb-flash{animation:lb-flash 1.1s ease-out both}
.lb-eclat{animation:lb-eclat 1.5s cubic-bezier(.1,.6,.3,1) both}
.lb-fumee{animation:lb-fumee 2.6s ease-out both}
.lb-secousse{animation:lb-secousse .9s ease-in-out}
.lb-boum{animation:lb-boum .5s .15s ease-out both}
.lb-etoile{animation:lb-etoile 1.6s ease-out both}
@media (prefers-reduced-motion:reduce){.lb-tremble,.lb-bulle,.lb-vapeur,.lb-alarme,.lb-debit,.lb-verse,.lb-flash,.lb-eclat,.lb-fumee,.lb-secousse,.lb-etoile{animation:none}.lb-boum{animation:none;opacity:1}}
`;

export function LaboScene({ u = 0, etat = 'calme', temp = 35, temps = '', stock = '1,0', beaker = null, delta = null }) {
  const boom = etat === 'boom', sauve = etat === 'sauve', verse = etat === 'verse';
  const uv = boom ? 1 : sauve ? 0.05 : u;          // intensité visuelle
  const liquide = COULEUR_LIQUIDE(uv);
  const amp = (0.4 + 3.4 * uv).toFixed(2) + 'px', dur = (1.1 - 0.8 * uv).toFixed(2) + 's';
  const bd = (2.8 - 2.1 * uv).toFixed(2) + 's';
  const aiguille = -90 + 180 * Math.max(0, Math.min(1, (temp - 35) / 145));   // angle de l'aiguille du cadran
  const tint = beaker ? teinte(beaker.conc) : 0.1;
  const alerte = !boom && !sauve && etat !== 'calme' && uv > 0.55;
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label={boom ? 'Le ballon a explosé sous la paillasse' : sauve ? 'La réaction est maîtrisée, le ballon est calme' : `Laboratoire : le ballon sous la paillasse chauffe, ${temp} degrés Celsius`}
      style={{ width: '100%', display: 'block', borderRadius: 22, border: '2px solid #d5dfeb', background: '#e8f3fb', boxShadow: '0 6px 20px rgba(11,79,148,.10)' }}>
      <defs>
        <linearGradient id="lb-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eaf5fc" /><stop offset="1" stopColor="#d2e5f3" /></linearGradient>
        <linearGradient id="lb-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fd0f7" /><stop offset="1" stopColor="#e9f7ff" /></linearGradient>
        <linearGradient id="lb-bois" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3e8d2" /><stop offset="1" stopColor="#e6d5b6" /></linearGradient>
        <linearGradient id="lb-verre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".5" stopColor="#fff" stopOpacity=".15" /><stop offset="1" stopColor="#fff" stopOpacity=".6" /></linearGradient>
        <radialGradient id="lb-chauffe" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ff9a3c" stopOpacity=".95" /><stop offset="1" stopColor="#ff9a3c" stopOpacity="0" /></radialGradient>
        <pattern id="lb-carreaux" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" /></pattern>
        <clipPath id="lb-corps"><circle cx="205" cy="362" r="44" /></clipPath>
        <clipPath id="lb-cavite"><rect x="52" y="302" width="510" height="110" rx="6" /></clipPath>
      </defs>
      <g className={boom ? 'lb-secousse' : undefined}>
        {/* mur, carreaux, fenêtre */}
        <rect width="800" height="276" fill="url(#lb-mur)" /><rect width="800" height="276" fill="url(#lb-carreaux)" />
        <rect x="36" y="34" width="176" height="126" rx="8" fill="#fff" stroke="#c4d4e3" strokeWidth="3" />
        <rect x="46" y="44" width="156" height="106" rx="4" fill="url(#lb-ciel)" />
        <circle cx="168" cy="76" r="17" fill="#ffe08a" /><ellipse cx="92" cy="92" rx="30" ry="11" fill="#fff" fillOpacity=".9" /><ellipse cx="110" cy="85" rx="20" ry="10" fill="#fff" fillOpacity=".9" />
        <path d="M124 44V150M46 97H202" stroke="#fff" strokeWidth="5" />
        {/* panneau « sécurité » */}
        <rect x="226" y="52" width="46" height="46" rx="10" fill="#ffd34d" stroke="#d99a00" strokeWidth="2" /><text x="249" y="84" textAnchor="middle" fontSize="26">🥽</text>
        {/* minuterie d'alerte */}
        <g>
          <rect x="296" y="26" width="212" height="98" rx="16" fill="#fff" stroke="#c4d4e3" strokeWidth="3" />
          <text x="402" y="50" textAnchor="middle" fontSize="13" fontWeight="800" fill="#64748b" letterSpacing="2">{boom ? 'TROP TARD' : sauve ? 'MAÎTRISÉ' : 'AVANT EXPLOSION'}</text>
          <text x="402" y="102" textAnchor="middle" fontSize="48" fontWeight="800" fontFamily="Outfit, Inter, sans-serif" fill={boom ? '#dc2626' : sauve ? '#15803d' : temps ? COULEUR_TEMPS(uv) : '#94a3b8'}>{boom ? '00:00' : temps || '--:--'}</text>
          <circle cx="490" cy="42" r="8" fill={alerte ? '#ef4444' : sauve ? '#22c55e' : '#cbd5e1'} className={alerte ? 'lb-alarme' : undefined} />
        </g>
        {/* cadran de température */}
        <g transform="translate(634 112)">
          <path d="M-66 0A66 66 0 0 1 66 0Z" fill="#fff" stroke="#c4d4e3" strokeWidth="3" />
          <path d="M-58 0A58 58 0 0 1 -29 -50" fill="none" stroke="#22c55e" strokeWidth="9" /><path d="M-29 -50A58 58 0 0 1 29 -50" fill="none" stroke="#f59e0b" strokeWidth="9" /><path d="M29 -50A58 58 0 0 1 58 0" fill="none" stroke="#ef4444" strokeWidth="9" />
          <g style={{ transform: `rotate(${boom ? 90 : aiguille}deg)`, transition: 'transform .6s ease-out' }}><line x1="0" y1="0" x2="0" y2="-50" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" /></g>
          <circle r="7" fill="#1e293b" />
          <text y="22" textAnchor="middle" fontSize="19" fontWeight="800" fill="#1e293b" fontFamily="Outfit, Inter, sans-serif">{boom ? '180 °C' : `${temp} °C`}</text>
        </g>
        {/* étagère et flacons */}
        <rect x="548" y="214" width="236" height="8" rx="3" fill="#cdbb9a" />
        <g>
          <g><rect x="562" y="156" width="52" height="58" rx="9" fill="#c98a2b" fillOpacity=".92" stroke="#8a5a14" strokeWidth="2" /><rect x="576" y="140" width="24" height="18" rx="4" fill="#8a5a14" />
            <rect x="568" y="170" width="40" height="30" rx="4" fill="#fff" /><text x="588" y="184" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e293b">S₀</text><text x="588" y="196" textAnchor="middle" fontSize="9" fill="#475569">{stock} mol/L</text></g>
          <g><rect x="632" y="168" width="34" height="46" rx="7" fill="#7dd3fc" fillOpacity=".8" stroke="#38a3d9" strokeWidth="2" /><rect x="642" y="154" width="14" height="16" rx="3" fill="#38a3d9" /></g>
          <g><rect x="680" y="176" width="30" height="38" rx="6" fill="#86efac" fillOpacity=".85" stroke="#3dbb6b" strokeWidth="2" /><rect x="688" y="164" width="14" height="14" rx="3" fill="#3dbb6b" /></g>
          <g><path d="M726 214V182Q726 168 740 168Q754 168 754 182V214Z" fill="#fff" fillOpacity=".8" stroke="#94a3b8" strokeWidth="2" /><rect x="733" y="150" width="14" height="20" rx="3" fill="#94a3b8" /></g>
        </g>

        {/* paillasse */}
        <rect x="0" y="270" width="800" height="24" fill="#f8fafc" stroke="#c4d4e3" strokeWidth="2" /><rect x="0" y="270" width="800" height="6" fill="#fff" />
        <rect x="0" y="294" width="800" height="126" fill="url(#lb-bois)" />
        <rect x="560" y="304" width="224" height="108" rx="8" fill="#efe1c4" stroke="#d8c39b" strokeWidth="2" /><circle cx="574" cy="360" r="5" fill="#b49a6a" />
        <g transform="translate(676 336)"><path d="M0 -26L24 18H-24Z" fill="#ffd34d" stroke="#d99a00" strokeWidth="3" strokeLinejoin="round" /><text y="12" textAnchor="middle" fontSize="22" fontWeight="800" fill="#7c4a03">!</text></g>

        {/* meuble ouvert : le ballon sous la paillasse */}
        <rect x="46" y="296" width="522" height="120" rx="8" fill="#d8e2ec" stroke="#b8c7d6" strokeWidth="2" />
        <g clipPath="url(#lb-cavite)">
          <rect x="52" y="302" width="510" height="110" fill="#e9eff5" /><rect x="52" y="302" width="510" height="14" fill="#cdd8e3" />
          {/* lueur de chauffe */}
          <circle cx="205" cy="372" r={70 + 40 * uv} fill="url(#lb-chauffe)" style={{ opacity: boom ? 0 : 0.15 + 0.85 * uv, transition: 'opacity .6s' }} />
          {/* tuyau d'arrivée */}
          <path d="M510 270V312H228V322" fill="none" stroke="#9fb4c8" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M510 270V312H228V322" fill="none" stroke="#e6f2fb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {verse && <path className="lb-debit" d="M510 270V312H228V322" fill="none" stroke="#38a3e8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
          {/* chauffe-ballon */}
          <path d="M150 398H260L248 384H162Z" fill="#8b9bb0" stroke="#64748b" strokeWidth="2" /><rect x="168" y="394" width="74" height="6" rx="3" fill="#ff7a3c" style={{ opacity: boom ? 0 : 0.35 + 0.65 * uv }} />
          {!boom && (
            <g className={uv > 0.12 && !sauve ? 'lb-tremble' : undefined} style={{ '--amp': amp, '--dur': dur }}>
              {/* ballon */}
              <rect x="196" y="304" width="18" height="30" fill="#fff" fillOpacity=".5" stroke="#9db3c8" strokeWidth="2.5" />
              <circle cx="205" cy="362" r="44" fill="#fff" fillOpacity=".35" stroke="#9db3c8" strokeWidth="3" />
              <g clipPath="url(#lb-corps)">
                <rect x="150" y={sauve ? 358 : 352 - 6 * uv} width="110" height="70" fill={liquide} style={{ transition: 'fill .8s' }} />
                {[0, 1, 2, 3, 4, 5].map(k => <circle key={k} className="lb-bulle" cx={178 + k * 11} cy={394 - (k % 2) * 8} r={2.4 + (k % 3)} fill="#fff" fillOpacity=".85" style={{ '--bd': bd, animationDelay: `${(k * 0.37).toFixed(2)}s`, animationPlayState: sauve ? 'paused' : 'running' }} />)}
              </g>
              <ellipse cx="190" cy="346" rx="9" ry="16" fill="url(#lb-verre)" transform="rotate(25 190 346)" />
              {/* bouchon, thermomètre */}
              <rect x="195" y="300" width="20" height="9" rx="3" fill="#475569" />
              <line x1="224" y1="296" x2="224" y2="352" stroke="#64748b" strokeWidth="3" strokeLinecap="round" /><line x1="224" y1={352 - 54 * Math.max(0.05, Math.min(1, (temp - 35) / 145))} x2="224" y2="352" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              {uv > 0.4 && !sauve && [0, 1, 2].map(k => <circle key={k} className="lb-vapeur" cx={196 + k * 9} cy={296} r="6" fill="#fff" fillOpacity=".8" style={{ animationDelay: `${k * 0.7}s` }} />)}
            </g>)}
          {boom && <g>
            <circle cx="205" cy="360" r="120" fill="#2a2a2a" fillOpacity=".18" />
            {[0, 1, 2].map(k => <circle key={k} className="lb-fumee" cx={190 + k * 18} cy={350} r="30" fill="#9ca3af" style={{ animationDelay: `${k * 0.25}s`, transformOrigin: `${190 + k * 18}px 350px` }} />)}
          </g>}
        </g>
        {/* éclats (hors du clip pour voler dans toute la scène) */}
        {boom && FRAGMENTS.map(([dx, dy, rot], k) => (
          <polygon key={k} className="lb-eclat" points="0,-9 8,6 -7,7" fill={k % 2 ? '#bfe3f7' : '#e2e8f0'} stroke="#8aa4bb" strokeWidth="1.5" style={{ '--dx': `${dx * 1.5}px`, '--dy': `${dy * 1.5}px`, '--rot': `${rot * 3}deg`, transform: 'translate(205px, 355px)', transformOrigin: '0 0' }} />))}
        {/* porte du meuble, ouverte */}
        <path d="M46 296L18 312V404L46 416Z" fill="#e6d5b6" stroke="#cdb88d" strokeWidth="2" />
        <circle cx="30" cy="358" r="3.5" fill="#b49a6a" />

        {/* poste de préparation sur la paillasse */}
        <g>
          <path d="M486 232H534L518 258V268H502V258Z" fill="#fff" fillOpacity=".75" stroke="#9db3c8" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="506" y="266" width="8" height="6" fill="#9db3c8" />
          <g transform="translate(704 270)">
            <path d="M-12 -8Q-12 -26 -2 -34V-62H8V-34Q18 -26 18 -8Q18 4 3 4Q-12 4 -12 -8Z" fill="#fff" fillOpacity=".6" stroke="#9db3c8" strokeWidth="2.5" /><line x1="-4" y1="-50" x2="10" y2="-50" stroke="#ef4444" strokeWidth="2" />
          </g>
          {/* bécher : la solution préparée */}
          {beaker ? (
            <g className={verse ? 'lb-verse' : undefined} style={{ transformOrigin: '590px 222px', transformBox: 'view-box' }}>
              <path d="M590 222L598 270H654L662 222Z" fill="#fff" fillOpacity=".45" stroke="#9db3c8" strokeWidth="3" strokeLinejoin="round" />
              <path d={`M${593 + 0} 236L598 270H654L${659} 236Z`} fill="#2b8fd6" fillOpacity={tint} />
              <path d="M590 222L598 270H654L662 222Z" fill="url(#lb-verre)" fillOpacity=".5" />
              <text x="626" y="262" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a" fillOpacity=".7">{beaker.V} mL</text>
            </g>) : (
            <g opacity=".55"><path d="M590 222L598 270H654L662 222Z" fill="#fff" fillOpacity=".3" stroke="#9db3c8" strokeWidth="2.5" strokeDasharray="5 5" strokeLinejoin="round" /></g>)}
          {verse && <path className="lb-debit" d="M586 226Q540 226 522 250" fill="none" stroke="#38a3e8" strokeWidth="5" strokeLinecap="round" />}
        </g>

        {/* effets d'état */}
        {delta != null && verse && <text x="205" y="300" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0369a1" className="lb-etoile" stroke="#fff" strokeWidth="5" paintOrder="stroke">❄️ −{delta} °C</text>}
        {sauve && [0, 1, 2, 3].map(k => <text key={k} className="lb-etoile" x={150 + k * 30} y={300} fontSize="24" style={{ animationDelay: `${k * 0.2}s` }}>✨</text>)}
      </g>
      {boom && <rect width="800" height="420" fill="#fff" className="lb-flash" style={{ pointerEvents: 'none' }} />}
      {boom && <g className="lb-boum" style={{ transformOrigin: '400px 190px' }}><text x="400" y="210" textAnchor="middle" fontSize="92" fontWeight="800" fontFamily="Outfit, Inter, sans-serif" fill="#ef4444" stroke="#fff" strokeWidth="10" paintOrder="stroke">BOUM !</text></g>}
    </svg>);
}
