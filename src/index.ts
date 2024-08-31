import { getInput, setOutput } from '@actions/core';
import { fetchRepos } from './repos';
import fs from 'fs';

const main = async () => {
    const username = process.env.GITHUB_USER
        ? process.env.GITHUB_USER
        : getInput('username');

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('GITHUB_TOKEN is required.');
    }

    const minimumStargazersInput = getInput('minimumStargazers');
    const minStargazerCount =
        minimumStargazersInput === '' ? 0 : parseInt(minimumStargazersInput);

    const limitInput = getInput('limit');
    const limit = limitInput === '' ? 100 : parseInt(limitInput);

    let outputPath = getInput('outputPath');
    if (outputPath === '') outputPath = './repos.json';

    const repos = await fetchRepos(username, token, minStargazerCount, limit);
    const jsonRepos = JSON.stringify(repos, null, 4);
    fs.writeFileSync(outputPath, jsonRepos);
    setOutput('json_path', outputPath);
};

main();
