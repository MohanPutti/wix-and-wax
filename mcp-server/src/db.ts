import mysql from "mysql2/promise";
import { WRITE_TABLES, DELETE_TABLES, AUDIT_TABLE } from "./writable-tables.js";
import type { SessionIdentity } from "./identities.js";

const STATEMENT_TIMEOUT_MS = Number(process.env.MCP_STATEMENT_TIMEOUT_MS ?? 5000);
const DEFAULT_ROW_LIMIT = Number(process.env.MCP_DEFAULT_LIMIT ?? 1000);

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "mysql",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "mcp_readonly",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "wix_and_wax",
  connectionLimit: Number(process.env.DB_POOL_SIZE ?? 5),
  waitForConnections: true,
  dateStrings: true,
  decimalNumbers: false,
});

pool.on("connection", (conn) => {
  // The 'connection' event delivers a raw mysql2 Connection (not the promise wrapper),
  // so use the callback form here.
  (conn as unknown as { query: (sql: string, cb: (err: unknown) => void) => void }).query(
    `SET SESSION MAX_EXECUTION_TIME=${STATEMENT_TIMEOUT_MS}`,
    () => {}
  );
});

export async function closePool() {
  await pool.end();
}

const FORBIDDEN = /\b(insert|update|delete|drop|create|alter|truncate|replace|grant|revoke|rename|lock|unlock|handler|call|load|use|into\s+outfile|into\s+dumpfile)\b/i;

function stripSqlLiterals(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`[^`]*`/g, "``");
}

export function validateSelectSql(raw: string): { ok: true; sql: string } | { ok: false; error: string } {
  const trimmed = raw.trim().replace(/;+\s*$/g, "");
  if (!trimmed) return { ok: false, error: "Empty query" };

  const stripped = stripSqlLiterals(trimmed);

  if (stripped.includes(";")) {
    return { ok: false, error: "Multiple statements are not allowed" };
  }
  if (!/^\s*(select|with)\b/i.test(stripped)) {
    return { ok: false, error: "Only SELECT or WITH ... SELECT queries are allowed" };
  }
  if (FORBIDDEN.test(stripped)) {
    return { ok: false, error: "Query contains a forbidden keyword" };
  }

  const sql = /\blimit\s+\d+/i.test(stripped) ? trimmed : `${trimmed} LIMIT ${DEFAULT_ROW_LIMIT}`;
  return { ok: true, sql };
}

export async function runQuery(raw: string) {
  const validated = validateSelectSql(raw);
  if (!validated.ok) throw new Error(validated.error);

  const [rows, fields] = await pool.query(validated.sql);
  const columns = Array.isArray(fields)
    ? fields.map((f) => ({ name: f.name, type: f.type, table: f.table }))
    : [];
  return { sql: validated.sql, rows, columns };
}

export async function listTables() {
  const [rows] = await pool.query(
    `SELECT table_name AS name, table_rows AS approxRows
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
     ORDER BY table_name`
  );
  return rows;
}

export async function describeTable(name: string) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error("Invalid table name");
  }
  const [rows] = await pool.query(
    `SELECT column_name AS name,
            column_type AS type,
            is_nullable AS nullable,
            column_key AS \`key\`,
            column_default AS \`default\`,
            extra,
            column_comment AS comment
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ?
     ORDER BY ordinal_position`,
    [name]
  );
  return rows;
}

// ---------- Writes ----------

export type WriteOp = "INSERT" | "UPDATE" | "DELETE";

export type WriteValidation =
  | { ok: true; sql: string; op: WriteOp; table: string }
  | { ok: false; error: string };

const WRITE_FORBIDDEN = /\b(drop|create|alter|truncate|grant|revoke|rename|lock|unlock|handler|call|load|use|into\s+outfile|into\s+dumpfile)\b/i;

function extractTable(op: WriteOp, sql: string): string | null {
  let m: RegExpExecArray | null = null;
  if (op === "INSERT") {
    m = /^\s*insert\s+(?:(?:ignore|high_priority|low_priority|delayed)\s+)*(?:into\s+)?`?([A-Za-z0-9_]+)`?/i.exec(sql);
  } else if (op === "UPDATE") {
    m = /^\s*update\s+(?:(?:low_priority|ignore)\s+)*`?([A-Za-z0-9_]+)`?/i.exec(sql);
  } else {
    m = /^\s*delete\s+(?:(?:low_priority|quick|ignore)\s+)*from\s+`?([A-Za-z0-9_]+)`?/i.exec(sql);
  }
  return m?.[1] ?? null;
}

export function validateWriteSql(raw: string): WriteValidation {
  const trimmed = raw.trim().replace(/;+\s*$/g, "");
  if (!trimmed) return { ok: false, error: "Empty query" };

  const stripped = stripSqlLiterals(trimmed);
  if (stripped.includes(";")) return { ok: false, error: "Multiple statements are not allowed" };

  const opMatch = /^\s*(insert|update|delete)\b/i.exec(stripped);
  if (!opMatch) {
    return { ok: false, error: "Only INSERT, UPDATE, or DELETE statements are allowed here. Use run_sql for SELECT." };
  }
  const op = opMatch[1].toUpperCase() as WriteOp;

  if (WRITE_FORBIDDEN.test(stripped)) {
    return { ok: false, error: "Query contains a forbidden keyword (DDL / admin)" };
  }

  const table = extractTable(op, stripped);
  if (!table) return { ok: false, error: "Could not determine target table" };

  const allowed = op === "DELETE" ? DELETE_TABLES : WRITE_TABLES;
  if (!allowed.has(table)) {
    return { ok: false, error: `${op} on \`${table}\` is not allowed. Writable tables: ${[...WRITE_TABLES].join(", ")}. Deletable subset: ${[...DELETE_TABLES].join(", ")}.` };
  }

  if ((op === "UPDATE" || op === "DELETE") && !/\bwhere\b/i.test(stripped)) {
    return { ok: false, error: `${op} must include a WHERE clause` };
  }

  return { ok: true, sql: trimmed, op, table };
}

export interface WriteResult {
  sql: string;
  op: WriteOp;
  table: string;
  rowsAffected: number;
  insertId?: number | string;
}

export async function runWrite(raw: string, identity: Partial<SessionIdentity> & { sessionId?: string }): Promise<WriteResult> {
  const validated = validateWriteSql(raw);
  if (!validated.ok) throw new Error(validated.error);

  let rowsAffected = 0;
  let insertId: number | string | undefined;
  let errorMessage: string | undefined;

  try {
    const [result] = await pool.query(validated.sql);
    const r = result as { affectedRows?: number; insertId?: number | string };
    rowsAffected = r.affectedRows ?? 0;
    insertId = r.insertId;
    return { sql: validated.sql, op: validated.op, table: validated.table, rowsAffected, insertId };
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    try {
      await pool.query(
        `INSERT INTO ${AUDIT_TABLE} (session_id, token_prefix, operation, target_table, sql_text, rows_affected, error) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          identity.sessionId ?? null,
          identity.tokenPrefix ?? null,
          validated.op,
          validated.table,
          validated.sql,
          rowsAffected,
          errorMessage ?? null,
        ]
      );
    } catch (logErr) {
      console.error("[mcp] audit log insert failed:", logErr instanceof Error ? logErr.message : logErr);
    }
  }
}
