import React, { useState, useEffect } from 'react';
import { CommonData, FileInfo, LanguageResult, PermissionCheck, DatabaseImage, CurriculumImage, Book, CartItem, Chapter, Page, OrgObject, UserContext } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';
import { ContestRightPanel } from './contest/ContestRightPanel';
import { useContest } from '../../hooks/useContest';
import { useMyContent } from '../../hooks/useMyContent';
import { PencilIcon, CheckIcon, CheckCircleIcon, XMarkIcon, IdentificationIcon, AcademicCapIcon, BookOpenIcon, SparklesIcon, InformationCircleIcon, ShoppingCartIcon, ShoppingBagIcon, PhotoIcon } from '@heroicons/react/24/solid';
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
  curriculumTab?: 'my_books' | 'purchase_books';
  selectedCurriculumNode: Book | Chapter | Page | null;
  currentCommonData: CommonData;
  currentFileInfo: FileInfo;
  activeTab: string;
  isEditing: { [key: string]: boolean };
  languageResults: { [key: string]: LanguageResult };
  commonDataMode: 'shared' | 'per-tab';
  permissions: {
    canSwitchToEditMode: PermissionCheck;
    canSaveToDatabase: PermissionCheck;
    canReleaseToDatabase: PermissionCheck;
    canVerifyData: PermissionCheck;
    canApproveData: PermissionCheck;
    canRejectData: PermissionCheck;
    canSkiptData: PermissionCheck;
    canUploadPicture: PermissionCheck;
    canIdentifyImage: PermissionCheck;
  };
  onUpdateCommonData: (key: keyof CommonData, value: any) => void;
  className?: string;
  showContent: boolean;
  isDirty?: boolean;
  onSaveBook?: () => void;
  isStoryLoading?: boolean;
  loadingStoryLanguages?: string[];
  onUpdateStory?: (newStory: string, newMoral?: string) => void;
  onGenerateStory?: (pageId: string, userComments: string) => void; // New prop
  selectedStoryLanguage?: string;
  onSelectStoryLanguage?: (language: string) => void;
  isPageDirty?: boolean; // New prop
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
  activeMarketplaceBook?: Book | null;
  onPurchaseBook?: (bookId: string) => void;
  onAddToCart?: (book: Book, method: 'permanent' | 'subscription', languages: string[]) => void;
  cart?: CartItem[];
  isPurchasing?: boolean;
  languageOptions?: string[];
}

