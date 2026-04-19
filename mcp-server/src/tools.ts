import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { runQuery, listTables, describeTable, runWrite } from "./db.js";
import { WRITE_TABLES, DELETE_TABLES } from "./writable-tables.js";
import { getIdentity } from "./identities.js";

const SCHEMA_HINT = `
Wicks and Wax database (MySQL 8). All tables use snake_case.

Commerce tables: products, product_variants, product_images, product_categories, categories,
  product_bases, fragrances, colors, packaging, customisations.
Orders: orders, order_items, order_events, fulfillments, fulfillment_items.
Payments: payments, refunds, payment_providers.
Users: users, roles, permissions, user_roles, role_permissions, sessions, addresses.
Inventory: inventory_categories, inventory_types, inventory_entries.
Expenses: expense_types, expenses.
Misc: discounts, discount_conditions, notifications, notification_templates, regions,
  countries, currencies, webhooks, webhook_events.

Key patterns:
- Order.total is the final paid amount; Order.status is fulfillment flow; Order.paymentStatus is payment state.
- ProductVariant.price = selling price, ProductVariant.comparePrice = MRP, ProductVariant.quantity = stock.
- Product.metadata is JSON with { fragrances, colors, packaging, *Mode } — use JSON_EXTRACT.
- ProductVariant.options is JSON with { base, size } — use JSON_EXTRACT(options, '$.base').
- Money columns are DECIMAL(10,2) and return as strings (driver config).
- Timestamps are returned as strings (dateStrings=true).

All queries are SELECT-only. Missing LIMIT is auto-capped to 1000.
`.trim();

export function registerTools(server: McpServer) {
  server.registerTool(
    "run_sql",
    {
      title: "Run read-only SQL",
      description:
        "Execute a single SELECT (or WITH ... SELECT) query against the Wicks and Wax production MySQL database. " +
        "Write statements and multi-statement queries are rejected. " +
        "If no LIMIT is specified, one is added automatically. " +
        "Use list_tables and describe_table first if you don't know the schema.\n\n" +
        SCHEMA_HINT,
      inputSchema: {
        sql: z
          .string()
          .min(1)
          .describe("A single SELECT or WITH ... SELECT statement. No trailing statements."),
      },
    },
    async ({ sql }) => {
      const result = await runQuery(sql);
      const rowCount = Array.isArray(result.rows) ? result.rows.length : 0;
      return {
        content: [
          {
            type: "text",
            text: `Executed:\n${result.sql}\n\nRows returned: ${rowCount}\n\n${JSON.stringify(
              result.rows,
              null,
              2
            )}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "list_tables",
    {
      title: "List tables",
      description:
        "List every table in the Wicks and Wax database with approximate row counts. " +
        "Use this to discover what tables exist before writing a query.",
      inputSchema: {},
    },
    async () => {
      const tables = await listTables();
      return { content: [{ type: "text", text: JSON.stringify(tables, null, 2) }] };
    }
  );

  server.registerTool(
    "describe_table",
    {
      title: "Describe a table",
      description:
        "Return columns, data types, nullability, keys, defaults, and comments for a single table.",
      inputSchema: {
        table: z
          .string()
          .regex(/^[A-Za-z0-9_]+$/)
          .describe("Table name — snake_case, matches the @@map name in the Prisma schema."),
      },
    },
    async ({ table }) => {
      const cols = await describeTable(table);
      return { content: [{ type: "text", text: JSON.stringify(cols, null, 2) }] };
    }
  );

  server.registerTool(
    "write_sql",
    {
      title: "Run a write (INSERT / UPDATE / DELETE)",
      description:
        "Execute a single INSERT, UPDATE, or DELETE against the allowlisted tables. " +
        "UPDATE and DELETE require a WHERE clause. Multi-statement queries are rejected. " +
        "Every write is logged to mcp_audit_log with the session id and a token prefix. " +
        "Use run_sql (SELECT) to confirm the rows you plan to affect before writing.\n\n" +
        `Writable tables (INSERT / UPDATE): ${[...WRITE_TABLES].join(", ")}.\n` +
        `Deletable subset (DELETE): ${[...DELETE_TABLES].join(", ")}.\n` +
        "DDL (DROP, ALTER, TRUNCATE, etc.) is rejected at both the app and DB layers.",
      inputSchema: {
        sql: z
          .string()
          .min(1)
          .describe("A single INSERT, UPDATE, or DELETE statement. UPDATE / DELETE must have WHERE."),
      },
    },
    async ({ sql }, extra) => {
      const sessionId = extra?.sessionId;
      const identity = getIdentity(sessionId);
      const result = await runWrite(sql, {
        sessionId,
        tokenPrefix: identity?.tokenPrefix,
      });
      return {
        content: [
          {
            type: "text",
            text:
              `${result.op} on \`${result.table}\` — rows affected: ${result.rowsAffected}` +
              (result.insertId ? `, insertId: ${result.insertId}` : "") +
              `\n\n${result.sql}`,
          },
        ],
      };
    }
  );
}
