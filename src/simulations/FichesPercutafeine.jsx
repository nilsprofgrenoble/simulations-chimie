// Documents du dossier « Percutaféine » : notice, fiches techniques des matières premières (reproductions simplifiées).
// Sources : résumé des caractéristiques du produit (ANSM), documentation du fabricant du Carbopol 980 NF (Lubrizol), pages d'usage courant.
import { Feuille, Tableau } from './Fiches';


const Liste = ({ items }) => <ul style={{ margin: '4px 0 6px', paddingLeft: 20 }}>{items.map((t, i) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}</ul>;

export default function FichesPercutafeine({ ids, ouvert = false }) {
  return (<div data-fiches>{ids.map(id => {
    if (id === 'notice') return (
      <Feuille key={id} ouvert={ouvert} entete="Notice ANSM" titre="PERCUTAFEINE, gel" sous="Résumé des caractéristiques du produit (extraits)" edition="Laboratoires Pierre Fabre">
        <Tableau lignes={[
          ['Forme', 'Gel lisse, légèrement opalescent'],
          ['Indication', 'Traitement symptomatique des surcharges adipeuses sous-cutanées localisées'],
          ['Substance active', 'Caféine : 5,000 g pour 100 g de gel'],
          ['Excipients', 'Carbomère (Synthalène K), trolamine, cocoate de macrogol 7 glycérol (Cethiol HE), éthanol à 96 pour cent, eau purifiée'],
          ['Éthanol (mise en garde)', '4 g d\'éthanol à 96 % pour une application de 10 g de gel'],
        ]} />
        <div style={{ fontWeight: 700, marginTop: 6 }}>Éthanol à 96 % contenu dans un tube (rubrique 4.4)</div>
        <Tableau tetes={['Tube', 'Éthanol à 96 %']} lignes={[['20 g', 'environ 8 g'], ['96 g', 'environ 38,5 g'], ['192 g', 'environ 77 g']]} />
        <div style={{ color: '#475569' }}>Les quantités des autres excipients ne sont pas indiquées.</div>
      </Feuille>);
    if (id === 'carbopol') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Carbopol 980 NF" sous="Carbomère : polymère de l'acide acrylique réticulé" edition="remplace le Synthalène K du produit commercial">
        <Liste items={[
          'Poudre blanche, très légère. Gélifiant très efficace, donne des gels limpides, y compris hydroalcooliques.',
          <>Dispersion : verser la poudre <b>en pluie</b> dans le liquide en agitation (vortex), sans former de grumeaux. La dispersion est lente : prévoir 30 min à 1 h. Une légère élévation de température aide à la dissoudre.</>,
          <>Épaississement : en milieu acide le polymère est enroulé et la dispersion est fluide. La <b>neutralisation par une base</b> (amine, soude…) déroule les chaînes : le gel se forme. La viscosité est maximale pour un pH d'environ <b>6 à 7</b>.</>,
          'Après neutralisation, éviter une agitation forte et prolongée (perte de viscosité) et la formation de bulles : utiliser une agitation lente.',
          'Exemples de formules du fabricant (gels hydroalcooliques) : de 0,5 % à 2,5 % de Carbopol 980 NF.',
        ]} />
      </Feuille>);
    if (id === 'trolamine') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Trolamine (triéthanolamine)" sous="Amine tertiaire, base faible, liquide visqueux" edition="neutralisant du carbomère">
        <Tableau lignes={[['Rôle', 'Neutralise les groupes acide carboxylique du carbomère pour former le gel'], ['Couple acide/base', 'TEAH⁺ / TEA, pKa d\'environ 7,8'], ['Volatilité', 'Peu volatile (ébullition vers 335 °C) : reste dans l\'extrait sec'], ['Utilisation', 'À ajouter progressivement, sous agitation lente, en suivant le pH']]} />
      </Feuille>);
    if (id === 'cocoate') return (
      <Feuille key={id} ouvert={ouvert} entete="Fiche technique" titre="Cocoate de macrogol 7 glycérol (Cethiol HE)" sous="Ester d'acides gras de coco et de glycérol polyéthoxylé" edition="émollient, solubilisant">
        <Tableau lignes={[['Aspect', 'Liquide limpide à légèrement trouble, peu coloré'], ['Rôle', 'Émollient et agent solubilisant, adoucit le toucher du gel'], ['Solubilité', 'Soluble dans l\'eau et dans l\'éthanol'], ['Volatilité', 'Non volatil : reste dans l\'extrait sec'], ['Remarque du sujet', 'S\'il manque au laboratoire, il peut être remplacé par du glycérol']]} />
      </Feuille>);
    return null; })}</div>);
}
