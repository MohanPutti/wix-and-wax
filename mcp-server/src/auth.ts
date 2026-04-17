import type { Request, Response, NextFunction } from "express";

const tokens = (process.env.MCP_TOKENS ?? "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

if (tokens.length === 0) {
  throw new Error("MCP_TOKENS must be set (comma-separated bearer tokens)");
}

export function requireBearerToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!tokens.includes(token)) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  next();
}
