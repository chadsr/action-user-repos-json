import { getInput, setOutput, debug } from '@actions/core';
import { fetchRepos } from './repos';
import fs from 'fs';

const main = async () => {
    const username = getInput('username');

    const token =
        process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== ''
            ? process.env.GITHUB_TOKEN
            : null;
    if (!token) {
        throw new Error('GITHUB_TOKEN is required.');
    }

    const minimumStargazersInput = getInput('minimumStargazers');
    const minStargazerCount =
        minimumStargazersInput === '' ? 0 : parseInt(minimumStargazersInput);

    const limitInput = getInput('limit');
    const limit = limitInput === '' ? 100 : parseInt(limitInput);

    const languagesLimitInput = getInput('languagesLimit');
    const languagesLimit =
        languagesLimitInput === '' ? 10 : parseInt(languagesLimitInput);

    let outputPath = getInput('outputPath');
    if (outputPath === '') outputPath = './repos.json';

    const repos = await fetchRepos(
        username,
        token,
        minStargazerCount,
        limit,
        languagesLimit,
    );
    const jsonRepos = JSON.stringify(repos, null, 4);
    debug(jsonRepos);
    fs.writeFileSync(outputPath, jsonRepos);
    debug(`Wrote ${repos.length} repos to ${outputPath}`);
    setOutput('json_path', outputPath);
};

main();
