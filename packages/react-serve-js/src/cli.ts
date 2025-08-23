#!/usr/bin/env node

import { Command } from "commander";
import { spawn } from "child_process";
import path from "path";
import { existsSync } from "fs";

const program = new Command();

program
  .name("react-serve")
  .description("ReactServe CLI")
  .version("0.0.0");

function resolveTsxLaunch(): { cmd: string; args: string[] } {
  // Prefer local project installation
  const localBin = path.join(process.cwd(), "node_modules", ".bin", "tsx");
  if (existsSync(localBin)) return { cmd: localBin, args: [] };
  try {
    // Use package-resolved CLI entry when available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const resolved = require.resolve("tsx/dist/cli.js");
    return { cmd: process.execPath, args: [resolved] };
  } catch (_) {
    // Fallback to PATH 'tsx'
    return { cmd: "tsx", args: [] };
  }
}

function resolveTscLaunch(): { cmd: string; args: string[] } {
  const localBin = path.join(process.cwd(), "node_modules", ".bin", "tsc");
  if (existsSync(localBin)) return { cmd: localBin, args: [] };
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const resolved = require.resolve("typescript/bin/tsc");
    return { cmd: process.execPath, args: [resolved] };
  } catch (_) {
    return { cmd: "tsc", args: [] };
  }
}

program
  .command("dev")
  .description("Run the ReactServe development server")
  .option("-p, --port <port>", "Port to run on (overrides App port)")
  .action(async (opts: { port?: string }) => {
    const { cmd, args: tsxArgs } = resolveTsxLaunch();
    const devRunner = path.join(__dirname, "dev-runner.js");

    const finalArgs: string[] = [...tsxArgs, devRunner];
    if (opts.port) {
      finalArgs.push("--port", String(opts.port));
    }

    const run = () => {
      const cp = spawn(cmd, finalArgs, { cwd: process.cwd(), stdio: "inherit" });
      cp.on("exit", (code) => {
        if (code === 0) setTimeout(run, 50);
        else process.exit(code === null ? 1 : code);
      });
    };

    run();
  });

program
  .command("start")
  .description("Start the ReactServe server")
  .option("-p, --port <port>", "Port to run on (overrides App port)")
  .action(async (opts: { port?: string }) => {
    const { cmd, args: tsxArgs } = resolveTsxLaunch();
    const devRunner = path.join(__dirname, "dev-runner.js");

    const finalArgs: string[] = [...tsxArgs, devRunner];
    if (opts.port) {
      finalArgs.push("--port", String(opts.port));
    }

    const cp = spawn(cmd, finalArgs, {
      cwd: process.cwd(),
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    cp.on("exit", (code) => process.exit(code === null ? 1 : code));
  });

program
  .command("build")
  .description("Typecheck the project (no emit by default)")
  .option("--emit", "Emit JS using TypeScript compiler", false)
  .action(async (opts: { emit?: boolean }) => {
    const { cmd, args } = resolveTscLaunch();
    const finalArgs: string[] = [...args];
    if (!opts.emit) {
      finalArgs.push("--noEmit");
    }
    const cp = spawn(cmd, finalArgs, { cwd: process.cwd(), stdio: "inherit" });
    cp.on("exit", (code) => process.exit(code === null ? 1 : code));
  });

program.parse();


