// QCM du parcours guidé de la simulation 133 (fichier séparé pour contrôler par script la longueur des options :
// la bonne réponse, écrite en tête ici, n'est jamais la plus longue ; l'ordre affiché est mélangé par CarteParcours).
export const QCM_PARCOURS = {
  spontane: { options: [
    'elle continue de débiter : Q_r augmente vers K',
    'elle se recharge seule : Q_r revient vers 1',
    'elle ne change plus : le système est déjà en équilibre',
    'elle s’arrête : les ions Zn²⁺ formés bloquent la réaction'], bonne: 0 },
  generateur: { options: [
    'la pile débite toujours, dans le sens spontané',
    'le générateur recharge la pile, car il est branché',
    'aucun courant ne passe : les deux sources s’annulent',
    'le générateur force les électrons à entrer par le zinc'], bonne: 0 },
  forcer: { options: [
    'U_G dépasse la tension à vide : le générateur impose son sens',
    'le générateur a inversé ses bornes + et − en changeant de tension',
    'la pile est usée, donc le générateur seul fait passer un courant',
    'la tension à vide de la pile est devenue négative à 1,60 V'], bonne: 0 },
  electrodes: { options: [
    'Zn²⁺ + 2 e⁻ → Zn : du zinc se dépose',
    'Zn → Zn²⁺ + 2 e⁻ : le zinc se dissout',
    'Cu²⁺ + 2 e⁻ → Cu : du cuivre se dépose',
    'Cu → Cu²⁺ + 2 e⁻ : du cuivre se dissout'], bonne: 0 },
  noms: { options: [
    'la cathode, et elle reste le pôle −',
    'l’anode, comme quand la pile débite',
    'la cathode, et elle devient le pôle +',
    'l’anode, et elle devient le pôle +'], bonne: 0 },
  qr: { options: [
    'il s’éloigne de K : seul un apport d’énergie le permet',
    'il se rapproche de K : la charge est une évolution spontanée',
    'il reste égal à K : le générateur maintient l’équilibre',
    'il ne change pas : Q_r ne dépend que de la température'], bonne: 0 },
  accu: { options: [
    'électrique en énergie chimique stockée',
    'chimique en énergie électrique, utilisée',
    'thermique en énergie électrique, stockée',
    'électrique en énergie lumineuse, perdue'], bonne: 0 },
};