export const RightPanel: React.FC<RightPanelProps> = ({
  leftPanelView,
  curriculumTab,
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
  loadingStoryLanguages,
  onUpdateStory,
  onGenerateStory,
  selectedStoryLanguage,
  onSelectStoryLanguage,
  isPageDirty,
  contestProps,
  userContext,
  myContentProps,
  onUpdateBook,
  onUpdateChapter,
  onUpdatePage,
  activeBook,
  activeMarketplaceBook,
  onPurchaseBook,
  onAddToCart,
  cart,
  isPurchasing,
  languageOptions = [],
}) => {
  // Global check for purchased status
  const isPurchasedBook = activeBook?.ownership_type === 'purchased';
  const isPublishedBook = activeBook?.book_status === 'Published';
  const isReadOnly = isPurchasedBook || isPublishedBook;

  const [isStoryEditing, setIsStoryEditing] = useState(false);
  const [editedStory, setEditedStory] = useState('');
  const [editedMoral, setEditedMoral] = useState('');
  const [userComments, setUserComments] = useState<Record<string, string>>({});

  const selectedLanguage = selectedStoryLanguage || activeBook?.language || '';

  // Curriculum node editing state
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [detailsFormData, setDetailsFormData] = useState<any>(null);

  // Purchase selection state
  const [selectedPurchaseMethod, setSelectedPurchaseMethod] = useState<'permanent' | 'subscription'>('permanent');
  const [selectedAdditionalLanguages, setSelectedAdditionalLanguages] = useState<string[]>([]);

  // Initialize purchase selections
  useEffect(() => {
    if (activeMarketplaceBook) {
      const defaultMethod: 'permanent' | 'subscription' =
        (activeMarketplaceBook.base_pricing?.subscription_price && activeMarketplaceBook.base_pricing.subscription_price > 0)
          ? 'subscription'
          : 'permanent';
      setSelectedPurchaseMethod(defaultMethod);
      setSelectedAdditionalLanguages([]);
    }
  }, [activeMarketplaceBook]);

  const toggleAdditionalLanguage = (lang: string) => {
    setSelectedAdditionalLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // Update local edit state when selected node changes
  useEffect(() => {
    if (selectedCurriculumNode) {
      if ('story' in selectedCurriculumNode) {
        setEditedStory(selectedCurriculumNode.story || '');
        setEditedMoral(selectedCurriculumNode.moral || '');
      }
      // Shallow clone for editing
      setDetailsFormData({ ...selectedCurriculumNode });

      // Initialize selected language to book's base language if not set
      if (activeBook && !selectedStoryLanguage) {
        onSelectStoryLanguage?.(activeBook.language);
      }
    } else {
      setDetailsFormData(null);
    }
    setIsStoryEditing(false);
    setIsDetailsEditing(false);
  }, [selectedCurriculumNode, activeBook]);

  // Update edited story/moral when selected language changes
  useEffect(() => {
    if (selectedCurriculumNode && 'stories' in selectedCurriculumNode && selectedLanguage) {
      const page = selectedCurriculumNode as Page;
      const storyEntry = page.stories?.find(s => s.language === selectedLanguage);

      if (storyEntry) {
        setEditedStory(storyEntry.story);
        setEditedMoral(storyEntry.moral || '');
      } else if (selectedLanguage === activeBook?.language) {
        // Fallback to top-level story if it's the base language and no entry in stories list
        setEditedStory(page.story || '');
        setEditedMoral(page.moral || '');
      } else {
        setEditedStory('');
        setEditedMoral('');
      }
    }
  }, [selectedLanguage, selectedCurriculumNode, activeBook]);

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

    // Unified loading handled inside content areas to keep panel title and buttons interactive

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
                  <p className="text-sm font-bold text-[var(--text-main)]">{page.title}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <h3 className="text-xs font-semibold text-[var(--text-muted)]">Number</h3>
                {isDetailsEditing ? (
                  <input type="number" name="page_number" value={detailsFormData?.page_number || ''} onChange={handleDetailsChange} className="w-20 mt-1 p-2 text-sm border border-[var(--border-main)] rounded bg-[var(--bg-panel)] text-[var(--text-main)] text-right" />
                ) : (
                  <p className="text-sm font-bold text-[var(--text-main)] italic">Page {page.page_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Story Section with Multilingual Support */}
          {(page.story || (page.stories && page.stories.length > 0) || !isReadOnly) && (
            <div className="bg-[var(--bg-input)]/50 backdrop-blur-sm border border-[var(--color-primary-light)] p-4 rounded-2xl shadow-sm relative group/story overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-[var(--color-primary)] opacity-5 rounded-full pointer-events-none"></div>

              <div className="flex flex-col mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-[var(--text-main)] flex items-center text-sm">
                    <SparklesIcon className="w-4 h-4 text-amber-500 mr-1.5" />
                    Story & Moral
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

                {/* Language Selector Tabs */}
                {activeBook && (
                  <div className="flex flex-wrap gap-1 border-b border-[var(--border-main)] pb-2">
                    {[activeBook.language, ...(activeBook.additional_languages || [])].map(lang => (
                      <button
                        key={lang}
                        onClick={() => {
                          onSelectStoryLanguage?.(lang);
                          setIsStoryEditing(false);
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-t-lg transition-all ${selectedLanguage === lang
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--bg-panel)] text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-main)]'
                          }`}
                      >
                        {lang}
                        {lang === activeBook.language && <span className="ml-1 opacity-70">(Base)</span>}
                        {page.stories?.some(s => s.language === lang) && (
                          <span className="ml-1 w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isStoryEditing ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Editing: {selectedLanguage}</span>
                    </div>
                    <textarea
                      value={editedStory}
                      onChange={(e) => setEditedStory(e.target.value)}
                      className="w-full p-3 text-sm border border-[var(--color-primary-light)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none min-h-[300px] bg-[var(--bg-panel)] text-[var(--text-main)] transition-all shadow-inner"
                      placeholder={`Enter story text in ${selectedLanguage}...`}
                    />
                  </div>
                  <div className="bg-[var(--bg-panel)] p-3 rounded-xl border border-[var(--border-main)] shadow-sm">
                    <h4 className="font-bold text-[var(--text-muted)] text-xs mb-2 flex items-center">
                      <InformationCircleIcon className="w-3.5 h-3.5 text-[var(--color-primary)] mr-1" />
                      Moral of the Story ({selectedLanguage})
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
                      onClick={() => {
                        // Reset to original for this language
                        const storyEntry = page.stories?.find(s => s.language === selectedLanguage);
                        if (storyEntry) {
                          setEditedStory(storyEntry.story);
                          setEditedMoral(storyEntry.moral || '');
                        } else if (selectedLanguage === activeBook?.language) {
                          setEditedStory(page.story || '');
                          setEditedMoral(page.moral || '');
                        } else {
                          setEditedStory('');
                          setEditedMoral('');
                        }
                        setIsStoryEditing(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-input)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Pass the language to onUpdateStory if it supports it, 
                        // or handle it via a new prop/logic.
                        // Assuming onUpdateStory is updated to handle language or we update it here.
                        onUpdateStory?.(editedStory, editedMoral); // We need to ensure logic elsewhere handles selectedLanguage
                        setIsStoryEditing(false);
                      }}
                      className="px-4 py-1.5 text-xs font-bold bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 shadow-md transition-all active:scale-95"
                    >
                      Save {selectedLanguage} Story
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {loadingStoryLanguages?.includes(selectedLanguage) ? (
                    <div className="py-12 bg-[var(--bg-panel)]/30 rounded-xl border border-dashed border-[var(--border-main)] backdrop-blur-sm">
                      <StoryLoadingSpinner />
                    </div>
                  ) : editedStory ? (
                    <>
                      <p className="text-[var(--text-main)] whitespace-pre-wrap text-sm leading-relaxed font-medium">
                        {editedStory}
                      </p>
                      {editedMoral && (
                        <div className="bg-[var(--bg-panel)]/60 backdrop-blur-sm p-3 rounded-xl border border-[var(--border-main)] mt-2">
                          <h4 className="font-bold text-[var(--text-main)] text-xs mb-1 flex items-center">
                            <InformationCircleIcon className="w-3.5 h-3.5 text-[var(--color-primary)] mr-1" />
                            The Moral
                          </h4>
                          <p className="text-[var(--text-muted)] italic text-sm">{editedMoral}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center bg-[var(--bg-panel)]/30 rounded-xl border border-dashed border-[var(--border-main)]">
                      <p className="text-[var(--text-muted)] text-sm italic">
                        No story generated for {selectedLanguage} yet.
                      </p>
                    </div>
                  )}

                  {/* Regeneration Instructions - ALWAYS visible at the bottom of the story tab */}
                  {!isReadOnly && (
                    <div className="mt-6 pt-6 border-t border-[var(--border-main)] flex-shrink-0">
                      <div className="bg-gradient-to-br from-[var(--color-primary-light)]/30 via-[var(--bg-panel)] to-[var(--color-secondary-light)]/20 p-4 rounded-2xl border border-[var(--border-main)] shadow-sm relative overflow-hidden group/prompt">
                        <div className="relative">
                          <div className="flex items-center justify-between mb-3">
                            <label htmlFor="userComments" className="flex items-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                              <SparklesIcon className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                              Regeneration Instructions ({selectedLanguage})
                            </label>
                            {userComments[selectedLanguage] && (
                              <button
                                onClick={() => setUserComments(prev => ({ ...prev, [selectedLanguage]: '' }))}
                                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <div className="relative bg-[var(--bg-panel)] rounded-xl border border-[var(--border-main)] shadow-inner focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10 focus-within:border-[var(--color-primary)] transition-all overflow-hidden">
                            <textarea
                              id="userComments"
                              rows={2}
                              value={userComments[selectedLanguage] || ''}
                              onChange={(e) => setUserComments(prev => ({ ...prev, [selectedLanguage]: e.target.value }))}
                              className="w-full p-4 pr-32 text-sm bg-transparent outline-none resize-none placeholder-[var(--text-muted)] opacity-60 leading-relaxed min-h-[80px]"
                              placeholder={`e.g., Make the ${selectedLanguage} story more adventurous...`}
                              disabled={isStoryLoading}
                            />

                            <div className="absolute top-3 right-3 flex items-center space-x-2">
                              <button
                                onClick={() => onGenerateStory?.(page.page_id!, userComments[selectedLanguage] || '')}
                                disabled={isStoryLoading || !!isPageDirty || loadingStoryLanguages?.includes(selectedLanguage)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-500/10 
                                ${isPageDirty || loadingStoryLanguages?.includes(selectedLanguage)
                                    ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed bg-transparent border border-[var(--border-main)]'
                                    : 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-lg'}`}
                                title={isPageDirty ? "Save changes before regenerating" : "Regenerate story"}
                              >
                                {loadingStoryLanguages?.includes(selectedLanguage) ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                                ) : (
                                  <ArrowPathIcon className="w-4 h-4" />
                                )}
                                <span>{loadingStoryLanguages?.includes(selectedLanguage) ? 'Regenerating...' : 'Regenerate'}</span>
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

  const renderMarketplaceBookDetails = () => {
    if (!activeMarketplaceBook) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60">
          <BookOpenIcon className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">Select a book to view details</p>
        </div>
      );
    }

    const isInCart = cart?.some(item => item.book._id === activeMarketplaceBook._id);
    const isOwned = activeMarketplaceBook.is_purchased || activeMarketplaceBook.ownership_type === 'purchased';

    return (
      <div className="h-full flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
        {/* Cover Image */}
        <div className="w-full h-64 bg-gradient-to-br from-[var(--bg-panel)] to-[var(--bg-hover)] rounded-xl overflow-hidden relative shadow-lg flex-shrink-0">
          {activeMarketplaceBook.front_cover_image ? (
            <img
              src={`data:image/jpeg;base64,${activeMarketplaceBook.front_cover_image}`}
              alt={activeMarketplaceBook.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-6 text-center">
              <BookOpenIcon className="w-16 h-16 mb-2 opacity-50" />
              <span className="text-sm font-bold uppercase tracking-wider opacity-60">No Cover</span>
            </div>
          )}

          <div className="absolute top-4 right-4 bg-[var(--color-primary)] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {activeMarketplaceBook.base_pricing?.is_free ? 'Free' : `$${activeMarketplaceBook.base_pricing?.one_time_purchase_price || 0}`}
          </div>
        </div>

        {/* Title & Author */}
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] leading-tight mb-1">{activeMarketplaceBook.title}</h2>
          <p className="text-sm text-[var(--text-muted)]">by {activeMarketplaceBook.author || 'Unknown Author'}</p>
        </div>

        {/* Purchase Warning */}
        {isOwned && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-3 mb-4 rounded-r shadow-sm flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Already Purchased</p>
              <p className="text-xs mt-0.5 opacity-90">This book is already in your library.</p>
            </div>
          </div>
        )}

        {/* Purchase Configuration */}
        {!isOwned && !activeMarketplaceBook.base_pricing?.is_free && (
          <div className="space-y-4 py-2">
            {/* Method Selection */}
            {activeMarketplaceBook.base_pricing?.subscription_price && activeMarketplaceBook.base_pricing?.one_time_purchase_price && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Purchase Model</h3>
                <div className="flex bg-[var(--bg-panel)] rounded-xl p-1 border border-[var(--border-main)] shadow-sm">
                  <button
                    onClick={() => setSelectedPurchaseMethod('subscription')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedPurchaseMethod === 'subscription'
                      ? 'bg-amber-100 text-amber-700 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                  >
                    Subscription ({activeMarketplaceBook.base_pricing.subscription_period_days || 30} days) - ${activeMarketplaceBook.base_pricing.subscription_price.toFixed(2)}
                  </button>
                  <button
                    onClick={() => setSelectedPurchaseMethod('permanent')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${selectedPurchaseMethod === 'permanent'
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                  >
                    Permanent (${activeMarketplaceBook.base_pricing.one_time_purchase_price.toFixed(2)})
                  </button>
                </div>
              </div>
            )}

            {/* Additional Languages */}
            {activeMarketplaceBook.base_pricing?.additional_language_prices && Object.keys(activeMarketplaceBook.base_pricing.additional_language_prices).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Additional Translations</h3>
                  <span className="text-[10px] text-[var(--text-muted)]">(Select to bundle)</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(activeMarketplaceBook.base_pricing.additional_language_prices).map(([lang, langPrice]) => (
                    <label key={lang} className="flex items-center justify-between group cursor-pointer p-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-main)] hover:border-[var(--color-primary)]/30 transition-all">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAdditionalLanguages.includes(lang)}
                          onChange={() => toggleAdditionalLanguage(lang)}
                          className="w-4 h-4 rounded border-[var(--border-main)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors font-medium">{lang}</span>
                      </div>
                      <span className="text-sm font-bold text-[var(--color-primary)]/80">${langPrice.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="py-2">
          <button
            onClick={() => onAddToCart?.(activeMarketplaceBook, selectedPurchaseMethod, selectedAdditionalLanguages)}
            disabled={isInCart || isOwned}
            className={`w-full px-4 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2
               ${isInCart
                ? 'bg-[var(--bg-input)] text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20'}`}
          >
            {isInCart ? (
              <>
                <CheckIcon className="w-5 h-5" />
                <span>In Cart</span>
              </>
            ) : (
              <>
                <ShoppingCartIcon className="w-5 h-5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>

        {/* Details */}
        <div className="bg-[var(--bg-input)]/50 rounded-xl p-4 border border-[var(--border-main)] space-y-3">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Description</h3>
            <p className="text-sm text-[var(--text-main)] leading-relaxed opacity-90">
              {activeMarketplaceBook.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border-main)]">
            <div>
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Subject</h3>
              <p className="text-sm font-medium">{activeMarketplaceBook.subject || 'General'}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Grade Level</h3>
              <p className="text-sm font-medium">{activeMarketplaceBook.grade_level || 'All Levels'}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Language</h3>
              <p className="text-sm font-medium">{activeMarketplaceBook.language || 'English'}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Pages</h3>
              <p className="text-sm font-medium">{activeMarketplaceBook.page_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Additional Languages */}
        {activeMarketplaceBook.additional_languages && activeMarketplaceBook.additional_languages.length > 0 && (
          <div className="bg-[var(--bg-input)]/50 rounded-xl p-4 border border-[var(--border-main)]">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Available Languages</h3>
            <div className="flex flex-wrap gap-2">
              {activeMarketplaceBook.additional_languages.map(lang => (
                <span key={lang} className="px-2 py-1 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded text-xs font-medium">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (leftPanelView === 'my_content') {
      // Repository view - show same metadata content as database view
      return renderMetadataContent();
    }
    // If we are in curriculum view, show curriculum-related content or marketplace content.
    if (leftPanelView === 'curriculum') {
      if (curriculumTab === 'purchase_books') {
        return renderMarketplaceBookDetails();
      }

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
      {showContent || (curriculumTab === 'purchase_books') ? renderContent() : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--text-muted)] italic text-center">Details will be shown here.</p>
        </div>
      )}
    </div>
  );
};