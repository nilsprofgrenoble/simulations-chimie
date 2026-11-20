// Scènes de la simulation 198 « Tests chimiques : eau, dihydrogène, dioxygène, dioxyde de carbone » (2GT).
// Schémas SVG : textes de 18 (viewBox de 480) à 13,5 (viewBox de 300), plafonnés à maxWidth 480 (scènes) ou 320 (cartes) ; couleurs : bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
// Couleurs justes : sulfate de cuivre anhydre blanc, hydraté bleu ; eau de chaux limpide, puis trouble (blanc laiteux) ; braise rouge, flamme orange.
// Les dessins sont schématiques : ce ne sont pas des photographies.
import { KIT } from "../commun";
import * as M from "./testsChimiques2gtModele";
import { COL } from "./testsChimiques2gtCouleurs";

const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
const verre = { fill: 'none', stroke: '#475569', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };

// ---------- une goutte, une flamme, une explosion ----------
const Goutte = ({ x, y, c = '#38bdf8' }) => <path d={`M${x} ${y} q-9 14 -9 20 a9 9 0 0 0 18 0 q0 -6 -9 -20z`} fill={c} stroke="#0284c7" strokeWidth="1.5" />;
const Flamme = ({ x, y, k = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <path d="M0 -34 C10 -18 18 -8 18 4 a18 18 0 0 1 -36 0 C-18 -8 -6 -16 0 -34z" fill="#fb923c" stroke="#c2410c" strokeWidth="2" />
    <path d="M0 -12 C6 -4 10 0 10 7 a10 10 0 0 1 -20 0 C-10 0 -3 -4 0 -12z" fill="#fde047" />
  </g>);
const Eclat = ({ x, y }) => {
  const pts = [];
  for (let i = 0; i < 16; i++) { const a = (Math.PI * 2 * i) / 16, r = i % 2 ? 22 : 40; pts.push(`${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`); }
  return <polygon points={pts.join(' ')} fill="#fde047" stroke="#c2410c" strokeWidth="2.5" strokeLinejoin="round" />;
};

// ---------- un panneau : un test dans un état donné (dessiné dans une boîte de 200 × 170) ----------
// test : 'eau' | 'co2' | 'o2' | 'h2' ; etat : 'avant' | 'positif' | 'negatif'
export function PanneauTest({ test, etat, x = 0, y = 0, k = 1 }) {
  const apres = etat !== 'avant';
  let corps = null;
  if (test === 'eau') {
    const bleu = etat === 'positif';
    corps = (<>
      <path d="M78 24 V118 a22 22 0 0 0 44 0 V24" {...verre} />
      <path d="M80 100 V118 a20 20 0 0 0 40 0 V100 Z" fill={bleu ? '#3b82f6' : '#f8fafc'} stroke={bleu ? '#1d4ed8' : '#94a3b8'} strokeWidth="1.5" />
      {!bleu && [[92, 108], [104, 112], [112, 104], [98, 120]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="2" fill="#cbd5e1" />)}
      {bleu && [[92, 108], [104, 112], [112, 104], [98, 120]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="2" fill="#93c5fd" />)}
      {apres && <Goutte x={100} y={30} />}
    </>);
  } else if (test === 'co2') {
    const trouble = etat === 'positif';
    corps = (<>
      <path d={`M66 95 H134 L150 125 Q155 135 145 135 H55 Q45 135 50 125 Z`} fill={trouble ? '#e5e7eb' : '#e0f2fe'} fillOpacity={trouble ? 1 : 0.8} stroke="none" />
      {trouble && [[75, 112], [95, 124], [115, 108], [128, 122], [105, 100], [85, 126]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="3" fill="white" />)}
      <path d="M85 20 H115 M92 20 V60 L50 125 Q45 135 55 135 H145 Q155 135 150 125 L108 60 V20" {...verre} />
      <path d={`M20 36 H100 V118`} fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {apres && [[96, 108, 4], [104, 98, 3], [98, 90, 3.5]].map(([a, b, r], i) => <circle key={i} cx={a + 2} cy={b + 12} r={r} fill="white" stroke="#64748b" strokeWidth="1.5" />)}
    </>);
  } else if (test === 'o2') {
    corps = (<>
      <path d="M68 36 V122 a32 32 0 0 0 64 0 V36" {...verre} />
      <line x1="100" y1="6" x2="100" y2={etat === 'positif' ? 90 : 96} stroke="#a16207" strokeWidth="6" strokeLinecap="round" />
      {etat === 'avant' && <circle cx="100" cy="100" r="8" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />}
      {etat === 'positif' && <Flamme x={100} y={104} k={1.5} />}
      {etat === 'negatif' && <><circle cx="100" cy="100" r="7" fill="#374151" /><path d="M96 84 q-8 -10 0 -18 t0 -16" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" /></>}
    </>);
  } else {
    corps = (<>
      <path d="M52 56 V122 a26 26 0 0 0 52 0 V56" {...verre} />
      <path d="M50 56 H106" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      <Flamme x={etat === 'avant' ? 160 : 138} y={etat === 'avant' ? 66 : 64} k={etat === 'avant' ? 0.9 : 0.6} />
      {etat === 'positif' && <><Eclat x={102} y={48} /><text x="102" y="56" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.rouge}>pop</text></>}
      {etat === 'avant' && <><line x1="146" y1="104" x2="124" y2="104" stroke={COL.gris} strokeWidth="3" /><polygon points="116,104 128,98 128,110" fill={COL.gris} /></>}
    </>);
  }
  return <g transform={`translate(${x} ${y}) scale(${k})`}>{corps}</g>;
}

const LEGENDES = {
  eau: { avant: ['poudre blanche', 'sulfate de cuivre'], positif: ['poudre bleue', 'test positif'], negatif: ['poudre reste blanche', 'test négatif'] },
  co2: { avant: ['eau de chaux', 'le gaz arrive'], positif: ['eau de chaux trouble', 'test positif'], negatif: ['eau de chaux limpide', 'test négatif'] },
  o2: { avant: ['braise : point rouge', 'sans flamme'], positif: ['braise rallumée', 'test positif'], negatif: ['braise éteinte', 'test négatif'] },
  h2: { avant: ['la flamme approche', 'de l’ouverture du tube'], positif: ['détonation « pop »', 'test positif'], negatif: ['pas de détonation', 'test négatif'] },
};
// Scène : un ou deux panneaux d'un même test (etats : liste de 1 ou 2 états)
export function SchemaTest({ test, etats = ['avant', 'positif'], titre }) {
  const deux = etats.length === 2, x0 = deux ? [8, 258] : [140], w = deux ? 214 : 200;
  return (
    <svg viewBox="0 0 480 252" style={stl()} role="img" aria-label={`${titre || ''} ${etats.map(e => LEGENDES[test][e].join(', ')).join(' puis ')}`.trim()}>
      {etats.map((e, i) => (
        <g key={e + i}>
          <rect x={x0[i]} y={6} width={w} height={240} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <PanneauTest test={test} etat={e} x={x0[i] + (deux ? 7 : 0)} y={14} />
          <text x={x0[i] + w / 2} y={210} textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>{LEGENDES[test][e][0]}</text>
          <text x={x0[i] + w / 2} y={234} textAnchor="middle" fontSize="18" fill={e === 'positif' ? COL.vert : e === 'negatif' ? COL.rouge : COL.gris}>{LEGENDES[test][e][1]}</text>
        </g>))}
      {deux && <g><line x1="226" y1="110" x2="240" y2="110" stroke={COL.gris} strokeWidth="4" /><polygon points="254,110 238,100 238,120" fill={COL.gris} /></g>}
    </svg>);
}

// ---------- étape 1 : un test, c'est un réactif et une observation ----------
export function SceneUnTest() {
  const boite = (x, n, titre, l1, l2, fond) => (
    <g>
      <rect x={x} y={10} width={142} height={196} rx="12" fill={fond} stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx={x + 24} cy={36} r={16} fill={COL.bleu} /><text x={x + 24} y={43} textAnchor="middle" fontSize="20" fontWeight="800" fill="white">{n}</text>
      <text x={x + 71} y={84} textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.encre}>{titre}</text>
      <text x={x + 71} y={118} textAnchor="middle" fontSize="18" fill={COL.encre}>{l1}</text>
      <text x={x + 71} y={142} textAnchor="middle" fontSize="18" fill={COL.encre}>{l2}</text>
    </g>);
  return (
    <svg viewBox="0 0 480 218" style={stl()} role="img" aria-label="Un test chimique en trois temps : un réactif mis au contact de l’échantillon, une observation, une conclusion.">
      {boite(4, 1, 'Réactif', 'on l’ajoute à', 'l’échantillon', '#eff6ff')}
      {boite(169, 2, 'Observation', 'on regarde ce', 'qui se passe', '#fff7ed')}
      {boite(334, 3, 'Conclusion', 'on en déduit', 'l’espèce', '#f0fdf4')}
      <polygon points="162,108 150,100 150,116" fill={COL.gris} /><polygon points="327,108 315,100 315,116" fill={COL.gris} />
    </svg>);
}

