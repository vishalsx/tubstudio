import React from 'react';
import { UserContext } from '../../types';
import { ChevronDownIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, CircleStackIcon, BookOpenIcon, TrophyIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { useTheme, ThemeType } from '../../contexts/ThemeContext';

interface HeaderProps {
  userContext: UserContext | null;
  onLogout: () => void;
  onViewChange?: (view: 'upload' | 'database' | 'curriculum' | 'contest' | 'my_content') => void;
}

export const Header: React.FC<HeaderProps> = ({ userContext, onLogout, onViewChange }) => {
  const { theme, setTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);
  const [showRepositorySettings, setShowRepositorySettings] = React.useState(false);
  const [repositoryLimit, setRepositoryLimit] = React.useState(25);
  const [useVectorSearch, setUseVectorSearch] = React.useState(true);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Load repository settings on mount
  React.useEffect(() => {
    try {
      const settings = localStorage.getItem('repository_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setRepositoryLimit(parsed.limit || 25);
        // Default to true if undefined
        setUseVectorSearch(parsed.use_vector_search !== false);
      }
    } catch (e) {
      console.error('Failed to load repository settings:', e);
    }
  }, []);

  // Save repository settings
  const saveRepositorySettings = () => {
    try {
      const settings = {
        limit: repositoryLimit,
        use_vector_search: useVectorSearch
      };
      localStorage.setItem('repository_settings', JSON.stringify(settings));
      setShowRepositorySettings(false);

      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to save repository settings:', e);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { label: 'Create Content', icon: PaintBrushIcon, onClick: () => onViewChange?.('upload') },
    { label: 'Curriculum', icon: BookOpenIcon, onClick: () => onViewChange?.('curriculum') },
    { label: 'Contest', icon: TrophyIcon, onClick: () => onViewChange?.('contest') },
    { label: 'Settings', icon: Cog6ToothIcon, onClick: () => setShowRepositorySettings(true) },
  ];

  const initials = userContext?.username?.substring(0, 2).toUpperCase() || 'VS';

  return (
    <header className="bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm h-16 px-6 flex justify-between items-center relative z-50 transition-all duration-300">
      {/* Left section: App logo */}
      <div className="flex items-center">
        <div className="p-1 px-3">
          <img
            src="/U-Logo.png"
            alt="alphaTUB - TUBShots with AI"
            className="h-9 object-contain"
          />
        </div>
      </div>

      {/* Middle section: Organization info */}
      <div className="flex-1 flex justify-center items-center px-4">
        {userContext?.org_name && userContext?.logo_url ? (
          <div className="flex items-center space-x-3 bg-[var(--bg-input)] px-4 py-1.5 rounded-full border border-[var(--border-main)] shadow-sm">
            <img src={userContext.logo_url} alt={`${userContext.org_name} logo`} className="h-6 object-contain" />
            <span className="text-sm font-semibold text-[var(--text-main)] tracking-tight">{userContext.org_name}</span>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">Register your organisation to see full features.</p>
        )}
      </div>

      {/* Right section: User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center space-x-2 group p-1 rounded-full hover:bg-[var(--bg-input)] transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center text-white font-bold border-2 border-[var(--border-main)] shadow-sm">
            <span className="text-sm tracking-tight">{initials}</span>
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
        </button>

        {isProfileOpen && (
          <div className="absolute top-14 right-0 w-64 bg-[var(--bg-panel)] text-[var(--text-main)] rounded-2xl shadow-2xl border border-[var(--border-main)] py-3 mt-2 animate-in fade-in zoom-in duration-200">
            <div className="px-5 py-3 border-b border-gray-50 mb-2 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center text-white font-bold">
                <span className="text-xs">{initials}</span>
              </div>
              <div>
                <p className="font-bold text-[var(--text-main)] text-sm leading-tight">{userContext?.username || 'User'}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{userContext?.roles || 'Role'}</p>
              </div>
            </div>

            <div className="px-4 py-1">
              <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest px-1 mb-2">Main Menu</p>

              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="border-t border-gray-100 mt-2 pt-2">
                <p className="text-[10px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-widest px-5 mb-1">Skin Themes</p>
                <div className="grid grid-cols-2 gap-2 px-4 py-2">
                  {[
                    { id: 'sky', label: 'Sky', color: 'bg-[#00AEEF]' },
                    { id: 'midnight', label: 'Dark', color: 'bg-[#1e293b]' },
                    { id: 'clean', label: 'Clean', color: 'bg-white border' },
                    { id: 'forest', label: 'Forest', color: 'bg-[#065f46]' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as ThemeType)}
                      className={`flex items-center space-x-2 p-1.5 rounded-lg border transition-all ${theme === t.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-[var(--border-main)] hover:border-gray-300'} text-[var(--text-main)]`}
                      title={`${t.label} Theme`}
                    >
                      <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
                      <span className="text-[10px] font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Repository Settings Modal */}
      {showRepositorySettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-panel)] rounded-2xl shadow-2xl border border-[var(--border-main)] p-6 max-w-md w-full mx-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-main)]">Personalisation</h2>
              <button
                onClick={() => setShowRepositorySettings(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                  Number of Images to display
                </label>
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={repositoryLimit}
                  onChange={(e) => setRepositoryLimit(Math.min(50, Math.max(10, Number(e.target.value))))}
                  className="w-full px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                />
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Choose between 10 and 50 images per page
                </p>
              </div>

              {/* Vector Search Toggle */}
              <div className="flex items-center justify-between p-3 bg-[var(--bg-input)] rounded-lg border border-[var(--border-main)]">
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-main)]">Enable Vector Search</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Use AI-powered semantic search instead of simple text matching</p>
                </div>
                <button
                  onClick={() => setUseVectorSearch(!useVectorSearch)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useVectorSearch ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
                  role="switch"
                  aria-checked={useVectorSearch}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useVectorSearch ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--border-main)]">
                <button
                  onClick={() => setShowRepositorySettings(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRepositorySettings}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};