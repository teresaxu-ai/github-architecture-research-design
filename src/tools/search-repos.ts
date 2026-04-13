import { z } from 'zod';
import { octokit } from '../github.js';

export const searchReposSchema = z.object({
  query: z.string().describe('Search query, e.g. "collaborative text editor real-time"'),
  min_stars: z.coerce.number().int().min(0).default(10).describe('Minimum star count (default: 10)'),
  updated_after: z.string().optional().describe('Only repos updated after this ISO date, e.g. "2024-01-01". Omit to default to 2 years ago from today.'),
  limit: z.coerce.number().int().min(1).max(30).default(20).describe('Number of results per search round (max 30)'),
});

export type SearchReposInput = z.infer<typeof searchReposSchema>;

export async function searchRepos(input: SearchReposInput): Promise<string> {
  let q = input.query;

  if (input.min_stars > 0) {
    q += ` stars:>=${input.min_stars}`;
  }

  // Auto-compute rolling 2-year cutoff when updated_after is not supplied
  const cutoff = input.updated_after ?? (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
  })();

  q += ` pushed:>${cutoff}`;

  const response = await octokit.rest.search.repos({
    q,
    sort: 'stars',
    order: 'desc',
    per_page: input.limit,
  });

  const repos = response.data.items.map((item) => ({
    owner: item.owner?.login ?? 'unknown',
    repo: item.name,
    stars: item.stargazers_count,
    description: item.description ?? '',
    language: item.language ?? 'unknown',
    updated_at: item.updated_at,
    url: item.html_url,
  }));

  return JSON.stringify(repos, null, 2);
}
