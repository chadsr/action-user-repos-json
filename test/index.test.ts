import { describe, test, expect, beforeAll } from 'vitest';
import { validate } from '@octokit/graphql-schema';
import * as github from '@actions/github';
import {
    fetchRepos,
    fetchContributedRepos,
    gqlRepositories,
    gqlContributionRepositories,
    gqlUserCreatedAt,
} from '../src/repos';
import type { FetchOptions } from '../src/repos';
import type { Repository } from '../src/types';

const ghUser =
    process.env.GITHUB_USER && process.env.GITHUB_USER !== ''
        ? process.env.GITHUB_USER
        : 'chadsr';

const ghToken =
    process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== ''
        ? process.env.GITHUB_TOKEN
        : '';

if (!ghToken) throw new Error('GITHUB_TOKEN is required');

const octokit = github.getOctokit(ghToken);

const baseOptions: Omit<FetchOptions, 'limit'> = {
    octokit,
    username: ghUser,
    minStargazerCount: 0,
    languagesLimit: 5,
};

describe('fetchRepos()', () => {
    test('gqlRepositories should validate', () => {
        expect(validate(gqlRepositories)).toHaveLength(0);
    });

    let repos: Array<Repository>;

    beforeAll(async () => {
        repos = await fetchRepos({ ...baseOptions, limit: 10 });
    });

    test('should return repos', () => {
        expect(repos.length).greaterThan(0);
        repos.forEach((repo) => {
            expect(repo.owner).toBe(ghUser);
        });
    });

    test('should return one repo', async () => {
        const repos = await fetchRepos({ ...baseOptions, limit: 1 });
        expect(repos.length).greaterThan(0);
    });

    test('should return zero repos', async () => {
        const repos = await fetchRepos({ ...baseOptions, limit: 0 });
        expect(repos).toHaveLength(0);
    });

    test('each repo should return exactly 1 language', async () => {
        const repos = await fetchRepos({
            ...baseOptions,
            languagesLimit: 1,
            limit: 2,
        });
        repos.forEach((repo) => {
            expect(repo.languages).toHaveLength(1);
        });
    });

    test('each repo should return a maximum of 2 languages', async () => {
        const repos = await fetchRepos({
            ...baseOptions,
            languagesLimit: 2,
            limit: 2,
        });
        repos.forEach((repo) => {
            expect(repo.languages.length).toBeLessThanOrEqual(2);
        });
    });

    test('repos should be sorted by updatedAt (latest first)', () => {
        for (let i = 1; i < repos.length; i++) {
            expect(repos[i - 1].updatedAt.getTime()).toBeGreaterThanOrEqual(
                repos[i].updatedAt.getTime(),
            );
        }
    });
});

describe('fetchContributedRepos()', () => {
    test('gqlUserCreatedAt should validate', () => {
        expect(validate(gqlUserCreatedAt)).toHaveLength(0);
    });

    test('gqlContributionRepositories should validate', () => {
        expect(validate(gqlContributionRepositories)).toHaveLength(0);
    });

    let repos: Array<Repository>;

    beforeAll(async () => {
        repos = await fetchContributedRepos({ ...baseOptions, limit: 100 });
    });

    test('should return contributed repos not owned by the user', () => {
        expect(Array.isArray(repos)).toBe(true);
        for (const repo of repos) {
            expect(repo.owner).toBeDefined();
            expect(repo.owner.toLowerCase()).not.toBe(ghUser.toLowerCase());
        }
    });

    test('each contributed repo should have lastContributedAt', () => {
        for (const repo of repos) {
            expect(repo.lastContributedAt).toBeDefined();
            expect(repo.lastContributedAt).toBeInstanceOf(Date);
        }
    });

    test('contributed repos should respect languagesLimit', async () => {
        const repos = await fetchContributedRepos({
            ...baseOptions,
            languagesLimit: 1,
            limit: 100,
        });
        for (const repo of repos) {
            expect(repo.languages.length).toBeLessThanOrEqual(1);
        }
    });

    test('contributed repos should not contain duplicates', () => {
        const urls = repos.map((r) => r.url);
        const uniqueUrls = new Set(urls);
        expect(uniqueUrls.size).toBe(urls.length);
    });

    test('should return zero repos when limit is 0', async () => {
        const repos = await fetchContributedRepos({ ...baseOptions, limit: 0 });
        expect(repos).toHaveLength(0);
    });

    test('should return at most 1 repo when limit is 1', async () => {
        const repos = await fetchContributedRepos({ ...baseOptions, limit: 1 });
        expect(repos.length).toBeLessThanOrEqual(1);
    });

    test('should respect minStargazerCount', async () => {
        const repos = await fetchContributedRepos({
            ...baseOptions,
            minStargazerCount: 1000,
            limit: 100,
        });
        for (const repo of repos) {
            expect(repo.stargazerCount).toBeGreaterThanOrEqual(1000);
        }
    });
});
