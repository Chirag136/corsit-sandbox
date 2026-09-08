import React, { useState } from 'react';
import { User, storageService } from '../../services/storageService';


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
        <div className="w-24 h-24 mb-6 flex items-center justify-center">
          <img
            src={`${import.meta.env.BASE_URL}corsit-logo-transparent.png`}
            alt="CorSIT Logo"
            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
          />
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
