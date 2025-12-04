export interface GithubIssue {
  id: string;
  number: number;
  title: string;
  body: string;
  url: string;
  state: string;
  repository: GithubRepository;
  author: string;
  assignees: string[];
  labels: GithubLabel[];
  milestone: GithubMilestone | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface GithubRepository {
  owner: string;
  name: string;
  fullName: string;
}

export interface GithubLabel {
  name: string;
  color: string;
}

export interface GithubMilestone {
  title: string;
  dueOn: string | null;
}


