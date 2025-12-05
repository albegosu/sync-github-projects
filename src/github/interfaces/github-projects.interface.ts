export interface GithubProject {
  id: string;
  number: number;
  title: string;
  url: string;
  shortDescription: string;
  public: boolean;
  closed: boolean;
  owner: {
    login: string;
  };
}

export interface GithubProjectItem {
  id: string;
  type: 'ISSUE' | 'PULL_REQUEST' | 'DRAFT_ISSUE';
  content?: {
    id: string;
    number?: number;
    title: string;
    body?: string;
    url: string;
    state: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    assignees: string[];
    labels: Array<{
      name: string;
      color: string;
    }>;
  };
  // Draft issue fields (when type is DRAFT_ISSUE)
  draftTitle?: string;
  draftBody?: string;
  // Custom field values from GitHub Projects
  fieldValues?: {
    [key: string]: string; // Dynamic field values (Meeting Date, Target Date, Status, etc.)
  };
  project: {
    id: string;
    title: string;
    number: number;
  };
}

export interface ProjectSelection {
  userId: string;
  selectedProjects: string[]; // Project IDs
  syncEnabled: boolean;
}

