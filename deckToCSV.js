#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function printUsage() {
  console.log(
    "Usage: deckToCSV.js <inputFile> [outputFile] [--keep-sections] [--stdout]",
  );
  console.log("");
  console.log("Examples:");
  console.log("  ./deckToCSV.js annie");
  console.log("  ./deckToCSV.js annie annie.csv");
  console.log("  ./deckToCSV.js annie --keep-sections");
}

function normalizeSectionName(rawSection) {
  return rawSection.trim().toLowerCase();
}

function parseDeckList(content, keepSections) {
  const lines = content.split(/\r?\n/);
  const allowedSections = new Set([
    "champion",
    "maindeck",
    "battlefields",
    "runes",
  ]);
  const ignoredSections = new Set(["legend"]);

  const totals = new Map();
  const rows = [];
  let currentSection = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^([^:]+):$/);
    if (sectionMatch) {
      currentSection = normalizeSectionName(sectionMatch[1]);
      continue;
    }

    const cardMatch = line.match(/^(\d+)\s+(.+)$/);
    if (!cardMatch) {
      continue;
    }

    const quantity = Number(cardMatch[1]);
    const name = cardMatch[2].trim();

    if (!currentSection || ignoredSections.has(currentSection)) {
      continue;
    }

    if (!allowedSections.has(currentSection)) {
      continue;
    }

    if (keepSections) {
      rows.push({ quantity, name, section: currentSection });
      continue;
    }

    totals.set(name, (totals.get(name) || 0) + quantity);
  }

  if (keepSections) {
    return rows;
  }

  return [...totals.entries()]
    .map(([name, quantity]) => ({ quantity, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function escapeCsv(value) {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows, keepSections) {
  const header = keepSections
    ? ["Quantity", "Name", "Section"]
    : ["Quantity", "Name"];
  const csvLines = [header.join(",")];

  for (const row of rows) {
    const values = keepSections
      ? [row.quantity, row.name, row.section]
      : [row.quantity, row.name];
    csvLines.push(values.map(escapeCsv).join(","));
  }

  return `${csvLines.join("\n")}\n`;
}

function resolveOutputFile(inputFile, explicitOutputFile) {
  if (explicitOutputFile) {
    return path.resolve(process.cwd(), explicitOutputFile);
  }

  const inputPath = path.resolve(process.cwd(), inputFile);
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.csv`);
}

function run() {
  const args = process.argv.slice(2);
  const keepSections = args.includes("--keep-sections");
  const printToStdout = args.includes("--stdout");
  const positionalArgs = args.filter((arg) => !arg.startsWith("--"));

  if (positionalArgs.length < 1) {
    printUsage();
    process.exit(1);
  }

  const [inputFile, outputFile] = positionalArgs;
  const inputPath = path.resolve(process.cwd(), inputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, "utf8");
  const rows = parseDeckList(content, keepSections);

  if (rows.length === 0) {
    console.error(
      "No deck cards found. Check input format and section headers.",
    );
    process.exit(1);
  }

  const csv = rowsToCsv(rows, keepSections);

  if (printToStdout) {
    process.stdout.write(csv);
    return;
  }

  const outputPath = resolveOutputFile(inputFile, outputFile);
  fs.writeFileSync(outputPath, csv, "utf8");
  console.log(`CSV written to: ${outputPath}`);
}

run();
