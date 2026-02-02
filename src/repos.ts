import * as github from '@actions/github';
import type { User as GithubUser } from '@octokit/graphql-schema';
import type { Octokit } from '@octokit/core';

import { Repository } from './types';

/**
 * The maximum number of topics that a GitHub repository can have.
 * This value is set by the GitHub API.
 */
const MAX_TOPICS = 20;

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
                    }
                }
            }
        }
    }
`;

/**
 * Fetches repositories for a given GitHub user.
 *
 * @param {string} username - The username of the GitHub user to fetch repositories for.
 * @param {string} token - The personal access token used to authenticate with the GitHub API.
 * @param {number} minStargazerCount - The minimum number of stars required for a repository to be included in the result.
 * @param {number} limit - The maximum number of repositories to fetch.
 * @param {number} languagesLimit - The maximum number of repository language tags to fetch.
 *
 * @return {Promise<Array<Repository>>} A promise that resolves to an array of fetched repository objects.
 */
export const fetchRepos = async (
    username: string,
    token: string,
    minStargazerCount: number,
    limit: number,
    languagesLimit: number,
): Promise<Array<Repository>> => {
    const octokit: Octokit = github.getOctokit(token);

    const variables = {
        login: username,
        minStargazerCount: minStargazerCount,
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
        data.user.repositories.edges.forEach((repo) => {
            if (repos.length === limit) {
                return;
            }
            if (repo && repo.node) {
                if (repo.node.stargazerCount >= minStargazerCount) {
                    repos.push({
                        name: repo.node.name,
                        description: repo.node.description
                            ? repo.node.description
                            : undefined,
                        stargazerCount: repo.node.stargazerCount,
                        createdAt: new Date(repo.node.createdAt),
                        updatedAt: new Date(repo.node.updatedAt),
                        url: repo.node.url,
                        languages:
                            repo.node.languages?.edges
                                ?.map((langEdge) => langEdge?.node?.name)
                                .filter((name) => name !== undefined) ?? [],
                        topics:
                            repo.node.repositoryTopics?.edges
                                ?.map(
                                    (topicEdge) => topicEdge?.node?.topic.name,
                                )
                                ?.filter((name) => name !== undefined) ?? [],
                    });
                }
            }
        });
    }

    if (repos.length === 0) {
        throw new Error(`No repositories found for user ${username}`);
    }

    return repos;
};
