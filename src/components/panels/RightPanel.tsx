// src/components/panels/RightPanel.tsx
import React from 'react';
import { CommonData, FileInfo, LanguageResult, PermissionCheck } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';

interface RightPanelProps {
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
}

export const RightPanel: React.FC<RightPanelProps> = ({
  currentCommonData,
  currentFileInfo,
  activeTab,
  isEditing,
  languageResults,
  commonDataMode,
  permissions,
  onUpdateCommonData,
  className = '',
}) => {
  const hasResults = Object.keys(languageResults).length > 0;
  const isLoading = Object.values(languageResults).some(result => result?.isLoading);

  const getEditCondition = () => {
    if (commonDataMode === 'shared') {
      return isEditing['English'] && activeTab === 'English' && permissions.canSwitchToEditMode.metadata;
    } else {
      return isEditing[activeTab] && permissions.canSwitchToEditMode.metadata;
    }
  };

  const canEdit = getEditCondition();

  const getEditRestrictionMessage = () => {
    if (commonDataMode === 'shared' && activeTab !== 'English') {
      return null;
    } else if (commonDataMode === 'per-tab' && !permissions.canSwitchToEditMode.metadata) {
      return null; // Removed "(Read-only)" text as requested
    }
    return null;
  };

  const editRestrictionMessage = getEditRestrictionMessage();

  return (
    <div className={`w-full bg-white rounded-lg shadow p-4 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Image Metadata</h2>
        {commonDataMode === 'shared' && (
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
            Shared
          </span>
        )}
      </div>
      
      {Object.keys(languageResults).length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          {Object.values(languageResults).every(result => result?.isLoading) ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#00AEEF] rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading Image Data...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Object Category */}
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Object Category</h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentCommonData.object_category || ''}
                    onChange={(e) => onUpdateCommonData('object_category', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]"
                  />
                ) : (
                  <div>
                    <p className="text-gray-900">{currentCommonData.object_category || '-'}</p>
                    {editRestrictionMessage && (
                      <span className="text-xs text-gray-500">{editRestrictionMessage}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Tags</h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentCommonData.tags ? currentCommonData.tags.join(', ') : ''}
                    onChange={(e) => onUpdateCommonData('tags', e.target.value.split(',').map(tag => tag.trim()))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]"
                    placeholder="Enter tags separated by commas"
                  />
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {currentCommonData.tags?.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-[#E6F7FC] text-[#00AEEF] text-xs rounded-full">
                          {tag}
                        </span>
                      )) || <span className="text-gray-500">-</span>}
                    </div>
                    {editRestrictionMessage && (
                      <span className="text-xs text-gray-500">{editRestrictionMessage}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Field of Study */}
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Field of Study</h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentCommonData.field_of_study || ''}
                    onChange={(e) => onUpdateCommonData('field_of_study', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]"
                  />
                ) : (
                  <div>
                    <p className="text-gray-900">{currentCommonData.field_of_study || '-'}</p>
                    {editRestrictionMessage && (
                      <span className="text-xs text-gray-500">{editRestrictionMessage}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Age Appropriate */}
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Age Appropriate</h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentCommonData.age_appropriate || ''}
                    onChange={(e) => onUpdateCommonData('age_appropriate', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]"
                  />
                ) : (
                  <div>
                    <p className="text-gray-900">{currentCommonData.age_appropriate || '-'}</p>
                    {editRestrictionMessage && (
                      <span className="text-xs text-gray-500">{editRestrictionMessage}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Image Status */}
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-1">Image Status</h3>
                {currentCommonData.image_status && currentCommonData.image_status.toLowerCase() !== 'approved' ? (
                  <StatusWorkflow
                    statuses={['Draft', 'Released', 'Verified', 'Approved']}
                    currentStatus={currentCommonData.image_status}
                    className="py-1"
                  />
                ) : (
                  <p className="font-semibold text-green-600">
                    {currentCommonData.image_status || '-'}
                  </p>
                )}
              </div>

              {/* File Information */}
              <div className="bg-gray-50 p-2 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">File Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-600">Filename:</p>
                  <p className="text-gray-900 break-words">{currentFileInfo.filename || 'N/A'}</p>
                  
                  <p className="text-gray-600">Mime type:</p>
                  <p className="text-gray-900">{currentFileInfo.mimeType || 'N/A'}</p>
                  
                  <p className="text-gray-600">Size:</p>
                  <p className="text-gray-900">{currentFileInfo.size || 'N/A'}</p>
                  
                  <p className="text-gray-600">Dimensions:</p>
                  <p className="text-gray-900">{currentFileInfo.dimensions || 'N/A'}</p>
                  
                  <p className="text-gray-600">Created by:</p>
                  <p className="text-gray-900 break-words">{currentFileInfo.created_by || 'N/A'}</p>
                  
                  <p className="text-gray-600">Created at:</p>
                  <p className="text-gray-900 break-words">{currentFileInfo.created_at ? new Date(currentFileInfo.created_at).toLocaleDateString() : 'N/A'}</p>
                  
                  <p className="text-gray-600">Last Updated by:</p>
                  <p className="text-gray-900 break-words">{currentFileInfo.updated_by || 'N/A'}</p>
                  
                  <p className="text-gray-600">Last Updated at:</p>
                  <p className="text-gray-900 break-words">{currentFileInfo.updated_at ? new Date(currentFileInfo.updated_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 italic text-center">
            Upload an image and identify it to see metadata
          </p>
        </div>
      )}
    </div>
  );
};