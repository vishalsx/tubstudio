// components/panels/LeftPanel.tsx
import React from 'react';
import { Bars3Icon, ChevronDownIcon, XMarkIcon, SparklesIcon, ListBulletIcon, ArrowUpTrayIcon, PhotoIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/solid';
import { CommonData, RecentTranslation, PermissionCheck, DatabaseImage } from '../../types';

interface LeftPanelProps {
  // View state props
  leftPanelView: 'upload' | 'database';

  // File upload props
  file: File | null;
  previewUrl: string | null;
  currentCommonData: CommonData;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  languageDropdownRef: React.RefObject<HTMLDivElement>;
  
  // Language selection props
  selectedLanguages: string[];
  languageOptions: string[];
  isLanguageDropdownOpen: boolean;
  
  // Recent translations
  recentTranslations: RecentTranslation[];
  
  // Database search props
  searchQuery: string;
  databaseImages: DatabaseImage[];

  // Loading and error states
  isLoading: boolean;
  isWorklistLoading: boolean;
  isRedirecting: boolean;
  isPopularImagesLoading: boolean;
  isSearchLoading: boolean;
  error: string | null;
  
  // Permissions
  canUploadPicture: PermissionCheck;
  canIdentifyImage: PermissionCheck;
  canViewWorkList: PermissionCheck;
  
  // Event handlers
  onViewChange: (view: 'upload' | 'database') => void;
  onFileChange: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileClick: () => void;
  onLanguageToggle: (language: string) => void;
  onLanguageDropdownToggle: () => void;
  onIdentify: () => void;
  onFetchWorklist: () => void;
  onThumbnailClick: (index: number) => void;
  onSearchQueryChange: (value: string) => void;
  onDatabaseSearch: (query: string) => void;
  onDatabaseImageClick: (image: DatabaseImage) => void;
  onFetchPopularImages: () => void;

  // New props for collapse functionality
  className?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  leftPanelView,
  file,
  previewUrl,
  currentCommonData,
  fileInputRef,
  languageDropdownRef,
  selectedLanguages,
  languageOptions,
  isLanguageDropdownOpen,
  recentTranslations,
  searchQuery,
  databaseImages,
  isLoading,
  isWorklistLoading,
  isRedirecting,
  isPopularImagesLoading,
  isSearchLoading,
  error,
  canUploadPicture,
  canIdentifyImage,
  canViewWorkList,
  onViewChange,
  onFileChange,
  onDrop,
  onFileClick,
  onLanguageToggle,
  onLanguageDropdownToggle,
  onIdentify,
  onFetchWorklist,
  onThumbnailClick,
  onSearchQueryChange,
  onDatabaseSearch,
  onDatabaseImageClick,
  onFetchPopularImages,
  className = '',
  isCollapsed,
  onToggleCollapse,
}) => {
  const renderSwappableTopSection = () => {
    if (leftPanelView === 'upload') {
      return (
        <>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 mb-3 h-32 ${
              canUploadPicture.metadata ? "cursor-pointer hover:border-[#00AEEF]" : "cursor-not-allowed opacity-50"
            }`}
            onDragOver={(e) => canUploadPicture.metadata && e.preventDefault()}
            onDrop={(e) => canUploadPicture.metadata && onDrop(e)}
            onClick={() => canUploadPicture.metadata && onFileClick()}
          >
            <p className="text-gray-500 text-sm mb-1">Drag & drop your image here</p>
            <p className="text-xs text-gray-400 mb-2">or</p>
            <button className="px-3 py-1 bg-[#00AEEF] text-white rounded text-sm hover:bg-[#0096CC] transition">
              Browse Files
            </button>
            <input
              type="file"
              ref={fileInputRef as React.RefObject<HTMLInputElement>}
              accept=".jpg,.jpeg,.png,.heic,.heif,.webp,.gif,.bmp,.tiff,.tif"
              className="hidden"
              onChange={(e) => {
                if (!canUploadPicture.metadata) return;
                const file = e.target.files?.[0];
                if (!file) return;
                onFileChange(file);
              }}
            />
          </div>

          {/* Preview Image */}
          {previewUrl ? (
            <div className="mb-4">
              <img src={previewUrl} alt="Uploaded" className="w-full h-auto object-contain rounded-lg animate-fade-in max-h-[500px]" />
            </div>
          ) : currentCommonData?.image_base64 ? (
            <div className="mb-4">
              <img
                src={`data:image/png;base64,${currentCommonData.image_base64}`}
                alt="Work item"
                className="w-full h-auto object-contain rounded-lg animate-fade-in max-h-64"
              />
            </div>
          ) : (
            <div className="mb-4 bg-gray-100 rounded-lg flex items-center justify-center h-48">
              <p className="text-gray-400">Selected image preview</p>
            </div>
          )}
        </>
      );
    }
    
    // Database View
    return (
      <>
        {/* Search Filters Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 mb-3 flex flex-col">
          {/* Unified Search Input */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search by object name, category, etc..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onDatabaseSearch(searchQuery);
                }
              }}
              className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-[#00AEEF] focus:border-[#00AEEF]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDatabaseSearch(searchQuery);
              }}
              disabled={isSearchLoading || isPopularImagesLoading}
              className="w-full px-2 py-1.5 bg-[#00AEEF] text-white rounded-lg hover:bg-[#0096CC] transition flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearchLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                  Search
                </>
              )}
            </button>
            <button
              onClick={onFetchPopularImages}
              disabled={isPopularImagesLoading || isSearchLoading}
              className="w-full px-2 py-1.5 bg-[#F15A29] text-white rounded-lg hover:bg-[#D14A23] transition flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPopularImagesLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-1" />
                  Popular
                </>
              )}
            </button>
          </div>
        </div>


        {/* Database Image Grid */}
        <div className={`mb-4 ${databaseImages.length === 0 ? 'h-64 border-2 border-dashed border-gray-300 rounded-lg' : ''}`}>
          {databaseImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {databaseImages.slice(0, 9).map((image, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden shadow-md cursor-pointer h-24"
                  onClick={() => onDatabaseImageClick(image)}
                  title={image.common_data.object_name_en || image.file_info.filename || ''}
                >
                  <img
                    src={`data:image/jpeg;base64,${image.object.thumbnail}`}
                    alt={image.common_data.object_name_en || image.file_info.filename || ''}
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                  />
                  {/* Permanent Text Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                    <p className="text-white font-bold text-xs text-center drop-shadow-lg truncate">
                      {image.common_data.object_name_en || (image.file_info.filename ? image.file_info.filename.split('.').slice(0, -1).join('.') : 'Untitled')}
                    </p>
                  </div>
                  
                  {/* Hover Overlay for Stars and Votes */}
                  {(image.popularity_stars !== undefined && image.total_vote_count !== undefined) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                      <div className="flex items-center text-white">
                        <StarIcon className="w-5 h-5 text-yellow-400" />
                        <span className="ml-1 font-bold">{typeof image.popularity_stars === 'number' ? image.popularity_stars.toFixed(1) : ''}</span>
                      </div>
                      <span className="text-xs text-gray-200 mt-1">{image.total_vote_count} votes</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 italic">
              Search to see results
            </div>
          )}
        </div>
      </>
    );
  };
  
  return (
    <div className={`w-full bg-white rounded-lg shadow p-4 flex flex-col overflow-hidden ${className}`}>
      {/* Header with Toggle */}
      <div className="flex items-center mb-4 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 transition md:block"
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* Header Content (conditionally rendered) */}
        <div className={`flex justify-between items-center w-full ml-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <h2 className="text-lg font-semibold flex items-center whitespace-nowrap">
            <span className="text-[#00AEEF]">Take </span>
            <span className="text-[#F15A29] ml-1">TUB</span>
            <span className="text-[#00AEEF] ml-1"> Shot</span>
          </h2>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onViewChange('upload')}
              title="Upload View"
              className={`p-2 rounded-md transition ${leftPanelView === 'upload' ? 'bg-blue-100 text-[#00AEEF]' : 'text-gray-600 hover:bg-gray-100 hover:text-[#00AEEF]'}`}
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewChange('database')}
              disabled={!canUploadPicture.metadata || !canIdentifyImage.metadata}
              title={!canUploadPicture.metadata || !canIdentifyImage.metadata ? "You need upload and identify permissions to view the database" : "Database View"}
              className={`p-2 rounded-md transition ${leftPanelView === 'database' ? 'bg-blue-100 text-[#00AEEF]' : 'text-gray-600 hover:bg-gray-100 hover:text-[#00AEEF]'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content (conditionally rendered) */}
      <div className={`flex-1 flex flex-col transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {renderSwappableTopSection()}

        {/* --- SHARED COMPONENTS --- */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative" ref={languageDropdownRef}>
            <button
              onClick={onLanguageDropdownToggle}
              className="px-3 py-1 border border-gray-300 bg-white text-gray-700 rounded text-sm flex items-center justify-between focus:ring-2 focus:ring-[#00AEEF] min-w-[180px]"
            >
              <span className="truncate">
                {selectedLanguages.length === 0 ? 'Select Languages' : `${selectedLanguages.length} selected`}
              </span>
              <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLanguageDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto min-w-[150px]">
                {languageOptions.map((language) => (
                  <label key={language} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(language)}
                      onChange={() => onLanguageToggle(language)}
                      className="mr-3 rounded border-gray-300 text-[#00AEEF] focus:ring-[#00AEEF]"
                    />
                    <span className="text-gray-700">{language}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onIdentify}
            disabled={isLoading || !canIdentifyImage.metadata || isRedirecting}
            title="Identify Object"
            className={`px-4 py-2 rounded-lg transition flex justify-center items-center ${isLoading || !canIdentifyImage.metadata ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#00AEEF] text-white hover:bg-[#0096CC]'}`}
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={onFetchWorklist}
            disabled={!canViewWorkList.language || isWorklistLoading}
            title="My Work Items"
            className={`px-4 py-2 rounded-lg transition flex justify-center items-center ${!canViewWorkList.language || isWorklistLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#F15A29] text-white hover:bg-[#D14A23]'}`}
          >
            {isWorklistLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ListBulletIcon className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border-l-4 border-red-500">
            <p className="font-medium text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-medium mb-2">Latest Edits</h3>
          <div className="grid grid-cols-3 gap-2">
            {recentTranslations.length > 0 ? (
              recentTranslations.map((item, idx) => (
                <div key={idx} className="bg-gray-100 rounded overflow-hidden flex flex-col items-center shadow">
                  <div className="h-24 w-full">
                    <img
                      src={`data:image/jpeg;base64,${item.object.thumbnail}`}
                      alt="thumbnail"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                      onClick={canUploadPicture.metadata ? () => onThumbnailClick(idx) : undefined}
                    />
                  </div>
                  <div className="p-2 text-center">
                    <p className="text-xs font-medium">{item.translation.requested_language}</p>
                    <p className="text-xs text-gray-600">{item.translation.translation_status}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};