#!/usr/bin/env node
/**
 * sync-to-kit.mjs — kopiert die Board-Dateien ins claude-workflow-kit.
 *
 * Liest das Zielverzeichnis aus sync.config.json (rechnerspezifisch, gitignored)
 * und kopiert src/board.mjs und src/board-ui.mjs dorthin. Danach im Kit-Repo
 * `node tools/sync-blobs.mjs` ausführen, um install.mjs zu aktualisieren.
 *
 * Nutzung: node tools/sync-to-kit.mjs   (oder: npm run sync)
 */

import { readFileSync, copyFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  process.stderr.write(msg + "\n");
  process.exit(1);
}

const configPath = join(root, "sync.config.json");
if (!existsSync(configPath)) {
  fail(
    "sync.config.json nicht gefunden.\n" +
    "Lege sie nach dem Muster von sync.config.example.json an und trage unter\n" +
    '"targetDir" das kit/-Verzeichnis deines claude-workflow-kit-Repos ein.'
  );
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf-8"));
} catch (e) {
  fail(`sync.config.json ist kein gültiges JSON: ${e.message}`);
}

const targetDir = config.targetDir;
if (!targetDir) {
  fail('sync.config.json: Feld "targetDir" fehlt.');
}
if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
  fail(`Zielverzeichnis existiert nicht oder ist kein Verzeichnis: ${targetDir}`);
}

const files = ["board.mjs", "board-ui.mjs"];
for (const f of files) {
  const src = join(root, "src", f);
  if (!existsSync(src)) fail(`Quelldatei fehlt: ${src}`);
  copyFileSync(src, join(targetDir, f));
  process.stdout.write(`✓ ${f} → ${join(targetDir, f)}\n`);
}

process.stdout.write(
  "\nFertig. Nächster Schritt im Kit-Repo:\n" +
  "  node tools/sync-blobs.mjs   # regeneriert die Blobs in install.mjs\n"
);
