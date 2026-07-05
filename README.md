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

## Lizenz

GPL-3.0-only (siehe [LICENSE](LICENSE)).
