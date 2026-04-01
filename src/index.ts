import { getInput, setOutput, setFailed, debug } from '@actions/core';
import * as github from '@actions/github';
import { fetchRepos, fetchContributedRepos } from './repos';
import type { FetchOptions } from './repos';
import type {
    RepositoriesOutput,
    Repository,
    RepositorySortKey,
} from './types';
import fs from 'fs';

const VALID_SORT_KEYS: readonly RepositorySortKey[] = [
    'createdAt',
    'name',
    'owner',
    'stargazerCount',
    'updatedAt',
    'url',
];

const sortRepos = (
    repos: Repository[],
    sortBy: RepositorySortKey,
    ascending: boolean,
): void => {
    repos.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        let cmp: number;
        if (aVal instanceof Date && bVal instanceof Date) {
            cmp = aVal.getTime() - bVal.getTime();
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
            cmp = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            cmp = aVal - bVal;
        } else {
            cmp = 0;
        }

        return ascending ? cmp : -cmp;
    });
};

const main = async () => {
    const username = getInput('username');

    const token =
        process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== ''
            ? process.env.GITHUB_TOKEN
            : null;
    if (!token) {
        throw new Error('GITHUB_TOKEN is required.');
    }

    const minimumStargazersInput = getInput('minimum-stargazers');
    const minStargazerCount =
        minimumStargazersInput === '' ? 0 : parseInt(minimumStargazersInput);

    const limitInput = getInput('limit');
    const limit = limitInput === '' ? 100 : parseInt(limitInput);

    const languagesLimitInput = getInput('languages-limit');
    const languagesLimit =
        languagesLimitInput === '' ? 10 : parseInt(languagesLimitInput);

    const includeContributed = getInput('include-contributed') === 'true';

    const contributedLimitInput = getInput('contributed-limit');
    const contributedLimit =
        contributedLimitInput === '' ? 100 : parseInt(contributedLimitInput);

    let outputPath = getInput('output-path');
    if (outputPath === '') outputPath = './repos.json';

    const sortByRaw: string = getInput('sort-by') || 'updatedAt';
    const sortBy: RepositorySortKey = VALID_SORT_KEYS.includes(
        sortByRaw as RepositorySortKey,
    )
        ? (sortByRaw as RepositorySortKey)
        : 'updatedAt';

    const sortAsc = getInput('sort-asc') === 'true';

    const octokit = github.getOctokit(token);

    const fetchOptions: FetchOptions = {
        octokit,
        username,
        minStargazerCount,
        languagesLimit,
        limit,
    };

    const repos = await fetchRepos(fetchOptions);

    let contributedRepos: Repository[] = [];
    if (includeContributed) {
        fetchOptions.limit = contributedLimit;
        contributedRepos = await fetchContributedRepos(fetchOptions);
        debug(`Fetched ${contributedRepos.length} contributed repos`);
    }

    sortRepos(repos, sortBy, sortAsc);
    sortRepos(contributedRepos, sortBy, sortAsc);

    const output: RepositoriesOutput = {
        repositories: repos,
        ...(includeContributed && {
            contributions: contributedRepos,
        }),
    };

    const jsonRepos = JSON.stringify(output, null, 4);
    debug(jsonRepos);
    fs.writeFileSync(outputPath, jsonRepos);
    debug(
        `Wrote ${repos.length} repositories${includeContributed ? ` and ${contributedRepos.length} contributions` : ''} to ${outputPath}`,
    );
    setOutput('json-path', outputPath);
};

main().catch((err) => {
    setFailed(`Action failed with error: ${err}`);
});