// ---------- étape « négatif » : un flacon d'air, une braise qui ne se rallume pas ----------
export function SceneNegatif() {
  return (
    <svg viewBox="0 0 480 252" style={stl()} role="img" aria-label="Un flacon rempli d’air. Une braise y est plongée : elle reste rouge et ne se rallume pas.">
      <rect x={8} y={6} width={464} height={240} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <g transform="translate(130 10) scale(1.1)">
        <path d="M68 36 V122 a32 32 0 0 0 64 0 V36" {...verre} />
        <line x1="100" y1="6" x2="100" y2="96" stroke="#a16207" strokeWidth="6" strokeLinecap="round" />
        <circle cx="100" cy="100" r="8" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
        {[[84, 70], [112, 62], [90, 112], [116, 96], [80, 96]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="3" fill="#bfdbfe" />)}
      </g>
      <text x={330} y={92} fontSize="18" fontWeight="800" fill={COL.encre}>flacon d’air</text>
      <text x={330} y={120} fontSize="18" fill={COL.encre}>la braise reste</text><text x={330} y={144} fontSize="18" fill={COL.encre}>rouge, sans flamme</text>
      <text x={240} y={214} textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.rouge}>pas de rallumage</text>
    </svg>);
}

// ---------- étape « flamme » : une allumette qui s'éteint dans un tube ----------
export function SceneFlamme() {
  return (
    <svg viewBox="0 0 480 252" style={stl()} role="img" aria-label="Une allumette enflammée est plongée dans un tube qui contient un gaz inconnu : la flamme s’éteint.">
      <rect x={8} y={6} width={464} height={240} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <g transform="translate(40 10) scale(1.1)">
        <path d="M68 36 V122 a32 32 0 0 0 64 0 V36" {...verre} />
        <text x="100" y="124" textAnchor="middle" fontSize="40" fontWeight="800" fill="#94a3b8">?</text>
        <line x1="100" y1="10" x2="100" y2="70" stroke="#a16207" strokeWidth="6" strokeLinecap="round" />
        <path d="M100 70 q-10 -10 0 -22 q10 12 0 22z" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="4 4" />
      </g>
      <text x={250} y={78} fontSize="18" fontWeight="800" fill={COL.encre}>gaz inconnu</text>
      <text x={250} y={106} fontSize="18" fill={COL.encre}>allumette enflammée</text><text x={250} y={130} fontSize="18" fill={COL.encre}>plongée dans le tube</text>
      <text x={250} y={170} fontSize="18" fontWeight="800" fill={COL.rouge}>la flamme s’éteint</text>
    </svg>);
}

