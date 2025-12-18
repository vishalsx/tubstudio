// components/panels/LeftPanel.tsx
import React, { useState } from 'react';
import { Bars3Icon, ChevronDownIcon, XMarkIcon, SparklesIcon, ListBulletIcon, ArrowUpTrayIcon, PhotoIcon, MagnifyingGlassIcon, BookOpenIcon, StarIcon, StopIcon, CloudArrowUpIcon } from '@heroicons/react/24/solid';
import { CommonData, RecentTranslation, PermissionCheck, DatabaseImage, Book, Chapter, Page } from '../../types';
import { CurriculumPanel } from './CurriculumPanel';
import { useCurriculum } from '../../hooks/useCurriculum';
import { CreateBookModal } from '../curriculum/CreateBookModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useConfirmation } from '../../contexts/ConfirmationContext';

type CurriculumHookProps = ReturnType<typeof useCurriculum>;

interface LeftPanelProps {
  // View state props
  leftPanelView: 'upload' | 'database' | 'curriculum';

  // File upload props
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  languageDropdownRef: React.RefObject<HTMLDivElement | null>;
  previewUrl: string | null;
  currentCommonData: CommonData;

  // Language selection props
  selectedLanguages: string[];
  languageOptions: string[];
  isLanguageDropdownOpen: boolean;

  // Recent translations
  recentTranslations: RecentTranslation[];

  // Database search props
  searchQuery: string;
  databaseImages: DatabaseImage[];
  isSearchLoading: boolean;
  isPopularImagesLoading: boolean;
  searchAttempted: boolean;

  // Loading and error states
  isLoading: boolean;
  isWorklistLoading: boolean;
  isRedirecting: boolean;
  error: string | null;
  identifyProgress: { current: number; total: number } | null;

  // Permissions
  canUploadPicture: PermissionCheck;
  canIdentifyImage: PermissionCheck;
  canViewWorkList: PermissionCheck;

  // Event handlers
  onViewChange: (view: 'upload' | 'database' | 'curriculum') => void;
  onFileChange: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileClick: () => void;
  onLanguageToggle: (language: string) => void;
  onLanguageDropdownToggle: () => void;
  onIdentify: () => void;
  onCancelIdentify: () => void;
  onFetchWorklist: () => void;
  onThumbnailClick: (index: number) => void;
  onSearchQueryChange: (value: string) => void;
  onDatabaseSearch: (query: string) => void;
  onFetchPopularImages: () => void;
  onDatabaseImageClick: (image: DatabaseImage) => void;
  onSelectBook: (bookId: string) => void;
  onSelectPage: (page: Page) => void;
  onSelectNode: (node: Book | Chapter | Page) => void;
  onCollapseAll: () => void;

  // Collapse functionality
  className?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;

  // Curriculum props
  curriculumProps: CurriculumHookProps;
  languageForImageSearch: string;

  // Notifications
  notification: { message: string; type: 'success' | 'error' } | null;

