export type RepositorySortKey =
    | 'createdAt'
    | 'name'
    | 'owner'
    | 'stargazerCount'
    | 'updatedAt'
    | 'url';

export interface RepositoriesOutput {
    repositories: Repository[];
    contributions?: Repository[];
}

export interface Repository {
    createdAt: Date;
    description?: string;
    languages: string[];
    lastContributedAt?: Date;
    name: string;
    owner: string;
    stargazerCount: number;
    topics: string[];
    updatedAt: Date;
    url: string;
}
