/**
 * Capability Manifest — the single source of truth for what this server can do.
 *
 * This data is served via three independent discovery channels so that an AI agent
 * can find and evaluate this server at any stage of its decision loop:
 *
 *   1. BEFORE connecting  → GET /.well-known/mcp-capabilities.json  (HTTP beacon)
 *   2. AFTER connecting   → read resource mcp://capabilities          (MCP resource)
 *   3. WHILE choosing     → call tool `suggest-tool`                  (meta-tool)
 *
 * The three channels all pull from the same structured data below so they
 * never drift out of sync.
 */

export interface ToolCapability {
  name: string;
  title: string;
  description: string;
  /** Semantic keywords an agent can match against its task description. */
  tags: string[];
  /** Higher-level task categories this tool belongs to. */
  taskTypes: string[];
  /** Concrete example queries this tool can satisfy. */
  exampleTasks: string[];
  /** Which MCP protocol feature this tool primarily demonstrates. */
  mcpFeature: string;
}

export interface ResourceCapability {
  uri: string;
  description: string;
  tags: string[];
}

export interface PromptCapability {
  name: string;
  description: string;
  tags: string[];
}

export interface CapabilityManifest {
  /** $schema lets agents know this is a structured capability beacon. */
  $schema: string;
  server: {
    name: string;
    version: string;
    description: string;
    /** One-line purpose statement — the "elevator pitch" for LLM agents. */
    purpose: string;
    bestFor: string[];
    notFor: string[];
    mcpFeatures: string[];
  };
  tools: ToolCapability[];
  resources: ResourceCapability[];
  prompts: PromptCapability[];
  discovery: {
    protocol: string;
    transports: { name: string; endpoint?: string }[];
    /** The canonical URL agents should fetch for this manifest. */
    wellKnownUri: string;
    beaconVersion: string;
    /** URL of the AGENTS.md file for human- and agent-readable docs. */
    agentsFileUrl: string;
  };
  meta: {
    generatedAt: string;
    schemaVersion: string;
  };
}

