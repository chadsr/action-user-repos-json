# User Repositories to JSON

[![Test](https://github.com/chadsr/action-user-repos-json/actions/workflows/test.yml/badge.svg)](https://github.com/chadsr/action-user-repos-json/actions/workflows/test.yml)

A Github action to output repositories owned (or contributed to) by a user, as a JSON file.

Optional configuration criteria are provided to filter the results.

## Inputs

| Input | Description | Default |
| --- | --- | --- |
| `username` | The Github username to retrieve the repositories of | `${{ github.repository_owner }}` |
| `minimum-stargazers` | The minimum number of stargazers a repository should have | `0` |
| `limit` | Limit the number of owned repositories to be retrieved | `100` |
| `languages-limit` | Limit the number of associated languages to retrieve for each repository | `10` |
| `include-contributed` | Whether to include repositories the user has contributed to but does not own | `false` |
| `contributed-limit` | Limit the number of contributed-to repositories to retrieve (only used when `include-contributed` is `true`) | `100` |
| `output-path` | Output file path | `${{ github.workspace }}/repositories.json` |
| `sort-by` | Repository field to sort results by (`createdAt`, `name`, `owner`, `stargazerCount`, `updatedAt`, `url`) | `updatedAt` |
| `sort-asc` | Sort in ascending order instead of the default descending | `false` |

## Outputs

| Output | Description |
| --- | --- |
| `json-path` | The path to the generated JSON file |

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
          limit: 10 # Return a maximum of 10 owned repositories
          minimum-stargazers: 1 # Only return repositories with at least 1 star
          languages-limit: 1 # Return only the most prominent programming language used in each repository
          include-contributed: true # Also include repositories the user has contributed to
          contributed-limit: 10 # Return a maximum of 10 contributed-to repositories
          sort-by: 'stargazerCount' # Sort repositories by star count
          sort-asc: false # Highest stars first (descending)
      - name: Do something with the JSON file
        run: cat "${{ steps.repos.outputs.json-path }}"
```

## Example Output

The action generates a JSON file containing an object with a `repositories` key. When `include-contributed` is set to `true`, `contributions` is also included. Below is an example with a single repository in each:

```json
{
    "repositories": [
        {
            "createdAt": "2024-01-15T10:30:00.000Z",
            "description": "A Github action to output repositories owned by a user, as a JSON file.",
            "languages": [
                "TypeScript"
            ],
            "name": "action-user-repos-json",
            "owner": "chadsr",
            "stargazerCount": 42,
            "topics": [
                "github-action",
                "github-api"
            ],
            "updatedAt": "2024-06-01T12:00:00.000Z",
            "url": "https://github.com/chadsr/action-user-repos-json"
        }
    ],
    "contributions": [
        {
            "createdAt": "2023-05-20T08:00:00.000Z",
            "description": "An open source project I contributed to.",
            "languages": [
                "Rust"
            ],
            "lastContributedAt": "2024-03-10T14:22:00.000Z",
            "name": "cool-project",
            "owner": "someone-else",
            "stargazerCount": 150,
            "topics": ["cool-project"],
            "updatedAt": "2024-05-15T09:00:00.000Z",
            "url": "https://github.com/someone-else/cool-project"
        }
    ]
}
```
