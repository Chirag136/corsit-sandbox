import React, { useState, useEffect } from 'react';
import { User, SavedProject, storageService } from '../../services/storageService';
import { Plus, Trash2, Clock, Play } from 'lucide-react';
import { EMPTY_CIRCUIT } from '../../data/presetCircuits';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
  onOpenProject: (project: SavedProject | null) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout, onOpenProject }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = () => {
    setProjects(storageService.getSavedProjects(user.username));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      storageService.deleteProject(user.username, id);
      loadProjects();
    }
  };

  return (
    <div className="min-h-screen bg-base text-white p-8">
      <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}corsit-logo-transparent.png`}
                alt="CorSIT Logo"
                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans">CorSIT Dashboard</h1>
              <p className="text-xs text-muted">Welcome back, {user.username}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-sm font-medium text-muted hover:text-white transition-colors border border-trace px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </header>

        <main>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            <button
              onClick={() => onOpenProject(null)}
              className="flex items-center gap-2 bg-red hover:bg-red-600 text-white px-4 py-2 rounded shadow-lg transition-colors"
            >
              <Plus size={18} />
              <span>New Project</span>
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-panel border border-trace border-dashed rounded-xl p-12 text-center text-muted flex flex-col items-center">
              <img
                src={`${import.meta.env.BASE_URL}corsit-logo-transparent.png`}
                alt="CorSIT Logo"
                className="h-16 w-auto mb-4 opacity-30 grayscale"
              />
              <p>You don't have any saved projects yet.</p>
              <p className="text-sm mt-2">Click "New Project" to start building.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onOpenProject(proj)}
                  className="bg-panel border border-trace hover:border-red/50 rounded-xl p-5 cursor-pointer group transition-all hover:shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold truncate pr-2">{proj.name}</h3>
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="text-muted hover:text-red p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted mb-4">
                    <Clock size={12} />
                    <span>Last edited: {new Date(proj.lastModified).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Play size={12} />
                    <span>{proj.circuit.components.length} Components</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
