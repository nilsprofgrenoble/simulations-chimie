// Documents du dossier de la journée au labo : fiches techniques, formule de référence, fiche de fabrication.
// Reproductions simplifiées sur le modèle des vraies fiches ; les valeurs servent le scénario (données fictives).
const SANS = "Arial,'Helvetica Neue',Helvetica,sans-serif";

const FICHES = {
  orgal: { ref: 'Fiche technique', titre: 'ORGAL PST 50A', sous: 'Dispersion aqueuse de copolymère styrène-acrylique', edition: 'Édition 03/2024',
    lignes: [['Aspect', 'Liquide blanc laiteux'], ['Extrait sec', '50 ± 1 %'], ['pH', '7,5 – 9,0'], ['Viscosité Brookfield (20 tr/min, 23 °C)', '200 – 800 mPa·s'], ['Masse volumique', '1,03 g/cm³'],
      ['Température de transition vitreuse (Tg)', '≈ 20 °C'], ['Température minimale de formation de film (MFFT)', '≈ 20 °C'], ['Taille moyenne des particules', '≈ 120 nm'], ['Stabilisation', 'Anionique et non ionique']],
    textes: [['Applications', 'Peintures mates à semi-brillantes, intérieur et extérieur ; enduits décoratifs.'],
      ['Mise en œuvre', 'Sa MFFT de 20 °C impose un agent de coalescence pour former un film continu à température ambiante ou plus basse. Dosage conseillé : 4 à 8 % du polymère sec, à ajuster par essais.'],
      ['Stockage', 'De 5 à 35 °C, à l\'abri du gel, en emballage d\'origine fermé : 12 mois. En cas de gel, tamiser et contrôler avant emploi.'],
      ['Conditionnement', 'Fût de 200 kg, conteneur de 1 000 kg. Prix de référence du laboratoire : 25 € les 5 L.']] },
  vinnapas: { ref: 'Fiche technique', titre: 'VINNAPAS EP 3360', sous: 'Dispersion aqueuse de copolymère acétate de vinyle – éthylène', edition: 'Édition 06/2023',
    lignes: [['Aspect', 'Liquide blanc'], ['Extrait sec', '60 ± 1 %'], ['pH', '4,0 – 6,0'], ['Viscosité Brookfield (20 tr/min, 23 °C)', '≈ 3 000 mPa·s'], ['Masse volumique', '1,07 g/cm³'],
      ['Température de transition vitreuse (Tg)', '≈ 10 °C'], ['Température minimale de formation de film (MFFT)', '≈ 2 °C'], ['Stabilisation', 'Colloïde protecteur']],
    textes: [['Applications', 'Peintures mates à semi-mates pour l\'intérieur. Très faible teneur en composés organiques volatils.'],
      ['Mise en œuvre', 'Filmifie sans agent de coalescence à température ambiante. Usage extérieur non recommandé.'],
      ['Stockage', 'De 5 à 30 °C, protégée du gel. Durée de conservation : 6 mois en emballage d\'origine.']] },
  coadis: { ref: 'Fiche technique', titre: 'COADIS BR3', sous: 'Dispersant polyacrylate de sodium pour pigments et charges', edition: 'Édition 01/2022',
    lignes: [['Aspect', 'Liquide limpide, jaune pâle'], ['Extrait sec', '40 %'], ['pH', '7,5 – 9,5'], ['Masse volumique', '1,22 g/cm³'], ['Nature ionique', 'Anionique']],
    textes: [['Dosage', '0,15 à 0,20 % de matière active par rapport à la masse de pigments et de charges.'],
      ['Remarque', 'Les groupes carboxylate sont ionisés en milieu neutre ou basique : l\'efficacité diminue lorsque le pH de la formule descend sous 6. Un surdosage rend le film sensible à l\'eau.']] },
  dpnb: { ref: 'Fiche technique', titre: 'DPnB', sous: 'Éther n-butylique du dipropylène glycol : agent de coalescence', edition: 'Édition 09/2021',
    lignes: [['Aspect', 'Liquide incolore'], ['Masse volumique', '0,91 g/cm³'], ['Point d\'ébullition', '≈ 230 °C'], ['Point éclair', '≈ 100 °C'], ['Solubilité dans l\'eau', '≈ 4,5 % à 20 °C'], ['Classement COV (point d\'ébullition < 250 °C)', 'Oui : compte dans les COV']],
    textes: [['Rôle', 'Plastifie temporairement les particules de polymère, abaisse la MFFT puis s\'évapore lentement.'],
      ['Dosage', 'De 4 à 8 % de la masse de polymère sec, selon la MFFT du liant et la température d\'application visée.'],
      ['Attention', 'Contribue à la teneur en COV de la peinture (limite du cahier des charges : 30 g/L).']] },
};

