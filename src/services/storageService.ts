import { Circuit } from '../types/circuit';

export interface User {
  username: string;
}

export interface SavedProject {
  id: string;
  name: string;
  lastModified: number;
  circuit: Circuit;
}

const CURRENT_USER_KEY = 'corsit_current_user';

export const storageService = {
  // --- Auth ---
  login(username: string): User {
    const user = { username };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse user', e);
    }
    return null;
  },

  // --- Projects ---
  getProjectsKey(username: string): string {
    return `corsit_projects_${username}`;
  },

  getSavedProjects(username: string): SavedProject[] {
    try {
      const stored = localStorage.getItem(this.getProjectsKey(username));
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load projects', e);
    }
    return [];
  },

  saveProject(username: string, project: SavedProject): void {
    const projects = this.getSavedProjects(username);
    const existingIndex = projects.findIndex((p) => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = { ...project, lastModified: Date.now() };
    } else {
      projects.push({ ...project, lastModified: Date.now() });
    }
    
    localStorage.setItem(this.getProjectsKey(username), JSON.stringify(projects));
  },

  deleteProject(username: string, projectId: string): void {
    let projects = this.getSavedProjects(username);
    projects = projects.filter((p) => p.id !== projectId);
    localStorage.setItem(this.getProjectsKey(username), JSON.stringify(projects));
  }
};
