import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { Workspace } from './components/workspace/Workspace';
import { User, SavedProject, storageService } from './services/storageService';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'workspace'>('login');
  const [activeProject, setActiveProject] = useState<SavedProject | null>(null);

  useEffect(() => {
    // Check for existing session
    const user = storageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView('dashboard');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleOpenProject = (project: SavedProject | null) => {
    setActiveProject(project);
    setCurrentView('workspace');
  };

  const handleSaveAndExit = (projectToSave: SavedProject) => {
    if (currentUser) {
      storageService.saveProject(currentUser.username, projectToSave);
    }
    setActiveProject(null);
    setCurrentView('dashboard');
  };

  if (currentView === 'login' || !currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentView === 'dashboard') {
    return (
      <DashboardPage
        user={currentUser}
        onLogout={handleLogout}
        onOpenProject={handleOpenProject}
      />
    );
  }

  if (currentView === 'workspace') {
    return (
      <Workspace
        initialProject={activeProject}
        currentUser={currentUser}
        onSaveAndExit={handleSaveAndExit}
      />
    );
  }

  return null;
}

export default App;