// ---------- étape « mélange » : une bougie sous un flacon ----------
export function SceneBougie() {
  return (
    <svg viewBox="0 0 480 252" style={stl()} role="img" aria-label="Une bougie allumée est recouverte d’un flacon retourné. De la buée apparaît sur la paroi. Deux tests sont faits : la poudre blanche sur la buée, l’eau de chaux dans le flacon.">
      <rect x={8} y={6} width={464} height={240} rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M60 40 H180 V196 H60 Z" fill="#f0f9ff" fillOpacity="0.7" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
      {[[74, 70], [80, 112], [168, 84], [172, 140], [70, 160]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r="4" fill="#7dd3fc" />)}
      <rect x="104" y="150" width="32" height="46" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
      <Flamme x={120} y={146} k={0.8} />
      <rect x="40" y="196" width="160" height="10" rx="3" fill="#94a3b8" />
      <text x={210} y={74} fontSize="18" fontWeight="800" fill={COL.encre}>bougie qui brûle</text>
      <text x={210} y={100} fontSize="18" fill={COL.encre}>sous un flacon retourné</text>
      <text x={210} y={134} fontSize="18" fill={COL.encre}>de la buée se forme</text>
      <text x={210} y={160} fontSize="18" fill={COL.encre}>sur la paroi du flacon</text>
      <text x={240} y={232} textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.orange}>deux tests à faire</text>
    </svg>);
}

