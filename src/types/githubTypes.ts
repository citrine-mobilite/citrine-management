export interface GithubUserSummary {
  login: string;
  name?: string | null;
  avatarUrl?: string;
  htmlUrl: string;
}

export interface GithubRepoItem {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description?: string | null;
  isPrivate: boolean;
  htmlUrl: string;
  defaultBranch: string;
  language?: string | null;
  stargazersCount: number;
  forksCount: number;
  updatedAt: string;
  pushedAt?: string | null;
  topics?: string[];
}

export interface GithubContentEntry {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'dir' | 'file' | 'symlink' | 'submodule';
  htmlUrl?: string;
}

export interface GithubCommitItem {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  date: string;
  htmlUrl: string;
}

export interface SavedGithubProjectLink {
  id: string;
  repoId?: number;
  fullName: string;
  name: string;
  owner: string;
  description?: string | null;
  htmlUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
  language?: string | null;
  updatedAtGithub?: string;
  savedAt: string;
  savedBy?: string;
}
