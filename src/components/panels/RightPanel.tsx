import React, { useState, useEffect } from 'react';
import { CommonData, FileInfo, LanguageResult, PermissionCheck, Book, Chapter, Page } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';
import { PencilIcon, CheckIcon, XMarkIcon, IdentificationIcon, AcademicCapIcon, BookOpenIcon, SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

// Define the new spinner component locally
const StoryLoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 animate-fade-in">
      <div className="running-child-container mb-4">
        <svg width="80" height="100" viewBox="0 0 80 100" className="running-child-svg">
          <circle cx="40" cy="15" r="10" fill="#F15A29" /> {/* Head */}
          <rect x="35" y="25" width="10" height="30" fill="#00AEEF" /> {/* Body */}
          {/* Arms */}
          <line x1="40" y1="30" x2="60" y2="40" stroke="#00AEEF" strokeWidth="6" className="running-child-arm-1" />
          <line x1="40" y1="30" x2="20" y2="40" stroke="#00AEEF" strokeWidth="6" className="running-child-arm-2" />
          {/* Legs */}
          <line x1="40" y1="55" x2="60" y2="75" stroke="#F15A29" strokeWidth="8" className="running-child-leg-1" />
          <line x1="40" y1="55" x2="20" y2="75" stroke="#F15A29" strokeWidth="8" className="running-child-leg-2" />
        </svg>
      </div>
      <p className="font-semibold text-lg text-[#00AEEF]">Writing a magical story...</p>
      <p className="text-sm">Our little storyteller is running to fetch the perfect words!</p>
    </div>
  );
};

