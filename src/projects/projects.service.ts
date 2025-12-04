import { Injectable, Logger } from '@nestjs/common';
import { GithubProjectsService } from '../github/github-projects.service';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectSelection {
  username: string;
  projectIds: string[];
  updatedAt: string;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly selectionsPath: string;

  constructor(private githubProjectsService: GithubProjectsService) {
    this.selectionsPath = path.join(process.cwd(), 'tokens', 'project-selections.json');
    this.ensureSelectionsFile();
  }

  /**
   * Ensure the selections file exists
   */
  private ensureSelectionsFile() {
    const dir = path.dirname(this.selectionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.selectionsPath)) {
      fs.writeFileSync(this.selectionsPath, JSON.stringify([]));
    }
  }

  /**
   * List all available projects for a user/organization
   */
  async listProjects(username: string) {
    try {
      this.logger.log(`Listing projects for: ${username}`);
      
      // Try as user first, then as organization
      let projects = await this.githubProjectsService.fetchUserProjects(username);
      
      if (projects.length === 0) {
        projects = await this.githubProjectsService.fetchOrganizationProjects(username);
      }

      return {
        success: true,
        username,
        projects,
        count: projects.length,
      };
    } catch (error) {
      this.logger.error(`Failed to list projects for ${username}:`, error.message);
      return {
        success: false,
        message: error.message,
        projects: [],
        count: 0,
      };
    }
  }

  /**
   * Save selected projects for a user
   */
  async saveSelectedProjects(username: string, projectIds: string[]) {
    try {
      this.logger.log(`Saving ${projectIds.length} selected projects for ${username}`);
      
      const selections = this.loadSelections();
      const index = selections.findIndex(s => s.username === username);
      
      const selection: ProjectSelection = {
        username,
        projectIds,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        selections[index] = selection;
      } else {
        selections.push(selection);
      }

      fs.writeFileSync(this.selectionsPath, JSON.stringify(selections, null, 2));
      
      this.logger.log(`Saved ${projectIds.length} projects for ${username}`);
      
      return {
        success: true,
        message: `Successfully saved ${projectIds.length} projects`,
        selection,
      };
    } catch (error) {
      this.logger.error(`Failed to save selections:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get selected projects for a user
   */
  async getSelectedProjects(username: string) {
    try {
      const selections = this.loadSelections();
      const selection = selections.find(s => s.username === username);
      
      if (selection) {
        return {
          success: true,
          username,
          projectIds: selection.projectIds,
          updatedAt: selection.updatedAt,
        };
      } else {
        return {
          success: true,
          username,
          projectIds: [],
          message: 'No projects selected yet',
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get selections:`, error.message);
      return {
        success: false,
        message: error.message,
        projectIds: [],
      };
    }
  }

  /**
   * Get all selected project IDs across all users
   */
  getAllSelectedProjectIds(): string[] {
    try {
      const selections = this.loadSelections();
      const allProjectIds = selections.flatMap(s => s.projectIds);
      return [...new Set(allProjectIds)]; // Remove duplicates
    } catch (error) {
      this.logger.error(`Failed to get all selected projects:`, error.message);
      return [];
    }
  }

  /**
   * Load selections from file
   */
  private loadSelections(): ProjectSelection[] {
    try {
      const data = fs.readFileSync(this.selectionsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.warn('Failed to load selections, returning empty array');
      return [];
    }
  }
}

