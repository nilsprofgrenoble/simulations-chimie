// Documents du dossier de la journée au labo : fiches techniques, formule de référence, fiche de fabrication.
// Reproductions simplifiées sur le modèle des vraies fiches ; les valeurs servent le scénario (données fictives).
const SANS = "Arial,'Helvetica Neue',Helvetica,sans-serif";

const FICHES = {};

// Fiches techniques réelles des fabricants (pages du PDF, dans public/fiches/), reproduites à des fins pédagogiques
const REELLES = {
  orgal: { titre: 'ORGAL PST 50 A', source: 'Organik Kimya', pages: ['orgal-1'] },
  vinnapas: { titre: 'VINNAPAS EP 3360 (BGH)', source: 'Wacker Chemie', pages: ['vinnapas-1', 'vinnapas-2', 'vinnapas-3'] },
  dpnb: { titre: 'Poly-Solv DPnB', source: 'Monument Chemical', pages: ['dpnb-1', 'dpnb-2'] },
  coadis: { titre: 'COADIS BR 3', source: 'Coatex', pages: ['coadis-1', 'coadis-2'] },
  durcal: { titre: 'DURCAL 10', source: 'Omya', pages: ['durcal-1'] },
  coapur: { titre: 'COAPUR 3025', source: 'Coatex', pages: ['coapur-1'] },
  thixol: { titre: 'THIXOL 53 L', source: 'Coatex', pages: ['thixol-1'] },
};
const url = nom => `${import.meta.env.BASE_URL}fiches/${nom}.jpg`;

const PRIX_LIGNES = [['Eau', 'Diluant', '118,0', '3,7 € / m³'], ['TiO₂ (rutile)', 'Pigment blanc', '60,0', '10 € / kg'], ['CaCO₃ léger', 'Charge', '60,0', '3 € / kg'],
  ['Vinnapas EP 3360', 'Liant', '83,3', '3,60 € / kg'], ['Foamex', 'Antimousse', '1,5', '6 € les 200 g'], ['Coadis BR3', 'Dispersant', '0,2', '7 € / L (d = 1,22)'],
  ['Thixol', 'Épaississant', '1,5', '7 € / L (d = 1,06)'], ['Coapur', 'Épaississant associatif', '6,7', '8 € / L (d = 1,04)']];
const FAB = [['1', 'Dans la cuve, introduire 70 % de l\'eau, le Foamex et le Coadis BR3.', 'Agitation 300 tr/min'], ['2', 'Ajouter TiO₂ puis CaCO₃ en pluie fine.', '300 tr/min'],
  ['3', 'Disperser à vitesse maximale. Contrôle : finesse au grindomètre ≥ 7 Hegman.', '15 min'], ['4', 'Ajouter la résine, puis le coalescent éventuel, le Thixol et le Coapur.', 'Agitation lente, 200 tr/min'],
  ['5', 'Ajuster avec le reste de l\'eau. Contrôler l\'aspect, le pH et l\'extrait sec.', '5 min'], ['6', 'Noter le lot, les masses réellement pesées et les observations.', '']];

function Feuille({ entete, titre, sous, edition, ouvert = true, children }) {
  return (
    <details open={ouvert} className="fiche-doc" style={{ background: '#fff', color: '#1f2937', fontFamily: SANS, fontSize: 13.5, lineHeight: 1.45, border: '1px solid #cfd6df', boxShadow: '0 2px 8px rgba(0,0,0,.18)', margin: '14px 0', borderRadius: 2 }}>
      <summary style={{ cursor: 'pointer', padding: '8px 12px', background: '#eef2f6', fontWeight: 700, fontSize: 13, color: '#334155' }}>📄 {entete} · {titre}</summary>
      <div style={{ padding: '14px 16px 12px', overflowX: 'auto' }}>
        <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#64748b' }}>{entete}{edition ? ` · ${edition}` : ''}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{titre}</div>
          {sous && <div style={{ color: '#475569' }}>{sous}</div>}
        </div>
        {children}
        <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px dashed #cbd5e1', fontSize: 10.5, color: '#94a3b8' }}>Fiche interne simplifiée pour le scénario : les valeurs sont des données d'exercice.</div>
      </div>
    </details>);
}
const cell = { padding: '4px 8px', border: '1px solid #d5dce5', verticalAlign: 'top' };
const th = { ...cell, background: '#f1f5f9', textAlign: 'left', fontWeight: 700 };

