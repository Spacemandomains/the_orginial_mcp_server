import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { buildCapabilityManifest } from "../beacon/capability-manifest.js";

/**
 * Registers the mcp://capabilities resource — the in-protocol beacon.
 *
 * An agent that has already connected via MCP can read this resource to get
 * the full structured capability manifest: what the server does, every tool
 * with semantic tags and example tasks, every resource and prompt, and
 * guidance on when NOT to use this server.
 *
 * Discovery path: connect → resources/list → read mcp://capabilities
 */
export const registerCapabilitiesResource = (server: McpServer) => {
  server.registerResource(
    "mcp-capabilities",
    "mcp://capabilities",
    {
      description:
        "Machine-readable beacon for this MCP server. Lists every tool, resource, and prompt with semantic tags, example tasks, confidence hints, and connection details. Read this resource first to understand what the server offers before deciding which tools to call.",
      mimeType: "application/json",
    },
    async () => {
      const manifest = buildCapabilityManifest();
      return {
        contents: [
          {
            uri: "mcp://capabilities",
            mimeType: "application/json",
            text: JSON.stringify(manifest, null, 2),
          },
        ],
      };
    }
  );
};
