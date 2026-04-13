import { z } from 'zod';
import { octokit } from '../github.js';

const MAX_FILE_SIZE = 1_000_000; // 1 MB

export const getFileSchema = z.object({
  owner: z.string().describe('Repository owner (username or org)'),
  repo: z.string().describe('Repository name'),
  path: z.string().describe('File path within the repo, e.g. "package.json"'),
});

export type GetFileInput = z.infer<typeof getFileSchema>;

export async function getFile(input: GetFileInput): Promise<string> {
  const response = await octokit.rest.repos.getContent({
    owner: input.owner,
    repo: input.repo,
    path: input.path,
  });

  const data = response.data;

  if (Array.isArray(data)) {
    throw new Error(`Path "${input.path}" is a directory. Use get_repo_structure to list directories.`);
  }

  if (data.type !== 'file') {
    throw new Error(`Path "${input.path}" is not a regular file (type: ${data.type}).`);
  }

  if (data.size > MAX_FILE_SIZE) {
    throw new Error(`File "${input.path}" is ${data.size} bytes, which exceeds the 1 MB limit.`);
  }

  const content = Buffer.from(data.content, 'base64').toString('utf-8');

  return JSON.stringify({ content, size: data.size }, null, 2);
}
