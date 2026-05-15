#!/usr/bin/env node
/**
 * Agent Discovery Simulation
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrates the three layers by which an AI agent can discover and choose
 * tools from the MCP "everything" server — without hard-coding anything.
 *
 * Layer 1 – STATIC / HTTP BEACON  (pre-connection, no MCP session)
 *   Simulates fetching /.well-known/mcp-capabilities.json.
 *   A real agent running against the HTTP transport would do:
 *     const r = await fetch("http://localhost:3001/.well-known/mcp-capabilities.json");
 *     const manifest = await r.json();
 *   Here we import the builder directly so the demo runs without a live server.
 *
 * Layer 2 – IN-PROTOCOL BEACON  (after connecting via MCP)
 *   Shows what the mcp://capabilities resource returns.
 *
 * Layer 3 – META-TOOL BEACON  (while choosing which tool to call)
 *   Runs the same scoring logic as the suggest-tool MCP tool.
 *   A real agent would do: tools/call suggest-tool { task: "..." }
 *
 * Run with:
 *   cd src/everything && npm run build
 *   npx tsx ../../demo/agent-discovery-sim.ts
 *
 * Or without building (tsx resolves TS directly):
 *   npx tsx demo/agent-discovery-sim.ts
 */

import {
  buildCapabilityManifest,
  TOOL_CAPABILITIES,
} from "../src/everything/dist/beacon/capability-manifest.js";
import type { ToolCapability } from "../src/everything/beacon/capability-manifest.js";

// ─── ANSI colour helpers ──────────────────────────────────────────────────────
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const magenta = (s: string) => `\x1b[35m${s}\x1b[0m`;

function section(title: string) {
  const bar = "─".repeat(70);
  console.log(`\n${cyan(bar)}`);
  console.log(bold(cyan(` ${title}`)));
  console.log(cyan(bar));
}

function print(s: string) {
  console.log(s);
}

// ─── Scoring logic (mirrors suggest-tool.ts exactly) ─────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,._\-/\\()\[\]{}]+/)
    .filter((w) => w.length > 2);
}

