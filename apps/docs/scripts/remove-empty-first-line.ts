#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Recursively find all .mdx files in a directory
 */
function findMdxFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findMdxFiles(filePath, fileList);
    } else if (file.endsWith(".mdx")) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Remove empty first line from a file if present
 */
function removeEmptyFirstLine(filePath: string): boolean {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // Check if first line is empty (whitespace only or completely empty)
  if (lines.length > 0 && lines[0].trim() === "") {
    // Remove first line and rejoin
    const newContent = lines.slice(1).join("\n");
    writeFileSync(filePath, newContent, "utf-8");
    return true;
  }

  return false;
}

// Main execution
const contentDir = join(__dirname, "../content");
const mdxFiles = findMdxFiles(contentDir);

let fixedCount = 0;

for (const file of mdxFiles) {
  if (removeEmptyFirstLine(file)) {
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
}

console.log(`\nTotal files checked: ${mdxFiles.length}`);
console.log(`Files fixed: ${fixedCount}`);
