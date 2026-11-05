import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadEnv } from "vite";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { MODE: "production", ...loadEnv("production", root, "") };
let index = 0;
const imports = [`import { defaultMetadata } from './src/app/metadata';`];
const entries = [`'/': defaultMetadata`];
async function scan(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(filename);
    else if (["layout.tsx", "page.tsx"].includes(entry.name)) {
      const text = await fs.readFile(filename, "utf8");
      if (!/export const metadata\b/.test(text)) continue;
      const relative = path
        .relative(path.join(root, "src/app"), path.dirname(filename))
        .replaceAll(path.sep, "/");
      const route = relative
        ? "/" + relative.replace(/\[(\w+)\]/g, ":$1")
        : "/";
      imports.push(
        `import {metadata as metadata${index}} from ${JSON.stringify("./" + path.relative(root, filename).replaceAll(path.sep, "/"))};`,
      );
      entries.push(`${JSON.stringify(route)}:metadata${index++}`);
    }
  }
}
await scan(path.join(root, "src/app"));
const output = path.join(root, "node_modules/.cache/route-metadata.mjs");
await build({
  stdin: {
    contents:
      imports.join("\n") + "\nexport default {" + entries.join(",") + "};",
    resolveDir: root,
    loader: "tsx",
  },
  outfile: output,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  define: { "import.meta.env": JSON.stringify(env) },
  alias: { "@": path.join(root, "src") },
  treeShaking: true,
});
const metadata = (await import(pathToFileURL(output))).default;
await fs.writeFile(
  path.join(root, "public/route-metadata.json"),
  JSON.stringify(metadata),
);
