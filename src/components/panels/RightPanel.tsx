import React, { useState, useEffect } from 'react';
import { CommonData, FileInfo, LanguageResult, PermissionCheck, DatabaseImage, CurriculumImage, Book, Chapter, Page, OrgObject, UserContext } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';
import { ContestRightPanel } from './contest/ContestRightPanel';
import { useContest } from '../../hooks/useContest';
import { useMyContent } from '../../hooks/useMyContent';
import { PencilIcon, CheckIcon, XMarkIcon, IdentificationIcon, AcademicCapIcon, BookOpenIcon, SparklesIcon, InformationCircleIcon, ShoppingCartIcon, ShoppingBagIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// Define the new spinner component locally
const StoryLoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] animate-fade-in">
      <div className="running-child-container mb-4">
        <svg
          className="w-24 h-24 text-[var(--color-primary)] running-child-svg"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Back arm/leg */}
          <path className="running-child-arm-1" d="M40 30 L20 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path className="running-child-leg-1" d="M40 55 L25 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

          {/* Body and Head */}
          <path d="M40 23 V 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="40" cy="15" r="8" fill="currentColor" />

          {/* Front arm/leg */}
          <path className="running-child-leg-2" d="M40 55 L55 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path className="running-child-arm-2" d="M40 30 L60 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-semibold text-lg text-[var(--color-primary)]">Writing a magical story...</p>
      <p className="text-sm">Our little storyteller is running to fetch the perfect words!</p>
    </div>
  );
};

interface RightPanelProps {
  leftPanelView: 'upload' | 'database' | 'curriculum' | 'contest' | 'my_content';
  selectedCurriculumNode: Book | Chapter | Page | null;
  currentCommonData: CommonData;
  currentFileInfo: FileInfo;
  activeTab: string;
  isEditing: { [key: string]: boolean };
  languageResults: { [key: string]: LanguageResult };
  commonDataMode: 'shared' | 'per-tab';
  permissions: {
    canSwitchToEditMode: PermissionCheck;
  };
  onUpdateCommonData: (key: keyof CommonData, value: any) => void;
  className?: string;
  showContent: boolean;
  isDirty?: boolean;
  onSaveBook?: () => void;
  isStoryLoading?: boolean; // New prop
  onUpdateStory?: (newStory: string, newMoral?: string) => void;
  // Contest Props
  contestProps: ReturnType<typeof useContest>;
  userContext: UserContext | null;
  // My Content Props
  myContentProps: ReturnType<typeof useMyContent>;
  // Curriculum Update Props
  onUpdateBook?: (updates: Partial<Book>) => void;
  onUpdateChapter?: (chapterId: string, updates: Partial<Chapter>) => void;
  onUpdatePage?: (pageId: string, updates: Partial<Page>) => void;
  activeBook?: Book | null;
  languageOptions?: string[];
}

