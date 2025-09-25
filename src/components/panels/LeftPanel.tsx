// components/panels/LeftPanel.tsx
import React from 'react';
import { ChevronDownIcon, XMarkIcon, SparklesIcon, ListBulletIcon } from '@heroicons/react/24/solid';
import { CommonData, RecentTranslation, PermissionCheck } from '../../types';

interface LeftPanelProps {
  // File upload props
  file: File | null;
  previewUrl: string | null;
  currentCommonData: CommonData;
  // fileInputRef: React.RefObject<HTMLInputElement>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  // Language selection props
  selectedLanguages: string[];
  languageOptions: string[];
  isLanguageDropdownOpen: boolean;
  
  // Recent translations
  recentTranslations: RecentTranslation[];
  
  // Loading and error states
  isLoading: boolean;
  isRedirecting: boolean;
  error: string | null;
  
  // Permissions (using the correct index values)
  canUploadPicture: PermissionCheck;
  canIdentifyImage: PermissionCheck;
  canViewWorkList: PermissionCheck;
  
  // Event handlers
  onFileChange: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileClick: () => void;
  onLanguageToggle: (language: string) => void;
  onLanguageDropdownToggle: () => void;
  onIdentify: () => void;
  onFetchWorklist: () => void;
  onThumbnailClick: (index: number) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  file,
  previewUrl,
  currentCommonData,
  fileInputRef,
  selectedLanguages,
  languageOptions,
  isLanguageDropdownOpen,
  recentTranslations,
  isLoading,
  isRedirecting,
  error,
  canUploadPicture,
  canIdentifyImage,
  canViewWorkList,
  onFileChange,
  onDrop,
  onFileClick,
  onLanguageToggle,
  onLanguageDropdownToggle,
  onIdentify,
  onFetchWorklist,
  onThumbnailClick
}) => {
  return (
    <div className="w-full md:w-1/3 bg-white rounded-lg shadow p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="text-[#00AEEF]">Take </span>
        <span className="text-[#F15A29] ml-1">TUB</span>
        <span className="text-[#00AEEF] ml-1"> Shot</span>
      </h2>
      
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 mb-3 max-h-32 ${
          canUploadPicture.metadata ? "cursor-pointer hover:border-[#00AEEF]" : "cursor-not-allowed opacity-50"
        }`}
        onDragOver={(e) => canUploadPicture.metadata && e.preventDefault()}
        onDrop={(e) => canUploadPicture.metadata && onDrop(e)}
        onClick={() => canUploadPicture.metadata && onFileClick()}
      >
        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p className="text-gray-500 mb-2">Drag & drop your image here</p>
        <p className="text-sm text-gray-400 mb-4">or</p>
        <button className="px-4 py-2 bg-[#00AEEF] text-white rounded hover:bg-[#0096CC] transition">
          Browse Files
        </button>
        <input
          type="file"
          ref={fileInputRef}
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

      {/* Controls Row - Language Multi-Select and Action Buttons */}
      <div className="flex items-center gap-2 mb-4">
        {/* Language Multi-Select */}
        <div className="relative">
          <button
            onClick={onLanguageDropdownToggle}
            className="px-3 py-1 border border-gray-300 bg-white text-gray-700 rounded text-sm flex items-center justify-between focus:ring-2 focus:ring-[#00AEEF] min-w-[180px]"
          >
            <span className="truncate">
              {selectedLanguages.length === 0
                ? 'Select Languages'
                : `${selectedLanguages.length} selected`
              }
            </span>
            <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLanguageDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto min-w-[150px]">
              {languageOptions.map((language) => (
                <label
                  key={language}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
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

        {/* Identify Image Button */}
        <button
          onClick={onIdentify}
          disabled={isLoading || !canIdentifyImage.metadata || isRedirecting}
          className={`px-4 py-2 rounded-lg transition ${
            isLoading || !canIdentifyImage.metadata
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#00AEEF] text-white hover:bg-[#0096CC]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            <SparklesIcon className="w-5 h-5" />
          )}
        </button>

        {/* Worklist Button */}
        <button
          onClick={onFetchWorklist}
          disabled={!canViewWorkList.language}
          title="My Work Items"
          className={`px-4 py-2 rounded-lg transition ${
            !canViewWorkList.language
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#F15A29] text-white hover:bg-[#D14A23]'
          }`}
        >
          <ListBulletIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border-l-4 border-red-500">
          <p className="font-medium text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Recent Uploads */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Latest Edits</h3>
        <div className="grid grid-cols-3 gap-2">
          {recentTranslations.length > 0 ? (
            recentTranslations.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-100 rounded overflow-hidden flex flex-col items-center shadow"
              >
                {/* Thumbnail */}
                <div className="aspect-square w-full">
                  <img
                    src={`data:image/jpeg;base64,${item.object.thumbnail}`}
                    alt="thumbnail"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                    onClick={
                      canUploadPicture.metadata
                        ? () => onThumbnailClick(idx)
                        : undefined
                    }
                  />
                </div>

                {/* Details */}
                <div className="p-2 text-center">
                  <p className="text-xs font-medium">
                    {item.translation.requested_language}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.translation.translation_status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="aspect-square bg-gray-200 rounded"></div>
              <div className="aspect-square bg-gray-200 rounded"></div>
              <div className="aspect-square bg-gray-200 rounded"></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};