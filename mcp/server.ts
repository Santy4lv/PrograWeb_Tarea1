import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { chromium, type Browser, type Page } from 'playwright';

let browser: Browser | null = null;
let page: Page | null = null;

async function getOrCreatePage(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  if (!page) {
    page = await browser.newPage();
  }
  return page;
}

const server = new Server(
  { name: 'playwright-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'navigate',
      description: 'Navigate browser to a given URL',
      inputSchema: {
        type: 'object',
        properties: { url: { type: 'string', description: 'Destination URL' } },
        required: ['url'],
      },
    },
    {
      name: 'click',
      description: 'Click on an element matching selector',
      inputSchema: {
        type: 'object',
        properties: { selector: { type: 'string', description: 'CSS/XPath selector' } },
        required: ['selector'],
      },
    },
    {
      name: 'fill',
      description: 'Fill text into an input field matching selector',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'Input selector' },
          value: { type: 'string', description: 'Text value to fill' },
        },
        required: ['selector', 'value'],
      },
    },
    {
      name: 'get_text',
      description: 'Get inner text of an element matching selector',
      inputSchema: {
        type: 'object',
        properties: { selector: { type: 'string', description: 'CSS selector' } },
        required: ['selector'],
      },
    },
    {
      name: 'screenshot',
      description: 'Capture screenshot of current page',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path to save screenshot' } },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const p = await getOrCreatePage();
  const { name, arguments: args } = request.params;

  try {
    if (name === 'navigate') {
      const url = String(args?.url);
      await p.goto(url, { waitUntil: 'domcontentloaded' });
      return { content: [{ type: 'text', text: `Navigated to ${url} (Title: ${await p.title()})` }] };
    }
    if (name === 'click') {
      const selector = String(args?.selector);
      await p.click(selector);
      return { content: [{ type: 'text', text: `Clicked on ${selector}` }] };
    }
    if (name === 'fill') {
      const selector = String(args?.selector);
      const value = String(args?.value);
      await p.fill(selector, value);
      return { content: [{ type: 'text', text: `Filled ${selector} with "${value}"` }] };
    }
    if (name === 'get_text') {
      const selector = String(args?.selector);
      const text = await p.textContent(selector);
      return { content: [{ type: 'text', text: text?.trim() || '' }] };
    }
    if (name === 'screenshot') {
      const filePath = args?.path ? String(args.path) : 'test-results/mcp-screenshot.png';
      await p.screenshot({ path: filePath });
      return { content: [{ type: 'text', text: `Screenshot captured: ${filePath}` }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return { isError: true, content: [{ type: 'text', text: `Error: ${error.message}` }] };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});

