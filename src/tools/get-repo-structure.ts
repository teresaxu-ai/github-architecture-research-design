import { z } from 'zod';
import { octokit } from '../github.js';

export const getRepoStructureSchema = z.object({
  owner: z.string().describe('Repository owner (username or org)'),
  repo: z.string().describe('Repository name'),
  path: z.string().default('').describe('Directory path to inspect (empty string = root)'),
});

export type GetRepoStructureInput = z.infer<typeof getRepoStructureSchema>;

export async function getRepoStructure(input: GetRepoStructureInput): Promise<string> {
  const response = await octokit.rest.repos.getContent({
    owner: input.owner,
    repo: input.repo,
    path: input.path,
  });

  const data = response.data;

  if (!Array.isArray(data)) {
    throw new Error(`Path "${input.path}" is a file, not a directory. Use get_file to read files.`);
  }

  const entries = data.map((item) => ({
    name: item.name,
    type: item.type,
    path: item.path,
    size: item.type === 'file' ? item.size : undefined,
  }));

  // Sort: dirs first, then files, alphabetically within each group
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return JSON.stringify(entries, null, 2);
}
