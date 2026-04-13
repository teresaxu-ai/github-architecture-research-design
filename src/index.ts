#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { searchRepos, searchReposSchema } from './tools/search-repos.js';
import { getRepoOverview, getRepoOverviewSchema } from './tools/get-repo-overview.js';
import { getRepoStructure, getRepoStructureSchema } from './tools/get-repo-structure.js';
import { getFile, getFileSchema } from './tools/get-file.js';
import { buildArchitectureResearchPrompt } from './prompts/architecture-research.js';

const server = new McpServer({
  name: 'github-architecture-research',
  version: '1.0.0',
});

// --- Tools ---

server.tool(
  'search_repos',
  'Search GitHub for repositories matching a query. Returns owner, repo, stars, description, language, and URL.',
  searchReposSchema.shape,
  async (input) => {
    try {
      const result = await searchRepos(input as z.infer<typeof searchReposSchema>);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'get_repo_overview',
  'Fetch README content and metadata (stars, language, topics, license) for a GitHub repository.',
  getRepoOverviewSchema.shape,
  async (input) => {
    try {
      const result = await getRepoOverview(input as z.infer<typeof getRepoOverviewSchema>);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'get_repo_structure',
  'Get the file and folder listing for a path within a GitHub repository (default: root). Returns name, type (file|dir), and path for each entry.',
  getRepoStructureSchema.shape,
  async (input) => {
    try {
      const result = await getRepoStructure(input as z.infer<typeof getRepoStructureSchema>);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'get_file',
  'Fetch the raw text content of a file in a GitHub repository (e.g. package.json, go.mod, requirements.txt). Files over 1 MB are rejected.',
  getFileSchema.shape,
  async (input) => {
    try {
      const result = await getFile(input as z.infer<typeof getFileSchema>);
      return { content: [{ type: 'text', text: result }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  }
);

// --- Prompt ---

server.prompt(
  'architecture_research',
  'Analyze real-world GitHub implementations and synthesize architectural patterns to guide project design decisions.',
  { project_idea: z.string().describe('Describe your project idea in a few sentences') },
  async ({ project_idea }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: buildArchitectureResearchPrompt(project_idea),
          },
        },
      ],
    };
  }
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
