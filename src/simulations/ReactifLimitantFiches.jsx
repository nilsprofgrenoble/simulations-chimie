// Cartes « À retenir » de la simulation « Réactif limitant » (sim 180, 2GT).
// Chaque carte est posée sur l'étape qui SUIT la question qu'elle conclut : aucune ne donne la réponse de sa propre étape.
// Schémas dans un cadre de 300 de large (≈ 230 px sur téléphone) : textes de 12,5 à 17.
import { Jeton, Becher } from './reactifLimitantDessins';
import { COULEURS } from './reactifLimitantModele';

const GRIS = '#475569', BLEU = '#0b4f94', ORANGE = '#b45309', VERT = '#15803d', ROUGE = '#b91c1c', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, display: 'block', margin: '0 auto 6px' };
const liste = { margin: 0, paddingLeft: 18, lineHeight: 1.6 };
const cle = { fontWeight: 800, color: '#be123c' };
const Puce = ({ x, y, w, couleur, fond, children }) => (
  <g>
    <rect x={x} y={y} width={w} height={24} rx={12} fill={fond} stroke={couleur} strokeWidth="1.6"/>
    <text x={x + w / 2} y={y + 16.5} textAnchor="middle" fontSize="13" fontWeight="700" fill={couleur}>{children}</text>
  </g>);
const lignes = (n, cx0, cy, pas, props) => Array.from({ length: n }, (_, k) => <Jeton key={k} cx={cx0 + k * pas} cy={cy} e={0.8} cid={`${props.cid}${k}`} {...props}/>);

// ── Carte 1 : le limitant s'épuise, l'excès reste ──
export function FicheLimitantExces() {
  return (
    <div>
      <svg viewBox="0 0 300 172" style={svgStyle} role="img" aria-label="Avec 6 tranches de pain et 4 tranches de jambon, on fait 3 sandwichs : le pain est tout utilisé, c’est le réactif limitant ; il reste 1 tranche de jambon, réactif en excès">
        <rect x="4" y="6" width="134" height="84" rx="12" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/>
        <rect x="162" y="6" width="134" height="84" rx="12" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/>
        <text x="71" y="25" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={ENCRE}>Avant</text>
        <text x="229" y="25" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={ENCRE}>Après</text>
        {lignes(6, 20, 50, 20, { forme: 'pain', cid: 'p' })}
        {lignes(4, 20, 74, 20, { forme: 'jambon', cid: 'j' })}
        {lignes(3, 181, 50, 22, { forme: 'sandwich', cid: 's' })}
        <Jeton cx={181} cy={74} forme="jambon" e={0.8} cid="rj"/>
        <text x="196" y="71" fontSize="12" fill={GRIS}>1 jambon reste,</text>
        <text x="196" y="85" fontSize="12" fill={GRIS}>0 pain</text>
        <path d="M142 48 H152" stroke={GRIS} strokeWidth="2.4"/><polygon points="151,41 160,48 151,55" fill={GRIS}/>
        <Puce x={4} y={100} w={292} couleur={ORANGE} fond="#fff7ed">pain : tout utilisé → limitant</Puce>
        <Puce x={4} y={130} w={292} couleur={VERT} fond="#f0fdf4">jambon : il en reste → en excès</Puce>
      </svg>
      <ul style={liste}>
        <li><span style={cle}>Le limitant s’épuise, l’excès reste.</span></li>
        <li>Le <strong>réactif limitant</strong> est celui qui manque en premier : il <strong>limite</strong> la quantité de produit fabriquée.</li>
        <li>Les réactifs sont les ingrédients de départ ; le produit est ce qu’on fabrique.</li>
      </ul>
    </div>
  );
}

