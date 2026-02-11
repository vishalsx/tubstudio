// components/panels/MiddlePanel.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon, ArrowUpCircleIcon, CheckCircleIcon, CheckBadgeIcon, XCircleIcon, ArrowRightCircleIcon, PencilIcon, EyeIcon, ArrowDownTrayIcon, ChevronRightIcon, ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { PlusCircleIcon, TrashIcon, SparklesIcon, ArrowPathIcon, AcademicCapIcon, PhotoIcon, BookOpenIcon, FolderIcon, DocumentIcon, InformationCircleIcon, DocumentArrowDownIcon, CircleStackIcon, ShoppingBagIcon, PencilSquareIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { LanguageResult, SaveStatus, PermissionCheck, CurriculumImage, DatabaseImage, CommonData, Page, Book, Chapter, OrgObject } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';
import { ImageSearchModal } from '../common/ImageSearchModal';
import { QuizQAModal } from '../common/QuizQAModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { translationService } from '../../services/translation.service';
import { ContestMiddlePanel } from './contest/ContestMiddlePanel';
import { UserContext } from '../../types';
import { useContest } from '../../hooks/useContest';
import { useMyContent } from '../../hooks/useMyContent';

import { ValidationSummaryModal } from '../modals/ValidationSummaryModal';
import { MarketplaceGrid } from '../marketplace/MarketplaceGrid';

interface MiddlePanelProps {
  leftPanelView: 'upload' | 'database' | 'curriculum' | 'contest' | 'my_content';
  className?: string;
  userContext: UserContext | null;

  // Upload View props
  previewUrl: string | null;
  currentCommonData: CommonData;
  imageHash?: string | null;
  activeTab: string;
  availableTabs: string[];
  languageResults: { [key: string]: LanguageResult };
  selectedLanguages: string[];
  saveStatus: { [key: string]: SaveStatus };
  saveMessages: { [key: string]: string | null };
  isEditing: { [key: string]: boolean };
  isSaving: { [key: string]: string | null };
  isWorklistLoading: boolean;
  permissions: {
    canSwitchToEditMode: PermissionCheck;
    canSaveToDatabase: PermissionCheck;
    canReleaseToDatabase: PermissionCheck;
    canVerifyData: PermissionCheck;
    canApproveData: PermissionCheck;
    canRejectData: PermissionCheck;
    canSkiptData: PermissionCheck;
    canUploadPicture?: PermissionCheck;
    canIdentifyImage?: PermissionCheck;
  };
  onTabChange: (tab: string) => void;
  onRemoveTab: (language: string) => void;
  onUpdateLanguageResult: <K extends keyof LanguageResult>(
    language: string,
    key: K,
    value: LanguageResult[K]
  ) => void;
  onSave: (action: string) => void;
  onSkip: () => void;
  onToggleEdit: (language: string) => void;
  onSetError?: (error: string | null) => void;

  // Curriculum View props
  books?: Book[];
  activeBook: Book | null;
  activeChapter: Chapter | null;
  onSelectBook?: (bookId: string | null) => void;
  onSelectChapter?: (chapter: Chapter) => void;
  onSelectPage?: (page: Page) => void;
  onSelectNode?: (node: Book | Chapter | Page) => void;
  onNodeExpansion?: (node: Book | Chapter) => void;
  isLoading: boolean;
  selectedPageData: Page | null;
  onCurriculumImageDoubleClick: (image: CurriculumImage, languages: string[], orgId?: string, book?: Book) => void;
  languageForImageSearch: string;
  onAddImageToCurriculumPage: (image: DatabaseImage) => void;
  onRemoveImageFromCurriculumPage: (imageHash: string) => void;
  onAddNewImageFromSearch: (searchQuery: string) => void;
  onAddChapter?: (bookId: string) => void;
  onAddPage?: (bookId: string, chapterId: string) => void;
  isStoryLoading: boolean;
  loadingStoryLanguages?: string[];
  onCreateStory: () => void;
  onGenerateStory?: (pageId: string, languages?: string[], userComments?: string) => void;
  selectedStoryLanguage?: string;
  onSelectStoryLanguage?: (language: string) => void;
  onReorderImagesOnPage: (draggedImageHash: string, targetImageHash: string) => void;
  imageLoadingProgress: { loaded: number, total: number } | null;
  onUpdateImageName?: (imageHash: string, newName: string) => void;
  onReIdentify?: (language: string, context: string) => void;
  isDirty?: boolean;
  onSaveBook?: (action?: 'SaveDraft' | 'Publish' | 'Validate') => void;
  onCheckTranslation?: (pageId: string, imageHash: string) => void;
  validationResult?: {
    isValid: boolean;
    message: string;
    summary: any[];
    totals: { valid: number; missing: number };
  } | null;

  // Contest Props
  contestProps: ReturnType<typeof useContest>;
  cameFromCurriculum?: boolean;
  onBackToCurriculum?: () => void;

  // My Content props
  // My Content props
  myContentProps: ReturnType<typeof useMyContent>;

  isPublishing?: boolean;
  curriculumTab: 'my_books' | 'purchase_books';
  marketplaceBooks: Book[];
  activeMarketplaceBook: Book | null;
  onSelectMarketplaceBook: (book: Book) => void;
  isMarketplaceLoading: boolean;
}

