import { teinte } from "./cuisineDilutionModele";

// Scène de labo (SVG animé, tons clairs) du jeu « Urgence au labo » (sim 291).
// Le ballon de réaction est dans le meuble sous la paillasse ; il chauffe d'autant plus que le temps restant diminue (u de 0 à 1).
// états : calme (menu, histoire) · jeu · verse (la solution est versée dans l'entonnoir) · boom (explosion) · sauve (réaction maîtrisée)
const mix = (a, b, t) => { const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = h(a), B = h(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const COULEUR_LIQUIDE = u => (u < 0.5 ? mix('#7fd1ff', '#ffc27a', u / 0.5) : mix('#ffc27a', '#ff5a4a', (u - 0.5) / 0.5));
const COULEUR_LED = u => (u < 0.5 ? '#4ade80' : u < 0.75 ? '#fbbf24' : '#f87171');
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
  const amp = (0.4 + 3.2 * uv).toFixed(2) + 'px', dur = (1.1 - 0.8 * uv).toFixed(2) + 's';
  const bd = (2.8 - 2.1 * uv).toFixed(2) + 's';
  const frac = Math.max(0, Math.min(1, (temp - 35) / 145));
  const aiguille = -120 + 240 * frac;              // aiguille du cadran : de −120° à +120°
  const tint = beaker ? teinte(beaker.conc) : 0.1;
  const alerte = !boom && !sauve && etat !== 'calme' && uv > 0.5;
  const led = boom ? '#f87171' : sauve ? '#4ade80' : temps ? COULEUR_LED(uv) : '#64748b';
  const FX = 330, FY = 366;                        // centre du ballon
  const arc = (a0, a1, r) => { const p = a => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  return (
    <svg viewBox="0 0 800 420" role="img" aria-label={boom ? 'Le ballon a explosé sous la paillasse' : sauve ? 'La réaction est maîtrisée, le ballon est calme' : `Laboratoire : le ballon sous la paillasse chauffe, ${temp} degrés Celsius`}
      style={{ width: '100%', display: 'block', borderRadius: 22, border: '2px solid #d5dfeb', background: '#dcecf8', boxShadow: '0 6px 20px rgba(11,79,148,.10)' }}>
      <defs>
        <linearGradient id="lb-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eef7fd" /><stop offset="1" stopColor="#cfe3f2" /></linearGradient>
        <linearGradient id="lb-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc4f3" /><stop offset="1" stopColor="#e6f5ff" /></linearGradient>
        <linearGradient id="lb-bois" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f0e2c8" /><stop offset="1" stopColor="#dcc7a0" /></linearGradient>
        <linearGradient id="lb-plan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbfdff" /><stop offset="1" stopColor="#d3dfeb" /></linearGradient>
        <linearGradient id="lb-fond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8ea2b6" /><stop offset=".25" stopColor="#c3d1de" /><stop offset="1" stopColor="#e4ecf3" /></linearGradient>
        <linearGradient id="lb-verre" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset=".5" stopColor="#fff" stopOpacity=".1" /><stop offset="1" stopColor="#fff" stopOpacity=".55" /></linearGradient>
        <radialGradient id="lb-chauffe" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ff8a3c" stopOpacity=".95" /><stop offset=".6" stopColor="#ffb25c" stopOpacity=".35" /><stop offset="1" stopColor="#ffb25c" stopOpacity="0" /></radialGradient>
        <pattern id="lb-carreaux" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2" /></pattern>
        <filter id="lb-ombre" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1e3a5f" floodOpacity=".25" /></filter>
        <radialGradient id="lb-suie" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#1f2937" stopOpacity=".55" /><stop offset="1" stopColor="#1f2937" stopOpacity="0" /></radialGradient>
        <clipPath id="lb-bulbe"><circle cx={FX} cy={FY} r="46" /></clipPath>
        <clipPath id="lb-cavite"><rect x="150" y="296" width="492" height="124" /></clipPath>
      </defs>
      <g className={boom ? 'lb-secousse' : undefined}>
        {/* mur carrelé */}
        <rect width="800" height="276" fill="url(#lb-mur)" /><rect width="800" height="276" fill="url(#lb-carreaux)" />
        {/* fenêtre et plante */}
        <g filter="url(#lb-ombre)">
          <rect x="26" y="28" width="176" height="130" rx="8" fill="#fff" stroke="#b9cbdb" strokeWidth="3" />
          <rect x="36" y="38" width="156" height="110" rx="3" fill="url(#lb-ciel)" />
          <circle cx="160" cy="68" r="17" fill="#ffe28a" /><ellipse cx="84" cy="88" rx="30" ry="11" fill="#fff" /><ellipse cx="104" cy="80" rx="22" ry="11" fill="#fff" /><ellipse cx="62" cy="124" rx="24" ry="8" fill="#fff" fillOpacity=".85" />
          <path d="M114 38V148M36 93H192" stroke="#fff" strokeWidth="6" />
          <rect x="18" y="156" width="192" height="10" rx="4" fill="#e7eef5" stroke="#b9cbdb" strokeWidth="2" />
        </g>
        <path d="M168 156l-4-22q-3-6 2-8t6 4l6 24Z" fill="#c2693a" /><rect x="160" y="140" width="36" height="16" rx="3" fill="#c76a3a" />
        <path d="M178 140q-16-22-4-34 8 12 4 34ZM178 140q10-26 26-26-4 18-26 26ZM178 140q-22-8-26-26 18 2 26 26Z" fill="#3fa65f" />
        {/* affiche sécurité */}
        <g transform="rotate(-2 254 86)" filter="url(#lb-ombre)"><rect x="226" y="40" width="60" height="92" rx="4" fill="#fff" stroke="#c4d4e3" strokeWidth="2" /><rect x="226" y="40" width="60" height="22" rx="4" fill="#ffc933" /><text x="256" y="56" textAnchor="middle" fontSize="12" fontWeight="800" fill="#5a3a00">SÉCURITÉ</text><text x="256" y="100" textAnchor="middle" fontSize="34">🥽</text><rect x="236" y="110" width="40" height="4" rx="2" fill="#cbd5e1" /><rect x="240" y="118" width="32" height="4" rx="2" fill="#cbd5e1" /></g>

        {/* panneau d'alarme : gyrophare + afficheur */}
        <g filter="url(#lb-ombre)">
          <rect x="316" y="30" width="214" height="98" rx="16" fill="#1f2d3f" stroke="#0f1b2b" strokeWidth="3" />
          <rect x="328" y="62" width="190" height="56" rx="10" fill="#0a1422" stroke="#2f4258" strokeWidth="2" />
          <text x="423" y="52" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#9fb3c8" letterSpacing="2.5">{boom ? 'TROP TARD' : sauve ? 'MAÎTRISÉ' : 'AVANT EXPLOSION'}</text>
          <text x="423" y="106" textAnchor="middle" fontSize="46" fontWeight="800" fontFamily="'DejaVu Sans Mono', ui-monospace, Menlo, Consolas, monospace" fill={led} style={{ filter: `drop-shadow(0 0 6px ${led})` }}>{boom ? '00:00' : temps || '--:--'}</text>
          <rect x="403" y="16" width="40" height="16" rx="4" fill="#475569" />
          <path d="M406 18a17 17 0 0 1 34 0Z" fill={alerte || boom ? '#ef4444' : sauve ? '#22c55e' : '#cbd5e1'} stroke="#7f1d1d" strokeWidth="1.5" className={alerte ? 'lb-alarme' : undefined} />
          {alerte && <circle cx="423" cy="14" r="30" fill="#ef4444" fillOpacity=".18" className="lb-alarme" />}
        </g>

        {/* cadran de température */}
        <g transform="translate(640 74) scale(.86)" filter="url(#lb-ombre)">
          <circle r="54" fill="#fff" stroke="#334155" strokeWidth="6" />
          <path d={arc(-120, -40, 40)} fill="none" stroke="#22c55e" strokeWidth="9" /><path d={arc(-40, 40, 40)} fill="none" stroke="#f59e0b" strokeWidth="9" /><path d={arc(40, 120, 40)} fill="none" stroke="#ef4444" strokeWidth="9" />
          <g style={{ transform: `rotate(${boom ? 120 : aiguille}deg)`, transition: 'transform .6s ease-out' }}><path d="M-3 4L0 -42L3 4Z" fill="#1e293b" /></g>
          <circle r="6" fill="#1e293b" />
          <text y="34" textAnchor="middle" fontSize="15" fontWeight="800" fill="#1e293b" fontFamily="Outfit, Inter, sans-serif">{boom ? '180' : temp} °C</text>
        </g>
        {/* étagère murale : solution mère S₀ et flacons */}
        <rect x="548" y="214" width="240" height="8" rx="3" fill="#c8b48e" /><rect x="548" y="222" width="240" height="4" fill="#00000012" />
        <g transform="translate(0 -14)">
          <rect x="560" y="170" width="54" height="58" rx="9" fill="#d29a3b" stroke="#8a5a14" strokeWidth="2" /><rect x="576" y="154" width="22" height="18" rx="4" fill="#8a5a14" />
          <rect x="566" y="184" width="42" height="34" rx="4" fill="#fff" /><text x="587" y="199" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">S₀</text><text x="587" y="212" textAnchor="middle" fontSize="9" fill="#475569">{stock} mol/L</text>
          <rect x="630" y="184" width="32" height="44" rx="7" fill="#7dd3fc" fillOpacity=".85" stroke="#38a3d9" strokeWidth="2" /><rect x="639" y="170" width="14" height="16" rx="3" fill="#38a3d9" />
          <rect x="678" y="192" width="30" height="36" rx="6" fill="#86efac" fillOpacity=".9" stroke="#3dbb6b" strokeWidth="2" /><rect x="686" y="180" width="14" height="14" rx="3" fill="#3dbb6b" />
          <path d="M726 228V198Q726 184 740 184Q754 184 754 198V228Z" fill="#fff" fillOpacity=".85" stroke="#94a3b8" strokeWidth="2" /><rect x="733" y="168" width="14" height="18" rx="3" fill="#94a3b8" />
        </g>

        {/* paillasse */}
        <rect x="0" y="270" width="800" height="26" fill="url(#lb-plan)" stroke="#b6c6d6" strokeWidth="2" /><rect x="0" y="270" width="800" height="5" fill="#fff" />
        {/* meuble en bois */}
        <rect x="0" y="296" width="800" height="124" fill="url(#lb-bois)" />
        <rect x="0" y="296" width="800" height="8" fill="#00000018" />
        <rect x="10" y="306" width="132" height="104" rx="6" fill="#ead9b9" stroke="#cdb68a" strokeWidth="2" /><circle cx="128" cy="358" r="5" fill="#a98d57" />
        <rect x="650" y="306" width="140" height="104" rx="6" fill="#ead9b9" stroke="#cdb68a" strokeWidth="2" /><circle cx="664" cy="358" r="5" fill="#a98d57" />
        <g transform="translate(720 352)"><path d="M0 -28L26 18H-26Z" fill="#ffd34d" stroke="#d99a00" strokeWidth="3" strokeLinejoin="round" /><text y="12" textAnchor="middle" fontSize="22" fontWeight="800" fill="#7c4a03">!</text></g>

        {/* intérieur du meuble ouvert : le ballon sous la paillasse */}
        <rect x="146" y="298" width="500" height="120" rx="6" fill="#7b8ea3" />
        <g clipPath="url(#lb-cavite)">
          <rect x="150" y="296" width="492" height="124" fill="url(#lb-fond)" />
          <rect x="150" y="296" width="492" height="22" fill="#2b3f55" fillOpacity=".28" />
          <rect x="150" y="404" width="492" height="16" fill="#9aabbd" />
          <circle cx={FX} cy={FY + 6} r={64 + 46 * uv} fill="url(#lb-chauffe)" style={{ opacity: boom ? 0 : 0.12 + 0.88 * uv, transition: 'opacity .6s' }} />
          {/* tuyau d'arrivée depuis l'entonnoir */}
          <path d="M536 296V320H340V308" fill="none" stroke="#7f95aa" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M536 296V320H340V308" fill="none" stroke="#e8f3fb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {verse && <path className="lb-debit" d="M536 296V320H340V308" fill="none" stroke="#38a3e8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}
          {/* chauffe-ballon */}
          <path d="M268 414H392L376 398H284Z" fill="#6b7d92" stroke="#475569" strokeWidth="2" /><rect x="292" y="408" width="76" height="7" rx="3.5" fill="#ff7a3c" style={{ opacity: boom ? 0 : 0.3 + 0.7 * uv }} />
          {!boom && (
            <g className={uv > 0.1 && !sauve ? 'lb-tremble' : undefined} style={{ '--amp': amp, '--dur': dur }}>
              <rect x={FX - 10} y="304" width="20" height="26" fill="#fff" fillOpacity=".55" stroke="#8da6bd" strokeWidth="2.5" />
              <circle cx={FX} cy={FY} r="46" fill="#fff" fillOpacity=".4" stroke="#8da6bd" strokeWidth="3" />
              <g clipPath="url(#lb-bulbe)">
                <rect x={FX - 50} y={sauve ? 364 : 358 - 6 * uv} width="100" height="60" fill={liquide} style={{ transition: 'fill .8s' }} />
                {[0, 1, 2, 3, 4, 5, 6].map(k => <circle key={k} className="lb-bulle" cx={FX - 30 + k * 10} cy={FY + 36 - (k % 2) * 8} r={2.4 + (k % 3)} fill="#fff" fillOpacity=".9" style={{ '--bd': bd, animationDelay: `${(k * 0.37).toFixed(2)}s`, animationPlayState: sauve ? 'paused' : 'running' }} />)}
              </g>
              <ellipse cx={FX - 16} cy={FY - 14} rx="8" ry="17" fill="url(#lb-verre)" transform={`rotate(25 ${FX - 16} ${FY - 14})`} />
              <rect x={FX - 12} y="299" width="24" height="9" rx="3" fill="#475569" />
              {uv > 0.35 && !sauve && [0, 1, 2].map(k => <circle key={k} className="lb-vapeur" cx={FX - 8 + k * 9} cy={298} r="6" fill="#fff" fillOpacity=".85" style={{ animationDelay: `${k * 0.7}s` }} />)}
            </g>)}
          {boom && <g>
            <circle cx={FX} cy={FY} r="150" fill="url(#lb-suie)" />
            {[['#ffe08a', 0], ['#ffb02e', 0.08], ['#ff6a2e', 0.16]].map(([c, d], k) => <circle key={c} className="lb-fumee" cx={FX} cy={FY - 6} r={30 - k * 7} fill={c} style={{ animationDelay: `${d}s`, transformOrigin: `${FX}px ${FY - 6}px`, animationDuration: '1.1s' }} />)}
            {[0, 1, 2].map(k => <circle key={'f' + k} className="lb-fumee" cx={FX - 20 + k * 22} cy={FY - 20} r="30" fill="#9ca3af" style={{ animationDelay: `${0.3 + k * 0.25}s`, transformOrigin: `${FX - 20 + k * 22}px ${FY - 20}px` }} />)}
          </g>}
        </g>
        {boom && FRAGMENTS.map(([dx, dy, rot], k) => (
          <polygon key={k} className="lb-eclat" points="0,-10 9,7 -8,8" fill={k % 2 ? '#bfe3f7' : '#e8eef4'} stroke="#7f9cb5" strokeWidth="1.5" style={{ '--dx': `${dx * 1.7}px`, '--dy': `${dy * 1.5}px`, '--rot': `${rot * 3}deg`, transform: `translate(${FX}px, ${FY - 5}px)`, transformOrigin: '0 0' }} />))}
        <rect x="146" y="296" width="6" height="122" fill="#00000022" /><rect x="640" y="296" width="6" height="122" fill="#00000022" />

        {/* poste de préparation sur la paillasse : entonnoir, bécher, fiole jaugée */}
        <g>
          <path d="M508 232H564L546 262V272H526V262Z" fill="#fff" fillOpacity=".8" stroke="#8da6bd" strokeWidth="2.5" strokeLinejoin="round" /><path d="M514 236H558" stroke="#fff" strokeWidth="3" strokeOpacity=".9" />
          <g transform="translate(724 272) scale(.8)">
            <path d="M-13 -8Q-13 -26 -2 -34V-66H8V-34Q19 -26 19 -8Q19 4 3 4Q-13 4 -13 -8Z" fill="#fff" fillOpacity=".7" stroke="#8da6bd" strokeWidth="2.5" /><line x1="-5" y1="-54" x2="11" y2="-54" stroke="#ef4444" strokeWidth="2" />
          </g>
          {beaker ? (
            <g className={verse ? 'lb-verse' : undefined} style={{ transformOrigin: '606px 238px', transformBox: 'view-box' }}>
              <path d="M606 238L612 272H668L674 238Z" fill="#fff" fillOpacity=".5" stroke="#8da6bd" strokeWidth="3" strokeLinejoin="round" />
              <path d="M608 250L612 272H668L672 250Z" fill="#2b8fd6" fillOpacity={tint} />
              <path d="M606 238L612 272H668L674 238Z" fill="url(#lb-verre)" fillOpacity=".5" />
              <text x="640" y="266" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a" fillOpacity=".75">{beaker.V} mL</text>
            </g>) : (
            <g opacity=".6"><path d="M606 238L612 272H668L674 238Z" fill="#fff" fillOpacity=".3" stroke="#8da6bd" strokeWidth="2.5" strokeDasharray="5 5" strokeLinejoin="round" /></g>)}
          {verse && <path className="lb-debit" d="M602 242Q562 242 546 254" fill="none" stroke="#38a3e8" strokeWidth="5" strokeLinecap="round" />}
        </g>

        {delta != null && verse && <text x={FX} y="290" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0369a1" className="lb-etoile" stroke="#fff" strokeWidth="5" paintOrder="stroke">❄️ −{delta} °C</text>}
        {sauve && [0, 1, 2, 3].map(k => <text key={k} className="lb-etoile" x={FX - 50 + k * 30} y={310} fontSize="24" style={{ animationDelay: `${k * 0.2}s` }}>✨</text>)}
      </g>
      {boom && <rect width="800" height="420" fill="#fff" className="lb-flash" style={{ pointerEvents: 'none' }} />}
      {boom && <g className="lb-boum" style={{ transformOrigin: '400px 190px' }}><text x="400" y="215" textAnchor="middle" fontSize="96" fontWeight="800" fontFamily="Outfit, Inter, sans-serif" fill="#ef4444" stroke="#fff" strokeWidth="11" paintOrder="stroke">BOUM !</text></g>}
    </svg>);
}
