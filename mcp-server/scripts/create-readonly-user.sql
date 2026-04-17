-- Run once on the production MySQL as root, then update MCP .env.production with the password.
--
--   docker exec -i wix-and-wax-mysql mysql -uroot -prootpass123 < mcp-server/scripts/create-readonly-user.sql
--
-- Replace CHANGE_ME_STRONG_PASSWORD below before running.

CREATE USER IF NOT EXISTS 'mcp_readonly'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT SELECT ON wix_and_wax.* TO 'mcp_readonly'@'%';
FLUSH PRIVILEGES;
