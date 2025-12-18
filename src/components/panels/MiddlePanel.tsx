// components/panels/MiddlePanel.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon, ArrowUpCircleIcon, CheckCircleIcon, CheckBadgeIcon, XCircleIcon, ArrowRightCircleIcon, PencilIcon, EyeIcon, ArrowDownTrayIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { PlusCircleIcon, TrashIcon, SparklesIcon, ArrowPathIcon, AcademicCapIcon, PhotoIcon, BookOpenIcon, FolderIcon, DocumentIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { LanguageResult, SaveStatus, PermissionCheck, CurriculumImage, DatabaseImage, CommonData, Page, Book } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';
import { ImageSearchModal } from '../common/ImageSearchModal';
import { QuizQAModal } from '../common/QuizQAModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { translationService } from '../../services/translation.service';

interface MiddlePanelProps {
  leftPanelView: 'upload' | 'database' | 'curriculum';
  className?: string;

  // Upload View props
  previewUrl: string | null;
  currentCommonData: CommonData;
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

  // Curriculum View props
  activeBook: Book | null;
  isLoading: boolean;
  selectedPageData: Page | null;
  onCurriculumImageDoubleClick: (image: CurriculumImage, language: string) => void;
  languageForImageSearch: string;
  onAddImageToCurriculumPage: (image: DatabaseImage) => void;
  onRemoveImageFromCurriculumPage: (imageHash: string) => void;
  onAddNewImageFromSearch: (searchQuery: string) => void;
  isStoryLoading: boolean;
  onCreateStory: () => void;
  onGenerateStory?: (pageId: string, userComments?: string) => void;
  onReorderImagesOnPage: (draggedImageHash: string, targetImageHash: string) => void;
  imageLoadingProgress: { loaded: number, total: number } | null;
  onUpdateImageName?: (imageHash: string, newName: string) => void;
  onReIdentify?: (language: string, context: string) => void;
  isDirty?: boolean;
  onSaveBook?: () => void;
}

