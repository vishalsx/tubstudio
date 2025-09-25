// pages/LoginPage.tsx
import React, { useState } from 'react';
import { UserContext } from '../types';

interface LoginPageProps {
  authData: {
    isLoggedIn: boolean | null;
    userContext: UserContext | null;
    loginError: string | null;
    languageOptions: string[];
    isRedirecting: boolean;
    setIsRedirecting: (value: boolean) => void;
    login: (username: string, password: string) => Promise<UserContext>;
    logout: () => void;
    fetchRecentTranslations: (username: string) => Promise<any[]>;
  };
}

export const LoginPage: React.FC<LoginPageProps> = ({ authData }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { login, loginError } = authData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      // If login is successful, the App component will handle the redirect
    } catch (error) {
      // Error is handled by the useAuth hook
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#BBBBBB] via-[#E6F7FC] to-[#FDE6E0] flex items-center justify-center text-gray-900 font-sans antialiased">
      <div className="border-dashed border-teal-800 bg-gradient-to-br from-[#BBBBBB] via-[#E6F7FC] to-[#FDE6E0] p-8 rounded-2xl shadow-lg w-96 animate-fade-in">
        
        {/* Header */}
        <h2 className="text-3xl font-extrabold text-center mb-6">
          <p className="text-4xl font-extrabold tracking-wide text-[#00AEEF]">
            alpha<span className="text-[#F15A29]">TUB</span><span className="text-[#00AEEF]"> Studio</span>
          </p>
        </h2>

        {/* Error Message */}
        {loginError && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-200 text-sm shadow-inner">
            {loginError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 mb-4 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-teal-500"
            required
            disabled={isLoading}
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 mb-6 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-teal-500"
            required
            disabled={isLoading}
          />

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className="w-full bg-gradient-to-r from-[#E6F7FC] via-[#00AEEF] to-[#C8E6F9] text-[#003B57] p-3 rounded-lg font-semibold tracking-wide shadow-md hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#003B57] border-t-transparent rounded-full animate-spin mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};