function Tableau({ tetes, lignes }) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', margin: '4px 0 8px' }}>
      {tetes && <thead><tr>{tetes.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>}
      <tbody>{lignes.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j} style={j === 0 && !tetes ? { ...cell, fontWeight: 600, width: '52%', background: '#f8fafc' } : cell}>{c}</td>)}</tr>)}</tbody>
    </table>);
}

export default function Fiches({ ids, ouvert = true }) {
  return (<div data-fiches>{ids.map(id => {
    if (id === 'cdc') return (
      <Feuille key={id} ouvert={ouvert} entete="Cahier des charges" titre="Nouvelle base de peinture blanche mate" sous="Résine de remplacement : Orgal PST 50A" edition="exigences du client">
        <Tableau tetes={['Critère', 'Exigence']} lignes={[['Extrait sec', '> 50 %'], ['λ = CPV / CPVC', '≥ 0,8'], ['Pouvoir masquant', '> 7,0 m²/L'], ['Viscosité à 1 000 s⁻¹ (Lamy RM 100 Plus, MS-R3)', '280 à 480 mPa·s'], ['COV', '< 30 g/L'], ['Matières premières', '< 4,5 €/kg'], ['Film continu', 'dès 5 °C'], ['Stabilité', '30 mois']]} />
      </Feuille>);
    if (id === 'formule') return (
      <Feuille key={id} ouvert={ouvert} entete="Document 1" titre="Formule de référence : base de peinture blanche mate" sous="Résine Vinnapas EP 3360, sans agent de coalescence" edition="331,2 g pour 100 %">
        <Tableau tetes={['Matière première', 'Fonction', 'Masse (g)', 'Prix']} lignes={PRIX_LIGNES} />
        <div style={{ fontSize: 12.5, color: '#475569' }}>Cahier des charges : extrait sec &gt; 50 %, λ = CPV/CPVC ≥ 0,8, pouvoir masquant &gt; 7,0 m²/L, COV &lt; 30 g/L, matières premières &lt; 4,5 €/kg, film continu dès 5 °C, stabilité 30 mois.</div>
      </Feuille>);
    if (id === 'fabrication') return (
      <Feuille key={id} ouvert={ouvert} entete="Document 2" titre="Fiche de fabrication" sous="Base de peinture blanche, essai de 300 g" edition="Défloculeuse de laboratoire">
        <Tableau tetes={['N°', 'Opération', 'Conditions']} lignes={FAB} />
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12.5, color: '#475569' }}><span>Lot : ______________</span><span>Opérateur : ______________</span><span>Date : ______________</span></div>
      </Feuille>);
    const r = REELLES[id];
    if (r) return (
      <details key={id} open={ouvert} className="fiche-doc" style={{ background: '#fff', color: '#1f2937', fontFamily: SANS, border: '1px solid #cfd6df', boxShadow: '0 2px 8px rgba(0,0,0,.18)', margin: '14px 0', borderRadius: 2 }}>
        <summary style={{ cursor: 'pointer', padding: '8px 12px', background: '#eef2f6', fontWeight: 700, fontSize: 13, color: '#334155' }}>📄 Fiche technique · {r.titre} <span style={{ fontWeight: 400, color: '#64748b' }}>({r.source})</span></summary>
        <div style={{ padding: 8, display: 'grid', gap: 8 }}>
          {r.pages.map((pg, i) => (
            <a key={pg} href={url(pg)} target="_blank" rel="noreferrer" title="Ouvrir la page en grand" style={{ display: 'block' }}>
              <img src={url(pg)} alt={`${r.titre}, page ${i + 1} sur ${r.pages.length}`} loading="lazy" style={{ width: '100%', display: 'block', border: '1px solid #e2e8f0' }} />
            </a>))}
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Document du fabricant ({r.source}), reproduit à des fins pédagogiques. Touche une page pour l'ouvrir en grand.</div>
        </div>
      </details>);
    const f = FICHES[id]; if (!f) return null;
    return (
      <Feuille key={id} ouvert={ouvert} entete={f.ref} titre={f.titre} sous={f.sous} edition={f.edition}>
        <Tableau lignes={f.lignes} />
        {f.textes.map(([k, v]) => <p key={k} style={{ margin: '6px 0' }}><b>{k}.</b> {v}</p>)}
      </Feuille>);
  })}</div>);
}
