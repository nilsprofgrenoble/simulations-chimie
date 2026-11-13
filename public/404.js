// Appelé par 404.html (GitHub Pages sert cette page pour toute adresse inconnue).
// Une adresse /sim/<numéro>/ ou /sim/<numéro>-texte-ancien/ qui n'existe pas en tant que fichier est renvoyée vers « /?sim=<numéro> » :
// l'application la réécrit aussitôt vers l'adresse propre actuelle de cette simulation (le numéro fait foi, pas le texte).
(function () {
  var m = location.pathname.match(/^\/sim\/(\d+)(?:-[^/]*)?\/?$/);
  if (m) location.replace('/?sim=' + m[1] + (location.search ? '&' + location.search.slice(1) : '') + location.hash);
})();
