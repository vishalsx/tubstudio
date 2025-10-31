// src/components/panels/RightPanel.tsx
import React from 'react';
import { CommonData, FileInfo, LanguageResult, PermissionCheck, Book, Chapter, Page } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';

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
}) => {
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
                {currentCommonData.image_status && currentCommonData.image_status.toLowerCase() !== 'approved' ? <StatusWorkflow statuses={['Draft', 'Released', 'Verified', 'Approved']} currentStatus={currentCommonData.image_status} className="py-1" /> : <p className="font-semibold text-green-600">{currentCommonData.image_status || '-'}</p>}
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
        <>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Book Title</h3><p className="text-gray-900">{book.title}</p></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Author</h3><p className="text-gray-900">{book.author}</p></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Subject</h3><p className="text-gray-900">{book.subject}</p></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Education Board</h3><p className="text-gray-900">{book.education_board}</p></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Grade Level</h3><p className="text-gray-900">{book.grade_level}</p></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Language</h3><p className="text-gray-900">{book.language}</p></div>
        </>
      );
    } else if ('pages' in selectedCurriculumNode) { // It's a Chapter
      const chapter = selectedCurriculumNode as Chapter;
      details = (
        <>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Chapter Title</h3><p className="text-gray-900">{chapter.chapter_name}</p></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Chapter Number</h3><p className="text-gray-900">{chapter.chapter_number}</p></div>
          <div className="bg-gray-50 p-2 rounded-lg"><h3 className="font-medium text-gray-700">Description</h3><p className="text-gray-900">{chapter.description}</p></div>
        </>
      );
    } else if (isPage) { // It's a Page
      const page = selectedCurriculumNode as Page;
      details = (
        <>
          <div className="bg-gray-50 p-2 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-1">Page Title</h3>
            <p className="text-gray-900">{page.title}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-1">Page Number</h3>
            <p className="text-gray-900">{page.page_number}</p>
          </div>
          {page.story && (
            <div className="bg-blue-50 p-3 rounded-lg mt-4 space-y-3">
              <h3 className="font-medium text-gray-700">Generated Story</h3>
              <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{page.story}</p>
              {page.moral && (
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm">Moral of the Story</h4>
                  <p className="text-gray-800 italic text-sm mt-1">{page.moral}</p>
                </div>
              )}
            </div>
          )}
        </>
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