  // Worklist callout
  showWorklistCallout?: boolean;
  onDismissCallout?: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  leftPanelView,
  fileInputRef,
  languageDropdownRef,
  previewUrl,
  currentCommonData,
  selectedLanguages,
  languageOptions,
  isLanguageDropdownOpen,
  recentTranslations,
  searchQuery,
  databaseImages,
  isSearchLoading,
  isPopularImagesLoading,
  searchAttempted,
  isLoading,
  isWorklistLoading,
  isRedirecting,
  error,
  identifyProgress,
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
  onCancelIdentify,
  onFetchWorklist,
  onThumbnailClick,
  onSearchQueryChange,
  onDatabaseSearch,
  onFetchPopularImages,
  onDatabaseImageClick,
  onSelectBook,
  onSelectPage,
  onSelectNode,
  onCollapseAll,
  className = '',
  isCollapsed,
  onToggleCollapse,
  curriculumProps,
  languageForImageSearch,
  notification,
  showWorklistCallout = false,
  onDismissCallout,
}) => {
  const [isCreateBookModalOpen, setIsCreateBookModalOpen] = useState(false);
  const confirm = useConfirmation();

  const handleCurriculumSearch = async () => {
    if (curriculumProps.isDirty) {
      const confirmed = await confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes that will be lost if you perform a new search. Are you sure you want to continue?',
        confirmText: 'Search Anyway',
        isDestructive: true,
      });
      if (!confirmed) {
        return;
      }
    }
    curriculumProps.handleSearch();
  };

  const renderViewSpecificControls = () => {
    if (leftPanelView === 'upload') {
      return (
        <div
          className={`border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 mb-3 h-32 ${canUploadPicture.metadata ? "cursor-pointer hover:border-[#00AEEF]" : "cursor-not-allowed opacity-50"
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
      );
    } else if (leftPanelView === 'database') {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 mb-3 flex flex-col">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search by object name, category, etc..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !(isSearchLoading || isPopularImagesLoading)) onDatabaseSearch(searchQuery); }}
              disabled={isSearchLoading || isPopularImagesLoading}
              className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-[#00AEEF] focus:border-[#00AEEF] disabled:bg-gray-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDatabaseSearch(searchQuery)}
              disabled={isSearchLoading || isPopularImagesLoading}
              className="w-full px-2 py-1.5 bg-[#00AEEF] text-white rounded-lg hover:bg-[#0096CC] transition flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearchLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><MagnifyingGlassIcon className="w-4 h-4 mr-1" />Search</>
              )}
            </button>
            <button
              onClick={onFetchPopularImages}
              disabled={isSearchLoading || isPopularImagesLoading}
              className="w-full px-2 py-1.5 bg-[#F15A29] text-white rounded-lg hover:bg-[#D14A23] transition flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPopularImagesLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><SparklesIcon className="w-4 h-4 mr-1" />Popular</>
              )}
            </button>
          </div>
        </div>
      );
    } else if (leftPanelView === 'curriculum') {
      return (
        <>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 mb-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 w-full">
              <select
                id="curriculum-language-select"
                value={curriculumProps.searchLanguage}
                onChange={(e) => curriculumProps.setSearchLanguage(e.target.value)}
                className="w-32 flex-shrink-0 p-1.5 border border-gray-300 rounded-md text-sm focus:ring-[#00AEEF] focus:border-[#00AEEF]"
                disabled={languageOptions.length === 0}
                aria-label="Language for Book Search"
              >
                <option value="">All Languages</option>
                {languageOptions.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
              <input
                type="text"
                placeholder="Search books..."
                value={curriculumProps.searchQuery}
                onChange={(e) => curriculumProps.setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCurriculumSearch(); }}
                className="flex-1 min-w-0 p-1.5 border border-gray-300 rounded-md text-sm focus:ring-[#00AEEF] focus:border-[#00AEEF]"
              />
            </div>
            <button
              onClick={handleCurriculumSearch}
              disabled={curriculumProps.isLoading}
              className="w-full px-3 py-2 bg-[#00AEEF] text-white rounded-lg hover:bg-[#0096CC] transition disabled:opacity-50 flex items-center justify-center gap-2"
              aria-label="Search curriculum"
            >
              {curriculumProps.isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>

          {curriculumProps.isDirty && (
            <button
              onClick={curriculumProps.saveBook}
              disabled={curriculumProps.isLoading}
              className="mb-3 w-full flex items-center justify-center space-x-2 bg-[#00AEEF] hover:bg-[#0096CC] text-white py-2 rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              <span>Save Book Changes</span>
            </button>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex-1 min-h-0 bg-gray-50/50">
            <CurriculumPanel
              books={curriculumProps.books}
              activeBook={curriculumProps.activeBook}
              isDirty={curriculumProps.isDirty}
              isLoading={curriculumProps.isLoading}
              expansionState={curriculumProps.expansionState}
              searchAttempted={curriculumProps.searchAttempted}
              onSelectBook={onSelectBook}
              onSelectPage={onSelectPage}
              onSelectNode={onSelectNode}
              onOpenCreateBookModal={() => setIsCreateBookModalOpen(true)}
              onSaveBook={curriculumProps.saveBook}
              onNodeExpansion={curriculumProps.handleNodeExpansion}
              onAddChapter={curriculumProps.addChapter}
              onDeleteChapter={curriculumProps.deleteChapter}
              onUpdateChapterName={curriculumProps.updateChapterName}
              onAddPage={curriculumProps.addPage}
              onDeletePage={curriculumProps.deletePage}
              onUpdatePageTitle={curriculumProps.updatePageTitle}
              onCollapseAll={onCollapseAll}
            />
          </div>
        </>
      );
    }
    return null;
  };

  // Logic to determine if we need horizontal scroll for database view
  const isHorizontalScroll = leftPanelView === 'database' && databaseImages.length > 9;

  return (
    <div className={`w-full bg-white rounded-lg shadow p-4 flex flex-col overflow-hidden ${className}`}>
      {/* Header with Toggle */}
      <div className="flex items-center mb-4 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
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
            <button
              onClick={() => onViewChange('curriculum')}
              title="Curriculum View"
              className={`p-2 rounded-md transition ${leftPanelView === 'curriculum' ? 'bg-blue-100 text-[#00AEEF]' : 'text-gray-600 hover:bg-gray-100 hover:text-[#00AEEF]'}`}
            >
              <BookOpenIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content (conditionally rendered) */}
      <div className={`flex-1 flex flex-col overflow-y-auto transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {renderViewSpecificControls()}

        {/* Content Area for Upload View */}
        {leftPanelView === 'upload' && (
          (previewUrl || currentCommonData?.image_base64) ? (
            <div className="mb-4">
              <div className="flex-shrink-0 h-64 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Uploaded" className="w-full h-full object-contain" />
                ) : currentCommonData?.image_base64 ? (
                  <img src={`data:image/png;base64,${currentCommonData.image_base64}`} alt="Work item" className="w-full h-full object-contain" />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center mb-4 min-h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-2 text-gray-500 italic">
              Upload an image to see a preview.
            </div>
          )
        )}

        {/* Content Area for Database View */}
        {leftPanelView === 'database' && (
          // <div className="flex-1 overflow-y-auto mb-4 min-h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-2">
          <div className={`flex-1 mb-4 min-h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-2 ${isHorizontalScroll ? 'overflow-x-auto' : 'overflow-y-auto'}`}>

            {databaseImages.length > 0 ? (
              // <div className="grid grid-cols-3 gap-2 pr-2">
              <div className={isHorizontalScroll
                ? "grid grid-rows-3 grid-flow-col gap-2 w-max" // Horizontal scroll layout
                : "grid grid-cols-3 gap-2 pr-2" // Vertical scroll layout
              }>
                {databaseImages.map((image, idx) => (
                  // <div key={image.object.image_hash || idx} className="relative group rounded-xl overflow-hidden shadow-md cursor-pointer aspect-square" onClick={() => onDatabaseImageClick(image)} title={image.common_data.object_name_en || image.file_info.filename || ''}>
                  <div key={image.object.image_hash || idx} className={`relative group rounded-xl overflow-hidden shadow-md cursor-pointer aspect-square ${isHorizontalScroll ? 'w-28' : ''}`} onClick={() => onDatabaseImageClick(image)} title={image.common_data.object_name_en || image.file_info.filename || ''}>
                    <img src={`data:image/jpeg;base64,${image.object.thumbnail}`} alt={image.common_data.object_name_en || image.file_info.filename || ''} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                      <p className="text-white font-bold text-xs text-center drop-shadow-lg truncate">{image.common_data.object_name_en || (image.file_info.filename ? image.file_info.filename.split('.').slice(0, -1).join('.') : 'Untitled')}</p>
                    </div>
                    {(image.popularity_stars !== undefined && image.total_vote_count !== undefined) && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 opacity-0 group-hover:opacity-100"><div className="flex items-center text-white"><StarIcon className="w-5 h-5 text-yellow-400" /><span className="ml-1 font-bold">{typeof image.popularity_stars === 'number' ? image.popularity_stars.toFixed(1) : ''}</span></div><span className="text-xs text-gray-200 mt-1">{image.total_vote_count} votes</span></div>)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 italic">
                {isSearchLoading || isPopularImagesLoading ? "Searching..." : searchAttempted ? 'No results found.' : 'Search results will appear here.'}
              </div>
            )}
          </div>
        )}

        {/* --- SHARED COMPONENTS (conditionally rendered) --- */}
        {leftPanelView !== 'curriculum' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1" ref={languageDropdownRef as React.RefObject<HTMLDivElement>}>
                <button
                  onClick={onLanguageDropdownToggle}
                  className="px-3 py-1 border border-gray-300 bg-white text-gray-700 rounded text-sm flex items-center justify-between focus:ring-2 focus:ring-[#00AEEF] min-w-[180px] w-full"
                >
                  <span className="truncate">
                    {selectedLanguages.length === 0 ? 'Select Languages' : `${selectedLanguages.length} selected`}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLanguageDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto min-w-[150px]">
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
              {canIdentifyImage.metadata && (
                <button
                  onClick={isLoading ? onCancelIdentify : onIdentify}
                  disabled={(!isLoading && !canIdentifyImage.metadata) || isRedirecting}
                  title={isLoading ? "Cancel Identification" : "Identify Object"}
                  className={`px-4 py-2 rounded-lg transition flex-1 flex justify-center items-center ${(!isLoading && !canIdentifyImage.metadata) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                    isLoading ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#00AEEF] text-white hover:bg-[#0096CC]'
                    }`}
                >
                  {/* {isLoading ? <StopIcon className="w-5 h-5 animate-pulse" /> : <SparklesIcon className="w-5 h-5" />} */}
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <StopIcon className="w-5 h-5 animate-pulse" />
                      {identifyProgress && (
                        <span className="text-xs font-bold">
                          {identifyProgress.current}/{identifyProgress.total}
                        </span>
                      )}
                    </div>
                  ) : (
                    <SparklesIcon className="w-5 h-5" />
                  )}

                </button>
              )}
              {canViewWorkList.language && (
                <button
                  onClick={onFetchWorklist}
                  disabled={!canViewWorkList.language || isWorklistLoading}
                  title="My Work Items"
                  className={`px-4 py-2 rounded-lg transition flex-1 flex justify-center items-center ${!canViewWorkList.language || isWorklistLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#F15A29] text-white hover:bg-[#D14A23]'}`}
                >
                  {isWorklistLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ListBulletIcon className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Worklist Callout */}
            {showWorklistCallout && (
              <div className="relative mb-4 animate-bounce">
                <div className="bg-gradient-to-r from-[#F15A29] to-[#D14A23] text-white px-4 py-2 rounded-lg shadow-lg">
                  <button
                    onClick={onDismissCallout}
                    className="absolute top-1 right-1 text-white hover:text-gray-200 transition"
                    title="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 pr-6">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium">
                      Click on fetch button for your next work items...
                    </p>
                  </div>
                </div>
                {/* Arrow pointing up to button */}
                <div className="absolute -top-2 right-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-[#F15A29]"></div>
              </div>
            )}

            {error && (
              <ErrorMessage message={error} showDog={true} className="mb-4" />
            )}

            <div className="mt-auto">
              <h3 className="font-medium mb-2">Recent Edits</h3>
              <div className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1">
                {recentTranslations.length > 0 ? (
                  recentTranslations.map((item, idx) => (
                    <div key={idx} className="flex-shrink-0 w-28 bg-gray-100 rounded-lg overflow-hidden flex flex-col items-center shadow-md transition-transform hover:scale-105">
                      <div className="h-24 w-full">
                        <img
                          src={`data:image/jpeg;base64,${item.object.thumbnail}`}
                          alt="thumbnail"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                          onClick={canUploadPicture.metadata ? () => onThumbnailClick(idx) : undefined}
                        />
                      </div>
                      <div className="p-1.5 text-center w-full">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={item.translation.requested_language}>{item.translation.requested_language}</p>
                        <p className="text-xs text-gray-600 truncate" title={item.translation.translation_status}>{item.translation.translation_status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  [...Array(3)].map((_, idx) => (
                    <div key={idx} className="flex-shrink-0 w-28 h-36 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Notification Area */}
      {notification && (
        <div className={`mt-2 p-2 rounded-md text-sm transition-opacity duration-300 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {isCreateBookModalOpen && (
        <CreateBookModal
          isOpen={isCreateBookModalOpen}
          onClose={() => setIsCreateBookModalOpen(false)}
          onCreate={curriculumProps.createBook}
          languageOptions={languageOptions}
        />
      )}
    </div>
  );
};