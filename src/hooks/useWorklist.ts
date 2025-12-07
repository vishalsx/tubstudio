// hooks/useWorklist.ts
import { useState, useCallback } from 'react';
import { translationService } from '../services/translation.service';
import { RecentTranslation } from '../types';
import { UI_MESSAGES } from '../utils/constants';

export const useWorklist = () => {
  const [recentTranslations, setRecentTranslations] = useState<RecentTranslation[]>([]);
  const [worklistFetched, setWorklistFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentTranslations = useCallback(async (username: string) => {
    try {
      const data = await translationService.fetchThumbnails(username);
      setRecentTranslations(data);
      return data;
    } catch (err) {
      console.error("Error fetching recent translations:", err);
      setError("Failed to fetch recent translations");
      return [];
    }
  }, []);

  const handleFetchWorklist = useCallback(async (
    language: string,
    selectedLanguages: string[],
    setLanguageResults: any,
    setActiveTab: any,
    setOriginalResults: any,
    setOriginalCommonData: any,
    setCurrentCommonData: any,
    setPerLanguageCommonData: any,
    setPerLanguageFileInfo: any,
    setCurrentFileInfo: any,
    setSaveStatus: any,
    setIsEditing: any,
    setAvailableTabs: any,
    setSaveMessages: any
  ) => {
    setSaveMessages({});

    // Determine languages to fetch
    const languagesToFetch = language === "ALL" ? selectedLanguages : [language];
    const isFullRefresh = language === "ALL";

    if (selectedLanguages.length === 0) {
      setError('Please select at least one language.');
      return;
    }

    // Only clear ALL data if doing a full refresh
    if (isFullRefresh) {
      setLanguageResults({});
      setActiveTab('');
      setOriginalResults({});
      setOriginalCommonData({});
      setCurrentCommonData({
        object_name_en: "",
        object_category: "",
        tags: [],
        field_of_study: "",
        age_appropriate: "",
        image_status: "",
        object_id: "",
        image_base64: "",
        flag_object: false
      });
      setPerLanguageCommonData({});
      setPerLanguageFileInfo({});
      setCurrentFileInfo({
        filename: '',
        size: '',
        mimeType: '',
        dimensions: '',
        created_by: '',
        created_at: '',
        updated_by: '',
        updated_at: '',
      });
    } else {
      setSaveMessages((prev: any) => ({ ...prev, [language]: null }));
    }

    setWorklistFetched(false);
    setIsLoading(true);
    setError(null);

    try {
      // Set loading state only for languages being fetched
      setLanguageResults((prev: any) => {
        const updated = { ...prev };
        languagesToFetch.forEach(lang => {
          updated[lang] = {
            object_name: '',
            object_description: '',
            object_hint: '',
            object_short_hint: '',
            translation_status: '',
            translation_id: '',
            isLoading: true,
            flag_translation: false
          };
        });
        return updated;
      });

      const data = await translationService.fetchWorklist(languagesToFetch);

      console.log(`Worklist API response for ${language}:`, data);

      // Process the response
      if (!Array.isArray(data) || data.length === 0) {
        // Handle empty response
        handleEmptyWorklist(
          languagesToFetch,
          isFullRefresh,
          language,
          setLanguageResults,
          setOriginalResults,
          setPerLanguageCommonData,
          setPerLanguageFileInfo,
          setSaveStatus,
          setIsEditing,
          setAvailableTabs,
          setActiveTab,
          setCurrentCommonData,
          setCurrentFileInfo
        );

        setWorklistFetched(true);
        return;
      }

      // Process returned data
      const processedData = processWorklistData(data);

      // Update states based on refresh type
      if (isFullRefresh) {
        // Replace everything
        updateStatesForFullRefresh(
          processedData,
          setLanguageResults,
          setOriginalResults,
          setPerLanguageCommonData,
          setPerLanguageFileInfo,
          setSaveStatus,
          setIsEditing
        );
      } else {
        // Merge with existing data
        updateStatesForPartialRefresh(
          processedData,
          setLanguageResults,
          setOriginalResults,
          setPerLanguageCommonData,
          setPerLanguageFileInfo,
          setSaveStatus,
          setIsEditing
        );
      }

      // Update available tabs and active tab
      updateTabsAndActiveTab(
        processedData,
        isFullRefresh,
        setAvailableTabs,
        setActiveTab,
        setCurrentCommonData,
        setCurrentFileInfo,
        setOriginalCommonData
      );

      setWorklistFetched(true);
      console.log(`Worklist updated successfully for ${language}`);

    } catch (err) {
      console.error("Worklist fetch error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSkip = useCallback(async (
    activeTab: string,
    languageResults: any,
    handleFetchWorklistCallback: (language: string) => Promise<void>
  ) => {
    const translationId = languageResults[activeTab]?.translation_id || '';

    if (!translationId) {
      setError('No translation ID found for this record');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await translationService.skipToUnlock(translationId);

      // Refresh the worklist
      await handleFetchWorklistCallback(activeTab);

    } catch (err) {
      console.error('Skip error:', err);
      setError((err as Error).message || 'Failed to skip record');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper functions
  const handleEmptyWorklist = (
    languagesToFetch: string[],
    isFullRefresh: boolean,
    language: string,
    setLanguageResults: any,
    setOriginalResults: any,
    setPerLanguageCommonData: any,
    setPerLanguageFileInfo: any,
    setSaveStatus: any,
    setIsEditing: any,
    setAvailableTabs: any,
    setActiveTab: any,
    setCurrentCommonData: any,
    setCurrentFileInfo: any
  ) => {
    // Remove languages with no data from all states
    const stateSetters = [
      setLanguageResults,
      setOriginalResults,
      setPerLanguageCommonData,
      setPerLanguageFileInfo,
      setSaveStatus,
      setIsEditing
    ];

    stateSetters.forEach(setter => {
      setter((prev: any) => {
        const updated = { ...prev };
        languagesToFetch.forEach(lang => {
          delete updated[lang];
        });
        return updated;
      });
    });

    // Update available tabs to remove those with no worklist items
    setAvailableTabs((prevTabs: string[]) => {
      const newTabs = prevTabs.filter(tab => !languagesToFetch.includes(tab));

      // After filtering tabs, update the active tab based on what's left
      setActiveTab((prevActiveTab: string) => {
        // If the active tab was one of the ones removed, pick a new one
        if (!newTabs.includes(prevActiveTab)) {
          return newTabs.length > 0 ? newTabs[0] : '';
        }
        return prevActiveTab;
      });

      return newTabs;
    });

    if (!isFullRefresh) {
      setError(`${UI_MESSAGES.ERRORS.NO_WORKLIST_DATA} ${language}`);
    } else {
      setError(UI_MESSAGES.ERRORS.WORKLIST_EMPTY);
    }
  };

  const processWorklistData = (data: any[]) => {
    const newResults: any = {};
    const newPerLanguageCommonData: any = {};
    const newPerLanguageFileInfo: any = {};
    const newOriginalResults: any = {};
    const newSaveStatus: any = {};
    const newEditingState: any = {};

    data.forEach((item: any) => {
      const lang = item.requested_language;

      newPerLanguageCommonData[lang] = {
        object_name_en: item.object_name_en || '',
        object_category: item.object_category || '',
        tags: item.tags || [],
        field_of_study: item.field_of_study || '',
        age_appropriate: item.age_appropriate || '',
        image_status: item.image_status || '',
        object_id: item.object_id || '',
        image_base64: item.image_base64 || '',
        flag_object: item.flag_object || false
      };

      newPerLanguageFileInfo[lang] = {
        filename: item.filename || '',
        size: item.size || '',
        mimeType: item.mimeType || item.mime_type || '',
        dimensions: item.dimensions || '',
        created_by: item.created_by || '',
        created_at: item.created_at || '',
        updated_by: item.updated_by || '',
        updated_at: item.updated_at || '',
      };

      const langResult = {
        object_name: item.object_name || '',
        object_description: item.object_description || '',
        object_hint: item.object_hint || '',
        object_short_hint: item.object_short_hint || '',
        quiz_qa: item.quiz_qa || [],
        translation_status: item.translation_status || '',
        translation_id: item.translation_id || '',
        isLoading: false,
        flag_translation: item.translation || false
      };

      newResults[lang] = langResult;
      newOriginalResults[lang] = { ...langResult };
      newSaveStatus[lang] = 'saved';
      newEditingState[lang] = false;
    });

    return {
      newResults,
      newPerLanguageCommonData,
      newPerLanguageFileInfo,
      newOriginalResults,
      newSaveStatus,
      newEditingState
    };
  };

  const updateStatesForFullRefresh = (
    processedData: any,
    setLanguageResults: any,
    setOriginalResults: any,
    setPerLanguageCommonData: any,
    setPerLanguageFileInfo: any,
    setSaveStatus: any,
    setIsEditing: any
  ) => {
    setLanguageResults(processedData.newResults);
    setOriginalResults(processedData.newOriginalResults);
    setPerLanguageCommonData(processedData.newPerLanguageCommonData);
    setPerLanguageFileInfo(processedData.newPerLanguageFileInfo);
    setSaveStatus(processedData.newSaveStatus);
    setIsEditing(processedData.newEditingState);
  };

  const updateStatesForPartialRefresh = (
    processedData: any,
    setLanguageResults: any,
    setOriginalResults: any,
    setPerLanguageCommonData: any,
    setPerLanguageFileInfo: any,
    setSaveStatus: any,
    setIsEditing: any
  ) => {
    setLanguageResults((prev: any) => ({ ...prev, ...processedData.newResults }));
    setOriginalResults((prev: any) => ({ ...prev, ...processedData.newOriginalResults }));
    setPerLanguageCommonData((prev: any) => ({ ...prev, ...processedData.newPerLanguageCommonData }));
    setPerLanguageFileInfo((prev: any) => ({ ...prev, ...processedData.newPerLanguageFileInfo }));
    setSaveStatus((prev: any) => ({ ...prev, ...processedData.newSaveStatus }));
    setIsEditing((prev: any) => ({ ...prev, ...processedData.newEditingState }));
  };

  const updateTabsAndActiveTab = (
    processedData: any,
    isFullRefresh: boolean,
    setAvailableTabs: any,
    setActiveTab: any,
    setCurrentCommonData: any,
    setCurrentFileInfo: any,
    setOriginalCommonData: any
  ) => {
    const allLanguages = Object.keys(processedData.newResults);
    setAvailableTabs(allLanguages);

    if (allLanguages.length > 0) {
      const tabToActivate = allLanguages[0];
      setActiveTab(tabToActivate);

      const commonDataToUse = processedData.newPerLanguageCommonData[tabToActivate];
      const fileInfoToUse = processedData.newPerLanguageFileInfo[tabToActivate];

      if (commonDataToUse) {
        setCurrentCommonData(commonDataToUse);
        if (isFullRefresh) {
          setOriginalCommonData(commonDataToUse);
        }
      }

      if (fileInfoToUse) {
        setCurrentFileInfo(fileInfoToUse);
      }
    }
  };

  return {
    recentTranslations,
    worklistFetched,
    isLoading,
    error,
    setRecentTranslations,
    setError,
    fetchRecentTranslations,
    handleFetchWorklist,
    handleSkip
  };
};