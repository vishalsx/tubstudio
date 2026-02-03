// components/panels/LeftPanel.tsx
import React, { useState } from 'react';
import { Bars3Icon, ChevronDownIcon, XMarkIcon, SparklesIcon, ListBulletIcon, ArrowUpTrayIcon, PhotoIcon, MagnifyingGlassIcon, BookOpenIcon, StarIcon, StopIcon, CloudArrowUpIcon, CircleStackIcon, TrophyIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { CommonData, RecentTranslation, PermissionCheck, DatabaseImage, Book, Chapter, Page, OrgObject, RepositoryItem } from '../../types';
import { CurriculumPanel } from './CurriculumPanel';
import { useCurriculum } from '../../hooks/useCurriculum';
import { CreateBookModal } from '../curriculum/CreateBookModal';
import { ContestListPanel } from './contest/ContestListPanel';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useConfirmation } from '../../contexts/ConfirmationContext';

type CurriculumHookProps = ReturnType<typeof useCurriculum>;
import { useContest } from '../../hooks/useContest';
import { useMyContent } from '../../hooks/useMyContent';

type MyContentHookProps = ReturnType<typeof useMyContent>;

interface LeftPanelProps {
  // View state props
  leftPanelView: 'upload' | 'database' | 'curriculum' | 'contest' | 'my_content';

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
  onViewChange: (view: 'upload' | 'database' | 'curriculum' | 'my_content') => void;
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
  onRepositoryImageClick: (item: RepositoryItem) => void;
  onSelectBook: (bookId: string) => void;
  onSelectChapter: (chapter: Chapter) => void;
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

  // Contest props
  contestProps: ReturnType<typeof useContest>;

  // My Content props
  myContentProps: MyContentHookProps;

  // Gallery Pagination
  galleryPage?: number;
  galleryHasMore?: boolean;
  onGalleryNext?: () => void;
  onGalleryPrevious?: () => void;
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
  onRepositoryImageClick,
  galleryPage,
  galleryHasMore,
  onGalleryNext,
  onGalleryPrevious,
  onSelectBook,
  onSelectChapter,
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
  contestProps,
  myContentProps,
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

