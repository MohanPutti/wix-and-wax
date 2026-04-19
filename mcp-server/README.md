# Wicks and Wax MCP Server

A remote MCP server exposing **read-only** SQL access to the Wicks and Wax production MySQL database. Admins connect from Claude Desktop or Claude Code and ask natural-language questions about orders, inventory, products, etc. — Claude writes the SQL and calls the server.

**Endpoint:** `https://mcp.wicksandwax.in/mcp`
**Auth:** `Authorization: Bearer <token>` — tokens are issued per admin.

## Tools exposed

| Tool             | Purpose                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `run_sql`        | Run a single `SELECT` (or `WITH … SELECT`) query. Auto-caps to 1000 rows. |
| `list_tables`    | List all tables with approximate row counts.                        |
| `describe_table` | Show columns, types, keys, defaults for a given table.              |
| `write_sql`      | Run a single `INSERT` / `UPDATE` / `DELETE` against allowlisted tables. |

### Writable tables

- **INSERT / UPDATE:** `orders`, `order_items`, `order_events`, `fulfillments`, `fulfillment_items`, `inventory_categories`, `inventory_types`, `inventory_entries`, `expense_types`, `expenses`.
- **DELETE (subset):** `inventory_categories`, `inventory_types`, `inventory_entries`, `expense_types`, `expenses`. Orders/fulfillments are **not deletable** — cancel via status update instead.

### Safety rails

1. **DB-level:** connects as `mcp_rw` — `SELECT` on the whole DB, `INSERT`/`UPDATE` on the allowlist, `DELETE` on the subset only. No `DROP`/`ALTER`/`TRUNCATE`/`GRANT` at the DB layer.
2. **App-level:**
   - `run_sql` rejects anything that isn't `SELECT` / `WITH … SELECT`.
   - `write_sql` rejects non-allowlisted tables, multi-statements, DDL keywords, and requires `WHERE` on `UPDATE` / `DELETE`.
3. **Audit log:** every successful or failed write is recorded in `mcp_audit_log` (`session_id`, `token_prefix`, `operation`, `target_table`, `sql_text`, `rows_affected`, `error`). Query it via `run_sql`.
4. **Query timeout:** 5 s (`MAX_EXECUTION_TIME`).
5. **Row cap:** 1000 rows if a `SELECT` has no `LIMIT`.
6. **Transport:** TLS-only via nginx; bearer token per admin; Claude Desktop & Claude Code both prompt for confirmation on tool calls by default.

---

## Deploying to production

Run these on the EC2 host `13.205.92.146`.

### 1. Create the read-only DB user (one-time)

```bash
cd /home/ubuntu/wix-and-wax
# Edit mcp-server/scripts/create-readonly-user.sql and replace CHANGE_ME_STRONG_PASSWORD
docker exec -i wix-and-wax-mysql mysql -uroot -prootpass123 < mcp-server/scripts/create-readonly-user.sql
```

### 2. Create `mcp-server/.env.production` (one-time)

```bash
# Generate 3 bearer tokens
for i in 1 2 3; do openssl rand -hex 32; done

# Then create the env file:
cat > mcp-server/.env.production <<'EOF'
MCP_TOKENS=<token1>,<token2>,<token3>
PORT=3100
DB_HOST=mysql
DB_PORT=3306
DB_NAME=wix_and_wax
DB_USER=mcp_readonly
DB_PASSWORD=<password from step 1>
MCP_STATEMENT_TIMEOUT_MS=5000
MCP_DEFAULT_LIMIT=1000
DB_POOL_SIZE=5
EOF
chmod 600 mcp-server/.env.production
```

### 3. Point DNS

Add an A record: `mcp.wicksandwax.in` → `13.205.92.146`.

### 4. Issue TLS cert and install nginx vhost

```bash
sudo certbot certonly --nginx -d mcp.wicksandwax.in
sudo cp nginx/wix-and-wax-mcp.conf /etc/nginx/sites-available/wix-and-wax-mcp
sudo ln -sf /etc/nginx/sites-available/wix-and-wax-mcp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Build and start the container

```bash
docker compose build mcp
docker compose up -d mcp
docker compose logs -f mcp   # verify "listening on :3100"
```

### 6. Smoke test

```bash
curl https://mcp.wicksandwax.in/health
# → {"status":"ok","sessions":0}
```

---

## Client setup

Share each admin one token from `MCP_TOKENS` — securely (1Password, Signal, etc.).

### Claude Desktop

1. Open **Settings → Connectors → Add custom connector**.
2. Name: `Wicks and Wax`
3. URL: `https://mcp.wicksandwax.in/mcp`
4. Under **Advanced settings / Custom headers**, add:
   - `Authorization: Bearer <your-token>`
5. Save. Open a new chat — the three tools should appear under the connector.

### Claude Code

```bash
claude mcp add \
  --transport http \
  --scope user \
  --header "Authorization: Bearer <your-token>" \
  wicksandwax \
  https://mcp.wicksandwax.in/mcp
```

Verify:

```bash
claude mcp list
```

---

## Example prompts

Once connected, in a Claude chat:

- "How many orders did we receive last week, and what's the total revenue?"
- "Which product variants are running low on stock (under 5 units)?"
- "Show me the top 10 fragrances by units sold in the last 30 days."
- "What was our total expenses broken down by type in March?"
- "Any pending payments older than 24 hours?"

Claude will call `list_tables` / `describe_table` when it needs to discover schema, then `run_sql` to answer.

---

## Rotating a token

Edit `mcp-server/.env.production`, replace the token in `MCP_TOKENS`, then:

```bash
docker compose restart mcp
```

Active sessions will be dropped. Admins using a rotated token get `401 Invalid token`.

## Local development

```bash
cd mcp-server
cp .env.example .env          # fill in MCP_TOKENS, DB_PASSWORD
npm install
npm run dev                    # tsx watch
```

Point it at a local MySQL (adjust `DB_HOST=localhost`, `DB_PORT=3306`), then:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3100/health
```
