import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const src = path.resolve(rootDir, "public");
const dst = path.resolve(rootDir, ".vercel", "output", "static");

if (fs.existsSync(src)) {
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }

  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const dstPath = path.join(dst, entry);
    fs.cpSync(srcPath, dstPath, { recursive: true, force: true });
  }

  console.log(`[postbuild] Successfully copied ${entries.length} public assets into ${dst}`);
}
