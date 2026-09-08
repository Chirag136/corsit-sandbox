import React, { useState } from 'react';
import { User, storageService } from '../../services/storageService';
import { Bot } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      const user = storageService.login(username.trim());
      onLogin(user);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base text-white p-4">
      <div className="w-full max-w-md bg-panel p-8 rounded-xl shadow-2xl border border-trace flex flex-col items-center">
        <div className="w-16 h-16 bg-red/20 text-red rounded-full flex items-center justify-center mb-6">
          <Bot size={32} />
        </div>
        <h1 className="text-2xl font-bold font-sans tracking-tight mb-2 text-center">
          CorSIT Sandbox
        </h1>
        <p className="text-muted text-sm text-center mb-8">
          Enter a username to save and load your circuits locally.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-4">
            <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-base border border-trace rounded px-4 py-2 text-white focus:outline-none focus:border-red transition-colors"
              placeholder="e.g., Maker123"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-red hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Building
          </button>
        </form>
      </div>
    </div>
  );
};
