# board-ui

Eine schlanke UI für ein lokales Kanbanboard. Reiner Node-HTTP-Server, kein Framework, keine npm-Dependencies. Nur Node und git nötig, kein `npm install`.

Ursprünglich Teil des [claude-workflow-kit](https://github.com/mannewolff/claude-workflow-kit), hier als eigenständiges Projekt herausgelöst. Das Kit bettet die Dateien weiterhin über seinen Installer ein.

## Bestandteile

- `src/board-ui.mjs` — der HTTP-Server mit der Kanban-GUI. Zeigt Issues aus `issues/*.md` in fünf Spalten (Backlog, Ready, In Progress, In Review, Done), Listenansicht, Detail-Modal, Anlegen-Modal, automatische Archivierung.
- `src/board.mjs` — provider-agnostische CLI für Board-Operationen (Adapter für `local`, `github`, `gitlab`). Liest `.claude/workflow.config.json`.

Beide Dateien sind bewusst als eigenständige Single-File-Tools gebaut und einzeln lauffähig (portabel).

## Board starten

```bash
node src/board-ui.mjs [--port 3000]
```

Öffnet die Kanban-Ansicht auf http://localhost:3000. Ohne Konfiguration werden Issues aus `issues/` im aktuellen Verzeichnis gelesen; über `.claude/workflow.config.json` (`local.issuesDir`) lässt sich ein anderer Ordner setzen.

Alternativ per npm-Script:

```bash
npm start
```

## CLI

```bash
node src/board.mjs issue list [--status <status>]
node src/board.mjs issue create --title "..." --body "..."
node src/board.mjs issue move <id> <status>
node src/board.mjs issue comment <id> --text "..."
node src/board.mjs code repo-name
```

## Sync mit dem claude-workflow-kit

Das Kit bettet `board.mjs` und `board-ui.mjs` als Base64-Blobs in seinen `install.mjs` ein, damit Kit-Nutzer das Board ohne Extra-Schritt bekommen. Nach Änderungen in diesem Repo muss der Kit-Installer aktualisiert werden. Das geht **manuell** in drei Schritten (im ausgecheckten Kit-Repo, `<board-ui>` und `<kit>` sind die jeweiligen Repo-Pfade):

1. Aktuelle Dateien aus diesem Repo ins Kit kopieren. Am einfachsten über das mitgelieferte Script:
   ```bash
   npm run sync
   ```
   Es liest das Zielverzeichnis aus `sync.config.json` (rechnerspezifisch, nicht eingecheckt — Vorlage: `sync.config.example.json`) und kopiert `src/board.mjs` und `src/board-ui.mjs` dorthin. Alternativ von Hand:
   ```bash
   cp <board-ui>/src/board.mjs    <kit>/kit/board.mjs
   cp <board-ui>/src/board-ui.mjs <kit>/kit/board-ui.mjs
   ```
2. Eingebettete Blobs neu generieren:
   ```bash
   cd <kit> && node tools/sync-blobs.mjs
   ```
   Das schreibt die neuen Blobs in `install.mjs`. `node tools/sync-blobs.mjs --check` prüft nur (Exit 1 bei Drift, ohne zu ändern).
3. Im Kit-Repo committen und pushen.

Eine automatisierte Variante über GitHub Actions (board-ui-Release stößt einen Kit-Sync an) wäre möglich, wurde aber bewusst zugunsten dieses manuellen Wegs zurückgestellt — der spart die sonst nötigen Cross-Repo-Tokens.

## Lizenz

GPL-3.0-only (siehe [LICENSE](LICENSE)).
