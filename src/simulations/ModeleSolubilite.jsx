import { Formule } from "../commun";
import { nomsSim } from "../suivi";
import { cheminSimulation } from "../slugs";
import { Pic } from "../Pictos";
import { ESPECES, ORDRE_LIQ, ORDRE_SOL, BATTERIE, bilan, RHO_REF, SEUIL_LIQ, SEUIL_SOL, NACL, RT } from "./solubiliteModele";
import "./APropos.css";
import "./ModeleSolubilite.css";

// ====================================================
//  PAGE 219 — SOLUBILITÉ ET MISCIBILITÉ : LE MODÈLE EN DÉTAIL (hors menu ; ouverte depuis la simulation 53, adresse propre)
//  Dit ce que contient le modèle de la simulation 53 (équations, valeurs), d'où viennent les nombres (tables, théorie, réglages),
//  les couples testés et ceux que le modèle rate. Tout est lu dans solubiliteModele.js : la page ne peut pas se contredire avec la simulation.
//  Habillage de « À propos » (APropos.css) + styles propres (ModeleSolubilite.css).
// ====================================================

const nb = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');
const sans = s => String(s).replace(/ \(.*\)/, '');
const nom = k => sans(ESPECES[k]?.nom || k);
const ETQ = { ok: 'oui', lim: 'en partie', non: 'non' };

const I = (a, b) => <msub><mi>{a}</mi><mi>{b}</mi></msub>;
const par = (...x) => <mrow><mo>(</mo>{x}<mo>)</mo></mrow>;
const carre = a => <msup>{a}<mn>2</mn></msup>;

// Les équations : toujours sur une seule ligne (composant Formule)
const EQ_COHESION = <Formule><msub><mi>c</mi><mi>k</mi></msub><mo>(</mo><mi>S</mi><mo>)</mo><mo>=</mo>{carre(<msub><mi>δ</mi><mi>k</mi></msub>)}<mo>(</mo><mi>S</mi><mo>)</mo></Formule>;
const EQ_CROISEE = <Formule>
  <msub><mi>c</mi><mi>k</mi></msub><mo>(</mo><mi>S</mi><mo>,</mo><mi>E</mi><mo>)</mo><mo>=</mo>
  <msub><mi>δ</mi><mi>k</mi></msub><mo>(</mo><mi>S</mi><mo>)</mo><mo>×</mo><msub><mi>δ</mi><mi>k</mi></msub><mo>(</mo><mi>E</mi><mo>)</mo>
