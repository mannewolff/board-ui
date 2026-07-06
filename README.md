# board-ui

Eine schlanke UI für ein lokales Kanbanboard. Reiner Node-HTTP-Server, kein Framework, keine npm-Dependencies. Nur Node und git nötig, kein `npm install`.

Ursprünglich Teil des [claude-workflow-kit](https://github.com/mannewolff/claude-workflow-kit), hier als eigenständiges Projekt herausgelöst. Das Kit bettet die Dateien weiterhin über seinen Installer ein.

## Bestandteile

- `src/board-ui.mjs` — der HTTP-Server mit der Kanban-GUI. Zeigt Issues aus `issues/*.md` in fünf Spalten (Backlog, Ready, In Progress, In Review, Done), Listenansicht, Detail-Modal, Anlegen-Modal, automatische Archivierung.

Dieses Repo verantwortet **nur noch `board-ui.mjs`**. Die provider-agnostische Board-CLI (`board.mjs`) wird inzwischen im [claude-workflow-kit](https://github.com/mannewolff/claude-workflow-kit) selbst gepflegt und ist nicht mehr Teil dieses Repos.

`board-ui.mjs` ist bewusst als eigenständiges Single-File-Tool gebaut und einzeln lauffähig (portabel).

## Board starten

```bash
node src/board-ui.mjs [--port 3000]
```

Öffnet die Kanban-Ansicht auf http://localhost:3000. Ohne Konfiguration werden Issues aus `issues/` im aktuellen Verzeichnis gelesen; über `.claude/workflow.config.json` (`local.issuesDir`) lässt sich ein anderer Ordner setzen.

Alternativ per npm-Script:

```bash
npm start
```

## Board-CLI

Die CLI für Board-Operationen (`board.mjs`) lebt jetzt im [claude-workflow-kit](https://github.com/mannewolff/claude-workflow-kit) und wird dort gepflegt. Der Kit-Installer legt sie unter `.claude/kit/board.mjs` ab.

## Sync mit dem claude-workflow-kit

Das Kit bettet `board-ui.mjs` als Base64-Blob in seinen `install.mjs` ein, damit Kit-Nutzer die Board-UI ohne Extra-Schritt bekommen. Nach Änderungen in diesem Repo muss der Kit-Installer aktualisiert werden. Das geht **manuell** in drei Schritten (im ausgecheckten Kit-Repo, `<board-ui>` und `<kit>` sind die jeweiligen Repo-Pfade):

1. Aktuelle Datei aus diesem Repo ins Kit kopieren. Am einfachsten über das mitgelieferte Script:
   ```bash
   npm run sync
   ```
   Es liest das Zielverzeichnis aus `sync.config.json` (rechnerspezifisch, nicht eingecheckt — Vorlage: `sync.config.example.json`) und kopiert `src/board-ui.mjs` dorthin. Alternativ von Hand:
   ```bash
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
