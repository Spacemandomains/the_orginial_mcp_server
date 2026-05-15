import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_CAPABILITIES, ToolCapability } from "../beacon/capability-manifest.js";

const SuggestToolSchema = z.object({
  task: z
    .string()
    .describe(
      "Describe the task you want to accomplish. Be specific — the more detail you provide, the better the recommendations."
    ),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .default(3)
    .describe("Maximum number of tool recommendations to return (default: 3, max: 10)"),
});

const name = "suggest-tool";
const config = {
  title: "Suggest Tool",
  description:
    "Given a task description, analyzes all tools registered on this server and returns ranked recommendations with confidence scores and reasoning. Call this first when you are unsure which tool to use — it is the server's self-describing beacon from inside the protocol.",
  inputSchema: SuggestToolSchema,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
  },
};

interface ScoredTool {
  tool: ToolCapability;
  score: number;
  matchedOn: string[];
}

/** Split text into lowercase tokens, stripping punctuation and short words. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,._\-/\\()\[\]{}]+/)
    .filter((w) => w.length > 2);
}

/** Returns true if two tokens are close enough to count as a match. */
function tokensOverlap(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

function scoreToolForTask(tool: ToolCapability, taskTokens: string[]): ScoredTool {
  const matchedOn: string[] = [];
  let score = 0;

  // Name / title tokens  (weight 5 — strongest signal: agent typed the tool name)
  const nameTokens = tokenize(`${tool.name} ${tool.title}`);
  for (const nt of nameTokens) {
    if (taskTokens.some((t) => tokensOverlap(t, nt))) {
      score += 5;
      matchedOn.push(`name:${nt}`);
    }
  }

  // Task-type tokens  (weight 4 — agent described a category of work)
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

  // Semantic tag matches  (weight 3 — keyword signal)
  for (const tag of tool.tags) {
    if (taskTokens.some((t) => tokensOverlap(t, tag))) {
      score += 3;
      matchedOn.push(`tag:${tag}`);
    }
  }

  // Example-task overlap  (weight 1 per word, only when ≥ 2 words match)
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

export const registerSuggestTool = (server: McpServer) => {
  server.registerTool(name, config, async (args): Promise<CallToolResult> => {
    const { task, maxResults } = SuggestToolSchema.parse(args);
    const taskTokens = tokenize(task);

    const scored: ScoredTool[] = TOOL_CAPABILITIES.map((tool) =>
      scoreToolForTask(tool, taskTokens)
    ).sort((a, b) => b.score - a.score);

    const topResults = scored.slice(0, maxResults);
    const maxScore = scored[0]?.score ?? 0;

    const lines: string[] = [
      `# Tool Recommendations`,
      ``,
      `**Task:** "${task}"`,
      `**Analyzed:** ${TOOL_CAPABILITIES.length} tools  |  **Showing:** top ${topResults.length}`,
      ``,
    ];

    if (maxScore === 0) {
      lines.push(
        `No strong matches found for that task description.`,
        ``,
        `**Suggestions:**`,
        `- Try rephrasing with more specific keywords (e.g. "add numbers", "compress file", "long-running task")`,
        `- Call \`get-resource-links\` to browse available resources`,
        `- Read the \`mcp://capabilities\` resource for the full capability manifest`,
      );
    } else {
      for (let i = 0; i < topResults.length; i++) {
        const { tool, score, matchedOn } = topResults[i];
        const confidence = Math.round((score / maxScore) * 100);
        const bar = "█".repeat(Math.round(confidence / 10)) + "░".repeat(10 - Math.round(confidence / 10));

        lines.push(`## ${i + 1}. \`${tool.name}\` — ${confidence}% [${bar}]`);
        lines.push(`**${tool.title}**`);
        lines.push(`${tool.description}`);
        lines.push(``);
        lines.push(`| | |`);
        lines.push(`|---|---|`);
        lines.push(`| MCP feature | \`${tool.mcpFeature}\` |`);
        lines.push(`| Matched on | ${matchedOn.slice(0, 5).join(", ")} |`);
        lines.push(`| Example task | ${tool.exampleTasks[0]} |`);
        lines.push(``);
      }

      lines.push(`---`);
      lines.push(
        `**Next step:** Call \`${topResults[0].tool.name}\` — or read the \`mcp://capabilities\` resource for the complete server capability manifest.`
      );
    }

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  });
};
