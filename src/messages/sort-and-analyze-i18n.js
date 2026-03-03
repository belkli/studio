#!/usr/bin/env node
/**
 * i18n JSON Utility
 * -----------------
 * 1. Sorts all keys alphabetically at every nesting level.
 * 2. Reports duplicate translation VALUES (descending by count) so you can
 *    estimate how much the file could be compacted by a shared-key strategy.
 * 3. Writes the sorted file to <original-name>.sorted.json
 *
 * Usage:
 *   node sort-and-analyze-i18n.js <path-to-translation.json>
 *
 * Example:
 *   node sort-and-analyze-i18n.js en.json
 */

const fs = require("fs");
const path = require("path");

// ─── helpers ────────────────────────────────────────────────────────────────

/** Recursively sort every object's keys alphabetically. */
function sortDeep(value) {
    if (Array.isArray(value)) return value.map(sortDeep);

    if (value !== null && typeof value === "object") {
        return Object.keys(value)
            .sort((a, b) => a.localeCompare(b))
            .reduce((acc, key) => {
                acc[key] = sortDeep(value[key]);
                return acc;
            }, {});
    }

    return value; // string / number / boolean
}

/**
 * Walk the whole tree and collect every leaf string value.
 * Returns an array of { path, value } objects.
 */
function collectLeaves(obj, prefix = "") {
    const leaves = [];

    for (const [key, val] of Object.entries(obj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
            leaves.push(...collectLeaves(val, fullPath));
        } else if (typeof val === "string") {
            leaves.push({ path: fullPath, value: val });
        }
    }

    return leaves;
}

/**
 * Build duplicate-value report.
 * Returns rows sorted by count descending.
 */
function buildDuplicateReport(leaves) {
    // group paths by normalised value (trimmed, case-insensitive)
    const map = new Map(); // normValue → { displayValue, paths[] }

    for (const { path, value } of leaves) {
        const norm = value.trim().toLowerCase();
        if (!map.has(norm)) {
            map.set(norm, { displayValue: value, paths: [] });
        }
        map.get(norm).paths.push(path);
    }

    // keep only values that appear more than once
    return [...map.values()]
        .filter(({ paths }) => paths.length > 1)
        .sort((a, b) => b.paths.length - a.paths.length);
}

/** Right-pad a string to width. */
const pad = (str, w) => String(str).padEnd(w);
/** Left-pad a number. */
const lpad = (n, w) => String(n).padStart(w);

// ─── main ────────────────────────────────────────────────────────────────────

function main() {
    const inputPath = process.argv[2];

    if (!inputPath) {
        console.error("Usage: node sort-and-analyze-i18n.js <path-to-json>");
        process.exit(1);
    }

    if (!fs.existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        process.exit(1);
    }

    // ── 1. Read & parse ────────────────────────────────────────────────────────
    const raw = fs.readFileSync(inputPath, "utf8");
    const data = JSON.parse(raw);

    // ── 2. Sort ────────────────────────────────────────────────────────────────
    const sorted = sortDeep(data);

    const ext = path.extname(inputPath);
    const base = path.basename(inputPath, ext);
    const dir = path.dirname(inputPath);
    const outputPath = path.join(dir, `${base}.sorted${ext}`);

    fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2), "utf8");
    console.log(`\n✅  Sorted file written → ${outputPath}\n`);

    // ── 3. Collect leaves & stats ─────────────────────────────────────────────
    const leaves = collectLeaves(data);
    const totalKeys = leaves.length;
    const duplicates = buildDuplicateReport(leaves);

    const redundantKeys = duplicates.reduce(
        (sum, { paths }) => sum + (paths.length - 1), // each duplicate beyond first is redundant
        0
    );

    const savingPct = ((redundantKeys / totalKeys) * 100).toFixed(1);

    // ── 4. Print summary ──────────────────────────────────────────────────────
    console.log("═".repeat(72));
    console.log(" DUPLICATE VALUE REPORT");
    console.log("═".repeat(72));
    console.log(`  Total leaf keys   : ${totalKeys}`);
    console.log(`  Unique dup values : ${duplicates.length}`);
    console.log(`  Redundant keys    : ${redundantKeys}  (${savingPct}% could be shared)`);
    console.log("─".repeat(72));

    if (duplicates.length === 0) {
        console.log("  🎉  No duplicate values found.");
    } else {
        // Header
        console.log(
            `  ${pad("Count", 7)} ${pad("Value (truncated to 45 chars)", 47)} Example path`
        );
        console.log("  " + "─".repeat(68));

        for (const { displayValue, paths } of duplicates) {
            const preview = displayValue.replace(/\n/g, "\\n").slice(0, 45);
            const exampleKey = paths[0];
            console.log(
                `  ${lpad(paths.length, 5)}x  ${pad(preview, 47)} ${exampleKey}`
            );
        }

        console.log("\n  Full key lists for top 20 duplicates:");
        console.log("  " + "─".repeat(68));

        for (const { displayValue, paths } of duplicates.slice(0, 20)) {
            const preview = `"${displayValue.replace(/\n/g, "\\n").slice(0, 50)}"`;
            console.log(`\n  ${preview}  (×${paths.length})`);
            paths.forEach((p) => console.log(`      • ${p}`));
        }
    }

    console.log("\n" + "═".repeat(72));

    // ── 5. Write full report to file ──────────────────────────────────────────
    const reportLines = [];
    reportLines.push("DUPLICATE VALUE REPORT");
    reportLines.push("=".repeat(72));
    reportLines.push(`Total leaf keys   : ${totalKeys}`);
    reportLines.push(`Unique dup values : ${duplicates.length}`);
    reportLines.push(`Redundant keys    : ${redundantKeys}  (${savingPct}% could be shared)`);
    reportLines.push("-".repeat(72));
    reportLines.push(`${"Count".padEnd(7)} ${"Value".padEnd(50)} Example path`);
    reportLines.push("-".repeat(72));

    for (const { displayValue, paths } of duplicates) {
        const preview = displayValue.replace(/\n/g, "\\n").slice(0, 50);
        reportLines.push(`${lpad(paths.length, 5)}x    ${pad(preview, 52)} ${paths[0]}`);
    }

    reportLines.push("");
    reportLines.push("FULL KEY LISTS FOR ALL DUPLICATES");
    reportLines.push("=".repeat(72));

    for (const { displayValue, paths } of duplicates) {
        reportLines.push(`\n"${displayValue.replace(/\n/g, "\\n")}"  (×${paths.length})`);
        paths.forEach((p) => reportLines.push(`  • ${p}`));
    }

    const reportPath = path.join(dir, `${base}.duplicates-report.txt`);
    fs.writeFileSync(reportPath, reportLines.join("\n"), "utf8");
    console.log(`📄  Full report written  → ${reportPath}\n`);
}

main();