import { z } from 'zod';
import { octokit } from '../github.js';

export const getRepoOverviewSchema = z.object({
  owner: z.string().describe('Repository owner (username or org)'),
  repo: z.string().describe('Repository name'),
});

export type GetRepoOverviewInput = z.infer<typeof getRepoOverviewSchema>;

export async function getRepoOverview(input: GetRepoOverviewInput): Promise<string> {
  const [metaResponse, readmeResponse] = await Promise.allSettled([
    octokit.rest.repos.get({ owner: input.owner, repo: input.repo }),
    octokit.rest.repos.getReadme({ owner: input.owner, repo: input.repo }),
  ]);

  if (metaResponse.status === 'rejected') {
    throw new Error(`Failed to fetch repo metadata: ${metaResponse.reason}`);
  }

  const meta = metaResponse.value.data;

  let readme_text = '';
  if (readmeResponse.status === 'fulfilled') {
    const content = readmeResponse.value.data.content;
    readme_text = Buffer.from(content, 'base64').toString('utf-8');
    // Truncate to ~8000 chars to avoid excessive token usage
    if (readme_text.length > 8000) {
      readme_text = readme_text.slice(0, 8000) + '\n\n[README truncated at 8000 chars]';
    }
  }

  const result = {
    metadata: {
      full_name: meta.full_name,
      description: meta.description ?? '',
      stars: meta.stargazers_count,
      forks: meta.forks_count,
      language: meta.language ?? 'unknown',
      topics: meta.topics ?? [],
      created_at: meta.created_at,
      updated_at: meta.updated_at,
      license: meta.license?.name ?? 'none',
      url: meta.html_url,
    },
    readme_text,
  };

  return JSON.stringify(result, null, 2);
}
