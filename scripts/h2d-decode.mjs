#!/usr/bin/env node
/**
 * Decode html.to.design .h2d capture → JSON (educational / design diff).
 * Usage: node scripts/h2d-decode.mjs <file.h2d> [output.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync, inflateRawSync } from "node:zlib";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/h2d-decode.mjs <file.h2d> [output.json]");
  process.exit(1);
}

const raw = readFileSync(input);
const xored = Buffer.from(raw.map((b) => b ^ 0x39));

let decompressed;
try {
  decompressed = inflateSync(xored);
} catch {
  decompressed = inflateRawSync(xored);
}

const data = JSON.parse(decompressed.toString("utf8"));
const out = process.argv[3] ?? input.replace(/\.h2d$/i, ".json");
writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
console.log(`Wrote ${out} (${(decompressed.length / 1024).toFixed(1)} KB)`);
if (data.url) console.log("URL:", data.url);
if (data.width) console.log("Width:", data.width);
