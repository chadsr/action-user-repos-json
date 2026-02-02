# User Repositories to JSON

[![Test](https://github.com/chadsr/action-user-repos-json/actions/workflows/test.yml/badge.svg)](https://github.com/chadsr/action-user-repos-json/actions/workflows/test.yml)

A Github action to output repositories owned by a user, as a JSON file.

Optional configuration criteria are provided to filter the results.

## Usage Example

```yaml
name: User Repos to JSON
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: chadsr/action-user-repos-json@main
      - id: repos
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          username: 'chadsr' # The Github username to retrieve the repositories of
          limit: 10 # Return a maximum of 10 repositories
          minimumStargazers: 1 # Only return repositories with at least 1 star
          languagesLimit: 1 # Return only the most prominent programming language used in each repository
          outputPath: './repositories.json'
      - name: Do something with the JSON file
        run: cat "${{ steps.repos.outputs.json_path }}"
```
