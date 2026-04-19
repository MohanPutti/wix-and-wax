import "dotenv/config";
import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { requireBearerToken } from "./auth.js";
import { closePool } from "./db.js";
import { registerTools } from "./tools.js";
import { clearIdentity, setIdentity } from "./identities.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", requireBearerToken, async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    if (sessionId || !isInitializeRequest(req.body)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: invalid or missing session" },
        id: null,
      });
      return;
    }

    const tokenPrefix = req.mcpTokenPrefix ?? "unknown";
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports.set(id, transport!);
        setIdentity(id, { tokenPrefix });
      },
    });
    transport.onclose = () => {
      const sid = transport?.sessionId;
      if (sid) {
        transports.delete(sid);
        clearIdentity(sid);
      }
    };

    const server = new McpServer({ name: "wix-and-wax-mcp", version: "0.1.0" });
    registerTools(server);
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});

async function handleSessionRequest(req: Request, res: Response) {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = sessionId ? transports.get(sessionId) : undefined;
  if (!transport) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transport.handleRequest(req, res);
}

app.get("/mcp", requireBearerToken, handleSessionRequest);
app.delete("/mcp", requireBearerToken, handleSessionRequest);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", sessions: transports.size });
});

const port = Number(process.env.PORT ?? 3100);
const server = app.listen(port, () => {
  console.log(`[mcp] listening on :${port}`);
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`[mcp] received ${signal}, shutting down`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  });
}