</Formule>;
const EQ_G = <Formule><mi>g</mi><mo>=</mo><msub><mi>δ</mi><mi>h</mi></msub><mo>(</mo><mi>S</mi><mo>)</mo><mo>×</mo><msub><mi>δ</mi><mi>h</mi></msub><mo>(</mo><mi>E</mi><mo>)</mo></Formule>;
const EQ_M = <Formule><mi>m</mi><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>[</mo>{carre(I('δ', 'h'))}<mo>(</mo><mi>S</mi><mo>)</mo><mo>+</mo>{carre(I('δ', 'h'))}<mo>(</mo><mi>E</mi><mo>)</mo><mo>]</mo></Formule>;
const EQ_CROISEE_H = <Formule><msub><mi>c</mi><mi>h</mi></msub><mo>(</mo><mi>S</mi><mo>,</mo><mi>E</mi><mo>)</mo><mo>=</mo><mi>g</mi><mo>+</mo><mi>w</mi><mo>×</mo><mo>(</mo><mi>m</mi><mo>−</mo><mi>g</mi><mo>)</mo></Formule>;
const EQ_POIDS = <Formule><mi>w</mi><mo>=</mo><mi>min</mi><mo>(</mo><mn>1</mn><mo>,</mo>{carre(par(<mfrac><msub><mi>ρ</mi><mi>min</mi></msub><msub><mi>ρ</mi><mi>réf</mi></msub></mfrac>))}<mo>)</mo></Formule>;
const EQ_INI = <Formule><msub><mi>E</mi><mi>ini</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>(</mo><msub><mi>c</mi><mi>S</mi></msub><mo>+</mo><msub><mi>c</mi><mi>E</mi></msub><mo>)</mo></Formule>;
const EQ_FIN = <Formule><msub><mi>E</mi><mi>fin</mi></msub><mo>=</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><msub><mi>c</mi><mi>S</mi></msub><mo>+</mo><mfrac><mn>1</mn><mn>4</mn></mfrac><msub><mi>c</mi><mi>E</mi></msub><mo>+</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><msub><mi>c</mi><mrow><mi>S</mi><mi>E</mi></mrow></msub></Formule>;
const EQ_PERTE = <Formule><mi>Perte</mi><mo>=</mo><munder><mo>∑</mo><mi>k</mi></munder><mi>max</mi><mo>(</mo><mn>0</mn><mo>,</mo><msub><mi>E</mi><mi>ini</mi></msub><mo>−</mo><msub><mi>E</mi><mi>fin</mi></msub><mo>)</mo></Formule>;
const EQ_CRIT = <Formule><msub><mi>Perte</mi><mi>crit</mi></msub><mo>=</mo><mi>R</mi><mi>T</mi><mo>×</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>×</mo>{carre(par(<mfrac><mn>1</mn><msqrt><msub><mi>V</mi><mi>A</mi></msub></msqrt></mfrac>, <mo>+</mo>, <mfrac><mn>1</mn><msqrt><msub><mi>V</mi><mi>B</mi></msub></msqrt></mfrac>))}</Formule>;
const EQ_SOL_INI = <Formule><msub><mi>E</mi><mi>ini</mi></msub><mo>=</mo><mfrac><mrow><msub><mi>V</mi><mi>E</mi></msub><mo>(</mo><msub><mi>c</mi><mi>E</mi></msub><mo>+</mo><msub><mi>c</mi><mi>S</mi></msub><mo>)</mo></mrow><mn>1000</mn></mfrac></Formule>;
const EQ_SOL_FIN = <Formule><msub><mi>E</mi><mi>fin</mi></msub><mo>=</mo><mfrac><mrow><mn>2</mn><msub><mi>V</mi><mi>E</mi></msub><msub><mi>c</mi><mrow><mi>S</mi><mi>E</mi></mrow></msub></mrow><mn>1000</mn></mfrac></Formule>;
const EQ_DISS = <Formule><msub><mi>ΔG</mi><mi>diss</mi></msub><mo>=</mo><msub><mi>ΔG</mi><mi>réseau</mi></msub><mo>−</mo><msub><mi>ΔG</mi><mi>Na⁺</mi></msub><mo>−</mo><msub><mi>ΔG</mi><mi>Cl⁻</mi></msub></Formule>;
const EQ_BORN = <Formule><mi>Δ</mi><mo>=</mo><mfrac><mrow><msub><mi>N</mi><mi>A</mi></msub>{carre(<mi>e</mi>)}</mrow><mrow><mn>8</mn><mi>π</mi><msub><mi>ε</mi><mn>0</mn></msub></mrow></mfrac><mo>×</mo><mfrac><mn>1</mn><mi>r</mi></mfrac><mo>×</mo><mo>(</mo><mfrac><mn>1</mn><msub><mi>ε</mi><mi>S</mi></msub></mfrac><mo>−</mo><mfrac><mn>1</mn><msub><mi>ε</mi><mi>eau</mi></msub></mfrac><mo>)</mo></Formule>;
const EQ_NACL = <Formule><mi>s</mi><mo>≈</mo><mn>58,44</mn><mo>×</mo><mi>exp</mi><mo>(</mo><mo>−</mo><mfrac><msub><mi>ΔG</mi><mi>diss</mi></msub><mrow><mn>2</mn><mi>R</mi><mi>T</mi></mrow></mfrac><mo>)</mo></Formule>;

function Bloc({ titre, children }) {
  return <section className="ms-bloc"><h3>{titre}</h3>{children}</section>;
}

