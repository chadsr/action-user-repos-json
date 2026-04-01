import type {
    User as GithubUser,
    Repository as GithubRepository,
} from '@octokit/graphql-schema';
import type { Octokit } from '@octokit/core';

import { Repository } from './types';

/**
 * The maximum number of topics that a GitHub repository can have.
 * This value is set by the GitHub API.
 */
const MAX_TOPICS = 20;

/**
 * Shared repository field selections used across GraphQL queries.
 */
const gqlRepoFields = `
    owner {
        login
    }
    name
    description
    url
    stargazerCount
    createdAt
    updatedAt
    languages(first: $language_limit) {
        edges {
            node {
                name
            }
        }
    }
    repositoryTopics(first: $topic_limit) {
        edges {
            node {
                topic {
                    name
                }
            }
        }
    }
`;

export const gqlRepositories = `
    query (
        $login: String!
        $limit: Int!
        $language_limit: Int!
        $topic_limit: Int!
    ) {
        user(login: $login) {
            repositories(
                first: $limit
                orderBy: { field: UPDATED_AT, direction: DESC }
            ) {
                edges {
                    node {
                        ${gqlRepoFields}
                    }
                }
            }
        }
    }
`;

export const gqlUserCreatedAt = `
    query ($login: String!) {
        user(login: $login) {
            createdAt
        }
    }
`;

export const gqlContributionRepositories = `
    query (
        $login: String!
        $from: DateTime
        $to: DateTime
        $language_limit: Int!
        $topic_limit: Int!
    ) {
        user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
                commitContributionsByRepository(maxRepositories: 100) {
                    contributions(first: 1, orderBy: {field: OCCURRED_AT, direction: DESC}) {
                        nodes {
                            occurredAt
                        }
                    }
                    repository {
                        ${gqlRepoFields}
                    }
                }
            }
        }
    }
`;

/**
 * Options shared by all fetch functions.
 */
export interface FetchOptions {
    octokit: Octokit;
    username: string;
    minStargazerCount: number;
    limit: number;
    languagesLimit: number;
}

/**
 * The maximum time window for a contributionsCollection query.
 * GitHub only allows a maximum of 1 year per query.
 */
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Maps a raw repository node from the GraphQL response into a Repository object.
 */
const mapRepoNode = (node: GithubRepository): Repository => ({
    owner:
        node.owner?.login ??
        (() => {
            throw new Error('Repository node missing owner.login');
        })(),
    name: node.name,
    description: node.description ?? undefined,
    stargazerCount: node.stargazerCount,
    createdAt: new Date(node.createdAt as string),
    updatedAt: new Date(node.updatedAt as string),
    url: node.url as string,
    languages:
        node.languages?.edges
            ?.map((langEdge) => langEdge?.node?.name)
            .filter((name): name is string => name !== undefined) ?? [],
    topics:
        node.repositoryTopics?.edges
            ?.map((topicEdge) => topicEdge?.node?.topic?.name)
            ?.filter((name): name is string => name !== undefined) ?? [],
});

/**
 * Fetches repositories for a given GitHub user.
 *
 * @param {FetchOptions} options
 *
 * @return {Promise<Array<Repository>>} A promise that resolves to an array of fetched repository objects.
 */
export const fetchRepos = async (
    options: FetchOptions,
): Promise<Array<Repository>> => {
    const { octokit, username, minStargazerCount, limit, languagesLimit } =
        options;

    const variables = {
        login: username,
        limit: limit,
        language_limit: languagesLimit,
        topic_limit: MAX_TOPICS,
    };

    const repos: Array<Repository> = [];
    if (limit === 0) return repos;

    const data = await octokit.graphql<{ user: GithubUser }>(
        gqlRepositories,
        variables,
    );

    if (data.user.repositories.edges) {
        for (const repo of data.user.repositories.edges) {
            if (repos.length === limit) break;
            if (
                repo &&
                repo.node &&
                repo.node.stargazerCount >= minStargazerCount
            ) {
                repos.push(mapRepoNode(repo.node));
            }
        }
    }

    return repos;
};

/**
 * Fetches all repositories that a user has contributed commits to (that are not owned by the user).
 *
 * @param {FetchOptions} options
 *
 * @return {Promise<Array<Repository>>}
 */
export const fetchContributedRepos = async (
    options: FetchOptions,
): Promise<Array<Repository>> => {
    const { octokit, username, minStargazerCount, limit, languagesLimit } =
        options;

    const repos: Array<Repository> = [];
    if (limit === 0) return repos;

    // First, get the user's account creation date to know how far back to paginate
    const userData = await octokit.graphql<{ user: GithubUser }>(
        gqlUserCreatedAt,
        { login: username },
    );
    const accountCreatedAt = new Date(userData.user.createdAt as string);

    const seenUrls = new Set<string>();

    // Paginate through 1-year windows from now, backwards to account creation.
    // Iterating newest-first means the first time we see a repo we capture
    // the most recent contribution date automatically.
    const now = new Date();
    let windowEnd = now;

    while (windowEnd > accountCreatedAt) {
        const windowStart = new Date(
            Math.max(
                windowEnd.getTime() - ONE_YEAR_MS,
                accountCreatedAt.getTime(),
            ),
        );

        const data = await octokit.graphql<{ user: GithubUser }>(
            gqlContributionRepositories,
            {
                login: username,
                from: windowStart.toISOString(),
                to: windowEnd.toISOString(),
                language_limit: languagesLimit,
                topic_limit: MAX_TOPICS,
            },
        );

        const contributions =
            data.user.contributionsCollection?.commitContributionsByRepository;

        if (contributions) {
            for (const contribution of contributions) {
                const repo = contribution?.repository;
                if (!repo) continue;

                // Skip repos owned by the user
                if (repo.owner?.login?.toLowerCase() === username.toLowerCase())
                    continue;

                // Skip repos below the minimum star count
                if (repo.stargazerCount < minStargazerCount) continue;

                // Deduplicate by URL — first seen wins (most recent)
                if (seenUrls.has(repo.url as string)) continue;
                seenUrls.add(repo.url as string);

                const mapped = mapRepoNode(repo);

                // Extract the most recent contribution date from this window
                const occurredAt = contribution.contributions?.nodes?.[0]
                    ?.occurredAt as string | undefined;
                if (occurredAt) {
                    mapped.lastContributedAt = new Date(occurredAt);
                }

                repos.push(mapped);
            }
        }

        windowEnd = windowStart;
    }

    return repos.slice(0, limit);
};
