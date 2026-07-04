# Plan: Board-UI als eigenständiges Projekt (mit Epics/Stories)

Erstellt am 2026-07-04 in einer Planungssession im Repo `claude-workflow-kit`. Dieses Dokument ist als Übergabe an eine neue Session im neuen Board-Projekt gedacht — es fasst zusammen, was besprochen und entschieden wurde, und was noch offen ist. Kein Code wurde bisher geschrieben, keine Issues angelegt.

## Ziel und Nutzerwirkung

Die heute in `claude-workflow-kit` liegende Board-UI (`kit/board-ui.mjs` + `kit/board.mjs`) soll:

1. In ein **eigenständiges Projekt** (eigenes Git-Repo) herausgelöst werden, damit sie unabhängig vom Kit weiterentwickelt werden kann.
2. Trotzdem **automatisch Teil des `claude-workflow-kit`-Installers** bleiben — Nutzer des Kits merken vom separaten Repo nichts, `install.mjs` liefert das Board weiterhin mit.
3. Funktional deutlich ausgebaut werden ("sexier"), primär um **Epics und Stories** als Organisationsebene, damit die UI eine echte Alternative zu anderen Kanban-Boards wird.

## Ausgangslage (Kontext aus claude-workflow-kit)

- `kit/board.mjs` (~700 Zeilen): CLI + Adapter-Abstraktion für Code-Host/Issue-Tracker (`github`, `gitlab`, `local`). Frontmatter-Parser, `createIssue`, Status-Handling.
- `kit/board-ui.mjs` (~1450 Zeilen): reiner Node-`http`-Server, **kein Framework, keine npm-Dependencies**, HTML/CSS/JS als Strings im Server gerendert. Bietet Board-Ansicht (5 Spalten: Backlog/Ready/In Progress/In Review/Done), Listenansicht, Detail-Modal mit Kommentaren, Anlegen-Modal, automatische Archivierung (Done > 3 Tage).
- Beide Dateien sind **bewusst dupliziert** statt in einem gemeinsamen Modul (Entscheidung aus Issue #68 im Kit, Status COMPLETED): beide sollen unabhängig voneinander portable Single-File-Tools bleiben. SYNC-Kommentare markieren die duplizierten Stellen (`parseFrontmatter`, `serializeFrontmatter`, `createIssue`).
- `install.mjs` embedded beide Dateien aktuell als Base64-Blobs direkt im Installer-Skript. Ein Sync-Mechanismus (`tools/sync-blobs.mjs`, Teil der `buildChecks`) prüft, dass die Blobs nicht vom aktuellen Dateiinhalt abweichen.
- Lokaler Modus speichert Issues als einzelne Markdown-Dateien mit YAML-Frontmatter in `issues/*.md` (Vier-Abschnitt-Format: Kontext, Aufgabe, Akzeptanzkriterium, Abhängigkeiten). `columns`-Feld in der Config mappt die vorgegebenen Status-Keys auf anzeigbare Spaltennamen.
- **Multi-Rechner-Sync ist kein Problem und kein Architekturthema:** `issues/`-Ordner kann einfach in einem Cloud-/Nextcloud-Ordner liegen (per `issuesDir`-Konfiguration), mehrere Rechner greifen auf dieselben Dateien zu. Reine Konfigurationsfrage, keine Code-Änderung nötig.

## Architektur-Entscheidungen (in dieser Session getroffen)

### E1 — Vanilla-Architektur bleibt (kein Framework-Zwang)

Ursprünglich stand zur Debatte, ob die UI wegen wachsender Komplexität auf ein echtes Frontend-Framework (React/Vite) umgestellt werden muss. **Entscheidung: nein, vanilla (Server-seitiges Rendering, kein Build-Zwang) reicht weiterhin.** Der Auslöser für die Framework-Überlegung war die Idee, dieselbe UI auch in einem anderen Projekt (Toolbox, React/MUI/dnd-kit-Stack) wiederzuverwenden — diese Idee ist zurückgestellt (siehe „Bewusst nicht im Scope"). Ohne dieses Ziel gibt es keinen Grund, die Server-Side-Rendering-Architektur zu verlassen. Bei Bedarf ist eine Modularisierung der heute einen 1450-Zeilen-Datei in mehrere Dateien sinnvoll, aber kein Framework-Wechsel.

### E2 — Installer-Kopplung: Build-Artefakt weiterhin einbetten

Das neue Board-Repo bekommt einen eigenen Release-Zyklus (Git-Tags). Ein Sync-Mechanismus im Kit (Weiterentwicklung von `tools/sync-blobs.mjs`) zieht bei Bedarf die neueste Version aus dem neuen Repo und embedded sie erneut in `install.mjs` — exakt das heutige Muster, nur dass die Quelle jetzt in einem anderen Repo liegt. Für Kit-Nutzer ändert sich nichts: ein `install.mjs`-Lauf reicht weiterhin, kein Netzwerk zur Laufzeit, keine neuen Dependencies.

**Verworfen:** echte npm-Dependency (bricht die Zero-Dependency-Eigenschaft des Kits: aktuell braucht man nur Node + git, kein `npm install`), Git-Submodule/Subtree (nutzerunfreundlich beim Clone/Update).

### E3 — kit/board.mjs und kit/board-ui.mjs wandern gemeinsam ins neue Projekt

*(Empfehlung, in der Session nicht explizit final bestätigt — siehe Stopp-Frage 1 unten.)* Da beide Dateien eng gekoppelt sind (duplizierte Funktionen mit SYNC-Kommentaren, siehe Issue #68) und die UI ohne den Adapter/CLI-Teil nicht funktioniert, sollten beide zusammen in das neue Repo wandern. Das Kit selbst behält dann nur noch `install.mjs` + den Sync-Mechanismus, der das fertige Paket embedded.

### E4 — Zwei-Ebenen-Hierarchie: Epic → Story/Task, explizit KEINE Sub-tasks

Diskutiert und **bewusst gegen eine dritte Hierarchie-Ebene (Sub-tasks im Jira-Sinne) entschieden**. Begründung: Sub-tasks existieren in klassischen Kanban-Tools primär zur Aufteilung nach menschlichen Zuständigkeiten (Frontend/Backend/Test als getrennt trackbare Arbeit verschiedener Personen). In einem KI-getriebenen Entwicklungsprozess entfällt dieser Grund — eine KI setzt eine Story typischerweise als zusammenhängende vertikale Slice um. Wird ein Issue zu groß, wird es stattdessen in mehrere kleinere Stories unter demselben Epic geschnitten (bestehende Kit-Philosophie: kleinteilige Issues im Vier-Abschnitt-Format), statt eine dritte Ebene mit eigener Drag-Logik einzuführen (inkl. der sonst nötigen Fragen wie "was passiert mit dem Parent-Status, wenn nur ein Teil der Kinder fertig ist").

### E5 — Epics nehmen nicht am Spalten-Workflow teil

Epics haben **keinen Status im Sinne der fünf Kanban-Spalten**. Sie sind reine Organisationseinheiten, keine abarbeitbaren Workflow-Objekte. Sie können nicht in die Ready-Spalte gezogen werden (das ist reserviert für tatsächlich umsetzbare Stories/Tasks, die `implement-ready` sequenziell abarbeitet). Praktische Konsequenz: `board.mjs issue list --status ready` und `implement-ready` brauchen **keinen Sonderfall** für Epics — die tauchen dort naturgemäß nie auf, weil sie kein `status`-Feld im Spalten-Sinne führen.

## Datenmodell

Erweiterung des bestehenden Frontmatter-Formats, **abwärtskompatibel** (fehlende Felder = Verhalten wie heute, reiner Task):

```yaml
---
id: "0012"
type: story          # epic | story | task (default: task)
parent: "0007"        # id des Epics, nur bei type: story/task relevant; leer bei epics
status: ready          # nur bei story/task genutzt; bei epics nicht relevant/nicht vorhanden
title: Login-Formular bauen
created: 2026-07-04
---
```

Design-Entscheidungen zum Modell:

- **Nur Parent-Zeiger, keine Kind-Liste am Epic.** Kinder werden beim Lesen aus allen Issues über `parent` zusammengesucht (Scan), nicht redundant als Liste am Epic gespeichert — vermeidet Drift zwischen zwei Quellen der Wahrheit.
- **Flache Ablage** (`issues/*.md`), keine Ordner-Hierarchie. Bricht nicht die bestehende `nextId`/`padId`-Logik.
- **Bewusst nah am Jira-Modell** (Epic/Story, Parent-Referenz), damit ein späterer Jira-Adapter (siehe „Bewusst nicht im Scope") das Modell nur mappen, nicht neu erfinden muss.

## UI-Konzept

- **Dritter Tab „Epics"** neben Board und Liste:
  - Listet alle Epics mit Titel, Kurzbeschreibung und Fortschrittsbalken (z.B. „3/7 Stories fertig", berechnet aus den Kindern).
  - Klick öffnet eine Detailansicht: alle zugehörigen Stories/Tasks mit Status-Badges (Backlog/Ready/…/Done) — ein Mini-Board nur für dieses Epic, **ohne Drag-Funktion**. Von dort lässt sich auch direkt eine neue Story mit vorbelegtem `parent` anlegen.
- **Board und Liste zeigen weiterhin nur Stories/Tasks als Karten — keine Epic-Karten.** Epics erscheinen dort nicht als eigenständiges, ziehbares Element.
- **Stories mit Epic-Zugehörigkeit bekommen ein sichtbares Badge/Label** auf ihrer Karte in Board und Liste (z.B. Epic-Kürzel oder -Farbe), damit die Zuordnung auch außerhalb der Epic-Detailansicht auf einen Blick erkennbar ist. (Explizit bestätigt: nicht nur in der Epic-Ansicht sichtbar, sondern auch als Label auf der Karte selbst.)
- **Anlegen-Modal** bekommt eine Typ-Auswahl (Epic/Story/Task) und, wenn nicht Epic, einen Parent-Picker (Suche über bestehende Epics).

## Bewusst nicht im Scope (zurückgestellt, nicht verworfen)

- **Toolbox-Anbindung als Adapter.** Ursprünglich diskutiert: Toolbox (eigenes Projekt, React/MUI/dnd-kit-Frontend + Spring-Boot-REST-Backend + Keycloak-Auth, hat bereits eine eigene, fertige Kanban-Implementierung) könnte als vierter Adapter-Typ (`toolbox`, neben `github`/`gitlab`/`local`) angebunden werden, sodass dieselbe Board-UI auch gegen Toolbox' Backend läuft. Datenform von Toolbox' Kanban-API (`frontend/src/api/kanban.ts` im Toolbox-Repo `/Users/manfredwolff/ki-projects/java`) passt strukturell gut (Titel, Body als Markdown, Spalte, Position, Kommentare, Archivierung). **Diese Idee ist für jetzt gestoppt/pausiert**, evtl. dauerhaft — Priorität liegt auf dem Ausbau der eigenständigen Board-UI. Offene Punkte, falls das Thema später wieder aufgenommen wird: Auth-Mechanismus gegen Keycloak, Mapping numerischer IDs/Position auf das Datei-Modell.
- **Jira-Adapter.** Als nächster Adapter nach dieser Extraktion geplant (`codeHost`/`issueTracker: jira`), aber nicht Teil dieses Plans. Das Epic/Story-Datenmodell (E4/E5, siehe oben) ist bewusst so gewählt, dass dieser Adapter später ohne Modelländerung möglich ist.
- **Sub-tasks / dritte Hierarchie-Ebene** — explizit verworfen, siehe E4.

## Offene Stopp-Fragen für die neue Session

1. **Wandert `kit/board.mjs` (Adapter/CLI-Teil) mit ins neue Projekt, oder bleibt er im Kit?** Empfehlung dieser Session: mitwandern (E3), aber nie explizit von Manne bestätigt.
2. ~~Repo-Name und -Ort des neuen Projekts~~ — **geklärt:** `mannewolff/board-ui`, lokal unter `/Users/manfredwolff/ki-projects/board-ui` (Repo bereits angelegt, mit README/LICENSE, Remote auf GitHub verbunden).
3. **Sync-Mechanismus Kit ↔ Board-Repo konkret ausgestalten:** Wie oft/wodurch wird `install.mjs` im Kit aktualisiert, wenn sich das Board-Repo weiterentwickelt (manuell getriggert vs. automatisiert, welche Version/Tag wird eingebettet)?
4. **Visualisierung der Epic-Zugehörigkeit auf Karten:** konkrete Umsetzung des Badges/Labels (Text-Kürzel, Farbe, Icon?) — Grundsatzentscheidung „sichtbar als Label" ist gefallen, Gestaltung ist offen.

## Verifizierung (grobe Richtung, im neuen Projekt zu konkretisieren)

- Board-UI im neuen Repo eigenständig startbar und testbar, ohne Checkout des Kits.
- `install.mjs` im Kit liefert nach Sync weiterhin ein lauffähiges Board ohne zusätzliche Nutzer-Schritte.
- Bestehende Funktionen (Board/Liste, Drag, Modal, Archivierung, Kommentare) bleiben nach der Extraktion unverändert nutzbar.
- Neue Epic/Story-Funktionalität: Epic-Fortschrittsberechnung stimmt mit tatsächlichem Stand der Kinder überein; Epics erscheinen nie in Ready-Filterung/`implement-ready`; abwärtskompatibel mit bestehenden Issue-Dateien ohne `type`/`parent`-Feld.
