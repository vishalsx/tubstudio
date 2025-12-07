// hooks/useLanguageResults.ts
import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { translationService } from '../services/translation.service';
import { LanguageResult, CommonData, FileInfo, SaveStatus } from '../types';
import { DEFAULT_COMMON_DATA, DEFAULT_FILE_INFO, UI_MESSAGES } from '../utils/constants';
// import { RETURN_PERMISSION_ACTION } from '../utils/permissions/hasPermissions';
import { UserContext } from '../types';
import { returnPermissionForUiActionForUser } from '../utils/permissions/hasPermissions';
import { useAuth } from "./useAuth";



export const useLanguageResults = () => {

  const { userContext } = useAuth(); // ✅ access user context here
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);

  // Language results and related states
  const [languageResults, setLanguageResults] = useState<{ [key: string]: LanguageResult }>({});
  const [originalResults, setOriginalResults] = useState<{ [key: string]: LanguageResult }>({});

  // Common data states
  const [currentCommonData, setCurrentCommonData] = useState<CommonData>(DEFAULT_COMMON_DATA);
  const [originalCommonData, setOriginalCommonData] = useState<CommonData>(DEFAULT_COMMON_DATA);
  const [perLanguageCommonData, setPerLanguageCommonData] = useState<{ [key: string]: CommonData }>({});

  // File info states
  const [currentFileInfo, setCurrentFileInfo] = useState<FileInfo>(DEFAULT_FILE_INFO);
  const [perLanguageFileInfo, setPerLanguageFileInfo] = useState<{ [key: string]: FileInfo }>({});

  // UI states
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: SaveStatus }>({});
  const [saveMessages, setSaveMessages] = useState<{ [key: string]: string | null }>({});
  const [isSaving, setIsSaving] = useState<{ [key: string]: string | null }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDatabaseView, setIsDatabaseView] = useState<{ [key: string]: boolean }>({});

  // NEW: Track the current data mode
  const [commonDataMode, setCommonDataMode] = useState<'shared' | 'per-tab'>('shared');

  // NEW: Update current data only in per-tab mode when tab changes
  useEffect(() => {
    if (commonDataMode === 'per-tab' && activeTab) {
      if (perLanguageCommonData[activeTab]) {
        setCurrentCommonData(perLanguageCommonData[activeTab]);
      }

      if (perLanguageFileInfo[activeTab]) {
        setCurrentFileInfo(perLanguageFileInfo[activeTab]);
      } else {
        setCurrentFileInfo(DEFAULT_FILE_INFO);
      }
    }
    // In shared mode, don't update currentCommonData when tab changes
  }, [activeTab, commonDataMode, perLanguageCommonData, perLanguageFileInfo]);

  // Set active tab when languages change
  useEffect(() => {
    if (selectedLanguages.length > 0 && (!activeTab || !selectedLanguages.includes(activeTab))) {
      setActiveTab(selectedLanguages[0]);
    } else if (selectedLanguages.length === 0) {
      setActiveTab('');
    }
  }, [selectedLanguages, activeTab]);

  const updateLanguageResult = useCallback(<K extends keyof LanguageResult>(
    language: string,
    key: K,
    value: LanguageResult[K]
  ) => {
    console.log(`Updating language result for ${language}, key: ${String(key)}`, value);
    setLanguageResults(prev => {
      if (!prev[language]) {
        console.warn(`Language result for ${language} not found when updating ${String(key)}`);
        return prev;
      }
      return {
        ...prev,
        [language]: {
          ...prev[language],
          [key]: value,
        },
      };
    });
  }, []);

  const updateCommonData = useCallback((key: keyof CommonData, value: any) => {
    setCurrentCommonData(prev => ({
      ...prev,
      [key]: value,
    }));

    // NEW: In per-tab mode, also update the per-language data
    if (commonDataMode === 'per-tab' && activeTab) {
      setPerLanguageCommonData(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [key]: value,
        },
      }));
    }
  }, [commonDataMode, activeTab]);

  const handleLanguageToggle = useCallback((language: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(language)) {
        // --- REMOVAL LOGIC ---
        const newLanguages = prev.filter(lang => lang !== language);

        // Update active tab if the removed one was active
        if (activeTab === language) {
          setActiveTab(newLanguages.length > 0 ? newLanguages[0] : '');
        }

        // Remove from available tabs as well
        setAvailableTabs(prevTabs => prevTabs.filter(tab => tab !== language));

        // Clean up all related state for this language
        const cleanup = (prevState: { [key: string]: any }) => {
          const newState = { ...prevState };
          delete newState[language];
          return newState;
        };

        setLanguageResults(cleanup);
        setOriginalResults(cleanup);
        setSaveStatus(cleanup);
        setSaveMessages(cleanup);
        setPerLanguageCommonData(cleanup);
        setPerLanguageFileInfo(cleanup);
        setIsEditing(cleanup);
        setIsSaving(cleanup);

        return newLanguages;
      } else {
        // --- ADDITION LOGIC ---
        const newLanguages = [...prev, language];
        if (prev.length === 0) {
          setActiveTab(language);
        }
        return newLanguages;
      }
    });
  }, [activeTab]);

  const removeLanguageTab = useCallback((language: string) => {
    // All removal logic is now centralized in handleLanguageToggle
    handleLanguageToggle(language);
  }, [handleLanguageToggle]);

  const handleQuickSave = useCallback(async (ui_action: string, file?: File, username?: string, imageHash?: string | null, onSuccess?: () => void) => {
    const currentTab = activeTab;

    if ((!file || !languageResults[currentTab]) && ui_action === "saveToDatabase") {
      return;
    }

    flushSync(() => { });

    setIsSaving(prev => ({ ...prev, [currentTab]: ui_action }));
    setSaveMessages(prev => ({ ...prev, [currentTab]: null }));

    let commonAttributes: any = {};
    let languageAttributes: any[] = [];

    try {
      // NEW: Get common data based on mode
      const tabCommonData = commonDataMode === 'shared'
        ? currentCommonData
        : (perLanguageCommonData[currentTab] || currentCommonData);

      commonAttributes = {
        object_name_en: tabCommonData.object_name_en || "",
        object_category: tabCommonData.object_category || "",
        tags: tabCommonData.tags || [],
        field_of_study: tabCommonData.field_of_study || "",
        age_appropriate: tabCommonData.age_appropriate || "",
        userid: username || "system",
        image_status: tabCommonData.image_status || "",
        object_id: tabCommonData.object_id || "",
        flag_object: tabCommonData.flag_object || "",
      };

      languageAttributes = [
        {
          language: currentTab,
          object_name: languageResults[currentTab].object_name || "",
          object_description: languageResults[currentTab].object_description || "",
          object_hint: languageResults[currentTab].object_hint || "",
          object_short_hint: languageResults[currentTab].object_short_hint || "",
          quiz_qa: languageResults[currentTab].quiz_qa || [],
          translation_status: languageResults[currentTab].translation_status || "",
          translation_id: languageResults[currentTab].translation_id || "",
          flag_translation: languageResults[currentTab].flag_translation || "",
        },
      ];

      // const action = RETURN_PERMISSION_ACTION[ui_action];
      const action = returnPermissionForUiActionForUser(userContext!)[ui_action];
      console.log(`Performing QuickSave with action: ${action}\nAnd with userContext:`, userContext);

      const returned_data = await translationService.saveToDatabase(
        commonAttributes,
        languageAttributes,
        action,
        file,
        imageHash
      );

      console.log("Data returned after QuickSave:", returned_data[0]?.translation_id);

      setLanguageResults(prev => ({
        ...prev,
        [currentTab]: {
          ...prev[currentTab],
          translation_id: returned_data[0]?.translation_id || prev[currentTab]?.translation_id,
        },
      }));

      setCurrentCommonData(prev => ({
        ...prev,
        object_id: returned_data[0]?.object_id || prev.object_id,
      }));

      if (returned_data[0]?.translation_id) {
        await refreshActiveTab(currentTab, returned_data[0]?.translation_id);
        console.log('=== After refreshActiveTab ===');
        console.log('languageResults[currentTab] should now be updated by refreshActiveTab');
      }

      setOriginalCommonData(currentCommonData);
      // Note: originalResults is now updated inside refreshActiveTab
      // to capture the refreshed data with translation_status

      setSaveStatus(prev => ({ ...prev, [currentTab]: "saved" }));
      setIsEditing(prev => ({ ...prev, [currentTab]: false }));
      setSaveMessages(prev => ({
        ...prev,
        [currentTab]: `${currentTab} ${UI_MESSAGES.SUCCESS.DATA_SAVED}`,
      }));

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }


    } catch (err) {
      setSaveMessages(prev => ({
        ...prev,
        [currentTab]: `Error saving ${currentTab}: ${(err as Error).message}`,
      }));
    } finally {
      setIsSaving(prev => ({ ...prev, [currentTab]: null }));
    }
  }, [activeTab, languageResults, currentCommonData, perLanguageCommonData, commonDataMode]);

  const refreshActiveTab = useCallback(async (tab: string, translationIdOverride?: string) => {
    try {
      const translationId = translationIdOverride || languageResults[tab]?.translation_id;
      if (!translationId) return;

      // Capture existing image_base64 before the API call
      const existingImageBase64 = commonDataMode === 'shared'
        ? currentCommonData.image_base64
        : (perLanguageCommonData[tab]?.image_base64 || currentCommonData.image_base64);

      setLanguageResults((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          isLoading: true,
          error: undefined,
        },
      }));

      console.log("calling API object/translation_id:", translationId);
      const data = await translationService.getTranslationById(translationId);
      console.log("Refresh response for", tab, data);

      const refreshedCommonData = {
        object_name_en: data.common_data?.object_name_en || "",
        object_category: data.common_data?.metadata?.object_category || "",
        tags: data.common_data?.metadata?.tags || [],
        field_of_study: data.common_data?.metadata?.field_of_study || "",
        age_appropriate: data.common_data?.metadata?.age_appropriate || "",
        image_status: data.common_data?.image_status || "",
        object_id: data.common_data?._id || "",
        // Preserve existing image_base64 if API doesn't return it
        image_base64: data.common_data?.image_base64 || existingImageBase64 || "",
        flag_object: data.common_data?.flag_object || "",
      };

      const refreshedFileInfo = {
        filename: data.file_info?.filename || "",
        size: data.file_info?.size || "",
        mimeType: data.file_info?.mime_type || "",
        dimensions: data.file_info?.dimensions || "",
        created_by: data.file_info?.created_by || "",
        created_at: data.file_info?.created_at || "",
        updated_by: data.file_info?.updated_by || "",
        updated_at: data.file_info?.updated_at || "",
      };

      // NEW: Update based on mode
      if (commonDataMode === 'shared') {
        // Shared mode: Update global current data only
        setCurrentCommonData(refreshedCommonData);
        setCurrentFileInfo(refreshedFileInfo);
      } else {
        // Per-tab mode: Update per-language data
        setPerLanguageCommonData((prev) => ({
          ...prev,
          [tab]: refreshedCommonData,
        }));

        setPerLanguageFileInfo((prev) => ({
          ...prev,
          [tab]: refreshedFileInfo,
        }));

        // Also update current data if this is the active tab
        if (tab === activeTab) {
          setCurrentCommonData(refreshedCommonData);
          setCurrentFileInfo(refreshedFileInfo);
        }
      }

      // Update language-specific results (always needed)
      setLanguageResults((prev) => ({
        ...prev,
        [tab]: {
          object_name: data.translations?.object_name || "",
          object_description: data.translations?.object_description || "",
          object_hint: data.translations?.object_hint || "",
          object_short_hint: data.translations?.object_short_hint || "",
          quiz_qa: data.translations?.quiz_qa || [],
          translation_status: data.translations?.translation_status || "",
          translation_id: data.translations?._id || "",
          isLoading: false,
          error: undefined,
          flag_translation: data.flag_translation || false,
        },
      }));

      // Update originalResults to include the refreshed data
      // This ensures toggling edit mode after save doesn't lose translation_status
      setOriginalResults((prev) => ({
        ...prev,
        [tab]: {
          object_name: data.translations?.object_name || "",
          object_description: data.translations?.object_description || "",
          object_hint: data.translations?.object_hint || "",
          object_short_hint: data.translations?.object_short_hint || "",
          quiz_qa: data.translations?.quiz_qa || [],
          translation_status: data.translations?.translation_status || "",
          translation_id: data.translations?._id || "",
          flag_translation: data.flag_translation || false,
        },
      }));

      console.log('=== refreshActiveTab - originalResults updated ===');
      console.log('translation_status saved:', data.translations?.translation_status);

      setSaveStatus((prev) => ({
        ...prev,
        [tab]: "saved"
      }));

    } catch (err) {
      console.error("Refresh failed:", err);

      setLanguageResults((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          isLoading: false,
          error: (err as Error).message,
        },
      }));
    }
  }, [activeTab, languageResults, commonDataMode, currentCommonData, perLanguageCommonData]);

  const clearResults = useCallback(() => {
    setLanguageResults({});
    setOriginalResults({});
    setCurrentCommonData(DEFAULT_COMMON_DATA);
    setOriginalCommonData(DEFAULT_COMMON_DATA);
    setPerLanguageCommonData({});
    setCurrentFileInfo(DEFAULT_FILE_INFO);
    setPerLanguageFileInfo({});
    setIsEditing({});
    setSaveStatus({});
    setSaveMessages({});
    setIsSaving({});
    setAvailableTabs([]);
    setActiveTab('');
    setIsDatabaseView({});
  }, []);

  const toggleEdit = useCallback((tab: string) => {
    const currentTab = tab;

    console.log('=== toggleEdit DEBUG ===');
    console.log('Current tab:', currentTab);
    console.log('isEditing before:', isEditing[currentTab]);
    console.log('languageResults[currentTab]:', languageResults[currentTab]);
    console.log('originalResults[currentTab]:', originalResults[currentTab]);

    // If currently in edit mode, exit edit mode but KEEP changes (act as Preview)
    if (isEditing[currentTab]) {
      console.log('EXITING edit mode - keeping changes');
      // Do NOT revert data here. This allows users to switch to View mode to preview changes.
      // To cancel, they would need to reload or re-select the item.

      // Exit edit mode
      setIsEditing(prev => ({ ...prev, [currentTab]: false }));
      return;
    }

    // If not in edit mode, enter edit mode and save current state
    console.log('ENTERING edit mode');

    // CRITICAL: Save current state before entering edit mode
    // This allows us to revert changes if user exits without saving
    if (currentTab === 'English') {
      // Save common data snapshot for English tab
      setOriginalCommonData(currentCommonData);
    }

    // Save language-specific data snapshot
    setOriginalResults(prev => ({
      ...prev,
      [currentTab]: { ...languageResults[currentTab] }
    }));

    setIsEditing(prev => ({ ...prev, [currentTab]: true }));
  }, [isEditing, originalCommonData, originalResults, languageResults, currentCommonData]);


  return {
    // States
    selectedLanguages,
    activeTab,
    availableTabs,
    languageResults,
    originalResults,
    currentCommonData,
    originalCommonData,
    perLanguageCommonData,
    currentFileInfo,
    perLanguageFileInfo,
    isEditing,
    saveStatus,
    saveMessages,
    isSaving,
    isLoading,
    isDatabaseView,
    commonDataMode,

    // Setters
    setSelectedLanguages,
    setActiveTab,
    setAvailableTabs,
    setLanguageResults,
    setOriginalResults,
    setCurrentCommonData,
    setOriginalCommonData,
    setPerLanguageCommonData,
    setCurrentFileInfo,
    setPerLanguageFileInfo,
    setIsEditing,
    setSaveStatus,
    setSaveMessages,
    setIsSaving,
    setIsLoading,
    setIsDatabaseView,
    setCommonDataMode,

    // Actions
    updateLanguageResult,
    updateCommonData,
    handleLanguageToggle,
    removeLanguageTab,
    handleQuickSave,
    refreshActiveTab,
    clearResults,
    toggleEdit
  };
};
