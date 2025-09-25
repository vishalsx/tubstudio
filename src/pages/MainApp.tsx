// pages/MainApp.tsx
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
import { PermissionCheck, UserContext } from '../types';
import { UI_MESSAGES } from '../utils/constants';

// Define the props interface for MainApp
interface MainAppProps {
  authData: {
    isLoggedIn: boolean;
    userContext: UserContext | null;
    loginError: string | null;
    languageOptions: string[];
    isRedirecting: boolean;
    setIsRedirecting: (value: boolean) => void;
    login: (username: string, password: string) => Promise<UserContext>;
    logout: () => void;
    fetchRecentTranslations: (username: string) => Promise<any[]>;
  };
}

export const MainApp: React.FC<MainAppProps> = ({ authData }) => {
  // Extract auth data from props
  const {
    userContext,
    languageOptions,
    isRedirecting,
    setIsRedirecting,
    logout,
    fetchRecentTranslations
  } = authData;
  
  const imageUpload = useImageUpload();
  const languageResults = useLanguageResults();
  const worklist = useWorklist();

  // Local state
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // Permission checks
  const currentMetadataState = languageResults.currentCommonData?.image_status || "";
  const currentLanguageState: { [key: string]: string | null } = Object.fromEntries(
    Object.entries(languageResults.languageResults).map(([tab, result]) => {
      const raw = result?.translation_status;
      const normalized = raw === "" || raw === undefined || raw === "null" ? null : raw;
      return [tab, normalized];
    })
  );

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

  // Permission checks using your actual permission system
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

  // Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear error after 3 seconds
  useEffect(() => {
    if (imageUpload.error) {
      const timer = setTimeout(() => {
        imageUpload.clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [imageUpload.error]);

  // Handle thumbnail update trigger
  useEffect(() => {
    if (imageUpload.file && imageUpload.isThumbnailUpdate) {
      console.log('useEffect: Thumbnail update detected, calling handleIdentify');
      handleIdentify();
      imageUpload.setIsThumbnailUpdate(false);
    }
  }, [imageUpload.file, imageUpload.isThumbnailUpdate]);

  // Event Handlers
  const handleIdentify = async () => {
    languageResults.setSaveMessages({});
    setIsLanguageDropdownOpen(false);
    worklist.setError(null);

    console.log("handleIdentify called, current file state:", imageUpload.file);
    console.log("File is:", imageUpload.file ? "PRESENT" : "NULL/UNDEFINED");
    
    if (!imageUpload.file && !imageUpload.imageHash) {
      console.error("No file or image_hash found in state!");
      worklist.setError("Please upload an image or provide an image hash.");
      return;
    }
    
    if (languageResults.selectedLanguages.length === 0) {
      worklist.setError("Please select at least one language.");
      return;
    }

    languageResults.setIsLoading(true);

    // Initialize placeholders
    const initialResults: any = {};
    languageResults.selectedLanguages.forEach((lang: string) => {
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
    languageResults.setAvailableTabs(languageResults.selectedLanguages);
    languageResults.setActiveTab(languageResults.selectedLanguages[0]);
    languageResults.setIsDatabaseView(
    languageResults.selectedLanguages.reduce((acc: { [key: string]: boolean }, lang: string) => {
        acc[lang] = true;
        return acc;
      }, {} as { [key: string]: boolean })
    );

    try {
      let commonDataMapped = false;
      let sharedCommonData: any = null;

      const identifyPromises = languageResults.selectedLanguages.map(async (language: string) => {
        try {
          const data = await translationService.identifyObject(
            imageUpload.file!,
            language,
            imageUpload.imageHash
          );

          console.log("Backend response for", language, data);

          // Set common data once only
          if (!commonDataMapped) {
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

            // Set file info for ALL languages using the same shared data
            const sharedFileInfo = {
              filename: data.filename || "",
              size: data.size || "",
              mimeType: data.mime_type || "",
              dimensions: data.dimensions || "",
              updated_at: data.updated_at || "",
              updated_by: data.updated_by || "",
              created_at: data.created_at || "",
              created_by: data.created_by || "",
            };

            // Set file info for all selected languages
            const fileInfoForAllLanguages = languageResults.selectedLanguages.reduce((acc: { [key: string]: any }, lang: string) => {
              acc[lang] = { ...sharedFileInfo };
              return acc;
            }, {} as { [key: string]: any });

            languageResults.setPerLanguageFileInfo(fileInfoForAllLanguages);
            languageResults.setCurrentFileInfo(sharedFileInfo);
            languageResults.setCurrentCommonData(sharedCommonData);
            
            // Set common data for ALL languages using the same shared data
            const commonDataForAllLanguages = languageResults.selectedLanguages.reduce((acc: { [key: string]: any }, lang: string) => {
              acc[lang] = { ...sharedCommonData };
              return acc;
            }, {} as { [key: string]: any });
            
            languageResults.setPerLanguageCommonData(commonDataForAllLanguages);
          }

          // Update this language tab
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
          // Check for specific error responses
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

      // Reset image hash after use
      imageUpload.setImageHash(null);
      
      await Promise.all(identifyPromises);

    } catch (err) {
      worklist.setError(`Error: ${(err as Error).message}`);
      logout();
    } finally {
      languageResults.setIsLoading(false);
    }
  };

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

  const handleThumbnailClick = async (thumbnailIndex: number) => {
    try {
      if (worklist.recentTranslations.length > 0 && thumbnailIndex < worklist.recentTranslations.length) {
        const selectedThumbnail = worklist.recentTranslations[thumbnailIndex];
        const filename = selectedThumbnail.file_info.filename;
        const base64 = selectedThumbnail.object.image_base64;

        // Create File object from base64
        const newFile = await imageUpload.handleThumbnailFile(base64, filename);

        // Give handleFileChange time to update the state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const language = selectedThumbnail.translation.requested_language;
        imageUpload.setImageHash(selectedThumbnail.object.image_hash);

        // Update file info for this language
        languageResults.setPerLanguageFileInfo(prev => ({
          ...prev,
          [language]: {
            filename: selectedThumbnail.file_info.filename,
            size: selectedThumbnail.file_info.size,
            mimeType: selectedThumbnail.file_info.mime_type,
            dimensions: selectedThumbnail.file_info.dimensions,
            updated_at: selectedThumbnail.file_info.updated_at,
            updated_by: selectedThumbnail.file_info.updated_by,
            created_at: selectedThumbnail.file_info.created_at,
            created_by: selectedThumbnail.file_info.created_by,
          }
        }));
        
        // Also update current file info if this is for the active tab
        if (language === languageResults.activeTab) {
          languageResults.setCurrentFileInfo({
            filename: selectedThumbnail.file_info.filename,
            size: selectedThumbnail.file_info.size,
            mimeType: selectedThumbnail.file_info.mime_type,
            dimensions: selectedThumbnail.file_info.dimensions,
            updated_at: selectedThumbnail.file_info.updated_at,
            updated_by: selectedThumbnail.file_info.updated_by,
            created_at: selectedThumbnail.file_info.created_at,
            created_by: selectedThumbnail.file_info.created_by,
          });
        }

        // Update other states
        const newEditingState: { [key: string]: boolean } = {};
        newEditingState[language] = false;
        
        languageResults.setIsEditing(newEditingState);
        languageResults.setSelectedLanguages([language]);
        languageResults.setCurrentCommonData((prev: any) => ({
          ...prev,
          image_base64: base64.includes(',') ? base64.split(',')[1] : base64,
          filename,
        }));
        imageUpload.setIsThumbnailUpdate(true);
      }
      
      // Wait for state to settle
      await new Promise(resolve => setTimeout(resolve, 100));

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
    // const currentTab = languageResults.activeTab;
    const currentTab = tab;
    
    if (languageResults.isEditing[currentTab]) {
      // Toggle back to view mode and discard changes for current tab
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
  
    // Switch to edit mode for current tab only
    languageResults.setIsEditing(prev => ({ ...prev, [currentTab]: true }));
    // if (previewUrl && !imageHash) {
    //   const hash = await generateImageHash(previewUrl);
    //   setImageHash(hash);
    // }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFFFF] via-[#E6F7FC] to-[#FDE6E0] text-gray-900 font-sans antialiased">
      <Header userContext={userContext} onLogout={logout} />
      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <LeftPanel
          file={imageUpload.file}
          previewUrl={imageUpload.previewUrl}
          currentCommonData={languageResults.currentCommonData}
          fileInputRef={imageUpload.fileInputRef}
          selectedLanguages={languageResults.selectedLanguages}
          languageOptions={languageOptions}
          isLanguageDropdownOpen={isLanguageDropdownOpen}
          recentTranslations={worklist.recentTranslations}
          isLoading={languageResults.isLoading}
          isRedirecting={isRedirecting}
          error={imageUpload.error || worklist.error}
          canUploadPicture={canUploadPicture}
          canIdentifyImage={canIdentifyImage}
          canViewWorkList={canViewWorkList}
          onFileChange={imageUpload.handleFileChange}
          onDrop={imageUpload.handleDrop}
          onFileClick={imageUpload.handleClick}
          onLanguageToggle={languageResults.handleLanguageToggle}
          onLanguageDropdownToggle={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
          onIdentify={handleIdentify}
          onFetchWorklist={handleFetchWorklist}
          onThumbnailClick={handleThumbnailClick}
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
        />
        
        <RightPanel
          currentCommonData={languageResults.currentCommonData}
          currentFileInfo={languageResults.currentFileInfo}
          activeTab={languageResults.activeTab}
          isEditing={languageResults.isEditing}
          languageResults={languageResults.languageResults}
          permissions={{
            canSwitchToEditMode
          }}
          onUpdateCommonData={languageResults.updateCommonData}
        />
      </main>
    </div>
  );
};
  
  


