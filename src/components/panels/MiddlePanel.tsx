// components/panels/MiddlePanel.tsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { LanguageResult, SaveStatus, PermissionCheck } from '../../types';
import { StatusWorkflow } from '../common/StatusWorkflow';

interface MiddlePanelProps {
  activeTab: string;
  availableTabs: string[];
  languageResults: { [key: string]: LanguageResult };
  selectedLanguages: string[];
  saveStatus: { [key: string]: SaveStatus };
  saveMessages: { [key: string]: string | null };
  isEditing: { [key: string]: boolean };
  isSaving: { [key: string]: boolean };
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
  onToggleEdit: (language: string) => void;   // ✅ NEW
  className?: string;
}

export const MiddlePanel: React.FC<MiddlePanelProps> = ({
  activeTab,
  availableTabs,
  languageResults,
  selectedLanguages,
  saveStatus,
  saveMessages,
  isEditing,
  isSaving,
  permissions,
  onTabChange,
  onRemoveTab,
  onUpdateLanguageResult,
  onSave,
  onSkip,
  onToggleEdit,
  className = '',
}) => {
  const handleEditClick = () => {
    // Toggle edit mode for current tab
    // This would need to be passed from parent or managed differently
    // For now, this is a placeholder
    if (activeTab) {
      onToggleEdit(activeTab);   // ✅ pass current tab up
    }
  };
  
  const isCurrentTabSaving = isSaving[activeTab] || false;
  const currentResult = languageResults[activeTab];
  const hasError = !!currentResult?.error;
  const isLoading = currentResult?.isLoading || false;

  return (
    <div className={`w-full bg-white rounded-lg shadow p-4 flex flex-col ${className}`}>
      <h2 className="text-lg font-semibold mb-4">Object Translation</h2>

      {/* Selected Languages Badges */}
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedLanguages.map((language) => (
            <span
              key={language}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#E6F7FC] text-[#00AEEF] border border-[#00AEEF]"
            >
              {language}
              <button
                onClick={() => onRemoveTab(language)}
                className="ml-1 hover:text-red-500"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Language Tabs */}
      {availableTabs.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 overflow-x-auto mb-4">
            {availableTabs.map((language) => (
              <button
                key={language}
                onClick={() => onTabChange(language)}
                className={`px-3 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === language
                    ? 'border-[#00AEEF] text-[#00AEEF] bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{language}</span>
                  {/* Save Status Indicator */}
                  {saveStatus[language] === 'saved' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Saved"></div>
                  )}
                  {saveStatus[language] === 'unsaved' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Not saved"></div>
                  )}
                  {languageResults[language]?.isLoading && (
                    <div className="w-3 h-3 border-2 border-gray-300 border-t-[#00AEEF] rounded-full animate-spin"></div>
                  )}
                  {language !== 'X' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTab(language);
                      }}
                      className="hover:text-red-500"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab && languageResults[activeTab] && (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
                  
                  {/* Edit/View Button */}
                  <button
                    onClick={handleEditClick}
                    disabled={!permissions.canSwitchToEditMode.language || isLoading || hasError || isCurrentTabSaving}
                    title={
                      !permissions.canSwitchToEditMode.language
                        ? 'You do not have permission to switch edit mode'
                        : (isEditing[activeTab] ? 'Switch to View Mode' : 'Switch to Edit Mode')
                    }
                    className={`p-2 rounded transition ${
                      !permissions.canSwitchToEditMode.language
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-[#00AEEF] hover:bg-gray-100'
                    } disabled:opacity-50`}
                  >
                    {isEditing[activeTab] ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    )}
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={() => onSave("saveToDatabase")}
                    disabled={isCurrentTabSaving || !permissions.canSaveToDatabase.language || isLoading || hasError}
                    title={`Save ${activeTab} to Database`}
                    className={`p-2 rounded transition ${
                      !permissions.canSaveToDatabase.language
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    } disabled:opacity-50`}
                  >
                    {isCurrentTabSaving ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    )}
                  </button>

                  {/* Release Button */}
                  <button
                    onClick={() => onSave("releaseToDatabase")}
                    disabled={isCurrentTabSaving || !permissions.canReleaseToDatabase.language || isLoading || hasError}
                    title={`Release ${activeTab} to Database`}
                    className={`p-2 rounded transition ${
                      !permissions.canReleaseToDatabase.language
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    } disabled:opacity-50`}
                  >
                    {isCurrentTabSaving ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"></path>
                      </svg>
                    )}
                  </button>

                  {/* Verify Button */}
                  <button
                    onClick={() => onSave("verifyData")}
                    disabled={isCurrentTabSaving || !permissions.canVerifyData.language || isLoading || hasError}
                    title={`Verify ${activeTab} Data`}
                    className={`p-2 rounded transition ${
                      !permissions.canVerifyData.language
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    } disabled:opacity-50`}
                  >
                    {isCurrentTabSaving ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-green-400 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    )}
                  </button>

                  {/* Approve Button */}
                  <button
                    onClick={() => onSave("approveData")}
                    disabled={isCurrentTabSaving || !permissions.canApproveData.language || isLoading || hasError}
                    title={`Approve ${activeTab} Data`}
                    className={`p-2 rounded transition ${
                      !permissions.canApproveData.language
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    } disabled:opacity-50`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                    </svg>
                  </button>

                  {/* Reject Button */}
                  <button
                    onClick={() => onSave("rejectData")}
                    disabled={isCurrentTabSaving || !permissions.canRejectData.language || isLoading || hasError}
                    title={`Reject ${activeTab} Data`}
                    className={`p-2 rounded transition ${
                      !permissions.canRejectData.language
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                    } disabled:opacity-50`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.7m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path>
                    </svg>
                  </button>

                  {/* Skip Button */}
                  <button
                    onClick={onSkip}
                    disabled={!permissions.canSkiptData.language || isLoading || hasError || isCurrentTabSaving}
                    title={`Skip to next in ${activeTab}`}
                    className={`p-2 rounded transition ${
                      !permissions.canSkiptData.language
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                    } disabled:opacity-50`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>

                {/* Loading / Error / Content */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#00AEEF] rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading {activeTab} translation...</span>
                    </div>
                  </div>
                ) : hasError ? (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                    <p><strong>Error:</strong> {currentResult.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Language-specific fields */}
                    {[
                      { label: 'Object Name', key: 'object_name' as keyof LanguageResult },
                      { label: 'Description', key: 'object_description' as keyof LanguageResult, textarea: true },
                      { label: 'Hint', key: 'object_hint' as keyof LanguageResult, textarea: true },
                      { label: 'Short Hint', key: 'object_short_hint' as keyof LanguageResult, textarea: true },
                      { label: 'Translation Status', key: 'translation_status' as keyof LanguageResult }
                    ].map(({ label, key, textarea }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {label}:
                          {currentResult.flag_translation ? (
                            <span className="text-xs text-green-600 ml-2">⭐️</span>
                          ) : (
                            <span className="text-xs text-blue-600 ml-2">✨</span>
                          )}
                        </label>
                        {isEditing[activeTab] && key !== 'translation_status' ? (
                          textarea ? (
                            <textarea
                              rows={3}
                              value={currentResult[key] as string || ''}
                              onChange={(e) => onUpdateLanguageResult(activeTab, key, e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentResult[key] as string || ''}
                              onChange={(e) => onUpdateLanguageResult(activeTab, key, e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#00AEEF] focus:border-[#00AEEF]"
                            />
                          )
                        ) : key === 'translation_status' ? (
                            currentResult.translation_status && currentResult.translation_status!.toLowerCase() !== 'approved' ? (
                              <StatusWorkflow
                                statuses={['Draft', 'Released', 'Verified', 'Approved']}
                                currentStatus={currentResult.translation_status}
                              />
                            ) : (
                              <p className="text-gray-900 bg-gray-50 p-2 rounded-md font-semibold text-green-600">
                                {currentResult.translation_status || '-'}
                              </p>
                            )
                          ) : (
                            <p className="text-gray-900 bg-gray-50 p-2 rounded-md">
                              {(currentResult[key] as string || '-')}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                )}

                {saveMessages[activeTab] && (
                  <p className={`text-sm ${saveMessages[activeTab]?.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMessages[activeTab]}
                  </p>
                )}
              </div>
            )}

            {!activeTab && (
              <p className="text-gray-500 italic text-center py-8">
                Select languages and click 'Identify Image' to see translations.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};