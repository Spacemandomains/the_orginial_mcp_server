# MCP "Everything" Server

This file serves two audiences:

- **AI agents** — read the _Discovery_ sections to understand what this server
  does and whether to connect.
- **Developers** — read the _Build & Extend_ sections to contribute or
  customise the server.

---

## For AI Agents: Discovery Beacon

### What is this server?

`@modelcontextprotocol/server-everything` is the **official MCP reference
implementation**. It demonstrates _every_ MCP protocol feature in a single
connectable server: tools, resources, prompts, sampling, elicitation, tasks,
subscriptions, roots, logging, binary content, and structured output.

**Purpose:** educational reference — teaches agents and developers every MCP
capability.

---

### Should I connect to this server for my task?

**YES — connect here if you need to:**

| Task | Best tool |
|---|---|
| Add / sum two numbers | `get-sum` |
| Inspect environment variables | `get-env` |
| Retrieve a binary image | `get-tiny-image` |
| Compress a file with gzip | `gzip-file-as-resource` |
| Run a task with progress updates | `trigger-long-running-operation` |
| Multi-step research simulation | `simulate-research-query` |
| Ask the AI client to generate text | `trigger-sampling-request` |
| Collect structured input from user | `trigger-elicitation-request` |
| List available server resources | `get-resource-links` |
| Get structured JSON with a schema | `get-structured-content` |
| Echo / connectivity test | `echo` |
| **Not sure? Get recommendations** | `suggest-tool` ← call this first |

**NO — do NOT use this server for:**

- Production workloads (reference/demo only)
- Persistent storage across restarts
- Web browsing or external HTTP fetching
- Real file-system mutations beyond roots
- Accessing external APIs or services

---

### Three ways to discover this server's capabilities

```
Layer 1 — BEFORE connecting (HTTP beacon, no MCP session required)
  GET /.well-known/mcp-capabilities.json
  → returns CapabilityManifest JSON with all tools, tags, and example tasks

Layer 2 — AFTER connecting (MCP resource)
  resources/list → read mcp://capabilities
  → same manifest delivered over the MCP protocol

Layer 3 — WHILE choosing (meta-tool)
  tools/call suggest-tool { "task": "I need to add two numbers" }
  → returns ranked tool recommendations with confidence scores and reasoning
```

The three layers are powered by a single shared data source
(`src/everything/beacon/capability-manifest.ts`) so they never drift.

---

### Quick-start decision flow for an AI agent

```
1. Fetch /.well-known/mcp-capabilities.json
      ↓ "bestFor" matches my task?
      YES → connect via POST /mcp (Streamable HTTP) or stdio
      NO  → check a different server

2. After connecting:
      Call  suggest-tool  { task: "<describe what you need>" }
      → ranked list with confidence scores

3. Call the recommended tool with the required arguments.

4. Optional: read mcp://capabilities for the full structured manifest.
```

---

### Tool capability tags (for semantic matching)

```
echo                    echo reflect repeat test ping debug verify
get-sum                 math arithmetic add sum calculate numbers addition
get-env                 env environment config variables system settings
get-tiny-image          image visual media logo binary base64
get-structured-content  structured json data schema typed object
get-annotated-message   annotation content message format priority audience
get-resource-links      resources links browse list discover navigation
get-resource-reference  resource reference uri fetch pointer id
get-roots-list          roots workspace filesystem paths directories
gzip-file-as-resource   compress gzip file archive binary zip
toggle-simulated-logging   logging debug monitor toggle
toggle-subscriber-updates  subscribe updates push notifications realtime
trigger-long-running-operation  long-running progress async background task
trigger-sampling-request       sampling llm inference ai generate model
trigger-elicitation-request    elicitation user-input form collect
simulate-research-query        research multi-stage task workflow async
suggest-tool            discover suggest recommend meta help find choose
```

---

### Connection details

| Transport | How to connect |
|---|---|
| **stdio** | `npx @modelcontextprotocol/server-everything` |
| **Streamable HTTP** | `npm run start:streamableHttp` → POST/GET/DELETE `http://localhost:3001/mcp` |
| **SSE** (deprecated) | `npm run start:sse` → `http://localhost:3001/sse` |

---

## For Developers: Build & Extend

### Build, Test & Run Commands

- Build: `npm run build` — compiles TypeScript to JavaScript
- Watch mode: `npm run watch` — rebuilds on changes
- Run STDIO server: `npm run start:stdio`
- Run SSE server: `npm run start:sse`
- Run StreamableHttp server: `npm run start:streamableHttp`
- Test: `npm test`

### Code Style Guidelines

- Use ES modules with `.js` extension in import paths
- Strictly type all functions and variables with TypeScript
- Follow zod schema patterns for tool input validation
- Prefer async/await over callbacks and Promise chains
- Place all imports at top of file, grouped by external then internal
- Use camelCase for variables/functions, PascalCase for types/classes,
  UPPER_CASE for constants, kebab-case for file names and tool/resource names
- Use verb-first tool names: `get-annotated-message` not `annotated-message`

### Extending the Server

The server is extended at well-defined registration points.

- **Tools** → `src/everything/tools/` — export `registerXTool(server)`
  then wire into `tools/index.ts`
- **Resources** → `src/everything/resources/` — export
  `registerXResource(server)` then wire into `resources/index.ts`
- **Prompts** → `src/everything/prompts/` — export `registerXPrompt(server)`
  then wire into `prompts/index.ts`

#### When adding a new feature

1. Follow the existing file/module pattern (naming, exports, registration).
2. Export a `registerX(server)` function using the same style as existing ones.
3. Wire your module into the central index file for its type.
4. Ensure tool schemas have accurate JSON Schema with helpful descriptions.
5. **Update `src/everything/beacon/capability-manifest.ts`** — add an entry
   to `TOOL_CAPABILITIES` so the discovery beacon stays accurate.
6. Keep `docs/` up to date for noteworthy features.