function tokensOverlap(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

interface ScoredTool {
  tool: ToolCapability;
  score: number;
  matchedOn: string[];
}

function scoreToolForTask(tool: ToolCapability, taskTokens: string[]): ScoredTool {
  const matchedOn: string[] = [];
  let score = 0;

  const nameTokens = tokenize(`${tool.name} ${tool.title}`);
  for (const nt of nameTokens) {
    if (taskTokens.some((t) => tokensOverlap(t, nt))) {
      score += 5;
      matchedOn.push(`name:${nt}`);
    }
  }

  for (const taskType of tool.taskTypes) {
    const typeTokens = tokenize(taskType);
    const overlap = typeTokens.filter((tt) =>
      taskTokens.some((ut) => tokensOverlap(ut, tt))
    );
    if (overlap.length > 0) {
      score += 4 * overlap.length;
      matchedOn.push(`taskType:${taskType}`);
    }
  }

  for (const tag of tool.tags) {
    if (taskTokens.some((t) => tokensOverlap(t, tag))) {
      score += 3;
      matchedOn.push(`tag:${tag}`);
    }
  }

  for (const example of tool.exampleTasks) {
    const exampleTokens = tokenize(example);
    const overlap = exampleTokens.filter((et) =>
      taskTokens.some((ut) => tokensOverlap(ut, et))
    );
    if (overlap.length >= 2) {
      score += overlap.length;
      matchedOn.push(`example:"${example}"`);
    }
  }

  return { tool, score, matchedOn: [...new Set(matchedOn)] };
}

function rankTools(task: string, maxResults = 3): ScoredTool[] {
  const tokens = tokenize(task);
  return TOOL_CAPABILITIES.map((t) => scoreToolForTask(t, tokens))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ─── Layer 1: HTTP Beacon ─────────────────────────────────────────────────────

function runLayer1() {
  section("LAYER 1 — HTTP Beacon  (pre-connection discovery)");

  print(`
${bold("How it works:")}
  An AI agent or web crawler fetches a well-known URL before ever opening
  an MCP connection. The response is a structured JSON document — the
  "beacon" — that tells the agent what the server does.

${bold("URL:")}  ${yellow("GET /.well-known/mcp-capabilities.json")}

${dim("If the server is running (npm run start:streamableHttp):")}
${dim("  curl http://localhost:3001/.well-known/mcp-capabilities.json | jq .server")}

${bold("Why this matters:")}
  • No MCP handshake required — the agent decides before connecting.
  • Mirrors established web conventions (robots.txt, sitemap.xml,
    OpenID /.well-known/openid-configuration).
  • LLM crawlers or registries can index thousands of servers this way.
`);

  const manifest = buildCapabilityManifest("http://localhost:3001");

  print(bold("Manifest (simulated fetch):"));
  print(dim("  server.name    : ") + manifest.server.name);
  print(dim("  server.version : ") + manifest.server.version);
  print(dim("  server.purpose :"));
  print(`    ${green(manifest.server.purpose)}`);
  print(dim("\n  server.bestFor:"));
  manifest.server.bestFor.forEach((b) => print(`    • ${b}`));
  print(dim("\n  server.notFor:"));
  manifest.server.notFor.forEach((n) => print(`    ✗ ${n}`));
  print(dim("\n  discovery.wellKnownUri : ") + manifest.discovery.wellKnownUri);
  print(dim("  discovery.transports   : ") + manifest.discovery.transports.map((t) => t.name).join(", "));
  print(dim("  tools registered       : ") + manifest.tools.length.toString());

  print(`
${bold("Agent decision:")}
  The agent reads ${green("server.bestFor")} and sees "Arithmetic (get-sum)" and
  "Async task workflows with progress". It decides: ${green("yes, connect here")}.
  It sees "Production workloads" in ${yellow("server.notFor")} and knows not to
  route critical traffic here.
`);
}

// ─── Layer 2: In-protocol resource beacon ────────────────────────────────────

function runLayer2() {
  section("LAYER 2 — In-Protocol Beacon  (mcp://capabilities resource)");

  print(`
${bold("How it works:")}
  After connecting, the agent lists resources and reads mcp://capabilities.
  It gets the same manifest — now delivered via the MCP protocol itself.

${bold("Agent code (pseudocode):")}
  ${dim("const resources = await client.listResources();")}
  ${dim('const cap = resources.find(r => r.uri === "mcp://capabilities");')}
  ${dim('const result = await client.readResource({ uri: "mcp://capabilities" });')}
  ${dim("const manifest = JSON.parse(result.contents[0].text);")}

${bold("Why this matters:")}
  • Works over any transport, not just HTTP.
  • Stdio agents (no HTTP access) can still discover the full manifest.
  • The resource is always listed first in resources/list — agents that
    scan for a capabilities resource will find it immediately.
`);

  const manifest = buildCapabilityManifest();

  print(bold("Sample tool entries from the manifest:"));
  for (const tool of manifest.tools.slice(0, 4)) {
    print(`\n  ${cyan(tool.name)}`);
    print(dim(`    tags      : `) + tool.tags.slice(0, 5).join(", "));
    print(dim(`    taskTypes : `) + tool.taskTypes.join(", "));
    print(dim(`    example   : `) + tool.exampleTasks[0]);
    print(dim(`    mcpFeature: `) + tool.mcpFeature);
  }
  print(`  ${dim("... and")} ${manifest.tools.length - 4} ${dim("more tools")}`);
}

// ─── Layer 3: Meta-tool beacon ────────────────────────────────────────────────

function runLayer3(tasks: string[]) {
  section("LAYER 3 — Meta-Tool Beacon  (suggest-tool)");

  print(`
${bold("How it works:")}
  The agent calls the ${cyan("suggest-tool")} MCP tool with its task description.
  The server scores every registered tool and returns ranked recommendations
  with confidence scores and reasoning — entirely inside the MCP protocol.

${bold("Agent call:")}
  ${dim('tools/call  suggest-tool  { "task": "<describe your goal>" }')}

${bold("Why this matters:")}
  • The agent doesn't need to parse documentation or hardcode tool names.
  • The server explains its own capabilities in response to real intent.
  • Confidence scores let the agent decide whether to proceed or ask for
    clarification.
  • This is the "inner beacon" — available after connecting via any transport.
`);

  for (const task of tasks) {
    print(`\n${bold("Task:")} "${magenta(task)}"`);
    const results = rankTools(task, 3);
    const maxScore = results[0]?.score ?? 0;

    if (maxScore === 0) {
      print(`  ${yellow("No strong match found.")} Consider rephrasing.`);
      continue;
    }

    results.forEach((r, i) => {
      const pct = Math.round((r.score / maxScore) * 100);
      const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
      print(`\n  ${i + 1}. ${cyan(r.tool.name)}  ${green(pct + "%")} [${bar}]`);
      print(dim(`     ${r.tool.description}`));
      print(dim(`     Matched on: `) + r.matchedOn.slice(0, 4).join(", "));
    });

    print(
      `\n  ${bold("→ Agent calls:")} ${green(results[0].tool.name)} ${dim("(highest confidence)")}`
    );
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function runSummary() {
  section("SUMMARY — How the Three Layers Form a Complete Beacon");

  print(`
The three layers work together like concentric rings:

  ${cyan("Ring 1 (outermost) — HTTP Beacon")}
    /.well-known/mcp-capabilities.json
    Accessible to web crawlers, registries, and agents without any MCP
    library. Lets an agent decide to connect before any network round-trip
    to the MCP protocol layer.

  ${cyan("Ring 2 (middle) — Resource Beacon")}
    mcp://capabilities  (read via resources/read)
    Reachable after connection, over any transport including stdio.
    Gives the full structured manifest inside the MCP protocol itself.

  ${cyan("Ring 3 (innermost) — Meta-Tool Beacon")}
    suggest-tool  (call via tools/call)
    Task-aware. The agent describes its intent in natural language and
    the server returns a scored, reasoned recommendation. This is the
    server "advertising itself" in response to the agent's specific need.

${bold("The beacon signal pattern:")}

  Agent                              MCP Everything Server
    │                                         │
    │──GET /.well-known/mcp-capabilities.json─▶│  Layer 1: decide to connect
    │◀─────── CapabilityManifest JSON ─────────│
    │                                         │
    │──── initialize (MCP handshake) ─────────▶│
    │◀─── initialized ─────────────────────────│
    │                                         │
    │──── resources/read mcp://capabilities ──▶│  Layer 2: read full manifest
    │◀─── CapabilityManifest JSON ─────────────│
    │                                         │
    │──── tools/call suggest-tool ────────────▶│  Layer 3: get ranked picks
    │       { task: "I need to compress..." }  │
    │◀─── ranked recommendations ──────────────│
    │                                         │
    │──── tools/call gzip-file-as-resource ───▶│  Execute the chosen tool
    │◀─── compressed file resource ────────────│

${bold("Key insight:")}
  All three beacon channels are driven by a single shared data source:
  ${cyan("src/everything/beacon/capability-manifest.ts")}
  Add a new tool there and all three beacons update automatically.
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const DEMO_TASKS = [
    "I need to add two numbers together",
    "compress a file and get it back as a resource",
    "run a long async task and watch the progress",
    "ask the user for their name",
    "show me what resources the server has",
    "what tools should I use to test connectivity",
  ];

  print(bold("\n╔══════════════════════════════════════════════════════════════════════╗"));
  print(bold("║          MCP Agent Discovery Simulation                              ║"));
  print(bold("║   How AI agents find and choose an MCP server for their tasks        ║"));
  print(bold("╚══════════════════════════════════════════════════════════════════════╝"));

  runLayer1();
  runLayer2();
  runLayer3(DEMO_TASKS);
  runSummary();
}

main();
