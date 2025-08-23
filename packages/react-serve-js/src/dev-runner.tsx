import path from "path";
import { existsSync } from "fs";
import { serve } from "./runtime";
import { createRequire } from "module";

type LoadedConfig = { sourceRoot: string; entry: string };

function loadReactServeConfigSync(): LoadedConfig {
  const cwd = process.cwd();
  const base = path.join(cwd, "react-serve.config");
  const tryPaths = [
    base + ".ts",
    base + ".js",
  ];

  for (const cfgPath of tryPaths) {
    if (!existsSync(cfgPath)) continue;
    try {
      const requireFn = createRequire(__filename);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = requireFn(cfgPath);
      const conf = (mod && (mod.default || mod)) || {};
      return {
        sourceRoot: conf.sourceRoot || "src",
        entry: conf.entry || "index",
      };
    } catch (_) {
      return { sourceRoot: "src", entry: "index" };
    }
  }

  return { sourceRoot: "src", entry: "index" };
}

function resolveEntrypoint(): string {
  const { sourceRoot, entry } = loadReactServeConfigSync();
  const root = path.isAbsolute(sourceRoot)
    ? sourceRoot
    : path.join(process.cwd(), sourceRoot);

  const base = path.join(root, entry);
  const candidates = [".tsx", ".ts", ".jsx", ".js"].map((ext) => base + ext);
  for (const file of candidates) {
    if (existsSync(file)) return file;
  }
  throw new Error(
    `Could not resolve entry file. Looked for ${candidates
      .map((c) => path.relative(process.cwd(), c))
      .join(", ")}`
  );
}

async function main() {
  const entry = resolveEntrypoint();

  const mod = await import(pathToFileUrl(entry));
  const backend = (mod.default || mod.Backend || mod.App) as any;
  if (typeof backend === "function") {
    serve(backend());
    return;
  }

  throw new Error(
    `Entry module did not export a default function (React element factory). Found exports: ${Object.keys(
      mod
    ).join(", ")}`
  );
}

function pathToFileUrl(filePath: string) {
  let resolved = path.resolve(filePath);
  if (!resolved.startsWith("/")) {
    resolved = "/" + resolved;
  }
  return new URL("file://" + resolved).href;
}

main();


