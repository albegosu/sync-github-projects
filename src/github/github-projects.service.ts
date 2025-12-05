import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { graphql } from '@octokit/graphql';
import { GithubProject, GithubProjectItem } from './interfaces/github-projects.interface';

@Injectable()
export class GithubProjectsService {
  private readonly logger = new Logger(GithubProjectsService.name);
  private readonly graphqlWithAuth;

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
  }

  /**
   * Fetch all projects for a user
   */
  async fetchUserProjects(username: string): Promise<GithubProject[]> {
    this.logger.log(`Fetching projects for user: ${username}`);

    const query = `
      query($username: String!, $cursor: String) {
        user(login: $username) {
          projectsV2(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              url
              shortDescription
              public
              closed
              owner {
                ... on User {
                  login
                }
                ... on Organization {
                  login
                }
              }
            }
          }
        }
      }
    `;

    const projects: GithubProject[] = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      try {
        const response: any = await this.graphqlWithAuth(query, {
          username,
          cursor,
        });

        if (response.user?.projectsV2?.nodes) {
          projects.push(...response.user.projectsV2.nodes);
          hasNextPage = response.user.projectsV2.pageInfo.hasNextPage;
          cursor = response.user.projectsV2.pageInfo.endCursor;
        } else {
          break;
        }
      } catch (error) {
        this.logger.error(`Failed to fetch projects for user ${username}:`, error.message);
        break;
      }
    }

    this.logger.log(`Found ${projects.length} projects for user ${username}`);
    return projects.filter(p => !p.closed); // Only return open projects
  }

  /**
   * Fetch all projects for an organization
   */
  async fetchOrganizationProjects(orgName: string): Promise<GithubProject[]> {
    this.logger.log(`Fetching projects for organization: ${orgName}`);

    const query = `
      query($orgName: String!, $cursor: String) {
        organization(login: $orgName) {
          projectsV2(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              url
              shortDescription
              public
              closed
              owner {
                ... on Organization {
                  login
                }
              }
            }
          }
        }
      }
    `;

    const projects: GithubProject[] = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      try {
        const response: any = await this.graphqlWithAuth(query, {
          orgName,
          cursor,
        });

        if (response.organization?.projectsV2?.nodes) {
          projects.push(...response.organization.projectsV2.nodes);
          hasNextPage = response.organization.projectsV2.pageInfo.hasNextPage;
          cursor = response.organization.projectsV2.pageInfo.endCursor;
        } else {
          break;
        }
      } catch (error) {
        this.logger.error(`Failed to fetch projects for org ${orgName}:`, error.message);
        break;
      }
    }

    this.logger.log(`Found ${projects.length} projects for organization ${orgName}`);
    return projects.filter(p => !p.closed);
  }

  /**
   * Fetch all items from a specific project
   */
  async fetchProjectItems(projectId: string): Promise<GithubProjectItem[]> {
    this.logger.log(`Fetching items for project: ${projectId}`);

    const query = `
      query($projectId: ID!, $cursor: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
            id
            title
            number
            items(first: 100, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                type
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldDateValue {
                      field {
                        ... on ProjectV2Field {
                          name
                        }
                      }
                      date
                    }
                    ... on ProjectV2ItemFieldTextValue {
                      field {
                        ... on ProjectV2Field {
                          name
                        }
                      }
                      text
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                      name
                    }
                  }
                }
                content {
                  ... on Issue {
                    id
                    number
                    title
                    body
                    url
                    state
                    createdAt
                    updatedAt
                    closedAt
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
                  }
                  ... on PullRequest {
                    id
                    number
                    title
                    body
                    url
                    state
                    createdAt
                    updatedAt
                    closedAt
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
                  }
                  ... on DraftIssue {
                    id
                    title
                    body
                    createdAt
                    updatedAt
                    assignees(first: 10) {
                      nodes {
                        login
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

    const items: GithubProjectItem[] = [];
    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      try {
        const response: any = await this.graphqlWithAuth(query, {
          projectId,
          cursor,
        });

        if (response.node?.items?.nodes) {
          const project = {
            id: response.node.id,
            title: response.node.title,
            number: response.node.number,
          };

          for (const item of response.node.items.nodes) {
            items.push(this.transformProjectItem(item, project));
          }

          hasNextPage = response.node.items.pageInfo.hasNextPage;
          cursor = response.node.items.pageInfo.endCursor;
        } else {
          break;
        }
      } catch (error) {
        this.logger.error(`Failed to fetch items for project ${projectId}:`, error.message);
        break;
      }
    }

    this.logger.log(`Found ${items.length} items in project`);
    return items;
  }

  /**
   * Transform raw project item to our interface
   */
  private transformProjectItem(item: any, project: any): GithubProjectItem {
    const transformed: GithubProjectItem = {
      id: item.id,
      type: item.type,
      project,
    };

    // Extract field values (dates, status, priority, etc.)
    const fieldValues: any = {};
    if (item.fieldValues?.nodes) {
      for (const fieldValue of item.fieldValues.nodes) {
        const fieldName = fieldValue.field?.name;
        if (!fieldName) continue;

        if (fieldValue.date) {
          // Date field
          fieldValues[fieldName] = fieldValue.date;
        } else if (fieldValue.text) {
          // Text field
          fieldValues[fieldName] = fieldValue.text;
        } else if (fieldValue.name) {
          // Single select field (like Status)
          fieldValues[fieldName] = fieldValue.name;
        }
      }
    }

    transformed.fieldValues = fieldValues;

    if (item.content) {
      if (item.type === 'DRAFT_ISSUE') {
        // Draft issues have different structure
        transformed.draftTitle = item.content.title;
        transformed.draftBody = item.content.body;
        transformed.content = {
          id: item.content.id,
          title: item.content.title,
          body: item.content.body || '',
          url: `https://github.com/users/${project.title}/projects/${project.number}`,
          state: 'OPEN',
          createdAt: item.content.createdAt,
          updatedAt: item.content.updatedAt,
          assignees: item.content.assignees?.nodes?.map((a: any) => a.login) || [],
          labels: [],
        };
      } else {
        // Issues and PRs have similar structure
        transformed.content = {
          id: item.content.id,
          number: item.content.number,
          title: item.content.title,
          body: item.content.body || '',
          url: item.content.url,
          state: item.content.state,
          createdAt: item.content.createdAt,
          updatedAt: item.content.updatedAt,
          closedAt: item.content.closedAt,
          assignees: item.content.assignees?.nodes?.map((a: any) => a.login) || [],
          labels: item.content.labels?.nodes?.map((l: any) => ({
            name: l.name,
            color: l.color,
          })) || [],
        };
      }
    }

    return transformed;
  }

  /**
   * Fetch items from multiple projects
   */
  async fetchItemsFromProjects(projectIds: string[]): Promise<GithubProjectItem[]> {
    this.logger.log(`Fetching items from ${projectIds.length} projects`);
    
    const allItems: GithubProjectItem[] = [];

    for (const projectId of projectIds) {
      try {
        const items = await this.fetchProjectItems(projectId);
        allItems.push(...items);
      } catch (error) {
        this.logger.error(`Failed to fetch items from project ${projectId}:`, error.message);
      }
    }

    this.logger.log(`Total items fetched: ${allItems.length}`);
    return allItems;
  }
}