export const TOOL_CAPABILITIES: ToolCapability[] = [
  {
    name: "echo",
    title: "Echo Tool",
    description: "Echoes back the input string unchanged.",
    tags: ["echo", "reflect", "repeat", "test", "ping", "debug", "verify"],
    taskTypes: ["testing", "debugging", "connectivity-check"],
    exampleTasks: [
      "Test if the server is responding",
      "Echo back a message to confirm connectivity",
      "Debug by repeating a value back",
    ],
    mcpFeature: "basic-tool",
  },
  {
    name: "get-sum",
    title: "Get Sum Tool",
    description: "Returns the sum of two numbers.",
    tags: ["math", "arithmetic", "add", "sum", "calculate", "numbers", "addition", "plus"],
    taskTypes: ["calculation", "math", "arithmetic"],
    exampleTasks: [
      "Add two numbers together",
      "Calculate the sum of 5 and 7",
      "Perform arithmetic addition",
      "What is 12 plus 30?",
    ],
    mcpFeature: "basic-tool",
  },
  {
    name: "get-env",
    title: "Print Environment Tool",
    description: "Returns the current process environment variables.",
    tags: ["env", "environment", "config", "variables", "system", "settings", "runtime"],
    taskTypes: ["inspection", "configuration", "system-info"],
    exampleTasks: [
      "What environment variables are set?",
      "Check the current system configuration",
      "Inspect runtime environment settings",
    ],
    mcpFeature: "tool-with-system-access",
  },
  {
    name: "get-tiny-image",
    title: "Get Tiny Image Tool",
    description: "Returns a tiny MCP logo image as base64-encoded binary content.",
    tags: ["image", "visual", "media", "logo", "binary", "base64", "picture", "icon"],
    taskTypes: ["media", "image-retrieval", "binary-content"],
    exampleTasks: [
      "Get an image from the server",
      "Fetch a logo or icon",
      "Retrieve binary image content",
      "Show me a picture",
    ],
    mcpFeature: "binary-content",
  },
  {
    name: "get-structured-content",
    title: "Get Structured Content Tool",
    description: "Returns typed JSON data paired with a JSON Schema — demonstrates structured output.",
    tags: ["structured", "json", "data", "schema", "typed", "object", "format"],
    taskTypes: ["data-retrieval", "structured-data", "schema-validation"],
    exampleTasks: [
      "Get structured JSON data from the server",
      "Fetch data with a defined schema",
      "Retrieve typed content as an object",
    ],
    mcpFeature: "structured-output",
  },
  {
    name: "get-annotated-message",
    title: "Get Annotated Message Tool",
    description: "Returns text content tagged with MCP audience and priority annotations.",
    tags: ["annotation", "content", "message", "format", "priority", "audience", "metadata"],
    taskTypes: ["content-formatting", "annotation", "metadata-tagging"],
    exampleTasks: [
      "Get a message with content annotations",
      "Fetch content with priority or audience hints",
      "Retrieve annotated text for a specific audience",
    ],
    mcpFeature: "content-annotations",
  },
  {
    name: "get-resource-links",
    title: "Get Resource Links Tool",
    description: "Returns embedded links to available server resources — useful for resource navigation.",
    tags: ["resources", "links", "browse", "list", "discover", "navigation", "index"],
    taskTypes: ["discovery", "navigation", "resource-listing"],
    exampleTasks: [
      "List available resources on this server",
      "Browse what data the server has",
      "Get links to server resources",
      "Show me what resources exist",
    ],
    mcpFeature: "resource-links",
  },
  {
    name: "get-resource-reference",
    title: "Get Resource Reference Tool",
    description: "Returns a resource reference URI for client-side fetching by ID.",
    tags: ["resource", "reference", "uri", "fetch", "pointer", "id", "link"],
    taskTypes: ["resource-access", "reference-generation", "uri-lookup"],
    exampleTasks: [
      "Get a reference to a specific resource by ID",
      "Obtain a URI to fetch resource content",
      "Point to resource number 5",
    ],
    mcpFeature: "resource-references",
  },
  {
    name: "get-roots-list",
    title: "Get Roots List Tool",
    description: "Returns the workspace root directories shared by the connected MCP client.",
    tags: ["roots", "workspace", "filesystem", "paths", "directories", "client"],
    taskTypes: ["workspace-inspection", "filesystem", "roots-protocol"],
    exampleTasks: [
      "What workspace directories are available?",
      "List the shared filesystem roots",
      "Show the paths the client has shared",
    ],
    mcpFeature: "roots-protocol",
  },
  {
    name: "gzip-file-as-resource",
    title: "GZip File as Resource Tool",
    description: "Compresses a named file with gzip and returns it as a binary blob resource.",
    tags: ["compress", "gzip", "file", "archive", "binary", "zip", "deflate"],
    taskTypes: ["compression", "file-processing", "archiving"],
    exampleTasks: [
      "Compress a file using gzip",
      "Create a gzipped archive of a file",
      "Return a file as compressed binary content",
    ],
    mcpFeature: "binary-resources",
  },
  {
    name: "toggle-simulated-logging",
    title: "Toggle Simulated Logging",
    description: "Turns randomized server-side log message generation on or off.",
    tags: ["logging", "debug", "monitor", "toggle", "logs", "output"],
    taskTypes: ["debugging", "monitoring", "logging-control"],
    exampleTasks: [
      "Start generating log messages",
      "Turn on server logging",
      "Enable debug log output",
      "Stop the log stream",
    ],
    mcpFeature: "server-logging",
  },
  {
    name: "toggle-subscriber-updates",
    title: "Toggle Subscriber Updates",
    description: "Turns simulated resource-subscription change notifications on or off.",
    tags: ["subscribe", "updates", "push", "notifications", "resources", "realtime", "watch"],
    taskTypes: ["subscriptions", "real-time", "notification-control"],
    exampleTasks: [
      "Start receiving resource change notifications",
      "Enable push updates for subscriptions",
      "Toggle live resource update events",
    ],
    mcpFeature: "resource-subscriptions",
  },
  {
    name: "trigger-long-running-operation",
    title: "Trigger Long Running Operation Tool",
    description: "Runs a simulated long task and emits incremental progress notifications.",
    tags: ["long-running", "progress", "async", "background", "task", "wait", "slow"],
    taskTypes: ["async-operations", "progress-tracking", "background-jobs"],
    exampleTasks: [
      "Run a task with progress updates",
      "Demonstrate an async operation with progress reporting",
      "Show a long-running background job with status",
    ],
    mcpFeature: "progress-notifications",
  },
  {
    name: "trigger-sampling-request",
    title: "Trigger Sampling Request Tool",
    description: "Asks the connected LLM client to perform inference — demonstrates server-initiated sampling.",
    tags: ["sampling", "llm", "inference", "ai", "generate", "model", "completion"],
    taskTypes: ["ai-generation", "server-initiated-llm", "sampling"],
    exampleTasks: [
      "Ask the AI client to generate text",
      "Request LLM inference from the server side",
      "Demonstrate server-to-client sampling",
    ],
    mcpFeature: "server-initiated-sampling",
  },
  {
    name: "trigger-elicitation-request",
    title: "Trigger Elicitation Request Tool",
    description: "Asks the connected client to collect structured input from the human user.",
    tags: ["elicitation", "user-input", "form", "collect", "interactive", "prompt", "ask"],
    taskTypes: ["user-interaction", "input-collection", "form-filling"],
    exampleTasks: [
      "Ask the user for their name",
      "Collect structured input from a human",
      "Request user confirmation or form data",
    ],
    mcpFeature: "elicitation",
  },
  {
    name: "simulate-research-query",
    title: "Simulate Research Query",
    description: "Runs a multi-stage research workflow with elicitation and tasks API lifecycle management.",
    tags: ["research", "multi-stage", "task", "query", "workflow", "async", "stages"],
    taskTypes: ["research", "complex-workflow", "multi-step-task", "task-management"],
    exampleTasks: [
      "Run a simulated research query with multiple stages",
      "Demonstrate the MCP tasks API with progress",
      "Show a multi-step async workflow with user clarification",
    ],
    mcpFeature: "tasks-api",
  },
  {
    name: "suggest-tool",
    title: "Suggest Tool",
    description:
      "Given a task description, scores all available tools and returns ranked recommendations with confidence and reasoning. Call this first if you are unsure which tool to use.",
    tags: ["discover", "suggest", "recommend", "meta", "help", "find", "select", "choose", "pick"],
    taskTypes: ["tool-discovery", "navigation", "self-describing", "meta"],
    exampleTasks: [
      "Which tool should I use to add numbers?",
      "Help me find the right tool for my task",
      "What can this server do for me?",
      "Recommend a tool for compressing files",
    ],
    mcpFeature: "self-describing",
  },
];

