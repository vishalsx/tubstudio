// components/layout/Header.tsx
import React from 'react';
import { UserContext } from '../../types';

interface HeaderProps {
  userContext: UserContext | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userContext, onLogout }) => {
  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      {/* Left section: User info */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00AEEF] to-[#F15A29] flex items-center justify-center text-white font-bold">
          {userContext?.username?.substring(0, 2).toUpperCase() || 'VS'}
        </div>
        <div>
          <p className="font-medium">{userContext?.username || 'User'}</p>
          <p className="text-sm text-gray-500">{userContext?.roles || 'Role'}</p>
        </div>
      </div>
      
      {/* Middle section: Organization info */}
      <div className="flex-1 flex justify-center items-center px-4">
        {userContext?.org_name && userContext?.logo_url ? (
          <div className="flex items-center space-x-3">
            <img src={userContext.logo_url} alt={`${userContext.org_name} logo`} className="h-10 object-contain" />
            <span className="text-lg font-semibold text-gray-700">{userContext.org_name}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Register your organisation to see full features.</p>
        )}
      </div>

      {/* Right section: App logo and logout */}
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-lg bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF]">
          <img
            src="/U-Logo.png"
            alt="alphaTUB - TUBShots with AI"
            className="h-12 object-contain"
          />
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};