function TableauEspeces() {
  const ligne = k => {
    const m = ESPECES[k], ion = m.famille === 'ion';
    return (
      <tr key={k}>
        <th scope="row">{sans(m.nom)}{m.estime ? ' ★' : ''}</th>
        <td>{ion ? '–' : nb(m.dd)}</td><td>{ion ? '–' : nb(m.dp)}</td><td>{ion ? '–' : nb(m.dh)}</td>
        <td>{nb(m.V, m.V >= 100 ? 0 : 1)}</td><td>{ion ? '–' : nb(m.eps)}</td>
      </tr>);
  };
  return (
    <div className="ms-table" role="region" aria-label="Valeurs utilisées pour chaque espèce" tabIndex={0}>
      <table>
        <thead><tr>
          <th scope="col">Espèce</th>
          <th scope="col"><span className="ms-un">δ<sub>d</sub></span></th><th scope="col"><span className="ms-un">δ<sub>p</sub></span></th><th scope="col"><span className="ms-un">δ<sub>h</sub></span></th>
          <th scope="col"><span className="ms-un">V</span></th><th scope="col"><span className="ms-un">ε<sub>r</sub></span></th>
        </tr></thead>
        <tbody>{[...ORDRE_LIQ, ...ORDRE_SOL].map(ligne)}</tbody>
      </table>
    </div>);
}

function TableauBatterie() {
  const lignes = BATTERIE.map(([s, e, reel]) => {
    const m = bilan(s, e).classe;
    return { s, e, reel, m, juste: m === reel };
  });
  const faux = lignes.filter(l => !l.juste), justes = lignes.filter(l => l.juste);
  const ligne = l => (
    <tr key={l.s + l.e} className={l.juste ? '' : 'ms-faux'}>
      <th scope="row">{nom(l.s)} + {nom(l.e)}</th>
      <td>{ETQ[l.reel]}</td><td>{ETQ[l.m]}</td>
      <td>{l.juste ? <span aria-label="le modèle retrouve la réalité"><Pic n="ok"/></span> : <span aria-label="le modèle se trompe"><Pic n="ko"/></span>}</td>
    </tr>);
  return (
    <div className="ms-table" role="region" aria-label="Couples connus et verdict du modèle" tabIndex={0}>
      <table>
        <thead><tr><th scope="col">Solvant + soluté</th><th scope="col">Réel</th><th scope="col">Modèle</th><th scope="col"><span className="ms-un">Accord</span></th></tr></thead>
        <tbody>{faux.map(ligne)}{justes.map(ligne)}</tbody>
      </table>
    </div>);
}

