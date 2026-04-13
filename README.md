# github-architecture-research-design

An MCP (Model Context Protocol) server that researches real-world GitHub implementations and generates an actionable architectural build plan for your project idea — complete with tradeoffs, failure modes, and MVP vs. scaling guidance.

> Built by [teresaxu-ai](https://github.com/teresaxu-ai)

---

## The Problem It Solves

When you're starting a new project, you typically Google "how to build X" and get blog posts, tutorials, and opinionated takes. What you actually want is: *what do real production systems that solve this problem actually look like?*

This tool goes directly to GitHub, finds 10–20 production repositories in your problem space, reads their actual code structure and dependencies, and synthesizes the findings into a structured architectural brief — not a list of repos, but a **build plan** that tells you what approaches exist, which one fits your situation, where systems commonly break, and what you need to decide yourself.

---

## How It Works

```
You describe a project idea
         │
         ▼
Claude (guided by the architecture_research MCP prompt)
         │
         ├─ Step 1: Decompose your idea into technical primitives
         │          (e.g. "google maps scraper" → web-scraping, browser-automation, data-extraction)
         │
         ├─ Step 2: Search GitHub in 3 rounds using those primitives
         │          Round 1: topic:<primary-tag>    (e.g. topic:web-scraping)
         │          Round 2: topic:<adjacent-tag>   (e.g. topic:lead-generation)
         │          Round 3: behavior keywords      (e.g. "web scraper email extraction")
         │
         ├─ Step 3: Filter candidates
         │          ✓ Active within last 2 years (rolling)
         │          ✓ 10+ stars minimum
         │          ✗ Excludes demo / tutorial / homework repos
         │
         ├─ Step 4: Auto-select top 10–20 repos
         │          Ranked by relevance, stars, README depth, and tech diversity
         │
         ├─ Step 5: Deep analysis of each selected repo
         │          get_repo_structure → file tree
         │          get_file          → package.json / go.mod / requirements.txt / etc.
         │          Code beats README: manifest is ground truth
         │
         └─ Step 6: Synthesize into a full architectural report
```

The MCP server handles **data** (4 GitHub API tools + a structured prompt). Claude handles **intelligence** (pattern extraction, synthesis, recommendations).

---

## Output Structure

The report is always structured markdown, starting with the most important findings first:

| Section | What it covers |
|---|---|
| 🔑 **Key Takeaways** | Top cross-repo lessons — always first, before any detail |
| 🏗️ **Recommended Architecture** | Opinionated recommendation + data flow diagram |
| ⚖️ **Approaches Considered** | 2–3 alternatives with failure modes and explicit tradeoffs |
| 🗺️ **Project Build Plan** | Stages tagged `mvp` / `scaling` / `future`, each with alternatives, key decisions (impact + reversibility), failure modes, and what you must decide yourself |
| ♻️ **Reusable Patterns** | Directly liftable patterns with when/when-not-to-use |
| 🚀 **Where to Start** | Concrete first step grounded in the research |
| 🚫 **What Research Can't Tell You** | Specific gaps requiring your own domain knowledge |
| 📦 **Repos Analyzed** | List of sources used |

---

## MCP Tools

| Tool | What it does |
|---|---|
| `search_repos` | Search GitHub using topic tags and behavior keywords. Auto-applies a rolling 2-year recency filter and 10-star minimum. |
| `get_repo_overview` | Fetch README + metadata (stars, language, topics, license) for a repo |
| `get_repo_structure` | List files and folders at any path within a repo |
| `get_file` | Read the raw content of any file (package.json, go.mod, requirements.txt, etc.) up to 1 MB |

---

## Prerequisites

**A GitHub Personal Access Token**
- Type: Classic PAT or Fine-grained PAT
- Required scopes: **none** (public repo read access only)
- Without token: 60 API requests/hour — runs out fast across multiple search rounds
- With token: 5,000 requests/hour
- [Create one here](https://github.com/settings/tokens)

---

## Installation

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-architecture-research": {
      "command": "npx",
      "args": ["-y", "github-architecture-research"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

```bash
claude mcp add github-architecture-research node /path/to/github-architecture-research/dist/index.js
```

Or once published to npm:
```bash
claude mcp add github-architecture-research npx -y github-architecture-research
```

Then set your token in the environment — add to `.bashrc` / `.zshrc` / PowerShell profile:
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

---

## Usage

1. Open Claude Desktop or Claude Code
2. Invoke the prompt: `/github-architecture-research:architecture_research`
3. Describe your project idea

Claude runs the full 6-step workflow autonomously — no follow-up questions, no manual repo selection.

**Example project ideas:**
- *"A SaaS platform for scheduling social media posts with team collaboration"*
- *"A web scraper that extracts business leads from Google Maps and exports to CSV"*
- *"A real-time multiplayer whiteboard app with cursor presence"*
- *"A personal finance tracker with bank statement import and categorization"*

---

## Local Development

```bash
git clone https://github.com/teresaxu-ai/github-architecture-research-design.git
cd github-architecture-research-design
npm install
cp .env.example .env        # paste your GITHUB_TOKEN
npm run build
node dist/index.js
```

Dev mode (skip build step, uses tsx):
```bash
npm run dev
```

---

## Running Cost

| Item | Cost |
|---|---|
| Hosting | $0 — runs locally on your machine (stdio transport) |
| GitHub API | Free within rate limits |
| Claude tokens per analysis | ~$0.10–$0.30 (Sonnet) — GitHub API returns clean JSON, not HTML, keeping token use efficient |

---

## Contributors

| | |
|---|---|
| [<img src="https://github.com/teresaxu-ai.png" width="60px;"/><br /><sub><b>teresaxu-ai</b></sub>](https://github.com/teresaxu-ai) | Author & Maintainer |

---

## License

MIT