// ---------- étape 7 : lire un tableau de résultats ----------
export function TableauResultats({ gazA = true, gazB = true }) {
  const cell = { padding: '5px 5px', border: `1px solid ${KIT.bord}`, fontSize: 13.5, color: KIT.txt, verticalAlign: 'top', overflowWrap: 'anywhere' };
  const tete = { ...cell, background: '#eff6ff', fontWeight: 800, textAlign: 'left' };
  const lignes = [['h2', 'Flamme à l’ouverture'], ['o2', 'Braise plongée dans le gaz'], ['co2', 'Eau de chaux']];
  const gaz = [...(gazA ? [['A', 'h2']] : []), ...(gazB ? [['B', 'co2']] : [])];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', maxWidth: 480, margin: '0 auto', background: 'white' }}>
        <thead><tr><th style={{ ...tete, width: '34%' }}>Test</th>{gaz.map(([n]) => <th key={n} style={tete}>Gaz {n}</th>)}</tr></thead>
        <tbody>{lignes.map(([t, nom]) => (
          <tr key={t}><th style={{ ...cell, textAlign: 'left', fontWeight: 700 }}>{nom}</th>
            {gaz.map(([n, g]) => { const o = M.observationGaz(g, t); return <td key={n} style={cell}>{o.texte}</td>; })}</tr>))}
        </tbody>
      </table>
    </div>);
}

// ---------- étape 6 : associer chaque espèce à son observation ----------
export function SceneAssocier({ choix, setChoix, ordre }) {
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 8px', borderRadius: 8, maxWidth: '100%', width: '100%' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {M.OBS_ASSOCIER.map(([id]) => {
        const e = M.ESPECES[id], v = choix[id] || '', ok = v && v === id, ko = v && v !== id;
        return (
          <label key={id} style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 14.5, fontWeight: 700, color: KIT.txt }}>
            <span>{id === 'eau' ? 'Pour reconnaître de l’eau' : `Pour reconnaître ${e.art} ${e.formule}`}
              {ok && <span style={{ color: COL.vert }}> ✓</span>}{ko && <span style={{ color: COL.rouge }}> ✗ essayez encore</span>}</span>
            <select value={v} onChange={x => setChoix(c => ({ ...c, [id]: x.target.value }))} style={{ ...sel, border: `2px solid ${ok ? COL.vert : ko ? COL.rouge : KIT.bord}` }}>
              <option value="">— choisir l’observation —</option>
              {ordre.map(k => <option key={k} value={k}>{M.OBS_ASSOCIER.find(o => o[0] === k)[1]}</option>)}
            </select>
          </label>);
      })}
    </div>);
}

