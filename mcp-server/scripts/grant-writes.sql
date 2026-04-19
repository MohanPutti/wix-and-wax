-- Run on the production MySQL as root after mcp-server is already running
-- in read-only mode. This:
--   1. Renames mcp_readonly → mcp_rw (password unchanged).
--   2. Adds INSERT / UPDATE grants on orders, inventory, expense tables.
--   3. Adds DELETE grants on the inventory + expense subset.
--   4. Creates the mcp_audit_log table and grants INSERT on it.
--
-- Usage:
--   docker exec -i wix-and-wax-mysql mysql -uroot -prootpass123 \
--     < mcp-server/scripts/grant-writes.sql
--
-- Remember to also update DB_USER=mcp_rw in mcp-server/.env.production
-- and restart the mcp container.

RENAME USER 'mcp_readonly'@'%' TO 'mcp_rw'@'%';

-- Orders / fulfillment
GRANT INSERT, UPDATE ON wix_and_wax.orders             TO 'mcp_rw'@'%';
GRANT INSERT, UPDATE ON wix_and_wax.order_items        TO 'mcp_rw'@'%';
GRANT INSERT, UPDATE ON wix_and_wax.order_events       TO 'mcp_rw'@'%';
GRANT INSERT, UPDATE ON wix_and_wax.fulfillments       TO 'mcp_rw'@'%';
GRANT INSERT, UPDATE ON wix_and_wax.fulfillment_items  TO 'mcp_rw'@'%';

-- Inventory (writes + deletes)
GRANT INSERT, UPDATE, DELETE ON wix_and_wax.inventory_categories TO 'mcp_rw'@'%';
GRANT INSERT, UPDATE, DELETE ON wix_and_wax.inventory_types      TO 'mcp_rw'@'%';
GRANT INSERT, UPDATE, DELETE ON wix_and_wax.inventory_entries    TO 'mcp_rw'@'%';

-- Expenses (writes + deletes)
GRANT INSERT, UPDATE, DELETE ON wix_and_wax.expense_types TO 'mcp_rw'@'%';
GRANT INSERT, UPDATE, DELETE ON wix_and_wax.expenses      TO 'mcp_rw'@'%';

-- Audit log table — created as root so mcp_rw only gets INSERT/SELECT
CREATE TABLE IF NOT EXISTS wix_and_wax.mcp_audit_log (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id     VARCHAR(64)  NULL,
  token_prefix   VARCHAR(16)  NULL,
  operation      VARCHAR(16)  NOT NULL,
  target_table   VARCHAR(64)  NOT NULL,
  sql_text       TEXT         NOT NULL,
  rows_affected  INT          DEFAULT 0,
  error          TEXT         NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_token_prefix (token_prefix),
  INDEX idx_operation_table (operation, target_table)
);

GRANT INSERT ON wix_and_wax.mcp_audit_log TO 'mcp_rw'@'%';
-- SELECT on mcp_audit_log is covered by the existing global SELECT grant.

FLUSH PRIVILEGES;

SELECT 'mcp_rw grants:' AS info;
SHOW GRANTS FOR 'mcp_rw'@'%';