export const RightPanel: React.FC<RightPanelProps> = ({
  leftPanelView,
  selectedCurriculumNode,
  currentCommonData,
  currentFileInfo,
  activeTab,
  isEditing,
  languageResults,
  commonDataMode,
  permissions,
  onUpdateCommonData,
  className = '',
  showContent,
  isDirty,
  onSaveBook,
  isStoryLoading,
  onUpdateStory,
  contestProps,
  userContext,
  myContentProps,
  onUpdateBook,
  onUpdateChapter,
  onUpdatePage,
  activeBook,
  languageOptions = [],
}) => {
  // Global check for purchased status
  const isPurchasedBook = activeBook?.ownership_type === 'purchased';
  const isPublishedBook = activeBook?.book_status === 'Published';
  const isReadOnly = isPurchasedBook || isPublishedBook;

  const [isStoryEditing, setIsStoryEditing] = useState(false);
  const [editedStory, setEditedStory] = useState('');
  const [editedMoral, setEditedMoral] = useState('');

  // Curriculum node editing state
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [detailsFormData, setDetailsFormData] = useState<any>(null);

  // Update local edit state when selected node changes
  useEffect(() => {
    if (selectedCurriculumNode) {
      if ('story' in selectedCurriculumNode) {
        setEditedStory(selectedCurriculumNode.story || '');
        setEditedMoral(selectedCurriculumNode.moral || '');
      }
      // Shallow clone for editing
      setDetailsFormData({ ...selectedCurriculumNode });
    } else {
      setDetailsFormData(null);
    }
    setIsStoryEditing(false);
    setIsDetailsEditing(false);
  }, [selectedCurriculumNode]);

  // Reset editing states if read-only becomes true
  useEffect(() => {
    if (isReadOnly) {
      setIsDetailsEditing(false);
      setIsStoryEditing(false);
    }
  }, [isReadOnly]);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetailsFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = () => {
    if (!selectedCurriculumNode || !detailsFormData) return;

    if ('chapters' in selectedCurriculumNode) { // Book
      onUpdateBook?.(detailsFormData);
    } else if ('pages' in selectedCurriculumNode) { // Chapter
      const chId = (selectedCurriculumNode as Chapter).chapter_id;
      if (chId) onUpdateChapter?.(chId, detailsFormData);
    } else if ('images' in selectedCurriculumNode) { // Page
      const pgId = (selectedCurriculumNode as Page).page_id;
      if (pgId) onUpdatePage?.(pgId, detailsFormData);
    }
    setIsDetailsEditing(false);
  };

  const hasResults = Object.keys(languageResults).length > 0;

  const getEditCondition = () => {
    if (isReadOnly) return false;

    if (commonDataMode === 'shared') {
      return isEditing['English'] && activeTab === 'English' && permissions.canSwitchToEditMode.metadata;
    } else {
      return isEditing[activeTab] && permissions.canSwitchToEditMode.metadata;
    }
  };
  const canEdit = getEditCondition();

  const getEditRestrictionMessage = () => {
    if (commonDataMode === 'shared' && activeTab !== 'English') return null;
    if (commonDataMode === 'per-tab' && !permissions.canSwitchToEditMode.metadata) return null;
    return null;
  };
  const editRestrictionMessage = getEditRestrictionMessage();

  const getCurriculumNodeTitle = () => {
    if (!selectedCurriculumNode) {
      return "Curriculum Details";
    }
    if ('chapters' in selectedCurriculumNode) { // It's a Book
      return "Book details";
    }
    if ('pages' in selectedCurriculumNode) { // It's a Chapter
      return "Chapter Details";
    }
    // It's a Page
    return "Page details";
  };

  const renderMetadataContent = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Object's Metadata</h2>
        {commonDataMode === 'shared' && (
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Shared</span>
        )}
      </div>
      {hasResults ? (
        <div className="flex-1 overflow-y-auto">
          {Object.values(languageResults).every(result => result?.isLoading) ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#00AEEF] rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading Object's Metadata...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <h3 className="font-medium text-[var(--text-muted)] mb-1">Object Category</h3>
                {canEdit ? <input type="text" value={currentCommonData.object_category || ''} onChange={(e) => onUpdateCommonData('object_category', e.target.value)} className="w-full p-2 border border-[var(--border-main)] rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-panel)] text-[var(--text-main)]" /> : <div><p className="text-[var(--text-main)]">{currentCommonData.object_category || '-'}</p>{editRestrictionMessage && <span className="text-xs text-[var(--text-muted)]">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <h3 className="font-medium text-[var(--text-muted)] mb-1">Tags</h3>
                {canEdit ? <input type="text" value={currentCommonData.tags ? currentCommonData.tags.join(', ') : ''} onChange={(e) => onUpdateCommonData('tags', e.target.value.split(',').map(tag => tag.trim()))} className="w-full p-2 border border-[var(--border-main)] rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-panel)] text-[var(--text-main)]" placeholder="Enter tags separated by commas" /> : <div><div className="flex flex-wrap gap-1 mb-2">{currentCommonData.tags?.map((tag, index) => <span key={index} className="px-2 py-1 bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs rounded-full font-medium">{tag}</span>) || <span className="text-[var(--text-muted)]">-</span>}</div>{editRestrictionMessage && <span className="text-xs text-[var(--text-muted)]">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <h3 className="font-medium text-[var(--text-muted)] mb-1">Field of Study</h3>
                {canEdit ? <input type="text" value={currentCommonData.field_of_study || ''} onChange={(e) => onUpdateCommonData('field_of_study', e.target.value)} className="w-full p-2 border border-[var(--border-main)] rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-panel)] text-[var(--text-main)]" /> : <div><p className="text-[var(--text-main)]">{currentCommonData.field_of_study || '-'}</p>{editRestrictionMessage && <span className="text-xs text-[var(--text-muted)]">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <h3 className="font-medium text-[var(--text-muted)] mb-1">Age Appropriate</h3>
                {canEdit ? <input type="text" value={currentCommonData.age_appropriate || ''} onChange={(e) => onUpdateCommonData('age_appropriate', e.target.value)} className="w-full p-2 border border-[var(--border-main)] rounded-md focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--bg-panel)] text-[var(--text-main)]" /> : <div><p className="text-[var(--text-main)]">{currentCommonData.age_appropriate || '-'}</p>{editRestrictionMessage && <span className="text-xs text-[var(--text-muted)]">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <h3 className="font-medium text-[var(--text-muted)] mb-1">Object Status</h3>
                {currentCommonData.image_status ? <StatusWorkflow statuses={['Draft', 'Released', 'Verified', 'Approved']} currentStatus={currentCommonData.image_status} className="py-1" /> : <p className="text-[var(--text-main)]">-</p>}
              </div>
              <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm p-2 rounded-lg border border-[var(--border-main)]">
                <h3 className="font-medium text-[var(--text-muted)] mb-2">File Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-[var(--text-muted)]">Filename:</p><p className="text-[var(--text-main)] break-words">{currentFileInfo.filename || 'N/A'}</p>
                  <p className="text-[var(--text-muted)]">Mime type:</p><p className="text-[var(--text-main)]">{currentFileInfo.mimeType || 'N/A'}</p>
                  <p className="text-[var(--text-muted)]">Size:</p><p className="text-[var(--text-main)]">{currentFileInfo.size || 'N/A'}</p>
                  <p className="text-[var(--text-muted)]">Dimensions:</p><p className="text-[var(--text-main)]">{currentFileInfo.dimensions || 'N/A'}</p>
                  <p className="text-[var(--text-muted)]">Created by:</p><p className="text-[var(--text-main)] break-words">{currentFileInfo.created_by || 'N/A'}</p>
                  <p className="text-[var(--text-muted)]">Created at:</p><p className="text-[var(--text-main)] break-words">{currentFileInfo.created_at ? new Date(currentFileInfo.created_at).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-[var(--text-muted)]">Last Updated by:</p><p className="text-[var(--text-main)] break-words">{currentFileInfo.updated_by || 'N/A'}</p>
                  <p className="text-[var(--text-muted)]">Last Updated at:</p><p className="text-[var(--text-main)] break-words">{currentFileInfo.updated_at ? new Date(currentFileInfo.updated_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-muted)] italic text-center">Upload or select an object to see its metadata.</p>
        </div>
      )}
    </>
  );

  const renderCurriculumNodeDetails = () => {
    if (!selectedCurriculumNode) return null;

    let details;
    const isPage = 'images' in selectedCurriculumNode && !('pages' in selectedCurriculumNode);

    if (isPage && isStoryLoading) {
      return (
        <div className="h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex-shrink-0">{getCurriculumNodeTitle()}</h2>
          <div className="flex-1 overflow-y-auto">
            <StoryLoadingSpinner />
          </div>
        </div>
      );
    }

    const handleCancelDetails = () => {
      setDetailsFormData({ ...selectedCurriculumNode });
      setIsDetailsEditing(false);
    };

    if ('chapters' in selectedCurriculumNode) { // It's a Book
      const book = selectedCurriculumNode as Book;
      const isPurchased = book.ownership_type === 'purchased';
      const isPublished = book.book_status === 'Published';
      const isReadOnlyNode = isPurchased || isPublished;

      details = (
        <div className="space-y-4">
          {/* Purchased Book Banner */}
          {isPurchased && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start space-x-3 shadow-sm">
              <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full shadow-inner">
                <ShoppingBagIcon className="w-5 h-5 text-amber-600 dark:text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100">Purchased Book</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  This book is read-only. Contents are managed by the publisher.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-md border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-medium">
                    Purchased: {book.purchase_date ? new Date(book.purchase_date).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-md border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-medium">
                    Type: {book.access_type || 'Permanent'}
                  </span>
                  {book.expiry_date && (
                    <span className="px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-md border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-medium">
                      Expires: {new Date(book.expiry_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Published Book Banner */}
          {!isPurchased && isPublished && (
            <div className="bg-green-50 text-green-800 border-green-200 border p-3 rounded-xl flex items-start space-x-3 shadow-sm">
              <div className="bg-green-100 p-2 rounded-full shadow-inner">
                <CheckIcon className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-green-900">Published Book</h3>
                <p className="text-xs text-green-700 mt-1">
                  This book is published and is currently in Read-Only mode. Unpublish (if allowed) or create a new version to edit.
                </p>
              </div>
            </div>
          )
          }

          <div className="bg-[var(--bg-input)] border border-[var(--border-main)] p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] opacity-70 uppercase tracking-widest mb-2 flex items-center">
              <IdentificationIcon className="w-3 h-3 mr-1" /> Identity
            </h4>
            <div className="space-y-2">
              {/* Book Cover Image */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-1">Book Cover</h3>
                {isDetailsEditing ? (
                  <label className="block cursor-pointer">
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden border-2 border-dashed border-[var(--border-main)] hover:border-[var(--color-primary)] transition-colors bg-[var(--bg-panel)] flex items-center justify-center group">
                      {detailsFormData?.front_cover_image ? (
                        <img
                          src={detailsFormData.front_cover_image.startsWith('data:') ? detailsFormData.front_cover_image : `data:image/jpeg;base64,${detailsFormData.front_cover_image}`}
                          alt="Book Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                          <PhotoIcon className="w-6 h-6 mb-1" />
                          <span className="text-[8px] font-medium">Upload Cover</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">Change</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert("File is too large. Please upload an image smaller than 5MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setDetailsFormData((prev: any) => ({ ...prev, front_cover_image: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="w-24 h-32 rounded-lg overflow-hidden border border-[var(--border-main)] bg-[var(--bg-panel)]">
                    {book.front_cover_image ? (
                      <img
                        src={book.front_cover_image.startsWith('data:') ? book.front_cover_image : `data:image/jpeg;base64,${book.front_cover_image}`}
                        alt="Book Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                        <PhotoIcon className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Book Title</h3>
                {isDetailsEditing ? (
                  <input type="text" name="title" value={detailsFormData?.title || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)] font-medium">{book.title}</p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Author</h3>
                {isDetailsEditing ? (
                  <input type="text" name="author" value={detailsFormData?.author || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)]">{book.author}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm border border-[var(--border-main)] p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] opacity-70 uppercase tracking-widest mb-2 flex items-center">
              <AcademicCapIcon className="w-3 h-3 mr-1" /> Education Info
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Subject</h3>
                {isDetailsEditing ? (
                  <input type="text" name="subject" value={detailsFormData?.subject || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)]">{book.subject}</p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Board</h3>
                {isDetailsEditing ? (
                  <input type="text" name="education_board" value={detailsFormData?.education_board || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)]">{book.education_board}</p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Grade</h3>
                {isDetailsEditing ? (
                  <input type="text" name="grade_level" value={detailsFormData?.grade_level || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)]">{book.grade_level}</p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Language</h3>
                {isDetailsEditing ? (
                  <input type="text" name="language" value={detailsFormData?.language || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)]">{book.language}</p>
                )}
              </div>
            </div>
            {/* Additional Languages */}
            <div className="mt-3 pt-2 border-t border-[var(--border-main)]">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-1.5">Additional Languages</h3>
              {isDetailsEditing ? (
                <div className="flex flex-wrap gap-2">
                  {languageOptions
                    .filter(lang => lang !== (detailsFormData?.language || book.language))
                    .map(lang => {
                      const isSelected = detailsFormData?.additional_languages?.includes(lang) || false;
                      return (
                        <label key={lang} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setDetailsFormData((prev: any) => {
                                const currentLangs = prev.additional_languages || [];
                                const newLangs = checked
                                  ? [...currentLangs, lang]
                                  : currentLangs.filter((l: string) => l !== lang);

                                // Clean up pricing if language is deselected
                                const newPricing = { ...prev.base_pricing?.additional_language_prices };
                                if (!checked) delete newPricing[lang];

                                return {
                                  ...prev,
                                  additional_languages: newLangs,
                                  base_pricing: { ...prev.base_pricing, additional_language_prices: newPricing }
                                };
                              });
                            }}
                            className="w-3.5 h-3.5 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--bg-panel)]"
                          />
                          <span className="text-xs text-[var(--text-main)]">{lang}</span>
                        </label>
                      );
                    })}
                  {languageOptions.filter(lang => lang !== (detailsFormData?.language || book.language)).length === 0 && (
                    <span className="text-xs text-[var(--text-muted)] italic">No additional languages available</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {book.additional_languages && book.additional_languages.length > 0 ? (
                    book.additional_languages.map((lang: string) => (
                      <span key={lang} className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-full">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--text-muted)] italic">None selected</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="bg-[var(--bg-input)]/30 border border-[var(--border-main)] p-3 rounded-xl">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] opacity-70 uppercase tracking-widest mb-2 flex items-center">
              Settings & Sharing
            </h4>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={isDetailsEditing ? !!detailsFormData?.is_public : !!book.is_public}
                  onChange={(e) => isDetailsEditing && setDetailsFormData((prev: any) => ({ ...prev, is_public: e.target.checked }))}
                  disabled={!isDetailsEditing}
                  className="w-4 h-4 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--bg-panel)]"
                />
                <span className="text-sm text-[var(--text-main)]">Public Book</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_commercial"
                  checked={isDetailsEditing ? !!detailsFormData?.is_commercial : !!book.is_commercial}
                  onChange={(e) => isDetailsEditing && setDetailsFormData((prev: any) => ({ ...prev, is_commercial: e.target.checked }))}
                  disabled={!isDetailsEditing}
                  className="w-4 h-4 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--bg-panel)]"
                />
                <span className="text-sm text-[var(--text-main)]">Commercial</span>
              </label>
            </div>

            {(isDetailsEditing ? detailsFormData?.is_commercial : book.is_commercial) && (
              <div className="mt-3 pt-3 border-t border-[var(--border-main)] grid grid-cols-3 gap-3">
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">One-time Price</h3>
                  {isDetailsEditing ? (
                    <input type="number" name="one_time_purchase_price" value={detailsFormData?.base_pricing?.one_time_purchase_price || 0} onChange={(e) => setDetailsFormData((prev: any) => ({ ...prev, base_pricing: { ...prev.base_pricing, one_time_purchase_price: Number(e.target.value) } }))} className="w-full mt-1 p-1.5 text-xs border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                  ) : (
                    <p className="text-sm font-medium text-[var(--text-main)]">${book.base_pricing?.one_time_purchase_price || 0}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Sub. Price</h3>
                  {isDetailsEditing ? (
                    <input type="number" name="subscription_price" value={detailsFormData?.base_pricing?.subscription_price || 0} onChange={(e) => setDetailsFormData((prev: any) => ({ ...prev, base_pricing: { ...prev.base_pricing, subscription_price: Number(e.target.value) } }))} className="w-full mt-1 p-1.5 text-xs border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                  ) : (
                    <p className="text-sm font-medium text-[var(--text-main)]">${book.base_pricing?.subscription_price || 0}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Period (Days)</h3>
                  {isDetailsEditing ? (
                    <input type="number" name="subscription_period_days" value={detailsFormData?.base_pricing?.subscription_period_days || 30} onChange={(e) => setDetailsFormData((prev: any) => ({ ...prev, base_pricing: { ...prev.base_pricing, subscription_period_days: Number(e.target.value) } }))} className="w-full mt-1 p-1.5 text-xs border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                  ) : (
                    <p className="text-sm font-medium text-[var(--text-main)]">{book.base_pricing?.subscription_period_days || 30} d</p>
                  )}
                </div>
              </div>
            )}

            {/* Additional Language Pricing */}
            {(isDetailsEditing ? detailsFormData?.is_commercial : book.is_commercial) && (
              <div className="mt-3 pt-2 border-t border-[var(--border-main)]">
                <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-2">Language Add-on Pricing</h3>
                {isDetailsEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(detailsFormData?.additional_languages || []).map((lang: string) => (
                      <div key={lang} className="flex items-center gap-2 bg-[var(--bg-panel)] px-2 py-1.5 rounded border border-[var(--border-main)]">
                        <span className="text-xs text-[var(--text-main)] flex-1">{lang}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[var(--text-muted)]">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={detailsFormData?.base_pricing?.additional_language_prices?.[lang] || 0}
                            onChange={(e) => setDetailsFormData((prev: any) => ({
                              ...prev,
                              base_pricing: {
                                ...prev.base_pricing,
                                additional_language_prices: {
                                  ...prev.base_pricing?.additional_language_prices,
                                  [lang]: parseFloat(e.target.value) || 0
                                }
                              }
                            }))}
                            className="w-16 p-1 text-xs border border-[var(--border-main)] rounded bg-[var(--bg-input)] text-[var(--text-main)] text-right"
                          />
                        </div>
                      </div>
                    ))}
                    {(detailsFormData?.additional_languages || []).length === 0 && (
                      <span className="text-xs text-[var(--text-muted)] italic col-span-2">Select additional languages above to set pricing</span>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {book.base_pricing?.additional_language_prices && Object.keys(book.base_pricing.additional_language_prices).length > 0 ? (
                      Object.entries(book.base_pricing.additional_language_prices).map(([lang, price]) => (
                        <div key={lang} className="flex items-center justify-between bg-[var(--bg-panel)] px-2 py-1 rounded border border-[var(--border-main)]">
                          <span className="text-xs text-[var(--text-main)]">{lang}</span>
                          <span className="text-xs font-semibold text-[var(--color-primary)]">${price as number}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic col-span-2">No add-on pricing set</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div >
      );
    } else if ('pages' in selectedCurriculumNode) { // It's a Chapter
      const chapter = selectedCurriculumNode as Chapter;
      details = (
        <div className="space-y-4">
          <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm border border-[var(--border-main)] p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] opacity-70 uppercase tracking-widest mb-2 flex items-center">
              <IdentificationIcon className="w-3 h-3 mr-1" /> Chapter Info
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)]">Chapter Title</h3>
                  {isDetailsEditing ? (
                    <input type="text" name="chapter_name" value={detailsFormData?.chapter_name || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                  ) : (
                    <p className="text-sm text-[var(--text-main)] font-medium">{chapter.chapter_name}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)]">Number</h3>
                  {isDetailsEditing ? (
                    <input type="number" name="chapter_number" value={detailsFormData?.chapter_number || ''} onChange={handleDetailsChange} className="w-20 mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)] text-right" />
                  ) : (
                    <p className="text-sm text-[var(--text-main)]">{chapter.chapter_number}</p>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--border-main)]">
                <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-1">Description</h3>
                {isDetailsEditing ? (
                  <textarea name="description" value={detailsFormData?.description || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)] min-h-[100px]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)] opacity-90 leading-relaxed">{chapter.description || "No description provided."}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (isPage) { // It's a Page
      const page = selectedCurriculumNode as Page;
      details = (
        <div className="space-y-4">
          <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm border border-[var(--border-main)] p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] opacity-70 uppercase tracking-widest mb-2 flex items-center">
              <IdentificationIcon className="w-3 h-3 mr-1" /> Page Info
            </h4>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Page Title</h3>
                {isDetailsEditing ? (
                  <input type="text" name="title" value={detailsFormData?.title || ''} onChange={handleDetailsChange} className="w-full mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)]" />
                ) : (
                  <p className="text-sm text-[var(--text-main)] font-medium">{page.title}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Number</h3>
                {isDetailsEditing ? (
                  <input type="number" name="page_number" value={detailsFormData?.page_number || ''} onChange={handleDetailsChange} className="w-20 mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)] text-right" />
                ) : (
                  <p className="text-sm text-[var(--text-main)]">{page.page_number}</p>
                )}
              </div>
            </div>
          </div>

          {page.story && (
            <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm border border-[var(--color-primary-light)] p-4 rounded-2xl shadow-sm relative group/story overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-[var(--color-primary)] opacity-5 rounded-full pointer-events-none"></div>

              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[var(--text-main)] flex items-center text-sm">
                  <SparklesIcon className="w-4 h-4 text-amber-500 mr-1.5" />
                  Generated Story
                </h3>
                {!isStoryEditing && onUpdateStory && !isReadOnly && (
                  <button
                    onClick={() => setIsStoryEditing(true)}
                    className="p-1.5 bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--color-primary)] rounded-lg shadow-sm border border-[var(--border-main)] transition-all hover:shadow-md"
                    title="Edit Story"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isStoryEditing ? (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={editedStory}
                      onChange={(e) => setEditedStory(e.target.value)}
                      className="w-full p-3 text-sm border border-[var(--color-primary-light)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none min-h-[300px] bg-[var(--bg-panel)] text-[var(--text-main)] transition-all shadow-inner"
                      placeholder="Enter story text..."
                    />
                  </div>
                  <div className="bg-[var(--bg-panel)] p-3 rounded-xl border border-[var(--border-main)] shadow-sm">
                    <h4 className="font-bold text-[var(--text-muted)] text-xs mb-2 flex items-center">
                      <InformationCircleIcon className="w-3.5 h-3.5 text-[var(--color-primary)] mr-1" />
                      Moral of the Story
                    </h4>
                    <input
                      type="text"
                      value={editedMoral}
                      onChange={(e) => setEditedMoral(e.target.value)}
                      className="w-full p-2 text-sm border border-[var(--border-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none bg-[var(--bg-input)] text-[var(--text-main)]"
                      placeholder="Enter moral..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsStoryEditing(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-input)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onUpdateStory?.(editedStory, editedMoral);
                        setIsStoryEditing(false);
                      }}
                      className="px-4 py-1.5 text-xs font-bold bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 shadow-md transition-all active:scale-95"
                    >
                      Save Story
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[var(--text-main)] whitespace-pre-wrap text-sm leading-relaxed font-medium">
                    {page.story}
                  </p>
                  {page.moral && (
                    <div className="bg-[var(--bg-panel)]/60 backdrop-blur-sm p-3 rounded-xl border border-[var(--border-main)] mt-2">
                      <h4 className="font-bold text-[var(--text-main)] text-xs mb-1 flex items-center">
                        <InformationCircleIcon className="w-3.5 h-3.5 text-[var(--color-primary)] mr-1" />
                        The Moral
                      </h4>
                      <p className="text-[var(--text-muted)] italic text-sm">{page.moral}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }


    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold">{getCurriculumNodeTitle()}</h2>
          <div className="flex items-center space-x-2">
            {isDetailsEditing ? (
              <>
                <button onClick={handleCancelDetails} className="p-1.5 bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg border border-[var(--border-main)] transition-colors" title="Cancel">
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <button onClick={handleSaveDetails} className="p-1.5 bg-[var(--color-primary)] text-white rounded-lg shadow-sm border border-[var(--color-primary)] transition-all hover:opacity-90 active:scale-95" title="Save Changes">
                  <CheckIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              !isReadOnly && (
                <button
                  onClick={() => setIsDetailsEditing(true)}
                  className="p-1.5 bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--color-primary)] rounded-lg border border-[var(--border-main)] transition-all hover:shadow-md"
                  title="Edit Attributes"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto">{details}</div>
      </div>
    );
  };

  const renderContent = () => {
    if (leftPanelView === 'my_content') {
      // Repository view - show same metadata content as database view
      return renderMetadataContent();
    }
    // If we are in curriculum view, show curriculum-related content.
    if (leftPanelView === 'curriculum') {
      if (selectedCurriculumNode) {
        return renderCurriculumNodeDetails();
      }
      // Provide a specific placeholder for when no curriculum node is selected.
      return (
        <div className="h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex-shrink-0">{getCurriculumNodeTitle()}</h2>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 italic text-center">Select an item from the curriculum tree to see details.</p>
          </div>
        </div>
      );
    }

    if (leftPanelView === 'contest') {
      return (
        <ContestRightPanel
          contest={contestProps.activeContest}
          onUpdate={contestProps.updateActiveContest}
          userContext={userContext}
        />
      );
    }

    // For all other views (upload, database), renderMetadataContent handles both
    // showing metadata for an active image and showing a placeholder if none is active.
    return renderMetadataContent();
  };

  return (
    <div className={`w-full bg-[var(--bg-panel)] bg-panel-texture text-[var(--text-main)] rounded-lg shadow-lg p-4 flex flex-col transition-all duration-300 ${className}`}>
      {showContent ? renderContent() : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-muted)] italic text-center">Details will be shown here.</p>
        </div>
      )}
    </div>
  );
};