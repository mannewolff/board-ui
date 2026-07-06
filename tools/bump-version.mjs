#!/usr/bin/env node
/**
 * bump-version.mjs — erhoeht die Versionskennung (x.y.z) an beiden Stellen synchron:
 * package.json ("version") und die VERSION-Konstante in src/board-ui.mjs.
 *
 * Aufruf: node tools/bump-version.mjs <patch|minor|major>
 *   patch (Default) — z+1                (Trigger: "push main")
 *   minor           — y+1, z=0           (Trigger: "merge production")
 *   major           — x+1, y=0, z=0      (nur manuell)
 *
 * Gibt die neue Version auf stdout aus. Aendert keine Git-Zustaende — Commit/Push
 * macht die aufrufende Routine.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg) {
  process.stderr.write(msg + "\n");
  process.exit(1);
}

const level = process.argv[2] || "patch";
if (!["patch", "minor", "major"].includes(level)) {
  fail(`Ungueltige Stufe: ${level}. Erlaubt: patch | minor | major`);
}

// --- package.json lesen + Version parsen ---
const pkgPath = join(root, "package.json");
const pkgRaw = readFileSync(pkgPath, "utf-8");
const pkg = JSON.parse(pkgRaw);
const m = String(pkg.version || "").match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!m) fail(`package.json: "version" ist nicht x.y.z: ${pkg.version}`);
let [x, y, z] = m.slice(1).map(Number);

if (level === "major") { x += 1; y = 0; z = 0; }
else if (level === "minor") { y += 1; z = 0; }
else { z += 1; }
const next = `${x}.${y}.${z}`;

// --- package.json schreiben (2-Space-Indent + abschliessender Newline, wie gehabt) ---
pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

// --- VERSION-Konstante in board-ui.mjs nachziehen ---
const uiPath = join(root, "src", "board-ui.mjs");
const uiRaw = readFileSync(uiPath, "utf-8");
const uiNext = uiRaw.replace(/const VERSION = "\d+\.\d+\.\d+";/, `const VERSION = "${next}";`);
if (uiNext === uiRaw) fail(`VERSION-Konstante in src/board-ui.mjs nicht gefunden.`);
writeFileSync(uiPath, uiNext, "utf-8");

process.stdout.write(next + "\n");
