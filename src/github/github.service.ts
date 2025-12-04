import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { graphql } from '@octokit/graphql';
import { GithubIssue, GithubRepository } from './interfaces/github.interface';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly graphqlWithAuth;
  private readonly organizations: string[];
  private readonly repositories: string[];
  private readonly labels: string[];
  private readonly assignees: string[];

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    
    if (!token) {
      this.logger.error('GITHUB_TOKEN is not set in environment variables');
      throw new Error('GITHUB_TOKEN is required');
    }

    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });

    // Parse configuration
    this.organizations = this.parseCommaSeparated('GITHUB_ORGANIZATIONS');
    this.repositories = this.parseCommaSeparated('GITHUB_REPOSITORIES');
    this.labels = this.parseCommaSeparated('GITHUB_LABELS');
    this.assignees = this.parseCommaSeparated('GITHUB_ASSIGNEES');

    this.logger.log(`Configured to track:`);
    this.logger.log(`  Organizations: ${this.organizations.join(', ') || 'none'}`);
    this.logger.log(`  Repositories: ${this.repositories.join(', ') || 'none'}`);
    this.logger.log(`  Labels filter: ${this.labels.join(', ') || 'all'}`);
    this.logger.log(`  Assignees filter: ${this.assignees.join(', ') || 'all'}`);
  }

  private parseCommaSeparated(key: string): string[] {
    const value = this.configService.get<string>(key);
    return value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
  }

  /**
   * Fetch issues from all configured organizations
   */
  async fetchOrganizationIssues(): Promise<GithubIssue[]> {
    const allIssues: GithubIssue[] = [];

    for (const org of this.organizations) {
      try {
        this.logger.log(`Fetching issues from organization: ${org}`);
        const issues = await this.fetchIssuesFromOrganization(org);
        allIssues.push(...issues);
      } catch (error) {
        this.logger.error(`Failed to fetch issues from org ${org}:`, error.message);
      }
    }

    return allIssues;
  }

  /**
   * Fetch issues from specific repositories
   */
  async fetchRepositoryIssues(): Promise<GithubIssue[]> {
    const allIssues: GithubIssue[] = [];

    for (const repo of this.repositories) {
      const [owner, name] = repo.split('/');
      if (!owner || !name) {
        this.logger.warn(`Invalid repository format: ${repo}. Expected: owner/repo`);
        continue;
      }

      try {
        this.logger.log(`Fetching issues from repository: ${owner}/${name}`);
        const issues = await this.fetchIssuesFromRepository(owner, name);
        allIssues.push(...issues);
      } catch (error) {
        this.logger.error(`Failed to fetch issues from ${repo}:`, error.message);
      }
    }

    return allIssues;
  }

  /**
   * Fetch all issues from all configured sources
   */
  async fetchAllIssues(): Promise<GithubIssue[]> {
    const [orgIssues, repoIssues] = await Promise.all([
      this.fetchOrganizationIssues(),
      this.fetchRepositoryIssues(),
    ]);

    const allIssues = [...orgIssues, ...repoIssues];
    
    // Remove duplicates (same issue might be in org and repo lists)
    const uniqueIssues = this.deduplicateIssues(allIssues);
    
    // Apply filters
    const filteredIssues = this.applyFilters(uniqueIssues);

    this.logger.log(`Total issues fetched: ${allIssues.length}, unique: ${uniqueIssues.length}, after filters: ${filteredIssues.length}`);
    
    return filteredIssues;
  }

  /**
   * Fetch issues from a GitHub organization using GraphQL
   */
  private async fetchIssuesFromOrganization(organization: string): Promise<GithubIssue[]> {
    const query = `
      query($organization: String!, $cursor: String) {
        organization(login: $organization) {
          repositories(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              owner {
                login
              }
              issues(first: 100, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
                nodes {
                  id
                  number
                  title
                  body
                  url
                  state
                  createdAt
                  updatedAt
                  closedAt
                  author {
                    login
                  }
                  assignees(first: 10) {
                    nodes {
                      login
                    }
                  }
                  labels(first: 10) {
                    nodes {
                      name
                      color
                    }
                  }
                  milestone {
                    title
                    dueOn
                  }
                }
              }
            }
          }
        }
      }
    `;

    const issues: GithubIssue[] = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      try {
        const response: any = await this.graphqlWithAuth(query, {
          organization,
          cursor,
        });

        if (!response.organization) {
          this.logger.warn(`Organization ${organization} not found or not accessible`);
          break;
        }

        const repositories = response.organization.repositories.nodes;
        
        for (const repo of repositories) {
          for (const issue of repo.issues.nodes) {
            issues.push(this.transformIssue(issue, repo));
          }
        }

        hasNextPage = response.organization.repositories.pageInfo.hasNextPage;
        cursor = response.organization.repositories.pageInfo.endCursor;
      } catch (error) {
        this.logger.error(`GraphQL error for org ${organization}:`, error.message);
        break;
      }
    }

    return issues;
  }

  /**
   * Fetch issues from a specific repository using GraphQL
   */
  private async fetchIssuesFromRepository(owner: string, name: string): Promise<GithubIssue[]> {
    const query = `
      query($owner: String!, $name: String!, $cursor: String) {
        repository(owner: $owner, name: $name) {
          name
          owner {
            login
          }
          issues(first: 100, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              body
              url
              state
              createdAt
              updatedAt
              closedAt
              author {
                login
              }
              assignees(first: 10) {
                nodes {
                  login
                }
              }
              labels(first: 10) {
                nodes {
                  name
                  color
                }
              }
              milestone {
                title
                dueOn
              }
            }
          }
        }
      }
    `;

    const issues: GithubIssue[] = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      try {
        const response: any = await this.graphqlWithAuth(query, {
          owner,
          name,
          cursor,
        });

        if (!response.repository) {
          this.logger.warn(`Repository ${owner}/${name} not found or not accessible`);
          break;
        }

        const repo = response.repository;
        
        for (const issue of repo.issues.nodes) {
          issues.push(this.transformIssue(issue, repo));
        }

        hasNextPage = response.repository.issues.pageInfo.hasNextPage;
        cursor = response.repository.issues.pageInfo.endCursor;
      } catch (error) {
        this.logger.error(`GraphQL error for repo ${owner}/${name}:`, error.message);
        break;
      }
    }

    return issues;
  }

  /**
   * Transform GraphQL issue response to our interface
   */
  private transformIssue(issue: any, repo: any): GithubIssue {
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      url: issue.url,
      state: issue.state,
      repository: {
        owner: repo.owner.login,
        name: repo.name,
        fullName: `${repo.owner.login}/${repo.name}`,
      },
      author: issue.author?.login || 'unknown',
      assignees: issue.assignees.nodes.map((a: any) => a.login),
      labels: issue.labels.nodes.map((l: any) => ({
        name: l.name,
        color: l.color,
      })),
      milestone: issue.milestone ? {
        title: issue.milestone.title,
        dueOn: issue.milestone.dueOn,
      } : null,
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.updatedAt),
      closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
    };
  }

  /**
   * Remove duplicate issues based on ID
   */
  private deduplicateIssues(issues: GithubIssue[]): GithubIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      if (seen.has(issue.id)) {
        return false;
      }
      seen.add(issue.id);
      return true;
    });
  }

  /**
   * Apply label and assignee filters
   */
  private applyFilters(issues: GithubIssue[]): GithubIssue[] {
    let filtered = issues;

    // Filter by labels if specified
    if (this.labels.length > 0) {
      filtered = filtered.filter(issue =>
        issue.labels.some(label =>
          this.labels.includes(label.name)
        )
      );
    }

    // Filter by assignees if specified
    if (this.assignees.length > 0) {
      filtered = filtered.filter(issue =>
        issue.assignees.some(assignee =>
          this.assignees.includes(assignee)
        )
      );
    }

    return filtered;
  }
}