export function SimulationModeleSolubilite({ naviguer }) {
  const base = import.meta.env.BASE_URL;
  const lien = id => ({ href: cheminSimulation(id, nomsSim[id] || '', base), onClick: e => { e.preventDefault(); naviguer(id); } });
  const total = BATTERIE.length, faux = BATTERIE.filter(([s, e, r]) => bilan(s, e).classe !== r).length;
  return (
    <div className="ap ms">

      <section className="ms-hero" aria-labelledby="ms-titre">
        <span className="ap-etiquette">Le modèle en détail</span>
        <h1 id="ms-titre">Ce qu’il y a <mark>dans le modèle</mark></h1>
        <p>La simulation « Solubilité et miscibilité : le bilan des interactions » repose sur un modèle volontairement simple. Cette page dit ce qu’il contient, d’où viennent les nombres, ce qui a été réglé à la main et les couples sur lesquels il se trompe.
          C’est un outil pour raisonner (pourquoi deux espèces se mélangent ou non), <b>pas pour calculer une solubilité</b>.</p>
        <a className="ap-bouton" {...lien(53)}>Retour à la simulation</a>
        <a className="ap-bouton" {...lien(4)}>Les paramètres de Hansen (BTS)</a>
      </section>

      <Bloc titre="1. Le principe">
        <p>On compare l’énergie des interactions entre molécules <b>avant</b> le mélange (S…S et E…E, S le solvant, E le soluté) et <b>après</b> (S…E), en séparant trois types d’interactions k : la dispersion (d), les dipôles permanents (p) et la liaison hydrogène (h).
          La cohésion de chaque espèce est répartie entre ces trois types par les paramètres de solubilité de Hansen δ<sub>d</sub>, δ<sub>p</sub> et δ<sub>h</sub> (en MPa<sup>½</sup>), si bien que δ² s’exprime en MPa, c’est-à-dire en J/cm³ ou en kJ/L.</p>
        <p><b>Hypothèses de travail :</b> température de 25 °C, pression atmosphérique, espèces pures, deux liquides en proportions 50/50 en volume, un solide très dilué. L’entropie n’est pas calculée en détail : le désordre qui favorise le mélange n’entre que dans le seuil (voir plus bas).</p>
      </Bloc>

      <Bloc titre="2. Les équations">
        <h4>Énergie de cohésion, pour chaque type d’interaction k</h4>
        {EQ_COHESION}
        <h4>Interaction croisée S…E (dispersion et dipôles : moyenne géométrique)</h4>
        {EQ_CROISEE}
        <h4>Liaison hydrogène croisée : entre moyenne géométrique et moyenne arithmétique</h4>
        {EQ_G}
        {EQ_M}
        {EQ_CROISEE_H}
        <p>g est la moyenne géométrique, m la moyenne arithmétique. Le poids w vaut 0 si l’une des espèces n’offre pas de H donneur (lié à O ou N) et l’autre pas d’accepteur (O, N). Sinon il vaut 1 quand les sites de liaison H sont assez nombreux par unité de volume dans <i>les deux</i> espèces, et il diminue quand ils sont dilués dans une grande partie apolaire (octanol, huile, rouge Soudan III).</p>
        {EQ_POIDS}
        <p>où ρ est le nombre de sites libres (H donneurs et doublets accepteurs) par litre, ρ<sub>min</sub> la plus petite valeur des deux espèces, et ρ<sub>réf</sub> = {nb(RHO_REF * 1000, 0)} mol/L (proche de l’éthanol : 2 sites pour 58,5 cm³/mol).</p>
        <h4>Deux liquides, mélange 50/50 en volume (kJ pour 1 L de mélange)</h4>
        {EQ_INI}
        {EQ_FIN}
        {EQ_PERTE}
        <p>On ne compte que ce qui est perdu : une interaction croisée plus favorable que la moyenne n’est pas comptabilisée comme un gain (voir « limites »).</p>
        <h4>Ce que l’agitation thermique peut compenser (Flory–Huggins)</h4>
        {EQ_CRIT}
        <p>Le rapport r = Perte / Perte<sub>crit</sub> donne le verdict : r &lt; {nb(SEUIL_LIQ[0], 2)} → miscibles ; entre {nb(SEUIL_LIQ[0], 2)} et {nb(SEUIL_LIQ[1], 0)} → cas limite ; r &gt; {nb(SEUIL_LIQ[1], 0)} → non miscibles. La perte critique dépend de la taille des molécules : de grosses molécules « profitent » moins du désordre du mélange.</p>
        <h4>Un solide moléculaire dans un solvant (kJ par mole de soluté)</h4>
        {EQ_SOL_INI}
        {EQ_SOL_FIN}
        <p>Verdict : perte &lt; {SEUIL_SOL[0]} kJ/mol (environ {nb(SEUIL_SOL[0] / RT, 0)} RT) → soluble ; entre {SEUIL_SOL[0]} et {SEUIL_SOL[1]} kJ/mol → peu soluble ; au-delà ({nb(SEUIL_SOL[1] / RT, 0)} RT environ) → insoluble.</p>
        <h4>Le chlorure de sodium : un bilan en énergies de Gibbs</h4>
        <p>Pour des ions, l’organisation du solvant autour d’eux compte autant que l’énergie : avec les seules enthalpies, le méthanol semblerait mieux solvater que l’eau, alors que le sel y est environ 25 fois moins soluble. Le bilan est donc fait en énergies de Gibbs : où ΔG<sub>réseau</sub> ≈ {nb(NACL.reseau, 1)} kJ/mol est l’énergie du cristal, et ΔG<sub>Na⁺</sub> et ΔG<sub>Cl⁻</sub> les énergies de solvatation des ions, comptées positivement : dans l’eau, leur somme vaut environ {nb(NACL.hydNa + NACL.hydCl, 1)} kJ/mol (valeurs de tables arrondies, partagées entre les deux ions selon Marcus).</p>
        {EQ_DISS}
        <p>Dans un autre solvant, l’énergie de solvatation de chaque ion est diminuée de Δ (formule de Born), avec r = {nb(NACL.rNa * 100, 0)} pm pour Na⁺ et {nb(NACL.rCl * 100, 0)} pm pour Cl⁻, puis Cl⁻ perd encore {NACL.aprotique} kJ/mol si le solvant n’a pas de H lié à O ou N (plus de liaisons H avec l’anion).</p>
        {EQ_BORN}
        <p>La solubilité estimée suit (solution idéale, d’où le 2RT pour deux ions) :</p>
        {EQ_NACL}
        <p>en g par kg de solvant ; verdict « soluble » au-dessus de 20 g/kg, « insoluble » en dessous de 0,1 g/kg. Les bilans de NaCl (énergies de Gibbs) et ceux des molécules (énergies de cohésion) ne sont pas comparables entre eux.</p>
      </Bloc>

      <Bloc titre="3. D’où viennent les nombres ?">
        <div className="ms-trois">
          <div className="ms-carte ms-tables">
            <h4>Pris dans des tables</h4>
            <ul>
              <li>les paramètres δ<sub>d</sub>, δ<sub>p</sub>, δ<sub>h</sub> des petites molécules (tables de Hansen, arrondies) ;</li>
              <li>les volumes molaires V et les permittivités ε<sub>r</sub> ;</li>
              <li>pour NaCl : énergie réticulaire, énergies de solvatation, solubilités mesurées dans huit solvants.</li>
            </ul>
          </div>
          <div className="ms-carte ms-theorie">
            <h4>Issu de la théorie</h4>
            <ul>
              <li>la décomposition de la cohésion en trois types d’interactions (Hildebrand, Hansen) ;</li>
              <li>la moyenne géométrique des cohésions pour l’interaction croisée ;</li>
              <li>la perte critique de Flory–Huggins ;</li>
              <li>la formule de Born pour NaCl dans d’autres solvants ;</li>
              <li>pour les colorants : la méthode de contributions de groupes de Hoftyzer et Van Krevelen.</li>
            </ul>
          </div>
          <div className="ms-carte ms-regle">
            <h4>Réglé sur des cas connus</h4>
            <ul>
              <li>les deux seuils des liquides ({nb(SEUIL_LIQ[0], 2)} et {SEUIL_LIQ[1]}) et les deux des solides ({SEUIL_SOL[0]} et {SEUIL_SOL[1]} kJ/mol) ;</li>
              <li>la forme du poids w de la liaison H croisée et sa valeur de référence ρ<sub>réf</sub> (un choix de modélisation, absent de la théorie de Hansen) ;</li>
              <li>la pénalité de {NACL.aprotique} kJ/mol pour Cl⁻ dans un solvant sans H lié à O ou N, réglée sur l’acétone ;</li>
              <li>les valeurs ★ estimées : δ de l’huile et du diiode, contributions du groupe azo et des OH engagés dans une liaison H interne des colorants.</li>
            </ul>
          </div>
        </div>
        <p>Six nombres sont donc réglés (quatre seuils, ρ<sub>réf</sub> et la pénalité) sur {total} couples connus, chacun ayant trois issues possibles : ce n’est pas un ajustement libre, mais ce n’est pas non plus une validation indépendante. <b>Le fait que le modèle retrouve les couples sur lesquels on l’a réglé ne prouve pas qu’il prévoie bien les autres.</b></p>
      </Bloc>

      <Bloc titre="4. Les valeurs utilisées">
        <p>δ en MPa<sup>½</sup>, V (volume molaire) en cm³/mol. Les espèces marquées ★ ont des valeurs estimées (pas dans les tables) : à manier avec prudence. Pour les deux colorants, δ est calculé par contributions de groupes : δ<sub>d</sub> = ΣF<sub>d</sub>/V, δ<sub>p</sub> = √(ΣF<sub>p</sub>²)/V, δ<sub>h</sub> = √(ΣE<sub>h</sub>/V).</p>
        <TableauEspeces />
      </Bloc>

      <Bloc titre="5. Les couples testés">
        <p>Sur {total} couples dont on connaît le comportement à 25 °C, le modèle donne la réponse attendue pour {total - faux} d’entre eux. Les {faux} couples sur lesquels il se trompe sont en tête de liste. « oui » : miscibles ou soluble ; « en partie » : partiellement miscibles ou peu soluble ; « non » : non miscibles ou insoluble. Pour NaCl, les classes viennent des solubilités mesurées.</p>
        <details className="ms-details">
          <summary>Voir les {total} couples</summary>
          <TableauBatterie />
        </details>
      </Bloc>

      <Bloc titre="6. Ce que le modèle ne sait pas faire">
        <ul className="ms-liste">
          <li><b>Une valeur de solubilité</b> : il répond « soluble », « peu soluble » ou « insoluble », sauf pour NaCl où il donne un ordre de grandeur.</li>
          <li><b>L’entropie</b> : le désordre du mélange n’est pas calculé, et l’effet hydrophobe, en grande partie d’origine entropique à 25 °C (organisation de l’eau autour des parties apolaires), n’est qu’approché par le bilan d’énergie.</li>
          <li><b>Un gain d’énergie au mélange</b> : avec la moyenne géométrique, la perte est toujours positive ou nulle. Un mélange dont les interactions croisées sont plus fortes que la moyenne des deux corps purs (certaines associations par liaison H, par exemple acétone et chloroforme) ne peut pas être prévu comme tel.</li>
          <li><b>La fusion du solide</b> : pour un solide moléculaire, la cohésion est traitée avec ses paramètres δ comme s’il était liquide ; l’enthalpie et la température de fusion, qui comptent dans la solubilité, ne sont pas prises en compte.</li>
          <li><b>La température, le pH, la vitesse de dissolution</b>, les mélanges de plus de deux espèces, l’ionisation partielle (acide carminique dans l’eau).</li>
        </ul>
        <p>Les modèles utilisés par les spécialistes vont plus loin. COSMO-RS, par exemple, calcule par chimie quantique la répartition des charges à la surface de chaque molécule puis en déduit les propriétés du mélange, au lieu de la décomposer en trois types d’interactions. Notre modèle appartient à la famille plus simple de Hildebrand et Hansen : il montre le principe, pas le détail.</p>
      </Bloc>

      <Bloc titre="7. Pour aller plus loin">
        <ul className="ms-liste ms-refs">
          <li>C. M. Hansen, <i>Hansen Solubility Parameters: A User’s Handbook</i>, 2<sup>e</sup> éd., CRC Press, 2007.</li>
          <li>J. H. Hildebrand, R. L. Scott, <i>The Solubility of Nonelectrolytes</i>, 3<sup>e</sup> éd., Reinhold, 1950.</li>
          <li>P. J. Flory, <i>Principles of Polymer Chemistry</i>, Cornell University Press, 1953 (théorie de Flory–Huggins).</li>
          <li>D. W. Van Krevelen, <i>Properties of Polymers</i>, Elsevier (contributions de groupes, méthode de Hoftyzer–Van Krevelen).</li>
          <li>M. Born, <i>Zeitschrift für Physik</i>, 1920, 1, 45 (énergie de solvatation d’un ion).</li>
          <li>Y. Marcus, <i>Ion Solvation</i>, Wiley, 1985.</li>
          <li>A. Klamt, <i>J. Phys. Chem.</i>, 1995, 99, 2224 (COSMO-RS).</li>
        </ul>
      </Bloc>

    </div>
  );
}
