import mysql from "mysql2/promise";

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
  conn.query(`SET SESSION MAX_EXECUTION_TIME=${STATEMENT_TIMEOUT_MS}`).catch(() => {
    // ignore — best-effort; falls back to app-level checks
  });
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
