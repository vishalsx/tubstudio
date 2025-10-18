// Permission-based mode determination integrated with MainApp.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/layout/Header';
import { LeftPanel } from '../components/panels/LeftPanel';
import { MiddlePanel } from '../components/panels/MiddlePanel';
import { RightPanel } from '../components/panels/RightPanel';
import { useAuth } from '../hooks/useAuth';
import { useImageUpload } from '../hooks/useImageUpload';
import { useLanguageResults } from '../hooks/useLanguageResults';
import { useWorklist } from '../hooks/useWorklist';
import { translationService } from '../services/translation.service';
import { canPerformUiAction, METADATA, LANGUAGE, RETURN_PERMISSION_ACTION } from '../utils/permissions/hasPermissions';
import { PermissionCheck, UserContext, DatabaseImage } from '../types';
import { formatFileSize } from '../utils/imageUtils';
// FIX: Import DEFAULT_FILE_INFO to use as a fallback.
import { UI_MESSAGES, DEFAULT_FILE_INFO, DEFAULT_COMMON_DATA } from '../utils/constants';

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
    fetchRecentTranslations,
    recentTranslations
  } = authData;
  
  const imageUpload = useImageUpload();
  const languageResults = useLanguageResults();
  const worklist = useWorklist();

  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  
  // New states for Database View
  const [leftPanelView, setLeftPanelView] = useState<'upload' | 'database'>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [databaseImages, setDatabaseImages] = useState<DatabaseImage[]>([]);
  const [isPopularImagesLoading, setIsPopularImagesLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [pendingIdentify, setPendingIdentify] = useState<string[] | null>(null);

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
  const canSwitchToReleaseEditMode = makeActionChecks("switchToReleaseEditMode", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canSaveToDatabase = makeActionChecks("saveToDatabase", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canReleaseToDatabase = makeActionChecks("releaseToDatabase", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canViewWorkList = makeActionChecks("viewWorkListWindow", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canIdentifyImage = makeActionChecks("identifyImage", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canVerifyData = makeActionChecks("verifyData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canApproveData = makeActionChecks("approveData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canRejectData = makeActionChecks("rejectData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);
  const canSkiptData = makeActionChecks("skipData", currentMetadataState, currentLanguageState[languageResults.activeTab] ?? null);

  // NEW: Permission-based mode determination
  // Determine mode based on permissions
  const getDataMode = (): 'shared' | 'per-tab' => {
    const hasIdentifyPermission = canIdentifyImage.metadata || canIdentifyImage.language;
    const hasUploadPermission = canUploadPicture.metadata || canUploadPicture.language;
    
    return (hasIdentifyPermission && hasUploadPermission) ? 'shared' : 'per-tab';
  };
  
  const commonDataMode = getDataMode();

  // NEW: Sync mode with the hook whenever it changes
useEffect(() => {
  languageResults.setCommonDataMode(commonDataMode);
}, [commonDataMode]);


  // NEW: Utility functions to get data based on mode
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
      // FIX: Return a default FileInfo object instead of an empty one to match the FileInfo type.
      return languageResults.perLanguageFileInfo?.[activeTab] || DEFAULT_FILE_INFO;
    }
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (imageUpload.error) {
      const timer = setTimeout(() => {
        imageUpload.clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [imageUpload.error]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageDropdownOpen]);

  // Robustly handle auto-identification after state updates
  useEffect(() => {
    const languagesReady =
      pendingIdentify &&
      pendingIdentify.length > 0 &&
      languageResults.selectedLanguages.length === pendingIdentify.length &&
      pendingIdentify.every(lang =>
        languageResults.selectedLanguages.includes(lang)
      );
  
    if (languagesReady) {
      handleIdentify(pendingIdentify);
      setPendingIdentify(null); // Reset the trigger
    }
  }, [pendingIdentify, languageResults.selectedLanguages]);

  // Handlers for Database View
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
  };

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
        dimensions: '', 
        created_by: '',
        updated_by: '',
      },
      common_data: {
        object_name_en: item.poolImage.object_name_en,
        object_category: "",
        tags: [],
        field_of_study: "",
        age_appropriate: "",
        image_status: "",
        object_id: item.poolImage.object_id || "",
        image_base64: "",
        flag_object: false
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
    setIsSearchLoading(true);
    try {
      const poolImagesData = await translationService.fetchPopularImages(query);
      processPoolImagesResponse(poolImagesData);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      worklist.setError((error as Error).message || UI_MESSAGES.ERRORS.SOMETHING_WRONG);
      setDatabaseImages([]);
    } finally {
      setIsSearchLoading(false);
    }
  };
  
  const handleFetchPopularImages = async () => {
    worklist.setError(null);
    setIsPopularImagesLoading(true);
    try {
      const popularImagesData = await translationService.fetchPopularImages();
      processPoolImagesResponse(popularImagesData);
    } catch (error) {
      console.error("Failed to fetch popular images:", error);
      worklist.setError((error as Error).message || UI_MESSAGES.ERRORS.SOMETHING_WRONG);
      setDatabaseImages([]);
    } finally {
      setIsPopularImagesLoading(false);
    }
  };

  const handleDatabaseImageClick = async (image: DatabaseImage) => {
    // 1. Reset current state
    imageUpload.resetUpload();
    languageResults.clearResults();
  
    const { object, file_info, common_data } = image;
    const base64 = object.image_base64;
    const filename = file_info.filename;
    const imageHash = object.image_hash;
  
    // 2. Load the new image as if it were uploaded
    await imageUpload.handleThumbnailFile(base64, filename);
    imageUpload.setImageHash(imageHash);
    
    // 3. Populate the data panels
    languageResults.setCurrentCommonData({
      ...common_data,
      image_base64: base64,
    });
    languageResults.setCurrentFileInfo(file_info);
    
    // 4. Switch back to upload view to see the selected image
    setLeftPanelView('upload');
  
    // 5. Set languages and trigger auto-identify
    const languagesToIdentify = image.untranslated_languages || [];
    if (languagesToIdentify.length > 0) {
      languageResults.setSelectedLanguages(languagesToIdentify);
      setPendingIdentify(languagesToIdentify); // Use the robust trigger
    }
  };

  // UPDATED: handleIdentify with permission-based mode logic
  const handleIdentify = async (languagesOverride?: string[]) => {
    const languagesToUse = languagesOverride || languageResults.selectedLanguages;
    
    languageResults.setSaveMessages({});
    setIsLanguageDropdownOpen(false);
    worklist.setError(null);

    console.log("handleIdentify called, current file state:", imageUpload.file);
    console.log("Data mode:", commonDataMode);
    
    if (!imageUpload.file && !imageUpload.imageHash) {
      console.error("No file or image_hash found in state!");
      worklist.setError("Please upload an image or provide an image hash.");
      return;
    }
    
    if (languagesToUse.length === 0) {
      worklist.setError("Please select at least one language.");
      return;
    }

    languageResults.setIsLoading(true);

    // Initialize placeholders
    const initialResults: any = {};
    languagesToUse.forEach((lang: string) => {
      initialResults[lang] = {
        object_name: "",
        object_description: "",
        object_hint: "",
        object_short_hint: "",
        translation_status: "",
        translation_id: "",
        isLoading: true,
        flag_translation: false
      };
    });
    
    languageResults.setLanguageResults(initialResults);
    languageResults.setAvailableTabs(languagesToUse);
    languageResults.setActiveTab(languagesToUse[0]);
    languageResults.setIsDatabaseView(
      languagesToUse.reduce((acc: { [key: string]: boolean }, lang: string) => {
        acc[lang] = true;
        return acc;
      }, {} as { [key: string]: boolean })
    );

    try {
      let sharedCommonData: any = null;
      let sharedFileInfo: any = null;
      let commonDataMapped = false;

      const identifyPromises = languagesToUse.map(async (language: string) => {
        try {
          const data = await translationService.identifyObject(
            imageUpload.file!,
            language,
            imageUpload.imageHash
          );

          console.log("Backend response for", language, data);

          // Handle common data based on mode
          if (commonDataMode === 'shared' && !commonDataMapped) {
            // Shared mode: set common data once from first response
            commonDataMapped = true;
            sharedCommonData = {
              object_name_en: data.object_name_en || "",
              object_category: data.object_category || "",
              tags: data.tags || [],
              field_of_study: data.field_of_study || "",
              age_appropriate: data.age_appropriate || "",
              image_status: data.image_status || "",
              object_id: data.object_id || "",
              image_base64: data.image_base64 || "",
              flag_object: data.flag_object || false,
            };

            sharedFileInfo = {
              filename: data.filename || "",
              size: data.size || "",
              mimeType: data.mime_type || "",
              dimensions: data.dimensions || "",
              updated_at: data.updated_at || "",
              updated_by: data.updated_by || "",
              created_at: data.created_at || "",
              created_by: data.created_by || "",
            };

            // Set shared data once
            languageResults.setCurrentCommonData(sharedCommonData);
            languageResults.setCurrentFileInfo(sharedFileInfo);
            
          } else if (commonDataMode === 'per-tab') {
            // Per-tab mode: set individual common data for each language
            const languageSpecificCommonData = {
              object_name_en: data.object_name_en || "",
              object_category: data.object_category || "",
              tags: data.tags || [],
              field_of_study: data.field_of_study || "",
              age_appropriate: data.age_appropriate || "",
              image_status: data.image_status || "",
              object_id: data.object_id || "",
              image_base64: data.image_base64 || "",
              flag_object: data.flag_object || false,
            };

            const languageSpecificFileInfo = {
              filename: data.filename || "",
              size: data.size || "",
              mimeType: data.mime_type || "",
              dimensions: data.dimensions || "",
              updated_at: data.updated_at || "",
              updated_by: data.updated_by || "",
              created_at: data.created_at || "",
              created_by: data.created_by || "",
            };

            languageResults.setPerLanguageCommonData((prev) => ({
              ...prev,
              [language]: languageSpecificCommonData
            }));

            languageResults.setPerLanguageFileInfo((prev) => ({
              ...prev,
              [language]: languageSpecificFileInfo
            }));

            // Set current data if this is the active tab
            if (language === languagesToUse[0]) {
              languageResults.setCurrentCommonData(languageSpecificCommonData);
              languageResults.setCurrentFileInfo(languageSpecificFileInfo);
            }
          }

          // Update language-specific results (always needed)
          languageResults.setLanguageResults((prev) => ({
            ...prev,
            [language]: {
              object_name: data.object_name || "",
              object_description: data.object_description || "",
              object_hint: data.object_hint || "",
              object_short_hint: data.object_short_hint || "",
              translation_status: data.translation_status || "",
              translation_id: data.translation_id || "",
              isLoading: false,
              flag_translation: data.flag_translation || false
            },
          }));

          languageResults.setSaveStatus((prev) => ({ ...prev, [language]: "unsaved" }));
          
        } catch (err) {
          if (err instanceof Error && err.message.includes('400')) {
            setIsRedirecting(true);
            worklist.setError("Inappropriate content. Redirecting..");
            setTimeout(() => window.location.href = '/auth/login', 5000);
            return;
          }

          languageResults.setLanguageResults((prev) => ({
            ...prev,
            [language]: {
              object_name: "",
              object_description: "",
              object_hint: "",
              object_short_hint: "",
              translation_status: "",
              translation_id: "",
              isLoading: false,
              error: (err as Error).message,
              flag_translation: false,
            },
          }));
          worklist.setError(`Error: ${(err as Error).message}`);
        }
      });

      imageUpload.setImageHash(null);
      await Promise.all(identifyPromises);

    } catch (err) {
      worklist.setError(`Error: ${(err as Error).message}`);
      logout();
    } finally {
      languageResults.setIsLoading(false);
    }
  };

  // handleFetchWorklist remains the same - mode is determined by permissions
  const handleFetchWorklist = () => {
    worklist.handleFetchWorklist(
      "ALL",
      languageResults.selectedLanguages,
      languageResults.setLanguageResults,
      languageResults.setActiveTab,
      languageResults.setOriginalResults,
      languageResults.setOriginalCommonData,
      languageResults.setCurrentCommonData,
      languageResults.setPerLanguageCommonData,
      languageResults.setPerLanguageFileInfo,
      languageResults.setCurrentFileInfo,
      languageResults.setSaveStatus,
      languageResults.setIsEditing,
      languageResults.setAvailableTabs,
      languageResults.setSaveMessages
    );
  };

  // Other handlers remain the same
  const handleThumbnailClick = async (thumbnailIndex: number) => {
    try {
      // Switch to upload view whenever a thumbnail is clicked
      setLeftPanelView('upload');
      
      if (recentTranslations.length > 0 && thumbnailIndex < recentTranslations.length) {
        const selectedThumbnail = recentTranslations[thumbnailIndex];
        
        const filename = selectedThumbnail.file_info?.filename || selectedThumbnail.filename;
        const base64 = selectedThumbnail.object?.image_base64 || selectedThumbnail.image_base64;
        const language = selectedThumbnail.translation?.requested_language || selectedThumbnail.language || selectedThumbnail.requested_language;
        const imageHash = selectedThumbnail.object?.image_hash || selectedThumbnail.image_hash;

        if (!filename || !base64 || !language) {
          console.error('Missing required thumbnail data:', { filename, base64: !!base64, language });
          worklist.setError('Invalid thumbnail data structure.');
          return;
        }

        await imageUpload.handleThumbnailFile(base64, filename);
        
        imageUpload.setImageHash(imageHash);

        const fileInfo = selectedThumbnail.file_info || {
          filename,
          size: selectedThumbnail.size || '',
          mime_type: selectedThumbnail.mime_type || '',
          dimensions: selectedThumbnail.dimensions || '',
          updated_at: selectedThumbnail.updated_at || '',
          updated_by: selectedThumbnail.updated_by || '',
          created_at: selectedThumbnail.created_at || '',
          created_by: selectedThumbnail.created_by || '',
        };

        languageResults.setPerLanguageFileInfo(prev => ({
          ...prev,
          [language]: {
            filename: fileInfo.filename,
            size: fileInfo.size,
            mimeType: fileInfo.mime_type,
            dimensions: fileInfo.dimensions,
            updated_at: fileInfo.updated_at,
            updated_by: fileInfo.updated_by,
            created_at: fileInfo.created_at,
            created_by: fileInfo.created_by,
          }
        }));
        
        if (language === languageResults.activeTab) {
          languageResults.setCurrentFileInfo({
            filename: fileInfo.filename,
            size: fileInfo.size,
            mimeType: fileInfo.mime_type,
            dimensions: fileInfo.dimensions,
            updated_at: fileInfo.updated_at,
            updated_by: fileInfo.updated_by,
            created_at: fileInfo.created_at,
            created_by: fileInfo.created_by,
          });
        }

        const newEditingState: { [key: string]: boolean } = {};
        newEditingState[language] = false;
        
        languageResults.setIsEditing(newEditingState);
        languageResults.setSelectedLanguages([language]);
        languageResults.setCurrentCommonData((prev: any) => ({
          ...prev,
          image_base64: base64.includes(',') ? base64.split(',')[1] : base64,
          filename,
        }));
        
        // Use the robust trigger instead of setTimeout
        setPendingIdentify([language]);
      }
    } catch (error) {
      console.error('Error handling thumbnail:', error);
      worklist.setError('Failed to process the image.');
    }
  };

  const handleSkip = () => {
    worklist.handleSkip(
      languageResults.activeTab,
      languageResults.languageResults,
      (language: string) => worklist.handleFetchWorklist(
        language,
        languageResults.selectedLanguages,
        languageResults.setLanguageResults,
        languageResults.setActiveTab,
        languageResults.setOriginalResults,
        languageResults.setOriginalCommonData,
        languageResults.setCurrentCommonData,
        languageResults.setPerLanguageCommonData,
        languageResults.setPerLanguageFileInfo,
        languageResults.setCurrentFileInfo,
        languageResults.setSaveStatus,
        languageResults.setIsEditing,
        languageResults.setAvailableTabs,
        languageResults.setSaveMessages
      )
    );
  };
  
  const onToggleEdit = async (tab: string) => {
    const currentTab = tab;
    
    if (languageResults.isEditing[currentTab]) {
      if (currentTab === 'English') {
        languageResults.setCurrentCommonData(languageResults.originalCommonData);
      }
      languageResults.setLanguageResults(prev => ({
        ...prev,
        [currentTab]: languageResults.originalResults[currentTab] || prev[currentTab]
      }));
      languageResults.setIsEditing(prev => ({ ...prev, [currentTab]: false }));
      return;
    }
  
    languageResults.setIsEditing(prev => ({ ...prev, [currentTab]: true }));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFFFF] via-[#E6F7FC] to-[#FDE6E0] text-gray-900 font-sans antialiased">
      <Header userContext={userContext} onLogout={logout} />
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <LeftPanel
          // View state
          leftPanelView={leftPanelView}
          onViewChange={setLeftPanelView}
          
          // File upload props
          file={imageUpload.file}
          previewUrl={imageUpload.previewUrl}
          currentCommonData={getCurrentCommonData(languageResults.activeTab)}
          fileInputRef={imageUpload.fileInputRef}
          languageDropdownRef={languageDropdownRef}
          // Language selection props
          selectedLanguages={languageResults.selectedLanguages}
          languageOptions={languageOptions}
          isLanguageDropdownOpen={isLanguageDropdownOpen}
          // Recent translations
          recentTranslations={recentTranslations}
          
          // Database search props
          searchQuery={searchQuery}
          databaseImages={databaseImages}

          // Loading and error states
          isLoading={languageResults.isLoading}
          isWorklistLoading={worklist.isLoading}
          isRedirecting={isRedirecting}
          isPopularImagesLoading={isPopularImagesLoading}
          isSearchLoading={isSearchLoading}
          error={imageUpload.error || worklist.error}
          
          // Permissions (using the correct index values)
          canUploadPicture={canUploadPicture}
          canIdentifyImage={canIdentifyImage}
          canViewWorkList={canViewWorkList}
          
          // Event handlers
          onFileChange={imageUpload.handleFileChange}
          onDrop={imageUpload.handleDrop}
          onFileClick={imageUpload.handleClick}
          onLanguageToggle={languageResults.handleLanguageToggle}
          onLanguageDropdownToggle={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          onIdentify={() => handleIdentify()}
          onFetchWorklist={handleFetchWorklist}
          onThumbnailClick={handleThumbnailClick}
          onSearchQueryChange={handleSearchQueryChange}
          onDatabaseSearch={handleDatabaseSearch}
          onFetchPopularImages={handleFetchPopularImages}
          onDatabaseImageClick={handleDatabaseImageClick}
          
          // Collapse functionality
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={handleToggleLeftPanel}
          className={`transition-all duration-300 ease-in-out ${isLeftPanelCollapsed ? 'md:w-16' : 'md:w-1/3'}`}
        />
        
        <MiddlePanel
          activeTab={languageResults.activeTab}
          availableTabs={languageResults.availableTabs}
          languageResults={languageResults.languageResults}
          selectedLanguages={languageResults.selectedLanguages}
          saveStatus={languageResults.saveStatus}
          saveMessages={languageResults.saveMessages}
          isEditing={languageResults.isEditing}
          isSaving={languageResults.isSaving}
          permissions={{
            canSwitchToEditMode,
            canSaveToDatabase,
            canReleaseToDatabase,
            canVerifyData,
            canApproveData,
            canRejectData,
            canSkiptData
          }}
          onTabChange={languageResults.setActiveTab}
          onRemoveTab={languageResults.removeLanguageTab}
          onUpdateLanguageResult={languageResults.updateLanguageResult}
          onSave={(action: string) => languageResults.handleQuickSave(action, imageUpload.file ?? undefined, userContext?.username)}
          onSkip={handleSkip}
          onToggleEdit={onToggleEdit}
          className={`transition-all duration-300 ease-in-out ${isLeftPanelCollapsed ? 'md:w-1/2' : 'md:w-1/3'}`}
        />
        
        <RightPanel
          currentCommonData={getCurrentCommonData(languageResults.activeTab)}
          currentFileInfo={getCurrentFileInfo(languageResults.activeTab)}
          activeTab={languageResults.activeTab}
          isEditing={languageResults.isEditing}
          languageResults={languageResults.languageResults}
          commonDataMode={commonDataMode} // NEW: Pass mode to RightPanel
          permissions={{
            canSwitchToEditMode
          }}
          onUpdateCommonData={languageResults.updateCommonData}
          className={`transition-all duration-300 ease-in-out ${isLeftPanelCollapsed ? 'md:w-1/2' : 'md:w-1/3'}`}
        />
      </main>
    </div>
  );
};