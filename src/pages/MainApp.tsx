// Permission-based mode determination integrated with MainApp.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { LeftPanel } from '../components/panels/LeftPanel';
import { MiddlePanel } from '../components/panels/MiddlePanel';
import { RightPanel } from '../components/panels/RightPanel';
import { useAuth } from '../hooks/useAuth';
import { useImageUpload } from '../hooks/useImageUpload';
import { useLanguageResults } from '../hooks/useLanguageResults';
import { useWorklist } from '../hooks/useWorklist';
import { useCurriculum } from '../hooks/useCurriculum';
// FIX: Import translationService to resolve 'Cannot find name' errors.
import { translationService } from '../services/translation.service';
import { canPerformUiAction } from '../utils/permissions/hasPermissions';
import { PermissionCheck, UserContext, DatabaseImage, CurriculumImage, Book, Chapter, Page } from '../types';
import { formatFileSize } from '../utils/imageUtils';
import { UI_MESSAGES, DEFAULT_COMMON_DATA, DEFAULT_FILE_INFO } from '../utils/constants';

interface MainAppProps {
  authData: {
    isLoggedIn: boolean | null;
    userContext: UserContext | null;
    loginError: string | null;
    languageOptions: string[];
    isRedirecting: boolean;
    recentTranslations: any[];
    setIsRedirecting: (value: boolean) => void;
    login: (username: string, password: string) => Promise<UserContext>;
    logout: () => void;
    fetchRecentTranslations: (username: string) => Promise<any[]>;
  };
}

