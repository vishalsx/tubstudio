// components/panels/MiddlePanel.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon, ArrowUpCircleIcon, CheckCircleIcon, CheckBadgeIcon, XCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import { PlusCircleIcon, TrashIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { LanguageResult, SaveStatus, PermissionCheck, CurriculumImage, DatabaseImage, CommonData, Page, Book } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';
import { ImageSearchModal } from '../common/ImageSearchModal';
import { LoadingSpinner } from '../common/LoadingSpinner';

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
  onCurriculumImageClick: (image: CurriculumImage, language: string) => void;
  languageForImageSearch: string;
  onAddImageToCurriculumPage: (image: DatabaseImage) => void;
  onRemoveImageFromCurriculumPage: (imageHash: string) => void;
  onAddNewImageFromSearch: (searchQuery: string) => void;
  isStoryLoading: boolean;
  onCreateStory: () => void;
  onGenerateStory?: (pageId: string, userComments?: string) => void;
  onReorderImagesOnPage: (draggedImageHash: string, targetImageHash: string) => void;
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
    onCurriculumImageClick,
    languageForImageSearch,
    onAddImageToCurriculumPage,
    onRemoveImageFromCurriculumPage,
    onAddNewImageFromSearch,
    isStoryLoading,
    onCreateStory,
    onGenerateStory,
    onReorderImagesOnPage,
  } = props;

  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false);
  const [draggedImageHash, setDraggedImageHash] = useState<string | null>(null);
  const [dragOverHash, setDragOverHash] = useState<string | null>(null);
  const [userComments, setUserComments] = useState('');

  useEffect(() => {
    setUserComments('');
  }, [selectedPageData?.page_id]);


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

  const handleAddImageFromSearch = (image: DatabaseImage) => {
    // The duplicate check is now handled inside the modal, so we just call the add function.
    if (selectedPageData && onAddImageToCurriculumPage) {
      onAddImageToCurriculumPage(image);
    }
  };

  const handleAddNewImage = (searchQuery: string) => {
    onAddNewImageFromSearch(searchQuery);
    setIsImageSearchModalOpen(false); // Close the modal after triggering the action
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, imageHash: string) => {
    setDraggedImageHash(imageHash);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', imageHash);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetImageHash: string) => {
    e.preventDefault();
    if (draggedImageHash && targetImageHash !== draggedImageHash) {
      setDragOverHash(targetImageHash);
    }
  };

  const handleDragLeave = () => {
    setDragOverHash(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetImageHash: string) => {
    e.preventDefault();
    if (draggedImageHash && draggedImageHash !== targetImageHash) {
      onReorderImagesOnPage(draggedImageHash, targetImageHash);
    }
    setDraggedImageHash(null);
    setDragOverHash(null);
  };

  const handleDragEnd = () => {
    setDraggedImageHash(null);
    setDragOverHash(null);
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
                        {isEditing[activeTab] ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>}
                    </button>
                    <button onClick={() => onSave("saveToDatabase")} disabled={isCurrentTabSaving || !permissions.canSaveToDatabase.language || isLoading || hasError} title={`Save ${activeTab} to Database`} className={`p-2 rounded transition ${!permissions.canSaveToDatabase.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'} disabled:opacity-50`}>
                        {savingAction === 'saveToDatabase' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                    </button>
                    <button onClick={() => onSave("releaseToDatabase")} disabled={isCurrentTabSaving || !permissions.canReleaseToDatabase.language || isLoading || hasError} title="Release to Database" className={`p-2 rounded transition ${!permissions.canReleaseToDatabase.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'} disabled:opacity-50`}>
                        {savingAction === 'releaseToDatabase' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin"></div> : <ArrowUpCircleIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => onSave("verifyData")} disabled={isCurrentTabSaving || !permissions.canVerifyData.language || isLoading || hasError} title="Verify Data" className={`p-2 rounded transition ${!permissions.canVerifyData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'} disabled:opacity-50`}>
                        {savingAction === 'verifyData' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-purple-400 rounded-full animate-spin"></div> : <CheckCircleIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => onSave("approveData")} disabled={isCurrentTabSaving || !permissions.canApproveData.language || isLoading || hasError} title="Approve Data" className={`p-2 rounded transition ${!permissions.canApproveData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'} disabled:opacity-50`}>
                        {savingAction === 'approveData' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-teal-400 rounded-full animate-spin"></div> : <CheckBadgeIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => onSave("rejectData")} disabled={isCurrentTabSaving || !permissions.canRejectData.language || isLoading || hasError} title="Reject Data" className={`p-2 rounded transition ${!permissions.canRejectData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'} disabled:opacity-50`}>
                        {savingAction === 'rejectData' ? <div className="w-5 h-5 border-2 border-gray-400 border-t-red-400 rounded-full animate-spin"></div> : <XCircleIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={onSkip} disabled={isCurrentTabSaving || isWorklistLoading || !permissions.canSkiptData.language || isLoading || hasError} title="Skip to Next" className={`p-2 rounded transition ${!permissions.canSkiptData.language ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'} disabled:opacity-50`}>
                        {isWorklistLoading ? <div className="w-5 h-5 border-2 border-gray-400 border-t-orange-400 rounded-full animate-spin"></div> : <ArrowRightCircleIcon className="w-5 h-5" />}
                    </button>
                </div>
                {isLoading ? <div className="flex items-center justify-center py-8"><div className="flex items-center space-x-2"><div className="w-5 h-5 border-2 border-gray-300 border-t-[#00AEEF] rounded-full animate-spin"></div><span className="text-gray-600">Loading {activeTab} Details...</span></div></div> : hasError ? <div className="p-3 bg-red-50 text-red-700 rounded-lg"><p><strong>Error:</strong> {currentResult.error}</p></div> : <div className="space-y-4">{[{ label: 'Object Name', key: 'object_name' }, { label: 'Description', key: 'object_description', textarea: true }, { label: 'Hint', key: 'object_hint', textarea: true }, { label: 'Short Hint', key: 'object_short_hint', textarea: true }, { label: 'Translation Status', key: 'translation_status' }].map(({ label, key, textarea }) => (<div key={key}><label className="block text-sm font-medium text-gray-700 mb-1">{label}:{currentResult.flag_translation ? <span className="text-xs text-green-600 ml-2">⭐️</span> : <span className="text-xs text-blue-600 ml-2">✨</span>}</label>{isEditing[activeTab] && key !== 'translation_status' ? (textarea ? <textarea rows={3} value={currentResult[key as keyof LanguageResult] as string || ''} onChange={(e) => onUpdateLanguageResult(activeTab, key as keyof LanguageResult, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]" /> : <input type="text" value={currentResult[key as keyof LanguageResult] as string || ''} onChange={(e) => onUpdateLanguageResult(activeTab, key as keyof LanguageResult, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]" />) : key === 'translation_status' ? (currentResult.translation_status && currentResult.translation_status!.toLowerCase() !== 'approved' ? <StatusWorkflow statuses={['Draft', 'Released', 'Verified', 'Approved']} currentStatus={currentResult.translation_status} /> : <p className="text-gray-900 bg-gray-50 p-2 rounded-md font-semibold text-green-600">{currentResult.translation_status || '-'}</p>) : <p className="text-gray-900 bg-gray-50 p-2 rounded-md">{currentResult[key as keyof LanguageResult] as string || '-'}</p>}</div>))}</div>}
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
    
    // Get hashes of existing images on the page to prevent duplicates
    const existingImageHashes = selectedPageData?.images.map(img => img.image_hash) || [];

    return (
      <div className="h-full flex flex-col">
        {!selectedPageData ? (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            Select a page from the curriculum tree to view its images.
          </div>
        ) : isCurriculumLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner text="Loading images..." />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700 truncate pr-4">{chapterName} ({pageTitle})</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onCreateStory}
                  disabled={isStoryLoading || !!isPageDirty || !!selectedPageData.story || (selectedPageData.images?.length || 0) < 5}
                  title={
                    isPageDirty
                      ? "Save page changes before creating a story"
                      : !!selectedPageData.story
                      ? "Story already exists for this page"
                      : (selectedPageData.images?.length || 0) < 5
                      ? "Add at least 5 images to create a story"
                      : "Create Story"
                  }
                  className="p-2 rounded-lg transition text-gray-600 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-transparent"
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onGenerateStory?.(selectedPageData!.page_id!, userComments)}
                  disabled={isStoryLoading || !selectedPageData?.story || !!isPageDirty}
                  title={
                    !selectedPageData?.story
                      ? "A story must be generated first"
                      : !!isPageDirty
                      ? "Save new images before regenerating the story"
                      : "Regenerate story with new comments"
                  }
                  className="p-2 rounded-lg transition text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-transparent"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex-1 overflow-y-auto bg-gray-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedPageData.images?.map(image => (
                  <div
                    key={image.image_id || image.image_hash}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image.image_hash)}
                    onDragOver={(e) => handleDragOver(e, image.image_hash)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, image.image_hash)}
                    onDragEnd={handleDragEnd}
                    className={`relative group rounded-xl overflow-hidden shadow-md cursor-grab aspect-square transition-all duration-200 ${
                      draggedImageHash === image.image_hash ? 'opacity-30' : 'opacity-100'
                    } ${
                      dragOverHash === image.image_hash && draggedImageHash !== image.image_hash ? 'ring-4 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.object_name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onClick={() => onCurriculumImageClick(image, activeBook?.language || languageForImageSearch)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                      <p className="text-white font-bold text-xs text-center drop-shadow-lg truncate">{image.object_name}</p>
                    </div>
                      {image.isNew && <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" title="Not saved"></div>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImageFromCurriculumPage(image.image_hash);
                      }}
                      className="absolute top-1 right-1 p-1 bg-black bg-opacity-40 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      title="Remove image from page"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {/* Add Image Box */}
                <div
                  className="relative group rounded-xl border-2 border-dashed border-gray-400 hover:border-[#00AEEF] bg-gray-50 flex flex-col items-center justify-center cursor-pointer aspect-square transition-colors"
                  onClick={() => setIsImageSearchModalOpen(true)}
                  title="Add a new image to this page"
                >
                  <PlusCircleIcon className="w-8 h-8 text-gray-400 group-hover:text-[#00AEEF] transition-colors" />
                  <p className="text-xs text-gray-500 group-hover:text-[#00AEEF] mt-1 text-center">Add new image</p>
                </div>
              </div>
            </div>
            {!!selectedPageData?.story && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
                <label htmlFor="userComments" className="block text-sm font-medium text-gray-700 mb-1">Add instruction and regenerate the story</label>
                <textarea
                  id="userComments"
                  rows={2}
                  value={userComments}
                  onChange={(e) => setUserComments(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g., Make the story funnier, mention the red car..."
                  disabled={isStoryLoading}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    // Curriculum view is handled separately
    if (leftPanelView === 'curriculum') {
      return renderCurriculumView();
    }
  
    // For both Upload and Database views, show the editor if an image is active (i.e., has language results)
    const hasActiveImage = Object.keys(languageResults).length > 0;
  
    if (hasActiveImage) {
      return renderTranslationEditor();
    }
  
    // Otherwise, show a relevant placeholder
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
    </div>
  );
};