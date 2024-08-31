import { describe, test, expect } from 'vitest';
import { validate } from '@octokit/graphql-schema';
import { print } from 'graphql/language/printer';
import { fetchRepos, gqlRepositories } from '../src/repos';

const ghUser = process.env.GITHUB_USER ? process.env.GITHUB_USER : 'chadsr';
const ghToken = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN : '';

describe('fetchRepos()', () => {
    test('gqlRepositories should validate', () => {
        const query = print(gqlRepositories);
        expect(validate(query)).toHaveLength(0);
    });

    test('should return repos', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 2);
        expect(repos.length).greaterThan(0);
    });

    test('should return one repo', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 1);
        expect(repos.length).greaterThan(0);
    });

    test('should return zero repos', async () => {
        const repos = await fetchRepos(ghUser, ghToken, 0, 0);
        expect(repos).toHaveLength(0);
    });
});
