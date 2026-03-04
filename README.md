# Claude to Figma

A bridge that lets Claude AI directly read and manipulate Figma designs through natural language. It connects Claude Code to a live Figma file via a custom Figma plugin and an MCP (Model Context Protocol) server — no manual copy-pasting of node IDs or properties required.

## How It Works

```
Claude Code  ──MCP──►  mcp-server (stdio + WS :9000)  ──WebSocket──►  Figma Plugin  ──►  Figma Canvas
                             │
                             └── HTTP :9001  ◄──  utility scripts (*.js)
```

1. **MCP Server** (`mcp-server/index.ts`) — runs as a Claude Code MCP tool server over stdio. Also opens a WebSocket server on port 9000 and an HTTP bridge on port 9001.
2. **Figma Plugin** (`figma-plugin/`) — runs inside Figma, connects back to the WebSocket server, and executes canvas operations on demand.
3. **Utility Scripts** (`scripts/`) — standalone Node scripts that talk to the HTTP bridge for one-off tasks like analysis, data fetching, and bulk updates.

## Capabilities

### Reading & Inspection
| Tool | What it does |
|------|-------------|
| `list_nodes` | List all top-level nodes on the current page |
| `get_node_details` | Full details of a node: position, size, fills, strokes, effects, text props |
| `get_children` | Recursive children tree up to a configurable depth |
| `get_selection` | Details of whatever the user has selected in Figma |
| `get_styles` | All local paint, text, and effect styles in the file |
| `get_instance_info` | Component key, remote status, and variant properties of an instance |
| `list_variables` | All local variables filtered by type (COLOR, FLOAT, STRING, BOOLEAN) |

### Creating Nodes
| Tool | What it does |
|------|-------------|
| `create_frame` | New frame with position, size, and fill — default size 375×812 |
| `add_text` | Text node with font, size, weight, color |
| `add_rectangle` | Rectangle with corner radius and fill |
| `add_ellipse` | Circle or ellipse |
| `add_line` | Line between two points |

### Editing Nodes
| Tool | What it does |
|------|-------------|
| `update_node` | Change position, size, fill, stroke, opacity, visibility, `layoutAlign` (INHERIT\|STRETCH\|MIN\|CENTER\|MAX), `layoutGrow` (0\|1) — any subset |
| `update_text` | Update text content and style properties |
| `delete_node` | Remove a node from the canvas |
| `clone_node` | Deep-clone a node with optional repositioning |
| `move_node` | Reparent a node into a different container |
| `set_auto_layout` | Apply auto layout to a frame — direction, gap, padding, alignment, `primaryAxisSizingMode` (FIXED\|HUG\|FILL), `counterAxisSizingMode`, explicit width/height |
| `set_constraints` | Set responsive constraints on a node |
| `group_nodes` | Group multiple sibling nodes |

### Components & Libraries
| Tool | What it does |
|------|-------------|
| `search_components` | Search all pages for components/component sets by name |
| `create_instance` | Instantiate a local component by ID |
| `set_variant` | Switch a component instance to a different variant |
| `list_library_components` | Discover components from enabled team libraries |
| `import_component_by_key` | Import and place a component from an external library |
| `apply_style` | Apply a local paint, text, or effect style to a node |
| `import_style_by_key` | Import and apply a style from an external library |
| `create_component_set` | Create a component set with multiple variants from a frame |

### Variables & Tokens
| Tool | What it does |
|------|-------------|
| `bind_variable` | Bind a design token (color, number) to a node property |
| `list_library_variables` | List variables from enabled external libraries |
| `import_variable_by_key` | Import a variable from an external library |

## Setup

### Prerequisites
- Node.js 18+
- Claude Code CLI
- Figma desktop app

### 1 — Install dependencies
```bash
npm install
```

### 2 — Configure Claude Code MCP
Add to `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["tsx", "/path/to/claudetofigma/mcp-server/index.ts"]
    }
  }
}
```
Restart Claude Code — the MCP server starts automatically.

### 3 — Load the Figma plugin
1. Open Figma → **Plugins → Development → Import plugin from manifest**
2. Select `figma-plugin/manifest.json`
3. Run the plugin inside any Figma file — it will connect to the MCP server over WebSocket

### 4 — Start designing with Claude
Open Claude Code in any project and ask naturally:

```
"Find the button component in the library and create an instance on the current page"
"Change the background of frame 'Card/Item' to #1A1A2E"
"List all text nodes inside the 'Header' frame"
"Apply the 'Brand/Primary' color variable to the selected rectangle"
```

## Utility Scripts

The `scripts/` folder contains standalone Node scripts for bulk operations:

| Folder | Purpose |
|--------|---------|
| `scripts/analysis/` | Inspect files, scan components, search nodes |
| `scripts/build/` | Build and place complex multi-node structures |
| `scripts/fetch/` | Fetch file data, list components, query variables |
| `scripts/fix/` | Bulk updates, token binding, layout fixes |
| `scripts/utils/` | WebSocket client, HTTP bridge runner, test helpers |

Run any script directly against the HTTP bridge (requires plugin connected):
```bash
node scripts/fetch/list-projects.js
node scripts/analysis/analyze-library.js
```

## Rebuilding the Plugin

After editing `figma-plugin/code.ts`:
```bash
cd figma-plugin && npx esbuild code.ts --bundle --outfile=code.js --target=es6
```
Then reload the plugin in Figma (**right-click plugin → Reload**).

## Project Structure

```
claudetofigma/
├── figma-plugin/          # Figma plugin (TypeScript → compiled JS)
│   ├── code.ts            # Plugin source
│   ├── code.js            # Compiled output (committed for easy loading)
│   ├── ui.html            # Plugin UI
│   └── manifest.json
├── mcp-server/
│   └── index.ts           # MCP + WebSocket + HTTP bridge server
├── scripts/
│   ├── analysis/          # Inspect, scan, find, search scripts
│   ├── build/             # Create complex structures in bulk
│   ├── fetch/             # Fetch and list Figma data via REST API
│   ├── fix/               # Update, bind tokens, fix layouts
│   └── utils/             # WebSocket client, test helpers
├── package.json
└── tsconfig.json
```

## License

MIT