// ── Carte 2 : la méthode n ÷ coefficient ──
export function FicheMethode() {
  return (
    <div>
      <svg viewBox="0 0 300 176" style={svgStyle} role="img" aria-label="Méthode : pain 6 divisé par 2 égale 3 recettes ; jambon 4 divisé par 1 égale 4 recettes ; le plus petit nombre, 3, désigne le pain comme réactif limitant">
        <text x="150" y="17" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={GRIS}>Stock : 6 pains, 4 jambons</text>
        <rect x="6" y="26" width="288" height="32" rx="10" fill="#eaf2fb" stroke="#7aa6d6" strokeWidth="1.5"/>
        <text x="16" y="47" fontSize="15" fontWeight="700" fill={ENCRE}>pain : 6 ÷ 2 =</text>
        <text x="284" y="47" textAnchor="end" fontSize="15" fontWeight="800" fill={ORANGE}>3 recettes</text>
        <rect x="6" y="64" width="288" height="32" rx="10" fill="#eaf2fb" stroke="#7aa6d6" strokeWidth="1.5"/>
        <text x="16" y="85" fontSize="15" fontWeight="700" fill={ENCRE}>jambon : 4 ÷ 1 =</text>
        <text x="284" y="85" textAnchor="end" fontSize="15" fontWeight="800" fill={BLEU}>4 recettes</text>
        <path d="M150 100 V108" stroke={GRIS} strokeWidth="2.4"/><polygon points="143,107 157,107 150,117" fill={GRIS}/>
        <Puce x={4} y={120} w={292} couleur={ORANGE} fond="#fff7ed">le plus petit : 3 → pain limitant</Puce>
        <text x="150" y="162" textAnchor="middle" fontSize="13" fill={GRIS}>on peut faire 3 sandwichs</text>
      </svg>
      <ul style={liste}>
        <li><span style={cle}>Je divise par le coefficient, je garde le plus petit.</span></li>
        <li>Pour chaque réactif : <strong>quantité ÷ coefficient</strong> = nombre de recettes possibles.</li>
        <li><span style={{ color: ROUGE, fontWeight: 700 }}>Idée fausse :</span> « le limitant est celui dont on a le moins ». <span style={{ color: VERT, fontWeight: 700 }}>Vrai :</span> c’est celui qui permet le moins de recettes (ici le pain : 6 tranches, mais 3 recettes seulement).</li>
      </ul>
    </div>
  );
}

// ── Carte 3 : l'équation est la recette ──
export function FicheEquationRecette() {
  const termes = [['CH₄', 36, COULEURS.r0], ['+', 68, GRIS], ['2 O₂', 100, COULEURS.r1], ['→', 148, GRIS], ['CO₂', 198, COULEURS.p0], ['+', 232, GRIS], ['2 H₂O', 268, COULEURS.p1]];
  const quantites = (vals, y, couleur) => [[36, vals[0]], [100, vals[1]], [198, vals[2]], [268, vals[3]]].map(([x, v]) => <text key={x} x={x} y={y} textAnchor="middle" fontSize="13.5" fontWeight="800" fill={couleur}>{v}</text>);
  return (
    <div>
      <svg viewBox="0 0 300 150" style={svgStyle} role="img" aria-label="L’équation CH4 + 2 O2 donne CO2 + 2 H2O : pour 1 recette, 1 mol de méthane, 2 mol de dioxygène, 1 mol de dioxyde de carbone et 2 mol d’eau ; pour 3 recettes, 3, 6, 3 et 6 mol">
        {termes.map(([t, x, c], k) => <text key={k} x={x} y="26" textAnchor="middle" fontSize="17" fontWeight="800" fill={c}>{t}</text>)}
        <text x="6" y="56" fontSize="12.5" fill={GRIS}>pour 1 recette :</text>
        {quantites(['1 mol', '2 mol', '1 mol', '2 mol'], 74, ORANGE)}
        <path d="M10 88 H290" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="4 3"/>
        <text x="6" y="108" fontSize="12.5" fill={GRIS}>pour 3 recettes (× 3) :</text>
        {quantites(['3 mol', '6 mol', '3 mol', '6 mol'], 126, BLEU)}
      </svg>
      <ul style={liste}>
        <li><span style={cle}>Les coefficients, ce sont les proportions de la recette.</span></li>
        <li>Une équation de réaction se lit comme une recette : 1 mol de CH₄ réagit avec <strong>2 mol</strong> de O₂.</li>
        <li>Si on double (ou triple) la recette, <strong>toutes</strong> les quantités sont doublées (ou triplées).</li>
      </ul>
    </div>
  );
}

// ── Carte 4 : l'état final ──
export function FicheEtatFinal() {
  const L = 21;                                                         // 1 mol = 21 px
  const rows = [['CH₄', COULEURS.r0, 3, 1, 'reste : excès', ORANGE], ['O₂', COULEURS.r1, 4, 0, 'épuisé : limitant', ORANGE], ['CO₂', COULEURS.p0, 0, 2, 'se forme', VERT], ['H₂O', COULEURS.p1, 0, 4, 'se forme', VERT]];
  return (
    <div>
      <svg viewBox="0 0 300 188" style={svgStyle} role="img" aria-label="Exemple avec 3,0 mol de méthane et 4,0 mol de dioxygène : après la réaction, il reste 1,0 mol de méthane, plus de dioxygène (réactif limitant), et il s’est formé 2,0 mol de dioxyde de carbone et 4,0 mol d’eau">
        <rect x="64" y="6" width="12" height="9" fill="#cbd5e1"/><text x="80" y="15" fontSize="12.5" fill={GRIS}>avant</text>
        <rect x="128" y="6" width="12" height="9" fill={ORANGE}/><text x="144" y="15" fontSize="12.5" fill={GRIS}>après</text>
        {rows.map(([f, c, a, b, txt, ct], i) => {
          const y = 26 + i * 40;
          return (
            <g key={f}>
              <text x="6" y={y + 17} fontSize="15" fontWeight="800" fill={c}>{f}</text>
              <rect x="56" y={y} width={Math.max(a * L, 0.1)} height="13" fill="#cbd5e1"/>
              <rect x="56" y={y + 15} width={Math.max(b * L, 0.1)} height="13" fill={c}/>
              <text x={56 + a * L + 5} y={y + 11} fontSize="12.5" fill={GRIS}>{a ? `${a},0` : '0'}</text>
              <text x={56 + b * L + 5} y={y + 26} fontSize="12.5" fontWeight="800" fill={ENCRE}>{b ? `${b},0` : '0'}</text>
              <text x="178" y={y + 22} fontSize="12.5" fontWeight="700" fill={ct}>{txt}</text>
            </g>);
        })}
        <text x="150" y="184" textAnchor="middle" fontSize="12.5" fill={GRIS}>quantités en mol</text>
      </svg>
      <ul style={liste}>
        <li><span style={cle}>Limitant à zéro, excès en baisse, produits créés.</span></li>
        <li>Quantité qui reste = quantité de départ − coefficient × nombre de recettes (ici 3,0 − 1 × 2,0 = 1,0 mol de CH₄).</li>
        <li>On suppose la transformation <strong>totale</strong> : elle va jusqu’au bout.</li>
      </ul>
    </div>
  );
}

