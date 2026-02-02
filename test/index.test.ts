import { describe, test, expect } from 'vitest';
import { validate } from '@octokit/graphql-schema';
import { fetchRepos, gqlRepositories } from '../src/repos';

const ghUser =
    process.env.GITHUB_USER && process.env.GITHUB_USER !== ''
        ? process.env.GITHUB_USER
        : 'chadsr';

const ghToken =
    process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== ''
        ? process.env.GITHUB_TOKEN
        : '';

if (!ghToken) throw new Error('GITHUB_TOKEN is required');

describe('fetchRepos()', () => {
    test('gqlRepositories should validate', () => {
        expect(validate(gqlRepositories)).toHaveLength(0);
    });

    test('should return repos', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 2, 5);
        expect(repos.length).greaterThan(0);
    });

    test('should return one repo', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 1, 5);
        expect(repos.length).greaterThan(0);
    });

    test('should return zero repos', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 0, 5);
        expect(repos).toHaveLength(0);
    });

    test('each repo should return exactly 1 language', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 2, 1);
        repos.forEach((repo) => {
            expect(repo.languages).toHaveLength(1);
        });
    });

    test('each repo should return a maximum of 2 languages', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 2, 2);
        repos.forEach((repo) => {
            expect(repo.languages.length).toBeLessThanOrEqual(2);
        });
    });
});