export const RESOURCE_CAPABILITIES: ResourceCapability[] = [
  {
    uri: "mcp://capabilities",
    description:
      "Full capability manifest for this server — the machine-readable beacon. Describes every tool, resource, and prompt with tags and example tasks. Agents should read this resource to understand the server before deciding which tools to call.",
    tags: ["discovery", "capabilities", "manifest", "beacon", "index", "meta"],
  },
  {
    uri: "test://static/resource/{id}",
    description:
      "Template resource — returns text or binary blob content for a given numeric ID. Odd IDs return text; even IDs return binary blobs.",
    tags: ["resource", "template", "test", "content", "blob", "text"],
  },
];

export const PROMPT_CAPABILITIES: PromptCapability[] = [
  {
    name: "simple-prompt",
    description:
      "A basic prompt with an optional argument demonstrating the MCP prompts feature.",
    tags: ["prompt", "basic", "demo", "simple"],
  },
  {
    name: "complex-prompt",
    description:
      "A prompt with multiple typed arguments, showing prompt templating and argument handling.",
    tags: ["prompt", "complex", "template", "arguments", "typed"],
  },
];

/**
 * Builds the full capability manifest, optionally embedding the server's
 * base URL so that discovery endpoints are fully qualified.
 */
export function buildCapabilityManifest(baseUrl?: string): CapabilityManifest {
  const base = baseUrl ?? "";
  return {
    $schema: "https://modelcontextprotocol.io/schemas/capability-manifest/v1.json",
    server: {
      name: "@modelcontextprotocol/server-everything",
      version: "2.0.0",
      description:
        "MCP reference server demonstrating every MCP protocol feature: tools, resources, prompts, sampling, elicitation, tasks, subscriptions, roots, logging, binary content, structured output, and content annotations.",
      purpose:
        "Educational reference implementation — teaches AI agents and developers every MCP capability in a single connectable server",
      bestFor: [
        "Learning and testing every MCP protocol feature",
        "Evaluating MCP client implementations",
        "Arithmetic (get-sum)",
        "Environment/system inspection (get-env)",
        "Binary image retrieval (get-tiny-image)",
        "File compression (gzip-file-as-resource)",
        "Async task workflows with progress (trigger-long-running-operation)",
        "Multi-step research simulations (simulate-research-query)",
        "Server-initiated LLM sampling (trigger-sampling-request)",
        "User input collection (trigger-elicitation-request)",
        "Resource discovery and navigation (get-resource-links, suggest-tool)",
      ],
      notFor: [
        "Production workloads — this is a reference/demo server",
        "Persistent storage across restarts",
        "Web browsing or external HTTP fetching",
        "Real file-system mutations beyond session scope",
        "Accessing external APIs or services",
      ],
      mcpFeatures: [
        "tools",
        "resources",
        "prompts",
        "sampling",
        "elicitation",
        "tasks",
        "subscriptions",
        "roots",
        "logging",
        "binary-content",
        "structured-output",
        "content-annotations",
        "progress-notifications",
        "resource-links",
        "resource-references",
        "self-describing",
      ],
    },
    tools: TOOL_CAPABILITIES,
    resources: RESOURCE_CAPABILITIES,
    prompts: PROMPT_CAPABILITIES,
    discovery: {
      protocol: "mcp",
      transports: [
        { name: "stdio" },
        { name: "sse", endpoint: base ? `${base}/sse` : "/sse" },
        { name: "streamableHttp", endpoint: base ? `${base}/mcp` : "/mcp" },
      ],
      wellKnownUri: base
        ? `${base}/.well-known/mcp-capabilities.json`
        : "/.well-known/mcp-capabilities.json",
      beaconVersion: "1.0",
      agentsFileUrl: base ? `${base}/AGENTS.md` : "/AGENTS.md",
    },
    meta: {
      generatedAt: new Date().toISOString(),
      schemaVersion: "1.0",
    },
  };
}