// ---------- étape 8 : construire l'arbre de décision ----------
export function SceneArbre({ rep, setRep }) {
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const v = M.verifierArbre(rep);
  const bloc = { background: 'white', border: `1.5px solid ${KIT.bord}`, borderRadius: 12, padding: '8px 10px' };
  const fleche = <div aria-hidden="true" style={{ textAlign: 'center', fontSize: 14, color: COL.gris, lineHeight: 1.2 }}>si le test est négatif<br />↓</div>;
  const choixTest = (cle, bon) => (
    <select aria-label="Test à faire" value={rep[cle]} onChange={e => setRep(r => ({ ...r, [cle]: e.target.value }))} style={{ ...sel, borderColor: rep[cle] && bon ? COL.vert : KIT.bord }}>
      <option value="">— choisir le test —</option>
      <option value="o2">braise plongée dans le gaz</option>
      <option value="co2">eau de chaux</option>
    </select>);
  const choixGaz = (cle, bon) => (
    <select aria-label="Gaz conclu" value={rep[cle]} onChange={e => setRep(r => ({ ...r, [cle]: e.target.value }))} style={{ ...sel, borderColor: rep[cle] && bon ? COL.vert : KIT.bord }}>
      <option value="">— gaz —</option>
      {M.GAZ.map(g => <option key={g} value={g}>{M.ESPECES[g].nom} {M.ESPECES[g].formule}</option>)}
    </select>);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: KIT.txt }}>
      <div style={{ ...bloc, borderColor: COL.vert }}>
        <div><strong>Test 1 :</strong> flamme approchée de l’ouverture du tube bouché (déjà placé).</div>
        <div>Si on entend un « pop » : c’est <strong>le dihydrogène H₂</strong>.</div>
      </div>
      {fleche}
      <div style={bloc}>
        <div style={{ marginBottom: 4 }}><strong>Test 2 :</strong> {choixTest('t2', v.n2)}</div>
        <div>Si le test est positif : c’est {choixGaz('g2', v.n2)}</div>
      </div>
      {fleche}
      <div style={bloc}>
        <div style={{ marginBottom: 4 }}><strong>Test 3 :</strong> {choixTest('t3', v.n3)}</div>
        <div style={{ marginBottom: 4 }}>Si le test est positif : c’est {choixGaz('g3', v.n3)}</div>
        <div>Si le test est négatif : par élimination, c’est {choixGaz('gf', v.finalOk)}</div>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Gaz pur, pas dilué : un test négatif suffit à écarter un gaz. La liste des gaz vient de l’énoncé.</div>
      {rep.t2 && rep.t3 && rep.t2 === rep.t3 && <div role="status" style={{ color: COL.rouge, fontWeight: 700 }}>Les tests 2 et 3 doivent être différents.</div>}
    </div>);
}

// ---------- étape 12 : les quatre tests en un coup d'œil ----------
export function SceneBilan() {
  const lignes = [['eau', 'poudre blanche', 'blanc → bleu'], ['co2', 'eau de chaux', 'devient trouble'], ['o2', 'braise', 'se rallume'], ['h2', 'flamme', '« pop »']];
  const nom = { eau: 'eau', co2: 'CO₂', o2: 'O₂', h2: 'H₂' };
  return (
    <svg viewBox="0 0 480 260" style={stl()} role="img" aria-label="Les quatre tests : eau avec le sulfate de cuivre anhydre qui passe du blanc au bleu ; dioxyde de carbone avec l’eau de chaux qui se trouble ; dioxygène avec la braise qui se rallume ; dihydrogène avec la flamme qui donne un pop.">
      <text x={20} y={30} fontSize="18" fontWeight="800" fill={COL.gris}>espèce</text><text x={120} y={30} fontSize="18" fontWeight="800" fill={COL.gris}>réactif</text><text x={300} y={30} fontSize="18" fontWeight="800" fill={COL.gris}>observation</text>
      {lignes.map(([t, r, o], i) => (
        <g key={t}><rect x={8} y={42 + i * 52} width={464} height={44} rx="8" fill={i % 2 ? '#f8fafc' : '#eff6ff'} />
          <text x={20} y={72 + i * 52} fontSize="20" fontWeight="800" fill={COL.bleu}>{nom[t]}</text>
          <text x={120} y={72 + i * 52} fontSize="18" fill={COL.encre}>{r}</text>
          <text x={300} y={72 + i * 52} fontSize="18" fontWeight="700" fill={COL.vert}>{o}</text></g>))}
    </svg>);
}

// ---------- encadré « précautions » ----------
export function Precautions({ children, titre = 'Précautions' }) {
  return (
    <div role="note" style={{ background: '#fff7ed', border: `1.5px solid ${COL.orange}`, borderRadius: 12, padding: '8px 10px', margin: '8px 0', fontSize: 14, color: KIT.txt, lineHeight: 1.5 }}>
      <div style={{ fontWeight: 800, color: COL.orange, marginBottom: 2 }}>⚠ {titre}</div>
      {children}
    </div>);
}
