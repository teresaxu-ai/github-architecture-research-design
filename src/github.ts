import { Octokit } from '@octokit/rest';

export const octokit: InstanceType<typeof Octokit> = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'github-architecture-research/1.0.0',
});
