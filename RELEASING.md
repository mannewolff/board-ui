# Releasing

Dieses Repo trägt eine sichtbare Versionskennung `x.y.z` auf dem Board.
**Quelle der Wahrheit:** die `VERSION`-Konstante in `src/board-ui.mjs`, synchron
gespiegelt in `package.json`. Erhöht wird ausschließlich über
`tools/bump-version.mjs`, das beide Stellen zugleich aktualisiert.

Die Release-Schritte sind bewusst **KI-getrieben** (kein Git-Hook, keine
GitHub-Action — Entscheidung aus Issue #10). Der Bump passiert also nur, wenn er
bei den Triggern hier ausgeführt wird. Der generische `push-main`- bzw.
`merge-production`-Skill prüft lediglich, ob diese Datei existiert, und führt die
passenden Schritte aus.

## Bei `push main` (Trigger: push)

1. `node tools/bump-version.mjs patch` — erhöht z (z. B. `0.1.1` → `0.1.2`)
2. `npm run sync` — spiegelt `src/board-ui.mjs` in die Kit-Kopie
3. Die geänderten Dateien (`package.json`, `src/board-ui.mjs`) mit committen —
   Commit-Titel: `chore: Version x.y.z (push main)`
4. Alles im selben Push-Batch nach `main` pushen.

## Bei `merge production` (Trigger: merge)

1. `node tools/bump-version.mjs minor` — y+1, z=0 (z. B. `0.1.2` → `0.2.0`)
2. `npm run sync`
3. Den Bump in den Production-PR aufnehmen.
   Den Merge/Push auf `production` macht der Mensch — der Skill erstellt nur den PR.

## major

Nur auf ausdrückliche Ansage: `node tools/bump-version.mjs major` (x+1, y=0, z=0).