// ── Carte 5 : lire l'état final ──
export function FicheLireEtatFinal() {
  return (
    <div>
      <svg viewBox="0 0 300 186" style={svgStyle} role="img" aria-label="Deux béchers à la fin de la réaction : s’il reste du solide, le calcaire est en excès et l’acide est limitant ; s’il n’y a plus de solide, le calcaire est le réactif limitant">
        <Becher x={30} y={8} etat="fin-solide"/>
        <Becher x={180} y={8} etat="fin-sans"/>
        <g fontSize="13" fontWeight="700" textAnchor="middle">
          <text x="75" y="128" fill={ENCRE}>il reste du solide</text>
          <text x="75" y="146" fill={VERT}>calcaire en excès</text>
          <text x="75" y="164" fill={ORANGE}>acide limitant</text>
          <text x="225" y="128" fill={ENCRE}>plus de solide</text>
          <text x="225" y="146" fill={ORANGE}>calcaire limitant</text>
          <text x="225" y="164" fill={VERT}>acide en excès</text>
        </g>
      </svg>
      <ul style={liste}>
        <li><span style={cle}>Ce qui reste est en excès ; ce qui a disparu est limitant.</span></li>
        <li>Pour trouver le limitant sans calcul : on regarde quelle espèce a <strong>disparu</strong> dans l’état final.</li>
        <li>Si les deux ont disparu, on avait exactement les proportions de la recette.</li>
      </ul>
    </div>
  );
}

// ── Carte 6 : l'énergie ──
export function FicheEnergie() {
  const carres = (n, x0, y) => Array.from({ length: n }, (_, k) => <rect key={k} x={x0 + k * 22} y={y - 10} width="18" height="18" rx="3" fill="#f59e0b" stroke={ORANGE} strokeWidth="1.4"/>);
  return (
    <div>
      <svg viewBox="0 0 300 160" style={svgStyle} role="img" aria-label="Énergie libérée par la combustion du méthane : 1 mol libère 1 carré d’énergie, 2 mol en libèrent 2, 3 mol en libèrent 3 ; 2 mol avec plus de dioxygène libèrent toujours 2 carrés">
        <text x="6" y="17" fontSize="12.5" fill={GRIS}>quantité de CH₄ (limitant)</text>
        <text x="206" y="17" fontSize="12.5" fill={GRIS}>énergie libérée</text>
        {[[1, '1 mol'], [2, '2 mol'], [3, '3 mol']].map(([n, t], i) => {
          const y = 42 + i * 32;
          return <g key={n}><text x="6" y={y + 5} fontSize="14" fontWeight="700" fill={ENCRE}>{t}</text>{carres(n, 76, y)}{n > 1 && <text x={76 + n * 22 + 6} y={y + 5} fontSize="14" fontWeight="800" fill={ORANGE}>× {n}</text>}</g>;
        })}
        <path d="M10 124 H290" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="4 3"/>
        <text x="6" y="144" fontSize="12.5" fontWeight="700" fill={ENCRE}>2 mol, avec plus de O₂ :</text>
        {carres(2, 190, 140)}
      </svg>
      <ul style={liste}>
        <li><span style={cle}>Plus de limitant, plus d’énergie : les deux sont proportionnels.</span></li>
        <li>Deux fois plus de réactif limitant : deux fois plus d’énergie libérée.</li>
        <li>Ajouter du réactif <strong>en excès</strong> ne change pas l’énergie : il ne réagit pas en plus.</li>
      </ul>
    </div>
  );
}