  const renderMyContentPanel = () => {
    const { items, totalCount, currentPage, totalPages, pageCache, searchQuery, setSearchQuery, selectedLanguage, setSelectedLanguage, handleSearch, isLoading, isJumping, error, handleNext, handlePrevious, jumpToPage } = myContentProps;

    // Calculate items display range
    const startItem = totalCount > 0 ? (currentPage - 1) * myContentProps.limit + 1 : 0;
    const endItem = Math.min(currentPage * myContentProps.limit, totalCount);

    return (
      <div className="flex flex-col h-full animate-fade-in pr-1">
        <div className="space-y-4 mb-5 p-1">
          {/* Search Row: Language + Keywords */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="relative" ref={languageDropdownRef as React.RefObject<HTMLDivElement>}>
                <button
                  onClick={onLanguageDropdownToggle}
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-sm flex items-center justify-between text-[var(--text-main)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                >
                  <span className="truncate font-medium">{selectedLanguage}</span>
                  <ChevronDownIcon className={`w-3 h-3 transition-transform text-[var(--color-primary)] flex-shrink-0 ml-1 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLanguageDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto backdrop-blur-md">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          onLanguageDropdownToggle();
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors ${selectedLanguage === lang ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold' : 'text-[var(--text-main)]'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-[1.5] min-w-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 font-medium shadow-sm"
                />
                <MagnifyingGlassIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--color-primary)]" />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearch(searchQuery)}
            disabled={isLoading || isJumping}
            className="w-full px-2 py-1.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isJumping ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <><MagnifyingGlassIcon className="w-4 h-4 mr-1" />Search Repository</>
            )}
          </button>
        </div>

        {/* Thumbnail Grid - 3 rows with horizontal scrolling */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-input)] rounded-lg border border-[var(--border-main)] p-2 min-h-0 shadow-inner flex flex-col">
          <div className="flex items-center justify-between px-2 mb-3">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Metadata Repository ({totalCount})</h3>
            {(isLoading || isJumping) && <LoadingSpinner size="sm" />}
          </div>

          {error ? (
            <div className="px-2 py-4 text-[10px] text-red-500 font-bold italic bg-red-500/10 rounded-lg border border-red-500/20 m-1">{error}</div>
          ) : items.length > 0 ? (
            <div className={`grid grid-rows-3 grid-flow-col gap-3 p-1 ${items.length > 3 ? 'overflow-x-auto' : ''} w-max`}>
              {items.map((item: RepositoryItem) => (
                <button
                  key={item.translation_id}
                  onClick={() => onRepositoryImageClick(item)}
                  title={item.object_name}
                  className="relative w-28 aspect-square rounded-xl overflow-hidden border-2 transition-all group hover:border-[var(--color-primary-light)] border-white/5 hover:shadow-md"
                >
                  {item.thumbnail ? (
                    <img src={`data:image/jpeg;base64,${item.thumbnail}`} alt={item.object_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-panel)] text-[var(--color-primary)]/40">
                      <PhotoIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1.5 pt-4">
                    <p className="text-[8px] font-black text-white truncate text-center uppercase tracking-tighter">{item.object_name}</p>
                  </div>
                  {/* Status indicator with color-coded dots */}
                  {item.translation_status && (
                    <div className="absolute top-1 right-1">
                      {item.translation_status === 'Approved' && (
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 border border-white/20" title="Approved" />
                      )}
                      {item.translation_status === 'Verified' && (
                        <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 border border-white/20" title="Verified" />
                      )}
                      {item.translation_status === 'Released' && (
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 border border-white/20" title="Released" />
                      )}
                      {item.translation_status === 'Draft' && (
                        <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 border border-white/20" title="Draft" />
                      )}
                      {!['Approved', 'Verified', 'Released', 'Draft'].includes(item.translation_status) && (
                        <div className="w-3 h-3 rounded-full bg-gray-400 shadow-lg shadow-gray-400/50 border border-white/20" title={item.translation_status} />
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <CircleStackIcon className="w-8 h-8 text-[var(--text-muted)] mb-2 opacity-20" />
              <p className="text-[10px] text-[var(--text-muted)] italic font-bold uppercase tracking-tight opacity-40">Search stream inactive. Enter parameters to query.</p>
            </div>
          )}
        </div>

        {/* Enhanced Pagination Controls */}
        {totalPages > 0 && (
          <div className="mt-3 px-1">
            {/* Page info and dropdown */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-[var(--text-muted)] font-mono">
                Showing {startItem}-{endItem} of {totalCount}
              </span>

              {/* Page Selector Dropdown */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">Page</span>
                  <select
                    value={currentPage}
                    onChange={(e) => jumpToPage(Number(e.target.value))}
                    disabled={isLoading || isJumping}
                    className="px-2 py-0.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded text-[10px] font-black text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all disabled:opacity-50"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <option key={page} value={page}>
                        {page} {pageCache.has(page) ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">of {totalPages}</span>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1 || isLoading || isJumping}
                  className="text-[9px] font-black text-[var(--color-primary)] disabled:text-[var(--text-muted)] uppercase tracking-widest disabled:opacity-30 hover:underline disabled:hover:no-underline transition"
                >
                  ← Back
                </button>
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                </div>
                <button
                  onClick={handleNext}
                  disabled={currentPage >= totalPages || isLoading || isJumping}
                  className="text-[9px] font-black text-[var(--color-primary)] disabled:text-[var(--text-muted)] uppercase tracking-widest disabled:opacity-30 hover:underline disabled:hover:no-underline transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderViewSpecificControls = () => {
    if (leftPanelView === 'upload') {
      return (
        <div
          className={`border-2 border-dashed border-[var(--border-main)] rounded-lg flex flex-col items-center justify-center p-4 mb-3 h-32 backdrop-blur-sm ${canUploadPicture.metadata ? "cursor-pointer hover:border-[var(--color-primary)] bg-[var(--bg-input)]" : "cursor-not-allowed opacity-50 bg-[var(--bg-panel)]"
            }`}
          onDragOver={(e) => canUploadPicture.metadata && e.preventDefault()}
          onDrop={(e) => canUploadPicture.metadata && onDrop(e)}
          onClick={() => canUploadPicture.metadata && onFileClick()}
        >
          <p className="text-[var(--text-muted)] text-sm mb-1">Drag & drop your image here</p>
          <p className="text-xs text-[var(--text-muted)] opacity-60 mb-2">or</p>
          <button className="px-3 py-1 bg-[var(--color-primary)] text-white rounded text-sm hover:opacity-90 transition">
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
        <div className="border border-[var(--border-main)] rounded-lg p-3 mb-3 flex flex-col bg-[var(--bg-input)] shadow-sm">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search by object name, category, etc..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !(isSearchLoading || isPopularImagesLoading)) onDatabaseSearch(searchQuery); }}
              disabled={isSearchLoading || isPopularImagesLoading}
              className="w-full p-1.5 border border-[var(--border-main)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--bg-input)] text-[var(--text-main)] disabled:opacity-50 transition-all font-medium shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDatabaseSearch(searchQuery)}
              disabled={isSearchLoading || isPopularImagesLoading}
              className="w-full px-2 py-1.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full px-2 py-1.5 bg-[var(--color-secondary)] text-white rounded-lg hover:opacity-90 transition flex items-center justify-center text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="border border-[var(--border-main)] rounded-lg p-3 mb-3 flex flex-col gap-2 bg-[var(--bg-input)] shadow-sm">
            <div className="flex items-center gap-2 w-full">
              <select
                id="curriculum-language-select"
                value={curriculumProps.searchLanguage}
                onChange={(e) => curriculumProps.setSearchLanguage(e.target.value)}
                className="w-32 flex-shrink-0 p-1.5 border border-[var(--border-main)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--bg-input)] text-[var(--text-main)] transition-all font-medium shadow-sm"
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
                className="flex-1 min-w-0 p-1.5 border border-[var(--border-main)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--bg-input)] text-[var(--text-main)] transition-all font-medium shadow-sm"
              />
            </div>
            <button
              onClick={handleCurriculumSearch}
              disabled={curriculumProps.isLoading}
              className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold hover:opacity-90 shadow-md shadow-[var(--color-primary)]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
              className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold shadow-md shadow-[var(--color-primary)]/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mb-3"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              <span>Save Book Changes</span>
            </button>
          )}

          <div className="border border-[var(--border-main)] rounded-lg p-3 flex-1 min-h-0 bg-[var(--bg-input)] shadow-inner overflow-hidden">
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
              onSelectChapter={onSelectChapter}
              onCollapseAll={onCollapseAll}
            />
          </div>
        </>
      );
    } else if (leftPanelView === 'contest') {
      return (
        <div className="flex-1 min-h-0 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg p-3 shadow-inner overflow-hidden">
          <ContestListPanel
            contests={contestProps.contests}
            activeContest={contestProps.activeContest}
            isLoading={contestProps.isLoading}
            error={contestProps.error}
            onSelectContest={contestProps.selectContest}
            onCreateContest={contestProps.createNewContest}
            searchQuery={contestProps.searchQuery}
            onSearchChange={contestProps.setSearchQuery}
            onSearch={contestProps.fetchContests}
          />
        </div>
      );
    }
    return null;
  };

  // Logic to determine if we need horizontal scroll for database view
  const isHorizontalScroll = leftPanelView === 'database' && databaseImages.length > 9;

  return (
    <div className={`w-full bg-[var(--bg-panel)] bg-panel-texture text-[var(--text-main)] rounded-lg shadow-lg p-4 flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header with Toggle */}
      <div className="flex items-center mb-4 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          className="p-2 -ml-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-input)] transition md:block"
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* Header Content (conditionally rendered) */}
        <div className={`flex justify-between items-center w-full ml-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex items-center space-x-2">
            {/* Title changes based on view */}
            <h2 className="text-lg font-semibold flex items-center whitespace-nowrap">
              {leftPanelView === 'curriculum' ? (
                <>
                  <BookOpenIcon className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                  <span className="text-[var(--text-main)]">Curriculum</span>
                </>
              ) : leftPanelView === 'contest' ? (
                <>
                  <TrophyIcon className="w-5 h-5 text-[var(--color-secondary)] mr-2" />
                  <span className="text-[var(--text-main)]">Contests</span>
                </>
              ) : (
                <>
                  <CircleStackIcon className="w-5 h-5 text-[var(--color-secondary)] mr-2" />
                  <span className="text-[var(--text-main)]">Objects</span>
                </>
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content (conditionally rendered) */}
      <div className={`flex-1 flex flex-col overflow-y-auto transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Internal Tabs for Objects View */}
        {leftPanelView !== 'curriculum' && leftPanelView !== 'contest' && (
          <div className="flex bg-[var(--bg-input)]/50 backdrop-blur-sm p-1 rounded-xl mb-4 border border-[var(--border-main)] transition-colors duration-300">
            <button
              onClick={() => onViewChange('upload')}
              title="Upload new Objects"
              className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-lg text-xs font-bold transition-all ${leftPanelView === 'upload' ? 'bg-[var(--bg-panel)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Upload</span>
            </button>
            <button
              onClick={() => onViewChange('database')}
              disabled={!canUploadPicture.metadata || !canIdentifyImage.metadata}
              title={!canUploadPicture.metadata || !canIdentifyImage.metadata ? "You need upload and identify permissions to view the database" : "View Objects others have provided"}
              className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${leftPanelView === 'database' ? 'bg-[var(--bg-panel)] text-[var(--color-secondary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <MagnifyingGlassIcon className="w-3 h-3" />
              <span>Gallery</span>
            </button>
            <button
              onClick={() => onViewChange('my_content')}
              title="View existing Objects"
              className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${leftPanelView === 'my_content' ? 'bg-[var(--bg-panel)] text-[var(--color-secondary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <CircleStackIcon className="w-3 h-3" />
              <span>Repository</span>
            </button>
          </div>
        )}
        {renderViewSpecificControls()}

        {/* Content Area for Upload View */}
        {leftPanelView === 'upload' && (
          (previewUrl || currentCommonData?.image_base64) ? (
            <div className="mb-4">
              <div className="flex-shrink-0 h-64 bg-[var(--bg-input)] rounded-lg flex items-center justify-center overflow-hidden border border-[var(--border-main)] shadow-inner">
                {previewUrl ? (
                  <img src={previewUrl} alt="Uploaded" className="w-full h-full object-contain" />
                ) : currentCommonData?.image_base64 ? (
                  <img src={`data:image/png;base64,${currentCommonData.image_base64}`} alt="Work item" className="w-full h-full object-contain" />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center mb-4 min-h-64 border border-[var(--border-main)] rounded-lg bg-[var(--bg-input)] p-2 text-[var(--text-muted)] italic shadow-inner">
              Upload an image to see a preview.
            </div>
          )
        )}

        {/* Content Area for Database View */}
        {leftPanelView === 'database' && (
          <>
            <div className={`flex-1 mb-4 min-h-64 border border-[var(--border-main)] rounded-lg bg-[var(--bg-input)] p-2 shadow-inner ${isHorizontalScroll ? 'overflow-x-auto' : 'overflow-y-auto'}`}>

              {databaseImages.length > 0 ? (
                <div className={isHorizontalScroll
                  ? "grid grid-rows-3 grid-flow-col gap-2 w-max" // Horizontal scroll layout
                  : "grid grid-cols-3 gap-2 pr-2" // Vertical scroll layout
                }>
                  {databaseImages.map((image, idx) => (
                    <div key={image.object.image_hash || idx} className={`relative group rounded-xl overflow-hidden shadow-md cursor-pointer aspect-square ${isHorizontalScroll ? 'w-28' : ''}`} onClick={() => onDatabaseImageClick(image)} title={image.common_data.object_name_en || image.file_info.filename || ''}>
                      <img src={`data:image/jpeg;base64,${image.object.thumbnail}`} alt={image.common_data.object_name_en || image.file_info.filename || ''} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" />
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                        <p className="text-white font-bold text-xs text-center drop-shadow-lg truncate">{image.common_data.object_name_en || (image.file_info.filename ? image.file_info.filename.split('.').slice(0, -1).join('.') : 'Untitled')}</p>
                      </div>
                      {(image.popularity_stars !== undefined && image.total_vote_count !== undefined) && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 opacity-0 group-hover:opacity-100"><div className="flex items-center text-white"><StarIcon className="w-5 h-5 text-yellow-400" /><span className="ml-1 font-bold">{typeof image.popularity_stars === 'number' ? image.popularity_stars.toFixed(1) : ''}</span></div><span className="text-xs text-white/80 mt-1 font-medium">{image.total_vote_count} votes</span></div>)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)] italic">
                  {isSearchLoading || isPopularImagesLoading ? "Searching..." : searchAttempted ? 'No results found.' : 'Search results will appear here.'}
                </div>
              )}
            </div>
            {/* Pagination Controls */}
            {databaseImages.length > 0 && !!galleryPage && (
              <div className="flex justify-between items-center mb-4 px-2">
                <button
                  onClick={onGalleryPrevious}
                  disabled={!galleryPage || galleryPage <= 1 || isPopularImagesLoading}
                  className="px-3 py-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-[var(--text-muted)]">Page {galleryPage}</span>
                <button
                  onClick={onGalleryNext}
                  disabled={!galleryHasMore || isPopularImagesLoading}
                  className="px-3 py-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* --- SHARED COMPONENTS (conditionally rendered only for Upload view) --- */}
        {leftPanelView === 'upload' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1" ref={languageDropdownRef as React.RefObject<HTMLDivElement>}>
                <button
                  onClick={onLanguageDropdownToggle}
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-sm flex items-center justify-between text-[var(--text-main)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all font-medium shadow-sm"
                >
                  <span className="truncate">
                    {selectedLanguages.length === 0 ? 'Select Languages' : `${selectedLanguages.length} selected`}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform text-[var(--color-primary)] ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLanguageDropdownOpen && (
                  <div className="absolute bottom-full right-0 mb-1 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto min-w-[150px]">
                    {languageOptions.map((language) => (
                      <label key={language} className="flex items-center px-3 py-2 hover:bg-[var(--bg-input)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLanguages.includes(language)}
                          onChange={() => onLanguageToggle(language)}
                          className="mr-3 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span className="text-[var(--text-main)]">{language}</span>
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
                  className={`px-4 py-2 rounded-lg transition flex-none flex justify-center items-center ${(!isLoading && !canIdentifyImage.metadata) ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-main)]' :
                    isLoading ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20' : 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-md shadow-blue-500/20'
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <LoadingSpinner size="sm" color="white" className="mr-1" />
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
                  className={`px-4 py-2 rounded-lg transition flex-none flex justify-center items-center ${(!isWorklistLoading && !canViewWorkList.language)
                    ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-main)]'
                    : isWorklistLoading
                      ? 'bg-[var(--color-secondary)] text-white cursor-wait opacity-80 shadow-md shadow-orange-500/20'
                      : 'bg-[var(--color-secondary)] text-white hover:opacity-90 shadow-md shadow-orange-500/20'
                    }`}
                >
                  {isWorklistLoading ? <LoadingSpinner size="sm" color="white" /> : <ListBulletIcon className="w-5 h-5" />}
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

          </>
        )}

        {leftPanelView === 'my_content' && renderMyContentPanel()}

        {(leftPanelView === 'upload' || leftPanelView === 'database' || leftPanelView === 'my_content') && (
          <div className="mt-8 flex-shrink-0">
            <h3 className="font-semibold mb-2 text-[var(--text-main)] text-sm">Recent Edits</h3>
            <div className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
              {recentTranslations.length > 0 ? (
                recentTranslations.map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 w-28 bg-[var(--bg-input)] rounded-lg overflow-hidden flex flex-col items-center shadow-md transition-transform hover:scale-105 border border-[var(--border-main)]">
                    <div className="h-24 w-full">
                      <img
                        src={`data:image/jpeg;base64,${item.object.thumbnail}`}
                        alt="thumbnail"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition"
                        onClick={canUploadPicture.metadata ? () => onThumbnailClick(idx) : undefined}
                      />
                    </div>
                    <div className="p-1.5 text-center w-full">
                      <p className="text-xs font-semibold text-[var(--text-main)] truncate" title={item.translation.requested_language}>{item.translation.requested_language}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate" title={item.translation.translation_status}>{item.translation.translation_status}</p>
                    </div>
                  </div>
                ))
              ) : (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="flex-shrink-0 w-28 h-36 bg-[var(--bg-input)] rounded-lg animate-pulse border border-[var(--border-main)]"></div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Area */}
      {notification && (
        <div className={`mt-2 p-2 rounded-md text-sm transition-opacity duration-300 font-medium ${notification.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
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