export const MainApp: React.FC<MainAppProps> = ({ authData }) => {
  const {
    userContext,
    languageOptions,
    isRedirecting,
    setIsRedirecting,
    logout,
    recentTranslations
  } = authData;

  const imageUpload = useImageUpload();
  const languageResults = useLanguageResults();
  const worklist = useWorklist();
  const curriculum = useCurriculum(userContext);

  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Abort Controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Progress state for API calls
  const [identifyProgress, setIdentifyProgress] = useState<{ current: number; total: number } | null>(null);

  // View management states
  const [leftPanelView, setLeftPanelView] = useState<'upload' | 'database' | 'curriculum'>('upload');
  const [languageForImageSearch, setLanguageForImageSearch] = useState<string>('');

  // Database View states
  const [searchQuery, setSearchQuery] = useState('');
  const [databaseImages, setDatabaseImages] = useState<DatabaseImage[]>([]);
  const [isPopularImagesLoading, setIsPopularImagesLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [pendingIdentify, setPendingIdentify] = useState<string[] | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Curriculum State
  const [selectedCurriculumNode, setSelectedCurriculumNode] = useState<Book | Chapter | Page | null>(null);
  const activeBookIdRef = useRef<string | null>(null);

  // Worklist callout state
  const [showWorklistCallout, setShowWorklistCallout] = useState(false);
  const worklistCalloutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // This effect syncs the selected node for the right panel with the active book from the curriculum hook.
  // It now only resets to the book level if the active book's ID changes, preventing it from
  // overriding a chapter/page selection when the active book's data is merely updated.
  useEffect(() => {
    const newActiveBookId = curriculum.activeBook?._id || null;

    if (newActiveBookId !== activeBookIdRef.current) {
      setSelectedCurriculumNode(curriculum.activeBook);
      activeBookIdRef.current = newActiveBookId;
    }
  }, [curriculum.activeBook]);

  // Permission checks
  const currentMetadataState = languageResults.currentCommonData?.image_status || "";
  const currentLanguageState: { [key: string]: string | null } = Object.fromEntries(
    Object.entries(languageResults.languageResults).map(([tab, result]) => {
      const raw = result?.translation_status;
      const normalized = raw === "" || raw === undefined || raw === "null" ? null : raw;
      return [tab, normalized];
    })
  );

  const handleToggleLeftPanel = () => {
    setIsLeftPanelCollapsed(prev => !prev);
  };

  useEffect(() => {
    if (languageOptions.length > 0) {
      if (!languageForImageSearch) {
        setLanguageForImageSearch(languageOptions[0]);
      }
      if (!curriculum.searchLanguage) {
        curriculum.setSearchLanguage(languageOptions[0]);
      }
    }
  }, [languageOptions, languageForImageSearch, curriculum.searchLanguage, curriculum.setSearchLanguage]);


  function makeActionChecks(
    action: string,
    currentMetadataState: string | null,
    currentLanguageState: string | null
  ): PermissionCheck {
    return {
      metadata: canPerformUiAction(action, "metadata", currentMetadataState, currentLanguageState, userContext),
      language: canPerformUiAction(action, "language", currentMetadataState, currentLanguageState, userContext)
    };
  }

  // All permission checks
  const canUploadPicture = makeActionChecks("uploadPicture", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canShowDatabase = makeActionChecks("showDatabase", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canSwitchToEditMode = makeActionChecks("switchToEditMode", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canSaveToDatabase = makeActionChecks("saveToDatabase", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canReleaseToDatabase = makeActionChecks("releaseToDatabase", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canViewWorkList = makeActionChecks("viewWorkListWindow", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canIdentifyImage = makeActionChecks("identifyImage", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canVerifyData = makeActionChecks("verifyData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canApproveData = makeActionChecks("approveData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canRejectData = makeActionChecks("rejectData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canSkiptData = makeActionChecks("skipData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);

  const getDataMode = (): 'shared' | 'per-tab' => {
    const hasIdentifyPermission = canIdentifyImage.metadata || canIdentifyImage.language;
    const hasUploadPermission = canUploadPicture.metadata || canUploadPicture.language;
    return (hasIdentifyPermission && hasUploadPermission) ? 'shared' : 'per-tab';
  };

  const commonDataMode = getDataMode();

  useEffect(() => {
    languageResults.setCommonDataMode(commonDataMode);
  }, [commonDataMode, languageResults.setCommonDataMode]);

  // Cleanup worklist callout timer on unmount
  useEffect(() => {
    return () => {
      if (worklistCalloutTimerRef.current) {
        clearTimeout(worklistCalloutTimerRef.current);
      }
    };
  }, []);

  const getCurrentCommonData = (activeTab: string) => {
    if (commonDataMode === 'shared') {
      return languageResults.currentCommonData;
    } else {
      return languageResults.perLanguageCommonData?.[activeTab] || {};
    }
  };

  const getCurrentFileInfo = (activeTab: string) => {
    if (commonDataMode === 'shared') {
      return languageResults.currentFileInfo;
    } else {
      return languageResults.perLanguageFileInfo?.[activeTab] || DEFAULT_FILE_INFO;
    }
  };

  useEffect(() => {
    if (imageUpload.error) {
      const timer = setTimeout(() => imageUpload.clearError(), 3000);
      return () => clearTimeout(timer);
    }
  }, [imageUpload.error, imageUpload.clearError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageDropdownOpen]);

  useEffect(() => {
    const languagesReady =
      pendingIdentify &&
      pendingIdentify.length > 0 &&
      languageResults.selectedLanguages.length === pendingIdentify.length &&
      pendingIdentify.every(lang => languageResults.selectedLanguages.includes(lang));

    if (languagesReady) {
      handleIdentify(pendingIdentify);
      setPendingIdentify(null);
    }
  }, [pendingIdentify, languageResults.selectedLanguages]);

  const handleLeftPanelViewChange = (view: 'upload' | 'database' | 'curriculum') => {
    setLeftPanelView(view);
  };

  const handleSearchQueryChange = (value: string) => setSearchQuery(value);

  const processPoolImagesResponse = (data: any[]) => {
    if (!data || data.length === 0) {
      setDatabaseImages([]);
      return;
    }
    const formattedImages: DatabaseImage[] = data.map((item: any) => ({
      object: {
        thumbnail: item.poolImage.thumbnail_base64,
        image_base64: item.poolImage.image_base64,
        image_hash: item.poolImage.image_hash,
      },
      file_info: {
        filename: item.file_info.file_name,
        size: formatFileSize(item.file_info.file_size),
        mimeType: item.file_info.mime_type,
        created_at: item.file_info.created_at,
        updated_at: item.file_info.updated_at,
        dimensions: '', created_by: '', updated_by: '',
      },
      common_data: {
        object_name_en: item.poolImage.object_name_en,
        object_category: "", tags: [], field_of_study: "", age_appropriate: "",
        image_status: "", object_id: item.poolImage.object_id || "",
        image_base64: "", flag_object: false
      },
      popularity_stars: item.poolImage.popularity_stars,
      total_vote_count: item.poolImage.total_vote_count,
      translated_languages: item.translated_languages,
      untranslated_languages: item.untranslated_languages,
    }));
    setDatabaseImages(formattedImages);
  };

  const handleDatabaseSearch = async (query: string) => {
    worklist.setError(null);
    setDatabaseImages([]);
    setSearchAttempted(true);
    setIsSearchLoading(true);
    try {
      const poolImagesData = await translationService.fetchPopularImages(query);
      processPoolImagesResponse(poolImagesData);
    } catch (error) {
      worklist.setError((error as Error).message || UI_MESSAGES.ERRORS.SOMETHING_WRONG);
      setDatabaseImages([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleFetchPopularImages = async () => {
    worklist.setError(null);
    setDatabaseImages([]);
    setSearchAttempted(true);
    setIsPopularImagesLoading(true);
    try {
      const popularImagesData = await translationService.fetchPopularImages();
      processPoolImagesResponse(popularImagesData);
    } catch (error) {
      worklist.setError((error as Error).message || UI_MESSAGES.ERRORS.SOMETHING_WRONG);
      setDatabaseImages([]);
    } finally {
      setIsPopularImagesLoading(false);
    }
  };

  const handleDatabaseImageClick = async (image: DatabaseImage) => {
    imageUpload.resetUpload();
    languageResults.clearResults();

    const { object, file_info, common_data } = image;
    await imageUpload.handleThumbnailFile(object.image_base64, file_info.filename);
    imageUpload.setImageHash(object.image_hash);
    languageResults.setCurrentCommonData({ ...common_data, image_base64: object.image_base64 });
    languageResults.setCurrentFileInfo(file_info);
    setLeftPanelView('upload');
    const languagesToIdentify = image.untranslated_languages || [];
    if (languagesToIdentify.length > 0) {
      languageResults.setSelectedLanguages(languagesToIdentify);
      setPendingIdentify(languagesToIdentify);
    }
  };

  const handleCurriculumImageDoubleClick = async (image: CurriculumImage, language: string) => {
    // Use the full base64 image if available, otherwise fall back to the thumbnail.
    const imageDataSource = image.image_base64 || image.thumbnail;

    if (!imageDataSource) {
      worklist.setError("Image data is missing.");
      return;
    }

    // The image source might be raw base64 or a data URI. 
    // `handleDatabaseImageClick` needs raw base64 for its `image_base64` property.
    const base64ForUpload = imageDataSource.startsWith('data:') ? imageDataSource.split(',')[1] : imageDataSource;

    // The thumbnail for the mock object can just be the thumbnail from the curriculum image.
    const thumbnailForMock = image.thumbnail
      ? (image.thumbnail.startsWith('data:') ? image.thumbnail.split(',')[1] : image.thumbnail)
      : base64ForUpload; // fallback if thumbnail isn't there

    const mockFullImage: DatabaseImage = {
      object: {
        thumbnail: thumbnailForMock,
        image_base64: base64ForUpload, // Pass the full image base64
        image_hash: image.image_hash,
      },
      file_info: {
        filename: `${(image.object_name || 'image').replace(/\s/g, '_')}.jpg`,
        size: 'N/A', mimeType: 'image/jpeg', dimensions: 'N/A',
        created_by: 'CurriculumSystem', created_at: new Date().toISOString(),
        updated_by: 'CurriculumSystem', updated_at: new Date().toISOString(),
      },
      common_data: {
        object_name_en: image.object_name,
        object_category: "From Curriculum", tags: ['education'],
        object_id: image.image_id,
      },
      untranslated_languages: [language],
    };
    await handleDatabaseImageClick(mockFullImage);
  };

  const handleCancelIdentify = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      worklist.setError("Identification cancelled.");
      languageResults.setIsLoading(false);
      setIdentifyProgress(null);
      languageResults.clearResults();
    }
  }, [worklist, languageResults]);

  const handleIdentify = async (languagesOverride?: string[]) => {
    const languagesToUse = languagesOverride || languageResults.selectedLanguages;
    languageResults.setSaveMessages({});
    setIsLanguageDropdownOpen(false);
    worklist.setError(null);
    setSelectedCurriculumNode(null);

    if (!imageUpload.file && !imageUpload.imageHash) {
      worklist.setError("Please upload an image or provide an image hash.");
      return;
    }
    if (languagesToUse.length === 0) {
      worklist.setError("Please select at least one language.");
      return;
    }

    // Abort previous if any (though UI prevents it usually, good practice)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    languageResults.setIsLoading(true);

    // Initialize progress
    let completedCount = 0;
    const totalCount = languagesToUse.length;
    setIdentifyProgress({ current: 0, total: totalCount });

    const initialResults: any = {};
    languagesToUse.forEach((lang: string) => {
      initialResults[lang] = { isLoading: true };
    });
    languageResults.setLanguageResults(initialResults);
    languageResults.setAvailableTabs(languagesToUse);
    languageResults.setActiveTab(languagesToUse[0]);
    languageResults.setIsEditing({}); // Reset to view mode for all languages
    try {
      let sharedCommonData: any = null, sharedFileInfo: any = null, commonDataMapped = false;
      const identifyPromises = languagesToUse.map(async (language: string) => {
        try {
          const data = await translationService.identifyObject(imageUpload.file!, language, imageUpload.imageHash, controller.signal);
          if (commonDataMode === 'shared' && !commonDataMapped) {
            commonDataMapped = true;
            sharedCommonData = {
              object_name_en: data.object_name_en, object_category: data.object_category,
              tags: data.tags, field_of_study: data.field_of_study, age_appropriate: data.age_appropriate,
              image_status: data.image_status, object_id: data.object_id, image_base64: data.image_base64,
              flag_object: data.flag_object,
            };
            sharedFileInfo = {
              filename: data.filename, size: data.size, mimeType: data.mime_type, dimensions: data.dimensions,
              updated_at: data.updated_at, updated_by: data.updated_by, created_at: data.created_at, created_by: data.created_by,
            };
            languageResults.setCurrentCommonData(sharedCommonData);
            languageResults.setCurrentFileInfo(sharedFileInfo);
          } else if (commonDataMode === 'per-tab') {
            const languageSpecificCommonData = {
              object_name_en: data.object_name_en, object_category: data.object_category,
              tags: data.tags, field_of_study: data.field_of_study, age_appropriate: data.age_appropriate,
              image_status: data.image_status, object_id: data.object_id, image_base64: data.image_base64,
              flag_object: data.flag_object,
            };
            const languageSpecificFileInfo = {
              filename: data.filename, size: data.size, mimeType: data.mime_type, dimensions: data.dimensions,
              updated_at: data.updated_at, updated_by: data.updated_by, created_at: data.created_at, created_by: data.created_by,
            };
            languageResults.setPerLanguageCommonData(prev => ({ ...prev, [language]: languageSpecificCommonData }));
            languageResults.setPerLanguageFileInfo(prev => ({ ...prev, [language]: languageSpecificFileInfo }));
            if (language === languagesToUse[0]) {
              languageResults.setCurrentCommonData(languageSpecificCommonData);
              languageResults.setCurrentFileInfo(languageSpecificFileInfo);
            }
          }
          languageResults.updateLanguageResult(language, 'object_name', data.object_name);
          languageResults.updateLanguageResult(language, 'object_description', data.object_description);
          languageResults.updateLanguageResult(language, 'object_hint', data.object_hint);
          languageResults.updateLanguageResult(language, 'object_short_hint', data.object_short_hint);
          languageResults.updateLanguageResult(language, 'quiz_qa', data.quiz_qa || []);
          languageResults.updateLanguageResult(language, 'translation_status', data.translation_status);
          languageResults.updateLanguageResult(language, 'translation_id', data.translation_id);
          languageResults.updateLanguageResult(language, 'flag_translation', data.flag_translation);
          languageResults.updateLanguageResult(language, 'isLoading', false);
          languageResults.setSaveStatus(prev => ({ ...prev, [language]: "unsaved" }));
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            return;
          }
          if (err instanceof Error && err.message.includes('400')) {
            setIsRedirecting(true);
            worklist.setError("Inappropriate content. Redirecting..");
            setTimeout(() => window.location.href = '/auth/login', 5000);
            return;
          }
          languageResults.updateLanguageResult(language, 'error', (err as Error).message);
          languageResults.updateLanguageResult(language, 'isLoading', false);
        } finally {
          if (abortControllerRef.current === controller) {
            completedCount++;
            setIdentifyProgress({ current: completedCount, total: totalCount });
          }
        }
      });
      await Promise.all(identifyPromises);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        worklist.setError(`Error: ${(err as Error).message}`);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      languageResults.setIsLoading(false);
      setIdentifyProgress(null);
    }
  };

  const handleFetchWorklist = () => {
    worklist.handleFetchWorklist("ALL", languageResults.selectedLanguages, languageResults.setLanguageResults,
      languageResults.setActiveTab, languageResults.setOriginalResults, languageResults.setOriginalCommonData,
      languageResults.setCurrentCommonData, languageResults.setPerLanguageCommonData,
      languageResults.setPerLanguageFileInfo, languageResults.setCurrentFileInfo, languageResults.setSaveStatus,
      languageResults.setIsEditing, languageResults.setAvailableTabs, languageResults.setSaveMessages
    );
  };

  // Function to show the worklist callout with auto-hide
  const showWorklistHint = useCallback(() => {
    // Show callout when worklist is fetched successfully
    setShowWorklistCallout(true);

    // Clear existing timer if any
    if (worklistCalloutTimerRef.current) {
      clearTimeout(worklistCalloutTimerRef.current);
    }

    // Auto-hide after 5 seconds
    worklistCalloutTimerRef.current = setTimeout(() => {
      setShowWorklistCallout(false);
      worklistCalloutTimerRef.current = null;
    }, 5000);
  }, []);

  const handleThumbnailClick = async (thumbnailIndex: number) => {
    try {
      setLeftPanelView('upload');
      if (recentTranslations.length > thumbnailIndex) {
        const thumb = recentTranslations[thumbnailIndex];
        const filename = thumb.file_info?.filename || thumb.filename;
        const base64 = thumb.object?.image_base64 || thumb.image_base64;
        const language = thumb.translation?.requested_language || thumb.language || thumb.requested_language;
        const imageHash = thumb.object?.image_hash || thumb.image_hash;
        if (!filename || !base64 || !language) {
          worklist.setError('Invalid thumbnail data structure.');
          return;
        }
        await imageUpload.handleThumbnailFile(base64, filename);
        imageUpload.setImageHash(imageHash);
        const fileInfo = thumb.file_info || { filename, size: thumb.size, mime_type: thumb.mime_type, dimensions: thumb.dimensions, updated_at: thumb.updated_at, updated_by: thumb.updated_by, created_at: thumb.created_at, created_by: thumb.created_by };
        languageResults.setPerLanguageFileInfo(prev => ({ ...prev, [language]: { ...fileInfo } }));
        if (language === languageResults.activeTab) languageResults.setCurrentFileInfo({ ...fileInfo });
        languageResults.setIsEditing({ [language]: false });
        languageResults.setSelectedLanguages([language]);
        languageResults.setCurrentCommonData(prev => ({ ...prev, image_base64: base64.split(',')[1] || base64, filename }));
        setPendingIdentify([language]);
      }
    } catch (error) {
      worklist.setError('Failed to process the image.');
    }
  };

  const handleSkip = () => {
    worklist.handleSkip(languageResults.activeTab, languageResults.languageResults,
      (language: string) => worklist.handleFetchWorklist(
        language, languageResults.selectedLanguages, languageResults.setLanguageResults,
        languageResults.setActiveTab, languageResults.setOriginalResults, languageResults.setOriginalCommonData,
        languageResults.setCurrentCommonData, languageResults.setPerLanguageCommonData,
        languageResults.setPerLanguageFileInfo, languageResults.setCurrentFileInfo, languageResults.setSaveStatus,
        languageResults.setIsEditing, languageResults.setAvailableTabs, languageResults.setSaveMessages
      )
    );
  };

  const handleNewFile = (file: File) => {
    languageResults.clearResults();
    worklist.setError(null);
    imageUpload.handleFileChange(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleNewFile(droppedFile);
  };

  const handleCreateStory = () => {
    if (curriculum.selectedPageData?.page_id) {
      curriculum.generateStoryForPage(curriculum.selectedPageData.page_id);
    }
  };

  const currentDataForPanels = getCurrentCommonData(languageResults.activeTab);

  const effectiveLanguageForImageSearch =
    leftPanelView === 'curriculum' && curriculum.activeBook
      ? curriculum.activeBook.language
      : languageForImageSearch;

  const handleAddNewImageFromSearch = useCallback((searchQuery: string) => {
    // 1. Switch view
    setLeftPanelView('upload');

    // 2. Clear existing data
    imageUpload.resetUpload();
    languageResults.clearResults();
    worklist.setError(null);
    setDatabaseImages([]);
    setSearchAttempted(false);
    setSelectedCurriculumNode(null);

    // 3. Pre-fill object name
    languageResults.setCurrentCommonData(prev => ({
      ...DEFAULT_COMMON_DATA,
      object_name_en: searchQuery
    }));

    // 4. Pre-select language from the curriculum book
    if (effectiveLanguageForImageSearch) {
      languageResults.setSelectedLanguages([effectiveLanguageForImageSearch]);
    }
  }, [imageUpload, languageResults, worklist, effectiveLanguageForImageSearch]);

  // DERIVED STATE FOR RIGHT PANEL
  // This ensures the RightPanel gets the most up-to-date page data from the curriculum hook,
  // especially after async operations like story generation, without complex effects.
  const nodeForRightPanel =
    selectedCurriculumNode && 'page_id' in selectedCurriculumNode && curriculum.selectedPageData?.page_id === selectedCurriculumNode.page_id
      ? curriculum.selectedPageData
      : selectedCurriculumNode;

  // NEW: Handle re-identify with context
  const handleReIdentify = async (language: string, additionalContext: string) => {
    if (!imageUpload.file && !imageUpload.imageHash) return;

    languageResults.updateLanguageResult(language, 'isLoading', true);
    languageResults.updateLanguageResult(language, 'error', undefined);

    try {
      // We don't have a controller for this specific single call, or we could add one.
      // For simplicity, passing undefined for signal.
      const data = await translationService.identifyObject(
        imageUpload.file!,
        language,
        imageUpload.imageHash,
        undefined,
        additionalContext
      );

      // Update language specific data
      languageResults.updateLanguageResult(language, 'object_name', data.object_name);
      languageResults.updateLanguageResult(language, 'object_description', data.object_description);
      languageResults.updateLanguageResult(language, 'object_hint', data.object_hint);
      languageResults.updateLanguageResult(language, 'object_short_hint', data.object_short_hint);
      languageResults.updateLanguageResult(language, 'quiz_qa', data.quiz_qa || []);

      // Update common data ONLY if object_flag received is false (not saved yet)
      if (!data.flag_object) {
        languageResults.updateCommonData('object_name_en', data.object_name_en);
        languageResults.updateCommonData('object_category', data.object_category);
        languageResults.updateCommonData('tags', data.tags);
        languageResults.updateCommonData('field_of_study', data.field_of_study);
        languageResults.updateCommonData('age_appropriate', data.age_appropriate);
      }

    } catch (err) {
      languageResults.updateLanguageResult(language, 'error', (err as Error).message);
    } finally {
      languageResults.updateLanguageResult(language, 'isLoading', false);
    }
  };

  // NEW: Handle update image name in curriculum view
  const handleUpdateImageName = (imageHash: string, newName: string) => {
    if (curriculum.selectedPageData?.page_id) {
      curriculum.updateImageName(curriculum.selectedPageData.page_id, imageHash, newName);
    }
  };

  // NEW: Handle update story in curriculum view
  const handleUpdateStory = (newStory: string, newMoral?: string) => {
    if (curriculum.selectedPageData?.page_id) {
      curriculum.updateStory(curriculum.selectedPageData.page_id, newStory, newMoral);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans antialiased transition-colors duration-500">
      <Header
        userContext={userContext}
        onLogout={logout}
        onViewChange={(view) => setLeftPanelView(view)}
      />
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 min-h-[calc(100vh-80px)]">
        <LeftPanel
          leftPanelView={leftPanelView}
          fileInputRef={imageUpload.fileInputRef}
          languageDropdownRef={languageDropdownRef}
          previewUrl={imageUpload.previewUrl}
          currentCommonData={currentDataForPanels}
          selectedLanguages={languageResults.selectedLanguages}
          languageOptions={languageOptions}
          isLanguageDropdownOpen={isLanguageDropdownOpen}
          recentTranslations={recentTranslations}
          searchQuery={searchQuery}
          databaseImages={databaseImages}
          isSearchLoading={isSearchLoading}
          isPopularImagesLoading={isPopularImagesLoading}
          searchAttempted={searchAttempted}
          isLoading={languageResults.isLoading}
          isWorklistLoading={worklist.isLoading}
          isRedirecting={isRedirecting}
          error={imageUpload.error || worklist.error}
          identifyProgress={identifyProgress}
          canUploadPicture={canUploadPicture}
          canIdentifyImage={canIdentifyImage}
          canViewWorkList={canViewWorkList}
          onViewChange={handleLeftPanelViewChange}
          onFileChange={handleNewFile}
          onDrop={handleFileDrop}
          onFileClick={imageUpload.handleClick}
          onLanguageToggle={languageResults.handleLanguageToggle}
          onLanguageDropdownToggle={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          onIdentify={() => handleIdentify()}
          onCancelIdentify={handleCancelIdentify}
          onFetchWorklist={handleFetchWorklist}
          onThumbnailClick={handleThumbnailClick}
          onSearchQueryChange={handleSearchQueryChange}
          onDatabaseSearch={handleDatabaseSearch}
          onFetchPopularImages={handleFetchPopularImages}
          onDatabaseImageClick={handleDatabaseImageClick}
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={handleToggleLeftPanel}
          className={`md:flex-shrink-0 transition-all duration-300 ease-in-out ${isLeftPanelCollapsed ? 'md:w-16 md:flex-none' : 'md:flex-[2_0_0%] min-w-0'}`}
          curriculumProps={curriculum}
          onSelectBook={curriculum.selectBook}
          onSelectPage={curriculum.selectPage}
          onSelectNode={setSelectedCurriculumNode}
          onCollapseAll={curriculum.collapseAll}
          languageForImageSearch={effectiveLanguageForImageSearch}
          notification={curriculum.notification}
          showWorklistCallout={showWorklistCallout}
          onDismissCallout={() => {
            if (worklistCalloutTimerRef.current) {
              clearTimeout(worklistCalloutTimerRef.current);
              worklistCalloutTimerRef.current = null;
            }
            setShowWorklistCallout(false);
          }}
        />

        <MiddlePanel
          leftPanelView={leftPanelView}
          className={`transition-all duration-300 ease-in-out ${isLeftPanelCollapsed ? 'md:flex-[3_0_0%] min-w-0' : 'md:flex-[5_0_0%] min-w-0'}`}

          // Upload view props
          previewUrl={imageUpload.previewUrl}
          currentCommonData={currentDataForPanels}
          activeTab={languageResults.activeTab}
          availableTabs={languageResults.availableTabs}
          languageResults={languageResults.languageResults}
          selectedLanguages={languageResults.selectedLanguages}
          saveStatus={languageResults.saveStatus}
          saveMessages={languageResults.saveMessages}
          isEditing={languageResults.isEditing}
          isSaving={languageResults.isSaving}
          isWorklistLoading={worklist.isLoading}
          permissions={{ canSwitchToEditMode, canSaveToDatabase, canReleaseToDatabase, canVerifyData, canApproveData, canRejectData, canSkiptData }}
          onTabChange={languageResults.setActiveTab}
          onRemoveTab={languageResults.removeLanguageTab}
          onUpdateLanguageResult={languageResults.updateLanguageResult}
          onSave={(action: string) => {
            // Check if action is one of the approved ones for showing the hint
            const shouldShowHint = ['approveData', 'verifyData', 'rejectData'].includes(action);
            languageResults.handleQuickSave(
              action,
              imageUpload.file ?? undefined,
              userContext?.username,
              imageUpload.imageHash,
              shouldShowHint ? showWorklistHint : undefined
            );
          }}
          onSkip={handleSkip}
          onToggleEdit={languageResults.toggleEdit}

          // Curriculum view props
          activeBook={curriculum.activeBook}
          isLoading={curriculum.isLoading}
          selectedPageData={curriculum.selectedPageData}
          onCurriculumImageDoubleClick={handleCurriculumImageDoubleClick}
          languageForImageSearch={effectiveLanguageForImageSearch}
          onAddImageToCurriculumPage={curriculum.addImageToPage}
          onRemoveImageFromCurriculumPage={curriculum.removeImageFromPage}
          onAddNewImageFromSearch={handleAddNewImageFromSearch}
          isStoryLoading={curriculum.isStoryLoading}
          onCreateStory={handleCreateStory}
          onGenerateStory={curriculum.generateStoryForPage}
          onReorderImagesOnPage={curriculum.reorderImagesOnPage}
          imageLoadingProgress={curriculum.imageLoadingProgress}
          onUpdateImageName={handleUpdateImageName}
          onReIdentify={handleReIdentify}
          isDirty={curriculum.isDirty}
          onSaveBook={curriculum.saveBook}
        />

        <RightPanel
          leftPanelView={leftPanelView}
          selectedCurriculumNode={nodeForRightPanel}
          currentCommonData={currentDataForPanels}
          currentFileInfo={getCurrentFileInfo(languageResults.activeTab)}
          activeTab={languageResults.activeTab}
          isEditing={languageResults.isEditing}
          languageResults={languageResults.languageResults}
          commonDataMode={commonDataMode}
          permissions={{ canSwitchToEditMode }}
          onUpdateCommonData={languageResults.updateCommonData}
          className={`transition-all duration-300 ease-in-out ${isLeftPanelCollapsed ? 'md:flex-[2_0_0%] min-w-0' : 'md:flex-[3_0_0%] min-w-0'}`}
          showContent={Object.keys(languageResults.languageResults).length > 0 || !!selectedCurriculumNode}
          isDirty={curriculum.isDirty}
          onSaveBook={curriculum.saveBook}
          isStoryLoading={curriculum.isStoryLoading}
          onUpdateStory={handleUpdateStory}
        />
      </main>
    </div>
  );
};