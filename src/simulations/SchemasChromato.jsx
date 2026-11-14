// Schémas cliquables d'un chromatographe liquide (CLHP) et gazeux (CPG), dessinés d'après les simulations « CLHP » et « CPG » du site.
// Ici, aucune étiquette : l'élève doit reconnaître l'endroit où l'on injecte l'échantillon.
const NUM = { clhp: ['eluant', 'pompe', 'manometre', 'injecteur', 'colonne', 'detecteur'], cpg: ['gaz', 'manometre', 'injecteur', 'four', 'fid'] };
const BOITES = {
  clhp: { eluant: [6, 44, 90, 112], pompe: [144, 44, 92, 92], manometre: [248, 44, 74, 106], injecteur: [339, 14, 72, 134], colonne: [430, 34, 210, 112], detecteur: [658, 50, 78, 98] },
  cpg: { gaz: [4, 30, 62, 124], manometre: [76, 40, 70, 104], injecteur: [158, 10, 108, 140], four: [276, 22, 260, 126], fid: [548, 22, 96, 126] },
};

export default function SchemasChromato({ type, onClic, derniere, indice }) {
  const clhp = type === 'clhp', B = BOITES[type];
  const piece = (id, enfants) => {
    const k = NUM[type].indexOf(id) + 1;
    return (<g role="button" tabIndex={0} data-piece={id} aria-label={`Élément ${k} de l'appareil, en partant de la gauche`} style={{ cursor: 'pointer', outline: 'none' }}
      onClick={() => onClic(id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClic(id); } }}>
      {enfants}
      {derniere === id && <rect x={B[id][0]} y={B[id][1]} width={B[id][2]} height={B[id][3]} rx="8" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5 3" />}
      {indice === id && <rect x={B[id][0]} y={B[id][1]} width={B[id][2]} height={B[id][3]} rx="8" fill="none" stroke="#ea580c" strokeWidth="2.8" strokeDasharray="5 3" />}
    </g>);
  };
  const tube = { stroke: '#64748b', strokeWidth: 2.4, fill: 'none' };
  return (
    <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 6 }}>
      {clhp ? (
        <svg viewBox="0 0 780 170" style={{ width: '100%', minWidth: 640, display: 'block' }} role="group" aria-label="Schéma d'un chromatographe liquide : l'éluant circule de gauche à droite">
          <path d="M770 84 L776 90 L770 96" {...tube} strokeWidth="2" />
          {piece('eluant', <g>
            <rect x="12" y="52" width="36" height="66" rx="6" fill="#dbeafe" stroke="#475569" strokeWidth="1.5" /><rect x="54" y="52" width="36" height="66" rx="6" fill="#ede9fe" stroke="#475569" strokeWidth="1.5" />
            <rect x="10" y="48" width="40" height="5" rx="2" fill="#475569" /><rect x="52" y="48" width="40" height="5" rx="2" fill="#475569" /></g>)}
          {piece('pompe', <g><rect x="150" y="50" width="80" height="80" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" /><rect x="176" y="68" width="28" height="44" rx="4" fill="#cbd5e1" stroke="#64748b" /></g>)}
          {piece('manometre', <g><circle cx="285" cy="82" r="30" fill="white" stroke="#475569" strokeWidth="2" /><line x1="285" y1="82" x2="300" y2="68" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" /><circle cx="285" cy="82" r="3" fill="#0f172a" /></g>)}
          {piece('injecteur', <g>
            <rect x="345" y="62" width="60" height="56" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" /><circle cx="375" cy="90" r="14" fill="white" stroke="#475569" />
            <path d="M375 90 L386 82 M375 90 L386 98 M375 90 L364 90" stroke="#475569" strokeWidth="1.6" /><path d="M375 30 V58 M371 58 L375 64 L379 58" stroke="#475569" strokeWidth="1.8" fill="none" /><rect x="371" y="20" width="8" height="14" fill="#94a3b8" /></g>)}
          {piece('colonne', <g>
            <rect x="436" y="40" width="198" height="100" rx="10" fill="#fff7ed" stroke="#c2410c" strokeWidth="1.3" strokeDasharray="5 3" /><rect x="452" y="72" width="166" height="36" rx="5" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
            {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={462 + i * 11.5} cy={i % 2 ? 84 : 96} r="4.4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />)}</g>)}
          <g fill="none" stroke="#64748b" strokeWidth="2.4" strokeLinejoin="round" pointerEvents="none"><path d="M150 96 H126 V30 H30 V92" /><path d="M150 108 H114 V38 H72 V92" /><path d="M230 82 H255 M315 82 H345 M405 90 H452 M618 90 H664 M730 90 H775" /></g>
          {piece('detecteur', <g><rect x="664" y="56" width="66" height="68" rx="8" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" /><circle cx="697" cy="82" r="9" fill="#fde047" stroke="#a16207" /></g>)}
        </svg>
      ) : (
        <svg viewBox="0 0 650 160" style={{ width: '100%', minWidth: 580, display: 'block' }} role="group" aria-label="Schéma d'un chromatographe en phase gazeuse : le gaz circule de gauche à droite">
          {piece('gaz', <g><rect x="14" y="44" width="42" height="96" rx="14" fill="#e0f2fe" stroke="#475569" strokeWidth="1.5" /><rect x="27" y="36" width="16" height="10" fill="#475569" /></g>)}
          {piece('manometre', <g><circle cx="111" cy="92" r="24" fill="white" stroke="#475569" strokeWidth="2" /><line x1="111" y1="92" x2="123" y2="80" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" /><circle cx="111" cy="92" r="2.5" fill="#0f172a" /></g>)}
          {piece('injecteur', <g>
            <rect x="166" y="66" width="82" height="52" rx="6" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" /><rect x="196" y="60" width="22" height="7" fill="#1e293b" />
            <path d="M207 18 V56 M203 56 L207 62 L211 56" stroke="#475569" strokeWidth="1.8" fill="none" /><rect x="203" y="10" width="8" height="12" fill="#94a3b8" /><rect x="190" y="74" width="34" height="36" rx="4" fill="white" stroke="#94a3b8" />
            <path d="M248 78 H262 M262 78 V60 M258 64 L262 58 L266 64" stroke="#64748b" strokeWidth="1.6" fill="none" /></g>)}
          {piece('four', <g><rect x="282" y="28" width="248" height="114" rx="10" fill="#fff7ed" stroke="#c2410c" strokeWidth="1.3" strokeDasharray="5 3" />
            {[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx="406" cy="88" rx={60 - i * 9} ry={30 - i * 4.5} fill="none" stroke="#475569" strokeWidth="1.6" />)}</g>)}
          <g fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinejoin="round" pointerEvents="none"><path d="M35 36 V20 H70 V92 H87" /><path d="M135 92 H166" /><path d="M248 92 H290 Q325 92 346 88" /><path d="M466 88 Q500 92 530 92 H560" /></g>
          {piece('fid', <g><rect x="560" y="52" width="74" height="76" rx="8" fill="#fef3c7" stroke="#a16207" strokeWidth="1.5" /><path d="M597 98 C588 88 592 76 597 68 C602 76 606 88 597 98 Z" fill="#fb923c" stroke="#c2410c" /></g>)}
        </svg>
      )}
    </div>);
}