const PRIX_LIGNES = [['Eau', 'Diluant', '121,7', '3,7 € / m³'], ['TiO₂ (rutile)', 'Pigment blanc', '60,0', '10 € / kg'], ['CaCO₃ léger', 'Charge', '60,0', '3 € / kg'],
  ['Vinnapas EP 3360', 'Liant', '83,3', '3,60 € / kg'], ['Foamex', 'Antimousse', '1,5', '6 € les 200 g'], ['Coadis BR3', 'Dispersant', '0,2', '7 € / L (d = 1,22)'],
  ['Thixol', 'Épaississant', '1,5', '7 € / L (d = 1,06)'], ['Coapur', 'Épaississant associatif', '3,0', '8 € / L (d = 1,04)']];
const FAB = [['1', 'Dans la cuve, introduire 70 % de l\'eau, le Foamex et le Coadis BR3.', 'Agitation 300 tr/min'], ['2', 'Ajouter TiO₂ puis CaCO₃ en pluie fine.', '300 tr/min'],
  ['3', 'Disperser à vitesse maximale. Contrôle : finesse au grindomètre ≥ 7 Hegman.', '15 min'], ['4', 'Ajouter la résine, puis le coalescent éventuel, le Thixol et le Coapur.', 'Agitation lente, 200 tr/min'],
  ['5', 'Ajuster avec le reste de l\'eau. Contrôler l\'aspect, le pH et l\'extrait sec.', '5 min'], ['6', 'Noter le lot, les masses réellement pesées et les observations.', '']];

function Feuille({ entete, titre, sous, edition, children }) {
  return (
    <details open className="fiche-doc" style={{ background: '#fff', color: '#1f2937', fontFamily: SANS, fontSize: 13.5, lineHeight: 1.45, border: '1px solid #cfd6df', boxShadow: '0 2px 8px rgba(0,0,0,.18)', margin: '14px 0', borderRadius: 2 }}>
      <summary style={{ cursor: 'pointer', padding: '8px 12px', background: '#eef2f6', fontWeight: 700, fontSize: 13, color: '#334155' }}>📄 {entete} · {titre}</summary>
      <div style={{ padding: '14px 16px 12px', overflowX: 'auto' }}>
        <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: 6, marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#64748b' }}>{entete}{edition ? ` · ${edition}` : ''}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{titre}</div>
          {sous && <div style={{ color: '#475569' }}>{sous}</div>}
        </div>
        {children}
        <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px dashed #cbd5e1', fontSize: 10.5, color: '#94a3b8' }}>Reproduction simplifiée pour le scénario : les valeurs sont des données d'exercice.</div>
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

export default function Fiches({ ids }) {
  return (<div data-fiches>{ids.map(id => {
    if (id === 'formule') return (
      <Feuille key={id} entete="Document 1" titre="Formule de référence : base de peinture blanche mate" sous="Résine Vinnapas EP 3360, sans agent de coalescence" edition="331,2 g pour 100 %">
        <Tableau tetes={['Matière première', 'Fonction', 'Masse (g)', 'Prix']} lignes={PRIX_LIGNES} />
        <div style={{ fontSize: 12.5, color: '#475569' }}>Prix de l'Orgal PST 50A (densité 1,03) : 25 € les 5 L. Prix du DPnB (densité 0,91) : 3 € le litre. Cahier des charges : extrait sec &gt; 50 %, λ = CPV/CPVC ≥ 0,8, pouvoir masquant &gt; 7,0 m²/L, COV &lt; 30 g/L, matières premières &lt; 4,5 €/kg, film continu dès 5 °C, stabilité 30 mois.</div>
      </Feuille>);
    if (id === 'fabrication') return (
      <Feuille key={id} entete="Document 2" titre="Fiche de fabrication" sous="Base de peinture blanche, essai de 300 g" edition="Défloculeuse de laboratoire">
        <Tableau tetes={['N°', 'Opération', 'Conditions']} lignes={FAB} />
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12.5, color: '#475569' }}><span>Lot : ______________</span><span>Opérateur : ______________</span><span>Date : ______________</span></div>
      </Feuille>);
    const f = FICHES[id]; if (!f) return null;
    return (
      <Feuille key={id} entete={f.ref} titre={f.titre} sous={f.sous} edition={f.edition}>
        <Tableau lignes={f.lignes} />
        {f.textes.map(([k, v]) => <p key={k} style={{ margin: '6px 0' }}><b>{k}.</b> {v}</p>)}
      </Feuille>);
  })}</div>);
}
