# Automated Testing & MCP Playwright Guide

This project features a unified testing setup with **Playwright E2E** for automated regression and CI/CD, alongside an **MCP (Model Context Protocol) Server** for AI-driven browser automation and test generation.

---

## 1. Quick Start

Ensure Node.js (v18+) is installed, then install dependencies and browser binaries:

```bash
npm install
npx playwright install chromium
```

---

## 2. Running E2E Tests (Playwright)

Tests automatically launch the local web server (`npx serve pokeapi -l 3000`) if not already running.

```bash
# Run tests headlessly
npm run test:e2e

# Run with interactive Playwright UI
npm run test:e2e:ui

# View HTML execution report
npm run test:e2e:report
```

### Testing with Docker Compose
If running the entire stack via Docker Compose:
```bash
docker compose up -d
BASE_URL=http://localhost:80 npm run test:e2e
```

---

## 3. Playwright MCP Server (Agentic Automation)

The MCP server allows AI assistants (Claude, Antigravity, Cursor) to directly control Playwright browsers via JSON-RPC.

### Start Standalone
```bash
npm run mcp:start
```

### Agent Configuration (JSON)
Add the server configuration to your AI agent's MCP settings:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["./node_modules/tsx/dist/cli.mjs", "mcp/server.ts"]
    }
  }
}
```

### Exposed MCP Tools
* `navigate`: Navigate to a given URL.
* `click`: Click an element matching a CSS or XPath selector.
* `fill`: Fill form inputs by selector.
* `get_text`: Extract inner text from an element.
* `screenshot`: Capture a screenshot of the active page.

---

## 4. Load & Stress Testing with Grafana K6

Performance tests validate the AWS Application Load Balancers across concurrent Virtual Users (VUs):

```bash
# Test PokeAPI ALB (static frontend + CSS Grid)
npm run test:k6:pokeapi

# Test Monsters ALB (Umbrella B.O.W. frontend + REST API /api/monsters)
npm run test:k6:monsters

# Run both load tests sequentially
npm run test:k6
```

### Custom Target URL
To target a different environment or local instance:
```bash
TARGET_URL=http://localhost:80 k6 run tests/k6/pokeapi-load-test.js
```

### Quality Thresholds
* **p95 Latency:** < 500ms (PokeAPI) / < 800ms (Monsters API)
* **HTTP Failure Rate:** < 1.0% (Zero dropped requests under peak load)


