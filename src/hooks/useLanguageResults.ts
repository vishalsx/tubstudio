// hooks/useLanguageResults.ts
import { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { translationService } from '../services/translation.service';
import { LanguageResult, CommonData, FileInfo, SaveStatus } from '../types';
import { DEFAULT_COMMON_DATA, DEFAULT_FILE_INFO, UI_MESSAGES } from '../utils/constants';
import { RETURN_PERMISSION_ACTION } from '../utils/permissions/hasPermissions';



export const useLanguageResults = () => {
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
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDatabaseView, setIsDatabaseView] = useState<{ [key: string]: boolean }>({});


    // Update active tab when perLanguageCommonData changes
    useEffect(() => {
      if (activeTab && perLanguageCommonData[activeTab]) {
        setCurrentCommonData(perLanguageCommonData[activeTab]);
      }
      
      if (activeTab && perLanguageFileInfo[activeTab]) {
        setCurrentFileInfo(perLanguageFileInfo[activeTab]);
      } else if (activeTab) {
        setCurrentFileInfo(DEFAULT_FILE_INFO);
      }
    }, [activeTab, perLanguageCommonData, perLanguageFileInfo]);
  
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
      setLanguageResults(prev => ({
        ...prev,
        [language]: {
          ...prev[language],
          [key]: value,
        },
      }));
    }, []);
  
    const updateCommonData = useCallback((key: keyof CommonData, value: any) => {
      setCurrentCommonData(prev => ({
        ...prev,
        [key]: value,
      }));
    }, []);
  
    const handleLanguageToggle = useCallback((language: string) => {
      setSelectedLanguages(prev => {
        if (prev.includes(language)) {
          // Language is being removed
          const newLanguages = prev.filter(lang => lang !== language);
          
          // If removing the currently active tab, switch to another tab
          if (activeTab === language) {
            if (newLanguages.length > 0) {
              setActiveTab(newLanguages[0]);
            } else {
              setActiveTab('');
            }
          }
          
          // Clean up related states
          setLanguageResults(prevResults => {
            const newResults = { ...prevResults };
            delete newResults[language];
            return newResults;
          });
          
          setOriginalResults(prevOriginal => {
            const newOriginal = { ...prevOriginal };
            delete newOriginal[language];
            return newOriginal;
          });
          
          setSaveStatus(prevStatus => {
            const newStatus = { ...prevStatus };
            delete newStatus[language];
            return newStatus;
          });
          
          setSaveMessages(prevMessages => {
            const newMessages = { ...prevMessages };
            delete newMessages[language];
            return newMessages;
          });
          
          return newLanguages;
        } else {
          // Language is being added
          const newLanguages = [...prev, language];
          
          // If this is the first language being added, make it active
          if (prev.length === 0) {
            setActiveTab(language);
          }
          
          return newLanguages;
        }
      });
    }, [activeTab]);
  
    const removeLanguageTab = useCallback((language: string) => {
      // Clean up all related states
      setSaveStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[language];
        return newStatus;
      });
  
      setLanguageResults(prev => {
        const newResults = { ...prev };
        delete newResults[language];
        return newResults;
      });
  
      setPerLanguageCommonData(prev => {
        const newCommon = { ...prev };
        delete newCommon[language];
        return newCommon;
      });
  
      setPerLanguageFileInfo(prev => {
        const newFileInfo = { ...prev };
        delete newFileInfo[language];
        return newFileInfo;
      });
  
      // Remove from available tabs
      setAvailableTabs(prev => {
        const remaining = prev.filter(tab => tab !== language);
        // If the removed tab was active, switch to another one
        if (activeTab === language) {
          setActiveTab(remaining.length > 0 ? remaining[0] : '');
        }
        return remaining;
      });
  
      // Also update selectedLanguages
      handleLanguageToggle(language);
    }, [activeTab, handleLanguageToggle]);

  const handleQuickSave = useCallback(async (ui_action: string, file?: File, username?: string) => {
    const currentTab = activeTab;

    if ((!file || !languageResults[currentTab]) && ui_action === "saveToDatabase") {
      return;
    }

    // Force React to flush all pending state updates
    flushSync(() => {
      // This forces React to complete any pending state updates immediately
    });

    setIsSaving(true);
    setSaveMessages(prev => ({ ...prev, [currentTab]: null }));

    let commonAttributes: any = {};
    let languageAttributes: any[] = [];

    try {
      const tabCommonData = currentCommonData || perLanguageCommonData[currentTab];
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
          translation_status: languageResults[currentTab].translation_status || "",
          translation_id: languageResults[currentTab].translation_id || "",
          flag_translation: languageResults[currentTab].flag_translation || "",
        },
      ];

      const action = RETURN_PERMISSION_ACTION[ui_action];
      console.log("Saving with attributes:", { commonAttributes, languageAttributes, action });

      const returned_data = await translationService.saveToDatabase(
        commonAttributes,
        languageAttributes,
        action,
        file
      );

      console.log("Data returned after QuickSave:", returned_data[0]?.translation_id);

      // Update state with new ids before refreshing
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

      // Refresh from backend if translation_id exists
      if (returned_data[0]?.translation_id) {
        await refreshActiveTab(currentTab, returned_data[0]?.translation_id);
      }

      // Update states after successful save
      setOriginalCommonData(currentCommonData);
      setOriginalResults(prev => ({
        ...prev,
        [currentTab]: { ...languageResults[currentTab] },
      }));
      
      setSaveStatus(prev => ({ ...prev, [currentTab]: "saved" }));
      setIsEditing(prev => ({ ...prev, [currentTab]: false }));
      setSaveMessages(prev => ({
        ...prev,
        [currentTab]: `${currentTab} ${UI_MESSAGES.SUCCESS.DATA_SAVED}`,
      }));
    } catch (err) {
      setSaveMessages(prev => ({
        ...prev,
        [currentTab]: `Error saving ${currentTab}: ${(err as Error).message}`,
      }));
    } finally {
      setIsSaving(false);
    }
  }, [activeTab, languageResults, currentCommonData, perLanguageCommonData]);

  const refreshActiveTab = useCallback(async (tab: string, translationIdOverride?: string) => {
    try {
      const translationId = translationIdOverride || languageResults[tab]?.translation_id;
      if (!translationId) return;

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

      // Update current common data (global state)
      setCurrentCommonData({
        object_name_en: data.common_data?.object_name_en || "",
        object_category: data.common_data?.metadata?.object_category || "",
        tags: data.common_data?.metadata?.tags || [],
        field_of_study: data.common_data?.metadata?.field_of_study || "",
        age_appropriate: data.common_data?.metadata?.age_appropriate || "",
        image_status: data.common_data?.image_status || "",
        object_id: data.common_data?._id || "",
        image_base64: data.common_data?.image_base64 || "",
        flag_object: data.common_data?.flag_object || "",
      });

      // Update per-language common data for this specific tab
      setPerLanguageCommonData((prev) => ({
        ...prev,
        [tab]: {
          object_name_en: data.common_data?.object_name_en || "",
          object_category: data.common_data?.metadata?.object_category || "",
          tags: data.common_data?.metadata?.tags || [],
          field_of_study: data.common_data?.metadata?.field_of_study || "",
          age_appropriate: data.common_data?.metadata?.age_appropriate || "",
          image_status: data.common_data?.image_status || "",
          object_id: data.common_data?._id || "",
          image_base64: data.common_data?.image_base64 || "",
          flag_object: data.common_data?.flag_object || "",
        },
      }));

      // Update file info
      const fileInfoData = {
        filename: data.file_info?.filename || "",
        size: data.file_info?.size || "",
        mimeType: data.file_info?.mime_type || "",
        dimensions: data.file_info?.dimensions || "",
        created_by: data.file_info?.created_by || "",
        created_at: data.file_info?.created_at || "",
        updated_by: data.file_info?.updated_by || "",
        updated_at: data.file_info?.updated_at || "",
      };

      setPerLanguageFileInfo((prev) => ({
        ...prev,
        [tab]: fileInfoData,
      }));

      if (tab === activeTab) {
        setCurrentFileInfo(fileInfoData);
      }

      // Update the specific tab's language results with fresh data
      setLanguageResults((prev) => ({
        ...prev,
        [tab]: {
          object_name: data.translations?.object_name || "",
          object_description: data.translations?.object_description || "",
          object_hint: data.translations?.object_hint || "",
          object_short_hint: data.translations?.object_short_hint || "",
          translation_status: data.translations?.translation_status || "",
          translation_id: data.translations?._id || "",
          isLoading: false,
          error: undefined,
          flag_translation: data.flag_translation || false,
        },
      }));

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
  }, [activeTab, languageResults]);

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
    setAvailableTabs([]);
    setActiveTab('');
    setIsDatabaseView({});
  }, []);

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
    
    // Actions
    updateLanguageResult,
    updateCommonData,
    handleLanguageToggle,
    removeLanguageTab,
    handleQuickSave,
    refreshActiveTab,
    clearResults
  };
}; 