export const MiddlePanel: React.FC<MiddlePanelProps> = (props) => {
  const {
    leftPanelView,
    className = '',
    // upload props
    activeTab,
    imageHash,
    availableTabs,
    languageResults,
    selectedLanguages,
    saveStatus,
    saveMessages,
    isEditing,
    isSaving,
    isWorklistLoading,
    permissions,
    onTabChange,
    onRemoveTab,
    onUpdateLanguageResult,
    onSave,
    onSkip,
    onToggleEdit,
    currentCommonData,
    // curriculum props
    books = [],
    activeBook,
    activeChapter,
    onSelectBook,
    onSelectChapter,
    onSelectPage,
    onSelectNode,
    onNodeExpansion,
    isLoading: isCurriculumLoading,
    selectedPageData,
    onCurriculumImageDoubleClick,
    languageForImageSearch,
    isPublishing = false,
    onAddImageToCurriculumPage,
    onRemoveImageFromCurriculumPage,
    onAddNewImageFromSearch,
    onAddChapter,
    onAddPage,
    isStoryLoading,
    loadingStoryLanguages,
    onCreateStory,
    onGenerateStory,
    selectedStoryLanguage,
    onSelectStoryLanguage,
    onReorderImagesOnPage,
    imageLoadingProgress,
    onUpdateImageName,
    onReIdentify,
    isDirty,
    onSaveBook,
    onCheckTranslation,
    validationResult,
    // Contest Props
    contestProps,
    userContext,
    cameFromCurriculum,
    onBackToCurriculum,
    onSetError,
    myContentProps,
    curriculumTab,
    marketplaceBooks,
    activeMarketplaceBook,
    onSelectMarketplaceBook,
    isMarketplaceLoading,
  } = props;

  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  useEffect(() => {
    if (validationResult) {
      setIsValidationModalOpen(true);
    }
  }, [validationResult]);

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isRefreshingQuizQA, setIsRefreshingQuizQA] = useState(false);
  const [userComments, setUserComments] = useState('');
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

  // const isPurchasedBook = activeBook?.ownership_type === 'purchased'; // Moved to common calculation block

  // Drag and drop state
  const [draggedImageHash, setDraggedImageHash] = useState<string | null>(null);
  const [dragOverImageHash, setDragOverImageHash] = useState<string | null>(null);

  // Image Name Editing State
  const [editingImageHash, setEditingImageHash] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Refine Context State - Per language
  const [refineContext, setRefineContext] = useState<{ [language: string]: string }>({});

  // Import/Original Toggle state
  const [importedDataCache, setImportedDataCache] = useState<{ [language: string]: LanguageResult }>({});
  const [originalDataCache, setOriginalDataCache] = useState<{ [language: string]: LanguageResult }>({});
  const [isShowingImported, setIsShowingImported] = useState<{ [language: string]: boolean }>({});

  // Clear all refine contexts and import caches when a new image is uploaded/identified
  useEffect(() => {
    setRefineContext({});
    setImportedDataCache({});
    setOriginalDataCache({});
    setIsShowingImported({});
  }, [props.currentCommonData.object_id]); // Clear when object_id changes (new image)

  // Clear user comments and validation errors when tab changes
  useEffect(() => {
    setUserComments('');
    setValidationErrors(new Set());
  }, [activeTab]);


  const handleEditClick = () => {
    if (activeTab) {
      onToggleEdit(activeTab);
    }
  };

  const savingAction = isSaving[activeTab];
  const isCurrentTabSaving = !!savingAction;
  const currentResult = languageResults[activeTab];
  const hasError = !!currentResult?.error;
  const isLoading = currentResult?.isLoading || false;

  // Validate fields before API calls
  const handleActionClick = (action: string) => {
    if (!currentResult) return;

    const errors = new Set<string>();
    // Only validate editable text fields
    const fieldsToCheck = ['object_name', 'object_description', 'object_hint', 'object_short_hint'];

    fieldsToCheck.forEach(key => {
      const val = currentResult[key as keyof LanguageResult];
      if (!val || (typeof val === 'string' && !val.trim())) {
        errors.add(key);
      }
    });

    // Validate Quiz QA
    const quizQA = currentResult.quiz_qa || [];
    const hasInvalidQuizQA = quizQA.some(item =>
      !item.question.trim() || !item.answer.trim() || !item.difficulty_level?.trim()
    );

    if (hasInvalidQuizQA) {
      errors.add('quiz_qa');
    }

    if (errors.size > 0) {
      setValidationErrors(errors);
      return; // Stop execution, don't call API
    }

    setValidationErrors(new Set()); // Clear previous errors
    onSave(action);
  };

  // Helper to check if a specific field has a validation error
  const isFieldInvalid = (key: string) => validationErrors.has(key);

  const handleAddImageFromSearch = (image: DatabaseImage) => {
    if (selectedPageData && onAddImageToCurriculumPage) {
      onAddImageToCurriculumPage(image);
    }
  };

  const handleAddNewImage = (searchQuery: string) => {
    onAddNewImageFromSearch(searchQuery);
    setIsImageSearchModalOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, imageHash: string) => {
    setDraggedImageHash(imageHash);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to prevent the ghost image from showing the dragged state
    setTimeout(() => {
      e.currentTarget.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, imageHash: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedImageHash !== null && draggedImageHash !== imageHash) {
      setDragOverImageHash(imageHash);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, imageHash: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Continuously update drop target while dragging over
    if (draggedImageHash !== null && draggedImageHash !== imageHash) {
      setDragOverImageHash(imageHash);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, imageHash: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Clear drop target indicator when leaving this specific item
    if (dragOverImageHash === imageHash) {
      setDragOverImageHash(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetImageHash: string) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Drop triggered - Dragged:', draggedImageHash, 'Target:', targetImageHash);

    if (draggedImageHash !== null && draggedImageHash !== targetImageHash) {
      console.log('Calling onReorderImagesOnPage with hashes:', draggedImageHash, targetImageHash);
      onReorderImagesOnPage(draggedImageHash, targetImageHash);
    }

    // Reset all states
    setDraggedImageHash(null);
    setDragOverImageHash(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset opacity
    e.currentTarget.style.opacity = '1';
    // Reset all drag states
    setDraggedImageHash(null);
    setDragOverImageHash(null);
  };

  // Check Read-Only Status
  const isPurchasedBook = activeBook?.ownership_type === 'purchased';
  const isPublishedBook = activeBook?.book_status === 'Published';
  const isReadOnly = isPurchasedBook || isPublishedBook;

  // Image Name Editing Handlers
  const startEditingImageName = (image: CurriculumImage) => {
    // Rely on calculated isReadOnly from state
    if (isReadOnly) return;
    setEditingImageHash(image.image_hash);
    setEditingNameValue(image.object_name || "");
  };

  const saveImageName = (imageHash: string) => {
    if (editingNameValue.trim() && onUpdateImageName) {
      onUpdateImageName(imageHash, editingNameValue.trim());
    }
    setEditingImageHash(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent, imageHash: string) => {
    if (e.key === 'Enter') {
      saveImageName(imageHash);
    } else if (e.key === 'Escape') {
      setEditingImageHash(null);
    }
    e.stopPropagation(); // Prevent triggering other key handlers
  };

  const handleRefreshQuizQA = async () => {
    if (!activeTab || !languageResults[activeTab]?.translation_id) {
      console.error('No translation_id available for refresh');
      return;
    }

    setIsRefreshingQuizQA(true);
    try {
      const data = await translationService.updateQuizQA(
        languageResults[activeTab].translation_id!
      );

      // Update quiz_qa field with response
      if (data.quiz_qa) {
        onUpdateLanguageResult(activeTab, 'quiz_qa', data.quiz_qa);
      }
    } catch (error) {
      console.error('Failed to refresh quiz QA:', error);
      // Error is logged, user will see no update if it fails
    } finally {
      setIsRefreshingQuizQA(false);
    }
  };

  const handleImportText = async () => {
    if (!activeTab || !imageHash || !currentResult) {
      console.error('Missing data for import');
      return;
    }

    const hasImported = !!importedDataCache[activeTab];

    if (hasImported) {
      // Toggle logic: Switch between Original and Imported, preserving edits
      const showingImported = isShowingImported[activeTab];

      // 1. Capture current edits into the appropriate cache
      const currentFields = {
        ...currentResult,
        // We only care about the text fields we import
        object_name: currentResult.object_name,
        object_description: currentResult.object_description,
        object_hint: currentResult.object_hint,
        object_short_hint: currentResult.object_short_hint,
        quiz_qa: [...(currentResult.quiz_qa || [])]
      };

      if (showingImported) {
        setImportedDataCache(prev => ({ ...prev, [activeTab]: currentFields }));
        // Switch to Original
        const original = originalDataCache[activeTab];
        updateFields(original);
        setIsShowingImported(prev => ({ ...prev, [activeTab]: false }));
      } else {
        setOriginalDataCache(prev => ({ ...prev, [activeTab]: currentFields }));
        // Switch to Imported
        const imported = importedDataCache[activeTab];
        updateFields(imported);
        setIsShowingImported(prev => ({ ...prev, [activeTab]: true }));
      }
      return;
    }

    // First time import: Call API
    try {
      if (onSetError) onSetError(null);
      const data = await translationService.importContent(imageHash, activeTab);

      if (data) {
        // 1. Save current fields as Original
        setOriginalDataCache(prev => ({ ...prev, [activeTab]: { ...currentResult } }));

        // 2. Prepare imported data
        const importedResult: LanguageResult = {
          ...currentResult,
          object_name: data.object_name || currentResult.object_name,
          object_description: data.object_description || currentResult.object_description,
          object_hint: data.object_hint || currentResult.object_hint,
          object_short_hint: data.object_short_hint || currentResult.object_short_hint,
          quiz_qa: data.quiz_qa || currentResult.quiz_qa
        };

        // 3. Save to Imported cache and update fields
        setImportedDataCache(prev => ({ ...prev, [activeTab]: importedResult }));
        updateFields(importedResult);
        setIsShowingImported(prev => ({ ...prev, [activeTab]: true }));
      }
    } catch (error: any) {
      console.error('Failed to import content:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to import content';
      if (onSetError) {
        onSetError(errorMessage);
      } else {
        alert('Error: ' + errorMessage);
      }
    }
  };

  // Helper to update fields in parent state
  const updateFields = (data: Partial<LanguageResult>) => {
    if (data.object_name !== undefined) onUpdateLanguageResult(activeTab, 'object_name', data.object_name);
    if (data.object_description !== undefined) onUpdateLanguageResult(activeTab, 'object_description', data.object_description);
    if (data.object_hint !== undefined) onUpdateLanguageResult(activeTab, 'object_hint', data.object_hint);
    if (data.object_short_hint !== undefined) onUpdateLanguageResult(activeTab, 'object_short_hint', data.object_short_hint);
    if (data.quiz_qa !== undefined) onUpdateLanguageResult(activeTab, 'quiz_qa', data.quiz_qa);
  };

  const renderTranslationEditor = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold whitespace-nowrap">Object Details</h2>
          </div>
          {cameFromCurriculum && onBackToCurriculum && (
            <button
              onClick={onBackToCurriculum}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded-lg transition-all text-sm font-medium border border-[var(--color-primary)]/20 shadow-sm active:scale-95"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Curriculum</span>
            </button>
          )}
        </div>
      </div>
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedLanguages.map((language) => (
            <span key={language} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]">
              {language}
              <button onClick={() => onRemoveTab(language)} className="ml-1 hover:text-red-500">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {availableTabs.length > 0 ? (
        <div className="flex-1 flex flex-col">
          <div className="flex border-b border-gray-200 overflow-x-auto mb-4">
            {availableTabs.map((language) => (
              <button key={language} onClick={() => onTabChange(language)} className={`px-3 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === language ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-main)]'}`}>
                <div className="flex items-center space-x-2">
                  <span>{language}</span>
                  {/* Translation Status Color Dot (matching repository view) */}
                  {languageResults[language]?.translation_status && (
                    <>
                      {languageResults[language]?.translation_status === 'Approved' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" title="Approved" />
                      )}
                      {languageResults[language]?.translation_status === 'Verified' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" title="Verified" />
                      )}
                      {languageResults[language]?.translation_status === 'Released' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" title="Released" />
                      )}
                      {languageResults[language]?.translation_status === 'Draft' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" title="Draft" />
                      )}
                      {!['Approved', 'Verified', 'Released', 'Draft'].includes(languageResults[language]?.translation_status || '') && languageResults[language]?.translation_status && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 shadow-sm shadow-gray-400/50" title={languageResults[language]?.translation_status} />
                      )}
                    </>
                  )}
                  {/* No translation status - show white outline circle */}
                  {!languageResults[language]?.translation_status && !languageResults[language]?.isLoading && (
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-transparent" title="No status" />
                  )}
                  {languageResults[language]?.isLoading && <div className="w-3 h-3 border-2 border-[var(--border-main)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>}
                  {language !== 'X' && (<button onClick={(e) => { e.stopPropagation(); onRemoveTab(language); }} className="hover:text-red-500"><XMarkIcon className="w-3 h-3" /></button>)}
                </div>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab && languageResults[activeTab] ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 pb-4 border-b border-[var(--border-main)]">
                  <button onClick={handleEditClick} disabled={!permissions.canSwitchToEditMode.language || isLoading || hasError || isCurrentTabSaving} title={!permissions.canSwitchToEditMode.language ? 'You do not have permission to switch edit mode' : (isEditing[activeTab] ? 'Switch to View Mode' : 'Switch to Edit Mode')} className={`p-2 rounded transition ${!permissions.canSwitchToEditMode.language ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-input)]'} disabled:opacity-50`}>
                    {isEditing[activeTab] ? <EyeIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("saveToDatabase")} disabled={isCurrentTabSaving || !permissions.canSaveToDatabase.language || isLoading || hasError} title={`Save ${activeTab} to Database`} className={`p-2 rounded transition ${!permissions.canSaveToDatabase.language ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-green-500 hover:bg-green-500/10'} disabled:opacity-50`}>
                    {savingAction === 'saveToDatabase' ? <div className="w-5 h-5 border-2 border-[var(--border-main)] border-t-green-400 rounded-full animate-spin"></div> : <ArrowDownTrayIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("releaseToDatabase")} disabled={isCurrentTabSaving || !permissions.canReleaseToDatabase.language || isLoading || hasError} title="Release to Database" className={`p-2 rounded transition ${!permissions.canReleaseToDatabase.language ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10'} disabled:opacity-50`}>
                    {savingAction === 'releaseToDatabase' ? <div className="w-5 h-5 border-2 border-[var(--border-main)] border-t-blue-400 rounded-full animate-spin"></div> : <ArrowUpCircleIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("verifyData")} disabled={isCurrentTabSaving || !permissions.canVerifyData.language || isLoading || hasError} title="Verify Data" className={`p-2 rounded transition ${!permissions.canVerifyData.language ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-purple-500 hover:bg-purple-500/10'} disabled:opacity-50`}>
                    {savingAction === 'verifyData' ? <div className="w-5 h-5 border-2 border-[var(--border-main)] border-t-purple-400 rounded-full animate-spin"></div> : <CheckCircleIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("approveData")} disabled={isCurrentTabSaving || !permissions.canApproveData.language || isLoading || hasError} title="Approve Data" className={`p-2 rounded transition ${!permissions.canApproveData.language ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-teal-500 hover:bg-teal-500/10'} disabled:opacity-50`}>
                    {savingAction === 'approveData' ? <div className="w-5 h-5 border-2 border-[var(--border-main)] border-t-teal-400 rounded-full animate-spin"></div> : <CheckBadgeIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("rejectData")} disabled={isCurrentTabSaving || !permissions.canRejectData.language || isLoading || hasError} title="Reject Data" className={`p-2 rounded transition ${!permissions.canRejectData.language ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10'} disabled:opacity-50`}>
                    {savingAction === 'rejectData' ? <div className="w-5 h-5 border-2 border-[var(--border-main)] border-t-red-400 rounded-full animate-spin"></div> : <XCircleIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={onSkip} disabled={isCurrentTabSaving || isWorklistLoading || !permissions.canSkiptData.language || isLoading || hasError} title="Skip to Next" className={`p-2 rounded transition ${!permissions.canSkiptData.language ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-orange-500 hover:bg-orange-500/10'} disabled:opacity-50`}>
                    {isWorklistLoading ? <div className="w-5 h-5 border-2 border-[var(--border-main)] border-t-orange-400 rounded-full animate-spin"></div> : <ArrowRightCircleIcon className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setIsQuizModalOpen(true)}
                    disabled={isLoading || hasError}
                    title={
                      isFieldInvalid('quiz_qa')
                        ? "Quiz QA has errors (empty fields)"
                        : (currentResult.quiz_qa && currentResult.quiz_qa.length > 0)
                          ? `View Quiz Q&A (${currentResult.quiz_qa.length} questions)`
                          : "View Quiz Q&A (empty)"
                    }
                    className={`p-2 rounded transition ${isFieldInvalid('quiz_qa')
                      ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                      : (currentResult.quiz_qa && currentResult.quiz_qa.length > 0)
                        ? 'text-green-500 bg-green-500/10 hover:bg-green-500/20'
                        : 'text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-input)]'
                      } disabled:opacity-50`}
                  >
                    <AcademicCapIcon className="w-5 h-5" />
                  </button>


                  {leftPanelView === 'upload' && (
                    <button
                      onClick={handleImportText}
                      disabled={!permissions.canSwitchToEditMode.language || isLoading || hasError || isCurrentTabSaving}
                      title={importedDataCache[activeTab] ? (isShowingImported[activeTab] ? "Switch to Original" : "Switch to Imported") : "Import Text"}
                      className={`p-2 rounded transition ml-auto ${isShowingImported[activeTab] ? 'text-blue-500 bg-blue-500/10' : 'text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-input)]'
                        } disabled:opacity-50`}
                    >
                      {importedDataCache[activeTab] ? <ArrowPathIcon className={`w-5 h-5 ${isShowingImported[activeTab] ? 'rotate-180 transition-transform' : ''}`} /> : <DocumentArrowDownIcon className="w-5 h-5" />}
                    </button>
                  )}
                </div>
                {isLoading ? <div className="flex items-center justify-center py-8"><div className="flex items-center space-x-2"><div className="w-5 h-5 border-2 border-[var(--border-main)] border-t-[var(--color-primary)] rounded-full animate-spin"></div><span className="text-[var(--text-muted)]">Loading {activeTab} Details...</span></div></div> : hasError ? <div className="p-3 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20"><p><strong>Error:</strong> {currentResult.error}</p></div> : <div className="space-y-4">{[{ label: 'Object Name', key: 'object_name' }, { label: 'Description', key: 'object_description', textarea: true }, { label: 'Hint', key: 'object_hint', textarea: true }, { label: 'Short Hint', key: 'object_short_hint', textarea: true }, { label: 'Translation Status', key: 'translation_status' }].map(({ label, key, textarea }) => {
                  // Check if field has validation error
                  const isInvalid = isFieldInvalid(key);
                  const displayLabel = key === 'translation_status' ? `${activeTab} Approval Status` : label;

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-[var(--text-main)] mb-1">
                        {displayLabel}:
                        {currentResult.flag_translation ? <span className="text-xs text-green-600 ml-2">⭐️</span> : <span className="text-xs text-blue-600 ml-2">✨</span>}
                      </label>
                      {isEditing[activeTab] && key !== 'translation_status' ? (
                        textarea ? (
                          <textarea
                            rows={3}
                            value={currentResult[key as keyof LanguageResult] as string || ''}
                            onChange={(e) => onUpdateLanguageResult(activeTab, key as keyof LanguageResult, e.target.value)}
                            className={`w-full p-2 border rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-input)] text-[var(--text-main)] ${isInvalid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-[var(--border-main)]'}`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentResult[key as keyof LanguageResult] as string || ''}
                            onChange={(e) => onUpdateLanguageResult(activeTab, key as keyof LanguageResult, e.target.value)}
                            className={`w-full p-2 border rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-input)] text-[var(--text-main)] ${isInvalid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-[var(--border-main)]'}`}
                          />
                        )
                      ) : key === 'translation_status' ? (
                        currentResult.translation_status ?
                          <StatusWorkflow statuses={['Draft', 'Released', 'Verified', 'Approved']} currentStatus={currentResult.translation_status} /> :
                          <p className="text-[var(--text-main)] bg-[var(--bg-input)] p-2 rounded-md">-</p>
                      ) : (
                        <div className="relative bg-[var(--bg-input)] rounded-md overflow-hidden group">
                          {currentResult?.isPurchased && key === 'object_description' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                              <div className="border-[6px] border-red-600/60 rounded-xl px-6 py-2 -rotate-12 transform transition-all duration-500 group-hover:scale-105 group-hover:-rotate-6">
                                <span className="text-2xl md:text-2xl font-black text-red-600/60 uppercase tracking-[0.15em] whitespace-nowrap">
                                  PURCHASED CONTENT
                                </span>
                              </div>
                            </div>
                          )}
                          <p className="relative z-10 text-[var(--text-main)] p-2 min-h-[38px] bg-transparent whitespace-pre-wrap">
                            {currentResult[key as keyof LanguageResult] as string || '-'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                  {/* Refine Results Section - Only visible in View Mode */}
                  {!currentResult.flag_translation && saveStatus[activeTab] !== 'saved' && !isEditing[activeTab] && permissions.canSwitchToEditMode.language && onReIdentify && (
                    <div className="mt-6 pt-4 border-t border-[var(--border-main)]">
                      <h3 className="text-sm font-medium text-[var(--text-main)] mb-2">Refine Object Details</h3>
                      <p className="text-xs text-[var(--text-muted)] mb-2">
                        Not happy with the results? Provide additional context to get better details.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={refineContext[activeTab] || ''}
                          onChange={(e) => setRefineContext(prev => ({ ...prev, [activeTab]: e.target.value }))}
                          placeholder="e.g., This is a vintage car from the 1920s..."
                          className="flex-1 p-2 border border-[var(--border-main)] rounded-md text-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-input)] text-[var(--text-main)]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && refineContext[activeTab]?.trim() && !isLoading) {
                              onReIdentify(activeTab, refineContext[activeTab]);
                              // Keep the context text for easy modification
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (refineContext[activeTab]?.trim()) {
                              onReIdentify(activeTab, refineContext[activeTab]);
                              // Keep the context text for easy modification
                            }
                          }}
                          disabled={!refineContext[activeTab]?.trim() || isLoading}
                          className="px-3 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isLoading ? 'Updating...' : 'Get Details Again'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>}
                {saveMessages[activeTab] && <p className={`text-sm ${saveMessages[activeTab]?.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{saveMessages[activeTab]}</p>}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-[var(--text-muted)] italic text-center py-8">Select languages and click 'Identify Image' to see the object data.</p>
      )}
    </div>
  );

  const renderCurriculumView = () => {
    const chapter = activeBook && selectedPageData
      ? activeBook.chapters.find(c => c.pages.some(p => p.page_id === selectedPageData!.page_id))
      : null;
    const chapterName = chapter ? chapter.chapter_name : '';
    const pageTitle = selectedPageData?.title || `Page ${selectedPageData?.page_number}`;
    const isPageDirty = selectedPageData?.images?.some(img => img.isNew);
    const isPublishedBook = activeBook?.book_status === 'Published';
    const isReadOnly = isPurchasedBook || isPublishedBook;

    if (!selectedPageData) {
      return (
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Search Results */}
          {books.length > 0 && !activeBook && (
            <div className="mb-6 p-4">
              <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">My Book Shelf</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {books.map((book) => {
                  const isPurchased = book.ownership_type === 'purchased';
                  return (
                    <div
                      key={book._id}
                      onClick={() => {
                        onSelectBook?.(book._id);
                        onSelectNode?.(book);
                      }}
                      className={`group cursor-pointer flex flex-col rounded-xl overflow-hidden border transition-all duration-300 ${isPurchased
                        ? 'bg-amber-50 border-amber-300 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-100'
                        : 'bg-[var(--bg-input)] border-[var(--border-main)] hover:border-[var(--color-primary)] hover:shadow-xl'
                        }`}
                    >
                      <div className="aspect-[3/4] relative bg-gray-100 overflow-hidden">
                        {book.front_cover_image ? (
                          <img
                            src={book.front_cover_image.startsWith('data:') ? book.front_cover_image : `data:image/jpeg;base64,${book.front_cover_image}`}
                            alt={book.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full relative">
                            <img
                              src="/assets/thumbnails/book_default.png"
                              alt="Book Cover Placeholder"
                              className="w-full h-full object-cover opacity-90"
                            />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <h5 className="text-white font-extrabold text-xs text-center leading-tight drop-shadow-md uppercase tracking-tighter">
                                {book.title}
                              </h5>
                            </div>
                          </div>
                        )}

                        {/* Purchased Badge */}
                        {isPurchased && (
                          <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white p-1 rounded-full shadow-md" title="Purchased - Read Only">
                            <ShoppingBagIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {/* Published Badge (if not purchased) */}
                        {!isPurchased && book.book_status === 'Published' && (
                          <div className="absolute top-2 right-2 z-10 bg-green-500 text-white p-1 rounded-full shadow-md" title="Published">
                            <PaperAirplaneIcon className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className={`text-white text-xs font-bold px-3 py-1.5 rounded-full ${isPurchased ? 'bg-amber-600' : 'bg-[var(--color-primary)]'}`}>
                            {isPurchased ? 'Read Book' : 'Open Book'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className={`font-bold text-sm truncate transition-colors ${isPurchased ? 'text-amber-900 group-hover:text-amber-700' : 'text-[var(--text-main)] group-hover:text-[var(--color-primary)]'}`}>{book.title}</h4>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">{book.author || 'Unknown Author'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium border border-blue-100">{book.language}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md font-medium border border-amber-100">{book.grade_level || 'General'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Book Overview with Chapters */}
          {activeBook && !activeChapter && (
            <div className="mb-6 p-4">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-1 text-xs text-[var(--text-muted)] mb-4 bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <QueueListIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span
                  onClick={() => onSelectBook?.(null)}
                  className="hover:text-[var(--color-primary)] cursor-pointer hover:underline transition-colors font-medium"
                >
                  Books
                </span>
                <ChevronRightIcon className="w-3 h-3" />
                <BookOpenIcon className={`w-3.5 h-3.5 ${activeBook.ownership_type === 'purchased' ? 'text-amber-500' : 'text-blue-500'}`} />
                <span className="font-semibold text-[var(--text-main)]">{activeBook.title}</span>
              </div>

              <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl border transition-all ${activeBook.ownership_type === 'purchased'
                ? 'bg-amber-100/50 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700 shadow-sm'
                : 'bg-[var(--color-primary-light)]/30 border-[var(--color-primary)]/10'
                }`}>
                <div className={`w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm relative border ${activeBook.ownership_type === 'purchased' ? 'border-amber-400' : 'border-[var(--border-main)]'
                  } bg-gray-100`}>
                  {activeBook.front_cover_image ? (
                    <img
                      src={activeBook.front_cover_image.startsWith('data:') ? activeBook.front_cover_image : `data:image/jpeg;base64,${activeBook.front_cover_image}`}
                      alt={activeBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full relative">
                      <img
                        src="/assets/thumbnails/book_default.png"
                        alt="Book Cover Placeholder"
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 flex items-center justify-center p-1">
                        <span className="text-white font-extrabold text-[8px] text-center leading-[1] drop-shadow-md uppercase tracking-tighter">
                          {activeBook.title}
                        </span>
                      </div>
                    </div>
                  )}
                  {activeBook.ownership_type === 'purchased' && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-white p-0.5 rounded shadow-sm">
                      <ShoppingBagIcon className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {/* Badge for published book thumbnail in details view */}
                  {!isPurchasedBook && isPublishedBook && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded shadow-sm">
                      <PaperAirplaneIcon className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold leading-tight ${activeBook.ownership_type === 'purchased' ? 'text-amber-900 dark:text-amber-100' : 'text-[var(--text-main)]'}`}>{activeBook.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {activeBook.ownership_type === 'purchased'
                      ? 'This is a purchased book and is in Read-Only mode.'
                      : isPublishedBook
                        ? 'This book is published and is in Read-Only mode.'
                        : 'Select a chapter below or a page from the curriculum tree'}
                  </p>
                </div>
                {/* Publish Button */}
                {!isReadOnly && onSaveBook && (
                  <div className="ml-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSaveBook('Validate'); }}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      <span>Publish Book</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {activeBook.chapters.map((chapter) => (
                  <div
                    key={chapter.chapter_id}
                    onClick={() => {
                      onSelectChapter?.(chapter);
                      onSelectNode?.(chapter);
                      onNodeExpansion?.(chapter);
                    }}
                    className="group cursor-pointer flex flex-col bg-[var(--bg-input)] rounded-xl overflow-hidden border border-[var(--border-main)] hover:border-[var(--color-primary)] hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-square relative bg-gray-100 overflow-hidden flex items-center justify-center">
                      {activeBook.front_cover_image ? (
                        <img
                          src={activeBook.front_cover_image.startsWith('data:') ? activeBook.front_cover_image : `data:image/jpeg;base64,${activeBook.front_cover_image}`}
                          alt={chapter.chapter_name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <img
                          src="/assets/thumbnails/chapter_default.png"
                          alt="Chapter Placeholder"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-3 py-1.5 bg-[var(--color-primary)] rounded-full">View Chapter</span>
                      </div>
                      <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[var(--color-primary)] font-bold text-sm z-10">
                        {chapter.chapter_number}
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">{chapter.chapter_name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{chapter.pages.length} Pages</span>
                        <ChevronRightIcon className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--color-primary)]" />
                      </div>
                    </div>
                  </div>
                ))}
                {/* Create Chapter Card */}
                {!isReadOnly && onAddChapter && (
                  <div
                    className="group rounded-xl border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/50 flex flex-col items-center justify-center cursor-pointer aspect-square transition-all duration-300 shadow-sm hover:shadow-md"
                    onClick={() => onAddChapter(activeBook._id)}
                    title="Add a new chapter"
                  >
                    <PlusCircleIcon className="w-10 h-10 text-[var(--text-muted)] opacity-30 group-hover:text-[var(--color-primary)] group-hover:scale-110 transition-all duration-300" />
                    <p className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-[var(--color-primary)] mt-2 uppercase tracking-wider">Add Chapter</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chapter Overview with Pages */}
          {activeBook && activeChapter && (
            <div className="mb-6 p-4">
              <div className="flex items-center space-x-1 text-xs text-[var(--text-muted)] mb-4 bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <QueueListIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span
                  onClick={() => onSelectBook?.(null)}
                  className="hover:text-[var(--color-primary)] cursor-pointer hover:underline transition-colors font-medium"
                >
                  Books
                </span>
                <ChevronRightIcon className="w-3 h-3" />
                <BookOpenIcon className={`w-3.5 h-3.5 ${activeBook.ownership_type === 'purchased' ? 'text-amber-500' : 'text-blue-500'}`} />
                <span className="hover:text-[var(--color-primary)] cursor-pointer hover:underline transition-colors font-medium" onClick={() => {
                  onSelectBook?.(activeBook._id);
                  onSelectNode?.(activeBook);
                }}>{activeBook.title}</span>
                <ChevronRightIcon className="w-3 h-3" />
                <FolderIcon className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-[var(--text-main)]">{activeChapter.chapter_name}</span>
              </div>

              <div className="flex items-center gap-3 mb-6 bg-[var(--color-secondary-light)]/30 p-4 rounded-xl border border-[var(--color-secondary)]/10">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-[var(--border-main)] flex-shrink-0 shadow-sm">
                  <FolderIcon className="w-8 h-8 text-[var(--color-secondary)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] leading-tight">{activeChapter.chapter_name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">Select a page to view and edit its images</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {activeChapter.pages.map((page) => (
                  <div
                    key={page.page_id}
                    onClick={() => {
                      onSelectPage?.(page);
                      onSelectNode?.(page);
                    }}
                    className="group cursor-pointer flex flex-col bg-[var(--bg-input)] rounded-xl overflow-hidden border border-[var(--border-main)] hover:border-[var(--color-primary)] hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-video relative bg-gray-100 overflow-hidden flex items-center justify-center">
                      {page.images && page.images.length > 0 && page.images[0].thumbnail ? (
                        <img
                          src={page.images[0].thumbnail}
                          alt={page.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <img
                          src="/assets/thumbnails/page_default.png"
                          alt="Page Placeholder"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}

                      <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-white/90 shadow-md flex items-center justify-center text-[var(--text-muted)] font-bold text-[10px] z-10">
                        {page.page_number}
                      </div>

                      {/* Indicators for images and story */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {page.images && page.images.length > 0 && (
                          <div className="px-1.5 py-0.5 bg-green-500 text-white text-[8px] font-bold rounded flex items-center gap-1 shadow-sm">
                            <PhotoIcon className="w-2.5 h-2.5" />
                            {page.images.length}
                          </div>
                        )}
                        {page.story && (
                          <div className="p-1 bg-purple-500 text-white rounded shadow-sm" title="Story Available">
                            <SparklesIcon className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-3 py-1.5 bg-[var(--color-primary)] rounded-full">Open Page</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">{page.title || `Page ${page.page_number}`}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                          {page.images && page.images.length > 0 ? `${page.images.length} Objects` : 'No Objects'}
                        </span>
                        {page.story && <span className="text-[9px] text-purple-600 font-bold bg-purple-50 px-1 rounded">Story</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Create Page Card */}
                {!isReadOnly && onAddPage && (
                  <div
                    className="group rounded-xl border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/50 flex flex-col items-center justify-center cursor-pointer aspect-video transition-all duration-300 shadow-sm hover:shadow-md"
                    onClick={() => onAddPage(activeBook._id, activeChapter.chapter_id!)}
                    title="Add a new page"
                  >
                    <PlusCircleIcon className="w-10 h-10 text-[var(--text-muted)] opacity-30 group-hover:text-[var(--color-primary)] group-hover:scale-110 transition-all duration-300" />
                    <p className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-[var(--color-primary)] mt-2 uppercase tracking-wider">Add Page</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback Empty State */}
          {!activeBook && books.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 text-[var(--text-muted)] p-8">
              <PhotoIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="italic text-center">Select a page from the curriculum tree to view its images.</p>
            </div>
          )}
        </div>
      );
    }

    if (isCurriculumLoading && !imageLoadingProgress) {
      return (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner text="Loading page..." />
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1 text-xs text-[var(--text-muted)] mb-4 bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
          <QueueListIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span
            onClick={() => onSelectBook?.(null)}
            className="hover:text-[var(--color-primary)] cursor-pointer hover:underline transition-colors font-medium"
          >
            Books
          </span>
          <ChevronRightIcon className="w-3 h-3" />
          <BookOpenIcon className={`w-3.5 h-3.5 ${isPurchasedBook ? 'text-amber-500' : 'text-blue-500'}`} />
          <span
            onClick={() => {
              if (activeBook) {
                onSelectBook?.(activeBook._id);
                onSelectNode?.(activeBook);
              }
            }}
            className="hover:text-[var(--color-primary)] cursor-pointer hover:underline transition-colors font-medium"
          >
            {activeBook?.title}
          </span>
          <ChevronRightIcon className="w-3 h-3" />
          <FolderIcon className="w-3.5 h-3.5 text-amber-500" />
          <span
            onClick={() => {
              if (chapter) {
                onSelectChapter?.(chapter);
                onSelectNode?.(chapter);
              }
            }}
            className="hover:text-[var(--color-primary)] cursor-pointer hover:underline transition-colors font-medium"
          >
            {chapterName}
          </span>
          <ChevronRightIcon className="w-3 h-3" />
          <span className="font-semibold text-[var(--text-main)]">{pageTitle}</span>
          {selectedPageData.story && (
            <div className="ml-auto flex items-center bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[10px] font-medium animate-pulse">
              <SparklesIcon className="w-3 h-3 mr-1" /> Story Ready
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-[var(--text-main)]">{pageTitle}</h2>
              {isPageDirty && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Unsaved Changes</span>}
            </div>
            {isPurchasedBook && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-100 rounded-lg border border-amber-200 dark:border-amber-800 text-xs font-bold w-fit shadow-sm">
                <ShoppingBagIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Purchased Book - Read Only</span>
              </div>
            )}
            {isPublishedBook && !isPurchasedBook && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-lg border border-green-200 text-xs font-bold w-fit shadow-sm">
                <PaperAirplaneIcon className="w-3.5 h-3.5 text-green-600" />
                <span>Published - Read Only</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {!isReadOnly && (
              <>
                {isDirty && (
                  <button
                    onClick={() => onSaveBook?.('SaveDraft')}
                    className="flex items-center space-x-2 bg-[var(--color-primary)] hover:opacity-90 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md shadow-[var(--color-primary)]/20 transition-all active:scale-95"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                )}

              </>
            )}
            {imageLoadingProgress && (
              <div className="text-sm text-[var(--text-muted)] flex items-center">
                <LoadingSpinner size="sm" color="gray" className="mr-2" />
                <span>Loading... {imageLoadingProgress.loaded} / {imageLoadingProgress.total}</span>
              </div>
            )}
            {!isReadOnly && (
              <button
                onClick={onCreateStory}
                disabled={isStoryLoading || !!isPageDirty || !!selectedPageData.story || (selectedPageData.images?.length || 0) < 1}
                title={
                  isPageDirty
                    ? "Save page changes before creating a story"
                    : !!selectedPageData.story
                      ? "Story already exists for this page"
                      : (selectedPageData.images?.length || 0) < 1
                        ? "Add at least 1 image to create a story"
                        : "Create Story"
                }
                className="p-2 rounded-lg transition text-[var(--text-muted)] hover:text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-[var(--text-muted)]/50 disabled:bg-transparent"
              >
                <SparklesIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="border-2 border-dashed border-[var(--border-main)] rounded-lg p-4 flex-1 overflow-y-auto bg-transparent">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {selectedPageData.images?.map((image, index) => {
              if (image.isLoading) {
                return (
                  <div key={image.image_id || `loader-${index}`} className="relative group rounded-xl bg-[var(--bg-input)] aspect-square animate-pulse border border-[var(--border-main)]">
                    <div className="absolute top-2 left-2 z-20 bg-[var(--color-primary)]/50 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white/20">
                      {image.position || index + 1}
                    </div>
                  </div>
                );
              }

              const isDraggingThis = draggedImageHash === image.image_hash;
              const isDropTarget = dragOverImageHash === image.image_hash;

              return (
                <div
                  key={image.image_id || image.image_hash}
                  draggable={!image.isLoading && !isReadOnly}
                  onDragStart={(e) => handleDragStart(e, image.image_hash)}
                  onDragEnter={(e) => handleDragEnter(e, image.image_hash)}
                  onDragOver={(e) => handleDragOver(e, image.image_hash)}
                  onDragLeave={(e) => handleDragLeave(e, image.image_hash)}
                  onDrop={(e) => handleDrop(e, image.image_hash)}
                  onDragEnd={handleDragEnd}
                  onDoubleClick={() => {
                    const bookLanguages = activeBook
                      ? [activeBook.language, ...(activeBook.additional_languages || [])]
                      : [languageForImageSearch];
                    onCurriculumImageDoubleClick(image, bookLanguages, isPurchasedBook ? activeBook?.org_id : undefined, activeBook || undefined);
                  }}
                  className={`relative group rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 aspect-square transition-all duration-300
                    ${isDraggingThis ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}
                    ${isDropTarget ? 'ring-4 ring-[#00AEEF] ring-offset-4 z-30' : 'hover:shadow-xl hover:-translate-y-1'}`}
                >
                  {/* Action Buttons Overlay - Top Right Container */}
                  {!isReadOnly && (
                    <div className="absolute top-2 right-2 flex flex-col space-y-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImageFromCurriculumPage(image.image_hash);
                        }}
                        className="p-1.5 bg-white shadow-md rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all border border-gray-100"
                        title="Remove image"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>

                      {/* Rename Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditingImageName(image); }}
                        className="p-1.5 bg-white shadow-md rounded-lg text-gray-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all border border-gray-100"
                        title="Rename"
                        disabled={isReadOnly}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      {/* Refresh Button (Only if translation missing) */}
                      {!image.object_name && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onCheckTranslation && selectedPageData?.page_id) {
                              onCheckTranslation(selectedPageData.page_id, image.image_hash);
                            }
                          }}
                          className="p-1.5 bg-white shadow-md rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all border border-gray-100 group/refresh"
                          title="Check for translation"
                        >
                          <ArrowPathIcon className="w-4 h-4 group-hover/refresh:rotate-180 transition-transform duration-500" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Translation missing indicator (Red Dot) */}
                  {!image.object_name && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full border-2 border-white z-20 shadow-sm animate-pulse group-hover:hidden" title="Translation missing"></div>
                  )}

                  {/* Position indicator badge - High contrast and encircled */}
                  <div className="absolute top-2 left-2 z-20 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md border border-white/20">
                    {image.position || index + 1}
                  </div>

                  <div className="w-full h-full relative overflow-hidden">
                    <img
                      src={image.thumbnail}
                      alt={image.object_name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                    {editingImageHash === image.image_hash ? (
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        onBlur={() => saveImageName(image.image_hash)}
                        onKeyDown={(e) => handleNameKeyDown(e, image.image_hash)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs px-2 py-1 rounded-lg border-2 border-[var(--color-primary)] focus:ring-0 text-[var(--text-main)] bg-[var(--bg-panel)] pointer-events-auto shadow-lg"
                        autoFocus
                      />
                    ) : (
                      <div
                        className={`flex items-center justify-between bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/10 pointer-events-auto ${!isReadOnly ? 'cursor-text' : ''}`}
                        onClick={(e) => { e.stopPropagation(); !isReadOnly && startEditingImageName(image); }}
                      >
                        <p className="text-white font-bold text-xs truncate select-none flex-1">
                          {image.object_name || 'Pending Translation'}
                        </p>
                        {!isReadOnly && <PencilIcon className="w-3 h-3 text-white/50 ml-1 flex-shrink-0" />}
                      </div>
                    )}
                  </div>

                  {image.isNew && (
                    <div className="absolute top-2 right-10 w-2 h-2 bg-[#00AEEF] rounded-full border-2 border-white pointer-events-none shadow-sm" title="Not saved"></div>
                  )}
                </div>
              );
            })}
            {/* Add Image Box */}
            {!isReadOnly && (
              <div
                className="relative group rounded-2xl border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/50 flex flex-col items-center justify-center cursor-pointer aspect-square transition-all duration-300 shadow-sm hover:shadow-md"
                onClick={() => setIsImageSearchModalOpen(true)}
                title="Add a new image to this page"
              >
                <PlusCircleIcon className="w-10 h-10 text-[var(--text-muted)] opacity-30 group-hover:text-[var(--color-primary)] group-hover:scale-110 transition-all duration-300" />
                <p className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-[var(--color-primary)] mt-2 uppercase tracking-wider">Add Image</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (leftPanelView === 'curriculum') {
      if (curriculumTab === 'purchase_books') {
        return (
          <div className="h-full flex flex-col min-h-0 bg-[var(--bg-input)] rounded-lg shadow-inner overflow-hidden relative">
            <MarketplaceGrid
              books={marketplaceBooks}
              activeBook={activeMarketplaceBook}
              onSelectBook={onSelectMarketplaceBook}
              isLoading={isMarketplaceLoading}
            />
          </div>
        );
      }
      return renderCurriculumView();
    }

    if (leftPanelView === 'contest') {
      return (
        <ContestMiddlePanel
          contest={contestProps.activeContest}
          isDirty={contestProps.isDirty}
          onUpdate={contestProps.updateActiveContest}
          onSave={contestProps.saveContest}
          isLoading={contestProps.isLoading}
          error={contestProps.error}
          userContext={userContext}
        />
      );
    }

    if (leftPanelView === 'my_content') {
      // Repository view - show same placeholder as database view
      const hasActiveImage = Object.keys(languageResults).length > 0;

      if (hasActiveImage) {
        return renderTranslationEditor();
      }

      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-[var(--text-muted)] italic text-center">Select an image from the repository to view its details.</p>
        </div>
      );
    }

    const hasActiveImage = Object.keys(languageResults).length > 0;

    if (hasActiveImage) {
      return renderTranslationEditor();
    }

    const placeholderText = leftPanelView === 'database'
      ? 'Select an image from the search results to view its details.'
      : 'Upload an image or select one from your worklist to start.';

    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--text-muted)] italic text-center">{placeholderText}</p>
      </div>
    );
  };

  return (
    <div className={`w-full bg-[var(--bg-panel)] bg-panel-texture text-[var(--text-main)] rounded-lg shadow-lg p-4 flex flex-col transition-all duration-300 ${className}`}>
      {renderContent()}
      {isImageSearchModalOpen && (
        <ImageSearchModal
          isOpen={isImageSearchModalOpen}
          onClose={() => setIsImageSearchModalOpen(false)}
          onImageSelect={handleAddImageFromSearch}
          language={languageForImageSearch}
          onAddNewImage={handleAddNewImage}
          existingImageHashes={selectedPageData?.images.map(img => img.image_hash) || []}
        />
      )}
      {isQuizModalOpen && activeTab && languageResults[activeTab] && (
        <QuizQAModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          quizQA={languageResults[activeTab].quiz_qa || []}
          language={activeTab}
          isEditing={isEditing[activeTab]}
          onUpdate={(newQuizQA) => onUpdateLanguageResult(activeTab, 'quiz_qa', newQuizQA)}
          hasValidationErrors={isFieldInvalid('quiz_qa')}
          translationId={languageResults[activeTab]?.translation_id}
          onRefreshQuizQA={handleRefreshQuizQA}
          isRefreshing={isRefreshingQuizQA}
        />
      )}
      {/* Validation Summary Modal */}
      <ValidationSummaryModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        result={validationResult ?? null}
        onPublish={() => onSaveBook?.('Publish')}
        isPublishing={isPublishing}
      />
    </div>
  );
};