import { mkdir, copyFile, writeFile, cp } from "node:fs/promises";
import { resolve } from "node:path";

// Only browser assets enter the public artifact. Database SQL, tests and backups stay out.
const out = resolve("dist");
await mkdir(out, { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "operations.js",
  "operations.css",
  "icon.svg",
  "manifest.webmanifest",
  "sw.js",
]) {
  await copyFile(resolve(file), resolve(out, file));
}
await writeFile(resolve(out, ".nojekyll"), "");
await cp(resolve("assets"), resolve(out, "assets"), { recursive: true });
console.log("3zbh: static site built in dist/");