interface RightPanelProps {
  leftPanelView: 'upload' | 'database' | 'curriculum';
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
}) => {
  const [isStoryEditing, setIsStoryEditing] = useState(false);
  const [editedStory, setEditedStory] = useState('');
  const [editedMoral, setEditedMoral] = useState('');

  // Update local edit state when selected node changes
  useEffect(() => {
    if (selectedCurriculumNode && 'story' in selectedCurriculumNode) {
      setEditedStory(selectedCurriculumNode.story || '');
      setEditedMoral(selectedCurriculumNode.moral || '');
    }
    setIsStoryEditing(false);
  }, [selectedCurriculumNode]);

  const hasResults = Object.keys(languageResults).length > 0;

  const getEditCondition = () => {
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
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Object Category</h3>
                {canEdit ? <input type="text" value={currentCommonData.object_category || ''} onChange={(e) => onUpdateCommonData('object_category', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]" /> : <div><p className="text-gray-900">{currentCommonData.object_category || '-'}</p>{editRestrictionMessage && <span className="text-xs text-gray-500">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Tags</h3>
                {canEdit ? <input type="text" value={currentCommonData.tags ? currentCommonData.tags.join(', ') : ''} onChange={(e) => onUpdateCommonData('tags', e.target.value.split(',').map(tag => tag.trim()))} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]" placeholder="Enter tags separated by commas" /> : <div><div className="flex flex-wrap gap-1 mb-2">{currentCommonData.tags?.map((tag, index) => <span key={index} className="px-2 py-1 bg-[#E6F7FC] text-[#00AEEF] text-xs rounded-full">{tag}</span>) || <span className="text-gray-500">-</span>}</div>{editRestrictionMessage && <span className="text-xs text-gray-500">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Field of Study</h3>
                {canEdit ? <input type="text" value={currentCommonData.field_of_study || ''} onChange={(e) => onUpdateCommonData('field_of_study', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]" /> : <div><p className="text-gray-900">{currentCommonData.field_of_study || '-'}</p>{editRestrictionMessage && <span className="text-xs text-gray-500">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Age Appropriate</h3>
                {canEdit ? <input type="text" value={currentCommonData.age_appropriate || ''} onChange={(e) => onUpdateCommonData('age_appropriate', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]" /> : <div><p className="text-gray-900">{currentCommonData.age_appropriate || '-'}</p>{editRestrictionMessage && <span className="text-xs text-gray-500">{editRestrictionMessage}</span>}</div>}
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Object Status</h3>
                {currentCommonData.image_status ? <StatusWorkflow statuses={['Draft', 'Released', 'Verified', 'Approved']} currentStatus={currentCommonData.image_status} className="py-1" /> : <p className="text-gray-900">-</p>}
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">File Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-600">Filename:</p><p className="text-gray-900 break-words">{currentFileInfo.filename || 'N/A'}</p>
                  <p className="text-gray-600">Mime type:</p><p className="text-gray-900">{currentFileInfo.mimeType || 'N/A'}</p>
                  <p className="text-gray-600">Size:</p><p className="text-gray-900">{currentFileInfo.size || 'N/A'}</p>
                  <p className="text-gray-600">Dimensions:</p><p className="text-gray-900">{currentFileInfo.dimensions || 'N/A'}</p>
                  <p className="text-gray-600">Created by:</p><p className="text-gray-900 break-words">{currentFileInfo.created_by || 'N/A'}</p>
                  <p className="text-gray-600">Created at:</p><p className="text-gray-900 break-words">{currentFileInfo.created_at ? new Date(currentFileInfo.created_at).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-gray-600">Last Updated by:</p><p className="text-gray-900 break-words">{currentFileInfo.updated_by || 'N/A'}</p>
                  <p className="text-gray-600">Last Updated at:</p><p className="text-gray-900 break-words">{currentFileInfo.updated_at ? new Date(currentFileInfo.updated_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 italic text-center">Upload or select an object to see its metadata.</p>
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

    if ('chapters' in selectedCurriculumNode) { // It's a Book
      const book = selectedCurriculumNode as Book;
      details = (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
              <IdentificationIcon className="w-3 h-3 mr-1" /> Identity
            </h4>
            <div className="space-y-2">
              <div><h3 className="text-xs font-semibold text-gray-500">Book Title</h3><p className="text-sm text-gray-900 font-medium">{book.title}</p></div>
              <div><h3 className="text-xs font-semibold text-gray-500">Author</h3><p className="text-sm text-gray-900">{book.author}</p></div>
            </div>
          </div>
          <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
              <AcademicCapIcon className="w-3 h-3 mr-1" /> Education Info
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div><h3 className="text-xs font-semibold text-gray-500">Subject</h3><p className="text-sm text-gray-900">{book.subject}</p></div>
              <div><h3 className="text-xs font-semibold text-gray-500">Board</h3><p className="text-sm text-gray-900">{book.education_board}</p></div>
              <div><h3 className="text-xs font-semibold text-gray-500">Grade</h3><p className="text-sm text-gray-900">{book.grade_level}</p></div>
              <div><h3 className="text-xs font-semibold text-gray-500">Language</h3><p className="text-sm text-gray-900">{book.language}</p></div>
            </div>
          </div>
        </div>
      );
    } else if ('pages' in selectedCurriculumNode) { // It's a Chapter
      const chapter = selectedCurriculumNode as Chapter;
      details = (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
              <IdentificationIcon className="w-3 h-3 mr-1" /> Chapter Info
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div><h3 className="text-xs font-semibold text-gray-500">Chapter Title</h3><p className="text-sm text-gray-900 font-medium">{chapter.chapter_name}</p></div>
                <div className="text-right"><h3 className="text-xs font-semibold text-gray-500">Number</h3><p className="text-sm text-gray-900">{chapter.chapter_number}</p></div>
              </div>
              <div className="pt-2 border-t border-gray-50">
                <h3 className="text-xs font-semibold text-gray-500 mb-1">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{chapter.description || "No description provided."}</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (isPage) { // It's a Page
      const page = selectedCurriculumNode as Page;
      details = (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
              <IdentificationIcon className="w-3 h-3 mr-1" /> Page Info
            </h4>
            <div className="flex justify-between items-start">
              <div><h3 className="text-xs font-semibold text-gray-500">Page Title</h3><p className="text-sm text-gray-900 font-medium">{page.title}</p></div>
              <div className="text-right"><h3 className="text-xs font-semibold text-gray-500">Number</h3><p className="text-sm text-gray-900">{page.page_number}</p></div>
            </div>
          </div>

          {page.story && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl shadow-sm relative group/story overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-blue-400 opacity-5 rounded-full pointer-events-none"></div>

              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 flex items-center text-sm">
                  <SparklesIcon className="w-4 h-4 text-amber-500 mr-1.5" />
                  Generated Story
                </h3>
                {!isStoryEditing && onUpdateStory && (
                  <button
                    onClick={() => setIsStoryEditing(true)}
                    className="p-1.5 bg-white text-gray-400 hover:text-[#00AEEF] rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md"
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
                      className="w-full p-3 text-sm border border-blue-200 rounded-xl focus:ring-2 focus:ring-[#00AEEF]/20 focus:border-[#00AEEF] outline-none min-h-[300px] bg-white transition-all shadow-inner"
                      placeholder="Enter story text..."
                    />
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-bold text-gray-700 text-xs mb-2 flex items-center">
                      <InformationCircleIcon className="w-3.5 h-3.5 text-blue-500 mr-1" />
                      Moral of the Story
                    </h4>
                    <input
                      type="text"
                      value={editedMoral}
                      onChange={(e) => setEditedMoral(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-100 rounded-lg focus:ring-2 focus:ring-[#00AEEF]/20 focus:border-[#00AEEF] outline-none bg-gray-50"
                      placeholder="Enter moral..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsStoryEditing(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onUpdateStory?.(editedStory, editedMoral);
                        setIsStoryEditing(false);
                      }}
                      className="px-4 py-1.5 text-xs font-bold bg-[#00AEEF] text-white rounded-lg hover:bg-[#0096CC] shadow-md shadow-blue-500/20 transition-all active:scale-95"
                    >
                      Save Story
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                    {page.story}
                  </p>
                  {page.moral && (
                    <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-blue-100 mt-2">
                      <h4 className="font-bold text-gray-800 text-xs mb-1 flex items-center">
                        <InformationCircleIcon className="w-3.5 h-3.5 text-blue-500 mr-1" />
                        The Moral
                      </h4>
                      <p className="text-gray-700 italic text-sm">{page.moral}</p>
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
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">{getCurriculumNodeTitle()}</h2>
        <div className="space-y-2 flex-1 overflow-y-auto">{details}</div>
      </div>
    );
  };

  const renderContent = () => {
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

    // For all other views (upload, database), renderMetadataContent handles both
    // showing metadata for an active image and showing a placeholder if none is active.
    return renderMetadataContent();
  };

  return (
    <div className={`w-full bg-white rounded-lg shadow p-4 flex flex-col ${className}`}>
      {showContent ? renderContent() : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 italic text-center">Details will be shown here.</p>
        </div>
      )}
    </div>
  );
};