export const WRITE_TABLES: ReadonlySet<string> = new Set([
  // Orders / fulfillment
  "orders",
  "order_items",
  "order_events",
  "fulfillments",
  "fulfillment_items",
  // Inventory
  "inventory_categories",
  "inventory_types",
  "inventory_entries",
  // Expenses
  "expense_types",
  "expenses",
]);

export const DELETE_TABLES: ReadonlySet<string> = new Set([
  "inventory_categories",
  "inventory_types",
  "inventory_entries",
  "expense_types",
  "expenses",
]);

export const AUDIT_TABLE = "mcp_audit_log";
