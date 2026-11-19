#!/usr/bin/env bash
# Contrôle unique d'un lot : tests du modèle, eslint, build, puis parcours guidés et fiches rejoués sur les simulations données.
# Usage : bash scripts/controle.sh [id_simulation ...]   (sans id : seulement tests, eslint et build)
set -u
cd "$(dirname "$0")/.."
echec=0
echo "== Tests =="; for t in src/*.test.mjs $(find src/simulations -name '*.test.mjs' | sort); do node "$t" >/dev/null 2>/tmp/ctl_err || { echo "ÉCHEC $t"; tail -3 /tmp/ctl_err; echec=1; }; done
echo "== ESLint (le dépôt a déjà des erreurs : on vérifie seulement qu'il n'y en a pas de nouvelles) =="
npx eslint . --quiet -f json >/tmp/ctl_lint.json 2>/dev/null
n=$(node -e "const r=JSON.parse(require('fs').readFileSync('/tmp/ctl_lint.json','utf8'));console.log(r.reduce((a,f)=>a+f.errorCount,0))")
base=$(cat scripts/eslint-base.txt)
echo "erreurs : $n (référence : $base)"
if [ "$n" -gt "$base" ]; then echo "ESLint : NOUVELLES erreurs"; node -e "const r=JSON.parse(require('fs').readFileSync('/tmp/ctl_lint.json','utf8'));for(const f of r)if(f.errorCount&&/simulations\\/(Ond|Mol|Lewis|Geo|Redox|Diss|Savon|Comb|Coul|Mes|Fl|Phot|Niv)/.test(f.filePath))console.log(f.filePath,f.messages.slice(0,5).map(m=>m.line+' '+m.message).join(' | '))"; echec=1; fi
echo "== Build =="; npm run build >/tmp/ctl_build 2>&1 || { echo "ÉCHEC build"; tail -15 /tmp/ctl_build; echec=1; }
if [ "$#" -gt 0 ] && [ "$echec" = 0 ]; then
  PORT=${PORT:-4173}
  npx vite preview --port "$PORT" --strictPort >/tmp/ctl_prev 2>&1 & PID=$!
  sleep 3
  echo "== Parcours =="; BASE="http://localhost:$PORT/" node scripts/controle-parcours.cjs "$@" || echec=1
  echo "== Fiches (390 px) =="; BASE="http://localhost:$PORT/" node scripts/controle-fiches.cjs "$@" || echec=1
  kill $PID 2>/dev/null
fi
[ "$echec" = 0 ] && echo "CONTRÔLE OK" || echo "CONTRÔLE : PROBLÈMES"
exit $echec