export const MiddlePanel: React.FC<MiddlePanelProps> = (props) => {
  const {
    leftPanelView,
    className = '',
    // upload props
    activeTab,
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
    // curriculum props
    activeBook,
    isLoading: isCurriculumLoading,
    selectedPageData,
    onCurriculumImageDoubleClick,
    languageForImageSearch,
    onAddImageToCurriculumPage,
    onRemoveImageFromCurriculumPage,
    onAddNewImageFromSearch,
    isStoryLoading,
    onCreateStory,
    onGenerateStory,
    onReorderImagesOnPage,
    imageLoadingProgress,
    onUpdateImageName,
    onReIdentify,
    isDirty,
    onSaveBook,
  } = props;

  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isRefreshingQuizQA, setIsRefreshingQuizQA] = useState(false);
  const [userComments, setUserComments] = useState('');
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

  // Drag and drop state
  const [draggedImageHash, setDraggedImageHash] = useState<string | null>(null);
  const [dragOverImageHash, setDragOverImageHash] = useState<string | null>(null);

  // Image Name Editing State
  const [editingImageHash, setEditingImageHash] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Refine Context State - Per language
  const [refineContext, setRefineContext] = useState<{ [language: string]: string }>({});

  // Clear all refine contexts when a new image is uploaded/identified
  useEffect(() => {
    setRefineContext({});
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

  // Image Name Editing Handlers
  const startEditingImageName = (e: React.MouseEvent, image: CurriculumImage) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingImageHash(image.image_hash);
    setEditingNameValue(image.object_name || '');
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

  const renderTranslationEditor = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Object Details</h2>
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedLanguages.map((language) => (
            <span key={language} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#E6F7FC] text-[#00AEEF] border border-[#00AEEF]">
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
              <button key={language} onClick={() => onTabChange(language)} className={`px-3 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === language ? 'border-[#00AEEF] text-[#00AEEF] bg-blue-50' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'}`}>
                <div className="flex items-center space-x-2">
                  <span>{language}</span>
                  {saveStatus[language] === 'saved' && <div className="w-2 h-2 bg-green-500 rounded-full" title="Saved"></div>}
                  {saveStatus[language] === 'unsaved' && <div className="w-2 h-2 bg-red-500 rounded-full" title="Not saved"></div>}
                  {languageResults[language]?.isLoading && <div className="w-3 h-3 border-2 border-gray-300 border-t-[#00AEEF] rounded-full animate-spin"></div>}
                  {language !== 'X' && (<button onClick={(e) => { e.stopPropagation(); onRemoveTab(language); }} className="hover:text-red-500"><XMarkIcon className="w-3 h-3" /></button>)}
                </div>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab && languageResults[activeTab] ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
                  <button onClick={handleEditClick} disabled={!permissions.canSwitchToEditMode.language || isLoading || hasError || isCurrentTabSaving} title={!permissions.canSwitchToEditMode.language ? 'You do not have permission to switch edit mode' : (isEditing[activeTab] ? 'Switch to View Mode' : 'Switch to Edit Mode')} className={`p-2 rounded transition ${!permissions.canSwitchToEditMode.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-[#00AEEF] hover:bg-gray-100'} disabled:opacity-50`}>
                    {isEditing[activeTab] ? <EyeIcon className="w-5 h-5" /> : <PencilIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("saveToDatabase")} disabled={isCurrentTabSaving || !permissions.canSaveToDatabase.language || isLoading || hasError} title={`Save ${activeTab} to Database`} className={`p-2 rounded transition ${!permissions.canSaveToDatabase.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'} disabled:opacity-50`}>
                    {savingAction === 'saveToDatabase' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div> : <ArrowDownTrayIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("releaseToDatabase")} disabled={isCurrentTabSaving || !permissions.canReleaseToDatabase.language || isLoading || hasError} title="Release to Database" className={`p-2 rounded transition ${!permissions.canReleaseToDatabase.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'} disabled:opacity-50`}>
                    {savingAction === 'releaseToDatabase' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin"></div> : <ArrowUpCircleIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("verifyData")} disabled={isCurrentTabSaving || !permissions.canVerifyData.language || isLoading || hasError} title="Verify Data" className={`p-2 rounded transition ${!permissions.canVerifyData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'} disabled:opacity-50`}>
                    {savingAction === 'verifyData' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-purple-400 rounded-full animate-spin"></div> : <CheckCircleIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("approveData")} disabled={isCurrentTabSaving || !permissions.canApproveData.language || isLoading || hasError} title="Approve Data" className={`p-2 rounded transition ${!permissions.canApproveData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'} disabled:opacity-50`}>
                    {savingAction === 'approveData' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-teal-400 rounded-full animate-spin"></div> : <CheckBadgeIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleActionClick("rejectData")} disabled={isCurrentTabSaving || !permissions.canRejectData.language || isLoading || hasError} title="Reject Data" className={`p-2 rounded transition ${!permissions.canRejectData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'} disabled:opacity-50`}>
                    {savingAction === 'rejectData' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-red-400 rounded-full animate-spin"></div> : <XCircleIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={onSkip} disabled={isCurrentTabSaving || isWorklistLoading || !permissions.canSkiptData.language || isLoading || hasError} title="Skip to Next" className={`p-2 rounded transition ${!permissions.canSkiptData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'} disabled:opacity-50`}>
                    {isWorklistLoading ? <div className="w-5 h-5 border-2 border-gray-400 border-t-orange-400 rounded-full animate-spin"></div> : <ArrowRightCircleIcon className="w-5 h-5" />}
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
                      ? 'text-red-600 bg-red-50 hover:bg-red-100'
                      : (currentResult.quiz_qa && currentResult.quiz_qa.length > 0)
                        ? 'text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700'
                        : 'text-gray-600 hover:text-[#00AEEF] hover:bg-gray-100'
                      } disabled:opacity-50`}
                  >
                    <AcademicCapIcon className="w-5 h-5" />
                  </button>
                </div>
                {isLoading ? <div className="flex items-center justify-center py-8"><div className="flex items-center space-x-2"><div className="w-5 h-5 border-2 border-gray-300 border-t-[#00AEEF] rounded-full animate-spin"></div><span className="text-gray-600">Loading {activeTab} Details...</span></div></div> : hasError ? <div className="p-3 bg-red-50 text-red-700 rounded-lg"><p><strong>Error:</strong> {currentResult.error}</p></div> : <div className="space-y-4">{[{ label: 'Object Name', key: 'object_name' }, { label: 'Description', key: 'object_description', textarea: true }, { label: 'Hint', key: 'object_hint', textarea: true }, { label: 'Short Hint', key: 'object_short_hint', textarea: true }, { label: 'Translation Status', key: 'translation_status' }].map(({ label, key, textarea }) => {
                  // Check if field has validation error
                  const isInvalid = isFieldInvalid(key);
                  const displayLabel = key === 'translation_status' ? `${activeTab} Approval Status` : label;

                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {displayLabel}:
                        {currentResult.flag_translation ? <span className="text-xs text-green-600 ml-2">⭐️</span> : <span className="text-xs text-blue-600 ml-2">✨</span>}
                      </label>
                      {isEditing[activeTab] && key !== 'translation_status' ? (
                        textarea ? (
                          <textarea
                            rows={3}
                            value={currentResult[key as keyof LanguageResult] as string || ''}
                            onChange={(e) => onUpdateLanguageResult(activeTab, key as keyof LanguageResult, e.target.value)}
                            className={`w-full p-2 border rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF] ${isInvalid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentResult[key as keyof LanguageResult] as string || ''}
                            onChange={(e) => onUpdateLanguageResult(activeTab, key as keyof LanguageResult, e.target.value)}
                            className={`w-full p-2 border rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF] ${isInvalid ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                          />
                        )
                      ) : key === 'translation_status' ? (
                        currentResult.translation_status ?
                          <StatusWorkflow statuses={['Draft', 'Released', 'Verified', 'Approved']} currentStatus={currentResult.translation_status} /> :
                          <p className="text-gray-900 bg-gray-50 p-2 rounded-md">-</p>
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-2 rounded-md">{currentResult[key as keyof LanguageResult] as string || '-'}</p>
                      )}
                    </div>
                  );
                })}

                  {/* Refine Results Section - Only visible in View Mode */}
                  {!currentResult.flag_translation && saveStatus[activeTab] !== 'saved' && !isEditing[activeTab] && permissions.canSwitchToEditMode.language && onReIdentify && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Refine Object Details</h3>
                      <p className="text-xs text-gray-500 mb-2">
                        Not happy with the results? Provide additional context to get better details.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={refineContext[activeTab] || ''}
                          onChange={(e) => setRefineContext(prev => ({ ...prev, [activeTab]: e.target.value }))}
                          placeholder="e.g., This is a vintage car from the 1920s..."
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-[#00AEEF] focus:border-[#00AEEF]"
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
                          className="px-3 py-2 bg-[#00AEEF] text-white text-sm font-medium rounded-md hover:bg-[#0096CC] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
        <p className="text-gray-500 italic text-center py-8">Select languages and click 'Identify Image' to see the object data.</p>
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

    return (
      <div className="h-full flex flex-col">
        {!selectedPageData ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <PhotoIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="italic">Select a page from the curriculum tree to view its images.</p>
          </div>
        ) : isCurriculumLoading && !imageLoadingProgress ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner text="Loading page..." />
          </div>
        ) : (
          <>
            {/* Breadcrumbs */}
            <div className="flex items-center space-x-1 text-xs text-gray-400 mb-4 bg-gray-50/50 p-2 rounded-lg">
              <BookOpenIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="hover:text-gray-600 cursor-default">{activeBook?.title}</span>
              <ChevronRightIcon className="w-3 h-3" />
              <FolderIcon className="w-3.5 h-3.5 text-amber-500" />
              <span className="hover:text-gray-600 cursor-default">{chapterName}</span>
              <ChevronRightIcon className="w-3 h-3" />
              <DocumentIcon className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-semibold text-gray-700">{pageTitle}</span>
              {selectedPageData.story && (
                <div className="ml-auto flex items-center bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[10px] font-medium animate-pulse">
                  <SparklesIcon className="w-3 h-3 mr-1" /> Story Ready
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-gray-800">{pageTitle}</h2>
                {isPageDirty && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Unsaved Changes</span>}
              </div>
              <div className="flex items-center space-x-3">
                {isDirty && (
                  <button
                    onClick={onSaveBook}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md shadow-green-500/20 transition-all active:scale-95"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                )}
                {imageLoadingProgress && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <LoadingSpinner size="sm" color="gray" className="mr-2" />
                    <span>Loading... {imageLoadingProgress.loaded} / {imageLoadingProgress.total}</span>
                  </div>
                )}
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
                  className="p-2 rounded-lg transition text-gray-600 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-transparent"
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex-1 overflow-y-auto bg-gray-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedPageData.images?.map((image, index) => {
                  if (image.isLoading) {
                    return (
                      <div key={image.image_id || `loader-${index}`} className="relative group rounded-xl bg-gray-200 aspect-square animate-pulse">
                        <div className="absolute top-1 left-1 z-20 bg-gray-400 bg-opacity-75 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
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
                      draggable={!image.isLoading}
                      onDragStart={(e) => handleDragStart(e, image.image_hash)}
                      onDragEnter={(e) => handleDragEnter(e, image.image_hash)}
                      onDragOver={(e) => handleDragOver(e, image.image_hash)}
                      onDragLeave={(e) => handleDragLeave(e, image.image_hash)}
                      onDrop={(e) => handleDrop(e, image.image_hash)}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={() => onCurriculumImageDoubleClick(image, activeBook?.language || languageForImageSearch)}
                      className={`relative group rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 aspect-square transition-all duration-300
                        ${isDraggingThis ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}
                        ${isDropTarget ? 'ring-4 ring-[#00AEEF] ring-offset-4 z-30' : 'hover:shadow-xl hover:-translate-y-1'}`}
                    >
                      {/* Position indicator badge */}
                      <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold rounded-lg px-1.5 py-0.5 flex items-center justify-center shadow-sm border border-gray-100">
                        {image.position || index + 1}
                      </div>

                      <div className="w-full h-full relative overflow-hidden">
                        <img
                          src={image.thumbnail}
                          alt={image.object_name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                            className="w-full text-xs px-2 py-1 rounded-lg border-2 border-[#00AEEF] focus:ring-0 text-gray-800 bg-white pointer-events-auto shadow-lg"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-lg px-2 py-1 border border-white/20 cursor-text pointer-events-auto" onClick={(e) => startEditingImageName(e, image)}>
                            <p className="text-white font-semibold text-xs truncate select-none flex-1">
                              {image.object_name}
                            </p>
                            <PencilIcon className="w-3 h-3 text-white/70 ml-1 flex-shrink-0" />
                          </div>
                        )}
                      </div>

                      {image.isNew && (
                        <div className="absolute top-2 right-10 w-2 h-2 bg-[#00AEEF] rounded-full border-2 border-white pointer-events-none shadow-sm" title="Not saved"></div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImageFromCurriculumPage(image.image_hash);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-white transition-all z-10 shadow-sm border border-gray-100"
                        title="Remove image"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {/* Add Image Box */}
                <div
                  className="relative group rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#00AEEF] hover:bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer aspect-square transition-all duration-300 shadow-sm hover:shadow-md"
                  onClick={() => setIsImageSearchModalOpen(true)}
                  title="Add a new image to this page"
                >
                  <PlusCircleIcon className="w-10 h-10 text-gray-300 group-hover:text-[#00AEEF] group-hover:scale-110 transition-all duration-300" />
                  <p className="text-[10px] font-bold text-gray-400 group-hover:text-[#00AEEF] mt-2 uppercase tracking-wider">Add Image</p>
                </div>
              </div>
            </div>
            {!!selectedPageData?.story && (
              <div className="mt-6 pt-6 border-t border-gray-100 flex-shrink-0">
                <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-4 rounded-2xl border border-blue-100/50 shadow-sm relative overflow-hidden group/prompt">
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-[#00AEEF] opacity-[0.03] rounded-full pointer-events-none transition-transform duration-700 group-hover/prompt:scale-110"></div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <label htmlFor="userComments" className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                        <SparklesIcon className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                        Regeneration Instructions
                      </label>
                      {userComments && (
                        <button
                          onClick={() => setUserComments('')}
                          className="text-[10px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="relative bg-white rounded-xl border border-blue-100 shadow-inner focus-within:ring-2 focus-within:ring-[#00AEEF]/10 focus-within:border-[#00AEEF] transition-all overflow-hidden">
                      <textarea
                        id="userComments"
                        rows={2}
                        value={userComments}
                        onChange={(e) => setUserComments(e.target.value)}
                        className="w-full p-4 pr-32 text-sm bg-transparent outline-none resize-none placeholder-gray-400 leading-relaxed min-h-[80px]"
                        placeholder="e.g., Make the story more adventurous, mention the blue bird..."
                        disabled={isStoryLoading}
                      />

                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        <button
                          onClick={() => onGenerateStory?.(selectedPageData!.page_id!, userComments)}
                          disabled={isStoryLoading || !!isPageDirty}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-500/10 
                            ${isPageDirty
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed bg-transparent border border-gray-100'
                              : 'bg-[#00AEEF] text-white hover:bg-[#0096CC] hover:shadow-blue-500/20 shadow-lg'}`}
                          title={isPageDirty ? "Save changes before regenerating" : "Regenerate story"}
                        >
                          {isStoryLoading ? (
                            <LoadingSpinner size="sm" color="white" className="mr-1" />
                          ) : (
                            <ArrowPathIcon className="w-4 h-4" />
                          )}
                          <span>{isStoryLoading ? 'Regenerating...' : 'Regenerate'}</span>
                        </button>
                      </div>
                    </div>

                    {isPageDirty && (
                      <p className="mt-2 text-[10px] text-amber-600 flex items-center font-medium animate-pulse">
                        <InformationCircleIcon className="w-3 h-3 mr-1" />
                        Please save your image sequence changes before regenerating.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (leftPanelView === 'curriculum') {
      return renderCurriculumView();
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
        <p className="text-gray-500 italic text-center">{placeholderText}</p>
      </div>
    );
  };

  return (
    <div className={`w-full bg-white rounded-lg shadow p-4 flex flex-col ${className}`}>
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
    </div>
  );
};