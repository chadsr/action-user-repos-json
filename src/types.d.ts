export interface Repository {
    name: string;
    description?: string;
    languages: string[];
    topics: string[];
    stargazerCount: number;
    createdAt: Date;
    updatedAt: Date;
    url: string;
}
